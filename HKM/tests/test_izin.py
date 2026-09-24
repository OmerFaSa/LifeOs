# -*- coding: utf-8 -*-
"""Dosya izinleri — jeton ve kisisel veri baskasinin okuyabilecegi yerde
durmaz (HATALAR D-13)."""

import os
import shutil
import stat
import tempfile

from core import izin, settings
from tests.harness import eq, ok, suite, test


def _mod(yol):
    return stat.S_IMODE(os.stat(yol).st_mode)


def run():
    suite("dosya izinleri")
    if os.name != "posix":
        return

    def t_config_yalniz_sahibi():
        """config.json jetonlari tasir; varsayilan umask ile 0644 yaziliyordu."""
        kok = tempfile.mkdtemp(prefix="hkm-izin-")
        eski = os.umask(0o022)
        try:
            yol = os.path.join(kok, "config.json")
            settings.write({"local_token": "x"}, yol)
            eq(_mod(yol) & 0o077, 0)
            # Var olan gevsek dosya da yeniden yazilinca sikilasir.
            os.chmod(yol, 0o644)
            settings.write({"local_token": "y"}, yol)
            eq(_mod(yol) & 0o077, 0)
        finally:
            os.umask(eski)
            shutil.rmtree(kok, ignore_errors=True)
    test("config.json yalniz sahibince okunur", t_config_yalniz_sahibi)

    def t_var_olanlar_sikilasir():
        """Once yazilmis ambar, kopya, yedek ve medya dosyalari acilista
        sikilasir; ambarin durdugu ust klasore dokunulmaz."""
        kok = tempfile.mkdtemp(prefix="hkm-izin-")
        try:
            os.chmod(kok, 0o755)
            db_yol = os.path.join(kok, "hkm.db")
            yabanci = os.path.join(kok, "baska.txt")
            dosyalar = [db_yol, db_yol + "-wal", os.path.join(kok, "hkm-oncesi-1.db"),
                        os.path.join(kok, "config.json"), yabanci]
            os.makedirs(os.path.join(kok, "yedek", "ays"))
            dosyalar.append(os.path.join(kok, "yedek", "ays", "2026-09-20.json"))
            for d in dosyalar:
                with open(d, "w") as f:
                    f.write("x")
                os.chmod(d, 0o644)
            os.chmod(os.path.join(kok, "yedek"), 0o755)
            n = izin.sikilastir(os.path.join(kok, "config.json"), db_yol)
            ok(n >= 6, n)
            for d in dosyalar[:-2] + dosyalar[-1:]:
                eq((d, _mod(d) & 0o077), (d, 0))
            eq(_mod(os.path.join(kok, "yedek")) & 0o077, 0)
            eq(_mod(yabanci), 0o644)             # HKM'nin olmayan dosya
            eq(_mod(kok), 0o755)                 # ust klasor
        finally:
            shutil.rmtree(kok, ignore_errors=True)
    test("var olan veri dosyalari acilista sikilasir", t_var_olanlar_sikilasir)
