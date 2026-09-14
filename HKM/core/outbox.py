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

from core import channels, db

GERI_CEKILME = (60, 300, 900, 3600)      # saniye
ASGARI_DENEME = len(GERI_CEKILME) + 1    # sonra vazgecilir
KALICI_HATALAR = (400, 401, 403, 404, 422)


def _now(now=None):
    return now or datetime.datetime.now().replace(microsecond=0)


def _iso(dt):
    return dt.isoformat(timespec="seconds")


def enqueue(con, channel, kind, day, text, target=None, now=None):
    """Kuyruga koyar. Ayni kimlik varsa YENISINI YAZMAZ."""
    t = _now(now)
    var = con.execute(
        "SELECT * FROM outbox WHERE channel=? AND kind=? AND day=?",
        (channel, kind, day)).fetchone()
    if var:
        return {"ok": True, "row": dict(var), "duplicate": True}
    cur = con.execute(
        "INSERT INTO outbox(channel, target, kind, day, text, next_at, created_at) "
        "VALUES (?,?,?,?,?,?,?)",
        (channel, target, kind, day, text, _iso(t), _iso(t)))
    con.commit()
    row = con.execute("SELECT * FROM outbox WHERE id=?", (cur.lastrowid,)).fetchone()
    return {"ok": True, "row": dict(row), "duplicate": False}


def due(con, now=None):
    t = _iso(_now(now))
    rows = con.execute(
        "SELECT * FROM outbox WHERE state IN ('queued','failed') AND next_at<=? "
        "ORDER BY id", (t,)).fetchall()
    return [dict(r) for r in rows]


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
    ozet = {"sent": 0, "failed": 0, "given_up": 0, "skipped": 0}
    for row in due(con, t)[:limit]:
        if not channels.enabled(cfg, row["channel"]):
            # Kanal kapaliyken denemek anlamsiz: satir bekler.
            ozet["skipped"] += 1
            continue
        r = channels.send(cfg, row["channel"], row["text"],
                          to=row["target"], transport=transport)
        deneme = row["attempts"] + 1
        if r.get("ok"):
            _mark(con, row["id"], state="sent", attempts=deneme,
                  sent_at=_iso(t), last_error=None)
            ozet["sent"] += 1
            continue
        durum = r.get("status") or 0
        kalici = durum in KALICI_HATALAR or r.get("reason") in (
            "not-allowed", "no-target", "unsafe-url", "unknown-channel")
        if kalici or deneme >= ASGARI_DENEME:
            # Sonsuz yeniden deneme, bir hatayi gizlemenin yavas bicimidir.
            _mark(con, row["id"], state="given_up", attempts=deneme,
                  last_error="%s · %s" % (durum, r.get("note") or r.get("reason")))
            ozet["given_up"] += 1
            continue
        bekle = GERI_CEKILME[min(deneme - 1, len(GERI_CEKILME) - 1)]
        _mark(con, row["id"], state="failed", attempts=deneme,
              next_at=_iso(t + datetime.timedelta(seconds=bekle)),
              last_error="%s · %s" % (durum, r.get("note") or r.get("reason")))
        ozet["failed"] += 1
    return ozet


def status(con, limit=30):
    rows = con.execute("SELECT * FROM outbox ORDER BY id DESC LIMIT ?",
                       (int(limit),)).fetchall()
    sayim = {}
    for r in con.execute("SELECT state, COUNT(*) n FROM outbox GROUP BY state"):
        sayim[r["state"]] = r["n"]
    return {"counts": sayim, "recent": [dict(r) for r in rows]}
