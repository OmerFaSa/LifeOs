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
      `bam` ve `seed` etiketiyle tasir."""
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


def temizle(govde):
    """Is emri govdesi: {dil, duzey, konu, unite?, oge?}. (temiz, hatalar)."""
    if not isinstance(govde, dict):
        return None, ["ünite bir nesne olmalı"]
    hata = []
    for k in govde:
        if k not in ("dil", "duzey", "konu", "unite", "oge"):
            hata.append("ünite: bilinmeyen alan %s" % k)
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


def anahtar(temiz):
    g = temiz["unite"]
    ham = json.dumps([g["dil"], g["duzey"], _kucuk(g["konu"]), g["unite"], g["oge"]],
                     ensure_ascii=False)
    return hashlib.sha1(ham.encode("utf-8")).hexdigest()[:16]


def talep(g):
    return "%s %s — «%s» (%d ünite × %d öğe)" % (DILLER[g["dil"]], g["duzey"], g["konu"],
                                                  g["unite"], g["oge"])


def konu(g):
    return "ünite %s %s %s" % (g["dil"], g["duzey"], g["konu"])


def baslik(g):
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
    n = sum(len(u["ogeler"]) for u in govde["uniteler"])
    return "%d ünite, %d öğe (%s %s). Kaynaksız; doğrulanmadı." % (
        len(govde["uniteler"]), n, DILLER[govde["dil"]], govde["duzey"])
