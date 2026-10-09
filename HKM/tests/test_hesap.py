# -*- coding: utf-8 -*-
"""Hesap ve esitleme (sistem/hesap.py) — PC sunucusu.

Korunan sozler: admin yalniz PC'den ve bir kez kurulur; parola duz
tutulmaz, yanlis denemede bekletilir; kayit duzeyinde son yazan kazanir;
ilk esitleme sunucudakini ezmez; silme oteki cihaza gider; kullanicilar
ve alanlar birbirini gormez; HTTP katmani jetonsuz veri vermez ve yalniz
uygulamanin kokenlerine capraz izin verir. Olcum GERCEK SQLite ve gercek
HTTP sunucusuyla, gecici klasorde.
"""

import json
import os
import shutil
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request

KOK = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if os.path.join(KOK, "sistem") not in sys.path:
    sys.path.append(os.path.join(KOK, "sistem"))
sys.dont_write_bytecode = True

import hesap  # noqa: E402
from tests.harness import eq, no, ok, suite, test  # noqa: E402

A, B = "cihazA-123456", "cihazB-654321"


class _Saat:
    def __init__(self):
        self.t = 1_800_000_000.0

    def __call__(self):
        return self.t


class _Depo:
    """Gecici klasorde hizli (az turlu) bir depo."""

    def __enter__(self):
        self.klasor = tempfile.mkdtemp(prefix="lifeos-hesap-")
        self.saat = _Saat()
        self.d = hesap.Depo(os.path.join(self.klasor, "hesap.db"), tur=1000, saat=self.saat)
        return self

    def __exit__(self, *a):
        shutil.rmtree(self.klasor, ignore_errors=True)


def _hata(fn, kod):
    try:
        fn()
    except hesap.Hata as e:
        eq(e.kod, kod, "hata kodu")
        return e
    raise AssertionError("hesap.Hata(%d) bekleniyordu" % kod)


def _admin(r, ad="omer", parola="parola-123"):
    s = r.d.kur(ad, parola, True, A, "PC")
    return s["kullanici"], s["jeton"]


def run():
    suite("hesap ve esitleme (PC sunucusu)")

    def t_kurulum():
        with _Depo() as r:
            ok(r.d.kurulum_gerekli())
            _hata(lambda: r.d.kur("omer", "parola-123", False), 403)   # ev agindan admin olunmaz
            ok(r.d.kurulum_gerekli())
            k, j = _admin(r)
            eq(k["rol"], "admin")
            eq(r.d.oturum(j)["ad"], "omer")
            no(r.d.kurulum_gerekli())
            _hata(lambda: r.d.kur("baska", "parola-123", True), 409)   # ikinci kez kurulmaz
    test("admin yalniz PC'den ve bir kez kurulur", t_kurulum)

    def t_dogrulama():
        with _Depo() as r:
            _hata(lambda: r.d.kur("a", "parola-123", True), 400)
            _hata(lambda: r.d.kur("omer x", "parola-123", True), 400)
            _hata(lambda: r.d.kur("omer", "kisa", True), 400)
            ok(r.d.kur("Ömer.Sağ", "parola-123", True)["jeton"])          # Turkce harf olur
    test("ad ve parola dogrulanir (Turkce harf kabul)", t_dogrulama)

    def t_parola_duz_degil():
        with _Depo() as r:
            _admin(r, parola="cok-gizli-parola")
            ham = open(r.d.yol, "rb").read()
            no(b"cok-gizli-parola" in ham)
    test("parola veritabanina duz yazilmaz", t_parola_duz_degil)

    def t_giris():
        with _Depo() as r:
            _admin(r)
            _hata(lambda: r.d.giris("omer", "yanlis-parola", B, "tel", "1.2.3.4"), 401)
            _hata(lambda: r.d.giris("yok", "parola-123", B, "tel", "1.2.3.4"), 401)
            s = r.d.giris("OMER", "parola-123", B, "tel", "1.2.3.4")   # ad buyuk/kucuk harf duyarsiz
            eq(r.d.oturum(s["jeton"])["ad"], "omer")
            r.d.cikis(s["jeton"])
            eq(r.d.oturum(s["jeton"]), None)
            eq(r.d.oturum("uydurma"), None)
    test("giris, oturum ve cikis", t_giris)

    def t_bekletme():
        with _Depo() as r:
            _admin(r)
            for _ in range(hesap.DENEME_ESIK):
                _hata(lambda: r.d.giris("omer", "yanlis-parola", B, "", "9.9.9.9"), 401)
            e = _hata(lambda: r.d.giris("omer", "parola-123", B, "", "9.9.9.9"), 429)
            ok("saniye" in e.mesaj)
            r.saat.t += 31
            ok(r.d.giris("omer", "parola-123", B, "", "9.9.9.9")["jeton"])
    test("art arda yanlis giriste bekletilir, sure dolunca acilir", t_bekletme)

    def t_oturum_suresi():
        with _Depo() as r:
            _, j = _admin(r)
            r.saat.t += (hesap.OTURUM_GUN + 1) * 86400
            eq(r.d.oturum(j), None)
    test("uzun sure kullanilmayan oturum kapanir", t_oturum_suresi)

    def t_kullanicilar():
        with _Depo() as r:
            k, _ = _admin(r)
            u = r.d.kullanici_ekle(k, "anne", "parola-456")
            eq(u["rol"], "uye")
            _hata(lambda: r.d.kullanici_ekle(k, "anne", "parola-456"), 409)
            _hata(lambda: r.d.kullanici_ekle(u, "cocuk", "parola-789"), 403)    # uye ekleyemez
            _hata(lambda: r.d.kullanicilar(u), 403)
            eq([x["ad"] for x in r.d.kullanicilar(k)], ["omer", "anne"])
    test("kullaniciyi yalniz admin ekler ve listeler", t_kullanicilar)

    def t_parola_degistir():
        with _Depo() as r:
            k, j1 = _admin(r)
            j2 = r.d.giris("omer", "parola-123", B)["jeton"]
            _hata(lambda: r.d.parola_degistir(k, j1, "yanlis", "yeni-parola-1"), 401)
            r.d.parola_degistir(k, j1, "parola-123", "yeni-parola-1")
            ok(r.d.oturum(j1))                       # bu cihaz acik kalir
            eq(r.d.oturum(j2), None)                 # oteki cihaz kapanir
            _hata(lambda: r.d.giris("omer", "parola-123", B), 401)
            ok(r.d.giris("omer", "yeni-parola-1", B)["jeton"])
    test("parola degisince oteki cihazlarin oturumu kapanir", t_parola_degistir)

    def t_esitle_temel():
        with _Depo() as r:
            k, _ = _admin(r)
            s = r.d.esitle(k, "spi/ben", A, 0, [{"y": "vitals/2026-10-04", "d": {"sleep": 7}, "z": 100},
                                               {"y": "profile", "d": {"name": "Ö"}, "z": 100}])
            eq(s["kabul"], 2)
            eq(s["al"], [])                           # kendi yazdigi geri gelmez
            ok(s["son"] >= 2)
            b = r.d.esitle(k, "spi/ben", B, 0, [])
            eq(sorted(x["y"] for x in b["al"]), ["profile", "vitals/2026-10-04"])
            eq([x for x in b["al"] if x["y"] == "vitals/2026-10-04"][0]["d"], {"sleep": 7})
            eq(r.d.esitle(k, "spi/ben", B, b["son"], [])["al"], [])    # imlec ilerledi
    test("bir cihazin yazdigi oteki cihaza iner, imlec ilerler", t_esitle_temel)

    def t_son_yazan():
        with _Depo() as r:
            k, _ = _admin(r)
            r.d.esitle(k, "spi/ben", A, 0, [{"y": "v", "d": {"x": 1}, "z": 200}])
            eski = r.d.esitle(k, "spi/ben", B, 0, [{"y": "v", "d": {"x": 0}, "z": 150}])
            eq(eski["red"], 1)
            eq([x["d"] for x in eski["al"]], [{"x": 1}])  # sunucudaki yeni surum cihaza iner
            yeni = r.d.esitle(k, "spi/ben", B, eski["son"], [{"y": "v", "d": {"x": 2}, "z": 300}])
            eq(yeni["kabul"], 1)
            a = r.d.esitle(k, "spi/ben", A, 0, [])
            eq([x["d"] for x in a["al"]], [{"x": 2}])
            # Esit zamanda cihaz kimligi karar verir (her yerde ayni sonuc).
            r.d.esitle(k, "spi/ben", A, 0, [{"y": "t", "d": "A", "z": 500}])
            eq(r.d.esitle(k, "spi/ben", B, 0, [{"y": "t", "d": "B", "z": 500}])["kabul"], 1)  # B > A
            eq(r.d.esitle(k, "spi/ben", A, 0, [{"y": "t", "d": "A", "z": 500}])["kabul"], 0)
    test("kayit duzeyinde son yazan kazanir; esitlikte cihaz", t_son_yazan)

    def t_ilk():
        with _Depo() as r:
            k, _ = _admin(r)
            r.d.esitle(k, "spi/ben", A, 0, [{"y": "profile", "d": {"name": "gercek"}, "z": 100}])
            s = r.d.esitle(k, "spi/ben", B, 0, [
                {"y": "profile", "d": {"name": "deneme"}, "z": 99999, "ilk": True},
                {"y": "workouts/w1", "d": {"km": 5}, "z": 1, "ilk": True},
                {"y": "silik", "d": None, "z": 1, "ilk": True}])
            eq(s["red"], 1)
            eq(s["kabul"], 1)
            eq([x["d"] for x in s["al"] if x["y"] == "profile"], [{"name": "gercek"}])
            a = r.d.esitle(k, "spi/ben", A, 0, [])
            eq(sorted(x["y"] for x in a["al"]), ["workouts/w1"])     # silik yazilmadi
    test("ilk esitleme sunucudakini ezmez, olmayani ekler", t_ilk)

    def t_silme():
        with _Depo() as r:
            k, _ = _admin(r)
            r.d.esitle(k, "spi/ben", A, 0, [{"y": "meals/m1", "d": {"k": 1}, "z": 100}])
            b0 = r.d.esitle(k, "spi/ben", B, 0, [])
            r.d.esitle(k, "spi/ben", A, 0, [{"y": "meals/m1", "d": None, "z": 200}])
            b = r.d.esitle(k, "spi/ben", B, b0["son"], [])
            eq(b["al"], [{"y": "meals/m1", "d": None, "z": 200, "s": b["al"][0]["s"]}])
            eq(r.d.ozet(k), {})                        # silinen sayilmaz
    test("silme oteki cihaza da gider (mezar tasi)", t_silme)

    def t_sayfa():
        with _Depo() as r:
            k, _ = _admin(r)
            r.d.esitle(k, "esp/ben", A, 0, [{"y": "k/%02d" % i, "d": i, "z": 10} for i in range(25)])
            son, gelen, tur = 0, [], 0
            while True:
                s = r.d.esitle(k, "esp/ben", B, son, [], sinir=10)
                gelen += s["al"]
                son = s["son"]
                tur += 1
                if not s["daha"]:
                    break
            eq(len(gelen), 25)
            eq(tur, 3)
    test("buyuk alan sayfa sayfa iner", t_sayfa)

    def t_yalitim():
        with _Depo() as r:
            k, _ = _admin(r)
            u = r.d.kullanici_ekle(k, "anne", "parola-456")
            r.d.esitle(k, "spi/ben", A, 0, [{"y": "v", "d": 1, "z": 1}])
            eq(r.d.esitle(u, "spi/ben", B, 0, [])["al"], [])           # baska kullanici
            eq(r.d.esitle(k, "spi/anne", B, 0, [])["al"], [])          # baska profil
            eq(r.d.esitle(k, "ays/main", B, 0, [])["al"], [])          # baska modul
    test("kullanicilar, profiller ve moduller birbirini gormez", t_yalitim)

    def t_gecersiz():
        with _Depo() as r:
            k, _ = _admin(r)
            _hata(lambda: r.d.esitle(k, "hkm/ben", A, 0, []), 400)
            _hata(lambda: r.d.esitle(k, "spi/ben", "kisa", 0, []), 400)
            _hata(lambda: r.d.esitle(k, "spi/ben", A, -1, []), 400)
            _hata(lambda: r.d.esitle(k, "spi/ben", A, 0, [{"y": "", "d": 1, "z": 1}]), 400)
            _hata(lambda: r.d.esitle(k, "spi/ben", A, 0, [{"y": "a", "d": 1, "z": "dun"}]), 400)
            _hata(lambda: r.d.esitle(k, "spi/ben", A, 0,
                                     [{"y": "a", "d": "x" * (hesap.KAYIT_EN_BUYUK + 1), "z": 1}]), 413)
    test("gecersiz alan, cihaz, imlec ve kayit reddedilir", t_gecersiz)

    # ----------------------------------------------- kayit ve kurtarma

    def t_kayit():
        with _Depo() as r:
            _hata(lambda: r.d.kayit("omer", "parola-123", "İlk okulum?", "atatürk", False), 403)
            s = r.d.kayit("omer", "parola-123", "İlk okulum?", "atatürk", True, A)
            eq(s["kullanici"]["rol"], "admin")                       # ilk hesap admin
            ok(r.d.oturum(s["jeton"]))
            u = r.d.kayit("anne", "parola-456", "Doğduğum şehir?", "Rize", False, B)
            eq(u["kullanici"]["rol"], "uye")                         # sonrakiler uye, ev agindan da
            _hata(lambda: r.d.kayit("ANNE", "parola-456", "Soru nedir?", "x1", False), 409)
            _hata(lambda: r.d.kayit("cocuk", "parola-456", "", "cevap", False), 400)
            _hata(lambda: r.d.kayit("cocuk", "parola-456", "Uzun soru?", " ", False), 400)
            eq(r.d.soru("anne"), "Doğduğum şehir?")
            _hata(lambda: r.d.soru("yok"), 404)
            ham = open(r.d.yol, "rb").read()
            no("atatürk".encode("utf-8") in ham or b"Rize" in ham)   # cevap duz yazilmaz
    test("kayit: ilk hesap PC'den admin, sonrakiler uye; cevap duz yazilmaz", t_kayit)

    def t_kurtar():
        with _Depo() as r:
            s = r.d.kayit("omer", "parola-123", "İlk öğretmenim?", "  Işık   Hanım ", True, A)
            j2 = r.d.giris("omer", "parola-123", B)["jeton"]
            _hata(lambda: r.d.kurtar("omer", "yanlis", "yeni-sifre-1", B, ip="5.5.5.5"), 401)
            _hata(lambda: r.d.kurtar("omer", "ışık hanım", "kisa", B, ip="5.5.5.5"), 400)
            k = r.d.kurtar("omer", "IŞIK hanım", "yeni-sifre-1", B, ip="5.5.5.5")   # harf/bosluk fark etmez
            eq(k["kullanici"]["ad"], "omer")
            ok(r.d.oturum(k["jeton"]))
            eq(r.d.oturum(s["jeton"]), None)                       # eski oturumlar kapandi
            eq(r.d.oturum(j2), None)
            _hata(lambda: r.d.giris("omer", "parola-123", B), 401)
            ok(r.d.giris("omer", "yeni-sifre-1", B)["jeton"])
    test("kurtarma: dogru cevap yeni sifre koydurur, eski oturumlar kapanir", t_kurtar)

    def t_kurtar_bekletme():
        with _Depo() as r:
            r.d.kayit("omer", "parola-123", "Soru nedir?", "cevap", True)
            for _ in range(hesap.DENEME_ESIK):
                _hata(lambda: r.d.kurtar("omer", "yanlis", "yeni-sifre-1", ip="7.7.7.7"), 401)
            _hata(lambda: r.d.kurtar("omer", "cevap", "yeni-sifre-1", ip="7.7.7.7"), 429)
            _hata(lambda: r.d.kurtar("yok", "cevap", "yeni-sifre-1", ip="8.8.8.8"), 401)
    test("kurtarma: yanlis cevapta bekletilir; olmayan kullanici da 401", t_kurtar_bekletme)

    def t_soru_ayarla():
        with _Depo() as r:
            k, _ = _admin(r)                                     # eski yol (kur): sorusuz admin
            no(r.d.soru_var(k))
            _hata(lambda: r.d.soru("omer"), 404)
            _hata(lambda: r.d.soru_ayarla(k, "yanlis", "Yeni soru?", "yeni cevap"), 401)
            r.d.soru_ayarla(k, "parola-123", "Yeni soru?", "yeni cevap")
            ok(r.d.soru_var(k))
            ok(r.d.kurtar("omer", "Yeni Cevap", "yeni-sifre-1")["jeton"])
    test("kurtarma sorusu sonradan sifreyle ayarlanir", t_soru_ayarla)

    def t_gocur():
        with _Depo() as r:
            import sqlite3
            yol = os.path.join(r.klasor, "eski.db")
            c = sqlite3.connect(yol)
            c.executescript("CREATE TABLE kullanici(id INTEGER PRIMARY KEY, ad TEXT NOT NULL UNIQUE COLLATE NOCASE, "
                            "rol TEXT NOT NULL, tuz BLOB NOT NULL, ozet BLOB NOT NULL, tur INTEGER NOT NULL, "
                            "olusturma TEXT NOT NULL);")
            c.commit(); c.close()
            d = hesap.Depo(yol, tur=1000)
            ok(d.kayit("omer", "parola-123", "Soru nedir?", "cevap", True)["jeton"])
    test("surum 1 deposu kurtarma sutunlarina gocer", t_gocur)

    # ------------------------------------------- profil, plan, cihazlar

    def t_profil():
        with _Depo() as r:
            k, _ = _admin(r)
            eq((k["gorunen_ad"], k["renk"], k["plan"]), ("omer", "mavi", "ucretsiz"))   # varsayilanlar
            p = r.d.profil_ayarla(k, "  Ömer   Faruk ", "turkuaz")
            eq((p["gorunen_ad"], p["renk"]), ("Ömer Faruk", "turkuaz"))
            eq(r.d.giris("omer", "parola-123", B)["kullanici"]["gorunen_ad"], "Ömer Faruk")  # giriste gelir
            eq(r.d.profil_ayarla(k, None, "mor")["gorunen_ad"], "Ömer Faruk")            # None: degismez
            eq(r.d.profil_ayarla(k, "", None)["gorunen_ad"], "omer")                    # bos: ada doner
            _hata(lambda: r.d.profil_ayarla(k, None, "#ff0000"), 400)                  # kapali liste
            _hata(lambda: r.d.profil_ayarla(k, "x" * (hesap.GORUNEN_AD_EN_UZUN + 1)), 400)
            _hata(lambda: r.d.profil_ayarla(k, "a\u0007b"), 400)
    test("profil: gorunen ad ve renk kullanicinin kendi ayari, renk kapali listeden", t_profil)

    def t_plan_yalniz_gorunurluk():
        ids = [p["id"] for p in hesap.PLANLAR]
        eq(ids[0], hesap.VARSAYILAN_PLAN)
        eq(len(ids), len(set(ids)))
        for p in hesap.PLANLAR:
            ok(p["ad"] and p["ozet"] and p["ozellik"] and p["durum"] in ("acik", "yakinda"))
            no(any(a in p for a in ("fiyat", "odeme", "kilit")))        # odeme yok, kilit yok
    test("plan katalogu tek yerde; odeme ve kilit alani yok", t_plan_yalniz_gorunurluk)

    def t_yonet():
        with _Depo() as r:
            k, _ = _admin(r)
            u = r.d.kullanici_ekle(k, "anne", "parola-456")
            eq(r.d.yonet(k, u["id"], plan="plus")["plan"], "plus")
            _hata(lambda: r.d.yonet(k, u["id"], plan="altin"), 400)
            _hata(lambda: r.d.yonet(k, u["id"], rol="kral"), 400)
            _hata(lambda: r.d.yonet(u, k["id"], plan="pro"), 403)                     # uye yonetemez
            _hata(lambda: r.d.yonet(k, 999, plan="pro"), 404)
            _hata(lambda: r.d.yonet(k, k["id"], rol="uye"), 409)                       # son admin
            eq(r.d.yonet(k, u["id"], rol="admin")["rol"], "admin")
            eq(r.d.yonet(k, k["id"], rol="uye")["rol"], "uye")                         # artik iki admin vardi
            l = {x["ad"]: x for x in r.d.kullanicilar(r.d.oturum(r.d.giris("anne", "parola-456")["jeton"]))}
            eq((l["anne"]["rol"], l["anne"]["plan"], l["omer"]["rol"]), ("admin", "plus", "uye"))
            ok(l["omer"]["cihaz"] >= 1 and l["omer"]["son"])
    test("yonetim: rol ve plani admin atar, son admin dusurulmez", t_yonet)

    def t_kayit_kapali():
        with _Depo() as r:
            k, _ = _admin(r)
            ok(r.d.kayit_acik())
            u = r.d.kayit("anne", "parola-456", "Soru nedir?", "cevap", False)["kullanici"]
            _hata(lambda: r.d.kayit_ayarla(u, False), 403)                             # uye kapatamaz
            _hata(lambda: r.d.kayit_ayarla(k, "hayir"), 400)
            r.d.kayit_ayarla(k, False)
            no(r.d.kayit_acik())
            e = _hata(lambda: r.d.kayit("cocuk", "parola-789", "Soru nedir?", "cevap", True), 403)
            ok("admin" in e.mesaj)
            eq(r.d.kullanici_ekle(k, "cocuk", "parola-789")["rol"], "uye")             # admin yine ekler
            r.d.kayit_ayarla(k, True)
            ok(r.d.kayit("dede", "parola-000", "Soru nedir?", "cevap", False)["jeton"])
    test("yeni hesap acma admin ayari: kapaliyken kayit olmaz, admin ekler", t_kayit_kapali)

    def t_cihazlar():
        with _Depo() as r:
            k, j_pc = _admin(r)
            j_tel = r.d.giris("omer", "parola-123", B, "iPhone · uygulama")["jeton"]
            r.saat.t += 120
            j_tab = r.d.giris("omer", "parola-123", "cihazC-111111", "Android tablet")["jeton"]
            anne = r.d.kullanici_ekle(k, "anne", "parola-456")
            j_anne = r.d.giris("anne", "parola-456", "cihazD-222222", "iPhone")["jeton"]
            l = r.d.cihazlar(k, j_pc)
            eq(len(l), 3)
            eq((l[0]["cihaz_ad"], l[0]["bu"]), ("PC", True))                          # bu cihaz basta
            eq(l[1]["cihaz_ad"], "Android tablet")                                     # sonra en yeni
            metin = json.dumps(l)
            for j in (j_pc, j_tel, j_tab):
                no(j in metin)
                no(hesap._jeton_ozeti(j) in metin)                                     # ozet de sizmaz
            tel = [x for x in l if x["cihaz_ad"].startswith("iPhone")][0]
            anne_id = r.d.cihazlar(r.d.oturum(j_anne), j_anne)[0]["id"]
            _hata(lambda: r.d.cihaz_cikar(k, j_pc, anne_id), 404)                     # baskasinin oturumu
            ok(r.d.oturum(j_anne))
            no(r.d.cihaz_cikar(k, j_pc, tel["id"]))
            eq(r.d.oturum(j_tel), None)
            _hata(lambda: r.d.cihaz_cikar(k, j_pc, tel["id"]), 404)
            _hata(lambda: r.d.cihaz_cikar(k, j_pc, "1"), 400)
            eq(r.d.otekilerden_cik(k, j_pc), 1)
            eq(r.d.oturum(j_tab), None)
            ok(r.d.oturum(j_pc) and r.d.oturum(j_anne))                               # bu cihaz ve baskasi kalir
            ok(r.d.cihaz_cikar(k, j_pc, r.d.cihazlar(k, j_pc)[0]["id"]))              # kendini cikarmak = cikis
            eq(r.d.oturum(j_pc), None)
    test("cihazlar: kendi oturumlarini gorur ve kapatir; jeton sizmaz", t_cihazlar)

    def t_gocur_surum2():
        with _Depo() as r:
            import sqlite3
            yol = os.path.join(r.klasor, "surum2.db")
            d = hesap.Depo(yol, tur=1000)
            d.kayit("omer", "parola-123", "Soru nedir?", "cevap", True)
            c = sqlite3.connect(yol)                     # surum 2'nin sutunlarina indir
            for s in ("gorunen_ad", "renk", "plan"):
                c.execute("ALTER TABLE kullanici DROP COLUMN %s" % s)
            c.commit(); c.close()
            k = hesap.Depo(yol, tur=1000).giris("omer", "parola-123")["kullanici"]
            eq((k["gorunen_ad"], k["renk"], k["plan"]), ("omer", "mavi", "ucretsiz"))
    test("surum 2 deposu profil ve plan sutunlarina gocer", t_gocur_surum2)

    # ---------------------------- etkinlik, kisisel bilgiler, verin (11-13)

    def t_etkinlik():
        with _Depo() as r:
            k, j = _admin(r)
            r.d.kullanici_ekle(k, "anne", "parola-456")
            _hata(lambda: r.d.giris("omer", "yanlis-parola", B, "iPhone", "192.168.0.23"), 401)
            _hata(lambda: r.d.giris("yok", "yanlis-parola", B, "iPhone", "192.168.0.24"), 401)   # hesap yok: yazilmaz
            j2 = r.d.giris("omer", "parola-123", B, "iPhone", "192.168.0.23")["jeton"]
            r.d.parola_degistir(k, j, "parola-123", "yeni-parola-1", "127.0.0.1")
            r.d.soru_ayarla(k, "yeni-parola-1", "Soru nedir?", "cevap", j, "127.0.0.1")
            r.d.cikis(j, "127.0.0.1")
            l = r.d.etkinlik(k)
            eq([o["tur"] for o in l], ["cikis", "soru", "parola", "giris", "yanlis", "kayit"])
            eq((l[4]["cihaz_ad"], l[4]["ip"]), ("iPhone", "192.168.0.23"))
            eq(l[1]["cihaz_ad"], "PC")                                     # oturumun cihazi
            metin = json.dumps(l)
            for gizli in ("yanlis-parola", "parola-123", "yeni-parola-1", "cevap", j, j2):
                no(gizli in metin)
            eq(r.d.etkinlik(r.d.oturum(r.d.giris("anne", "parola-456")["jeton"]))[0]["tur"], "giris")  # herkes kendininkini
            for _ in range(hesap.OLAY_EN_COK + 20):
                r.d._deneme.clear()
                _hata(lambda: r.d.giris("omer", "yanlis", B, "", "9.9.9.9"), 401)
            ok(len(r.d.etkinlik(k, hesap.OLAY_EN_COK)) == hesap.OLAY_EN_COK)  # defter sinirli
    test("etkinlik: giris, yanlis sifre, degisiklikler yazilir; sifre ve jeton yazilmaz", t_etkinlik)

    def t_etkinlik_kurtar_yonetim():
        with _Depo() as r:
            k = r.d.kayit("omer", "parola-123", "Soru nedir?", "cevap", True, A, "PC")["kullanici"]
            u = r.d.kullanici_ekle(k, "anne", "parola-456")
            _hata(lambda: r.d.kurtar("omer", "yanlis", "yeni-sifre-1", B, "iPhone", "1.1.1.1"), 401)
            r.d.kurtar("omer", "cevap", "yeni-sifre-1", B, "iPhone", "1.1.1.1")
            r.d.yonet(k, u["id"], plan="plus")
            eq([o["tur"] for o in r.d.etkinlik(k)][:2], ["kurtar", "kurtar-yanlis"])
            ok("Plus" in r.d.etkinlik(u)[0]["ayrinti"] and "omer" in r.d.etkinlik(u)[0]["ayrinti"])
            j = r.d.giris("omer", "yeni-sifre-1", A, "PC")["jeton"]
            r.d.giris("omer", "yeni-sifre-1", "cihazC-111111", "Android tablet")
            tablet = [c for c in r.d.cihazlar(k, j) if c["cihaz_ad"] == "Android tablet"][0]
            r.d.cihaz_cikar(k, j, tablet["id"], "127.0.0.1")
            o = r.d.etkinlik(k)[0]
            eq((o["tur"], o["cihaz_ad"], o["ayrinti"]), ("cihaz", "PC", "Android tablet"))
    test("etkinlik: kurtarma, cihazdan cikis ve admin degisikligi", t_etkinlik_kurtar_yonetim)

    def t_kisisel():
        with _Depo() as r:
            k, _ = _admin(r)
            bugun = time.strftime("%Y-%m-%d", time.localtime(r.saat()))
            p = r.d.profil_ayarla(k, dogum="1999-04-23", hitap="  Ömer  ", eposta="omer@ornek.com")
            eq((p["dogum"], p["hitap"], p["eposta"]), ("1999-04-23", "Ömer", "omer@ornek.com"))
            eq(r.d.profil_ayarla(k, gorunen_ad="Ö")["hitap"], "Ömer")               # None: degismez
            eq(r.d.profil_ayarla(k, hitap="", eposta="")["eposta"], "")             # bos: silinir
            _hata(lambda: r.d.profil_ayarla(k, dogum="1999-02-30"), 400)
            _hata(lambda: r.d.profil_ayarla(k, dogum="23.04.1999"), 400)
            _hata(lambda: r.d.profil_ayarla(k, dogum="2999-01-01"), 400)            # gelecek
            ok(r.d.profil_ayarla(k, dogum=bugun)["dogum"] == bugun)
            _hata(lambda: r.d.profil_ayarla(k, eposta="omer.ornek.com"), 400)
            _hata(lambda: r.d.profil_ayarla(k, hitap="x" * (hesap.HITAP_EN_UZUN + 1)), 400)
            u = r.d.kullanici_ekle(k, "anne", "parola-456")
            r.d.profil_ayarla(u, dogum="1970-01-01", eposta="anne@ornek.com")
            metin = json.dumps(r.d.kullanicilar(k))
            for gizli in ("1970-01-01", "anne@ornek.com", "kimlik", "eposta"):
                no(gizli in metin)                                                  # admin baskasinin kisiselini gormez
            no("anne@ornek.com" in json.dumps(r.d.yonet(k, u["id"], plan="pro")))
    test("kisisel bilgiler istege bagli, dogrulanir; admin listesinde gorunmez", t_kisisel)

    def t_disa_sil():
        with _Depo() as r:
            k, j = _admin(r)
            u = r.d.kayit("anne", "parola-456", "Soru nedir?", "cevap", False, B, "iPhone")
            ku, ju = u["kullanici"], u["jeton"]
            r.d.esitle(ku, "spi/ben", B, 0, [{"y": "a", "d": {"x": 1}, "z": 5}, {"y": "b", "d": {"y": 2}, "z": 5}], jeton=ju)
            r.d.esitle(ku, "spi/ben", B, 0, [{"y": "b", "d": None, "z": 9}])         # silinen disa girmez
            r.d.esitle(k, "spi/ben", A, 0, [{"y": "o", "d": {"z": 3}, "z": 5}])
            v = r.d.disa(ku)
            eq(v["alanlar"], {"spi/ben": {"a": {"x": 1}}})
            eq((v["kullanici"]["ad"], "kimlik" in v["kullanici"]), ("anne", False))
            ay = r.d.ayrinti(ku)["spi/ben"]
            eq((ay["n"], ay["son"]), (1, 5))                                        # silinen sayilmaz
            ok(ay["bayt"] > 0)
            ok(r.d.cihazlar(ku, ju)[0]["esitleme"])                                  # cihazin son esitlemesi
            _hata(lambda: r.d.sil(ku, "yanlis"), 401)
            _hata(lambda: r.d.sil(k, "parola-123"), 409)                             # son admin, baskasi varken
            kim = ku["kimlik"]
            ok(r.d.yasiyor(kim))
            r.d.sil(ku, "parola-456")
            eq(r.d.oturum(ju), None)
            no(r.d.yasiyor(kim))
            eq(r.d.disa(k)["alanlar"], {"spi/ben": {"o": {"z": 3}}})                 # baskasininki kalir
            _hata(lambda: r.d.yasiyor("kotu"), 400)
            yeni = r.d.kayit("anne", "parola-456", "Soru nedir?", "cevap", False)["kullanici"]
            ok(yeni["kimlik"] != kim)                                                # ayni ad, yeni hesap
            eq(r.d.etkinlik(yeni)[0]["tur"], "kayit")                                # eski defter gitti
            eq(len(r.d.etkinlik(yeni)), 1)
            r.d.sil(yeni, "parola-456")
            r.d.sil(k, "parola-123")                                                 # tek kalan admin silebilir
            ok(r.d.kurulum_gerekli())
    test("verin: disa aktarim, ayrinti; hesap sifreyle silinir, son admin korunur", t_disa_sil)

    def t_gocur_surum3():
        with _Depo() as r:
            import sqlite3
            yol = os.path.join(r.klasor, "surum3.db")
            hesap.Depo(yol, tur=1000).kayit("omer", "parola-123", "Soru nedir?", "cevap", True)
            c = sqlite3.connect(yol)
            for s in ("kimlik", "dogum", "hitap", "eposta"):
                c.execute("ALTER TABLE kullanici DROP COLUMN %s" % s)
            c.execute("ALTER TABLE oturum DROP COLUMN esitleme")
            c.execute("DROP TABLE olay")
            c.commit(); c.close()
            d = hesap.Depo(yol, tur=1000)
            k = d.giris("omer", "parola-123")["kullanici"]
            ok(hesap.KIMLIK_RE.match(k["kimlik"]))
            eq((k["dogum"], k["hitap"]), ("", ""))
            eq(d.etkinlik(k)[0]["tur"], "giris")
    test("surum 3 deposu kimlik, kisisel bilgi ve etkinlik tablosuna gocer", t_gocur_surum3)

    # ------------------------------------------------ baglantilar (soz 14-17)

    def _kod(r, sir, kayma=0):
        return hesap.totp(sir, int(r.saat.t // hesap.KOD_ADIM) + kayma)

    def _baska(kod):
        return "123456" if kod != "123456" else "654321"

    def _iki_adim_ac(r, k, parola="parola-123"):
        v = r.d.iki_adim_baslat(k, parola)
        return v["sir"], r.d.iki_adim_onayla(k, _kod(r, v["sir"]))["yedek"]

    def t_totp_rfc():
        sir = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"         # RFC 6238 Ek B: «12345678901234567890»
        for t, beklenen in ((59, "94287082"), (1111111109, "07081804"), (1234567890, "89005924"),
                            (2000000000, "69279037"), (20000000000, "65353130")):
            eq(hesap.totp(sir, t // 30, 8), beklenen)
        eq(hesap.totp(sir, 1), "287082")                 # 6 hane: son alti basamak
        s = hesap.sir_uret()
        ok(hesap.SIR_RE.match(s) and len(s) == 32)
        u = hesap.otpauth("Ömer Can", s)
        ok(u.startswith("otpauth://totp/LifeOS:%C3%96mer%20Can?secret=" + s))
        ok("issuer=LifeOS" in u and "digits=6" in u and "period=30" in u)
    test("iki adim: TOTP RFC 6238 vektorleri, sir ve otpauth adresi", t_totp_rfc)

    def t_iki_adim_kurulum():
        with _Depo() as r:
            k, j = _admin(r)
            eq(r.d.iki_adim(k), {"acik": False, "olusturma": None, "yedek_kalan": 0})
            _hata(lambda: r.d.iki_adim_baslat(k, "yanlis"), 401)          # sifre sorulur
            v = r.d.iki_adim_baslat(k, "parola-123")
            no(r.d.iki_adim(k)["acik"])                                   # kod gelmeden kapali
            eq(set(r.d.giris("omer", "parola-123")), {"jeton", "kullanici"})   # kurulum yarimken giris eskisi gibi
            _hata(lambda: r.d.iki_adim_onayla(k, _baska(_kod(r, v["sir"]))), 400)
            kod = _kod(r, v["sir"])
            y = r.d.iki_adim_onayla(k, " " + kod[:3] + " " + kod[3:])["yedek"]
            eq(len(y), hesap.YEDEK_ADET)
            ok(all(len(x) == 9 and x[4] == "-" and hesap.YEDEK_RE.match(x.replace("-", "")) for x in y))
            eq(len(set(y)), hesap.YEDEK_ADET)
            d = r.d.iki_adim(k)
            eq((d["acik"], d["yedek_kalan"]), (True, hesap.YEDEK_ADET))
            _hata(lambda: r.d.iki_adim_baslat(k, "parola-123"), 409)       # acikken yeniden kurulmaz
            with r.d._islem() as c:
                metin = json.dumps([list(x) for x in c.execute("SELECT * FROM yedek_kod")])
            no(any(x.replace("-", "") in metin for x in y))                # yedek kod duz yazilmaz
            eq(r.d.etkinlik(k)[0]["tur"], "iki-adim")
    test("iki adim: sifreyle baslar, kod tutunca acilir, yedek kodlar bir kez ve ozetle", t_iki_adim_kurulum)

    def t_iki_adim_giris():
        with _Depo() as r:
            k, _ = _admin(r)
            sir, yedek = _iki_adim_ac(r, k)
            r.saat.t += 90                                                # kurulum kodunun adimi gecsin
            v = r.d.giris("omer", "parola-123", B, "iPhone", "192.168.0.23")
            eq((v["iki_adim"], "jeton" in v), (True, False))              # sifre dogru ama oturum yok
            _hata(lambda: r.d.giris_kod(v["bilet"], _baska(_kod(r, sir)), "192.168.0.23"), 401)
            eq(r.d.etkinlik(k)[0]["tur"], "kod-yanlis")
            kod = _kod(r, sir)
            s = r.d.giris_kod(v["bilet"], kod, "192.168.0.23")
            eq(r.d.oturum(s["jeton"])["ad"], "omer")
            son = r.d.etkinlik(k)[0]
            eq((son["tur"], son["ayrinti"], son["cihaz_ad"]), ("giris", "iki adımlı", "iPhone"))
            _hata(lambda: r.d.giris_kod(v["bilet"], kod), 401)           # bilet tek kullanimlik
            v2 = r.d.giris("omer", "parola-123")
            _hata(lambda: r.d.giris_kod(v2["bilet"], kod), 401)          # ayni kod ikinci kez gecmez
            r.d._deneme.clear()
            s2 = r.d.giris_kod(v2["bilet"], yedek[0].lower())             # yedek kod (kucuk harf de olur)
            ok(r.d.oturum(s2["jeton"]))
            eq(r.d.etkinlik(k)[0]["ayrinti"], "yedek kod")
            eq(r.d.iki_adim(k)["yedek_kalan"], hesap.YEDEK_ADET - 1)
            v3 = r.d.giris("omer", "parola-123")
            _hata(lambda: r.d.giris_kod(v3["bilet"], yedek[0]), 401)     # yedek kod bir kez
            r.d._deneme.clear()
            r.saat.t += 30
            ok(r.d.giris_kod(v3["bilet"], _kod(r, sir, 1))["jeton"])      # bir adim ileri: saat kaymasi
            v4 = r.d.giris("omer", "parola-123")
            r.saat.t += hesap.BILET_SN + 1
            _hata(lambda: r.d.giris_kod(v4["bilet"], _kod(r, sir)), 401)  # bilet suresi doldu
            v5 = r.d.giris("omer", "parola-123")
            for _ in range(hesap.BILET_DENEME):
                r.d._deneme.clear()
                _hata(lambda: r.d.giris_kod(v5["bilet"], _baska(_kod(r, sir))), 401)
            r.d._deneme.clear()
            _hata(lambda: r.d.giris_kod(v5["bilet"], _kod(r, sir)), 401)  # bes yanlistan sonra bilet gider
            _hata(lambda: r.d.giris_kod("uydurma", "123456"), 401)
    test("iki adim: giris bilet doner, kod oturum acar; kod ve yedek bir kez; bilet suresi ve deneme siniri",
         t_iki_adim_giris)

    def t_iki_adim_bekletme():
        with _Depo() as r:
            k, _ = _admin(r)
            sir, _y = _iki_adim_ac(r, k)
            r.saat.t += 90
            for _ in range(hesap.DENEME_ESIK):
                v = r.d.giris("omer", "parola-123")
                _hata(lambda: r.d.giris_kod(v["bilet"], _baska(_kod(r, sir)), "10.0.0.9"), 401)
            v = r.d.giris("omer", "parola-123")
            _hata(lambda: r.d.giris_kod(v["bilet"], _kod(r, sir), "10.0.0.8"), 429)   # dogru kod da bekler
            r.saat.t += hesap.DENEME_TAVAN_SN + 1
            v = r.d.giris("omer", "parola-123")
            ok(r.d.giris_kod(v["bilet"], _kod(r, sir), "10.0.0.8")["jeton"])
    test("iki adim: yanlis kod hesap basina bekletir (yeni bilet de atlatamaz)", t_iki_adim_bekletme)

    def t_iki_adim_kurtar():
        with _Depo() as r:
            v = r.d.kayit("omer", "parola-123", "Soru nedir?", "Cevap", True, A, "PC")
            k, j = v["kullanici"], v["jeton"]
            sir, _y = _iki_adim_ac(r, k)
            r.saat.t += 90
            b = r.d.kurtar("omer", "cevap", "yeni-sifre-1", B, "iPhone")
            eq((b["iki_adim"], "jeton" in b), (True, False))
            eq(r.d.giris("omer", "parola-123")["iki_adim"], True)         # kod gelmeden sifre degismez
            ok(r.d.oturum(j))
            s = r.d.giris_kod(b["bilet"], _kod(r, sir))
            ok(r.d.oturum(s["jeton"]))
            no(r.d.oturum(j))                                             # eski oturumlar kapandi
            son = r.d.etkinlik(k)[0]
            eq((son["tur"], son["ayrinti"]), ("kurtar", "iki adımlı"))
            _hata(lambda: r.d.giris("omer", "parola-123"), 401)
            eq(r.d.giris("omer", "yeni-sifre-1")["iki_adim"], True)
    test("iki adim: sifremi unuttum da kodu ister; yeni sifre kodla yazilir", t_iki_adim_kurtar)

    def t_iki_adim_kapat():
        with _Depo() as r:
            k, j = _admin(r)
            r.d.kullanici_ekle(k, "anne", "parola-456")
            sir, y = _iki_adim_ac(r, k)
            r.saat.t += 90
            _hata(lambda: r.d.iki_adim_kapat(k, "yanlis", _kod(r, sir)), 401)
            _hata(lambda: r.d.iki_adim_kapat(k, "parola-123", _baska(_kod(r, sir))), 401)
            y2 = r.d.yedek_yenile(k, "parola-123")["yedek"]
            v = r.d.giris("omer", "parola-123")
            _hata(lambda: r.d.giris_kod(v["bilet"], y[1]), 401)          # eski yedekler gecersiz
            r.d._deneme.clear()
            r.d.iki_adim_kapat(k, "parola-123", y2[0])
            no(r.d.iki_adim(k)["acik"])
            ok(r.d.giris("omer", "parola-123")["jeton"])                 # yeniden tek adim
            eq([o["tur"] for o in r.d.etkinlik(k)[:3]], ["giris", "iki-adim-kapat", "kod-yanlis"])
            # Uyenin telefonu kayboldu: admin kapatir; admin kendininkini buradan kapatamaz.
            anne = r.d.oturum(r.d.giris("anne", "parola-456")["jeton"])
            _iki_adim_ac(r, anne, "parola-456")
            eq([u["iki_adim"] for u in r.d.kullanicilar(k)], [False, True])
            _hata(lambda: r.d.yonet(anne, k["id"], iki_adim=False), 403)
            _hata(lambda: r.d.yonet(k, k["id"], iki_adim=False), 409)
            _hata(lambda: r.d.yonet(k, anne["id"], iki_adim=True), 400)
            eq(r.d.yonet(k, anne["id"], iki_adim=False)["iki_adim"], False)
            son = r.d.etkinlik(anne)[0]
            eq((son["tur"], son["ayrinti"]), ("iki-adim-kapat", "admin: omer"))
            # Bilgisayarin kendisinden (komut satiri).
            _iki_adim_ac(r, k)
            ok(r.d.iki_adim_sifirla("omer"))
            no(r.d.iki_adim_sifirla("omer"))
            _hata(lambda: r.d.iki_adim_sifirla("yok"), 404)
    test("iki adim: kapatmak sifre ve kod ister; yedekler yenilenir; admin uyeninkini, PC herkesinkini kapatir",
         t_iki_adim_kapat)

    def t_bag():
        with _Depo() as r:
            k, _ = _admin(r)
            _iki_adim_ac(r, k)                                            # iki adim acikken de kod yeter
            v = r.d.bag_kodu_ac(k)
            ok(len(v["kod"]) == 6 and v["kod"].isdigit())
            eq(r.d.bag_durum(k, v["id"])["durum"], "bekliyor")
            _hata(lambda: r.d.bagla(_baska(v["kod"]), B, "iPad", "192.168.0.30"), 401)
            s = r.d.bagla(v["kod"][:3] + " " + v["kod"][3:], B, "iPad", "192.168.0.30")
            eq((r.d.oturum(s["jeton"])["ad"], s["kullanici"]["ad"]), ("omer", "omer"))
            eq(r.d.bag_durum(k, v["id"]), {"durum": "baglandi", "cihaz_ad": "iPad"})
            son = r.d.etkinlik(k)[0]
            eq((son["tur"], son["cihaz_ad"]), ("bag", "iPad"))
            _hata(lambda: r.d.bagla(v["kod"], B, "iPad"), 401)          # tek kullanimlik
            v1 = r.d.bag_kodu_ac(k)
            v2 = r.d.bag_kodu_ac(k)                                       # yeni kod eskisini kapatir
            if v1["kod"] != v2["kod"]:
                r.d._deneme.clear()
                _hata(lambda: r.d.bagla(v1["kod"], B, "iPad"), 401)
            eq(r.d.bag_durum(k, v1["id"])["durum"], "yok")
            r.d.bag_kodu_kapat(k, v2["id"])                               # vazgec
            eq(r.d.bag_durum(k, v2["id"])["durum"], "yok")
            v3 = r.d.bag_kodu_ac(k)
            r.saat.t += hesap.BAG_SN + 1
            eq(r.d.bag_durum(k, v3["id"])["durum"], "bitti")
            r.d._deneme.clear()
            _hata(lambda: r.d.bagla(v3["kod"], B, "iPad"), 401)          # suresi doldu
            v4 = r.d.bag_kodu_ac(k)
            r.d._deneme.clear()
            for i in range(hesap.DENEME_ESIK):
                _hata(lambda: r.d.bagla("12345", B, "x", "10.1.1.%d" % i), 401)
            _hata(lambda: r.d.bagla(v4["kod"], B, "x", "10.1.1.99"), 429)  # toplamda da bekletilir
            _hata(lambda: r.d.bag_durum(k, "1"), 400)
            r.d.kullanici_ekle(k, "anne", "parola-456")
            anne = r.d.oturum(r.d.giris("anne", "parola-456")["jeton"])
            eq(r.d.bag_durum(anne, v4["id"])["durum"], "yok")            # baskasinin kodu gorunmez
    test("kodla baglama: 6 hane, tek kullanimlik, 5 dk; yeni kod eskiyi kapatir; yanlista bekletilir", t_bag)

    def t_anahtar_gelen():
        with _Depo() as r:
            k, j = _admin(r)
            _hata(lambda: r.d.anahtar_ac(k, "yanlis", "iPhone Kısayollar"), 401)
            _hata(lambda: r.d.anahtar_ac(k, "parola-123", ""), 400)
            _hata(lambda: r.d.anahtar_ac(k, "parola-123", "x", "hepsi"), 400)
            a = r.d.anahtar_ac(k, "parola-123", "  iPhone   Kısayollar ", jeton=j)
            ok(a["anahtar"].startswith(hesap.ANAHTAR_ON) and len(a["anahtar"]) > 30)
            eq(a["ad"], "iPhone Kısayollar")
            l = r.d.anahtarlar(k)
            eq([(x["ad"], x["yetki"], x["son"]) for x in l], [("iPhone Kısayollar", "kayit", None)])
            no(a["anahtar"] in json.dumps(l))                             # anahtar bir kez gosterilir
            eq(l[0]["on_ek"], a["anahtar"][:len(hesap.ANAHTAR_ON) + 4])
            no(r.d.oturum(a["anahtar"]))                                  # oturum yerine gecmez
            _hata(lambda: r.d.gelen_ekle(j, "su 250"), 401)              # oturum jetonu anahtar degil
            _hata(lambda: r.d.gelen_ekle(a["anahtar"], ""), 400)
            _hata(lambda: r.d.gelen_ekle(a["anahtar"], "x" * (hesap.GELEN_METIN_EN_UZUN + 1)), 400)
            _hata(lambda: r.d.gelen_ekle(a["anahtar"], "su 250", "hkm"), 400)    # gelen kutusu yalniz uc modulde
            g = r.d.gelen_ekle(a["anahtar"], "  su   250 ", ip="192.168.0.23")
            eq(g["durum"], "bekliyor")
            ok(r.d.anahtarlar(k)[0]["son"])
            eq(r.d.baglanti_ozet(k), {"anahtar": 1, "takvim": False, "gelen_bekleyen": 1})
            # Bir cihaz alir; ayni satir oteki cihaza verilmez, sonucu gelmezse sonra verilir.
            eq([(x["metin"], x["kaynak"]) for x in r.d.gelen_al(k, "spi", A)], [("su 250", "iPhone Kısayollar")])
            eq(r.d.gelen_al(k, "spi", B), [])
            no(r.d.gelen_sonuc(k, g["id"], "onayda", "x", B))           # almayan cihaz yazamaz
            r.saat.t += hesap.GELEN_ALIM_SN + 1
            eq(len(r.d.gelen_al(k, "spi", B)), 1)
            ok(r.d.gelen_sonuc(k, g["id"], "onayda", "Onaylar’da bekliyor", B))
            no(r.d.gelen_sonuc(k, g["id"], "onayda", "iki kez", B))
            eq(r.d.gelen_al(k, "spi", A), [])
            _hata(lambda: r.d.gelen_sonuc(k, g["id"], "yazildi", "", B), 400)
            _hata(lambda: r.d.gelen_al(k, "hkm", A), 400)
            x = r.d.gelen_liste(k)[0]
            eq((x["metin"], x["durum"], x["sonuc"], x["kaynak"]),
               ("su 250", "onayda", "Onaylar’da bekliyor", "iPhone Kısayollar"))
            eq(r.d.baglanti_ozet(k)["gelen_bekleyen"], 0)
            r.d.kullanici_ekle(k, "anne", "parola-456")
            anne = r.d.oturum(r.d.giris("anne", "parola-456")["jeton"])
            eq((r.d.gelen_al(anne, "spi", A), r.d.gelen_liste(anne), r.d.anahtarlar(anne)), ([], [], []))
            _hata(lambda: r.d.anahtar_sil(anne, a["id"]), 404)           # baskasinin anahtari silinmez
            for _ in range(hesap.GELEN_SAAT_EN_COK - 1):
                r.d.gelen_ekle(a["anahtar"], "su 100")
            _hata(lambda: r.d.gelen_ekle(a["anahtar"], "su 100"), 429)   # dongudeki kisayol
            ok(len(r.d.gelen_liste(k, 1000)) <= hesap.GELEN_EN_COK)
            r.d.anahtar_sil(k, a["id"], j)
            r.d._deneme.clear()
            _hata(lambda: r.d.gelen_ekle(a["anahtar"], "su 250"), 401)
            eq([o["tur"] for o in r.d.etkinlik(k)[:2]], ["anahtar-sil", "anahtar"])
            for i in range(hesap.ANAHTAR_EN_COK):
                r.d.anahtar_ac(k, "parola-123", "a%d" % i)
            _hata(lambda: r.d.anahtar_ac(k, "parola-123", "fazla"), 409)
            r.d._deneme.clear()
            for _ in range(hesap.DENEME_ESIK):
                _hata(lambda: r.d.gelen_ekle("lifeos_uydurma", "su 1", ip="10.9.9.9"), 401)
            _hata(lambda: r.d.gelen_ekle("lifeos_uydurma", "su 1", ip="10.9.9.9"), 429)
    test("anahtar ve gelen kutusu: anahtar bir kez, ozetle; satir anlasilmadan kutuya; tek cihaz alir",
         t_anahtar_gelen)

    def t_takvim():
        with _Depo() as r:
            k, j = _admin(r)
            ics = ("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//LifeOS//AYS//TR\r\nX-WR-CALNAME:AYS\r\n"
                   "BEGIN:VEVENT\r\nUID:ays-sinav-TYT@lifeos\r\nDTSTART;VALUE=DATE:20270619\r\n"
                   "SUMMARY:TYT sınav günü ve çok uzun bir başlık ki satır katlansın diye yazıldı\r\n"
                   " devamı\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n")
            _hata(lambda: r.d.yayinla(k, "ays/baska", ics), 400)
            _hata(lambda: r.d.yayinla(k, "ays/takvim", "merhaba"), 400)
            _hata(lambda: r.d.yayinla(k, "ays/takvim", "BEGIN:VCALENDAR\n" + "x" * hesap.YAYIN_EN_BUYUK
                                      + "\nEND:VCALENDAR"), 413)
            r.d.yayinla(k, "ays/takvim", ics, 1)
            t = r.d.takvim(k)
            eq((t["acik"], t["yol"], [(y["ad"], y["adet"]) for y in t["yayinlar"]]),
               (False, None, [("ays/takvim", 1)]))
            t = r.d.takvim_ac(k, jeton=j)
            m = hesap.TAKVIM_YOL_RE.match(t["yol"])
            ok(m)
            no(t["son"])
            cal = r.d.takvim_ics(m.group(1))
            ok(cal.startswith("BEGIN:VCALENDAR\r\n") and cal.endswith("END:VCALENDAR\r\n"))
            eq(cal.count("BEGIN:VEVENT"), 1)
            ok("SUMMARY:TYT sınav günü" in cal and "\r\n devamı\r\n" in cal)   # katlanmis satir korunur
            ok("X-WR-CALNAME:LifeOS" in cal and "X-WR-CALNAME:AYS" not in cal)
            ok(r.d.takvim(k)["son"])
            eq(r.d.takvim_ac(k)["yol"], t["yol"])                         # acikken ayni adres
            t2 = r.d.takvim_ac(k, yenile=True)
            ok(t2["yol"] != t["yol"])
            eq(r.d.takvim_ics(m.group(1)), None)                          # eski adres hemen kapanir
            r.d.takvim_kapat(k)
            eq(r.d.takvim_ics(hesap.TAKVIM_YOL_RE.match(t2["yol"]).group(1)), None)
            eq([o["tur"] for o in r.d.etkinlik(k)[:3]], ["takvim-kapat", "takvim", "takvim"])
            eq(hesap.gunluk_maskele('"GET /api/hesap/takvim/abcDEF_123-xyz456789012.ics HTTP/1.1"'),
               '"GET /api/hesap/takvim/… HTTP/1.1"')
    test("takvim aboneligi: modul yayinlar, sunucu anlamadan birlestirir; yenile eskiyi kapatir", t_takvim)

    def t_baglanti_sil():
        with _Depo() as r:
            k, j = _admin(r)
            r.d.kullanici_ekle(k, "anne", "parola-456")
            anne = r.d.oturum(r.d.giris("anne", "parola-456")["jeton"])
            _iki_adim_ac(r, anne, "parola-456")
            a = r.d.anahtar_ac(anne, "parola-456", "Kısayol")["anahtar"]
            r.d.gelen_ekle(a, "su 250")
            r.d.yayinla(anne, "ays/takvim", "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n")
            r.d.takvim_ac(anne)
            r.d.bag_kodu_ac(anne)
            r.d.sil(anne, "parola-456")
            with r.d._islem() as c:
                for t in ("iki_adim", "yedek_kod", "bilet", "bag_kodu", "anahtar", "gelen", "yayin", "takvim"):
                    eq(c.execute("SELECT COUNT(*) FROM %s WHERE kullanici=?" % t, (anne["id"],)).fetchone()[0], 0, t)
    test("hesap silinince iki adim, anahtar, gelen, yayin ve takvim de gider", t_baglanti_sil)

    # -------------------------------------------------------------- HTTP

    import sunucu  # noqa: E402

    class _Srv:
        def __enter__(self):
            self.r = _Depo().__enter__()
            self.eski = hesap._DEPO
            hesap.depo_kur(self.r.d)
            self.dosya = tempfile.mkdtemp(prefix="lifeos-hesap-src-")
            from functools import partial
            self.s = sunucu.KuyrukluSunucu(("127.0.0.1", 0), partial(sunucu.Sunucu, directory=self.dosya))
            threading.Thread(target=self.s.serve_forever, daemon=True).start()
            self.adres = "http://127.0.0.1:%d" % self.s.server_address[1]
            return self

        def iste(self, yol, govde=None, baslik=None, yontem=None):
            b = {"Content-Type": "application/json"}
            b.update(baslik or {})
            veri = None if govde is None else json.dumps(govde).encode("utf-8")
            q = urllib.request.Request(self.adres + yol, data=veri, headers=b,
                                       method=yontem or ("POST" if govde is not None else "GET"))
            try:
                with urllib.request.urlopen(q, timeout=10) as c:
                    ham = c.read()
                    return c.status, dict(c.headers), (json.loads(ham) if ham else None)
            except urllib.error.HTTPError as e:
                ham = e.read()
                json_mu = "json" in (e.headers.get("Content-Type") or "")
                return e.code, dict(e.headers), (json.loads(ham) if ham and json_mu else None)

        def __exit__(self, *a):
            self.s.shutdown()
            self.s.server_close()
            hesap.depo_kur(self.eski)
            shutil.rmtree(self.dosya, ignore_errors=True)
            self.r.__exit__()

    H = {"X-LifeOS": "hesap"}

    def t_http_akis():
        with _Srv() as s:
            kod, _, v = s.iste("/api/hesap/durum")
            eq(kod, 200)
            ok(v["kurulum"] and v["yerel"])
            ok(isinstance(v["ev_agi"], list))                # telefon/tablet icin adres (yoksa bos)
            eq(s.iste("/api/hesap/kur", {"ad": "omer", "parola": "parola-123"})[0], 403)  # basliksiz
            kod, _, v = s.iste("/api/hesap/kur", {"ad": "omer", "parola": "parola-123", "cihaz": A}, H)
            eq(kod, 200)
            j = v["jeton"]
            eq(s.iste("/api/hesap/esitle", {"alan": "spi/ben", "cihaz": A, "son": 0, "gonder": []}, H)[0], 401)
            yetki = dict(H, Authorization="Bearer " + j)
            kod, _, v = s.iste("/api/hesap/esitle", {"alan": "spi/ben", "cihaz": A, "son": 0,
                                                     "gonder": [{"y": "v", "d": {"a": 1}, "z": 5}]}, yetki)
            eq((kod, v["kabul"]), (200, 1))
            kod, _, v = s.iste("/api/hesap/ben", baslik={"Authorization": "Bearer " + j})
            eq((kod, v["kullanici"]["ad"], v["ozet"]), (200, "omer", {"spi/ben": 1}))
            eq(s.iste("/api/hesap/cikis", {}, yetki)[0], 200)
            eq(s.iste("/api/hesap/ben", baslik={"Authorization": "Bearer " + j})[0], 401)
    test("HTTP: kurulum, eslesme basligi, jetonla esitleme, cikis", t_http_akis)

    def t_http_kayit():
        with _Srv() as s:
            kod, _, v = s.iste("/api/hesap/kayit", {"ad": "omer", "parola": "parola-123", "soru": "Soru nedir?",
                                                    "cevap": "Cevap", "cihaz": A}, H)
            eq((kod, v["kullanici"]["rol"]), (200, "admin"))
            kod, _, v = s.iste("/api/hesap/soru", {"ad": "omer"}, H)
            eq((kod, v["soru"]), (200, "Soru nedir?"))
            kod, _, v = s.iste("/api/hesap/kurtar", {"ad": "omer", "cevap": "cevap", "yeni": "yeni-sifre-1", "cihaz": B}, H)
            eq(kod, 200)
            yetki = {"Authorization": "Bearer " + v["jeton"]}
            kod, _, v = s.iste("/api/hesap/ben", baslik=yetki)
            eq((kod, v["soru_var"]), (200, True))
            eq(s.iste("/api/hesap/soru-ayarla", {"parola": "yeni-sifre-1", "soru": "Baska soru?", "cevap": "b"},
                      dict(H, **yetki))[0], 400)               # cevap cok kisa
            eq(s.iste("/api/hesap/soru-ayarla", {"parola": "yeni-sifre-1", "soru": "Baska soru?", "cevap": "bb"},
                      dict(H, **yetki))[0], 200)
    test("HTTP: kayit, soru, kurtarma ve soru ayarlama", t_http_kayit)

    def t_http_hesap_ayarlari():
        with _Srv() as s:
            kod, _, v = s.iste("/api/hesap/kayit", {"ad": "omer", "parola": "parola-123", "soru": "Soru nedir?",
                                                    "cevap": "Cevap", "cihaz": A, "cihaz_ad": "Windows PC"}, H)
            eq((kod, v["kullanici"]["plan"], v["kullanici"]["renk"]), (200, "ucretsiz", "mavi"))
            y = dict(H, Authorization="Bearer " + v["jeton"])
            kod, _, v = s.iste("/api/hesap/ben", baslik=y)
            eq([p["id"] for p in v["planlar"]], list(hesap.PLAN_IDS))
            eq((v["renkler"][0], v["kayit"]), ("mavi", True))
            kod, _, v = s.iste("/api/hesap/profil", {"gorunen_ad": "Ömer", "renk": "mor"}, y)
            eq((kod, v["kullanici"]["gorunen_ad"], v["kullanici"]["renk"]), (200, "Ömer", "mor"))
            eq(s.iste("/api/hesap/profil", {"renk": "altin"}, y)[0], 400)
            kod, _, v = s.iste("/api/hesap/giris", {"ad": "omer", "parola": "parola-123", "cihaz": B,
                                                    "cihaz_ad": "iPhone · uygulama"}, H)
            y_tel = dict(H, Authorization="Bearer " + v["jeton"])
            kod, _, v = s.iste("/api/hesap/cihazlar", baslik=y)
            eq([(c["cihaz_ad"], c["bu"]) for c in v["cihazlar"]], [("Windows PC", True), ("iPhone · uygulama", False)])
            no(any(a in c for c in v["cihazlar"] for a in ("ozet", "jeton", "cihaz")))
            kod, _, v = s.iste("/api/hesap/otekilerden-cik", {}, y)
            eq((kod, v["n"]), (200, 1))
            eq(s.iste("/api/hesap/ben", baslik=y_tel)[0], 401)
            kod, _, v = s.iste("/api/hesap/ayar", {"kayit": False}, y)
            eq((kod, v["kayit"]), (200, False))
            eq(s.iste("/api/hesap/durum")[2]["kayit"], False)
            eq(s.iste("/api/hesap/kayit", {"ad": "anne", "parola": "parola-456", "soru": "Soru nedir?",
                                           "cevap": "Cevap"}, H)[0], 403)
            kod, _, v = s.iste("/api/hesap/kullanici", {"ad": "anne", "parola": "parola-456"}, y)
            kod, _, v = s.iste("/api/hesap/yonet", {"id": v["id"], "plan": "pro"}, y)
            eq((kod, v["kullanici"]["plan"]), (200, "pro"))
            kod, _, v = s.iste("/api/hesap/kullanicilar", baslik=y)
            eq(([u["plan"] for u in v["kullanicilar"]], v["kayit"]), (["ucretsiz", "pro"], False))
            eq(s.iste("/api/hesap/yonet", {"id": 1, "plan": "pro"}, H)[0], 401)       # jetonsuz yonetim yok
    test("HTTP: profil, plan katalogu, cihazlar, yeni hesap ayari ve yonetim", t_http_hesap_ayarlari)

    def t_http_verin():
        with _Srv() as s:
            kod, _, v = s.iste("/api/hesap/kayit", {"ad": "omer", "parola": "parola-123", "soru": "Soru nedir?",
                                                    "cevap": "Cevap", "cihaz": A, "cihaz_ad": "Windows PC"}, H)
            y = dict(H, Authorization="Bearer " + v["jeton"])
            kim = v["kullanici"]["kimlik"]
            eq(s.iste("/api/hesap/giris", {"ad": "omer", "parola": "yanlis", "cihaz_ad": "iPhone"}, H)[0], 401)
            kod, _, v = s.iste("/api/hesap/etkinlik", baslik=y)
            eq([o["tur"] for o in v["olaylar"]], ["yanlis", "kayit"])
            eq(v["olaylar"][0]["ip"], "127.0.0.1")
            s.iste("/api/hesap/esitle", {"alan": "ays/ben", "cihaz": A, "son": 0,
                                         "gonder": [{"y": "v", "d": {"a": 1}, "z": 5}]}, y)
            kod, _, v = s.iste("/api/hesap/ben", baslik=y)
            eq(v["ayrinti"]["ays/ben"]["n"], 1)
            kod, _, v = s.iste("/api/hesap/disa", baslik=y)
            eq((kod, v["alanlar"]), (200, {"ays/ben": {"v": {"a": 1}}}))
            kod, _, v = s.iste("/api/hesap/profil", {"hitap": "Ömer", "dogum": "1999-04-23"}, y)
            eq((v["kullanici"]["hitap"], v["kullanici"]["dogum"]), ("Ömer", "1999-04-23"))
            eq(s.iste("/api/hesap/yasiyor", {"kimlik": kim}, y)[2], {"var": True})
            eq(s.iste("/api/hesap/sil", {"parola": "yanlis"}, y)[0], 401)
            eq(s.iste("/api/hesap/sil", {"parola": "parola-123"}, y)[0], 200)
            eq(s.iste("/api/hesap/ben", baslik=y)[0], 401)
            ok(s.iste("/api/hesap/durum")[2]["kurulum"])
            eq(s.iste("/api/hesap/etkinlik")[0], 401)                                 # jetonsuz yok
    test("HTTP: etkinlik, ayrinti, disa aktarim, kisisel bilgi ve hesabi silme", t_http_verin)

    def t_http_koken():
        with _Srv() as s:
            uygulama = {"Origin": "http://127.0.0.1:4183", "Access-Control-Request-Method": "POST"}
            kod, b, _ = s.iste("/api/hesap/esitle", baslik=uygulama, yontem="OPTIONS")
            eq(kod, 204)
            eq(b.get("Access-Control-Allow-Origin"), "http://127.0.0.1:4183")
            ok("Authorization" in b.get("Access-Control-Allow-Headers", ""))
            kod, b, _ = s.iste("/api/hesap/esitle", baslik={"Origin": "https://kotu.example"}, yontem="OPTIONS")
            eq(kod, 403)
            no(b.get("Access-Control-Allow-Origin"))
            kod, _, _ = s.iste("/api/hesap/giris", {"ad": "x", "parola": "y"},
                               dict(H, Origin="https://kotu.example"))
            eq(kod, 403)                                  # baska site giremez/kuramaz
            kod, b, _ = s.iste("/api/hesap/durum", baslik={"Origin": "http://127.0.0.1:4193"})
            eq((kod, b.get("Access-Control-Allow-Origin")), (200, "http://127.0.0.1:4193"))
    test("HTTP: capraz koken yalniz telefon uygulamasina acik", t_http_koken)

    def t_giris_sayfasi():
        """Giris bir kez, modul secim sayfasinda (2026-10-04, depo sahibi)."""
        for h in (sunucu.giris_html(), sunucu.giris_html(telefon=True)):
            ok('<script src="/hesap.js" data-giris></script>' in h and 'href="/hesap.css"' in h)
        eski = hesap._DEPO
        r = _Depo().__enter__()
        hesap.depo_kur(r.d)
        srv = sunucu.KuyrukluSunucu(("127.0.0.1", 0), sunucu.Giris)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        adres = "http://127.0.0.1:%d" % srv.server_address[1]
        try:
            with urllib.request.urlopen(adres + "/hesap.js", timeout=10) as c:
                ok(b"LIFEOS.HESAP" in c.read() and "javascript" in c.headers.get("Content-Type"))
            # Secim sayfasi LifeOS'un kendi «Animasyonlar» ayarini izler (2026-10-06).
            with urllib.request.urlopen(adres + "/animasyon.js", timeout=10) as c:
                ok(b"L.ANIMASYON = Object.freeze" in c.read() and "javascript" in c.headers.get("Content-Type"))
            # QR (hesap sayfasi: iki adim kurulumu, kodla cihaz baglama; 2026-10-08).
            with urllib.request.urlopen(adres + "/qr.js", timeout=10) as c:
                ok(b"LIFEOS.QR" in c.read() and "javascript" in c.headers.get("Content-Type"))
            with urllib.request.urlopen(adres + "/api/hesap/durum", timeout=10) as c:
                ok(json.loads(c.read())["kurulum"])
            q = urllib.request.Request(adres + "/api/hesap/kayit", method="POST", data=json.dumps(
                {"ad": "omer", "parola": "parola-123", "soru": "Soru nedir?", "cevap": "cevap"}).encode("utf-8"),
                headers={"Content-Type": "application/json", "X-LifeOS": "hesap"})
            with urllib.request.urlopen(q, timeout=10) as c:
                eq(json.loads(c.read())["kullanici"]["rol"], "admin")   # PC'deki secim sayfasindan admin
        finally:
            srv.shutdown(); srv.server_close()
            hesap.depo_kur(eski)
            r.__exit__()
    test("giris bir kez secim sayfasinda: hesap dosyalari ve API 4180'de", t_giris_sayfasi)

    def t_http_dosya():
        with _Srv() as s:
            with open(os.path.join(s.dosya, "index.html"), "w", encoding="utf-8") as f:
                f.write("<p>sayfa</p>")
            q = urllib.request.Request(s.adres + "/index.html")
            with urllib.request.urlopen(q, timeout=10) as c:
                eq(c.read(), b"<p>sayfa</p>")
            eq(s.iste("/api/hesap/yok", {}, H)[0], 401)
            eq(s.iste("/baska", {}, H)[0], 405)       # API disi POST dosya sunumuna girmez
    test("HTTP: dosya sunumu bozulmaz, API disi POST reddedilir", t_http_dosya)

    def t_http_baglantilar():
        with _Srv() as s:
            kod, _, v = s.iste("/api/hesap/kayit", {"ad": "omer", "parola": "parola-123", "soru": "Soru nedir?",
                                                    "cevap": "Cevap", "cihaz": A, "cihaz_ad": "Windows PC"}, H)
            y = dict(H, Authorization="Bearer " + v["jeton"])
            # Iki adim: baslat -> onayla -> giris bilet -> giris-kod.
            kod, _, v = s.iste("/api/hesap/iki-adim/baslat", {"parola": "parola-123"}, y)
            eq(kod, 200)
            sir = v["sir"]
            ok(v["uri"].startswith("otpauth://totp/LifeOS:omer?secret=" + sir))
            kod, _, v = s.iste("/api/hesap/iki-adim/onayla", {"kod": _kod(s.r, sir)}, y)
            eq((kod, len(v["yedek"])), (200, hesap.YEDEK_ADET))
            kod, _, v = s.iste("/api/hesap/ben", baslik=y)
            eq((v["iki_adim"]["acik"], v["baglantilar"]), (True, {"anahtar": 0, "takvim": False, "gelen_bekleyen": 0}))
            s.r.saat.t += 90
            kod, _, v = s.iste("/api/hesap/giris", {"ad": "omer", "parola": "parola-123", "cihaz": B,
                                                    "cihaz_ad": "iPhone"}, H)
            eq((kod, v["iki_adim"], "jeton" in v), (200, True, False))
            eq(s.iste("/api/hesap/giris-kod", {"bilet": v["bilet"], "kod": _kod(s.r, sir)})[0], 403)   # basliksiz
            kod, _, v = s.iste("/api/hesap/giris-kod", {"bilet": v["bilet"], "kod": _kod(s.r, sir)}, H)
            eq((kod, v["kullanici"]["ad"]), (200, "omer"))
            # Kodla baglama.
            kod, _, v = s.iste("/api/hesap/bag-kodu", {}, y)
            eq(kod, 200)
            kod, _, b = s.iste("/api/hesap/bagla", {"kod": v["kod"], "cihaz": B, "cihaz_ad": "iPad"}, H)
            eq((kod, b["kullanici"]["ad"]), (200, "omer"))
            eq(s.iste("/api/hesap/bag-durum", {"id": v["id"]}, y)[2]["durum"], "baglandi")
            # Erisim anahtari: disaridan X-LifeOS'suz, yalniz anahtarla.
            kod, _, v = s.iste("/api/hesap/anahtar", {"parola": "parola-123", "ad": "iPhone Kısayollar"}, y)
            a = v["anahtar"]
            kod, _, v = s.iste("/api/hesap/gelen", {"metin": "kilo 72,4"}, {"Authorization": "Bearer " + a})
            eq((kod, v["durum"]), (200, "bekliyor"))
            eq(s.iste("/api/hesap/gelen", {"metin": "su 1"}, {"Authorization": "Bearer " + y["Authorization"][7:]})[0],
               401)                                                     # oturum jetonu anahtar degil
            eq(s.iste("/api/hesap/ben", baslik={"Authorization": "Bearer " + a})[0], 401)  # anahtar oturum degil
            kod, _, v = s.iste("/api/hesap/gelen-al", {"modul": "spi", "cihaz": A}, y)
            eq([x["metin"] for x in v["gelen"]], ["kilo 72,4"])
            kod, _, v = s.iste("/api/hesap/gelen-sonuc", {"id": v["gelen"][0]["id"], "durum": "onayda",
                                                         "sonuc": "Onaylar’da", "cihaz": A}, y)
            eq((kod, v["ok"]), (200, True))
            # Takvim: modul yayinlar, takvim uygulamasi basliksiz ceker.
            ics = "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:x@lifeos\r\nSUMMARY:TYT\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n"
            eq(s.iste("/api/hesap/yayin", {"ad": "ays/takvim", "icerik": ics, "adet": 1}, y)[0], 200)
            kod, _, v = s.iste("/api/hesap/takvim", {}, y)
            yol = v["takvim"]["yol"]
            q = urllib.request.Request(s.adres + yol)
            with urllib.request.urlopen(q, timeout=10) as c:
                ok("text/calendar" in c.headers.get("Content-Type"))
                ok(b"SUMMARY:TYT" in c.read())
            eq(s.iste(yol.replace(".ics", "x.ics"))[0], 404)
            kod, _, v = s.iste("/api/hesap/baglantilar", baslik=y)
            eq((kod, len(v["anahtarlar"]), v["gelen"][0]["durum"], v["takvim"]["acik"], v["iki_adim"]["acik"]),
               (200, 1, "onayda", True, True))
            no(a in json.dumps(v))
            kod, _, v = s.iste("/api/hesap/takvim-kapat", {}, y)
            eq((kod, v["takvim"]["acik"]), (200, False))
            eq(s.iste(yol)[0], 404)
    test("HTTP: iki adim, kodla baglama, disaridan anahtarla satir, takvim adresi", t_http_baglantilar)

    def t_http_gelen_ics_ayrinti():
        with _Srv() as s:
            kod, _, v = s.iste("/api/hesap/kayit", {"ad": "omer", "parola": "parola-123", "soru": "Soru nedir?",
                                                    "cevap": "Cevap", "cihaz": A}, H)
            y = dict(H, Authorization="Bearer " + v["jeton"])
            a = s.iste("/api/hesap/anahtar", {"parola": "parola-123", "ad": "Kısayol"}, y)[2]["anahtar"]
            q = urllib.request.Request(s.adres + "/api/hesap/gelen", data=b"su 250", method="POST",
                                       headers={"Authorization": "Bearer " + a, "Content-Type": "text/plain"})
            try:
                urllib.request.urlopen(q, timeout=10)
                raise AssertionError("400 bekleniyordu")
            except urllib.error.HTTPError as e:
                eq(e.code, 400)
                ok("JSON" in json.loads(e.read())["hata"])          # ne beklendigi soylenir
            yol = s.iste("/api/hesap/takvim", {}, y)[2]["takvim"]["yol"]
            q = urllib.request.Request(s.adres + yol, headers={"Origin": "http://127.0.0.1:4183"})
            with urllib.request.urlopen(q, timeout=10) as c:
                eq((c.status, c.headers.get("Access-Control-Allow-Origin")), (200, "http://127.0.0.1:4183"))
            kod, b, _ = s.iste(yol, baslik={"Origin": "http://kotu.example"})
            eq((kod, b.get("Access-Control-Allow-Origin")), (403, None))  # yabanci koken
    test("HTTP: duz metin govdede ne beklendigi soylenir; takvim telefon uygulamasina capraz izinli", t_http_gelen_ics_ayrinti)

    # ------------------------------------------------ cihazlar ve uyarilar (soz 18-19)

    def t_cihaz_adi_yontem():
        with _Depo() as r:
            k, j = _admin(r)
            l = r.d.cihazlar(k, j)
            eq((l[0]["yontem"], l[0]["ozel_ad"]), ("kur", False))
            j2 = r.d.giris("omer", "parola-123", B, "iPad", "192.168.0.30")["jeton"]
            ok(r.d.oturum(j2, "192.168.0.31"))                           # adres degisti
            ipad = [c for c in r.d.cihazlar(k, j) if not c["bu"]][0]
            eq((ipad["yontem"], ipad["ip"], ipad["cihaz_ad"]), ("sifre", "192.168.0.31", "iPad"))
            _hata(lambda: r.d.cihaz_adlandir(k, ipad["id"], "  "), 400)
            _hata(lambda: r.d.cihaz_adlandir(k, ipad["id"], "x" * 41), 400)
            _hata(lambda: r.d.cihaz_adlandir(k, 9999, "x"), 404)
            eq(r.d.cihaz_adlandir(k, ipad["id"], "  Ömer'in   iPad'i "), "Ömer'in iPad'i")
            ipad = [c for c in r.d.cihazlar(k, j) if not c["bu"]][0]
            eq((ipad["cihaz_ad"], ipad["ozel_ad"]), ("Ömer'in iPad'i", True))
            # Cikip yeniden girince ad kalir (cihaz kimligine bagli).
            r.d.cikis(j2)
            r.d.giris("omer", "parola-123", B, "iPad", "192.168.0.30")
            eq([c["cihaz_ad"] for c in r.d.cihazlar(k, j) if not c["bu"]], ["Ömer'in iPad'i"])
            eq(r.d.etkinlik(k)[0]["cihaz_ad"], "Ömer'in iPad'i")          # olay da bu adla
            r.d.kullanici_ekle(k, "anne", "parola-456")
            anne = r.d.oturum(r.d.giris("anne", "parola-456", B, "iPad")["jeton"])
            eq([c["cihaz_ad"] for c in r.d.cihazlar(anne, None)], ["iPad"])  # ad hesaba ozel
            _hata(lambda: r.d.cihaz_adlandir(anne, ipad["id"], "x"), 404)    # baskasinin oturumu
            # Kod ve iki adim yollari da yazilir.
            v = r.d.bag_kodu_ac(k)
            r.d.bagla(v["kod"], "cihazC-777777", "Tablet")
            sir, y = _iki_adim_ac(r, k)
            r.saat.t += 90
            b = r.d.giris("omer", "parola-123", "cihazD-888888", "Telefon")
            r.d.giris_kod(b["bilet"], y[0])
            yol = {c["cihaz_ad"]: c["yontem"] for c in r.d.cihazlar(k, j)}
            eq((yol["Tablet"], yol["Telefon"]), ("kod", "yedek"))
    test("cihazlar: giris yolu ve son adres yazilir; ad cihaza baglidir, cikip girince kalir", t_cihaz_adi_yontem)

    def t_uyarilar():
        with _Depo() as r:
            k, j = _admin(r)                                              # PC (A)
            j2 = r.d.giris("omer", "parola-123", B, "iPad", "192.168.0.30")["jeton"]
            _hata(lambda: r.d.giris("omer", "yanlis", B, "iPad", "192.168.0.30"), 401)
            r.d.soru_ayarla(k, "parola-123", "Soru nedir?", "cevap", j)     # uyari turu degil
            l = r.d.uyarilar(k, j)
            eq([(u["tur"], u["bu"]) for u in l], [("yanlis", False), ("giris", False), ("kayit", True)][:2])
            ipad = [u for u in l if u["tur"] == "giris"][0]
            eq(ipad["oturum"], [c["id"] for c in r.d.cihazlar(k, j) if not c["bu"]][0])
            eq([u["bu"] for u in r.d.uyarilar(k, j2)], [True, True])       # iPad kendi olaylarini «bu» gorur
            r.d.cihaz_cikar(k, j, ipad["oturum"])
            eq([u for u in r.d.uyarilar(k, j) if u["tur"] == "giris"][0]["oturum"], None)  # oturum kapandi
            r.saat.t += hesap.UYARI_GUN * 86400 + 1
            eq(r.d.uyarilar(k, j), [])                                    # eski olay uyari degil
            no(json.dumps(l).count("parola-123"))
    test("uyarilar: baska cihazin girisi ve yanlis denemesi; bu cihazinki «bu»; kapanan oturum bos", t_uyarilar)

    def t_anahtar_dene():
        with _Depo() as r:
            k, j = _admin(r)
            a = r.d.anahtar_ac(k, "parola-123", "Kısayol")["anahtar"]
            v = r.d.anahtar_dene(a)
            eq((v["ok"], v["anahtar"]), (True, "Kısayol"))
            ok(r.d.anahtarlar(k)[0]["son"])
            eq(r.d.gelen_liste(k), [])                                    # satir birakmaz
            _hata(lambda: r.d.anahtar_dene(j), 401)
            _hata(lambda: r.d.anahtar_dene("lifeos_yok"), 401)
    test("anahtar denemesi: gecerli anahtar «tamam» der, satir birakmaz; yanlis 401", t_anahtar_dene)

    def t_gocur_surum5():
        klasor = tempfile.mkdtemp(prefix="lifeos-hesap-")
        try:
            import sqlite3
            yol = os.path.join(klasor, "hesap.db")
            c = sqlite3.connect(yol)
            c.executescript("CREATE TABLE oturum(ozet TEXT PRIMARY KEY, kullanici INTEGER NOT NULL, cihaz TEXT NOT NULL, "
                            "cihaz_ad TEXT, olusturma REAL NOT NULL, son REAL NOT NULL, esitleme REAL);"
                            "CREATE TABLE olay(id INTEGER PRIMARY KEY, kullanici INTEGER NOT NULL, tur TEXT NOT NULL, "
                            "cihaz_ad TEXT, ip TEXT, ayrinti TEXT, zaman REAL NOT NULL);"
                            "INSERT INTO oturum VALUES('x', 1, 'c1', 'PC', 1, 1, NULL);")
            c.commit(); c.close()
            d = hesap.Depo(yol, tur=1000)
            with d._islem() as c2:
                eq({"yontem", "ip"} <= {r["name"] for r in c2.execute("PRAGMA table_info(oturum)")}, True)
                eq({"cihaz", "oturum"} <= {r["name"] for r in c2.execute("PRAGMA table_info(olay)")}, True)
                eq(c2.execute("SELECT cihaz_ad FROM oturum").fetchone()[0], "PC")
        finally:
            shutil.rmtree(klasor, ignore_errors=True)
    test("surum 5 deposu giris yolu, adres ve olay baglarina gocer", t_gocur_surum5)

    def t_http_cihaz_uyari():
        with _Srv() as s:
            kod, _, v = s.iste("/api/hesap/kayit", {"ad": "omer", "parola": "parola-123", "soru": "Soru nedir?",
                                                    "cevap": "Cevap", "cihaz": A, "cihaz_ad": "Windows PC"}, H)
            y = dict(H, Authorization="Bearer " + v["jeton"])
            s.iste("/api/hesap/giris", {"ad": "omer", "parola": "parola-123", "cihaz": B, "cihaz_ad": "iPad"}, H)
            kod, _, v = s.iste("/api/hesap/uyarilar", baslik=y)
            eq((kod, [u["tur"] for u in v["uyarilar"]][:1], v["uyarilar"][0]["bu"]), (200, ["giris"], False))
            oid = v["uyarilar"][0]["oturum"]
            kod, _, v = s.iste("/api/hesap/cihaz-ad", {"id": oid, "ad": "Salon tableti"}, y)
            eq((kod, v["ad"], [c["cihaz_ad"] for c in v["cihazlar"]]), (200, "Salon tableti", ["Windows PC", "Salon tableti"]))
            eq(v["cihazlar"][0]["ip"], "127.0.0.1")
            a = s.iste("/api/hesap/anahtar", {"parola": "parola-123", "ad": "Kısayol"}, y)[2]["anahtar"]
            kod, _, v = s.iste("/api/hesap/gelen", baslik={"Authorization": "Bearer " + a})
            eq((kod, v["ok"]), (200, True))
            eq(s.iste("/api/hesap/gelen", baslik={"Authorization": "Bearer lifeos_yok"})[0], 401)
    test("HTTP: uyarilar, cihaza ad verme ve anahtar denemesi", t_http_cihaz_uyari)

    # ------------------------------------------------ deponun yedegi (soz 20)

    def _gun(r, n=1):
        r.saat.t += n * 86400

    def t_kopya_gunluk():
        with _Depo() as r:
            eq(r.d.kopya_gunluk(), None)                                  # hesap yok: yedeklenecek bir sey yok
            k, j = _admin(r)
            r.d.esitle(k, "spi/ben", A, 0, [{"y": "v/1", "d": {"kilo": 72}, "z": 5}])
            x = r.d.kopya_gunluk()
            eq((x["tur"], x["kullanici"], x["kayit"]), ("gunluk", 1, 1))
            ok(os.path.isfile(os.path.join(r.d.kopya_klasoru(), x["ad"])))
            eq(r.d.kopya_gunluk(), None)                                  # ayni gun ikinci kez alinmaz
            no([a for a in os.listdir(r.d.kopya_klasoru()) if not hesap.KOPYA_RE.match(a)])   # yarim/-wal kalmaz
            for _ in range(9):
                _gun(r)
                ok(r.d.kopya_gunluk())
            l = r.d.kopyalar()
            eq(len(l), hesap.KOPYA_SAKLA["gunluk"])                       # son 7 gun
            eq(l[0]["zaman"] > l[-1]["zaman"], True)                      # en yenisi once
            for _ in range(7):
                r.saat.t += 1
                r.d.kopya_al("elle")
            eq(len([x for x in r.d.kopyalar() if x["tur"] == "elle"]), hesap.KOPYA_SAKLA["elle"])
            eq(len([x for x in r.d.kopyalar() if x["tur"] == "gunluk"]), hesap.KOPYA_SAKLA["gunluk"])
            _hata(lambda: r.d.kopya_al("baska"), 400)
    test("yedek: gunde bir, SQLite denetiminden gecer; son 7 gunluk ve 5 elle kalir", t_kopya_gunluk)

    def t_kopya_bak():
        with _Depo() as r:
            _admin(r)
            x = r.d.kopya_al("elle")
            yol = os.path.join(r.d.kopya_klasoru(), x["ad"])
            eq(hesap.Depo._kopya_bak(yol), {"kullanici": 1, "kayit": 0})
            bozuk = os.path.join(r.klasor, "bozuk.db")
            with open(yol, "rb") as f:
                ham = bytearray(f.read())
            ham[200:4096] = b"\xff" * (4096 - 200)                        # birinci sayfanin semasi bozuldu
            with open(bozuk, "wb") as f:
                f.write(bytes(ham))
            _hata(lambda: hesap.Depo._kopya_bak(bozuk), 422)
            import sqlite3
            yabanci = os.path.join(r.klasor, "yabanci.db")
            c = sqlite3.connect(yabanci)
            c.execute("CREATE TABLE t(x)")
            c.commit()
            c.close()
            e = _hata(lambda: hesap.Depo._kopya_bak(yabanci), 422)
            ok("hesap yedeği değil" in e.mesaj)
            metin = os.path.join(r.klasor, "metin.db")
            with open(metin, "w") as f:
                f.write("merhaba")
            _hata(lambda: hesap.Depo._kopya_bak(metin), 422)
    test("yedek: bozuk ya da hesap olmayan dosya yedek sayilmaz", t_kopya_bak)

    def t_kopya_tetikle():
        with _Depo() as r:
            _admin(r)
            no(r.d.kopya_tetikle())                                       # gecici depo: kendiliginden yedek yok
            r.d.otomatik_kopya = True
            ok(r.d.kopya_tetikle())
            no(r.d.kopya_tetikle())                                       # bakis araligi dolmadan yeniden bakmaz
            for t in threading.enumerate():
                if t.name == "hesap-yedek":
                    t.join(10)
            eq([x["tur"] for x in r.d.kopyalar()], ["gunluk"])
    test("yedek: istek yolunda arkada alinir, en cok on dakikada bir bakilir", t_kopya_tetikle)

    def t_kopya_ikinci():
        with _Depo() as r:
            k, j = _admin(r)
            r.d.kullanici_ekle(k, "anne", "parola-456")
            uye = r.d.oturum(r.d.giris("anne", "parola-456", B, "iPad")["jeton"])
            yer = os.path.join(r.klasor, "usb")
            os.makedirs(yer)
            _hata(lambda: r.d.kopya_ayarla(uye, True, yer), 403)          # uye ayarlayamaz
            _hata(lambda: r.d.kopya_ayarla(k, False, yer), 403)           # ev agindan ayarlanmaz
            _hata(lambda: r.d.kopya_ayarla(k, True, "goreli/yol"), 400)
            _hata(lambda: r.d.kopya_ayarla(k, True, os.path.join(r.klasor, "yok")), 400)
            os.makedirs(r.d.kopya_klasoru(), exist_ok=True)
            _hata(lambda: r.d.kopya_ayarla(k, True, r.d.kopya_klasoru()), 400)   # asil klasorun kendisi
            v = r.d.kopya_ayarla(k, True, yer)
            eq((v["ikinci"]["acik"], v["ikinci"]["hata"], v["ikinci"]["yol"]), (True, "", os.path.abspath(yer)))
            eq(len([a for a in os.listdir(yer) if hesap.IKINCI_RE.match(a)]), 1)   # hemen bir es
            no([a for a in os.listdir(yer) if a.startswith(".lifeos-yazma")])
            with open(os.path.join(yer, "benim.txt"), "w") as f:
                f.write("x")
            for _ in range(9):
                _gun(r)
                r.d.kopya_gunluk()
            eq(len([a for a in os.listdir(yer) if hesap.IKINCI_RE.match(a)]), hesap.IKINCI_SAKLA)
            ok(os.path.isfile(os.path.join(yer, "benim.txt")))            # yalniz kendi dosyalari budanir
            shutil.rmtree(yer)                                            # USB cikti
            _gun(r)
            x = r.d.kopya_gunluk()
            eq(x["ikinci"], False)                                        # yedek yine alindi
            ok(os.path.isfile(os.path.join(r.d.kopya_klasoru(), x["ad"])))
            o = r.d.kopya_ozet(k)
            ok(o["ikinci"] and "İkinci yere yazılamadı" in o["ikinci_hata"])
            eq(set(r.d.kopya_ozet(uye)), {"son", "adet"})                 # uye yalniz zamani gorur
            eq(r.d.kopya_durum(k, False)["ikinci"]["yol"], "")            # yol yalniz bilgisayara
            eq(r.d.kopya_durum(k, False)["klasor"], "")
            _hata(lambda: r.d.kopya_durum(uye, True), 403)
            eq(r.d.kopya_ayarla(k, True, "")["ikinci"]["acik"], False)
    test("yedek: ikinci yer admin ve bilgisayardan; her yedegin esi, son 7; ulasilamazsa soylenir", t_kopya_ikinci)

    def t_geri_yukle():
        with _Depo() as r:
            k, j = _admin(r)
            r.d.esitle(k, "spi/ben", A, 0, [{"y": "v/1", "d": 1, "z": 5}, {"y": "v/2", "d": 2, "z": 5}])
            eski = r.d.anahtar_ac(k, "parola-123", "Eski")
            silinecek = r.d.anahtar_ac(k, "parola-123", "Silinecek")
            r.d.takvim_ac(k)
            donem = r.d.esitle(k, "spi/ben", A, 0, [])["donem"]
            x = r.d.kopya_al("elle")
            r.saat.t += 60
            # Yedekten sonra: kayit degisti, yenisi eklendi, anahtar silindi/acildi, gelen satirlari geldi.
            r.d.esitle(k, "spi/ben", A, 0, [{"y": "v/2", "d": 22, "z": 9}, {"y": "v/3", "d": 3, "z": 9}])
            r.d.anahtar_sil(k, silinecek["id"])
            yeni = r.d.anahtar_ac(k, "parola-123", "Yeni")
            idler = [r.d.gelen_ekle(eski["anahtar"], "su 250")["id"] for _ in range(3)]
            r.d.takvim_ac(k, yenile=True)
            sira = r.d.esitle(k, "spi/ben", A, 0, [])["son"]
            r.d.kullanici_ekle(k, "anne", "parola-456")
            uye_k = r.d.oturum(r.d.giris("anne", "parola-456", B, "iPad")["jeton"])
            _hata(lambda: r.d.geri_yukle(uye_k, True, "parola-456", x["ad"]), 403)
            _hata(lambda: r.d.geri_yukle(k, False, "parola-123", x["ad"]), 403)     # ev agindan olmaz
            _hata(lambda: r.d.geri_yukle(k, True, "yanlis", x["ad"]), 401)
            _hata(lambda: r.d.geri_yukle(k, True, "parola-123", "../hesap.db"), 400)
            _hata(lambda: r.d.geri_yukle(k, True, "parola-123", "hesap-elle-20000101-000000.db"), 404)
            on = r.d.kopya_onizle(k, x["ad"])
            eq((on["yedek"], on["simdi"]), ({"kullanici": 1, "kayit": 2}, {"kullanici": 2, "kayit": 3}))
            v = r.d.geri_yukle(k, True, "parola-123", x["ad"], j)
            eq(v["ok"], True)
            eq(hesap.KOPYA_RE.match(v["once"]).group(1), "once")         # geri donus noktasi
            eq(r.d.oturum(j), None)                                       # butun oturumlar kapandi
            _hata(lambda: r.d.giris("anne", "parola-456", B, "iPad"), 401)   # yedekte yoktu
            j2 = r.d.giris("omer", "parola-123", A, "PC")["jeton"]
            k2 = r.d.oturum(j2)
            c = r.d.esitle(k2, "spi/ben", B, 0, [])
            eq(sorted((a["y"], a["d"]) for a in c["al"]), [("v/1", 1), ("v/2", 2)])
            ok(c["donem"] != donem)                                       # cihazlar bastan esitler
            eq(c["son"] >= sira, True)                                    # sira sayaci geri gitmez
            eq([a["ad"] for a in r.d.anahtarlar(k2)], ["Eski"])           # silinen geri gelmez, yeni yedekte yok
            _hata(lambda: r.d.anahtar_dene(silinecek["anahtar"]), 401)
            _hata(lambda: r.d.anahtar_dene(yeni["anahtar"]), 401)
            eq(r.d.takvim(k2)["acik"], False)                             # adres yenilenmisti: eskisi geri gelmez
            eq(r.d.gelen_ekle(eski["anahtar"], "su 300")["id"], max(idler) + 1)   # numara yeniden verilmez
            ok(any(o["tur"] == "geri-yukle" and "omer" in o["ayrinti"] for o in r.d.etkinlik(k2)))
            eq(r.d.kopya_onizle(k2, v["once"])["yedek"]["kullanici"], 2)  # once-yedegi geri yuklemeden onceki hal
    test("geri yukleme: admin, bilgisayardan, sifreyle; once yedek; oturumlar kapanir, silinen anahtar ve "
         "eski takvim adresi geri gelmez, numara ve sira geri gitmez, donem degisir", t_geri_yukle)

    def t_donem_tazele():
        with _Depo() as r:
            k, j = _admin(r)
            r.d.esitle(k, "spi/ben", A, 0, [{"y": "a", "d": "eski", "z": 100}, {"y": "b", "d": "eski", "z": 100}])
            x = r.d.kopya_al("elle")
            # Telefon (B) yedekten sonra «a»yi degistirdi ve esitledi (son esitlemesi 500).
            r.d.esitle(k, "spi/ben", B, 0, [{"y": "a", "d": "yeni", "z": 400}])
            r.d.geri_yukle(k, True, "parola-123", x["ad"], j)
            k2 = r.d.oturum(r.d.giris("omer", "parola-123", B, "Telefon")["jeton"])
            d1 = r.d.esitle(k2, "spi/ben", B, 0, [])["donem"]
            # Telefon donem degisikligini gorur: kayitlarini son esitleme zamaniyla yollar; hicbir sey inmez.
            c = r.d.esitle(k2, "spi/ben", B, 7, [{"y": "a", "d": "yeni", "z": 500}, {"y": "b", "d": "eski", "z": 500}],
                           yalniz_gonder=True)
            eq((c["al"], c["son"], c["kabul"], c["donem"]), ([], 7, 2, d1))
            # Yedekten once son kez esitlemis bir cihaz (50) eski «a»yi yollarsa kaybeder.
            c = r.d.esitle(k2, "spi/ben", "cihazC-111111", 0, [{"y": "a", "d": "cok-eski", "z": 50}], yalniz_gonder=True)
            eq((c["kabul"], c["red"]), (0, 1))
            c = r.d.esitle(k2, "spi/ben", A, 0, [])
            eq(dict((a["y"], a["d"]) for a in c["al"])["a"], "yeni")      # yedekten sonraki degisiklik geri geldi
    test("geri yuklemeden sonra cihaz kendi kayitlarini yollar: yeni olan kalir, eski cihaz ezemez", t_donem_tazele)

    def t_kopya_komut():
        import contextlib
        import io
        klasor = tempfile.mkdtemp(prefix="lifeos-hesap-")
        eski = os.environ.get("LIFEOS_HESAP_KLASOR")
        os.environ["LIFEOS_HESAP_KLASOR"] = klasor
        try:
            d = hesap.Depo()
            d.kur("omer", "parola-123", True, A, "PC")
            ok(d.otomatik_kopya)                                          # asil depo kendiliginden yedekler
            cikti = io.StringIO()
            with contextlib.redirect_stdout(cikti):
                eq(hesap.main(["hesap.py", "--yedekle"]), 0)
                ad = d.kopyalar()[0]["ad"]
                eq(hesap.main(["hesap.py", "--yedekler"]), 0)
                eq(hesap.main(["hesap.py", "--geri-yukle", ad]), 2)       # once onizleme; --evet ister
                eq(hesap.main(["hesap.py", "--geri-yukle", "yok.db"]), 1)
                usb = os.path.join(klasor, "usb-lifeos-hesap-20270101-120000.db")
                shutil.copyfile(os.path.join(d.kopya_klasoru(), ad), usb)
                eq(hesap.main(["hesap.py", "--geri-yukle", usb, "--evet"]), 0)   # dosya yolundan da (USB)
            ok(ad in cikti.getvalue() and "Geri yüklendi" in cikti.getvalue())
            eq(len([x for x in d.kopyalar() if x["tur"] == "once"]), 1)
            ok(any(o["tur"] == "geri-yukle" and "01.01.2027" in o["ayrinti"]
                   for o in d.etkinlik(d.oturum(d.giris("omer", "parola-123", A, "PC")["jeton"]))))
        finally:
            if eski is None:
                os.environ.pop("LIFEOS_HESAP_KLASOR", None)
            else:
                os.environ["LIFEOS_HESAP_KLASOR"] = eski
            shutil.rmtree(klasor, ignore_errors=True)
    test("yedek komut satirindan: al, listele, onaylatarak geri yukle (USB dosyasindan da)", t_kopya_komut)

    def t_http_yedek():
        with _Srv() as s:
            kod, _, v = s.iste("/api/hesap/kur", {"ad": "omer", "parola": "parola-123", "cihaz": A}, H)
            y = dict(H, Authorization="Bearer " + v["jeton"])
            kod, _, v = s.iste("/api/hesap/ben", baslik=y)
            eq((kod, v["yedek"]["son"], v["yedek"]["hata"]), (200, None, ""))
            kod, _, v = s.iste("/api/hesap/yedekle", {}, y)
            eq((kod, len(v["yedekler"]), v["yerel"]), (200, 1, True))
            ad = v["alinan"]
            ok(v["klasor"])
            eq(s.iste("/api/hesap/yedekler", baslik=y)[2]["yedekler"][0]["ad"], ad)
            ok(s.iste("/api/hesap/ben", baslik=y)[2]["yedek"]["son"])
            kod, _, v = s.iste("/api/hesap/yedek-onizle", {"ad": ad}, y)
            eq((kod, v["yedek"]["kullanici"]), (200, 1))
            kod, _, v = s.iste("/api/hesap/esitle", {"alan": "spi/ben", "cihaz": A, "son": 0, "yalniz_gonder": True,
                                                     "gonder": [{"y": "v", "d": 1, "z": 5}]}, y)
            eq((kod, v["al"], v["kabul"], bool(v["donem"])), (200, [], 1, True))
            eq(s.iste("/api/hesap/geri-yukle", {"ad": ad, "parola": "yanlis"}, y)[0], 401)
            kod, _, v = s.iste("/api/hesap/geri-yukle", {"ad": ad, "parola": "parola-123"}, y)
            eq((kod, v["ok"]), (200, True))
            eq(s.iste("/api/hesap/ben", baslik=y)[0], 401)                # bu oturum da kapandi
            kod, _, v = s.iste("/api/hesap/giris", {"ad": "omer", "parola": "parola-123", "cihaz": A}, H)
            y = dict(H, Authorization="Bearer " + v["jeton"])
            s.iste("/api/hesap/kullanici", {"ad": "anne", "parola": "parola-456"}, y)
            kod, _, v = s.iste("/api/hesap/giris", {"ad": "anne", "parola": "parola-456", "cihaz": B}, H)
            u = dict(H, Authorization="Bearer " + v["jeton"])
            eq(s.iste("/api/hesap/yedekler", baslik=u)[0], 403)
            eq(s.iste("/api/hesap/yedekle", {}, u)[0], 403)
            eq(set(s.iste("/api/hesap/ben", baslik=u)[2]["yedek"]), {"son", "adet"})
            eq(s.iste("/api/hesap/yedekler")[0], 401)
    test("HTTP: yedekler, simdi yedekle, onizleme, yalniz gonder, geri yukleme; uye goremez", t_http_yedek)

    # -------------------------------------- gelen kutusu uc modulde (2026-10-09)

    def t_gelen_uc_modul():
        with _Depo() as r:
            k, j = _admin(r)
            a = r.d.anahtar_ac(k, "parola-123", "Kısayol")["anahtar"]
            s = r.d.gelen_ekle(a, "su 250")                               # modul yazilmazsa SPI (eski kisayollar)
            y = r.d.gelen_ekle(a, "paragraf 20", "ays")
            e = r.d.gelen_ekle(a, "30 dk gitar", "esp")
            ok("SPİ" in s["mesaj"] and "AYS" in y["mesaj"] and "ESP" in e["mesaj"])
            eq([x["metin"] for x in r.d.gelen_al(k, "ays", A)], ["paragraf 20"])   # satiri yalniz kendi modulu alir
            eq([x["metin"] for x in r.d.gelen_al(k, "esp", A)], ["30 dk gitar"])
            eq([x["metin"] for x in r.d.gelen_al(k, "spi", A)], ["su 250"])
            eq({x["modul"] for x in r.d.gelen_liste(k)}, {"ays", "spi", "esp"})
    test("gelen kutusu: AYS ve ESP de satir alir; satiri yalniz kendi modulu alir", t_gelen_uc_modul)

    def t_http_gelen_modul():
        with _Srv() as s:
            kod, _, v = s.iste("/api/hesap/kur", {"ad": "omer", "parola": "parola-123", "cihaz": A}, H)
            y = dict(H, Authorization="Bearer " + v["jeton"])
            a = s.iste("/api/hesap/anahtar", {"parola": "parola-123", "ad": "Kısayol"}, y)[2]["anahtar"]
            b = {"Authorization": "Bearer " + a}
            kod, _, v = s.iste("/api/hesap/gelen", {"metin": "30 dk gitar", "modul": " ESP "}, b)
            eq((kod, v["durum"]), (200, "bekliyor"))
            ok("ESP" in v["mesaj"])
            kod, _, v = s.iste("/api/hesap/gelen", {"metin": "x", "modul": "hkm"}, b)
            eq(kod, 400)
            ok("ays, spi ya da esp" in v["hata"])
            kod, _, v = s.iste("/api/hesap/gelen-al", {"modul": "esp", "cihaz": A}, y)
            eq([x["metin"] for x in v["gelen"]], ["30 dk gitar"])
    test("HTTP: gelen satirinda modul (buyuk harf ve bosluk tolere edilir); bilinmeyen modul 400", t_http_gelen_modul)

    # ------------------------------------------- Siri: bugun ne var? (soz 21)

    def t_ozet():
        with _Depo() as r:
            k, j = _admin(r)
            yaz = r.d.anahtar_ac(k, "parola-123", "Kısayol")["anahtar"]
            oku = r.d.anahtar_ac(k, "parola-123", "Siri", ["kayit", "oku"])
            yalniz_oku = r.d.anahtar_ac(k, "parola-123", "Yalnız okur", "oku")["anahtar"]
            eq(oku["yetki"], "kayit,oku")
            eq([x["yetki"] for x in r.d.anahtarlar(k)], ["kayit", "kayit,oku", "oku"])
            _hata(lambda: r.d.anahtar_ac(k, "parola-123", "x", "hepsi"), 400)
            _hata(lambda: r.d.anahtar_ac(k, "parola-123", "x", []), 400)
            eq(r.d.anahtar_dene(oku["anahtar"])["yetkiler"], ["kayit", "oku"])
            _hata(lambda: r.d.gun_ozeti(yaz), 403)                         # yalniz kayit: ozet okuyamaz
            _hata(lambda: r.d.gelen_ekle(yalniz_oku, "su 250"), 403)        # yalniz oku: satir birakamaz
            _hata(lambda: r.d.gun_ozeti("lifeos_yok"), 401)
            v = r.d.gun_ozeti(oku["anahtar"])
            eq((v["parcalar"], "Henüz özet yok" in v["metin"]), ([], True))
            bugun = time.strftime("%Y-%m-%d", time.localtime(r.saat()))
            dun = time.strftime("%Y-%m-%d", time.localtime(r.saat() - 86400))
            _hata(lambda: r.d.yayinla(k, "spi/bugun", "Toparlanma iyi."), 400)               # gun yok
            _hata(lambda: r.d.yayinla(k, "spi/bugun", "x" * 500, gun=bugun), 400)            # cok uzun
            _hata(lambda: r.d.yayinla(k, "hkm/bugun", "x", gun=bugun), 400)
            r.d.yayinla(k, "esp/bugun", "2 oturum, toplam 45 dk.", gun=bugun)
            r.d.yayinla(k, "spi/bugun", "  Toparlanma   iyi.\n Sıradaki hatırlatma 16:00, su. ", gun=bugun)
            r.d.yayinla(k, "ays/bugun", "3/5 blok bitti; sırada Türev.", gun=dun)
            v = r.d.gun_ozeti(oku["anahtar"])
            eq([p["modul"] for p in v["parcalar"]], ["ays", "spi", "esp"])                   # sabit sira
            eq(v["metin"], "AYS bugün henüz açılmadı; son özet %s. SPİ: Toparlanma iyi. Sıradaki hatırlatma "
                           "16:00, su. ESP: 2 oturum, toplam 45 dk." % dun)
            no("3/5" in v["metin"])                                        # dunku sayi bugunmus gibi okunmaz
            eq([p["bayat"] for p in v["parcalar"]], [True, False, False])
            # Ozet takvime karismaz: takvim listesi ve .ics yalniz takvim yayinlari.
            r.d.yayinla(k, "ays/takvim", "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:x\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n", 1)
            eq([x["ad"] for x in r.d.takvim(k)["yayinlar"]], ["ays/takvim"])
            t = r.d.takvim_ac(k)
            ics = r.d.takvim_ics(t["yol"].split("/")[-1][:-4])
            no("Toparlanma" in ics)
            ok("UID:x" in ics)
    test("Siri ozeti: «oku» yetkili anahtar; moduller sirayla; dunku ozet bugunmus gibi okunmaz; takvime karismaz",
         t_ozet)

    def t_gocur_surum7():
        klasor = tempfile.mkdtemp(prefix="lifeos-hesap-")
        try:
            import sqlite3
            yol = os.path.join(klasor, "hesap.db")
            c = sqlite3.connect(yol)
            c.executescript("CREATE TABLE yayin(kullanici INTEGER NOT NULL, ad TEXT NOT NULL, icerik TEXT NOT NULL, "
                            "adet INTEGER, zaman REAL NOT NULL, PRIMARY KEY(kullanici, ad));"
                            "INSERT INTO yayin VALUES(1, 'ays/takvim', 'BEGIN:VCALENDAR', 1, 1);")
            c.commit()
            c.close()
            d = hesap.Depo(yol, tur=1000)
            with d._islem() as c2:
                ok("gun" in {r["name"] for r in c2.execute("PRAGMA table_info(yayin)")})
                eq(tuple(c2.execute("SELECT ad, gun FROM yayin").fetchone()), ("ays/takvim", None))
        finally:
            shutil.rmtree(klasor, ignore_errors=True)
    test("surum 7 deposu yayinin gunune gocer", t_gocur_surum7)

    def t_http_ozet():
        with _Srv() as s:
            kod, _, v = s.iste("/api/hesap/kur", {"ad": "omer", "parola": "parola-123", "cihaz": A}, H)
            y = dict(H, Authorization="Bearer " + v["jeton"])
            a = s.iste("/api/hesap/anahtar", {"parola": "parola-123", "ad": "Siri", "yetki": ["kayit", "oku"]}, y)[2]["anahtar"]
            bugun = time.strftime("%Y-%m-%d", time.localtime(s.r.saat()))
            kod, _, _ = s.iste("/api/hesap/yayin", {"ad": "spi/bugun", "icerik": "Toparlanma iyi.", "gun": bugun}, y)
            eq(kod, 200)
            q = urllib.request.Request(s.adres + "/api/hesap/ozet.txt", headers={"Authorization": "Bearer " + a})
            with urllib.request.urlopen(q, timeout=10) as c:
                eq((c.status, c.headers.get("Content-Type"), c.read().decode("utf-8")),
                   (200, "text/plain; charset=utf-8", "SPİ: Toparlanma iyi."))
            kod, _, v = s.iste("/api/hesap/ozet", baslik={"Authorization": "Bearer " + a})
            eq((kod, v["parcalar"][0]["bayat"]), (200, False))
            eq(s.iste("/api/hesap/ozet")[0], 401)
            try:
                urllib.request.urlopen(s.adres + "/api/hesap/ozet.txt", timeout=10)
                raise AssertionError("401 bekleniyordu")
            except urllib.error.HTTPError as e:                          # Siri hatayi da cumle olarak okur
                eq((e.code, e.headers.get("Content-Type"), "geçersiz" in e.read().decode("utf-8")),
                   (401, "text/plain; charset=utf-8", True))
            eq(s.iste("/api/hesap/ozet", baslik={"Authorization": "Bearer " + v.get("x", "lifeos_yok")})[0], 401)
    test("HTTP: ozet.txt duz metin (Siri okur); ozet JSON; anahtarsiz 401", t_http_ozet)
