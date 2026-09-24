# -*- coding: utf-8 -*-
"""King'in teklifi — isin buyuklugu, bedeli ve suresi ONCEDEN.
   (ekip/DEVIR.md Part 8a)

   Kullanici ne isterse istesin King, is BAM'da acilmadan once uc seyi
   soyler: isin yogunluk sinifi, tahmini maliyeti ve tahmini suresi. Sonra
   en cok uc secenek sunar (tam · kucuk · parca parca) ve durumuna gore
   birini onerir. Karar kullanicinindir.

   Bes kural:

   1. SINIFI KOD VERIR. Olcu «is birimi»dir: tahmini model cagrisi ve web
      istegi. Esikler TEK tabloda (SINIFLAR); model sinif soylemez.
   2. MALIYET OLCUMDEN. Once ayni tur ve sinifta biten islerin OLCULEN
      maliyeti (usage.is_id, core/butce.py is_maliyeti): en az uc is varsa
      ortanca ve p90. Yoksa olculen cagri basina ortanca x tahmini cagri.
      O da yoksa jeton tahmini x modelin tarifesi. Uc yolun her biri
      «tahmin» etiketlidir ve dayanagini yazar. Model atanmamissa maliyet
      UYDURULMAZ: «hesaplanamadi» denir.
   3. BUTCEDEN PAYI SOYLENIR: aylik tavanin yuzde kaci, ne kalir.
   4. SECENEKLER GENEL KURALLA: tur basina bir «kucultucu» (KUCULT). Yeni
      bir is turu tek satirla katilir; akis degismez.
   5. ONERI KODDAN: tam secenek butceye sigmiyorsa ya da tavanin dortte
      birinden fazlasini yiyorsa kucuk secenek onerilir; gerekcesi yazilir."""
import datetime
import json
import statistics

from core import ai, butce, kaynakli, models

SINIFLAR = (
    # (ad, en cok model cagrisi, web izni)
    ("dusuk", 3, False),
    ("orta", 10, True),
    ("yuksek", 40, True),
    ("ekstra", None, True),
)
SINIF_AD = {"dusuk": "düşük", "orta": "orta", "yuksek": "yüksek", "ekstra": "ekstra"}
GECMIS_EN_AZ = 3
CAGRI_GECMIS_EN_AZ = 5
# Tarife yolunda bir cagrinin jeton tahmini (giris, cikis). Olcum
# biriktikce bu yol kullanilmaz.
JETON = (2000, 1500)
PAY_ESIGI = 25          # tavanin yuzde kacindan fazlasi «buyuk» sayilir

# Arastirma adimi: plan + yazar + dogrulayici (+ bazen derin tur) ve web.
ARASTIRMA = {"model": 4, "web": 8}


def _arastirma_var(ofisler):
    return "arastirma" in (ofisler or [])


def birim(tur, govde, ofisler):
    """Is birimi: tahmini model cagrisi ve web istegi. Koddan sayilir
    (bam.py'deki cagri yerleri); dayanagi yazilir."""
    g = govde or {}
    m, w, parca = 0, 0, []
    if tur == "spi.bilgi":
        # Sorgular kuralla (model yok): 2 arama + en cok MAX_KAYNAK okuma, 1 yazim.
        return {"model": 1, "web": 2 + kaynakli.MAX_KAYNAK, "etiket": "tahmin",
                "dayanak": "kurallı 2 arama + en çok %d sayfa okuma; yazım 1 çağrı"
                           % kaynakli.MAX_KAYNAK}
    if _arastirma_var(ofisler):
        m += ARASTIRMA["model"]
        w += ARASTIRMA["web"]
        parca.append("araştırma ~%d çağrı + ~%d web isteği" % (ARASTIRMA["model"],
                                                               ARASTIRMA["web"]))
    if tur == "test.kitabi":
        n = len((g.get("kitap") or {}).get("bolumler") or [])
        m += 2 * n
        parca.append("%d bölüm × 2 çağrı (üretim + bağımsız çözüm)" % n)
    elif tur in ("bam.urun",):
        m += 1
        parca.append("üretim 1 çağrı")
    elif tur == "esp.unite" and (g.get("unite") or {}).get("alan") == "gitar":
        m += 1
        parca.append("üretim 1 çağrı; tempo, ton ve derece kodla süzülür")
    elif tur == "esp.unite":
        m += 2
        parca.append("üretim 1 çağrı + bağımsız yargı 1 çağrı")
    elif tur in ("bam.plan",):
        m += 1
        parca.append("Hedef Analisti 1 çağrı")
    elif tur == "hedef.plan":
        parca.append("kural motoru; model yok")
    return {"model": m, "web": w, "etiket": "tahmin", "dayanak": "; ".join(parca) or "—"}


def sinif(b):
    for ad, en_cok, web in SINIFLAR:
        if en_cok is None or (b["model"] <= en_cok and (web or not b["web"])):
            return ad
    return "ekstra"


def _yuzdelik(xs, p):
    s = sorted(xs)
    if not s:
        return None
    k = max(0, min(len(s) - 1, int(round((len(s) - 1) * p))))
    return s[k]


def _usd(x):
    if x is None:
        return "—"
    if x < 0.01:
        return ("%.4f USD" % x).replace(".", ",")
    return ("%.2f USD" % x).replace(".", ",")


def _rol(ofisler):
    for o in ("uretim", "arastirma", "planlama"):
        if o in (ofisler or []):
            return "bam." + o
    return None


def maliyet(con, cfg, tur, sinif_, b, ofisler):
    """{usd, usd_p90, metin, etiket, dayanak}. Once olcum."""
    if b["model"] == 0:
        return {"usd": 0.0, "usd_p90": 0.0, "etiket": "hesaplandi", "metin": "ücretsiz",
                "dayanak": "model çağrısı yok (kural motoru)"}
    gecmis = []
    for r in con.execute("SELECT teklif, sonuc FROM is_emirleri WHERE tur=? AND durum='bitti' "
                         "AND sonuc IS NOT NULL ORDER BY id DESC LIMIT 50", (tur,)):
        try:
            t = json.loads(r["teklif"] or "null") or {}
            s = json.loads(r["sonuc"] or "null") or {}
        except ValueError:
            continue
        m = s.get("maliyet") or {}
        if t.get("sinif") == sinif_ and m.get("cagri"):
            gecmis.append(float(m.get("usd") or 0))
    if len(gecmis) >= GECMIS_EN_AZ:
        orta, p90 = statistics.median(gecmis), _yuzdelik(gecmis, 0.9)
        return {"usd": round(orta, 6), "usd_p90": round(p90, 6), "etiket": "tahmin",
                "metin": "~%s (çoğu iş %s altında)" % (_usd(orta), _usd(p90)),
                "dayanak": "aynı tür ve sınıfta biten son %d işin ölçülen maliyeti (ortanca, p90)"
                           % len(gecmis)}
    cagri = [r[0] for r in con.execute(
        "SELECT usd FROM usage WHERE is_id IS NOT NULL AND ok=1 ORDER BY id DESC LIMIT 200")]
    if len(cagri) >= CAGRI_GECMIS_EN_AZ:
        tek = statistics.median(cagri)
        usd = tek * b["model"]
        return {"usd": round(usd, 6), "usd_p90": round(_yuzdelik(cagri, 0.9) * b["model"], 6),
                "etiket": "tahmin", "metin": "~%s" % _usd(usd),
                "dayanak": "ölçülen çağrı başına ortanca (%d çağrı) × ~%d çağrı"
                           % (len(cagri), b["model"])}
    rol = _rol(ofisler)
    a = models.resolve(cfg, rol) if rol else None
    if not a or not a.get("provider") or not a.get("model"):
        return {"usd": None, "usd_p90": None, "etiket": "veri_yok",
                "metin": "hesaplanamadı",
                "dayanak": "bu işe model atanmamış ve ölçülmüş iş yok"}
    tek = ai._fiyat(a["provider"], a["model"], JETON[0], JETON[1])
    usd = tek * b["model"]
    bilinir = ai.fiyat_bilinir(a["provider"], a["model"])
    return {"usd": round(usd, 6), "usd_p90": round(usd * 2, 6), "etiket": "tahmin",
            "metin": "~%s" % _usd(usd),
            "dayanak": "jeton tahmini (%d giriş + %d çıkış) × ~%d çağrı × %s tarifesi%s"
                       % (JETON[0], JETON[1], b["model"], a["model"],
                          "" if bilinir else " (tarife bilinmiyor; taban fiyat)")}


def butce_payi(con, cfg, m):
    """Aylik tavandan pay. Tavan yoksa soylenir, uydurulmaz."""
    usd = m.get("usd")
    if usd is None:
        return {"pay_yuzde": None, "sigar": None, "metin": None}
    if usd == 0:
        return {"pay_yuzde": 0, "sigar": True, "metin": "Bütçeden bir şey harcamaz."}
    d = butce.month(con, cfg)
    tavan = d.get("ceiling") or 0
    if not tavan:
        return {"pay_yuzde": None, "sigar": None,
                "metin": "Aylık bütçe tavanı tanımlı değil; payı söylenemez."}
    tutar = m["usd"] if d["currency"] == "usd" else (
        m["usd"] * float(d.get("rate") or 0) if d.get("rate") else None)
    if tutar is None:
        return {"pay_yuzde": None, "sigar": None,
                "metin": "Tavan TL ama kur girilmemiş; payı söylenemez."}
    kalan = max(0.0, tavan - float(d.get("spent") or 0))
    pay = int(round(100.0 * tutar / tavan))
    # Turkce ek sayiya gore degisir («%5’i», «%10’u»); ek kullanmayan kalip.
    return {"pay_yuzde": pay, "sigar": tutar <= kalan,
            "metin": "bütçe payı %s (bu ay kalan %s %s)." % (
                "%1’den az" if pay < 1 else "%%%d" % pay,
                ("%.2f" % kalan).replace(".", ","), d.get("currency_label") or "")}


# ------------------------------------------------------------ secenekler
#
# Tur basina secenekler: {id: (govde) -> (yeni govde, ad) ya da None}.
# Yeni bir is turu ya da secenek tek satirla katilir; akis degismez.

def _kitap_kucuk(g):
    k = dict(g.get("kitap") or {})
    if len(k.get("bolumler") or []) < 2:
        return None
    k["bolumler"] = k["bolumler"][:1]
    return dict(g, kitap=k), "yalnız 1. bölüm (fasikül)"


def _kitap_parca(g):
    """Parca parca: ayni kitap, her bolumden sonra durur ve onay bekler
    (bam.py `_kitap_adimi`, ara_onay). Maliyet kontrolde kalir."""
    if len((g.get("kitap") or {}).get("bolumler") or []) < 2:
        return None
    return dict(g, parcali=True), "bölüm bölüm, her bölümden sonra onayınla"


def _kaynaksiz(anahtar):
    def f(g):
        x = dict(g.get(anahtar) or {})
        if not x.get("kaynakli"):
            return None
        x["kaynakli"] = False
        return dict(g, **{anahtar: x}), "kaynaksız (etiketi «doğrulanmadı» olur)"
    return f


SECENEK = {
    "test.kitabi": {"kucuk": _kitap_kucuk, "parca": _kitap_parca},
    "bam.urun": {"kucuk": _kaynaksiz("urun")},
    "bam.plan": {"kucuk": _kaynaksiz("program")},
}
# Geriye uyum: tek kucultucu soran eski cagrilar.
KUCULT = {t: d["kucuk"] for t, d in SECENEK.items() if "kucuk" in d}


def uygula(tur, secenek, govde):
    """Secenegin govdesi: (govde, ad) ya da None. «tam» govdeyi degistirmez."""
    if secenek == "tam":
        return govde, "tam"
    f = (SECENEK.get(tur) or {}).get(secenek)
    return f(govde) if f else None


def _hesap(con, cfg, tur, govde, ofisler_of, tahmini_sure):
    of = ofisler_of(tur, govde)
    b = birim(tur, govde, of)
    s = sinif(b)
    m = maliyet(con, cfg, tur, s, b, of)
    # Kitap her tikte BIR bolum uretir: ek bolumler ek tik demektir.
    ek = max(0, len((govde.get("kitap") or {}).get("bolumler") or []) - 1) \
        if tur == "test.kitabi" else 0
    sure = tahmini_sure(con, of, ek_adim=ek)
    return {"sinif": s, "sinif_ad": SINIF_AD[s], "birim": b, "maliyet": m, "sure": sure,
            "butce": butce_payi(con, cfg, m)}


def kur(con, cfg, tur, govde, ofisler_of, tahmini_sure):
    """Teklif: tam secenek + (varsa) kucuk secenek + oneri ve cumle."""
    tam = dict(_hesap(con, cfg, tur, govde, ofisler_of, tahmini_sure), id="tam",
               ad="tam", govde=govde)
    secenekler = [tam]
    for sid, f in (SECENEK.get(tur) or {}).items():
        r = f(govde)
        if not r:
            continue
        h = _hesap(con, cfg, tur, r[0], ofisler_of, tahmini_sure)
        if sid == "parca":
            # Parca parca TAM kitaptir; farki her bolumde durmasidir. Sinif ve
            # maliyet tam secenegin aynisidir, bolum basina pay soylenir.
            n = len((govde.get("kitap") or {}).get("bolumler") or []) or 1
            h = dict(tam, butce=tam["butce"])
            if tam["maliyet"].get("usd") is not None:
                h["maliyet"] = dict(tam["maliyet"], metin="%s (bölüm başı ~%s)" % (
                    tam["maliyet"]["metin"], _usd(tam["maliyet"]["usd"] / n)))
        secenekler.append(dict(h, id=sid, ad=r[1], govde=r[0]))
    ids = [x["id"] for x in secenekler]
    oneri, neden = "tam", None
    b = tam["butce"]
    if "kucuk" in ids and b.get("sigar") is False:
        oneri, neden = "kucuk", "tam seçenek bu ayın kalan bütçesine sığmıyor"
    elif "kucuk" in ids and (b.get("pay_yuzde") or 0) > PAY_ESIGI:
        oneri, neden = "kucuk", ("tam seçenek aylık bütçenin %%%d’inden fazlasını harcar"
                                 % PAY_ESIGI)
    elif "parca" in ids and tam["sinif"] in ("yuksek", "ekstra"):
        oneri, neden = "parca", ("%s sınıf bir iş: ilk bölümü görüp devam edersin, maliyet "
                                 "kontrolde kalır" % tam["sinif_ad"])
    return {"sinif": tam["sinif"], "secenekler": secenekler, "oneri": oneri, "neden": neden,
            "metin": metin(secenekler, oneri, neden)}


# ------------------------------------------------------------ once depo
#
# Fikir 46: ayni konuda depoda bir kayit varsa King'in teklifinde EN USTTE
# durur: bedava ve hemen. Yeterince yeniyse onerilir. Guncelligi bu
# teklifte DENETLENMEZ ve bu soylenir; «tam» secenek yine Depolama
# Burosu'ndan gecer ve kaynaklari acar (bam depo_aday).
DEPO_TAZE_GUN = 90


def _gun_farki(a, b):
    try:
        return max(0, (datetime.datetime.fromisoformat(str(b)[:19])
                       - datetime.datetime.fromisoformat(str(a)[:19])).days)
    except (TypeError, ValueError):
        return None


def yas_metni(gun):
    if gun is None:
        return "tarihi bilinmiyor"
    if gun == 0:
        return "bugün yapıldı"
    if gun < 31:
        return "%d gün önce yapıldı" % gun
    if gun < 365:
        return "%d ay önce yapıldı" % max(1, gun // 30)
    return "%d yıl önce yapıldı" % (gun // 365)


def depo_secenegi(t, kayit, simdi):
    """Teklifin en ustune depodaki kaydi koyar; oneriyi ve cumleyi yeniden kurar."""
    gun = _gun_farki(kayit.get("created_at"), simdi)
    yas = yas_metni(gun)
    s = {"id": "depo", "ad": "depodaki kayıt (%s)" % yas, "sinif": "dusuk",
         "sinif_ad": SINIF_AD["dusuk"], "kayit_id": kayit["id"],
         "birim": {"model": 0, "web": 0, "etiket": "hesaplandi", "dayanak": "depodan"},
         "maliyet": {"usd": 0.0, "usd_p90": 0.0, "etiket": "hesaplandi", "metin": "ücretsiz",
                     "dayanak": "depodaki kayıt #%d yeniden kullanılır" % kayit["id"]},
         "sure": {"sn": 0, "etiket": "hesaplandi", "metin": "hemen", "dayanak": "depodan"},
         "butce": {"pay_yuzde": 0, "sigar": True, "metin": "Bütçeden bir şey harcamaz."}}
    t["secenekler"] = [s] + [x for x in t["secenekler"] if x["id"] != "depo"]
    if gun is not None and gun <= DEPO_TAZE_GUN:
        t["oneri"] = "depo"
        t["neden"] = ("aynı konu %s; bedava ve hemen gelir (güncelliği bu teklifte "
                      "denetlenmedi, «tam» seçenek kaynaklarını açar)" % yas)
    t["metin"] = metin(t["secenekler"], t["oneri"], t["neden"])
    return t


def secenek_metni(s):
    p = ["%s: %s sınıf" % (s["ad"], s["sinif_ad"]),
         "maliyet %s" % s["maliyet"]["metin"],
         "süre %s" % s["sure"]["metin"]]
    if s["butce"].get("metin") and s["maliyet"].get("usd"):
        p.append(s["butce"]["metin"].rstrip("."))
    return " · ".join(p)


def metin(secenekler, oneri, neden):
    """Kullaniciya giden cumle. Sayilar koddan; etiket: tahmin."""
    p = ["%d) %s" % (i + 1, secenek_metni(s)) for i, s in enumerate(secenekler)]
    t = "Teklif (tahmin): " + " | ".join(p) + "."
    if neden:
        t += " Önerim: %s — %s." % (next(s["ad"] for s in secenekler if s["id"] == oneri), neden)
    return t


def ozet(t):
    """Is emrine yazilan teklif: secenek govdeleri SUNUCUDA kalir, ekrana
    ve bildirime yalniz sayi ve cumle gider."""
    if not t:
        return None
    return {"sinif": t["sinif"], "oneri": t["oneri"], "neden": t["neden"], "metin": t["metin"],
            "secenekler": [{k: v for k, v in s.items() if k != "govde"}
                           for s in t["secenekler"]]}


def olculen(m):
    """Biten isin olculen maliyetine cumle ekler (yuz sayi uretmez)."""
    m = dict(m or {})
    m["metin"] = ("%s · %d çağrı (%s)" % (_usd(m.get("usd") or 0.0), m.get("cagri") or 0,
                                         "ölçüldü" if m.get("etiket") == "olculdu" else
                                         "tahmin: tarifesi bilinmeyen model")
                  if m.get("cagri") else "model çağrısı yapılmadı")
    return m
