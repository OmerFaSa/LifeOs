#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""LifeOS — HEPSI, TEK KOMUT.

     python3 baslat.py            # uc sistem + HKM + giris sayfasi
     python3 baslat.py --dur      # uc sistemi VE HKM daemon'unu durdurur
     python3 baslat.py --hkmsiz   # yalniz uc sistem (HKM hic acilmaz)

   Ne yapar:

     1. HKM'yi kurar ve baslatir (HKM/baslat.py ile ayni yol),
     2. uc sistemin sunucusunu tek surecte acar (sunucu.py),
     3. giris sayfasini tarayicida acar.

   Iki kural:

   1. HKM ZORUNLU DEGILDIR. `--hkmsiz` ile ya da HKM acilmazsa uc sistem
      yine acilir. Bu bir nezaket degil SOZLESMEDIR: uc sistem HKM'nin var
      oldugunu bilmez ve o kapaliyken bozulmaz. Baslaticinin bu sozu
      kirmasi, sozun kendisini bos yapardi.

   2. BIR SEY ACILMADIYSA SOYLENIR. «Hazir» yazisi, kapinin GERCEKTEN
      cevap vermesiyle yazilir; denenmeden basilan bir onay isareti, yalan
      soyleyen bir arayuzdur.
"""

import os
import subprocess
import sys
import time
import urllib.request
import webbrowser

KOK = os.path.dirname(os.path.abspath(__file__))
HKM = os.path.join(KOK, "HKM")
GIRIS = "http://127.0.0.1:4180"
BEKLE_SANIYE = 15.0


def cocuk_ortami():
    """Cocuk surecin ortami: ciktisini UTF-8 yazsin.

    Cocugun ciktisi gunluk DOSYASINA gider. Python dosyaya yazarken
    sistemin kod sayfasini kullanir; Turkce Windows'ta bu cp1254'tur ve
    «✓» orada yoktur: sunucu ilk satirda UnicodeEncodeError ile oluyordu.
    Gunluk zaten UTF-8 acilir; cocuga da ayni dili konusmasi soylenir."""
    ortam = dict(os.environ)
    ortam["PYTHONIOENCODING"] = "utf-8"
    ortam["PYTHONUTF8"] = "1"
    return ortam


def _yaz(durum, metin, not_=""):
    print("  %s %s%s" % ({"ok": "✓", "yok": "•", "hata": "✕"}.get(durum, "•"),
                         metin, ("  — " + not_) if not_ else ""))


def _cevap_veriyor(url, timeout=1.0):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return r.status < 500
    except Exception:
        return False


def hkm_baslat():
    """HKM'nin kendi baslaticisini cagirir: iki yerde iki baslatma mantigi
    olsaydi, bir gun ikisi ayrisirdi."""
    try:
        p = subprocess.run([sys.executable, os.path.join(HKM, "baslat.py"),
                            "--tarayicisiz"], cwd=HKM, capture_output=True,
                           text=True, encoding="utf-8", errors="replace",
                           env=cocuk_ortami(), timeout=90)
    except Exception as e:
        return False, str(e)
    if _cevap_veriyor("http://127.0.0.1:4200/api/health"):
        return True, ""
    son = [s for s in (p.stdout or "").splitlines() if s.strip()]
    return False, (son[-1].strip() if son else "sebep yazılmadı")


def sistemler_baslat():
    """Uc sistemin sunucusu AYRI bir surecte kosar: cikti yutulmaz,
    gunluge yazilir."""
    gunluk_yolu = os.path.join(KOK, "sunucu.log")
    gunluk = open(gunluk_yolu, "a", encoding="utf-8")
    kwargs = {"cwd": KOK, "stdout": gunluk, "stderr": subprocess.STDOUT,
              "env": cocuk_ortami()}
    if os.name == "posix":
        kwargs["start_new_session"] = True
    p = subprocess.Popen([sys.executable, os.path.join(KOK, "sunucu.py")],
                         **kwargs)
    son = time.time() + BEKLE_SANIYE
    while time.time() < son:
        if _cevap_veriyor(GIRIS):
            return True, p, gunluk_yolu
        if p.poll() is not None:        # surec olduyse beklemenin anlami yok
            break
        time.sleep(0.3)
    return False, p, gunluk_yolu


def adiyla_durdur(hedef, calistir=subprocess.run, isletim=None):
    """Komut satirinda `hedef` (betigin tam yolu) gecen surecleri kapatir.
    Doner: (ok, not). Surec ADIYLA bulunur: port dinleyen her seyi
    oldurmek baska bir programi kapatmak olabilirdi.

    POSIX'te pkill; Windows'ta pkill yoktur — surecler PowerShell'le
    (Win32_Process.CommandLine) bulunur ve yalniz o PID'ler taskkill'le
    kapatilir. HKM'deki kopyasi ayni (kok baslatici HKM'siz calismali)."""
    if (isletim or os.name) != "nt":
        try:
            calistir(["pkill", "-f", hedef], capture_output=True)
        except FileNotFoundError:
            return False, "pkill bulunamadı; elle durdurulmalı: " + hedef
        return True, ""
    sorgu = ("Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and "
             "$_.CommandLine.Contains('%s') } | ForEach-Object { $_.ProcessId }"
             % hedef.replace("'", "''"))
    try:
        r = calistir(["powershell", "-NoProfile", "-NonInteractive", "-Command", sorgu],
                     capture_output=True, text=True)
    except FileNotFoundError:
        return False, "PowerShell bulunamadı; Görev Yöneticisi'nden kapat: " + hedef
    for pid in (r.stdout or "").split():
        if pid.isdigit() and int(pid) != os.getpid():
            calistir(["taskkill", "/PID", pid, "/T", "/F"], capture_output=True)
    return True, ""


def sistemler_dur():
    """Uc sistemin sunucusunu ADIYLA durdurur — HKM'nin kendi durdur()'uyla
    AYNI desen: port dinleyen her seyi oldurmek, baska bir programi
    kapatmak olabilirdi."""
    if not _cevap_veriyor(GIRIS):
        _yaz("yok", "Sistem sunucusu zaten çalışmıyor")
        return 0
    hedef = os.path.join(KOK, "sunucu.py")
    ok_, not_ = adiyla_durdur(hedef)
    if not ok_:
        _yaz("hata", "Sistem sunucusu durdurulamadı", not_)
        return 1
    son = time.time() + 5
    while time.time() < son:
        if not _cevap_veriyor(GIRIS, timeout=1.0):
            _yaz("ok", "Sistem sunucusu durduruldu")
            return 0
        time.sleep(0.3)
    _yaz("hata", "Sistem sunucusu durmadı", "elle kapat: " + hedef)
    return 1


def _cikti_utf8():
    """Cikti dosyaya ya da boruya gidiyorsa UTF-8 yazilir.

    Python dosyaya yazarken sistemin kod sayfasini kullanir; Turkce
    Windows'ta bu cp1254'tur ve «✓» orada yoktur. Baslatici cocuga UTF-8
    soyler, ama surec elle ve ciktisi yonlendirilerek de acilabilir: o
    zaman da ilk satirda olmemeli. Konsolda kodlamaya dokunulmaz, yalniz
    yazilamayan karakter yerine «?» konur."""
    for ad in ("stdout", "stderr"):
        akis = getattr(sys, ad, None)
        try:
            if akis.isatty():
                akis.reconfigure(errors="replace")
            else:
                akis.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass


def main():
    _cikti_utf8()
    if "--dur" in sys.argv:
        print("")
        kod_sistem = sistemler_dur()
        kod_hkm = subprocess.call([sys.executable,
                                   os.path.join(HKM, "baslat.py"), "--dur"],
                                  cwd=HKM)
        return kod_sistem or kod_hkm

    print("\nLifeOS başlatılıyor\n")

    # 1 — uc sistem. HKM'den ONCE: asil is bu, HKM ek katman.
    if _cevap_veriyor(GIRIS):
        _yaz("ok", "Sistem sunucusu zaten çalışıyor", GIRIS)
    else:
        oldu, surec, gunluk = sistemler_baslat()
        if oldu:
            _yaz("ok", "AYS · SPİ · ESP açıldı", GIRIS)
        else:
            _yaz("hata", "Sistem sunucusu açılamadı", "günlük: " + gunluk)
            print("\n  Ne olduğunu görmek için:  python3 sunucu.py\n")
            return 1

    # 2 — HKM. ISTEGE BAGLI: acilmazsa uc sistem yine calisir.
    if "--hkmsiz" in sys.argv:
        _yaz("yok", "HKM açılmadı", "--hkmsiz")
    elif _cevap_veriyor("http://127.0.0.1:4200/api/health"):
        _yaz("ok", "HKM zaten çalışıyor", "http://127.0.0.1:4200")
    else:
        oldu, sebep = hkm_baslat()
        if oldu:
            _yaz("ok", "HKM açıldı", "http://127.0.0.1:4200")
        else:
            _yaz("yok", "HKM açılamadı", sebep)
            print("     Üç sistem bundan etkilenmez; HKM kapalıyken de"
                  " çalışırlar.")

    # 3 — tarayici.
    if "--tarayicisiz" in sys.argv:
        _yaz("yok", "Tarayıcı açılmadı", "--tarayicisiz")
    else:
        try:
            webbrowser.open(GIRIS)
            _yaz("ok", "Tarayıcı açıldı", GIRIS)
        except Exception:
            _yaz("yok", "Tarayıcı açılamadı", "elle aç: " + GIRIS)

    print("""
  Giriş sayfası:  %s

  Sunucular ARKA PLANDA çalışır; bu pencereyi kapatmak onları durdurmaz.
  Durdurmak için:
      python3 baslat.py --dur          (üç sistem + HKM, hepsi)
""" % GIRIS)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
