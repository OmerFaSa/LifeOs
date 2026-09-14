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

import datetime
import json
import re
import urllib.error
import urllib.request

from core import butce, manager, models

ZAMAN_ASIMI = 60
EN_COK_MESAJ = 12          # gecmisin tamami her turda gonderilmez
EN_COK_JETON = 1200        # cevap uzunlugu sinirlari


# --------------------------------------------------------------- saglayici

def _openai_bicimi(url, anahtar, model, sistem, mesajlar, ek_baslik=None):
    govde = {"model": model, "max_tokens": EN_COK_JETON,
             "messages": ([{"role": "system", "content": sistem}] if sistem
                          else []) + mesajlar}
    baslik = {"Content-Type": "application/json",
              "Authorization": "Bearer " + anahtar}
    baslik.update(ek_baslik or {})
    return url, baslik, govde


def _istek(url, baslik, govde, timeout=ZAMAN_ASIMI):
    r = urllib.request.Request(url, data=json.dumps(govde).encode("utf-8"),
                               headers=baslik, method="POST")
    with urllib.request.urlopen(r, timeout=timeout) as y:
        return json.loads(y.read().decode("utf-8", "replace") or "{}")


def _cagir(provider, anahtar, model, sistem, mesajlar, timeout=ZAMAN_ASIMI):
    """Saglayiciya gider. Doner: (metin, giris_jeton, cikis_jeton)."""
    tanim = models.PROVIDERS[provider]
    if provider in ("openrouter", "openai", "yerel"):
        url, baslik, govde = _openai_bicimi(
            tanim["base"], anahtar or "", model, sistem, mesajlar,
            {"HTTP-Referer": "http://127.0.0.1:4200", "X-Title": "HKM"}
            if provider == "openrouter" else None)
        y = _istek(url, baslik, govde, timeout)
        metin = (((y.get("choices") or [{}])[0].get("message") or {})
                 .get("content") or "")
        k = y.get("usage") or {}
        return metin, k.get("prompt_tokens", 0), k.get("completion_tokens", 0)

    if provider == "anthropic":
        govde = {"model": model, "max_tokens": EN_COK_JETON,
                 "messages": mesajlar}
        if sistem:
            govde["system"] = sistem
        y = _istek(tanim["base"], {"Content-Type": "application/json",
                                   "x-api-key": anahtar or "",
                                   "anthropic-version": "2023-06-01"},
                   govde, timeout)
        parca = [p.get("text", "") for p in (y.get("content") or [])
                 if p.get("type") == "text"]
        k = y.get("usage") or {}
        return "\n".join(parca), k.get("input_tokens", 0), \
            k.get("output_tokens", 0)

    if provider == "google":
        url = "%s/%s:generateContent" % (tanim["base"], model)
        icerik = [{"role": ("user" if m["role"] == "user" else "model"),
                   "parts": [{"text": m["content"]}]} for m in mesajlar]
        govde = {"contents": icerik,
                 "generationConfig": {"maxOutputTokens": EN_COK_JETON}}
        if sistem:
            govde["systemInstruction"] = {"parts": [{"text": sistem}]}
        y = _istek(url, {"Content-Type": "application/json",
                         "x-goog-api-key": anahtar or ""}, govde, timeout)
        aday = (y.get("candidates") or [{}])[0]
        parca = [p.get("text", "") for p in
                 ((aday.get("content") or {}).get("parts") or [])]
        k = y.get("usageMetadata") or {}
        return "\n".join(parca), k.get("promptTokenCount", 0), \
            k.get("candidatesTokenCount", 0)

    raise ValueError("bilinmeyen saglayici: %s" % provider)


# ------------------------------------------------------------------ sinir

SAYI = re.compile(r"-?\d+(?:[.,]\d+)?")


def _sayilar(metin):
    return set(SAYI.findall(metin or ""))


def uydurma_sayilar(cevap, baglam):
    """Cevapta gecip BAGLAMDA GECMEYEN sayilar.

    Model bir olcum uydurursa, olcum olmayan bir sey olcum gibi gorunur.
    Tarih ve saat bicimleri baglamda zaten var; kalan her sayi
    dayanagiyla birlikte gelmeli."""
    var = _sayilar(baglam)
    out = []
    for s in _sayilar(cevap):
        if s in var:
            continue
        # Kucuk tam sayilar (siralama, madde numarasi) gurultu uretir.
        try:
            if abs(float(s.replace(",", "."))) <= 10 and "." not in s \
                    and "," not in s:
                continue
        except ValueError:
            continue
        out.append(s)
    return sorted(out)


def _temizle(cevap, baglam):
    """(metin, dusurulen_sebep). Dusurulen cevap YUTULMAZ, soylenir."""
    metin = (cevap or "").strip()
    if not metin:
        return None, "Model boş cevap döndü."
    suc = manager.imperatives(metin)
    if suc:
        return None, ("Cevap buyurgan kip taşıdığı için düşürüldü (%s). "
                      "HKM'nin böyle bir yetkisi yok." % ", ".join(suc[:3]))
    uydurma = uydurma_sayilar(metin, baglam)
    if uydurma:
        return None, ("Cevapta dayanağı olmayan sayı(lar) geçtiği için "
                      "düşürüldü: %s. Ölçülmemiş bir sayı, ölçüm değildir."
                      % ", ".join(uydurma[:4]))
    return metin, None


# ------------------------------------------------------------------ cagri

def hazir_mi(cfg, role):
    """Bu kademe cagri yapabilir mi — ve yapamazsa NEDEN."""
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


def ask(con, cfg, role, task, mesajlar, baglam="", sistem="", user="ben",
        transport=None, now=None):
    """Bir kademe adina model cagirir.

    `baglam`: kural motorunun urettigi olculer. Modelin gorecegi TEK
    gercek budur ve cevaptaki sayilar bununla denetlenir."""
    hazir = hazir_mi(cfg, role)
    if not hazir["ok"]:
        return dict(hazir, text=None)
    a = hazir["assignment"]

    izin = butce.guard(con, cfg)
    if not izin["ok"]:
        return {"ok": False, "reason": "budget", "text": None,
                "note": izin["note"]}

    anahtar = models.key_value(cfg, a["provider"], a.get("key_id"))
    # Harcama, anahtarin SAHIBININ defterine yazilir: iki kisi ayni
    # sistemi kullaniyorsa harcamalari da ayri gorunmeli.
    user = a.get("key_user") or user
    mesajlar = list(mesajlar or [])[-EN_COK_MESAJ:]
    t0 = datetime.datetime.now()
    hata = None
    metin = None
    gir = cik = 0
    try:
        if transport is not None:
            metin, gir, cik = transport(a["provider"], anahtar, a["model"],
                                        sistem, mesajlar)
        else:
            metin, gir, cik = _cagir(a["provider"], anahtar, a["model"],
                                     sistem, mesajlar)
    except urllib.error.HTTPError as e:
        hata = "HTTP %s" % e.code
    except Exception as e:                      # noqa: BLE001
        hata = type(e).__name__

    # HER CAGRI DEFTERE YAZILIR — basarisiz olan da.
    b = butce.settings(cfg)
    usd = _fiyat(a["provider"], a["model"], gir, cik)
    butce.record(con, role=role, task=task, provider=a["provider"],
                 model=a["model"], user=user, in_tok=gir, out_tok=cik,
                 usd=usd, rate=float(b.get("usd_try") or 0),
                 ok=(hata is None), note=hata or "", now=now)

    if hata:
        return {"ok": False, "reason": "provider", "text": None,
                "note": "Model çağrısı başarısız: %s" % hata}

    temiz, dusme = _temizle(metin, baglam)
    if dusme:
        return {"ok": False, "reason": "dropped", "text": None, "note": dusme,
                "raw_len": len(metin or "")}
    return {"ok": True, "text": temiz, "model": a["model"],
            "provider": a["provider"], "in_tok": gir, "out_tok": cik,
            "usd": usd, "seconds": round(
                (datetime.datetime.now() - t0).total_seconds(), 1)}


# Fiyatlar: 1M jeton basina USD (giris, cikis). Bilinmeyen model icin
# 0 YAZILMAZ — «bedava» demek olurdu; tahmini bir taban kullanilir ve
# bu ayrica isaretlenir.
FIYAT = {
    "google/gemini-2.5-flash-lite": (0.10, 0.40),
    "google/gemini-2.5-flash": (0.30, 2.50),
    "gemini-2.5-flash": (0.30, 2.50),
    "gemini-2.5-flash-lite": (0.10, 0.40),
    "gemini-2.5-pro": (1.25, 10.00),
    "deepseek/deepseek-chat": (0.06, 0.18),
    "anthropic/claude-haiku-4.5": (1.00, 5.00),
    "claude-haiku-4-5-20251001": (1.00, 5.00),
    "anthropic/claude-sonnet-5": (3.00, 15.00),
    "claude-sonnet-5": (3.00, 15.00),
    "claude-opus-5": (15.00, 75.00),
    "openai/gpt-5-mini": (0.25, 2.00),
    "gpt-5-mini": (0.25, 2.00),
    "gpt-5": (1.25, 10.00),
}
BILINMEYEN_FIYAT = (1.00, 5.00)     # tahmini taban — bedava DEGIL


def _fiyat(provider, model, gir, cik):
    if provider == "yerel":
        return 0.0                  # kendi makinende kosan model bedava
    g, c = FIYAT.get(model, BILINMEYEN_FIYAT)
    return (gir / 1e6) * g + (cik / 1e6) * c
