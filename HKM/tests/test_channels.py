# -*- coding: utf-8 -*-
"""Kanallar ve Buyuk Patron — disari acilan tek yuzey, ve onun kilidi.

Bu paket ozellikle su dort seyi korur: varsayilan kapali, bos izin listesi
«kimse», imzasiz govde okunmaz, ve sir hicbir ciktida gorunmez.
"""

import hashlib
import hmac
import json

from core import channels as ch
from core import db, manager, patron, sync_engine
from tests.harness import eq, metric, no, ok, suite, test

BUGUN = "2026-09-13"
SIR = "uygulama-sirri"
CFG = {
    "channels": {
        "whatsapp": {"enabled": True, "phone_number_id": "555", "token": "JETON",
                     "app_secret": SIR, "verify_token": "DOGRULAMA",
                     "allow_from": ["905551112233"]},
    },
}


def _con():
    return db.connect(":memory:")


def _push(con, module, date, **metrics):
    return sync_engine.ingest(con, {"module": module, "date": date,
                                    "metrics": metrics}, now=date + "T09:00:00")


def _imza(govde):
    return "sha256=" + hmac.new(SIR.encode(), govde, hashlib.sha256).hexdigest()


def run():
    # Sabit tarihli senaryolar o gunu «bugun» diye yasar: yalniz bugunun
    # brifingi karar yazar (HATALAR D-3).
    from core import saat
    with saat.sabit(BUGUN):
        _run()


def _run():
    suite("kanal")

    def t_default_off():
        """Hicbir kanal kendiliginden acilmaz."""
        no(ch.enabled({}, "whatsapp"))
        no(ch.enabled({}, "telegram"))
        r = ch.send({}, "whatsapp", "merhaba", transport=lambda *a: (200, "{}"))
        eq(r["reason"], "off")
    test("kanallar varsayilan kapali", t_default_off)

    def t_telegram_media_becomes_attachment():
        g = {"message": {"message_id": 41, "chat": {"id": 123},
             "caption": "kan sonucu", "photo": [
                 {"file_id": "kucuk", "file_unique_id": "u1", "file_size": 12},
                 {"file_id": "buyuk", "file_unique_id": "u2", "file_size": 99}]}}
        m = ch.parse_telegram(g)[0]
        eq(m["text"], "kan sonucu")
        eq(m["attachment"]["kind"], "photo")
        eq(m["attachment"]["file_id"], "buyuk")
        eq(m["attachment"]["size"], 99)
    test("Telegram fotografi en buyuk surumuyle eke donusur",
         t_telegram_media_becomes_attachment)

    def t_telegram_document_without_text_is_kept():
        g = {"message": {"message_id": 42, "chat": {"id": 123},
             "document": {"file_id": "belge", "file_unique_id": "ub",
                          "file_name": "rapor.pdf", "mime_type": "application/pdf"}}}
        m = ch.parse_telegram(g)[0]
        eq(m["text"], "")
        eq(m["attachment"]["kind"], "document")
        eq(m["attachment"]["file_name"], "rapor.pdf")
    test("metinsiz Telegram belgesi sessizce atilmaz",
         t_telegram_document_without_text_is_kept)

    def t_enabled_needs_credentials():
        """«enabled» tek basina yetmez: eksik kimlikle kanal acik sayilmaz."""
        no(ch.enabled({"channels": {"whatsapp": {"enabled": True}}}, "whatsapp"))
    test("eksik kimlikle kanal acik sayilmaz", t_enabled_needs_credentials)

    def t_empty_allowlist_means_nobody():
        """Bos izin listesi «herkes» DEGIL «kimse» demektir."""
        cfg = {"channels": {"whatsapp": dict(CFG["channels"]["whatsapp"],
                                             allow_from=[])}}
        no(ch.allowed(cfg, "whatsapp", "905551112233"))
        # Alici verilmezse alici YOK; verilirse izinsiz. Ikisi de gonderim degil.
        eq(ch.send(cfg, "whatsapp", "x",
                   transport=lambda *a: (200, "{}"))["reason"], "no-target")
        eq(ch.send(cfg, "whatsapp", "x", to="905551112233",
                   transport=lambda *a: (200, "{}"))["reason"], "not-allowed")
    test("bos izin listesi kimse demektir", t_empty_allowlist_means_nobody)

    def t_unknown_number_not_answered():
        cagri = []
        r = ch.send(CFG, "whatsapp", "x", to="900000000000",
                    transport=lambda *a: (cagri.append(a), (200, "{}"))[1])
        eq(r["reason"], "not-allowed")
        eq(len(cagri), 0)
    test("izinsiz numaraya gonderim yapilmaz", t_unknown_number_not_answered)

    def t_send_shape_and_no_secret_leak():
        cagri = []

        def t(url, govde, bas):
            cagri.append((url, govde, bas))
            return 200, '{"messages":[{"id":"wamid.X"}]}'
        r = ch.send(CFG, "whatsapp", "merhaba", transport=t)
        ok(r["ok"])
        url, govde, bas = cagri[0]
        ok(url.endswith("/555/messages"))
        eq(govde["to"], "905551112233")
        eq(govde["text"]["body"], "merhaba")
        eq(bas["Authorization"], "Bearer JETON")
        # Sir donen ozette GORUNMEZ.
        metin = json.dumps(r, ensure_ascii=False)
        no("JETON" in metin, "jeton ciktiya sizdi")
        no(SIR in metin, "uygulama sirri ciktiya sizdi")
    test("gonderim bicimi dogru ve sir sizmaz", t_send_shape_and_no_secret_leak)

    def t_network_failure_is_a_state():
        def patlak(*a):
            raise RuntimeError("bu asla gorunmemeli")
        try:
            r = ch.send(CFG, "whatsapp", "x", transport=lambda *a: (0, "URLError"))
        except Exception as e:
            ok(False, "kanal firlatti: %s" % e)
            return
        eq(r["ok"], False)
        eq(r["status"], 0)
    test("ag hatasi firlatmaz, durum olur", t_network_failure_is_a_state)

    def t_signature_required():
        """Imza dogrulanmadan govde AYRISTIRILMAZ."""
        govde = b'{"entry":[]}'
        ok(ch.verify_signature(SIR, govde, _imza(govde)))
        no(ch.verify_signature(SIR, govde, "sha256=deadbeef"))
        no(ch.verify_signature(SIR, govde, ""))
        no(ch.verify_signature("", govde, _imza(govde)))
        # Tek bayt degisirse imza duser.
        no(ch.verify_signature(SIR, b'{"entry":[1]}', _imza(govde)))
    test("imzasiz ya da bozuk govde kabul edilmez", t_signature_required)

    def t_challenge_only_with_right_token():
        eq(ch.verify_challenge(CFG, {"hub.mode": ["subscribe"],
                                     "hub.verify_token": ["DOGRULAMA"],
                                     "hub.challenge": ["12345"]}), "12345")
        eq(ch.verify_challenge(CFG, {"hub.mode": ["subscribe"],
                                     "hub.verify_token": ["yanlis"],
                                     "hub.challenge": ["12345"]}), None)
        eq(ch.verify_challenge({}, {"hub.mode": ["subscribe"],
                                    "hub.verify_token": [""],
                                    "hub.challenge": ["1"]}), None)
    test("kurulum dogrulamasi yalniz dogru jetonla yansitir",
         t_challenge_only_with_right_token)

    def t_parsers_do_not_invent():
        eq(ch.parse_whatsapp({}), [])
        eq(ch.parse_whatsapp({"entry": [{"changes": [{"value": {}}]}]}), [])
        mesajlar = ch.parse_whatsapp({"entry": [{"changes": [{"value": {"messages": [
            {"type": "text", "from": "905551112233", "text": {"body": "durum"},
             "id": "wamid.1"},
            {"type": "image", "from": "905551112233", "id": "wamid.2"}]}}]}]})
        eq(len(mesajlar), 1)
        eq(mesajlar[0]["text"], "durum")
        eq(ch.parse_telegram({"message": {"chat": {"id": 7}, "text": "durum"}})[0]["from"], "7")
        eq(ch.parse_telegram({}), [])
    test("ayristiricilar uydurmaz", t_parsers_do_not_invent)

    def t_telegram_secret_required():
        """Sir tanimli degilse webhook KAPALIDIR: «sir yoksa herkese acik»
        bir varsayilan, sessiz bir acik kapidir."""
        cfg = {"channels": {"telegram": {"enabled": True, "bot_token": "B",
                                         "webhook_secret": "S",
                                         "allow_from": ["7"]}}}
        ok(ch.verify_telegram_secret(cfg, "S"))
        no(ch.verify_telegram_secret(cfg, "yanlis"))
        no(ch.verify_telegram_secret(cfg, ""))
        no(ch.verify_telegram_secret({"channels": {"telegram": {"enabled": True}}}, "S"))
    test("telegram gizli basligi zorunlu", t_telegram_secret_required)

    def t_long_message_is_split_not_dropped():
        """KANALIN KENDI SINIRI KANALIN SORUNUDUR.

        Telegram 4096 karakterden uzun mesaji reddeder (400) ve kullanici
        «gonderilemedi» goruyordu: cevabin tamami hazirdi, yalnizca tek
        parca halinde sigmiyordu. Kirpmak da cozum degil — sorunun
        cevabini yarim vermek, vermemenin kibar bicimidir."""
        cfg = {"local_token": "x", "channels": {"telegram": {
            "enabled": True, "bot_token": "t", "allow_from": ["1"]}}}
        gonderilen = []

        def t(url, govde, basliklar):
            gonderilen.append(govde.get("text") or "")
            return 200, '{"ok":true}'

        uzun = "Bu cumle olcume dayanir. " * 400      # ~10.000 karakter
        r = ch.send(cfg, "telegram", uzun, to="1", transport=t)
        ok(r["ok"])
        ok(len(gonderilen) > 1, "uzun mesaj bolunmedi")
        eq(r["parts"], len(gonderilen))
        for parca in gonderilen:
            ok(len(parca) <= ch.SINIR["telegram"], len(parca))
        # HICBIR SEY KAYBOLMAZ: parcalarin toplami metni tasir.
        butun = " ".join(p.split("\n\n(")[0] for p in gonderilen)
        eq(butun.replace(" ", ""), uzun.replace(" ", ""))
        ok("(1/%d)" % len(gonderilen) in gonderilen[0])
    test("uzun mesaj bolunur, dusurulmez", t_long_message_is_split_not_dropped)

    def t_short_message_is_not_split():
        """Bolme yalnizca GEREKTIGINDE: kisa bir mesaja parca numarasi
        eklemek, olmayan bir sorunu gorunur kilardi."""
        cfg = {"local_token": "x", "channels": {"telegram": {
            "enabled": True, "bot_token": "t", "allow_from": ["1"]}}}
        gonderilen = []

        def t(url, govde, basliklar):
            gonderilen.append(govde.get("text") or "")
            return 200, '{"ok":true}'

        ch.send(cfg, "telegram", "selam", to="1", transport=t)
        eq(gonderilen, ["selam"])
    test("kisa mesaj bolunmez", t_short_message_is_not_split)

    def t_split_stops_on_failure():
        """Bir parca gitmediyse GERISI DE GONDERILMEZ: yarim teslim
        edilmis bir metin, sirasi bozuk okunur."""
        cfg = {"local_token": "x", "channels": {"telegram": {
            "enabled": True, "bot_token": "t", "allow_from": ["1"]}}}
        say = {"n": 0}

        def t(url, govde, basliklar):
            say["n"] += 1
            return (200, '{"ok":true}') if say["n"] == 1 else (400, '{"ok":false}')

        r = ch.send(cfg, "telegram", "Cumle. " * 900, to="1", transport=t)
        no(r["ok"])
        eq(say["n"], 2)                     # ucuncuye GECILMEDI
        ok("durduruldu" in r["note"])
    test("bir parca gitmezse gerisi durur", t_split_stops_on_failure)


    def t_answer_to_a_question_is_not_trimmed():
        """PROAKTIF mesaj kisa olmali; SORULAN bir sorunun cevabi
        kirpilmamali.

        Ikisi bir sure ayni sinira tabiydi ve «hafta» diye soran
        kullanici raporun 900. karakterinde «…» goruyordu. Sorunun
        cevabini yarim vermek, vermemenin kibar bicimidir — ustelik uzun
        cevap artik kanal katmaninda parcalara bolunuyor."""
        con = db.connect(":memory:")
        for gun in ("2026-09-08", "2026-09-09", "2026-09-10"):
            sync_engine.ingest(con, {"module": "ays", "date": gun, "metrics": {
                "questions": metric(120), "study_minutes": metric(300),
                "mock_net": metric(78.5)}}, now=gun + "T20:00:00")
            sync_engine.ingest(con, {"module": "spi", "date": gun, "metrics": {
                "sleep_hours": metric(4.2), "recovery": metric(28, "computed"),
                "hrv": metric(31)}}, now=gun + "T08:00:00")
        r = patron.respond(con, "hafta", date="2026-09-10")
        no(r["text"].endswith("…"), "cevap kirpildi")
    test("sorulan sorunun cevabi kirpilmaz",
         t_answer_to_a_question_is_not_trimmed)

    suite("patron")

    def t_commands_are_closed_set():
        """Serbest metin YORUMLANMAZ."""
        eq(patron.parse("durum"), "durum")
        eq(patron.parse("Kabul"), "kabul")
        eq(patron.parse("neden böyle"), "neden")
        eq(patron.parse("bugün ne yapsam acaba"), None)
        eq(patron.parse("etki"), "etki")
        eq(patron.parse(""), None)
    test("komut seti kucuk ve kapali", t_commands_are_closed_set)

    def t_unknown_message_says_so():
        con = _con()
        r = patron.respond(con, "merhaba nasılsın", date=BUGUN)
        eq(r["command"], None)
        ok("Anlamadım" in r["text"])
    test("anlasilmayan mesaj anlasilmis gibi yapilmaz", t_unknown_message_says_so)

    def t_daily_message_is_advisory_and_short():
        con = _con()
        _push(con, "spi", BUGUN, sleep_hours=metric(4.0))
        m = patron.daily_message(con, BUGUN)
        ok(m["ok"])
        no(manager.imperatives(m["text"]))
        ok(len(m["text"]) <= patron.MAX_CHARS)
        ok("HKM · " + BUGUN in m["text"])
    test("gunun mesaji kisa ve oneri kipinde", t_daily_message_is_advisory_and_short)

    def t_accept_and_decline_through_channel():
        con = _con()
        _push(con, "spi", BUGUN, sleep_hours=metric(4.0))
        patron.daily_message(con, BUGUN)          # oneri yazilir
        r = patron.respond(con, "kabul", date=BUGUN)
        eq(r["command"], "kabul")
        ok(db.current_decision(con, BUGUN))
        # Ikinci kez cevaplanacak acik oneri yok.
        r2 = patron.respond(con, "ret", date=BUGUN)
        ok("açık bir öneri yok" in r2["text"])
    test("oneri kanaldan cevaplanabilir", t_accept_and_decline_through_channel)

    def t_reason_names_sources():
        con = _con()
        _push(con, "spi", BUGUN, sleep_hours=metric(4.0))
        patron.daily_message(con, BUGUN)
        r = patron.respond(con, "neden", date=BUGUN)
        ok("SPİ" in r["text"])
        ok("Öncelik" in r["text"])
    test("«neden» dayanagi soyler", t_reason_names_sources)

    def t_impact_command_says_not_yet_measured():
        """«Etki» komutu, olculmemis faydayi «fayda yok» diye sunmaz."""
        con = _con()
        r = patron.respond(con, "etki", date=BUGUN)
        eq(r["command"], "etki")
        ok("HENÜZ ÖLÇÜLMEDİ" in r["text"])
    test("«etki» komutu olcumu oldugu gibi soyler",
         t_impact_command_says_not_yet_measured)

    def t_conversation_is_logged():
        con = _con()
        patron.respond(con, "yardim", date=BUGUN)
        kayit = patron.history(con)
        eq(len(kayit), 2)
        eq(kayit[0]["role"], "user")
        eq(kayit[1]["role"], "manager")
        eq(kayit[0]["audio_retained"], 0)
    test("konusma kaydedilir, ses saklanmaz", t_conversation_is_logged)

    def t_once_a_day():
        con = _con()
        _push(con, "spi", BUGUN, sleep_hours=metric(4.0))
        m = patron.daily_message(con, BUGUN)
        patron.log(con, "whatsapp", "manager", m["text"], BUGUN + "T09:00:00")
        ok(patron.already_sent(con, BUGUN, "whatsapp"))
        no(patron.already_sent(con, BUGUN, "telegram"))
        no(patron.already_sent(con, "2026-09-14", "whatsapp"))
    test("gunde tek mesaj", t_once_a_day)

    def t_patron_has_no_model_layer():
        import os
        yol = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                           "core", "patron.py")
        with open(yol, encoding="utf-8") as f:
            satirlar = [s for s in f.read().splitlines()
                        if s.startswith(("import ", "from "))]
        for s in satirlar:
            for yasakli in ("openai", "anthropic", "llm", "urllib", "http.client"):
                no(yasakli in s.lower(), "Patron'a ag/model katmani sizdi: " + s)
    test("Patron model ve ag katmani import etmez", t_patron_has_no_model_layer)


def run_bot():
    """Telegram botunun kullanim yuzeyi."""
    from core import schedule, yoklama
    suite("bot")

    def t_slash_and_botname():
        """Telegram komutlari «/» ile baslar ve GRUPLARDA bot adini ekler.
        Bunu tanimamak, grupta hicbir komutun calismamasi demekti."""
        eq(patron.parse("/durum"), "durum")
        eq(patron.parse("/durum@altay_hkm_bot"), "durum")
        eq(patron.parse("/KABUL@bot"), "kabul")
        eq(patron.parse("/olmayan@bot"), None)
    test("egik cizgi ve bot adi tanini", t_slash_and_botname)

    def t_start_answers():
        """Cevapsiz birakilan bir /start, botun bozuk oldugunu dusundurur:
        kullanicinin ilk yazdigi sey budur."""
        con = _con()
        r = patron.respond(con, "/start", date=BUGUN)
        eq(r["command"], "basla")
        ok("HKM" in r["text"])
        ok("durum" in r["text"])          # komutlari sayar
        ok("onayını bekler" in r["text"])  # ne YAPMADIGINI da soyler
    test("basla komutu karsilar", t_start_answers)

    def t_greeting_is_not_a_command():
        """Gunluk kelimeler kapali kumeye KONMAZ: ilk kelimesi selam olan
        her cumle anlasilmis sayilirdi."""
        con = _con()
        eq(patron.respond(con, "merhaba nasılsın", date=BUGUN)["command"], None)
        eq(patron.parse("selam"), None)
    test("selam bir komut degildir", t_greeting_is_not_a_command)

    def t_schedule_channel_follows_open_one():
        """Sabit «whatsapp» varsayilani, yalnizca Telegram kuran
        kullanicinin mesajlarini hicbir yere gitmeyen bir kuyruga
        yaziyordu."""
        eq(schedule.settings({})["channel"], "")
        tg = {"channels": {"telegram": {"enabled": True, "bot_token": "t",
                                        "allow_from": ["1"]}}}
        eq(schedule.acik_kanal(tg), "telegram")
        wa = {"channels": {"whatsapp": {"enabled": True, "token": "t",
                                        "phone_number_id": "1",
                                        "allow_from": ["1"]}}}
        eq(schedule.acik_kanal(wa), "whatsapp")
        # Ikisi de aciksa yoklama ile calisan, hicbir kapi acmayan yol
        # once gelir.
        ikisi = {"channels": dict(tg["channels"], **wa["channels"])}
        eq(schedule.acik_kanal(ikisi), "telegram")
        eq(schedule.acik_kanal({}), "")
    test("zamanlanmis mesaj acik kanala gider",
         t_schedule_channel_follows_open_one)

    def t_no_channel_is_named():
        """Kanal yoksa mesaj uretilmez ve SEBEBI yazilir."""
        con = _con()
        r = schedule.run(con, {}, {"kind": "morning", "at": "08:00"})
        no(r["ok"])
        eq(r["reason"], "no-channel")
    test("kanal yoksa sebebi soylenir", t_no_channel_is_named)

    def t_command_menu_from_one_list():
        """Iki yerde iki komut listesi olsaydi, bir komut eklendiginde biri
        eksik kalirdi."""
        r = yoklama.komut_menusu({"channels": {"telegram": {"bot_token": ""}}})
        no(r["ok"])
        eq(r["reason"], "no-token")
    test("komut menusu tek listeden uretilir", t_command_menu_from_one_list)
