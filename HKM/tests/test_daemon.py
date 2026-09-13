# -*- coding: utf-8 -*-
"""Daemon — yollar, yetki ve gercek bir HTTP istegi.

   Cekirdek fonksiyonlari test etmek yetmez: bu katmanin hatalari yol
   eslestirmede, yetki kontrolunde ve durum kodlarinda cikar. Bu yuzden
   burada gercek bir soket acilir — yalniz 127.0.0.1'de, gecici bir port
   ve bellekte degil gecici dosyada bir veritabaniyla.
"""

import json
import os
import tempfile
import threading
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

import daemon
from core import db, thresholds
from tests.harness import eq, metric, no, ok, suite, test

TOKEN = "test-token-uzun-ve-rastgele"
BUGUN = "2026-09-13"


class _Server(object):
    def __init__(self):
        self.dir = tempfile.mkdtemp(prefix="hkm-test-")
        self.db_path = os.path.join(self.dir, "hkm.db")
        db.connect(self.db_path).close()
        self.srv = ThreadingHTTPServer(("127.0.0.1", 0), daemon.Handler)
        self.srv.config = {"local_token": TOKEN}
        self.srv.local = threading.local()
        self.srv.db_path = self.db_path
        self.srv.thresholds = thresholds.DEFAULTS
        self.port = self.srv.server_address[1]
        self.thread = threading.Thread(target=self.srv.serve_forever, daemon=True)
        self.thread.start()

    def url(self, yol):
        return "http://127.0.0.1:%d%s" % (self.port, yol)

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

        def t_unknown_path():
            eq(S.call("/api/yok")[0], 404)
            eq(S.call("/api/yok", body={})[0], 404)
        test("bilinmeyen yol 404", t_unknown_path)

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
