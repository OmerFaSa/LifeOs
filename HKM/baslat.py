#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""HKM — TEK TIK.

   Bu dosyaya cift tiklamak (ya da `python3 baslat.py` demek) yeter:

     1. yapilandirma ve sema kurulur (var olan EZILMEZ),
     2. daemon zaten ayaktaysa YENIDEN BASLATILMAZ,
     3. degilse baslatilir ve gercekten cevap verene kadar BEKLENIR,
     4. yuz icin kisa bir esleme penceresi acilir,
     5. tarayici acilir — jeton elle yazilmaz, hicbir yerde gorunmez.

   Uc kural:

   1. JETON EKRANA DA ADRESE DE YAZILMAZ. Adres cubugundaki bir sir,
      tarayici gecmisine ve ekran goruntulerine yazilan bir sirdir. Yuz
      jetonu esleme penceresinden alir ve yalniz kendi tarayicisinda tutar.

   2. PENCERE KISA OLUR. Varsayilan 120 saniye yerine burada 20 saniye
      istenir: pencere ne kadar acik kalirsa, ayni makinede acik duran
      baska bir sayfanin jetonu kapma ihtimali o kadar uzun surer.
      Sure ISTENEBILIR ama daemon onu uzatmaya izin vermez.

   3. HER SATIR OLCUMDUR. «Hazir» yazisi, /api/health gercekten cevap
      verdigi icin yazilir. Denenmeden basilan bir onay isareti, yalan
      soyleyen bir arayuzdur.
"""

import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)

BEKLE_SANIYE = 20.0          # daemon bu surede cevap vermezse durum yazilir
ESLEME_SANIYE = 20           # yuz icin acilan pencere — kisa tutulur

import kur  # noqa: E402  (ROOT yoluna eklendikten sonra)


def _yaz(durum, metin, not_=""):
    print("  %s %s%s" % ({"ok": "✓", "yok": "•", "hata": "✕"}.get(durum, "•"),
                         metin, ("  — " + not_) if not_ else ""))


def _adres(cfg):
    return "http://%s:%s" % (cfg.get("host", "127.0.0.1"), cfg.get("port", 4200))


def ayakta_mi(cfg, timeout=1.5):
    try:
        with urllib.request.urlopen(_adres(cfg) + "/api/health",
                                    timeout=timeout) as r:
            return r.status == 200
    except Exception:
        return False


def daemon_baslat(cfg):
    """Daemon'u AYRI bir surecte baslatir ve cevap verene kadar bekler.

    Ciktisi yutulmaz: gunluk dosyaya yazilir. Bir hatayi gormeden
    «basladi» demek, calismayan bir kurulumu calisiyor gostermektir."""
    gunluk_yolu = os.path.join(ROOT, "db", "daemon.log")
    os.makedirs(os.path.dirname(gunluk_yolu), exist_ok=True)
    gunluk = open(gunluk_yolu, "a", encoding="utf-8")
    kwargs = {"cwd": ROOT, "stdout": gunluk, "stderr": subprocess.STDOUT}
    if os.name == "posix":
        kwargs["start_new_session"] = True      # terminal kapanınca olmesin
    subprocess.Popen([sys.executable, os.path.join(ROOT, "daemon.py")], **kwargs)

    son = time.time() + BEKLE_SANIYE
    while time.time() < son:
        if ayakta_mi(cfg, timeout=1.0):
            return True, gunluk_yolu
        time.sleep(0.4)
    return False, gunluk_yolu


def esleme_ac(cfg):
    """Yuz icin kisa pencere. Basarisizlik OLUMCUL degildir: jeton elle de
    girilebilir, o yuzden burada yalniz sonuc bildirilir."""
    istek = urllib.request.Request(
        _adres(cfg) + "/api/pair/open",
        data=json.dumps({"seconds": ESLEME_SANIYE}).encode("utf-8"),
        headers={"Content-Type": "application/json",
                 "Authorization": "Bearer " + str(cfg.get("local_token") or "")},
        method="POST")
    try:
        with urllib.request.urlopen(istek, timeout=3) as r:
            govde = json.loads(r.read().decode("utf-8") or "{}")
            return True, int(govde.get("seconds") or ESLEME_SANIYE)
    except Exception:
        return False, 0


def durdur(cfg):
    """Daemon'u durdurur. Islemi ADIYLA bulur: port dinleyen her seyi
    oldurmek, baska bir programi kapatmak olabilirdi."""
    if not ayakta_mi(cfg):
        _yaz("yok", "Daemon zaten çalışmıyor")
        return 0
    hedef = os.path.join(ROOT, "daemon.py")
    try:
        p = subprocess.run(["pkill", "-f", hedef], capture_output=True)
    except FileNotFoundError:
        _yaz("hata", "pkill bulunamadı", "elle durdurulmalı: " + hedef)
        return 1
    son = time.time() + 5
    while time.time() < son:
        if not ayakta_mi(cfg, timeout=1.0):
            _yaz("ok", "Daemon durduruldu")
            return 0
        time.sleep(0.3)
    _yaz("hata", "Daemon durmadı", "çıkış kodu %s" % p.returncode)
    return 1


def main():
    sessiz = "--tarayicisiz" in sys.argv
    if "--dur" in sys.argv:
        print("")
        return durdur(kur.oku(kur.CONFIG) or {"host": "127.0.0.1", "port": 4200})
    print("\nHKM başlatılıyor\n")

    # 1 — kurulum. Var olan yapilandirma EZILMEZ.
    cfg = kur.kur(yaz=True, yol_goster=False)

    # 2 — daemon. Zaten ayaktaysa ikinci bir surec baslatilmaz: ayni
    #     porta ikinci bir dinleyici, sessizce olen bir surectir.
    if ayakta_mi(cfg):
        _yaz("ok", "Daemon zaten çalışıyor", _adres(cfg))
    else:
        oldu, gunluk = daemon_baslat(cfg)
        if oldu:
            _yaz("ok", "Daemon başlatıldı", _adres(cfg))
        else:
            _yaz("hata", "Daemon %g saniyede cevap vermedi" % BEKLE_SANIYE,
                 "günlük: " + gunluk)
            print("\n  Ne olduğunu görmek için:  python3 daemon.py\n")
            return 1

    # 3 — yuz icin kisa esleme penceresi.
    acildi, sure = esleme_ac(cfg)
    if acildi:
        _yaz("ok", "Yüz için eşleme penceresi açıldı", "%d saniye" % sure)
    else:
        _yaz("yok", "Eşleme penceresi açılamadı",
             "yüz jetonu isteyecek (config.json → local_token)")

    # 4 — tarayici.
    if sessiz:
        _yaz("yok", "Tarayıcı açılmadı", "--tarayicisiz")
    else:
        try:
            webbrowser.open(_adres(cfg))
            _yaz("ok", "Tarayıcı açıldı", _adres(cfg))
        except Exception:
            _yaz("yok", "Tarayıcı açılamadı", "elle aç: " + _adres(cfg))

    print("""
  Hazır. Üç sistemi bağlamak için yüzdeki «Cihazları bağla» düğmesine
  bas: her sistem için bir kez, jeton elle yazılmadan.

  Daemon ARKA PLANDA çalışır; bu pencereyi kapatmak onu durdurmaz.
  Durdurmak için:  python3 baslat.py --dur
""")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
