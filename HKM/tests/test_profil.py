# -*- coding: utf-8 -*-
"""Profil — dort alanin toplami, ve TOPLANMAYAN sey.

Bu paket ozellikle uc seyi korur:

  1. Eksik veri SIFIR DEGILDIR. Sayac gondermeyen modul toplama 0 ile
     girmez, HIC girmez — ve kac modulun konustugu yazilir.
  2. Her sayac toplanmaz. Odak bir GUNUN en iyisi, istikrar kesintisiz
     bir seri; ikisini toplamak «uc sistemde 3'er saat odaklandim,
     demek ki 9 saat» demekti.
  3. Merkezin kendi XP'si YOKTUR. Kademe yan yana durur, toplanmaz.
"""

import datetime

from core import db, profil, sync_engine
from tests.harness import eq, metric, no, ok, suite, test

BASE = datetime.date(2026, 7, 1)
GUN = BASE.isoformat()


def _con():
    return db.connect(":memory:")


def _push(con, module, **metrics):
    return sync_engine.ingest(con, {"module": module, "date": GUN,
                                    "metrics": metrics},
                              now=GUN + "T09:00:00")


def t_0_0():
    con = _con()
    for mod, saat in (("ays", 100), ("spi", 50), ("esp", 30)):
        _push(con, mod, badge_hours=metric(saat, "computed"),
              badge_days=metric(10, "computed"),
              badge_tasks=metric(5, "computed"),
              badge_count=metric(1, "computed"),
              badge_focus_hours=metric(2, "computed"),
              badge_streak_months=metric(1, "computed"))
    p = profil.anlik(con, GUN)
    eq(p["toplamlar"]["badge_hours"], 180)
    eq(p["toplamlar"]["badge_days"], 30)
    eq(len(p["konusan"]), 3)
    eq(len(p["eksik"]), 0)

def t_0_1():
    con = _con()
    _push(con, "ays", badge_hours=metric(100, "computed"))
    # SPI ve ESP hic gondermedi.
    p = profil.anlik(con, GUN)
    eq(p["toplamlar"]["badge_hours"], 100)
    eq(p["konusan"], ["ays"])
    eq(sorted(p["eksik"]), ["esp", "spi"])

def t_0_2():
    con = _con()
    for mod, odak in (("ays", 3), ("spi", 7), ("esp", 2)):
        _push(con, mod, badge_focus_hours=metric(odak, "computed"))
    p = profil.anlik(con, GUN)
    eq(p["toplamlar"]["badge_focus_hours"], 7)

def t_0_3():
    con = _con()
    for mod, ay in (("ays", 6), ("spi", 2), ("esp", 12)):
        _push(con, mod, badge_streak_months=metric(ay, "computed"))
    p = profil.anlik(con, GUN)
    eq(p["toplamlar"]["badge_streak_months"], 12)

def t_0_4():
    con = _con()
    p = profil.anlik(con, GUN)
    eq(p["toplamlar"]["badge_hours"], 0)
    eq(p["konusan"], [])
    eq(sorted(p["eksik"]), ["ays", "esp", "spi"])

def t_1_0():
    con = _con()
    _push(con, "ays", badge_hours=metric(300, "computed"))
    p = profil.anlik(con, GUN)
    kod = {r["kod"]: r for r in p["rozetler"]}
    ok(kod["saat-100"]["kazanildi"])
    ok(kod["saat-250"]["kazanildi"])
    no(kod["saat-500"]["kazanildi"])

def t_1_1():
    con = _con()
    p = profil.anlik(con, GUN)
    for r in p["rozetler"]:
        ok(r["gorsel"].startswith("basarim-"))

def t_1_2():
    con = _con()
    # Uc sart tamam, biri eksik.
    _push(con, "ays", badge_hours=metric(1000, "computed"),
          badge_tasks=metric(2500, "computed"),
          badge_days=metric(365, "computed"),
          badge_streak_months=metric(11, "computed"))
    p = profil.anlik(con, GUN)
    no(p["onur"]["kazanildi"])
    eksik = [s for s in p["onur"]["sartlar"] if not s["tamam"]]
    eq(len(eksik), 1)
    eq(eksik[0]["anahtar"], "badge_streak_months")

def t_1_3():
    con = _con()
    _push(con, "ays", badge_hours=metric(600, "computed"),
          badge_tasks=metric(1500, "computed"),
          badge_days=metric(200, "computed"),
          badge_streak_months=metric(12, "computed"))
    _push(con, "esp", badge_hours=metric(500, "computed"),
          badge_tasks=metric(1200, "computed"),
          badge_days=metric(200, "computed"),
          badge_streak_months=metric(12, "computed"))
    p = profil.anlik(con, GUN)
    ok(p["onur"]["kazanildi"])

def t_1_4():
    con = _con()
    p = profil.anlik(con, GUN)
    eq(len(p["onur"]["sartlar"]), 4)

def t_2_0():
    con = _con()
    _push(con, "ays", level_tier=metric(3, "computed"),
          level_sub=metric(2, "computed"))
    _push(con, "spi", level_tier=metric(2, "computed"),
          level_sub=metric(1, "computed"))
    p = profil.anlik(con, GUN)
    eq(len(p["kademeler"]), 2)
    adlar = sorted(k["ad"] for k in p["kademeler"])
    eq(adlar, ["AYS", "SPİ"])
    # Toplanmis bir kademe alani YOKTUR.
    no("kademe_toplam" in p)
    no("genel_seviye" in p)

def t_2_1():
    con = _con()
    _push(con, "ays", level_tier=metric(1, "computed"),
          level_sub=metric(1, "computed"))
    p = profil.anlik(con, GUN)
    eq(len(p["kademeler"]), 1)


def run():
    suite("Profil — toplama")
    test("uc modulun saati toplanir", t_0_0)
    test("sayac gondermeyen modul toplama SIFIR ile girmez", t_0_1)
    test("odak TOPLANMAZ, en yuksegi alinir", t_0_2)
    test("istikrar da TOPLANMAZ, en uzunu alinir", t_0_3)
    test("olcum gonderilmemisse toplam sifirdir ama patlamaz", t_0_4)
    suite("Profil — rozet ve onur")
    test("esigi gecen rozet kazanilmis isaretlenir", t_1_0)
    test("her rozetin bir gorsel adi vardir", t_1_1)
    test("Sistem Ustasi dort sarti birden ister", t_1_2)
    test("dordu de tamamsa Sistem Ustasi verilir", t_1_3)
    test("sartlar kazanilmis olsa da HER ZAMAN doner", t_1_4)
    suite("Profil — merkezin kendi XP'si yoktur")
    test("kademe YAN YANA durur, toplanmaz", t_2_0)
    test("kademe gondermeyen modul listede hic gorunmez", t_2_1)
