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
      Guclu ve Uzman sinif her zaman buluttadir (core/models.py)."""
import datetime
import json
import re
import urllib.request

from core import models

VARSAYILAN = {"kendiligi": True}
ALANLAR = {"kendiligi": bool}
EKONOMIK_UST = 9.0       # milyar parametre
STANDART_UST = 40.0
ZAMAN_ASIMI = 3
GOMME = re.compile(r"embed|bge|minilm|rerank", re.I)
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


def modeller(ham):
    """Ollama'nin /api/tags cevabi -> sohbet modelleri (gomme elenir)."""
    out = []
    for m in (ham or {}).get("models") or []:
        if not isinstance(m, dict) or not m.get("name") or _gomme_mi(m):
            continue
        n, etiket = _milyar(m)
        boyut = m.get("size")
        out.append({"ad": str(m["name"])[:120], "milyar": n, "etiket": etiket,
                    "parametre": (m.get("details") or {}).get("parameter_size") or None,
                    "boyut_gb": round(boyut / 1e9, 1) if isinstance(boyut, (int, float)) else None})
    out.sort(key=lambda x: (x["milyar"] is None, x["milyar"] or 0, x["ad"]))
    return out


def oneri(liste):
    """{ekonomik, standart?}. Liste bossa {}."""
    bilinen = [m for m in liste if m["milyar"] is not None]
    if not bilinen:
        return {"ekonomik": liste[0]["ad"]} if liste else {}
    kucuk = [m for m in bilinen if m["milyar"] <= EKONOMIK_UST]
    eko = kucuk[-1] if kucuk else bilinen[0]
    out = {"ekonomik": eko["ad"]}
    buyuk = [m for m in bilinen if eko["milyar"] < m["milyar"] <= STANDART_UST]
    if buyuk:
        out["standart"] = buyuk[-1]["ad"]
    return out


def tara(cfg, getir=None):
    """Ollama'ya bakar. Hicbir sey yazmaz. Doner: durum, metin, modeller,
    oneri, bagli (su an yazili yerel modeller)."""
    kok = models.yerel_kok(cfg)
    bagli = models.yerel_of(cfg)
    out = {"adres": kok, "bagli": bagli, "modeller": [], "oneri": {},
           "at": datetime.datetime.now().isoformat(timespec="seconds")}
    try:
        ham = (getir or VARSAYILAN_GETIR)(kok + "/api/tags", ZAMAN_ASIMI)
    except Exception:                           # noqa: BLE001 — kapali motor bir durumdur
        return dict(out, durum="kapali", metin=(
            "Bu bilgisayarda çalışan bir Ollama bulunamadı (%s). Kurulu değilse ollama.com "
            "adresinden kurulur; kuruluysa Ollama uygulamasını aç, HKM kendisi bulur." % kok))
    liste = modeller(ham)
    out["modeller"] = liste
    if not liste:
        return dict(out, durum="bos", metin=(
            "Ollama çalışıyor ama indirilmiş bir sohbet modeli yok. Bir model indir "
            "(ör. «ollama pull gemma3:4b»); HKM birkaç dakika içinde kendisi görür."))
    out["oneri"] = oneri(liste)
    adlar = {m["ad"] for m in liste}
    if not bagli:
        return dict(out, durum="bulundu", metin=(
            "Ollama bulundu: %d model. Önerilen: %s." % (len(liste), _oneri_yaz(out["oneri"]))))
    eksik = [ad for ad in bagli.values() if ad not in adlar]
    if eksik:
        return dict(out, durum="eksik", metin=(
            "Bağlı model Ollama’da yok: %s. Silinmiş ya da adı değişmiş olabilir; "
            "önerilenle yeniden bağlayabilirsin (%s)." % (", ".join(eksik), _oneri_yaz(out["oneri"]))))
    return dict(out, durum="bagli", metin="Ollama bağlı: %s." % _oneri_yaz(bagli))


def _oneri_yaz(o):
    return " · ".join("%s %s" % ({"ekonomik": "Ekonomik", "standart": "Standart"}[k], o[k])
                      for k in ("ekonomik", "standart") if o.get(k))


def yama(cfg, secim):
    """Baglama yamasi (core/settings.py validate + apply'dan gecer)."""
    yer = models.yer_of(cfg)
    if yer == "bulut":
        yer = "hibrit" if models.key_value(cfg, "openrouter") else "yerel"
    return {"models": {"yer": yer, "yerel": {k: v for k, v in secim.items()
                                             if k in models.YEREL_SINIFLAR and v}}}


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
    adlar = {m["ad"] for m in tarama.get("modeller") or []}
    yok = [v for k, v in secim.items() if k in models.YEREL_SINIFLAR and v and v not in adlar]
    if yok:
        return None, "Şu model Ollama’da yok: %s." % ", ".join(yok)
    return {k: v for k, v in secim.items() if k in models.YEREL_SINIFLAR and v}, None


def kendiliginden(cfg, tarama):
    """Ritim icin: kendiliginden baglanacaksa secim, yoksa None (kural 4)."""
    if not settings(cfg)["kendiligi"] or tarama.get("durum") != "bulundu":
        return None
    if models.yerel_of(cfg) or ((cfg or {}).get("ollama_bag") or {}).get("geri_alindi"):
        return None
    return tarama.get("oneri") or None
