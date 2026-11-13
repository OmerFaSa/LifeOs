#!/usr/bin/env python3
"""King'in kendi verisi: hafıza, sohbet geçmişi, model kullanım defteri (sadelesme, P6 öncesi HKM sahipliği).
Rapor: belgeler/ekip/sadelesme/faz1-hkm-sahiplik.md · Test: python king/hafiza_test.py

Sözler (AGENTS §0.1; HKM/core/memory.py ile aynı sözleşme):
1. Yalnız okur, listeler, önerir. Burada yazan işlev yok: kalıcı kayıt tek süreçten sonra kaydet kapısından ve
   kullanıcının onayıyla gelir.
2. Model hafızaya yazmaz: `oner` yalnız «oneri» durumunda bir nesne döndürür. Göçte de katmanının izin vermediği
   kaynaktan gelen etkin satır etkin hafıza olmaz, öneriye iner.
3. Özel kayıt King'e gelmez: `listele` gövdesinde ozel:true olanı hiç döndürmez.
4. GOC: HKM satırı (HKM/core/db.py şeması; goc.topla_hkm'nin gövdesi, sütun -> değer) -> King kaydı. Zamanlar
   HKM'deki ISO metin olarak kalır (saat dilimi tahmin edilmez). Taşınamayan adıyla EKSIK'te; satıra özgü olan
   bağdaştırıcının dönüşünde. Ret: ValueError (Türkçe neden, içerik yok).
"""
import datetime

KAYNAK_IZNI = {"soz": {"explicit", "kullanici"}, "sohbet": {"explicit", "kullanici", "kural"}, "cikarim": {"kural"}}
DURUM = {"active": "etkin", "aday": "oneri", "forgotten": "unutuldu", "reddedildi": "reddedildi", "dustu": "dustu"}
ROL = {"user": "kisi", "manager": "king"}            # patron.py:458 conversations.role
MAX_METIN = 600                                      # memory.py MAX_TEXT

# Bağdaştırıcının okuduğu sütunlar (gerçek şemayla denetlendi, hafiza_test.py); okunmayan sütun EKSIK'te adıyla geçer.
OKUR = {
    "memories": ("id", "user", "scope", "text", "source", "state", "created_at", "expires_at", "last_used_at",
                 "forgotten_at", "katman", "modul", "dis_id", "onaylandi_at", "alan", "gorenler"),
    "conversations": ("id", "channel", "role", "text", "audio_retained", "created_at", "agent", "arsiv"),
    "usage": ("id", "created_at", "day", "role", "task", "provider", "model", "in_tok", "out_tok", "image_tok",
              "reason_tok", "usd", "try_", "rate", "cached", "escalated", "ok", "note", "veri", "cached_tok", "is_id",
              "ms", "seviye", "neden", "ilk_ms"),
}
EKSIK = {
    "memories": ["Kişi adı (user): tek kişi (§0.1 kural 1); «ben» olmayan satır ayrıca sayılır.",
                 "Gömme vektörü (hafiza_gomme) türetilmiş: Arama yeniden gömer."],
    "conversations": ["Ses kaydının kendisi: depoda hiç yoktu, yalnız işareti (audio_retained -> ses) taşınır."],
    "usage": ["Kişi adı (user): tek kişi (§0.1 kural 1).",
              "BAM işi (is_id) arşivde (goc.HKM_ARSIV bam_isler): kimlik kalır, iş yeniden koşmaz."],
}


def _bos(v):
    return v is None or str(v).strip() == ""


def hafiza(s):
    """memories satırı -> (King hafıza kaydı, satıra özgü notlar)."""
    if _bos(s.get("text")):
        raise ValueError("Metni boş hafıza kaydı taşınmaz.")
    if s.get("state") not in DURUM:
        raise ValueError("Hafıza durumu bilinmiyor (state).")
    katman = s.get("katman") or "soz"                # memory.py: eski satırda boş katman «senin sözün»dür
    if katman not in KAYNAK_IZNI:
        raise ValueError("Hafıza katmanı bilinmiyor (katman).")
    durum, notlar = DURUM[s["state"]], []
    if durum == "etkin" and s.get("source") not in KAYNAK_IZNI[katman]:
        durum = "oneri"
        notlar.append("Katmanın izin vermediği kaynak (source): etkin hafıza olmadı, öneriye indi.")
    if (s.get("user") or "ben") != "ben":
        notlar.append("Kişi adı (user) «ben» değildi: tek kişiye katıldı.")
    return {"id": "hafiza/%s" % s["id"], "tur": "hafiza", "metin": s["text"], "katman": katman,
            "kaynak": s.get("source"), "durum": durum, "kapsam": s.get("scope") or "all", "alan": s.get("alan"),
            "gorenler": s.get("gorenler"), "modul": s.get("modul"), "dis_id": s.get("dis_id"),
            "olusturma": s.get("created_at"), "bitis": s.get("expires_at"), "son_kullanim": s.get("last_used_at"),
            "unutulma": s.get("forgotten_at"), "onay": s.get("onaylandi_at")}, notlar


def sohbet(s):
    """conversations satırı -> (King sohbet kaydı, notlar). Arşive kalkmış satır (arsiv=1) da taşınır, görünmez."""
    if _bos(s.get("text")):
        raise ValueError("Boş sohbet satırı taşınmaz.")
    return {"id": "sohbet/%s" % s["id"], "tur": "sohbet", "rol": ROL.get(s.get("role"), s.get("role")),
            "metin": s["text"], "kanal": s.get("channel") or "local", "gorevli": s.get("agent") or "king",
            "arsiv": bool(s.get("arsiv")), "ses": bool(s.get("audio_retained")), "zaman": s.get("created_at")}, []


def kullanim(s):
    """usage satırı -> (kullanım defteri kaydı, notlar). Ölçülmüş defterdir: sütunlar adıyla ve değeriyle kalır
    (satırın kendi fiyatı ve kuru dondurulmuştur, db.py usage yorumu); yalnız kimlik ve kişi adı değişir."""
    k = {a: s.get(a) for a in OKUR["usage"] if a != "id"}
    k.update(id="kullanim/%s" % s["id"], tur="kullanim")
    return k, []


GOC = {"memories": hafiza, "conversations": sohbet, "usage": kullanim}


def listele(kayitlar, tur, durum="etkin", simdi=None, sinir=50):
    """King'in okuma kapısı: bir türün görünür kayıtları, en yeni önce. Hafıza: verilen durumda (etkin ya da oneri)
    ve süresi geçmemiş; sohbet: arşive kalkmamış. Özel (ozel:true) kayıt hiç dönmez."""
    simdi = simdi or datetime.datetime.now().isoformat(timespec="seconds")

    def gorunur(k):
        if k.get("tur") != tur or k.get("ozel") is True:
            return False
        if tur == "hafiza":     # memory.py list_active ile aynı: ISO metin karşılaştırması
            return k.get("durum") == durum and not (k.get("bitis") and k["bitis"] <= simdi)
        return not k.get("arsiv")
    l = [k for k in kayitlar if gorunur(k)]
    l.sort(key=lambda k: str(k.get("olusturma") or k.get("zaman") or k.get("created_at") or ""), reverse=True)
    return l[:sinir]


def oner(metin, katman="sohbet", kaynak="king", zaman=None):
    """Hafıza önerisi: YAZILMAZ, yalnız «oneri» nesnesi döner; etkin olması kullanıcının onayıyla ve kaydet kapısıyla."""
    metin = str(metin or "").strip()
    if not metin or len(metin) > MAX_METIN:
        raise ValueError("Öneri metni boş olamaz ve %d karakteri geçemez." % MAX_METIN)
    if katman not in KAYNAK_IZNI:
        raise ValueError("Hafıza katmanı soz, sohbet ya da cikarim olmalı.")
    return {"tur": "hafiza", "durum": "oneri", "metin": metin, "katman": katman, "kaynak": kaynak,
            "olusturma": zaman or datetime.datetime.now().isoformat(timespec="seconds")}
