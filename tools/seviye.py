#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Seviye sistemini uc arayuze YAYAR ve kopyalarin ayrismadigini DENETLER.

   NEDEN BOYLE

   Kademe adlari, renkleri ve XP esikleri UC sistemin de ayni sozu
   soylemesi gereken tek seydir: AYS'te "Altin" olan, SPI'de de
   "Altin"dir. Uc ayri dosyada tutulan bir liste bir gun ayrisir ve
   ayrismanin farkina ancak kullanici iki ekrani yan yana koydugunda
   varilir.

   Bu yuzden tek kaynak `brand/seviye/` altinda durur ve buradan
   kopyalanir. Kopyalar elle DUZENLENMEZ; duzenlenirse bir sonraki
   yayinda kaybolur (ve `--denetle` bunu once yakalar).

     python3 tools/seviye.py --yay        kaynagi uc arayuze kopyala
     python3 tools/seviye.py --denetle    kopyalar kaynakla ayni mi

   VIDEO VE ROZET GORSELLERI KOPYALANMAZ

   `brand/seviye/kademe-1.mp4` gibi dosyalar TEK KOPYA durur; uc sunucu
   da onlari `/img/seviye/...` adresinden ayni klasorden servis eder
   (bkz. sunucu.py ve her sistemin devserver.py'si). Alti kademelik bir
   video seti uc kez kopyalansa depo yuz megabayta yaklasirdi; ayni
   dosyaya uc kapidan bakmak bedava.

   Cikis kodu: 0 temiz, 1 ayrisma/eksik var.
"""

import filecmp
import shutil
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
KAYNAK = KOK / "brand" / "seviye"

# (klasor, ad alani, modul kimligi)
SISTEMLER = [("AYS", "R", "ays"), ("SPI", "SP", "spi"), ("ESP", "ESP", "esp")]

# (kaynak dosya, hedef goreli yol, ad alani degistirilsin mi)
DOSYALAR = [
    ("kademeler.js", "src/js/data/kademeler.js", False),
    ("xp.js",        "src/js/core/xp.js",        True),
    ("perde.js",     "src/js/core/perde.js",     True),
    ("seviye.css",   "src/css/seviye.css",       False),
    ("xp.test.js",   "src/tests/xp.test.js",     True),
]

BASLIK = ("/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.\n"
          "   Düzeltme brand/seviye/%s içine yazılır; burası bir sonraki\n"
          "   `python3 tools/seviye.py --yay` ile yeniden üretilir. */\n")


def uret(ad: str, ad_alani: str, mod: str, degistir: bool) -> str:
    govde = (KAYNAK / ad).read_text(encoding="utf-8")
    if degistir:
        govde = govde.replace("__NS__", ad_alani)
        govde = govde.replace("__MOD__", mod)
    yorum = BASLIK % ad
    if ad.endswith(".css"):
        return yorum + govde
    return yorum + govde


def yay() -> int:
    if not KAYNAK.is_dir():
        print("HATA: %s yok" % KAYNAK)
        return 1
    n = 0
    for klasor, ad_alani, mod in SISTEMLER:
        kok = KOK / klasor
        if not (kok / "src").is_dir():
            print("  • %-4s src/ yok, atlandi" % klasor)
            continue
        for ad, hedef_yol, degistir in DOSYALAR:
            hedef = kok / hedef_yol
            hedef.parent.mkdir(parents=True, exist_ok=True)
            yeni = uret(ad, ad_alani, mod, degistir)
            eski = hedef.read_text(encoding="utf-8") if hedef.exists() else None
            if eski == yeni:
                continue
            hedef.write_text(yeni, encoding="utf-8")
            print("  ✓ %s" % hedef.relative_to(KOK))
            n += 1
    print("\n%d dosya yazildi." % n if n else "\nHepsi zaten guncel.")
    return 0


def denetle() -> int:
    hatalar = []
    for klasor, ad_alani, mod in SISTEMLER:
        kok = KOK / klasor
        if not (kok / "src").is_dir():
            continue
        for ad, hedef_yol, degistir in DOSYALAR:
            hedef = kok / hedef_yol
            if not hedef.exists():
                hatalar.append("%s yok — `python3 tools/seviye.py --yay`"
                               % hedef.relative_to(KOK))
                continue
            if hedef.read_text(encoding="utf-8") != uret(ad, ad_alani, mod, degistir):
                hatalar.append("%s kaynaktan AYRISMIS — duzeltme "
                               "brand/seviye/%s icine yazilir"
                               % (hedef.relative_to(KOK), ad))
    if hatalar:
        print("Seviye sistemi ayrismis:\n")
        for h in hatalar:
            print("  ✕ " + h)
        return 1
    print("Seviye sistemi: uc arayuzde de kaynakla ayni.")
    return 0


def main() -> int:
    if "--yay" in sys.argv:
        return yay()
    if "--denetle" in sys.argv:
        return denetle()
    print(__doc__)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
