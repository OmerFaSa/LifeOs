#!/usr/bin/env python3
"""Goc araci (sistem/goc.py) testi: python3 tools/goc_test.py   (cikis 0 temiz, 1 kirmizi)

Gecici klasorlerde, gercek semalarla (sistem/hesap.py Depo, HKM/core/db.py connect). Korunan sozler
goc.py basligindaki 1-8. Kullanicinin hicbir dosyasina dokunmaz."""
import base64
import hashlib
import json
import os
import shutil
import sqlite3
import sys
import tempfile
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KOK / "sistem"))
sys.path.insert(0, str(KOK / "HKM"))
sys.dont_write_bytecode = True

import goc  # noqa: E402
import hesap  # noqa: E402
from core import db as hkmdb  # noqa: E402

kirmizi = 0


def dogru(ad, kosul, ek=""):
    global kirmizi
    print(("  ✓ " if kosul else "  ✕ ") + ad + ("" if kosul else "  %r" % (ek,)))
    kirmizi += 0 if kosul else 1


try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

t = tempfile.mkdtemp(prefix="lifeos-goc-test-")


def j(x):
    return json.dumps(x, ensure_ascii=False)


def hesap_db(yol, satirlar, yayin=()):
    d = hesap.Depo(yol)
    with d._islem() as c:
        for alan, y, deger, zaman in satirlar:
            c.execute("INSERT INTO kayit(kullanici, alan, yol, deger, zaman, cihaz, sira) VALUES (1,?,?,?,?,?,1)",
                      (alan, y, None if deger is None else j(deger), zaman, "cPC"))
        for ad, icerik in yayin:
            c.execute("INSERT INTO yayin(kullanici, ad, icerik, adet, zaman) VALUES (1,?,?,1,1)", (ad, j(icerik)))
    return d


def paket(klasor, ad, **p):
    os.makedirs(klasor, exist_ok=True)
    p.setdefault("lifeos_goc", 1)
    with open(os.path.join(klasor, ad), "w", encoding="utf-8") as f:
        json.dump(p, f, ensure_ascii=False)


def ozetler(kok):
    out = {}
    for d, _, adlar in os.walk(kok):
        for a in adlar:
            out[os.path.join(d, a)] = hashlib.sha256(open(os.path.join(d, a), "rb").read()).hexdigest()
    return out


# --- kaynaklar ---
ev = os.path.join(t, "ev")
hesap_yol = os.path.join(ev, "hesap", "hesap.db")
hesap_db(hesap_yol, [
    ("spi/ben", "vitals/2026-11-01", {"date": "2026-11-01", "weight": 71.5, "water": 6}, 1793866909828),
    ("spi/ben", "labs/l1", {"id": "l1", "values": {"ldl": {"v": 120, "cert": "measured"}, "tg": {"v": 90, "cert": "derived"}}}, 5),
    ("esp/ben", "days/2026-11-01", {"sessions": [{"minutes": 30, "minutesCert": "estimated"}]}, 5),
    ("esp/ben", "days/2026-10-31", {"sessions": [{"minutes": 20, "minutesCert": "estimated"}]}, 5),
    ("ays/main", "briefings/2026-11-01", {"noteCount": 3}, 5),
    ("ays/main", "usage", {"n": 1}, 5),
    ("ays/main", "cards/k1", {"front": "a", "stage": 2}, 5),
    ("ays/main", "cards/silinen", None, 9),
    ("ays/main", "mood/2026-11-01", {"energy": 3}, 5),
], yayin=[("gun/kayit", {"tarih": "2026-11-01", "enerji": 4}), ("ays/bugun", {"cumle": "x"})])

hkm_yol = os.path.join(t, "hkm", "hkm.db")
os.makedirs(os.path.dirname(hkm_yol))
con = hkmdb.connect(hkm_yol)
con.execute("INSERT INTO memories(user, text, source, created_at) VALUES ('ben','kahve sevmem','kullanici','2026-11-01T12:00:00')")
con.execute("INSERT INTO para(gun, yon, kurus, kategori, kaynak, created_at) VALUES ('2026-11-01','gider',4500,'yemek','local','2026-11-01T12:00:00')")
con.execute("INSERT INTO raw_events(module, date, received_at, payload) VALUES ('spi','2026-11-01','x','{}')")
con.commit()
con.close()

pc = os.path.join(t, "pc")
os.makedirs(os.path.join(pc, "zemin"))
open(os.path.join(pc, "zemin", "gunduz.jpg"), "wb").write(b"\xff\xd8resim")
json.dump({"lifeos.tema": "piksel"}, open(os.path.join(pc, "ayar.json"), "w"))

foto = b"\xff\xd8foto-baytlari"
pk = os.path.join(t, "paket")
paket(pk, "telefon-spi.json", kaynak="spi", cihaz="cTEL", bekleyen={"spi/ben": 2},
      profiller={"ben": {"data": {"vitals/2026-11-01": {"date": "2026-11-01", "weight": 71.5, "water": 6},
                                  "vitals/2026-11-02": {"date": "2026-11-02", "sleep": 7, "updatedAt": 1793900000000}}},
                 "anne": {"data": {"profile": {"birthYear": 1970}}}},
      anahtarlar={"spi.household": ["ben", "anne"]},
      medya=[{"db": "spi-foto", "anahtar": "ben|ogun1", "tur": "image/jpeg", "boyut": len(foto),
              "sha256": hashlib.sha256(foto).hexdigest(), "veri": base64.b64encode(foto).decode()}])
paket(pk, "tablet-esp.json", kaynak="esp", cihaz="cTAB", bekleyen={"esp/ben": 0},
      profiller={"ben": {"data": {"days/2026-11-01": {"sessions": [{"minutes": 45, "minutesCert": "estimated"}]}}}})
paket(pk, "telefon-gun.json", kaynak="gun", cihaz="cTEL",
      anahtarlar={"lifeos.gun.2026-11-01": {"niyet": "oku", "enerji": 4}, "lifeos.bilinc": {"dugum": []}})

kaynak_once = {**ozetler(ev), **ozetler(os.path.dirname(hkm_yol)), **ozetler(pk), **ozetler(pc)}

print("göç kuru koşusu")
h1, h2 = os.path.join(t, "h1"), os.path.join(t, "h2")
r = goc.goc(h1, hesap_yol, hkm_yol, pk, pc)
r2 = goc.goc(h2, hesap_yol, hkm_yol, pk, pc)
dogru("sayı dengesi tutuyor (okunan = taşınan + atlanan)", r["denge"], r["sayim"])
dogru("gidiş-dönüş birebir", r["gidis_donus"], r["bozuk"])
dogru("hata yok", not r["hata"], r["hata"])
dogru("iki koşu bayt bayt aynı rapor", json.dumps(r, sort_keys=True) == json.dumps(r2, sort_keys=True))
dogru("kaynak dosyaları değişmedi", kaynak_once == {**ozetler(ev), **ozetler(os.path.dirname(hkm_yol)), **ozetler(pk), **ozetler(pc)})
dogru("canlı SQLite dosyasının yanında -shm/-wal doğmadı", not os.path.exists(hkm_yol + "-shm") or os.path.getsize(hkm_yol + "-shm") == 0)
dogru("HKM'nin bütün tabloları katalogda", not [u for u in r["uyari"] if "katalogda yok" in u], r["uyari"])

c = sqlite3.connect(os.path.join(h1, "lifeos.db"))
satir = {k: (tur, json.loads(e), kay) for k, tur, e, kay in c.execute("SELECT id, tur, etiket, kaynak FROM kayit")}
dogru("şema sürümlü", c.execute("PRAGMA user_version").fetchone()[0] == 1)
dogru("etiketsiz sayı «eski kayıt»", satir["spi/ben|vitals/2026-11-01"][1] == {"weight": "eski", "water": "eski"}, satir.get("spi/ben|vitals/2026-11-01"))
dogru("hücre etiketi korunur, derived → computed", satir["spi/ben|labs/l1"][1] == {"values.ldl.v": "measured", "values.tg.v": "computed"}, satir.get("spi/ben|labs/l1"))
dogru("kardeş alan etiketi (minutesCert)", satir["esp/ben|days/2026-10-31"][1] == {"sessions.0.minutes": "estimated"})
dogru("AYS boş enerji 3 de «eski kayıt»", satir["ays/main|mood/2026-11-01"][1] == {"energy": "eski"} and satir["ays/main|mood/2026-11-01"][0] == "olcum")
dogru("derived dönüşümü sayıldı", r["etiket"]["tahlil"].get("derived_cevrim") == 1, r["etiket"].get("tahlil"))
dogru("türetilmiş kayıt taşınmadı, sayıldı", "ays/main|briefings/2026-11-01" not in satir
      and r["sayim"]["hesap"]["briefings"]["atlanan"] == {"türetilmiş: yeniden hesaplanır": 1})
dogru("cihaza ait yol atlandı", "ays/main|usage" not in satir and r["sayim"]["hesap"]["usage"]["atlanan"] == {"cihaza ait": 1})
dogru("mezar taşı akım tablosuna girmez", "ays/main|cards/silinen" not in satir and r["sayim"]["hesap"]["kart"]["atlanan"] == {"silinmiş (mezar taşı)": 1})
dogru("açılmamış profil paketten geldi", "spi/anne|profile" in satir)
dogru("sunucuda olmayan kayıt paketten geldi", satir.get("spi/ben|vitals/2026-11-02", ("",))[2] == "paket")
dogru("sunucu ile paket aynıysa bir kez", r["sayim"]["paket"]["olcum"]["atlanan"] == {"ikinci kopya (aynı)": 1}, r["sayim"]["paket"].get("olcum"))
dogru("ana depo dışı anahtar taşındı", "spi/anahtar/cTEL|spi.household" in satir)
dogru("Gün geçmişi paketten, son gün sunucudan", "gun/cTEL|lifeos.gun.2026-11-01" in satir and "gun/sunucu|gun/kayit" in satir)
dogru("türetilmiş yayın taşınmadı", not [k for k in satir if k.endswith("ays/bugun")])
dogru("HKM hafızası taşındı, işaret tablosu yeniden hesaplanır", any(k.startswith("hkm/memories|") for k in satir)
      and not any(k.startswith("hkm/raw_events|") for k in satir))
dogru("para kuruşu taşındı, etiketsiz «eski kayıt»", any(k.startswith("hkm/para|") and e.get("kurus") == "eski" for k, (_, e, _k) in satir.items()))
dogru("PC tercihi ve dosya envanteri", "pc|ayar/lifeos.tema" in satir and r["pc_dosya"]["dosya"] == 1)
dogru("fotoğraf taşındı, sağlaması tutuyor", r["medya"]["dosya"] == 1 and os.path.exists(
    os.path.join(h1, "medya", hashlib.sha256(foto).hexdigest()[:2], hashlib.sha256(foto).hexdigest())))
dogru("cihazda bekleyen sayıldı", r["bekleyen_toplam"] == 2 and r["kaynak"]["paket"]["bekleyen"]["cTEL"] == {"spi/ben": 2})
dogru("çatışma: aynı gün iki cihazda farklı, zaman yok", r["catisma"] == [{"kimlik": "esp/ben|days/2026-11-01", "kaynaklar": ["hesap:cPC", "paket:cTAB"]}], r["catisma"])
c.close()

print("geri dönüş")
n = goc.geri_al(h1, r["goc_id"])
c = sqlite3.connect(os.path.join(h1, "lifeos.db"))
dogru("goc_id ile tümden geri alındı", n == len(satir) and c.execute("SELECT count(*) FROM kayit").fetchone()[0] == 0
      and c.execute("SELECT count(*) FROM medya").fetchone()[0] == 0 and c.execute("SELECT count(*) FROM olay").fetchone()[0] == 0)
c.close()
try:
    goc.goc(h1, hesap_yol, hkm_yol, pk, pc)
    dogru("var olan hedefin üstüne yazmaz", False)
except SystemExit:
    dogru("var olan hedefin üstüne yazmaz", True)

print("sır ve bozuk medya")
pk2 = os.path.join(t, "paket2")
paket(pk2, "sir.json", kaynak="ays", cihaz="cX", anahtarlar={"rota.llm.keys": {"g": "x"}})
paket(pk2, "bozuk.json", kaynak="ays", cihaz="cY", medya=[{"db": "ays-soru-foto", "anahtar": "k", "boyut": 3, "sha256": "00", "veri": "YWJj"}])
r3 = goc.goc(os.path.join(t, "h3"), None, None, pk2, None)
dogru("sır pakette → göç durur", any("sır" in x for x in r3["hata"]), r3["hata"])
r5 = goc.goc(os.path.join(t, "h5"), None, None, None, None)
dogru("paket yoksa bekleyen «ölçülemedi», sıfır değil", r5["bekleyen_toplam"] is None and "ölçülemedi" in goc.md(r5))
dogru("bozuk medya yakalanır", any("Medya bozuk" in x for x in r3["hata"]), r3["hata"])

print("canlı depo boşsa yedekten")
ev2 = os.path.join(t, "ev2", "hesap")
hesap_db(os.path.join(ev2, "hesap.db"), [])
os.makedirs(os.path.join(ev2, "yedek"))
hesap_db(os.path.join(ev2, "yedek", "hesap-gunluk-20261111-033314.db"), [("ays/main", "cards/k1", {"front": "a"}, 5)])
r4 = goc.goc(os.path.join(t, "h4"), os.path.join(ev2, "hesap.db"), None, None, None)
dogru("boş canlı depo tanındı, yedekten okundu", r4["kaynak"]["hesap"]["durum"] == "canlı boş, yedekten okundu"
      and r4["sayim"]["hesap"]["kart"]["tasinan"] == 1, r4["kaynak"]["hesap"])

print("komut satırı")
cikti = os.path.join(t, "rapor")
kod = goc.main(["--kuru", "--cikti", cikti, "--hesap", hesap_yol, "--hkm", hkm_yol, "--paket", pk, "--pc", pc])
dogru("--kuru rapor yazar, geçici hedef kalmaz", kod == 0 and os.path.isfile(os.path.join(cikti, "goc-kuru.md"))
      and "Sayı dengesi: **tutuyor**" in open(os.path.join(cikti, "goc-kuru.md"), encoding="utf-8").read())

shutil.rmtree(t, ignore_errors=True)
print("KIRMIZI: %d" % kirmizi if kirmizi else "temiz")
sys.exit(1 if kirmizi else 0)
