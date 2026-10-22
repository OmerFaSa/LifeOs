#!/usr/bin/env python3
"""Uzun sureli, kaldigi yerden devam eden veri toplama kosusu. Yalniz standart kutuphane.

    python tools/veri_gece.py                 # hepsi: yapisal + vikipedi + sayfalar
    python tools/veri_gece.py yapisal         # model yok: USDA besin tablosu, kelime siklik listeleri
    python tools/veri_gece.py vikipedi        # KONULAR.json -> Vikipedi metni -> model -> alintili olgular
    python tools/veri_gece.py sayfalar        # KONULAR.json 'sayfalar' (WHO vb.) -> model
    python tools/veri_gece.py vikipedi --model gemma3:4b --sinir 5   # deneme: 5 baslik

DOKTRIN: model hicbir bilgiyi kendi bilgisinden yazmaz. Her olgu kaynak metinden BIREBIR
bir alinti tasir; alinti kaynakta yoksa ya da olgudaki bir sayi alintida gecmiyorsa kayit
reddedilir. Kosu kesilirse veri/gunluk/tamamlanan.txt sayesinde kaldigi yerden surer.
"""
import csv, io, json, re, subprocess, sys, time, urllib.parse, urllib.request, zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import veri_cikar as vc
from veri_topla import html_metin, indir

KOK = vc.KOK
TEMIZ, HAM = vc.TEMIZ, vc.HAM
GUNLUK = KOK / "veri" / "gunluk"
TAMAM = GUNLUK / "tamamlanan.txt"
UA = {"User-Agent": "LifeOS-veri/1.0 (kisisel arastirma, dusuk hiz)"}
KESIT = re.compile(r"^==+\s*(Kaynakça|Dış bağlantılar|Notlar|Ayrıca bakınız|Dipnotlar|Konuyla ilgili yayınlar|"
                   r"References|External links|Notes|See also|Further reading|Bibliography|Sources)\s*==+\s*$", re.M | re.I)
MAKS_PARCA = 8
NL = chr(10)

OLGU_SEMA = {"type": "object", "required": ["olgular"], "properties": {"olgular": {"type": "array", "items": {
    "type": "object", "required": ["baslik", "olgu", "alinti"],
    "properties": {"baslik": {"type": "string"}, "olgu": {"type": "string"}, "alinti": {"type": "string"}}}}}}


def istem_olustur(yonerge):
    return (
        "Sen bir veri cikarma aracisin. Sana bir kaynak metin parcasi verilecek." + NL +
        "GOREV: " + yonerge + NL +
        "KURALLAR:" + NL +
        "- Metinde ACIKCA yazan bilgileri cikar. Kendi bilgini ekleme, tahmin yurutme, sayi uydurma." + NL +
        "- 'olgu' alanini kisa, dogru, duz TURKCE bir cumleyle yaz. 'baslik' 2-6 kelimelik konu etiketi." + NL +
        "- 'alinti' alanina metinden AYNEN kopyalanmis (kaynak dilinde), en az 25 karakterlik bir cumle yaz." + NL +
        "- Olgudaki her sayi ve yil alintida da gecmeli." + NL +
        "- Metinde faydali bilgi yoksa {\"olgular\": []} dondur. En fazla 8 olgu." + NL +
        "Yalnizca JSON dondur.")


def sayilar(s):
    return set(re.findall(r"\d+", s))


def olgu_gecerli(o, parca):
    if not all(isinstance(o.get(a), str) and o.get(a).strip() for a in ("baslik", "olgu", "alinti")):
        return "sema"
    if not vc.alinti_dogru(o["alinti"], parca):
        return "alinti-kaynakta-yok"
    if not sayilar(o["olgu"]) <= sayilar(o["alinti"]):
        return "sayi-alintida-yok"
    return None


DESTEK_SEMA = {"type": "object", "required": ["destekliyor"], "properties": {"destekliyor": {"type": "boolean"}}}
DESTEK_ISTEM = ("Sana bir ALINTI ve bir IDDIA verilecek. IDDIA, ALINTIDA yazan bilgiden dogrudan cikiyorsa destekliyor=true. "
                "IDDIA alintida olmayan bir sey ekliyor, degistiriyor ya da abartiyorsa destekliyor=false. Yalnizca JSON dondur.")


def destek_var(model, alinti, olgu):
    try:
        r = vc.model_cagir(model, "ALINTI: " + alinti + NL + "IDDIA: " + olgu, istem=DESTEK_ISTEM, sema=DESTEK_SEMA, deneme=2)
    except Exception:
        return None
    return r.get("destekliyor") is True if isinstance(r, dict) else None


def olgular(metin, model, yonerge, log):
    """(kabul, red, basarili_parca). Tum parcalar model hatasina dustuyse basarili_parca=0."""
    kabul, red, basarili = [], [], 0
    istem = istem_olustur(yonerge)
    for i, parca in enumerate(vc.parcala(metin)[:MAKS_PARCA]):
        if len(parca.strip()) < 200:
            basarili += 1
            continue
        try:
            sonuc = vc.model_cagir(model, "METIN:" + NL + parca, istem=istem, sema=OLGU_SEMA)
        except Exception as e:
            log("  model hatasi parca", i, str(e)[:80])
            continue
        basarili += 1
        liste = sonuc.get("olgular", []) if isinstance(sonuc, dict) else []
        for o in liste if isinstance(liste, list) else []:
            if not isinstance(o, dict):
                continue
            neden = olgu_gecerli(o, parca)
            if not neden:
                d = destek_var(model, o["alinti"], o["olgu"])
                neden = None if d else ("destek-belirsiz" if d is None else "alinti-olguyu-desteklemiyor")
            (red if neden else kabul).append((i, o, neden))
    return kabul, red, basarili


def ekle(yol, satirlar):
    yol.parent.mkdir(parents=True, exist_ok=True)
    with yol.open("a", encoding="utf-8") as f:
        for s in satirlar:
            f.write(json.dumps(s, ensure_ascii=False) + NL)


def tamamlananlar():
    return set(TAMAM.read_text(encoding="utf-8").split(NL)) if TAMAM.exists() else set()


def tamamla(anahtar):
    GUNLUK.mkdir(parents=True, exist_ok=True)
    with TAMAM.open("a", encoding="utf-8") as f:
        f.write(anahtar + NL)


def uyanik_tut():
    """Bu surec calisirken Windows uykuya gecmesin (sistem ayari degistirilmez, surecle biter)."""
    try:
        import ctypes
        ctypes.windll.kernel32.SetThreadExecutionState(0x80000000 | 0x00000001)
    except Exception:
        pass


def ollama_ayaga_kaldir(log):
    try:
        urllib.request.urlopen("http://127.0.0.1:11434/api/tags", timeout=5).read()
        return True
    except Exception:
        pass
    log("Ollama yanit vermiyor, baslatiliyor...")
    try:
        subprocess.Popen(["ollama", "serve"], creationflags=0x08000000,
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception as e:
        log("ollama baslatilamadi:", e)
        return False
    time.sleep(15)
    try:
        urllib.request.urlopen("http://127.0.0.1:11434/api/tags", timeout=5).read()
        return True
    except Exception:
        return False


# ---------------------------------------------------------------- vikipedi
def vikipedi_getir(baslik):
    """(dil, gercek_baslik, metin, revid, url) ya da None. Once tr, yoksa en; 'en:' onekli dogrudan en."""
    adaylar = [("en", baslik[3:])] if baslik.startswith("en:") else [("tr", baslik), ("en", baslik)]
    for dil, b in adaylar:
        q = urllib.parse.urlencode({"action": "query", "prop": "extracts|info", "explaintext": 1, "exsectionformat": "wiki",
                                    "redirects": 1, "inprop": "url", "format": "json", "titles": b})
        r = urllib.request.Request("https://%s.wikipedia.org/w/api.php?%s" % (dil, q), headers=UA)
        try:
            with urllib.request.urlopen(r, timeout=60) as f:
                veri = json.loads(f.read())
        except Exception:
            continue
        for sayfa in veri.get("query", {}).get("pages", {}).values():
            if "missing" in sayfa or not sayfa.get("extract"):
                continue
            metin = sayfa["extract"]
            m = KESIT.search(metin)
            if m:
                metin = metin[:m.start()]
            if len(metin) < 400:
                continue
            return dil, sayfa["title"], metin, sayfa.get("lastrevid"), sayfa.get("fullurl", "")
        time.sleep(1)
    return None


def yukle_manifest():
    m = json.loads((KOK / "veri" / "KONULAR.json").read_text(encoding="utf-8"))
    for ek in sorted((KOK / "veri").glob("KONULAR_*.json")):
        e = json.loads(ek.read_text(encoding="utf-8"))
        m["kategoriler"] += e.get("kategoriler", [])
        m["sayfalar"] += e.get("sayfalar", [])
    return m


def asama_vikipedi(model, sinir, log):
    manifest = yukle_manifest()
    gorulen_baslik = set()
    bitti, sayac, ardisik_hata = tamamlananlar(), 0, 0
    for kat in manifest["kategoriler"]:
        for baslik in kat["basliklar"]:
            if (kat["sistem"], baslik) in gorulen_baslik:
                continue
            gorulen_baslik.add((kat["sistem"], baslik))
            anahtar = "vikipedi|%s|%s" % (kat["sistem"], baslik)
            if anahtar in bitti:
                continue
            if sinir and sayac >= sinir:
                return
            sayac += 1
            sayfa = vikipedi_getir(baslik)
            time.sleep(1.5)
            if not sayfa:
                ekle(GUNLUK / "bulunamayan.txt", [{"sistem": kat["sistem"], "kategori": kat["kategori"], "baslik": baslik}])
                log("YOK  ", kat["kategori"], baslik)
                tamamla(anahtar)
                continue
            dil, gercek, metin, revid, url = sayfa
            t0 = time.time()
            kabul, red, basarili = olgular(metin, model, kat["yonerge"], log)
            if basarili == 0:
                ardisik_hata += 1
                log("MODEL YOK", baslik, "ardisik hata:", ardisik_hata)
                if ardisik_hata >= 3 and not ollama_ayaga_kaldir(log):
                    time.sleep(120)
                if ardisik_hata >= 15:
                    log("cok fazla ardisik hata, kosu durduruluyor (kaldigi yerden devam edilebilir)")
                    return
                continue
            ardisik_hata = 0
            sistem = kat["sistem"].lower()
            ortak = {"sistem": kat["sistem"], "kategori": kat["kategori"], "konu": gercek, "dil": dil,
                     "kaynak": url, "revid": revid, "lisans": "CC BY-SA 4.0 (Vikipedi)", "duzey": "ikincil",
                     "model": model, "alinma": time.strftime("%Y-%m-%d")}
            ekle(TEMIZ / sistem / "olgular.jsonl", [dict(ortak, baslik=o["baslik"], olgu=o["olgu"], alinti=o["alinti"],
                                                        parca=i, etiket="kaynakli-ikincil") for i, o, _ in kabul])
            ekle(TEMIZ / sistem / "reddedilen.jsonl", [dict(kaynak=url, konu=gercek, neden=n, kayit=o) for i, o, n in red])
            tamamla(anahtar)
            log("TAMAM", kat["kategori"], gercek, "kabul", len(kabul), "red", len(red), "%ds" % (time.time() - t0))


def asama_sayfalar(model, sinir, log):
    manifest = yukle_manifest()
    bitti, gorulen = tamamlananlar(), set()
    yonerge = ("Genel saglik, beslenme ve fiziksel aktivite hakkindaki resmi tespit, oneri ve sayisal esikleri cikar. "
               "Ilac, doz, tedavi ya da teshis iceren cumleleri ATLA.")
    for s in manifest["sayfalar"]:
        anahtar = "sayfa|" + s["id"]
        if anahtar in bitti or s["url"] in gorulen:
            continue
        gorulen.add(s["url"])
        try:
            metin = html_metin(indir(s["url"]).decode("utf-8", "replace"))
        except Exception as e:
            log("SAYFA HATA", s["id"], e)
            continue
        time.sleep(2)
        kabul, red, basarili = olgular(metin, model, yonerge, log)
        if basarili == 0:
            log("MODEL YOK", s["id"])
            continue
        ortak = {"sistem": s["sistem"], "kategori": s["kategori"], "konu": s["id"], "dil": "en", "kaynak": s["url"],
                 "lisans": "WHO (atif ile)", "duzey": s["duzey"], "model": model, "alinma": time.strftime("%Y-%m-%d")}
        ekle(TEMIZ / s["sistem"].lower() / "olgular.jsonl", [dict(ortak, baslik=o["baslik"], olgu=o["olgu"], alinti=o["alinti"],
                                                                   parca=i, etiket="kaynakli-birincil") for i, o, _ in kabul])
        ekle(TEMIZ / s["sistem"].lower() / "reddedilen.jsonl", [dict(kaynak=s["url"], neden=n, kayit=o) for i, o, n in red])
        tamamla(anahtar)
        log("TAMAM", s["id"], "kabul", len(kabul), "red", len(red))


# ---------------------------------------------------------------- yapisal (model yok)
USDA_ZIP = "https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip"
USDA_BESIN = {1008: "enerji_kcal", 1003: "protein_g", 1004: "yag_g", 1005: "karbonhidrat_g", 1079: "lif_g", 2000: "seker_g",
              1258: "doymus_yag_g", 1253: "kolesterol_mg", 1087: "kalsiyum_mg", 1089: "demir_mg", 1090: "magnezyum_mg",
              1092: "potasyum_mg", 1093: "sodyum_mg", 1095: "cinko_mg", 1162: "c_vitamini_mg", 1178: "b12_ug",
              1114: "d_vitamini_ug", 1106: "a_vitamini_rae_ug", 1051: "su_g"}


def asama_usda(log):
    if "usda" in tamamlananlar():
        return
    log("USDA SR Legacy indiriliyor...")
    z = zipfile.ZipFile(io.BytesIO(indir(USDA_ZIP)))
    ad = {n.split("/")[-1]: n for n in z.namelist()}

    def oku(dosya):
        return csv.DictReader(io.TextIOWrapper(z.open(ad[dosya]), encoding="utf-8-sig"))
    kategori = {r["id"]: r["description"] for r in oku("food_category.csv")}
    gida = {r["fdc_id"]: r for r in oku("food.csv")}
    deger = {}
    for r in oku("food_nutrient.csv"):
        try:
            nid = int(r["nutrient_id"])
        except ValueError:
            continue
        if nid in USDA_BESIN and r["amount"] != "":
            deger.setdefault(r["fdc_id"], {})[USDA_BESIN[nid]] = float(r["amount"])
    satir = []
    for fid, g in gida.items():
        d = deger.get(fid)
        if not d or "enerji_kcal" not in d:
            continue
        satir.append({"fdc_id": int(fid), "ad_en": g["description"], "kategori_en": kategori.get(g.get("food_category_id", ""), ""),
                      "birim": "100 g", "degerler": d, "kaynak": "USDA FoodData Central, SR Legacy (2018-04)",
                      "lisans": "CC0 / kamu malı", "duzey": "birincil", "etiket": "hesaplandı"})
    yol = TEMIZ / "spi" / "besin_usda.jsonl"
    yol.parent.mkdir(parents=True, exist_ok=True)
    yol.write_text("", encoding="utf-8")
    ekle(yol, satir)
    tamamla("usda")
    log("USDA tamam:", len(satir), "besin")


def asama_frekans(log):
    m = json.loads((KOK / "veri" / "KONULAR.json").read_text(encoding="utf-8"))["frekans"]
    bitti = tamamlananlar()
    for d in m["diller"]:
        if "frekans|" + d in bitti:
            continue
        try:
            metin = indir(m["kaynak"].replace("{d}", d)).decode("utf-8", "replace")
        except Exception as e:
            log("FREKANS YOK", d, e)
            tamamla("frekans|" + d)
            continue
        satir = []
        for sira, l in enumerate(metin.splitlines()[:m["adet"]], 1):
            p = l.split()
            if len(p) == 2 and p[1].isdigit():
                satir.append({"dil": d, "sira": sira, "kelime": p[0], "sayi": int(p[1]),
                              "kaynak": "hermitdave/FrequencyWords (OpenSubtitles 2018)", "lisans": "CC BY-SA 4.0",
                              "duzey": "ikincil", "etiket": "hesaplandı", "ceviri": None})
        ekle(TEMIZ / "esp" / "kelime_sikligi.jsonl", satir)
        tamamla("frekans|" + d)
        log("FREKANS", d, len(satir), "kelime")
        time.sleep(1)


def main():
    a = sys.argv[1:]
    model = a[a.index("--model") + 1] if "--model" in a else "gemma3:4b"
    sinir = int(a[a.index("--sinir") + 1]) if "--sinir" in a else 0
    asama = next((x for x in a if x in ("yapisal", "vikipedi", "sayfalar", "hepsi")), "hepsi")
    GUNLUK.mkdir(parents=True, exist_ok=True)
    kayit = (GUNLUK / "gece.log").open("a", encoding="utf-8")

    def log(*x):
        s = time.strftime("%H:%M:%S ") + " ".join(str(i) for i in x)
        print(s, flush=True)
        kayit.write(s + NL)
        kayit.flush()
    uyanik_tut()
    log("kosu basladi:", asama, "model:", model)
    if asama in ("yapisal", "hepsi"):
        asama_usda(log)
        asama_frekans(log)
    if asama in ("sayfalar", "hepsi"):
        ollama_ayaga_kaldir(log)
        asama_sayfalar(model, sinir, log)
    if asama in ("vikipedi", "hepsi"):
        ollama_ayaga_kaldir(log)
        asama_vikipedi(model, sinir, log)
    log("kosu bitti")


if __name__ == "__main__":
    main()
