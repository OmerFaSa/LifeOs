"""MUZIK — kullanicinin kendi muzik dosyalari ve listeleri.

Kullanici (2026-10-30): «sisteme muzik ekleyebilelim, radyo gibi; yerel
olarak da muzik koyabilelim; ders calisirken su liste, spor yaparken su
liste; sistem acilisinda su muzigin su saniyesinden su saniyesine kadar;
sistem arkada acikken su listeden calsin; radyonun altinda muzik bolumu
olsun, muzikleri ve listeleri gorup bosta calan muzigi susturabilelim;
acilis muzik sesini ayarlardan ayarlayabilelim».

Moduller ayri kokenlerdir (4173/4183/4193): dosyalar ve listeler PC'de bir
kez durur, her kapidan ayni adresle okunur (zemin.py gibi).

  GET    /api/muzik                 dizin: parcalar, listeler, acilis, arka
  POST   /api/muzik/parca           govde = dosya; X-Ad = adi (URL kodlu)
  GET    /api/muzik/parca/<id>      dosyanin kendisi (Range destekli)
  DELETE /api/muzik/parca/<id>      siler (listelerden de cikar)
  POST   /api/muzik/ayar            listeler, acilis, arka (JSON)

Sozler:
  1. YALNIZ BU BILGISAYAR. Okuma ve yazma yalniz 127.0.0.1'den; yazma
     X-LifeOS: muzik basligi ister.
  2. YALNIZ SES. mp3, m4a/aac, ogg, opus/webm, wav, flac; tur basliktan ve
     ilk baytlardan denetlenir. Parca basina ust sinir 80 MB; diske
     akarak yazilir, parca parca okunur.
  3. DEPONUN DISINDA. %LOCALAPPDATA%\\LifeOS\\muzik; guncelleme dokunmaz.
  4. LISTEDE YALNIZ VAR OLAN. Ayar kaydedilirken bilinmeyen parca kimligi
     duser; silinen parca her listeden cikar. Sayilar sinirlanir (ses 0-1,
     acilis araligi 0-600 sn, bitis > baslangic).
"""

import json
import os
import re
import time
import uuid
from urllib.parse import unquote

import zemin

TURLER = {
    "audio/mpeg": ".mp3", "audio/mp3": ".mp3", "audio/mp4": ".m4a", "audio/x-m4a": ".m4a", "audio/aac": ".aac",
    "audio/ogg": ".ogg", "audio/webm": ".webm", "audio/wav": ".wav", "audio/x-wav": ".wav", "audio/wave": ".wav",
    "audio/flac": ".flac", "audio/x-flac": ".flac",
}
UZANTI_TUR = {".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".aac": "audio/aac", ".ogg": "audio/ogg", ".webm": "audio/webm",
              ".wav": "audio/wav", ".flac": "audio/flac"}
UST_SINIR = 80 * 1024 * 1024
LISTELER = ("calisma", "spor", "arka", "genel")
ACILIS_NE = ("kapali", "her", "gunde")


def klasor():
    elle = os.environ.get("LIFEOS_MUZIK_KLASOR")
    if elle:
        return elle
    if os.name == "nt":
        return os.path.join(os.environ.get("LOCALAPPDATA") or os.path.expanduser("~"), "LifeOS", "muzik")
    return os.path.join(os.path.expanduser("~"), ".lifeos", "muzik")


def imza_uyar(uzanti, bas):
    if uzanti == ".mp3":
        return bas[:3] == b"ID3" or (len(bas) > 1 and bas[0] == 0xFF and (bas[1] & 0xE0) == 0xE0)
    if uzanti == ".m4a":
        return bas[4:8] == b"ftyp"
    if uzanti == ".aac":
        return len(bas) > 1 and bas[0] == 0xFF and (bas[1] & 0xF6) == 0xF0
    if uzanti == ".ogg":
        return bas[:4] == b"OggS"
    if uzanti == ".webm":
        return bas[:4] == b"\x1a\x45\xdf\xa3"
    if uzanti == ".wav":
        return bas[:4] == b"RIFF" and bas[8:12] == b"WAVE"
    if uzanti == ".flac":
        return bas[:4] == b"fLaC"
    return False


def bos_dizin():
    return {"parcalar": [], "listeler": {l: [] for l in LISTELER},
            "acilis": {"id": None, "bas": 0, "bit": 10, "ses": 0.6, "ne": "kapali"},
            "arka": {"acik": False, "ses": 0.35, "karistir": True}}


def _yol(kok=None):
    return os.path.join(kok or klasor(), "dizin.json")


def oku(kok=None):
    d = bos_dizin()
    try:
        with open(_yol(kok), encoding="utf-8") as f:
            v = json.load(f)
    except (OSError, ValueError):
        return d
    if isinstance(v.get("parcalar"), list):
        d["parcalar"] = [p for p in v["parcalar"] if isinstance(p, dict) and isinstance(p.get("id"), str)]
    try:
        return dogrula(v, d)
    except ValueError:
        return d


def yaz(d, kok=None):
    k = kok or klasor()
    os.makedirs(k, exist_ok=True)
    gecici = _yol(k) + ".yaziliyor"
    with open(gecici, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
    os.replace(gecici, _yol(k))


def _sayi(v, alt, ust, vars_):
    try:
        n = float(v)
    except (TypeError, ValueError):
        return vars_
    return max(alt, min(ust, n))


def dogrula(v, onceki):
    """Listeleri ve ayarlari dogrular; parcalar `onceki`den gelir (soz 4)."""
    if not isinstance(v, dict):
        raise ValueError((400, "Ayar okunamadı."))
    d = bos_dizin()
    d["parcalar"] = onceki["parcalar"]
    var = {p["id"] for p in d["parcalar"]}
    gelen = v.get("listeler") if isinstance(v.get("listeler"), dict) else onceki["listeler"]
    for l in LISTELER:
        ham = gelen.get(l, onceki["listeler"].get(l, []))
        d["listeler"][l] = [i for i in (ham if isinstance(ham, list) else []) if i in var][:500]
    a = v.get("acilis") if isinstance(v.get("acilis"), dict) else onceki["acilis"]
    bas = _sayi(a.get("bas"), 0, 600, 0)
    bit = _sayi(a.get("bit"), 0, 600, bas + 10)
    if bit <= bas:
        bit = min(600, bas + 1)
    d["acilis"] = {"id": a.get("id") if a.get("id") in var else None, "bas": bas, "bit": bit,
                   "ses": _sayi(a.get("ses"), 0, 1, 0.6), "ne": a.get("ne") if a.get("ne") in ACILIS_NE else "kapali"}
    if d["acilis"]["id"] is None:
        d["acilis"]["ne"] = "kapali"
    k = v.get("arka") if isinstance(v.get("arka"), dict) else onceki["arka"]
    d["arka"] = {"acik": bool(k.get("acik")), "ses": _sayi(k.get("ses"), 0, 1, 0.35), "karistir": k.get("karistir", True) is not False}
    return d


def dosya_yolu(pid, kok=None):
    kok = kok or klasor()
    if not re.match(r"^[a-f0-9]{12}$", pid or ""):
        return None, None
    for uzanti, tur in UZANTI_TUR.items():
        yol = os.path.join(kok, pid + uzanti)
        if os.path.isfile(yol):
            return yol, tur
    return None, None


def ekle(ad, tur, okuyucu, boy, kok=None, simdi=None):
    """Parcayi diske akitir ve dizine ekler. Hata: (kod, cumle)."""
    uzanti = TURLER.get(tur)
    if not uzanti:
        raise ValueError((415, "Yalnız MP3, M4A, AAC, OGG, WebM, WAV ya da FLAC ses dosyası."))
    if boy <= 0 or boy > UST_SINIR:
        raise ValueError((413, "Dosya boş ya da 80 MB'tan büyük."))
    bas = okuyucu.read(min(16, boy))
    if not imza_uyar(uzanti, bas):
        raise ValueError((415, "Dosyanın içeriği türüyle uyuşmuyor."))
    kok = kok or klasor()
    os.makedirs(kok, exist_ok=True)
    pid = uuid.uuid4().hex[:12]
    gecici = os.path.join(kok, pid + ".yaziliyor")
    kalan = boy - len(bas)
    with open(gecici, "wb") as f:
        f.write(bas)
        while kalan > 0:
            p = okuyucu.read(min(zemin.PARCA, kalan))
            if not p:
                break
            f.write(p)
            kalan -= len(p)
    if kalan > 0:
        os.remove(gecici)
        raise ValueError((400, "Yükleme yarıda kaldı; yeniden dene."))
    os.replace(gecici, os.path.join(kok, pid + uzanti))
    ad = re.sub(r"\s+", " ", re.sub(r"\.[A-Za-z0-9]{2,4}$", "", ad or "")).strip()[:120] or "Adsız parça"
    d = oku(kok)
    parca = {"id": pid, "ad": ad, "tur": UZANTI_TUR[uzanti], "boy": boy, "eklendi": int(simdi if simdi is not None else time.time())}
    d["parcalar"].append(parca)
    yaz(d, kok)
    return parca


def sil(pid, kok=None):
    kok = kok or klasor()
    yol, _ = dosya_yolu(pid, kok)
    if yol:
        os.remove(yol)
    d = oku(kok)
    d["parcalar"] = [p for p in d["parcalar"] if p["id"] != pid]
    yaz(dogrula(d, d), kok)


def _json(h, kod, veri):
    govde = json.dumps(veri, ensure_ascii=False).encode("utf-8")
    h.send_response(kod)
    h.send_header("Content-Type", "application/json; charset=utf-8")
    h.send_header("Content-Length", str(len(govde)))
    h.send_header("Cache-Control", "no-store")
    h.end_headers()
    if h.command != "HEAD":
        h.wfile.write(govde)


def isle(h, kok=None):
    if h.client_address[0] not in ("127.0.0.1", "::1"):
        return _json(h, 403, {"hata": "Müzik yalnız bu bilgisayardan."})
    yol = h.path.split("?", 1)[0].rstrip("/")
    if h.command in ("POST", "DELETE") and h.headers.get("X-LifeOS") != "muzik":
        return _json(h, 403, {"hata": "Müzik yalnız LifeOS'un kendi sayfasından değişir."})
    m = re.match(r"^/api/muzik/parca/([a-f0-9]{12})$", yol)
    if h.command == "GET" and yol == "/api/muzik":
        return _json(h, 200, oku(kok))
    if h.command == "GET" and m:
        dosya, tur = dosya_yolu(m.group(1), kok)
        if not dosya:
            return _json(h, 404, {"hata": "Parça yok."})
        return zemin._akit(h, dosya, tur)
    if h.command == "DELETE" and m:
        sil(m.group(1), kok)
        return _json(h, 200, oku(kok))
    if h.command == "POST" and yol == "/api/muzik/parca":
        try:
            boy = int(h.headers.get("Content-Length") or 0)
        except ValueError:
            boy = 0
        tur = (h.headers.get("Content-Type") or "").split(";", 1)[0].strip().lower()
        try:
            parca = ekle(unquote(h.headers.get("X-Ad") or ""), tur, h.rfile, boy, kok)
        except ValueError as e:
            kod, cumle = e.args[0]
            return _json(h, kod, {"hata": cumle})
        return _json(h, 200, {"parca": parca, "dizin": oku(kok)})
    if h.command == "POST" and yol == "/api/muzik/ayar":
        try:
            boy = min(int(h.headers.get("Content-Length") or 0), 256 * 1024)
            gelen = json.loads(h.rfile.read(boy).decode("utf-8") or "{}")
            d = dogrula(gelen, oku(kok))
        except (ValueError, UnicodeDecodeError) as e:
            kod, cumle = e.args[0] if e.args and isinstance(e.args[0], tuple) else (400, "Ayar okunamadı.")
            return _json(h, kod, {"hata": cumle})
        yaz(d, kok)
        return _json(h, 200, d)
    return _json(h, 404, {"hata": "Böyle bir müzik adresi yok."})
