# -*- coding: utf-8 -*-
"""Butce — paranin OLCUMU.

Bu paket bir ozelligi degil bir SOZU korur: harcama tahmin edilmez,
olculur; ve sinir, sinirdir.
"""

import datetime

from core import butce, db, settings
from tests.harness import eq, no, ok, suite, test

BUGUN = "2026-09-14"
KUR = 48.6


def _con():
    return db.connect(":memory:")


def _cfg(**ek):
    b = {"monthly_try": 850.0, "usd_try": KUR, "rate_date": BUGUN}
    b.update(ek)
    return {"local_token": "x", "budget": b}


def _yaz(con, gun, usd, task="sohbet", user="ben", ok_=True):
    butce.record(con, role="king", task=task, provider="openrouter",
                 model="google/gemini-2.5-flash-lite", user=user,
                 in_tok=800, out_tok=300, usd=usd, rate=KUR, ok=ok_,
                 now=datetime.datetime.combine(
                     datetime.date.fromisoformat(gun), datetime.time(12, 0)))


def run():
    suite("butce")

    def t_failed_call_is_recorded():
        """Para, cevap alinmadan da harcanmis olabilir; yazilmayan bir
        cagri, gorunmeyen bir giderdir."""
        con = _con()
        _yaz(con, BUGUN, 0.01, ok_=False)
        d = butce.month(con, _cfg(), BUGUN)
        eq(d["calls"], 1)
        ok(d["spent_try"] > 0)
    test("basarisiz cagri da deftere yazilir", t_failed_call_is_recorded)

    def t_unmeasured_is_not_zero():
        """Hic kullanilmamis bir yetenek icin «0 TL» yazmak, o kategorinin
        bedava oldugunu ima eder."""
        con = _con()
        _yaz(con, BUGUN, 0.02, task="sohbet")
        d = butce.month(con, _cfg(), BUGUN)
        satir = {g["task"]: g for g in d["by_task"]}
        ok(satir["sohbet"]["measured"])
        no(satir["arastir"]["measured"])
        eq(satir["arastir"]["try"], None)      # sifir DEGIL, YOK
        # Butun gorev turleri listede: gorunmeyen kategori unutulur.
        eq(len(d["by_task"]), len(butce.GOREVLER))
    test("olculmeyen kategori sifir degildir", t_unmeasured_is_not_zero)

    def t_users_are_separate():
        con = _con()
        _yaz(con, BUGUN, 0.10, user="ben")
        _yaz(con, BUGUN, 0.20, user="kardesim")
        d = butce.month(con, _cfg(), BUGUN)
        eq(sorted(d["by_user"]), ["ben", "kardesim"])
        ok(d["by_user"]["kardesim"] > d["by_user"]["ben"])
    test("harcama kisi basina ayrilir", t_users_are_separate)

    def t_ceiling_stops_paid_calls():
        """«Birazcik asalim» diyen bir sistem, sinirin kendisini kaldirmis
        olur."""
        con = _con()
        cfg = _cfg(monthly_try=10.0)
        eq(butce.guard(con, cfg, BUGUN)["ok"], True)
        _yaz(con, BUGUN, 10.0 / KUR)           # tam tavan kadar
        r = butce.guard(con, cfg, BUGUN, cost_try=0.5)
        no(r["ok"])
        eq(r["reason"], "ceiling")
        ok("Kural motoru" in r["note"])        # ucretsiz yol calisir
    test("sinirda ucretli cagri durur", t_ceiling_stops_paid_calls)

    def t_no_rate_no_paid_call():
        """Kur girilmemisse TL hesabi yapilamaz; hesaplanamayan bir
        maliyetle harcama yapmak, sinirsiz harcamaktir."""
        con = _con()
        r = butce.guard(con, _cfg(usd_try=0.0), BUGUN)
        no(r["ok"])
        eq(r["reason"], "no-rate")
        r = butce.guard(con, _cfg(monthly_try=0.0), BUGUN)
        no(r["ok"])
        eq(r["reason"], "no-ceiling")
    test("kur ya da tavan yoksa ucretli cagri yok", t_no_rate_no_paid_call)

    def t_stale_rate_is_reported():
        """Eski bir kurla yapilan TL hesabi, dogru gorunen yanlis bir
        sayidir."""
        con = _con()
        eski = (datetime.date.fromisoformat(BUGUN)
                - datetime.timedelta(days=butce.KUR_ESKIME_GUN + 1)).isoformat()
        ok(butce.month(con, _cfg(rate_date=eski), BUGUN)["rate_stale"])
        no(butce.month(con, _cfg(), BUGUN)["rate_stale"])
        ok(butce.month(con, _cfg(rate_date=""), BUGUN)["rate_stale"])
    test("eskimis kur soylenir", t_stale_rate_is_reported)

    def t_projection_needs_measurement():
        con = _con()
        bos = butce.project(con, _cfg(), BUGUN)
        no(bos["ok"])
        eq(bos["reason"], "no-data")
        ok("bedava" in bos["note"])
    test("olcum yoksa tahmin uretilmez", t_projection_needs_measurement)

    def t_projection_gives_two_numbers():
        """Tek bir aylik tahmin, iyimser gunun tahminidir."""
        con = _con()
        g = datetime.date.fromisoformat(BUGUN)
        # Alti sakin gun, bir yogun gun.
        for i in range(1, 7):
            _yaz(con, (g - datetime.timedelta(days=i)).isoformat(), 0.02)
        _yaz(con, BUGUN, 0.50)
        t = butce.project(con, _cfg(), BUGUN, days=7)
        ok(t["ok"])
        eq(t["measured_days"], 7)
        ok(t["p90_daily"] > t["p50_daily"])
        ok(t["p90_monthly"] > t["p50_monthly"])
        ok(t["fits_p50"])
    test("tahmin iki sayidir: ortanca ve yogun gun",
         t_projection_gives_two_numbers)

    def t_unused_days_are_not_zero():
        """Kullanilmayan gun sayilmaz: sifir sayilsaydi tahmin sessizce
        asagi cekilirdi."""
        con = _con()
        g = datetime.date.fromisoformat(BUGUN)
        _yaz(con, BUGUN, 0.10)
        _yaz(con, (g - datetime.timedelta(days=1)).isoformat(), 0.10)
        t = butce.project(con, _cfg(), BUGUN, days=7)
        eq(t["measured_days"], 2)              # 7 degil: bes gun olculmedi
        eq(t["p50_daily"], round(0.10 * KUR, 2))
    test("olculmeyen gun tahmini asagi cekmez", t_unused_days_are_not_zero)

    def t_settings_round_trip():
        yama = {"budget": {"monthly_try": 900.0, "usd_try": 48.6,
                           "rate_date": BUGUN, "stop_at_pct": 95}}
        ok_, hata = settings.validate(yama)
        ok(ok_)
        yeni = settings.apply({"local_token": "x"}, yama)
        eq(butce.settings(yeni)["monthly_try"], 900.0)
        eq(butce.settings(yeni)["stop_at_pct"], 95)
        # Disari cikan ayarda butce de var.
        eq(settings.read(yeni)["budget"]["monthly_try"], 900.0)
    test("butce ayari kapidan gecer", t_settings_round_trip)

    def t_bad_budget_refused():
        for kotu in ({"monthly_try": "cok"}, {"stop_at_pct": 500},
                     {"rate_date": "dun"}, {"bilinmeyen": 1},
                     {"usd_try": -5}):
            ok_, hata = butce.validate(kotu)
            no(ok_)
            ok(hata)
    test("bozuk butce ayari reddedilir", t_bad_budget_refused)

    def t_openrouter_is_offered():
        """«Hangi siteden anahtar alayim» sorusunun cevabi ayarin yaninda
        durmali."""
        from core import models
        eq("openrouter" in models.PROVIDERS, True)
        p = [x for x in settings.read({"local_token": "x"})["models"]["providers"]
             if x["id"] == "openrouter"][0]
        ok(p["signup"].startswith("https://"))
        ok(p["note"])
        ok(len(p["models"]) >= 5)
    test("onerilen saglayici ve adresi ekranda", t_openrouter_is_offered)
