# -*- coding: utf-8 -*-
"""Etki — HKM'nin KENDI faydasini olcmesi.

   MIMARI.md §10'daki durust soru: «bu daemon gerekiyor mu?» Bir katman
   kendi faydasini olcmuyorsa, o soruyu ancak izlenimle cevaplayabilir —
   ve izlenim, olcmeyen her sistemin kendini hakli cikarma bicimidir.

   Bu dosya su zinciri kapatir:

     oneri → kullanicinin cevabi → SONRAKI GUNLERDE OLCU NE OLDU

   Bes kural, ve ucu «soylememe» kuralidir:

   1. NEDEN-SONUC YOK. «Oneri ise yaradi» cumlesi buradan CIKMAZ. Cikan
      cumle sudur: «kabul ettigin N onerinin ardindan su olcu soyle
      hareket etti». Aradaki fark bu dosyanin tamamidir.

   2. SECILIM YANLILIGI YAZILIR. Kabul ettigin gunler zaten farkli
      gunlerdi: bir oneriyi kabul edebilecek durumda olmak, olcunun
      zaten iyi gidiyor olmasiyla ayni seyden besleniyor olabilir. Bu
      uyari her ciktida durur; kaldirilirsa sayi yalan soyler.

   3. ESIGIN ALTINDA HUKUM YOK. Uc cevaptan az, ya da olcunun oncesinde/
      sonrasinda yeterli gun yoksa «veri yok» denir.

   4. RED DE BIR VERIDIR. Reddedilen oneriler ayri sayilir ve ayri
      raporlanir: ikisini karsilastirmak, HKM'nin elindeki en yakin
      «kontrol grubu»dur — ve bu bile bir deney DEGILDIR.

   5. YON TANIMSIZSA OLCULMEZ. Bir olcunun hangi yone gitmesinin iyi
      oldugu yazili degilse, o oneri icin etki hesaplanmaz.
"""

import datetime

from core import certainty as C
from core import db, twin

ONCE = 7            # cevaptan onceki pencere (gun)
SONRA = 7           # cevaptan sonraki pencere (gun)
ASGARI_NOKTA = 3    # her iki pencerede de en az bu kadar olcum
ASGARI_CEVAP = 3    # bir kural icin en az bu kadar cevaplanmis oneri
FARK_ESIGI = 0.10   # iki pencere ortancasi arasindaki asgari oransal fark

# Hangi oneri hangi olcuye bakar — ve o olcunun hangi yonu «iyi»dir.
# Yonu yazili olmayan bir olcu icin etki HESAPLANMAZ.
WATCH = {
    "bio_red": {"module": "spi", "metric": "sleep_hours", "dir": "higher_better",
                "label": "uyku saati"},
    "fixed_calendar": {"module": "ays", "metric": "study_minutes",
                       "dir": "higher_better", "label": "çalışma dakikası"},
    "academic_goal": {"module": "ays", "metric": "questions",
                      "dir": "higher_better", "label": "soru sayısı"},
    "blocked_core": {"module": "esp", "metric": "practice_minutes",
                     "dir": "higher_better", "label": "pratik dakikası"},
    "new_content": {"module": "esp", "metric": "synthesis_gap_days",
                    "dir": "lower_better", "label": "sentez açığı (gün)"},
}

DIRECTIONS = {
    "higher_better": lambda d: d,
    "lower_better": lambda d: None if d is None else -d,
}


def _add(date_str, days):
    return (datetime.date.fromisoformat(date_str)
            + datetime.timedelta(days=days)).isoformat()


def _median(xs):
    s = sorted(xs)
    n = len(s)
    if not n:
        return None
    return s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2.0


def _seri(con, modul, metrik, bas, bit, cache=None):
    """[bas, bit] araliginda olculmus/hesaplanmis degerler.

    `cache` verilirse ambar yeniden okunmaz. Sebebi olcumle bulundu:
    her karar icin iki ayri sorgu, 270 kararda 540 sorgu demekti ve
    `tools/perf.py` bunu «butcenin yarisini gecti» diye isaretledi.
    Butce dolana kadar beklemek, dolana kadar hicbir sey soylememektir."""
    if cache is not None:
        gunler = cache.get((modul, metrik)) or {}
        return [v for g, v in sorted(gunler.items()) if bas <= g <= bit]
    # HATALAR Y-3: gun basina TEK olcum — gunun SON gonderimi (onbellekli
    # yolla ayni kural). Isaret gun icinde birikimli ara degerler gonderir;
    # her birini ayri olcum saymak «en az 3 olcum» sartini tek gunle doldurur.
    gunler = {}
    for e in db.events_between(con, bas, bit, modul):
        m = (e["payload"].get("metrics") or {}).get(metrik)
        if not isinstance(m, dict) or not C.is_valid(m.get("cert")):
            continue
        v = C.value_of(m)
        if v is not None:
            gunler[e["date"]] = v
    return [v for g, v in sorted(gunler.items())]


def build_cache(con):
    """Izlenen butun olculeri TEK geciste okur: (modul, metrik) → {gun: deger}.

    Ayni gunun ikinci govdesi birincisini gecersiz kilar — ikizin kurali
    neyse burada da odur."""
    izlenen = set((w["module"], w["metric"]) for w in WATCH.values())
    cache = dict((k, {}) for k in izlenen)
    for e in db.events_between(con, "0000-01-01", "9999-12-31"):
        mod = e["module"]
        metrics = e["payload"].get("metrics") or {}
        for (m, metrik) in izlenen:
            if m != mod:
                continue
            ham = metrics.get(metrik)
            if not isinstance(ham, dict) or not C.is_valid(ham.get("cert")):
                continue
            v = C.value_of(ham)
            if v is not None:
                cache[(m, metrik)][e["date"]] = v
    return cache


def one(con, karar, cache=None):
    """Tek bir cevaplanmis oneri icin etki. Hukum kurmaz, hareket bildirir."""
    anahtar = karar.get("key")
    bakilan = WATCH.get(anahtar or "")
    base = {"id": karar["id"], "date": karar["date"], "state": karar["state"],
            "key": anahtar, "rank": karar["rank"]}
    if not bakilan:
        return dict(base, status="unmeasurable",
                    note="Bu önerinin hangi ölçüye baktığı yazılı değil; "
                         "yönü bilinmeyen bir ölçüde etki hesaplanmaz.")
    base.update({"metric": bakilan["module"] + "/" + bakilan["metric"],
                 "label": bakilan["label"], "direction": bakilan["dir"]})

    gun = karar["date"]
    once = _seri(con, bakilan["module"], bakilan["metric"],
                 _add(gun, -ONCE), _add(gun, -1), cache)
    sonra = _seri(con, bakilan["module"], bakilan["metric"],
                  _add(gun, 1), _add(gun, SONRA), cache)
    if len(once) < ASGARI_NOKTA or len(sonra) < ASGARI_NOKTA:
        return dict(base, status="missing", before_n=len(once), after_n=len(sonra),
                    note="Öncesinde %d, sonrasında %d ölçüm var; hüküm için her "
                         "iki yanda da %d gerekir. Az veri «etkisiz» demek "
                         "DEĞİLDİR." % (len(once), len(sonra), ASGARI_NOKTA))

    o, sn = _median(once), _median(sonra)
    if not o:
        return dict(base, status="missing", note="Öncesi sıfır ya da boş; "
                                                 "oran hesaplanamaz.")
    ham = (sn - o) / abs(o)
    iyilesme = DIRECTIONS[bakilan["dir"]](ham)
    yon = ("improved" if iyilesme > FARK_ESIGI
           else "worsened" if iyilesme < -FARK_ESIGI else "flat")
    return dict(base, status=yon, before=o, after=sn, change=ham,
                improvement=iyilesme, before_n=len(once), after_n=len(sonra),
                note="%s: önceki %d günün ortancası %s, sonraki %d günün "
                     "ortancası %s (%%%d %s). Bu bir ESLEŞMEDİR, neden-sonuç "
                     "değil." % (bakilan["label"], len(once), _fmt(o),
                                 len(sonra), _fmt(sn), round(abs(ham) * 100),
                                 "yukarıda" if ham > 0 else "aşağıda"))


def _fmt(v):
    if v is None:
        return "—"
    if abs(v - round(v)) < 0.05:
        return str(int(round(v)))
    return ("%.1f" % v).replace(".", ",")


def scan(con, cache=None):
    kayitlar = db.answered_decisions(con)
    if cache is None and len(kayitlar) > 20:
        cache = build_cache(con)
    return [one(con, k, cache) for k in kayitlar]


UYARI = ("Bu bir deney değildir. Kabul ettiğin günler zaten farklı günlerdi: "
         "bir öneriyi kabul edebilecek durumda olmak, ölçünün zaten iyi "
         "gidiyor olmasıyla aynı şeyden besleniyor olabilir. Buradaki sayı "
         "«öneri işe yarıyor» demez; «kabul edilen önerilerin ardından ölçü "
         "şöyle hareket etti» der.")


def summary(con):
    """Kural kural özet: kaç öneri, kaç kabul, kaç ret, ve ölçü ne yaptı."""
    hepsi = scan(con)
    out = {"answered": len(hepsi), "caveat": UYARI, "rules": {}, "verdict": None}
    for r in hepsi:
        k = r.get("key") or "bilinmiyor"
        g = out["rules"].setdefault(k, {
            "key": k, "label": (WATCH.get(k) or {}).get("label"),
            "accepted": 0, "declined": 0,
            "accepted_improved": 0, "accepted_worsened": 0, "accepted_flat": 0,
            "declined_improved": 0, "declined_worsened": 0, "declined_flat": 0,
            "unmeasured": 0})
        durum = r["state"]
        g[durum] = g.get(durum, 0) + 1
        if r["status"] in ("improved", "worsened", "flat"):
            g["%s_%s" % (durum, r["status"])] += 1
        else:
            g["unmeasured"] += 1

    olculen = sum(g["accepted_improved"] + g["accepted_worsened"] + g["accepted_flat"]
                  for g in out["rules"].values())
    if len(hepsi) < ASGARI_CEVAP or not olculen:
        out["verdict"] = {
            "cert": "missing",
            "note": "Cevaplanmış %d öneri var ve ölçülebilen %d tanesi; hüküm "
                    "için en az %d cevaplanmış öneri ve ölçülebilir bir pencere "
                    "gerekir. HKM'nin faydası HENÜZ ÖLÇÜLMEDİ — bu, faydası yok "
                    "demek değildir." % (len(hepsi), olculen, ASGARI_CEVAP)}
        return out

    iyi = sum(g["accepted_improved"] for g in out["rules"].values())
    kotu = sum(g["accepted_worsened"] for g in out["rules"].values())
    out["verdict"] = {
        "cert": "measured", "measured": olculen, "improved": iyi, "worsened": kotu,
        "note": "Kabul edilen ve ölçülebilen %d önerinin ardından ilgili ölçü "
                "%d kez yukarı, %d kez aşağı hareket etti. %s"
                % (olculen, iyi, kotu, UYARI)}
    return out
