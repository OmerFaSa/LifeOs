#!/usr/bin/env python3
"""Gorev 011 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
ESP serbest oturum (core/parse.js parseSession) sureyi ortak LIFEOS.TurkceSayi ile okur: «yarim saat»,
«1 bucuk saat», «iki saat» kabul edilir; eski bicimler ve sayim (kelime/sayfa) bozulmaz. Node'da kosar.
python tools/esp_sure_kabul_test.py"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kabul_js as J  # noqa: E402

DOSYALAR = ["src/js/core/utils.js", "src/js/core/turkcesayi.js", "src/js/data/rules.js", "src/js/core/parse.js"]
BEKLENEN = [
    ("yarım saat İspanyolca", "lang", 30), ("bir buçuk saat İspanyolca", "lang", 90), ("1 buçuk saat gitar", "music", 90),
    ("çeyrek saat gitar", "music", 15), ("iki saat İngilizce", "lang", 120), ("1 saat 20 dk gitar", "music", 80),
    ("30 dk İspanyolca", "lang", 30), ("45 dakika kitap okudum", "reading", 45),
]
hata = []
ifade = "%s.map(t => { const r = ESP.Parse.parseSession(t); const x = r.rows[0]; return x ? [x.disc, x.minutes] : r.unmatched; })" % json.dumps(
    [t for t, _, _ in BEKLENEN], ensure_ascii=False)
for (t, disc, dk), r in zip(BEKLENEN, J.calistir("ESP", DOSYALAR, ifade)):
    if r != [disc, dk]:
        hata.append("%r -> %r (beklenen %r)" % (t, r, [disc, dk]))
s = J.calistir("ESP", DOSYALAR, "(r => r.rows[0] && [r.rows[0].minutes, r.rows[0].count, r.rows[0].countWhat])(ESP.Parse.parseSession('30 dk İspanyolca 20 kelime'))")
if not s or s[0] != 30 or s[1] != 20:
    hata.append("sure ve sayim birlikte: %r" % s)
u = J.calistir("ESP", DOSYALAR, "ESP.Parse.parseSession('İspanyolca çalıştım').rows.length")
if u != 0:
    hata.append("suresiz oturum satir olmamali (eski davranis): %r" % u)

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("esp sure kabul: yarim, bucuk, ceyrek, yaziyla; bilesik ve eski bicimler; sayim korunur.")
