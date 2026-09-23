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

from core import cross, db, dil, impact, intents, manager, streak

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
    {"id": "seri", "words": ("seri", "ustuste", "üstüste", "kacgun", "kaçgün"),
     "note": "Ust uste suren esik kiriklari."},
    {"id": "etki", "words": ("etki", "fayda", "ise", "işe"),
     "note": "Kabul edilen onerilerin ardindan olculer ne yapti."},
    {"id": "yardim", "words": ("yardim", "yardım", "komut", "?"),
     "note": "Bu listeyi gosterir."},
    # Telegram'in ilk komutu. Cevapsiz birakmak, botun bozuk oldugunu
    # dusundurur: kullanicinin ilk yazdigi sey bu ve ilk izlenim bu.
    # YALNIZ Telegram'in ilk komutu. «merhaba», «selam» gibi gunluk
    # kelimeler bu kapali kumeye KONMAZ: ilk kelimesi selam olan her cumle
    # anlasilmis sayilirdi ve «anlamadigimda anlamis gibi yapmam» sozu
    # sessizce delinirdi.
    {"id": "basla", "words": ("basla", "başla", "start"),
     "note": "Karsilama ve ne yapabilecegin."},
]

# PROAKTIF mesajin siniri: davet edilmeden gelen bir metin kisa olmali,
# cunku okunmayan bir rapor rapor degildir.
#
# SORULAN bir sorunun cevabi ise KIRPILMAZ. Ikisi bir sure ayni sinira
# tabiydi ve «hafta» diye soran kullanici raporun 900. karakterinde «…»
# goruyordu: sorunun cevabini yarim vermek, vermemenin kibar bicimidir.
# Uzun cevap artik kanal katmaninda PARCALARA BOLUNUP gonderiliyor
# (core/channels.py), yani kirpmanin bir sebebi de kalmadi.
MAX_CHARS = 900

# Hangi alan hangi modulun isi. Bilinmeyen bir alan icin niyet KURULMAZ:
# hangi modulun ustlenecegi belirsizken teklif yazmak, kuyruga cop atmaktir.
ALAN_MODUL = {
    "mat": ("ays", "subject"), "tr": ("ays", "subject"), "fiz": ("ays", "subject"),
    "kim": ("ays", "subject"), "biy": ("ays", "subject"), "tar": ("ays", "subject"),
    "cog": ("ays", "subject"), "geo": ("ays", "subject"),
    "lang": ("esp", "disc"), "music": ("esp", "disc"),
    "reading": ("esp", "disc"), "writing": ("esp", "disc"),
}


def _norm(s):
    return (s or "").strip().lower().replace("i̇", "i")


def parse(text):
    """Kesin eslesme: ilk kelime bir komuta esitse o komut, degilse None.

    Bu katman DEGISMEDI ve degismeyecek: tam komut yazan kullanici her
    zaman ayni cevabi alir. Serbest cumleyi cozen katman (core/dil.py)
    bunun USTUNE gelir, yerine degil."""
    t = _norm(text)
    if not t:
        return None
    ilk = t.split()[0].strip(".,!:;")
    # Telegram komutlari «/» ile baslar ve GRUPLARDA bot adini ekler:
    # «/durum@altay_hkm_bot». Bunu tanimamak, grupta hicbir komutun
    # calismamasi demekti.
    ilk = ilk.lstrip("/")
    if "@" in ilk:
        ilk = ilk.split("@", 1)[0]
    for c in COMMANDS:
        if ilk in c["words"]:
            return c["id"]
    return None


def understand(text):
    """(niyet, ayrinti). Once kesin komut, sonra serbest cumle.

    Serbest cumle yalnizca EMIN OLUNDUGUNDA bir komuta baglanir; emin
    olunmadiginda niyet None doner ve Patron sorar — tahmin etmez."""
    kesin = parse(text)
    if kesin:
        # DIKKAT — «kabul etmiyorum» cumlesinin ILK KELIMESI «kabul»dur.
        # Kesin eslesme tek basina birakilsaydi, bu cumle bir ONAY olarak
        # islenirdi: bu katmanin yapabilecegi en kotu sey. Olumsuzluk varsa
        # onay tahmin EDILMEZ, sorulur.
        if kesin == "kabul" and dil.olumsuz(text):
            return None, {"mode": "komut", "tie": ["kabul", "ret"],
                          "reason": "olumsuzluk var, onay sayilmaz"}
        return kesin, {"mode": "komut"}
    niyet, ayrinti = dil.parse(text)
    ayrinti["mode"] = "cumle"
    return niyet, ayrinti


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
    # Seviye gunluk mesaja da girer: kademe yalniz panonun *Sistemler*
    # sayfasinda gorunuyordu ve gune bakan kisi panoya hic bakmayabilir.
    # Bir GOZLEM satiridir; onerinin ONUNDE durmaz, ardinda durur.
    seviye = [l for l in b["lines"] if l["kind"] == "level"]
    if seviye:
        parca.append(seviye[0]["text"])
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


def respond(con, text, date=None, th=None, channel="local", now=None,
            agent="king", kayit=True):
    """Gelen kisa komuta cevap. Anlasilmayan mesaj YORUMLANMAZ.

    `kayit=False`: konusmayi ambara YAZMA. Ust katman (core/sohbet.py)
    kendi yazdiginda burasi da yazarsa, ayni cumle akista IKI KEZ gorunur
    — ve hangisinin gercek oldugu belirsiz olur."""
    date = date or datetime.date.today().isoformat()
    now = now or datetime.datetime.now().isoformat(timespec="seconds")
    komut, ayrinti = understand(text)
    if kayit:
        log(con, channel, "user", text, now, agent=agent)

    # Bir SORU degil bir RAPOR olabilir: «bugun 2 saat matematik calistim,
    # 7 saat uyudum». Aksam yoklamasinin cevabi budur. HKM kaydi YAZMAZ ve
    # sayisini OKUMAZ: her parca ilgili modulun kuyruguna teklif olur, modul
    # kendi ayristiricisiyla okur ve onayla yazar.
    if komut is None:
        bildirim = dil.rapor(text) or dil.kisa_kayit(text)
        if bildirim:
            cevap = _kirp(_kayit_kur(con, bildirim, date, now))
            if kayit:
                log(con, channel, "manager", cevap, now, agent=agent)
            return {"command": "kayit", "text": cevap, "date": date}

    # Bir SORU degil bir ISTEK olabilir: «yarin iki saat matematik».
    # HKM bunu modullere YAZMAZ; bir niyet kuyruga birakir ve modul
    # acilista sorar. Yazan yine moduldur.
    if komut is None:
        talep = dil.istek(text, date)
        if talep:
            cevap = _niyet_kur(con, talep, text)
            cevap = _kirp(cevap)
            if kayit:
                log(con, channel, "manager", cevap, now, agent=agent)
            return {"command": "istek", "text": cevap, "date": date}

    if komut is None:
        adaylar = (ayrinti or {}).get("tie") or (ayrinti or {}).get("candidates") or []
        if adaylar:
            # Emin degilsek SORARIZ. Bir kelimelik maliyet, yanlis
            # anlasilmis bir onaydan ucuzdur.
            cevap = ("Emin olamadım: " + " ya da ".join("«%s»" % a for a in adaylar[:2])
                     + " mi demek istedin? Tek kelimeyle yazarsan uygularım.")
        else:
            cevap = ("Anlamadım. Şunları yapabilirim: "
                     + ", ".join("«%s»" % c["id"] for c in COMMANDS)
                     + ". Serbest cümle de yazabilirsin; anlamadığımda "
                       "anlamış gibi yapmam.")
    elif komut == "basla":
        # Karsilama: ne oldugunu, ne YAPMADIGINI ve nasil konusulacagini
        # bir arada soyler. Bos bir «merhaba», botun ne ise yaradigini
        # kullaniciya arattirir.
        cevap = ("Ben HKM'yim — AYS, SPİ ve ESP'nin özetini tek yerde "
                 "tutarım.\n"
                 "Karar üretmem, karar taşırım: her öneri senin onayını "
                 "bekler ve sen onaylamadan hiçbir şey değişmez.\n\n"
                 "Şunları yazabilirsin:\n"
                 + "\n".join("• %s — %s" % (c["id"], c["note"])
                             for c in COMMANDS if c["id"] != "basla")
                 + "\n\n«yarın 2 saat matematik» gibi bir cümle yazarsan "
                   "ilgili sisteme teklif bırakırım. «bugün 2 saat matematik "
                   "çalıştım, 7 saat uyudum» gibi yaptığını yazarsan kaydını "
                   "ilgili modüle teklif ederim; kısaca «su 2, uyku 7, soru 40» "
                   "de olur.")
    elif komut == "yardim":
        cevap = "\n".join("«%s» — %s" % (c["id"], c["note"])
                          for c in COMMANDS)
    elif komut == "durum":
        # Zaman bir niyet degil bir parametredir: «dun» dendiyse dunun
        # brifingi gider, bugunun degil.
        hedef = dil.cozum_tarihi(date, ayrinti) if ayrinti.get("mode") == "cumle" \
            else date
        m = daily_message(con, hedef, th=th)
        cevap = m["text"] if m["ok"] else m["error"]
    elif komut == "capraz":
        bulgu = cross.findings(con, date)
        if not bulgu:
            cevap = ("Görünür bir çapraz ayrışma yok. Bu «ilişki yok» demek "
                     "değildir: ölçülen günlerde fark, ölçünün genişliğinin "
                     "altında kaldı ya da eşleşmiş gün sayısı yetmedi.")
        else:
            cevap = "\n".join("• " + b["note"] for b in bulgu[:2])
    elif komut == "seri":
        bulgular = streak.findings(con, date, th=th)
        if not bulgular:
            cevap = ("Üst üste süren bir eşik kırığı görünmüyor. Ölçülmeyen "
                     "gün «iyiydi» demek değildir.")
        else:
            cevap = "\n".join("• " + b["note"] for b in bulgular[:3])
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

    if manager.imperatives(cevap):
        cevap = ("Cevap buyurgan kip taşıdığı için düşürüldü. Bu bir yazılım "
                 "hatasıdır ve sessizce düzeltilmez.")
    if kayit:
        log(con, channel, "manager", cevap, now, agent=agent)
    return {"command": komut, "text": cevap, "date": date}


def _niyet_kur(con, talep, ham):
    """Istegi bir niyete cevirir. Alan bilinmiyorsa SORAR, uydurmaz."""
    alan = talep.get("field")
    if not alan:
        return ("Hangi alanda olduğunu yazmadın; hangi modülün üstleneceğini "
                "tahmin etmem. «yarın 2 saat matematik» gibi alanı da yazarsan "
                "teklifi kuyruğa bırakırım.")
    modul, alan_adi = ALAN_MODUL[alan]
    govde = {"date": talep["date"], "minutes": talep["minutes"], alan_adi: alan}
    not_ = ("%s için %d dakika %s teklifi — HKM'den geldi."
            % (talep["date"], talep["minutes"], alan))
    r = intents.create(con, modul, "plan.add", govde, not_, source="patron")
    if not r.get("ok"):
        return "Teklif kurulamadı: " + "; ".join(r.get("errors") or [])
    if r.get("duplicate"):
        return ("Aynı teklif zaten kuyrukta duruyor (%s, %d dakika). Tekrar "
                "yazmam: tekrar bilgi değil gürültüdür."
                % (talep["date"], talep["minutes"]))
    return ("Teklif %s kuyruğuna bırakıldı: %s, %d dakika %s. %s açıldığında "
            "bunu sana gösterecek ve onaylarsan KENDİ planına yazacak — "
            "HKM senin adına hiçbir yere yazmaz."
            % (modul.upper(), talep["date"], talep["minutes"], alan,
               modul.upper()))


MODUL_AD = {"ays": "AYS", "spi": "SPİ", "esp": "ESP"}

# Aksam yoklamasi (core/schedule.py `checkin`) gece yarisindan sonra
# cevaplanabilir. Gun SOYLENMEMISSE ve dunun yoklamasi sorulmussa, cevap
# DUNUN kaydidir: 00:30'da «2 saat calistim» diyen, biten gunu anlatir.
YOKLAMA_GECE_SAATI = 4


def _yoklama_soruldu_mu(con, gun):
    return bool(con.execute(
        "SELECT 1 FROM outbox WHERE kind='checkin' AND day=? LIMIT 1",
        (gun,)).fetchone())


def rapor_tarihi(con, date, now, offset):
    """Kaydin gunu: soylendiyse o gun; soylenmediyse bugun — gece 04:00'e
    kadar ve dunun yoklamasi sorulmussa dun. Ileri tarih yoktur."""
    gun = datetime.date.fromisoformat(date)
    if offset is not None:
        return (gun - datetime.timedelta(days=max(0, int(offset)))).isoformat()
    try:
        an = datetime.datetime.fromisoformat(str(now))
    except (TypeError, ValueError):
        an = None
    dun = (gun - datetime.timedelta(days=1)).isoformat()
    if an is not None and an.date() == gun and an.hour < YOKLAMA_GECE_SAATI \
            and _yoklama_soruldu_mu(con, dun):
        return dun
    return date


def _kayit_kur(con, bildirim, date, now):
    """Raporu modul kuyruklarina TEKLIF olarak birakir; cumleyi kod kurar.

    Sayi okunmaz ve yazilmaz: modul okur, gosterir, onayla yazar. Miktari
    ya da modulu anlasilmayan parca TAHMIN EDILMEZ, kullaniciya sorulur."""
    gun = rapor_tarihi(con, date, now, bildirim.get("offset"))
    birakilan, tekrar, hata = [], [], []
    for p in bildirim.get("parcalar") or []:
        metin = p["metin"][:400]
        r = intents.create(con, p["modul"], "kayit.add",
                           {"date": gun, "metin": metin}, "", source="patron")
        ad = MODUL_AD.get(p["modul"], p["modul"].upper())
        if not r.get("ok"):
            hata.append("%s: %s" % (ad, "; ".join(r.get("errors") or [])))
        elif r.get("duplicate"):
            tekrar.append(ad)
        else:
            birakilan.append("%s («%s»)" % (ad, metin))
    parca = []
    if birakilan:
        parca.append("%s günü için kaydını teklif olarak bıraktım: %s."
                     % (gun, ", ".join(birakilan)))
        parca.append("Modül açıldığında neyi nasıl okuduğunu gösterecek; "
                     "onaylarsan KENDİ koduyla yazacak. HKM senin adına "
                     "hiçbir yere yazmaz.")
    if tekrar:
        parca.append("%s için aynı kayıt zaten kuyrukta; ikinci kez "
                     "bırakmadım." % ", ".join(tekrar))
    for m in bildirim.get("miktarsiz") or []:
        parca.append("«%s» — ne kadar olduğunu yazmadın; «2 saat», «40 soru» "
                     "gibi miktarı da yazarsan teklif bırakırım." % m)
    for m in bildirim.get("belirsiz") or []:
        parca.append("«%s» — hangi modülün kaydı olduğunu anlamadım. Başına "
                     "«AYS», «SPİ» ya da «ESP» yazarsan oraya bırakırım." % m)
    for h in hata:
        parca.append("Teklif kurulamadı — " + h)
    return "\n".join(parca) or "Kayda geçecek bir şey bulamadım."


def log(con, channel, role, text, now=None, agent="king"):
    """Konusma kaydi. Ham ses saklanmaz: audio_retained varsayilani 0.

    `agent`: hangi gorevliyle konusuldugu. Tek bir akis, dort ayri
    gorevlinin sozlerini birbirine karistirirdi."""
    now = now or datetime.datetime.now().isoformat(timespec="seconds")
    con.execute(
        "INSERT INTO conversations(channel, role, text, audio_retained,"
        " created_at, agent) VALUES (?,?,?,0,?,?)",
        (channel, role, str(text or ""), now, agent or "king"))
    con.commit()


def history(con, limit=40, channel=None, agent=None):
    """Konusma gecmisi. `agent` verilirse YALNIZ o gorevlinin akisi.

    Gorevli sutunu sonradan eklendi: eski satirlarda bos olabilir ve
    onlar King'in akisi sayilir — gecmisi silmek yerine yorumlamak, olmus
    bir konusmayi yok saymamaktir."""
    q = "SELECT * FROM conversations"
    kosul, args = [], []
    if channel:
        kosul.append("channel=?")
        args.append(channel)
    if agent:
        if agent == "king":
            kosul.append("(agent=? OR agent IS NULL OR agent='')")
        else:
            kosul.append("agent=?")
        args.append(agent)
    if kosul:
        q += " WHERE " + " AND ".join(kosul)
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
