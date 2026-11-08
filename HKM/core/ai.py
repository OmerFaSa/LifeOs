# -*- coding: utf-8 -*-
"""Model çağrısı — TEK KAPI.

   Hicbir modul bir saglayiciya dogrudan istek atamaz. Butun cagrilar
   buradan gecer; cunku bir cagrinin yaninda her zaman dort sey olmali:

     butce   para harcamadan once sinir sorulur
     defter  harcanan yazilir (BASARISIZ cagri da)
     sinir   cevap kural motorunun yerine gecemez
     kaynak  hangi veriye dayandigi soylenebilir olmali

   Bu dordu ayri ayri yazilsaydi, biri bir gun unutulurdu.

   YEDI KURAL — hepsi bir seyi korur: MODEL OTORITE DEGILDIR.

   1. KURAL MOTORU OTORITEDIR. Modele giden sey, kural motorunun URETTIGI
      olculerdir; model onlari cumleye cevirir. Model sayi uretmez, esik
      degistirmez, karar vermez.

   2. MODEL SAYI UYDURAMAZ. Cevapta gecen her sayi, gonderilen baglamda
      bulunmali. Bulunmayan bir sayi tasiyan cevap DUSURULUR — uydurulmus
      bir olcum, olcum olmayan bir seyi olcum gibi gosterir.

   3. BUYURGAN KIP DUSURULUR. «Yap», «kapat», «zorunlu» — HKM'nin isletim
      sistemi seviyesinde boyle bir yetkisi yoktur ve dili de tasiyamaz.

   4. BUTCE ONCE SORULUR. Sinira varilmissa ucretli cagri YAPILMAZ ve
      bu soylenir; kural motoru calismaya devam eder.

   5. HER CAGRI DEFTERE YAZILIR. Basarisiz olan da: para, cevap
      alinmadan da harcanmis olabilir.

   6. MODEL MODELI CAGIRMAZ. Bu kapidan gecen bir cagri, icinden yeni bir
      cagri baslatamaz; zincir burada sayilir ve ikinci seviyede durur.

   7. ATANMAMIS KADEME CAGRI YAPMAZ. «Varsayilan bir model» uydurmak,
      kullanicinin secmedigi bir modele para odemesidir.
"""

import base64
import datetime
import hashlib
import json
import re
import threading
import time
import urllib.error
import urllib.request

from core import arac, butce, manager, models

ZAMAN_ASIMI = 60
# Yerel model ILK CEVABI (soket suresi, cevap akarken dolmaz). Olcum, bu bilgisayarin
# Ollama gunlugu 2026-10-23..11-06: 509 basarili cagri, medyan 0,44 sn, %99 20 sn, en yavasi
# oyun acikken 43,4 sn; 60 sn'de kesilen 3 cagri. Kesmek bosa gitmekten de kotu: Ollama istemci
# kopunca yuklemeyi IPTAL eder («aborting load»), sonraki cagri bastan yukler. Olculen en
# yavasin ~2,8 kati; asan cagri «mesgul» sayilir. Sinama (model listesi) kisa kalir.
YEREL_ZAMAN_ASIMI = 120
# Yerel motor ayakta ama cevap zamaninda gelmedi: model bellege yukleniyor
# olabilir (soguk baslangic). Deftere bu isaretle yazilir; motor durumu
# ve merdiven bunu «kapali»dan ayirir.
YEREL_GEC = "yerel-gec"
# Model ayni anda tek cevap uretir (OLLAMA_NUM_PARALLEL 1). Sira burada beklenir ki bir
# mesajin suresi digerini beklerken islemesin (sahada 2 cagri sirada 60 sn'yi doldurdu).
_YEREL_SIRA = threading.Lock()
# Bellege sigmadi ya da yuklenemedi: GPU/RAM baska bir isle dolu (sahada: oyun).
YEREL_DOLU = re.compile(r"out.of.memory|more system memory|startup failed|unable to allocate", re.I)
YEREL_YOK = re.compile(r"\b404\b|not found", re.I)
YEREL_KAPALI = re.compile(r"10061|refused|reddetti", re.I)
# Saglik ucunun (daemon /api/health) okudugu son gercek cagri; o da cagri yapmaz.
YEREL_HAL_SN = 120
_YEREL_SON = {"hal": None, "t": 0.0}


class AkisKesildi(Exception):
    """Istemci gitti (sayfa kapandi): okuma kesilir, baglanti kapanir, model bosa uretmez."""


def _yerel_sebep(hata):
    """Ham hata -> kullaniciya soylenecek sebebin kodu (sohbet.YEDEK_METIN); bilinmiyorsa None."""
    h = str(hata or "")
    return ("yerel-kapali" if YEREL_KAPALI.search(h) else
            "yerel-model-yok" if YEREL_YOK.search(h) else None)


def _yerel_yaz(hal):
    _YEREL_SON.update(hal=hal, t=time.monotonic())


def yerel_hal():
    """«hazir», «mesgul», «kapali» ya da «» (yakin zamanda cagri yok: veri yok)."""
    if time.monotonic() - _YEREL_SON["t"] > YEREL_HAL_SN:
        return ""
    return _YEREL_SON["hal"] or ""
EN_COK_MESAJ = 12          # gecmisin tamami her turda gonderilmez
EN_COK_JETON = 1200        # cevap uzunlugu sinirlari

# AYNI ISTEK ONBELLEGI (KING-4 Olcum 1b). Ayni rol, model, sistem metni,
# baglam ve mesajlar ONBELLEK_SN icinde ikinci kez modele gitmez (cift
# gonderim, yeniden deneme, ayni analizi isteyen iki ekran). Yalniz basarili
# duz metin saklanir; arac, gorsel ve medya cagrisi hic saklanmaz. Baglam
# olculeri tasidigi icin veri degisince anahtar da degisir.
ONBELLEK_SN = 120
ONBELLEK_EN_COK = 64
_ONBELLEK = {}
_ONBELLEK_KILIT = threading.Lock()

# ROL BASINA BAGLAM BUTCESI (tahmini jeton: sistem metni + gecmis). Asilirsa
# EN ESKI gecmis mesaji duser; sistem metni (olculer) ve son kullanici mesaji
# kirpilmaz. Ollama baglami 8K: 1200 jetonluk cevaba ve arac katalogu payina
# yer kalir. Anahtar: tam rol, sonra on ek (bam.*), sonra son ek (*.sohbet).
BAGLAM_BUTCE = {"king": 3500, "sohbet": 3000, "gorsel": 2000, "bam": 6000}
BAGLAM_VARSAYILAN = 4000


def baglam_butcesi(role):
    r = str(role or "")
    return (BAGLAM_BUTCE.get(r) or BAGLAM_BUTCE.get(r.split(".")[0])
            or BAGLAM_BUTCE.get(r.rsplit(".", 1)[-1]) or BAGLAM_VARSAYILAN)


def butceye_sigdir(role, sistem, mesajlar):
    """Butceyi asan gecmisin en eskisinden atar; kirpilan bas asistan
    mesajiyla baslamaz. Doner: (mesajlar, atilan_sayi)."""
    m = list(mesajlar or [])
    sinir, n = baglam_butcesi(role), len(m)
    while len(m) > 1 and _jeton_tahmini(sistem, *[x.get("content") for x in m]) > sinir:
        m.pop(0)
    while len(m) < n and len(m) > 1 and m[0].get("role") != "user":
        m.pop(0)
    return m, n - len(m)


def _onbellek_anahtari(*parca):
    return hashlib.sha256(json.dumps(parca, ensure_ascii=False, sort_keys=True,
                                     default=str).encode("utf-8")).hexdigest()


def _onbellek_al(anahtar):
    with _ONBELLEK_KILIT:
        k = _ONBELLEK.get(anahtar)
        if k and time.monotonic() - k[0] <= ONBELLEK_SN:
            return dict(k[1])
        _ONBELLEK.pop(anahtar, None)
        return None


def _onbellek_koy(anahtar, r):
    with _ONBELLEK_KILIT:
        if len(_ONBELLEK) >= ONBELLEK_EN_COK:
            _ONBELLEK.pop(min(_ONBELLEK, key=lambda x: _ONBELLEK[x][0]))
        _ONBELLEK[anahtar] = (time.monotonic(), dict(r))


# --------------------------------------------------------------- saglayici

def _openai_bicimi(url, anahtar, model, sistem, mesajlar, ek_baslik=None):
    govde = {"model": model, "max_tokens": EN_COK_JETON,
             "messages": ([{"role": "system", "content": sistem}] if sistem
                          else []) + mesajlar}
    baslik = {"Content-Type": "application/json",
              "Authorization": "Bearer " + anahtar}
    baslik.update(ek_baslik or {})
    return url, baslik, govde


def _zaman_asimi_mi(e):
    import socket
    if isinstance(e, (TimeoutError, socket.timeout)):
        return True
    return isinstance(e, urllib.error.URLError) and isinstance(
        getattr(e, "reason", None), (TimeoutError, socket.timeout))


def _sse_birlestir(satirlar, akis, yalniz_arac=False):
    """Akan cevap (OpenAI bicimi, «data: {...}» satirlari) -> tek cevap.
    Her metin parcasi `akis(parca)` ile disari verilir; sonda `akis(None)`.
    `yalniz_arac`: arac secimi turu; arac cagrisi ilk jetonlarda gelir, metin
    baslarsa okuma kesilir (model cevabin kalanini bosuna yazmaz).
    Doner: _istek'in dondurdugu bicim (choices, usage)."""
    metin, usage, bitis, cagri = [], None, None, {}
    for ham in satirlar:
        s = (ham.decode("utf-8", "replace") if isinstance(ham, bytes) else str(ham)).strip()
        if not s.startswith("data:"):
            continue
        veri = s[5:].strip()
        if veri == "[DONE]":
            break
        try:
            y = json.loads(veri)
        except ValueError:
            continue
        if y.get("usage"):
            usage = y["usage"]
        for c in y.get("choices") or []:
            # Arac secimi parca parca gelir: ad bir kez, arguman parcalar halinde.
            for t in (c.get("delta") or {}).get("tool_calls") or []:
                g = cagri.setdefault(t.get("index", len(cagri)), {"name": "", "arguments": ""})
                f = t.get("function") or {}
                g["name"] = g["name"] or f.get("name") or ""
                g["arguments"] += f.get("arguments") or ""
            d = (c.get("delta") or {}).get("content")
            if d:
                if yalniz_arac and d.strip() and not cagri:
                    return {"choices": [{"message": {"content": ""}, "finish_reason": "stop"}], "usage": usage or {}}
                metin.append(d)
                try:
                    akis(d)
                except Exception:               # noqa: BLE001 — ekran kopsa da cevap tamamlanir
                    pass
            if c.get("finish_reason"):
                bitis = c["finish_reason"]
    try:
        akis(None)
    except Exception:                           # noqa: BLE001
        pass
    mesaj = {"content": "".join(metin)}
    if cagri:
        mesaj["tool_calls"] = [{"function": cagri[i]} for i in sorted(cagri)]
    return {"choices": [{"message": mesaj, "finish_reason": bitis}], "usage": usage or {}}


def _gemini_birlestir(satirlar, akis):
    """Gemini akisi («data: {candidates, usageMetadata}» satirlari) -> tek cevap."""
    metin, usage, bitis, cagri = [], {}, None, []
    for ham in satirlar:
        s = (ham.decode("utf-8", "replace") if isinstance(ham, bytes) else str(ham)).strip()
        if not s.startswith("data:"):
            continue
        try:
            y = json.loads(s[5:].strip())
        except ValueError:
            continue
        if y.get("usageMetadata"):
            usage = y["usageMetadata"]
        aday = (y.get("candidates") or [{}])[0]
        for p in ((aday.get("content") or {}).get("parts") or []):
            if p.get("functionCall"):
                cagri.append({"functionCall": p["functionCall"]})
            d = p.get("text")
            if d:
                metin.append(d)
                try:
                    akis(d)
                except Exception:               # noqa: BLE001
                    pass
        if aday.get("finishReason"):
            bitis = aday["finishReason"]
    try:
        akis(None)
    except Exception:                           # noqa: BLE001
        pass
    return {"candidates": [{"content": {"parts": [{"text": "".join(metin)}] + cagri}, "finishReason": bitis}],
            "usageMetadata": usage}


def _iptalli(satirlar, iptal):
    for s in satirlar:
        if iptal():
            raise AkisKesildi("istemci gitti")
        yield s


def _akis_istek(url, baslik, govde, timeout, akis, birlestir=None, iptal=None):
    r = urllib.request.Request(url, data=json.dumps(govde).encode("utf-8"),
                               headers=baslik, method="POST")
    with urllib.request.urlopen(r, timeout=timeout) as y:      # noqa: S310
        return (birlestir or _sse_birlestir)(_iptalli(y, iptal) if iptal else y, akis)


def _istek(url, baslik, govde, timeout=ZAMAN_ASIMI):
    r = urllib.request.Request(url, data=json.dumps(govde).encode("utf-8"),
                               headers=baslik, method="POST")
    with urllib.request.urlopen(r, timeout=timeout) as y:
        return json.loads(y.read().decode("utf-8", "replace") or "{}")


# Saglayicinin «neden durdum» cevabi. Uc bicimde uc ad tasir ama anlam
# ayni: cevap BITMEDI, jeton siniri doldugu icin KESILDI.
#
# Bu isaret bir sure hic okunmuyordu ve sonucu su oluyordu: model cumlenin
# ortasinda kesiliyor, biz bunu tamamlanmis bir cevap sayip oldugu gibi
# gonderiyorduk. Kullanici yarim bir cumle aliyor ve sebebini goremiyordu.
# Yarim bir cevabi tam gibi gostermek, olculmemis bir seyi olculmus gibi
# gostermekle ayni aileden bir yanlistir.
KESILDI = {"length", "max_tokens", "MAX_TOKENS"}


# ------------------------------------------------------------------ gorsel
#
# Gorsel OKUMAK (fis, ekran goruntusu) modelin isidir; okunanin DOGRULUGU
# kodun ve kullanicinin. Gorsel son kullanici mesajina `gorseller` olarak
# eklenir ve her saglayicinin kendi bicimine burada cevrilir.
GORSEL_MIME = ("image/jpeg", "image/png", "image/webp")
GORSEL_EN_COK_BAYT = 5 * 1024 * 1024
GORSEL_EN_COK = 4
# Bir gorselin giris jetonu saglayiciya ve boyuta gore degisir; cagri
# ONCESI bilinemez. Tavan sorusu icin en kotu duruma yakin bir TAHMIN.
GORSEL_JETON = 1600


def gorsel_dogrula(gorseller):
    """(temiz_liste, hata). Hata varsa hicbir gorsel gitmez."""
    if not isinstance(gorseller, list) or not gorseller:
        return [], "Görsel yok."
    if len(gorseller) > GORSEL_EN_COK:
        return [], "Bir seferde en çok %d görsel." % GORSEL_EN_COK
    temiz = []
    for g in gorseller:
        if not isinstance(g, dict) or g.get("mime") not in GORSEL_MIME:
            return [], "Görsel JPEG, PNG ya da WEBP olmalı."
        try:
            ham = base64.b64decode(str(g.get("data") or ""), validate=True)
        except (ValueError, TypeError):
            return [], "Görsel verisi okunamadı (base64 değil)."
        if not ham:
            return [], "Görsel boş."
        if len(ham) > GORSEL_EN_COK_BAYT:
            return [], "Görsel %d MB'tan büyük." % (GORSEL_EN_COK_BAYT // (1024 * 1024))
        temiz.append({"mime": g["mime"], "data": str(g["data"])})
    return temiz, None


# SES ve VIDEO (core/cozumle.py; kullanici karari 2026-09-25: Gemini).
# Yalniz Google saglayicisi satir ici ses/video kabul eder; baska bir
# saglayiciya ses gonderilmez. Gemini'nin satir ici istek siniri 20 MB.
MEDYA_ONEK = ("audio/", "video/")
MEDYA_EN_COK_BAYT = 18 * 1024 * 1024


def medya_dogrula(medya):
    """(temiz_liste, hata). Tek oge; ses ya da video; 18 MB'tan kucuk."""
    if not isinstance(medya, list) or len(medya) != 1 or not isinstance(medya[0], dict):
        return [], "Tek bir ses ya da video gerekli."
    x = medya[0]
    if not str(x.get("mime") or "").startswith(MEDYA_ONEK):
        return [], "Yalnız ses ya da video çözümlenir."
    try:
        ham = base64.b64decode(str(x.get("data") or ""), validate=True)
    except (ValueError, TypeError):
        return [], "Medya verisi okunamadı (base64 değil)."
    if not ham:
        return [], "Medya boş."
    if len(ham) > MEDYA_EN_COK_BAYT:
        return [], "Dosya %d MB'tan büyük; Gemini'ye satır içi gönderilemez." % (
            MEDYA_EN_COK_BAYT // (1024 * 1024))
    return [{"mime": x["mime"], "data": str(x["data"]),
             "jeton": int(x.get("jeton") or GORSEL_JETON)}], None


def _openai_mesaj(m):
    g = m.get("gorseller")
    if not g:
        return {"role": m["role"], "content": m["content"]}
    return {"role": m["role"], "content": [{"type": "text", "text": m["content"]}] + [
        {"type": "image_url", "image_url": {"url": "data:%s;base64,%s" % (x["mime"], x["data"])}}
        for x in g]}


def _anthropic_mesaj(m):
    g = m.get("gorseller")
    if not g:
        return {"role": m["role"], "content": m["content"]}
    return {"role": m["role"], "content": [
        {"type": "image", "source": {"type": "base64", "media_type": x["mime"], "data": x["data"]}}
        for x in g] + [{"type": "text", "text": m["content"]}]}


def _google_parcalar(m):
    return [{"inline_data": {"mime_type": x["mime"], "data": x["data"]}}
            for x in (m.get("gorseller") or [])] + [{"text": m["content"]}]


# Yerel (kucuk) modelin sicakligi. gemma3 gibi modellerin varsayilani 1.0;
# 1B boyutta bu, anlamsiz Turkce uretiyordu (sahada, 2026-09-27). Bulut
# cagrisinda saglayicinin varsayilani kalir.
YEREL_SICAKLIK = 0.4
ARAC_SICAKLIK = 0.1


def _cagir(provider, anahtar, model, sistem, mesajlar, timeout=ZAMAN_ASIMI, ayar=None):
    """Saglayiciya gider. `ayar`: {jeton: cevap siniri, efor: low|medium|high}.

    Doner: (metin, giris_jeton, cikis_jeton, kesildi_mi)."""
    ayar = ayar or {}
    jeton = int(ayar.get("jeton") or EN_COK_JETON)
    timeout = ayar.get("sure") or (YEREL_ZAMAN_ASIMI if provider == "yerel" else timeout)
    tanim = models.PROVIDERS[provider]
    # ARAC KATALOGU (core/arac.py): model yalniz secer; cagrilar ek["cagrilar"]
    # ile doner ve ust katmanda dogrulanir. Cevap araclar varken de akar.
    araclar = ayar.get("araclar") or None
    if provider in ("openrouter", "openai", "yerel"):
        url, baslik, govde = _openai_bicimi(
            ayar.get("adres") or tanim["base"], anahtar or "", model, sistem,
            [_openai_mesaj(m) for m in mesajlar],
            {"HTTP-Referer": "http://127.0.0.1:4200", "X-Title": "HKM"}
            if provider == "openrouter" else None)
        govde["max_tokens"] = jeton
        if araclar:
            govde["tools"] = arac.saglayici_araclari(provider, araclar)
            govde["tool_choice"] = "auto"
        if provider == "yerel":
            # Arac SECIMI bir karardir, uslup degil: dusuk sicaklikta.
            govde["temperature"] = ARAC_SICAKLIK if araclar else YEREL_SICAKLIK
            # gemma4 ve qwen3 /v1'de varsayilan olarak DUSUNUR: jeton butcesi
            # dusunmeye gider, cevap gec ya da bos gelir (King 2.0 A devir
            # notu; sahada qwen3-vl bos cevap). Efor istenmediyse kapali.
            if not ayar.get("efor") and str(model).lower().startswith(("gemma4", "qwen3")):
                govde["reasoning_effort"] = "none"
        if provider == "openrouter":
            if ayar.get("efor"):
                # Birlesik dusunme ayari; desteklemeyen model yok sayar.
                # `exclude`: dusunme metni geri gelmez (bedeli yine olculur).
                govde["reasoning"] = {"effort": ayar["efor"], "exclude": True}
            # GERCEK BEDEL: OpenRouter cagrinin bedelini (onbellek indirimi ve
            # dusunme jetonlari dahil) cevapla doner — tarifeyle hesaplanan
            # tahminin yerine OLCUM yazilir.
            govde["usage"] = {"include": True}
            # ONBELLEK: Claude ve Gemini acik isaret ister; OpenAI ve DeepSeek
            # ayni oneki kendiliginden onbellekler. Saglayici kisa oneki
            # (~1024 jetonun alti) onbelleklemez; kazanc defterde olculur.
            if sistem and model.startswith(("anthropic/", "google/")) and govde["messages"] \
                    and govde["messages"][0].get("role") == "system":
                govde["messages"][0]["content"] = [{"type": "text", "text": sistem,
                                                    "cache_control": {"type": "ephemeral"}}]
        if ayar.get("yalniz_arac"):
            govde["stream"] = True
            y = _akis_istek(url, baslik, govde, timeout, lambda p: None,
                            lambda s, a: _sse_birlestir(s, a, yalniz_arac=True), iptal=ayar.get("iptal"))
        elif callable(ayar.get("akis")):
            # Akan cevap (King'de yazi akarak gelir); kullanim son parcada.
            govde["stream"] = True
            govde["stream_options"] = {"include_usage": True}
            y = _akis_istek(url, baslik, govde, timeout, ayar["akis"], iptal=ayar.get("iptal"))
        else:
            y = _istek(url, baslik, govde, timeout)
        secim = (y.get("choices") or [{}])[0]
        metin = (secim.get("message") or {}).get("content") or ""
        k = y.get("usage") or {}
        ek = {"usd": k.get("cost") if isinstance(k.get("cost"), (int, float)) else None,
              "cached": ((k.get("prompt_tokens_details") or {}).get("cached_tokens") or 0),
              "reasoning": ((k.get("completion_tokens_details") or {}).get("reasoning_tokens") or 0)}
        if araclar:
            ek["cagrilar"] = arac.openai_cagrilari(secim.get("message"))
        # Kullanim bilgisi yoksa None: olculmeyen sifir degildir (D-16).
        return (metin, k.get("prompt_tokens"), k.get("completion_tokens"),
                secim.get("finish_reason") in KESILDI, ek)

    if provider == "anthropic":
        govde = {"model": model, "max_tokens": jeton,
                 "messages": [_anthropic_mesaj(m) for m in mesajlar]}
        if sistem:
            # Onbellek isareti: ayni sistem metni sonraki turlarda indirimli
            # okunur (kisa onek onbelleklenmez; kazanc defterde olculur).
            govde["system"] = [{"type": "text", "text": sistem,
                                "cache_control": {"type": "ephemeral"}}]
        if araclar:
            govde["tools"] = arac.saglayici_araclari(provider, araclar)
        y = _istek(tanim["base"], {"Content-Type": "application/json",
                                   "x-api-key": anahtar or "",
                                   "anthropic-version": "2023-06-01"},
                   govde, timeout)
        parca = [p.get("text", "") for p in (y.get("content") or [])
                 if p.get("type") == "text"]
        k = y.get("usage") or {}
        okunan = k.get("cache_read_input_tokens") or 0
        # Anthropic giris sayisina onbellekten okunani katmaz; toplam giris
        # ikisinin toplamidir (tarife hesabi ustten, yani ihtiyatli kalir).
        gir = k.get("input_tokens")
        if gir is not None:
            gir = gir + okunan + (k.get("cache_creation_input_tokens") or 0)
        ek = {"usd": None, "cached": okunan, "reasoning": 0}
        if araclar:
            ek["cagrilar"] = arac.anthropic_cagrilari(y.get("content"))
        return ("\n".join(parca), gir, k.get("output_tokens"),
                y.get("stop_reason") in KESILDI, ek)

    if provider == "google":
        # Ayarlara gorunen ad yazilabiliyor («Gemini 2.5 Flash»); Google kimlik
        # bekler («gemini-2.5-flash»). Bosluklu ad adrese girince istek kurulamaz.
        model = "-".join(str(model).strip().lower().split())
        if model.startswith("models/"):
            model = model[len("models/"):]
        url = "%s/%s:generateContent" % (tanim["base"], model)
        icerik = [{"role": ("user" if m["role"] == "user" else "model"),
                   "parts": _google_parcalar(m)} for m in mesajlar]
        govde = {"contents": icerik,
                 "generationConfig": {"maxOutputTokens": jeton}}
        if sistem:
            govde["systemInstruction"] = {"parts": [{"text": sistem}]}
        if araclar:
            govde["tools"] = arac.saglayici_araclari(provider, araclar)
        baslik_g = {"Content-Type": "application/json", "x-goog-api-key": anahtar or ""}
        if callable(ayar.get("akis")):
            # Akan cevap: streamGenerateContent (SSE); kullanim son parcada.
            y = _akis_istek(url.replace(":generateContent", ":streamGenerateContent?alt=sse"), baslik_g, govde,
                            timeout, ayar["akis"], _gemini_birlestir)
        else:
            y = _istek(url, baslik_g, govde, timeout)
        aday = (y.get("candidates") or [{}])[0]
        parcalar = (aday.get("content") or {}).get("parts") or []
        parca = [p.get("text", "") for p in parcalar if p.get("text")]
        k = y.get("usageMetadata") or {}
        if araclar:
            return ("\n".join(parca), k.get("promptTokenCount"), k.get("candidatesTokenCount"),
                    aday.get("finishReason") in KESILDI, {"cagrilar": arac.google_cagrilari(parcalar)})
        return ("\n".join(parca), k.get("promptTokenCount"),
                k.get("candidatesTokenCount"),
                aday.get("finishReason") in KESILDI)

    raise ValueError("bilinmeyen saglayici: %s" % provider)


# ------------------------------------------------------------------ sinir

SAYI = re.compile(r"-?\d+(?:[.,]\d+)?")


def _sayilar(metin):
    return set(SAYI.findall(metin or ""))


# OLCUM SOZLERI — sistemin GERCEKTEN olctugu seylerin adlari.
#
# Kural «sayi uydurma» degil, «OLCUM uydurma»dir. Ikisini bir tutan bir
# denetci, «45 dakikalik bir blok deneyebilirsin» cumlesini de dusururdu:
# orada uydurulmus bir olcum yok, ONERILEN bir sure var. Bir oneri, gecmis
# hakkinda hicbir sey iddia etmez.
#
# Bu yuzden sayi ancak bir OLCUM ADINA baglandiginda ve cumle IDDIA
# kipinde oldugunda suphelidir.
OLCUM_SOZ = (
    "uyku", "uyu", "toparlan", "hrv", "nab[ıi]z", "nabz", "ad[ıi]m", "kilo",
    "protein", "kalori", "antrenman", "su tuket",
    "soru", "net", "[çc]al[ıi][şs]", "ders", "konu", "blok", "plana uyum",
    "do[ğg]ru oran",
    "kal[ıi]c[ıi]l[ıi]k", "kart", "pratik", "sentez", "okuma", "oturum",
    "ortalama", "skor", "seri", "e[şs]ik", "oran", "[öo]l[çc][üu]m",
)
OLCUM_RE = re.compile("|".join(OLCUM_SOZ), re.IGNORECASE)

# ONERI IZLERI — cumleyi gelecege ve kullanicinin secimine baglayan sozler.
# «Onerebilirim», «istersen», «deneyebilirsin»: bunlarin gectigi bir
# cumlede sayi, olculmus bir sey degil TEKLIF EDILEN bir seydir.
ONERI_SOZ = (
    "[öo]ner", "istersen", "dilersen", "ister misin", "olur mu",
    r"\w+[eaıioöuü]bilir", "deneyebil", "hedefl", "planla", "yar[ıi]n",
    "gelecek hafta", "bundan sonra", "[şs]imdilik", "belki", "olabilir",
)
ONERI_RE = re.compile("|".join(ONERI_SOZ), re.IGNORECASE)

# Cumleden kucuk parca: virgul ve «ama/ancak» da bir sinirdir. «Uyku
# ortalaman 7.83 saat, istersen artiralim» cumlesinde oneri izi IKINCI
# parcadadir ve birinci parcadaki uydurma olcumu aklamamali.
#
# Nokta ve virgul IKI RAKAMIN ARASINDA bolmez: «7.83» bir sayidir, iki
# parca degil. Boler gibi yapmak «7» ile «83»u ayri sayilar sayardi ve
# baglamdaki «4.5» bir daha eslesmezdi.
CUMLE_RE = re.compile(r"(?<!\d)[.](?!\d)|[!?;\n]")
PARCA_RE = re.compile(r"(?<!\d),(?!\d)|\bama\b|\bancak\b|\bfakat\b",
                      re.IGNORECASE)


# Sayi KULLANICIYA baglanmis mi: «senin», iyelik («uykun», «netin») ya da ikinci
# kisi fiil («calistin», «uyumussun»). «Pomodoro 25 dakika calisma» genel bilgidir.
KISIYE_BAGLI = re.compile(r"\b(?:senin|sana|sende|uykun|netin|netlerin|kilon|skorun|ortalaman|nabz[ıi]n|kalorin|"
                          r"proteinin|sorular[ıi]n|denemen|denemelerin|[çc]al[ıi][şs]man|oran[ıi]n)\b"
                          r"|\w{2,}(?:d|t)[ıiuü]n\b|\w+m[ıiuü][sş]s[ıiuü]n\b", re.IGNORECASE)


def uydurma_sayilar(cevap, baglam, genel=False):
    """Cevapta OLCUM gibi sunulan ama dayanagi olmayan sayilar.

    `genel`: mesaj kullanicinin verisine degmiyor (sohbet.sistem_konusu); genel
    bilgideki sayi serbesttir, yalniz kullaniciya baglanan sayi aranir.

    Uc kosul birden aranir:

      1. Sayi baglamda GECMIYOR (kural motoru boyle bir sey uretmedi),
      2. Sayinin bulundugu parcada bir OLCUM ADI geciyor,
      3. O parca ONERI kipinde DEGIL.

    Ucu birden saglanmadikca sayi serbesttir. Once her sayi suphe
    sayiliyordu ve «Saat 22:00'den sonra ekrani azaltmayi onerebilirim»
    gibi tamamen dogru bir cumle dusuruluyordu: kullanici sohbet
    edemiyor, yerine gunun brifingini aliyordu."""
    var = _sayilar(baglam)
    out = []
    for cumle in CUMLE_RE.split(cevap or ""):
        # ONERI KIPI ILERI DOGRU ISLER. «Istersen yarin iki saatlik bir
        # plan kuralim, 3 blok halinde» cumlesinde «3 blok» birinci
        # parcanin devamidir — ayri bir iddia degil. Ama «Uyku ortalaman
        # 7.83 saat, istersen artiralim» cumlesinde oneri SONRA gelir ve
        # kendinden ONCEKI iddiayi aklamaz.
        oneri = False
        for parca in PARCA_RE.split(cumle):
            if ONERI_RE.search(parca):
                oneri = True
            if oneri or not OLCUM_RE.search(parca) or (genel and not KISIYE_BAGLI.search(parca)):
                continue                # oneri kipi, olcum adi yok ya da genel bilgi
            for s in _sayilar(parca):
                if s not in var and s not in out:
                    out.append(s)
    return sorted(out)


def _belge(cevap):
    """Belge denetimi: yalniz bos cevap dusurulur."""
    metin = (cevap or "").strip()
    return (metin, None) if metin else (None, "Model boş cevap döndü.")


# King 5 D9 (deneme 2026-11-08): model matematigi LaTeX'le yaziyor («$2x + 3 = 11$»); ekran ve ses bunu
# dolar isaretiyle gosteriyordu. Sohbet cevabi duz yaziya cevrilir (belge/JSON cevabina dokunulmaz).
_LATEX = ((r"\\left\s*|\\right\s*", ""), (r"\\(?:text|mathrm|mathbf)\{([^{}]*)\}", r"\1"),
          (r"\\frac\{([^{}]*)\}\{([^{}]*)\}", r"\1/\2"), (r"\\sqrt\{([^{}]*)\}", r"√\1"),
          (r"\\cdot", "·"), (r"\\times", "×"), (r"\\div", "÷"), (r"\\pm", "±"), (r"\\leq?\b", "≤"),
          (r"\\geq?\b", "≥"), (r"\\neq\b", "≠"), (r"\\pi\b", "π"), (r"\\infty\b", "∞"), (r"\\approx\b", "≈"),
          (r"\^\{([^{}]*)\}", r"^\1"), (r"\$\$?([^$\n]{1,300}?)\$\$?", r"\1"))


def duz_matematik(metin):
    """«$\\frac{1}{2} \\cdot x$» → «1/2 · x». Dolar isareti yalniz cift olarak (ifade) kalkar."""
    t = str(metin or "")
    if "$" not in t and "\\" not in t:
        return t
    for desen, yerine in _LATEX:
        t = re.sub(desen, yerine, t)
    return t


def ic_ad_sil(metin):
    """«AYS modülünde» → «AYS bölümünde»: ic ad kullaniciya gitmez (tur 4: arac sonucu turunda «modül»)."""
    return re.sub(r"\b([Mm])odül", lambda m: "Bölüm" if m.group(1) == "M" else "bölüm", str(metin or ""))


def _temizle(cevap, baglam, genel=False):
    """(metin, dusurulen_sebep). Dusurulen cevap YUTULMAZ, soylenir."""
    metin = ic_ad_sil(duz_matematik((cevap or "").strip()))
    if not metin:
        return None, "Model boş cevap döndü."
    suc = manager.imperatives(metin)
    if suc:
        return None, ("Cevap buyurgan kip taşıdığı için düşürüldü (%s). "
                      "HKM'nin böyle bir yetkisi yok." % ", ".join(suc[:3]))
    uydurma = uydurma_sayilar(metin, baglam, genel=genel)
    if uydurma:
        return None, ("Cevapta dayanağı olmayan sayı(lar) geçtiği için "
                      "düşürüldü: %s. Ölçülmemiş bir sayı, ölçüm değildir."
                      % ", ".join(uydurma[:4]))
    return metin, None


# ------------------------------------------------------------------ cagri

def hazir_mi(cfg, role, seviye=None):
    """Bu kademe cagri yapabilir mi — ve yapamazsa NEDEN. Paket seciliyse
    merdivenin ilk basamagi (core/motor.py) sorulur."""
    from core import motor
    m = motor.merdiven(None, cfg, role, seviye=seviye)
    if m.get("basamaklar") or m.get("paket"):
        if not m["ok"]:
            return {"ok": False, "reason": m.get("reason"), "note": m.get("note")}
        return {"ok": True, "assignment": m["basamaklar"][0]["atama"]}
    a = models.resolve(cfg, role)
    if not a or not a.get("provider"):
        return {"ok": False, "reason": "no-model",
                "note": "Bu kademeye bir model atanmamış. Ayarlar → Yapay "
                        "zekâ → Görev dağılımı."}
    if not a.get("model"):
        return {"ok": False, "reason": "no-model-name",
                "note": "Sağlayıcı seçilmiş ama model adı yazılmamış."}
    if a.get("key_missing"):
        # Secilen anahtar SILINMIS. Baska bir anahtara sessizce gecmek,
        # baskasinin hesabindan para harcamak olurdu.
        return {"ok": False, "reason": "key-missing",
                "note": "Bu kademeye seçilen anahtar artık yok. Ayarlar → "
                        "Yapay zekâ'dan yeniden seç."}
    if not a.get("key_set"):
        return {"ok": False, "reason": "no-key",
                "note": "%s için anahtar girilmemiş." % a["provider_label"]}
    return {"ok": True, "assignment": a}


def _saglayici_hatasi(e):
    """Saglayicinin KENDI cumlesi. «HTTP 404» bir kullaniciya hicbir sey
    soylemez; «model not found: gemini-2.5-flush» tam olarak neyin yanlis
    oldugunu soyler. Sebebi yutmak, hatayi gizlemektir."""
    try:
        ham = e.read().decode("utf-8", "replace")[:600]
    except Exception:                           # noqa: BLE001
        ham = ""
    ayrinti = ""
    try:
        g = json.loads(ham or "{}")
        h = g.get("error") if isinstance(g.get("error"), dict) else None
        ayrinti = (h or {}).get("message") or g.get("message") or ""
        if not ayrinti and isinstance(g.get("error"), str):
            ayrinti = g["error"]
    except ValueError:
        ayrinti = " ".join((ham or "").split())[:200]
    kisa = {401: "Anahtar reddedildi.", 403: "Anahtar bu isteme yetkili değil.",
            404: "Model ya da adres bulunamadı — model adını kontrol et.",
            429: "Sağlayıcı «çok fazla istek» dedi.",
            402: "Sağlayıcıda bakiye kalmamış."}.get(e.code, "")
    return ("HTTP %s%s%s" % (e.code, " — " + kisa if kisa else "",
                             " (%s)" % ayrinti if ayrinti else ""))


# Dusen bir cevabin ardindan MODELE BIR KEZ soylenir. Kullaniciya «cevap
# dusuruldu» deyip birakmak, sohbeti her ihlalde kesmek demekti; oysa
# ihlalin ne oldugunu modele soylemek cogu zaman yeter.
# Cevap jeton sinirina dayandiysa modele BIR KEZ «kisa yaz» denir.
# Uzunlugu sessizce kesmek, yarim bir cumleyi tam cevap gibi gostermekti.
KISALT = ("Önceki cevabın uzunluk sınırına takıldı ve yarıda kesildi. "
          "Aynı şeyi DAHA KISA söyle: en fazla 3 cümle, madde listesi "
          "kullanma. Yalnız yeni cevabı yaz; bu uyarıdan söz etme.")


def _son_cumlede_kes(metin):
    """Yarim cumleyi ATAR: elde kalan son TAM cumleye kadar olan kisim.

    Yarim bir cumle, kullaniciya bitmis bir dusunce gibi gorunur ve
    cogu zaman anlamini da degistirir. Tam cumle kalmamissa metin
    oldugu gibi doner — kirpmak, her seyi silmekten iyidir."""
    m = (metin or "").rstrip()
    yer = max(m.rfind(". "), m.rfind("! "), m.rfind("? "),
              m.rfind("."), m.rfind("!"), m.rfind("?"))
    if yer <= 0:
        return m
    return m[:yer + 1].rstrip()


# Motorun «bu model arac cagirmayi desteklemez» cevabi (Ollama: «… does not
# support tools»). Gorulurse ayni istek bir kez metin protokoluyle gider.
ARACSIZ_HATA = re.compile(r"does not support tools|tools? (?:is|are) not supported|"
                          r"tool(?:s| calling)? (?:is )?not supported", re.I)

DUZELTME = ("Önceki cevabın şu sebeple kullanılamadı: %s\n"
            "Aynı şeyi tekrar etme. Ölçüm iddia etme; yalnızca sana "
            "verilen ölçümlere dayan. Önerdiğin süre ya da saat "
            "sayıları serbesttir, ama olmuş bitmiş bir ölçüm gibi "
            "sunulamaz. Buyurgan kip kullanma. Yalnız kullanıcının sorusuna "
            "yeni cevabı yaz; bu uyarıdan, düzeltmeden ya da önceki cevabından "
            "hiç söz etme.")


def _genis(ayar, jeton, sure, akis=None, araclar=None, yalniz_arac=False, iptal=None):
    """Basamak ayarini uzun cevap icin genisletir; daraltmaz. `akis`
    verilmisse cevap akarak istenir. `araclar`: core/arac.py katalogu."""
    if not jeton and not sure and not akis and not araclar and not iptal:
        return ayar
    a = dict(ayar or {})
    if iptal:
        a["iptal"] = iptal
    if yalniz_arac:
        a["yalniz_arac"] = True
    if araclar:
        a["araclar"] = araclar
    if akis:
        a["akis"] = akis
    if jeton:
        a["jeton"] = max(int(a.get("jeton") or EN_COK_JETON), int(jeton))
    if sure:
        a["sure"] = max(int(a.get("sure") or ZAMAN_ASIMI), int(sure))
    return a


def ask(con, cfg, role, task, mesajlar, baglam="", sistem="", user="ben",
        transport=None, now=None, duzeltme=True, denetim="olcum", veri=None,
        gorseller=None, medya=None, seviye=None, jeton=None, sure=None, akis=None,
        araclar=None, adim=0, yalniz_arac=False, iptal=None):
    """Bir kademe adina model cagirir — MERDIVENLE (core/motor.py).

    `araclar`: core/arac.py'nin temiz katalogu. Verilirse model bir arac
    secebilir; cevapta `cagrilar` (DOGRULANMAMIS ham secim) doner.
    `yalniz_arac`: yalniz secim turu; arac secilmezse metin yazdirilmaz, cevap
    bos ve «ok» doner (ust basamaga cikilmaz, cevabi sonraki tur yazar).

    Paket seciliyse basamaklar ucuzdan pahaliya denenir; bir basamak
    ZORLANIRSA (cevap dusuruldu, saglayici hatasi, kesildi, «[[YUKSELT]]»)
    bir ust sinifa cikilir. Butce engelinde cikilmaz. Paket yoksa ya da
    kademenin kendi atamasi varsa tek basamak: eski davranis.

    `seviye`: sohbette mesajin seviyesi (core/seviye.py): alt/orta/ust.
    `jeton`, `sure`: kullanici acikca uzun metin istediyse (core/sohbet.py
    uzun_istek) cevap payi en az bu kadar, bekleme en az bu kadar olur.
    `adim`: ajan dongusunde yapilacak tur; 2+ adim ve uzun baglam buluttan
    baslar, kolay is yerelden (core/seviye.py zorluk, KING-4 A6)."""
    from core import motor
    plan = motor.merdiven(con, cfg, role, seviye=seviye, adim=adim,
                          jeton=_jeton_tahmini(sistem, baglam, *[m.get("content") for m in mesajlar or []]))
    if not plan["ok"]:
        return {"ok": False, "reason": plan.get("reason"), "text": None,
                "note": plan.get("note")}
    basamaklar = list(plan["basamaklar"])      # soguk baslangicta yeniden dizilir
    anahtar = None
    if ONBELLEK_SN and transport is None and not (gorseller or medya or araclar):
        anahtar = _onbellek_anahtari(role, task, sistem, baglam, mesajlar, denetim, seviye, jeton, user,
                                     [b["atama"].get("model") for b in basamaklar])
        r = _onbellek_al(anahtar)
        if r:
            if callable(akis):
                for p in (r["text"], None):
                    try:
                        akis(p)
                    except Exception:           # noqa: BLE001 — ekran kopsa da cevap doner
                        pass
            return dict(r, onbellek=True, usd=0.0, in_tok=0, out_tok=0, seconds=0.0)
    r = None
    neden = (plan.get("karar") or {}).get("neden")
    for i, b in enumerate(basamaklar):
        # Yerel yedek ust basamak degildir: yalniz bulut olmayinca devralir.
        ust_var = any(not x.get("yedek") for x in basamaklar[i + 1:])
        not_ek = ",".join(x for x in (
            "paket=%s" % plan["paket"] if plan.get("paket") and b["sinif"] else "",
            "sinif=%s" % b["sinif"] if b["sinif"] else "",
            "seviye=%s" % plan["seviye"] if plan.get("seviye") else "") if x)
        r = _ask_bir(con, cfg, role, task, mesajlar, b["atama"], baglam=baglam,
                     sistem=sistem + (motor.YUKSELT_KURALI if ust_var else ""),
                     user=user, transport=transport, now=now, duzeltme=duzeltme,
                     denetim=denetim, veri=veri, gorseller=gorseller, medya=medya,
                     ayar=_genis(b["ayar"], jeton, sure, akis, araclar, yalniz_arac, iptal), escalated=i > 0, not_ek=not_ek,
                     karar={"seviye": motor.kat(b), "neden": neden})
        r["motor"] = {"paket": plan.get("paket"), "seviye": plan.get("seviye"),
                      "sinif": b["sinif"], "basamak": i, "yukseldi": i > 0,
                      "ekonomi": plan.get("ekonomi"), "kat": motor.kat(b), "kat_neden": neden}
        if r.get("sebep") == "iptal":
            break
        if r.get("yerel_gec"):
            # Soguk baslangic: ikinci yerel model de bellege yuklenecekti;
            # kullanici iki kez beklemesin. Kalan yerel basamaklar atlanir;
            # hibritte bulut devralir (bulut basamagi yoksa ayni sinifin
            # bulut karsiligi); yerel modda not kullaniciya gider.
            kalan = [x for x in basamaklar[i + 1:] if x["atama"].get("provider") != "yerel"]
            if not kalan and b.get("bulut_yedek"):
                kalan = [b["bulut_yedek"]]
            if not kalan:
                break
            basamaklar[i + 1:] = kalan
            neden = "düşüş: yerel motor geç kaldı"
            continue
        p = b["atama"].get("provider")
        if p != "yerel" and motor.kota_mi(r):
            # Kota: bu saglayici penceresi boyunca denenmez, kalan basamaklar
            # (yerel yedek dahil) devralir (ofis pilotundaki kota senaryosu).
            bitis = motor.kota_isaretle(p, r.get("note"))
            basamaklar[i + 1:] = [x for x in basamaklar[i + 1:] if x["atama"].get("provider") != p]
            neden = "düşüş: %s kotası dolu, %s'e kadar denenmez" % (p, time.strftime("%H:%M", time.localtime(bitis)))
            continue
        if ust_var and motor.zorlandi(r):
            continue
        yedek = [x for x in basamaklar[i + 1:] if x.get("yedek")]
        if not r.get("ok") and yedek:
            basamaklar[i + 1:] = yedek
            neden = "düşüş: bulut olmadı (%s)" % str(r.get("note") or r.get("reason"))[:60]
            continue
        break
    if r.get("ok") and r.get("text"):
        r["text"] = motor.isaretsiz(r["text"])
        if not r["text"]:
            return dict(r, ok=False, reason="dropped", text=None,
                        note="Model yalnızca yükseltme istedi; üst basamak kalmadı.")
    if anahtar and r.get("ok") and r.get("text") and not r.get("cagrilar"):
        _onbellek_koy(anahtar, r)
    return r


def _ask_bir(con, cfg, role, task, mesajlar, a, baglam="", sistem="", user="ben",
             transport=None, now=None, duzeltme=True, denetim="olcum", veri=None,
             gorseller=None, medya=None, ayar=None, escalated=False, not_ek="", karar=None):
    """Bir kademe adina model cagirir.

    `denetim`: «olcum» (varsayilan) kullaniciya konusan cevaptir: dayanaksiz
    sayi ve buyurgan kip DUSURULUR. «genel» mesaj kullanicinin verisine
    degmiyorsa: yalniz kullaniciya baglanan sayi aranir (uydurma_sayilar).
    «belge» BAM'in urettigi belgedir
    (arastirma, soru seti): dunya hakkindaki sayilar ve «hesaplayiniz» gibi
    kalip serbesttir, ama belge HER ZAMAN «dogrulanmadi» etiketiyle
    saklanir — kullanicinin olcumu gibi sunulmaz (core/bam.py).

    `baglam`: kural motorunun urettigi olculer. Modelin gorecegi TEK
    gercek budur ve cevaptaki sayilar bununla denetlenir.

    `duzeltme`: cevap sinirdan dondugunde BIR KEZ duzeltme istenir.

    Bu fonksiyon merdivenin TEK basamagidir (`a`: o basamagin atamasi);
    basamaklari `ask` yurutur (core/motor.py)."""
    ayar = {k: v for k, v in (ayar or {}).items() if v}
    if a.get("provider") == "yerel":
        # Motor servisi baska bir makinedeyse adresi ayardan gelir.
        adres = models.yerel_uclari(cfg)[0]
        if adres != models.PROVIDERS["yerel"]["base"]:
            ayar["adres"] = adres
        if gorseller is not None:
            from core import ollama
            m = ollama.gorsel_yerine(cfg, a.get("model"))
            if m != a.get("model"):
                a = dict(a, model=m)
    tavan_jeton = int(ayar.get("jeton") or EN_COK_JETON)
    # ARAC KATALOGU: araci desteklemeyen modele (gemma3 gibi) arac SUNULMAZ;
    # olagan sohbet cevabi verir, isi istemcinin kural yolu yapar (core/arac.py).
    katalog = ayar.get("araclar") or None
    if katalog and arac.aracsiz_mi(a.get("model")):
        ayar.pop("araclar", None)
        katalog = None

    anahtar = models.key_value(cfg, a["provider"], a.get("key_id"))
    # Harcama, anahtarin SAHIBININ defterine yazilir: iki kisi ayni
    # sistemi kullaniyorsa harcamalari da ayri gorunmeli.
    user = a.get("key_user") or user
    mesajlar = butceye_sigdir(role, sistem, list(mesajlar or [])[-EN_COK_MESAJ:])[0]
    if gorseller is not None:
        # Gorsel SON kullanici mesajina eklenir; dogrulanmayan hic gitmez.
        temiz, hata = gorsel_dogrula(gorseller)
        if hata:
            return {"ok": False, "reason": "gorsel", "text": None, "note": hata}
        if not mesajlar or mesajlar[-1].get("role") != "user":
            return {"ok": False, "reason": "gorsel", "text": None,
                    "note": "Görsel bir kullanıcı mesajına eklenmeli."}
        mesajlar[-1] = dict(mesajlar[-1], gorseller=temiz)
    if medya is not None:
        if a.get("provider") != "google":
            return {"ok": False, "reason": "medya-saglayici", "text": None,
                    "note": "Ses ve video için bu kademe Google (Gemini) sağlayıcısına atanmalı; "
                            "şu an %s. HKM › Modeller › «Medya · ses/video çözümleyen»."
                            % a.get("provider_label", a.get("provider"))}
        temiz, hata = medya_dogrula(medya)
        if hata:
            return {"ok": False, "reason": "medya", "text": None, "note": hata}
        if not mesajlar or mesajlar[-1].get("role") != "user":
            return {"ok": False, "reason": "medya", "text": None,
                    "note": "Medya bir kullanıcı mesajına eklenmeli."}
        mesajlar[-1] = dict(mesajlar[-1], gorseller=temiz)
    b = butce.settings(cfg)
    t0 = datetime.datetime.now()

    def _tur(sistem_metni, gecmis):
        """Bir cagri: butce sorulur, gidilir, deftere yazilir."""
        # HATALAR D-18: tavan cagri ONCESI en kotu durumla sorulur (istem
        # + en uzun cevap) ve cagri suresince bu pay AYRILIR: eszamanli
        # ikinci cagri ayni bos payi kullanamaz.
        istem_jeton = (_jeton_tahmini(sistem_metni, *[m.get("content")
                                                       for m in gecmis])
                       + sum(int(x.get("jeton") or GORSEL_JETON)
                             for m in gecmis for x in (m.get("gorseller") or []))
                       + (_jeton_tahmini(json.dumps(ayar["araclar"], ensure_ascii=False))
                          if ayar.get("araclar") else 0))
        en_kotu = _fiyat(a["provider"], a["model"], istem_jeton, tavan_jeton)
        izin = butce.guard(con, cfg, cost_usd=en_kotu)
        if not izin["ok"]:
            return {"ok": False, "reason": "budget", "text": None,
                    "note": izin["note"]}
        if a.get("provider") == "yerel":
            # Az once kalkmadiysa baglanti denemesi 2 sn bekletmesin; defterde cagri yok.
            from core import ollama
            kalan = ollama.kapali_kalan()
            if kalan:
                _yerel_yaz("kapali")
                return {"ok": False, "reason": "provider", "text": None, "sebep": "yerel-kapali",
                        "note": "Model çağrısı başarısız: Ollama açılamadı; %d sn sonra yeniden denenecek." % kalan}
        with butce.ayir(en_kotu):
            return _gonder(sistem_metni, gecmis, istem_jeton)

    def _gonder(sistem_metni, gecmis, istem_jeton):
        hata = None
        metin = None
        gir = cik = 0
        kesildi = False
        jeton_tahmini = False
        ek = {}
        gec = False
        t_cagri = time.perf_counter()
        ilk = [None]
        tur_ayar = ayar
        if callable(ayar.get("akis")):
            # Ilk soz: modelin ilk parcasi ne zaman geldi (ai_olcum).
            def olcen(p, asil=ayar["akis"]):
                if p and ilk[0] is None:
                    ilk[0] = time.perf_counter()
                asil(p)
            tur_ayar = dict(ayar, akis=olcen)

        def gonder_bir():
            # Ayar (efor, cevap siniri) yalniz VARSA gecer: eski tasiyicilar
            # bu parametreyi bilmez.
            return (cagir(a["provider"], anahtar, a["model"], sistem_metni, gecmis, ayar=tur_ayar)
                    if tur_ayar else cagir(a["provider"], anahtar, a["model"], sistem_metni, gecmis))

        yerel = a.get("provider") == "yerel"
        sirada = kesik = False
        try:
            if yerel:
                son_an = time.monotonic() + YEREL_ZAMAN_ASIMI
                while not sirada:
                    if callable(ayar.get("iptal")) and ayar["iptal"]():
                        raise AkisKesildi("istemci gitti")
                    if time.monotonic() >= son_an:
                        raise TimeoutError("sira gelmedi")
                    sirada = _YEREL_SIRA.acquire(timeout=min(1.0, max(0.0, son_an - time.monotonic())))
                t_cagri = time.perf_counter()       # sure sira gelince baslar
            cagir = transport if transport is not None else _cagir
            try:
                sonuc = gonder_bir()
            except urllib.error.URLError as e:
                # Ollama kapali: bu makinedeyse bir kez acilir ve ayni istek yinelenir.
                from core import ollama
                if yerel and ollama.reddedildi_mi(e) and ollama.uyandir(cfg):
                    sonuc = gonder_bir()
                else:
                    raise
            # Tasiyici kesilme isareti vermeyebilir: vermeyen icin «kesilmedi»
            # varsayilir, cunku bilinmeyeni «kesildi» saymak da uydurmaktir.
            if len(sonuc) == 5:
                metin, gir, cik, kesildi, ek = sonuc
                ek = ek or {}
            elif len(sonuc) == 4:
                metin, gir, cik, kesildi = sonuc
            else:
                metin, gir, cik = sonuc
        except urllib.error.HTTPError as e:
            hata = _saglayici_hatasi(e)
            gec = yerel and bool(YEREL_DOLU.search(hata))
        except Exception as e:                  # noqa: BLE001
            hata = "%s: %s" % (type(e).__name__, e)
            kesik = isinstance(e, AkisKesildi)
            if yerel and _zaman_asimi_mi(e):
                gec = True
        finally:
            if sirada:
                _YEREL_SIRA.release()
        sure_ms = int((time.perf_counter() - t_cagri) * 1000)
        if hata is None and (gir is None or cik is None):
            # HATALAR D-16: saglayici kullanim bilgisi dondurmedi. 0 yazmak
            # «0 USD, olculdu» demekti ve tavan hic dolmazdi. Metinden
            # TAHMIN edilir ve oyle isaretlenir.
            jeton_tahmini = True
            gir = istem_jeton if gir is None else gir
            cik = _jeton_tahmini(metin) if cik is None else cik
        gir, cik = int(gir or 0), int(cik or 0)

        # HER CAGRI DEFTERE YAZILIR — basarisiz olan da.
        usd = _fiyat(a["provider"], a["model"], gir, cik)
        olculen = (ek or {}).get("usd") if hata is None else None
        if olculen is not None:
            usd = float(olculen)            # saglayicinin bildirdigi bedel: OLCUM
        # Tarifesi bilinmeyen model icin TAHMINI bir taban kullanilir ve
        # bu ISARETLENIR. Tahmin, olcumun yerine sessizce gecmemeli:
        # yuksek bir tahmin tavani erken doldurur ve kullanici sohbetin
        # neden durdugunu anlamaz.
        tahmini = olculen is None and not fiyat_bilinir(a["provider"], a["model"])
        butce.record(con, role=role, task=task, provider=a["provider"],
                     model=a["model"], user=user, in_tok=gir, out_tok=cik,
                     usd=usd, rate=float(b.get("usd_try") or 0),
                     ok=(hata is None), escalated=escalated,
                     cached=bool((ek or {}).get("cached")), cached_tok=int((ek or {}).get("cached") or 0),
                     reason_tok=int((ek or {}).get("reasoning") or 0), ms=sure_ms,
                     ilk_ms=int((ilk[0] - t_cagri) * 1000) if ilk[0] else None,
                     seviye=(karar or {}).get("seviye"), neden=(karar or {}).get("neden"),
                     note=(hata or ",".join(
                         n for n, var in (("tahmini-fiyat", tahmini),
                                          ("tahmini-jeton", jeton_tahmini),
                                          ("olculen-bedel", olculen is not None),
                                          (not_ek, bool(not_ek))) if var))
                     + ("," + YEREL_GEC if gec else ""),
                     now=now,
                     # Gizlilik panosu (fikir 55): modele giden veri TURU.
                     # BAM istemi konu metni ve web kaynagidir (kitap.py kural 5).
                     veri=veri or (["bam_istegi"] if str(role).startswith("bam.") else None))
        if kesik:
            return {"ok": False, "reason": "provider", "text": None, "sebep": "iptal", "note": hata}
        if yerel:
            sebep = "yerel-mesgul" if gec else _yerel_sebep(hata)
            _yerel_yaz("mesgul" if gec else "kapali" if sebep == "yerel-kapali" else
                       None if hata else "hazir")
        if gec:
            return {"ok": False, "reason": "provider", "text": None, "yerel_gec": True, "sebep": "yerel-mesgul",
                    "note": ("Yerel motor ayakta ama cevap zamanında gelmedi: model belleğe "
                             "yükleniyor olabilir. Birazdan yeniden dene.")}
        if hata:
            r = {"ok": False, "reason": "provider", "text": None,
                 "note": "Model çağrısı başarısız: %s" % hata}
            return dict(r, sebep=sebep) if yerel and sebep else r
        return {"ok": True, "raw": metin, "in_tok": gir, "out_tok": cik,
                "usd": usd, "price_estimated": tahmini,
                "tokens_estimated": jeton_tahmini, "truncated": kesildi,
                "cagrilar": list((ek or {}).get("cagrilar") or [])}

    r = _tur(sistem, mesajlar)
    if not r["ok"] and katalog and ARACSIZ_HATA.search(r.get("note") or ""):
        # Motor «bu model arac desteklemez» dedi: bir kez aracsiz (olagan sohbet).
        if ayar.get("yalniz_arac"):
            return {"ok": True, "text": "", "cagrilar": [], "model": a["model"], "provider": a["provider"],
                    "in_tok": 0, "out_tok": 0, "usd": 0.0, "truncated": False}
        ayar.pop("araclar", None)
        katalog = None
        r = _tur(sistem, mesajlar)
    if not r["ok"]:
        return r

    if katalog:
        cagri = list(r.get("cagrilar") or [])
        if cagri:
            # Secim DOGRULANMADAN doner (core/sohbet.py arac.cagri_dogrula);
            # yaninda metin varsa o da olagan denetimden gecer, duserse atilir.
            metin = (r.get("raw") or "").strip()
            if metin:
                metin = _temizle(metin, baglam)[0] or ""
            return {"ok": True, "text": metin, "cagrilar": cagri,
                    "model": a["model"], "provider": a["provider"], "in_tok": r["in_tok"],
                    "out_tok": r["out_tok"], "usd": r["usd"],
                    "price_estimated": r.get("price_estimated", False),
                    "tokens_estimated": r.get("tokens_estimated", False), "truncated": False,
                    "seconds": round((datetime.datetime.now() - t0).total_seconds(), 1)}
    if ayar.get("yalniz_arac"):
        return {"ok": True, "text": "", "cagrilar": [], "model": a["model"], "provider": a["provider"],
                "in_tok": r["in_tok"], "out_tok": r["out_tok"], "usd": r["usd"], "truncated": False}

    # KESILME once ele alinir: yarim bir cevabi denetlemek, yarim bir
    # cumleyi «uydurma sayi» diye dusurmeye de yol acabilir.
    if r.get("truncated") and duzeltme:
        r2 = _tur(sistem + "\n\n" + KISALT,
                  mesajlar + [{"role": "user", "content": KISALT}])
        if r2["ok"] and not r2.get("truncated"):
            r = r2
        elif r2["ok"]:
            r = r2                       # yine kesildi; asagida isaretlenir

    temiz, dusme = (_temizle(r["raw"], baglam, genel=denetim == "genel") if denetim != "belge"
                    else _belge(r["raw"]))

    if dusme and duzeltme:
        # IKINCI VE SON DENEME. Sinir yumusatilmaz — modele NEYI ihlal
        # ettigi soylenir ve bir kez daha sorulur. Sinirsiz deneme,
        # sinirin kendisini kaldirmanin yavas bicimi olurdu.
        r2 = _tur(sistem + "\n\n" + DUZELTME % dusme,
                  mesajlar + [{"role": "assistant", "content": r["raw"]},
                              {"role": "user", "content": DUZELTME % dusme}])
        if r2["ok"]:
            temiz2, dusme2 = (_temizle(r2["raw"], baglam, genel=denetim == "genel") if denetim != "belge"
                              else _belge(r2["raw"]))
            if not dusme2:
                r, temiz, dusme = r2, temiz2, None
            else:
                dusme = dusme2

    if dusme:
        return {"ok": False, "reason": "dropped", "text": None, "note": dusme,
                "raw_len": len(r.get("raw") or "")}
    # Hala kesikse YARIM CUMLE GOSTERILMEZ: son tam cumleye kadar
    # kirpilir ve kesildigi SOYLENIR.
    if r.get("truncated"):
        temiz = _son_cumlede_kes(temiz)
    return {"ok": True, "text": temiz, "model": a["model"],
            "provider": a["provider"], "in_tok": r["in_tok"],
            "out_tok": r["out_tok"], "usd": r["usd"],
            "price_estimated": r.get("price_estimated", False),
            "tokens_estimated": r.get("tokens_estimated", False),
            "truncated": bool(r.get("truncated")),
            "seconds": round((datetime.datetime.now() - t0).total_seconds(), 1)}


# Fiyatlar: 1M jeton basina USD (giris, cikis). Bilinmeyen model icin
# 0 YAZILMAZ — «bedava» demek olurdu; tahmini bir taban kullanilir ve
# bu ayrica isaretlenir.
#
# Bu tablo YEDEKTIR. Guncel tarife core/tarife.py ile OpenRouter'in acik
# model listesinden okunur, tarihiyle `model_tarife` tablosuna yazilir ve
# CANLI_FIYAT uzerinden bunun ONUNE gecer. Yedek 2026-09-26'da ayni
# listeden okundu; eskiden deepseek-chat 0.06/0.18, Sonnet 5 3/15, Opus 5
# 15/75 yaziyordu — «ucuzluk sirasi» bozuk sayilarla kuruluyordu.
FIYAT = {
    "deepseek/deepseek-chat": (0.32, 0.89),
    "google/gemini-2.5-flash-lite": (0.10, 0.40),
    "gemini-2.5-flash-lite": (0.10, 0.40),
    "google/gemini-2.5-flash": (0.30, 2.50),
    "gemini-2.5-flash": (0.30, 2.50),
    "google/gemini-3.6-flash": (0.75, 3.75),
    "gemini-3.6-flash": (0.75, 3.75),
    "google/gemini-2.5-pro": (1.25, 10.00),
    "gemini-2.5-pro": (1.25, 10.00),
    "openai/gpt-5-nano": (0.05, 0.40),
    "gpt-5-nano": (0.05, 0.40),
    "openai/gpt-5-mini": (0.25, 2.00),
    "gpt-5-mini": (0.25, 2.00),
    "openai/gpt-5": (1.25, 10.00),
    "gpt-5": (1.25, 10.00),
    "openai/gpt-4.1": (2.00, 8.00),
    "gpt-4.1": (2.00, 8.00),
    "qwen/qwen2.5-vl-72b-instruct": (0.80, 1.00),
    "anthropic/claude-haiku-4.5": (1.00, 5.00),
    "claude-haiku-4-5-20251001": (1.00, 5.00),
    "claude-haiku-4-5": (1.00, 5.00),
    # Anthropic tarifesi (1M jeton, USD). Sonnet 5 ve Opus 5 eskiden 3/15 ve
    # 15/75 yaziliydi: harcama 1,5–3 kat fazla sayiliyor, butce erken doluyordu.
    "anthropic/claude-sonnet-5": (2.00, 10.00),
    "claude-sonnet-5": (2.00, 10.00),
    "anthropic/claude-opus-5": (5.00, 25.00),
    "claude-opus-5": (5.00, 25.00),
    "anthropic/claude-opus-5.5": (4.00, 20.00),
    "claude-opus-5-5": (4.00, 20.00),
}
# core/tarife.yukle doldurur: OpenRouter kimligi -> (giris, cikis).
CANLI_FIYAT = {}
BILINMEYEN_FIYAT = (1.00, 5.00)     # tahmini taban — bedava DEGIL


# Kullanim bilgisi gelmeyen cagri ve cagri oncesi en kotu durum icin kaba
# olcu: ~4 karakter bir jeton. Bir OLCUM degil, etiketli bir TAHMINDIR.
KARAKTER_BASINA_JETON = 4


def _jeton_tahmini(*metinler):
    n = sum(len(str(m or "")) for m in metinler)
    return (n + KARAKTER_BASINA_JETON - 1) // KARAKTER_BASINA_JETON


def tarife_of(provider, model):
    """(giris, cikis) ya da None. Once canli tarife (OpenRouter listesi),
    yoksa yedek tablo."""
    from core import tarife         # tarife ai'yi ice aktarir; dongu burada kirilir
    k = tarife.or_kimligi(provider, model)
    if k and k in CANLI_FIYAT:
        return CANLI_FIYAT[k]
    return FIYAT.get(model) or (FIYAT.get(k) if k else None)


def fiyat_bilinir(provider, model):
    """Bu modelin TARIFESI elimizde mi."""
    return provider == "yerel" or tarife_of(provider, model) is not None


def _fiyat(provider, model, gir, cik):
    if provider == "yerel":
        return 0.0                  # kendi makinende kosan model bedava
    g, c = tarife_of(provider, model) or BILINMEYEN_FIYAT
    return (gir / 1e6) * g + (cik / 1e6) * c
