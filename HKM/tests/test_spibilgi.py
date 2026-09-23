# -*- coding: utf-8 -*-
"""SPİ bilgisi — besin, fiyat, yer (core/spibilgi.py; Part 8c).

   Kanitladigi sozler:
     1. Girdi kapalidir: tur, ad, (yer icin) semt/sehir; besin yere baglanmaz.
     2. Sayi kaynaktan, sinama koddan: makrolar enerjiyle tutmazsa kayit yok;
        bilinmeyen mikro sifir yazilmaz; alintida gecmeyen sayi kaynakli
        sayilmaz; dogrulanmayan fiyat duser, birim fiyati ve ortancayi kod
        hesaplar.
     3. Fiyat ve yer model bilgisinden yazilmaz: web kapaliyken model HIC
        cagrilmaz ve is nedenini soyleyerek biter.
     4. Is King'in teklifinden gecer; biten kayit SPİ'ye tipli niyet olarak
        birakilir (besin.add / fiyat.add / yer.add)."""
import json
import urllib.parse

from core import bam, db, intents, king, spibilgi, teklif
from tests.yardim import onayla
from tests.harness import eq, no, ok, suite, test
from tests.test_bam import _cfg
from tests.test_kaynakli import _cfg_web

AN = "2026-09-23T10:00:00"
SAYFA = {
    "Kinoa": "Kinoa (çiğ) 100 gramda 368 kcal enerji, 14,1 g protein, 6,1 g yağ ve 64,2 g "
             "karbonhidrat bulunur. Lif miktarı 7 gramdır. " * 6,
    "Kinoa fiyatları": "Migros kinoa 500 g paket 189,90 TL olarak satılıyor. A101 kinoa 1 kg "
                       "349,50 TL. " * 6,
}


class _Ag(object):
    def __init__(self):
        self.cagri = []

    def __call__(self, url, basliklar=None, govde=None, guvenilir=False):
        self.cagri.append(url)
        q = dict(urllib.parse.parse_qsl(urllib.parse.urlsplit(url).query))
        if q.get("list") == "search":
            d = {"query": {"search": [{"title": t, "snippet": t} for t in SAYFA]}}
        else:
            t = q.get("titles")
            d = {"query": {"pages": {"1": {"title": t, "extract": SAYFA.get(t, "")}}}}
        return 200, {"Content-Type": "application/json"}, json.dumps(d).encode("utf-8"), url


class _Model(object):
    def __init__(self):
        self.cagri = 0

    def __call__(self, provider, anahtar, model, sistem, gecmis):
        self.cagri += 1
        if "market fiyatları" in sistem:
            return json.dumps({"fiyatlar": [
                {"market": "Migros", "tl": 189.9, "miktar_g": 500, "tarih": "2026-09",
                 "kaynak": 2, "alinti": "Migros kinoa 500 g paket 189,90 TL olarak satılıyor."},
                {"market": "A101", "tl": 349.5, "miktar_g": 1000, "kaynak": 2,
                 "alinti": "A101 kinoa 1 kg 349,50 TL."},
                {"market": "Uydurma", "tl": 99, "miktar_g": 1000, "kaynak": 2,
                 "alinti": "Migros kinoa 500 g paket 189,90 TL olarak satılıyor."}]},
                ensure_ascii=False), 50, 50
        return json.dumps({"ad": "Kinoa (çiğ)", "kcal": 368, "p": 14.1, "f": 6.1, "c": 64.2,
                           "sat": 0.7, "fib": 7, "sugar": None,
                           "micro": {"iron": 4.6, "kurkumin": 3, "calcium": "çok"},
                           "porsiyonlar": [{"ad": "1 su bardağı", "g": 170}],
                           "kaynak": 1, "alinti": "Kinoa (çiğ) 100 gramda 368 kcal enerji, "
                                                  "14,1 g protein"}, ensure_ascii=False), 60, 60


def _tik(con, cfg, model, n):
    for _ in range(n):
        bam.ilerlet(con, cfg, transport=model, now=AN)
        king.esitle(con, now=AN)


def _niyetler(con):
    return [(n["kind"], n["payload"]) for n in db.intents_for(con, "spi", ("pending",))]


def run():
    suite("spibilgi")

    def t_girdi():
        eq(spibilgi.temizle({"tur": "besin", "ad": " Kinoa "})[0], {"tur": "besin", "ad": "Kinoa"})
        no(spibilgi.temizle({"tur": "besin", "ad": "Kinoa", "semt": "Kadıköy"})[0])
        no(spibilgi.temizle({"tur": "yer", "ad": "spor salonu"})[0])       # konum yok
        no(spibilgi.temizle({"tur": "ilac", "ad": "parol"})[0])
        no(spibilgi.temizle({"tur": "fiyat", "ad": "süt", "tahlil": "ferritin 12"})[0])
        a = spibilgi.anahtar({"bilgi": spibilgi.temizle({"tur": "fiyat", "ad": "SÜT"})[0]})
        eq(a, spibilgi.anahtar({"bilgi": spibilgi.temizle({"tur": "fiyat", "ad": "süt "})[0]}))
    test("girdi kapali: tur, ad, konum; saglik verisi ve bilinmeyen alan girmez", t_girdi)

    def t_besin_suzgec():
        g = {"tur": "besin", "ad": "Kinoa"}
        _, h = spibilgi.ayikla({"kcal": 900, "p": 14, "f": 6, "c": 64}, g)
        ok("tutmuyor" in h)
        _, h = spibilgi.ayikla({"kcal": 368, "p": 14, "f": 6}, g)
        ok("dördü" in h)
        d, h = spibilgi.ayikla({"kcal": 368, "p": 14.1, "f": 6.1, "c": 64.2, "sat": 9,
                                "micro": {"iron": 4.6, "zinc": -1, "vitc": 0}}, g)
        eq(h, None)
        eq(d["deger"]["sat"], None)                    # doymus yag toplam yagi asamaz
        eq(d["micro"], {"iron": 4.6, "vitc": 0.0})     # sifir OLCUMDUR; eksi sayi duser
        ok("zinc" in d["bilinmeyen_mikro"] and "iron" not in d["bilinmeyen_mikro"])
        ok(spibilgi.sayi_alintida(14.1, "protein 14,1 g"))
        no(spibilgi.sayi_alintida(14.1, "protein 114,1 g"))
        ok(spibilgi.sayi_alintida(1299.9, "fiyatı 1.299,90 TL"))
    test("besin: enerji makrolarla tutmali; bilinmeyen mikro sifir yazilmaz", t_besin_suzgec)

    def t_fiyat_dogrula():
        g = {"tur": "fiyat", "ad": "Kinoa"}
        d, _ = spibilgi.ayikla({"fiyatlar": [
            {"tl": 189.9, "miktar_g": 500, "kaynak": 1, "alinti": "500 g paket 189,90 TL"},
            {"tl": 349.5, "miktar_g": 1000, "kaynak": 1, "alinti": "1 kg 349,50 TL"},
            {"tl": 10, "miktar_g": 1000, "kaynak": 1, "alinti": "1 kg 349,50 TL"},
            {"tl": 50, "miktar_g": 1000}]}, g)
        eq(len(d["fiyatlar"]), 3)                      # kaynaksiz satir ayiklamada duser
        metin = {1: "Kinoa 500 g paket 189,90 TL. Başka bir market 1 kg 349,50 TL."}
        etiket, h = spibilgi.dogrula(d, metin, lambda a, m: a in m)
        eq((etiket, h, d["dusen"]), ("kaynakli", None, 1))
        eq([x["tl_kg"] for x in d["fiyatlar"]], [379.8, 349.5])
        eq((d["tl_kg"], d["etiket"]), (364.65, "tahmin"))   # ortanca, tahmin
        d2, _ = spibilgi.ayikla({"fiyatlar": [{"tl": 10, "miktar_g": 1000, "kaynak": 1,
                                               "alinti": "1 kg 349,50 TL"}]}, g)
        eq(spibilgi.dogrula(d2, metin, lambda a, m: a in m)[0], None)
    test("fiyat: alintida gecmeyen fiyat duser; birim fiyat ve ortanca koddan", t_fiyat_dogrula)

    def t_teklif_birim():
        b = teklif.birim("spi.bilgi", {}, ["kayit", "arastirma"])
        eq((b["model"], b["etiket"]), (1, "tahmin"))
        ok(b["web"] > 0)
    test("teklif: bilgi isi 1 yazim cagrisi + web istekleri", t_teklif_birim)

    def t_besin_web():
        con = db.connect(":memory:")
        eski = bam.web_tasiyici
        bam.web_tasiyici = _Ag()
        m = _Model()
        try:
            r = king.emir_ac(con, _cfg_web(), "spi", "spi.bilgi",
                             {"bilgi": {"tur": "besin", "ad": "Kinoa"}}, now=AN)
            eq(r["emir"]["durum"], "teklif")          # onaysiz is acilmaz
            e = onayla(con, _cfg_web(), r, now=AN)["emir"]
            _tik(con, _cfg_web(), m, 6)
        finally:
            bam.web_tasiyici = eski
        son = king.emir(con, e["id"])
        eq(son["durum"], "bitti")
        k = bam.kayit_getir(con, son["sonuc"]["kayit_id"])
        eq((k["dogruluk"], k["govde"]["dogrulandi"]), ("kaynakli", True))
        eq(k["govde"]["micro"], {"iron": 4.6})
        eq(m.cagri, 1)                                 # sorgular kuralla: tek cagri
        n = _niyetler(con)
        eq([x[0] for x in n], ["besin.add"])
        eq(n[0][1]["kayit_id"], k["id"])
        ok(intents.validate("spi", "besin.add", n[0][1])[0])
    test("besin web ile: kaynakli kayit, SPİ'ye besin.add niyeti", t_besin_web)

    def t_fiyat_web():
        con = db.connect(":memory:")
        eski = bam.web_tasiyici
        bam.web_tasiyici = _Ag()
        try:
            onayla(con, _cfg_web(), king.emir_ac(con, _cfg_web(), "spi", "spi.bilgi",
                   {"bilgi": {"tur": "fiyat", "ad": "Kinoa"}}, now=AN), now=AN)
            _tik(con, _cfg_web(), _Model(), 6)
        finally:
            bam.web_tasiyici = eski
        n = _niyetler(con)
        eq([x[0] for x in n], ["fiyat.add"])
        g = bam.kayit_getir(con, n[0][1]["kayit_id"])["govde"]
        eq(([x["market"] for x in g["fiyatlar"]], g["dusen"]), (["Migros", "A101"], 1))
        eq(g["tl_kg"], 364.65)
    test("fiyat web ile: uydurma fiyat duser; fiyat.add niyeti", t_fiyat_web)

    def t_web_kapali():
        con = db.connect(":memory:")
        m = _Model()
        e = onayla(con, _cfg(), king.emir_ac(con, _cfg(), "spi", "spi.bilgi",
                   {"bilgi": {"tur": "yer", "ad": "spor salonu", "semt": "Kadıköy"}}, now=AN),
                   now=AN)["emir"]
        _tik(con, _cfg(), m, 4)
        son = king.emir(con, e["id"])
        eq((son["durum"], m.cagri), ("hata", 0))       # model HIC cagrilmadi
        b = king.bildirimler(con, "spi")["bildirimler"][0]
        eq(b["tur"], "hata")
        ok("model bilgisinden yazılmaz" in b["metin"] and "««" not in b["metin"])
        eq(_niyetler(con), [])
        # Besin web'siz yazilir ama dogrulanmadi.
        e = onayla(con, _cfg(), king.emir_ac(con, _cfg(), "spi", "spi.bilgi",
                   {"bilgi": {"tur": "besin", "ad": "Kinoa"}}, now=AN), now=AN)["emir"]
        _tik(con, _cfg(), m, 4)
        k = bam.kayit_getir(con, king.emir(con, e["id"])["sonuc"]["kayit_id"])
        eq(k["dogruluk"], "dogrulanmadi")
        ok("Kaynaksız" in k["govde"]["uyari"])
        eq([x[0] for x in _niyetler(con)], ["besin.add"])
    test("web kapaliyken fiyat ve yer model cagirmadan biter; besin dogrulanmadi", t_web_kapali)
