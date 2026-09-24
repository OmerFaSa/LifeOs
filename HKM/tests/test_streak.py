# -*- coding: utf-8 -*-
"""Seri — art arda gelen gunler, ve olculmeyen gunun ne OLMADIGI.

Bu paket ozellikle su cumleyi korur: olculmeyen bir gun «iyiydi» demek
degildir. Atlanan gunu iyi saymak, olcmeyerek iyilesmek olurdu.
"""

import datetime

from core import db, manager, patron, streak, sync_engine, thresholds
from tests.harness import eq, metric, no, ok, suite, test

BASE = datetime.date(2026, 9, 1)
TH = thresholds.DEFAULTS


def gun(i):
    return (BASE + datetime.timedelta(days=i)).isoformat()


def _con():
    return db.connect(":memory:")


def _uyku(con, degerler):
    for i, v in enumerate(degerler):
        if v is None:
            continue
        sync_engine.ingest(con, {"module": "spi", "date": gun(i),
                                 "metrics": {"sleep_hours": metric(v)}},
                           now=gun(i) + "T09:00:00")


def _bul(con, i, kural="sleep-low"):
    return [s for s in streak.scan(con, gun(i), 45, TH) if s["id"] == kural][0]


def run():
    suite("seri")

    def t_two_days_is_not_a_streak():
        """Iki gun bir egilim degil, bir rastlantidir."""
        con = _con()
        _uyku(con, [8, 4, 4, 8])
        eq(_bul(con, 3)["status"], "clean")
    test("iki gun seri sayilmaz", t_two_days_is_not_a_streak)

    def t_three_days_runs():
        con = _con()
        _uyku(con, [8, 4, 4, 4])
        s = _bul(con, 3)
        eq(s["status"], "running")
        eq(s["length"], 3)
        ok("sayımdır" in s["note"])
    test("uc gun seri olur", t_three_days_runs)

    def t_gap_does_not_count_as_good():
        """Kayit girilmemis gun «iyiydi» de demek degildir «kotuydu» da."""
        con = _con()
        _uyku(con, [4, 4, None, 4, 4])
        s = _bul(con, 4)
        eq(s["status"], "running")
        eq(s["length"], 4)           # olculen gunler sayilir
        eq(s["skipped"], 1)          # atlanan gun YAZILIR
        ok("SAYILMADI" in s["note"])
    test("olculmeyen gun seriyi bozmaz ama sayilmaz",
         t_gap_does_not_count_as_good)

    def t_long_gap_breaks():
        con = _con()
        _uyku(con, [4, 4, 4, None, None, None, 4])
        s = _bul(con, 6)
        eq(s["status"], "ended")
    test("uzun bosluk seriyi kirar", t_long_gap_breaks)

    def t_ended_streak_is_also_a_finding():
        """Yalniz devam edeni gostermek, duzelmeyi gormezden gelmektir."""
        con = _con()
        _uyku(con, [4, 4, 4, 8, 8])
        s = _bul(con, 4)
        eq(s["status"], "ended")
        eq(s["length"], 3)
        ok("bitti" in s["note"])
    test("biten seri de bir bulgudur", t_ended_streak_is_also_a_finding)

    def t_tek_gun_seri_degil():
        """HATALAR O-2: tek kirik gun ve ardindan bosluk «seri bitti» diye
        raporlaniyordu (ASGARI = 3 cignenmis). Uc gunden kisa kirik dizi seri
        degildir; biten seri de degildir."""
        con = _con()
        _uyku(con, [5, None, None, None, 8])
        s = _bul(con, 4)
        no(s["status"] == "ended", s)
    test("tek kirik gun + bosluk seri degildir (O-2)", t_tek_gun_seri_degil)

    def t_suren_gun_kirik_sayilmaz():
        """HATALAR O-9: bugunun kismi soru sayisi «kirik gun» sayiliyordu.
        Gun surerken tabanin altindaki birikimli deger seriye girmez; tabani
        gecmis deger ise kesindir ve seriyi bitirir."""
        con = _con()
        for i, v in enumerate([20, 20, 20]):
            sync_engine.ingest(con, {"module": "ays", "date": gun(i),
                                     "metrics": {"questions": metric(v)}},
                               now=gun(i) + "T10:00:00")

        def bul(i, bugun):
            return [s for s in streak.scan(con, gun(i), 45, TH, bugun=bugun)
                    if s["id"] == "questions-low"][0]
        eq(bul(2, gun(2))["status"], "clean")       # iki kapali gun + suren gun
        eq(bul(2, gun(3))["status"], "running")     # ucu de kapandi
        sync_engine.ingest(con, {"module": "ays", "date": gun(3),
                                 "metrics": {"questions": metric(90)}},
                           now=gun(3) + "T10:00:00")
        eq(bul(3, gun(3))["status"], "ended")       # 90 >= 80: geri dusmez
        # Birikimli olmayan olcu (uyku) bugun de sayilir.
        con2 = _con()
        _uyku(con2, [4, 4, 4])
        s = [x for x in streak.scan(con2, gun(2), 45, TH, bugun=gun(2))
             if x["id"] == "sleep-low"][0]
        eq(s["status"], "running")
    test("suren gunun kismi degeri kirik gun sayilmaz (O-9)",
         t_suren_gun_kirik_sayilmaz)

    def t_threshold_comes_from_user():
        """Esik verisi kullanicinindir: kodda sabit degildir."""
        con = _con()
        _uyku(con, [6.5, 6.5, 6.5])
        eq(_bul(con, 2)["status"], "running")          # taban 7.0
        gevsek = {"bio": dict(TH["bio"], sleep_hours_min=6.0)}
        s = [x for x in streak.scan(con, gun(2), 45, gevsek)
             if x["id"] == "sleep-low"][0]
        eq(s["status"], "clean")
    test("esik kullanicinin esigidir", t_threshold_comes_from_user)

    def t_clean_says_what_it_means():
        con = _con()
        s = _bul(con, 3)
        eq(s["status"], "clean")
        ok("«iyiydi» demek değildir" in s["note"])
    test("temiz cevap ne demedigini de soyler", t_clean_says_what_it_means)

    def t_brief_carries_streaks():
        con = _con()
        _uyku(con, [4, 4, 4, 4])
        b = manager.brief(con, gun(3), th=TH)
        satir = [l for l in b["lines"] if l["kind"] == "streak"]
        ok(satir)
        ok(len(satir) <= manager.SERI_SATIR)
        for l in satir:
            no(manager.imperatives(l["text"]))
    test("seri brifinge duser ve emir kipi tasimaz", t_brief_carries_streaks)

    def t_patron_answers_seri():
        con = _con()
        _uyku(con, [4, 4, 4, 4])
        r = patron.respond(con, "seri", date=gun(3), th=TH)
        eq(r["command"], "seri")
        ok("gündür sürüyor" in r["text"])
        bos = patron.respond(_con(), "kaç gündür üst üste", date=gun(3), th=TH)
        eq(bos["command"], "seri")
        ok("demek değildir" in bos["text"])
    test("Patron seriyi anlatir", t_patron_answers_seri)
