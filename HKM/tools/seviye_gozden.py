# -*- coding: utf-8 -*-
"""Seviye secimini gozden gecir — son mesajlar hangi modele gitti, neden?

    python tools/seviye_gozden.py            # son 40 mesaj
    python tools/seviye_gozden.py --son 100
    python tools/seviye_gozden.py --ozet     # yalniz sayilar

Sohbet mesajlarini BUGUNKU kurallarla (core/seviye.py) yeniden siniflar ve
nedeniyle yazar. Yanlis seviyeye dusen bir mesaj gorulurse kalip
core/seviye.py'ye eklenir ve test_seviye.py'ye o mesajla bir test yazilir.

Yalniz okur; hicbir sey yazmaz, model cagirmaz, veri makineden cikmaz.
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core import db, seviye  # noqa: E402


def gozden(con, son=40):
    """[(seviye, neden, metin)] — en yeniden eskiye, yalniz kullanici mesajlari."""
    satirlar = con.execute(
        "SELECT text FROM conversations WHERE role = 'user' ORDER BY id DESC LIMIT ?",
        (int(son),)).fetchall()
    out = []
    for r in satirlar:
        s = seviye.sinifla(r["text"])
        out.append((s["seviye"], s["neden"], r["text"]))
    return out


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass
    p = argparse.ArgumentParser(description="Seviye seçimini gözden geçir.")
    p.add_argument("--son", type=int, default=40, help="kaç mesaj (varsayılan 40)")
    p.add_argument("--ozet", action="store_true", help="yalnız seviye sayıları")
    p.add_argument("--db", help="veritabanı yolu (varsayılan: HKM/db/hkm.db)")
    a = p.parse_args(argv)
    yol = a.db
    if not yol:
        try:
            import kur
            yol = (kur.oku(kur.CONFIG) or {}).get("db_path")
        except Exception:                           # noqa: BLE001
            yol = None
    con = db.connect(yol or None)
    liste = gozden(con, a.son)
    if not liste:
        print("Henüz sohbet mesajı yok.")
        return 0
    sayac = {s: sum(1 for x in liste if x[0] == s) for s in seviye.SEVIYELER}
    print("Son %d mesaj · alt %d · orta %d · üst %d" % (
        len(liste), sayac["alt"], sayac["orta"], sayac["ust"]))
    if not a.ozet:
        for s, neden, metin in liste:
            kisa = " ".join(metin.split())
            print("  %-4s %-60s  ← %s" % (s, (kisa[:57] + "…") if len(kisa) > 58 else kisa, neden))
        print("\nYanlış seviyeye düşen bir mesaj görürsen onu core/seviye.py'ye kalıp olarak ekle "
              "ve tests/test_seviye.py'ye o mesajla bir test yaz.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
