"""python kalite/olcum_test.py — ölçüm motorunun küçük testi (geçici klasörde sahte depo). Çıkış 0/1."""
import json
import os
import re
import shutil
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

# --- kullanım sayacı: veri yokken değersiz; veriyle son 28 gün, en yeni güne göre ---
kontrol("kullanım: dosya yokken «veri yok», ölçülmedi, komutlu",
        o["kullanim"]["deger"] is None and o["kullanim"]["etiket"] == "veri yok" and o["kullanim"]["komut"], o["kullanim"])
with tempfile.TemporaryDirectory() as d:
    kok = sahte_depo(d, {olcum.KULLANIM: json.dumps({"surum": 1, "gunler": {
        "2026-03-01": {"ekran/felsefe": 2, "arac/not": 1, "ekran/Kötü Ad": 5, "ekran/x": -3},
        "2026-02-02": {"ekran/felsefe": 1},   # pencere başı (28. gün): sayılır
        "2026-02-01": {"ekran/uyku": 9}}}),    # pencere dışı
        "kabuk/harita.js": "var YERLER = [\n { id: 'felsefe' },\n { id: 'uyku' },\n { id: 'not' }];\n"})
    k = olcum.olc(kok)["kullanim"]
    kontrol("kullanım: pencere içi geçerli anahtarlar toplanır, bozuk anahtar ve eksi sayı atlanır",
            k["deger"] == 4 and k["etiket"] == "ölçüldü" and k["ayrinti"]["sayim"] == {"ekran/felsefe": 3, "arac/not": 1}
            and k["ayrinti"]["bas"] == "2026-02-02", k)
    kontrol("kullanım: haritada olup hiç açılmayan yer listelenir", k["ayrinti"]["hic_acilmayan_yer"] == ["uyku"], k)
    (kok / olcum.KULLANIM).write_text("{bozuk", encoding="utf-8")
    kontrol("kullanım: bozuk dosya «veri yok»", olcum.olc(kok)["kullanim"]["deger"] is None)

# --- eğri dosyaları: keşif, sözleşme, vekil ---
ESKI_KIMLIK = {"egri_" + a for a in ("tanima", "ogretme", "anlama", "uretim", "arama", "kontrol", "kendini_egitme",
                                     "tekrar", "saglayici", "hafiza", "optimizasyon", "anlasilabilirlik", "hayata_etki")}
kontrol("keşif: kalite/egri/ on üç dosya, kimlikler eski kayıtla aynı", set(x["id"] for x in egri) == ESKI_KIMLIK,
        sorted(x["id"] for x in egri))

EGRI_ORNEK = {
    "deneme.py": 'AD = "Deneme"\nTANIM = "t"\ndef olc(kok):\n    return {"deger": 7, "birim": "adet", "etiket": "ölçüldü", '
                 '"durum": "ölçüldü", "ayrinti": {}, "komut": "k"}\n',
    "_yardimci.py": "X = 1\n",  # alt çizgili: eğri değil
    "bozuk.py": 'AD = "Bozuk"\nTANIM = "t"\ndef olc(kok):\n    raise RuntimeError("kırık")\n',
    "yalanci_bos.py": 'AD = "Y"\nTANIM = "t"\ndef olc(kok):\n    return {"deger": None, "etiket": "ölçüldü", "durum": "ölçüldü", '
                      '"ayrinti": {}, "komut": "k"}\n',
    "yalanci_sayi.py": 'AD = "Y"\nTANIM = "t"\ndef olc(kok):\n    return {"deger": 5, "etiket": "veri yok", "durum": "ölçüldü", '
                       '"ayrinti": {}, "komut": "k"}\n',
}
with tempfile.TemporaryDirectory() as d:
    for ad, metin in EGRI_ORNEK.items():
        (Path(d) / ad).write_text(metin, encoding="utf-8")
    asil, olcum.EGRI_DIZIN = olcum.EGRI_DIZIN, Path(d)
    try:
        e = {x["id"]: x for x in olcum.egriler(Path(d))}
    finally:
        olcum.EGRI_DIZIN = asil
    kontrol("keşif: yeni dosya eğri olur, alt çizgili dosya olmaz",
            set(e) == {"egri_deneme", "egri_bozuk", "egri_yalanci_bos", "egri_yalanci_sayi"}, sorted(e))
    kontrol("keşif: eğrinin değeri, birimi ve etiketi kayda geçer", e["egri_deneme"]["deger"] == 7
            and e["egri_deneme"]["birim"] == "adet" and e["egri_deneme"]["durum"] == "ölçüldü", e["egri_deneme"])
    kontrol("bozuk ya da sözleşmeyi bozan eğri sayı almaz: değersiz, ölçülmedi, hatası yazılı",
            all(e[k]["deger"] is None and e[k]["durum"] == "ölçülmedi" and e[k]["etiket"] == "veri yok"
                and "hata" in e[k]["ayrinti"] for k in ("egri_bozuk", "egri_yalanci_bos", "egri_yalanci_sayi")),
            {k: (e[k]["deger"], e[k]["ayrinti"]) for k in e})

SINAV_EK = {
    "tools/king_sinav.json": json.dumps({"cumleler": [
        {"m": "ays", "c": "40 soru çözdüm", "b": ["veri"]},
        {"m": "ays", "c": "deneme sayfasını aç", "b": ["git:ays:exams"]},
        {"m": "spi", "c": "stoacılık nedir", "b": ["merkez"]},
        {"m": "esp", "c": "iki niyetli", "b": ["merkez", "veri"]}]}, ensure_ascii=False),
    "kalite/veri/sinav-sonuc.json": json.dumps({"tarih": "2026-01-01", "kod": "abc", "satirlar": [
        {"m": "ays", "c": "40 soru çözdüm", "karar": "veri", "ok": True},
        {"m": "ays", "c": "deneme sayfasını aç", "karar": "arac:ays_denemeler", "ok": False},  # niyet doğru, araç yanlış
        {"m": "spi", "c": "stoacılık nedir", "karar": "tur:yok", "ok": False},
        {"m": "esp", "c": "iki niyetli", "karar": "veri", "ok": True}]}, ensure_ascii=False),
    "kalite/veri/yerel/anlama.jsonl": '{"metin": "yürüdüm", "niyet": "kayit", "kaynak": "ornek"}\n{"metin": "", "niyet": "uydurma"}\n',
    "AYS/dist/rota.html": "a\nb\n",
    "AYS/dist/fonts/f.woff2": "xxxxxxxx",
    "kabuk/index.html": '<link href="kabuk.css"><script src="../motor/m.js"></script>\n',
    "kabuk/kabuk.css": "c\n",
    "motor/m.js": "m\n",
}
with tempfile.TemporaryDirectory() as d:
    kok = sahte_depo(d, SINAV_EK)
    o = olcum.olc(kok)
    an, ko = o["egri_anlama"], o["egri_kontrol"]
    va, vk = an["ayrinti"].get("vekil", {}), ko["ayrinti"].get("vekil", {})
    kontrol("vekil eğrinin değeri olmaz: Anlama ve Kontrol değersiz, ölçülmedi",
            an["deger"] is None and ko["deger"] is None and an["durum"] == ko["durum"] == "ölçülmedi", (an, ko))
    kontrol("vekil etiketli: «tahmin», adı «vekil: …», ölçüm günü ve kodu yazılı",
            all(v.get("etiket") == "tahmin" and v.get("ad", "").startswith("vekil:") and v.get("olculdu") == "2026-01-01"
                and v.get("kod") == "abc" for v in (va, vk)), (va, vk))
    kontrol("Anlama vekili niyet düzeyinde sayar: 3 cümlenin 2'si, iki niyetli cümle dışarıda",
            va.get("deger") == 0.667 and va.get("cumle") == 3 and va.get("disarida") == 1, va)
    kontrol("Kontrol vekili yalnız görev cümlelerinde tam kararı sayar: 2'de 1", vk.get("deger") == 0.5
            and vk.get("gorev_cumlesi") == 2, vk)
    kontrol("etiketli set: geçerli satır sayılır, bozuk satır ayrılır, King kararı yoksa değer yok",
            an["ayrinti"]["etiketli"] == 1 and an["ayrinti"]["gecersiz_satir"] == 1, an["ayrinti"])
    kontrol("--md vekili «eğri değil» diye yazar, tabloya koymaz",
            "(tahmin, eğri değil)" in olcum.md(o, {}) and "| Anlama |" not in olcum.md(o, {}))
    op = o["egri_optimizasyon"]
    kontrol("Optimizasyon: dist kodu + kabuk index.html'in bağladıkları (motor dahil); yazı tipi sayılmaz",
            op["deger"] == sum((kok / p).stat().st_size for p in ("AYS/dist/rota.html", "kabuk/index.html",
                                                                   "kabuk/kabuk.css", "motor/m.js"))
            and op["ayrinti"]["motor_kabukta"]["bayt"] == (kok / "motor/m.js").stat().st_size
            and op["ayrinti"]["acilis"]["etiket"] == "veri yok", op)
    hz = olcum.olc(kok)
    kontrol("hız: kabuk açılış yükü Optimizasyon'un kabuk sayımıyla aynı; alan paketi yokken değersiz",
            hz["kabuk_acilis_yuku"]["deger"] == op["ayrinti"]["uygulama"]["kabuk"]["bayt"]
            and hz["alan_paketi_en_buyuk"]["deger"] is None, (hz["kabuk_acilis_yuku"], hz["alan_paketi_en_buyuk"]))
    for ad, metin in (("alan/a/asama-1.json", "{}"), ("alan/b/asama-2.json", '{"x": 1}')):
        (kok / ad).parent.mkdir(parents=True, exist_ok=True)
        (kok / ad).write_text(metin, encoding="utf-8")
    ap = olcum.olc(kok)["alan_paketi_en_buyuk"]
    kontrol("hız: en büyük alan paketi dosyasıyla", ap["deger"] == 8 and ap["ayrinti"]["dosya"] == "alan/b/asama-2.json", ap)
    (kok / "kalite/veri/yerel/anlama.jsonl").write_text(
        '{"metin": "a", "niyet": "kayit", "kaynak": "ornek", "king": "kayit"}\n'
        '{"metin": "b", "niyet": "sohbet", "kaynak": "ornek", "king": "yonet"}\n', encoding="utf-8")
    an = olcum.olc(kok)["egri_anlama"]
    kontrol("etiketli sette King kararı varsa gerçek eğri ölçülür, vekil yine ayrıdır",
            an["deger"] == 0.5 and an["etiket"] == "ölçüldü" and an["ayrinti"]["vekil"]["deger"] == 0.667, an)

if shutil.which("node"):
    with tempfile.TemporaryDirectory() as d:
        kok = sahte_depo(d, {"kabuk/harita.js": "module.exports={YERLER:[{id:'a',durum:'yeni'},{id:'b',durum:'eski',"
                                                "eski:'../AYS/dist/rota.html'},{id:'c',durum:'plan'}],"
                                                "halkaAdimi:i=>({a:1,b:2,c:Infinity})[i]};\n"})
        an = olcum.olc(kok)["egri_anlasilabilirlik"]
        # sahte AYS'de iç içe kat: TABS ve SayfaBolumleri → 1
        kontrol("Anlaşılabilirlik: kabuk adımı + eski modülün katı; halkadan ulaşılmayan ayrı",
                an["ayrinti"].get("yer_adimi") == {"a": 1, "b": 3} and an["deger"] == 2.0
                and an["ayrinti"]["ulasilmayan"] == ["c"] and an["etiket"] == "hesaplandı", an)

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
T = {"h": {"taban": 1, "tavan": 10, "yon": "tavan"}}
s, _ = olcum.denetle(ol(h=10), T, {"h": {"deger": 2}})
kontrol("hız tavanı: tavana eşit geçer (kayıttaki artış önemsiz)", s == [], s)
s, _ = olcum.denetle(ol(h=11), T, {})
kontrol("hız tavanı: aşan değer AŞIM satırı verir", len(s) == 1 and s[0].startswith("AŞIM: h 11 > tavan 10"), s)
s, n = olcum.denetle(ol(), T, {})
kontrol("hız tavanı: ölçülemezse uyarı, aşım değil", s == [] and any("UYARI: h" in x for x in n), (s, n))

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
