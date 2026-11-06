#!/usr/bin/env python3
"""Kabul testi, Gun plani F3a: brand/ortak/gunveri.js (LIFEOS.GunVeri).

   Gun sayfasinin saf veri katmani. Hesap sunucusunun iki cevabini cizilecek
   bicime cevirir; hicbir sey uydurmaz:
     serit(tekgun, simdi)   GET /api/hesap/tekgun → gunun seridi (07-23)
     siradaki(serit, simdi) «Simdi ne yapsam?» icin siradaki blok
     karne(gunluk, bugun)   GET /api/hesap/gunluk → haftanin hayat karnesi

   python3 tools/gunveri_kabul_test.py     (cikis 0 temiz, 1 kirmizi)"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kabul_js as J  # noqa: E402

DOSYA = ["brand/ortak/gunveri.js"]
G = "LIFEOS.GunVeri"
hata = []


def bekle(ad, kosul):
    if not kosul:
        hata.append(ad)


def js(ifade):
    try:
        return J.calistir("", DOSYA, ifade)
    except J.JSHatasi as e:
        hata.append("JS: " + str(e)[:300])
        return None


def plan(bloklar):
    return json.dumps({"s": 1, "bloklar": bloklar}, ensure_ascii=False)


TEKGUN = {"tarih": "2026-11-03", "moduller": [
    {"modul": "ays", "gun": "2026-11-03", "bayat": False, "icerik": plan([
        {"id": "a1", "ad": "Türev", "alt": "40 soru", "saat": "09:30", "durum": "bitti", "rota": "today"},
        {"id": "a2", "ad": "Paragraf", "saat": "16:00", "durum": "bekliyor"},
        {"id": "a3", "ad": "Tekrar", "dilim": "aksam", "durum": "vakti"},
        {"ad": "Bozuk saat", "saat": "25:99", "durum": "garip"},
        {"id": "bos"}])},
    {"modul": "spi", "gun": "2026-11-02", "bayat": True, "icerik": plan([{"ad": "Dünkü öğün", "saat": "12:00"}])},
    {"modul": "esp", "gun": "2026-11-03", "bayat": False, "icerik": "{bozuk"},
]}

# 1. serit
s = js("%s.serit(%s, '2026-11-03T14:00:00')" % (G, json.dumps(TEKGUN, ensure_ascii=False)))
if s:
    bekle("baglanti var", s.get("baglanti") is True)
    ads = [b["ad"] for b in s["bloklar"]]
    bekle("saatli bloklar saat sirasiyla", ads == ["Türev", "Paragraf"])
    t = s["bloklar"][0]
    bekle("blok alanlari", t["modul"] == "ays" and t["saat"] == "09:30" and t["durum"] == "bitti" and t["alt"] == "40 soru" and t["rota"] == "today")
    bekle("yuzde 07-23 ekseninde", abs(t["yuzde"] - (150 / 960 * 100)) < 0.01)
    bekle("16:00 yuzdesi", abs(s["bloklar"][1]["yuzde"] - (540 / 960 * 100)) < 0.01)
    sz = s["saatsiz"]
    bekle("saatsizler: dilimli once, saat uydurulmaz", [b["ad"] for b in sz] == ["Tekrar", "Bozuk saat"])
    bekle("saatsizde yuzde null", all(b["yuzde"] is None and b["saat"] is None for b in sz))
    bekle("dilim korunur, gecersiz 'gun'", sz[0]["dilim"] == "aksam" and sz[1]["dilim"] == "gun")
    bekle("bilinmeyen durum bekliyor", sz[1]["durum"] == "bekliyor")
    bekle("adsiz blok duser", "bos" not in json.dumps(s["bloklar"] + sz))
    bekle("bayat modul cizilmez, soylenir", any("SPİ" in n and "açılmadı" in n for n in s["notlar"]) and "Dünkü öğün" not in json.dumps(s, ensure_ascii=False))
    bekle("okunamayan plan soylenir", any("ESP" in n for n in s["notlar"]))
    bekle("bos degil", s["bos"] is False)
s0 = js("%s.serit(null, '2026-11-03T14:00:00')" % G)
bekle("cevap yoksa baglanti yok, bos", s0 == {"baglanti": False, "bloklar": [], "saatsiz": [], "notlar": [], "bos": True})
s1 = js("%s.serit({ tarih:'2026-11-03', moduller:[] }, '2026-11-03T14:00:00')" % G)
if s1:
    bekle("hic modul yoksa uc not, bos", s1["bos"] is True and len(s1["notlar"]) == 3 and all("yayınlamadı" in n for n in s1["notlar"]))
s2 = js("%s.serit({ tarih:'2026-11-03', moduller:[{ modul:'ays', gun:'2026-11-03', bayat:false, icerik:%s }] }, '2026-11-03T10:00:00').bloklar.map(function(b){ return b.yuzde; })"
        % (G, json.dumps(plan([{"ad": "Erken", "saat": "05:00"}, {"ad": "Gec", "saat": "23:30"}]))))
bekle("eksen disi saat kenara kenetlenir", s2 == [0, 100])

# 2. siradaki
r = js("%s.siradaki(%s.serit(%s, '2026-11-03T14:00:00'), '2026-11-03T14:00:00')" % (G, G, json.dumps(TEKGUN, ensure_ascii=False)))
bekle("siradaki: saati gelecek ilk bekleyen", r and r["ad"] == "Paragraf")
r = js("%s.siradaki(%s.serit(%s, '2026-11-03T17:00:00'), '2026-11-03T17:00:00')" % (G, G, json.dumps(TEKGUN, ensure_ascii=False)))
bekle("saatli bitmisse vakti gelen saatsiz", r and r["ad"] == "Tekrar")
bekle("hic blok yoksa null", js("%s.siradaki(%s.serit(null, '2026-11-03T14:00:00'), '2026-11-03T14:00:00')" % (G, G)) is None)
r = js("%s.siradaki(%s.serit({ tarih:'2026-11-03', moduller:[{ modul:'ays', gun:'2026-11-03', bayat:false, icerik:%s }] }, '2026-11-03T20:00:00'), '2026-11-03T20:00:00')"
       % (G, G, json.dumps(plan([{"ad": "Kaçan", "saat": "18:00", "durum": "bekliyor"}]))))
bekle("saati gecmis ama bekleyen de onerilir", r and r["ad"] == "Kaçan")

# 3. karne (hafta Pazartesi baslar; 2026-11-03 Sali)
GUNLUK = {"moduller": [
    {"modul": "ays", "zaman": 1793700000000 + 0, "gunler": {
        "2026-11-02": {"soru": 30, "dakika": 45, "dogru": 80},
        "2026-11-03": {"soru": 0, "dakika": 0, "dogru": None}}},
    {"modul": "esp", "zaman": 1793700000000, "gunler": {"2026-11-03": {"toplam": 25, "dil": 25}}},
]}
k = js("%s.karne(%s, '2026-11-03')" % (G, json.dumps(GUNLUK)))
if k:
    bekle("hafta pazartesiden", k["gunler"] == ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"])
    bekle("bugun indeksi", k["bugun"] == 1)
    alan = {x["alan"]: x for x in k["satirlar"]}
    bekle("bes satir, sirali", [x["alan"] for x in k["satirlar"]] == ["uyku", "beslenme", "hareket", "calisma", "gelisim"])
    bekle("satir modulleri", [x["modul"] for x in k["satirlar"]] == ["spi", "spi", "spi", "ays", "esp"])
    bekle("calisma: pzt yapildi, sali kayit yok, gelecek", alan["calisma"]["hucreler"] == ["yapildi", "kayit-yok", "gelecek", "gelecek", "gelecek", "gelecek", "gelecek"])
    bekle("calisma degeri dakika (kayit varsa 0 da deger)", alan["calisma"]["degerler"][:2] == [45, 0])
    bekle("gelisim: pzt kayit yok, sali yapildi", alan["gelisim"]["hucreler"][:2] == ["kayit-yok", "yapildi"] and alan["gelisim"]["degerler"][1] == 25)
    bekle("SPI yayini yok: veri yok", alan["uyku"]["hucreler"][:2] == ["veri-yok", "veri-yok"])
    bekle("bugun ozeti", k["bugunOzet"] == {"uyku": None, "beslenme": None, "hareket": None, "calisma": 0, "gelisim": 25})
k0 = js("%s.karne(null, '2026-11-03')" % G)
if k0:
    bekle("cevap yoksa gecmis gunler veri yok", all(x["hucreler"][:2] == ["veri-yok", "veri-yok"] for x in k0["satirlar"]))
    bekle("cevap yoksa bugun ozeti hep null", all(v is None for v in k0["bugunOzet"].values()))
# zaman = 2026-11-02 13:00 (yerel): yayin dunden; bugun icin modulden bilgi yok.
k2 = js("%s.karne({ moduller:[{ modul:'ays', zaman:%d, gunler:{} }] }, '2026-11-03').satirlar[3].hucreler.slice(0, 2)" % (G, 1793613600000))
bekle("yayin bugunden onceyse bugun veri yok", k2 == ["kayit-yok", "veri-yok"])

# Serit yerlesimi: sagdan tasmaz, cakisan alt siraya iner, uzak olan ayni sirada kalir.
y = js(G + ".seritYeri([{yuzde:10},{yuzde:15},{yuzde:40},{yuzde:95}])")
bekle("serit: tasan sola dayanir", y["yerler"][3]["x"] == 80)
bekle("serit: cakisan alt sirada", y["yerler"][1]["serit"] == 1)
bekle("serit: bosalan sira yeniden kullanilir", y["yerler"][2]["serit"] == 0)
bekle("serit: sira sayisi", y["seritler"] == 2)
bekle("serit: bos liste", js(G + ".seritYeri([])") == {"yerler": [], "seritler": 1})

if hata:
    print("KIRMIZI (%d):" % len(hata))
    for h in hata:
        print(" -", h)
    sys.exit(1)
print("YEŞİL: gunveri kabul testi")
