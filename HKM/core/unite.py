# -*- coding: utf-8 -*-
"""ESP dil unitesi (Part 8d): «Rusca A1 selamlasma unitesi hazirla».

   ESP bir dil, bir CEFR duzeyi ve bir konu ister. Is King'in teklifinden ve
   kullanicinin onayindan gecer; BAM Uretim Burosu uniteyi TIPLI bir kayda
   yazar (baslik, olculebilir hedef, gorev, on/arka ogeler), ogeleri cevabi
   gormeyen bagimsiz bir yargiyla denetler ve King kaydi ESP'ye `unite.add`
   teklifi olarak birakir. ESP kaydi KENDI koduyla yeniden sinar, onizletir ve
   onayla yazar; HKM ESP'ye yazmaz.

   Bes kural:

   1. GIRDI KAPALIDIR: dil (ESP'nin sekiz dilinden biri), duzey (A1-C2),
      konu, unite sayisi (1-4) ve unite basina oge (6-20). Kisisel veri
      istemde YOKTUR.
   2. SORU MODELDEN GELMEZ. ESP'nin pratik motoru soruyu ve celdiriciyi
      AYNI DESTEDEN kuralla uretir (ESP/src/js/core/lesson.js kural 3);
      burada yalniz ogeler yazilir. Uydurulmus celdirici yanlis sey ogretir.
   3. YAZI SISTEMI KODLA DENETLENIR: Rusca on yuz Kiril, Arapca Arap harfi,
      digerleri Latin harfi tasir; arka yuz Turkcedir ve on yuzle ayni
      olamaz. Tutmayan oge duser.
   4. KALITE KONTROLU ZORUNLUDUR: bagimsiz yargi «dogru» demeyen oge duser;
      6 ogenin altina inen unite kayda girmez; hic unite kalmazsa kayit
      yazilmaz, teklif birakilmaz.
   5. ETIKET «dogrulanmadi»: kaynak yok, model bilgisidir. ESP kartlari
      `bam` ve `seed` etiketiyle tasir.

   GITAR PAKETI (alan «gitar», Part 8d-2): konu ve duzeyden 3-10 alistirma
   (teknik ya da parca, ton, derece ilerleyisi, baslangic ve hedef tempo).
   ESP'nin `pieces` semasina girer (ESP/src/js/data/guitar_tabs.js). Dogru ya
   da yanlisi olan bir CEVAP olmadigi icin bagimsiz yargi yoktur; sayilar
   kodla aralik denetiminden gecer ve hedef tempo «referans»tir: esik
   kullanicinin kendi temiz tekrarindan acilir (ESP acoustic.js)."""
import hashlib
import json
import re

DILLER = {"en": "İngilizce", "de": "Almanca", "fr": "Fransızca", "es": "İspanyolca",
          "ar": "Arapça", "ru": "Rusça", "it": "İtalyanca", "la": "Latince"}
DUZEYLER = ("A1", "A2", "B1", "B2", "C1", "C2")
UNITE = (1, 4)
OGE = (6, 20)
VARSAYILAN = {"unite": 2, "oge": 12}
MAX_ON = 120
MAX_ARKA = 160

_KIRIL = re.compile(r"[Ѐ-ӿ]")
_ARAP = re.compile(r"[؀-ۿ]")
_LATIN = re.compile(r"[A-Za-zÀ-ÿĀ-žḀ-ỿ]")


def _bosluk(s):
    return re.sub(r"\s+", " ", str(s or "")).strip()


def _kucuk(s):
    return _bosluk(s).replace("I", "ı").replace("İ", "i").lower()


def _tam(x, aralik, varsayilan):
    if x is None:
        return varsayilan
    if isinstance(x, bool) or not isinstance(x, int) or not (aralik[0] <= x <= aralik[1]):
        return None
    return x


GITAR_DUZEY = ("başlangıç", "orta", "ileri")
GITAR_OGE = (3, 10)
BPM = (30, 240)
TONLAR = ("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")
_DERECE = re.compile(r"^b?(VII|VI|V|IV|III|II|I|vii|vi|v|iv|iii|ii|i)(°|7|maj7|m7|sus4)?$")


def _gitar_temizle(govde):
    hata = []
    for k in govde:
        if k not in ("alan", "duzey", "konu", "oge"):
            hata.append("gitar: bilinmeyen alan %s" % k)
    duzey = _bosluk(govde.get("duzey")).lower().replace("baslangic", "başlangıç")
    if duzey not in GITAR_DUZEY:
        hata.append("düzey başlangıç, orta ya da ileri olmalı")
    konu = _bosluk(govde.get("konu"))
    if not (2 <= len(konu) <= 80):
        hata.append("konu 2-80 karakter olmalı")
    m = _tam(govde.get("oge"), GITAR_OGE, 6)
    if m is None:
        hata.append("alıştırma sayısı %d-%d olmalı" % GITAR_OGE)
    if hata:
        return None, hata
    return {"alan": "gitar", "duzey": duzey, "konu": konu, "oge": m}, []


def temizle(govde):
    """Is emri govdesi: {dil, duzey, konu, unite?, oge?} ya da
    {alan:"gitar", duzey, konu, oge?}. (temiz, hatalar)."""
    if not isinstance(govde, dict):
        return None, ["ünite bir nesne olmalı"]
    if govde.get("alan") == "gitar":
        return _gitar_temizle(govde)
    hata = []
    for k in govde:
        if k not in ("alan", "dil", "duzey", "konu", "unite", "oge"):
            hata.append("ünite: bilinmeyen alan %s" % k)
    if govde.get("alan") not in (None, "dil"):
        hata.append("alan dil ya da gitar olmalı")
    dil = govde.get("dil")
    if dil not in DILLER:
        hata.append("dil şunlardan biri olmalı: %s" % ", ".join(DILLER))
    duzey = _bosluk(govde.get("duzey")).upper()
    if duzey not in DUZEYLER:
        hata.append("düzey A1-C2 olmalı")
    konu = _bosluk(govde.get("konu"))
    if not (2 <= len(konu) <= 80):
        hata.append("konu 2-80 karakter olmalı")
    n = _tam(govde.get("unite"), UNITE, VARSAYILAN["unite"])
    if n is None:
        hata.append("ünite sayısı %d-%d olmalı" % UNITE)
    m = _tam(govde.get("oge"), OGE, VARSAYILAN["oge"])
    if m is None:
        hata.append("ünite başına öğe %d-%d olmalı" % OGE)
    if hata:
        return None, hata
    return {"dil": dil, "duzey": duzey, "konu": konu, "unite": n, "oge": m}, []


def gitar_mi(g):
    return (g or {}).get("alan") == "gitar"


def anahtar(temiz):
    g = temiz["unite"]
    if gitar_mi(g):
        ham = json.dumps(["gitar", g["duzey"], _kucuk(g["konu"]), g["oge"]], ensure_ascii=False)
    else:
        ham = json.dumps([g["dil"], g["duzey"], _kucuk(g["konu"]), g["unite"], g["oge"]],
                         ensure_ascii=False)
    return hashlib.sha1(ham.encode("utf-8")).hexdigest()[:16]


def talep(g):
    if gitar_mi(g):
        return "Gitar %s — «%s» (%d alıştırma)" % (g["duzey"], g["konu"], g["oge"])
    return "%s %s — «%s» (%d ünite × %d öğe)" % (DILLER[g["dil"]], g["duzey"], g["konu"],
                                                  g["unite"], g["oge"])


def konu(g):
    if gitar_mi(g):
        return "gitar %s %s" % (g["duzey"], g["konu"])
    return "ünite %s %s %s" % (g["dil"], g["duzey"], g["konu"])


def baslik(g):
    if gitar_mi(g):
        return "Gitar %s · %s" % (g["duzey"], g["konu"])
    return "%s %s · %s" % (DILLER[g["dil"]], g["duzey"], g["konu"])


BICIM = """
NE YAZARSIN
- İstenen sayıda ünite. Her ünitenin: kısa başlığı; ÖLÇÜLEBİLİR hedefi («otuz fiili
  tanıyıp cümlede kullanmak» gibi); kullanıcının kendi başına yapacağı TEK bir görevi;
  ve öğeleri.
- Öğe: «on» hedef dilde (kelime ya da kısa kalıp), «arka» Türkçe karşılığı. Eş anlamlılar
  «,» ile ayrılabilir. Öğeler birbirini tekrar etmesin; düzeye uygun olsun.
- Soru, şık ya da çeldirici YAZMA: pratik soruları uygulama kendisi kurar.

ÇIKTI: Yalnız şu biçimde tek bir JSON nesnesi döndür, başka hiçbir şey yazma:
{"uniteler": [{"baslik": "...", "hedef": "...", "gorev": "...",
  "ogeler": [{"on": "...", "arka": "..."}]}]}"""


BICIM_GITAR = """
NE YAZARSIN
- İstenen sayıda gitar alıştırması. Her biri: ad; tür («teknik» ya da «parça»); ton
  (C, C#, D … B; minörse sonuna «m»; tonsuzsa null); akor ilerleyişi derece olarak
  (örneğin ["I", "V", "vi", "IV"]; yoksa boş liste); başlangıç temposu (BPM) ve akıcı
  sayılan hedef tempo (BPM); tek cümlelik ne ölçüleceği notu.
- Telifli bir parçanın notalarını ya da sözlerini YAZMA; yalnız alıştırma tarif et.

ÇIKTI: Yalnız şu biçimde tek bir JSON nesnesi döndür, başka hiçbir şey yazma:
{"alistirmalar": [{"ad": "...", "tur": "teknik", "ton": "G", "ilerleyis": ["I", "V"],
  "baslangic_bpm": 60, "hedef_bpm": 100, "not": "..."}]}"""


def istem_gitar(g):
    return "Gitar\nDüzey: %s\nKonu: %s\nAlıştırma sayısı: %d" % (g["duzey"], g["konu"], g["oge"])


def _bpm(x):
    if isinstance(x, bool) or not isinstance(x, (int, float)) or not (BPM[0] <= x <= BPM[1]):
        return None
    return int(round(x))


def ayikla_gitar(d, g):
    """Modelin JSON'u -> (alistirmalar, dusen) ya da (None, neden). Kod suzer:
    tempo araligi, baslangic <= hedef, ton ve derece bicimi, tekrar eden ad."""
    if not isinstance(d, dict) or not isinstance(d.get("alistirmalar"), list):
        return None, "Model geçerli bir alıştırma listesi vermedi."
    out, dusen, gorulen = [], 0, set()
    for x in d["alistirmalar"][:g["oge"] * 2]:
        if not isinstance(x, dict):
            dusen += 1
            continue
        ad = _bosluk(x.get("ad"))[:80]
        tur = {"teknik": "technique", "parça": "piece", "parca": "piece"}.get(_kucuk(x.get("tur")))
        bas, hedef = _bpm(x.get("baslangic_bpm")), _bpm(x.get("hedef_bpm"))
        ton = _bosluk(x.get("ton")) or None
        if ton is not None and (ton[:-1] if ton.endswith("m") else ton) not in TONLAR:
            ton = None
        ilerleyis = x.get("ilerleyis") if isinstance(x.get("ilerleyis"), list) else []
        if len(ad) < 2 or not tur or bas is None or hedef is None or bas > hedef \
                or len(ilerleyis) > 16 or not all(isinstance(t, str) and _DERECE.match(t.strip())
                                                  for t in ilerleyis):
            dusen += 1
            continue
        if _kucuk(ad) in gorulen or len(out) >= g["oge"]:
            continue
        gorulen.add(_kucuk(ad))
        out.append({"ad": ad, "tur": tur, "ton": ton, "ilerleyis": [t.strip() for t in ilerleyis],
                    "baslangic_bpm": bas, "hedef_bpm": hedef,
                    "not": _bosluk(x.get("not"))[:200] or None})
    if len(out) < GITAR_OGE[0]:
        return None, "En az %d geçerli alıştırma çıkmadı." % GITAR_OGE[0]
    return (out, dusen), None


def istem(g):
    return ("Dil: %s\nDüzey (CEFR): %s\nKonu: %s\nÜnite sayısı: %d\nÜnite başına öğe: %d"
            % (DILLER[g["dil"]], g["duzey"], g["konu"], g["unite"], g["oge"]))


def yazi_tutar(dil, on):
    """On yuz dilin yazi sistemini tasiyor mu? Kod kurali, model yok."""
    if dil == "ru":
        return bool(_KIRIL.search(on)) and not _ARAP.search(on)
    if dil == "ar":
        return bool(_ARAP.search(on)) and not _KIRIL.search(on)
    return bool(_LATIN.search(on)) and not _KIRIL.search(on) and not _ARAP.search(on)


def _oge(dil, x):
    if not isinstance(x, dict):
        return None
    on, arka = _bosluk(x.get("on")), _bosluk(x.get("arka"))
    if not (1 <= len(on) <= MAX_ON and 1 <= len(arka) <= MAX_ARKA):
        return None
    if not yazi_tutar(dil, on) or _KIRIL.search(arka) or _ARAP.search(arka):
        return None
    if _kucuk(on) == _kucuk(arka):
        return None
    return {"on": on, "arka": arka}


def ayikla(d, g):
    """Modelin JSON'u -> (uniteler, bicim_dusen) ya da (None, neden). Kod suzer."""
    if not isinstance(d, dict) or not isinstance(d.get("uniteler"), list):
        return None, "Model geçerli bir ünite listesi vermedi."
    uniteler, dusen, gorulen = [], 0, set()
    for u in d["uniteler"][:g["unite"]]:
        if not isinstance(u, dict):
            continue
        b = _bosluk(u.get("baslik"))[:80]
        hedef = _bosluk(u.get("hedef"))[:200]
        gorev = _bosluk(u.get("gorev"))[:240]
        if len(b) < 2 or len(hedef) < 8:
            continue
        ogeler = []
        ham = u.get("ogeler") if isinstance(u.get("ogeler"), list) else []
        for x in ham[:g["oge"] * 2]:
            o = _oge(g["dil"], x)
            if not o:
                dusen += 1
                continue
            if _kucuk(o["on"]) in gorulen or len(ogeler) >= g["oge"]:
                continue
            gorulen.add(_kucuk(o["on"]))
            ogeler.append(o)
        if len(ogeler) >= OGE[0]:
            uniteler.append({"baslik": b, "hedef": hedef, "gorev": gorev or None,
                             "ogeler": ogeler})
    if not uniteler:
        return None, "Hiçbir ünite en az %d geçerli öğe taşımadı." % OGE[0]
    return (uniteler, dusen), None


def suz(uniteler, gecen):
    """Kalite kontrolunden gecen duz indeksler -> 6'nin altina inmeyen uniteler."""
    gecen = set(gecen)
    out, i = [], 0
    for u in uniteler:
        kalan = []
        for o in u["ogeler"]:
            if i in gecen:
                kalan.append(o)
            i += 1
        if len(kalan) >= OGE[0]:
            out.append(dict(u, ogeler=kalan))
    return out


def ozet(govde):
    if govde.get("tur") == "gitar":
        return "%d gitar alıştırması (%s). Tempolar referans; kaynaksız, doğrulanmadı." % (
            len(govde["alistirmalar"]), govde["duzey"])
    n = sum(len(u["ogeler"]) for u in govde["uniteler"])
    return "%d ünite, %d öğe (%s %s). Kaynaksız; doğrulanmadı." % (
        len(govde["uniteler"]), n, DILLER[govde["dil"]], govde["duzey"])
