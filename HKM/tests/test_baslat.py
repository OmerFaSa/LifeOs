# -*- coding: utf-8 -*-
"""Tek tik — HKM'nin ON KAPISI.

Bu paket bir kolayligi degil bir SOZU korur: baslatici var olan kurulumu
ezmez, ayakta olan bir daemon'u ikilemez ve jetonu hicbir yere yazmaz.

Gercek bir daemon burada baslatilmaz: surec baslatan bir birim testi,
olcmedigi bir seye (port, zamanlama, isletim sistemi) bagli olur. Baslatma
yolu `tools/entegre.js` ve elle denenmistir; burada olculen sey KARARLARDIR.
"""

import json
import os
import tempfile

import baslat
import kur
from tests.harness import eq, no, ok, suite, test


def run():
    suite("tek tik")

    def t_config_is_not_overwritten():
        """Kurulum betiginin en pahali hatasi, calisan bir kurulumu sessizce
        sifirlamaktir: jeton degisirse uc arayuz de birden kopar."""
        with tempfile.TemporaryDirectory() as d:
            yol = os.path.join(d, "config.json")
            with open(yol, "w", encoding="utf-8") as f:
                json.dump({"port": 4271, "local_token": "elle-yazilmis-jeton",
                           "thresholds": {"bio": {"sleep_hours_min": 6}}}, f)
            eski_cfg, eski_db = kur.CONFIG, None
            try:
                kur.CONFIG = yol
                cfg = kur.kur(yaz=True, yol_goster=False)
            finally:
                kur.CONFIG = eski_cfg
            eq(cfg["local_token"], "elle-yazilmis-jeton")
            eq(cfg["port"], 4271)
            eq(cfg["thresholds"]["bio"]["sleep_hours_min"], 6)
            # Eksik alanlar tamamlanir ama var olanlar KAZANIR.
            ok("channels" in cfg)
            with open(yol, encoding="utf-8") as f:
                eq(json.load(f)["local_token"], "elle-yazilmis-jeton")
        _ = eski_db
    test("var olan yapilandirma ezilmez", t_config_is_not_overwritten)

    def t_token_never_printed(capsys=None):
        """Ekrana basilan bir jeton, terminal gecmisinde ve omuz ustunde
        kalir. Uretilen jeton hicbir ciktida gorunmez."""
        import io
        import contextlib
        with tempfile.TemporaryDirectory() as d:
            yol = os.path.join(d, "config.json")
            eski = kur.CONFIG
            tampon = io.StringIO()
            try:
                kur.CONFIG = yol
                with contextlib.redirect_stdout(tampon):
                    cfg = kur.kur(yaz=True, yol_goster=False)
            finally:
                kur.CONFIG = eski
            jeton = cfg["local_token"]
            ok(len(jeton) > 20)
            no(jeton in tampon.getvalue())
    test("uretilen jeton ekrana yazilmaz", t_token_never_printed)

    def t_address_from_config():
        eq(baslat._adres({"host": "127.0.0.1", "port": 4242}),
           "http://127.0.0.1:4242")
        # Eksik alanlar varsayilana duser: adres uydurulmaz, bilinen
        # varsayilan kullanilir.
        eq(baslat._adres({}), "http://127.0.0.1:4200")
    test("adres yapilandirmadan gelir", t_address_from_config)

    def t_pairing_window_is_short():
        """Pencere ne kadar acik kalirsa, ayni makinede acik duran baska bir
        sayfanin jetonu kapma ihtimali o kadar uzun surer."""
        import daemon
        ok(baslat.ESLEME_SANIYE <= daemon.PAIR_SECONDS)
        ok(baslat.ESLEME_SANIYE >= daemon.PAIR_MIN_SECONDS)
    test("yuz icin acilan pencere kisadir", t_pairing_window_is_short)

    def t_dead_daemon_is_not_reported_alive():
        """«Hazir» yazisi, /api/health gercekten cevap verdigi icin yazilir.
        Kapali bir porta «ayakta» demek, yalan soyleyen bir arayuzdur."""
        no(baslat.ayakta_mi({"host": "127.0.0.1", "port": 4279}, timeout=0.5))
    test("cevap vermeyen daemon ayakta sayilmaz",
         t_dead_daemon_is_not_reported_alive)

    def t_child_output_survives_windows_codepage():
        """Turkce Windows'ta cocuk surecin ciktisi GUNLUK DOSYASINA gider ve
        Python dosyaya yazarken sistemin kod sayfasini (cp1254) kullanir;
        o sayfada «✓» yoktur. Sunucu ilk print'te UnicodeEncodeError ile
        oluyordu. Iki baslatici da cocuga UTF-8 yazmasini SOYLER; gunluk
        zaten UTF-8 acilir. Burada gercek bir cocuk surecle olculur."""
        import importlib.util
        import subprocess
        import sys
        yol = os.path.join(os.path.dirname(baslat.ROOT), "baslat.py")
        spec = importlib.util.spec_from_file_location("kok_baslat", yol)
        kok = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(kok)
        kod = "print('\\u2713 hazir')"
        eski = os.environ.get("PYTHONIOENCODING")
        os.environ["PYTHONIOENCODING"] = "cp1254"      # Windows'u taklit et
        try:
            for ad, ortam in (("HKM", baslat.cocuk_ortami()),
                              ("kok", kok.cocuk_ortami())):
                with tempfile.TemporaryDirectory() as d:
                    g = os.path.join(d, "gunluk.log")
                    with open(g, "a", encoding="utf-8") as f:
                        # Ortamsiz cocuk gercekten olur: test hatayi gorur.
                        cplak = subprocess.run([sys.executable, "-c", kod],
                                               stdout=f, stderr=subprocess.STDOUT)
                        cfix = subprocess.run([sys.executable, "-c", kod],
                                              stdout=f, stderr=subprocess.STDOUT,
                                              env=ortam)
                    with open(g, encoding="utf-8") as f:
                        metin = f.read()
                    ok(cplak.returncode != 0, ad + ": taklit hatayi uretmedi")
                    eq(cfix.returncode, 0, ad + ": cocuk yine oldu")
                    ok("\u2713 hazir" in metin, ad + ": gunlukte ✓ yok")
        finally:
            if eski is None:
                os.environ.pop("PYTHONIOENCODING", None)
            else:
                os.environ["PYTHONIOENCODING"] = eski
    test("cocuk surec Windows kod sayfasinda olmez",
         t_child_output_survives_windows_codepage)

    def t_servers_guard_their_own_output():
        """Sunucu ELLE ve ciktisi yonlendirilerek acilsa da (baslatici
        cocuk ortamini kurmadan) ilk satirda olmez: iki baslatici, sunucu.py
        ve daemon.py acilista ciktilarini kendileri UTF-8'e alir."""
        import subprocess
        import sys
        kok = os.path.dirname(baslat.ROOT)
        ortam = dict(os.environ, PYTHONIOENCODING="cp1254")
        ortam.pop("PYTHONUTF8", None)
        for ad, klasor, modul in (("sunucu", kok, "sunucu"),
                                  ("daemon", baslat.ROOT, "daemon"),
                                  ("kok baslat", kok, "baslat"),
                                  ("HKM baslat", baslat.ROOT, "baslat")):
            kod = ("import sys; sys.path.insert(0, %r); import %s as m; "
                   "m._cikti_utf8(); print('\\u2713 hazir')" % (klasor, modul))
            with tempfile.TemporaryDirectory() as d:
                g = os.path.join(d, "gunluk.log")
                with open(g, "a", encoding="utf-8") as f:
                    c = subprocess.run([sys.executable, "-c", kod], cwd=klasor,
                                       stdout=f, stderr=subprocess.STDOUT,
                                       env=ortam, timeout=60)
                with open(g, encoding="utf-8") as f:
                    metin = f.read()
                eq(c.returncode, 0, ad + ": " + metin[-300:])
                ok("\u2713 hazir" in metin, ad + ": gunlukte ✓ yok")
    test("baslatici ve sunucular ciktisini kendisi korur",
         t_servers_guard_their_own_output)

    def _kok():
        import importlib.util
        yol = os.path.join(os.path.dirname(baslat.ROOT), "baslat.py")
        spec = importlib.util.spec_from_file_location("kok_baslat", yol)
        m = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(m)
        return m

    def t_stop_by_name_on_windows():
        """Windows'ta pkill yoktur: --dur «pkill bulunamadi» deyip
        duruyordu. Surec yine ADIYLA bulunur (komut satirinda betigin tam
        yolu), yalniz o PID'ler kapatilir — porttaki her seyi oldurmek
        baska bir programi kapatmak olabilirdi."""
        hedef = r"C:\Users\ASUS\Desktop\LifeOs\HKM\daemon.py"
        for ad, m in (("HKM", baslat), ("kok", _kok())):
            komutlar = []

            class Sonuc:
                def __init__(self, cikti="", kod=0):
                    self.stdout, self.returncode = cikti, kod

            def calistir(args, **kw):
                komutlar.append(args)
                if args[0] == "powershell":
                    return Sonuc("4120\r\n5332\r\n")
                return Sonuc()
            ok_, _ = m.adiyla_durdur(hedef, calistir=calistir, isletim="nt")
            ok(ok_, ad)
            sorgu = komutlar[0]
            eq(sorgu[0], "powershell", ad)
            ok("Win32_Process" in sorgu[-1] and "daemon.py" in sorgu[-1], ad)
            eq(komutlar[1], ["taskkill", "/PID", "4120", "/T", "/F"], ad)
            eq(komutlar[2], ["taskkill", "/PID", "5332", "/T", "/F"], ad)
            # Tek tirnak PowerShell'de ikilenir: yoldaki ' komutu bozmaz.
            del komutlar[:]
            m.adiyla_durdur("C:\\O'Brien\\daemon.py", calistir=calistir, isletim="nt")
            ok("O''Brien" in komutlar[0][-1], ad)
            # Surec bulunmazsa kapatilacak bir sey yok; bu hata degil.
            bos = []
            ok_, not_ = m.adiyla_durdur(hedef, isletim="nt",
                                        calistir=lambda a, **k: bos.append(a) or Sonuc(""))
            ok(ok_, ad)
            eq(len(bos), 1, ad)
    test("--dur Windows'ta pkill olmadan surecin adiyla calisir", t_stop_by_name_on_windows)

    def t_stop_by_name_posix_real():
        """POSIX'te gercek bir surecle: adiyla bulunur ve kapanir; adi
        tutmayan surece dokunulmaz."""
        import subprocess
        import sys
        import time
        if os.name != "posix":
            return
        with tempfile.TemporaryDirectory() as d:
            hedef = os.path.join(d, "sahte_daemon.py")
            baska = os.path.join(d, "baska.py")
            for y in (hedef, baska):
                with open(y, "w", encoding="utf-8") as f:
                    f.write("import time\ntime.sleep(60)\n")
            p = subprocess.Popen([sys.executable, hedef])
            q = subprocess.Popen([sys.executable, baska])
            try:
                time.sleep(0.3)
                ok(baslat.adiyla_durdur(hedef)[0])
                p.wait(timeout=5)
                ok(p.poll() is not None)
                eq(q.poll(), None)                    # baskasina dokunulmadi
            finally:
                for x in (p, q):
                    if x.poll() is None:
                        x.kill()
    test("--dur POSIX'te yalniz adi tutan sureci kapatir", t_stop_by_name_posix_real)
