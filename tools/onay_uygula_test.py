#!/usr/bin/env python3
"""tools/onay_uygula.py testi: gerçek içeriğin geçici kopyası üzerinde (depodaki alan/ dosyalarına dokunmaz).
python tools/onay_uygula_test.py   (çıkış 0/1)"""
import contextlib
import io
import json
import shutil
import sys
import tempfile
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # Windows konsolu cp1254: ✓ ✕ yazılamaz
sys.path.insert(0, str(KOK / "tools"))
sys.path.insert(0, str(KOK / "alan"))
import onay_uygula as O  # noqa: E402
import denetle  # noqa: E402

gecen = kalan = 0


def t(ad, f):
    global gecen, kalan
    try:
        f()
        gecen += 1
        print("✓ " + ad)
    except Exception as e:  # noqa: BLE001
        kalan += 1
        print("✕ " + ad + "\n    " + repr(e))


def oku(p):
    with open(p, encoding="utf-8", newline="") as f:
        return f.read()


G = {"durum": "onayli", "onaylayan": "sahip", "onayTarihi": "2026-11-14"}
gecici = Path(tempfile.mkdtemp(prefix="onay-uygula-"))
for alan in ("felsefe", "tarih"):  # felsefe LF, tarih/asama-1 CRLF
    shutil.copytree(KOK / "alan" / alan, gecici / "alan" / alan)
f1, t1 = gecici / "alan/felsefe/asama-1.json", gecici / "alan/tarih/asama-1.json"
# checkout satır sonu makineye göre değişir (Windows autocrlf CRLF, Linux LF): iki biçimi de kopyada kendimiz kurarız
for p, nl in ((f1, "\n"), (t1, "\r\n")):
    p.write_bytes(oku(p).replace("\r\n", "\n").replace("\n", nl).encode("utf-8"))
v1 = json.loads(oku(f1))
u1 = v1["uniteler"][0]
d1 = u1["dersler"][0]
a1 = d1["alistirmalar"][0]
k1 = u1["kapi"]["sorular"][0]
tv = json.loads(oku(t1))
td = tv["uniteler"][0]["dersler"][0]
ISTEK = {f"felsefe/1/{d1['id']}": G, f"felsefe/1/{a1['id']}": G, f"felsefe/1/{k1['id']}": G, f"tarih/1/{td['id']}": G}
girdi = gecici / "lifeos-onay.json"
girdi.write_text(json.dumps(ISTEK), encoding="utf-8")
ILK = {p: oku(p) for p in (f1, t1)}


def kos(*arg):
    cikti = io.StringIO()
    with contextlib.redirect_stdout(cikti):
        kod = O.main([str(girdi), "--kok", str(gecici), *arg])
    return kod, cikti.getvalue()


def kuru():
    kod, c = kos()
    assert kod == 0, c
    assert "alan/felsefe/asama-1.json: 3 öğe yazılacak" in c and "alan/tarih/asama-1.json: 1 öğe yazılacak" in c and "kuru koşu" in c, c
    assert all(oku(p) == ILK[p] for p in ILK), "kuru koşu dosyaya yazdı"


def yaz():
    kod, c = kos("--yaz")
    assert kod == 0, c
    v = json.loads(oku(f1))
    d = v["uniteler"][0]["dersler"][0]
    assert [d["durum"], d["onaylayan"], d["onayTarihi"]] == ["onayli", "sahip", "2026-11-14"], d
    assert d["alistirmalar"][0]["durum"] == "onayli" and v["uniteler"][0]["kapi"]["sorular"][0]["onaylayan"] == "sahip"
    assert v["uniteler"][0]["dersler"][1]["durum"] == "taslak" and d["alistirmalar"][1]["durum"] == "taslak", "istenmeyen öğe onaylandı"
    td2 = json.loads(oku(t1))["uniteler"][0]["dersler"][0]
    assert td2["durum"] == "onayli" and td2["onayTarihi"] == "2026-11-14"


def bicim():
    # yalnız eklenen üç değer farklı: değişiklikler geri çıkarılınca ilk metin aynen döner
    for p, nl in ((f1, "\n"), (t1, "\r\n")):
        yeni, ilk = oku(p), ILK[p]
        geri = yeni.replace('"durum": "onayli"', '"durum": "taslak"')
        for ek in (',' + nl + '          "onaylayan": "sahip",' + nl + '          "onayTarihi": "2026-11-14"',
                   ', "onaylayan": "sahip", "onayTarihi": "2026-11-14"'):
            geri = geri.replace(ek, "")
        assert geri == ilk, p.name + " biçimi değişti"
        # çok satırlı ders iki satır kazanır (dosyanın satır sonuyla); tek satırlık alıştırma ve kapı sorusu satır kazanmaz
        assert yeni.count("\n") - ilk.count("\n") == 2, p.name + " satır sayısı"
        assert yeni.count("\r\n") - ilk.count("\r\n") == (2 if nl == "\r\n" else 0), p.name + " satır sonu"


def denetci():
    for alan in ("felsefe", "tarih"):
        hatalar, _ = denetle.denetle_klasor(str(gecici / "alan" / alan))
        assert not hatalar, hatalar[:3]


def ikinci():
    once = {p: oku(p) for p in ILK}
    kod, c = kos("--yaz")
    assert kod == 0 and "0 öğe yazıldı, 3 zaten onaylı" in c, c
    assert all(oku(p) == once[p] for p in once), "ikinci koşu dosyayı değiştirdi"


def bilinmeyen():
    kotu = dict(ISTEK)
    kotu.update({"felsefe/1/felsefe.1.1.1.a": G, "felsefe/1/" + u1["id"]: G, "felsefe/1/k1": G, "felsefe/9/x": G, "Felsefe/1/x": G,
                 f"felsefe/1/{v1['uniteler'][0]['dersler'][1]['id']}": {"durum": "taslak", "onaylayan": "sahip", "onayTarihi": "2026-11-14"}})
    girdi.write_text(json.dumps(kotu), encoding="utf-8")
    once = {p: oku(p) for p in ILK}
    kod, c = kos("--yaz")
    girdi.write_text(json.dumps(ISTEK), encoding="utf-8")
    assert kod == 1, c
    for parca in ("bilinmeyen kimlik: felsefe/1/felsefe.1.1.1.a", "onaylanan öğe değil (durum alanı yok): felsefe/1/" + u1["id"],
                  "onaylanan öğe değil (durum alanı yok): felsefe/1/k1", "alan/felsefe/asama-9.json: dosya yok", "geçersiz anahtar: Felsefe/1/x",
                  "geçersiz onay kaydı: felsefe/1/"):
        assert parca in c, parca + "\n" + c
    assert all(oku(p) == once[p] for p in once), "bilinmeyen anahtar dosyayı değiştirdi"


def bozuk_girdi():
    girdi.write_text("[1, 2]", encoding="utf-8")
    kod, c = kos()
    girdi.write_text(json.dumps(ISTEK), encoding="utf-8")
    assert kod == 2 and "girdi okunamadı" in c, c


def tek_satir_nesne():
    # tek satırlık nesnede (kapı sorusu) ekleme aynı satırda; varolan onaylayan değeri üzerine yazılır, yenisi eklenmez
    m = '{"a": [{ "id": "x", "durum": "taslak", "onaylayan": "eski" }, { "id": "x2", "durum": "taslak" }]}'
    yeni, s = O.dosya_duzelt(m, {"x": G, "x2": G})
    assert s == {"x": "yazildi", "x2": "yazildi"}, s
    assert yeni == ('{"a": [{ "id": "x", "durum": "onayli", "onaylayan": "sahip", "onayTarihi": "2026-11-14" }, '
                    '{ "id": "x2", "durum": "onayli", "onaylayan": "sahip", "onayTarihi": "2026-11-14" }]}'), yeni


try:
    t("kuru koşu: ne yazılacağını söyler, hiçbir dosyayı değiştirmez", kuru)
    t("--yaz: ders, alıştırma, kapı sorusu (LF ve CRLF dosya) onaylı olur; ötekiler taslak", yaz)
    t("biçim: yalnız üç değer değişir; girinti ve satır sonu dosyanınki", bicim)
    t("denetçi (alan/denetle.py): yazılan dosyalar şemaya uygun", denetci)
    t("ikinci koşu: zaten onaylı, dosya aynı kalır", ikinci)
    t("bilinmeyen, önekli, durumsuz, dosyasız, geçersiz anahtar raporlanır, tahmin edilmez (çıkış 1)", bilinmeyen)
    t("dizi girdi reddedilir (çıkış 2)", bozuk_girdi)
    t("tek satırlık nesne: ekleme aynı satırda, var olan değer güncellenir", tek_satir_nesne)
finally:
    shutil.rmtree(gecici, ignore_errors=True)
print(f"{gecen} geçti, {kalan} kaldı")
sys.exit(1 if kalan else 0)
