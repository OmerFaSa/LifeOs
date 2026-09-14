# -*- coding: utf-8 -*-
"""Yoklama — Telegram mesajlarını SORARAK almak.

   Webhook, saglayicinin BIZE baglanmasini ister: makinenin internetten
   erisilebilir bir adresi ve gecerli bir sertifikasi olmali. Ev
   bilgisayarinda bu, bir tunel acmak ve HKM'yi disariya gostermek demek.
   Iki yonlu sohbet icin odenecek agir bir bedel.

   Telegram'in ikinci bir yolu var: `getUpdates`. HKM disari CIKAR ve
   «bana mesaj var mi» diye sorar. Hicbir kapi acilmaz, hicbir adres
   gerekmez, hicbir sertifika istenmez.

   Bes kural:

   1. VARSAYILAN KAPALI. Yoklama, kullanicinin acikca actigi bir seydir.

   2. WEBHOOK ILE AYNI ANDA OLMAZ. Telegram, webhook tanimliyken
      getUpdates'i REDDEDER. Yoklama acilirken webhook silinir ve bu
      SOYLENIR — sessizce baska bir kurulumu bozmak, bulunmasi en zor
      hatalardandir.

   3. UZUN BEKLEME, KISA DONGU DEGIL. `timeout` ile Telegram bizi 25
      saniye bekletir ve mesaj geldigi an doner. Saniyede bir sormak, ayni
      isi yuz kat masrafla yapmaktir.

   4. IMLEC KAYITLIDIR. Islenen son guncellemenin kimligi ambarda durur;
      daemon yeniden basladiginda ayni mesajlar bir daha islenmez. Bellekte
      tutulan bir imlec, tam da yeniden baslatma aninda kaybolurdu.

   5. HATA DONGUYU DURDURMAZ. Ag koptugunda yoklama susar ve tekrar
      dener; bir yoklama hatasi daemon'u durduramaz.
"""

import json
import threading
import urllib.error
import urllib.parse
import urllib.request

from core import channels, db, gelen

API = "https://api.telegram.org"
BEKLEME = 25               # saniye — Telegram bizi bu kadar bekletir
ARA = 3                    # hata sonrasi bekleme
EN_COK = 20                # tek turda islenecek en fazla mesaj

# Telegram AYNI BOT icin iki es zamanli getUpdates kabul etmez: ikincisini
# 409 ile keser. Arka plan dongusu uzun bekleme yaparken kullanicinin
# «Simdi dene» demesi tam olarak bu durumu uretiyordu. Kilit, ikisinin
# sirayla gecmesini saglar; bekleyemeyen taraf bunu HATA diye degil
# «zaten calisiyor» diye bildirir.
_KILIT = threading.Lock()


def acik_mi(cfg):
    a = channels.settings(cfg, "telegram")
    return bool(a.get("enabled") and a.get("bot_token") and a.get("polling"))


def _cagir(token, yol, veri=None, timeout=BEKLEME + 10):
    url = "%s/bot%s/%s" % (API, token, yol)
    govde = None
    basliklar = {}
    if veri is not None:
        govde = json.dumps(veri).encode("utf-8")
        basliklar["Content-Type"] = "application/json"
    istek = urllib.request.Request(url, data=govde, headers=basliklar,
                                   method="POST" if govde else "GET")
    with urllib.request.urlopen(istek, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8", "replace") or "{}")


def webhook_sil(cfg):
    """Telegram, webhook tanimliyken getUpdates'i REDDEDER. Yoklamaya
    gecerken webhook silinir — ve bu sessizce yapilmaz, sonucu donulur."""
    a = channels.settings(cfg, "telegram")
    token = a.get("bot_token")
    if not token:
        return {"ok": False, "reason": "no-token"}
    try:
        r = _cagir(token, "deleteWebhook", {"drop_pending_updates": False},
                   timeout=10)
        return {"ok": bool(r.get("ok")), "result": r.get("description", "")}
    except Exception as e:                      # noqa: BLE001
        return {"ok": False, "reason": "%s" % type(e).__name__}


def komut_menusu(cfg):
    """Telegram'in komut menusu (setMyCommands).

    Kullanici uygulamada «/» yazdiginda komutlari GORUR. Komut listesini
    yalnizca «yardim» yazana gostermek, yardimi bilmeyenin hicbir komutu
    bilmemesi demektir.

    Liste patron.COMMANDS'tan uretilir: iki yerde iki komut listesi
    olsaydi, bir komut eklendiginde biri eksik kalirdi."""
    from core import patron
    a = channels.settings(cfg, "telegram")
    token = a.get("bot_token")
    if not token:
        return {"ok": False, "reason": "no-token"}
    komutlar = []
    for c in patron.COMMANDS:
        # Telegram komut adi: kucuk harf, ASCII, en fazla 32 karakter.
        ad = c["id"].replace("ı", "i").replace("ç", "c").replace("ş", "s")
        if not ad.isascii() or not ad.isalnum():
            continue
        komutlar.append({"command": ad, "description": c["note"][:256]})
    try:
        r = _cagir(token, "setMyCommands", {"commands": komutlar}, timeout=10)
        return {"ok": bool(r.get("ok")), "count": len(komutlar)}
    except Exception as e:                      # noqa: BLE001
        return {"ok": False, "reason": type(e).__name__}


def _imlec_oku(con):
    r = con.execute("SELECT msg_id FROM inbox_seen WHERE channel='telegram:offset'"
                    ).fetchone()
    try:
        return int(r["msg_id"]) if r else 0
    except (TypeError, ValueError):
        return 0


def _imlec_yaz(con, deger):
    """Imlec AMBARDA durur: bellekteki bir imlec, tam da yeniden baslatma
    aninda kaybolur ve ayni mesajlar bir daha islenirdi."""
    import datetime
    con.execute("DELETE FROM inbox_seen WHERE channel='telegram:offset'")
    con.execute(
        "INSERT INTO inbox_seen(channel, msg_id, created_at) VALUES (?,?,?)",
        ("telegram:offset", str(int(deger)),
         datetime.datetime.now().isoformat(timespec="seconds")))
    con.commit()


def tur(con, cfg, th=None, timeout=BEKLEME, transport=None,
        bekle_kilit=0.5):
    """Bir yoklama turu: sor, geleni isle, imleci ilerlet.

    Donen sozluk her zaman anlamlidir — hata da bir SONUCTUR, sessiz bir
    bosluk degil."""
    a = channels.settings(cfg, "telegram")
    token = a.get("bot_token")
    # Eksigin ADI soylenir. «no-token» diyen bir hata, kullaniciya hangi
    # adimi atladigini soylemez; eksik olan sey ile yapilacak is ayni
    # cumlede durmali.
    if not token:
        return {"ok": False, "reason": "no-token", "handled": 0,
                "note": "Bot jetonu kaydedilmemiş. Jetonu yapıştırıp "
                        "«Kanal ayarlarını kaydet» de."}
    if not a.get("enabled"):
        return {"ok": False, "reason": "channel-off", "handled": 0,
                "note": "Telegram kanalı kapalı. Telegram başlığının "
                        "altındaki «Aç» düğmesine bas."}
    if not (a.get("allow_from") or []):
        return {"ok": False, "reason": "no-allow", "handled": 0,
                "note": "İzin listesi boş — kimseye cevap verilmez. Kendi "
                        "Id'ni yazıp kaydet."}
    if not _KILIT.acquire(timeout=bekle_kilit):
        # Kilit arka plan dongusunde: yoklama ZATEN calisiyor demektir.
        # Bunu hata diye gostermek, calisan bir seye «bozuk» demekti.
        return {"ok": True, "handled": 0, "busy": True, "results": [],
                "note": "Yoklama zaten çalışıyor. Bekleyen mesaj varsa "
                        "birkaç saniye içinde işlenir."}
    try:
        imlec = _imlec_oku(con)
        try:
            yanit = _cagir(token, "getUpdates?" + urllib.parse.urlencode({
                "offset": imlec + 1 if imlec else 0,
                "timeout": int(timeout),
                "allowed_updates": json.dumps(["message"]),
            }), timeout=timeout + 10)
        except urllib.error.HTTPError as e:
            # 409'un IKI sebebi var ve ikisi ayri islerdir:
            #   · webhook tanimli              → yapilandirma
            #   · baska bir getUpdates calisiyor → es zamanlilik
            # Ikisini tek cumleyle anlatmak, yanlis adimi tarif etmektir.
            aciklama = ""
            try:
                aciklama = json.loads(
                    e.read().decode("utf-8", "replace") or "{}"
                ).get("description") or ""
            except Exception:                   # noqa: BLE001
                aciklama = ""
            if e.code == 409 and "webhook" in aciklama.lower():
                not_ = ("Telegram webhook tanımlı olduğu için yoklama "
                        "reddedildi.")
            elif e.code == 409:
                not_ = ("Bu bot için başka bir yoklama çalışıyor. Başka bir "
                        "HKM ya da program aynı jetonu kullanıyor olabilir.")
            else:
                not_ = aciklama
            return {"ok": False, "reason": "http-%s" % e.code, "handled": 0,
                    "note": not_}
        except Exception as e:                  # noqa: BLE001
            return {"ok": False, "reason": type(e).__name__, "handled": 0}

        if not yanit.get("ok"):
            return {"ok": False, "reason": "api", "handled": 0,
                    "note": str(yanit.get("description") or "")}

        sonuc = {"ok": True, "handled": 0, "skipped": 0, "results": []}
        son = imlec
        for g in (yanit.get("result") or [])[:EN_COK]:
            try:
                son = max(son, int(g.get("update_id") or 0))
            except (TypeError, ValueError):
                pass
            mesajlar = channels.parse_telegram(g)
            if not mesajlar:
                sonuc["skipped"] += 1
                continue
            for m in mesajlar:
                r = gelen.isle(con, cfg, "telegram", m, th=th,
                               transport=transport)
                sonuc["results"].append(r)
                sonuc["handled"] += 1
        if son != imlec:
            # Imlec, ISLENDIKTEN SONRA ilerletilir: once ilerletmek,
            # islenmemis bir mesaji sonsuza kadar atlamak olurdu.
            _imlec_yaz(con, son)
        return sonuc
    finally:
        _KILIT.release()


def dongu(srv, db_path):
    """Daemon'un yoklama is parcacigi. Hicbir kosulda firlatmaz."""
    import sys
    con = db.connect(db_path)
    while not srv.dur.is_set():
        if not acik_mi(srv.config):
            srv.dur.wait(10)
            continue
        try:
            r = tur(con, srv.config, th=getattr(srv, "thresholds", None))
            if not r.get("ok"):
                if r.get("note"):
                    sys.stderr.write("[hkm] yoklama: %s\n" % r["note"])
                srv.dur.wait(ARA)
        except Exception as e:                  # noqa: BLE001
            sys.stderr.write("[hkm] yoklama hatasi: %s\n" % e)
            srv.dur.wait(ARA)
