#!/usr/bin/env python3
"""Yazi tiplerini CSS'e gomer: src/fonts/*.woff2 -> src/css/fonts.css

Neden gomuyoruz: uygulama cevrimdisi calisabilmeli ama iki yazi ailesi
Google Fonts'tan iniyordu ve bu istek ACILISI KILITLIYORDU. Olculdu:
ag varken ilk cizim 12.552 ms, CDN yanit vermiyorken uygulama HIC
acilmiyordu. Tamami agdan.

Ayni is SPI tarafinda da yapildi ve oradaki olcum sonrasi ilk cizimi
80 ms'e indirdi; dosyalar ayni alt kumelerdir.

Dosyalar Turkce icin gereken karakterlere indirgenmis degisken
yazi tipleridir. Toplam ~52 KB; base64 sisirmesiyle ~70 KB.
Bir defa iner, sonra hicbir sey beklemez.

Kullanim:  python tools/fonts.py
"""

import base64
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
FONT = KOK / "src" / "fonts"
CIKTI = KOK / "src" / "css" / "fonts.css"

# latin ve latin-ext ayri @font-face olarak durur: tarayici yalnizca
# sayfada gecen karakterlerin oldugu dilimi COZER. Birlestirmek her
# sayfada iki katini cozdurur.
ARALIK = {
    "latin": ("U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,"
              "U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,"
              "U+2193,U+2212,U+2215,U+FEFF,U+FFFD"),
    "latin-ext": ("U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,"
                  "U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,"
                  "U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,"
                  "U+A720-A7FF"),
}

AILELER = [
    ("Newsreader", "newsreader", "300 600", "normal"),
    ("Manrope",    "manrope",    "500 800", "normal"),
    ("Inter",      "inter",      "400 700", "normal"),
]


def main():
    parcalar = [
        "/* YAZI TİPLERİ — gömülü, ağdan inmez.\n"
        "\n"
        "   Bu dosya elle düzenlenmez: `python tools/fonts.py` üretir.\n"
        "\n"
        "   Üç aile de DEĞİŞKEN yazı tipidir; tek dosya bütün ağırlıkları\n"
        "   taşır. Türkçe için gereken karakterlere indirgenmiştir —\n"
        "   Latin Extended'in tamamı taşınmaz. Yazılmayan bir karakter\n"
        "   (örneğin bir notta geçen «ñ») sistem yazı tipine düşer;\n"
        "   düzen bozulmaz.\n"
        "\n"
        "   Newsreader'ın optik boyut ekseni 24'e sabitlendi: gözle ayırt\n"
        "   edilmeyecek bir fark, dosyanın yarısı. */\n"
    ]
    toplam = 0
    for aile, dosya_adi, agirlik, stil in AILELER:
        for alt, aralik in ARALIK.items():
            yol = FONT / f"{dosya_adi}-{alt}.woff2"
            if not yol.exists():
                raise SystemExit(f"HATA: {yol} yok")
            ham = yol.read_bytes()
            toplam += len(ham)
            b64 = base64.b64encode(ham).decode("ascii")
            parcalar.append(
                "@font-face{\n"
                f"  font-family:'{aile}';\n"
                f"  font-style:{stil};\n"
                f"  font-weight:{agirlik};\n"
                "  font-display:block;\n"
                f"  src:url(data:font/woff2;base64,{b64}) format('woff2');\n"
                f"  unicode-range:{aralik};\n"
                "}\n"
            )
    CIKTI.write_text("\n".join(parcalar), encoding="utf-8")
    print(f"OK   {CIKTI}")
    print(f"     {toplam/1024:.1f} KB yazı tipi -> {CIKTI.stat().st_size/1024:.1f} KB css")


if __name__ == "__main__":
    main()
