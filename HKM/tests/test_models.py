# -*- coding: utf-8 -*-
"""Saglayicilar ve gorev dagilimi.

Bu paket bir ozelligi degil bir SOZU korur: model otorite degildir.
Butun anahtarlar bos olsa sistem aynen calisir; hicbir atama bir esigi,
bir hukmu ya da bir onceligi degistirmez.
"""

from core import models, settings
from tests.harness import eq, no, ok, suite, test


def run():
    suite("saglayicilar")

    def t_default_is_off():
        """Varsayilan KAPALI: hicbir kademe kendiliginden bir modele
        baglanmaz. Uydurulmus bir varsayilan, kullanicinin secmedigi bir
        modele para odemesi demektir."""
        cfg = {"local_token": "x"}
        eq(models.keys(cfg), {})
        for rol in models.ROLES:
            a = models.resolve(cfg, rol)
            eq(a["provider"], None)
            eq(a["key_set"], False)
    test("varsayilan olarak hicbir kademe bagli degil", t_default_is_off)

    def t_inheritance():
        """Atama yoksa USTUNE bakilir. King'e atanan model, atanmamis
        butun kademelere miras kalir; kendi atamasi olan onu yener."""
        cfg = models.apply({"local_token": "x"}, {
            "keys": {"anthropic": "sk-test-1234"},
            "assignments": {"king": {"provider": "anthropic",
                                     "model": "claude-opus-5"}}})
        k = models.resolve(cfg, "king")
        eq(k["provider"], "anthropic")
        eq(k["inherited"], False)
        eq(k["key_set"], True)

        miras = models.resolve(cfg, "spi.sohbet")
        eq(miras["provider"], "anthropic")
        eq(miras["from"], "king")
        ok(miras["inherited"])
        eq(miras["chain"], ["spi.sohbet", "vp_bio", "king"])

        # Kendi atamasi USTUNU yener.
        cfg = models.apply(cfg, {"keys": {"openai": "sk-oai"},
                                 "assignments": {"spi.sohbet": {
                                     "provider": "openai", "model": "gpt-5-mini"}}})
        kendi = models.resolve(cfg, "spi.sohbet")
        eq(kendi["provider"], "openai")
        eq(kendi["model"], "gpt-5-mini")
        eq(kendi["inherited"], False)
        # Kardesi etkilenmez: atama kademe kademedir.
        eq(models.resolve(cfg, "spi.plan")["provider"], "anthropic")
    test("atama miras alir, kendi atamasi ustunu yener", t_inheritance)

    def t_unknown_role_refused():
        """Kademe listesi KAPALI bir kumedir: serbest bir anahtar-deger
        deposu degildir."""
        ok_, hata = models.validate({"assignments": {"kral": {
            "provider": "anthropic"}}})
        no(ok_)
        ok(any("bilinmeyen kademe" in h for h in hata))
        ok_, hata = models.validate({"keys": {"benimki": "x"}})
        no(ok_)
        ok_, hata = models.validate({"bilinmeyen": {}})
        no(ok_)
    test("bilinmeyen kademe ve saglayici reddedilir", t_unknown_role_refused)

    def t_model_without_provider_refused():
        """Saglayicisiz model, hicbir yere gitmeyen bir ayardir."""
        ok_, hata = models.validate({"assignments": {"king": {
            "model": "claude-opus-5"}}})
        no(ok_)
        ok(any("sağlayıcı seçilmedi" in h for h in hata))
    test("saglayicisiz model reddedilir", t_model_without_provider_refused)

    def t_key_never_leaves():
        """Anahtar disari MASKELI cikar: «kurulu mu» bilgisi verilir,
        degerin kendisi verilmez."""
        gizli = "sk-ant-cok-gizli-bir-anahtar"
        cfg = models.apply({"local_token": "x"}, {"keys": {"anthropic": gizli}})
        disari = settings.read(cfg)
        metin = repr(disari)
        no(gizli in metin)
        ant = [p for p in disari["models"]["providers"]
               if p["id"] == "anthropic"][0]
        eq(ant["key_set"], True)
        ok(ant["key_hint"].startswith("••"))
        # Maskede yalniz son iki karakter gorunur.
        ok(ant["key_hint"].endswith(gizli[-2:]))
        eq(len(ant["key_hint"]), 8)
    test("anahtar disari cikmaz, maskeli cikar", t_key_never_leaves)

    def t_empty_string_clears_key():
        """Bir sirri silmenin yolu, dosyayi elle duzenlemek olmamali."""
        cfg = models.apply({"local_token": "x"}, {"keys": {"openai": "sk-1"}})
        eq(models.keys(cfg)["openai"], "sk-1")
        cfg = models.apply(cfg, {"keys": {"openai": ""}})
        no(models.keys(cfg).get("openai"))
    test("bos dize anahtari siler", t_empty_string_clears_key)

    def t_assignment_can_be_removed():
        cfg = models.apply({"local_token": "x"}, {"assignments": {
            "king": {"provider": "anthropic", "model": "claude-opus-5"}}})
        eq(models.resolve(cfg, "king")["provider"], "anthropic")
        cfg = models.apply(cfg, {"assignments": {"king": None}})
        eq(models.resolve(cfg, "king")["provider"], None)
    test("atama kaldirilabilir", t_assignment_can_be_removed)

    def t_probe_says_set_is_not_working():
        """«Kurulu» ile «calisiyor» ayri seylerdir."""
        cfg = {"local_token": "x"}
        r = models.probe(cfg, "anthropic")
        no(r["ok"])
        eq(r["reason"], "no-key")

        cfg = models.apply(cfg, {"keys": {"anthropic": "sk-yanlis"}})
        # Ag'a CIKILMAZ: tasiyici enjekte edilir.
        r = models.probe(cfg, "anthropic",
                         transport=lambda *a: {"ok": False, "status": 401,
                                               "reason": "unauthorized",
                                               "note": "Anahtar reddedildi."})
        no(r["ok"])
        eq(r["reason"], "unauthorized")
        # Kurulu olmasi calistigi anlamina gelmez: read() hala «kurulu» der.
        ant = [p for p in settings.read(cfg)["models"]["providers"]
               if p["id"] == "anthropic"][0]
        eq(ant["key_set"], True)
    test("kurulu olmak calismak degildir", t_probe_says_set_is_not_working)

    def t_probe_unknown_provider():
        r = models.probe({"local_token": "x"}, "bilinmeyen")
        no(r["ok"])
        eq(r["reason"], "unknown-provider")
    test("bilinmeyen saglayici sinanmaz", t_probe_unknown_provider)

    def t_hierarchy_is_complete():
        """Uc kademe, uc konsey uyesi, uc modul x dort yetenek."""
        kat = {k["layer"]: k for k in models.layers()}
        eq(len(kat["king"]["roles"]), 1)
        eq(len(kat["konsey"]["roles"]), 3)
        eq(len(kat["modul"]["roles"]), 12)
        # Her modul yetenegi kendi VP'sine, her VP king'e baglidir.
        eq(models.ROLES["spi.gorsel"]["parent"], "vp_bio")
        eq(models.ROLES["ays.plan"]["parent"], "vp_academic")
        eq(models.ROLES["esp.analiz"]["parent"], "vp_intellect")
        for vp in ("vp_bio", "vp_academic", "vp_intellect"):
            eq(models.ROLES[vp]["parent"], "king")
        eq(models.ROLES["king"]["parent"], None)
    test("hiyerarsi eksiksiz", t_hierarchy_is_complete)

    def t_screen_names_are_turkish():
        """Anahtar ASCII'dir, EKRAN ADI Turkcedir: capitalize() ile uretilen
        «Gorsel», anahtari kullaniciya gostermenin kibar bicimiydi."""
        eq(models.ROLES["spi.gorsel"]["label"], "SPİ · Görsel")
        ok("SPİ" in models.ROLES["vp_bio"]["label"])
    test("ekran adlari duzgun Turkce", t_screen_names_are_turkish)

    def t_settings_round_trip():
        """Yama settings uzerinden de gecmeli: iki kapi, tek dogrulama."""
        cfg = {"local_token": "degismemeli"}
        yama = {"models": {"keys": {"google": "AIza-test"},
                           "assignments": {"esp.gorsel": {
                               "provider": "google",
                               "model": "gemini-2.5-pro"}}}}
        ok_, hata = settings.validate(yama)
        ok(ok_)
        yeni = settings.apply(cfg, yama)
        eq(yeni["local_token"], "degismemeli")
        eq(models.resolve(yeni, "esp.gorsel")["model"], "gemini-2.5-pro")
        # Bozuk yama hicbir sey yazmaz.
        ok_, hata = settings.validate({"models": {"assignments": {
            "esp.gorsel": {"provider": "yok-boyle"}}}})
        no(ok_)
    test("ayar kapisindan da ayni sozlesme gecer", t_settings_round_trip)

    def t_apply_is_not_a_validator():
        """apply() bir dogrulayici gibi davranmamali.

        Bir sure bu govdenin icinde validate()'in zamanlama blogunun bir
        KOPYASI duruyordu; orada tanimsiz olan `hata` listesine yazdigi
        icin, gecersiz bir zamanlama degeriyle cagrildiginda NameError ile
        COKUYORDU. Iki yerde iki dogrulama, bir gun birbirinden ayrilir."""
        yeni = settings.apply({"local_token": "x"},
                              {"schedule": {"morning": "8"}})
        eq(yeni["schedule"]["morning"], "8")
        eq(yeni["local_token"], "x")
        # Ayni deger validate()'ten GECMEZ: dogrulama orada yapilir.
        ok_, hata = settings.validate({"schedule": {"morning": "8"}})
        no(ok_)
        ok(any("SS:DD" in h for h in hata))
    test("apply bir dogrulayici degildir", t_apply_is_not_a_validator)

    def t_probe_uses_a_verifying_endpoint():
        """Bos bir POST'a 400 donmesi, anahtarin gecerli oldugunu
        KANITLAMAZ; ustelik Google'in o adresi POST kabul etmez ve 404
        doner — dogru anahtar girmis kullanici «basarisiz» goruyordu.

        Her saglayicinin, kimlik dogrulayan ve para harcamayan bir GET
        ucu olmali."""
        for ad, tanim in models.PROVIDERS.items():
            ok(tanim.get("probe"), ad)
            ok(str(tanim["probe"]).startswith("http"), ad)
        # Sohbet ucu ile sinama ucu AYNI sey degildir.
        no(models.PROVIDERS["google"]["probe"].endswith(":generateContent"))
        ok(models.PROVIDERS["openrouter"]["probe"].endswith("/key"))
    test("sinama, dogrulayan bir uc kullanir",
         t_probe_uses_a_verifying_endpoint)

    def t_probe_reasons_are_distinct():
        """404 bir ANAHTAR hatasi degildir; 429 anahtarin gecersiz oldugu
        anlamina gelmez. Hepsine «basarisiz» demek, kullaniciyi yanlis
        yere bakmaya gonderir."""
        import io
        import urllib.error
        cfg = models.apply({"local_token": "x"}, {"keys": {"openai": "sk-1"}})

        def _hata(kod):
            def t(provider, tanim, anahtar):
                raise urllib.error.HTTPError(
                    tanim["probe"], kod, "", None, io.BytesIO(b"{}"))
            return t
        # transport enjekte edilirse probe onu cagirir; burada gercek
        # HTTP yolunu olcmek icin transport YOK, _cagir yerine
        # urlopen'i degistirmek yerine sonuclarin AYRILIGINI olcuyoruz.
        eq(models.probe({"local_token": "x"}, "openai")["reason"], "no-key")
        eq(models.probe(cfg, "bilinmeyen")["reason"], "unknown-provider")
        # Not metinleri birbirinden AYRI: aynilarsa ayirmanin anlami yok.
        notlar = set()
        for r in (models.probe({"local_token": "x"}, "openai"),
                  models.probe(cfg, "bilinmeyen")):
            notlar.add(r["note"])
        eq(len(notlar), 2)
    test("sinama sebepleri birbirinden ayri", t_probe_reasons_are_distinct)

    def t_many_keys_per_provider():
        """Bir saglayicinin BIRDEN COK anahtari olabilir: iki kisi ayni
        sistemi kullaniyorsa harcamalari da ayri gorunmeli."""
        cfg = models.apply({"local_token": "x"}, {"keys": {"openrouter": [
            {"label": "Benim", "key": "sk-or-ben", "user": "ben"},
            {"label": "Kardesim", "key": "sk-or-kardes", "user": "kardes"}]}})
        liste = models.key_list(cfg, "openrouter")
        eq(len(liste), 2)
        eq([e["label"] for e in liste], ["Benim", "Kardesim"])
        # Kimlikler AYRI ve her biri kendi degerini tasir.
        eq(len({e["id"] for e in liste}), 2)
        eq(models.key_value(cfg, "openrouter", liste[1]["id"]), "sk-or-kardes")
        # Secim yoksa ILK anahtar gecerlidir.
        eq(models.key_value(cfg, "openrouter"), "sk-or-ben")
    test("bir saglayicinin birden cok anahtari olur",
         t_many_keys_per_provider)

    def t_old_single_key_still_works():
        """Tek dizeli eski yapilandirma yeni kodla CALISMAYA DEVAM EDER:
        kullanicinin dosyayi elle donusturmesi gereken bir surum
        yukseltmesi, kurulumu bozmanin sessiz yoludur."""
        cfg = {"local_token": "x", "models": {"keys": {"google": "AIza-eski"}}}
        eq(models.key_value(cfg, "google"), "AIza-eski")
        eq(models.keys(cfg)["google"], "AIza-eski")
        eq(len(models.key_list(cfg, "google")), 1)
    test("tek anahtarli eski yapilandirma calisir",
         t_old_single_key_still_works)

    def t_blank_value_keeps_the_secret():
        """Ekran maskeyi geri gonderir. Bos deger sirri SILSEYDI,
        kaydetmek tehlikeli bir is olurdu."""
        cfg = models.apply({"local_token": "x"}, {"keys": {"openai": [
            {"label": "Tek", "key": "sk-gizli"}]}})
        kimlik = models.key_list(cfg, "openai")[0]["id"]
        # Yalniz adi degistir: deger bos gelir.
        cfg = models.apply(cfg, {"keys": {"openai": [
            {"id": kimlik, "label": "Yeni ad", "key": ""}]}})
        eq(models.key_value(cfg, "openai", kimlik), "sk-gizli")
        eq(models.key_list(cfg, "openai")[0]["label"], "Yeni ad")
        # Listeden CIKARMAK siler.
        cfg = models.apply(cfg, {"keys": {"openai": []}})
        eq(models.key_list(cfg, "openai"), [])
    test("bos deger sirri korur, listeden cikarmak siler",
         t_blank_value_keeps_the_secret)

    def t_deleted_key_is_not_silently_replaced():
        """Secilen anahtar silinmisse baska bir anahtara SESSIZCE
        gecilmez: bu, baskasinin hesabindan para harcamak olurdu."""
        cfg = models.apply({"local_token": "x"}, {"keys": {"openrouter": [
            {"label": "Benim", "key": "sk-ben", "user": "ben"},
            {"label": "Kardesim", "key": "sk-kardes", "user": "kardes"}]}})
        ikinci = models.key_list(cfg, "openrouter")[1]["id"]
        cfg = models.apply(cfg, {"assignments": {"king": {
            "provider": "openrouter", "model": "m", "key": ikinci}}})
        a = models.resolve(cfg, "king")
        eq(a["key_id"], ikinci)
        eq(a["key_user"], "kardes")
        ok(a["key_set"])

        # Kardesin anahtari silinir: ILK anahtara kaymaz, SOYLER.
        birinci = models.key_list(cfg, "openrouter")[0]
        cfg = models.apply(cfg, {"keys": {"openrouter": [
            {"id": birinci["id"], "label": birinci["label"], "key": ""}]}})
        a = models.resolve(cfg, "king")
        ok(a["key_missing"])
        no(a["key_set"])
        eq(models.key_value(cfg, "openrouter", ikinci), None)
    test("silinen anahtarin yerine sessizce baskasi konmaz",
         t_deleted_key_is_not_silently_replaced)

    def t_reused_id_would_repoint_an_assignment():
        """Silinen bir kimlik YENIDEN KULLANILMAZ: kimligi geri vermek,
        eski bir atamayi sessizce baska bir anahtara baglardi."""
        cfg = models.apply({"local_token": "x"}, {"keys": {"google": [
            {"label": "Bir", "key": "a"}]}})
        ilk = models.key_list(cfg, "google")[0]["id"]
        cfg = models.apply(cfg, {"keys": {"google": []}})
        cfg = models.apply(cfg, {"keys": {"google": [
            {"label": "Iki", "key": "b"}]}})
        yeni = models.key_list(cfg, "google")[0]["id"]
        no(yeni == ilk)
        # Sayac YAMADAN GELMEZ: istemcinin yazabildigi bir sayac, kimlik
        # geri vermenin kapisi olurdu.
        ok_, hata = models.validate({"key_seq": {"google": 0}})
        no(ok_)
    test("silinen kimlik yeniden kullanilmaz",
         t_reused_id_would_repoint_an_assignment)

    def t_key_list_never_leaves_unmasked():
        """Anahtarlar TEK TEK cikar — ama degerleri degil, maskeleri."""
        gizli = "sk-or-cok-gizli-ikinci"
        cfg = models.apply({"local_token": "x"}, {"keys": {"openrouter": [
            {"label": "Benim", "key": "sk-or-birinci"},
            {"label": "Kardesim", "key": gizli}]}})
        disari = settings.read(cfg)
        no(gizli in repr(disari))
        orr = [p for p in disari["models"]["providers"]
               if p["id"] == "openrouter"][0]
        eq(len(orr["keys"]), 2)
        ok(orr["keys"][1]["hint"].endswith(gizli[-2:]))
        eq(orr["keys"][1]["label"], "Kardesim")
    test("anahtar listesi maskeli cikar", t_key_list_never_leaves_unmasked)

    def t_valueless_new_key_refused():
        """Adi olan ama degeri olmayan bir anahtar, kurulu sanilan bir
        bosluktur."""
        ok_, hata = models.validate({"keys": {"openai": [
            {"label": "Bos", "key": ""}]}})
        no(ok_)
        ok(any("boş olamaz" in h for h in hata))
        ok_, hata = models.validate({"keys": {"openai": [
            {"label": "Bir", "key": "a", "bilinmeyen": 1}]}})
        no(ok_)
    test("degersiz yeni anahtar reddedilir", t_valueless_new_key_refused)
