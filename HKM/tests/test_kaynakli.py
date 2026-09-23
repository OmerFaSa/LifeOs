# -*- coding: utf-8 -*-
"""Kaynakli arastirma (core/kaynakli.py, core/bam.py) ve King'in web araci.

   Kanitladigi sozler:
     1. Sorgular suzulur; ayni alan en cok iki kez; resmi alan once.
     2. Alinti KODLA dogrulanir; kaynakta gecmeyen alinti «dogrulanamadi».
     3. Is dort tikte ilerler (plan, tarama, okuma, yazim); yazim ag'a
        cikmaz, metin onbellekten gelir. Kayitin etiketi olculur.
     4. Web sonuc vermezse is kaynaksiz yola duser ve NEDENINI yazar.
     5. Mufredat web aciksa ders ders kaynagina baglanir.
     6. King web'e bakar ve kaynak listesini KOD ekler; alt patron bakamaz."""
import json
import urllib.parse

from core import bam, db, kaynakli, king, sohbet, web
from tests.harness import eq, no, ok, suite, test
from tests.test_bam import _cfg

AN = "2026-09-23T10:00:00"
METIN = {
    "Osmanlı İmparatorluğu": "Osmanlı Devleti 1299 yılında Söğüt ve Domaniç çevresinde kuruldu. "
                             "Kurucusu Osman Bey'dir. " * 8,
    "Söğüt": "Söğüt, Bilecik iline bağlı bir ilçedir ve Osmanlı'nın ilk merkezi sayılır. " * 8,
}


def _cfg_web():
    c = _cfg()
    c["web"] = {"acik": True}
    return c


class _Ag(object):
    def __init__(self, bos=False):
        self.cagri, self.bos = [], bos

    def __call__(self, url, basliklar=None, govde=None, guvenilir=False):
        self.cagri.append(url)
        if self.bos:
            return 404, {}, b"", url
        q = dict(urllib.parse.parse_qsl(urllib.parse.urlsplit(url).query))
        if q.get("list") == "search":
            d = {"query": {"search": [{"title": t, "snippet": t} for t in METIN]}}
        else:
            t = q.get("titles")
            d = {"query": {"pages": {"1": {"title": t, "extract": METIN.get(t, "")}}}}
        return 200, {"Content-Type": "application/json"}, json.dumps(d).encode("utf-8"), url


class _Model(object):
    def __init__(self):
        self.sistemler, self.icerikler = [], []

    def __call__(self, provider, anahtar, model, sistem, gecmis):
        self.sistemler.append(sistem)
        self.icerikler.append(gecmis[-1]["content"])
        if "Araştırma Mimarı" in sistem:
            return json.dumps({"alt_sorular": ["Ne zaman kuruldu?"],
                               "sorgular": ["Osmanlı kuruluşu", "Söğüt ilçesi",
                                            "ali@x.com Osmanlı"]}), 50, 50
        if "Araştırma Yazarı" in sistem:
            return json.dumps({"baslik": "Osmanlı'nın kuruluşu", "ozet": "1299'da kuruldu [1].",
                               "bulgular": [
                                   {"iddia": "Osmanlı 1299'da kuruldu.", "kaynaklar": [1, 9],
                                    "alinti": "Osmanlı Devleti 1299 yılında Söğüt ve Domaniç",
                                    "guven": "yüksek"},
                                   {"iddia": "Başkent İznik'ti.", "kaynaklar": [2],
                                    "alinti": "ilk başkent İznik olarak seçildi", "guven": "yüksek"}],
                               "celiskiler": [], "acik_kalanlar": ["Kesin tarih tartışmalı."]},
                              ensure_ascii=False), 100, 200
        if "müfredatını çıkarıyorsun" in sistem:
            return json.dumps({"sinav": "KPSS Genel Kültür", "dersler": [
                {"ad": "Tarih", "konular": ["Osmanlı Kuruluş Dönemi"], "kaynak": 1,
                 "alinti": "Kurucusu Osman Bey'dir."},
                {"ad": "Coğrafya", "konular": ["İlçeler"], "kaynak": 2,
                 "alinti": "uydurulmuş bir cümle burada"}]}, ensure_ascii=False), 100, 100
        return "Osmanlı 1299'da kuruldu [1].", 30, 30


def _tik(con, cfg, model, n):
    for _ in range(n):
        bam.ilerlet(con, cfg, transport=model, now=AN)
        king.esitle(con, now=AN)


def run():
    suite("kaynakli")

    def t_suzme():
        s = kaynakli.sorgular({"sorgular": ["Osmanlı", "osmanlı", "ali@x.com kim", "a", "B", "C",
                                            "D", "E"]}, "talep")
        eq(s[0], "Osmanlı")
        ok(len(s) <= kaynakli.MAX_SORGU and "ali@x.com kim" not in s)
        eq(kaynakli.sorgular({}, "KPSS tarih konuları"), ["KPSS tarih konuları"])
        a = kaynakli.aday_sec([
            {"url": "https://a.com/1", "alan": "a.com"}, {"url": "https://a.com/2", "alan": "a.com"},
            {"url": "https://a.com/3", "alan": "a.com"}, {"url": "https://osym.gov.tr/k", "alan": "osym.gov.tr"},
            {"url": "https://a.com/1", "alan": "a.com"}])
        eq([x["url"] for x in a], ["https://osym.gov.tr/k", "https://a.com/1", "https://a.com/2"])
    test("sorgular suzulur; alan cesitliligi; resmi alan once", t_suzme)

    def t_alinti():
        m = "Osmanlı Devleti 1299 yılında  kuruldu. “Söz” — tire."
        ok(kaynakli.alinti_dogru_mu("osmanlı devleti 1299 yılında kuruldu", m))
        ok(kaynakli.alinti_dogru_mu('kuruldu. "Söz" - tire', m))   # tirnak ve tire farki
        no(kaynakli.alinti_dogru_mu("1299", m), "kisa alinti dogrulama sayilmaz")
        no(kaynakli.alinti_dogru_mu("Osmanlı Devleti 1300 yılında kuruldu", m))
        b, say = kaynakli.bulgular({"bulgular": [
            {"iddia": "x", "kaynaklar": [1], "alinti": "Osmanlı Devleti 1299 yılında kuruldu"},
            {"iddia": "y", "kaynaklar": [5], "alinti": "Osmanlı Devleti 1299 yılında kuruldu"}]},
            {1: m})
        eq(say, {"toplam": 2, "dogrulanan": 1})
        eq((b[1]["kaynaklar"], b[1]["guven"]), ([], "düşük"))
        eq(kaynakli.dogruluk(b, []), "kaynakli")
        eq(kaynakli.dogruluk(b, ["çelişki"]), "celiskili")
        eq(kaynakli.dogruluk([b[1]], []), "dogrulanmadi")
    test("alinti kodla dogrulanir; kayitin etiketi olculur", t_alinti)

    def t_is():
        con = db.connect(":memory:")
        cfg, ag, m = _cfg_web(), _Ag(), _Model()
        eski = bam.web_tasiyici
        bam.web_tasiyici = ag
        try:
            j = bam.is_ac(con, "Osmanlı Devleti nasıl kuruldu, araştır", now=AN)["id"]
            _tik(con, cfg, m, 4)                       # kayit, plan, tarama, okuma
            eq(bam.is_getir(con, j)["adimlar"][1]["kaynakli"]["asama"], "yazim")
            once = len(ag.cagri)
            _tik(con, cfg, m, 1)                       # yazim
            eq(len(ag.cagri), once, "yazim aga cikmamali; metin onbellekten")
        finally:
            bam.web_tasiyici = eski
        k = bam.kayit_getir(con, bam.is_getir(con, j)["adimlar"][1]["kayit_id"])
        eq(k["dogruluk"], "kaynakli")
        g = k["govde"]
        eq([x["baslik"] for x in g["kaynaklar"]], ["Osmanlı İmparatorluğu", "Söğüt"])
        eq(g["dogrulama"], {"toplam": 2, "dogrulanan": 1})
        eq([b["dogrulandi"] for b in g["bulgular"]], [True, False])
        eq(g["bulgular"][0]["kaynaklar"], [1])                 # [9] yok: duser
        eq(g["sorgular"], ["Osmanlı kuruluşu", "Söğüt ilçesi"])  # kisisel sorgu dustu
        ok("[1] Osmanlı İmparatorluğu" in m.icerikler[-1])
    test("dort tik: plan, tarama, okuma, yazim; yazim onbellekten", t_is)

    def t_dusus():
        con = db.connect(":memory:")
        eski = bam.web_tasiyici
        bam.web_tasiyici = _Ag(bos=True)
        try:
            j = bam.is_ac(con, "Osmanlı Devleti nasıl kuruldu, araştır", now=AN)["id"]
            _tik(con, _cfg_web(), _Model(), 3)
        finally:
            bam.web_tasiyici = eski
        a = bam.is_getir(con, j)["adimlar"][1]
        eq(a["durum"], "tamam")
        k = bam.kayit_getir(con, a["kayit_id"])
        eq(k["dogruluk"], "dogrulanmadi")
        ok("Web'de sonuç bulunamadı" in k["govde"]["web"])
    test("web sonuc vermezse kaynaksiz yola duser ve nedenini yazar", t_dusus)

    def t_mufredat():
        con = db.connect(":memory:")
        eski = bam.web_tasiyici
        bam.web_tasiyici = _Ag()
        try:
            e = king.emir_ac(con, _cfg_web(), "ays", "sinav.mufredat",
                             {"mufredat": {"sinav": "KPSS Genel Kültür"}}, now=AN)["emir"]
            _tik(con, _cfg_web(), _Model(), 5)
        finally:
            bam.web_tasiyici = eski
        son = king.emir(con, e["id"])
        eq(son["durum"], "bitti")
        k = bam.kayit_getir(con, son["sonuc"]["kayit_id"])
        eq([d["dogrulandi"] for d in k["govde"]["dersler"]], [True, False])
        eq(k["dogruluk"], "kaynakli")                 # yarisi dogrulandi
        eq(len(k["govde"]["kaynaklar"]), 2)
    test("mufredat web aciksa ders ders kaynagina baglanir", t_mufredat)

    def t_king_web():
        con = db.connect(":memory:")
        ag, m = _Ag(), _Model()
        eski = web.VARSAYILAN_TASIYICI
        web.VARSAYILAN_TASIYICI = ag
        try:
            r = sohbet.konus(con, _cfg_web(), "internette Osmanlı kuruluşuna bak", "2026-09-23",
                             gorevli="king", transport=m, kayit=False)
            eq(r["mode"], "model")
            ok("Kaynaklar:\n[1] Osmanlı İmparatorluğu — https://tr.wikipedia.org/wiki/" in r["text"])
            ok("WEB KAYNAKLARI VERİLDİYSE" in m.sistemler[-1])
            ok("Osmanlı Devleti 1299" in m.sistemler[-1])
            once = len(ag.cagri)
            sohbet.konus(con, _cfg_web(), "internette Osmanlı kuruluşuna bak", "2026-09-23",
                         gorevli="bio", transport=m, kayit=False)
            eq(len(ag.cagri), once, "alt patron web'e cikmamali")
            r3 = sohbet.konus(con, _cfg_web(), "uykum nasıl", "2026-09-23", gorevli="king",
                              transport=m, kayit=False)
            no("Kaynaklar:" in r3["text"])
            eq(len(ag.cagri), once, "tetik yoksa web'e cikilmaz")
        finally:
            web.VARSAYILAN_TASIYICI = eski
    test("King web'e bakar, kaynak listesini kod ekler; alt patron bakamaz", t_king_web)
