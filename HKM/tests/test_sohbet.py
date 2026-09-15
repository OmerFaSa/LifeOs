# -*- coding: utf-8 -*-
"""Sohbet ve model çağrısı.

Bu paket bir ozelligi degil bir SOZU korur: model otorite degildir.
Ag'a CIKILMAZ — saglayicinin cevabi enjekte edilir.
"""

from core import ai, butce, db, models, sohbet, sync_engine
from tests.harness import eq, metric, no, ok, suite, test

BUGUN = "2026-09-14"


def _con():
    con = db.connect(":memory:")
    sync_engine.ingest(con, {"module": "spi", "date": BUGUN,
                             "metrics": {"sleep_hours": metric(4.0),
                                         "recovery": metric(30, "computed")}},
                       now=BUGUN + "T09:00:00")
    sync_engine.ingest(con, {"module": "ays", "date": BUGUN,
                             "metrics": {"questions": metric(40),
                                         "study_minutes": metric(70)}},
                       now=BUGUN + "T09:00:00")
    return con


def _cfg(model="gemini-2.5-flash", rol="king", **ek):
    cfg = {"local_token": "x",
           "budget": {"monthly_try": 850.0, "usd_try": 48.6,
                      "rate_date": BUGUN, "ceiling_currency": "try"}}
    cfg.update(ek)
    cfg = models.apply(cfg, {"keys": {"google": "AIza-test"},
                             "assignments": {rol: {"provider": "google",
                                                   "model": model}}})
    return cfg


def _cevap(metin, gir=500, cik=80):
    def t(provider, anahtar, model, sistem, mesajlar):
        t.gorulen = {"provider": provider, "model": model, "sistem": sistem,
                     "mesajlar": mesajlar}
        return metin, gir, cik
    t.gorulen = None
    return t


def run():
    suite("sohbet")

    def t_command_first():
        """Kullanici «durum» yazdiysa kural motoru cevap verir; modele
        GITMEZ. Ucretsiz, kesin ve her zaman ayni olan yol once denenir."""
        con = _con()
        tasiyici = _cevap("modelden cevap")
        r = sohbet.konus(con, _cfg(), "durum", BUGUN, transport=tasiyici)
        eq(r["mode"], "komut")
        eq(r["command"], "durum")
        no(tasiyici.gorulen, "komut oldugu halde model cagrildi")
    test("once komut, sonra model", t_command_first)

    def t_no_model_still_answers():
        """«Yapay zeka yok» ile «sistem bozuk» ayri seylerdir."""
        con = _con()
        r = sohbet.konus(con, {"local_token": "x"},
                         "bugün odaklanamadım, programı hafifletelim mi?",
                         BUGUN)
        ok(r["ok"])
        eq(r["mode"], "komut")            # kural motoru devrede
        eq(r["ai"]["reason"], "no-model")
        ok("Ayarlar" in r["ai"]["note"])  # ne yapilacagi yazili
    test("model yoksa sistem calismaya devam eder", t_no_model_still_answers)

    def t_model_answers_free_sentence():
        con = _con()
        tasiyici = _cevap("Uyku ölçümün bugün düşük görünüyor; istersen "
                          "yarına hafif bir program önerebilirim.")
        r = sohbet.konus(con, _cfg(), "bugün odaklanamadım", BUGUN,
                         transport=tasiyici)
        ok(r["ok"])
        eq(r["mode"], "model")
        ok("hafif" in r["text"])
        # Modelin gordugu TEK gercek: kural motorunun urettigi olculer.
        sistem = tasiyici.gorulen["sistem"]
        ok("Bugünün ölçümleri" in sistem)
        ok("4.0" in sistem or "4" in sistem)
        # Model YALNIZ bu baglami gorur: ham veri gonderilmez.
        no("raw_events" in sistem)
    test("serbest cumleye model cevap verir", t_model_answers_free_sentence)

    def t_invented_number_is_dropped():
        """Modelin uydurdugu bir olcum, olcum olmayan bir seyi olcum gibi
        gosterir. Cevapta gecip baglamda gecmeyen sayi DUSURULUR."""
        con = _con()
        tasiyici = _cevap("Uyku ortalaman 7.83 saat, gayet iyi gidiyorsun.")
        r = sohbet.konus(con, _cfg(), "uykum nasıl?", BUGUN,
                         transport=tasiyici)
        # Dusurulen cevap YUTULMAZ: kural motoru devreye girer ve sebep
        # yazilir.
        eq(r["mode"], "komut")
        ok("dayanağı olmayan" in r["ai"]["note"])
        ok("7.83" in r["ai"]["note"])
    test("uydurulmus sayi dusurulur", t_invented_number_is_dropped)

    def t_imperative_is_dropped():
        """HKM'nin isletim sistemi seviyesinde boyle bir yetkisi yoktur ve
        dili de tasiyamaz."""
        con = _con()
        tasiyici = _cevap("Bugün çalışmayı bırak ve hemen uyu.")
        r = sohbet.konus(con, _cfg(), "ne yapayım?", BUGUN,
                         transport=tasiyici)
        eq(r["mode"], "komut")
        ok("buyurgan" in r["ai"]["note"])
    test("buyurgan kip dusurulur", t_imperative_is_dropped)

    def t_every_call_is_recorded():
        """Para, cevap alinmadan da harcanmis olabilir."""
        con = _con()
        cfg = _cfg()
        sohbet.konus(con, cfg, "bugün nasıl?", BUGUN,
                     transport=_cevap("Bugün ölçümler düşük görünüyor."))

        def patla(*a):
            raise OSError("ag yok")
        sohbet.konus(con, cfg, "peki ya yarın?", BUGUN, transport=patla)
        satir = con.execute("SELECT ok, task, role FROM usage").fetchall()
        eq(len(satir), 2)
        eq(sorted(r["ok"] for r in satir), [0, 1])
        eq(satir[0]["task"], "sohbet")
        eq(satir[0]["role"], "king")
        d = butce.month(con, cfg, BUGUN)
        ok(d["spent_try"] > 0)
    test("her cagri deftere yazilir", t_every_call_is_recorded)

    def t_budget_stops_paid_call():
        """Sinira varilmissa ucretli cagri YAPILMAZ ve bu soylenir."""
        con = _con()
        cfg = _cfg()
        cfg["budget"]["monthly_try"] = 0.01
        butce.record(con, role="king", task="sohbet", provider="google",
                     model="m", usd=1.0, rate=48.6)
        tasiyici = _cevap("cevap")
        r = sohbet.konus(con, cfg, "bugün nasıl?", BUGUN, transport=tasiyici)
        eq(r["mode"], "komut")
        eq(r["ai"]["reason"], "budget")
        no(tasiyici.gorulen, "butce bittigi halde model cagrildi")
    test("butce bitince ucretli cagri yapilmaz", t_budget_stops_paid_call)

    def t_agents_see_only_their_field():
        """Uc alt patron YALNIZ kendi alanina bakar: baglami da o
        kadardir."""
        con = _con()
        bio = sohbet.baglam(con, BUGUN, "bio")
        aka = sohbet.baglam(con, BUGUN, "academic")
        ok("SPİ" in bio)
        no("AYS" in bio.replace("Tarih", ""))
        ok("AYS" in aka)
        # King HEPSINI gorur: modul arasi iliskiyi ancak boyle kurar.
        king = sohbet.baglam(con, BUGUN, "king")
        ok("SPİ" in king and "AYS" in king)
        ok(len(king) > len(bio))
    test("alt patron kendi alanini gorur", t_agents_see_only_their_field)

    def t_sub_agent_inherits_king():
        """Alt patrona ayri atama yapilmamissa King'in modelini MIRAS
        alir: ayri ayri dort atama zorunlu olsaydi, kullanici uc kademeyi
        bos birakip «neden calismiyor» diye sorardi."""
        con = _con()
        tasiyici = _cevap("Uyku ölçümün düşük görünüyor.")
        r = sohbet.konus(con, _cfg(rol="king"), "uykum nasıl?", BUGUN,
                         gorevli="bio", transport=tasiyici)
        ok(r["ok"])
        eq(r["mode"], "model")
        eq(r["agent"], "bio")
        # Kendi alanini gorur, King'in agzindan konusmaz.
        ok("Biyolojik sermaye" in tasiyici.gorulen["sistem"])
    test("alt patron King'in modelini miras alir", t_sub_agent_inherits_king)

    def t_sub_agent_without_any_model_says_so():
        """Hicbir atama yoksa alt patron KONUSMAZ ve sebebini soyler —
        baskasinin agzindan konusmak, kimin konustugunu belirsiz yapar."""
        con = _con()
        r = sohbet.konus(con, {"local_token": "x"}, "uykum nasıl?", BUGUN,
                         gorevli="bio")
        no(r["ok"])
        eq(r["mode"], "yok")
        ok("Ayarlar" in r["note"])
    test("atamasiz alt patron baskasi gibi konusmaz",
         t_sub_agent_without_any_model_says_so)

    def t_history_is_separate():
        con = _con()
        from core import patron
        patron.log(con, "local", "user", "king sorusu", agent="king")
        patron.log(con, "local", "user", "spi sorusu", agent="bio")
        eq([m["text"] for m in patron.history(con, agent="king")],
           ["king sorusu"])
        eq([m["text"] for m in patron.history(con, agent="bio")],
           ["spi sorusu"])
        # Gorevli sutunu ONCE yoktu: eski satirlar King'in akisi sayilir.
        con.execute("INSERT INTO conversations(channel, role, text,"
                    " audio_retained, created_at) VALUES"
                    " ('local','user','eski satir',0,'2026-01-01T00:00:00')")
        con.commit()
        ok(any(m["text"] == "eski satir"
               for m in patron.history(con, agent="king")))
        no(any(m["text"] == "eski satir"
               for m in patron.history(con, agent="bio")))
    test("gorevlilerin gecmisi karismaz", t_history_is_separate)

    def t_unknown_model_is_not_free():
        """Bilinmeyen bir model icin 0 yazmak «bedava» demek olurdu."""
        ok(ai._fiyat("google", "bilinmeyen-model", 1000000, 0) > 0)
        eq(ai._fiyat("yerel", "her-neyse", 1000000, 1000000), 0.0)
        # Bilinen model, tarifesinden hesaplanir.
        eq(round(ai._fiyat("google", "gemini-2.5-flash", 1000000, 0), 2), 0.30)
    test("bilinmeyen model bedava sayilmaz", t_unknown_model_is_not_free)

    def t_spend_goes_to_the_key_owner():
        """Iki kisi ayni sistemi kullaniyorsa harcamalari da AYRI
        gorunmeli: cagri, kullanilan anahtarin SAHIBININ defterine
        yazilir. Tek bir «ben» satiri, ikisinin harcamasini birbirine
        karistirirdi."""
        con = _con()
        cfg = {"local_token": "x",
               "budget": {"monthly_try": 850.0, "usd_try": 48.6,
                          "rate_date": BUGUN}}
        cfg = models.apply(cfg, {"keys": {"google": [
            {"label": "Benim", "key": "AIza-ben", "user": "ben"},
            {"label": "Kardesim", "key": "AIza-kardes", "user": "kardes"}]}})
        kardes = models.key_list(cfg, "google")[1]["id"]
        cfg = models.apply(cfg, {"assignments": {"king": {
            "provider": "google", "model": "gemini-2.5-flash",
            "key": kardes}}})

        gorulen = {}

        def tasiyici(provider, anahtar, model, sistem, mesajlar):
            gorulen["anahtar"] = anahtar
            return "Bugün ölçümler düşük görünüyor.", 500, 60

        sohbet.konus(con, cfg, "bugün nasıl?", BUGUN, transport=tasiyici)
        # Cagri, SECILEN anahtarla gitti.
        eq(gorulen["anahtar"], "AIza-kardes")
        d = butce.month(con, cfg, BUGUN)
        eq(sorted(d["by_user"]), ["kardes"])
        ok(d["by_user"]["kardes"] > 0)
    test("harcama anahtarin sahibine yazilir", t_spend_goes_to_the_key_owner)

    def t_deleted_key_stops_the_call():
        """Secilen anahtar silinmisse BASKA bir anahtara gecilmez ve
        para harcanmaz; sebep soylenir."""
        con = _con()
        cfg = {"local_token": "x",
               "budget": {"monthly_try": 850.0, "usd_try": 48.6,
                          "rate_date": BUGUN}}
        cfg = models.apply(cfg, {"keys": {"google": [
            {"label": "Benim", "key": "AIza-ben", "user": "ben"},
            {"label": "Kardesim", "key": "AIza-kardes", "user": "kardes"}]}})
        liste = models.key_list(cfg, "google")
        cfg = models.apply(cfg, {"assignments": {"king": {
            "provider": "google", "model": "m", "key": liste[1]["id"]}}})
        # Kardesin anahtari silinir; benimki durur.
        cfg = models.apply(cfg, {"keys": {"google": [
            {"id": liste[0]["id"], "label": "Benim", "key": ""}]}})

        cagrildi = []

        def tasiyici(*a):
            cagrildi.append(1)
            return "cevap", 1, 1

        r = sohbet.konus(con, cfg, "bugün nasıl?", BUGUN, transport=tasiyici)
        eq(r["mode"], "komut")                    # kural motoru devrede
        eq(r["ai"]["reason"], "key-missing")
        no(cagrildi, "silinmis anahtarla cagri yapildi")
        eq(con.execute("SELECT COUNT(*) n FROM usage").fetchone()["n"], 0)
    test("silinmis anahtarla cagri yapilmaz", t_deleted_key_stops_the_call)

    def t_normal_conversation_is_not_dropped():
        """SAYI UYDURMAK ile SAYI SOYLEMEK ayri seylerdir.

        Bir sure her sayi suphe sayiliyordu: «45 dakikalik bir blok
        deneyebilirsin» ya da «saat 22:00'den sonra» diyen tamamen dogru
        cevaplar dusuruluyor, kullanici sohbet edemiyor ve yerine gunun
        brifingini aliyordu. Oysa orada uydurulmus bir olcum yok,
        ONERILEN bir sure var: bir oneri, gecmis hakkinda hicbir sey
        iddia etmez."""
        con = _con()
        cfg = _cfg()
        gecer = [
            "Bugün 45 dakikalık bir çalışma bloğu deneyebilirsin.",
            "Saat 22:00'den sonra ekranı azaltmayı önerebilirim.",
            "İstersen yarın 2 saatlik bir plan kuralım, 3 blok halinde.",
            "Merhaba! Bugün neye takıldın?",
            "İstersen 25 dakika çalış 5 dakika dinlen düzenini deneyebiliriz.",
        ]
        for cevap in gecer:
            r = sohbet.konus(con, cfg, "bugün odaklanamadım", BUGUN,
                             transport=_cevap(cevap))
            eq(r["mode"], "model", "dusurulen cevap: %s" % cevap)
            eq(r["text"], cevap)
    test("olagan sohbet dusurulmez", t_normal_conversation_is_not_dropped)

    def t_fabricated_measurement_still_dropped():
        """Sinir YUMUSAMADI: olcum gibi sunulan dayanaksiz sayi hala
        duser. Uydurulmus bir olcum, olcum olmayan bir seyi olcum gibi
        gosterir."""
        con = _con()
        cfg = _cfg()
        duser = [
            "Uyku ortalaman 7.83 saat, gayet iyi gidiyorsun.",
            "Uyku ortalaman 7.83 saat, istersen bunu artıralım.",
            "Son 30 günde ortalama 95 soru çözmüşsün.",
        ]
        for cevap in duser:
            r = sohbet.konus(con, cfg, "uykum nasıl?", BUGUN,
                             transport=_cevap(cevap))
            eq(r["mode"], "komut", "gecmemeliydi: %s" % cevap)
            ok("dayanağı olmayan" in r["ai"]["note"])
    test("uydurulmus olcum hala duser", t_fabricated_measurement_still_dropped)

    def t_one_correction_is_asked_for():
        """Dusen bir cevabin ardindan modele BIR KEZ ne yaptigi soylenir.

        Kullaniciya «cevap dusuruldu» deyip birakmak, sohbeti her ihlalde
        kesmek demekti; oysa ihlalin ne oldugunu modele soylemek cogu
        zaman yeter. Sinirsiz deneme ise sinirin kendisini kaldirmanin
        yavas bicimi olurdu — o yuzden TEK deneme."""
        con = _con()
        cfg = _cfg()
        cagri = []

        def duzelen(provider, anahtar, model, sistem, mesajlar):
            cagri.append(sistem)
            if len(cagri) == 1:
                return "Uyku ortalaman 7.83 saat.", 400, 60
            return "Uyku ölçümün düşük görünüyor.", 420, 50

        r = sohbet.konus(con, cfg, "uykum nasıl?", BUGUN, transport=duzelen)
        eq(r["mode"], "model")
        eq(r["text"], "Uyku ölçümün düşük görünüyor.")
        eq(len(cagri), 2)
        # Modele NEYIN yanlis oldugu soylendi.
        ok("7.83" in cagri[1])
        # Iki cagri da deftere yazildi: para, dusen cevap icin de harcandi.
        eq(con.execute("SELECT COUNT(*) n FROM usage").fetchone()["n"], 2)

        # Iki denemede de ihlal varsa UCUNCUSU YOK.
        cagri2 = []

        def inatci(provider, anahtar, model, sistem, mesajlar):
            cagri2.append(1)
            return "Uyku ortalaman 9.91 saat.", 400, 60

        r = sohbet.konus(con, cfg, "uykum nasıl?", BUGUN, transport=inatci)
        eq(len(cagri2), 2)
        eq(r["mode"], "komut")
    test("dusen cevap icin bir kez duzeltme istenir",
         t_one_correction_is_asked_for)

    def t_fallback_is_chat_shaped():
        """Model konusamadiginda donen sey KOMUT TAHMINI olmamali.

        Kullanici «uykum nasil?» diye soruyor, karsisina «Emin olamadim:
        durum mu demek istedin?» cikiyordu. Model konusamadiysa
        soylenecek sey budur — komut tahmini degil."""
        con = _con()
        cfg = _cfg()

        def patla(*a):
            raise OSError("ag yok")

        r = sohbet.konus(con, cfg, "uykum nasıl gidiyor?", BUGUN,
                         transport=patla)
        no("demek istedin" in (r["text"] or ""))
        ok("Sağlayıcıya ulaşılamadı" in r["text"])
        ok("durum" in r["text"])          # calisan yol ADIYLA sunulur

        # Ama GERCEK bir komut yazildiysa kural motorunun cevabi donmeli.
        r = sohbet.konus(con, cfg, "durum", BUGUN, transport=patla)
        eq(r["mode"], "komut")
        ok("HKM" in r["text"])
    test("model konusamayinca cevap sohbet bicimindedir",
         t_fallback_is_chat_shaped)

    def t_diagnosis_names_the_broken_link():
        """«API girdim ama calismiyor» cumlesinin tek cevabi, zinciri
        GERCEKTEN kosturup hangi halkanin koptugunu gostermektir."""
        con = _con()
        # 1) Hicbir atama yok
        d = sohbet.tani(con, {"local_token": "x"}, BUGUN)
        no(d["ok"])
        eq(d["adimlar"][0]["ad"], "Model ataması")
        no(d["adimlar"][0]["ok"])

        # 2) Her sey yerinde
        d = sohbet.tani(con, _cfg(), BUGUN,
                        transport=_cevap("Merhaba, bugün nasılsın?"))
        ok(d["ok"], "zincir tam oldugu halde kopuk dendi")
        ok(all(a["ok"] for a in d["adimlar"]))
        adlar = [a["ad"] for a in d["adimlar"]]
        for gereken in ("Model ataması", "Anahtar", "Bütçe",
                        "Sağlayıcıya çağrı", "Cevabın denetimi"):
            ok(gereken in adlar, "eksik adim: %s" % gereken)

        # 3) Saglayici patlarsa SEBEBI yazilir
        def patla(*a):
            raise OSError("ag yok")
        d = sohbet.tani(con, _cfg(), BUGUN, transport=patla)
        no(d["ok"])
        son = d["adimlar"][-1]
        eq(son["ad"], "Sağlayıcıya çağrı")
        ok("ag yok" in son["note"])
    test("tani hangi halkanin koptugunu soyler",
         t_diagnosis_names_the_broken_link)

    def t_request_still_becomes_a_proposal():
        """MODEL BAGLAMAK, SISTEMI DAHA AZ IS YAPAR HALE GETIRMEMELI.

        «Yarin iki saat matematik» bir sohbet degil bir ISTEKTIR: AYS'in
        kuyruguna teklif birakir ve AYS kendi koduyla uygular. Model
        baglandiktan sonra bu adim atlaniyordu ve ayni cumleye yalnizca
        guzel bir laf donuyordu — eylem kayboluyor, yerine ifade
        geciyordu."""
        con = _con()
        cfg = _cfg()
        cagri = []

        def izle(*a):
            cagri.append(1)
            return "Yarına iki saatlik bir blok önerebilirim.", 300, 40

        r = sohbet.konus(con, cfg, "yarın 2 saat matematik", BUGUN,
                         transport=izle)
        eq(r["mode"], "komut")
        eq(r["command"], "istek")
        ok("Teklif" in r["text"])
        eq(con.execute("SELECT COUNT(*) n FROM intents").fetchone()["n"], 1)
        # Eylem varken modele GIDILMEZ: ucretsiz ve kesin yol once.
        no(cagri, "istek oldugu halde model cagrildi")

        # Olagan sohbet ETKILENMEZ: dil.istek ihtiyatlidir, gun ve sure
        # birlikte gecmiyorsa niyet kurmaz.
        r = sohbet.konus(con, cfg, "bugün odaklanamadım, ne yapsam?", BUGUN,
                         transport=izle)
        eq(r["mode"], "model")
        eq(con.execute("SELECT COUNT(*) n FROM intents").fetchone()["n"], 1)
    test("model baglaninca teklif yolu kaybolmaz",
         t_request_still_becomes_a_proposal)
