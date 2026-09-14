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
