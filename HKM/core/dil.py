# -*- coding: utf-8 -*-
"""Dil — serbest cumleyi KAPALI komut setine esler.

   Patron'un komut seti bilerek kucuk ve kapali: `durum`, `kabul`, `ret`,
   `neden`, `capraz`, `etki`, `yardim`. Ama insan boyle yazmaz; «bugun ne
   yapmaliyim», «son bir haftayi ozetle», «olur kabul» der.

   Bu dosya o bosluga koprudur ve bir DIL MODELI DEGILDIR. Kelime tablosu,
   Turkce'ye uygun bir normallestirme ve bir puanlama ile calisir. Sebebi
   sade: bir modelin niyeti yanlis eslemesi, bir kelime tablosunun yanlis
   eslemesinden daha pahalidir — cunku neden yanlis esledigini kimse
   gosteremez.

   Bes kural:

   1. EMIN DEGILSE UYDURMAZ. Puan esigin altindaysa ya da ilk iki aday
      birbirine cok yakinsa niyet «belirsiz»dir ve Patron «sunu mu demek
      istedin» diye SORAR. Anlamadigini anlamis gibi yapmak, bu depodaki
      en pahali hatadir.

   2. TURKCE'NIN KENDI HARFLERI VAR. JS'in \\w'si gibi Python'un da varsayilan
      kucultmesi «I» harfinde yanilir: «DURUM».lower() sorun degil ama
      «IYI».lower() «ıyı» degil «iyi» olmali. Cevrim tabloyla yapilir.

   3. EK ALIR, KOK KALIR. «durumum», «durumu», «durumla» hep «durum»a
      iner — ama kok en az uc harf kalmak zorunda: «etkisi» → «etki»,
      «ne» → «ne».

   4. ZAMAN AYRI OKUNUR. «dun», «bu hafta», «son 7 gun» bir niyet degil bir
      PARAMETREDIR ve ayri cozulur.

   5. MODEL EKLENIRSE SAYI URETEMEZ. Bu dosyanin sonunda bir kanca var:
      bir model yalnizca KURULMUS cumleyi yeniden ifade edebilir; niyeti
      belirlemek ve sayiyi uretmek kural motorunun isidir.
"""

import datetime
import re
import unicodedata

# Turkce kucultme: I→ı, İ→i. Python'un lower()'i «I» harfini «i» yapar.
KUCULT = {ord("I"): "ı", ord("İ"): "i"}

# Ek listesi — uzundan kisaya. Kok en az UC harf kalmali.
EKLER = ("larimizin", "lerimizin", "larimiz", "lerimiz", "lariniz", "leriniz",
         "larin", "lerin", "ları", "leri", "lar", "ler",
         "imizin", "umuzun", "inin", "unun", "nin", "nın", "nun", "nün",
         "ımız", "imiz", "umuz", "ümüz", "ınız", "iniz",
         "ında", "inde", "unda", "ünde", "ları", "leri",
         "dan", "den", "tan", "ten", "ile", "yla", "yle",
         "da", "de", "ta", "te", "ya", "ye", "yi", "yı", "yu", "yü",
         "sı", "si", "su", "sü", "ım", "im", "um", "üm", "ın", "in", "un",
         "ün", "la", "le", "ı", "i", "u", "ü", "a", "e")

ASGARI_KOK = 3

# Niyet sozlugu: kelime → agirlik. Agirlik, kelimenin o niyete ne kadar
# OZEL oldugunu soyler; «ne» her yerde gecer, «kabul» yalniz bir yerde.
NIYETLER = {
    "durum": {"durum": 3, "brifing": 3, "ozet": 3, "rapor": 2, "bugun": 2,
              "nasil": 1, "ne": 1, "yapmali": 2, "yapsam": 2, "gunum": 2,
              "hafta": 1, "goster": 3, "durumum": 3},
    "etki": {"etki": 3, "fayda": 3, "yariyor": 3, "yaradi": 3, "ise": 2,
             "isliyor": 2, "degisti": 1, "sonuc": 2},
    "capraz": {"capraz": 3, "esleme": 3, "iliski": 3, "baglanti": 2,
               "birlikte": 2, "etkiliyor": 2, "uyku": 1},
    "neden": {"neden": 3, "niye": 3, "dayanak": 3, "kaynak": 3, "nicin": 3,
              "gerekce": 3},
    "kabul": {"kabul": 3, "tamam": 3, "olur": 3, "evet": 3, "onayla": 3,
              "yapalim": 2, "peki": 2},
    "ret": {"ret": 3, "red": 3, "reddet": 3, "hayir": 3, "istemiyorum": 3,
            "yok": 2, "olmaz": 3, "vazgec": 2},
    "yardim": {"yardim": 3, "komut": 3, "yapabilir": 2, "nasil": 1,
               "secenek": 2},
}

ESIK = 3          # en az bu puan
FARK = 1          # ilk iki aday arasinda en az bu fark

# Olumsuzluk — kelime tabanli eslestirmenin en tehlikeli kor noktasi.
# «kabul etmiyorum» cumlesinde «kabul» gecer ve naif bir eslestirici bunu
# ONAY sayar. Bir oneriyi kullanicinin iradesi disinda kabul etmek, bu
# katmanin yapabilecegi en kotu seydir.
#
# Kural asimetriktir ve bilerek oyle:
#   · olumsuzluk + «kabul»  → BELIRSIZ, sorulur (bir kelimelik maliyet)
#   · olumsuzluk + «ret»    → ret kalir (olumsuzluk reddi pekistirir)
OLUMSUZ_KELIME = ("degil", "yok", "olmaz", "vazgectim", "hayir", "istemem")
OLUMSUZ_EK = re.compile(r"m[iıuü]yor|maz\b|mez\b|madim|medim")

ZAMAN = [
    (("bugun",), 0, 1),
    (("dun",), 1, 1),
    (("hafta", "haftalik", "haftayi"), 0, 7),
    (("ay", "aylik", "ayi"), 0, 30),
]


def kucult(metin):
    return str(metin or "").translate(KUCULT).lower()


# Katlama: eslestirme icin aksan duser. Turkce'de aksan harfin kendisidir
# ama kullanici «ozet» de yazar «özet» de, «capraz» da «çapraz» da. Bir
# komut arayuzunun, klavye duzenine gore anlayip anlamamasi kabul edilemez.
# Katlama YALNIZCA eslestirmede kullanilir; kullaniciya donen metin hep
# duzgun Turkce'dir.
KATLA = {"ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u",
         "â": "a", "î": "i", "û": "u", "ê": "e"}


def sadelestir(kelime):
    """Noktalamayi atar, aksani eslestirme icin katlar."""
    k = kucult(kelime)
    k = "".join(KATLA.get(c, c) for c in k)
    return "".join(c for c in k if c.isalnum())


def kok(kelime):
    """Ek soyar, kokten az birakmaz."""
    k = sadelestir(kelime)
    for ek in EKLER:
        if k.endswith(ek) and len(k) - len(ek) >= ASGARI_KOK:
            return k[: -len(ek)]
    return k


def kelimeler(metin):
    ham = re.split(r"[\s,;:.!?/()\[\]\"'«»]+", str(metin or ""))
    return [k for k in (sadelestir(x) for x in ham) if k]


def terimler(metin):
    """Hem KOK hem HAM bicim.

    Ek soyucu kisa kelimelerde fazla yer: «yarin» → «yar», «bugun» → «bug».
    Kok tek basina birakilirsa bu kelimeler hicbir sozlukte bulunamaz.
    Iki bicimi birlikte aramak, soyucunun fazla yedigi yerde de dogru
    cevabi verir ve hicbir eslesmeyi kaybetmez."""
    out = set()
    for k in kelimeler(metin):
        out.add(k)
        out.add(kok(k))
    return out


def zaman(metin):
    """Zaman bir niyet degil bir PARAMETREDIR."""
    ks = terimler(metin)
    m = re.search(r"son\s+(\d{1,3})\s*g", kucult(metin))
    if m:
        n = max(1, min(int(m.group(1)), 365))
        return {"offset": 0, "days": n, "source": "acik"}
    for kelimelistesi, offset, gun in ZAMAN:
        if any(k in ks for k in kelimelistesi):
            return {"offset": offset, "days": gun, "source": "kelime"}
    return {"offset": 0, "days": 1, "source": "varsayilan"}


def puanla(metin):
    ks = terimler(metin)
    puanlar = {}
    for niyet, sozluk in NIYETLER.items():
        p = 0
        eslesen = []
        for kelime, agirlik in sozluk.items():
            if kok(kelime) in ks or sadelestir(kelime) in ks:
                p += agirlik
                eslesen.append(kelime)
        if p:
            puanlar[niyet] = {"score": p, "words": sorted(eslesen)}
    return puanlar


def olumsuz(metin):
    d = kucult(metin)
    if OLUMSUZ_EK.search(d):
        return True
    ks = terimler(metin)
    return any(kok(k) in ks or sadelestir(k) in ks for k in OLUMSUZ_KELIME)


def parse(metin):
    """(niyet, ayrinti). Emin degilse niyet None doner ve adaylar yazilir."""
    puanlar = puanla(metin)
    sirali = sorted(puanlar.items(), key=lambda x: -x[1]["score"])
    ayrinti = {"scores": {k: v["score"] for k, v in puanlar.items()},
               "time": zaman(metin), "candidates": [k for k, _ in sirali[:3]]}
    if not sirali:
        return None, dict(ayrinti, reason="hicbir kelime eslesmedi")
    en, ikinci = sirali[0], (sirali[1] if len(sirali) > 1 else None)
    if en[1]["score"] < ESIK:
        return None, dict(ayrinti, reason="puan esigin altinda")
    if ikinci and en[1]["score"] - ikinci[1]["score"] < FARK:
        return None, dict(ayrinti, reason="iki aday birbirine cok yakin",
                          tie=[en[0], ikinci[0]])
    if en[0] == "kabul" and olumsuz(metin):
        # «kabul etmiyorum» ONAY DEGILDIR ve tahmin edilmez: sorulur.
        return None, dict(ayrinti, reason="olumsuzluk var, onay sayilmaz",
                          tie=["kabul", "ret"])
    return en[0], dict(ayrinti, matched=en[1]["words"], score=en[1]["score"],
                       negation=olumsuz(metin))


# --------------------------------------------------------------- istek
#
# «Yarin iki saat matematik calisacagim» gibi cumleler bir SORU degil bir
# ISTEKTIR. Burada yalnizca SAYILAR ve TANIMLI ALAN ADLARI cikarilir;
# cumlenin geri kalani yorumlanmaz. Cikarim eksikse istek kurulmaz —
# eksik parcayi tahmin etmek, kullanicinin plani ustunde tahmin yurutmektir.
SURE = re.compile(r"(\d+(?:[.,]\d+)?)\s*(saat|dakika|dk)\b")
YAZI_SAYI = {"yarim": 0.5, "bir": 1, "iki": 2, "uc": 3, "dort": 4, "bes": 5,
             "alti": 6, "yedi": 7, "sekiz": 8}
GUN_KAYDIRMA = {"bugun": 0, "yarin": 1, "obur": 2, "oburgun": 2}

ALANLAR = {
    "mat": ("matematik", "mat"), "tr": ("turkce", "paragraf"),
    "fiz": ("fizik",), "kim": ("kimya",), "biy": ("biyoloji",),
    "tar": ("tarih",), "cog": ("cografya",), "geo": ("geometri",),
    "lang": ("dil", "ingilizce", "kelime"), "music": ("muzik", "gitar"),
    "reading": ("okuma", "kitap"), "writing": ("yazi", "yazma"),
}


def sure_dakika(metin):
    """Dakika cinsinden sure. Bulamazsa None — sifir DEGIL."""
    d = kucult(metin)
    m = SURE.search(d)
    if m:
        sayi = float(m.group(1).replace(",", "."))
        return int(round(sayi * (60 if m.group(2) == "saat" else 1)))
    ks = [kok(k) for k in kelimeler(metin)]
    ham = [sadelestir(k) for k in kelimeler(metin)]
    ks = [h if h in YAZI_SAYI else k for k, h in zip(ks, ham)]
    for i, k in enumerate(ks):
        if k in ("saat", "dakika") and i:
            onceki = ks[i - 1]
            if onceki in YAZI_SAYI:
                carpan = 60 if k == "saat" else 1
                return int(round(YAZI_SAYI[onceki] * carpan))
    return None


def gun_kaydirma(metin):
    """«yarin» → +1. Bulamazsa None."""
    ks = terimler(metin)
    for kelime, kayma in GUN_KAYDIRMA.items():
        if kelime in ks:
            return kayma
    return None


def alan(metin):
    ks = terimler(metin)
    for kimlik, kelimeler_ in ALANLAR.items():
        if any(kok(k) in ks or sadelestir(k) in ks for k in kelimeler_):
            return kimlik
    return None


def istek(metin, bugun):
    """Bir plan istegi mi? (varsa sozluk, yoksa None).

    Uc parca aranir: gun, sure, alan. Gun ve sure YOKSA istek kurulmaz;
    eksigi tahmin etmek, kullanicinin plani ustunde tahmin yurutmektir."""
    kayma = gun_kaydirma(metin)
    dakika = sure_dakika(metin)
    if kayma is None or dakika is None:
        return None
    t = datetime.date.fromisoformat(bugun) + datetime.timedelta(days=kayma)
    return {"date": t.isoformat(), "minutes": dakika, "field": alan(metin)}


def cozum_tarihi(bugun, ayrinti):
    """Zaman parametresinden tarih. Ileri tarihe GITMEZ."""
    t = datetime.date.fromisoformat(bugun)
    z = (ayrinti or {}).get("time") or {}
    return (t - datetime.timedelta(days=max(0, int(z.get("offset", 0))))).isoformat()


# ------------------------------------------------------------------ model
#
# Bir dil modeli eklenecekse yeri BURASIDIR ve sozlesmesi tek cumledir:
#
#   Model, KURULMUS bir cumleyi yeniden ifade edebilir. Niyeti belirleyemez,
#   sayi uretemez, veri goremez.
#
# Varsayilan None'dir; kanca bos oldugu surece HKM bugunku gibi calisir.
IFADE_KANCASI = None


def ifade(metin):
    """Cumleyi yeniden ifade eder — kanca yoksa OLDUGU GIBI dondurur.

    Kanca bir sey dondurmezse ya da patlarsa yine orijinal metin doner:
    ifade katmani, bir cumlenin kaybolmasina sebep olamaz."""
    if not IFADE_KANCASI:
        return metin
    try:
        yeni = IFADE_KANCASI(metin)
    except Exception:
        return metin
    return yeni if isinstance(yeni, str) and yeni.strip() else metin
