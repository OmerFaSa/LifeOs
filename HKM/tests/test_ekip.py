# -*- coding: utf-8 -*-
"""King'in ekibi (core/ekip.py), arka plan isleri (core/is_kuyrugu.py) ve
cok adimli gorev (core/gorev.py). Testler aga cikmaz: sahte model, web kapali.

   Kanitladigi sozler:
     1. Is kuyrugu kalicidir: durum kapali kume, iptal sozdur, yarida kalan is
        bir kez yeniden siraya girer; ekran satiri «King şu an N iş yapıyor».
     2. Devri kod yapar; kural karar veremezse model yalniz kapali listeden secer.
     3. Model yoksa ajan susmaz: rapor kural motorunun satirlaridir.
     4. «Bu hafta B1'e hazırla beni»: iskelet koddur, taslak onaysiz baslamaz,
        gunluk dakika uydurulmaz, yazma yalniz niyet kuyruguna teklif olur.
     5. HTTP uclari: ekip, isler, is, gorevler, gorev."""
from core import db, ekip, gorev, intents, is_kuyrugu, models
from tests.harness import eq, no, ok, suite, test

BUGUN = "2026-10-21"          # carsamba
SIMDI = BUGUN + "T10:00:00"


def _cfg():
    cfg = {"local_token": "x", "web": {"acik": False},
           "budget": {"monthly_try": 850.0, "usd_try": 48.6, "rate_date": BUGUN, "ceiling_currency": "try"}}
    return models.apply(cfg, {"keys": {"google": "AIza-test"}, "assignments": {
        "king": {"provider": "google", "model": "gemini-2.5-flash"}}})


def _model(secim="zihin", basliklar=("Kelime listesi", "Dinleme pratiği", "Okuma metni")):
    def t(provider, anahtar, model, sistem, mesajlar, ayar=None):
        t.sistemler.append(sistem)
        if sistem.startswith("Kullanıcının isteğini hangi ajan"):
            return secim, 50, 2, False, {}
        if "başlıklar yazarsın" in sistem:
            return "\n".join("- %s" % b for b in basliklar), 80, 20, False, {}
        return "Durum iyi görünüyor, düzenli çalışmaya devam.", 200, 20, False, {}
    t.sistemler = []
    return t


def _hepsini_isle(con, cfg, tr):
    n = 0
    while is_kuyrugu.isle(con, cfg, lambda c, f, i, il, ip: gorev.calistir_is(c, f, i, il, ip, transport=tr,
                                                                               now=SIMDI), now=SIMDI):
        n += 1
    return n


def run():
    suite("ekip")

    def t_kuyruk():
        con = db.connect(":memory:")
        eq(is_kuyrugu.ozet(con)["metin"], "King şu an boşta")
        a = is_kuyrugu.baslat(con, "zihin", "devir", "B1 kelimeleri", {"istek": "x"}, now=SIMDI)
        b = is_kuyrugu.baslat(con, "akademik", "devir", "netler", now=SIMDI)
        eq(a["durum"], "bekliyor")
        eq(is_kuyrugu.ozet(con)["metin"], "King şu an 2 iş yapıyor")
        al = is_kuyrugu.al(con)
        eq(al["id"], a["id"], "en eski once")
        eq(is_kuyrugu.ozet(con)["metin"], "King şu an 2 iş yapıyor (1 çalışıyor, 1 sırada)")
        ok(is_kuyrugu.iptal(con, b["id"])["ok"])
        eq(is_kuyrugu.getir(con, b["id"])["durum"], "iptal", "bekleyen hemen iptal")
        is_kuyrugu.iptal(con, a["id"])
        eq(is_kuyrugu.bitir(con, a["id"], {"ozet": "x"})["durum"], "iptal", "calisan iptalde sonuc yazilmaz")
        no(is_kuyrugu.iptal(con, a["id"])["ok"], "kapanan is iptal edilmez")
        try:
            is_kuyrugu.baslat(con, "zihin", "serbest", "x")
            ok(False, "bilinmeyen tur reddedilmeli")
        except ValueError:
            pass
    test("kuyruk: durumlar, sira, iptal, ekran satiri", t_kuyruk)

    def t_kurtar():
        con = db.connect(":memory:")
        i = is_kuyrugu.baslat(con, "beden", "devir", "uyku", now=SIMDI)
        is_kuyrugu.al(con)
        eq(is_kuyrugu.kurtar(con), (1, 0))
        eq(is_kuyrugu.getir(con, i["id"])["durum"], "bekliyor", "yarida kalan siraya doner")
        is_kuyrugu.al(con)
        eq(is_kuyrugu.kurtar(con), (0, 1))
        eq(is_kuyrugu.getir(con, i["id"])["durum"], "hata", "ikinci kez yarida kalan hata olur")
        j = is_kuyrugu.baslat(con, "beden", "devir", "x")

        def patlar(*a):
            raise RuntimeError("bozuk")
        eq(is_kuyrugu.isle(con, {}, patlar)["durum"], "hata")
        ok("bozuk" in is_kuyrugu.getir(con, j["id"])["hata"])
    test("kuyruk: HKM kapaninca is kaybolmaz, sonsuz dongu yok", t_kurtar)

    def t_sec():
        eq(ekip.sec("B1 sınavına hazırlık, ingilizce kelime"), "zihin")
        eq(ekip.sec("bu haftaki TYT netlerim nasıl"), "akademik")
        eq(ekip.sec("dün az uyudum, toparlanma nasıl"), "beden")
        eq(ekip.sec("squat formunu internette araştır"), "arastirmaci")
        eq(ekip.sec("squat formunu internette araştır", arastirma=False), None)
        eq(ekip.sec("bugün ne yapsam"), None, "belirsiz: kod karar vermez")
        con, cfg = db.connect(":memory:"), _cfg()
        eq(ekip.sec_modelle(con, cfg, "bugün ne yapsam", transport=_model("zihin")), ("zihin", "model"))
        eq(ekip.sec_modelle(con, cfg, "bugün ne yapsam", transport=_model("muhasebe"))[0], None,
           "listede olmayan ad yok sayilir")
        eq(ekip.sec_modelle(con, {"web": {"acik": False}}, "bugün ne yapsam")[0], None, "model yoksa secim yok")
    test("devir: once kod kurali, sonra model yalniz secer", t_sec)

    def t_rapor():
        con, cfg = db.connect(":memory:"), _cfg()
        tr = _model()
        r = ekip.calistir(con, cfg, "zihin", "B1 için durumum ne", date=BUGUN, transport=tr, now=SIMDI)
        eq(r["dayanak"], "model")
        ok("Zihin ajanısın" in tr.sistemler[0] and "BAĞLAM" in tr.sistemler[0])
        r2 = ekip.calistir(con, {"web": {"acik": False}}, "beden", "uyku nasıl", date=BUGUN, now=SIMDI)
        eq(r2["dayanak"], "kural")
        ok("Model çalışmadı" in r2["ozet"], "model yoksa da rapor var")
        r3 = ekip.calistir(con, cfg, "arastirmaci", "squat", now=SIMDI)
        eq(r3["dayanak"], "yok", "web kapaliyken aga cikilmaz")
        ok("Web kapalı" in r3["ozet"])
    test("ajan raporu: rolun modeli, kendi baglami; model yoksa kural", t_rapor)

    def t_tani():
        t = gorev.tani("Bu hafta B1'e hazırla beni", BUGUN)
        eq((t["hedef"], t["gun_sayisi"], t["gunluk_dk"], t["eksik"]), ("B1", 5, None, []))
        t2 = gorev.tani("2 hafta içinde YDS'ye hazırlanmak istiyorum, günde 1 saat", BUGUN)
        eq((t2["hedef"], t2["gun_sayisi"], t2["gunluk_dk"]), ("YDS", 14, 60))
        eq(gorev.tani("beni B1'e hazırla", BUGUN)["eksik"], ["sure"], "sure yoksa sorulur")
        eq(gorev.tani("Bu hafta B1'e hazırla beni", "2026-10-25")["gun_sayisi"], 7, "pazar: 7 gune yayilir")
        eq(gorev.tani("türev özeti hazırla", BUGUN), None, "urun istegi gorev degil")
    test("gorev: cumleden hedef ve sure kodla", t_tani)

    def t_gorev():
        con, cfg = db.connect(":memory:"), _cfg()
        tr = _model()
        r = gorev.olustur(con, cfg, "B1", 5, gunluk_dk=60, kaynak="Bu hafta B1'e hazırla beni, günde 1 saat",
                          bugun=BUGUN, transport=tr, now=SIMDI)
        ok(r["ok"])
        p = r["gorev"]
        eq((p["durum"], p["ajan"], p["modul"], p["bitis"]), ("taslak", "zihin", "esp", "2026-10-25"))
        eq([a["tur"] for a in p["adimlar"]], ["analiz", "arastirma", "plan"] + ["calisma"] * 5 + ["degerlendirme"])
        eq(p["adimlar"][1]["ajan"], "arastirmaci")
        eq(len(p["gunler"]), 5)
        eq(is_kuyrugu.ozet(con)["acik"], 0, "taslak onaysiz baslamaz")
        gorev.onayla(con, p["id"], bugun=BUGUN, now=SIMDI)
        eq(is_kuyrugu.ozet(con)["metin"], "King şu an 4 iş yapıyor", "bugunun 4 adimi sirada")
        eq(_hepsini_isle(con, cfg, tr), 4)
        p = gorev.pano(con, gorev.getir(con, p["id"]))
        eq([a["durum"] for a in p["adimlar"][:4]], ["bitti"] * 4)
        eq(p["adimlar"][4]["durum"], "bekliyor", "yarinin adimi bugun calismaz")
        eq([a["baslik"] for a in p["adimlar"][3:6]], ["Kelime listesi", "Dinleme pratiği", "Okuma metni"])
        eq(p["adimlar"][6]["baslik_kaynak"], "kod", "model az satir yazdiysa kodun basligi kalir")
        acik = intents.take(con, "esp")["intents"]
        eq(len(acik), 5, "her calisma gunu icin bir plan.add teklifi")
        ok(all(n["kind"] == "plan.add" and n["state"] in ("pending", "delivered") for n in acik), "teklif uygulanmaz")
        eq(acik[0]["payload"]["minutes"], 60)
        eq(p["ilerleme"]["bitti"], 4)
        # Son gune kadar: her gun tik o gunun adimini siraya koyar.
        for gun in ("2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"):
            gorev.tik(con, cfg, bugun=gun, now=SIMDI)
            _hepsini_isle(con, cfg, tr)
        gorev.tik(con, cfg, bugun="2026-10-25")
        p = gorev.pano(con, gorev.getir(con, p["id"]))
        eq((p["durum"], p["ilerleme"]["yuzde"]), ("bitti", 100))
    test("gorev: iskelet, onay, gunlere dagitim, teklif, ilerleme", t_gorev)

    def t_sure_yok():
        con, cfg = db.connect(":memory:"), _cfg()
        tr = _model()
        p = gorev.olustur(con, cfg, "B1", 2, ajan="zihin", bugun=BUGUN, now=SIMDI)["gorev"]
        eq(p["gunluk_dk"], None, "dakika uydurulmaz")
        gorev.onayla(con, p["id"], bugun=BUGUN, now=SIMDI)
        _hepsini_isle(con, cfg, tr)
        eq(intents.take(con, "esp")["intents"], [], "sure bilinmiyorsa teklif yok")
        plan = gorev.getir(con, p["id"])["adimlar"][2]
        ok("Günlük süre bilinmediği" in plan["rapor"]["ozet"])
        gorev.sure_ver(con, p["id"], 45, now=SIMDI)
        eq(len(intents.take(con, "esp")["intents"]), 2, "sure soylenince teklif gider")
        p2 = gorev.olustur(con, cfg, "uyku düzeni", 2, ajan="beden", gunluk_dk=30, bugun=BUGUN, now=SIMDI)["gorev"]
        gorev.onayla(con, p2["id"], bugun=BUGUN, now=SIMDI)
        _hepsini_isle(con, cfg, tr)
        eq(intents.take(con, "spi")["intents"], [], "SPİ'de gunluk plan yok: teklif yok")
        no(gorev.olustur(con, cfg, "B1", 40, ajan="zihin", now=SIMDI)["ok"], "en cok 28 gun")
    test("gorev: gunluk sure bilinmiyorsa teklif yok, sonradan verilir", t_sure_yok)

    def t_iptal():
        con, cfg = db.connect(":memory:"), _cfg()
        p = gorev.olustur(con, cfg, "TYT", 3, ajan="akademik", bugun=BUGUN, now=SIMDI)["gorev"]
        gorev.onayla(con, p["id"], bugun=BUGUN, now=SIMDI)
        ok(gorev.iptal(con, p["id"], now=SIMDI)["ok"])
        eq(is_kuyrugu.ozet(con)["acik"], 0, "gorevin isleri de iptal")
        eq(gorev.tik(con, cfg, bugun="2026-10-23"), 0, "iptal gorev siraya is koymaz")
    test("gorev: iptal kuyruktaki isleri durdurur", t_iptal)

    def t_sohbet():
        con, cfg = db.connect(":memory:"), _cfg()
        tr = _model()
        c = gorev.sohbet_cevabi(con, cfg, "Bu hafta B1'e hazırla beni", bugun=BUGUN, transport=tr, now=SIMDI)
        ok("5 günlük görev taslağı" in c and "«görevi başlat»" in c, c)
        eq(gorev.sohbet_cevabi(con, cfg, "beni B1'e hazırla", bugun=BUGUN, now=SIMDI)[:4], "«B1»", "sure sorulur")
        c2 = gorev.sohbet_cevabi(con, cfg, "görevi başlat", bugun=BUGUN, now=SIMDI)
        ok("King şu an 4 iş yapıyor" in c2, c2)
        ok(gorev.sohbet_cevabi(con, cfg, "ekip ne yapıyor", now=SIMDI).startswith("King şu an 4 iş yapıyor"))
        c3 = gorev.sohbet_cevabi(con, cfg, "arka planda bu haftaki TYT netlerime bak", now=SIMDI)
        ok("Akademik ajanına verdim" in c3, c3)
        eq(gorev.sohbet_cevabi(con, cfg, "merhaba nasılsın", now=SIMDI), None, "olagan sohbet")
        eq(gorev.sohbet_cevabi(con, cfg, "arka planda müzik çalarken çalışıyorum", now=SIMDI), None,
           "«arka planda» tek basina devir degil")
        eq(gorev.sohbet_cevabi(db.connect(":memory:"), cfg, "sen ne yapıyorsun", now=SIMDI), None,
           "acik is yokken sohbet sorusu sohbete gider")
        from core import sohbet
        r = sohbet.konus(db.connect(":memory:"), cfg, "Bu hafta B1'e hazırla beni", BUGUN, transport=tr)
        eq((r["mode"], r["command"]), ("ekip", "gorev"), "King sohbeti gorevi kural yolunda kurar")
    test("sohbet: gorev kur, baslat, durum, arka planda devir", t_sohbet)

    def t_uc():
        con, cfg = db.connect(":memory:"), _cfg()
        eq(gorev.uc(con, cfg, "GET", "/api/king/emir/3"), None, "baska yol bizim degil")
        k, o = gorev.uc(con, cfg, "GET", "/api/king/ekip")
        eq((k, [a["id"] for a in o["ajanlar"]]), (200, ["akademik", "beden", "zihin", "arastirmaci"]))
        k, o = gorev.uc(con, cfg, "POST", "/api/king/is", govde={"istek": "uyku düzenim", "ajan": "beden"}, now=SIMDI)
        eq((k, o["is"]["ajan"]), (201, "beden"))
        eq(gorev.uc(con, cfg, "POST", "/api/king/is", govde={"istek": "x y z", "ajan": "muhasebe"})[0], 422)
        k, o = gorev.uc(con, cfg, "GET", "/api/king/isler", q={"durum": ["acik"]})
        eq((k, len(o["isler"]), o["durum"]["metin"]), (200, 1, "King şu an 1 iş yapıyor"))
        eq(gorev.uc(con, cfg, "POST", "/api/king/is/%d/iptal" % o["isler"][0]["id"])[0], 200)
        k, o = gorev.uc(con, cfg, "POST", "/api/king/gorev", govde={"metin": "10 gün TYT'ye hazırla beni"}, now=SIMDI)
        eq((k, o["gorev"]["ajan"], o["gorev"]["gun_sayisi"]), (201, "akademik", 10))
        gid = o["gorev"]["id"]
        eq(gorev.uc(con, cfg, "POST", "/api/king/gorev/%d/onayla" % gid, now=SIMDI)[0], 200)
        eq(gorev.uc(con, cfg, "POST", "/api/king/gorev/%d/onayla" % gid, now=SIMDI)[0], 409, "iki kez onaylanmaz")
        eq(gorev.uc(con, cfg, "GET", "/api/king/gorev/%d" % gid)[1]["gorev"]["durum"], "suruyor")
        eq(len(gorev.uc(con, cfg, "GET", "/api/king/gorevler")[1]["gorevler"]), 1)
        eq(gorev.uc(con, cfg, "GET", "/api/king/gorev/999")[0], 404)
    test("uclar: ekip, isler, is, gorevler, gorev", t_uc)
