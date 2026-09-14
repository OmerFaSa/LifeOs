# -*- coding: utf-8 -*-
"""Niyet kuyrugu — HKM'nin YETKI ALMADAN is baslatmasi.

   «Yarin iki saat matematik calismak istiyorum» istegi, HKM'nin AYS'ye
   yazmasi demek olurdu. Bu, uc sistemin en temel kuralini kirardi:

     AYS/SPI/ESP, HKM'nin var oldugunu BILMEZ ve o kapaliyken bozulmaz.

   Cozum sahip degistirmektir: HKM bir NIYET yazar; modul acilista kuyrugu
   sorar, kullaniciya gosterir ve onaylanirsa KENDI kodu ile uygular.
   Yazan yine moduldur, HKM degil.

   Dort kural:

   1. NIYET BIR EMIR DEGIL BIR TEKLIFTIR. Modul onu uygulamak ZORUNDA
      degildir ve kullanici gormeden hicbir sey olmaz.

   2. TANIMLI TURLER DISINDA NIYET YOK. Kuyruk serbest bir uzaktan komut
      kanali degildir; her tur, modulun ne yapacagini bilerek yazdigi bir
      sozlesmedir. Bilinmeyen tur REDDEDILIR.

   3. GORULMEMIS ILE REDDEDILMIS AYRI SEYLERDIR. «delivered» modulun
      gordugu, «dismissed» kullanicinin istemedigi demektir; ikisini ayni
      saymak, sessiz bir basarisizligi basari gibi gosterir.

   4. KUYRUK KISA TUTULUR. Ayni modul icin ayni tur ve ayni govdeyle acik
      bir niyet varsa ikincisi YAZILMAZ: tekrar, bilgi degil gurultudur.

   5. ACIK NIYET, CEVAPLANANA KADAR ACIKTIR. Kuyrugu sormak bir cevap
      degildir; modul teklifi bir kez gosterdikten sonra kullanici sayfayi
      yenilerse teklif YENIDEN gelir. Aksi halde gorulmus ama cevaplanmamis
      bir teklif sessizce kaybolur ve merkez onu sonsuza kadar bekler.
"""

import datetime

from core import db

MODULES = ("ays", "spi", "esp")

# Sozlesme: her tur, modulun anlayacagi alanlari ve zorunlu olanlari yazar.
KINDS = {
    "plan.add": {
        "modules": ("ays", "esp"),
        "required": ("date", "minutes"),
        "optional": ("subject", "topic", "disc", "why"),
        "note": "Belirli bir gune calisma blogu teklifi.",
    },
    "focus.set": {
        "modules": ("ays", "esp"),
        "required": ("date", "focus"),
        "optional": ("why",),
        "note": "Gunun odagini bir alana cevirme teklifi.",
    },
    "load.reduce": {
        "modules": ("ays", "esp", "spi"),
        "required": ("date",),
        "optional": ("ratio", "why"),
        "note": "Gunun yukunu azaltma teklifi (oran verilmezse modul karar verir).",
    },
    "measure.ask": {
        "modules": ("spi",),
        "required": ("date", "metric"),
        "optional": ("why",),
        "note": "Eksik bir olcumun girilmesini hatirlatma teklifi.",
    },
}


# Alan sozlesmesi: yalniz «var mi» degil, NE OLDUGU da denetlenir.
# Bozuk bir niyetin kuyruga girmesi, merkez sozlesmesini zayiflatir:
# date:"banana" ve minutes:-90 tasiyan bir teklif, arayuz ayrica
# denetlese bile kuyrukta durmamali.
FIELD_RULES = {
    "date": "date", "minutes": ("int", 5, 480), "ratio": ("float", 0.05, 1.0),
    "focus": ("str", 1, 40), "subject": ("str", 1, 40), "topic": ("str", 1, 80),
    "disc": ("str", 1, 24), "metric": ("str", 1, 40), "why": ("str", 1, 200),
}


def _alan_hatasi(ad, deger):
    kural = FIELD_RULES.get(ad)
    if not kural:
        return None
    if kural == "date":
        if not isinstance(deger, str) or len(deger) != 10:
            return "%s ISO yyyy-mm-dd olmali" % ad
        try:
            datetime.date.fromisoformat(deger)
        except ValueError:
            return "%s gercek bir takvim gunu olmali: %r" % (ad, deger)
        return None
    tur = kural[0]
    if tur == "int":
        if isinstance(deger, bool) or not isinstance(deger, int):
            return "%s tam sayi olmali" % ad
        if not (kural[1] <= deger <= kural[2]):
            return "%s %s-%s araliginda olmali (gelen: %r)" % (ad, kural[1],
                                                              kural[2], deger)
        return None
    if tur == "float":
        if isinstance(deger, bool) or not isinstance(deger, (int, float)):
            return "%s sayi olmali" % ad
        if not (kural[1] <= deger <= kural[2]):
            return "%s %s-%s araliginda olmali" % (ad, kural[1], kural[2])
        return None
    if not isinstance(deger, str) or not (kural[1] <= len(deger.strip()) <= kural[2]):
        return "%s %s-%s karakterlik bir metin olmali" % (ad, kural[1], kural[2])
    return None


def validate(module, kind, payload):
    hata = []
    if module not in MODULES:
        hata.append("bilinmeyen modul: %s" % module)
    tanim = KINDS.get(kind)
    if not tanim:
        # Kuyruk serbest bir uzaktan komut kanali DEGILDIR.
        return False, ["bilinmeyen niyet turu: %s" % kind]
    if module not in tanim["modules"]:
        hata.append("%s turu %s modulunde tanimli degil" % (kind, module))
    if not isinstance(payload, dict):
        return False, hata + ["govde bir nesne olmali"]
    for alan in tanim["required"]:
        if alan not in payload:
            hata.append("zorunlu alan eksik: %s" % alan)
    izinli = set(tanim["required"]) | set(tanim["optional"])
    for alan, deger in payload.items():
        if alan not in izinli:
            hata.append("bilinmeyen alan: %s" % alan)
            continue
        sorun = _alan_hatasi(alan, deger)
        if sorun:
            hata.append(sorun)
    return (not hata), hata


def _ayni_var_mi(con, module, kind, payload):
    for n in db.intents_for(con, module, ("pending", "delivered")):
        if n["kind"] == kind and n["payload"] == payload:
            return n
    return None


def create(con, module, kind, payload, note, source="patron"):
    ok, hata = validate(module, kind, payload)
    if not ok:
        return {"ok": False, "errors": hata}
    var = _ayni_var_mi(con, module, kind, payload)
    if var:
        # Tekrar, bilgi degil gurultudur.
        return {"ok": True, "intent": var, "duplicate": True}
    nid = db.insert_intent(con, module, kind, payload, note, source)
    return {"ok": True, "intent": db.intent(con, nid), "duplicate": False}


def take(con, module):
    """Modul kuyrugu SORAR: ACIK niyetlerin TAMAMI doner.

    Once yalniz «pending» donuyordu ve alinanlar «delivered» isaretleniyordu.
    Sonuc, gorulen ama HENUZ CEVAPLANMAMIS bir teklifin ikinci acilista
    KAYBOLMASIYDI: kullanici sayfayi yenilerse teklif bir daha gelmiyor,
    merkezde ise sonsuza kadar «delivered» olarak asili kaliyordu.

    «Teslim edildi» ile «cevaplandi» ayri seylerdir. Kuyruk, cevaplanana
    kadar ACIK kalir; teslim isareti yalnizca ilk gorulmeyi tarihler.
    """
    if module not in MODULES:
        return {"ok": False, "errors": ["bilinmeyen modul"]}
    acik = db.intents_for(con, module, ("pending", "delivered"))
    yeni = 0
    for n in acik:
        if n["state"] == "pending":
            db.set_intent_state(con, n["id"], "delivered")
            n["state"] = "delivered"
            yeni += 1
    return {"ok": True, "intents": acik, "new": yeni,
            "again": len(acik) - yeni,
            "note": "Bu niyetler birer TEKLIFTIR. Kullanıcı görmeden hiçbir "
                    "şey uygulanmaz; uygulayan da HKM değil modülün kendisidir."}


# Cevap DORT sonuctan biridir ve dordu birbirine indirgenmez:
#
#   applied      — modul teklifi KENDI koduyla uyguladi
#   acknowledged — teklif goruldu ama modul uygulamadi; cunku o modulde
#                  uygulamak kullanicinin isi. SPI'de bir olcumu girmek ya
#                  da yuku dusurmek hicbir kosulda sistemin karari degildir.
#   dismissed    — istenmedi
#   unknown      — uygulama YARIDA kaldi (sekme kapandi, cihaz kapandi) ve
#                  sonuc bilinmiyor
#
# Sonuncusu bir kacamak degil bir OLCUMDUR: «applied» yazmak yapilmamis bir
# isi yapilmis, «dismissed» yazmak olmus olabilecek bir isi yok saymak
# olurdu. Ayni sekilde «acknowledged»i «applied» saymak, modulun yapmadigi
# bir isi yapmis gostermek olurdu.
ANSWERS = ("applied", "acknowledged", "dismissed", "unknown")


def answer(con, intent_id, state):
    if state not in ANSWERS:
        return {"ok": False,
                "errors": ["durum yalniz %s olabilir" % ", ".join(ANSWERS)]}
    n = db.intent(con, intent_id)
    if not n:
        return {"ok": False, "errors": ["niyet yok"]}
    if n["state"] == state:
        # AYNI cevabin tekrari HATA DEGILDIR. Modul, baglanti koptugu icin
        # bildiremedigi bir cevabi sonra tekrar dener; bunu 409 ile geri
        # cevirmek, dogru calisan bir istemciyi basarisiz gostermek olurdu.
        # Sonuc ayni: niyet zaten o durumda.
        return {"ok": True, "intent": n, "duplicate": True}
    if n["state"] in ANSWERS:
        # FARKLI bir cevap ise catisma gercektir: uygulanmis bir teklifi
        # «istenmedi» yapmak, olmus bir isi olmamis gibi gostermektir.
        return {"ok": False, "errors": ["bu niyet zaten %s" % n["state"]],
                "intent": n}
    return {"ok": True, "intent": db.set_intent_state(con, intent_id, state)}


def summary(con):
    out = {}
    for mod in MODULES:
        out[mod] = {d: len(db.intents_for(con, mod, (d,)))
                    for d in db.INTENT_STATES}
    return out
