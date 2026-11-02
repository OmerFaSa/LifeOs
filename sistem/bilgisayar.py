# -*- coding: utf-8 -*-
"""LifeOS — BİLGİSAYAR PLATFORM KATMANI (KING-4 §E).

King'in bilgisayarda dosya ve klasör açabilmesi, uygulama başlatabilmesi,
süreç kapatabilmesi ve ekrandaki metni okuyabilmesi için Windows platform
katmanı ve güvenlik denetimi.

Sözler:
  1. Dış çağrı yalnız `calistir`'dan geçer; sistem genelinde `shell=True` kullanılmaz.
  2. `argv` her zaman listedir; komut enjeksiyonu engellenir.
  3. Çalıştırılabilir dosya (.exe, .bat, komut dosyaları vb.) `ac` ile doğrudan açılamaz.
  4. Kapatma zorlamasızdır (`/F` kullanılmaz; kaydedilmemiş iş kaybolmaz) ve yalnız
     bu katmanın başlattığı süreçler (`BASLATILAN`) kapatılabilir.
"""

import os
import re
import subprocess

EN_COK_METIN = 4000
BASLATILAN = set()

CALISTIRILABILIR = {
    ".exe", ".bat", ".cmd", ".com", ".ps1", ".vbs", ".vbe", ".js",
    ".jse", ".wsf", ".wsh", ".hta", ".msi", ".msp", ".scr", ".lnk",
    ".url", ".reg", ".jar", ".cpl", ".pif",
}

_EKRAN_OKU_PS = """
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$utf8 = New-Object System.Text.UTF8Encoding $false
$writer = New-Object System.IO.StreamWriter([Console]::OpenStandardOutput(), $utf8)
$writer.AutoFlush = $true
[Console]::SetOut($writer)

Add-Type -AssemblyName System.Windows.Forms,System.Drawing,System.Runtime.WindowsRuntime
$temp = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), [System.Guid]::NewGuid().ToString() + '.png')
try {
    $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $captured = $false
    try {
        $bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.CopyFromScreen(0, 0, 0, 0, $bounds.Size)
        $bmp.Save($temp, [System.Drawing.Imaging.ImageFormat]::Png)
        $g.Dispose()
        $bmp.Dispose()
        $captured = $true
    } catch {}

    if (-not $captured) {
        $code = @'
using System;
using System.Threading;
using System.Runtime.InteropServices;
using System.Drawing;
using System.Windows.Forms;
public class LifeOSCap {
    [DllImport("user32.dll", SetLastError = true)] public static extern IntPtr OpenInputDesktop(uint dwFlags, bool fInherit, uint dwDesiredAccess);
    [DllImport("user32.dll", SetLastError = true)] public static extern bool SetThreadDesktop(IntPtr hDesktop);
    [DllImport("user32.dll", SetLastError = true)] public static extern bool CloseDesktop(IntPtr hDesktop);
    public static void Cap(string path) {
        Thread t = new Thread(() => {
            IntPtr h = OpenInputDesktop(0, false, 0x01FF);
            if (h != IntPtr.Zero) {
                if (SetThreadDesktop(h)) {
                    Rectangle b = Screen.PrimaryScreen.Bounds;
                    using (Bitmap bmp = new Bitmap(b.Width, b.Height)) {
                        using (Graphics g = Graphics.FromImage(bmp)) {
                            g.CopyFromScreen(0, 0, 0, 0, b.Size);
                        }
                        bmp.Save(path, System.Drawing.Imaging.ImageFormat.Png);
                    }
                }
                CloseDesktop(h);
            }
        });
        t.SetApartmentState(ApartmentState.STA);
        t.Start();
        t.Join();
    }
}
'@
        Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing,System.Windows.Forms -ErrorAction SilentlyContinue
        [LifeOSCap]::Cap($temp)
    }

    if (-not (Test-Path $temp)) { exit 1 }

    [Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType = WindowsRuntime] | Out-Null
    [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
    [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime] | Out-Null

    function AwaitTask($op, $type) {
        $m = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
            $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
        }
        $t = $m.MakeGenericMethod($type).Invoke($null, @($op))
        $t.Wait()
        return $t.Result
    }

    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
    if ($null -eq $engine) {
        $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('en-US'))
    }

    $file = AwaitTask ([Windows.Storage.StorageFile]::GetFileFromPathAsync($temp)) ([Windows.Storage.StorageFile])
    $stream = AwaitTask ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
    $decoder = AwaitTask ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $sBmp = AwaitTask ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
    $ocr = AwaitTask ($engine.RecognizeAsync($sBmp)) ([Windows.Media.Ocr.OcrResult])
    $stream.Dispose()

    foreach ($l in $ocr.Lines) {
        [Console]::WriteLine($l.Text)
    }
} finally {
    if (Test-Path $temp) { Remove-Item -Force $temp -ErrorAction SilentlyContinue }
}
"""


def _turkce_kucuk(metin):
    """Metni Türkçe kurallarına göre küçük harfe çevirir ve boşlukları kırpar."""
    if not metin or not isinstance(metin, str):
        return ""
    return metin.replace("İ", "i").replace("I", "ı").lower().strip()


def calistir(argv, zaman=30):
    """Güvenli süreç çalıştırıcı: argv liste olmalı, shell=True yok.

    TimeoutExpired durumunda (-1, 'zaman aşımı'), OSError durumunda (-2, str(e))
    döndürür. İstisna fırlatmaz.
    """
    try:
        kwargs = {
            "capture_output": True,
            "text": True,
            "encoding": "utf-8",
            "errors": "replace",
            "timeout": zaman,
        }
        if os.name == "nt":
            kwargs["creationflags"] = getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000)
        r = subprocess.run(argv, **kwargs)
        cikti = r.stdout or ""
        if r.returncode != 0 and r.stderr:
            cikti = (cikti + "\n" + r.stderr).strip() if cikti else r.stderr.strip()
        return r.returncode, cikti
    except subprocess.TimeoutExpired:
        return -1, "zaman aşımı"
    except OSError as e:
        return -2, str(e)
    except Exception as e:
        return -2, str(e)


def _surec_ac(yol, calistir):
    """Start-Process ile açar (yol tek tırnaklı literal: ' → ''); pid BASLATILAN'a girer."""
    yol_literal = yol.replace("'", "''")
    cmd = f"(Start-Process -FilePath '{yol_literal}' -PassThru).Id"
    kod, cikti = calistir(["powershell", "-NoProfile", "-NonInteractive", "-Command", cmd], 15)
    if kod != 0:
        return {"ok": False, "hata": cikti or f"Açılamadı (kod {kod})"}
    m = re.search(r"\b\d+\b", cikti)
    if not m:
        return {"ok": False, "hata": f"PID okunamadı: {cikti}"}
    pid = int(m.group(0))
    BASLATILAN.add(pid)
    return {"ok": True, "pid": pid}


def ac(yol, calistir=calistir):
    """Mutlak ve var olan bir dosya veya klasörü varsayılan uygulamasıyla açar.

    Çalıştırılabilir dosyalar güvenlik amacıyla açılmaz.
    """
    if not yol or not isinstance(yol, str):
        return {"ok": False, "hata": "Geçersiz dosya yolu"}
    if not os.path.isabs(yol):
        return {"ok": False, "hata": "Yol mutlak olmalıdır"}
    if not os.path.exists(yol):
        return {"ok": False, "hata": "Dosya veya klasör bulunamadı"}

    uzanti = os.path.splitext(yol)[1].lower()
    if uzanti in CALISTIRILABILIR:
        return {"ok": False, "hata": f"Çalıştırılabilir dosya açılamaz: {uzanti}"}

    r = _surec_ac(yol, calistir)
    return dict(r, yol=yol) if r["ok"] else r


def varsayilan_kokler():
    """Başlat menüsü kısayollarının aranacağı varsayılan klasörleri döndürür."""
    kokler = []
    pd = os.environ.get("ProgramData")
    if not pd and os.name == "nt":
        pd = "C:\\ProgramData"
    if pd:
        p = os.path.join(pd, "Microsoft", "Windows", "Start Menu", "Programs")
        if os.path.isdir(p):
            kokler.append(p)
    ad = os.environ.get("APPDATA")
    if not ad and os.name == "nt":
        ad = os.path.expanduser("~\\AppData\\Roaming")
    if ad:
        p = os.path.join(ad, "Microsoft", "Windows", "Start Menu", "Programs")
        if os.path.isdir(p):
            kokler.append(p)
    return kokler


def uygulamalar(kokler=None):
    """Başlat menüsü kısayollarını listeler.

    Ada göre Türkçe küçük harfle sıralı döner, aynı ad bir kez yer alır.
    Kaldırma ve yardımcı bağlantılar listeye dahil edilmez.
    """
    if kokler is None:
        kokler = varsayilan_kokler()

    gorulen = set()
    sonuc = []
    for kok in kokler:
        if not os.path.isdir(kok):
            continue
        for kok_dizin, _, dosyalar in os.walk(kok):
            for dosya in dosyalar:
                uzanti = os.path.splitext(dosya)[1].lower()
                if uzanti not in (".lnk", ".url"):
                    continue
                ad = os.path.splitext(dosya)[0]
                k_ad = _turkce_kucuk(ad)
                if any(yasak in k_ad for yasak in ("uninstall", "kaldır", "remove")):
                    continue
                if k_ad in gorulen:
                    continue
                gorulen.add(k_ad)
                tam_yol = os.path.abspath(os.path.join(kok_dizin, dosya))
                sonuc.append({"ad": ad, "yol": tam_yol})

    sonuc.sort(key=lambda x: _turkce_kucuk(x["ad"]))
    return sonuc


def baslat(ad, kokler=None, calistir=calistir):
    """Başlat menüsünden ada göre uygulama bulup başlatır.

    Önce tam eşleşme, ardından tekil ön ek eşleşmesi aranır.
    """
    if not ad or not isinstance(ad, str):
        return {"ok": False, "hata": "Uygulama adı boş olamaz"}
    aranan = _turkce_kucuk(ad)
    if not aranan:
        return {"ok": False, "hata": "Uygulama adı boş olamaz"}

    apps = uygulamalar(kokler=kokler)

    tam_eslesenler = [u for u in apps if _turkce_kucuk(u["ad"]) == aranan]
    if tam_eslesenler:
        hedef = tam_eslesenler[0]
    else:
        onekle_eslesenler = [u for u in apps if _turkce_kucuk(u["ad"]).startswith(aranan)]
        if len(onekle_eslesenler) == 1:
            hedef = onekle_eslesenler[0]
        elif len(onekle_eslesenler) > 1:
            return {
                "ok": False,
                "hata": "Birden çok uygulama bulundu",
                "adaylar": [u["ad"] for u in onekle_eslesenler],
            }
        else:
            return {"ok": False, "hata": f"Uygulama bulunamadı: {ad}"}

    r = _surec_ac(hedef["yol"], calistir)
    return dict(r, ad=hedef["ad"]) if r["ok"] else r


def kapat(pid, calistir=calistir):
    """Bu katmanda başlatılmış bir süreci sonlandırır.

    Kaydedilmemiş işlerin kaybolmaması için /F bayrağı kullanılmaz.
    """
    if pid not in BASLATILAN:
        return {"ok": False, "hata": "Süreç bu katmanda başlatılmadı"}

    argv = ["taskkill", "/PID", str(pid)]
    kod, cikti = calistir(argv, 15)
    if kod == 0:
        BASLATILAN.discard(pid)
        return {"ok": True}
    return {"ok": False, "hata": cikti or f"Kapatılamadı (kod {kod})"}


def ekran_oku(calistir=calistir):
    """Birincil ekranın görüntüsünü alıp Windows OCR ile metne çevirir."""
    argv = ["powershell", "-NoProfile", "-NonInteractive", "-Command", _EKRAN_OKU_PS]
    kod, cikti = calistir(argv, 30)
    if kod != 0:
        return {"ok": False, "hata": cikti or f"Ekran okunamadı (kod {kod})"}
    satirlar = [s.strip() for s in cikti.splitlines() if s.strip()]
    metin = "\n".join(satirlar)[:EN_COK_METIN]
    return {"ok": True, "metin": metin}
