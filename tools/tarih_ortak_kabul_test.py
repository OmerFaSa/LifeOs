#!/usr/bin/env python3
"""Gorev 014 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
Uc modulun `U` tarih islevleri ortak LIFEOS.TARIH'e (brand/ortak/tarih.js) baglanir: ayni islev nesnesi,
utils.js'te kopya govde yok; bozuk tarih null/bos metin, istisna yok. Node'da kosar.
python tools/tarih_ortak_kabul_test.py"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kabul_js as J  # noqa: E402

KOK = Path(__file__).resolve().parent.parent
DOSYALAR = ["src/js/core/tarih.js", "src/js/core/utils.js"]
ORTAK = ["pad2", "iso", "gunOf", "isISO", "parse", "today", "todayISO", "addDays", "diffDays", "weekdayIndex",
         "fmtDate", "fmtShort", "monthName", "monthKey"]
hata = []
for modul, ns in (("AYS", "R"), ("SPI", "SP"), ("ESP", "ESP")):
    ayni = J.calistir(modul, DOSYALAR, "%s.filter(a => %s.U[a] !== LIFEOS.TARIH[a])" % (ORTAK, ns))
    if ayni:
        hata.append("%s: U.%s ortak islev degil" % (modul, ", U.".join(ayni)))
    sabit = J.calistir(modul, DOSYALAR, "['MONTHS','MONTHS_SHORT','DAY_MS'].filter(a => JSON.stringify(%s.U[a]) !== JSON.stringify(LIFEOS.TARIH[a]))" % ns)
    if sabit:
        hata.append("%s: sabit farkli: %s" % (modul, sabit))
    r = J.calistir(modul, DOSYALAR, """(() => { const U = %s.U, out = {};
      const dene = (k, f) => { try { out[k] = f(); } catch (e) { out[k] = 'ISTISNA: ' + e.message; } };
      dene('parse', () => U.parse('2026-02-31'));
      dene('diff', () => U.diffDays('2026-01-01', 'bozuk'));
      dene('fmtRange', () => U.fmtRange('bozuk', '2026-01-05'));
      dene('fmtRangeIyi', () => U.fmtRange('2026-01-03', '2026-01-05'));
      dene('relativeDay', () => U.relativeDay('bozuk'));
      dene('relativeDayIyi', () => U.relativeDay(U.todayISO()));
      return out; })()""" % ns)
    bek = {"parse": None, "diff": None, "fmtRange": "", "fmtRangeIyi": "3–5 Oca", "relativeDay": "", "relativeDayIyi": "bugün"}
    for k, v in bek.items():
        if r.get(k) != v:
            hata.append("%s: %s -> %r (beklenen %r)" % (modul, k, r.get(k), v))
    kaynak = (KOK / modul / "src/js/core/utils.js").read_text(encoding="utf-8")
    govde = [a for a in ORTAK if re.search(r"function\s+%s\s*\(" % a, kaynak)]
    if govde:
        hata.append("%s: utils.js hala kendi govdesini tasiyor: %s" % (modul, govde))

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("tarih ortak kabul: uc modulun U tarih islevleri LIFEOS.TARIH; bozuk tarih null ya da bos metin.")
