# -*- coding: utf-8 -*-
"""Planlama Burosu v2 — herhangi bir konu icin haftalik program.

   v1 (core/planlama.py) yalniz SPI kilo planini kurar. v2 genel: «Python'u
   12 haftada, haftada 5 saatle», «KPSS tarihini 8 haftada», «gitarda
   akor gecisleri, gunde 30 dakika». Buronun alt ajanlari:

     Hedef Analisti      (MODEL) konuyu sirali calisma birimlerine boler:
                         agirlik 1-5, onkosul, tahmini saat («tahmin»).
                         Arastirma Burosu'nun dogrulanmis bulgusu varsa
                         birimler ona dayanir.
     Kapasite Analisti   (KOD) toplam sure, ogrenme / tekrar payi, birimin
                         payi; ihtiyac kapasiteyi asiyorsa kac hafta
                         gerektigini hesaplar.
     Program Mimari      (KOD) birimleri sirayla haftalara yerlestirir,
                         buyuk birimi boler, her haftaya bir onceki haftanin
                         tekrarini, son haftaya genel tekrari koyar.
     Simulasyon Uzmani   (KOD) planin %100 / %75 / %50'si yapilirsa ogrenme
                         kac haftada ve hangi tarihte biter.
     Plan Denetcisi      (KOD) gunluk sinir, bos hafta, yerlesmeyen birim,
                         onkosul sirasi, kapasite. KRITIK madde kirilirsa
                         plan teklif edilmez.

   Dort kural:
   1. SAYIYI KOD URETIR. Model birimleri ve agirliklarini yazar; dakika,
      hafta, tarih ve senaryo hesaplanir. Modelin saat tahmini «tahmin»dir
      ve oyle etiketlenir.
   2. GIRDI KAPALIDIR. Hafta ve haftalik sure SORULUR, tahmin edilmez
      (AGENTS.md §1.7).
   3. SINIRLAR: saglik konusunda teshis ve doz yok; sonuc garantisi yok.
   4. GUNLUK SURE 6 SAATI GECMEZ; gecerse plan kurulmaz, nedeni soylenir."""
import datetime
import hashlib
import json
import math
import re

GUNLER = ("pzt", "sal", "car", "per", "cum", "cmt", "paz")
GUN_AD = {"pzt": "Pazartesi", "sal": "Salı", "car": "Çarşamba", "per": "Perşembe",
          "cum": "Cuma", "cmt": "Cumartesi", "paz": "Pazar"}
SEVIYELER = ("baslangic", "orta", "ileri")
HAFTA = (1, 52)
HAFTALIK_DK = (30, 2400)
GUNLUK_EN_COK = 360
TEKRAR_PAYI = 0.15          # 2. haftadan itibaren haftanin tekrar payi
SON_TEKRAR_PAYI = 0.5       # 4+ haftalik planda son haftanin genel tekrari
KAPASITE_ESIGI = 0.8        # ogrenme suresi ihtiyacin bu payinin altindaysa uyari
MAX_BIRIM = 30
DILIM = 5                   # dakikalar 5'in katina yuvarlanir

SISTEM = """Sen HKM'deki BAM'ın Planlama Bürosu'nda Hedef Analistisin. Kullanıcı bir konuyu
belirli bir sürede öğrenmek ya da bitirmek istiyor. Görevin konuyu SIRALI çalışma
birimlerine bölmek. Takvimi, dakikaları ve haftaları SEN yazmazsın; onları kod hesaplar.

KURALLAR
- 3–20 birim yaz; her birim tek oturumda başlanabilecek kadar net olsun.
- Sıra öğrenme sırasıdır: temel önce gelir.
- «agirlik» 1–5: birimin göreli emeği (5 en ağır).
- «onkosul»: bu birimden ÖNCE bitmesi gereken birimlerin sıra numaraları (1'den başlar).
- «tahmini_saat»: bu seviyedeki birinin birimi bitirmesi için kabaca kaç saat gerekir.
  Bilmiyorsan yazma; uydurma.
- «cikti»: birim bitince kişinin yapabileceği somut şey (tek cümle).
- ARAŞTIRMA BULGULARI verildiyse birimleri onlara dayandır.
- Sağlıkla ilgili konuda teşhis koyma, ilaç ya da doz önerme; sonuç garantisi verme.
- Türkçe yaz.

ÇIKTI: Yalnız şu JSON:
{"birimler": [{"ad": "...", "agirlik": 3, "onkosul": [1], "tahmini_saat": 4,
 "cikti": "..."}], "notlar": ["..."]}"""


def _bosluk(s):
    return re.sub(r"\s+", " ", str(s or "")).strip()


def _tamsayi(x, alt, ust):
    if isinstance(x, bool) or not isinstance(x, int) or not alt <= x <= ust:
        return None
    return x


def _yuvarla(dk):
    return int(DILIM * round(float(dk) / DILIM))


def sure_yaz(dk):
    dk = int(round(dk))
    s, d = divmod(dk, 60)
    if s and d:
        return "%d sa %d dk" % (s, d)
    return ("%d sa" % s) if s else ("%d dk" % d)


def _tarih_yaz(d):
    ay = ("Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz",
          "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık")
    return "%d %s %d" % (d.day, ay[d.month - 1], d.year)


# ---------------------------------------------------------------- girdi

def temizle(g):
    """{konu, hafta, haftalik_dk, gunler?, baslangic?, seviye?, ayrinti?,
    kaynakli?} -> (temiz, hatalar). Hafta ve haftalik sure ZORUNLUDUR."""
    if not isinstance(g, dict):
        return None, ["program bir nesne olmalı"]
    izinli = {"konu", "hafta", "haftalik_dk", "gunler", "baslangic", "seviye", "ayrinti",
              "kaynakli"}
    fazla = sorted(set(g) - izinli)
    if fazla:
        return None, ["bilinmeyen alan: %s" % ", ".join(fazla)]
    hatalar = []
    konu = _bosluk(g.get("konu"))
    if not 3 <= len(konu) <= 200:
        hatalar.append("konu 3–200 karakter olmalı")
    hafta = _tamsayi(g.get("hafta"), *HAFTA)
    if hafta is None:
        hatalar.append("hafta 1–52 arasında bir tam sayı olmalı")
    hdk = _tamsayi(g.get("haftalik_dk"), *HAFTALIK_DK)
    if hdk is None:
        hatalar.append("haftalık süre 30–2400 dakika arasında bir tam sayı olmalı")
    gunler = g.get("gunler")
    if gunler is None:
        gunler = list(GUNLER[:5])
    if (not isinstance(gunler, list) or not gunler or any(x not in GUNLER for x in gunler)
            or len(set(gunler)) != len(gunler)):
        hatalar.append("günler pzt…paz kısaltmalarından oluşan bir liste olmalı")
        gunler = []
    bas = g.get("baslangic")
    if bas not in (None, ""):
        try:
            datetime.date.fromisoformat(str(bas))
        except ValueError:
            hatalar.append("başlangıç YYYY-AA-GG biçiminde olmalı")
    seviye = g.get("seviye") or "baslangic"
    if seviye not in SEVIYELER:
        hatalar.append("seviye başlangıç, orta ya da ileri olmalı")
    if "kaynakli" in g and not isinstance(g["kaynakli"], bool):
        hatalar.append("«kaynaklı» evet ya da hayır olmalı")
    if hatalar:
        return None, hatalar
    temiz = {"konu": konu, "hafta": hafta, "haftalik_dk": hdk,
             "gunler": [x for x in GUNLER if x in gunler], "seviye": seviye,
             "kaynakli": bool(g.get("kaynakli", False))}
    if bas:
        temiz["baslangic"] = str(bas)
    if _bosluk(g.get("ayrinti")):
        temiz["ayrinti"] = _bosluk(g["ayrinti"])[:400]
    return temiz, []


def anahtar(temiz):
    g = dict((temiz or {}).get("program") or {})
    g["konu"] = _bosluk(g.get("konu")).lower()
    ham = json.dumps(g, sort_keys=True, ensure_ascii=False)
    return hashlib.sha1(ham.encode("utf-8")).hexdigest()[:20]


def talep(g):
    return "«%s» için %d haftalık program (haftada %s)" % (g["konu"], g["hafta"],
                                                          sure_yaz(g["haftalik_dk"]))


def gunluk_dk(g):
    return g["haftalik_dk"] / float(len(g["gunler"]))


def on_denetim(g):
    """King'in kapisinda, model cagrilmadan: kritik sinirlar."""
    kirik = []
    if gunluk_dk(g) > GUNLUK_EN_COK:
        kirik.append("Günlük süre %s; 6 saati geçen plan kurulmaz. Gün sayısını artır ya da "
                     "haftalık süreyi azalt." % sure_yaz(gunluk_dk(g)))
    return kirik


# ----------------------------------------------------- Hedef Analisti

def istem(g, bulgular_blogu=""):
    satir = ["Konu: " + g["konu"], "Seviye: " + {"baslangic": "başlangıç", "orta": "orta",
                                                 "ileri": "ileri"}[g["seviye"]],
             "Süre: %d hafta, haftada %s" % (g["hafta"], sure_yaz(g["haftalik_dk"]))]
    if g.get("ayrinti"):
        satir.append("Ayrıntı: " + g["ayrinti"])
    if bulgular_blogu:
        satir.append("\nARAŞTIRMA BULGULARI (doğrulanmış)\n" + bulgular_blogu)
    return "\n".join(satir)


def ayikla(d):
    """Modelin birimlerini suzer. Doner: (birimler, notlar, hata)."""
    birimler = []
    for i, b in enumerate(((d or {}).get("birimler") or [])[:MAX_BIRIM]):
        if not isinstance(b, dict) or not _bosluk(b.get("ad")):
            continue
        ag = b.get("agirlik")
        ag = ag if isinstance(ag, int) and not isinstance(ag, bool) and 1 <= ag <= 5 else 2
        ts = b.get("tahmini_saat")
        ts = float(ts) if isinstance(ts, (int, float)) and not isinstance(ts, bool) \
            and 0.25 <= ts <= 500 and math.isfinite(ts) else None
        birimler.append({"ad": _bosluk(b["ad"])[:120], "agirlik": ag, "tahmini_saat": ts,
                         "cikti": _bosluk(b.get("cikti"))[:200], "_ham_onkosul":
                         b.get("onkosul") or [], "_sira": i + 1})
    # Onkosul: modelin sira numaralari suzulmus listeye cevrilir; yalniz
    # ONCE gelen birime isaret edebilir (dongu ve ileri bagimlilik duser).
    yeni_no = {b["_sira"]: n + 1 for n, b in enumerate(birimler)}
    for n, b in enumerate(birimler):
        b["onkosul"] = sorted({yeni_no[x] for x in b.pop("_ham_onkosul")
                               if isinstance(x, int) and x in yeni_no and yeni_no[x] < n + 1})
        b.pop("_sira")
    if len(birimler) < 2:
        return None, [], "Hedef Analisti en az iki çalışma birimi yazmadı."
    notlar = [_bosluk(x)[:300] for x in ((d or {}).get("notlar") or []) if _bosluk(x)][:6]
    return birimler, notlar, None


# ------------------------------------------------------- Kapasite (KOD)

def _haftalik_ogrenme(g, no):
    """Haftanin ogrenmeye kalan dakikasi."""
    h = g["haftalik_dk"]
    if no == 1:
        return h
    if g["hafta"] >= 4 and no == g["hafta"]:
        return h * (1 - SON_TEKRAR_PAYI)
    return h * (1 - TEKRAR_PAYI)


def kapasite(g, birimler):
    toplam = g["hafta"] * g["haftalik_dk"]
    ogrenme = sum(_haftalik_ogrenme(g, i + 1) for i in range(g["hafta"]))
    agirlik = sum(b["agirlik"] for b in birimler)
    # En buyuk kalanla dagitim, 5 dakikalik dilimlerle: toplam ogrenme
    # suresini asmaz, her birim en az bir dilim alir.
    dilim = int(ogrenme // DILIM)
    ham = [dilim * b["agirlik"] / float(agirlik) for b in birimler]
    taban = [int(x) for x in ham]
    for i in sorted(range(len(ham)), key=lambda i: -(ham[i] - taban[i]))[:dilim - sum(taban)]:
        taban[i] += 1
    for b, t in zip(birimler, taban):
        b["dk"] = max(1, t) * DILIM
    out = {"toplam_dk": toplam, "ogrenme_dk": int(round(ogrenme)),
           "tekrar_dk": int(round(toplam - ogrenme)), "gunluk_dk": _yuvarla(gunluk_dk(g)),
           "etiket": "hesaplandi"}
    tahminli = [b for b in birimler if b["tahmini_saat"]]
    if len(tahminli) == len(birimler):
        ihtiyac = sum(b["tahmini_saat"] for b in birimler) * 60
        out["ihtiyac_dk"] = int(round(ihtiyac))
        out["ihtiyac_etiket"] = "tahmin"
        out["oran"] = round(ogrenme / ihtiyac, 2)
        if out["oran"] < KAPASITE_ESIGI:
            hafta_ogrenme = g["haftalik_dk"] * (1 - TEKRAR_PAYI)
            out["gereken_hafta"] = int(math.ceil(ihtiyac / hafta_ogrenme))
    return out


# ---------------------------------------------------- Program Mimari (KOD)

def _pazartesi(bugun):
    return bugun + datetime.timedelta(days=(7 - bugun.weekday()) % 7)


def program_kur(g, birimler, bugun):
    bas = (datetime.date.fromisoformat(g["baslangic"]) if g.get("baslangic")
           else _pazartesi(bugun))
    kalan = [[i, b["dk"]] for i, b in enumerate(birimler)]
    haftalar = []
    for no in range(1, g["hafta"] + 1):
        yer = _haftalik_ogrenme(g, no)
        if no == g["hafta"]:
            yer = float("inf")          # son hafta kalan her seyi alir; denetci olcer
        hafta = {"no": no, "baslangic": (bas + datetime.timedelta(days=7 * (no - 1))).isoformat(),
                 "calisma": [], "tekrar": [], "ogrenme_dk": 0}
        while kalan and yer >= DILIM:
            i, dk = kalan[0]
            al = dk if dk <= yer else int(yer // DILIM) * DILIM
            if al < DILIM:
                break
            parca = sum(1 for h in haftalar for c in h["calisma"] if c["birim"] == i + 1) + 1
            hafta["calisma"].append({"birim": i + 1, "ad": birimler[i]["ad"], "dk": al,
                                     "parca": parca, "devam": al < dk})
            hafta["ogrenme_dk"] += al
            yer -= al
            if al >= dk:
                kalan.pop(0)
            else:
                kalan[0][1] = dk - al
                break
        if no > 1:
            onceki = [c["ad"] for c in haftalar[-1]["calisma"]]
            if g["hafta"] >= 4 and no == g["hafta"]:
                hafta["tekrar"] = ["Genel tekrar: bütün birimler"]
            elif onceki:
                hafta["tekrar"] = ["Tekrar: " + ", ".join(dict.fromkeys(onceki))]
        hafta["tekrar_dk"] = max(0, g["haftalik_dk"] - hafta["ogrenme_dk"]) if no > 1 else 0
        haftalar.append(hafta)
    return haftalar


# ----------------------------------------------------- Simulasyon (KOD)

def simule(g, haftalar):
    ogrenme = sum(h["ogrenme_dk"] for h in haftalar)
    bas = datetime.date.fromisoformat(haftalar[0]["baslangic"])
    def oran(w):                # plan bitince olagan hafta (tekrar payi dusulmus)
        return _haftalik_ogrenme(g, w) if w <= g["hafta"] else \
            g["haftalik_dk"] * (1 - TEKRAR_PAYI)

    out = []
    for uyum in (1.0, 0.75, 0.5):
        birikim, hafta_no = 0.0, 0
        while birikim + 1e-6 < ogrenme and hafta_no < 520:
            hafta_no += 1
            birikim += oran(hafta_no) * uyum
        bitis = bas + datetime.timedelta(days=7 * hafta_no - 1)
        out.append({"uyum": int(uyum * 100), "hafta": hafta_no, "bitis": bitis.isoformat(),
                    "metin": "Uyum %%%d olursa öğrenme %d. haftada biter (%s)."
                             % (int(uyum * 100), hafta_no, _tarih_yaz(bitis))})
    return {"senaryolar": out, "etiket": "hesaplandi"}


# --------------------------------------------------- Plan Denetcisi (KOD)

def denetle(g, birimler, haftalar, kap):
    m = []

    def madde(ad, ok, metin, kritik=False):
        m.append({"ad": ad, "ok": bool(ok), "not": metin, "kritik": kritik})

    gd = gunluk_dk(g)
    madde("gunluk", gd <= GUNLUK_EN_COK, "Günlük süre %s (sınır 6 sa)." % sure_yaz(gd), True)
    yerlesen = {c["birim"] for h in haftalar for c in h["calisma"]}
    eksik = [b["ad"] for i, b in enumerate(birimler) if i + 1 not in yerlesen]
    madde("yerlesim", not eksik, "Bütün birimler haftalara yerleşti." if not eksik else
          "Yerleşmeyen birim: %s." % ", ".join(eksik), True)
    son = haftalar[-1]["ogrenme_dk"]
    tasma = son - _haftalik_ogrenme(g, g["hafta"])
    madde("son_hafta", tasma <= DILIM, "Son hafta sığıyor." if tasma <= DILIM else
          "Son haftaya %s fazla iş kaldı; plan süreye sığmıyor." % sure_yaz(tasma), True)
    bos = [h["no"] for h in haftalar if not h["calisma"] and not h["tekrar"]]
    madde("bos_hafta", not bos, "Boş hafta yok." if not bos else
          "Boş hafta: %s." % ", ".join(map(str, bos)))
    ilk = {}
    for h in haftalar:
        for c in h["calisma"]:
            ilk.setdefault(c["birim"], h["no"])
    ters = [birimler[n - 1]["ad"] for n in ilk for o in birimler[n - 1]["onkosul"]
            if ilk.get(o, 99) > ilk[n]]
    madde("onkosul", not ters, "Önkoşul sırası korunuyor." if not ters else
          "Önkoşulundan önce başlayan: %s." % ", ".join(ters))
    if "oran" in kap:
        yeter = kap["oran"] >= KAPASITE_ESIGI
        madde("kapasite", yeter, "Süre tahmini ihtiyacı karşılıyor (%%%d)." % (kap["oran"] * 100)
              if yeter else "Tahmini ihtiyaç %s, öğrenme süresi %s: yaklaşık %d hafta gerekir "
              "(tahmin)." % (sure_yaz(kap["ihtiyac_dk"]), sure_yaz(kap["ogrenme_dk"]),
                             kap["gereken_hafta"]))
    madde("tekrar", g["hafta"] == 1 or any(h["tekrar"] for h in haftalar),
          "Tekrar payı var (%%%d)." % int(TEKRAR_PAYI * 100) if g["hafta"] > 1 else
          "Tek haftalık planda ayrı tekrar yok.")
    return m


# ------------------------------------------------------------ butun

def kur(g, birimler, notlar, bugun, dayanak=None):
    """Kodun butun isi. Doner: kayit govdesi."""
    kap = kapasite(g, birimler)
    haftalar = program_kur(g, birimler, bugun)
    den = denetle(g, birimler, haftalar, kap)
    return {"tur": "program", "konu": g["konu"], "girdi": g, "birimler": birimler,
            "kapasite": kap, "haftalar": haftalar, "simulasyon": simule(g, haftalar),
            "denetim": den, "gecti": all(x["ok"] for x in den if x["kritik"]),
            "notlar": notlar, "dayanak": dayanak,
            "gunler": [GUN_AD[x] for x in g["gunler"]],
            "etiketler": {"dakika": "hesaplandi", "tahmini_saat": "tahmin",
                          "senaryo": "hesaplandi"}}


# ------------------------------------------------------ serbest cumle

_SAYI = {"bir": 1, "iki": 2, "üç": 3, "dört": 4, "beş": 5, "altı": 6, "yedi": 7, "sekiz": 8,
         "dokuz": 9, "on": 10, "on iki": 12, "yarım": 0.5}
PLAN_TETIK = re.compile(r"\b(plan|program|yol haritası|çalışma takvimi)\w*\s*(?:\w+\s+){0,2}"
                        r"(yap|hazırla|kur|çıkar|oluştur|istiyorum|lazım)\w*", re.I)


def _say(s):
    s = s.strip().lower()
    if s.replace(",", ".").replace(".", "", 1).isdigit():
        return float(s.replace(",", "."))
    return _SAYI.get(s)


GUN_PLANI = ("bugün", "yarın", "bu hafta", "hafta sonu", "bu akşam", "bu gün", "günlük")


def tani(metin):
    """Serbest cumleden program istegi. Tetik yoksa None. Doner:
    {"konu", "hafta"?, "haftalik_dk"?, "eksik": [...]} — eksik varsa SORULUR."""
    m = _bosluk(metin)
    if not m or m.startswith("/") or not PLAN_TETIK.search(m):
        return None
    k = m.lower()
    sayi = r"\b(\d+(?:[.,]\d+)?|bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on|yarım)"
    hafta = None
    r = re.search(sayi + r"\s*(hafta|ay)", k)
    if r and _say(r.group(1)):
        hafta = int(round(_say(r.group(1)) * (4 if r.group(2) == "ay" else 1)))
    hdk = None
    r = re.search(r"haftada\s+" + sayi + r"\s*(saat|sa|dakika|dk)", k)
    if r and _say(r.group(1)):
        hdk = int(round(_say(r.group(1)) * (60 if r.group(2) in ("saat", "sa") else 1)))
    gunler = None
    r = re.search(r"günde\s+" + sayi + r"\s*(saat|sa|dakika|dk)", k)
    if r and _say(r.group(1)) and hdk is None:
        g_dk = _say(r.group(1)) * (60 if r.group(2) in ("saat", "sa") else 1)
        gun_say = 7 if re.search(r"her gün|hafta sonu dahil", k) else 5
        hdk = int(round(g_dk * gun_say))
        gunler = list(GUNLER[:gun_say])
    konu = m
    konu = re.sub(r"(?i)" + sayi + r"\s*(hafta|ay)\w*(\s+içinde|\s+içerisinde|\s+sürede|lık|lik)?",
                  " ", konu)
    konu = re.sub(r"(?i)(haftada|günde)\s+" + sayi + r"\s*(saat|sa|dakika|dk)\w*", " ", konu)
    konu = re.sub(r"(?i)\b(bana|benim için|bir|lütfen|king|için|çalışma|her gün|ile|"
                  r"(plan|program|yol haritası|çalışma takvimi)\w*|"
                  r"(yap|hazırla|kur|çıkar|oluştur|istiyorum|lazım)\w*)\b", " ", konu)
    konu = _bosluk(konu).strip(" .,!?:;'\"«»-")
    if konu.lower() in GUN_PLANI:
        return None                 # «yarin icin plan yap» gunluk plandir, program degil
    eksik = []
    if len(konu) < 3:
        eksik.append("konu")
    if not hafta:
        eksik.append("hafta")
    if not hdk:
        eksik.append("haftalik_dk")
    out = {"konu": konu, "eksik": eksik}
    if hafta:
        out["hafta"] = hafta
    if hdk:
        out["haftalik_dk"] = hdk
    if gunler:
        out["gunler"] = gunler
    return out


EKSIK_SORU = {"konu": "neyi çalışacağını", "hafta": "kaç haftada (ya da ayda) bitirmek istediğini",
              "haftalik_dk": "haftada ne kadar süre ayırabileceğini (ör. «haftada 5 saat» ya da "
                             "«günde 30 dakika»)"}


def eksik_sorusu(eksik):
    parca = [EKSIK_SORU[x] for x in eksik]
    return ("Planı kurmam için %s yazar mısın? Tahminle plan kurmuyorum."
            % (" ve ".join(parca) if len(parca) < 3 else
               ", ".join(parca[:-1]) + " ve " + parca[-1]))
