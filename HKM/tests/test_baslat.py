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
