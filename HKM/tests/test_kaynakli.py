# -*- coding: utf-8 -*-
"""Kaynakli arastirma (core/kaynakli.py, core/bam.py).

   Kanitladigi sozler:
     1. Sorgular suzulur; ayni alan en cok iki kez; resmi alan once.
     2. Alinti KODLA dogrulanir; kaynakta gecmeyen alinti «dogrulanamadi».
     3. Is dort tikte ilerler (plan, tarama, okuma, yazim); yazim ag'a
        cikmaz, metin onbellekten gelir. Kayitin etiketi olculur.
     4. Web sonuc vermezse is kaynaksiz yola duser ve NEDENINI yazar.
     5. Mufredat web aciksa ders ders kaynagina baglanir.
     6. Her asamanin ajani adima iz birakir; kaynak turu ve kanit gucu
        KODLA olculur.
     7. Derin Arastirmaci: acik kalan varsa tek bir ek tur; yeni kaynak
        numarasi devam eder, yazar ilk taslagi gorur.
     8. Guncellemede plan modeli cagrilmaz, yazar onceki surumu gorur ve
        degisiklikleri yazar.
   (King artik arastirmaz; o soz tests/test_depo.py'de.)"""
import json
import urllib.parse

from core import bam, cikti, db, kaynakli, king
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


class _DerinAg(_Ag):
    """Acik kalan sorgusu icin YENI bir sayfa doner."""
    YENI = {"Osmanlı kuruluş tarihi": "Tarihçilerin çoğu kuruluş için 1299 yılını kabul eder; "
                                      "bazı kaynaklar 1302 Bafeus savaşını başlangıç sayar. " * 6}

    def __call__(self, url, basliklar=None, govde=None, guvenilir=False):
        q = dict(urllib.parse.parse_qsl(urllib.parse.urlsplit(url).query))
        if q.get("list") == "search" and "tartışmalı" in q.get("srsearch", ""):
            self.cagri.append(url)
            d = {"query": {"search": [{"title": t, "snippet": t} for t in self.YENI]}}
            return 200, {"Content-Type": "application/json"}, json.dumps(d).encode("utf-8"), url
        if q.get("titles") in self.YENI:
            self.cagri.append(url)
            d = {"query": {"pages": {"1": {"title": q["titles"], "extract": self.YENI[q["titles"]]}}}}
            return 200, {"Content-Type": "application/json"}, json.dumps(d).encode("utf-8"), url
        return super().__call__(url, basliklar, govde, guvenilir)


class _DerinModel(_Model):
    def __call__(self, provider, anahtar, model, sistem, gecmis):
        icerik = gecmis[-1]["content"]
        if "Araştırma Yazarı" in sistem and "İLK TASLAK" in icerik:
            self.sistemler.append(sistem)
            self.icerikler.append(icerik)
            return json.dumps({"baslik": "Osmanlı'nın kuruluşu", "ozet": "1299 [1][3].",
                               "bulgular": [
                                   {"iddia": "Osmanlı 1299'da kuruldu.", "kaynaklar": [1],
                                    "alinti": "Osmanlı Devleti 1299 yılında Söğüt ve Domaniç"},
                                   {"iddia": "Bazı kaynaklar 1302'yi başlangıç sayar.",
                                    "kaynaklar": [3],
                                    "alinti": "bazı kaynaklar 1302 Bafeus savaşını başlangıç sayar"}],
                               "celiskiler": ["1299 ile 1302 arasında görüş ayrılığı var."],
                               "acik_kalanlar": []}, ensure_ascii=False), 100, 200
        if "Araştırma Yazarı" in sistem and "ÖNCEKİ SÜRÜM" in icerik:
            self.sistemler.append(sistem)
            self.icerikler.append(icerik)
            return json.dumps({"baslik": "Osmanlı'nın kuruluşu", "ozet": "1299 [1].",
                               "bulgular": [{"iddia": "Osmanlı 1299'da kuruldu.", "kaynaklar": [1],
                                             "alinti": "Osmanlı Devleti 1299 yılında Söğüt"}],
                               "acik_kalanlar": [],
                               "degisiklikler": ["Söğüt kaynağı yeniden yazılmış; ilçe bilgisi "
                                                 "düştü."]}, ensure_ascii=False), 100, 200
        return super().__call__(provider, anahtar, model, sistem, gecmis)


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
            _tik(con, cfg, m, 1)                       # yazim (+ derin arama, yeni kaynak yok)
            okuma = [u for u in ag.cagri[once:] if "list=search" not in u]
            eq(okuma, [], "yazim sayfa okumaz; metin onbellekten")
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

    def t_ajan_izi():
        con = db.connect(":memory:")
        eski = bam.web_tasiyici
        bam.web_tasiyici = _Ag()
        try:
            j = bam.is_ac(con, "Osmanlı Devleti nasıl kuruldu, araştır", now=AN)["id"]
            _tik(con, _cfg_web(), _Model(), 5)
        finally:
            bam.web_tasiyici = eski
        a = bam.is_getir(con, j)["adimlar"][1]
        ajanlar = [x["ajan"] for x in a["iz"]]
        eq(ajanlar, ["Araştırma Mimarı", "Kaynak Tarayıcı", "Akademik Kaynak Uzmanı",
                     "Birincil Kaynak Uzmanı", "Araştırma Yazarı", "Derin Araştırmacı",
                     "Kaynak Doğrulayıcı", "Kanıt Analisti", "Çelişki Analisti"])
        ok(all(x["yapti"] for x in a["iz"]))
        g = bam.kayit_getir(con, a["kayit_id"])["govde"]
        eq({x["tur"] for x in g["kaynaklar"]}, {"ansiklopedi"})
        eq([b["kanit"] for b in g["bulgular"]], ["orta", "yok"])
        eq((g["kanit"]["orta"], g["kanit"]["yok"], g["kanit"]["etiket"]), (1, 1, "hesaplandi"))
        eq(kaynakli.kaynak_turu("osym.gov.tr"), "resmi")
        eq(kaynakli.kaynak_turu("dergipark.org.tr"), "akademik")
        b = [{"dogrulandi": True, "dogrulayan": [1, 2]}, {"dogrulandi": True, "dogrulayan": [3]},
             {"dogrulandi": True, "dogrulayan": [4]}]
        k = [{"n": 1, "alan": "a.com"}, {"n": 2, "alan": "b.com"}, {"n": 3, "alan": "meb.gov.tr"},
             {"n": 4, "alan": "blog.com"}]
        kaynakli.kanit(b, k)
        eq([x["kanit"] for x in b], ["guclu", "guclu", "zayif"])
    test("her asama iz birakir; kaynak turu ve kanit gucu kodla olculur", t_ajan_izi)

    def t_derin():
        con, ag, m = db.connect(":memory:"), _DerinAg(), _DerinModel()
        eski = bam.web_tasiyici
        bam.web_tasiyici = ag
        try:
            j = bam.is_ac(con, "Osmanlı Devleti nasıl kuruldu, araştır", now=AN)["id"]
            _tik(con, _cfg_web(), m, 5)               # ... yazim + derin arama
            a = bam.is_getir(con, j)["adimlar"][1]
            eq((a["durum"], a["kaynakli"]["asama"]), ("bekliyor", "derin_okuma"))
            eq(a["kaynakli"]["derin_sorgular"], ["Kesin tarih tartışmalı."])
            _tik(con, _cfg_web(), m, 2)               # derin okuma, yeniden yazim
        finally:
            bam.web_tasiyici = eski
        a = bam.is_getir(con, j)["adimlar"][1]
        eq(a["durum"], "tamam")
        g = bam.kayit_getir(con, a["kayit_id"])["govde"]
        eq([x["n"] for x in g["kaynaklar"]], [1, 2, 3])
        eq(g["derinlestirme"]["yeni_kaynak"], 1)
        eq([b["dogrulandi"] for b in g["bulgular"]], [True, True])
        eq(g["bulgular"][1]["dogrulayan"], [3])
        eq(g["acik_kalanlar"], [])
        ok("İLK TASLAK" in m.icerikler[-1] and "[3] Osmanlı kuruluş tarihi" in m.icerikler[-1])
        eq(sum(1 for x in m.sistemler if "Araştırma Yazarı" in x), 2, "tek derin tur")
    test("derin arastirmaci: acik kalan icin tek ek tur, yeni kaynakla yeniden yazim", t_derin)

    def t_guncelleme():
        con, ag, m, cfg = db.connect(":memory:"), _Ag(), _DerinModel(), _cfg_web()
        eski = bam.web_tasiyici
        bam.web_tasiyici = ag
        global METIN
        eski_metin = dict(METIN)
        try:
            e1 = king.emir_ac(con, cfg, "hkm", "bam.arastirma",
                              {"arastirma": {"konu": "Osmanlı kuruluşu"}}, now=AN)["emir"]
            _tik(con, cfg, m, 5)
            k1 = king.emir(con, e1["id"])["sonuc"]["kayit_id"]
            METIN["Söğüt"] = "Bu sayfa tamamen yeniden yazıldı ve içeriği başka bir konuya " \
                             "geçti; eski cümlelerin hiçbiri artık yer almıyor. " * 6
            plan_once = sum(1 for x in m.sistemler if "Araştırma Mimarı" in x)
            e2 = king.emir_ac(con, cfg, "hkm", "bam.arastirma",
                              {"arastirma": {"konu": "Osmanlı kuruluşu"}},
                              now="2026-09-27T10:00:00")["emir"]
            for _ in range(5):
                bam.ilerlet(con, cfg, transport=m, now="2026-09-27T10:00:00")
                king.esitle(con, now="2026-09-27T10:00:00")
        finally:
            bam.web_tasiyici = eski
            METIN.clear()
            METIN.update(eski_metin)
        eq(sum(1 for x in m.sistemler if "Araştırma Mimarı" in x), plan_once,
           "guncellemede plan modeli cagrilmaz")
        son = king.emir(con, e2["id"])
        eq(son["durum"], "bitti")
        k2 = bam.kayit_getir(con, son["sonuc"]["kayit_id"])
        eq((k2["surum"], k2["onceki_id"]), (2, k1))
        eq(k2["govde"]["onceki_surum"]["id"], k1)
        eq(k2["govde"]["degisiklikler"], ["Söğüt kaynağı yeniden yazılmış; ilçe bilgisi düştü."])
        ok("ÖNCEKİ SÜRÜM (kayıt #%d" % k1 in m.icerikler[-1])
        j2 = bam.is_getir(con, son["bam_is_id"])
        ok(any("önceki sürümün sorguları" in x["yapti"] for x in j2["adimlar"][1]["iz"]))
        h = cikti.html_belge(cikti.belge(k2))
        ok("Bu sürümde değişen" in h and "ilçe bilgisi düştü" in h)
        ok("(doğrulandı, orta kanıt)" in h and "(ansiklopedi, erişim" in h)
    test("guncelleme: plan modeli yok, yazar onceki surumu gorur, degisiklik yazilir",
         t_guncelleme)

