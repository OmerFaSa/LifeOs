# -*- coding: utf-8 -*-
"""King'in arac katalogu (core/arac.py) ve sohbetin arac turu.

Korunan soz: model yalniz SECER. Bilinmeyen arac ve gecersiz parametre
reddedilir; okuma sonucunun sayilari baglama girer ve cevap onlara karsi
denetlenir; yazan arac ikinci tur almaz. Ag'a cikilmaz.
"""

import json

from core import ai, arac, db, models, sohbet, sync_engine
from tests.harness import eq, metric, no, ok, suite, test

BUGUN = "2026-10-20"

KATALOG = [
    {"ad": "ays_denemeler", "aciklama": "Deneme kayıtları ve netler.", "tur": "oku",
     "parametreler": {"type": "object", "properties": {
         "aile": {"type": "string", "enum": ["TYT", "AYT"]},
         "limit": {"type": "integer", "minimum": 1, "maximum": 20}}}},
    {"ad": "kayit_gir", "aciklama": "Kullanıcının cümlesini modülün ayrıştırıcısıyla kayda çevirir.", "tur": "yaz",
     "parametreler": {"type": "object", "properties": {"metin": {"type": "string", "maxLength": 300}},
                      "required": ["metin"]}},
    {"ad": "sistem_haritasi", "aciklama": "Sistemde ne var, nerede.", "tur": "oku"},
]


def _con():
    con = db.connect(":memory:")
    sync_engine.ingest(con, {"module": "ays", "date": BUGUN,
                             "metrics": {"questions": metric(40)}}, now=BUGUN + "T09:00:00")
    return con


def _cfg(provider="google", model="gemini-2.5-flash"):
    cfg = {"local_token": "x",
           "budget": {"monthly_try": 850.0, "usd_try": 48.6, "rate_date": BUGUN, "ceiling_currency": "try"}}
    if provider == "yerel":
        return models.apply(cfg, {"yer": "yerel", "yerel": {"ekonomik": model}, "keys": {"yerel": "yerel"},
                                  "assignments": {"king": {"provider": "yerel", "model": model}}})
    return models.apply(cfg, {"keys": {"google": "AIza-test"},
                              "assignments": {"king": {"provider": provider, "model": model}}})


def _tasiyici(*cevaplar):
    """Sirayla cevap veren sahte saglayici. Cevap: (metin, cagrilar)."""
    sira = list(cevaplar)

    def t(provider, anahtar, model, sistem, mesajlar, ayar=None):
        t.gorulen.append({"sistem": sistem, "mesajlar": mesajlar, "ayar": dict(ayar or {})})
        metin, cagri = sira.pop(0) if sira else ("Tamam.", [])
        if isinstance(metin, Exception):
            raise metin
        return metin, 400, 40, False, {"cagrilar": cagri} if (ayar or {}).get("araclar") else {}
    t.gorulen = []
    return t


def run():
    suite("arac")

    def t_katalog():
        temiz, red = arac.katalog_temizle(KATALOG + [
            {"ad": "Kotu Ad", "aciklama": "x", "tur": "oku"},
            {"ad": "uydurma", "aciklama": "x", "tur": "sil"},
            {"ad": "sema", "aciklama": "x", "tur": "oku",
             "parametreler": {"type": "object", "properties": {"x": {"type": "array"}}}},
            {"ad": "ays_denemeler", "aciklama": "yinelenen", "tur": "oku"}])
        eq([a["ad"] for a in temiz], ["ays_denemeler", "kayit_gir", "sistem_haritasi"])
        eq(len(red), 4)
        eq(temiz[2]["parametreler"], {"type": "object", "properties": {}, "required": []})
    test("bozuk katalog satiri duser, nedeni yazilir", t_katalog)

    def t_dogrula():
        kat = arac.katalog_temizle(KATALOG)[0]
        g, red = arac.cagri_dogrula([
            {"ad": "ays_denemeler", "param": '{"aile":"TYT","limit":5}'},
            {"ad": "ays_denemeler", "param": {"aile": "LGS"}},
            {"ad": "ays_denemeler", "param": {"limit": 99}},
            {"ad": "ays_denemeler", "param": {"limit": "5"}},
            {"ad": "ays_denemeler", "param": {"gizli": 1}},
            {"ad": "kayit_gir", "param": {}},
            {"ad": "veriyi_sil", "param": {}},
            {"ad": "kayit_gir", "param": "{bozuk"},
        ], kat)
        eq(g, [{"ad": "ays_denemeler", "param": {"aile": "TYT", "limit": 5}, "tur": "oku"}])
        eq(len(red), 7)
        nedenler = " | ".join(r["neden"] for r in red)
        for parca in ("izinli", "en cok 20", "integer", "tanimsiz", "eksik parametre", "katalogda", "JSON"):
            ok(parca in nedenler, parca + " nedeni yok: " + nedenler)
    test("bilinmeyen arac ve gecersiz parametre reddedilir", t_dogrula)

    def t_bicimler():
        kat = arac.katalog_temizle(KATALOG)[0]
        o = arac.saglayici_araclari("yerel", kat)
        eq(o[0]["type"], "function")
        eq(o[0]["function"]["name"], "ays_denemeler")
        no("required" in o[0]["function"]["parameters"])
        eq(o[1]["function"]["parameters"]["required"], ["metin"])
        a = arac.saglayici_araclari("anthropic", kat)
        eq(a[1]["input_schema"]["properties"]["metin"]["type"], "string")
        g = arac.saglayici_araclari("google", kat)[0]["functionDeclarations"]
        no("parameters" in g[2], "parametresiz arac Gemini'ye bos sema gondermez")
        no("maxLength" in g[1]["parameters"]["properties"]["metin"])
        eq(arac.openai_cagrilari({"tool_calls": [{"function": {"name": "x_y", "arguments": "{}"}}]}),
           [{"ad": "x_y", "param": "{}"}])
        eq(arac.anthropic_cagrilari([{"type": "text"}, {"type": "tool_use", "name": "a_b", "input": {"k": 1}}]),
           [{"ad": "a_b", "param": {"k": 1}}])
        eq(arac.google_cagrilari([{"functionCall": {"name": "c_d", "args": {}}}]), [{"ad": "c_d", "param": {}}])
    test("katalog her saglayicinin bicimine cevrilir", t_bicimler)

    def t_aracsiz_liste():
        ok(arac.aracsiz_mi("gemma3:4b"))
        no(arac.aracsiz_mi("gemma4:e2b"))
        no(arac.aracsiz_mi("qwen3-vl:4b"))
    test("arac cagirmayan modeller bilinir", t_aracsiz_liste)

    def t_ilk_tur():
        con = _con()
        t = _tasiyici(("", [{"ad": "ays_denemeler", "param": {"aile": "TYT"}},
                            {"ad": "uydurma_arac", "param": {}}]))
        r = sohbet.konus(con, _cfg(), "son TYT denemelerim nasıldı", BUGUN, transport=t, araclar=KATALOG)
        eq(r["mode"], "arac")
        eq(r["cagrilar"], [{"ad": "ays_denemeler", "param": {"aile": "TYT"}, "tur": "oku"}])
        eq(r["reddedilen"][0]["ad"], "uydurma_arac")
        ok(t.gorulen[0]["ayar"].get("araclar"), "katalog saglayiciya gitmedi")
        ok("ARAÇLAR" in t.gorulen[0]["sistem"])
        no(con.execute("SELECT COUNT(*) FROM conversations").fetchone()[0], "okuma turu deftere erken yazildi")
    test("ilk tur: model secer, kod dogrular", t_ilk_tur)

    def t_ikinci_tur():
        con = _con()
        sonuc = [{"ad": "ays_denemeler", "sonuc": [{"tarih": "2026-10-12", "toplamNet": 63.25}]}]
        t = _tasiyici(("Son TYT denemende 63.25 net yaptın.", []))
        r = sohbet.konus(con, _cfg(), "son TYT denemelerim nasıldı", BUGUN, transport=t,
                         araclar=KATALOG, arac_sonuclari=sonuc)
        eq(r["mode"], "model")
        ok("63.25" in r["text"])
        ok("63.25" in t.gorulen[0]["sistem"], "arac sonucu baglama girmedi")
        no(t.gorulen[0]["ayar"].get("araclar"), "ikinci turda arac gitmemeli")
        # Sonucta olmayan sayi dusurulur (once duzeltme istenir, o da uydurursa duser).
        t2 = _tasiyici(("Son TYT denemende 71 net yaptın.", []), ("Son TYT denemende 72 net yaptın.", []))
        r2 = sohbet.konus(_con(), _cfg(), "son TYT denemelerim nasıldı", BUGUN, transport=t2,
                          araclar=KATALOG, arac_sonuclari=sonuc)
        no(r2["ok"], "uydurulmus net gecti")
        eq(r2["mode"], "yok")
    test("ikinci tur: sayi yalniz arac sonucundan", t_ikinci_tur)

    def t_kural_yolu_atlanir():
        # «durum» komuttur; ikinci turda kural yolu tekrar kosmaz.
        t = _tasiyici(("Durumun iyi.", []))
        r = sohbet.konus(_con(), _cfg(), "durum", BUGUN, transport=t, araclar=KATALOG,
                         arac_sonuclari=[{"ad": "sistem_haritasi", "sonuc": {"moduller": ["AYS"]}}])
        eq(r["mode"], "model")
        r0 = sohbet.konus(_con(), _cfg(), "durum", BUGUN, transport=_tasiyici(), araclar=KATALOG)
        eq(r0["mode"], "komut")
    test("kural yolu once, ikinci turda atlanir", t_kural_yolu_atlanir)

    def t_yazma_tek_tur():
        con = _con()
        t = _tasiyici(("", [{"ad": "kayit_gir", "param": {"metin": "matematikten 40 soru çözdüm"}}]))
        r = sohbet.konus(con, _cfg(), "bugün matematik kırk soru bitti", BUGUN, transport=t, araclar=KATALOG)
        eq(r["mode"], "arac")
        eq(r["cagrilar"][0]["tur"], "yaz")
        n = con.execute("SELECT COUNT(*) FROM conversations").fetchone()[0]
        eq(n, 2, "yazma cagrisi deftere bir kez yazilir")
    test("yazan arac: tek tur, onay istemcide", t_yazma_tek_tur)

    def t_gecersiz_cagri_olagan_cevaba_duser():
        t = _tasiyici(("", [{"ad": "hepsini_sil", "param": {}}]), ("Bunu yapamam ama yardım edebilirim.", []))
        r = sohbet.konus(_con(), _cfg(), "her şeyi uçur", BUGUN, transport=t, araclar=KATALOG)
        eq(r["mode"], "model")
        eq(r["arac_red"][0]["ad"], "hepsini_sil")
        no(t.gorulen[1]["ayar"].get("araclar"), "ikinci deneme aracsiz olmali")
    test("gecersiz cagri reddedilir, cevap araçsız sorulur", t_gecersiz_cagri_olagan_cevaba_duser)

    def t_aracsiz_model():
        # gemma3 araci desteklemez: katalog gitmez, olagan sohbet cevabi doner;
        # isi istemcinin kural yolu yapar. Yapilmamis isi anlatan cevap duzeltilir.
        cfg = _cfg("yerel", "gemma3:4b")
        t = _tasiyici(("Merhaba, buradayım.", []))
        r = sohbet.konus(_con(), cfg, "selamlar dostum nasıl gidiyor", BUGUN, transport=t, araclar=KATALOG)
        eq(r["mode"], "model")
        no(t.gorulen[0]["ayar"].get("araclar"))
        no("ARAÇLAR" in t.gorulen[0]["sistem"] and "ARAÇ:" in t.gorulen[0]["sistem"], "metin protokolu gitmemeli")
        t2 = _tasiyici(("Ekranı karartıyorum, karanlık mod aktif edildi.", []), ("Tamam, karanlık mod aktif edildi.", []))
        r2 = sohbet.konus(_con(), cfg, "ekranı karanlık yap", BUGUN, transport=t2, araclar=KATALOG)
        eq(r2["text"], sohbet.ARAC_YAPILMADI)
    test("arac desteklemeyen yerel modele katalog gitmez; «yaptım» denmez", t_aracsiz_model)

    def t_motor_reddederse():
        import io
        import urllib.error
        hata = urllib.error.HTTPError("http://x", 400, "Bad", {}, io.BytesIO(
            b'{"error":{"message":"registry.ollama.ai/library/eski:1b does not support tools"}}'))
        cfg = _cfg("yerel", "eski:1b")
        t = _tasiyici((hata, []), ("LifeOS'ta üç modül var.", []))
        r = sohbet.konus(_con(), cfg, "bu sistemde neler var", BUGUN, transport=t, araclar=KATALOG)
        eq(r["mode"], "model")
        eq(len(t.gorulen), 2)
        ok(t.gorulen[0]["ayar"].get("araclar"))
        no(t.gorulen[1]["ayar"].get("araclar"), "ikinci istek aracsiz olmali")
    test("motor «tools desteklenmez» derse bir kez aracsiz", t_motor_reddederse)

    def t_eski_istemci():
        # Katalog yollamayan istemci eskisi gibi konusur.
        t = _tasiyici(("Merhaba, buradayım.", []))
        r = sohbet.konus(_con(), _cfg(), "bana bir şey anlat", BUGUN, transport=t)
        eq(r["mode"], "model")
        no(t.gorulen[0]["ayar"].get("araclar"))
    test("katalogsuz istek eski yoldan gider", t_eski_istemci)

    def t_yapilmamis_is():
        # Sahada (gemma3:4b, 2026-10-20): «Ekranı karartıyorum.» — arac cagirmadan.
        t = _tasiyici(("Elbette, ekranı karartıyorum.", []),
                      ("", [{"ad": "ayar_degistir", "param": {"ayar": "tema", "deger": "koyu"}}]))
        kat = KATALOG + [{"ad": "ayar_degistir", "aciklama": "Tema.", "tur": "yaz", "parametreler": {
            "type": "object", "properties": {"ayar": {"type": "string"}, "deger": {"type": "string"}}}}]
        r = sohbet.konus(_con(), _cfg(), "ekranı karanlık yap", BUGUN, transport=t, araclar=kat)
        eq(r["mode"], "arac")
        ok("araç çağırmadan" in t.gorulen[1]["sistem"])
        t2 = _tasiyici(("Tamam, kayda ekliyorum.", []), ("Kaydettim bile.", []))
        r2 = sohbet.konus(_con(), _cfg(), "bunu bir yere yaz", BUGUN, transport=t2, araclar=KATALOG)
        eq(r2["text"], sohbet.ARAC_YAPILMADI)
        # Kucuk modelin tirnaksiz nesnesi bir kez duzeltilir; bozuk olan reddedilir.
        eq(arac.gevsek_json("{limit: 3, aile: 'TYT'}"), {"limit": 3, "aile": "TYT"})
        eq(arac.gevsek_json("{bozuk"), None)
    test("arac cagirmadan «yaptim» denmez", t_yapilmamis_is)

    def t_uc():
        # /api/chat ve /api/chat/akis katalogu ve sonuclari konus'a tasir.
        from tests.test_daemon import _Server
        s = _Server()
        try:
            gorulen = []
            eski = sohbet.konus

            def sahte(con_, cfg, metin, gun, **kw):
                gorulen.append((kw.get("araclar"), kw.get("arac_sonuclari")))
                return {"ok": True, "mode": "arac", "text": "", "cagrilar": [{"ad": "sistem_haritasi", "param": {}, "tur": "oku"}]}
            sohbet.konus = sahte
            try:
                st, r = s.call("/api/chat", body={"text": "neler var", "araclar": KATALOG})
                eq((st, r["mode"]), (200, "arac"))
                eq(gorulen[-1], (KATALOG, None))
                s.call("/api/chat/akis", body={"text": "neler var", "araclar": KATALOG,
                                               "arac_sonuclari": [{"ad": "sistem_haritasi", "sonuc": {}}]})
                eq(gorulen[-1][1], [{"ad": "sistem_haritasi", "sonuc": {}}])
                s.call("/api/chat", body={"text": "neler var", "araclar": "liste degil"})
                eq(gorulen[-1], (None, None))
            finally:
                sohbet.konus = eski
        finally:
            s.close()
    test("uc: katalog ve sonuclar sohbete tasinir; liste olmayan alinmaz", t_uc)

    _ = ai  # ai.ask arac parametresini tasir (yukaridaki turlar)
