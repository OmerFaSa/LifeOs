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
import re
import statistics

from core import (ai, bam, butce, depo, intents, kaynakli, kitap, mufredat, planlama, program, spibilgi,
                  urunler, web)
from core import teklif as tkl

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
        "not": "Planlama Bürosu (v1, SPİ) kuralla çalışır: program, simülasyon, plan denetimi.",
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
    # Herhangi bir konu icin haftalik program (core/program.py). Hafta ve
    # haftalik sure ZORUNLUDUR; «arastirarak» istenirse once Depolama ve
    # Arastirma, sonra Planlama.
    "bam.plan": {
        "ad": "Haftalık program (her konu)",
        "moduller": ("ays", "spi", "esp", "hkm"),
        "ofisler": ["kayit", "arastirma", "planlama"],
        "model": True,
        "not": "Hedef Analisti birimleri yazar; kapasite, program ve denetim koddur.",
    },
    # SPİ bilgisi (core/spibilgi.py, Part 8c): besin degeri, market fiyati,
    # yer listesi. Sorgular kuralla, sayilar kaynaktan, sinama koddan; fiyat ve
    # yer web olmadan yazilmaz. SPİ kaydi kendi koduyla sinar ve onayla yazar.
    "spi.bilgi": {
        "ad": "SPİ bilgisi (besin, fiyat, yer)",
        "moduller": ("spi",),
        "ofisler": ["kayit", "arastirma"],
        "model": True,
        "not": "Araştırma Bürosu kaynaktan tipli kayıt yazar; alıntı ve sayı kodla denetlenir.",
    },
    "test.kitabi": {
        "ad": "Bölümlü test kitabı",
        "moduller": ("ays",),
        "ofisler": ["kayit", "uretim"],
        "model": True,
        "not": "Üretim Bürosu bölüm bölüm üretir; her soru bağımsız çözümle denetlenir.",
    },
}

# «teklif»: King teklifini sundu, kullanici onaylamadan BAM'da is ACILMAZ
# (Part 8a-3). Acik sayilir: ayni istek ikinci teklif acmaz, iptal edilir.
# «ara_onay»: parca parca uretimde bir bolum bitti, devam icin onay bekleniyor
# (Part 8b). Acik sayilir; «devam» sonrakini uretir, «dur» uretilenle bitirir.
DURUMLAR = ("teklif", "onaylandi", "kismen_onay", "basladi", "ara_onay", "bekliyor", "bitti",
            "kismen", "reddedildi", "iptal", "hata")
ACIK = ("teklif", "onaylandi", "kismen_onay", "basladi", "ara_onay", "bekliyor")
BILDIRIM_TURLERI = ("teklif", "onaylandi", "kismen_onay", "basladi", "ara_onay", "bekliyor",
                    "bitti", "kismen", "reddedildi", "iptal", "hata", "guncellik")


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
                   ("sonuc", None), ("teklif", None)):
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
                "sonuc=?, konu=?, govde=?, teklif=?, updated_at=? WHERE id=?",
                (e["durum"], e["karar"], json.dumps(e["kontrol"], ensure_ascii=False),
                 json.dumps(e["tahmin"], ensure_ascii=False) if e.get("tahmin") else None,
                 e.get("bam_is_id"),
                 json.dumps(e["sonuc"], ensure_ascii=False) if e.get("sonuc") else None,
                 e["konu"], json.dumps(e.get("govde") or {}, ensure_ascii=False),
                 json.dumps(e["teklif"], ensure_ascii=False) if e.get("teklif") else None,
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

def tahmini_sure(con, ofisler, ek_adim=0):
    """Ayni ofis dizisinden gecmis ve bitmis islerin gercek surelerinin
    ortancasi; yetmezse adim sayisi x ritim araligi. Ikisi de «tahmin».
    `ek_adim`: bir ofisin birden cok tikte bittigi is (kitabin bolumleri)."""
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
    n = len(ofisler) + int(ek_adim or 0)
    sn = n * RITIM_SN
    return {"sn": sn, "etiket": "tahmin", "metin": _sure_yaz(sn),
            "dayanak": "yeterli geçmiş iş yok: %d adım × %d saniyelik ritim" % (n, RITIM_SN)}


def maliyet_sapmasi(con, limit=50):
    """Teklifteki maliyet tahmini ile olculen maliyet — olculur (Part 8a)."""
    out = []
    for e in emirler(con, limit):
        t, s = e.get("teklif") or {}, e.get("sonuc") or {}
        sec = next((x for x in t.get("secenekler") or [] if x.get("id") == t.get("secilen", "tam")),
                   None)
        tah = ((sec or {}).get("maliyet") or {}).get("usd")
        ger = (s.get("maliyet") or {}).get("usd")
        if tah is not None and ger is not None and (s.get("maliyet") or {}).get("cagri"):
            out.append({"id": e["id"], "tahmin_usd": tah, "gercek_usd": ger})
    if not out:
        return {"n": 0, "ortalama_sapma_usd": None, "metin": None, "isler": []}
    sapma = sum(abs(x["gercek_usd"] - x["tahmin_usd"]) for x in out) / len(out)
    return {"n": len(out), "ortalama_sapma_usd": round(sapma, 6), "isler": out[:20],
            "metin": "Tahmin ile ölçülen maliyet arasındaki ortalama sapma %s (%d iş, ölçüldü)."
                     % (tkl._usd(sapma), len(out))}


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
    if tur == "bam.plan" and govde and govde.get("program"):
        return ["kayit"] + (["arastirma"] if govde["program"].get("kaynakli") else []) + \
            ["planlama"]
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
    if tur == "bam.plan" and govde and govde.get("program"):
        kirik = program.on_denetim(govde["program"])
        maddeler.append(_madde("guvenlik", not kirik, "; ".join(kirik) if kirik else
                               "Günlük süre sınırın içinde."))
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
    if tur == "bam.plan":
        g, hatalar = program.temizle((govde or {}).get("program"))
        if hatalar:
            return None, hatalar
        return {"program": g}, []
    if tur == "spi.bilgi":
        g, hatalar = spibilgi.temizle((govde or {}).get("bilgi"))
        if hatalar:
            return None, hatalar
        return {"bilgi": g}, []
    return None, ["tanimsiz tur"]


# Ayni girdi -> ayni anahtar («once depo»). Mufredatta buyuk-kucuk harf
# ve bosluk farki ayni sinavdir.
ANAHTAR = {"hedef.plan": planlama.anahtar, "sinav.mufredat": mufredat.anahtar,
           "test.kitabi": planlama.anahtar, "bam.urun": planlama.anahtar,
           "bam.plan": program.anahtar, "spi.bilgi": spibilgi.anahtar,
           "bam.arastirma": lambda t: depo.konu_anahtari(
               "%s %s" % (t["arastirma"]["konu"], t["arastirma"].get("ayrinti") or ""))}


# Sonucu gelen kanala TESLIM edilen kanallar (W5). «local» (HKM ekrani) ve
# moduller bildirim kuyrugunu okur; onlara ayrica mesaj gitmez.
TESLIM_KANALLARI = ("telegram", "whatsapp")
MAX_HEDEF = 80


def emir_ac(con, cfg, modul, tur, govde, konu="", neden="", now=None, kanal=None, hedef=None):
    """Modulun is emri. Doner: {ok, emir, karar, ...} ya da {ok:False, errors}.

    `kanal`/`hedef`: emir Telegram ya da WhatsApp sohbetinden geldiyse o
    kanal ve alici. Is bitince sonuc AYNI kanaldan teslim edilir (_teslim)."""
    kanal = kanal if kanal in TESLIM_KANALLARI else None
    hedef = (str(hedef).strip()[:MAX_HEDEF] or None) if (kanal and hedef) else None
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
    if tur == "bam.plan" and not str(konu or "").strip():
        konu = program.talep(temiz["program"])
    if tur == "spi.bilgi" and not str(konu or "").strip():
        konu = spibilgi.talep(temiz["bilgi"])
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
        # Ayni is Telegram'dan da istendiyse sonuc oraya da gitsin: kanalsiz
        # acik emre kanal yazilir (kanalli emrin alicisi degistirilmez).
        if kanal:
            con.execute("UPDATE is_emirleri SET kanal=?, hedef=? WHERE id=? AND kanal IS NULL",
                        (kanal, hedef, var["id"]))
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
    if not depo_ and not aday and tur == "bam.arastirma" and karar != "ret":
        # Ayni KONU baska bir girdiyle (baska modulden, baska gun) arastirilmis
        # olabilir: Depolama Burosu'nun anahtariyla bakilir (fikir 46).
        k = depo.eslesen(con, ANAHTAR[tur](temiz))
        if k:
            aday = k["id"]
            kontrol.append(_madde("depo", True, "Depoda aynı konuda araştırma kaydı #%d var "
                                  "(%s)." % (aday, str(k.get("created_at"))[:10])))
    if not depo_ and not aday:
        kontrol.append(_madde("depo", True, "Depoda aynı girdiyle kurulmuş bir kayıt yok."))

    tahmin = None
    tk = None
    if karar != "ret":
        tahmin = ({"sn": 0, "etiket": "hesaplandi", "metin": "hemen",
                   "dayanak": "depodaki kayıt yeniden kullanıldı"} if depo_
                  else tahmini_sure(con, ofisler_of(tur, temiz)))
        # King'in teklifi (core/teklif.py): sinif, maliyet, sure, secenekler.
        # Depodan kapanan is bedavadir; teklif gerekmez.
        if not depo_:
            tk = tkl.kur(con, cfg, tur, temiz, ofisler_of, tahmini_sure)
            # ONCE DEPO teklifte EN USTTE: bedava ve hemen (fikir 46).
            kd = bam.kayit_getir(con, aday) if aday else None
            if kd:
                tk = tkl.depo_secenegi(tk, kd, at)
            tahmin = dict(tahmin, sn=tk["secenekler"][0]["sure"]["sn"],
                          metin=tk["secenekler"][0]["sure"]["metin"],
                          dayanak=tk["secenekler"][0]["sure"]["dayanak"])
    durum = {"onay": "onaylandi", "kismi": "kismen_onay", "ret": "reddedildi"}[karar]
    ozet_ = tkl.ozet(tk) if tk else None
    if tk and teklif_gerekli(cfg, tur, tk):
        # ONAY KAPISI: ucretli is, kullanici teklifi gormeden acilmaz.
        durum = "teklif"
        ozet_["depo_aday"] = aday
    cur = con.execute("INSERT INTO is_emirleri(modul,tur,konu,neden,govde,anahtar,iz,karar,"
                      "kontrol,tahmin,durum,created_at,updated_at,kanal,hedef,teklif) VALUES "
                      "(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                      (modul, tur, konu, neden, json.dumps(temiz, ensure_ascii=False), anahtar,
                       json.dumps(iz, ensure_ascii=False), karar,
                       json.dumps(kontrol, ensure_ascii=False),
                       json.dumps(tahmin, ensure_ascii=False) if tahmin else None, durum, at, at,
                       kanal, hedef,
                       json.dumps(ozet_, ensure_ascii=False) if ozet_ else None))
    e = emir(con, cur.lastrowid)

    if durum == "teklif":
        bildir(con, modul, e["id"], "teklif", teklif_metni(e), now=at)
        return {"ok": True, "yeni": True, "emir": emir(con, e["id"]), "karar": karar,
                "teklif": True}

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
        # Metin zaten sohbetin cevabidir; kanala yalniz BELGE gider.
        _teslim(con, e, "", depo_["kayit_id"], yalniz_belge=True, now=at)
        return {"ok": True, "yeni": True, "emir": emir(con, e["id"]), "karar": karar}

    return _bam_ac(con, e, temiz, karar, kontrol, aday, at)


def _bam_ac(con, e, temiz, karar, kontrol, aday, at):
    """Onaylanan isi BAM'da acar ve bildirir. emir_ac ve teklif_onayla
    ayni kapidan gecer: ikinci bir acma yolu, bir gun ayrisirdi."""
    modul, tur, konu = e["modul"], e["tur"], e["konu"]
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
    e["durum"] = {"onay": "onaylandi", "kismi": "kismen_onay"}[karar]
    e["karar"] = karar
    e["bam_is_id"] = j["id"]
    _yaz(con, e, at)
    bam.iz_ekle(con, "emir", e["id"], "is", j["id"], now=at)
    tahmin = e.get("tahmin") or {}
    t = e.get("teklif") or {}
    sec = next((x for x in t.get("secenekler") or [] if x.get("id") == t.get("secilen", "tam")),
               None)
    bildir(con, modul, e["id"], e["durum"],
           "King «%s» işini %s. Tahmini süre %s (tahmin: %s).%s"
           % (konu, "onayladı" if karar == "onay" else "kısmen onayladı", tahmin.get("metin"),
              tahmin.get("dayanak"), (" Sınıf %s, maliyet %s (tahmin)." % (
                  sec["sinif_ad"], sec["maliyet"]["metin"])) if sec else "")
           + ("" if karar == "onay" else " Eksik: " + "; ".join(
               m["not"] for m in kontrol if not m["ok"])), now=at)
    return {"ok": True, "yeni": True, "emir": emir(con, e["id"]), "karar": karar}


# ------------------------------------------------------------ onay kapisi
#
# Part 8a-3: ucretli is, kullanici King'in teklifini gorup onaylamadan BAM'da
# ACILMAZ. Onay uc yoldan gelir — HKM ekrani, modulun teklif karti, sohbet
# kanali («1 · 2 · iptal») — ve hepsi AYNI islevden gecer.

def teklif_gerekli(cfg, tur, tk):
    """Onay sorulur mu? Kural isi (model yok, bedel yok) sorulmaz: bedava ve
    kisa bir isi sormak surtunmedir. Dusuk sinifi kullanici «sormadan yap»
    diyebilir (AGENTS.md §1.9); ayar kapaliyken dusuk de sorar. Orta ve
    ustu HER ZAMAN sorar."""
    if not TURLER[tur]["model"]:
        return False
    if tk["sinif"] == "dusuk" and bool(((cfg or {}).get("king") or {}).get("sormadan_dusuk")):
        return False
    return True


def teklif_metni(e, kanal=None):
    """Teklifin kullaniciya giden cumlesi: secenekler ve nasil onaylanacagi."""
    t = e.get("teklif") or {}
    n = len(t.get("secenekler") or [])
    yaz = ", ".join("«%d»" % (i + 1) for i in range(max(1, n)))
    if kanal in TESLIM_KANALLARI or kanal == "local":
        yol = "Onaylamak için %s yaz; vazgeçmek için «iptal»." % yaz
    else:
        yol = ("Onay: %s’nin Bugün ekranındaki King teklifi kartından ya da HKM › Ofis › King "
               "kuyruğundan." % MODUL_AD.get(e["modul"], "modül"))
    konu = e["konu"] if e["konu"].startswith("«") else "«%s»" % e["konu"]
    return "King %s için teklif hazırladı (iş emri #%d). %s Onaylamadan iş açılmaz. %s" % (
        konu, e["id"], t.get("metin") or "", yol)


def teklif_onayla(con, cfg, id_, secenek=None, now=None):
    """Kullanici teklifi onayladi: secilen secenekle is BAM'da acilir.

    Imkan kontrolu YENIDEN yapilir: teklif ile onay arasinda butce ya da
    kuyruk degismis olabilir; eski karara guvenmek, bugun yapilamayacak
    bir isi acmak olurdu."""
    e = emir(con, id_)
    if not e or e["durum"] != "teklif":
        return {"ok": False, "note": "Onay bekleyen bir teklif yok."}
    t = e.get("teklif") or {}
    ids = [x["id"] for x in t.get("secenekler") or []]
    secenek = secenek or t.get("oneri") or "tam"
    if secenek not in ids:
        return {"ok": False, "note": "Bu teklifte «%s» seçeneği yok." % secenek}
    if secenek == "depo":
        return _depodan_ver(con, e, t, now)
    temiz = e["govde"]
    if secenek != "tam":
        r = tkl.uygula(e["tur"], secenek, temiz)
        if not r:
            return {"ok": False, "note": "Bu seçenek artık kurulamıyor."}
        temiz = r[0]
        e["govde"] = temiz
        e["konu"] = ("%s — %s" % (e["konu"], r[1]))[:MAX_KONU]
    at = _simdi(now)
    karar, kontrol = imkan(con, cfg, e["tur"], temiz)
    sec = next(x for x in t["secenekler"] if x["id"] == secenek)
    t["secilen"], t["onay_at"] = secenek, at
    e["teklif"], e["kontrol"], e["karar"] = t, kontrol, karar
    e["tahmin"] = sec.get("sure") or e.get("tahmin")
    if karar == "ret":
        e["durum"] = "reddedildi"
        _yaz(con, e, at)
        sebep = "; ".join(m["not"] for m in kontrol if not m["ok"])
        bildir(con, e["modul"], e["id"], "reddedildi",
               "«%s» onaylandı ama açılamadı: %s" % (e["konu"], sebep), now=at)
        return {"ok": True, "emir": emir(con, e["id"]), "karar": karar,
                "note": "Açılamadı: %s" % sebep}
    return _bam_ac(con, e, temiz, karar, kontrol, t.get("depo_aday"), at)


def _depodan_ver(con, e, t, now=None):
    """«Depodaki kayit» secildi: BAM'da is ACILMAZ, ucret yok. Kayit modulun
    kuyruguna teklif olur ve kanala belge gider (emir_ac'in depo yolu gibi)."""
    sec = next((x for x in t.get("secenekler") or [] if x.get("id") == "depo"), {})
    kid = sec.get("kayit_id")
    if not kid or not bam.kayit_getir(con, kid):
        return {"ok": False, "note": "Depodaki kayıt artık yok; başka bir seçenek seç."}
    at = _simdi(now)
    t["secilen"], t["onay_at"] = "depo", at
    e["teklif"], e["durum"], e["karar"] = t, "bitti", "onay"
    e["sonuc"] = {"kayit_id": kid, "depodan": True, "gercek_sn": 0,
                  "gercek_metin": "hemen (depodan)"}
    _yaz(con, e, at)
    ek = _teklif(con, e, kid, now=at)
    bildir(con, e["modul"], e["id"], "bitti", "«%s» depodaki kayıttan verildi; iş açılmadı, "
           "ücret yok.%s" % (e["konu"], ek), now=at)
    _teslim(con, e, "", kid, yalniz_belge=True, now=at)
    return {"ok": True, "emir": emir(con, e["id"]), "karar": "onay", "depodan": True}


def teklifler(con, modul, limit=10):
    """Modulun ONAY BEKLEYEN teklifleri — modulun teklif karti icin. Yalniz
    ekrana gereken alanlar: secenek govdesi sunucuda kalir."""
    out = []
    for r in con.execute("SELECT * FROM is_emirleri WHERE durum IN ('teklif','ara_onay') AND "
                         "modul=? ORDER BY id DESC LIMIT ?",
                         (modul, max(1, min(int(limit), 30)))):
        e = _satir(r)
        t = e.get("teklif") or {}
        if e["durum"] == "ara_onay":
            # Parca parca uretim: bolum bitti, «devam / dur» bekleniyor.
            out.append({"id": e["id"], "konu": e["konu"], "tur": e["tur"], "durum": "ara_onay",
                        "metin": ara_onay_metni(con, e), "secenekler": []})
            continue
        out.append({"id": e["id"], "konu": e["konu"], "tur": e["tur"], "durum": "teklif",
                    "ad": TURLER.get(e["tur"], {}).get("ad"), "created_at": e["created_at"],
                    "oneri": t.get("oneri"), "neden": t.get("neden"),
                    "secenekler": [{"id": x["id"], "ad": x["ad"], "metin": tkl.secenek_metni(x)}
                                   for x in t.get("secenekler") or []]})
    return out


# ------------------------------------------------------ ara onay (Part 8b)

def ara_onay_metni(con, e, j=None):
    """Parca parca uretimde bolum bitti: ne uretildi, ne harcandi, ne sorulur."""
    j = j or (bam.is_getir(con, e["bam_is_id"]) if e.get("bam_is_id") else None) or {}
    a = next((x for x in j.get("adimlar") or [] if x.get("durum") == "ara_onay"), {})
    m = tkl.olculen(butce.is_maliyeti(con, j["id"])) if j.get("id") else {}
    return ("«%s»: %s Şimdiye kadar ölçülen maliyet: %s. Devam edeyim mi? «devam» sıradaki "
            "bölümü üretir; «dur» kitabı üretilen bölümlerle bitirir." % (
                e["konu"], a.get("not") or "bir bölüm üretildi.", m.get("metin") or "—"))


def parca(con, id_, karar, now=None):
    """Ara onaya cevap: «devam» ya da «dur». Uretilen hicbir bolum kaybolmaz."""
    e = emir(con, id_)
    if not e or e["durum"] != "ara_onay" or not e.get("bam_is_id"):
        return {"ok": False, "note": "Ara onay bekleyen bir iş yok."}
    if karar not in ("devam", "dur"):
        return {"ok": False, "note": "Cevap «devam» ya da «dur» olmalı."}
    r = (bam.devam if karar == "devam" else bam.kes)(con, e["bam_is_id"], now=now)
    if not r.get("ok"):
        return r
    e["durum"] = "basladi"
    _yaz(con, e, now)
    return {"ok": True, "emir": emir(con, e["id"]),
            "note": ("Devam: sıradaki bölüm üretiliyor." if karar == "devam" else
                     "Durduruldu: kitap üretilen bölümlerle bitiyor; teklif olarak gelir.")}


CEVAP = re.compile(r"^\s*(1|2|3|4|tam|küçük|kucuk|depo|iptal|vazgeç|vazgec|devam|dur)\s*[.!]?\s*$",
                   re.I)


def teklif_cevap(con, cfg, metin, kanal="local", hedef=None, now=None):
    """Sohbet kanalinda teklife cevap («1», «2», «iptal»). Acik teklif
    yoksa None: kelime olagan sohbete doner.

    Hangi teklif? AYNI kanal ve alicinin en yeni acik teklifi; yerel
    sohbette HKM'den acilan. Baskasinin teklifi bu yoldan onaylanmaz."""
    m = CEVAP.match(str(metin or ""))
    if not m:
        return None
    k = m.group(1).lower()
    durum = "ara_onay" if k in ("devam", "dur") else "teklif"
    if kanal in TESLIM_KANALLARI:
        r = con.execute("SELECT id FROM is_emirleri WHERE durum=? AND kanal=? AND "
                        "(hedef=? OR hedef IS NULL) ORDER BY id DESC LIMIT 1",
                        (durum, kanal, hedef)).fetchone()
    else:
        r = con.execute("SELECT id FROM is_emirleri WHERE durum=? AND kanal IS NULL "
                        "AND modul='hkm' ORDER BY id DESC LIMIT 1", (durum,)).fetchone()
    if not r:
        return None
    e = emir(con, r["id"])
    if durum == "ara_onay":
        p = parca(con, e["id"], k, now=now)
        return p.get("note") or "İşlenemedi."
    if k in ("iptal", "vazgeç", "vazgec"):
        iptal(con, e["id"], now=now)
        return "«%s» teklifi iptal edildi; iş açılmadı." % e["konu"]
    ids = [x["id"] for x in (e.get("teklif") or {}).get("secenekler") or []]
    # Rakam SIRADIR (depo secenegi varsa «1» odur); ad, secenegin kendisidir.
    ad = {"tam": "tam", "küçük": "kucuk", "kucuk": "kucuk", "depo": "depo"}.get(k)
    i = (int(k) - 1) if k.isdigit() else (ids.index(ad) if ad in ids else 9)
    if i >= len(ids):
        return ("Bu teklifte o seçenek yok. %s ya da «iptal» yazabilirsin."
                % " ".join("«%d»" % (n + 1) for n in range(len(ids))))
    r = teklif_onayla(con, cfg, e["id"], ids[i], now=now)
    if not r.get("ok"):
        return r.get("note") or "Onaylanamadı."
    e2 = r["emir"]
    if r.get("depodan"):
        return ("Depodaki kayıt verildi: «%s» (iş emri #%d). Ücret yok; BAM’da iş açılmadı.%s"
                % (e2["konu"], e2["id"], " Belgesi buraya geliyor." if kanal == "telegram" else ""))
    if e2["durum"] == "reddedildi":
        return "Onayladın ama iş açılamadı: %s" % r.get("note", "")
    return "Onaylandı: «%s» (iş emri #%d) BAM’da açıldı. Tahmini süre %s (tahmin). %s" % (
        e2["konu"], e2["id"], (e2.get("tahmin") or {}).get("metin") or "bilinmiyor",
        "Bitince sonucu buraya yollarım." if kanal == "telegram" else
        "Bitince bildirim düşer; HKM › Ofis’ten açabilirsin.")


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


def _teklif_spibilgi(con, e, kayit_id, now=None):
    """Besin, fiyat ya da yer kaydini SPİ'ye niyet olarak birakir. SPİ kaydi
    ceker, KENDI koduyla sinar, onizletir ve onayla yazar."""
    k = bam.kayit_getir(con, kayit_id) or {}
    g = k.get("govde") or {}
    tur = g.get("tur")
    if tur not in spibilgi.TURLER:
        return " Kayıt SPİ bilgisi biçiminde değil; teklif bırakılmadı."
    payload = {"kayit_id": int(kayit_id), "ad": str(g.get("ad") or e.get("konu") or "?")[:80],
               "baslik": str(k.get("baslik") or e.get("konu") or "")[:120] or "SPİ bilgisi"}
    n = intents.create(con, e["modul"], spibilgi.NIYET[tur], payload, None, source="bam")
    if n.get("ok"):
        bam.iz_ekle(con, "kayit", kayit_id, "niyet", n["intent"]["id"], now=now)
        return " %s SPİ’ye teklif olarak bırakıldı; SPİ kendi koduyla sınayıp onayınla yazar." % (
            spibilgi.TUR_AD[tur].capitalize())
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


def _teklif_program(con, e, kayit_id, now=None):
    """Genel program modulun planina dogrudan girmez: modulun kendi plan
    motoru vardir. Bildirim programin ozetini tasir; tamami HKM › Ofis'te."""
    k = bam.kayit_getir(con, kayit_id) or {}
    g = k.get("govde") or {}
    if g.get("tur") != "program":
        return " Kayıt program biçiminde değil."
    if not g.get("gecti"):
        return " Plan denetçisi geçirmedi: %s" % "; ".join(
            d["not"] for d in g.get("denetim") or [] if d.get("kritik") and not d["ok"])
    s = (g.get("simulasyon") or {}).get("senaryolar") or [{}]
    return " %d birim, günde %s; %s HKM › Ofis’ten açılabilir ve indirilebilir." % (
        len(g.get("birimler") or []), program.sure_yaz((g.get("kapasite") or {}).get("gunluk_dk") or 0),
        s[0].get("metin", ""))


def _teklif(con, e, kayit_id, now=None):
    """Burosun urettigi kaydi module teklif eder. Cevap ayni yoldan doner."""
    if e["tur"] == "bam.plan":
        return _teklif_program(con, e, kayit_id, now=now)
    if e["tur"] == "bam.arastirma":
        return _teklif_arastirma(con, e, kayit_id, now=now)
    if e["tur"] == "bam.urun":
        return _teklif_urun(con, e, kayit_id, now=now)
    if e["tur"] == "sinav.mufredat":
        return _teklif_mufredat(con, e, kayit_id, now=now)
    if e["tur"] == "test.kitabi":
        return _teklif_kitap(con, e, kayit_id, now=now)
    if e["tur"] == "spi.bilgi":
        return _teklif_spibilgi(con, e, kayit_id, now=now)
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


# ------------------------------------------------------------- teslim
#
# Telegram'dan gelen is, sonucunu Telegram'a birakir (W5). Iki satir:
# durum metni (bitti, kismen, hata, bekliyor) ve — kayit varsa ve kanal
# belge alabiliyorsa — kaydin kendisi (giden kutusu gonderim aninda PDF,
# olmazsa HTML basar; core/outbox.py). Satir kimligi (emir, durum) ciftidir:
# ayni durum iki kez gitmez. Gonderimi giden kutusu yapar; burasi yalniz
# kuyruga yazar, aga cikmaz.

def _teslim(con, e, metin, kayit_id=None, yalniz_belge=False, now=None):
    """Kuyruga yazilan outbox satirlarinin kimlikleri; kanal yoksa None."""
    kanal = e.get("kanal")
    if kanal not in TESLIM_KANALLARI:
        return None
    from core import outbox
    gun = str(now or _simdi())[:10]
    hedef = e.get("hedef") or None
    belge = bool(kayit_id) and e["durum"] in ("bitti", "kismen")
    yazilan = []
    if belge and kanal != "telegram":
        # Bu kanala belge yolu yok (channels.send_document); bu SOYLENIR.
        yok = "Bu kanala belge gönderilemiyor; HKM › Ofis’ten indirebilirsin."
        metin = (str(metin) + " " + yok) if (metin and not yalniz_belge) else (
            "«%s» hazır. %s" % (e["konu"], yok))
        yalniz_belge, belge = False, False
    if not yalniz_belge and metin:
        r = outbox.enqueue(con, kanal, "emir:%d:%s" % (e["id"], e["durum"]), gun,
                           str(metin)[:3500], target=hedef)
        yazilan.append(r["row"]["id"])
    if belge:
        k = bam.kayit_getir(con, int(kayit_id)) or {}
        aciklama = "«%s» — iş emri #%d" % (k.get("baslik") or e["konu"], e["id"])
        r = outbox.enqueue(con, kanal, "emir:%d:belge" % e["id"], gun, aciklama[:1024],
                           target=hedef, ek={"kayit_id": int(kayit_id), "bicim": "pdf"})
        yazilan.append(r["row"]["id"])
    return yazilan


# ---------------------------------------------------------- esitleme

IS_TO_EMIR = {"bekliyor": "onaylandi", "beklemede": "bekliyor", "tamam": "bitti",
              "kismen": "kismen", "hata": "hata", "iptal": "iptal", "ara_onay": "ara_onay"}


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
                          "gercek_metin": _sure_yaz(gercek) if gercek is not None else None,
                          # Olculen maliyet (usage.is_id): teklifin ogrendigi sayi.
                          "maliyet": tkl.olculen(butce.is_maliyeti(con, e["bam_is_id"]))}
            notlar = [a.get("not") for a in j["adimlar"] if a.get("ofis") != "kayit"
                      and a.get("not")]
            _yaz(con, e, now)
            # Cevap ayni yoldan doner (PLAN §1.3): ofis kaydi yazar, teklifi
            # modul adina King birakir. intents.create ayni govdeyi iki kez
            # yazmaz; esitleme tekrar kossa da teklif tektir.
            ek = _teklif(con, e, kid, now=now) if kid and yeni == "bitti" else ""
            metin = "«%s» %s.%s%s" % (
                konu, "bitti" if yeni == "bitti" else "kısmen bitti",
                (" " + " ".join(notlar)) if notlar else "", ek)
            bildir(con, e["modul"], e["id"], yeni, metin, now=now)
            _teslim(con, e, metin, kid, now=now)
        else:
            _yaz(con, e, now)
            metin = {"basladi": "«%s» işi başladı: BAM ofisleri çalışıyor." % konu,
                     "ara_onay": ara_onay_metni(con, e, j),
                     "bekliyor": "«%s» bekliyor: %s" % (konu, next(
                         (a.get("not") for a in j["adimlar"] if a["durum"] == "beklemede"),
                         "model ya da bütçe")),
                     "hata": "«%s» hata verdi: %s" % (konu, next(
                         (a.get("not") for a in j["adimlar"] if a["durum"] == "hata"), "")),
                     "iptal": "«%s» iptal edildi." % konu}.get(yeni, "«%s»: %s" % (konu, yeni))
            bildir(con, e["modul"], e["id"], yeni, metin, now=now)
            # «basladi» gurultudur; «iptal»i kullanici zaten kendisi yapti.
            # Ara onay bir SORUDUR: kanala gider.
            if yeni in ("bekliyor", "hata", "ara_onay"):
                _teslim(con, e, metin, now=now)
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
    if g.get("tur") in spibilgi.TURLER:
        bildir(con, "spi", None, "guncellik", "«%s» kaynakları değişti. Yeniden isteyerek "
               "güncel değeri alabilirsin." % k["baslik"], now=at)
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
            "emirler": emirler(con, 30), "sayac": sayac, "sure_sapmasi": sure_sapmasi(con),
            "maliyet_sapmasi": maliyet_sapmasi(con)}
