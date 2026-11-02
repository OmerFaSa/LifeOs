#!/usr/bin/env python3
"""Gorev 065 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
King sinavi her modul aracini en az 2 cumleyle sinar (tools/king_sinav_300_kabul_test.py yesil);
ilk 300 cumle aynen kalir; yeni cumlelerin en az %85'i dogru karara gider ve eski 300'un puani dusmez.
python tools/king_sinav_genis_kabul_test.py"""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
ILK_300 = "ac9b1708850090700c066a2877340e49cbedd79d5e4b91f22a0c12d09dc19aaa"
ESKI_PUAN = 293                      # 2026-11-02, d6bb8528 + 4b sonrasi
hata = []

l = json.loads((KOK / "tools" / "king_sinav.json").read_text(encoding="utf-8"))["cumleler"]
if hashlib.sha256(json.dumps(l[:300], ensure_ascii=False, sort_keys=True).encode()).hexdigest() != ILK_300:
    hata.append("ilk 300 cumle degismis (sira, metin, beklenen ya da not)")
yeni = l[300:]
if not yeni:
    hata.append("yeni cumle yok")
for i, x in enumerate(yeni, 300):
    if not any(k.startswith("arac:") for k in x.get("b") or []):
        hata.append("%d: yeni cumle bir arac beklemeli: %r" % (i, x.get("c")))

r = subprocess.run([sys.executable, str(KOK / "tools" / "king_sinav_300_kabul_test.py")], cwd=KOK,
                   capture_output=True, text=True, encoding="utf-8", timeout=1200)
if r.returncode != 0:
    hata.append("king_sinav_300_kabul_test kirmizi: %s" % (r.stdout + r.stderr).strip()[-300:])

s = subprocess.run(["node", str(KOK / "tools" / "king_sinav.js"), "--port=4381"], cwd=KOK,
                   capture_output=True, text=True, encoding="utf-8", timeout=1200).stdout
m = re.search(r"King sınavı: (\d+)/(\d+)", s)
if not m or int(m.group(2)) != len(l):
    hata.append("kosucu tum cumleleri puanlamadi: %s" % s[-200:])
else:
    kalan = set(re.findall(r"^✕ \[\w+\] (.+)$", s, re.M))
    eski = sum(1 for x in l[:300] if x["c"] not in kalan)
    yeni_dogru = sum(1 for x in yeni if x["c"] not in kalan)
    if eski < ESKI_PUAN:
        hata.append("eski 300 cumlenin puani dustu: %d < %d" % (eski, ESKI_PUAN))
    if yeni and yeni_dogru < 0.85 * len(yeni):
        hata.append("yeni cumleler %d/%d (< %%85): %s" % (yeni_dogru, len(yeni), sorted(x["c"] for x in yeni if x["c"] in kalan)[:12]))

if hata:
    print("king sinavi genisleme kabul KIRMIZI:")
    for h in hata:
        print(" -", h)
    sys.exit(1)
print("king sinavi genisleme kabul: %d cumle, her arac en az 2, yeni %d cumle, eski puan korundu." % (len(l), len(yeni)))
