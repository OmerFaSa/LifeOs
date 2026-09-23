# -*- coding: utf-8 -*-
"""Testlerin ortak yardimcilari.

   onayla: King'in onay kapisi (Part 8a-3). Ucretli is teklifte bekler;
   kullanicinin onayi olmadan BAM'da acilmaz. Isin URETIMINI sinayan testler
   onayi kullanici gibi verir; onay kapisinin kendisi tests/test_teklif.py'de."""
from core import king


def onayla(con, cfg, r, now=None, secenek="tam"):
    if r.get("ok") and (r.get("emir") or {}).get("durum") == "teklif":
        return king.teklif_onayla(con, cfg, r["emir"]["id"], secenek, now=now)
    return r
