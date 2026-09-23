# -*- coding: utf-8 -*-
"""BAM — Bilgi ve Aksiyon Modulu (HKM'nin alt modulu).

   Kanitladigi sozler:
     1. BAM Patronu talebi KURALLA yonlendirir; anlamadigini sorar.
     2. Her is once Kayit Ofisi'nden gecer: «bu daha once yapildi mi?»
     3. Hazir olmayan ofis «yaptim» demez: adimi «ertelendi» diye kapatir.
     4. Model yoksa is BEKLER, uydurulmaz; kaynaksiz arastirma hep
        «dogrulanmadi»dir.
     5. Kayit surumludur; iz zinciri «bu neden var» sorusunu cevaplar."""
import json

from core import bam, db, models
from tests.harness import eq, no, ok, suite, test

AN = "2026-09-23T10:00:00"


def _arastirma_tasiyici(metin):
    def cagir(provider, anahtar, model, sistem, gecmis):
        return metin, 100, 200
    return cagir


def _cfg():
    """Model King'e atanir; BAM rolleri King'den miras alir."""
    cfg = {"local_token": "x",
           "budget": {"monthly_try": 850.0, "usd_try": 48.6,
                      "rate_date": "2026-09-23", "ceiling_currency": "try"}}
    return models.apply(cfg, {"keys": {"google": "AIza-test"},
                              "assignments": {"king": {"provider": "google",
                                                       "model": "gemini-2.5-flash"}}})


def run():
    suite("bam")

    def t_route():
        eq(bam.yonlendir("TYT matematikten 20 soruluk test hazırla")["ofisler"],
           ["kayit", "uretim"])
        eq(bam.yonlendir("Ferritin düşüklüğü neden olur, araştır")["ofisler"],
           ["kayit", "arastirma"])
        r = bam.yonlendir("şunu bir hallet")
        no(r["ok"])
        ok("araştır" in r["soru"] and "üret" in r["soru"])
    test("BAM Patronu kuralla yonlendirir, anlamazsa sorar", t_route)

    def t_open_job_dedupes():
        con = db.connect(":memory:")
        a = bam.is_ac(con, "Ferritin neden düşer, araştır", hedef_modul="spi", now=AN)
        ok(a["ok"] and a["yeni"])
        b = bam.is_ac(con, "Ferritin neden düşer, araştır", hedef_modul="spi", now=AN)
        eq((b["id"], b["yeni"]), (a["id"], False))
        no(bam.is_ac(con, "", now=AN)["ok"])
        no(bam.is_ac(con, "araştır x", hedef_modul="king", now=AN)["ok"])
        no(bam.is_ac(con, "şunu bir hallet", now=AN)["ok"])
    test("ayni acik is iki kez acilmaz; bozuk talep reddedilir", t_open_job_dedupes)

    def t_record_office_first():
        con = db.connect(":memory:")
        k = bam.kayit_ekle(con, "arastirma", "Ferritin ve demir emilimi",
                           {"ozet": "x"}, etiketler="ferritin demir", now=AN)
        ok(k["ok"])
        i = bam.is_ac(con, "Ferritin neden düşer, araştır", now=AN)
        r = bam.ilerlet(con, {}, now=AN)
        eq(r["ofis"], "kayit")
        adim = bam.is_getir(con, i["id"])["adimlar"][0]
        eq(adim["durum"], "tamam")
        eq(adim["bulunan"], [k["id"]])
    test("her is once Kayit Ofisi'nden gecer", t_record_office_first)

    def t_no_model_waits():
        con = db.connect(":memory:")
        i = bam.is_ac(con, "Ferritin neden düşer, araştır", now=AN)
        bam.ilerlet(con, {}, now=AN)                 # kayit
        r = bam.ilerlet(con, {}, now=AN)             # arastirma: model yok
        eq(r["ofis"], "arastirma")
        j = bam.is_getir(con, i["id"])
        eq(j["durum"], "beklemede")
        eq(j["adimlar"][1]["durum"], "beklemede")
        eq(bam.ilerlet(con, {}, now=AN), None)       # beklemedeki is donmez
        eq(con.execute("SELECT COUNT(*) FROM bam_kayitlar").fetchone()[0], 0)
        ok(bam.devam(con, i["id"], now=AN)["ok"])
        eq(bam.is_getir(con, i["id"])["durum"], "bekliyor")
    test("model yoksa is bekler, hicbir sey uydurulmaz", t_no_model_waits)

    def t_research_is_unverified():
        con = db.connect(":memory:")
        belge = json.dumps({"baslik": "Ferritin düşüklüğü", "ozet": "Demir depoları.",
                            "bulgular": [{"iddia": "Ferritin 30 ng/mL altı düşük sayılabilir.",
                                          "guven": "orta"}],
                            "acik_kalanlar": ["Kişisel değer yok."]}, ensure_ascii=False)
        i = bam.is_ac(con, "Ferritin neden düşer, araştır", hedef_modul="spi", now=AN)
        bam.ilerlet(con, _cfg(), now=AN)
        r = bam.ilerlet(con, _cfg(), transport=_arastirma_tasiyici(belge), now=AN)
        ok(r["ok"])
        j = bam.is_getir(con, i["id"])
        eq(j["durum"], "tamam")
        kid = j["adimlar"][1]["kayit_id"]
        k = bam.kayit_getir(con, kid)
        eq(k["dogruluk"], "dogrulanmadi")
        eq(k["govde"]["bulgular"][0]["dayanak"], "model bilgisi — kaynak yok")
        ok("30 ng/mL" in k["govde"]["bulgular"][0]["iddia"])
        eq(bam.iz_zinciri(con, "kayit", kid)[0], {"tur": "is", "id": str(i["id"])})
    test("arastirma kaydedilir, kaynaksiz oldugu icin dogrulanmadi", t_research_is_unverified)

    def t_unready_offices_postpone():
        con = db.connect(":memory:")
        i = bam.is_ac(con, "TYT matematikten test hazırla", hedef_modul="ays", now=AN)
        bam.ilerlet(con, {}, now=AN)
        r = bam.ilerlet(con, {}, now=AN)
        eq(r["ofis"], "uretim")
        j = bam.is_getir(con, i["id"])
        eq(j["adimlar"][1]["durum"], "ertelendi")
        eq(j["durum"], "kismen")
    test("hazir olmayan ofis «yaptim» demez, erteler", t_unready_offices_postpone)

    def t_versions_and_search():
        con = db.connect(":memory:")
        a = bam.kayit_ekle(con, "arastirma", "Demir emilimi", {"ozet": "v1"},
                           etiketler="demir", now=AN)
        b = bam.kayit_ekle(con, "arastirma", "Demir emilimi", {"ozet": "v2"},
                           etiketler="demir", onceki_id=a["id"], now=AN)
        eq(bam.kayit_getir(con, b["id"])["surum"], 2)
        eq([x["id"] for x in bam.kayit_ara(con, "demir emilimi nasıl")], [b["id"], a["id"]])
        eq(bam.kayit_ara(con, "gitar"), [])
        no(bam.kayit_ekle(con, "uydurma", "x", {}, now=AN)["ok"])
    test("kayit surumludur ve aranabilir", t_versions_and_search)

    def t_cancel():
        con = db.connect(":memory:")
        i = bam.is_ac(con, "Demir araştır", now=AN)
        ok(bam.iptal(con, i["id"], now=AN)["ok"])
        eq(bam.ilerlet(con, {}, now=AN), None)
        no(bam.iptal(con, i["id"], now=AN)["ok"])
    test("iptal edilen is ilerlemez", t_cancel)
