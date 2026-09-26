# -*- coding: utf-8 -*-
"""Konusma seviyesi — bir mesajin hangi modele gidecegini KOD secer.

   Uc seviye, maliyetle birlikte buyur:

     alt   karar icermeyen duz sohbet: selam, tesekkur, gunluk laf.
           Sistemle ilgili olabilir ama bir karar ya da oneri istemez.
     orta  ufuk genisletme, oneri, «beni analiz et», yorum, karsilastirma.
     ust   bizi bir KARARA goturen is: yol haritasi, plan, strateji,
           oncelik, «hangisini secmeliyim», sistemin tamamini degerlendirme.

   Dort kural:

   1. SINIFLANDIRMA MODELSIZDIR. Seviyeyi secmek icin bir model cagirmak,
      ucuzlatmak istedigimiz cagriyi iki kez yapmak olurdu; ustelik secimi
      kural motoru degil model yapmis olurdu (AGENTS.md §1.1).
   2. PAHALI SINYAL KAZANIR. «Analiz edip karar ver» ust'tur: karar
      isteyen mesaji ucuz modele vermek anlami kacirir.
   3. BELIRSIZ UZUN MESAJ ORTAYA GIDER. Sinyal tasimayan uzun bir mesaj
      icin ust pahali, alt ise anlami kacirma riskidir (§1.7).
   4. NEDEN SOYLENIR. Hangi kelimenin seviyeyi sectigi donulur; deftere
      ve ekrana yazilir — «neden pahali modele gitti» sorusu cevapsiz
      kalmaz."""

import re

ALT, ORTA, UST = "alt", "orta", "ust"
SEVIYELER = (ALT, ORTA, UST)

# Kok ya da kalip; kucultulmus ve ASCII'ye katlanmis metinde aranir
# (telefonda «ne yapmaliyim» diye yazilir). Kalipler okunur olsun diye
# Turkce yazilir, yuklenirken ayni katlamadan gecer. Kelime sonu serbest
# birakilir: «planla», «planlar mısın», «planımı» ayni kokten gelir.
UST_SINYAL = [
    r"yol harita", r"\bkarar\b", r"karar ver", r"hangisini seç", r"hangisi daha",
    r"ne yapmalıyım", r"ne yapay[ıi]m", r"ne yapsam", r"neye öncelik", r"öncelik",
    r"strateji", r"\bplanla", r"planımı", r"\bplan (?:yap|çıkar|kur|hazırla)",
    r"(?:haftalık|aylık|günlük) plan", r"program(?:ımı|ı) (?:kur|çıkar|yap)",
    r"bütün sistem", r"tüm sistem", r"sistemin tamam", r"genel değerlendirme",
    r"derinlemesine", r"uzun vadeli", r"önümüzdeki (?:hafta|ay|üç|iki|altı)",
    r"hedef(?:im|imi|lerimi) (?:kur|belirle|gözden geçir)",
]
ORTA_SINYAL = [
    r"öner", r"tavsiye", r"fikir", r"analiz", r"değerlendir", r"yorumla", r"yorum yap",
    r"karşılaştır", r"neden\b", r"niye", r"geliştir", r"iyileştir",
    r"ne düşünüyorsun", r"ne dersin", r"\bsence\b", r"gidişat", r"eğilim", r"ufk",
    r"geride kal", r"zayıf yan", r"güçlü yan", r"ipucu",
]
# Istek olmayan kaliplar: karar BILDIRMEK karar istemek degildir. Eslesmeden
# once metinden cikarilir; ayni cumlede gercek bir istek varsa o yine tutar.
BILDIRIM = [r"karar verdim", r"karar aldım", r"neden olmasın"]
UZUN_KELIME = 25

_ASCII = str.maketrans("çğıöşüâîû", "cgiosuaiu")


def kucult(metin):
    """Turkce kucultme («İ» → «i», «I» → «ı»; str.lower bunu bilmez), sonra
    ASCII'ye katlama: «yapmalıyım» ile «yapmaliyim» ayni metin olur."""
    k = str(metin or "").replace("İ", "i").replace("I", "ı").lower()
    return k.translate(_ASCII)


def _katla(desenler):
    return [re.compile(kucult(d)) for d in desenler]


_UST, _ORTA, _BILDIRIM = _katla(UST_SINYAL), _katla(ORTA_SINYAL), _katla(BILDIRIM)


def _ilk(desenler, metin, asil):
    """Ilk eslesen kalip — nedende kullanicinin KENDI yazdigi haliyle
    (katlama harf harf yapildigi icin konumlar asil metinle aynidir)."""
    for d in desenler:
        m = d.search(metin)
        if m:
            return asil[m.start():m.end()].strip()
    return None


def sinifla(metin):
    """{seviye, neden}. Model cagirmaz."""
    asil = str(metin or "")
    k = kucult(asil)
    if len(k) != len(asil):                 # beklenmedik harf: konumlar kayar
        asil = k
    for d in _BILDIRIM:
        k = d.sub(lambda m: " " * len(m.group(0)), k)
    s = _ilk(_UST, k, asil)
    if s:
        return {"seviye": UST, "neden": "karar/yol haritası sinyali: «%s»" % s}
    s = _ilk(_ORTA, k, asil)
    if s:
        return {"seviye": ORTA, "neden": "öneri/analiz sinyali: «%s»" % s}
    if len(k.split()) > UZUN_KELIME:
        return {"seviye": ORTA, "neden": "sinyal yok ama uzun mesaj (%d kelime)" % len(k.split())}
    return {"seviye": ALT, "neden": "düz sohbet: karar ya da öneri sinyali yok"}
