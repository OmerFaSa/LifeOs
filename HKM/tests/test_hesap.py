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
