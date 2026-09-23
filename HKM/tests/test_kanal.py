# -*- coding: utf-8 -*-
"""Patronlar arasi kanal — HKM'nin bir modul Patronu'na verdigi resim.

   Kanal YALNIZ OKUR: brifing gibi oneri kaydi yazmaz. Istenen modulun
   kendi verisini geri vermez (o zaten biliyor); oteki modullerin son
   denetim hukmunu ve King'in bugunku onerisini verir. Her bulgu kendi
   kesinlik etiketini tasir."""
import datetime

from core import db, kanal, manager, sync_engine
from tests.harness import eq, no, ok, suite, test

BUGUN = datetime.date.today().isoformat()


def _tohum(con):
    sync_engine.ingest(con, {"module": "spi", "date": BUGUN, "metrics": {
        "sleep_hours": {"value": 4.5, "cert": "measured"},
        "recovery": {"value": 35, "cert": "computed"}}})
    sync_engine.ingest(con, {"module": "ays", "date": BUGUN, "metrics": {
        "questions": {"value": 40, "cert": "measured"},
        "study_minutes": {"value": 300, "cert": "measured"}}})


def run():
    suite("kanal")

    def t_other_modules_only():
        con = db.connect(":memory:")
        _tohum(con)
        k = kanal.modul_icin(con, "ays", BUGUN)
        ok(k["ok"])
        no("ays" in k["moduller"])
        eq(sorted(k["moduller"].keys()), ["esp", "spi"])
        spi = k["moduller"]["spi"]
        eq(spi["verdict"], "ANOMALY")
        ok(any("Uyku 4.5" in b["text"] and b["cert"] == "measured" for b in spi["bulgular"]))
        eq(k["moduller"]["esp"]["verdict"], None)
    test("kanal oteki modullerin hukmunu etiketiyle verir", t_other_modules_only)

    def t_read_only():
        con = db.connect(":memory:")
        _tohum(con)
        kanal.modul_icin(con, "spi", BUGUN)
        eq(con.execute("SELECT COUNT(*) FROM decisions").fetchone()[0], 0)
        eq(kanal.modul_icin(con, "spi", BUGUN)["king"], None)
        manager.brief(con, BUGUN)            # King'in onerisi burada dogar
        king = kanal.modul_icin(con, "spi", BUGUN)["king"]
        ok(king and king["text"] and king["state"] == "proposed")
    test("kanal yalniz okur; King'in onerisi brifingten gelir", t_read_only)

    def t_bad_module():
        con = db.connect(":memory:")
        no(kanal.modul_icin(con, "king", BUGUN)["ok"])
        no(kanal.modul_icin(con, "ays", "bozuk")["ok"])
    test("bilinmeyen modul ve bozuk tarih reddedilir", t_bad_module)
