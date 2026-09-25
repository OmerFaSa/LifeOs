# -*- coding: utf-8 -*-
"""Daemon — yollar, yetki ve gercek bir HTTP istegi.

   Cekirdek fonksiyonlari test etmek yetmez: bu katmanin hatalari yol
   eslestirmede, yetki kontrolunde ve durum kodlarinda cikar. Bu yuzden
   burada gercek bir soket acilir — yalniz 127.0.0.1'de, gecici bir port
   ve bellekte degil gecici dosyada bir veritabaniyla.
"""

import hashlib
import hmac
import json
import os
import tempfile
import threading
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

import daemon
from core import channels, db, thresholds
from tests.harness import eq, metric, no, ok, suite, test

TOKEN = "test-token-uzun-ve-rastgele"
WA_SIR = "webhook-uygulama-sirri"
IZINLI = "905551112233"
BUGUN = "2026-09-13"


class _Server(object):
    def __init__(self):
        self.dir = tempfile.mkdtemp(prefix="hkm-test-")
        self.db_path = os.path.join(self.dir, "hkm.db")
        db.connect(self.db_path).close()
        self.srv = ThreadingHTTPServer(("127.0.0.1", 0), daemon.Handler)
        self.srv.config = {"local_token": TOKEN, "channels": {"whatsapp": {
            "enabled": True, "phone_number_id": "555", "token": "WAJETON",
            "app_secret": WA_SIR, "verify_token": "WADOGRULAMA",
            "allow_from": [IZINLI],
            # Test AGA CIKMAZ: taban adres kapali bir yerel porta bakar.
            # Gercek bir servise istek atan birim testi, olcmedigi bir seye
            # bagli olur ve cevrimdisi ortamda sessizce yavaslar.
            "api_base": "http://127.0.0.1:4997"}}}
        self.srv.local = threading.local()
        self.srv.db_path = self.db_path
        # Ayar yazma yolu GECICI: bir test kosumu kullanicinin
        # config.json'unu asla degistirmemeli.
        self.srv.config_path = os.path.join(self.dir, "config.json")
        self.srv.thresholds = thresholds.DEFAULTS
        self.port = self.srv.server_address[1]
        self.thread = threading.Thread(target=self.srv.serve_forever, daemon=True)
        self.thread.start()

    def url(self, yol):
        return "http://127.0.0.1:%d%s" % (self.port, yol)

    def ham(self, yol, govde, basliklar, method="POST"):
        """Imzali/imzasiz ham govde — webhook yolu JSON yardimcisini
        kullanamaz, cunku imza BAYTLAR uzerinden hesaplanir."""
        req = urllib.request.Request(self.url(yol), data=govde, method=method)
        for k, v in (basliklar or {}).items():
            req.add_header(k, v)
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                return r.status, (r.read() or b"").decode("utf-8")
        except urllib.error.HTTPError as e:
            return e.code, (e.read() or b"").decode("utf-8")

    def call(self, yol, body=None, token=TOKEN, method=None):
        data = None if body is None else json.dumps(body).encode("utf-8")
        req = urllib.request.Request(self.url(yol), data=data,
                                     method=method or ("POST" if data is not None else "GET"))
        if token:
            req.add_header("Authorization", "Bearer " + token)
        req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                return r.status, json.loads(r.read() or b"{}")
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read() or b"{}")

    def srv_read_body_test(self):
        """_read_body'yi izole cagirir: negatif uzunluk okunmamali."""
        class SahteBaslik(dict):
            def get(self, k, d=None):
                return "-1" if k == "Content-Length" else d

        class SahteIstek(object):
            headers = SahteBaslik()
            rfile = None

            def __init__(self, sunucu):
                self.server = sunucu
        istek = SahteIstek(self.srv)
        return daemon.Handler._read_body(istek)

    def close(self):
        self.srv.shutdown()
        self.srv.server_close()


def run():
    # Sabit tarihli senaryolar o gunu «bugun» diye yasar: yalniz bugunun
    # brifingi karar yazar (HATALAR D-3).
    from core import saat
    with saat.sabit(BUGUN):
        _run()


def _run():
    suite("daemon")
    S = _Server()
    try:
        def t_health_needs_no_token():
            kod, govde = S.call("/api/health", token=None)
            eq(kod, 200)
            ok(govde["ok"])
        test("saglik ucnoktasi token istemez", t_health_needs_no_token)

        def t_everything_else_needs_token():
            for yol in ("/api/briefing", "/api/twin", "/api/decisions"):
                kod, _ = S.call(yol, token=None)
                eq(kod, 401, yol)
            kod, _ = S.call("/api/sync/ays", body={"date": BUGUN}, token=None)
            eq(kod, 401)
        test("token olmadan hicbir yol acilmaz", t_everything_else_needs_token)

        def t_wrong_token_rejected():
            kod, _ = S.call("/api/briefing", token="yanlis")
            eq(kod, 401)
        test("yanlis token reddedilir", t_wrong_token_rejected)

        def t_unlabeled_rejected_422():
            kod, govde = S.call("/api/sync/ays",
                                body={"date": BUGUN, "metrics": {"questions": 120}})
            eq(kod, 422)
            ok(any("etiket" in e for e in govde["errors"]))
        test("etiketsiz sayi 422 ile doner", t_unlabeled_rejected_422)

        def t_sync_then_briefing():
            kod, _ = S.call("/api/sync/spi", body={
                "date": BUGUN, "metrics": {"sleep_hours": metric(4.0)}})
            eq(kod, 202)
            kod, b = S.call("/api/briefing?date=" + BUGUN)
            eq(kod, 200)
            eq(b["source"], "kural motoru")
            eq(b["proposal"]["rank"], 1)
            ok(b["decision"]["id"] >= 1)
        test("senkron sonrasi brifing oneriyi tasir", t_sync_then_briefing)

        def t_decision_lifecycle():
            kod, b = S.call("/api/briefing?date=" + BUGUN)
            did = b["decision"]["id"]
            kod, res = S.call("/api/decision/%d/accept" % did, body={})
            eq(kod, 200)
            eq(res["decision"]["state"], "accepted")
            ok(len(res["sources"]) >= 1)
            kod, res = S.call("/api/decision/%d/decline" % did, body={})
            eq(kod, 409)
            kod, res = S.call("/api/decisions?date=" + BUGUN)
            eq(res["current"]["id"], did)
        test("oneri kabul edilir ve ikinci kez degistirilmez", t_decision_lifecycle)

        def t_decision_bad_paths():
            eq(S.call("/api/decision/abc/accept", body={})[0], 400)
            eq(S.call("/api/decision/999/accept", body={})[0], 404)
            eq(S.call("/api/decision/1/belki", body={})[0], 404)
        test("bozuk karar yollari sessizce gecmez", t_decision_bad_paths)

        def t_twin_endpoint():
            kod, t = S.call("/api/twin?date=%s&days=7" % BUGUN)
            eq(kod, 200)
            eq(t["days"], 7)
            eq(t["modules"]["spi"]["metrics"]["sleep_hours"]["value"], 4.0)
            eq(S.call("/api/twin?date=%s&days=abc" % BUGUN)[0], 400)
        test("ikiz ucnoktasi calisir ve bozuk gunu reddeder", t_twin_endpoint)

        def t_page_served_without_token():
            """Sayfanin KENDISI veri tasimaz; veri /api/* uzerinden gelir
            ve orasi jeton ister. Yuzu jeton arkasina koymak, kullaniciyi
            jetonu bir yere yapistirmadan once hicbir sey goremez birakirdi."""
            req = urllib.request.Request(S.url("/"))
            with urllib.request.urlopen(req, timeout=10) as r:
                govde = r.read().decode("utf-8")
                eq(r.status, 200)
                ok("text/html" in r.headers.get("Content-Type", ""))
            ok("HKM" in govde)
            # Sayfa VERI uzerinde hesap yapmaz: kural motoru otoritedir.
            # (Cizim koordinatlari — spark() icindeki min/max — piksel
            # uretir, kullaniciya gosterilen sayi degil.)
            gövde_veri = govde.split("function spark(")[0] \
                + govde.split("return '<svg class=\"spark\"")[-1]
            no("Math.round" in gövde_veri, "yuz kendi sayisini uretiyor")
            # Ve hicbir jeton gomulu degildir.
            no(TOKEN in govde, "jeton sayfaya gomulmus")
        test("yerel yuz jetonsuz servis edilir", t_page_served_without_token)

        def t_unknown_path():
            eq(S.call("/api/yok")[0], 404)
            eq(S.call("/api/yok", body={})[0], 404)
        test("bilinmeyen yol 404", t_unknown_path)

        def t_cors_preflight_local_only():
            """Tarayici BASKA BIR KOKENDEN konusur: on-istege cevap
            verilmezse gonderim hic denenmez ve disaridan «HKM ulasilamiyor»
            gibi gorunur. Izin yalniz yerel kokenlere verilir."""
            req = urllib.request.Request(S.url("/api/sync/ays"), method="OPTIONS")
            req.add_header("Origin", "http://127.0.0.1:4173")
            req.add_header("Access-Control-Request-Method", "POST")
            with urllib.request.urlopen(req, timeout=10) as r:
                eq(r.status, 204)
                eq(r.headers.get("Access-Control-Allow-Origin"), "http://127.0.0.1:4173")
                ok("Authorization" in (r.headers.get("Access-Control-Allow-Headers") or ""))
        test("yerel kokenin on-istegi gecer", t_cors_preflight_local_only)

        def t_cors_foreign_origin_refused():
            req = urllib.request.Request(S.url("/api/sync/ays"), method="OPTIONS")
            req.add_header("Origin", "https://baska-site.example.com")
            try:
                with urllib.request.urlopen(req, timeout=10) as r:
                    kod = r.status
            except urllib.error.HTTPError as e:
                kod = e.code
            eq(kod, 403)
        test("yabanci koken on-istegi reddedilir", t_cors_foreign_origin_refused)

        def t_cors_header_on_response():
            req = urllib.request.Request(S.url("/api/health"))
            req.add_header("Origin", "http://localhost:4193")
            with urllib.request.urlopen(req, timeout=10) as r:
                eq(r.headers.get("Access-Control-Allow-Origin"), "http://localhost:4193")
            req = urllib.request.Request(S.url("/api/health"))
            req.add_header("Origin", "https://baska-site.example.com")
            with urllib.request.urlopen(req, timeout=10) as r:
                no(r.headers.get("Access-Control-Allow-Origin"))
        test("yanit basligi yalniz yerel kokene yazilir", t_cors_header_on_response)

        def t_pair_closed_by_default():
            """Kapi varsayilan olarak KAPALI: pencere acilmadan jeton
            verilmez. Acik duran bir esleme kapisi, jetonsuz bir daemon'dur."""
            kod, r = S.call("/api/pair", body={}, token=None)
            eq(kod, 403)
            kod, d = S.call("/api/pair/status")
            eq(d["open"], False)
        test("esleme penceresi varsayilan kapali", t_pair_closed_by_default)

        def t_pair_open_needs_token():
            """Pencereyi yalniz jetonu ZATEN bilen taraf acabilir."""
            eq(S.call("/api/pair/open", body={}, token=None)[0], 401)
            eq(S.call("/api/pair/status", token=None)[0], 401)
        test("pencereyi acmak jeton ister", t_pair_open_needs_token)

        def t_pair_gives_token_once():
            kod, r = S.call("/api/pair/open", body={})
            eq(kod, 200)
            ok(r["seconds"] >= 30)
            kod, d = S.call("/api/pair/status")
            eq(d["open"], True)
            # Jeton bearer OLMADAN alinir: kapi pencerenin kendisidir.
            kod, r = S.call("/api/pair", body={}, token=None)
            eq(kod, 200)
            eq(r["token"], TOKEN)
            # TEK KULLANIMLIK: ikinci istek kapali kapi bulur.
            eq(S.call("/api/pair", body={}, token=None)[0], 403)
            kod, d = S.call("/api/pair/status")
            eq(d["open"], False)
            eq(d["used"], True)
        test("acik pencere jetonu bir kez verir", t_pair_gives_token_once)

        def t_pair_window_can_be_shortened_not_lengthened():
            """Tek tik, yuz icin KISA bir pencere ister: pencere ne kadar
            acik kalirsa, ayni makinede acik duran baska bir sayfanin jetonu
            kapma ihtimali o kadar uzun surer. Kisaltmak serbest, UZATMAK
            degil — istemciden gelen bir sayi guvenlik sinirini genisletemez."""
            kod, r = S.call("/api/pair/open", body={"seconds": 20})
            eq(kod, 200)
            eq(r["seconds"], 20)
            # Uzatma denemesi tavana kirpilir.
            kod, r = S.call("/api/pair/open", body={"seconds": 99999})
            eq(r["seconds"], daemon.PAIR_SECONDS)
            # Sacma deger varsayilana duser, hata vermez.
            kod, r = S.call("/api/pair/open", body={"seconds": "yarin"})
            eq(r["seconds"], daemon.PAIR_SECONDS)
            # Tabanin altina da inilmez: 1 saniyelik pencere, acilmamis
            # sayilacak kadar kisadir ve sessiz bir basarisizlik uretirdi.
            kod, r = S.call("/api/pair/open", body={"seconds": 1})
            eq(r["seconds"], daemon.PAIR_MIN_SECONDS)
        test("esleme penceresi kisaltilir ama uzatilmaz",
             t_pair_window_can_be_shortened_not_lengthened)

        def t_pair_refuses_foreign_origin():
            S.call("/api/pair/open", body={})
            kod, _ = S.ham("/api/pair", b"{}", {
                "Content-Type": "application/json",
                "Origin": "https://baska-site.example.com"})
            eq(kod, 403)
            # Pencere HARCANMAZ: yabanci bir istek, yerel cihazin hakkini yemez.
            kod, r = S.call("/api/pair", body={}, token=None)
            eq(kod, 200)
            eq(r["token"], TOKEN)
        test("yabanci koken eslemeyi ne alir ne harcar",
             t_pair_refuses_foreign_origin)

        def t_pair_expires():
            """Sure dolunca pencere kendiliginden kapanir."""
            S.call("/api/pair/open", body={})
            with S.srv.pair_lock:
                S.srv.pair["until"] = 0.0          # zamani geriye al
            eq(S.call("/api/pair", body={}, token=None)[0], 403)
        test("suresi dolan pencere kapanir", t_pair_expires)

        def t_local_message_endpoint():
            kod, r = S.call("/api/message", body={"text": "yardim", "date": BUGUN})
            eq(kod, 200)
            eq(r["command"], "yardim")
            ok("durum" in r["text"])
            kod, g = S.call("/api/conversation?limit=5")
            eq(kod, 200)
            ok(len(g["messages"]) >= 2)
        test("yerel mesaj ucnoktasi Patron'a baglar", t_local_message_endpoint)

        def t_chat_without_date():
            """HKM yuzu her istekte tarih yollar; baska bir istemci (entegre
            denetimi, modul) yollamayabilir. Govdede `date` yokken bu yol
            NameError ile baglantiyi dusuruyordu — bugun varsayilmali."""
            kod, r = S.call("/api/chat", body={"text": "yardim"})
            eq(kod, 200)
            eq(r["command"], "yardim")
            kod, r = S.call("/api/chat/tani", body={})
            eq(kod, 200)
            ok("adimlar" in r)
        test("sohbet govdesinde tarih yoksa bugun sayilir", t_chat_without_date)

        def t_king_urun_ucu():
            """Modulun urun istegi: metinsiz 400, bilinmeyen modul 422,
            taninmayan cumle emir acmadan `tanindi: False`, jetonsuz 401."""
            eq(S.call("/api/king/urun", body={"modul": "ays"})[0], 400)
            eq(S.call("/api/king/urun", body={"modul": "xyz", "metin": "türev özeti hazırla"})[0], 422)
            kod, r = S.call("/api/king/urun", body={"modul": "ays", "metin": "merhaba"})
            eq((kod, r["tanindi"]), (200, False))
            eq(S.call("/api/king/urun", body={"modul": "ays", "metin": "x"}, token=None)[0], 401)
        test("modul urun istegi ucu", t_king_urun_ucu)

        def t_message_needs_token():
            eq(S.call("/api/message", body={"text": "durum"}, token=None)[0], 401)
            eq(S.call("/api/conversation", token=None)[0], 401)
        test("mesaj ve konusma jetonsuz acilmaz", t_message_needs_token)

        def t_wa_challenge():
            kod, govde = S.ham(
                "/api/wa/webhook?hub.mode=subscribe&hub.verify_token=WADOGRULAMA"
                "&hub.challenge=42", None, {}, method="GET")
            eq(kod, 200)
            eq(govde, "42")
            kod, _ = S.ham(
                "/api/wa/webhook?hub.mode=subscribe&hub.verify_token=yanlis"
                "&hub.challenge=42", None, {}, method="GET")
            eq(kod, 403)
        test("webhook kurulumu yalniz dogru jetonla dogrulanir", t_wa_challenge)

        def t_wa_requires_signature():
            """Imza dogrulanmadan govde AYRISTIRILMAZ."""
            govde = json.dumps({"entry": [{"changes": [{"value": {"messages": [
                {"type": "text", "from": IZINLI, "text": {"body": "yardim"},
                 "id": "wamid.1"}]}}]}]}).encode("utf-8")
            kod, _ = S.ham("/api/wa/webhook", govde,
                           {"Content-Type": "application/json"})
            eq(kod, 401)
            kod, _ = S.ham("/api/wa/webhook", govde, {
                "Content-Type": "application/json",
                "X-Hub-Signature-256": "sha256=deadbeef"})
            eq(kod, 401)
        test("imzasiz webhook govdesi okunmaz", t_wa_requires_signature)

        def t_wa_unknown_sender_gets_nothing():
            """Tanimayan numaraya cevap YOK ve icerigi ambara girmez."""
            govde = json.dumps({"entry": [{"changes": [{"value": {"messages": [
                {"type": "text", "from": "900000000000",
                 "text": {"body": "gizli bir cumle"}, "id": "wamid.9"}]}}]}]}
            ).encode("utf-8")
            imza = "sha256=" + hmac.new(WA_SIR.encode(), govde,
                                        hashlib.sha256).hexdigest()
            kod, yanit = S.ham("/api/wa/webhook", govde, {
                "Content-Type": "application/json", "X-Hub-Signature-256": imza})
            eq(kod, 200)
            r = json.loads(yanit)
            eq(r["results"][0]["reason"], "not-allowed")
            kod, g = S.call("/api/conversation?limit=50")
            butun = " ".join(m["text"] for m in g["messages"])
            no("gizli bir cumle" in butun, "izinsiz mesajin icerigi ambara yazildi")
        test("tanimayan numaranin icerigi ambara girmez",
             t_wa_unknown_sender_gets_nothing)

        def t_wa_duplicate_webhook_handled_once():
            """Saglayici, cevap alamadiginda AYNI webhook'u tekrar yollar.
            Bu bir ariza degil, sozlesmenin parcasidir: teslim garanti
            edilir, TEK teslim degil.

            Tekrar gelen mesaji yeniden islemek «kabul» komutunu iki kez
            calistirmak olurdu."""
            govde = json.dumps({"entry": [{"changes": [{"value": {"messages": [
                {"type": "text", "from": IZINLI,
                 "text": {"body": "durum"}, "id": "wamid.tekrar.1"}]}}]}]}
            ).encode("utf-8")
            imza = "sha256=" + hmac.new(WA_SIR.encode(), govde,
                                        hashlib.sha256).hexdigest()
            basliklar = {"Content-Type": "application/json",
                         "X-Hub-Signature-256": imza}

            kod, yanit = S.ham("/api/wa/webhook", govde, basliklar)
            eq(kod, 200)
            bir = json.loads(yanit)["results"][0]
            ok(bir.get("queued"))
            no(bir.get("duplicate"))

            # AYNI govde ikinci kez: islenmez.
            kod, yanit = S.ham("/api/wa/webhook", govde, basliklar)
            eq(kod, 200)
            iki = json.loads(yanit)["results"][0]
            ok(iki.get("duplicate"))
            no(iki.get("queued"))

            # Konusma defterinde kullanicinin cumlesi BIR KEZ var.
            kod, g = S.call("/api/conversation?limit=50")
            kullanici = [m for m in g["messages"]
                         if m["role"] == "user" and m["text"] == "durum"]
            eq(len(kullanici), 1)
        test("tekrar gelen webhook bir kez islenir",
             t_wa_duplicate_webhook_handled_once)

        def t_wa_reply_goes_through_outbox():
            """Cevap DOGRUDAN gonderilmez: once giden kutusuna yazilir.
            Ag koptugunda dogrudan gonderim, mesaji hicbir yere yazmadan
            yok ediyordu."""
            govde = json.dumps({"entry": [{"changes": [{"value": {"messages": [
                {"type": "text", "from": IZINLI,
                 "text": {"body": "yardim"}, "id": "wamid.kutu.1"}]}}]}]}
            ).encode("utf-8")
            imza = "sha256=" + hmac.new(WA_SIR.encode(), govde,
                                        hashlib.sha256).hexdigest()
            S.ham("/api/wa/webhook", govde, {
                "Content-Type": "application/json", "X-Hub-Signature-256": imza})
            kod, kutu = S.call("/api/outbox")
            satir = [x for x in kutu["recent"]
                     if x["kind"] == "reply:%s:wamid.kutu.1" % IZINLI]
            eq(len(satir), 1)
            eq(satir[0]["target"], IZINLI)
            # Ag yok: satir kaybolmaz, tekrar denenmek uzere BEKLER.
            ok(satir[0]["state"] in ("queued", "failed"))
        test("cevap giden kutusundan gecer", t_wa_reply_goes_through_outbox)

        def t_tg_webhook_closed_when_channel_off():
            """Kanal kapaliyken webhook YOKTUR: acik ama bos bir kapi,
            kapali bir kapidan daha kotudur."""
            kod, _ = S.ham("/api/tg/webhook", b'{"message":{}}',
                           {"Content-Type": "application/json"})
            eq(kod, 404)
        test("kapali kanalin webhooku yoktur", t_tg_webhook_closed_when_channel_off)

        def t_say_refuses_when_channel_unreachable():
            """Kanal acik ama ag yok: bu bir DURUMDUR, daemon cokmez — VE
            MESAJ KAYBOLMAZ.

            Once dogrudan gonderiliyordu: ag koptugunda mesaj hicbir yere
            yazilmadan yok oluyordu. Artik once giden kutusuna yazilir,
            sonra gonderilmeye calisilir; gec gelen bir mesaj, hic
            gelmeyenden iyidir."""
            kod, r = S.call("/api/say", body={"channel": "whatsapp",
                                              "date": BUGUN, "force": True})
            eq(kod, 200)
            eq(r["ok"], False)
            ok(r["queued"])
            kod, kutu = S.call("/api/outbox")
            satir = [x for x in kutu["recent"] if x["kind"] == "daily"]
            eq(len(satir), 1)
            ok(satir[0]["state"] in ("queued", "failed"))
            # Ikinci cagri IKINCI SATIR yazmaz: gunde tek mesaj.
            S.call("/api/say", body={"channel": "whatsapp", "date": BUGUN,
                                     "force": True})
            kod, kutu = S.call("/api/outbox")
            eq(len([x for x in kutu["recent"] if x["kind"] == "daily"]), 1)
        test("kanal ulasilamazken say cokmez",
             t_say_refuses_when_channel_unreachable)

        def t_config_masks_secrets():
            """Bir ayar ekrani, sirri ekranda goruntulemek zorunda degildir."""
            kod, c = S.call("/api/config")
            eq(kod, 200)
            eq(c["local_token"]["set"], True)
            no(TOKEN in json.dumps(c), "jeton maskesiz cikti")
            no(WA_SIR in json.dumps(c), "uygulama sirri maskesiz cikti")
            eq(c["channels"]["whatsapp"]["app_secret"]["set"], True)
            eq(c["channels"]["whatsapp"]["allow_from"], [IZINLI])
        test("ayarlar sirlari maskeleyerek doner", t_config_masks_secrets)

        def t_config_rejects_bad_values():
            """Dogrulanmayan deger YAZILMAZ: yarim yazilmis bir
            yapilandirma, bozuk bir yapilandirmadir."""
            kod, r = S.call("/api/config",
                            body={"thresholds": {"bio": {"sleep_hours_min": 40}}})
            eq(kod, 422)
            ok(r["errors"])
            kod, r = S.call("/api/config", body={"local_token": "yeni"})
            eq(kod, 422)
            kod, r = S.call("/api/config", body={"channels": {"whatsapp":
                                                 {"enabled": "evet"}}})
            eq(kod, 422)
        test("bozuk ayar reddedilir", t_config_rejects_bad_values)

        def t_config_writes_and_keeps_token():
            """Jeton bir ayar degil bir KIMLIKTIR: API'den degismez."""
            kod, r = S.call("/api/config",
                            body={"thresholds": {"bio": {"sleep_hours_min": 7.5}}})
            eq(kod, 200)
            eq(S.srv.config["local_token"], TOKEN)
            eq(S.srv.thresholds["bio"]["sleep_hours_min"], 7.5)
            # Jeton hala calisiyor: degistirilmedi.
            eq(S.call("/api/health")[0], 200)
            eq(S.call("/api/config")[0], 200)
        test("ayar yazilir ama jetona dokunulmaz", t_config_writes_and_keeps_token)

        def t_backup_carries_everything():
            kod, y = S.call("/api/backup")
            eq(kod, 200)
            for tablo in ("raw_events", "audits", "decisions", "conversations"):
                ok(tablo in y, "yedekte %s yok" % tablo)
            eq(y["__meta"]["app"], "hkm")
        test("yedek butun ambari tasir", t_backup_carries_everything)

        def t_prune_needs_confirmation_and_keeps_decisions():
            """Kararlar ve konusmalar SILINMEZ; ve silme onay ister."""
            eq(S.call("/api/prune", body={"days": 30})[0], 400)
            eq(S.call("/api/prune", body={"confirm": True, "days": 3})[0], 400)
            oncekiKarar = len(S.call("/api/decisions?date=" + BUGUN)[1]["decisions"])
            kod, r = S.call("/api/prune", body={"confirm": True, "days": 30})
            eq(kod, 200)
            ok("deleted" in r)
            sonrakiKarar = len(S.call("/api/decisions?date=" + BUGUN)[1]["decisions"])
            eq(sonrakiKarar, oncekiKarar)
        test("budama onay ister ve kararlari silmez",
             t_prune_needs_confirmation_and_keeps_decisions)

        def t_config_needs_token():
            eq(S.call("/api/config", token=None)[0], 401)
            eq(S.call("/api/backup", token=None)[0], 401)
            eq(S.call("/api/prune", body={"confirm": True}, token=None)[0], 401)
        def t_probe_needs_token():
            """Sinama ucnoktasi da bearer duvarinin ARDINDA: jetonsuz bir
            sinama, sirrin kurulu olup olmadigini disari soylerdi."""
            eq(S.call("/api/probe", body={"provider": "anthropic"},
                      token=None)[0], 401)
            kod, r = S.call("/api/probe", body={"provider": "yok-boyle"})
            eq(kod, 200)
            no(r["ok"])
            eq(r["reason"], "unknown-provider")
            # Anahtar yokken «calisiyor» DENMEZ.
            kod, r = S.call("/api/probe", body={"provider": "openai"})
            no(r["ok"])
            eq(r["reason"], "no-key")
        test("sinama jetonsuz yapilmaz", t_probe_needs_token)

        test("yonetim yollari jetonsuz acilmaz", t_config_needs_token)

        run_extra(S)

        def t_bad_json():
            req = urllib.request.Request(S.url("/api/sync/ays"), data=b"{bozuk",
                                         method="POST")
            req.add_header("Authorization", "Bearer " + TOKEN)
            try:
                with urllib.request.urlopen(req, timeout=10) as r:
                    kod = r.status
            except urllib.error.HTTPError as e:
                kod = e.code
            eq(kod, 400)
        test("bozuk JSON 400 ile doner", t_bad_json)

        def dene(yol, data=None, method="POST"):
            """Durum kodu ya da «KOPTU» (cevapsiz kapanan baglanti)."""
            req = urllib.request.Request(S.url(yol), data=data, method=method)
            req.add_header("Authorization", "Bearer " + TOKEN)
            try:
                with urllib.request.urlopen(req, timeout=10) as r:
                    r.read()
                    return r.status
            except urllib.error.HTTPError as e:
                json.loads(e.read() or b"{}")       # cevap JSON olmali
                return e.code
            except Exception as e:                  # noqa: BLE001
                return "KOPTU: %s" % type(e).__name__

        def t_bozuk_girdi_cevapsiz_kalmaz():
            """HATALAR O-7: nesne olmayan govde, bozuk tarih, kimliksiz motto
            istegi baglantiyi cevapsiz koparıyordu (canli denemede 102 durum).
            Istemci bunu «HKM ulasilamiyor» diye goruyordu."""
            kotu = []
            yollar = ("/api/sync/ays", "/api/restore", "/api/prune", "/api/say",
                      "/api/message", "/api/memory", "/api/motto/node",
                      "/api/motto/edit", "/api/probe", "/api/models",
                      "/api/web/dene", "/api/pair/open", "/api/intents/ays",
                      "/api/chat", "/api/chat/tani", "/api/para", "/api/zaman",
                      "/api/hedef/sync/ays", "/api/memory/sync/ays",
                      "/api/bam/is", "/api/king/emir", "/api/king/urun",
                      "/api/config")
            for yol in yollar:
                for govde in (b"[]", b"null", b"1", b'"x"'):
                    k = dene(yol, govde)
                    if not isinstance(k, int) or k >= 500:
                        kotu.append((yol, govde, k))
            for yol in ("/api/briefing", "/api/twin", "/api/series", "/api/cross",
                        "/api/streak", "/api/weekly", "/api/weekly/belge",
                        "/api/budget"):
                for tarih in ("bozuk", "2026-13-45"):
                    k = dene(yol + "?date=" + tarih, method="GET")
                    if k != 400:
                        kotu.append((yol, tarih, k))
            for yol in ("/api/chat", "/api/message"):
                k = dene(yol, json.dumps({"text": "merhaba",
                                          "date": "2026-13-45"}).encode())
                if k != 400:
                    kotu.append((yol, "govde tarihi", k))
            for uc in ("edit", "move", "archive", "link", "unlink", "accept"):
                k = dene("/api/motto/" + uc, b"{}")
                if not isinstance(k, int) or not 400 <= k < 500:
                    kotu.append(("/api/motto/" + uc, "kimliksiz", k))
            for govde in (b'{"confirm":true,"days":"abc"}',
                          b'{"__meta":{"schema":"abc"}}'):
                yol = "/api/prune" if b"confirm" in govde else "/api/restore"
                k = dene(yol, govde)
                if not isinstance(k, int) or not 400 <= k < 500:
                    kotu.append((yol, govde, k))
            eq(kotu, [])
        test("bozuk girdi 4xx ile cevaplanir, baglanti kopmaz (O-7)",
             t_bozuk_girdi_cevapsiz_kalmaz)

        def t_prune_sifir_gun():
            """HATALAR D-7: {"days":0} sessizce 180 gun oluyordu (`or 180`)."""
            k = dene("/api/prune", b'{"confirm":true,"days":0}')
            eq(k, 400)
        test("prune days:0 180'e donmez (D-7)", t_prune_sifir_gun)

        def t_yol_govde_uyusmazligi():
            """HATALAR D-1: /api/sync/ays govdesinde module:spi SPI'ye
            yaziliyordu; yol ile govde uyusmali."""
            once = db.connect(S.db_path).execute(
                "SELECT COUNT(*) FROM raw_events WHERE module='spi'").fetchone()[0]
            k = dene("/api/sync/ays", json.dumps({
                "module": "spi", "date": BUGUN,
                "metrics": {"sleep_hours": metric(7)}}).encode())
            eq(k, 400)
            sonra = db.connect(S.db_path).execute(
                "SELECT COUNT(*) FROM raw_events WHERE module='spi'").fetchone()[0]
            eq(sonra, once)
        test("sync yolu ile govdedeki modul uyusmali (D-1)", t_yol_govde_uyusmazligi)
    finally:
        S.close()


def run_extra(S):
    """Geri yukleme ve seri ucnoktalari — ayri bir sunucu istemezler."""
    def t_restore_needs_explicit_replace():
        """Bir geri yukleme, sessizce silinmis bir gecmis olamaz."""
        kod, yedek = S.call("/api/backup")
        eq(kod, 200)
        kod, r = S.call("/api/restore", body={"backup": yedek})
        eq(kod, 409)
        ok("replace" in r["error"])
        kod, r = S.call("/api/restore", body={"backup": yedek, "replace": True})
        eq(kod, 200)
        ok(r["written"])
    test("geri yukleme ustune yazmayi acikca ister",
         t_restore_needs_explicit_replace)

    def t_restore_refuses_foreign_backup():
        kod, r = S.call("/api/restore",
                        body={"backup": {"__meta": {"app": "baska"}},
                              "replace": True})
        eq(kod, 409)
        kod, r = S.call("/api/restore", body={"backup": {"raw_events": []},
                                              "replace": True})
        eq(kod, 409)
    test("yabanci yedek geri yuklenmez", t_restore_refuses_foreign_backup)

    def t_backup_covers_every_table():
        """B01/1 — yedek BUTUN ambari tasimali. Teklif ve gonderim
        kuyruklari disarida kalirsa, «yedek aldim» diyen kullanicinin islem
        durumu eksik kalir."""
        con = db.connect(S.db_path)
        db.insert_intent(con, "ays", "plan.add", {"date": BUGUN, "minutes": 60},
                         "teklif", "patron")
        from core import outbox
        outbox.enqueue(con, "whatsapp", "daily", BUGUN, "mesaj")
        con.close()
        kod, y = S.call("/api/backup")
        eq(kod, 200)
        ok("intents" in y, "yedekte intents yok")
        ok("outbox" in y, "yedekte outbox yok")
        eq(len(y["intents"]), 1)
        # Bu ambari onceki testler de kullaniyor: satirin VARLIGI aranir,
        # sayisi degil. Sayiya bagli bir test, test sirasina baglidir.
        ok(any(x["kind"] == "daily" for x in y["outbox"]),
           "yedekte gunluk mesaj satiri yok")
        ok(y["__meta"].get("tables"), "yedekte tablo envanteri yok")
    test("yedek butun tablolari kapsar", t_backup_covers_every_table)

    def t_restore_guard_covers_every_table():
        """B01/3 — «ustune yazma» guvencesi YALNIZ raw_events'e bakiyordu:
        ham olay yokken var olan bir niyet sessizce eziliyordu."""
        kod, y = S.call("/api/backup")
        # Ham olaylari bosalt ama niyeti birak: eski kontrol burada gecerdi.
        con = db.connect(S.db_path)
        con.execute("DELETE FROM raw_events")
        con.commit()
        onceki = con.execute("SELECT note FROM intents ORDER BY id LIMIT 1").fetchone()
        con.close()
        bozuk = dict(y)
        bozuk["intents"] = [dict(r, note="EZILDI") for r in y.get("intents") or []]
        kod, r = S.call("/api/restore", body={"backup": bozuk})
        eq(kod, 409, "dolu bir tabloya replace'siz yazildi")
        con = db.connect(S.db_path)
        sonraki = con.execute("SELECT note FROM intents ORDER BY id LIMIT 1").fetchone()
        con.close()
        eq(sonraki["note"], onceki["note"], "niyet sessizce ezildi")
    test("ustune yazma guvencesi butun tablolari gozetir",
         t_restore_guard_covers_every_table)

    def t_negative_content_length_refused():
        """B09 — negatif uzunluk yalniz UST siniri denetleyen okumadan
        gecip EOF'a kadar okuyordu."""
        kod, hata = S.srv_read_body_test()
        eq(kod, b"")
        ok(hata, "negatif uzunluk reddedilmedi")
    test("negatif Content-Length reddedilir", t_negative_content_length_refused)

    def t_streak_endpoint():
        kod, r = S.call("/api/streak?date=" + BUGUN)
        eq(kod, 200)
        ok(r["streaks"])
        eq(S.call("/api/streak?days=abc")[0], 400)
    test("seri ucnoktasi calisir", t_streak_endpoint)

    def t_memory_sync_endpoint():
        kayit = {"id": "h1", "metin": "Pazar çalışmam", "katman": "soz",
                 "kaynak": "kullanici", "at": "2026-09-20T10:00:00"}
        eq(S.call("/api/memory/sync/ays", body={"items": [kayit]}, token=None)[0], 401)
        kod, r = S.call("/api/memory/sync/ays", body={"items": [kayit]})
        eq((kod, r["eklenen"]), (200, 1))
        kod, r = S.call("/api/memory/sync/ays", body={"items": [kayit]})
        eq((kod, r["eklenen"], r["dusen"]), (200, 0, 0))
        eq(S.call("/api/memory/sync/king", body={"items": []})[0], 422)
        eq(S.call("/api/memory/sync/ays", body=[1])[0], 400)
        kod, r = S.call("/api/memory?scope=king")
        ok(any(m["modul"] == "ays" and m["text"] == "Pazar çalışmam" for m in r["memories"]))
    test("modul hafizasi esitleme ucu yetki ister ve idempotenttir",
         t_memory_sync_endpoint)

    def t_hafiza_adayi_ucu():
        from core import memory
        con = db.connect(S.db_path)
        a = memory.aday_ekle(con, "Hafta sonu erken kalkıyor.")
        con.commit(); con.close()
        kod, r = S.call("/api/memory?scope=king")
        ok(any(x["id"] == a["id"] for x in r["adaylar"]))
        no(any(m["text"] == "Hafta sonu erken kalkıyor." for m in r["memories"]))
        eq(S.call("/api/memory/aday/%d/onayla" % a["id"], body={}, token=None)[0], 401)
        eq(S.call("/api/memory/aday/%d/onayla" % a["id"], body={})[0], 200)
        eq(S.call("/api/memory/aday/%d/onayla" % a["id"], body={})[0], 404)
        kod, r = S.call("/api/memory?scope=king")
        ok(any(m["text"] == "Hafta sonu erken kalkıyor." and m["onaylandi_at"] for m in r["memories"]))
        eq(S.call("/api/memory/aday/x/reddet", body={})[0], 400)
    test("hafiza adayi ucu: listeler; onay yetki ister, bir kez olur", t_hafiza_adayi_ucu)

    def t_bam_endpoints():
        eq(S.call("/api/bam/is", body={"talep": "Demir emilimi araştır"}, token=None)[0], 401)
        kod, r = S.call("/api/bam/is", body={"talep": "Demir emilimi araştır",
                                             "hedef_modul": "spi"})
        eq((kod, r["ofisler"]), (200, ["kayit", "arastirma"]))
        kod, r = S.call("/api/bam/is", body={"talep": "şunu bir hallet"})
        eq(kod, 422)
        ok("araştır" in r["soru"])
        kod, r = S.call("/api/bam/ilerlet", body={})
        eq((kod, r["ofis"]), (200, "kayit"))
        kod, o = S.call("/api/bam")
        eq(kod, 200)
        eq([x["id"] for x in o["ofisler"]], ["kayit", "arastirma", "planlama", "uretim"])
        iid = o["isler"][0]["id"]
        eq(S.call("/api/bam/is/%d/iptal" % iid, body={})[0], 200)
        eq(S.call("/api/bam/is/%d/iptal" % iid, body={})[0], 409)
        eq(S.call("/api/bam/kayit/999")[0], 404)
    test("BAM uclari yetki ister, belirsiz talebi sorar", t_bam_endpoints)

    def t_king_endpoints():
        plan = {"paket": "kilo", "yon": "azalt", "hedef_id": "hdX", "baslangic": "2026-09-23",
                "bitis": "2026-12-23", "hafta": 13, "tempo": 0.31,
                "simdi": {"deger": 84.0, "etiket": "olculdu"}, "hedef_deger": 80.0,
                "enerji": None, "protein": None, "kapasite": None,
                "hekim_kapisi": False, "talimat": 0}
        govde = {"modul": "spi", "tur": "hedef.plan", "konu": "Kilo planı",
                 "govde": {"plan": plan}}
        eq(S.call("/api/king/emir", body=govde, token=None)[0], 401)
        kod, r = S.call("/api/king/emir", body=dict(govde, tur="uzaktan.komut"))
        eq(kod, 422)
        kod, r = S.call("/api/king/emir", body=govde)
        eq((kod, r["karar"], r["emir"]["durum"]), (200, "onay", "onaylandi"))
        eid = r["emir"]["id"]
        kod, g = S.call("/api/king/emir/%d" % eid)
        eq((kod, g["is"]["ofisler"]), (200, ["kayit", "planlama"]))
        eq(S.call("/api/king/emir/9999")[0], 404)
        kod, b = S.call("/api/bildirim/spi")
        eq((kod, b["okunmamis"]), (200, 1))
        eq(S.call("/api/bildirim/king")[0], 404)
        S.call("/api/bam/ilerlet", body={})
        S.call("/api/bam/ilerlet", body={})
        kod, k = S.call("/api/king")
        eq((kod, k["emirler"][0]["durum"]), (200, "bitti"))
        ok("hedef.plan" in k["turler"])
        kod, b = S.call("/api/bildirim/spi")
        eq([x["tur"] for x in b["bildirimler"]], ["bitti", "basladi", "onaylandi"])
        eq(S.call("/api/bildirim/%d/okundu" % b["bildirimler"][0]["id"], body={})[0], 200)
        eq(S.call("/api/bildirim/999999/okundu", body={})[0], 404)
        eq(S.call("/api/bildirim/spi")[1]["okunmamis"], 2)
        eq(S.call("/api/king/emir/%d/iptal" % eid, body={})[0], 409)
        kod, n = S.call("/api/intents/spi")
        ok(any(x["kind"] == "plan.apply" and x["payload"]["hedef_id"] == "hdX"
               for x in n["intents"]))
    test("King uclari: emir, bildirim, okundu, iptal — yetkili ve kodlu",
         t_king_endpoints)

    def t_hedef_endpoints():
        h = {"id": "a1", "ozet": "AYT Fizik", "durum": "aktif", "paket": "konu",
             "kapasite": {"gunluk_dk": 60}}
        eq(S.call("/api/hedef/sync/ays", body={"hedefler": [h]}, token=None)[0], 401)
        eq(S.call("/api/hedef/sync/king", body={"hedefler": []})[0], 422)
        kod, r = S.call("/api/hedef/sync/ays", body={"hedefler": [h]})
        eq((kod, r["yazilan"], r["butce"]["talep"]), (200, 1, 7.0))
        eq(S.call("/api/zaman", body={"gunluk_dk": 3})[0], 422)
        kod, r = S.call("/api/zaman", body={"gunluk_dk": 120, "haftalik_gun": 6})
        eq((kod, r["butce"]["bant"]), (200, "sigar"))
        kod, p = S.call("/api/hedefler")
        eq((kod, p["moduller"]["ays"], p["butce"]["vakit"]), (200, 1, 12.0))
        eq(S.call("/api/hedefler", token=None)[0], 401)
        S.call("/api/hedef/sync/ays", body={"hedefler": []})
    test("hedef agi uclari: esitleme, zaman, pano — yetkili", t_hedef_endpoints)

    def t_depo_tara():
        from core import bam as _bam
        con = db.connect(S.db_path)
        kid = _bam.kayit_ekle(con, "arastirma", "Tarayıcı deneme konusu",
                              {"ozet": "x", "kaynaklar": [{"n": 1, "url": "https://ornek.org/a",
                                                           "alan": "ornek.org", "parmak": ["p"]}]},
                              dogruluk="kaynakli")["id"]
        con.close()
        eq(S.call("/api/bam/depo/tara", token=None)[0], 401)
        from urllib.parse import quote
        kod, v = S.call("/api/bam/depo/tara?q=%s&tur=arastirma&durum=yok-boyle" % quote("tarayıcı"))
        eq(kod, 200)
        eq([x["id"] for x in v["kayitlar"]], [kid])     # gecersiz durum suzgeci yok sayilir
        eq((v["kayitlar"][0]["kaynak"], v["kayitlar"][0]["tazelik"]["durum"]), (1, "yeni"))
        ok(v["adlar"]["guncel"] == "güncel" and v["kural"])
        kod, r = S.call("/api/bam/kayit/%d" % kid)
        eq((r["depo"]["surumler"][0]["bu"], r["depo"]["kaynaklar"][0]["alan"]), (True, "ornek.org"))
        no("parmak" in r["depo"]["kaynaklar"][0])
    test("depo tarayicisi ucu: arama, suzgec, kayit gorunumu — yetkili", t_depo_tara)

    def t_teklif_onay_ucu():
        kod, r = S.call("/api/king/emir", body={"modul": "ays", "tur": "test.kitabi", "govde": {
            "kitap": {"baslik": "Uç deneme kitabı", "bolumler": [
                {"ad": "Tarih", "konular": [], "adet": 3},
                {"ad": "Coğrafya", "konular": [], "adet": 3}]}}})
        eq((kod, r["emir"]["durum"]), (200, "teklif"))
        eid = r["emir"]["id"]
        eq(S.call("/api/king/emir/%d/onayla" % eid, body={}, token=None)[0], 401)
        kod, o = S.call("/api/king/emir/%d/onayla" % eid, body={"secenek": "kucuk"})
        # Test sunucusunda model atanmamis: karar «kismi» olur, is yine acilir.
        eq((kod, o["emir"]["teklif"]["secilen"]), (200, "kucuk"))
        ok(o["emir"]["durum"] in ("onaylandi", "kismen_onay") and o["emir"]["bam_is_id"])
        eq(S.call("/api/king/emir/%d/onayla" % eid, body={})[0], 409)
        kod, cfgv = S.call("/api/config")
        eq(cfgv["king"], {"sormadan_dusuk": False})
        # Modulun teklif karti: yalniz acik teklifler, govdesiz.
        kod, r2 = S.call("/api/king/emir", body={"modul": "esp", "tur": "bam.urun", "govde": {
            "urun": {"tur": "pankart", "konu": "Gitar bakımı"}}})
        eq(r2["emir"]["durum"], "teklif")
        eq(S.call("/api/king/teklifler/esp", token=None)[0], 401)
        eq(S.call("/api/king/teklifler/king")[0], 404)
        kod, l = S.call("/api/king/teklifler/esp")
        eq((kod, [x["id"] for x in l["teklifler"]]), (200, [r2["emir"]["id"]]))
        ok(l["teklifler"][0]["secenekler"][0]["metin"].startswith("tam: düşük sınıf"))
        no("govde" in l["teklifler"][0]["secenekler"][0])
        eq(S.call("/api/king/teklifler/ays")[1]["teklifler"], [])
        # Ara onay ucu (8b): ara onayda olmayan is icin 409; yetki ister.
        eq(S.call("/api/king/emir/%d/devam" % eid, body={}, token=None)[0], 401)
        eq(S.call("/api/king/emir/%d/devam" % eid, body={})[0], 409)
        eq(S.call("/api/king/emir/x/dur", body={})[0], 400)
    test("teklif onay ucu: yetkili, secenekli, bir kez", t_teklif_onay_ucu)

    def t_yedek_endpoints():
        govde = {"__meta": {"app": "spi-saglik", "schemaVersion": 3}, "data": {"meta": {"x": 1}}}
        eq(S.call("/api/yedek/spi", body=govde, token=None)[0], 401)
        eq(S.call("/api/yedek", token=None)[0], 401)
        eq(S.call("/api/yedek/ays", body=govde)[0], 422)      # baska modulun dosyasi
        kod, r = S.call("/api/yedek/spi", body=govde)
        eq((kod, r["ok"]), (200, True))
        kod, l = S.call("/api/yedek")
        eq((kod, [x["tarih"] for x in l["moduller"]["spi"]]), (200, [r["tarih"]]))
        kod, ham = S.ham("/api/yedek/spi/" + r["tarih"], None,
                         {"Authorization": "Bearer " + TOKEN}, method="GET")
        eq((kod, json.loads(ham)), (200, govde))
        eq(len(ham.encode("utf-8")), r["bayt"])
        # Fikir 53: tek zip — jetonsuz yok; icinde spi yedegi ve BENIOKU.
        import io
        import zipfile
        eq(S.call("/api/disa-aktar", token=None)[0], 401)
        # Para kolu (Y1): form, ay ozeti, silme; jetonsuz yok.
        eq(S.call("/api/para", token=None)[0], 401)
        eq(S.call("/api/para", body={"yon": "gider", "tutar": "abc"})[0], 422)
        kod, pr = S.call("/api/para", body={"yon": "gider", "tutar": "450", "kategori": "Gıda",
                                            "aciklama": "market"})
        eq(kod, 200)
        kod, pa = S.call("/api/para")
        eq((kod, pa["kayitlar"][0]["tutar"], "Gıda" in pa["kategoriler_hepsi"]), (200, "450 TL", True))
        eq(S.call("/api/para/%d/sil" % pr["id"], body={})[0], 200)
        eq(S.call("/api/para/%d/sil" % pr["id"], body={})[0], 404)
        eq(S.call("/api/para?ay=eylul")[0], 400)
        # Fis okuma (kullanici karari 2026-09-24): jetonsuz yok; bozuk govde
        # 400; model atanmamissa okunmaz ve SOYLENIR; taslak onayla yazilir.
        import base64 as _b64
        png = _b64.b64encode(b"\x89PNG\r\n\x1a\n" + b"0" * 64).decode("ascii")
        eq(S.call("/api/para/fis", body={"mime": "image/png", "data": png}, token=None)[0], 401)
        eq(S.call("/api/para/fis", body={"mime": "image/gif", "data": png})[0], 400)
        eq(S.call("/api/para/fis", body={"mime": "image/png", "data": "***"})[0], 400)
        kod, fr = S.call("/api/para/fis", body={"mime": "image/png", "data": png})
        eq(kod, 422)
        ok("model" in fr["note"].lower(), fr)
        from core import fis as _fis
        c = db.connect(S.db_path)
        tid = _fis._taslak_yaz(c, {"kurus": 24590, "birim": "TRY", "gun": BUGUN, "yon": "gider",
                                   "kategori": "Gıda", "aciklama": "Migros", "kalemler": [],
                                   "uyarilar": [], "etiket": "tahmin"}, "web", None)
        c.close()
        kod, pa = S.call("/api/para?ay=" + BUGUN[:7])
        eq([t["id"] for t in pa["taslaklar"]], [tid])
        eq(S.call("/api/para/fis/%d/kaydet" % tid, body={"tutar": "abc"})[0], 422)
        kod, fk = S.call("/api/para/fis/%d/kaydet" % tid, body={"tutar": "250"})
        eq(kod, 200)
        eq(S.call("/api/para/fis/%d/kaydet" % tid, body={})[0], 409)
        eq(S.call("/api/para/fis/%d/iptal" % tid, body={})[0], 404)
        eq(S.call("/api/para/fis/abc/kaydet", body={})[0], 400)
        # Fikir 48 ve 55: durum ve gizlilik uclari calisir, jetonsuz yok.
        kod, tn = S.call("/api/tani")
        eq(kod, 200)
        ok(tn["maddeler"] and "metin" in tn)
        eq(S.call("/api/tani", token=None)[0], 401)
        kod, gz = S.call("/api/gizlilik")
        eq((kod, "saglik" in gz), (200, True))
        req = urllib.request.Request(S.url("/api/disa-aktar"),
                                     headers={"Authorization": "Bearer " + TOKEN})
        with urllib.request.urlopen(req, timeout=10) as yan:
            eq(yan.headers.get("Content-Type"), "application/zip")
            z = zipfile.ZipFile(io.BytesIO(yan.read()))
        ok("spi/spi-yedek-%s.json" % r["tarih"] in z.namelist() and "BENIOKU.txt" in z.namelist())
        eq(S.call("/api/yedek/spi/2026-02-31")[0], 404)
        eq(S.call("/api/yedek/spi/..%2Fays")[0], 404)
    test("yedek uclari: yazar, listeler, indirir — yetkili ve modulune ait", t_yedek_endpoints)

    def t_weekly_belge_endpoints():
        kod, hw = S.call("/api/weekly?date=2026-09-14")
        eq((kod, hw["gecmis"][0]["to"], hw["gecmis"][0]["durum"]), (200, "2026-09-14", "bu hafta"))
        eq(S.call("/api/weekly/belge?date=2026-09-14", token=None)[0], 401)
        eq(S.call("/api/weekly/belge?date=2026-09-14&bicim=svg")[0], 400)
        req = urllib.request.Request(S.url("/api/weekly/belge?date=2026-09-14&bicim=html"))
        req.add_header("Authorization", "Bearer " + TOKEN)
        with urllib.request.urlopen(req, timeout=10) as r:
            eq(r.status, 200)
            ok("hkm-haftalik-rapor-2026-09-14.html" in r.headers.get("Content-Disposition"))
            ok(b"Haftal" in r.read())
        eq(S.call("/api/weekly/gonder", body={}, token=None)[0], 401)
    test("haftalik rapor belgesi yetki ister ve indirilir", t_weekly_belge_endpoints)

    def t_web_endpoints():
        eq(S.call("/api/web", token=None)[0], 401)
        kod, d = S.call("/api/web")
        eq(kod, 200)
        eq([x["id"] for x in d["saglayicilar"]], ["wikipedia"])
        eq(d["bugun"]["etiket"], "olculdu")
        eq(S.call("/api/web/dene", body={"sorgu": "a"}, token=None)[0], 401)
        kod, r = S.call("/api/web/dene", body={"sorgu": "ali@ornek.com kim"})
        eq((kod, r["ok"]), (200, False))       # ag'a cikmadan reddedilir
        ok("kişisel" in r["note"])
    test("web uclari yetki ister; kisisel sorgu aga cikmaz", t_web_endpoints)

    def t_cikti_endpoints():
        from core import bam as _bam, urunler as _u
        con = db.connect(S.db_path)
        g, _ = _u.ayikla("pankart", {"baslik": "Su <iç>", "maddeler": ["Bir", "İki"]})
        kid = _bam.kayit_ekle(con, "materyal", "Su", g)["id"]
        con.close()
        eq(S.call("/api/bam/kayit/%d/cikti" % kid, token=None)[0], 401)
        kod, govde = S.ham("/api/bam/kayit/%d/cikti?bicim=svg" % kid, None,
                           {"Authorization": "Bearer " + TOKEN}, method="GET")
        eq(kod, 200)
        ok(govde.startswith("<svg") and "&lt;iç&gt;" in govde)
        kod, govde = S.ham("/api/bam/kayit/%d/cikti?bicim=html&indir=1" % kid, None,
                           {"Authorization": "Bearer " + TOKEN}, method="GET")
        eq(kod, 200)
        ok("<!doctype html>" in govde)
        eq(S.call("/api/bam/kayit/%d/cikti?bicim=exe" % kid)[0], 422)
        eq(S.call("/api/bam/kayit/999999/cikti")[0], 404)
        kod, r = S.call("/api/urunler")
        ok(kod == 200 and any(x["id"] == "zihin_haritasi" for x in r["urunler"]))
    test("cikti ucu: yetki, kacislanmis SVG/HTML, bicim ve kayit denetimi", t_cikti_endpoints)

    def t_depo_endpoint():
        eq(S.call("/api/bam/depo", token=None)[0], 401)
        kod, r = S.call("/api/bam/depo")
        eq(kod, 200)
        ok(r["rapor"]["etiket"] == "olculdu" and r["rapor"]["toplam"] >= 1)
        ok(any(i["ajan"] == "Arşiv Uzmanı" for i in r["rapor"]["iz"]))
    test("depo ucu: yetki ister, olculmus raporu doner", t_depo_endpoint)
