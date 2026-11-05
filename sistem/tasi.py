#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""LifeOS — YENI BILGISAYARA TASIMA (tek dosya, sifreli).

     python sistem/tasi.py --paket [dosya]   # eski bilgisayarda
     python sistem/tasi.py --ac <dosya>      # yeni bilgisayarda (kur.ps1 de sorar)

   Sozler:
     1. HEPSI TEK DOSYADA. Hesap deposu, kok sertifika (telefona yeniden kurulmaz),
        HKM verisi ve ayari, kendi arka planin ve muzigin, uygulamanin depolari.
        Oturum cerezleri tasinmaz (Windows bu makineye sifreler): yeniden girilir.
     2. SIFRELI. Paket sifresiz acilmaz; icindeki anahtarlar USB'de acik durmaz.
        Dosya degistiyse acilmaz (encrypt-then-MAC). Standart kutuphane AES vermez
        (AGENTS §1.3): scrypt anahtari, anahtarli blake2b sayac kipi, HMAC-SHA256.
     3. USTUNE YAZMAZ. Yeni bilgisayarda var olan her sey once «.once-<tarih>» adiyla
        kenara alinir; hicbir sey silinmez.
     4. LIFEOS KAPALIYKEN. Acik uygulama dosyalarini tutar; kopya yarim olurdu.
        Aciksa betik onu kendisi kapatir, is bitince yeniden acar.
     5. API ANAHTARLARI YASAR. Windows kasasi bu makineye baglidir; config.json'daki
        «kasa:» gondermesi yeni bilgisayarda olu kalirdi. Pakete (sifreli) deger
        olarak girer, yeni bilgisayarda yine kasaya yazilir. Eski kasaya dokunulmaz.
"""

import getpass
import hashlib
import hmac
import importlib.util
import json
import os
import shutil
import socket
import sqlite3
import subprocess
import sys
import tempfile
import time
import zipfile

SISTEM = os.path.dirname(os.path.abspath(__file__))
KOK = os.path.dirname(SISTEM)
sys.path.insert(0, SISTEM)
sys.dont_write_bytecode = True

import ayar  # noqa: E402
import hesap  # noqa: E402
import muzik  # noqa: E402
import planlama  # noqa: E402
import telefon  # noqa: E402
import zemin  # noqa: E402

BASLIK = b"LIFEOSTASI1\n"
EN_KISA_PAROLA = 8
OBEK = 1024 * 1024
MEDYA = ("ev/zemin", "ev/muzik")      # zaten sikismis: yeniden sikistirilmaz
UYARI = "Şifre yanlış."
BOZUK = "Dosya bozuk ya da değiştirilmiş; açılmadı."


class Hata(Exception):
    pass


def yerler(kok=KOK, profil=None):
    """Paketteki ad → bilgisayardaki yol. Liste kapalidir: yalniz bunlar tasinir."""
    if profil is None:
        temel = os.environ.get("APPDATA") or os.path.expanduser("~")
        profil = os.path.join(temel, "LifeOS")
    return {
        "ev/telefon": telefon.klasor(),
        "ev/zemin": zemin.klasor(),
        "ev/muzik": muzik.klasor(),
        "ev/ayar.json": os.path.join(ayar.klasor(), "ayar.json"),
        "ev/planlama.json": os.path.join(planlama.klasor(), "planlama.json"),
        "hkm/db": os.path.join(kok, "HKM", "db"),
        "hkm/config.json": os.path.join(kok, "HKM", "config.json"),
        "profil/Local Storage": os.path.join(profil, "Local Storage"),
        "profil/IndexedDB": os.path.join(profil, "IndexedDB"),
        "profil/WebStorage": os.path.join(profil, "WebStorage"),
    }


HESAP_ADI = "ev/hesap/hesap.db"
CONFIG_ADI = "hkm/config.json"
KASA = None                     # testler bellek ici kasa koyar (HKM/core/kasa.py kural 4)


def _kasa(kok):
    global KASA
    if KASA is None:
        s = importlib.util.spec_from_file_location("lifeos_kasa", os.path.join(kok, "HKM", "core", "kasa.py"))
        KASA = importlib.util.module_from_spec(s)
        s.loader.exec_module(KASA)
    return KASA


def _config_oku(yol):
    try:
        with open(yol, encoding="utf-8") as f:
            v = json.load(f)
    except (OSError, ValueError):
        return None
    return v if isinstance(v, dict) else None


def _kasadan_ac(cfg, kasa):
    """Soz 5. Doner: okunamayan saglayicilar. Kasadan silmez (kasa.geri siler)."""
    okunamayan = []
    for saglayici, e in kasa._anahtar_listeleri(cfg):
        if kasa.gonderme_mi(e["key"]):
            deger = kasa.oku(e["key"])
            if deger is None:
                okunamayan.append(saglayici)
            else:
                e["key"] = deger
    return okunamayan


def _anahtarlar(parola, tuz):
    k = hashlib.scrypt(parola.encode("utf-8"), salt=tuz, n=2 ** 15, r=8, p=1, maxmem=2 ** 26, dklen=96)
    return k[:32], k[32:64], k[64:]


class _Akis:
    """Anahtarli blake2b sayac kipi: her tuzun anahtari tektir, ayni akis tekrarlanmaz."""

    def __init__(self, anahtar):
        self.anahtar = anahtar
        self.sayac = 0
        self.kalan = b""

    def xor(self, veri):
        n = len(veri)
        if n == 0:
            return b""
        parcalar = [self.kalan]
        boy = len(self.kalan)
        while boy < n:
            parcalar.append(hashlib.blake2b(self.sayac.to_bytes(16, "little"), key=self.anahtar, digest_size=64).digest())
            self.sayac += 1
            boy += 64
        akis = b"".join(parcalar)
        self.kalan = akis[n:]
        return (int.from_bytes(veri, "little") ^ int.from_bytes(akis[:n], "little")).to_bytes(n, "little")


class _SifreliYazici:
    """ZipFile buraya yazar: duz metin diske hic inmez."""

    def __init__(self, f, parola):
        tuz = os.urandom(16)
        sifre, mac, kontrol = _anahtarlar(parola, tuz)
        self.f = f
        self.akis = _Akis(sifre)
        self.mac = hmac.new(mac, digestmod=hashlib.sha256)
        bas = BASLIK + tuz + hmac.new(kontrol, BASLIK, hashlib.sha256).digest()
        f.write(bas)
        self.mac.update(bas)

    def write(self, veri):
        c = self.akis.xor(bytes(veri))
        self.f.write(c)
        self.mac.update(c)
        return len(veri)

    def flush(self):
        self.f.flush()

    def bitir(self):
        self.f.write(self.mac.digest())


def calisiyor(port=4180):
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.5):
            return True
    except OSError:
        return False


def _dosyalar(ad, yol):
    if os.path.isfile(yol):
        yield ad, yol
    elif os.path.isdir(yol):
        for kok, _, liste in os.walk(yol):
            for x in sorted(liste):
                tam = os.path.join(kok, x)
                yield ad + "/" + os.path.relpath(tam, yol).replace(os.sep, "/"), tam


def paket_yap(hedef, parola, kok=KOK, profil=None, hesap_db=None):
    """Doner: {"dosya": adet, "bayt": boyut}. Yarim dosya birakmaz."""
    if len(parola) < EN_KISA_PAROLA:
        raise Hata("Şifre en az %d karakter olmalı." % EN_KISA_PAROLA)
    gecici = hedef + ".yaziliyor"
    adet = 0
    okunamayan = []
    with tempfile.TemporaryDirectory() as t:
        with open(gecici, "wb") as f:
            y = _SifreliYazici(f, parola)
            with zipfile.ZipFile(y, "w", allowZip64=True) as z:
                kaynak = hesap_db or os.path.join(hesap.klasor(), "hesap.db")
                if os.path.isfile(kaynak):
                    # Dosya kopyasi degil: yedek API'si tutarli bir anlik goruntu verir.
                    kopya = os.path.join(t, "hesap.db")
                    a, b = sqlite3.connect(kaynak), sqlite3.connect(kopya)
                    try:
                        a.backup(b)
                    finally:
                        b.close()
                        a.close()
                    z.write(kopya, HESAP_ADI, compress_type=zipfile.ZIP_DEFLATED)
                    adet += 1
                for ad, yol in yerler(kok, profil).items():
                    tur = zipfile.ZIP_STORED if ad in MEDYA else zipfile.ZIP_DEFLATED
                    cfg = _config_oku(yol) if ad == CONFIG_ADI else None
                    if cfg is not None:
                        okunamayan = _kasadan_ac(cfg, _kasa(kok))
                        z.writestr(ad, json.dumps(cfg, ensure_ascii=False, indent=1).encode("utf-8"),
                                   compress_type=zipfile.ZIP_DEFLATED)
                        adet += 1
                        continue
                    for ic, tam in _dosyalar(ad, yol):
                        try:
                            z.write(tam, ic, compress_type=tur)
                        except OSError as e:
                            raise Hata("Okunamadı: %s (%s). LifeOS kapalı mı?" % (tam, e))
                        adet += 1
            y.bitir()
    os.replace(gecici, hedef)
    return {"dosya": adet, "bayt": os.path.getsize(hedef), "okunamayan": okunamayan}


def _coz(yol, parola, cikti):
    """Once butun dosyanin MAC'i, sonra cozme: degismis veri diske hic yazilmaz."""
    boy = os.path.getsize(yol)
    if boy < len(BASLIK) + 16 + 32 + 32:
        raise Hata(BOZUK)
    with open(yol, "rb") as f:
        if f.read(len(BASLIK)) != BASLIK:
            raise Hata("Bu bir LifeOS taşıma paketi değil.")
        tuz, kontrol = f.read(16), f.read(32)
        sifre, mac_k, kontrol_k = _anahtarlar(parola, tuz)
        if not hmac.compare_digest(hmac.new(kontrol_k, BASLIK, hashlib.sha256).digest(), kontrol):
            raise Hata(UYARI)
        govde_bas = f.tell()
        govde_boy = boy - govde_bas - 32
        mac = hmac.new(mac_k, BASLIK + tuz + kontrol, hashlib.sha256)
        kalan = govde_boy
        while kalan:
            p = f.read(min(OBEK, kalan))
            if not p:
                raise Hata(BOZUK)
            mac.update(p)
            kalan -= len(p)
        if not hmac.compare_digest(mac.digest(), f.read(32)):
            raise Hata(BOZUK)
        f.seek(govde_bas)
        akis = _Akis(sifre)
        kalan = govde_boy
        with open(cikti, "wb") as o:
            while kalan:
                p = f.read(min(OBEK, kalan))
                o.write(akis.xor(p))
                kalan -= len(p)


def _guvenli_ad(ad, izinli):
    if ad.startswith("/") or "\\" in ad or ":" in ad or ".." in ad.split("/"):
        return None
    for k in izinli:
        if ad == k:
            return k, ""
        if ad.startswith(k + "/"):
            return k, ad[len(k) + 1:]
    return None


def paket_ac(yol, parola, kok=KOK, profil=None, hesap_db=None, simdi=None):
    """Doner: {"dosya": adet, "kenarda": [yol]}. Var olan once kenara alinir (soz 3)."""
    harita = yerler(kok, profil)
    harita[HESAP_ADI] = hesap_db or os.path.join(hesap.klasor(), "hesap.db")
    ek = time.strftime(".once-%Y%m%d-%H%M%S", time.localtime(simdi))
    kenarda = []
    adet = 0
    calisma = os.path.dirname(os.path.abspath(harita[HESAP_ADI]))
    os.makedirs(calisma, exist_ok=True)
    fd, duz = tempfile.mkstemp(prefix="lifeos-tasima-", dir=calisma)
    os.close(fd)
    try:
        _coz(yol, parola, duz)
        with zipfile.ZipFile(duz) as z:
            adlar = [i for i in z.infolist() if not i.is_dir()]
            cozulen = [(i, _guvenli_ad(i.filename, harita)) for i in adlar]
            if any(c is None for _, c in cozulen):
                raise Hata(BOZUK)                 # MAC gecti ama listede olmayan yol: acma
            for k in {c[0] for _, c in cozulen}:
                if os.path.exists(harita[k]):
                    os.replace(harita[k], harita[k] + ek)
                    kenarda.append(harita[k] + ek)
            for i, (k, alt) in cozulen:
                hedef = os.path.join(harita[k], *alt.split("/")) if alt else harita[k]
                os.makedirs(os.path.dirname(hedef), exist_ok=True)
                with z.open(i) as g, open(hedef, "wb") as c:
                    shutil.copyfileobj(g, c, OBEK)
                adet += 1
    finally:
        os.remove(duz)
    return {"dosya": adet, "kenarda": kenarda, "kasa": _kasaya_koy(harita[CONFIG_ADI], kok)}


def _kasaya_koy(yol, kok):
    """Yeni bilgisayarin kasasina (soz 5). Olmazsa anahtarlar config.json'da calisir."""
    cfg = _config_oku(yol)
    if cfg is None:
        return 0
    yeni, n, hata = _kasa(kok).tasi(cfg)
    if hata or not n:
        return 0
    gecici = yol + ".yaziliyor"
    with open(gecici, "w", encoding="utf-8") as f:
        json.dump(yeni, f, ensure_ascii=False, indent=1)
    os.replace(gecici, yol)
    return n


def _parola_al(tekrar):
    elle = os.environ.get("LIFEOS_TASI_PAROLA")
    if elle:
        return elle
    p = getpass.getpass("  Paket şifresi: ")
    if tekrar and getpass.getpass("  Şifre (tekrar): ") != p:
        raise Hata("İki şifre aynı değil.")
    return p


def _masaustu():
    m = os.path.join(os.path.expanduser("~"), "Desktop")
    return m if os.path.isdir(m) else os.path.expanduser("~")


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    for ad in ("stdout", "stderr"):
        try:
            getattr(sys, ad).reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    print("\nLifeOS taşıma\n")
    if not argv or argv[0] not in ("--paket", "--ac") or (argv[0] == "--ac" and len(argv) < 2):
        print(__doc__)
        return 2
    acikti = calisiyor()
    if acikti and not kapat():
        print("  ✕ LifeOS kapanmadı. Elle kapat: python sistem/baslat.py --dur")
        return 1
    try:
        return _is(argv)
    finally:
        if acikti:
            ac()
            print("  LifeOS yeniden açıldı.")


def kapat(calistir=subprocess.call, acik_mi=calisiyor, bekle=time.sleep, sure=15):
    """Soz 4: acik dosya kopyayi yarim birakir. Elle kapatma adimi olmasin diye
    LifeOS'u kendisi kapatir (baslat.py --dur) ve kapandigini bekler."""
    print("  LifeOS kapatılıyor (paket bitince yeniden açılır)…")
    calistir([sys.executable, os.path.join(SISTEM, "baslat.py"), "--dur"],
             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(int(sure * 2)):
        if not acik_mi():
            return True
        bekle(0.5)
    return False


def ac(calistir=subprocess.Popen):
    calistir([sys.executable, os.path.join(SISTEM, "baslat.py"), "--tarayicisiz"],
             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, cwd=KOK)


def _is(argv):
    try:
        if argv[0] == "--paket":
            hedef = argv[1] if len(argv) > 1 else os.path.join(_masaustu(), time.strftime("LifeOS-tasima-%Y%m%d.lifeos"))
            s = paket_yap(hedef, _parola_al(True))
            print("  ✓ %d dosya, %.1f MB: %s" % (s["dosya"], s["bayt"] / 1e6, hedef))
            if s["okunamayan"]:
                print("  ! Kasadan okunamayan anahtar: %s. Yeni bilgisayarda yeniden girilir." % ", ".join(sorted(set(s["okunamayan"]))))
            print("  Dosyayı yeni bilgisayara taşı; açmak için bu şifre gerekir.")
        else:
            s = paket_ac(argv[1], _parola_al(False))
            print("  ✓ %d dosya yerine kondu." % s["dosya"])
            for k in s["kenarda"]:
                print("  • Eskisi kenarda: " + k)
            print("  Hesabına önceki şifrenle gir. Telefon yeni adresi Hesap › Kodla bağlan'da alır.")
    except Hata as e:
        print("  ✕ " + str(e))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
