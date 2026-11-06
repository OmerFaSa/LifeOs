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
  8. Kok yalniz LifeOS adreslerini imzalayabilir (kritik nameConstraints): anahtar
     calinsa bile baska bir site taklit edilemez. Kisitsiz eski kok yenisine gecer.
Testler gecici klasorde calisir; kullanicinin gercek sertifikasina dokunmaz."""
import datetime
import hashlib
import http.client
import importlib.util
import os
import shutil
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


def imzala(y, gecici, san):
    """Calinmis anahtarla imzalanan sertifika: kisit bunu yakalamali."""
    d = tempfile.mkdtemp(dir=gecici)
    anahtar, csr, ek, cikti = (os.path.join(d, a) for a in ("k", "c", "e", "s"))
    subprocess.run([OPENSSL, "req", "-newkey", "rsa:2048", "-nodes", "-keyout", anahtar, "-out", csr,
                    "-subj", "/CN=x"], check=True, capture_output=True)
    with open(ek, "w", encoding="ascii") as f:
        f.write("subjectAltName=%s\n" % san)
    subprocess.run([OPENSSL, "x509", "-req", "-in", csr, "-CA", y["kok"], "-CAkey", y["kok_anahtar"],
                    "-set_serial", "1", "-days", "1", "-sha256", "-extfile", ek, "-out", cikti],
                   check=True, capture_output=True)
    return cikti


def dogrula(kok, sertifika):
    p = subprocess.run([OPENSSL, "verify", "-CAfile", kok, sertifika], capture_output=True, text=True)
    return p.returncode == 0, p.stdout + p.stderr


def eski_kok(y):
    """2026-11 oncesi kurulumun koku: ad kisiti yok."""
    subprocess.run([OPENSSL, "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", y["kok_anahtar"],
                    "-out", y["kok"], "-days", "3650", "-subj", "/CN=LifeOS Yerel Kok (pc)",
                    "-addext", "basicConstraints=critical,CA:TRUE", "-addext", "keyUsage=critical,keyCertSign,cRLSign"],
                   check=True, capture_output=True)
    subprocess.run([OPENSSL, "x509", "-in", y["kok"], "-outform", "DER", "-out", y["kok_der"]],
                   check=True, capture_output=True)


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

    # 2a — ad kisiti: izinli ad gecer, dis ad reddedilir (openssl verify zinciri denetler)
    dogru("kokte kritik ad kisiti var", "X509v3 Name Constraints: critical" in km, km[-600:])
    dogru("yeni kurulum «yenilendi» demez", not telefon.kok_yenilendi_mi(k))
    dogru("sunucu sertifikasi kisita sigar", dogrula(y["kok"], y["sertifika"])[0], dogrula(y["kok"], y["sertifika"])[1])
    for san in ("DNS:pc.local", "DNS:localhost", "IP:127.0.0.1", "IP:10.1.2.3", "IP:172.16.0.9", "IP:192.168.1.1"):
        gecti, cikti = dogrula(y["kok"], imzala(y, gecici, san))
        dogru("izinli ad gecer: " + san, gecti, cikti[-200:])
    for san in ("DNS:ornek.com", "DNS:www.google.com", "DNS:local.ornek.com", "DNS:evim.ts.net", "DNS:pc",
                "IP:8.8.8.8", "IP:172.32.0.1", "IP:100.100.1.1", "DNS:pc.local,DNS:banka.com"):
        gecti, cikti = dogrula(y["kok"], imzala(y, gecici, san))
        dogru("dis ad reddedilir: " + san, not gecti and "subtree" in cikti, cikti[-200:])
    dogru("ciplak ad SAN'da yok (tasinan kok baska adda da gecerli)", "DNS:lifeos-test," not in sm + ",")
    for ip, beklenen in (("192.168.1.5", True), ("10.0.0.2", True), ("172.20.0.1", True), ("127.0.0.1", False),
                         ("100.80.0.1", False), ("198.18.0.1", False), ("169.254.1.1", False), ("8.8.8.8", False)):
        dogru("ev_ipi_mi(%s) = %s" % (ip, beklenen), telefon.ev_ipi_mi(ip) is beklenen)

    # 2b — kisitsiz eski kok yenisine gecer; yanindaki dosyaya dokunulmaz, eski anahtar kalmaz
    e = os.path.join(gecici, "eski")
    ey = telefon.yollar(e)
    os.makedirs(e)
    eski_kok(ey)
    telefon.sunucu_kur(OPENSSL, ey, "pc", ["192.168.1.5"])
    with open(os.path.join(e, "baska.dosya"), "w") as f:
        f.write("veri")
    dogru("eski kok kisitsiz gorunur", not telefon.kok_kisitli_mi(ey))
    eski_iz = izi(ey["kok_anahtar"])
    dogru("openssl yoksa eski kokle surer", not telefon.tazele(e, "yok-boyle-openssl", "pc", ["192.168.1.5"])
          and izi(ey["kok_anahtar"]) == eski_iz and not telefon.kok_yenilendi_mi(e))
    dogru("acilista gecis yapilir", telefon.tazele(e, OPENSSL, "pc", ["192.168.1.5"]))
    dogru("yeni kok kisitli", telefon.kok_kisitli_mi(ey) and "Name Constraints: critical" in metin(ey["kok"]))
    dogru("eski anahtar kalmadi", izi(ey["kok_anahtar"]) != eski_iz)
    dogru("sunucu sertifikasi yeni kokle dogrulanir", dogrula(ey["kok"], ey["sertifika"])[0])
    dogru("Hesap › Cihazlar soyler", telefon.kok_yenilendi_mi(e))
    with open(os.path.join(e, "baska.dosya")) as f:
        dogru("baska dosyaya dokunulmadi", f.read() == "veri")
    kok2 = izi(ey["kok"])
    telefon.kok_yenilendi_tamam(e)
    dogru("ikinci acilista kok yeniden uretilmez", not telefon.tazele(e, OPENSSL, "pc", ["192.168.1.5"])
          and izi(ey["kok"]) == kok2 and not telefon.kok_yenilendi_mi(e))
    dogru("baska bilgisayar adinda kok gecerli kalir (tasima)", telefon.tazele(e, OPENSSL, "yeni-pc", ["10.0.0.4"])
          and izi(ey["kok"]) == kok2 and dogrula(ey["kok"], ey["sertifika"])[0])
    import plistlib
    with open(ey["kok_der"], "rb") as f:
        dogru("iPhone profili yeni koku tasir",
              plistlib.loads(telefon.profil(e, "pc", ["192.168.1.5"], str(KOK)))["PayloadContent"][0]["PayloadContent"] == f.read())
    telefon.kapat(e)
    eski_kok(ey)
    dogru("ev agi kapaliyken tazele koke dokunmaz (kural 3)", not telefon.tazele(e, OPENSSL, "pc", [])
          and not telefon.kok_kisitli_mi(ey))
    telefon.kur(k=e, openssl=OPENSSL, bilgisayar="pc", ip_listesi=[])
    dogru("ev agi yeniden acilinca gecis yapilir", telefon.kok_kisitli_mi(ey) and dogrula(ey["kok"], ey["sertifika"])[0])

    # 3 — yenileme koku korur
    kok_izi, sunucu_izi = izi(y["kok"]), izi(y["sertifika"])
    telefon.kur(k=k, openssl=OPENSSL, bilgisayar="lifeos-test", ip_listesi=["192.168.50.7"])
    dogru("ikinci kurulum hicbir seyi degistirmez",
          (izi(y["kok"]), izi(y["sertifika"])) == (kok_izi, sunucu_izi))
    telefon.kur(yenile=True, k=k, openssl=OPENSSL, bilgisayar="lifeos-test", ip_listesi=["192.168.50.8"])
    dogru("yenileme koku korur", izi(y["kok"]) == kok_izi)
    dogru("yenileme yeni IP'yi ekler", "IP Address:192.168.50.8" in metin(y["sertifika"]))

    # 3a — adres degisince kendiliginden yenilenir (telefona bir sey kurulmaz)
    tz = lambda ip, **e: telefon.tazele(k, OPENSSL, "lifeos-test", [ip], **e)
    dogru("ilk bakista ad listesi yazilir", tz("192.168.50.8"))
    dogru("ayni adreste yenilemez", not tz("192.168.50.8"))
    dogru("adres degisince yeniler", tz("192.168.50.9"))
    dogru("yeni adres sertifikada", "IP Address:192.168.50.9" in metin(y["sertifika"]))
    dogru("adres degisince kok ayni kalir", izi(y["kok"]) == kok_izi)
    dogru("suresi bitmeden yeniler", tz("192.168.50.9", simdi=time.time() + (telefon.SUNUCU_GUN - 30) * 86400))
    sertifika = izi(y["sertifika"])
    dogru("openssl yoksa eski sertifikayla surer",
          not telefon.tazele(k, "yok-boyle-openssl", "lifeos-test", ["192.168.50.1"]) and izi(y["sertifika"]) == sertifika)
    bos = os.path.join(gecici, "bos")
    dogru("ev agi kapaliysa tazele acmaz (kural 3)", not telefon.tazele(bos, OPENSSL, "lifeos-test", ["192.168.50.1"])
          and not telefon.acik_mi(bos))

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
    kaynak = yukle("kaynak", KOK / "uygulama" / "ios" / "kaynak.py").KAYNAK_ADRESI
    dogru("kurulum sayfasi AltStore kaynagini tek dokunusla ekler (CI'in yayimladigi adres)",
          'href="altstore://source?url=%s"' % kaynak in sayfa)
    dogru("kurulum sayfasi cihaza gore tek yol gosterir (iPhone/iPad profili, Android sertifikasi)",
          'data-cihaz="ios"' in sayfa and 'data-cihaz="android"' in sayfa and 'href="/lifeos.mobileconfig"' in sayfa)
    durum, tur, govde = http_al(kp, yol="/lifeos.mobileconfig")
    dogru("kurulum: iPhone profili iner", durum == 200 and tur == "application/x-apple-aspen-config", (durum, tur))
    import plistlib
    pr = plistlib.loads(govde)
    yuk = {x["PayloadType"]: x for x in pr["PayloadContent"]}
    klipler = [x for x in pr["PayloadContent"] if x["PayloadType"] == "com.apple.webClip.managed"]
    a = telefon.adresler(telefon.ad(), telefon.ipler())
    dogru("profil: kok sertifika ayni DER, ozel anahtar yok",
          yuk["com.apple.security.root"]["PayloadContent"] == der and b"PRIVATE KEY" not in govde)
    dogru("profil: uc modul ana ekranda, kurulum sayfasinin ilk adresiyle (veri ayni kokende)",
          [(k["Label"], k["URL"]) for k in klipler] == [("AYS", a["AYS"][0]), ("SPİ", a["SPI"][0]), ("ESP", a["ESP"][0])]
          and all(k["Icon"][:8] == b"\x89PNG\r\n\x1a\n" for k in klipler), [(k["Label"], k["URL"]) for k in klipler])
    dogru("profil: yeniden kurulunca eskisinin yerine gecer (kimlik sabit)",
          plistlib.loads(telefon.profil(k, telefon.ad(), telefon.ipler()))["PayloadUUID"] == pr["PayloadUUID"])
    dogru("kurulum sayfasi tek QR ile baglar","lifeos://bagla" in sayfa and ":%d/" % telefon.PORTLAR["SPI"] in sayfa)
    betik = sayfa[sayfa.index("<script>") + 8:sayfa.index("</script>")]
    with open(os.path.join(gecici, "kurulum.js"), "w", encoding="utf-8") as f:
        f.write(betik)
    if shutil.which("node"):
        r = subprocess.run(["node", "--check", os.path.join(gecici, "kurulum.js")], capture_output=True, text=True)
        dogru("kurulum sayfasinin betigi gecerli", r.returncode == 0, r.stderr[-200:])
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
