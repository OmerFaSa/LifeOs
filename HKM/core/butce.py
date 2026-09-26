# -*- coding: utf-8 -*-
"""Bütçe — paranın ölçümü, tahmini değil.

   Fatura ay sonunda gelir. O zamana kadar «ne kadar harcadim» sorusunun
   cevabi ya OLCUMDUR ya da tahmindir; bu sistemde tahmin, olcumun yerine
   gecmez. Bu yuzden her cagri — BASARISIZ OLANI DA — bir satir yazar ve
   ay ici toplam her an bilinir.

   Bes kural:

   1. TAVAN ASILMAZ, ASILMASI GEREKEN DE DEGILDIR. Tavan bir hedef degil
      bir SINIRDIR; sinira yaklasilmasi bir basari olcusu degildir.

   2. SINIRDA UCRETLI CAGRI DURUR. %100'e varildiginda ucretli cagri
      YAPILMAZ — «birazcik asalim» diyen bir sistem, sinirin kendisini
      kaldirmis olur. Ucretsiz yollar (kural motoru) calismaya devam eder:
      HKM modelsiz de calisir.

   3. KUR ELLE GIRILIR VE TARIHLIDIR. Kuru sessizce internetten cekmek,
      hesabi her gun degistiren gorunmez bir degisken eklemektir. Kur
      yapilandirmada durur, tarihi yanindadir ve eskidiginde SOYLENIR.

   4. OLCULMEYEN KATEGORI SIFIR DEGILDIR. Hic kullanilmamis bir yetenek
      icin «0 TL» yazmak, o kategorinin bedava oldugunu ima eder.
      Kullanilmamissa «olculmedi» yazilir.

   5. TAHMIN IKI SAYIDIR. Tek bir aylik tahmin, iyimser gunun tahminidir.
      p50 (ortanca gun) ve p90 (yogun gun) ayri ayri verilir.
"""

import contextlib
import datetime
import threading

VARSAYILAN = {
    "monthly_try": 850.0,       # ust sinir — harcanmasi gereken tutar DEGIL
    "monthly_usd": 20.0,        # tavan USD cinsinden tutulursa
    # Tavan HANGI PARA BIRIMINDE: "try" ya da "usd".
    #
    # Bu secim bir kolaylik degil, bir TIKANIKLIGIN cozumudur. Tavan
    # yalnizca TL olabilseydi, TL hesabi icin kur gerekirdi; kur
    # girilmeden hicbir model cagrisi yapilamazdi ve kullanici
    # «anahtari girdim ama sohbet calismiyor» derdi — anahtari dogru,
    # modeli dogru, ama BASKA BIR SEKMEDEKI bos bir kur alani yuzunden.
    # Tavan USD tutulursa kur hic gerekmez: harcama zaten USD olculur.
    # VARSAYILAN USD'dir — cunku kurulumdan hemen sonra CALISAN tek
    # secenek odur. TL'ye cevirmek tek tiktir ve kur alani orada durur.
    "ceiling_currency": "usd",
    "usd_try": 0.0,             # elle girilir; 0 ise TL hesabi yapilamaz
    "rate_date": "",            # kurun girildigi gun
    "warn_pct": [50, 80, 95],   # uyari bantlari
    "stop_at_pct": 100,         # bu orana varilinca ucretli cagri durur
    "users": ["ben"],
}

PARA = {"try": "TL", "usd": "USD"}

ARALIK = {
    "monthly_try": (0.0, 100000.0),
    "monthly_usd": (0.0, 5000.0),
    "usd_try": (0.0, 1000.0),
    "stop_at_pct": (10, 100),
}

# Kur bu kadar gun eskimisse SOYLENIR: eski bir kurla yapilan TL hesabi,
# dogru gorunen yanlis bir sayidir.
KUR_ESKIME_GUN = 30

GOREVLER = ("sohbet", "ozet", "gorev_cikar", "gorsel_oku", "belge_tablo",
            "yorum", "arastir")


def settings(cfg):
    a = dict(VARSAYILAN)
    gelen = (cfg or {}).get("budget")
    if isinstance(gelen, dict):
        for k, v in gelen.items():
            if k in a:
                a[k] = v
    return a


def validate(patch):
    hata = []
    if not isinstance(patch, dict):
        return False, ["budget bir nesne olmalı"]
    for k, v in patch.items():
        if k not in VARSAYILAN:
            hata.append("bilinmeyen bütçe alanı: %s" % k)
            continue
        if k in ARALIK:
            if isinstance(v, bool) or not isinstance(v, (int, float)):
                hata.append("budget.%s bir sayı olmalı" % k)
                continue
            alt, ust = ARALIK[k]
            if not (alt <= v <= ust):
                hata.append("budget.%s %s–%s aralığında olmalı" % (k, alt, ust))
        elif k == "rate_date":
            if not isinstance(v, str):
                hata.append("budget.rate_date bir dize olmalı")
            elif v:
                try:
                    datetime.date.fromisoformat(v)
                except ValueError:
                    hata.append("budget.rate_date yyyy-mm-dd olmalı")
        elif k == "ceiling_currency":
            if v not in PARA:
                hata.append("budget.ceiling_currency «try» ya da «usd» olmalı")
        elif k in ("warn_pct", "users"):
            if not isinstance(v, list):
                hata.append("budget.%s bir liste olmalı" % k)
    return (not hata), hata


def apply(cfg, patch):
    yeni = dict(cfg or {})
    b = dict(settings(cfg))
    b.update({k: v for k, v in (patch or {}).items() if k in VARSAYILAN})
    yeni["budget"] = b
    return yeni


# ---------------------------------------------------------------- kayit

# Cagri hangi BAM isine ait? BAM bir adimi kosarken isin kimligini BU IS
# PARCACIGINA yazar (bam.ilerlet); defter onu cagriyla birlikte kaydeder.
# Modul duzeyinde tek bir degisken olsaydi, ayni anda sohbet eden bir HTTP
# is parcacigi kendi cagrisini ritimdeki ise yazdirirdi.
_BAGLAM = threading.local()


@contextlib.contextmanager
def is_baglami(is_id):
    onceki = getattr(_BAGLAM, "is_id", None)
    _BAGLAM.is_id = int(is_id) if is_id else None
    try:
        yield
    finally:
        _BAGLAM.is_id = onceki


def record(con, *, role, task, provider, model, user="ben", in_tok=0, out_tok=0,
           image_tok=0, reason_tok=0, usd=0.0, rate=0.0, cached=False,
           escalated=False, ok=True, note="", now=None, is_id=None, veri=None, cached_tok=0):
    """Bir cagriyi deftere yazar. BASARISIZ CAGRI DA YAZILIR: para, cevap
    alinmadan da harcanmis olabilir. `is_id` verilmezse is parcaciginin
    baglamindaki BAM isi yazilir (is_baglami)."""
    t = now or datetime.datetime.now()
    if is_id is None:
        is_id = getattr(_BAGLAM, "is_id", None)
    con.execute(
        "INSERT INTO usage(created_at, day, user, role, task, provider, model,"
        " in_tok, out_tok, image_tok, reason_tok, usd, try_, rate, cached,"
        " escalated, ok, note, is_id, veri, cached_tok)"
        " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (t.isoformat(timespec="seconds"), t.date().isoformat(), user, role, task,
         provider, model, int(in_tok), int(out_tok), int(image_tok),
         int(reason_tok), float(usd), float(usd) * float(rate), float(rate),
         1 if cached else 0, 1 if escalated else 0, 1 if ok else 0, note or "",
         int(is_id) if is_id else None,
         ",".join(sorted(set(veri))) if veri else None, int(cached_tok or 0)))
    con.commit()
    return {"ok": True}


def is_maliyeti(con, is_id):
    """Bir BAM isinin OLCULEN maliyeti: o ise yazilmis cagrilarin toplami.
    Basarisiz cagri da sayilir; para cevapsiz da harcanmis olabilir."""
    r = con.execute("SELECT COUNT(*) n, COALESCE(SUM(usd),0) usd, COALESCE(SUM(in_tok),0) gir, "
                    "COALESCE(SUM(out_tok),0) cik, COALESCE(SUM(CASE WHEN note LIKE '%tahmini-%' "
                    "THEN 1 ELSE 0 END),0) tahmini FROM usage WHERE is_id=?",
                    (int(is_id),)).fetchone()
    return {"cagri": r["n"], "usd": round(r["usd"], 6), "in_tok": r["gir"], "out_tok": r["cik"],
            # Tarifesi bilinmeyen modelde fiyat, kullanim bilgisi gelmeyen
            # cagrida jeton tahmindir (D-16); bu soylenir.
            "etiket": "tahmin" if r["tahmini"] else "olculdu"}


# ----------------------------------------------------------------- okuma

def _ay_sinirlari(date):
    g = datetime.date.fromisoformat(date)
    bas = g.replace(day=1)
    son = (bas + datetime.timedelta(days=32)).replace(day=1)
    return bas.isoformat(), son.isoformat(), g


def month(con, cfg, date=None):
    """Bu ayin durumu. Harcama OLCUMDUR; kalan gun bir tahmin degildir."""
    date = date or datetime.date.today().isoformat()
    bas, son, bugun = _ay_sinirlari(date)
    a = settings(cfg)
    satirlar = con.execute(
        "SELECT user, task, provider, model, SUM(try_) t, SUM(usd) u,"
        " COUNT(*) n, SUM(cached) c FROM usage WHERE day>=? AND day<? "
        "GROUP BY user, task, provider, model", (bas, son)).fetchall()

    toplam = sum(r["t"] for r in satirlar)
    # USD harcamasi KURDAN BAGIMSIZ olculur: jeton fiyatlari zaten USD.
    # Kur yalnizca TL'ye cevirmek icin gerekir; olcumun kendisi icin degil.
    toplam_usd = sum(r["u"] for r in satirlar)
    kisi, gorev = {}, {}
    for r in satirlar:
        kisi[r["user"]] = kisi.get(r["user"], 0.0) + r["t"]
        gorev[r["task"]] = gorev.get(r["task"], 0.0) + r["t"]

    birim = a.get("ceiling_currency") or "try"
    if birim == "usd":
        tavan = float(a.get("monthly_usd") or 0)
        harcanan = toplam_usd
    else:
        tavan = float(a["monthly_try"] or 0)
        harcanan = toplam
    oran = (harcanan / tavan * 100.0) if tavan else None

    # Modul basina (fikir 47): BAM isinin cagrisi o isi isteyen modulun,
    # «ays.» rollu cagri AYS'nin, gerisi (sohbet, King) HKM'nin. Modullerin
    # KENDI anahtarlariyla yaptigi cagrilar HKM'den gecmez, burada yoktur.
    modul = {r["m"]: r for r in con.execute(
        "SELECT CASE WHEN e.modul IS NOT NULL THEN e.modul "
        "WHEN u.role LIKE 'ays.%' THEN 'ays' WHEN u.role LIKE 'spi.%' THEN 'spi' "
        "WHEN u.role LIKE 'esp.%' THEN 'esp' ELSE 'hkm' END m, "
        "SUM(u.try_) t, SUM(u.usd) usd, COUNT(*) n FROM usage u "
        "LEFT JOIN (SELECT bam_is_id, MIN(modul) modul FROM is_emirleri "
        "WHERE bam_is_id IS NOT NULL GROUP BY bam_is_id) e ON e.bam_is_id = u.is_id "
        "WHERE u.day>=? AND u.day<? GROUP BY m", (bas, son))}
    modul_satir = [{"modul": k, "measured": k in modul,
                    "try": round(modul[k]["t"], 2) if k in modul else None,
                    "usd": round(modul[k]["usd"], 4) if k in modul else None,
                    "calls": modul[k]["n"] if k in modul else None}
                   for k in ("ays", "spi", "esp", "hkm")]

    # Olculmeyen kategori SIFIR DEGILDIR.
    gorev_satir = []
    for g in GOREVLER:
        gorev_satir.append({"task": g,
                            "try": round(gorev[g], 2) if g in gorev else None,
                            "measured": g in gorev})

    gun_sayisi = bugun.day
    kalan_gun = (datetime.date.fromisoformat(son)
                 - datetime.timedelta(days=1)).day - gun_sayisi

    return {
        "month": bas[:7], "date": date,
        "spent_try": round(toplam, 2),
        "spent_usd": round(toplam_usd, 4),
        "currency": birim,
        "currency_label": PARA.get(birim, birim),
        "spent": round(harcanan, 2 if birim == "try" else 4),
        "ceiling": tavan,
        "ceiling_try": float(a["monthly_try"] or 0),
        "ceiling_usd": float(a.get("monthly_usd") or 0),
        "pct": round(oran, 1) if oran is not None else None,
        "calls": sum(r["n"] for r in satirlar),
        "cached": sum(r["c"] for r in satirlar),
        "by_user": {k: round(v, 2) for k, v in sorted(kisi.items())},
        "by_task": gorev_satir,
        "by_modul": modul_satir,
        "days_elapsed": gun_sayisi, "days_left": kalan_gun,
        "rate": a.get("usd_try") or 0,
        "rate_date": a.get("rate_date") or "",
        "rate_stale": _kur_eski_mi(a, bugun),
        "stop_at_pct": a.get("stop_at_pct"),
        "band": _bant(oran, a.get("warn_pct") or []),
        "note": "Tavan bir hedef değil bir SINIRDIR; sınıra yaklaşmak bir "
                "başarı ölçüsü değildir.",
    }


def _kur_eski_mi(a, bugun):
    d = a.get("rate_date") or ""
    if not d:
        return True
    try:
        g = datetime.date.fromisoformat(d)
    except ValueError:
        return True
    return (bugun - g).days > KUR_ESKIME_GUN


def _bant(oran, bantlar):
    if oran is None:
        return None
    asilan = [b for b in sorted(bantlar) if oran >= b]
    return asilan[-1] if asilan else 0


# HATALAR D-18: yoldaki (gonderilmis, henuz deftere yazilmamis) cagrilarin
# en kotu durum maliyeti. Eszamanli iki cagri (ritim BAM + sohbet) ayni
# bos payi iki kez kullanamaz.
_AYRILAN = [0.0]
_AYRILAN_KILIDI = threading.Lock()


@contextlib.contextmanager
def ayir(usd):
    usd = max(0.0, float(usd or 0))
    with _AYRILAN_KILIDI:
        _AYRILAN[0] += usd
    try:
        yield
    finally:
        with _AYRILAN_KILIDI:
            _AYRILAN[0] = max(0.0, _AYRILAN[0] - usd)


def guard(con, cfg, date=None, cost_try=0.0, cost_usd=0.0):
    """Ucretli bir cagri YAPILABILIR MI.

    Sinirda «birazcik asalim» diyen bir sistem, sinirin kendisini kaldirmis
    olur. Ucretsiz yollar (kural motoru) bundan etkilenmez: HKM modelsiz de
    calisir.

    `cost_usd`: bu cagrinin EN KOTU DURUM maliyeti (istem + en uzun cevap).
    Yoldaki cagrilarin ayrilmis payi da eklenir (D-18)."""
    d = month(con, cfg, date)
    tavan = d["ceiling"]
    if not tavan:
        return {"ok": False, "reason": "no-ceiling",
                "note": "Aylık tavan tanımlı değil; ücretli çağrı yapılmaz. "
                        "Ayarlar → Bütçe'den bir tavan yaz."}
    # Tavan USD ise KUR GEREKMEZ: harcama zaten USD olculur. Kur yalnizca
    # TL tavani icin sarttir — ve o zaman da eksigin ADI soylenir.
    if d["currency"] == "try" and not d["rate"]:
        return {"ok": False, "reason": "no-rate",
                "note": "Aylık tavan TL cinsinden ama USD/TRY kuru "
                        "girilmemiş; TL hesabı yapılamaz, bu yüzden model "
                        "çağrısı yapılmıyor. Ayarlar → Bütçe'den kuru yaz "
                        "ya da tavanı USD'ye çevir."}
    dur = tavan * (float(d["stop_at_pct"] or 100) / 100.0)
    harcanan = d["spent"]
    with _AYRILAN_KILIDI:
        yolda = _AYRILAN[0]
    ek_usd = max(0.0, float(cost_usd or 0)) + yolda
    if d["currency"] == "try":
        harcanan += float(cost_try or 0) + ek_usd * float(d["rate"] or 0)
    else:
        harcanan += ek_usd
    # SINIRA VARMAK da durdurur: «%100'e varildiginda ucretli cagri
    # YAPILMAZ». Tam tavanda bir cagriya daha izin vermek, tavani bir
    # cagri kadar yukari tasimakti.
    if harcanan >= dur:
        if d["spent"] >= dur:
            neden = "Aylık sınıra varıldı"
        else:
            # Harcanan sinirin altinda; ama bu cagrinin en kotu durumu ve
            # yoldaki cagrilar eklenince asiyor (D-18).
            neden = ("Bu çağrı aylık sınırı aşabilirdi (yanıtın en uzun hâli ve "
                     "süren çağrılar dahil)")
        return {"ok": False, "reason": "ceiling",
                "spent": d["spent"], "limit": round(dur, 2),
                "note": "%s (%s %s / %s %s); ücretli çağrı "
                        "durduruldu. Kural motoru çalışmaya devam eder."
                        % (neden, d["spent"], d["currency_label"], round(dur, 2),
                           d["currency_label"])}
    return {"ok": True, "spent": d["spent"], "limit": round(dur, 2),
            "currency": d["currency_label"]}


def project(con, cfg, date=None, days=7):
    """Ilk haftanin GERCEK kullanimindan aylik tahmin.

    Tek bir sayi, iyimser gunun tahminidir: p50 (ortanca gun) ve p90
    (yogun gun) ayri ayri verilir. Olculmemis gun sayilmaz — sifir
    sayilirsa tahmin, kullanilmayan gunlerle asagi cekilir."""
    date = date or datetime.date.today().isoformat()
    bugun = datetime.date.fromisoformat(date)
    bas = (bugun - datetime.timedelta(days=days - 1)).isoformat()
    satir = con.execute(
        "SELECT day, SUM(try_) t FROM usage WHERE day>=? AND day<=? "
        "GROUP BY day ORDER BY day", (bas, date)).fetchall()
    gunluk = [r["t"] for r in satir]
    if not gunluk:
        return {"ok": False, "reason": "no-data", "days": days,
                "note": "Henüz ölçüm yok. Boş bir defter, «bedava» demek "
                        "değildir."}
    s = sorted(gunluk)
    p50 = s[len(s) // 2]
    # En yakin sira (nearest-rank). Onceki hal round(0.9*(n-1)) kullaniyordu
    # ve yedi gunluk bir olcumde en yogun gunu HIC secemiyordu: p90, p50 ile
    # ayni cikiyordu. Butce uyarisinda yogun gunu kucuk gostermek, uyarinin
    # kendisini ise yaramaz yapar — az olcumde p90, olculen EN YOGUN gundur
    # ve oyle olmalidir.
    p90 = s[min(len(s) - 1, -(-9 * len(s) // 10) - 1)]
    a = settings(cfg)
    tavan = float(a["monthly_try"] or 0)
    return {
        "ok": True, "days": days, "measured_days": len(gunluk),
        "p50_daily": round(p50, 2), "p90_daily": round(p90, 2),
        "p50_monthly": round(p50 * 30, 2), "p90_monthly": round(p90 * 30, 2),
        "ceiling_try": tavan,
        "fits_p50": (p50 * 30 <= tavan) if tavan else None,
        "fits_p90": (p90 * 30 <= tavan) if tavan else None,
        "note": "Ölçülen %d günün ortancası ve yoğun günü ayrı ayrı 30 güne "
                "uzatıldı. Kullanılmayan gün sayılmadı: sıfır sayılsaydı "
                "tahmin sessizce aşağı çekilirdi.%s" % (
                    len(gunluk),
                    " Az sayıda gün ölçüldüğü için «yoğun gün», ölçülen en "
                    "yoğun gündür." if len(gunluk) < 10 else ""),
    }
