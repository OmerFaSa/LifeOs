#!/usr/bin/env python3
"""Kabul testi, Gun plani F2: Gun iskeleti (sistem/gun.py) ve giris sayfasindaki yeri.

   python3 tools/gun_iskelet_kabul_test.py     (cikis 0 temiz, 1 kirmizi)"""
import re
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KOK / "sistem"))
import gun  # noqa: E402
import sunucu  # noqa: E402

hata = []


def bekle(ad, kosul):
    if not kosul:
        hata.append(ad)


g = gun.gun_html()
for b in ("bugun", "gecmis", "sen"):
    bekle("bolum " + b, 'id="gun-%s"' % b in g and 'data-sekme="%s"' % b in g)
bekle("uc modul kapisi", all("http://127.0.0.1:%d/" % p in g for p in (4173, 4183, 4193)))
bekle("Merkez durumu /api/durum'dan", "/api/durum" in g)
bekle("sayi uydurmaz", not re.search(r">\s*\d+\s*(dk|saat|%)", g))
bekle("hareketi azalt", "prefers-reduced-motion" in g)
bekle("koyu tema", 'data-theme="dark"' in gun.gun_html(tema="dark") and "@media all" in gun.gun_html(tema="dark"))

s = sunucu.giris_html()
bekle("giriste Gun karti /gun/", 'href="/gun/"' in s and 'data-modul="gun"' in s)
bekle("HKM karti yerine M ucu", 'id="yay-m"' in s and "kart--hkm" not in s)
bekle("HKM baslatma betigi duruyor", "post('/api/hkm')" in s and "/api/hkm/yeniden" in s)
t = sunucu.giris_html(telefon=True)
bekle("telefonda Gun ve M yok", 'href="/gun/"' not in t and 'id="yay-m"' not in t)
portlar = sorted(p for *_, p in sunucu.KARTLAR)
bekle("yeni port yok", portlar == [4173, 4183, 4193, 4200])

if hata:
    print("KIRMIZI (%d):" % len(hata))
    for h in hata:
        print(" -", h)
    sys.exit(1)
print("YEŞİL: gun iskelet kabul testi")
