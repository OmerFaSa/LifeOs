# -*- coding: utf-8 -*-
"""King onay zinciri — is emri, imkan kontrolu, tahmini sure, bildirim.
   (ekip/PLAN.md §3.F; Tur 2)

   ZINCIR — katlar atlanmaz (PLAN §1.3):

     modul kocu -> modul Patronu -> HKM alt patronu -> King
                -> BAM Patronu -> ofis patronu -> calisan

   Modul yalniz KENDI adina is emri yazar. Zincirin HKM tarafini (alt
   patron, King, BAM, ofisler) SUNUCU kurar: istemcinin gonderdigi bir
   zincire guvenmek, «King onayladi» satirini disaridan yazdirmak olurdu.

   Bes degismez:

   1. KING UYGULAMAZ, ONAYLAR. Onay, isin BAM'da acilmasidir; hicbir
      modulde hicbir sey degismez. Sonuc teklif olarak doner ve kullanici
      onaylamadan uygulanmaz (AGENTS.md §1.4, §1.9).
   2. IMKAN KONTROLU KODDUR. Is turu tanimli mi, ofisler hazir mi, model
      gerekiyorsa atanmis mi, butce izin veriyor mu, depoda ayni is var
      mi, kuyruk dolu mu. Karar uc tanedir — onay / kismi / ret — ve her
      maddenin gerekcesi yazilir.
   3. TAHMINI SURE «TAHMIN»DIR ve dayanagini soyler: en az uc benzer
      gecmis isin ortancasi ya da (gecmis yoksa) adim sayisi x ritim
      araligi. Is bitince gercek sure de yazilir; sapma olculur.
   4. BILDIRIM BIR KAYITTIR, SES DEGIL. Kuyruga yazilir, modul acilista
      sorar; «okundu» isareti bildirimi silmez. Ayni durum iki kez
      bildirilmez: bildirim DURUM DEGISIMIDIR.
   5. HKM KAPALIYKEN MODUL BOZULMAZ. Is emri acilamaz ve modul bunu
      soyler; kendi plani yine calisir."""
import datetime
import json
import statistics

from core import ai, bam, butce, depo, intents, kaynakli, kitap, mufredat, planlama, urunler, web

# «hkm»: kullanicinin HKM'nin kendisinden (Telegram, HKM ekrani) verdigi is.
# O yolda modul kocu ve Patronu yoktur: kullanici dogrudan King'e yazar.
MODULLER = ("ays", "spi", "esp", "hkm")
MODUL_AD = {"ays": "AYS", "spi": "SPİ", "esp": "ESP", "hkm": "HKM"}
# HKM alt patronu: modulun King'e giden kapisi (core/kanal.py ile ayni).
ALT_PATRON = {"spi": ("bio", "Biyolojik sermaye"), "ays": ("academic", "Akademik hedef"),
              "esp": ("intellect", "Entelektüel gelişim")}
RITIM_SN = 60                  # daemon._ritim: her tikte bir adim
GECMIS_EN_AZ = 3
KUYRUK_EN_COK = 20
MAX_KONU = 200
MAX_NEDEN = 400

# Is turu katalogu. Her tur hangi modulden gelebilir, hangi ofislerden
# gecer, model ister mi ve govdesini kim dogrular — tek yerde. Katalog
# disi tur REDDEDILIR: King serbest bir komut kanali degildir.
TURLER = {
    "hedef.plan": {
        "ad": "Hedef için haftalık program",
        "moduller": ("spi",),
        "ofisler": ["kayit", "planlama"],
        "model": False,
        "not": "Planlama Bürosu v1 kuralla çalışır: program, simülasyon, plan denetimi.",
    },
    # Sinav profilinin iskeleti (core/mufredat.py). Rapor kaynaksizsa
    # «dogrulanmadi»dir; AYS kullanicinin onayiyla profil olarak saklar.
    "sinav.mufredat": {
        "ad": "Sınav müfredat raporu",
        "moduller": ("ays",),
        "ofisler": ["kayit", "arastirma"],
        "model": True,
        "not": "Araştırma Bürosu müfredatı ders ve konu olarak yazar; kod süzer.",
    },
    # Bolumlu test kitabi (core/kitap.py): her tikte bir bolum, bagimsiz
    # cozumle denetim. Zorluk dagilimini kod hesaplar.
    # Katalogdaki HER urun (core/urunler.py): ozet, rapor, ders notu, sunum,
    # pankart, zihin haritasi, zaman cizelgesi… Ofisler istege gore secilir:
    # kaynakli ise Kayit -> Arastirma -> Uretim, degilse Kayit -> Uretim.
    "bam.urun": {
        "ad": "Ürün (özet, rapor, sunum, görsel…)",
        "moduller": ("ays", "spi", "esp", "hkm"),
        "ofisler": ["kayit", "arastirma", "uretim"],
        "model": True,
        "not": "Üretim Bürosu katalogdaki ürünü yazar; biçim ve çizim koddur.",
    },
    # Arastirma istegi (Telegram, HKM sohbeti, modul). King ARASTIRMAZ:
    # Depolama Burosu konuya depoda bakar, guncel mi diye olcer; yoksa ya
    # da degistiyse Arastirma Burosu web'de arastirir (core/depo.py).
    "bam.arastirma": {
        "ad": "Kaynaklı araştırma",
        "moduller": ("ays", "spi", "esp", "hkm"),
        "ofisler": ["kayit", "arastirma"],
        "model": True,
        "not": "Önce Depolama Bürosu bakar; gerekirse Araştırma Bürosu web'de araştırır.",
    },
    "test.kitabi": {
        "ad": "Bölümlü test kitabı",
        "moduller": ("ays",),
        "ofisler": ["kayit", "uretim"],
        "model": True,
        "not": "Üretim Bürosu bölüm bölüm üretir; her soru bağımsız çözümle denetlenir.",
    },
}

DURUMLAR = ("onaylandi", "kismen_onay", "basladi", "bekliyor", "bitti", "kismen",
            "reddedildi", "iptal", "hata")
ACIK = ("onaylandi", "kismen_onay", "basladi", "bekliyor")
BILDIRIM_TURLERI = ("onaylandi", "kismen_onay", "basladi", "bekliyor", "bitti", "kismen",
                    "reddedildi", "iptal", "hata", "guncellik")


def _simdi(now=None):
    return now or datetime.datetime.now().isoformat(timespec="seconds")


def _zaman(s):
    try:
        return datetime.datetime.fromisoformat(str(s))
    except (TypeError, ValueError):
        return None


def _sure_yaz(sn):
    if sn is None:
        return "bilinmiyor"
    sn = int(round(sn))
    if sn < 90:
        return "yaklaşık %d saniye" % max(1, sn)
    dk = int(round(sn / 60.0))
    if dk < 90:
        return "yaklaşık %d dakika" % dk
    return "yaklaşık %d saat" % int(round(dk / 60.0))


# ------------------------------------------------------------------ satir

def _satir(r):
    d = dict(r)
    for k, bos in (("govde", {}), ("iz", []), ("kontrol", []), ("tahmin", None),
                   ("sonuc", None)):
        try:
            d[k] = json.loads(d[k]) if d.get(k) else bos
        except ValueError:
            d[k] = bos
    return d


def emir(con, id_):
    r = con.execute("SELECT * FROM is_emirleri WHERE id=?", (int(id_),)).fetchone()
    return _satir(r) if r else None


def emirler(con, limit=30, modul=None):
    if modul:
        rows = con.execute("SELECT * FROM is_emirleri WHERE modul=? ORDER BY id DESC LIMIT ?",
                           (modul, max(1, min(int(limit), 200)))).fetchall()
    else:
        rows = con.execute("SELECT * FROM is_emirleri ORDER BY id DESC LIMIT ?",
                           (max(1, min(int(limit), 200)),)).fetchall()
    return [_satir(r) for r in rows]


def _yaz(con, e, now=None):
    con.execute("UPDATE is_emirleri SET durum=?, karar=?, kontrol=?, tahmin=?, bam_is_id=?, "
                "sonuc=?, updated_at=? WHERE id=?",
                (e["durum"], e["karar"], json.dumps(e["kontrol"], ensure_ascii=False),
                 json.dumps(e["tahmin"], ensure_ascii=False) if e.get("tahmin") else None,
                 e.get("bam_is_id"),
                 json.dumps(e["sonuc"], ensure_ascii=False) if e.get("sonuc") else None,
                 _simdi(now), e["id"]))


# -------------------------------------------------------------- bildirim

def bildir(con, modul, emir_id, tur, metin, now=None):
    if tur not in BILDIRIM_TURLERI:
        return None
    cur = con.execute("INSERT INTO bildirimler(modul,emir_id,tur,metin,created_at) "
                      "VALUES (?,?,?,?,?)", (modul, emir_id, tur, str(metin)[:600],
                                             _simdi(now)))
    return cur.lastrowid


def bildirimler(con, modul, hepsi=False, limit=30):
    q = ("SELECT * FROM bildirimler WHERE modul=? %s ORDER BY id DESC LIMIT ?"
         % ("" if hepsi else "AND okundu_at IS NULL"))
    rows = [dict(r) for r in con.execute(q, (modul, max(1, min(int(limit), 200)))).fetchall()]
    okunmamis = con.execute("SELECT COUNT(*) FROM bildirimler WHERE modul=? AND "
                            "okundu_at IS NULL", (modul,)).fetchone()[0]
    return {"bildirimler": rows, "okunmamis": okunmamis}


def okundu(con, id_, now=None):
    cur = con.execute("UPDATE bildirimler SET okundu_at=? WHERE id=? AND okundu_at IS NULL",
                      (_simdi(now), int(id_)))
    if cur.rowcount:
        return {"ok": True}
    var = con.execute("SELECT 1 FROM bildirimler WHERE id=?", (int(id_),)).fetchone()
    # Zaten okunmus bir bildirimi yeniden «okundu» yapmak HATA degildir.
    return {"ok": bool(var), "note": None if var else "Bildirim yok."}


# ----------------------------------------------------------- tahmini sure

def tahmini_sure(con, ofisler):
    """Ayni ofis dizisinden gecmis ve bitmis islerin gercek surelerinin
    ortancasi; yetmezse adim sayisi x ritim araligi. Ikisi de «tahmin»."""
    anahtar = json.dumps(list(ofisler))
    sureler = []
    for r in con.execute("SELECT created_at, updated_at FROM bam_isler WHERE ofisler=? AND "
                         "durum IN ('tamam','kismen') ORDER BY id DESC LIMIT 50", (anahtar,)):
        a, b = _zaman(r["created_at"]), _zaman(r["updated_at"])
        if a and b and b >= a:
            sureler.append((b - a).total_seconds())
    if len(sureler) >= GECMIS_EN_AZ:
        sn = statistics.median(sureler)
        return {"sn": int(round(sn)), "etiket": "tahmin", "metin": _sure_yaz(sn),
                "dayanak": "son %d benzer işin gerçek sürelerinin ortancası" % len(sureler)}
    sn = len(ofisler) * RITIM_SN
    return {"sn": sn, "etiket": "tahmin", "metin": _sure_yaz(sn),
            "dayanak": "yeterli geçmiş iş yok: %d adım × %d saniyelik ritim"
                       % (len(ofisler), RITIM_SN)}


def sure_sapmasi(con, limit=50):
    """Tahmin ile gercek arasindaki sapma — olculur, elle yazilmaz (PLAN §6)."""
    out = []
    for e in emirler(con, limit):
        t, s = e.get("tahmin") or {}, e.get("sonuc") or {}
        if t.get("sn") is not None and s.get("gercek_sn") is not None:
            out.append({"id": e["id"], "tahmin_sn": t["sn"], "gercek_sn": s["gercek_sn"]})
    if not out:
        return {"n": 0, "ortalama_sapma_sn": None, "metin": None, "isler": []}
    sapma = sum(abs(x["gercek_sn"] - x["tahmin_sn"]) for x in out) / len(out)
    # Metin SUNUCUDA kurulur: ekran sayi uretmez (tests/test_daemon.py).
    return {"n": len(out), "ortalama_sapma_sn": int(round(sapma)), "isler": out[:20],
            "metin": "Tahmin ile gerçek süre arasındaki ortalama sapma %s (%d iş, ölçüldü)."
                     % (_sure_yaz(sapma) if sapma >= 1 else "1 saniyeden az", len(out))}


# --------------------------------------------------------- imkan kontrolu

def _madde(ad, ok_, metin, etki="ret"):
    """etki: madde gecmezse kararin ne olacagi (ret ya da kismi)."""
    return {"ad": ad, "ok": bool(ok_), "not": metin, "etki": etki}


def ofisler_of(tur, govde=None):
    """Isin gececegi ofisler. Cogu turde sabit; urunde isteğe bagli."""
    if tur == "bam.urun" and govde and govde.get("urun"):
        return ["kayit"] + (["arastirma"] if govde["urun"].get("kaynakli") else []) + ["uretim"]
    return list(TURLER[tur]["ofisler"])


def imkan(con, cfg, tur, govde=None):
    """King'in kontrolu. (karar, maddeler). Karar kuralladir.

    GUVENLIK ONCE GELIR (PLAN §1.7): hedef.plan'da plan denetcisinin KRITIK
    maddeleri (guvenlik siniri, bazal taban, hekim kapisi) King'in
    kapisinda da sinanir. Guvenli olmayan bir plani «onayladim» deyip
    Planlama'ya yollamak, sonra «teklif edilmedi» demek, reddedilmesi
    gereken isi onaylanmis gibi gostermekti.

    Isi yapacak ofislerin (Kayit disinda) HICBIRI hazir degilse is
    reddedilir: acilsa bile «ertelendi» diye kapanacak bir isi onaylamak,
    yapilmayacak bir isi yapilacak gibi gostermek olurdu. Bazilari hazirsa
    karar «kismi»dir ve eksik olan soylenir."""
    t = dict(TURLER[tur], ofisler=ofisler_of(tur, govde))
    maddeler = []
    isciler = [o for o in t["ofisler"] if o != "kayit"]
    hazirlar = [o for o in isciler if (bam.OFISLER.get(o) or {}).get("durum") == "hazir"]
    for o in t["ofisler"]:
        f = bam.OFISLER.get(o) or {}
        hazir = f.get("durum") == "hazir"
        maddeler.append(_madde("ofis:" + o, hazir, "%s %s." % (
            f.get("ad", o), "hazır" if hazir else "henüz açılmadı"),
            etki="ret" if (o in isciler and not hazirlar) else "kismi"))
    if t["model"]:
        for o in t["ofisler"]:
            if o == "kayit":
                continue
            h = ai.hazir_mi(cfg, "bam." + o)
            maddeler.append(_madde("model:" + o, h["ok"],
                                   "Model hazır." if h["ok"] else h["note"], etki="kismi"))
        g = butce.guard(con, cfg)
        maddeler.append(_madde("butce", g["ok"], "Bütçe izin veriyor." if g["ok"]
                               else g["note"], etki="kismi"))
    else:
        maddeler.append(_madde("model", True, "Model gerekmez: %s" % t["not"]))
    if tur == "hedef.plan" and govde and govde.get("plan"):
        kirik = [d["not"] for d in planlama.denetle(govde["plan"]) if d["kritik"] and not d["ok"]]
        maddeler.append(_madde("guvenlik", not kirik, "; ".join(kirik) if kirik else
                               "Plan denetçisinin kritik maddeleri geçti (güvenlik sınırı, "
                               "bazal taban, hekim kapısı)."))
    acik = con.execute("SELECT COUNT(*) FROM is_emirleri WHERE durum IN (%s)"
                       % ",".join("?" * len(ACIK)), ACIK).fetchone()[0]
    maddeler.append(_madde("kuyruk", acik < KUYRUK_EN_COK,
                           "Kuyrukta %d açık iş var." % acik if acik < KUYRUK_EN_COK else
                           "King’in kuyruğu dolu (%d açık iş); önce onlar bitmeli." % acik))
    if any(not m["ok"] and m["etki"] == "ret" for m in maddeler):
        return "ret", maddeler
    if any(not m["ok"] for m in maddeler):
        return "kismi", maddeler
    return "onay", maddeler


# ------------------------------------------------------------------- iz

def zincir(modul, tur, govde=None):
    """Katlar atlanmaz: is emrinin yolu. Sunucu kurar."""
    ofisler = ofisler_of(tur, govde)
    if modul == "hkm":
        return ([{"kat": "kullanici", "ad": "Sen"}, {"kat": "king", "ad": "King"},
                 {"kat": "bam", "ad": "BAM Patronu"}]
                + [{"kat": "ofis", "ad": (bam.OFISLER.get(o) or {}).get("ad", o), "id": o}
                   for o in ofisler])
    alt, alt_ad = ALT_PATRON[modul]
    t = dict(TURLER[tur], ofisler=ofisler)
    return ([{"kat": "koc", "ad": "%s koçu" % MODUL_AD[modul]},
             {"kat": "patron", "ad": "%s Patronu" % MODUL_AD[modul]},
             {"kat": "alt_patron", "ad": alt_ad, "id": alt},
             {"kat": "king", "ad": "King"},
             {"kat": "bam", "ad": "BAM Patronu"}]
            + [{"kat": "ofis", "ad": (bam.OFISLER.get(o) or {}).get("ad", o), "id": o}
               for o in t["ofisler"]])


# ------------------------------------------------------------ is emri ac

def _govde_temizle(tur, govde):
    if tur == "hedef.plan":
        g, hatalar = planlama.temizle((govde or {}).get("plan"))
        if hatalar:
            return None, hatalar
        return {"plan": g}, []
    if tur == "sinav.mufredat":
        g, hatalar = mufredat.temizle((govde or {}).get("mufredat"))
        if hatalar:
            return None, hatalar
        return {"mufredat": g}, []
    if tur == "test.kitabi":
        g, hatalar = kitap.temizle((govde or {}).get("kitap"))
        if hatalar:
            return None, hatalar
        return {"kitap": g}, []
    if tur == "bam.urun":
        g, hatalar = urunler.temizle((govde or {}).get("urun"))
        if hatalar:
            return None, hatalar
        return {"urun": g}, []
    if tur == "bam.arastirma":
        g, hatalar = kaynakli.istek_temizle((govde or {}).get("arastirma"))
        if hatalar:
            return None, hatalar
        return {"arastirma": g}, []
    return None, ["tanimsiz tur"]


# Ayni girdi -> ayni anahtar («once depo»). Mufredatta buyuk-kucuk harf
# ve bosluk farki ayni sinavdir.
ANAHTAR = {"hedef.plan": planlama.anahtar, "sinav.mufredat": mufredat.anahtar,
           "test.kitabi": planlama.anahtar, "bam.urun": planlama.anahtar,
           "bam.arastirma": lambda t: depo.konu_anahtari(
               "%s %s" % (t["arastirma"]["konu"], t["arastirma"].get("ayrinti") or ""))}


def emir_ac(con, cfg, modul, tur, govde, konu="", neden="", now=None):
    """Modulun is emri. Doner: {ok, emir, karar, ...} ya da {ok:False, errors}."""
    if modul not in MODULLER:
        return {"ok": False, "errors": ["bilinmeyen modul"]}
    t = TURLER.get(tur)
    if not t:
        return {"ok": False, "errors": ["tanimsiz is turu: %s" % tur]}
    if modul not in t["moduller"]:
        return {"ok": False, "errors": ["%s turu %s modulunden gelemez" % (tur, modul)]}
    temiz, hatalar = _govde_temizle(tur, govde)
    if hatalar:
        return {"ok": False, "errors": hatalar}
    if tur == "sinav.mufredat" and not str(konu or "").strip():
        konu = mufredat.talep(temiz["mufredat"])
    if tur == "bam.urun" and not str(konu or "").strip():
        konu = urunler.talep(temiz["urun"])
    if tur == "bam.arastirma" and not str(konu or "").strip():
        konu = kaynakli.istek_talebi(temiz["arastirma"])
    if tur == "test.kitabi" and not str(konu or "").strip():
        konu = "«%s» — %d bölümlük test kitabı" % (temiz["kitap"]["baslik"],
                                                  len(temiz["kitap"]["bolumler"]))
    konu = (str(konu or "").strip() or t["ad"])[:MAX_KONU]
    neden = str(neden or "").strip()[:MAX_NEDEN]
    anahtar = "%s:%s:%s" % (modul, tur, ANAHTAR[tur](temiz))
    at = _simdi(now)

    # Ayni emir acik ise ikincisi YAZILMAZ: tekrar, bilgi degil gurultudur.
    var = con.execute("SELECT id FROM is_emirleri WHERE anahtar=? AND durum IN (%s) "
                      "ORDER BY id DESC LIMIT 1" % ",".join("?" * len(ACIK)),
                      (anahtar,) + ACIK).fetchone()
    if var:
        return {"ok": True, "emir": emir(con, var["id"]), "yeni": False,
                "note": "Bu iş emri zaten açık (#%d)." % var["id"]}

    karar, kontrol = imkan(con, cfg, tur, temiz)
    iz = zincir(modul, tur, temiz)

    # ONCE DEPO (PLAN §1.5): ayni girdiyle bitmis bir is varsa yeniden
    # kurulmaz; ayni kayit yeniden teklif edilir.
    onceki = con.execute("SELECT id, sonuc FROM is_emirleri WHERE anahtar=? AND durum='bitti' "
                         "ORDER BY id DESC LIMIT 1", (anahtar,)).fetchone()
    #
    # Arastirmaya dayanan kayit ise «depoda var» yetmez: guncelligi YAKIN
    # ZAMANDA OLCULMUS olmali (core/depo.py taze_mi; aga cikmaz). Degilse
    # is Depolama Burosu'na gider, olcum orada yapilir ve kayit hala
    # guncelse is yine depodan kapanir (depo_aday).
    depo_ = None
    aday = None
    if onceki and karar != "ret":
        try:
            s = json.loads(onceki["sonuc"] or "{}")
        except ValueError:
            s = {}
        if s.get("kayit_id") and bam.kayit_getir(con, s["kayit_id"]):
            taze, tnot = (depo.taze_mi(con, s["kayit_id"], now=at)
                          if "arastirma" in ofisler_of(tur, temiz) else (True, ""))
            if taze:
                depo_ = {"emir_id": onceki["id"], "kayit_id": s["kayit_id"]}
                kontrol.append(_madde("depo", True, "Depoda aynı girdiyle kurulmuş kayıt var "
                                      "(#%d); yeniden kurulmaz.%s" % (
                                          s["kayit_id"], (" " + tnot) if tnot else "")))
            else:
                aday = s["kayit_id"]
                kontrol.append(_madde("depo", True, "Depoda kayıt #%d var. %s" % (aday, tnot)))
    if not depo_ and not aday:
        kontrol.append(_madde("depo", True, "Depoda aynı girdiyle kurulmuş bir kayıt yok."))

    tahmin = None
    if karar != "ret":
        tahmin = ({"sn": 0, "etiket": "hesaplandi", "metin": "hemen",
                   "dayanak": "depodaki kayıt yeniden kullanıldı"} if depo_
                  else tahmini_sure(con, ofisler_of(tur, temiz)))
    durum = {"onay": "onaylandi", "kismi": "kismen_onay", "ret": "reddedildi"}[karar]
    cur = con.execute("INSERT INTO is_emirleri(modul,tur,konu,neden,govde,anahtar,iz,karar,"
                      "kontrol,tahmin,durum,created_at,updated_at) VALUES "
                      "(?,?,?,?,?,?,?,?,?,?,?,?,?)",
                      (modul, tur, konu, neden, json.dumps(temiz, ensure_ascii=False), anahtar,
                       json.dumps(iz, ensure_ascii=False), karar,
                       json.dumps(kontrol, ensure_ascii=False),
                       json.dumps(tahmin, ensure_ascii=False) if tahmin else None, durum, at, at))
    e = emir(con, cur.lastrowid)

    if karar == "ret":
        sebep = "; ".join(m["not"] for m in kontrol if not m["ok"])
        bildir(con, modul, e["id"], "reddedildi",
               "King «%s» işini reddetti: %s" % (konu, sebep), now=at)
        return {"ok": True, "yeni": True, "emir": emir(con, e["id"]), "karar": karar}

    if depo_:
        e["durum"] = "bitti"
        e["sonuc"] = {"kayit_id": depo_["kayit_id"], "depodan": depo_["emir_id"], "gercek_sn": 0,
                      "gercek_metin": "hemen (depodan)"}
        _yaz(con, e, at)
        teklif = _teklif(con, e, depo_["kayit_id"], now=at)
        bildir(con, modul, e["id"], "bitti", "«%s» depoda hazırdı; yeniden kurulmadı.%s"
               % (konu, teklif), now=at)
        return {"ok": True, "yeni": True, "emir": emir(con, e["id"]), "karar": karar}

    j = bam.is_ac(con, konu, kaynak="kullanici" if modul == "hkm" else modul,
                  hedef_modul=None if modul == "hkm" else modul, ofisler=ofisler_of(tur, temiz),
                  govde=dict(temiz, emir_id=e["id"], **({"depo_aday": aday} if aday else {})),
                  emir_id=e["id"], now=at)
    if not j.get("ok"):
        e["durum"], e["karar"] = "hata", karar
        e["sonuc"] = {"not": j.get("note") or "BAM işi açamadı."}
        _yaz(con, e, at)
        bildir(con, modul, e["id"], "hata", "«%s» BAM’da açılamadı: %s"
               % (konu, e["sonuc"]["not"]), now=at)
        return {"ok": True, "yeni": True, "emir": emir(con, e["id"]), "karar": karar}
    e["bam_is_id"] = j["id"]
    _yaz(con, e, at)
    bam.iz_ekle(con, "emir", e["id"], "is", j["id"], now=at)
    bildir(con, modul, e["id"], durum,
           "King «%s» işini %s. Tahmini süre %s (tahmin: %s)."
           % (konu, "onayladı" if karar == "onay" else "kısmen onayladı", tahmin["metin"],
              tahmin["dayanak"])
           + ("" if karar == "onay" else " Eksik: " + "; ".join(
               m["not"] for m in kontrol if not m["ok"])), now=at)
    return {"ok": True, "yeni": True, "emir": emir(con, e["id"]), "karar": karar}


def _teklif_mufredat(con, e, kayit_id, now=None):
    """Mufredat raporunu AYS'ye sinav profili teklifi olarak birakir."""
    g = (bam.kayit_getir(con, kayit_id) or {}).get("govde") or {}
    dersler = g.get("dersler") or []
    if g.get("tur") != "mufredat" or not dersler:
        return " Kayıt müfredat biçiminde değil; teklif bırakılmadı."
    payload = {"kayit_id": int(kayit_id), "ders": len(dersler),
               "konu": sum(len(d.get("konular") or []) for d in dersler),
               "baslik": str(g.get("sinav") or e.get("konu") or "Sınav")[:120]}
    n = intents.create(con, e["modul"], "mufredat.add", payload, None, source="bam")
    if n.get("ok"):
        bam.iz_ekle(con, "kayit", kayit_id, "niyet", n["intent"]["id"], now=now)
        return " Müfredat sınav profili teklifi olarak %s’ye bırakıldı." % MODUL_AD[e["modul"]]
    return ""


def _teklif_kitap(con, e, kayit_id, now=None):
    """Test kitabini AYS'ye teklif olarak birakir."""
    g = (bam.kayit_getir(con, kayit_id) or {}).get("govde") or {}
    bolumler = g.get("bolumler") or []
    if g.get("tur") != "kitap" or not bolumler:
        return " Kayıt test kitabı biçiminde değil; teklif bırakılmadı."
    payload = {"kayit_id": int(kayit_id), "bolum": len(bolumler),
               "soru": sum(len(b.get("sorular") or []) for b in bolumler),
               "baslik": str(g.get("baslik") or e.get("konu") or "Test kitabı")[:120]}
    n = intents.create(con, e["modul"], "kitap.add", payload, None, source="bam")
    if n.get("ok"):
        bam.iz_ekle(con, "kayit", kayit_id, "niyet", n["intent"]["id"], now=now)
        return " Kitap teklif olarak %s’ye bırakıldı." % MODUL_AD[e["modul"]]
    return ""


def _teklif_urun(con, e, kayit_id, now=None):
    """Urunu module teklif eder; HKM'den istendiyse teklif yok — urun
    HKM'nin Ofis ekranindan ve (varsa) Telegram'dan teslim edilir."""
    g = (bam.kayit_getir(con, kayit_id) or {}).get("govde") or {}
    if g.get("tur") != "urun":
        return " Kayıt ürün biçiminde değil; teklif bırakılmadı."
    if e["modul"] == "hkm":
        return " HKM › Ofis’ten açılabilir ve indirilebilir."
    payload = {"kayit_id": int(kayit_id), "urun": g["urun"], "baslik": str(g.get("baslik"))[:120]}
    n = intents.create(con, e["modul"], "urun.add", payload, None, source="bam")
    if n.get("ok"):
        bam.iz_ekle(con, "kayit", kayit_id, "niyet", n["intent"]["id"], now=now)
        return " Ürün teklif olarak %s’ye bırakıldı." % MODUL_AD[e["modul"]]
    return ""


def _teklif_arastirma(con, e, kayit_id, now=None):
    """Arastirma kaydi modulun verisi degildir: teklif birakilmaz. Bildirim
    ozeti, etiketi ve kaynak sayisini tasir; kaydin tamami HKM › Ofis'te."""
    k = bam.kayit_getir(con, kayit_id) or {}
    g = k.get("govde") or {}
    etiket = {"kaynakli": "kaynaklı", "celiskili": "çelişkili",
              "dogrulanmadi": "doğrulanmadı"}.get(k.get("dogruluk"), "?")
    ozet_ = str(g.get("ozet") or "").strip()
    if len(ozet_) > 280:
        ozet_ = ozet_[:280].rsplit(" ", 1)[0] + "…"
    return " Kayıt #%d (%s, %d kaynak, sürüm %s).%s HKM › Ofis’ten açılabilir." % (
        int(kayit_id), etiket, len(g.get("kaynaklar") or []), k.get("surum") or 1,
        (" Özet: " + ozet_) if ozet_ else "")


def _teklif(con, e, kayit_id, now=None):
    """Burosun urettigi kaydi module teklif eder. Cevap ayni yoldan doner."""
    if e["tur"] == "bam.arastirma":
        return _teklif_arastirma(con, e, kayit_id, now=now)
    if e["tur"] == "bam.urun":
        return _teklif_urun(con, e, kayit_id, now=now)
    if e["tur"] == "sinav.mufredat":
        return _teklif_mufredat(con, e, kayit_id, now=now)
    if e["tur"] == "test.kitabi":
        return _teklif_kitap(con, e, kayit_id, now=now)
    if e["tur"] != "hedef.plan":
        return ""
    k = bam.kayit_getir(con, kayit_id) or {}
    g = (e.get("govde") or {}).get("plan") or {}
    hafta = len(((k.get("govde") or {}).get("program") or {}).get("haftalar") or []) or None
    if not ((k.get("govde") or {}).get("gecti")):
        return " Plan denetçisi geçirmediği için teklif bırakılmadı."
    payload = {"kayit_id": int(kayit_id), "hedef_id": g.get("hedef_id") or "?",
               "baslik": (e.get("konu") or "Program")[:120]}
    if hafta:
        payload["hafta"] = hafta
    n = intents.create(con, e["modul"], "plan.apply", payload, None, source="bam")
    if n.get("ok"):
        bam.iz_ekle(con, "kayit", kayit_id, "niyet", n["intent"]["id"], now=now)
        return " Program teklif olarak %s’ye bırakıldı." % MODUL_AD[e["modul"]]
    return ""


# ---------------------------------------------------------- esitleme

IS_TO_EMIR = {"bekliyor": "onaylandi", "beklemede": "bekliyor", "tamam": "bitti",
              "kismen": "kismen", "hata": "hata", "iptal": "iptal"}


def esitle(con, now=None):
    """BAM isinin durumunu is emrine tasir; DEGISIM varsa bildirir.

    Her ritim tikinde kosar. Bildirim durum degisimidir: ayni durum iki
    kez yazilmaz, cunku tekrar eden bildirim okunmayan bildirimdir."""
    degisen = 0
    for r in con.execute("SELECT * FROM is_emirleri WHERE durum IN (%s) AND bam_is_id "
                         "IS NOT NULL" % ",".join("?" * len(ACIK)), ACIK).fetchall():
        e = _satir(r)
        j = bam.is_getir(con, e["bam_is_id"])
        if not j:
            continue
        yeni = IS_TO_EMIR.get(j["durum"], e["durum"])
        if yeni == "onaylandi":
            # Is kuyrukta; bir adim bittiyse «basladi».
            if any(a["durum"] != "bekliyor" for a in j["adimlar"]):
                yeni = "basladi"
            else:
                yeni = e["durum"]
        if yeni == e["durum"]:
            continue
        e["durum"] = yeni
        konu = e["konu"]
        if yeni in ("bitti", "kismen"):
            kid = next((a.get("kayit_id") for a in reversed(j["adimlar"])
                        if a.get("kayit_id")), None)
            a, b = _zaman(e["created_at"]), _zaman(j["updated_at"])
            gercek = int((b - a).total_seconds()) if a and b else None
            e["sonuc"] = {"kayit_id": kid, "gercek_sn": gercek,
                          "gercek_metin": _sure_yaz(gercek) if gercek is not None else None}
            notlar = [a.get("not") for a in j["adimlar"] if a.get("ofis") != "kayit"
                      and a.get("not")]
            _yaz(con, e, now)
            # Cevap ayni yoldan doner (PLAN §1.3): ofis kaydi yazar, teklifi
            # modul adina King birakir. intents.create ayni govdeyi iki kez
            # yazmaz; esitleme tekrar kossa da teklif tektir.
            ek = _teklif(con, e, kid, now=now) if kid and yeni == "bitti" else ""
            bildir(con, e["modul"], e["id"], yeni, "«%s» %s.%s%s" % (
                konu, "bitti" if yeni == "bitti" else "kısmen bitti",
                (" " + " ".join(notlar)) if notlar else "", ek), now=now)
        else:
            _yaz(con, e, now)
            metin = {"basladi": "«%s» işi başladı: BAM ofisleri çalışıyor." % konu,
                     "bekliyor": "«%s» bekliyor: %s" % (konu, next(
                         (a.get("not") for a in j["adimlar"] if a["durum"] == "beklemede"),
                         "model ya da bütçe")),
                     "hata": "«%s» hata verdi: %s" % (konu, next(
                         (a.get("not") for a in j["adimlar"] if a["durum"] == "hata"), "")),
                     "iptal": "«%s» iptal edildi." % konu}.get(yeni, "«%s»: %s" % (konu, yeni))
            bildir(con, e["modul"], e["id"], yeni, metin, now=now)
        degisen += 1
    return degisen


# ------------------------------------------------------ guncellik bekcisi
#
# King ARASTIRMA YAPMAZ: arastirmayi Arastirma Burosu'nun ajanlari yapar.
# King'in web'e tek cikisi, sistemi guncel tutmak icin ARADA BIR bakmaktir:
# depodaki kaynakli arastirmalardan guncelligi en uzun suredir olculmemis
# olani secer, kaynaklarini acar (core/depo.py tazelik_denetle) ve
# degistiyse Arastirma Burosu'na yeni surum emri verir. Her tikte en cok
# BIR kayit; ayni kayda `guncellik_gun` gun dolmadan yeniden bakilmaz.
# Kaynaksiz kayitlara bakmaz: onlari kaynakli arastirmaya cevirmek model
# harcar ve kullanici istemeden harcanmaz.

def bekci(con, cfg, now=None, tasiyici=None):
    """Doner: None (is yok / kapali) ya da {kayit_id, durum, emir_id?}."""
    ws = web.settings(cfg)
    gun = ws.get("guncellik_gun")
    if not ws["acik"] or not isinstance(gun, int) or gun <= 0:
        return None
    at = _simdi(now)
    sinir = (_zaman(at) - datetime.timedelta(days=gun)).isoformat(timespec="seconds")
    r = con.execute(
        "SELECT id FROM bam_kayitlar k WHERE tur='arastirma' AND anahtar IS NOT NULL "
        "AND created_at <= ? AND govde LIKE '%\"parmak\"%' "
        "AND id = (SELECT MAX(id) FROM bam_kayitlar WHERE tur='arastirma' AND anahtar=k.anahtar) "
        "AND (denetim IS NULL OR json_extract(denetim, '$.at') <= ?) "
        "ORDER BY COALESCE(json_extract(denetim, '$.at'), created_at), id LIMIT 1",
        (sinir, sinir)).fetchone()
    if not r:
        return None
    k = bam.kayit_getir(con, r["id"])
    d = depo.tazelik_denetle(con, cfg, "king", k, now=at, tasiyici=tasiyici)
    out = {"kayit_id": k["id"], "durum": d["durum"]}
    if d["durum"] != "degisti":
        return out
    g = k["govde"]
    neden = "King’in güncellik turu: kayıt #%d’in kaynakları değişti (%s)." % (
        k["id"], ", ".join(["[%d]" % n for n in d["degisen"]] + d["kaybolan"]))
    if g.get("tur") == "mufredat":
        bildir(con, "ays", None, "guncellik", "«%s» kaynakları değişti. Sınav profilini "
               "yeniden isteyerek yeni sürümü alabilirsin." % k["baslik"], now=at)
        bildir(con, "hkm", None, "guncellik", neden, now=at)
        return out
    konu = str(g.get("konu") or "").strip()[:MAX_KONU]
    if len(konu) < 3:
        bildir(con, "hkm", None, "guncellik", neden + " Konusu kayıtlı değil; yeniden "
               "araştırma açılmadı.", now=at)
        return out
    e = emir_ac(con, cfg, "hkm", "bam.arastirma", {"arastirma": {"konu": konu}},
                neden=neden, now=at)
    out["emir_id"] = (e.get("emir") or {}).get("id")
    return out


def iptal(con, id_, now=None):
    e = emir(con, id_)
    if not e or e["durum"] not in ACIK:
        return {"ok": False, "note": "İptal edilecek açık iş emri yok."}
    if e.get("bam_is_id"):
        bam.iptal(con, e["bam_is_id"], now=now)
    e["durum"] = "iptal"
    _yaz(con, e, now)
    bildir(con, e["modul"], e["id"], "iptal", "«%s» iptal edildi." % e["konu"], now=now)
    return {"ok": True, "note": "İş emri iptal edildi."}


def ozet(con):
    sayac = {r["durum"]: r["n"] for r in con.execute(
        "SELECT durum, COUNT(*) AS n FROM is_emirleri GROUP BY durum")}
    return {"turler": {k: {"ad": v["ad"], "moduller": list(v["moduller"]),
                           "ofisler": v["ofisler"], "model": v["model"]}
                       for k, v in TURLER.items()},
            "emirler": emirler(con, 30), "sayac": sayac, "sure_sapmasi": sure_sapmasi(con)}
