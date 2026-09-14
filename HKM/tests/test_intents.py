# -*- coding: utf-8 -*-
"""Niyet kuyrugu — HKM'nin YETKI ALMADAN is baslatmasi.

Bu paket tek bir seyi korur: HKM hicbir zaman modulun yerine yazmaz.
Kuyruk bir teklif kanalidir, uzaktan komut kanali degil.
"""

from core import db, intents, patron
from tests.harness import eq, no, ok, suite, test

BUGUN = "2026-09-14"


def _con():
    return db.connect(":memory:")


def run():
    suite("niyet")

    def t_unknown_kind_refused():
        """Kuyruk serbest bir uzaktan komut kanali DEGILDIR."""
        con = _con()
        r = intents.create(con, "ays", "shell.exec", {"cmd": "rm -rf"}, "not")
        no(r["ok"])
        ok("bilinmeyen niyet turu" in r["errors"][0])
        eq(db.intents_for(con, "ays", ("pending",)), [])
    test("tanimsiz tur reddedilir", t_unknown_kind_refused)

    def t_unknown_field_refused():
        con = _con()
        r = intents.create(con, "ays", "plan.add",
                           {"date": BUGUN, "minutes": 60, "script": "x"}, "not")
        no(r["ok"])
        ok(any("bilinmeyen alan" in e for e in r["errors"]))
    test("tanimsiz alan reddedilir", t_unknown_field_refused)

    def t_required_fields():
        con = _con()
        r = intents.create(con, "ays", "plan.add", {"minutes": 60}, "not")
        no(r["ok"])
        ok(any("date" in e for e in r["errors"]))
    test("zorunlu alan aranir", t_required_fields)

    def t_kind_module_pairing():
        """measure.ask yalniz SPI'de tanimli."""
        con = _con()
        no(intents.create(con, "ays", "measure.ask",
                          {"date": BUGUN, "metric": "hrv"}, "not")["ok"])
        ok(intents.create(con, "spi", "measure.ask",
                          {"date": BUGUN, "metric": "hrv"}, "not")["ok"])
    test("tur ve modul eslesmesi zorunlu", t_kind_module_pairing)

    def t_duplicate_is_noise():
        con = _con()
        a = intents.create(con, "ays", "plan.add", {"date": BUGUN, "minutes": 60},
                           "not")
        b = intents.create(con, "ays", "plan.add", {"date": BUGUN, "minutes": 60},
                           "not")
        ok(b["duplicate"])
        eq(a["intent"]["id"], b["intent"]["id"])
        eq(len(db.intents_for(con, "ays", ("pending",))), 1)
    test("ayni teklif iki kez yazilmaz", t_duplicate_is_noise)

    def t_delivered_is_not_applied():
        """Gorulmemis ile reddedilmis ayri seylerdir — ve gorulmus de
        uygulanmis DEGILDIR."""
        con = _con()
        intents.create(con, "ays", "plan.add", {"date": BUGUN, "minutes": 60}, "not")
        alinan = intents.take(con, "ays")
        eq(len(alinan["intents"]), 1)
        ozet = intents.summary(con)["ays"]
        eq(ozet["delivered"], 1)
        eq(ozet["applied"], 0)
        eq(ozet["pending"], 0)
        eq(alinan["new"], 1)
    test("teslim edilmis niyet uygulanmis sayilmaz", t_delivered_is_not_applied)

    def t_open_intent_survives_refresh():
        """Gorulmus ama CEVAPLANMAMIS teklif ikinci sorusta da gelir.

        Once kuyruk yalniz «pending» veriyordu: kullanici sayfayi cevap
        vermeden yenilerse teklif kayboluyor, merkezde ise sonsuza kadar
        «delivered» olarak asili kaliyordu."""
        con = _con()
        intents.create(con, "ays", "plan.add", {"date": BUGUN, "minutes": 60}, "not")
        bir = intents.take(con, "ays")
        eq(bir["new"], 1)
        iki = intents.take(con, "ays")          # sayfa yenilendi
        eq(len(iki["intents"]), 1)
        eq(iki["new"], 0)
        eq(iki["again"], 1)
        eq(iki["intents"][0]["state"], "delivered")
        # Cevaplandiktan SONRA bir daha gelmez.
        intents.answer(con, iki["intents"][0]["id"], "applied")
        eq(len(intents.take(con, "ays")["intents"]), 0)
    test("cevaplanmamis teklif yenilemede kaybolmaz", t_open_intent_survives_refresh)

    def t_same_answer_is_not_a_conflict():
        """Baglanti koptugu icin bildirilemeyen cevap sonra tekrar denenir;
        AYNI cevabin tekrari hata degildir."""
        con = _con()
        r = intents.create(con, "spi", "measure.ask",
                           {"date": BUGUN, "metric": "sleep"}, "not")
        nid = r["intent"]["id"]
        eq(intents.answer(con, nid, "applied")["ok"], True)
        tekrar = intents.answer(con, nid, "applied")
        ok(tekrar["ok"])
        ok(tekrar["duplicate"])
        eq(intents.summary(con)["spi"]["applied"], 1)
        # FARKLI cevap hala catismadir.
        no(intents.answer(con, nid, "dismissed")["ok"])
    test("ayni cevabin tekrari catisma degildir", t_same_answer_is_not_a_conflict)

    def t_answer_once():
        con = _con()
        r = intents.create(con, "esp", "plan.add",
                           {"date": BUGUN, "minutes": 30, "disc": "lang"}, "not")
        nid = r["intent"]["id"]
        eq(intents.answer(con, nid, "applied")["ok"], True)
        no(intents.answer(con, nid, "dismissed")["ok"])
        no(intents.answer(con, 999, "applied")["ok"])
        no(intents.answer(con, nid, "belki")["ok"])
    test("bir niyet bir kez cevaplanir", t_answer_once)

    def t_dismissed_is_kept():
        """Reddedilen teklif SILINMEZ: «istenmedi» bir veridir."""
        con = _con()
        r = intents.create(con, "ays", "plan.add", {"date": BUGUN, "minutes": 60},
                           "not")
        intents.answer(con, r["intent"]["id"], "dismissed")
        eq(intents.summary(con)["ays"]["dismissed"], 1)
        ok(db.intent(con, r["intent"]["id"]))
    test("reddedilen teklif kayitta kalir", t_dismissed_is_kept)

    def t_patron_turns_request_into_intent():
        """«yarin iki saat matematik» bir SORU degil bir ISTEKTIR."""
        con = _con()
        r = patron.respond(con, "yarın 2 saat matematik çalışacağım", date=BUGUN)
        eq(r["command"], "istek")
        bekleyen = db.intents_for(con, "ays", ("pending",))
        eq(len(bekleyen), 1)
        eq(bekleyen[0]["payload"]["minutes"], 120)
        eq(bekleyen[0]["payload"]["date"], "2026-09-15")
        ok("AYS" in r["text"])
        ok("HKM senin adına hiçbir yere yazmaz" in r["text"])
    test("istek niyete cevrilir, yazilmaz", t_patron_turns_request_into_intent)

    def t_missing_field_is_asked_not_guessed():
        con = _con()
        r = patron.respond(con, "yarın 2 saat çalışacağım", date=BUGUN)
        ok("Hangi alanda" in r["text"])
        eq(db.intents_for(con, "ays", ("pending",)), [])
    test("eksik alan tahmin edilmez, sorulur",
         t_missing_field_is_asked_not_guessed)

    def t_esp_request_goes_to_esp():
        con = _con()
        patron.respond(con, "yarın 45 dakika gitar", date=BUGUN)
        eq(len(db.intents_for(con, "esp", ("pending",))), 1)
        eq(db.intents_for(con, "ays", ("pending",)), [])
    test("istek dogru modulun kuyruguna duser", t_esp_request_goes_to_esp)

    def t_empty_note_gets_a_sentence():
        """Modulde bos bir teklif satiri, ne oldugunu soylemeyen bir
        dugmedir. Cumle SUNUCUDA kurulur: ekranin kendi metni olsaydi iki
        yerde iki cumle olur ve bir gun ayrisirlardi."""
        con = _con()
        r = intents.create(con, "ays", "plan.add",
                           {"date": BUGUN, "minutes": 120,
                            "subject": "Matematik", "topic": "Türev"}, "")
        ok(r["ok"])
        cumle = r["intent"]["note"]
        ok(cumle)
        ok("AYS" in cumle and "120" in cumle and "Türev" in cumle)

        # Kullanicinin yazdigi cumle KORUNUR: uydurulan yalniz boslugun
        # yerine gecer.
        r2 = intents.create(con, "spi", "measure.ask",
                            {"date": BUGUN, "metric": "uyku"}, "Uykunu gir.")
        eq(r2["intent"]["note"], "Uykunu gir.")

        # Her tur icin bir cumle var: hicbiri bos kalmaz.
        for tur, govde, mod in (
                ("focus.set", {"date": BUGUN, "focus": "matematik"}, "ays"),
                ("load.reduce", {"date": BUGUN, "ratio": 0.5}, "spi"),
                ("measure.ask", {"date": BUGUN, "metric": "hrv"}, "spi")):
            c = intents.create(con, mod, tur, govde, "   ")
            ok(c["ok"], tur)
            ok(len(c["intent"]["note"]) > 10, tur)
    test("bos cumle uydurulmaz ama bos da birakilmaz",
         t_empty_note_gets_a_sentence)
