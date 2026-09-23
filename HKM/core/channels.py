# -*- coding: utf-8 -*-
"""Kanallar — HKM'nin disariya acilan TEK yuzeyi, ve onun kilidi.

   Bu dosya bir entegrasyon kolayligi degil, bir RISK YUZEYIDIR ve oyle
   yazilir. Yerel bir daemon'a WhatsApp eklemek, o daemon'un kapisini
   internete acmak demektir; bu yuzden kurallar gevsek degil kati:

   1. VARSAYILAN KAPALI. Hicbir kanal kendiliginden acilmaz; acmak
      config.json'da bilincli bir karardir.

   2. IZIN LISTESI BOSSA KIMSE YOK. Bos liste «herkes» demek DEGILDIR.
      Tanimadigi numaradan gelen mesaja cevap verilmez ve icerigi ambara
      yazilmaz — yalniz reddedildigi not edilir.

   3. IMZA DOGRULANMADAN ICERIK OKUNMAZ. Gelen webhook, uygulama sirriyla
      HMAC-SHA256 imzalanmis olmali; imza hmac.compare_digest ile
      karsilastirilir. Imzasiz govde ayristirilmaz bile.

   4. HICBIR CAGRI FIRLATMAZ VE HICBIRI BEKLETMEZ. Ag hatasi bir DURUMDUR:
      kanal kapaliyken, yavasken ya da yokken HKM'nin geri kalani oldugu
      gibi calisir.

   5. SIR LOGLANMAZ. Jeton, uygulama sirri ve dogrulama jetonu hicbir
      cikti, hicbir hata metni ve hicbir kayit satirinda gorunmez.

   Tasima icin yalniz standart kutuphane kullanilir (urllib). Testler
   gercek aga cikmaz: `transport` bagimliligi disaridan verilebilir.
"""

import hashlib
import hmac
import json
import re
import urllib.error
import urllib.request

TIMEOUT = 8

DEFAULTS = {
    "whatsapp": {
        "enabled": False,
        "phone_number_id": "",     # Meta Cloud API numarasinin kimligi
        "token": "",               # kalici erisim jetonu
        "app_secret": "",          # X-Hub-Signature-256 dogrulamasi icin
        "verify_token": "",        # webhook kurulum dogrulamasi icin
        "allow_from": [],          # cevap verilecek numaralar (bos = kimse)
        "api_base": "https://graph.facebook.com/v21.0",
    },
    "telegram": {
        "enabled": False,
        "bot_token": "",
        "webhook_secret": "",      # X-Telegram-Bot-Api-Secret-Token
        # Yoklama: HKM disari CIKIP «mesaj var mi» diye sorar. Webhook'un
        # aksine hicbir kapi acmaz, adres ve sertifika istemez — ev
        # bilgisayarinda iki yonlu sohbetin en ucuz yolu.
        "polling": False,
        "allow_from": [],          # sohbet kimlikleri (bos = kimse)
        "api_base": "https://api.telegram.org",
    },
}


def settings(cfg, name):
    """Kanal ayari — varsayilanlarin uzerine config.json."""
    taban = dict(DEFAULTS.get(name) or {})
    taban.update(((cfg or {}).get("channels") or {}).get(name) or {})
    return taban


def enabled(cfg, name):
    a = settings(cfg, name)
    if not a.get("enabled"):
        return False
    if name == "whatsapp":
        return bool(a.get("phone_number_id") and a.get("token"))
    if name == "telegram":
        return bool(a.get("bot_token"))
    return False


def allowed(cfg, name, sender):
    """Bos izin listesi «herkes» DEGIL «kimse» demektir."""
    a = settings(cfg, name)
    liste = [str(x) for x in (a.get("allow_from") or [])]
    return bool(liste) and str(sender) in liste


def _post_json(url, govde, headers=None):
    """Tek tasima noktasi. Firlatmaz: (durum, govde) dondurur."""
    veri = json.dumps(govde).encode("utf-8")
    req = urllib.request.Request(url, data=veri, method="POST")
    req.add_header("Content-Type", "application/json")
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            return r.status, (r.read() or b"").decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, (e.read() or b"").decode("utf-8", "replace")
    except Exception as e:                      # ag yok, DNS yok, zaman asimi
        return 0, type(e).__name__


def send(cfg, name, text, to=None, transport=None):
    """Giden mesaj. Kanal kapaliysa ag'a CIKILMAZ.

    `transport(url, govde, basliklar) -> (durum, metin)` testler icin."""
    a = settings(cfg, name)
    if not enabled(cfg, name):
        return {"ok": False, "status": 0, "reason": "off",
                "note": "Kanal kapalı; gönderim denenmedi."}
    hedef = str(to or (a.get("allow_from") or [""])[0] or "")
    if not hedef:
        return {"ok": False, "status": 0, "reason": "no-target",
                "note": "Alıcı yok: izin listesi boş."}
    if not allowed(cfg, name, hedef):
        return {"ok": False, "status": 0, "reason": "not-allowed",
                "note": "Alıcı izin listesinde değil; gönderim yapılmadı."}

    gonder = transport or _post_json

    # KANALIN KENDI SINIRI KANALIN SORUNUDUR. Telegram 4096 karakterden
    # uzun mesaji reddeder (400) ve kullanici «gonderilemedi» gorurdu —
    # cevabin tamami hazirdi, yalnizca tek parca halinde sigmiyordu.
    # Kirpmak da cozum degil: sorunun cevabini yarim vermek, vermemenin
    # kibar bicimi olurdu. Bu yuzden BOLUNUR ve sirayla gonderilir.
    parcalar = _parcala(text, SINIR.get(name, 0))
    if len(parcalar) > 1:
        son = None
        for i, p in enumerate(parcalar, 1):
            isaretli = "%s\n\n(%d/%d)" % (p, i, len(parcalar))
            son = send(cfg, name, isaretli, to=hedef, transport=transport)
            if not son["ok"]:
                # Bir parca gitmediyse GERISI DE GONDERILMEZ: yarim
                # teslim edilmis bir metin, sirasi bozuk okunur.
                return dict(son, note="%d/%d parça gönderildi, sonrası "
                            "durduruldu — %s" % (i - 1, len(parcalar),
                                                 son.get("note") or ""))
        return dict(son or {"ok": True}, parts=len(parcalar),
                    note="%d parça hâlinde gönderildi." % len(parcalar))

    if name == "whatsapp":
        url = "%s/%s/messages" % (a["api_base"].rstrip("/"), a["phone_number_id"])
        govde = {"messaging_product": "whatsapp", "to": hedef,
                 "type": "text", "text": {"body": text}}
        basliklar = {"Authorization": "Bearer " + a["token"]}
    elif name == "telegram":
        url = "%s/bot%s/sendMessage" % (a["api_base"].rstrip("/"), a["bot_token"])
        govde = {"chat_id": hedef, "text": text}
        basliklar = {}
    else:
        return {"ok": False, "status": 0, "reason": "unknown-channel",
                "note": "Bilinmeyen kanal: %s" % name}

    durum, yanit = gonder(url, govde, basliklar)
    # Durum 0, «sunucu 0 dondu» demek degil «HIC CEVAP GELMEDI» demektir.
    # Kullaniciya «Kanal yaniti: 0» yazmak, hatayi anlasilmaz kilar.
    if 200 <= durum < 300:
        aciklama = "Gönderildi."
    elif not durum:
        aciklama = "Kanala ulaşılamadı (ağ ya da adres)."
    else:
        aciklama = "Kanal yanıtı: %s" % durum
    return {"ok": 200 <= durum < 300, "status": durum, "to": hedef,
            "note": aciklama,
            # Sir loglanmaz: yanit govdesi kirpilir ve jeton hicbir yerde gecmez.
            "detail": (yanit or "")[:200]}


def _post_ham(url, bayt, headers=None):
    """Cok parcali govde icin tasima. Firlatmaz: (durum, govde)."""
    req = urllib.request.Request(url, data=bayt, method="POST")
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT * 3) as r:
            return r.status, (r.read() or b"").decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, (e.read() or b"").decode("utf-8", "replace")
    except Exception as e:                      # noqa: BLE001
        return 0, type(e).__name__


BELGE_SINIRI = 20 * 1024 * 1024        # Telegram 50 MB kabul eder; biz daha azini yollariz


def send_document(cfg, name, dosya_adi, bayt, mime, caption="", to=None, transport=None):
    """Belge gonderimi — yalniz Telegram (sendDocument, multipart).

    WhatsApp'ta belge once medya olarak yuklenmeli; o yol yok ve bu
    SOYLENIR: sessizce «gonderildi» denmez. `transport(url, bayt,
    basliklar) -> (durum, metin)` testler icin."""
    a = settings(cfg, name)
    if not enabled(cfg, name):
        return {"ok": False, "status": 0, "reason": "off",
                "note": "Kanal kapalı; gönderim denenmedi."}
    if name != "telegram":
        return {"ok": False, "status": 0, "reason": "unsupported",
                "note": "Bu kanala belge gönderilemiyor; HKM › Ofis’ten indir."}
    hedef = str(to or (a.get("allow_from") or [""])[0] or "")
    if not hedef:
        return {"ok": False, "status": 0, "reason": "no-target", "note": "Alıcı yok."}
    if not allowed(cfg, name, hedef):
        return {"ok": False, "status": 0, "reason": "not-allowed",
                "note": "Alıcı izin listesinde değil; gönderim yapılmadı."}
    if not bayt or len(bayt) > BELGE_SINIRI:
        return {"ok": False, "status": 0, "reason": "too-large", "note": "Belge boş ya da çok büyük."}
    sinir = "----lifeos%s" % hashlib.sha1(bayt[:4096] + dosya_adi.encode("utf-8")).hexdigest()[:24]
    guvenli_ad = re.sub(r'["\r\n]', "_", dosya_adi)
    parca = []
    for alan, deger in (("chat_id", hedef), ("caption", (caption or "")[:1024])):
        parca.append(("--%s\r\nContent-Disposition: form-data; name=\"%s\"\r\n\r\n%s\r\n"
                      % (sinir, alan, deger)).encode("utf-8"))
    parca.append(("--%s\r\nContent-Disposition: form-data; name=\"document\"; filename=\"%s\"\r\n"
                  "Content-Type: %s\r\n\r\n" % (sinir, guvenli_ad, mime)).encode("utf-8"))
    govde = b"".join(parca) + bayt + ("\r\n--%s--\r\n" % sinir).encode("utf-8")
    url = "%s/bot%s/sendDocument" % (a["api_base"].rstrip("/"), a["bot_token"])
    durum, yanit = (transport or _post_ham)(
        url, govde, {"Content-Type": "multipart/form-data; boundary=" + sinir})
    return {"ok": 200 <= durum < 300, "status": durum, "to": hedef,
            "note": "Belge gönderildi." if 200 <= durum < 300 else
            ("Kanala ulaşılamadı (ağ ya da adres)." if not durum else "Kanal yanıtı: %s" % durum),
            "detail": (yanit or "")[:200]}


# Kanallarin metin siniri (karakter). 0 = sinir yok/bilinmiyor.
# Emniyet payi birakilir: parca numarasi da ayni mesaja yazilir.
SINIR = {"telegram": 3900, "whatsapp": 3900}


def _parcala(metin, sinir):
    """Uzun metni kanalin siniri icinde parcalara boler.

    Bolme yeri ONEM SIRASIYLA aranir: bos satir, satir sonu, cumle sonu,
    bosluk. Kelimenin ortasindan bolmek, okunabilir bir metni okunmaz
    yapar. Hicbiri bulunamazsa sert bolunur — sonsuza kadar bolunemeyen
    bir metin, hic gonderilemeyen bir metin olurdu."""
    m = metin or ""
    if not sinir or len(m) <= sinir:
        return [m]
    # Parca numarasi da ayni mesajda gider: yerini simdiden ayir.
    pay = sinir - 12
    out = []
    while len(m) > pay:
        dilim = m[:pay]
        yer = -1
        for ayrac in ("\n\n", "\n", ". ", " "):
            yer = dilim.rfind(ayrac)
            if yer > pay // 3:
                yer += len(ayrac) if ayrac != ". " else 1
                break
            yer = -1
        if yer <= 0:
            yer = pay
        out.append(m[:yer].rstrip())
        m = m[yer:].lstrip()
    if m:
        out.append(m)
    return out


def verify_signature(app_secret, raw_body, header):
    """X-Hub-Signature-256. Imza dogrulanmadan govde AYRISTIRILMAZ."""
    if not app_secret or not header:
        return False
    beklenen = "sha256=" + hmac.new(
        app_secret.encode("utf-8"),
        raw_body if isinstance(raw_body, bytes) else str(raw_body).encode("utf-8"),
        hashlib.sha256).hexdigest()
    return hmac.compare_digest(str(header), beklenen)


def verify_challenge(cfg, params):
    """Meta'nin webhook kurulum dogrulamasi: dogru jetonla gelen meydan
    okuma geri yansitilir. Yanlis jetonda HICBIR SEY yansitilmaz."""
    a = settings(cfg, "whatsapp")
    jeton = a.get("verify_token") or ""
    if not jeton:
        return None
    mod = (params.get("hub.mode") or [""])[0]
    gelen = (params.get("hub.verify_token") or [""])[0]
    meydan = (params.get("hub.challenge") or [""])[0]
    if mod == "subscribe" and hmac.compare_digest(str(gelen), str(jeton)):
        return meydan
    return None


def parse_whatsapp(payload):
    """Meta govdesinden (gonderen, metin) ciftleri. Bilinmeyen bicim
    sessizce «mesaj yok» olur; uydurmaz."""
    out = []
    try:
        for entry in (payload or {}).get("entry", []):
            for degisiklik in entry.get("changes", []):
                deger = degisiklik.get("value") or {}
                for m in deger.get("messages", []) or []:
                    if m.get("type") != "text":
                        continue
                    out.append({"from": str(m.get("from") or ""),
                                "text": ((m.get("text") or {}).get("body") or ""),
                                "id": m.get("id")})
    except AttributeError:
        return []
    return out


def verify_telegram_secret(cfg, header):
    """Telegram imza yollamaz; bunun yerine kurulumda verilen gizli basligi
    her istekte geri gonderir. Sir tanimli degilse webhook KAPALIDIR —
    «sir yoksa herkese acik» bir varsayilan, sessiz bir acik kapidir."""
    a = settings(cfg, "telegram")
    sir = a.get("webhook_secret") or ""
    if not sir or not header:
        return False
    return hmac.compare_digest(str(header), str(sir))


def parse_telegram(payload):
    m = (payload or {}).get("message") or {}
    sohbet = ((m.get("chat") or {}).get("id"))
    if sohbet is None:
        return []
    metin = m.get("text") or m.get("caption") or ""
    ek = _telegram_eki(m)
    if not metin and not ek:
        return []
    return [{"from": str(sohbet), "text": str(metin),
             "id": m.get("message_id"), "attachment": ek}]


def _telegram_eki(m):
    """Telegram medyasini tek, kapali bir sozlesmeye indirger.

    Dosyanin kendisi burada indirilmez. Webhook/yoklama is parcaciginda
    buyuk bir dosya indirmek cevap yolunu kilitlerdi. file_id, daha sonra
    indirme ve analiz kuyrugunun Telegram'dan dosyayi almasi icin yeterlidir.
    """
    tur, veri = None, None
    fotograflar = m.get("photo")
    if isinstance(fotograflar, list) and fotograflar:
        tur, veri = "photo", fotograflar[-1]
    else:
        for aday in ("video", "voice", "audio", "document"):
            if isinstance(m.get(aday), dict):
                tur, veri = aday, m[aday]
                break
    if not tur:
        return None
    return {
        "kind": tur, "file_id": str(veri.get("file_id") or ""),
        "unique_id": str(veri.get("file_unique_id") or ""),
        "mime_type": str(veri.get("mime_type") or ""),
        "file_name": str(veri.get("file_name") or ""),
        "size": veri.get("file_size") if isinstance(veri.get("file_size"), int)
                else None,
        "duration": veri.get("duration") if isinstance(veri.get("duration"), int)
                    else None,
    }
