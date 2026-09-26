# -*- coding: utf-8 -*-
"""Konusma seviyesi — hangi mesaj hangi modele gider.

Seviyeyi KOD secer, model degil (AGENTS.md §1.1): siniflandirma icin bir
model cagirmak, ucuzlatmak istedigimiz cagriyi iki kez yapmak olurdu.
Uc seviye:

  alt   karar icermeyen duz sohbet — ucuz model, kisa baglam
  orta  oneri, ufuk genisletme, «beni analiz et»
  ust   karar, yol haritasi, sistemin tamamini degerlendirme

Belirsiz ve uzun mesaj ORTA'ya gider: ust'e gitmek pahali, alt'a gitmek
anlami kacirmak olurdu (§1.7).
"""

from core import seviye
from tests.harness import eq, ok, suite, test


def run():
    suite("konusma seviyesi")

    def t_plain_chat_is_low():
        for m in ("merhaba", "Selam, nasılsın?", "teşekkürler", "günaydın King",
                  "Bugün hava çok güzel", "İyi geceler", "sağ ol, anladım"):
            eq(seviye.sinifla(m)["seviye"], "alt", m)
    test("duz sohbet alt seviyededir", t_plain_chat_is_low)

    def t_suggestion_and_analysis_is_mid():
        for m in ("Uyku düzenim hakkında ne önerirsin?",
                  "Bu haftaki çalışmamı analiz eder misin?",
                  "Matematikte neden geride kaldığımı yorumla",
                  "Bana biraz tavsiye ver",
                  "Paragraf ile problem çalışmamı karşılaştır",
                  "Ufkumu genişletecek bir fikir söyle"):
            eq(seviye.sinifla(m)["seviye"], "orta", m)
    test("oneri ve analiz orta seviyededir", t_suggestion_and_analysis_is_mid)

    def t_decision_and_roadmap_is_high():
        for m in ("Önümüzdeki üç ayın yol haritasını çıkar",
                  "Hangisini seçmeliyim, karar veremiyorum",
                  "Bütün sistemi değerlendirip bana strateji kur",
                  "Bu ay neye öncelik vermeliyim?",
                  "Haftamı baştan planla",
                  "Sınava kadar ne yapmalıyım, derinlemesine düşün"):
            eq(seviye.sinifla(m)["seviye"], "ust", m)
    test("karar ve yol haritasi ust seviyededir", t_decision_and_roadmap_is_high)

    def t_high_wins_over_mid():
        """«Analiz edip karar ver» iki sinyal tasir: pahali olan kazanir,
        cunku karar isteyen mesaji ucuz modele vermek anlami kacirir."""
        eq(seviye.sinifla("Verilerimi analiz et ve bir karar ver")["seviye"], "ust")
    test("ust sinyal orta sinyali yener", t_high_wins_over_mid)

    def t_unknown_long_is_mid():
        m = ("Dün akşam kardeşimle uzun uzun konuştuk, okul, arkadaşlar, "
             "yaz tatili, biraz da gelecek yıl neler olabileceği üzerine, "
             "sonra geç yattım ve sabah zor kalktım, kahvaltıyı atladım, okula "
             "yetişmek için koştum ve ilk derste uyukladım")
        eq(seviye.sinifla(m)["seviye"], "orta")
        ok(seviye.sinifla(m)["neden"])
    test("sinyalsiz uzun mesaj ortaya gider", t_unknown_long_is_mid)

    def t_turkish_case_is_folded():
        """«İ» ve «I» Turkce kucultulur: «KARAR VER» ile «karar ver» aynidir."""
        eq(seviye.sinifla("HANGİSİNİ SEÇMELİYİM")["seviye"], "ust")
        eq(seviye.sinifla("ÖNERİ İSTİYORUM")["seviye"], "orta")
    test("buyuk harf ve Turkce harfler", t_turkish_case_is_folded)

    def t_reason_is_reported():
        r = seviye.sinifla("yol haritası çıkar")
        eq(r["seviye"], "ust")
        ok("yol harita" in r["neden"])
        # Neden kullanicinin yazdigi haliyle, duzgun Turkce gorunur.
        ok("«Öncelik" in seviye.sinifla("Öncelik sırası ne olmalı")["neden"])
    test("seviyenin nedeni soylenir", t_reason_is_reported)

    def t_ascii_typing_is_understood():
        """Telefonda Turkce harfsiz yazilir: «ne yapmaliyim» «ne
        yapmalıyım» ile aynidir. Once hicbir kalip tutmuyor, karar isteyen
        mesaj ucuz modele gidiyordu."""
        for m, s in (("ne yapmaliyim", "ust"), ("hangisini secmeliyim", "ust"),
                     ("oncelik sirasi ne olmali", "ust"), ("bir oneri ver", "orta"),
                     ("nasil gelistirebilirim", "orta"), ("tesekkurler", "alt")):
            eq(seviye.sinifla(m)["seviye"], s, m)
    test("Turkce harfsiz yazi da anlasilir", t_ascii_typing_is_understood)

    def t_common_forms():
        """Gunluk dilde karar ve oneri isteyen yaygin kaliplar."""
        for m, s in (("ne yapayım bu hafta", "ust"), ("ne yapsam", "ust"),
                     ("plan yap bana", "ust"), ("haftalık plan çıkar", "ust"),
                     ("hangisi daha mantıklı", "ust"), ("sence nasıl gidiyorum", "orta"),
                     ("ne dersin buna", "orta"), ("selam naber", "alt"),
                     ("bugün yoruldum", "alt")):
            eq(seviye.sinifla(m)["seviye"], s, m)
    test("yaygin karar ve oneri kaliplari", t_common_forms)

    def t_statement_is_not_a_request():
        """Karar BILDIRMEK karar ISTEMEK degildir; «neden olmasin» bir soru
        degildir. Pahali model bosuna cagrilmaz."""
        eq(seviye.sinifla("karar verdim, yarın başlıyorum")["seviye"], "alt")
        eq(seviye.sinifla("neden olmasın :)")["seviye"], "alt")
        # Ayni cumlede gercek bir istek varsa istek kazanir.
        eq(seviye.sinifla("karar verdim ama hangisini seçmeliyim bilemedim")["seviye"], "ust")
    test("bildirim istek sayilmaz", t_statement_is_not_a_request)

    def t_review_tool():
        """tools/seviye_gozden.py: son kullanici mesajlari, bugunku kurallarla
        seviyesi ve nedeni. Yonetici cevaplari listelenmez."""
        import importlib.util
        import os
        from core import db, patron
        yol = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                           "tools", "seviye_gozden.py")
        spec = importlib.util.spec_from_file_location("seviye_gozden", yol)
        g = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(g)
        con = db.connect(":memory:")
        patron.log(con, "local", "user", "selam")
        patron.log(con, "local", "manager", "Selam! Nasıl yardımcı olayım?")
        patron.log(con, "telegram", "user", "ne yapmaliyim bu hafta")
        liste = g.gozden(con, 10)
        eq([(s, m) for s, _, m in liste], [("ust", "ne yapmaliyim bu hafta"), ("alt", "selam")])
        ok(all(n for _, n, _ in liste))
    test("seviye gozden gecirme araci", t_review_tool)
