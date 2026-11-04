#!/usr/bin/env python3
"""PİKSEL RAKAM — sistemin kendi rakam yazı tipi: 5×7 ızgarada elle çizildi, yalnız 0-9.

Pixelify Sans'ta 5 rakamı S harfine, 7 de ㄱ işaretine benziyor; sağlık ve sınav sayıları okunmalı.
Betik iki ağırlıklı TrueType üretir (yalnız standart kütüphane), piksel-yazi.css'e gömer. Yazı tipi
unicode-range ile yalnız rakamlara uygulanır; satır yüksekliği ve harfler Pixelify'da kalır.

    python3 tools/piksel_rakam.py            yazar
    python3 tools/piksel_rakam.py --denetle  gömülü olan bu çizimle aynı mı (değilse çıkış 1)
"""
import base64
import re
import struct
import sys
from pathlib import Path

CSS = Path(__file__).resolve().parent.parent / "brand" / "ortak" / "piksel-yazi.css"
BAS, SON = "/* PIKSEL RAKAM BASI: tools/piksel_rakam.py uretir */", "/* PIKSEL RAKAM SONU */"
HUCRE = 100
RAKAM = {
    "0": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
    "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
    "3": [".###.", "#...#", "....#", "..##.", "....#", "#...#", ".###."],
    "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
    "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
    "6": ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
    "7": ["#####", "....#", "...#.", "..#..", "..#..", "..#..", "..#.."],
    "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
    "9": [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
}


def dikdortgenler(satirlar, kalin):
    """Her satırdaki bitişik pikseller tek dikdörtgen; kalın ağırlıkta sağa doğru uzar."""
    out = []
    for y, r in enumerate(satirlar):
        x = 0
        while x < len(r):
            if r[x] != "#":
                x += 1
                continue
            b = x
            while x < len(r) and r[x] == "#":
                x += 1
            ust = (len(satirlar) - y) * HUCRE
            out.append((b * HUCRE + 50, ust - HUCRE, x * HUCRE + 50 + kalin, ust))
    return out


def glif(satirlar, kalin):
    d = dikdortgenler(satirlar, kalin)
    xs = [v for r in d for v in (r[0], r[2])]
    ys = [v for r in d for v in (r[1], r[3])]
    govde = struct.pack(">hhhhh", len(d), min(xs), min(ys), max(xs), max(ys))
    govde += b"".join(struct.pack(">H", 4 * (i + 1) - 1) for i in range(len(d)))
    govde += struct.pack(">H", 0)  # yönerge yok
    noktalar = []
    for x0, y0, x1, y1 in d:  # saat yönü: TrueType dolgu yönü
        noktalar += [(x0, y0), (x0, y1), (x1, y1), (x1, y0)]
    govde += bytes([1]) * len(noktalar)
    ox = oy = 0
    xb = yb = b""
    for x, y in noktalar:
        xb += struct.pack(">h", x - ox)
        yb += struct.pack(">h", y - oy)
        ox, oy = x, y
    govde += xb + yb
    if len(govde) % 4:
        govde += b"\0" * (4 - len(govde) % 4)
    return govde, min(xs), len(noktalar), len(d)


def toplam(b):
    b += b"\0" * (-len(b) % 4)
    return sum(struct.unpack(">%dI" % (len(b) // 4), b)) & 0xFFFFFFFF


def yazitipi(kalin_mi):
    kalin = 60 if kalin_mi else 20
    adim = 600 + kalin
    gl = [glif(RAKAM[str(i)], kalin) for i in range(10)]
    glyf, loca = b"", [0, 0]  # 0: .notdef boş
    for g in gl:
        glyf += g[0]
        loca.append(len(glyf))
    xenb = 500 + 50 + kalin
    head = struct.pack(">IIIIHH", 0x00010000, 0x00010000, 0, 0x5F0F3CF5, 3, 1000) + b"\0" * 16
    head += struct.pack(">hhhhHHhhh", 50, 0, xenb, 700, 1 if kalin_mi else 0, 8, 2, 1, 0)
    hhea = struct.pack(">IhhhHhhhhhhhhhhhH", 0x00010000, 900, -200, 0, adim, 0, adim - xenb, xenb, 1, 0, 0, 0, 0, 0, 0, 0, 11)
    hmtx = struct.pack(">HH", adim, 0) + b"".join(struct.pack(">Hh", adim, g[1]) for g in gl)
    maxp = struct.pack(">IHHHHHHHHHHHHHH", 0x00010000, 11, max(g[2] for g in gl), max(g[3] for g in gl), 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0)
    cmap = struct.pack(">HHHHI", 0, 1, 3, 1, 12)
    alt = struct.pack(">HHHH", 2 * 2, 4, 1, 0)
    govde = struct.pack(">HHHH", 0x39, 0xFFFF, 0, 0x30) + struct.pack(">H", 0xFFFF)
    govde += struct.pack(">HH", (1 - 0x30) & 0xFFFF, 1) + struct.pack(">HH", 0, 0)
    cmap += struct.pack(">HHH", 4, 6 + len(alt) + len(govde), 0) + alt + govde
    agirlik = 700 if kalin_mi else 400
    os2 = struct.pack(">HhHHH", 3, adim, agirlik, 5, 0)
    os2 += struct.pack(">hhhhhhhh", 500, 500, 0, 100, 500, 500, 0, 300) + struct.pack(">hhh", 50, 300, 0)
    os2 += b"\0" * 10 + b"\0" * 16 + b"LFOS"
    os2 += struct.pack(">HHHhhhHH", 0x20 if kalin_mi else 0x40, 0x30, 0x39, 900, -200, 0, 900, 200)
    os2 += struct.pack(">II", 1, 0) + struct.pack(">hhHHH", 500, 700, 0, 32, 1)
    post = struct.pack(">IIhhIIIII", 0x00030000, 0, -100, 50, 1, 0, 0, 0, 0)
    adlar = [(1, "Piksel Rakam"), (2, "Bold" if kalin_mi else "Regular"), (4, "Piksel Rakam"), (6, "PikselRakam-Bold" if kalin_mi else "PikselRakam-Regular")]
    depo, kayit, o = b"", b"", 0
    for i, m in adlar:
        b = m.encode("utf-16-be")
        kayit += struct.pack(">HHHHHH", 3, 1, 0x409, i, len(b), o)
        depo += b
        o += len(b)
    name = struct.pack(">HHH", 0, len(adlar), 6 + len(kayit)) + kayit + depo
    tablolar = {
        b"OS/2": os2, b"cmap": cmap, b"glyf": glyf, b"head": head, b"hhea": hhea, b"hmtx": hmtx,
        b"loca": b"".join(struct.pack(">I", v) for v in loca), b"maxp": maxp, b"name": name, b"post": post,
    }
    n = len(tablolar)
    us = 1
    while us * 2 <= n:
        us *= 2
    ust = struct.pack(">IHHHH", 0x00010000, n, us * 16, len(bin(us)) - 3, n * 16 - us * 16)
    o = 12 + n * 16
    dizin, veri = b"", b""
    for ad in sorted(tablolar):
        t = tablolar[ad]
        dizin += ad + struct.pack(">III", toplam(t), o, len(t))
        dolgu = t + b"\0" * (-len(t) % 4)
        veri += dolgu
        o += len(dolgu)
    dosya = bytearray(ust + dizin + veri)
    yer = 12 + n * 16 + sum(len(tablolar[a]) + (-len(tablolar[a]) % 4) for a in sorted(tablolar) if a < b"head") + 8
    struct.pack_into(">I", dosya, yer, (0xB1B0AFBA - toplam(bytes(dosya))) & 0xFFFFFFFF)
    return bytes(dosya)


def blok():
    satir = []
    for kalin_mi, aralik in ((False, "400 500"), (True, "600 800")):
        b = base64.b64encode(yazitipi(kalin_mi)).decode("ascii")
        satir.append("@font-face{font-family:'Piksel Rakam';font-style:normal;font-weight:%s;font-display:swap;unicode-range:U+30-39;src:url(data:font/ttf;base64,%s) format('truetype');}" % (aralik, b))
    return BAS + "\n" + "\n".join(satir) + "\n" + SON


def main():
    s = CSS.read_bytes().decode("utf-8").replace("\r\n", "\n")
    yeni = blok()
    m = re.search(re.escape(BAS) + r".*?" + re.escape(SON), s, re.S)
    if "--denetle" in sys.argv:
        if not m or m.group(0) != yeni:
            print("Piksel rakam: gömülü yazı tipi çizimle aynı değil; tools/piksel_rakam.py koş.")
            return 1
        print("Piksel rakam: gömülü yazı tipi çizimle aynı.")
        return 0
    s = (s[:m.start()] + yeni + s[m.end():]) if m else s.rstrip() + "\n" + yeni + "\n"
    CSS.write_bytes(s.encode("utf-8"))
    print("Piksel rakam yazıldı: %d bayt" % len(yeni))
    return 0


if __name__ == "__main__":
    sys.exit(main())
