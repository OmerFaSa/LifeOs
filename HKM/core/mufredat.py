# -*- coding: utf-8 -*-
"""Mufredat raporu — sinav profilinin iskeleti (ekip/PLAN.md §3.L; Tur 4).

   AYS «KPSS genel kultur» gibi bir sinavin mufredatini ister. Is King'in
   onayindan gecer, BAM Arastirma Ofisi mufredati DERS -> KONU agaci olarak
   yazar, AYS'ye teklif olarak doner; kullanici onaylarsa AYS onu KENDI
   koduyla dogrulayip sinav profili olarak saklar.

   Dort kural:

   1. UYDURULMUS MUFREDAT YASAKTIR (PLAN §3.L). Internete erisim yokken
      kayit HER ZAMAN «dogrulanmadi»dir ve kullaniciya resmi kilavuzla
      karsilastirmasi soylenir. Model emin olmadigini «acik_kalanlar»a
      yazar; soru sayisini yalniz eminse verir.
   2. MODELIN CIKTISI KODLA SUZULUR. Ders ve konu sayisi, uzunluk, tekrar
      ve soru sayisi araligi burada denetlenir; tutmayan konu duser ve
      kac tanesinin dustugu kayda yazilir. Hic ders kalmazsa kayit yazilmaz.
   3. GIRDI KAPALIDIR: yalniz sinav adi ve istege bagli bolum. Kisisel veri
      yoktur; rapor «genel»dir ve ayni sinav ikinci kez istenirse depodan
      gelir (King, «once depo»).
   4. PUANLAMA SAYISI URETILMEZ. Puan hesabi kural motorunun isidir ve
      resmi kaynak baglanmadan yazilmaz; raporda yalniz metin notu durur."""
import hashlib
import json
import re

MAX_SINAV = 80
MAX_BOLUM = 80
MAX_DERS = 20
MAX_KONU_DERS = 80
MAX_KONU_TOPLAM = 1000
SORU_ARALIK = (1, 200)

SISTEM = """Sen HKM'deki BAM'ın Araştırma Ofisisin ve bir sınavın müfredatını çıkarıyorsun.
Araştırma Patronu adına çalışırsın; onun üstünde BAM Patronu, onun da üstünde King var.

KONUMUN VE SINIRIN
- İnternete ve kaynaklara erişimin YOK; yalnız kendi bilgin var. Yazdığın müfredat
  «doğrulanmadı» etiketiyle saklanır ve kullanıcıya resmi kılavuzla karşılaştırması söylenir.
- Emin olmadığın dersi ya da konuyu UYDURMA; «acik_kalanlar»a yaz.
- Soru sayısını yalnız eminsen yaz; değilsen null bırak. Puan hesabı yazma; puanlama
  hakkında bildiğini yalnız kısa bir not olarak ver, emin değilsen boş bırak.
- Hangi yılın kılavuzuna göre yazdığını bilmiyorsan bunu «acik_kalanlar»a yaz.

NASIL YAZARSIN
1. Sınavı (ve verilmişse bölümünü) derslere ayır.
2. Her dersin konularını kısa, öğretilebilir birimler olarak sırala
   (ör. «Osmanlı Devleti Kuruluş Dönemi»); bir derste en fazla 60 konu.
3. Türkçe yaz.

ÇIKTI: Yalnız şu biçimde tek bir JSON nesnesi döndür, başka hiçbir şey yazma:
{"baslik": "...", "sinav": "...", "dersler": [{"ad": "...", "soru_sayisi": 27,
 "konular": ["..."]}], "puanlama_notu": "", "acik_kalanlar": ["..."]}"""


def _bosluk(s):
    return re.sub(r"\s+", " ", str(s or "")).strip()


def _kucuk(s):
    return _bosluk(s).replace("I", "ı").replace("İ", "i").lower()


# ------------------------------------------------------------ girdi

def temizle(govde):
    """Is emri govdesi: {sinav, bolum?}. (temiz, hatalar)."""
    if not isinstance(govde, dict):
        return None, ["mufredat bir nesne olmalı"]
    hata = []
    for k in govde:
        if k not in ("sinav", "bolum"):
            hata.append("mufredat: bilinmeyen alan %s" % k)
    sinav = _bosluk(govde.get("sinav"))
    if not (2 <= len(sinav) <= MAX_SINAV):
        hata.append("sinav 2-%d karakterlik bir ad olmalı" % MAX_SINAV)
    bolum = _bosluk(govde.get("bolum")) if govde.get("bolum") is not None else ""
    if len(bolum) > MAX_BOLUM:
        hata.append("bolum en fazla %d karakter olmalı" % MAX_BOLUM)
    if hata:
        return None, hata
    g = {"sinav": sinav}
    if bolum:
        g["bolum"] = bolum
    return g, []


def anahtar(temiz):
    """Ayni sinav -> ayni anahtar; buyuk-kucuk harf ve bosluk farki sayilmaz."""
    g = (temiz or {}).get("mufredat") or {}
    ham = json.dumps({"sinav": _kucuk(g.get("sinav")), "bolum": _kucuk(g.get("bolum"))},
                     sort_keys=True, ensure_ascii=False)
    return hashlib.sha1(ham.encode("utf-8")).hexdigest()[:20]


def talep(g):
    return "«%s»%s müfredatı: dersler ve konular" % (
        g["sinav"], (" (%s)" % g["bolum"]) if g.get("bolum") else "")


def istem(g):
    return ("Sınav: %s\nBölüm: %s\nBu sınavın müfredatını ders ve konu olarak çıkar."
            % (g["sinav"], g.get("bolum") or "tümü"))


# ------------------------------------------------------------ cikti

def _metin(x, en_az, en_cok):
    t = _bosluk(x)
    return t if en_az <= len(t) <= en_cok else None


def ayikla(d, g):
    """Modelin JSON'u -> temiz rapor govdesi ya da (None, neden). Kod suzer."""
    if not isinstance(d, dict):
        return None, "Model geçerli bir JSON vermedi."
    ham = d.get("dersler")
    if not isinstance(ham, list) or not ham:
        return None, "Raporda ders yok."
    dersler, dusen, gorulen, toplam = [], 0, set(), 0
    for x in ham[:MAX_DERS * 2]:
        if not isinstance(x, dict):
            dusen += 1
            continue
        ad = _metin(x.get("ad"), 2, 80)
        if not ad or _kucuk(ad) in gorulen:
            dusen += 1
            continue
        soru = x.get("soru_sayisi")
        if isinstance(soru, bool) or not isinstance(soru, int) \
                or not (SORU_ARALIK[0] <= soru <= SORU_ARALIK[1]):
            soru = None
        konular, ks = [], set()
        ham_konu = x.get("konular") if isinstance(x.get("konular"), list) else []
        for k in ham_konu[:MAX_KONU_DERS * 2]:
            t = _metin(k, 2, 120)
            if not t or _kucuk(t) in ks or len(konular) >= MAX_KONU_DERS \
                    or toplam + len(konular) >= MAX_KONU_TOPLAM:
                dusen += 1
                continue
            ks.add(_kucuk(t))
            konular.append(t)
        if not konular:
            dusen += 1
            continue
        if len(dersler) >= MAX_DERS:
            dusen += 1
            continue
        gorulen.add(_kucuk(ad))
        toplam += len(konular)
        dersler.append({"ad": ad, "soru_sayisi": soru, "konular": konular})
    if not dersler:
        return None, "Raporun hiçbir dersi biçim denetimini geçmedi."
    ham_acik = d.get("acik_kalanlar") if isinstance(d.get("acik_kalanlar"), list) else []
    acik = [t for t in (_metin(a, 2, 300) for a in ham_acik) if t][:12]
    return {"tur": "mufredat", "sinav": g["sinav"], "bolum": g.get("bolum") or None,
            "dersler": dersler, "ders_sayisi": len(dersler), "konu_sayisi": toplam,
            "puanlama_notu": _metin(d.get("puanlama_notu"), 2, 600),
            "acik_kalanlar": acik, "dusen": dusen,
            "uyari": "Kaynaksız: model bilgisinden çıkarıldı. Resmi kılavuzla karşılaştır; "
                     "yanlış ya da eksik konu olabilir."}, None
