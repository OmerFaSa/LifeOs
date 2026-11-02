# 080 · Bilgisayar araçlarının platform katmanı (KING-4 §E)

**Durum:** bitti   <!-- bekliyor | sürüyor | bitti | takıldı -->
**Dal:** `ag/080-bilgisayar-katman`
**Efor:** yüksek
**Kabul testi:** `tools/bilgisayar_kabul_test.py`

## Amaç
`belgeler/ekip/KING-4.md` §E: King bilgisayarda dosya ya da klasör açabilsin, uygulama başlatabilsin,
ekrandaki metni okuyabilsin. Bu görev yalnız **platform katmanı**: Windows'a giden çağrılar ve güvenlik
denetimi. İzin, onay kartı ve eylem defteri HKM'de (Claude Code yazar, `HKM/core/disdunya.py`), bu modülü
çağırır. Yalnız Python standart kütüphanesi; model yok.

## Dokunulacak dosyalar
- `sistem/bilgisayar.py` — YENİ. Başta kısa «Sözler» yorumu (Türkçe): dış çağrı yalnız `calistir`'dan
  geçer; `shell=True` yok; argv liste; çalıştırılabilir dosya `ac` ile açılmaz; kapatma zorlamasız ve
  yalnız bu katmanın başlattığı süreç. Dışa açılan:
  - `calistir(argv, zaman)` → `(kod, cikti)`. `subprocess.run(argv, capture_output=True, text=True,
    encoding="utf-8", errors="replace", timeout=zaman)`, Windows'ta `CREATE_NO_WINDOW`.
    `TimeoutExpired` → `(-1, "zaman aşımı")`; `OSError` → `(-2, str(e))`. İstisna fırlatmaz.
  - `BASLATILAN` — bu süreçte başlatılan pid'lerin kümesi.
  - `EN_COK_METIN = 4000`.
  - `ac(yol, calistir=calistir)` → `{"ok", "pid", "yol"}` ya da `{"ok": False, "hata"}`. Yol mutlak ve
    var olmalı; uzantısı `CALISTIRILABILIR` kümesinde ise (en az .exe .bat .cmd .com .ps1 .vbs .vbe .js
    .jse .wsf .wsh .hta .msi .msp .scr .lnk .url .reg .jar .cpl .pif) açılmaz. PowerShell'le
    `(Start-Process -FilePath '<yol>' -PassThru).Id` (yol tek tırnaklı literal, `'` → `''`);
    `powershell -NoProfile -NonInteractive -Command <metin>`. Çıktının ilk tam sayısı pid'dir,
    `BASLATILAN`'a girer. Çıkış kodu 0 değilse `ok: False`.
  - `uygulamalar(kokler=None)` → `[{"ad", "yol"}]`, ada göre (Türkçe küçük harfle) sıralı, aynı ad bir kez.
    Kökler varsayılan: `%ProgramData%\Microsoft\Windows\Start Menu\Programs` ve
    `%APPDATA%\Microsoft\Windows\Start Menu\Programs`, alt klasörler dahil. Yalnız `.lnk` ve `.url`;
    adında «uninstall», «kaldır», «remove» geçen girmez. `ad` = dosya adı uzantısız.
  - `baslat(ad, kokler=None, calistir=calistir)` → `{"ok", "pid", "ad"}` ya da `{"ok": False, "hata",
    "adaylar"?}`. Karşılaştırma Türkçe küçük harfle (`İ`→`i`, `I`→`ı`, sonra `lower()`), baş/son boşluk
    kırpılır. Önce tam eşleşme; yoksa adı bu ön ekle başlayan TEK uygulama; birden çoksa `adaylar`
    (adlar) ile `ok: False`; yoksa `ok: False`. Boş ad hata. Kısayolu `ac`'taki PowerShell yoluyla
    başlatır (kısayolun uzantısı burada serbesttir), pid `BASLATILAN`'a girer.
  - `kapat(pid, calistir=calistir)` → pid `BASLATILAN`'da değilse çağrı yapmadan `ok: False`; varsa
    `["taskkill", "/PID", str(pid)]` (**/F yok**: kaydedilmemiş iş kaybolmasın). Kod 0 ise kümeden çıkar,
    `ok: True`.
  - `ekran_oku(calistir=calistir)` → `{"ok": True, "metin"}` ya da `{"ok": False, "hata"}`. PowerShell
    betiği: birincil ekranın görüntüsü (`System.Windows.Forms.Screen`, `System.Drawing` ile
    `CopyFromScreen`) geçici PNG'ye, sonra Windows'un kendi OCR'ı (`Windows.Media.Ocr.OcrEngine`,
    `TryCreateFromUserProfileLanguages`) ile metin; geçici dosya silinir. Zaman 30 sn. Çıktının her
    satırı kırpılır, boş satırlar atılır, `\n` ile birleşir, `EN_COK_METIN`'e kesilir.

## Dokunma
- `HKM/`, `brand/`, modüller, `sistem/sunucu.py` ve öteki `sistem/` dosyaları.
- Kabul testi dosyası.

## Kabul ölçütü
- `python tools/bilgisayar_kabul_test.py` yeşil (her madde testte bir sınama).
- Gerçek makinede bir kez: `python -c "import sys; sys.path.insert(0,'sistem'); import bilgisayar as B; print(B.ekran_oku())"`
  ekrandaki metni döndürmeli; sonucu Sonuç'a `DENEME:` satırı olarak yaz (metnin ilk 80 harfi).
  `ac` ya da `baslat`ı gerçek makinede **koşma** (kullanıcının ekranına pencere açar).

## Koşulacak testler
- `python tools/bilgisayar_kabul_test.py` (önce kırmızı, sonra yeşil)
- `python -m pyflakes sistem/bilgisayar.py` (kuruluysa)

## Sonuç
<!-- Antigravity doldurur; dört satır da dolu olmalı (yoksa «yok»). Pilot eksik bırakılanı bir kez geri gönderir. -->
- **Ne değişti:** `sistem/bilgisayar.py` eklendi. Başta doktrin sözleri tanımlandı (dış çağrı yalnız `calistir`'dan geçer, `shell=True` yok, `argv` liste, çalıştırılabilir dosya doğrudan `ac` ile açılmaz, kapatma zorlamasız ve yalnız bu katmanın başlattığı süreçler). `calistir`, `ac`, `uygulamalar`, `baslat`, `kapat`, `ekran_oku`, `BASLATILAN`, `EN_COK_METIN` (4000) ve `CALISTIRILABILIR` dışa aktarıldı.
- **Koşan testler:** `python tools/bilgisayar_kabul_test.py` -> `bilgisayar kabul: ac, uygulamalar, baslat, kapat, ekran_oku, calistir temiz.`
- **Kabul testi:** `tools/bilgisayar_kabul_test.py` yeşil.
  DENEME: `RIOT\nGAMES\n2020-2026 Riot Games, Inc. Riot Games, VALORANT ve ilgili`
- **Açık kalan:** yok
