# -*- coding: utf-8 -*-
"""Sağlayıcılar ve görev dağılımı — hangi katman hangi modele konuşur.

   Sistemde bir hiyerarsi var ve her kademenin isi farkli. Hepsini tek bir
   anahtara baglamak iki seyi birden yapardi: ucuz bir isi pahali modele
   yaptirmak, ve tek bir anahtarin sizmasini butun sistemin sizmasi haline
   getirmek. Bu yuzden ATAMA KADEME KADEMEDIR.

   Kademeler (ustten alta):

     king          Buyuk Patron — gunun tek cumlesini tasiyan ses
     vp_bio        HKM konseyi: biyolojik sermaye  (SPI'nin alt patronu)
     vp_academic   HKM konseyi: akademik hedef     (AYS'nin alt patronu)
     vp_intellect  HKM konseyi: entelektuel gelisim (ESP'nin alt patronu)
     ays.* spi.* esp.*   modul patronlarinin altindaki YETENEKLER

   Yetenekler (her modulde ayni dort kategori):

     sohbet   kullaniciyla konusan         (ucuz ve hizli olmali)
     analiz   sayiyi cumleye ceviren       (dikkatli olmali)
     plan     gun/hafta plani oneren       (dikkatli olmali)
     gorsel   ekran goruntusu, tahlil, not  (gorsel okuyabilmeli)

   ALTI KURAL — hepsi bir seyi korur: MODEL OTORITE DEGILDIR.

   1. KURAL MOTORU OTORITEDIR. Buradaki hicbir ayar bir esigi, bir hukmu
      ya da bir onceligi degistirmez. Model yalnizca CUMLE kurar; sayiyi
      kural motoru uretir. Butun anahtarlar bos olsa sistem aynen calisir.

   2. VARSAYILAN KAPALIDIR. Hicbir kademe varsayilan olarak bir modele
      baglanmaz. Baglamak bilincli bir karardir ve parasi olan bir karardir.

   3. SIR EKRANDA GORUNMEZ. Anahtar disari MASKELI cikar: «kurulu mu»
      bilgisi verilir, degerin kendisi verilmez — ve hicbir gunluge
      yazilmaz.

   4. ATAMA MIRAS ALIR. Bir kademeye atama yoksa USTUNE bakilir; en ustte
      de yoksa «atanmamis» denir. Uydurulmus bir varsayilan, kullanicinin
      secmedigi bir modele para odemesi demektir.

   5. BILINMEYEN KADEME REDDEDILIR. Kademe listesi kapali bir kumedir;
      serbest bir anahtar-deger deposu degildir.

   6. BAGLANTI DENENMEDEN «CALISIYOR» DENMEZ. Anahtarin gecerliligi ancak
      SINANARAK bilinir; kurulu olmasi calistigi anlamina gelmez.
"""

import json
import urllib.error
import urllib.request

# --------------------------------------------------------------- saglayicilar
#
# Adres BURADA yazili: kullanicinin adres yazmasi gereken bir alan, yanlis
# yazildiginda anahtari bilinmeyen bir sunucuya gonderir.
PROVIDERS = {
    # ONERILEN BASLANGIC. Tek anahtar, tek bakiye, butun modeller; anahtar
    # basina harcama limiti saglayicinin kendisinde tanimlanabilir. Marka
    # degistirmek icin kod degil, SATIR degisir.
    "openrouter": {
        "label": "OpenRouter (önerilen — tek anahtar, bütün modeller)",
        "base": "https://openrouter.ai/api/v1/chat/completions",
        "key_header": "Authorization",
        "signup": "https://openrouter.ai/keys",
        "note": "Tek hesap, tek bakiye; OpenAI, Claude, Gemini, DeepSeek, "
                "Qwen ve digerleri ayni anahtarla. Anahtar basina aylik "
                "limit koyulabilir — butcenin ikinci kilidi.",
        "models": ["google/gemini-2.5-flash-lite", "google/gemini-2.5-flash",
                   "deepseek/deepseek-chat", "anthropic/claude-haiku-4.5",
                   "anthropic/claude-sonnet-5", "openai/gpt-5-mini",
                   "qwen/qwen2.5-vl-72b-instruct"],
    },
    "anthropic": {
        "label": "Anthropic (Claude)",
        "base": "https://api.anthropic.com/v1/messages",
        "key_header": "x-api-key",
        "models": ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5-20251001"],
    },
    "openai": {
        "label": "OpenAI",
        "base": "https://api.openai.com/v1/chat/completions",
        "key_header": "Authorization",
        "models": ["gpt-5", "gpt-5-mini", "gpt-4.1"],
    },
    "google": {
        "label": "Google (Gemini)",
        "base": "https://generativelanguage.googleapis.com/v1beta/models",
        "key_header": "x-goog-api-key",
        "models": ["gemini-2.5-pro", "gemini-2.5-flash"],
    },
    "yerel": {
        "label": "Yerel sunucu (Ollama, LM Studio…)",
        "base": "http://127.0.0.1:11434/v1/chat/completions",
        "key_header": "Authorization",
        "models": [],
    },
}

# ------------------------------------------------------------------ kademeler

# Anahtar ASCII'dir (dosyada, API'de, testte), EKRAN ADI Turkcedir.
# capitalize() ile uretilen «Gorsel», anahtari kullaniciya gostermenin
# kibar bicimiydi.
YETENEKLER = {
    "sohbet": "Kullanıcıyla konuşan — ucuz ve hızlı olmalı",
    "analiz": "Sayıyı cümleye çeviren — dikkatli olmalı",
    "plan": "Gün/hafta planı öneren — dikkatli olmalı",
    "gorsel": "Görsel okuyan (ekran görüntüsü, tahlil, not)",
}

YETENEK_ADI = {"sohbet": "Sohbet", "analiz": "Analiz", "plan": "Plan",
               "gorsel": "Görsel"}

MODULLER = {"ays": "AYS", "spi": "SPİ", "esp": "ESP"}

# Miras zinciri: atama yoksa «parent»a bakilir.
ROLES = {}


def _rol(key, label, note, parent=None, layer="", **ek):
    ROLES[key] = dict({"key": key, "label": label, "note": note,
                       "parent": parent, "layer": layer}, **ek)


_rol("king", "Büyük Patron (King)",
     "Günün tek cümlesini taşıyan ses. Karar üretmez, kararı taşır.",
     parent=None, layer="king")

for _vp, _ad, _mod, _alan in (
        ("vp_bio", "Biyolojik sermaye", "spi", "uyku, toparlanma, HRV"),
        ("vp_academic", "Akademik hedef", "ays", "soru, çalışma süresi, net"),
        ("vp_intellect", "Entelektüel gelişim", "esp", "kalıcılık, pratik, sentez")):
    _rol(_vp, "%s (%s)" % (_ad, MODULLER[_mod]),
         "HKM konseyi — %s. Hükmü kural motoru verir; model yalnız cümleyi kurar."
         % _alan, parent="king", layer="konsey", module=_mod)

for _mod, _ad in MODULLER.items():
    _ust = {"spi": "vp_bio", "ays": "vp_academic", "esp": "vp_intellect"}[_mod]
    for _yet, _not in YETENEKLER.items():
        _rol("%s.%s" % (_mod, _yet), "%s · %s" % (_ad, YETENEK_ADI[_yet]),
             _not, parent=_ust, layer="modul", module=_mod, capability=_yet)

LAYER_LABEL = {
    "king": "En üst — King",
    "konsey": "HKM konseyi — üç alt patron",
    "modul": "Modül yetenekleri",
}


def layers():
    """Ekranin cizecegi sira: ustten alta, her kademe kendi grubunda."""
    out = []
    for kat in ("king", "konsey", "modul"):
        uyeler = [r for r in ROLES.values() if r["layer"] == kat]
        uyeler.sort(key=lambda r: r["key"])
        out.append({"layer": kat, "label": LAYER_LABEL[kat], "roles": uyeler})
    return out


# ------------------------------------------------------------------- okuma

def _bolum(cfg):
    b = (cfg or {}).get("models")
    return b if isinstance(b, dict) else {}


def keys(cfg):
    """Saglayici -> anahtar. Ham deger; DISARI CIKMAZ."""
    k = _bolum(cfg).get("keys")
    return k if isinstance(k, dict) else {}


def assignments(cfg):
    a = _bolum(cfg).get("assignments")
    return a if isinstance(a, dict) else {}


def resolve(cfg, role):
    """Bir kademenin GERCEKTEN kullanacagi saglayici ve model.

    Atama yoksa USTUNE bakilir; en ustte de yoksa «atanmamis» denir.
    Uydurulmus bir varsayilan, kullanicinin secmedigi bir modele para
    odemesi demektir."""
    if role not in ROLES:
        return None
    atamalar = assignments(cfg)
    anahtarlar = keys(cfg)
    zincir = []
    imlec = role
    while imlec:
        zincir.append(imlec)
        a = atamalar.get(imlec)
        if isinstance(a, dict) and a.get("provider"):
            saglayici = a["provider"]
            return {
                "role": role, "from": imlec,
                "inherited": imlec != role,
                "provider": saglayici,
                "provider_label": (PROVIDERS.get(saglayici) or {}).get(
                    "label", saglayici),
                "model": a.get("model") or "",
                "key_set": bool(anahtarlar.get(saglayici)),
                "chain": zincir,
            }
        imlec = ROLES[imlec]["parent"]
    return {"role": role, "from": None, "inherited": False, "provider": None,
            "provider_label": "", "model": "", "key_set": False,
            "chain": zincir}


def read(cfg):
    """Disari cikan hal — ANAHTARLAR MASKELI."""
    anahtarlar = keys(cfg)
    saglayicilar = []
    for ad, tanim in sorted(PROVIDERS.items()):
        saglayicilar.append({
            "id": ad, "label": tanim["label"], "base": tanim["base"],
            "models": tanim["models"],
            "signup": tanim.get("signup", ""),
            "note": tanim.get("note", ""),
            "key_set": bool(anahtarlar.get(ad)),
            "key_hint": ("••••••" + str(anahtarlar[ad])[-2:])
                        if anahtarlar.get(ad) else "",
        })
    return {
        "providers": saglayicilar,
        "layers": layers(),
        "capabilities": YETENEKLER,
        "assignments": {r: resolve(cfg, r) for r in ROLES},
        "note": "Kural motoru otoritedir: buradaki hiçbir ayar bir eşiği, "
                "bir hükmü ya da bir önceliği değiştirmez. Model yalnız "
                "cümle kurar. Bütün anahtarlar boş olsa sistem aynen çalışır.",
    }


# ---------------------------------------------------------------- dogrulama

def validate(patch):
    hata = []
    if not isinstance(patch, dict):
        return False, ["models bir nesne olmalı"]
    for k in patch:
        if k not in ("keys", "assignments"):
            hata.append("bilinmeyen models alanı: %s" % k)

    for ad, deger in (patch.get("keys") or {}).items():
        if ad not in PROVIDERS:
            hata.append("bilinmeyen sağlayıcı: %s" % ad)
        elif not isinstance(deger, str):
            hata.append("%s anahtarı bir dize olmalı" % ad)
        elif len(deger) > 400:
            hata.append("%s anahtarı fazla uzun" % ad)

    for rol, deger in (patch.get("assignments") or {}).items():
        if rol not in ROLES:
            # Kademe listesi KAPALI bir kumedir: serbest bir anahtar-deger
            # deposu degildir.
            hata.append("bilinmeyen kademe: %s" % rol)
            continue
        if deger is None:
            continue                      # atamayi kaldirmak gecerlidir
        if not isinstance(deger, dict):
            hata.append("%s ataması bir nesne olmalı" % rol)
            continue
        for k in deger:
            if k not in ("provider", "model"):
                hata.append("%s içinde bilinmeyen alan: %s" % (rol, k))
        saglayici = deger.get("provider")
        if saglayici and saglayici not in PROVIDERS:
            hata.append("%s: bilinmeyen sağlayıcı %s" % (rol, saglayici))
        model = deger.get("model")
        if model is not None and not isinstance(model, str):
            hata.append("%s.model bir dize olmalı" % rol)
        if model and len(model) > 120:
            hata.append("%s.model fazla uzun" % rol)
        if model and not saglayici:
            hata.append("%s: model verildi ama sağlayıcı seçilmedi" % rol)
    return (not hata), hata


def apply(cfg, patch):
    """Dogrulanmis yamayi birlestirir.

    BOS DIZE ANAHTARI SILER: bir sirri silmenin yolu, dosyayi elle
    duzenlemek olmamali."""
    bolum = dict(_bolum(cfg))
    anahtarlar = dict(bolum.get("keys") or {})
    for ad, deger in (patch.get("keys") or {}).items():
        if deger == "":
            anahtarlar.pop(ad, None)
        else:
            anahtarlar[ad] = deger
    atamalar = dict(bolum.get("assignments") or {})
    for rol, deger in (patch.get("assignments") or {}).items():
        if deger is None or (isinstance(deger, dict) and not deger.get("provider")):
            atamalar.pop(rol, None)
        else:
            atamalar[rol] = {"provider": deger.get("provider"),
                             "model": deger.get("model") or ""}
    bolum["keys"] = anahtarlar
    bolum["assignments"] = atamalar
    yeni = dict(cfg or {})
    yeni["models"] = bolum
    return yeni


# ------------------------------------------------------------------- sinama

def probe(cfg, provider, transport=None, timeout=8):
    """Anahtari SINAR. «Kurulu» ile «calisiyor» ayri seylerdir.

    Model cagirmaz, mesaj uretmez: yalnizca kapinin kimligi taniyip
    tanimadigina bakar. Bir yanit alinmadan «calisiyor» yazmak, yalan
    soyleyen bir arayuzdur."""
    tanim = PROVIDERS.get(provider)
    if not tanim:
        return {"ok": False, "reason": "unknown-provider",
                "note": "Bilinmeyen sağlayıcı."}
    anahtar = keys(cfg).get(provider)
    if not anahtar and provider != "yerel":
        return {"ok": False, "reason": "no-key",
                "note": "Bu sağlayıcı için anahtar girilmemiş."}
    if transport is not None:
        return transport(provider, tanim, anahtar)
    baslik = {"Content-Type": "application/json"}
    if anahtar:
        if tanim["key_header"] == "Authorization":
            baslik["Authorization"] = "Bearer " + anahtar
        else:
            baslik[tanim["key_header"]] = anahtar
    if provider == "anthropic":
        baslik["anthropic-version"] = "2023-06-01"
    istek = urllib.request.Request(tanim["base"], data=json.dumps({}).encode(),
                                   headers=baslik, method="POST")
    try:
        with urllib.request.urlopen(istek, timeout=timeout) as r:
            return {"ok": True, "status": r.status,
                    "note": "Kapı yanıt verdi."}
    except urllib.error.HTTPError as e:
        # 400/422: istek bos ama KIMLIK KABUL EDILDI — aradigimiz bu.
        # 401/403: anahtar reddedildi.
        if e.code in (400, 422):
            return {"ok": True, "status": e.code,
                    "note": "Anahtar kabul edildi (boş istek reddedildi, "
                            "beklenen budur)."}
        if e.code in (401, 403):
            return {"ok": False, "status": e.code, "reason": "unauthorized",
                    "note": "Anahtar reddedildi."}
        return {"ok": False, "status": e.code, "reason": "http",
                "note": "Sağlayıcı %s döndü." % e.code}
    except Exception as e:
        return {"ok": False, "reason": "unreachable",
                "note": "Ulaşılamadı: %s" % type(e).__name__}
