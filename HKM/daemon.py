#!/usr/bin/env python3
"""HKM daemon — yalniz 127.0.0.1, yalniz bearer'li istek.

    python daemon.py            # http://127.0.0.1:4200

Ucnoktalar:
    POST /api/sync/<modul>          etiketli metrikleri yutar (202 / 422)
    GET  /api/briefing?date=        gunun brifingi: VP raporlari + TEK oneri
    GET  /api/twin?date=&days=      dijital ikiz: son N gunun tek resmi
    GET  /api/decisions?date=       gunun butun onerileri (reddedilenler dahil)
    GET  /api/cross?date=&days=     capraz bulgular: uc ambar yan yana
    POST /api/message               Buyuk Patron'a kisa komut (yerel kanal)
    GET  /api/conversation          son konusma kayitlari
    POST /api/pair/open             esleme penceresini acar (bearer ister)
    GET  /api/pair/status           pencere acik mi (bearer ister)
    POST /api/pair                  jetonu YEREL cihaza verir — pencere acikken,
                                    tek kullanimlik, bearer ISTEMEZ
    POST /api/say                   gunun mesajini kanala gonderir (gunde bir)
    GET/POST /api/wa/webhook        WhatsApp — jetonsuz ama IMZALI (bkz. §7)
    POST /api/tg/webhook            Telegram — gizli baslikla dogrulanir
    POST /api/decision/<id>/accept  oneriyi kabul et
    POST /api/decision/<id>/decline oneriyi reddet — kayit silinmez
    GET  /api/health                token istemez
    GET  /                          tek dosyalik yerel yuz (token istemez;
                                    jetonu kullanici girer, veri yine korumali)

Dis dunyaya acilmaz: host varsayilani 127.0.0.1'dir ve config.json ile
degistirilmesi bilincli bir karardir.
"""

import datetime
import json
import os
import re
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core import (channels, cross, db, manager, patron,  # noqa: E402
                  sync_engine, thresholds, twin)

ROOT = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(ROOT, "config.json")

# Esleme penceresi: jetonu elle yapistirmayi bitirir ama kapiyi acik
# birakmaz. Kisa, TEK KULLANIMLIK ve yalniz YEREL kokene.
PAIR_SECONDS = 120


"""Tarayici, HKM'ye BASKA BIR KOKENDEN konusur.

Uc arayuz kendi devserver'inda (4173/4183/4193) kosar; HKM 4200'dedir.
Bu yuzden isaret istegi cifte kokenlidir ve tarayici once bir on-istek
(OPTIONS) yollar. On-istege cevap verilmezse gonderim hic denenmez ve
disaridan bakinca «HKM ulasilamiyor» gibi gorunur — oysa daemon ayaktadir.

Izin YALNIZ yerel kokenlere verilir: 127.0.0.1, localhost ve ::1. Bunun
disindaki bir kokene acmak, kullanicinin ziyaret ettigi herhangi bir web
sayfasinin yerel HKM'ye istek atabilmesi demektir. Jeton yine sarttir;
CORS bir kimlik dogrulama degil, bir tarayici sinirdir."""
LOCAL_ORIGIN = re.compile(
    r"^https?://(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$", re.I)


def cors_origin(headers, cfg):
    origin = headers.get("Origin", "")
    if not origin:
        return None
    if LOCAL_ORIGIN.match(origin):
        return origin
    if origin in (cfg or {}).get("allowed_origins", []):
        return origin
    return None


def load_config():
    cfg = {"host": "127.0.0.1", "port": 4200, "local_token": ""}
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            cfg.update(json.load(f))
    return cfg


def briefing(con, date, th=None, days=twin.WINDOW_DAYS):
    """Brifing artik Yoneticiden gecer.

    Onceki hali onceligi ham VP raporlarindan hesapliyor ama gunun
    govdesini precedence'a GECIRMIYORDU: «sabit takvim» sirasi (rank 2)
    boylece uretimde hic ateslenmiyordu — testte gecen bir yol, uretimde
    olu bir yoldu. manager.brief() govdeleri de tasir."""
    return manager.brief(con, date, th=th, days=days)


class Handler(BaseHTTPRequestHandler):
    server_version = "HKM/1.0"

    @property
    def con(self):
        """Her isleve kendi baglantisi.

        SQLite bir baglantiyi yaratildigi is parcacigi disinda kullandirmaz;
        ThreadingHTTPServer altinda tek paylasimli baglanti ilk es zamanli
        istekte patlar. Baglantiyi is parcacigina bagliyoruz."""
        local = self.server.local
        if not hasattr(local, "con"):
            local.con = db.connect(self.server.db_path)
        return local.con

    # --- yardimcilar -----------------------------------------------------
    def _send(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _cors(self):
        origin = cors_origin(self.headers, self.server.config)
        if not origin:
            return
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Vary", "Origin")

    def do_OPTIONS(self):
        """On-istek: yalniz yerel kokene, yalniz kullanilan basliklara."""
        origin = cors_origin(self.headers, self.server.config)
        if not origin:
            self.send_response(403)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Vary", "Origin")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _authorized(self):
        head = self.headers.get("Authorization", "")
        given = head[7:] if head.startswith("Bearer ") else ""
        return sync_engine.check_token(given, self.server.config.get("local_token"))

    def log_message(self, fmt, *args):
        sys.stderr.write("[hkm] " + (fmt % args) + "\n")

    # --- yollar ----------------------------------------------------------
    def _wa_webhook(self):
        cfg = self.server.config
        a = channels.settings(cfg, "whatsapp")
        if not channels.enabled(cfg, "whatsapp"):
            return self._send(404, {"error": "kanal kapali"})
        n = int(self.headers.get("Content-Length") or 0)
        ham = self.rfile.read(n) if n else b""
        imza = self.headers.get("X-Hub-Signature-256", "")
        if not channels.verify_signature(a.get("app_secret"), ham, imza):
            return self._send(401, {"error": "imza dogrulanmadi"})
        try:
            govde = json.loads(ham or b"{}")
        except ValueError:
            return self._send(400, {"error": "gecersiz JSON"})

        cevaplar = []
        for m in channels.parse_whatsapp(govde):
            if not channels.allowed(cfg, "whatsapp", m["from"]):
                # Icerik AMBARA YAZILMAZ; yalniz reddedildigi not edilir.
                patron.log(self.con, "whatsapp", "system",
                           "Bilinmeyen numaradan mesaj reddedildi.")
                cevaplar.append({"from": "?", "ok": False, "reason": "not-allowed"})
                continue
            r = patron.respond(self.con, m["text"], th=self.server.thresholds,
                               channel="whatsapp")
            g = channels.send(cfg, "whatsapp", r["text"], to=m["from"])
            cevaplar.append({"command": r["command"], "sent": g["ok"],
                             "status": g["status"]})
        return self._send(200, {"handled": len(cevaplar), "results": cevaplar})

    def _tg_webhook(self):
        """Telegram imza yollamaz; kurulumda verilen gizli basligi geri
        gonderir. Sir tanimsizsa webhook KAPALIDIR."""
        cfg = self.server.config
        if not channels.enabled(cfg, "telegram"):
            return self._send(404, {"error": "kanal kapali"})
        if not channels.verify_telegram_secret(
                cfg, self.headers.get("X-Telegram-Bot-Api-Secret-Token")):
            return self._send(401, {"error": "gizli baslik dogrulanmadi"})
        n = int(self.headers.get("Content-Length") or 0)
        try:
            govde = json.loads(self.rfile.read(n) or b"{}")
        except ValueError:
            return self._send(400, {"error": "gecersiz JSON"})
        cevaplar = []
        for m in channels.parse_telegram(govde):
            if not channels.allowed(cfg, "telegram", m["from"]):
                patron.log(self.con, "telegram", "system",
                           "Bilinmeyen sohbetten mesaj reddedildi.")
                cevaplar.append({"from": "?", "ok": False, "reason": "not-allowed"})
                continue
            r = patron.respond(self.con, m["text"], th=self.server.thresholds,
                               channel="telegram")
            g = channels.send(cfg, "telegram", r["text"], to=m["from"])
            cevaplar.append({"command": r["command"], "sent": g["ok"],
                             "status": g["status"]})
        return self._send(200, {"handled": len(cevaplar), "results": cevaplar})

    def _say(self, body):
        """Gunun mesajini kanala gonderir. GUNDE TEK MESAJ: ayni gun ayni
        kanala ikinci kez gonderilmez (force ile bilincli olarak asilir)."""
        cfg = self.server.config
        kanal = body.get("channel") or "whatsapp"
        tarih = body.get("date") or datetime.date.today().isoformat()
        if not channels.enabled(cfg, kanal):
            return {"ok": False, "reason": "off", "note": "Kanal kapalı."}
        if not body.get("force") and patron.already_sent(self.con, tarih, kanal):
            return {"ok": False, "reason": "already-sent",
                    "note": "Bugünün mesajı bu kanala zaten gönderildi."}
        m = patron.daily_message(self.con, tarih, th=self.server.thresholds)
        if not m["ok"]:
            return {"ok": False, "reason": "imperative", "note": m["error"]}
        g = channels.send(cfg, kanal, m["text"], to=body.get("to"))
        if g["ok"]:
            patron.log(self.con, kanal, "manager", m["text"])
        return {"ok": g["ok"], "status": g["status"], "note": g["note"],
                "chars": len(m["text"])}

    # ------------------------------------------------------------ esleme
    #
    # Jetonu uc arayuze elle yapistirmak, HKM'nin hic acilmamasinin en
    # olasi sebebiydi. Cozum jetonu gevsetmek DEGIL, kisa bir pencere
    # acmak:
    #
    #   · pencereyi yalniz jetonu ZATEN bilen taraf acabilir (bearer),
    #   · pencere iki dakika yasar ve TEK KULLANIMLIKTIR,
    #   · jeton yalniz YEREL kokene verilir (127.0.0.1 / localhost / ::1),
    #   · jeton hicbir kayda, hicbir loga ve hicbir ekrana yazilmaz.
    #
    # Boylece «kapiyi ac» ile «kapiyi kir» arasindaki fark korunur.

    def _pair_state(self):
        srv = self.server
        if not hasattr(srv, "pair"):
            srv.pair = {"until": 0.0, "used": True}
            srv.pair_lock = threading.Lock()
        return srv.pair

    def _pair_open(self):
        durum = self._pair_state()
        with self.server.pair_lock:
            durum["until"] = time.time() + PAIR_SECONDS
            durum["used"] = False
        return self._send(200, {"ok": True, "seconds": PAIR_SECONDS,
                                "note": "Eşleme penceresi açıldı. Tek cihaz "
                                        "bağlanabilir; süre dolunca kapanır."})

    def _pair_status(self):
        durum = self._pair_state()
        kalan = max(0, int(durum["until"] - time.time()))
        return self._send(200, {"open": bool(kalan) and not durum["used"],
                                "seconds_left": kalan, "used": durum["used"]})

    def _pair_take(self):
        """Jetonu yerel cihaza verir. Bearer ISTEMEZ — isteyen taraf zaten
        jetonu bilmiyor; kapi pencerenin kendisidir."""
        origin = self.headers.get("Origin", "")
        if origin and not LOCAL_ORIGIN.match(origin):
            return self._send(403, {"error": "yalniz yerel koken"})
        durum = self._pair_state()
        with self.server.pair_lock:
            acik = time.time() < durum["until"] and not durum["used"]
            if not acik:
                return self._send(403, {
                    "error": "esleme penceresi kapali",
                    "note": "HKM yüzünden «Cihazları bağla» denmeli."})
            durum["used"] = True
        return self._send(200, {"token": self.server.config.get("local_token"),
                                "note": "Bu jeton yalnız bu cihazda saklanır."})

    def _send_page(self):
        """Yerel yuz — tek dosya, sifir bagimlilik.

        Sayfanin KENDISI jeton istemez cunku icinde veri yoktur: butun
        veri /api/* uzerinden gelir ve orasi bearer ister. Kullanici jetonu
        sayfaya girer, sayfa da kendi tarayicisinda saklar."""
        yol = os.path.join(ROOT, "web", "index.html")
        if not os.path.exists(yol):
            return self._send(404, {"error": "yuz kurulu degil"})
        with open(yol, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urlparse(self.path)
        if u.path in ("/", "/index.html"):
            return self._send_page()
        if u.path == "/api/health":
            return self._send(200, {"ok": True, "service": "hkm"})
        if u.path == "/api/wa/webhook":
            """Meta'nin kurulum dogrulamasi. Bearer TASIYAMAZ (istegi Meta
            yollar), bu yuzden tek kapi dogrulama jetonudur: yanlis jetonda
            hicbir sey yansitilmaz."""
            meydan = channels.verify_challenge(self.server.config, parse_qs(u.query))
            if meydan is None:
                return self._send(403, {"error": "dogrulama basarisiz"})
            body = str(meydan).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if not self._authorized():
            return self._send(401, {"error": "bearer gerekli"})
        q = parse_qs(u.query)
        date = (q.get("date") or [datetime.date.today().isoformat()])[0]
        if u.path == "/api/briefing":
            return self._send(200, briefing(self.con, date,
                                            th=self.server.thresholds))
        if u.path == "/api/twin":
            try:
                days = int((q.get("days") or [twin.WINDOW_DAYS])[0])
            except ValueError:
                return self._send(400, {"error": "days bir sayi olmali"})
            days = max(1, min(days, 365))
            return self._send(200, twin.snapshot(self.con, date, days))
        if u.path == "/api/cross":
            try:
                days = int((q.get("days") or [cross.PENCERE])[0])
            except ValueError:
                return self._send(400, {"error": "days bir sayi olmali"})
            days = max(7, min(days, 365))
            return self._send(200, {"date": date, "days": days,
                                    "pairs": cross.scan(self.con, date, days)})
        if u.path == "/api/pair/status":
            return self._pair_status()
        if u.path == "/api/conversation":
            try:
                limit = int((q.get("limit") or [40])[0])
            except ValueError:
                limit = 40
            return self._send(200, {"messages": patron.history(
                self.con, max(1, min(limit, 200)),
                (q.get("channel") or [None])[0])})
        if u.path == "/api/decisions":
            return self._send(200, {"date": date,
                                    "decisions": db.decisions_of(self.con, date),
                                    "current": db.current_decision(self.con, date)})
        return self._send(404, {"error": "yok"})

    def do_POST(self):
        u = urlparse(self.path)

        """WhatsApp webhook'u BEARER TASIYAMAZ: istegi Meta yollar. Kapisi
        imzadir — govde, uygulama sirriyla HMAC-SHA256 imzalanmamissa
        AYRISTIRILMAZ bile. Gonderen izin listesinde degilse icerik ambara
        yazilmaz; yalniz reddedildigi not edilir."""
        if u.path == "/api/wa/webhook":
            return self._wa_webhook()
        if u.path == "/api/tg/webhook":
            return self._tg_webhook()
        if u.path == "/api/pair":
            return self._pair_take()

        if not self._authorized():
            return self._send(401, {"error": "bearer gerekli"})
        if u.path == "/api/pair/open":
            return self._pair_open()
        if u.path == "/api/message":
            n = int(self.headers.get("Content-Length") or 0)
            try:
                body = json.loads(self.rfile.read(n) or b"{}")
            except ValueError:
                return self._send(400, {"error": "gecersiz JSON"})
            res = patron.respond(self.con, body.get("text"),
                                 date=body.get("date"),
                                 th=self.server.thresholds, channel="local")
            return self._send(200, res)
        if u.path == "/api/say":
            n = int(self.headers.get("Content-Length") or 0)
            try:
                body = json.loads(self.rfile.read(n) or b"{}")
            except ValueError:
                body = {}
            return self._send(200, self._say(body))
        if u.path.startswith("/api/decision/"):
            parca = u.path.strip("/").split("/")
            if len(parca) != 4 or parca[3] not in ("accept", "decline"):
                return self._send(404, {"error": "yok"})
            try:
                did = int(parca[2])
            except ValueError:
                return self._send(400, {"error": "oneri kimligi sayi olmali"})
            durum = "accepted" if parca[3] == "accept" else "declined"
            res = manager.respond(self.con, did, durum)
            return self._send(res["status"], res)
        if not u.path.startswith("/api/sync/"):
            return self._send(404, {"error": "yok"})
        n = int(self.headers.get("Content-Length") or 0)
        try:
            body = json.loads(self.rfile.read(n) or b"{}")
        except ValueError:
            return self._send(400, {"error": "gecersiz JSON"})
        body.setdefault("module", u.path.rsplit("/", 1)[-1])
        res = sync_engine.ingest(self.con, body, th=self.server.thresholds)
        return self._send(res["status"], res)


def main():
    cfg = load_config()
    if not cfg.get("local_token"):
        sys.stderr.write(
            "config.json yok ya da local_token bos. config.example.json'u "
            "kopyalayip uzun rastgele bir token koy.\n")
        return 1
    srv = ThreadingHTTPServer((cfg["host"], int(cfg["port"])), Handler)
    srv.config = cfg
    srv.local = threading.local()
    srv.db_path = cfg.get("db_path") or db.DB_PATH
    db.connect(srv.db_path).close()          # sema bir kez kurulur
    srv.thresholds = thresholds.load()
    sys.stderr.write("[hkm] http://%s:%s\n" % (cfg["host"], cfg["port"]))
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
