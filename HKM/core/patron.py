# -*- coding: utf-8 -*-
"""Buyuk Patron — kanaldan konusan tek agiz.

   HIYERARSI (ve her katmanin NE YAPMADIGI):

     VP'ler        olcumu denetler.      Cumle kurmaz, oncelik bilmez.
     Yonetici      brifingi derler.      Karar uretmez, karar tasir.
     BUYUK PATRON  kanaldan konusur.     Sayi uretmez, hukum kurmaz.

   Patron'un tek isi, Yonetici'nin ciktisini BIR MESAJA indirmek ve gelen
   kisa komutlara cevap vermektir. Bir dil modeli DEGILDIR ve bir model
   katmani import etmez: metin, kural motorunun kendi cumlelerinden
   dizilir. Model eklenecekse yeri burasi degil, bu metni yeniden ifade
   edecek ayri bir katmandir — ve o katman sayi uretemez.

   Dort kural:

   1. GUNDE TEK MESAJ. Kanal bir bildirim akisi degildir. Ayni gun ayni
      mesaj iki kez gonderilmez; gonderilenin kaydi `conversations`ta durur.

   2. EMIR KIPI YOK. Cikan her metin Yonetici'nin buyurgan kip
      denetcisinden gecer. Gecemeyen metin SESSIZCE DUZELTILMEZ: dusurulur.

   3. TANIMAYAN KISIYE VERI GITMEZ. Gelen mesajin gondereni izin
      listesinde degilse cevap verilmez ve icerik ambara yazilmaz —
      yalniz reddedildigi not edilir.

   4. KOMUT SETI KUCUK VE KAPALIDIR. Serbest metin yorumlanmaz: anlasilmayan
      mesaja «anlamadim, sunlari yapabilirim» denir. Anlamadigini anlamis
      gibi yapmak, bu depodaki en pahali hatadir.
"""

import datetime

from core import cross, db, impact, manager

# Komut sozlugu — kucuk ve KAPALI. Her biri tek bir sey yapar.
COMMANDS = [
    {"id": "durum", "words": ("durum", "brifing", "ozet", "özet", "rapor"),
     "note": "Gunun brifingi: uc masanin hukmu ve varsa tek oneri."},
    {"id": "kabul", "words": ("kabul", "tamam", "olur", "evet"),
     "note": "Gunun acik onerisini kabul eder."},
    {"id": "ret", "words": ("ret", "red", "hayir", "hayır", "reddet"),
     "note": "Gunun acik onerisini reddeder. Kayit silinmez."},
    {"id": "neden", "words": ("neden", "niye", "dayanak", "kaynak"),
     "note": "Onerinin hangi denetimlerden dogdugunu soyler."},
    {"id": "capraz", "words": ("capraz", "çapraz", "esleme", "eşleşme"),
     "note": "Uc ambarin yan yana konmasindan cikan bulgular."},
    {"id": "etki", "words": ("etki", "fayda", "ise", "işe"),
     "note": "Kabul edilen onerilerin ardindan olculer ne yapti."},
    {"id": "yardim", "words": ("yardim", "yardım", "komut", "?"),
     "note": "Bu listeyi gosterir."},
]

MAX_CHARS = 900          # kanal mesaji: okunmayan bir rapor, rapor degildir


def _norm(s):
    return (s or "").strip().lower().replace("i̇", "i")


def parse(text):
    """Serbest metin YORUMLANMAZ. Ilk kelime bir komuta esitse o komut,
    degilse None. «Anlamadigini anlamis gibi yapmak» burada baslar."""
    t = _norm(text)
    if not t:
        return None
    ilk = t.split()[0].strip(".,!:;")
    for c in COMMANDS:
        if ilk in c["words"]:
            return c["id"]
    return None


def _kirp(metin):
    if len(metin) <= MAX_CHARS:
        return metin
    return metin[:MAX_CHARS - 1].rsplit(" ", 1)[0] + "…"


def daily_message(con, date, th=None):
    """Gunun tek mesaji — Yonetici'nin brifinginden dizilir.

    Patron burada hicbir sey HESAPLAMAZ: satirlari secer ve siraya koyar."""
    b = manager.brief(con, date, th=th)
    parca = ["HKM · " + date]
    for l in b["lines"]:
        if l["kind"] == "vp":
            parca.append("• " + l["text"])
    kapsam = [l for l in b["lines"] if l["kind"] == "coverage"]
    if kapsam:
        parca.append(kapsam[0]["text"])
    capraz = [l for l in b["lines"] if l["kind"] == "cross"]
    for l in capraz[:1]:
        parca.append("Çapraz: " + l["text"])
    if b["proposal"]:
        parca.append("Öneri: " + b["proposal"]["proposal"])
        parca.append("Yanıt: «kabul» ya da «ret». «neden» dayanağı söyler.")
    else:
        parca.append("Bugün için bir öneri yok.")
    metin = _kirp("\n".join(parca))
    if manager.imperatives(metin):
        # Reddet-ve-dus: sessiz duzeltme anlami tersine cevirebilir.
        return {"ok": False, "text": None, "brief": b,
                "error": "Mesaj buyurgan kip tasidigi icin gonderilmedi.",
                "words": manager.imperatives(metin)}
    return {"ok": True, "text": metin, "brief": b}


def _dayanak(con, karar):
    if not karar:
        return "Bugün açık bir öneri yok."
    kaynak = db.sources_of(con, karar["id"])
    if not kaynak:
        return "Bu öneri kaynak denetimine bağlanmamış; bu bir kayıt hatasıdır."
    adlar = {"academic": "AYS", "bio": "SPİ", "intellect": "ESP"}
    parca = []
    for k in kaynak:
        parca.append("%s: %s" % (adlar.get(k["vp"], k["vp"]), k["verdict"]))
    return ("Öneri şu denetimlerden doğdu — " + " · ".join(parca)
            + ". Öncelik sırası: " + str(karar["rank"]) + ".")


def _acik_oneri(con, date):
    for d in reversed(db.decisions_of(con, date)):
        if d["state"] == "proposed":
            return d
    return None


def respond(con, text, date=None, th=None, channel="local", now=None):
    """Gelen kisa komuta cevap. Anlasilmayan mesaj YORUMLANMAZ."""
    date = date or datetime.date.today().isoformat()
    now = now or datetime.datetime.now().isoformat(timespec="seconds")
    komut = parse(text)
    log(con, channel, "user", text, now)

    if komut is None:
        cevap = ("Anlamadım — serbest metni yorumlamıyorum. Şunları yapabilirim: "
                 + ", ".join("«%s»" % c["id"] for c in COMMANDS) + ".")
    elif komut == "yardim":
        cevap = "\n".join("«%s» — %s" % (c["id"], c["note"]) for c in COMMANDS)
    elif komut == "durum":
        m = daily_message(con, date, th=th)
        cevap = m["text"] if m["ok"] else m["error"]
    elif komut == "capraz":
        bulgu = cross.findings(con, date)
        if not bulgu:
            cevap = ("Görünür bir çapraz ayrışma yok. Bu «ilişki yok» demek "
                     "değildir: ölçülen günlerde fark, ölçünün genişliğinin "
                     "altında kaldı ya da eşleşmiş gün sayısı yetmedi.")
        else:
            cevap = "\n".join("• " + b["note"] for b in bulgu[:2])
    elif komut == "etki":
        ozet = impact.summary(con)
        cevap = ozet["verdict"]["note"]
    elif komut == "neden":
        karar = db.current_decision(con, date) or _acik_oneri(con, date)
        cevap = _dayanak(con, karar)
    else:  # kabul | ret
        karar = _acik_oneri(con, date)
        if not karar:
            cevap = "Cevaplanacak açık bir öneri yok."
        else:
            r = manager.respond(con, karar["id"],
                                "accepted" if komut == "kabul" else "declined")
            if r["status"] != 200:
                cevap = "Öneri güncellenemedi: " + r.get("error", "bilinmeyen durum")
            elif komut == "kabul":
                cevap = "Kabul edildi. Uygulamayı sen yaparsın; HKM'nin uygulama " \
                        "ya da ekran düzeyinde bir yetkisi yoktur."
            else:
                cevap = "Reddedildi. Kayıt silinmiyor: neyin önerildiği ve neyin " \
                        "reddedildiği, bu katmanı sonradan denetlemenin tek yolu."

    cevap = _kirp(cevap)
    if manager.imperatives(cevap):
        cevap = ("Cevap buyurgan kip taşıdığı için düşürüldü. Bu bir yazılım "
                 "hatasıdır ve sessizce düzeltilmez.")
    log(con, channel, "manager", cevap, now)
    return {"command": komut, "text": cevap, "date": date}


def log(con, channel, role, text, now=None):
    """Konusma kaydi. Ham ses saklanmaz: audio_retained varsayilani 0."""
    now = now or datetime.datetime.now().isoformat(timespec="seconds")
    con.execute(
        "INSERT INTO conversations(channel, role, text, audio_retained, created_at) "
        "VALUES (?,?,?,0,?)", (channel, role, str(text or ""), now))
    con.commit()


def history(con, limit=40, channel=None):
    q = "SELECT * FROM conversations"
    args = []
    if channel:
        q += " WHERE channel=?"
        args.append(channel)
    q += " ORDER BY id DESC LIMIT ?"
    args.append(int(limit))
    rows = con.execute(q, args).fetchall()
    return [dict(r) for r in reversed(rows)]


def already_sent(con, date, channel):
    """Gunde tek mesaj: ayni gun ayni kanala gonderilmis mi?"""
    row = con.execute(
        "SELECT 1 FROM conversations WHERE channel=? AND role='manager' "
        "AND text LIKE ? AND created_at LIKE ? LIMIT 1",
        (channel, "HKM · " + date + "%", date + "%")).fetchone()
    return bool(row)
