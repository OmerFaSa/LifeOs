#!/usr/bin/env python3
"""Ofis 082 kabul testi: uc zafer tablosu (malazgirt, istanbul, canakkale) kabuk/ata.js TABLO'da, kabuk/tablo.js'te
iki boyutta PNG (renkli, gok ile yer farkli), sahneleri piksel-doga-turk.js'te; milli gun eslemesi. Cikis: kalan sayisi."""
import base64
import json
import os
import re
import struct
import subprocess
import sys
import zlib

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
YENI = ['malazgirt', 'istanbul', 'canakkale']
OLCU = {'buyuk': (420, 236), 'kucuk': (336, 189)}
kalan = 0


def dene(ad, kosul, ek=''):
    global kalan
    if not kosul:
        kalan += 1
    print(('✓ ' if kosul else '✕ ') + ad + ('' if kosul or not ek else '  → ' + str(ek)))


def png_coz(veri):
    """8 bit RGBA, araya alinmamis PNG -> (w, h, satirlar[bytes]). Tuval toDataURL boyle yazar."""
    assert veri[:8] == b'\x89PNG\r\n\x1a\n'
    i, idat, w, h = 8, b'', 0, 0
    while i < len(veri):
        n, tur = struct.unpack('>I4s', veri[i:i + 8])
        govde = veri[i + 8:i + 8 + n]
        if tur == b'IHDR':
            w, h, derinlik, renk = struct.unpack('>IIBB', govde[:10])
            assert derinlik == 8 and renk == 6, 'RGBA 8 bit bekleniyor'
        elif tur == b'IDAT':
            idat += govde
        i += 12 + n
    ham, bpp, satir, onceki, out = zlib.decompress(idat), 4, w * 4, bytearray(w * 4), []
    for y in range(h):
        f, s = ham[y * (satir + 1)], bytearray(ham[y * (satir + 1) + 1:(y + 1) * (satir + 1)])
        for x in range(satir):
            a = s[x - bpp] if x >= bpp else 0
            b, c = onceki[x], onceki[x - bpp] if x >= bpp else 0
            if f == 1: s[x] = (s[x] + a) & 255
            elif f == 2: s[x] = (s[x] + b) & 255
            elif f == 3: s[x] = (s[x] + (a + b) // 2) & 255
            elif f == 4:
                p = a + b - c; pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                s[x] = (s[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        out.append(bytes(s)); onceki = s
    return w, h, out


def main():
    js = ("const A = require(%s), T = require(%s); console.log(JSON.stringify({ tablo: A.TABLO, gun: [[4, 29], [2, 18], [7, 26]].map(g => A.gununTablosu(new Date(2026, g[0], g[1]))),"
          " resim: Object.fromEntries(Object.keys(T).map(k => [k, T[k]])) }));") % (json.dumps(os.path.join(KOK, 'kabuk', 'ata.js')), json.dumps(os.path.join(KOK, 'kabuk', 'tablo.js')))
    r = subprocess.run(['node', '-e', js], capture_output=True, text=True, encoding='utf-8')
    if r.returncode:
        dene('kabuk/ata.js ve kabuk/tablo.js yüklenir', False, r.stderr.strip()[-300:]); return
    d = json.loads(r.stdout)
    for k in YENI:
        t = d['tablo'].get(k) or {}
        dene(k + ': TABLO girişi (ad, alt, metin)', bool(t.get('ad') and t.get('alt') and t.get('metin')), t)
        for boy, (W, H) in OLCU.items():
            u = (d['resim'].get(k) or {}).get(boy, '')
            if not u.startswith('data:image/png;base64,'):
                dene(k + ' ' + boy + ': PNG', False, 'yok'); continue
            w, h, satirlar = png_coz(base64.b64decode(u.split(',', 1)[1]))
            dene(k + ' ' + boy + ': ' + str(W) + '×' + str(H), (w, h) == (W, H), (w, h))
            renk = {bytes(s[i:i + 3]) for s in satirlar for i in range(0, len(s), 4)}
            dene(k + ' ' + boy + ': en az 24 renk', len(renk) >= 24, len(renk))
            ust = {bytes(s[i:i + 3]) for s in satirlar[:h // 8] for i in range(0, len(s), 4)}
            alt = {bytes(s[i:i + 3]) for s in satirlar[-h // 8:] for i in range(0, len(s), 4)}
            dene(k + ' ' + boy + ': gök ile yer farklı', len(ust & alt) < min(len(ust), len(alt)), (len(ust), len(alt), len(ust & alt)))
    dene('millî gün: 29 Mayıs istanbul, 18 Mart canakkale, 26 Ağustos kocatepe', d['gun'] == ['istanbul', 'canakkale', 'kocatepe'], d['gun'])
    kay = open(os.path.join(KOK, 'belgeler', 'tasarim', 'turk-tema', 'piksel-doga-turk.js'), encoding='utf-8').read()
    for k in YENI:
        dene(k + ': piksel-doga-turk.js SAHNE', re.search(r'\b' + k + r'\s*:\s*\{', kay) is not None)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
    print(('kabul: hepsi geçti' if not kalan else 'kabul: %d kaldı' % kalan))
    sys.exit(1 if kalan else 0)
