# -*- coding: utf-8 -*-
"""Cok adimli gorev — «Bu hafta B1'e hazırla beni» (King 3.0, K1).

   Tek cumle bir hedef ve bir sure tasir; King onu ADIMLARA boler, gunlere
   dagitir, her adima bir sahip (alt ajan, core/ekip.py) verir ve adimlari
   arka plan kuyrugunda (core/is_kuyrugu.py) gunu gelince calistirir.

   Bes kural:

   1. ISKELETI KOD KURAR. Adim turleri, sayisi, gunleri ve sahipleri
      koddur (`iskelet`). Model yalniz ONERIR: plan adiminda gunlerin
      basliklarini yazar; kod sayiyi, uzunlugu ve bicimi denetler, eksigi
      kendi basligiyla doldurur.
   2. BELIRSIZ SORULUR. Sure ya da hedef yoksa gorev kurulmaz, sorulur.
      Gunluk dakika uydurulmaz: mesajda ya da modulun hedefinde yoksa
      «bilinmiyor» kalir ve plana ekleme teklifi yapilmaz.
   3. TASLAK ONAYSIZ BASLAMAZ. Gorev «taslak» dogar; kullanici onaylayinca
      «suruyor» olur ve adimlar siraya girer.
   4. YAZMA HER ZAMAN TEKLIFTIR. Plana ekleme modulun niyet kuyruguna
      (core/intents.py plan.add) teklif olarak gider; modul kullaniciya
      gosterir, onaylanirsa KENDI koduyla yazar. Gorev hicbir module yazmaz.
   5. ILERLEME SAKLANIR. Adimlarin durumu, raporu ve teklifleri tabloda
      (king_gorevler) durur; HKM kapanip acilsa da gorev kaldigi yerden
      surer."""
import datetime
import json
import re
import threading

from core import ai, ekip, intents, is_kuyrugu, patron

DURUMLAR = ("taslak", "suruyor", "bitti", "iptal")
DURUM_AD = {"taslak": "Taslak", "suruyor": "Sürüyor", "bitti": "Bitti", "iptal": "İptal edildi"}
ADIM_DURUM = ("bekliyor", "sirada", "calisiyor", "bitti", "hata", "iptal")
ADIM_DURUM_AD = {"bekliyor": "Günü gelmedi", "sirada": "Sırada", "calisiyor": "Çalışıyor",
                 "bitti": "Bitti", "hata": "Olmadı", "iptal": "İptal"}
TUR_AD = {"analiz": "Durum analizi", "arastirma": "Kaynak araştırması", "plan": "Plan önerisi",
          "calisma": "Çalışma", "degerlendirme": "Değerlendirme"}
EN_COK_GUN = 28
EN_COK_BASLIK = 60
GUN_AD = ("Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz")
AY_AD = ("Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara")
GUNLUK = {
    "esp": ("Kelime ve ifade", "Dinleme", "Okuma", "Dilbilgisi", "Yazma", "Konuşma", "Deneme ve tekrar"),
    "ays": ("Konu tekrarı", "Soru çözümü", "Yanlış analizi", "Zayıf konu", "Karışık soru", "Deneme", "Tekrar"),
    "spi": ("Hareket", "Uyku düzeni", "Beslenme", "Toparlanma", "Hareket", "Esneme", "Gözden geçirme"),
}
PLAN_MODUL = ("ays", "esp")          # plan.add sozlesmesi (core/intents.py)

_KILIT = threading.RLock()           # adimlar JSON'u: oku-degistir-yaz tek elden

# ------------------------------------------------------------ cumleden gorev

TETIK = re.compile(
    r"(hazırla(?:r mısın|yın|)?\s+beni|beni\s+(?:\S+\s+){0,5}?(?:hazırla|çalıştır|yetiştir)\w*"
    r"|hazırlan(?:mak istiyorum|mam lazım|malıyım|ayım|ıyorum|mama yardım et)"
    r"|(?:çalıştır|yetiştir)\s+beni|hazırlık planı (?:kur|yap|hazırla))", re.I)
SAYI_SOZ = {"bir": 1, "iki": 2, "üç": 3, "dört": 4, "beş": 5, "altı": 6, "yedi": 7, "sekiz": 8,
            "dokuz": 9, "on": 10}
_SAYI = r"(\d{1,2}|bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on)"
SURE_GUN = re.compile(_SAYI + r"\s*gün(?:de|lük|lüğüne|e|)?\b", re.I)
SURE_HAFTA = re.compile(_SAYI + r"\s*hafta(?:da|lık|lığına|ya|)?\b", re.I)
BU_HAFTA = re.compile(r"\b(bu hafta(?:\s+içinde|\s+sonuna kadar)?|hafta sonuna kadar)\b", re.I)
YARINA = re.compile(r"\byarına kadar\b", re.I)
GUNDE = re.compile(r"\b(?:günde|her gün)\s+(\d{1,3}|yarım|bir|iki|üç)\s*(saat|sa|dakika|dk)\b", re.I)
DOLGU = re.compile(r"\b(lütfen|king|için|içinde|kadar|istiyorum|beni|bana|yardım et|mısın|misin)\b", re.I)
EK = re.compile(r"([0-9A-Za-zÇĞİÖŞÜçğıöşü]+)['’](?:e|a|ye|ya|ne|na|de|da|te|ta|i|ı|u|ü)\b")
# Hedeften atilan fiil (TETIK butun «beni … hazırla» kalibini yakalar; hedef onun icindedir).
FIIL = re.compile(r"(hazırlan(?:mak|mam lazım|malıyım|ayım|ıyorum|mama yardım et)"
                  r"|hazırla(?:r mısın|yın)?|çalıştır|yetiştir|hazırlık planı (?:kur|yap))", re.I)
BASLAT = re.compile(r"^\s*(?:görevi|görev|planı)\s+(başlat|onayla|iptal et|iptal|sil)\s*[.!]?\s*$", re.I)
DURUM_SOR = re.compile(r"(ne(?:ler)? yapıyorsun|ekip ne yapıyor|işler(?:in)? ne durumda|kaç iş|"
                       r"görev(?:im)? ne durumda|görevler(?:im)?\s*$)", re.I)
ARKA = re.compile(r"\b(arka ?planda|ekib(?:e|ine) ver|ajan(?:a|ına) ver|ekibe sor)\b", re.I)
# «arka planda» tek basina devir degildir («arka planda müzik çalıyor»): cumle bir emirle biter.
EMIR_SON = re.compile(r"\b(bak|yap|araştır|incele|hazırla|çıkar|bul|değerlendir|özetle|kontrol et|"
                      r"öğren|sor)\s*[.!]?\s*$", re.I)
EKIP_SOZ = re.compile(r"\b(ekip|iş(?:ler)?|görev)", re.I)


def _sayi(s):
    s = s.lower()
    return int(s) if s.isdigit() else SAYI_SOZ.get(s)


def _gun(d):
    return d.isoformat() if isinstance(d, datetime.date) else str(d)[:10]


def gun_ad(iso):
    d = datetime.date.fromisoformat(iso)
    return "%s %d %s" % (GUN_AD[d.weekday()], d.day, AY_AD[d.month - 1])


def sure_of(metin, bugun):
    """(gun_sayisi, not) ya da (None, None). Takvim kodla hesaplanir."""
    b = datetime.date.fromisoformat(bugun)
    m = str(metin or "")
    if BU_HAFTA.search(m):
        n = 7 - b.weekday()                     # bugun dahil pazara kadar
        if n < 2:
            return 7, "Hafta bitiyor; görevi 7 güne yaydım."
        return n, None
    if YARINA.search(m):
        return 2, None
    h = SURE_HAFTA.search(m)
    if h and _sayi(h.group(1)):
        return min(7 * _sayi(h.group(1)), EN_COK_GUN), None
    g = SURE_GUN.search(m)
    if g and _sayi(g.group(1)):
        return min(_sayi(g.group(1)), EN_COK_GUN), None
    return None, None


def gunluk_of(metin):
    m = GUNDE.search(str(metin or ""))
    if not m:
        return None
    n = 0.5 if m.group(1).lower() == "yarım" else _sayi(m.group(1))
    if not n:
        return None
    dk = int(n * 60) if m.group(2).lower() in ("saat", "sa") else int(n)
    return dk if 5 <= dk <= 480 else None


def hedef_of(metin):
    m = str(metin or "")
    for r in (FIIL, BU_HAFTA, YARINA, SURE_HAFTA, SURE_GUN, GUNDE):
        m = r.sub(" ", m)
    m = EK.sub(r"\1", m)
    m = DOLGU.sub(" ", m)
    m = re.sub(r"\s+", " ", m).strip(" .,!?;:-")
    return m[:80]


def tani(metin, bugun):
    """Cumle bir gorev mi? None ya da {hedef, gun_sayisi, gunluk_dk, eksik, not}."""
    if not TETIK.search(str(metin or "")):
        return None
    n, not_ = sure_of(metin, bugun)
    hedef = hedef_of(metin)
    eksik = [x for x, v in (("hedef", len(hedef) >= 2), ("sure", n)) if not v]
    return {"hedef": hedef, "gun_sayisi": n, "gunluk_dk": gunluk_of(metin), "eksik": eksik, "not": not_}


# ------------------------------------------------------------ iskelet

def iskelet(hedef, ajan, modul, baslangic, gun_sayisi):
    """Kod iskeleti: ilk gun analiz + arastirma + plan, her gun bir calisma,
    son gun degerlendirme. Sahipler: alan ajani, arastirmada Arastirmaci."""
    b = datetime.date.fromisoformat(baslangic)
    liste = GUNLUK.get(modul) or GUNLUK["ays"]
    adim = []

    def ekle(tur, gun, sahip, baslik=None):
        adim.append({"no": len(adim) + 1, "tur": tur, "baslik": baslik or TUR_AD[tur], "ajan": sahip,
                     "gun": _gun(gun), "durum": "bekliyor", "is_id": None, "rapor": None,
                     "teklifler": [], "baslik_kaynak": "kod"})
    ekle("analiz", b, ajan)
    ekle("arastirma", b, "arastirmaci", "Kaynak araştırması: %s" % hedef[:40])
    ekle("plan", b, ajan)
    for i in range(gun_sayisi):
        ekle("calisma", b + datetime.timedelta(days=i), ajan, liste[i % len(liste)])
    ekle("degerlendirme", b + datetime.timedelta(days=gun_sayisi - 1), ajan)
    return adim


# ------------------------------------------------------------ tablo

def _simdi(now=None):
    return now or datetime.datetime.now().isoformat(timespec="seconds")


def _satir(r):
    if not r:
        return None
    d = dict(r)
    try:
        d["adimlar"] = json.loads(d["adimlar"] or "[]")
    except ValueError:
        d["adimlar"] = []
    return d


def getir(con, gid):
    return _satir(con.execute("SELECT * FROM king_gorevler WHERE id=?", (gid,)).fetchone())


def _yaz_adimlar(con, gid, adimlar, now=None, durum=None):
    t = _simdi(now)
    if durum:
        con.execute("UPDATE king_gorevler SET adimlar=?, durum=?, updated_at=? WHERE id=?",
                    (json.dumps(adimlar, ensure_ascii=False), durum, t, gid))
    else:
        con.execute("UPDATE king_gorevler SET adimlar=?, updated_at=? WHERE id=?",
                    (json.dumps(adimlar, ensure_ascii=False), t, gid))


def _adim_guncelle(con, gid, no, now=None, **alan):
    with _KILIT:
        g = getir(con, gid)
        if not g:
            return None
        for a in g["adimlar"]:
            if a["no"] == no:
                a.update(alan)
        _yaz_adimlar(con, gid, g["adimlar"], now)
        return g


def _gunluk_hedeften(con, modul):
    from core import hedefag
    for h in hedefag.hedefler(con):
        k = h.get("kapasite") or {}
        if h.get("modul") == modul and h.get("durum") == "aktif" and k.get("gunluk_dk"):
            return int(k["gunluk_dk"])
    return None


def olustur(con, cfg, hedef, gun_sayisi, ajan=None, gunluk_dk=None, kaynak="", bugun=None,
            transport=None, now=None):
    """Taslak gorev kurar. Doner {ok, gorev} ya da {ok:False, soru}."""
    bugun = bugun or (now[:10] if now else datetime.date.today().isoformat())
    hedef = " ".join(str(hedef or "").split())[:80]
    if len(hedef) < 2:
        return {"ok": False, "error": "hedef yok", "soru": "Neye hazırlanmak istiyorsun? Hedefi bir cümleyle yaz."}
    try:
        gun_sayisi = int(gun_sayisi)
    except (TypeError, ValueError):
        gun_sayisi = 0
    if not 1 <= gun_sayisi <= EN_COK_GUN:
        return {"ok": False, "error": "süre 1-%d gün olmalı" % EN_COK_GUN,
                "soru": "Ne kadar sürede? «bu hafta», «10 gün» ya da «2 hafta» gibi yaz (en çok 4 hafta)."}
    secim = "verildi"
    if ajan is None:
        ajan, secim = ekip.sec_modelle(con, cfg, "%s %s" % (hedef, kaynak), arastirma=False,
                                       transport=transport, now=now)
    if ajan not in ekip.MODUL_AJAN.values():
        return {"ok": False, "error": "alan seçilemedi", "secim": secim,
                "soru": "Bu hedef hangi alanda: AYS (sınav, ders), SPİ (beden) ya da ESP (dil, kitap)?"}
    modul = ekip.AJANLAR[ajan]["modul"]
    dk_kaynak = None
    if gunluk_dk is not None:
        try:
            gunluk_dk = int(gunluk_dk)
        except (TypeError, ValueError):
            gunluk_dk = None
        if gunluk_dk is not None and not 5 <= gunluk_dk <= 480:
            return {"ok": False, "error": "günlük süre 5-480 dakika olmalı",
                    "soru": "Günde kaç dakika ayırabilirsin? (5 ile 480 arası)"}
        dk_kaynak = "mesaj" if gunluk_dk else None
    if gunluk_dk is None:
        gunluk_dk = _gunluk_hedeften(con, modul)
        dk_kaynak = "hedef" if gunluk_dk else None
    bitis = _gun(datetime.date.fromisoformat(bugun) + datetime.timedelta(days=gun_sayisi - 1))
    adim = iskelet(hedef, ajan, modul, bugun, gun_sayisi)
    t = _simdi(now)
    cur = con.execute(
        "INSERT INTO king_gorevler(hedef,modul,ajan,baslangic,bitis,gunluk_dk,dk_kaynak,adimlar,durum,"
        "kaynak,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,'taslak',?,?,?)",
        (hedef, modul, ajan, bugun, bitis, gunluk_dk, dk_kaynak, json.dumps(adim, ensure_ascii=False),
         str(kaynak or "")[:400], t, t))
    return {"ok": True, "gorev": pano(con, getir(con, cur.lastrowid)), "secim": secim}


def onayla(con, gid, bugun=None, now=None):
    with _KILIT:
        g = getir(con, gid)
        if not g:
            return {"ok": False, "error": "görev yok"}
        if g["durum"] != "taslak":
            return {"ok": False, "error": "görev taslak değil (%s)" % DURUM_AD[g["durum"]]}
        _yaz_adimlar(con, gid, g["adimlar"], now, durum="suruyor")
    tik(con, None, bugun=bugun, now=now)
    return {"ok": True, "gorev": pano(con, getir(con, gid))}


def iptal(con, gid, now=None):
    with _KILIT:
        g = getir(con, gid)
        if not g:
            return {"ok": False, "error": "görev yok"}
        if g["durum"] in ("bitti", "iptal"):
            return {"ok": False, "error": "görev zaten kapandı"}
        for a in g["adimlar"]:
            if a.get("is_id"):
                is_kuyrugu.iptal(con, a["is_id"], now=now)
            if a["durum"] in ("bekliyor", "sirada", "calisiyor"):
                a["durum"] = "iptal"
        _yaz_adimlar(con, gid, g["adimlar"], now, durum="iptal")
    return {"ok": True, "gorev": pano(con, getir(con, gid))}


def sure_ver(con, gid, gunluk_dk, now=None):
    """Gunluk sureyi kullanici sonradan soyler; plan adimi bittiyse teklifler o zaman gider."""
    try:
        dk = int(gunluk_dk)
    except (TypeError, ValueError):
        return {"ok": False, "error": "günlük süre sayı olmalı"}
    if not 5 <= dk <= 480:
        return {"ok": False, "error": "günlük süre 5-480 dakika olmalı"}
    g = getir(con, gid)
    if not g or g["durum"] in ("bitti", "iptal"):
        return {"ok": False, "error": "açık görev yok"}
    con.execute("UPDATE king_gorevler SET gunluk_dk=?, dk_kaynak='mesaj', updated_at=? WHERE id=?",
                (dk, _simdi(now), gid))
    g = getir(con, gid)
    if any(a["tur"] == "plan" and a["durum"] == "bitti" for a in g["adimlar"]):
        teklif_ver(con, gid, now=now)
    return {"ok": True, "gorev": pano(con, getir(con, gid))}


def listele(con, durum=None, limit=20):
    q, a = "SELECT * FROM king_gorevler", []
    if durum in DURUMLAR:
        q += " WHERE durum=?"
        a.append(durum)
    q += " ORDER BY id DESC LIMIT ?"
    a.append(max(1, min(int(limit or 20), 100)))
    return [pano(con, _satir(r)) for r in con.execute(q, a).fetchall()]


def son_taslak(con):
    return _satir(con.execute("SELECT * FROM king_gorevler WHERE durum='taslak' ORDER BY id DESC LIMIT 1")
                  .fetchone())


def son_acik(con):
    return _satir(con.execute("SELECT * FROM king_gorevler WHERE durum IN ('taslak','suruyor') "
                              "ORDER BY id DESC LIMIT 1").fetchone())


# ------------------------------------------------------------ pano

def pano(con, g):
    """Istemcinin gorev panosu (belgeler/ekip/KING-EKIP.md). Sayilar koddur."""
    if not g:
        return None
    isler = {}
    ids = [a["is_id"] for a in g["adimlar"] if a.get("is_id")]
    if ids:
        for r in con.execute("SELECT id,durum,ilerleme,adim FROM king_isler WHERE id IN (%s)"
                             % ",".join("?" * len(ids)), ids):
            isler[r["id"]] = dict(r)
    adimlar = []
    for a in g["adimlar"]:
        j = isler.get(a.get("is_id")) or {}
        d = dict(a, ajan_ad=ekip.AJANLAR.get(a["ajan"], {}).get("ad", a["ajan"]),
                 durum_ad=ADIM_DURUM_AD.get(a["durum"], a["durum"]), gun_ad=gun_ad(a["gun"]),
                 ilerleme=100 if a["durum"] == "bitti" else (j.get("ilerleme") or 0),
                 simdi=j.get("adim") if a["durum"] == "calisiyor" else None)
        adimlar.append(d)
    gunler = []
    for a in adimlar:
        if not gunler or gunler[-1]["gun"] != a["gun"]:
            gunler.append({"gun": a["gun"], "gun_ad": a["gun_ad"], "adimlar": []})
        gunler[-1]["adimlar"].append(a["no"])
    bitti = sum(1 for a in adimlar if a["durum"] == "bitti")
    kapali = sum(1 for a in adimlar if a["durum"] in ("bitti", "hata", "iptal"))
    toplam = len(adimlar)
    gun_sayisi = (datetime.date.fromisoformat(g["bitis"]) - datetime.date.fromisoformat(g["baslangic"])).days + 1
    return {"id": g["id"], "hedef": g["hedef"], "modul": g["modul"],
            "modul_ad": ekip.MODUL_AD.get(g["modul"], g["modul"]), "ajan": g["ajan"],
            "ajan_ad": ekip.AJANLAR[g["ajan"]]["ad"], "baslangic": g["baslangic"], "bitis": g["bitis"],
            "gun_sayisi": gun_sayisi, "gunluk_dk": g["gunluk_dk"], "dk_kaynak": g["dk_kaynak"],
            "durum": g["durum"], "durum_ad": DURUM_AD[g["durum"]],
            "ilerleme": {"bitti": bitti, "kapali": kapali, "toplam": toplam,
                         "yuzde": int(round(100.0 * bitti / toplam)) if toplam else 0},
            "metin": "%s: %d/%d adım bitti" % (g["hedef"], bitti, toplam),
            "teklif_sayisi": sum(len(a.get("teklifler") or []) for a in adimlar),
            "gunler": gunler, "adimlar": adimlar, "created_at": g["created_at"],
            "updated_at": g["updated_at"]}


# ------------------------------------------------------------ calisma

def tik(con, cfg, bugun=None, now=None):
    """Gunu gelen adimlari siraya koyar; kapanan gorevi «bitti» yapar.
    Doner: siraya giren is sayisi."""
    bugun = bugun or (now[:10] if now else datetime.date.today().isoformat())
    n = 0
    with _KILIT:
        for r in con.execute("SELECT * FROM king_gorevler WHERE durum='suruyor' ORDER BY id").fetchall():
            g = _satir(r)
            degisti = False
            for a in g["adimlar"]:
                if a["durum"] == "bekliyor" and a["gun"] <= bugun:
                    i = is_kuyrugu.baslat(con, a["ajan"], "gorev_adim",
                                          "%s · %s" % (g["hedef"][:40], a["baslik"]),
                                          {"gorev_id": g["id"], "no": a["no"]},
                                          gorev_id=g["id"], adim_no=a["no"], now=now)
                    a.update(durum="sirada", is_id=i["id"])
                    n += 1
                    degisti = True
            if all(a["durum"] in ("bitti", "hata", "iptal") for a in g["adimlar"]):
                _yaz_adimlar(con, g["id"], g["adimlar"], now, durum="bitti")
            elif degisti:
                _yaz_adimlar(con, g["id"], g["adimlar"], now)
    return n


def _rapor_ozet(g, tur):
    for a in g["adimlar"]:
        if a["tur"] == tur and a.get("rapor"):
            return (a["rapor"].get("ozet") or "")[:600]
    return ""


BASLIK_SATIR = re.compile(r"^\s*(?:[-*•]|\d{1,2}[.)]|gün\s*\d+\s*[:.)-])?\s*", re.I)


def basliklari_oner(con, cfg, g, transport=None, now=None):
    """Model ONERIR: calisma gunlerinin basliklari. Kod denetler: sayi, uzunluk,
    bicim; eksik ya da bozuk satirin yerine kodun basligi kalir. Doner: kabul edilen sayi."""
    gunler = [a for a in g["adimlar"] if a["tur"] == "calisma" and a["durum"] in ("bekliyor", "sirada")]
    if not gunler:
        return 0
    rol = ekip.AJANLAR[g["ajan"]]["rol"]
    if not ai.hazir_mi(cfg, rol)["ok"]:
        return 0
    # Kodun beceri sirasi temel verilir; model onu hedefe gore somutlastirir
    # (sahada: arastirma ozetini gorunce «Psikolojik boyutlar» gibi basliga kaydi).
    istek = ("Hedef: %s. %d günlük çalışma. Günlerin becerileri sırayla: %s. Bu sırayı koru ve her günün "
             "başlığını hedefe göre somutlaştır (en çok 6 kelime). Her satıra yalnız bir başlık yaz, açıklama "
             "yazma." % (g["hedef"], len(gunler), ", ".join(a["baslik"] for a in gunler)))
    r = ai.ask(con, cfg, rol, "gorev.basliklar", [{"role": "user", "content": istek}],
               sistem="Sen King'in ekibindeki %s ajanısın. Kısa, düz Türkçe başlıklar yazarsın."
                      % ekip.AJANLAR[g["ajan"]]["ad"],
               transport=transport, denetim="belge", duzeltme=False, jeton=200)
    if not r.get("ok"):
        return 0
    satir = []
    for s in (r.get("text") or "").splitlines():
        s = BASLIK_SATIR.sub("", s).strip(" .*\"'«»")
        if 3 <= len(s) <= EN_COK_BASLIK and not s.endswith(":"):
            satir.append(s)
    kabul = 0
    for a, s in zip(gunler, satir):
        a.update(baslik=s, baslik_kaynak="model")
        kabul += 1
    return kabul


def teklif_ver(con, gid, now=None):
    """Plana ekleme TEKLIFI: her calisma gunu icin modulun niyet kuyruguna
    plan.add. Uygulamaz; modul gosterir, kullanici onaylarsa modul yazar.
    Doner: acilan teklif sayisi (sure bilinmiyorsa 0)."""
    with _KILIT:
        g = getir(con, gid)
        if not g or g["modul"] not in PLAN_MODUL or not g["gunluk_dk"]:
            return 0
        n = 0
        for a in g["adimlar"]:
            if a["tur"] != "calisma" or a["teklifler"] or a["durum"] == "iptal":
                continue
            r = intents.create(con, g["modul"], "plan.add",
                               {"date": a["gun"], "minutes": int(g["gunluk_dk"]), "topic": a["baslik"][:80],
                                "why": ("King görevi #%d: %s" % (g["id"], g["hedef"]))[:200]},
                               None, source="king")
            if r.get("ok"):
                a["teklifler"] = [r["intent"]["id"]]
                n += 0 if r.get("duplicate") else 1
        _yaz_adimlar(con, gid, g["adimlar"], now)
        return n


def _adim_istegi(g, a):
    if a["tur"] == "analiz":
        return ("Hedef: %s, %d gün. Bu hedef için şu anki durumu kısaca değerlendir: elde ne ölçüm var, "
                "ne eksik." % (g["hedef"], len([x for x in g["adimlar"] if x["tur"] == "calisma"]))), "", "olcum"
    if a["tur"] == "arastirma":
        return "%s hazırlığı için temel konular ve iyi bir çalışma yöntemi" % g["hedef"], "", None
    if a["tur"] == "plan":
        ek = "Durum analizi: %s\nAraştırma: %s" % (_rapor_ozet(g, "analiz"), _rapor_ozet(g, "arastirma"))
        gunler = "; ".join("%s: %s" % (gun_ad(x["gun"]), x["baslik"]) for x in g["adimlar"] if x["tur"] == "calisma")
        return ("Hedef: %s. Günler: %s. Bu planı 3 cümleyle özetle: neden bu sıra, nelere dikkat."
                % (g["hedef"], gunler)), ek, "belge"
    if a["tur"] == "calisma":
        ek = "Araştırma özeti: %s" % _rapor_ozet(g, "arastirma")
        return ("Hedef: %s. Bugünün konusu: %s%s. Kullanıcıya bugünkü çalışmayı en çok 3 maddede anlat."
                % (g["hedef"], a["baslik"], (", günde %d dakika" % g["gunluk_dk"]) if g["gunluk_dk"] else "")), ek, "belge"
    biten = [x for x in g["adimlar"] if x["tur"] == "calisma" and x["durum"] == "bitti"]
    toplam = len([x for x in g["adimlar"] if x["tur"] == "calisma"])
    return ("Hedef: %s. Görev bitiyor. Bu alandaki ölçümlere bakarak kısa bir değerlendirme yap ve "
            "bundan sonrası için bir öneri ver." % g["hedef"]), (
        "Görevin çalışma adımları: %d/%d adım bitti (kod sayımı)." % (len(biten), toplam)), "olcum"


def adim_calistir(con, cfg, i, ilerle, iptal_mi, transport=None, now=None):
    gid, no = i["girdi"].get("gorev_id"), i["girdi"].get("no")
    g = getir(con, gid)
    if not g or g["durum"] != "suruyor":
        raise RuntimeError("görev sürmüyor")
    a = next((x for x in g["adimlar"] if x["no"] == no), None)
    if not a:
        raise RuntimeError("adım yok")
    _adim_guncelle(con, gid, no, now, durum="calisiyor")
    try:
        istek, ek, denetim = _adim_istegi(g, a)
        # Hedef ve sure baglamda durur: «B1»deki 1 ve «5 gün» dayanaksiz sayi sayilmaz.
        ek = "- Görevin hedefi: %s; %d gün (kod)." % (g["hedef"], (
            datetime.date.fromisoformat(g["bitis"]) - datetime.date.fromisoformat(g["baslangic"])).days + 1) + (
            "\n" + ek if ek else "")
        if a["ajan"] == "arastirmaci":
            rapor = ekip.calistir(con, cfg, "arastirmaci", istek, ilerle=ilerle, iptal_mi=iptal_mi,
                                  transport=transport, now=now)
        else:
            rapor = ekip.calistir(con, cfg, a["ajan"], istek, date=min(a["gun"], (now or _simdi())[:10]),
                                  ek=ek, cumle=4 if a["tur"] != "calisma" else 5, denetim=denetim,
                                  ilerle=ilerle, iptal_mi=iptal_mi, transport=transport, now=now)
        if iptal_mi():
            _adim_guncelle(con, gid, no, now, durum="iptal")
            return rapor
        teklif = 0
        if a["tur"] == "plan":
            ilerle(70, "Günlerin başlıklarını öneriyor")
            with _KILIT:
                g2 = getir(con, gid)
                if basliklari_oner(con, cfg, g2, transport=transport, now=now):
                    _yaz_adimlar(con, gid, g2["adimlar"], now)
            ilerle(90, "Plana ekleme tekliflerini hazırlıyor")
            teklif = teklif_ver(con, gid, now=now)
            g3 = getir(con, gid)
            if g3["modul"] not in PLAN_MODUL:
                rapor["ozet"] += " (%s’de günlük plan olmadığı için plana ekleme teklifi yok.)" % ekip.MODUL_AD[g3["modul"]]
            elif not g3["gunluk_dk"]:
                rapor["ozet"] += (" Günlük süre bilinmediği için plana ekleme teklifi yapmadım; "
                                  "«günde 1 saat» gibi söylersen eklerim.")
            else:
                rapor["ozet"] += " %s’nin Onaylar ekranına %d gün için plana ekleme teklifi bıraktım; sen onaylamadan hiçbir şey yazılmaz." % (
                    ekip.MODUL_AD[g3["modul"]], teklif)
        rapor["teklif"] = teklif
        _adim_guncelle(con, gid, no, now, durum="bitti",
                       rapor={k: rapor.get(k) for k in ("ozet", "dayanak", "kaynaklar", "etiket", "note")})
        return rapor
    except Exception:
        _adim_guncelle(con, gid, no, now, durum="hata")
        raise
    finally:
        tik(con, cfg, now=now)


def calistir_is(con, cfg, i, ilerle, iptal_mi, transport=None, now=None):
    """Is kuyrugunun calistiricisi (core/is_kuyrugu.isle)."""
    if i["tur"] == "gorev_adim":
        return adim_calistir(con, cfg, i, ilerle, iptal_mi, transport=transport, now=now)
    g = i["girdi"] or {}
    rapor = ekip.calistir(con, cfg, i["ajan"], g.get("istek") or i["baslik"], ilerle=ilerle,
                          iptal_mi=iptal_mi, transport=transport, now=now)
    if g.get("kaynak") == "sohbet" and not iptal_mi():
        # Rapor sohbet akisina King'in sozu olarak duser (istemci akisi yeniler).
        patron.log(con, g.get("kanal") or "local", "manager",
                   "%s ajanın raporu (iş #%d): %s" % (rapor["ad"], i["id"], rapor["ozet"]), agent="king")
    return rapor


# ------------------------------------------------------------ sohbet

def _taslak_metni(p, not_=None):
    satir = ["«%s» için %d günlük görev taslağı kurdum (görev #%d, %s · %s)." % (
        p["hedef"], p["gun_sayisi"], p["id"], p["ajan_ad"], p["modul_ad"])]
    if not_:
        satir.append(not_)
    for gun in p["gunler"]:
        basliklar = [p["adimlar"][n - 1]["baslik"] for n in gun["adimlar"]]
        satir.append("• %s: %s" % (gun["gun_ad"], ", ".join(basliklar)))
    if p["gunluk_dk"]:
        satir.append("Günlük süre: %d dakika (%s)." % (p["gunluk_dk"], "senin sözün" if p["dk_kaynak"] == "mesaj"
                                                        else "%s hedefinden" % p["modul_ad"]))
    elif p["modul"] in PLAN_MODUL:
        satir.append("Günlük süreyi bilmiyorum; söylersen plana ekleme teklifi de yaparım.")
    satir.append("Onaylarsan başlatırım: «görevi başlat». Ağır işleri ekip arka planda yapar; sen "
                 "konuşmaya devam edebilirsin. Sen onaylamadan hiçbir modüle bir şey yazılmaz.")
    return "\n".join(satir)


def sohbet_cevabi(con, cfg, metin, kanal="local", bugun=None, transport=None, now=None,
                  uyan=is_kuyrugu.uyandir):
    """King sohbetinin kural yolu: gorev kur/baslat/iptal, ekibin durumu,
    «arka planda» devir. Cevap metni ya da None (olagan sohbet)."""
    m = str(metin or "").strip()
    bugun = bugun or (now[:10] if now else datetime.date.today().isoformat())
    b = BASLAT.match(m)
    if b:
        g = son_acik(con)
        if not g:
            return "Açık bir görev yok. «Bu hafta B1'e hazırla beni» gibi yazarsan kurarım."
        if b.group(1).lower() in ("başlat", "onayla"):
            r = onayla(con, g["id"], bugun=bugun, now=now)
            if not r["ok"]:
                return "Görev #%d zaten %s." % (g["id"], DURUM_AD[g["durum"]].lower())
            if uyan:
                uyan()
            s = is_kuyrugu.ozet(con)
            return "Görev #%d başladı: bugünün adımları ekipte. %s; sen konuşmaya devam edebilirsin." % (
                g["id"], s["metin"])
        iptal(con, g["id"], now=now)
        return "Görev #%d iptal edildi; sıradaki adımları durdurdum." % g["id"]
    t = tani(m, bugun)
    if t:
        if "hedef" in t["eksik"]:
            return "Neye hazırlanmak istiyorsun? Hedefi bir cümleyle yaz."
        if "sure" in t["eksik"]:
            return "«%s» için ne kadar sürem var? «bu hafta», «10 gün» ya da «2 hafta» gibi yaz." % t["hedef"]
        r = olustur(con, cfg, t["hedef"], t["gun_sayisi"], gunluk_dk=t["gunluk_dk"], kaynak=m,
                    bugun=bugun, transport=transport, now=now)
        if not r["ok"]:
            return r["soru"]
        return _taslak_metni(r["gorev"], t.get("not"))
    s = is_kuyrugu.ozet(con) if DURUM_SOR.search(m) else None
    if s and (s["acik"] or EKIP_SOZ.search(m) or son_acik(con)):
        satir = [s["metin"] + "."]
        if s["simdi"]:
            satir.append("Şu an: %s (%s)." % (s["simdi"]["baslik"], s["simdi"].get("adim") or "başladı"))
        g = son_acik(con)
        if g:
            satir.append("Görev #%d · %s." % (g["id"], pano(con, g)["metin"]))
        return " ".join(satir)
    if ARKA.search(m) and (EMIR_SON.search(m) or not re.search(r"arka ?planda", m, re.I)):
        istek = ARKA.sub(" ", m).strip(" ,.")
        r = ekip.devret(con, cfg, istek, kaynak="sohbet", kanal=kanal, transport=transport, now=now)
        if not r["ok"]:
            return r["soru"]
        if uyan:
            uyan()
        a = ekip.AJANLAR[r["is"]["ajan"]]
        return "Bunu %s ajanına verdim (iş #%d). Sen konuşmaya devam et; rapor bitince burada." % (
            a["ad"], r["is"]["id"])
    return None


# ------------------------------------------------------------ HTTP

def _no(parca, i):
    try:
        return int(parca[i])
    except (ValueError, IndexError):
        return None


UCLAR = ("ekip", "isler", "is", "gorevler", "gorev")


def bizim_mi(yol):
    p = str(yol or "").strip("/").split("/")
    return len(p) >= 3 and p[:2] == ["api", "king"] and p[2] in UCLAR


def uc(con, cfg, yontem, yol, q=None, govde=None, uyan=None, now=None):
    """/api/king/{ekip,isler,is,gorevler,gorev} uclari. Doner (kod, nesne)
    ya da None (bu yol bizim degil). `uyan`: isciyi beklemeden uyandirir."""
    q = q or {}
    govde = govde if isinstance(govde, dict) else {}
    if not bizim_mi(yol):
        return None
    p = yol.strip("/").split("/")
    uyan = uyan or is_kuyrugu.uyandir
    ilk = lambda k, v=None: (q.get(k) or [v])[0]           # noqa: E731
    if yontem == "GET":
        if p[2] == "ekip":
            return 200, {"ajanlar": ekip.katalog(cfg), "durum": is_kuyrugu.ozet(con)}
        if p[2] == "isler":
            try:
                limit = int(ilk("limit", 30))
            except ValueError:
                limit = 30
            return 200, {"isler": is_kuyrugu.listele(con, ilk("durum"), limit=limit), "durum": is_kuyrugu.ozet(con)}
        if p[2] == "is" and len(p) == 4:
            i = is_kuyrugu.getir(con, _no(p, 3))
            return (200, {"is": i}) if i else (404, {"error": "iş yok"})
        if p[2] == "gorevler":
            return 200, {"gorevler": listele(con, ilk("durum")), "durum": is_kuyrugu.ozet(con)}
        if p[2] == "gorev" and len(p) == 4:
            g = getir(con, _no(p, 3))
            return (200, {"gorev": pano(con, g)}) if g else (404, {"error": "görev yok"})
        return 404, {"error": "bilinmeyen uç"}
    if yontem != "POST":
        return 405, {"error": "yöntem desteklenmiyor"}
    if p[2] == "is" and len(p) == 3:
        ajan = govde.get("ajan")
        if ajan is not None and ajan not in ekip.AJANLAR:
            return 422, {"error": "bilinmeyen ajan", "ajanlar": list(ekip.AJANLAR)}
        r = ekip.devret(con, cfg, govde.get("istek"), ajan=ajan, kaynak="api", now=now)
        if not r["ok"]:
            return 422, r
        uyan()
        return 201, r
    if p[2] == "is" and len(p) == 5 and p[4] == "iptal":
        r = is_kuyrugu.iptal(con, _no(p, 3), now=now)
        return (200 if r["ok"] else 409 if r.get("is") else 404), r
    if p[2] == "gorev" and len(p) == 3:
        if govde.get("metin") and not govde.get("hedef"):
            t = tani(govde["metin"], (now or _simdi())[:10]) or {
                "hedef": hedef_of(govde["metin"]), "gun_sayisi": None, "gunluk_dk": gunluk_of(govde["metin"])}
            hedef, gun, dk = t["hedef"], t["gun_sayisi"], t["gunluk_dk"]
        else:
            hedef, gun, dk = govde.get("hedef"), govde.get("gun"), govde.get("gunluk_dk")
        ajan = govde.get("ajan")
        if ajan is not None and ajan not in ekip.MODUL_AJAN.values():
            return 422, {"error": "görevin sahibi akademik, beden ya da zihin olmalı"}
        r = olustur(con, cfg, hedef, gun, ajan=ajan, gunluk_dk=dk, kaynak=govde.get("metin") or "", now=now)
        return (201 if r["ok"] else 422), r
    if p[2] == "gorev" and len(p) == 5:
        gid = _no(p, 3)
        if p[4] == "onayla":
            r = onayla(con, gid, now=now)
            if r["ok"]:
                uyan()
            return (200 if r["ok"] else 409), r
        if p[4] == "iptal":
            r = iptal(con, gid, now=now)
            return (200 if r["ok"] else 409), r
        if p[4] == "sure":
            r = sure_ver(con, gid, govde.get("gunluk_dk"), now=now)
            return (200 if r["ok"] else 422), r
    return 404, {"error": "bilinmeyen uç"}


def isci(srv):
    """Daemon'un arka plan iscisi: gorev tiki + kuyruk."""
    is_kuyrugu.isci(srv, calistir_is, tik=lambda con, cfg: tik(con, cfg))
