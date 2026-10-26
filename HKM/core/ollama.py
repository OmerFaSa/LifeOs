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
      yapilmaz.

   7. ROLLER (2026-10-20, King 2.0 A). Gorsel uzman model (adinda «-vl»,
      «vision», «llava»…) metin sinifina onerilmez, «gorsel» olarak onerilir;
      gomme modeli «gomme» olarak taninir (anlamsal hafiza). Ekonomik sinifta
      TERCIH listesindeki model (bu donanimda olculen: gemma4:e2b) varsa o
      onerilir. Baglama bunlari da yazar; bagliyken oneri farkliysa kart
      «Önerilenle bağla»yi yine gosterir (elle secim yine ezilmez).

   «Bagli» yalniz model listesinin okunabildigini soyler; sohbetin gercekten
   calistigini soylemez (kullanici, 2026-10-19: «ayarlarda bagli gorunuyor
   ama mesaj uretilmiyor»). Bu yuzden kart, yerel modelin defterdeki SON
   GERCEK sohbet cagrisini da yazar (son_cagri): ne zaman, cevap geldi mi,
   gelmediyse neden — adiyla."""
import datetime
import json
import re
import urllib.request

from core import kendiliginden as _kendi  # ayni adli fonksiyon asagida (bulunca bagla)
from core import models

VARSAYILAN = {"kendiligi": True, "sicak": True}
ALANLAR = {"kendiligi": bool, "sicak": bool}
ISIT_ARALIK = 20 * 60
ISIT_SURE = "30m"
EKONOMIK_UST = 9.0       # milyar parametre
STANDART_UST = 40.0
ZAMAN_ASIMI = 3
GOMME = re.compile(r"embed|bge|minilm|rerank", re.I)
GORSEL = re.compile(r"(?:^|[-_/.])vl(?:[-_:.]|$)|vision|llava|moondream|minicpm-v", re.I)
# Ekonomik sinifta once bunlar (sira onemli); yoksa kural 3.
EKONOMIK_TERCIH = ("gemma4:e2b",)
GORSEL_TERCIH = ("qwen3-vl:4b",)
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
    if gorsel:
        out["gorsel"] = _tercih(gorsel, GORSEL_TERCIH) or gorsel[0]["ad"]
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


def isit(cfg, tarama, gonder=None):
    """Kural 6: bagli ekonomik modeli bellekte tutar. Doner: model adi ya da None."""
    if (not settings(cfg)["sicak"] or not _kendi.acik(cfg)
            or (tarama or {}).get("durum") != "bagli"):
        return None
    model = models.yerel_of(cfg).get("ekonomik")
    if not model:
        return None
    try:
        (gonder or VARSAYILAN_GONDER)(models.yerel_kok(cfg) + "/api/generate",
                                      {"model": model, "keep_alive": ISIT_SURE}, 120)
    except Exception:                           # noqa: BLE001 — kapali motor bir durumdur
        return None
    return model


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
