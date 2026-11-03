#!/usr/bin/env python3
"""Kabul testi, Gun plani §2 Gecmis ve Sen: brand/ortak/gunveri.js'in ikinci yarisi.

     donem(gunluk, bugun, n)       son n gunun hayat karnesi, toplam, haftanin sekli
     planGercek(serit)             bugunun plani ve gercegi, modul modul
     izDizi(iz, bugun, n)          senin girdigin enerji ve ic hava, gun gun
     kartCek(deste, enerji, haric) «Ne yapsam?» destesi: kural secer, ogrenir

   Sozler: girilmemis gun null (sifir degil); «kayit yok» bilinen sifirdir,
   «veri yok» ortalamaya girmez; kart kuralla secilir, rastgele degil.

   python3 tools/gunveri_gecmis_kabul_test.py     (cikis 0 temiz, 1 kirmizi)"""
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


# 1. donem: 2026-11-03 Sali; yayin bugun (zaman 2026-11-03 ogle)
ZAMAN = 1793700000000   # 2026-11-03 13:00 yerel (TR)
GUNLUK = {"moduller": [
    {"modul": "ays", "zaman": ZAMAN, "gunler": {
        "2026-10-27": {"soru": 20, "dakika": 60},      # Sali
        "2026-11-02": {"soru": 30, "dakika": 40},      # Pazartesi
        "2026-11-03": {"soru": 0, "dakika": 0}}},
    {"modul": "esp", "zaman": ZAMAN, "gunler": {"2026-11-03": {"toplam": 25}}},
]}
d = js("%s.donem(%s, '2026-11-03', 7)" % (G, json.dumps(GUNLUK)))
if d:
    bekle("7 gun, eskiden yeniye, bugun son", d["gunler"][0] == "2026-10-28" and d["gunler"][-1] == "2026-11-03" and len(d["gunler"]) == 7)
    a = {x["alan"]: x for x in d["satirlar"]}
    bekle("bes satir", list(a) == ["uyku", "beslenme", "hareket", "calisma", "gelisim"])
    c = a["calisma"]
    bekle("calisma hucreleri", c["hucreler"] == ["kayit-yok"] * 5 + ["yapildi", "kayit-yok"])
    bekle("calisma toplam 40 (donem disi sayilmaz)", c["toplam"] == 40)
    bekle("etkin gun 1, bilinen 7", c["etkin"] == 1 and c["bilinen"] == 7)
    bekle("SPI: veri yok, toplam null", a["uyku"]["toplam"] is None and a["uyku"]["bilinen"] == 0 and set(a["uyku"]["hucreler"]) == {"veri-yok"})
    bekle("haftanin sekli 7 deger, pazartesi 40", len(c["sekil"]) == 7 and c["sekil"][0] == 40)
    bekle("sekil: kayit yok sifir sayilir", c["sekil"][1] == 0)
    bekle("sekil: SPI hep null", a["uyku"]["sekil"] == [None] * 7)
d30 = js("%s.donem(%s, '2026-11-03', 30)" % (G, json.dumps(GUNLUK)))
if d30:
    c = {x["alan"]: x for x in d30["satirlar"]}["calisma"]
    bekle("30 gun", len(d30["gunler"]) == 30 and d30["gunler"][-1] == "2026-11-03")
    bekle("30 gunde toplam 100, etkin 2", c["toplam"] == 100 and c["etkin"] == 2)
    bekle("sali ortalamasi (60+0+...)/bilinen", c["sekil"][1] is not None and c["sekil"][1] > 0)
d0 = js("%s.donem(null, '2026-11-03', 7)" % G)
if d0:
    bekle("cevap yoksa hep veri yok, toplam null", all(x["toplam"] is None and set(x["hucreler"]) == {"veri-yok"} for x in d0["satirlar"]))
# ESP yayini dunden: bugun bilinmiyor → veri yok, ortalamaya girmez
d1 = js("%s.donem({ moduller:[{ modul:'esp', zaman:%d, gunler:{ '2026-11-02':{ toplam:30 } } }] }, '2026-11-03', 7).satirlar[4]" % (G, ZAMAN - 86400000))
if d1:
    bekle("dunden yayin: bugun veri yok", d1["hucreler"][-1] == "veri-yok" and d1["hucreler"][-2] == "yapildi" and d1["bilinen"] == 6)

# 2. planGercek
S = {"bloklar": [{"modul": "ays", "durum": "bitti"}, {"modul": "ays", "durum": "bekliyor"}, {"modul": "gun", "durum": "atlandi"}],
     "saatsiz": [{"modul": "ays", "durum": "vakti"}, {"modul": "esp", "durum": "bitti"}]}
p = js("%s.planGercek(%s)" % (G, json.dumps(S)))
bekle("plan ve gercek: yalniz plani olan moduller, sabit sira", p == [
    {"modul": "ays", "plan": 3, "bitti": 1, "atlandi": 0, "acik": 2},
    {"modul": "esp", "plan": 1, "bitti": 1, "atlandi": 0, "acik": 0},
    {"modul": "gun", "plan": 1, "bitti": 0, "atlandi": 1, "acik": 0}])
bekle("plan yoksa bos liste", js("%s.planGercek(null)" % G) == [])

# 3. izDizi
z = js("%s.izDizi({ '2026-11-01':{ enerji:2, hava:'yagmur' }, '2026-11-03':{ enerji:4, hava:null }, '2026-10-01':{ enerji:5 } }, '2026-11-03', 7)" % G)
if z:
    bekle("iz 7 gun", len(z["gunler"]) == 7 and z["gunler"][-1]["gun"] == "2026-11-03")
    bekle("girilmemis gun null", z["gunler"][-2] == {"gun": "2026-11-02", "enerji": None, "hava": None})
    bekle("girilen gun", z["gunler"][-3] == {"gun": "2026-11-01", "enerji": 2, "hava": "yagmur"})
    bekle("ortalama yalniz girilenlerden (donem disi yok)", z["ortalama"] == 3 and z["girilen"] == 2)
z0 = js("%s.izDizi(null, '2026-11-03', 7)" % G)
bekle("iz yoksa ortalama null", z0 and z0["ortalama"] is None and z0["girilen"] == 0)

# 4. kartCek
D = [{"ad": "Koşu", "enerji": "cok", "evet": 3, "gec": 0}, {"ad": "Çay demle", "enerji": "az", "evet": 1, "gec": 0},
     {"ad": "Oda topla", "enerji": None, "evet": 0, "gec": 4}]
k = js("%s.kartCek(%s, null, [])" % (G, json.dumps(D, ensure_ascii=False)))
bekle("enerji yoksa sik yapilan one", k and k["kart"]["ad"] == "Koşu" and k["sira"] == 0 and k["neden"])
k = js("%s.kartCek(%s, 2, [])" % (G, json.dumps(D, ensure_ascii=False)))
bekle("enerji dusukse az enerjili kart", k and k["kart"]["ad"] == "Çay demle")
k = js("%s.kartCek(%s, null, ['Koşu', 'Çay demle'])" % (G, json.dumps(D, ensure_ascii=False)))
bekle("gecilenler haric", k and k["kart"]["ad"] == "Oda topla")
bekle("hepsi haricse null", js("%s.kartCek(%s, null, ['Koşu', 'Çay demle', 'Oda topla'])" % (G, json.dumps(D, ensure_ascii=False))) is None)
bekle("bos deste null", js("%s.kartCek([], 3, [])" % G) is None)
bekle("ayni girdi ayni kart (rastgele degil)", js("%s.kartCek(%s, 4, []).kart.ad" % (G, json.dumps(D, ensure_ascii=False))) == js("%s.kartCek(%s, 4, []).kart.ad" % (G, json.dumps(D, ensure_ascii=False))))
b = js("%s.BASLANGIC" % G)
bekle("baslangic destesi sunucu sinirinda", b and 4 <= len(b) <= 30 and all(len(x["ad"]) <= 60 and x["enerji"] in ("az", "cok", None) for x in b))

if hata:
    print("KIRMIZI (%d):" % len(hata))
    for h in hata:
        print(" -", h)
    sys.exit(1)
print("YEŞİL: gunveri Gecmis ve Sen kabul testi")
