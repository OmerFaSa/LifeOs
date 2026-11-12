"""python kalite/olcum_test.py — ölçüm motorunun küçük testi (geçici klasörde sahte depo). Çıkış 0/1."""
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

BURASI = Path(__file__).resolve().parent
sys.path.insert(0, str(BURASI))
import olcum  # noqa: E402

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SAHTE = {
    "AYS/src/index.html": "<html></html>",
    "SPI/web/index.html": "<html></html>",
    "sistem/sunucu.py": 'SISTEMLER = [\n    ("AYS", "AYS", 4181, "x"),\n    ("SPI", "SPI", 4182, "y"),\n]\nGIRIS_PORT = 4180\nHKM_PORT = 4190\n',
    "sistem/telefon.py": 'PORTLAR = {"AYS": 5181, "SPI": 5182}\nKURULUM_PORT = 5180\n',
    "tools/ortak.py": 'DOSYALAR = ["a.js", "b.css"]\nSISTEMLER = ["AYS", "SPI", "ESP"]\n',
    "tools/seviye.py": 'DOSYALAR = ["s.js"]\n',
    "brand/ortak/a.js": "// a\n",
    "brand/ortak/c.js": "var x = 'computed';\n",
    "brand/ortak/king.js": "const NIYET = [\n  { re: /a/, git: 'x' },\n  { re: /b/, git: 'y' },\n];\n",
    "brand/ortak/notum.js": "// not\n",
    "brand/ortak/tests/t.js": "var y = 'derived';\n",
    # P.sayfa: 2 ekranda + 1 core'da (sayılmaz) + 1 brand/ortak testinde (taban yöntemi sayar)
    "AYS/src/js/screens/bir.js": "P.sayfa({});\nPARCA.sayfa({});\nP.blok({});\nconst TABS = ['a', 'b', { c: 1 }];\n",
    "AYS/src/js/screens/iki.js": "SayfaBolumleri({ bolumler: [{ id: 'x' }, { id: 'y' }] });\n",
    "AYS/src/js/core/cekirdek.js": "P.sayfa({});\n",
    "brand/ortak/tests/p.js": "P.sayfa({});\n",
    "HKM/core/db.py": 'A = "CREATE TABLE a (x)"\nB = "CREATE TABLE b (x)"\n# CREATE TABLE eski (x)\n',
    "HKM/core/__init__.py": "",
    "HKM/daemon.py": "R = ['/api/a', \"/api/a\", '/api/b?q=1']\n",
}

hatali = toplam = 0


def kontrol(ad, tamam, ayrinti=""):
    global hatali, toplam
    toplam += 1
    hatali += not tamam
    print(("✓ " if tamam else "✕ ") + ad + ("" if tamam else f" — {ayrinti}"))


def sahte_depo(d, ek=None):
    for yol, metin in {**SAHTE, **(ek or {})}.items():
        p = Path(d) / yol
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(metin, encoding="utf-8")
    return Path(d)


def cli(*arg):
    r = subprocess.run([sys.executable, str(BURASI / "olcum.py"), *arg], capture_output=True)
    return r.returncode, r.stdout.decode("utf-8", "replace")


with tempfile.TemporaryDirectory() as d:
    kok = sahte_depo(d)
    o = olcum.olc(kok)
    d_ = {k: v["deger"] for k, v in o.items()}

    # --- sayım kuralları ---
    kontrol("uygulama: */src/index.html + */web/index.html", d_["uygulama"] == 2, d_["uygulama"])
    kontrol("yerel kapı: SISTEMLER portları + GIRIS_PORT + HKM_PORT", d_["kapi_yerel"] == 4, d_["kapi_yerel"])
    kontrol("ev ağı kapısı: PORTLAR + KURULUM_PORT", d_["kapi_ev_agi"] == 3, d_["kapi_ev_agi"])
    kontrol("kopya: ortak DOSYALAR ∪ brand/ortak *.js/.css + seviye", d_["kopya_dosya"] == 6
            and o["kopya_dosya"]["ayrinti"]["diskteki_kopya"] == 18, o["kopya_dosya"])
    kontrol("sayfa: core hariç, brand/ortak testleri dahil (taban yöntemi)", d_["sayfa"] == 3, o["sayfa"]["ayrinti"])
    kontrol("blok: P.blok( sayımı", d_["blok"] == 1, d_["blok"])
    kontrol("ekran içi sekme: TABS öğeleri + SayfaBolumleri bolumler öğeleri", d_["ekran_ici_sekme"] == 5,
            d_["ekran_ici_sekme"])
    kontrol("ekran dosyası: screens/*.js", d_["ekran_dosyasi"] == 2, d_["ekran_dosyasi"])
    kontrol("NIYET kuralı: dizinin üst düzey öğesi", d_["king_niyet_kurali"] == 2, d_["king_niyet_kurali"])
    kontrol("HKM tablo: yorum satırı sayılmaz", d_["hkm_tablo"] == 2, d_["hkm_tablo"])
    kontrol("HKM /api/: benzersiz, sorgu dizgesi ayrılır", d_["hkm_api"] == 2, d_["hkm_api"])
    kontrol("HKM çekirdek: core/*.py (__init__ dahil)", d_["hkm_cekirdek"] == 2, d_["hkm_cekirdek"])
    kontrol("kesinlik dili: testteki 'derived' sayılmaz", d_["kesinlik_dili"] == 1, d_["kesinlik_dili"])
    kontrol("not yapısı: imzası olan dosya sayılır", d_["not_yapisi"] == 1, o["not_yapisi"]["ayrinti"])
    kontrol("her değer bir kesinlik etiketi taşır",
            all(v["etiket"] in olcum.ETIKETLER for v in o.values()))

    # --- ölçülmeyen eğri sayı taşımaz ---
    egri = [v for v in o.values() if v["katman"] == "egri"]
    kontrol("13 eğri ölçülmedi, değersiz, komutlu, «veri yok»", len(egri) == 13 and all(
        v["durum"] == "ölçülmedi" and v["deger"] is None and v["komut"] and v["etiket"] == "veri yok" for v in egri))
    kontrol("ölçülmedi durumundaki hiçbir ölçüt sayı taşımaz",
            all(v["deger"] is None for v in o.values() if v["durum"] == "ölçülmedi"))
    kontrol("--md tablosunda eğri satırı yok", not any(f"| {v['ad']} |" in olcum.md(o, {}) for v in egri))

    # --- belirlenimcilik, mutlak yol yok ---
    m1, m2 = olcum.kayit_metni(olcum.olc(kok), "2026-01-01"), olcum.kayit_metni(olcum.olc(kok), "2026-01-01")
    kontrol("iki koşu bayt bayt aynı kayıt metni", m1 == m2)
    mutlak = [s for s in (str(kok), str(kok).replace("\\", "/"), str(kok).replace("\\", "\\\\")) if s in m1]
    kontrol("kayıtta mutlak yol yok", not mutlak and not re.search(r'"[A-Za-z]:[\\/]', m1), mutlak)

# --- bütçe denetimi (bellekte) ---
B = {"a": {"taban": 5, "yon": "azalmali", "grup": "g"}, "b": {"taban": 5, "yon": "azalmali", "grup": "g"},
     "c": {"taban": 3, "yon": "artmamali"}, "z": {"taban": 9, "yon": "izlenir"}}


def ol(**deger):
    return {k: {"ad": k, "deger": v} for k, v in deger.items()}


s, _ = olcum.denetle(ol(a=5, b=5, c=4, z=99), B, {})
kontrol("artış aşımdır (tabana karşı)", len(s) == 1 and s[0].startswith("AŞIM: c 3 → 4"), s)
s, _ = olcum.denetle(ol(a=4, b=5, c=2, z=99), B, {})
kontrol("düşüş geçer; «izlenir» denetlenmez", s == [], s)
s, n = olcum.denetle(ol(a=6, b=4, c=3), B, {})
kontrol("kural 5: grupta biri çıkınca artış takastır", s == [] and any(x.startswith("TAKAS") for x in n), (s, n))
s, _ = olcum.denetle(ol(a=6, b=5, c=3), B, {})
kontrol("kural 5: grup toplamı artarsa aşım", len(s) == 1 and "a 5 → 6" in s[0], s)
s, _ = olcum.denetle(ol(a=5, b=5, c=3), B, {"c": {"deger": 2}}, "2026-01-01")
kontrol("başvuru son kayıttır (taban değil)", len(s) == 1 and "c 2 → 3 (son kayıt 2026-01-01)" in s[0], s)
s, n = olcum.denetle({"a": {"ad": "a", "deger": None}, **ol(b=5, c=3)}, B, {})
kontrol("ölçülemeyen bütçe aşım sayılmaz, uyarı verir", s == [] and any("UYARI: a" in x for x in n), (s, n))

# --- komut satırı: --kaydet, --denetle çıkış kodları ---
with tempfile.TemporaryDirectory() as d:
    kok = sahte_depo(Path(d) / "depo")
    kal = Path(d) / "kalite"
    kal.mkdir()
    (kal / "butce.json").write_text(json.dumps({"olcutler": {"uygulama": {"taban": 2, "yon": "azalmali"}}}),
                                    encoding="utf-8")
    r1, _ = cli("--kok", str(kok), "--kalite", str(kal), "--denetle")
    kontrol("--denetle kayıtsız, tabana eşit: çıkış 0", r1 == 0, r1)
    r2, _ = cli("--kok", str(kok), "--kalite", str(kal), "--kaydet")
    kayitlar = list((kal / "kayit").glob("*.json"))
    kontrol("--kaydet kalite/kayit/<tarih>.json yazar", r2 == 0 and len(kayitlar) == 1
            and re.fullmatch(r"\d{4}-\d\d-\d\d\.json", kayitlar[0].name), kayitlar)
    r3, _ = cli("--kok", str(kok), "--kalite", str(kal), "--denetle")
    kontrol("--denetle taze kayda karşı: çıkış 0", r3 == 0, r3)
    (kok / "ESP/src/index.html").parent.mkdir(parents=True)
    (kok / "ESP/src/index.html").write_text("x", encoding="utf-8")
    r4, cikti = cli("--kok", str(kok), "--kalite", str(kal), "--denetle")
    kontrol("yeni uygulama eklenince --denetle çıkış 1 ve Türkçe AŞIM satırı",
            r4 == 1 and "AŞIM: Uygulama 2 → 3" in cikti, (r4, cikti))

print(f"{toplam - hatali}/{toplam} test geçti")
sys.exit(1 if hatali else 0)
