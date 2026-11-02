# -*- coding: utf-8 -*-
"""Model merdiveni (A6) ve kart cumlesi HTTP uclari testleri (064)."""
import datetime

from core import butce, db
from tests.harness import eq, no, ok, suite, test


def run():
    from tests.test_daemon import _Server

    suite("model merdiveni ve kart cumlesi uclari")
    s = _Server()
    try:
        def t_ai_olcum_yetki_ve_anahtarlar():
            # 1. GET /api/ai_olcum jetonsuz 401; jetonla 200 ve toplam, satirlar, seviyeler, dususler anahtarları (liste).
            st, _ = s.call("/api/ai_olcum", token=None)
            eq(st, 401)

            st, r = s.call("/api/ai_olcum")
            eq(st, 200)
            for k in ("toplam", "satirlar", "seviyeler", "dususler"):
                ok(k in r, "anahtar eksik: %s" % k)
            ok(isinstance(r["seviyeler"], list), "seviyeler liste olmali")
            ok(isinstance(r["dususler"], list), "dususler liste olmali")
        test("GET /api/ai_olcum jetonsuz 401, jetonla 200 ve seviyeler, dususler anahtarlari", t_ai_olcum_yetki_ve_anahtarlar)

        def t_ai_olcum_defter_kayitlari():
            # 2. Sunucunun veritabanına butce.record(..., seviye="yerel", neden="kolay iş (alt)") ve
            #    (..., seviye="yerel", neden="düşüş: google kotası dolu, 10:00'a kadar denenmez") ile iki satır yazılır;
            #    GET /api/ai_olcum?date=<bugün> seviyelerde {seviye:"yerel", cagri:2}, dususlerde tek satır (neden «düşüş» ile başlar).
            con = db.connect(s.db_path)
            try:
                butce.record(con, role="king", task="sohbet", provider="ollama", model="gemma4:e2b",
                             seviye="yerel", neden="kolay iş (alt)")
                butce.record(con, role="king", task="sohbet", provider="ollama", model="gemma4:e2b",
                             seviye="yerel", neden="düşüş: google kotası dolu, 10:00'a kadar denenmez")
            finally:
                con.close()

            bugun = datetime.date.today().isoformat()
            st, r = s.call("/api/ai_olcum?date=" + bugun)
            eq(st, 200)
            sev = [x for x in r.get("seviyeler", []) if x.get("seviye") == "yerel"]
            ok(len(sev) == 1, "yerel seviye kaydi bulunamadi")
            eq(sev[0]["cagri"], 2)

            dususler = r.get("dususler", [])
            ok(len(dususler) == 1, "dususler tek satir olmali: %s" % len(dususler))
            ok(dususler[0]["neden"].startswith("düşüş"), "neden dusus ile baslamali: %s" % dususler[0]["neden"])
        test("GET /api/ai_olcum seviyeler ve dususler kirilimi", t_ai_olcum_defter_kayitlari)

        def t_king_cumle_yetki_ve_dogrulama():
            # 3. POST /api/king/cumle jetonsuz 401; {tur:"x", satirlar:["a"]} 200 ve ok:false; {tur:"hafta", satirlar:[]} 200 ve ok:false.
            st, _ = s.call("/api/king/cumle", {"tur": "brifing", "satirlar": ["test"]}, token=None)
            eq(st, 401)

            st, r1 = s.call("/api/king/cumle", {"tur": "x", "satirlar": ["a"]})
            eq(st, 200)
            no(r1.get("ok"))

            st, r2 = s.call("/api/king/cumle", {"tur": "hafta", "satirlar": []})
            eq(st, 200)
            no(r2.get("ok"))
        test("POST /api/king/cumle jetonsuz 401 ve gecersiz girdi denetimi", t_king_cumle_yetki_ve_dogrulama)

        def t_king_cumle_modelsiz_kurulum():
            # 4. POST /api/king/cumle {tur:"brifing", satirlar:["Uyku: 6,2 saat (ölçüldü)"]} modelsiz kurulumda (testte ağ kapalı) 200,
            #    ok:false ve sunucu çökmez (ardından GET /api/health 200).
            st, r = s.call("/api/king/cumle", {"tur": "brifing", "satirlar": ["Uyku: 6,2 saat (ölçüldü)"]})
            eq(st, 200)
            no(r.get("ok"))

            st_h, rh = s.call("/api/health", token=None)
            eq(st_h, 200)
            ok(rh.get("ok"))
        test("POST /api/king/cumle modelsiz kurulumda ok:false ve sunucu ayakta", t_king_cumle_modelsiz_kurulum)
    finally:
        s.close()
