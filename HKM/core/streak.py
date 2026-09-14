# -*- coding: utf-8 -*-
"""Seri — bir gunun degil, ART ARDA gelen gunlerin hikayesi.

   VP'ler her gunu TEK BASINA denetler ve bu dogrudur: bir gecelik kotu
   uyku bir kriz degildir. Ama ust uste dorduncu gece ayni sey degildir
   ve gun gun bakan bir sistem bunu hic gormez.

   Seri bunu gorunur kilar — dort kuralla:

   1. SERI EN AZ UC GUNDUR. Iki gun bir egilim degil, bir rastlantidir.

   2. ARADAKI OLCULMEMIS GUN SERIYI KIRMAZ AMA SAYILMAZ. Kayit
      girilmemis bir gun «iyiydi» de demek degildir «kotuydu» da: seri
      devam eder, uzunluk olculen gunlerden sayilir ve kac gun atlandigi
      YAZILIR. Atlanan gunu iyi saymak, olcmeyerek iyilesmek olurdu.

   3. BITEN SERI DE BIR BULGUDUR. «Uc gundur suruyor» kadar «dun bitti»
      de soylenmeye deger; yalniz devam edeni gostermek, duzelmeyi
      gormezden gelmektir.

   4. SERI BIR HUKUM DEGIL BIR SAYIMDIR. «Tukenmissin» denmez; «su esik
      su kadar gun ust uste kirildi» denir.
"""

import datetime

from core import certainty as C
from core import db, thresholds

ASGARI = 3           # bir seri en az bu kadar OLCULEN gun
BOSLUK = 2           # art arda bu kadar olculmemis gun seriyi kirar
PENCERE = 45

# Hangi olcu, hangi yonde ve hangi esikte «kirik» sayilir. Esik verisi
# kullanicinindir: thresholds'tan okunur, burada sabit tutulmaz.
KURALLAR = [
    {"id": "sleep-low", "module": "spi", "metric": "sleep_hours",
     "group": "bio", "field": "sleep_hours_min", "dir": "below",
     "label": "uyku tabanının altında"},
    {"id": "recovery-low", "module": "spi", "metric": "recovery",
     "group": "bio", "field": "recovery_floor", "dir": "below",
     "label": "toparlanma tabanının altında"},
    {"id": "questions-low", "module": "ays", "metric": "questions",
     "group": "academic", "field": "questions_min", "dir": "below",
     "label": "günlük soru tabanının altında"},
    {"id": "study-low", "module": "ays", "metric": "study_minutes",
     "group": "academic", "field": "study_minutes_min", "dir": "below",
     "label": "çalışma tabanının altında"},
    {"id": "practice-low", "module": "esp", "metric": "practice_minutes",
     "group": "intellect", "field": "practice_minutes_min", "dir": "below",
     "label": "pratik tabanının altında"},
]


def _gunler(date, days):
    son = datetime.date.fromisoformat(date)
    return [(son - datetime.timedelta(days=i)).isoformat()
            for i in range(days - 1, -1, -1)]


def series(con, date, days=PENCERE, th=None):
    """(modul, metrik) → {gun: deger} — son gonderim gecerli."""
    bas = _gunler(date, days)[0]
    out = {}
    for e in db.events_between(con, bas, date):
        for key, m in (e["payload"].get("metrics") or {}).items():
            if not isinstance(m, dict) or not C.is_valid(m.get("cert")):
                continue
            v = C.value_of(m)
            if v is None:
                continue
            out.setdefault((e["module"], key), {})[e["date"]] = v
    return out


def scan(con, date, days=PENCERE, th=None):
    t = th or thresholds.load()
    seri = series(con, date, days)
    gunler = _gunler(date, days)
    out = []
    for kural in KURALLAR:
        esik = (t.get(kural["group"]) or {}).get(kural["field"])
        degerler = seri.get((kural["module"], kural["metric"])) or {}
        out.append(_kural(kural, esik, degerler, gunler))
    return out


def _kirik(deger, esik, yon):
    if deger is None or esik is None:
        return None
    return deger < esik if yon == "below" else deger > esik


def _kural(kural, esik, degerler, gunler):
    base = {"id": kural["id"], "module": kural["module"],
            "metric": kural["metric"], "label": kural["label"],
            "threshold": esik}
    if esik is None:
        return dict(base, status="missing", note="Bu ölçünün eşiği tanımsız.")

    aktif = []        # devam eden seri: [(gun, kirik_mi)]
    bitmis = None
    bosluk = 0
    atlanan = 0
    for g in gunler:
        v = degerler.get(g)
        if v is None:
            bosluk += 1
            if aktif and bosluk > BOSLUK:
                # Bosluk seriyi kirdi: kapat.
                bitmis = bitmis or _paket(aktif, atlanan, g)
                aktif, atlanan = [], 0
            elif aktif:
                atlanan += 1
            continue
        bosluk = 0
        if _kirik(v, esik, kural["dir"]):
            aktif.append((g, v))
        else:
            if len(aktif) >= ASGARI:
                bitmis = _paket(aktif, atlanan, g)
            aktif, atlanan = [], 0

    if len(aktif) >= ASGARI:
        p = _paket(aktif, atlanan, None)
        return dict(base, status="running", **p,
                    note="%s %d gündür sürüyor (%s → %s)%s. Bu bir sayımdır, "
                         "hüküm değil." % (kural["label"], p["length"],
                                           p["from"], p["to"],
                                           _atlama(p["skipped"])))
    if bitmis:
        return dict(base, status="ended", **bitmis,
                    note="%s %d gün sürdü ve %s günü bitti%s."
                         % (kural["label"], bitmis["length"], bitmis["broke_on"],
                            _atlama(bitmis["skipped"])))
    olculen = len([g for g in gunler if degerler.get(g) is not None])
    return dict(base, status="clean", measured=olculen,
                note="%d ölçülen günde üst üste %d günlük bir seri yok. "
                     "Ölçülmeyen gün «iyiydi» demek değildir."
                     % (olculen, ASGARI))


def _paket(aktif, atlanan, kiran):
    return {"length": len(aktif), "from": aktif[0][0], "to": aktif[-1][0],
            "skipped": atlanan, "broke_on": kiran,
            "values": [v for _g, v in aktif]}


def _atlama(n):
    if not n:
        return ""
    return (" — arada %d gün ölçülmedi ve o günler seriye SAYILMADI" % n)


def findings(con, date, days=PENCERE, th=None):
    """Yalniz suren ve yeni biten seriler."""
    return [s for s in scan(con, date, days, th)
            if s["status"] in ("running", "ended")]
