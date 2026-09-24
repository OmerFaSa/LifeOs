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
        # HATALAR D-2: cevap «delivered» diyordu ama delivered_at null'di.
        n = alinan["intents"][0]
        eq(n["state"], "delivered")
        ok(n["delivered_at"], n)
        eq(n["delivered_at"], db.intent(con, n["id"])["delivered_at"])
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

    def t_report_becomes_record_offers():
        """Aksam yoklamasinin cevabi: her parca ilgili modulun kuyruguna
        `kayit.add` olur. HKM sayiyi okumaz ve PLAN teklifi KURMAZ."""
        con = _con()
        r = patron.respond(con, "bugün 2 saat matematik çalıştım, 7 saat uyudum "
                                "ve 30 dakika gitar çaldım", date=BUGUN)
        eq(r["command"], "kayit")
        for mod, metin in (("ays", "bugün 2 saat matematik çalıştım"),
                           ("spi", "7 saat uyudum"), ("esp", "30 dakika gitar çaldım")):
            n = db.intents_for(con, mod, ("pending",))
            eq(len(n), 1, mod)
            eq(n[0]["kind"], "kayit.add")
            eq(n[0]["payload"], {"date": BUGUN, "metin": metin})
            ok(metin in n[0]["note"])
        no(any(n["kind"] == "plan.add" for n in db.intents_for(con, "ays", ("pending",))))
        ok("AYS" in r["text"] and "SPİ" in r["text"] and "ESP" in r["text"])
        ok("HKM senin adına hiçbir yere yazmaz" in r["text"])
        # Ayni cumle ikinci kez: kuyruk buyumez, soylenir.
        r2 = patron.respond(con, "7 saat uyudum", date=BUGUN)
        eq(len(db.intents_for(con, "spi", ("pending",))), 1)
        ok("zaten kuyrukta" in r2["text"])
    test("rapor modullere kayit teklifi olur", t_report_becomes_record_offers)

    def t_report_asks_what_it_cannot_route():
        con = _con()
        r = patron.respond(con, "bugün matematik çalıştım, 3 saat telefonla oynadım",
                           date=BUGUN)
        eq(r["command"], "kayit")
        ok("ne kadar olduğunu yazmadın" in r["text"])
        ok("hangi modülün kaydı olduğunu anlamadım" in r["text"])
        eq(con.execute("SELECT COUNT(*) n FROM intents").fetchone()["n"], 0)
    test("rapor anlamadigini sorar, uydurmaz", t_report_asks_what_it_cannot_route)

    def t_report_day():
        """«dun» dunun kaydidir. Gun soylenmeden gece 00:30'da gelen cevap,
        dunun yoklamasi sorulduysa DUNUN kaydidir; sorulmadiysa bugunun."""
        con = _con()
        patron.respond(con, "dün 40 soru çözdüm", date=BUGUN)
        eq(db.intents_for(con, "ays", ("pending",))[0]["payload"]["date"], "2026-09-13")
        eq(patron.rapor_tarihi(con, BUGUN, BUGUN + "T00:30:00", None), BUGUN)
        from core import outbox
        outbox.enqueue(con, "telegram", "checkin", "2026-09-13", "soru")
        eq(patron.rapor_tarihi(con, BUGUN, BUGUN + "T00:30:00", None), "2026-09-13")
        eq(patron.rapor_tarihi(con, BUGUN, BUGUN + "T09:00:00", None), BUGUN)
        eq(patron.rapor_tarihi(con, BUGUN, BUGUN + "T00:30:00", 0), BUGUN)
    test("raporun gunu soylenen gundur; gece yoklama cevabi dune yazilir", t_report_day)

    def t_record_contract():
        """`kayit.add` uc modulde tanimli; metin sinirli ve tarih gercek."""
        for mod in ("ays", "spi", "esp"):
            ok(intents.validate(mod, "kayit.add", {"date": BUGUN, "metin": "7 saat uyudum"})[0])
        no(intents.validate("ays", "kayit.add", {"date": BUGUN})[0])
        no(intents.validate("ays", "kayit.add", {"date": BUGUN, "metin": "x" * 401})[0])
        no(intents.validate("ays", "kayit.add", {"date": "dun", "metin": "40 soru"})[0])
    test("kayit.add sozlesmesi", t_record_contract)

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
                ("load.reduce", {"date": BUGUN, "ratio": 0.5}, "ays"),
                ("measure.ask", {"date": BUGUN, "metric": "hrv"}, "spi")):
            c = intents.create(con, mod, tur, govde, "   ")
            ok(c["ok"], tur)
            ok(len(c["intent"]["note"]) > 10, tur)
    test("bos cumle uydurulmaz ama bos da birakilmaz",
         t_empty_note_gets_a_sentence)
