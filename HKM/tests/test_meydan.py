# -*- coding: utf-8 -*-
"""Meydan (core/meydan.py, web/meydan.html).

   Kanitladigi sozler:
     1. Her gonderi bir olaydan turer; olay yoksa gonderi yoktur ve bunu
        kodun cumlesi soyler. Eksik olcum «—  veri yok» cipidir, sifir
        yazilmaz; her sayi dort etiketten birini tasir; gizli alan
        (tahlil, beden olcusu) akisa girmez.
     2. Senden karar bekleyen oneri en ustte durur, hicbir duzeyde
        katlanmaz; karar Onaylar'in AYNI isleyicisidir ve reddedilen
        oneri silinmez. Sinir asan gonderi katlanir, silinmez.
     3. Sinavi KOD sinar: yanlis cevap soruyu desteye hemen vadeli koyar,
        ayni soru iki kez cevaplanmaz, dogru sayisi «hesaplandi»dir.
     4. Kart metni istemciden alinmaz; kaynagindan okunur. Tekrar
        araliklari koddadir (1 · 3 · 7 · 14 · 30) ve «Geri al» tek adimdir.
     5. Meydan hicbir module yazmaz: ham olay, niyet ve oneri tablolari
        Meydan'in yazmalariyla degismez. Model cagrilmaz.
     6. Kaydedilen gonderi, olayi akistan ciktiktan sonra da durur.
     7. Uclar: sayfa jetonsuz, veri bearer ister; bozuk girdi reddedilir.
     8. Sayfa sifir bagimlidir ve yuzun jetonunu okur."""
import datetime
import json
import os

from core import bam, db, hedefag, manager, meydan, sync_engine
from tests.harness import eq, no, ok, suite, test

G = "2026-09-25"
AN = G + "T12:00:00"


def _m(v, c="measured"):
    return {"value": v, "cert": c}


def _con():
    return db.connect(":memory:")


def _gun(con, modul="spi", **metrics):
    return sync_engine.ingest(con, {"module": modul, "date": G, "metrics": metrics},
                              now=G + "T08:00:00")


def _soru_seti(con, n=2):
    sorular = [{"soru": "Soru %d?" % (i + 1), "secenekler": ["a", "b", "c", "d", "e"],
                "dogru": "B", "cozum": "Çünkü b.", "zorluk": "orta"} for i in range(n)]
    return bam.kayit_ekle(con, "materyal", "Türev soru seti", {"tur": "soru", "maddeler": sorular},
                          now=G + "T10:00:00")


def _say(con, tablo):
    return con.execute("SELECT COUNT(*) FROM %s" % tablo).fetchone()[0]


def run():
    suite("meydan")

    def t_bos():
        con = _con()
        a = meydan.akis(con, G, now=AN)
        eq(a["gonderiler"], [])
        ok("olay yok" in a["son"], a["son"])
        eq(a["tekrar"]["vadeli"], 0)
    test("olay yoksa gonderi yok; bos gunu kodun cumlesi soyler", t_bos)

    def t_ozet():
        con = _con()
        _gun(con, sleep_hours=_m(5.2), recovery=_m(None, "missing"), hrv=_m(41, "computed"),
             weight=_m(80))
        a = meydan.akis(con, G, now=AN)
        oz = [g for g in a["gonderiler"] if g["tur"] == "ozet"][0]
        eq(oz["hesap"], "bio")
        eq(oz["sayilar"][0], ["5,2", "uyku (saat)", "ölçüldü"])
        ok(["—", "toparlanma skoru", "veri yok"] in oz["sayilar"], oz["sayilar"])
        no(any(s[0] == "0" for s in oz["sayilar"]), "eksik sifir yazildi")
        no(any("kilo" in s[1] or s[1] == "weight" for s in oz["sayilar"]), "gizli alan akista")
        for g in a["gonderiler"]:
            for s in g["sayilar"]:
                ok(s[2] in ("ölçüldü", "hesaplandı", "tahmin", "veri yok"), s)
        ok("sıfır sayılmadı" in oz["cumle"], oz["cumle"])
        ok(any(h["hesap"] == "bio" for h in a["hikayeler"]))
    test("ozet: her sayi etiketli, eksik «veri yok», gizli alan akista yok", t_ozet)

    def t_oneri():
        con = _con()
        cur = con.execute("INSERT INTO decisions(date, rank, key, proposal, created_at) "
                          "VALUES (?,?,?,?,?)", (G, 1, "bio_red", "Bugün yükü azalt.", G + "T07:00:00"))
        con.commit()
        did = cur.lastrowid
        _gun(con, sleep_hours=_m(7))
        for duzey in ("sade", "dengeli", "tam"):
            a = meydan.akis(con, G, duzey=duzey, now=AN)
            ilk = a["gonderiler"][0]
            eq((ilk["id"], ilk["tur"], ilk["bekliyor"]), ("oneri-%d" % did, "teklif", True), duzey)
            no(ilk.get("katli"), duzey)
            eq(a["bekleyen"], 1)
        eq(manager.respond(con, did, "declined")["status"], 200)
        g = [x for x in meydan.akis(con, G, now=AN)["gonderiler"] if x["id"] == "oneri-%d" % did][0]
        eq((g["tur"], g["bekliyor"]), ("karar", False))
        ok("silinmedi" in g["cumle"], g["cumle"])
        eq(_say(con, "decisions"), 1)
    test("bekleyen oneri en ustte, hicbir duzeyde katlanmaz; reddedilen silinmez", t_oneri)

    def t_katlama():
        con = _con()
        for i in range(4):
            bam.kayit_ekle(con, "arastirma", "Rapor %d" % i, {"ozet": "x"}, now=G + "T1%d:00:00" % i)
        a = meydan.akis(con, G, duzey="dengeli", now=AN)
        katli = [g for g in a["gonderiler"] if g.get("katli")]
        eq(len(katli), 1)
        eq(len(a["gonderiler"]), 4)
        ok("silinmedi" in a["katlanan"][0]["cumle"])
        eq(len([g for g in meydan.akis(con, G, duzey="tam", now=AN)["gonderiler"] if g.get("katli")]), 0)
        eq(len([g for g in meydan.akis(con, G, duzey="sade", now=AN)["gonderiler"]]), 0)
    test("sinir asan gonderi katlanir, silinmez; sade urunleri gostermez", t_katlama)

    def t_kapsam():
        con = _con()
        _gun(con, "spi", sleep_hours=_m(7))
        _gun(con, "ays", questions=_m(40))
        _soru_seti(con)
        def ids(k):
            return {g["id"] for g in meydan.akis(con, G, kapsam=k, now=AN)["gonderiler"]}
        ok(all("spi" in g or "bio" in g for g in ids("spi")), ids("spi"))
        eq({i.split("-")[0] for i in ids("merkez")}, {"bam"})
        eq(ids("bilinmeyen"), ids("hepsi"))
    test("kapsam: modul yalniz kendini ilgilendireni, Merkez King ve BAM'i gosterir", t_kapsam)

    def t_sinav():
        con = _con()
        k = _soru_seti(con, 2)
        gid = "bam-%d" % k["id"]
        g = [x for x in meydan.akis(con, G, now=AN)["gonderiler"] if x["id"] == gid][0]
        eq((g["tur"], g["sinav"]["no"], g["sinav"]["toplam"]), ("sinav", 0, 2))
        # Cevap anahtari akisa girmez: yalniz bu alanlar gider, secenekler isaretsiz.
        eq(set(g["sinav"]) - {"toplam", "cozulen", "dogru_sayi", "no", "soru", "secenekler",
                              "seviye", "bitti"}, set())
        no("B" in json.dumps(g["sinav"]["secenekler"]), "secenek harfi isaretli")
        r = meydan.cevapla(con, gid, 0, 0, now=AN)
        eq((r["ok"], r["dogru_mu"], r["dogru"]), (True, False, 1))
        ok(r["kart"])
        eq(meydan.deste_ozet(con, now=AN)["vadeli"], 1)
        eq(meydan.cevapla(con, gid, 0, 1, now=AN)["status"], 409)
        eq(meydan.cevapla(con, gid, 1, 9, now=AN)["status"], 400)
        eq(meydan.cevapla(con, "oneri-1", 0, 0, now=AN)["status"], 404)
        r = meydan.cevapla(con, gid, 1, 1, now=AN)
        eq((r["dogru_mu"], meydan.deste_ozet(con, now=AN)["toplam"]), (True, 1))
        g = [x for x in meydan.akis(con, G, now=AN)["gonderiler"] if x["id"] == gid][0]
        ok(g["sinav"].get("bitti"))
        eq(g["sayilar"], [["1", "doğru", "hesaplandı"]])
    test("sinavi kod sinar; yanlis desteye vadeli girer, ikinci cevap yok", t_sinav)

    def t_deste_kaynaktan():
        con = _con()
        k = bam.kayit_ekle(con, "materyal", "A2 ünite", {"tur": "unite", "dil": "en", "duzey": "A2",
                           "konu": "x", "uniteler": [{"ogeler": [{"on": "Good morning", "arka": "Günaydın"},
                                                                {"on": "See you", "arka": "Görüşürüz"}]}]},
                           now=G + "T09:00:00")
        la = bam.kayit_ekle(con, "materyal", "Latince", {"tur": "unite", "dil": "la", "duzey": "A1",
                            "konu": "x", "uniteler": [{"ogeler": [{"on": "salve", "arka": "merhaba"}]}]},
                            now=G + "T09:01:00")
        a = meydan.akis(con, G, duzey="tam", now=AN)
        g = [x for x in a["gonderiler"] if x["id"] == "bam-%d" % k["id"]][0]
        eq((g["tur"], g["ses"], g["seviye"]["metin"]), ("kart", "en-US", "A2"))
        eq([x for x in a["gonderiler"] if x["id"] == "bam-%d" % la["id"]][0]["ses"], None)
        r = meydan.desteye_ekle(con, "bam-%d" % k["id"], now=AN)
        eq((r["ok"], r["adet"]), (True, 2))
        eq(meydan.desteye_ekle(con, "bam-%d" % k["id"], now=AN)["adet"], 2)
        eq(meydan.deste_ozet(con, now=AN)["toplam"], 2)
        onler = sorted(x["on_yuz"] for x in meydan.deste(con, now=AN)["vadeli"])
        eq(onler, ["Good morning", "See you"])
        hedefag.dilkart_yaz(con, "esp", {"gun": G, "kartlar": [{"on": "resilient", "arka": "dayanıklı"}]})
        eq(meydan.desteye_ekle(con, "dil-" + G, now=AN)["adet"], 1)
        eq(meydan.desteye_ekle(con, "dil-2026-01-01", now=AN)["status"], 404)
        eq(meydan.desteye_ekle(con, "<script>", now=AN)["status"], 400)
    test("kart metni kaynagindan okunur; ayni kart iki kez girmez; ses yalniz bilinen dilde", t_deste_kaynaktan)

    def t_aralik():
        con = _con()
        an = datetime.datetime(2026, 9, 25, 12, 0, 0)
        kid = meydan.kart_yap(con, "1453", "İstanbul'un fethi", now=an)["id"]
        eq(meydan.kart_yap(con, "a", "a", now=an)["status"], 400)
        eq(meydan.kart_yap(con, "", "b", now=an)["status"], 400)
        r = meydan.puanla(con, kid, "iyi", now=an)
        eq(r["vade"], "2026-09-28T12:00:00")
        eq(meydan.geri_al(con, kid, now=an)["ok"], True)
        eq(meydan.geri_al(con, kid, now=an)["status"], 409)
        eq(meydan.puanla(con, kid, "kolay", now=an)["vade"], "2026-10-02T12:00:00")
        eq(meydan.puanla(con, kid, "tekrar", now=an)["vade"], "2026-09-25T12:10:00")
        eq(meydan.puanla(con, kid, "zor", now=an)["vade"], "2026-09-26T12:00:00")
        eq(meydan.puanla(con, kid, "harika", now=an)["status"], 400)
        for _ in range(8):
            meydan.puanla(con, kid, "kolay", now=an)
        eq(meydan.puanla(con, kid, "kolay", now=an)["vade"], "2026-10-25T12:00:00")
        kart = meydan.deste(con, now=datetime.datetime(2027, 1, 1))["vadeli"][0]
        eq([x["ad"] for x in kart["secenekler"]], ["Tekrar", "Zor", "İyi", "Kolay"])
        eq(meydan.karti_cikar(con, kid, now=an)["ok"], True)
        eq(_say(con, "meydan_deste"), 1)
        eq(meydan.deste_ozet(con, now=an)["toplam"], 0)
    test("araliklar kodda (1·3·7·14·30), «Geri al» tek adim, cikan kart silinmez", t_aralik)

    def t_module_yazmaz():
        con = _con()
        _gun(con, sleep_hours=_m(6))
        k = _soru_seti(con)
        once = {t: _say(con, t) for t in ("raw_events", "audits", "intents", "decisions",
                                            "is_emirleri", "bam_kayitlar", "hedef_ozet", "dil_karti")}
        meydan.cevapla(con, "bam-%d" % k["id"], 0, 0, now=AN)
        meydan.desteye_ekle(con, "bam-%d" % k["id"], now=AN)
        meydan.not_yaz(con, "Uyudum 8 saat.", "spi", now=AN)
        meydan.isaretle(con, G, "bam-%d" % k["id"], "faydali", True, now=AN)
        meydan.isaretle(con, G, "bam-%d" % k["id"], "kaydet", True, now=AN)
        for kart in meydan.deste(con, now=AN)["vadeli"]:
            meydan.puanla(con, kart["id"], "iyi", now=AN)
        sonra = {t: _say(con, t) for t in once}
        eq(sonra, once)
        for ad in ("ai", "models", "sohbet", "intents"):
            no(hasattr(meydan, ad), "meydan %s yukluyor" % ad)
    test("Meydan hicbir module yazmaz; not olcum olmaz; model cagrilmaz", t_module_yazmaz)

    def t_isaret_kaydet():
        con = _con()
        k = _soru_seti(con)
        gid = "bam-%d" % k["id"]
        eq(meydan.isaretle(con, G, gid, "begeni", True)["status"], 400)
        eq(meydan.isaretle(con, G, "yok-1", "kaydet", True)["status"], 404)
        once = [g["onem"] for g in meydan.akis(con, G, now=AN)["gonderiler"] if g["id"] == gid][0]
        meydan.isaretle(con, G, gid, "faydali", True, now=AN)
        sonra = [g for g in meydan.akis(con, G, now=AN)["gonderiler"] if g["id"] == gid][0]
        eq((sonra["onem"] - once, sonra["faydali"]), (10, True))
        meydan.isaretle(con, G, gid, "kaydet", True, now=AN)
        ertesi = (datetime.date.fromisoformat(G) + datetime.timedelta(days=meydan.URUN_GUN)).isoformat()
        no(any(g["id"] == gid for g in meydan.akis(con, ertesi, now=AN)["gonderiler"]))
        eq([g["id"] for g in meydan.kaydedilenler(con)["gonderiler"]], [gid])
        meydan.isaretle(con, G, gid, "kaydet", False)
        eq(meydan.kaydedilenler(con)["gonderiler"], [])
    test("Faydali yalniz sirayi +10 degistirir; kaydedilen olay gidince de durur", t_isaret_kaydet)

    def t_not():
        con = _con()
        eq(meydan.not_yaz(con, "  ", now=AN)["status"], 400)
        eq(meydan.not_yaz(con, "x" * 281, now=AN)["status"], 400)
        r = meydan.not_yaz(con, "Paragrafta acele ettim.", "ays", now=AN)
        g = [x for x in meydan.akis(con, G, now=AN)["gonderiler"] if x["hesap"] == "sen"][0]
        eq((g["tur"], g["ilgili"], g["cumle"]), ("not", ["ays"], "Paragrafta acele ettim."))
        eq(meydan.not_sil(con, r["id"])["ok"], True)
        eq([x for x in meydan.akis(con, G, now=AN)["gonderiler"] if x["hesap"] == "sen"], [])
        eq(_say(con, "meydan_not"), 1)
    test("not: bos ve uzun reddedilir; kaldirilan not silinmez", t_not)

    def t_yedek():
        con = _con()
        meydan.kart_yap(con, "a", "b", now=AN)
        y = db.export_all(con)
        for t in ("meydan_deste", "meydan_isaret", "meydan_not"):
            ok(t in y["__meta"]["tables"], t)
        eq(y["__meta"]["tables"]["meydan_deste"], 1)
    test("Meydan'in izi yedege girer", t_yedek)

    def t_sayfa():
        kok = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        s = open(os.path.join(kok, "web", "meydan.html"), encoding="utf-8").read()
        yuz = open(os.path.join(kok, "web", "index.html"), encoding="utf-8").read()
        no("http://" in s or "https://" in s, "sayfa dis kaynak yukluyor")
        ok("'hkm.token'" in s and "'hkm.token'" in yuz, "jeton anahtari yuzle ayni degil")
        ok("'hkm.tema'" in s and "'hkm.tema'" in yuz, "tema anahtari yuzle ayni degil")
        # HKM'nin icinde ama SEKME DEGIL (kullanici karari 2026-09-25): ortada
        # acilan mini uygulama. Yuzun yonlendiricisine ve cekmecelerine girmez;
        # tek, kendi icinde kapali blok olarak durur.
        ok('id="meydan-ac"' in yuz and 'id="meydan-pencere"' in yuz, "yuzde Meydan penceresi yok")
        ok("'/meydan?uygulama=1'" in yuz, "pencere Meydan'i yuklemiyor")
        no('data-yol="meydan"' in yuz, "Meydan yine sekme/bolum olmus")
        gor = yuz[yuz.index("var GORUNUMLER"):yuz.index("];", yuz.index("var GORUNUMLER"))]
        no("meydan" in gor, "Meydan yuzun gorunumlerine girmis")
        blok = yuz[yuz.index("<!-- MEYDAN (kullan"):]
        ok(blok.count("<script>") == 1 and "e.origin !== location.origin" in blok,
           "panel iletisi kaynak denetimsiz")
        ok("e.origin !== location.origin" in s and "e.source !== window.parent" in s,
           "sayfa iletisi kaynak denetimsiz")
        for yasak in (">Evet<", ">Tamam<", "Evet,"):
            no(yasak in s, "onay dugmesi etiketsiz: %s" % yasak)
    test("sayfa sifir bagimli, yuzun jetonu ve temasi; yuzde mini uygulama, sekme degil; «Evet/Tamam» yok", t_sayfa)


def run_daemon():
    """Uclar gercek bir soketle (tests/test_daemon.py kalibi)."""
    from tests.test_daemon import _Server
    suite("meydan · uclar")

    def t_uclar():
        s = _Server()
        try:
            st, body = s.ham("/meydan", None, {}, method="GET")
            eq(st, 200)
            ok("Meydan" in body)
            eq(s.call("/api/meydan", token=None)[0], 401)
            eq(s.call("/api/meydan?date=25-09-2026")[0], 400)
            st, a = s.call("/api/meydan?date=%s&kapsam=spi&duzey=sade" % G)
            eq((st, a["kapsam"], a["duzey"], a["gonderiler"]), (200, "spi", "sade", []))
            eq(s.call("/api/meydan/deste")[0], 200)
            eq(s.call("/api/meydan/kaydedilenler")[0], 200)
            eq(s.call("/api/meydan/yok")[0], 404)
            eq(s.call("/api/meydan/not", {"metin": "Merhaba"}, token=None)[0], 401)
            st, r = s.call("/api/meydan/not", {"metin": "Merhaba meydan"})
            eq((st, r["ok"]), (200, True))
            eq(s.call("/api/meydan/not", {"metin": ""})[0], 400)
            st, r = s.call("/api/meydan/deste", {"on": "1453", "arka": "Fetih"})
            eq(st, 200)
            kid = r["id"]
            eq(s.call("/api/meydan/deste/%d/puan" % kid, {"derece": "iyi"})[0], 200)
            eq(s.call("/api/meydan/deste/%d/geri" % kid, {})[0], 200)
            eq(s.call("/api/meydan/deste/abc/puan", {"derece": "iyi"})[0], 400)
            eq(s.call("/api/meydan/deste/%d/uc" % kid, {})[0], 404)
            eq(s.call("/api/meydan/cevap", {"gonderi": "bam-99", "no": 0, "secim": 0})[0], 404)
            eq(s.call("/api/meydan/isaret", {"gonderi": "x", "tur": "kaydet", "acik": True,
                                             "gun": "dun"})[0], 400)
            st, a = s.call("/api/meydan")
            ok(any(g["hesap"] == "sen" for g in a["gonderiler"]), "not akista yok")
        finally:
            s.srv.shutdown()
            s.srv.server_close()
    test("sayfa jetonsuz; veri bearer ister; bozuk girdi reddedilir", t_uclar)
