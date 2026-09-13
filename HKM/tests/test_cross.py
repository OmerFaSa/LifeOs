# -*- coding: utf-8 -*-
"""Capraz bulgu — HKM'nin var olma gerekcesi, ve onun siniri.

Bu paket ozellikle NE SOYLENMEDIGINI korur: az veriyle hukum, kucuk farkta
bulgu, ve her tur cumlede neden-sonuc.
"""

import datetime

from core import cross, db, manager, sync_engine
from tests.harness import eq, metric, no, ok, suite, test

BASE = datetime.date(2026, 7, 1)


def gun(i):
    return (BASE + datetime.timedelta(days=i)).isoformat()


def _con():
    return db.connect(":memory:")


def _push(con, module, date, **metrics):
    return sync_engine.ingest(con, {"module": module, "date": date,
                                    "metrics": metrics}, now=date + "T09:00:00")


def kurgu(con, n, uyku, soru):
    """uyku(i) ve soru(i) fonksiyonlariyla n gun uretir."""
    for i in range(n):
        u = uyku(i)
        s = soru(i)
        if u is not None:
            _push(con, "spi", gun(i), sleep_hours=metric(u))
        if s is not None:
            _push(con, "ays", gun(i), questions=metric(s))


def run():
    suite("capraz")

    def t_few_days_no_verdict():
        """Az eslesmis gun bir egilim degil bir tesaduftur."""
        con = _con()
        kurgu(con, 4, lambda i: 8.0 if i % 2 else 5.0, lambda i: 100 if i % 2 else 50)
        p = [x for x in cross.scan(con, gun(3)) if x["id"] == "sleep-vs-questions"][0]
        eq(p["status"], "missing")
        eq(p["cert"], "missing")
        ok("DEGILDIR" in p["note"])
    test("az veride hukum kurulmaz", t_few_days_no_verdict)

    def t_missing_is_not_no_relation():
        """«Veri yok» ile «iliski yok» ayri cumlelerdir."""
        con = _con()
        kurgu(con, 4, lambda i: 7.0, lambda i: 100)
        p = cross.scan(con, gun(3))[0]
        no("iliski yok" in p["note"].replace("«iliski yok»", ""))
    test("eksik veri iliskisizlik diye sunulmaz", t_missing_is_not_no_relation)

    def t_pairs_respect_lag():
        """Gecikmeli cift, ERTESI gunun degeriyle eslesir."""
        con = _con()
        # Tek gun uyku, ertesi gun soru: gecikme 1 ise eslesir.
        _push(con, "spi", gun(0), sleep_hours=metric(8.0))
        _push(con, "ays", gun(1), questions=metric(120))
        seri = cross.series(con, gun(5))
        tanim = [d for d in cross.PAIRS if d["id"] == "sleep-vs-questions"][0]
        p = cross.pair(tanim, seri)
        eq(p["n"], 1)
        # Ayni gun eslesmesi olsaydi gecikme 0 olurdu; tanim 1 diyor.
        eq(p["lag"], 1)
    test("gecikmeli cift ertesi gunle eslesir", t_pairs_respect_lag)

    def t_visible_split_reported():
        con = _con()
        kurgu(con, 30, lambda i: 8.0 if i % 2 == 0 else 5.0,
              lambda i: 150 if i % 2 == 1 else 60)
        p = [x for x in cross.scan(con, gun(29)) if x["id"] == "sleep-vs-questions"][0]
        eq(p["status"], "higher")
        eq(p["cert"], "measured")
        ok(p["high"]["n"] >= cross.ASGARI_YARI)
        ok(p["low"]["n"] >= cross.ASGARI_YARI)
    test("gorunur ayrisma raporlanir", t_visible_split_reported)

    def t_small_difference_is_not_a_finding():
        """Gurultuyu bulgu diye sunmak, olcmemekten kotudur."""
        con = _con()
        kurgu(con, 30, lambda i: 8.0 if i % 2 == 0 else 5.0,
              lambda i: 102 if i % 2 == 1 else 100)
        p = [x for x in cross.scan(con, gun(29)) if x["id"] == "sleep-vs-questions"][0]
        eq(p["status"], "flat")
        ok("gorunur bir ayrisma yok" in p["note"])
        eq(len([x for x in cross.findings(con, gun(29)) if x["id"] == p["id"]]), 0)
    test("kucuk fark bulgu sayilmaz", t_small_difference_is_not_a_finding)

    def t_two_valued_split_not_lost():
        """Iki degerli dagilimda medyan ust degere esit dusebilir: veri
        vardir, bolunme yanlistir. Bu durumda esitler ust yariya alinir."""
        con = _con()
        # 15 gun 8 saat, 14 gun 5 saat: medyan 8.0 cikar.
        kurgu(con, 29, lambda i: 8.0 if i % 2 == 0 else 5.0,
              lambda i: 150 if i % 2 == 1 else 60)
        p = [x for x in cross.scan(con, gun(28)) if x["id"] == "sleep-vs-questions"][0]
        no(p["status"] == "missing", "iki degerli dagilim kaybedildi")
    test("iki degerli dagilim kaybolmaz", t_two_valued_split_not_lost)

    def t_no_causal_language():
        """«Cunku» buradan cikmaz."""
        con = _con()
        kurgu(con, 30, lambda i: 8.0 if i % 2 == 0 else 5.0,
              lambda i: 150 if i % 2 == 1 else 60)
        for p in cross.scan(con, gun(29)):
            metin = p["note"].lower()
            for kelime in ("cunku", "çünkü", "sebebiyle", "yol acti", "neden oldu"):
                no(kelime in metin, "neden-sonuc dili sizdi: " + p["note"])
        bulgu = cross.findings(con, gun(29))
        ok(bulgu)
        ok(all("neden-sonuc degil" in b["note"] for b in bulgu))
    test("neden-sonuc kurulmaz ve bu yazilir", t_no_causal_language)

    def t_certainty_downgrades():
        """Bir taraf hesaplanmissa eslesme de «olculdu» sayilmaz."""
        con = _con()
        for i in range(30):
            _push(con, "spi", gun(i), sleep_hours=metric(8.0 if i % 2 == 0 else 5.0))
            _push(con, "ays", gun(i),
                  questions={"value": 150 if i % 2 else 60, "cert": "computed"})
        p = [x for x in cross.scan(con, gun(29)) if x["id"] == "sleep-vs-questions"][0]
        eq(p["cert"], "computed")
    test("hesaplanmis taraf kesinligi dusurur", t_certainty_downgrades)

    def t_brief_carries_cross_lines():
        """Capraz bulgu brifinge duser ama ONERI DEGILDIR."""
        con = _con()
        kurgu(con, 30, lambda i: 8.0 if i % 2 == 0 else 5.0,
              lambda i: 150 if i % 2 == 1 else 60)
        b = manager.brief(con, gun(29))
        capraz = [l for l in b["lines"] if l["kind"] == "cross"]
        ok(capraz)
        ok(len(capraz) <= manager.CAPRAZ_SATIR)
        for l in capraz:
            no(manager.imperatives(l["text"]))
            ok(l.get("question"))
        # Oneri hala oncelik sirasindan gelir, capraz bulgudan degil.
        oneri = [l for l in b["lines"] if l["kind"] == "proposal"]
        eq(len(oneri), 1)
    test("capraz bulgu brifinge duser ama oneri uretmez",
         t_brief_carries_cross_lines)
