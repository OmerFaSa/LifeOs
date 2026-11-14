#!/usr/bin/env python3
"""King'in on iki kapısı ve eski araç kataloğu (sadelesme Faz 5, A7). Rapor: belgeler/ekip/sadelesme/faz5-king-cekirdek.md

    python king/katalog.py          kapı başına eski araç sayısı (istemci kaynağı taranır)
    python king/katalog.py --json   bütün harita: eski araç -> kapı ya da «arşiv», nedeniyle

Kapılar motorların kapısıdır; model yalnız bunları görür. Eski ~130 araç kapının ardındaki katalogdadır:
model `eylem: "katalog"` ile listeyi alır, `arac` ile birini adlandırır (geçiş dönemi). Yazan eylemi kod
doğrular ve uygular; MCP ucu bugün yalnız okur (king/mcp.py), yazma tek süreçle gelir (AGENTS §0.1).
"""
import json
import os
import re
import sys

KOD = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _sema(eylemler, **ek):
    ozellik = {"eylem": {"type": "string", "enum": list(eylemler) + ["katalog"],
                         "description": "Yapılacak iş; «katalog» bu kapının ardındaki eski araçları listeler."},
               "arac": {"type": "string", "maxLength": 40,
                        "description": "Geçiş dönemi: kataloğdaki eski aracın adı (eylem=katalog listeler)."},
               "param": {"type": "object", "description": "Eylemin ya da eski aracın parametreleri."}}
    ozellik.update(ek)
    return {"type": "object", "properties": ozellik, "required": ["eylem"], "additionalProperties": False}


_METIN = {"type": "string", "maxLength": 200}

# ad: (motor, açıklama, okuyan eylemler, bütün eylemler, mcp.py'de bugün okuyan araçlar; kaydet'inki yalnız öneri gösterir)
# Okuyan eylemler dışındaki her eylem yazar: kod doğrular, onay ister, geri alınır.
KAPILAR = {
    "kaydet": ("Kayıt", "Bir kaydı ekler, düzeltir ya da siler: süre, mesafe, öğün, uyku, ölçüm, çalışma oturumu. "
               "Sayıyı yalnız kullanıcı söylediyse «ölçüldü» yazar; uydurmaz.",
               (), ("ekle", "duzelt", "sil"), ("kayit_cozumle",)),
    "kayit_oku": ("Kayıt", "Kayıtları ve günü okur: bugünün özeti, istatistik, hafta raporu, tek kayıt. Her sayı "
                  "kesinlik etiketiyle gelir.", ("ara", "oku", "bugun", "ozet"), ("ara", "oku", "bugun", "ozet"),
                  ("kayit_ara", "kayit_oku", "bugun_ozeti")),
    "plan": ("Plan", "Gün ve hafta planı, öncelik, yük, odak sayacı, hedef, hatırlatma, karar kapatma.",
             ("goster",), ("goster", "ekle", "degistir", "odak_baslat", "odak_durdur", "kapat"), ()),
    "tekrar": ("Tekrar", "Bugün vadesi gelen kartlar (FSRS) ve kart ekleme/silme.",
               ("bugun",), ("bugun", "kart_ekle", "kart_sil"), ("tekrar_durumu",)),
    "soru": ("Soru", "Bankadan soru sorar, deneme ve yanlış defterini okur/yazar, yanlışı teşhis eder.",
             ("sor", "denemeler", "yanlislar", "teshis", "tahmin"),
             ("sor", "denemeler", "yanlislar", "teshis", "tahmin", "deneme_yaz", "yanlis_yaz"), ()),
    "ogren": ("Yol", "Alanın öğrenme yolu: aşama, ünite, ders, konu durumu, repertuvar. Kapı soruları verilmez.",
              ("yol", "ders"), ("yol", "ders", "konu_durumu"), ("yol_haritasi",)),
    "not": ("Not", "Notları okur (özel notlar hiç gelmez) ve not önerir; not yazmak kullanıcının onayıyladır.",
            ("ara", "oku"), ("ara", "oku", "oner"), ("notlar",)),
    "ara": ("Arama", "Kaynak, besin ve barkod araması; araştırma niyetinin kapısı.",
            ("kaynak", "besin", "barkod"), ("kaynak", "besin", "barkod"), ("arastir",)),
    "ayar": ("Kabuk", "Ayarlar, açık bölümler, profil, tema; büyük eylemden (sıfırdan başlat) önce dönüş noktası.",
             ("oku",), ("oku", "degistir", "bolum", "profil", "sifirdan"), ()),
    "onay": ("Kabuk", "Bekleyen öneriler: listele, onayla, geç, hepsi; dönüş noktasına dön.",
             ("listele",), ("listele", "onayla", "gec", "hepsi", "geri_al"), ()),
    "sistem": ("Kabuk", "Sistem haritası, sayfa açma, ölçüm ve bütçe, King'in harcaması.",
               ("harita", "olcum", "harcama"), ("harita", "sayfa_ac", "olcum", "harcama"),
               ("sistem_haritasi", "olcum", "niyet")),
    "dis_dunya": ("Dış dünya", "Bilgisayarda dosya/uygulama açma, ekran okuma, telefona gönderme; her biri ayrı izinle.",
                  (), ("dosya_ac", "uygulama", "ekran_oku", "telefona", "izin"), ()),
}
KAPI_SEMA = {ad: _sema(k[3]) for ad, k in KAPILAR.items()}
KAPI_SEMA["kaydet"] = _sema(KAPILAR["kaydet"][3], kayit={"type": "object", "description": "Kayıt önerisi (niyet.py)"})
KAPI_SEMA["not"] = _sema(KAPILAR["not"][3], ara=_METIN)

# Niyet başına masadaki kapılar. Sohbet araç çağırmaz; kayıt modele hiç gitmez (kural motoru kaydet'i çağırır).
NIYET_KAPILARI = {
    "sohbet": (),
    "kayit": (),
    "ogren": ("ogren", "soru", "tekrar", "not", "kayit_oku"),
    "arastir": ("ara", "not", "kayit_oku", "ogren"),
    "yonet": ("kaydet", "kayit_oku", "plan", "tekrar", "not", "ayar", "onay", "sistem", "dis_dunya"),
}

# Eski araç -> kapı. Her ad tam bir kez geçer (katalog_test). «yetki:» önekliler kural yolunun yetki kataloğudur.
ESKI = {
    "kaydet": ("Kayıt yazan: kayıt motorunun tek yazma kapısına iner.",
               "kayit_gir gun_kaydi_yaz gun_sen_yaz"),
    "kayit_oku": ("Kayıt okuyan: tek depodan kayit_ara/kayit_oku/bugun_ozeti ile okunur.",
               "istatistikler bugun_ozeti gun_kaydi gun_sen gun_karne merkez_raporu"),
    "plan": ("Plan motoru: gün/hafta planı, öncelik, odak, hedef, hatırlatma, karar.",
               "oncelik_listesi yuk_durumu odak_baslat odak_durdur gun_kart_cek"),
    "tekrar": ("Tekrar motoru (FSRS): dokuz zamanlayıcı tek motora indi.",
               "ays_tekrarlarim spi_tekrarlarim esp_tekrarlarim"),
    "soru": ("Soru motoru: soru bankası, deneme, yanlış defteri, teşhis, kural motorunun tahmini.",
               "soru_sor ays_yanlis_teshis spi_yanlis_teshis esp_yanlis_teshis"),
    "ogren": ("Yol motoru: konu/ünite durumu, merdiven, repertuvar.",
               ""),
    "not": ("Not motoru: on üç not yapısı tek motorda; King okur, özel notu görmez.",
               "not_ara not_ekle"),
    "ara": ("Arama motoru: kaynak ve besin/barkod araması.",
               ""),
    "ayar": ("Tek ayar şeması (kabuk): ayar, bölüm, profil, tema, sıfırdan başlat.",
               "ayar_degistir king_ayari yetki:tema yetki:animasyon yetki:sifirdan"),
    "onay": ("Onay kuyruğu ve geri alma.",
               "onaylari_listele oneri_onayla oneri_gec onerilerin_hepsi yetki:onay-liste yetki:onay-hepsi yetki:onay-tek yetki:red-tek yetki:red-hepsi yetki:donus"),
    "sistem": ("Kabuk ve kalite: harita, sayfa, modül sayıları, harcama, veri incelemesi.",
               "sistem_haritasi sayfa_ac modul_bilgileri king_harcama"),
    "dis_dunya": ("Dış dünya eylemleri, her biri ayrı izinle (King 4.0 §E).",
               "pc_dosya_ac pc_uygulama_baslat pc_ekran_oku telefona_gonder dis_izin"),
}
ARSIV = {
    "yetki:muzik": "Radyo ve müzik arşivde (AGENTS §0.1, §1.6).",
}


def harita():
    """{eski_ad: (kapi_ya_da_arsiv, neden)}; bir ad iki yerde geçerse ValueError (tek eşleme sözü)."""
    h = {}
    for kapi, (neden, adlar) in ESKI.items():
        for ad in adlar.split():
            if ad in h:
                raise ValueError("iki kez eşlendi: " + ad)
            h[ad] = (kapi, neden)
    for ad, neden in ARSIV.items():
        if ad in h:
            raise ValueError("iki kez eşlendi: " + ad)
        h[ad] = ("arşiv", neden)
    return h


# ---------------------------------------------------------------- istemci kaydının taranması

def tara(kok=KOD):
    """İstemcideki eski King araçları: {ad: [kaynak dosyalar]}. Dosya yoksa (eski modül silindiyse) atlanır.

    Kayıt kodla kurulur (brand/ortak/king-arac.js liste/disAraclar/gunAraclari, ogret.js modül başına iki,
    yetki.js); burada kaynaktaki ad kalıpları okunur. Modül araçları (AYS/SPI/ESP kingarac.js, tools.js,
    actions.js) kapanışta modüllerle kalktı."""
    bulunan = {}

    def ekle(ad, kaynak):
        bulunan.setdefault(ad, [])
        if kaynak not in bulunan[ad]:
            bulunan[ad].append(kaynak)

    def dosya(yol):
        try:
            with open(os.path.join(kok, yol), encoding="utf-8") as f:
                return f.read()
        except OSError:
            return None

    s = dosya("brand/ortak/king-arac.js")
    if s:
        for ad in re.findall(r"\bad:\s*'([a-z0-9_]+)'", s) + re.findall(r"\bdis\('([a-z0-9_]+)'", s):
            if ad != "eylem_":   # yetki eklerinden kurulur; aşağıda
                ekle(ad, "brand/ortak/king-arac.js")
    s = dosya("brand/ortak/ogret.js")
    for ek in re.findall(r"ad:\s*o\.modul\s*\+\s*'(_[a-z_]+)'", s or ""):
        for m in ("ays", "spi", "esp"):
            ekle(m + ek, "brand/ortak/ogret.js")
    s = dosya("brand/ortak/yetki.js")
    for i in re.findall(r"\bid:\s*'([a-z-]+)',\s*seviye:", s or ""):
        ekle("yetki:" + i, "brand/ortak/yetki.js")
    return bulunan


def sayim(bulunan=None):
    """Kapı başına eski araç sayısı ve eşlenmeyen/bayat adlar."""
    bulunan = tara() if bulunan is None else bulunan
    h = harita()
    kapi = {k: 0 for k in list(KAPILAR) + ["arşiv"]}
    for ad in bulunan:
        if ad in h:
            kapi[h[ad][0]] += 1
    return {"toplam": len(bulunan), "model_katalogu": sum(not a.startswith("yetki:") for a in bulunan),
            "yetki": sum(a.startswith("yetki:") for a in bulunan), "kapi_basina": kapi,
            "eslenmeyen": sorted(set(bulunan) - set(h)), "bayat": sorted(set(h) - set(bulunan))}


def kapi_katalogu(kapi):
    """eylem=katalog cevabı: kapının ardındaki eski araçlar."""
    return sorted(ad for ad, (k, _) in harita().items() if k == kapi)


def model_araclari(niyet):
    """Niyetin masasındaki kapılar, sağlayıcıya gidecek biçimde (ad, açıklama, şema)."""
    return [{"name": k, "description": KAPILAR[k][1], "input_schema": KAPI_SEMA[k]} for k in NIYET_KAPILARI[niyet]]


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    b = tara()
    if "--json" in sys.argv:
        h = harita()
        print(json.dumps({ad: {"kapi": h.get(ad, ("EŞLENMEDİ", ""))[0], "neden": h.get(ad, ("", ""))[1],
                               "kaynak": k} for ad, k in sorted(b.items())}, ensure_ascii=False, indent=1))
    else:
        print(json.dumps(sayim(b), ensure_ascii=False, indent=1))
