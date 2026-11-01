#!/usr/bin/env python3
"""Gorev 018 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
belgeler/DIZIN.md: belgeler/ altindaki her .md (gorev dosyalari NNN-* haric) tam bir kez, calisan goreli
baglantiyla ve aciklamayla; arsiv/ dosyalari yalniz «Arşiv» bolumunde. python tools/belge_dizin_kabul_test.py"""
import re
import subprocess
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
BEL = KOK / "belgeler"
liste = [p for p in subprocess.run(["git", "ls-files", "belgeler"], cwd=KOK, capture_output=True, text=True,
         encoding="utf-8").stdout.split() if p.endswith(".md") and not re.search(r"gorevler/\d{3}-", p) and p != "belgeler/DIZIN.md"]
yol = BEL / "DIZIN.md"
if not yol.exists():
    print("KIRMIZI: belgeler/DIZIN.md yok")
    sys.exit(1)
hata, gorulen, bolum = [], {}, None
for satir in yol.read_text(encoding="utf-8").splitlines():
    m = re.match(r"^## (.+?)\s*$", satir)
    if m:
        bolum = m.group(1)
        continue
    for ad, hedef in re.findall(r"\[([^\]]+)\]\(([^)#\s]+)(?:#[^)]*)?\)", satir):
        if hedef.startswith("http"):
            continue
        tam = (BEL / hedef).resolve()
        if not tam.exists():
            hata.append("kirik baglanti: %s" % hedef)
            continue
        rel = tam.relative_to(KOK).as_posix()
        gorulen[rel] = gorulen.get(rel, 0) + 1
        aciklama = satir.split(")", 1)[-1].strip(" —-:")
        if len(aciklama) < 12:
            hata.append("aciklama kisa: %s" % rel)
        if rel.startswith("belgeler/arsiv/") != (bolum == "Arşiv"):
            hata.append("%s yanlis bolumde (%s)" % (rel, bolum))
for p in liste:
    if gorulen.get(p, 0) != 1:
        hata.append("%s dizinde %d kez (1 olmali)" % (p, gorulen.get(p, 0)))
for kok_belge in ("README.md", "AGENTS.md"):
    if "belgeler/DIZIN.md" not in (KOK / kok_belge).read_text(encoding="utf-8"):
        hata.append("%s belgeler/DIZIN.md'ye atif vermiyor" % kok_belge)
if hata:
    print("KIRMIZI:", *hata[:40], sep="\n  ")
    sys.exit(1)
print("belge dizin kabul: %d belge, her biri bir kez, baglantilar calisiyor, arsiv ayri." % len(liste))
