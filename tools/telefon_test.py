#!/usr/bin/env python3
"""Telefon (ev agi + https) testi.

   python3 tools/telefon_test.py     (cikis 0 temiz, 1 kirmizi, 2 kosulamadi)

Neden (2026-10-04): tarayici kamerayi ve konumu yalniz https'e (ya da
localhost'a) verir. Telefon bilgisayara ev aginden http ile baglaninca
SPİ'nin kamerasi ve canli rota kaydi calismaz. sistem/telefon.py yerel bir
kok ve sunucu sertifikasi uretir; sistem/sunucu.py sertifika varsa uc
modulu ev aginda https ile de acar.

Sozler:
  1. Sertifika yokken hicbir ev agi kapisi acilmaz (kural 3: yalniz yerel).
  2. Kok gercekten CA; sunucu sertifikasi .local adini, IP'yi ve 127.0.0.1'i
     tasir, yalniz sunucu kimligidir ve iOS'un 825 gun sinirinin altindadir.
  3. Yenileme koku KORUR (telefona yeniden kurulmaz), yeni IP'yi ekler.
  4. Koke guvenen istemci sayfayi https ile alir; guvenmeyen reddedilir.
  5. Bozuk ya da sessiz bir baglanti kapiyi kilitlemez.
  6. Kurulum sayfasi yalniz yonergeyi ve kokun ACIK kismini verir: ozel
     anahtar, depo dosyalari, HEAD/POST yoktur.
  7. --kapat ev agi kapilarini kapatir, koku birakir.
Testler gecici klasorde calisir; kullanicinin gercek sertifikasina dokunmaz."""
import datetime
import hashlib
import http.client
import importlib.util
import os
import socket
import ssl
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent

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


sys.path.insert(0, str(KOK / "sistem"))
telefon = yukle("telefon", KOK / "sistem" / "telefon.py")
sunucu = yukle("sunucu", KOK / "sistem" / "sunucu.py")

OPENSSL = telefon.openssl_bul()
if not OPENSSL:
    print("kosulamadi: openssl yok (sertifika uretilemez)")
    sys.exit(2)


def metin(yol):
    return subprocess.run([OPENSSL, "x509", "-in", yol, "-noout", "-text"],
                          capture_output=True, text=True).stdout


def gun_sayisi(yol):
    c = subprocess.run([OPENSSL, "x509", "-in", yol, "-noout", "-startdate", "-enddate"],
                       capture_output=True, text=True).stdout
    t = dict(s.split("=", 1) for s in c.strip().splitlines())
    bicim = "%b %d %H:%M:%S %Y GMT"
    bas = datetime.datetime.strptime(" ".join(t["notBefore"].split()), bicim)
    son = datetime.datetime.strptime(" ".join(t["notAfter"].split()), bicim)
    return (son - bas).days


def izi(yol):
    with open(yol, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def basla(s):
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s


def https_al(port, kok_crt, ad=None, yol="/"):
    """(durum, govde). ad verilirse SNI/ad dogrulamasi o adla yapilir."""
    b = ssl.create_default_context(cafile=kok_crt)
    with socket.create_connection(("127.0.0.1", port), timeout=5) as ham:
        with b.wrap_socket(ham, server_hostname=ad or "127.0.0.1") as s:
            s.sendall(("GET %s HTTP/1.0\r\nHost: x\r\n\r\n" % yol).encode())
            veri = b""
            while True:
                p = s.recv(65536)
                if not p:
                    break
                veri += p
    bas, _, govde = veri.partition(b"\r\n\r\n")
    return int(bas.split()[1]), govde


def http_al(port, yontem="GET", yol="/"):
    c = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
    c.request(yontem, yol)
    r = c.getresponse()
    govde = r.read()
    c.close()
    return r.status, r.getheader("Content-Type") or "", govde


with tempfile.TemporaryDirectory() as gecici:
    k = os.path.join(gecici, "telefon")
    y = telefon.yollar(k)

    # 1 — sertifika yokken hicbir sey acilmaz
    dogru("sertifika yokken telefon kapali", not telefon.acik_mi(k))
    dogru("sertifika yokken ev agi kapisi acilmaz", sunucu.telefon_sunuculari(k) == ([], []),
          sunucu.telefon_sunuculari(k))
    dogru("sertifika yokken kurulum sayfasi acilmaz", sunucu.telefon_kurulum_sunucusu(k) is None)
    dogru("bilgisayardaki kapilar yalniz 127.0.0.1", sunucu.HOST == "127.0.0.1", sunucu.HOST)
    dogru("sertifikalar deponun disinda", not str(telefon.klasor()).startswith(str(KOK)),
          telefon.klasor())

    # 2 — uretim
    telefon.kur(k=k, openssl=OPENSSL, bilgisayar="lifeos-test", ip_listesi=["192.168.50.7"])
    dogru("kurulumdan sonra telefon acik", telefon.acik_mi(k))
    km, sm = metin(y["kok"]), metin(y["sertifika"])
    dogru("kok sertifika CA", "CA:TRUE" in km)
    dogru("sunucu sertifikasi CA degil", "CA:FALSE" in sm)
    dogru("sunucu sertifikasi yalniz sunucu kimligi", "TLS Web Server Authentication" in sm)
    for parca in ("DNS:lifeos-test.local", "IP Address:192.168.50.7", "IP Address:127.0.0.1"):
        dogru("sunucu sertifikasi " + parca + " tasir", parca in sm)
    g = gun_sayisi(y["sertifika"])
    dogru("sunucu sertifikasi iOS siniri altinda (<= 825 gun)", g <= 825, g)
    with open(y["kok_der"], "rb") as f:
        der = f.read()
    dogru("kokun DER kopyasi var", der[:1] == b"\x30", der[:4])

    # 3 — yenileme koku korur
    kok_izi, sunucu_izi = izi(y["kok"]), izi(y["sertifika"])
    telefon.kur(k=k, openssl=OPENSSL, bilgisayar="lifeos-test", ip_listesi=["192.168.50.7"])
    dogru("ikinci kurulum hicbir seyi degistirmez",
          (izi(y["kok"]), izi(y["sertifika"])) == (kok_izi, sunucu_izi))
    telefon.kur(yenile=True, k=k, openssl=OPENSSL, bilgisayar="lifeos-test", ip_listesi=["192.168.50.8"])
    dogru("yenileme koku korur", izi(y["kok"]) == kok_izi)
    dogru("yenileme yeni IP'yi ekler", "IP Address:192.168.50.8" in metin(y["sertifika"]))

    # 4 — https kapisi
    acik, sorun = sunucu.telefon_sunuculari(k, portlar={"AYS": 0, "SPI": 0, "ESP": 0}, host="127.0.0.1")
    dogru("uc modulun telefon kapisi acilir", len(acik) == 3 and not sorun, (len(acik), sorun))
    spi = basla([s for ad, _, s in acik if ad.startswith("SPİ")][0])
    for _, _, s in acik:
        if s is not spi:
            s.server_close()
    port = spi.server_address[1]
    durum, govde = https_al(port, y["kok"], ad="lifeos-test.local")
    dogru("koke guvenen istemci SPİ'yi https ile alir (.local adi)",
          durum == 200 and 'apple-mobile-web-app-title" content="SPİ"' in govde.decode("utf-8", "replace"),
          durum)
    durum, _ = https_al(port, y["kok"])
    dogru("IP adresiyle de dogrulanir (127.0.0.1)", durum == 200, durum)
    try:
        https_al(port, None)
        reddedildi = False
    except ssl.SSLCertVerificationError:
        reddedildi = True
    except OSError:
        reddedildi = True
    dogru("koke guvenmeyen istemci reddedilir", reddedildi)
    durum, _ = https_al(port, y["kok"], yol="/sw.js")
    dogru("service worker https ile gelir (cevrimdisi kabuk)", durum == 200, durum)

    # 5 — duz http yonlendirilir; bozuk ve sessiz baglanti kapiyi kilitlemez
    # (2026-10-04, telefonda «güvenli bağlantı sağlanamıyor»: adres semasiz
    # yazilinca tarayici bir kapiya https, digerine http deniyor.)
    c = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
    c.request("GET", "/js/app.js?x=1", headers={"Host": "lifeos-test.local:%d" % port})
    r = c.getresponse()
    yer = r.getheader("Location") or ""
    c.close()
    dogru("https kapisina duz http aynı adresin https'ine yonlendirilir",
          r.status == 301 and yer == "https://lifeos-test.local:%d/js/app.js?x=1" % port, (r.status, yer))
    with socket.create_connection(("127.0.0.1", port), timeout=5) as bozuk:
        bozuk.sendall(b"\x16\x03\x01\x00\x05zzzzz")   # bozuk TLS
        try:
            bozuk.recv(100)
        except OSError:
            pass
    sessiz = socket.create_connection(("127.0.0.1", port), timeout=5)   # hic konusmaz
    t0 = time.monotonic()
    durum, _ = https_al(port, y["kok"])
    sure = time.monotonic() - t0
    sessiz.close()
    dogru("bozuk TLS ve sessiz baglantidan sonra kapi hizmet eder", durum == 200, durum)
    dogru("sessiz baglanti el sikismayi bekletmez (< 3 sn)", sure < 3, round(sure, 2))
    spi.shutdown()
    spi.server_close()

    # 6 — kurulum sayfasi
    kur_s = basla(sunucu.telefon_kurulum_sunucusu(k, port=0, host="127.0.0.1"))
    kp = kur_s.server_address[1]
    durum, tur, govde = http_al(kp, yol="/lifeos-kok.cer")
    dogru("kurulum: kok sertifika iner", durum == 200 and govde == der, durum)
    dogru("kurulum: sertifika turu dogru", tur == "application/x-x509-ca-cert", tur)
    durum, tur, govde = http_al(kp)
    sayfa = govde.decode("utf-8", "replace")
    dogru("kurulum sayfasi yonergeyi verir", durum == 200 and "Sertifikayı indir" in sayfa, durum)
    dogru("kurulum sayfasi parmak izini gosterir", telefon.parmak_izi(y) in sayfa)
    yasak = ["/kok.key", "/sunucu.key", "/sunucu.crt", "/../kok.key", "/veri/", "/HKM/db/hkm.db",
             "/sistem/telefon.py", "/README.md", "/index.html/../../kok.key"]
    sizinti = []
    for yol in yasak:
        durum, _, govde = http_al(kp, yol=yol)
        if durum != 404 or b"PRIVATE KEY" in govde:
            sizinti.append((yol, durum))
    dogru("kurulum: ozel anahtar ve depo dosyalari verilmez", not sizinti, sizinti)
    dogru("kurulum: HEAD yok", http_al(kp, "HEAD")[0] == 501, http_al(kp, "HEAD")[0])
    dogru("kurulum: POST yok", http_al(kp, "POST", "/api/yeniden")[0] == 501)
    # Adres semasiz yazilinca tarayici https dener: kurulum kapisi onu da
    # karsilar (kok kurulmadan once uyari cikar, gecilebilir; sonra temiz).
    try:
        durum, govde = https_al(kp, y["kok"], ad="lifeos-test.local")
        tls_sayfa = durum == 200 and "Sertifikayı indir" in govde.decode("utf-8", "replace")
    except (ssl.SSLError, OSError) as e:
        tls_sayfa = repr(e)
    dogru("kurulum kapisi https ile gelen tarayiciya da sayfayi verir", tls_sayfa is True, tls_sayfa)
    try:
        durum, govde = https_al(kp, y["kok"], yol="/lifeos-kok.cer")
        tls_cer = durum == 200 and govde == der
    except (ssl.SSLError, OSError) as e:
        tls_cer = repr(e)
    dogru("kurulum kapisi https ile de kok sertifikayi verir", tls_cer is True, tls_cer)
    kur_s.shutdown()
    kur_s.server_close()

    # 7 — kapat
    telefon.kapat(k)
    dogru("kapatinca telefon kapali", not telefon.acik_mi(k))
    dogru("kapatinca ev agi kapisi acilmaz", sunucu.telefon_sunuculari(k) == ([], []))
    dogru("kapatinca kok kalir (telefona yeniden kurulmaz)", os.path.isfile(y["kok"]))

    # adresler: once .local, sonra IP
    a = telefon.adresler("lifeos-test", ["192.168.50.7"])
    dogru("adres sirasi: .local once, IP yedek",
          a["SPI"] == ["https://lifeos-test.local:5183/", "https://192.168.50.7:5183/"], a["SPI"])

print("kirmizi: %d" % kirmizi if kirmizi else "temiz")
sys.exit(1 if kirmizi else 0)
