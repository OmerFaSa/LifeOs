"""ZEMIN DOSYALARI — kullanicinin kendi arka plan fotografi ya da videosu.

Kullanici (2026-10-29): «arka planin fotograflarini degistirebilelim; gece
ile sabah ayni ya da ayri olsun; pc'den fotograf ekleyebilelim; arka plana
bir video secimi koyabilelim; bu ayarlar dort kartin oldugu giris sayfasinda
da gecerli».

Moduller ayri kokenlerdir (4173/4183/4193): tarayici deposu paylasilmaz, bir
modulde secilen gorsel otekinde gorunmezdi. Dosya bu yuzden PC'de bir kez
durur ve her kapidan ayni adresle okunur:

  GET    /api/zemin/<yuva>    dosyanin kendisi (yoksa 404)
  POST   /api/zemin/<yuva>    govde = dosya, Content-Type = turu
  DELETE /api/zemin/<yuva>    siler

Yuvalar: gunduz, gece. Sozler:
  1. YALNIZ BU BILGISAYAR. Okuma da yazma da yalniz 127.0.0.1'den: kisisel
     fotograf ev agindan (telefon, tablet) okunamaz. Telefon modulun kendi
     fotografini gorur.
  2. YALNIZ GORSEL VE VIDEO. jpeg, png, webp, mp4, webm; tur basliktan ve
     dosyanin ilk baytlarindan denetlenir. Ust sinir 80 MB.
  3. DEPONUN DISINDA. %LOCALAPPDATA%\\LifeOS\\zemin (hesap klasorunun yani);
     guncelleme ona dokunmaz.
"""

import os

YUVALAR = ("gunduz", "gece")
TURLER = {
    "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp",
    "video/mp4": ".mp4", "video/webm": ".webm",
}
UST_SINIR = 80 * 1024 * 1024


def klasor():
    elle = os.environ.get("LIFEOS_ZEMIN_KLASOR")
    if elle:
        return elle
    if os.name == "nt":
        temel = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
        return os.path.join(temel, "LifeOS", "zemin")
    return os.path.join(os.path.expanduser("~"), ".lifeos", "zemin")


def imza_uyar(tur, bas):
    """Dosyanin ilk baytlari bildirilen ture uyuyor mu."""
    if tur == "image/jpeg":
        return bas[:3] == b"\xff\xd8\xff"
    if tur == "image/png":
        return bas[:8] == b"\x89PNG\r\n\x1a\n"
    if tur == "image/webp":
        return bas[:4] == b"RIFF" and bas[8:12] == b"WEBP"
    if tur == "video/mp4":
        return bas[4:8] == b"ftyp"
    if tur == "video/webm":
        return bas[:4] == b"\x1a\x45\xdf\xa3"
    return False


def bul(yuva, kok=None):
    """Yuvadaki dosyanin yolu ve turu; yoksa (None, None)."""
    kok = kok or klasor()
    for tur, uzanti in TURLER.items():
        yol = os.path.join(kok, yuva + uzanti)
        if os.path.isfile(yol):
            return yol, tur
    return None, None


def sil(yuva, kok=None):
    kok = kok or klasor()
    for uzanti in TURLER.values():
        yol = os.path.join(kok, yuva + uzanti)
        if os.path.isfile(yol):
            os.remove(yol)


def yaz(yuva, tur, veri, kok=None):
    """Dogrular ve yazar. Hata: (kod, cumle)."""
    if yuva not in YUVALAR:
        raise ValueError((404, "Böyle bir zemin yuvası yok."))
    if tur not in TURLER:
        raise ValueError((415, "Yalnız JPEG, PNG, WebP fotoğraf ya da MP4, WebM video."))
    if not veri or len(veri) > UST_SINIR:
        raise ValueError((413, "Dosya boş ya da 80 MB'tan büyük."))
    if not imza_uyar(tur, veri[:16]):
        raise ValueError((415, "Dosyanın içeriği türüyle uyuşmuyor."))
    kok = kok or klasor()
    os.makedirs(kok, exist_ok=True)
    sil(yuva, kok)
    gecici = os.path.join(kok, yuva + ".yaziliyor")
    with open(gecici, "wb") as f:
        f.write(veri)
    os.replace(gecici, os.path.join(kok, yuva + TURLER[tur]))


def _yanit(h, kod, govde=b"", tur="text/plain; charset=utf-8"):
    h.send_response(kod)
    h.send_header("Content-Type", tur)
    h.send_header("Content-Length", str(len(govde)))
    h.send_header("Cache-Control", "no-store")
    h.end_headers()
    if govde and h.command != "HEAD":
        h.wfile.write(govde)


def isle(h):
    """Sunucu isleyicisinden cagrilir: h.command, h.path, h.client_address."""
    if h.client_address[0] not in ("127.0.0.1", "::1"):
        return _yanit(h, 403, "Arka plan dosyası yalnız bu bilgisayardan.".encode("utf-8"))
    yuva = h.path.split("?", 1)[0].rstrip("/").rsplit("/", 1)[-1]
    if yuva not in YUVALAR:
        return _yanit(h, 404, "Böyle bir zemin yuvası yok.".encode("utf-8"))
    # Yazma ve silme ozel baslik ister (giris sayfasinin X-LifeOS'u gibi): baska
    # bir site bu basligi on-ucus izni olmadan gonderemez.
    if h.command in ("POST", "DELETE") and h.headers.get("X-LifeOS") != "zemin":
        return _yanit(h, 403, "Arka plan yalnız LifeOS'un kendi sayfasından değişir.".encode("utf-8"))
    if h.command == "GET":
        yol, tur = bul(yuva)
        if not yol:
            return _yanit(h, 404)
        with open(yol, "rb") as f:
            return _yanit(h, 200, f.read(), tur)
    if h.command == "DELETE":
        sil(yuva)
        return _yanit(h, 204)
    if h.command == "POST":
        try:
            boy = int(h.headers.get("Content-Length") or 0)
        except ValueError:
            boy = 0
        if boy <= 0 or boy > UST_SINIR:
            return _yanit(h, 413, "Dosya boş ya da 80 MB'tan büyük.".encode("utf-8"))
        tur = (h.headers.get("Content-Type") or "").split(";", 1)[0].strip().lower()
        try:
            yaz(yuva, tur, h.rfile.read(boy))
        except ValueError as e:
            kod, cumle = e.args[0]
            return _yanit(h, kod, cumle.encode("utf-8"))
        return _yanit(h, 204)
    return _yanit(h, 405)
