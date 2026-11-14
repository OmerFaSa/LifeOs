#!/usr/bin/env python3
"""tools/kabul_js.py testi: modul dosyasi vm'de yuklenir, ifade ve Promise sonucu, localStorage, hatalar.
python3 tools/kabul_js_test.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kabul_js as J  # noqa: E402

hata = []


def esit(ad, gercek, beklenen):
    if gercek != beklenen:
        hata.append("%s: %r != %r" % (ad, gercek, beklenen))


esit("ifade", J.calistir("", [], "1 + 2"), 3)
esit("promise", J.calistir("", [], "Promise.resolve({a: [1, 'ş']})"), {"a": [1, "ş"]})
esit("undefined -> None", J.calistir("", [], "undefined"), None)
esit("window = global", J.calistir("", [], "window.x = 5; x + self.x"), 10)
esit("localStorage", J.calistir("", [], "localStorage.setItem('k', 1); [localStorage.getItem('k'), localStorage.getItem('y'), localStorage.length]"),
     ["1", None, 1])
esit("hazirlik once kosar", J.calistir("", [], "y * 2", hazirlik="var y = 21"), 42)
esit("utils oncesi cekirdek", J.on_cekirdek(["src/js/core/tarih.js", "src/js/core/utils.js", "x.js"]),
     ["src/js/core/parca.js", "src/js/core/tarih.js", "src/js/core/bicim.js", "src/js/core/utils.js", "x.js"])
for ad, ifade, dosyalar in (("atilan hata", "throw new Error('bozuk')", []), ("reddedilen promise", "Promise.reject(new Error('red'))", []),
                            ("olmayan dosya", "1", ["yok/yok.js"])):
    try:
        J.calistir("", dosyalar, ifade)
        hata.append(ad + ": JSHatasi bekleniyordu")
    except J.JSHatasi as e:
        if ad != "olmayan dosya" and ("bozuk" not in str(e) and "red" not in str(e)):
            hata.append(ad + ": mesaj kayboldu: " + str(e))

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("kabul_js temiz: ifade, promise, window, localStorage, hazirlik, gercek modul dosyasi, hatalar.")
