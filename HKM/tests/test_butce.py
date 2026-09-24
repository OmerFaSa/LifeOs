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
    # Bu paketin cogu sinamasi TL tavanini olcer; tavan birimi artik bir
    # SECIMDIR ve varsayilani USD'dir, o yuzden acikca yazilir.
    b = {"monthly_try": 850.0, "usd_try": KUR, "rate_date": BUGUN,
         "ceiling_currency": "try"}
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

    def _ai_cfg(tavan_usd):
        from core import models
        cfg = {"local_token": "x",
               "budget": {"ceiling_currency": "usd", "monthly_usd": tavan_usd,
                          "usd_try": 0.0, "rate_date": ""}}
        return models.apply(cfg, {"keys": {"google": "AIza-test"},
                                  "assignments": {"king": {"provider": "google",
                                                           "model": "gemini-2.5-pro"}}})

    def t_kullanim_yoksa_sifir_olculmez():
        """HATALAR D-16: saglayici kullanim bilgisi dondurmezse jeton 0,
        maliyet «0 USD, olculdu» yaziliyordu; tavan hic dolmazdi. Olculmeyen
        sifir degildir: jeton metinden TAHMIN edilir ve oyle isaretlenir."""
        from core import ai
        con = _con()
        r = ai.ask(con, _ai_cfg(20.0), "king", "sohbet",
                   [{"role": "user", "content": "Merhaba, bugün ne çalışayım?" * 10}],
                   transport=lambda *a: ("Önce matematik tekrarı öneririm." * 5,
                                         None, None))
        ok(r["ok"], r)
        u = con.execute("SELECT * FROM usage").fetchone()
        ok(u["in_tok"] > 0 and u["out_tok"] > 0, dict(u))
        ok(u["usd"] > 0, dict(u))
        ok("tahmini-jeton" in u["note"], u["note"])
        ok(r["tokens_estimated"])
        # Kullanim bilgisi gelen cagri olcumdur.
        ai.ask(con, _ai_cfg(20.0), "king", "sohbet",
               [{"role": "user", "content": "Selam"}],
               transport=lambda *a: ("Cevap.", 100, 20))
        u2 = con.execute("SELECT * FROM usage ORDER BY id DESC").fetchone()
        eq((u2["in_tok"], u2["out_tok"]), (100, 20))
        no("tahmini-jeton" in (u2["note"] or ""))
    test("kullanim bilgisi yoksa maliyet sifir olculmez (D-16)",
         t_kullanim_yoksa_sifir_olculmez)

    def t_is_maliyeti_tahmini_jetonu_soyler():
        con = _con()
        butce.record(con, role="bam.uretim", task="bam", provider="google",
                     model="gemini-2.5-pro", user="ben", in_tok=100, out_tok=50,
                     usd=0.001, rate=0, ok=True, note="tahmini-jeton", is_id=7)
        eq(butce.is_maliyeti(con, 7)["etiket"], "tahmin")
    test("is maliyeti tahmini jetonu tahmin sayar (D-16)",
         t_is_maliyeti_tahmini_jetonu_soyler)

    def t_tavan_cagrinin_maliyetini_hesaba_katar():
        """HATALAR D-18: USD tavaninda yalniz «harcanan >= sinir» soruluyordu;
        cagrinin kendi maliyeti eklenmiyordu ve eszamanli iki cagri (ritim
        BAM + sohbet) ikisi de geciyordu."""
        con = _con()
        cfg = {"local_token": "x",
               "budget": {"ceiling_currency": "usd", "monthly_usd": 1.0,
                          "usd_try": 0.0, "rate_date": ""}}
        _yaz(con, BUGUN, 0.95)
        ok(butce.guard(con, cfg, BUGUN)["ok"])
        r = butce.guard(con, cfg, BUGUN, cost_usd=0.10)
        no(r["ok"])
        eq(r["reason"], "ceiling")
        ok(butce.guard(con, cfg, BUGUN, cost_usd=0.04)["ok"])
        # Yoldaki cagri ayrilmis sayilir: ikincisi ayni payi kullanamaz.
        with butce.ayir(0.04):
            no(butce.guard(con, cfg, BUGUN, cost_usd=0.04)["ok"])
        ok(butce.guard(con, cfg, BUGUN, cost_usd=0.04)["ok"])
    test("tavan cagrinin maliyetini ve yoldaki cagriyi sayar (D-18)",
         t_tavan_cagrinin_maliyetini_hesaba_katar)

    def t_pahali_cagri_tavani_asmaz():
        """Tek pahali cagri tavani asamaz: cagri oncesi en kotu durum
        (istem + en uzun cevap) tavana eklenir; asiyorsa model cagrilmaz."""
        from core import ai
        con = _con()
        cfg = _ai_cfg(0.01)
        cagrildi = []
        r = ai.ask(con, cfg, "king", "sohbet",
                   [{"role": "user", "content": "x" * 40000}],
                   transport=lambda *a: (cagrildi.append(1), ("c", 10, 10))[1])
        no(r["ok"])
        eq(r["reason"], "budget")
        eq(cagrildi, [])
    test("tek pahali cagri tavani asmaz (D-18)", t_pahali_cagri_tavani_asmaz)

    def t_no_rate_no_paid_call():
        """TL tavani secilmisse ve kur girilmemisse TL hesabi yapilamaz;
        hesaplanamayan bir maliyetle harcama yapmak, sinirsiz
        harcamaktir."""
        con = _con()
        r = butce.guard(con, _cfg(usd_try=0.0), BUGUN)
        no(r["ok"])
        eq(r["reason"], "no-rate")
        # Eksigin ADI ve iki ayri cikis yolu ayni cumlede durur.
        ok("kur" in r["note"].lower())
        ok("USD" in r["note"])
        r = butce.guard(con, _cfg(monthly_try=0.0), BUGUN)
        no(r["ok"])
        eq(r["reason"], "no-ceiling")
    test("kur ya da tavan yoksa ucretli cagri yok", t_no_rate_no_paid_call)

    def t_usd_ceiling_needs_no_rate():
        """Tavan USD ise KUR GEREKMEZ: harcama zaten USD olculur.

        Bu, bir kolaylik degil bir TIKANIKLIGIN cozumu. Tavan yalnizca TL
        olabilirken, kuru girmemis bir kullanicinin HICBIR model cagrisi
        yapilamiyordu: anahtari dogru, modeli dogru, ama baska bir
        sekmedeki bos bir kur alani yuzunden sohbet sessizce
        calismiyordu."""
        con = _con()
        cfg = {"local_token": "x",
               "budget": {"ceiling_currency": "usd", "monthly_usd": 20.0,
                          "usd_try": 0.0, "rate_date": ""}}
        r = butce.guard(con, cfg, BUGUN)
        ok(r["ok"], "kur yok diye USD tavani engellendi")

        # Sinir yine SINIRDIR: USD cinsinden de durur.
        _yaz(con, BUGUN, 20.0)
        r = butce.guard(con, cfg, BUGUN)
        no(r["ok"])
        eq(r["reason"], "ceiling")
        ok("USD" in r["note"])

        d = butce.month(con, cfg, BUGUN)
        eq(d["currency"], "usd")
        eq(d["spent_usd"], 20.0)
        # TL'ye cevrilemeyen bir harcama SIFIR degildir: USD olculmustur.
        eq(d["spent"], 20.0)
    test("USD tavani kur istemez", t_usd_ceiling_needs_no_rate)

    def t_default_setup_can_call():
        """Kurulumdan HEMEN SONRA, hicbir butce alani doldurulmadan,
        ucretli cagri yapilabilmeli. Aksi halde kullanici anahtarini
        girer, modelini secer ve sohbetin neden sustugunu anlamaz."""
        con = _con()
        r = butce.guard(con, {"local_token": "x"}, BUGUN)
        ok(r["ok"], "varsayilan kurulumda cagri engellendi: %s"
           % r.get("note"))
    test("varsayilan kurulumda sohbet calisir", t_default_setup_can_call)

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

    def t_is_baglami():
        """8a-1: cagri ait oldugu BAM isine yazilir; baglam is parcacigina
        ozeldir ve cikista eski haline doner. Isin maliyeti defterden."""
        import threading
        con = db.connect(":memory:")
        kw = dict(role="bam.uretim", task="urun", provider="p", model="m", usd=0.25)
        butce.record(con, **kw)
        with butce.is_baglami(7):
            butce.record(con, **kw)
            with butce.is_baglami(9):
                butce.record(con, **kw)
            butce.record(con, **kw)
            # Baska is parcacigi (sohbet) baglami GORMEZ.
            goren = []
            t = threading.Thread(target=lambda: goren.append(
                getattr(butce._BAGLAM, "is_id", None)))
            t.start()
            t.join()
            eq(goren, [None])
        butce.record(con, **kw)
        eq([r[0] for r in con.execute("SELECT is_id FROM usage ORDER BY id")],
           [None, 7, 9, 7, None])
        m = butce.is_maliyeti(con, 7)
        eq((m["cagri"], m["usd"], m["etiket"]), (2, 0.5, "olculdu"))
        eq(butce.is_maliyeti(con, 99)["cagri"], 0)
    test("cagri isine yazilir; isin maliyeti olculur", t_is_baglami)

    def t_modul_dagilimi():
        # Fikir 47: aylik harcama MODUL basina. BAM isinin cagrisi o isi
        # isteyen modulun, «ays.» rollu cagri AYS'nin, sohbet HKM'nindir.
        # Harcamasi olmayan modul SIFIR degil «olculmedi».
        con = _con()
        con.execute("INSERT INTO is_emirleri(modul, tur, konu, govde, karar, durum, created_at, "
                    "updated_at, bam_is_id) VALUES ('spi','spi.bilgi','x','{}','onay','bitti',?,?,7)",
                    (BUGUN, BUGUN))
        an = datetime.datetime.combine(datetime.date.fromisoformat(BUGUN), datetime.time(12))
        butce.record(con, role="bam.arastirma", task="arastirma", provider="p", model="m",
                     usd=0.2, rate=KUR, is_id=7, now=an)
        butce.record(con, role="ays.gorsel", task="gorsel_oku", provider="p", model="m",
                     usd=0.1, rate=KUR, now=an)
        _yaz(con, BUGUN, 0.05)
        d = {x["modul"]: x for x in butce.month(con, _cfg(), BUGUN)["by_modul"]}
        eq((d["spi"]["usd"], d["ays"]["usd"], d["hkm"]["usd"]), (0.2, 0.1, 0.05))
        eq((d["spi"]["calls"], d["esp"]["measured"], d["esp"]["usd"]), (1, False, None))
    test("aylik harcama modul basina; harcamasiz modul olculmedi", t_modul_dagilimi)
