# -*- coding: utf-8 -*-
"""SPİ bilgisi — besin degeri, market fiyati, yer listesi (Part 8c).

   SPİ «kinoanin besin degerleri», «tavuk gogsu kac lira», «Kadikoy'de spor
   salonlari» gibi bir bilgiyi ister. Is King'in teklifinden ve kullanicinin
   onayindan gecer; BAM Arastirma Burosu bilgiyi web kaynaklarindan TIPLI bir
   kayda yazar, King kaydi SPİ'ye niyet olarak birakir (`besin.add`,
   `fiyat.add`, `yer.add`). SPİ kaydi KENDI koduyla yeniden sinar, onizletir
   ve onayla yazar; HKM SPİ'ye yazmaz.

   Bes kural:

   1. SAYI KAYNAKTAN, SINAMA KODDAN. Model sayilari yalniz kaynaktan tasir ve
      her kaydin dayandigi kaynagi ve BIREBIR alintisini verir. Kod alintiyi
      kaynakta arar ve sayinin alintida gectigini denetler; gecmeyen sayi
      «kaynakli» sayilmaz.
   2. EKSIK SIFIR DEGILDIR. Bilinmeyen mikro besin, fiyat ya da adres BOS
      kalir; sifir yazilmaz. Makrolar enerjiyle tutarsizsa kayit YAZILMAZ.
   3. FIYAT VE YER MODEL BILGISINDEN YAZILMAZ. Web kapaliysa ya da kaynak
      cikmazsa is model cagirmadan biter ve bu soylenir: uydurulmus fiyat,
      olculmus fiyat gibi gosterilemez. Besin degeri web yoksa model
      bilgisinden yazilabilir ama «dogrulanmadi»dir.
   4. FIYAT VE YER TAHMINDIR VE TARIHLIDIR. Kaydin arastirma tarihi vardir;
      SPİ onu «tahmin» etiketiyle gosterir, kullanicinin fisi her zaman ezer.
   5. GIRDI KAPALIDIR: tur, ad ve (yer icin) semt/sehir. Saglik verisi bu
      ise GITMEZ."""
import hashlib
import json
import re

TURLER = ("besin", "fiyat", "yer")
TUR_AD = {"besin": "besin değerleri", "fiyat": "market fiyatı", "yer": "yer listesi"}
NIYET = {"besin": "besin.add", "fiyat": "fiyat.add", "yer": "yer.add"}
MAX_AD = 60
MAX_YER = 10
MAX_FIYAT = 8

# 100 g icin olasi araliklar. Aralik disi sayi YAZILMAZ (bilinmiyor kalir).
MAKRO = {"kcal": (0, 900), "p": (0, 100), "f": (0, 100), "c": (0, 100),
         "sat": (0, 100), "fib": (0, 100), "sugar": (0, 100)}
# Anahtarlar SPİ'nin besin tablosuyla ayni (SPI/src/js/data/nutrients.js);
# SPİ yine de kendi listesiyle yeniden suzer.
MIKRO = {"iron": (0, 100), "calcium": (0, 3000), "magnesium": (0, 1000), "zinc": (0, 100),
         "potassium": (0, 6000), "b12": (0, 100), "folate": (0, 3000), "vitc": (0, 2000),
         "vitd": (0, 100), "omega3": (0, 40), "selenium": (0, 2000), "iodine": (0, 5000),
         "sodium": (0, 40000)}
FIYAT_ARALIK = (0.5, 100000)          # TL
MIKTAR_ARALIK = (1, 100000)           # gram
PORSIYON_ARALIK = (1, 2000)           # gram
DONEMLER = ("aylık", "yıllık", "günlük", "seans", "tek giriş")


def _bosluk(s):
    return re.sub(r"\s+", " ", str(s or "")).strip()


def _kucuk(s):
    return _bosluk(s).replace("I", "ı").replace("İ", "i").lower()


def _metin(x, en_az, en_cok):
    t = _bosluk(x)
    return t if en_az <= len(t) <= en_cok else None


def _sayi(x, aralik):
    """Aralikta bir sayi ya da None. Bool sayi degildir; metin sayi degildir."""
    if isinstance(x, bool) or not isinstance(x, (int, float)):
        return None
    x = float(x)
    if x != x or not (aralik[0] <= x <= aralik[1]):
        return None
    return round(x, 3)


def _sayi_metinleri(x):
    """Bir sayinin kaynakta yazilabilecegi bicimler: 14.1 / 14,1 / 14."""
    out = set()
    for d in (0, 1, 2):
        if abs(round(x, d) - x) > 1e-9:          # yuvarlanmis bicim o sayi degildir
            continue
        t = ("%." + str(d) + "f") % x
        out.add(t)
        out.add(t.replace(".", ","))
        b = ("{:,.%df}" % d).format(x)            # binlik ayracli: 1,299.90
        out.add(b)
        out.add(b.replace(",", "_").replace(".", ",").replace("_", "."))   # 1.299,90
    return out


def sayi_alintida(x, alinti):
    """Sayi alintida geciyor mu? Rakamin bir parcasi olarak degil, kendisi."""
    if x is None:
        return False
    a = _bosluk(alinti)
    for t in _sayi_metinleri(x):
        if re.search(r"(?<![\d.,])" + re.escape(t) + r"(?![\d]|[.,]\d)", a):
            return True
    return False


# ------------------------------------------------------------ girdi

def temizle(govde):
    """Is emri govdesi: {tur, ad, semt?, sehir?}. (temiz, hatalar)."""
    if not isinstance(govde, dict):
        return None, ["bilgi bir nesne olmalı"]
    hata = []
    for k in govde:
        if k not in ("tur", "ad", "semt", "sehir"):
            hata.append("bilgi: bilinmeyen alan %s" % k)
    tur = govde.get("tur")
    if tur not in TURLER:
        hata.append("bilgi türü besin, fiyat ya da yer olmalı")
    ad = _bosluk(govde.get("ad"))
    if not (2 <= len(ad) <= MAX_AD):
        hata.append("ad 2-%d karakter olmalı" % MAX_AD)
    g = {"tur": tur, "ad": ad}
    for k in ("semt", "sehir"):
        v = _bosluk(govde.get(k)) if govde.get(k) is not None else ""
        if v and not (2 <= len(v) <= MAX_AD):
            hata.append("%s 2-%d karakter olmalı" % (k, MAX_AD))
        if v:
            g[k] = v
    if tur == "besin" and (g.get("semt") or g.get("sehir")):
        hata.append("besin değeri yere bağlı değildir; semt ve şehir verilmez")
    if tur == "yer" and not (g.get("semt") or g.get("sehir")):
        hata.append("yer listesi için semt ya da şehir gerekli")
    if hata:
        return None, hata
    return g, []


def anahtar(temiz):
    """Ayni istek -> ayni anahtar; buyuk-kucuk harf ve bosluk farki sayilmaz."""
    g = (temiz or {}).get("bilgi") or {}
    ham = json.dumps({k: _kucuk(g.get(k)) for k in ("tur", "ad", "semt", "sehir")},
                     sort_keys=True, ensure_ascii=False)
    return hashlib.sha1(ham.encode("utf-8")).hexdigest()[:20]


def _yer_adi(g):
    return ", ".join(x for x in (g.get("semt"), g.get("sehir")) if x)


def talep(g):
    """Is emrinin konusu. Tirnaksiz: King bildirimi konuyu zaten «» icine alir."""
    if g["tur"] == "besin":
        return "%s besin değerleri (100 g)" % g["ad"]
    if g["tur"] == "fiyat":
        return "%s market fiyatı%s" % (g["ad"], (" (%s)" % g["sehir"]) if g.get("sehir") else "")
    return "%s: %s listesi" % (_yer_adi(g), g["ad"])


def konu(g):
    """Depolama Burosu'nun konu metni (bam.arastirma_konusu)."""
    return "%s %s %s" % (TUR_AD[g["tur"]], g["ad"], _yer_adi(g))


def sorgular(g):
    """Arama sorgulari KURALLA kurulur; model cagrilmaz."""
    if g["tur"] == "besin":
        return ["%s besin değerleri 100 g" % g["ad"], "%s nutrition facts per 100 g" % g["ad"]]
    if g["tur"] == "fiyat":
        s = (" " + g["sehir"]) if g.get("sehir") else ""
        return ["%s fiyatı kg market%s" % (g["ad"], s), "%s kg fiyat%s" % (g["ad"], s)]
    y = _yer_adi(g)
    return ["%s %s" % (y, g["ad"]), "%s %s fiyat üyelik" % (y, g["ad"])]


def istem(g):
    if g["tur"] == "besin":
        return "Besin: %s\n100 gramının besin değerlerini çıkar." % g["ad"]
    if g["tur"] == "fiyat":
        return ("Ürün: %s\nŞehir: %s\nMarketlerdeki güncel fiyatlarını çıkar."
                % (g["ad"], g.get("sehir") or "belirtilmedi"))
    return "Yer türü: %s\nKonum: %s\nBu konumdaki yerleri listele." % (g["ad"], _yer_adi(g))


_GIRIS = """Sen HKM'deki BAM'ın Araştırma Bürosusun; SPİ (sağlık ve beslenme sistemi) için
bilgi topluyorsun. Teşhis koymazsın, doz önermezsin, sağlık tavsiyesi vermezsin.
"""

_KAYNAKLI = """KONUMUN VE SINIRIN
- Sana numaralı web kaynakları verilecek. YALNIZ onlara dayan. Kaynakta olmayan sayıyı
  UYDURMA; bilmediğin alanı null bırak. Sıfır, «yok» demektir; bilinmiyorsa null yaz.
- Her kayıt için «kaynak» (numara) ve «alinti»: o kaynaktan BİREBİR kopyalanmış 20–300
  karakterlik, yazdığın sayıyı içeren bir parça. Kod bu parçayı kaynakta arayacak ve
  sayının alıntıda geçtiğini denetleyecek.
"""

_BICIM = {
    "besin": """NE YAZARSIN
- 100 gram için enerji (kcal), protein (p), yağ (f), karbonhidrat (c), doymuş yağ (sat),
  lif (fib), şeker (sugar) — gram.
- Mikro besinler, yalnız kaynakta varsa: iron, calcium, magnesium, zinc, potassium, sodium
  (mg); b12, folate, vitd, selenium, iodine (µg); vitc (mg); omega3 (g, EPA+DHA).
- Ev ölçüsü biliniyorsa porsiyonlar: {"ad": "1 su bardağı", "g": 170}.

ÇIKTI: Yalnız şu biçimde tek bir JSON nesnesi döndür, başka hiçbir şey yazma:
{"ad": "...", "kcal": 368, "p": 14.1, "f": 6.1, "c": 64.2, "sat": 0.7, "fib": 7,
 "sugar": null, "micro": {"iron": 4.6}, "porsiyonlar": [{"ad": "...", "g": 170}],
 "kaynak": 1, "alinti": "..."}""",
    "fiyat": """NE YAZARSIN
- Kaynaklardaki market fiyatları: market adı, fiyat (TL), o fiyatın miktarı (gram; 1 kg =
  1000) ve fiyatın tarihi (biliniyorsa YYYY-AA-GG ya da YYYY-AA). Birim fiyatı kod hesaplar.

ÇIKTI: Yalnız şu biçimde tek bir JSON nesnesi döndür, başka hiçbir şey yazma:
{"fiyatlar": [{"market": "...", "tl": 289.9, "miktar_g": 1000, "tarih": "2026-09",
 "kaynak": 1, "alinti": "..."}]}""",
    "yer": """NE YAZARSIN
- Kaynaklarda adı geçen yerler: ad, semt, adres (biliniyorsa), fiyat (TL; biliniyorsa) ve
  fiyatın dönemi (aylık, yıllık, günlük, seans, tek giriş). Fiyat bilinmiyorsa null.

ÇIKTI: Yalnız şu biçimde tek bir JSON nesnesi döndür, başka hiçbir şey yazma:
{"yerler": [{"ad": "...", "semt": "...", "adres": null, "fiyat_tl": 1500,
 "donem": "aylık", "kaynak": 1, "alinti": "..."}]}""",
}

_KAYNAKSIZ = """KONUMUN VE SINIRIN
- İnternete erişimin YOK; yalnız kendi bilgin var. Yazdığın değerler «doğrulanmadı»
  etiketiyle saklanır ve kullanıcıya ambalaj etiketiyle karşılaştırması söylenir.
- Emin olmadığın sayıyı UYDURMA; null bırak. «kaynak» ve «alinti» yazma.
"""


def sistem(tur, kaynakli):
    return _GIRIS + (_KAYNAKLI if kaynakli else _KAYNAKSIZ) + "\n" + _BICIM[tur]


# ------------------------------------------------------------ cikti

def _kaynak_no(x):
    n = x.get("kaynak")
    return n if isinstance(n, int) and not isinstance(n, bool) else None


def _besin(d, g):
    deger = {k: _sayi(d.get(k), a) for k, a in MAKRO.items()}
    if deger["kcal"] is None or deger["p"] is None or deger["f"] is None or deger["c"] is None:
        return None, "Enerji, protein, yağ ve karbonhidratın dördü de gerekli; biri eksik."
    toplam = deger["p"] + deger["f"] + deger["c"]
    if toplam > 101:
        return None, "Makroların toplamı 100 gramı aşıyor (%.1f g); değerler tutarsız." % toplam
    hesap = 4 * deger["p"] + 4 * deger["c"] + 9 * deger["f"]
    if abs(hesap - deger["kcal"]) > max(40, 0.25 * deger["kcal"]):
        return None, ("Enerji makrolarla tutmuyor (yazılan %d kcal, makrolardan %d kcal); "
                      "kayıt yazılmadı." % (deger["kcal"], hesap))
    if deger["sat"] is not None and deger["sat"] > deger["f"] + 0.5:
        deger["sat"] = None
    if deger["sugar"] is not None and deger["sugar"] > deger["c"] + 0.5:
        deger["sugar"] = None
    ham = d.get("micro") if isinstance(d.get("micro"), dict) else {}
    micro = {}
    for k, a in MIKRO.items():
        v = _sayi(ham.get(k), a)
        if v is not None:
            micro[k] = v
    porsiyon, gorulen = [], set()
    for p in (d.get("porsiyonlar") if isinstance(d.get("porsiyonlar"), list) else [])[:12]:
        if not isinstance(p, dict):
            continue
        ad = _metin(p.get("ad"), 2, 40)
        gr = _sayi(p.get("g"), PORSIYON_ARALIK)
        if ad and gr and _kucuk(ad) not in gorulen and len(porsiyon) < 6:
            gorulen.add(_kucuk(ad))
            porsiyon.append({"ad": ad, "g": gr})
    out = {"tur": "besin", "ad": _metin(d.get("ad"), 2, MAX_AD) or g["ad"], "istenen": g["ad"],
           "deger": deger, "micro": micro, "porsiyonlar": porsiyon,
           "bilinmeyen_mikro": sorted(k for k in MIKRO if k not in micro)}
    n = _kaynak_no(d)
    if n is not None:
        out["kaynak"] = n
        out["alinti"] = _bosluk(d.get("alinti"))[:400]
    return out, None


def _tarih(x):
    t = _bosluk(x)
    return t if re.match(r"^\d{4}-\d{2}(-\d{2})?$", t) else None


def _fiyat(d, g):
    ham = d.get("fiyatlar") if isinstance(d.get("fiyatlar"), list) else []
    fiyatlar = []
    for x in ham[:MAX_FIYAT * 2]:
        if not isinstance(x, dict) or len(fiyatlar) >= MAX_FIYAT:
            continue
        tl = _sayi(x.get("tl"), FIYAT_ARALIK)
        gr = _sayi(x.get("miktar_g"), MIKTAR_ARALIK)
        n = _kaynak_no(x)
        if tl is None or gr is None or n is None:
            continue
        fiyatlar.append({"market": _metin(x.get("market"), 2, 60), "tl": tl, "miktar_g": gr,
                         "tl_kg": round(tl / gr * 1000, 2), "tarih": _tarih(x.get("tarih")),
                         "kaynak": n, "alinti": _bosluk(x.get("alinti"))[:400]})
    if not fiyatlar:
        return None, "Kaynaklarda kaynağı ve miktarıyla birlikte yazılmış fiyat çıkmadı."
    return {"tur": "fiyat", "ad": g["ad"], "sehir": g.get("sehir"), "fiyatlar": fiyatlar}, None


def _yer(d, g):
    ham = d.get("yerler") if isinstance(d.get("yerler"), list) else []
    yerler, gorulen = [], set()
    for x in ham[:MAX_YER * 2]:
        if not isinstance(x, dict) or len(yerler) >= MAX_YER:
            continue
        ad = _metin(x.get("ad"), 2, 80)
        n = _kaynak_no(x)
        if not ad or n is None or _kucuk(ad) in gorulen:
            continue
        gorulen.add(_kucuk(ad))
        tl = _sayi(x.get("fiyat_tl"), FIYAT_ARALIK)
        donem = x.get("donem") if x.get("donem") in DONEMLER else None
        yerler.append({"ad": ad, "semt": _metin(x.get("semt"), 2, 60),
                       "adres": _metin(x.get("adres"), 4, 160),
                       "fiyat_tl": tl, "donem": donem if tl is not None else None,
                       "kaynak": n, "alinti": _bosluk(x.get("alinti"))[:400]})
    if not yerler:
        return None, "Kaynaklarda kaynağıyla birlikte yazılmış yer çıkmadı."
    return {"tur": "yer", "ad": g["ad"], "semt": g.get("semt"), "sehir": g.get("sehir"),
            "yerler": yerler}, None


def ayikla(d, g):
    """Modelin JSON'u -> temiz kayit govdesi ya da (None, neden). Kod suzer."""
    if not isinstance(d, dict):
        return None, "Model geçerli bir JSON vermedi."
    return {"besin": _besin, "fiyat": _fiyat, "yer": _yer}[g["tur"]](d, g)


def dogrula(govde, metinler, alinti_dogru_mu):
    """Alintilari kaynakta, sayilari alintida arar. Govdeye `dogrulandi`
    yazar; kaydin etiketini doner. Fiyatta ve yerde dogrulanmayan satir
    DUSER: dogrulanmamis fiyat tahmin bile degildir."""
    def tutar(x, sayi):
        n = x.get("kaynak")
        return bool(n in metinler and alinti_dogru_mu(x.get("alinti"), metinler[n])
                    and (sayi is None or sayi_alintida(sayi, x.get("alinti"))))
    if govde["tur"] == "besin":
        d = govde["deger"]
        ok = tutar(govde, None) and any(sayi_alintida(d[k], govde.get("alinti"))
                                        for k in ("kcal", "p", "f", "c"))
        govde["dogrulandi"] = ok
        return ("kaynakli" if ok else "dogrulanmadi"), None
    if govde["tur"] == "fiyat":
        kalan = [x for x in govde["fiyatlar"] if tutar(x, x["tl"])]
        govde["dusen"] = len(govde["fiyatlar"]) - len(kalan)
        if not kalan:
            return None, "Hiçbir fiyat kaynağındaki alıntıyla doğrulanamadı; kayıt yazılmadı."
        govde["fiyatlar"] = kalan
        kg = sorted(x["tl_kg"] for x in kalan)
        orta = len(kg) // 2
        govde["tl_kg"] = round(kg[orta] if len(kg) % 2 else (kg[orta - 1] + kg[orta]) / 2, 2)
        govde["etiket"] = "tahmin"
        return "kaynakli", None
    kalan = []
    for x in govde["yerler"]:
        if not tutar(x, None):
            continue
        if x["fiyat_tl"] is not None and not sayi_alintida(x["fiyat_tl"], x.get("alinti")):
            x["fiyat_tl"], x["donem"] = None, None      # fiyat alintida yok: bilinmiyor
        kalan.append(x)
    govde["dusen"] = len(govde["yerler"]) - len(kalan)
    if not kalan:
        return None, "Hiçbir yer kaynağındaki alıntıyla doğrulanamadı; kayıt yazılmadı."
    govde["yerler"] = kalan
    govde["etiket"] = "tahmin"
    return "kaynakli", None


def baslik(g):
    return talep(g)


def ozet(govde):
    """Bitis cumlesi — sayilar kayittan."""
    if govde["tur"] == "besin":
        d = govde["deger"]
        return ("%s, 100 g: %d kcal, protein %s g, yağ %s g, karbonhidrat %s g; %d mikro besin "
                "bilinmiyor." % (govde["ad"], round(d["kcal"]), _yaz(d["p"]), _yaz(d["f"]),
                                 _yaz(d["c"]), len(govde["bilinmeyen_mikro"])))
    if govde["tur"] == "fiyat":
        return ("%s: %d fiyat, ortanca %s TL/kg (tahmin, kaynaklı)."
                % (govde["ad"], len(govde["fiyatlar"]), _yaz(govde["tl_kg"])))
    return "%s: %d yer (kaynaklı)." % (govde["ad"], len(govde["yerler"]))


def _yaz(x):
    return ("%.1f" % x).rstrip("0").rstrip(".").replace(".", ",")
