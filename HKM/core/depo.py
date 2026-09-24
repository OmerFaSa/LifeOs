# -*- coding: utf-8 -*-
"""Depolama Burosu — BAM'in hafizasi ve kapisi (ekip/PLAN.md §3.C).

   Her is ONCE buradan gecer. Buro var olan bilgiyi denetler, duzenler ve
   bir konu arastirilmak istendiginde once depoya bakar:

     Kayit Kabul Uzmani      konuyu anahtara cevirir (ayni konu = ayni anahtar)
     Arama Uzmani            ayni konuda kayit var mi, benzerleri neler
     Kayit Dogrulama Uzmani  eslesen kaydin KAYNAKLARINI canli acar; cumle
                             izini ve kaynaga bagli alintilari karsilastirir
     Surum Uzmani            karar: guncel -> kaydi gonder (model cagrilmaz)
                                     degisti -> Arastirma Burosu'na GUNCELLEME
                                     yok     -> Arastirma Burosu'na YENI is
     Arsiv / Indeksleme      depo denetimi: kopya, eskiyen, kaynaksiz kayit

   Dort kural:
   1. ONCE DEPO. Ayni bilgi iki kez sifirdan arastirilmaz (PLAN §1.5).
   2. «GUNCEL» OLCULUR, VARSAYILMAZ. Yasina bakilarak «taze» denmez;
      kaynaklari acilir, cumle izi ve alintilar karsilastirilir. Kaynak
      okunamiyorsa «denetlenemedi» denir, «guncel» denmez.
   3. DEPO KAYDI SILMEZ. Kopya ve eski surumler baglanir ve raporlanir;
      silmek kullanicinin kararidir.
   4. DENETIM KODDUR. Depo denetimi model cagirmaz."""
import datetime
import hashlib
import json
import re

from core import butce, kaynakli, web

BURO = "Depolama Bürosu"
AJAN = {"kabul": "Kayıt Kabul Uzmanı", "arama": "Arama Uzmanı",
        "dogrulama": "Kayıt Doğrulama Uzmanı", "surum": "Sürüm Uzmanı",
        "arsiv": "Arşiv Uzmanı", "indeks": "İndeksleme Uzmanı"}
YENI_SAYILIR_SAAT = 24          # bu kadar yeni kayit yeniden denetlenmez
DENETIM_GECERLI_SAAT = 24       # bu kadar yeni bir denetim yeniden yapilmaz
ESKI_GUN = {"arastirma": 90, "materyal": 365, "plan": 180}
PARMAK_EN_COK = 120
DEGISIM_ESIGI = 0.25            # izin bu payi kaybolduysa kaynak «degisti»


def _simdi(now=None):
    return now or datetime.datetime.now().isoformat(timespec="seconds")


def _saat(a, b):
    try:
        return (datetime.datetime.fromisoformat(b)
                - datetime.datetime.fromisoformat(a)).total_seconds() / 3600.0
    except (TypeError, ValueError):
        return None


def iz(ajan, yapti):
    return {"ajan": AJAN.get(ajan, ajan), "yapti": yapti}


# ----------------------------------------------------------- anahtar

def normal(metin):
    t = str(metin or "").replace("I", "ı").replace("İ", "i").lower()
    t = re.sub(r"[^\wçğıöşü ]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def konu_anahtari(konu):
    n = normal(konu)
    return hashlib.sha1(n.encode("utf-8")).hexdigest()[:20] if n else None


def _cumleler(metin):
    for c in re.split(r"(?<=[.!?])\s+|\n+", metin or ""):
        c = normal(c)
        if len(c) >= 40:
            yield c


def _h(c):
    return hashlib.sha1(c.encode("utf-8")).hexdigest()[:6]


def parmak(metin):
    """Kaynagin cumle parmak izi: 40 harften uzun her cumlenin 6 haneli
    ozeti, en cok PARMAK_EN_COK. Sayfanin tamami degil, ONU TANIYAN iz
    saklanir; degisim bu izin ne kadarinin yeni metinde kaldigiyla olculur."""
    hs = []
    for c in _cumleler(metin):
        h = _h(c)
        if h not in hs:
            hs.append(h)
        if len(hs) >= PARMAK_EN_COK:
            break
    return " ".join(hs)


def degisim(eski_parmak, metin):
    """Eski izin yeni metinde KALMAYAN payi (0..1). Iz yoksa None."""
    a = set((eski_parmak or "").split())
    if not a:
        return None
    b = {_h(c) for c in _cumleler(metin)}
    return round(1 - len(a & b) / float(len(a)), 2)


def _dayanaklar(govde):
    """Kaydin kaynaga baglanmis iddialari: (etiket, alinti, [n]).
    Arastirmada dogrulanmis bulgular, mufredatta dogrulanmis dersler."""
    out = []
    for i, b in enumerate(govde.get("bulgular") or []):
        if b.get("dogrulandi") and b.get("alinti") and b.get("dogrulayan"):
            out.append(("bulgu %d" % (i + 1), b["alinti"], list(b["dogrulayan"])))
    for d in govde.get("dersler") or []:
        if d.get("dogrulandi") and d.get("alinti") and d.get("kaynak"):
            out.append((d.get("ad") or "ders", d["alinti"], [d["kaynak"]]))
    return out


# ------------------------------------------------------------ arama

def eslesen(con, anahtar):
    """Ayni konu anahtarini tasiyan EN YENI arastirma kaydi."""
    if not anahtar:
        return None
    r = con.execute("SELECT * FROM bam_kayitlar WHERE tur='arastirma' AND anahtar=? "
                    "ORDER BY id DESC LIMIT 1", (anahtar,)).fetchone()
    if not r:
        return None
    d = dict(r)
    for alan, bos in (("govde", {}), ("denetim", None)):
        try:
            d[alan] = json.loads(d[alan]) if d.get(alan) else bos
        except ValueError:
            d[alan] = bos
    return d


# ------------------------------------------------------- guncellik

def tazelik_denetle(con, cfg, rol, kayit, now=None, tasiyici=None):
    """Kaydin kaynaklarini CANLI acar (onbellek okunmaz) ve iki sey olcer:
      - her kaynagin cumle izinin ne kadari yerinde (degisim payi);
      - kaynaga baglanmis her alinti hala kaynaginda mi.
    Bir alinti kaybolduysa ya da bir kaynagin izi DEGISIM_ESIGI kadar
    degistiyse kayit «degisti»dir. Hicbir kaynak okunamadiysa
    «denetlenemedi»dir — «guncel» DEGIL.

    Doner: {durum: guncel|degisti|denetlenemedi|kaynaksiz, degisen:[n],
    kaybolan:[etiket], okunamayan:[n], oran:{n: pay}, at}. Sonuc kayda
    yazilir (bam_kayitlar.denetim)."""
    govde = kayit.get("govde") or {}
    izli = [k for k in govde.get("kaynaklar") or [] if k.get("parmak")]
    at = _simdi(now)
    sonuc = {"durum": "kaynaksiz", "degisen": [], "kaybolan": [], "okunamayan": [],
             "oran": {}, "at": at, "rol": rol}
    if izli and not web.settings(cfg)["acik"]:
        sonuc.update(durum="denetlenemedi", neden="Web kapalı")
    elif izli:
        metin = {}
        for k in izli:
            s = web.getir(con, cfg, rol, k["url"], tasiyici=tasiyici, now=now, taze=True)
            if s.get("ok"):
                metin[k["n"]] = s["metin"]
                sonuc["oran"][str(k["n"])] = degisim(k["parmak"], s["metin"])
            else:
                sonuc["okunamayan"].append(k["n"])
        sonuc["degisen"] = [int(n) for n, p in sonuc["oran"].items()
                            if p is not None and p >= DEGISIM_ESIGI]
        for etiket, alinti, nlar in _dayanaklar(govde):
            okunan = [n for n in nlar if n in metin]
            if okunan and not any(kaynakli.alinti_dogru_mu(alinti, metin[n]) for n in okunan):
                sonuc["kaybolan"].append(etiket)
        if sonuc["degisen"] or sonuc["kaybolan"]:
            sonuc["durum"] = "degisti"
        elif not metin:
            sonuc["durum"] = "denetlenemedi"
            sonuc["neden"] = "Kaynakların hiçbiri açılamadı"
        else:
            sonuc["durum"] = "guncel"
    con.execute("UPDATE bam_kayitlar SET denetim=? WHERE id=?",
                (json.dumps(sonuc, ensure_ascii=False), kayit["id"]))
    return sonuc


def _izli_mi(k):
    return any(x.get("parmak") for x in (k.get("govde") or {}).get("kaynaklar") or [])


def taze_mi(con, kayit_id, now=None, en_cok_gun=None):
    """King'in kapisinda, AGA CIKMADAN: bu kaydin (ya da dayandigi
    arastirmanin) guncelligi yakin zamanda OLCULDU mu? Olculmediyse is
    Depolama Burosu'na gider ve orada olculur. Doner: (bool, not).

    `en_cok_gun` (Part 8e): turun tazelik suresi. Fiyat gibi hizli eskiyen
    veride kaynak degismemis olsa da YAS tek basina bayatliktir."""
    r = con.execute("SELECT id, tur, govde, created_at FROM bam_kayitlar WHERE id=?",
                    (int(kayit_id),)).fetchone()
    if not r:
        return False, "Kayıt yok."
    if en_cok_gun is not None:
        yas_saat = _saat(r["created_at"], _simdi(now))
        if yas_saat is not None and yas_saat // 24 > en_cok_gun:
            return False, ("Kayıt %d gün önce yazıldı; bu tür veri %d günde eskir."
                           % (yas_saat // 24, en_cok_gun))
    try:
        g = json.loads(r["govde"] or "{}")
    except ValueError:
        g = {}
    ar_id = r["id"] if r["tur"] == "arastirma" else g.get("dayanak")
    if not ar_id:
        return True, "Kayıt araştırmaya dayanmıyor; güncellik sorusu yok."
    ar = con.execute("SELECT id, anahtar, created_at, denetim FROM bam_kayitlar WHERE id=?",
                     (int(ar_id),)).fetchone()
    if not ar:
        return False, "Dayandığı araştırma kaydı yok."
    if ar["anahtar"]:
        son = con.execute("SELECT MAX(id) FROM bam_kayitlar WHERE tur='arastirma' AND anahtar=?",
                          (ar["anahtar"],)).fetchone()[0]
        if son and son != ar["id"]:
            return False, "Dayandığı araştırmanın yeni sürümü var (#%d)." % son
    yas = _saat(ar["created_at"], _simdi(now))
    if yas is not None and yas < YENI_SAYILIR_SAAT:
        return True, "Araştırma %d saat önce yazıldı." % yas
    try:
        d = json.loads(ar["denetim"] or "null") or {}
    except ValueError:
        d = {}
    dy = _saat(d.get("at"), _simdi(now))
    if d.get("durum") == "guncel" and dy is not None and dy < DENETIM_GECERLI_SAAT:
        return True, "Kaynakları %s tarihinde açıldı; güncel." % d["at"][:16]
    return False, "Güncelliği yakın zamanda ölçülmedi; Depolama Bürosu denetleyecek."


def karar(con, cfg, anahtar, now=None, tasiyici=None):
    """Depolama Burosu'nun karari. Doner: {karar: yeni|guncel|guncelle,
    kayit_id, denetim, iz:[{ajan, yapti}], not}.

      yeni      depoda bu konu yok -> Arastirma Burosu'na yeni is
      guncel    kayit gonderilir, arastirma YAPILMAZ (model cagrilmaz)
      guncelle  kaynaklar degisti ya da kayit kaynaksizdi ve web acik ->
                Arastirma Burosu yeni SURUM yazar (onceki_id ile bagli)"""
    izler = [iz("kabul", "Konu depo anahtarına çevrildi.")]
    k = eslesen(con, anahtar)
    if not k:
        izler.append(iz("arama", "Bu konuda depoda araştırma kaydı yok."))
        izler.append(iz("surum", "Araştırma Bürosu'na yeni iş olarak gönderildi."))
        return {"karar": "yeni", "iz": izler, "not": "Depoda kayıt yok; yeni araştırma."}
    kid = k["id"]
    izler.append(iz("arama", "Depoda kayıt #%d bulundu (%s, %s)." % (
        kid, k["created_at"][:10], k["dogruluk"])))
    yas = _saat(k["created_at"], _simdi(now))
    if yas is not None and yas < YENI_SAYILIR_SAAT:
        izler.append(iz("dogrulama", "Kayıt %d saat önce yazıldı; yeniden açılmadı." % yas))
        izler.append(iz("surum", "Kayıt #%d gönderildi." % kid))
        return {"karar": "guncel", "kayit_id": kid, "iz": izler,
                "not": "Depodaki kayıt #%d yeni (%d saat); araştırma yapılmadı." % (kid, yas)}
    web_acik = web.settings(cfg)["acik"]
    if not _izli_mi(k):
        if web_acik:
            izler.append(iz("dogrulama", "Kayıt kaynaksız; güncelliği ölçülemez."))
            izler.append(iz("surum", "Kaynaklı araştırmayla yeni sürüm yazılacak."))
            return {"karar": "guncelle", "kayit_id": kid, "iz": izler,
                    "not": "Kayıt #%d kaynaksızdı; kaynaklı yeni sürüm yazılacak." % kid}
        izler.append(iz("surum", "Web kapalı; kaynaksız kayıt #%d olduğu gibi gönderildi." % kid))
        return {"karar": "guncel", "kayit_id": kid, "iz": izler, "denetlenemedi": True,
                "not": "Depodaki kayıt #%d gönderildi; web kapalı, güncelliği denetlenemedi." % kid}
    son = k.get("denetim") or {}
    dy = _saat(son.get("at"), _simdi(now))
    if son.get("durum") in ("guncel", "degisti") and dy is not None and dy < DENETIM_GECERLI_SAAT:
        d = son
        izler.append(iz("dogrulama", "Son denetim %s: %s." % (
            son["at"][:16], {"guncel": "güncel", "degisti": "değişmiş"}[son["durum"]])))
    else:
        d = tazelik_denetle(con, cfg, "bam.kayit", k, now=now, tasiyici=tasiyici)
        izler.append(iz("dogrulama", {
            "guncel": "%d kaynak yeniden açıldı; içerik ve alıntılar yerinde." % len(d["oran"]),
            "degisti": "Kaynak değişti: %s." % ", ".join(
                ["[%d]" % n for n in d["degisen"]] + d["kaybolan"]),
            "denetlenemedi": "Kaynaklar açılamadı (%s)." % d.get("neden", ""),
            "kaynaksiz": "Kayıt kaynaksız."}[d["durum"]]))
    if d["durum"] == "degisti":
        izler.append(iz("surum", "Araştırma Bürosu'na güncelleme işi olarak gönderildi."))
        return {"karar": "guncelle", "kayit_id": kid, "denetim": d, "iz": izler,
                "not": "Kayıt #%d'in kaynakları değişti; yeni sürüm yazılacak." % kid}
    if d["durum"] == "guncel":
        izler.append(iz("surum", "Kayıt #%d güncel; araştırma yapılmadan gönderildi." % kid))
        return {"karar": "guncel", "kayit_id": kid, "denetim": d, "iz": izler,
                "not": "Depodaki kayıt #%d güncel (kaynakları açılıp denetlendi); "
                       "araştırma yapılmadı." % kid}
    izler.append(iz("surum", "Denetlenemedi; kayıt #%d uyarıyla gönderildi." % kid))
    return {"karar": "guncel", "kayit_id": kid, "denetim": d, "iz": izler, "denetlenemedi": True,
            "not": "Depodaki kayıt #%d gönderildi; güncelliği denetlenemedi." % kid}


# ------------------------------------------------------------ denetim

def bakim(con, now=None):
    """Gunluk depo denetimi: gunde BIR kez kosar, raporu saklar."""
    gun = _simdi(now)[:10]
    if con.execute("SELECT 1 FROM bam_depo_rapor WHERE gun=?", (gun,)).fetchone():
        return None
    r = denetim(con, now=now)
    con.execute("INSERT OR REPLACE INTO bam_depo_rapor(gun, rapor) VALUES (?,?)",
                (gun, json.dumps(r, ensure_ascii=False)))
    return r


def son_rapor(con):
    r = con.execute("SELECT rapor FROM bam_depo_rapor ORDER BY gun DESC LIMIT 1").fetchone()
    return json.loads(r["rapor"]) if r else None


def denetim(con, now=None):
    """Depo denetimi (Arsiv + Indeksleme). Model cagirmaz, kayit silmez.
    Kopyalar bir onceki surume baglanir; eskiyen ve kaynaksiz sayilir."""
    at = _simdi(now)
    satir = [dict(r) for r in con.execute(
        "SELECT id, tur, baslik, dogruluk, anahtar, onceki_id, created_at, denetim "
        "FROM bam_kayitlar ORDER BY id")]
    tur = {}
    for r in satir:
        tur[r["tur"]] = tur.get(r["tur"], 0) + 1
    # Ayni anahtarli arastirmalar: en yenisi gecerli, oncekiler surum zinciri.
    bagli, gruplar = 0, {}
    for r in satir:
        if r["tur"] == "arastirma" and r["anahtar"]:
            gruplar.setdefault(r["anahtar"], []).append(r)
    kopya = []
    for anahtar, rs in gruplar.items():
        for once, sonra in zip(rs, rs[1:]):
            if sonra["onceki_id"] is None:
                con.execute("UPDATE bam_kayitlar SET onceki_id=? WHERE id=?", (once["id"], sonra["id"]))
                con.execute("INSERT OR IGNORE INTO bam_iz(kaynak_tur,kaynak_id,hedef_tur,hedef_id,"
                            "created_at) VALUES ('kayit',?,'kayit',?,?)",
                            (str(once["id"]), str(sonra["id"]), at))
                bagli += 1
            kopya.append(once["id"])
    eski = [r["id"] for r in satir
            if (_saat(r["created_at"], at) or 0) / 24.0 > ESKI_GUN.get(r["tur"], 365)
            and r["id"] not in kopya]
    kaynaksiz = [r["id"] for r in satir if r["dogruluk"] == "dogrulanmadi" and r["id"] not in kopya]
    gecerli = [r for r in satir if r["id"] not in kopya]
    kaynakli = sum(1 for r in gecerli if r["dogruluk"] in ("kaynakli", "celiskili"))
    return {"at": at, "toplam": len(satir), "tur": tur, "gecerli": len(gecerli),
            "eski_surum": kopya, "yeni_baglanan": bagli, "eskiyen": eski,
            "kaynaksiz": len(kaynaksiz), "kaynakli_oran": round(kaynakli / float(len(gecerli)), 2)
            if gecerli else None,
            # Yuzde de KODDAN gelir: yuz sayi uretmez (HKM/web kurali).
            "kaynakli_yuzde": int(round(100.0 * kaynakli / len(gecerli))) if gecerli else None,
            "etiket": "olculdu",
            "iz": [iz("arsiv", "%d kayıt tarandı; %d eski sürüm bağlandı." % (len(satir), bagli)),
                   iz("indeks", "%d kayıt eskimiş, %d kayıt kaynaksız." % (len(eski),
                                                                          len(kaynaksiz)))]}


# ------------------------------------------------------------ tarayici
#
# Bilgi Deposu tarayicisi (ekip/PLAN.md §3.H, DEVIR Y9): raporlar,
# kaynaklar, tazelik, surumler TEK listede. Her durum ve her sayi KODDAN
# gelir; yuz yalniz yazar. Model cagrilmaz, aga cikilmaz, kayit silinmez.

TAZELIK_DURUM = ("guncel", "degisti", "denetlenemedi", "eski_surum", "eskiyen",
                 "olculmedi", "yeni", "soru_yok")
TAZELIK_AD = {"guncel": "güncel", "degisti": "kaynağı değişti", "denetlenemedi": "denetlenemedi",
              "eski_surum": "eski sürüm", "eskiyen": "eskiyen", "olculmedi": "ölçülmedi",
              "yeni": "yeni", "soru_yok": "araştırmaya dayanmıyor"}
TARA_EN_COK = 500


def _json(x, bos):
    try:
        return json.loads(x) if x else bos
    except ValueError:
        return bos


def _gun(a, b):
    s = _saat(a, b)
    return None if s is None else int(s // 24)


def _son_surumler(satir):
    """Konu anahtari -> en yeni arastirma kimligi."""
    son = {}
    for r in satir:
        if r["tur"] == "arastirma" and r["anahtar"]:
            son[r["anahtar"]] = max(son.get(r["anahtar"], 0), r["id"])
    return son


def _tazelik(r, son, arastirma, at):
    """Bir kaydin tazeligi: {durum, metin, etiket}. Kod karar verir.

    Arastirma kaydinin kendi denetimine, materyal ve plan kaydinin
    dayandigi arastirmaya bakilir. Olculmemis tazelik «guncel» sayilmaz."""
    if r["tur"] == "arastirma" and r["anahtar"] and son.get(r["anahtar"], r["id"]) != r["id"]:
        return {"durum": "eski_surum", "etiket": "olculdu",
                "metin": "Yeni sürümü var (#%d); bu kayıt geçmiş için duruyor." % son[r["anahtar"]]}
    if r["tur"] != "arastirma":
        dayanak = _json(r["govde"], {}).get("dayanak")
        if not dayanak or int(dayanak) not in arastirma:
            yas = _gun(r["created_at"], at)
            sinir = ESKI_GUN.get(r["tur"], 365)
            if yas is not None and yas > sinir:
                return {"durum": "eskiyen", "etiket": "hesaplandi",
                        "metin": "%d gün önce yazıldı; bu tür için süre %d gün." % (yas, sinir)}
            return {"durum": "soru_yok", "etiket": "hesaplandi",
                    "metin": "Bir araştırmaya dayanmıyor; güncellik sorusu yok."}
        a = arastirma[int(dayanak)]
        t = _tazelik(a, son, arastirma, at)
        t = dict(t)
        t["metin"] = "Dayandığı araştırma (#%d): %s" % (a["id"], t["metin"][0].lower() + t["metin"][1:])
        return t
    d = _json(r["denetim"], None) or {}
    if d.get("durum") in ("guncel", "degisti", "denetlenemedi"):
        ne = {"guncel": "kaynakları açıldı, güncel",
              "degisti": "kaynağı değişti; yeni sürüm gerekir",
              "denetlenemedi": "kaynakları açılamadı (%s)" % (d.get("neden") or "okunamadı")}
        return {"durum": d["durum"], "etiket": "olculdu",
                "metin": "%s tarihinde %s." % (str(d.get("at") or "")[:10], ne[d["durum"]])}
    yas = _gun(r["created_at"], at)
    sinir = ESKI_GUN.get("arastirma", 90)
    if yas is not None and yas > sinir:
        return {"durum": "eskiyen", "etiket": "hesaplandi",
                "metin": "%d gündür güncelliği ölçülmedi; araştırma için süre %d gün." % (yas, sinir)}
    if yas is not None and yas * 24 < YENI_SAYILIR_SAAT:
        return {"durum": "yeni", "etiket": "hesaplandi", "metin": "Bugün yazıldı."}
    return {"durum": "olculmedi", "etiket": "veri_yok",
            "metin": "Güncelliği henüz ölçülmedi (%d gün önce yazıldı)." % (yas or 0)}


def _satirlar(con):
    return [dict(r) for r in con.execute(
        "SELECT id, tur, baslik, dogruluk, surum, anahtar, onceki_id, created_at, denetim, "
        "govde, etiketler, is_id FROM bam_kayitlar ORDER BY id DESC LIMIT ?", (TARA_EN_COK,))]


def _eslesir(r, kelimeler):
    if not kelimeler:
        return True
    metin = normal(" ".join((r["baslik"] or "", r["etiketler"] or "", r["govde"] or "")))
    return all(w in metin for w in kelimeler)


def tarayici(con, sorgu="", tur=None, durum=None, limit=50, now=None):
    """Depo tarayicisi: aranir, ture ve tazelige gore suzulur.

    Sayim (cipler icin) SORGUYA gore yapilir, tur/durum suzgecinden once:
    kullanici suzgeci degistirince neyin kalacagini onceden gorur."""
    at = _simdi(now)
    satir = _satirlar(con)
    son = _son_surumler(satir)
    arastirma = {r["id"]: r for r in satir if r["tur"] == "arastirma"}
    kelimeler = [w for w in normal(sorgu).split() if len(w) >= 2]
    out, sayim = [], {"tur": {}, "durum": {}}
    for r in satir:
        if not _eslesir(r, kelimeler):
            continue
        t = _tazelik(r, son, arastirma, at)
        sayim["tur"][r["tur"]] = sayim["tur"].get(r["tur"], 0) + 1
        sayim["durum"][t["durum"]] = sayim["durum"].get(t["durum"], 0) + 1
        if (tur and r["tur"] != tur) or (durum and t["durum"] != durum):
            continue
        g = _json(r["govde"], {})
        out.append({"id": r["id"], "tur": r["tur"], "baslik": r["baslik"],
                    "dogruluk": r["dogruluk"], "surum": r["surum"],
                    "tarih": str(r["created_at"])[:10], "yas_gun": _gun(r["created_at"], at),
                    "kaynak": len(g.get("kaynaklar") or []), "tazelik": t})
    return {"kayitlar": out[:max(1, min(int(limit or 50), 200))], "toplam": len(out),
            "sayim": sayim, "at": at, "etiket": "olculdu", "adlar": TAZELIK_AD,
            "kural": "Tazelik kaynakların canlı açılmasıyla ölçülür; ölçülmemiş kayıt «güncel» "
                     "sayılmaz. Süreler: araştırma %d, plan %d, materyal %d gün."
                     % (ESKI_GUN["arastirma"], ESKI_GUN["plan"], ESKI_GUN["materyal"])}


def _kayit_maliyeti(con, is_id):
    """Kaydi ureten isin OLCULEN maliyeti (Kutuphanem). Issiz kayitta soru
    yok (None). Cagri yazilmamis is sifir maliyetli SAYILMAZ: usage.is_id
    sonradan geldi; eski islerin cagrisi baglanmadi."""
    if not is_id:
        return None
    m = butce.is_maliyeti(con, is_id)
    if not m["cagri"]:
        return {"is_id": int(is_id), "cagri": 0, "usd": None, "etiket": "veri_yok",
                "metin": "bu iş için ölçülmüş çağrı yok"}
    return dict(m, is_id=int(is_id))


def kayit_depo(con, kayit_id, now=None):
    """Tek kaydin depo gorunumu: tazelik, surum zinciri, kaynaklar."""
    at = _simdi(now)
    satir = _satirlar(con)
    r = next((x for x in satir if x["id"] == int(kayit_id)), None)
    if not r:
        return None
    son = _son_surumler(satir)
    arastirma = {x["id"]: x for x in satir if x["tur"] == "arastirma"}
    if r["anahtar"]:
        zincir = sorted([x for x in satir if x["anahtar"] == r["anahtar"]
                         and x["tur"] == r["tur"]], key=lambda x: x["id"])
    else:
        # Anahtarsiz kayit: onceki_id baglarini iki yone izle.
        byid = {x["id"]: x for x in satir}
        zincir, x = [], r
        while x and x["id"] not in [z["id"] for z in zincir]:
            zincir.insert(0, x)
            x = byid.get(x["onceki_id"]) if x["onceki_id"] else None
        sonraki = {x["onceki_id"]: x for x in satir if x["onceki_id"]}
        x = sonraki.get(r["id"])
        while x and x["id"] not in [z["id"] for z in zincir]:
            zincir.append(x)
            x = sonraki.get(x["id"])
    g = _json(r["govde"], {})
    return {"tazelik": _tazelik(r, son, arastirma, at),
            "maliyet": _kayit_maliyeti(con, r["is_id"]),
            "surumler": [{"id": x["id"], "surum": x["surum"], "tarih": str(x["created_at"])[:10],
                          "bu": x["id"] == r["id"]} for x in zincir],
            "kaynaklar": [{"n": k.get("n"), "baslik": k.get("baslik"), "url": k.get("url"),
                           "alan": k.get("alan"), "tur": k.get("tur"), "erisim": k.get("erisim")}
                          for k in g.get("kaynaklar") or []]}


# ------------------------------------------------------------ kullanim (8e)

KULLANIM_GUN = 30
DURUM_AD = {"pending": "cevap bekliyor", "delivered": "cevap bekliyor",
            "acknowledged": "görüldü, uygulanmadı", "dismissed": "istenmedi",
            "expired": "süresi doldu", "unknown": "belirsiz"}


def kullanilmayan(con, modul=None, now=None, gun=KULLANIM_GUN):
    """Son `gun` gunde BAM'in birakip modulun UYGULAMADIGI ciktilar.
    Olculen tek sey teklifin cevabidir; «acildi mi» olculmez ve iddia
    edilmez. Doner: [{id, modul, tur, baslik, durum}] (yeniden eskiye)."""
    t = _simdi(now)
    try:
        alt = (datetime.datetime.fromisoformat(t[:19])
               - datetime.timedelta(days=gun)).isoformat(timespec="seconds")
    except ValueError:
        return []
    q = ("SELECT id, module, kind, payload, state FROM intents WHERE source='bam' "
         "AND state != 'applied' AND created_at >= ? AND created_at <= ?")
    arg = [alt, t[:19]]
    if modul:
        q += " AND module=?"
        arg.append(modul)
    out = []
    for r in con.execute(q + " ORDER BY id DESC", arg).fetchall():
        try:
            p = json.loads(r["payload"] or "{}")
        except ValueError:
            p = {}
        out.append({"id": r["id"], "modul": r["module"], "tur": r["kind"],
                    "baslik": str(p.get("baslik") or p.get("ad") or r["kind"])[:80],
                    "durum": DURUM_AD.get(r["state"], r["state"])})
    return out
