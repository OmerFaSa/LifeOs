# -*- coding: utf-8 -*-
"""Etki — HKM'nin kendi faydasini olcmesi, ve olcerken susmasi gerekenler.

Bu paket ozellikle su uc seyi korur: neden-sonuc dili cikmaz, secilim
yanliligi uyarisi her ciktida durur, ve esigin altinda «etkisiz» denmez.
"""

import datetime

from core import db, impact, sync_engine
from tests.harness import eq, metric, no, ok, suite, test

BASE = datetime.date(2026, 8, 1)


def gun(i):
    return (BASE + datetime.timedelta(days=i)).isoformat()


def _con():
    return db.connect(":memory:")


def _seri(con, modul, metrik, degerler, cert="measured"):
    for i, v in enumerate(degerler):
        if v is None:
            continue
        sync_engine.ingest(con, {"module": modul, "date": gun(i),
                                 "metrics": {metrik: {"value": v, "cert": cert}}},
                           now=gun(i) + "T09:00:00")


def _karar(con, i, key, durum="accepted"):
    did = db.insert_decision(con, gun(i), 1, "Öneri cümlesi.", gun(i) + "T10:00:00",
                             key=key)
    db.set_decision_state(con, did, durum, gun(i) + "T20:00:00")
    return db.decision(con, did)


def run():
    suite("etki")

    def t_no_verdict_without_windows():
        """Az veri «etkisiz» demek DEGILDIR."""
        con = _con()
        _seri(con, "spi", "sleep_hours", [7.0, 7.0])
        r = impact.one(con, _karar(con, 5, "bio_red"))
        eq(r["status"], "missing")
        ok("DEĞİLDİR" in r["note"])
    test("pencere dolmadan hukum kurulmaz", t_no_verdict_without_windows)

    def t_unknown_key_is_unmeasurable():
        """Yonu bilinmeyen bir olcude etki hesaplanmaz."""
        con = _con()
        r = impact.one(con, _karar(con, 5, None))
        eq(r["status"], "unmeasurable")
        r2 = impact.one(con, _karar(con, 6, "uydurma_kural"))
        eq(r2["status"], "unmeasurable")
    test("yonu tanimsiz oneri olculmez", t_unknown_key_is_unmeasurable)

    def t_improvement_direction_respected():
        """«Iyilesme» yonu olcuye gore degisir: sentez acigi DUSMELI."""
        con = _con()
        # Sentez acigi 20 gunden 5 gune dustu: bu bir IYILESMEDIR.
        _seri(con, "esp", "synthesis_gap_days", [20] * 10 + [5] * 10)
        r = impact.one(con, _karar(con, 9, "new_content"))
        eq(r["direction"], "lower_better")
        eq(r["status"], "improved")

        con2 = _con()
        # Ayni hareket «soru sayisi»nda olsaydi KOTULESME olurdu.
        _seri(con2, "ays", "questions", [20] * 10 + [5] * 10)
        r2 = impact.one(con2, _karar(con2, 9, "academic_goal"))
        eq(r2["status"], "worsened")
    test("iyilesme yonu olcuye gore okunur", t_improvement_direction_respected)

    def t_gun_ici_gonderimler_tek_olcum():
        """HATALAR Y-3: isaret gunde birkac kez gonderir (birikimli ara
        degerler). Onbelleksiz yol her gonderimi ayri olcum sayiyordu; onbellekli
        yol gunun SON degerini aliyordu. Iki yol ayni sonucu verir: gun basina
        tek olcum."""
        con = _con()
        for i, degerler in ((3, (20, 40, 90)), (12, (10, 30, 60))):
            for j, v in enumerate(degerler):
                sync_engine.ingest(con, {"module": "ays", "date": gun(i),
                                         "metrics": {"questions": metric(v)}},
                                   now=gun(i) + "T%02d:00:00" % (9 + j))
        k = _karar(con, 9, "academic_goal")
        a, b = impact.one(con, k), impact.one(con, k, impact.build_cache(con))
        eq((a["status"], a.get("n_before"), a.get("n_after")),
           (b["status"], b.get("n_before"), b.get("n_after")))
        eq(a["status"], "missing")
    test("gun ici gonderimler tek olcum sayilir (Y-3)", t_gun_ici_gonderimler_tek_olcum)

    def t_small_change_is_flat():
        con = _con()
        _seri(con, "spi", "sleep_hours", [7.0] * 10 + [7.2] * 10)
        r = impact.one(con, _karar(con, 9, "bio_red"))
        eq(r["status"], "flat")
    test("kucuk hareket etki sayilmaz", t_small_change_is_flat)

    def t_no_causal_language():
        """«Ise yaradi» cumlesi buradan CIKMAZ."""
        con = _con()
        _seri(con, "spi", "sleep_hours", [5.0] * 10 + [8.0] * 10)
        r = impact.one(con, _karar(con, 9, "bio_red"))
        metin = r["note"].lower()
        for kelime in ("ise yaradi", "işe yaradı", "sayesinde", "cunku", "çünkü",
                       "neden oldu"):
            no(kelime in metin, "neden-sonuc dili sizdi: " + r["note"])
        ok("neden-sonuç değil" in r["note"])
    test("neden-sonuc kurulmaz", t_no_causal_language)

    def t_caveat_always_present():
        """Secilim yanliligi uyarisi KALDIRILAMAZ: kaldirilirsa sayi yalan
        soyler."""
        con = _con()
        _seri(con, "spi", "sleep_hours", [5.0] * 10 + [8.0] * 10)
        for i in (9, 10, 11):
            _karar(con, i, "bio_red")
        ozet = impact.summary(con)
        ok("deney değildir" in ozet["caveat"])
        ok("deney değildir" in ozet["verdict"]["note"])
    test("secilim yanliligi her ciktida yazar", t_caveat_always_present)

    def t_declined_counted_separately():
        """Red de bir veridir ve KABULLE KARISTIRILMAZ."""
        con = _con()
        _seri(con, "spi", "sleep_hours", [5.0] * 10 + [8.0] * 10)
        _karar(con, 9, "bio_red", "accepted")
        _karar(con, 10, "bio_red", "declined")
        _karar(con, 11, "bio_red", "declined")
        g = impact.summary(con)["rules"]["bio_red"]
        eq(g["accepted"], 1)
        eq(g["declined"], 2)
        eq(g["accepted_improved"] + g["accepted_worsened"] + g["accepted_flat"], 1)
    test("kabul ve ret ayri sayilir", t_declined_counted_separately)

    def t_summary_says_not_yet_measured():
        con = _con()
        ozet = impact.summary(con)
        eq(ozet["verdict"]["cert"], "missing")
        ok("HENÜZ ÖLÇÜLMEDİ" in ozet["verdict"]["note"])
        ok("faydası yok demek değildir" in ozet["verdict"]["note"])
    test("olculmemis fayda «fayda yok» diye sunulmaz",
         t_summary_says_not_yet_measured)

    def t_schema_migration_adds_columns():
        """Sema tasimasi ACIK yazilir ve her acilista kosar: CREATE TABLE
        IF NOT EXISTS var olan bir tabloyu guncellemez."""
        con = db.connect(":memory:")
        sutunlar = [r["name"] for r in con.execute("PRAGMA table_info(decisions)")]
        ok("key" in sutunlar)
        ok("answered_at" in sutunlar)
        # Eski sema: sutunlari olmayan bir tablo kurup tasimayi kosturalim.
        eski = db.sqlite3.connect(":memory:")
        eski.row_factory = db.sqlite3.Row
        eski.execute("CREATE TABLE decisions (id INTEGER PRIMARY KEY, date TEXT, "
                     "rank INTEGER, proposal TEXT, state TEXT, created_at TEXT)")
        uygulanan = db._migrate(eski)
        eq(sorted(uygulanan), ["decisions.answered_at", "decisions.key"])
        # Ikinci kosum bir sey yapmaz: tasima tekrarlanabilir olmali.
        eq(db._migrate(eski), [])
        # OLMAYAN bir tablo tasimayi DURDURMAZ: burada «conversations»
        # yok ama «decisions» tasinabildi. Eksik bir tablo yuzunden butun
        # tasimanin durmasi, var olan tablolari da guncellenmemis birakir.
        ok(any(m[0] == "conversations" for m in db.MIGRATIONS))
        sutun = [r["name"] for r in con.execute(
            "PRAGMA table_info(conversations)")]
        ok("agent" in sutun)
    test("sema tasimasi eski veritabanini gunceller",
         t_schema_migration_adds_columns)
