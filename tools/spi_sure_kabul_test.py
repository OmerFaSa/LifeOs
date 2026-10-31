#!/usr/bin/env python3
"""Gorev 009 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
SPI hizli giris (core/quickentry.js parseMove): «1 saat 20 dk», «yarim saat», «bir bucuk saat» gibi
gunluk Turkce sureler dogru dakikaya cevrilir; eski bicimler bozulmaz. Node'da kosar (tools/kabul_js.py).
python tools/spi_sure_kabul_test.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kabul_js as J  # noqa: E402

DOSYALAR = ["src/js/core/utils.js", "src/js/data/movement.js", "src/js/core/quickentry.js"]
BEKLENEN = [
    # yeni: bilesik, kesirli ve yaziyla
    ("1 saat 20 dk yürüyüş", 80, "Tempolu yürüyüş"),
    ("1 saat 20 dakika koşu", 80, "Koşu"),
    ("yarım saat yürüyüş", 30, "Tempolu yürüyüş"),
    ("1 buçuk saat koşu", 90, "Koşu"),
    ("bir buçuk saat bisiklet", 90, "Bisiklet"),
    ("bir saat yürüyüş", 60, "Tempolu yürüyüş"),
    ("iki saat yürüyüş", 120, "Tempolu yürüyüş"),
    ("çeyrek saat koşu", 15, "Koşu"),
    ("2 saat 15 dk bisiklet", 135, "Bisiklet"),
    # eski: aynen
    ("45 dk yürüyüş", 45, "Tempolu yürüyüş"),
    ("1 saat koşu", 60, "Koşu"),
    ("2,5 saat bisiklet", 150, "Bisiklet"),
    ("90 dakika yürüyüş", 90, "Tempolu yürüyüş"),
]
SURESIZ = ["yürüyüş yaptım", "bugün koştum", "11 saat 70 dk yürüyüş"]  # sonuncu 600 dk siniri asar

hata = []
ifade = "[%s].map(t => { const r = SP.Quick.parseMove(t); return r ? [r.minutes, r.exercise && r.exercise.name] : null; })" % ", ".join(
    repr(t) for t, _, _ in BEKLENEN)
for (t, dk, ad), r in zip(BEKLENEN, J.calistir("SPI", DOSYALAR, ifade)):
    if r != [dk, ad]:
        hata.append("%r -> %r (beklenen %r)" % (t, r, [dk, ad]))
for t, r in zip(SURESIZ, J.calistir("SPI", DOSYALAR, "[%s].map(t => SP.Quick.parseMove(t))" % ", ".join(repr(x) for x in SURESIZ))):
    if r is not None:
        hata.append("%r sure degil, null olmali: %r" % (t, r))

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("spi sure kabul: bilesik, yarim, bucuk, ceyrek, yaziyla sayi; eski bicimler; sure olmayan.")
