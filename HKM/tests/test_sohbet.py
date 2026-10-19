# -*- coding: utf-8 -*-
"""Sohbet ve model çağrısı.

Bu paket bir ozelligi degil bir SOZU korur: model otorite degildir.
Ag'a CIKILMAZ — saglayicinin cevabi enjekte edilir.
"""

import datetime

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

    def t_local_hybrid_gets_short_context():
        """HATA (sahada, 2026-09-27): paketsiz hibritte yerel kucuk model
        (gemma3:1b) UZUN sistem metni ve kisaltilmamis gecmis aliyordu —
        «kisa baglam» siniri yalniz paket seciliyken devreye giriyordu;
        cevaplar anlamsiz Turkceye donuyordu. Ortuk paket de sinirlanir."""
        from core import db as _db, models as _m
        con = _db.connect(":memory:")
        olcu = {}
        def tas(provider, anahtar, model, sistem, mesajlar, ayar=None):
            olcu["sistem"], olcu["mesaj"] = len(sistem), len(mesajlar)
            return "Tamam.", 10, 3
        gecmis = [{"role": "user" if i % 2 == 0 else "assistant", "content": "x%d" % i} for i in range(10)]
        ortuk = _m.apply({"local_token": "x"}, {"yer": "hibrit", "yerel": {"ekonomik": "gemma3:1b"}})
        paketli = _m.apply({"local_token": "x"}, {"paket": "A", "yer": "hibrit", "yerel": {"ekonomik": "gemma3:1b"}})
        sohbet.konus(con, ortuk, "bugün nasıl gidiyor", "2026-09-27", gecmis=gecmis, transport=tas, kayit=False)
        o = dict(olcu)
        sohbet.konus(con, paketli, "bugün nasıl gidiyor", "2026-09-27", gecmis=gecmis, transport=tas, kayit=False)
        eq(o, olcu)                                   # paket secilmis gibi: ayni kisa baglam
        ok(o["mesaj"] <= 5, o)                        # gecmis 4 + yeni mesaj
    test("paketsiz hibritte yerel model kisa baglam alir", t_local_hybrid_gets_short_context)

    def t_pure_greeting_is_answered_by_rule():
        """HATA (sahada, 2026-09-27): «merhaba» yerel kucuk modele
        (gemma3:1b) gidiyor ve «Şu anda durumun özetini açıklıyor
        olabilirsiniz.» gibi alakasiz cevap donuyordu; model kapaliyken de
        «Anlamadım» geliyordu. YALNIZ selamdan olusan mesaj kuralla,
        modelsiz cevaplanir; selamla baslayan bir SORU modele gider."""
        from core import db as _db, models as _m
        cagri = []
        def tas(provider, anahtar, model, sistem, mesajlar, ayar=None):
            cagri.append(mesajlar[-1]["content"])
            return "Tamam.", 10, 3
        cfg = _m.apply({"local_token": "x"}, {"yer": "hibrit", "yerel": {"ekonomik": "gemma3:1b"}})
        for m, ilk in (("merhaba", "Merhaba!"), ("Selam!", "Merhaba!"), ("MERHABA KING", "Merhaba!"),
                       ("günaydın", "Günaydın!"), ("İyi akşamlar :)", "İyi akşamlar!"),
                       ("slm", "Merhaba!"), ("selamlar hkm", "Merhaba!")):
            r = sohbet.konus(_db.connect(":memory:"), cfg, m, "2026-09-27", transport=tas, kayit=False)
            eq(r["command"], "selam", m)
            ok(r["text"].startswith(ilk), (m, r["text"]))
            ok("King" in r["text"] and "«durum»" in r["text"], r["text"])
        eq(cagri, [])                                   # hicbiri modele gitmedi
        for m in ("merhaba, uykum nasıl", "selam naber", "günaydın bugün ne çalışayım"):
            r = sohbet.konus(_db.connect(":memory:"), cfg, m, "2026-09-27", transport=tas, kayit=False)
            ok(r.get("command") != "selam", m)
        eq(len(cagri), 3)                               # selamla baslayan soru modele gider
        # Model hic yokken de selam «Anlamadım» degil, karsilamadir.
        r = sohbet.konus(_db.connect(":memory:"), {}, "merhaba", "2026-09-27", kayit=False)
        eq(r["command"], "selam")
        no("Anlamadım" in r["text"])
        # Gorevli kendi adiyla selamlar.
        r = sohbet.konus(_db.connect(":memory:"), {}, "selam", "2026-09-27", gorevli="bio", kayit=False)
        ok(sohbet.GOREVLILER["bio"]["ad"] in r["text"], r["text"])
    test("yalniz selam kuralla modelsiz cevaplanir", t_pure_greeting_is_answered_by_rule)

    def t_short_prompt_carries_identity():
        """HATA (sahada, 2026-09-27): kisa sistem metni «Sen HKM'nin King
        görevlisisin» ile basliyordu; 1B model «sen kimsin» sorusuna
        «Benim adım Sen HKM.» diyordu ve modulleri bilmiyordu."""
        s = sohbet.sistem_metni("king", "- (liste)", kisa=True)
        ok(s.startswith("Adın King."), s[:60])
        for parca in ("AYS", "SPİ", "ESP", "Hayat Kontrol Merkezi", "sayı uydurma", "- (liste)"):
            ok(parca in s, parca)
    test("kisa sistem metni kimligi ve modulleri tasir", t_short_prompt_carries_identity)

    def t_short_context_is_compact():
        """HATA (sahada, 2026-09-27): kucuk yerel model «nasılsın»a «Bugün
        veri gelmedi, bu brifing bir şey ölçmüyor» diyordu; bes modelde de
        ayni: baglamin cogu ayni «veri gelmedi» cumlesinin bes bicimiydi
        (modul satiri, kapsam, kor nokta, uc kurul uyesi) ve capraz/seri
        satirlari IKI kez giriyordu. Kisa baglam: veri yoksa tek satir,
        olcum satirlari aynen ve bir kez."""
        import sys as _s, os as _o
        _s.path.insert(0, _o.path.join(_o.path.dirname(_o.path.dirname(_o.path.abspath(__file__))), "tools"))
        import perf
        from core import db as _db
        bos = sohbet.baglam(_db.connect(":memory:"), "2026-09-27", "king", kisa=True)
        satir = bos.splitlines()
        ok(len(satir) <= 3, bos)
        ok("ölçülmedi" in bos and "SPİ" in bos and "AYS" in bos and "ESP" in bos, bos)
        no("brifing" in bos, bos)
        con = _db.connect(":memory:"); perf.kur(con); gun = perf.son_an()[:10]
        tam = sohbet.baglam(con, gun, "king")
        kis = sohbet.baglam(con, gun, "king", kisa=True)
        ok(len(kis) < len(tam) * 0.7, (len(kis), len(tam)))
        ks = kis.splitlines()
        eq(len(ks), len(set(ks)))                               # tekrar yok
        for parca in ("%21 yukarıda", "%19 yukarıda", "45 gündür", "EŞLEŞMEDİR"):
            eq(kis.count(parca), 1 if parca != "EŞLEŞMEDİR" else kis.count(parca), parca)
            ok(parca in kis, parca)                             # olcum kaybolmaz
        # Tam baglam (buyuk model) degismedi.
        ok("brifing" in sohbet.baglam(_db.connect(":memory:"), "2026-09-27", "king"))
        # Kisa sistem metni «sen» hitabini soyler.
        ok("«sen»" in sohbet.sistem_metni("king", bos, kisa=True))
        # Gorev tanimi kisa metne girmez (4B model «Günün tek cümlesi:» diye tekrarliyordu).
        no("tek cümlesini" in sohbet.sistem_metni("king", bos, kisa=True))
        ok("sorulmadıkça" in bos, bos)
    test("kisa baglam sikisik: veri yoksa tek satir, olcum bir kez", t_short_context_is_compact)

    def t_short_context_incomplete_is_silent():
        """HATA (sahada, 2026-10-19): moduller veri gonderdi ama alanlar bos
        geldi; uc modulun hukmu INCOMPLETE («hüküm verecek veri yok») oldu ve
        bu satirlar olcum gibi girdi. Kisa baglam YALNIZ bu uc satirdi; 4B
        model «Merhaba King, bugün nasılsın?»a «ESP modülü için hüküm verecek
        veri yok.» diye cevap verdi. Hukmu olmayan modul satiri olcum degildir:
        «veri gelmeyen» tek satirda toplanir."""
        from core import db as _db, manager as _m
        satirlar = [
            {"kind": "vp", "text": "SPİ: hüküm verecek veri yok.", "vp": "bio", "verdict": "INCOMPLETE", "findings": 0},
            {"kind": "vp", "text": "AYS: hüküm verecek veri yok.", "vp": "academic", "verdict": "INCOMPLETE", "findings": 0},
            {"kind": "vp", "text": "ESP: hüküm verecek veri yok.", "vp": "intellect", "verdict": "INCOMPLETE", "findings": 0},
            {"kind": "proposal", "text": "Bugün için bir öneri yok.", "rank": None},
        ]
        eski = _m.brief
        _m.brief = lambda con, date, th=None: {"lines": list(satirlar), "council": {}, "decision": None}
        try:
            con = _db.connect(":memory:")
            k = sohbet.baglam(con, "2026-10-19", "king", kisa=True)
            no("hüküm verecek" in k, k)
            ok("Hiçbir modülden ölçüm yok (SPİ, AYS, ESP)" in k and "sorulmadıkça" in k, k)
            eq(len(k.splitlines()), 2)
            # Hukmu olan modul olcum olarak kalir; hukumsuzler «veri gelmeyen» satirinda.
            satirlar[1] = {"kind": "vp", "text": "AYS: dikkat — deneme neti düştü.", "vp": "academic",
                           "verdict": "WATCH", "findings": 1}
            k = sohbet.baglam(con, "2026-10-19", "king", kisa=True)
            ok("- AYS: dikkat — deneme neti düştü." in k, k)
            ok("veri gelmeyen modüller (ölçülmedi): SPİ, ESP." in k, k)
            no("hüküm verecek" in k, k)
            # Bulgusu olan INCOMPLETE (surup giden denetim) olcum olarak kalir.
            satirlar[0] = dict(satirlar[0], findings=2, text="SPİ: hüküm verecek veri yok; 2 bulgu.")
            ok("SPİ: hüküm verecek veri yok; 2 bulgu." in sohbet.baglam(con, "2026-10-19", "king", kisa=True))
            # Tam baglam (buyuk model) degismez.
            ok("ESP: hüküm verecek veri yok." in sohbet.baglam(con, "2026-10-19", "king"))
        finally:
            _m.brief = eski
    test("kisa baglam: hükmü olmayan modül ölçüm gibi girmez", t_short_context_incomplete_is_silent)

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

    def t_hafiza_adayi_sohbette():
        # Model kalici hafiza YAZAMAZ; cevabina aday etiketi koyabilir. Etiket
        # kullaniciya gitmez, aday bekler, kullanici «aday N kaydet» der.
        from core import memory
        con = _con()
        tasiyici = _cevap("Anladım, sabah bloklarını öne alırız.\n[[HAFIZA ADAYI: Sabahları daha verimli çalışıyor.]]")
        r = sohbet.konus(con, _cfg(), "ben sabahları daha verimliyim", BUGUN, transport=tasiyici)
        no("HAFIZA ADAYI" in r["text"])
        ok("aday " in r["text"] and "kaydet" in r["text"], r["text"])
        ok("HAFIZA ADAYI" in tasiyici.gorulen["sistem"])        # model kurali biliyor
        eq([a["text"] for a in memory.adaylar(con)], ["Sabahları daha verimli çalışıyor."])
        eq(memory.list_active(con), [])
        # Saglik adayi sessizce DUSER: etiket yine gitmez, aday yazilmaz.
        t2 = _cevap("Tamam.\n[[HAFIZA ADAYI: Tansiyon ilacı kullanıyor.]]")
        r2 = sohbet.konus(con, _cfg(), "tansiyon ilacı kullanıyorum", BUGUN, transport=t2)
        eq(r2["text"], "Tamam.")
        eq(len(memory.adaylar(con)), 1)
    test("hafiza adayi: model yalniz aday birakir, etiket kullaniciya gitmez", t_hafiza_adayi_sohbette)

    def t_hafiza_adayi_kapisi():
        """HATA (sahada, 2026-10-19): 4B model selama, soruya ve «tavsiye
        ver»e bile [[HAFIZA ADAYI]] koyuyordu («Her şeyin kontrol altında
        olması güzel.»); her cevabin sonuna «Hafıza adayı: … aday 2 kaydet»
        ekleniyordu ve etiket silinince «yok. .» kaliyordu. Aday YALNIZ
        kullanicinin kendisi hakkinda soyledigi cumleden dogar: soru ve
        istek cumlesi kapidan gecmez (kural motoru, model degil)."""
        from core import memory
        for m in ("Merhaba King, bugün nasılsın?", "Bana uyku hakkında kısa bir tavsiye ver.",
                  "Uykum nasıl?", "durum ne", "hafta planımı göster", "selam"):
            no(sohbet.aday_kapisi(m), m)
        for m in ("ben sabahları daha verimliyim", "Sabahları çalışırım.", "Kahve sevmem",
                  "Akşamları kitap okumayı seviyorum", "Benim adım Deniz", "Hafta sonları çalışmam"):
            ok(sohbet.aday_kapisi(m), m)
        con = _con()
        t = _cevap("Merhaba! Ben iyiyim, teşekkür ederim. [[HAFIZA ADAYI: Her şeyin kontrol altında olması güzel.]].")
        r = sohbet.konus(con, _cfg(), "Merhaba King, bugün nasılsın?", BUGUN, transport=t)
        eq(r["text"], "Merhaba! Ben iyiyim, teşekkür ederim.")
        eq(memory.adaylar(con), [])
        eq(memory.aday_ayikla("Bu ölçülmedi. [[HAFIZA ADAYI: x]].")[0], "Bu ölçülmedi.")
        eq(memory.aday_ayikla("Tamam... [[HAFIZA ADAYI: x]]")[0], "Tamam...")
    test("hafiza adayi: soru ve istek cumlesi kapidan gecmez; artik nokta kalmaz", t_hafiza_adayi_kapisi)

    def t_derinlik():
        """Kullanici, 2026-10-19: «King ne kadar dusunecek secilebilsin».
        Derinlik secilmisse seviyeyi o belirler (neden: kullanicinin secimi);
        secilmemisse ya da gecersizse kod siniflar. Talimat sisteme eklenir."""
        t = _cevap("Tamam.")
        r = sohbet.konus(_con(), _cfg(), "bugün hava güzel", BUGUN, transport=t, derinlik="derin")
        eq((r["mode"], r["motor"]["seviye"], r["motor"]["derinlik"]), ("model", "ust", "derin"))
        eq(r["motor"]["neden"], "kullanıcının seçimi: Derin")
        ok("Bu cevap DERİN" in t.gorulen["sistem"] and "10 cümle" in t.gorulen["sistem"], t.gorulen["sistem"][-300:])
        t2 = _cevap("Tamam.")
        r = sohbet.konus(_con(), _cfg(), "kitap mı film mi, hangisi daha iyi", BUGUN, transport=t2, derinlik="hizli")
        eq((r["motor"]["seviye"], r["motor"]["neden"]), ("alt", "kullanıcının seçimi: Hızlı"))
        ok("Bu cevap HIZLI" in t2.gorulen["sistem"], t2.gorulen["sistem"][-200:])
        t3 = _cevap("Tamam.")
        r = sohbet.konus(_con(), _cfg(), "bugün hava güzel", BUGUN, transport=t3, derinlik="dengeli")
        eq((r["motor"]["seviye"], r["motor"]["derinlik"]), ("orta", "dengeli"))
        no("Bu cevap" in t3.gorulen["sistem"], "dengeli talimat eklemez")
        for d in (None, "uzman", ""):
            t4 = _cevap("Tamam.")
            r = sohbet.konus(_con(), _cfg(), "kitap mı film mi, hangisi daha iyi", BUGUN, transport=t4, derinlik=d)
            eq((r["motor"]["seviye"], r["motor"]["derinlik"]), ("ust", "oto"))
            ok(r["motor"]["neden"].startswith("karar/yol haritası"), r["motor"]["neden"])
            no("Bu cevap" in t4.gorulen["sistem"], d)
        eq([sohbet.derinlik_of(x) for x in ("hizli", "dengeli", "derin", "oto", None, 3)],
           ["hizli", "dengeli", "derin", None, None, None])
    test("derinlik: kullanici secerse seviye ondan; gecersizse kod siniflar", t_derinlik)

    def t_yerel_model_sikisik_baglam():
        """HATA (sahada, 2026-10-19): «Derin» secilince seviye ust oldu ve
        gemma3:4b'ye TAM baglam gitti (kapsam, kor nokta satirlari); model
        cevaba «Bu resim 46 metriğe dayanıyor…» diye basladi. Yerel (kucuk)
        modele her seviyede SIKISIK baglam gider; seviye yine gecmisin ve
        hafizanin genisligini belirler."""
        from core import db as _db
        con = _db.connect(":memory:")
        cfg = {"local_token": "x"}
        cfg = models.apply(cfg, {"yer": "yerel", "yerel": {"ekonomik": "gemma3:4b"}, "keys": {"yerel": "yerel"},
                                 "assignments": {"king": {"provider": "yerel", "model": "gemma3:4b"}}})
        t = _cevap("Tamam.")
        r = sohbet.konus(con, cfg, "bugün hava güzel", BUGUN, transport=t, derinlik="derin")
        eq((r["mode"], r["motor"]["seviye"]), ("model", "ust"))
        no("brifing" in t.gorulen["sistem"] or "metriğe dayanıyor" in t.gorulen["sistem"], t.gorulen["sistem"][:600])
        ok("Adın King." in t.gorulen["sistem"], t.gorulen["sistem"][:200])     # kisa sistem metni
        ok("Bu cevap DERİN" in t.gorulen["sistem"])
        # Bulut modeli (google) TAM baglami gorur: degismedi.
        t2 = _cevap("Tamam.")
        sohbet.konus(_db.connect(":memory:"), _cfg(), "bugün hava güzel", BUGUN, transport=t2, derinlik="derin")
        ok("brifing" in t2.gorulen["sistem"], t2.gorulen["sistem"][:600])
    test("yerel model her derinlikte sıkışık bağlam görür", t_yerel_model_sikisik_baglam)

    def t_uzun_istek():
        """Sahada (2026-10-19): «çok uzun bir metin yaz» dendi; kucuk modelin
        «en fazla 3 cümle» kurali yuzunden King reddetti. Kod uzun istegi
        tanir: talimat cumle sinirini kaldirir, cevap payi ve bekleme buyur;
        LifeOS sorulursa kendi tanimi baglama girer (adresler denetimden gecer)."""
        for m in ("Bana çok uzun bir metin yazar mısın?", "Tamam odaklanmadan yüzeysel uzun bir metin yaz.",
                  "LifeOS'u ayrıntılı anlat", "kapsamlı bir rapor hazırla"):
            ok(sohbet.uzun_istek(m), m)
        for m in ("uzun süre uyudum", "bugün hava güzel", "yaz tatili ne zaman", "uzun vadeli hedefim var"):
            no(sohbet.uzun_istek(m), m)
        gorulen = {}
        eski = ai.ask

        def sahte(con, cfg, role, task, mesajlar, **kw):
            gorulen.update(kw)
            return {"ok": True, "text": "AYS 4173 adresinde çalışır.", "model": "m", "usd": 0, "seconds": 0, "motor": {}}
        ai.ask = sahte
        try:
            r = sohbet.konus(_con(), _cfg(), "Bana bu sistemin mimarisini anlatan çok uzun bir metin yaz", BUGUN)
            eq((r["mode"], r["motor"]["uzun"], gorulen["jeton"], gorulen["sure"]), ("model", True, sohbet.UZUN_JETON, sohbet.UZUN_SURE))
            ok("cümle sınırı" in gorulen["sistem"] and "4173" in gorulen["baglam"], gorulen["sistem"][-300:])
            sohbet.konus(_con(), _cfg(), "bugün hava güzel", BUGUN)
            eq((gorulen["jeton"], gorulen["sure"]), (None, None))
            no("cümle sınırı" in gorulen["sistem"] or "LifeOS hakkında" in gorulen["baglam"], "kisa istek")
        finally:
            ai.ask = eski
        # ai._genis genisletir, daraltmaz.
        eq(ai._genis({"jeton": 5000}, 2500, None), {"jeton": 5000})
        eq(ai._genis({}, 2500, 150), {"jeton": 2500, "sure": 150})
        eq(ai._genis({"a": 1}, None, None), {"a": 1})
        # Kisa sistem metni tirnakli «bu ölçülmedi» ifadesini tasimaz (model aynen tekrarliyordu).
        no("«bu ölçülmedi»" in sohbet.sistem_metni("king", "-", kisa=True), "tirnakli ifade")
    test("uzun istek: cümle sınırı kalkar, pay ve bekleme büyür; LifeOS tanımı bağlamda", t_uzun_istek)

    def t_samimi_sohbet():
        """Sahada (2026-10-19): «Nasılsın kanka?»ya hep ««bu ölçülmedi».» geldi.
        Kucuk modelde serbest sohbete olcum listesi gitmez; gecmisteki yanki
        cevaplari modele geri gitmez; talimat samimi sohbeti soyler."""
        from core import db as _db
        cfg = models.apply({"local_token": "x"}, {"yer": "yerel", "yerel": {"ekonomik": "gemma3:4b"}, "keys": {"yerel": "yerel"},
                                                  "assignments": {"king": {"provider": "yerel", "model": "gemma3:4b"}}})
        gecmis = [{"role": "user", "content": "Nasılsın kanka?"}, {"role": "assistant", "content": "«bu ölçülmedi»."},
                  {"role": "user", "content": "Merhaba"}, {"role": "assistant", "content": "Merhaba! Nasılsın?"}]
        t = _cevap("İyiyim kanka, sen nasılsın?")
        r = sohbet.konus(_db.connect(":memory:"), cfg, "Nasıl gidiyor günün kanka?", BUGUN, transport=t, gecmis=gecmis)
        eq(r["text"], "İyiyim kanka, sen nasılsın?")
        no("Bugünün ölçümleri" in t.gorulen["sistem"] or "ölçüm yok" in t.gorulen["sistem"], t.gorulen["sistem"][-400:])
        ok("sohbet arkadaşısın" in t.gorulen["sistem"], t.gorulen["sistem"][:300])
        icerik = [m["content"] for m in t.gorulen["mesajlar"]]
        no("«bu ölçülmedi»." in icerik, icerik)
        ok("Nasılsın kanka?" in icerik and "Merhaba! Nasılsın?" in icerik, icerik)
        # Sisteme degen mesaj olcum listesini gorur.
        t2 = _cevap("Bu ölçülmedi.")
        sohbet.konus(_db.connect(":memory:"), cfg, "Uykum nasıl?", BUGUN, transport=t2)
        ok("Bugünün ölçümleri" in t2.gorulen["sistem"], t2.gorulen["sistem"][-300:])
        for m in ("Nasılsın kanka?", "Bana kendinden bahset", "Bugün hava çok güzel"):
            no(sohbet.sistem_konusu(m), m)
        for m in ("Uykum nasıl?", "bu hafta kaç deneme çözdüm", "AYS'de durum ne"):
            ok(sohbet.sistem_konusu(m), m)
        ok(sohbet.yanki_mi("«bu ölçülmedi».") and sohbet.yanki_mi("SPİ modülü için hüküm verecek veri yok."))
        no(sohbet.yanki_mi("İyiyim, teşekkürler!"))
        # Uzun cevabin basindaki kalip: serbest sohbette cevaptan, her zaman gecmisten silinir.
        eq(sohbet.kalipsiz("«bu ölçülmedi». Mükemmel bir gün geçirdiğine sevindim!"), "Mükemmel bir gün geçirdiğine sevindim!")
        eq(sohbet.kalipsiz("Bu ölçülmedi."), "")
        t3 = _cevap("«bu ölçülmedi». Video yaratmak eğlenceli bir fikir!")
        g3 = [{"role": "user", "content": "selam"},
              {"role": "assistant", "content": "«bu ölçülmedi». Bugün LifeOS olarak sistemin sağlığına odaklanıyorum. Senin günün nasıl?"}]
        r3 = sohbet.konus(_db.connect(":memory:"), cfg, "Hayatın nasıl gidiyor", BUGUN, transport=t3, gecmis=g3)
        eq(r3["text"], "Video yaratmak eğlenceli bir fikir!")
        no(any("ölçülmedi" in m["content"] for m in t3.gorulen["mesajlar"]), t3.gorulen["mesajlar"])
        # Olcum soruldugunda cevap dokunulmaz.
        t4 = _cevap("Bu ölçülmedi.")
        r4 = sohbet.konus(_db.connect(":memory:"), cfg, "Uykum nasıl?", BUGUN, transport=t4)
        eq(r4["text"], "Bu ölçülmedi.")
    test("samimi sohbet: serbest mesaja ölçüm listesi gitmez; yankı cevapları geçmişe girmez", t_samimi_sohbet)

    def t_akis():
        """Akan cevap: cumleler denetlenerek akar; etiket ve kalip akmaz;
        dayanaksiz sayili cumleyle akis durur; SSE birlestirilir."""
        giden = []
        a = sohbet.CumleAkisi(giden.append, "Tarih: 2026-10-19", serbest=True)
        for p in ["İyiyim", " kanka, sen", " nasılsın? «bu ölçülmedi». Bugün", " hava 7.5 derece.\n\nYarın",
                  " görüşürüz. [[HAFIZA ADAYI: x]]"]:
            a(p)
        a(None)
        eq("".join(giden), "İyiyim kanka, sen nasılsın? Bugün hava 7.5 derece.\n\nYarın görüşürüz. ")
        g2 = []
        b = sohbet.CumleAkisi(g2.append, "Tarih: 2026-10-19")
        for p in ["Merhaba. Uyku ortalaman 9.2 saat. ", "Devam ediyoruz."]:
            b(p)
        b(None)
        eq(g2, ["Merhaba. "])                                   # sayili olcum cumlesinde durdu
        parca = []
        y = ai._sse_birlestir([b'data: {"choices":[{"delta":{"content":"Mer"}}]}', b"",
                               'data: {"choices":[{"delta":{"content":"haba."},"finish_reason":"stop"}]}',
                               'data: {"choices":[],"usage":{"prompt_tokens":5,"completion_tokens":2}}',
                               "data: [DONE]"], parca.append)
        eq((parca, y["choices"][0]["message"]["content"], y["choices"][0]["finish_reason"], y["usage"]["completion_tokens"]),
           (["Mer", "haba.", None], "Merhaba.", "stop", 2))
        g = []
        z = ai._gemini_birlestir(['data: {"candidates":[{"content":{"parts":[{"text":"Sel"}]}}]}',
                                  'data: {"candidates":[{"content":{"parts":[{"text":"am."}]},"finishReason":"STOP"}],'
                                  '"usageMetadata":{"promptTokenCount":3,"candidatesTokenCount":2}}'], g.append)
        eq((g, z["candidates"][0]["content"]["parts"][0]["text"], z["usageMetadata"]["candidatesTokenCount"]),
           (["Sel", "am.", None], "Selam.", 2))
        # konus akisi tasiyiciya ulastirir; son cevap tam denetimle doner.
        def tasiyici(provider, anahtar, model, sistem, mesajlar, ayar=None):
            for p in ("Selam! ", "Nasılsın?"):
                ayar["akis"](p)
            ayar["akis"](None)
            return "Selam! Nasılsın?", 10, 4
        g3 = []
        r = sohbet.konus(_con(), _cfg(), "bugün hava güzel", BUGUN, transport=tasiyici, akis=g3.append, uslup="resmi")
        eq((r["text"], "".join(g3)), ("Selam! Nasılsın?", "Selam! Nasılsın? "))
        eq([sohbet.uslup_of(x) for x in ("resmi", "kisa", "samimi", "x", None)], ["resmi", "kisa", "samimi", None, None])
    test("akan cevap: cümleler denetlenerek akar; etiket ve kalıp akmaz; SSE birleşir", t_akis)

    def t_sohbet_basi_ve_akis_ucu():
        from tests.test_daemon import _Server
        import daemon
        from core import patron as _p
        s = _Server()
        try:
            con = s.srv.con if hasattr(s.srv, "con") else None
            gorulen = []
            eski = sohbet.konus

            def sahte(con_, cfg, metin, gun, **kw):
                gorulen.append((kw.get("gecmis"), kw.get("uslup")))
                if kw.get("akis"):
                    kw["akis"]("Merhaba ")
                    kw["akis"]("dostum. ")
                return {"ok": True, "mode": "model", "text": "Merhaba dostum.", "agent": "king"}
            sohbet.konus = sahte
            try:
                st, r = s.call("/api/chat", body={"text": "selam", "agent": "king", "date": BUGUN, "uslup": "kisa",
                                                  "baslangic": "2999-01-01T00:00:00"})
                eq((st, gorulen[-1][0], gorulen[-1][1]), (200, [], "kisa"))      # yeni sohbet: eski satir gitmez
                import json as _j
                import urllib.request
                from tests.test_daemon import TOKEN
                req = urllib.request.Request(s.url("/api/chat/akis"), method="POST",
                                             data=_j.dumps({"text": "selam", "agent": "king", "date": BUGUN}).encode())
                req.add_header("Authorization", "Bearer " + TOKEN)
                req.add_header("Content-Type", "application/json")
                with urllib.request.urlopen(req, timeout=10) as y:
                    satirlar = [_j.loads(x) for x in y.read().decode("utf-8").splitlines() if x.strip()]
                eq([x["t"] for x in satirlar], ["parca", "parca", "son"])
                eq(("".join(x["metin"] for x in satirlar if x["t"] == "parca"), satirlar[-1]["text"]),
                   ("Merhaba dostum. ", "Merhaba dostum."))
                eq(s.call("/api/chat/akis", token=None, body={"text": "x"})[0], 401)
            finally:
                sohbet.konus = eski
        finally:
            s.close()
        # _sohbet_gecmisi: baslangictan oncekiler duser.
        from core import db as _db
        c = _db.connect(":memory:")
        c.execute("INSERT INTO conversations(channel, role, text, created_at, agent) VALUES ('local','user','eski','2026-10-19T09:00:00','king')")
        c.execute("INSERT INTO conversations(channel, role, text, created_at, agent) VALUES ('local','user','yeni','2026-10-19T12:00:00','king')")
        eq([m["content"] for m in daemon._sohbet_gecmisi(c, "king", "2026-10-19T11:00:00")], ["yeni"])
        eq([m["content"] for m in daemon._sohbet_gecmisi(c, "king")], ["eski", "yeni"])
        eq([m["content"] for m in daemon._sohbet_gecmisi(c, "king", "bozuk")], ["eski", "yeni"])
    test("uç: yeni sohbet eski satırları göndermez; /api/chat/akis satır satır akar", t_sohbet_basi_ve_akis_ucu)

    def t_derinlik_ucu():
        from tests.test_daemon import _Server
        gorulen = []
        eski = sohbet.konus

        def sahte(con, cfg, metin, gun, **kw):
            gorulen.append(kw.get("derinlik"))
            return {"ok": True, "mode": "model", "text": "Tamam.", "agent": "king"}
        sohbet.konus = sahte
        s = _Server()
        try:
            for d in ("derin", "hizli", "uydurma", None):
                govde = {"text": "merhaba", "agent": "king", "date": BUGUN}
                if d is not None:
                    govde["derinlik"] = d
                eq(s.call("/api/chat", body=govde)[0], 200)
            eq(gorulen, ["derin", "hizli", None, None])
        finally:
            sohbet.konus = eski
            s.close()
    test("uç: /api/chat derinliği iletir; geçersizi otomatiğe çevirir", t_derinlik_ucu)

    def t_gizlilik_kaydi():
        # Fikir 55: her cagrida modele HANGI veri turunun gittigi yazilir;
        # gizlilik panosu saglik ozetinin gidip gitmedigini durustce soyler.
        from core import gizlilik
        con = _con()
        tasiyici = _cevap("Uyku ölçümün bugün düşük görünüyor.")
        sohbet.konus(con, _cfg(), "bugün odaklanamadım", BUGUN, transport=tasiyici)
        veri = con.execute("SELECT veri FROM usage ORDER BY id DESC LIMIT 1").fetchone()["veri"]
        ok("mesaj" in veri and "bio" in veri, veri)
        import datetime
        g = gizlilik.ozet(con, datetime.date.today().isoformat())   # cagri bugun yazilir
        eq((g["saglik"]["gitti"], g["saglik"]["n"]), (True, 1))
        ok(any(t["veri"] == "bio" and "sağlık özeti" in t["ad"] for t in g["turler"]))
        # Hic cagri yoksa «gitmedi» der — «bilinmiyor» degil: her cagri yazilir.
        g0 = gizlilik.ozet(db.connect(":memory:"), BUGUN)
        eq((g0["cagri"], g0["saglik"]["gitti"]), (0, False))
        ok("gitmedi" in g0["saglik"]["metin"])
    test("gizlilik: modele giden veri turu kaydedilir ve panoda soylenir", t_gizlilik_kaydi)

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
        # Harcama ÇAĞRININ YAPILDIĞI gün deftere yazılır (ölçüm, gerçek saat);
        # ay toplamı da o günün ayından sorulur. Sabit BUGUN'un ayı sorulunca
        # test 1 Ekim 2026'da kırmızıya döndü (Eylül'de yeşildi).
        d = butce.month(con, cfg, datetime.date.today().isoformat())
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
        # Harcama ÇAĞRININ YAPILDIĞI gün deftere yazılır (ölçüm, gerçek saat);
        # ay toplamı da o günün ayından sorulur. Sabit BUGUN'un ayı sorulunca
        # test 1 Ekim 2026'da kırmızıya döndü (Eylül'de yeşildi).
        d = butce.month(con, cfg, datetime.date.today().isoformat())
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

    def t_report_reaches_modules_before_model():
        """Aksam yoklamasinin cevabi modele laf olarak gitmez: kayit
        teklifi olur. Planlama, urun ve arastirma tetikleri onu yutmaz."""
        con = _con()
        cagri = []

        def izle(*a):
            cagri.append(1)
            return "Güzel bir gün geçirmişsin.", 300, 40

        r = sohbet.konus(con, _cfg(), "bugün 2 saat matematik çalıştım, 7 saat "
                                      "uyudum ve 30 dakika gitar çaldım", BUGUN,
                         transport=izle)
        eq(r["mode"], "komut")
        eq(r["command"], "kayit")
        no(cagri, "rapor oldugu halde model cagrildi")
        turler = [x["kind"] for x in (dict(y) for y in con.execute(
            "SELECT kind FROM intents"))]
        eq(turler, ["kayit.add"] * 3)
    test("rapor modelden once modullere gider", t_report_reaches_modules_before_model)

    def t_truncated_answer_never_shows_half_a_sentence():
        """YARIM BIR CEVABI TAM GIBI GOSTERMEK, olculmemis bir seyi
        olculmus gibi gostermekle ayni aileden bir yanlistir.

        Saglayicinin «neden durdum» isareti bir sure hic okunmuyordu:
        model cumlenin ortasinda kesiliyor, biz bunu tamamlanmis bir
        cevap sayip oldugu gibi gonderiyorduk."""
        con = _con()
        cfg = _cfg()

        def kesik(provider, anahtar, model, sistem, mesajlar):
            return ("Uyku ölçümün düşük görünüyor. İstersen bugünü hafif "
                    "geçirmeyi önerebilirim. Ayrıca akşam ekranı azaltmak "
                    "toparlanmaya yardım edebilir çünkü", 400, 1200, True)

        r = sohbet.konus(con, cfg, "uykum nasıl?", BUGUN, transport=kesik)
        eq(r["mode"], "model")
        ok(r["truncated"])
        # Yarim cumle ATILDI.
        no("çünkü" in r["text"].split("(Cevap")[0])
        # Kesildigi SOYLENDI: Telegram'da yan not yeri yoktur.
        ok("uzunluk sınırına takıldı" in r["text"])
    test("kesilen cevap yarim cumle gostermez",
         t_truncated_answer_never_shows_half_a_sentence)

    def t_truncation_asks_for_a_shorter_answer_once():
        """Kesilme olunca modele BIR KEZ «kisa yaz» denir; ikinci cevap
        sigiyorsa kullanici tam cevabi alir ve hicbir uyari gormez."""
        con = _con()
        cfg = _cfg()
        cagri = []

        def once_kesik(provider, anahtar, model, sistem, mesajlar):
            cagri.append(sistem)
            if len(cagri) == 1:
                return ("Uzun bir cevap ve yarida kesil", 400, 1200, True)
            return ("Uyku ölçümün düşük görünüyor.", 400, 60, False)

        r = sohbet.konus(con, cfg, "uykum nasıl?", BUGUN,
                         transport=once_kesik)
        eq(len(cagri), 2)
        ok("KISA" in cagri[1] or "kısa" in cagri[1].lower())
        eq(r["text"], "Uyku ölçümün düşük görünüyor.")
        no(r["truncated"])
        # Iki cagri da deftere yazildi.
        eq(con.execute("SELECT COUNT(*) n FROM usage").fetchone()["n"], 2)
    test("kesilince bir kez kisa yaz denir",
         t_truncation_asks_for_a_shorter_answer_once)

    def t_transport_without_truncation_flag_still_works():
        """Uc deger donduren eski bir tasiyici da calismali: bilinmeyeni
        «kesildi» saymak da uydurmaktir."""
        con = _con()
        r = sohbet.konus(con, _cfg(), "uykum nasıl?", BUGUN,
                         transport=_cevap("Uyku ölçümün düşük görünüyor."))
        eq(r["mode"], "model")
        no(r["truncated"])
    test("kesilme isareti vermeyen tasiyici calisir",
         t_transport_without_truncation_flag_still_works)
