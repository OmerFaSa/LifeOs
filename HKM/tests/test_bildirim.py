# -*- coding: utf-8 -*-
"""Bildirim politikasi — sessiz saat, gunluk sinir, susturma (core/bildirim.py).

Korunan sozler: cevap bekletilmez; bekletilen kaybolmaz ve sabah TEK ozette
gider; kullanici acmadikca hicbir kural calismaz; susturma bir turu susturur.
"""

import datetime

from core import bildirim, db, outbox, settings
from tests.harness import eq, no, ok, suite, test

CFG = {"channels": {"telegram": {"enabled": True, "bot_token": "T", "allow_from": ["7"]}}}


def _cfg(**b):
    c = dict(CFG)
    c["bildirim"] = b
    return c


def _an(gun, saat, dakika=0):
    return datetime.datetime(2026, 9, gun, saat, dakika)


def _tas(gonderilen):
    def f(*a):
        gonderilen.append(a)
        return 200, "{}"
    return f


def run():
    suite("bildirim politikasi")

    def t_quiet_window():
        """Gece yarisini asan pencere de sessizdir; bos ayar kapalidir."""
        c = _cfg(sessiz_bas="23:00", sessiz_bit="08:00")
        ok(bildirim.sessiz_mi(c, _an(23, 23, 30)))
        ok(bildirim.sessiz_mi(c, _an(24, 7, 59)))
        no(bildirim.sessiz_mi(c, _an(24, 8, 0)))
        no(bildirim.sessiz_mi(CFG, _an(24, 3, 0)))
        ok(bildirim.sessiz_mi(_cfg(sessiz_bas="13:00", sessiz_bit="15:00"), _an(24, 14, 0)))
        eq(bildirim.sabah(c, _an(23, 23, 30)), _an(24, 8, 0))
        eq(bildirim.sabah(c, _an(24, 2, 0)), _an(24, 8, 0))
    test("sessiz saat penceresi", t_quiet_window)

    def t_quiet_defers_and_merges():
        """Gece gelen iki bildirim bekler, sabah TEK ozette gider; kullanicinin
        mesajina verilen cevap beklemez."""
        con = db.connect(":memory:")
        c = _cfg(sessiz_bas="23:00", sessiz_bit="08:00")
        gid = []
        outbox.enqueue(con, "telegram", "emir:1:bitti", "2026-09-23", "Birinci iş bitti.",
                       target="7", now=_an(23, 23, 10))
        outbox.enqueue(con, "telegram", "emir:2:bitti", "2026-09-23", "İkinci iş bitti.",
                       target="7", now=_an(23, 23, 20))
        outbox.enqueue(con, "telegram", "reply:7:99", "2026-09-23", "Cevabın.",
                       target="7", now=_an(23, 23, 30))
        r = outbox.flush(con, c, now=_an(23, 23, 31), transport=_tas(gid))
        eq((r["sent"], r["deferred"]), (1, 2))
        eq(len(gid), 1)
        r = outbox.flush(con, c, now=_an(24, 7, 0), transport=_tas(gid))
        eq(r["sent"], 0)
        r = outbox.flush(con, c, now=_an(24, 8, 1), transport=_tas(gid))
        eq(r["sent"], 1)
        eq(len(gid), 2)
        ozet = con.execute("SELECT * FROM outbox WHERE kind LIKE 'ozet:%'").fetchone()
        ok("Bekletilen 2 mesaj" in ozet["text"])
        ok("Birinci iş bitti." in ozet["text"] and "İkinci iş bitti." in ozet["text"])
        eq(sorted(r["state"] for r in con.execute(
            "SELECT state FROM outbox WHERE kind LIKE 'emir:%'")), ["birlesti", "birlesti"])
    test("sessiz saatte bekler, sabah tek ozet", t_quiet_defers_and_merges)

    def t_single_deferred_goes_alone():
        """Tek bekleyen satir ozete cevrilmez; oldugu gibi gider."""
        con = db.connect(":memory:")
        c = _cfg(sessiz_bas="23:00", sessiz_bit="08:00")
        gid = []
        outbox.enqueue(con, "telegram", "evening", "2026-09-23", "Gün kapanışı.",
                       now=_an(23, 23, 5))
        outbox.flush(con, c, now=_an(23, 23, 6), transport=_tas(gid))
        outbox.flush(con, c, now=_an(24, 8, 0), transport=_tas(gid))
        eq(len(gid), 1)
        eq(con.execute("SELECT state FROM outbox").fetchone()["state"], "sent")
    test("tek bekleyen oldugu gibi gider", t_single_deferred_goes_alone)

    def t_daily_cap():
        """Gunluk sinir dolunca fazlasi ertesi sabaha; cevap sayilmaz."""
        con = db.connect(":memory:")
        c = _cfg(gunluk_en_cok=2)
        gid = []
        for i in range(4):
            outbox.enqueue(con, "telegram", "emir:%d:bitti" % i, "2026-09-23",
                           "İş %d" % i, target="7", now=_an(23, 10, i))
        outbox.enqueue(con, "telegram", "reply:7:5", "2026-09-23", "Cevap", target="7",
                       now=_an(23, 10, 5))
        r = outbox.flush(con, c, now=_an(23, 10, 6), transport=_tas(gid))
        eq((r["sent"], r["deferred"]), (3, 2))
        eq(bildirim.bugun_giden(con, _an(23, 12)), 2)
        r = outbox.flush(con, c, now=_an(24, 8, 1), transport=_tas(gid))
        eq(r["sent"], 1)       # iki bekleyen tek ozette
    test("gunluk sinir fazlasi ozete", t_daily_cap)

    def t_default_off():
        """Ayar yoksa hicbir sey bekletilmez."""
        con = db.connect(":memory:")
        gid = []
        outbox.enqueue(con, "telegram", "daily", "2026-09-24", "Brifing", now=_an(24, 3))
        r = outbox.flush(con, CFG, now=_an(24, 3, 1), transport=_tas(gid))
        eq((r["sent"], r["deferred"]), (1, 0))
    test("varsayilan kapali", t_default_off)

    def t_settings_validate():
        ok(settings.validate({"bildirim": {"sessiz_bas": "23:00", "sessiz_bit": "08:00",
                                           "gunluk_en_cok": 6}})[0])
        no(settings.validate({"bildirim": {"sessiz_bas": "25:00"}})[0])
        no(settings.validate({"bildirim": {"sessiz_bas": "23:00", "sessiz_bit": ""}})[0])
        no(settings.validate({"bildirim": {"gunluk_en_cok": -1}})[0])
        no(settings.validate({"bildirim": {"bilinmeyen": 1}})[0])
        yeni = settings.apply({}, {"bildirim": {"gunluk_en_cok": 5}})
        eq(bildirim.settings(yeni)["gunluk_en_cok"], 5)
        eq(settings.read(yeni)["bildirim"]["gunluk_en_cok"], 5)
    test("ayar dogrulanir", t_settings_validate)

    def t_mute_registry():
        """Susturma bir turu susturur; geri acilir."""
        con = db.connect(":memory:")
        bildirim.sustur(con, "eksik:sleep_hours", "Eksik uyku sorusu")
        bildirim.sustur(con, "eksik:sleep_hours", "Eksik uyku sorusu")
        ok(bildirim.susturuldu_mu(con, "eksik:sleep_hours"))
        eq(len(bildirim.susturulanlar(con)), 1)
        ok(bildirim.ac(con, "eksik:sleep_hours")["ok"])
        no(bildirim.susturuldu_mu(con, "eksik:sleep_hours"))
        no(bildirim.ac(con, "yok")["ok"])
    test("susturma kaydi", t_mute_registry)


def run_eksik():
    import json
    from core import eksik, schedule, sohbet
    suite("eksik veri tek soru")

    def _olay(con, modul, gun, metrikler):
        db.insert_event(con, modul, gun, gun + "T21:00:00",
                        {"module": modul, "date": gun, "metrics": metrikler})

    def t_asks_once_for_used_module():
        """Kullanilan modulun dunku eksigi TEK soruyla sorulur; kullanilmayan sorulmaz."""
        con = db.connect(":memory:")
        eq(eksik.sor(con, "2026-09-24"), None)                     # SPI hic kullanilmadi
        _olay(con, "spi", "2026-09-21", {"sleep_hours": {"value": 7, "cert": "measured"}})
        s = eksik.sor(con, "2026-09-24")
        ok(s.startswith("Dün uyku kaydı yok."))
        ok("«7»" in s and "«bilmiyorum»" in s)
        eq(eksik.sor(con, "2026-09-24"), None)                     # gunde tek soru
        # Dun olculmusse sorulmaz.
        con2 = db.connect(":memory:")
        _olay(con2, "spi", "2026-09-23", {"sleep_hours": {"value": 6.5, "cert": "measured"}})
        eq(eksik.sor(con2, "2026-09-24"), None)
        # «veri yok» etiketli metrik eksiktir.
        con3 = db.connect(":memory:")
        _olay(con3, "spi", "2026-09-23", {"sleep_hours": {"value": None, "cert": "missing"}})
        ok(eksik.sor(con3, "2026-09-24") is not None)
    test("kullanilan modulun eksigi bir kez sorulur", t_asks_once_for_used_module)

    def t_number_answer_becomes_offer():
        """«7» cevabi dunun tarihiyle SPI'ye `kayit.add` teklifi olur; sayiyi SPI okur."""
        con = db.connect(":memory:")
        _olay(con, "spi", "2026-09-22", {"sleep_hours": {"value": 7, "cert": "measured"}})
        eksik.sor(con, "2026-09-24", now=datetime.datetime(2026, 9, 24, 8, 0))
        r = sohbet.konus(con, {}, "7", "2026-09-24")
        eq(r["command"], "soru")
        n = con.execute("SELECT module, kind, payload FROM intents").fetchone()
        eq((n["module"], n["kind"]), ("spi", "kayit.add"))
        eq(json.loads(n["payload"]), {"date": "2026-09-23", "metin": "uyku 7"})
        eq(con.execute("SELECT durum FROM sorular").fetchone()["durum"], "cevaplandi")
        # Soru kapandi: ikinci «7» artik bu yoldan gecmez.
        eq(eksik.cevap(con, "7", "2026-09-24"), None)
    test("tek sayi cevap teklif olur", t_number_answer_becomes_offer)

    def t_dont_know_and_mute():
        """«bilmiyorum» veri yok birakir; «bir daha sorma» turu susturur."""
        con = db.connect(":memory:")
        _olay(con, "spi", "2026-09-22", {"sleep_hours": {"value": 7, "cert": "measured"}})
        eksik.sor(con, "2026-09-24", now=datetime.datetime(2026, 9, 24, 8, 0))
        ok("veri yok" in eksik.cevap(con, "Bilmiyorum", "2026-09-24"))
        eq(con.execute("SELECT COUNT(*) FROM intents").fetchone()[0], 0)
        eksik.sor(con, "2026-09-25", now=datetime.datetime(2026, 9, 25, 8, 0))
        ok("bir daha sormayacağım" in eksik.cevap(con, "bir daha sorma", "2026-09-25"))
        ok(bildirim.susturuldu_mu(con, "eksik:sleep_hours"))
        eq(eksik.sor(con, "2026-09-26"), None)
    test("bilmiyorum ve bir daha sorma", t_dont_know_and_mute)

    def t_mute_proposal_not_red_flag():
        """Acik soru yoksa «bir daha sorma» gunun onerisinin turunu susturur;
        saglik kirmizi bayragi susturulamaz."""
        con = db.connect(":memory:")
        db.insert_decision(con, "2026-09-24", 3, "Bugün hedef derse ağırlık verilebilir.",
                           "2026-09-24T08:00:00", key="academic_goal")
        ok("bir daha getirmeyeceğim" in eksik.cevap(con, "bir daha sorma", "2026-09-24"))
        ok(bildirim.susturuldu_mu(con, "oneri:academic_goal"))
        eq(con.execute("SELECT state FROM decisions").fetchone()["state"], "declined")
        con2 = db.connect(":memory:")
        db.insert_decision(con2, "2026-09-24", 1, "Uyku kırmızı eşikte.", "2026-09-24T08:00:00",
                           key="bio_red")
        ok("susturulamaz" in eksik.cevap(con2, "bir daha sorma", "2026-09-24"))
        no(bildirim.susturuldu_mu(con2, "oneri:bio_red"))
    test("oneri susturma; kirmizi bayrak haric", t_mute_proposal_not_red_flag)

    def t_morning_brief_carries_question():
        """Zamanlanmis sabah brifingi soruyu tasir."""
        con = db.connect(":memory:")
        _olay(con, "spi", "2026-09-22", {"sleep_hours": {"value": 7, "cert": "measured"}})
        cfg = {"channels": {"telegram": {"enabled": True, "bot_token": "T",
                                         "allow_from": ["7"]}},
               "schedule": {"enabled": True, "morning": "08:00"}}
        r = schedule.run(con, cfg, {"kind": "daily"}, now=datetime.datetime(2026, 9, 24, 8, 5))
        ok(r["ok"])
        metin = con.execute("SELECT text FROM outbox WHERE kind='daily'").fetchone()["text"]
        ok("Dün uyku kaydı yok." in metin)
    test("sabah brifingi soruyu tasir", t_morning_brief_carries_question)


def run_bayat():
    from core import king, schedule
    suite("cevapsiz teklif kapanir")

    def _emir(con, konu, durum, gun):
        t = "2026-09-%02dT10:00:00" % gun
        return con.execute(
            "INSERT INTO is_emirleri(modul,tur,konu,karar,durum,created_at,updated_at) "
            "VALUES ('hkm','bam.urun',?,'onay',?,?,?)", (konu, durum, t, t)).lastrowid

    def t_stale_offers_close_and_are_told():
        """N gunden eski cevapsiz modul teklifi «expired», King teklifi «iptal» olur;
        kapananlar TEK mesajla soylenir. Taze teklif ve cevaplanmis teklif kalir."""
        con = db.connect(":memory:")
        eski = db.insert_intent(con, "spi", "kayit.add", {"date": "2026-09-19", "metin": "su 2"},
                                "SPİ: su 2 kaydı", "patron", created_at="2026-09-19T09:00:00")
        taze = db.insert_intent(con, "ays", "kayit.add", {"date": "2026-09-23", "metin": "soru 40"},
                                "AYS: soru 40", "patron", created_at="2026-09-23T09:00:00")
        cevapli = db.insert_intent(con, "esp", "kayit.add", {"date": "2026-09-18", "metin": "gitar 30"},
                                   "ESP: gitar 30", "patron", created_at="2026-09-18T09:00:00")
        db.set_intent_state(con, cevapli, "applied")
        e_eski = _emir(con, "Rusça A1 paketi", "teklif", 19)
        e_taze = _emir(con, "Gitar repertuvarı", "teklif", 23)
        r = bildirim.bayatlari_kapat(con, CFG, datetime.datetime(2026, 9, 23, 12, 0))
        eq(len(r), 2)
        eq(db.intent(con, eski)["state"], "expired")
        eq(db.intent(con, taze)["state"], "pending")
        eq(db.intent(con, cevapli)["state"], "applied")
        eq(king.emir(con, e_eski)["durum"], "iptal")
        eq(king.emir(con, e_taze)["durum"], "teklif")
        m = con.execute("SELECT text FROM outbox WHERE kind LIKE 'kapanan:%'").fetchone()["text"]
        ok("2 teklif kapandı" in m and "Rusça A1 paketi" in m and "su 2" in m)
        # Ikinci tur bir sey kapatmaz, ikinci mesaj yazmaz.
        eq(bildirim.bayatlari_kapat(con, CFG, datetime.datetime(2026, 9, 23, 12, 5)), [])
        eq(con.execute("SELECT COUNT(*) FROM outbox").fetchone()[0], 1)
        # Modul artik bu teklifi almaz.
        eq([n["id"] for n in db.intents_for(con, "spi", ("pending", "delivered"))], [])
    test("bayat teklif kapanir ve soylenir", t_stale_offers_close_and_are_told)

    def t_tick_runs_it():
        con = db.connect(":memory:")
        db.insert_intent(con, "spi", "kayit.add", {"date": "2026-09-01", "metin": "su 2"},
                         "SPİ: su 2", "patron", created_at="2026-09-01T09:00:00")
        schedule.tick(con, {"bildirim": {"teklif_omru_gun": 5}},
                      now=datetime.datetime(2026, 9, 23, 12, 0), transport=lambda *a: (200, "{}"))
        eq(con.execute("SELECT state FROM intents").fetchone()["state"], "expired")
    test("dakikalik tik kapatir", t_tick_runs_it)


def run_yarin():
    import json
    from core import dil, hedefag, patron, schedule, sohbet
    suite("aksam yarin su uc sey")

    def t_snapshot_is_validated():
        con = db.connect(":memory:")
        ok(hedefag.yarin_yaz(con, "ays", {"gun": "2026-09-24", "isler": [
            {"metin": "Matematik · Türev", "dk": 90}, {"metin": "", "dk": 5},
            {"metin": "Paragraf", "dk": True}, "bozuk"]})["ok"])
        eq(hedefag.yarin_oku(con, "2026-09-24"),
           {"ays": [{"metin": "Matematik · Türev", "dk": 90}, {"metin": "Paragraf", "dk": None}]})
        no(hedefag.yarin_yaz(con, "ays", {"gun": "yarin", "isler": []})["ok"])
        no(hedefag.yarin_yaz(con, "xyz", {"gun": "2026-09-24", "isler": []})["ok"])
        eq(hedefag.yarin_oku(con, "2026-09-25"), {})
    test("yarin goruntusu dogrulanir", t_snapshot_is_validated)

    def t_evening_lists_three_in_module_order():
        """En cok uc is, AYS-SPI-ESP sirasiyla; eski gunun listesi soylenmez."""
        con = db.connect(":memory:")
        hedefag.yarin_yaz(con, "ays", {"gun": "2026-09-24", "isler": [
            {"metin": "Matematik · Türev", "dk": 90}, {"metin": "Fizik · Kuvvet", "dk": 60}]})
        hedefag.yarin_yaz(con, "esp", {"gun": "2026-09-24", "isler": [
            {"metin": "Gitar", "dk": 20}, {"metin": "Okuma", "dk": 30}]})
        hedefag.yarin_yaz(con, "spi", {"gun": "2026-09-20", "isler": [{"metin": "Eski", "dk": 1}]})
        m = schedule.yarin_metni(con, "2026-09-23")
        eq(m.split("\n")[1:4], ["• AYS — Matematik · Türev (90 dk)", "• ESP — Gitar (20 dk)",
                                "• AYS — Fizik · Kuvvet (60 dk)"])
        ok("Eski" not in m and "«yarın hafif»" in m)
        eq(schedule.yarin_metni(con, "2026-09-25"), None)
        cfg = {"channels": {"telegram": {"enabled": True, "bot_token": "T", "allow_from": ["7"]}},
               "schedule": {"enabled": True, "evening": "21:00"}}
        schedule.run(con, cfg, {"kind": "evening"}, now=datetime.datetime(2026, 9, 23, 21, 1))
        ok("Yarın şunlar var:" in con.execute("SELECT text FROM outbox").fetchone()["text"])
        # Susturulursa eklenmez; yoklamaya ancak aksam kapanisi kapaliysa eklenir.
        con2 = db.connect(":memory:")
        hedefag.yarin_yaz(con2, "ays", {"gun": "2026-09-24", "isler": [{"metin": "Mat", "dk": 30}]})
        bildirim.sustur(con2, "yarin", "Akşam yarın özeti")
        schedule.run(con2, cfg, {"kind": "evening"}, now=datetime.datetime(2026, 9, 23, 21, 1))
        ok("Yarın şunlar var" not in con2.execute("SELECT text FROM outbox").fetchone()["text"])
        con3 = db.connect(":memory:")
        hedefag.yarin_yaz(con3, "ays", {"gun": "2026-09-24", "isler": [{"metin": "Mat", "dk": 30}]})
        cfg3 = dict(cfg, schedule={"enabled": True, "checkin": "21:30"})
        schedule.run(con3, cfg3, {"kind": "checkin"}, now=datetime.datetime(2026, 9, 23, 21, 31))
        ok("Yarın şunlar var" in con3.execute("SELECT text FROM outbox").fetchone()["text"])
    test("aksam en cok uc is, modul sirasiyla", t_evening_lists_three_in_module_order)

    def t_one_word_change():
        """«yarın hafif» yarini olan modullere yuk azaltma TEKLIFI birakir; oran yok."""
        ok(dil.yarin_hafif("Yarın hafif"))
        ok(dil.yarin_hafif("yarını hafiflet"))
        ok(dil.yarin_hafif("yarın daha hafif olsun") is False)
        no(dil.yarin_hafif("yarın 2 saat matematik"))
        con = db.connect(":memory:")
        hedefag.yarin_yaz(con, "ays", {"gun": "2026-09-24", "isler": [{"metin": "Mat", "dk": 30}]})
        r = sohbet.konus(con, {}, "yarın hafif", "2026-09-23")
        eq(r["command"], "hafif")
        rows = [(x["module"], x["kind"], json.loads(x["payload"])) for x in
                con.execute("SELECT module, kind, payload FROM intents")]
        eq(rows, [("ays", "load.reduce", {"date": "2026-09-24", "why": "Akşam özetinden: yarını hafiflet."})])
    test("yarin hafif tek kelime", t_one_word_change)
