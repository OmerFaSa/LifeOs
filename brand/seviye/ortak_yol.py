# ===== BU BLOK URETILMISTIR — BURAYI DUZENLEME =====
# Kaynak: brand/seviye/ortak_yol.py
# Yayan:  python3 tools/seviye.py --yay   (denetim: --denetle)
#
# Ayni muhafiz dort sunucuda da duruyordu ve dordunu elle guncellemek
# gerekiyordu: bu depoda tam olarak bunu onlemek icin --denetle yazildi,
# ama Python tarafi disarida kalmisti. Artik o da yayiliyor.
from urllib.parse import unquote as _unquote

# Servis edilen medya turleri. Listede olmayan uzanti hic acilmaz: bir
# gorsel kapisinin dosya sistemine acilan bir pencereye donusmesi, bu
# depoda kabul edilebilir bir bedel degil.
MEDYA_TURLERI = {
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".webp": "image/webp", ".svg": "image/svg+xml",
    ".mp4": "video/mp4", ".webm": "video/webm",
}


def _guvenli_medya_adi(ad, izinli=None):
    """URL parcasini DUZ bir dosya adina indirger; olmuyorsa None.

    Yuzde kodlamasi ONCE cozulur. Cozmeden birakmak iki sey yapardi:
    `kademe%201.png` gibi bosluklu bir ad hic bulunamaz (sessiz 404) ve
    muhafiz, cozulmus hali hic gormedigi icin yanlis yerde guven
    duyardi. Cozduktan sonra alt klasor, ".." ve gizli dosya reddedilir;
    ":" da: Windows'ta `D:foto.png` os.path.join'i D: surucusune atlatir.
    """
    try:
        ad = _unquote(ad or "")
    except Exception:
        return None
    if not ad or "/" in ad or "\\" in ad or ":" in ad or ad.startswith("."):
        return None
    uzanti = os.path.splitext(ad)[1].lower()
    if uzanti not in (izinli if izinli is not None else MEDYA_TURLERI):
        return None
    return ad


def _ortak_marka_yolu(clean, kok):
    """/img/marka/<ad> -> <kok>/brand/medya/<aile>/<ad>, yoksa None.

    AILE ADDAN TURER, yoldan degil: `kimlik-ays.webp` ->
    `brand/medya/kimlik/kimlik-ays.webp`. Boylece URL duz kalir ve
    muhafiz alt klasor gezmek zorunda kalmaz — bir gorsel kapisinin
    dosya sistemine acilan bir pencereye donusmesi, bu depoda kabul
    edilebilir bir bedel degil.

    Marka medyasi seviye medyasindan AYRI durur (bkz. brand/medya/OKU.md):
    seviye medyasi bir kataloga baglidir ve eksigi kod tarafindan
    bilinir; marka medyasi serbesttir ve eksik gorsel hata degildir."""
    onek = "/img/marka/"
    if not clean.startswith(onek):
        return None
    ad = _guvenli_medya_adi(clean[len(onek):])
    if not ad:
        return None
    aile = os.path.splitext(ad)[0].split("-", 1)[0]
    if not aile or not aile.isalnum():
        return None
    return os.path.join(kok, "brand", "medya", aile, ad)


def _ortak_seviye_yolu(clean, kok):
    """/img/seviye/<ad> -> <kok>/brand/seviye/medya/<ad>, yoksa None.

    Rutbe kartlari ve kademe sahneleri uc sistemin de AYNI dosyasidir;
    uc kez kopyalamak depoyu buyutmekten baska bir sey yapmazdi.
    Sistemlerin bagimsizligi bozulmaz: dosya yoksa perde karti kendisi
    cizer, arayuzde hicbir sey kirilmaz.

    MEDYA KENDI KLASORUNDE. Once gorseller `brand/seviye/` icinde,
    `xp.js` ve `perde.js` ile yan yana duruyordu; yirmi bir dosya
    eklenince o klasorde kodu bulmak zorlasti. Kaynak kod ve servis
    edilen medya ayni yerde durmaz — `medya/` yalniz servis edilen
    dosyalari tutar, `eski/` ise servis EDILMEYENLERI (bkz. OKU.md).
    """
    onek = "/img/seviye/"
    if not clean.startswith(onek):
        return None
    ad = _guvenli_medya_adi(clean[len(onek):])
    if not ad:
        return None
    return os.path.join(kok, "brand", "seviye", "medya", ad)


def _ortak_dist_yolu(clean, kok):
    """/dist/<yol> -> <kok>/dist/<yol>, /dist degilse None.

    ".." ust klasore, ":" iceren parca (`E:`, `C:x`) Windows'ta baska bir
    surucuye cikar: `/dist/E:/` telefon portundan depo disini listeliyordu
    (2026-10-26). Ikisinden biri varsa dist kokune duser."""
    if clean != "/dist" and not clean.startswith("/dist/"):
        return None
    parca = [p for p in clean[len("/dist/"):].replace("\\", "/").split("/") if p not in ("", ".")]
    if any(p == ".." or ":" in p for p in parca):
        return os.path.join(kok, "dist")
    return os.path.join(kok, "dist", *parca)
# ===== URETILMIS BLOK SONU =====
