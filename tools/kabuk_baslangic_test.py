#!/usr/bin/env python3
"""tools/kabuk_baslangic.py testi, uydurma tek depoyla: not ve kayit pakete girer, bos not ve sinir disi olcu
girmez, plan ciktisi kabuk deposu disinda sayilir, kimlik icerikten gelir, ekrana icerik basilmaz, depo degismez.

  python tools/kabuk_baslangic_test.py
"""
import hashlib
import io
import json
import os
import sqlite3
import sys
import tempfile
from contextlib import redirect_stdout
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
sys.dont_write_bytecode = True
sys.path.insert(0, str(KOK / "sistem"))
sys.path.insert(0, str(KOK / "tools"))
import goc  # noqa: E402
import kabuk_baslangic  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass
kirmizi = 0
GIZLI = "GIZLI-ICERIK-9c1"


def dogru(ad, kosul, ek=""):
    global kirmizi
    print(("  ✓ " if kosul else "  ✕ ") + ad + ("" if kosul else "  %r" % (ek,)))
    kirmizi += 0 if kosul else 1


def depo_kur(yol):
    c = sqlite3.connect(yol)
    c.executescript(goc.SEMA)
    satirlar = [
        ("not", "ays/main", "defter/n1", {"id": "n1", "baslik": GIZLI, "govde": GIZLI, "at": "2026-11-01T10:00:00Z", "guncel": "2026-11-01T10:00:00Z"}),
        ("not", "ays/main", "defter/n2", {"id": "n2", "baslik": "", "govde": "", "at": "2026-11-01T10:00:00Z", "guncel": "2026-11-01T10:00:00Z"}),   # bos: ret
        ("olcum", "spi/ben", "vitals/2026-11-01", {"date": "2026-11-01", "weight": 72, "water": 1500}),
        ("olcum", "spi/ben", "vitals/2026-11-02", {"date": "2026-11-02", "hrv": 987654}),                                                             # sinir disi: ret
        ("ays.days", "ays/main", "days/2026-11-03", {"date": "2026-11-03", "blocks": []}),                                                            # plan: kabuk deposu disinda
        ("profil", "spi/ben", "profile", {"heightCm": 175, "birthYear": 2001, "sex": "male", "goal": "cut", "weightKg": 70, "name": GIZLI}),
        ("esp.prefs", "esp/ben", "prefs/x", {"metin": GIZLI}),                                                                                         # sahibi motor yok
    ]
    for i, (tur, alan, yol_, govde) in enumerate(satirlar):
        c.execute("INSERT INTO kayit(id, tur, tur_surum, alan, yol, govde, etiket, hlc, cihaz, silindi, kaynak, goc_id) VALUES (?,?,1,?,?,?,?,?,?,0,?,?)",
                  ("k%d" % i, tur, alan, yol_, json.dumps(govde, ensure_ascii=False), "{}", "0001-%d" % i, "cPC", "hesap", "g1"))
    c.execute("INSERT INTO kayit(id, tur, tur_surum, alan, yol, govde, etiket, hlc, cihaz, silindi, kaynak, goc_id) VALUES ('sil',?,1,?,?,NULL,'{}','0002','cPC',1,'hesap','g1')",
              ("not", "ays/main", "defter/silinen"))
    c.commit()
    c.close()


with tempfile.TemporaryDirectory() as t:
    depo, cikti = os.path.join(t, "lifeos.db"), os.path.join(t, "veri", "kabuk-baslangic.json")
    depo_kur(depo)
    once = hashlib.sha256(open(depo, "rb").read()).hexdigest()
    yazi = io.StringIO()
    with redirect_stdout(yazi):
        kod = kabuk_baslangic.main(["--depo", depo, "--cikti", cikti, "--zaman", "1763000000000"])
    p = json.load(open(cikti, encoding="utf-8"))
    print("paket")
    dogru("çıkış 0, dosya yazıldı, biçim imi var", kod == 0 and p["lifeos_kabuk_baslangic"] == 1 and p["uretildi"] == 1763000000000, kod)
    dogru("geçerli not pakette, boş not ve silinen yok", [n["id"] for n in p["notlar"]] and len(p["notlar"]) == 1 and p["notlar"][0]["baslik"] == GIZLI, p["say"])
    dogru("ölçüler kayıt oldu (kilo ve su), sınır dışı ölçü girmedi",
          sorted((k["tur"], k["gun"]) for k in p["kayitlar"]) == [("kilo", "2026-11-01"), ("su", "2026-11-01")], [(k["tur"], k["gun"]) for k in p["kayitlar"]])
    dogru("kayıtlar motor biçiminde: değer ve kesinlik etiketi", all(set(k) >= {"id", "tur", "gun", "deger"} and all("k" in v and "v" in v for v in k["deger"].values()) for k in p["kayitlar"]))
    dogru("eski profil Beden alanlarına döndü (kilo ve ad girmez)", p["beden"] == {"cinsiyet": "erkek", "boy": 175, "dogumYili": 2001, "hedef": "ver"}, p["beden"])
    dogru("sayılar içerikle tutuyor", p["say"] == {"notlar": 1, "kayitlar": 2, "kartlar": 0}, p["say"])
    dogru("ekrana kişisel içerik basılmadı", GIZLI not in yazi.getvalue(), yazi.getvalue()[:200])
    dogru("tablo plan çıktısını kabuk deposu dışında sayar", any(l.startswith("| plan.aysGun | 1 | 0 |") and l.rstrip().endswith("| 1 |") for l in yazi.getvalue().splitlines()), yazi.getvalue())
    dogru("depo değişmedi, geçici kopya kalmadı", hashlib.sha256(open(depo, "rb").read()).hexdigest() == once
          and not [a for a in os.listdir(tempfile.gettempdir()) if a.startswith("lifeos-kabuk-baslangic-")])
    with redirect_stdout(io.StringIO()):
        kabuk_baslangic.main(["--depo", depo, "--cikti", cikti + "2", "--zaman", "1763999999999"])
    dogru("kimlik içerikten: aynı depo aynı kimlik (zaman değişse de)", json.load(open(cikti + "2", encoding="utf-8"))["kimlik"] == p["kimlik"])
    with redirect_stdout(io.StringIO()) as y2:
        kod = kabuk_baslangic.main(["--depo", os.path.join(t, "yok.db"), "--cikti", cikti + "3"])
    dogru("depo yoksa çıkış 1, dosya yazılmaz", kod == 1 and not os.path.exists(cikti + "3"))

print("Kabuk başlangıç paketi: " + ("temiz" if not kirmizi else "%d KIRMIZI" % kirmizi))
sys.exit(1 if kirmizi else 0)
