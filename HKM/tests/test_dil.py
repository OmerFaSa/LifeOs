# -*- coding: utf-8 -*-
"""Dil — serbest cumleyi kapali komut setine eslemek, ve EMIN DEGILSE SORMAK.

Bu paket en cok «yanlis anlamamayi» korur: bir oneriyi kullanicinin iradesi
disinda kabul etmek, bu katmanin yapabilecegi en kotu seydir.
"""

from core import db, dil, patron, sync_engine
from tests.harness import eq, metric, no, ok, suite, test

BUGUN = "2026-09-14"


def _con():
    return db.connect(":memory:")


def run():
    suite("dil")

    def t_turkish_lowercase():
        """«I» harfi: Python'un varsayilan kucultmesi Turkce degildir."""
        eq(dil.kucult("IYI"), "ıyı")
        eq(dil.kucult("İYİ"), "iyi")
    test("kucultme Turkce kurallarina uyar", t_turkish_lowercase)

    def t_folding_accepts_both_keyboards():
        """Bir komut arayuzunun klavye duzenine gore anlayip anlamamasi
        kabul edilemez."""
        eq(dil.sadelestir("Çapraz"), "capraz")
        eq(dil.sadelestir("özet"), "ozet")
        eq(dil.parse("çapraz bulgular")[0], dil.parse("capraz bulgular")[0])
    test("aksanli ve aksansiz yazim ayni sonucu verir",
         t_folding_accepts_both_keyboards)

    def t_stemming_keeps_root():
        eq(dil.kok("durumum"), "durum")
        eq(dil.kok("etkisi"), "etki")
        eq(dil.kok("ne"), "ne")          # kok en az uc harf kalmali
        eq(dil.kok("ozetle"), "ozet")
    test("ek soyulur ama kok korunur", t_stemming_keeps_root)

    def t_clear_sentences_map():
        for cumle, beklenen in (
                ("bugün ne yapmalıyım", "durum"),
                ("son bir haftayı özetle", "durum"),
                ("işe yarıyor mu", "etki"),
                ("neden böyle diyorsun", "neden"),
                ("uyku ile soru arasında ilişki var mı", "capraz"),
                ("hayır istemiyorum", "ret"),
                ("yardım", "yardim")):
            eq(dil.parse(cumle)[0], beklenen, cumle)
    test("acik cumleler dogru niyete baglanir", t_clear_sentences_map)

    def t_unknown_stays_unknown():
        """Anlamadigini anlamis gibi yapmak, bu depodaki en pahali hata."""
        for cumle in ("merhaba", "naber", "bir şey sormak istiyorum"):
            niyet, ayrinti = dil.parse(cumle)
            eq(niyet, None, cumle)
            ok(ayrinti.get("reason"))
    test("anlasilmayan cumle uydurulmaz", t_unknown_stays_unknown)

    def t_negation_never_becomes_approval():
        """«kabul etmiyorum» bir ONAY DEGILDIR — ve tahmin de edilmez."""
        ok(dil.olumsuz("kabul etmiyorum"))
        ok(dil.olumsuz("bunu onaylamıyorum"))
        ok(dil.olumsuz("olmaz"))
        no(dil.olumsuz("kabul ediyorum"))
        niyet, ayrinti = dil.parse("kabul etmiyorum")
        eq(niyet, None)
        eq(ayrinti["tie"], ["kabul", "ret"])
    test("olumsuzluk onaya donusmez", t_negation_never_becomes_approval)

    def t_strict_command_also_guards_negation():
        """Kesin eslesme ILK KELIMEYE bakar: «kabul etmiyorum» cumlesinin
        ilk kelimesi «kabul»dur. Tek basina birakilsaydi onay sayilirdi."""
        niyet, ayrinti = patron.understand("kabul etmiyorum")
        eq(niyet, None)
        eq(ayrinti["tie"], ["kabul", "ret"])
        eq(patron.understand("kabul")[0], "kabul")
        eq(patron.understand("hayır istemiyorum")[0], "ret")
    test("kesin komut yolu da olumsuzlugu gozetir",
         t_strict_command_also_guards_negation)

    def t_time_is_a_parameter():
        eq(dil.zaman("dün ne yaptım")["offset"], 1)
        eq(dil.zaman("bugün")["offset"], 0)
        eq(dil.zaman("son 14 günü göster")["days"], 14)
        eq(dil.zaman("bir şey")["source"], "varsayilan")
        # Ileri tarihe gidilmez.
        eq(dil.cozum_tarihi("2026-09-14", {"time": {"offset": 1}}), "2026-09-13")
        eq(dil.cozum_tarihi("2026-09-14", {"time": {"offset": -5}}), "2026-09-14")
    test("zaman bir niyet degil parametredir", t_time_is_a_parameter)

    def t_ambiguity_is_asked_not_guessed():
        con = _con()
        r = patron.respond(con, "kabul etmiyorum", date=BUGUN)
        eq(r["command"], None)
        ok("Emin olamadım" in r["text"])
        ok("«kabul»" in r["text"] and "«ret»" in r["text"])
    test("belirsizlik tahmin edilmez, sorulur", t_ambiguity_is_asked_not_guessed)

    def t_free_sentence_reaches_the_engine():
        con = _con()
        sync_engine.ingest(con, {"module": "spi", "date": BUGUN,
                                 "metrics": {"sleep_hours": metric(4.0)}},
                           now=BUGUN + "T09:00:00")
        r = patron.respond(con, "bugün ne yapmalıyım", date=BUGUN)
        eq(r["command"], "durum")
        ok("HKM · " + BUGUN in r["text"])
    test("serbest cumle kural motoruna ulasir", t_free_sentence_reaches_the_engine)

    def t_past_tense_is_a_report_not_a_request():
        """«Bugun 2 saat matematik calistim» olmus bir isin haberidir.
        Istek sayilirsa HKM bitirilmis isi bugune PLAN blogu diye teklif
        ediyordu. «matematik»in «-tik» sonu da gecmis sanilmamali."""
        ok(dil.gecmis("bugün 2 saat matematik çalıştım"))
        ok(dil.gecmis("7 saat uyudum"))
        ok(dil.gecmis("dün 40 soru çözmüştüm"))
        for cumle in ("bugün 2 saat matematik", "fizik pratik", "yardım",
                      "yarın 2 saat matematik çalışacağım",
                      "kendim çalışacağım", "tüm gün"):
            no(dil.gecmis(cumle), cumle)
        eq(dil.istek("bugün 2 saat matematik çalıştım", BUGUN), None)
        # Istek yolu bozulmaz.
        eq(dil.istek("bugün 2 saat matematik", BUGUN)["minutes"], 120)
        eq(dil.istek("yarın 2 saat matematik çalışacağım", BUGUN)["date"],
           "2026-09-15")
    test("gecmis kip istek degil rapordur", t_past_tense_is_a_report_not_a_request)

    def t_report_is_split_by_module():
        """Rapor yan cumlelerine bolunur ve her parca KENDI modulune gider.
        Sayi OKUNMAZ: HKM yalniz yonlendirir."""
        r = dil.rapor("bugün 2 saat matematik çalıştım, 7 saat uyudum ve "
                      "30 dakika gitar çaldım")
        eq(r["offset"], 0)
        eq([(p["modul"], p["metin"]) for p in r["parcalar"]],
           [("ays", "bugün 2 saat matematik çalıştım"), ("spi", "7 saat uyudum"),
            ("esp", "30 dakika gitar çaldım")])
        # Ders adi genel fiilden agir basar; alan soylemeyen miktar oncekine
        # baglanir.
        eq(dil.rapor("2 saat tarih okudum")["parcalar"][0]["modul"], "ays")
        eq(dil.rapor("30 sayfa kitap okudum")["parcalar"][0]["modul"], "esp")
        r = dil.rapor("dün 40 soru çözdüm, 32si doğru")
        eq(r["offset"], 1)
        eq(r["parcalar"], [{"modul": "ays", "metin": "dün 40 soru çözdüm, 32si doğru"}])
        # Modul adi yazilirsa ondan gider.
        eq(dil.rapor("ESP'ye 20 dk kelime çalıştım")["parcalar"][0]["modul"], "esp")
    test("rapor modullere bolunur", t_report_is_split_by_module)

    def t_report_never_guesses():
        """Miktari ya da modulu belirsiz parca TAHMIN EDILMEZ; olumsuz cumle
        ve ileri tarihli celiski kayit degildir."""
        r = dil.rapor("bugün matematik çalıştım")
        eq(r["parcalar"], [])
        eq(r["miktarsiz"], ["bugün matematik çalıştım"])
        r = dil.rapor("1 saat felsefe çalıştım")        # AYS mi ESP mi?
        eq(r["belirsiz"], ["1 saat felsefe çalıştım"])
        eq(dil.rapor("3 saat telefonla oynadım")["belirsiz"],
           ["3 saat telefonla oynadım"])
        eq(dil.rapor("bugün matematik çalışmadım"), None)
        eq(dil.rapor("yarın 2 saat çalıştım"), None)
        eq(dil.rapor("dün ne yaptım"), None)         # soru: durum komutu kalir
        # Gecmis kipte SORU da kayit degildir.
        eq(dil.rapor("dün kaç saat uyudum?"), None)
        eq(dil.rapor("dün kaç saat uyudum"), None)
        eq(dil.rapor("dün 3 saat çalıştım mı"), None)
        eq(dil.rapor("bugün çok yoruldum"), None)
    test("rapor tahmin etmez", t_report_never_guesses)

    def t_short_entry():
        """Telegram'dan tek kelime kayit («su 2», «uyku 7», «soru 40»): alan +
        sayi. HKM sayiyi OKUMAZ, yalniz yonlendirir; birimi modul bilir. Ilk
        kelimesi bir alan olmayan ya da soru/plan olan mesaj kayit sayilmaz."""
        r = dil.kisa_kayit("su 2, uyku 7, soru 40")
        eq([(p["modul"], p["metin"]) for p in r["parcalar"]],
           [("spi", "su 2, uyku 7"), ("ays", "soru 40")])
        eq(r["offset"], None)
        r = dil.kisa_kayit("dün uyku 6 ve gitar 30")
        eq(r["offset"], 1)
        eq([(p["modul"], p["metin"]) for p in r["parcalar"]],
           [("spi", "uyku 6"), ("esp", "gitar 30")])
        eq(dil.kisa_kayit("su 500 ml")["parcalar"], [{"modul": "spi", "metin": "su 500 ml"}])
        eq(dil.kisa_kayit("su 2 ve abc 5")["belirsiz"], ["abc 5"])
        for t in ("merhaba", "yarın su 2", "su 2 mi?", "kaç soru 40", "2 saat matematik",
                  "bugün hava çok güzel", "özet", "1", "abc 5", "onayla 2",
                  "su 2 ve bugün çok yoruldum"):
            eq(dil.kisa_kayit(t), None)
    test("kisa kayit: alan + sayi", t_short_entry)

    def t_short_entry_reaches_modules():
        """Kisa kayit rapor gibi modul kuyruguna `kayit.add` teklifi birakir."""
        con = _con()
        r = patron.respond(con, "su 2, soru 40", date=BUGUN,
                           now=BUGUN + "T12:00:00")
        eq(r["command"], "kayit")
        ok("SPİ" in r["text"] and "AYS" in r["text"])
        kinds = [(x["module"], x["kind"], x["payload"]["metin"]) for x in
                 [dict(row, payload=__import__("json").loads(row["payload"]))
                  for row in con.execute("SELECT module, kind, payload FROM intents")]]
        eq(sorted(kinds), [("ays", "kayit.add", "soru 40"), ("spi", "kayit.add", "su 2")])
    test("kisa kayit modullere teklif olur", t_short_entry_reaches_modules)

    def t_negation_seen_through_dotless_i():
        """«çalışmadım» katlanmadan «madım» tasir; desen «madim» ariyordu
        ve olumsuz gecmisi hic gormuyordu."""
        ok(dil.olumsuz("bugün matematik çalışmadım"))
        ok(dil.olumsuz("hiç uyumadım"))
        ok(dil.olumsuz("gitmemiştim"))
        no(dil.olumsuz("kabul ediyorum"))
    test("olumsuz gecmis noktasiz i ile de gorulur", t_negation_seen_through_dotless_i)

    def t_model_hook_is_optional_and_safe():
        """Ifade katmani bir cumlenin KAYBOLMASINA sebep olamaz."""
        eq(dil.ifade("merhaba"), "merhaba")
        eski = dil.IFADE_KANCASI
        try:
            dil.IFADE_KANCASI = lambda t: None
            eq(dil.ifade("metin"), "metin")
            dil.IFADE_KANCASI = lambda t: (_ for _ in ()).throw(RuntimeError("patlak"))
            eq(dil.ifade("metin"), "metin")
            dil.IFADE_KANCASI = lambda t: t.upper()
            eq(dil.ifade("metin"), "METIN")
        finally:
            dil.IFADE_KANCASI = eski
    test("model kancasi opsiyonel ve zararsiz", t_model_hook_is_optional_and_safe)
