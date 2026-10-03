# -*- coding: utf-8 -*-
"""Hedef agi ve zaman butcesi (core/hedefag.py).

   Kanitladigi sozler:
     1. Modul anlik goruntu yollar; HKM kopyasini esitler: ayni goruntu
        hicbir sey degistirmez, modulde olmayan hedef duser, bozuk ozet
        reddedilir ve sayilir. Fazla alan atilir.
     2. Butce kararini ve cumlesini KOD kurar: sigar / sikisik / sigmaz.
     3. Vakti bilinmeyen hedef toplama 0 ile girmez; adiyla soylenir.
     4. Kullanicinin toplam vakti bilinmiyorsa karar verilmez.
     5. Askidaki hedef talebe girmez."""
from core import db, hedefag
from tests.harness import eq, no, ok, suite, test


def _h(id_, ozet, dk=None, gun=None, durum="aktif", **ek):
    h = {"id": id_, "ozet": ozet, "durum": durum, "paket": "konu",
         "son_tarih": "2027-06-20"}
    if dk:
        h["kapasite"] = {"gunluk_dk": dk, "haftalik_gun": gun or 7}
    h.update(ek)
    return h


def run():
    suite("hedefag")

    def t_esitle():
        con = db.connect(":memory:")
        r = hedefag.esitle(con, "ays", [_h("a1", "AYT Fizik", 60), _h("a2", "TYT neti"),
                                        {"id": "x"}, _h("a1", "kopya", 30)])
        eq((r["ok"], r["yazilan"], r["reddedilen"], r["toplam"]), (True, 2, 2, 2))
        eq(hedefag.esitle(con, "ays", [_h("a1", "AYT Fizik", 60), _h("a2", "TYT neti")])["yazilan"], 0)
        r = hedefag.esitle(con, "ays", [_h("a1", "AYT Fizik", 90, casus="x")])
        eq((r["yazilan"], r["dusen"]), (1, 1))
        l = hedefag.hedefler(con)
        eq([(h["id"], h["kapasite"]["gunluk_dk"]) for h in l], [("a1", 90)])
        no("casus" in l[0])
        eq(hedefag.esitle(con, "king", [])["ok"], False)
        eq(hedefag.esitle(con, "ays", [_h("h%d" % i, "x") for i in range(31)])["ok"], False)
    test("modul anlik goruntu yollar; esitleme tekrarsiz, bozuk ozet sayilir", t_esitle)

    def t_butce():
        con = db.connect(":memory:")
        hedefag.esitle(con, "ays", [_h("a1", "AYT Fizik: 18 konu", 60)])
        hedefag.esitle(con, "esp", [_h("e1", "İngilizce: A1 → A2", 30, 5),
                                    _h("e2", "24 kitap", 45, durum="askida")])
        hedefag.esitle(con, "spi", [_h("s1", "Kilo: 84 → 80 kg")])
        b = hedefag.butce(con)
        eq((b["talep"], b["bant"], b["etiket"], b["askida"]), (9.5, None, "veri_yok", 1))
        ok("bilmiyorum" in b["metin"], b["metin"])
        ok("SPİ: Kilo: 84 → 80 kg" in b["metin"], b["metin"])
        eq(b["modul_saat"], {"ays": 7.0, "esp": 2.5})
        eq(hedefag.zaman_yaz(con, 5)["ok"], False)
        eq(hedefag.zaman_yaz(con, 120, 8)["ok"], False)
        hedefag.zaman_yaz(con, 90, 7)
        b = hedefag.butce(con)
        eq((b["vakit"], b["bant"], b["etiket"]), (10.5, "sigar", "tahmin"))
        ok("sığıyor, 1 saat payın var" in b["metin"], b["metin"])
        hedefag.zaman_yaz(con, 72, 7)
        b = hedefag.butce(con)
        eq((b["vakit"], b["bant"]), (8.4, "sikisik"))
        ok("sıkışık: 1,1 saat açık var" in b["metin"] and "Seçim senin" in b["metin"], b["metin"])
        hedefag.zaman_yaz(con, 30, 7)
        eq(hedefag.butce(con)["bant"], "sigmaz")
        ok("sığmıyor" in hedefag.butce(con)["metin"])
    test("butce karari ve cumlesi koddur; vakti bilinmeyen adiyla soylenir", t_butce)

    def t_bos():
        con = db.connect(":memory:")
        eq(hedefag.butce(con)["metin"], "Etkin bir hedefin yok; zaman bütçesi hesaplanacak bir şey yok.")
        p = hedefag.pano(con)
        eq(p["moduller"], {"ays": 0, "spi": 0, "esp": 0})
    test("hedef yoksa bos pano ve durust cumle", t_bos)

    def t_plan_ozeti():
        con = db.connect(":memory:")
        hedefag.esitle(con, "ays", [_h("a1", "AYT Fizik", 60, plan={
            "bitis": "2027-05-04", "ilerleme": {"durum": "geride", "metin": "2 konu geride"}}),
            _h("a2", "TYT neti", plan={"bitis": "bozuk", "ilerleme": {"durum": "uydurma"}})])
        l = {h["id"]: h for h in hedefag.hedefler(con)}
        eq(l["a1"]["plan"], {"bitis": "2027-05-04",
                             "ilerleme": {"durum": "geride", "metin": "2 konu geride"}})
        eq(l["a2"]["plan"]["bitis"], None)
        eq(l["a2"]["plan"]["ilerleme"]["durum"], "veri_yok")
    test("plan ozeti suzulur: bozuk tarih ve bilinmeyen durum kabul edilmez", t_plan_ozeti)

    def t_goruntu_sira():
        """hedefag.js goruntuyu beklemeden yollar; varis sirasi gonderim
        sirasi degildir (bkz. test_memory t_module_sync_sira). Govdenin
        TAMAMI (hedefler, tatil, yarin, dil karti) tek islemde ve sirasiyla
        yazilir: gec gelen eski govde ne biten hedefi ne kalkan tatili
        geri getirir, ne de yarinin islerini eskisiyle ezer."""
        from core import memory
        con = db.connect(":memory:")

        def say(tablo):
            return con.execute("SELECT COUNT(*) FROM %s WHERE modul='ays'" % tablo).fetchone()[0]
        tatil = {"bas": "2026-10-10", "bit": "2026-10-12"}
        eski_yarin = {"gun": "2026-10-04", "isler": [{"metin": "Eski iş", "dk": 30}]}
        yeni_yarin = {"gun": "2026-10-04", "isler": [{"metin": "Yeni iş", "dk": 45}]}
        r = hedefag.goruntu_yaz(con, "ays", {"hedefler": [_h("a1", "AYT Fizik", 60)],
                                             "tatil": tatil, "yarin": eski_yarin,
                                             "oturum": "o1", "sira": 2})
        ok(r["ok"], r)
        eq((say("hedef_ozet"), say("tatil_ozet")), (1, 1))
        r = hedefag.goruntu_yaz(con, "ays", {"hedefler": [], "tatil": None, "yarin": yeni_yarin,
                                             "oturum": "o1", "sira": 3})
        eq((r["dusen"], r["tatil"]["tatil"], r["yarin"]["adet"]), (1, None, 1))
        r = hedefag.goruntu_yaz(con, "ays", {"hedefler": [_h("a1", "AYT Fizik", 60)],
                                             "tatil": tatil, "yarin": eski_yarin,
                                             "oturum": "o1", "sira": 1})
        ok(r["ok"])
        ok(r["eski"])
        no("tatil" in r or "yarin" in r, r)
        eq((say("hedef_ozet"), say("tatil_ozet")), (0, 0), "gec gelen eski govde geri getirdi")
        eq(hedefag.yarin_oku(con, "2026-10-04")["ays"][0]["metin"], "Yeni iş")
        # Sira KANAL basinadir: hafizanin sirasi hedefinkini etkilemez.
        no(memory.esitle(con, "ays", [], oturum="o1", sira=1).get("eski"))
        ok(memory.esitle(con, "ays", [], oturum="o1", sira=1)["eski"])
        r = hedefag.goruntu_yaz(con, "ays", {"hedefler": [], "oturum": "o1", "sira": 4})
        no(r.get("eski"))
        # Bozuk govde hicbir sey yazmaz ve SIRAYI DA ILERLETMEZ: sonraki
        # gecerli goruntu (sira 5) yine uygulanir.
        r = hedefag.goruntu_yaz(con, "ays", {"hedefler": "liste degil", "tatil": tatil,
                                             "oturum": "o1", "sira": 99})
        no(r["ok"])
        eq(say("tatil_ozet"), 0)
        r = hedefag.goruntu_yaz(con, "ays", {"hedefler": [_h("a2", "TYT", 30)],
                                             "oturum": "o1", "sira": 5})
        no(r.get("eski"))
        eq(say("hedef_ozet"), 1)
        # Yeni oturum ve sirasiz govde (eski modul surumu) uygulanir.
        no(hedefag.goruntu_yaz(con, "ays", {"hedefler": [], "oturum": "o2", "sira": 1}).get("eski"))
        eq(say("hedef_ozet"), 0)
        no(hedefag.goruntu_yaz(con, "ays", {"hedefler": [_h("a3", "Geo")]}).get("eski"))
        eq(say("hedef_ozet"), 1)
        # Bozuk sira ya da oturum, ya da ikisinden yalniz biri reddedilir.
        for bozuk in ({"oturum": "o1", "sira": "2"}, {"oturum": "o1", "sira": True},
                      {"oturum": "", "sira": 5}, {"sira": 5}, {"oturum": "o1"}):
            no(hedefag.goruntu_yaz(con, "ays", dict(bozuk, hedefler=[]))["ok"], bozuk)
        eq(say("hedef_ozet"), 1)
        no(hedefag.goruntu_yaz(con, "king", {"hedefler": []})["ok"])
        no(con.in_transaction, "islem acik kaldi")
        no("goruntu_sira" in db.BACKUP_TABLES)
    test("hedef govdesi tek islemde ve sirasiyla: gec gelen eski govde yok sayilir",
         t_goruntu_sira)
