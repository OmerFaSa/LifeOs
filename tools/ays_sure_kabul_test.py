#!/usr/bin/env python3
"""Gorev 010 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
AYS konusarak giris (core/entry.js parseUyku, parseSure): «7 saat 30 dk uyudum», «7 bucuk saat»,
«1 saat 15 dk matematik», «yarim saat fizik» dogru okunur; soru sayaci ve eski bicimler bozulmaz.
Node'da kosar (tools/kabul_js.py). python tools/ays_sure_kabul_test.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kabul_js as J  # noqa: E402

DOSYALAR = ["src/js/core/utils.js", "src/js/core/turkcesayi.js", "src/js/data/subjects.js", "src/js/core/entry.js"]
UYKU = [("7 saat 30 dk uyudum", 7.5), ("7 buçuk saat uyudum", 7.5), ("yedi buçuk saat uyudum", 7.5),
        ("6 saat 45 dakika uyudum", 6.75), ("8 saat uyudum", 8), ("7,5 saat uyudum", 7.5), ("5 saat uyuyabildim", 5)]
SURE = [("1 saat 15 dk matematik çalıştım", 75, "tyt-matematik"), ("yarım saat fizik çalıştım", 30, "ayt-fizik"),
        ("bir buçuk saat matematik", 90, "tyt-matematik"), ("45 dakika matematik çalıştım", 45, "tyt-matematik"),
        ("2 saat matematik", 120, "tyt-matematik"), ("çeyrek saat matematik", 15, "tyt-matematik")]
BOS = ["30 soru matematik 45 dakika", "matematik çalıştım", "uyudum", "30 dakika uyudum"]  # sonuncu sekerleme, uyku degil

hata = []
u = J.calistir("AYS", DOSYALAR, "[%s].map(t => { const r = R.Entry.parseUyku(t); return r && r.hours; })" % ", ".join(repr(t) for t, _ in UYKU))
for (t, h), r in zip(UYKU, u):
    if r is None or abs(r - h) > 1e-9:
        hata.append("uyku %r -> %r (beklenen %r)" % (t, r, h))
s = J.calistir("AYS", DOSYALAR, "[%s].map(t => { const r = R.Entry.parseSure(t); return r && [r.minutes, r.subject.id]; })"
               % ", ".join(repr(t) for t, _, _ in SURE))
for (t, dk, ders), r in zip(SURE, s):
    if r != [dk, ders]:
        hata.append("sure %r -> %r (beklenen %r)" % (t, r, [dk, ders]))
b = J.calistir("AYS", DOSYALAR, "[%s].map(t => [R.Entry.parseSure(t), R.Entry.parseUyku(t)])" % ", ".join(repr(t) for t in BOS))
for t, r in zip(BOS, b):
    if r != [None, None]:
        hata.append("%r sure ya da uyku sayilmamali: %r" % (t, [x and {k: x[k] for k in x if k != "subject"} for x in r]))

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("ays sure kabul: uyku saat+dakika ve bucuk, sure saat+dakika, yarim, ceyrek, yaziyla; soru sayaci korunur.")
