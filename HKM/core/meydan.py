# -*- coding: utf-8 -*-
"""Meydan — sistemin kendi akisi (ekip/meydan/MEYDAN.md, M1 + M2).

   Masalar (King, BAM ve uc modulun HKM gorevlisi) gunun bulgularini,
   kararlarini ve urunlerini GONDERI olarak yazar; kullanici okur, karar
   verir, yanit yazar, ogrendigini tekrar eder. Dili sosyal medyanin dilidir
   (hesap, hikaye, akis, profil, yanit, kaydet) ama meydanda baska insan
   yoktur, begeni sayisi yoktur ve akis bir yerde biter.

   Bes kural:

   1. HICBIR SEY UYDURULMAZ. Her gonderi ambardaki bir OLAYDAN turer:
      modulun gunluk govdesi ve VP denetimi, Yoneticinin onerisi, King'in
      is emri, BAM kaydi (rapor, gorsel, ders, kart, soru, gitar), ESP'nin
      sectigi dil karti, hedef agi. Olay yoksa gonderi yoktur; kaydi gelmeyen
      modul «veri yok» diye ADIYLA soylenir.
   2. CUMLEYI VE SAYIYI KOD KURAR. Bu dosya model cagirmaz; model kapaliyken
      Meydan aynen calisir. Her sayi dort etiketten birini tasir; eksik sayi
      «veri yok» cipidir, sifir yazilmaz. Egilim (30 gun) core/twin.py'nin
      ortanca kuralidir. Akor adi ve sesi dereceden KODLA cozulur. Sayfa
      hicbir sey hesaplamaz. Yanita cevabi Danisma'nin gorevlisi verir
      (daemon -> core/sohbet.py); burada yalniz kaydi tutulur.
   3. MODULE YAZILMAZ (AGENTS §1.4). Meydan'in durumu (tekrar destesi,
      isaretler, yanitlar, notlar) HKM'nin KENDI tablolarindadir. Deste
      ESP'nin kart takvimini degistirmez; oneri dugmesi Onaylar'in AYNI
      isleyicisidir (manager.respond). Not bir kayit olmaz, not olarak durur.
   4. TUR KATALOGU KAPALIDIR (TURLER). Yeni tur kodla eklenir; model tur,
      hesap ya da seviye uyduramaz. «Seviye» yalniz kaydin kendi alanindan
      gelir (unite ve gitar duzeyi, ESP'nin secimi, sorunun beyan edilen
      zorlugu) ve kaynagini yazar; bir yetenek yargisi degildir (§1.5).
   5. ETKILESIM KARAR VERMEZ. «Faydali» yalniz senin siranı degistirir
      (+10); okuma suresi, tiklama ve izlenme OLCULMEZ. Tekrar araliklari
      koddadir (1 · 3 · 7 · 14 · 30 gun). XP, seri, puan uretilmez (§1.6).
"""

import datetime
import json
import re

from core import adlar, bam, certainty, db, hedefag, king, precedence, saat, sync_engine, twin

TURLER = ("teklif", "bulgu", "karar", "ozet", "hedef", "urun", "kart", "sinav", "muzik", "not")
TUR_AD = {"teklif": "Teklif", "bulgu": "Bulgu", "karar": "Karar", "ozet": "Günün raporu",
          "hedef": "Hedef", "urun": "Ürün", "kart": "Kart", "sinav": "Mini sınav",
          "muzik": "Müzik", "not": "Not"}
# Onem sirasi (MEYDAN §5.4). Senden karar bekleyen +50, uyari +5, Faydali +10.
ONEM = {"teklif": 100, "sinav": 80, "bulgu": 70, "karar": 60, "kart": 55, "ozet": 50,
        "muzik": 45, "hedef": 40, "urun": 30, "not": 20}
KAPSAMLAR = ("hepsi", "ays", "spi", "esp", "merkez")
# Hesap basina gunluk sinir: asan KATLANIR, silinmez. Senden karar bekleyen
# hicbir duzeyde katlanmaz ve gizlenmez.
DUZEYLER = {"sade": 1, "dengeli": 3, "tam": 9}
SADE_TURLER = ("teklif", "karar", "bulgu", "not")
ARALIK = (1, 3, 7, 14, 30)
DERECELER = ("tekrar", "zor", "iyi", "kolay")
# Ad elle yazilir: str.capitalize() «iyi»yi «Iyi» yapar (Turkce İ).
DERECE_AD = {"tekrar": "Tekrar", "zor": "Zor", "iyi": "İyi", "kolay": "Kolay"}
URUN_GUN = 7          # BAM urunu bir hafta akista kalir
EGILIM_GUN = 30
NOT_EN_COK = 280
YANIT_EN_COK = 400
KART_EN_COK = 120

MODUL_AD = {"ays": "AYS", "spi": "SPİ", "esp": "ESP", "merkez": "Merkez"}
VP_MODUL = {"academic": "ays", "bio": "spi", "intellect": "esp"}
MODUL_VP = {v: k for k, v in VP_MODUL.items()}
# Yanita kim cevap verir: Danisma'nin gorevlisi (core/sohbet.py). BAM'in
# ustu King'dir; «Sen» notuna yanit yazilmaz.
YANIT_GOREVLI = {"king": "king", "bam": "king", "academic": "academic", "bio": "bio",
                 "intellect": "intellect"}

# Hesaplar HKM'de VAR OLAN gorevlilerdir (core/sohbet.py GOREVLILER, BAM).
HESAPLAR = {
    "king": {"ad": "King", "modul": "merkez", "bas": "K",
             "rol": "Üç sistemi birlikte değerlendirir; teklif yazar, modüle yazmaz."},
    "bam": {"ad": "BAM", "modul": "merkez", "bas": "B",
            "rol": "Araştırma ve üretim bürosu: rapor, görsel, ders, kart, soru, gitar."},
    "academic": {"ad": "Akademik hedef", "modul": "ays", "bas": "A",
                 "rol": "AYS'nin HKM görevlisi: soru, süre, net. Sonuç garantisi vermez."},
    "bio": {"ad": "Biyolojik sermaye", "modul": "spi", "bas": "B",
            "rol": "SPİ'nin HKM görevlisi: uyku, toparlanma. Teşhis koymaz, doz önermez."},
    "intellect": {"ad": "Entelektüel gelişim", "modul": "esp", "bas": "E",
                  "rol": "ESP'nin HKM görevlisi: kalıcılık, pratik. Yetenek yargısı kurmaz."},
    "sen": {"ad": "Sen", "modul": None, "bas": "S", "rol": ""},
}

# Rapor gonderisinde hangi olcumler once gelir. Listede olmayan anahtar
# rapora girmez (adi bilinmeyen alan uydurulmus bir adla gosterilmez).
OZET_SIRA = {
    "ays": ("questions", "study_minutes", "mock_net", "plan_adherence", "correct_ratio",
            "exam_days_left", "errors_open", "topics_done"),
    "spi": ("sleep_hours", "recovery", "hrv", "steps", "training_minutes", "train_minutes",
            "protein_g", "water_ml", "water"),
    "esp": ("practice_minutes", "reading_minutes", "cards_done", "cards_due", "retention",
            "sessions", "synthesis_gap_days"),
}
# Sosyal gorunumlu bir akista gosterilmeyen alanlar (MEYDAN §5.5): tahlil,
# beden olculeri, semptom. Modulun kendi ekraninda dururlar. XP alanlari da
# yoktur: seviye yalniz gorunurluktur ve bu akis bir yaris degildir.
GIZLI = {"sbp", "dbp", "weight", "waist", "symptom_count", "resting_hr", "rhr"}

DOGRULUK_AD = {"kaynakli": "kaynaklı", "dogrulanmadi": "doğrulanmadı",
               "celiskili": "çelişkili"}
KING_DURUM_AD = {"onaylandi": "onaylandı", "kismen_onay": "kısmen onaylandı",
                 "basladi": "başladı", "ara_onay": "ara onay bekliyor",
                 "bekliyor": "bekliyor", "bitti": "bitti", "kismen": "kısmen bitti",
                 "reddedildi": "reddedildi", "iptal": "iptal edildi", "hata": "hata verdi"}
DIL_KODU = {"en": "en-US", "de": "de-DE", "fr": "fr-FR", "es": "es-ES", "ar": "ar-SA",
            "ru": "ru-RU", "it": "it-IT"}     # Latince icin ses motoru yok: ses sunulmaz
DIL_AD = {"en": "İngilizce", "de": "Almanca", "fr": "Fransızca", "es": "İspanyolca",
          "ar": "Arapça", "ru": "Rusça", "it": "İtalyanca", "la": "Latince"}
HARFLER = "ABCDE"
# Ekranda makine anahtari yazilmaz (AGENTS §1.8): oneri kurali oncelik
# tablosunun KENDI Turkce adiyla, denetim hukmu Turkce karsiligiyla.
KURAL = {x["key"]: x for x in precedence.PRECEDENCE}
HUKUM_AD = {"APPROVED": "sorun yok", "INCOMPLETE": "eksik alan var", "ANOMALY": "eşik aşıldı"}
AYLAR = ("Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos",
         "Eylül", "Ekim", "Kasım", "Aralık")

# Akor cozumu (gitar): ton + derece -> akor adi ve sesleri. Kural, model yok.
NOTALAR = ("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")
# Bemolle gelen derece (bVII, bIII) bemol adiyla yazilir: C’de bVII «Bb»dir, «A#» degil.
NOTALAR_B = ("C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B")
MAJOR = (0, 2, 4, 5, 7, 9, 11)
MINOR = (0, 2, 3, 5, 7, 8, 10)
ROMEN = {"i": 0, "ii": 1, "iii": 2, "iv": 3, "v": 4, "vi": 5, "vii": 6}
_DERECE = re.compile(r"^(b?)(VII|VI|V|IV|III|II|I|vii|vi|v|iv|iii|ii|i)(°|7|maj7|m7|sus4)?$")


# ------------------------------------------------------------ yardimcilar

def _an(now=None):
    if isinstance(now, datetime.datetime):
        return now.replace(microsecond=0)
    if now:
        try:
            return datetime.datetime.fromisoformat(str(now)).replace(microsecond=0)
        except ValueError:
            pass
    return saat.simdi().replace(microsecond=0)


def _iso(dt):
    return dt.isoformat(timespec="seconds")


def _metin(x, en_cok):
    s = re.sub(r"\s+", " ", str(x or "")).strip()
    return s[:en_cok]


def _kisalt(x, en_cok):
    """Cumleyi sozcuk ortasinda kesmez; kesilirse «…» ile biter."""
    s = _metin(x, 100000)
    if len(s) <= en_cok:
        return s
    kes = s[:en_cok].rsplit(" ", 1)[0].rstrip(",;:")
    return kes + "…"


def _tr_kucuk(s):
    return str(s or "").translate(str.maketrans({"I": "ı", "İ": "i"})).lower()


def sayi_yaz(v):
    """Sayiyi Turkce yazar: 7.25 -> «7,3», 12345 -> «12.345». Sayi degilse
    oldugu gibi. Deger DEGISMEZ; yalniz yazimi."""
    if isinstance(v, bool):
        return str(v)
    if isinstance(v, int):
        return "{:,}".format(v).replace(",", ".")
    if isinstance(v, float):
        if v.is_integer():
            return sayi_yaz(int(v))
        return ("%.1f" % v).replace(".", ",")
    return str(v)


def _kesinlik(cert):
    return certainty.EKRAN.get(cert, "veri yok")


def tarih_yaz(gun):
    try:
        d = datetime.date.fromisoformat(str(gun)[:10])
    except ValueError:
        return str(gun)
    return "%d %s" % (d.day, AYLAR[d.month - 1])


def ne_zaman(z, now=None):
    """«şimdi», «12 dk önce», «3 sa önce», «dün 21:40», «24 Eylül»."""
    an, s = _an(now), str(z or "")
    if len(s) <= 10:
        fark = (an.date() - datetime.date.fromisoformat(s)).days if re.match(r"^\d{4}-\d\d-\d\d$", s) else None
        return {0: "bugün", 1: "dün"}.get(fark, tarih_yaz(s))
    try:
        t = datetime.datetime.fromisoformat(s)
    except ValueError:
        return s
    sn = (an - t).total_seconds()
    if 0 <= sn < 60:
        return "şimdi"
    if 0 <= sn < 3600:
        return "%d dk önce" % (sn // 60)
    if t.date() == an.date() and sn >= 0:
        return "%d sa önce" % (sn // 3600)
    if (an.date() - t.date()).days == 1:
        return "dün %s" % t.strftime("%H:%M")
    return tarih_yaz(s)


def sonra_yaz(vade, now=None):
    """«bugün», «yarın», «3 gün sonra» — kodun cumlesi."""
    an = _an(now)
    try:
        v = datetime.datetime.fromisoformat(vade)
    except (TypeError, ValueError):
        return "—"
    if v <= an:
        return "şimdi"
    dk = int((v - an).total_seconds() // 60)
    if dk < 60:
        return "%d dakika sonra" % max(1, dk)
    g = (v.date() - an.date()).days
    if g <= 0:
        return "bugün"
    if g == 1:
        return "yarın"
    return "%d gün sonra" % g


def akor_coz(ton, derece):
    """Ton (C … B, minorse sonunda «m») + derece (I, vi, bVII, V7 …) ->
    {ad, derece, hz}. Cozulmezse None: tahmin edilmez."""
    m = _DERECE.match(str(derece or "").strip())
    ton = str(ton or "").strip()
    if not m or not ton:
        return None
    minor = len(ton) > 1 and ton.endswith("m")
    kok = ton[:-1] if minor else ton
    if kok not in NOTALAR:
        return None
    duz, romen, ek = m.group(1), m.group(2), m.group(3) or ""
    olcek = MINOR if minor else MAJOR
    pc = (NOTALAR.index(kok) + olcek[ROMEN[romen.lower()]] - (1 if duz else 0)) % 12
    buyuk = romen.isupper()
    if ek == "°":
        araliklar, ad_ek = (0, 3, 6), "°"
    elif ek == "sus4":
        araliklar, ad_ek = (0, 5, 7), "sus4"
    elif ek == "m7":
        araliklar, ad_ek = (0, 3, 7, 10), "m7"
    elif ek == "maj7":
        araliklar, ad_ek = (0, 4, 7, 11), "maj7"
    elif ek == "7":
        araliklar, ad_ek = ((0, 4, 7, 10), "7") if buyuk else ((0, 3, 7, 10), "m7")
    else:
        araliklar, ad_ek = ((0, 4, 7), "") if buyuk else ((0, 3, 7), "m")
    kok_midi = 48 + pc                                   # C3 ile B3 arasi kok
    hz = [round(440.0 * 2 ** ((kok_midi + a - 69) / 12.0), 2) for a in araliklar]
    return {"ad": (NOTALAR_B if duz else NOTALAR)[pc] + ad_ek, "derece": m.group(0), "hz": hz}


def _gonderi(id_, hesap, tur, zaman, cumle, ilgili=None, **ek):
    assert tur in TURLER, tur
    g = {"id": id_, "hesap": hesap, "tur": tur, "tur_ad": TUR_AD[tur], "zaman": zaman,
         "baslik": "", "cumle": cumle, "ilgili": list(ilgili or [HESAPLAR[hesap]["modul"]]),
         "sayilar": [], "bulgular": [], "bekliyor": False, "uyari": False}
    g.update(ek)
    return g


# ------------------------------------------------------------ olay -> gonderi

def _egilim(resim, modul, anahtar):
    """30 gunluk egilim (core/twin.py ortanca kurali) ya da None."""
    t = (((resim.get("modules") or {}).get(modul) or {}).get("metrics") or {}).get(anahtar)
    t = (t or {}).get("trend") or {}
    if t.get("direction") in ("rising", "falling") and t.get("change") is not None:
        return "%s %%%d · %d gün" % ("↑" if t["direction"] == "rising" else "↓",
                                    round(abs(t["change"]) * 100), EGILIM_GUN)
    if t.get("direction") == "flat":
        return "yatay · %d gün" % EGILIM_GUN
    return None


def _ilgili_oneri(con, gun, vp):
    """VP'nin alanindaki gunun onerisi: bulgu ile teklif ayni yerde gorunur."""
    for d in db.decisions_of(con, gun):
        if (KURAL.get(d.get("key")) or {}).get("vp") == vp:
            return {"id": "oneri-%d" % d["id"], "etiket": "İlgili öneri", "metin": _kisalt(d["proposal"], 140),
                    "durum": {"proposed": "karar bekliyor", "accepted": "kabul edildi",
                              "declined": "reddedildi"}.get(d["state"], d["state"])}
    return None


def _raporlar(con, gun):
    """Modul basina GUNDE TEK rapor: olcumler (30 gunluk egilimle), VP'nin
    bulgulari ve ilgili oneri ayni gonderide. Ayni sayi iki gonderide yazilmaz."""
    out = []
    govdeler = db.latest_payloads(con, gun)
    denetim = sync_engine.latest_audits(con, gun)
    resim = twin.snapshot(con, gun, EGILIM_GUN) if govdeler else {}
    for modul in ("ays", "spi", "esp"):
        vp, b = MODUL_VP[modul], govdeler.get(modul)
        if not b:
            continue
        a = denetim.get(vp) or {}
        m = b.get("metrics") or {}
        sayilar, eksik = [], None
        for k in OZET_SIRA[modul]:
            f = m.get(k)
            if not isinstance(f, dict) or k in GIZLI:
                continue
            if f.get("cert") == "missing" or f.get("value") is None:
                if eksik is None:
                    eksik = ["—", adlar.METRIK.get(k, k), "veri yok"]
                continue
            if len(sayilar) < 4:
                s = [sayi_yaz(f["value"]), adlar.METRIK.get(k, k), _kesinlik(f.get("cert"))]
                e = _egilim(resim, modul, k)
                if e:
                    s.append(e)
                sayilar.append(s)
        if eksik and len(sayilar) < 5:
            sayilar.append(eksik)
        gelen = sum(1 for f in m.values() if isinstance(f, dict) and f.get("cert") != "missing")
        bos = sum(1 for f in m.values() if isinstance(f, dict) and f.get("cert") == "missing")
        bulgular = [{"metin": _metin(f.get("text"), 300),
                     "ton": "uyari" if f.get("tone") in ("warn", "danger") else "bilgi"}
                    for f in a.get("findings") or [] if f.get("text")]
        uyari = any(x["ton"] == "uyari" for x in bulgular)
        cumle = "%s bugünün kaydı: %d ölçüm" % (MODUL_AD[modul], gelen)
        cumle += ("; %d alan boş, sıfır sayılmadı." % bos) if bos else "."
        if a.get("verdict") == "APPROVED":
            cumle += " Denetimde sorun yok."
        # En agir bulgu BASLIKTIR; listede ikinci kez yazilmaz.
        baslik = next((x["metin"] for x in bulgular if x["ton"] == "uyari"),
                      "%s · günün raporu" % MODUL_AD[modul])
        bulgular = [x for x in bulgular if x["metin"] != baslik]
        out.append(_gonderi("ozet-%s-%s" % (modul, gun), vp, "bulgu" if uyari else "ozet", gun,
                            cumle, baslik=baslik, sayilar=sayilar, bulgular=bulgular, uyari=uyari,
                            baglanti=_ilgili_oneri(con, gun, vp),
                            kaynak={"olay": "modülün günlük kaydı ve VP denetimi",
                                    "kural": "denetim: " + HUKUM_AD.get(a.get("verdict"), "yapılmadı"),
                                    "egilim": "son %d günün ortancası, öncekilere göre (hesaplandı)"
                                              % EGILIM_GUN}))
    return out


def _oneriler(con, gun):
    """Yoneticinin onerisi. Bekleyen oneri TEKLIF'tir ve karari Onaylar'in
    ayni isleyicisiyle verilir; cevaplanan KARAR'dir ve silinmez."""
    out = []
    for d in db.decisions_of(con, gun):
        kural = KURAL.get(d.get("key")) or {}
        vp = kural.get("vp")
        ilgili = [VP_MODUL[vp]] if vp in VP_MODUL else ["ays", "spi", "esp"]
        kural_ad = kural.get("label") or "günün önceliği"
        if d["state"] == "proposed":
            # Serit zaten «senden karar bekliyor» der: baslik onerinin kendisidir.
            out.append(_gonderi("oneri-%d" % d["id"], "king", "teklif", d["created_at"],
                                "Kaynak: %s. Karar Onaylar’dakiyle aynıdır; reddedilen öneri "
                                "silinmez." % kural_ad, ilgili=ilgili,
                                baslik=_metin(d["proposal"], 400),
                                bekliyor=True, seviye_aksiyon="orta", vp=vp,
                                eylem={"tur": "oneri", "id": d["id"]},
                                kaynak={"olay": "günün brifingi", "kural": kural_ad}))
        else:
            ad = "Kabul edildi" if d["state"] == "accepted" else "Reddedildi; silinmedi"
            out.append(_gonderi("oneri-%d" % d["id"], "king", "karar",
                                d.get("answered_at") or d["created_at"],
                                _metin(d["proposal"], 380), ilgili=ilgili, baslik=ad, vp=vp,
                                kaynak={"olay": "senin cevabın", "kural": kural_ad}))
    return out


def _teklif_sayilari(e):
    t = e.get("teklif") or {}
    sec = t.get("secenekler") or []
    s = next((x for x in sec if x.get("id") == t.get("oneri")), sec[0] if sec else None)
    if not s:
        return [], None
    out = []
    ml = s.get("maliyet") or {}
    if ml.get("metin"):
        out.append([ml["metin"], "maliyet", _kesinlik({"hesaplandi": "computed"}.get(
            ml.get("etiket"), "estimated"))])
    su = s.get("sure") or {}
    if su.get("metin"):
        out.append([su["metin"], "süre", "tahmin"])
    if s.get("sinif_ad"):
        out.append([s["sinif_ad"], "sınıf", "hesaplandı"])
    return out, _kisalt(t.get("metin"), 280) or None


def _is_turu(tur):
    """«test.kitabi» -> «test kitabı» gibi okunur ad; bilinmeyen bicim korunur."""
    t = str(tur or "").replace(".", " ").replace("_", " ").strip()
    return {"test kitabi": "test kitabı", "hedef plan": "hedef planı", "urun add": "ürün",
            "unite": "dil ünitesi", "gitar": "gitar paketi"}.get(t, t) or "iş"


def _emirler(con, gun):
    out = []
    for e in king.emirler(con, limit=40):
        if str(e.get("updated_at") or "")[:10] != gun and str(e.get("created_at") or "")[:10] != gun:
            continue
        mod = e.get("modul") if e.get("modul") in MODUL_AD else "merkez"
        konu = _metin(e.get("konu") or e.get("tur"), 160)
        if e["durum"] == "teklif":
            sayilar, teklif_metin = _teklif_sayilari(e)
            out.append(_gonderi("emir-%d" % e["id"], "king", "teklif", e["updated_at"],
                                "%s için iş teklifi onayını bekliyor." % MODUL_AD[mod],
                                baslik=konu, ilgili=[mod], bekliyor=True, seviye_aksiyon="orta",
                                sayilar=sayilar, ek_metin=teklif_metin,
                                eylem={"tur": "emir", "id": e["id"]},
                                kaynak={"olay": "King iş emri", "kural": "iş türü: " + _is_turu(e.get("tur"))}))
        else:
            ad = KING_DURUM_AD.get(e["durum"], e["durum"])
            out.append(_gonderi("emir-%d" % e["id"], "king", "karar", e["updated_at"],
                                "%s için iş %s." % (MODUL_AD[mod], ad), baslik=konu, ilgili=[mod],
                                kaynak={"olay": "King iş emri", "kural": "iş türü: " + _is_turu(e.get("tur"))}))
    return out


def _soru_listesi(g):
    """BAM kaydindaki sorular (soru seti ya da test kitabi), duz liste."""
    if g.get("tur") == "soru":
        return [s for s in g.get("maddeler") or [] if isinstance(s, dict)]
    if g.get("tur") == "kitap":
        out = []
        for b in g.get("bolumler") or []:
            out.extend(s for s in b.get("sorular") or [] if isinstance(s, dict))
        return out
    return []


def _kart_listesi(g):
    """BAM kaydindaki on/arka ogeler: [(on, arka, aciklama, dil)]."""
    t = g.get("tur")
    if t == "kart":
        return [(m.get("on"), m.get("arka"), "", None) for m in g.get("maddeler") or []]
    if t == "unite":
        out = []
        for u in g.get("uniteler") or []:
            for o in u.get("ogeler") or []:
                out.append((o.get("on"), o.get("arka"), "", g.get("dil")))
        return out
    if t == "alistirma":
        return [("%s — %s" % (m.get("yonerge"), m.get("madde")), m.get("cevap"), "", None)
                for m in g.get("maddeler") or []]
    return [(s.get("soru"), "%s) %s" % (s.get("dogru"), _secenek(s, s.get("dogru"))),
             s.get("cozum") or "", None) for s in _soru_listesi(g)]


def _secenek(s, harf):
    sec = s.get("secenekler") or []
    i = HARFLER.find(str(harf or "")[:1].upper())
    return sec[i] if 0 <= i < len(sec) else ""


def _bam_kayitlari(con, gun):
    bas = (datetime.date.fromisoformat(gun) - datetime.timedelta(days=URUN_GUN - 1)).isoformat()
    return con.execute(
        "SELECT k.id FROM bam_kayitlar k WHERE substr(k.created_at,1,10) BETWEEN ? AND ? "
        "AND NOT EXISTS (SELECT 1 FROM bam_kayitlar s WHERE s.onceki_id = k.id) "
        "ORDER BY k.id DESC LIMIT 30", (bas, gun)).fetchall()


def _hedef_modul(con, is_id):
    if not is_id:
        return "merkez"
    r = con.execute("SELECT hedef_modul FROM bam_isler WHERE id=?", (is_id,)).fetchone()
    return r["hedef_modul"] if r and r["hedef_modul"] in MODUL_AD else "merkez"


def _cevaplar(con, gid):
    out = {}
    for r in con.execute("SELECT tur, deger FROM meydan_isaret WHERE gonderi=? AND tur LIKE 'cevap:%'",
                         (gid,)).fetchall():
        try:
            out[int(r["tur"].split(":", 1)[1])] = int(r["deger"])
        except (ValueError, IndexError):
            continue
    return out


def _belge_ozeti(g):
    """Belgenin ilk anlamli paragrafi (ozet, alt baslik ya da ilk metin)."""
    for x in (g.get("ozet"), g.get("alt_baslik")):
        if x:
            return _kisalt(x, 260)
    for b in g.get("bolumler") or []:
        for bl in (b.get("bloklar") or []) if isinstance(b, dict) else []:
            if isinstance(bl, dict) and bl.get("t") == "p" and bl.get("metin"):
                return _kisalt(bl["metin"], 260)
    return None


def _muzik(g):
    """Gitar paketi -> calinabilir alistirmalar. Akor adini ve sesini KOD cozer."""
    out = []
    for x in (g.get("alistirmalar") or [])[:4]:
        akorlar = [a for a in (akor_coz(x.get("ton"), d) for d in x.get("ilerleyis") or []) if a]
        out.append({"ad": _metin(x.get("ad"), 80),
                    "tur": {"technique": "teknik", "piece": "parça"}.get(x.get("tur"), ""),
                    "ton": x.get("ton"), "akorlar": akorlar,
                    "bas_bpm": x.get("baslangic_bpm"), "hedef_bpm": x.get("hedef_bpm"),
                    "not": _metin(x.get("not"), 200) or None})
    return out


def _urunler(con, gun):
    """BAM kayitlari -> urun (rapor, gorsel, ders), kart, sinav ve muzik."""
    out = []
    for row in _bam_kayitlari(con, gun):
        k = bam.kayit_getir(con, row["id"])
        g = k.get("govde") or {}
        mod = _hedef_modul(con, k.get("is_id"))
        gid = "bam-%d" % k["id"]
        dog = DOGRULUK_AD.get(k.get("dogruluk"), "doğrulanmadı")
        kaynaklar = g.get("kaynaklar") or []
        ortak = {"ilgili": [mod], "kaynak": {"olay": "BAM kaydı #%d" % k["id"],
                                             "kural": "doğruluk: " + dog},
                 "dogruluk": dog, "kayit_id": k["id"],
                 "kaynak_sayisi": len(kaynaklar) if isinstance(kaynaklar, list) else 0}
        baslik = _metin(g.get("baslik") or k.get("baslik"), 160)
        sorular = _soru_listesi(g)
        kartlar = [x for x in _kart_listesi(g) if x[0] and x[1]] if g.get("tur") in (
            "kart", "unite", "alistirma") else []
        if g.get("tur") == "gitar" and g.get("alistirmalar"):
            al = _muzik(g)
            out.append(_gonderi(gid, "bam", "muzik", k["created_at"],
                                "%d alıştırma. Dinle, başlangıç temposunda çal; akıcılığı ESP "
                                "Stüdyo ölçer. Tempolar referanstır, senin ölçümün değildir."
                                % len(g["alistirmalar"]), baslik=baslik, alistirmalar=al,
                                seviye={"metin": g.get("duzey") or "—",
                                        "kaynak": "gitar paketinin düzeyi · ESP'nin isteği"},
                                **ortak))
        elif sorular:
            cev = _cevaplar(con, gid)
            sira = next((i for i in range(len(sorular)) if i not in cev), None)
            dogru = sum(1 for i, s in enumerate(sorular)
                        if i in cev and HARFLER[cev[i]] == str(s.get("dogru") or "")[:1].upper())
            sinav = {"toplam": len(sorular), "cozulen": len(cev), "dogru_sayi": dogru}
            if sira is None:
                cumle = "%d sorunun hepsini çözdün; %d doğru. Yanlışlar tekrar destende." % (
                    len(sorular), dogru)
                sinav["bitti"] = True
            else:
                s = sorular[sira]
                cumle = "Soru %d / %d. Seç; açıklama seçince açılır, yanlış olursa soru destene girer." % (
                    sira + 1, len(sorular))
                sinav.update({"no": sira, "soru": _metin(s.get("soru"), 600),
                              "secenekler": [_metin(x, 200) for x in (s.get("secenekler") or [])[:5]]})
                if s.get("zorluk") in ("kolay", "orta", "zor"):
                    sinav["seviye"] = {"metin": s["zorluk"], "kaynak": "sorunun beyan edilen zorluğu · tahmin"}
            out.append(_gonderi(gid, "bam", "sinav", k["created_at"], cumle, baslik=baslik, sinav=sinav,
                                sayilar=[[sayi_yaz(dogru), "doğru", "hesaplandı"],
                                         [sayi_yaz(len(cev)), "çözülen", "hesaplandı"]] if cev else [],
                                **ortak))
        elif kartlar:
            dil = kartlar[0][3]
            seviye = ({"metin": g["duzey"], "kaynak": "ünite düzeyi · ESP'nin isteği"}
                      if g.get("duzey") else None)
            cumle = "%d kart%s. Çevir, destene ekle; ne zaman döneceğine kod karar verir." % (
                len(kartlar), (" · " + DIL_AD[dil]) if dil in DIL_AD else "")
            out.append(_gonderi(gid, "bam", "kart", k["created_at"], cumle, baslik=baslik,
                                seviye=seviye,
                                kartlar=[{"on": _metin(a, KART_EN_COK), "arka": _metin(b, KART_EN_COK)}
                                         for a, b, _c, _d in kartlar[:3]],
                                kart_sayisi=len(kartlar), ses=DIL_KODU.get(dil), **ortak))
        else:
            ks = ortak["kaynak_sayisi"]
            ekler = []
            if g.get("tur") == "urun" and g.get("aile") == "gorsel":
                alt, cumle = "gorsel", "Görsel hazır. Yerleşim kodun; metni BAM yazdı."
            elif g.get("tur") == "urun" and g.get("aile") == "sunum":
                alt, cumle = "ders", "%d slaytlık ders. Yana kaydır." % len(g.get("slaytlar") or [])
            else:
                alt = "rapor"
                ad = _metin(g.get("urun_ad") or {"arastirma": "Araştırma", "plan": "Plan"}.get(
                    k.get("tur"), "Belge"), 40)
                bl = len(g.get("bulgular") or [])
                if ks:
                    ekler.append("%d kaynak" % ks)
                if bl:
                    ekler.append("%d bulgu" % bl)
                cumle = "%s hazır%s." % (ad, (": " + ", ".join(ekler)) if ekler else "")
            ek = {"alt": alt, "ozet": _belge_ozeti(g) if alt == "rapor" else None}
            if alt == "ders":
                ek["slaytlar"] = [{"baslik": _metin(s.get("baslik"), 120),
                                   "maddeler": [_metin(x, 200) for x in (s.get("maddeler") or [])[:6]]}
                                  for s in (g.get("slaytlar") or [])[:12]]
            out.append(_gonderi(gid, "bam", "urun", k["created_at"], cumle, baslik=baslik,
                                **dict(ortak, **ek)))
    return out


def _dil_karti(con, gun):
    r = hedefag.dilkart_oku(con, gun)
    if not r:
        return []
    return [_gonderi("dil-%s" % r["gun"], "intellect", "kart", r["gun"],
                     "Vadesi gelenler, yoksa en zayıflar. Destene eklersen Meydan'da da tekrar "
                     "edersin; ESP'nin takvimi değişmez.", baslik="ESP bugünün dil kartlarını seçti",
                     ilgili=["esp"], kartlar=r["kartlar"][:3], kart_sayisi=len(r["kartlar"]),
                     seviye={"metin": "ESP'nin seçimi", "kaynak": "ESP'nin kendi kart takvimi"},
                     kaynak={"olay": "ESP dil kartı", "kural": "ESP seçer, HKM yalnız dizer"})]


def _hedefler(con, gun):
    out = []
    for h in hedefag.hedefler(con):
        if str(h.get("guncelleme") or "")[:10] != gun or h.get("modul") not in MODUL_AD:
            continue
        plan = h.get("plan") or {}
        il = (plan.get("ilerleme") or {}).get("metin")
        cumle = _metin(il, 280) if il else "Hedefin planı güncellendi."
        if h.get("son_tarih"):
            cumle += " Son tarih: %s." % tarih_yaz(h["son_tarih"])
        out.append(_gonderi("hedef-%s-%s" % (h["modul"], h.get("id")), MODUL_VP[h["modul"]], "hedef",
                            h["guncelleme"], cumle, baslik=_metin(h.get("ozet"), 160),
                            ilgili=[h["modul"]],
                            kaynak={"olay": "hedef ağı", "kural": "modülün kendi planı"}))
    return out


def _notlar(con, gun):
    return [_gonderi("not-%d" % r["id"], "sen", "not", r["created_at"], r["metin"],
                     ilgili=[r["modul"]] if r["modul"] in MODUL_AD else ["merkez"],
                     kaynak={"olay": "senin notun", "kural": "not kayıt olmaz"})
            for r in con.execute("SELECT * FROM meydan_not WHERE gun=? AND silindi=0 ORDER BY id",
                                 (gun,)).fetchall()]


# ------------------------------------------------------------ akis

def _isaretler(con, tur):
    return {r["gonderi"] for r in con.execute(
        "SELECT gonderi FROM meydan_isaret WHERE tur=?", (tur,)).fetchall()}


def _yanit_haritasi(con, gidler, now=None):
    out = {}
    if not gidler:
        return out
    isaret = ",".join("?" * len(gidler))
    for r in con.execute("SELECT * FROM meydan_yanit WHERE gonderi IN (%s) ORDER BY id" % isaret,
                         tuple(gidler)).fetchall():
        out.setdefault(r["gonderi"], []).append(_yanit_satir(r, now))
    return out


def _hikayeler(gonderiler):
    """Hesap basina gunun ozeti: iki sayi karesi + bir cumle karesi.
    Kareler gonderilerden gelir; yeni bir sey soylemez."""
    out, sira = {}, []
    for g in gonderiler:
        if g["hesap"] == "sen" or g.get("katli"):
            continue
        h = out.get(g["hesap"])
        if h is None:
            h = out[g["hesap"]] = {"hesap": g["hesap"], "kareler": []}
            sira.append(g["hesap"])
        sayi = [s for s in g.get("sayilar") or [] if s[2] != "veri yok"]
        for s in sayi[:2]:
            if len(h["kareler"]) < 3:
                h["kareler"].append({"tur": "sayi", "deger": s[0], "ad": s[1], "kesinlik": s[2],
                                     "egilim": s[3] if len(s) > 3 else None, "gonderi": g["id"]})
        if len(h["kareler"]) < 3:
            h["kareler"].append({"tur": "cumle", "ust": g["baslik"] or g["tur_ad"],
                                 "metin": _kisalt(g["cumle"], 160), "gonderi": g["id"]})
    return [out[k] for k in sira]


def _gunun_ozeti(con, gun, liste, bekleyen, ds):
    govdeler = db.latest_payloads(con, gun)
    gelen = [MODUL_AD[m] for m in ("ays", "spi", "esp") if m in govdeler]
    gelmeyen = [MODUL_AD[m] for m in ("ays", "spi", "esp") if m not in govdeler]
    if gelen and not gelmeyen:
        cumle = "Üç sistemden de bugünün kaydı geldi."
    elif gelen:
        cumle = "%s kaydını gönderdi; %s’den bugün kayıt yok — sıfır sayılmadı." % (
            " ve ".join(gelen), " ve ".join(gelmeyen))
    else:
        cumle = "Bugün hiçbir sistemden kayıt gelmedi; sıfır sayılmadı."
    if bekleyen:
        cumle += " %d gönderi senden karar bekliyor." % bekleyen
    return {"cumle": cumle,
            "sayilar": [["%d / 3" % len(gelen), "kayıt geldi", "hesaplandı"],
                        [sayi_yaz(bekleyen), "karar bekliyor", "hesaplandı"],
                        [sayi_yaz(ds["vadeli"]), "tekrar", "hesaplandı"]],
            "gelen": gelen, "gelmeyen": gelmeyen}


def _uyar(g, kapsam, hesap, q):
    if hesap and g["hesap"] != hesap:
        return False
    if kapsam == "merkez" and g["hesap"] not in ("king", "bam"):
        return False
    if kapsam in ("ays", "spi", "esp") and kapsam not in g["ilgili"]:
        return False
    if q:
        metin = " ".join([g["baslik"], g["cumle"], HESAPLAR[g["hesap"]]["ad"], g["tur_ad"]]
                         + [b["metin"] for b in g.get("bulgular") or []])
        if _tr_kucuk(q) not in _tr_kucuk(metin):
            return False
    return True


def akis(con, gun, kapsam="hepsi", duzey="dengeli", now=None, hesap=None, q=None):
    """Gunun meydani. Gonderiler her istekte olaylardan yeniden turer.
    `hesap` profil gorunumu, `q` arama: ikisi de yalniz suzer."""
    kapsam = kapsam if kapsam in KAPSAMLAR else "hepsi"
    duzey = duzey if duzey in DUZEYLER else "dengeli"
    hesap = hesap if hesap in HESAPLAR else None
    q = _metin(q, 60) or None
    hepsi = (_oneriler(con, gun) + _emirler(con, gun) + _raporlar(con, gun) + _hedefler(con, gun)
             + _dil_karti(con, gun) + _urunler(con, gun) + _notlar(con, gun))
    # Oneri ile dayanagi birbirini gosterir: rapor «ilgili oneri»yi, oneri
    # «dayanagi»ni (ayni VP'nin gunluk raporu).
    raporlar = {g["hesap"]: g for g in hepsi if g["id"].startswith("ozet-")}
    for g in hepsi:
        rp = raporlar.get(g.pop("vp", None) or "")
        if rp and g["id"].startswith("oneri-"):
            g["baglanti"] = {"id": rp["id"], "etiket": "Dayanağı", "metin": _kisalt(rp["baslik"], 140),
                             "durum": MODUL_AD[HESAPLAR[rp["hesap"]]["modul"]] + " raporu"}
    faydali, kayitli = _isaretler(con, "faydali"), _isaretler(con, "kaydet")
    faydali_tur = {(g["hesap"], g["tur"]) for g in hepsi if g["id"] in faydali}
    hesap_sayilari = {}
    for g in hepsi:
        hesap_sayilari[g["hesap"]] = hesap_sayilari.get(g["hesap"], 0) + 1
    liste = []
    for g in hepsi:
        if not _uyar(g, kapsam, hesap, q):
            continue
        if duzey == "sade" and not hesap and not q:
            if g["tur"] not in SADE_TURLER and not g["bekliyor"]:
                continue
            if g["tur"] == "bulgu" and not g["uyari"]:
                continue
        g["onem"] = (ONEM[g["tur"]] + (50 if g["bekliyor"] else 0) + (5 if g["uyari"] else 0)
                     + (10 if (g["hesap"], g["tur"]) in faydali_tur else 0))
        g["faydali"], g["kayitli"] = g["id"] in faydali, g["id"] in kayitli
        g["gun"] = str(g["zaman"])[:10]
        g["zaman_yazi"] = ne_zaman(g["zaman"], now)
        liste.append(g)
    liste.sort(key=lambda g: (g["gun"], g["onem"], str(g["zaman"])), reverse=True)
    yanitlar = _yanit_haritasi(con, [g["id"] for g in liste], now)
    for g in liste:
        g["yanitlar"] = yanitlar.get(g["id"], [])
    sinir, say, katli = DUZEYLER[duzey], {}, {}
    if not hesap and not q:
        for g in liste:
            if g["bekliyor"] or g["hesap"] == "sen":
                continue
            say[g["hesap"]] = say.get(g["hesap"], 0) + 1
            if say[g["hesap"]] > sinir:
                g["katli"] = True
                katli[g["hesap"]] = katli.get(g["hesap"], 0) + 1
    ds = deste_ozet(con, now)
    bekleyen = sum(1 for g in liste if g["bekliyor"])
    if q and not liste:
        son = "«%s» için bugün gönderi yok." % q
    elif not liste:
        son = ("Bugün meydana düşen bir olay yok. Modüller kayıt gönderdikçe, BAM ürettikçe "
               "burada görünür.")
    elif bekleyen:
        son = "Bugünlük bu kadar. %d gönderi senden karar bekliyor." % bekleyen
    else:
        son = "Bugünlük bu kadar."
    return {"gun": gun, "gun_yazi": tarih_yaz(gun), "kapsam": kapsam, "duzey": duzey,
            "hesap": hesap, "q": q, "hesaplar": HESAPLAR, "turler": TUR_AD,
            "hesap_sayilari": hesap_sayilari,
            "hikayeler": _hikayeler(liste) if not hesap and not q else [],
            "gonderiler": liste,
            "katlanan": [{"hesap": h, "adet": n,
                          "cumle": "%s: %d gönderi daha var; sınırı aştığı için katlandı, silinmedi."
                                   % (HESAPLAR[h]["ad"], n)} for h, n in katli.items()],
            "bekleyen": bekleyen, "tekrar": ds, "son": son,
            "bugun": _gunun_ozeti(con, gun, [g for g in hepsi], sum(1 for g in hepsi if g["bekliyor"]), ds),
            "not": "Sayıları kod üretir; cümleleri kural motoru kurar. Model kapalıyken de aynıdır."}


def gonderi_bul(con, gun, gid):
    for g in akis(con, gun, "hepsi", "tam")["gonderiler"]:
        if g["id"] == gid:
            return g
    return None


# ------------------------------------------------------------ yanitlar
#
# Yanit Danisma'ya gider: cevabi gorevli verir (core/sohbet.py), sayisini
# kural motoru. Bu dosya modeli CAGIRMAZ; daemon once `yanit_hazirla` ile
# kullanicinin yanitini yazar, gorevliye sorar, sonra `yanit_ekle` ile
# cevabi kaydeder. Cevap gelmezse bu da soylenir; yanit kaybolmaz.
#
# Iki tuzak: (1) gorevliye giden MESAJ yalniz kullanicinin kendi sozudur;
# gonderi onceki konusma olarak gider. Gonderinin «uyku 5,2 saat»i mesajin
# icinde olsaydi sohbet onu yeni bir kayit sanabilirdi. (2) Model bagli
# degilse komut tahmini («durum mu demek istedin?») cevap degildir:
# gonderinin kendi verisinden kural cevabi yazilir (`kural_yanit`).

KIP_AD = {"model": "model · yalnız üslup; sayılar kural motorundan",
          "komut": "kural motoru", "memory": "kural motoru", "emir": "King iş emri",
          "kural": "kural motoru · model bağlı değil", "yok": "model kapalı"}


def _yanit_satir(r, now=None):
    d = dict(r)
    d["ad"] = HESAPLAR.get(d["hesap"], {}).get("ad", d["hesap"])
    d["kip_ad"] = KIP_AD.get(d.get("kip") or "", "")
    d["zaman_yazi"] = ne_zaman(d["created_at"], now)
    return d


def yanitlar(con, gid, now=None):
    return [_yanit_satir(r, now) for r in con.execute(
        "SELECT * FROM meydan_yanit WHERE gonderi=? ORDER BY id", (gid,)).fetchall()]


def yanit_hazirla(con, gun, gid, metin, now=None):
    """Kullanicinin yanitini yazar; gorevliye sorulacak metni ve gorevliyi doner."""
    metin = _metin(metin, YANIT_EN_COK + 1)
    if not metin:
        return {"ok": False, "status": 400, "note": "Yanıt boş olamaz."}
    if len(metin) > YANIT_EN_COK:
        return {"ok": False, "status": 400, "note": "Yanıt en çok %d karakter." % YANIT_EN_COK}
    g = gonderi_bul(con, gun, gid)
    if not g:
        return {"ok": False, "status": 404, "note": "Bu gönderi o günün meydanında yok."}
    if g["hesap"] == "sen":
        return {"ok": False, "status": 400, "note": "Kendi notuna yanıt yazılmaz; notu düzenle."}
    con.execute("INSERT INTO meydan_yanit(gonderi, hesap, metin, kip, created_at) VALUES (?,?,?,?,?)",
                (gid, "sen", metin, "", _iso(_an(now))))
    con.commit()
    gorevli = YANIT_GOREVLI[g["hesap"]]
    baglam = "Meydan'da yazdığım gönderi (%s): %s %s" % (
        g["tur_ad"], (g["baslik"] + ".") if g["baslik"] else "", _kisalt(g["cumle"], 400))
    if g.get("sayilar"):
        baglam += " Sayılar: " + "; ".join("%s %s (%s)" % (x[1], x[0], x[2]) for x in g["sayilar"][:4]) + "."
    return {"ok": True, "gorevli": gorevli, "soru": metin, "baglam": baglam, "gonderi": g}


def kural_yanit(g):
    """Model bagli degilken gonderinin KENDI verisinden cevap: nereden geldi,
    bulgular, sayilar (kesinlikleriyle), ilgili oneri. Yorum eklenmez."""
    k = g.get("kaynak") or {}
    parca = ["Bu gönderi %s üzerine yazıldı%s." % (
        k.get("olay") or "bir olay", (" (kural: %s)" % k["kural"]) if k.get("kural") else "")]
    if g.get("uyari") and g.get("baslik"):
        parca.append("Öne çıkan bulgu: %s" % g["baslik"].rstrip(".") + ".")
    bl = [b["metin"] for b in g.get("bulgular") or []]
    if bl:
        parca.append("Denetimin bulguları: " + "; ".join(_kisalt(x, 120) for x in bl[:2]) + ".")
    sy = g.get("sayilar") or []
    if sy:
        parca.append("Sayılar: " + "; ".join(
            "%s %s (%s%s)" % (x[1], x[0], x[2], (", " + x[3]) if len(x) > 3 else "") for x in sy[:3]) + ".")
    if g.get("baglanti"):
        parca.append("%s: %s — %s." % (g["baglanti"].get("etiket", "İlgili"), g["baglanti"]["metin"],
                                        g["baglanti"]["durum"]))
    parca.append("Yorum için bir model bağlı değil (Ayarlar → Yapay zekâ). Yanıtın burada duruyor.")
    return _kisalt(" ".join(parca), 900)


def yanit_ekle(con, gid, gorevli, cevap, kip, now=None):
    metin = _metin(cevap, 1200) or "Şu an cevap üretilemedi; yanıtın Danışma geçmişinde duruyor."
    con.execute("INSERT INTO meydan_yanit(gonderi, hesap, metin, kip, created_at) VALUES (?,?,?,?,?)",
                (gid, gorevli, metin, kip if kip in KIP_AD else "yok", _iso(_an(now))))
    con.commit()
    return {"ok": True, "yanitlar": yanitlar(con, gid, now)}


# ------------------------------------------------------------ isaretler

def isaretle(con, gun, gid, tur, acik, now=None):
    """Faydali ya da Kaydet. Kaydet gonderinin O ANKI halini saklar:
    olay yarin akistan cikar ama kaydedilen kalir."""
    if tur not in ("faydali", "kaydet"):
        return {"ok": False, "status": 400, "note": "İşaret yalnız faydalı ya da kaydet olabilir."}
    if not acik:
        con.execute("DELETE FROM meydan_isaret WHERE gonderi=? AND tur=?", (gid, tur))
        con.commit()
        return {"ok": True, "acik": False}
    g = gonderi_bul(con, gun, gid)
    if not g:
        return {"ok": False, "status": 404, "note": "Bu gönderi o günün meydanında yok."}
    deger = json.dumps(g, ensure_ascii=False) if tur == "kaydet" else ""
    con.execute("INSERT OR REPLACE INTO meydan_isaret(gonderi, tur, deger, created_at) VALUES (?,?,?,?)",
                (gid, tur, deger, _iso(_an(now))))
    con.commit()
    return {"ok": True, "acik": True,
            "note": "Kaydedilenlere eklendi." if tur == "kaydet"
            else "Bu hesabın bu türü sende biraz öne alınır; başka hiçbir şey değişmez."}


def kaydedilenler(con, now=None):
    out = []
    for r in con.execute("SELECT gonderi, deger, created_at FROM meydan_isaret WHERE tur='kaydet' "
                         "ORDER BY created_at DESC").fetchall():
        try:
            g = json.loads(r["deger"])
        except ValueError:
            continue
        g["kayitli"], g["kaydedildi"] = True, r["created_at"]
        g["zaman_yazi"] = ne_zaman(g.get("zaman"), now)
        g["yanitlar"] = yanitlar(con, g["id"], now)
        g.pop("katli", None)
        out.append(g)
    return {"gonderiler": out,
            "son": "Kaydettiğin gönderi yok." if not out else "Hepsi bu kadar."}


# ------------------------------------------------------------ mini sinav

def cevapla(con, gid, no, secim, now=None):
    """Sinav cevabini KOD sinar. Yanlis cevap o soruyu tekrar destesine
    hemen vadeli olarak koyar; dogru cevap desteye dokunmaz."""
    m = re.match(r"^bam-(\d+)$", str(gid or ""))
    if not m:
        return {"ok": False, "status": 404, "note": "Bu gönderi bir sınav değil."}
    k = bam.kayit_getir(con, int(m.group(1)))
    sorular = _soru_listesi((k or {}).get("govde") or {})
    if not sorular or not isinstance(no, int) or not 0 <= no < len(sorular):
        return {"ok": False, "status": 404, "note": "Soru bulunamadı."}
    s = sorular[no]
    if not isinstance(secim, int) or not 0 <= secim < len(s.get("secenekler") or []):
        return {"ok": False, "status": 400, "note": "Seçim geçersiz."}
    if con.execute("SELECT 1 FROM meydan_isaret WHERE gonderi=? AND tur=?",
                   (gid, "cevap:%d" % no)).fetchone():
        return {"ok": False, "status": 409, "note": "Bu soru zaten cevaplandı."}
    dogru_harf = str(s.get("dogru") or "")[:1].upper()
    dogru_mu = HARFLER[secim] == dogru_harf
    con.execute("INSERT INTO meydan_isaret(gonderi, tur, deger, created_at) VALUES (?,?,?,?)",
                (gid, "cevap:%d" % no, str(secim), _iso(_an(now))))
    con.commit()
    kart = None
    if not dogru_mu:
        kart = desteye_koy(con, "sinav", "%s:%d" % (gid, no), _metin(s.get("soru"), 400),
                           "%s) %s" % (dogru_harf, _secenek(s, dogru_harf)),
                           aciklama=_metin(s.get("cozum"), 600), hesap="bam",
                           modul=_hedef_modul(con, k.get("is_id")), vade_simdi=True, now=now)
    return {"ok": True, "dogru_mu": dogru_mu,
            "dogru": HARFLER.find(dogru_harf), "cozum": _metin(s.get("cozum"), 600),
            "cumle": "Doğru." if dogru_mu else
            "Bu sefer olmadı. Doğrusu %s. Soru tekrar destene girdi; şimdi vadeli." % dogru_harf,
            "kart": kart}


# ------------------------------------------------------------ tekrar destesi

def _kart_satir(r, now=None):
    d = dict(r)
    d.pop("onceki", None)
    d["vadeli"] = d["vade"] <= _iso(_an(now))
    d["yeni"] = d["tekrar"] == 0
    d["sonraki"] = sonra_yaz(d["vade"], now)
    d["ses"] = DIL_KODU.get(d.get("dil"))
    d["secenekler"] = [{"derece": x, "ad": DERECE_AD[x], "sure": _sure_on(d, x)} for x in DERECELER]
    return d


def _sonraki(adim, derece):
    """(yeni adim, sure) — araliklar koddadir."""
    if derece == "tekrar":
        return 0, datetime.timedelta(minutes=10)
    if derece == "zor":
        return max(0, adim - 1), datetime.timedelta(days=1)
    yeni = min(adim + (1 if derece == "iyi" else 2), len(ARALIK) - 1)
    return yeni, datetime.timedelta(days=ARALIK[yeni])


def _sure_on(d, derece):
    _a, sure = _sonraki(d.get("adim") or 0, derece)
    if sure < datetime.timedelta(days=1):
        return "10 dk"
    return "%d gün" % sure.days


def desteye_koy(con, kaynak, kimlik, on, arka, aciklama="", hesap="bam", modul=None, dil=None,
                vade_simdi=True, now=None):
    """Tek kart. Ayni anahtar ikinci kez girmez; silinmisse geri gelir."""
    an = _iso(_an(now))
    anahtar = "%s:%s" % (kaynak, kimlik)
    r = con.execute("SELECT * FROM meydan_deste WHERE anahtar=?", (anahtar,)).fetchone()
    if r:
        if r["silindi"] or vade_simdi:
            con.execute("UPDATE meydan_deste SET silindi=0, vade=CASE WHEN ? THEN ? ELSE vade END, "
                        "updated_at=? WHERE id=?", (1 if vade_simdi else 0, an, an, r["id"]))
            con.commit()
        return r["id"]
    cur = con.execute(
        "INSERT INTO meydan_deste(anahtar, kaynak, hesap, modul, on_yuz, arka_yuz, aciklama, dil, "
        "adim, vade, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,0,?,?,?)",
        (anahtar, kaynak, hesap, modul, on, arka, aciklama or "", dil, an, an, an))
    con.commit()
    return cur.lastrowid


def desteye_ekle(con, gid, now=None):
    """Gonderideki butun kartlar desteye. Kart metni ISTEMCIDEN alinmaz:
    kaynagindan (BAM kaydi, ESP'nin dil karti) yeniden okunur."""
    eklenen, kaynak = [], str(gid or "")
    m = re.match(r"^bam-(\d+)$", kaynak)
    d = re.match(r"^dil-(\d{4}-\d{2}-\d{2})$", kaynak)
    if m:
        k = bam.kayit_getir(con, int(m.group(1)))
        if not k:
            return {"ok": False, "status": 404, "note": "Kayıt yok."}
        mod = _hedef_modul(con, k.get("is_id"))
        for i, (on, arka, acik, dil) in enumerate(_kart_listesi(k.get("govde") or {})):
            if on and arka:
                eklenen.append(desteye_koy(con, "bam", "%s:%d" % (gid, i), _metin(on, 400),
                                           _metin(arka, 400), aciklama=_metin(acik, 600),
                                           hesap="bam", modul=mod, dil=dil, vade_simdi=False,
                                           now=now))
    elif d:
        r = con.execute("SELECT gun, kartlar FROM dil_karti WHERE modul='esp' AND gun=?",
                        (d.group(1),)).fetchone()
        if not r:
            return {"ok": False, "status": 404, "note": "O günün dil kartı yok."}
        for i, x in enumerate(json.loads(r["kartlar"] or "[]")):
            eklenen.append(desteye_koy(con, "esp", "%s:%d" % (gid, i), _metin(x.get("on"), 400),
                                       _metin(x.get("arka"), 400), hesap="intellect", modul="esp",
                                       vade_simdi=False, now=now))
    else:
        return {"ok": False, "status": 400, "note": "Bu gönderide kart yok."}
    if not eklenen:
        return {"ok": False, "status": 422, "note": "Eklenecek kart çıkmadı."}
    return {"ok": True, "adet": len(eklenen),
            "cumle": "%d kart destene girdi. İlki şimdi Tekrar'da." % len(eklenen),
            "tekrar": deste_ozet(con, now)}


def kart_yap(con, on, arka, modul=None, now=None):
    on, arka = _metin(on, KART_EN_COK), _metin(arka, KART_EN_COK)
    if not on or not arka:
        return {"ok": False, "status": 400, "note": "Kartın iki yüzü de dolu olmalı."}
    if on == arka:
        return {"ok": False, "status": 400, "note": "Ön ve arka yüz aynı olamaz."}
    an = _an(now)
    kid = desteye_koy(con, "sen", "%s:%s" % (_iso(an), on[:40]), on, arka, hesap="sen",
                      modul=modul if modul in MODUL_AD else None, now=an)
    return {"ok": True, "id": kid, "cumle": "Kart destene girdi; şimdi Tekrar'da.",
            "tekrar": deste_ozet(con, now)}


def deste_ozet(con, now=None):
    an = _iso(_an(now))
    vadeli = con.execute("SELECT COUNT(*) FROM meydan_deste WHERE silindi=0 AND vade<=?",
                         (an,)).fetchone()[0]
    toplam = con.execute("SELECT COUNT(*) FROM meydan_deste WHERE silindi=0").fetchone()[0]
    sonraki = con.execute("SELECT MIN(vade) FROM meydan_deste WHERE silindi=0 AND vade>?",
                          (an,)).fetchone()[0]
    if vadeli:
        cumle = "%d kart tekrar bekliyor." % vadeli
    elif toplam:
        cumle = "Bugünlük tekrar bitti. Sıradaki kart %s." % sonra_yaz(sonraki, now)
    else:
        cumle = "Destende kart yok. Akıştaki kartlara «Destene ekle» de."
    return {"vadeli": vadeli, "toplam": toplam, "sonraki": sonraki, "cumle": cumle}


def deste(con, now=None):
    an = _iso(_an(now))
    vadeli = [_kart_satir(r, now) for r in con.execute(
        "SELECT * FROM meydan_deste WHERE silindi=0 AND vade<=? ORDER BY vade, id", (an,)).fetchall()]
    sirada = [_kart_satir(r, now) for r in con.execute(
        "SELECT * FROM meydan_deste WHERE silindi=0 AND vade>? ORDER BY vade, id LIMIT 20",
        (an,)).fetchall()]
    return {"vadeli": vadeli, "sirada": sirada, "ozet": deste_ozet(con, now),
            "kural": "Aralıklar kodda: 1 · 3 · 7 · 14 · 30 gün. «Tekrar» 10 dakika sonra "
                     "yeniden sorar. Kartı ajan yazar; ne zaman döneceğine kod karar verir."}


def puanla(con, kid, derece, now=None):
    if derece not in DERECELER:
        return {"ok": False, "status": 400, "note": "Derece tekrar, zor, iyi ya da kolay olmalı."}
    r = con.execute("SELECT * FROM meydan_deste WHERE id=? AND silindi=0", (kid,)).fetchone()
    if not r:
        return {"ok": False, "status": 404, "note": "Kart yok."}
    an = _an(now)
    adim, sure = _sonraki(r["adim"], derece)
    onceki = json.dumps({"adim": r["adim"], "vade": r["vade"], "tekrar": r["tekrar"],
                         "son_puan": r["son_puan"]})
    vade = _iso(an + sure)
    con.execute("UPDATE meydan_deste SET adim=?, vade=?, tekrar=tekrar+1, son_puan=?, onceki=?, "
                "updated_at=? WHERE id=?", (adim, vade, derece, onceki, _iso(an), kid))
    con.commit()
    return {"ok": True, "vade": vade, "sonraki": sonra_yaz(vade, an),
            "cumle": "Sonraki tekrar %s." % sonra_yaz(vade, an), "tekrar": deste_ozet(con, now)}


def geri_al(con, kid, now=None):
    """Son puanlamayi geri koyar (kucuk aksiyon, «Geri al»). Tek adim."""
    r = con.execute("SELECT * FROM meydan_deste WHERE id=?", (kid,)).fetchone()
    if not r or not r["onceki"]:
        return {"ok": False, "status": 409, "note": "Geri alınacak bir puan yok."}
    o = json.loads(r["onceki"])
    con.execute("UPDATE meydan_deste SET adim=?, vade=?, tekrar=?, son_puan=?, onceki=NULL, "
                "updated_at=? WHERE id=?", (o["adim"], o["vade"], o["tekrar"], o["son_puan"],
                                            _iso(_an(now)), kid))
    con.commit()
    return {"ok": True, "cumle": "Geri alındı.", "tekrar": deste_ozet(con, now)}


def karti_cikar(con, kid, now=None):
    """Karti desteden cikarir; satir SILINMEZ, isaretlenir (geri eklenebilir)."""
    n = con.execute("UPDATE meydan_deste SET silindi=1, updated_at=? WHERE id=? AND silindi=0",
                    (_iso(_an(now)), kid)).rowcount
    con.commit()
    if not n:
        return {"ok": False, "status": 404, "note": "Kart yok."}
    return {"ok": True, "cumle": "Kart desteden çıktı; kaydı silinmedi.", "tekrar": deste_ozet(con, now)}


# ------------------------------------------------------------ not

def not_yaz(con, metin, modul=None, now=None):
    """«Sen» gonderisi. Not KAYIT OLMAZ: hicbir module ve olcume gitmez."""
    metin = _metin(metin, NOT_EN_COK + 1)
    if not metin:
        return {"ok": False, "status": 400, "note": "Not boş olamaz."}
    if len(metin) > NOT_EN_COK:
        return {"ok": False, "status": 400, "note": "Not en çok %d karakter." % NOT_EN_COK}
    an = _an(now)
    cur = con.execute("INSERT INTO meydan_not(gun, modul, metin, created_at) VALUES (?,?,?,?)",
                      (saat.bugun(an), modul if modul in MODUL_AD else None, metin, _iso(an)))
    con.commit()
    return {"ok": True, "id": cur.lastrowid,
            "cumle": "Not meydana düştü. Not olarak durur; kayıt ya da ölçüm olmaz."}


def not_sil(con, nid):
    n = con.execute("UPDATE meydan_not SET silindi=1 WHERE id=? AND silindi=0", (nid,)).rowcount
    con.commit()
    return {"ok": bool(n), "status": 200 if n else 404,
            "cumle": "Not akıştan kalktı; kaydı silinmedi." if n else "Not yok."}
