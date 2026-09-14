#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Kanal denemesi — WhatsApp/Telegram zincirini DIŞARI ÇIKMADAN sınar.

   Gercek bir kanal kurmak (Meta uygulamasi, tunel, webhook dogrulamasi)
   yarim gun surer. Bu yarim gunun sonunda «calismiyor» demek, nerede
   calismadigini bilmemektir. Bu betik HKM'nin KENDI tarafini once sinar:

     · webhook imzasi dogrulaniyor mu (imzasiz govde okunmuyor mu),
     · gelen mesaj komuta cevriliyor mu,
     · AYNI mesaj ikinci kez GELDIGINDE islenmiyor mu,
     · cevap giden kutusuna yaziliyor mu,
     · izinsiz gonderen reddediliyor ve icerigi ambara YAZILMIYOR mu.

   Sinanan sey HKM'dir, Meta degil. Buradan gecen bir kurulum, disarisi
   baglandiginda da calisir; buradan gecmeyen bir kurulumu disariya
   baglamak, hatayi iki kat zor bulmaktir.

   Kullanim:
     python3 tools/kanal_deneme.py                 # calisan HKM'ye
     python3 tools/kanal_deneme.py --kanal telegram
     python3 tools/kanal_deneme.py --url http://127.0.0.1:4200

   Bu betik AMBARA YAZAR: gonderdigi mesajlar konusma kaydina duser ve
   cevaplar giden kutusunda birikir. Gercek ambarda denemek istemiyorsan
   once yedek al (python3 hkm.py yedek).
"""

import argparse
import hashlib
import hmac
import json
import os
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from core import channels  # noqa: E402

ISARET = {"ok": "✓", "yok": "•", "hata": "✕"}


def yaz(durum, metin, not_=""):
    print("  %s %s%s" % (ISARET.get(durum, "•"), metin,
                         ("  — " + not_) if not_ else ""))


def oku_config():
    yol = os.path.join(ROOT, "config.json")
    if not os.path.exists(yol):
        print("config.json yok. Once: python3 baslat.py")
        raise SystemExit(2)
    with open(yol, encoding="utf-8") as f:
        return json.load(f)


def istek(url, govde=None, basliklar=None, yontem=None):
    veri = None
    if govde is not None:
        veri = govde if isinstance(govde, bytes) else json.dumps(
            govde).encode("utf-8")
    r = urllib.request.Request(url, data=veri, headers=basliklar or {},
                               method=yontem or ("POST" if veri else "GET"))
    try:
        with urllib.request.urlopen(r, timeout=10) as y:
            ham = y.read().decode("utf-8", "replace")
            try:
                return y.status, json.loads(ham)
            except ValueError:
                return y.status, ham
    except urllib.error.HTTPError as e:
        ham = e.read().decode("utf-8", "replace")
        try:
            return e.code, json.loads(ham)
        except ValueError:
            return e.code, ham
    except Exception as e:
        return 0, {"error": "%s: %s" % (type(e).__name__, e)}


def wa_govde(gonderen, metin, kimlik):
    return json.dumps({"entry": [{"changes": [{"value": {"messages": [
        {"type": "text", "from": gonderen, "text": {"body": metin},
         "id": kimlik}]}}]}]}).encode("utf-8")


def tg_govde(sohbet, metin, kimlik):
    return json.dumps({"message": {"text": metin, "message_id": kimlik,
                                   "chat": {"id": sohbet}}}).encode("utf-8")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--kanal", default="whatsapp",
                   choices=["whatsapp", "telegram"])
    p.add_argument("--url", default=None)
    p.add_argument("--metin", default="durum")
    args = p.parse_args()

    cfg = oku_config()
    taban = args.url or "http://%s:%s" % (cfg.get("host", "127.0.0.1"),
                                          cfg.get("port", 4200))
    jeton = cfg.get("local_token") or ""
    kanal = args.kanal
    a = channels.settings(cfg, kanal)
    hatalar = []

    print("\nKanal denemesi — %s\n" % kanal.upper())

    kod, saglik = istek(taban + "/api/health")
    if kod != 200:
        yaz("hata", "HKM yanıt vermiyor", taban)
        print("\n  Önce başlat:  python3 baslat.py\n")
        return 2
    yaz("ok", "HKM ayakta", taban)

    if not channels.enabled(cfg, kanal):
        yaz("hata", "%s kapalı ya da kimlik bilgileri eksik" % kanal)
        print("""
  Yüzde Yönetim → Sohbet kanalları bölümünden doldur:
    WhatsApp : numara kimliği, erişim jetonu, uygulama sırrı, izin listesi
    Telegram : bot jetonu, webhook sırrı, izin listesi
  Sonra aynı bölümdeki «Aç» düğmesine bas.
""")
        return 1
    yaz("ok", "%s açık" % kanal,
        "izin listesinde %d kayıt" % len(a.get("allow_from") or []))

    izinli = (a.get("allow_from") or [None])[0]
    if not izinli:
        yaz("hata", "İzin listesi boş — kimseye cevap verilmez")
        return 1

    yol = "/api/wa/webhook" if kanal == "whatsapp" else "/api/tg/webhook"
    kimlik = "deneme.%d" % os.getpid()

    def gonder(gonderen, metin, mid, imzali=True):
        if kanal == "whatsapp":
            govde = wa_govde(str(gonderen), metin, mid)
            basliklar = {"Content-Type": "application/json"}
            if imzali:
                sir = (a.get("app_secret") or "").encode()
                basliklar["X-Hub-Signature-256"] = "sha256=" + hmac.new(
                    sir, govde, hashlib.sha256).hexdigest()
            return istek(taban + yol, govde, basliklar)
        govde = tg_govde(gonderen, metin, mid)
        basliklar = {"Content-Type": "application/json"}
        if imzali:
            basliklar["X-Telegram-Bot-Api-Secret-Token"] = a.get(
                "webhook_secret") or ""
        return istek(taban + yol, govde, basliklar)

    # 1 — IMZASIZ govde okunmamali.
    kod, _ = gonder(izinli, args.metin, kimlik + ".imzasiz", imzali=False)
    if kod == 401:
        yaz("ok", "İmzasız/sırsız gövde reddedildi", "401")
    else:
        yaz("hata", "İmzasız gövde reddedilmedi", "kod %s" % kod)
        hatalar.append("imza dogrulanmiyor")

    # 2 — Gecerli mesaj islenmeli.
    kod, r = gonder(izinli, args.metin, kimlik + ".1")
    ilk = (r or {}).get("results", [{}])[0] if isinstance(r, dict) else {}
    if kod == 200 and ilk.get("queued"):
        yaz("ok", "Mesaj işlendi ve cevap kuyruğa yazıldı",
            "komut: %s" % ilk.get("command"))
    else:
        yaz("hata", "Mesaj işlenmedi", "kod %s · %s" % (kod, r))
        hatalar.append("mesaj islenmiyor")

    # 3 — AYNI mesaj ikinci kez: islenmemeli.
    kod, r = gonder(izinli, args.metin, kimlik + ".1")
    iki = (r or {}).get("results", [{}])[0] if isinstance(r, dict) else {}
    if iki.get("duplicate"):
        yaz("ok", "Tekrar gelen aynı mesaj ikinci kez İŞLENMEDİ")
    else:
        yaz("hata", "Tekrar koruması çalışmadı", str(iki))
        hatalar.append("tekrar korumasi yok")

    # 4 — Izinsiz gonderen: reddedilmeli, icerigi ambara girmemeli.
    gizli = "bu-cumle-ambara-girmemeli-%d" % os.getpid()
    kod, r = gonder("999999999999", gizli, kimlik + ".yabanci")
    yab = (r or {}).get("results", [{}])[0] if isinstance(r, dict) else {}
    if yab.get("reason") == "not-allowed":
        yaz("ok", "İzin listesi dışındaki gönderen reddedildi")
    else:
        yaz("hata", "Tanımayan gönderen reddedilmedi", str(yab))
        hatalar.append("izin listesi calismiyor")

    bas = {"Authorization": "Bearer " + jeton}
    kod, g = istek(taban + "/api/conversation?limit=80", basliklar=bas)
    if kod == 200:
        # Yalniz KULLANICININ satirlari sayilir: Patron'un cevabi ayni
        # kelimeyi tasiyabilir ve sayimi bozar («yardim» komutunun cevabi
        # «yardim» kelimesini iceriyor).
        kullanici = [m["text"] for m in g.get("messages", [])
                     if m.get("role") == "user"]
        butun = " ".join(m["text"] for m in g.get("messages", []))
        if gizli in butun:
            yaz("hata", "İzinsiz mesajın İÇERİĞİ ambara yazıldı")
            hatalar.append("izinsiz icerik ambarda")
        else:
            yaz("ok", "İzinsiz mesajın içeriği ambara yazılmadı")
        kacinci = sum(1 for t in kullanici if t == args.metin)
        if kacinci == 1:
            yaz("ok", "Kullanıcının cümlesi kayıtta BİR KEZ var")
        else:
            yaz("hata", "Cümle kayıtta %d kez" % kacinci)
            hatalar.append("tekrar kayit")

    # 5 — Giden kutusu: cevap orada mi, gonderilebildi mi?
    kod, kutu = istek(taban + "/api/outbox", basliklar=bas)
    if kod == 200:
        bizim = [x for x in kutu.get("recent", [])
                 if str(x.get("kind", "")).startswith("reply:")]
        if bizim:
            s = bizim[0]
            durum = s["state"]
            if durum == "sent":
                yaz("ok", "Cevap GERÇEKTEN gönderildi", "kanal ulaşılabilir")
            else:
                yaz("yok", "Cevap kuyrukta bekliyor", "durum: %s · %s"
                    % (durum, s.get("last_error") or "henüz denenmedi"))
                print("     Bu bir HATA DEĞİL: HKM'nin tarafı çalışıyor, "
                      "dışarı çıkış henüz kurulmamış.")
        else:
            yaz("hata", "Cevap giden kutusuna yazılmadı")
            hatalar.append("cevap kuyruga yazilmiyor")
        if kutu.get("uncertain"):
            yaz("yok", "%d satır «teslim belirsiz»" % kutu["uncertain"])

    # 6 — WhatsApp webhook kurulum dogrulamasi (Meta'nin ilk GET'i).
    if kanal == "whatsapp" and a.get("verify_token"):
        kod, y = istek(taban + yol + "?hub.mode=subscribe&hub.verify_token="
                       + str(a["verify_token"]) + "&hub.challenge=12345")
        if kod == 200 and str(y).strip() == "12345":
            yaz("ok", "Webhook kurulum doğrulaması çalışıyor",
                "Meta'nın ilk GET'i geçer")
        else:
            yaz("hata", "Webhook doğrulaması yansımadı", "kod %s" % kod)
            hatalar.append("hub.challenge yansimiyor")
        kod, y = istek(taban + yol + "?hub.mode=subscribe"
                       "&hub.verify_token=yanlis&hub.challenge=12345")
        if kod == 200:
            yaz("hata", "YANLIŞ doğrulama jetonu kabul edildi")
            hatalar.append("yanlis verify_token kabul ediliyor")
        else:
            yaz("ok", "Yanlış doğrulama jetonu reddedildi")

    print("")
    if hatalar:
        print("%d sorun:" % len(hatalar))
        for h in hatalar:
            print("  ✕ " + h)
        return 1
    print("Kanal zinciri temiz: HKM'nin tarafı hazır.")
    print("Dışarı açmak ayrı bir adımdır — KURULUM.md §2-4.\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
