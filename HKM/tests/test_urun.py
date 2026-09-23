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
        `urun.add` olur. Kaynakli istekte Arastirma ofisi araya girer.
     6. Editor (KOD) bosluk, tekrar madde ve doz cumlesini duzeltir; Kalite
        Kontrol (KOD) uzunluk, atif orani ve kaynakta gecmeyen sayiyi olcer
        ve belge bunu soyler.
     7. Arastirma istenmese de depoda guncel arastirma varsa urun ona
        dayanir; her masanin ajani iz birakir.
     8. King sohbeti urun istegini emre cevirir; «özet» tek kelimesi ve
        «rapor ver» brifing olarak kalir."""
import json

from core import bam, cikti, db, editor, gelen, intents, king, outbox, sohbet, urunler
from tests.yardim import onayla
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
        r = onayla(con, cfg, king.emir_ac(
            con, cfg, "hkm", "bam.urun",
            {"urun": {"tur": "pankart", "konu": "Su içmenin yararları"}}, now=AN), now=AN)
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
            e = onayla(con, cfg, king.emir_ac(
                con, cfg, "ays", "bam.urun",
                {"urun": {"tur": "ozet", "konu": "Osmanlı Devleti'nin kuruluşu"}},
                now=AN), now=AN)["emir"]
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

    def t_editor():
        g = {"tur": "urun", "aile": "belge", "baslik": "D vitamini", "bolumler": [
            {"baslik": "Giriş", "bloklar": [
                {"t": "p", "metin": "D vitamini  güneşle üretilir [1] . Günde 1000 IU alınmalıdır. "
                                    "Kemik için önemlidir,kalsiyum emilimini artırır."},
                {"t": "liste", "maddeler": ["Balık yağı", "balık yağı", "Yumurta 1453'ten beri"]}]}],
            "kaynaklar": [{"n": 1, "baslik": "K", "url": "https://k.org"}]}
        y, say = editor.duzenle(g)
        bl = y["bolumler"][0]["bloklar"]
        eq(bl[0]["metin"], "D vitamini güneşle üretilir [1]. Kemik için önemlidir, kalsiyum "
                           "emilimini artırır.")
        eq(bl[1]["maddeler"], ["Balık yağı", "Yumurta 1453'ten beri"])
        eq((say["doz"], say["tekrar_dusen"]), (1, 1))
        eq(y["kaynaklar"], g["kaynaklar"], "kaynak listesine dokunulmaz")
        eq(editor.duzenle({"x": "Radyasyon dozu ölçülür."})[1]["doz"], 0, "fizikte doz serbest")
        eq(editor.duzenle({"x": "Radyasyon dozu ölçülür."}, spi=True)[1]["doz"], 1)
        k = editor.olc(y, {"uzunluk": "kisa"}, g["kaynaklar"], "güneşle üretilir", say)
        eq((k["uyum"], k["kaynaksiz_sayilar"], k["etiket"]), (False, ["1453"], "hesaplandi"))
        ok(any("1453" in n for n in k["notlar"]) and any("doz" in n for n in k["notlar"]))
        h = cikti.html_belge(cikti.belge({"id": 5, "tur": "materyal", "baslik": "x",
                                          "dogruluk": "dogrulanmadi",
                                          "govde": dict(y, kalite=k)}))
        ok("<h2>Kalite kontrolü</h2>" in h and "1453" in h)
    test("editor duzeltir, kalite olcer; belge kalite notunu tasir", t_editor)

    def t_depodaki_bilgi():
        con = db.connect(":memory:")
        cfg = _cfg()
        cfg["web"] = {"acik": True}
        m = _UrunModel()
        eski = bam.web_tasiyici
        bam.web_tasiyici = _Ag()
        try:
            onayla(con, cfg, king.emir_ac(con, cfg, "hkm", "bam.arastirma",
                                          {"arastirma": {"konu": "Su içmenin yararları"}},
                                          now=AN), now=AN)
            _tik(con, cfg, m, 5)
            e = onayla(con, cfg, king.emir_ac(
                con, cfg, "hkm", "bam.urun",
                {"urun": {"tur": "pankart", "konu": "Su içmenin yararları"}},
                now=AN), now=AN)["emir"]
            eq(bam.is_getir(con, e["bam_is_id"])["ofisler"], ["kayit", "uretim"])
            _tik(con, cfg, m, 2)
        finally:
            bam.web_tasiyici = eski
        son = king.emir(con, e["id"])
        eq(son["durum"], "bitti")
        j = bam.is_getir(con, e["bam_is_id"])
        eq(j["adimlar"][0]["depo"]["karar"], "bilgi")
        k = bam.kayit_getir(con, son["sonuc"]["kayit_id"])
        eq((k["dogruluk"], k["govde"]["dayanak"]), ("kaynakli", j["adimlar"][0]["depo"]["kayit_id"]))
        ok("ARAŞTIRMA BULGULARI" in m.icerikler[-1])
        eq([x["ajan"] for x in j["adimlar"][1]["iz"]],
           ["Üretim Mimarı", "Görsel Üretim Uzmanı", "Editör", "Kalite Kontrol Uzmanı"])
        ok(k["govde"]["kalite"]["etiket"] == "hesaplandi")
    test("depodaki guncel arastirma uretime bilgi olur; masalar iz birakir", t_depodaki_bilgi)

    def t_sohbet_urun():
        con = db.connect(":memory:")
        r = sohbet.konus(con, _cfg(), "Osmanlı kuruluşu hakkında pankart hazırla", "2026-09-23",
                         gorevli="king", transport=_UrunModel(), kayit=False)
        eq((r["mode"], r["command"]), ("emir", "urun"))
        # Onay kapisi (8a-3): cevap King'in teklifidir; is onaysiz acilmaz.
        ok("teklif" in r["text"] and "iş emri #" in r["text"] and "«1»" in r["text"],
           r["text"])
        eq(king.emirler(con)[0]["durum"], "teklif")
        e = king.emirler(con)[0]
        eq((e["tur"], e["govde"]["urun"]["tur"], e["govde"]["urun"]["konu"]),
           ("bam.urun", "pankart", "Osmanlı kuruluşu"))
        ok("Hangi konuda" in sohbet.konus(con, _cfg(), "pankart hazırla", "2026-09-23",
                                          gorevli="king", transport=_UrunModel(),
                                          kayit=False)["text"])
        for brifing in ("özet", "rapor ver", "bugünün özetini çıkar"):
            eq(sohbet.urun_istegi(brifing), None, brifing)
        u = sohbet.urun_istegi("internetten araştırarak yapay zekâ etiği raporu yaz")
        eq((u["tur"], u["konu"], u["kaynakli"]), ("rapor", "yapay zekâ etiği", True))
        eq(len(king.emirler(con)), 1)
    test("King sohbeti urun istegini emre cevirir; brifing kelimeleri urun degildir",
         t_sohbet_urun)

    def t_dosya_adi_ascii():
        """Chromium, `download` ozniteligindeki Turkce harfi («türev-1.pdf»)
        gorunce dosyayi «download» adiyla ve UZANTISIZ indiriyordu. Ad
        ASCII'ye katlanir; kanal ve tarayici her birinde ayni gorunur."""
        eq(cikti.dosya_adi({"baslik": "Türev ve Şekil Çizimi: Ağaç, Göl, Işık", "kimlik": 3}, "pdf"),
           "turev-ve-sekil-cizimi-agac-gol-isik-3.pdf")
        eq(cikti.dosya_adi({"baslik": "!!!", "kimlik": 4}, "svg"), "bam-4.svg")
    test("indirilen dosyanin adi ASCII", t_dosya_adi_ascii)

    def t_modulden_urun():
        """W6 — modul sohbetindeki urun istegi King'e MODUL ADINA gider;
        bitince urun o module `urun.add` teklifi olur. Taniyici HKM'dedir:
        taninmayan cumle `tanindi: False` ile doner ve emir acilmaz."""
        con = db.connect(":memory:")
        cfg, m = _cfg(), _UrunModel()
        r = sohbet.urun_modulden(con, cfg, "spi", "Su içmenin yararları hakkında pankart hazırla",
                                 now=AN)
        eq((r["ok"], r["tanindi"], r["tur"]), (True, True, "pankart"))
        ok("SPİ’ye teklif olarak gelir" in r["metin"], r["metin"])
        ok("SPİ’nin Bugün ekranındaki King teklifi kartından" in r["metin"], r["metin"])
        e = king.emirler(con)[0]
        eq((e["modul"], e["tur"], e["durum"]), ("spi", "bam.urun", "teklif"))
        king.teklif_onayla(con, cfg, e["id"], now=AN)       # kullanicinin onayi
        _tik(con, cfg, m, 2)
        n = intents.take(con, "spi")["intents"]
        eq([x["kind"] for x in n], ["urun.add"])
        eq(n[0]["payload"]["urun"], "pankart")
        eq(sohbet.urun_modulden(con, cfg, "spi", "bugün ne yapmalıyım"),
           {"ok": True, "tanindi": False})
        no(sohbet.urun_modulden(con, cfg, "hkm", "türev özeti hazırla")["ok"])
        eq(len(king.emirler(con)), 1)
    test("modulden istenen urun King'e modul adina gider, teklif olarak doner", t_modulden_urun)

    def t_on_suzgec_ayni():
        """Modullerin on suzgeci (brand/ortak/urun.js) katalogla AYNI kelimeleri
        tasir: iki liste ayrisirsa bir urun modulde hic taninmazdi."""
        import os
        import re
        yol = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(
            os.path.abspath(__file__)))), "brand", "ortak", "urun.js")
        with open(yol, encoding="utf-8") as f:
            js = f.read()
        blok = re.search(r"const KELIMELER = \[(.*?)\];", js, re.S).group(1)
        kelimeler = set(re.findall(r"'([^']+)'", blok))
        eq(kelimeler, {w for u in urunler.URUNLER.values() for w in u["kelime"]})
        fiil = re.search(r"const FIIL = /(.*?)/;", js).group(1)
        eq(fiil, sohbet.URUN_FIIL.pattern)
    test("modul on suzgeci katalogla ayni kelimeleri tasir", t_on_suzgec_ayni)

    # W5 — Telegram'dan gelen is, sonucunu Telegram'a birakir.
    def _telegram_cfg():
        cfg = _cfg()
        cfg["channels"] = {"telegram": {"enabled": True, "bot_token": "B", "allow_from": ["7"]}}
        return cfg

    def _tasiyici(giden):
        def t(url, govde, basliklar=None):
            giden.append((url, govde))
            return 200, '{"ok": true, "result": {"message_id": 1}}'
        return t

    def t_telegram_teslim():
        con = db.connect(":memory:")
        cfg, m, giden = _telegram_cfg(), _UrunModel(), []
        tas = _tasiyici(giden)
        r = gelen.isle(con, cfg, "telegram", {"from": "7", "id": "1",
                       "text": "Osmanlı kuruluşu hakkında pankart hazırla"},
                       transport=tas, date="2026-09-23")
        eq((r["command"], r["sent"]), ("urun", 1))
        e = king.emirler(con)[0]
        eq((e["tur"], e["kanal"], e["hedef"], e["durum"]), ("bam.urun", "telegram", "7", "teklif"))
        ok("«1»" in json.dumps(giden[0][1], ensure_ascii=False), giden[0][1])
        # Kullanici teklifi ayni sohbetten onaylar (8a-3).
        del giden[:]
        r = gelen.isle(con, cfg, "telegram", {"from": "7", "id": "1b", "text": "1"},
                       transport=tas, date="2026-09-23")
        eq(r["command"], "teklif")
        ok("buraya yollarım" in json.dumps(giden[0][1], ensure_ascii=False), giden[0][1])
        eq(king.emir(con, e["id"])["durum"], "onaylandi")
        del giden[:]
        _tik(con, cfg, m, 2)
        eq(king.emir(con, e["id"])["durum"], "bitti")
        # 8a-1: isin model cagrilari ISE yazilir; maliyet defterden olculur.
        m_ = king.emir(con, e["id"])["sonuc"]["maliyet"]
        bam_is = king.emir(con, e["id"])["bam_is_id"]
        n_ = con.execute("SELECT COUNT(*) FROM usage WHERE is_id=?", (bam_is,)).fetchone()[0]
        ok(n_ >= 1 and m_["cagri"] == n_, (m_, n_))
        eq(con.execute("SELECT COUNT(*) FROM usage WHERE is_id IS NOT NULL AND is_id<>?",
                       (bam_is,)).fetchone()[0], 0)
        eq(outbox.flush(con, cfg, transport=tas)["sent"], 2)
        eq(sorted(u.rsplit("/", 1)[1] for u, _ in giden), ["sendDocument", "sendMessage"])
        mesaj = next(g for u, g in giden if u.endswith("sendMessage"))
        ok("bitti" in json.dumps(mesaj, ensure_ascii=False), mesaj)
        belge = next(g for u, g in giden if u.endswith("sendDocument"))
        ok(b"%PDF" in belge or b"filename=" in belge)
        ok(b'name="chat_id"\r\n\r\n7' in belge)
        # Ayni durum iki kez gitmez: esitleme tekrar kossa da kuyruk bostur.
        _tik(con, cfg, m, 1)
        eq(outbox.flush(con, cfg, transport=tas)["sent"], 0)
        # Ayni istek yeniden gelirse is depodan kapanir; yalniz belge gider.
        del giden[:]
        r2 = gelen.isle(con, cfg, "telegram", {"from": "7", "id": "2",
                        "text": "Osmanlı kuruluşu hakkında pankart hazırla"},
                        transport=tas, date="2026-09-23")
        eq(r2["sent"], 2)
        ok("depoda hazırdı" in json.dumps(giden, ensure_ascii=False, default=str))
        eq(len([u for u, _ in giden if u.endswith("sendDocument")]), 1)
    test("Telegram'dan istenen isin sonucu ve belgesi ayni sohbete teslim edilir",
         t_telegram_teslim)

    def t_teslim_kanallari():
        con = db.connect(":memory:")
        cfg, m = _cfg(), _UrunModel()
        a = onayla(con, cfg, king.emir_ac(
            con, cfg, "hkm", "bam.urun", {"urun": {"tur": "pankart", "konu": "Su içmenin yararları"}},
            now=AN, kanal="whatsapp", hedef="905551112233"), now=AN)["emir"]
        b = onayla(con, cfg, king.emir_ac(
            con, cfg, "hkm", "bam.urun", {"urun": {"tur": "pankart", "konu": "Uyku düzeni"}},
            now=AN, kanal="local", hedef="x"), now=AN)["emir"]
        eq((a["kanal"], b["kanal"], b["hedef"]), ("whatsapp", None, None))
        _tik(con, cfg, m, 4)
        satir = [dict(x) for x in con.execute("SELECT * FROM outbox").fetchall()]
        eq([(x["channel"], x["target"], x["ek"]) for x in satir],
           [("whatsapp", "905551112233", None)])
        ok("belge gönderilemiyor" in satir[0]["text"] and "bitti" in satir[0]["text"],
           satir[0]["text"])
    test("belge yolu olmayan kanala metin gider ve bu soylenir; ekrandan gelen emre mesaj gitmez",
         t_teslim_kanallari)
