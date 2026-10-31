#!/usr/bin/env python3
"""Gorev 012 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
SPI serbest ogun (core/parse.js parseMeal) miktari ortak LIFEOS.TurkceSayi ile okur: «1 bucuk porsiyon pilav»
1,5 porsiyon (270 g) olur, 1 degil; gram ve kalori miktarla olceklenir; eski bicimler bozulmaz. Node'da kosar.
python tools/spi_porsiyon_kabul_test.py"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kabul_js as J  # noqa: E402

DOSYALAR = ["src/js/core/utils.js", "src/js/core/turkcesayi.js", "src/js/data/biomarkers.js", "src/js/data/foods.js",
            "src/js/core/parse.js"]
BEKLENEN = [
    ("1 buçuk porsiyon pilav", "pilav", 1.5, 270), ("bir buçuk tabak pilav", "pilav", 1.5, 270),
    ("iki buçuk dilim ekmek", "beyaz-ekmek", 2.5, 75), ("çeyrek porsiyon pilav", "pilav", 0.25, 45),
    # eski: aynen
    ("2 yumurta", "yumurta", 2, 110), ("yarım ekmek", "beyaz-ekmek", 0.5, 15), ("1,5 porsiyon pilav", "pilav", 1.5, 270),
    ("pilav", "pilav", 1, 180),
]
hata = []
ifade = "%s.map(t => { const i = SP.Parse.parseMeal(t).items[0]; return i ? [i.foodId, i.qty, i.g] : null; })" % json.dumps(
    [t for t, _, _, _ in BEKLENEN], ensure_ascii=False)
for (t, yemek, qty, g), r in zip(BEKLENEN, J.calistir("SPI", DOSYALAR, ifade)):
    if r != [yemek, qty, g]:
        hata.append("%r -> %r (beklenen %r)" % (t, r, [yemek, qty, g]))
k = J.calistir("SPI", DOSYALAR, "['1 porsiyon pilav', '1 buçuk porsiyon pilav'].map(t => SP.Parse.parseMeal(t).items[0])"
               ".map(i => i.kcal != null ? i.kcal : (i.besin || {}).kcal)")
if k[0] is not None and (k[1] is None or abs(k[1] - 1.5 * k[0]) > 1):
    hata.append("kalori miktarla olceklenmeli: %r" % k)

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("spi porsiyon kabul: bucuklu ve ceyrek miktar, gram ve kalori olceklenir; eski bicimler.")
