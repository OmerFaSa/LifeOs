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
  2. YALNIZ GORSEL VE VIDEO. jpeg, png, webp, mp4, m4v, mov, webm; tur
     basliktan ve dosyanin ilk baytlarindan denetlenir. Ust sinir 600 MB
     (kullanici, 2026-10-30: «PC'den indirdigim videoyu eklemek istiyorum,
     bitince basa donsun»; indirilen duvar videolari 80 MB'i asiyordu).
     Yazma da okuma da parca parca akar: dosya bellege alinmaz; video
     tarayicinin istedigi araligi (Range) alir, dongu ve atlama akicidir.
  3. DEPONUN DISINDA. %LOCALAPPDATA%\\LifeOS\\zemin (hesap klasorunun yani);
     guncelleme ona dokunmaz.
"""

import io
import os
import re

YUVALAR = ("gunduz", "gece")
TURLER = {
    "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp",
    "video/mp4": ".mp4", "video/webm": ".webm", "video/x-m4v": ".m4v", "video/quicktime": ".mov",
}
UST_SINIR = 600 * 1024 * 1024
SINIR_CUMLE = "Dosya boş ya da 600 MB'tan büyük."
TUR_CUMLE = "Yalnız JPEG, PNG, WebP fotoğraf ya da MP4, MOV, WebM video (MKV ve AVI'yi önce MP4'e çevir)."
PARCA = 1024 * 1024


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
    if tur in ("video/mp4", "video/x-m4v"):
        return bas[4:8] == b"ftyp"
    if tur == "video/quicktime":
        return bas[4:8] in (b"ftyp", b"moov", b"wide", b"mdat", b"free", b"skip")
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
    """Dogrular ve yazar (bayt). Hata: (kod, cumle)."""
    return yaz_akis(yuva, tur, io.BytesIO(veri or b""), len(veri or b""), kok)


def yaz_akis(yuva, tur, okuyucu, boy, kok=None):
    """Govdeyi parca parca diske yazar; bellege almaz. Hata: (kod, cumle).
    Eski dosya yalniz yeni dosya tamamlaninca silinir (yarida kalan yukleme
    eskisini bozmaz)."""
    if yuva not in YUVALAR:
        raise ValueError((404, "Böyle bir zemin yuvası yok."))
    if tur not in TURLER:
        raise ValueError((415, TUR_CUMLE))
    if boy <= 0 or boy > UST_SINIR:
        raise ValueError((413, SINIR_CUMLE))
    bas = okuyucu.read(min(16, boy))
    if not imza_uyar(tur, bas):
        raise ValueError((415, "Dosyanın içeriği türüyle uyuşmuyor."))
    kok = kok or klasor()
    os.makedirs(kok, exist_ok=True)
    gecici = os.path.join(kok, yuva + ".yaziliyor")
    kalan = boy - len(bas)
    with open(gecici, "wb") as f:
        f.write(bas)
        while kalan > 0:
            p = okuyucu.read(min(PARCA, kalan))
            if not p:
                break
            f.write(p)
            kalan -= len(p)
    if kalan > 0:
        os.remove(gecici)
        raise ValueError((400, "Yükleme yarıda kaldı; yeniden dene."))
    sil(yuva, kok)
    os.replace(gecici, os.path.join(kok, yuva + TURLER[tur]))


def _akit(h, yol, tur):
    """Dosyayi parca parca gonderir; Range (tek aralik) gelirse 206."""
    boy = os.path.getsize(yol)
    bas, son = 0, boy - 1
    m = re.match(r"^bytes=(\d*)-(\d*)$", (h.headers.get("Range") or "").strip())
    kod = 200
    if m and boy and (m.group(1) or m.group(2)):
        if m.group(1):
            bas = int(m.group(1))
            son = min(int(m.group(2)), boy - 1) if m.group(2) else boy - 1
        else:
            bas = max(0, boy - int(m.group(2)))
        if bas > son or bas >= boy:
            h.send_response(416)
            h.send_header("Content-Range", "bytes */%d" % boy)
            h.send_header("Content-Length", "0")
            h.end_headers()
            return
        kod = 206
    h.send_response(kod)
    h.send_header("Content-Type", tur)
    h.send_header("Accept-Ranges", "bytes")
    h.send_header("Content-Length", str(son - bas + 1))
    h.send_header("Cache-Control", "no-store")
    if kod == 206:
        h.send_header("Content-Range", "bytes %d-%d/%d" % (bas, son, boy))
    h.end_headers()
    if h.command == "HEAD":
        return
    with open(yol, "rb") as f:
        f.seek(bas)
        kalan = son - bas + 1
        while kalan > 0:
            p = f.read(min(PARCA, kalan))
            if not p:
                break
            h.wfile.write(p)
            kalan -= len(p)


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
        return _akit(h, yol, tur)
    if h.command == "DELETE":
        sil(yuva)
        return _yanit(h, 204)
    if h.command == "POST":
        try:
            boy = int(h.headers.get("Content-Length") or 0)
        except ValueError:
            boy = 0
        if boy <= 0 or boy > UST_SINIR:
            return _yanit(h, 413, SINIR_CUMLE.encode("utf-8"))
        tur = (h.headers.get("Content-Type") or "").split(";", 1)[0].strip().lower()
        try:
            yaz_akis(yuva, tur, h.rfile, boy)
        except ValueError as e:
            kod, cumle = e.args[0]
            return _yanit(h, kod, cumle.encode("utf-8"))
        return _yanit(h, 204)
    return _yanit(h, 405)
