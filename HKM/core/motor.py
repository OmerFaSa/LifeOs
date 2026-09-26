# -*- coding: utf-8 -*-
"""Motor — gereken zekayi, gereken yerde, en dusuk maliyetle.

   Amac en guclu modeli sonuna kadar kullanmak DEGIL. Dort model sinifi
   vardir; paket her seviye icin nereden baslanacagini ve en fazla nereye
   cikilacagini soyler. Sistem baslangic sinifiyla dener; model ZORLANIRSA
   bir ust sinifa cikar. Guclu modeller surekli calisan bir motor degil,
   gerektiginde cagrilan uzmanlardir.

     ekonomik  < standart < guclu < uzman

   Paketler (butce): A verim · A+ verim, bir tik kalite · S kalite, verimle ·
   S+ kalite. Paket yukseldikce hicbir seviyenin baslangici ya da tavani
   dusmez (testle sabit).

   ZORLANMA (koddan olculur, modelin sozune birakilmaz):
     - cevap dusuruldu (uydurma sayi, buyurgan kip — ai._temizle),
     - saglayici hata verdi,
     - kisaltma istendigi halde cevap yine kesildi,
     - alt basamaktaki model «[[YUKSELT]]» dedi: bu bir KARAR degil, «bu
       bana fazla» isaretidir; cikisi yine kod yapar ve tavani paket koyar.
   Butce engelinde YUKSELINMEZ: ust basamak daha pahalidir.

   BUTCE BANTLARI: ayin harcamasi tavanin uyari bantlarini (varsayilan %80
   ve %95) gecince yonlendirme ekonomiklesir ve bu cevapla birlikte
   SOYLENIR — kullanici neden daha basit bir cevap aldigini bilir.

   ELLE SECIM KAZANIR: bir kademenin KENDI atamasi varsa merdiven kurulmaz.
   Paket secilmemisse sistem eskisi gibi atama/mirasla calisir."""

import contextlib
import threading

from core import butce, models

SINIFLAR = ("ekonomik", "standart", "guclu", "uzman")
SINIF_ADI = {"ekonomik": "Ekonomik", "standart": "Standart", "guclu": "Güçlü", "uzman": "Uzman"}

# Sinif -> model. Metin ve gorsel OpenRouter'dan (tek anahtar); ses yalniz
# Google'dan (ai.py medya kurali). Siniflama saglayicinin kendi urun
# siralamasidir (lite < mini < ana model < en ust), kalite olcumu degil.
SINIF_MODELI = {
    "metin": {"ekonomik": "google/gemini-2.5-flash-lite", "standart": "openai/gpt-5-mini",
              "guclu": "anthropic/claude-sonnet-5", "uzman": "anthropic/claude-opus-5.5"},
    "gorsel": {"ekonomik": "google/gemini-2.5-flash-lite", "standart": "google/gemini-2.5-flash",
               "guclu": "anthropic/claude-sonnet-5", "uzman": "anthropic/claude-opus-5.5"},
    "ses": {"ekonomik": "gemini-3.6-flash", "standart": "gemini-3.6-flash",
            "guclu": "gemini-2.5-pro", "uzman": "gemini-2.5-pro"},
}

POLITIKA_SEVIYELERI = ("alt", "orta", "ust", "gorsel", "arastirma", "ses")
# (baslangic, tavan, efor). Efor OpenRouter'in birlesik `reasoning.effort`
# degeridir; desteklemeyen model yok sayar.
PAKET_POLITIKASI = {
    "A": {"alt": ("ekonomik", "standart", "low"), "orta": ("ekonomik", "standart", "low"),
          "ust": ("standart", "guclu", "medium"), "gorsel": ("ekonomik", "standart", None),
          "arastirma": ("ekonomik", "standart", "low"), "ses": ("ekonomik", "standart", None)},
    "A+": {"alt": ("ekonomik", "standart", "low"), "orta": ("standart", "guclu", "low"),
           "ust": ("standart", "guclu", "medium"), "gorsel": ("ekonomik", "standart", None),
           "arastirma": ("standart", "guclu", "medium"), "ses": ("ekonomik", "standart", None)},
    "S": {"alt": ("ekonomik", "standart", "low"), "orta": ("standart", "guclu", "medium"),
          "ust": ("guclu", "uzman", "high"), "gorsel": ("standart", "guclu", None),
          "arastirma": ("standart", "uzman", "high"), "ses": ("standart", "guclu", None)},
    "S+": {"alt": ("standart", "guclu", "low"), "orta": ("guclu", "uzman", "medium"),
           "ust": ("uzman", "uzman", "high"), "gorsel": ("guclu", "uzman", None),
           "arastirma": ("guclu", "uzman", "high"), "ses": ("guclu", "guclu", None)},
}
PAKET_ADI = {"A": "Az bütçe · verim", "A+": "Orta bütçe · verim, bir tık kalite",
             "S": "Yüksek bütçe · kalite, verimle", "S+": "En yüksek bütçe · kalite"}

# Cevap uzunlugu seviyeye gore (jeton); efor secildiyse dusunme payi eklenir
# — OpenRouter'da dusunme jetonlari cevap sinirina dahildir, pay verilmezse
# dusunen model cevabi yazamadan kesilir.
CEVAP_JETON = {"alt": 500, "orta": 1000, "ust": 1800, "gorsel": 1200,
               "arastirma": 2000, "ses": 1200}
DUSUNME_PAYI = {None: 0, "low": 1000, "medium": 2500, "high": 5000}

# BAM EFORU — is basina secilir. «yuksek» paketin kendi merdivenidir;
# «dusuk» ucuzlatir, «en_yuksek» Guclu→Uzman'a cikar. Yalniz BAM
# kademelerini etkiler (sohbet paketin merdiveninde kalir) ve yalniz
# adimin kendi seviyesi olmayan cagrilarda (sorgu kurmak gibi basit adim
# alt seviyede kalir). Butce bantlari yine uygulanir.
BAM_EFORLARI = ("dusuk", "yuksek", "en_yuksek")
BAM_EFOR_ADI = {"dusuk": "Düşük", "yuksek": "Yüksek", "en_yuksek": "En yüksek"}
BAM_EFOR_POLITIKASI = {
    "dusuk": {"arastirma": ("ekonomik", "standart", "low"), "ust": ("standart", "guclu", "low"),
              "orta": ("ekonomik", "standart", "low")},
    "en_yuksek": {"arastirma": ("guclu", "uzman", "high"), "ust": ("guclu", "uzman", "high"),
                  "orta": ("standart", "guclu", "medium")},
}
_BAGLAM = threading.local()


@contextlib.contextmanager
def efor_baglami(efor):
    """BAM adiminin cagrilari bu eforla yurur (bam.py, is_baglami gibi)."""
    onceki = getattr(_BAGLAM, "efor", None)
    _BAGLAM.efor = efor if efor in BAM_EFORLARI else None
    try:
        yield
    finally:
        _BAGLAM.efor = onceki


def _politika(paket, pseviye, rol, seviye):
    bas, tavan, efor = PAKET_POLITIKASI[paket][pseviye]
    e = getattr(_BAGLAM, "efor", None)
    if rol.startswith("bam") and seviye is None and e in BAM_EFOR_POLITIKASI:
        bas, tavan, efor = BAM_EFOR_POLITIKASI[e].get(pseviye, (bas, tavan, efor))
    return bas, tavan, efor


YUKSELT = "[[YUKSELT]]"
YUKSELT_KURALI = ("\n\nBu istek senin için fazla karmaşıksa (derin analiz, çok adımlı plan, "
                  "emin olamadığın bir karar) cevap yazma; yalnızca " + YUKSELT + " yaz. "
                  "Basit bir istekse kendin cevapla.")


def _gorsel_rol(rol):
    return rol == "para.fis" or rol.endswith(".gorsel")


def politika_seviyesi(rol, seviye=None):
    """Kademenin politika satiri. Sohbette mesajin seviyesi (alt/orta/ust)
    kazanir; gorsel ve ses her zaman kendi satirindadir."""
    if rol == "medya":
        return "ses"
    if _gorsel_rol(rol):
        return "gorsel"
    if seviye in ("alt", "orta", "ust"):
        return seviye
    return models.oneri_kademesi(rol)


def _hazir_denetimi(a):
    if not a or not a.get("provider"):
        return {"ok": False, "reason": "no-model",
                "note": "Bu kademeye bir model atanmamış. Ayarlar → Yapay zekâ → Görev dağılımı "
                        "ya da bir bütçe paketi seç."}
    if not a.get("model"):
        return {"ok": False, "reason": "no-model-name", "note": "Sağlayıcı seçilmiş ama model adı yazılmamış."}
    if a.get("key_missing"):
        return {"ok": False, "reason": "key-missing",
                "note": "Bu kademeye seçilen anahtar artık yok. Ayarlar → Yapay zekâ'dan yeniden seç."}
    if not a.get("key_set"):
        return {"ok": False, "reason": "no-key", "note": "%s için anahtar girilmemiş." % a["provider_label"]}
    return None


def _ekonomi(con, cfg, bas, tavan):
    """Butce bandina gore (bas, tavan, not)."""
    if con is None:
        return bas, tavan, None
    d = butce.month(con, cfg)
    tavan_para = d.get("ceiling")
    if not tavan_para:
        return bas, tavan, None
    oran = 100.0 * float(d.get("spent") or 0) / float(tavan_para)
    bantlar = list(butce.settings(cfg).get("warn_pct") or [50, 80, 95])
    ikinci, ucuncu = (bantlar + [80, 95])[1], (bantlar + [80, 95, 95])[2]
    i = SINIFLAR.index
    if oran >= ucuncu:
        yeni_tavan = SINIFLAR[min(i(tavan), i("standart"))]
        return "ekonomik", yeni_tavan, {
            "bant": ucuncu, "oran": round(oran),
            "not": "Aylık bütçenin %%%d'i kullanıldı (%%%d eşiği): yanıtlar ekonomik modelden "
                   "başlıyor, en fazla Standart sınıfa çıkılıyor." % (round(oran), ucuncu)}
    if oran >= ikinci:
        yeni_tavan = SINIFLAR[max(i(bas), i(tavan) - 1)]
        return bas, yeni_tavan, {
            "bant": ikinci, "oran": round(oran),
            "not": "Aylık bütçenin %%%d'i kullanıldı (%%%d eşiği): en üst sınıf bu ay için "
                   "kısıtlandı." % (round(oran), ikinci)}
    return bas, tavan, None


def merdiven(con, cfg, rol, seviye=None):
    """Denenecek basamaklar: [{sinif, atama, ayar}]. Cagri yapmaz."""
    a = models.resolve(cfg, rol)
    paket = models.paket_of(cfg)
    pseviye = politika_seviyesi(rol, seviye) if rol in models.ROLES else None
    kendi = bool(a and a.get("provider") and a.get("from") == rol)
    if kendi or not paket or not pseviye:
        # Elle secim ya da paketsiz kurulum: TEK basamak, eski davranis.
        h = _hazir_denetimi(a)
        if h:
            return dict(h, basamaklar=[], paket=paket, seviye=pseviye, ekonomi=None)
        # Paketsiz yol ESKI davranistir: cevap siniri degismez; yalniz atamada
        # efor secildiyse o gider (dusunme payiyla).
        ayar = {}
        if a.get("efor"):
            ayar = {"efor": a["efor"], "jeton": 1200 + DUSUNME_PAYI.get(a["efor"], 0)}
        return {"ok": True, "basamaklar": [{"sinif": None, "atama": a, "ayar": ayar}],
                "paket": paket, "seviye": pseviye, "ekonomi": None, "elle": kendi}
    bas, tavan, efor = _politika(paket, pseviye, rol, seviye)
    bas, tavan, ekonomi = _ekonomi(con, cfg, bas, tavan)
    tur = "ses" if pseviye == "ses" else ("gorsel" if pseviye == "gorsel" else "metin")
    yer = models.yer_of(cfg)
    yerel = models.yerel_of(cfg) if tur == "metin" else {}
    jeton = CEVAP_JETON.get(pseviye, 1200)
    siniflar = list(SINIFLAR[SINIFLAR.index(bas):SINIFLAR.index(tavan) + 1])
    ortak = {"paket": paket, "seviye": pseviye, "ekonomi": ekonomi, "elle": False, "yer": yer,
             "yer_notu": None}

    def yerel_basamak(s):
        return {"sinif": s, "atama": {
            "role": rol, "from": None, "inherited": False, "provider": "yerel",
            "provider_label": models.PROVIDERS["yerel"]["label"], "model": yerel[s], "efor": "",
            "key_id": "", "key_label": "", "key_user": models.VARSAYILAN_SAHIP,
            "key_missing": False, "key_set": True, "chain": [rol]},
            # Yerel model efor bilmez; bedeli sifirdir.
            "ayar": {"jeton": jeton}}

    if yer == "yerel":
        if tur != "metin":
            return dict(ortak, ok=False, reason="no-model", basamaklar=[],
                        note="Yerel modda görsel ve ses okunmaz; bunlar için hibrit ya da bulut seç.")
        if not yerel:
            return dict(ortak, ok=False, reason="no-model", basamaklar=[],
                        note="Yerel modda çalışmak için bir yerel model adı gir (Ayarlar → Yapay zekâ).")
        secili = [yerel_basamak(s) for s in siniflar if s in yerel]
        if not secili:
            # Istenen sinif yerelde yok: en ust yerel model kullanilir ve SOYLENIR.
            ust = [s for s in models.YEREL_SINIFLAR if s in yerel][-1]
            secili = [yerel_basamak(ust)]
            ortak["yer_notu"] = ("Yerel modda en üst sınıf %s; bu istek normalde %s sınıfla "
                                 "başlardı." % (SINIF_ADI[ust], SINIF_ADI[bas]))
        return dict(ortak, ok=True, basamaklar=secili)

    saglayici = "google" if tur == "ses" else "openrouter"
    liste = models.key_list(cfg, saglayici)
    basamaklar = []
    for s in siniflar:
        if yer == "hibrit" and s in yerel:
            basamaklar.append(yerel_basamak(s))
            continue
        if not liste:
            continue
        e = liste[0]
        m = SINIF_MODELI[tur][s]
        atama = {"role": rol, "from": None, "inherited": False, "provider": saglayici,
                 "provider_label": models.PROVIDERS[saglayici]["label"], "model": m,
                 "efor": efor or "", "key_id": e["id"], "key_label": e.get("label", ""),
                 "key_user": e.get("user") or models.VARSAYILAN_SAHIP, "key_missing": False,
                 "key_set": bool(e.get("key")), "chain": [rol]}
        basamaklar.append({"sinif": s, "atama": atama, "ayar": {
            "efor": efor, "jeton": jeton + DUSUNME_PAYI.get(efor, 0)}})
    if not basamaklar:
        return dict(ortak, ok=False, reason="no-key", basamaklar=[],
                    note=("Ses ve video yalnız Google (Gemini) anahtarıyla çalışır; "
                          "«Sağlayıcılar» bölümüne bir Google anahtarı ekle.") if tur == "ses"
                    else "%s paketi OpenRouter anahtarıyla çalışır; «Sağlayıcılar» bölümüne ekle." % paket)
    return dict(ortak, ok=True, basamaklar=basamaklar)


# Anahtar reddi (401/403) ve bakiye yok (402) HESABIN sorunudur: ayni
# anahtarla ust basamak ayni hatayi alir, merdiven bosuna cikilmaz.
HESAP_HATASI = ("HTTP 401", "HTTP 402", "HTTP 403")


def zorlandi(r):
    """Bu basamak zorlandi mi — bir ust sinifa cikilmali mi."""
    if not r.get("ok"):
        if r.get("reason") == "provider" and any(h in (r.get("note") or "") for h in HESAP_HATASI):
            return False
        return r.get("reason") in ("dropped", "provider")
    return bool(r.get("truncated")) or YUKSELT in (r.get("text") or "")


def isaretsiz(metin):
    return (metin or "").replace(YUKSELT, "").strip()


# ------------------------------------------------------------ onizleme

def _olculen(con, bugun):
    """Son 30 gunun defteri: politika seviyesi basina [giris, cikis] jeton
    ve yukselme orani. Sohbet satirlari seviyesini notunda tasir."""
    if con is None:
        return None, None
    import datetime as _dt
    son = _dt.date.fromisoformat(bugun) if bugun else _dt.date.today()
    bas = (son - _dt.timedelta(days=29)).isoformat()
    toplam, n, yuk = {}, 0, 0
    for r in con.execute(
            "SELECT role, note, escalated, (in_tok + image_tok) AS g, (out_tok + reason_tok) AS c"
            " FROM usage WHERE day >= ? AND day <= ?", (bas, son.isoformat())):
        if r["role"] not in models.ROLES:
            continue
        not_ = str(r["note"] or "")
        sv = None
        for parca in not_.split(","):
            if parca.startswith("seviye="):
                sv = parca.split("=", 1)[1]
        ps = politika_seviyesi(r["role"], sv)
        if not ps:
            continue
        t = toplam.setdefault(ps, [0, 0])
        t[0] += r["g"] or 0
        t[1] += r["c"] or 0
        n += 1
        yuk += 1 if r["escalated"] else 0
    if not toplam:
        return None, None
    return toplam, (yuk / n if n else 0.0)


def _olcum_ozeti(con, bugun):
    """Son 30 gun: onbellekten okunan jeton, yukselen cagri, harcamanin ne
    kadari saglayicinin OLCTUGU bedel (tahmin degil)."""
    if con is None:
        return None
    import datetime as _dt
    son = _dt.date.fromisoformat(bugun) if bugun else _dt.date.today()
    bas = (son - _dt.timedelta(days=29)).isoformat()
    r = con.execute(
        "SELECT COUNT(*) n, COALESCE(SUM(cached_tok),0) onb, COALESCE(SUM(escalated),0) yuk,"
        " COALESCE(SUM(usd),0) usd,"
        " COALESCE(SUM(CASE WHEN note LIKE '%olculen-bedel%' THEN usd ELSE 0 END),0) olculen"
        " FROM usage WHERE day >= ? AND day <= ?", (bas, son.isoformat())).fetchone()
    if not r["n"]:
        return None
    return {"cagri": r["n"], "onbellek_jeton": int(r["onb"]), "yukselen": int(r["yuk"]),
            "usd": round(r["usd"], 4), "olculen_usd": round(r["olculen"], 4)}


def _yerel_mi(yer, yerel, tur, sinif):
    """True: bu basamak yerelde; False: bulutta; None: bu yerde calismaz."""
    if tur == "metin" and yer in ("yerel", "hibrit") and sinif in yerel:
        return True
    return None if yer == "yerel" else False


def onizleme(cfg, con=None, bugun=None):
    """Dort paketin onizlemesi ve aylik tahmin. Hicbir sey yazmaz."""
    from core import ai, tarife
    kullanim, yukselme = _olculen(con, bugun)
    aktif = models.paket_of(cfg)
    yer, yerel = models.yer_of(cfg), models.yerel_of(cfg)
    or_var = bool(models.key_list(cfg, "openrouter"))
    google_var = bool(models.key_list(cfg, "google"))
    out = []
    for pid in models.PAKET_KIMLIKLERI:
        satirlar = []
        for ps in POLITIKA_SEVIYELERI:
            bas, tavan, efor = PAKET_POLITIKASI[pid][ps]
            tur = "ses" if ps == "ses" else ("gorsel" if ps == "gorsel" else "metin")
            basamak = []
            for sn in SINIFLAR[SINIFLAR.index(bas):SINIFLAR.index(tavan) + 1]:
                yerde = _yerel_mi(yer, yerel, tur, sn)
                if yerde is None:
                    continue                     # yerel modda bulut basamagi yok
                if yerde:
                    basamak.append({"sinif": sn, "sinif_adi": SINIF_ADI[sn], "model": yerel[sn],
                                    "fiyat": [0.0, 0.0], "fiyat_kaynagi": "yerel", "yerel": True})
                    continue
                m = SINIF_MODELI[tur][sn]
                b = tarife.bilgi(models.saglayici_of(m), m)
                basamak.append({"sinif": sn, "sinif_adi": SINIF_ADI[sn], "model": m,
                                "fiyat": b["fiyat"], "fiyat_kaynagi": b["kaynak"]})
            satirlar.append({"seviye": ps, "efor": efor, "basamaklar": basamak})
        aylik = None
        if kullanim:
            usd = 0.0
            for ps, (g, c) in kullanim.items():
                bas, tavan, efor = PAKET_POLITIKASI[pid][ps]
                tur = "ses" if ps == "ses" else ("gorsel" if ps == "gorsel" else "metin")
                i0 = SINIFLAR.index(bas)
                i1 = min(i0 + 1, SINIFLAR.index(tavan))
                for i, pay in ((i0, 1.0 - yukselme), (i1, yukselme)):
                    if _yerel_mi(yer, yerel, tur, SINIFLAR[i]) is not False:
                        continue                 # yerelde calisan basamagin bedeli sifir
                    m = SINIF_MODELI[tur][SINIFLAR[i]]
                    fg, fc = ai.tarife_of(models.saglayici_of(m), m) or ai.BILINMEYEN_FIYAT
                    usd += pay * (g / 1e6 * fg + c / 1e6 * fc)
            aylik = round(usd, 2)
        out.append({"id": pid, "ad": PAKET_ADI[pid], "satirlar": satirlar, "aylik": aylik})
    eksik = []
    if not or_var:
        eksik.append("Paketler OpenRouter anahtarıyla çalışır; «Sağlayıcılar» bölümüne ekle.")
    if not google_var:
        eksik.append("Ses ve video yalnız Google (Gemini) anahtarıyla çalışır.")
    olcum = _olcum_ozeti(con, bugun)
    return {"paketler": out, "aktif": aktif, "tarife": tarife.durum(), "eksik": eksik,
            "olcum": olcum,
            "yer": yer, "yerel": yerel, "yerel_adres": models.yerel_kok(cfg),
            "yukselme_orani": None if yukselme is None else round(yukselme, 3),
            "olcum_notu": "" if kullanim else
            "Son 30 günde ölçülmüş kullanım yok; aylık tahmin ilk kullanımdan sonra hesaplanır."}


# ------------------------------------------------------- motor servisi

SINIF_YERI = {"ayni_makine": "aynı makine (localhost; veri makineden çıkmaz)",
              "yerel_ag": "yerel ağ", "internet": "internet (https)"}


def dugum_durumu(cfg, transport=None):
    """Sunucu motor servisinden HABERDAR olur: ulasilabilir mi, gecikme,
    modeller, ayni makine mi. Cagri yapmaz, para harcamaz (model listesi)."""
    import time
    kok = models.yerel_kok(cfg)
    _, _, sinif = models.adres_denetle(kok)
    t0 = time.monotonic()
    r = models.probe(cfg, "yerel", transport=transport, timeout=5)
    gecikme = round((time.monotonic() - t0) * 1000)
    yer = models.yer_of(cfg)
    yerel = models.yerel_of(cfg)
    liste = r.get("models") or []
    if r.get("ok"):
        eksik = [ad for ad in yerel.values() if liste and ad not in liste]
        not_ = ("Motor servisi cevap verdi." if not eksik else
                "Motor cevap verdi ama şu model sunucuda yok: %s" % ", ".join(eksik))
    else:
        # Genel sinama cumlesi («internet baglantisini kontrol et») yerel
        # motor icin yaniltir: sorun cogu zaman servisin kapali olmasidir.
        not_ = ("Motor servisine ulaşılamadı (%s): servis çalışıyor mu, adres doğru mu? " % kok
                + ("Hibritte işler buluta geçer." if yer == "hibrit" else
                   "Yerel modda model çağrıları yapılamaz; sistem kural motoruyla sürer."
                   if yer == "yerel" else ""))
    return {"adres": kok, "sinif": sinif, "sinif_adi": SINIF_YERI.get(sinif, ""),
            "ulasilabilir": bool(r.get("ok")), "gecikme_ms": gecikme, "modeller": liste,
            "yerel_model_var": bool(yerel), "yer": yer, "not": not_.strip()}


# ------------------------------------------------ BAM: maliyet onizlemesi

# Gecmis BAM isi yoksa is basina VARSAYILAN jeton profili (TAHMIN):
# sorgu kurma kucuk, kaynak okuyup yazma buyuk. Ilk olculen isten sonra
# yerini olcum alir.
BAM_PROFIL = {"alt": (3000, 500), "arastirma": (25000, 4000)}


def _bam_profili(con):
    """Is basina ortalama (seviye -> [giris, cikis]) ve olculen is sayisi."""
    if con is None:
        return None, 0
    isler = {}
    for r in con.execute("SELECT is_id, role, note, (in_tok + image_tok) g, (out_tok + reason_tok) c"
                         " FROM usage WHERE is_id IS NOT NULL AND role LIKE 'bam%'"):
        sv = "alt" if "seviye=alt" in str(r["note"] or "") else politika_seviyesi(r["role"])
        if not sv:
            continue
        t = isler.setdefault(r["is_id"], {}).setdefault(sv, [0, 0])
        t[0] += r["g"] or 0
        t[1] += r["c"] or 0
    if not isler:
        return None, 0
    ort = {}
    for d in isler.values():
        for sv, (g, c) in d.items():
            o = ort.setdefault(sv, [0, 0])
            o[0] += g / len(isler)
            o[1] += c / len(isler)
    return ort, len(isler)


def bam_tahmin(cfg, con=None, rol="bam.arastirma"):
    """Her BAM eforu icin is basina ortalama maliyet — is BASLAMADAN.
    Olculen isler varsa «hesaplandi», yoksa «tahmin»."""
    from core import ai
    profil, n = _bam_profili(con)
    etiket = "hesaplandi" if profil else "tahmin"
    profil = profil or {k: list(v) for k, v in BAM_PROFIL.items()}
    paket = models.paket_of(cfg)
    _, yukselme = _olculen(con, None) if con is not None else (None, None)
    yukselme = yukselme or 0.0
    yer, yerel = models.yer_of(cfg), models.yerel_of(cfg)
    out = []
    for e in BAM_EFORLARI:
        usd = 0.0
        siniflar = {}
        with efor_baglami(e):
            for sv, (g, c) in profil.items():
                if paket:
                    bas, tavan, _ = _politika(paket, sv, rol, "alt" if sv == "alt" else None)
                    i0 = SINIFLAR.index(bas)
                    i1 = min(i0 + 1, SINIFLAR.index(tavan))
                    siniflar[sv] = SINIF_ADI[bas]
                    for i, pay in ((i0, 1.0 - yukselme), (i1, yukselme)):
                        if _yerel_mi(yer, yerel, "metin", SINIFLAR[i]) is not False:
                            continue
                        m = SINIF_MODELI["metin"][SINIFLAR[i]]
                        fg, fc = ai.tarife_of(models.saglayici_of(m), m) or ai.BILINMEYEN_FIYAT
                        usd += pay * (g / 1e6 * fg + c / 1e6 * fc)
                else:
                    a = models.resolve(cfg, rol) or {}
                    fg, fc = (ai.tarife_of(a.get("provider"), a.get("model") or "")
                              or ai.BILINMEYEN_FIYAT) if a.get("provider") != "yerel" else (0, 0)
                    usd += g / 1e6 * fg + c / 1e6 * fc
        out.append({"efor": e, "ad": BAM_EFOR_ADI[e], "usd": round(usd, 4), "etiket": etiket,
                    "siniflar": siniflar})
    return {"secenekler": out, "is_sayisi": n, "paket": paket,
            "not": "" if paket else "Efor, bir güç paketi seçiliyken merdiveni değiştirir; "
                                    "şu an bütün seçenekler aynı modelle çalışır."}
