# -*- coding: utf-8 -*-
"""Depolama Burosu (core/depo.py) ve King'in yeni rolu.

   Kanitladigi sozler:
     1. Degisim OLCULUR: ayni metin 0, kucuk duzeltme esigin altinda,
        yeniden yazilmis sayfa esigin ustunde.
     2. ONCE DEPO: ayni konu yeniden istenince kaynaklar CANLI acilir;
        guncelse is depodan kapanir ve model CAGRILMAZ. Kaynak degistiyse
        Arastirma Burosu yeni SURUM yazar (onceki_id ile bagli).
     3. Web kapaliyken «guncel» denmez, «denetlenemedi» denir.
     4. King ARASTIRMAZ: sohbetteki arastirma istegi is emri olur, King
        web'e cikmaz; alt patronun sohbeti emir acmaz.
     5. King'in guncellik turu arada bir bakar: tikte bir kayit, ayni
        kayda `guncellik_gun` dolmadan donmez; degisen kayit icin emir acar.
     6. Depo denetimi kodla surumleri baglar, hicbir kaydi silmez."""
import json
import urllib.parse

from core import bam, butce, db, depo, king, sohbet, web
from tests.yardim import onayla
from tests.harness import eq, no, ok, suite, test
from tests.test_bam import _cfg
from tests.test_kaynakli import _Model
from tests.test_urun import _UrunModel

AN = "2026-09-23T10:00:00"
IKI_GUN = "2026-09-25T10:00:00"
DORT_GUN = "2026-09-27T10:00:00"
ON_GUN = "2026-10-03T10:00:00"

ILK = {
    "Osmanlı İmparatorluğu": "Osmanlı Devleti 1299 yılında Söğüt ve Domaniç çevresinde kuruldu. "
                             "Kurucusu Osman Bey'dir ve beylik kısa sürede büyüdü. " * 6,
    "Söğüt": "Söğüt, Bilecik iline bağlı bir ilçedir ve Osmanlı'nın ilk merkezi sayılır. "
             "İlçenin nüfusu yirmi bin civarındadır ve tarım önemlidir. " * 6,
}


class _Ag(object):
    """Wikipedia'yi taklit eder; `metin` degistirilerek «sayfa degisti» denir."""

    def __init__(self, metin=None):
        self.cagri, self.metin = [], dict(metin or ILK)

    def __call__(self, url, basliklar=None, govde=None, guvenilir=False):
        self.cagri.append(url)
        q = dict(urllib.parse.parse_qsl(urllib.parse.urlsplit(url).query))
        if q.get("list") == "search":
            d = {"query": {"search": [{"title": t, "snippet": t} for t in self.metin]}}
        else:
            t = q.get("titles")
            d = {"query": {"pages": {"1": {"title": t, "extract": self.metin.get(t, "")}}}}
        return 200, {"Content-Type": "application/json"}, json.dumps(d).encode("utf-8"), url


def _cfg_web():
    c = _cfg()
    c["web"] = {"acik": True}
    return c


def _tik(con, cfg, m, n, now):
    for _ in range(n):
        bam.ilerlet(con, cfg, transport=m, now=now)
        king.esitle(con, now=now)


def _arastir(con, cfg, m, konu, now, tik):
    e = onayla(con, cfg, king.emir_ac(con, cfg, "hkm", "bam.arastirma",
                                      {"arastirma": {"konu": konu}}, now=now), now=now)["emir"]
    _tik(con, cfg, m, tik, now)
    return king.emir(con, e["id"])


def run():
    suite("depo")

    def t_parmak():
        m = ILK["Osmanlı İmparatorluğu"]
        p = depo.parmak(m)
        ok(p and len(p.split()) >= 2)
        eq(depo.degisim(p, m), 0.0)
        eq(depo.degisim(p, m.replace(" ", "  ").replace("Osman", "OSMAN")), 0.0,
           "bosluk ve buyuk-kucuk harf farki sayilmaz")
        ok(depo.degisim(p, m + " Yeni bir paragraf eklendi ve sayfa genişledi burada.")
           < depo.DEGISIM_ESIGI)
        ok(depo.degisim(p, ILK["Söğüt"]) >= depo.DEGISIM_ESIGI)
        eq(depo.degisim("", m), None)
        eq(depo.konu_anahtari("  Osmanlı KURULUŞU "), depo.konu_anahtari("osmanlı kuruluşu"))
    test("degisim olculur: cumle izi ve esik", t_parmak)

    def t_once_depo():
        con, cfg, m, ag = db.connect(":memory:"), _cfg_web(), _Model(), _Ag()
        eski = bam.web_tasiyici
        bam.web_tasiyici = ag
        try:
            e1 = _arastir(con, cfg, m, "Osmanlı kuruluşu", AN, 5)   # kayit, plan, tarama, okuma, yazim
            eq(e1["durum"], "bitti")
            k1 = bam.kayit_getir(con, e1["sonuc"]["kayit_id"])
            eq(k1["dogruluk"], "kaynakli")
            eq(k1["anahtar"], depo.konu_anahtari("Osmanlı kuruluşu"))
            ok(all(x.get("parmak") for x in k1["govde"]["kaynaklar"]))
            eq(k1["govde"]["konu"], "Osmanlı kuruluşu")

            # Iki gun sonra ayni konu: King depoya bakmadan gondermez; Depolama
            # kaynaklari CANLI acar, guncel bulur, is depodan kapanir.
            cagri, model = len(ag.cagri), len(m.sistemler)
            e2 = _arastir(con, cfg, m, "osmanlı  KURULUŞU", IKI_GUN, 1)
            eq(e2["durum"], "bitti")
            eq(e2["sonuc"]["kayit_id"], k1["id"])
            eq(len(m.sistemler), model, "guncel kayitta model cagrilmaz")
            ok(len(ag.cagri) > cagri, "guncellik olculur: kaynaklar yeniden acilir")
            j2 = bam.is_getir(con, king.emir(con, e2["id"])["bam_is_id"])
            eq(j2["adimlar"][0]["depo"]["karar"], "guncel")
            ok(any(i["ajan"] == "Kayıt Doğrulama Uzmanı" for i in j2["adimlar"][0]["iz"]))
            eq(bam.kayit_getir(con, k1["id"])["denetim"]["durum"], "guncel")

            # Dort gun sonra ikinci kaynak yeniden yazilmis: yeni surum.
            ag.metin["Söğüt"] = ("Söğüt ilçesinin tarihi yeni kazılarla baştan yazıldı ve "
                                 "bulgular farklı bir kuruluş öyküsü anlatıyor. ") * 6
            e3 = _arastir(con, cfg, m, "Osmanlı kuruluşu", DORT_GUN, 5)
            eq(e3["durum"], "bitti")
            k3 = bam.kayit_getir(con, e3["sonuc"]["kayit_id"])
            ok(k3["id"] != k1["id"])
            eq((k3["surum"], k3["onceki_id"], k3["anahtar"]), (2, k1["id"], k1["anahtar"]))
            eq(bam.kayit_getir(con, k1["id"])["denetim"]["degisen"], [2])
            eq(depo.eslesen(con, k1["anahtar"])["id"], k3["id"])
        finally:
            bam.web_tasiyici = eski
    test("once depo: guncelse gonderilir, degistiyse yeni surum", t_once_depo)

    def t_urun_depodan():
        con, cfg, m, ag = db.connect(":memory:"), _cfg_web(), _UrunModel(), _Ag()
        eski = bam.web_tasiyici
        bam.web_tasiyici = ag
        try:
            g = {"urun": {"tur": "ozet", "konu": "Osmanlı kuruluşu"}}
            e1 = onayla(con, cfg, king.emir_ac(con, cfg, "hkm", "bam.urun", g, now=AN),
                        now=AN)["emir"]
            _tik(con, cfg, m, 6, AN)
            e1 = king.emir(con, e1["id"])
            eq(e1["durum"], "bitti")
            u1 = bam.kayit_getir(con, e1["sonuc"]["kayit_id"])
            ok(u1["govde"].get("dayanak"))
            model = len(m.sistemler)
            e2 = onayla(con, cfg, king.emir_ac(con, cfg, "hkm", "bam.urun", g, now=IKI_GUN),
                        now=IKI_GUN)["emir"]
            eq(e2["durum"], "onaylandi", "guncelligi olculmemis urun hemen gonderilmez")
            _tik(con, cfg, m, 1, IKI_GUN)
            e2 = king.emir(con, e2["id"])
            eq((e2["durum"], e2["sonuc"]["kayit_id"]), ("bitti", u1["id"]))
            eq(len(m.sistemler), model, "urun depodan: ne arastirma ne uretim")
            # Ayni gun ucuncu istek: guncellik az once olculdu -> King'in kapisinda.
            e3 = king.emir_ac(con, cfg, "hkm", "bam.urun", g, now=IKI_GUN)["emir"]
            eq((e3["durum"], e3["sonuc"]["kayit_id"]), ("bitti", u1["id"]))
        finally:
            bam.web_tasiyici = eski
    test("guncel arastirmaya dayanan urun depodan gonderilir", t_urun_depodan)

    def t_web_kapali():
        con = db.connect(":memory:")
        ak = depo.konu_anahtari("Fotosentez")
        izli = bam.kayit_ekle(con, "arastirma", "Fotosentez", {"konu": "Fotosentez", "kaynaklar": [
            {"n": 1, "url": "https://tr.wikipedia.org/wiki/Fotosentez", "parmak": "abc123"}]},
            dogruluk="kaynakli", anahtar=ak, now=AN)
        kapali = _cfg()
        kapali["web"] = {"acik": False}
        d = depo.karar(con, kapali, ak, now=DORT_GUN)
        eq((d["karar"], d["kayit_id"], d.get("denetlenemedi")), ("guncel", izli["id"], True))
        eq(bam.kayit_getir(con, izli["id"])["denetim"]["durum"], "denetlenemedi")
        ak2 = depo.konu_anahtari("Mitoz")
        k2 = bam.kayit_ekle(con, "arastirma", "Mitoz", {"konu": "Mitoz"}, anahtar=ak2, now=AN)
        eq(depo.karar(con, _cfg_web(), ak2, now=DORT_GUN)["karar"], "guncelle",
           "kaynaksiz kayit web acikken kaynakli surume cevrilir")
        eq(depo.karar(con, kapali, ak2, now=DORT_GUN)["karar"], "guncel")
        eq(depo.karar(con, kapali, depo.konu_anahtari("yok"), now=AN)["karar"], "yeni")
        eq(depo.karar(con, _cfg_web(), ak2, now=AN)["karar"], "guncel", "bir gunden yeni kayit")
        ok(k2["ok"])
    test("web kapaliyken guncel denmez, denetlenemedi denir", t_web_kapali)

    def t_king_arastirmaz():
        con, ag = db.connect(":memory:"), _Ag()
        eski = web.VARSAYILAN_TASIYICI
        web.VARSAYILAN_TASIYICI = ag
        try:
            r = sohbet.konus(con, _cfg_web(), "internette Osmanlı kuruluşunu araştır",
                             "2026-09-23", gorevli="king", transport=_Model(), kayit=False)
            eq(r["mode"], "emir")
            ok("Araştırma Bürosu" in r["text"] and "iş emri #" in r["text"], r["text"])
            eq(ag.cagri, [], "King sohbette web'e cikmaz")
            e = king.emirler(con)[0]
            eq((e["tur"], e["modul"], e["konu"]), ("bam.arastirma", "hkm", "Osmanlı kuruluşunu"))
            r2 = sohbet.konus(con, _cfg_web(), "internette Osmanlı kuruluşunu araştır",
                              "2026-09-23", gorevli="king", transport=_Model(), kayit=False)
            # Ayni istek: teklif zaten onay bekliyor (8a-3); ikinci emir acilmaz.
            ok("zaten onayını bekliyor" in r2["text"], r2["text"])
            eq(len(king.emirler(con)), 1)
            r3 = sohbet.konus(con, _cfg_web(), "araştır", "2026-09-23", gorevli="king",
                              transport=_Model(), kayit=False)
            ok("Neyi araştırmamı" in r3["text"])
            r4 = sohbet.konus(con, _cfg_web(), "Osmanlı kuruluşunu araştır", "2026-09-23",
                              gorevli="bio", transport=_Model(), kayit=False)
            no(r4.get("mode") == "emir", "alt patron emir acmaz")
            r5 = sohbet.konus(con, _cfg_web(), "Araştırma Bürosu ne iş yapar?", "2026-09-23",
                              gorevli="king", transport=_Model(), kayit=False)
            no(r5.get("mode") == "emir", "buronun adi arastirma istegi degildir")
            eq(ag.cagri, [])
        finally:
            web.VARSAYILAN_TASIYICI = eski
    test("King arastirmaz: istek buroya emir olur, King web'e cikmaz", t_king_arastirmaz)

    def t_coklu_is():
        """Fikir 43: tek cumlede birden cok is. Her is AYRI emir olur ve
        kendi onay kapisindan gecer; konusu olan «ve» bolunmez («turev ve
        integral ozeti»); tanınmayan parca SOYLENIR."""
        l = sohbet.is_parcalari("türev ve integral özeti hazırla ve SPİ için demir "
                                "emilimini araştır; bir de bana moda tüyoları")
        eq([x["tur"] for x in l["isler"]], ["urun", "arastirma"])
        eq(l["isler"][0]["urun"]["konu"].lower().startswith("türev ve integral"), True)
        eq(l["isler"][0]["modul"], "hkm")
        eq(l["kalan"], ["bana moda tüyoları"])
        eq(sohbet.is_parcalari("türev hakkında özet hazırla"), None, "tek is: olagan yol")
        eq(sohbet.is_parcalari("AYS için türev özeti hazırla ve ESP için İspanyolca sunum hazırla")
           ["isler"][1]["modul"], "esp")
        con, ag = db.connect(":memory:"), _Ag()
        eski = web.VARSAYILAN_TASIYICI
        web.VARSAYILAN_TASIYICI = ag
        try:
            r = sohbet.konus(con, _cfg_web(), "internette Osmanlı kuruluşunu araştır ve "
                             "türev hakkında özet hazırla", "2026-09-23", gorevli="king",
                             transport=_Model(), kayit=False)
            eq(r["command"], "coklu")
            ok(r["text"].startswith("Cümlende 2 iş var"), r["text"])
            eq(sorted(e["tur"] for e in king.emirler(con)), ["bam.arastirma", "bam.urun"])
            eq(ag.cagri, [])
        finally:
            web.VARSAYILAN_TASIYICI = eski
    test("tek cumleden cok is: her biri ayri emir", t_coklu_is)

    def t_bekci():
        con, cfg, m, ag = db.connect(":memory:"), _cfg_web(), _Model(), _Ag()
        eski = bam.web_tasiyici
        bam.web_tasiyici = ag
        try:
            e1 = _arastir(con, cfg, m, "Osmanlı kuruluşu", AN, 5)
            kid = e1["sonuc"]["kayit_id"]
        finally:
            bam.web_tasiyici = eski
        eq(king.bekci(con, cfg, now=DORT_GUN, tasiyici=ag), None, "yedi gun dolmadan bakilmaz")
        r = king.bekci(con, cfg, now=ON_GUN, tasiyici=ag)
        eq((r["kayit_id"], r["durum"]), (kid, "guncel"))
        eq(king.bekci(con, cfg, now=ON_GUN, tasiyici=ag), None, "ayni kayda hemen donulmez")
        eq(len(king.emirler(con)), 1)
        ag.metin["Osmanlı İmparatorluğu"] = "Tamamen yeni bir metin yazıldı ve eski cümleler " \
                                           "sayfadan kaldırıldı, içerik baştan düzenlendi. " * 6
        r = king.bekci(con, cfg, now="2026-10-11T10:00:00", tasiyici=ag)
        eq(r["durum"], "degisti")
        e = king.emir(con, r["emir_id"])
        eq((e["tur"], e["modul"]), ("bam.arastirma", "hkm"))
        ok("güncellik turu" in e["neden"])
        kapali = _cfg()
        kapali["web"] = {"acik": False}
        eq(king.bekci(con, kapali, now="2026-12-01T10:00:00", tasiyici=ag), None)
        cfg["web"]["guncellik_gun"] = 0
        eq(king.bekci(con, cfg, now="2026-12-01T10:00:00", tasiyici=ag), None)
    test("King'in guncellik turu arada bir bakar; degisende emir acar", t_bekci)

    def t_depo_denetim():
        con = db.connect(":memory:")
        ak = depo.konu_anahtari("Hücre")
        a = bam.kayit_ekle(con, "arastirma", "Hücre", {"konu": "Hücre"}, anahtar=ak,
                           now="2026-01-01T10:00:00")
        b = bam.kayit_ekle(con, "arastirma", "Hücre", {"konu": "Hücre"}, anahtar=ak,
                           dogruluk="kaynakli", now=AN)
        bam.kayit_ekle(con, "materyal", "Set", {}, now=AN)
        r = depo.denetim(con, now=AN)
        eq((r["toplam"], r["gecerli"], r["eski_surum"], r["yeni_baglanan"]), (3, 2, [a["id"]], 1))
        eq(bam.kayit_getir(con, b["id"])["onceki_id"], a["id"])
        eq(r["kaynaksiz"], 1)
        eq(con.execute("SELECT COUNT(*) FROM bam_kayitlar").fetchone()[0], 3, "silinmez")
        eq(depo.denetim(con, now=AN)["yeni_baglanan"], 0, "ikinci denetim yeniden baglamaz")
        ok(depo.bakim(con, now=AN) is not None)
        eq(depo.bakim(con, now=AN), None, "gunde bir kez")
        eq(depo.son_rapor(con)["toplam"], 3)
    test("depo denetimi surumleri baglar, kayit silmez", t_depo_denetim)

    # Y9 — Bilgi Deposu tarayicisi: tazelik, surum zinciri, kaynaklar.
    def _depo_con():
        con = db.connect(":memory:")
        k = [{"n": 1, "baslik": "Söğüt", "url": "https://tr.wikipedia.org/wiki/S%C3%B6%C4%9F%C3%BCt",
              "alan": "tr.wikipedia.org", "tur": "ansiklopedi", "erisim": "2026-06-01",
              "parmak": ["x"]}]
        anahtar = depo.konu_anahtari("Osmanlı kuruluşu")
        a1 = bam.kayit_ekle(con, "arastirma", "Osmanlı kuruluşu", {"ozet": "Söğüt", "kaynaklar": k},
                            dogruluk="kaynakli", now="2026-06-01T10:00:00", anahtar=anahtar)["id"]
        a2 = bam.kayit_ekle(con, "arastirma", "Osmanlı kuruluşu", {"ozet": "Söğüt 2", "kaynaklar": k},
                            dogruluk="kaynakli", onceki_id=a1, now="2026-09-01T10:00:00",
                            anahtar=anahtar)["id"]
        m = bam.kayit_ekle(con, "materyal", "Osmanlı kartları", {"dayanak": a2},
                           now="2026-09-02T10:00:00")["id"]
        p = bam.kayit_ekle(con, "plan", "Eski plan", {}, now="2026-01-01T10:00:00")["id"]
        return con, a1, a2, m, p

    def t_tarayici_tazelik():
        con, a1, a2, m, p = _depo_con()
        t = depo.tarayici(con, now=AN)
        d = {x["id"]: x["tazelik"]["durum"] for x in t["kayitlar"]}
        # Eski surum; olculmemis arastirma «guncel» DEGIL; plan suresi gecti.
        eq((d[a1], d[a2], d[p]), ("eski_surum", "olculmedi", "eskiyen"))
        eq(d[m], "olculmedi")                   # dayandigi arastirmanin durumu
        ok("#%d" % a2 in next(x for x in t["kayitlar"] if x["id"] == m)["tazelik"]["metin"])
        eq(t["sayim"]["durum"]["eski_surum"], 1)
        eq(next(x for x in t["kayitlar"] if x["id"] == a2)["kaynak"], 1)
        # Denetim sonucu okunur: kaynaklar acildi ve guncel.
        con.execute("UPDATE bam_kayitlar SET denetim=? WHERE id=?",
                    (json.dumps({"durum": "guncel", "at": "2026-09-20T09:00:00"}), a2))
        t = depo.tarayici(con, now=AN)
        x = next(x for x in t["kayitlar"] if x["id"] == a2)
        eq((x["tazelik"]["durum"], x["tazelik"]["etiket"]), ("guncel", "olculdu"))
        ok("2026-09-20" in x["tazelik"]["metin"])
    test("tarayici: tazelik koddan; olculmemis kayit guncel sayilmaz", t_tarayici_tazelik)

    def t_tarayici_suzgec():
        con, a1, a2, m, p = _depo_con()
        eq([x["id"] for x in depo.tarayici(con, sorgu="kartları", now=AN)["kayitlar"]], [m])
        eq([x["id"] for x in depo.tarayici(con, tur="arastirma", now=AN)["kayitlar"]], [a2, a1])
        r = depo.tarayici(con, durum="eski_surum", now=AN)
        eq([x["id"] for x in r["kayitlar"]], [a1])
        # Sayim suzgecten ONCE yapilir: cipler neyin kalacagini soyler.
        eq(r["sayim"]["tur"], {"arastirma": 2, "materyal": 1, "plan": 1})
        eq(depo.tarayici(con, sorgu="yokboylebirsey", now=AN)["toplam"], 0)
    test("tarayici: arama, tur ve tazelik suzgeci", t_tarayici_suzgec)

    def t_kayit_depo():
        con, a1, a2, m, p = _depo_con()
        v = depo.kayit_depo(con, a1, now=AN)
        eq([(s["id"], s["surum"], s["bu"]) for s in v["surumler"]], [(a1, 1, True), (a2, 2, False)])
        eq((v["kaynaklar"][0]["alan"], "parmak" in v["kaynaklar"][0]), ("tr.wikipedia.org", False))
        eq(depo.kayit_depo(con, 999, now=AN), None)
        # Anahtarsiz kayitta onceki_id zinciri iki yone izlenir.
        p2 = bam.kayit_ekle(con, "plan", "Eski plan", {}, onceki_id=p, now=AN)["id"]
        eq([s["id"] for s in depo.kayit_depo(con, p, now=AN)["surumler"]], [p, p2])
    test("kayit gorunumu: surum zinciri ve kaynaklar (iz parmagi disari cikmaz)", t_kayit_depo)

    def t_kayit_maliyet():
        # Kutuphanem (Part 8b): kaydi ureten isin OLCULEN maliyeti. Cagri
        # yazilmamis is sifir maliyetli sayilmaz: veri yok.
        con = db.connect(":memory:")
        j = 77                                  # kaydi ureten BAM isi
        kid = bam.kayit_ekle(con, "materyal", "Kitap", {}, is_id=j, now=AN)["id"]
        eq(depo.kayit_depo(con, kid, now=AN)["maliyet"]["etiket"], "veri_yok")
        butce.record(con, role="uretim", task="kitap", provider="p", model="m",
                     in_tok=100, out_tok=50, usd=0.012, is_id=j)
        butce.record(con, role="uretim", task="kitap", provider="p", model="m",
                     in_tok=100, out_tok=50, usd=0.008, is_id=j)
        m = depo.kayit_depo(con, kid, now=AN)["maliyet"]
        eq((m["cagri"], m["usd"], m["etiket"]), (2, 0.02, "olculdu"))
        # Issiz kayit (elle eklenmis): maliyet sorusu yok.
        el = bam.kayit_ekle(con, "plan", "El", {}, now=AN)["id"]
        eq(depo.kayit_depo(con, el, now=AN)["maliyet"], None)
    test("kayit gorunumu: ureten isin olculen maliyeti; cagrisiz is veri yok", t_kayit_maliyet)
