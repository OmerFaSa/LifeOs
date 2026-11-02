#!/usr/bin/env python3
"""Gorev 072 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
Ogretme motoru (brand/ortak/ogret.js, KING-4 §D) modul belgelerinde ve ortak dizinde anlatilir.
python tools/ogret_belge_kabul_test.py"""
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
BELGE = {
    "AYS/src/DURUSTLUK.md": ["ays.king.tekrar", "ays.ogret.son", ".yedek", "benzer"],
    "SPI/src/MIMARI.md": ["spi.ogret.tekrar", "spi.ogret.son", "kingders.js"],
    "ESP/src/MIMARI.md": ["esp.ogret.tekrar", "esp.ogret.son", "kingogret.js", "srs.js"],
    "brand/ortak/OKU.md": ["ogret.js", "LIFEOS.OGRET"],
}
ORTAK = ["ogret.js", "1, 3", "7", "kavram", "işlem", "dikkat", "bilmiyor", "_tekrarlarim", "_neden_yanlis"]
hata = []
for yol, ozel in BELGE.items():
    s = (KOK / yol).read_text(encoding="utf-8")
    i = s.find("ogret.js")
    if i < 0:
        hata.append("%s: ogret.js anilmiyor" % yol)
        continue
    for k in ozel + (ORTAK if yol != "brand/ortak/OKU.md" else []):
        if k not in s:
            hata.append("%s: '%s' gecmiyor" % (yol, k))
    if "uydur" not in s[max(0, i - 3000):i + 3000] and yol != "brand/ortak/OKU.md":
        hata.append("%s: motor bolumu tesisin uydurmadigini (kanit yoksa tur yok) soylemeli" % yol)
if hata:
    print("ogret belge kabul: %d hata" % len(hata))
    for h in hata:
        print(" -", h)
    sys.exit(1)
print("ogret belge kabul: uc modul belgesi ve ortak dizin motoru anlatiyor.")
