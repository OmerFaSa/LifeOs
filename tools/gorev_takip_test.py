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
# pano: her is dort kolondan birinde; ajan hali kolonu belirler
gor = [{"dosya": "001-a.md", "baslik": "001 · A", "efor": "orta", "main_de": True},
       {"dosya": "002-b.md", "baslik": "002 · B", "efor": "orta"},
       {"dosya": "003-c.md", "baslik": "003 · C", "efor": "dusuk"},
       {"dosya": "004-d.md", "baslik": "004 · D", "dal_var": True, "ileri": 2},
       {"dosya": "005-e.md", "baslik": "005 · E"},
       {"dosya": "006-f.md", "baslik": "006 · F"}]
aj = [{"ad": "002", "tur": "gorev", "gorev": "002-b.md", "acik": True, "asama": "çalışıyor", "efor": "yuksek", "canli": {"simdi": "Dosya okuyor: x.py"}},
      {"ad": "003", "tur": "gorev", "gorev": "003-c.md", "acik": True, "asama": "sorun", "canli": {}},
      {"ad": "005", "tur": "gorev", "gorev": "005-e.md", "acik": False, "asama": "kapandı", "canli": {}},
      {"ad": "ara", "tur": "mini", "istem": "CSS ara", "acik": True, "asama": "inceleme", "canli": {}},
      {"ad": "006", "tur": "gorev", "gorev": "006-f.md", "acik": True, "asama": "inceleme", "canli": {},
       "denetci": {"asama": "inceleme", "karar": ["bulgu", 2]}},
      {"ad": "eski", "tur": "mini", "acik": False, "asama": "kapandı", "canli": {}}]
p = {x["ad"]: x for x in G.pano(gor, aj)}
beklenen = {"001": "bitti", "002": "calisiyor", "003": "calisiyor", "004": "inceleme", "005": "sira", "ara": "inceleme", "006": "inceleme"}
if {k: v["kolon"] for k, v in p.items()} != beklenen:
    hata.append("pano kolonlari: %r" % {k: v["kolon"] for k, v in p.items()})
if p["002"]["cumle"] != "Dosya okuyor: x.py" or p["002"]["efor"] != "yuksek" or p["002"]["baslik"] != "B":
    hata.append("pano calisan is: %r" % p["002"])
if p["006"]["cumle"] != "Denetçi: 2 bulgu" or not p["006"]["sorun"] or G.denetci_cumle({"karar": ["temiz", 0]}) != "Denetçi: temiz":
    hata.append("denetci karari panoda: %r" % p["006"])
if not p["003"]["sorun"] or p["002"]["sorun"]:
    hata.append("sorun isareti yalniz sorunlu ajanda")
# is iste kutusu: yalniz bu bilgisayardan, ozel baslikla; baska site (baslik yok) ya da DNS yeniden baglama (Host) reddedilir
iyi = {"Host": "127.0.0.1:%d" % G.PORT, "X-LifeOS-Ofis": "1"}
for ad, (b, g, ip), beklenen in (
        ("gecerli", (iyi, '{"metin": " Takvime tatil ekle "}', "127.0.0.1"), ("Takvime tatil ekle", None)),
        ("baslik yok", ({"Host": iyi["Host"]}, '{"metin": "abc"}', "127.0.0.1"), (None, "Başlık eksik.")),
        ("baska host", (dict(iyi, Host="kotu.site:%d" % G.PORT), '{"metin": "abc"}', "127.0.0.1"), (None, "Yalnız bu bilgisayardan.")),
        ("disaridan", (iyi, '{"metin": "abc"}', "192.168.1.5"), (None, "Yalnız bu bilgisayardan.")),
        ("json degil", (iyi, "metin=abc", "127.0.0.1"), (None, "İstek okunamadı.")),
        ("dizi", (iyi, "[1]", "127.0.0.1"), (None, "İstek okunamadı.")),
        ("kisa", (iyi, '{"metin": "a"}', "127.0.0.1"), (None, "İstek 3 ile 2000 karakter arasında olmalı.")),
        ("uzun", (iyi, '{"metin": "%s"}' % ("a" * 2001), "127.0.0.1"), (None, "İstek 3 ile 2000 karakter arasında olmalı."))):
    if G.istek_gecerli(b, g, ip) != beklenen:
        hata.append("istek %s: %r" % (ad, G.istek_gecerli(b, g, ip)))
for s in sorted((KOK / G.GOREVLER).glob("[0-9][0-9][0-9]-*.md")):
    g = G.gorev_oku(s.read_text(encoding="utf-8"))
    if not (g["baslik"] and g["dal"].startswith("ag/")):
        hata.append("gorev dosyasi eksik: " + s.name)
if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("Gorev takip temiz: baslik, durum, dal, sonuc, kuyruktaki dosyalar.")
