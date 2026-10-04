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
from tests.harness import eq, no, ok, suite, test  # noqa: E402


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

    # 2026-10-04: masaustu uygulamasinin kopyasi (LifeOS-Sistem) 4 yerel
    # kayitla ayrismisti; «Güncelle» bir hafta boyunca hep «ileri sarmak
    # mumkun degil» dedi, PC eski surumde kaldi. Cikis yolu kullanicinin
    # ACIK istegiyle: yerel kayitlar bir yedek dala, main en yeni surume.
    def t_ayrismis_yedekle():
        with _Depo() as r:
            r.yeni("OKU.md", "iki\n", "uzakta")
            _yaz(r.kul, "yerel.md", "y\n")
            _g(r.kul, "add", "-A"); _g(r.kul, "commit", "-m", "yerelde")
            _yaz(r.kul, "veri.json", "{}")                      # izlenmeyen kullanici verisi
            eski = subprocess.run(["git", "rev-parse", "HEAD"], cwd=r.kul,
                                  capture_output=True, text=True).stdout.strip()
            d = guncelle.durum(r.kul)
            eq(d["ileride"], 1)
            ok(d["yedeklenebilir"])
            s = guncelle.uygula(r.kul)
            eq(s["durum"], "engel")
            ok(s["yedeklenebilir"])
            s = guncelle.uygula(r.kul, yedekle=True)
            eq(s["durum"], "guncellendi")
            eq(_oku(r.kul, "OKU.md"), "iki\n")
            no(os.path.exists(os.path.join(r.kul, "yerel.md")))
            eq(_oku(r.kul, "veri.json"), "{}")
            dal = s["yedek_dal"]
            ok(dal.startswith("yedek/yerel-"))
            eq(subprocess.run(["git", "rev-parse", dal], cwd=r.kul,
                              capture_output=True, text=True).stdout.strip(), eski)
            eq(guncelle.durum(r.kul)["ileride"], 0)
    test("ayrismis dal yalniz istenince yedek dala alinir ve guncellenir", t_ayrismis_yedekle)

    def t_ayrismis_yedekle_kirli():
        with _Depo() as r:
            r.yeni("OKU.md", "iki\n", "uzakta")
            _yaz(r.kul, "yerel.md", "y\n")
            _g(r.kul, "add", "-A"); _g(r.kul, "commit", "-m", "yerelde")
            _yaz(r.kul, "OKU.md", "elle\n")
            s = guncelle.uygula(r.kul, yedekle=True)
            eq(s["durum"], "engel")
            eq(_oku(r.kul, "OKU.md"), "elle\n")
            no(subprocess.run(["git", "branch", "--list", "yedek/*"], cwd=r.kul,
                              capture_output=True, text=True).stdout.strip())
    test("yedekle istense de elle degistirilmis dosyanin ustune yazilmaz", t_ayrismis_yedekle_kirli)

    def t_git_degil():
        d = tempfile.mkdtemp(prefix="lifeos-zip-")
        try:
            eq(guncelle.durum(d)["durum"], "git-degil")
        finally:
            shutil.rmtree(d, ignore_errors=True)
    test("zip ile indirilmis klasorde ne oldugunu soyler", t_git_degil)

    def t_zip_baglanir():
        """Kullanicinin klasoru zip'ten: .git yok. «Güncelle» onu uzaga
        baglar ve en yeni surumu kurar. Veri (git disi, .gitignore'da)
        korunur; eski surumun kokte biraktigi bilinen dosyalar kalkar;
        bilinmeyen bir dosyaya DOKUNULMAZ."""
        with _Depo() as r:
            _yaz(r.gel, ".gitignore", "db/\n")
            os.makedirs(os.path.join(r.gel, "sistem"))
            _yaz(r.gel, "sistem/baslat.py", "yeni\n")
            _g(r.gel, "add", "-A"); _g(r.gel, "commit", "-m", "yeni duzen")
            _g(r.gel, "push", "origin", "main")
            z = os.path.join(r.kok, "zip")
            os.makedirs(os.path.join(z, "db"))
            _yaz(z, "OKU.md", "eski\n")                   # eski surum
            _yaz(z, "baslat.py", "eski kok\n")            # eski duzenin kok dosyasi
            os.makedirs(os.path.join(z, "ekip"))
            _yaz(z, "ekip/PLAN.md", "eski\n")
            _yaz(z, "db/veri.db", "KULLANICI VERISI\n")   # veri
            _yaz(z, "benim-notum.txt", "kisisel\n")       # bilinmeyen dosya
            d = guncelle.durum(z)
            eq(d["durum"], "git-degil")
            eq(d.get("baglanabilir"), True)
            s = guncelle.uygula(z, uzak_url=r.uzak)
            eq(s["durum"], "guncellendi")
            eq(s["yeniden_baslat"], True)
            eq(_oku(z, "OKU.md"), "bir\n")                # en yeni surum
            eq(_oku(z, "sistem/baslat.py"), "yeni\n")
            eq(_oku(z, "db/veri.db"), "KULLANICI VERISI\n")
            eq(_oku(z, "benim-notum.txt"), "kisisel\n")
            eq(os.path.exists(os.path.join(z, "baslat.py")), False)
            eq(os.path.exists(os.path.join(z, "ekip")), False)
            # artik git: sonraki guncelleme normal yoldan
            eq(guncelle.durum(z)["durum"], "ok")
            r.yeni("OKU.md", "uc\n", "sonraki")
            eq(guncelle.uygula(z)["durum"], "guncellendi")
            eq(_oku(z, "OKU.md"), "uc\n")
    test("zip klasoru GitHub'a baglanir: en yeni surum kurulur, veri korunur", t_zip_baglanir)

    def t_zip_ag_yok():
        """Uzaga ulasilamazsa klasor ESKI HALINE doner: yarim kalmis bir
        .git birakmak, bir sonraki denemeyi bozar."""
        z = tempfile.mkdtemp(prefix="lifeos-zip-")
        try:
            _yaz(z, "OKU.md", "eski\n")
            s = guncelle.uygula(z, uzak_url=os.path.join(z, "yok.git"))
            eq(s["durum"], "engel")
            eq(os.path.exists(os.path.join(z, ".git")), False)
            eq(_oku(z, "OKU.md"), "eski\n")
        finally:
            shutil.rmtree(z, ignore_errors=True)
    test("zip klasoru: ag yoksa hicbir sey degismez", t_zip_ag_yok)

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
        sunucu.guncelle.uygula = lambda **k: cagri.append(k) or {"durum": "guncel", "mesaj": "Sistem zaten güncel."}
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
            eq(bool(cagri[0].get("yedekle")), False)            # yedekleme yalniz acik istekle
            _ur.urlopen(_ur.Request(adres + "?yedekle=1", data=b"", method="POST",
                                    headers={"X-LifeOS": "guncelle"}), timeout=5)
            eq(cagri[1].get("yedekle"), True)
        finally:
            srv.shutdown(); srv.server_close()
            sunucu.guncelle.uygula = eski
    test("giris sayfasi: izinsiz POST 403, izinli POST guncellemeyi cagirir", t_http)

    def t_sayfa():
        """Giris sayfasi: dort sistemin KENDI logosu, surum, guncelleme kutusu."""
        h = sunucu.giris_html()
        for a in ("ays", "spi", "esp", "hkm"):
            ok('src="/logo/%s.png"' % a in h)
        ok('id="guncel"' in h and 'id="surum"' in h)
        for y in ("__KARTLAR__", "__SURUM__", "__IKON__"):
            ok(y not in h)                              # yer tutucu kalmadi
        ok('data-hkm="1"' in h)
        ok("Yedekle ve güncelle" in h and "yedekle=1" in h)   # ayrismis kopyanin cikisi
    test("giris sayfasi dort logoyu, surumu ve guncelleme kutusunu tasir", t_sayfa)

    # 2026-10-04: «Yedekle ve güncelle» metnindeki kesme isareti Python
    # kaynaginda yanlis kacislandi (GitHub'da) ve sayfanin TEK betigi
    # sozdizimi hatasiyla dustu: guncelleme kutusu, modul durumlari ve HKM
    # karti olu kaldi. Metne bakan testler bunu gormedi; betik derlenir.
    def t_sayfa_betigi():
        import re as _re
        import shutil as _sh
        node = _sh.which("node")
        if not node:
            return
        for h in (sunucu.giris_html(), sunucu.giris_html(telefon=True)):
            for b in _re.findall(r"<script>(.*?)</script>", h, _re.S):
                d = tempfile.mkdtemp(prefix="lifeos-betik-")
                try:
                    yol = os.path.join(d, "b.js")
                    with open(yol, "w", encoding="utf-8") as f:
                        f.write(b)
                    r = subprocess.run([node, "--check", yol], capture_output=True, text=True)
                    eq(r.returncode, 0, (r.stderr or "")[-300:])
                finally:
                    shutil.rmtree(d, ignore_errors=True)
    test("giris sayfasinin betigi gecerli JavaScript (node --check)", t_sayfa_betigi)

    def t_telefon_sayfa():
        """Telefon uygulamasinin giris sayfasi (uygulama/ios, 2026-10-04): ayni
        sayfa ve ayni kartlar; telefonda olmayan HKM, guncelleme ve bilgisayarin
        API'leri yok. Kullanici: «normal modul secme kismi ile gelse».
        """
        h = sunucu.giris_html(telefon=True)
        for a, port in (("ays", 4173), ("spi", 4183), ("esp", 4193)):
            ok('src="/logo/%s.png"' % a in h, a)
            ok('href="http://127.0.0.1:%d/"' % port in h, a)
        no(any(x in h for x in ('/logo/hkm.png', 'data-hkm', 'id="guncel"', "<script>", "/api/")),
           "telefonda HKM, guncelleme ve bilgisayarin betigi yok")
        eq(h.count("<script"), 1)                         # yalniz giris ekrani (hesap.js)
        ok('<script src="/hesap.js" data-giris></script>' in h)
        for y in ("__KARTLAR__", "__SURUM__", "__IKON__"):
            no(y in h)
        bas = sunucu.giris_html()
        stil = lambda s: s[s.index("<style>"):s.index("</style>")]
        eq(stil(h), stil(bas))                          # tasarim tek kaynaktan
        for _, kisa, ad, aciklama, _ in sunucu.KARTLAR[:3]:
            ok(sunucu._kac(ad) in h and sunucu._kac(aciklama) in h, kisa)
        ok("telefonda" in h)
    test("telefon giris sayfasi: uc modul karti, HKM/guncelleme/betik yok, tasarim ayni", t_telefon_sayfa)

    def t_uclar():
        srv = _Srv(("127.0.0.1", 0), sunucu.Giris)
        _th.Thread(target=srv.serve_forever, daemon=True).start()
        kok_ = "http://127.0.0.1:%d" % srv.server_address[1]
        eski_hkm, eski_yeni = sunucu.hkm_ac, sunucu.yeniden_baslat_zamanla
        cagri = []
        sunucu.hkm_ac = lambda: cagri.append("hkm") or {"ok": True, "adres": "x"}
        sunucu.yeniden_baslat_zamanla = lambda: cagri.append("yeniden")
        try:
            r = _ur.urlopen(kok_ + "/logo/ays.png", timeout=5)
            eq(r.headers.get("Content-Type"), "image/png")
            for kotu in ("/logo/../README.md", "/logo/x.png", "/logo/ays.svg"):
                try:
                    _ur.urlopen(kok_ + kotu, timeout=5); ok(False)
                except _ue.HTTPError as e:
                    eq(e.code, 404)
            for yol in ("/api/hkm", "/api/yeniden"):
                try:
                    _ur.urlopen(_ur.Request(kok_ + yol, data=b"", method="POST"), timeout=5); ok(False)
                except _ue.HTTPError as e:
                    eq(e.code, 403)
            eq(cagri, [])                               # izinsiz istek hicbir sey baslatmaz
            for yol in ("/api/hkm", "/api/yeniden"):
                _ur.urlopen(_ur.Request(kok_ + yol, data=b"", method="POST",
                                        headers={"X-LifeOS": "guncelle"}), timeout=5)
            eq(cagri, ["hkm", "yeniden"])
            d = _json.loads(_ur.urlopen(kok_ + "/api/durum", timeout=5).read().decode("utf-8"))
            ok("hkm" in d)
        finally:
            srv.shutdown(); srv.server_close()
            sunucu.hkm_ac, sunucu.yeniden_baslat_zamanla = eski_hkm, eski_yeni
    test("logo yalniz kapali listeden; HKM ve yeniden baslat izinsiz 403", t_uclar)

    def t_yeniden_windows():
        """Windows'ta yeniden baslatici `start` ile acilir: sunucunun agacinda
        olursa --dur (taskkill /T) onu da oldururdu."""
        g = []
        sunucu.yeniden_baslat_zamanla(popen=lambda a, **k: g.append((a, k)), isletim="nt")
        a, k = g[0]
        eq(a[:5], ["cmd", "/c", "start", "", "/b"])
        ok(a[-2:] == ["--yeniden", "--tarayicisiz"])
        ok(a[-3].endswith(os.path.join("sistem", "baslat.py")))
        g.clear()
        sunucu.yeniden_baslat_zamanla(popen=lambda a, **k: g.append((a, k)), isletim="posix")
        eq(g[0][1].get("start_new_session"), True)
    test("yeniden baslatici sunucunun surec agacinin disinda acilir", t_yeniden_windows)
