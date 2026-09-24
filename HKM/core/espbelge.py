# -*- coding: utf-8 -*-
"""ESP belgesi — tarih ve felsefe icin KAYNAKLI malzeme (Part 8f).

   Kullanici 2026-09-24: «ESP'de yalniz dil degil; felsefe, tarih ve diger
   alanlara da belge aratacagiz: kimisine filozof, kimisine turlu turlu
   seyler.» ESP bir alan ve bir konu ister («Stoacilik», «Osmanli'nin
   kurulusu»). Is King'in teklifinden ve onaydan gecer; BAM Arastirma Burosu
   web kaynaklarindan TIPLI bir kayit yazar, King kaydi ESP'ye `belge.add`
   teklifi olarak birakir. ESP kaydi KENDI koduyla yeniden sinar, onizletir
   ve onayla yazar; HKM ESP'ye yazmaz.

   Bes kural:

   1. BELGE KAYNAKTIR. Web kapaliysa ya da kaynak cikmazsa is MODEL
      CAGIRMADAN «hata» ile biter ve bu soylenir: model bilgisinden yazilmis
      bir tarih ya da tez, belge gibi gosterilemez.
   2. ALINTI KAYNAKTA, KANIT ALINTIDA. Her satirin kaynagi ve birebir
      alintisi vardir; kod alintiyi kaynakta arar. Tarihte YIL alintida
      gecmelidir; felsefede DUSUNURUN ADI alintida gecmelidir. Gecmeyen satir
      DUSER: dogrulanmamis olay, olay degildir.
   3. SOZLUK KAPALIDIR. Olay turu ve bolgesi ESP'nin kendi listesindendir
      (ESP/src/js/data: EVENT_KINDS, REGIONS); disindaki satir tahmin
      edilmez, duser.
   4. YORUM YOK, IDDIA VAR. Felsefede «tez» dusunurun KENDI ana iddiasidir,
      bir degerlendirme degil; ESP onu Sempozyum'da ACIK bir tartisma olarak
      acar — destek ve itirazi kullanici yazar.
   5. GIRDI KAPALIDIR: alan ve konu. Kisisel veri gitmez."""
import hashlib
import json
import re

from core import spibilgi

ALANLAR = ("tarih", "felsefe", "okuma", "yazi", "cefr", "okuma_hizi")
ALAN_AD = {"tarih": "tarih belgesi", "felsefe": "felsefe belgesi", "okuma": "okuma listesi",
           "yazi": "yazı örnekleri", "cefr": "CEFR saat tablosu dayanağı",
           "okuma_hizi": "okuma hızı dayanağı"}
# Madde 11: ESP hedef paketlerindeki TAHMIN TABLOLARININ kaynagi. Sayi
# kaynaktan, sinama koddan; ESP hesabi yine kendisi yapar.
DAYANAK_ALANLARI = ("cefr", "okuma_hizi")
CEFR = ("A1", "A2", "B1", "B2", "C1", "C2")
CEFR_SAAT = (10, 3000)
KELIME_DK = (50, 1000)
ESER_ALANLARI = ("okuma", "yazi")
MAX_ESER = 10
TURLER = ("siyasi", "ekonomik", "dusunsel", "toplumsal")
BOLGELER = ("anadolu", "avrupa", "ortadogu", "asya", "afrika", "amerika", "dunya")
YIL = (-3500, 2100)
MAX_OLAY = 12
MAX_DUSUNUR = 8
MAX_KONU = 80


def _bosluk(s):
    return re.sub(r"\s+", " ", str(s or "")).strip()


def _kucuk(s):
    return _bosluk(s).replace("I", "ı").replace("İ", "i").lower()


def _metin(x, az, cok):
    t = _bosluk(x)
    return t if az <= len(t) <= cok else None


def temizle(govde):
    """Is emri govdesi: {alan, konu}. (temiz, hatalar)."""
    if not isinstance(govde, dict):
        return None, ["belge bir nesne olmalı"]
    hata = []
    for k in govde:
        if k not in ("alan", "konu"):
            hata.append("belge: bilinmeyen alan %s" % k)
    alan = govde.get("alan")
    if alan not in ALANLAR:
        hata.append("alan tarih, felsefe, okuma, yazi, cefr ya da okuma_hizi olmalı")
    konu = _bosluk(govde.get("konu"))
    if not (2 <= len(konu) <= MAX_KONU):
        hata.append("konu 2-%d karakter olmalı" % MAX_KONU)
    if hata:
        return None, hata
    return {"alan": alan, "konu": konu}, []


def anahtar(temiz):
    g = (temiz or {}).get("belge") or {}
    ham = json.dumps([g.get("alan"), _kucuk(g.get("konu"))], ensure_ascii=False)
    return hashlib.sha1(ham.encode("utf-8")).hexdigest()[:20]


def talep(g):
    return "%s: %s" % (ALAN_AD[g["alan"]].capitalize(), g["konu"])


def konu(g):
    return "%s %s" % (ALAN_AD[g["alan"]], g["konu"])


def baslik(g):
    return talep(g)


def sorgular(g):
    """Arama sorgulari KURALLA kurulur; model cagrilmaz."""
    if g["alan"] == "tarih":
        return [g["konu"], "%s tarihi olaylar" % g["konu"]]
    if g["alan"] == "okuma":
        return ["%s kitapları" % g["konu"], "%s okuma listesi" % g["konu"]]
    if g["alan"] == "cefr":
        return ["CEFR guided learning hours A1 A2 B1 B2 C1 C2", "CEFR seviyeleri kaç saat"]
    if g["alan"] == "okuma_hizi":
        return ["average silent reading speed words per minute", "ortalama okuma hızı dakikada kelime"]
    if g["alan"] == "yazi":
        return ["%s yazarları üslup" % g["konu"], "%s örnek metinler" % g["konu"]]
    return [g["konu"], "%s filozoflar eserleri" % g["konu"]]


def istem(g):
    if g["alan"] == "tarih":
        return "Konu: %s\nBu konunun önemli olaylarını kaynaklardan çıkar." % g["konu"]
    if g["alan"] == "okuma":
        return "Konu: %s\nBu konuda okunacak temel eserleri kaynaklardan çıkar." % g["konu"]
    if g["alan"] == "cefr":
        return "CEFR seviyelerinin her biri için rehberli öğrenme saatini kaynaklardan çıkar."
    if g["alan"] == "okuma_hizi":
        return "Yetişkinlerin sessiz okuma hızını (dakikada kelime) kaynaklardan çıkar."
    if g["alan"] == "yazi":
        return ("Konu: %s\nBu konuda üslubu örnek gösterilen yazarları ve eserlerini kaynaklardan "
                "çıkar." % g["konu"])
    return "Konu: %s\nBu konunun düşünürlerini, eserlerini ve ana tezlerini kaynaklardan çıkar." % g["konu"]


_GIRIS = """Sen HKM'deki BAM'ın Araştırma Bürosusun; ESP (kişisel gelişim ve entelektüel
çalışma sistemi) için belge topluyorsun. Değerlendirme yazmazsın; kaynakta ne yazıyorsa
onu taşırsın.

KONUMUN VE SINIRIN
- Sana numaralı web kaynakları verilecek. YALNIZ onlara dayan; kaynakta olmayanı UYDURMA.
- Her satır için «kaynak» (numara) ve «alinti»: o kaynaktan BİREBİR kopyalanmış 20–300
  karakterlik bir parça. Kod bu parçayı kaynakta arayacak.
"""

_ESER_BICIM = """NE YAZARSIN
- Eserler: yazar; eser adı; yılı (biliniyorsa tam sayı, MÖ ise eksi; bilinmiyorsa null);
  «not»: %s (tek cümle, kaynağa dayanarak).
- Alıntı yazarın ADINI içermeli.

ÇIKTI: Yalnız şu biçimde tek bir JSON nesnesi döndür, başka hiçbir şey yazma:
{"eserler": [{"yazar": "...", "eser": "...", "yil": null, "not": "...",
  "kaynak": 1, "alinti": "..."}]}"""

_BICIM = {
    "cefr": """NE YAZARSIN
- Her CEFR seviyesi (A1, A2, B1, B2, C1, C2) için kaynakta yazan rehberli öğrenme saati
  aralığı: alt ve üst (tek sayı yazıyorsa ikisi aynı). Seviyeler SIFIRDAN toplam saattir.
- Alıntı seviyeyi ve saati içermeli.

ÇIKTI: Yalnız şu biçimde tek bir JSON nesnesi döndür, başka hiçbir şey yazma:
{"seviyeler": [{"seviye": "A1", "saat_alt": 90, "saat_ust": 100, "kaynak": 1, "alinti": "..."}]}""",
    "okuma_hizi": """NE YAZARSIN
- Kaynakta yazan yetişkin sessiz okuma hızları (dakikada kelime); ne ölçüldüğünü kısaca yaz.
- Alıntı sayıyı içermeli.

ÇIKTI: Yalnız şu biçimde tek bir JSON nesnesi döndür, başka hiçbir şey yazma:
{"hizlar": [{"ne": "...", "kelime_dk": 238, "kaynak": 1, "alinti": "..."}]}""",
    "okuma": _ESER_BICIM % "bu eserin konu için neden temel sayıldığı",
    "yazi": _ESER_BICIM % "bu yazarın üslubunda örnek gösterilen özellik",
    "tarih": """NE YAZARSIN
- Konunun olayları: kısa başlık; yıl (tam sayı; Milattan önce ise EKSİ, örneğin -480);
  tür (yalnız: siyasi, ekonomik, dusunsel, toplumsal); bölge (yalnız: anadolu, avrupa,
  ortadogu, asya, afrika, amerika, dunya); neden önemli olduğu (tek cümle).
- Alıntı olayın YILINI içermeli.

ÇIKTI: Yalnız şu biçimde tek bir JSON nesnesi döndür, başka hiçbir şey yazma:
{"olaylar": [{"baslik": "...", "yil": 1299, "tur": "siyasi", "bolge": "anadolu",
  "neden": "...", "kaynak": 1, "alinti": "..."}]}""",
    "felsefe": """NE YAZARSIN
- Konunun düşünürleri: ad; bir ana eseri; eserin yılı (biliniyorsa tam sayı, MÖ ise eksi;
  bilinmiyorsa null); düşünürün KENDİ ana tezi (tek cümle, değerlendirme değil);
  en çok beş kavram.
- Alıntı düşünürün ADINI içermeli.

ÇIKTI: Yalnız şu biçimde tek bir JSON nesnesi döndür, başka hiçbir şey yazma:
{"dusunurler": [{"ad": "...", "eser": "...", "yil": null, "tez": "...",
  "kavramlar": ["..."], "kaynak": 1, "alinti": "..."}]}""",
}


def sistem(alan):
    return _GIRIS + "\n" + _BICIM[alan]


def _kaynak_no(x):
    n = x.get("kaynak")
    return n if isinstance(n, int) and not isinstance(n, bool) else None


def _yil(x, bos_olur=False):
    if x is None and bos_olur:
        return None, True
    if isinstance(x, bool) or not isinstance(x, int) or not (YIL[0] <= x <= YIL[1]):
        return None, False
    return x, True


def ayikla(d, g):
    """Modelin JSON'u -> (govde, None) ya da (None, neden). Kod suzer."""
    if not isinstance(d, dict):
        return None, "Model geçerli bir JSON vermedi."
    satirlar, dusen, gorulen = [], 0, set()
    if g["alan"] == "tarih":
        for x in (d.get("olaylar") if isinstance(d.get("olaylar"), list) else [])[:MAX_OLAY * 2]:
            if not isinstance(x, dict):
                dusen += 1
                continue
            b = _metin(x.get("baslik"), 2, 120)
            yil, yok = _yil(x.get("yil"))
            n = _kaynak_no(x)
            if not b or not yok or yil is None or x.get("tur") not in TURLER \
                    or x.get("bolge") not in BOLGELER or n is None:
                dusen += 1
                continue
            k = (_kucuk(b), yil)
            if k in gorulen or len(satirlar) >= MAX_OLAY:
                continue
            gorulen.add(k)
            satirlar.append({"baslik": b, "yil": yil, "tur": x["tur"], "bolge": x["bolge"],
                             "neden": _metin(x.get("neden"), 4, 240), "kaynak": n,
                             "alinti": _bosluk(x.get("alinti"))[:400]})
        if not satirlar:
            return None, "Kaynaklarda yılı ve türüyle yazılmış olay çıkmadı."
        return {"tur": "tarih", "konu": g["konu"], "olaylar": satirlar, "bicim_dusen": dusen}, None
    if g["alan"] == "cefr":
        gor = {}
        for x in (d.get("seviyeler") if isinstance(d.get("seviyeler"), list) else [])[:24]:
            if not isinstance(x, dict):
                dusen += 1
                continue
            sv = _bosluk(x.get("seviye")).upper()
            alt, ust = x.get("saat_alt"), x.get("saat_ust")
            n = _kaynak_no(x)
            if sv not in CEFR or n is None or not all(isinstance(v, int) and not isinstance(v, bool)
                                                      and CEFR_SAAT[0] <= v <= CEFR_SAAT[1] for v in (alt, ust)) \
                    or alt > ust:
                dusen += 1
                continue
            if sv in gor:
                continue
            gor[sv] = 1
            satirlar.append({"seviye": sv, "saat_alt": alt, "saat_ust": ust, "kaynak": n,
                             "alinti": _bosluk(x.get("alinti"))[:400]})
        if not satirlar:
            return None, "Kaynaklarda seviyesiyle birlikte yazılmış saat çıkmadı."
        satirlar.sort(key=lambda x: CEFR.index(x["seviye"]))
        return {"tur": "cefr", "konu": g["konu"], "seviyeler": satirlar, "bicim_dusen": dusen}, None
    if g["alan"] == "okuma_hizi":
        for x in (d.get("hizlar") if isinstance(d.get("hizlar"), list) else [])[:12]:
            v = x.get("kelime_dk") if isinstance(x, dict) else None
            n = _kaynak_no(x) if isinstance(x, dict) else None
            if not (isinstance(v, int) and not isinstance(v, bool) and KELIME_DK[0] <= v <= KELIME_DK[1]) or n is None:
                dusen += 1
                continue
            satirlar.append({"ne": _metin(x.get("ne"), 2, 120), "kelime_dk": v, "kaynak": n,
                             "alinti": _bosluk(x.get("alinti"))[:400]})
        if not satirlar:
            return None, "Kaynaklarda dakikada kelime olarak yazılmış okuma hızı çıkmadı."
        return {"tur": "okuma_hizi", "konu": g["konu"], "hizlar": satirlar, "bicim_dusen": dusen}, None
    if g["alan"] in ESER_ALANLARI:
        for x in (d.get("eserler") if isinstance(d.get("eserler"), list) else [])[:MAX_ESER * 2]:
            if not isinstance(x, dict):
                dusen += 1
                continue
            yazar, eser = _metin(x.get("yazar"), 2, 80), _metin(x.get("eser"), 2, 120)
            yil, yok = _yil(x.get("yil"), bos_olur=True)
            n = _kaynak_no(x)
            if not yazar or not eser or not yok or n is None:
                dusen += 1
                continue
            k = (_kucuk(yazar), _kucuk(eser))
            if k in gorulen or len(satirlar) >= MAX_ESER:
                continue
            gorulen.add(k)
            satirlar.append({"yazar": yazar, "eser": eser, "yil": yil,
                             "not": _metin(x.get("not"), 4, 240), "kaynak": n,
                             "alinti": _bosluk(x.get("alinti"))[:400]})
        if not satirlar:
            return None, "Kaynaklarda yazarı ve adıyla yazılmış eser çıkmadı."
        return {"tur": g["alan"], "konu": g["konu"], "eserler": satirlar, "bicim_dusen": dusen}, None
    for x in (d.get("dusunurler") if isinstance(d.get("dusunurler"), list) else [])[:MAX_DUSUNUR * 2]:
        if not isinstance(x, dict):
            dusen += 1
            continue
        ad = _metin(x.get("ad"), 2, 80)
        eser = _metin(x.get("eser"), 2, 120)
        tez = _metin(x.get("tez"), 10, 300)
        yil, yok = _yil(x.get("yil"), bos_olur=True)
        n = _kaynak_no(x)
        if not ad or not eser or not tez or not yok or n is None:
            dusen += 1
            continue
        if _kucuk(ad) in gorulen or len(satirlar) >= MAX_DUSUNUR:
            continue
        gorulen.add(_kucuk(ad))
        kav = [k for k in (_metin(k, 2, 40) for k in (x.get("kavramlar") or [])
                           if isinstance(k, str)) if k][:5]
        satirlar.append({"ad": ad, "eser": eser, "yil": yil, "tez": tez, "kavramlar": kav,
                         "kaynak": n, "alinti": _bosluk(x.get("alinti"))[:400]})
    if not satirlar:
        return None, "Kaynaklarda eseri ve teziyle yazılmış düşünür çıkmadı."
    return {"tur": "felsefe", "konu": g["konu"], "dusunurler": satirlar, "bicim_dusen": dusen}, None


def _ad_alintida(ad, alinti):
    """Dusunurun adi (en az soyadi ya da tek adi) alintida geciyor mu?"""
    a = _kucuk(alinti)
    parca = [p for p in re.split(r"[\s.,'’-]+", _kucuk(ad)) if len(p) >= 3]
    return bool(parca) and any(p in a for p in parca)


def _yil_alintida(yil, alinti):
    return spibilgi.sayi_alintida(abs(yil), alinti)


def dogrula(govde, metinler, alinti_dogru_mu):
    """Alintilari kaynakta; yili (tarih) ya da adi (felsefe) alintida arar.
    Tutmayan satir DUSER. Doner: (etiket, hata)."""
    def kaynakta(x):
        n = x.get("kaynak")
        return bool(n in metinler and alinti_dogru_mu(x.get("alinti"), metinler[n]))
    if govde["tur"] == "tarih":
        kalan = [x for x in govde["olaylar"] if kaynakta(x) and _yil_alintida(x["yil"], x["alinti"])]
        govde["dusen"] = len(govde["olaylar"]) - len(kalan)
        if not kalan:
            return None, "Hiçbir olay kaynağındaki alıntıyla doğrulanamadı; kayıt yazılmadı."
        govde["olaylar"] = kalan
        return "kaynakli", None
    if govde["tur"] == "cefr":
        kalan = [x for x in govde["seviyeler"] if kaynakta(x) and x["seviye"] in x["alinti"].upper()
                 and (_yil_alintida(x["saat_ust"], x["alinti"]) or _yil_alintida(x["saat_alt"], x["alinti"]))]
        govde["dusen"] = len(govde["seviyeler"]) - len(kalan)
        if not kalan:
            return None, "Hiçbir seviye kaynağındaki alıntıyla doğrulanamadı; kayıt yazılmadı."
        govde["seviyeler"] = kalan
        return "kaynakli", None
    if govde["tur"] == "okuma_hizi":
        kalan = [x for x in govde["hizlar"] if kaynakta(x) and _yil_alintida(x["kelime_dk"], x["alinti"])]
        govde["dusen"] = len(govde["hizlar"]) - len(kalan)
        if not kalan:
            return None, "Hiçbir okuma hızı kaynağındaki alıntıyla doğrulanamadı; kayıt yazılmadı."
        govde["hizlar"] = kalan
        return "kaynakli", None
    if govde["tur"] in ESER_ALANLARI:
        kalan = []
        for x in govde["eserler"]:
            if not (kaynakta(x) and _ad_alintida(x["yazar"], x["alinti"])):
                continue
            if x["yil"] is not None and not _yil_alintida(x["yil"], x["alinti"]):
                x["yil"] = None
            kalan.append(x)
        govde["dusen"] = len(govde["eserler"]) - len(kalan)
        if not kalan:
            return None, "Hiçbir eser kaynağındaki alıntıyla doğrulanamadı; kayıt yazılmadı."
        govde["eserler"] = kalan
        return "kaynakli", None
    kalan = []
    for x in govde["dusunurler"]:
        if not (kaynakta(x) and _ad_alintida(x["ad"], x["alinti"])):
            continue
        if x["yil"] is not None and not _yil_alintida(x["yil"], x["alinti"]):
            x["yil"] = None                       # yil alintida yok: bilinmiyor
        kalan.append(x)
    govde["dusen"] = len(govde["dusunurler"]) - len(kalan)
    if not kalan:
        return None, "Hiçbir düşünür kaynağındaki alıntıyla doğrulanamadı; kayıt yazılmadı."
    govde["dusunurler"] = kalan
    return "kaynakli", None


def satirlar(govde):
    """Kaydin satirlari — ture gore (teklif sayisi ve ozet icin)."""
    return (govde.get("olaylar") if govde.get("tur") == "tarih"
            else govde.get("eserler") if govde.get("tur") in ESER_ALANLARI
            else govde.get("seviyeler") if govde.get("tur") == "cefr"
            else govde.get("hizlar") if govde.get("tur") == "okuma_hizi"
            else govde.get("dusunurler")) or []


def ozet(govde):
    if govde["tur"] == "cefr":
        return "CEFR saat tablosu: %d seviye kaynakta doğrulandı." % len(govde["seviyeler"])
    if govde["tur"] == "okuma_hizi":
        return "Okuma hızı: %d değer kaynakta doğrulandı." % len(govde["hizlar"])
    if govde["tur"] in ESER_ALANLARI:
        return "%s: %d eser (%s, kaynaklı)." % (govde["konu"], len(govde["eserler"]),
                                                ALAN_AD[govde["tur"]])
    if govde["tur"] == "tarih":
        return "%s: %d olay (kaynaklı, yıl alıntıda)." % (govde["konu"], len(govde["olaylar"]))
    return "%s: %d düşünür, eser ve tez (kaynaklı)." % (govde["konu"], len(govde["dusunurler"]))
