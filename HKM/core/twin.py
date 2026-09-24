"""Dijital ikiz — uc modulun son N gununden TEK resim.

   HKM'nin tek gercek vaadi su cumleydi: «ucunu tek sesle ozetlemek.»
   Ozet ancak bir RESIM uzerinden kurulabilir; her gun yalniz o gunun
   govdesine bakan bir katman, dun ile bugun arasindaki farki goremez.

   Uc kural bu dosyanin tamamini yonetir:

   1. EKSIK VERI SIFIR DEGILDIR. Bir metrik hic gonderilmediyse
      «hic gorulmedi», gonderilip bos geldiyse «veri yok» der. Ikisi ayri
      seydir: birincisi modulun sessizligi, ikincisi kullanicinin bos
      gunudur. Ikisini de ortalamaya katmayiz.

   2. ETIKET RESMIN PARCASIDIR. Her deger kendi kesinlik etiketiyle
      tasinir; «olculdu» ile «tahmin» ayni tabloda ayni renkte durmaz.

   3. YON, YETERLI NOKTA YOKSA SOYLENMEZ. Iki olcumden trend cikarmak
      gurultuyu bulgu diye sunmaktir; taban dort noktadir ve altinda
      yon «bilinmiyor»dur.

   Ikiz TURETILMIS bir goruntudur: kaynagi her zaman raw_events'tir.
   Burada tutulan hicbir sey ayri bir tabloya yazilmaz — yazilsaydi iki
   gercek olur ve hangisinin dogru oldugu sorulurdu.
"""

import datetime

from core import certainty as C
from core import adlar, db

WINDOW_DAYS = 14
TREND_MIN_POINTS = 4          # altinda yon soylenmez
TREND_MIN_CHANGE = 0.10       # %10'dan kucuk fark «yerinde»

MODULES = ("ays", "spi", "esp")


def _days(date, days):
    d = datetime.date.fromisoformat(date)
    return (d - datetime.timedelta(days=days - 1)).isoformat(), date


def _median(xs):
    s = sorted(xs)
    n = len(s)
    if not n:
        return None
    return s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2.0


def _trend(points):
    """points: [(date, value)] eskiden yeniye. Yon ya da 'unknown'."""
    vals = [v for _d, v in points]
    if len(vals) < TREND_MIN_POINTS:
        return {"direction": "unknown", "n": len(vals),
                "note": "Yön için en az %d ölçüm gerekir; %d var."
                        % (TREND_MIN_POINTS, len(vals))}
    yari = len(vals) // 2
    eski = _median(vals[:yari])
    yeni = _median(vals[yari:])
    if eski is None or yeni is None or eski == 0:
        return {"direction": "unknown", "n": len(vals),
                "note": "Taban sıfır ya da boş; oran hesaplanamaz."}
    fark = (yeni - eski) / abs(eski)
    yon = "flat"
    if fark > TREND_MIN_CHANGE:
        yon = "rising"
    elif fark < -TREND_MIN_CHANGE:
        yon = "falling"
    return {"direction": yon, "n": len(vals), "change": fark,
            "old": eski, "new": yeni,
            "note": "Son %d ölçümün ortancası, öncekilere göre %%%.0f %s."
                    % (len(vals), abs(fark) * 100,
                       "yukarıda" if fark > 0 else "aşağıda")}


def snapshot(con, date, days=WINDOW_DAYS):
    """Uc modulun tek resmi. Uydurmaz: gormedigini «gormedim» der."""
    start, end = _days(date, days)
    olaylar = db.events_between(con, start, end)

    modules = {}
    for mod in MODULES:
        modules[mod] = {"module": mod, "metrics": {}, "last_seen": None,
                        "days_seen": 0, "silent_days": days, "events": 0}

    gorulen_gun = {m: set() for m in MODULES}
    seri = {}                      # (mod, key) -> [(date, value)]
    son = {}                       # (mod, key) -> (date, value, cert)

    for e in olaylar:
        mod = e["module"]
        if mod not in modules:
            continue
        modules[mod]["events"] += 1
        gorulen_gun[mod].add(e["date"])
        if not modules[mod]["last_seen"] or e["date"] > modules[mod]["last_seen"]:
            modules[mod]["last_seen"] = e["date"]
        for key, m in (e["payload"].get("metrics") or {}).items():
            if not isinstance(m, dict) or not C.is_valid(m.get("cert")):
                continue
            v = C.value_of(m)
            son[(mod, key)] = (e["date"], v, m.get("cert"))
            if v is not None:
                # HATALAR O-1: gun basina TEK nokta — gunun SON degeri
                # (`series` ile ayni kural). Ayni gunun dort gonderimi dort
                # nokta, %400 kapsama ve sahte egilim uretiyordu.
                seri.setdefault((mod, key), {})[e["date"]] = v

    for (mod, key), (d, v, cert) in sorted(son.items()):
        noktalar = sorted(seri.get((mod, key), {}).items())
        modules[mod]["metrics"][key] = {
            "value": v, "cert": cert, "at": d,
            "label": C.LABELS.get(cert, cert),
            # «label» KESINLIK etiketidir (olculdu/tahmin/...); «name» ise
            # alanin insan adi. Ikisini tek alanda toplamak, iki farkli
            # seyi ayni kelimeyle anlatmak olurdu.
            "name": adlar.metrik(key),
            "points": len(noktalar),
            "coverage": round(len(noktalar) / float(days), 3),
            "trend": _trend(noktalar),
        }

    for mod in MODULES:
        modules[mod]["days_seen"] = len(gorulen_gun[mod])
        modules[mod]["silent_days"] = days - len(gorulen_gun[mod])

    return {"date": date, "days": days, "from": start, "to": end,
            "modules": modules,
            "coverage": coverage(modules),
            "blind": blind(modules)}


def series(con, date, days=WINDOW_DAYS, module=None):
    """Metrik metrik ZAMAN SERISI — veri merkezinin ham maddesi.

    Ikizin ozeti «son deger + yon» der; bir insanin bakip karar verebilmesi
    icinse serinin kendisi gerekir. Seri TURETILMEZ, ham olaylardan okunur:
    ayni gun iki kez gonderilmisse SON gonderim gecerlidir (ikizin kurali
    neyse burada da odur).

    Donen bicim: { "modul/metrik": {points:[[gun, deger, kesinlik]], ...} }"""
    start, end = _days(date, days)
    out = {}
    for e in db.events_between(con, start, end, module):
        for key, m in (e["payload"].get("metrics") or {}).items():
            if not isinstance(m, dict) or not C.is_valid(m.get("cert")):
                continue
            v = C.value_of(m)
            if v is None:
                continue
            anahtar = e["module"] + "/" + key
            kayit = out.setdefault(anahtar, {"module": e["module"], "metric": key,
                                            "byDay": {}})
            kayit["byDay"][e["date"]] = [e["date"], v, m["cert"]]

    for anahtar, kayit in out.items():
        noktalar = [kayit["byDay"][g] for g in sorted(kayit["byDay"])]
        kayit.pop("byDay")
        kayit["points"] = noktalar
        kayit["n"] = len(noktalar)
        kayit["last"] = noktalar[-1] if noktalar else None
        degerler = [p[1] for p in noktalar]
        kayit["min"] = min(degerler) if degerler else None
        kayit["max"] = max(degerler) if degerler else None
        kayit["median"] = _median(degerler)
        kayit["trend"] = _trend([(p[0], p[1]) for p in noktalar])
        # Kesinlik karisimi gorunur kalir: «olculdu» ile «hesaplandi» ayni
        # cizgide durabilir ama ayni sey degildir.
        kayit["certs"] = sorted(set(p[2] for p in noktalar))
        # Ekran adi VERIYE degil SUNUMA aittir: anahtar ingilizce kalir,
        # yaninda insanin okudugu ad gider. Yuzun kendi sozlugu olsaydi,
        # ad iki yerde yasar ve bir gun ikisi ayrisirdi.
        kayit["name"] = adlar.metrik(kayit["metric"])
        kayit["module_name"] = adlar.modul(kayit["module"])
    return out


def coverage(modules):
    """Resmin ne kadari OLCULDU, ne kadari tahmin, ne kadari yok.

    Bu sayi bir kalite notu degildir; «bu brifing neye dayaniyor» sorusunun
    cevabidir. Dusuk kapsama kotu bir gun demek degil, az veri demektir."""
    out = {"measured": 0, "estimated": 0, "computed": 0, "missing": 0,
           "total": 0, "measured_ratio": None}
    for mod in modules.values():
        for m in mod["metrics"].values():
            out["total"] += 1
            out[m["cert"]] = out.get(m["cert"], 0) + 1
    if out["total"]:
        out["measured_ratio"] = round(out["measured"] / float(out["total"]), 3)
    return out


def blind(modules):
    """Resmin GOREMEDIGI yerler. Iki ayri korluk ayri yazilir."""
    out = []
    for mod in MODULES:
        m = modules[mod]
        if not m["events"]:
            out.append({"module": mod, "kind": "never_seen",
                        "note": "Bu modülden pencere boyunca hiç veri gelmedi. "
                                "Sessizlik bir ölçüm değildir."})
            continue
        bos = [k for k, v in m["metrics"].items() if v["value"] is None]
        for k in sorted(bos):
            out.append({"module": mod, "kind": "missing", "metric": k,
                        "note": "Alan gönderildi ama değeri yok; sıfır sayılmaz."})
        if m["silent_days"]:
            out.append({"module": mod, "kind": "silent_days",
                        "days": m["silent_days"],
                        "note": "%d gün hiç kayıt gelmedi." % m["silent_days"]})
    return out
