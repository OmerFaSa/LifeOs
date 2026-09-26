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

# Kok ya da kalip; kucultulmus Turkce metinde aranir. Kelime sonu serbest
# birakilir: «planla», «planlar mısın», «planımı» ayni kokten gelir.
UST_SINYAL = [
    r"yol harita", r"\bkarar\b", r"karar ver", r"hangisini seç", r"hangisi daha iyi",
    r"ne yapmalıyım", r"neye öncelik", r"öncelik(?:lendir|im|ler)", r"strateji",
    r"\bplanla", r"planımı", r"baştan planla", r"yeniden planla", r"program(?:ımı|ı) (?:kur|çıkar|yap)",
    r"bütün sistem", r"tüm sistem", r"sistemin tamam", r"genel değerlendirme",
    r"derinlemesine", r"uzun vadeli", r"önümüzdeki (?:hafta|ay|üç|iki|altı)",
    r"hedef(?:im|imi|lerimi) (?:kur|belirle|gözden geçir)",
]
ORTA_SINYAL = [
    r"öner", r"tavsiye", r"fikir", r"analiz", r"değerlendir", r"yorumla", r"yorum yap",
    r"karşılaştır", r"neden\b", r"niye", r"nasıl geliştir", r"nasıl iyileştir",
    r"ne düşünüyorsun", r"gidişat", r"eğilim", r"ufk", r"geride kal", r"zayıf yan",
    r"güçlü yan", r"ipucu",
]
UZUN_KELIME = 25


def kucult(metin):
    """Turkce kucultme: «İ» → «i», «I» → «ı» (str.lower bunu bilmez)."""
    return str(metin or "").replace("İ", "i").replace("I", "ı").lower()


def _ilk(desenler, metin):
    for d in desenler:
        m = re.search(d, metin)
        if m:
            return m.group(0).strip()
    return None


def sinifla(metin):
    """{seviye, neden}. Model cagirmaz."""
    k = kucult(metin)
    s = _ilk(UST_SINYAL, k)
    if s:
        return {"seviye": UST, "neden": "karar/yol haritası sinyali: «%s»" % s}
    s = _ilk(ORTA_SINYAL, k)
    if s:
        return {"seviye": ORTA, "neden": "öneri/analiz sinyali: «%s»" % s}
    if len(k.split()) > UZUN_KELIME:
        return {"seviye": ORTA, "neden": "sinyal yok ama uzun mesaj (%d kelime)" % len(k.split())}
    return {"seviye": ALT, "neden": "düz sohbet: karar ya da öneri sinyali yok"}
