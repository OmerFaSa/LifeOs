#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""tools/parca.py: kayit okuma, modul suzgeci, testin kendiliginden eklenmesi, blok yazimi."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import parca

ONEMLI_TAVAN = 176  # dusurulur, artirilmaz

k = parca.kayit_oku("""# yorum
[bas]
css/a.css
css/b.css ays
[govde]
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
# King rehberi sayfalardan uretilir, sira ve alanlar korunur
_r = parca.rehber_uret()
assert "{ modul:'spi', route:'today', ad:'Bugün'" in _r and _r.index("modul:'spi'") < _r.index("modul:'ays'") < _r.index("modul:'esp'")
assert parca.KING_ALANI.search("sayfa({ id:'x', modul:'ays', king:{ sira:5, ad:'X', es:['a', 'b'] }, ad:'Y' })").group(5) == "'a', 'b'"
# Blok adi ekranda gorunur (hata satiri): kod adi ya da gecici ad olamaz
import re as _re
for _f in parca.KOK.glob("*/src/js/screens/*.js"):
    for _m in _re.finditer(r"PARCA\.blok\(\{ id:'([^']+)',[^\n]*?ad:'([^']*)'", _f.read_text(encoding="utf-8")):
        assert not _re.fullmatch(r"[a-z]\w*|\w+[a-z][A-Z]\w*|Bölüm \d+", _m.group(2)), (_f.name, _m.group(1), _m.group(2))
# Tembel: adlar bulunur, dosya ana betikten cikar, veri olmayan ve sayfada olmayan reddedilir
_k = parca.kayit_oku("[tembel]\njs/a.js ays\n")
_o = {"js/a.js": "R.A = 1;\nwindow.R.B = {};", "js/b.js": "x"}
_kal, _on, _et = parca.tembel_ayir("ays", ["js/a.js", "js/b.js"], _o.get, _k)
assert _kal == ["js/b.js"] and "['A','B']" in _on and _et.startswith('<script type="text/plain"') and "R.A = 1" in _et
assert parca.tembel_ayir("spi", ["js/a.js"], _o.get, _k) == (["js/a.js"], "", "")
for _d, _ic in ((["js/b.js"], "R.A=1"), (["js/a.js"], "foo()"), (["js/a.js"], "R.A='</script>'")):
    try:
        parca.tembel_ayir("ays", _d, lambda y: _ic, _k)
        raise AssertionError(_d)
    except SystemExit:
        pass
# CSS: beyaz ve siyah jetondan gelir; !important sayisi artmaz (tools/css_onemli.js olcer)
_ham = _re.compile(r"rgba?\(\s*(255|0)\s*,\s*\1\s*,\s*\1\b|#(?:fff|ffffff|000|000000)\b", _re.I)
_onemli = 0
for _f in sorted((parca.KOK / "brand" / "ortak").glob("*.css")):
    _s = _re.sub(r"/\*.*?\*/|url\([^)]*\)|\"[^\"]*\"", "", _f.read_text(encoding="utf-8"), flags=_re.S)
    if _f.name not in ("jeton.css", "vitrin.css", "fonts.css", "hesap.css"):
        assert not _ham.search(_s), (_f.name, _ham.search(_s).group(0))
    if _f.name != "vitrin.css":
        _onemli += _s.count("!important")
assert _onemli <= ONEMLI_TAVAN, "!important %d > %d" % (_onemli, ONEMLI_TAVAN)
assert parca.denetle() == 0
print("parca_test: tamam")
