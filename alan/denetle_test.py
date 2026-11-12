"""python alan/denetle_test.py — denetcinin kucuk testi (gecici klasorde bozuk ornekler). Cikis 0/1."""
import copy
import json
import os
import subprocess
import sys
import tempfile

BURASI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BURASI)
import denetle  # noqa: E402

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def soru(i, durum="taslak"):
    return {"id": i, "tur": "secmeli", "soru": "s", "sec": ["a", "b", "c"], "dogru": "A",
            "durum": durum, "yazan": "model", "kaynak": ["k1"]}


def ders(i, onkosul=()):
    return {"id": i, "ad": "D", "onKosul": list(onkosul), "durum": "taslak", "yazan": "model",
            "kaynak": ["k1"], "ozet": "o", "metin": ["m"], "alistirmalar": [soru(i + ".a1")]}


TEMEL = {
    "sema": 1, "alan": "t", "id": "t.1", "sira": 1, "ad": "A", "hedef": "h", "onKosul": [],
    "kaynaklar": [{"id": "k1", "ad": "K", "tur": "gemini", "yol": "x.md", "dogrulama": "dogrulanmamis"}],
    "kapi": {"esik": 0.8, "sorular": [soru("t.1.k1"), soru("t.1.k2"), soru("t.1.k3")]},
    "uniteler": [{
        "id": "t.1.1", "ad": "U", "onKosul": [],
        "kapi": {"esik": 0.75, "sorular": [soru("t.1.1.k1"), soru("t.1.1.k2"), soru("t.1.1.k3")]},
        "dersler": [ders("t.1.1.1"), ders("t.1.1.2", ["t.1.1.1"])],
    }],
}


def calistir(veri):
    with tempfile.TemporaryDirectory() as d:
        with open(os.path.join(d, "asama-1.json"), "w", encoding="utf-8") as f:
            json.dump(veri, f, ensure_ascii=False)
        return denetle.denetle_klasor(d)[0]


def bozuk(fn):
    v = copy.deepcopy(TEMEL)
    fn(v)
    return v


DURUMLAR = [
    ("temiz örnek hata vermez", TEMEL, None),
    ("eksik zorunlu alan", bozuk(lambda v: v.pop("hedef")), "zorunlu alan eksik: hedef"),
    ("bilinmeyen önkoşul", bozuk(lambda v: v["uniteler"][0]["dersler"][1].update(onKosul=["t.1.1.9"])),
     "bilinmeyen önkoşul: t.1.1.9"),
    ("önkoşul döngüsü", bozuk(lambda v: v["uniteler"][0]["dersler"][0].update(onKosul=["t.1.1.2"])),
     "önkoşul döngüsü"),
    ("kaynaksız ders", bozuk(lambda v: v["uniteler"][0]["dersler"][0].update(kaynak=[])), "kaynaksız"),
    ("bilinmeyen kaynak", bozuk(lambda v: v["uniteler"][0]["dersler"][0].update(kaynak=["k9"])),
     "bilinmeyen kaynak"),
    ("cevap anahtarsız alıştırma", bozuk(lambda v: v["uniteler"][0]["dersler"][0]["alistirmalar"][0].pop("dogru")),
     "cevap anahtarı yok"),
    ("seçeneklerle uyuşmayan anahtar", bozuk(lambda v: v["uniteler"][0]["dersler"][0]["alistirmalar"][0].update(dogru="E")),
     "uyuşmuyor"),
    ("yinelenen kimlik", bozuk(lambda v: v["uniteler"][0]["dersler"][1].update(id="t.1.1.1", onKosul=[])),
     "yinelenen kimlik"),
    ("kapıda açık uçlu soru", bozuk(lambda v: v["kapi"]["sorular"][0].update(tur="acik", olcut=["o"])),
     "kapı sorusu secmeli olmalı"),
    ("onaysız 'onayli'", bozuk(lambda v: v["uniteler"][0]["dersler"][0].update(durum="onayli")),
     "onaylayan ve onayTarihi"),
    ("geçersiz eşik", bozuk(lambda v: v["uniteler"][0]["kapi"].update(esik=1.5)), "esik"),
]

hatali = 0
for ad, veri, beklenen in DURUMLAR:
    hatalar = calistir(veri)
    if beklenen is None:
        tamam = not hatalar
    else:
        tamam = any(beklenen in h for h in hatalar)
    hatali += not tamam
    print(("✓ " if tamam else "✕ ") + ad + ("" if tamam else f" — gelen: {hatalar}"))

# Gercek icerik ve komut satiri cikis kodu
felsefe = os.path.join(BURASI, "felsefe")
r = subprocess.run([sys.executable, os.path.join(BURASI, "denetle.py"), felsefe], capture_output=True)
tamam = r.returncode == 0
hatali += not tamam
print(("✓ " if tamam else "✕ ") + "alan/felsefe temiz (çıkış 0)")
with tempfile.TemporaryDirectory() as d:
    with open(os.path.join(d, "asama-1.json"), "w", encoding="utf-8") as f:
        json.dump(bozuk(lambda v: v.pop("uniteler")), f)
    r = subprocess.run([sys.executable, os.path.join(BURASI, "denetle.py"), d], capture_output=True)
tamam = r.returncode == 1 and "zorunlu alan eksik: uniteler" in r.stdout.decode("utf-8")
hatali += not tamam
print(("✓ " if tamam else "✕ ") + "bozuk klasörde çıkış 1 ve Türkçe hata satırı")

toplam = len(DURUMLAR) + 2
print(f"{toplam - hatali}/{toplam} test geçti")
sys.exit(1 if hatali else 0)
