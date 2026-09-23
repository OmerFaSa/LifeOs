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

   5. BAKIM SESSIZ OLUR VE MESAJ URETMEZ. Gunluk yedek ve budama da
      buradan kosar ama kimseye mesaj atmaz: bakim, kullanicinin dikkatini
      hak eden bir olay degildir — BASARISIZ OLDUGUNDA hak eder.
"""

import datetime
import os

from core import manager, outbox, patron

VARSAYILAN = {
    "enabled": False,
    # Bos birakilirsa ACIK OLAN kanal kullanilir. Sabit «whatsapp»
    # varsayilani, yalnizca Telegram kuran kullanicinin mesajlarini hicbir
    # yere gitmeyen bir kuyruga yaziyordu.
    "channel": "",
    "morning": "08:00",      # gunun brifingi
    "evening": "",           # bos: kapali
    # Aksam yoklamasi: bot «bugun ne yaptin?» diye SORAR. Cevap bir rapordur
    # (core/dil.py `rapor`) ve ilgili modullere kayit teklifi olur.
    "checkin": "",           # bos: kapali — ornek "21:30"
    "weekly_day": "",        # ornek: "pazartesi" — bos: kapali
    "weekly_time": "09:00",
    "tolerance_minutes": 90,
    # Bakim AYRI bir anahtarla acilir: kanal ayari kapaliyken de yedek
    # alinabilmeli. «Mesaj gondermiyorum» ile «kendimi korumuyorum» ayri
    # seylerdir.
    "maintenance": True,
    "maintenance_time": "03:30",
    "keep_days": 270,          # dokuz ay — ufuk disiplininin karsiligi
}

GUNLER = {"pazartesi": 0, "sali": 1, "carsamba": 2, "persembe": 3,
          "cuma": 4, "cumartesi": 5, "pazar": 6}


def acik_kanal(cfg):
    """Hangi kanala gonderilecek: ACIK olani.

    Kanal secimi bos birakilabilmeli ve dogru cevabi sistem bilmeli.
    Ikisi de aciksa Telegram once gelir: yoklama ile calisan, hicbir kapi
    acmayan yol odur."""
    from core import channels
    for ad in ("telegram", "whatsapp"):
        if channels.enabled(cfg, ad):
            return ad
    return ""


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

    for tur, alan in (("daily", "morning"), ("evening", "evening"),
                      ("checkin", "checkin")):
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
    kanal = a.get("channel") or acik_kanal(cfg)
    if not kanal:
        return {"ok": False, "reason": "no-channel",
                "note": "Açık bir sohbet kanalı yok."}

    if job["kind"] == "weekly":
        from core import weekly
        metin = weekly.message(con, gun, th=th)
    elif job["kind"] == "checkin":
        metin = yoklama_metni(con, gun)
        # Aksam kapanisi kapaliysa «yarin sunlar var» yoklamaya eklenir.
        if not _dakika(a.get("evening")):
            metin = _yarin_ekle(con, cfg, gun, metin)
    elif job["kind"] == "evening":
        b = manager.brief(con, gun, th=th)
        kapanis = [l["text"] for l in b["lines"] if l["kind"] in ("vp", "coverage")]
        metin = "HKM · %s · gün kapanışı\n%s" % (gun, "\n".join("• " + x for x in kapanis))
        metin = _yarin_ekle(con, cfg, gun, metin)
    else:
        m = patron.daily_message(con, gun, th=th)
        if not m["ok"]:
            return {"ok": False, "reason": "imperative", "note": m["error"]}
        metin = m["text"]
        # Dunun eksik kalan TEK olcumu sorulur (core/eksik.py); cevap «7»
        # gibi tek sayi olabilir ve ilgili module teklif olur.
        from core import eksik
        soru = eksik.sor(con, gun, kanal=kanal, now=now)
        if soru:
            metin += "\n\n" + soru

    if manager.imperatives(metin):
        # Reddet-ve-dus: zamanlanmis bir mesaj da emir kipi tasiyamaz.
        return {"ok": False, "reason": "imperative"}
    belge = job["kind"] == "weekly" and kanal == "telegram"
    if job["kind"] == "weekly" and not belge:
        # Bu kanala belge yolu yok (channels.send_document); bu SOYLENIR.
        metin += "\nRaporun PDF’i: HKM › Sistemler › Haftalık karşılaştırma’dan indirebilirsin."
    r = outbox.enqueue(con, kanal, job["kind"], gun, metin, now=now)
    out = {"ok": True, "queued": not r["duplicate"], "kind": job["kind"],
           "chars": len(metin)}
    if belge:
        # Haftalik rapor PDF olarak da gider. Bayt ambara yazilmaz: giden
        # kutusu gonderim aninda raporun KENDI haftasini basar.
        d = outbox.enqueue(con, kanal, "weekly:belge", gun,
                           "Haftalık rapor · %s haftası (PDF)" % gun, now=now,
                           ek={"haftalik": gun, "bicim": "pdf"})
        out["belge"] = not d["duplicate"]
    return out


YARIN_EN_COK = 3
YARIN_SIRA = (("ays", "AYS"), ("spi", "SPİ"), ("esp", "ESP"))


def yarin_metni(con, gun):
    """Aksam «yarin sunlar var» — en cok UC is, modullerin KENDI sectigi.

    HKM is secmez ve sayi uretmez: her modulun yolladigi ilk isler sirayla
    (AYS, SPI, ESP) dizilir. Yarina ait goruntu yoksa hicbir sey soylenmez
    — eski bir gunun listesi yarinin listesi gibi gosterilmez."""
    from core import hedefag
    yarin = (datetime.date.fromisoformat(gun) + datetime.timedelta(days=1)).isoformat()
    kume = hedefag.yarin_oku(con, yarin)
    if not kume:
        return None
    secilen, tur = [], 0
    while len(secilen) < YARIN_EN_COK:
        eklendi = False
        for mod, ad in YARIN_SIRA:
            isler = kume.get(mod) or []
            if tur < len(isler) and len(secilen) < YARIN_EN_COK:
                x = isler[tur]
                secilen.append("• %s — %s%s" % (ad, x["metin"],
                                                 " (%d dk)" % x["dk"] if x.get("dk") else ""))
                eklendi = True
        if not eklendi:
            break
        tur += 1
    if not secilen:
        return None
    return ("Yarın şunlar var:\n%s\nDeğiştirmek istersen «yarın hafif» yaz (yük azaltma "
            "teklifi modüllere gider) ya da «yarın 1 saat matematik» gibi yaz."
            % "\n".join(secilen))


def _yarin_ekle(con, cfg, gun, metin):
    from core import bildirim
    if not bildirim.settings(cfg).get("yarin") or bildirim.susturuldu_mu(con, "yarin"):
        return metin
    y = yarin_metni(con, gun)
    return metin + "\n\n" + y if y else metin


def yoklama_metni(con, gun):
    """Aksam yoklamasi — bir SORU. Cevap sohbete gelir, bir rapor olarak
    okunur (core/dil.py `rapor`) ve ilgili modulun kuyruguna teklif olur.
    HKM hicbir module yazmaz; soru da bir sayi soylemez, yalniz o gun
    HANGI modulden kayit gelmedigini soyler (etiketsiz bir yargi degil)."""
    from core import sync_engine
    denetim = sync_engine.latest_audits(con, gun)
    sessiz = [ad for vp, ad in (("academic", "AYS"), ("bio", "SPİ"),
                                ("intellect", "ESP")) if not denetim.get(vp)]
    satir = ["HKM · %s · akşam yoklaması" % gun,
             "Bugün ne yaptın? Tek cümle yeter: «2 saat matematik çalıştım, "
             "7 saat uyudum, 30 dakika gitar çaldım» ya da kısaca «soru 40, "
             "uyku 7, gitar 30»."]
    if sessiz:
        satir.append("Bugün kaydı görünmeyen: %s." % ", ".join(sessiz))
    satir.append("Yazdığını ilgili modüle teklif olarak bırakırım; modülde sen "
                 "onaylamadan hiçbir yere yazılmaz.")
    return "\n".join(satir)


# Bakim: yedek + budama. Mesaj uretmez, giden kutusuna dokunmaz.
BAKIM_KOPYA_SAKLA = 7          # bir haftalik gunluk yedek


def maintenance(con, cfg, now=None):
    """Gunluk bakim — sessiz, ama basarisizligi SESSIZ DEGIL.

    Uc is:
      · gunluk yedek kopyasi (KURULUM.md «kopyalamamak dokuz aylik kaydi
        tek bir disk hatasina baglar» diyordu ama kopyalayan yoktu),
      · dokuz aydan eski ham olaylarin budanmasi — kararlar KALIR,
      · gelen mesaj kimlik defterinin budanmasi.

    Hicbiri firlatmaz: bir bakim hatasi daemon'u durduramaz, ama sonuc
    dondurulur ve gorunur olur."""
    from core import db
    now = now or datetime.datetime.now()
    a = settings(cfg)
    sonuc = {"date": now.date().isoformat(), "backup": None,
             "pruned_events": None, "pruned_inbox": None, "errors": []}
    try:
        sonuc["backup"] = db.snapshot_file(con, etiket="gunluk",
                                           sakla=BAKIM_KOPYA_SAKLA)
    except Exception as e:                      # noqa: BLE001
        sonuc["errors"].append("yedek: %s" % e)
    try:
        gun = int(a.get("keep_days") or 270)
        r = db.prune_events(con, gun)
        sonuc["pruned_events"] = r.get("deleted")
    except Exception as e:                      # noqa: BLE001
        sonuc["errors"].append("budama: %s" % e)
    try:
        sonuc["pruned_inbox"] = db.prune_inbox(con).get("deleted")
    except Exception as e:                      # noqa: BLE001
        sonuc["errors"].append("gelen defteri: %s" % e)
    return sonuc


def _bakim_vakti(cfg, now):
    """Bakim vakti geldi mi — hedef saatten SONRA, gunde bir kez.

    Once pencere KATIYDI: hedef + `tolerance_minutes` (90 dk). Yani bakim
    yalnizca 03:30-05:00 arasi makine ACIKSA kosuyordu. Geceleri kapatilan
    bir dizustunde o pencere hic acilmiyor ve otomatik yedek HIC
    alinmiyordu — dokuz aylik ambar tek bir disk hatasina bagli kaliyordu.

    «Gecmis is kovalanmaz» bu depoda bir BILDIRIM kuralidir ve dogrudur:
    sabah 08:00 hatirlaticisini aksam 20:00'de gostermek yanlistir, cunku
    hatirlaticinin degeri ZAMANINDADIR. Yedegin degeri zamaninda degil
    VARLIGINDADIR: gec alinan yedek, hic alinmayandan iyidir. Bu yuzden
    kural burada tersine cevrildi.

    Gunde bir kez guvencesi bu pencereden gelmiyor, `_bugun_bakim_yapildi`
    dosyaya bakarak veriyor — o yuzden pencereyi acmak ikinci bir yedek
    uretmez. `tolerance_minutes` bildirimlerde (`due`) kullanilmaya devam
    ediyor."""
    a = settings(cfg)
    if not a.get("maintenance"):
        return False
    hedef = _dakika(a.get("maintenance_time") or "03:30")
    if hedef is None:
        return False
    return (now.hour * 60 + now.minute) >= hedef


def _bugun_bakim_yapildi(now, con=None):
    """Bugunun yedegi zaten alindi mi — DOSYADAN bakilir.

    Bellekteki bir bayrak, daemon yeniden baslatildiginda kaybolur ve ayni
    gun ikinci bir yedek alinir. Gunun kopyasi zaten diskte duruyor;
    dogruyu oradan sormak, ayri bir kayit tutmaktan daha az yalan soyler.

    HANGI klasore bakilacagi BAGLANTIDAN gelir: kopyalar ambarin yanina
    yazilir (`db.kopya_kok`). Modul sabitine bakmak, ambari baska bir yere
    koymus kullanicida «bugun yedek alinmadi» diye her tikta yeni bir
    yedek aldirirdi."""
    from core import db
    kok = (db.kopya_kok(con) if con is not None else None) \
        or os.path.dirname(db.DB_PATH)
    damga = now.strftime("%Y%m%d")
    try:
        return any(a.startswith("hkm-gunluk-%s" % damga)
                   for a in os.listdir(kok))
    except OSError:
        return False


def tick(con, cfg, now=None, th=None, transport=None):
    """Daemon'un dakikalik tiki: vadesi gelen isleri kuyruga koy, kuyrugu
    bosalt. Hicbir kosulda firlatmaz — bir zamanlayici hatasi daemon'u
    durduramaz."""
    now = now or datetime.datetime.now()
    sonuc = {"jobs": [], "flush": None, "maintenance": None}
    try:
        # Cevapsiz teklif N gun sonra soylenerek kapanir (core/bildirim.py).
        # Otomatik mesajlar kapaliyken de: bu bir bakimdir, mesaj degil.
        from core import bildirim
        sonuc["kapanan"] = len(bildirim.bayatlari_kapat(con, cfg, now))
        for job in due(cfg, now):
            sonuc["jobs"].append(run(con, cfg, job, now=now, th=th))
        sonuc["flush"] = outbox.flush(con, cfg, now=now, transport=transport)
        # Bakim gunde BIR kez: ayni gun ikinci kez kosmaz. Isaret ambarda
        # degil bellekte tutulmaz — gunun kopyasi zaten dosyada durur.
        if _bakim_vakti(cfg, now) and not _bugun_bakim_yapildi(now, con):
            sonuc["maintenance"] = maintenance(con, cfg, now=now)
    except Exception as e:                      # noqa: BLE001
        sonuc["error"] = "%s: %s" % (type(e).__name__, e)
    return sonuc
