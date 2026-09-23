# -*- coding: utf-8 -*-
"""Haftalik rapor — gunun altindaki EGRIYI gostermek.

   Gunluk brifing bugunu anlatir ve bugun gurultuludur: bir kotu gece,
   bir yogun gun. Hafta, gurultunun altindaki egriyi gorunur kilar.

   Uc kural:

   1. HAFTA BIR TOPLAM DEGIL BIR KAPSAMDIR. «Bu hafta 5 gun kayit var»
      cumlesi, toplamdan once gelir: eksik gunleri saymadan verilen bir
      haftalik ortalama, olculmeyen gunleri sifir saymaktir.
   2. KARSILASTIRMA ONCEKI HAFTAYLA YAPILIR ve yalniz iki hafta da
      olculduyse. Tek hafta bir egri degildir.
   3. HUKUM YOK, HAREKET VAR. «Iyi bir hafta» denmez; «su olcu su kadar
      gun olculdu ve ortancasi soyle degisti» denir.
"""

import datetime

from core import cross, impact, manager, twin

ASGARI_GUN = 3          # bir olcunun haftalik ortancasi icin


def _hafta(bugun, geri=0):
    t = datetime.date.fromisoformat(bugun) - datetime.timedelta(days=7 * geri)
    bas = t - datetime.timedelta(days=6)
    return bas.isoformat(), t.isoformat()


def _ortanca(xs):
    s = sorted(xs)
    n = len(s)
    if not n:
        return None
    return s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2.0


def report(con, date, th=None):
    """Haftalik rapor — sayilar ve hareket, hukum degil."""
    bu_bas, bu_son = _hafta(date, 0)
    on_bas, on_son = _hafta(date, 1)
    bu = twin.series(con, bu_son, 7)
    onceki = twin.series(con, on_son, 7)

    satirlar = []
    for anahtar in sorted(bu):
        kayit = bu[anahtar]
        degerler = [p[1] for p in kayit["points"]]
        if len(degerler) < ASGARI_GUN:
            satirlar.append({"key": anahtar, "module": kayit["module"],
                             "metric": kayit["metric"], "n": len(degerler),
                             "status": "missing",
                             "note": "%d gün ölçüldü; haftalık ortanca için %d "
                                     "gerekir." % (len(degerler), ASGARI_GUN)})
            continue
        simdi = _ortanca(degerler)
        eski_kayit = onceki.get(anahtar)
        eski = None
        if eski_kayit and len(eski_kayit["points"]) >= ASGARI_GUN:
            eski = _ortanca([p[1] for p in eski_kayit["points"]])
        fark = None if not eski else (simdi - eski) / abs(eski)
        satirlar.append({
            "key": anahtar, "module": kayit["module"], "metric": kayit["metric"],
            "n": len(degerler), "median": simdi, "previous": eski, "change": fark,
            # Yuzde ve siralama BURADA uretilir. Arayuzun kendi sayisini
            # uretmesi, iki gercek yaratir; sayfa yalnizca yazar.
            "change_pct": None if fark is None else int(round(fark * 100)),
            "status": "compared" if fark is not None else "alone",
            "certs": kayit["certs"],
            "note": ("%d gün ölçüldü, ortanca %s%s"
                     % (len(degerler), _fmt(simdi),
                        ("; önceki haftaya göre %%%d %s"
                         % (round(abs(fark) * 100),
                            "yukarıda" if fark > 0 else "aşağıda"))
                        if fark is not None else " (önceki hafta ölçülmedi, "
                                                 "karşılaştırma yok)"))})

    # Sirali gelsin: en cok hareket eden olcu once. Siralamayi arayuze
    # birakmak, ayni veriyi iki yerde yorumlamak olurdu.
    satirlar.sort(key=lambda x: -abs(x.get("change") or 0))

    kapsam = twin.snapshot(con, bu_son, 7)
    capraz = cross.findings(con, bu_son, 60)
    etki = impact.summary(con)
    return {"from": bu_bas, "to": bu_son, "previous": [on_bas, on_son],
            "rows": satirlar, "coverage": kapsam["coverage"],
            "days_seen": {m: kapsam["modules"][m]["days_seen"]
                          for m in kapsam["modules"]},
            "cross": capraz[:2], "impact": etki["verdict"],
            "note": "Hafta bir toplam değil bir kapsamdır: eksik günleri "
                    "saymadan verilen bir ortalama, ölçülmeyen günleri sıfır "
                    "saymaktır."}


def _fmt(v):
    if v is None:
        return "—"
    if abs(v - round(v)) < 0.05:
        return str(int(round(v)))
    return ("%.1f" % v).replace(".", ",")


def message(con, date, th=None):
    """Kanala gidecek haftalik metin — kisa ve emir kipinden uzak."""
    r = report(con, date, th=th)
    parca = ["HKM · hafta %s → %s" % (r["from"], r["to"])]
    gun = r["days_seen"]
    parca.append("Kayıtlı gün: AYS %d · SPİ %d · ESP %d (7 günde)"
                 % (gun.get("ays", 0), gun.get("spi", 0), gun.get("esp", 0)))
    karsilastirilan = [s for s in r["rows"] if s["status"] == "compared"]
    karsilastirilan.sort(key=lambda s: -abs(s.get("change") or 0))
    for s in karsilastirilan[:4]:
        parca.append("• %s: %s" % (s["metric"], s["note"]))
    if not karsilastirilan:
        parca.append("Haftalık karşılaştırma için yeterli ölçüm yok. "
                     "Bu, «kötü hafta» demek değildir.")
    for c in r["cross"]:
        parca.append("Çapraz: " + c["note"])
    if (r["impact"] or {}).get("note"):
        parca.append("Etki: " + r["impact"]["note"])
    metin = "\n".join(parca)
    if manager.imperatives(metin):
        return "Haftalık rapor buyurgan kip taşıdığı için düşürüldü."
    return metin


# ------------------------------------------------------------ belge
#
# Haftalik rapor BASILIR (core/cikti.py belge modeli): Telegram'a PDF
# olarak gider, HKM yuzunden indirilir. Belgenin her sayisi report()'tan
# gelir; burada yeni bir sayi uretilmez, yalniz yazilir.

DURUM_ETIKET = {"compared": "hesaplandı", "alone": "hesaplandı", "missing": "veri yok"}


def _degisim(s):
    """«+%36», «−%5», «%0»: Turkcede yuzde isareti sayinin ONUNDEDIR."""
    if s.get("change_pct") is None:
        return "—"
    n = s["change_pct"]
    return "%s%%%d" % ("+" if n > 0 else "−" if n < 0 else "", abs(n))


def belge(con, date, th=None):
    """Haftalik rapor -> belge modeli (baslik, bolumler, etiket)."""
    from core import adlar, hedefag
    r = report(con, date, th=th)
    gun = r["days_seen"]
    bol = [{"baslik": "Kapsam", "bloklar": [
        {"t": "tablo", "basliklar": ["Sistem", "Kayıtlı gün (7 günde)"],
         "satirlar": [[adlar.modul(m), "%d" % gun.get(m, 0)] for m in ("ays", "spi", "esp")]},
        {"t": "not", "metin": r["note"]}]}]

    satir = [[adlar.metrik(s["metric"]), adlar.modul(s["module"]), "%d" % s["n"],
              _fmt(s.get("median")), _fmt(s.get("previous")), _degisim(s),
              DURUM_ETIKET.get(s["status"], "veri yok")] for s in r["rows"]]
    if satir:
        bol.append({"baslik": "Ölçüler", "bloklar": [
            {"t": "tablo", "basliklar": ["Ölçü", "Sistem", "Gün", "Ortanca", "Önceki",
                                         "Değişim", "Etiket"], "satirlar": satir},
            {"t": "not", "metin": "Ortanca en az %d ölçülen günden hesaplanır; önceki hafta da "
                                  "ölçüldüyse karşılaştırılır. Sıralama: en çok hareket eden "
                                  "ölçü önce." % ASGARI_GUN}]})
    else:
        bol.append({"baslik": "Ölçüler", "bloklar": [
            {"t": "p", "metin": "Bu hafta ölçü gelmedi. Bu, «kötü hafta» demek değildir."}]})

    p = hedefag.pano(con)
    etkin = [h for h in p["hedefler"] if h["durum"] == "aktif"]
    if etkin:
        ms = []
        for h in etkin:
            il = ((h.get("plan") or {}).get("ilerleme") or {})
            ms.append("%s · %s%s" % (adlar.modul(h["modul"]), h["ozet"],
                                      (" — " + il["metin"]) if il.get("metin") else
                                      " — plan ilerlemesi ölçülmedi" if h.get("plan") else ""))
        bol.append({"baslik": "Hedefler", "bloklar": [
            {"t": "liste", "maddeler": ms}, {"t": "not", "metin": p["butce"]["metin"]}]})

    ek = [("Çapraz: " + c["note"]) for c in r["cross"]]
    if (r["impact"] or {}).get("note"):
        ek.append("Etki: " + r["impact"]["note"])
    if ek:
        bol.append({"baslik": "Bağlantılar", "bloklar": [{"t": "liste", "maddeler": ek}]})

    return {"baslik": "Haftalık rapor", "alt": "%s → %s" % (r["from"], r["to"]),
            "tur_ad": "Haftalık rapor", "dogruluk": "hesaplandi", "tarih": r["to"],
            "kimlik": r["to"], "dayanak": "Haftalık rapor %s → %s" % (r["from"], r["to"]),
            "bolumler": bol, "kaynaklar": [], "gorsel": None, "slaytlar": None,
            "kavramlar": [], "kalite": []}


def dosya(con, date, bicim="pdf", th=None):
    """(bayt, mime, dosya_adi) — PDF cizilemezse (yazi tipi yok) HTML'e duser
    ve bu, dosyanin uzantisiyla SOYLENIR."""
    from core import cikti
    b = belge(con, date, th=th)
    bayt, mime, ad = cikti.uret_belge(b, bicim)
    if bayt is None and bicim != "html":
        bayt, mime, ad = cikti.uret_belge(b, "html")
    if bayt is None:
        return None, None, ad
    # Ad ASCII: kanal ve tarayici her birinde ayni gorunsun.
    return bayt, mime, "hkm-haftalik-rapor-%s.%s" % (b["tarih"], ad.rsplit(".", 1)[-1])
