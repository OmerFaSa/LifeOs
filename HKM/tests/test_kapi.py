# -*- coding: utf-8 -*-
"""HKM giris kapisi (core/kapi.py). Kullanici 2026-09-24: «test kitabi,
gitar, sozluk gibi turlu turlu seyi HKM'den girecegiz.» Kanitladigi sozler:
her istek ilgili modulun ADINA King is emri (kitap → AYS, gitar/unite →
ESP) ya da modul teklifi (kelime → ESP kart.add) olur; HKM module YAZMAZ;
eksik bilgi tahmin edilmez, SORULUR."""

from core import db, intents, kapi, king, sohbet
from tests.harness import eq, no, ok, suite, test

BUGUN = "2026-09-24"


def run():
    suite("HKM giriş kapısı")

    def t_tani():
        k = kapi.tani("türev ve integral test kitabı hazırla")
        eq(k["tur"], "kitap")
        eq([b["ad"] for b in k["kitap"]["bolumler"]], ["Türev", "İntegral"])
        eq(k["kitap"]["baslik"], "Türev ve integral test kitabı")
        g = kapi.tani("gitar alıştırması hazırla: barre akorları, başlangıç")
        eq((g["tur"], g["unite"]["alan"], g["unite"]["duzey"], g["unite"]["konu"]),
           ("gitar", "gitar", "başlangıç", "barre akorları"))
        s = kapi.tani("gitar alıştırması: barre akorları")
        ok("düzey" in s["soru"], s)
        u = kapi.tani("İspanyolca A1 selamlaşma ünitesi hazırla")
        eq((u["tur"], u["unite"]["dil"], u["unite"]["duzey"], u["unite"]["konu"]),
           ("unite", "es", "A1", "selamlaşma"))
        ok("düzey" in kapi.tani("Rusça selamlaşma ünitesi hazırla")["soru"])
        w = kapi.tani("sözlüğe ekle: apple = elma, book = kitap")
        eq((w["tur"], [(x["on"], x["arka"]) for x in w["kartlar"]]),
           ("kelime", [("apple", "elma"), ("book", "kitap")]))
        eq(kapi.tani("İngilizce kelime: run - koşmak")["kartlar"][0]["dil"], "en")
        ok("=" in kapi.tani("sözlüğe ekle apple elma")["soru"])
        eq(kapi.tani("bugün 2 saat matematik çalıştım"), None)
        eq(kapi.tani("türev hakkında özet hazırla"), None)
    test("tanima: kitap, gitar, unite, kelime; eksikte soru", t_tani)

    def t_sohbet():
        con = db.connect(":memory:")
        cfg = {}
        r = sohbet.konus(con, cfg, "sözlüğe ekle: apple = elma", BUGUN, gorevli="king", kayit=False)
        eq(r["command"], "kapi")
        ok("ESP" in r["text"] and "1 kart" in r["text"], r["text"])
        n = intents.take(con, "esp")["intents"]
        eq([(x["kind"], x["payload"]["on"], x["payload"]["arka"]) for x in n], [("kart.add", "apple", "elma")])
        r = sohbet.konus(con, cfg, "türev test kitabı hazırla", BUGUN, gorevli="king", kayit=False)
        eq(r["command"], "kapi")
        e = king.emirler(con)[0]
        eq((e["tur"], e["modul"]), ("test.kitabi", "ays"))
        r = sohbet.konus(con, cfg, "gitar alıştırması: barre akorları", BUGUN, gorevli="king", kayit=False)
        ok("düzey" in r["text"], r["text"])
        eq(len(king.emirler(con)), 1, "soru sorulurken emir acilmaz")
        no(intents.validate("esp", "kart.add", {"on": "", "arka": "x"})[0])
        no(intents.validate("ays", "kart.add", {"on": "a", "arka": "b"})[0])
    test("sohbet: modul adina emir ya da teklif; eksikte emir yok", t_sohbet)
