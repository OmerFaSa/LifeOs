#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""tools/parca.py: kayit okuma, modul suzgeci, testin kendiliginden eklenmesi, blok yazimi."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import parca

k = parca.kayit_oku("""# yorum
[bas]
css/a.css
css/b.css ays
[perde]
[govde]
js/core/x.js
js/core/y.js spi esp  # satir sonu yorum
[test]
ozel.test.js ays
""")
assert parca.liste(k, "bas", "ays") == ["css/a.css", "css/b.css"]
assert parca.liste(k, "bas", "spi") == ["css/a.css"]
assert parca.liste(k, "govde", "ays") == ["js/core/x.js"]
assert parca.liste(k, "govde", "esp") == ["js/core/x.js", "js/core/y.js"]

# brand/ortak'ta testi olan parca [test]'e kendiliginden girer, ikinci kez girmez
k2 = parca.kayit_oku("[govde]\njs/core/kisi.js\n[test]\n")
assert parca.liste(k2, "test", "ays") == ["../js/core/kisi.js", "kisi.test.js"]
k3 = parca.kayit_oku("[govde]\njs/core/kisi.js\n[test]\n../js/core/kisi.js\nkisi.test.js\n")
assert parca.liste(k3, "test", "ays") == ["../js/core/kisi.js", "kisi.test.js"]

assert parca.etiket("css/a.css") == '<link rel="stylesheet" href="css/a.css"/>'
assert parca.etiket("js/a.js") == '<script src="js/a.js"></script>'

# blok disi dokunulmaz; CRLF korunur; uretim kararlidir
sayfa = "bas\r\n" + parca.ACIK % "bas" + "\r\neski\r\n" + parca.KAPA % "bas" + "\r\nson"
y = parca.sayfa_uret(sayfa, k, "ays", ["bas"])
assert y.startswith("bas\r\n") and y.endswith("\r\nson") and "eski" not in y
assert '<link rel="stylesheet" href="css/b.css"/>\r\n' in y
assert parca.sayfa_uret(y, k, "ays", ["bas"]) == y

# hatali kayit sessiz gecmez
for bozuk in ["[yanlis]\na.js", "a.js", "[bas]\na.js xyz"]:
    try:
        parca.kayit_oku(bozuk)
    except SystemExit:
        continue
    raise AssertionError("gecti: " + bozuk)

# gercek depo: sayfalar kayitla ayni
assert parca.denetle() == 0
print("parca_test: tamam")
