# -*- coding: utf-8 -*-
"""King'in ARAC KATALOGU — modelin hangi araci hangi parametreyle
cagiracagini secmesi (King 2.0, B asamasi; depo sahibi 2026-10-20: «King
sistemde olan her isi sohbetten yapabilsin»).

   NEDEN BOYLE

   Araclari modul calistirir: veri tarayicida, modulun kendi kokenindedir
   (AGENTS §1.4: HKM hicbir module yazmaz). HKM'nin isi yalniz SECIMDIR:

     istemci katalogu yollar  ->  model bir arac ve parametre secer
       ->  BU DOSYA dogrular  ->  istemci yine dogrular ve calistirir

   Uc kural bu dosyayi ayakta tutar:

   1. KAPALI KATALOG. Model yalniz istemcinin yolladigi katalogdaki bir
      araci cagirabilir. Bilinmeyen arac, semaya uymayan parametre, fazla
      alan REDDEDILIR; reddedilen cagri sessizce yutulmaz, nedeniyle doner.
   2. SAYIYI KOD URETIR. Okuma aracinin sonucunu modul kodu hesaplar; ikinci
      turda sonuc BAGLAMA girer ve cevaptaki her sayi ona karsi denetlenir
      (ai.uydurma_sayilar). Model sonucu yalniz cumleye cevirir.
   3. YAZAN ARAC ONAYSIZ UYGULANMAZ. Bu dosya yalniz «yaz» turunu isaretler;
      onizleme karti ve onay istemcidedir (king.js). Model bir yazmayi
      «uygulandi» diye anlatamaz: yazma cagrisinda ikinci tur yoktur.

   ARAC CAGIRMAYAN MODEL

   gemma3 gibi araci desteklemeyen yerel modele katalog SUNULMAZ (ya da motor
   «does not support tools» derse bir kez aracsiz sorulur): cevap olagan
   sohbet cevabidir, isi istemcinin kural yolu yapar (NIYET, giris kapisi,
   yetki.js). Sahada (2026-10-20) metin protokolu («ARAC: ad {json}»)
   denendi: gemma3:4b protokole uymadi, yapmadigi isi «aktif edildi» diye
   anlatti; yarim guvenilir bir secici, hic secici olmamasindan kotudur."""

import json
import re

AD_RE = re.compile(r"^[a-z][a-z0-9_]{1,47}$")
TURLER = ("oku", "yaz")
EN_COK_ARAC = 80
EN_COK_ACIKLAMA = 400
EN_COK_CAGRI = 3
EN_COK_SONUC_HARF = 4000
EN_COK_SONUC = 5
TIPLER = ("string", "number", "integer", "boolean")

# Araci desteklemeyen yerel modeller (Ollama «does not support tools» der);
# boylesine bosuna bir istek atilmaz, katalog hic gitmez.
ARACSIZ = ("gemma3", "gemma2", "gemma:", "llama2", "phi3", "tinyllama")


def aracsiz_mi(model):
    m = str(model or "").lower()
    return any(m.startswith(x) for x in ARACSIZ)


# ------------------------------------------------------------------ katalog

def _sema_temizle(s):
    """Desteklenen kucuk sema altkumesi; disinda kalan katalogu bozar.
    Doner: (temiz, hata)."""
    if not isinstance(s, dict):
        return None, "parametreler bir nesne olmali"
    if s.get("type", "object") != "object":
        return None, "parametreler type=object olmali"
    ham = s.get("properties") or {}
    if not isinstance(ham, dict) or len(ham) > 12:
        return None, "properties bir nesne olmali (en cok 12 alan)"
    props = {}
    for ad, p in ham.items():
        if not AD_RE.match(str(ad)) and not re.match(r"^[a-zA-Z][a-zA-Z0-9_]{0,31}$", str(ad)):
            return None, "gecersiz alan adi: %s" % ad
        if not isinstance(p, dict) or p.get("type") not in TIPLER:
            return None, "%s alaninin tipi string/number/integer/boolean olmali" % ad
        q = {"type": p["type"]}
        if p.get("description"):
            q["description"] = str(p["description"])[:200]
        if isinstance(p.get("enum"), list) and p["enum"]:
            q["enum"] = [x for x in p["enum"][:40] if isinstance(x, (str, int, float)) and not isinstance(x, bool)]
        for k in ("minimum", "maximum"):
            if isinstance(p.get(k), (int, float)) and not isinstance(p.get(k), bool):
                q[k] = p[k]
        if isinstance(p.get("maxLength"), int) and p["maxLength"] > 0:
            q["maxLength"] = min(p["maxLength"], 2000)
        props[str(ad)] = q
    zorunlu = [x for x in (s.get("required") or []) if x in props]
    return {"type": "object", "properties": props, "required": zorunlu}, None


def katalog_temizle(ham):
    """Istemcinin yolladigi katalog -> (temiz_liste, reddedilen). Bozuk
    satir katalogdan duser (nedeniyle); model onu hic gormez."""
    if not isinstance(ham, list):
        return [], ["katalog bir liste olmali"]
    temiz, red, gorulen = [], [], set()
    for a in ham[:EN_COK_ARAC]:
        if not isinstance(a, dict):
            red.append("satir nesne degil")
            continue
        ad = str(a.get("ad") or "")
        if not AD_RE.match(ad) or ad in gorulen:
            red.append("gecersiz ya da yinelenen ad: %s" % ad[:40])
            continue
        if a.get("tur") not in TURLER:
            red.append("%s: tur oku|yaz olmali" % ad)
            continue
        sema, hata = _sema_temizle(a.get("parametreler") or {"type": "object", "properties": {}})
        if hata:
            red.append("%s: %s" % (ad, hata))
            continue
        aciklama = " ".join(str(a.get("aciklama") or "").split())[:EN_COK_ACIKLAMA]
        if not aciklama:
            red.append("%s: aciklama yok" % ad)
            continue
        gorulen.add(ad)
        temiz.append({"ad": ad, "aciklama": aciklama, "tur": a["tur"], "parametreler": sema})
    return temiz, red


def _bul(katalog, ad):
    for a in katalog or []:
        if a["ad"] == ad:
            return a
    return None


# -------------------------------------------------------------- dogrulama

def _tip_uyar(tip, v):
    if tip == "string":
        return isinstance(v, str)
    if tip == "boolean":
        return isinstance(v, bool)
    if isinstance(v, bool):
        return False
    if tip == "integer":
        return isinstance(v, int) or (isinstance(v, float) and v.is_integer())
    return isinstance(v, (int, float))


def param_dogrula(sema, param):
    """(temiz, hata). Fazla alan, eksik zorunlu alan, yanlis tip, enum
    disi deger ve sinir disi sayi reddedilir; tahminle duzeltilmez."""
    if param is None:
        param = {}
    if not isinstance(param, dict):
        return None, "parametreler bir nesne olmali"
    props = sema.get("properties") or {}
    fazla = [k for k in param if k not in props]
    if fazla:
        return None, "tanimsiz parametre: %s" % ", ".join(sorted(fazla)[:4])
    eksik = [k for k in sema.get("required") or [] if param.get(k) in (None, "")]
    if eksik:
        return None, "eksik parametre: %s" % ", ".join(eksik)
    temiz = {}
    for k, v in param.items():
        p = props[k]
        if v is None:
            continue
        if not _tip_uyar(p["type"], v):
            return None, "%s %s olmali" % (k, p["type"])
        if p["type"] == "integer":
            v = int(v)
        if "enum" in p and v not in p["enum"]:
            return None, "%s izinli degerlerden biri olmali" % k
        if "minimum" in p and v < p["minimum"]:
            return None, "%s en az %s olmali" % (k, p["minimum"])
        if "maximum" in p and v > p["maximum"]:
            return None, "%s en cok %s olmali" % (k, p["maximum"])
        if p["type"] == "string":
            v = v.strip()
            if len(v) > p.get("maxLength", 2000):
                return None, "%s cok uzun" % k
        temiz[k] = v
    return temiz, None


def gevsek_json(metin):
    """Kucuk modelin yazdigi nesne: once kati JSON; olmazsa tirnaksiz anahtar
    ve tek tirnak duzeltilip bir kez daha. Yine olmazsa None (tahmin yok)."""
    s = (metin or "").strip() or "{}"
    try:
        return json.loads(s)
    except ValueError:
        pass
    s2 = re.sub(r"([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:", r'\1"\2":', s.replace("'", '"'))
    try:
        v = json.loads(s2)
    except ValueError:
        return None
    return v if isinstance(v, dict) else None


def cagri_dogrula(cagrilar, katalog):
    """Modelin cagrilari -> (gecerli, reddedilen). Her gecerli cagri
    {ad, param, tur}; reddedilen {ad, neden}."""
    gecerli, red = [], []
    for c in (cagrilar or [])[:10]:
        ad = str((c or {}).get("ad") or "")
        param = (c or {}).get("param")
        if isinstance(param, str):
            param = gevsek_json(param)
            if param is None:
                red.append({"ad": ad, "neden": "parametreler JSON degil"})
                continue
        a = _bul(katalog, ad)
        if not a:
            red.append({"ad": ad[:48], "neden": "katalogda boyle bir arac yok"})
            continue
        temiz, hata = param_dogrula(a["parametreler"], param)
        if hata:
            red.append({"ad": ad, "neden": hata})
            continue
        if any(g["ad"] == ad and g["param"] == temiz for g in gecerli):
            continue
        gecerli.append({"ad": ad, "param": temiz, "tur": a["tur"]})
    return gecerli[:EN_COK_CAGRI], red


# ------------------------------------------------------ saglayici bicimleri

def _sema_saglayiciya(sema, google=False):
    s = json.loads(json.dumps(sema))
    if not s.get("required"):
        s.pop("required", None)
    if google:
        # Gemini sema altkumesi: enum yalniz metin, maxLength yok.
        for p in s.get("properties", {}).values():
            p.pop("maxLength", None)
            if "enum" in p:
                p["enum"] = [str(x) for x in p["enum"]]
                if p["type"] != "string":
                    p.pop("enum")
        if not s.get("properties"):
            return None
    return s


def saglayici_araclari(provider, katalog):
    """Genel katalog -> saglayicinin `tools` bicimi."""
    if provider == "anthropic":
        return [{"name": a["ad"], "description": a["aciklama"],
                 "input_schema": _sema_saglayiciya(a["parametreler"])} for a in katalog]
    if provider == "google":
        bildir = []
        for a in katalog:
            d = {"name": a["ad"], "description": a["aciklama"]}
            s = _sema_saglayiciya(a["parametreler"], google=True)
            if s:
                d["parameters"] = s
            bildir.append(d)
        return [{"functionDeclarations": bildir}]
    return [{"type": "function", "function": {"name": a["ad"], "description": a["aciklama"],
                                              "parameters": _sema_saglayiciya(a["parametreler"])}}
            for a in katalog]


def openai_cagrilari(mesaj):
    out = []
    for c in (mesaj or {}).get("tool_calls") or []:
        f = (c or {}).get("function") or {}
        if f.get("name"):
            out.append({"ad": f["name"], "param": f.get("arguments")})
    return out


def anthropic_cagrilari(icerik):
    return [{"ad": p.get("name"), "param": p.get("input")}
            for p in (icerik or []) if (p or {}).get("type") == "tool_use"]


def google_cagrilari(parcalar):
    return [{"ad": (p.get("functionCall") or {}).get("name"), "param": (p.get("functionCall") or {}).get("args")}
            for p in (parcalar or []) if (p or {}).get("functionCall")]


# ------------------------------------------------------------ ikinci tur

def sonuclari_temizle(ham, katalog):
    """Istemcinin calistirdigi okuma araclarinin sonuclari. Yalniz
    katalogdaki «oku» araclari; her sonuc JSON'a cevrilir ve kirpilir."""
    out = []
    if not isinstance(ham, list):
        return out
    for s in ham[:EN_COK_SONUC]:
        if not isinstance(s, dict):
            continue
        a = _bul(katalog, str(s.get("ad") or "")) if katalog else None
        if katalog and (not a or a["tur"] != "oku"):
            continue
        ad = str(s.get("ad") or "")
        if not AD_RE.match(ad):
            continue
        try:
            metin = json.dumps(s.get("sonuc"), ensure_ascii=False, sort_keys=True)
        except (TypeError, ValueError):
            continue
        out.append({"ad": ad, "metin": metin[:EN_COK_SONUC_HARF], "kirpildi": len(metin) > EN_COK_SONUC_HARF})
    return out


SONUC_TALIMATI = ("\n\nAŞAĞIDAKİ ARAÇ SONUÇLARINI KOD ÜRETTİ (kullanıcının kendi kayıtları). Cevabını YALNIZ "
                  "bunlara dayandır; sonuçta olmayan sayıyı yazma, sayıyı değiştirme, yuvarlama. «veri yok» "
                  "ya da null olanı «veri yok» diye söyle, sıfır deme. Kısa ve doğal Türkçe yaz; araç adını "
                  "ve JSON'u kullanıcıya gösterme.")


def sonuc_baglami(sonuclar):
    if not sonuclar:
        return ""
    return "Araç sonuçları:\n" + "\n".join(
        "[%s] %s%s" % (s["ad"], s["metin"], " (kırpıldı)" if s["kirpildi"] else "") for s in sonuclar)
