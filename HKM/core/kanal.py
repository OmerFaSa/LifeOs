# -*- coding: utf-8 -*-
"""Patronlar arasi kanal — HKM'nin bir modul Patronu'na verdigi resim.

   Uc modulun Patronu birbirini dogrudan tanimaz: AYS'nin Patronu SPI'nin
   verisini okuyamaz ve okumamali da. Aralarindaki bag King'dir. Bir modul
   bu ucu sorar ve Patronu'nun brifingine sunu koyar:

     - oteki iki modulun BUGUNKU son denetim hukmu ve bulgulari (kural
       motorunun cumleleri, kesinlik etiketiyle),
     - King'in bugunku onerisi (varsa).

   Uc kural:
   1. YALNIZ OKUR. Brifing (manager.brief) oneri kaydi yazar; kanal
      yazmaz. Bir modulun acilista sormasi merkezde iz birakmamali.
   2. ISTEYENIN KENDI VERISI GERI GITMEZ. Modul kendi verisini zaten
      bilir; ayni sayinin iki kaynaktan gelmesi celiski uretir.
   3. SESSIZLIK SIFIR DEGILDIR. Bugun veri gelmeyen modul «veri gelmedi»
      diye gorunur, «temiz» diye degil."""
import datetime

from core import sync_engine

MODULLER = ("ays", "spi", "esp")
VP_MODUL = {"academic": "ays", "bio": "spi", "intellect": "esp"}
MAX_BULGU = 5


def modul_icin(con, modul, date):
    if modul not in MODULLER:
        return {"ok": False, "note": "Bilinmeyen modül."}
    try:
        datetime.date.fromisoformat(str(date))
    except ValueError:
        return {"ok": False, "note": "Tarih yyyy-aa-gg olmalı."}
    denetim = sync_engine.latest_audits(con, date)
    out = {}
    for vp, m in VP_MODUL.items():
        if m == modul:
            continue
        a = denetim.get(vp)
        if not a:
            out[m] = {"verdict": None, "bulgular": [],
                      "not": "Bugün bu modülden veri gelmedi."}
            continue
        out[m] = {"verdict": a.get("verdict"),
                  "bulgular": [{"text": str(f.get("text") or "")[:300],
                                "cert": f.get("cert"), "tone": f.get("tone")}
                               for f in (a.get("findings") or [])[:MAX_BULGU]
                               if f.get("text")]}
    r = con.execute("SELECT proposal,state,rank FROM decisions WHERE date=? "
                    "ORDER BY rank ASC, id DESC LIMIT 1", (date,)).fetchone()
    king = ({"text": r["proposal"][:400], "state": r["state"], "rank": r["rank"]}
            if r else None)
    return {"ok": True, "date": date, "modul": modul, "king": king, "moduller": out}
