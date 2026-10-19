# -*- coding: utf-8 -*-
"""Kutu — moduller arasi kayit kutusu (2026-10-19, mimari denetim:
   «SPİ'ye ait kayit AYS'de anlatilinca hesap oturumu yoksa kaybolabiliyor»).

   King bir modulde anlatilan ve OBUR module ait satiri (ham metin) buraya
   birakir; o modulde King acilinca satiri alir, o modulun KENDI
   ayristiricisiyla onizler ve kullanici onaylarsa modul kendi koduyla yazar.

   Uc kural (AGENTS §1.4):
   1. HKM SATIRI ANLAMAZ VE MODULE YAZMAZ: yalniz tasir. Ayristirma ve kayit
      hedef modulundur.
   2. ALINAN SATIR SILINIR: ayni kayit iki kez onaya gelmez.
   3. SINIRLI: modul basina en cok EN_COK satir, satir basina EN_UZUN harf;
      dosya HKM'nin veri klasorunde (db yaninda) durur, git'e girmez."""
import datetime
import json
import os
import threading

MODULLER = ("ays", "spi", "esp")
EN_COK = 50
EN_UZUN = 400
_KILIT = threading.Lock()


def _yol(srv):
    db = getattr(srv, "db_path", "") or ""
    return os.path.join(os.path.dirname(os.path.abspath(db)) if db and db != ":memory:" else os.getcwd(), "kutu.json")


def _oku(yol):
    try:
        with open(yol, encoding="utf-8") as f:
            v = json.load(f)
        return v if isinstance(v, list) else []
    except (OSError, ValueError):
        return []


def _yaz(yol, liste):
    gecici = yol + ".tmp"
    with open(gecici, "w", encoding="utf-8") as f:
        json.dump(liste, f, ensure_ascii=False)
    os.replace(gecici, yol)


def ekle(srv, modul, metin, kaynak=None):
    t = " ".join(str(metin or "").split())[:EN_UZUN]
    if modul not in MODULLER or not t:
        return {"ok": False, "note": "Modül (ays, spi, esp) ve metin gerekli."}
    with _KILIT:
        yol = _yol(srv)
        l = [x for x in _oku(yol) if isinstance(x, dict)]
        if sum(1 for x in l if x.get("modul") == modul) >= EN_COK:
            return {"ok": False, "note": "Bu modülün kutusu dolu; önce o modülde King'i aç."}
        l.append({"modul": modul, "metin": t, "kaynak": kaynak if kaynak in MODULLER else None,
                  "at": datetime.datetime.now().isoformat(timespec="seconds")})
        _yaz(yol, l)
    return {"ok": True}


def al(srv, modul):
    with _KILIT:
        yol = _yol(srv)
        l = [x for x in _oku(yol) if isinstance(x, dict)]
        bura = [x for x in l if x.get("modul") == modul]
        if bura:
            _yaz(yol, [x for x in l if x.get("modul") != modul])
    return bura
