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

   7. BIR SAGLAYICININ BIRDEN COK ANAHTARI OLABILIR. Iki kisi ayni
      sistemi kullaniyorsa harcamalari da ayri gorunmeli; bir anahtarin
      limiti dolunca sistemin tamami durmamali. Her anahtarin bir ADI ve
      bir SAHIBI vardir; kademe hangi anahtari kullanacagini secer,
      secmezse saglayicinin ilk anahtari gecerlidir.

      Secilen anahtar SILINMISSE, baska bir anahtara sessizce gecilmez:
      bu, baskasinin hesabindan para harcamak olurdu. Durum «anahtar
      bulunamadi» diye SOYLENIR.
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
        # Anahtari GERCEKTEN dogrulayan uc: kim oldugunu ve kalan
        # bakiyeyi soyler.
        "probe": "https://openrouter.ai/api/v1/key",
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
        "probe": "https://api.anthropic.com/v1/models",
        "key_header": "x-api-key",
        "signup": "https://console.anthropic.com/settings/keys",
        "models": ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5-20251001"],
    },
    "openai": {
        "label": "OpenAI",
        "base": "https://api.openai.com/v1/chat/completions",
        "probe": "https://api.openai.com/v1/models",
        "key_header": "Authorization",
        "signup": "https://platform.openai.com/api-keys",
        "models": ["gpt-5", "gpt-5-mini", "gpt-4.1"],
    },
    "google": {
        "label": "Google (Gemini)",
        "base": "https://generativelanguage.googleapis.com/v1beta/models",
        "probe": "https://generativelanguage.googleapis.com/v1beta/models",
        "key_header": "x-goog-api-key",
        "signup": "https://aistudio.google.com/apikey",
        "models": ["gemini-2.5-pro", "gemini-2.5-flash"],
    },
    "yerel": {
        "label": "Yerel sunucu (Ollama, LM Studio…)",
        "base": "http://127.0.0.1:11434/v1/chat/completions",
        "probe": "http://127.0.0.1:11434/v1/models",
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


def _ham_anahtarlar(cfg):
    """models.keys'in ham hali: saglayici -> dize YA DA liste.

    Eski yapilandirmalarda tek bir dize duruyordu; yeni yapilandirmada
    liste var. Okuma tarafi ikisini de kabul eder — kullanicinin dosyayi
    elle donusturmesi gereken bir surum yukseltmesi, kurulumu bozmanin
    sessiz yoludur."""
    k = _bolum(cfg).get("keys")
    return k if isinstance(k, dict) else {}


VARSAYILAN_SAHIP = "ben"


def _tek_anahtar(ad, deger, sira):
    return {"id": ad, "label": deger.get("label") or "Anahtar %d" % sira,
            "key": deger.get("key") or "",
            "user": deger.get("user") or VARSAYILAN_SAHIP}


def key_list(cfg, provider):
    """Bir saglayicinin anahtarlari — SIRAYLA. Ham degerler icerir.

    Tek dize, tek elemanli liste sayilir: eski yapilandirma yeni kodla
    calismaya devam eder."""
    ham = _ham_anahtarlar(cfg).get(provider)
    if isinstance(ham, str):
        return [{"id": "k1", "label": "Anahtar 1", "key": ham,
                 "user": VARSAYILAN_SAHIP}] if ham else []
    out = []
    if isinstance(ham, list):
        for i, e in enumerate(ham, 1):
            if not isinstance(e, dict) or not e.get("key"):
                continue
            out.append(_tek_anahtar(e.get("id") or "k%d" % i, e, i))
    return out


def key_value(cfg, provider, key_id=None):
    """Kullanilacak anahtarin GERCEK degeri.

    key_id verilmisse O anahtar; yoksa saglayicinin ILK anahtari.
    key_id verilmis ama artik yoksa None doner — silinmis bir anahtarin
    yerine baskasininkini koymak, baskasinin hesabindan para harcamaktir."""
    liste = key_list(cfg, provider)
    if key_id:
        for e in liste:
            if e["id"] == key_id:
                return e["key"]
        return None
    return liste[0]["key"] if liste else None


def key_owner(cfg, provider, key_id=None):
    """Anahtarin sahibi — harcama kimin defterine yazilacak."""
    liste = key_list(cfg, provider)
    for e in liste:
        if (key_id and e["id"] == key_id) or (not key_id and e is liste[0]):
            return e.get("user") or VARSAYILAN_SAHIP
    return VARSAYILAN_SAHIP


def keys(cfg):
    """Saglayici -> ETKIN anahtar (ilki). Ham deger; DISARI CIKMAZ."""
    out = {}
    for ad in _ham_anahtarlar(cfg):
        liste = key_list(cfg, ad)
        if liste:
            out[ad] = liste[0]["key"]
    return out


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
            secilen = a.get("key") or ""
            liste = key_list(cfg, saglayici)
            secili = None
            for e in liste:
                if e["id"] == secilen:
                    secili = e
                    break
            if not secilen and liste:
                secili = liste[0]
            # Secilen anahtar SILINMISSE baskasina sessizce gecilmez.
            eksik = bool(secilen) and secili is None
            return {
                "role": role, "from": imlec,
                "inherited": imlec != role,
                "provider": saglayici,
                "provider_label": (PROVIDERS.get(saglayici) or {}).get(
                    "label", saglayici),
                "model": a.get("model") or "",
                "key_id": secili["id"] if secili else secilen,
                "key_label": secili["label"] if secili else "",
                "key_user": (secili or {}).get("user") or "",
                "key_missing": eksik,
                "key_set": bool(secili and secili["key"]),
                "chain": zincir,
            }
        imlec = ROLES[imlec]["parent"]
    return {"role": role, "from": None, "inherited": False, "provider": None,
            "provider_label": "", "model": "", "key_id": "", "key_label": "",
            "key_user": "", "key_missing": False, "key_set": False,
            "chain": zincir}


def read(cfg):
    """Disari cikan hal — ANAHTARLAR MASKELI."""
    anahtarlar = keys(cfg)
    saglayicilar = []
    # Onerilen saglayici ONCE gelir. Alfabetik sira, kullaniciya «once
    # sunu dene» demenin tam tersini yapiyordu: listenin basinda onerilmeyen
    # bir secenek duruyordu.
    def _sira(ad):
        return (0 if ad == "openrouter" else 1, ad)

    for ad in sorted(PROVIDERS, key=_sira):
        tanim = PROVIDERS[ad]
        saglayicilar.append({
            "id": ad, "label": tanim["label"], "base": tanim["base"],
            "models": tanim["models"],
            "signup": tanim.get("signup", ""),
            "note": tanim.get("note", ""),
            "key_set": bool(anahtarlar.get(ad)),
            "key_hint": ("••••••" + str(anahtarlar[ad])[-2:])
                        if anahtarlar.get(ad) else "",
            # Anahtarlar TEK TEK cikar — ama degerleri degil, maskeleri.
            "keys": [{"id": e["id"], "label": e["label"],
                      "user": e.get("user") or VARSAYILAN_SAHIP,
                      "hint": "••••••" + str(e["key"])[-2:]}
                     for e in key_list(cfg, ad)],
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
            continue
        if isinstance(deger, str):
            # Tek anahtarli eski bicim: hala gecerlidir.
            if len(deger) > 400:
                hata.append("%s anahtarı fazla uzun" % ad)
            continue
        if not isinstance(deger, list):
            hata.append("%s anahtarı bir dize ya da liste olmalı" % ad)
            continue
        if len(deger) > 10:
            hata.append("%s için en çok 10 anahtar" % ad)
        gorulen = set()
        for e in deger:
            if not isinstance(e, dict):
                hata.append("%s: her anahtar bir nesne olmalı" % ad)
                continue
            for k in e:
                if k not in ("id", "label", "key", "user"):
                    hata.append("%s: bilinmeyen anahtar alanı %s" % (ad, k))
            kimlik = e.get("id") or ""
            if kimlik:
                if kimlik in gorulen:
                    hata.append("%s: aynı anahtar kimliği iki kez: %s"
                                % (ad, kimlik))
                gorulen.add(kimlik)
            for alan, ust in (("key", 400), ("label", 60), ("user", 40)):
                v = e.get(alan)
                if v is not None and not isinstance(v, str):
                    hata.append("%s.%s bir dize olmalı" % (ad, alan))
                elif isinstance(v, str) and len(v) > ust:
                    hata.append("%s.%s fazla uzun" % (ad, alan))
            # Yeni bir anahtar DEGERSIZ eklenemez: adı olan ama değeri
            # olmayan bir anahtar, kurulu sanılan bir boşluktur.
            if not kimlik and not (e.get("key") or ""):
                hata.append("%s: yeni anahtarın değeri boş olamaz" % ad)

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
            if k not in ("provider", "model", "key"):
                hata.append("%s içinde bilinmeyen alan: %s" % (rol, k))
        if deger.get("key") is not None and not isinstance(deger["key"], str):
            hata.append("%s.key bir dize olmalı" % rol)
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


def _sayac(cfg, provider):
    """Bu saglayici icin SIMDIYE KADAR verilmis en buyuk kimlik numarasi.

    Yalnizca var olan anahtarlara bakmak yetmezdi: hepsi silindiginde
    sayac sifirlanir ve bir sonraki anahtar eski bir kimligi geri
    alirdi — eski bir atama sessizce baska bir anahtara baglanmis
    olurdu. Bu yuzden sayac AYRICA saklanir ve geri gitmez."""
    ham = (_bolum(cfg).get("key_seq") or {})
    try:
        kayitli = int(ham.get(provider) or 0)
    except (TypeError, ValueError):
        kayitli = 0
    for e in key_list(cfg, provider):
        k = e["id"]
        if k.startswith("k") and k[1:].isdigit():
            kayitli = max(kayitli, int(k[1:]))
    return kayitli


def _anahtarlari_birlestir(cfg, provider, gelen, sayac=None):
    """Liste bicimli anahtar yamasi.

    · Listede OLMAYAN anahtar silinir (ekrandaki «Sil» budur).
    · Kimligi olan ama degeri BOS gelen anahtarin sirri KORUNUR — ekran
      maskeyi geri gonderdiginde sirrin silinmesi, kaydetmeyi tehlikeli
      bir is yapardi.
    · Kimliksiz gelen yeni anahtardir ve yeni bir kimlik alir."""
    eski = {e["id"]: e for e in key_list(cfg, provider)}
    no = _sayac(cfg, provider) if sayac is None else sayac
    out = []
    for e in gelen:
        if not isinstance(e, dict):
            continue
        kimlik = e.get("id") or ""
        sir = e.get("key") or ""
        if kimlik and kimlik in eski:
            if not sir:
                sir = eski[kimlik]["key"]
        elif kimlik:
            continue                     # artik olmayan bir kimlik
        else:
            if not sir:
                continue
            no += 1
            kimlik = "k%d" % no
        if not sir:
            continue
        out.append({"id": kimlik,
                    "label": (e.get("label") or "").strip()
                             or "Anahtar %d" % (len(out) + 1),
                    "key": sir,
                    "user": (e.get("user") or "").strip() or VARSAYILAN_SAHIP})
    return out, no


def apply(cfg, patch):
    """Dogrulanmis yamayi birlestirir.

    BOS DIZE ANAHTARI SILER: bir sirri silmenin yolu, dosyayi elle
    duzenlemek olmamali."""
    bolum = dict(_bolum(cfg))
    anahtarlar = dict(bolum.get("keys") or {})
    # Sayac YAMADAN GELMEZ, burada tutulur: istemcinin yazabildigi bir
    # sayac, kimlik geri vermenin kapisi olurdu.
    sayaclar = dict(bolum.get("key_seq") or {})
    for ad, deger in (patch.get("keys") or {}).items():
        if deger == "":
            anahtarlar.pop(ad, None)
        elif isinstance(deger, str):
            anahtarlar[ad] = deger
        elif isinstance(deger, list):
            liste, no = _anahtarlari_birlestir(cfg, ad, deger)
            sayaclar[ad] = no
            if liste:
                anahtarlar[ad] = liste
            else:
                anahtarlar.pop(ad, None)
    atamalar = dict(bolum.get("assignments") or {})
    for rol, deger in (patch.get("assignments") or {}).items():
        if deger is None or (isinstance(deger, dict) and not deger.get("provider")):
            atamalar.pop(rol, None)
        else:
            atamalar[rol] = {"provider": deger.get("provider"),
                             "model": deger.get("model") or "",
                             "key": deger.get("key") or ""}
    bolum["keys"] = anahtarlar
    bolum["assignments"] = atamalar
    if sayaclar:
        bolum["key_seq"] = sayaclar
    yeni = dict(cfg or {})
    yeni["models"] = bolum
    return yeni


# ------------------------------------------------------------------- sinama

def probe(cfg, provider, transport=None, timeout=10, key_id=None):
    """Anahtari SINAR. «Kurulu» ile «calisiyor» ayri seylerdir.

    Once bos bir POST atiliyordu ve 400/422 donmesi «anahtar kabul edildi»
    sayiliyordu. Iki sorun birden vardi:

      · Bos isteğe 400 donmesi, anahtarin gecerli oldugunu KANITLAMAZ —
        istek gövdesi bozuk oldugu icin de 400 doner.
      · Google'in o adresi POST kabul etmez ve 404 doner: dogru anahtar
        girmis bir kullanici «basarisiz» goruyordu.

    Artik saglayicinin MODEL LISTESI ucu GET ile cagriliyor. Bu uc
    kimlik dogrular, para harcamaz ve cevabi tek anlamlidir: 200 gecerli,
    401/403 reddedildi."""
    tanim = PROVIDERS.get(provider)
    if not tanim:
        return {"ok": False, "reason": "unknown-provider",
                "note": "Bilinmeyen sağlayıcı."}
    # Hangi anahtar sinaniyorsa O sinanir: «saglayici calisiyor» demek,
    # ikinci anahtarin da calistigini gostermez.
    anahtar = key_value(cfg, provider, key_id)
    if not anahtar and provider != "yerel":
        return {"ok": False, "reason": "no-key",
                "note": ("Seçilen anahtar bulunamadı." if key_id else
                         "Bu sağlayıcı için anahtar girilmemiş.")}
    if transport is not None:
        return transport(provider, tanim, anahtar)

    baslik = {"Accept": "application/json"}
    if anahtar:
        if tanim["key_header"] == "Authorization":
            baslik["Authorization"] = "Bearer " + anahtar
        else:
            baslik[tanim["key_header"]] = anahtar
    if provider == "anthropic":
        baslik["anthropic-version"] = "2023-06-01"

    url = tanim.get("probe") or tanim["base"]
    istek = urllib.request.Request(url, headers=baslik, method="GET")
    try:
        with urllib.request.urlopen(istek, timeout=timeout) as r:
            govde = r.read(4000).decode("utf-8", "replace")
            return {"ok": True, "status": r.status,
                    "note": _probe_notu(provider, govde)}
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            return {"ok": False, "status": e.code, "reason": "unauthorized",
                    "note": "Anahtar reddedildi. Yanlış ya da süresi dolmuş "
                            "olabilir."}
        if e.code == 404:
            return {"ok": False, "status": 404, "reason": "not-found",
                    "note": "Sağlayıcının adresi bulunamadı. Bu bir anahtar "
                            "hatası değil, adres hatasıdır."}
        if e.code == 429:
            return {"ok": False, "status": 429, "reason": "rate",
                    "note": "Sağlayıcı «çok fazla istek» dedi. Anahtar "
                            "büyük olasılıkla geçerli; birazdan tekrar dene."}
        return {"ok": False, "status": e.code, "reason": "http",
                "note": "Sağlayıcı %s döndü." % e.code}
    except Exception as e:                      # noqa: BLE001
        return {"ok": False, "reason": "unreachable",
                "note": "Ulaşılamadı (%s). İnternet bağlantısını kontrol et."
                        % type(e).__name__}


def _probe_notu(provider, govde):
    """Cevabin ICINDEN soylenebilecek seyi soyler, uydurmaz."""
    if provider == "openrouter":
        try:
            d = (json.loads(govde or "{}").get("data") or {})
        except ValueError:
            d = {}
        kalan = d.get("limit_remaining")
        harcanan = d.get("usage")
        if kalan is not None:
            return "Anahtar geçerli. Kalan limit: %s USD." % kalan
        if harcanan is not None:
            return "Anahtar geçerli. Bu anahtarla harcanan: %s USD." % harcanan
        return "Anahtar geçerli."
    try:
        veri = json.loads(govde or "{}")
        say = len(veri.get("data") or veri.get("models") or [])
    except ValueError:
        say = 0
    if say:
        return "Anahtar geçerli — %d model görünüyor." % say
    return "Anahtar geçerli."
