"""ICE AKTARMA — Google verisini hesap baglamadan sisteme getirmek.

Kullanici (2026-10-30): «Chrome/Google baglama calismiyor, ne yapacagimiz
acik degil; bircok seyimizi baglayip sistemin bunu cekmesini ve bu
verilerden ESP, SPI, AYS icin yararlanmasini saglayalim». Secimi: hesap
BAGLANMAZ (AGENTS §1.4); Takeout dosyasi ve takvimin gizli iCal adresi.

  GET  /api/ice                 { takvim:{ var, olaylar, cekildi, hata }, veri:{ adim, youtube } }
  POST /api/ice/takvim          { adres } — gizli iCal adresi (https); bos adres siler
  POST /api/ice/veri            { tur:'adim'|'youtube', ozet } — tarayicinin okudugu ozet

Sozler:
  1. YALNIZ BU BILGISAYAR; yazma X-LifeOS: ice ister.
  2. HESAP YOK. Takvim yalniz kullanicinin yapistirdigi https adresinden,
     yarim saatte bir okunur; adres disari verilmez (GET yalniz «var» der).
  3. DOSYA SUNUCUYA GELMEZ. Takeout dosyasini tarayici okur; buraya yalniz
     ozeti gelir (gun basina adim; gun basina izlenen video ve en cok
     izlenen kanallar), sinirli boyda.
  4. HICBIR MODULE YAZILMAZ. Moduller ozeti GOSTERIR; olcum kayda ancak
     kullanicinin onayiyla gecer (§1.4).
"""

import datetime
import json
import os
import re
import time
import urllib.request

TAZE_SN = 30 * 60
UFUK_GUN = 14


def klasor():
    elle = os.environ.get("LIFEOS_ICE_KLASOR")
    if elle:
        return elle
    if os.name == "nt":
        return os.path.join(os.environ.get("LOCALAPPDATA") or os.path.expanduser("~"), "LifeOS", "ice")
    return os.path.join(os.path.expanduser("~"), ".lifeos", "ice")


def _yol(kok=None):
    return os.path.join(kok or klasor(), "ice.json")


def oku(kok=None):
    try:
        with open(_yol(kok), encoding="utf-8") as f:
            v = json.load(f)
        return v if isinstance(v, dict) else {}
    except (OSError, ValueError):
        return {}


def yaz(v, kok=None):
    k = kok or klasor()
    os.makedirs(k, exist_ok=True)
    gecici = _yol(k) + ".yaziliyor"
    with open(gecici, "w", encoding="utf-8") as f:
        json.dump(v, f, ensure_ascii=False)
    os.replace(gecici, _yol(k))


def _tarih(deger):
    """DTSTART degeri -> (datetime, tum_gun). TZ bilgisi okunmaz, Z UTC'dir."""
    d = deger.strip()
    if re.match(r"^\d{8}$", d):
        return datetime.datetime.strptime(d, "%Y%m%d"), True
    m = re.match(r"^(\d{8}T\d{6})(Z?)$", d)
    if not m:
        return None, False
    t = datetime.datetime.strptime(m.group(1), "%Y%m%dT%H%M%S")
    if m.group(2):
        t = t.replace(tzinfo=datetime.timezone.utc).astimezone().replace(tzinfo=None)
    return t, False


def ics_coz(metin, simdi, ufuk=UFUK_GUN):
    """Onumuzdeki `ufuk` gunun etkinlikleri, saate gore sirali.
    shortcut: RRULE (tekrarlayan etkinlik) acilmaz; yalniz ilk ornegi ufuktaysa gorunur. Tekrarlar gerekirse RRULE acilimi eklenir."""
    satirlar = []
    for s in metin.replace("\r\n", "\n").split("\n"):
        if s.startswith((" ", "\t")) and satirlar:
            satirlar[-1] += s[1:]
        else:
            satirlar.append(s)
    olaylar, o = [], None
    for s in satirlar:
        if s == "BEGIN:VEVENT":
            o = {}
        elif s == "END:VEVENT" and o is not None:
            if o.get("bas"):
                olaylar.append(o)
            o = None
        elif o is not None and ":" in s:
            ad, deger = s.split(":", 1)
            anahtar = ad.split(";", 1)[0]
            if anahtar == "DTSTART":
                o["bas"], o["tum_gun"] = _tarih(deger)
            elif anahtar == "DTEND":
                o["bit"], _ = _tarih(deger)
            elif anahtar == "SUMMARY":
                o["ad"] = deger.replace("\\,", ",").replace("\\;", ";").replace("\\n", " ").strip()[:120]
    son = simdi + datetime.timedelta(days=ufuk)
    gun_basi = simdi.replace(hour=0, minute=0, second=0, microsecond=0)
    l = [x for x in olaylar if x["bas"] and gun_basi <= x["bas"] < son]
    l.sort(key=lambda x: x["bas"])
    return [{"bas": x["bas"].strftime("%Y-%m-%dT%H:%M"), "bit": x["bit"].strftime("%Y-%m-%dT%H:%M") if x.get("bit") else None,
             "tum_gun": bool(x.get("tum_gun")), "ad": x.get("ad") or "Etkinlik"} for x in l[:60]]


def takvim_tazele(v, simdi=None, getir=None, kok=None):
    """Adres varsa ve onbellek eskiyse ceker. Ag hatasi eskiyi silmez."""
    t = v.get("takvim") or {}
    if not t.get("adres"):
        return v
    if time.time() - (t.get("cekildi") or 0) < TAZE_SN and t.get("olaylar") is not None:
        return v
    getir = getir or (lambda u: urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "LifeOS"}), timeout=10).read(2 * 1024 * 1024).decode("utf-8", "replace"))
    try:
        t["olaylar"] = ics_coz(getir(t["adres"]), simdi or datetime.datetime.now())
        t["hata"] = None
    except Exception as e:                         # ag yok, adres bozuk: eski olaylar kalir
        t["hata"] = "Takvim okunamadı: %s" % str(e)[:120]
    t["cekildi"] = time.time()
    v["takvim"] = t
    yaz(v, kok)
    return v


def disari(v):
    t = v.get("takvim") or {}
    return {"takvim": {"var": bool(t.get("adres")), "olaylar": t.get("olaylar") or [], "cekildi": t.get("cekildi"), "hata": t.get("hata")},
            "veri": v.get("veri") or {}}


def ozet_dogrula(tur, ozet):
    """Ozet sinirli ve tipli olmali (soz 3)."""
    if tur == "adim":
        if not isinstance(ozet, dict):
            raise ValueError((400, "Adım özeti okunamadı."))
        gunler = {k: int(n) for k, n in list(ozet.items())[-400:]
                  if re.match(r"^\d{4}-\d{2}-\d{2}$", str(k)) and isinstance(n, (int, float)) and 0 <= n <= 200000}
        return {"gunler": gunler}
    if tur == "youtube":
        if not isinstance(ozet, dict):
            raise ValueError((400, "YouTube özeti okunamadı."))
        gunler = {k: int(n) for k, n in list((ozet.get("gunler") or {}).items())[-400:]
                  if re.match(r"^\d{4}-\d{2}-\d{2}$", str(k)) and isinstance(n, (int, float)) and 0 <= n <= 5000}
        kanallar = [[str(a)[:80], int(n)] for a, n in (ozet.get("kanallar") or [])[:15] if isinstance(n, (int, float))]
        return {"gunler": gunler, "kanallar": kanallar}
    raise ValueError((400, "Bilinmeyen veri türü."))


def _json(h, kod, veri):
    govde = json.dumps(veri, ensure_ascii=False).encode("utf-8")
    h.send_response(kod)
    h.send_header("Content-Type", "application/json; charset=utf-8")
    h.send_header("Content-Length", str(len(govde)))
    h.send_header("Cache-Control", "no-store")
    h.end_headers()
    h.wfile.write(govde)


def isle(h, kok=None, getir=None):
    if h.client_address[0] not in ("127.0.0.1", "::1"):
        return _json(h, 403, {"hata": "İçe aktarılan veri yalnız bu bilgisayardan."})
    yol = h.path.split("?", 1)[0].rstrip("/")
    if h.command == "GET" and yol == "/api/ice":
        return _json(h, 200, disari(takvim_tazele(oku(kok), getir=getir, kok=kok)))
    if h.command != "POST":
        return _json(h, 405, {"hata": "Desteklenmiyor."})
    if h.headers.get("X-LifeOS") != "ice":
        return _json(h, 403, {"hata": "Yalnız LifeOS'un kendi sayfasından."})
    try:
        boy = min(int(h.headers.get("Content-Length") or 0), 512 * 1024)
        gelen = json.loads(h.rfile.read(boy).decode("utf-8") or "{}")
    except (ValueError, UnicodeDecodeError):
        return _json(h, 400, {"hata": "Okunamadı."})
    v = oku(kok)
    if yol == "/api/ice/takvim":
        adres = str(gelen.get("adres") or "").strip()
        if adres and not re.match(r"^https://[^\s]+$", adres):
            return _json(h, 400, {"hata": "Adres https:// ile başlamalı (Google Takvim › Ayarlar › Gizli adres, iCal biçiminde)."})
        v["takvim"] = {"adres": adres} if adres else {}
        yaz(v, kok)
        return _json(h, 200, disari(takvim_tazele(v, getir=getir, kok=kok)))
    if yol == "/api/ice/veri":
        try:
            ozet = ozet_dogrula(gelen.get("tur"), gelen.get("ozet"))
        except ValueError as e:
            kod, cumle = e.args[0]
            return _json(h, kod, {"hata": cumle})
        v.setdefault("veri", {})[gelen["tur"]] = dict(ozet, aktarildi=int(time.time()))
        yaz(v, kok)
        return _json(h, 200, disari(v))
    return _json(h, 404, {"hata": "Böyle bir adres yok."})
