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
