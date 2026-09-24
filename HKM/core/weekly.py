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

# ------------------------------------------------------------ kazanimlar
#
# Fikir 49 — «bu hafta neler kazandin»: OLCULMUS en cok uc iyi sey.
#
#   1. YALNIZ YONU BELLI OLCU. «Cok soru iyidir» kodun bildigi bir yondur;
#      kilo, nabiz, tansiyon, su gibi yonu kisiye ve duruma bagli olculer
#      burada YOKTUR (SPI teshis koymaz, yorum da kurmaz). Uyku «ne kadar
#      cok o kadar iyi» degildir: yalniz tabana (esik) ya da bandin icine
#      YAKLASAN hareket kazanimdir.
#   2. ESIK. %5'in altindaki hareket gurultudur, kazanim sayilmaz.
#   3. DUZEN DE OLCULMUSTUR: 7 gunun en az DUZEN_GUN'unde kayit.
#   4. XP BAKILMAZ (AGENTS.md §1.6): seviye/rozet sayaclari burada yok.
#   5. KAZANIM YOKSA UYDURULMAZ: «olculmus bir artis yok» yazilir.
YON = {
    # AYS
    "questions": 1, "study_minutes": 1, "correct_questions": 1, "paragraph_done": 1,
    "problem_done": 1, "blocks_done": 1, "plan_done": 1, "topics_done": 1,
    "mock_net": 1, "correct_ratio": 1, "plan_adherence": 1, "errors_open": -1,
    # SPI — yalniz modulun kendi hareket/toparlanma olculeri
    "recovery": 1, "steps": 1, "train_minutes": 1, "training_minutes": 1,
    # ESP
    "practice_minutes": 1, "reading_minutes": 1, "retention": 1, "cards_done": 1,
    "sessions": 1, "cards_due": -1, "synthesis_gap_days": -1,
}
UYKU_UST = 9.0          # bandin ustu; alt sinir kullanicinin esigi (bio.sleep_hours_min)
KAZANIM_ESIK = 5        # yuzde
KAZANIM_EN_COK = 3
DUZEN_GUN = 5


def _hafta(bugun, geri=0, uzunluk=7):
    t = datetime.date.fromisoformat(bugun) - datetime.timedelta(days=uzunluk * geri)
    bas = t - datetime.timedelta(days=uzunluk - 1)
    return bas.isoformat(), t.isoformat()


# Pencere: hafta (7 gun) ya da ay (fikir 51). Ayni hesap, baska sozcuk.
PENCERE = {"hafta": {"asgari": ASGARI_GUN, "duzen": DUZEN_GUN, "onceki": "önceki haftaya",
                     "olcul": "önceki hafta ölçülmedi", "ad": "hafta"},
           "ay": {"asgari": 8, "duzen": 20, "onceki": "önceki aya",
                  "olcul": "önceki ay ölçülmedi", "ad": "ay"}}


GECMIS_DURUM = {"sent": "gönderildi", "queued": "kuyrukta", "failed": "gönderilemedi",
                "given_up": "gönderilemedi"}


def gecmis(con, date, n=8):
    """Bu hafta + kanala giden haftalik raporlar (en yeni once). Durum giden
    kutusundan okunur (kullanici 2026-09-24: PDF Telegram'a gider VE sistemde
    gorunur). Her satirin PDF'i ayni rapordan, o haftanin gunuyle basilir."""
    out = [{"from": _hafta(date)[0], "to": date, "durum": "bu hafta"}]
    for r in con.execute("SELECT day, state FROM outbox WHERE kind='weekly' AND day<? "
                         "ORDER BY day DESC LIMIT ?", (date, max(0, n - 1))).fetchall():
        out.append({"from": _hafta(r["day"])[0], "to": r["day"],
                    "durum": GECMIS_DURUM.get(r["state"], r["state"])})
    return out


def _ortanca(xs):
    s = sorted(xs)
    n = len(s)
    if not n:
        return None
    return s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2.0


def report(con, date, th=None, gun=7, onceki_gun=None, pencere="hafta"):
    """Haftalik rapor — sayilar ve hareket, hukum degil. Ay sonu mektubu
    ayni hesabi takvim ayiyla kullanir (gun = ayin uzunlugu, onceki_gun =
    onceki ayin uzunlugu)."""
    pn = PENCERE[pencere]
    bu_bas, bu_son = _hafta(date, 0, gun)
    on_son = (datetime.date.fromisoformat(bu_bas) - datetime.timedelta(days=1)).isoformat()
    on_gun = onceki_gun or gun
    on_bas = _hafta(on_son, 0, on_gun)[0]
    bu = twin.series(con, bu_son, gun)
    onceki = twin.series(con, on_son, on_gun)
    ASGARI_GUN = pn["asgari"]

    satirlar = []
    for anahtar in sorted(bu):
        kayit = bu[anahtar]
        degerler = [p[1] for p in kayit["points"]]
        if len(degerler) < ASGARI_GUN:
            satirlar.append({"key": anahtar, "module": kayit["module"],
                             "metric": kayit["metric"], "n": len(degerler),
                             "status": "missing",
                             "note": "%d gün ölçüldü; %s ortancası için %d "
                                     "gerekir." % (len(degerler), pn["ad"], ASGARI_GUN)})
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
                        ("; %s göre %%%d %s"
                         % (pn["onceki"], round(abs(fark) * 100),
                            "yukarıda" if fark > 0 else "aşağıda"))
                        if fark is not None else " (%s, karşılaştırma yok)" % pn["olcul"]))})

    # Sirali gelsin: en cok hareket eden olcu once. Siralamayi arayuze
    # birakmak, ayni veriyi iki yerde yorumlamak olurdu.
    satirlar.sort(key=lambda x: -abs(x.get("change") or 0))

    from core import adlar
    for x in satirlar:
        # Ekran adi da BURADA verilir: yuz, mesaj ve belge ayni adi yazar.
        x["ad"] = adlar.metrik(x["metric"])
        x["degisim"] = _degisim(x)

    kapsam = twin.snapshot(con, bu_son, gun)
    capraz = cross.findings(con, bu_son, 60)
    etki = impact.summary(con)
    gorulen = {m: kapsam["modules"][m]["days_seen"] for m in kapsam["modules"]}
    return {"from": bu_bas, "to": bu_son, "previous": [on_bas, on_son],
            "rows": satirlar, "coverage": kapsam["coverage"],
            "days_seen": gorulen,
            "kazanimlar": kazanimlar(satirlar, gorulen, th, gun=gun, pencere=pencere),
            "cross": capraz[:2], "impact": etki["verdict"],
            "note": "Hafta bir toplam değil bir kapsamdır: eksik günleri "
                    "saymadan verilen bir ortalama, ölçülmeyen günleri sıfır "
                    "saymaktır."}


def _uyku_uzaklik(x, alt):
    return alt - x if x < alt else (x - UYKU_UST if x > UYKU_UST else 0.0)


def _iyilesme(s, alt_uyku):
    """Satirin iyi yondeki hareketi (0..1+) ya da None. Yon kodda durur."""
    if s.get("status") != "compared" or s.get("change") is None:
        return None
    m = s["metric"]
    if m == "sleep_hours":
        once, simdi = _uyku_uzaklik(s["previous"], alt_uyku), _uyku_uzaklik(s["median"], alt_uyku)
        return abs(s["change"]) if once > 0 and simdi < once else None
    yon = YON.get(m)
    if not yon:
        return None
    iyi = s["change"] * yon
    return iyi if iyi > 0 else None


def kazanimlar(satirlar, gorulen, th=None, gun=7, pencere="hafta"):
    """En cok KAZANIM_EN_COK olculmus iyi sey; hepsi «hesaplandı» etiketli."""
    from core import adlar
    alt = float(((th or {}).get("bio") or {}).get("sleep_hours_min", 7.0))
    aday = []
    for s in satirlar:
        iyi = _iyilesme(s, alt)
        if iyi is None or iyi * 100 < KAZANIM_ESIK:
            continue
        aday.append((-iyi, s["key"], {
            "metric": s["metric"], "module": s["module"], "etiket": "hesaplandı",
            "change_pct": s["change_pct"],
            "metin": "%s (%s): ortanca %s → %s (%s)" % (
                adlar.metrik(s["metric"]), adlar.modul(s["module"]),
                _fmt(s["previous"]), _fmt(s["median"]), _degisim(s))}))
    aday.sort(key=lambda x: (x[0], x[1]))
    out = [x[2] for x in aday[:KAZANIM_EN_COK]]
    esik = PENCERE[pencere]["duzen"]
    duzenli = [m for m in ("ays", "spi", "esp") if (gorulen or {}).get(m, 0) >= esik]
    if duzenli and len(out) < KAZANIM_EN_COK:
        out.append({"metric": "duzen", "module": None, "etiket": "hesaplandı",
                    "change_pct": None,
                    "metin": " · ".join("%s: %d günde %d gün kayıt"
                                        % (adlar.modul(m), gun, gorulen[m]) for m in duzenli)})
    return out


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
        parca.append("• %s: %s" % (s["ad"], s["note"]))
    if not karsilastirilan:
        parca.append("Haftalık karşılaştırma için yeterli ölçüm yok. "
                     "Bu, «kötü hafta» demek değildir.")
    if r["kazanimlar"]:
        parca.append("Bu hafta neler kazandın (hesaplandı):")
        parca.extend("✓ " + k["metin"] for k in r["kazanimlar"])
    else:
        parca.append("Bu hafta ölçülmüş bir artış yok."
                     + (" Bu, «kötü hafta» demek değildir." if karsilastirilan else ""))
    for c in r["cross"]:
        parca.append("Çapraz: " + c["note"])
    if (r["impact"] or {}).get("note"):
        parca.append("Etki: " + r["impact"]["note"])
    metin = "\n".join(parca)
    if manager.imperatives(metin):
        return "Haftalık rapor buyurgan kip taşıdığı için düşürüldü."
    return metin


# ------------------------------------------------------------ ay sonu
#
# Fikir 51 — ay sonu mektubu: haftalik raporun ayni hesabi, 30 gunluk
# pencere. Ayin ilk gunu ONCEKI ayi (ayin son gunu, 30 gun) gecen ayla
# karsilastirir. Sayi burada uretilmez, report()'tan gelir.

def aylik_mesaj(con, date, th=None):
    """`date`: ayin son gunu (ya da ayin icinde bir gun: 1'inden o gune)."""
    d = datetime.date.fromisoformat(date)
    onceki_son = d.replace(day=1) - datetime.timedelta(days=1)
    r = report(con, date, th=th, gun=d.day, onceki_gun=onceki_son.day, pencere="ay")
    parca = ["HKM · ay sonu mektubu · %s → %s (geçen ayla)" % (r["from"], r["to"])]
    g = r["days_seen"]
    parca.append("Kayıtlı gün: AYS %d · SPİ %d · ESP %d (%d günde)"
                 % (g.get("ays", 0), g.get("spi", 0), g.get("esp", 0), d.day))
    kars = [s for s in r["rows"] if s["status"] == "compared"]
    for s in kars[:5]:
        parca.append("• %s: %s" % (s["ad"], s["note"]))
    if not kars:
        parca.append("Aylık karşılaştırma için yeterli ölçüm yok. Bu, «kötü ay» demek değildir.")
    if r["kazanimlar"]:
        parca.append("Bu ay neler kazandın (hesaplandı):")
        parca.extend("✓ " + k["metin"] for k in r["kazanimlar"])
    else:
        parca.append("Bu ay ölçülmüş bir artış yok.")
    metin = "\n".join(parca)
    if manager.imperatives(metin):
        return "Aylık mektup buyurgan kip taşıdığı için düşürüldü."
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

    if r["kazanimlar"]:
        bol.append({"baslik": "Neler kazandın", "bloklar": [
            {"t": "liste", "maddeler": [k["metin"] for k in r["kazanimlar"]]},
            {"t": "not", "metin": "Yalnız yönü belli ölçüler; %%%d'in altındaki hareket "
                                  "sayılmaz. Düzen: 7 günün en az %d'inde kayıt. XP'ye "
                                  "bakılmaz." % (KAZANIM_ESIK, DUZEN_GUN)}]})

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
