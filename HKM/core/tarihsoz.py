# -*- coding: utf-8 -*-
"""Turkce zaman ifadeleri — «yarın», «cuma», «hafta sonu», «3 gün sonra»,
«her pazartesi akşam» (King 3.0, K2: beceri ve söz).

   Kural motorudur: tarihi KOD hesaplar, model degil. Anlasilmayan ifade
   tahmin edilmez; None doner ve cagiran sorar ya da hic soz kurmaz.

   Iki is:
     tarih_of(metin, simdi)  -> tek seferlik gun (+ saat): söz icin
     tekrar_of(metin)        -> tekrar eden gunler (+ saat): beceri icin"""
import datetime
import re

GUN_ADLARI = ("pazartesi", "salı", "çarşamba", "perşembe", "cuma", "cumartesi", "pazar")
GUN_AD = ("Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar")
AYLAR = ("ocak", "şubat", "mart", "nisan", "mayıs", "haziran", "temmuz", "ağustos", "eylül",
         "ekim", "kasım", "aralık")
SAYI_SOZ = {"bir": 1, "iki": 2, "üç": 3, "dört": 4, "beş": 5, "altı": 6, "yedi": 7, "sekiz": 8,
            "dokuz": 9, "on": 10, "on beş": 15, "yirmi": 20, "otuz": 30, "kırk": 40, "kırk beş": 45,
            "elli": 50, "altmış": 60, "yarım": 30}
_SAYI = r"(\d{1,3}|on beş|kırk beş|bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on|yirmi|otuz|kırk|elli|altmış)"
# Gun parcasi -> saat (varsayilan; kullanici saat yazarsa o gecer).
GUN_PARCASI = (("sabah", "09:00"), ("öğleden sonra", "15:00"), ("öğlen", "13:00"), ("öğle", "13:00"),
               ("akşam", "20:00"), ("gece", "22:00"))
SORU_SAATI = "20:00"          # soz: olay gunu aksam sorulur

# Gun adi + ek. «pazara» (pazar yeri) gun degildir: pazar yalniz eksiz, «günü» ya da «-a kadar» ile.
_GUN = (r"(pazartesi|salı|çarşamba|perşembe|cumartesi|cuma|pazar)"
        r"(?:(?:ya|ye|a|e)(?= kadar)|ları|leri|günü|ya|ye|si|sı|ı|i|dan|den|tan|ten)?\b")
GUN_RE = re.compile(r"\b(bu |gelecek |önümüzdeki |haftaya |seneye )?" + _GUN)
SAAT_RE = re.compile(r"\bsaat\s*(\d{1,2})(?:[:.](\d{2}))?|\b(\d{1,2})[:.](\d{2})\b")
GECMIS = re.compile(r"\b(dün|geçen|evvelsi|önceki gün)\b")


def kucuk(s):
    """Turkce kucuk harf: «I» -> ı, «İ» -> i."""
    return str(s or "").replace("I", "ı").replace("İ", "i").lower().replace("i̇", "i")


def _sayi(s):
    s = str(s).strip()
    return int(s) if s.isdigit() else SAYI_SOZ.get(s)


def saat_of(metin):
    """«saat 15», «14:30», «saat 3» (öğleden sonra), «akşam» -> "HH:MM" ya da None."""
    t = kucuk(metin)
    m = SAAT_RE.search(t)
    if m:
        h = int(m.group(1) or m.group(3))
        dk = int(m.group(2) or m.group(4) or 0)
        if m.group(1) and h < 7 and "sabah" not in t:
            h += 12
        if 0 <= h <= 23 and 0 <= dk <= 59:
            return "%02d:%02d" % (h, dk)
    for k, v in GUN_PARCASI:
        if re.search(r"\b%s" % k, t):
            return v
    return None


def _pazar(gun):
    return gun + datetime.timedelta(days=6 - gun.weekday())


def tarih_of(metin, simdi):
    """Tek seferlik gelecek zaman. Doner {gun: date, saat: "HH:MM"|None,
    ifade, son: bool} ya da None. `son`: «-e kadar», «içinde» (bitis
    tarihi); degilse olay gunudur. Gecmis («dün», «geçen hafta») None."""
    t = kucuk(metin)
    if GECMIS.search(t):
        return None
    bugun = simdi.date()
    son = bool(re.search(r"\b(kadar|içinde|içerisinde|bitir)", t))
    gun, ifade = None, None
    m = re.search(_SAYI + r"\s*(gün|hafta|ay)\s*(sonra|içinde|içerisinde)", t)
    if m and _sayi(m.group(1)):
        n = _sayi(m.group(1)) * {"gün": 1, "hafta": 7, "ay": 30}[m.group(2)]
        gun, ifade = bugun + datetime.timedelta(days=n), m.group(0)
    if gun is None:
        m = re.search(r"\b(ayın\s+(\d{1,2})|(\d{1,2})\s+(" + "|".join(AYLAR) + r"))"
                      r"(?:['’]?(?:sinde|sında|inde|ında|ünde|unda|nde|nda|de|da|te|ta|si|sı|i|ı|ü|u|e|a))?\b", t)
        if m:
            g = int(m.group(2) or m.group(3))
            ay = AYLAR.index(m.group(4)) + 1 if m.group(4) else bugun.month
            yil = bugun.year
            try:
                d = datetime.date(yil, ay, g)
                if d < bugun:
                    d = (datetime.date(yil + 1, ay, g) if m.group(4)
                         else datetime.date(yil + (ay == 12), ay % 12 + 1, g))
                gun, ifade = d, m.group(0)
            except ValueError:
                return None
    if gun is None:
        m = GUN_RE.search(t)
        if m:
            hedef = GUN_ADLARI.index(m.group(2))
            ileri = (hedef - bugun.weekday()) % 7 or 7
            if m.group(1) in ("gelecek ", "önümüzdeki ", "haftaya "):
                ileri = 7 - bugun.weekday() + hedef           # gelecek haftanin o gunu
            if m.group(1) == "bu " and hedef == bugun.weekday():
                ileri = 0
            gun, ifade = bugun + datetime.timedelta(days=ileri), m.group(0).strip()
    if gun is None:
        for desen, f, kesin_son in (
                (r"\böbür ?gün\b|\bertesi gün\b", lambda: bugun + datetime.timedelta(days=2), False),
                (r"\byarın", lambda: bugun + datetime.timedelta(days=1), False),
                (r"\bhafta ?sonu", lambda: _pazar(bugun), False),
                (r"\bbu hafta\b", lambda: _pazar(bugun), True),
                (r"\b(haftaya|gelecek hafta|önümüzdeki hafta)\b",
                 lambda: _pazar(bugun) + datetime.timedelta(days=7), False),
                (r"\b(ay sonuna|bu ay)\b",
                 lambda: datetime.date(bugun.year + (bugun.month == 12), bugun.month % 12 + 1, 1)
                 - datetime.timedelta(days=1), True),
                (r"\b(bugün|bu akşam|bu sabah|bu öğle|bu gece|birazdan)\b", lambda: bugun, False)):
            m = re.search(desen, t)
            if m:
                gun, ifade, son = f(), m.group(0), son or kesin_son
                break
    if gun is None:
        return None
    return {"gun": gun, "saat": saat_of(t), "ifade": ifade, "son": son}


def soru_ani(z, simdi):
    """Söz icin sorma ani (datetime). Olay saatliyse iki saat sonra (gec
    saatse ertesi sabah), saatsizse olay gunu aksam; gecmisteyse bir saat sonra."""
    if z["saat"] and not z["son"]:
        h, dk = map(int, z["saat"].split(":"))
        an = datetime.datetime.combine(z["gun"], datetime.time(h, dk)) + datetime.timedelta(hours=2)
        if an.hour >= 23 or an.date() > z["gun"]:
            an = datetime.datetime.combine(z["gun"] + datetime.timedelta(days=1), datetime.time(10, 0))
    else:
        h, dk = map(int, SORU_SAATI.split(":"))
        an = datetime.datetime.combine(z["gun"], datetime.time(h, dk))
    if an <= simdi:
        an = (simdi + datetime.timedelta(hours=1)).replace(second=0, microsecond=0)
    return an


TEKRAR_RE = re.compile(
    r"\b(?:her\s+(gün|sabah|akşam|gece|öğlen|hafta içi|hafta sonu|"
    r"(?:(?:pazartesi|salı|çarşamba|perşembe|cumartesi|cuma|pazar)(?:\s*(?:,|ve)\s*)?)+)"
    r"|(hafta içi(?: her gün)?|hafta sonları)"
    r"|((?:pazartesi|salı|çarşamba|perşembe|cumartesi|cuma|pazar)(?:ları|leri)))\b")


def tekrar_of(metin):
    """Tekrar eden zaman. Doner {gunler: [0-6] (bos = her gün), saat|None,
    ifade} ya da None."""
    t = kucuk(metin)
    m = TEKRAR_RE.search(t)
    if not m:
        return None
    ifade = m.group(0)
    parca = m.group(1) or m.group(2) or m.group(3) or ""
    if "hafta içi" in parca:
        gunler = [0, 1, 2, 3, 4]
    elif "hafta sonu" in parca or "hafta sonları" in parca:
        gunler = [5, 6]
    else:
        gunler = sorted({GUN_ADLARI.index(g) for g in re.findall(
            r"pazartesi|salı|çarşamba|perşembe|cumartesi|cuma|pazar", parca)})
    saat = None
    for k, v in GUN_PARCASI:
        if parca == k:
            saat = v
    return {"gunler": gunler, "saat": saat, "ifade": ifade}


def gunler_metni(gunler):
    if not gunler:
        return "Her gün"
    if gunler == [0, 1, 2, 3, 4]:
        return "Hafta içi her gün"
    if gunler == [5, 6]:
        return "Hafta sonları"
    return "Her " + ", ".join(GUN_AD[g].lower() for g in gunler)


def an_metni(an, simdi):
    """«yarın 20:00», «cuma 20:00», «25 Ekim 20:00» — ekran icin."""
    fark = (an.date() - simdi.date()).days
    saat = an.strftime("%H:%M")
    if fark == 0:
        return "bugün " + saat
    if fark == 1:
        return "yarın " + saat
    if 1 < fark < 7:
        return "%s %s" % (GUN_AD[an.weekday()].lower(), saat)
    return "%d %s %s" % (an.day, AYLAR[an.month - 1].capitalize(), saat)
