# -*- coding: utf-8 -*-
"""Hayat Mottosu — kullanicinin kendi dusunce agi.

Bu paket uc seyi korur ve ucu de bu bolumun VAR OLMA SEBEBIDIR:

  1. Eski dusunce kaybolmaz.
  2. Kullanicinin sozu ile uretilen ayri durur.
  3. Agac kendi icine dolanmaz.
"""

from core import db, motto
from tests.harness import eq, no, ok, suite, test


def _con():
    return db.connect(":memory:")


def run():
    suite("hayat mottosu · agac")

    def t_ekle_ve_agac():
        con = _con()
        kok = motto.ekle(con, "Karakter")
        ok(kok["ok"])
        alt = motto.ekle(con, "Disiplin", parent_id=kok["id"],
                         body="Motivasyona bağlı olmayan davranış.")
        ok(alt["ok"])
        agac = motto.agac(con)
        eq(len(agac), 2)
        cocuk = [d for d in agac if d["parent_id"] == kok["id"]]
        eq(len(cocuk), 1)
        eq(cocuk[0]["title"], "Disiplin")
    test("dusunce eklenir ve agacta gorunur", t_ekle_ve_agac)

    def t_bos_baslik():
        con = _con()
        no(motto.ekle(con, "   ")["ok"])
        no(motto.ekle(con, "")["ok"])
    test("adsiz dal kabul edilmez", t_bos_baslik)

    def t_dongu_reddedilir():
        """Bir agacin kendi icine dolanmasi, gezilemeyen bir agactir."""
        con = _con()
        a = motto.ekle(con, "Hayat")["id"]
        b = motto.ekle(con, "Zaman", parent_id=a)["id"]
        c = motto.ekle(con, "Şimdi", parent_id=b)["id"]
        no(motto.tasi(con, a, a)["ok"])          # kendi altina
        no(motto.tasi(con, a, c)["ok"])          # kendi torununun altina
        ok(motto.tasi(con, c, a)["ok"])          # gecerli tasima
    test("agac kendi icine dolanmaz", t_dongu_reddedilir)

    def t_arsiv_alt_dalli():
        con = _con()
        a = motto.ekle(con, "Başarı")["id"]
        motto.ekle(con, "Risk", parent_id=a)
        r = motto.arsivle(con, a)
        no(r["ok"], "altinda dusunce olan dal dogrudan arsivlenmemeli")
        ok("1 düşünce" in r["note"] or "düşünce var" in r["note"])
    test("dolu dal once bosaltilir", t_arsiv_alt_dalli)

    # ---------------------------------------------------------- surumler

    suite("hayat mottosu · gecmis")

    def t_eski_dusunce_kaybolmaz():
        """«Basari benim icin X» ile «artik Y diyorum» arasindaki FARK,
        dusuncenin kendisi kadar degerlidir."""
        con = _con()
        n = motto.ekle(con, "Başarı", body="Başarı benim için X.")["id"]
        motto.duzenle(con, n, body="Artık başarıyı Y şeklinde değerlendiriyorum.")
        d = motto.dugum(con, n)
        eq(d["body"], "Artık başarıyı Y şeklinde değerlendiriyorum.")
        govdeler = [v["body"] for v in d["versions"]]
        ok("Başarı benim için X." in govdeler, "ilk hal gecmiste durmali")
        eq(len(d["versions"]), 2)
    test("eski dusunce gecmiste durur", t_eski_dusunce_kaybolmaz)

    def t_ilk_hal_de_surumdur():
        con = _con()
        n = motto.ekle(con, "Sabır", body="ilk")["id"]
        eq(len(motto.dugum(con, n)["versions"]), 1)
    test("ilk yazim da bir surumdur", t_ilk_hal_de_surumdur)

    def t_degismeyen_duzenleme_surum_uretmez():
        con = _con()
        n = motto.ekle(con, "Cesaret", body="aynı")["id"]
        r = motto.duzenle(con, n, body="aynı")
        no(r["changed"])
        eq(len(motto.dugum(con, n)["versions"]), 1)
    test("degismeyen duzenleme gecmisi sismez", t_degismeyen_duzenleme_surum_uretmez)

    def t_eski_hale_donus():
        con = _con()
        n = motto.ekle(con, "Zaman", body="ilk hal")["id"]
        motto.duzenle(con, n, body="ikinci hal")
        d = motto.dugum(con, n)
        ilk = [v for v in d["versions"] if v["body"] == "ilk hal"][0]
        ok(motto.onayla(con, ilk["id"])["ok"])
        eq(motto.dugum(con, n)["body"], "ilk hal")
        # Geri donus de bir surum birakir: gorunmeyen bir geri donus,
        # gecmisi eksik anlatir.
        eq(len(motto.dugum(con, n)["versions"]), 3)
    test("eski hale donmek de gecmise yazilir", t_eski_hale_donus)

    # ------------------------------------------------- kullanici / uretilen

    suite("hayat mottosu · kimin sozu")

    def t_uretilen_sessizce_yazmaz():
        """Bir dil modelinin cumlesi kullanicinin ilkesi gibi gorunurse,
        kisi bir sure sonra kendi dusuncesi ile kendisine SOYLENEN seyi
        ayirt edemez."""
        con = _con()
        n = motto.ekle(con, "Özgürlük", body="kendi cümlem")["id"]
        r = motto.oner(con, n, "modelin ürettiği cümle")
        ok(r["ok"])
        no(r["applied"], "oneri dogrudan uygulanmamali")
        eq(motto.dugum(con, n)["body"], "kendi cümlem")
    test("uretilen metin dusunceyi sessizce degistirmez", t_uretilen_sessizce_yazmaz)

    def t_oneri_gecmiste_isaretli():
        con = _con()
        n = motto.ekle(con, "Güven", body="benim")["id"]
        motto.oner(con, n, "üretilen")
        d = motto.dugum(con, n)
        uretilen = [v for v in d["versions"] if v["author"] == "uretilen"]
        eq(len(uretilen), 1)
        eq(uretilen[0]["body"], "üretilen")
        ok(d["pending"] is not None, "bekleyen oneri gorunmeli")
    test("uretilen surum isaretli durur", t_oneri_gecmiste_isaretli)

    def t_onay_sahiplenmedir():
        """Kabul etmek sahiplenmektir: onaylanan surumun yazari 'ben'."""
        con = _con()
        n = motto.ekle(con, "Risk", body="benim")["id"]
        v = motto.oner(con, n, "üretilen cümle")["version_id"]
        ok(motto.onayla(con, v)["ok"])
        d = motto.dugum(con, n)
        eq(d["body"], "üretilen cümle")
        eq(d["versions"][0]["author"], "ben")
        ok(d["pending"] is None, "onaylanmis oneri bekleyen sayilmaz")
    test("onaylanan oneri kullanicinin sozu olur", t_onay_sahiplenmedir)

    # ------------------------------------------------------------- baglar

    suite("hayat mottosu · ag")

    def t_bag_yonsuz():
        con = _con()
        a = motto.ekle(con, "Disiplin")["id"]
        b = motto.ekle(con, "Özgürlük")["id"]
        ok(motto.bagla(con, a, b)["ok"])
        # Ters yonden ayni cift ikinci bir bag URETMEZ.
        r = motto.bagla(con, b, a)
        ok(r["already"], "ayni cift iki kez kaydedilmemeli")
        eq(len(motto.baglari(con, a)), 1)
        eq(len(motto.baglari(con, b)), 1)
        eq(motto.baglari(con, a)[0]["title"], "Özgürlük")
    test("bag yonsuzdur ve tekrarlanmaz", t_bag_yonsuz)

    def t_kendine_baglanmaz():
        con = _con()
        a = motto.ekle(con, "Anlam")["id"]
        no(motto.bagla(con, a, a)["ok"])
    test("dusunce kendisine baglanmaz", t_kendine_baglanmaz)

    def t_harita_iki_tur_kenar():
        """Agac bagi ile akrabalik bagi AYRI turde doner: haritanin
        anlatmaya calistigi sey tam olarak bu ikisinin farkli olmasi."""
        con = _con()
        kok = motto.ekle(con, "Karakter")["id"]
        d = motto.ekle(con, "Disiplin", parent_id=kok)["id"]
        o = motto.ekle(con, "Özgürlük")["id"]
        motto.bagla(con, d, o)
        h = motto.harita(con)
        eq(len(h["nodes"]), 3)
        turler = sorted(set(k["tur"] for k in h["edges"]))
        eq(turler, ["bag", "dal"])
    test("harita dal ile bagi ayirir", t_harita_iki_tur_kenar)

    def t_arsivlenen_haritadan_duser():
        con = _con()
        a = motto.ekle(con, "Eski")["id"]
        b = motto.ekle(con, "Yeni")["id"]
        motto.bagla(con, a, b)
        motto.arsivle(con, a)
        h = motto.harita(con)
        eq(len(h["nodes"]), 1)
        eq(len(h["edges"]), 0)
        eq(len(motto.baglari(con, b)), 0)
    test("arsivlenen dusunce haritadan duser", t_arsivlenen_haritadan_duser)

    # ------------------------------------------------------ etiket ve arama

    suite("hayat mottosu · etiket ve arama")

    def t_etiket_sadelesir():
        """`#Disiplin` ile `#disiplin` iki ayri raf olsaydi kullanici
        aradigini bulamazdi."""
        con = _con()
        n = motto.ekle(con, "Çalışmak", tags="#Disiplin, #ÖNEMLİ")["id"]
        d = motto.dugum(con, n)
        ok("disiplin" in d["tags"])
        ok("önemli" in d["tags"])
    test("etiket buyuk harf ve # ayirmaz", t_etiket_sadelesir)

    def t_arama():
        con = _con()
        motto.ekle(con, "Disiplin", body="Motivasyona bağlı olmayan davranış.",
                   tags=["gelecek"])
        motto.ekle(con, "Dostluk", body="Güven esastır.")
        eq(len(motto.ara(con, "motivasyon")), 1)
        eq(len(motto.ara(con, "DİSİPLİN")), 1)       # buyuk harf ayirmaz
        eq(len(motto.ara(con, "yok-boyle-bir-sey")), 0)
        eq(len(motto.ara(con, "", tag="gelecek")), 1)
    test("arama baslik, govde ve etikette calisir", t_arama)

    def t_arsivlenen_aramada_cikmaz():
        con = _con()
        n = motto.ekle(con, "Unutulan", body="metin")["id"]
        eq(len(motto.ara(con, "Unutulan")), 1)
        motto.arsivle(con, n)
        eq(len(motto.ara(con, "Unutulan")), 0)
    test("arsivlenen dusunce aramada cikmaz", t_arsivlenen_aramada_cikmaz)

    # ------------------------------------------------------------- ilkeler

    suite("hayat mottosu · ilkeler")

    def t_ilke_ayri_gosterilir():
        con = _con()
        motto.ekle(con, "Sıradan düşünce")
        motto.ekle(con, "Kontrol", kind="ilke",
                   body="Kontrol edemediğin şeylerden çok kontrol "
                        "edebildiğine enerji harca.")
        motto.ekle(con, "Motto", kind="motto", body="Uzun vade kısa rahatlığı yener.")
        liste = motto.ilkeler(con)
        eq(len(liste), 2)
        ok(all(x["kind"] in ("motto", "ilke") for x in liste))
    test("motto ve ilke ayri listelenir", t_ilke_ayri_gosterilir)

    def t_bilinmeyen_tur():
        con = _con()
        no(motto.ekle(con, "X", kind="uydurma")["ok"])
    test("bilinmeyen tur reddedilir", t_bilinmeyen_tur)

    def t_ozet_yargi_tasimaz():
        """Bu bolum kullaniciyi OLCMEZ: «az yazmissin» diye bir olcu yok."""
        con = _con()
        motto.ekle(con, "Bir")
        o = motto.ozet(con)
        eq(o["dusunce"], 1)
        eq(o["ilke"], 0)
        eq(o["bag"], 0)
        eq(o["surum"], 1)
    test("ozet yalniz sayar", t_ozet_yargi_tasimaz)
