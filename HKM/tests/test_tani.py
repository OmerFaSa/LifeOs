# -*- coding: utf-8 -*-
"""Bozuk olani soyleyen tek ekran (fikir 48; core/tani.py).

   Kanitladigi sozler:
     1. Her madde tamam / uyari / bozuk der ve NEREDE duzeltilecegini yazar.
     2. Olculmeyen sey «tamam» diye raporlanmaz (AGENTS §1.7): hic veri
        yollamamis modul uyaridir, «sorun yok» degildir.
     3. Veri gelen modul tamam olur; bozuk sayisi ozet cumlede durur."""
import os
import shutil
import tempfile

from core import db, sync_engine, tani
from tests.harness import eq, metric, no, ok, suite, test

BUGUN = "2026-09-14"


def run():
    suite("tani")

    def t_bos_kurulum():
        kok = tempfile.mkdtemp(prefix="hkm-tani-")
        try:
            con = db.connect(":memory:")
            cfg = {"local_token": "x", "web": {"acik": False}}
            r = tani.ozet(con, cfg, BUGUN, os.path.join(kok, "h.db"))
            ad = {m["ad"]: m for m in r["maddeler"]}
            eq(ad["Sohbet modeli"]["durum"], "bozuk")
            ok("Yapay zekâ" in ad["Sohbet modeli"]["nerede"])
            eq(ad["AYS bağlantısı"]["durum"], "uyari")          # hic veri yok: tamam DEGIL
            eq(ad["Web araması"]["durum"], "uyari")
            ok(r["bozuk"] >= 1 and str(r["bozuk"]) in r["metin"], r["metin"])
            sync_engine.ingest(con, {"module": "ays", "date": BUGUN,
                                     "metrics": {"questions": metric(40)}}, now=BUGUN + "T09:00:00")
            r = tani.ozet(con, cfg, BUGUN, os.path.join(kok, "h.db"))
            eq({m["ad"]: m for m in r["maddeler"]}["AYS bağlantısı"]["durum"], "tamam")
        finally:
            shutil.rmtree(kok)
    test("bos kurulumda bozuk ve uyari soylenir, nerede duzeltilecegi yazilir", t_bos_kurulum)
