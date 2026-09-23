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

from core import ai, butce, cross, dil, manager, memory, models, motto, patron, streak

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

# Kat zinciri — modullerle ayni (brand/ortak/ofis.js): King > modul
# Patronu > uzman. King modullere YAZMAZ, teklif birakir; moduller King
# kapaliyken de calisir (AGENTS.md §1.4).
KONUM = {
    "king": ("Sen baş patronsun. AYS, SPİ ve ESP'nin Patronları senin altındadır; "
             "her birinin kendi uzman kadrosu vardır. Modüllere yazamazsın, "
             "teklif bırakırsın; onlar sen kapalıyken de çalışır. Senin işin "
             "modüller arasındaki bağı görmek: birinin yükü ötekini nasıl etkiliyor."),
    "bio": ("King'e bağlısın. Alanın SPİ'nin verisidir; SPİ'nin kendi Patronu ve "
            "uzmanları vardır, onların yerine karar vermezsin. Teşhis koymaz, "
            "ilaç ya da doz önermezsin."),
    "academic": ("King'e bağlısın. Alanın AYS'nin verisidir; AYS'nin kendi Patronu "
                 "ve uzmanları vardır, onların yerine karar vermezsin. Sonuç "
                 "garantisi vermezsin."),
    "intellect": ("King'e bağlısın. Alanın ESP'nin verisidir; ESP'nin kendi Patronu "
                  "ve uzmanları vardır, onların yerine karar vermezsin. Sertifika "
                  "ya da yetenek yargısı vermezsin."),
}

SISTEM_METNI = """Sen HKM'nin %(ad)s görevlisisin. %(is)s
%(konum)s

Kesin kurallar:
- ÖLÇÜM UYDURMA. Kullanıcının uykusu, soru sayısı, neti, kalıcılığı gibi
  ÖLÇÜLEN bir şey hakkında sayı söyleyeceksen, o sayı aşağıdaki listede
  GEÇMELİ. Listede olmayan bir ölçümü «şu kadardı» diye sunma; «bu
  ölçülmedi» demek bir başarısızlık değildir, uydurmak öyledir.
- ÖNERDİĞİN sayılar serbesttir. «25 dakikalık bir blok», «saat 22:00'den
  sonra», «yarın iki oturum» diyebilirsin: bunlar geçmiş hakkında bir
  iddia değil, senin teklifindir. Yeter ki olmuş bitmiş bir ölçüm gibi
  sunma.
- Emir kipi kullanma. Öneri kur: «…önerebilirim», «…istersen».
- Kısa yaz: en fazla 5 cümle. Kullanıcı Türkçe konuşuyor, sen de Türkçe yaz.
- Sen bir şey uygulayamazsın. Kullanıcı bir değişiklik isterse, bunun bir
  TEKLİF olarak bırakılacağını ve onun onayıyla uygulanacağını söyle.
- Selamlaşma, soru sorma, konuşma serbesttir: her cevabın ölçüm raporu
  olmak zorunda değil.

Bugünün ölçümleri:
%(baglam)s"""


def sistem_metni(gorevli, bg):
    g = GOREVLILER[gorevli]
    return SISTEM_METNI % {"ad": g["ad"], "is": g["is"], "konum": KONUM[gorevli],
                           "baglam": bg}


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
    if gorevli == "king":
        # Hayat Mottosu: YALNIZ one cikarilan kayitlar (core/motto.py).
        hm = motto.king_baglami(con)
        if hm:
            satir.append("Kullanıcının kendi ilkeleri (senin sözün; dikkate al, "
                         "değiştirme, kırmızı çizgiyi çiğneyen öneri yapma):")
            satir.append(hm)
    return "\n".join(satir)


# Model konusamadiginda kullaniciya ne yazilacagi. Sebep SOYLENIR ve
# yapilacak is ayni cumlede durur; «bir sey olmadi» gibi durmak, sistemi
# bozuk sanmaya yol acar.
YEDEK_METIN = {
    "budget": "Aylık bütçe sınırına gelindiği için model çağrısı "
              "yapılmadı. Kural motoru çalışmaya devam ediyor; istersen "
              "«durum» yaz.",
    "provider": "Sağlayıcıya ulaşılamadı, bu yüzden serbest cümleyle "
                "cevap veremiyorum. Ayarlar → Yapay zekâ'daki «Sohbeti "
                "dene» bunun sebebini yazar. Bu arada «durum» komutu "
                "çalışıyor.",
    "dropped": "Model iki denemede de dayanağı olmayan bir ölçüm "
               "söyledi; bu yüzden cevabını göstermiyorum. Uydurulmuş "
               "bir ölçüm, ölçüm olmayan bir şeyi ölçüm gibi gösterir. "
               "Ölçülen şeyler için «durum» yaz.",
    "key-missing": "Bu kademeye seçilen anahtar artık yok. Ayarlar → "
                   "Yapay zekâ'dan yeniden seç.",
}


def _yedek_metin(r, yedek):
    """Model konusamadiginda donecek SOHBET cevabi.

    Kullanici bir komut yazmissa kural motorunun cevabi zaten dogru
    cevaptir. Komut YAZMAMISSA komut tahmini donmek, soruyu cevapsiz
    birakip ustune yanlis bir sey sormaktir."""
    # Komut tanindiysa (ya da bir teklif birakildiysa) kural motorunun
    # cevabi ZATEN dogru cevaptir; taninmadiysa `command` None gelir.
    if yedek.get("command"):
        return yedek["text"]
    return YEDEK_METIN.get(r.get("reason"),
                           "Şu an serbest cümleyle cevap veremiyorum.")


def konus(con, cfg, metin, date, gorevli="king", gecmis=None, th=None,
          user="ben", transport=None, kayit=True, kanal="local"):
    """Bir mesaja cevap. Once komut, sonra model, sonra durust bir «yok».

    Doner: {"mode": komut|model|yok, "text": ..., ...}
    """
    if gorevli not in GOREVLILER:
        return {"ok": False, "mode": "yok", "text": None,
                "note": "Bilinmeyen görevli."}

    hafiza_komutu = memory.command(con, metin, user=user)
    if hafiza_komutu:
        if kayit:
            patron.log(con, kanal, "user", metin, agent=gorevli)
            patron.log(con, kanal, "manager", hafiza_komutu["text"], agent=gorevli)
        return {"ok": True, "mode": "memory", "command": "memory",
                "text": hafiza_komutu["text"], "agent": gorevli}

    # 1 — ONCE KOMUT. Ucretsiz, kesin ve her zaman ayni olan yol.
    komut = patron.parse(metin)

    # 1b — SONRA ISTEK. «Yarin iki saat matematik» bir sohbet degil, bir
    # ISTEKTIR: ilgili modulun kuyruguna TEKLIF birakir ve modul kendi
    # koduyla uygular.
    #
    # Bu adim bir sure ATLANIYORDU ve sonucu sessiz bir kayipti: model
    # baglanmadan once bu cumle teklif uretiyor, model baglandiktan
    # sonra ayni cumleye yalnizca guzel bir laf donuyordu. Model
    # baglamak, sistemi DAHA AZ is yapar hale getirmisti.
    #
    # Eylem, ifadenin onunde gelir: bir teklif onay zincirinden gecer ve
    # is yapar; bir paragraf yalnizca soyler. dil.istek ihtiyatlidir —
    # gun ve sure birlikte gecmiyorsa None doner — bu yuzden olagan
    # sohbeti kacirmaz.
    istek = None if komut else dil.istek(metin, date)

    if (komut or istek) and gorevli == "king":
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
    hb = memory.context(con, user=user, scope=gorevli)
    if hb:
        bg += ("\nKullanıcı hakkında hatırlananlar (etiketiyle; «tahmin» kesin "
               "değildir, «senin sözün» kullanıcının kendi cümlesidir; hafızaya "
               "sen yazamazsın):\n" + hb)
    sistem = sistem_metni(gorevli, bg)
    mesajlar = list(gecmis or []) + [{"role": "user", "content": metin}]

    r = ai.ask(con, cfg, rol, "sohbet", mesajlar, baglam=bg, sistem=sistem,
               user=user, transport=transport)
    if not r["ok"]:
        # Model konusamadiysa kural motoru devrede kalir: sohbet
        # bozulabilir, sistem bozulmaz.
        #
        # Ama YEDEK CEVAP SOHBET BICIMINDE olmali. Once burada
        # patron.respond'un komut tahmini donuyordu: kullanici «uykum
        # nasil?» diye soruyor, karsisina «Emin olamadim: durum mu demek
        # istedin?» cikiyordu. Model konusamadiysa soylenecek sey
        # budur — komut tahmini degil.
        yedek = patron.respond(con, metin, date=date, th=th, channel=kanal,
                               agent=gorevli, kayit=False)
        govde = _yedek_metin(r, yedek)
        if kayit:
            patron.log(con, kanal, "user", metin, agent=gorevli)
            patron.log(con, kanal, "manager", govde, agent=gorevli)
        return {"ok": True, "mode": "komut", "command": yedek["command"],
                "text": govde, "agent": gorevli,
                "ai": {"ok": False, "reason": r.get("reason"),
                       "note": r.get("note")}}
    govde = r["text"]
    if r.get("truncated"):
        # Telegram'da yan not yeri yoktur: metnin KENDISI soyler.
        # Kisaltilmis bir cevabi tam gibi sunmak, kullaniciya eksik
        # oldugunu fark ettirmeden eksik bilgi vermektir.
        govde += "\n\n(Cevap uzunluk sınırına takıldı, son tam cümlede "
        govde += "kesildi. Daha dar bir soru sorarsan tamamını yazabilirim.)"
    if kayit:
        patron.log(con, kanal, "user", metin, agent=gorevli)
        patron.log(con, kanal, "manager", govde, agent=gorevli)
    return {"ok": True, "mode": "model", "text": govde, "agent": gorevli,
            "truncated": bool(r.get("truncated")),
            "model": r["model"], "usd": r["usd"], "seconds": r["seconds"],
            "price_estimated": r.get("price_estimated", False),
            "context_lines": len(bg.splitlines())}

def tani(con, cfg, date, gorevli="king", th=None, transport=None):
    """Sohbet zincirini BASTAN SONA dener ve nerede koptugunu soyler.

    «API girdim ama calismiyor» cumlesinin tek cevabi, zinciri gercekten
    kosturup hangi halkanin koptugunu GOSTERMEKTIR. Her adim ayri ayri
    isaretlenir; gecen adimlar da yazilir, cunku «nerede calisiyor»
    bilgisi «nerede bozuk» kadar is gorur.

    Gercek bir cagri yapar: para harcar (cok az) ve deftere yazilir.
    Sinamak, sinanmamis bir seye «calisiyor» demekten ucuzdur."""
    if gorevli not in GOREVLILER:
        return {"ok": False, "adimlar": [], "note": "Bilinmeyen görevli."}
    rol = GOREVLILER[gorevli]["role"]
    adim = []

    def ekle(ad, ok, not_="", uyari=False):
        """Üçüncü bir hal var: ZINCIR CALISIYOR ama soylenecek bir sey
        var. Bunu «kopuk» diye gostermek, calisan bir seye bozuk demek
        olurdu; hic gostermemek ise bilinmeyeni bilinir sanmak."""
        adim.append({"ad": ad, "ok": bool(ok), "note": not_,
                     "warn": bool(uyari)})

    a = models.resolve(cfg, rol) or {}
    ekle("Model ataması", bool(a.get("provider")),
         ("%s · %s%s" % (a.get("provider_label") or "", a.get("model") or "—",
                         " (King'den miras)" if a.get("inherited") else ""))
         if a.get("provider") else
         "Bu kademeye model atanmamış. Ayarlar → Yapay zekâ → Görev dağılımı.")
    if not a.get("provider"):
        return {"ok": False, "adimlar": adim, "agent": gorevli}

    ekle("Model adı", bool(a.get("model")),
         a.get("model") or "Sağlayıcı seçilmiş ama model adı yazılmamış.")
    if a.get("key_missing"):
        ekle("Anahtar", False, "Seçilen anahtar silinmiş; yeniden seç.")
        return {"ok": False, "adimlar": adim, "agent": gorevli}
    ekle("Anahtar", bool(a.get("key_set")),
         ("«%s» (%s)" % (a.get("key_label") or "anahtar",
                         a.get("key_user") or "ben"))
         if a.get("key_set") else
         "%s için anahtar girilmemiş." % (a.get("provider_label") or ""))
    if not (a.get("model") and a.get("key_set")):
        return {"ok": False, "adimlar": adim, "agent": gorevli}

    izin = butce.guard(con, cfg)
    ekle("Bütçe", izin["ok"], izin.get("note") or "Sınır içinde.")
    if not izin["ok"]:
        return {"ok": False, "adimlar": adim, "agent": gorevli}

    bg = baglam(con, date, gorevli, th=th)
    ekle("Kural motoru bağlamı", bool(bg.strip()),
         "%d satır ölçüme dayanıyor" % len(bg.splitlines()))

    sistem = sistem_metni(gorevli, bg)
    r = ai.ask(con, cfg, rol, "tani",
               [{"role": "user", "content": "Tek cümleyle merhaba de."}],
               baglam=bg, sistem=sistem, transport=transport)

    if r.get("reason") == "provider":
        # Saglayicinin KENDI cumlesi burada durur: «HTTP 404» degil,
        # «model not found: ...» — yanlis yazilmis bir model adini
        # ancak bu satir gosterir.
        ekle("Sağlayıcıya çağrı", False, r.get("note") or "Başarısız.")
        return {"ok": False, "adimlar": adim, "agent": gorevli}
    ekle("Sağlayıcıya çağrı", True,
         "Cevap alındı (%s sn)" % r.get("seconds", "?"))

    if r.get("reason") == "dropped":
        ekle("Cevabın denetimi", False, r.get("note") or "Cevap düşürüldü.")
        return {"ok": False, "adimlar": adim, "agent": gorevli}
    ekle("Cevabın denetimi", bool(r.get("ok")),
         "Sınırlardan geçti." if r.get("ok") else (r.get("note") or ""))

    if r.get("price_estimated"):
        # Tahmin, olcumun yerine SESSIZCE gecmemeli: yuksek bir tahmin
        # tavani erken doldurur ve sohbetin neden durdugu anlasilmaz.
        # Ama bu bir KOPMA degildir — sohbet calisiyor.
        ekle("Model tarifesi", True, uyari=True, not_=
             "«%s» için fiyat tarifesi elimizde yok; harcama TAHMİNİ bir "
             "tabanla yazılıyor (1.00/5.00 USD · 1M jeton). Gerçek fiyat "
             "daha düşükse tavan erken dolar." % (r.get("model") or ""))

    return {"ok": bool(r.get("ok")), "adimlar": adim, "agent": gorevli,
            "text": r.get("text"), "model": r.get("model"),
            "usd": r.get("usd"), "seconds": r.get("seconds")}
