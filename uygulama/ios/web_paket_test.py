#!/usr/bin/env python3
"""web_paket.py testi: python3 uygulama/ios/web_paket_test.py"""
import hashlib
import json
import os
import shutil
import sys
import tempfile
import zlib

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.dont_write_bytecode = True
import web_paket  # noqa: E402

d = tempfile.mkdtemp(prefix="lifeos-webpaket-")
try:
    web = os.path.join(d, "Web")
    os.makedirs(os.path.join(web, "AYS"))
    os.makedirs(os.path.join(web, "ortak", "marka"))
    sayfa = "<!doctype html>ş".encode("utf-8") * 200
    resim = bytes(range(256))
    with open(os.path.join(web, "AYS", "rota.html"), "wb") as f:
        f.write(sayfa)
    with open(os.path.join(web, "ortak", "marka", "a.png"), "wb") as f:
        f.write(resim)

    t = web_paket.temel_yaz(web)
    assert sorted(t) == ["AYS/rota.html", "ortak/marka/a.png"], t
    assert t["AYS/rota.html"] == hashlib.sha256(sayfa).hexdigest()

    # temel.json pakete de ozete de girmez (kendi ozetini tasiyamaz).
    m = web_paket.paket(web, os.path.join(d, "c"), 300, 1)
    assert (m["surum"], m["uyum"]) == (300, 1)
    assert [x["yol"] for x in m["dosyalar"]] == sorted(t)
    h = {x["yol"]: x for x in m["dosyalar"]}

    # Metin ham DEFLATE (NSData .zlib), resim oldugu gibi; ad icerigin ozetidir.
    z = h["AYS/rota.html"]
    assert z["z"] is True and z["boyut"] == len(sayfa)
    ham = open(os.path.join(d, "c", "w-" + z["sha256"][:16] + ".z"), "rb").read()
    assert len(ham) < len(sayfa)
    assert zlib.decompress(ham, -15) == sayfa
    r = h["ortak/marka/a.png"]
    assert r["z"] is False
    assert open(os.path.join(d, "c", "w-" + r["sha256"][:16]), "rb").read() == resim

    j = json.load(open(os.path.join(d, "c", "web-surum.json"), encoding="utf-8"))
    assert j == m
    print("web_paket: temiz")
finally:
    shutil.rmtree(d, ignore_errors=True)
