"""Tek deponun (sistem/veri.py, lifeos.db) salt-okur kopyası: eğriler ve yerel set kurucusu buradan okur.

Canlı dosya `mode=ro` ile açılır, bellekteki bir kopyaya alınır (SQLite yedekleme yolu), hemen kapanır: hiçbir
dosyaya yazılmaz. Yol: LIFEOS_TEK_DEPO ortam değişkeni (boş = depo yok; testler ve CI böyle), yoksa
%LOCALAPPDATA%/LifeOS/veri/lifeos.db (sistem/goc.py varsayilan()'daki «hedef»).
"""
import json
import os
import sqlite3
from pathlib import Path

ORTAM = "LIFEOS_TEK_DEPO"


def yol():
    if ORTAM in os.environ:
        return Path(os.environ[ORTAM]) if os.environ[ORTAM] else None
    yerel = os.environ.get("LOCALAPPDATA")
    return Path(yerel, "LifeOS", "veri", "lifeos.db") if yerel else None


def kayitlar(p=None):
    """[(tur, alan, yol, govde)] silinmemiş kayıtlar; depo yoksa None."""
    p = Path(p) if p else yol()
    if not p or not p.is_file():
        return None
    ro = sqlite3.connect(p.resolve().as_uri() + "?mode=ro", uri=True)
    kopya = sqlite3.connect(":memory:")
    try:
        ro.backup(kopya)
    finally:
        ro.close()
    out = []
    for tur, alan, y, g in kopya.execute("SELECT tur, alan, yol, govde FROM kayit WHERE silindi=0 ORDER BY id"):
        try:
            out.append((tur, alan, y, json.loads(g) if g is not None else None))
        except ValueError:
            out.append((tur, alan, y, None))
    kopya.close()
    return out
