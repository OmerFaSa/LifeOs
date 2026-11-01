#!/usr/bin/env python3
"""Gorev 016 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
`node tools/olcum_modul.js SPI --port 4389 --json <dosya>` modulun src'sini acar ve tek JSON yazar:
acilis, kapsam, depolama, rota stil/yerlesim sayilari. Alanlar var ve akla yatkin. ~1-2 dk.
python tools/olcum_modul_kabul_test.py"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
yol = Path(tempfile.gettempdir()) / "olcum_modul_kabul.json"
if yol.exists():
    yol.unlink()
r = subprocess.run(["node", "tools/olcum_modul.js", "SPI", "--port", "4389", "--json", str(yol)], cwd=KOK,
                   capture_output=True, text=True, encoding="utf-8", timeout=600)
hata = []
if r.returncode != 0 or not yol.exists():
    print("KIRMIZI: cikis %d\n%s" % (r.returncode, (r.stdout + r.stderr)[-1500:]))
    sys.exit(1)
o = json.loads(yol.read_text(encoding="utf-8"))


def al(yol_):
    x = o
    for k in yol_.split("."):
        if not isinstance(x, dict) or k not in x:
            hata.append("alan yok: " + yol_)
            return None
        x = x[k]
    return x


def aralik(yol_, a, b):
    v = al(yol_)
    if v is not None and not (isinstance(v, (int, float)) and a <= v <= b):
        hata.append("%s = %r, beklenen [%s, %s]" % (yol_, v, a, b))


if al("modul") != "SPI":
    hata.append("modul SPI degil: %r" % o.get("modul"))
aralik("acilis.cizimMs", 50, 20000)          # sayfa acilistan ilk dolu cizime (medyan, en az 3 tekrar)
aralik("acilis.betikMs", 1, 20000)           # CDP Performance.getMetrics ScriptDuration
aralik("acilis.stilMs", 0, 20000)            # RecalcStyleDuration
aralik("acilis.yerlesimMs", 0, 20000)        # LayoutDuration
aralik("acilis.tekrar", 3, 50)
aralik("kapsam.cssKB", 100, 100000)          # CSS kapsami: toplam
aralik("kapsam.cssKullanilanYuzde", 1, 100)
aralik("kapsam.jsIslev", 100, 10 ** 7)       # adli islev sayisi
aralik("kapsam.jsKosanYuzde", 1, 100)
aralik("depo.rotaBasinaOkuma", 0, 10000)     # Storage.getItem / rota gecisi
aralik("depo.rotaBasinaYazma", 0, 10000)
aralik("depo.rotaBasinaAyristirma", 0, 10000)  # JSON.parse / rota gecisi
aralik("rota.sayi", 5, 500)                  # SP.App.SECTIONS'taki butun rotalar
aralik("rota.stilHesabi", 0.5, 1000)         # trace UpdateLayoutTree olayi / rota gecisi
aralik("rota.yerlesim", 0.1, 1000)           # trace Layout olayi / rota gecisi
enco = al("depo.enCokOkunan")
if enco is not None and not (isinstance(enco, list) and enco and isinstance(enco[0], list) and len(enco[0]) == 2):
    hata.append("depo.enCokOkunan [[anahtar, sayi], ...] degil: %r" % (enco,))
if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("olcum modul kabul: acilis, kapsam, depo, rota alanlari dolu ve akla yatkin.")
