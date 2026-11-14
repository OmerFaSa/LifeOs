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
    os.makedirs(os.path.dirname(os.path.join(d, ad)), exist_ok=True)
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
            eq((s["yeniden_baslat"], s["hkm_degisti"]), (False, False))
            r.yeni("sunucu.py", "print(1)\n", "sunucu")
            s2 = guncelle.uygula(r.kul)
            eq((s2["yeniden_baslat"], s2["hkm_degisti"]), (True, False))  # .py degisti, HKM degil
            r.yeni("HKM/core/x.py", "print(2)\n", "hkm")
            eq(guncelle.uygula(r.kul)["hkm_degisti"], True)
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

    # 2026-11-05: sistem/guncelle.py merge'u 60 sn'de olduruyordu; yarim kalan
    # ileri sarma sonsuza dek «elle değişiklik var» diyor, kalan index.lock
    # Ingilizce git hatasiyla butun guncellemeleri durduruyordu.
    def t_yarim():
        with _Depo() as r:
            _yaz(r.gel, "iki.md", "eski\n")
            _g(r.gel, "add", "-A"); _g(r.gel, "commit", "-m", "x"); _g(r.gel, "push", "origin", "main")
            _g(r.kul, "pull", "--ff-only")
            _yaz(r.gel, "iki.md", "yeni\n"); _yaz(r.gel, "OKU.md", "yeni\n")
            _g(r.gel, "add", "-A"); _g(r.gel, "commit", "-m", "y"); _g(r.gel, "push", "origin", "main")
            _yaz(r.kul, "OKU.md", "yeni\n")                # yalniz biri yazilmis, HEAD eski
            s = guncelle.uygula(r.kul)
            eq(s["durum"], "guncellendi")
            eq((_oku(r.kul, "OKU.md"), _oku(r.kul, "iki.md")), ("yeni\n", "yeni\n"))
            eq(guncelle.durum(r.kul)["geride"], 0)
    test("yarim kalan ileri sarma kendiliginden tamamlanir", t_yarim)

    # 2026-11-06: depoya CRLF'le girmis tek dosya (quiz.js) «elle degisiklik» sanildi, kopya yarim kaldi.
    def t_yarim_crlf():
        with _Depo() as r:
            _g(r.gel, "config", "core.autocrlf", "false")
            _g(r.kul, "config", "core.autocrlf", "true")
            _yaz(r.gel, "iki.md", "eski\n")
            _g(r.gel, "add", "-A"); _g(r.gel, "commit", "-m", "x"); _g(r.gel, "push", "origin", "main")
            _g(r.kul, "pull", "--ff-only")
            for kok in (r.gel, r.kul):                     # gelistiricide commit edilen, kullanicida yarim yazilan
                with open(os.path.join(kok, "iki.md"), "wb") as f:
                    f.write(b"yeni\r\n")
            _g(r.gel, "add", "-A"); _g(r.gel, "commit", "-m", "y"); _g(r.gel, "push", "origin", "main")
            eq(guncelle.uygula(r.kul)["durum"], "guncellendi")
            eq(guncelle.durum(r.kul)["geride"], 0)
    test("CRLF'le depoya girmis dosya yarim kalan sarmayi durdurmaz", t_yarim_crlf)

    # 2026-11-06: merge, kilitli bir dosyayi silemeyip («Invalid argument») yarida kaldi.
    def t_merge_yarida():
        with _Depo() as r:
            r.yeni("OKU.md", "yeni\n", "y")
            def calistir(args, **kw):
                if "merge" in args:                        # bir dosyayi yazip dusen merge
                    _yaz(r.kul, "OKU.md", "yeni\n")
                    return subprocess.CompletedProcess(args, 1, "", "error: unable to unlink old 'x': Invalid argument")
                return subprocess.run(args, **kw)
            eq(guncelle.uygula(r.kul, calistir=calistir)["durum"], "guncellendi")
            eq(guncelle.durum(r.kul)["geride"], 0)
    test("merge kilitli dosyada yarida kalirsa ayni koşuda tamamlanir", t_merge_yarida)

    def t_yarim_elle():
        with _Depo() as r:
            _yaz(r.gel, "iki.md", "eski\n")
            _g(r.gel, "add", "-A"); _g(r.gel, "commit", "-m", "x"); _g(r.gel, "push", "origin", "main")
            _g(r.kul, "pull", "--ff-only")
            _yaz(r.gel, "iki.md", "yeni\n"); _yaz(r.gel, "OKU.md", "yeni\n")
            _g(r.gel, "add", "-A"); _g(r.gel, "commit", "-m", "y"); _g(r.gel, "push", "origin", "main")
            _yaz(r.kul, "OKU.md", "yeni\n")
            _yaz(r.kul, "iki.md", "benim\n")               # biri hedefte, biri elle
            eq(guncelle.uygula(r.kul)["durum"], "engel")
            eq(_oku(r.kul, "iki.md"), "benim\n")
    test("yarim gorunse de elle yazilmis tek dosya varsa dokunmaz", t_yarim_elle)

    def t_kilit():
        import time as _t
        with _Depo() as r:
            r.yeni("OKU.md", "iki\n", "x")
            kilit = os.path.join(r.kul, ".git", "index.lock")
            open(kilit, "w").close()
            s = guncelle.uygula(r.kul)                     # taze kilit: sahibi olabilir
            eq(s["durum"], "hata")
            ok("başka bir güncelleme" in s["mesaj"], s["mesaj"])
            ok(os.path.exists(kilit))
            eski = _t.time() - guncelle.SARMA_SN - 5
            os.utime(kilit, (eski, eski))
            eq(guncelle.uygula(r.kul)["durum"], "guncellendi")
            no(os.path.exists(kilit))
    test("sahipsiz git kilidi temizlenir, taze kilide dokunulmaz", t_kilit)

    def t_yavas():
        with _Depo() as r:
            r.yeni("OKU.md", "iki\n", "x")
            sureler = []

            def yavas(arg, **kw):
                if arg[1] == "fetch":
                    sureler.append(kw.get("timeout"))
                    raise subprocess.TimeoutExpired(arg, kw.get("timeout"))
                return subprocess.run(arg, **kw)
            s = guncelle.uygula(r.kul, calistir=yavas)
            eq(s["durum"], "engel")
            ok("yavaş" in s["mesaj"], s["mesaj"])          # «internet yok» demez
            eq(sureler, [guncelle.INDIRME_SN])
            eq(guncelle.durum(r.kul, calistir=yavas)["asim"], True)
            eq(sureler[-1], guncelle.BAKIS_SN)             # bakis sayfayi bekletmez
    test("yavas indirme «internet yok» denmez; kurarken uzun sure verilir", t_yavas)

    def t_kabuk():
        d = tempfile.mkdtemp(prefix="lifeos-kabuk-")
        try:
            kok, hedef = os.path.join(d, "depo"), os.path.join(d, "app")
            _yaz(kok, "uygulama/masaustu/main.js", "yeni\n")
            _yaz(hedef, "main.js", "eski\n")
            _yaz(hedef, "icon.ico", "dokunma\n")
            eq(guncelle.kabuk_tazele(kok, hedef), ["main.js"])
            eq((_oku(hedef, "main.js"), _oku(hedef, "icon.ico")), ("yeni\n", "dokunma\n"))
            eq(guncelle.kabuk_tazele(kok, hedef), [])      # ayniysa yazmaz
            eq(guncelle.kabuk_tazele(kok), [])             # calisan kopya degil: kurulu uygulamaya dokunmaz
            eq(guncelle.kabuk_tazele(kok, os.path.join(d, "yok")), [])   # uygulama kurulu degil
        finally:
            shutil.rmtree(d, ignore_errors=True)
    test("masaustu kabugu guncelleme ile gelir; gelistirme deposu kurulu uygulamaya dokunmaz", t_kabuk)

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

    def t_git_okunamaz():
        """.git varken git klasoru okuyamazsa «zip ile indirilmiş» denmez, gercek hata soylenir."""
        with _Depo() as r:
            def calistir(args, **kw):
                eq(kw.get("stdin"), subprocess.DEVNULL)
                if "--show-toplevel" in args:
                    return subprocess.CompletedProcess(args, 128, "", "fatal: detected dubious ownership")
                return subprocess.run(args, **kw)
            d = guncelle.durum(r.kul, calistir, getir=False)
            eq(d["durum"], "hata")
            ok("dubious" in d["mesaj"])
            def uyarili(args, **kw):
                p = subprocess.run(args, **kw)
                return subprocess.CompletedProcess(args, p.returncode, p.stdout + "warning: x\n", p.stderr) if "--show-toplevel" in args else p
            eq(guncelle.durum(r.kul, uyarili, getir=False)["durum"], "ok")
    test("git deposu okunamazsa zip denmez, hata soylenir", t_git_okunamaz)

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
        # Gun plani F2: seridin ortasi Gun (kubbe); HKM «M · Merkez» ucu, logosuz.
        ok('class="sekil sekil--gun"' in h and 'href="/kabuk/"' in h)   # ortadaki kart yeni kabuk
        for a in ("ays", "spi", "esp"):
            no('data-modul="%s"' % a in h, a)                                # modul kartlari kapanista kalkti
        ok('id="guncel"' in h and 'id="surum"' in h)
        for y in ("__KARTLAR__", "__SURUM__", "__IKON__"):
            ok(y not in h)                              # yer tutucu kalmadi
        no('data-hkm="1"' in h)                         # HKM'nin arayuzu kalkti (Gun plani)
        ok("Yedekle ve güncelle" in h and "yedekle=1" in h)   # ayrismis kopyanin cikisi
        # 2026-10-27 sadelik: gelistirici metni yok (durdurma komutu, commit kodu);
        # guncel sistemde kutu surum etiketine katlanir, etiket yeniden kontrol eder.
        no("baslat.py --dur" in h)
        s = sunucu.guncelle.surum()
        if s:
            no(s["kisa"] in h[h.index('id="surum"'):h.index('id="surum"') + 200], "surumde commit kodu")
        ok("kutuAc(false)" in h and "surumEt.addEventListener('click'" in h)
        # 2026-10-29 (kullanicinin cizimi): ustte kavisli serit G · HKM · S; kutu G ile
        # acilir (bastan kapali); moduller ESP · SPI · AYS sirasiyla dikey kart.
        yay = h[h.index('<nav class="yay"'):h.index("</nav>", h.index('<nav class="yay"'))]
        ok(yay.index('id="yay-g"') < yay.index('data-modul="kabuk"') < yay.index('id="surum"'))
        ok('aria-controls="guncel"' in yay)
        ok('<section class="guncel" id="guncel"' in h and 'style="--sira:1" hidden>' in h)
    test("giris sayfasi: yeni kabuk karti, surum ve guncelleme kutusu; modul karti yok", t_sayfa)

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

    # 2026-11-05 (hesap.py soz 28): telefondan ya da tabletten PC'yi guncelleme.
    def t_sistem_baslat():
        import threading as _th
        import time as _t

        def bekle():
            for _ in range(200):
                if not sunucu._SISTEM_IS["calisiyor"]:
                    return
                _t.sleep(0.01)
            raise AssertionError("is bitmedi")
        sunucu._SISTEM_IS.update(calisiyor=False, sonuc=None)
        kapi, yeniden, kuruldu = _th.Event(), [], []

        def kur():
            kuruldu.append(1)
            kapi.wait(5)
            return {"durum": "guncellendi", "mesaj": "m", "yeniden_baslat": True}

        def patlar(*a, **k):
            raise AssertionError("kurulum surerken git'e bakilmamali")
        eq(sunucu.sistem_baslat(kur, lambda: yeniden.append(1)), {"calisiyor": True})
        eq(sunucu.sistem_baslat(kur, lambda: yeniden.append(1)), {"calisiyor": True})   # ikincisi baslamaz
        eq(sunucu.sistem_durum(True, durum=patlar)["calisiyor"], True)
        kapi.set()
        bekle()
        eq(kuruldu, [1])
        eq(yeniden, [1])
        eq(sunucu._SISTEM_IS["sonuc"], {"durum": "guncellendi", "mesaj": "m"})
        for dondu, baslar in (({"durum": "guncel", "mesaj": "x"}, False),
                              ({"durum": "guncellendi", "mesaj": "x", "yeniden_baslat": False}, False),
                              ({"durum": "engel", "mesaj": "elle"}, False)):
            del yeniden[:]
            sunucu.sistem_baslat(lambda: dondu, lambda: yeniden.append(1))
            bekle()
            eq(bool(yeniden), baslar)

        def hata():
            raise ValueError("bozuk")
        sunucu.sistem_baslat(hata, lambda: yeniden.append(1))
        bekle()
        eq(sunucu._SISTEM_IS["sonuc"]["durum"], "hata")
        ayrismis = {"durum": "ok", "dal": "main", "geride": 2, "ileride": 1, "kirli": [], "yeni": ["a"], "ag": True}
        d = sunucu.sistem_durum(True, durum=lambda: ayrismis)
        eq((d["geride"], d["yeni"]), (2, ["a"]))
        ok("Yedekle ve güncelle" in d["engel"], d["engel"])
        eq(sunucu.sistem_durum(True, durum=lambda: dict(ayrismis, ileride=0))["engel"], "")
        ok("deneme" in sunucu.sistem_durum(True, durum=lambda: dict(ayrismis, ileride=0, dal="deneme"))["engel"])
        sunucu._SISTEM_IS.update(calisiyor=False, sonuc=None)
        sunucu.guncelleme_durumu(True, durum=lambda: {"durum": "ok"})
        sunucu._GUNCEL.update(zaman=0.0, veri=None)
    test("baska cihazdan guncelleme: arkada yurur, ikincisi baslamaz, yalniz gerekirse yeniden baslar", t_sistem_baslat)

    def t_kendiliginden_yeniden():
        """Hata (2026-10-29, sahada): guncelleme sunucu dosyasini degistirdi ama
        «Yeniden baslat»a basilmadi; sunucu yarim gun eski kodla calisti (kok hala
        230 istekle aciliyordu). Sunucu dosyasi degistiyse sayfa kendisi yeniden baslatir."""
        pc = sunucu.giris_html()
        ok("if(s.yeniden_baslat){" in pc)
        ok("return yeniden();" in pc)
        no("s.yeniden_baslat ? ana('Yeniden başlat', yeniden)" in pc)
    test("guncelleme sunucu dosyasini degistirdiyse yeniden baslatma kendiliginden", t_kendiliginden_yeniden)

    def t_uclar():
        srv = _Srv(("127.0.0.1", 0), sunucu.Giris)
        _th.Thread(target=srv.serve_forever, daemon=True).start()
        kok_ = "http://127.0.0.1:%d" % srv.server_address[1]
        eski_hkm, eski_yeni = sunucu.hkm_ac, sunucu.yeniden_baslat_zamanla
        cagri = []
        sunucu.hkm_ac = lambda: cagri.append("hkm") or {"ok": True, "adres": "x"}
        sunucu.yeniden_baslat_zamanla = lambda: cagri.append("yeniden")
        try:
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
    test("HKM ve yeniden baslat izinsiz 403", t_uclar)

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
