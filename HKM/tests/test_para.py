# -*- coding: utf-8 -*-
"""Para kolu (Y1, core/para.py). Kanitladigi sozler: tutari kullanici
soyler; para oldugu belli degilse sayi para sayilmaz («40 soru»); kategori
koddan; TL disi birim TL toplamina katilmaz; geri al son mesaji siler;
sohbet ve Telegram ayni yoldan yazar; kayit yedege girer."""

from core import db, para, sohbet
from tests.harness import eq, no, ok, suite, test

BUGUN = "2026-09-24"


def run():
    suite("para kolu")

    def t_tani():
        r = para.tani("market 450 TL, kahve 85,50 ve kira 12.500 lira")
        eq([(x["kategori"], x["kurus"], x["yon"]) for x in r["kayitlar"]],
           [("Gıda", 45000, "gider"), ("Dışarıda yemek", 8550, "gider"), ("Konut", 1250000, "gider")])
        eq(para.tani("maaş 30.000 geldi")["kayitlar"][0][ "yon"], "gelir")
        eq(para.tani("dün taksiye 120 tl verdim")["gun_kayma"], -1)
        eq(para.tani("dün taksiye 120 tl verdim")["kayitlar"][0]["kategori"], "Ulaşım")
        eq(para.tani("20 $ kitap")["kayitlar"][0]["birim"], "USD")
        # Para oldugu belli degil: kayit yok.
        eq(para.tani("40 soru çözdüm"), None)
        eq(para.tani("2 saat matematik"), None)
        eq(para.tani("uyku 7"), None)
        eq(para.tani("para geri al"), None)
        # Modul kisa kayitlari para DEGILDIR: kategori sozcugu tek basina kanit degil.
        for m in ("kitap 30", "spor 45", "deneme 80", "yemek 2", "yol 5"):
            eq(para.tani(m), None, m)
        # Ayni mesajda acik bir para parcasi varsa oteki tutarlar da paradir.
        eq(len(para.tani("kitap 120 ve market 300 tl")["kayitlar"]), 2)
        eq(para.tani("150 tl")["kayitlar"][0]["kategori"], "Diğer")
    test("tanima: tutar, yon, kategori; para olmayan sayi para degil", t_tani)

    def t_yaz_ay_geri_al():
        con = db.connect(":memory:")
        r = para.yaz(con, para.tani("market 450 TL ve kahve 85,50 tl"), "telegram", "m", BUGUN)
        eq(len(r["ids"]), 2)
        para.yaz(con, para.tani("20 $ kitap"), "telegram", "m2", BUGUN)
        a = para.ay(con, "2026-09")
        eq([(o["birim"], o["gider"]) for o in a["ozet"]], [("TRY", 53550), ("USD", 2000)])
        eq(a["kategoriler"][0]["kategori"], "Gıda")
        eq(a["kesinlik"], "ölçüldü")
        ok("535,50 TL" in a["metin"], a["metin"])
        eq(para.geri_al(con, "telegram")["adet"], 1)            # son mesaj: 20 $
        eq([o["birim"] for o in para.ay(con, "2026-09")["ozet"]], ["TRY"])
        eq(para.ay(con, "2026-08")["kesinlik"], "veri yok")
        no(para.ay(con, "eylül")["ok"])
    test("yaz, ay ozeti (birim basina, kur yok), geri al", t_yaz_ay_geri_al)

    def t_form():
        con = db.connect(":memory:")
        eq(para.ekle(con, {"yon": "gider", "tutar": "1.250,50", "kategori": "Fatura"}, BUGUN)["ok"], True)
        r = para.ekle(con, {"yon": "yan", "tutar": "0", "kategori": "Uydurma"}, BUGUN)
        eq(len(r["errors"]), 3)
        x = para.ay(con, "2026-09")["kayitlar"][0]
        eq((x["kurus"], x["tutar"], x["kaynak"]), (125050, "1.250,50 TL", "web"))
        eq(para.sil(con, x["id"])["ok"], True)
        eq(para.ay(con, "2026-09")["kayitlar"], [])
        ok("para" in db.export_all(con))
    test("form dogrular; silinen kayit toplamdan cikar; yedege girer", t_form)

    def t_sohbet():
        """Sohbet ve Telegram ayni yol: model cagrilmaz, kayit yazilir,
        cevap geri alma yolunu soyler."""
        con = db.connect(":memory:")
        r = sohbet.konus(con, {}, "market 450 TL", BUGUN, gorevli="king", kayit=False, kanal="telegram")
        eq(r["command"], "para")
        ok("Kaydedildi: 450 TL gider (Gıda" in r["text"] and "para geri al" in r["text"], r["text"])
        r2 = sohbet.konus(con, {}, "para geri al", BUGUN, gorevli="king", kayit=False, kanal="telegram")
        eq(r2["command"], "para")
        ok("1 kayıt geri alındı" in r2["text"], r2["text"])
        eq(para.ay(con, "2026-09")["kayitlar"], [])
        r3 = sohbet.konus(con, {}, "40 soru çözdüm", BUGUN, gorevli="king", kayit=False, kanal="telegram")
        no(r3.get("command") == "para")
    test("sohbet/Telegram: yaz ve geri al ayni yoldan", t_sohbet)
