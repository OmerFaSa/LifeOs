#!/usr/bin/env python3
"""Gorev 017 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
tools/DIZIN.md: tools/ altindaki her izlenen dosya tam bir kez, aciklamasiyla ve dogru bolumde.
python tools/tools_dizin_kabul_test.py"""
import re
import subprocess
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
BOLUM = ["Denetim", "Yayın", "Ofis", "Veri", "Ölçüm", "Kabul testleri", "Testler", "Diğer"]
dosyalar = [p.split("/", 1)[1] for p in subprocess.run(["git", "ls-files", "tools"], cwd=KOK, capture_output=True,
            text=True, encoding="utf-8").stdout.split() if p.count("/") == 1 and not p.endswith(".md")]
dosyalar += [p.name for p in (KOK / "tools").glob("*_kabul_test.py") if p.name not in dosyalar]  # henuz commit'lenmemis kabul
yol = KOK / "tools" / "DIZIN.md"
hata = []
if not yol.exists():
    print("KIRMIZI: tools/DIZIN.md yok")
    sys.exit(1)
metin = yol.read_text(encoding="utf-8")
basliklar = re.findall(r"^## (.+?)\s*$", metin, re.M)
if basliklar != BOLUM:
    hata.append("bolumler %r olmali, bulunan %r" % (BOLUM, basliklar))
bolum_of, gorulen = {}, {}
simdiki = None
for satir in metin.splitlines():
    m = re.match(r"^## (.+?)\s*$", satir)
    if m:
        simdiki = m.group(1)
        continue
    m = re.match(r"^- `([^`]+)` — (.+)$", satir)
    if m:
        ad, aciklama = m.group(1), m.group(2).strip()
        gorulen[ad] = gorulen.get(ad, 0) + 1
        bolum_of[ad] = simdiki
        if len(aciklama) < 12:
            hata.append("aciklama cok kisa: %s" % ad)
for d in dosyalar:
    if gorulen.get(d, 0) != 1:
        hata.append("%s dizinde %d kez (1 olmali)" % (d, gorulen.get(d, 0)))
for ad in gorulen:
    if ad not in dosyalar:
        hata.append("dizindeki %s tools/ altinda yok" % ad)
for ad, b in bolum_of.items():
    if ad.endswith("_kabul_test.py") and b != "Kabul testleri":
        hata.append("%s 'Kabul testleri' bolumunde olmali (%s)" % (ad, b))
    elif (ad.endswith("_test.py") or ad.endswith(".test.js")) and not ad.endswith("_kabul_test.py") and b != "Testler":
        hata.append("%s 'Testler' bolumunde olmali (%s)" % (ad, b))
if hata:
    print("KIRMIZI:", *hata[:40], sep="\n  ")
    sys.exit(1)
print("tools dizin kabul: %d dosya, sekiz bolum, her biri bir kez ve aciklamali." % len(dosyalar))
