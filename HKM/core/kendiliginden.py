# -*- coding: utf-8 -*-
"""Kendiliginden model kullanimi — TEK ANAHTAR (`king.kendiliginden`).

   Kullanici, 2026-10-26: «HKM modeli ne zaman kullanir, ben karar vereyim;
   kendi basina arastirmayi tek dugmeyle acip kapatayim.»

   1. VARSAYILAN KAPALI. Kapaliyken HKM modeli yalniz kullanici isteyince
      cagirir: sohbet, «Araştır», onaylanan teklif ve gorev.
   2. TEK ANAHTAR, UC KAPI. Kullanicinin istemedigi model isi uc yerden
      dogar ve uc de buna bakar: King'in guncellik turu (core/king.py
      bekci) yeni arastirma ACMAZ; sirada bekleyen kendiliginden BAM isi
      (kaynak «kendiliginden») KOSMAZ, acilinca sirasi gelir; Ollama'nin
      sicak tutmasi (core/ollama.py isit) modeli YUKLEMEZ.
   3. Anahtar Bugun'un sistem kartindadir (web/index.html aktifCiz)."""


def acik(cfg):
    return bool(((cfg or {}).get("king") or {}).get("kendiliginden") is True)
