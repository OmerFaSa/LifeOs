# -*- coding: utf-8 -*-
"""Yoklama — Telegram mesajlarini SORARAK almak.

Bu paket bir ozelligi degil bir SOZU korur: iki yonlu sohbet icin HKM'yi
disariya acmak gerekmez. Ag'a CIKILMAZ; Telegram'in cevabi enjekte edilir.
"""

import json

from core import channels, db, gelen, yoklama
from tests.harness import eq, no, ok, suite, test

BUGUN = "2026-09-14"
IZINLI = "123456789"


def _cfg(**ek):
    t = {"enabled": True, "bot_token": "sahte:jeton", "polling": True,
         "allow_from": [IZINLI], "api_base": "http://127.0.0.1:4997"}
    t.update(ek)
    return {"local_token": "x", "channels": {"telegram": t}}


def _guncelleme(uid, metin, sohbet=IZINLI, mid=None):
    return {"update_id": uid,
            "message": {"message_id": mid if mid is not None else uid,
                        "text": metin, "chat": {"id": int(sohbet)}}}


def _sahte_api(yanitlar):
    """_cagir yerine gecen tasiyici: ag'a cikilmaz."""
    cagrilar = []

    def sahte(token, yol, veri=None, timeout=None):
        cagrilar.append(yol)
        if yol.startswith("deleteWebhook"):
            return {"ok": True, "result": True}
        return yanitlar.pop(0) if yanitlar else {"ok": True, "result": []}
    sahte.cagrilar = cagrilar
    return sahte


# channels.send'in tasiyicisi DUSUK seviyedir: (url, govde, basliklar) alir
# ve (durum, yanit) dondurur. Ag'a cikilmaz.
def _gonderim(durum=200):
    def t(url, govde, basliklar):
        return durum, '{"ok":true}'
    return t


def _kur(monkey, yanitlar):
    eski = yoklama._cagir
    yoklama._cagir = _sahte_api(yanitlar)
    return eski


def run():
    suite("yoklama")

    def t_default_off():
        """Yoklama, kullanicinin ACIKCA actigi bir seydir."""
        no(yoklama.acik_mi({"local_token": "x"}))
        no(yoklama.acik_mi(_cfg(polling=False)))
        no(yoklama.acik_mi(_cfg(bot_token="")))
        no(yoklama.acik_mi(_cfg(enabled=False)))
        ok(yoklama.acik_mi(_cfg()))
    test("varsayilan kapali", t_default_off)

    def t_message_becomes_reply_in_outbox():
        """Gelen mesaj komuta cevrilir ve cevap GIDEN KUTUSUNA yazilir."""
        con = db.connect(":memory:")
        eski = _kur(None, [{"ok": True, "result": [
            _guncelleme(101, "durum")]}])
        try:
            r = yoklama.tur(con, _cfg(), transport=_gonderim(0))
        finally:
            yoklama._cagir = eski
        ok(r["ok"])
        eq(r["handled"], 1)
        ok(r["results"][0]["queued"])
        satir = con.execute("SELECT * FROM outbox").fetchall()
        eq(len(satir), 1)
        ok(satir[0]["kind"].startswith("reply:"))
        eq(satir[0]["target"], IZINLI)
    test("gelen mesaj cevabi kuyruga yazar", t_message_becomes_reply_in_outbox)

    def t_offset_survives_restart():
        """Bellekteki bir imlec, tam da yeniden baslatma aninda kaybolur ve
        ayni mesajlar bir daha islenirdi."""
        con = db.connect(":memory:")
        eski = _kur(None, [{"ok": True, "result": [_guncelleme(500, "durum")]}])
        try:
            yoklama.tur(con, _cfg(), transport=_gonderim())
        finally:
            yoklama._cagir = eski
        eq(yoklama._imlec_oku(con), 500)

        # «Yeniden baslatma»: ayni con, yeni bir tur. Istek offset+1 ile
        # gitmeli — ayni guncelleme bir daha gelmez.
        istekler = []

        def izle(token, yol, veri=None, timeout=None):
            istekler.append(yol)
            return {"ok": True, "result": []}
        eski = yoklama._cagir
        yoklama._cagir = izle
        try:
            yoklama.tur(con, _cfg())
        finally:
            yoklama._cagir = eski
        ok("offset=501" in istekler[0])
    test("imlec yeniden baslatmayi asar", t_offset_survives_restart)

    def t_same_update_not_processed_twice():
        """Ayni guncelleme iki kez okunursa komut iki kez calismamali."""
        con = db.connect(":memory:")
        g = _guncelleme(700, "durum")
        for _ in range(2):
            eski = _kur(None, [{"ok": True, "result": [g]}])
            try:
                yoklama._imlec_yaz(con, 0)      # imleci geri al: tekrar gelsin
                r = yoklama.tur(con, _cfg(), transport=_gonderim())
            finally:
                yoklama._cagir = eski
        # Ikinci turda mesaj GELDI ama ISLENMEDI.
        ok(r["results"][0].get("duplicate"))
        kullanici = con.execute(
            "SELECT COUNT(*) n FROM conversations WHERE role='user'").fetchone()
        eq(kullanici["n"], 1)
    test("ayni guncelleme iki kez islenmez", t_same_update_not_processed_twice)

    def t_unknown_sender_content_not_stored():
        """Tanimayan gonderenin ICERIGI ambara girmez."""
        con = db.connect(":memory:")
        gizli = "bu-cumle-ambara-girmemeli"
        eski = _kur(None, [{"ok": True, "result": [
            _guncelleme(900, gizli, sohbet="999999999")]}])
        try:
            r = yoklama.tur(con, _cfg())
        finally:
            yoklama._cagir = eski
        eq(r["results"][0]["reason"], "not-allowed")
        butun = " ".join(x["text"] for x in con.execute(
            "SELECT text FROM conversations"))
        no(gizli in butun)
    test("izinsiz gonderenin icerigi yazilmaz",
         t_unknown_sender_content_not_stored)

    def t_webhook_conflict_is_named():
        """409, ag hatasi degil YAPILANDIRMA hatasidir ve tekrar denemek
        duzeltmez; soylenmesi gerekir."""
        import urllib.error
        con = db.connect(":memory:")

        def patla(token, yol, veri=None, timeout=None):
            raise urllib.error.HTTPError(yol, 409, "Conflict", None, None)
        eski = yoklama._cagir
        yoklama._cagir = patla
        try:
            r = yoklama.tur(con, _cfg())
        finally:
            yoklama._cagir = eski
        no(r["ok"])
        eq(r["reason"], "http-409")
        ok("webhook" in r["note"].lower())
    test("webhook catismasi adiyla soylenir", t_webhook_conflict_is_named)

    def t_network_error_is_a_result():
        """Hata da bir SONUCTUR, sessiz bir bosluk degil."""
        con = db.connect(":memory:")

        def patla(token, yol, veri=None, timeout=None):
            raise OSError("ag yok")
        eski = yoklama._cagir
        yoklama._cagir = patla
        try:
            r = yoklama.tur(con, _cfg())
        finally:
            yoklama._cagir = eski
        no(r["ok"])
        eq(r["handled"], 0)
        ok(r["reason"])
    test("ag hatasi sonuc olarak doner", t_network_error_is_a_result)

    def t_no_token_no_poll():
        con = db.connect(":memory:")
        r = yoklama.tur(con, _cfg(bot_token=""))
        no(r["ok"])
        eq(r["reason"], "no-token")
    test("jeton yoksa yoklama yok", t_no_token_no_poll)

    def t_one_path_for_both_doors():
        """Webhook ve yoklama AYNI isleme yolundan gecer: kopyalanan bir
        mantik, bir gun yalniz bir kapida duzeltilir."""
        con = db.connect(":memory:")
        r = gelen.isle(con, _cfg(), "telegram",
                       {"from": IZINLI, "text": "durum", "id": 4242},
                       transport=_gonderim())
        ok(r["queued"])
        # Ikinci kez: ayni kimlik islenmez.
        r2 = gelen.isle(con, _cfg(), "telegram",
                        {"from": IZINLI, "text": "durum", "id": 4242})
        ok(r2["duplicate"])
    test("iki kapi tek isleme yolu", t_one_path_for_both_doors)
