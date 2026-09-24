# -*- coding: utf-8 -*-
"""Yonetici — karar URETMEZ, karar TASIR.

Bu paket uc seyi korur: (1) modul bir model katmani import etmez,
(2) uretilen hicbir satir emir kipinde degildir, (3) her oneri kaynagini
tasir ve reddedilen oneri silinmez.
"""

import os
import re

from core import db, manager, sync_engine
from tests.harness import eq, metric, missing, no, ok, suite, test

BUGUN = "2026-09-13"


def _con():
    return db.connect(":memory:")


def _push(con, module, date, **metrics):
    return sync_engine.ingest(con, {"module": module, "date": date,
                                    "metrics": metrics}, now=date + "T09:00:00")


def run():
    # Sabit tarihli senaryolar o gunu «bugun» diye yasar: yalniz bugunun
    # brifingi karar yazar (HATALAR D-3).
    from core import saat
    with saat.sabit(BUGUN):
        _run()


def _run():
    suite("yonetici")

    def t_no_model_layer():
        """Kural motoru otoritedir: bu dosya bir model katmani import etmez."""
        yol = os.path.join(os.path.dirname(os.path.dirname(
            os.path.abspath(__file__))), "core", "manager.py")
        with open(yol, encoding="utf-8") as f:
            kaynak = f.read()
        satirlar = [s for s in kaynak.splitlines()
                    if s.startswith(("import ", "from "))]
        for s in satirlar:
            for yasakli in ("openai", "anthropic", "llm", "model", "requests",
                            "urllib.request", "http.client"):
                no(yasakli in s.lower(), "model/ag katmani sizdi: " + s)
    test("yonetici model katmani import etmez", t_no_model_layer)

    def t_every_line_advisory():
        con = _con()
        _push(con, "spi", BUGUN, sleep_hours=metric(4.0))
        _push(con, "ays", BUGUN, questions=metric(10))
        b = manager.brief(con, BUGUN)
        for ln in b["lines"]:
            no(manager.imperatives(ln["text"]),
               "emir kipi sizdi: " + ln["text"])
    test("brifingin her satiri oneri kipinde", t_every_line_advisory)

    def t_checker_is_whole_word():
        """Denetcinin kendisi denetlenir: alt dize ariyorsa yanlis oter."""
        no(manager.imperatives("acigi kapatmani oneririm"))
        ok(manager.imperatives("ekrani kapat"))
        ok(manager.imperatives("bu is zorunlu"))
        ok(manager.advisory("yarina ertelenmesini oneririm"))
    test("emir denetcisi tam kelime arar", t_checker_is_whole_word)

    def t_imperative_is_dropped_not_rewritten():
        """Sessiz duzeltme anlami tersine cevirebilir: reddet-ve-dus."""
        con = _con()
        _push(con, "spi", BUGUN, sleep_hours=metric(4.0))
        eski = manager.precedence.resolve

        def sahte(**kw):
            return {"rank": 1, "key": "bio_red", "label": "test",
                    "proposal": "Bugun ekrani kapat."}
        manager.precedence.resolve = sahte
        try:
            b = manager.brief(con, BUGUN)
        finally:
            manager.precedence.resolve = eski
        eq(b["proposal"], None)
        eq(len(b["dropped"]), 1)
        eq(b["dropped"][0]["words"], ["kapat"])
        eq(db.decisions_of(con, BUGUN), [])
        ok(any(l["kind"] == "proposal" and l["rank"] is None for l in b["lines"]))
    test("buyurgan oneri yeniden yazilmaz, dusurulur",
         t_imperative_is_dropped_not_rewritten)

    def t_single_proposal():
        """Gunde tek oneri: ikincisi birincinin onceligini yok eder."""
        con = _con()
        _push(con, "spi", BUGUN, sleep_hours=metric(4.0))
        _push(con, "ays", BUGUN, questions=metric(10))
        _push(con, "esp", BUGUN, retention=metric(0.2), retention_cards=metric(20))
        b = manager.brief(con, BUGUN)
        oneriler = [l for l in b["lines"] if l["kind"] == "proposal"]
        eq(len(oneriler), 1)
        eq(b["proposal"]["rank"], 1)
    test("gunde tek oneri kalir", t_single_proposal)

    def t_sources_recorded():
        """Kaynagini gosteremeyen oneri sonradan denetlenemez."""
        con = _con()
        _push(con, "spi", BUGUN, sleep_hours=metric(4.0))
        _push(con, "ays", BUGUN, questions=metric(10))
        b = manager.brief(con, BUGUN)
        kaynak = db.sources_of(con, b["decision"]["id"])
        eq(sorted(k["vp"] for k in kaynak), ["academic", "bio"])
    test("her oneri kaynak denetimlerini tasir", t_sources_recorded)

    def t_idempotent_same_day():
        """Ayni cumle iki kez yazilmaz: ikinci kayit bilgi degil gurultudur."""
        con = _con()
        _push(con, "spi", BUGUN, sleep_hours=metric(4.0))
        a = manager.brief(con, BUGUN)["decision"]["id"]
        b = manager.brief(con, BUGUN)["decision"]["id"]
        eq(a, b)
        eq(len(db.decisions_of(con, BUGUN)), 1)
    test("ayni oneri gun icinde tekrarlanmaz", t_idempotent_same_day)

    def t_gecmis_gun_okumak_yazmaz():
        """HATALAR D-3: GET /api/briefing?date=2020-01-01 ambara karar
        aciyordu. Gecmis gunu okumak bir karar degildir; o gun icin acilmis
        karar varsa o gosterilir."""
        con = _con()
        _push(con, "spi", "2020-01-01", sleep_hours=metric(4.0))
        b = manager.brief(con, "2020-01-01")
        eq(b["proposal"]["rank"], 1)             # oneri hesaplanir
        eq(b["decision"], None)                  # ama yazilmaz
        eq(len(db.decisions_of(con, "2020-01-01")), 0)
        # Bugunun brifingi yazar; ayni gunu sonra okumak ayni karari gosterir.
        _push(con, "spi", BUGUN, sleep_hours=metric(4.0))
        a = manager.brief(con, BUGUN)["decision"]["id"]
        eq(manager.brief(con, BUGUN, kaydet=False)["decision"]["id"], a)
    test("gecmis gunu okumak karar yazmaz (D-3)", t_gecmis_gun_okumak_yazmaz)

    def t_declined_is_kept_and_reoffered():
        """Reddedilen oneri silinmez; ayni gun yeniden onerilebilir."""
        con = _con()
        _push(con, "spi", BUGUN, sleep_hours=metric(4.0))
        ilk = manager.brief(con, BUGUN)["decision"]["id"]
        manager.respond(con, ilk, "declined")
        ikinci = manager.brief(con, BUGUN)["decision"]["id"]
        no(ilk == ikinci, "reddedilen kayit yeniden kullanildi")
        kayitlar = db.decisions_of(con, BUGUN)
        eq(len(kayitlar), 2)
        eq(kayitlar[0]["state"], "declined")
        eq(db.current_decision(con, BUGUN), None)
    test("reddedilen oneri silinmez", t_declined_is_kept_and_reoffered)

    def t_accept_then_conflict():
        con = _con()
        _push(con, "spi", BUGUN, sleep_hours=metric(4.0))
        did = manager.brief(con, BUGUN)["decision"]["id"]
        eq(manager.respond(con, did, "accepted")["status"], 200)
        eq(db.current_decision(con, BUGUN)["id"], did)
        tekrar = manager.respond(con, did, "declined")
        eq(tekrar["status"], 409)
        eq(db.decision(con, did)["state"], "accepted")
    test("kabul edilen oneri sonradan degistirilmez", t_accept_then_conflict)

    def t_invalid_state():
        con = _con()
        _push(con, "spi", BUGUN, sleep_hours=metric(4.0))
        did = manager.brief(con, BUGUN)["decision"]["id"]
        eq(manager.respond(con, did, "belki")["status"], 400)
        eq(manager.respond(con, 999, "accepted")["status"], 404)
    test("ucuncu bir cevap yok", t_invalid_state)

    def t_no_finding_no_proposal():
        """Uydurulmus bir oneri, oneri olmamasindan kotudur."""
        con = _con()
        _push(con, "spi", BUGUN, sleep_hours=metric(8.0), recovery=metric(70))
        _push(con, "ays", BUGUN, questions=metric(200), study_minutes=metric(200))
        b = manager.brief(con, BUGUN)
        eq(b["proposal"], None)
        eq(b["decision"], None)
        ok(any("öneri yok" in l["text"] for l in b["lines"]))
    test("bulgu yoksa oneri uydurulmaz", t_no_finding_no_proposal)

    def t_silence_is_not_judgement():
        """Veri gelmeyen modul icin hukum degil sessizlik yazilir.

        Iki sessiz modul TEK satirda toplanir: ayni 20 kelimelik cumleyi
        uc kez yazmak, bos bir gunde ekrani ayni cumlenin kopyalariyla
        doldururdu. Toplamak sessizligi yumusatmaz — ikisi de adiyla
        anilir ve hicbirine hukum yazilmaz."""
        con = _con()
        _push(con, "ays", BUGUN, questions=metric(200), study_minutes=metric(200))
        b = manager.brief(con, BUGUN)
        sessiz = [l for l in b["lines"] if l.get("silent")][0]
        eq(sessiz["verdict"], None)
        eq(sorted(sessiz["silent"]), ["bio", "intellect"])
        ok("SPİ" in sessiz["text"] and "ESP" in sessiz["text"])
        ok("Sessizlik bir ölçüm değildir" in sessiz["text"])
        # Cumle BIR KEZ gecer: toplamanin tek sebebi buydu.
        eq(sum(1 for l in b["lines"]
               if "Sessizlik bir ölçüm değildir" in l["text"]), 1)
    test("sessizlik hukum sayilmaz", t_silence_is_not_judgement)

    def t_single_silent_module_keeps_its_own_line():
        """Tek bir modul sessizse toplanacak bir sey yoktur: kendi satirinda
        ve KENDI ADIYLA anilir."""
        con = _con()
        _push(con, "ays", BUGUN, questions=metric(200), study_minutes=metric(200))
        _push(con, "spi", BUGUN, sleep_hours=metric(8.0), recovery=metric(70))
        b = manager.brief(con, BUGUN)
        esp = [l for l in b["lines"] if l.get("vp") == "intellect"][0]
        eq(esp["verdict"], None)
        ok("ESP" in esp["text"])
        no([l for l in b["lines"] if l.get("silent")])
    test("tek sessiz modul kendi satirinda kalir",
         t_single_silent_module_keeps_its_own_line)

    def t_council_shows_who_was_heard():
        """«Bunu kim soyledi, kim susturuldu» sorusunun cevabi ekranda
        olmali: hiyerarsi gorunmuyorsa, karar da denetlenemez."""
        con = _con()
        _push(con, "spi", BUGUN, sleep_hours=metric(4.0), recovery=metric(30))
        # Deneme neti birikimli degildir: gun surerken de yargilanir (O-9).
        _push(con, "ays", BUGUN, questions=metric(10), study_minutes=metric(20),
              mock_net=metric(40), mock_net_baseline=metric(80))
        b = manager.brief(con, BUGUN)
        k = b["council"]
        eq(len(k["members"]), 3)
        eq(k["heard"], "bio")                 # rank 1: SPİ'nin kirmizi bayragi
        duyulan = [m for m in k["members"] if m["heard"]]
        eq(len(duyulan), 1)
        eq(duyulan[0]["module"], "spi")
        # Susturulan VP'nin BULGUSU DURUR: sira gelmemesi, yanilmasi degildir.
        akademik = [m for m in k["members"] if m["vp"] == "academic"][0]
        eq(akademik["heard"], False)
        ok(akademik["findings"] > 0)
        ok(akademik["verdict"] == "ANOMALY")
    test("konsey kimin duyuldugunu soyler", t_council_shows_who_was_heard)

    def t_coverage_line_counts_labels():
        con = _con()
        _push(con, "ays", BUGUN, questions=metric(200),
              study_minutes=metric(90, "estimated"))
        b = manager.brief(con, BUGUN)
        kapsam = [l for l in b["lines"] if l["kind"] == "coverage"][0]
        eq(kapsam["measured"], 1)
        eq(kapsam["estimated"], 1)
        ok("dayanağın genişliğidir" in kapsam["text"])
    test("brifing neye dayandigini soyler", t_coverage_line_counts_labels)

    def t_level_line_is_an_observation():
        """Kademe brifingde GORUNUR ama bir hedef ya da uyari degildir.

        Seviye uc arayuzden isaretle geliyordu ve yalniz panonun
        *Sistemler* sayfasinda goruluyordu; gunluk brifing uc sistemin
        ozetini veriyor ama seviyeyi tasimiyordu."""
        con = _con()
        _push(con, "ays", BUGUN, questions=metric(200), study_minutes=metric(90),
              level_tier=metric(3), level_sub=metric(2), xp_total=metric(4200))
        _push(con, "esp", BUGUN, level_tier=metric(1), level_sub=metric(1),
              xp_total=metric(120))
        b = manager.brief(con, BUGUN)
        satir = [l for l in b["lines"] if l["kind"] == "level"]
        eq(len(satir), 1)
        ok("AYS 3.2" in satir[0]["text"])
        ok("ESP 1.1" in satir[0]["text"])
        # Isaret gondermeyen modul satirda HIC gecmez: "SPI —" yazmak,
        # olculmemis bir seyi olculmus gibi siralamakti.
        no("SPİ" in satir[0]["text"])
        # Kademenin ADI merkezde tutulmaz, numarasi tasinir.
        no("Altın" in satir[0]["text"])
        ok("hiçbir kararı vermez" in satir[0]["text"])
        eq(satir[0]["items"][0]["tier"], 3)
    test("seviye satiri bir gozlemdir", t_level_line_is_an_observation)

    def t_level_line_absent_when_no_signal():
        """Bos bir «Seviye: —» satiri bilgi degil gurultudur."""
        con = _con()
        _push(con, "ays", BUGUN, questions=metric(200), study_minutes=metric(90))
        b = manager.brief(con, BUGUN)
        eq(len([l for l in b["lines"] if l["kind"] == "level"]), 0)
    test("seviye isareti yoksa satir hic cizilmez",
         t_level_line_absent_when_no_signal)

    def t_calendar_rank_reaches_production():
        """Govde tasinmazsa «sabit takvim» sirasi uretimde olu kalir."""
        con = _con()
        _push(con, "ays", BUGUN, questions=metric(200), study_minutes=metric(200),
              exam_days_left=metric(3))
        b = manager.brief(con, BUGUN)
        eq(b["proposal"]["rank"], 2)
    test("sabit takvim sirasi uretimde de calisir",
         t_calendar_rank_reaches_production)

    def t_suren_gun_brifingi():
        """HATALAR O-9: bugunun 10:00'daki kismi degeri «tabanin altinda» diye
        oneri olup ambara karar olarak yaziliyordu."""
        from core import saat
        con = _con()
        bugun = saat.bugun()
        _push(con, "ays", bugun, questions=metric(20), study_minutes=metric(60))
        b = manager.brief(con, bugun)
        eq(b["proposal"], None)
        satir = [l for l in b["lines"] if l.get("vp") == "academic"][0]
        ok("gün sürüyor" in satir["text"], satir["text"])
        no("veri yok" in satir["text"], satir["text"])
        ok("(ölçüldü)" in satir["text"], satir["text"])     # AGENTS.md §1.8
        eq(con.execute("SELECT COUNT(*) FROM decisions").fetchone()[0], 0)
    test("suren gunun kismi degeri karar olmaz (O-9)", t_suren_gun_brifingi)
