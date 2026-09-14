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

    def close(self):
        self.srv.shutdown()
        self.srv.server_close()


def run():
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

        def t_tg_webhook_closed_when_channel_off():
            """Kanal kapaliyken webhook YOKTUR: acik ama bos bir kapi,
            kapali bir kapidan daha kotudur."""
            kod, _ = S.ham("/api/tg/webhook", b'{"message":{}}',
                           {"Content-Type": "application/json"})
            eq(kod, 404)
        test("kapali kanalin webhooku yoktur", t_tg_webhook_closed_when_channel_off)

        def t_say_refuses_when_channel_unreachable():
            """Kanal acik ama ag yok: bu bir DURUMDUR, daemon cokmez."""
            kod, r = S.call("/api/say", body={"channel": "whatsapp",
                                              "date": BUGUN, "force": True})
            eq(kod, 200)
            eq(r["ok"], False)
            ok("status" in r)
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
        test("yonetim yollari jetonsuz acilmaz", t_config_needs_token)

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
    finally:
        S.close()
