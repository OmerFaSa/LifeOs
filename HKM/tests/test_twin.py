# -*- coding: utf-8 -*-
"""Dijital ikiz — gormedigini «gordum» demez."""

from core import db, sync_engine, twin
from tests.harness import eq, metric, missing, no, ok, suite, test


def _con():
    return db.connect(":memory:")


def gun_(i):
    import datetime
    return (datetime.date(2026, 9, 1) + datetime.timedelta(days=i)).isoformat()


def cross_series(con):
    return twin.series(con, gun_(9), 14)


def _push(con, module, date, **metrics):
    body = {"module": module, "date": date, "metrics": metrics}
    return sync_engine.ingest(con, body, now=date + "T09:00:00")


def run():
    suite("ikiz")

    def t_empty_is_not_zero():
        """Hicbir veri yokken ikiz sifir uretmez, «gormedim» der."""
        s = twin.snapshot(_con(), "2026-09-13")
        eq(s["coverage"]["total"], 0)
        eq(s["coverage"]["measured_ratio"], None)
        kinds = set(b["kind"] for b in s["blind"])
        eq(kinds, {"never_seen"})
    test("bos ambar sifir degil korluk uretir", t_empty_is_not_zero)

    def t_gun_ici_gonderim_tek_nokta():
        """HATALAR O-1: ayni gunun 4 gonderimi 4 nokta, %400 kapsama ve sahte
        egilim uretiyordu. Gun basina tek nokta: gunun SON degeri."""
        from core import twin
        con = db.connect(":memory:")
        for j, v in enumerate((10, 30, 50, 90)):
            sync_engine.ingest(con, {"module": "ays", "date": "2026-09-20",
                                     "metrics": {"questions": metric(v)}},
                               now="2026-09-20T%02d:00:00" % (9 + j))
        q = twin.snapshot(con, "2026-09-20", 1)["modules"]["ays"]["metrics"]["questions"]
        eq((q["value"], q["points"], q["coverage"]), (90, 1, 1.0))
    test("gun ici gonderimler tek nokta (O-1)", t_gun_ici_gonderim_tek_nokta)

    def t_missing_label_separate():
        """Gonderilip bos gelen alan ile hic gelmeyen alan AYNI SEY DEGIL."""
        con = _con()
        _push(con, "ays", "2026-09-13", questions=metric(120),
              study_minutes=missing())
        s = twin.snapshot(con, "2026-09-13")
        m = s["modules"]["ays"]["metrics"]
        eq(m["questions"]["value"], 120)
        eq(m["study_minutes"]["value"], None)
        eq(m["study_minutes"]["cert"], "missing")
        eksik = [b for b in s["blind"] if b["kind"] == "missing"]
        eq([b["metric"] for b in eksik], ["study_minutes"])
        hic = [b for b in s["blind"] if b["kind"] == "never_seen"]
        eq(sorted(b["module"] for b in hic), ["esp", "spi"])
    test("bos gelen alan ile hic gelmeyen alan ayri", t_missing_label_separate)

    def t_trend_needs_points():
        """Iki noktadan yon cikarmak gurultuyu bulgu diye sunmaktir."""
        con = _con()
        _push(con, "ays", "2026-09-12", questions=metric(100))
        _push(con, "ays", "2026-09-13", questions=metric(40))
        t = twin.snapshot(con, "2026-09-13")["modules"]["ays"]["metrics"]["questions"]
        eq(t["trend"]["direction"], "unknown")
        ok("en az" in t["trend"]["note"])
    test("yon icin taban nokta sayisi aranir", t_trend_needs_points)

    def t_trend_direction():
        con = _con()
        for d, q in (("2026-09-10", 100), ("2026-09-11", 100),
                     ("2026-09-12", 40), ("2026-09-13", 40)):
            _push(con, "ays", d, questions=metric(q))
        t = twin.snapshot(con, "2026-09-13")["modules"]["ays"]["metrics"]["questions"]
        eq(t["trend"]["direction"], "falling")
        eq(t["points"], 4)
    test("yeterli noktada yon soylenir", t_trend_direction)

    def t_flat_band():
        """Kucuk oynama «dusus» degildir; banda girmeyen fark yerinde sayar."""
        con = _con()
        for d, q in (("2026-09-10", 100), ("2026-09-11", 102),
                     ("2026-09-12", 98), ("2026-09-13", 101)):
            _push(con, "ays", d, questions=metric(q))
        t = twin.snapshot(con, "2026-09-13")["modules"]["ays"]["metrics"]["questions"]
        eq(t["trend"]["direction"], "flat")
    test("gurultu dusus sayilmaz", t_flat_band)

    def t_latest_wins_but_history_kept():
        """Ayni gun iki govde: sonuncusu gecerli, birincisi ambarda kalir."""
        con = _con()
        _push(con, "spi", "2026-09-13", sleep_hours=metric(5.0))
        _push(con, "spi", "2026-09-13", sleep_hours=metric(8.0))
        s = twin.snapshot(con, "2026-09-13")
        eq(s["modules"]["spi"]["metrics"]["sleep_hours"]["value"], 8.0)
        eq(s["modules"]["spi"]["events"], 2)
        eq(len(db.events_between(con, "2026-09-13", "2026-09-13")), 2)
    test("son govde gecerli, oncekiler silinmez", t_latest_wins_but_history_kept)

    def t_coverage_counts_labels():
        con = _con()
        _push(con, "ays", "2026-09-13", questions=metric(120),
              study_minutes=metric(90, "estimated"))
        _push(con, "spi", "2026-09-13", sleep_hours=metric(7.5, "computed"),
              recovery=missing())
        c = twin.snapshot(con, "2026-09-13")["coverage"]
        eq(c["total"], 4)
        eq(c["measured"], 1)
        eq(c["estimated"], 1)
        eq(c["computed"], 1)
        eq(c["missing"], 1)
        eq(c["measured_ratio"], 0.25)
    test("kapsama etiket etiket sayilir", t_coverage_counts_labels)

    def t_window_respected():
        """Pencere disindaki gun resme girmez — ama ambardan silinmez."""
        con = _con()
        _push(con, "ays", "2026-08-01", questions=metric(500))
        _push(con, "ays", "2026-09-13", questions=metric(10))
        s = twin.snapshot(con, "2026-09-13", days=7)
        eq(s["modules"]["ays"]["metrics"]["questions"]["points"], 1)
        eq(len(db.events_between(con, "2026-01-01", "2026-12-31")), 2)
    test("pencere disi gun resme girmez", t_window_respected)

    def t_silent_days():
        con = _con()
        _push(con, "esp", "2026-09-13", practice_minutes=metric(45))
        m = twin.snapshot(con, "2026-09-13", days=7)["modules"]["esp"]
        eq(m["days_seen"], 1)
        eq(m["silent_days"], 6)
    test("sessiz gunler sayilir", t_silent_days)

    def t_series_reads_raw_not_summary():
        """Seri TURETILMEZ, ham olaylardan okunur — ve ayni gunun ikinci
        govdesi birincisini gecersiz kilar."""
        con = _con()
        for i, q in ((0, 100), (1, 80), (2, 60)):
            _push(con, "ays", gun_(i), questions=metric(q))
        _push(con, "ays", gun_(2), questions=metric(65))     # ayni gun duzeltme
        s = cross_series(con)
        kayit = s["ays/questions"]
        eq(kayit["n"], 3)
        eq(kayit["points"][-1][1], 65)
        eq(kayit["min"], 65)
        eq(kayit["max"], 100)
        eq(kayit["certs"], ["measured"])
    test("seri ham olaylardan okunur", t_series_reads_raw_not_summary)

    def t_series_keeps_cert_mix_visible():
        """«Olculdu» ile «hesaplandi» ayni cizgide durabilir ama ayni sey
        degildir: karisim gorunur kalir."""
        con = _con()
        _push(con, "spi", gun_(0), sleep_hours=metric(7.0))
        _push(con, "spi", gun_(1), sleep_hours=metric(7.5, "estimated"))
        _push(con, "spi", gun_(2), sleep_hours=metric(8.0))
        kayit = cross_series(con)["spi/sleep_hours"]
        eq(kayit["certs"], ["estimated", "measured"])
    test("seride kesinlik karisimi gorunur", t_series_keeps_cert_mix_visible)

    def t_series_module_filter():
        con = _con()
        _push(con, "ays", gun_(0), questions=metric(100))
        _push(con, "spi", gun_(0), sleep_hours=metric(7.0))
        yalniz = twin.series(con, gun_(2), 14, "ays")
        eq(sorted(yalniz.keys()), ["ays/questions"])
    test("seri modul suzgeci calisir", t_series_module_filter)

    def t_unlabeled_never_enters():
        """Etiketsiz alan ambara zaten giremez; ikize de girmez."""
        con = _con()
        res = sync_engine.ingest(con, {"module": "ays", "date": "2026-09-13",
                                       "metrics": {"questions": 120}})
        eq(res["status"], 422)
        s = twin.snapshot(con, "2026-09-13")
        eq(s["coverage"]["total"], 0)
        no(s["modules"]["ays"]["events"])
    test("etiketsiz sayi ikize sizmaz", t_unlabeled_never_enters)
