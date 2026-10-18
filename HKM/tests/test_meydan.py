# -*- coding: utf-8 -*-
"""Meydan KALDIRILDI (kullanici, 2026-10-18: «sosyal medya bolumunu sil,
   cok islevsiz bir bolum»).

   Kanitladigi sozler:
     1. Kod, sayfa ve yuzdeki dugme yoktur: core/meydan.py, web/meydan.html
        ve index.html'deki «meydan-» blogu geri gelmez.
     2. Uclar kapalidir: /meydan sayfa vermez, /api/meydan* 404 doner.
     3. Kullanicinin izi silinmez: meydan_* tablolari semada ve yedekte
        durur (notlar, deste); yalniz onlari gosteren yuz kalkti."""
import os

from core import db
from tests.harness import eq, no, ok, suite, test

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def run():
    suite("meydan kaldırıldı")

    def t_dosyalar():
        no(os.path.exists(os.path.join(KOK, "core", "meydan.py")), "core/meydan.py yok")
        no(os.path.exists(os.path.join(KOK, "web", "meydan.html")), "web/meydan.html yok")
        with open(os.path.join(KOK, "web", "index.html"), encoding="utf-8") as f:
            yuz = f.read()
        no("meydan-ac" in yuz or "/api/meydan" in yuz or "<!-- MEYDAN" in yuz, "yuzde Meydan blogu yok")

    def t_iz_durur():
        con = db.connect(":memory:")
        adlar = {r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        for t in ("meydan_deste", "meydan_isaret", "meydan_not", "meydan_yanit"):
            ok(t in adlar, t + " semada")
            ok(t in db.BACKUP_TABLES, t + " yedekte")

    test("kod, sayfa ve düğme yok", t_dosyalar)
    test("kullanıcının izi silinmez", t_iz_durur)


def run_daemon():
    from tests.test_daemon import _Server
    suite("meydan kaldırıldı · uçlar")

    def t_uclar():
        s = _Server()
        try:
            eq(s.call("/api/meydan")[0], 404)
            eq(s.call("/api/meydan/deste")[0], 404)
            eq(s.call("/api/meydan/not", body={"metin": "x"})[0], 404)
            eq(s.call("/meydan")[0], 404)
        finally:
            s.close()

    test("uçlar kapalı", t_uclar)
