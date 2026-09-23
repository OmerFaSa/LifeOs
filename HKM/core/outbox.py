# -*- coding: utf-8 -*-
"""Giden kutusu — teslim guvencesi, ama tekrar degil.

   Kanal gonderimi agdan gecer; ag her zaman calismaz. Iki kotu ihtimal var
   ve ikisi de burada engellenir:

     · Basarisiz gonderimi YUTMAK — kullaniciya hicbir sey soylemeden
       kaybolan bir mesaj. Gec gelen bir mesaj bundan iyidir.
     · Tekrar denemeyi TEKRAR GONDERMEYE cevirmek — ayni ozetin iki kez
       dusmesi, «gunde tek mesaj» kuralini icten kirar.

   Dort kural:

   1. HER SATIRIN BIR KIMLIGI VAR: (kanal, tur, gun). Ayni kimlikle ikinci
      satir yazilmaz; ikinci cagri var olani dondurur.
   2. GERI CEKILME ARTAR. 1, 5, 15, 60 dakika. Sonsuza kadar denenmez:
      besinci basarisizlikta satir «vazgecildi» olur ve sebebi yazilir.
      Sonsuz yeniden deneme, bir hatayi gizlemenin yavas bicimidir.
   3. KALICI HATA TEKRARLANMAZ. 401 (jeton) ve 403 gibi yanitlar agdan
      degil YAPILANDIRMADAN gelir; bunlarda beklemenin faydasi yoktur.
   4. GONDERILEN SATIR SILINMEZ. Ne gonderildigi, kac denemede gittigi ve
      neyin hic gitmedigi sonradan denetlenebilmeli.
"""

import datetime
import json

from core import channels, db


def _belge_gonder(con, cfg, row, transport):
    """Belge satiri: kayit gonderim aninda PDF'e (olmazsa HTML'e) basilir."""
    from core import bam, cikti
    try:
        ek = json.loads(row["ek"])
        k = bam.kayit_getir(con, int(ek["kayit_id"]))
    except (TypeError, ValueError, KeyError):
        k = None
    if not k:
        return {"ok": False, "status": 0, "reason": "no-target", "note": "Kayıt bulunamadı."}
    bayt, mime, ad = cikti.uret(k, ek.get("bicim") or "pdf")
    if bayt is None:
        bayt, mime, ad = cikti.uret(k, "html")
    return channels.send_document(cfg, row["channel"], ad, bayt, mime.split(";")[0],
                                  caption=row["text"], to=row["target"], transport=transport)

GERI_CEKILME = (60, 300, 900, 3600)      # saniye
ASGARI_DENEME = len(GERI_CEKILME) + 1    # sonra vazgecilir
KALICI_HATALAR = (400, 401, 403, 404, 422)


def _now(now=None):
    return now or datetime.datetime.now().replace(microsecond=0)


def _iso(dt):
    return dt.isoformat(timespec="seconds")


def reply_kind(msg_id):
    """Bir CEVABIN kimligi, cevapladigi mesajin kimligidir.

    Satir kimligi (kanal, tur, gun) uclusudur ve gunluk ozet icin dogrudur:
    gunde tek mesaj. Ama bir gunde ONLARCA cevap olur; hepsini «reply»
    turune koymak, ikinci cevabi ilkinin kopyasi sanip DUSURURDU. Cevabin
    turune gelen mesajin kimligini katmak, her cevaba kendi kimligini verir
    ve tekrar korumasini da kendiliginden saglar: ayni mesaja iki kez cevap
    yazilmaz."""
    return "reply:%s" % (msg_id or "bilinmeyen")


def enqueue(con, channel, kind, day, text, target=None, now=None, ek=None):
    """Kuyruga koyar. Ayni kimlik varsa YENISINI YAZMAZ.

    `ek` = {"kayit_id", "bicim"}: satir bir BELGEDIR; `text` aciklamasidir.
    Belgenin bayti ambara yazilmaz, gonderim aninda kayittan uretilir."""
    t = _now(now)
    var = con.execute(
        "SELECT * FROM outbox WHERE channel=? AND kind=? AND day=?",
        (channel, kind, day)).fetchone()
    if var:
        return {"ok": True, "row": dict(var), "duplicate": True}
    cur = con.execute(
        "INSERT INTO outbox(channel, target, kind, day, text, next_at, created_at, ek) "
        "VALUES (?,?,?,?,?,?,?,?)",
        (channel, target, kind, day, text, _iso(t), _iso(t),
         json.dumps(ek, ensure_ascii=False) if ek else None))
    con.commit()
    row = con.execute("SELECT * FROM outbox WHERE id=?", (cur.lastrowid,)).fetchone()
    return {"ok": True, "row": dict(row), "duplicate": False}


def due(con, now=None):
    t = _iso(_now(now))
    rows = con.execute(
        "SELECT * FROM outbox WHERE state IN ('queued','failed') AND next_at<=? "
        "ORDER BY id", (t,)).fetchall()
    return [dict(r) for r in rows]


def _hata_metni(durum, r, belirsiz):
    """Kullaniciya «0» gostermek bilgi degildir.

    Durum kodu 0, «sunucu 0 dondu» demek degil «hic cevap gelmedi»
    demektir; bunu oldugu gibi yazmak, hatayi anlasilmaz kilar."""
    sebep = r.get("note") or r.get("reason") or "sebep yazilmadi"
    onek = "teslim belirsiz — " if belirsiz else ""
    if not durum:
        return "%sulaşılamadı: %s" % (onek, sebep)
    return "%sHTTP %s: %s" % (onek, durum, sebep)


def _mark(con, row_id, **alanlar):
    if not alanlar:
        return
    ifade = ", ".join("%s=?" % k for k in alanlar)
    con.execute("UPDATE outbox SET %s WHERE id=?" % ifade,
                tuple(alanlar.values()) + (row_id,))
    con.commit()


def flush(con, cfg, now=None, transport=None, limit=20):
    """Vadesi gelmis satirlari gonderir. Sonuc ozetini dondurur."""
    t = _now(now)
    ozet = {"sent": 0, "failed": 0, "given_up": 0, "skipped": 0,
            "uncertain": 0}
    for row in due(con, t)[:limit]:
        if not channels.enabled(cfg, row["channel"]):
            # Kanal kapaliyken denemek anlamsiz: satir bekler.
            ozet["skipped"] += 1
            continue
        if row.get("ek"):
            r = _belge_gonder(con, cfg, row, transport)
        else:
            r = channels.send(cfg, row["channel"], row["text"],
                              to=row["target"], transport=transport)
        deneme = row["attempts"] + 1
        if r.get("ok"):
            _mark(con, row["id"], state="sent", attempts=deneme,
                  sent_at=_iso(t), last_error=None)
            ozet["sent"] += 1
            continue
        durum = r.get("status") or 0
        # Ag hatasi (durum 0): istek gitti mi, gitmedi mi BILINMIYOR. Tekrar
        # denemek mesaji iki kez dusurebilir; denememek hic dusurmeyebilir.
        # Ikisinden biri secilmek zorunda ve gec gelen bir mesaj, hic
        # gelmeyenden iyidir — ama bu BELIRSIZLIK kayda gecer.
        belirsiz = durum == 0 and r.get("reason") not in (
            "not-allowed", "no-target", "unsafe-url", "unknown-channel", "off", "unsupported",
            "too-large")
        kalici = durum in KALICI_HATALAR or r.get("reason") in (
            "not-allowed", "no-target", "unsafe-url", "unknown-channel", "unsupported",
            "too-large")
        if kalici or deneme >= ASGARI_DENEME:
            # Sonsuz yeniden deneme, bir hatayi gizlemenin yavas bicimidir.
            _mark(con, row["id"], state="given_up", attempts=deneme,
                  last_error=_hata_metni(durum, r, belirsiz))
            ozet["given_up"] += 1
            continue
        bekle = GERI_CEKILME[min(deneme - 1, len(GERI_CEKILME) - 1)]
        _mark(con, row["id"], state="failed", attempts=deneme,
              next_at=_iso(t + datetime.timedelta(seconds=bekle)),
              last_error=_hata_metni(durum, r, belirsiz))
        ozet["failed"] += 1
        if belirsiz:
            ozet["uncertain"] += 1
    return ozet


def status(con, limit=30):
    rows = con.execute("SELECT * FROM outbox ORDER BY id DESC LIMIT ?",
                       (int(limit),)).fetchall()
    sayim = {}
    for r in con.execute("SELECT state, COUNT(*) n FROM outbox GROUP BY state"):
        sayim[r["state"]] = r["n"]
    belirsiz = con.execute(
        "SELECT COUNT(*) n FROM outbox WHERE last_error LIKE 'teslim belirsiz%'"
    ).fetchone()["n"]
    return {"counts": sayim, "recent": [dict(r) for r in rows],
            "uncertain": belirsiz,
            "note": "«Teslim belirsiz», isteğin gidip gitmediğinin "
                    "BİLİNMEDİĞİ hâldir: ağ koptuğunda sağlayıcı mesajı almış "
                    "da olabilir. Tekrar denemek onu iki kez düşürebilir; "
                    "denememek hiç düşürmeyebilir. Bu sistem tekrar dener ve "
                    "belirsizliği kayda geçer."}
