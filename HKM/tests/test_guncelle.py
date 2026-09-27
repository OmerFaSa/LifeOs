# -*- coding: utf-8 -*-
"""Guncelleme (sistem/guncelle.py) — main'den ileri sarma.

Korunan sozler: yalniz ileri sarar; elle degistirilmis dosyanin ustune
yazmaz; baska daldayken ya da ayrismisken dokunmaz; git yoksa ya da
klasor git degilse ne oldugunu soyler. Olcum GERCEK git ile, gecici
depolarda yapilir: sahte bir git, ileri sarmanin kendisini olcmezdi.
"""

import os
import shutil
import subprocess
import sys
import tempfile

KOK = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if os.path.join(KOK, "sistem") not in sys.path:
    sys.path.append(os.path.join(KOK, "sistem"))   # sona: HKM/baslat.py sistem/baslat.py ile ezilmesin
sys.dont_write_bytecode = True

import guncelle  # noqa: E402
from tests.harness import eq, ok, suite, test  # noqa: E402


def _g(d, *args):
    subprocess.run(["git"] + list(args), cwd=d, check=True, capture_output=True)


def _yaz(d, ad, metin):
    with open(os.path.join(d, ad), "w", encoding="utf-8") as f:
        f.write(metin)


class _Depo:
    """uzak (bare) + gelistirici klonu + kullanici klonu."""

    def __enter__(self):
        self.kok = tempfile.mkdtemp(prefix="lifeos-guncelle-")
        self.uzak = os.path.join(self.kok, "uzak.git")
        self.gel = os.path.join(self.kok, "gel")
        self.kul = os.path.join(self.kok, "kul")
        _g(self.kok, "init", "--bare", "-b", "main", self.uzak)
        _g(self.kok, "clone", self.uzak, self.gel)
        for d in (self.gel,):
            _g(d, "config", "user.email", "t@t"); _g(d, "config", "user.name", "t")
            _g(d, "checkout", "-B", "main")
        _yaz(self.gel, "OKU.md", "bir\n")
        _g(self.gel, "add", "-A"); _g(self.gel, "commit", "-m", "ilk")
        _g(self.gel, "push", "-u", "origin", "main")
        _g(self.kok, "clone", self.uzak, self.kul)
        _g(self.kul, "config", "user.email", "k@k"); _g(self.kul, "config", "user.name", "k")
        return self

    def yeni(self, ad, metin, mesaj):
        _yaz(self.gel, ad, metin)
        _g(self.gel, "add", "-A"); _g(self.gel, "commit", "-m", mesaj)
        _g(self.gel, "push", "origin", "main")

    def __exit__(self, *a):
        shutil.rmtree(self.kok, ignore_errors=True)


def _oku(d, ad):
    with open(os.path.join(d, ad), encoding="utf-8") as f:
        return f.read()


def run():
    suite("guncelleme (main)")
    if shutil.which("git") is None:
        test("git yok — guncelleme testleri atlandi", lambda: None)
        return

    def t_guncel():
        with _Depo() as r:
            s = guncelle.uygula(r.kul)
            eq(s["durum"], "guncel")
    test("yenilik yoksa «zaten güncel» der, hicbir sey degismez", t_guncel)

    def t_ileri_sarar():
        with _Depo() as r:
            r.yeni("OKU.md", "iki\n", "belge tazelendi")
            d = guncelle.durum(r.kul)
            eq(d["geride"], 1)
            eq(d["yeni"], ["belge tazelendi"])
            eq(_oku(r.kul, "OKU.md"), "bir\n")            # durum() dokunmaz
            s = guncelle.uygula(r.kul)
            eq(s["durum"], "guncellendi")
            eq(_oku(r.kul, "OKU.md"), "iki\n")
            eq(s["yeniden_baslat"], False)
            r.yeni("sunucu.py", "print(1)\n", "sunucu")
            eq(guncelle.uygula(r.kul)["yeniden_baslat"], True)  # .py degisti
    test("yenilik varsa ileri sarar; .py degisirse yeniden baslat der", t_ileri_sarar)

    def t_kirli():
        with _Depo() as r:
            r.yeni("OKU.md", "iki\n", "x")
            _yaz(r.kul, "OKU.md", "elle\n")
            s = guncelle.uygula(r.kul)
            eq(s["durum"], "engel")
            ok("OKU.md" in s["mesaj"])
            eq(_oku(r.kul, "OKU.md"), "elle\n")            # ustune yazilmadi
    test("elle degistirilmis dosya varsa guncellemez ve adini soyler", t_kirli)

    def t_izlenmeyen():
        with _Depo() as r:
            r.yeni("OKU.md", "iki\n", "x")
            _yaz(r.kul, "sunucu.log", "gunluk\n")          # git disi dosya engel degil
            _yaz(r.kul, "veri.json", "{}\n")
            os.mkdir(os.path.join(r.kul, "__pycache__"))
            eq(guncelle.uygula(r.kul)["durum"], "guncellendi")
            # eski surumun kokte biraktigi artiklar temizlenir; baska hicbir sey silinmez
            eq(os.path.exists(os.path.join(r.kul, "sunucu.log")), False)
            eq(os.path.exists(os.path.join(r.kul, "__pycache__")), False)
            eq(_oku(r.kul, "veri.json"), "{}\n")
    test("izlenmeyen dosyalar guncellemeyi engellemez; kokteki eski artiklar temizlenir", t_izlenmeyen)

    def t_dal():
        with _Depo() as r:
            r.yeni("OKU.md", "iki\n", "x")
            _g(r.kul, "checkout", "-b", "deneme")
            s = guncelle.uygula(r.kul)
            eq(s["durum"], "engel")
            ok("deneme" in s["mesaj"])
            eq(_oku(r.kul, "OKU.md"), "bir\n")
    test("main disinda bir daldaysa dokunmaz", t_dal)

    def t_ayrismis():
        with _Depo() as r:
            r.yeni("OKU.md", "iki\n", "uzakta")
            _yaz(r.kul, "yerel.md", "y\n")
            _g(r.kul, "add", "-A"); _g(r.kul, "commit", "-m", "yerelde")
            s = guncelle.uygula(r.kul)
            eq(s["durum"], "engel")
            eq(_oku(r.kul, "OKU.md"), "bir\n")
    test("yerel dal ayrismissa birlestirmez", t_ayrismis)

    def t_git_degil():
        d = tempfile.mkdtemp(prefix="lifeos-zip-")
        try:
            eq(guncelle.durum(d)["durum"], "git-degil")
        finally:
            shutil.rmtree(d, ignore_errors=True)
    test("zip ile indirilmis klasorde ne oldugunu soyler", t_git_degil)

    def t_git_yok():
        def yok(*a, **k):
            raise FileNotFoundError("git")
        s = guncelle.uygula(KOK, calistir=yok)
        eq(s["durum"], "git-yok")
        ok("git" in s["mesaj"])
    test("git kurulu degilse ne yapilacagini soyler", t_git_yok)

    # ---- giris sayfasi (sistem/sunucu.py) ----
    import json as _json
    import threading as _th
    import urllib.request as _ur
    import urllib.error as _ue
    from http.server import ThreadingHTTPServer as _Srv
    import sunucu  # noqa: E402

    def t_izin():
        no_ = lambda v: eq(bool(v), False)
        no_(sunucu.guncelleme_izinli({}))                                   # basliksiz
        no_(sunucu.guncelleme_izinli({"X-LifeOS": "guncelle",
                                      "Origin": "https://kotu.example"}))   # baska site
        ok(sunucu.guncelleme_izinli({"X-LifeOS": "guncelle",
                                     "Origin": "http://127.0.0.1:4180"}))
    test("guncelle POST'u yalniz giris sayfasindan kabul edilir", t_izin)

    def t_sakla():
        sayac = []
        def sahte():
            sayac.append(1)
            return {"durum": "ok", "geride": 0}
        eski = dict(sunucu._GUNCEL)
        try:
            sunucu._GUNCEL.update(zaman=0.0, veri=None)
            sunucu.guncelleme_durumu(durum=sahte)
            sunucu.guncelleme_durumu(durum=sahte)
            eq(len(sayac), 1)                                   # ikinci acilis aga cikmaz
            sunucu.guncelleme_durumu(taze=True, durum=sahte)
            eq(len(sayac), 2)
        finally:
            sunucu._GUNCEL.update(eski)
    test("guncelleme durumu kisa sure saklanir; taze=1 yeniden bakar", t_sakla)

    def t_http():
        cagri = []
        eski = sunucu.guncelle.uygula
        sunucu.guncelle.uygula = lambda: cagri.append(1) or {"durum": "guncel", "mesaj": "Sistem zaten güncel."}
        srv = _Srv(("127.0.0.1", 0), sunucu.Giris)
        _th.Thread(target=srv.serve_forever, daemon=True).start()
        adres = "http://127.0.0.1:%d/api/guncelle" % srv.server_address[1]
        try:
            try:
                _ur.urlopen(_ur.Request(adres, data=b"", method="POST"), timeout=5)
                ok(False)
            except _ue.HTTPError as e:
                eq(e.code, 403)
            eq(len(cagri), 0)                                   # izinsiz istek uygulamaz
            r = _ur.urlopen(_ur.Request(adres, data=b"", method="POST",
                                        headers={"X-LifeOS": "guncelle"}), timeout=5)
            eq(_json.loads(r.read().decode("utf-8"))["durum"], "guncel")
            eq(len(cagri), 1)
        finally:
            srv.shutdown(); srv.server_close()
            sunucu.guncelle.uygula = eski
    test("giris sayfasi: izinsiz POST 403, izinli POST guncellemeyi cagirir", t_http)
