# -*- coding: utf-8 -*-
"""Bildirim politikasi — sessiz saatler, gunluk sinir, «bir daha sorma».

   Bir asistanin en hizli kaybettigi sey dikkat hakkidir: gece gelen
   mesaj, gunde on bes bildirim, her gun ayni soru. Bu modul GIDEN
   KUTUSUNUN kapisinda durur (core/outbox.py `flush`) ve kural motorudur;
   hicbir mesaji YAZMAZ, yalniz ZAMANINI belirler.

   Bes kural:

   1. CEVAP BEKLETILMEZ. Kullanicinin yazdigi mesaja verilen cevap
      («reply:» turu) sessiz saatte de gider: soruyu soran uyanik.
   2. BEKLETILEN KAYBOLMAZ. Sessiz saatte ya da gunluk sinir dolunca
      satir ertelenir (`ertelendi`); sure dolunca birden cok bekleyen
      TEK bir ozet mesajinda gider. Belge satiri birlesmez, tek tek gider.
   3. VARSAYILAN KAPALI. Sessiz saat ve sinir kullanici acinca calisir:
      hicbir mesaj, kullanicinin bilmedigi bir kuralla bekletilmez.
   4. SUSTURMA BIR TURU SUSTURUR, bir mesaji degil («eksik:sleep_hours»,
      «oneri:<kural>», «yarin»). Ayarlar'dan geri acilir. Susturulan tur
      uretilmez; uretildikten sonra gizlenmez.
   5. SAYIYI KOD SAYAR. «Bugun kac bildirim gitti» giden kutusunun kendi
      satirlarindan okunur, tahmin edilmez."""

import datetime
import re

VARSAYILAN = {
    "sessiz_bas": "",       # ornek "23:00" — bos: kapali
    "sessiz_bit": "",       # ornek "08:00"
    "gunluk_en_cok": 0,     # 0: sinir yok
    "teklif_omru_gun": 3,   # cevapsiz teklif bu kadar gun sonra kapanir
    "yarin": True,          # aksam «yarin su uc sey» (schedule evening)
}

SAAT = re.compile(r"^(?:[01]\d|2[0-3]):[0-5]\d$")
ALANLAR = {"sessiz_bas": str, "sessiz_bit": str, "gunluk_en_cok": int,
           "teklif_omru_gun": int, "yarin": bool}
SABAH_VARSAYILAN = "08:00"
OZET_SINIR = 3500               # Telegram 4096; pay birakilir


def settings(cfg):
    a = dict(VARSAYILAN)
    a.update((cfg or {}).get("bildirim") or {})
    return a


def validate(patch):
    hata = []
    if not isinstance(patch, dict):
        return False, ["bildirim bir nesne olmalı"]
    for k, v in patch.items():
        tip = ALANLAR.get(k)
        if tip is None:
            hata.append("bilinmeyen bildirim ayarı: %s" % k)
        elif tip is bool and not isinstance(v, bool):
            hata.append("bildirim.%s true ya da false olmalı" % k)
        elif tip is int and (isinstance(v, bool) or not isinstance(v, int)):
            hata.append("bildirim.%s bir sayı olmalı" % k)
        elif tip is str and not isinstance(v, str):
            hata.append("bildirim.%s bir dize olmalı" % k)
        elif k in ("sessiz_bas", "sessiz_bit") and v and not SAAT.match(v):
            hata.append("bildirim.%s SS:DD biçiminde olmalı" % k)
        elif k == "gunluk_en_cok" and not (0 <= v <= 100):
            hata.append("bildirim.gunluk_en_cok 0–100 arasında olmalı (0: sınır yok)")
        elif k == "teklif_omru_gun" and not (1 <= v <= 30):
            hata.append("bildirim.teklif_omru_gun 1–30 arasında olmalı")
    a = dict(patch)
    if bool(a.get("sessiz_bas")) != bool(a.get("sessiz_bit")) and \
            ("sessiz_bas" in a and "sessiz_bit" in a):
        hata.append("Sessiz saatin başı ve sonu birlikte yazılmalı (ya da ikisi de boş).")
    return (not hata), hata


def _dk(hhmm):
    try:
        s, d = str(hhmm).split(":")
        return int(s) * 60 + int(d)
    except (ValueError, AttributeError):
        return None


# ------------------------------------------------------------ sessiz saat

def sessiz_mi(cfg, now):
    """Simdi sessiz saat mi? Gece yarisini asan pencere de olur (23:00–08:00)."""
    a = settings(cfg)
    bas, bit = _dk(a.get("sessiz_bas")), _dk(a.get("sessiz_bit"))
    if bas is None or bit is None or bas == bit:
        return False
    t = now.hour * 60 + now.minute
    if bas < bit:
        return bas <= t < bit
    return t >= bas or t < bit


def sabah(cfg, now, ertesi=False):
    """Bekletilen mesajin gidecegi an: sessiz saatin sonu (yoksa 08:00).
    `ertesi`: gunluk sinir doldu — yarinin sabahi."""
    a = settings(cfg)
    bit = _dk(a.get("sessiz_bit")) if a.get("sessiz_bas") else None
    if bit is None:
        bit = _dk(SABAH_VARSAYILAN)
    gun = now.date()
    aday = datetime.datetime.combine(gun, datetime.time(bit // 60, bit % 60))
    if ertesi or aday <= now:
        aday += datetime.timedelta(days=1)
    return aday


# ------------------------------------------------------------ gunluk sinir

def cevap_mi(row):
    return str(row.get("kind") or "").startswith("reply:")


def bugun_giden(con, now):
    """Bugun GIDEN (cevap olmayan) satir sayisi — olculur."""
    gun = now.date().isoformat()
    return con.execute(
        "SELECT COUNT(*) FROM outbox WHERE state='sent' AND kind NOT LIKE 'reply:%' "
        "AND substr(sent_at,1,10)=?", (gun,)).fetchone()[0]


def ertele_mi(con, cfg, row, now):
    """(ertele, ne_zaman, neden). Cevap asla bekletilmez."""
    if cevap_mi(row):
        return False, None, None
    if sessiz_mi(cfg, now):
        return True, sabah(cfg, now), "sessiz"
    sinir = int(settings(cfg).get("gunluk_en_cok") or 0)
    if sinir and bugun_giden(con, now) >= sinir:
        return True, sabah(cfg, now, ertesi=True), "sinir"
    return False, None, None


def birlestir(con, cfg, now):
    """Vadesi gelen, bekletilmis METIN satirlarini tek ozete toplar.

    Tek satir kaldiysa oldugu gibi gider (ozet gereksiz). Birlesen satirlar
    «birlesti» olur ve hangi ozete girdikleri `last_error` alaninda degil
    ozetin kendisinde yazilir: satir silinmez (outbox kurali 4)."""
    if sessiz_mi(cfg, now):
        return None
    t = now.isoformat(timespec="seconds")
    rows = [dict(r) for r in con.execute(
        "SELECT * FROM outbox WHERE ertelendi=1 AND state='queued' AND next_at<=? "
        "AND (ek IS NULL OR ek='') ORDER BY id", (t,))]
    kanallar = {}
    for r in rows:
        kanallar.setdefault((r["channel"], r.get("target") or ""), []).append(r)
    from core import outbox
    yazilan = []
    for (kanal, hedef), grup in kanallar.items():
        if len(grup) < 2:
            continue
        parca, giren = [], []
        for r in grup:
            satir = "— " + str(r["text"]).strip()
            if sum(len(x) + 2 for x in parca) + len(satir) > OZET_SINIR:
                break
            parca.append(satir)
            giren.append(r)
        kalan = len(grup) - len(giren)
        bas = "Bekletilen %d mesaj (sessiz saat ya da günlük sınır):" % len(grup)
        govde = "\n\n".join([bas] + parca)
        if kalan:
            govde += ("\n\n…ve %d mesaj daha; HKM › Sistemler › Giden kutusu’nda." % kalan)
        o = outbox.enqueue(con, kanal, "ozet:%d" % giren[0]["id"], now.date().isoformat(),
                           govde, target=hedef or None, now=now)
        for r in giren:
            con.execute("UPDATE outbox SET state='birlesti', last_error=? WHERE id=?",
                        ("özet satırı #%d ile gitti" % o["row"]["id"], r["id"]))
        yazilan.append(o["row"]["id"])
    return yazilan or None


# -------------------------------------------------------------- susturma

def sustur(con, anahtar, ad, now=None):
    t = (now or datetime.datetime.now()).isoformat(timespec="seconds")
    con.execute("INSERT OR IGNORE INTO susturmalar(anahtar, ad, created_at) VALUES (?,?,?)",
                (str(anahtar)[:120], str(ad)[:200], t))
    return {"ok": True, "anahtar": anahtar}


def ac(con, anahtar):
    n = con.execute("DELETE FROM susturmalar WHERE anahtar=?", (str(anahtar),)).rowcount
    return {"ok": bool(n), "note": None if n else "Bu tür susturulmamış."}


def susturuldu_mu(con, anahtar):
    return bool(con.execute("SELECT 1 FROM susturmalar WHERE anahtar=?",
                            (str(anahtar),)).fetchone())


def susturulanlar(con):
    return [dict(r) for r in con.execute(
        "SELECT anahtar, ad, created_at FROM susturmalar ORDER BY created_at DESC")]


# ------------------------------------------------------- cevapsiz teklif

MODUL_AD = {"ays": "AYS", "spi": "SPİ", "esp": "ESP", "hkm": "HKM"}


def bayatlari_kapat(con, cfg, now):
    """N gunden eski CEVAPSIZ teklifleri kapatir ve bunu SOYLER (fikir 15).

    Modul teklifi «expired» olur (uygulanmadi, istenmedi de sayilmaz);
    King'in onay bekleyen teklifi iptal olur, BAM'da is acilmamistir.
    Kapananlar tek mesajda soylenir; kanal yoksa HKM sohbetine yazilir.
    Donus: kapananlarin satirlari."""
    from core import db, hedefag, king, outbox, patron, schedule
    if hedefag.tatilde(con, now.date().isoformat()):
        # Tatildeyken teklif kapanmaz: donuste kullanici hepsini gorur.
        return []
    gun = int(settings(cfg).get("teklif_omru_gun") or 3)
    sinir = (now - datetime.timedelta(days=gun)).isoformat(timespec="seconds")
    t = now.isoformat(timespec="seconds")
    kapanan, ilk = [], None
    for r in con.execute("SELECT * FROM intents WHERE state IN ('pending','delivered') "
                         "AND created_at < ? ORDER BY id", (sinir,)).fetchall():
        db.set_intent_state(con, r["id"], "expired", t)
        kapanan.append("%s: %s" % (MODUL_AD.get(r["module"], r["module"]), str(r["note"])[:90]))
        ilk = ilk or ("n%d" % r["id"])
    for r in con.execute("SELECT id FROM is_emirleri WHERE durum='teklif' AND updated_at < ? "
                         "ORDER BY id", (sinir,)).fetchall():
        e = king.emir(con, r["id"])
        e["durum"] = "iptal"
        king._yaz(con, e, now)
        king.bildir(con, e["modul"], e["id"], "iptal",
                    "«%s» teklifi %d gün cevapsız kaldığı için kapandı; iş açılmadı."
                    % (e["konu"], gun), now=now)
        kapanan.append("King teklifi: «%s»" % e["konu"])
        ilk = ilk or ("e%d" % r["id"])
    if not kapanan:
        return []
    metin = ("%d gündür cevaplanmayan %d teklif kapandı:\n%s\nHiçbiri uygulanmadı; istersen "
             "yeniden isteyebilirsin." % (gun, len(kapanan), "\n".join("• " + k for k in kapanan)))
    patron.log(con, "local", "manager", metin, agent="king")
    kanal = schedule.acik_kanal(cfg)
    if kanal:
        outbox.enqueue(con, kanal, "kapanan:%s" % ilk, now.date().isoformat(), metin, now=now)
    return kapanan
