# -*- coding: utf-8 -*-
"""Model merdiveni (KING-4 A6): kolay is yerelde, zor is bulutta; bulut
kotasi dolunca yerele dusulur ve pencere boyunca bulut denenmez. Karar ve
dusus `usage.seviye/neden` alanlarina yazilir, ai_olcum'da gorunur.

Kanitlanan sozler:
  1. Zorluk modelsizdir: dongunun 2.+ adimi, uzun baglam ve ust/arastirma
     bulut; geri kalan yerel.
  2. Hibritte elle bulut atamasi olsa da kolay is yerelden baslar; zor is
     buluttan baslar, yerel sonda yedek.
  3. 429/RESOURCE_EXHAUSTED: cevabi yerel verir, pencere icinde bulut hic
     cagrilmaz, pencere bitince yine denenir.
  4. Yerel model yoksa kota durumu soylenir (sessiz bekleme yok).
  5. Yerel modda bulut yine hic kullanilmaz.
"""

import datetime
import io
import json
import time
import urllib.error

from core import ai, butce, db, models, motor, seviye
from tests.harness import eq, no, ok, suite, test

KOTA_GOVDE = json.dumps({"error": {"message": "RESOURCE_EXHAUSTED: Quota exceeded. Please retry in 120s."}}).encode()


def _cfg(yer="hibrit", yerel=True):
    cfg = {"local_token": "x", "budget": {"ceiling_currency": "usd", "monthly_usd": 20.0}}
    yama = {"keys": {"google": "g-test"}, "yer": yer,
            "assignments": {"king": {"provider": "google", "model": "gemini-3.6-flash"}}}
    if yerel:
        yama["yerel"] = {"ekonomik": "gemma4:e2b"}
    return models.apply(cfg, yama)


def _tas(kota=False):
    kayit = []

    def t(provider, anahtar, model, sistem, mesajlar, ayar=None):
        kayit.append(provider)
        if kota and provider == "google":
            raise urllib.error.HTTPError("u", 429, "x", {}, io.BytesIO(KOTA_GOVDE))
        return "Tamam.", 10, 3
    t.kayit = kayit
    return t


def _sor(con, cfg, t, seviye_=None, adim=0):
    return ai.ask(con, cfg, "king", "sohbet", [{"role": "user", "content": "merhaba"}],
                  baglam="", sistem="s", transport=t, seviye=seviye_, adim=adim)


def run():
    suite("model merdiveni (A6)")

    def t_zorluk():
        eq(seviye.zorluk("alt")["seviye"], "yerel")
        eq(seviye.zorluk("orta")["seviye"], "yerel")
        eq(seviye.zorluk("ust")["seviye"], "bulut")
        eq(seviye.zorluk("arastirma")["seviye"], "bulut")
        eq(seviye.zorluk("alt", adim=2)["seviye"], "bulut")
        eq(seviye.zorluk("alt", adim=1)["seviye"], "yerel")
        eq(seviye.zorluk("alt", jeton=seviye.UZUN_BAGLAM + 1)["seviye"], "bulut")
        ok("döngü" in seviye.zorluk("alt", adim=3)["neden"])
    test("zorluk modelsiz: döngü 2+, uzun bağlam, üst bulut", t_zorluk)

    def t_hibrit_dizilis():
        motor.kota_sifirla()
        k = motor.merdiven(None, _cfg(), "king", seviye="alt")
        eq([b["atama"]["provider"] for b in k["basamaklar"]], ["yerel", "google"])
        eq(k["karar"]["seviye"], "yerel")
        eq(k["basamaklar"][0]["bulut_yedek"]["atama"]["model"], "gemini-3.6-flash")
        z = motor.merdiven(None, _cfg(), "king", seviye="ust")
        eq([b["atama"]["provider"] for b in z["basamaklar"]], ["google", "yerel"])
        ok(z["basamaklar"][-1]["yedek"])
        eq(z["karar"]["seviye"], "bulut")
        d = motor.merdiven(None, _cfg(), "king", seviye="alt", adim=2)
        eq(d["basamaklar"][0]["atama"]["provider"], "google")
        # Bulut modunda kolay is de bulutta; yerel yalniz yedek.
        b = motor.merdiven(None, _cfg("bulut"), "king", seviye="alt")
        eq([x["atama"]["provider"] for x in b["basamaklar"]], ["google", "yerel"])
    test("hibrit: kolay yerelden, zor buluttan; sonda yerel yedek", t_hibrit_dizilis)

    def t_kota_dususu():
        motor.kota_sifirla()
        con = db.connect(":memory:")
        t = _tas(kota=True)
        r = _sor(con, _cfg(), t, "ust")
        ok(r["ok"])
        eq(t.kayit, ["google", "yerel"])
        ok("kotası dolu" in r["motor"]["kat_neden"])
        ok("google" in motor.kota_durumu())
        # Pencere icinde bulut hic denenmez: zor is de yerelde.
        t2 = _tas()
        r2 = _sor(con, _cfg(), t2, "ust")
        ok(r2["ok"])
        eq(t2.kayit, ["yerel"])
        o = butce.ai_olcum(con)
        eq({s["seviye"]: s["cagri"] for s in o["seviyeler"]}, {"bulut": 1, "yerel": 2})
        ok(len(o["dususler"]) >= 2 and all(d["neden"].startswith("düşüş") for d in o["dususler"]))
        # Pencere bitince bulut yine denenir.
        eq(motor.kota_durumu(simdi=time.time() + 121), {})
        motor.kota_sifirla()
        t3 = _tas()
        _sor(con, _cfg(), t3, "ust")
        eq(t3.kayit, ["google"])
    test("429: yerel devralır, pencere boyunca bulut denenmez", t_kota_dususu)

    def t_kota_yerelsiz():
        motor.kota_sifirla()
        motor.kota_isaretle("google", "HTTP 429 retry in 10 minutes")
        r = _sor(db.connect(":memory:"), _cfg("bulut", yerel=False), _tas(), "alt")
        no(r["ok"])
        eq(r["reason"], "kota")
        ok("kotası dolu" in r["note"])
        motor.kota_sifirla()
    test("yerel model yoksa kota söylenir", t_kota_yerelsiz)

    def t_yerel_mod():
        motor.kota_sifirla()
        cfg = models.apply(_cfg("yerel"), {"assignments": {"king": {"provider": "", "model": ""}}})
        t = _tas()
        r = _sor(db.connect(":memory:"), cfg, t, "ust")
        ok(r["ok"])
        eq(t.kayit, ["yerel"])
    test("yerel mod: bulut hiç kullanılmaz", t_yerel_mod)

    def t_pencere():
        eq(motor.kota_penceresi("Please retry in 41.2s."), 60)
        eq(motor.kota_penceresi("try again in 2h"), 7200)
        eq(motor.kota_penceresi("resets in 45 minutes"), 2700)
        eq(motor.kota_penceresi("HTTP 429"), motor.KOTA_PENCERE)
        eq(motor.kota_penceresi("retry in 99 hours"), 86400)
    test("kota penceresi hata metninden", t_pencere)

    def t_kart_cumlesi():
        from core import kendiliginden
        motor.kota_sifirla()
        t = _tas()
        r = kendiliginden.kart_cumlesi(db.connect(":memory:"), _cfg(), {"tur": "brifing", "satirlar": ["Uyku: 6,2 saat (ölçüldü)"]},
                                       transport=t)
        ok(r["ok"])
        eq(r["kat"], "yerel")
        eq(t.kayit, ["yerel"])
        no(kendiliginden.kart_cumlesi(None, _cfg(), {"tur": "x", "satirlar": ["a"]})["ok"])
        no(kendiliginden.kart_cumlesi(None, _cfg(), {"tur": "hafta", "satirlar": []})["ok"])
    test("kart cümlesi: kolay iş yerelde, biçim denetlenir", t_kart_cumlesi)
