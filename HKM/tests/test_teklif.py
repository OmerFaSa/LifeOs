# -*- coding: utf-8 -*-
"""King'in teklifi (core/teklif.py, Part 8a).

   Kanitladigi sozler:
     1. Sinifi KOD verir: is birimi (model cagrisi + web) tek tablodan.
     2. Maliyet once OLCUMDEN: ayni tur ve sinifta biten islerin olculen
        maliyeti; yoksa olculen cagri basina; yoksa tarife. Model yoksa
        maliyet uydurulmaz. Her yolun etiketi «tahmin» ve dayanagi yazili.
     3. Butce payi tavandan; tavan yoksa soylenir.
     4. Secenekler genel kuralla (tur basina kucultucu); oneri koddan ve
        gerekceli.
     5. Is emri teklifi tasir; secenek govdesi ekrana cikmaz."""
import json

from core import bam, butce, db, king, models, teklif
from tests.harness import eq, no, ok, suite, test
from tests.test_bam import _cfg

AN = "2026-09-23T10:00:00"


def _kitap(n):
    return {"kitap": {"baslik": "Deneme kitabı", "bolumler": [
        {"ad": "Bölüm %d" % (i + 1), "konular": [], "adet": 5} for i in range(n)]}}


def _modelsiz():
    return {"local_token": "x", "web": {"acik": False},
            "budget": {"monthly_usd": 10.0, "ceiling_currency": "usd"}}


def run():
    suite("teklif")

    def t_sinif():
        of = king.ofisler_of
        b = teklif.birim("test.kitabi", _kitap(6), of("test.kitabi"))
        eq((b["model"], teklif.sinif(b)), (12, "yuksek"))
        eq(teklif.sinif(teklif.birim("test.kitabi", _kitap(1), of("test.kitabi"))), "dusuk")
        u = {"urun": {"tur": "pankart", "konu": "Su", "kaynakli": False}}
        eq(teklif.sinif(teklif.birim("bam.urun", u, of("bam.urun", u))), "dusuk")
        uk = {"urun": {"tur": "rapor", "konu": "Su", "kaynakli": True}}
        b = teklif.birim("bam.urun", uk, of("bam.urun", uk))
        eq((b["model"], b["web"] > 0, teklif.sinif(b)), (5, True, "orta"))
        # Web isteyen is «dusuk» olamaz: tabloda dusuk sinif web'siz.
        eq(teklif.sinif({"model": 1, "web": 2}), "orta")
        eq(teklif.sinif({"model": 41, "web": 0}), "ekstra")
        ok("bölüm × 2 çağrı" in teklif.birim("test.kitabi", _kitap(2),
                                             of("test.kitabi"))["dayanak"])
    test("sinifi kod verir: is birimi tek tablodan", t_sinif)

    def t_maliyet_yollari():
        con = db.connect(":memory:")
        of = ["kayit", "uretim"]
        b = {"model": 2, "web": 0}
        # Model atanmamis: uydurulmaz.
        m = teklif.maliyet(con, _modelsiz(), "test.kitabi", "dusuk", b, of)
        eq((m["usd"], m["etiket"], m["metin"]), (None, "veri_yok", "hesaplanamadı"))
        # Tarife yolu.
        m = teklif.maliyet(con, _cfg(), "test.kitabi", "dusuk", b, of)
        ok(m["usd"] > 0 and m["etiket"] == "tahmin" and "tarifesi" in m["dayanak"], m)
        # Olculen cagri basina (en az 5 cagri bir ise yazilmis).
        for _ in range(5):
            butce.record(con, role="bam.uretim", task="urun", provider="p", model="m",
                         usd=0.02, is_id=1)
        m = teklif.maliyet(con, _cfg(), "test.kitabi", "dusuk", b, of)
        eq((m["usd"], m["etiket"]), (0.04, "tahmin"))
        ok("ölçülen çağrı başına" in m["dayanak"])
        # Ayni tur ve sinifta biten uc isin olculen maliyeti.
        for usd in (0.1, 0.2, 0.9):
            con.execute("INSERT INTO is_emirleri(modul,tur,konu,neden,govde,anahtar,iz,karar,"
                        "kontrol,durum,created_at,updated_at,teklif,sonuc) VALUES "
                        "('ays','test.kitabi','k','','{}','a','[]','onay','[]','bitti',?,?,?,?)",
                        (AN, AN, json.dumps({"sinif": "dusuk"}),
                         json.dumps({"maliyet": {"cagri": 2, "usd": usd}})))
        m = teklif.maliyet(con, _cfg(), "test.kitabi", "dusuk", b, of)
        eq((m["usd"], m["usd_p90"]), (0.2, 0.9))
        ok("son 3 işin ölçülen maliyeti" in m["dayanak"])
        # Baska sinifin gecmisi karismaz.
        m = teklif.maliyet(con, _cfg(), "test.kitabi", "yuksek", b, of)
        ok("ölçülen çağrı başına" in m["dayanak"])
        # Modelsiz is bedavadir ve bu HESAPLANMISTIR.
        m = teklif.maliyet(con, _cfg(), "hedef.plan", "dusuk", {"model": 0, "web": 0}, of)
        eq((m["usd"], m["etiket"], m["metin"]), (0.0, "hesaplandi", "ücretsiz"))
    test("maliyet once olcumden; model yoksa uydurulmaz", t_maliyet_yollari)

    def t_butce_payi():
        con = db.connect(":memory:")
        cfg = _modelsiz()
        p = teklif.butce_payi(con, cfg, {"usd": 1.0})
        eq((p["pay_yuzde"], p["sigar"]), (10, True))
        ok("bütçe payı %10" in p["metin"] and "kalan 10,00 USD" in p["metin"], p["metin"])
        ok("%1’den az" in teklif.butce_payi(con, cfg, {"usd": 0.0004})["metin"])
        eq(teklif.butce_payi(con, cfg, {"usd": 12.0})["sigar"], False)
        # Tavan sifirsa pay uydurulmaz (varsayilan tavan 20 USD'dir).
        yok = {"local_token": "x", "budget": {"monthly_usd": 0.0, "ceiling_currency": "usd"}}
        p = teklif.butce_payi(con, yok, {"usd": 1.0})
        eq(p["pay_yuzde"], None)
        ok("tanımlı değil" in p["metin"])
        eq(teklif.butce_payi(con, cfg, {"usd": None})["metin"], None)
    test("butce payi tavandan; tavan yoksa soylenir", t_butce_payi)

    def t_secenek_ve_oneri():
        con = db.connect(":memory:")
        cfg = _cfg()
        t = teklif.kur(con, cfg, "test.kitabi", _kitap(3), king.ofisler_of, king.tahmini_sure)
        eq([s["id"] for s in t["secenekler"]], ["tam", "kucuk", "parca"])
        eq(len(t["secenekler"][1]["govde"]["kitap"]["bolumler"]), 1)
        # Parca parca: ayni kitap, her bolumde durur; sinifi tamin aynisi.
        eq((t["secenekler"][2]["govde"]["parcali"], t["secenekler"][2]["sinif"]), (True, "orta"))
        eq((t["secenekler"][0]["sinif"], t["secenekler"][1]["sinif"]), ("orta", "dusuk"))
        # Kitap her tikte bir bolum: uc bolum iki ek tik.
        ok(t["secenekler"][0]["sure"]["sn"] > t["secenekler"][1]["sure"]["sn"])
        ok(t["metin"].startswith("Teklif (tahmin): 1) tam: orta sınıf"), t["metin"])
        # Butce darsa kucuk onerilir ve nedeni soylenir.
        dar = dict(cfg, budget={"monthly_usd": 0.0001, "ceiling_currency": "usd"})
        t = teklif.kur(con, dar, "test.kitabi", _kitap(3), king.ofisler_of, king.tahmini_sure)
        eq(t["oneri"], "kucuk")
        ok("Önerim: yalnız 1. bölüm" in t["metin"], t["metin"])
        # Kucultulemeyen is tek secenektir.
        t = teklif.kur(con, cfg, "bam.arastirma", {"arastirma": {"konu": "x"}},
                       king.ofisler_of, king.tahmini_sure)
        eq([s["id"] for s in t["secenekler"]], ["tam"])
    test("secenekler genel kuralla, oneri koddan ve gerekceli", t_secenek_ve_oneri)

    def t_emir_teklifi():
        con = db.connect(":memory:")
        r = king.emir_ac(con, _cfg(), "ays", "test.kitabi", _kitap(2), now=AN)
        e = r["emir"]
        t = e["teklif"]
        eq((t["sinif"], [s["id"] for s in t["secenekler"]]), ("orta", ["tam", "kucuk", "parca"]))
        no(any("govde" in s for s in t["secenekler"]))
        eq(e["tahmin"]["sn"], t["secenekler"][0]["sure"]["sn"])
        # Onay kapisi (8a-3): is teklifte bekler; BAM'da is YOK.
        eq((e["durum"], e["bam_is_id"]), ("teklif", None))
        b = king.bildirimler(con, "ays")["bildirimler"][0]
        eq(b["tur"], "teklif")
        ok("orta sınıf" in b["metin"] and "Onaylamadan iş açılmaz" in b["metin"], b["metin"])
        eq(king.maliyet_sapmasi(con)["n"], 0)
    test("is emri teklifi tasir; govde ekrana cikmaz", t_emir_teklifi)

    # ---------------------------------------------------- onay kapisi (8a-3)
    def _teklifli(con, cfg=None, n=2, modul="ays", **ek):
        return king.emir_ac(con, cfg or _cfg(), modul, "test.kitabi", _kitap(n), now=AN, **ek)

    def t_onay_tam_kucuk():
        con, cfg = db.connect(":memory:"), _cfg()
        e = _teklifli(con)["emir"]
        eq(con.execute("SELECT COUNT(*) FROM bam_isler").fetchone()[0], 0)   # onaysiz is yok
        r = king.teklif_onayla(con, cfg, e["id"], "tam", now=AN)
        e = r["emir"]
        eq((e["durum"], e["teklif"]["secilen"]), ("onaylandi", "tam"))
        j = bam.is_getir(con, e["bam_is_id"])
        eq(len(j["govde"]["kitap"]["bolumler"]), 2)
        ok("Sınıf orta" in king.bildirimler(con, "ays")["bildirimler"][0]["metin"])
        # Ikinci onay yok: teklif artik acik degil.
        no(king.teklif_onayla(con, cfg, e["id"], now=AN)["ok"])
        # Kucuk secenek: govde kuculur, konu soyler, sure kucuk secenegin.
        e2 = _teklifli(con, n=3)["emir"]
        r = king.teklif_onayla(con, cfg, e2["id"], "kucuk", now=AN)
        e2 = r["emir"]
        eq(len(bam.is_getir(con, e2["bam_is_id"])["govde"]["kitap"]["bolumler"]), 1)
        ok(e2["konu"].endswith("yalnız 1. bölüm (fasikül)"), e2["konu"])
        eq(e2["tahmin"]["sn"], e2["teklif"]["secenekler"][1]["sure"]["sn"])
        # Olmayan secenek reddedilir.
        e3 = king.emir_ac(con, cfg, "hkm", "bam.arastirma", {"arastirma": {"konu": "Söğüt"}},
                          now=AN)["emir"]
        no(king.teklif_onayla(con, cfg, e3["id"], "kucuk", now=AN)["ok"])
    test("onay: tam ya da kucuk secenekle is BAM'da acilir; ikinci onay yok",
         t_onay_tam_kucuk)

    def t_onayda_imkan_yeniden():
        con = db.connect(":memory:")
        e = _teklifli(con)["emir"]
        # Teklif ile onay arasinda butce bitti: karar yeniden verilir.
        dar = dict(_cfg(), budget={"monthly_usd": 0.0, "ceiling_currency": "usd"})
        r = king.teklif_onayla(con, dar, e["id"], now=AN)
        eq((r["karar"], r["emir"]["durum"]), ("kismi", "kismen_onay"))
        ok("Eksik" in king.bildirimler(con, "ays")["bildirimler"][0]["metin"])
    test("onay aninda imkan kontrolu yeniden yapilir", t_onayda_imkan_yeniden)

    def t_iptal_ve_tekrar():
        con, cfg = db.connect(":memory:"), _cfg()
        e = _teklifli(con)["emir"]
        r2 = _teklifli(con)
        eq((r2["yeni"], r2["emir"]["id"]), (False, e["id"]))   # ayni istek: ayni teklif
        ok(king.iptal(con, e["id"], now=AN)["ok"])
        eq(king.emir(con, e["id"])["durum"], "iptal")
        no(king.teklif_onayla(con, cfg, e["id"], now=AN)["ok"])
    test("teklif iptal edilir; ayni istek ikinci teklif acmaz", t_iptal_ve_tekrar)

    def t_sohbet_cevabi():
        con, cfg = db.connect(":memory:"), _cfg()
        # Acik teklif yoksa «1» olagan sohbettir.
        eq(king.teklif_cevap(con, cfg, "1"), None)
        e = king.emir_ac(con, cfg, "hkm", "bam.arastirma", {"arastirma": {"konu": "Söğüt"}},
                         now=AN)["emir"]
        eq(king.teklif_cevap(con, cfg, "merhaba"), None)
        ok("o seçenek yok" in king.teklif_cevap(con, cfg, "2"))
        t = king.teklif_cevap(con, cfg, "1", now=AN)
        ok(t.startswith("Onaylandı:") and "#%d" % e["id"] in t, t)
        eq(king.emir(con, e["id"])["durum"], "onaylandi")
        e2 = king.emir_ac(con, cfg, "hkm", "bam.arastirma", {"arastirma": {"konu": "Bilecik"}},
                          now=AN)["emir"]
        ok("iptal edildi" in king.teklif_cevap(con, cfg, "iptal", now=AN))
        eq(king.emir(con, e2["id"])["durum"], "iptal")
        # Telegram: yalniz AYNI alicinin teklifi.
        e3 = king.emir_ac(con, cfg, "hkm", "bam.arastirma", {"arastirma": {"konu": "Domaniç"}},
                          now=AN, kanal="telegram", hedef="7")["emir"]
        eq(king.teklif_cevap(con, cfg, "1", kanal="telegram", hedef="8"), None)
        eq(king.teklif_cevap(con, cfg, "1"), None)          # yerel sohbet Telegram'inkini gormez
        ok(king.teklif_cevap(con, cfg, "1", kanal="telegram", hedef="7", now=AN))
        eq(king.emir(con, e3["id"])["durum"], "onaylandi")
    test("sohbette «1 · 2 · iptal»; baskasinin teklifi onaylanamaz", t_sohbet_cevabi)

    def t_ne_zaman_sorulur():
        con = db.connect(":memory:")
        # Kural isi (model yok) sorulmaz: bedava.
        eq(king.teklif_gerekli(_cfg(), "hedef.plan", {"sinif": "dusuk"}), False)
        # Dusuk: ayar kapaliyken sorar, acikken sormaz. Orta her zaman sorar.
        eq(king.teklif_gerekli(_cfg(), "test.kitabi", {"sinif": "dusuk"}), True)
        acik = dict(_cfg(), king={"sormadan_dusuk": True})
        eq(king.teklif_gerekli(acik, "test.kitabi", {"sinif": "dusuk"}), False)
        eq(king.teklif_gerekli(acik, "test.kitabi", {"sinif": "orta"}), True)
        e = _teklifli(con, cfg=acik, n=1)["emir"]
        eq(e["durum"], "onaylandi")
        eq(_teklifli(con, cfg=acik, n=2)["emir"]["durum"], "teklif")
        from core import settings
        ok(settings.validate({"king": {"sormadan_dusuk": True}})[0])
        no(settings.validate({"king": {"sormadan_orta": True}})[0])
        no(settings.validate({"king": {"sormadan_dusuk": "evet"}})[0])
    test("ne zaman sorulur: kural isi hic, dusuk ayara bagli, orta ve ustu hep",
         t_ne_zaman_sorulur)
