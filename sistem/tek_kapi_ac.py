#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""LifeOS — TEK KAPIYI AC (sadelesme Faz 1 P6 tamamlama): tekkapi.ETKIN = True, tek komutla, yedekli.

    python sistem/tek_kapi_ac.py                 # = --denetle: hicbir seyi degistirmez, hazir mi soyler
    python sistem/tek_kapi_ac.py --ac            # on kosullar -> dur -> yedek -> goc -> baslangic -> karsilastir
                                                 #   -> ETKIN = True -> baslat -> dogrula; bir adim bozulursa geri
    python sistem/tek_kapi_ac.py --ac --telefon-yok   # sahibin beyani: baska hicbir cihazda veri yok
    python sistem/tek_kapi_ac.py --geri [--yedek KLASOR]   # basarili bir gecisi geri alir

Sozler:
1. Veri bu bilgisayardan cikmaz; ag istegi yalniz 127.0.0.1'e (dogrulama) ve yerel `tailscale serve status`.
2. Hicbir sey silinmez: eski moduller, kapilar, paketler, depolar yerinde kalir. Degisen her sey once yedege
   alinir (manifest + SHA-256); yerine konan dosyanin canli hali silinmez, `.tek-kapi-sonra-<an>` adini alir.
3. git'e dokunmaz; sir yazdirmaz (paketlerin icerigi ekrana gelmez, yalniz sayi, kaynak, cihaz kisaltmasi).
4. Goc paketlerden yalniz her cihazin her kaynaginin EN YENI gonderimini alir (paket cihazin butun deposudur;
   eski gonderim sonradan silinmis bir kaydi diriltirdi, ayni cihazin iki gonderimi catisma verirdi).

Sinama icin ortam: LOCALAPPDATA / USERPROFILE (goc.varsayilan yollari), LIFEOS_TKA_KOK (tekkapi.py, baslat.py,
tools/kabuk_baslangic.py'nin bulundugu agac), LIFEOS_TKA_PORT, LIFEOS_TKA_ESKI_PORTLAR, LIFEOS_TKA_EV_PORTLAR,
LIFEOS_TKA_PENCERE (masaustu surecinin adi), LIFEOS_TKA_TAILSCALE=yok, LIFEOS_TKA_TEST_HATA=<adim>.
"""
import argparse
import datetime
import hashlib
import http.client
import json
import os
import re
import shutil
import socket
import sqlite3
import subprocess
import sys
import tempfile
import time

SISTEM = os.path.dirname(os.path.abspath(__file__))
sys.dont_write_bytecode = True
sys.path.insert(0, SISTEM)
import goc  # noqa: E402
import veri  # noqa: E402

KOK = os.environ.get("LIFEOS_TKA_KOK") or os.path.dirname(SISTEM)
TEKKAPI = os.path.join(KOK, "sistem", "tekkapi.py")
BASLAT = os.path.join(KOK, "sistem", "baslat.py")
BASLANGIC = os.path.join(KOK, "tools", "kabuk_baslangic.py")


def _portlar(ad, varsayilan):
    return [int(p) for p in (os.environ.get(ad) or varsayilan).split(",") if p.strip()]


GIRIS_PORT = int(os.environ.get("LIFEOS_TKA_PORT") or 4180)
ESKI_PORTLAR = _portlar("LIFEOS_TKA_ESKI_PORTLAR", "4173,4183,4193,4200")   # uc modul + Merkez (HKM)
EV_PORTLAR = _portlar("LIFEOS_TKA_EV_PORTLAR", "5173,5183,5193,5180")      # ev agi kapilari (telefon)
PENCERE = os.environ.get("LIFEOS_TKA_PENCERE") or "LifeOS.exe"
KAYNAKLAR = ("ays", "spi", "esp", "gun")
TAZE_DK = 120          # --bekleyen-pakette beyani: paket «az once» alindi
PAY = 256 * 1024 * 1024
TELEFON_RE = re.compile(r"iphone|ipad|android|telefon|tablet|mobil", re.I)
PC_RE = re.compile(r"windows|mac|bilgisayar|\bpc\b|masaüstü|linux", re.I)
NEREDE = {"ays": "127.0.0.1:4173", "spi": "127.0.0.1:4183", "esp": "127.0.0.1:4193", "gun": "127.0.0.1:4180/kartlar/"}
AD_RE = re.compile(r"-(\d{8}-\d{6})-[0-9a-f]+\.json$")
BAYRAK_RE = re.compile(r"^ETKIN = (True|False)(?=[ \t#\r\n])", re.M)


class Durdu(Exception):
    """Bir adim tamamlanamadi; satirlar sahibine gider."""

    def __init__(self, cumle, satirlar=()):
        super().__init__(cumle)
        self.satirlar = list(satirlar)


def _sinama(adim):
    if os.environ.get("LIFEOS_TKA_TEST_HATA") == adim:
        raise Durdu("Sınama için zorlanmış hata (%s)." % adim)


def yollar():
    v = goc.varsayilan()
    yerel = os.path.join(os.environ.get("LOCALAPPDATA") or os.path.expanduser("~"), "LifeOS")
    return dict(yerel=yerel, hesap=v["hesap"], hkm=v["hkm"], paket=v["paket"], pc=v["pc"], veri=v["hedef"],
                yedek=os.path.join(yerel, "yedek"))


def sha(yol):
    return goc.dosya_ozeti(yol)


def an():
    return datetime.datetime.now().strftime("%Y%m%d-%H%M%S")


# ---------------------------------------------------------------- bayrak (tekkapi.py'deki tek satir)

def bayrak_oku(yol=None):
    """True | False | None (satir yok ya da birden cok: dosyaya dokunulmaz)."""
    try:
        with open(yol or TEKKAPI, encoding="utf-8", newline="") as f:
            bul = BAYRAK_RE.findall(f.read())
    except OSError:
        return None
    return (bul[0] == "True") if len(bul) == 1 else None


def bayrak_yaz(deger, yol=None):
    yol = yol or TEKKAPI
    with open(yol, encoding="utf-8", newline="") as f:
        metin = f.read()
    yeni, n = BAYRAK_RE.subn("ETKIN = %s" % deger, metin)
    if n != 1:
        raise Durdu("tekkapi.py'de ETKIN satırı tek değil; dosyaya dokunulmadı.")
    yarim = yol + ".tek-kapi-yaziliyor"
    with open(yarim, "w", encoding="utf-8", newline="") as f:
        f.write(yeni)
    os.replace(yarim, yol)
    if bayrak_oku(yol) is not deger:
        raise Durdu("ETKIN satırı yazıldı ama geri okunamadı.")


# ---------------------------------------------------------------- denetim parcalari

def paketler(klasor):
    """Paket klasorundeki her gonderim parcasi: {ad, kaynak, cihaz, parca, zaman, bekleyen, bayt}. Icerik okunmaz
    (yalniz ust bilgi); bicimi tanınmayan dosya «bozuk» listesine."""
    out, bozuk = [], []
    for ad in sorted(os.listdir(klasor)) if os.path.isdir(klasor) else []:
        if not ad.endswith(".json"):
            continue
        yol = os.path.join(klasor, ad)
        try:
            with open(yol, "rb") as f:
                p = json.loads(f.read().decode("utf-8"))
            if p.get("lifeos_goc") != 1 or p.get("kaynak") not in KAYNAKLAR:
                raise ValueError
        except (OSError, ValueError, AttributeError):
            bozuk.append(ad)
            continue
        m = AD_RE.search(ad)
        try:
            z = datetime.datetime.strptime(m.group(1), "%Y%m%d-%H%M%S") if m else None
        except ValueError:
            z = None
        out.append(dict(ad=ad, kaynak=p["kaynak"], cihaz=str(p.get("cihaz") or "bilinmeyen"),
                        parca=int(p.get("parca") or 1), bayt=os.path.getsize(yol),
                        zaman=z or datetime.datetime.fromtimestamp(os.path.getmtime(yol)),
                        bekleyen=sum(int(n) for n in (p.get("bekleyen") or {}).values() if isinstance(n, int))))
    return out, bozuk


def en_yeni_gonderim(liste):
    """(kaynak, cihaz) basina en yeni gonderim: en yeni 1. parca + ondan sonra gelen medya parcalari."""
    secim = {}
    for p in liste:
        if p["parca"] == 1:
            k = (p["kaynak"], p["cihaz"])
            if k not in secim or (p["zaman"], p["ad"]) > (secim[k][0]["zaman"], secim[k][0]["ad"]):
                secim[k] = [p]
    for p in liste:
        k = (p["kaynak"], p["cihaz"])
        if p["parca"] > 1 and k in secim and p["zaman"] >= secim[k][0]["zaman"]:
            secim[k].append(p)
    return secim


def hesap_bilgisi(hesap_yol):
    """hesap.db KOPYASINDAN: cihaz adlari, oturum ya da kayit izi olan cihazlar, sahip (ilk admin), dolu mu."""
    b = {"ad": {}, "iz": set(), "sahip": None, "dolu": False, "var": os.path.isfile(hesap_yol)}
    g = tempfile.mkdtemp(prefix="lifeos-tka-")
    try:
        k = goc.kopyala(hesap_yol, g)
        if not k:
            return b
        b["dolu"] = goc._hesap_dolu_mu(k) > 0
        c = sqlite3.connect(k)
        try:
            for sorgu, ad in (("SELECT cihaz, cihaz_ad FROM oturum", True), ("SELECT cihaz, ad FROM cihaz_adi", True),
                              ("SELECT DISTINCT cihaz, NULL FROM kayit", False)):
                try:
                    for cihaz, isim in c.execute(sorgu):
                        b["iz"].add(cihaz)
                        if ad and isim:
                            b["ad"][cihaz] = isim
                except sqlite3.Error:
                    pass
            try:
                b["sahip"] = c.execute("SELECT min(id) FROM kullanici WHERE rol='admin'").fetchone()[0]
            except sqlite3.Error:
                pass
        finally:
            c.close()
    finally:
        shutil.rmtree(g, ignore_errors=True)
    return b


def cihaz_turu(cihaz, hb):
    """('bilgisayar' | 'telefon' | 'bilinmiyor', aciklama)."""
    isim = hb["ad"].get(cihaz)
    if isim and TELEFON_RE.search(isim):
        return "telefon", "telefon/tablet («%s»)" % isim
    if isim and PC_RE.search(isim):
        return "bilgisayar", "bilgisayar («%s»)" % isim
    if isim:
        return "bilinmiyor", "türünü göremedim (adı «%s»)" % isim
    if cihaz not in hb["iz"]:
        # paket_kaydet oturumsuz paketi yalniz 127.0.0.1'den alir; hic oturumu olmamis cihaz bu bilgisayardir
        return "bilgisayar", "bu bilgisayar (hiç oturum açmamış; oturumsuz paket yalnız bu bilgisayardan kabul edilir)"
    return "bilinmiyor", "türünü göremedim (adı kayıtlı değil)"


def port_acik(port, sure=0.5):
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=sure):
            return True
    except OSError:
        return False


def pencere_acik():
    """Masaustu uygulamasi acik mi: True/False, bilinemezse None."""
    try:
        if os.name == "nt":
            r = subprocess.run(["tasklist", "/FI", "IMAGENAME eq %s" % PENCERE, "/NH"], capture_output=True,
                               text=True, timeout=20, creationflags=0x08000000)
            return PENCERE.lower() in (r.stdout or "").lower()
        r = subprocess.run(["pgrep", "-f", PENCERE], capture_output=True, timeout=20)
        return r.returncode == 0
    except (OSError, subprocess.SubprocessError):
        return None


def serve_durumu():
    """Tailscale serve LifeOS kapilarina bakiyor mu: ('acik'|'kapali'|'yok', cumle). Yalniz yerel CLI sorgusu."""
    if os.environ.get("LIFEOS_TKA_TAILSCALE") == "yok":
        return "yok", "Tailscale bakılmadı (sınama)"
    try:
        import uzak
        cli = uzak._cli()
        if not cli:
            return "yok", "Tailscale kurulu değil"
        r = uzak._tailscale(cli, ["serve", "status", "--json"], subprocess.run)
        web = json.loads(r.stdout or "{}").get("Web") or {}
    except Exception as e:          # okunamazsa tahmin edilmez
        return "yok", "Tailscale okunamadı (%s)" % e.__class__.__name__
    hedef = [h.get("Proxy") for s in web.values() for h in (s.get("Handlers") or {}).values()]
    bizim = sorted({x for x in hedef if x and re.match(r"^http://127\.0\.0\.1:\d+$", x)
                    and int(x.rsplit(":", 1)[1]) in ESKI_PORTLAR + [GIRIS_PORT]})
    if bizim:
        return "acik", "Tailscale serve LifeOS kapılarına yönlendiriyor (%s)" % ", ".join(b.rsplit(":", 1)[1] for b in bizim)
    return "kapali", "Tailscale serve LifeOS'a yönlendirmiyor"


def yedek_girdileri(y):
    """[(yedekteki ad, canli yol)]: gecisin dokunabilecegi ve gocun okudugu her dosya."""
    out = []
    for kume, temel in (("hesap", y["hesap"]), ("hkm", y["hkm"])):
        for ek in ("", "-wal", "-shm", "-journal"):
            if os.path.isfile(temel + ek):
                out.append(("%s/%s" % (kume, os.path.basename(temel) + ek), temel + ek))
    agaclar = [("veri", y["veri"]), ("paket", y["paket"])] + [("pc/" + a, os.path.join(y["pc"], a))
                                                              for a in ("ayar.json", "planlama.json", "ice", "muzik", "zemin", "telefon")]
    for ad, kok in agaclar:
        if os.path.isfile(kok):
            out.append((ad, kok))
        for d, _, adlar in sorted(os.walk(kok)) if os.path.isdir(kok) else []:
            for a in sorted(adlar):
                tam = os.path.join(d, a)
                out.append((ad + "/" + os.path.relpath(tam, kok).replace(os.sep, "/"), tam))
    out.append(("kod/tekkapi.py", TEKKAPI))
    return out


def denetle(y=None, telefon_yok=False, simdi=None):
    """Hicbir seyi degistirmez. Doner: {satirlar, eksik, secim, hb, ...}."""
    y = y or yollar()
    simdi = simdi or datetime.datetime.now()
    s, eksik = [], []
    liste, bozuk = paketler(y["paket"])
    hb = hesap_bilgisi(y["hesap"])
    secim = en_yeni_gonderim(liste)
    s.append("Paket klasörü: %s (%d dosya)" % (y["paket"], len(liste) + len(bozuk)))
    cihazlar = sorted({c for _, c in secim} | {p["cihaz"] for p in liste})
    tur = {c: cihaz_turu(c, hb) for c in cihazlar}
    taze = lambda p: (simdi - p["zaman"]).total_seconds() <= TAZE_DK * 60
    for c in cihazlar:
        s.append("- Cihaz %s… · %s" % (c[:8], tur[c][1]))
        for k in KAYNAKLAR:
            g = secim.get((k, c))
            if g:
                s.append("    %s: en yeni gönderim %s%s, %d parça, sunucuya gitmemiş %d değişiklik"
                         % (k, g[0]["zaman"].strftime("%d.%m.%Y %H:%M"), "" if taze(g[0]) else " (eski)", len(g), g[0]["bekleyen"]))
    if not cihazlar:
        s.append("- Hiç göç paketi yok.")
    for ad in bozuk:
        eksik.append("bozuk ya da tanınmayan paket: %s (göç durur; dosyayı incele, silmeden kenara al)" % ad)
    pc = [c for c in cihazlar if tur[c][0] == "bilgisayar"]
    tanimadim = not pc and any(tur[c][0] == "bilinmiyor" for c in cihazlar)
    if tanimadim:
        eksik.append("bu bilgisayarın paketlerini tanıyamadım: bu bilgisayarda Hesap'a giriş yapıp dört yerde"
                     " «Bilgisayara gönder»e bas (giriş bu cihazı «Windows PC» diye tanıtır; göndermeden sonra çıkış yapma)")
    for k in () if tanimadim else KAYNAKLAR:
        g = [secim[(k, c)][0] for c in pc if (k, c) in secim]
        if not g:
            eksik.append("bu bilgisayardan «%s» paketi yok (%s › Hesap › «Bilgisayara gönder»)" % (k, NEREDE[k]))
        elif not any(taze(p) for p in g):
            eksik.append("bu bilgisayarın «%s» paketi %d dakikadan eski; yeniden gönder" % (k, TAZE_DK))
    baska = [c for c in cihazlar if tur[c][0] != "bilgisayar"]
    taze_baska = [c for c in baska if any(taze(secim[(k, c)][0]) for k in KAYNAKLAR if (k, c) in secim)]
    if taze_baska:
        s.append("Telefon/tablet paketi: var (%s)." % ", ".join("%s… %s" % (c[:8], tur[c][1]) for c in taze_baska))
    elif baska:
        s.append("Telefon/tablet (ya da türü görülemeyen cihaz) paketi: yalnız %d dakikadan eski paket var." % TAZE_DK)
    else:
        s.append("Telefon/tablet paketi: yok.")
    if any(tur[c][0] == "bilinmiyor" for c in cihazlar):
        s.append("Uyarı: bazı cihazların türünü göremedim; telefon sayıldılar.")
    ev = [p for p in EV_PORTLAR if port_acik(p)]
    sd, scumle = serve_durumu()
    s.append("Ev ağı kapıları: %s." % ("açık (%s), bir telefon kullanılıyor olabilir" % ", ".join(map(str, ev)) if ev else "kapalı"))
    s.append(scumle + (", bir telefon kullanılıyor olabilir." if sd == "acik" else "."))
    if not taze_baska and not telefon_yok:
        eksik.append("telefon/tablet paketi yok: telefonda LifeOS'a gir, «Bilgisayara gönder»e bas; ya da hiçbir"
                     " cihazda veri yoksa --telefon-yok")
    elif not taze_baska:
        s.append("Sahibin beyanı (--telefon-yok): bu bilgisayardan başka hiçbir cihazda LifeOS verisi yok.")
    calisan = port_acik(GIRIS_PORT)
    pen = pencere_acik()
    s.append("LifeOS sunucusu: %s. Uygulama penceresi: %s." % ("çalışıyor (%d)" % GIRIS_PORT if calisan else "kapalı",
             {True: "açık", False: "kapalı", None: "göremedim"}[pen]))
    if pen is not False:
        eksik.append("LifeOS penceresi açık (ya da göremedim): paketleri gönderdikten sonra pencereyi kapat; sonra"
                     " yazılan değişiklik eski adreste kalırdı")
    b = bayrak_oku()
    s.append("Tek kapı bayrağı (%s): %s." % (TEKKAPI, {True: "AÇIK", False: "kapalı", None: "okunamadı"}[b]))
    if b is not False:
        eksik.append("tek kapı zaten açık (geri dönmek için --geri)" if b else "tekkapi.py'de ETKIN satırı bulunamadı")
    s.append("Hesap deposu: %s; sahip hesabı %s." % ("dolu" if hb["dolu"] else "boş ya da yok", "var" if hb["sahip"] else "yok"))
    if not hb["dolu"]:
        eksik.append("hesap deposu (hesap.db) boş ya da yok: yedekten göç sahibinin ayrı kararı")
    if not hb["sahip"]:
        eksik.append("hesap deposunda sahip (admin) hesabı yok: karşılaştırma yapılamaz")
    if os.path.isfile(os.path.join(y["veri"], "lifeos.db")):
        s.append("Deneme deposu var (%s); geçişte kenara alınır (silinmez), en yeni paketlerle yeniden göç edilir." % y["veri"])
    if not shutil.which("node"):
        eksik.append("node bulunamadı (kabuk başlangıç paketi için gerekir)")
    gerek = 2 * sum(os.path.getsize(t) for _, t in yedek_girdileri(y) if os.path.isfile(t)) + PAY
    try:
        bos = shutil.disk_usage(y["yerel"] if os.path.isdir(y["yerel"]) else os.path.dirname(y["yerel"])).free
    except OSError:
        bos = 0
    s.append("Boş disk: %.1f GB; yedek ve göç için gereken yaklaşık %.0f MB." % (bos / 1e9, gerek / 1e6))
    if bos < gerek:
        eksik.append("diskte yer yetmiyor (%.0f MB gerekli)" % (gerek / 1e6))
    s.append("")
    s.append("Karar: Hazır." if not eksik else "Karar: Hazır değil. Eksik:")
    s += ["- " + x for x in eksik]
    secili = [p for c in cihazlar for k in KAYNAKLAR for p in secim.get((k, c), [])]
    return dict(satirlar=s, eksik=eksik, secili=secili, hb=hb, calisan=calisan)


# ---------------------------------------------------------------- adimlar

def _baslat(*arg, sure=180):
    ortam = dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUTF8="1", PYTHONDONTWRITEBYTECODE="1")
    try:
        r = subprocess.run([sys.executable, BASLAT] + list(arg), cwd=KOK, env=ortam, capture_output=True,
                           text=True, encoding="utf-8", errors="replace", timeout=sure)
        return r.returncode, (r.stdout or "") + (r.stderr or "")
    except (OSError, subprocess.SubprocessError) as e:
        return None, str(e)


def durdur():
    _baslat("--dur")
    son = time.time() + 20
    while time.time() < son:
        acik = [p for p in [GIRIS_PORT] + ESKI_PORTLAR if port_acik(p, 0.3)]
        if not acik:
            return
        time.sleep(0.5)
    raise Durdu("LifeOS durmadı; hâlâ cevap veren kapılar: %s." % ", ".join(map(str, acik)))


def baslat():
    kod, cikti = _baslat("--tarayicisiz")
    son = time.time() + 30
    while time.time() < son and not port_acik(GIRIS_PORT, 0.5):
        time.sleep(0.5)
    if not port_acik(GIRIS_PORT):
        raise Durdu("LifeOS açılmadı (%d cevap vermiyor)." % GIRIS_PORT, cikti.strip().splitlines()[-3:])


def _iste(yol):
    c = http.client.HTTPConnection("127.0.0.1", GIRIS_PORT, timeout=10)
    try:
        c.request("GET", yol)
        r = c.getresponse()
        r.read()
        return r.status, r.getheader("Location") or "", r.getheader("Content-Type") or ""
    except (OSError, http.client.HTTPException) as e:
        return None, str(e), ""
    finally:
        c.close()


def dogrula_tek():
    """4180 kabugu verir, /ays/ /spi/ /esp/ cevap verir. Doner: bilgi satirlari."""
    son, sorun = time.time() + 30, []
    while time.time() < son:
        sorun = []
        k, yer, _ = _iste("/")
        if not (k == 302 and yer.startswith("/kabuk/")):
            sorun.append("kök / yeni kabuğa yönlenmiyor (%s %s)" % (k, yer))
        k, _, tur = _iste("/kabuk/")
        if not (k == 200 and tur.startswith("text/html")):
            sorun.append("/kabuk/ açılmıyor (%s)" % k)
        for m in ("ays", "spi", "esp"):
            k, _, _ = _iste("/%s/" % m)
            if k != 200:
                sorun.append("/%s/ cevap vermiyor (%s)" % (m, k))
        if not sorun:
            break
        time.sleep(1)
    if sorun:
        raise Durdu("Tek kapı doğrulanamadı.", sorun)
    hkm, _, _ = _iste("/api/hkm/health")
    eski = [p for p in ESKI_PORTLAR if port_acik(p, 0.3)]
    return ["Merkez (/api/hkm/): %s." % ("cevap veriyor" if hkm == 200 else "kapalı (%s); modüller etkilenmez" % hkm),
            "Eski kapılar: %s." % ("hâlâ açık: " + ", ".join(map(str, eski)) if eski else "kapalı")]


def dogrula_eski():
    kapali = [p for p in [GIRIS_PORT] + ESKI_PORTLAR[:3] if not port_acik(p, 1.0)]
    return "Eski düzen çalışıyor." if not kapali else "Eski düzende cevap vermeyen kapı: %s." % ", ".join(map(str, kapali))


def yedek_al(y, klasor):
    """Yedegi alir, her kopyayi geri okuyup SHA-256 ile denetler, en son manifest yazar. Doner: manifest."""
    os.makedirs(klasor)                                  # var olan klasore yazmaz
    girdi = yedek_girdileri(y)
    gerek = sum(os.path.getsize(t) for _, t in girdi) + PAY
    if shutil.disk_usage(klasor).free < gerek:
        raise Durdu("Diskte yer yetmiyor (%.0f MB gerekli)." % (gerek / 1e6))
    dosyalar = []
    for ad, asil in girdi:
        hedef = os.path.join(klasor, *ad.split("/"))
        os.makedirs(os.path.dirname(hedef), exist_ok=True)
        once = sha(asil)
        shutil.copy2(asil, hedef)
        if sha(hedef) != once or sha(asil) != once:
            raise Durdu("Yedek kopyası tutmadı: %s." % ad)
        dosyalar.append({"ad": ad, "asil": asil, "boyut": os.path.getsize(hedef), "sha256": once})
    m = {"lifeos_tek_kapi_yedek": 1, "olusturma": datetime.datetime.now().isoformat(timespec="seconds"),
         "kok": KOK, "dosyalar": dosyalar}
    with open(os.path.join(klasor, "manifest.json.yarim"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(m, f, ensure_ascii=False, indent=1)
    os.replace(os.path.join(klasor, "manifest.json.yarim"), os.path.join(klasor, "manifest.json"))
    return m


def durum_yaz(klasor, d):
    with open(os.path.join(klasor, "durum.json.yarim"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
    os.replace(os.path.join(klasor, "durum.json.yarim"), os.path.join(klasor, "durum.json"))


def kenara(yol, ek):
    """Yolu silmeden yanina tasir. Doner: yeni ad."""
    yeni = "%s.%s-%s" % (yol, ek, an())
    while os.path.exists(yeni):
        yeni += "x"
    os.rename(yol, yeni)
    return yeni


def manifestten_onar(m, klasor, haric=("veri/", "paket/")):
    """Canli hali yedekten farkli (ya da yok) her dosyayi yedekten geri koyar; farkli canli hal kenara alinir.
    SQLite ailesi (db, -wal, -shm, -journal) birlikte: yabanci bir -wal geri konan dosyaya uygulanmasin.
    paket/ ve veri/ haric: paketlere yazilmaz, veri klasor olarak yer degistirir. Doner: geri konanlar."""
    girdiler = [d for d in m["dosyalar"] if not d["ad"].startswith(haric)]
    aile = {}
    for d in girdiler:
        aile.setdefault(re.sub(r"-(wal|shm|journal)$", "", d["asil"]), []).append(d)
    onarilan = []
    for temel, uyeler in aile.items():
        kume = [temel + ek for ek in ("", "-wal", "-shm", "-journal")] if temel.endswith(".db") else [temel]
        farkli = any(not os.path.isfile(d["asil"]) or sha(d["asil"]) != d["sha256"] for d in uyeler) \
            or any(os.path.isfile(k) and k not in {d["asil"] for d in uyeler} for k in kume)
        if not farkli:
            continue
        for k in kume:
            if os.path.isfile(k):
                kenara(k, "tek-kapi-sonra")
        for d in uyeler:
            os.makedirs(os.path.dirname(d["asil"]), exist_ok=True)
            shutil.copy2(os.path.join(klasor, *d["ad"].split("/")), d["asil"])
            onarilan.append(d["ad"])
    return onarilan


def goc_yap(y, klasor, secili, d):
    """Deneme deposu kenara, secili paketlerle gercek goc (goc.gercek: donus noktasi, iki kuru kosu, geri donus
    denemesi). Doner: (goc_id, satirlar)."""
    girdi = os.path.join(klasor, "goc-girdi", "paket")
    os.makedirs(girdi)
    for p in secili:
        shutil.copy2(os.path.join(y["paket"], p["ad"]), os.path.join(girdi, p["ad"]))
    if os.path.exists(y["veri"]):
        d["veri_onceki"] = kenara(y["veri"], "deneme")
        durum_yaz(klasor, d)
    d["veri_tasindi"] = True                             # bundan sonra veri/ bu gecisindir
    kod, satir = goc.gercek(y["veri"], os.path.join(klasor, "goc-p6"), y["hesap"], y["hkm"], girdi, y["pc"],
                            bekleyen_pakette=True)
    if kod:
        raise Durdu("Göç tamamlanmadı.", satir)
    gid = next((x.split("`")[1] for x in satir if "göç kimliği `" in x), "")
    return gid, satir


def baslangic_yap(y):
    db = os.path.join(y["veri"], "lifeos.db")
    try:
        r = subprocess.run([sys.executable, BASLANGIC, "--depo", db, "--cikti", os.path.join(y["veri"], "kabuk-baslangic.json")],
                           cwd=KOK, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=600,
                           env=dict(os.environ, PYTHONIOENCODING="utf-8"))
    except (OSError, subprocess.SubprocessError) as e:
        raise Durdu("Kabuk başlangıç paketi üretilemedi (%s)." % e.__class__.__name__)
    if r.returncode:
        raise Durdu("Kabuk başlangıç paketi üretilemedi (çıkış %d)." % r.returncode)
    return (r.stdout or "").splitlines()[:1]


def karsilastir_yap(y, klasor, sahip):
    """veri.karsilastir; tek kabul edilen fark: tek depodaki deger ayni cihazin paketinden geldi (goc.sec kurali:
    paket cihazin son hali, sunucu kopyasi eski). Baska her fark gecisi durdurur."""
    g = tempfile.mkdtemp(prefix="lifeos-tka-k-")
    try:
        kopya = goc.kopyala(os.path.join(klasor, "hesap", os.path.basename(y["hesap"])), g)
        dp = veri.Depo(y["veri"])
        try:
            fark = veri.karsilastir(kopya, dp, sahip)
            acik = []
            for kimlik, neden in fark:
                r = dp.c.execute("SELECT kaynak FROM kayit WHERE id=?", (kimlik,)).fetchone()
                if not (neden == "farklı" and r and r[0] in ("paket", "gun")):
                    acik.append("%s (%s)" % (kimlik, neden))
        finally:
            dp.kapat()
    finally:
        shutil.rmtree(g, ignore_errors=True)
    if acik:
        raise Durdu("Tek depo hesap deposuyla tutmuyor: %d açıklanamayan fark." % len(acik), acik[:10])
    return ["veri.karsilastir: %d fark; hepsi cihazın paketindeki daha yeni hâl (paket kazanır kuralı)." % len(fark)
            if fark else "veri.karsilastir: 0 fark."]


def gec(adimlar, geri_islemleri, son_baslat_eski=True):
    """Adimlari sirayla kosar; biri durursa: LifeOS'u durdurur, geri islemlerini tersten kosar, eski duzeni
    baslatir. Doner: (kod, satirlar)."""
    s = []
    for ad, fn in adimlar:
        try:
            s += ["✓ " + ad] + ["    " + x for x in (fn() or [])]
            _sinama(ad)
        except (Exception, SystemExit, KeyboardInterrupt) as e:     # beklenmeyen hata da geri alir
            s += ["✕ %s: %s" % (ad, e)] + ["    " + x for x in getattr(e, "satirlar", [])]
            s += ["", "Geri alınıyor:"]
            try:
                durdur()
            except Durdu as e2:
                s.append("- " + str(e2))
            for gad, gfn in reversed(geri_islemleri):
                try:
                    s.append("- %s: %s" % (gad, gfn() or "tamam"))
                except Exception as e3:      # biri bozulsa da otekiler denenir
                    s.append("- %s BOZULDU: %s" % (gad, e3))
            if son_baslat_eski:
                try:
                    baslat()
                    s.append("- " + dogrula_eski())
                except Durdu as e4:
                    s.append("- Eski düzen açılamadı: %s Elle: python sistem/baslat.py" % e4)
            return 1, s
    return 0, s


SAHIBIN_GORECEGI = """
Sahibin göreceği:
- LifeOS tek adreste: http://127.0.0.1:%(p)d açılınca yeni kabuk gelir. Eski giriş /kartlar/, Ana sayfa /gun/,
  modüller /ays/ /spi/ /esp/ altında; Merkez aynı süreçte (/api/hkm/).
- Modülü yeni adreste ilk açışta eski kayıtları bu bilgisayardaki paketten oraya yazılır (var olanın üstüne yazmaz).
- 4173, 4183, 4193, 4200 ve ev ağı kapıları kapalı. Eski adreslerdeki tarayıcı verisi silinmedi, yerinde duruyor.
- Telefon: Tailscale serve hâlâ eski kapılara bakıyor olabilir; telefonu tek kapıya bağlamak için
  python sistem/uzak.py --ac   (bu komut ağ ayarına dokunmaz).
- «Güncelle», ETKIN satırı main'e işlenene kadar bu klasörde «elle değiştirilmiş dosya» der.
- Geri dönmek için: python sistem/tek_kapi_ac.py --geri
"""


def ac(telefon_yok=False):
    y = yollar()
    dn = denetle(y, telefon_yok)
    s = ["LifeOS tek kapıyı açma", ""] + dn["satirlar"]
    if dn["eksik"]:
        return 1, s + ["", "Hiçbir şey değiştirilmedi."]
    klasor = os.path.join(y["yedek"], "tek-kapi-" + an())
    d = {"lifeos_tek_kapi": 1, "basla": datetime.datetime.now().isoformat(timespec="seconds"), "tamam": False,
         "veri_onceki": None, "telefon_yok": bool(telefon_yok), "goc_id": None}
    mf, geri = {}, []

    def veri_geri():
        out = []
        if d.get("veri_tasindi") and os.path.exists(y["veri"]):       # yalniz bu gecisin yazdigi depo
            out.append("yeni depo kenara: " + kenara(y["veri"], "basarisiz"))
        if d.get("veri_onceki") and os.path.exists(d["veri_onceki"]):
            os.rename(d["veri_onceki"], y["veri"])
            out.append("deneme deposu yerine kondu")
        return "; ".join(out) or "değişen yok"

    def adim_yedek():
        mf.update(yedek_al(y, klasor))
        durum_yaz(klasor, d)
        geri.append(("Dosyalar yedekten", lambda: ", ".join(manifestten_onar(mf, klasor)) or "hepsi yedekle aynı"))
        return ["Yedek: %s (%d dosya, manifest + SHA-256)" % (klasor, len(mf["dosyalar"]))]

    def adim_goc():
        geri.append(("Tek depo", veri_geri))
        d["goc_id"], satir = goc_yap(y, klasor, dn["secili"], d)
        durum_yaz(klasor, d)
        return ["Göç kimliği %s, %d paket (her cihazın her kaynağının en yeni gönderimi)." % (d["goc_id"], len(dn["secili"]))] \
            + [x for x in satir if x.startswith(("Geri dönüş kopyada", "veri.karsilastir", "Cihazlarda"))]

    def adim_bayrak():
        geri.append(("ETKIN satırı", lambda: bayrak_yaz(False) or "ETKIN = False"))
        bayrak_yaz(True)

    adimlar = [("LifeOS durdu", durdur), ("Yedek alındı", adim_yedek), ("Göç yapıldı", adim_goc),
               ("Kabuk başlangıç paketi", lambda: baslangic_yap(y)),
               ("Karşılaştırma temiz", lambda: karsilastir_yap(y, klasor, dn["hb"]["sahip"])),
               ("ETKIN = True", adim_bayrak), ("LifeOS açıldı", baslat), ("Doğrulandı", dogrula_tek)]
    kod, satir = gec(adimlar, geri)
    s += [""] + satir
    if kod:
        if os.path.isdir(klasor):
            d["hata"] = next((x for x in satir if x.startswith("✕")), "")
            durum_yaz(klasor, d)
        return 1, s + ["", "Tek kapı AÇILMADI; eski düzen yerinde. Yedek: %s" % (klasor if os.path.isdir(klasor) else "alınmadı")]
    d.update(tamam=True, bitis=datetime.datetime.now().isoformat(timespec="seconds"))
    durum_yaz(klasor, d)
    return 0, s + ["", "Tek kapı açıldı. Yedek: " + klasor, SAHIBIN_GORECEGI.rstrip() % {"p": GIRIS_PORT}]


def geri_al(yedek=None):
    y = yollar()
    if bayrak_oku() is not True:
        return 1, ["Tek kapı açık değil (ETKIN satırı True değil); geri alınacak bir şey yok."]
    adaylar = [yedek] if yedek else sorted((os.path.join(y["yedek"], a) for a in (os.listdir(y["yedek"]) if os.path.isdir(y["yedek"]) else [])
                                           if a.startswith("tek-kapi-")), reverse=True)
    klasor, d = None, None
    for k in adaylar:
        try:
            with open(os.path.join(k, "durum.json"), encoding="utf-8") as f:
                v = json.load(f)
        except (OSError, ValueError):
            continue
        if v.get("tamam") and not v.get("geri_alindi"):
            klasor, d = k, v
            break
    if not klasor or not os.path.isfile(os.path.join(klasor, "manifest.json")):
        return 1, ["Başarılı bir tek kapı geçişinin yedeği bulunamadı (%s)." % y["yedek"]]
    s = ["LifeOS tek kapıdan eski düzene dönüş", "Yedek: " + klasor, ""]
    tasinan = {}

    def adim_veri():
        out = []
        if os.path.exists(y["veri"]):
            tasinan["yeni"] = kenara(y["veri"], "tek-kapi")
            out.append("tek kapı deposu kenara: " + tasinan["yeni"])
        if d.get("veri_onceki") and os.path.exists(d["veri_onceki"]):
            os.rename(d["veri_onceki"], y["veri"])
            tasinan["onceki"] = True
            out.append("geçiş öncesi deneme deposu yerine kondu")
        return out

    def veri_ileri():
        if tasinan.get("onceki"):
            os.rename(y["veri"], d["veri_onceki"])
        if tasinan.get("yeni"):
            os.rename(tasinan["yeni"], y["veri"])
        return "tek kapı deposu yerine kondu"

    geri = []

    def adim_bayrak():
        geri.append(("ETKIN satırı", lambda: bayrak_yaz(True) or "ETKIN = True"))
        bayrak_yaz(False)

    def adim_veri_kayitli():
        geri.append(("Tek depo", veri_ileri))
        return adim_veri()

    def ileri_baslat():
        baslat()
        return "tek kapı yeniden açıldı"

    adimlar = [("LifeOS durdu", durdur), ("ETKIN = False", adim_bayrak), ("Tek depo eski hâline", adim_veri_kayitli),
               ("LifeOS açıldı", baslat), ("Eski düzen doğrulandı", _eski_sart)]
    kod, satir = _gec_geri(adimlar, geri, ileri_baslat)
    s += satir
    if kod:
        return 1, s + ["", "Geri dönüş YAPILMADI; tek kapı yerinde."]
    d.update(geri_alindi=datetime.datetime.now().isoformat(timespec="seconds"))
    durum_yaz(klasor, d)
    return 0, s + ["", "Eski düzen geri geldi: 4180 giriş, 4173/4183/4193 modüller, 4200 Merkez.",
                   "hesap.db, hkm.db ve paketler yedekten geri KONMADI: geçişten sonra yazılanları taşıyorlar.",
                   "Tek kapıdayken modüllerde yapılıp hesaba eşitlenmemiş değişiklikler 127.0.0.1:%d kökeninde kalır;"
                   " eski adreste görünmez, silinmez (tekrar --ac ile görünür)." % GIRIS_PORT]


def _eski_sart():
    satir = dogrula_eski()
    if not satir.startswith("Eski düzen çalışıyor"):
        raise Durdu(satir)
    return [satir]


def _gec_geri(adimlar, geri, ileri_baslat):
    """--geri: bir adim durursa tek kapi geri kurulur (gec'in son baslatmasi tek kapiyi acar)."""
    kod, s = gec(adimlar, geri, son_baslat_eski=False)
    if kod:
        try:
            s.append("- " + ileri_baslat())
        except Durdu as e:
            s.append("- LifeOS açılamadı: %s Elle: python sistem/baslat.py" % e)
    return kod, s


def main(argv=None):
    for akis in (sys.stdout, sys.stderr):
        try:
            akis.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    ap = argparse.ArgumentParser(description="LifeOS tek kapıyı aç (P6). Varsayılan: --denetle, hiçbir şeyi değiştirmez.")
    kip = ap.add_mutually_exclusive_group()
    kip.add_argument("--denetle", action="store_true", help="hazır mı söyler (varsayılan)")
    kip.add_argument("--ac", action="store_true", help="yedek, göç, doğrulama ile tek kapıyı açar; bozulursa geri alır")
    kip.add_argument("--geri", action="store_true", help="başarılı bir geçişi yedeğinden geri alır")
    ap.add_argument("--telefon-yok", action="store_true",
                    help="sahibin beyanı: bu bilgisayardan başka hiçbir cihazda (telefon, tablet) LifeOS verisi yok")
    ap.add_argument("--yedek", help="--geri ile: kullanılacak yedek klasörü")
    a = ap.parse_args(argv)
    if a.ac:
        kod, s = ac(a.telefon_yok)
    elif a.geri:
        kod, s = geri_al(a.yedek)
    else:
        dn = denetle(telefon_yok=a.telefon_yok)
        kod, s = (0 if not dn["eksik"] else 1), ["LifeOS tek kapı denetimi (hiçbir şeyi değiştirmez)", ""] + dn["satirlar"]
        s += ["", "--telefon-yok şu demektir: telefonda ya da tablette LifeOS'ta hiç kayıt yok (ya da kaybı göze"
              " alıyorsun); onların eski adreslerdeki verisi tek depoya taşınmaz, telefon tek kapıya bağlanınca boş başlar."]
    print("\n".join(s))
    return kod


if __name__ == "__main__":
    raise SystemExit(main())
