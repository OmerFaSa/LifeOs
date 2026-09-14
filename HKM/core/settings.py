# -*- coding: utf-8 -*-
"""Yonetim — ayarlarin OKUNMASI, DOGRULANMASI ve yazilmasi.

   config.json'u elle duzenlemek bir teknik ayrintidir ve kullaniciya
   yansitilmamali; ama ayari bir arayuze acmak, o arayuzu yeni bir saldiri
   yuzeyi yapar. Dort kural:

   1. SIR OKUNMAZ. Jeton, uygulama sirri ve bot jetonu disari MASKELI
      cikar: «kurulu mu» bilgisi verilir, degerin kendisi verilmez. Bir
      ayar ekrani, sirri ekranda goruntulemek zorunda degildir.

   2. JETON BURADAN DEGISMEZ. local_token bir ayar degil bir KIMLIKTIR;
      onu API uzerinden degistirebilmek, jetonu bilen birinin jetonu
      degistirebilmesi demektir. Degisimi kur.py ve dosya yapar.

   3. DOGRULANMAYAN DEGER YAZILMAZ. Esik bir sayidir, izin listesi bir
      dizedir, kanal bayragi bir booldur. Tip tutmuyorsa istek REDDEDILIR
      ve hicbir sey yazilmaz — yarim yazilmis bir yapilandirma, bozuk bir
      yapilandirmadir.

   4. BILINMEYEN ALAN SESSIZCE YUTULMAZ. Tanimadigi bir anahtar gelirse
      reddedilir: sessizce yok sayilan bir ayar, kullaniciya «kaydedildi»
      der ve hicbir sey yapmaz.
"""

import copy
import json
import os
import re

from core import channels, schedule, thresholds

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(ROOT, "config.json")

GIZLI = ("local_token", "token", "app_secret", "verify_token", "bot_token",
         "webhook_secret")

# Esiklerin makul araliklari. Disarida kalan bir deger REDDEDILIR:
# «uyku tabani 40 saat» diyen bir yapilandirma, VP'yi sessizce susturur.
THRESHOLD_RANGE = {
    "bio": {"sleep_hours_min": (3.0, 12.0), "sleep_hours_critical": (1.0, 10.0),
            "hrv_drop_pct": (1.0, 90.0), "recovery_floor": (1.0, 99.0)},
    "academic": {"questions_min": (1, 2000), "study_minutes_min": (1, 1440),
                 "net_drop_pct": (1.0, 90.0)},
    "intellect": {"retention_floor": (0.05, 0.99), "retention_min_cards": (1, 500),
                  "practice_minutes_min": (1, 1440), "synthesis_gap_days": (1, 365)},
}

SCHEDULE_FIELDS = {
    "enabled": bool, "channel": str, "morning": str, "evening": str,
    "weekly_day": str, "weekly_time": str, "tolerance_minutes": int,
}

SAAT = re.compile(r"^(?:[01]\d|2[0-3]):[0-5]\d$")

CHANNEL_FIELDS = {
    "enabled": bool,
    "phone_number_id": str, "token": str, "app_secret": str, "verify_token": str,
    "bot_token": str, "webhook_secret": str,
    "allow_from": list, "api_base": str,
}


def mask(value):
    if not value:
        return {"set": False, "value": ""}
    return {"set": True, "value": "••••••" + str(value)[-2:]}


def read(cfg):
    """Disari cikan yapilandirma — sirlar MASKELI."""
    out = {"host": cfg.get("host", "127.0.0.1"), "port": cfg.get("port", 4200),
           "local_token": mask(cfg.get("local_token")),
           "thresholds": thresholds.from_config(cfg), "channels": {}}
    for ad in ("whatsapp", "telegram"):
        a = channels.settings(cfg, ad)
        kanal = {}
        for k, v in a.items():
            kanal[k] = mask(v) if k in GIZLI else v
        kanal["ready"] = channels.enabled(cfg, ad)
        out["channels"][ad] = kanal
    out["schedule"] = schedule.settings(cfg)
    out["ranges"] = THRESHOLD_RANGE
    return out


def validate(patch):
    """(ok, hatalar). Hicbir sey duzeltmez, yalnizca isaretler."""
    hata = []
    if not isinstance(patch, dict):
        return False, ["gövde bir nesne olmalı"]
    for k in patch:
        if k not in ("thresholds", "channels", "schedule"):
            hata.append("bilinmeyen alan: %s" % k)

    for grup, alanlar in (patch.get("thresholds") or {}).items():
        if grup not in THRESHOLD_RANGE:
            hata.append("bilinmeyen eşik grubu: %s" % grup)
            continue
        if not isinstance(alanlar, dict):
            hata.append("%s bir nesne olmalı" % grup)
            continue
        for ad, deger in alanlar.items():
            aralik = THRESHOLD_RANGE[grup].get(ad)
            if not aralik:
                hata.append("bilinmeyen eşik: %s.%s" % (grup, ad))
                continue
            if isinstance(deger, bool) or not isinstance(deger, (int, float)):
                hata.append("%s.%s bir sayı olmalı" % (grup, ad))
                continue
            if not (aralik[0] <= deger <= aralik[1]):
                hata.append("%s.%s %s–%s aralığında olmalı (gelen: %s)"
                            % (grup, ad, aralik[0], aralik[1], deger))

    zaman = patch.get("schedule")
    if zaman is not None:
        if not isinstance(zaman, dict):
            hata.append("schedule bir nesne olmalı")
        else:
            for k, v in zaman.items():
                tip = SCHEDULE_FIELDS.get(k)
                if tip is None:
                    hata.append("bilinmeyen zamanlama alanı: %s" % k)
                elif tip is bool and not isinstance(v, bool):
                    hata.append("schedule.%s bir bool olmalı" % k)
                elif tip is int and (isinstance(v, bool)
                                     or not isinstance(v, int)):
                    hata.append("schedule.%s bir sayı olmalı" % k)
                elif tip is str and not isinstance(v, str):
                    hata.append("schedule.%s bir dize olmalı" % k)
                elif k in ("morning", "evening", "weekly_time") and v \
                        and not SAAT.match(v):
                    # «8» ya da «25:00» sessizce kabul edilirse, is hic
                    # calismaz ve kullanici sebebini bulamaz.
                    hata.append("schedule.%s SS:DD biçiminde olmalı" % k)
                elif k == "weekly_day" and v and v.lower() not in schedule.GUNLER:
                    hata.append("schedule.weekly_day bir gün adı olmalı")
                elif k == "channel" and v not in ("whatsapp", "telegram"):
                    hata.append("schedule.channel bilinmeyen kanal")

    for ad, alanlar in (patch.get("channels") or {}).items():
        if ad not in ("whatsapp", "telegram"):
            hata.append("bilinmeyen kanal: %s" % ad)
            continue
        if not isinstance(alanlar, dict):
            hata.append("%s bir nesne olmalı" % ad)
            continue
        for k, v in alanlar.items():
            tip = CHANNEL_FIELDS.get(k)
            if tip is None:
                hata.append("bilinmeyen kanal alanı: %s.%s" % (ad, k))
                continue
            if tip is bool and not isinstance(v, bool):
                hata.append("%s.%s bir bool olmalı" % (ad, k))
            elif tip is str and not isinstance(v, str):
                hata.append("%s.%s bir dize olmalı" % (ad, k))
            elif tip is list:
                if not isinstance(v, list) or any(not isinstance(x, (str, int))
                                                  for x in v):
                    hata.append("%s.%s dize listesi olmalı" % (ad, k))
    return (not hata), hata


def apply(cfg, patch):
    """Dogrulanmis yamayi birlestirir. local_token'a DOKUNMAZ."""
    yeni = copy.deepcopy(cfg)
    for grup, alanlar in (patch.get("thresholds") or {}).items():
        yeni.setdefault("thresholds", {}).setdefault(grup, {}).update(alanlar)
    if patch.get("schedule"):
        yeni.setdefault("schedule", {}).update(patch["schedule"])
    zaman = patch.get("schedule")
    if zaman is not None:
        if not isinstance(zaman, dict):
            hata.append("schedule bir nesne olmalı")
        else:
            for k, v in zaman.items():
                tip = SCHEDULE_FIELDS.get(k)
                if tip is None:
                    hata.append("bilinmeyen zamanlama alanı: %s" % k)
                elif tip is bool and not isinstance(v, bool):
                    hata.append("schedule.%s bir bool olmalı" % k)
                elif tip is int and (isinstance(v, bool)
                                     or not isinstance(v, int)):
                    hata.append("schedule.%s bir sayı olmalı" % k)
                elif tip is str and not isinstance(v, str):
                    hata.append("schedule.%s bir dize olmalı" % k)
                elif k in ("morning", "evening", "weekly_time") and v \
                        and not SAAT.match(v):
                    # «8» ya da «25:00» sessizce kabul edilirse, is hic
                    # calismaz ve kullanici sebebini bulamaz.
                    hata.append("schedule.%s SS:DD biçiminde olmalı" % k)
                elif k == "weekly_day" and v and v.lower() not in schedule.GUNLER:
                    hata.append("schedule.weekly_day bir gün adı olmalı")
                elif k == "channel" and v not in ("whatsapp", "telegram"):
                    hata.append("schedule.channel bilinmeyen kanal")

    for ad, alanlar in (patch.get("channels") or {}).items():
        temiz = {k: v for k, v in alanlar.items() if k not in ("local_token",)}
        yeni.setdefault("channels", {}).setdefault(ad, {}).update(temiz)
    yeni["local_token"] = cfg.get("local_token")
    return yeni


def write(cfg, path=None):
    p = path or CONFIG_PATH
    gecici = p + ".yeni"
    # Once gecici dosyaya, sonra yerine: yarim yazilmis bir yapilandirma
    # bir sonraki acilista daemon'u hic baslatmazdi.
    with open(gecici, "w", encoding="utf-8") as f:
        f.write(json.dumps(cfg, indent=2, ensure_ascii=False) + "\n")
    os.replace(gecici, p)
    return p
