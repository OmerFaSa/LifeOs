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

    def t_evening_checkin_asks():
        """Aksam yoklamasi bir SORUDUR: kendi saatinde gunde bir kez gider,
        emir kipi tasimaz ve o gun kaydi gelmeyen modulu adiyla soyler —
        sayi soylemez. Varsayilan kapalidir."""
        eq(schedule.settings({})["checkin"], "")
        cfg = {"channels": CFG["channels"],
               "schedule": {"enabled": True, "channel": "whatsapp", "morning": "",
                            "checkin": "21:30"}}
        eq([i["kind"] for i in schedule.due(cfg, _an(0, 21, 40))], ["checkin"])
        eq(schedule.due(cfg, _an(0, 20, 0)), [])
        con = _con()
        sync_engine.ingest(con, {"module": "spi", "date": gun(0),
                                 "metrics": {"sleep_hours": metric(7.0)}},
                           now=gun(0) + "T07:00:00")
        for dakika in (40, 41):
            schedule.tick(con, cfg, now=_an(0, 21, dakika), transport=_basarili)
        satir = [dict(r) for r in con.execute("SELECT * FROM outbox")]
        eq(len(satir), 1)
        eq(satir[0]["kind"], "checkin")
        metin = satir[0]["text"]
        ok("akşam yoklaması" in metin and "Bugün ne yaptın?" in metin)
        ok("Bugün kaydı görünmeyen: AYS, ESP." in metin)
        no("SPİ," in metin)
        eq(schedule.manager.imperatives(metin), [])
    test("aksam yoklamasi sorar, gunde bir kez", t_evening_checkin_asks)

    def t_checkin_time_is_validated():
        from core import settings
        no(settings.validate({"schedule": {"checkin": "25:00"}})[0])
        ok(settings.validate({"schedule": {"checkin": "21:30"}})[0])
    test("yoklama saati SS:DD olmali", t_checkin_time_is_validated)

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

    # Fikir 49 — «bu hafta neler kazandin»: olculmus en cok uc iyi sey.
    def _iki_hafta(con, modul, anahtar, once, sonra, gunler=range(14)):
        for i in gunler:
            sync_engine.ingest(con, {"module": modul, "date": gun(i),
                                     "metrics": {anahtar: metric(once if i < 7 else sonra)}},
                               now=gun(i) + "T09:00:00")

    def t_kazanim_yonlu_ve_esikli():
        """Yalniz YONU belli olculer; %5'in alti kazanim sayilmaz; en cok uc."""
        con = _con()
        _iki_hafta(con, "ays", "questions", 60, 90)          # +%50 iyi
        _iki_hafta(con, "esp", "cards_due", 40, 20)          # -%50 iyi (az birikmis)
        _iki_hafta(con, "esp", "practice_minutes", 30, 31)   # +%3 esik alti
        _iki_hafta(con, "ays", "study_minutes", 100, 70)     # dusus: kazanim degil
        _iki_hafta(con, "spi", "weight", 70, 80)             # yonu belirsiz: hic
        r = weekly.report(con, gun(13))
        k = r["kazanimlar"]
        eq([x["metric"] for x in k], ["questions", "cards_due", "duzen"][:len(k)])
        eq(k[0]["etiket"], "hesaplandı")
        ok("çözülen soru" in k[0]["metin"] and "+%50" in k[0]["metin"], k[0]["metin"])
        ok(len(k) <= 3)
        no(any(x["metric"] in ("weight", "study_minutes", "practice_minutes") for x in k))
    test("kazanimlar: yonlu, esikli, en cok uc", t_kazanim_yonlu_ve_esikli)

    def t_kazanim_uyku_bant():
        """Uyku «ne kadar cok o kadar iyi» degildir: yalniz 7-9 bandina
        yaklasan artis kazanimdir; 9'un ustune cikmak kazanim sayilmaz."""
        con = _con()
        _iki_hafta(con, "spi", "sleep_hours", 6.0, 7.2)
        eq([x["metric"] for x in weekly.report(con, gun(13))["kazanimlar"]
            if x["metric"] != "duzen"], ["sleep_hours"])
        con = _con()
        _iki_hafta(con, "spi", "sleep_hours", 8.5, 10.0)
        eq([x["metric"] for x in weekly.report(con, gun(13))["kazanimlar"]
            if x["metric"] != "duzen"], [])
    test("kazanim: uyku bandi", t_kazanim_uyku_bant)

    def t_kazanim_yoksa_durust():
        """Artis yoksa uydurulmaz; eksik hafta «kotu hafta» sayilmaz."""
        con = _con()
        for i in (1, 3, 9, 11):
            sync_engine.ingest(con, {"module": "ays", "date": gun(i),
                                     "metrics": {"questions": metric(50)}},
                               now=gun(i) + "T09:00:00")
        r = weekly.report(con, gun(13))
        eq(r["kazanimlar"], [])
        metin = weekly.message(con, gun(13))
        ok("ölçülmüş bir artış yok" in metin, metin)
    test("kazanim yoksa durust soylenir", t_kazanim_yoksa_durust)

    def t_kazanim_duzen_ve_mesaj():
        """Duzen de olculmus bir seydir: 7 gunun en az 5'inde kayit. Mesaj
        olcu ADINI yazar, ham anahtari degil; emir kipi tasimaz."""
        from core import manager
        con = _con()
        _iki_hafta(con, "ays", "questions", 60, 90)
        metin = weekly.message(con, gun(13))
        ok("Bu hafta neler kazandın" in metin, metin)
        ok("AYS: 7 günde 7 gün kayıt" in metin, metin)
        no("questions" in metin, metin)
        no(manager.imperatives(metin), metin)
        b = weekly.belge(con, gun(13))
        ok(any(x["baslik"] == "Neler kazandın" for x in b["bolumler"]))
    test("kazanim: duzen ve mesaj", t_kazanim_duzen_ve_mesaj)

    def t_xp_kazanim_sayilmaz():
        """XP karar vermez (AGENTS.md §1.6): haftalik kazanim XP'ye bakmaz."""
        con = _con()
        _iki_hafta(con, "ays", "xp_today", 100, 400, gunler=range(14))
        no(any(x["metric"].startswith(("xp_", "level_", "badge_"))
               for x in weekly.report(con, gun(13))["kazanimlar"]))
    test("kazanim XP'ye bakmaz", t_xp_kazanim_sayilmaz)

    # Y6 — haftalik rapor basilir: Telegram'a PDF, WhatsApp'a indirme yolu.
    def _hafta_con():
        con = _con()
        for i in range(14):
            sync_engine.ingest(con, {"module": "ays", "date": gun(i),
                                     "metrics": {"questions": metric(50 + i)}},
                               now=gun(i) + "T09:00:00")
        return con

    def t_weekly_belge():
        from core import cikti
        con = _hafta_con()
        b = weekly.belge(con, gun(13))
        eq((b["dogruluk"], b["tarih"], b["baslik"]), ("hesaplandi", gun(13), "Haftalık rapor"))
        olcu = next(x for x in b["bolumler"] if x["baslik"] == "Ölçüler")["bloklar"][0]
        ok(olcu["satirlar"][0][0] != "questions", olcu["satirlar"][0])   # ekran adi
        eq(olcu["satirlar"][0][6], "hesaplandı")
        # Rakam report()'tan gelir; belge yeni sayi uretmez.
        r = weekly.report(con, gun(13))
        eq(olcu["satirlar"][0][5], "+%%%d" % r["rows"][0]["change_pct"])
        h = cikti.html_belge(b)
        ok("Hesaplandı: sayılar ölçülmüş kayıtlardan" in h and "BAM kayıt" not in h)
        bayt, mime, ad = weekly.dosya(con, gun(13))
        eq(ad.rsplit(".", 1)[0], "hkm-haftalik-rapor-" + gun(13))
        ok(bayt[:4] == b"%PDF" if mime == "application/pdf" else b"<!doctype" in bayt[:20])
    test("haftalik rapor belgesi: hesaplandi etiketi, rakam rapordan", t_weekly_belge)

    def t_weekly_telegram_pdf():
        con = _hafta_con()
        cfg = {"channels": {"telegram": {"enabled": True, "bot_token": "B",
                                         "allow_from": ["7"], "chat_id": "7"}},
               "schedule": {"enabled": True, "weekly_day": "pazartesi"}}
        an = datetime.datetime(2026, 9, 14, 9, 5)
        r = schedule.run(con, cfg, {"kind": "weekly"}, now=an)
        eq((r["ok"], r["belge"]), (True, True))
        eq(schedule.run(con, cfg, {"kind": "weekly"}, now=an)["belge"], False)   # gunde bir
        giden = []

        def tas(url, govde, basliklar=None):
            giden.append((url, govde))
            return 200, '{"ok": true, "result": {"message_id": 1}}'
        eq(outbox.flush(con, cfg, now=an, transport=tas)["sent"], 2)
        eq(sorted(u.rsplit("/", 1)[1] for u, _ in giden), ["sendDocument", "sendMessage"])
        belge = next(g for u, g in giden if u.endswith("sendDocument"))
        ok(b"hkm-haftalik-rapor-2026-09-14" in belge)
    test("haftalik rapor Telegram'a metin ve PDF olarak gider", t_weekly_telegram_pdf)

    def t_weekly_whatsapp_yolu():
        con = _hafta_con()
        r = schedule.run(con, CFG, {"kind": "weekly"}, now=datetime.datetime(2026, 9, 14, 9, 5))
        no("belge" in r)
        satir = con.execute("SELECT kind, text FROM outbox").fetchall()
        eq([x["kind"] for x in satir], ["weekly"])
        ok("Sistemler › Haftalık karşılaştırma" in satir[0]["text"])
    test("WhatsApp'a belge gitmez; PDF'in yeri soylenir", t_weekly_whatsapp_yolu)

    # Fikir 51 — ay sonu mektubu: ayni hesap, 30 gunluk pencere; ayin
    # ilk gunu ONCEKI ayi «gecen ayla» karsilastirir. Varsayilani kapali.
    def t_ay_sonu_mektubu():
        from core import manager
        con = _con()
        for i in range(0, 62):                  # 2026-07-01 .. 2026-08-31
            d = (datetime.date(2026, 7, 1) + datetime.timedelta(days=i)).isoformat()
            deger = 40 if d < "2026-08-01" else 60
            sync_engine.ingest(con, {"module": "ays", "date": d,
                                     "metrics": {"questions": metric(deger)}}, now=d + "T09:00:00")
        m = weekly.aylik_mesaj(con, "2026-08-31")
        ok("2026-08-01 → 2026-08-31" in m.split("\n")[0], m)
        ok("AYS 31" in m, m)
        ok("önceki aya göre %50 yukarıda" in m, m)
        ok("Bu ay neler kazandın" in m, m)
        no(manager.imperatives(m))
        # Varsayilan kapali; acikken ayin 1'inde haftalik saatinde, onceki ay.
        no(any(j["kind"] == "monthly" for j in schedule.due(CFG, datetime.datetime(2026, 9, 1, 9, 5))))
        cfg = dict(CFG, schedule=dict(CFG["schedule"], monthly=True))
        ok(any(j["kind"] == "monthly" for j in schedule.due(cfg, datetime.datetime(2026, 9, 1, 9, 5))))
        no(any(j["kind"] == "monthly" for j in schedule.due(cfg, datetime.datetime(2026, 9, 2, 9, 5))))
        r = schedule.run(con, cfg, {"kind": "monthly"}, now=datetime.datetime(2026, 9, 1, 9, 5))
        ok(r["ok"])
        metin = con.execute("SELECT text FROM outbox WHERE kind='monthly'").fetchone()["text"]
        ok("2026-08-01 → 2026-08-31" in metin, metin)
    test("ay sonu mektubu: onceki ay, gecen ayla; varsayilan kapali", t_ay_sonu_mektubu)

    run_cli()
    run_kurtarma()
    run_bakim()


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


def run_kurtarma():
    """B01 — dokuz aylik yedek/geri yukleme zinciri, uctan uca."""
    import datetime as dt
    import json as js
    import os
    import tempfile

    import hkm as cli
    suite("kurtarma")

    def t_full_cycle_keeps_queues():
        """Dolu yedek → bos ambar → yeniden yedek zincirinde veri ve
        KUYRUK durumlari esdeger kalmali."""
        a = db.connect(":memory:")
        sync_engine.ingest(a, {"module": "spi", "date": gun(0),
                               "metrics": {"sleep_hours": metric(7.0)}},
                           now=gun(0) + "T09:00:00")
        db.insert_intent(a, "ays", "plan.add", {"date": gun(1), "minutes": 60},
                         "teklif", "patron")
        outbox.enqueue(a, "whatsapp", "daily", gun(0), "mesaj")
        yedek = db.export_all(a)

        b = db.connect(":memory:")
        r = db.import_all(b, yedek)
        ok(r["ok"], str(r.get("error")))
        eq(len(db.intents_for(b, "ays", ("pending",))), 1)
        eq(outbox.status(b)["counts"].get("queued"), 1)
        # Yeniden yedek: iki manifesto esdeger olmali.
        ikinci = db.export_all(b)
        eq(ikinci["__meta"]["tables"], yedek["__meta"]["tables"])
    test("yedek-geri yukle-yedek zinciri kuyruklari korur",
         t_full_cycle_keeps_queues)

    def t_manifest_mismatch_refused():
        """Eksik gelen bir yedek, eksik oldugunu SOYLEMELI."""
        a = db.connect(":memory:")
        sync_engine.ingest(a, {"module": "spi", "date": gun(0),
                               "metrics": {"sleep_hours": metric(7.0)}},
                           now=gun(0) + "T09:00:00")
        yedek = db.export_all(a)
        yedek["raw_events"] = []          # dosya kirpilmis
        r = db.import_all(db.connect(":memory:"), yedek)
        no(r["ok"])
        ok("manifesto" in r["error"])
    test("manifesto tutmayan yedek reddedilir", t_manifest_mismatch_refused)

    def t_nine_month_backup_via_file():
        """B01/2 — dokuz aylik yedek HTTP govde sinirindan buyuk olabilir;
        dosya yolu bu yuzden var ve calismali."""
        a = db.connect(":memory:")
        # Tarihler GECMISTE olmali: ambar gelecege ait olcumu kabul etmez
        # (bir olcum, henuz yasanmamis bir gune ait olamaz).
        bugun = dt.date.today()
        for i in range(120):
            t = (bugun - dt.timedelta(days=i % 60)).isoformat()
            sync_engine.ingest(a, {"module": "ays", "date": t,
                                   "metrics": {"questions": metric(50 + i % 40),
                                               "study_minutes": metric(60 + i % 40)}},
                               now=t + "T09:00:00")
        yedek = db.export_all(a)
        dizin = tempfile.mkdtemp(prefix="hkm-yedek-")
        yol = os.path.join(dizin, "yedek.json")
        with open(yol, "w", encoding="utf-8") as f:
            js.dump(yedek, f)
        hedef = os.path.join(dizin, "hkm.db")
        eski = cli.load_config
        cli.load_config = lambda: {"db_path": hedef, "local_token": "t"}
        try:
            eq(cli.main(["geri", yol]), 0)
            eq(cli.main(["geri", "/olmayan/dosya.json"]), 1)
        finally:
            cli.load_config = eski
        con = db.connect(hedef)
        eq(con.execute("SELECT COUNT(*) FROM raw_events").fetchone()[0], 120)
        con.close()
    test("buyuk yedek dosya yolundan geri yuklenir", t_nine_month_backup_via_file)

    def t_rollback_copy_written():
        """«Geri alinamaz» bir islem, geri alinabilir hale gelmeli."""
        import os as _os
        import tempfile as _tf
        a = db.connect(":memory:")
        sync_engine.ingest(a, {"module": "spi", "date": gun(0),
                               "metrics": {"sleep_hours": metric(7.0)}},
                           now=gun(0) + "T09:00:00")
        yedek = db.export_all(a)
        # Hedef ambar DOSYAYA bagli: geri donus kopyasi ambarin yanina
        # yazilir. Bellekteki bir ambarin kopyasi gercek `HKM/db/` icine
        # dusuyordu ve her test kosumu kullanicinin halkasindan yer yiyordu.
        d = _tf.mkdtemp(prefix="hkm-geri-")
        b = db.connect(_os.path.join(d, "hkm.db"))
        db.import_all(b, yedek)
        r = db.import_all(b, yedek, replace=True)
        ok(r["ok"])
        ok(r.get("rollback_copy"), "geri donus kopyasi yazilmadi")
        ok(_os.path.exists(r["rollback_copy"]))
        eq(_os.path.dirname(r["rollback_copy"]), d)
    test("ustune yazmadan once kopya alinir", t_rollback_copy_written)


def run_bakim():
    """Bakim, gunluk donusu ve kopya donusu — sistemin KENDINI korumasi."""
    import os as _os
    import tempfile
    from core import schedule

    suite("bakim")

    def _ambar():
        """Dosyaya bagli bir ambar — KENDI gecici klasorunde.

        Bu testler once `:memory:` kullaniyordu ve kopyalarini gercek
        `HKM/db/` icine birakiyordu; yani her test kosumu kullanicinin
        geri donus halkasindan (KOPYA_SAKLA=10) bir yer yiyordu. Testin
        kendi ambari olmali."""
        d = tempfile.mkdtemp(prefix="hkm-ambar-")
        return db.connect(_os.path.join(d, "hkm.db")), d

    def t_snapshot_yanina_yazilir():
        """Kopya, BAGLANTININ KENDI dosyasinin yanina yazilir.

        Yol once modul sabitinden (`db.DB_PATH`) geliyordu. Daemon gercek
        yolu `config.json`daki `db_path`ten alip tasir, yani ambarini
        baska bir yere koymus kullanicida kopya ambarinin yaninda DEGIL
        `HKM/db/` icinde birikiyordu — ve on test kosumu kullanicinin
        gercek geri donus kopyasini halkadan atiyordu."""
        gercek = _os.path.dirname(db.DB_PATH)
        oncesi = set(_os.listdir(gercek)) if _os.path.isdir(gercek) else set()
        con, d = _ambar()
        yol = db.snapshot_file(con, etiket="yan", sakla=3)
        eq(_os.path.dirname(yol), d)            # kendi klasorune yazdi
        sonrasi = set(_os.listdir(gercek)) if _os.path.isdir(gercek) else set()
        eq(sonrasi - oncesi, set())             # gercek halkaya HIC dokunmadi
    test("kopya kendi ambarinin yanina yazilir", t_snapshot_yanina_yazilir)

    def t_snapshot_bellekte_soyler():
        """Bellekteki bir veritabaninin dosyasi yoktur, kopyasinin dogal bir
        evi de yoktur. Once gercek `HKM/db/` icine yaziliyordu: kullanicinin
        ambarinin yanina, onun verisi OLMAYAN bir kopya. Sessizce yanlis
        yere yazmaktansa soyler."""
        gercek = _os.path.dirname(db.DB_PATH)
        oncesi = set(_os.listdir(gercek)) if _os.path.isdir(gercek) else set()
        con = db.connect(":memory:")
        try:
            db.snapshot_file(con, etiket="bellek", sakla=3)
            ok(False, "bellekteki ambar icin hata bekleniyordu")
        except ValueError:
            pass
        sonrasi = set(_os.listdir(gercek)) if _os.path.isdir(gercek) else set()
        eq(sonrasi - oncesi, set())
    test("bellekteki ambarin kopyasi gercek halkaya dusmez", t_snapshot_bellekte_soyler)

    def t_snapshot_rotation():
        """Sinirsiz kopya, diski dolduran ve hicbiri bakilmayan bir yigindir.

        Once hicbiri silinmiyordu: her geri yukleme bir dosya birakiyor ve
        dizin sessizce buyuyordu — dokuz aylik ufuk disiplinini kiran sey
        veritabani degil, yaninda biriken kopyalardi."""
        con, kok = _ambar()
        etiket = "test%d" % _os.getpid()
        yollar = [db.snapshot_file(con, etiket=etiket, sakla=3) for _ in range(5)]
        kalan = [a for a in _os.listdir(kok) if a.startswith("hkm-%s-" % etiket)]
        eq(len(kalan), 3)
        # EN YENILER kalir: eskiyi degil yeniyi saklamak istenir.
        ok(_os.path.basename(yollar[-1]) in kalan)
    test("kopyalar sinirsiz birikmez", t_snapshot_rotation)

    def t_snapshot_rotation_kaba_mtime():
        """Bazi dosya sistemleri (FAT/exFAT, HFS+, bazi NFS/konteyner
        katmanlari) mtime'i 1 saniyeye yuvarlar. Butun kopyalar AYNI
        mtime'i tasisa bile en yeni kopya kalmali — sira artik dosya
        adindaki damgadan gelir, diskten okunan mtime'dan degil."""
        con, kok = _ambar()
        etiket = "kaba%d" % _os.getpid()
        gercek_getmtime = _os.path.getmtime
        _os.path.getmtime = lambda p: 0.0   # butun dosyalar tek bir mtime'a dusuyor
        try:
            yollar = [db.snapshot_file(con, etiket=etiket, sakla=3) for _ in range(5)]
        finally:
            _os.path.getmtime = gercek_getmtime
        kalan = [a for a in _os.listdir(kok) if a.startswith("hkm-%s-" % etiket)]
        eq(len(kalan), 3)
        ok(_os.path.basename(yollar[-1]) in kalan)
        eq(len({_os.path.basename(y) for y in yollar}), 5)   # ad yeniden kullanimi yok
    test("kaba mtime'da bile en yeni kopya kalir", t_snapshot_rotation_kaba_mtime)

    def t_maintenance_backs_up_and_prunes():
        """KURULUM.md «kopyalamamak dokuz aylik kaydi tek bir disk hatasina
        baglar» diyordu — ama kopyalayan yoktu."""
        con, _kok = _ambar()
        eski = (datetime.date.today() - datetime.timedelta(days=400)).isoformat()
        sync_engine.ingest(con, {"module": "spi", "date": eski,
                                 "metrics": {"sleep_hours": metric(7.0)}},
                           now=eski + "T09:00:00")
        db.seen_message(con, "whatsapp", "wamid.eski",
                        now=(datetime.datetime.now()
                             - datetime.timedelta(days=90)).isoformat())
        r = schedule.maintenance(con, {"schedule": {"keep_days": 270}})
        eq(r["errors"], [])
        ok(r["backup"] and _os.path.exists(r["backup"]))
        eq(r["pruned_events"], 1)               # dokuz aydan eski olay gitti
        eq(r["pruned_inbox"], 1)                # eski mesaj kimligi gitti
        # KARARLAR KALIR: budama gecmisi degil ham olculeri siler.
    test("bakim yedek alir ve eskiyi budar", t_maintenance_backs_up_and_prunes)

    def t_maintenance_runs_once_a_day():
        """Bellekteki bir bayrak, daemon yeniden baslatildiginda kaybolur ve
        ayni gun ikinci bir yedek alinir."""
        con, _kok = _ambar()
        simdi = datetime.datetime.now().replace(hour=3, minute=35)
        cfg = {"schedule": {"maintenance": True, "maintenance_time": "03:30"}}
        ok(schedule._bakim_vakti(cfg, simdi))
        no(schedule._bakim_vakti(cfg, simdi.replace(hour=2)))   # hedeften ONCE
        no(schedule._bakim_vakti({"schedule": {"maintenance": False}}, simdi))
        no(schedule._bugun_bakim_yapildi(simdi, con))           # once: yok
        schedule.maintenance(con, cfg, now=simdi)
        ok(schedule._bugun_bakim_yapildi(simdi, con))           # sonra: var
    test("bakim gunde bir kez kosar", t_maintenance_runs_once_a_day)

    def t_maintenance_kacirilan_gun_kovalanir():
        """Geceleri kapali bir makinede otomatik yedek HIC alinmiyordu.

        Pencere once hedef + 90 dakika ile KATIYDI: bakim yalnizca
        03:30-05:00 arasi makine aciksa kosuyordu. Dizustunu geceleri
        kapatan biri icin o pencere hic acilmiyor ve dokuz aylik ambar tek
        bir disk hatasina bagli kaliyordu.

        «Gecmis is kovalanmaz» bir BILDIRIM kuralidir ve dogrudur —
        hatirlaticinin degeri zamanindadir. Yedegin degeri VARLIGINDADIR:
        gec alinan yedek, hic alinmayandan iyidir."""
        con, _kok = _ambar()
        cfg = {"schedule": {"maintenance": True, "maintenance_time": "03:30"}}
        oglen = datetime.datetime.now().replace(hour=12, minute=0)
        ok(schedule._bakim_vakti(cfg, oglen), "kacirilan gun kovalanmali")
        aksam = oglen.replace(hour=23, minute=30)
        ok(schedule._bakim_vakti(cfg, aksam), "gec de olsa alinmali")
        # Ama gunde BIR kez: kovalamak ikinci bir yedek uretmez.
        r = schedule.tick(con, cfg, now=oglen)
        ok(r["maintenance"], "kacirilan yedek oglen alinmaliydi")
        r2 = schedule.tick(con, cfg, now=aksam)
        eq(r2["maintenance"], None, "ayni gun ikinci yedek alinmamali")
    test("kacirilan bakim gunu kovalanir", t_maintenance_kacirilan_gun_kovalanir)

    def t_log_rotation():
        """Donus yoktu: db/daemon.log her baslatmada uzuyordu ve aylar sonra
        diski dolduran sey veritabani degil GUNLUK oluyordu."""
        import baslat
        d = tempfile.mkdtemp()
        yol = _os.path.join(d, "daemon.log")
        with open(yol, "w", encoding="utf-8") as f:
            f.write("x" * 3000)
        no(baslat._gunluk_donusu(yol, sinir=10000))     # kucuk dosya donmez
        ok(baslat._gunluk_donusu(yol, sinir=1000))      # buyuk dosya doner
        # Dosya SILINMEZ, kaydirilir: son hata hala okunabilir olmali.
        ok(_os.path.exists(yol + ".1"))
        no(_os.path.exists(yol))
    test("gunluk dosyasi sinirsiz buyumez", t_log_rotation)

    def t_restore_does_not_deadlock():
        """Geri donus kopyasi ISLEMIN DISINDA alinir: iceride alinirsa
        SQLite'in yedekleme API'si kendi baglantisinin actigi yazma kilidini
        beklerken sonsuza kadar kilitlenir."""
        import tempfile as _tf
        a = db.connect(":memory:")
        sync_engine.ingest(a, {"module": "spi", "date": gun(0),
                               "metrics": {"sleep_hours": metric(7.0)}},
                           now=gun(0) + "T09:00:00")
        yedek = db.export_all(a)
        d = _tf.mkdtemp(prefix="hkm-kilit-")
        b = db.connect(_os.path.join(d, "hkm.db"))
        db.import_all(b, yedek)
        r = db.import_all(b, yedek, replace=True)       # kilitlenirse test asilir
        ok(r["ok"])
        ok(r["rollback_copy"])

        # Bellekteki ambarda kopyanin evi yoktur: geri yukleme yine de
        # DURMAZ, yalnizca kopya alinmadigini soyler.
        c = db.connect(":memory:")
        db.import_all(c, yedek)
        r2 = db.import_all(c, yedek, replace=True)
        ok(r2["ok"], "kopya alinamasa da geri yukleme olmali")
        no(r2["rollback_copy"], "alinmayan kopya alinmis gibi gorunmemeli")
    test("ustune yazma kilitlenmez", t_restore_does_not_deadlock)
