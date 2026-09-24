# -*- coding: utf-8 -*-
"""Bolumlu test kitabi (core/kitap.py, BAM Uretim Burosu).

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
from tests.yardim import onayla
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
    return onayla(con, cfg, king.emir_ac(con, cfg, modul, "test.kitabi",
                                         {"kitap": govde or _govde()}, now=AN), now=AN)


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

    # Part 8b — parca parca: her bolumden sonra ara onay; «dur» uretilenle bitirir.
    def t_parca_parca():
        con, cfg, t = db.connect(":memory:"), _cfg(), _Tasiyici()
        g = _govde(bolumler=[{"ad": "Tarih", "konular": [], "adet": 3},
                             {"ad": "Coğrafya", "konular": [], "adet": 3},
                             {"ad": "Vatandaşlık", "konular": [], "adet": 3}])
        r = king.emir_ac(con, cfg, "ays", "test.kitabi", {"kitap": g}, now=AN)
        eq(r["emir"]["durum"], "teklif")
        e = king.teklif_onayla(con, cfg, r["emir"]["id"], "parca", now=AN)["emir"]
        ok(e["konu"].endswith("her bölümden sonra onayınla"), e["konu"])
        _tik(con, cfg, t, 2)                      # kayit + 1. bolum
        e = king.emir(con, e["id"])
        eq(e["durum"], "ara_onay")
        eq(t.uretim, 1)
        b = king.bildirimler(con, "ays")["bildirimler"][0]
        eq(b["tur"], "ara_onay")
        ok("1 / 3 bölüm" in b["metin"] and "«devam»" in b["metin"] and "ölçülen maliyet" in b["metin"],
           b["metin"])
        # Onaysiz ilerlemez: tik gecse de model cagrilmaz.
        _tik(con, cfg, t, 2)
        eq((king.emir(con, e["id"])["durum"], t.uretim), ("ara_onay", 1))
        # Modulun karti ara onayi gosterir.
        eq([x["durum"] for x in king.teklifler(con, "ays")], ["ara_onay"])
        ok(king.parca(con, e["id"], "devam", now=AN)["ok"])
        _tik(con, cfg, t, 1)
        eq((king.emir(con, e["id"])["durum"], t.uretim), ("ara_onay", 2))
        # «dur»: kitap uretilen IKI bolumle biter; ucuncu icin model cagrilmaz.
        ok(king.parca(con, e["id"], "dur", now=AN)["ok"])
        _tik(con, cfg, t, 2)
        son = king.emir(con, e["id"])
        eq((son["durum"], t.uretim), ("bitti", 2))
        k = bam.kayit_getir(con, son["sonuc"]["kayit_id"])
        eq([x["ad"] for x in k["govde"]["bolumler"]], ["Tarih", "Coğrafya"])
        eq(intents.take(con, "ays")["intents"][0]["payload"]["bolum"], 2)
        no(king.parca(con, e["id"], "devam", now=AN)["ok"])
    test("parca parca: her bolumde ara onay; «dur» uretilenle bitirir", t_parca_parca)

    def t_parca_sohbet():
        con, cfg, t = db.connect(":memory:"), _cfg(), _Tasiyici()
        kw = dict(kanal="telegram", hedef="7")
        r = king.emir_ac(con, cfg, "ays", "test.kitabi", {"kitap": _govde()}, now=AN, **kw)
        ok("«1», «2», «3»" in king.teklif_metni(r["emir"], kanal="telegram"))
        ok(king.teklif_cevap(con, cfg, "3", now=AN, **kw).startswith("Onaylandı"))
        _tik(con, cfg, t, 2)
        eq(king.emir(con, r["emir"]["id"])["durum"], "ara_onay")
        eq(king.teklif_cevap(con, cfg, "devam", kanal="telegram", hedef="8"), None)
        ok("Devam" in king.teklif_cevap(con, cfg, "devam", now=AN, **kw))
        _tik(con, cfg, t, 2)
        eq(king.emir(con, r["emir"]["id"])["durum"], "bitti")
        eq(king.teklif_cevap(con, cfg, "dur", **kw), None)   # acik ara onay yok
    test("parca parca sohbetten: «3» secer, «devam» der", t_parca_sohbet)

    def t_soru_cevabi_teklifi_onaylamaz():
        """HATALAR Y-9: ayni kanalda acik bir teklif ve acik bir soru varken
        soruya verilen tek sayi («4» saat uyudum) teklifi onayliyordu ya da
        «o secenek yok» deyip cevabi yutuyordu. Acik soru varken tek sayi
        SORUNUN cevabidir; teklif «onayla 2» ile onaylanir."""
        import datetime as _dt
        from core import eksik, sohbet
        con, cfg = db.connect(":memory:"), _cfg()
        kw = dict(kanal="telegram", hedef="7")
        e = king.emir_ac(con, cfg, "ays", "test.kitabi", {"kitap": _govde()}, now=AN, **kw)["emir"]
        db.insert_event(con, "spi", "2026-09-22", "2026-09-22T21:00:00",
                        {"module": "spi", "date": "2026-09-22",
                         "metrics": {"sleep_hours": {"value": 7, "cert": "measured"}}})
        ok(eksik.sor(con, "2026-09-24", kanal="telegram", now=_dt.datetime(2026, 9, 24, 8, 0)))
        r = sohbet.konus(con, cfg, "2", "2026-09-24", gorevli="king", kayit=False, **kw)
        eq(r["command"], "soru", r)
        ok("onayla 1" in r["text"], r["text"])
        eq(king.emir(con, e["id"])["durum"], "teklif", "soru cevabi teklifi onaylamaz")
        eq(con.execute("SELECT kind FROM intents").fetchone()["kind"], "kayit.add")
        # Acikca «onayla 2»: teklif onaylanir.
        r = sohbet.konus(con, cfg, "onayla 2", "2026-09-24", gorevli="king", kayit=False, **kw)
        eq(r["command"], "teklif", r)
        no(king.emir(con, e["id"])["durum"] == "teklif")
    test("acik soru varken tek sayi soruya gider, teklifi onaylamaz (Y-9)", t_soru_cevabi_teklifi_onaylamaz)
