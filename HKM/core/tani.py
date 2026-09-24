# -*- coding: utf-8 -*-
"""Bozuk olani soyleyen tek ekran (fikir 48).

   Sistemin parcalari (model, web, sohbet kanali, modullerin baglantisi,
   yedek, butce) ayri ekranlarda durum soyler. Burada hepsi TEK listededir;
   her madde uc durumdan birini ve NEREDE duzeltilecegini soyler:

     tamam   olculdu ve calisiyor
     uyari   calisiyor ama bir sey eksik ya da eskimis
     bozuk   bu haliyle o is YAPILAMAZ

   Olculmeyen bir sey «tamam» diye raporlanmaz (AGENTS §1.7): hic veri
   yollamamis bir modul uyaridir. Bu dosya bir sey DUZELTMEZ; yalniz
   gosterir ve yeri soyler."""
import datetime

from core import ai, butce, channels, twin, web, yedek

MODUL_AD = {"ays": "AYS", "spi": "SPİ", "esp": "ESP"}
SESSIZ_GUN = 3
YEDEK_ESKI_GUN = 3


def _m(ad, durum, metin, nerede=""):
    return {"ad": ad, "durum": durum, "metin": metin, "nerede": nerede}


def ozet(con, cfg, bugun, db_path=None):
    g = datetime.date.fromisoformat(bugun)
    out = []

    h = ai.hazir_mi(cfg, "king")
    out.append(_m("Sohbet modeli", "tamam" if h["ok"] else "bozuk",
                  "King konuşabiliyor." if h["ok"] else h["note"],
                  "" if h["ok"] else "HKM › Ayarlar › Yapay zekâ"))
    h = ai.hazir_mi(cfg, "bam.arastirma")
    out.append(_m("BAM modeli", "tamam" if h["ok"] else "uyari",
                  "BAM ofisleri çalışabilir." if h["ok"] else
                  "BAM işleri (araştırma, ürün, kitap) açılamaz: " + h["note"],
                  "" if h["ok"] else "HKM › Ayarlar › Yapay zekâ"))

    acik = web.settings(cfg).get("acik")
    out.append(_m("Web araması", "tamam" if acik else "uyari",
                  "Web açık; kaynaklı araştırma yapılabilir." if acik else
                  "Web kapalı: fiyat ve yer bilgisi ile kaynaklı araştırma yapılamaz.",
                  "" if acik else "HKM › Ayarlar › Web"))

    kanallar = [k for k in ("telegram", "whatsapp") if channels.enabled(cfg, k)]
    zaman = ((cfg or {}).get("schedule") or {}).get("enabled")
    if kanallar:
        out.append(_m("Sohbet kanalı", "tamam", "Açık: %s." % ", ".join(
            "Telegram" if k == "telegram" else "WhatsApp" for k in kanallar)))
    else:
        out.append(_m("Sohbet kanalı", "bozuk" if zaman else "uyari",
                      "Otomatik mesajlar açık ama bağlı kanal yok; hiçbir mesaj gitmiyor."
                      if zaman else "Telegram bağlı değil; HKM yalnız bu ekrandan konuşur.",
                      "HKM › Ayarlar › Kanallar"))

    kapsam = twin.snapshot(con, bugun, 7)["modules"]
    for m in ("ays", "spi", "esp"):
        son = kapsam.get(m, {}).get("last_seen")
        ad = "%s bağlantısı" % MODUL_AD[m]
        if not son:
            out.append(_m(ad, "uyari", "%s son 7 günde HKM'ye hiç veri yollamadı." % MODUL_AD[m],
                          "%s › Ayarlar › HKM bağlantısı" % MODUL_AD[m]))
            continue
        fark = (g - datetime.date.fromisoformat(son)).days
        out.append(_m(ad, "uyari" if fark >= SESSIZ_GUN else "tamam",
                      "Son veri %s (%d gün önce)." % (son, fark) if fark else "Bugün veri geldi.",
                      "%s › Ayarlar › HKM bağlantısı" % MODUL_AD[m] if fark >= SESSIZ_GUN else ""))

    if db_path:
        liste = yedek.liste(yedek.kok(db_path))["moduller"]
        for m in ("ays", "spi", "esp"):
            l = liste.get(m) or []
            ad = "%s yedeği" % MODUL_AD[m]
            if not l:
                out.append(_m(ad, "uyari", "HKM'de %s yedeği yok." % MODUL_AD[m],
                              "%s HKM'ye bağlıyken günde bir kez kendiliğinden yollar" % MODUL_AD[m]))
                continue
            fark = (g - datetime.date.fromisoformat(l[0]["tarih"])).days
            out.append(_m(ad, "uyari" if fark >= YEDEK_ESKI_GUN else "tamam",
                          "Son yedek %s." % l[0]["tarih_yazi"],
                          "%s'yi HKM'ye bağlı aç" % MODUL_AD[m] if fark >= YEDEK_ESKI_GUN else ""))

    b = butce.month(con, cfg, bugun)
    dur = b.get("stop_at_pct")
    if b.get("pct") is not None and dur and b["pct"] >= dur:
        out.append(_m("Bütçe", "bozuk", "Aylık tavanın %%%s'i harcandı; ücretli çağrılar durdu."
                      % b["pct"], "HKM › Ayarlar › Bütçe"))
    elif b.get("currency") == "try" and not b.get("rate"):
        out.append(_m("Bütçe", "bozuk", "Tavan TL ama USD/TRY kuru girilmemiş; model çağrıları yapılmıyor.",
                      "HKM › Ayarlar › Bütçe"))
    elif b.get("currency") == "try" and b.get("rate_stale"):
        out.append(_m("Bütçe", "uyari", "USD/TRY kuru eskimiş; TL hesabı yanlış olabilir.",
                      "HKM › Ayarlar › Bütçe"))
    else:
        out.append(_m("Bütçe", "tamam", "Bu ay %s %s harcandı." % (b.get("spent"), b.get("currency_label"))))

    bozuk = sum(1 for x in out if x["durum"] == "bozuk")
    uyari = sum(1 for x in out if x["durum"] == "uyari")
    metin = ("Her şey çalışıyor." if not (bozuk or uyari) else
             "%d bozuk, %d uyarı. Her satırda nerede düzelteceğin yazıyor." % (bozuk, uyari))
    return {"maddeler": out, "bozuk": bozuk, "uyari": uyari, "metin": metin}
