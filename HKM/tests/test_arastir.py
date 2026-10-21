# -*- coding: utf-8 -*-
"""Hizli arastirma (core/arastir.py), YouTube (core/youtube.py) ve Ollama
Web Search (core/web.py). Testler AGA CIKMAZ: sahte tasiyici, sahte model.

   Kanitladigi sozler:
     1. Ollama anahtari girilince arama once ona gider; anahtar yoksa sessizce atlanir.
     2. Dogrudan okunamayan sayfa, anahtar varsa Ollama web_fetch ile okunur.
     3. YouTube anahtarsiz aranir, Turkce once; altyazida kavramin ANI kodla bulunur
        ve link o saniyeden acilir.
     4. Kaynaksiz cumle, kaynakta olmayan sayi ve alinti cevaba girmez.
     5. Dongu sinirlidir; son turda arac sunulmaz.
     6. King'in «video bul» istegi sohbette linkle doner; web kapaliysa eski is emri."""
import json

from core import arastir, db, models, settings, sohbet, web, youtube
from tests.harness import eq, no, ok, suite, test

BUGUN = "2026-10-21"
VID = ["abcdefghij1", "abcdefghij2", "abcdefghij3"]

YT_ARAMA = ("<html><script>var ytInitialData = %s;</script></html>" % json.dumps({"contents": [
    {"videoRenderer": {"videoId": VID[0], "title": {"runs": [{"text": "Chain rule explained"}]},
                       "ownerText": {"runs": [{"text": "Math Channel"}]}, "lengthText": {"simpleText": "8:38"}}},
    {"videoRenderer": {"videoId": VID[1], "title": {"runs": [{"text": "Türevde Zincir Kuralı"}]},
                       "ownerText": {"runs": [{"text": "Hoca"}]}, "lengthText": {"simpleText": "10:02"}}},
    {"videoRenderer": {"videoId": "kotu", "title": {"runs": [{"text": "x"}]}}},
]}, ensure_ascii=False)).encode("utf-8")
OYNATICI = {"videoDetails": {"title": "Türevde Zincir Kuralı", "author": "Hoca", "lengthSeconds": "602"},
            "captions": {"playerCaptionsTracklistRenderer": {"captionTracks": [
                {"baseUrl": "https://www.youtube.com/api/timedtext?v=x&lang=en&fmt=srv3", "languageCode": "en"},
                {"baseUrl": "https://www.youtube.com/api/timedtext?v=x&lang=tr", "languageCode": "tr",
                 "kind": "asr"}]}}}
ALTYAZI = ('<?xml version="1.0"?><transcript>'
           '<text start="0.5" dur="3">merhaba arkadaşlar</text>'
           '<text start="12.0" dur="3">bugün türev alıyoruz</text>'
           '<text start="95.2" dur="4">şimdi zincir kuralına geçelim</text>'
           '<text start="99.0" dur="4">zincir kuralı bileşke fonksiyonun türevidir</text>'
           '<text start="300.0" dur="4">ödev &amp;#39;leri yapın</text></transcript>').encode("utf-8")
WIKI_ARAMA = {"query": {"search": [{"title": "Zincir kuralı", "snippet": "türev alma kuralı"}]}}
WIKI_METIN = {"query": {"pages": {"1": {"title": "Zincir kuralı", "fullurl": "https://tr.wikipedia.org/wiki/Zincir_kural%C4%B1",
                                       "extract": "Zincir kuralı bileşke fonksiyonların türevini verir. "
                                                  "Kural 1676 yılında Leibniz tarafından kullanıldı. " * 6}}}}
OLLAMA_ARAMA = {"results": [{"title": "Zincir kuralı nedir", "url": "https://ornek.org/zincir",
                             "content": "Zincir kuralı bileşke fonksiyonun türevidir."}]}


class _Ag(object):
    def __init__(self, cevaplar):
        self.cevaplar, self.cagri = cevaplar, []

    def __call__(self, url, basliklar=None, govde=None, guvenilir=False):
        self.cagri.append({"url": url, "basliklar": basliklar or {}, "govde": govde})
        for parca, (durum, tur, g) in self.cevaplar.items():
            if parca in url:
                b = g if isinstance(g, bytes) else json.dumps(g, ensure_ascii=False).encode("utf-8")
                return durum, {"Content-Type": tur}, b, url
        return 404, {}, b"", url

    def adresler(self):
        return [c["url"] for c in self.cagri]


def _ag(**ek):
    c = {"youtube.com/results": (200, "text/html", YT_ARAMA),
         "youtubei/v1/player": (200, "application/json", OYNATICI),
         "timedtext": (200, "text/xml", ALTYAZI),
         "list=search": (200, "application/json", WIKI_ARAMA),
         "prop=extracts": (200, "application/json", WIKI_METIN),
         "ollama.com/api/web_search": (200, "application/json", OLLAMA_ARAMA),
         "ollama.com/api/web_fetch": (200, "application/json",
                                      {"title": "Zincir", "content": "Ollama okudu. " * 40}),
         "ornek.org": (200, "text/html", b"<p>az</p>")}
    c.update(ek)
    return _Ag(c)


def _cfg(web_=None):
    cfg = {"local_token": "x",
           "budget": {"monthly_try": 850.0, "usd_try": 48.6, "rate_date": BUGUN, "ceiling_currency": "try"}}
    if web_ is not None:
        cfg["web"] = web_
    return models.apply(cfg, {"keys": {"google": "AIza-test"}, "assignments": {
        "king": {"provider": "google", "model": "gemini-2.5-flash"},
        "bam.arastirma": {"provider": "google", "model": "gemini-2.5-flash"}}})


def _model(*cevaplar):
    """Sirayla cevap veren sahte saglayici. Cevap: (metin, cagrilar)."""
    sira = list(cevaplar)

    def t(provider, anahtar, model, sistem, mesajlar, ayar=None):
        t.gorulen.append({"sistem": sistem, "araclar": bool((ayar or {}).get("araclar"))})
        metin, cagri = sira.pop(0) if sira else ("Bilgi yok.", [])
        return metin, 300, 40, False, {"cagrilar": cagri} if (ayar or {}).get("araclar") else {}
    t.gorulen = []
    return t


def run():
    suite("arastir")

    def t_ollama_sira():
        con = db.connect(":memory:")
        ag = _ag()
        r = web.ara(con, _cfg(), "bam", "zincir kuralı", tasiyici=ag)
        ok(r["ok"])
        eq(r["kullanilan"], ["wikipedia"])
        no(any("ollama.com" in u for u in ag.adresler()), "anahtarsiz Ollama'ya gidilmez")
        cfg = _cfg({"anahtarlar": {"ollama": "ollama-gizli-anahtar"}})
        eq(web.sira(cfg), ["ollama", "wikipedia"])
        ag2 = _ag()
        r2 = web.ara(db.connect(":memory:"), cfg, "bam", "zincir kuralı", n=1, tasiyici=ag2)
        eq(r2["kullanilan"], ["ollama"])
        c = ag2.cagri[0]
        eq(c["basliklar"].get("Authorization"), "Bearer ollama-gizli-anahtar")
        eq(json.loads(c["govde"].decode("utf-8")), {"query": "zincir kuralı", "max_results": 1})
    test("Ollama: anahtar girilince ilk sira, yoksa sessizce atlanir", t_ollama_sira)

    def t_ollama_getir():
        ag = _ag()
        no(web.getir(db.connect(":memory:"), _cfg(), "bam", "https://ornek.org/zincir", tasiyici=ag)["ok"])
        cfg = _cfg({"anahtarlar": {"ollama": "ollama-gizli-anahtar"}})
        r = web.getir(db.connect(":memory:"), cfg, "bam", "https://ornek.org/zincir", tasiyici=_ag())
        ok(r["ok"])
        ok(r["metin"].startswith("Ollama okudu."))
    test("Ollama web_fetch: dogrudan okunamayan sayfanin yedegi", t_ollama_getir)

    def t_ayar():
        no(settings.validate({"web": {"saglayicilar": ["youtube"]}})[0], "video saglayicisi aramaya girmez")
        ok(settings.validate({"web": {"saglayicilar": ["ollama", "wikipedia"],
                                      "anahtarlar": {"ollama": "a" * 20, "youtube": "b" * 20}}})[0])
        kat = settings.read(_cfg())["web"]["katalog"]
        ok(kat["ollama"]["kayit"].startswith("https://ollama.com"))
    test("ayar: Ollama ve YouTube anahtari, nereden alinacagi katalogda", t_ayar)

    def t_youtube():
        con = db.connect(":memory:")
        ag = _ag()
        r = youtube.ara(con, _cfg(), "bam.arastirma", "zincir kuralı", tasiyici=ag)
        eq([v["id"] for v in r["videolar"]], [VID[1], VID[0]], "Turkce once, gecersiz kimlik duser")
        eq(r["videolar"][0]["sure"], 602)
        no(youtube.ara(con, _cfg(), "vp_academic", "zincir kuralı", tasiyici=ag)["ok"])
        t = youtube.transkript(con, _cfg(), "bam.arastirma", VID[1], tasiyici=ag)
        ok(t["ok"])
        eq((t["dil"], t["otomatik"]), ("tr", True), "Turkce altyazi secilir")
        ok(any("lang=tr" in u and "fmt=" not in u for u in ag.adresler()))
        a = youtube.an_bul(t["parcalar"], "türev zincir kuralı")
        eq((a["saniye"], a["an"]), (92, "1:32"))
        ok("zincir kuralı" in a["alinti"])
        eq(youtube.link(VID[1], a["saniye"]), "https://www.youtube.com/watch?v=%s&t=92s" % VID[1])
        eq(youtube.an_bul(t["parcalar"], "integral"), None)
        no(youtube.transkript(con, _cfg(), "bam", "../etc", tasiyici=ag)["ok"])
        ag2 = _ag(**{"youtubei/v1/player": (200, "application/json", {"videoDetails": {"title": "x"}})})
        r2 = youtube.transkript(db.connect(":memory:"), _cfg(), "bam", VID[0], tasiyici=ag2)
        no(r2["ok"])
        ok("altyazısı yok" in r2["note"])
    test("YouTube: anahtarsiz arama, Turkce altyazi, kavramin ani ve linki", t_youtube)

    def t_denetle():
        kaynaklar = [{"no": 1, "tur": "web", "baslik": "Zincir kuralı", "ozet": "",
                      "metin": "Kural 1676 yılında Leibniz tarafından kullanıldı."},
                     {"no": 2, "tur": "video", "baslik": "Türev", "kanal": "Hoca", "ozet": "", "metin": "",
                      "an": {"an": "1:32", "alinti": "zincir kuralına geçelim"}}]
        tut, at = arastir.denetle(
            "Zincir kuralını Leibniz 1676'da kullandı [1]. Kural 1700'de bulundu [1]. "
            "Kaynaksız bir iddia. Konu 1:32'de anlatılıyor [2]. Hoca «zincir kuralına geçelim» diyor [2]. "
            "Hoca «integral alalım» diyor [2]. Uydurma kaynak [9]. Bakınız https://kotu.org/x [1].", kaynaklar)
        eq([c["metin"] for c in tut], ["Zincir kuralını Leibniz 1676'da kullandı.",
                                       "Konu 1:32'de anlatılıyor.",
                                       "Hoca «zincir kuralına geçelim» diyor.", "Bakınız."])
        eq([a["neden"][:8] for a in at], ["sayı kay", "kaynak g", "alıntı k", "kaynak g"])
        eq(arastir.metin_cagrilari('web_ara{sorgu:<|"|>zincir kuralı<|"|>}', arastir.ARACLAR),
           [{"ad": "web_ara", "param": '{sorgu:"zincir kuralı"}'}])
        eq(arastir.metin_cagrilari("silgec{x:1}", arastir.ARACLAR), [])
    test("denetim: kaynaksiz cumle, uydurma sayi ve alinti atilir; link kodundur", t_denetle)

    def t_tetik():
        eq(arastir.video_istegi("türev zincir kuralı için video bul"), "türev zincir kuralı")
        eq(arastir.video_istegi("King youtube'da limit konu anlatımı bulur musun"), "limit")
        eq(arastir.video_istegi("dünkü videoyu sevdim"), None)
    test("video istegi taninir, konu ayiklanir", t_tetik)

    def t_dongu_web():
        con = db.connect(":memory:")
        m = _model(("", [{"ad": "web_ara", "param": {"sorgu": "zincir kuralı tarihi"}}]),
                   ("Kural 1676 yılında Leibniz tarafından kullanıldı [1]. Kaynaksız uydurma.", []))
        r = arastir.yap(con, _cfg(), "zincir kuralını araştır", konu="zincir kuralı", transport=m, tasiyici=_ag())
        ok(r["ok"])
        ok(r["text"].startswith("Kural 1676 yılında Leibniz tarafından kullanıldı [1]."))
        no("uydurma" in r["text"])
        ok("https://tr.wikipedia.org/wiki/Zincir" in r["text"])
        eq(r["adim"], 2)
        m2 = _model(*[("", [{"ad": "web_ara", "param": {"sorgu": "sorgu %d" % i}}]) for i in range(9)])
        r2 = arastir.yap(db.connect(":memory:"), _cfg(), "zincir kuralını araştır", konu="zincir kuralı",
                         transport=m2, tasiyici=_ag())
        eq(len(m2.gorulen), arastir.ADIM, "dongu sinirli")
        no(m2.gorulen[-1]["araclar"], "son turda arac sunulmaz")
        ok(r2["ok"], "model cevap yazmasa da kaynak listesi gelir")
        m3 = _model(*[("", [{"ad": "web_ara", "param": {"sorgu": "ayni"}}]) for _ in range(9)])
        arastir.yap(db.connect(":memory:"), _cfg(), "x araştır", konu="zincir kuralı", transport=m3, tasiyici=_ag())
        eq(len(m3.gorulen), 3, "ayni cagri tekrarlanmaz, arac hakki biter")
    test("dongu: model arar, kaynakli cevap kalir; adim sinirli", t_dongu_web)

    def t_dongu_video():
        m = _model()
        r = arastir.yap(db.connect(":memory:"), _cfg(), "zincir kuralı için video bul", konu="zincir kuralı",
                        video=True, transport=m, tasiyici=_ag())
        ok(r["ok"])
        eq(m.gorulen, [], "an bulunduysa model cagrilmaz")
        ok("https://www.youtube.com/watch?v=%s&t=92s" % VID[1] in r["text"])
        ok("dk. 1:32" in r["text"])
    test("video: an bulunur, link o saniyeden acilir", t_dongu_video)

    def t_sohbet():
        con = db.connect(":memory:")
        orj = web.VARSAYILAN_TASIYICI
        web.VARSAYILAN_TASIYICI = _ag()
        try:
            r = sohbet.konus(con, _cfg(), "King, zincir kuralı için video bul", BUGUN, transport=_model())
            eq(r["mode"], "arastirma")
            ok("&t=92s" in r["text"])
            r2 = sohbet.konus(db.connect(":memory:"), _cfg({"acik": False}), "zincir kuralını araştır", BUGUN,
                              transport=_model())
            eq(r2["mode"], "emir", "web kapaliysa eski yol: is emri")
        finally:
            web.VARSAYILAN_TASIYICI = orj
    test("King: video istegi sohbette linkle doner; web kapaliysa is emri", t_sohbet)
