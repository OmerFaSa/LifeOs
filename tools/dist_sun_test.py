#!/usr/bin/env python3
"""Modul kapisi guncel tek dosyayi sunar testi.

   python3 tools/dist_sun_test.py     (cikis 0 temiz, 1 kirmizi)

Hata (2026-10-29, kullanici: «yuklenme gecikiyor, kasmalar oluyor»):
LifeOS modulleri kapinin kokunden src/index.html ile aciyordu: ~190 betik
ve ~40 stil dosyasi, her biri ayri istek. Tarayici bir kokene alti
baglanti acar; 230 istek ~38 tura bolunur ve kabuk ~1,2-1,4 sn'de
gorunuyordu. Ayni kapidan dist (3 istek) ~0,33 sn.

Soz: build.py dist'in yanina hangi kaynaktan derlendigini yazar
(dist/kaynak.json: dosya basina sha256, satir sonu esitlenmis). Sunucu
kokte dist'i YALNIZ kaynaklarin hepsi ayniysa sunar; tek dosya degismisse,
liste yoksa ya da bozuksa src'ye doner — eski surum calismaz (sunucu
kurali 2). Satir sonu (CRLF/LF) imzayi degistirmez: Windows'ta git
dosyalari CRLF'e cevirir."""
import hashlib
import importlib.util
import json
import os
import shutil
import sys
import tempfile
import threading
import urllib.request
from functools import partial
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent

try:   # Windows konsolu (cp1254) «✓» basamaz
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

kirmizi = 0


def dogru(ad, kosul, gelen=None):
    global kirmizi
    print(("  ✓ " if kosul else "  ✕ ") + ad + ("" if kosul else " (gelen %r)" % (gelen,)))
    if not kosul:
        kirmizi += 1


def yukle(ad, yol):
    spec = importlib.util.spec_from_file_location(ad, yol)
    modul = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modul)
    return modul


def imza(metin):
    return hashlib.sha256(metin.replace('\r\n', '\n').encode('utf-8')).hexdigest()


sunucu = yukle('sunucu_dist', KOK / 'sistem' / 'sunucu.py')
gecici = Path(tempfile.mkdtemp(prefix='dist_sun_'))
try:
    repo = gecici / 'MOD'
    (repo / 'src' / 'js').mkdir(parents=True)
    (repo / 'dist').mkdir()
    (repo / 'src' / 'index.html').write_bytes(b'<script src="js/a.js"></script>\n')
    (repo / 'src' / 'js' / 'a.js').write_bytes(b'var a = 1;\r\nvar b = 2;\r\n')   # CRLF: Windows kopyasi
    (repo / 'dist' / 'mod.html').write_text('<p>tek dosya</p><script>var kucuk = 1;</script><script>var buyuk = "çok uzun betik";</script><p>son</p>', encoding='utf-8')
    liste = {'dosya': 'mod.html', 'kaynak': {'index.html': imza('<script src="js/a.js"></script>\n'),
                                             'js/a.js': imza('var a = 1;\nvar b = 2;\n')}}   # LF ile derlenmis
    (repo / 'dist' / 'kaynak.json').write_text(json.dumps(liste), encoding='utf-8')

    print('guncel dist')
    d = sunucu._guncel_dist(str(repo))
    dogru('kaynaklar ayniysa dist dosyasi doner (CRLF/LF farki sayilmaz)', d and os.path.samefile(d, repo / 'dist' / 'mod.html'), d)

    (repo / 'src' / 'js' / 'a.js').write_bytes(b'var a = 1;\r\nvar b = 3;\r\n')
    dogru('tek kaynak degisince None (src sunulur)', sunucu._guncel_dist(str(repo)) is None)
    (repo / 'src' / 'js' / 'a.js').write_bytes(b'var a = 1;\r\nvar b = 2;\r\n')
    dogru('geri alininca yine dist', sunucu._guncel_dist(str(repo)) is not None)

    (repo / 'src' / 'js' / 'a.js').unlink()
    dogru('kaynak dosya silinince None', sunucu._guncel_dist(str(repo)) is None)
    (repo / 'src' / 'js' / 'a.js').write_bytes(b'var a = 1;\nvar b = 2;\n')

    (repo / 'dist' / 'kaynak.json').write_text('{bozuk', encoding='utf-8')
    dogru('bozuk liste: None', sunucu._guncel_dist(str(repo)) is None)
    (repo / 'dist' / 'kaynak.json').write_text(json.dumps(dict(liste, dosya='../src/index.html')), encoding='utf-8')
    dogru('liste dist disina isaret edemez', sunucu._guncel_dist(str(repo)) is None)
    (repo / 'dist' / 'kaynak.json').unlink()
    dogru('liste yoksa None', sunucu._guncel_dist(str(repo)) is None)

    print('kapinin koku')
    (repo / 'dist' / 'kaynak.json').write_text(json.dumps(liste), encoding='utf-8')
    sinif = type('Sunucu_MOD', (sunucu.Sunucu,), {'repo': str(repo)})
    s = sunucu.KuyrukluSunucu(('127.0.0.1', 0), partial(sinif, directory=str(repo / 'src')))
    threading.Thread(target=s.serve_forever, daemon=True).start()
    try:
        adres = 'http://127.0.0.1:%d/' % s.server_address[1]
        with urllib.request.urlopen(adres, timeout=5) as r:
            govde, onbellek = r.read().decode('utf-8'), r.headers.get('Cache-Control', '')
        dogru('kok guncel dist\'i sunar', 'tek dosya' in govde, govde[:60])
        dogru('onbellek kurali degismez (no-store)', 'no-store' in onbellek, onbellek)
        dogru('buyuk betik ayni yerde ayri adrese tasinir', '<script>var kucuk = 1;</script><script src="/dist-betik.js?v=' in govde
              and '"></script><p>son</p>' in govde and 'buyuk' not in govde, govde)
        surum = govde.split('dist-betik.js?v=', 1)[-1].split('"', 1)[0]
        with urllib.request.urlopen(adres + 'dist-betik.js?v=' + surum, timeout=5) as r:
            betik, tur, onbellek = r.read().decode('utf-8'), r.headers.get('Content-Type', ''), r.headers.get('Cache-Control', '')
        dogru('betik adresi buyuk govdeyi sunar (UTF-8, js)', betik == 'var buyuk = "çok uzun betik";' and 'javascript' in tur, (betik, tur))
        dogru('surumu tutan betik saklanir (V8 derlemeyi saklar)', 'immutable' in onbellek and 'no-store' not in onbellek, onbellek)
        with urllib.request.urlopen(adres + 'dist-betik.js?v=eski', timeout=5) as r:
            onbellek = r.headers.get('Cache-Control', '')
        dogru('eski surum adresi saklanmaz (no-store)', 'no-store' in onbellek and 'immutable' not in onbellek, onbellek)
        (repo / 'src' / 'js' / 'a.js').write_bytes(b'var degisti = 1;\n')
        with urllib.request.urlopen(adres, timeout=5) as r:
            govde = r.read().decode('utf-8')
        dogru('kaynak degisince kok src/index.html\'i sunar', 'js/a.js' in govde, govde[:60])
        try:
            urllib.request.urlopen(adres + 'dist-betik.js', timeout=5)
            kod = 200
        except urllib.error.HTTPError as h:
            kod = h.code
        dogru('dist eskiyken betik adresi yok (404)', kod == 404, kod)
    finally:
        s.shutdown(); s.server_close()

    print('depodaki uc modul')
    for klasor in ('AYS', 'SPI', 'ESP'):
        d = sunucu._guncel_dist(str(KOK / klasor))
        dogru(klasor + ': dist kaynakla ayni (build.py kaynak.json yazdi)', d is not None, d)
finally:
    shutil.rmtree(gecici, ignore_errors=True)

print('dist_sun_test: ' + ('temiz' if not kirmizi else '%d KIRMIZI' % kirmizi))
sys.exit(1 if kirmizi else 0)
