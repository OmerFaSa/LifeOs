#!/usr/bin/env python3
"""Gorev 063 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
tools/merdiven_olcum.py: KING-4 A6 model merdiveninin tekrar olcumu. --kuru sahte saglayiciyla
(ag yok) kosar; kolay is yerel, zor is bulut, --kota ile bulut 429 verir ve is yerele duser.
Canli HKM ayarina ve defterine dokunmaz. python tools/merdiven_olcum_kabul_test.py"""
import json
import os
import subprocess
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
BETIK = KOK / "tools" / "merdiven_olcum.py"
KORU = [KOK / "HKM" / "config.json", KOK / "HKM" / "db" / "hkm.db"]
hata = []


def kos(*ek):
    once = {p: p.stat().st_mtime for p in KORU if p.exists()}
    r = subprocess.run([sys.executable, "-X", "utf8", str(BETIK), "--kuru", "--json", *ek],
                       capture_output=True, text=True, encoding="utf-8", timeout=120, cwd=str(KOK))
    if any(p.stat().st_mtime != t for p, t in once.items()):
        hata.append("%s: canli HKM ayari ya da defteri degisti" % " ".join(ek))
    if r.returncode != 0:
        hata.append("%s: cikis %s: %s" % (" ".join(ek), r.returncode, (r.stderr or r.stdout)[-400:]))
        return None
    try:
        return json.loads(r.stdout)
    except ValueError:
        hata.append("%s: stdout JSON degil: %r" % (" ".join(ek), r.stdout[:200]))
        return None


if not BETIK.exists():
    print("merdiven olcum kabul KIRMIZI:\n - tools/merdiven_olcum.py yok")
    sys.exit(1)

d = kos()
if d:
    s = d.get("satirlar") or []
    if len(s) != 6:
        hata.append("6 satir bekleniyordu (4 kolay, 2 zor), gelen %d" % len(s))
    for x in s:
        if not {"metin", "seviye", "kat", "neden", "model", "ms", "giris", "cikis"} <= set(x):
            hata.append("satir alanlari eksik: %r" % x)
    if [x.get("kat") for x in s] != ["yerel"] * 4 + ["bulut"] * 2:
        hata.append("kolay yerel, zor bulut olmali: %r" % [(x.get("metin"), x.get("kat")) for x in s])
    if {x.get("seviye") for x in d.get("seviyeler") or []} != {"yerel", "bulut"}:
        hata.append("seviyeler kirilimi (ai_olcum) yerel ve bulut icermeli: %r" % d.get("seviyeler"))
    if d.get("dususler"):
        hata.append("kotasiz kosuda dusus olmamali: %r" % d.get("dususler"))

k = kos("--kota")
if k:
    s = k.get("satirlar") or []
    if [x.get("kat") for x in s[-2:]] != ["yerel", "yerel"]:
        hata.append("--kota: zor isler yerele dusmeli: %r" % [(x.get("metin"), x.get("kat")) for x in s])
    if not any("kotası dolu" in (x.get("neden") or "") for x in s):
        hata.append("--kota: nedende «kotası dolu» olmali")
    if not k.get("dususler"):
        hata.append("--kota: ai_olcum dususler bos")

if hata:
    print("merdiven olcum kabul KIRMIZI:")
    for h in hata:
        print(" -", h)
    sys.exit(1)
print("merdiven olcum kabul: kuru kosu, kolay yerel / zor bulut, kota dususu, canli dokunulmadi.")
