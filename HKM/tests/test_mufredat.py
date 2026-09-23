# -*- coding: utf-8 -*-
"""Mufredat raporu — sinav profilinin iskeleti (core/mufredat.py).

   Kanitladigi sozler:
     1. Girdi kapalidir: yalniz sinav adi ve bolum; ayni sinav buyuk-kucuk
        harf ve bosluk farkiyla ayni anahtardir.
     2. Modelin ciktisi kodla suzulur: tekrar eden ders ve konu, bos ders,
        aralik disi soru sayisi duser; hic ders kalmazsa kayit YAZILMAZ.
     3. Zincir: AYS -> King -> BAM Arastirma -> kayit («dogrulanmadi»)
        -> AYS'ye mufredat.add teklifi. Baska modul bu isi isteyemez.
     4. Once depo: ayni sinav ikinci kez istenirse model cagrilmaz."""
import json

from core import bam, db, intents, king, mufredat
from tests.yardim import onayla
from tests.harness import eq, no, ok, suite, test
from tests.test_bam import _cfg

AN = "2026-09-23T10:00:00"
SONRA = "2026-09-23T10:02:00"

RAPOR = {"baslik": "KPSS Genel Kültür", "sinav": "KPSS Genel Kültür",
         "dersler": [
             {"ad": "Tarih", "soru_sayisi": 27,
              "konular": ["İslamiyet Öncesi Türk Tarihi", "Osmanlı Kuruluş Dönemi",
                          "osmanlı  kuruluş dönemi", "x"]},
             {"ad": "Coğrafya", "soru_sayisi": 999, "konular": ["Türkiye'nin İklimi"]},
             {"ad": "tarih", "konular": ["Tekrar eden ders"]},
             {"ad": "Vatandaşlık", "soru_sayisi": True, "konular": []},
         ],
         "puanlama_notu": "", "acik_kalanlar": ["Güncel kılavuz yılı bilinmiyor."]}


def _tasiyici(metin, sayac=None):
    def cagir(provider, anahtar, model, sistem, gecmis):
        if sayac is not None:
            sayac.append(sistem)
        return metin, 100, 200
    return cagir


def _yasak(*a):
    raise AssertionError("model cagrilmamaliydi")


def _emir(con, cfg, sinav="KPSS Genel Kültür", modul="ays", now=AN):
    return onayla(con, cfg, king.emir_ac(con, cfg, modul, "sinav.mufredat",
                                         {"mufredat": {"sinav": sinav}}, now=now), now=now)


def _kostur(con, cfg, transport, now=AN):
    for _ in range(2):
        bam.ilerlet(con, cfg, transport=transport, now=now)
        king.esitle(con, now=now)


def run():
    suite("mufredat")

    def t_girdi():
        g, h = mufredat.temizle({"sinav": "  KPSS   Genel Kültür ", "bolum": "Tarih"})
        eq((g, h), ({"sinav": "KPSS Genel Kültür", "bolum": "Tarih"}, []))
        no(mufredat.temizle({"sinav": "K"})[0])
        no(mufredat.temizle({"sinav": "KPSS", "kullanici": "Ali"})[0])
        no(mufredat.temizle({"sinav": "KPSS", "bolum": "x" * 81})[0])
        no(mufredat.temizle("KPSS")[0])
        a = mufredat.anahtar({"mufredat": {"sinav": "KPSS Genel Kültür"}})
        b = mufredat.anahtar({"mufredat": {"sinav": "kpss  genel kültür"}})
        eq(a, b)
        no(a == mufredat.anahtar({"mufredat": {"sinav": "KPSS", "bolum": "Tarih"}}))
    test("girdi kapalidir; ayni sinav ayni anahtardir", t_girdi)

    def t_suzme():
        g, neden = mufredat.ayikla(RAPOR, {"sinav": "KPSS Genel Kültür"})
        eq(neden, None)
        eq([d["ad"] for d in g["dersler"]], ["Tarih", "Coğrafya"])
        eq(g["dersler"][0]["konular"], ["İslamiyet Öncesi Türk Tarihi", "Osmanlı Kuruluş Dönemi"])
        eq([d["soru_sayisi"] for d in g["dersler"]], [27, None])   # 999 aralik disi
        eq((g["ders_sayisi"], g["konu_sayisi"]), (2, 3))
        eq(g["dusen"], 4)            # tekrar konu, kisa konu, tekrar ders, bos ders
        eq(g["puanlama_notu"], None)
        ok("resmi kılavuz" in g["uyari"].lower() or "Resmi kılavuz" in g["uyari"])
        no(mufredat.ayikla({"dersler": [{"ad": "T", "konular": ["a"]}]}, {"sinav": "X"})[0])
        no(mufredat.ayikla({"dersler": []}, {"sinav": "X"})[0])
        no(mufredat.ayikla(None, {"sinav": "X"})[0])
    test("model ciktisi kodla suzulur; hic ders kalmazsa rapor yok", t_suzme)

    def t_zincir():
        con = db.connect(":memory:")
        cfg = _cfg()
        no(_emir(con, cfg, modul="spi")["ok"], "mufredati yalniz AYS isteyebilir")
        r = _emir(con, cfg)
        eq(r["karar"], "onay")
        e = r["emir"]
        eq(e["konu"], "«KPSS Genel Kültür» müfredatı: dersler ve konular")
        eq(bam.is_getir(con, e["bam_is_id"])["ofisler"], ["kayit", "arastirma"])
        sistemler = []
        _kostur(con, cfg, _tasiyici(json.dumps(RAPOR, ensure_ascii=False), sistemler))
        eq(len(sistemler), 1)
        ok("UYDURMA" in sistemler[0])
        son = king.emir(con, e["id"])
        eq(son["durum"], "bitti")
        k = bam.kayit_getir(con, son["sonuc"]["kayit_id"])
        eq((k["tur"], k["dogruluk"], k["govde"]["tur"]), ("arastirma", "dogrulanmadi", "mufredat"))
        n = intents.take(con, "ays")["intents"]
        eq([x["kind"] for x in n], ["mufredat.add"])
        eq(n[0]["payload"], {"kayit_id": k["id"], "ders": 2, "konu": 3,
                             "baslik": "KPSS Genel Kültür"})
        ok("Kaynaksız" in n[0]["note"])
        b = king.bildirimler(con, "ays")["bildirimler"]
        ok(any(x["tur"] == "bitti" and "teklifi" in x["metin"] for x in b))
    test("AYS -> King -> Arastirma -> dogrulanmadi kayit -> teklif", t_zincir)

    def t_depo():
        con = db.connect(":memory:")
        cfg = _cfg()
        _emir(con, cfg)
        _kostur(con, cfg, _tasiyici(json.dumps(RAPOR, ensure_ascii=False)))
        r = _emir(con, cfg, sinav="kpss   genel kültür", now=SONRA)
        eq(r["emir"]["durum"], "bitti")
        eq(r["emir"]["sonuc"]["gercek_sn"], 0)
        _kostur(con, cfg, _yasak, now=SONRA)                 # model cagrilmaz
        eq(con.execute("SELECT COUNT(*) FROM bam_kayitlar").fetchone()[0], 1)
    test("ayni sinav ikinci kez istenirse depodan gelir", t_depo)

    def t_bozuk_cikti():
        con = db.connect(":memory:")
        cfg = _cfg()
        e = _emir(con, cfg)["emir"]
        _kostur(con, cfg, _tasiyici('{"dersler": [{"ad": "T", "konular": []}]}'))
        eq(king.emir(con, e["id"])["durum"], "hata")
        eq(con.execute("SELECT COUNT(*) FROM bam_kayitlar").fetchone()[0], 0)
        eq(intents.take(con, "ays")["intents"], [])
    test("gecersiz mufredat kayda ve teklife donusmez", t_bozuk_cikti)

    def t_modelsiz():
        con = db.connect(":memory:")
        r = _emir(con, {"local_token": "x"})
        eq(r["karar"], "kismi")
        ok(any(m["ad"] == "model:arastirma" and not m["ok"] for m in r["emir"]["kontrol"]))
    test("model yoksa is bekler; karar kismi ve nedeni yazili", t_modelsiz)
