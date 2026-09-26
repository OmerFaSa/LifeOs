# -*- coding: utf-8 -*-
"""Motor — gereken zeka, gereken yerde, en dusuk maliyetle.

Dort model sinifi (ekonomik < standart < guclu < uzman). Paket her
seviye icin BASLANGIC ve TAVAN sinifini soyler; sistem baslangictan
dener, model ZORLANIRSA bir ust sinifa cikar. Guclu modeller surekli
calisan bir motor degil, gerektiginde cagrilan uzmanlardir.

Kanitlanan sozler:
  1. Paket yoksa ya da kademenin KENDI atamasi varsa merdiven kurulmaz:
     kullanicinin secimi kazanir.
  2. Zorlanma: cevap dusuruldu, saglayici hata verdi, kisaltmaya ragmen
     kesildi ya da alt model «[[YUKSELT]]» dedi. Butce engelinde
     YUKSELINMEZ — ust basamak daha pahalidir.
  3. Butce bantlarinda (%80, %95) yonlendirme ekonomiklesir ve bu SOYLENIR.
  4. Efor paketten gelir ve cagriya gider.
"""

import datetime

from core import ai, butce, db, models, motor
from tests.harness import eq, no, ok, suite, test

BUGUN = datetime.date.today().isoformat()


def _cfg(paket="S", tavan=20.0, **atama):
    cfg = {"local_token": "x",
           "budget": {"ceiling_currency": "usd", "monthly_usd": tavan}}
    yama = {"keys": {"openrouter": "sk-or-test"}}
    if atama:
        yama["assignments"] = atama
    cfg = models.apply(cfg, yama)
    if paket:
        cfg = models.apply(cfg, {"paket": paket})
    return cfg


def _tasiyici(*cevaplar):
    """Sirayla cevap veren sahte saglayici; her cagriyi kaydeder."""
    kayit = []

    def t(provider, anahtar, model, sistem, mesajlar, ayar=None):
        kayit.append({"model": model, "sistem": sistem, "ayar": ayar or {}})
        c = cevaplar[min(len(kayit) - 1, len(cevaplar) - 1)]
        if isinstance(c, Exception):
            raise c
        return c, 100, 20
    t.kayit = kayit
    return t


def _mesaj():
    return [{"role": "user", "content": "merhaba"}]


def run():
    suite("motor")

    def t_package_is_validated():
        ok_, hata = models.validate({"paket": "Z"})
        no(ok_)
        for p in ("A", "A+", "S", "S+", "", None):
            ok(models.validate({"paket": p})[0], p)
        eq(models.paket_of(_cfg("S+")), "S+")
        eq(models.paket_of(models.apply(_cfg("S"), {"paket": ""})), None)
    test("paket dogrulanir ve saklanir", t_package_is_validated)

    def t_ladder_follows_package():
        cfg = _cfg("S")
        m = motor.merdiven(None, cfg, "seviye.alt")
        eq([b["sinif"] for b in m["basamaklar"]], ["ekonomik", "standart"])
        eq(m["basamaklar"][0]["atama"]["model"], motor.SINIF_MODELI["metin"]["ekonomik"])
        eq(m["basamaklar"][0]["ayar"]["efor"], "low")
        u = motor.merdiven(None, cfg, "king", seviye="ust")
        eq([b["sinif"] for b in u["basamaklar"]], ["guclu", "uzman"])
        eq(u["basamaklar"][0]["ayar"]["efor"], "high")
        eq([b["sinif"] for b in motor.merdiven(None, _cfg("S+"), "king", seviye="ust")["basamaklar"]],
           ["uzman"])
        eq([b["sinif"] for b in motor.merdiven(None, _cfg("A"), "king", seviye="ust")["basamaklar"]],
           ["standart", "guclu"])
    test("merdiven paketi izler", t_ladder_follows_package)

    def t_packages_rise_in_quality():
        """A verim, S+ kalite: paket yukseldikce hicbir seviyenin baslangic
        ya da tavan sinifi DUSMEZ."""
        sira = {s: i for i, s in enumerate(motor.SINIFLAR)}
        for sv in motor.POLITIKA_SEVIYELERI:
            onceki = (-1, -1)
            for pid in ("A", "A+", "S", "S+"):
                bas, tavan, _ = motor.PAKET_POLITIKASI[pid][sv]
                simdi = (sira[bas], sira[tavan])
                ok(simdi[0] >= onceki[0] and simdi[1] >= onceki[1], "%s %s" % (pid, sv))
                ok(simdi[0] <= simdi[1])
                onceki = simdi
    test("paketler kaliteye dogru yukselir", t_packages_rise_in_quality)

    def t_manual_and_no_package_keep_old_behaviour():
        cfg = _cfg(None, king={"provider": "openrouter", "model": "x/elle"})
        m = motor.merdiven(None, cfg, "king", seviye="ust")
        eq(len(m["basamaklar"]), 1)
        eq(m["basamaklar"][0]["atama"]["model"], "x/elle")
        cfg = _cfg("S", king={"provider": "openrouter", "model": "x/elle"})
        eq(motor.merdiven(None, cfg, "king", seviye="ust")["basamaklar"][0]["atama"]["model"], "x/elle")
    test("elle atama ve paketsiz kurulum eskisi gibi", t_manual_and_no_package_keep_old_behaviour)

    def t_escalates_when_answer_is_dropped():
        con = db.connect(":memory:")
        cfg = _cfg("S")
        uydurma = "Uykun dün 9.7 saatti."
        t = _tasiyici(uydurma, uydurma, "Merhaba, buradayım.")
        r = ai.ask(con, cfg, "seviye.alt", "sohbet", _mesaj(), baglam="Tarih: x",
                   sistem="s", transport=t, seviye="alt")
        ok(r["ok"])
        eq(r["text"], "Merhaba, buradayım.")
        eq(r["motor"]["sinif"], "standart")
        ok(r["motor"]["yukseldi"])
        eq([k["model"] for k in t.kayit][-1], motor.SINIF_MODELI["metin"]["standart"])
        satir = con.execute("SELECT escalated FROM usage ORDER BY id DESC LIMIT 1").fetchone()
        eq(satir["escalated"], 1)
    test("dusurulen cevap bir ust sinifa cikar", t_escalates_when_answer_is_dropped)

    def t_escalates_on_marker_and_top_has_no_marker_rule():
        con = db.connect(":memory:")
        t = _tasiyici("[[YUKSELT]]", "Bu kararı birlikte tartalım.")
        r = ai.ask(con, _cfg("S"), "king", "sohbet", _mesaj(), baglam="Tarih: x",
                   sistem="s", transport=t, seviye="ust")
        ok(r["ok"])
        no("YUKSELT" in r["text"])
        eq(r["motor"]["sinif"], "uzman")
        ok(motor.YUKSELT_KURALI in t.kayit[0]["sistem"])
        no(motor.YUKSELT_KURALI in t.kayit[-1]["sistem"])      # son basamak cikamaz
    test("alt model yardim isteyince cikilir", t_escalates_on_marker_and_top_has_no_marker_rule)

    def t_provider_error_escalates_budget_does_not():
        con = db.connect(":memory:")
        t = _tasiyici(OSError("baglanti"), "Tamam.")
        r = ai.ask(con, _cfg("S"), "seviye.alt", "sohbet", _mesaj(), baglam="",
                   sistem="s", transport=t, seviye="alt")
        ok(r["ok"])
        eq(r["motor"]["sinif"], "standart")
        con2 = db.connect(":memory:")
        cfg = _cfg("S", tavan=0.01)
        butce.record(con2, role="king", task="sohbet", provider="openrouter", model="x",
                     usd=0.02)
        t2 = _tasiyici("Tamam.")
        r2 = ai.ask(con2, cfg, "seviye.alt", "sohbet", _mesaj(), baglam="", sistem="s",
                    transport=t2, seviye="alt")
        no(r2["ok"])
        eq(r2["reason"], "budget")
        eq(t2.kayit, [])
    test("saglayici hatasi cikar, butce engeli cikmaz", t_provider_error_escalates_budget_does_not)

    def t_effort_reaches_the_call():
        con = db.connect(":memory:")
        t = _tasiyici("Planı birlikte kuralım.")
        ai.ask(con, _cfg("S"), "king", "sohbet", _mesaj(), baglam="", sistem="s",
               transport=t, seviye="ust")
        eq(t.kayit[0]["ayar"].get("efor"), "high")
        ok(t.kayit[0]["ayar"].get("jeton"))
    test("efor cagriya gider", t_effort_reaches_the_call)

    def t_economy_mode_at_budget_bands():
        """%80'de tavan bir sinif iner, %95'te standart'i gecmez ve
        ekonomik'ten baslar. Kullaniciya SOYLENIR."""
        cfg = _cfg("S", tavan=10.0)
        con = db.connect(":memory:")
        butce.record(con, role="king", task="sohbet", provider="openrouter", model="x", usd=8.1)
        m = motor.merdiven(con, cfg, "king", seviye="ust")
        eq([b["sinif"] for b in m["basamaklar"]], ["guclu"])
        ok(m["ekonomi"] and "%80" in m["ekonomi"]["not"])
        butce.record(con, role="king", task="sohbet", provider="openrouter", model="x", usd=1.5)
        m = motor.merdiven(con, cfg, "king", seviye="ust")
        eq([b["sinif"] for b in m["basamaklar"]], ["ekonomik", "standart"])
        ok("%95" in m["ekonomi"]["not"])
        eq(motor.merdiven(db.connect(":memory:"), cfg, "king", seviye="ust")["ekonomi"], None)
    test("butce bantlarinda yonlendirme ekonomiklesir", t_economy_mode_at_budget_bands)

    def t_voice_needs_google():
        m = motor.merdiven(None, _cfg("S"), "medya")
        no(m["ok"])
        ok("Google" in m["note"])
        cfg = models.apply(_cfg("S"), {"keys": {"google": "AIza-x"}})
        m = motor.merdiven(None, cfg, "medya")
        ok(m["ok"])
        eq(m["basamaklar"][0]["atama"]["provider"], "google")
    test("ses yalniz Google anahtariyla", t_voice_needs_google)

    def t_chat_picks_level_from_message():
        """Sohbette seviye MESAJDAN secilir: «merhaba» ekonomik modelle,
        «yol haritasi» guclu modelle baslar; cevap hangi sinifla ve neden
        verildigini tasir (ekranda kucuk bir satir)."""
        from core import sohbet
        cfg = _cfg("S")
        con = db.connect(":memory:")
        t = _tasiyici("Merhaba!")
        r = sohbet.konus(con, cfg, "merhaba nasılsın", BUGUN, transport=t)
        ok(r["ok"], r)
        eq(t.kayit[0]["model"], motor.SINIF_MODELI["metin"]["ekonomik"])
        eq(r["motor"]["seviye"], "alt")
        ok(r["motor"]["neden"])
        t2 = _tasiyici("Üç aylık planı birlikte kuralım.")
        r2 = sohbet.konus(con, cfg, "Fizik mi kimya mı, hangisini seçmeliyim?", BUGUN, transport=t2)
        ok(r2["ok"], r2)
        eq(t2.kayit[0]["model"], motor.SINIF_MODELI["metin"]["guclu"])
        eq(r2["motor"]["seviye"], "ust")
    test("sohbet seviyeyi mesajdan secer", t_chat_picks_level_from_message)

    def t_preview_writes_nothing_and_estimates_from_measurement():
        """Onizleme hicbir sey yazmaz. Aylik tahmin OLCUMDEN: son 30 gunun
        jetonu x baslangic sinifinin tarifesi (+ olculen yukselme payi bir
        ust sinifla). Olcum yoksa sayi uydurulmaz."""
        cfg = _cfg(None)
        con = db.connect(":memory:")
        o = motor.onizleme(cfg, con=con, bugun="2026-09-26")
        eq([p["id"] for p in o["paketler"]], ["A", "A+", "S", "S+"])
        for p in o["paketler"]:
            eq(p["aylik"], None)
        ok(o["olcum_notu"])
        eq(o["aktif"], None)
        now = datetime.datetime(2026, 9, 20, 12, 0)
        butce.record(con, role="king", task="sohbet", provider="openrouter", model="x",
                     in_tok=1_000_000, out_tok=1_000_000, note="seviye=alt", now=now)
        o = motor.onizleme(cfg, con=con, bugun="2026-09-26")
        eq(o["yukselme_orani"], 0.0)
        for p in o["paketler"]:
            bas = motor.PAKET_POLITIKASI[p["id"]]["alt"][0]
            g, c = ai.FIYAT[motor.SINIF_MODELI["metin"][bas]]
            eq(p["aylik"], round(g + c, 2), p["id"])
        ok(o["paketler"][0]["aylik"] <= o["paketler"][-1]["aylik"])
        eq(motor.onizleme(_cfg("S+"))["aktif"], "S+")
    test("onizleme olcumden tahmin eder, yazmaz",
         t_preview_writes_nothing_and_estimates_from_measurement)

    def t_account_errors_do_not_climb():
        """Anahtar reddi ya da bakiye yoksa ayni anahtarla ust basamak ayni
        hatayi alir: merdiven bosuna cikilmaz, tek cagri yapilir."""
        import io
        import urllib.error
        con = db.connect(":memory:")
        def red(*a, **k):
            raise urllib.error.HTTPError("u", 401, "x", {}, io.BytesIO(b'{"error":{"message":"bad key"}}'))
        t = _tasiyici(None)
        kayit = []
        def tas(provider, anahtar, model, sistem, mesajlar, ayar=None):
            kayit.append(model)
            red()
        r = ai.ask(con, _cfg("S"), "seviye.alt", "sohbet", _mesaj(), baglam="", sistem="s",
                   transport=tas, seviye="alt")
        no(r["ok"])
        eq(len(kayit), 1)
        ok("401" in r["note"])
    test("anahtar ve bakiye hatasinda merdiven cikilmaz", t_account_errors_do_not_climb)
