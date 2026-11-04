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
bekle("modullerle ayni kenar (kabuk.js iskeletV5)", "/gun/ortak/kabuk.js" in g and "K.iskeletV5({ modul:'gun'" in g)
for b in ("bugun", "analiz", "calisma"):
    bekle("bolum " + b, "id:'%s'" % b in g)
for parca in ("gun-niyet", "gun-pil", "gun-hava", "gun-saat__simdi", "gun-alanlar", "gun-oneri", "gun-karne"):
    bekle("taslak parcasi " + parca, parca in g)
bekle("veri yoksa veri yok", g.count("veri yok") >= 4)
bekle("senin girdigin etiketi", "Senin girdiğin" in g)
bekle("oneri yalniz saate bakar ve soyler", "saate göre" in g)
bekle("Merkez durumu /api/durum'dan", "/api/durum" in g)
bekle("hareketi azalt", "prefers-reduced-motion" in g)
bekle("koyu tema", 'data-theme="dark"' in gun.gun_html(tema="dark"))
bekle("ortak dosyalar kapali liste", set(gun.ORTAK) == {"parca.js", "jeton.css", "base.css", "layout.css", "temel.css", "kabuk.css", "kabuk.js", "cam.css", "hareket.css", "gunveri.js"})
for ad in gun.ORTAK:
    bekle("ortak dosya var: " + ad, (KOK / "brand" / "ortak" / ad).exists())

s = sunucu.giris_html()
bekle("giriste Gun karti /gun/", 'href="/gun/"' in s and 'data-modul="gun"' in s)
# HKM'nin arayuzu kalkti (2026-11-03): giriste ne HKM karti ne Merkez ucu; baslatma Ayarlar › Merkez'de.
bekle("giriste HKM yok", 'id="yay-m"' not in s and "kart--hkm" not in s and "post('/api/hkm')" not in s)
bekle("modul sunucusunda Merkez'i baslatma yolu", "/api/merkez/ac" in (KOK / "sistem" / "sunucu.py").read_text(encoding="utf-8"))
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
