# -*- coding: utf-8 -*-
"""Motor — gereken zeka, gereken yerde, en dusuk maliyetle.

Dort model sinifi (ekonomik < standart < guclu < uzman). Paket her
seviye icin BASLANGIC ve TAVAN sinifini soyler; sistem baslangictan
dener, model ZORLANIRSA bir ust sinifa cikar. Guclu modeller surekli
calisan bir motor degil, gerektiginde cagrilan uzmanlardir.

Kanitlanan sozler:
  1. Paket yoksa ya da kademenin KENDI atamasi varsa merdiven kurulmaz:
     kullanicinin secimi kazanir.
  2. Zorlanma: cevap dusuruldu, saglayici hata verdi, kisaltmaya ragmen
     kesildi ya da alt model «[[YUKSELT]]» dedi. Butce engelinde
     YUKSELINMEZ — ust basamak daha pahalidir.
  3. Butce bantlarinda (%80, %95) yonlendirme ekonomiklesir ve bu SOYLENIR.
  4. Efor paketten gelir ve cagriya gider.
"""

import datetime

from core import ai, butce, db, models, motor
from tests.harness import eq, no, ok, suite, test

BUGUN = datetime.date.today().isoformat()


def _cfg(paket="S", tavan=20.0, **atama):
    cfg = {"local_token": "x",
           "budget": {"ceiling_currency": "usd", "monthly_usd": tavan}}
    yama = {"keys": {"openrouter": "sk-or-test"}}
    if atama:
        yama["assignments"] = atama
    cfg = models.apply(cfg, yama)
    if paket:
        cfg = models.apply(cfg, {"paket": paket})
    return cfg


def _tasiyici(*cevaplar):
    """Sirayla cevap veren sahte saglayici; her cagriyi kaydeder."""
    kayit = []

    def t(provider, anahtar, model, sistem, mesajlar, ayar=None):
        kayit.append({"model": model, "sistem": sistem, "ayar": ayar or {},
                      "mesaj_sayisi": len(mesajlar)})
        c = cevaplar[min(len(kayit) - 1, len(cevaplar) - 1)]
        if isinstance(c, Exception):
            raise c
        return c, 100, 20
    t.kayit = kayit
    return t


def _mesaj():
    return [{"role": "user", "content": "merhaba"}]


def run():
    suite("motor")

    def t_package_is_validated():
        ok_, hata = models.validate({"paket": "Z"})
        no(ok_)
        for p in ("A", "A+", "S", "S+", "", None):
            ok(models.validate({"paket": p})[0], p)
        eq(models.paket_of(_cfg("S+")), "S+")
        eq(models.paket_of(models.apply(_cfg("S"), {"paket": ""})), None)
    test("paket dogrulanir ve saklanir", t_package_is_validated)

    def t_ladder_follows_package():
        cfg = _cfg("S")
        m = motor.merdiven(None, cfg, "seviye.alt")
        eq([b["sinif"] for b in m["basamaklar"]], ["ekonomik", "standart"])
        eq(m["basamaklar"][0]["atama"]["model"], motor.SINIF_MODELI["metin"]["ekonomik"])
        eq(m["basamaklar"][0]["ayar"]["efor"], "low")
        u = motor.merdiven(None, cfg, "king", seviye="ust")
        eq([b["sinif"] for b in u["basamaklar"]], ["guclu", "uzman"])
        eq(u["basamaklar"][0]["ayar"]["efor"], "high")
        eq([b["sinif"] for b in motor.merdiven(None, _cfg("S+"), "king", seviye="ust")["basamaklar"]],
           ["uzman"])
        eq([b["sinif"] for b in motor.merdiven(None, _cfg("A"), "king", seviye="ust")["basamaklar"]],
           ["standart", "guclu"])
    test("merdiven paketi izler", t_ladder_follows_package)

    def t_packages_rise_in_quality():
        """A verim, S+ kalite: paket yukseldikce hicbir seviyenin baslangic
        ya da tavan sinifi DUSMEZ."""
        sira = {s: i for i, s in enumerate(motor.SINIFLAR)}
        for sv in motor.POLITIKA_SEVIYELERI:
            onceki = (-1, -1)
            for pid in ("A", "A+", "S", "S+"):
                bas, tavan, _ = motor.PAKET_POLITIKASI[pid][sv]
                simdi = (sira[bas], sira[tavan])
                ok(simdi[0] >= onceki[0] and simdi[1] >= onceki[1], "%s %s" % (pid, sv))
                ok(simdi[0] <= simdi[1])
                onceki = simdi
    test("paketler kaliteye dogru yukselir", t_packages_rise_in_quality)

    def t_manual_and_no_package_keep_old_behaviour():
        cfg = _cfg(None, king={"provider": "openrouter", "model": "x/elle"})
        m = motor.merdiven(None, cfg, "king", seviye="ust")
        eq(len(m["basamaklar"]), 1)
        eq(m["basamaklar"][0]["atama"]["model"], "x/elle")
        cfg = _cfg("S", king={"provider": "openrouter", "model": "x/elle"})
        eq(motor.merdiven(None, cfg, "king", seviye="ust")["basamaklar"][0]["atama"]["model"], "x/elle")
    test("elle atama ve paketsiz kurulum eskisi gibi", t_manual_and_no_package_keep_old_behaviour)

    def t_escalates_when_answer_is_dropped():
        con = db.connect(":memory:")
        cfg = _cfg("S")
        uydurma = "Uykun dün 9.7 saatti."
        t = _tasiyici(uydurma, uydurma, "Merhaba, buradayım.")
        r = ai.ask(con, cfg, "seviye.alt", "sohbet", _mesaj(), baglam="Tarih: x",
                   sistem="s", transport=t, seviye="alt")
        ok(r["ok"])
        eq(r["text"], "Merhaba, buradayım.")
        eq(r["motor"]["sinif"], "standart")
        ok(r["motor"]["yukseldi"])
        eq([k["model"] for k in t.kayit][-1], motor.SINIF_MODELI["metin"]["standart"])
        satir = con.execute("SELECT escalated FROM usage ORDER BY id DESC LIMIT 1").fetchone()
        eq(satir["escalated"], 1)
    test("dusurulen cevap bir ust sinifa cikar", t_escalates_when_answer_is_dropped)

    def t_escalates_on_marker_and_top_has_no_marker_rule():
        con = db.connect(":memory:")
        t = _tasiyici("[[YUKSELT]]", "Bu kararı birlikte tartalım.")
        r = ai.ask(con, _cfg("S"), "king", "sohbet", _mesaj(), baglam="Tarih: x",
                   sistem="s", transport=t, seviye="ust")
        ok(r["ok"])
        no("YUKSELT" in r["text"])
        eq(r["motor"]["sinif"], "uzman")
        ok(motor.YUKSELT_KURALI in t.kayit[0]["sistem"])
        no(motor.YUKSELT_KURALI in t.kayit[-1]["sistem"])      # son basamak cikamaz
    test("alt model yardim isteyince cikilir", t_escalates_on_marker_and_top_has_no_marker_rule)

    def t_provider_error_escalates_budget_does_not():
        con = db.connect(":memory:")
        t = _tasiyici(OSError("baglanti"), "Tamam.")
        r = ai.ask(con, _cfg("S"), "seviye.alt", "sohbet", _mesaj(), baglam="",
                   sistem="s", transport=t, seviye="alt")
        ok(r["ok"])
        eq(r["motor"]["sinif"], "standart")
        con2 = db.connect(":memory:")
        cfg = _cfg("S", tavan=0.01)
        butce.record(con2, role="king", task="sohbet", provider="openrouter", model="x",
                     usd=0.02)
        t2 = _tasiyici("Tamam.")
        r2 = ai.ask(con2, cfg, "seviye.alt", "sohbet", _mesaj(), baglam="", sistem="s",
                    transport=t2, seviye="alt")
        no(r2["ok"])
        eq(r2["reason"], "budget")
        eq(t2.kayit, [])
    test("saglayici hatasi cikar, butce engeli cikmaz", t_provider_error_escalates_budget_does_not)

    def t_effort_reaches_the_call():
        con = db.connect(":memory:")
        t = _tasiyici("Planı birlikte kuralım.")
        ai.ask(con, _cfg("S"), "king", "sohbet", _mesaj(), baglam="", sistem="s",
               transport=t, seviye="ust")
        eq(t.kayit[0]["ayar"].get("efor"), "high")
        ok(t.kayit[0]["ayar"].get("jeton"))
    test("efor cagriya gider", t_effort_reaches_the_call)

    def t_economy_mode_at_budget_bands():
        """%80'de tavan bir sinif iner, %95'te standart'i gecmez ve
        ekonomik'ten baslar. Kullaniciya SOYLENIR."""
        cfg = _cfg("S", tavan=10.0)
        con = db.connect(":memory:")
        butce.record(con, role="king", task="sohbet", provider="openrouter", model="x", usd=8.1)
        m = motor.merdiven(con, cfg, "king", seviye="ust")
        eq([b["sinif"] for b in m["basamaklar"]], ["guclu"])
        ok(m["ekonomi"] and "%80" in m["ekonomi"]["not"])
        butce.record(con, role="king", task="sohbet", provider="openrouter", model="x", usd=1.5)
        m = motor.merdiven(con, cfg, "king", seviye="ust")
        eq([b["sinif"] for b in m["basamaklar"]], ["ekonomik", "standart"])
        ok("%95" in m["ekonomi"]["not"])
        eq(motor.merdiven(db.connect(":memory:"), cfg, "king", seviye="ust")["ekonomi"], None)
    test("butce bantlarinda yonlendirme ekonomiklesir", t_economy_mode_at_budget_bands)

    def t_voice_needs_google():
        m = motor.merdiven(None, _cfg("S"), "medya")
        no(m["ok"])
        ok("Google" in m["note"])
        cfg = models.apply(_cfg("S"), {"keys": {"google": "AIza-x"}})
        m = motor.merdiven(None, cfg, "medya")
        ok(m["ok"])
        eq(m["basamaklar"][0]["atama"]["provider"], "google")
    test("ses yalniz Google anahtariyla", t_voice_needs_google)

    def t_chat_picks_level_from_message():
        """Sohbette seviye MESAJDAN secilir: «merhaba» ekonomik modelle,
        «yol haritasi» guclu modelle baslar; cevap hangi sinifla ve neden
        verildigini tasir (ekranda kucuk bir satir)."""
        from core import sohbet
        cfg = _cfg("S")
        con = db.connect(":memory:")
        t = _tasiyici("Merhaba!")
        r = sohbet.konus(con, cfg, "merhaba nasılsın", BUGUN, transport=t)
        ok(r["ok"], r)
        eq(t.kayit[0]["model"], motor.SINIF_MODELI["metin"]["ekonomik"])
        eq(r["motor"]["seviye"], "alt")
        ok(r["motor"]["neden"])
        t2 = _tasiyici("Üç aylık planı birlikte kuralım.")
        r2 = sohbet.konus(con, cfg, "Fizik mi kimya mı, hangisini seçmeliyim?", BUGUN, transport=t2)
        ok(r2["ok"], r2)
        eq(t2.kayit[0]["model"], motor.SINIF_MODELI["metin"]["guclu"])
        eq(r2["motor"]["seviye"], "ust")
    test("sohbet seviyeyi mesajdan secer", t_chat_picks_level_from_message)

    def t_preview_writes_nothing_and_estimates_from_measurement():
        """Onizleme hicbir sey yazmaz. Aylik tahmin OLCUMDEN: son 30 gunun
        jetonu x baslangic sinifinin tarifesi (+ olculen yukselme payi bir
        ust sinifla). Olcum yoksa sayi uydurulmaz."""
        cfg = _cfg(None)
        con = db.connect(":memory:")
        o = motor.onizleme(cfg, con=con, bugun="2026-09-26")
        eq([p["id"] for p in o["paketler"]], ["A", "A+", "S", "S+"])
        for p in o["paketler"]:
            eq(p["aylik"], None)
        ok(o["olcum_notu"])
        eq(o["aktif"], None)
        now = datetime.datetime(2026, 9, 20, 12, 0)
        butce.record(con, role="king", task="sohbet", provider="openrouter", model="x",
                     in_tok=1_000_000, out_tok=1_000_000, note="seviye=alt", now=now)
        o = motor.onizleme(cfg, con=con, bugun="2026-09-26")
        eq(o["yukselme_orani"], 0.0)
        for p in o["paketler"]:
            bas = motor.PAKET_POLITIKASI[p["id"]]["alt"][0]
            g, c = ai.FIYAT[motor.SINIF_MODELI["metin"][bas]]
            eq(p["aylik"], round(g + c, 2), p["id"])
        ok(o["paketler"][0]["aylik"] <= o["paketler"][-1]["aylik"])
        eq(motor.onizleme(_cfg("S+"))["aktif"], "S+")
    test("onizleme olcumden tahmin eder, yazmaz",
         t_preview_writes_nothing_and_estimates_from_measurement)

    def t_account_errors_do_not_climb():
        """Anahtar reddi ya da bakiye yoksa ayni anahtarla ust basamak ayni
        hatayi alir: merdiven bosuna cikilmaz, tek cagri yapilir."""
        import io
        import urllib.error
        con = db.connect(":memory:")
        def red(*a, **k):
            raise urllib.error.HTTPError("u", 401, "x", {}, io.BytesIO(b'{"error":{"message":"bad key"}}'))
        t = _tasiyici(None)
        kayit = []
        def tas(provider, anahtar, model, sistem, mesajlar, ayar=None):
            kayit.append(model)
            red()
        r = ai.ask(con, _cfg("S"), "seviye.alt", "sohbet", _mesaj(), baglam="", sistem="s",
                   transport=tas, seviye="alt")
        no(r["ok"])
        eq(len(kayit), 1)
        ok("401" in r["note"])
    test("anahtar ve bakiye hatasinda merdiven cikilmaz", t_account_errors_do_not_climb)

    # ------------------------------------------------ nerede calissin

    def _yer_cfg(yer, paket="S", yerel=None, bulut=True):
        cfg = {"local_token": "x", "budget": {"ceiling_currency": "usd", "monthly_usd": 20.0}}
        if bulut:
            cfg = models.apply(cfg, {"keys": {"openrouter": "sk-or-test"}})
        cfg = models.apply(cfg, {"paket": paket, "yer": yer,
                                 "yerel": yerel if yerel is not None else {"ekonomik": "qwen-kucuk"}})
        return cfg

    def t_place_is_validated():
        for y in ("yerel", "hibrit", "bulut", "", None):
            ok(models.validate({"yer": y})[0], y)
        no(models.validate({"yer": "uzay"})[0])
        no(models.validate({"yerel": {"guclu": "x"}})[0])        # yerel yalniz alt siniflar
        ok(models.validate({"yerel": {"ekonomik": "a", "standart": "b"}})[0])
        eq(models.yer_of({"local_token": "x"}), "bulut")        # varsayilan: bugunku hal
    test("calisma yeri dogrulanir; varsayilan bulut", t_place_is_validated)

    def t_hybrid_simple_local_hard_cloud():
        """Hibrit: basit is yerelde, zorlanirsa bulutta guclu model."""
        m = motor.merdiven(None, _yer_cfg("hibrit"), "seviye.alt")
        eq([(b["atama"]["provider"], b["sinif"]) for b in m["basamaklar"]],
           [("yerel", "ekonomik"), ("openrouter", "standart")])
        eq(m["basamaklar"][0]["atama"]["model"], "qwen-kucuk")
        u = motor.merdiven(None, _yer_cfg("hibrit"), "king", seviye="ust")
        eq([b["atama"]["provider"] for b in u["basamaklar"]], ["openrouter", "openrouter"])
    test("hibrit: basit yerelde, zor bulutta", t_hybrid_simple_local_hard_cloud)

    def t_hybrid_falls_to_cloud_when_local_is_down():
        con = db.connect(":memory:")
        kayit = []
        def tas(provider, anahtar, model, sistem, mesajlar, ayar=None):
            kayit.append(provider)
            if provider == "yerel":
                raise ConnectionRefusedError("yerel sunucu kapali")
            return "Merhaba!", 10, 5
        r = ai.ask(con, _yer_cfg("hibrit"), "seviye.alt", "sohbet", _mesaj(), baglam="",
                   sistem="s", transport=tas, seviye="alt")
        ok(r["ok"])
        eq(kayit, ["yerel", "openrouter"])
    test("hibritte yerel kapaliysa bulut devralir", t_hybrid_falls_to_cloud_when_local_is_down)

    def t_local_only_never_touches_cloud():
        """Yerel: bulut anahtari olsa da buluta cikilmaz; ust seviye icin
        en ust yerel model kullanilir ve bu soylenir. Bedel sifirdir."""
        cfg = _yer_cfg("yerel", yerel={"ekonomik": "qwen-kucuk", "standart": "qwen-orta"})
        m = motor.merdiven(None, cfg, "king", seviye="ust")
        eq([(b["atama"]["provider"], b["atama"]["model"]) for b in m["basamaklar"]],
           [("yerel", "qwen-orta")])
        ok(m["yer_notu"])
        a = motor.merdiven(None, cfg, "seviye.alt")
        eq([b["atama"]["model"] for b in a["basamaklar"]], ["qwen-kucuk", "qwen-orta"])
        con = db.connect(":memory:")
        t = _tasiyici("Tamam.")
        r = ai.ask(con, _yer_cfg("yerel", bulut=False), "seviye.alt", "sohbet", _mesaj(),
                   baglam="", sistem="s", transport=t, seviye="alt")
        ok(r["ok"])
        eq(con.execute("SELECT usd FROM usage").fetchone()["usd"], 0.0)
    test("yerel: bulut kullanilmaz, bedel sifir", t_local_only_never_touches_cloud)

    def t_local_without_model_says_so():
        m = motor.merdiven(None, _yer_cfg("yerel", yerel={}), "seviye.alt")
        no(m["ok"])
        ok("yerel model" in m["note"])
        # Hibritte yerel model yoksa bulut devam eder.
        h = motor.merdiven(None, _yer_cfg("hibrit", yerel={}), "seviye.alt")
        eq([b["atama"]["provider"] for b in h["basamaklar"]], ["openrouter", "openrouter"])
    test("yerel model yoksa soylenir; hibrit bulutla surer", t_local_without_model_says_so)

    def t_preview_shows_local_rungs_free():
        cfg = _yer_cfg("hibrit")
        con = db.connect(":memory:")
        butce.record(con, role="king", task="sohbet", provider="yerel", model="qwen-kucuk",
                     in_tok=1_000_000, out_tok=1_000_000, note="seviye=alt",
                     now=datetime.datetime(2026, 9, 20, 12, 0))
        o = motor.onizleme(cfg, con=con, bugun="2026-09-26")
        eq(o["yer"], "hibrit")
        a = [p for p in o["paketler"] if p["id"] == "A"][0]
        alt = [x for x in a["satirlar"] if x["seviye"] == "alt"][0]
        ok(alt["basamaklar"][0]["yerel"])
        eq(alt["basamaklar"][0]["fiyat"], [0.0, 0.0])
        eq(a["aylik"], 0.0)                 # A'da alt ekonomik'ten baslar: yerel, bedava
    test("onizleme yerel basamaklari bedava gosterir", t_preview_shows_local_rungs_free)

    # ---------------------------------------- motor servisi (AI dugumu)

    def t_node_address_safety():
        """Sunucu merkezdir; AI degistirilebilir bir motor servisidir ve
        adresi ayarlanir. Ayni makine ve yerel ag http olabilir; internetteki
        bir motor YALNIZ https ile kabul edilir: ham veri sifresiz
        internete tasinmaz."""
        for adres, sinif in (("http://127.0.0.1:11434", "ayni_makine"),
                             ("http://localhost:1234", "ayni_makine"),
                             ("http://192.168.1.20:11434", "yerel_ag"),
                             ("http://10.0.0.5:8080", "yerel_ag"),
                             ("http://masaustu.local:11434", "yerel_ag"),
                             ("http://100.101.5.9:11434", "yerel_ag"),      # Tailscale
                             ("https://ai.ornek.com", "internet")):
            ok_, hata, sn = models.adres_denetle(adres)
            ok(ok_, (adres, hata))
            eq(sn, sinif, adres)
        for kotu in ("http://ai.ornek.com", "http://8.8.8.8:11434", "ftp://127.0.0.1",
                     "127.0.0.1:11434", "https://", "http://127.0.0.1:11434/v1?x=1"):
            no(models.adres_denetle(kotu)[0], kotu)
        no(models.validate({"yerel_adres": "http://ai.ornek.com"})[0])
        ok(models.validate({"yerel_adres": "http://192.168.1.20:11434"})[0])
    test("motor adresi: yerel ag http, internet yalniz https", t_node_address_safety)

    def t_node_address_reaches_the_call():
        cfg = models.apply(_yer_cfg("yerel", bulut=False), {"yerel_adres": "http://192.168.1.20:11434"})
        eq(models.yerel_uclari(cfg), ("http://192.168.1.20:11434/v1/chat/completions",
                                     "http://192.168.1.20:11434/v1/models"))
        eq(models.yerel_uclari({"local_token": "x"})[0], models.PROVIDERS["yerel"]["base"])
        con = db.connect(":memory:")
        t = _tasiyici("Tamam.")
        ai.ask(con, cfg, "seviye.alt", "sohbet", _mesaj(), baglam="", sistem="s",
               transport=t, seviye="alt")
        eq(t.kayit[0]["ayar"].get("adres"), "http://192.168.1.20:11434/v1/chat/completions")
    test("motor adresi cagriya gider", t_node_address_reaches_the_call)

    def t_node_status():
        """Sunucu motorun durumundan HABERDARDIR: ulasilabilir mi, ne kadar
        gecikmeli, hangi modeller, ayni makine mi yerel ag mi internet mi."""
        cfg = models.apply(_yer_cfg("hibrit"), {"yerel_adres": "http://192.168.1.20:11434"})
        d = motor.dugum_durumu(cfg, transport=lambda p, t, k: {"ok": True, "models": ["qwen-kucuk"], "note": ""})
        ok(d["ulasilabilir"])
        eq(d["sinif"], "yerel_ag")
        eq(d["modeller"], ["qwen-kucuk"])
        ok(d["gecikme_ms"] >= 0)
        ok(d["yerel_model_var"])
        k = motor.dugum_durumu(cfg, transport=lambda p, t, k: {"ok": False, "note": "bağlantı reddedildi"})
        no(k["ulasilabilir"])
        ok("buluta" in k["not"])                              # hibritte is durmaz
    test("sunucu motorun durumunu bilir", t_node_status)

    # ------------------------------------ baglam: ihtiyaci kadar veri

    def _dolu_sohbet(cfg, metin):
        """12 mesajlik gecmis + 12 hafiza kaydi; modele gideni yakalar."""
        from core import memory, sohbet
        con = db.connect(":memory:")
        konular = ["Sabahları koşarım", "Kahveyi sütlü içerim", "Kedim var", "Gitar çalıyorum",
                   "Kardeşim üniversitede", "Matematikte türev zorlanıyorum", "Yüzmeyi severim",
                   "Akşam 23'te yatarım", "Fizik öğretmenim yeni", "Bisiklete binerim",
                   "Hafta sonu çalışmam", "Kitap kulübüne gidiyorum"]
        for k in konular:
            memory.add(con, k)
        gecmis = []
        for i in range(6):
            gecmis += [{"role": "user", "content": "önceki soru %d" % i},
                       {"role": "assistant", "content": "önceki cevap %d" % i}]
        t = _tasiyici("Tamam.")
        r = sohbet.konus(con, cfg, metin, BUGUN, gecmis=gecmis, transport=t)
        ok(r["ok"], r)
        return t.kayit[0]

    def t_low_level_sends_only_what_is_needed():
        """Alt seviye: son 4 mesaj, yalniz mesajla ilgili hafiza, kisa
        kurallar. Olcum yine tam gider ve uydurma yasagi kisa kuralda da
        vardir. Paketsiz kurulum eskisi gibi hepsini gonderir."""
        alt = _dolu_sohbet(_cfg("S"), "bugün türev çalıştım biraz")
        from core import sohbet
        eski = _dolu_sohbet(_cfg(None, king={"provider": "openrouter", "model": "x/y"}),
                            "bugün türev çalıştım biraz")
        eq(alt["mesaj_sayisi"], 5)
        eq(eski["mesaj_sayisi"], ai.EN_COK_MESAJ)
        ok("türev" in alt["sistem"])
        no("Gitar" in alt["sistem"])
        ok("Gitar" in eski["sistem"])
        ok("ÖLÇÜM UYDURMA" in alt["sistem"] or "uydurma" in alt["sistem"].lower())
        ok(len(alt["sistem"]) < len(eski["sistem"]) * 0.7, (len(alt["sistem"]), len(eski["sistem"])))
    test("alt seviye yalniz gerekeni gonderir", t_low_level_sends_only_what_is_needed)

    def t_high_level_keeps_full_context():
        ust = _dolu_sohbet(_cfg("S"), "Fizik mi kimya mı, hangisini seçmeliyim?")
        eq(ust["mesaj_sayisi"], ai.EN_COK_MESAJ)
        ok("Gitar" in ust["sistem"] and "Kitap kulübü" in ust["sistem"])
    test("ust seviye tam baglamla calisir", t_high_level_keeps_full_context)

    # ------------------------------------ gercek bedel ve onbellek

    def t_openrouter_request_asks_cost_and_marks_cache():
        """OpenRouter'a gercek bedel sorulur (usage.include); Claude ve
        Gemini modellerinde sistem metni onbellek isaretiyle gider."""
        giden = []
        eski = ai._istek
        try:
            def sahte(url, baslik, govde, timeout=0):
                giden.append(govde)
                return {"choices": [{"message": {"content": "Tamam."}, "finish_reason": "stop"}],
                        "usage": {"prompt_tokens": 2000, "completion_tokens": 40, "cost": 0.0123,
                                  "prompt_tokens_details": {"cached_tokens": 1500},
                                  "completion_tokens_details": {"reasoning_tokens": 12}}}
            ai._istek = sahte
            r = ai._cagir("openrouter", "k", "anthropic/claude-sonnet-5", "SISTEM",
                          [{"role": "user", "content": "x"}], ayar={"jeton": 500})
            g = giden[0]
            eq(g["usage"], {"include": True})
            eq(g["messages"][0]["content"][0]["cache_control"], {"type": "ephemeral"})
            eq(g["messages"][0]["content"][0]["text"], "SISTEM")
            eq(r[4], {"usd": 0.0123, "cached": 1500, "reasoning": 12})
            ai._cagir("openrouter", "k", "openai/gpt-5-mini", "SISTEM",
                      [{"role": "user", "content": "x"}], ayar={"jeton": 500})
            eq(giden[1]["messages"][0]["content"], "SISTEM")     # OpenAI kendiliginden onbellekler
        finally:
            ai._istek = eski
    test("OpenRouter'a gercek bedel sorulur, onbellek isaretlenir",
         t_openrouter_request_asks_cost_and_marks_cache)

    def t_measured_cost_is_recorded():
        """Saglayicinin bildirdigi bedel OLCUMDUR ve tarifeyle hesaplananin
        yerine yazilir; onbellek ve dusunme jetonlari deftere girer."""
        con = db.connect(":memory:")
        def tas(provider, anahtar, model, sistem, mesajlar, ayar=None):
            return "Tamam.", 2000, 40, False, {"usd": 0.0123, "cached": 1500, "reasoning": 12}
        r = ai.ask(con, _cfg("S"), "seviye.alt", "sohbet", _mesaj(), baglam="", sistem="s",
                   transport=tas, seviye="alt")
        ok(r["ok"])
        eq(r["usd"], 0.0123)
        u = con.execute("SELECT usd, cached, cached_tok, reason_tok, note FROM usage").fetchone()
        eq((u["usd"], u["cached"], u["cached_tok"], u["reason_tok"]), (0.0123, 1, 1500, 12))
        ok("olculen-bedel" in u["note"])
    test("olculen bedel deftere yazilir", t_measured_cost_is_recorded)

    def t_anthropic_direct_marks_cache_and_counts_it():
        giden = []
        eski = ai._istek
        try:
            def sahte(url, baslik, govde, timeout=0):
                giden.append(govde)
                return {"content": [{"type": "text", "text": "Tamam."}], "stop_reason": "end_turn",
                        "usage": {"input_tokens": 100, "output_tokens": 5,
                                  "cache_read_input_tokens": 900}}
            ai._istek = sahte
            r = ai._cagir("anthropic", "k", "claude-sonnet-5", "SISTEM",
                          [{"role": "user", "content": "x"}])
            eq(giden[0]["system"][0]["cache_control"], {"type": "ephemeral"})
            eq(r[1], 1000)                    # onbellekten okunan da giristir
            eq(r[4]["cached"], 900)
        finally:
            ai._istek = eski
    test("Anthropic dogrudan: onbellek isareti ve olcumu", t_anthropic_direct_marks_cache_and_counts_it)

    def t_measurement_summary():
        con = db.connect(":memory:")
        now = datetime.datetime(2026, 9, 20, 12, 0)
        butce.record(con, role="king", task="sohbet", provider="openrouter", model="x", usd=0.01,
                     cached_tok=700, cached=True, note="olculen-bedel,seviye=alt", now=now)
        butce.record(con, role="king", task="sohbet", provider="openrouter", model="x", usd=0.02,
                     escalated=True, note="seviye=ust", now=now)
        o = motor.onizleme(_cfg("S"), con=con, bugun="2026-09-26")["olcum"]
        eq((o["cagri"], o["onbellek_jeton"], o["yukselen"], o["usd"], o["olculen_usd"]),
           (2, 700, 1, 0.03, 0.01))
        eq(motor.onizleme(_cfg("S"), con=db.connect(":memory:"))["olcum"], None)
    test("olcum ozeti: onbellek, yukselme, olculen bedel", t_measurement_summary)

    # ------------------------------------------------ BAM: efor ve maliyet

    def t_bam_effort_changes_ladder():
        """BAM isi dusuk / yuksek / en yuksek eforla calisir. Yuksek paketin
        kendi merdivenidir; dusuk ucuzlar, en yuksek Guclu→Uzman'a cikar."""
        cfg = _cfg("S")
        def sinif(efor, rol="bam.arastirma"):
            with motor.efor_baglami(efor):
                return [b["sinif"] for b in motor.merdiven(None, cfg, rol)["basamaklar"]]
        eq(sinif("yuksek"), ["standart", "guclu", "uzman"])            # S paketi arastirma
        eq(sinif("dusuk"), ["ekonomik", "standart"])
        eq(sinif("en_yuksek"), ["guclu", "uzman"])
        eq(sinif(None), sinif("yuksek"))
        # Efor yalniz BAM'i etkiler; sohbet paketin merdiveninde kalir.
        with motor.efor_baglami("en_yuksek"):
            eq([b["sinif"] for b in motor.merdiven(None, cfg, "seviye.alt")["basamaklar"]],
               ["ekonomik", "standart"])
    test("BAM eforu merdiveni degistirir", t_bam_effort_changes_ladder)

    def t_bam_query_step_is_cheap():
        """Arama sorgusu kurmak basit istir: arastirma kademesinde bile alt
        seviyeden (ekonomik) baslar."""
        m = motor.merdiven(None, _cfg("S+"), "bam.arastirma", seviye="alt")
        eq(m["basamaklar"][0]["sinif"], "standart")          # S+ alt baslangici
        m = motor.merdiven(None, _cfg("S"), "bam.arastirma", seviye="alt")
        eq(m["basamaklar"][0]["sinif"], "ekonomik")
    test("BAM sorgu adimi ucuzdan baslar", t_bam_query_step_is_cheap)

    def t_bam_effort_is_stored_on_the_job():
        from core import bam
        con = db.connect(":memory:")
        r = bam.is_ac(con, "Kuantum bilgisayarlar hakkında kaynaklı bir araştırma yap", efor="dusuk")
        ok(r["ok"], r)
        eq(bam.is_getir(con, r["id"])["efor"], "dusuk")
        no(bam.is_ac(con, "başka bir araştırma yap", efor="uc")["ok"])
    test("BAM eforu iste saklanir", t_bam_effort_is_stored_on_the_job)

    def t_bam_cost_estimate_before_start():
        """Is baslamadan once her efor icin ortalama maliyet soylenir.
        Gecmis BAM isi varsa olculen jetondan HESAPLANIR, yoksa varsayilan
        profilden TAHMIN edilir ve oyle etiketlenir."""
        cfg = _cfg("S")
        con = db.connect(":memory:")
        t = motor.bam_tahmin(cfg, con)
        eq([x["efor"] for x in t["secenekler"]], ["dusuk", "yuksek", "en_yuksek"])
        for x in t["secenekler"]:
            eq(x["etiket"], "tahmin")
        u = [x["usd"] for x in t["secenekler"]]
        ok(u[0] < u[1] < u[2], u)
        with butce.is_baglami(7):
            butce.record(con, role="bam.arastirma", task="arastirma", provider="openrouter",
                         model="x", in_tok=10_000, out_tok=2_000, note="seviye=alt")
            butce.record(con, role="bam.arastirma", task="arastirma", provider="openrouter",
                         model="x", in_tok=40_000, out_tok=6_000)
        t = motor.bam_tahmin(cfg, con)
        eq(t["secenekler"][0]["etiket"], "hesaplandi")
        eq(t["is_sayisi"], 1)
    test("BAM maliyeti is baslamadan soylenir", t_bam_cost_estimate_before_start)
