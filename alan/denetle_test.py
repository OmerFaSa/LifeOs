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


def calistir(veri, harita=None):
    with tempfile.TemporaryDirectory() as d:
        with open(os.path.join(d, "asama-1.json"), "w", encoding="utf-8") as f:
            json.dump(veri, f, ensure_ascii=False)
        if harita is not None:
            with open(os.path.join(d, "harita.json"), "w", encoding="utf-8") as f:
                json.dump(harita, f, ensure_ascii=False)
        return denetle.denetle_klasor(d)[0]


# Konu haritasi (SEMA.md «Konu haritası»): baglar TEMEL'deki gercek kimliklere
HARITA = {"sema": 1, "alan": "t", "dallar": [
    {"id": "a", "ad": "A dalı", "ozet": "o", "bolumler": [
        {"ad": "B", "konular": [{"ad": "K1", "ders": "t.1.1.1"}, {"ad": "K2", "unite": "t.1.1"}, {"ad": "K3"}]}]},
    {"id": "b", "ad": "B dalı", "ozet": "o", "bolumler": [{"ad": "C", "konular": [{"ad": "K4"}]}]}]}


def hbozuk(fn):
    h = copy.deepcopy(HARITA)
    fn(h)
    return h


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

HDURUMLAR = [
    ("temiz harita hata vermez", HARITA, None),
    ("harita aşama sayılmaz (zorunlu alan uyarısı yok)", HARITA, "!zorunlu alan eksik: hedef"),
    ("var olmayan ders bağı", hbozuk(lambda h: h["dallar"][0]["bolumler"][0]["konular"][0].update(ders="t.1.1.9")),
     "var olmayan ders bağı: 't.1.1.9'"),
    ("ünite kimliği ders diye bağlanamaz", hbozuk(lambda h: h["dallar"][0]["bolumler"][0]["konular"][0].update(ders="t.1.1")),
     "var olmayan ders bağı"),
    ("var olmayan ünite bağı", hbozuk(lambda h: h["dallar"][0]["bolumler"][0]["konular"][1].update(unite="t.1.9")),
     "var olmayan ünite bağı"),
    ("yinelenen dal kimliği", hbozuk(lambda h: h["dallar"][1].update(id="a")), "yinelenen dal kimliği"),
    ("boş bölüm", hbozuk(lambda h: h["dallar"][1]["bolumler"][0].update(konular=[])), "boş bölüm"),
    ("bölümsüz dal", hbozuk(lambda h: h["dallar"][1].update(bolumler=[])), "bölümler listesi boş"),
    ("dalda eksik özet", hbozuk(lambda h: h["dallar"][0].pop("ozet")), "zorunlu alan eksik: ozet"),
    ("adsız konu", hbozuk(lambda h: h["dallar"][0]["bolumler"][0]["konular"][2].update(ad=" ")), "konu adı boş"),
    ("başka alanın haritası", hbozuk(lambda h: h.update(alan="x")), "alan aşamalarla uyuşmuyor"),
    ("boş dal listesi", hbozuk(lambda h: h.update(dallar=[])), "dallar listesi boş"),
]

hatali = 0
for ad, h, beklenen in HDURUMLAR:
    hatalar = calistir(TEMEL, h)
    if beklenen is None:
        tamam = not hatalar
    elif beklenen.startswith("!"):
        tamam = not any(beklenen[1:] in x for x in hatalar)
    else:
        tamam = any(beklenen in x for x in hatalar)
    hatali += not tamam
    print(("✓ " if tamam else "✕ ") + ad + ("" if tamam else f" — gelen: {hatalar}"))

for ad, veri, beklenen in DURUMLAR:
    hatalar = calistir(veri)
    if beklenen is None:
        tamam = not hatalar
    else:
        tamam = any(beklenen in h for h in hatalar)
    hatali += not tamam
    print(("✓ " if tamam else "✕ ") + ad + ("" if tamam else f" — gelen: {hatalar}"))

# Gercek icerik ve komut satiri cikis kodu
for gercek in ("felsefe", "tarih"):  # ikisinde de harita.json var
    r = subprocess.run([sys.executable, os.path.join(BURASI, "denetle.py"), os.path.join(BURASI, gercek)], capture_output=True)
    tamam = r.returncode == 0 and "harita:" in r.stdout.decode("utf-8")
    hatali += not tamam
    print(("✓ " if tamam else "✕ ") + f"alan/{gercek} temiz, haritası denetlendi (çıkış 0)")
with tempfile.TemporaryDirectory() as d:
    with open(os.path.join(d, "asama-1.json"), "w", encoding="utf-8") as f:
        json.dump(bozuk(lambda v: v.pop("uniteler")), f)
    r = subprocess.run([sys.executable, os.path.join(BURASI, "denetle.py"), d], capture_output=True)
tamam = r.returncode == 1 and "zorunlu alan eksik: uniteler" in r.stdout.decode("utf-8")
hatali += not tamam
print(("✓ " if tamam else "✕ ") + "bozuk klasörde çıkış 1 ve Türkçe hata satırı")

toplam = len(HDURUMLAR) + len(DURUMLAR) + 3
print(f"{toplam - hatali}/{toplam} test geçti")
sys.exit(1 if hatali else 0)
