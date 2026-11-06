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
import gzip
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
    (repo / 'dist' / 'mod.html').write_text('<style>.k{}</style><style>' + '.b{color:red}' * 2000 + '</style><p>tek dosya</p><script>var kucuk = 1;</script><script>var buyuk = "çok uzun betik";</script><p>son</p>', encoding='utf-8')
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
        dogru('buyuk stil ayni yerde surumlu adrese tasinir, kucuk stil yerinde', govde.startswith('<style>.k{}</style><link rel="stylesheet" href="/dist-stil.css?v=')
              and '.b{color:red}' not in govde, govde[:120])
        s_surum = govde.split('dist-stil.css?v=', 1)[-1].split('"', 1)[0]
        with urllib.request.urlopen(adres + 'dist-stil.css?v=' + s_surum, timeout=5) as r:
            stil, tur, onbellek = r.read().decode('utf-8'), r.headers.get('Content-Type', ''), r.headers.get('Cache-Control', '')
        dogru('stil adresi buyuk govdeyi sunar (css), saklanir', stil == '.b{color:red}' * 2000 and 'text/css' in tur and 'immutable' in onbellek, (tur, onbellek))
        with urllib.request.urlopen(adres + 'dist-stil.css?v=eski', timeout=5) as r:
            dogru('eski stil surumu saklanmaz', 'no-store' in r.headers.get('Cache-Control', ''), r.headers.get('Cache-Control', ''))
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

    print('telefon ve tablet (vekil)')
    (repo / 'src' / 'js' / 'a.js').write_bytes(b'var a = 1;\nvar b = 2;\n')
    s = sunucu.KuyrukluSunucu(('127.0.0.1', 0), partial(sinif, directory=str(repo / 'src')))
    threading.Thread(target=s.serve_forever, daemon=True).start()
    try:
        adres = 'http://127.0.0.1:%d/' % s.server_address[1]

        def iste(yol, **baslik):
            # Host yerel degil: vekil gibi (uzak.vekilden_mi); urllib 304'u hata sayar
            b = {'Host':'lifeos.ts.net', 'Accept-Encoding':'gzip'}
            b.update({k.replace('_', '-'):v for k, v in baslik.items()})
            try:
                return urllib.request.urlopen(urllib.request.Request(adres + yol, headers=b), timeout=5)
            except urllib.error.HTTPError as h:
                return h

        r = iste('')
        ham = r.read()
        dogru('sayfa gzip gelir', r.headers.get('Content-Encoding') == 'gzip' and 'tek dosya' in gzip.decompress(ham).decode('utf-8'), dict(r.headers))
        dogru('sayfa her acilista dogrulanir, saklanip sorulmadan kullanilmaz', r.headers.get('Cache-Control') == 'no-cache' and 'no-store' not in str(r.headers), r.headers.get('Cache-Control'))
        etag = r.headers.get('ETag')
        r2 = iste('', If_None_Match=etag)
        dogru('sayfa degismediyse 304, govde yok', r2.status == 304 and r2.read() == b'', r2.status)
        dogru('304 cevabi da her acilista sorulur', 'no-cache' in (r2.headers.get('Cache-Control') or ''), r2.headers.get('Cache-Control'))
        (repo / 'dist' / 'mod.html').write_text((repo / 'dist' / 'mod.html').read_text(encoding='utf-8') + '<p>yeni</p>', encoding='utf-8')
        r3 = iste('', If_None_Match=etag)
        dogru('sayfa degisince 200 ve yeni govde', r3.status == 200 and 'yeni' in gzip.decompress(r3.read()).decode('utf-8'), r3.status)
        surum = gzip.decompress(iste('').read()).decode('utf-8').split('dist-betik.js?v=', 1)[-1].split('"', 1)[0]
        r = iste('dist-betik.js?v=' + surum)
        dogru('surumlu betik gzip ve saklanir', r.headers.get('Content-Encoding') == 'gzip' and 'immutable' in r.headers.get('Cache-Control', '') and r.headers.get('Vary') == 'Accept-Encoding', dict(r.headers))
        r = iste('dist-betik.js?v=' + surum, Accept_Encoding='identity')
        dogru('gzip istemeyene ham gider', r.headers.get('Content-Encoding') is None and 'buyuk' in r.read().decode('utf-8'), dict(r.headers))
        (repo / 'src' / 'gorsel.png').write_bytes(b'png')
        r = iste('gorsel.png')
        dogru('gorsel saklanir ama sorulur', r.headers.get('Cache-Control') == 'no-cache' and r.headers.get('Last-Modified'), dict(r.headers))
        r2 = iste('gorsel.png', If_Modified_Since=r.headers.get('Last-Modified'))
        dogru('gorsel degismediyse 304', r2.status == 304, r2.status)
        r = iste('yok.png')
        dogru('olmayan dosya 404', r.status == 404, r.status)
        with urllib.request.urlopen(adres + 'gorsel.png', timeout=5) as y:
            dogru('bu bilgisayarda gorsel eskisi gibi no-store', 'no-store' in y.headers.get('Cache-Control', ''), y.headers.get('Cache-Control'))
        with urllib.request.urlopen(urllib.request.Request(adres, headers={'Accept-Encoding':'gzip'}), timeout=5) as y:
            dogru('bu bilgisayarda sayfa ham ve no-store', y.headers.get('Content-Encoding') is None and 'no-store' in y.headers.get('Cache-Control', ''), dict(y.headers))
    finally:
        s.shutdown(); s.server_close()

    print('dist eskiyse bellekte derlenir (Derlemeler unutulsa da 250 istek olmaz)')
    (repo / 'src' / 'js' / 'a.js').write_bytes(b'var degisti = 1;\n')
    derle_sayac = repo / 'derle_sayac.txt'
    (repo / 'build.py').write_text(
        "from pathlib import Path\n"
        "ROOT = Path(__file__).parent\n"
        "def derle():\n"
        "    import hashlib, json\n"
        "    with open(ROOT / 'derle_sayac.txt', 'a') as f: f.write('x')\n"
        "    a = (ROOT / 'src/js/a.js').read_text()\n"
        "    liste = {'dosya':'mod.html', 'kaynak':{'js/a.js':hashlib.sha256(a.replace(chr(13)+chr(10), chr(10)).encode()).hexdigest()}}\n"
        "    return '<p>canli</p><script>' + a + '</script>', json.dumps(liste)\n", encoding='utf-8')
    yol_once = list(sys.path)
    s = sunucu.KuyrukluSunucu(('127.0.0.1', 0), partial(sinif, directory=str(repo / 'src')))
    threading.Thread(target=s.serve_forever, daemon=True).start()
    try:
        adres = 'http://127.0.0.1:%d/' % s.server_address[1]

        def kok():
            with urllib.request.urlopen(adres, timeout=5) as r:
                return r.read().decode('utf-8')

        g = kok()
        dogru('eski dist yerine guncel kaynaktan tek dosya', 'canli' in g and 'dist-betik.js?v=' in g and 'js/a.js' not in g, g[:80])
        kok()
        dogru('kaynak ayniyken yeniden derlenmez', derle_sayac.read_text() == 'x', derle_sayac.read_text())
        v1 = g.split('?v=', 1)[1].split('"', 1)[0]
        (repo / 'src' / 'js' / 'a.js').write_bytes(b'var yine = 2;\n')
        g2 = kok()
        dogru('kaynak degisince yeni surum (kural 2)', g2.split('?v=', 1)[1].split('"', 1)[0] != v1 and derle_sayac.read_text() == 'xx', g2[:80])
        (repo / 'build.py').write_text('import sys\ndef derle():\n    sys.exit("HATA")\n', encoding='utf-8')
        (repo / 'src' / 'js' / 'a.js').write_bytes(b'var bozuk = 3;\n')
        dogru('derlenemezse src sunulur, sunucu dusmez', 'js/a.js' in kok())
        dogru('sys.path eski haline doner', sys.path == yol_once)
    finally:
        s.shutdown(); s.server_close()

    print('gercek build.py bellekte derler')
    for klasor in ('AYS', 'SPI', 'ESP'):
        b = sunucu._canli_bol(str(KOK / klasor))
        dogru(klasor + ': derle() betik ve stili ayirir', bool(b and b[1] and b[3] and b[0].lstrip().startswith(b'<html')), b and b[0][:40])

    print('depodaki uc modul')
    for klasor in ('AYS', 'SPI', 'ESP'):
        d = sunucu._guncel_dist(str(KOK / klasor))
        dogru(klasor + ': dist kaynakla ayni (build.py kaynak.json yazdi)', d is not None, d)
finally:
    shutil.rmtree(gecici, ignore_errors=True)

print('dist_sun_test: ' + ('temiz' if not kirmizi else '%d KIRMIZI' % kirmizi))
sys.exit(1 if kirmizi else 0)
