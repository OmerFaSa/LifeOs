# -*- coding: utf-8 -*-
"""King'in ekibi — dort alt ajan (King 3.0, K1).

   HKM'de uc alt patron var (vp_academic, vp_bio, vp_intellect) ve BAM;
   King bir isi onlardan birine DEVREDER, ajan kendi rolunun modeliyle ve
   kendi modulunun verisiyle calisir, King'e KISA RAPOR doner.

     akademik     AYS  · vp_academic   soru, calisma suresi, net, sinav
     beden        SPİ  · vp_bio        uyku, toparlanma, hareket, beslenme
     zihin        ESP  · vp_intellect  dil, kitap, kalicilik, pratik
     arastirmaci  BAM  · bam.arastirma web ve YouTube (core/arastir.py)

   Dort kural:

   1. DEVRI KOD YAPAR. Niyet → ajan eslemesi kelime kuralidir (`sec`).
      Kural karar veremezse model YALNIZ SECER: kapali listeden bir ad
      yazar, kod dogrular (`sec_modelle`); listede olmayan ad yok sayilir.
   2. AJAN YALNIZ KENDI ALANINI GORUR. Baglam o gorevlinin kural motoru
      ozetidir (core/sohbet.py baglam) ve o gorevliye izinli hafizadir.
   3. SAYIYI KOD URETIR. Rapor olcum hakkindaysa cevaptaki sayi baglamla
      denetlenir (core/ai.py); model yoksa rapor kural motorunun
      satirlaridir — ajan susmaz, «model yok» der.
   4. AJAN YAZMAZ. Raporda bir degisiklik onerilebilir; uygulanmaz."""
import datetime
import re
import time

from core import ai, is_kuyrugu, memory, models

AJANLAR = {
    "akademik": {"ad": "Akademik", "rol": "vp_academic", "modul": "ays", "gorevli": "academic",
                 "is": "AYS: soru, çalışma süresi, net ve sınav hazırlığı."},
    "beden": {"ad": "Beden", "rol": "vp_bio", "modul": "spi", "gorevli": "bio",
              "is": "SPİ: uyku, toparlanma, hareket ve beslenme."},
    "zihin": {"ad": "Zihin", "rol": "vp_intellect", "modul": "esp", "gorevli": "intellect",
              "is": "ESP: dil, kitap, kalıcılık ve pratik."},
    "arastirmaci": {"ad": "Araştırmacı", "rol": "bam.arastirma", "modul": None, "gorevli": None,
                    "is": "BAM: web’de ve YouTube’da kaynaklı araştırma."},
}
MODUL_AJAN = {"ays": "akademik", "spi": "beden", "esp": "zihin"}
MODUL_AD = {"ays": "AYS", "spi": "SPİ", "esp": "ESP"}

# Niyet kurallari. Her eslesme bir puan; esitlikte karar verilmez (sorulur
# ya da model secer). Kelime koku: Turkce ekler (-e, -de, -den) serbest.
KURAL = {
    "akademik": re.compile(
        r"\b(ays|tyt|ayt|yks|lgs|kpss|deneme|net(?:ler|im)?\b|soru çöz|konu tekrar|matematik|fizik|kimya|"
        r"biyoloji|geometri|türev|integral|limit|coğrafya|tarih dersi|edebiyat|ders çalış|sınav)", re.I),
    "beden": re.compile(
        r"\b(spi|spİ|uyku|uyu(?:dum|yorum|mak)|spor|antrenman|egzersiz|koşu|yürüyüş|kilo|beslenme|öğün|"
        r"diyet|protein|kalori|nabız|hrv|toparlan|sağlık|kas|esneme|su iç)", re.I),
    "zihin": re.compile(
        r"\b(esp|[abc][12]\b|ielts|toefl|yds|ydt|ingilizce|almanca|fransızca|ispanyolca|italyanca|"
        r"japonca|korece|rusça|arapça|dil\b|dilbilgisi|gramer|kelime|telaffuz|kitap|okuma|roman|"
        r"felsefe|yazar)", re.I),
}
ARASTIR = re.compile(r"(araştır|internette|internetten|web['’]?de|webde|kaynak bul|video bul|"
                     r"youtube|ne diyor kaynaklar)", re.I)

RAPOR_SISTEM = """Sen King'in ekibindeki %(ad)s ajanısın. Alanın: %(is)s
King sana bir iş verdi; sonucu King'e KISA bir raporla dönersin (en çok %(cumle)d cümle, düz Türkçe).
Kurallar: yalnız aşağıdaki bağlamdaki ölçülere dayan; bağlamda olmayan sayıyı yazma; ölçülmemişse
«ölçülmedi» de. Kayıt ekleyemez, plan değiştiremezsin; gerekiyorsa son satıra «Öneri: …» yaz.
%(sinir)s
BAĞLAM (kural motoru):
%(baglam)s"""
SINIR = {"ays": "Sonuç garantisi verme.", "spi": "Teşhis koyma, ilaç ya da doz önerme.",
         "esp": "Sertifika ya da yetenek yargısı verme."}
SEC_SISTEM = ("Kullanıcının isteğini hangi ajan yapmalı? Yalnız şu adlardan BİRİNİ yaz, başka hiçbir şey "
              "yazma: akademik (AYS: sınav, ders, soru), beden (SPİ: uyku, spor, beslenme), zihin (ESP: "
              "dil, kitap), arastirmaci (web araştırması). Emin değilsen «bilinmiyor» yaz.")
EN_COK_RAPOR = 900


def _bugun(now=None):
    return (now[:10] if now else datetime.date.today().isoformat())


def puanlar(metin):
    m = str(metin or "")
    return {a: len(r.findall(m)) for a, r in KURAL.items()}


def sec(metin, arastirma=True):
    """Kod kurali: ajanin adi ya da None (belirsiz)."""
    if arastirma and ARASTIR.search(str(metin or "")):
        return "arastirmaci"
    p = puanlar(metin)
    en = max(p.values())
    if not en:
        return None
    adaylar = [a for a, n in p.items() if n == en]
    return adaylar[0] if len(adaylar) == 1 else None


def sec_modelle(con, cfg, metin, arastirma=True, transport=None, now=None):
    """Kural karar veremediyse model SECER; kod dogrular. Doner: (ajan|None, not)."""
    a = sec(metin, arastirma)
    if a:
        return a, "kural"
    if not ai.hazir_mi(cfg, "king")["ok"]:
        return None, "model yok"
    r = ai.ask(con, cfg, "king", "ekip.sec", [{"role": "user", "content": str(metin)[:400]}],
               sistem=SEC_SISTEM, transport=transport, duzeltme=False, jeton=20)
    if not r.get("ok"):
        return None, r.get("note") or "model cevap vermedi"
    for kelime in re.findall(r"[a-zçğıöşü]+", (r.get("text") or "").lower()):
        if kelime in AJANLAR and (arastirma or kelime != "arastirmaci"):
            return kelime, "model"
    return None, "model seçemedi"


def katalog(cfg):
    """Ekran icin: ajanlar, rolleri ve modelleri hazir mi."""
    out = []
    for k, a in AJANLAR.items():
        h = ai.hazir_mi(cfg, a["rol"])
        m = models.resolve(cfg, a["rol"]) or {}
        out.append({"id": k, "ad": a["ad"], "is": a["is"], "modul": a["modul"], "rol": a["rol"],
                    "model": m.get("model") or None, "hazir": bool(h.get("ok")),
                    "not": None if h.get("ok") else h.get("note")})
    return out


def baglam(con, ajan, date, istek="", ek=""):
    """Ajanin gorecegi tek gercek: kendi alaninin kural motoru ozeti, kendi
    modulunun hedef ozetleri ve ona izinli hafiza."""
    from core import hedefag, sohbet       # sohbet -> arac ... ; dongu burada kirilir
    a = AJANLAR[ajan]
    satir = [sohbet.baglam(con, date, a["gorevli"], kisa=True)]
    hedefler = [h for h in hedefag.hedefler(con) if h.get("modul") == a["modul"] and h.get("durum") == "aktif"]
    for h in hedefler[:4]:
        k = h.get("kapasite") or {}
        satir.append("- %s hedefi: %s%s%s" % (
            MODUL_AD[a["modul"]], h.get("ozet"),
            (", son tarih %s" % h["son_tarih"]) if h.get("son_tarih") else "",
            (", günde %d dk (hedefin kendi planı)" % k["gunluk_dk"]) if k.get("gunluk_dk") else ""))
    hf = memory.context(con, scope=a["gorevli"], limit=5, ilgili=istek or None)
    if hf:
        satir += ["Kullanıcının hafızası (bu alana izinli):", hf]
    if ek:
        satir.append(ek)
    return "\n".join(x for x in satir if x)


def _kural_raporu(bg, note):
    # «Hiçbir modülden ölçüm yok … söyle» satiri modele talimattir; kullaniciya gitmez.
    olcu = [l[2:] for l in bg.splitlines() if l.startswith("- ") and not l.startswith("- Hiçbir modülden")][:4]
    govde = " ".join(olcu) if olcu else "Bu alanda bugün ölçüm yok."
    return "%s (Model çalışmadı: %s; rapor kural motorunun satırlarıdır.)" % (govde, note or "bilinmiyor")


def calistir(con, cfg, ajan, istek, date=None, ek="", cumle=4, denetim="olcum", ilerle=None,
             iptal_mi=None, transport=None, tasiyici=None, now=None):
    """Alt ajanin isi. Doner: rapor {ajan, ad, ozet, dayanak, model, kaynaklar, saniye, note}."""
    if ajan not in AJANLAR:
        raise ValueError("bilinmeyen ajan: %s" % ajan)
    a = AJANLAR[ajan]
    t0 = time.monotonic()
    ilerle = ilerle or (lambda *x, **y: None)
    date = date or _bugun(now)
    if ajan == "arastirmaci":
        from core import arastir
        h = arastir.hazir_mi(cfg)
        if not h["ok"]:
            return {"ajan": ajan, "ad": a["ad"], "ozet": "Araştırma yapılamadı: %s" % (h.get("note") or "hazır değil"),
                    "dayanak": "yok", "model": None, "kaynaklar": [], "saniye": 0, "note": h.get("note")}
        ilerle(10, "Web’de ve YouTube’da kaynak arıyor")
        r = arastir.yap(con, cfg, istek, transport=transport, tasiyici=tasiyici)
        if not r.get("ok"):
            return {"ajan": ajan, "ad": a["ad"], "ozet": r.get("note") or "Kaynak bulunamadı.",
                    "dayanak": "yok", "model": None, "kaynaklar": [],
                    "saniye": round(time.monotonic() - t0, 1), "note": r.get("model_notu")}
        kaynak = [{"baslik": k.get("baslik"), "url": k.get("url"), "tur": k.get("tur")}
                  for k in (r.get("kaynaklar") or [])[:6]]
        return {"ajan": ajan, "ad": a["ad"], "ozet": (r.get("text") or "")[:EN_COK_RAPOR * 2],
                "dayanak": "kaynak", "model": None, "kaynaklar": kaynak,
                "saniye": round(time.monotonic() - t0, 1), "note": r.get("model_notu")}
    ilerle(15, "%s verisine bakıyor" % MODUL_AD[a["modul"]])
    bg = baglam(con, ajan, date, istek, ek)
    if iptal_mi and iptal_mi():
        return {"ajan": ajan, "ad": a["ad"], "ozet": "", "dayanak": "iptal", "model": None,
                "kaynaklar": [], "saniye": 0, "note": "iptal"}
    ilerle(40, "Rapor yazıyor")
    sistem = RAPOR_SISTEM % {"ad": a["ad"], "is": a["is"], "cumle": cumle,
                             "sinir": SINIR[a["modul"]], "baglam": bg}
    r = ai.ask(con, cfg, a["rol"], "ekip.%s" % ajan, [{"role": "user", "content": str(istek)[:800]}],
               baglam=bg, sistem=sistem, transport=transport, denetim=denetim,
               jeton=500, veri={a["gorevli"], "ekip"})
    if r.get("ok") and (r.get("text") or "").strip():
        # Kucuk model «**Rapor**» basligi koyar; rapor zaten rapordur.
        metin = re.sub(r"^\s*\*\*[^*\n]{1,40}\*\*\s*\n+", "", r["text"].strip()).replace("**", "")
        ozet, dayanak, note = metin.strip()[:EN_COK_RAPOR], "model", None
    else:
        ozet, dayanak, note = _kural_raporu(bg, r.get("note")), "kural", r.get("note")
    return {"ajan": ajan, "ad": a["ad"], "ozet": ozet, "dayanak": dayanak, "model": r.get("model"),
            "kaynaklar": [], "saniye": round(time.monotonic() - t0, 1), "note": note,
            "etiket": "öneri (doğrulanmadı)" if denetim == "belge" else None}


def devret(con, cfg, istek, ajan=None, kaynak="api", kanal=None, transport=None, now=None):
    """Isi kuyruga koyar. Ajan verilmemisse kod secer, olmazsa model secer.
    Doner: {ok, is, secim} ya da {ok:False, soru}."""
    istek = " ".join(str(istek or "").split())
    if len(istek) < 3:
        return {"ok": False, "error": "istek boş", "soru": "Ekibe ne yaptırayım? Bir cümleyle yaz."}
    secim = "verildi"
    if ajan is None:
        ajan, secim = sec_modelle(con, cfg, istek, transport=transport, now=now)
    if ajan not in AJANLAR:
        return {"ok": False, "error": "ajan seçilemedi", "secim": secim,
                "soru": "Bu işi hangi alana vereyim: AYS (akademik), SPİ (beden), ESP (zihin) ya da araştırma?"}
    i = is_kuyrugu.baslat(con, ajan, "devir", istek[:120],
                          {"istek": istek, "kaynak": kaynak, "kanal": kanal}, now=now)
    return {"ok": True, "is": i, "secim": secim}
