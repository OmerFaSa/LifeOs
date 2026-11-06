#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""LifeOS — TELEFON (ev agi + https).

   NEDEN
   Tarayici kamerayi ve konumu yalniz GUVENLI bir kokene verir: https ya
   da bilgisayarin kendisi (localhost). Telefon bilgisayara ev aginden
   http ile baglaninca SPİ'nin kamerasi ve canli rota kaydi calismaz.
   Bu arac bir kez calistirilir: yerel bir kok sertifika ve bu bilgisayar
   icin bir sunucu sertifikasi uretir. Sertifika varsa sistem/sunucu.py
   uc modulu ev aginda https ile DE acar (bilgisayardaki 127.0.0.1
   adresleri ve onlarin verisi degismez).

   BILINCLI KARAR
   sunucu.py kendi basina disari acilmaz (kural 3). Bu araci calistirmak
   o karardir; `--kapat` geri alir. Sertifikalar DEPONUN DISINDA, kullanici
   klasorunde durur: ozel anahtar asla commit'e giremez.

   BAGIMLILIK
   Calisma aninda yalniz Python standart kutuphanesi (ssl). openssl yalniz
   BU KURULUMDA kullanilir (Windows'ta Git ile gelir); yoksa arac ne
   yapilacagini soyler ve hicbir sey yazmaz.

     python sistem/telefon.py            # kur (varsa yalniz gosterir)
     python sistem/telefon.py --yenile   # IP degisti: sunucu sertifikasini yenile
     python sistem/telefon.py --kapat    # ev agina acmayi kapat (kok kalir)
     python sistem/telefon.py --sil      # her seyi sil (telefona yeniden kurulur)
"""
import datetime
import hashlib
import ipaddress
import os
import shutil
import socket
import subprocess
import sys
import tempfile

# Ev agindaki https kapilari. Bilgisayardaki kapilarla (4173/4183/4193)
# KARISMAZ: ayri koken, ayri depo. Denetim araclarinin sabit kapilariyla
# (4176…4299) da cakismaz.
PORTLAR = {"AYS": 5173, "SPI": 5183, "ESP": 5193}
KURULUM_PORT = 5180          # http: yalniz yonerge + kok sertifikanin AÇIK kismi
KOK_GUN = 3650               # kok sertifika: on yil (telefona bir kez kurulur)
SUNUCU_GUN = 800             # iOS sunucu sertifikasini en cok 825 gun kabul eder
# Kok yalniz bu adlari imzalayabilir: kok.key calinsa bile baska site taklit edilemez.
# .ts.net ve Tailscale IP'si yok: o adresin sertifikasini Tailscale verir, bu kok imzalamaz.
# Ciplak bilgisayar adi da yok: tasinan kok baska adli bilgisayarda da gecerli kalsin.
KOK_ADLAR = ("local", "localhost")
KOK_AGLAR = tuple(ipaddress.ip_network(a) for a in
                  ("127.0.0.0/8", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"))
_AD_KISITI_OID = b"\x06\x03\x55\x1d\x1e"   # nameConstraints (2.5.29.30), DER icinde


def klasor():
    """Sertifikalarin yeri: deponun DISI. LIFEOS_TELEFON_KLASOR testler icin."""
    elle = os.environ.get("LIFEOS_TELEFON_KLASOR")
    if elle:
        return elle
    if os.name == "nt":
        temel = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
        return os.path.join(temel, "LifeOS", "telefon")
    return os.path.join(os.path.expanduser("~"), ".lifeos", "telefon")


def yollar(k=None):
    k = k or klasor()
    return {
        "kok_anahtar": os.path.join(k, "kok.key"),
        "kok": os.path.join(k, "kok.crt"),
        "kok_der": os.path.join(k, "lifeos-kok.cer"),
        "anahtar": os.path.join(k, "sunucu.key"),
        "sertifika": os.path.join(k, "sunucu.crt"),
        "yenilendi": os.path.join(k, "kok.yenilendi"),
    }


def acik_mi(k=None):
    """Ev agina acmak icin gereken dosyalar yerinde mi? (sunucu.py sorar)"""
    y = yollar(k)
    return all(os.path.isfile(y[a]) for a in ("sertifika", "anahtar", "kok_der"))


def ad():
    """Bilgisayarin agdaki adi: kucuk harf (mDNS adi `<ad>.local`)."""
    return (socket.gethostname() or "lifeos").split(".")[0].lower()


def ev_ipi_mi(ip):
    """Kokun imzalayabilecegi, disaridan ulasilabilir bir ev agi adresi mi?
    Kisit disi tek bir SAN butun sertifikayi reddettirir (ornegin VPN'in 198.18.x'i)."""
    try:
        a = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return a.version == 4 and not a.is_loopback and any(a in ag for ag in KOK_AGLAR)


def ipler():
    """Bu bilgisayarin ev agindaki IPv4 adresleri (kokun izinli araliklari).

    Birincil adres bir UDP soketinin «baglanmasiyla» bulunur: UDP connect
    paket gondermez, yalniz isletim sistemine hangi arayuzu kullanacagini
    sordurur."""
    bulunan = []
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(("10.255.255.255", 1))
            bulunan.append(s.getsockname()[0])
        finally:
            s.close()
    except OSError:
        pass
    try:
        for b in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            bulunan.append(b[4][0])
    except OSError:
        pass
    out = []
    for ip in bulunan:
        if ev_ipi_mi(ip) and ip not in out:
            out.append(ip)
    return out


def openssl_bul(bul=shutil.which, var=os.path.isfile):
    """openssl: PATH'te, yoksa Git for Windows'un getirdigi."""
    yol = bul("openssl")
    if yol:
        return yol
    for aday in (r"C:\Program Files\Git\mingw64\bin\openssl.exe",
                 r"C:\Program Files\Git\usr\bin\openssl.exe",
                 r"C:\Program Files (x86)\Git\mingw64\bin\openssl.exe"):
        if var(aday):
            return aday
    return None


def _kos(openssl, *arg):
    p = subprocess.run([openssl] + list(arg), capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError("openssl " + arg[0] + " başarısız: " + (p.stderr or p.stdout).strip()[:400])
    return p.stdout


def san_listesi(bilgisayar, ip_listesi):
    """Sunucu sertifikasinin adlari: mDNS adi, localhost, IP'ler. Hepsi kok kisitina sigar."""
    adlar = ["DNS:%s.local" % bilgisayar, "DNS:localhost"]
    adlar += ["IP:%s" % ip for ip in ip_listesi] + ["IP:127.0.0.1"]
    return ",".join(adlar)


def kok_kisiti():
    """openssl bicimi: yalniz KOK_ADLAR ve KOK_AGLAR izinli, kritik."""
    izinli = ["permitted;DNS:%s" % a for a in KOK_ADLAR]
    izinli += ["permitted;IP:%s/%s" % (ag.network_address, ag.netmask) for ag in KOK_AGLAR]
    return "nameConstraints=critical," + ",".join(izinli)


def kok_kisitli_mi(y):
    try:
        with open(y["kok_der"], "rb") as f:
            return _AD_KISITI_OID in f.read()
    except OSError:
        return False


def kok_kur(openssl, y, bilgisayar):
    """Yeni kok once yanda uretilir: openssl yarida kalirsa eski kok yerinde durur.
    Ad «Kok 2»: cihazda kisitsiz eskisiyle karismasin, kaldirilacak olan belli olsun."""
    with tempfile.TemporaryDirectory(dir=os.path.dirname(y["kok"])) as gecici:
        anahtar, kok, der = (os.path.join(gecici, a) for a in ("k", "c", "d"))
        _kos(openssl, "req", "-x509", "-newkey", "rsa:2048", "-nodes",
             "-keyout", anahtar, "-out", kok, "-days", str(KOK_GUN),
             "-subj", "/CN=LifeOS Yerel Kok 2 (%s)" % bilgisayar,
             "-addext", "basicConstraints=critical,CA:TRUE",
             "-addext", "keyUsage=critical,keyCertSign,cRLSign",
             "-addext", kok_kisiti())
        _kos(openssl, "x509", "-in", kok, "-outform", "DER", "-out", der)
        os.replace(anahtar, y["kok_anahtar"])
        os.replace(kok, y["kok"])
        os.replace(der, y["kok_der"])


def sunucu_kur(openssl, y, bilgisayar, ip_listesi):
    with tempfile.TemporaryDirectory() as gecici:
        csr = os.path.join(gecici, "sunucu.csr")
        ek = os.path.join(gecici, "ek.cnf")
        with open(ek, "w", encoding="ascii") as f:
            f.write("basicConstraints=critical,CA:FALSE\n"
                    "keyUsage=critical,digitalSignature,keyEncipherment\n"
                    "extendedKeyUsage=serverAuth\n"
                    "subjectAltName=%s\n" % san_listesi(bilgisayar, ip_listesi))
        _kos(openssl, "req", "-newkey", "rsa:2048", "-nodes",
             "-keyout", y["anahtar"], "-out", csr, "-subj", "/CN=%s.local" % bilgisayar)
        _kos(openssl, "x509", "-req", "-in", csr, "-CA", y["kok"], "-CAkey", y["kok_anahtar"],
             "-set_serial", str(int(datetime.datetime.now().timestamp() * 1000)),
             "-days", str(SUNUCU_GUN), "-sha256", "-extfile", ek, "-out", y["sertifika"])


def parmak_izi(y):
    """Kok sertifikanin SHA-256 parmak izi: telefondaki profilde gorunenle
    karsilastirilir (ev aginda biri dosyayi degistirmis mi?)."""
    with open(y["kok_der"], "rb") as f:
        h = hashlib.sha256(f.read()).hexdigest().upper()
    return " ".join(h[i:i + 2] for i in range(0, len(h), 2))


def kur(yenile=False, k=None, openssl=None, bilgisayar=None, ip_listesi=None):
    """Sertifikalari uretir. Kok varsa KORUNUR (telefona yeniden kurulmaz); yalniz
    sunucu sertifikasi yenilenir. Tek istisna ad kisiti olmayan eski koktur: yenisiyle
    degisir, eski anahtar silinir (cihazda kalan eski kok boylece zararsizlasir) ve
    Hesap › Cihazlar yeniden kurulumu bir kez soyler. Doner: yollar sozlugu."""
    k = k or klasor()
    y = yollar(k)
    openssl = openssl or openssl_bul()
    if not openssl:
        raise RuntimeError("openssl bulunamadı. Windows'ta Git for Windows ile gelir "
                           "(C:\\Program Files\\Git\\mingw64\\bin\\openssl.exe).")
    bilgisayar = bilgisayar or ad()
    ip_listesi = ipler() if ip_listesi is None else ip_listesi
    os.makedirs(k, exist_ok=True)
    kok_var = os.path.isfile(y["kok"]) and os.path.isfile(y["kok_anahtar"])
    if not (kok_var and kok_kisitli_mi(y)):
        kok_kur(openssl, y, bilgisayar)
        yenile = True
        try:
            os.remove(os.path.join(k, "sunucu.adlar"))   # sunucu imzasi yarida kalirsa tazele yeniden dener
        except OSError:
            pass
        if kok_var:
            with open(y["yenilendi"], "w", encoding="utf-8") as f:
                f.write(datetime.date.today().isoformat())
    if yenile or not acik_mi(k):
        sunucu_kur(openssl, y, bilgisayar, ip_listesi)
    return y


def tazele(k=None, openssl=None, bilgisayar=None, ip_listesi=None, simdi=None):
    """Sunucu acilirken: adres degistiyse (DHCP, yeni bilgisayar) ya da sertifikanin
    suresi bitiyorsa sunucu sertifikasini kendiliginden yeniler. Kok korunur: telefona
    bir sey kurulmaz. Kisitsiz eski kok burada yenisine gecer (kur). Yapamazsa eski
    sertifikayla surer. Doner: yenilendi mi."""
    k = k or klasor()
    if not acik_mi(k):
        return False
    bilgisayar = bilgisayar or ad()
    ip_listesi = ipler() if ip_listesi is None else ip_listesi
    istenen = san_listesi(bilgisayar, sorted(ip_listesi))
    kayit = os.path.join(k, "sunucu.adlar")
    try:
        with open(kayit, encoding="utf-8") as f:
            eski = f.read().strip()
    except OSError:
        eski = ""
    simdi = datetime.datetime.now().timestamp() if simdi is None else simdi
    yas = simdi - os.path.getmtime(yollar(k)["sertifika"])
    if eski == istenen and yas < (SUNUCU_GUN - 60) * 86400 and kok_kisitli_mi(yollar(k)):
        return False
    try:
        kur(yenile=True, k=k, openssl=openssl, bilgisayar=bilgisayar, ip_listesi=sorted(ip_listesi))
        with open(kayit, "w", encoding="utf-8") as f:
            f.write(istenen)
    except (RuntimeError, OSError):
        return False
    return True


def kok_yenilendi_mi(k=None):
    """Hesap › Cihazlar bunu kullanici «Tamam» diyene dek soyler."""
    return os.path.isfile(yollar(k)["yenilendi"])


def kok_yenilendi_tamam(k=None):
    try:
        os.remove(yollar(k)["yenilendi"])
    except FileNotFoundError:
        pass


def kapat(k=None):
    """Ev agina acmayi kapatir: sunucu sertifikasi silinir, kok kalir."""
    y = yollar(k)
    for a in ("anahtar", "sertifika"):
        if os.path.isfile(y[a]):
            os.remove(y[a])


def sil(k=None):
    k = k or klasor()
    if os.path.isdir(k):
        shutil.rmtree(k)


def adresler(bilgisayar=None, ip_listesi=None):
    """Telefonda acilacak adresler: once mDNS adi, sonra IP (yedek)."""
    bilgisayar = bilgisayar or ad()
    ip_listesi = ipler() if ip_listesi is None else ip_listesi
    out = {}
    for modul, port in PORTLAR.items():
        out[modul] = ["https://%s.local:%d/" % (bilgisayar, port)]
        out[modul] += ["https://%s:%d/" % (ip, port) for ip in ip_listesi]
    return out


MODUL_AD = {"AYS": "AYS", "SPI": "SPİ", "ESP": "ESP"}
MODUL_SAYFA = {"AYS": "AYS/dist/rota.html", "SPI": "SPI/dist/spi.html", "ESP": "ESP/dist/esp.html"}


def _simge(modul, kok_klasor):
    """Modulun kendi simgesi (dist'teki ilk PNG favicon); yoksa LifeOS logosu."""
    import base64
    import re
    try:
        with open(os.path.join(kok_klasor, MODUL_SAYFA[modul]), encoding="utf-8", errors="replace") as f:
            m = re.search(r'rel="icon" type="image/png" href="data:image/png;base64,([A-Za-z0-9+/=]+)"', f.read(400000))
        if m:
            return base64.b64decode(m.group(1))
    except (OSError, ValueError):
        pass
    with open(os.path.join(kok_klasor, "brand", "life", "logo.png"), "rb") as f:
        return f.read()


def profil(k=None, bilgisayar=None, ip_listesi=None, kok_klasor=None):
    """iPhone/iPad icin TEK dosya (.mobileconfig): kok sertifika + uc modulun ana
    ekran simgesi. «Ana Ekrana Ekle» uc kez yapilmaz. Adres, kurulum sayfasinin
    ilk adresiyle aynidir (veri o kokende durur). Kimlikler parmak izinden
    turetilir: yeniden kurulan profil eskisinin yerine gecer, ikinci kopya olmaz.
    Kok sertifikaya tam guveni Apple yine elle actirir (Sertifika Guven Ayarlari)."""
    import plistlib
    import uuid
    y = yollar(k)
    with open(y["kok_der"], "rb") as f:
        der = f.read()
    kok_klasor = kok_klasor or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    iz = hashlib.sha256(der).hexdigest()
    kimlik = lambda ek: str(uuid.uuid5(uuid.NAMESPACE_URL, "lifeos:%s:%s" % (iz, ek))).upper()
    a = adresler(bilgisayar, ip_listesi)
    icerik = [{"PayloadType": "com.apple.security.root", "PayloadVersion": 1,
               "PayloadIdentifier": "com.lifeos.yerel.kok", "PayloadUUID": kimlik("kok"),
               "PayloadDisplayName": "LifeOS Yerel Kök", "PayloadContent": der}]
    for m in ("AYS", "SPI", "ESP"):
        icerik.append({"PayloadType": "com.apple.webClip.managed", "PayloadVersion": 1,
                       "PayloadIdentifier": "com.lifeos.yerel." + m.lower(), "PayloadUUID": kimlik(m),
                       "PayloadDisplayName": MODUL_AD[m], "Label": MODUL_AD[m], "URL": a[m][0],
                       "Icon": _simge(m, kok_klasor), "FullScreen": True, "IsRemovable": True})
    return plistlib.dumps({"PayloadType": "Configuration", "PayloadVersion": 1,
                           "PayloadIdentifier": "com.lifeos.yerel", "PayloadUUID": kimlik("profil"),
                           "PayloadDisplayName": "LifeOS", "PayloadOrganization": "LifeOS · bu bilgisayar",
                           "PayloadDescription": "Bilgisayarındaki LifeOS'a güvenir ve AYS, SPİ, ESP'yi ana ekrana koyar. "
                                                 "Veri yalnız evdeki ağda dolaşır.",
                           "PayloadRemovalDisallowed": False, "PayloadContent": icerik})


def yonerge(bilgisayar=None, ip_listesi=None):
    """Telefon icin kurulum yonergesi (duz metin; kurulum sayfasi da kullanir)."""
    bilgisayar = bilgisayar or ad()
    ip_listesi = ipler() if ip_listesi is None else ip_listesi
    ip = ip_listesi[0] if ip_listesi else "<bilgisayarın-IP'si>"
    a = adresler(bilgisayar, ip_listesi)
    satir = [
        "1. Telefon bilgisayarla AYNI Wi-Fi'da olsun ve bu adresi aç:",
        "     http://%s:%d/" % (ip, KURULUM_PORT),
        "   «Sertifikayı indir»e dokun.",
        "",
        "2. Sertifikayı kur (yalnız LifeOS adreslerinde geçerlidir, başka siteye etki etmez):",
        "   iPhone : Ayarlar › İndirilen Profil › Yükle; sonra",
        "            Ayarlar › Genel › Hakkında › Sertifika Güven Ayarları ›",
        "            «LifeOS Yerel Kok 2» için tam güveni AÇ.",
        "   Android: Ayarlar › Güvenlik › Şifreleme ve kimlik bilgileri ›",
        "            Sertifika yükle › CA sertifikası › indirilen dosya.",
        "   Eskisi kuruluysa kaldır: Android'de Ayarlar › Güvenlik › Kullanıcı sertifikaları;",
        "   iPhone'da Ayarlar › Genel › VPN ve Cihaz Yönetimi › eski LifeOS profili.",
        "",
        "3. Modülü aç ve ana ekrana ekle (her modül ayrı):",
    ]
    for modul in ("AYS", "SPI", "ESP"):
        satir.append("   %-4s %s" % (modul, a[modul][0]))
    satir += [
        "   .local açılmazsa (bazı Android'ler) IP'li adres: https://%s:%d/ …" % (ip, PORTLAR["SPI"]),
        "   Bir modülü HEP AYNI adresten aç: adres değişirse veri ayrı bir",
        "   kökende kalır («silinmiş» görünür).",
        "   iPhone: Paylaş › Ana Ekrana Ekle — verin o uygulamada durur;",
        "   Safari sekmesindekiyle karışmaz, 7 gün kuralına takılmaz.",
        "",
        "4. Evde bir kez ana ekrandan aç: dosyalar telefona kaydedilir. Sonra",
        "   dışarıda internetsiz de açılır; kamera ve canlı rota çalışır.",
    ]
    return "\n".join(satir)


def _cikti_utf8():
    for akis in (sys.stdout, sys.stderr):
        try:
            akis.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass


def main(argv=None):
    _cikti_utf8()
    argv = sys.argv[1:] if argv is None else argv
    if "--sil" in argv:
        sil()
        print("Telefon sertifikaları silindi. Telefondaki «LifeOS Yerel Kok» profilini de kaldırabilirsin.")
        return 0
    if "--kapat" in argv:
        kapat()
        print("Ev ağına açma kapandı (LifeOS yeniden başlayınca). Kök sertifika duruyor;")
        print("yeniden açmak için: python sistem/telefon.py")
        return 0
    try:
        y = kur(yenile="--yenile" in argv)
    except RuntimeError as e:
        print("✕ " + str(e))
        return 1
    ipl = ipler()
    print("\nLifeOS — telefon (ev ağı + https)\n")
    print("  Sertifikalar : " + klasor())
    print("  Bilgisayar   : %s.local  ·  IP: %s" % (ad(), ", ".join(ipl) or "bulunamadı"))
    print("  Kök parmak izi (telefondaki profilde aynı olmalı):")
    print("    " + parmak_izi(y))
    print("\n  LifeOS'u yeniden başlat ki ev ağı kapıları açılsın:")
    print("    python sistem/baslat.py --yeniden")
    print("  Windows güvenlik duvarı Python için izin sorarsa «Özel ağlar»a izin ver.\n")
    print(yonerge(ad(), ipl))
    print("")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
