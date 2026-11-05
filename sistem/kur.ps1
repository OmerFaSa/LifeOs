# LifeOS - tek komutla kurulum (Windows). Yeni bilgisayarda PowerShell'e yapistir:
#
#   irm https://raw.githubusercontent.com/OmerFaSa/LifeOs/main/sistem/kur.ps1 | iex
#
# Yapar: Python ve Git yoksa kurar (winget), LifeOS'u %USERPROFILE%\LifeOS-Sistem'e indirir,
# masaustu uygulamasini kurar, kisayol koyar, tasima paketi bulursa sorar, uygulamayi acar.
# Yeniden calistirmak guvenlidir: var olani gunceller, kayitlara dokunmaz.
# Dosya BOM'suz UTF-8 kalmali: BOM 'irm | iex' yolunu bozar (ilk satir komut sanilir).
# Ayrinti: belgeler/UYGULAMA.md (Yeni bilgisayar). Test icin LIFEOS_KUR_* degiskenleri.

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}

$Depo    = if ($env:LIFEOS_KUR_DEPO) { $env:LIFEOS_KUR_DEPO } else { 'https://github.com/OmerFaSa/LifeOs.git' }
$Hedef   = if ($env:LIFEOS_KUR_HEDEF) { $env:LIFEOS_KUR_HEDEF } else { Join-Path $env:USERPROFILE 'LifeOS-Sistem' }
$Uyg     = if ($env:LIFEOS_KUR_UYGULAMA) { $env:LIFEOS_KUR_UYGULAMA } else { Join-Path $env:LOCALAPPDATA 'Programs\LifeOS' }
$Kisayol = if ($env:LIFEOS_KUR_KISAYOL) { $env:LIFEOS_KUR_KISAYOL } else { [Environment]::GetFolderPath('Desktop') }
$ElectronSurum = '44.4.5'

function Yaz($m) { Write-Host "  $m" }

function Yol-Tazele {
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + $env:Path
}

# cmd ile: Windows'un sahte python'u magazayi acar ve hata kodu doner; PowerShell onu bulmus sanmasin.
function Var-Mi($komut) {
    cmd /c "$komut >nul 2>&1"
    return $LASTEXITCODE -eq 0
}

function Python-Bul {
    if (Var-Mi 'py -3 --version') { return @('py', '-3') }
    if (Var-Mi 'python --version') { return @('python') }
    return $null
}

function Winget-Kur($kimlik, $ad) {
    if (-not (Var-Mi 'winget --version')) {
        throw "$ad gerekli ama bu Windows'ta winget yok. $ad'u elle kurup bu komutu yeniden çalıştır."
    }
    Yaz "$ad kuruluyor (Windows onay sorabilir)..."
    winget install --id $kimlik -e --silent --accept-package-agreements --accept-source-agreements | Out-Null
    Yol-Tazele
}

Write-Host "`nLifeOS kurulumu`n"

# 1. Python ve Git
$python = Python-Bul
if (-not $python) {
    Winget-Kur 'Python.Python.3.12' 'Python'
    $python = Python-Bul
    if (-not $python) { throw 'Python kurulamadı. python.org üzerinden kurup bu komutu yeniden çalıştır.' }
}
if (-not (Var-Mi 'git --version')) {
    Winget-Kur 'Git.Git' 'Git'
    if (-not (Var-Mi 'git --version')) { throw 'Git kurulamadı. git-scm.com üzerinden kurup bu komutu yeniden çalıştır.' }
}
Yaz 'Python ve Git hazır.'

function Python-Kos {
    $on = @($python | Select-Object -Skip 1)
    # Out-Host: cikti ekrana gitsin, donus degerine karismasin.
    & $python[0] @on @args | Out-Host
    return $LASTEXITCODE
}

# 2. LifeOS'un kendisi. Gecmis indirilmez: yuzlerce megabayt daha az.
$env:PYTHONUTF8 = '1'
if (Test-Path (Join-Path $Hedef '.git')) {
    Yaz 'LifeOS zaten var; güncelleniyor...'
    $kod = Python-Kos (Join-Path $Hedef 'sistem\guncelle.py')
    if ($kod -ne 0) { Yaz 'Güncelleme yapılamadı (yukarıdaki nedenle); kuruluma devam ediliyor.' }
} elseif (Test-Path $Hedef) {
    throw "$Hedef var ama LifeOS deposu değil. Klasörü kenara alıp yeniden dene."
} else {
    Yaz 'LifeOS indiriliyor (birkaç dakika sürer)...'
    git clone --depth 1 --branch main $Depo $Hedef
    if ($LASTEXITCODE -ne 0) { throw 'LifeOS indirilemedi; internet bağlantısını denetleyip yeniden dene.' }
}

# 3. Masaustu uygulamasi: Electron'un resmi paketi + depodaki kabuk (uygulama/masaustu).
$Exe = Join-Path $Uyg 'LifeOS.exe'
if (-not (Test-Path $Exe)) {
    Yaz 'Masaüstü uygulaması indiriliyor...'
    $ad = "electron-v$ElectronSurum-win32-x64.zip"
    $taban = "https://github.com/electron/electron/releases/download/v$ElectronSurum"
    $gecici = Join-Path ([IO.Path]::GetTempPath()) ('lifeos-kur-' + [Guid]::NewGuid())
    New-Item -ItemType Directory -Force -Path $gecici | Out-Null
    try {
        $zip = Join-Path $gecici $ad
        Invoke-WebRequest "$taban/$ad" -OutFile $zip -UseBasicParsing
        $liste = Join-Path $gecici 'SHASUMS256.txt'
        Invoke-WebRequest "$taban/SHASUMS256.txt" -OutFile $liste -UseBasicParsing
        $satir = Get-Content $liste | Where-Object { $_ -match ([regex]::Escape($ad) + '$') } | Select-Object -First 1
        $beklenen = if ($satir) { ($satir -split '\s+')[0] } else { '' }
        $bulunan = (Get-FileHash $zip -Algorithm SHA256).Hash
        if (-not $beklenen -or $beklenen -ine $bulunan) { throw 'İndirilen uygulama paketi doğrulanamadı; hiçbir şey kurulmadı.' }
        $acik = Join-Path $gecici 'acik'
        Expand-Archive -Path $zip -DestinationPath $acik
        Rename-Item (Join-Path $acik 'electron.exe') 'LifeOS.exe'
        Remove-Item (Join-Path $acik 'resources\default_app.asar') -Force -ErrorAction SilentlyContinue
        New-Item -ItemType Directory -Force -Path (Split-Path $Uyg) | Out-Null
        if (Test-Path $Uyg) { Remove-Item $Uyg -Recurse -Force }
        Move-Item $acik $Uyg
    } finally {
        Remove-Item $gecici -Recurse -Force -ErrorAction SilentlyContinue
    }
}
$App = Join-Path $Uyg 'resources\app'
New-Item -ItemType Directory -Force -Path $App | Out-Null
Copy-Item (Join-Path $Hedef 'uygulama\masaustu\*') $App -Force
Yaz 'Masaüstü uygulaması hazır.'

# 4. Kisayol
New-Item -ItemType Directory -Force -Path $Kisayol | Out-Null
$k = (New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $Kisayol 'LifeOS.lnk'))
$k.TargetPath = $Exe
$k.WorkingDirectory = $Uyg
$k.IconLocation = Join-Path $App 'icon.ico'
$k.Save()

# 5. Eski bilgisayardan paket (sistem/tasi.py): masaustu, indirilenler, USB.
if (-not $env:LIFEOS_KUR_SORMA) {
    $yerler = @([Environment]::GetFolderPath('Desktop'), (Join-Path $env:USERPROFILE 'Downloads'))
    $yerler += Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=2' -ErrorAction SilentlyContinue | ForEach-Object { $_.DeviceID + '\' }
    $paket = $yerler | Where-Object { $_ -and (Test-Path $_) } |
        ForEach-Object { Get-ChildItem -Path $_ -Filter 'LifeOS-tasima*.lifeos' -File -ErrorAction SilentlyContinue } |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($paket) {
        $cevap = Read-Host "  Taşıma paketi bulundu: $($paket.FullName). Açılsın mı? (E/H)"
        if ($cevap -match '^[EeYy]') {
            $kod = Python-Kos (Join-Path $Hedef 'sistem\tasi.py') '--ac' $paket.FullName
            if ($kod -ne 0) { Yaz 'Paket açılamadı; sonra elle: python sistem\tasi.py --ac <dosya>' }
        }
    }
}

Write-Host "`n  LifeOS kuruldu. Masaüstündeki kısayoldan açılır.`n"
if (-not $env:LIFEOS_KUR_ACMA) { Start-Process $Exe }
