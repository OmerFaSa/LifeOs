# -*- coding: utf-8 -*-
"""Ek cozumleme — belge, ses, video (GELISTIRME_PLANI adim 3-5).

   Kullanici karari (2026-09-25): ses ve video GEMINI ile; belge yerelde.

     belge   core/belge.py — metin katmani yerelde cikar, model YOK, belge
             disari gitmez.
     ses     «Medya · ses/video cozumleyen» kademesi (yalniz Google):
             kelimesi kelimesine yaziya dokum; duyulmayan yer
             [anlaşılmıyor], tahmin yok.
     video   ayni kademe, YALNIZ basligi isterse («anlat», «çözümle»,
             «özetle»): ne oldugu 3-5 cumle; gorulmeyen sey yazilmaz.

   Uc kural:
   1. KOMUT DEGIL. Yaziya dokulen ses hicbir aksiyonu tetiklemez; yalniz
      gonderene geri yazilir ve ekin kaydinda durur (attachments.analysis).
   2. BIR KEZ. Ek once analyzed_at alir, sonra islenir: hata olsa da ayni
      ek her tikte yeniden modele gitmez (para).
   3. SOYLER. Model atanmamissa, saglayici Google degilse, dosya buyukse ya
      da belge okunamazsa gonderene NEDENI gider; sessiz basarisizlik yok."""
import base64
import datetime
import re

from core import ai, belge

ROL = "medya"
TURLER = ("document", "voice", "audio", "video")
SES = ("voice", "audio")
# Gemini: ses ~32 jeton/sn, video ~300 jeton/sn. Sure bilinmiyorsa
# tavan sorusu icin en kotuye yakin TAHMIN (bkz. ai.GORSEL_JETON).
JETON_SN = {"ses": 32, "video": 300}
BILINMEYEN_SN = {"ses": 600, "video": 120}
ONIZLEME = 280
# GELISTIRME_PLANI: «tum videoyu varsayilan olarak modele gondermeme».
# Video yalniz basligi bunu ISTERSE gider; ses her zaman yaziya dokulur.
VIDEO_ISTEK = re.compile(r"(anlat|çözümle|cozumle|özetle|ozetle|ne var)", re.I)

SISTEM_SES = ("Sen bir yazıya dökme aracısın. Sesi kelimesi kelimesine, konuşulan dilde "
              "yaz. Duyamadığın ya da emin olmadığın yeri [anlaşılmıyor] diye işaretle; "
              "tahmin etme, özetleme, yorum ekleme. Konuşma yoksa yalnız «[konuşma yok]» yaz.")
SISTEM_VIDEO = ("Videoda ne olduğunu Türkçe 3-5 cümleyle anlat; konuşma varsa ne "
                "söylendiğini özetle. Görmediğin ya da duymadığın şeyi yazma; emin "
                "değilsen «emin değilim» de. Sağlıkla ilgili görüntüde teşhis koyma.")


def _simdi(now=None):
    return now or datetime.datetime.now().isoformat(timespec="seconds")


def _kisalt(metin, n=ONIZLEME):
    metin = " ".join((metin or "").split())
    return metin if len(metin) <= n else metin[:n].rsplit(" ", 1)[0] + " …"


def _belge(a):
    r = belge.metin_cikar(a["local_path"], a["mime_type"], a["file_name"])
    if not r.get("ok"):
        return None, "Belge okunamadı: %s" % r.get("note")
    ad = a["file_name"] or "belge"
    parca = ["%d kelime" % r["kelime"]]
    if r.get("sayfa"):
        parca.insert(0, "%d sayfa" % r["sayfa"])
    cevap = "Belgeyi okudum (%s · %s): «%s»%s" % (
        ad, ", ".join(parca), _kisalt(r["metin"]),
        " Belge uzundu; ilk %d karakteri tuttum." % belge.EN_COK_KARAKTER if r.get("kesildi") else "")
    return r["metin"], cevap


def _model(con, cfg, a, transport=None, now=None):
    tur = "ses" if a["kind"] in SES else "video"
    if tur == "video" and not VIDEO_ISTEK.search(a["caption"] or ""):
        return None, ("Videoyu sakladım, modele göndermedim. Anlatmamı istersen başlığına "
                      "«anlat» yazarak yeniden gönder.")
    h = ai.hazir_mi(cfg, ROL)
    if not h.get("ok"):
        return None, ("%s çözümlemek için bir model gerekli (HKM › Modeller › «Medya · "
                      "ses/video çözümleyen», Google/Gemini). %s"
                      % ("Sesi" if tur == "ses" else "Videoyu", h.get("note") or ""))
    try:
        with open(a["local_path"], "rb") as f:
            ham = f.read()
    except OSError:
        return None, "Dosya artık yerinde değil; çözümlenemedi."
    if len(ham) > ai.MEDYA_EN_COK_BAYT:
        return None, ("Dosya %d MB'tan büyük; Gemini'ye satır içi gönderilemez, çözümlenmedi."
                      % (ai.MEDYA_EN_COK_BAYT // (1024 * 1024)))
    mime = a["mime_type"] or ("audio/ogg" if tur == "ses" else "video/mp4")
    sn = a["duration"] if a["duration"] else BILINMEYEN_SN[tur]
    r = ai.ask(con, cfg, ROL, "ses_yaz" if tur == "ses" else "video_anlat",
               [{"role": "user", "content": "Bu sesi yazıya dök." if tur == "ses"
                 else "Bu videoyu anlat."}],
               sistem=SISTEM_SES if tur == "ses" else SISTEM_VIDEO,
               transport=transport, now=now, denetim="belge", duzeltme=False,
               veri=["telegram_%s" % tur],
               medya=[{"mime": mime, "data": base64.b64encode(ham).decode("ascii"),
                       "jeton": int(sn) * JETON_SN[tur]}])
    if not r.get("ok"):
        return None, "%s çözümlenemedi: %s" % ("Ses" if tur == "ses" else "Video", r.get("note"))
    metin = (r.get("text") or "").strip()
    if tur == "ses":
        return metin, "Sesini yazıya döktüm (Gemini; tahmin, kelimesi kelimesine): «%s»" % _kisalt(metin, 600)
    return metin, "Videoda gördüğüm (Gemini; tahmin): %s" % _kisalt(metin, 600)


def isle(con, cfg, transport=None, now=None, bugun=None, limit=1):
    """Ritim: indirilmis belge/ses/video ekini isler; sonucu ekin kaydina
    yazar ve gonderene kisa cevap birakir. Her tikte en cok `limit` ek."""
    from core import outbox
    bugun = bugun or datetime.date.today().isoformat()
    satirlar = con.execute(
        "SELECT * FROM attachments WHERE kind IN (?,?,?,?) AND state='ready' "
        "AND analyzed_at IS NULL AND local_path IS NOT NULL ORDER BY id LIMIT ?",
        TURLER + (limit,)).fetchall()
    islenen = 0
    for a in satirlar:
        con.execute("UPDATE attachments SET analyzed_at=? WHERE id=?", (_simdi(now), a["id"]))
        con.commit()
        islenen += 1
        if a["kind"] == "document":
            metin, cevap = _belge(a)
        else:
            metin, cevap = _model(con, cfg, a, transport=transport, now=now)
        con.execute("UPDATE attachments SET analysis=?, error=? WHERE id=?",
                    (metin, None if metin else cevap, a["id"]))
        outbox.enqueue(con, a["channel"], "ek:%d" % a["id"], bugun, cevap,
                       target=a["sender"], now=now)
        con.commit()
    return {"ok": True, "islenen": islenen}
