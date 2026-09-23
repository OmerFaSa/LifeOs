# -*- coding: utf-8 -*-
"""Kaynakli arastirma — Arastirma Ofisi v2 (ekip/PLAN.md §3.C).

   Ofis artik yalniz kendi bilgisiyle yazmaz. Is, ritim tiklerine bolunmus
   dort asamadan gecer (core/bam.py):

     plan     Arastirma Mimari alt sorulari ve arama sorgularini yazar
     tarama   Kaynak Tarayici sorgulari web'de arar, adaylari secer
     okuma    Birincil Kaynak Uzmani sayfalari okur (web onbellegine)
     yazim    Arastirma Yazari numarali kaynaklara dayanarak yazar;
              Kaynak Dogrulayici (KOD) her alintiyi kaynakta arar

   Dort kural:

   1. ALINTI KODLA DOGRULANIR. Her bulgu kaynagindan BIREBIR bir parca
      tasir; parca gosterilen kaynakta gecmiyorsa bulgu «dogrulanamadi»
      diye isaretlenir. Modelin «kaynak [2]» demesi yetmez.
   2. KAYITIN ETIKETI OLCULUR. En az bir dogrulanmis bulgu varsa kayit
      «kaynakli»dir; kaynaklar celisiyorsa «celiskili»; hic yoksa
      «dogrulanmadi». Etiketi model secmez.
   3. CESITLILIK. Ayni alan adindan en cok iki kaynak; resmi ve akademik
      alan adlari (gov.tr, edu.tr, int…) one alinir.
   4. SORGUYA KISISEL VERI GIRMEZ (core/web.py) ve sorgu sayisi sinirlidir."""
import re

from core import web

MAX_SORGU = 4
MAX_ADAY = 8
MAX_KAYNAK = 5
ALAN_BASINA = 2
KAYNAK_KARAKTER = 4000
ALINTI = (20, 400)
GUVENLER = ("düşük", "orta", "yüksek")
# Once gelen alan adlari: resmi, akademik, uluslararasi kurum, ansiklopedi.
ONCELIK = (".gov.tr", ".edu.tr", ".gov", ".edu", ".int", ".ac.uk", "wikipedia.org", ".org")

PLAN_SISTEM = """Sen HKM'deki BAM'ın Araştırma Mimarısın. Talebi araştırılabilir 2–5 alt soruya
böl ve bunları cevaplayacak en çok 4 web arama sorgusu yaz. Sorgular kısa ve aranabilir
olsun (3–10 kelime); Türkçe kaynak yetmeyecekse bir sorguyu İngilizce yaz. Sorguya kişisel
bilgi (ad, sağlık durumu, ölçüm) YAZMA; genel konuyu ara.
ÇIKTI: Yalnız şu JSON: {"alt_sorular": ["..."], "sorgular": ["..."]}"""

YAZIM_SISTEM = """Sen HKM'deki BAM'ın Araştırma Yazarısın. Sana numaralı web kaynakları
verilecek. YALNIZ bu kaynaklara dayanarak yaz; kendi bilgini kaynak gibi sunma.

KURALLAR
- Her bulgu için dayandığın kaynak numaralarını yaz.
- Her bulgu için «alinti»: kaynaktan BİREBİR kopyalanmış 20–300 karakterlik bir parça.
  Kod bu parçayı kaynağın metninde arayacak; birebir değilse bulgu «doğrulanamadı» sayılır.
- Kaynaklar birbiriyle çelişiyorsa «celiskiler»e yaz.
- Kaynaklarda olmayan ama talep için gereken bilgiyi «acik_kalanlar»a yaz.
- Teşhis koyma, ilaç ya da doz önerme, sonuç garantisi verme. Türkçe yaz.

ÇIKTI: Yalnız şu JSON:
{"baslik": "...", "ozet": "...", "bulgular": [{"iddia": "...", "kaynaklar": [1],
 "alinti": "...", "guven": "düşük|orta|yüksek"}], "celiskiler": ["..."],
 "acik_kalanlar": ["..."]}"""


def _bosluk(s):
    return re.sub(r"\s+", " ", str(s or "")).strip()


def _norm(s):
    """Alinti karsilastirmasi: buyuk-kucuk harf, bosluk, tirnak ve tire
    farki sayilmaz. Baska hicbir sey esnetilmez."""
    t = str(s or "").replace("I", "ı").replace("İ", "i").lower()
    t = re.sub(r"[“”„«»\"]", '"', t)
    t = re.sub(r"[‘’´`]", "'", t)
    t = re.sub(r"[–—−]", "-", t)
    return re.sub(r"\s+", " ", t).strip()


# ------------------------------------------------------------- plan

def sorgular(d, talep):
    """Modelin sorgularini suzer; hic kalmazsa talebin kendisi aranir."""
    out, gorulen = [], set()
    for s in (d or {}).get("sorgular") or []:
        t, neden = web.sorgu_uygun_mu(s)
        if t and t.lower() not in gorulen:
            gorulen.add(t.lower())
            out.append(t)
        if len(out) >= MAX_SORGU:
            break
    if not out:
        t, _ = web.sorgu_uygun_mu(_bosluk(talep)[:150])
        if t:
            out.append(t)
    return out


def alt_sorular(d):
    return [_bosluk(x)[:300] for x in ((d or {}).get("alt_sorular") or [])
            if _bosluk(x)][:8]


# ----------------------------------------------------------- tarama

def _puan(alan):
    for i, son in enumerate(ONCELIK):
        if alan.endswith(son):
            return i
    return len(ONCELIK)


def aday_sec(sonuclar):
    """Ayni adres bir kez, ayni alan en cok iki kez; oncelikli alan once.
    Sira icinde arama motorunun sirasi korunur."""
    say, gorulen, out = {}, set(), []
    for i, x in enumerate(sonuclar or []):
        u, alan = x.get("url"), x.get("alan") or ""
        if not u or u in gorulen or say.get(alan, 0) >= ALAN_BASINA:
            continue
        gorulen.add(u)
        say[alan] = say.get(alan, 0) + 1
        out.append((_puan(alan), i, x))
    out.sort(key=lambda t: (t[0], t[1]))
    return [{"url": x["url"], "baslik": x.get("baslik") or x["url"], "alan": x.get("alan"),
             "yayin": x.get("yayin")} for _, _, x in out[:MAX_ADAY]]


# ------------------------------------------------------------ yazim

def blok(kaynaklar, metinler):
    """Modele giden numarali kaynak blogu — her kaynaktan en cok
    KAYNAK_KARAKTER. Kaynagin tamami modele gitmez; alinti dogrulamasi
    kaynagin TAMAMINDA yapilir."""
    parca = []
    for k in kaynaklar:
        m = _bosluk(metinler.get(k["n"]) or "")[:KAYNAK_KARAKTER]
        parca.append("[%d] %s — %s (erişim %s%s)\n%s" % (
            k["n"], k["baslik"], k["alan"], k["erisim"],
            (", yayın " + k["yayin"][:10]) if k.get("yayin") else "", m))
    return "\n\n".join(parca)


def alinti_dogru_mu(alinti, metin):
    a = _norm(alinti)
    return ALINTI[0] <= len(a) <= ALINTI[1] and a in _norm(metin)


def bulgular(d, metinler):
    """Modelin bulgularini suzer ve alintilarini KAYNAKTA arar.
    Doner: (bulgular, {"toplam", "dogrulanan"})."""
    out, dogru = [], 0
    for b in ((d or {}).get("bulgular") or [])[:25]:
        if not isinstance(b, dict) or not _bosluk(b.get("iddia")):
            continue
        nlar = []
        for n in b.get("kaynaklar") or []:
            if isinstance(n, int) and not isinstance(n, bool) and n in metinler and n not in nlar:
                nlar.append(n)
        alinti = _bosluk(b.get("alinti"))[:ALINTI[1]]
        tutan = [n for n in nlar if alinti_dogru_mu(alinti, metinler[n])]
        ok = bool(tutan)
        dogru += ok
        out.append({"iddia": _bosluk(b["iddia"])[:600], "kaynaklar": nlar, "alinti": alinti,
                    "dogrulandi": ok, "dogrulayan": tutan,
                    "guven": (b.get("guven") if b.get("guven") in GUVENLER else "belirsiz")
                    if ok else "düşük",
                    "dayanak": "alıntı kaynakta bulundu" if ok else
                               "alıntı gösterilen kaynakta bulunamadı — doğrulanamadı"})
    return out, {"toplam": len(out), "dogrulanan": dogru}


def dogruluk(bulgular_, celiskiler):
    if not any(b["dogrulandi"] for b in bulgular_):
        return "dogrulanmadi"
    return "celiskili" if celiskiler else "kaynakli"


def kaynakca(kaynaklar):
    return [{"n": k["n"], "baslik": k["baslik"], "url": k["url"], "alan": k["alan"],
             "erisim": k["erisim"], "yayin": k.get("yayin")} for k in kaynaklar]


def liste(d, alan, n=10, uzun=300):
    return [_bosluk(x)[:uzun] for x in ((d or {}).get(alan) or []) if _bosluk(x)][:n]
