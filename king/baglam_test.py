#!/usr/bin/env python3
"""king/baglam.py sınaması, geçici depo ile (sahibinin verisi hiç okunmaz). Çıkış 0 yeşil, 1 kırmızı.
python king/baglam_test.py"""
import datetime
import json
import os
import shutil
import sys
import tempfile
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KOK / "sistem"))
sys.path.insert(0, str(KOK / "king"))
sys.dont_write_bytecode = True

t = tempfile.mkdtemp(prefix="lifeos-baglam-test-")
HESAP = os.path.join(t, "hesap", "hesap.db")
ICERIK = os.path.join(t, "depo")
# Önce ortam: mcp.yollar() her çağrıda okur, yine de içe aktarmadan önce kuralım
os.environ.update(LIFEOS_HESAP_DB=HESAP, LIFEOS_VERI_DB=os.path.join(t, "yok", "lifeos.db"), LIFEOS_ICERIK=ICERIK)

import baglam  # noqa: E402
import hesap  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass
kirmizi = 0


def dogru(ad, kosul, ek=""):
    global kirmizi
    print(("  ✓ " if kosul else "  ✕ ") + ad + ("" if kosul else "  %r" % (ek,)))
    kirmizi += 0 if kosul else 1


simdi = datetime.datetime.now()
BUGUN = str(simdi.date())
MS = int(simdi.timestamp() * 1000)
GIZLI = ("OZEL-KAYIT-XYZ", "GIZLI-METIN", "sk-ANAHTAR-XYZ", "KAPI-SORUSU-XYZ", "OZEL-ALT-XYZ")

d = hesap.Depo(HESAP)
with d._islem() as c:
    c.execute("INSERT INTO kullanici(id, ad, rol, tuz, ozet, tur, olusturma) VALUES (1,'sahip','admin',?,?,1,'2026-11-01')",
              (b"t", b"o"))
    kayitlar = [("ays/main", "days/" + BUGUN, {"date": BUGUN, "minutes": 50, "minutesCert": "measured"}),
                ("spi/ben", "meta/ayar", {"apiKey": "sk-ANAHTAR-XYZ", "tema": "Piksel"}),
                ("spi/ben", "vitals/" + BUGUN, {"weight": 72.5, "ek": {"ozel": True, "metin": "OZEL-ALT-XYZ"}}),
                ("ays/main", "ozel/o1", {"ozel": True, "metin": "OZEL-KAYIT-XYZ"}),
                ("ays/main", "defter/n1", {"id": "n1", "baslik": "Açık not", "govde": "Platon üzerine", "tur": "not",
                                           "at": "2026-11-10T10:00:00Z", "guncel": "2026-11-11T10:00:00Z", "klasor": ""}),
                ("ays/main", "cards/c1", {"id": "c1", "front": "Soru bir", "back": "Cevap", "dueAt": BUGUN,
                                          "history": [{"rating": "good"}]})]
    kayitlar += [("ays/main", "sessions/s%03d" % i, {"dk": i, "metin": "oturum " * 20}) for i in range(60)]
    for alan, yol, deger in kayitlar:
        c.execute("INSERT INTO kayit(kullanici, alan, yol, deger, zaman, cihaz, sira) VALUES (1,?,?,?,?,'cPC',1)",
                  (alan, yol, json.dumps(deger, ensure_ascii=False), MS))
    bilinc = {"izin": True, "dusunceler": [
        {"id": "d1", "baslik": "Açık düşünce", "metin": "açık", "tur": "fikir", "kesinlik": 3, "zaman": MS},
        {"id": "d2", "baslik": "Gizli düşünce", "metin": "GIZLI-METIN", "tur": "his", "ozel": True, "zaman": MS}]}
    for ad, icerik, gun in (("ays/bugun", "3 blok planlı", BUGUN), ("gun/bilinc", json.dumps(bilinc), None)):
        c.execute("INSERT INTO yayin(kullanici, ad, icerik, adet, zaman, gun) VALUES (1,?,?,1,?,?)", (ad, icerik, MS / 1000, gun))
del d
kapi = {"esik": 0.7, "sorular": [{"id": "q1", "soru": "KAPI-SORUSU-XYZ", "dogru": "a"}]}
os.makedirs(os.path.join(ICERIK, "alan", "felsefe"))
Path(ICERIK, "alan", "felsefe", "asama-1.json").write_text(json.dumps(
    {"id": "f1", "ad": "Aşama 1", "kapi": kapi, "uniteler": [{"id": "u1", "ad": "Ünite 1", "kapi": kapi, "dersler": [
        {"id": "ders%d" % i, "ad": "Ders %d" % i, "durum": "onayli", "ozet": "özet " * 30} for i in range(30)]}]},
    ensure_ascii=False), encoding="utf-8")


def metni(x):
    return json.dumps(x, ensure_ascii=False)


print("Kayıt niyeti modele gitmez")
r = baglam.derle("Bugün 20 dakika yürüdüm")
dogru("kayıt: model yolu yok, kural motoru", r["niyet"] == "kayit" and r["arac_yolu"] == "kural motoru (kaydet)", r)
dogru("kayıt: araç yok, dilim yok, 0 jeton", r["araclar"] == [] and r["dilimler"] == [] and r["jeton"] == 0, r)
dogru("kayıt: öneri taşınır (20 dk ölçüldü)", r["kayit"]["alanlar"]["sure_dk"] == {"v": 20, "k": "measured"}, r)

print("Sohbet araç çağırmaz")
r = baglam.derle("merhaba King nasılsın")
dogru("sohbet: araç yok", r["niyet"] == "sohbet" and r["araclar"] == [], r["araclar"])
dogru("sohbet: yalnız bugün dilimi", [d["ad"] for d in r["dilimler"]] == ["bugun"], r["dilimler"])

print("Niyet başına dilim ve bütçe")
for metin, beklenen in (("bugünün planı ne?", "yonet"), ("türev hakkında soru sor", "ogren"),
                        ("Stoacılık hakkında kaynakları araştır", "arastir"), ("kendimi başarısız hissediyorum", "sohbet")):
    r = baglam.derle(metin)
    adlar = [d["ad"] for d in r["dilimler"]] + [d["ad"] for d in r["disarida"]]
    dogru("«%s» → %s, dilimler %s" % (metin, beklenen, list(baglam.NIYET_DILIMLERI[beklenen])),
          r["niyet"] == beklenen and adlar == list(baglam.NIYET_DILIMLERI[beklenen])
          or sorted(adlar) == sorted(baglam.NIYET_DILIMLERI[beklenen]), r)
    dogru("«%s» bütçe içinde: %d ≤ %d" % (metin, r["jeton"], r["butce"]), r["jeton"] <= r["butce"]
          and r["jeton"] == sum(d["jeton"] for d in r["dilimler"]), r["jeton"])
    dogru("«%s» masa katalogla aynı" % metin, r["araclar"] == list(baglam.katalog.NIYET_KAPILARI[beklenen]))

print("Sert bütçe: kırpılır ya da dışarıda kalır")
r = baglam.derle("bugünün planı ne?", butce=300)
dogru("300 jeton bütçe aşılmaz", r["jeton"] <= 300, r["jeton"])
dogru("sığmayan için kırpma ya da neden yazılır", any(d["kirpilan"] for d in r["dilimler"]) or r["disarida"], r)
dogru("dışarıdakinin nedeni var", all(d["neden"] for d in r["disarida"]), r["disarida"])
r = baglam.derle("bugünün planı ne?", butce=5)
dogru("5 jeton: hiçbir dilim sığmaz, hepsi nedenli dışarıda", r["jeton"] <= 5 and len(r["disarida"]) >= 1, r)
r = baglam.derle("türev hakkında soru sor")
yol = next((d for d in r["dilimler"] if d["ad"] == "yol"), None)
dogru("uzun yol haritası kırpılarak sığar", yol is not None and yol["kirpilan"] > 0 and r["jeton"] <= r["butce"],
      yol and yol["kirpilan"])
dogru("jeton tahmini: boş 0, metin uzunluğu/3", baglam.jeton(None) == 0 and baglam.jeton("a" * 28) == 10)

print("Özel ve gizli hiç girmez")
hepsi = metni([baglam.derle(m) for m in ("bugünün planı ne?", "türev hakkında soru sor", "Stoacılık hakkında kaynakları araştır",
                                        "merhaba King nasılsın", "son notlarım neler")])
for g in GIZLI:
    dogru("bağlamda «%s» yok" % g, g not in hepsi)
for g in ("Açık not", "Açık düşünce", "72.5", "Soru bir"):
    dogru("açık veri okundu: «%s» (süzgeç boş dönmüyor)" % g, g in hepsi)
dogru("sır anahtarı «gizli» ya da hiç", "sk-" not in hepsi)
dogru("ozelsiz: iç içe ozel:true atılır",
      baglam.ozelsiz({"a": [1, {"ozel": True}], "b": {"ozel": True}, "c": {"ozel": False}}) == {"a": [1], "c": {"ozel": False}})

print("Okunamayan dilim çökertmez")
os.environ["LIFEOS_NODE"] = os.path.join(t, "node-yok.exe")
r = baglam.derle("Stoacılık hakkında kaynakları araştır")
dogru("Node yok: notlar dışarıda, nedeni «okunamadı»", r["dilimler"] == [] and r["disarida"]
      and r["disarida"][0]["neden"].startswith("okunamadı"), r)
os.environ.pop("LIFEOS_NODE")

shutil.rmtree(t, ignore_errors=True)
print("\n%s · kırmızı %d" % ("YEŞİL" if not kirmizi else "KIRMIZI", kirmizi))
sys.exit(1 if kirmizi else 0)
