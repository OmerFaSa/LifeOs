# -*- coding: utf-8 -*-
"""Aktif kip — sistemi BASLATMAK (kullanici, 2026-10-18: «sistemi
   aktiflestirme, baslatma dedigimiz bir sey olsun; veri girilip
   girilmedigi o an fark edilsin, analiz yapilmasi gerekiyorsa ben
   soylemeden yapsin, eksikleri tamamlasin»).

   Kapaliyken HKM yalniz sorulunca calisir: brifing yuz acilinca kurulur,
   oneri ancak o zaman Onaylar'a duser. Aktif kipte HKM kendi turunu atar.

   Alti kural:

   1. VARSAYILAN KAPALI. Tek dugmeyle acilir (`aktif.enabled`); kapatmak
      da tek dugmedir. Acmak hicbir modulu degistirmez.
   2. KURAL MOTORU YAPAR. Tur model CAGIRMAZ ve para harcamaz: nabiz,
      brifing, seri ve capraz bulgu, eksik olcum kodun isidir (§1.1).
   3. MODULE YAZILMAZ (§1.4). Degisiklik gerekiyorsa oneri olarak
      Onaylar'a gider (manager.brief -> carry); kullanici karar verir.
      Olculmus hicbir sayi degismez.
   4. TETIK OLAYDIR. Yeni kayit (raw_events), yeni gun, `aralik_dk`
      dolunca nabiz ya da elle «Simdi tara». Kayit gelince ritim uyanir
      (daemon `uyan`): «o an» bir dakikadan kisadir.
   5. HER TUR KAYITLIDIR VE GORUNUR. Ne yapti, neden basladi, ne buldu, ne
      eksik: `aktif_tur`. Eksik veri «veri yok» diye ADIYLA soylenir,
      sifir yazilmaz (§1.2).
   6. HATA TURU DURDURMAZ. Her adim kendi basina; dusen adim turun
      `hata` listesine yazilir, ritim calismaya devam eder.
   7. MODELSIZ IS KENDILIGINDEN, MODELLI IS DOKUNUSLA. Kod isi (haftalik
      rapor, haftada bir kez: `aktif_is`) sormadan yapilir. Model ve butce
      isteyen is (eskiyen arastirmanin yenilenmesi) ACILMAZ; turda
      «yapilabilir» diye listelenir, kullanici kartta dokununca King'e
      HKM'nin kullanici yolundan (modul «hkm», sohbetteki istekle ayni)
      gider ve King'in kapisindan (imkan, teklif, butce) gecer. Listeyi
      sunucu kurar: istemci yalniz kimligi gonderir.
   8. EKSIK ICERIK SOYLENIR, DOLDURULMAZ. Plani olmayan ya da suresi
      gecmis etkin hedef modulun isidir: plani modul kendi sayisiyla kurar
      (SPI hedef.plan govdesi kilo, tempo, enerji ister; HKM'de yoktur ve
      uydurulmaz). Tur yalniz adiyla yazar."""

import datetime
import json

from core import adlar, bam, db, depo, eksik, hedefag, kendiliginden, king, manager, saat, weekly

VARSAYILAN = {"enabled": False, "aralik_dk": 30}
ALANLAR = {"enabled": bool, "aralik_dk": int}
MODULLER = ("ays", "spi", "esp")
NEDEN_AD = {"baslangic": "Sistem başlatıldı", "yeni_gun": "Yeni gün",
            "yeni_kayit": "Yeni kayıt geldi", "nabiz": "Düzenli kontrol", "elle": "Elle tarandı"}
AKSAM_SAATI = 20         # bugunku sessizlik bu saatten sonra «eksik» sayilir
TUR_TUT = 500
ICERIK_EN_COK = 5
YAPILABILIR_EN_COK = 3
ESKI_DURUM = ("eskiyen", "degisti")       # core/depo.py _tazelik
AYLAR = ("Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz",
         "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık")


def settings(cfg):
    out = dict(VARSAYILAN)
    gelen = (cfg or {}).get("aktif")
    if isinstance(gelen, dict):
        for k, tip in ALANLAR.items():
            v = gelen.get(k)
            if isinstance(v, tip) and not (tip is int and isinstance(v, bool)):
                out[k] = v
    return out


def validate(patch):
    """(ok, hatalar). Bilinmeyen alan reddedilir (core/settings.py kural 4)."""
    if not isinstance(patch, dict):
        return False, ["aktif bir nesne olmalı"]
    hata = []
    for k, v in patch.items():
        tip = ALANLAR.get(k)
        if tip is None:
            hata.append("bilinmeyen aktif kip alanı: %s" % k)
        elif tip is bool and not isinstance(v, bool):
            hata.append("aktif.%s true ya da false olmalı" % k)
        elif tip is int and (isinstance(v, bool) or not isinstance(v, int)):
            hata.append("aktif.%s bir sayı olmalı" % k)
        elif k == "aralik_dk" and not (5 <= v <= 240):
            hata.append("aktif.aralik_dk 5–240 arasında olmalı")
    return (not hata), hata


def _an(now):
    if isinstance(now, str):
        return datetime.datetime.fromisoformat(now)
    return now or saat.simdi()


def _gun_yaz(iso):
    try:
        d = datetime.date.fromisoformat(iso[:10])
    except (TypeError, ValueError):
        return str(iso)
    return "%d %s" % (d.day, AYLAR[d.month - 1])


def son_olay(con):
    r = con.execute("SELECT MAX(id) AS m FROM raw_events").fetchone()
    return int(r["m"] or 0)


def son_tur(con):
    r = con.execute("SELECT * FROM aktif_tur ORDER BY id DESC LIMIT 1").fetchone()
    if not r:
        return None
    out = dict(r)
    try:
        out["govde"] = json.loads(out["govde"])
    except ValueError:
        out["govde"] = {}
    return out


def tetik(con, cfg, now=None):
    """Tur gerekiyor mu? Doner: neden anahtari ya da None."""
    a = settings(cfg)
    if not a["enabled"]:
        return None
    at = _an(now)
    son = son_tur(con)
    if son is None:
        return "baslangic"
    if son["gun"] != saat.bugun(at):
        return "yeni_gun"
    if son_olay(con) > int(son["son_olay"] or 0):
        return "yeni_kayit"
    try:
        gecen = at - datetime.datetime.fromisoformat(son["at"])
    except ValueError:
        return "nabiz"
    if gecen >= datetime.timedelta(minutes=a["aralik_dk"]):
        return "nabiz"
    return None


def nabiz(con, gun):
    """Her modulun bugunku durumu. Gelmeyen kayit «veri yok»tur, sifir degil."""
    out = []
    for m in MODULLER:
        bugun = con.execute("SELECT MAX(received_at) AS t FROM raw_events WHERE module=? AND date=?",
                            (m, gun)).fetchone()["t"]
        son = con.execute("SELECT MAX(date) AS d FROM raw_events WHERE module=? AND date<=?",
                          (m, gun)).fetchone()["d"]
        if bugun:
            metin = "Bugün kayıt geldi (%s)." % str(bugun)[11:16]
        elif son:
            metin = "Bugün kayıt yok; son kayıt %s." % _gun_yaz(son)
        else:
            metin = "Henüz hiç kayıt gelmedi."
        out.append({"modul": m, "ad": adlar.modul(m), "bugun": bool(bugun),
                    "son": son, "etiket": "ölçüldü" if bugun else "veri yok", "metin": metin})
    return out


def eksikler(con, gun, at, nb):
    """Icerik eksikleri: dunun eksik olcumu ve aksam olmus sessiz modul.

    Kullanilmayan modul (son yedi gun kayitsiz) eksik sayilmaz: o bir
    eksik degil, bir tercihtir (core/eksik.py kural 3)."""
    out = []
    dun = (datetime.date.fromisoformat(gun) - datetime.timedelta(days=1)).isoformat()
    for s in eksik.SORULAR:
        if eksik._kullaniliyor(con, s["modul"], dun) and eksik._eksik_mi(con, s["modul"], s["metrik"], dun):
            out.append({"modul": s["modul"], "metin": "%s · %s" % (
                adlar.modul(s["modul"]), s["soru"].split(".")[0] + ".")})
    if at.hour >= AKSAM_SAATI:
        for n in nb:
            if not n["bugun"] and eksik._kullaniliyor(con, n["modul"], gun):
                out.append({"modul": n["modul"], "metin": "%s · Bugün henüz kayıt gelmedi." % n["ad"]})
    return out


def bekleyenler(con, gun):
    def say(sql, *a):
        return int(con.execute(sql, a).fetchone()[0] or 0)
    return {
        "oneri": say("SELECT COUNT(*) FROM decisions WHERE state='proposed' AND date=?", gun),
        "teklif": say("SELECT COUNT(*) FROM intents WHERE state='pending'"),
        "king": say("SELECT COUNT(*) FROM is_emirleri WHERE durum IN ('teklif','ara_onay')"),
        "bam_hata": say("SELECT COUNT(*) FROM bam_isler WHERE durum='hata'"),
    }


def _acik_mi(con, tur_, govde):
    """Ayni King isi zaten acik mi? Anahtar King'inkiyle ayni kurulur."""
    temiz, hata = king._govde_temizle(tur_, govde)
    if hata:
        return True                             # kurulamayan is listeye girmez
    anahtar = "hkm:%s:%s" % (tur_, king.ANAHTAR[tur_](temiz))
    return bool(con.execute("SELECT 1 FROM is_emirleri WHERE anahtar=? AND durum IN (%s)"
                            % ",".join("?" * len(king.ACIK)), (anahtar,) + king.ACIK).fetchone())


def icerik(con, gun, at):
    """Eksik icerik ve modelle yapilabilecek isler. Yalniz OKUR.
    Doner: (icerik, yapilabilir)."""
    out, yap = [], []
    for h in hedefag.hedefler(con):
        if h.get("durum") != "aktif" or h.get("modul") not in MODULLER:
            continue
        ad = adlar.modul(h["modul"])
        if not h.get("plan"):
            out.append({"tur": "hedef_plansiz", "modul": h["modul"],
                        "metin": "%s · «%s» hedefinin henüz planı yok; plan %s’de kurulur."
                                 % (ad, h["ozet"], ad)})
        elif h.get("son_tarih") and h["son_tarih"] < gun:
            out.append({"tur": "hedef_gecti", "modul": h["modul"],
                        "metin": "%s · «%s» hedefinin son tarihi (%s) geçti; hedef hâlâ etkin."
                                 % (ad, h["ozet"], _gun_yaz(h["son_tarih"]))})
    tara = depo.tarayici(con, limit=200, now=at.isoformat(timespec="seconds"))
    for k in tara["kayitlar"]:
        t = k["tazelik"]
        if t["durum"] not in ESKI_DURUM:
            continue
        g = (bam.kayit_getir(con, k["id"]) or {}).get("govde") or {}
        if k["tur"] != "arastirma":
            if g.get("dayanak"):
                continue                        # dayandigi arastirma ayrica listelenir
            out.append({"tur": "bam_eski", "modul": "hkm",
                        "metin": "BAM · «%s»: %s" % (k["baslik"], t["metin"])})
            continue
        konu = str(g.get("konu") or "").strip()[:king.MAX_KONU]
        govde = {"arastirma": {"konu": konu}}
        if len(konu) < 3 or _acik_mi(con, "bam.arastirma", govde):
            continue
        yap.append({"id": "arastirma:%d" % k["id"], "tur": "bam.arastirma",
                    "ad": king.TURLER["bam.arastirma"]["ad"], "konu": konu,
                    "kayit_id": k["id"], "model": True, "govde": govde,
                    "neden": "Sistem turu: araştırma kaydı #%d yenilenmeli (%s)."
                             % (k["id"], t["metin"].rstrip(".")),
                    "metin": "«%s» araştırmasını yenile: %s" % (konu, t["metin"])})
    return out[:ICERIK_EN_COK], yap[:YAPILABILIR_EN_COK]


def _donem(gun):
    y, w, _ = datetime.date.fromisoformat(gun).isocalendar()
    return "%d-W%02d" % (y, w)


def haftalik(con, gun, at, th=None):
    """Haftada BIR kez gecen haftanin raporu (kod, model yok). Bu hafta
    yapildiysa None. Rapor kanala GITMEZ: gonderim zamanlayicinin isidir
    (core/schedule.py weekly_day); bu yalniz hazirlar ve kartta gosterir."""
    donem = _donem(gun)
    if con.execute("SELECT 1 FROM aktif_is WHERE ad='haftalik' AND donem=?", (donem,)).fetchone():
        return None
    d = datetime.date.fromisoformat(gun)
    pazar = (d - datetime.timedelta(days=d.isoweekday())).isoformat()
    r = weekly.report(con, pazar, th=th)
    ozet = {"from": r["from"], "to": r["to"], "donem": donem,
            "gun": {m: int((r.get("days_seen") or {}).get(m) or 0) for m in MODULLER},
            "karsilastirilan": sum(1 for s in r["rows"] if s.get("status") == "compared"),
            "kazanim": [k["metin"] for k in r.get("kazanimlar") or []]}
    con.execute("INSERT OR IGNORE INTO aktif_is(ad, donem, at, govde) VALUES ('haftalik',?,?,?)",
                (donem, at.isoformat(timespec="seconds"), json.dumps(ozet, ensure_ascii=False)))
    return ozet


def _haftalik_cumle(o):
    gelen = ["%s %d gün" % (adlar.modul(m), n) for m, n in o["gun"].items() if n]
    aralik = "%s – %s" % (_gun_yaz(o["from"]), _gun_yaz(o["to"]))
    if not gelen:
        return "Geçen haftanın raporu hazırlandı (%s): o hafta hiç kayıt gelmedi." % aralik
    bos = [adlar.modul(m) for m, n in o["gun"].items() if not n]
    return "Geçen haftanın raporu hazırlandı (%s): %s kayıt%s; %s." % (
        aralik, ", ".join(gelen), ("; %s kayıt yok" % ", ".join(bos)) if bos else "",
        ("%d ölçü önceki haftayla karşılaştırıldı" % o["karsilastirilan"])
        if o["karsilastirilan"] else "önceki haftayla karşılaştırılacak kadar ölçüm yok")


def baslat(con, cfg, id_, now=None):
    """Kartta dokunulan «yapilabilir» is. Liste SUNUCUDA yeniden kurulur;
    istemcinin gonderdigi govdeye guvenilmez. King'in kapisindan gecer."""
    at = _an(now)
    _, yap = icerik(con, saat.bugun(at), at)
    j = next((y for y in yap if y["id"] == id_), None)
    if not j:
        return {"ok": False, "status": 409,
                "note": "Bu iş artık yapılabilir listesinde yok; sistemi yeniden tara."}
    r = king.emir_ac(con, cfg, "hkm", j["tur"], j["govde"], konu=j["konu"], neden=j["neden"],
                     now=at.isoformat(timespec="seconds"))
    r = dict(r, status=200 if r.get("ok") else 422)
    if r.get("ok"):
        e = r.get("emir") or {}
        r["note"] = r.get("note") or (
            "King teklifini sundu; maliyeti görüp onaylayınca iş başlar." if r.get("teklif") else
            "King işi reddetti; gerekçesi King ekranında." if r.get("karar") == "ret" else
            "İş King’e gitti (#%s)." % e.get("id"))
    return r


def tur(con, cfg, neden="elle", now=None, th=None):
    """Bir tur: nabiz, brifing (oneri Onaylar'a), eksikler, bekleyenler.
    Hicbir kosulda firlatmaz; turu ambara yazar ve govdesini dondurur."""
    at = _an(now)
    gun = saat.bugun(at)
    olay = son_olay(con)
    govde = {"at": at.isoformat(timespec="seconds"), "gun": gun, "neden": neden,
             "neden_ad": NEDEN_AD.get(neden, neden), "nabiz": [], "yapilan": [],
             "eksik": [], "icerik": [], "yapilabilir": [], "haftalik": None,
             "bekleyen": {}, "hata": []}

    def adim(ad, fn):
        try:
            fn()
        except Exception as e:                  # noqa: BLE001 — tur durmaz
            govde["hata"].append("%s: %s" % (ad, type(e).__name__))

    def _nabiz():
        govde["nabiz"] = nabiz(con, gun)
        gelen = [n["ad"] for n in govde["nabiz"] if n["bugun"]]
        govde["yapilan"].append("Üç modülün kaydı kontrol edildi: " + (
            "bugün %s kayıt gönderdi." % ", ".join(gelen) if gelen else "bugün henüz kayıt yok."))

    def _brifing():
        once = con.execute("SELECT MAX(id) FROM decisions").fetchone()[0] or 0
        b = manager.brief(con, gun, th=th)
        k = b.get("decision")
        if k and int(k["id"]) > once:
            govde["yapilan"].append("Onaylar’a yeni öneri gitti: «%s»" % k["proposal"])
        elif k:
            govde["yapilan"].append("Günün önerisi Onaylar’da kararını bekliyor.")
        else:
            govde["yapilan"].append("Kural motoru bugün için öneri çıkarmadı.")
        seri, capraz = len(b.get("streaks") or []), len(b.get("cross") or [])
        if seri or capraz:
            govde["yapilan"].append("Analiz: %d seri, %d çapraz bulgu (brifingde)." % (seri, capraz))

    def _eksik():
        govde["eksik"] = eksikler(con, gun, at, govde["nabiz"])

    def _icerik():
        govde["icerik"], govde["yapilabilir"] = icerik(con, gun, at)
        for y in govde["yapilabilir"]:
            y.pop("govde", None)                # kimlik yeter; govdeyi sunucu kurar

    def _haftalik():
        o = haftalik(con, gun, at, th=th)
        if o:
            govde["haftalik"] = o
            govde["yapilan"].append(_haftalik_cumle(o))

    def _bekleyen():
        govde["bekleyen"] = bekleyenler(con, gun)

    adim("nabız", _nabiz)
    adim("brifing", _brifing)
    adim("eksikler", _eksik)
    adim("içerik", _icerik)
    adim("haftalık rapor", _haftalik)
    adim("bekleyenler", _bekleyen)

    con.execute("INSERT INTO aktif_tur(at, gun, neden, son_olay, govde) VALUES (?,?,?,?,?)",
                (govde["at"], gun, neden, olay, json.dumps(govde, ensure_ascii=False)))
    con.execute("DELETE FROM aktif_tur WHERE id <= (SELECT MAX(id) FROM aktif_tur) - ?", (TUR_TUT,))
    return govde


def tick(con, cfg, now=None, th=None):
    """Ritmin her tikinde: tetik varsa bir tur. Firlatmaz."""
    try:
        neden = tetik(con, cfg, now)
        return tur(con, cfg, neden, now=now, th=th) if neden else None
    except Exception as e:                      # noqa: BLE001
        return {"hata": ["tik: %s" % type(e).__name__]}


def durum(con, cfg, n=8):
    """Yuzun okudugu: acik mi, son tur ve kisa gecmis."""
    rows = con.execute("SELECT id, at, neden, govde FROM aktif_tur ORDER BY id DESC LIMIT ?",
                       (n,)).fetchall()
    gecmis = []
    for r in rows:
        try:
            g = json.loads(r["govde"])
        except ValueError:
            g = {}
        gecmis.append({"id": r["id"], "at": r["at"], "neden": r["neden"],
                       "neden_ad": NEDEN_AD.get(r["neden"], r["neden"]),
                       "yapilan": len(g.get("yapilan") or []), "eksik": len(g.get("eksik") or []),
                       "icerik": len(g.get("icerik") or [])})
    son = son_tur(con)
    return {"ayar": settings(cfg), "acik": settings(cfg)["enabled"],
            "kendiliginden": kendiliginden.acik(cfg),
            "son": son["govde"] if son else None, "gecmis": gecmis}
