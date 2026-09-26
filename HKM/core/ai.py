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


def _cagir(provider, anahtar, model, sistem, mesajlar, timeout=ZAMAN_ASIMI, ayar=None):
    """Saglayiciya gider. `ayar`: {jeton: cevap siniri, efor: low|medium|high}.

    Doner: (metin, giris_jeton, cikis_jeton, kesildi_mi)."""
    ayar = ayar or {}
    jeton = int(ayar.get("jeton") or EN_COK_JETON)
    tanim = models.PROVIDERS[provider]
    if provider in ("openrouter", "openai", "yerel"):
        url, baslik, govde = _openai_bicimi(
            ayar.get("adres") or tanim["base"], anahtar or "", model, sistem,
            [_openai_mesaj(m) for m in mesajlar],
            {"HTTP-Referer": "http://127.0.0.1:4200", "X-Title": "HKM"}
            if provider == "openrouter" else None)
        govde["max_tokens"] = jeton
        if provider == "openrouter" and ayar.get("efor"):
            # Birlesik dusunme ayari; desteklemeyen model yok sayar.
            # `exclude`: dusunme metni geri gelmez (bedeli yine olculur).
            govde["reasoning"] = {"effort": ayar["efor"], "exclude": True}
        y = _istek(url, baslik, govde, timeout)
        secim = (y.get("choices") or [{}])[0]
        metin = (secim.get("message") or {}).get("content") or ""
        k = y.get("usage") or {}
        # Kullanim bilgisi yoksa None: olculmeyen sifir degildir (D-16).
        return (metin, k.get("prompt_tokens"), k.get("completion_tokens"),
                secim.get("finish_reason") in KESILDI)

    if provider == "anthropic":
        govde = {"model": model, "max_tokens": jeton,
                 "messages": [_anthropic_mesaj(m) for m in mesajlar]}
        if sistem:
            govde["system"] = sistem
        y = _istek(tanim["base"], {"Content-Type": "application/json",
                                   "x-api-key": anahtar or "",
                                   "anthropic-version": "2023-06-01"},
                   govde, timeout)
        parca = [p.get("text", "") for p in (y.get("content") or [])
                 if p.get("type") == "text"]
        k = y.get("usage") or {}
        return ("\n".join(parca), k.get("input_tokens"),
                k.get("output_tokens"),
                y.get("stop_reason") in KESILDI)

    if provider == "google":
        url = "%s/%s:generateContent" % (tanim["base"], model)
        icerik = [{"role": ("user" if m["role"] == "user" else "model"),
                   "parts": _google_parcalar(m)} for m in mesajlar]
        govde = {"contents": icerik,
                 "generationConfig": {"maxOutputTokens": jeton}}
        if sistem:
            govde["systemInstruction"] = {"parts": [{"text": sistem}]}
        y = _istek(url, {"Content-Type": "application/json",
                         "x-goog-api-key": anahtar or ""}, govde, timeout)
        aday = (y.get("candidates") or [{}])[0]
        parca = [p.get("text", "") for p in
                 ((aday.get("content") or {}).get("parts") or [])]
        k = y.get("usageMetadata") or {}
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


def uydurma_sayilar(cevap, baglam):
    """Cevapta OLCUM gibi sunulan ama dayanagi olmayan sayilar.

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
            if oneri or not OLCUM_RE.search(parca):
                continue                # oneri kipi ya da olcum adi yok
            for s in _sayilar(parca):
                if s not in var and s not in out:
                    out.append(s)
    return sorted(out)


def _belge(cevap):
    """Belge denetimi: yalniz bos cevap dusurulur."""
    metin = (cevap or "").strip()
    return (metin, None) if metin else (None, "Model boş cevap döndü.")


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
          "kullanma.")


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


DUZELTME = ("Önceki cevabın şu sebeple kullanılamadı: %s\n"
            "Aynı şeyi tekrar etme. Ölçüm iddia etme; yalnızca sana "
            "verilen ölçümlere dayan. Önerdiğin süre ya da saat "
            "sayıları serbesttir, ama olmuş bitmiş bir ölçüm gibi "
            "sunulamaz. Buyurgan kip kullanma.")


def ask(con, cfg, role, task, mesajlar, baglam="", sistem="", user="ben",
        transport=None, now=None, duzeltme=True, denetim="olcum", veri=None,
        gorseller=None, medya=None, seviye=None):
    """Bir kademe adina model cagirir — MERDIVENLE (core/motor.py).

    Paket seciliyse basamaklar ucuzdan pahaliya denenir; bir basamak
    ZORLANIRSA (cevap dusuruldu, saglayici hatasi, kesildi, «[[YUKSELT]]»)
    bir ust sinifa cikilir. Butce engelinde cikilmaz. Paket yoksa ya da
    kademenin kendi atamasi varsa tek basamak: eski davranis.

    `seviye`: sohbette mesajin seviyesi (core/seviye.py): alt/orta/ust."""
    from core import motor
    plan = motor.merdiven(con, cfg, role, seviye=seviye)
    if not plan["ok"]:
        return {"ok": False, "reason": plan.get("reason"), "text": None,
                "note": plan.get("note")}
    basamaklar = plan["basamaklar"]
    r = None
    for i, b in enumerate(basamaklar):
        ust_var = i < len(basamaklar) - 1
        not_ek = ",".join(x for x in (
            "paket=%s" % plan["paket"] if plan.get("paket") and b["sinif"] else "",
            "sinif=%s" % b["sinif"] if b["sinif"] else "",
            "seviye=%s" % plan["seviye"] if plan.get("seviye") else "") if x)
        r = _ask_bir(con, cfg, role, task, mesajlar, b["atama"], baglam=baglam,
                     sistem=sistem + (motor.YUKSELT_KURALI if ust_var else ""),
                     user=user, transport=transport, now=now, duzeltme=duzeltme,
                     denetim=denetim, veri=veri, gorseller=gorseller, medya=medya,
                     ayar=b["ayar"], escalated=i > 0, not_ek=not_ek)
        r["motor"] = {"paket": plan.get("paket"), "seviye": plan.get("seviye"),
                      "sinif": b["sinif"], "basamak": i, "yukseldi": i > 0,
                      "ekonomi": plan.get("ekonomi")}
        if not (ust_var and motor.zorlandi(r)):
            break
    if r.get("ok") and r.get("text"):
        r["text"] = motor.isaretsiz(r["text"])
        if not r["text"]:
            return dict(r, ok=False, reason="dropped", text=None,
                        note="Model yalnızca yükseltme istedi; üst basamak kalmadı.")
    return r


def _ask_bir(con, cfg, role, task, mesajlar, a, baglam="", sistem="", user="ben",
             transport=None, now=None, duzeltme=True, denetim="olcum", veri=None,
             gorseller=None, medya=None, ayar=None, escalated=False, not_ek=""):
    """Bir kademe adina model cagirir.

    `denetim`: «olcum» (varsayilan) kullaniciya konusan cevaptir: dayanaksiz
    sayi ve buyurgan kip DUSURULUR. «belge» BAM'in urettigi belgedir
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
    tavan_jeton = int(ayar.get("jeton") or EN_COK_JETON)

    anahtar = models.key_value(cfg, a["provider"], a.get("key_id"))
    # Harcama, anahtarin SAHIBININ defterine yazilir: iki kisi ayni
    # sistemi kullaniyorsa harcamalari da ayri gorunmeli.
    user = a.get("key_user") or user
    mesajlar = list(mesajlar or [])[-EN_COK_MESAJ:]
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
                             for m in gecmis for x in (m.get("gorseller") or [])))
        en_kotu = _fiyat(a["provider"], a["model"], istem_jeton, tavan_jeton)
        izin = butce.guard(con, cfg, cost_usd=en_kotu)
        if not izin["ok"]:
            return {"ok": False, "reason": "budget", "text": None,
                    "note": izin["note"]}
        with butce.ayir(en_kotu):
            return _gonder(sistem_metni, gecmis, istem_jeton)

    def _gonder(sistem_metni, gecmis, istem_jeton):
        hata = None
        metin = None
        gir = cik = 0
        kesildi = False
        jeton_tahmini = False
        try:
            cagir = transport if transport is not None else _cagir
            # Ayar (efor, cevap siniri) yalniz VARSA gecer: eski tasiyicilar
            # bu parametreyi bilmez.
            sonuc = (cagir(a["provider"], anahtar, a["model"], sistem_metni, gecmis, ayar=ayar)
                     if ayar else cagir(a["provider"], anahtar, a["model"], sistem_metni, gecmis))
            # Tasiyici kesilme isareti vermeyebilir: vermeyen icin «kesilmedi»
            # varsayilir, cunku bilinmeyeni «kesildi» saymak da uydurmaktir.
            if len(sonuc) == 4:
                metin, gir, cik, kesildi = sonuc
            else:
                metin, gir, cik = sonuc
        except urllib.error.HTTPError as e:
            hata = _saglayici_hatasi(e)
        except Exception as e:                  # noqa: BLE001
            hata = "%s: %s" % (type(e).__name__, e)
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
        # Tarifesi bilinmeyen model icin TAHMINI bir taban kullanilir ve
        # bu ISARETLENIR. Tahmin, olcumun yerine sessizce gecmemeli:
        # yuksek bir tahmin tavani erken doldurur ve kullanici sohbetin
        # neden durdugunu anlamaz.
        tahmini = not fiyat_bilinir(a["provider"], a["model"])
        butce.record(con, role=role, task=task, provider=a["provider"],
                     model=a["model"], user=user, in_tok=gir, out_tok=cik,
                     usd=usd, rate=float(b.get("usd_try") or 0),
                     ok=(hata is None), escalated=escalated,
                     note=hata or ",".join(
                         n for n, var in (("tahmini-fiyat", tahmini),
                                          ("tahmini-jeton", jeton_tahmini),
                                          (not_ek, bool(not_ek))) if var),
                     now=now,
                     # Gizlilik panosu (fikir 55): modele giden veri TURU.
                     # BAM istemi konu metni ve web kaynagidir (kitap.py kural 5).
                     veri=veri or (["bam_istegi"] if str(role).startswith("bam.") else None))
        if hata:
            return {"ok": False, "reason": "provider", "text": None,
                    "note": "Model çağrısı başarısız: %s" % hata}
        return {"ok": True, "raw": metin, "in_tok": gir, "out_tok": cik,
                "usd": usd, "price_estimated": tahmini,
                "tokens_estimated": jeton_tahmini, "truncated": kesildi}

    r = _tur(sistem, mesajlar)
    if not r["ok"]:
        return r

    # KESILME once ele alinir: yarim bir cevabi denetlemek, yarim bir
    # cumleyi «uydurma sayi» diye dusurmeye de yol acabilir.
    if r.get("truncated") and duzeltme:
        r2 = _tur(sistem + "\n\n" + KISALT,
                  mesajlar + [{"role": "user", "content": KISALT}])
        if r2["ok"] and not r2.get("truncated"):
            r = r2
        elif r2["ok"]:
            r = r2                       # yine kesildi; asagida isaretlenir

    temiz, dusme = (_temizle(r["raw"], baglam) if denetim != "belge"
                    else _belge(r["raw"]))

    if dusme and duzeltme:
        # IKINCI VE SON DENEME. Sinir yumusatilmaz — modele NEYI ihlal
        # ettigi soylenir ve bir kez daha sorulur. Sinirsiz deneme,
        # sinirin kendisini kaldirmanin yavas bicimi olurdu.
        r2 = _tur(sistem + "\n\n" + DUZELTME % dusme,
                  mesajlar + [{"role": "assistant", "content": r["raw"]},
                              {"role": "user", "content": DUZELTME % dusme}])
        if r2["ok"]:
            temiz2, dusme2 = (_temizle(r2["raw"], baglam) if denetim != "belge"
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
