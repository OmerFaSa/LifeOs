#!/usr/bin/env python3
"""Kabul testi, gorev 081: sistem/ayar.py telefonla iki yonlu esitleme.

   python3 tools/ayar_esit_kabul_test.py     (cikis 0 temiz, 1 kirmizi)"""
import importlib.util
import io
import json
import sys
import tempfile
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("ayar", KOK / "sistem" / "ayar.py")
A = importlib.util.module_from_spec(spec)
spec.loader.exec_module(A)
hata = []
TEMA, YAZI, SES = "lifeos.tema.secim", "lifeos.yazi", "lifeos.ses"


def bekle(ad, kosul):
    if not kosul:
        hata.append(ad)


class Sahte:
    def __init__(self, komut, yol, ip="127.0.0.1", govde=None, baslik=True):
        b = json.dumps(govde).encode("utf-8") if govde is not None else b""
        self.command, self.path, self.client_address = komut, yol, (ip, 5000)
        self.headers = {"Content-Length": str(len(b))}
        if baslik:
            self.headers["X-LifeOS"] = "ayar"
        self.rfile, self.wfile, self.kod = io.BytesIO(b), io.BytesIO(), None

    def send_response(self, k):
        self.kod = k

    def send_header(self, *a):
        pass

    def end_headers(self):
        pass

    def cevap(self):
        return json.loads(self.wfile.getvalue().decode("utf-8"))


with tempfile.TemporaryDirectory() as k:
    # 1. PC'nin yazisi iz birakir
    d, red = A.birlestir({TEMA: "koyu"}, kok=k, simdi=1000)
    iz = d.get("iz", {}).get(TEMA, {})
    bekle("1 birlestir iz: z ve s ms, cihaz pc", iz.get("z") == 1000 and iz.get("s") == 1000 and iz.get("c") == "pc")
    bekle("1 birlestir iz: ad Bu bilgisayar", iz.get("a") == "Bu bilgisayar")
    bekle("1 oku iz ve cakisma doner", A.oku(k).get("iz", {}).get(TEMA, {}).get("z") == 1000 and A.oku(k).get("cakisma") == [])

    # 2. ilk esitleme ezmez, olmayani ekler, cakisma yazmaz
    c = A.esitle("tel-1", "iPhone", 0, {TEMA: {"d": "acik", "z": 1500}, YAZI: {"d": "buyuk", "z": 1500}}, kok=k, simdi=2000)
    bekle("2 ilk esitleme sunucudakini ezmez", c["ayar"].get(TEMA) == "koyu")
    bekle("2 ilk esitleme olmayani ekler", c["ayar"].get(YAZI) == "buyuk" and A.oku(k)["ayar"].get(YAZI) == "buyuk")
    bekle("2 ilk esitlemede cakisma yok", c["cakisma"] == [] and A.oku(k)["cakisma"] == [])
    bekle("2 son sunucunun simdisi", c["son"] == 2000)
    bekle("2 kabul sayisi 1", c["kabul"] == 1)
    bekle("2 iz cihaz ve ad", c["iz"][YAZI]["c"] == "tel-1" and c["iz"][YAZI]["a"] == "iPhone" and c["iz"][YAZI]["s"] == 2000)

    # 3. olagan guncelleme
    c = A.esitle("tel-1", "iPhone", 2000, {YAZI: {"d": "kucuk", "z": 2500}}, kok=k, simdi=3000)
    bekle("3 olagan guncelleme uygulanir", A.oku(k)["ayar"].get(YAZI) == "kucuk" and c["cakisma"] == [])

    # 4. cakisma, cihaz kazanir (z daha yeni)
    A.birlestir({TEMA: "sade"}, kok=k, simdi=3500)
    c = A.esitle("tel-1", "iPhone", 3000, {TEMA: {"d": "acik", "z": 3600}}, kok=k, simdi=4000)
    bekle("4 yeni yazan kazanir", A.oku(k)["ayar"].get(TEMA) == "acik")
    ck = c["cakisma"]
    bekle("4 cakisma gorunur", len(ck) == 1 and ck[0].get("k") == TEMA and ck[0].get("kazanan") == "iPhone"
          and ck[0].get("kaybeden") == "Bu bilgisayar" and ck[0].get("z") == 4000)
    bekle("4 cakisma kalici", A.oku(k)["cakisma"][:1] == ck)

    # 5. cakisma, sunucu kazanir (cihazin yazisi daha eski)
    A.birlestir({TEMA: "koyu"}, kok=k, simdi=5000)
    c = A.esitle("tel-1", "iPhone", 4000, {TEMA: {"d": "acik", "z": 4800}}, kok=k, simdi=5500)
    bekle("5 eski yazi kaybeder", A.oku(k)["ayar"].get(TEMA) == "koyu" and c["ayar"].get(TEMA) == "koyu")
    bekle("5 kazanan PC", len(c["cakisma"]) == 1 and c["cakisma"][0]["kazanan"] == "Bu bilgisayar" and c["cakisma"][0]["kaybeden"] == "iPhone")
    bekle("5 yeni cakisma basta", A.oku(k)["cakisma"][0]["kazanan"] == "Bu bilgisayar" and len(A.oku(k)["cakisma"]) == 2)

    # 6. silme mezar tasi: eski deger geri gelmez
    A.esitle("tel-1", "iPhone", 5500, {YAZI: {"d": None, "z": 6000}}, kok=k, simdi=6100)
    bekle("6 silme uygulanir, iz kalir", YAZI not in A.oku(k)["ayar"] and A.oku(k)["iz"].get(YAZI, {}).get("z") == 6000)
    A.esitle("tab-2", "Tablet", 3000, {YAZI: {"d": "buyuk", "z": 5900}}, kok=k, simdi=6200)
    bekle("6 eski deger diriltmez", YAZI not in A.oku(k)["ayar"])

    # 7. gecersiz anahtar ve cihaz
    c = A.esitle("tel-1", "iPhone", 6100, {"lifeos.hesap.jeton": {"d": "x", "z": 6300}, "baska": {"d": "x", "z": 6300}}, kok=k, simdi=6400)
    bekle("7 gecersiz anahtar reddedilir", sorted(c["red"]) == ["baska", "lifeos.hesap.jeton"] and "baska" not in A.oku(k)["ayar"])
    for kotu in ("", "a b", "x" * 80, None, 5):
        try:
            A.esitle(kotu, "X", 0, {}, kok=k, simdi=7000)
            bekle("7 gecersiz cihaz reddedilir: %r" % (kotu,), False)
        except ValueError as e:
            bekle("7 gecersiz cihaz 400: %r" % (kotu,), isinstance(e.args[0], tuple) and e.args[0][0] == 400)
    for kotu_son in (-1, "5", True):
        try:
            A.esitle("tel-1", "iPhone", kotu_son, {}, kok=k, simdi=7000)
            bekle("7 gecersiz son reddedilir: %r" % (kotu_son,), False)
        except ValueError as e:
            bekle("7 gecersiz son 400: %r" % (kotu_son,), e.args[0][0] == 400)
    try:
        A.esitle("tel-1", "iPhone", 0, {("lifeos.minik.k%d" % i): {"d": "1", "z": 1} for i in range(121)}, kok=k, simdi=7000)
        bekle("7 121 kayit reddedilir", False)
    except ValueError as e:
        bekle("7 121 kayit 400", e.args[0][0] in (400, 413))

    # 8. gelecekteki saat sinirlanir
    A.esitle("tel-1", "iPhone", 6400, {SES: {"d": "kapali", "z": 10 ** 13}}, kok=k, simdi=8000)
    bekle("8 gelecek z simdiye cekilir", A.oku(k)["iz"][SES]["z"] == 8000)

    # 9. cakisma listesi en cok 20, en yeni basta
    for i in range(25):
        A.birlestir({SES: "acik%d" % i}, kok=k, simdi=9000 + i * 10)
        A.esitle("tel-1", "iPhone", 9000 + i * 10 - 1, {SES: {"d": "tel%d" % i, "z": 9000 + i * 10 + 5}}, kok=k, simdi=9000 + i * 10 + 6)
    ck = A.oku(k)["cakisma"]
    bekle("9 en cok 20 cakisma", len(ck) == 20)
    bekle("9 en yeni basta", ck[0]["z"] == 9000 + 24 * 10 + 6)

    # 10. HTTP
    h = Sahte("POST", "/api/ayar/esitle", govde={"cihaz": "tel-1", "cihaz_ad": "iPhone", "son": 0, "gonder": {}})
    A.isle(h, k)
    bekle("10 yerelden esitle 200", h.kod == 200 and "son" in h.cevap() and "ayar" in h.cevap())
    h = Sahte("POST", "/api/ayar/esitle", ip="192.168.1.5", govde={"cihaz": "tel-1", "cihaz_ad": "iPhone", "son": 0, "gonder": {}})
    A.isle(h, k)
    bekle("10 ev agi izinsiz 403", h.kod == 403)
    h = Sahte("POST", "/api/ayar/esitle", ip="192.168.1.5", govde={"cihaz": "tel-1", "cihaz_ad": "iPhone", "son": 0, "gonder": {}})
    A.isle(h, k, uzak_izin=lambda x: True)
    bekle("10 ev agi izinli 200", h.kod == 200)
    h = Sahte("POST", "/api/ayar", ip="192.168.1.5", govde={"ayar": {TEMA: "acik"}})
    A.isle(h, k, uzak_izin=lambda x: True)
    bekle("10 ev agi yalniz esitle", h.kod == 403 and A.oku(k)["ayar"].get(TEMA) == "koyu")
    h = Sahte("GET", "/api/ayar", ip="192.168.1.5")
    A.isle(h, k, uzak_izin=lambda x: True)
    bekle("10 ev agi GET de yok", h.kod == 403)
    h = Sahte("POST", "/api/ayar/esitle", govde={"cihaz": "tel-1", "son": 0, "gonder": {}}, baslik=False)
    A.isle(h, k)
    bekle("10 basliksiz 403", h.kod == 403)
    h = Sahte("POST", "/api/ayar/esitle", govde={"cihaz": "a b", "son": 0, "gonder": {}})
    A.isle(h, k)
    bekle("10 gecersiz cihaz 400", h.kod == 400)
    h = Sahte("GET", "/api/ayar")
    A.isle(h, k)
    bekle("10 GET iz ve cakisma tasir", h.kod == 200 and "iz" in h.cevap() and len(h.cevap().get("cakisma", [])) == 20)
    h = Sahte("POST", "/api/ayar", govde={"ayar": {TEMA: "acik"}})
    A.isle(h, k)
    bekle("10 eski POST yolu calisir, iz yazar", h.kod == 200 and A.oku(k)["iz"][TEMA]["c"] == "pc")

if hata:
    print("KIRMIZI:\n  " + "\n  ".join(hata))
    sys.exit(1)
print("temiz: ayar esitleme kabul testi")
