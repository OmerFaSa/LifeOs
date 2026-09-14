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
