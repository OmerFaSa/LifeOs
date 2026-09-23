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
        i = bam.is_ac(con, "Gitar için altı aylık program çıkar", hedef_modul="esp", now=AN)
        bam.ilerlet(con, {}, now=AN)
        r = bam.ilerlet(con, {}, now=AN)
        eq(r["ofis"], "planlama")
        j = bam.is_getir(con, i["id"])
        eq(j["adimlar"][1]["durum"], "ertelendi")
        eq(j["durum"], "kismen")
    test("Planlama serbest cumleden plan kurmaz, «yaptim» demez, erteler",
         t_unready_offices_postpone)

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

    # ---- Uretim Ofisi ------------------------------------------------
    #
    # Uretilen her coktan secmeli soru, cevap anahtari GOSTERILMEDEN ikinci
    # bir cagriyla bastan cozulur; cozum anahtarla tutmazsa soru DUSER.
    # Bicimi bozuk madde modele hic gitmeden duser. Hedef AYS ise gecen
    # maddeler niyet kuyruguna teklif olarak birakilir — BAM yazmaz.

    def _uretim_tasiyici(uretim, kalite):
        cagrilar = []

        def cagir(provider, anahtar, model, sistem, gecmis):
            cagrilar.append(sistem + "\n" + json.dumps(gecmis, ensure_ascii=False))
            icerik = kalite if "Kalite Kontrol" in sistem else uretim
            return json.dumps(icerik, ensure_ascii=False), 100, 200
        cagir.cagrilar = cagrilar
        return cagir

    def _soru(metin, dogru, secenek=None):
        return {"soru": metin, "secenekler": secenek or ["1", "2", "3", "4", "5"],
                "dogru": dogru, "cozum": "Adım adım çözüm."}

    def t_production_qc():
        con = db.connect(":memory:")
        uretim = {"baslik": "Üslü sayılar", "konu": "TYT Matematik · Üslü sayılar",
                  "sorular": [_soru("2^3 kaçtır?", "B", ["6", "8", "9", "12", "16"]),
                              _soru("3^2 kaçtır?", "C", ["6", "8", "9", "12", "16"]),
                              _soru("2^4 kaçtır?", "E", ["6", "8", "9", "12", "16"])]}
        kalite = {"cevaplar": [{"no": 1, "secim": "B", "emin": True},
                               {"no": 2, "secim": "D", "emin": True},
                               {"no": 3, "secim": "E", "emin": True}]}
        t = _uretim_tasiyici(uretim, kalite)
        i = bam.is_ac(con, "TYT matematikten 3 soruluk test hazırla", hedef_modul="ays", now=AN)
        bam.ilerlet(con, _cfg(), now=AN)
        r = bam.ilerlet(con, _cfg(), transport=t, now=AN)
        ok(r["ok"])
        eq(len(t.cagrilar), 2)
        j = bam.is_getir(con, i["id"])
        eq(j["durum"], "tamam")
        k = bam.kayit_getir(con, j["adimlar"][1]["kayit_id"])
        eq((k["tur"], k["dogruluk"]), ("materyal", "dogrulanmadi"))
        g = k["govde"]
        eq(g["tur"], "soru")
        eq([m["soru"] for m in g["maddeler"]], ["2^3 kaçtır?", "2^4 kaçtır?"])
        eq((g["kalite"]["uretilen"], g["kalite"]["gecen"]), (3, 2))
        eq(g["kalite"]["dusen"][0]["no"], 2)
        n = con.execute("SELECT * FROM intents WHERE module='ays'").fetchall()
        eq(len(n), 1)
        eq(n[0]["kind"], "material.add")
        p = json.loads(n[0]["payload"])
        eq((p["kayit_id"], p["adet"]), (k["id"], 2))
        ok({"tur": "kayit", "id": str(k["id"])} in bam.iz_zinciri(con, "niyet", n[0]["id"]))
    test("uretilen soru bagimsiz cozumle denetlenir, tutmayan duser", t_production_qc)

    def t_answer_key_hidden_from_qc():
        con = db.connect(":memory:")
        uretim = {"baslik": "x", "sorular": [_soru("Gizli soru?", "D")]}
        kalite = {"cevaplar": [{"no": 1, "secim": "D", "emin": True}]}
        t = _uretim_tasiyici(uretim, kalite)
        bam.is_ac(con, "3 soru hazırla", now=AN)
        bam.ilerlet(con, _cfg(), now=AN)
        bam.ilerlet(con, _cfg(), transport=t, now=AN)
        kalite_istemi = t.cagrilar[1]
        no("Adım adım çözüm" in kalite_istemi)
        no("dogru" in kalite_istemi or "cozum" in kalite_istemi)
    test("kalite kontrolu cevap anahtarini ve cozumu gormez", t_answer_key_hidden_from_qc)

    def t_bad_format_dropped_before_qc():
        con = db.connect(":memory:")
        uretim = {"baslik": "x", "sorular": [
            _soru("Dört şık", "A", ["1", "2", "3", "4"]),
            _soru("Anahtar yok", "F"),
            _soru("Aynı şık", "A", ["1", "1", "2", "3", "4"]),
            _soru("Sağlam", "A")]}
        kalite = {"cevaplar": [{"no": 1, "secim": "A", "emin": True}]}
        t = _uretim_tasiyici(uretim, kalite)
        i = bam.is_ac(con, "5 soru hazırla", now=AN)
        bam.ilerlet(con, _cfg(), now=AN)
        bam.ilerlet(con, _cfg(), transport=t, now=AN)
        j = bam.is_getir(con, i["id"])
        g = bam.kayit_getir(con, j["adimlar"][1]["kayit_id"])["govde"]
        eq([m["soru"] for m in g["maddeler"]], ["Sağlam"])
        eq(g["kalite"]["bicim_dusen"], 3)
        eq(con.execute("SELECT COUNT(*) FROM intents").fetchone()[0], 0)   # hedef yok
    test("bicimi bozuk madde denetime gitmeden duser", t_bad_format_dropped_before_qc)

    def t_exercise_judged():
        con = db.connect(":memory:")
        uretim = {"baslik": "Present perfect", "maddeler": [
            {"yonerge": "Boşluğu doldur.", "madde": "I ___ (see) it.", "cevap": "have seen"},
            {"yonerge": "Boşluğu doldur.", "madde": "She ___ (go) home.", "cevap": "goed"}]}
        kalite = {"yargilar": [{"no": 1, "dogru_mu": True}, {"no": 2, "dogru_mu": False,
                                                              "neden": "Düzensiz fiil."}]}
        t = _uretim_tasiyici(uretim, kalite)
        i = bam.is_ac(con, "İngilizce 5 alıştırma hazırla", hedef_modul="ays", now=AN)
        bam.ilerlet(con, _cfg(), now=AN)
        bam.ilerlet(con, _cfg(), transport=t, now=AN)
        j = bam.is_getir(con, i["id"])
        g = bam.kayit_getir(con, j["adimlar"][1]["kayit_id"])["govde"]
        eq(g["tur"], "alistirma")
        eq([m["cevap"] for m in g["maddeler"]], ["have seen"])
        eq(g["kalite"]["dusen"][0]["neden"], "Düzensiz fiil.")
    test("alistirma yargiyla denetlenir, yanlis cevapli madde duser", t_exercise_judged)

    def t_production_rules():
        eq(bam.uretim_istegi("TYT matematikten 20 soruluk test hazırla"), ("soru", 20))
        eq(bam.uretim_istegi("İngilizce 15 alıştırmalık çalışma kitabı hazırla"),
           ("alistirma", 15))
        eq(bam.uretim_istegi("biyoloji flashcard üret"), ("kart", 10))
        eq(bam.uretim_istegi("200 soru hazırla"), ("soru", 30))
        eq(bam.uretim_istegi("1 soru hazırla"), ("soru", 3))
    test("uretim turu ve adedi kuralla cikar, sinirlanir", t_production_rules)
