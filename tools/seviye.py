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

   NE YAYILIR

     kademeler.js   kademe adlari, renkleri, XP esikleri, etkinlikler
     xp.js          motor (ad alani ve modul kimligi yerine konur)
     perde.js       tam ekran gosterim katmani
     rutbe.js       RUTBE ekrani (kademe, merdiven, XP kaynaklari)
     seviye.css     perde ve rozet bicimleri
     xp.test.js     motorun sozlesmesi
     perde.test.js  perdenin sozlesmesi
     perde.html     index.html icindeki DURAGAN perde markupi
                    (SEVIYE:perde isaretleri arasi)
     ortak_yol.py   dort sunucudaki /img/seviye/ yol muhafizi
                    (SEVIYE:yol isaretleri arasi)
     dist_kopya.py  uc build.py'deki medya kopyalayici
                    (SEVIYE:dist isaretleri arasi)

   Yani bu ozellikte elle kopyalanan HICBIR blok kalmadi: hepsi tek
   kaynaktan yayiliyor ve --denetle ayrismayi yakaliyor.

   VIDEO VE ROZET GORSELLERI KOPYALANMAZ

   `brand/seviye/kademe-1.mp4` gibi dosyalar TEK KOPYA durur; uc sunucu
   da onlari `/img/seviye/...` adresinden ayni klasorden servis eder
   (bkz. sunucu.py ve her sistemin devserver.py'si). Alti kademelik bir
   video seti uc kez kopyalansa depo yuz megabayta yaklasirdi; ayni
   dosyaya uc kapidan bakmak bedava.

   Cikis kodu: 0 temiz, 1 ayrisma/eksik var.
"""

import re
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
    ("rutbe.js",     "src/js/screens/rutbe.js",  True),
    ("seviye.css",   "src/css/seviye.css",       False),
    ("xp.test.js",   "src/tests/xp.test.js",     True),
    ("perde.test.js", "src/tests/perde.test.js", True),
]

BASLIK = ("/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.\n"
          "   Düzeltme brand/seviye/%s içine yazılır; burası bir sonraki\n"
          "   `python3 tools/seviye.py --yay` ile yeniden üretilir. */\n")


def uret(ad: str, ad_alani: str, mod: str, degistir: bool) -> str:
    govde = (KAYNAK / ad).read_text(encoding="utf-8")
    if degistir:
        govde = govde.replace("__NS__", ad_alani)
        govde = govde.replace("__MOD__", mod)
    return (BASLIK % ad) + govde


# Python sunucularin ortak yol muhafizi. Ayni blok dort dosyada duruyor;
# elle guncellenen dordu bir gun ayrisirdi — JS tarafi icin yazilan
# denetimin Python tarafini disarida birakmasi tutarsizlikti.
YOL_BAS = "# SEVIYE:yol-bas"
YOL_BIT = "# SEVIYE:yol-bit"
YOL_HEDEFLER = ["AYS/devserver.py", "SPI/devserver.py", "ESP/devserver.py",
                "sunucu.py"]

# Tek dosya surumune medya kopyalayan blok — uc build.py'de ayni.
DIST_BAS = "# SEVIYE:dist-bas"
DIST_BIT = "# SEVIYE:dist-bit"
DIST_HEDEFLER = ["AYS/build.py", "SPI/build.py", "ESP/build.py"]


def yol_govdesi() -> str:
    return (KAYNAK / "ortak_yol.py").read_text(encoding="utf-8")


def dist_govdesi() -> str:
    return (KAYNAK / "dist_kopya.py").read_text(encoding="utf-8")


def _isaret_arasi(metin: str, bas: str, bit: str):
    a = metin.find(bas)
    b = metin.find(bit)
    if a < 0 or b < 0 or b < a:
        return None
    return (a + len(bas), b)


def blok_yaz(yol: Path, bas: str, bit: str, govde: str) -> bool:
    """Isaretler arasini tazeler. Doner: degisti mi."""
    metin = yol.read_text(encoding="utf-8")
    aralik = _isaret_arasi(metin, bas, bit)
    if not aralik:
        print("  ! %s icinde %s isareti yok, atlandi" % (yol.name, bas))
        return False
    yeni = metin[:aralik[0]] + "\n" + govde + metin[aralik[1]:]
    if yeni == metin:
        return False
    yol.write_text(yeni, encoding="utf-8")
    return True


def blok_ayni(yol: Path, bas: str, bit: str, govde: str) -> bool:
    metin = yol.read_text(encoding="utf-8")
    aralik = _isaret_arasi(metin, bas, bit)
    if not aralik:
        return False
    return metin[aralik[0]:aralik[1]] == "\n" + govde


PERDE_BAS = "<!-- SEVIYE:perde-bas"
PERDE_BIT = "<!-- SEVIYE:perde-bit -->"


def perde_govdesi(ad_alani: str) -> str:
    """Duragan marka perdesinin HTML'i — tek kaynaktan.

    Uc index.html icinde elle duran bir markup, bir gun perde.js'in
    bekledigi yapidan ayrisir ve "Gec" dugmesi sessizce calismaz hale
    gelir. Dosyalar gibi markup da yayilir."""
    return (KAYNAK / "perde.html").read_text(encoding="utf-8") \
        .replace("__NS__", ad_alani)


def perde_yaz(yol: Path, ad_alani: str) -> bool:
    """index.html icindeki isaretler arasini tazeler. Doner: degisti mi."""
    metin = yol.read_text(encoding="utf-8")
    bas = metin.find(PERDE_BAS)
    bit = metin.find(PERDE_BIT)
    if bas < 0 or bit < 0:
        print("  ! %s icinde SEVIYE:perde isaretleri yok, atlandi"
              % yol.name)
        return False
    bas_son = metin.find("-->", bas)
    if bas_son < 0:
        return False
    yeni = (metin[:bas_son + 3] + "\n"
            + perde_govdesi(ad_alani)
            + metin[bit:])
    if yeni == metin:
        return False
    yol.write_text(yeni, encoding="utf-8")
    return True


def perde_ayni(yol: Path, ad_alani: str) -> bool:
    metin = yol.read_text(encoding="utf-8")
    bas = metin.find(PERDE_BAS)
    bit = metin.find(PERDE_BIT)
    if bas < 0 or bit < 0:
        return False
    bas_son = metin.find("-->", bas)
    return metin[bas_son + 3:bit] == "\n" + perde_govdesi(ad_alani)


def perde_siniflari() -> list:
    """perde.js'in querySelector ile ARADIGI .perde__* siniflari.

    Liste elle tutulmaz, koddan cikarilir: elle tutulan bir liste bir
    gun koddan geri kalir ve denetim, denetledigini sandigi seyi
    denetlemez."""
    govde = (KAYNAK / "perde.js").read_text(encoding="utf-8")
    return sorted(set(re.findall(r"querySelector\('\.(perde__[a-z-]+)'\)",
                                 govde)))


# Duragan MARKA perdesinde bulunmasi GEREKMEYEN siniflar. Banner yalniz
# seviye kutlamasinda cizilir ve JavaScript kurar; marka girisinde
# gosterilecek bir kademe yoktur.
PERDE_ISTEGE_BAGLI = {"perde__banner"}


def perde_markup_eksigi(ad_alani: str) -> list:
    """Duragan markupta bulunmasi gerekip de bulunmayan siniflar.

    perde.js bir sinifi ariyor ama markupta yoksa, o davranis SESSIZCE
    calismaz: halkasiz bir "Gec" dugmesi, sayaci donmeyen bir perde,
    hic gorunmeyen bir ses dugmesi. Hata vermez — sadece eksiktir."""
    markup = perde_govdesi(ad_alani)
    return [s for s in perde_siniflari()
            if s not in PERDE_ISTEGE_BAGLI and s not in markup]


def _bloklar():
    """(dosya, bas isareti, bit isareti, govde, etiket) dizisi."""
    for g in YOL_HEDEFLER:
        yield (g, YOL_BAS, YOL_BIT, yol_govdesi(), "ortak yol muhafizi")
    for g in DIST_HEDEFLER:
        yield (g, DIST_BAS, DIST_BIT, dist_govdesi(), "dist medya kopyasi")


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
        index = kok / "src" / "index.html"
        if index.exists() and perde_yaz(index, ad_alani):
            print("  ✓ %s (duragan perde)" % index.relative_to(KOK))
            n += 1
    for goreli, bas, bit, govde, etiket in _bloklar():
        hedef = KOK / goreli
        if hedef.exists() and blok_yaz(hedef, bas, bit, govde):
            print("  ✓ %s (%s)" % (goreli, etiket))
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
        index = kok / "src" / "index.html"
        if index.exists() and not perde_ayni(index, ad_alani):
            hatalar.append("%s icindeki duragan perde AYRISMIS — duzeltme "
                           "brand/seviye/perde.html icine yazilir"
                           % index.relative_to(KOK))
    for goreli, bas, bit, govde, etiket in _bloklar():
        hedef = KOK / goreli
        if hedef.exists() and not blok_ayni(hedef, bas, bit, govde):
            hatalar.append("%s icindeki %s AYRISMIS — duzeltme "
                           "brand/seviye/ icine yazilir" % (goreli, etiket))
    eksik = perde_markup_eksigi("X")
    if eksik:
        hatalar.append("brand/seviye/perde.html icinde perde.js'in aradigi "
                       "siniflar YOK: %s" % ", ".join(eksik))
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
