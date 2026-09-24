# -*- coding: utf-8 -*-
"""King onay zinciri ve Planlama Burosu v1 (core/king.py, core/planlama.py).

   Kanitladigi sozler:
     1. Is emri katalog disiysa, yetkisiz modulden geliyorsa ya da govdesi
        bozuksa acilmaz; zinciri SUNUCU kurar.
     2. Imkan kontrolu kuraldir: onay / kismi / ret ve her maddenin notu.
     3. Tahmini sure «tahmin»dir ve dayanagini soyler; is bitince gercek
        sure yazilir, sapma olculur.
     4. Bildirim durum DEGISIMIDIR: ayni durum iki kez yazilmaz.
     5. Planlama plan UYDURMAZ: yapilandirilmis hedef yoksa erteler; plan
        denetcisi kritik bir maddede gecirmezse teklif birakilmaz.
     6. Once depo: ayni girdi ikinci kez kurulmaz."""
import copy
import json

from core import bam, db, intents, king, planlama
from tests.harness import eq, no, ok, suite, test

AN = "2026-09-23T10:00:00"
SONRA = "2026-09-23T10:02:00"


def _plan(**ek):
    p = {"paket": "kilo", "yon": "azalt", "hedef_id": "hd1", "baslangic": "2026-09-23",
         "bitis": "2026-12-23", "hafta": 13, "tempo": 0.31,
         "simdi": {"deger": 84.0, "etiket": "olculdu"}, "hedef_deger": 80.0,
         "enerji": {"kcal": 2454, "taban": 1760, "etiket": "tahmin"},
         "protein": {"min": 151, "max": 185}, "kapasite": {"gunluk_dk": 30, "haftalik_gun": 4},
         "hekim_kapisi": False, "talimat": 1}
    p.update(ek)
    return p


def _ac(con, **ek):
    return king.emir_ac(con, {}, "spi", "hedef.plan", {"plan": _plan(**ek)},
                        konu="3 ayda 4 kilo ver", now=AN)


def _bitir(con):
    """Kayit ve Planlama adimlarini kostur, her adimdan sonra esitle."""
    bam.ilerlet(con, {}, now=AN)
    king.esitle(con, now=AN)
    bam.ilerlet(con, {}, now=SONRA)
    king.esitle(con, now=SONRA)


def run():
    suite("king")

    # ---- Planlama Burosu v1 -----------------------------------------------

    def t_girdi_temizlenir():
        g, h = planlama.temizle(_plan(ilac="metformin", tahlil={"hba1c": 7}))
        eq(h, [])
        no("ilac" in g or "tahlil" in g, "tanimsiz alan ambara girmemeli")
        for bozuk in (_plan(paket="gitar"), _plan(bitis="2026-09-01"),
                      _plan(hedef_deger=90.0), _plan(tempo=0), _plan(hafta=0),
                      _plan(talimat="Tuz sınırlı"), _plan(simdi={"deger": 84})):
            no(planlama.temizle(bozuk)[1] == [], "bozuk girdi gecmemeli: %r" % bozuk)
        no(planlama.temizle("plan")[1] == [])
    test("plan girdisi dogrulanir; talimat METNI ve tanimsiz alan girmez", t_girdi_temizlenir)

    def t_program():
        p = planlama.kur(_plan())
        ok(p["ok"] and p["gecti"])
        pr = p["program"]
        eq(pr["tarti_gunu"], "Çarşamba")               # 23 Eylul 2026 Carsamba
        eq(len(pr["haftalar"]), 13)
        h1 = pr["haftalar"][0]
        eq((h1["baslangic"], h1["bitis"], h1["beklenen"]), ("2026-09-24", "2026-09-30", 83.7))
        eq(pr["haftalar"][-1]["beklenen"], 80.0)       # hedefin altina inmez
        turler = [[g["tur"] for g in h["gorevler"]] for h in pr["haftalar"]]
        ok("degerlendirme" in turler[3] and "degerlendirme" in turler[7])
        ok("kapanis" in turler[12] and "degerlendirme" not in turler[12])
        ok(all("hareket" in t and "enerji" in t and "protein" in t for t in turler))
        eq([d["ilk_hafta"] for d in pr["donemler"]], [1, 5, 9, 13])
        eq([d["metin"] for d in pr["donemler"]][0::3],
           ["Dönem 1 · hafta 1–4 · beklenen 82,8 kg", "Dönem 4 · hafta 13 · beklenen 80 kg"])
        eq(h1["aralik"], "24 Eylül 2026 – 30 Eylül 2026")
        ok(all(s["etiket"] == "tahmin" for s in p["simulasyon"]))
        eq([s["hafta"] for s in p["simulasyon"]], [13, 18, 26])
    test("program donem > hafta > gorev; simulasyon uc tempo, hepsi tahmin", t_program)

    def t_denetci():
        hizli = planlama.kur(_plan(tempo=1.5, hafta=3, bitis="2026-10-14"))
        no(hizli["gecti"])
        ok(any(d["ad"] == "tempo" and not d["ok"] and d["kritik"] for d in hizli["denetim"]))
        taban = planlama.kur(_plan(enerji={"kcal": 1500, "taban": 1760, "etiket": "tahmin"}))
        no(taban["gecti"])
        hekim = planlama.kur(_plan(hekim_kapisi=True))
        no(hekim["gecti"], "hekim kapisinda enerji yazilmamali")
        temiz = planlama.kur(_plan(hekim_kapisi=True, enerji=None))
        ok(temiz["gecti"])
        ok(all(g["tur"] != "enerji" for h in temiz["program"]["haftalar"] for g in h["gorevler"]))
        zor = planlama.kur(_plan(tempo=1.0, hafta=4, bitis="2026-10-21"))
        ok(zor["gecti"], "zorlayici tempo uyaridir, kritik degil")
        ok(any(d["ad"] == "tempo" and not d["ok"] for d in zor["denetim"]))
    test("plan denetcisi: guvenlik siniri, bazal taban, hekim kapisi", t_denetci)

    def t_serbest_cumle_ertelenir():
        con = db.connect(":memory:")
        i = bam.is_ac(con, "Gitar için altı aylık program çıkar", hedef_modul="esp", now=AN)
        bam.ilerlet(con, {}, now=AN)
        r = bam.ilerlet(con, {}, now=AN)
        eq((r["ofis"], r["durum"]), ("planlama", "ertelendi"))
        eq(bam.is_getir(con, i["id"])["durum"], "kismen")
    test("serbest cumleden plan uydurulmaz", t_serbest_cumle_ertelenir)

    # ---- King: is emri ------------------------------------------------------

    def t_emir_reddi():
        con = db.connect(":memory:")
        no(king.emir_ac(con, {}, "spi", "uzaktan.komut", {}, now=AN)["ok"])
        no(king.emir_ac(con, {}, "ays", "hedef.plan", {"plan": _plan()}, now=AN)["ok"])
        no(king.emir_ac(con, {}, "king", "hedef.plan", {"plan": _plan()}, now=AN)["ok"])
        r = king.emir_ac(con, {}, "spi", "hedef.plan", {"plan": _plan(tempo="hizli")}, now=AN)
        no(r["ok"])
        ok(any("tempo" in x and "aralığında" in x for x in r["errors"]))
        eq(con.execute("SELECT COUNT(*) FROM is_emirleri").fetchone()[0], 0)
    test("katalog disi, yetkisiz ya da bozuk emir acilmaz", t_emir_reddi)

    def t_onay_ve_zincir():
        con = db.connect(":memory:")
        r = king.emir_ac(con, {}, "spi", "hedef.plan",
                         {"plan": _plan(), "iz": [{"kat": "king", "ad": "sahte onay"}]},
                         konu="3 ayda 4 kilo ver", now=AN)
        ok(r["ok"] and r["yeni"])
        e = r["emir"]
        eq((r["karar"], e["durum"]), ("onay", "onaylandi"))
        eq([z["kat"] for z in e["iz"]],
           ["koc", "patron", "alt_patron", "king", "bam", "ofis", "ofis"])
        eq(e["iz"][2]["id"], "bio")
        no(any(z.get("ad") == "sahte onay" for z in e["iz"]))
        no("iz" in e["govde"], "istemcinin zinciri saklanmaz")
        eq(e["tahmin"]["etiket"], "tahmin")
        ok("2 adım × 60" in e["tahmin"]["dayanak"])
        j = bam.is_getir(con, e["bam_is_id"])
        eq((j["ofisler"], j["emir_id"], j["hedef_modul"]), (["kayit", "planlama"], e["id"], "spi"))
        eq(j["govde"]["plan"]["hedef_id"], "hd1")
        b = king.bildirimler(con, "spi")["bildirimler"]
        eq([x["tur"] for x in b], ["onaylandi"])
        ok("tahmin" in b[0]["metin"] and "onayladı" in b[0]["metin"])
        eq(bam.iz_zinciri(con, "is", j["id"]), [{"tur": "emir", "id": str(e["id"])}])
    test("King onaylar, zinciri sunucu kurar, tahmin dayanagini soyler", t_onay_ve_zincir)

    def t_bitis_ve_teklif():
        con = db.connect(":memory:")
        e = _ac(con)["emir"]
        bam.ilerlet(con, {}, now=AN)
        eq(king.esitle(con, now=AN), 1)
        eq(king.emir(con, e["id"])["durum"], "basladi")
        eq(king.esitle(con, now=AN), 0, "ayni durum iki kez bildirilmez")
        bam.ilerlet(con, {}, now=SONRA)
        king.esitle(con, now=SONRA)
        son = king.emir(con, e["id"])
        eq(son["durum"], "bitti")
        eq(son["sonuc"]["gercek_sn"], 120)
        k = bam.kayit_getir(con, son["sonuc"]["kayit_id"])
        eq((k["tur"], k["dogruluk"], k["govde"]["gecti"]), ("plan", "dogrulanmadi", True))
        eq(len(k["govde"]["program"]["haftalar"]), 13)
        n = db.intents_for(con, "spi", ("pending",))
        eq(len(n), 1)
        eq((n[0]["kind"], n[0]["payload"]["kayit_id"], n[0]["payload"]["hedef_id"],
            n[0]["payload"]["hafta"]), ("plan.apply", k["id"], "hd1", 13))
        ok("13 haftalık" in n[0]["note"])
        turler = [x["tur"] for x in reversed(king.bildirimler(con, "spi")["bildirimler"])]
        eq(turler, ["onaylandi", "basladi", "bitti"])
        eq(king.esitle(con, now=SONRA), 0)
        eq(len(db.intents_for(con, "spi", ("pending",))), 1, "teklif tektir")
        s = king.sure_sapmasi(con)
        eq((s["n"], s["ortalama_sapma_sn"]), (1, 0))
    test("is biter, program kaydedilir, teklif King'den doner", t_bitis_ve_teklif)

    def t_guvensiz_plan_kapida_reddedilir():
        con = db.connect(":memory:")
        r = _ac(con, tempo=1.5, hafta=3, bitis="2026-10-14")
        eq((r["karar"], r["emir"]["durum"], r["emir"]["bam_is_id"]), ("ret", "reddedildi", None))
        ok(any(m["ad"] == "guvenlik" and not m["ok"] and "%1,5" in m["not"]
               for m in r["emir"]["kontrol"]))
        ok("%1,5" in king.bildirimler(con, "spi")["bildirimler"][0]["metin"])
        r2 = _ac(con, enerji={"kcal": 1500, "taban": 1760, "etiket": "tahmin"})
        eq(r2["karar"], "ret", "bazal metabolizmanin altindaki plan da kapida doner")
        eq(con.execute("SELECT COUNT(*) FROM bam_isler").fetchone()[0], 0)
        ok(any(m["ad"] == "guvenlik" and m["ok"] for m in _ac(con)["emir"]["kontrol"]))
    test("guvensiz plan King'in kapisinda reddedilir, BAM'a gitmez",
         t_guvensiz_plan_kapida_reddedilir)

    def t_denetci_gecirmezse_teklif_yok():
        """King'in kapisindan gecen ama Planlama'da kritik bir maddeye
        takilan is (ornek: kapidan sonra degisen girdi) teklif birakmaz."""
        con = db.connect(":memory:")
        e = _ac(con)["emir"]
        con.execute("UPDATE bam_isler SET govde=? WHERE id=?", (json.dumps(
            {"plan": _plan(enerji={"kcal": 1500, "taban": 1760, "etiket": "tahmin"})}),
            e["bam_is_id"]))
        _bitir(con)
        son = king.emir(con, e["id"])
        eq(son["durum"], "bitti")
        eq(db.intents_for(con, "spi", ("pending",)), [])
        ok("geçirmedi" in king.bildirimler(con, "spi")["bildirimler"][0]["metin"])
    test("plan denetcisi gecirmezse teklif birakilmaz ve soylenir",
         t_denetci_gecirmezse_teklif_yok)

    def t_tekrar_ve_depo():
        con = db.connect(":memory:")
        a = _ac(con)
        b = _ac(con)
        eq((b["emir"]["id"], b["yeni"]), (a["emir"]["id"], False))
        _bitir(con)
        isler = con.execute("SELECT COUNT(*) FROM bam_isler").fetchone()[0]
        c = _ac(con)
        ok(c["yeni"])
        eq(c["emir"]["durum"], "bitti")
        eq(c["emir"]["sonuc"]["depodan"], a["emir"]["id"])
        eq(con.execute("SELECT COUNT(*) FROM bam_isler").fetchone()[0], isler,
           "depodaki is yeniden kurulmaz")
        ok(any(m["ad"] == "depo" and "yeniden kurulmaz" in m["not"]
               for m in c["emir"]["kontrol"]))
        eq(len(db.intents_for(con, "spi", ("pending",))), 1, "ayni teklif ikinci kez yazilmaz")
        d = _ac(con, hedef_deger=79.0, bitis="2026-12-30", hafta=14)
        eq(d["emir"]["durum"], "onaylandi", "girdi degisince yeniden kurulur")
    test("acik emir tekrar acilmaz; bitmis is depodan doner", t_tekrar_ve_depo)

    def t_plan_surumleri():
        con = db.connect(":memory:")
        _ac(con)
        _bitir(con)
        _ac(con, tempo=0.3, hedef_deger=80.1)
        _bitir(con)
        rows = con.execute("SELECT id, surum, onceki_id FROM bam_kayitlar WHERE tur='plan' "
                           "ORDER BY id").fetchall()
        eq([(r["surum"], r["onceki_id"]) for r in rows], [(1, None), (2, rows[0]["id"])])
    test("ayni hedefin yeni programi onceki kaydin yeni surumudur", t_plan_surumleri)

    def t_ofis_kapaliysa_ret():
        con = db.connect(":memory:")
        eski = copy.deepcopy(bam.OFISLER["planlama"])
        bam.OFISLER["planlama"]["durum"] = "ertelendi"
        try:
            r = _ac(con)
        finally:
            bam.OFISLER["planlama"] = eski
        eq((r["karar"], r["emir"]["durum"]), ("ret", "reddedildi"))
        eq(r["emir"]["bam_is_id"], None)
        eq(con.execute("SELECT COUNT(*) FROM bam_isler").fetchone()[0], 0)
        b = king.bildirimler(con, "spi")["bildirimler"][0]
        eq(b["tur"], "reddedildi")
        ok("Planlama Bürosu henüz açılmadı" in b["metin"])
    test("isi yapacak ofis kapaliysa King reddeder ve nedenini yazar", t_ofis_kapaliysa_ret)

    def t_kuyruk_dolu():
        con = db.connect(":memory:")
        eski = king.KUYRUK_EN_COK
        king.KUYRUK_EN_COK = 1
        try:
            ok(_ac(con)["karar"] == "onay")
            r = _ac(con, hedef_deger=79.0)
        finally:
            king.KUYRUK_EN_COK = eski
        eq(r["karar"], "ret")
        ok(any(m["ad"] == "kuyruk" and not m["ok"] for m in r["emir"]["kontrol"]))
    test("King'in kuyrugu doluysa yeni is reddedilir", t_kuyruk_dolu)

    def t_model_gereken_tur_kismi():
        con = db.connect(":memory:")
        king.TURLER["deneme.arastirma"] = {"ad": "Deneme", "moduller": ("spi",),
                                           "ofisler": ["kayit", "arastirma"], "model": True,
                                           "not": ""}
        try:
            karar, maddeler = king.imkan(con, {}, "deneme.arastirma")
        finally:
            del king.TURLER["deneme.arastirma"]
        eq(karar, "kismi")
        ok(any(m["ad"] == "model:arastirma" and not m["ok"] for m in maddeler))
        ok(any(m["ad"] == "butce" for m in maddeler), "model isteyen turde butce sorulur")
    test("model yoksa karar kismidir, ret degil; butce de sorulur", t_model_gereken_tur_kismi)

    def t_tahmin_gecmisten():
        con = db.connect(":memory:")
        for dk in (1, 3, 5, 40):
            con.execute("INSERT INTO bam_isler(talep,kaynak,ofisler,adimlar,durum,created_at,"
                        "updated_at) VALUES ('x','spi',?, '[]','tamam',?,?)",
                        ('["kayit", "planlama"]', "2026-09-01T10:00:00",
                         "2026-09-01T10:%02d:00" % dk))
        t = king.tahmini_sure(con, ["kayit", "planlama"])
        eq((t["sn"], t["etiket"]), (240, "tahmin"))
        ok("ortancası" in t["dayanak"])
    test("tahmini sure gecmis islerin ortancasidir ve tahmin etiketlidir", t_tahmin_gecmisten)

    def t_bildirim_okundu():
        con = db.connect(":memory:")
        _ac(con)
        b = king.bildirimler(con, "spi")
        eq(b["okunmamis"], 1)
        ok(king.okundu(con, b["bildirimler"][0]["id"], now=AN)["ok"])
        eq(king.bildirimler(con, "spi")["bildirimler"], [])
        eq(len(king.bildirimler(con, "spi", hepsi=True)["bildirimler"]), 1, "okundu silmez")
        ok(king.okundu(con, b["bildirimler"][0]["id"], now=AN)["ok"])
        no(king.okundu(con, 999)["ok"])
        eq(king.bildirimler(con, "ays")["okunmamis"], 0)
    test("okundu isareti bildirimi silmez; modul yalniz kendi bildirimini gorur",
         t_bildirim_okundu)

    def t_iptal():
        con = db.connect(":memory:")
        e = _ac(con)["emir"]
        ok(king.iptal(con, e["id"], now=AN)["ok"])
        eq(bam.is_getir(con, e["bam_is_id"])["durum"], "iptal")
        eq(king.emir(con, e["id"])["durum"], "iptal")
        no(king.iptal(con, e["id"], now=AN)["ok"])
        eq(king.esitle(con, now=AN), 0)
        eq(king.bildirimler(con, "spi")["bildirimler"][0]["tur"], "iptal")
    test("iptal edilen emrin isi de durur", t_iptal)

    def t_niyet_sozlesmesi():
        ok(intents.validate("spi", "plan.apply", {"kayit_id": 3, "hedef_id": "hd1",
                                                  "hafta": 13})[0])
        no(intents.validate("ays", "plan.apply", {"kayit_id": 3, "hedef_id": "hd1"})[0])
        no(intents.validate("spi", "plan.apply", {"kayit_id": 3})[0])
        no(intents.validate("spi", "plan.apply", {"kayit_id": 3, "hedef_id": "x",
                                                  "hafta": 500})[0])
    test("plan.apply yalniz SPI'ye ve sozlesmeyle birakilir", t_niyet_sozlesmesi)

    def t_yedek():
        con = db.connect(":memory:")
        _ac(con)
        y = db.export_all(con)
        eq((y["__meta"]["tables"]["is_emirleri"], y["__meta"]["tables"]["bildirimler"]), (1, 1))
    test("is emirleri ve bildirimler yedege girer", t_yedek)

    def t_hata_turkce():
        # HATA (2026-09-24): reddedilen istegin cumlesi ekrana ve sohbete
        # gidiyor (AYS sinav profili, Telegram arastirma) ama ASCII'ydi
        # («konu 3-200 karakter olmali»). AGENTS §1.8: ekrandaki cumle
        # duzgun Turkcedir.
        con = db.connect(":memory:")
        denemeler = [
            ("hkm", "bam.arastirma", {"arastirma": {"konu": "ab"}}),
            ("hkm", "bam.plan", {"program": {"konu": "a", "hafta": 99}}),
            ("ays", "yok.tur", {}),
            ("esp", "sinav.mufredat", {"mufredat": {"sinav": "KPSS"}}),
            ("ays", "sinav.mufredat", {"mufredat": {"sinav": "KPSS", "fazla": 1}}),
        ]
        for modul, tur, govde in denemeler:
            r = king.emir_ac(con, {}, modul, tur, govde, now=AN)
            no(r["ok"])
            metin = " ".join(r["errors"])
            ok(any(h in metin for h in "ıİşŞğĞüÜöÖçÇ"), "%s: %s" % (tur, metin))
    test("reddedilen istegin cumlesi duzgun Turkce", t_hata_turkce)
