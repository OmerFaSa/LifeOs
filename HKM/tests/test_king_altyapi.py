# -*- coding: utf-8 -*-
"""King LLM altyapisi (Olcum 6, 2026-11-05): dar katalog, aracli akis, iki asamali
secim, Ollama uyandirma, ilk soz olcusu, genel bilgi denetimi, okunur metin.
Ag'a cikilmaz, surec acilmaz."""

import datetime
import json
import urllib.error

from core import ai, arac, butce, db, models, ollama, ses, sohbet
from tests.harness import eq, no, ok, suite, test

BUGUN = "2026-10-20"
KATALOG = [
    {"ad": "ays_denemeler", "aciklama": "Deneme kayıtları ve netler.", "tur": "oku"},
    {"ad": "kayit_gir", "aciklama": "Cümleyi kayda çevirir.", "tur": "yaz",
     "parametreler": {"type": "object", "properties": {"metin": {"type": "string"}}, "required": ["metin"]}},
    {"ad": "spi_uyku", "aciklama": "Uyku ortalaması.", "tur": "oku", "anahtar": "gece dinlenme"},
    {"ad": "ayar_degistir", "aciklama": "Tema ve görünüm.", "tur": "yaz"},
    {"ad": "ays_konular", "aciklama": "Konu durumu.", "tur": "oku"},
    {"ad": "ays_takvim", "aciklama": "Sınav takvimi.", "tur": "oku"},
]


def _yerel(model="gemma4:e2b"):
    return models.apply({"local_token": "x", "budget": {"monthly_try": 850.0, "usd_try": 48.6, "rate_date": BUGUN,
                                                        "ceiling_currency": "try"}},
                        {"yer": "yerel", "yerel": {"ekonomik": model}, "keys": {"yerel": "yerel"},
                         "assignments": {"king": {"provider": "yerel", "model": model}}})


def _sira(*cevaplar):
    """Sirali sahte saglayici; akis isteyen cagrida metni parca parca yayar."""
    liste = list(cevaplar)

    def t(provider, anahtar, model, sistem, mesajlar, ayar=None):
        t.gorulen.append({"sistem": sistem, "ayar": dict(ayar or {})})
        metin, cagri = liste.pop(0) if liste else ("Tamam.", [])
        if isinstance(metin, Exception):
            raise metin
        if (ayar or {}).get("yalniz_arac") and not cagri:
            return "", 100, 1, False, {"cagrilar": []}
        if callable((ayar or {}).get("akis")):
            ayar["akis"](metin)
            ayar["akis"](None)
        return metin, 100, 10, False, {"cagrilar": cagri} if (ayar or {}).get("araclar") else {}
    t.gorulen = []
    return t


def _reddedildi():
    return urllib.error.URLError(ConnectionRefusedError(10061, "reddedildi"))


def run():
    suite("king altyapisi")

    def t_dar():
        k = arac.katalog_temizle(KATALOG)[0]
        ad = lambda m, **kw: [a["ad"] for a in arac.dar_katalog(k, m, **kw)]
        eq(ad("son denemelerim nasıl")[0], "ays_denemeler")           # Turkce ek payi
        eq(ad("gece dinlenme nasıl")[0], "spi_uyku")                  # anahtar sozcugu
        eq(ad("selam nasılsın"), [])                                  # sohbet: arac yok, akar
        ok("kayit_gir" in ad("45 dakika fizik bitirdim"), "yapilmis is cumlesi kayit aracina")
        eq(len(arac.dar_katalog(k * 3, "deneme konu takvim uyku tema kayıt")), arac.DAR_EN_COK)
        no(any("anahtar" in str(x) for x in arac.saglayici_araclari("yerel", k)), "anahtar modele gitmez")
    test("dar katalog: mesajla ortusen araclar, ortusen yoksa bos", t_dar)

    def t_tam_dogrulama():
        # Daraltma kapali katalogu degistirmez: dar listede olmayan arac da gecerliyse gecer.
        k = arac.katalog_temizle(KATALOG)[0]
        gecerli, red = arac.cagri_dogrula([{"ad": "ays_takvim", "param": {}}, {"ad": "uydurma", "param": {}}], k)
        eq([c["ad"] for c in gecerli], ["ays_takvim"])
        eq(red[0]["ad"], "uydurma")
    test("secim yine tam katalogla dogrulanir", t_tam_dogrulama)

    def _sse(*delta):
        return ["data: " + json.dumps({"choices": [{"delta": d}]}) for d in delta] + ["data: [DONE]"]

    def t_sse_arac():
        akan = []
        y = ai._sse_birlestir(_sse({"tool_calls": [{"index": 0, "function": {"name": "ays_denemeler", "arguments": '{"li'}}]},
                                   {"tool_calls": [{"index": 0, "function": {"arguments": 'mit":3}'}}]},
                                   {"content": "Tamam."}), akan.append)
        m = y["choices"][0]["message"]
        eq(arac.openai_cagrilari(m), [{"ad": "ays_denemeler", "param": '{"limit":3}'}])
        eq(m["content"], "Tamam.")
        g = ai._gemini_birlestir(['data: ' + json.dumps({"candidates": [{"content": {"parts": [
            {"functionCall": {"name": "ays_konular", "args": {}}}]}}]})], akan.append)
        eq(arac.google_cagrilari(g["candidates"][0]["content"]["parts"]), [{"ad": "ays_konular", "param": {}}])
    test("akan cevapta arac cagrisi birlesir (OpenAI, Gemini)", t_sse_arac)

    def t_yalniz_arac_kesilir():
        okunan = []

        def satirlar():
            for s in _sse({"content": "Bugün "}, {"content": "hava"}, {"content": "güzel"}):
                okunan.append(s)
                yield s
        y = ai._sse_birlestir(satirlar(), lambda p: None, yalniz_arac=True)
        eq(y["choices"][0]["message"]["content"], "")
        eq(len(okunan), 1, "metin baslayinca okuma kesilir")
        c = ai._sse_birlestir(_sse({"tool_calls": [{"index": 0, "function": {"name": "x", "arguments": "{}"}}]},
                                   {"content": "s"}), lambda p: None, yalniz_arac=True)
        eq(arac.openai_cagrilari(c["choices"][0]["message"])[0]["ad"], "x")
    test("secim turunda metin baslayinca okuma kesilir", t_yalniz_arac_kesilir)

    def t_iki_asama():
        con = db.connect(":memory:")
        # Arac secildi: sohbet turu yok, tek cagri.
        t = _sira(("", [{"ad": "ays_denemeler", "param": {}}]))
        r = sohbet.konus(con, _yerel(), "son denemelerim nasıl", BUGUN, transport=t, araclar=KATALOG, kayit=False)
        eq(r["mode"], "arac")
        eq(len(t.gorulen), 1)
        ok(t.gorulen[0]["ayar"].get("yalniz_arac"))
        ok(len(t.gorulen[0]["ayar"]["araclar"]) <= arac.DAR_EN_COK, "dar liste gider")
        # Secilmedi: sohbet turu aracsiz, secim metni sizmaz, cevap akar.
        akan = []
        t2 = _sira(("", []), ("Denemelerden söz edelim.", []))
        r2 = sohbet.konus(con, _yerel(), "denemelerim hakkında konuşalım", BUGUN, transport=t2, araclar=KATALOG,
                          kayit=False, akis=akan.append)
        eq((r2["mode"], len(t2.gorulen)), ("model", 2))
        no(t2.gorulen[1]["ayar"].get("araclar"), "sohbet turunda arac yok")
        no("hemen çağır" in t2.gorulen[1]["sistem"], "secim metni sohbete girmez")
        ok("".join(akan).startswith("Denemelerden"), "cevap akar")
        # Ortusen arac yoksa secim turu hic yapilmaz.
        t3 = _sira(("Merhaba, buradayım.", []))
        sohbet.konus(con, _yerel(), "selam nasılsın", BUGUN, transport=t3, araclar=KATALOG, kayit=False)
        eq(len(t3.gorulen), 1)
        no(t3.gorulen[0]["ayar"].get("araclar"))
    test("kucuk model: once yalniz secim, sonra akan sohbet", t_iki_asama)

    def t_akis_iddiasi():
        giden = []
        a = sohbet.CumleAkisi(giden.append, "Tarih: x", aracli=True)
        a("Bir bakayım şimdi. Geri kalanı.")
        a(None)
        eq(giden, [], "aracli turda «bakayim» akmaz")
        g2 = []
        b = sohbet.CumleAkisi(g2.append, "Tarih: x", aracli=True)
        b("Bir araç çağırmam gerekiyor.")
        b(None)
        eq(g2, [])
    test("aracli akista yapilmamis is ve arac sozu akmaz", t_akis_iddiasi)

    def t_genel():
        metin = "Pomodoro 25 dakika çalışma ve 5 dakika moladan oluşur."
        eq(ai.uydurma_sayilar(metin, "Tarih: x"), ["25", "5"], "kisisel soruda eskisi gibi")
        eq(ai.uydurma_sayilar(metin, "Tarih: x", genel=True), [], "genel bilgi serbest")
        eq(ai.uydurma_sayilar("Uyku ortalaman 9 saat.", "Tarih: x", genel=True), ["9"], "kullaniciya baglanan yine duser")
        eq(ai.uydurma_sayilar("Dün 90 dakika çalıştın.", "Tarih: x", genel=True), ["90"])
        t = _sira((metin, []))
        r = sohbet.konus(db.connect(":memory:"), _yerel(), "pomodoro nedir", BUGUN, transport=t, kayit=False)
        eq(r["mode"], "model")
        eq(len(t.gorulen), 1, "duzeltme turu acilmaz")
        # Kullanicinin verisini soran mesajda denetim gevsemez.
        t2 = _sira(("Uyku ortalaman 9 saat.", []), ("Uyku ortalaman 9 saat.", []))
        r2 = sohbet.konus(db.connect(":memory:"), _yerel(), "uykum nasıl", BUGUN, transport=t2, kayit=False)
        no("9 saat" in (r2.get("text") or ""), "uydurma olcum gecmez")
    test("genel bilgide sayi serbest; kullaniciya baglanan sayi duser", t_genel)

    def t_tarih():
        a = datetime.datetime(2026, 11, 5, 18, 30)
        eq(sohbet._tarih_satiri("2026-11-05", now=a), "Tarih: 2026-11-05 (Perşembe, akşam)")
        eq(sohbet._tarih_satiri("2026-11-05", now=a.replace(hour=8)), "Tarih: 2026-11-05 (Perşembe, sabah)")
        eq(sohbet._tarih_satiri("2026-11-04", now=a), "Tarih: 2026-11-04", "gecmis gunun bolumu yok")
    test("baglam gunun bolumunu soyler, rakam eklemez", t_tarih)

    def t_uyandir():
        ollama._KAPALI[0] = 0.0
        acilan, durum = [], {"acik": False}

        def getir(url, timeout):
            if not durum["acik"]:
                raise OSError("kapali")
            return {}
        eski_g, eski_e = ollama.VARSAYILAN_GETIR, ollama.ollama_exe
        ollama.VARSAYILAN_GETIR, ollama.ollama_exe = getir, lambda: "ollama.exe"
        try:
            def ac(exe):
                acilan.append(exe)
                durum["acik"] = True
            ok(ollama.uyandir(_yerel(), ac=ac, bekle=lambda s: None))
            eq(acilan, ["ollama.exe"])
            ok(ollama.uyandir(_yerel(), ac=ac, bekle=lambda s: None))
            eq(len(acilan), 1, "aciksa ikinci surec acilmaz")
            # Ayar kapali: acmaz, pencere boyunca denemez.
            durum["acik"] = False
            kapali = dict(_yerel(), ollama={"baslat": False})
            no(ollama.uyandir(kapali, ac=ac, bekle=lambda s: None))
            eq(len(acilan), 1)
            ok(ollama.kapali_kalan() > 0)
            ollama._KAPALI[0] = 0.0
            # Baska makinedeki motor acilmaz.
            uzak = models.apply(_yerel(), {"yerel_adres": "http://192.168.1.20:11434"})
            no(ollama.uyandir(uzak, ac=ac, bekle=lambda s: None))
            eq(len(acilan), 1)
        finally:
            ollama.VARSAYILAN_GETIR, ollama.ollama_exe = eski_g, eski_e
            ollama._KAPALI[0] = 0.0
    test("uyandirma: kapaliysa bir kez acar; ayar kapaliysa ya da uzaksa acmaz", t_uyandir)

    def t_cagri_uyanir():
        ollama._KAPALI[0] = 0.0
        eski = ollama.uyandir
        ollama.uyandir = lambda cfg: True
        try:
            con = db.connect(":memory:")
            t = _sira((_reddedildi(), []), ("Buradayım.", []))
            r = ai.ask(con, _yerel(), "king", "sohbet", [{"role": "user", "content": "selam"}], sistem="s", transport=t)
            eq((r["ok"], r["text"]), (True, "Buradayım."))
            ollama.uyandir = lambda cfg: False
            t2 = _sira((_reddedildi(), []))
            r2 = ai.ask(con, _yerel(), "king", "sohbet", [{"role": "user", "content": "selam"}], sistem="s2", transport=t2)
            no(r2["ok"])
            eq(len(t2.gorulen), 1)
        finally:
            ollama.uyandir = eski
            ollama._KAPALI[0] = 0.0
    test("kapi kapaliysa uyandirilir, istek bir kez yinelenir", t_cagri_uyanir)

    def t_kapaliyken_king():
        # Model kapali ve acilamiyor: King kural motoruyla hemen konusur, cagri denenmez.
        ollama._KAPALI[0] = ollama.time.monotonic() + 30
        try:
            con = db.connect(":memory:")
            t = _sira(("Bu gelmemeli.", []))
            r = sohbet.konus(con, _yerel(), "bugün neler önerirsin", BUGUN, transport=t)
            ok(r["ok"], r)
            eq(r["mode"], "komut")
            ok(r["text"])
            eq(t.gorulen, [], "baglanti denenmez")
            eq(r["ai"]["reason"], "provider")
        finally:
            ollama._KAPALI[0] = 0.0
    test("model kapaliyken King kural motoruyla konusur", t_kapaliyken_king)

    def t_ilk_ms():
        con = db.connect(":memory:")
        ai.ask(con, _yerel(), "king", "sohbet", [{"role": "user", "content": "selam"}], sistem="sA",
               transport=_sira(("Selam.", [])), akis=lambda p: None)
        s = con.execute("SELECT ilk_ms, ms FROM usage ORDER BY id DESC LIMIT 1").fetchone()
        ok(s[0] is not None and s[0] <= s[1], s)
        ai.ask(con, _yerel(), "king", "sohbet", [{"role": "user", "content": "selam"}], sistem="sB",
               transport=_sira(("Selam.", [])))
        eq(con.execute("SELECT ilk_ms FROM usage ORDER BY id DESC LIMIT 1").fetchone()[0], None, "akmayan cagrida bos")
        ok("ort_ilk_ms" in butce.ai_olcum(con)["toplam"])
    test("ilk soz suresi deftere yazilir; olculmeyen bos kalir", t_ilk_ms)

    def t_okunur():
        o = ses.okunur
        eq(o("**Önemli:** bugün %25 arttı 😊"), "Önemli: bugün yüzde yirmi beş arttı")
        eq(o("- Birinci madde\n- İkinci madde"), "Birinci madde İkinci madde")
        eq(o("Uyku 7,5 sa, net 63.25"), "Uyku yedi virgül beş saat, net altmış üç virgül yirmi beş")
        eq(o("45 dk çalış, 22:30'da uyu"), "kırk beş dakika çalış, yirmi iki otuzda uyu")
        eq(o("Saat 22:00 ve 09:05"), "Saat yirmi iki ve dokuz sıfır beş")
        eq(o("2026-11-05 günü"), "beş Kasım iki bin yirmi altı günü")
        eq(o("12.500 adım, 1.200 kalori"), "on iki bin beş yüz adım, bin iki yüz kalori")
        eq(o("25'te bitti, 3-4 gün"), "yirmi beşte bitti, üç dört gün")
        eq(o("TYT ve AYT, AYS"), "te ye te ve a ye te, ays")
        eq(o("bak: [kaynak](http://a.b/c) ve http://x.y"), "bak: kaynak ve bağlantı")
        eq(o("7,05 ve -3"), "yedi virgül sıfır beş ve eksi üç")
        eq(o("[[HAFIZA ADAYI: x]] tamam"), "tamam")
        eq(ses._sayi_yaz(1100), "bin yüz")
        eq(ses._sayi_yaz(2001), "iki bin bir")
        eq(ses._sayi_yaz(1000000), "bir milyon")
        eq(ses._sayi_yaz(0), "sıfır")
        eq(o(""), "")
        ok(len(o("a" * 5000)) <= ses.EN_COK)
    test("ses metni: isaret ve sayi okunur hale gelir, deger degismez", t_okunur)
