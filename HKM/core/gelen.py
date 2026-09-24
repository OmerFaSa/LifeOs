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


def _eki_kaydet(con, kanal, m):
    ek = m.get("attachment")
    if not isinstance(ek, dict) or not ek.get("file_id"):
        return None
    cur = con.execute(
        "INSERT OR IGNORE INTO attachments(channel,sender,message_id,kind,"
        "file_id,unique_id,mime_type,file_name,size,duration,caption,state,created_at) "
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (kanal, str(m.get("from") or ""), str(m.get("id") or ""),
         ek.get("kind") or "unknown", ek["file_id"], ek.get("unique_id") or "",
         ek.get("mime_type") or "", ek.get("file_name") or "", ek.get("size"),
         ek.get("duration"), m.get("text") or "", "received",
         datetime.datetime.now().isoformat(timespec="seconds")))
    con.commit()
    return {"id": cur.lastrowid, "duplicate": cur.rowcount == 0,
            "kind": ek.get("kind") or "unknown"}


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
    ek = _eki_kaydet(con, kanal, m)
    if ek:
        ad = {"photo": "Fotoğraf", "video": "Video", "voice": "Sesli mesaj",
              "audio": "Ses", "document": "Belge"}.get(ek["kind"], "Dosya")
        from core import fis
        if ek["kind"] == "photo" and fis.BASLIK.search(m.get("text") or ""):
            # Fis okuma (core/fis.py): ritim fotografi indirip okur; taslak buraya
            # gelir. Onaylanmadan para kaydina hicbir sey yazilmaz.
            cevap = ("Fiş fotoğrafı alındı. Okuyup taslağı buraya göndereceğim; "
                     "sen onaylamadan hiçbir şey yazılmaz.")
        else:
            cevap = (ad + " alındı ve analiz kuyruğuna kaydedildi. "
                     "İçeriği henüz ölçülmedi; analiz tamamlanmadan sonuç üretilmeyecek.")
        patron.log(con, kanal, "user", m.get("text") or "[%s]" % ad, agent="king")
        patron.log(con, kanal, "manager", cevap, agent="king")
        satir = outbox.enqueue(con, kanal, outbox.reply_kind(kimlik), gun,
                               cevap, target=m.get("from"))
        ozet = outbox.flush(con, cfg, limit=5, transport=transport)
        return {"command": "attachment", "attachment_id": ek["id"], "queued": True,
                "duplicate_row": satir.get("duplicate", False),
                "sent": ozet.get("sent", 0), "failed": ozet.get("failed", 0),
                "uncertain": ozet.get("uncertain", 0)}

    # Cevabi ekranla AYNI katman uretir: once komut, sonra model, sonra
    # durust bir «yok». `transport` burada GIDEN KUTUSUNUN tasiyicisidir;
    # model cagrisina verilmez.
    gecmis = [{"role": ("user" if x["role"] == "user" else "assistant"),
               "content": x["text"]}
              for x in patron.history(con, limit=12, agent="king")
              if x["role"] in ("user", "manager")]
    r = sohbet.konus(con, cfg, m.get("text"), gun, gorevli="king",
                     gecmis=gecmis, th=th, kanal=kanal, hedef=m.get("from"))
    satir = outbox.enqueue(con, kanal, outbox.reply_kind(kimlik), gun,
                           r["text"], target=m.get("from"))
    ozet = outbox.flush(con, cfg, limit=5, transport=transport)
    return {"command": r.get("command"), "mode": r.get("mode"), "queued": True,
            "duplicate_row": satir.get("duplicate", False),
            "sent": ozet.get("sent", 0), "failed": ozet.get("failed", 0),
            "uncertain": ozet.get("uncertain", 0)}
