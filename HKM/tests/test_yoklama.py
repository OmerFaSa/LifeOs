# -*- coding: utf-8 -*-
"""Yoklama — Telegram mesajlarini SORARAK almak.

Bu paket bir ozelligi degil bir SOZU korur: iki yonlu sohbet icin HKM'yi
disariya acmak gerekmez. Ag'a CIKILMAZ; Telegram'in cevabi enjekte edilir.
"""

import json

from core import ai, channels, db, gelen, models, yoklama
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

    def t_409_has_two_causes():
        """409'un IKI sebebi var ve ikisi AYRI islerdir:
           · webhook tanimli               → yapilandirma
           · baska bir getUpdates calisiyor → es zamanlilik
        Ikisini tek cumleyle anlatmak, yanlis adimi tarif etmektir."""
        import io
        import urllib.error
        con = db.connect(":memory:")

        def _409(aciklama):
            govde = json.dumps({"ok": False, "description": aciklama})

            def patla(token, yol, veri=None, timeout=None):
                raise urllib.error.HTTPError(
                    yol, 409, "Conflict", None,
                    io.BytesIO(govde.encode("utf-8")))
            return patla

        eski = yoklama._cagir
        try:
            yoklama._cagir = _409(
                "Conflict: can't use getUpdates method while webhook is active")
            r = yoklama.tur(con, _cfg())
            eq(r["reason"], "http-409")
            ok("webhook" in r["note"].lower())

            yoklama._cagir = _409(
                "Conflict: terminated by other getUpdates request")
            r = yoklama.tur(con, _cfg())
            eq(r["reason"], "http-409")
            ok("başka bir yoklama" in r["note"].lower())
            no("webhook" in r["note"].lower())
        finally:
            yoklama._cagir = eski
    test("409'un iki sebebi ayri anlatilir", t_409_has_two_causes)

    def t_busy_is_not_an_error():
        """Arka plan dongusu uzun beklemedeyken «Simdi dene» ikinci bir
        getUpdates baslatir ve Telegram bunu 409 ile keser. Kilit ikisini
        siraya sokar; bekleyemeyen taraf bunu HATA diye degil «zaten
        calisiyor» diye bildirir — calisan bir seye «bozuk» demek."""
        con = db.connect(":memory:")
        yoklama._KILIT.acquire()
        try:
            r = yoklama.tur(con, _cfg(), bekle_kilit=0.05)
        finally:
            yoklama._KILIT.release()
        ok(r["ok"])                    # hata DEGIL
        ok(r["busy"])
        eq(r["handled"], 0)
        ok("zaten çalışıyor" in r["note"])
    test("mesgul olmak hata degildir", t_busy_is_not_an_error)

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

    def t_missing_step_is_named():
        """Eksigin ADI soylenir. «no-token» diyen bir hata, kullaniciya
        hangi adimi atladigini soylemez; eksik olan sey ile yapilacak is
        ayni cumlede durmali."""
        con = db.connect(":memory:")
        r = yoklama.tur(con, _cfg(bot_token=""))
        no(r["ok"])
        eq(r["reason"], "no-token")
        ok("kaydet" in r["note"].lower())

        r = yoklama.tur(con, _cfg(enabled=False))
        eq(r["reason"], "channel-off")
        ok("Aç" in r["note"])

        r = yoklama.tur(con, _cfg(allow_from=[]))
        eq(r["reason"], "no-allow")
        ok("İzin listesi" in r["note"])
    test("eksik adim adiyla soylenir", t_missing_step_is_named)

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

    def t_free_sentence_reaches_the_model():
        """Telegram'dan gelen SERBEST bir cumle, ekranla AYNI katmandan
        gecer: iki ayri cevap uretici olsaydi, ayni soruya iki farkli
        cevap veren bir sistem olurdu."""
        con = db.connect(":memory:")
        cfg = models.apply(_cfg(), {
            "keys": {"google": "AIza-test"},
            "assignments": {"king": {"provider": "google",
                                     "model": "gemini-2.5-flash"}}})
        cfg["budget"] = {"monthly_try": 850.0, "usd_try": 48.6,
                         "rate_date": BUGUN}
        gorulen = {}

        def sahte_model(provider, anahtar, model, sistem, mesajlar):
            gorulen["sistem"] = sistem
            gorulen["mesajlar"] = mesajlar
            return ("Bugün ölçümler düşük görünüyor; istersen hafif bir "
                    "gün önerebilirim.", 400, 60)

        eski_ai = ai._cagir
        eski = _kur(None, [{"ok": True, "result": [
            _guncelleme(1200, "bugün odaklanamadım, ne yapsam?")]}])
        try:
            # Ag'a CIKILMAZ: saglayicinin cevabi enjekte edilir.
            ai._cagir = sahte_model
            r = yoklama.tur(con, cfg, transport=_gonderim())
        finally:
            yoklama._cagir = eski
            ai._cagir = eski_ai
        eq(r["handled"], 1)
        eq(r["results"][0]["mode"], "model")
        ok(gorulen.get("sistem"))
        # Modelin gordugu TEK gercek: kural motorunun urettigi olculer.
        ok("Bugünün ölçümleri" in gorulen["sistem"])
        # Cevap GIDEN KUTUSUNDAN gecer.
        satir = con.execute("SELECT * FROM outbox").fetchall()
        eq(len(satir), 1)
        eq(satir[0]["target"], IZINLI)
    test("serbest cumle modele ulasir", t_free_sentence_reaches_the_model)

    def t_command_on_telegram_does_not_call_the_model():
        """ONCE KOMUT: «durum» yazildiginda modele GIDILMEZ. Ucretsiz,
        kesin ve her zaman ayni olan yol once denenir."""
        con = db.connect(":memory:")
        cfg = models.apply(_cfg(), {
            "keys": {"google": "AIza-test"},
            "assignments": {"king": {"provider": "google", "model": "m"}}})
        cagrildi = []

        def patla(*a):
            cagrildi.append(1)
            raise AssertionError("komut oldugu halde model cagrildi")

        eski_ai = ai._cagir
        eski = _kur(None, [{"ok": True, "result": [
            _guncelleme(1300, "durum")]}])
        try:
            ai._cagir = patla
            r = yoklama.tur(con, cfg, transport=_gonderim())
        finally:
            yoklama._cagir = eski
            ai._cagir = eski_ai
        eq(r["results"][0]["mode"], "komut")
        eq(len(cagrildi), 0)
    test("telegramda da once komut",
         t_command_on_telegram_does_not_call_the_model)
