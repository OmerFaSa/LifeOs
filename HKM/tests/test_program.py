# -*- coding: utf-8 -*-
"""Planlama Burosu v2 (core/program.py) — her konu icin haftalik program.

   Kanitladigi sozler:
     1. Girdi kapali; hafta ve haftalik sure ZORUNLU, tahmin edilmez.
     2. Dakikayi, haftayi, tarihi ve senaryoyu KOD hesaplar: dagitim
        ogrenme suresini asmaz, her birim yerlesir, tekrar payi ve son
        haftanin genel tekrari vardir.
     3. Kapasite yetmiyorsa soylenir (tahmin), gunluk 6 saat asilirsa
        King plani reddeder.
     4. Serbest cumle kuralla ayrisir; eksik bilgi SORULUR.
     5. Zincir: King -> Depolama -> (Arastirma) -> Planlama; kaynakli
        istekte Hedef Analisti dogrulanmis bulguyu gorur. Belge basilir."""
import datetime
import json

from core import bam, cikti, db, king, program, sohbet
from tests.yardim import onayla
from tests.harness import eq, no, ok, suite, test
from tests.test_bam import _cfg
from tests.test_kaynakli import _Ag, _Model

AN = "2026-09-23T10:00:00"
BIRIMLER = {"birimler": [
    {"ad": "Kurulum ve ilk program", "agirlik": 1, "tahmini_saat": 2, "cikti": "Python çalışır."},
    {"ad": "Değişkenler ve türler", "agirlik": 2, "onkosul": [1], "tahmini_saat": 4},
    {"ad": "Koşullar ve döngüler", "agirlik": 3, "onkosul": [2, 9], "tahmini_saat": 6},
    {"ad": "Fonksiyonlar", "agirlik": 3, "onkosul": [3], "tahmini_saat": 6},
    {"ad": "Küçük proje", "agirlik": 5, "onkosul": [4, 5], "tahmini_saat": 10}],
    "notlar": ["Her birimden sonra küçük alıştırma yap."]}


class _PlanModel(_Model):
    def __call__(self, provider, anahtar, model, sistem, gecmis):
        if "Hedef Analistisin" in sistem:
            self.sistemler.append(sistem)
            self.icerikler.append(gecmis[-1]["content"])
            return json.dumps(BIRIMLER, ensure_ascii=False), 50, 80
        return super().__call__(provider, anahtar, model, sistem, gecmis)


def _g(**ek):
    g = {"konu": "Python", "hafta": 6, "haftalik_dk": 300}
    g.update(ek)
    return program.temizle(g)[0]


def _tik(con, cfg, m, n):
    for _ in range(n):
        bam.ilerlet(con, cfg, transport=m, now=AN)
        king.esitle(con, now=AN)


def run():
    suite("program")

    def t_girdi():
        g, h = program.temizle({"konu": "Python", "hafta": 6, "haftalik_dk": 300})
        eq(h, [])
        eq((g["gunler"], g["seviye"], g["kaynakli"]), (["pzt", "sal", "car", "per", "cum"],
                                                        "baslangic", False))
        for bozuk in ({"konu": "Python", "haftalik_dk": 300},
                      {"konu": "Python", "hafta": 6},
                      {"konu": "Py", "hafta": 6, "haftalik_dk": 300},
                      {"konu": "Python", "hafta": 60, "haftalik_dk": 300},
                      {"konu": "Python", "hafta": 6, "haftalik_dk": 300, "gunler": ["pzr"]},
                      {"konu": "Python", "hafta": 6, "haftalik_dk": 300, "baslangic": "yarın"},
                      {"konu": "Python", "hafta": 6, "haftalik_dk": 300, "sifre": 1},
                      {"konu": "Python", "hafta": True, "haftalik_dk": 300}):
            no(program.temizle(bozuk)[0], "bozuk: %r" % bozuk)
        eq(program.on_denetim(_g()), [])
        ok(program.on_denetim(_g(haftalik_dk=2400, gunler=["pzt", "sal"])))
    test("girdi kapali; hafta ve sure zorunlu; gunluk sinir", t_girdi)

    def t_kur():
        g = _g()
        b, notlar, hata = program.ayikla(BIRIMLER)
        eq(hata, None)
        eq([x["onkosul"] for x in b], [[], [1], [2], [3], [4]], "ileri ve olmayan onkosul duser")
        r = program.kur(g, b, notlar, datetime.date(2026, 9, 23))
        k = r["kapasite"]
        eq((k["toplam_dk"], k["etiket"]), (1800, "hesaplandi"))
        ok(sum(x["dk"] for x in b) <= k["ogrenme_dk"])
        ok(all(x["dk"] % program.DILIM == 0 for x in b))
        hs = r["haftalar"]
        eq(len(hs), 6)
        eq(hs[0]["baslangic"], "2026-09-28", "bir sonraki pazartesi")
        eq(hs[1]["baslangic"], "2026-10-05")
        eq(hs[0]["tekrar"], [])
        ok(hs[1]["tekrar"][0].startswith("Tekrar: "))
        eq(hs[-1]["tekrar"], ["Genel tekrar: bütün birimler"])
        yerlesen = {}
        for h in hs:
            for c in h["calisma"]:
                yerlesen[c["birim"]] = yerlesen.get(c["birim"], 0) + c["dk"]
        eq(yerlesen, {i + 1: x["dk"] for i, x in enumerate(b)}, "her dakika yerlesir")
        ok(all(h["ogrenme_dk"] + h["tekrar_dk"] <= g["haftalik_dk"] for h in hs))
        s = r["simulasyon"]["senaryolar"]
        eq([x["uyum"] for x in s], [100, 75, 50])
        ok(s[0]["hafta"] <= 6 < s[1]["hafta"] <= s[2]["hafta"])
        ok(r["gecti"])
        eq((r["etiketler"]["dakika"], r["etiketler"]["tahmini_saat"]), ("hesaplandi", "tahmin"))
        # Kapasite yetmiyor: soylenir, plan yine kurulur (kritik degil).
        ag = json.loads(json.dumps(BIRIMLER))
        for x in ag["birimler"]:
            x["tahmini_saat"] = 40
        b2, _, _ = program.ayikla(ag)
        r2 = program.kur(g, b2, [], datetime.date(2026, 9, 23))
        kp = next(d for d in r2["denetim"] if d["ad"] == "kapasite")
        no(kp["ok"])
        ok("(tahmin)" in kp["not"] and r2["kapasite"]["gereken_hafta"] > 6)
        ok(r2["gecti"])
        no(program.ayikla({"birimler": [{"ad": "tek"}]})[0])
    test("kod dagitir, yerlestirir, simule eder ve denetler", t_kur)

    def t_tani():
        r = program.tani("Python öğrenmek için 12 haftalık plan yap, haftada 5 saat")
        eq((r["konu"], r["hafta"], r["haftalik_dk"], r["eksik"]), ("Python öğrenmek", 12, 300, []))
        r = program.tani("3 ayda KPSS tarih için program hazırla, günde 45 dakika")
        eq((r["hafta"], r["haftalik_dk"], len(r["gunler"])), (12, 225, 5))
        eq(program.tani("gitar için plan yap")["eksik"], ["hafta", "haftalik_dk"])
        eq(program.tani("yarın için plan yap"), None)
        eq(program.tani("bugün ne yapayım"), None)
        ok("haftada ne kadar" in program.eksik_sorusu(["haftalik_dk"]))
    test("serbest cumle kuralla ayrisir; eksik sorulur", t_tani)

    def t_zincir():
        con, cfg, m = db.connect(":memory:"), _cfg(), _PlanModel()
        r = onayla(con, cfg, king.emir_ac(con, cfg, "hkm", "bam.plan", {"program": {
            "konu": "Python", "hafta": 6, "haftalik_dk": 300}}, now=AN), now=AN)
        e = r["emir"]
        eq(r["karar"], "onay")
        eq(bam.is_getir(con, e["bam_is_id"])["ofisler"], ["kayit", "planlama"])
        _tik(con, cfg, m, 2)
        son = king.emir(con, e["id"])
        eq(son["durum"], "bitti")
        k = bam.kayit_getir(con, son["sonuc"]["kayit_id"])
        eq((k["tur"], k["govde"]["tur"], k["dogruluk"]), ("plan", "program", "dogrulanmadi"))
        a = bam.is_getir(con, e["bam_is_id"])["adimlar"][1]
        eq([x["ajan"] for x in a["iz"]], ["Hedef Analisti", "Kapasite Analisti", "Program Mimarı",
                                          "Simülasyon Uzmanı", "Plan Denetçisi"])
        b = king.bildirimler(con, "hkm")["bildirimler"][0]["metin"]
        ok("HKM › Ofis" in b and "5 birim" in b, b)
        h = cikti.html_belge(cikti.belge(k))
        ok("Haftalık program" in h and "<th>Başlangıç</th>" in h and "Genel tekrar" in h)
        ok("hesaplandı" in h and "Tamam — " in h)
        red = king.emir_ac(con, cfg, "hkm", "bam.plan", {"program": {
            "konu": "Python", "hafta": 2, "haftalik_dk": 2400, "gunler": ["pzt", "sal"]}}, now=AN)
        eq(red["emir"]["durum"], "reddedildi")
    test("zincir: King -> Depolama -> Planlama; belge basilir; gunluk sinir reddedilir",
         t_zincir)

    def t_kaynakli():
        con, cfg, m = db.connect(":memory:"), _cfg(), _PlanModel()
        cfg["web"] = {"acik": True}
        eski = bam.web_tasiyici
        bam.web_tasiyici = _Ag()
        try:
            e = onayla(con, cfg, king.emir_ac(con, cfg, "hkm", "bam.plan", {"program": {
                "konu": "Osmanlı kuruluşu", "hafta": 4, "haftalik_dk": 180, "kaynakli": True}},
                now=AN), now=AN)["emir"]
            eq(bam.is_getir(con, e["bam_is_id"])["ofisler"], ["kayit", "arastirma", "planlama"])
            _tik(con, cfg, m, 6)            # kayit, plan, tarama, okuma, yazim, planlama
        finally:
            bam.web_tasiyici = eski
        son = king.emir(con, e["id"])
        eq(son["durum"], "bitti")
        k = bam.kayit_getir(con, son["sonuc"]["kayit_id"])
        eq(k["dogruluk"], "kaynakli")
        ok(k["govde"]["dayanak"] and k["govde"]["kaynaklar"])
        ok("ARAŞTIRMA BULGULARI" in m.icerikler[-1])
    test("kaynakli plan: Hedef Analisti dogrulanmis bulguyu gorur", t_kaynakli)

    def t_sohbet():
        con = db.connect(":memory:")
        r = sohbet.konus(con, _cfg(), "Python öğrenmek için 12 haftalık plan yap, haftada 5 saat",
                         "2026-09-23", gorevli="king", transport=_PlanModel(), kayit=False)
        eq((r["mode"], r["command"]), ("emir", "plan"))
        ok("Planlama Bürosu" in r["text"] and "iş emri #" in r["text"], r["text"])
        e = king.emirler(con)[0]
        eq((e["tur"], e["govde"]["program"]["hafta"]), ("bam.plan", 12))
        r2 = sohbet.konus(con, _cfg(), "gitar için plan yap", "2026-09-23", gorevli="king",
                          transport=_PlanModel(), kayit=False)
        ok("kaç haftada" in r2["text"] and "Tahminle plan kurmuyorum" in r2["text"])
        eq(len(king.emirler(con)), 1, "eksik bilgiyle emir acilmaz")
        r3 = sohbet.konus(con, _cfg(), "Python için 2 haftalık plan yap, günde 7 saat",
                          "2026-09-23", gorevli="king", transport=_PlanModel(), kayit=False)
        ok("açamadım" in r3["text"] and "6 saati" in r3["text"], r3["text"])
    test("King sohbeti: plan istegi buroya emir; eksik sorulur; sinir reddedilir", t_sohbet)
