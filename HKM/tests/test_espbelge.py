# -*- coding: utf-8 -*-
"""ESP belgesi — tarih ve felsefe (core/espbelge.py; Part 8f).

   Kanitladigi sozler:
     1. Girdi kapalidir: alan (tarih|felsefe) ve konu.
     2. Belge kaynaktir: web kapaliyken model HIC cagrilmaz, is nedenini
        soyleyerek biter.
     3. Alinti kaynakta, kanit alintida: yili alintida gecmeyen olay, adi
        alintida gecmeyen dusunur DUSER; tur ve bolge ESP'nin sozlugunden;
        alintida gecmeyen eser yili bilinmiyor olur.
     4. Is King'in teklifinden gecer; biten kayit ESP'ye `belge.add` niyeti
        olarak birakilir."""
import json
import urllib.parse

from core import bam, db, espbelge, intents, king, teklif
from tests.yardim import onayla
from tests.harness import eq, no, ok, suite, test
from tests.test_bam import _cfg
from tests.test_kaynakli import _cfg_web

AN = "2026-09-24T10:00:00"
SAYFA = {
    "Osmanlı Beyliği": "Osmanlı Beyliği 1299 yılında Osman Gazi tarafından kuruldu. Bursa "
                       "1326 yılında fethedildi ve başkent oldu. " * 6,
    "Stoacılık": "Zenon Stoacılığı MÖ 300 dolaylarında Atina'da kurdu. Epiktetos, "
                 "Encheiridion adlı el kitabında insanın yalnız kendi yargılarını denetleyebileceğini "
                 "söyler. Marcus Aurelius Kendime Düşünceler'i yazdı. " * 5,
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
        if "olaylar" in sistem:
            return json.dumps({"olaylar": [
                {"baslik": "Osmanlı Beyliği'nin kuruluşu", "yil": 1299, "tur": "siyasi",
                 "bolge": "anadolu", "neden": "Altı yüz yıllık bir devletin başlangıcı.",
                 "kaynak": 1, "alinti": "Osmanlı Beyliği 1299 yılında Osman Gazi tarafından kuruldu."},
                {"baslik": "Bursa'nın fethi", "yil": 1326, "tur": "siyasi", "bolge": "anadolu",
                 "kaynak": 1, "alinti": "Bursa 1326 yılında fethedildi ve başkent oldu."},
                {"baslik": "Uydurma yıl", "yil": 1402, "tur": "siyasi", "bolge": "anadolu",
                 "kaynak": 1, "alinti": "Bursa 1326 yılında fethedildi ve başkent oldu."},
                {"baslik": "Sözlük dışı", "yil": 1299, "tur": "askeri", "bolge": "anadolu",
                 "kaynak": 1, "alinti": "Osmanlı Beyliği 1299 yılında Osman Gazi tarafından kuruldu."}]},
                ensure_ascii=False), 60, 60
        return json.dumps({"dusunurler": [
            {"ad": "Epiktetos", "eser": "Encheiridion", "yil": 125,
             "tez": "İnsan yalnız kendi yargılarını denetleyebilir.", "kavramlar": ["yargı", "erdem"],
             "kaynak": 2, "alinti": "Epiktetos, Encheiridion adlı el kitabında insanın yalnız kendi "
                                    "yargılarını denetleyebileceğini söyler."},
            {"ad": "Seneca", "eser": "Lucilius'a Mektuplar", "yil": 65,
             "tez": "Zaman insanın tek gerçek varlığıdır.", "kaynak": 2,
             "alinti": "Marcus Aurelius Kendime Düşünceler'i yazdı."}]},
            ensure_ascii=False), 60, 60


def _tik(con, cfg, model, n):
    for _ in range(n):
        bam.ilerlet(con, cfg, transport=model, now=AN)
        king.esitle(con, now=AN)


def _niyetler(con):
    return [(n["kind"], n["payload"]) for n in db.intents_for(con, "esp", ("pending",))]


def run():
    suite("espbelge")

    def t_girdi():
        eq(espbelge.temizle({"alan": "tarih", "konu": " Osmanlı  kuruluşu "}),
           ({"alan": "tarih", "konu": "Osmanlı kuruluşu"}, []))
        no(espbelge.temizle({"alan": "astroloji", "konu": "burçlar"})[1] == [])
        no(espbelge.temizle({"alan": "felsefe", "konu": "Stoa", "yas": 17})[1] == [])
        eq(king.emir_ac(db.connect(":memory:"), _cfg(), "spi", "esp.belge",
                        {"belge": {"alan": "tarih", "konu": "Osmanlı"}})["ok"], False)
        b = teklif.birim("esp.belge", {}, ["kayit", "arastirma"])
        eq(b["model"], 1)
    test("girdi kapalidir; teklif bir yazim cagrisi", t_girdi)

    def t_suzgec_ve_dogrulama():
        g = {"alan": "tarih", "konu": "Osmanlı"}
        d = json.loads(_Model()(None, None, None, "olaylar", [])[0])
        govde, hata = espbelge.ayikla(d, g)
        eq(hata, None)
        eq([x["baslik"] for x in govde["olaylar"]],
           ["Osmanlı Beyliği'nin kuruluşu", "Bursa'nın fethi", "Uydurma yıl"])   # «askeri» duser
        metinler = {1: SAYFA["Osmanlı Beyliği"]}
        etiket, hata = espbelge.dogrula(govde, metinler, lambda a, m: a in m)
        eq((etiket, hata), ("kaynakli", None))
        eq([x["yil"] for x in govde["olaylar"]], [1299, 1326])                  # 1402 alintida yok
        g = {"alan": "felsefe", "konu": "Stoacılık"}
        d = json.loads(_Model()(None, None, None, "dusunurler", [])[0])
        govde, _ = espbelge.ayikla(d, g)
        etiket, hata = espbelge.dogrula(govde, {2: SAYFA["Stoacılık"]}, lambda a, m: a in m)
        eq([x["ad"] for x in govde["dusunurler"]], ["Epiktetos"])               # Seneca alintida yok
        eq(govde["dusunurler"][0]["yil"], None)                                 # 125 alintida yok
        ok(espbelge._yil_alintida(-300, "MÖ 300 dolaylarında"))
    test("alinti kaynakta; yil ve ad alintida; sozluk disi duser", t_suzgec_ve_dogrulama)

    def t_okuma_yazi():
        """Okuma ve yazi: eser listesi; yazar adi alintida, yil alintida degilse bilinmiyor."""
        eq(espbelge.temizle({"alan": "okuma", "konu": "Stoacılık"})[1], [])
        g = {"alan": "okuma", "konu": "Stoacılık"}
        d = {"eserler": [
            {"yazar": "Epiktetos", "eser": "Encheiridion", "yil": 125, "not": "Temel el kitabı.",
             "kaynak": 2, "alinti": "Epiktetos, Encheiridion adlı el kitabında insanın yalnız kendi "
                                    "yargılarını denetleyebileceğini söyler."},
            {"yazar": "Seneca", "eser": "Mektuplar", "kaynak": 2,
             "alinti": "Marcus Aurelius Kendime Düşünceler'i yazdı."},
            {"yazar": "", "eser": "Adsız", "kaynak": 2, "alinti": "x"}]}
        govde, hata = espbelge.ayikla(d, g)
        eq((hata, len(govde["eserler"]), govde["bicim_dusen"]), (None, 2, 1))
        etiket, hata = espbelge.dogrula(govde, {2: SAYFA["Stoacılık"]}, lambda a, m: a in m)
        eq((etiket, [x["yazar"] for x in govde["eserler"]], govde["eserler"][0]["yil"]),
           ("kaynakli", ["Epiktetos"], None))
        eq(espbelge.ozet(govde), "Stoacılık: 1 eser (okuma listesi, kaynaklı).")
        ok("üslubunda" in espbelge.sistem("yazi"))
    test("okuma ve yazi: eser listesi, yazar alintida", t_okuma_yazi)

    def t_dayanak_tablolari():
        """Madde 11: CEFR saatleri ve okuma hizi kaynaktan; seviye ve sayi alintida."""
        eq(espbelge.temizle({"alan": "cefr", "konu": "CEFR saatleri"})[1], [])
        sayfa = ("According to Cambridge, A1 requires approximately 90-100 guided learning hours "
                 "and B2 around 500-600 hours. The average adult reads 238 words per minute.")
        g = {"alan": "cefr", "konu": "CEFR"}
        d = {"seviyeler": [
            {"seviye": "A1", "saat_alt": 90, "saat_ust": 100, "kaynak": 1,
             "alinti": "A1 requires approximately 90-100 guided learning hours"},
            {"seviye": "B2", "saat_alt": 500, "saat_ust": 600, "kaynak": 1,
             "alinti": "B2 around 500-600 hours"},
            {"seviye": "C1", "saat_alt": 700, "saat_ust": 800, "kaynak": 1,
             "alinti": "B2 around 500-600 hours"},                       # seviye alintida yok
            {"seviye": "Z9", "saat_alt": 1, "saat_ust": 2, "kaynak": 1, "alinti": "x"}]}
        govde, hata = espbelge.ayikla(d, g)
        eq((hata, govde["bicim_dusen"]), (None, 1))
        etiket, hata = espbelge.dogrula(govde, {1: sayfa}, lambda a, m: a in m)
        eq((etiket, [x["seviye"] for x in govde["seviyeler"]]), ("kaynakli", ["A1", "B2"]))
        g = {"alan": "okuma_hizi", "konu": "okuma hızı"}
        govde, _ = espbelge.ayikla({"hizlar": [
            {"ne": "sessiz okuma", "kelime_dk": 238, "kaynak": 1,
             "alinti": "The average adult reads 238 words per minute."},
            {"ne": "uydurma", "kelime_dk": 400, "kaynak": 1,
             "alinti": "The average adult reads 238 words per minute."}]}, g)
        etiket, _ = espbelge.dogrula(govde, {1: sayfa}, lambda a, m: a in m)
        eq([x["kelime_dk"] for x in govde["hizlar"]], [238])
        eq(espbelge.satirlar(govde), govde["hizlar"])
    test("dayanak tablolari: CEFR ve okuma hizi alintida", t_dayanak_tablolari)

    def t_web_kapali():
        con = db.connect(":memory:")
        m = _Model()
        e = onayla(con, _cfg(), king.emir_ac(con, _cfg(), "esp", "esp.belge",
                   {"belge": {"alan": "felsefe", "konu": "Stoacılık"}}, now=AN), now=AN)["emir"]
        _tik(con, _cfg(), m, 4)
        son = king.emir(con, e["id"])
        eq((son["durum"], m.cagri), ("hata", 0))
        ok("model bilgisinden yazılmaz" in king.bildirimler(con, "esp")["bildirimler"][0]["metin"])
        eq(_niyetler(con), [])
    test("web kapaliyken model cagrilmaz, belge yazilmaz", t_web_kapali)

    def t_web_ile():
        con = db.connect(":memory:")
        m = _Model()
        eski = bam.web_tasiyici
        bam.web_tasiyici = _Ag()
        try:
            r = king.emir_ac(con, _cfg_web(), "esp", "esp.belge",
                             {"belge": {"alan": "tarih", "konu": "Osmanlı Beyliği"}}, now=AN)
            eq(r["emir"]["durum"], "teklif")              # onaysiz is acilmaz
            e = onayla(con, _cfg_web(), r, now=AN)["emir"]
            _tik(con, _cfg_web(), m, 6)
        finally:
            bam.web_tasiyici = eski
        son = king.emir(con, e["id"])
        eq(son["durum"], "bitti")
        k = bam.kayit_getir(con, son["sonuc"]["kayit_id"])
        eq((k["dogruluk"], k["govde"]["tur"], len(k["govde"]["olaylar"])), ("kaynakli", "tarih", 2))
        ok(k["govde"]["kaynaklar"])
        n = _niyetler(con)
        eq([x[0] for x in n], ["belge.add"])
        eq((n[0][1]["alan"], n[0][1]["adet"]), ("tarih", 2))
        ok(intents.validate("esp", "belge.add", n[0][1])[0])
    test("web ile: kaynakli kayit, ESP'ye belge.add", t_web_ile)
