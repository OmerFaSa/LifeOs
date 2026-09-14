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
"""

import json

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
    for alan in payload:
        if alan not in izinli:
            hata.append("bilinmeyen alan: %s" % alan)
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
    """Modul kuyrugu SORAR. Alinan niyetler «delivered» olur — ama bu
    «uygulandi» demek DEGILDIR."""
    if module not in MODULES:
        return {"ok": False, "errors": ["bilinmeyen modul"]}
    bekleyen = db.intents_for(con, module, ("pending",))
    for n in bekleyen:
        db.set_intent_state(con, n["id"], "delivered")
    return {"ok": True, "intents": bekleyen,
            "note": "Bu niyetler birer TEKLIFTIR. Kullanıcı görmeden hiçbir "
                    "şey uygulanmaz; uygulayan da HKM değil modülün kendisidir."}


def answer(con, intent_id, state):
    if state not in ("applied", "dismissed"):
        return {"ok": False, "errors": ["durum yalniz applied ya da dismissed"]}
    n = db.intent(con, intent_id)
    if not n:
        return {"ok": False, "errors": ["niyet yok"]}
    if n["state"] in ("applied", "dismissed"):
        return {"ok": False, "errors": ["bu niyet zaten %s" % n["state"]],
                "intent": n}
    return {"ok": True, "intent": db.set_intent_state(con, intent_id, state)}


def summary(con):
    out = {}
    for mod in MODULES:
        out[mod] = {d: len(db.intents_for(con, mod, (d,)))
                    for d in db.INTENT_STATES}
    return out
