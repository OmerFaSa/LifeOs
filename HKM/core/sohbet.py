# -*- coding: utf-8 -*-
"""Sohbet — King ve alt patronlarla doğal konuşma.

   Komut seti kucuk ve kapalidir; bu iyi bir sey ama yeterli degil.
   «Bugun odaklanamadim, programi hafifletelim mi?» bir komut degildir ve
   bir komuta cevrilmesi de gerekmez.

   Bu katman o cumleyi karsilar — ama SISTEMI DEGISTIRMEZ. Dort sinir:

   1. ONCE KOMUT. Kullanici «durum» yazdiysa kural motoru cevap verir;
      modele gitmez. Ucretsiz, kesin ve ayni olan yol once denenir.

   2. MODEL YALNIZ CUMLE KURAR. Gonderilen baglam, kural motorunun
      URETTIGI olculerdir. Modelin gorecegi tek gercek budur ve cevaptaki
      sayilar bununla denetlenir (core/ai.py).

   3. SOHBET ONAY DEGILDIR. Konusmak bir sey degistirmez. Plani ya da
      veriyi degistiren her sey TEKLIF olur ve mevcut onay zincirinden
      gecer: kullanici gormeden hicbir sey uygulanmaz.

   4. MODEL YOKSA SISTEM CALISIR. Atama yapilmamissa ya da butce
      bittiyse, bu ACIKCA soylenir ve komutlar sunulmaya devam eder.
      «Yapay zeka yok» ile «sistem bozuk» ayri seylerdir.
"""

from core import ai, cross, manager, patron, streak

# Kademeler: kullanici kiminle konusuyor.
GOREVLILER = {
    "king": {"role": "king", "ad": "King",
             "is": "Üç sistemi birlikte değerlendirir; günün tek cümlesini "
                   "taşır."},
    "bio": {"role": "vp_bio", "ad": "Biyolojik sermaye (SPİ)",
            "is": "Uyku, toparlanma ve HRV; yükün bedenle ilişkisi."},
    "academic": {"role": "vp_academic", "ad": "Akademik hedef (AYS)",
                 "is": "Soru, çalışma süresi ve net; takvime bağlı hedef."},
    "intellect": {"role": "vp_intellect", "ad": "Entelektüel gelişim (ESP)",
                  "is": "Kalıcılık, pratik ve sentez."},
}

# Her gorevli YALNIZ kendi alanina bakar: baglami da o kadardir.
ALAN = {"bio": "bio", "academic": "academic", "intellect": "intellect"}

SISTEM_METNI = """Sen HKM'nin %(ad)s görevlisisin. %(is)s

Kesin kurallar:
- Sana verilen ÖLÇÜMLER dışında hiçbir sayı kullanma. Bilmediğin bir şey
  sorulursa «bu ölçülmedi» de; tahmin etme, uydurma.
- Emir kipi kullanma. Öneri kur: «…önerebilirim», «…istersen».
- Kısa yaz: en fazla 5 cümle. Kullanıcı Türkçe konuşuyor, sen de Türkçe yaz.
- Sen bir şey uygulayamazsın. Kullanıcı bir değişiklik isterse, bunun bir
  TEKLİF olarak bırakılacağını ve onun onayıyla uygulanacağını söyle.
- Veri yoksa bunu söylemek bir başarısızlık değildir; uydurmak öyledir.

Bugünün ölçümleri:
%(baglam)s"""


def baglam(con, date, gorevli="king", th=None):
    """Modelin gorecegi TEK gercek: kural motorunun urettigi olculer.

    Ham veri gonderilmez, ozet gonderilir — ve her satir zaten kural
    motorunun yazdigi cumledir."""
    b = manager.brief(con, date, th=th)
    satir = ["Tarih: %s" % date]
    alan = ALAN.get(gorevli)
    for l in b["lines"]:
        if alan and l.get("vp") and l["vp"] != alan:
            continue
        if l["kind"] in ("vp", "coverage", "blind", "streak", "cross",
                         "proposal"):
            satir.append("- " + l["text"])
    if gorevli == "king":
        k = b.get("council") or {}
        for u in (k.get("members") or []):
            satir.append("- %s (%s): %s, %d bulgu%s"
                         % (u["title"], u["module_label"], u["verdict_text"],
                            u["findings"], " — bugün duyulan bu" if u["heard"]
                            else ""))
        for f in cross.findings(con, date)[:2]:
            satir.append("- Çapraz: " + f["note"])
        for f in streak.findings(con, date, th=th)[:2]:
            satir.append("- Üst üste: " + f["note"])
    if b.get("decision"):
        satir.append("- Bugünün önerisi «%s» ve durumu: %s"
                     % (b["decision"]["proposal"], b["decision"]["state"]))
    return "\n".join(satir)


def konus(con, cfg, metin, date, gorevli="king", gecmis=None, th=None,
          user="ben", transport=None, kayit=True, kanal="local"):
    """Bir mesaja cevap. Once komut, sonra model, sonra durust bir «yok».

    Doner: {"mode": komut|model|yok, "text": ..., ...}
    """
    if gorevli not in GOREVLILER:
        return {"ok": False, "mode": "yok", "text": None,
                "note": "Bilinmeyen görevli."}

    # 1 — ONCE KOMUT. Ucretsiz, kesin ve her zaman ayni olan yol.
    komut = patron.parse(metin)
    if komut and gorevli == "king":
        r = patron.respond(con, metin, date=date, th=th, channel=kanal,
                           agent=gorevli, kayit=kayit)
        return {"ok": True, "mode": "komut", "command": r["command"],
                "text": r["text"], "agent": gorevli}

    rol = GOREVLILER[gorevli]["role"]
    hazir = ai.hazir_mi(cfg, rol)
    if not hazir["ok"]:
        # 4 — MODEL YOKSA SISTEM CALISIR. «Yapay zeka yok» ile «sistem
        # bozuk» ayri seylerdir ve ayri yazilir.
        if gorevli == "king":
            r = patron.respond(con, metin, date=date, th=th, channel=kanal,
                               agent=gorevli, kayit=kayit)
            return {"ok": True, "mode": "komut", "command": r["command"],
                    "text": r["text"], "agent": gorevli,
                    "ai": {"ok": False, "reason": hazir["reason"],
                           "note": hazir["note"]}}
        return {"ok": False, "mode": "yok", "text": None, "agent": gorevli,
                "note": hazir["note"]}

    bg = baglam(con, date, gorevli, th=th)
    g = GOREVLILER[gorevli]
    sistem = SISTEM_METNI % {"ad": g["ad"], "is": g["is"], "baglam": bg}
    mesajlar = list(gecmis or []) + [{"role": "user", "content": metin}]

    r = ai.ask(con, cfg, rol, "sohbet", mesajlar, baglam=bg, sistem=sistem,
               user=user, transport=transport)
    if not r["ok"]:
        # Model konusamadiysa kural motoru devrede kalir: sohbet
        # bozulabilir, sistem bozulmaz.
        yedek = patron.respond(con, metin, date=date, th=th, channel=kanal,
                               agent=gorevli, kayit=kayit)
        return {"ok": True, "mode": "komut", "command": yedek["command"],
                "text": yedek["text"], "agent": gorevli,
                "ai": {"ok": False, "reason": r.get("reason"),
                       "note": r.get("note")}}
    if kayit:
        patron.log(con, kanal, "user", metin, agent=gorevli)
        patron.log(con, kanal, "manager", r["text"], agent=gorevli)
    return {"ok": True, "mode": "model", "text": r["text"], "agent": gorevli,
            "model": r["model"], "usd": r["usd"], "seconds": r["seconds"],
            "context_lines": len(bg.splitlines())}
