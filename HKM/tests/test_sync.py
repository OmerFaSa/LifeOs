"""Sync ve sema testleri — etiketsiz sayi ambara girmemeli."""

from core import db, sync_engine, thresholds
from tests.harness import eq, metric, missing, no, ok, suite, test

TH = thresholds.DEFAULTS


def body(**metrics):
    return {"module": "spi", "date": "2026-09-12", "metrics": metrics}


def run():
    suite("sync-dogrulama")

    def t_unlabeled_rejected():
        ok_, errs = sync_engine.validate(body(sleep_hours=7.5))
        no(ok_, "etiketsiz sayi kabul edildi")
        ok(any("kesinlik" in e for e in errs))
    test("etiketsiz metrik 422 ile reddedilir", t_unlabeled_rejected)

    def t_bad_label():
        ok_, errs = sync_engine.validate(body(sleep_hours={"value": 7, "cert": "sanirim"}))
        no(ok_)
    test("gecersiz etiket reddedilir", t_bad_label)

    def t_missing_ok():
        ok_, errs = sync_engine.validate(body(sleep_hours=missing()))
        ok(ok_, errs)
    test("veri yok etiketi gecerli bir cevaptir", t_missing_ok)

    def t_bad_date():
        ok_, _ = sync_engine.validate({"module": "spi", "date": "12.09.2026",
                                       "metrics": {"sleep_hours": metric(7)}})
        no(ok_)
    test("ISO olmayan tarih reddedilir", t_bad_date)

    def t_unknown_module():
        ok_, _ = sync_engine.validate({"module": "xyz", "date": "2026-09-12",
                                       "metrics": {"a": metric(1)}})
        no(ok_)
    test("bilinmeyen modul reddedilir", t_unknown_module)

    def t_no_rewrite():
        # Dogrulama veriyi degistirmez: gonderilen govde aynen kalir.
        b = body(sleep_hours={"value": 7, "cert": "sanirim"})
        before = repr(b)
        sync_engine.validate(b)
        eq(repr(b), before, "dogrulama govdeyi yeniden yazdi")
    test("dogrulama isaretler, yeniden yazmaz", t_no_rewrite)

    suite("sync-ambar")

    def t_reject_writes_nothing():
        con = db.connect(":memory:")
        res = sync_engine.ingest(con, body(sleep_hours=7.5), "now", TH)
        eq(res["status"], 422)
        eq(con.execute("SELECT COUNT(*) c FROM raw_events").fetchone()["c"], 0)
    test("reddedilen istek ambara hicbir sey yazmaz", t_reject_writes_nothing)

    def t_accept_writes_audit():
        con = db.connect(":memory:")
        res = sync_engine.ingest(con, body(sleep_hours=metric(4.0)), "now", TH)
        eq(res["status"], 202)
        eq(res["audit"]["verdict"], "ANOMALY")
        eq(con.execute("SELECT COUNT(*) c FROM audits").fetchone()["c"], 1)
    test("kabul edilen istek denetim uretir", t_accept_writes_audit)

    def t_token():
        ok(sync_engine.check_token("abc", "abc"))
        no(sync_engine.check_token("abc", "abd"))
        no(sync_engine.check_token("abc", ""), "bos token her seyi kabul etti")
        no(sync_engine.check_token(None, "abc"))
    test("bearer karsilastirmasi", t_token)

    suite("sema")

    def t_multiple_decisions_per_day():
        # date UNIQUE kalkti: ayni gun reddedilmis oneri + yeni oneri.
        con = db.connect(":memory:")
        d1 = db.insert_decision(con, "2026-09-12", 1, "ilk oneri", "now")
        db.set_decision_state(con, d1, "declined")
        d2 = db.insert_decision(con, "2026-09-12", 3, "ikinci oneri", "now")
        db.set_decision_state(con, d2, "accepted")
        eq(db.current_decision(con, "2026-09-12")["proposal"], "ikinci oneri")
    test("bir gunde birden cok oneri durabilir", t_multiple_decisions_per_day)

    def t_declined_is_not_current():
        con = db.connect(":memory:")
        d = db.insert_decision(con, "2026-09-13", 1, "oneri", "now")
        db.set_decision_state(con, d, "declined")
        eq(db.current_decision(con, "2026-09-13"), None)
    test("reddedilmis oneri gunun karari degildir", t_declined_is_not_current)

    def t_sources_kept():
        con = db.connect(":memory:")
        res = sync_engine.ingest(con, body(sleep_hours=metric(4.0)), "now", TH)
        d = db.insert_decision(con, "2026-09-12", 1, "oneri", "now", [res["audit_id"]])
        src = db.sources_of(con, d)
        eq(len(src), 1)
        eq(src[0]["vp"], "bio")
    test("karar tasidigi denetimin izini birakir", t_sources_kept)

    def t_latest_audits():
        con = db.connect(":memory:")
        sync_engine.ingest(con, body(sleep_hours=metric(4.0)), "now", TH)
        sync_engine.ingest(con, {"module": "esp", "date": "2026-09-12",
                                 "metrics": {"practice_minutes": metric(5)}}, "now", TH)
        a = sync_engine.latest_audits(con, "2026-09-12")
        eq(sorted(a), ["bio", "intellect"])
    test("gunun denetimleri VP basina toplanir", t_latest_audits)

    run_sozlesme()


def run_sozlesme():
    """B08 — etiket tek basina yeterli degil.

    «Ölçüldü» etiketli bir `true`, bir NaN ya da -200 saatlik uyku, etiketi
    dogru olsa da OLCUM DEGILDIR: ambara girdigi an ikizi, capraz bulguyu,
    seriyi ve etkiyi sessizce zehirler.
    """
    from core import intents
    suite("sozlesme")

    def govde(deger, metrik="sleep_hours", mod="spi"):
        import datetime
        return {"module": mod, "date": datetime.date.today().isoformat(),
                "metrics": {metrik: {"value": deger, "cert": "measured"}}}

    def t_bool_is_not_a_number():
        """Python'da bool bir int'tir: True, sayi denetiminden GECER."""
        ok_, hata = sync_engine.validate(govde(True))
        no(ok_)
        ok(any("sonlu bir sayi" in h for h in hata))
    test("boolean sayi sayilmaz", t_bool_is_not_a_number)

    def t_non_finite_refused():
        for v in (float("nan"), float("inf"), float("-inf")):
            no(sync_engine.validate(govde(v))[0], repr(v))
    test("NaN ve sonsuz reddedilir", t_non_finite_refused)

    def t_range_checked():
        no(sync_engine.validate(govde(-200))[0])
        no(sync_engine.validate(govde(99))[0])
        ok(sync_engine.validate(govde(7.5))[0])
    test("bilinen metrik araligi denetlenir", t_range_checked)

    def t_unknown_metric_still_needs_a_number():
        """Bilinmeyen metrik kabul edilir (isaret genisleyebilmeli) ama
        SONLU bir sayi olmak zorundadir."""
        ok(sync_engine.validate(govde(42, "uydurma_olcu"))[0])
        no(sync_engine.validate(govde(float("nan"), "uydurma_olcu"))[0])
    test("bilinmeyen metrik de sayi ister",
         t_unknown_metric_still_needs_a_number)

    def t_dotted_metric_uses_last_part():
        ok(sync_engine.validate(govde(45, "disc.lang.minutes", "esp"))[0])
        no(sync_engine.validate(govde(5000, "disc.lang.minutes", "esp"))[0])
    test("noktali metrik adi son parcasiyla eslesir",
         t_dotted_metric_uses_last_part)

    def t_future_date_refused():
        """Bir olcum, henuz yasanmamis bir gune ait olamaz."""
        import datetime
        yarin_otesi = (datetime.date.today()
                       + datetime.timedelta(days=5)).isoformat()
        g = govde(7.5)
        g["date"] = yarin_otesi
        no(sync_engine.validate(g)[0])
    test("gelecek tarihli olcum reddedilir", t_future_date_refused)

    def t_missing_with_value_refused():
        import datetime
        g = {"module": "spi", "date": datetime.date.today().isoformat(),
             "metrics": {"sleep_hours": {"value": 7, "cert": "missing"}}}
        no(sync_engine.validate(g)[0])
    test("«veri yok» etiketiyle deger gonderilemez", t_missing_with_value_refused)

    def t_intent_fields_are_checked():
        """date:'banana', minutes:-90 kuyruga GIRMEMELI."""
        ok_, hata = intents.validate("ays", "plan.add",
                                     {"date": "banana", "minutes": -90})
        no(ok_)
        ok(any("takvim" in h or "ISO" in h for h in hata))
        ok(any("minutes" in h for h in hata))
        ok(intents.validate("ays", "plan.add",
                            {"date": "2026-09-15", "minutes": 120,
                             "subject": "mat"})[0])
    test("niyet alanlari tur ve aralik denetlenir", t_intent_fields_are_checked)
