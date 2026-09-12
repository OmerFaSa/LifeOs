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
