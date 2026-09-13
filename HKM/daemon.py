#!/usr/bin/env python3
"""HKM daemon — yalniz 127.0.0.1, yalniz bearer'li istek.

    python daemon.py            # http://127.0.0.1:4200

Ucnoktalar:
    POST /api/sync/<modul>          etiketli metrikleri yutar (202 / 422)
    GET  /api/briefing?date=        gunun brifingi: VP raporlari + TEK oneri
    GET  /api/twin?date=&days=      dijital ikiz: son N gunun tek resmi
    GET  /api/decisions?date=       gunun butun onerileri (reddedilenler dahil)
    POST /api/decision/<id>/accept  oneriyi kabul et
    POST /api/decision/<id>/decline oneriyi reddet — kayit silinmez
    GET  /api/health                token istemez

Dis dunyaya acilmaz: host varsayilani 127.0.0.1'dir ve config.json ile
degistirilmesi bilincli bir karardir.
"""

import datetime
import json
import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core import db, manager, sync_engine, thresholds, twin  # noqa: E402

ROOT = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(ROOT, "config.json")


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
        self.end_headers()
        self.wfile.write(body)

    def _authorized(self):
        head = self.headers.get("Authorization", "")
        given = head[7:] if head.startswith("Bearer ") else ""
        return sync_engine.check_token(given, self.server.config.get("local_token"))

    def log_message(self, fmt, *args):
        sys.stderr.write("[hkm] " + (fmt % args) + "\n")

    # --- yollar ----------------------------------------------------------
    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/api/health":
            return self._send(200, {"ok": True, "service": "hkm"})
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
        if u.path == "/api/decisions":
            return self._send(200, {"date": date,
                                    "decisions": db.decisions_of(self.con, date),
                                    "current": db.current_decision(self.con, date)})
        return self._send(404, {"error": "yok"})

    def do_POST(self):
        u = urlparse(self.path)
        if not self._authorized():
            return self._send(401, {"error": "bearer gerekli"})
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
