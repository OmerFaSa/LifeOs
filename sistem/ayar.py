"""ORTAK AYARLAR — sistem ayarlarinin bu bilgisayardaki tek kopyasi.

Kullanici (2026-10-30): «ses tum sisteme vuruyor ama duvar kagidi yalniz
AYS icin oluyor; bunu belirtin ya da sistem ayarlari, modul ayarlari diye
ayirin». Moduller ayri kokenlerdir (4173/4183/4193, giris 4180): tarayici
deposu paylasilmaz. Sistem ayarlari (gorunus, arka plan secimi, ses,
animasyon, minikler, King, profiller) bu yuzden PC'de bir kez durur; her
kapi sayfayi verirken guncel kopyayi sayfanin basina koyar (ilk cizim
dogru), sayfa degisikligi geri yazar (brand/ortak/animasyon.js).

  GET  /api/ayar            { ayar:{ anahtar:deger }, zaman, iz, cakisma }
  POST /api/ayar            { ayar:{ anahtar:deger|null } } — yalniz degisenler; null siler
  POST /api/ayar/esitle     { cihaz, cihaz_ad, son, gonder }

Sozler:
  1. YALNIZ BU BILGISAYAR; yazma X-LifeOS: ayar ister.
  2. YALNIZ TERCIH. Anahtar `lifeos.` ile baslar ve kapali bir oneke uyar
     (gorunus, zemin, ses, muzik degil, minik, King tercihi, profil); veri,
     hesap, kilit ve King'in hafizasi buraya yazilamaz.
  3. SINIRLI. En cok 120 anahtar; deger 4 KB (profiller 60 KB).
  4. Modul kapali sunucuda (telefon, tek dosya) hicbir sey degismez: sayfa
     kendi deposuyla calisir.
  5. ESITLEME: telefonla ayni Wi-Fi uzerinden iki yonlu esitlenir; cakismada
     son yazan kazanir, cakismalar gorunur kalir.
"""

import json
import os
import re
import threading
import time

def _katalog():
    """Ortak anahtarlar brand/ortak/animasyon.js KATALOG tablosundan okunur; okunamazsa hicbir anahtar kabul edilmez."""
    try:
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "brand", "ortak", "animasyon.js"), encoding="utf-8") as f:
            tablo = json.loads(re.search(r"/\*KATALOG\*/(.*?)/\*SON\*/", f.read(), re.S).group(1))
    except (OSError, ValueError, AttributeError) as e:
        print("ayar: katalog okunamadi:", e)
        return re.compile(r"(?!)")
    desen = [re.escape(k).replace(r"\.\*\*", r"\.[a-z.]+").replace(r"\.\*", r"\.[a-z]+") for k, h in tablo.items() if "o" in h]
    return re.compile("^(" + "|".join(desen) + ")$")


ANAHTAR = _katalog()
CIHAZ_RE = re.compile(r"^[A-Za-z0-9_-]{4,64}$")
EN_COK = 120
_kilit = threading.Lock()


def klasor():
    elle = os.environ.get("LIFEOS_AYAR_KLASOR")
    if elle:
        return elle
    if os.name == "nt":
        return os.path.join(os.environ.get("LOCALAPPDATA") or os.path.expanduser("~"), "LifeOS")
    return os.path.join(os.path.expanduser("~"), ".lifeos")


def _yol(kok=None):
    return os.path.join(kok or klasor(), "ayar.json")


def oku(kok=None):
    try:
        with open(_yol(kok), encoding="utf-8") as f:
            v = json.load(f)
        if not isinstance(v, dict):
            return {"ayar": {}, "zaman": 0, "iz": {}, "cakisma": []}
        a = v.get("ayar")
        iz = v.get("iz")
        ck = v.get("cakisma")
        return {
            "ayar": a if isinstance(a, dict) else {},
            "zaman": v.get("zaman") or 0,
            "iz": iz if isinstance(iz, dict) else {},
            "cakisma": ck if isinstance(ck, list) else [],
        }
    except (OSError, ValueError, AttributeError):
        return {"ayar": {}, "zaman": 0, "iz": {}, "cakisma": []}


def gecerli(k, v):
    if not isinstance(k, str) or not ANAHTAR.match(k):
        return False
    if v is None:
        return True
    return isinstance(v, str) and len(v) <= (60000 if k == "lifeos.profiller" else 4000)


def birlestir(degisen, kok=None, cihaz="pc", cihaz_ad="Bu bilgisayar", simdi=None):
    """Gecerli olanlari yazar; doner: (yeni durum, reddedilen anahtarlar)."""
    if simdi is None:
        simdi = int(time.time() * 1000)
    red = []
    with _kilit:
        d = oku(kok)
        a = dict(d["ayar"])
        iz = dict(d["iz"])
        ck = list(d["cakisma"])
        for k, v in (degisen or {}).items():
            if not gecerli(k, v):
                red.append(str(k)[:60])
                continue
            if v is None:
                a.pop(k, None)
                iz[k] = {"z": simdi, "s": simdi, "c": cihaz, "a": cihaz_ad}
            elif k in a or len(a) < EN_COK:
                a[k] = v
                iz[k] = {"z": simdi, "s": simdi, "c": cihaz, "a": cihaz_ad}
            else:
                red.append(k)
        d = {"ayar": a, "zaman": simdi, "iz": iz, "cakisma": ck}
        k2 = kok or klasor()
        os.makedirs(k2, exist_ok=True)
        gecici = _yol(k2) + ".yaziliyor"
        with open(gecici, "w", encoding="utf-8") as f:
            json.dump(d, f, ensure_ascii=False)
        os.replace(gecici, _yol(k2))
    return d, red


def esitle(cihaz, cihaz_ad, son, gonder, kok=None, simdi=None):
    """Telefonla iki yonlu esitleme (son yazan kazanir)."""
    if not isinstance(cihaz, str) or not CIHAZ_RE.match(cihaz):
        raise ValueError((400, "Geçersiz cihaz kimliği."))
    if isinstance(son, bool) or not isinstance(son, int) or son < 0:
        raise ValueError((400, "Geçersiz son zaman."))
    if not isinstance(gonder, dict) or len(gonder) > EN_COK:
        raise ValueError((400, "Geçersiz gönderilen veri."))
    for k, v in gonder.items():
        if not isinstance(k, str) or not isinstance(v, dict):
            raise ValueError((400, "Geçersiz gönderim verisi."))
        if "z" not in v:
            raise ValueError((400, "Zaman bilgisi eksik."))
        zv = v["z"]
        if isinstance(zv, bool) or not isinstance(zv, int) or zv < 0:
            raise ValueError((400, "Geçersiz zaman."))

    if not isinstance(cihaz_ad, str) or not cihaz_ad.strip():
        cihaz_ad = "Telefon"
    else:
        cihaz_ad = cihaz_ad.strip()[:40]

    if simdi is None:
        simdi = int(time.time() * 1000)

    kabul = 0
    red = []
    yeni_cakismalar = []

    with _kilit:
        d = oku(kok)
        a = dict(d["ayar"])
        iz = dict(d["iz"])
        ck = list(d["cakisma"])

        for k, v in gonder.items():
            val = v.get("d")
            z = v["z"]
            if not gecerli(k, val):
                red.append(str(k)[:60])
                continue
            if z > simdi:
                z = simdi

            su_var = (k in a)
            su_iz = iz.get(k)

            if not su_var and not su_iz:
                uygula = True
            elif son == 0:
                uygula = False      # ilk esitleme ezmez: degeri de, mezar tasini da (silinen geri gelmez)
            else:
                iz_z = su_iz.get("z", 0) if su_iz else 0
                iz_c = su_iz.get("c", "") if su_iz else ""
                iz_s = su_iz.get("s", 0) if su_iz else 0
                iz_a = (su_iz.get("a") or "Bu bilgisayar") if su_iz else "Bu bilgisayar"

                cihaz_kazandi = (z, cihaz) > (iz_z, iz_c)
                uygula = cihaz_kazandi

                if iz_s > son and iz_c != cihaz:
                    kazanan = cihaz_ad if cihaz_kazandi else iz_a
                    kaybeden = iz_a if cihaz_kazandi else cihaz_ad
                    yeni_cakismalar.append({
                        "k": k,
                        "z": simdi,
                        "kazanan": kazanan,
                        "kaybeden": kaybeden,
                    })

            if uygula:
                if val is None:
                    a.pop(k, None)
                    iz[k] = {"z": z, "s": simdi, "c": cihaz, "a": cihaz_ad}
                    kabul += 1
                elif k in a or len(a) < EN_COK:
                    a[k] = val
                    iz[k] = {"z": z, "s": simdi, "c": cihaz, "a": cihaz_ad}
                    kabul += 1
                else:
                    red.append(k)

        if yeni_cakismalar:
            ck = (yeni_cakismalar + ck)[:20]

        d = {"ayar": a, "zaman": simdi, "iz": iz, "cakisma": ck}
        k2 = kok or klasor()
        os.makedirs(k2, exist_ok=True)
        gecici = _yol(k2) + ".yaziliyor"
        with open(gecici, "w", encoding="utf-8") as f:
            json.dump(d, f, ensure_ascii=False)
        os.replace(gecici, _yol(k2))

    return {
        "ayar": a,
        "iz": iz,
        "son": simdi,
        "kabul": kabul,
        "red": red,
        "cakisma": yeni_cakismalar,
    }


def sayfaya_ekle(govde, kok=None):
    """Sayfanin <head>'ine ortak ayarlari koyar (ilk cizimden once okunur)."""
    yazi = isinstance(govde, str)
    metin = govde if yazi else govde.decode("utf-8")
    veri = json.dumps(oku(kok)["ayar"], ensure_ascii=False).replace("</", "<\\/")
    etiket = "<script>window.__LIFEOS_AYAR__=%s;</script>" % veri
    # Yalniz sayfanin BASINDAKI gercek etiket: derlenmis sayfada (dist) <head> yok,
    # «<head>» ancak sondaki bir yorumun icinde geciyordu; ayar oraya dusup hic
    # okunmuyordu (2026-10-31, uctan uca denemede bulundu). <head> yoksa <html>'in ardi.
    bas = metin[:4000]
    m = re.search(r"<head(\s[^>]*)?>", bas, re.I) or re.search(r"<html(\s[^>]*)?>", bas, re.I)
    if not m:
        return govde
    metin = metin[:m.end()] + etiket + metin[m.end():]
    return metin if yazi else metin.encode("utf-8")


def _json(h, kod, veri):
    govde = json.dumps(veri, ensure_ascii=False).encode("utf-8")
    h.send_response(kod)
    h.send_header("Content-Type", "application/json; charset=utf-8")
    h.send_header("Content-Length", str(len(govde)))
    h.send_header("Cache-Control", "no-store")
    h.end_headers()
    h.wfile.write(govde)


def isle(h, kok=None, uzak_izin=None):
    ip = h.client_address[0]
    yerel = ip in ("127.0.0.1", "::1")
    raw_path = getattr(h, "path", None) or "/api/ayar"
    yol = raw_path.split("?", 1)[0]

    if not yerel:
        if not callable(uzak_izin) or not uzak_izin(h):
            return _json(h, 403, {"hata": "Ayarlar yalnız bu bilgisayardan."})
        if yol != "/api/ayar/esitle":
            return _json(h, 403, {"hata": "Ayarlar yalnız bu bilgisayardan."})

    if yol == "/api/ayar/esitle":
        if h.command != "POST":
            return _json(h, 405, {"hata": "Desteklenmiyor."})
        if h.headers.get("X-LifeOS") != "ayar":
            return _json(h, 403, {"hata": "Yalnız LifeOS'un kendi sayfasından."})
        try:
            boy = min(int(h.headers.get("Content-Length") or 0), 512 * 1024)
            ham = h.rfile.read(boy).decode("utf-8") if boy > 0 else "{}"
            gelen = json.loads(ham or "{}")
        except (ValueError, UnicodeDecodeError):
            return _json(h, 400, {"hata": "Okunamadı."})
        if not isinstance(gelen, dict):
            return _json(h, 400, {"hata": "Geçersiz gövde."})
        try:
            sonuc = esitle(
                cihaz=gelen.get("cihaz"),
                cihaz_ad=gelen.get("cihaz_ad"),
                son=gelen.get("son"),
                gonder=gelen.get("gonder"),
                kok=kok,
            )
            return _json(h, 200, sonuc)
        except ValueError as e:
            kod = 400
            mesaj = "Geçersiz istek."
            if isinstance(e.args[0], tuple) and len(e.args[0]) >= 2:
                kod, mesaj = e.args[0][0], e.args[0][1]
            elif e.args:
                mesaj = str(e.args[0])
            return _json(h, kod, {"hata": mesaj})

    if yol == "/api/ayar":
        if h.command == "GET":
            return _json(h, 200, oku(kok))
        if h.command != "POST":
            return _json(h, 405, {"hata": "Desteklenmiyor."})
        if h.headers.get("X-LifeOS") != "ayar":
            return _json(h, 403, {"hata": "Yalnız LifeOS'un kendi sayfasından."})
        try:
            boy = min(int(h.headers.get("Content-Length") or 0), 512 * 1024)
            ham = h.rfile.read(boy).decode("utf-8") if boy > 0 else "{}"
            gelen = json.loads(ham or "{}")
        except (ValueError, UnicodeDecodeError):
            return _json(h, 400, {"hata": "Okunamadı."})
        if not isinstance(gelen.get("ayar"), dict):
            return _json(h, 400, {"hata": "ayar bekleniyor."})
        d, red = birlestir(gelen["ayar"], kok)
        return _json(h, 200, dict(d, reddedilen=red))

    return _json(h, 404, {"hata": "Bulunamadı."})
