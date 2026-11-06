#!/usr/bin/env python3
"""PİKSEL BULUT — modül geçişi perdesinin bulut resmi: CSS'e gömülü küçük bir PNG.

Bulut önceden tuvale JavaScript ile çiziliyordu: tık anında ana iş parçacığı duruyor, varış
sayfasında betikler ~600 ms sonra çalıştığı için ilk boyamada bulut yoktu (ölçüldü, 2026-11-06).
CSS <head>'dedir: resim ilk boyamada yerindedir, çizim maliyeti yoktur, iki sayfada piksel piksel
aynıdır. Yalnız standart kütüphane. Sağ yarım aynı resmin aynasıdır (piksel.css).

    python3 tools/piksel_bulut.py            yazar
    python3 tools/piksel_bulut.py --denetle  gömülü olan bu çizimle aynı mı (değilse çıkış 1)
"""
import base64
import math
import re
import struct
import sys
import zlib
from pathlib import Path

CSS = Path(__file__).resolve().parent.parent / "brand" / "ortak" / "piksel.css"
BAS, SON = "/* PIKSEL BULUT BASI: tools/piksel_bulut.py uretir */", "/* PIKSEL BULUT SONU */"
W, H = 400, 180  # 4 kat büyür: 1600×720 CSS pikseli, dikeyde ek yeri görünmeden tekrarlanır
KENAR = W - 26  # sağda 26 piksellik kabarık kenar payı (piksel.css'te genişlikle birlikte)
PALET = [(0, 0, 0), (255, 255, 255), (230, 238, 248), (214, 226, 240)]  # 0 saydam


def ciz():
    g = [bytearray(W) for _ in range(H)]
    v = 331

    def r():
        nonlocal v
        v = (v * 1664525 + 1013904223) & 0xFFFFFFFF
        return v / 4294967296

    def top(cx, cy, rr, renk):
        for y in range(-rr, rr + 1):
            w = round(math.sqrt(rr * rr - y * y))
            satir = g[(round(cy) + y) % H]  # dikeyde sarar: tekrar eden resimde ek yeri olmaz
            for x in range(max(0, round(cx) - w), min(W, round(cx) + w + 1)):
                satir[x] = renk

    for satir in g:
        satir[:KENAR] = bytes([1]) * KENAR
    # Gövdede kümeler: alt kenarları gölge tonunda, doku verir ama beyaz kalır
    for _ in range(W * H // 280):
        x, y, rr = r() * KENAR, r() * H, 4 + math.floor(r() * 7)
        top(x, y + 2, rr, 2)
        top(x, y, rr, 1)
    # Ortaya bakan kabarık kenar: büyük toplar, altta gölge
    y = 0
    while y < H:
        rr = 8 + math.floor(r() * 10)
        x = KENAR + rr * 0.35 - r() * 6
        top(x, y + 3, rr, 3)
        top(x, y, rr, 1)
        top(x - rr * 0.3, y - rr * 0.35, max(2, rr - 6), 1)
        y += 6 + math.floor(r() * 5)
    return g


def png(g):
    def parca(tur, veri):
        return struct.pack(">I", len(veri)) + tur + veri + struct.pack(">I", zlib.crc32(tur + veri))

    ham = b""
    for satir in g:
        bayt = bytearray(b"\0")
        for i in range(0, W, 4):
            d = satir[i:i + 4].ljust(4, b"\0")
            bayt.append(d[0] << 6 | d[1] << 4 | d[2] << 2 | d[3])
        ham += bytes(bayt)
    return (b"\x89PNG\r\n\x1a\n"
            + parca(b"IHDR", struct.pack(">IIBBBBB", W, H, 2, 3, 0, 0, 0))
            + parca(b"PLTE", bytes(c for p in PALET for c in p))
            + parca(b"tRNS", b"\0")
            + parca(b"IDAT", zlib.compress(ham, 9))
            + parca(b"IEND", b""))


def main():
    adres = "data:image/png;base64," + base64.b64encode(png(ciz())).decode()
    blok = BAS + "\n.px-bulut i{ background-image:url(" + adres + "), linear-gradient(var(--beyaz), var(--beyaz)); }\n" + SON
    metin = CSS.read_text(encoding="utf-8")
    desen = re.escape(BAS) + r".*?" + re.escape(SON)
    if not re.search(desen, metin, re.S):
        print("Piksel bulut: piksel.css'te işaretli blok yok.")
        return 1
    if "--denetle" in sys.argv:
        if blok not in metin:
            print("Piksel bulut: gömülü resim çizimle aynı değil; tools/piksel_bulut.py koş.")
            return 1
        print("Piksel bulut: temiz (%d bayt resim)." % len(adres))
        return 0
    CSS.write_text(re.sub(desen, lambda _: blok, metin, flags=re.S), encoding="utf-8", newline="\n")
    print("Piksel bulut yazıldı: %d bayt resim." % len(adres))
    return 0


if __name__ == "__main__":
    sys.exit(main())
