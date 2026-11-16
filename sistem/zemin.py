"""ZEMIN DOSYALARI — kullanicinin kendi arka plan fotografi ya da videosu.

Kullanici (2026-10-29): «arka planin fotograflarini degistirebilelim; gece
ile sabah ayni ya da ayri olsun; pc'den fotograf ekleyebilelim; arka plana
bir video secimi koyabilelim; bu ayarlar dort kartin oldugu giris sayfasinda
da gecerli».

Moduller ayri kokenlerdir (4173/4183/4193): tarayici deposu paylasilmaz, bir
modulde secilen gorsel otekinde gorunmezdi. Dosya bu yuzden PC'de bir kez
durur ve her kapidan ayni adresle okunur:

  GET    /api/zemin/<yuva>    dosyanin kendisi (yoksa 404); ?var: "1" ya da "0"
  POST   /api/zemin/<yuva>    govde = dosya, Content-Type = turu
  DELETE /api/zemin/<yuva>    siler

Yuvalar: gunduz, gece, acilis (giris sayfasinin acilis videosu, 2026-11-02). Sozler:
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

import contextlib
import errno
import io
import os
import re
import time

YUVALAR = ("gunduz", "gece", "acilis")
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


def _dosyalar(yuva, kok):
    """Yuvanin dosyalari [(mtime, yol, tur)]: «gunduz.mp4» ya da surumlu «gunduz.<n>.mp4».
    Surum neden: Windows'ta tarayici videoyu okurken (uzun Range yaniti) dosya silinemez ve ustune yazilamaz;
    yeni dosya yeni adla yazilir, en yenisi okunur, eskisi silinebildigi ilk anda silinir."""
    out = []
    try:
        adlar = os.listdir(kok)
    except OSError:
        return out
    for ad in adlar:
        m = re.match(r"^%s(?:\.(\d+))?(\.[a-z0-9]+)$" % re.escape(yuva), ad)
        tur = m and next((t for t, u in TURLER.items() if u == m.group(2)), None)
        yol = os.path.join(kok, ad)
        if tur and os.path.isfile(yol):      # esit zamanda surum numarasi buyuk olan yenidir
            out.append((os.path.getmtime(yol), int(m.group(1) or 0), yol, tur))
    return [(z, y, t) for z, _, y, t in sorted(out)]


def bul(yuva, kok=None):
    """Yuvadaki en yeni dosyanin yolu ve turu; yoksa (None, None)."""
    l = _dosyalar(yuva, kok or klasor())
    return (l[-1][1], l[-1][2]) if l else (None, None)


def sil(yuva, kok=None, tut=None):
    """Yuvanin dosyalarini siler (`tut` haric). Okunmakta olan (kilitli) dosya kalir. Doner: silinemeyen sayisi."""
    kalan = 0
    for _, yol, _ in _dosyalar(yuva, kok or klasor()):
        if yol == tut:
            continue
        try:
            os.remove(yol)
        except PermissionError:
            kalan += 1
    return kalan


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
    diske_akit(gecici, bas, okuyucu, boy)
    sil(yuva, kok)
    hedef = os.path.join(kok, yuva + TURLER[tur])
    if os.path.exists(hedef):      # eski dosya okunuyor (kilitli): yeni surum adiyla yazilir, bul() en yenisini verir
        hedef = os.path.join(kok, "%s.%d%s" % (yuva, time.time_ns(), TURLER[tur]))
    os.replace(gecici, hedef)
    sil(yuva, kok, tut=hedef)


def diske_akit(gecici, bas, okuyucu, boy):
    """bas + okuyucudan kalan (boy - len(bas)) bayti gecici dosyaya yazar. Yarida kalirsa, disk dolarsa ya da
    baglanti koparsa gecici silinir (disk dolarken yarim dosya diski daha da doldurmasin). Hata: (kod, cumle)."""
    kalan = boy - len(bas)
    try:
        with open(gecici, "wb") as f:
            f.write(bas)
            while kalan > 0:
                p = okuyucu.read(min(PARCA, kalan))
                if not p:
                    break
                f.write(p)
                kalan -= len(p)
    except OSError as e:
        with contextlib.suppress(OSError):
            os.remove(gecici)
        if e.errno == errno.ENOSPC:
            raise ValueError((507, "Diskte yer kalmadı; dosya kaydedilmedi. Yer açıp yeniden dene."))
        raise ValueError((400, "Yükleme yarıda kaldı; yeniden dene."))
    if kalan > 0:
        os.remove(gecici)
        raise ValueError((400, "Yükleme yarıda kaldı; yeniden dene."))


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
        return _yanit(h, 403, "Arka plan yalnız Başbuğ'un kendi sayfasından değişir.".encode("utf-8"))
    if h.command == "GET":
        yol, tur = bul(yuva)
        if h.path.endswith("?var"):
            # kabuk/acilis.js: dosya var mi (404'suz; tarayici konsoluna hata dusmez)
            return _yanit(h, 200, b"1" if yol else b"0")
        if not yol:
            return _yanit(h, 404)
        return _akit(h, yol, tur)
    if h.command == "DELETE":
        if sil(yuva):
            return _yanit(h, 409, "Dosya şu an oynatılıyor; birkaç saniye sonra yeniden dene.".encode("utf-8"))
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
