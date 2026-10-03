#!/usr/bin/env python3
"""Sunucularin dinleme kuyrugu testi.

   python3 tools/kuyruk_test.py     (cikis 0 temiz, 1 kirmizi)

Hata (2026-10-03): ThreadingHTTPServer `listen(5)` ile acilir. Sunucu
HTTP/1.0 konusur, yani her betik ayri bir baglantidir; tarayici ayni anda
alti baglanti acar ve kabul dongusu bir an gecikince bes kisilik kuyruk
tasar. Windows tasan baglantiyi REDDEDER (Linux bekletir): sayfa bir
betigi `ERR_CONNECTION_REFUSED` ile hic yuklemez ve uygulama yarim acilir
(`SP.UI` tanimsiz, bir test dosyasi eksik). Dort denetim paralel
kosarken sayfa acilislarinin yarisindan fazlasinda goruldu; tek basina
nadirdi, bu yuzden «arada bir» diye gecildi.

Soz: dort sunucu da (uc devserver.py ve sistem/sunucu.py) en az BEKLEYEN
kisilik kuyrukla dinler ve hic kabul etmezken bile o kadar baglantiyi
reddetmez. Iki sinama:
  1. kuyruk boyu — listen()'e giden sayi. Her isletim sisteminde ayni
     sonucu verir; CI (Linux) eski hali bununla yakalar.
  2. davranis — BEKLEYEN baglanti acilir. Eski hali Windows'ta reddeder
     (belirtinin kendisi). Linux tasani reddetmez, istemci baglantiyi
     kurulmus sanabilir: orada bu sinama eski hali YAKALAMAYABILIR —
     birinci sinama o yuzden var."""
import importlib.util
import select
import socket
import sys
import time
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
BEKLEYEN = 32

try:   # Windows konsolu (cp1254) «✓» basamaz
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

kirmizi = 0


def dogru(ad, kosul, gelen=None):
    global kirmizi
    print(("  ✓ " if kosul else "  ✕ ") + ad + ("" if kosul else " (gelen %r)" % (gelen,)))
    if not kosul:
        kirmizi += 1


def yukle(ad, yol):
    spec = importlib.util.spec_from_file_location(ad, yol)
    modul = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modul)
    return modul


def kurulan_baglanti(sunucu):
    """Sunucu HIC kabul etmezken BEKLEYEN baglanti acar; kurulanlari sayar.
    Basarisiz baglanti Windows'ta select'in istisna kumesine duser, digerlerinde
    yazilabilir kumeye; ikisine de bakilir, karari SO_ERROR verir."""
    adres = sunucu.server_address
    soketler = []
    try:
        for _ in range(BEKLEYEN):
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.setblocking(False)
            s.connect_ex(adres)
            soketler.append(s)
        bekleyen, kurulan = list(soketler), 0
        bitis = time.monotonic() + 3
        while bekleyen and time.monotonic() < bitis:
            _, yaz, hata = select.select([], bekleyen, bekleyen, max(0.0, bitis - time.monotonic()))
            for s in set(yaz) | set(hata):
                bekleyen.remove(s)
                if s.getsockopt(socket.SOL_SOCKET, socket.SO_ERROR) == 0:
                    kurulan += 1
        return kurulan
    finally:
        for s in soketler:
            s.close()
        sunucu.server_close()


def sina(ad, sunucu):
    kuyruk = sunucu.request_queue_size
    n = kurulan_baglanti(sunucu)
    dogru("%s kuyrugu en az %d" % (ad, BEKLEYEN), kuyruk >= BEKLEYEN, kuyruk)
    dogru("%s %d bekleyen baglantiyi reddetmez" % (ad, BEKLEYEN), n == BEKLEYEN, n)


for sistem in ("AYS", "SPI", "ESP"):
    devserver = yukle("devserver_" + sistem, KOK / sistem / "devserver.py")
    sina("%s/devserver.py" % sistem, devserver.sunucu_kur(0))

sunucu = yukle("sunucu", KOK / "sistem" / "sunucu.py")
for sistem in ("AYS", "SPI", "ESP"):
    sina("sistem/sunucu.py (%s kapisi)" % sistem, sunucu._sunucu_kur(sistem, 0))

print("kirmizi: %d" % kirmizi if kirmizi else "temiz")
sys.exit(1 if kirmizi else 0)
