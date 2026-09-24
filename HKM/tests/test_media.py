# -*- coding: utf-8 -*-
import os
import tempfile

from core import db, media
from tests.harness import eq, no, ok, suite, test


def _ek(con, size=4, kind="document"):
    con.execute("INSERT INTO attachments(channel,sender,message_id,kind,file_id,"
                "size,state,created_at) VALUES ('telegram','1','1',?,?,?,'received','2026-09-15')",
                (kind, "f1", size))


def run():
    suite("medya")

    def t_download_is_bounded_and_persisted():
        con = db.connect(":memory:")
        _ek(con)
        with tempfile.TemporaryDirectory() as kok:
            def j(url): return {"ok": True, "result": {"file_path": "docs/a.txt"}}
            def b(url, limit): return b"test"
            r = media.process_next(con, {"channels": {"telegram": {
                "bot_token": "T"}}}, transport=(j, b), root=kok)
            ok(r["ok"])
            row = con.execute("SELECT * FROM attachments").fetchone()
            eq(row["state"], "ready")
            ok(os.path.exists(row["local_path"]))
            eq(row["sha256"], r["sha256"])
    test("Telegram dosyasi sinirli ve atomik indirilir", t_download_is_bounded_and_persisted)

    def t_ayni_ek_iki_kez_islenmez():
        """HATALAR D-15: ritim ve «Ekleri isle» dugmesi ayni anda ayni «received»
        satirini aliyor, ikisi de indiriyor ve ayni «.yeni» gecici adina
        yaziyordu. Indirme SURERKEN ikinci cagri yapilir."""
        con = db.connect(":memory:")
        _ek(con)
        cfg = {"channels": {"telegram": {"bot_token": "T"}}}
        with tempfile.TemporaryDirectory() as kok:
            ic, indirilen = [], []

            def j(url):
                return {"ok": True, "result": {"file_path": "docs/a.txt"}}

            def b(url, limit):
                indirilen.append(url)
                if len(indirilen) == 1:
                    ic.append(media.process_next(con, cfg, transport=(j, b), root=kok))
                return b"test"
            r = media.process_next(con, cfg, transport=(j, b), root=kok)
            ok(r["ok"])
            eq(len(indirilen), 1)
            eq(ic[0].get("processed"), 0)
            eq(con.execute("SELECT state FROM attachments").fetchone()[0], "ready")
    test("ayni ek iki cagrida iki kez islenmez (D-15)", t_ayni_ek_iki_kez_islenmez)

    def t_known_oversize_never_calls_network():
        con = db.connect(":memory:")
        _ek(con, size=3 * 1024 * 1024)
        called = []
        r = media.process_next(con, {"media": {"max_document_mb": 1},
            "channels": {"telegram": {"bot_token": "T"}}},
            transport=(lambda u: called.append(u), lambda u, l: b""))
        no(r["ok"])
        eq(r["reason"], "too-large")
        eq(called, [])
        eq(con.execute("SELECT state FROM attachments").fetchone()[0], "rejected")
    test("boyutu bilinen buyuk dosya aga cikmadan reddedilir",
         t_known_oversize_never_calls_network)

    def t_no_token_keeps_item_for_retry():
        con = db.connect(":memory:")
        _ek(con)
        r = media.process_next(con, {})
        eq(r["reason"], "no-token")
        eq(con.execute("SELECT state FROM attachments").fetchone()[0], "received")
    test("jeton eksigi kuyruk kaydini kaybetmez", t_no_token_keeps_item_for_retry)
