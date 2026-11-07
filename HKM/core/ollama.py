# -*- coding: utf-8 -*-
"""Ollama — bilgisayardaki yerel modeli KENDILIGINDEN bulmak ve baglamak
   (kullanici, 2026-10-19: «kendisi tanisin, kendisi tarasin»; simdilik
   yalniz Ollama).

   Elle yol vardi (Ayarlar → Motor servisi: adres, «sina», sinif kutulari,
   «kaydet»). Bu modul o dort adimi tek onaya, acik ayarla sifira indirir.

   Bes kural:

   1. TARAMA PARA HARCAMAZ VE MODEL CAGIRMAZ. Ollama'nin model listesi
      (`/api/tags`) okunur; sohbet ucuna tek istek gitmez.
   2. KURMAZ, INDIRMEZ. Ollama yoksa ya da model indirilmemisse bu
      ADIYLA soylenir ve ne yapilacagi yazilir; program kurmak ve
      gigabaytlik model indirmek kullanicinin kararidir.
   3. ONERIYI KOD KURAR. Gomme (embedding) modeli sohbet modeli degildir,
      elenir. Ekonomik sinif: 9 milyar parametreye kadar olan en buyugu
      (yoksa en kucugu); standart: ondan buyuk, 40 milyara kadar olan en
      buyugu. Parametre bilinmiyorsa dosya boyutu kullanilir.
   4. KENDILIGINDEN BAGLAMA KUCUK AKSIYONDUR (AGENTS.md §1.9): yalniz HIC
      yerel model yazilmamissa, `ollama.kendiligi` aciksa ve kullanici
      daha once geri almadiysa yapilir; ekranda «Geri al» kalir. Elle
      yazilmis bir secim ASLA ezilmez. Geri alinca bir daha kendiliginden
      baglanmaz (elle «Bagla» yine calisir).
   5. CALISMA YERI. Bulut seciliyse ve bulut anahtari (OpenRouter) varsa
      «hibrit», yoksa «yerel» olur; yerel/hibrit secimine dokunulmaz.
      Guclu ve Uzman sinif her zaman buluttadir (core/models.py).
   6. SICAK TUTMA (kullanici, 2026-10-19: King'in ilk cevabi yavas
      basliyordu). Bagli ekonomik model ISIT_ARALIK'ta bir Ollama'ya
      «bellekte kalsin» denir (/api/generate, istem bos: model yuklenir,
      metin uretilmez, para ve jeton harcanmaz). `ollama.sicak` false ise
      yapilmaz. Bellek darsa (oyun) yapilmaz, gomme modeli de yuklenmez: model
      oyunla yarismaz, bellekteyse suresi dolunca iner; soran kullanici yine bekler.

   7. ROLLER (2026-10-20, King 2.0 A). Gorsel uzman model (adinda «-vl»,
      «vision», «llava»…) metin sinifina onerilmez, «gorsel» olarak onerilir;
      gomme modeli «gomme» olarak taninir (anlamsal hafiza). Ekonomik sinifta
      TERCIH listesindeki model (bu donanimda olculen: gemma4:e2b) varsa o
      onerilir. Baglama bunlari da yazar; bagliyken oneri farkliysa kart
      «Önerilenle bağla»yi yine gosterir (elle secim yine ezilmez).

   8. UYANDIRMA (Olcum 6, 2026-11-05: defterde 16 cagrinin 15'i «baglanti
      reddedildi»; King gunlerce modelsiz kaldi, her mesaj 2 sn bekledi). Yerel
      model cagrilirken Ollama KAPALIYSA ve adres bu makineyse `ollama serve`
      bir kez acilir, istek yinelenir. `ollama.baslat` false ise yapilmaz. Kurulu
      degilse ya da acilmadiysa KAPALI_ARA boyunca denenmez: kural motoru hemen
      konusur.

   «Bagli» yalniz model listesinin okunabildigini soyler; sohbetin gercekten
   calistigini soylemez (kullanici, 2026-10-19: «ayarlarda bagli gorunuyor
   ama mesaj uretilmiyor»). Bu yuzden kart, yerel modelin defterdeki SON
   GERCEK sohbet cagrisini da yazar (son_cagri): ne zaman, cevap geldi mi,
   gelmediyse neden — adiyla."""
import atexit
import datetime
import json
import os
import re
import shutil
import subprocess
import threading
import time
import urllib.request

from core import kendiliginden as _kendi  # ayni adli fonksiyon asagida (bulunca bagla)
from core import models

VARSAYILAN = {"kendiligi": True, "sicak": True, "baslat": True}
ALANLAR = {"kendiligi": bool, "sicak": bool, "baslat": bool}
ISIT_ARALIK = 20 * 60
ISIT_SURE = "30m"
EKONOMIK_UST = 9.0       # milyar parametre
STANDART_UST = 40.0
ZAMAN_ASIMI = 3
GOMME = re.compile(r"embed|bge|minilm|rerank", re.I)
GORSEL = re.compile(r"(?:^|[-_/.])vl(?:[-_:.]|$)|vision|llava|moondream|minicpm-v", re.I)
# Ekonomik sinifta once bunlar (sira onemli); yoksa kural 3.
EKONOMIK_TERCIH = ("gemma4:e2b",)
# gemma4 gorseli de okur ve sohbet icin zaten GPU'da durur; 6 GB'ta ikinci model onu atiyordu.
# Olcum 2b (2026-11-01): fis qwen3-vl 0/3 (bos cevap, dusunme kapanmiyor), gemma4 2/3.
GORSEL_TERCIH = ("gemma4:e2b", "qwen3-vl:4b")
GOMME_TERCIH = ("qwen3-embedding:0.6b",)
ROL_ADI = {"ekonomik": "Ekonomik", "standart": "Standart", "gorsel": "Görsel", "gomme": "Gömme"}
GOMME_AILE = ("bert", "nomic-bert", "xlm-roberta")
DURUM_AD = {"kapali": "Ollama bulunamadı", "bos": "Model indirilmemiş", "bulundu": "Bulundu",
            "bagli": "Bağlı", "eksik": "Bağlı model yok"}


def settings(cfg):
    out = dict(VARSAYILAN)
    gelen = (cfg or {}).get("ollama")
    if isinstance(gelen, dict):
        for k, tip in ALANLAR.items():
            if isinstance(gelen.get(k), tip):
                out[k] = gelen[k]
    return out


def validate(patch):
    if not isinstance(patch, dict):
        return False, ["ollama bir nesne olmalı"]
    hata = []
    for k, v in patch.items():
        tip = ALANLAR.get(k)
        if tip is None:
            hata.append("bilinmeyen Ollama ayarı: %s" % k)
        elif not isinstance(v, tip):
            hata.append("ollama.%s true ya da false olmalı" % k)
    return (not hata), hata


# Olcum (Ollama gunlugu, 2026-11-06, oyun acik/kapali): bos sanal bellek (RAM + takas) 0,9-5,5 GiB iken
# yukleme «out of memory» ile dustu; 6,8 GiB ve ustunde oldu. VRAM belirleyici degil (4,5 GiB bostu);
# num_ctx de degil (8192 -> 2048: yalniz 29 MiB). Tek gunluk olcum, esik buna gore.
BELLEK_ALT = 6144                   # MiB


def bellek_bos_mb(fiziksel=False):
    """Bos sanal bellek (MiB; `fiziksel`: bos RAM); Windows disinda ya da okunamazsa None."""
    try:
        import ctypes

        class Durum(ctypes.Structure):
            _fields_ = [("uzunluk", ctypes.c_ulong), ("yuk", ctypes.c_ulong)] + [
                (a, ctypes.c_ulonglong) for a in ("t_fiz", "b_fiz", "t_sayfa", "b_sayfa", "t_san", "b_san", "ek")]
        d = Durum()
        d.uzunluk = ctypes.sizeof(Durum)
        return (d.b_fiz if fiziksel else d.b_sayfa) // (1024 * 1024) if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(d)) else None
    except (ImportError, AttributeError, OSError):
        return None


VARSAYILAN_BELLEK = bellek_bos_mb   # testler makineye bagli kalmaz (tests/harness.py)
VARSAYILAN_RAM = lambda: bellek_bos_mb(True)   # noqa: E731
# Ikinci model (qwen3-vl 3,9 GiB) ancak bu kadar bos RAM varken yuklenir: takas dosyasi 30 GiB'ken bos sanal
# bellek 12 GiB gorunup bos RAM 3 GiB kalabiliyordu (olcum 2026-11-07).
IKINCI_MODEL_RAM = 6144             # MiB


def bellek_dar():
    b = VARSAYILAN_BELLEK()
    return b is not None and b < BELLEK_ALT


def _getir(url, timeout):
    istek = urllib.request.Request(url, headers={"Accept": "application/json"}, method="GET")
    with urllib.request.urlopen(istek, timeout=timeout) as y:      # noqa: S310 — yerel motor
        return json.loads(y.read().decode("utf-8") or "{}")


# Testler AGA CIKMAZ (tests/harness.py bunu «ag kapali» ile degistirir).
VARSAYILAN_GETIR = _getir


def _milyar(m):
    """«4.3B» -> 4.3, «270M» -> 0.27. Bilinmiyorsa dosya boyutundan
    kabaca (4 bitlik nicemde ~0,6 GB / milyar). Doner: (sayi, etiket)."""
    ps = str(((m.get("details") or {}).get("parameter_size")) or "").strip().upper()
    r = re.match(r"^([\d.]+)\s*([BM])$", ps)
    if r:
        n = float(r.group(1))
        return (n / 1000.0 if r.group(2) == "M" else n), "ölçüldü"
    boyut = m.get("size")
    if isinstance(boyut, (int, float)) and boyut > 0:
        return round(boyut / 1e9 / 0.6, 1), "tahmin"
    return None, "veri yok"


def _gomme_mi(m):
    d = m.get("details") or {}
    aileler = [str(x).lower() for x in (d.get("families") or [d.get("family")]) if x]
    return bool(GOMME.search(str(m.get("name") or ""))) or any(a in GOMME_AILE for a in aileler)


def _satir(m):
    n, etiket = _milyar(m)
    boyut = m.get("size")
    return {"ad": str(m["name"])[:120], "milyar": n, "etiket": etiket,
            "parametre": (m.get("details") or {}).get("parameter_size") or None,
            "boyut_gb": round(boyut / 1e9, 1) if isinstance(boyut, (int, float)) else None,
            "gorsel": bool(GORSEL.search(str(m["name"])))}


def _sirala(out):
    out.sort(key=lambda x: (x["milyar"] is None, x["milyar"] or 0, x["ad"]))
    return out


def modeller(ham):
    """Ollama'nin /api/tags cevabi -> sohbet modelleri (gomme elenir)."""
    return _sirala([_satir(m) for m in (ham or {}).get("models") or []
                    if isinstance(m, dict) and m.get("name") and not _gomme_mi(m)])


def gommeler(ham):
    """Ayni cevaptan yalniz gomme modelleri (kural 7)."""
    return _sirala([_satir(m) for m in (ham or {}).get("models") or []
                    if isinstance(m, dict) and m.get("name") and _gomme_mi(m)])


def _tercih(liste, tercihler):
    adlar = {m["ad"] for m in liste}
    return next((t for t in tercihler if t in adlar), None)


def oneri(liste, gomme=()):
    """{ekonomik, standart?, gorsel?, gomme?}. Liste bossa {} (gomme yine)."""
    out = {}
    gorsel = [m for m in liste if m.get("gorsel")]
    g = _tercih(liste, GORSEL_TERCIH) or (gorsel[0]["ad"] if gorsel else None)
    if g:
        out["gorsel"] = g
    if gomme:
        out["gomme"] = _tercih(gomme, GOMME_TERCIH) or gomme[0]["ad"]
    # Gorsel uzman metin sinifina onerilmez; baska model yoksa yine o.
    metin = [m for m in liste if not m.get("gorsel")] or list(liste)
    if not metin:
        return out
    bilinen = [m for m in metin if m["milyar"] is not None]
    tercih = _tercih(metin, EKONOMIK_TERCIH)
    if not bilinen:
        out["ekonomik"] = tercih or metin[0]["ad"]
        return out
    kucuk = [m for m in bilinen if m["milyar"] <= EKONOMIK_UST]
    eko = next((m for m in bilinen if m["ad"] == tercih), None) or (kucuk[-1] if kucuk else bilinen[0])
    out["ekonomik"] = eko["ad"]
    buyuk = [m for m in bilinen if eko["milyar"] < m["milyar"] <= STANDART_UST]
    if buyuk:
        out["standart"] = buyuk[-1]["ad"]
    return out


def _bagli(cfg):
    return dict(models.yerel_of(cfg), **models.yerel_ek_of(cfg))


def _siniflar():
    return models.YEREL_SINIFLAR + models.YEREL_EK


def tara(cfg, getir=None):
    """Ollama'ya bakar. Hicbir sey yazmaz. Doner: durum, metin, modeller,
    oneri, bagli (su an yazili yerel modeller)."""
    kok = models.yerel_kok(cfg)
    bagli = _bagli(cfg)
    out = {"adres": kok, "bagli": bagli, "modeller": [], "gommeler": [], "oneri": {},
           "at": datetime.datetime.now().isoformat(timespec="seconds")}
    try:
        ham = (getir or VARSAYILAN_GETIR)(kok + "/api/tags", ZAMAN_ASIMI)
    except Exception:                           # noqa: BLE001 — kapali motor bir durumdur
        return dict(out, durum="kapali", metin=(
            "Bu bilgisayarda çalışan bir Ollama bulunamadı (%s). Kurulu değilse ollama.com "
            "adresinden kurulur; kuruluysa Ollama uygulamasını aç, HKM kendisi bulur." % kok))
    liste = modeller(ham)
    out["modeller"] = liste
    out["gommeler"] = gommeler(ham)
    if not liste:
        return dict(out, durum="bos", metin=(
            "Ollama çalışıyor ama indirilmiş bir sohbet modeli yok. Bir model indir "
            "(ör. «ollama pull gemma3:4b»); HKM birkaç dakika içinde kendisi görür."))
    out["oneri"] = oneri(liste, out["gommeler"])
    adlar = {m["ad"] for m in liste + out["gommeler"]}
    if not bagli:
        return dict(out, durum="bulundu", metin=(
            "Ollama bulundu: %d model. Önerilen: %s." % (len(liste), _oneri_yaz(out["oneri"]))))
    eksik = [ad for ad in bagli.values() if ad not in adlar]
    if eksik:
        return dict(out, durum="eksik", metin=(
            "Bağlı model Ollama’da yok: %s. Silinmiş ya da adı değişmiş olabilir; "
            "önerilenle yeniden bağlayabilirsin (%s)." % (", ".join(eksik), _oneri_yaz(out["oneri"]))))
    # Kural 7: bagliyken daha iyi bir oneri varsa SOYLENIR, yazilmaz.
    farkli = {k: v for k, v in out["oneri"].items() if bagli.get(k) != v}
    metin = "Ollama bağlı: %s." % _oneri_yaz(bagli)
    if farkli:
        metin += " Önerilen: %s." % _oneri_yaz(farkli)
    return dict(out, durum="bagli", metin=metin, oneri_farkli=bool(farkli))


def _cagri_nedeni(not_):
    """Defterdeki ham hata notu -> kullanicinin anlayacagi cumle."""
    n = str(not_ or "")
    k = n.lower()
    if "10061" in k or "refused" in k or "reddetti" in k:
        return "Ollama bağlantıyı reddetti; o an kapalıydı ya da yeniden başlıyordu."
    if "timed out" in k or "timeout" in k or "zaman" in k:
        return "Ollama zamanında cevap vermedi; model belleğe yükleniyor olabilir, yeniden dene."
    if "404" in k or "not found" in k:
        return "Model Ollama’da bulunamadı; adı değişmiş ya da silinmiş olabilir."
    if "11001" in k or "getaddrinfo" in k or "unreachable" in k or "10065" in k:
        return "Ollama’nın adresine ulaşılamadı; Ayarlar’daki motor adresine bak."
    return "Çağrı başarısız: %s" % (n[:140] or "neden yazılmamış")


def son_cagri(con):
    """Yerel modelin defterdeki SON sohbet cagrisi ya da None. Hicbir sey
    cagirmaz; usage tablosunu okur. Doner: at, saat, model, ok, metin."""
    if con is None:
        return None
    try:
        r = con.execute("SELECT created_at, model, ok, note FROM usage WHERE provider = 'yerel' "
                        "ORDER BY id DESC LIMIT 1").fetchone()
    except Exception:                           # noqa: BLE001 — defter yoksa durum yok
        return None
    if not r:
        return None
    at = str(r[0] or "")
    saat = at.replace("T", " ")[:16]
    if r[2]:
        metin = "Son sohbet çağrısı %s: cevap geldi (%s)." % (saat, r[1])
    else:
        metin = "Son sohbet çağrısı %s: cevap gelmedi. %s" % (saat, _cagri_nedeni(r[3]))
    return {"at": at, "saat": saat, "model": r[1], "ok": bool(r[2]), "metin": metin}


def _gonder(url, govde, timeout):
    istek = urllib.request.Request(url, data=json.dumps(govde).encode("utf-8"),
                                   headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(istek, timeout=timeout) as y:      # noqa: S310 — yerel motor
        y.read()
    return True


# Testler AGA CIKMAZ (tests/harness.py).
VARSAYILAN_GONDER = _gonder


# --------------------------------------------------------------- gomme

# Hafiza aramasi (core/memory.py, KING-4 B). Gomme modeli CPU'da kosar:
# 6 GB'ta sohbet ve Whisper GPU'dayken ikinci bir model Gemma'yi itiyordu (Olcum 1b).
GOMME_SECENEK = {"num_gpu": 0}
GOMME_ZAMAN = 5                     # Olcum 3b: CPU soguk yukleme 3,4 sn
GOMME_ARA = 60                      # hatadan sonra bu kadar sn denenmez (sohbet beklemesin)
_gomme_hata = [0.0]


def _gomme_gonder(url, govde, timeout):
    istek = urllib.request.Request(url, data=json.dumps(govde).encode("utf-8"),
                                   headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(istek, timeout=timeout) as y:      # noqa: S310 — yerel motor
        return json.loads(y.read().decode("utf-8"))


VARSAYILAN_GOMME = _gomme_gonder


def gomme_modeli(cfg):
    return models.yerel_of(cfg).get("gomme") or GOMME_TERCIH[0]


def gomme(cfg, metinler, gonder=None):
    """Metinlerin gomme vektorleri (sirayla) ya da None (motor yok, model yok).
    Firlatmaz; hata bir sure yeniden denenmez."""
    if not metinler:
        return []
    if gonder is None and time.monotonic() - _gomme_hata[0] < GOMME_ARA and _gomme_hata[0]:
        return None
    if bellek_dar():
        return None
    try:
        r = (gonder or VARSAYILAN_GOMME)(models.yerel_kok(cfg) + "/api/embed",
                                         {"model": gomme_modeli(cfg), "input": list(metinler),
                                          "options": GOMME_SECENEK, "keep_alive": "60m"}, GOMME_ZAMAN)
        v = r.get("embeddings") if isinstance(r, dict) else None
        if not isinstance(v, list) or len(v) != len(metinler):
            raise ValueError("gomme cevabi eksik")
        return v
    except Exception:                           # noqa: BLE001 — kapali motor bir durumdur
        if gonder is None:
            _gomme_hata[0] = time.monotonic()
        return None


def isit(cfg, tarama, gonder=None, istek=False):
    """Kural 6: bagli ekonomik modeli bellekte tutar. Doner: model adi ya da None.
    `istek`: kullanici King'i acti; «kendi basina» anahtari arka plan isidir, buna engel degil."""
    if (not settings(cfg)["sicak"] or (not istek and not _kendi.acik(cfg))
            or (tarama or {}).get("durum") != "bagli"):
        return None
    model = models.yerel_of(cfg).get("ekonomik")
    if not model or bellek_dar():
        return None
    try:
        (gonder or VARSAYILAN_GONDER)(models.yerel_kok(cfg) + "/api/generate",
                                      {"model": model, "keep_alive": ISIT_SURE}, 120)
    except Exception:                           # noqa: BLE001 — kapali motor bir durumdur
        return None
    if gonder is None:
        _ISITILAN.update(kok=models.yerel_kok(cfg), model=model)
    return model


_ISITILAN = {}


# Kamera (olcum 2026-11-07, 8 GB RAM, bos RAM 0,7 GiB): «oku» qwen3-vl'i (3,9 GiB) yukleyip gemma4'u atti;
# sonraki sohbet gemma4'u geri yukledi (40 sn, Ollama 500, bos sanal bellek 19 MiB) ve PC takasa dustu.
# Bellekteki gemma4 ayni kareyi 2,6 sn'de eksiksiz okudu. Bu yuzden bellek darken ikinci model yuklenmez.
def _gorselli(m):
    return str(m).lower().startswith("gemma4") or bool(GORSEL.search(str(m)))


def gorsel_yerine(cfg, model, getir=None):
    """Bellek darken bellekte olmayan gorsel model yerine bellekteki (yoksa ekonomik) gorselli model."""
    ram = VARSAYILAN_RAM()
    if not bellek_dar() and (ram is None or ram >= IKINCI_MODEL_RAM):
        return model
    try:
        ham = (getir or VARSAYILAN_GETIR)(models.yerel_kok(cfg) + "/api/ps", 1)
        bellekte = [str(x.get("name") or x.get("model") or "") for x in (ham or {}).get("models") or []]
    except Exception:                           # noqa: BLE001 — bilinmiyorsa sohbetin zaten yukleyecegi model
        bellekte = []
    if model in bellekte:
        return model
    aday = [m for m in bellekte if _gorselli(m)] + [models.yerel_of(cfg).get("ekonomik") or ""]
    return next((m for m in aday if m and _gorselli(m)), model)


# ------------------------------------------------------------- uyandirma (kural 8)
UYANMA_ZAMAN = 12                   # sn: `ollama serve` kapisini acana kadar
KAPALI_ARA = 30
_KAPALI = [0.0]
_UYANMA_KILIT = threading.Lock()


def ollama_exe():
    yerel = os.environ.get("LOCALAPPDATA") or ""
    p = os.path.join(yerel, "Programs", "Ollama", "ollama.exe")
    return shutil.which("ollama") or (p if yerel and os.path.isfile(p) else None)


def _ac(exe):
    bayrak = (getattr(subprocess, "CREATE_NO_WINDOW", 0) | getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0))
    subprocess.Popen([exe, "serve"], stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,  # noqa: S603
                     stderr=subprocess.DEVNULL, creationflags=bayrak)


# Testler surec acmaz (tests/harness.py).
VARSAYILAN_AC = _ac


def reddedildi_mi(e):
    """Kapi kapali mi (zaman asimi degil, ConnectionRefused / WinError 10061)."""
    n = getattr(e, "reason", None)
    return isinstance(n, ConnectionRefusedError) or getattr(n, "winerror", None) == 10061


def kapali_kalan():
    """Az once acilamadiysa kalan saniye; yoksa 0."""
    kalan = _KAPALI[0] - time.monotonic()
    return int(kalan + 0.999) if kalan > 0 else 0


def uyandir(cfg, ac=None, bekle=time.sleep):
    """Ollama'yi acar ve kapisi acilana kadar bekler. Doner: acildi mi."""
    with _UYANMA_KILIT:                 # ayni anda ikinci istek ikinci surec acmaz
        kok = models.yerel_kok(cfg)
        try:
            VARSAYILAN_GETIR(kok + "/api/tags", 1)
            return True                 # baska bir istek az once acti
        except Exception:               # noqa: BLE001 — kapali motor bir durumdur
            pass
        exe = ollama_exe()
        if (not settings(cfg)["baslat"] or not exe
                or models.adres_denetle(kok)[2] != "ayni_makine"):
            _KAPALI[0] = time.monotonic() + KAPALI_ARA
            return False
        try:
            (ac or VARSAYILAN_AC)(exe)
        except OSError:
            _KAPALI[0] = time.monotonic() + KAPALI_ARA
            return False
        bitis = time.monotonic() + UYANMA_ZAMAN
        while time.monotonic() < bitis:
            bekle(0.25)
            try:
                VARSAYILAN_GETIR(kok + "/api/tags", 1)
                _KAPALI[0] = 0.0
                return True
            except Exception:           # noqa: BLE001
                continue
        _KAPALI[0] = time.monotonic() + KAPALI_ARA
        return False


@atexit.register
def _bosalt():
    """HKM kapaninca isitilan model GPU'dan iner; zorla oldurulmede ISIT_SURE dolunca Ollama kendisi indirir."""
    if _ISITILAN:
        try:
            VARSAYILAN_GONDER(_ISITILAN["kok"] + "/api/generate", {"model": _ISITILAN["model"], "keep_alive": 0}, 5)
        except Exception:                       # noqa: BLE001 — kapali motor bir durumdur
            pass


def _oneri_yaz(o):
    return " · ".join("%s %s" % (ROL_ADI[k], o[k]) for k in _siniflar() if o.get(k))


def yama(cfg, secim):
    """Baglama yamasi (core/settings.py validate + apply'dan gecer)."""
    yer = models.yer_of(cfg)
    if yer == "bulut":
        yer = "hibrit" if models.key_value(cfg, "openrouter") else "yerel"
    return {"models": {"yer": yer, "yerel": {k: v for k, v in secim.items()
                                             if k in _siniflar() and v}}}


def onceki(cfg):
    """Geri al icin: baglamadan onceki calisma yeri ve yerel modeller."""
    b = (cfg or {}).get("models") or {}
    return {"yer": b.get("yer") or "", "yerel": dict(b.get("yerel") or {})}


def secim_denetle(tarama, secim):
    """Elle «Bagla»: secilen her model Ollama'da OLMALI. (secim, hata)."""
    if not secim:
        secim = tarama.get("oneri") or {}
    if not secim.get("ekonomik"):
        return None, "Bağlanacak model yok: önce Ollama’da bir model indir."
    adlar = {m["ad"] for m in (tarama.get("modeller") or []) + (tarama.get("gommeler") or [])}
    yok = [v for k, v in secim.items() if k in _siniflar() and v and v not in adlar]
    if yok:
        return None, "Şu model Ollama’da yok: %s." % ", ".join(yok)
    return {k: v for k, v in secim.items() if k in _siniflar() and v}, None


def kendiliginden(cfg, tarama):
    """Ritim icin: kendiliginden baglanacaksa secim, yoksa None (kural 4)."""
    if not settings(cfg)["kendiligi"] or tarama.get("durum") != "bulundu":
        return None
    if _bagli(cfg) or ((cfg or {}).get("ollama_bag") or {}).get("geri_alindi"):
        return None
    return tarama.get("oneri") or None
