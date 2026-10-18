# -*- coding: utf-8 -*-
"""Dinle (core/dinle.py): Whisper varsa o, yoksa Gemini; ikisi de yoksa
   notlarla «yok». Gecersiz kayit reddedilir; uc bearer ister."""
import os
import tempfile

from core import butce, db, dinle, models, ses
from tests.harness import eq, no, ok, suite, test

WAV = ses.wav(b"\x00\x00" * 1600, 16000)


def _bul():
    d = tempfile.mkdtemp(prefix="hkm-whisper-")
    return {"bulundu": True, "exe": os.path.join(d, "whisper-cli.exe"),
            "model": os.path.join(d, "ggml-small.bin"), "aranan": [d], "metin": ""}


def run():
    suite("dinle")

    def t_sira():
        con = db.connect(":memory:")
        r = dinle.yaziya(con, {}, WAV, calistir=lambda e, m, w, t: " «Merhaba King» \n", bul=_bul())
        eq((r["ok"], r["metin"], r["motor"]), (True, "Merhaba King", "whisper"))
        yok = {"bulundu": False, "metin": "Whisper bu bilgisayarda yok."}
        r = dinle.yaziya(con, {}, WAV, bul=yok)
        eq((r["ok"], len(r["notlar"])), (False, 2))
        k, g = models.key_value, butce.guard
        models.key_value = lambda cfg, p, kid=None: "AIza" if p == "google" else None
        butce.guard = lambda con, cfg, **kw: {"ok": True}
        try:
            post = lambda u, b, gv, t: {"candidates": [{"content": {"parts": [{"text": "Bugün koştum."}]}}],
                                        "usageMetadata": {"promptTokenCount": 50, "candidatesTokenCount": 5}}
            r = dinle.yaziya(con, {}, WAV, post=post, bul=yok)
            eq((r["ok"], r["metin"], r["motor"]), (True, "Bugün koştum.", "gemini"))
            eq(con.execute("SELECT role FROM usage").fetchone()["role"], "dinle")
        finally:
            models.key_value, butce.guard = k, g
        no(dinle.yaziya(con, {}, b"bozuk", bul=_bul())["ok"], "gecersiz kayit")

    def t_bul():
        w = dinle.whisper_bul(ara=lambda x: None)
        if not w["exe"]:
            ok("tavsiye" in w["metin"], w["metin"])

    test("sıra: Whisper, Gemini, yok; geçersiz kayıt reddedilir", t_sira)
    test("Whisper yoksa tavsiye yazılır", t_bul)


def run_daemon():
    from tests.test_daemon import _Server
    suite("dinle · uçlar")

    def t_uclar():
        s = _Server()
        try:
            eq(s.call("/api/dinle/durum", token=None)[0], 401)
            eq(s.call("/api/dinle/durum")[0], 200)
            st, r = s.call("/api/dinle", body={"wav": "eHg="})
            eq((st, r["ok"]), (503, False))
        finally:
            s.close()

    test("uçlar bearer ister; geçersiz kayıt 503", t_uclar)
