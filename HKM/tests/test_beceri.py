# -*- coding: utf-8 -*-
"""King'in becerileri (core/beceri.py), sozleri (core/soz.py), bekleyen
mesajlari (core/bekleyen.py) ve Turkce zaman ifadeleri (core/tarihsoz.py).
Testler aga cikmaz: sahte model.

   Kanitladigi sozler:
     1. Zamani kod hesaplar: yarın, cuma, hafta sonu, 3 gün sonra, «her pazartesi».
     2. Söz kodla yakalanir; soru, gecmis ve tekrar eden plan söz degildir;
        vadede King sorar, cevap sözü kapatir, sayili cevap modulun kutusuna gider.
     3. Beceri kodla ogretilir; kod cikaramazsa model yalniz dogrulanan JSON onerir
        ve cumlede olmayan sayiyi yazamaz.
     4. Zaman becerisi saatinde bir kez calisir; ogretilmeden onceki saat ve
        cok gec kalan calismaz. Söz tetigi kisa mesajda calisir.
     5. Yazan eylem (kayit, arac) onay isareti tasir; HKM module yazmaz.
     6. HTTP uclari ve yedek kapsami."""
import datetime
import os
import tempfile

from core import bekleyen, beceri, db, kutu, models, sohbet, soz, tarihsoz
from tests.harness import eq, no, ok, suite, test

BUGUN = "2026-10-21"          # carsamba
SIMDI = BUGUN + "T10:00:00"
S = datetime.datetime.fromisoformat(SIMDI)


def _cfg(model=False):
    cfg = {"local_token": "x", "web": {"acik": False},
           "budget": {"monthly_try": 850.0, "usd_try": 48.6, "rate_date": BUGUN, "ceiling_currency": "try"}}
    if not model:
        return cfg
    return models.apply(cfg, {"keys": {"google": "AIza-test"}, "assignments": {
        "king": {"provider": "google", "model": "gemini-2.5-flash"}}})


def _model(cevap):
    def t(provider, anahtar, model, sistem, mesajlar, ayar=None):
        t.sistemler.append(sistem)
        return cevap, 50, 30, False, {}
    t.sistemler = []
    return t


def run():
    suite("beceri ve söz")

    def t_tarih():
        def g(metin):
            z = tarihsoz.tarih_of(metin, S)
            return z and (z["gun"].isoformat(), z["saat"], z["son"])
        eq(g("yarın sınavım var"), ("2026-10-22", None, False))
        eq(g("cuma saat 3'te maçım var"), ("2026-10-23", "15:00", False))
        eq(g("hafta sonu"), ("2026-10-25", None, False))
        eq(g("3 gün sonra randevum var"), ("2026-10-24", None, False))
        eq(g("bu hafta türevi bitireceğim"), ("2026-10-25", None, True))
        eq(g("haftaya salı"), ("2026-10-27", None, False))
        eq(g("25 ekimde sunumum var")[0], "2026-10-25")
        eq(g("pazara gideceğim"), None, "pazar yeri gun degildir")
        eq(g("dün sınavım vardı"), None, "gecmis")
        eq(tarihsoz.tekrar_of("her pazartesi bana deneme hatırlat")["gunler"], [0])
        eq(tarihsoz.tekrar_of("hafta içi her sabah plan")["gunler"], [0, 1, 2, 3, 4])
        eq(tarihsoz.tekrar_of("her gün su iç")["gunler"], [])
        eq(tarihsoz.tekrar_of("yarın sınavım var"), None)
    test("zaman ifadeleri: tek seferlik ve tekrar eden", t_tarih)

    def t_soz_tani():
        z = soz.tani("yarın fizik sınavım var", SIMDI)
        eq(z["soru"], "Fizik sınavın nasıl geçti?")
        eq(z["vade"].isoformat(), "2026-10-22T20:00:00", "saat yoksa olay gunu aksam")
        eq(z["modul"], "ays")
        eq(soz.tani("cuma saat 15:00 matematik sınavım var", SIMDI)["vade"].isoformat(), "2026-10-23T17:00:00")
        eq(soz.tani("bu hafta türevi bitireceğim", SIMDI)["soru"], "«Bu hafta türevi bitireceğim» demiştin; oldu mu?")
        for degil in ("yarın sınavım var mı?", "her pazartesi koşacağım", "yarın hava güzel olacak",
                      "dün sınavım vardı", "sınavım var"):
            eq(soz.tani(degil, SIMDI), None, degil)
    test("söz: kod yakalar, soruyu kod yazar; soru, tekrar ve geçmiş söz değil", t_soz_tani)

    def t_soz_dongu():
        con = db.connect(":memory:")
        y = soz.yakala(con, "yarın fizik sınavım var", modul="ays", now=SIMDI)
        ok(y and "yarın 20:00" in y["not"], y and y["not"])
        eq(soz.yakala(con, "yarın fizik sınavım var", modul="ays", now=SIMDI), None, "ayni söz ikinci kez yazilmaz")
        eq(soz.tik(con, now=SIMDI), 0, "vadesi gelmedi")
        eq(soz.tik(con, now="2026-10-22T20:01:00"), 1)
        eq(soz.getir(con, y["soz"]["id"])["durum"], "soruldu")
        eq(bekleyen.al(con, "spi"), [], "baska modul almaz")
        al = bekleyen.al(con, "ays", now="2026-10-22T20:05:00")
        eq([(m["metin"], m["soru"]) for m in al], [("Fizik sınavın nasıl geçti?", True)])
        eq(bekleyen.al(con, "ays"), [], "alinan bir daha gelmez")
        akis = con.execute("SELECT text FROM conversations WHERE role='manager'").fetchall()
        eq([r[0] for r in akis], ["Fizik sınavın nasıl geçti?"], "King'in akisinda da durur")
        c = bekleyen.cevap_yakala(con, "iyi geçti, rahattı", modul="ays", now="2026-10-22T20:10:00")
        eq(c["soz_id"], y["soz"]["id"])
        eq(c["kutuya"], None, "sayisiz cevap kutuya gitmez")
        eq(soz.getir(con, y["soz"]["id"])["durum"], "kapandi")
        eq(bekleyen.cevap_yakala(con, "bir sey daha", modul="ays", now="2026-10-22T20:11:00"), None, "tek cevap")
        ok(bekleyen.geri_al(con, "local", now="2026-10-22T20:12:00"))
        eq(soz.getir(con, y["soz"]["id"])["durum"], "soruldu", "«o cevap değil» sözü geri açar")
    test("söz: vade, bekleyen mesaj, cevap, geri alma", t_soz_dongu)

    def t_soz_kutu():
        d = tempfile.mkdtemp()
        con = db.connect(os.path.join(d, "hkm.db"))
        soz.ekle(con, "deneme var", "Deneme nasıl geçti?", "2026-10-21T09:00:00", "2026-10-21", modul="ays", now=SIMDI)
        soz.tik(con, now=SIMDI)
        bekleyen.al(con, "ays", now=SIMDI)
        c = bekleyen.cevap_yakala(con, "matematikten 32 net yaptım", modul="ays", now=SIMDI)
        eq(c["kutuya"], "ays", "sayili cevap modulun kutusuna: modul onizler, onayla yazar")
        srv = bekleyen._kutu_sunucusu(con)
        eq([x["metin"] for x in kutu.al(srv, "ays")], ["matematikten 32 net yaptım"])
    test("söz: sayılı cevap modülün kutusuna öneri olur", t_soz_kutu)

    def t_soz_komut():
        con = db.connect(":memory:")
        soz.yakala(con, "yarın fizik sınavım var", now=SIMDI)
        ok("Fizik" in soz.komut(con, "sözlerim") or "fizik" in soz.komut(con, "sözlerim"))
        ok("söz değil" in soz.komut(con, "bunu söz yapma", now=SIMDI))
        eq(soz.listele(con, "acik"), [])
        eq(soz.komut(con, "bunu söz yapma"), "Silinecek bir söz yok.")
        eq(soz.komut(con, "merhaba"), None)
    test("söz: «bunu söz yapma», liste", t_soz_komut)

    def t_beceri_tani():
        t = beceri.tani("her pazartesi bana deneme hatırlat, akşam sonucunu sor")
        eq(t["tetik"], {"tur": "zaman", "gunler": [0], "saat": "09:00"})
        eq(t["eylemler"], [{"tur": "mesaj", "metin": "Hatırlatma: deneme."},
                           {"tur": "soru", "metin": "Deneme nasıl geçti?", "saat": "20:00"}])
        ok(t["varsayilan_saat"], "saat soylenmedi: varsayilan oldugu soylenir")
        t = beceri.tani("'ders bitti' deyince süreyi AYS'ye yaz ve 5 dakikalık mola sayacı aç")
        eq(t["tetik"], {"tur": "soz", "kalip": "ders bitti"})
        eq(t["eylemler"], [{"tur": "kayit", "modul": "ays", "metin": "süreyi AYS'ye yaz", "alan": "sure"},
                           {"tur": "sayac", "dakika": 5, "ad": "Mola"}])
        t = beceri.tani("bundan sonra her gün saat 7:30'da bana 'su iç' de")
        eq((t["tetik"]["saat"], t["eylemler"][0]["metin"]), ("07:30", "Su iç."))
        eq(beceri.tani("bundan sonra daha kısa cevap ver"), None, "tercih cumlesi beceri degil")
        eq(beceri.tani("yarın fizik sınavım var"), None)
        eq(beceri.tani("her cuma haftalık özet çıkar, bunu öğren")["eksik"], "eylem")
    test("beceri: iki örnek cümle kodla çözülür", t_beceri_tani)

    def t_beceri_tik():
        con = db.connect(":memory:")
        t = beceri.tani("her pazartesi bana deneme hatırlat, akşam sonucunu sor")
        b = beceri.ekle(con, t["tetik"], t["eylemler"], modul="ays", now="2026-10-19T08:00:00")["beceri"]
        eq(b["ozet"], "Her pazartesi 09:00 → «Hatırlatma: deneme.»; 20:00 → «Deneme nasıl geçti?»")
        eq(beceri.tik(con, now="2026-10-19T08:59:00"), 0)
        eq(beceri.tik(con, now="2026-10-19T09:00:30"), 1)
        eq(beceri.tik(con, now="2026-10-19T09:01:30"), 0, "ayni gun bir kez")
        eq(beceri.tik(con, now="2026-10-20T09:00:30"), 0, "sali degil")
        eq(beceri.tik(con, now="2026-10-19T20:00:30"), 1)
        al = bekleyen.al(con, "ays", now="2026-10-19T20:01:00")
        eq([(m["metin"], m["soru"]) for m in al], [("Hatırlatma: deneme.", False), ("Deneme nasıl geçti?", True)])
        eq(beceri.getir(con, b["id"])["calisma"], 2)
        # Ogretildigi andan once kalan saat ve cok gec kalan calismaz.
        b2 = beceri.ekle(con, {"tur": "zaman", "gunler": [], "saat": "09:00"}, [{"tur": "mesaj", "metin": "Günaydın."}],
                         now="2026-10-21T09:30:00")["beceri"]
        eq(beceri.tik(con, now="2026-10-21T09:31:00"), 0, "ogretilmeden once kalan saat")
        eq(beceri.tik(con, now="2026-10-22T16:00:00"), 0, "alti saatten gec")
        eq(beceri.tik(con, now="2026-10-23T09:05:00"), 1)
        beceri.ac_kapat(con, b2["id"], False)
        eq(beceri.tik(con, now="2026-10-24T09:05:00"), 0, "kapali beceri calismaz")
    test("beceri: zaman tetiği saatinde bir kez", t_beceri_tik)

    def t_soz_tetigi():
        con = db.connect(":memory:")
        cfg = _cfg()
        r = beceri.sohbet_cevabi(con, cfg, "'ders bitti' deyince süreyi AYS'ye yaz ve 5 dakikalık mola sayacı aç",
                                 modul="ays", now=SIMDI)
        eq(r["command"], "ogren")
        ok("beceri #1" in r["text"] and "onayını ister" in r["text"], r["text"])
        r = beceri.sohbet_cevabi(con, cfg, "Ders bitti!", modul="ays", now=SIMDI)
        eq(r["command"], "beceri")
        eq([e["tur"] for e in r["eylemler"]], ["kayit", "sayac"])
        eq(r["text"], "AYS kaydı için onayını isteyeceğim. 5 dakikalık mola sayacını açıyorum.")
        eq(beceri.sohbet_cevabi(con, cfg, "bugün ders bitti ama yarın yine var, ne çalışmam gerektiğini "
                                          "düşünüyorum uzun uzun", now=SIMDI), None, "uzun mesajda tetik degil")
        eq(beceri.sohbet_cevabi(con, cfg, "becerilerim")["beceriler"][0]["id"], 1)
        eq(beceri.sohbet_cevabi(con, cfg, "beceri 1 kapat")["text"], "Beceri #1 kapalı.")
        eq(beceri.sohbet_cevabi(con, cfg, "ders bitti", now=SIMDI), None, "kapali")
        ok("silindi" in beceri.sohbet_cevabi(con, cfg, "beceri 1 sil")["text"])
        eq(beceri.listele(con), [])
    test("beceri: söz tetiği, liste, kapat, sil", t_soz_tetigi)

    def t_model():
        con = db.connect(":memory:")
        cfg = _cfg(model=True)
        tr = _model('{"tetik": {"tur": "zaman", "gunler": [4], "saat": "09:00"}, '
                    '"eylemler": [{"tur": "mesaj", "metin": "Haftalık özet zamanı."}]}')
        r = beceri.sohbet_cevabi(con, cfg, "her cuma haftalık özet çıkar, bunu öğren", transport=tr, now=SIMDI)
        eq(r["dayanak"], "model")
        eq(r["beceri"]["eylemler"], [{"tur": "mesaj", "metin": "Haftalık özet zamanı."}])
        tr2 = _model('{"tetik": {"tur": "soz", "kalip": "yoruldum"}, '
                     '"eylemler": [{"tur": "sayac", "dakika": 15, "ad": "Mola"}]}')
        r = beceri.sohbet_cevabi(con, cfg, "'yoruldum' deyince mola ver, bunu öğren", transport=tr2, now=SIMDI)
        eq(r["command"], "ogren")
        ok("anlayamadım" in r["text"], "model cumlede olmayan dakikayi yazamaz: %s" % r["text"])
        eq(len(beceri.listele(con)), 1)
        tr3 = _model('{"tetik": {"tur": "soz", "kalip": "ders bitti"}, '
                     '"eylemler": [{"tur": "mesaj", "metin": "Biraz dinlen."}]}')
        r = beceri.sohbet_cevabi(con, cfg, "yorulunca bana moral ver, bunu öğren", transport=tr3, now=SIMDI)
        ok("anlayamadım" in r["text"], "modelin söz kalıbı cümlede geçmeli: %s" % r["text"])
        tr4 = _model('{"tetik": {"tur": "zaman", "gunler": [1], "saat": "18:00"}, '
                     '"eylemler": [{"tur": "mesaj", "metin": "Haftalık özet zamanı."}]}')
        r = beceri.sohbet_cevabi(con, cfg, "her pazartesi haftalık özet çıkar, bunu öğren", transport=tr4, now=SIMDI)
        eq(r["beceri"]["tetik"], {"tur": "zaman", "gunler": [0], "saat": "09:00"}, "kodun tetiği modelinkini ezer")
    test("beceri: model yalnız doğrulanan JSON önerir, sayı uyduramaz", t_model)

    def t_dogrula():
        katalog = [{"ad": "plan_ekle", "aciklama": "Plana blok ekler.", "tur": "yaz",
                    "parametreler": {"type": "object", "properties": {"ders": {"type": "string"}}, "required": ["ders"]}},
                   {"ad": "netler", "aciklama": "Son netleri okur.", "tur": "oku",
                    "parametreler": {"type": "object", "properties": {}}}]
        t = {"tur": "soz", "kalip": "plan"}
        eq(beceri.dogrula(t, [{"tur": "arac", "ad": "plan_ekle", "param": {"ders": "fizik"}}], katalog)[1][0]["yaz"], True)
        eq(beceri.dogrula(t, [{"tur": "arac", "ad": "netler", "param": {}}], katalog)[1][0]["yaz"], False)
        ok(beceri.dogrula(t, [{"tur": "arac", "ad": "yok_boyle", "param": {}}], katalog)[2], "katalog disi")
        eq(beceri.dogrula(t, [{"tur": "arac", "ad": "netler", "param": {}}])[1][0]["yaz"], True,
           "katalog bilinmiyorsa yazan sayilir (onay karti)")
        ok(beceri.dogrula({"tur": "zaman", "gunler": [7], "saat": "09:00"}, [{"tur": "mesaj", "metin": "x y"}])[2])
        ok(beceri.dogrula(t, [{"tur": "sayac", "dakika": 500}])[2])
    test("beceri: kapalı katalog, yazan araç onay işareti", t_dogrula)

    def t_sohbet():
        con = db.connect(":memory:")
        cfg = _cfg()
        r = sohbet.konus(con, cfg, "yarın fizik sınavım var", BUGUN, modul="ays")
        ok(r.get("soz") and "Söz aldım" in r["text"], r.get("text"))
        r = sohbet.konus(con, cfg, "bunu söz yapma", BUGUN)
        eq((r["mode"], r["command"]), ("beceri", "soz"))
        eq(soz.listele(con, "acik"), [])
        r = sohbet.konus(con, cfg, "her pazartesi bana deneme hatırlat, akşam sonucunu sor", BUGUN, modul="ays")
        eq((r["mode"], r["command"]), ("beceri", "ogren"))
        no(r.get("soz"), "beceri cumlesi söz olmaz")
        eq(beceri.listele(con)[0]["modul"], "ays")
    test("sohbet: söz notu, «bunu söz yapma», beceri öğretme", t_sohbet)

    def t_http():
        con = db.connect(":memory:")
        cfg = _cfg()
        k, r = beceri.uc(con, cfg, "POST", "/api/king/beceriler", govde={"metin": "her akşam kitap okumayı hatırlat"},
                         now=SIMDI)
        eq((k, r["beceri"]["tetik"]["saat"]), (201, "20:00"))
        bid = r["beceri"]["id"]
        eq(beceri.uc(con, cfg, "POST", "/api/king/beceriler/%d/kapat" % bid)[1]["beceri"]["acik"], False)
        k, r = beceri.uc(con, cfg, "POST", "/api/king/beceriler/%d" % bid, govde={"tetik": {"tur": "zaman", "gunler": [],
                                                                                            "saat": "21:00"}})
        eq((k, r["beceri"]["tetik"]["saat"]), (200, "21:00"))
        eq(beceri.uc(con, cfg, "POST", "/api/king/beceriler/%d" % bid, govde={"tetik": {"tur": "x"}})[0], 422)
        eq(beceri.uc(con, cfg, "GET", "/api/king/beceriler")[1]["beceriler"][0]["id"], bid)
        eq(beceri.uc(con, cfg, "POST", "/api/king/beceriler/%d/sil" % bid)[0], 200)
        eq(beceri.uc(con, cfg, "GET", "/api/king/beceriler/%d" % bid)[0], 404)
        k, r = beceri.uc(con, cfg, "POST", "/api/king/sozler", govde={"metin": "cuma maçım var"}, now=SIMDI)
        eq((k, r["soz"]["soru"]), (201, "Maçın nasıl geçti?"))
        eq(beceri.uc(con, cfg, "POST", "/api/king/sozler", govde={"metin": "merhaba"})[0], 422)
        eq(beceri.uc(con, cfg, "GET", "/api/king/sozler", q={"durum": ["acik"]})[1]["sozler"][0]["id"], r["soz"]["id"])
        eq(beceri.uc(con, cfg, "POST", "/api/king/sozler/%d/sil" % r["soz"]["id"])[0], 200)
        eq(beceri.uc(con, cfg, "GET", "/api/king/bekleyen", q={"modul": ["ays"]})[1], {"mesajlar": []})
        eq(beceri.uc(con, cfg, "GET", "/api/king/bekleyen")[0], 422)
        eq(beceri.uc(con, cfg, "GET", "/api/king/gorevler"), None, "K1 ucu bizim degil")
    test("HTTP: beceriler, sözler, bekleyen", t_http)

    def t_yedek():
        con = db.connect(":memory:")
        beceri.ekle(con, {"tur": "soz", "kalip": "ders bitti"}, [{"tur": "sayac", "dakika": 5}])
        soz.yakala(con, "yarın fizik sınavım var", now=SIMDI)
        e = db.export_all(con)
        for t in ("king_gorevler", "king_beceriler", "king_sozler", "king_bekleyen"):
            ok(t in e["__meta"]["tables"], t)
        eq((e["__meta"]["tables"]["king_beceriler"], e["__meta"]["tables"]["king_sozler"]), (1, 1))
        con2 = db.connect(":memory:")
        r = db.import_all(con2, e)
        ok(r["ok"], r)
        eq(con2.execute("SELECT kalip FROM (SELECT json_extract(tetik,'$.kalip') AS kalip FROM king_beceriler)")
           .fetchone()[0], "ders bitti", "geri yuklenir")
    test("yedek: görevler, beceriler, sözler ve bekleyenler dahil", t_yedek)
