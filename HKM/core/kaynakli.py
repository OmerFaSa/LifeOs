# -*- coding: utf-8 -*-
"""Kaynakli arastirma — Arastirma Burosu v2 (ekip/PLAN.md §3.C).

   Buro yalniz kendi bilgisiyle yazmaz. Is, ritim tiklerine bolunmus
   asamalardan gecer (core/bam.py); her asamanin ajani adima iz birakir:

     plan     Arastirma Mimari alt sorulari ve arama sorgularini yazar
              (guncellemede onceki surumun sorgulari KODLA yeniden kullanilir)
     tarama   Kaynak Tarayici sorgulari web'de arar; Akademik Kaynak
              Uzmani (KOD) resmi ve akademik alanlari one alir
     okuma    Birincil Kaynak Uzmani sayfalari okur (web onbellegine)
     yazim    Arastirma Yazari numarali kaynaklara dayanarak yazar;
              Kaynak Dogrulayici (KOD) her alintiyi kaynakta arar;
              Kanit Analisti (KOD) her bulgunun kanit gucunu olcer
     derin    Derin Arastirmaci: yazar «acik kalan» biraktiysa en cok iki
              ek sorgu, en cok uc YENI kaynak; yazar taslagi yeni
              kaynaklarla bir kez daha yazar. Tek tur; sonsuz dongu yok.

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

- ÖNCEKİ SÜRÜM verildiyse: hâlâ geçerli bulguyu YENİ kaynaklardan alıntıyla yeniden yaz;
  değişeni, düşeni ve yeni ekleneni «degisiklikler»e kısa cümlelerle yaz.
- İLK TASLAK verildiyse: taslağın doğru bulgularını koru, yeni kaynaklarla açık kalanları
  kapatmaya çalış; kapatamadığını yine «acik_kalanlar»a yaz.

ÇIKTI: Yalnız şu JSON:
{"baslik": "...", "ozet": "...", "bulgular": [{"iddia": "...", "kaynaklar": [1],
 "alinti": "...", "guven": "düşük|orta|yüksek"}], "celiskiler": ["..."],
 "acik_kalanlar": ["..."], "degisiklikler": ["..."]}"""

AJAN = {"mimar": "Araştırma Mimarı", "tarayici": "Kaynak Tarayıcı",
        "akademik": "Akademik Kaynak Uzmanı", "birincil": "Birincil Kaynak Uzmanı",
        "yazar": "Araştırma Yazarı", "dogrulayici": "Kaynak Doğrulayıcı",
        "kanit": "Kanıt Analisti", "celiski": "Çelişki Analisti",
        "derin": "Derin Araştırmacı"}
MAX_DERIN_SORGU = 2
MAX_DERIN_KAYNAK = 3


def iz(ajan, yapti):
    return {"ajan": AJAN.get(ajan, ajan), "yapti": yapti}


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


def kaynak_turu(alan):
    """Akademik Kaynak Uzmani (KOD): alan adindan kaynak turu."""
    a = str(alan or "").lower()
    if re.search(r"(\.gov(\.[a-z]{2})?|\.int|\.mil|\.bel\.tr|\.pol\.tr|\.tsk\.tr)$", a):
        return "resmi"
    if re.search(r"(\.edu(\.[a-z]{2})?|\.ac\.[a-z]{2})$", a) or "dergipark" in a:
        return "akademik"
    if a.endswith("wikipedia.org") or "britannica" in a:
        return "ansiklopedi"
    if re.search(r"\.org(\.[a-z]{2})?$", a):
        return "kurum"
    return "diger"


KANIT_SIRA = {"resmi": 0, "akademik": 1, "ansiklopedi": 2, "kurum": 3, "diger": 4}


def kaynakca(kaynaklar):
    return [{"n": k["n"], "baslik": k["baslik"], "url": k["url"], "alan": k["alan"],
             "erisim": k["erisim"], "yayin": k.get("yayin"), "tur": kaynak_turu(k["alan"])}
            for k in kaynaklar]


def kanit(bulgular_, kaynaklar):
    """Kanit Analisti (KOD). Dogrulanmis her bulguya kanit gucu:
      guclu  iki farkli alan adindan dogrulandi ya da resmi/akademik kaynak
      orta   tek alan; ansiklopedi ya da kurum
      zayif  tek alan; diger
    Dogrulanmamis bulgunun kaniti yoktur. Doner: sayim ozeti (hesaplandi)."""
    alan = {k["n"]: k["alan"] for k in kaynaklar}
    say = {"guclu": 0, "orta": 0, "zayif": 0, "yok": 0}
    for b in bulgular_:
        if not b.get("dogrulandi"):
            b["kanit"] = "yok"
        else:
            alanlar = {alan.get(n) for n in b["dogrulayan"] if alan.get(n)}
            en_iyi = min((KANIT_SIRA[kaynak_turu(a)] for a in alanlar), default=4)
            b["kanit"] = ("guclu" if len(alanlar) >= 2 or en_iyi <= 1 else
                          "orta" if en_iyi <= 3 else "zayif")
        say[b["kanit"]] += 1
    return dict(say, etiket="hesaplandi")


def derin_sorgular(d, onceki_sorgular):
    """Derin Arastirmaci: yazarin acik biraktiklarindan en cok iki yeni
    sorgu. Kisisel veri suzgeci ve sorgu siniri ayni."""
    gorulen = {s.lower() for s in onceki_sorgular or []}
    out = []
    for x in ((d or {}).get("acik_kalanlar") or []):
        t, _ = web.sorgu_uygun_mu(_bosluk(x)[:150])
        if t and t.lower() not in gorulen:
            gorulen.add(t.lower())
            out.append(t)
        if len(out) >= MAX_DERIN_SORGU:
            break
    return out


def onceki_blogu(k):
    """Guncellemede yazara giden onceki surum: yalniz dogrulanmis bulgular."""
    g = (k or {}).get("govde") or {}
    satir = ["- " + b["iddia"] for b in g.get("bulgular") or [] if b.get("dogrulandi")]
    if not satir:
        return ""
    return ("ÖNCEKİ SÜRÜM (kayıt #%d, %s; kaynakları değişti):\n" % (
        k["id"], str(k.get("created_at") or "")[:10]) + "\n".join(satir[:20]))


def taslak_blogu(d):
    satir = ["- %s %s" % (_bosluk(b.get("iddia")), "".join("[%d]" % n for n in b.get("kaynaklar")
                                                           or [] if isinstance(n, int)))
             for b in (d or {}).get("bulgular") or [] if isinstance(b, dict)]
    acik = ["- " + _bosluk(x) for x in (d or {}).get("acik_kalanlar") or []]
    return ("İLK TASLAK\nBulgular:\n" + "\n".join(satir[:25])
            + ("\nAçık kalanlar:\n" + "\n".join(acik[:10]) if acik else ""))


def liste(d, alan, n=10, uzun=300):
    return [_bosluk(x)[:uzun] for x in ((d or {}).get(alan) or []) if _bosluk(x)][:n]


# ------------------------------------------------- arastirma istegi (King)
#
# King'in `bam.arastirma` emrinin govdesi. King arastirma YAPMAZ; konuyu
# Depolama Burosu'na, oradan (gerekirse) Arastirma Burosu'na verir.

def istek_temizle(g):
    """{"konu", "ayrinti"?} -> (temiz, hatalar). Kapali girdi."""
    if not isinstance(g, dict):
        return None, ["arastirma bir nesne olmali"]
    fazla = sorted(set(g) - {"konu", "ayrinti"})
    if fazla:
        return None, ["bilinmeyen alan: %s" % ", ".join(fazla)]
    konu = _bosluk(g.get("konu"))
    if not 3 <= len(konu) <= 200:
        return None, ["konu 3-200 karakter olmali"]
    temiz = {"konu": konu}
    ayrinti = _bosluk(g.get("ayrinti"))
    if ayrinti:
        temiz["ayrinti"] = ayrinti[:400]
    return temiz, []


def istek_talebi(g):
    return g["konu"] + (" — " + g["ayrinti"] if g.get("ayrinti") else "")
