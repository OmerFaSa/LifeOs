# -*- coding: utf-8 -*-
"""Web katmani (core/web.py). Testler AGA CIKMAZ: sahte tasiyici.

   Kanitladigi sozler:
     1. Web yalniz King ve BAM kademelerine aciktir.
     2. Yerel ag, bu makine ve ayrilmis adresler okunmaz.
     3. Kisisel veri tasiyan sorgu disari gitmez.
     4. Saglayici zinciri: hazir olmayan atlanir ve nedeni yazilir.
     5. Once onbellek; kacinilan cagri sayilir; gunluk sinir asilmaz.
     6. Sayfa metne cevrilir: betik, gezinti, alt bilgi atilir."""
import json

from core import db, settings, web
from tests.harness import eq, no, ok, suite, test

AN = "2026-09-23T10:00:00"

WIKI_ARAMA = {"query": {"search": [
    {"title": "Osmanlı İmparatorluğu", "snippet": "<span>Osmanlı</span> Devleti 1299"},
    {"title": "Söğüt", "snippet": "Bilecik ilçesi"}]}}
WIKI_METIN = {"query": {"pages": {"1": {"title": "Osmanlı İmparatorluğu",
                                       "fullurl": "https://tr.wikipedia.org/wiki/Osmanl%C4%B1",
                                       "extract": "Osmanlı Devleti 1299 yılında kuruldu. " * 20}}}}
SAYFA = ("<html lang='tr'><head><title>Kuruluş Dönemi</title>"
         "<meta property='article:published_time' content='2024-05-01T10:00:00Z'>"
         "<script>alert('x')</script><style>p{}</style></head><body><nav>Menü Menü</nav>"
         "<h1>Osmanlı'nın kuruluşu</h1><p>" + "Osman Bey 1299'da beylik kurdu. " * 12 +
         "</p><footer>Telif</footer></body></html>")


class _Ag(object):
    def __init__(self, cevaplar):
        self.cevaplar, self.cagri = cevaplar, []

    def __call__(self, url, basliklar=None, govde=None, guvenilir=False):
        self.cagri.append(url)
        for parca, (durum, tur, govde_) in self.cevaplar.items():
            if parca in url:
                b = govde_ if isinstance(govde_, bytes) else json.dumps(govde_).encode("utf-8")
                return durum, {"Content-Type": tur}, b, url
        return 404, {}, b"", url


def _wiki():
    return _Ag({"list=search": (200, "application/json", WIKI_ARAMA),
                "prop=extracts": (200, "application/json", WIKI_METIN),
                "ornek.org": (200, "text/html; charset=utf-8", SAYFA.encode("utf-8")),
                "resim.org": (200, "image/png", b"\x89PNG" * 100),
                "kisa.org": (200, "text/html", b"<p>az</p>")})


def run():
    suite("web")

    def t_izin():
        for r in ("king", "bam", "bam.arastirma", "bam.uretim"):
            ok(web.izinli(r), r)
        for r in ("vp_bio", "vp_academic", "ays.sohbet", "spi.plan", "esp.gorsel", "", None):
            no(web.izinli(r), r)
        con = db.connect(":memory:")
        r = web.ara(con, {}, "ays.sohbet", "Osmanlı kuruluşu", tasiyici=_wiki())
        no(r["ok"])
        ok("erişimi yok" in r["note"])
    test("web yalniz King ve BAM kademelerine acik", t_izin)

    def t_adres():
        for u in ("http://127.0.0.1/", "http://192.168.1.5/x", "http://10.0.0.1",
                  "http://169.254.169.254/latest", "http://[::1]/", "http://localhost:4200/",
                  "ftp://8.8.8.8/", "http://kisi:sifre@8.8.8.8/", "http://yazici.local/"):
            no(web.url_uygun_mu(u)[0], u)
        ok(web.url_uygun_mu("https://8.8.8.8/")[0])
    test("yerel ag ve bu makine okunmaz", t_adres)

    def t_kisisel():
        for s in ("ali@ornek.com ile ilgili", "0532 123 45 67 kimin", "12345678901 sorgu", "ab"):
            no(web.sorgu_uygun_mu(s)[0], s)
        eq(web.sorgu_uygun_mu("  KPSS   genel kültür ")[0], "KPSS genel kültür")
    test("kisisel veri tasiyan sorgu disari gitmez", t_kisisel)

    def t_ara_ve_onbellek():
        con = db.connect(":memory:")
        ag = _wiki()
        r = web.ara(con, {}, "bam.arastirma", "Osmanlı kuruluşu", tasiyici=ag, now=AN)
        ok(r["ok"] and not r["onbellekten"])
        eq([x["baslik"] for x in r["sonuclar"]], ["Osmanlı İmparatorluğu", "Söğüt"])
        eq(r["sonuclar"][0]["ozet"], "Osmanlı Devleti 1299")
        eq(r["sonuclar"][0]["alan"], "tr.wikipedia.org")
        r2 = web.ara(con, {}, "king", "osmanlı KURULUŞU", tasiyici=ag, now=AN)
        ok(r2["onbellekten"])
        eq(len(ag.cagri), 1, "ikinci arama aga cikmamali")
        d = web.durum(con, {}, now=AN)
        eq((d["bugun"]["cagri"], d["bugun"]["kacinilan"]), (1, 1))
    test("once onbellek; kacinilan cagri sayilir", t_ara_ve_onbellek)

    def t_zincir_ve_sinir():
        con = db.connect(":memory:")
        cfg = {"web": {"saglayicilar": ["brave", "wikipedia"], "gunluk_sinir": 1}}
        r = web.ara(con, cfg, "bam", "Söğüt ilçesi", tasiyici=_wiki(), now=AN)
        ok(r["ok"])
        eq(r["kullanilan"], ["wikipedia"])
        ok(any("anahtar girilmemiş" in h for h in r["hatalar"]))
        r2 = web.ara(con, cfg, "bam", "Bilecik ili", tasiyici=_wiki(), now=AN)
        no(r2["ok"])
        ok("Günlük web sınırına" in r2["note"])
        kapali = web.ara(con, {"web": {"acik": False}}, "bam", "Bilecik", tasiyici=_wiki(), now=AN)
        ok("kapalı" in kapali["note"])
    test("saglayici zinciri; gunluk sinir asilmaz; kapaliysa soylenir", t_zincir_ve_sinir)

    def t_getir():
        con = db.connect(":memory:")
        ag = _wiki()
        s = web.getir(con, {}, "bam.arastirma", "https://ornek.org/osmanli", tasiyici=ag, now=AN)
        ok(s["ok"])
        eq((s["baslik"], s["yayin"], s["alan"], s["erisim"]),
           ("Kuruluş Dönemi", "2024-05-01T10:00:00Z", "ornek.org", "2026-09-23"))
        ok("Osman Bey 1299" in s["metin"])
        no("alert" in s["metin"] or "Menü" in s["metin"] or "Telif" in s["metin"])
        w = web.getir(con, {}, "bam", "https://tr.wikipedia.org/wiki/Osmanl%C4%B1", tasiyici=ag, now=AN)
        ok(w["ok"] and "1299 yılında" in w["metin"])
        no(web.getir(con, {}, "bam", "https://resim.org/a.png", tasiyici=ag, now=AN)["ok"])
        no(web.getir(con, {}, "bam", "https://kisa.org/", tasiyici=ag, now=AN)["ok"])
        no(web.getir(con, {}, "bam", "http://127.0.0.1:4200/api", tasiyici=ag, now=AN)["ok"])
        ok(web.getir(con, {}, "bam", "https://ornek.org/osmanli", tasiyici=ag, now=AN)["onbellekten"])
    test("sayfa metne cevrilir; resim, bos sayfa ve yerel adres okunmaz", t_getir)

    def t_ayar():
        ok_, h = settings.validate({"web": {"saglayicilar": ["bing"]}})
        no(ok_)
        no(settings.validate({"web": {"anahtarlar": {"wikipedia": "x"}}})[0])
        no(settings.validate({"web": {"searxng_url": "ftp://x"}})[0])
        ok(settings.validate({"web": {"anahtarlar": {"brave": "BSA-gizli-anahtar-123"},
                                      "saglayicilar": ["brave", "wikipedia"]}})[0])
        cfg = settings.apply({"local_token": "t"}, {"web": {"anahtarlar": {"brave": "BSA-gizli-anahtar-123"}}})
        oku = settings.read(cfg)["web"]
        eq(oku["anahtarlar"]["brave"], "…-123")
        no("BSA-gizli" in json.dumps(oku))
        cfg2 = settings.apply(cfg, {"web": {"anahtarlar": {"brave": "…-123"}}})
        eq(cfg2["web"]["anahtarlar"]["brave"], "BSA-gizli-anahtar-123", "maske anahtari ezmemeli")
        cfg3 = settings.apply(cfg, {"web": {"anahtarlar": {"brave": ""}}})
        eq(cfg3["web"]["anahtarlar"], {})
    test("ayar: saglayici kapali kume, anahtar maskeli ve maske anahtari ezmez", t_ayar)
