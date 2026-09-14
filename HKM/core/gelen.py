# -*- coding: utf-8 -*-
"""Gelen mesaj — TEK işleme yolu.

   Bir mesaj HKM'ye iki kapidan gelebilir:

     webhook   saglayici bize baglanir (disari acik bir adres ister)
     yoklama   biz saglayiciya baglaniriz (hicbir kapi acmaz)

   Iki kapi ama TEK isleme. Once webhook'un icinde duran mantik, yoklama
   eklendiginde kopyalanacakti; kopyalanan bir mantik, bir gun yalniz bir
   kapida duzeltilir ve otekinde bozuk kalir.

   Uc kural her iki kapida da aynidir:

   1. TANIMAYAN GONDERENIN ICERIGI AMBARA GIRMEZ. Reddedildigi not edilir,
      yazdigi sey yazilmaz.
   2. AYNI MESAJ IKI KEZ ISLENMEZ. Saglayici cevap alamadiginda tekrar
      yollar (webhook) ya da ayni guncelleme iki kez okunur (yoklama);
      «kabul» komutunun iki kez calismasi buradan cikardi.
   3. CEVAP GIDEN KUTUSUNDAN GECER. Dogrudan gonderim, ag koptugunda
      mesaji hicbir yere yazmadan yok ediyordu.

   4. CEVABI EKRANLA AYNI KATMAN URETIR. Telegram'dan gelen bir cumle ile
      HKM ekranindan yazilan ayni cumle, AYNI yoldan gecer (core/sohbet):
      once komut, sonra model, sonra durust bir «yok». Iki ayri cevap
      uretici olsaydi, ayni soruya iki farkli cevap veren bir sistem
      olurdu — ve hangisinin dogru oldugu bilinemezdi.
"""

import datetime

from core import db, outbox, patron, sohbet


def isle(con, cfg, kanal, m, th=None, transport=None, date=None):
    """Bir gelen mesaji isler ve sonucunu dondurur.

    `m`: {"from": ..., "text": ..., "id": ...} — channels.parse_* ciktisi.
    """
    from core import channels
    if not channels.allowed(cfg, kanal, m.get("from")):
        # Icerik AMBARA YAZILMAZ; yalniz reddedildigi not edilir.
        patron.log(con, kanal, "system",
                   "Bilinmeyen %s adresinden mesaj reddedildi." % kanal)
        return {"from": "?", "ok": False, "reason": "not-allowed"}

    kimlik = "%s:%s" % (m.get("from") or "?", m.get("id") or "")
    if db.seen_message(con, kanal, m.get("id") and kimlik):
        return {"duplicate": True, "note": "Bu mesaj daha önce işlendi."}

    gun = date or datetime.date.today().isoformat()

    # Cevabi ekranla AYNI katman uretir: once komut, sonra model, sonra
    # durust bir «yok». `transport` burada GIDEN KUTUSUNUN tasiyicisidir;
    # model cagrisina verilmez.
    gecmis = [{"role": ("user" if x["role"] == "user" else "assistant"),
               "content": x["text"]}
              for x in patron.history(con, limit=12, agent="king")
              if x["role"] in ("user", "manager")]
    r = sohbet.konus(con, cfg, m.get("text"), gun, gorevli="king",
                     gecmis=gecmis, th=th, kanal=kanal)
    satir = outbox.enqueue(con, kanal, outbox.reply_kind(kimlik), gun,
                           r["text"], target=m.get("from"))
    ozet = outbox.flush(con, cfg, limit=5, transport=transport)
    return {"command": r.get("command"), "mode": r.get("mode"), "queued": True,
            "duplicate_row": satir.get("duplicate", False),
            "sent": ozet.get("sent", 0), "failed": ozet.get("failed", 0),
            "uncertain": ozet.get("uncertain", 0)}
