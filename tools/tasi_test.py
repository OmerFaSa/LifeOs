#!/usr/bin/env python3
"""Tasima paketi (sistem/tasi.py) testi: python3 tools/tasi_test.py   (cikis 0 temiz, 1 kirmizi)

Gercek dosyalarla, gecici klasorlerde. Korunan sozler: her sey tek dosyada, sifresiz
acilmaz, degismis dosya acilmaz, duz metin pakette gorunmez, var olan silinmez,
listede olmayan yola yazilmaz. Kullanicinin hicbir dosyasina dokunmaz."""
import os
import shutil
import sqlite3
import sys
import tempfile
import zipfile
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KOK / "sistem"))
sys.dont_write_bytecode = True

kirmizi = 0


def dogru(ad, kosul, ek=""):
    global kirmizi
    print(("  ✓ " if kosul else "  ✕ ") + ad + ("" if kosul else "  %r" % (ek,)))
    kirmizi += 0 if kosul else 1


try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

t = tempfile.mkdtemp(prefix="lifeos-tasi-")
ortam = {}
for ad, alt in (("LIFEOS_PLAN_KLASOR", "ev"), ("LIFEOS_HESAP_KLASOR", "ev/hesap"), ("LIFEOS_ZEMIN_KLASOR", "ev/zemin"), ("LIFEOS_MUZIK_KLASOR", "ev/muzik"), ("LIFEOS_AYAR_KLASOR", "ev"), ("APPDATA", "appdata")):
    ortam[ad] = os.environ.get(ad)
    os.environ[ad] = os.path.join(t, alt)

import tasi  # noqa: E402

# Testler gercek kasaya dokunmaz (HKM/core/kasa.py kural 4).
_bellek = {"LifeOS/HKM/google:k1": "gercek-anahtar"}
_kasa = tasi._kasa(str(KOK))
_kasa.ARKA = {"yaz": lambda h, d: _bellek.__setitem__(h, d) or True, "oku": _bellek.get, "sil": lambda h: _bellek.pop(h, None) and True}
_kasa.destek = lambda: True

GIZLI = b"GIZLI-ANAHTAR-burada-acik-durmamali"


def yaz(yol, veri=b"x"):
    os.makedirs(os.path.dirname(yol), exist_ok=True)
    with open(yol, "wb") as f:
        f.write(veri)


def oku(yol):
    with open(yol, "rb") as f:
        return f.read()


try:
    eski = os.path.join(t, "depo-eski")
    ev = os.path.join(t, "ev")
    yaz(os.path.join(ev, "muzik", "gizli.key"), GIZLI)
    yaz(os.path.join(ev, "zemin", "gunduz.mp4"), bytes(range(256)) * 400)
    yaz(os.path.join(ev, "muzik", "liste.json"), b"[]")
    yaz(os.path.join(ev, "ayar.json"), b'{"a":1}')
    yaz(os.path.join(ev, "planlama.json"), b"{}")
    yaz(os.path.join(eski, "HKM", "db", "alt", "hkm.db"), b"hkm")
    yaz(os.path.join(eski, "HKM", "config.json"), GIZLI)
    yaz(os.path.join(t, "appdata", "LifeOS", "Local Storage", "leveldb", "000.log"), b"depo")
    yaz(os.path.join(t, "appdata", "LifeOS", "Cache", "buyuk.bin"), b"onbellek")
    os.makedirs(os.path.join(ev, "hesap"), exist_ok=True)
    db = os.path.join(ev, "hesap", "hesap.db")
    c = sqlite3.connect(db)
    c.execute("CREATE TABLE k(a)")
    c.execute("INSERT INTO k VALUES('hesabim')")
    c.commit()
    c.close()
    # Paket yapilirken baska kayit eklenmemis olsa da yedek API'si tutarli kopya verir.
    paket = os.path.join(t, "tasima.lifeos")
    parola = "parola-1234"
    try:
        tasi.paket_yap(paket, "kisa", kok=eski)
        dogru("kisa sifre reddedilir", False)
    except tasi.Hata:
        dogru("kisa sifre reddedilir", True)
    s = tasi.paket_yap(paket, parola, kok=eski)
    dogru("hepsi tek dosyada", s["dosya"] == 9, s)
    ham = oku(paket)
    dogru("anahtar pakette acik durmaz", GIZLI not in ham)
    dogru("zip olarak acilmaz", not zipfile.is_zipfile(paket))
    dogru("yarim dosya kalmaz", not os.path.exists(paket + ".yaziliyor"))

    # Yeni bilgisayar: temiz + bir de var olan dosya.
    for x in ("ev/zemin", "ev/muzik", "ev/hesap", "appdata"):
        shutil.rmtree(os.path.join(t, x))
    os.remove(os.path.join(ev, "ayar.json"))
    os.remove(os.path.join(ev, "planlama.json"))
    yeni = os.path.join(t, "depo-yeni")
    yaz(os.path.join(yeni, "HKM", "config.json"), b"yeni-bilgisayarin-ayari")
    yaz(os.path.join(ev, "muzik", "benim.mp3"), b"silinmemeli")

    for parola_, beklenen in (("yanlis-sifre", tasi.UYARI),):
        try:
            tasi.paket_ac(paket, parola_, kok=yeni)
            dogru("yanlis sifre acmaz", False)
        except tasi.Hata as e:
            dogru("yanlis sifre acmaz ve soyler", str(e) == beklenen, str(e))
    dogru("yanlis sifre hicbir sey yazmaz", not os.path.exists(os.path.join(ev, "zemin")))

    bozuk = os.path.join(t, "bozuk.lifeos")
    b = bytearray(ham)
    b[len(b) // 2] ^= 1
    yaz(bozuk, bytes(b))
    try:
        tasi.paket_ac(bozuk, parola, kok=yeni)
        dogru("degismis paket acilmaz", False)
    except tasi.Hata as e:
        dogru("degismis paket acilmaz", str(e) == tasi.BOZUK, str(e))
    dogru("degismis paket hicbir sey yazmaz", not os.path.exists(os.path.join(ev, "zemin")))
    yaz(bozuk, ham[:-40])
    try:
        tasi.paket_ac(bozuk, parola, kok=yeni)
        dogru("kesik paket acilmaz", False)
    except tasi.Hata:
        dogru("kesik paket acilmaz", True)

    a = tasi.paket_ac(paket, parola, kok=yeni, simdi=1_800_000_000)
    dogru("acildi", a["dosya"] == 9, a)
    dogru("anahtar geri geldi", oku(os.path.join(ev, "muzik", "gizli.key")) == GIZLI)
    dogru("medya bayt bayt ayni", oku(os.path.join(ev, "zemin", "gunduz.mp4")) == bytes(range(256)) * 400)
    dogru("HKM alt klasor", oku(os.path.join(yeni, "HKM", "db", "alt", "hkm.db")) == b"hkm")
    dogru("uygulama deposu", oku(os.path.join(t, "appdata", "LifeOS", "Local Storage", "leveldb", "000.log")) == b"depo")
    dogru("onbellek tasinmaz", not os.path.exists(os.path.join(t, "appdata", "LifeOS", "Cache")))
    c = sqlite3.connect(os.path.join(ev, "hesap", "hesap.db"))
    dogru("hesap deposu calisir", c.execute("SELECT a FROM k").fetchone() == ("hesabim",))
    c.close()
    dogru("yeni bilgisayarin dosyasi yerine yenisi", oku(os.path.join(yeni, "HKM", "config.json")) == GIZLI)
    kenar = [k for k in a["kenarda"] if "config.json" in k]
    dogru("var olan silinmez, kenara alinir", kenar and oku(kenar[0]) == b"yeni-bilgisayarin-ayari", a["kenarda"])
    kenar = [k for k in a["kenarda"] if os.path.basename(k).startswith("muzik")]
    dogru("var olan klasor de kenarda", kenar and oku(os.path.join(kenar[0], "benim.mp3")) == b"silinmemeli", a["kenarda"])
    dogru("duz metin gecici dosya kalmaz", not [x for x in os.listdir(os.path.join(ev, "hesap")) if x.startswith("lifeos-tasima-")])

    # Sifre dogru ama icinde listede olmayan yol: yazilmaz (kotu niyetli paket).
    z_yol = os.path.join(t, "kotu.zip")
    with zipfile.ZipFile(z_yol, "w") as z:
        z.writestr("../../disari.txt", b"x")
    kotu = os.path.join(t, "kotu.lifeos")
    with open(kotu, "wb") as f:
        y = tasi._SifreliYazici(f, parola)
        y.write(oku(z_yol))
        y.bitir()
    try:
        tasi.paket_ac(kotu, parola, kok=yeni)
        dogru("listede olmayan yola yazilmaz", False)
    except tasi.Hata:
        dogru("listede olmayan yola yazilmaz", True)
    dogru("disariya dosya yok", not os.path.exists(os.path.join(t, "disari.txt")))
    dogru("guvenli ad", tasi._guvenli_ad("ev/zemin/a.mp4", {"ev/zemin": 1}) == ("ev/zemin", "a.mp4")
          and tasi._guvenli_ad("ev/zemin/../x", {"ev/zemin": 1}) is None
          and tasi._guvenli_ad("C:/x", {"ev/zemin": 1}) is None
          and tasi._guvenli_ad("baska/x", {"ev/zemin": 1}) is None)

    # API anahtarlari: kasadaki deger pakete sifreli girer, yeni kasaya yazilir.
    import json
    eski2 = os.path.join(t, "depo-kasa")
    cfg = {"local_token": "t", "models": {"keys": {"google": [{"id": "k1", "key": "kasa:google:k1"}],
                                                  "groq": [{"id": "k2", "key": "kasa:groq:yok"}]}}}
    yaz(os.path.join(eski2, "HKM", "config.json"), json.dumps(cfg).encode())
    p2 = os.path.join(t, "kasa.lifeos")
    s2 = tasi.paket_yap(p2, parola, kok=eski2)
    dogru("okunamayan anahtar soylenir", s2["okunamayan"] == ["groq"], s2)
    dogru("anahtar pakette acik durmaz (kasa)", b"gercek-anahtar" not in oku(p2))
    dogru("eski kasadan silinmez", "LifeOS/HKM/google:k1" in _bellek)
    del _bellek["LifeOS/HKM/google:k1"]                       # yeni bilgisayarin kasasi bos
    yeni2 = os.path.join(t, "depo-kasa2")
    a2 = tasi.paket_ac(p2, parola, kok=yeni2)
    dogru("yeni kasaya yazilir", a2["kasa"] == 1 and _bellek.get("LifeOS/HKM/google:k1") == "gercek-anahtar", a2)
    c2 = json.loads(oku(os.path.join(yeni2, "HKM", "config.json")))
    dogru("config'te yine gonderme kalir", c2["models"]["keys"]["google"][0]["key"] == "kasa:google:k1", c2)

    # Akis parca sinirindan bagimsiz: yazma ve cozme farkli obeklerle.
    a1, a2 = tasi._Akis(b"k" * 32), tasi._Akis(b"k" * 32)
    veri = os.urandom(1000)
    sifreli = b"".join(a1.xor(veri[i:i + 7]) for i in range(0, 1000, 7))
    dogru("akis obekten bagimsiz", a2.xor(sifreli) == veri)

    # LifeOS aciksa betik kendisi kapatir (elle adim yok); kapanmazsa ise baslamaz.
    komut, durum = [], iter([True, True, False])
    dogru("acik LifeOS'u baslat.py --dur ile kapatir ve bekler",
          tasi.kapat(calistir=lambda a, **k: komut.append(a), acik_mi=lambda: next(durum), bekle=lambda s: None)
          and komut[0][-2:] == [os.path.join(tasi.SISTEM, "baslat.py"), "--dur"], komut)
    dogru("kapanmazsa vazgecer", not tasi.kapat(calistir=lambda a, **k: None, acik_mi=lambda: True,
                                                bekle=lambda s: None, sure=1))
    acilan = []
    tasi.ac(calistir=lambda a, **k: acilan.append(a))
    dogru("sonra tarayicisiz yeniden acar", acilan and acilan[0][-1] == "--tarayicisiz", acilan)
finally:
    for ad, v in ortam.items():
        if v is None:
            os.environ.pop(ad, None)
        else:
            os.environ[ad] = v
    shutil.rmtree(t, ignore_errors=True)

print("temiz" if not kirmizi else "%d KIRMIZI" % kirmizi)
sys.exit(1 if kirmizi else 0)
