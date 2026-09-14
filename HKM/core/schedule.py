# -*- coding: utf-8 -*-
"""Ritim — HKM'nin gunluk zamanlamasi.

   Bir ozet, istendiginde degil ZAMANINDA geldiginde ise yarar: sabah
   brifingi gun baslamadan, aksam kapanisi gun biterken. Ama zamanlama,
   bir bildirim akisina donusmenin de en kisa yoludur. Bu yuzden:

   1. VARSAYILAN KAPALI. Hicbir is kendiliginden calismaz.
   2. GUNDE BIR KEZ. Her isin bir kimligi var (tur + gun) ve ayni kimlik
      iki kez kuyruga girmez — daemon dakikada bir tikladigi halde.
   3. GECMIS IS KOVALANMAZ. Daemon aksam acildiysa sabahin brifingi
      GONDERILMEZ: gunu gecmis bir hatirlatma, hatirlatma degil gurultudur.
      Tolerans penceresi dardir (varsayilan 90 dakika).
   4. IS URETMEZ, MESAJ URETIR. Zamanlayici kural motorunu cagirir ve
      ciktisini giden kutusuna birakir; gonderimi outbox yapar.
"""

import datetime

from core import manager, outbox, patron

VARSAYILAN = {
    "enabled": False,
    "channel": "whatsapp",
    "morning": "08:00",      # gunun brifingi
    "evening": "",           # bos: kapali
    "weekly_day": "",        # ornek: "pazartesi" — bos: kapali
    "weekly_time": "09:00",
    "tolerance_minutes": 90,
}

GUNLER = {"pazartesi": 0, "sali": 1, "carsamba": 2, "persembe": 3,
          "cuma": 4, "cumartesi": 5, "pazar": 6}


def settings(cfg):
    a = dict(VARSAYILAN)
    a.update((cfg or {}).get("schedule") or {})
    return a


def _dakika(hhmm):
    try:
        s, d = str(hhmm).split(":")
        return int(s) * 60 + int(d)
    except (ValueError, AttributeError):
        return None


def due(cfg, now):
    """O an calismasi gereken isler. Gecmis is KOVALANMAZ."""
    a = settings(cfg)
    if not a.get("enabled"):
        return []
    simdi = now.hour * 60 + now.minute
    tolerans = max(5, int(a.get("tolerance_minutes") or 90))
    isler = []

    for tur, alan in (("daily", "morning"), ("evening", "evening")):
        dk = _dakika(a.get(alan))
        if dk is None:
            continue
        if 0 <= simdi - dk <= tolerans:
            isler.append({"kind": tur, "at": a.get(alan)})

    gun = str(a.get("weekly_day") or "").strip().lower()
    if gun in GUNLER and now.weekday() == GUNLER[gun]:
        dk = _dakika(a.get("weekly_time"))
        if dk is not None and 0 <= simdi - dk <= tolerans:
            isler.append({"kind": "weekly", "at": a.get("weekly_time")})
    return isler


def run(con, cfg, job, now=None, th=None):
    """Bir isi calistirir: metni URETIR ve giden kutusuna BIRAKIR."""
    now = now or datetime.datetime.now()
    gun = now.date().isoformat()
    a = settings(cfg)
    kanal = a.get("channel") or "whatsapp"

    if job["kind"] == "weekly":
        from core import weekly
        metin = weekly.message(con, gun, th=th)
    elif job["kind"] == "evening":
        b = manager.brief(con, gun, th=th)
        kapanis = [l["text"] for l in b["lines"] if l["kind"] in ("vp", "coverage")]
        metin = "HKM · %s · gün kapanışı\n%s" % (gun, "\n".join("• " + x for x in kapanis))
    else:
        m = patron.daily_message(con, gun, th=th)
        if not m["ok"]:
            return {"ok": False, "reason": "imperative", "note": m["error"]}
        metin = m["text"]

    if manager.imperatives(metin):
        # Reddet-ve-dus: zamanlanmis bir mesaj da emir kipi tasiyamaz.
        return {"ok": False, "reason": "imperative"}
    r = outbox.enqueue(con, kanal, job["kind"], gun, metin, now=now)
    return {"ok": True, "queued": not r["duplicate"], "kind": job["kind"],
            "chars": len(metin)}


def tick(con, cfg, now=None, th=None, transport=None):
    """Daemon'un dakikalik tiki: vadesi gelen isleri kuyruga koy, kuyrugu
    bosalt. Hicbir kosulda firlatmaz — bir zamanlayici hatasi daemon'u
    durduramaz."""
    now = now or datetime.datetime.now()
    sonuc = {"jobs": [], "flush": None}
    try:
        for job in due(cfg, now):
            sonuc["jobs"].append(run(con, cfg, job, now=now, th=th))
        sonuc["flush"] = outbox.flush(con, cfg, now=now, transport=transport)
    except Exception as e:                      # noqa: BLE001
        sonuc["error"] = "%s: %s" % (type(e).__name__, e)
    return sonuc
