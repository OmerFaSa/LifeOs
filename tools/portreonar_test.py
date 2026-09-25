#!/usr/bin/env python3
"""`marka.py --onar` (doldur) testi. Pillow yoksa atlanir (CI'nin hizli
isinde Pillow yok; kapi yine `isle`dedir).

   python3 tools/portreonar_test.py     (cikis 0 temiz, 1 kirmizi)

Sozler: delik (alfa<128) kalmaz; bilinen piksel DEGISMEZ; doldurulan
piksel komsularina yakin (duz zeminde ayni renk); deliksiz portre aynen."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
try:
    from PIL import Image
except ImportError:
    print("Pillow yok; portre onarim testi atlandi.")
    sys.exit(0)
import marka  # noqa: E402

kirmizi = 0


def dogru(ad, kosul):
    global kirmizi
    print(("  ✓ " if kosul else "  ✕ ") + ad)
    if not kosul:
        kirmizi += 1


# Duz zeminli portre: 40x50, sol yari (200,190,180), sag yari (60,70,80);
# sol yarida 8x8 delik ve ustte 1 piksellik kenar cizgisi (alfa 0).
im = Image.new("RGBA", (40, 50))
im.putdata([((200, 190, 180, 255) if x < 20 else (60, 70, 80, 255))
            for y in range(50) for x in range(40)])
for y in range(20, 28):
    for x in range(5, 13):
        im.putpixel((x, y), (0, 0, 0, 0))
for x in range(40):
    im.putpixel((x, 0), (0, 0, 0, 0))
dogru("girdi delikli", marka.saydam_oran(im) > 0)

o = marka.doldur(im)
dogru("delik kalmadı", marka.saydam_oran(o.convert("RGBA")) == 0)
dogru("bilinen piksel değişmedi",
      all(o.getpixel((x, y)) == im.getpixel((x, y))[:3]
          for y in range(50) for x in range(40) if im.getpixel((x, y))[3] >= 128))
dogru("düz zemindeki delik zemin rengiyle doldu", o.getpixel((8, 23)) == (200, 190, 180))
dogru("kenar çizgisi alttaki renkle doldu",
      o.getpixel((3, 0)) == (200, 190, 180) and o.getpixel((35, 0)) == (60, 70, 80))

temiz = Image.new("RGB", (10, 10), (10, 20, 30))
dogru("deliksiz portre aynen döner", list(marka.doldur(temiz).getdata()) == list(temiz.getdata()))

print("\nPortre onarımı: %s" % ("temiz" if not kirmizi else "%d kırmızı" % kirmizi))
sys.exit(1 if kirmizi else 0)
