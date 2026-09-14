# -*- coding: utf-8 -*-
"""Ritim — giden kutusu, zamanlama ve haftalik rapor.

Bu paket iki seyi birden korur: bir mesaj SESSIZCE KAYBOLMAZ, ve tekrar
denemek TEKRAR GONDERMEK olmaz.
"""

import datetime

from core import db, outbox, schedule, sync_engine, weekly
from tests.harness import eq, metric, no, ok, suite, test

BASE = datetime.date(2026, 9, 1)
CFG = {"channels": {"whatsapp": {"enabled": True, "phone_number_id": "1",
                                 "token": "T", "allow_from": ["905"]}},
       "schedule": {"enabled": True, "channel": "whatsapp", "morning": "08:00"}}


def gun(i):
    return (BASE + datetime.timedelta(days=i)).isoformat()


def _con():
    return db.connect(":memory:")


def _an(i, saat, dakika=0):
    t = BASE + datetime.timedelta(days=i)
    return datetime.datetime(t.year, t.month, t.day, saat, dakika)


def _basarili(*a):
    return 200, "{}"


def _agyok(*a):
    return 0, "URLError"


def run():
    suite("giden kutusu")

    def t_same_identity_written_once():
        """Ayni kimlikle (kanal, tur, gun) ikinci satir yazilmaz."""
        con = _con()
        a = outbox.enqueue(con, "whatsapp", "daily", gun(0), "birinci")
        b = outbox.enqueue(con, "whatsapp", "daily", gun(0), "ikinci")
        ok(b["duplicate"])
        eq(a["row"]["id"], b["row"]["id"])
        eq(b["row"]["text"], "birinci")
    test("ayni kimlik iki kez kuyruga girmez", t_same_identity_written_once)

    def t_failure_is_retried_with_backoff():
        """Basarisiz gonderimi yutmak, sessizce kaybolan bir mesajdir."""
        con = _con()
        outbox.enqueue(con, "whatsapp", "daily", gun(0), "metin", target="905",
                       now=_an(0, 9))
        r = outbox.flush(con, CFG, now=_an(0, 9), transport=_agyok)
        eq(r["failed"], 1)
        # Hemen tekrar denenmez: geri cekilme suresi bekler.
        eq(outbox.due(con, _an(0, 9)), [])
        ok(outbox.due(con, _an(0, 9, 2)))
        r2 = outbox.flush(con, CFG, now=_an(0, 9, 2), transport=_basarili)
        eq(r2["sent"], 1)
        eq(outbox.status(con)["counts"].get("sent"), 1)
    test("basarisiz gonderim geri cekilerek tekrarlanir",
         t_failure_is_retried_with_backoff)

    def t_gives_up_eventually():
        """Sonsuz yeniden deneme, bir hatayi gizlemenin yavas bicimidir."""
        con = _con()
        outbox.enqueue(con, "whatsapp", "daily", gun(0), "metin", target="905",
                       now=_an(0, 9))
        for saat in range(9, 20):
            outbox.flush(con, CFG, now=_an(0, saat), transport=_agyok)
        durum = outbox.status(con)
        eq(durum["counts"].get("given_up"), 1)
        ok(durum["recent"][0]["last_error"])
    test("vazgecilir ve sebebi yazilir", t_gives_up_eventually)

    def t_permanent_error_not_retried():
        """401 agdan degil YAPILANDIRMADAN gelir; beklemenin faydasi yok."""
        con = _con()
        outbox.enqueue(con, "whatsapp", "daily", gun(0), "metin", target="905",
                       now=_an(0, 9))
        r = outbox.flush(con, CFG, now=_an(0, 9), transport=lambda *a: (401, "{}"))
        eq(r["given_up"], 1)
        eq(r["failed"], 0)
    test("kalici hata tekrarlanmaz", t_permanent_error_not_retried)

    def t_closed_channel_waits():
        con = _con()
        outbox.enqueue(con, "whatsapp", "daily", gun(0), "metin", now=_an(0, 9))
        r = outbox.flush(con, {}, now=_an(0, 9), transport=_basarili)
        eq(r["skipped"], 1)
        eq(outbox.status(con)["counts"].get("queued"), 1)
    test("kanal kapaliyken satir bekler", t_closed_channel_waits)

    suite("ritim")

    def t_disabled_by_default():
        eq(schedule.due({}, _an(0, 8)), [])
        eq(schedule.settings({})["enabled"], False)
    test("zamanlama varsayilan kapali", t_disabled_by_default)

    def t_runs_in_window_only():
        """Gunu gecmis bir hatirlatma, hatirlatma degil gurultudur."""
        isler = schedule.due(CFG, _an(0, 8, 5))
        eq([i["kind"] for i in isler], ["daily"])
        eq(schedule.due(CFG, _an(0, 7, 30)), [])       # vakti gelmedi
        eq(schedule.due(CFG, _an(0, 23)), [])          # penceresi gecti
    test("is yalniz penceresinde calisir", t_runs_in_window_only)

    def t_weekly_needs_day_name():
        cfg = {"schedule": {"enabled": True, "weekly_day": "pazartesi",
                            "weekly_time": "09:00", "morning": ""}}
        pazartesi = datetime.datetime(2026, 9, 7, 9, 10)   # pazartesi
        sali = datetime.datetime(2026, 9, 8, 9, 10)
        eq([i["kind"] for i in schedule.due(cfg, pazartesi)], ["weekly"])
        eq(schedule.due(cfg, sali), [])
    test("haftalik is yalniz o gun calisir", t_weekly_needs_day_name)

    def t_tick_is_idempotent_within_day():
        """Daemon dakikada bir tikliyor; gunde tek mesaj kurali kirilmamali."""
        con = _con()
        sync_engine.ingest(con, {"module": "spi", "date": gun(0),
                                 "metrics": {"sleep_hours": metric(4.0)}},
                           now=gun(0) + "T07:00:00")
        for dakika in (0, 1, 2, 30):
            schedule.tick(con, CFG, now=_an(0, 8, dakika), transport=_basarili)
        satirlar = [dict(r) for r in con.execute("SELECT * FROM outbox")]
        eq(len(satirlar), 1)
        eq(satirlar[0]["kind"], "daily")
        eq(satirlar[0]["state"], "sent")
    test("tik gun icinde tek mesaj birakir", t_tick_is_idempotent_within_day)

    def t_tick_never_raises():
        """Bir zamanlayici hatasi daemon'u durduramaz."""
        con = _con()
        bozuk = {"schedule": {"enabled": True, "morning": "08:00",
                              "channel": "yok"}}
        r = schedule.tick(con, bozuk, now=_an(0, 8, 5), transport=_basarili)
        ok(isinstance(r, dict))
    test("tik firlatmaz", t_tick_never_raises)

    suite("haftalik")

    def t_week_is_coverage_first():
        """Eksik gunleri saymadan verilen bir ortalama, olculmeyen gunleri
        sifir saymaktir."""
        con = _con()
        for i in range(14):
            sync_engine.ingest(con, {"module": "spi", "date": gun(i),
                                     "metrics": {"sleep_hours": metric(
                                         6.0 if i < 7 else 8.0)}},
                               now=gun(i) + "T09:00:00")
        r = weekly.report(con, gun(13))
        eq(r["days_seen"]["spi"], 7)
        satir = [s for s in r["rows"] if s["metric"] == "sleep_hours"][0]
        eq(satir["status"], "compared")
        eq(satir["median"], 8.0)
        eq(satir["previous"], 6.0)
        ok("kapsam" in r["note"])
    test("hafta once kapsami soyler", t_week_is_coverage_first)

    def t_single_week_is_not_a_curve():
        con = _con()
        for i in range(7, 14):
            sync_engine.ingest(con, {"module": "spi", "date": gun(i),
                                     "metrics": {"sleep_hours": metric(7.0)}},
                               now=gun(i) + "T09:00:00")
        satir = [s for s in weekly.report(con, gun(13))["rows"]
                 if s["metric"] == "sleep_hours"][0]
        eq(satir["status"], "alone")
        ok("karşılaştırma yok" in satir["note"])
    test("tek hafta bir egri degildir", t_single_week_is_not_a_curve)

    def t_thin_week_has_no_median():
        con = _con()
        for i in (11, 12):
            sync_engine.ingest(con, {"module": "spi", "date": gun(i),
                                     "metrics": {"sleep_hours": metric(7.0)}},
                               now=gun(i) + "T09:00:00")
        satir = [s for s in weekly.report(con, gun(13))["rows"]
                 if s["metric"] == "sleep_hours"][0]
        eq(satir["status"], "missing")
    test("az gunde haftalik ortanca verilmez", t_thin_week_has_no_median)

    def t_weekly_message_is_advisory():
        from core import manager
        con = _con()
        for i in range(14):
            sync_engine.ingest(con, {"module": "ays", "date": gun(i),
                                     "metrics": {"questions": metric(50 + i)}},
                               now=gun(i) + "T09:00:00")
        metin = weekly.message(con, gun(13))
        no(manager.imperatives(metin))
        ok("Kayıtlı gün" in metin)
    test("haftalik mesaj emir kipi tasimaz", t_weekly_message_is_advisory)

    run_cli()


def run_cli():
    """CLI — terminalden HKM. Daemon KAPALIYKEN de calismali."""
    import os
    import tempfile

    import hkm as cli
    suite("cli")

    # Test GERCEK ambara yazmamali: «sor» komutu konusma kaydi birakir ve
    # bir test kosumu kullanicinin verisini degistirdigi an test olmaktan
    # cikar. Yapilandirma gecici bir veritabanina cevrilir.
    gecici = os.path.join(tempfile.mkdtemp(prefix="hkm-cli-"), "hkm.db")
    eski_yukle = cli.load_config
    cli.load_config = lambda: {"db_path": gecici, "local_token": "test"}

    def t_help_and_unknown():
        eq(cli.main([]), 0)
        eq(cli.main(["uydurma-komut"]), 1)
    test("yardim ve bilinmeyen komut", t_help_and_unknown)

    def t_commands_run_without_daemon():
        """Bir bakis icin servisin ayakta olmasini sart kosmak, ayakta
        olmadigi anda hicbir sey soyleyememektir."""
        for ad in ("durum", "hafta", "capraz", "etki", "kararlar", "kutu",
                   "niyetler"):
            eq(cli.main([ad]), 0, ad)
    test("komutlar daemon olmadan calisir", t_commands_run_without_daemon)

    def t_sor_needs_text():
        eq(cli.main(["sor"]), 1)
        eq(cli.main(["sor", "yardim"]), 0)
    test("«sor» metin ister", t_sor_needs_text)

    def t_cli_wrote_only_to_temp():
        """Yazan komut GECICI ambara yazdi mi?"""
        con = db.connect(gecici)
        say = con.execute("SELECT COUNT(*) FROM conversations").fetchone()[0]
        con.close()
        ok(say >= 1, "cli yazmadi ya da baska yere yazdi")
    test("cli yalniz kendi ambarina yazar", t_cli_wrote_only_to_temp)

    cli.load_config = eski_yukle
