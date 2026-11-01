#!/usr/bin/env python3
"""Gorev 015 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
Uc modulun src/tests/perde.test.js takimlari gercek zamani beklemez: on perde takiminin toplami modul basina
<= 800 ms (2026-11-01 olculen ~8 sn); test ve beklenti sayisi azalmaz; butun birim testleri yesil.
python tools/perde_test_hiz_kabul_test.py   (uc modulun runtests'i, ~2-3 dk)"""
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
PORT = {"AYS": 4378, "SPI": 4388, "ESP": 4398}
SINIR_MS = 800
hata = []
for m in ("AYS", "SPI", "ESP"):
    kaynak = (KOK / m / "src/tests/perde.test.js").read_text(encoding="utf-8")
    it_n, exp_n = len(re.findall(r"\bit\(", kaynak)), kaynak.count("expect(")
    if it_n < 53 or exp_n < 103:
        hata.append("%s: test/beklenti azaldi (it %d < 53 ya da expect %d < 103)" % (m, it_n, exp_n))
    takimlar = re.findall(r"describe\('([^']+)'", kaynak)
    yol = Path(tempfile.gettempdir()) / ("perde_kabul_%s.json" % m)
    if yol.exists():
        yol.unlink()
    r = subprocess.run(["node", "tools/runtests.js", str(PORT[m])], cwd=KOK / m, capture_output=True, text=True,
                       encoding="utf-8", env=dict(os.environ, RUNTESTS_TAKIM=str(yol)), timeout=400)
    if r.returncode != 0 or not yol.exists():
        hata.append("%s: runtests cikis %d\n%s" % (m, r.returncode, (r.stdout + r.stderr)[-1500:]))
        continue
    o = json.loads(yol.read_text(encoding="utf-8"))
    if o["gecen"] != o["toplam"]:
        hata.append("%s: %d/%d gecti" % (m, o["gecen"], o["toplam"]))
    sure = {t: o["takim"].get(t) for t in takimlar}
    eksik = [t for t, v in sure.items() if v is None]
    if eksik:
        hata.append("%s: takim kosmadi: %s" % (m, eksik))
    toplam = sum(v or 0 for v in sure.values())
    if toplam > SINIR_MS:
        en = sorted(((v or 0, t) for t, v in sure.items()), reverse=True)[:4]
        hata.append("%s: perde takimlari %d ms > %d ms; en yavas: %s" % (m, toplam, SINIR_MS,
                    ", ".join("%s %d ms" % (t, v) for v, t in en)))
    else:
        print("%s: perde takimlari %d ms" % (m, toplam))

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("perde test hiz kabul: uc modulde perde takimlari <= %d ms, testler eksiksiz ve yesil." % SINIR_MS)
