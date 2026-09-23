# -*- coding: utf-8 -*-
"""Bolumlu test kitabi (core/kitap.py, BAM Uretim Ofisi).

   Kanitladigi sozler:
     1. Girdi kapalidir: en cok 6 bolum, bolum basina 3-15 soru, toplam en
        cok 60; zorluk yuzdeleri 100 eder.
     2. Zorluk dagilimini kod hesaplar; modelin zorluk etiketi «tahmin»dir.
     3. Her tikte BIR bolum uretilir; bagimsiz cozumde hepsi dusen bolum
        kitaba girmez.
     4. Model yarida kesilirse uretilen bolum kaybolmaz; is kaldigi yerden
        surer.
     5. Kitap AYS'ye `kitap.add` teklifi olarak doner; baska modul isteyemez."""
import json

from core import bam, db, intents, king, kitap
from tests.harness import eq, no, ok, suite, test
from tests.test_bam import _cfg

AN = "2026-09-23T10:00:00"


def _govde(**ek):
    g = {"baslik": "KPSS Genel Kültür test kitabı",
         "bolumler": [{"ad": "Tarih", "konular": ["Osmanlı Kuruluş Dönemi"], "adet": 3},
                      {"ad": "Coğrafya", "konular": [], "adet": 3}]}
    g.update(ek)
    return g


def _soru(metin, zorluk):
    return {"soru": metin, "secenekler": ["1071", "1299", "1453", "1517", "1923"],
            "dogru": "B", "cozum": "Kuruluş 1299 kabul edilir.", "zorluk": zorluk}


class _Tasiyici(object):
    """Uretim cagrisina soru, kalite cagrisina cevap verir. `yanlis` kume-
    sindeki bolum sirasinda bagimsiz cozum anahtarla tutmaz."""
    def __init__(self, yanlis=()):
        self.uretim, self.kalite, self.yanlis = 0, 0, set(yanlis)

    def __call__(self, provider, anahtar, model, sistem, gecmis):
        if "Kalite Kontrol" in sistem:
            self.kalite += 1
            n = len(json.loads(gecmis[-1]["content"])["sorular"])
            secim = "A" if self.kalite in self.yanlis else "B"
            return json.dumps({"cevaplar": [{"no": i + 1, "secim": secim} for i in range(n)]}), 10, 10
        self.uretim += 1
        bozuk = {"soru": "Bozuk", "secenekler": ["a", "b"], "dogru": "A", "cozum": "x"}
        return json.dumps({"sorular": [bozuk, _soru("Osmanlı ne zaman kuruldu? %d" % self.uretim, "kolay"),
                                       _soru("Soru iki %d" % self.uretim, "orta"),
                                       _soru("Soru üç %d" % self.uretim, "çok zor")]},
                          ensure_ascii=False), 100, 200


def _emir(con, cfg, govde=None, modul="ays"):
    return king.emir_ac(con, cfg, modul, "test.kitabi", {"kitap": govde or _govde()}, now=AN)


def _tik(con, cfg, t, n=1):
    for _ in range(n):
        bam.ilerlet(con, cfg, transport=t, now=AN)
        king.esitle(con, now=AN)


def run():
    suite("kitap")

    def t_girdi():
        g, h = kitap.temizle(_govde())
        eq(h, [])
        eq(g["zorluk"], kitap.VARSAYILAN_ZORLUK)
        yedi = [{"ad": "Ders %d" % i, "konular": [], "adet": 3} for i in range(7)]
        for bozuk in (_govde(bolumler=yedi), _govde(zorluk={"kolay": 50, "orta": 50, "zor": 10}),
                      _govde(bolumler=[{"ad": "Tarih", "konular": [], "adet": 2}]),
                      _govde(bolumler=[{"ad": "Tarih", "adet": 3}, {"ad": "tarih", "adet": 3}]),
                      _govde(bolumler=[{"ad": "D%d" % i, "adet": 15} for i in range(5)]),
                      _govde(kullanici="Ali")):
            no(kitap.temizle(bozuk)[0], "bozuk kitap gecmemeli: %r" % bozuk)
    test("girdi kapalidir: bolum, soru ve zorluk sinirlari", t_girdi)

    def t_dagilim():
        z = kitap.VARSAYILAN_ZORLUK
        eq(kitap.dagilim(10, z), {"kolay": 3, "orta": 5, "zor": 2})
        eq(kitap.dagilim(7, z), {"kolay": 2, "orta": 4, "zor": 1})
        eq(kitap.dagilim(3, z), {"kolay": 1, "orta": 1, "zor": 1})
        ok(all(sum(kitap.dagilim(n, z).values()) == n for n in range(3, 16)))
    test("zorluk dagilimini kod hesaplar; toplam hep istenen", t_dagilim)

    def t_zincir():
        con = db.connect(":memory:")
        cfg = _cfg()
        no(_emir(con, cfg, modul="spi")["ok"], "test kitabini yalniz AYS isteyebilir")
        e = _emir(con, cfg)["emir"]
        eq(e["karar"], "onay")
        t = _Tasiyici(yanlis={2})            # ikinci bolumun hepsi bagimsiz cozumde duser
        _tik(con, cfg, t, 2)                 # Kayit + 1. bolum
        j = bam.is_getir(con, e["bam_is_id"])
        eq((j["durum"], len(j["adimlar"][1]["kitap"]["bolumler"])), ("bekliyor", 1))
        eq(t.uretim, 1, "her tikte bir bolum")
        _tik(con, cfg, t)
        son = king.emir(con, e["id"])
        eq(son["durum"], "bitti")
        k = bam.kayit_getir(con, son["sonuc"]["kayit_id"])
        g = k["govde"]
        eq((k["tur"], g["tur"], k["dogruluk"]), ("materyal", "kitap", "dogrulanmadi"))
        eq([b["ad"] for b in g["bolumler"]], ["Tarih"])
        eq(g["bos_bolumler"], ["Coğrafya"])
        eq([s["zorluk"] for s in g["bolumler"][0]["sorular"]], ["kolay", "orta", "belirsiz"])
        eq(g["bolumler"][0]["hedef_dagilim"], {"kolay": 1, "orta": 1, "zor": 1})
        eq(g["zorluk_etiketi"], "tahmin")
        eq(g["kalite"], {"kontrol": "bağımsız çözüm", "uretilen": 6, "gecen": 3})
        n = intents.take(con, "ays")["intents"]
        eq([x["kind"] for x in n], ["kitap.add"])
        eq(n[0]["payload"], {"kayit_id": k["id"], "bolum": 1, "soru": 3,
                             "baslik": "KPSS Genel Kültür test kitabı"})
    test("her tikte bir bolum; denetimi gecmeyen bolum kitaba girmez; teklif", t_zincir)

    def t_yarida():
        con = db.connect(":memory:")
        cfg = _cfg()
        e = _emir(con, cfg)["emir"]
        t = _Tasiyici()
        _tik(con, cfg, t, 2)                               # Kayit + 1. bolum
        _tik(con, {"local_token": "x"}, t)                 # model yok: bekler
        j = bam.is_getir(con, e["bam_is_id"])
        eq(j["durum"], "beklemede")
        eq(len(j["adimlar"][1]["kitap"]["bolumler"]), 1, "uretilen bolum kaybolmamali")
        ok(bam.devam(con, j["id"])["ok"])
        _tik(con, cfg, t)
        eq(t.uretim, 2, "kaldigi yerden surer; ilk bolum yeniden uretilmez")
        eq(king.emir(con, e["id"])["durum"], "bitti")
    test("model yarida kesilirse uretilen bolum kaybolmaz", t_yarida)

    def t_hepsi_duserse():
        con = db.connect(":memory:")
        cfg = _cfg()
        e = _emir(con, cfg)["emir"]
        _tik(con, cfg, _Tasiyici(yanlis={1, 2}), 3)
        eq(king.emir(con, e["id"])["durum"], "hata")
        eq(con.execute("SELECT COUNT(*) FROM bam_kayitlar").fetchone()[0], 0)
        eq(intents.take(con, "ays")["intents"], [])
    test("hic soru gecmezse kitap yazilmaz, teklif birakilmaz", t_hepsi_duserse)
