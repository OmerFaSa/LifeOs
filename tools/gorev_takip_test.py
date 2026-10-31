#!/usr/bin/env python3
"""tools/gorev_takip.py gorev dosyasi okuyucusunun testi.  python3 tools/gorev_takip_test.py"""
import importlib.util
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("gorev_takip", KOK / "tools" / "gorev_takip.py")
G = importlib.util.module_from_spec(spec)
spec.loader.exec_module(G)
hata = []
m = "# 001 · Takvim\n\n**Durum:** bitti\n**Dal:** `ag/001-takvim`\n\n## Amaç\nx\n\n## Sonuç\n<!-- not -->\nTestler geçti.\n"
g = G.gorev_oku(m)
if (g["baslik"], g["durum"], g["dal"], g["sonuc"]) != ("001 · Takvim", "bitti", "ag/001-takvim", "Testler geçti."):
    hata.append("okuma: %r" % g)
if G.gorev_oku("# x\n**Efor:** yüksek\n")["efor"] != "yuksek" or G.gorev_oku("# x\n")["efor"] is not None:
    hata.append("efor okunmali, yoksa None")
if G.gorev_oku("# x\n**Durum:** uydurma   <!-- a | b -->\n")["durum"] != "bekliyor":
    hata.append("bilinmeyen durum bekliyor sayilmali")
if G.gorev_oku("# x\n**Durum:** bekliyor   <!-- bekliyor | sürüyor -->\n")["durum"] != "bekliyor":
    hata.append("sablondaki yorum durumu bozmamali")
for s in sorted((KOK / G.GOREVLER).glob("[0-9][0-9][0-9]-*.md")):
    g = G.gorev_oku(s.read_text(encoding="utf-8"))
    if not (g["baslik"] and g["dal"].startswith("ag/")):
        hata.append("gorev dosyasi eksik: " + s.name)
if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("Gorev takip temiz: baslik, durum, dal, sonuc, kuyruktaki dosyalar.")
