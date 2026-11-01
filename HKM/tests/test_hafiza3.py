# -*- coding: utf-8 -*-
"""KING-4 B (uc katmanli hafiza, gomme ile arama) ve C (kendiliginden King kural motoru)."""
import datetime

from core import ai, bekleyen, beceri, db, eylem, kendiliginden, memory
from tests.harness import eq, no, ok, suite, test

SOZLUK = ("sınav", "uyku", "alerji", "fıstık", "para", "market", "koşu", "yürü")


class SahteGomme:
    """Sozlukteki kelimeler boyut; sayilan cagri ve metin."""

    def __init__(self):
        self.metin = 0

    def __call__(self, url, govde, timeout):
        assert url.endswith("/api/embed") and govde["model"]
        self.metin += len(govde["input"])
        return {"embeddings": [[0.01] + [float(k in t.lower()) for k in SOZLUK] for t in govde["input"]]}


def _olay(modul="spi", tur="uyku_dustu", kimlik="k1", at="2026-11-01T10:00:00", **sayilar):
    s = {ad: {"deger": d, "birim": "", "etiket": "ölçüldü"} for ad, d in sayilar.items()}
    return {"modul": modul, "tur": tur, "kimlik": kimlik, "at": at, "sayilar": s}


ONCE = datetime.datetime(2026, 11, 1, 10, 0, 0)


def run():
    suite("hafiza uc katman (KING-4 B)")

    def t_uc_katman():
        con = db.connect(":memory:")
        memory.add(con, "Fıstık alerjim var", now="2026-10-30T09:00:00")
        eylem.kaydet(con, "para.yaz", "Para kaydı: market 120 TL", {"hkm": "para", "grup": "g"})
        beceri.ekle(con, {"tur": "soz", "kalip": "ders bitti"}, [{"tur": "mesaj", "metin": "Aferin"}], ad="Ders bitti")
        kendiliginden.olay_al(con, {}, _olay(ort7=5.5, ort28=7.2), now=ONCE)
        b = memory.bildiklerim(con)
        eq([x["metin"] for x in b["bilgiler"]], ["Fıstık alerjim var"])
        eq(b["bilgiler"][0]["tarih"], "2026-10-30T09:00:00")
        eq(b["bilgiler"][0]["kaynak"], "explicit")
        eq(sorted(x["tur"] for x in b["olanlar"]), ["eylem", "olay"])
        ok(b["olanlar"][0]["geri_alinabilir"] if b["olanlar"][0]["tur"] == "eylem" else True)
        eq([x["ad"] for x in b["beceriler"]], ["Ders bitti"])
    test("bilgiler, olanlar, beceriler tek cevapta; kaynak ve tarihiyle", t_uc_katman)

    def t_duzelt():
        con = db.connect(":memory:")
        i = memory.add(con, "Sınavım 14 Haziran")["id"]
        r = memory.duzelt(con, i, "Sınavım 21 Haziran")
        ok(r["ok"], r)
        a = memory.list_active(con)
        eq([(x["text"], x["source"], x["katman"]) for x in a], [("Sınavım 21 Haziran", "kullanici", "soz")])
        # Modul kaydi: eskisi unutulur, yenisi HKM'de; modulun sonraki goruntusu diriltemez.
        memory.esitle(con, "ays", [{"id": "m1", "metin": "Hedefim tıp", "katman": "soz"}])
        mid = [x["id"] for x in memory.list_active(con) if x["modul"] == "ays"][0]
        r = memory.duzelt(con, mid, "Hedefim diş hekimliği")
        ok(r["ok"] and r["eski"] == mid, r)
        memory.esitle(con, "ays", [{"id": "m1", "metin": "Hedefim tıp", "katman": "soz"}])
        eq(sorted(x["text"] for x in memory.list_active(con)), ["Hedefim diş hekimliği", "Sınavım 21 Haziran"])
        no(memory.duzelt(con, 999, "x")["ok"])
        no(memory.duzelt(con, i, "")["ok"])
        # Sohbet komutu ayni yoldan.
        c = memory.command(con, "#%d düzelt: Sınavım 28 Haziran" % i)
        ok(c["handled"] and c["result"]["ok"], c)
    test("duzelt: HKM kaydi yerinde, modul kaydi unut+yaz; komut", t_duzelt)

    def t_ara_gomme():
        con = db.connect(":memory:")
        memory.add(con, "Fıstık alerjim var")
        memory.add(con, "Sınavım 14 Haziran")
        eylem.kaydet(con, "para.yaz", "Para kaydı: market 120 TL", None)
        g = SahteGomme()
        r = memory.ara(con, {}, "fıstık yiyebilir miyim", k=3, gonder=g)
        eq(r["yontem"], "gomme")
        eq(r["sonuclar"][0]["metin"], "Fıstık alerjim var")
        eq(r["sonuclar"][0]["katman"], "bilgiler")
        eq(g.metin, 4)                       # 3 satir + sorgu
        memory.ara(con, {}, "markette ne harcadım", gonder=g)
        eq(g.metin, 5)                       # onbellek: yalniz sorgu
        eq(memory.ara(con, {}, "markete para", gonder=g)["sonuclar"][0]["katman"], "olanlar")
        # Metin degisince o satir yeniden gomulur.
        memory.duzelt(con, 1, "Fıstık ve ceviz alerjim var")
        memory.ara(con, {}, "alerji", gonder=g)
        eq(g.metin, 8)
        # Gomme yedege girmez; olanlar girer.
        ok("eylem" in db.BACKUP_TABLES and "king_olaylar" in db.BACKUP_TABLES)
        no("hafiza_gomme" in db.BACKUP_TABLES)
        # Motor yoksa kok eslesmesi (sistem kapanmaz).
        r = memory.ara(con, {}, "sınav tarihi")
        eq(r["yontem"], "kok")
        eq(r["sonuclar"][0]["metin"], "Sınavım 14 Haziran")
    test("arama gommeyle; onbellek; motor yoksa kok", t_ara_gomme)

    def t_baglam():
        con = db.connect(":memory:")
        for i in range(30):
            memory.add(con, "Uzun bilgi %d: " % i + "koşu " * 60)
        memory.add(con, "Fıstık alerjim var")
        eylem.kaydet(con, "spi_kayit", "Yürüyüş kaydı: 45 dk", None)
        g = SahteGomme()
        hb = memory.context(con, scope="king", cfg={}, butce=200, soru="dün yürüdüm mü", gonder=g)
        ok(ai._jeton_tahmini(hb) <= 200, ai._jeton_tahmini(hb))
        ok("[olan" in hb and "Yürüyüş" in hb, hb)
        # Ilgili: alakasiz uzun satirlar girmez.
        hb = memory.context(con, scope="king", ilgili="fıstık yiyebilir miyim", cfg={}, butce=700, gonder=g)
        eq(hb.count("[hafıza"), 1)
        ok("Fıstık" in hb)
        # Gorevli olanlari gormez.
        no("[olan" in memory.context(con, scope="bio", cfg={}, soru="yürüdüm", gonder=g))
    test("A4 baglami: ilgili hafiza ve olanlar, butce asilmaz", t_baglam)

    suite("kendiliginden King (KING-4 C)")

    def t_dogrula():
        for g, parca in ((_olay(modul="x"), "modul"), (dict(_olay(), kimlik=""), "kimlik"),
                         (dict(_olay(), tur="Uyku"), "tur"), (dict(_olay(), at="dun"), "at"),
                         (dict(_olay(), sayilar={"a": {"deger": 1, "etiket": "kesin"}}), "etiket"),
                         (dict(_olay(), sayilar={"a": {"deger": "5", "etiket": "ölçüldü"}}), "sayı")):
            o, h = kendiliginden.dogrula(g)
            ok(o is None and parca in h, (g, h))
        o, h = kendiliginden.dogrula(dict(_olay(), sayilar={"ort7": {"deger": 9, "etiket": "veri yok"}}))
        eq(o["sayilar"]["ort7"]["deger"], None)
    test("olay bicimi dogrulanir (KING-OLAY.md)", t_dogrula)

    def t_basla():
        con = db.connect(":memory:")
        r = kendiliginden.olay_al(con, {}, _olay(ort7=5.9, ort28=7.1), now=ONCE)
        eq(r["karar"], "basla")
        eq(kendiliginden.olay_al(con, {}, _olay(ort7=5.9, ort28=7.1), now=ONCE),
           {"ok": True, "id": r["id"], "karar": "basla", "tekrar": True})
        m = bekleyen.al(con, "ays", now="2026-11-01T10:01:00")
        eq(len(m), 1)
        eq(m[0]["tur"], "kendiliginden")
        ok("5,9 saat" in m[0]["metin"] and "7,1" in m[0]["metin"], m[0]["metin"])
        n = m[0]["neden"]
        eq((n["olay"], n["kural"], n["olay_id"]), ("spi.uyku_dustu", "uyku_7g_dusus", r["id"]))
        eq(n["cumle"], "spi.uyku_dustu · 7 günlük ortalama 5,9 (ölçüldü), 28 günlük ortalama 7,1 (ölçüldü)")
    test("esigi asan olay King mesajina doner; neden alani", t_basla)

    def t_kararlar():
        con = db.connect(":memory:")
        k = lambda g: kendiliginden.olay_al(con, {}, g, now=ONCE)["karar"]   # noqa: E731
        eq(k(_olay(kimlik="a", ort7=7.0, ort28=7.2)), "esik_alti")
        eq(k(dict(_olay(kimlik="b", ort28=7.2), sayilar={"ort7": {"deger": None, "etiket": "veri yok"},
                                                         "ort28": {"deger": 7.2, "etiket": "ölçüldü"}})), "eksik_veri")
        eq(k(_olay(kimlik="c", tur="yeni_bir_sey")), "kural_yok")
        eq(k(_olay(modul="esp", tur="uyku_dustu", kimlik="d", ort7=5, ort28=7)), "kural_yok")
        eq(k(_olay(kimlik="e", at="2026-10-31T08:00:00", ort7=5, ort28=7)), "bayat")
        eq(k(_olay(kimlik="f", ort7=5, ort28=7)), "basla")
        eq(k(_olay(kimlik="g", ort7=4, ort28=7)), "tekrar")
        eq(k(_olay(modul="ays", tur="sinav_yaklasti", kimlik="h", kalan_gun=29)), "esik_alti")
        eq(k(_olay(modul="ays", tur="sinav_yaklasti", kimlik="i", kalan_gun=30)), "basla")
    test("esik alti, eksik veri, kural yok, bayat, tekrar", t_kararlar)

    def t_butce_sessiz():
        con = db.connect(":memory:")
        cfg = {"king": {"kendiliginden_butce": 2}}
        gece = datetime.datetime(2026, 11, 1, 23, 30)
        for g in (_olay(modul="esp", tur="plan_kacti", kimlik="p", at="2026-11-01T23:00:00", gecikme_dk=45),
                  _olay(kimlik="u", at="2026-11-01T23:10:00", ort7=5, ort28=7),
                  _olay(modul="ays", tur="sinav_yaklasti", kimlik="s", at="2026-11-01T23:20:00", kalan_gun=7)):
            eq(kendiliginden.olay_al(con, cfg, g, now=gece)["karar"], "bekliyor")
        eq(kendiliginden.tik(con, cfg, now=datetime.datetime(2026, 11, 2, 7, 59)),
           {1: "bekliyor", 2: "bekliyor", 3: "bekliyor"})
        # Sessiz saat bitti: once sinav, sonra uyku; plan butceye takilir.
        eq(kendiliginden.tik(con, cfg, now=datetime.datetime(2026, 11, 2, 8, 1)), {3: "basla", 2: "basla", 1: "butce"})
        d = kendiliginden.durum(con, cfg, now=datetime.datetime(2026, 11, 2, 8, 2))
        eq(d["butce"], {"gun": "2026-11-02", "toplam": 2, "kullanilan": 2})
        eq([x["neden"]["olay"] for x in d["bekleyen"]], ["ays.sinav_yaklasti", "spi.uyku_dustu"])
        eq((d["sessiz"], d["sessiz_saat"]), (False, ["23:00", "08:00"]))
        # Bildirim ayarindaki sessiz saat onceliklidir; butce 0 kapatir.
        ok(kendiliginden.sessiz_mi({"bildirim": {"sessiz_bas": "13:00", "sessiz_bit": "14:00"}},
                                   datetime.datetime(2026, 11, 2, 13, 30)))
        con2 = db.connect(":memory:")
        eq(kendiliginden.olay_al(con2, {"king": {"kendiliginden_butce": 0}}, _olay(ort7=5, ort28=7), now=ONCE)["karar"],
           "butce")
        eq(kendiliginden.uc(con2, {}, "POST", "/api/olay", govde={"modul": "x"})[0], 400)
        eq(kendiliginden.uc(con2, {}, "GET", "/api/king/kendiliginden", {})[0], 200)
    test("gunluk butce, oncelik, sessiz saat, uclar", t_butce_sessiz)
