# -*- coding: utf-8 -*-
"""Urun katalogu (core/urunler.py) ve cikti (core/cikti.py).

   Kanitladigi sozler:
     1. Serbest cumle kuralla urune cevrilir; taninmayan cumle urun degildir.
     2. Modelin ciktisi kodla suzulur; kaynak listesinde olmayan [n] atifi
        metinden silinir; hic icerik kalmazsa urun yazilmaz.
     3. HTML'de her metin kacislanir; etiket basligin yaninda; soru setinde
        cevap anahtari SONDA.
     4. Gorsel urunun yerlesimi kodundur ve SVG'ye basilir.
     5. HKM'den istenen urun modul teklifine donusmez; modulden istenen
        `urun.add` olur. Kaynakli istekte Arastirma ofisi araya girer."""
import json

from core import bam, cikti, db, intents, king, urunler
from tests.harness import eq, no, ok, suite, test
from tests.test_bam import _cfg
from tests.test_kaynakli import _Ag, _Model

AN = "2026-09-23T10:00:00"

BELGE = {"baslik": "Kurtuluş Savaşı", "alt_baslik": "Kısa özet", "bolumler": [
    {"baslik": "Giriş", "bloklar": [
        {"t": "p", "metin": "Savaş 1919'da başladı [1] ve <script>alert(1)</script> [5]."},
        {"t": "liste", "maddeler": ["Kongreler", "", "TBMM"]},
        {"t": "tablo", "basliklar": ["Yıl", "Olay"], "satirlar": [["1920", "TBMM"], ["x"]]},
        {"t": "bilinmeyen", "metin": "x"}]},
    {"baslik": "Boş", "bloklar": []}],
    "anahtar_kavramlar": [{"terim": "Misak-ı Millî", "tanim": "Ulusal ant [1]"}]}


class _UrunModel(_Model):
    def __call__(self, provider, anahtar, model, sistem, gecmis):
        if "Üretim Bürosusun" in sistem:
            self.sistemler.append(sistem)
            self.icerikler.append(gecmis[-1]["content"])
            if '"vurgu"' in sistem:
                return json.dumps({"baslik": "Su iç", "maddeler": ["Günde 8 bardak", "Az şeker"],
                                   "vurgu": "2 L"}), 10, 10
            return json.dumps({"baslik": "Osmanlı'nın kuruluşu", "bolumler": [{"baslik": "Giriş",
                               "bloklar": [{"t": "p", "metin": "1299'da kuruldu [1] [7]."}]}]},
                              ensure_ascii=False), 10, 10
        return super().__call__(provider, anahtar, model, sistem, gecmis)


def _tik(con, cfg, m, n):
    for _ in range(n):
        bam.ilerlet(con, cfg, transport=m, now=AN)
        king.esitle(con, now=AN)


def run():
    suite("urun")

    def t_tani():
        r = urunler.tani("Osmanlı kuruluşu hakkında pankart hazırla")
        eq((r["tur"], r["konu"]), ("pankart", "Osmanlı kuruluşu"))
        r = urunler.tani("özet: Kurtuluş Savaşı, kısa")
        eq((r["tur"], r["konu"], r["uzunluk"]), ("ozet", "Kurtuluş Savaşı", "kisa"))
        eq(urunler.tani("fotosentez zihin haritası")["konu"], "fotosentez")
        eq(urunler.tani("ders notu: türev")["tur"], "ders_notu")
        r = urunler.tani("kaynaklı rapor: yapay zekâ etiği, pdf olarak")
        eq((r["tur"], r["kaynakli"], r["pdf"]), ("rapor", True, True))
        eq(r["konu"], "yapay zekâ etiği")
        eq(urunler.tani("merhaba nasılsın"), None)
    test("serbest cumle kuralla urune cevrilir", t_tani)

    def t_girdi():
        g, h = urunler.temizle({"tur": "pankart", "konu": "Su içmek"})
        eq((h, g["kaynakli"], g["uzunluk"]), ([], False, "orta"))
        eq(urunler.temizle({"tur": "ozet", "konu": "Türev"})[0]["kaynakli"], True)
        for bozuk in ({"tur": "roman", "konu": "x y z"}, {"tur": "ozet", "konu": "a"},
                      {"tur": "ozet", "konu": "Türev", "uzunluk": "dev"},
                      {"tur": "ozet", "konu": "Türev", "sifre": 1}):
            no(urunler.temizle(bozuk)[0], "bozuk: %r" % bozuk)
    test("girdi kapali; kaynak varsayilani ture gore", t_girdi)

    def t_suzme():
        g, neden = urunler.ayikla("ozet", BELGE, [{"n": 1, "baslik": "K", "url": "https://k.org"}])
        eq(neden, None)
        bl = g["bolumler"][0]["bloklar"]
        eq([b["t"] for b in bl], ["p", "liste", "tablo"])
        ok("[1]" in bl[0]["metin"] and "[5]" not in bl[0]["metin"])
        eq(bl[1]["maddeler"], ["Kongreler", "TBMM"])
        eq(bl[2]["satirlar"], [["1920", "TBMM"]])
        eq(len(g["bolumler"]), 1)
        no(urunler.ayikla("ozet", {"bolumler": []})[0])
        no(urunler.ayikla("pankart", {"baslik": "X", "maddeler": ["tek"]})[0])
        ok(urunler.ayikla("zihin_haritasi", {"merkez": "Hücre", "dallar": [{"ad": "Zar"},
                                                                           {"ad": "Çekirdek"}]})[0])
        ok(urunler.ayikla("sunum", {"slaytlar": [{"baslik": "A"}, {"baslik": "B"}]})[0])
    test("model ciktisi kodla suzulur; kaynaksiz atif silinir", t_suzme)

    def t_html():
        g, _ = urunler.ayikla("ozet", BELGE, [{"n": 1, "baslik": "Kaynak <b>", "url": "https://k.org",
                                               "alan": "k.org", "erisim": "2026-09-23"}])
        h = cikti.html_belge(cikti.belge({"id": 3, "tur": "materyal", "baslik": "x",
                                          "dogruluk": "kaynakli", "govde": g}))
        no("<script>" in h)
        ok("&lt;script&gt;" in h)
        ok('<sup><a href="#k1">[1]</a></sup>' in h)
        ok('rel="noopener noreferrer"' in h and "Kaynak &lt;b&gt;" in h)
        ok('class="rozet kaynakli">kaynaklı' in h)
        soru = {"id": 4, "tur": "materyal", "baslik": "Set", "dogruluk": "dogrulanmadi",
                "govde": {"tur": "soru", "maddeler": [{"soru": "2+2?", "secenekler": list("12345"),
                                                       "dogru": "D", "cozum": "Toplama."}]}}
        h2 = cikti.html_belge(cikti.belge(soru))
        ok(h2.index("Cevap anahtarı") > h2.index("2+2?"))
        ok("1-D" in h2 and "doğrulanmadı" in h2)
    test("HTML kacislanir, etiket gorunur, cevap anahtari sonda", t_html)

    def t_gorsel():
        for tur, d in (("pankart", {"baslik": "Su <iç>", "maddeler": ["A madde", "B madde"],
                                    "vurgu": "2 L"}),
                       ("zihin_haritasi", {"merkez": "Hücre", "dallar": [
                           {"ad": "Zar", "alt": ["Seçici geçirgen"]}, {"ad": "Çekirdek", "alt": []}]}),
                       ("zaman_cizelgesi", {"olaylar": [{"tarih": "1919", "baslik": "Samsun"},
                                                        {"tarih": "1923", "baslik": "Cumhuriyet"}]})):
            g, neden = urunler.ayikla(tur, d)
            eq(neden, None)
            k = {"id": 9, "tur": "materyal", "baslik": "g", "dogruluk": "dogrulanmadi", "govde": g}
            bayt, mime, ad = cikti.uret(k, "svg")
            eq(mime, "image/svg+xml")
            s = bayt.decode("utf-8")
            ok(s.startswith("<svg") and "<text" in s, tur)
            no("<iç>" in s)
            ok(ad.endswith("-9.svg"))
        eq(cikti.uret({"id": 1, "tur": "arastirma", "baslik": "a", "govde": {}}, "svg")[0], None)
        ok(cikti.sar("bir iki üç dört beş altı yedi", 20, 60) != ["bir iki üç dört beş altı yedi"])
    test("gorsel urunun yerlesimi koddur ve SVG'ye basilir", t_gorsel)

    def t_hkm_zinciri():
        con = db.connect(":memory:")
        cfg, m = _cfg(), _UrunModel()
        r = king.emir_ac(con, cfg, "hkm", "bam.urun",
                         {"urun": {"tur": "pankart", "konu": "Su içmenin yararları"}}, now=AN)
        e = r["emir"]
        eq((r["karar"], [z["kat"] for z in e["iz"]][:3]), ("onay", ["kullanici", "king", "bam"]))
        eq(bam.is_getir(con, e["bam_is_id"])["ofisler"], ["kayit", "uretim"])
        _tik(con, cfg, m, 2)
        son = king.emir(con, e["id"])
        eq(son["durum"], "bitti")
        k = bam.kayit_getir(con, son["sonuc"]["kayit_id"])
        eq((k["govde"]["urun"], k["dogruluk"]), ("pankart", "dogrulanmadi"))
        eq(intents.take(con, "ays")["intents"], [])
        b = king.bildirimler(con, "hkm")["bildirimler"]
        ok(any("Ofis" in x["metin"] for x in b))
    test("HKM'den istenen urun teklif olmaz; Ofis'ten acilir", t_hkm_zinciri)

    def t_kaynakli_zincir():
        con = db.connect(":memory:")
        cfg = _cfg()
        cfg["web"] = {"acik": True}
        m = _UrunModel()
        eski = bam.web_tasiyici
        bam.web_tasiyici = _Ag()
        try:
            e = king.emir_ac(con, cfg, "ays", "bam.urun",
                             {"urun": {"tur": "ozet", "konu": "Osmanlı Devleti'nin kuruluşu"}},
                             now=AN)["emir"]
            eq(bam.is_getir(con, e["bam_is_id"])["ofisler"], ["kayit", "arastirma", "uretim"])
            _tik(con, cfg, m, 6)          # kayit, plan, tarama, okuma, yazim, uretim
        finally:
            bam.web_tasiyici = eski
        son = king.emir(con, e["id"])
        eq(son["durum"], "bitti")
        k = bam.kayit_getir(con, son["sonuc"]["kayit_id"])
        eq(k["dogruluk"], "kaynakli")
        eq([x["n"] for x in k["govde"]["kaynaklar"]], [1])
        metin = k["govde"]["bolumler"][0]["bloklar"][0]["metin"]
        ok("[1]" in metin and "[7]" not in metin)
        ok("ARAŞTIRMA BULGULARI" in m.icerikler[-1])
        n = intents.take(con, "ays")["intents"]
        eq([x["kind"] for x in n], ["urun.add"])
        eq(n[0]["payload"]["urun"], "ozet")
    test("kaynakli istek: Arastirma araya girer; urun dogrulanmis bulguya dayanir", t_kaynakli_zincir)
