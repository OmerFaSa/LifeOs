#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PARCA KAYDI — sayfalarin yukledigi dosyalar tek listeden uretilir.

   NEDEN

   Yeni bir ortak ozellik (agharita, 2026-10) sekiz listeye elle yazildi:
   uc index.html, uc tests/index.html, tools/ortak.py ve CSS sirasi. Bir
   satir unutulursa dosya hic yuklenmez. Artik tek satir yeter:

     brand/parcalar.txt      sira burada; satir sonunda modul yazmazsa ucunde
     python3 tools/parca.py --yay       sayfalardaki bloklari yeniden yazar
     python3 tools/parca.py --denetle   sayfalar kayitla ayni mi (CI de kosar)

   `tools/ortak.py --yay` ve `--denetle` bunu kendisi cagirir.

   Bolumler: [bas] [govde] -> src/index.html, [test] -> src/tests/index.html.
   Perde betigini brand/seviye/perde.html yazar (tools/seviye.py), bu kayit degil.
   brand/ortak/x.test.js varsa ve [govde]'de js/core/x.js duruyorsa testi
   [test]'e kendiliginden eklenir; yeni parca icin test satiri yazilmaz.
   Sira anlamlidir (kaynak: bas'taki stil sirasi kuralin kendisidir), bu yuzden
   sayfalar blogun DISINDA hicbir sey kaybetmez, blok yalniz etiketlerden olusur."""
import re
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
KAYIT = KOK / "brand" / "parcalar.txt"
ORTAK = KOK / "brand" / "ortak"
SISTEMLER = {"AYS": "ays", "SPI": "spi", "ESP": "esp"}
SAYFA = {"bas": "index.html", "govde": "index.html",
         "test": "tests/index.html"}
ACIK = '<!-- PARCA:%s · uretilmis (brand/parcalar.txt, tools/parca.py); elle duzenleme -->'
KAPA = '<!-- /PARCA:%s -->'


def kayit_oku(metin=None):
    """{bolum: [(yol, {modul...} ya da None)]}"""
    metin = KAYIT.read_text(encoding="utf-8") if metin is None else metin
    out, bolum = {b: [] for b in SAYFA}, None
    for n, ham in enumerate(metin.splitlines(), 1):
        s = ham.split("#", 1)[0].strip()
        if not s:
            continue
        m = re.fullmatch(r"\[(\w+)\]", s)
        if m:
            bolum = m.group(1)
            if bolum not in out:
                raise SystemExit("parcalar.txt:%d bilinmeyen bolum: %s" % (n, bolum))
            continue
        if bolum is None:
            raise SystemExit("parcalar.txt:%d bolumden once satir" % n)
        p = s.split()
        moduller = set(p[1:]) or None
        if moduller and moduller - set(SISTEMLER.values()):
            raise SystemExit("parcalar.txt:%d bilinmeyen modul: %s" % (n, s))
        out[bolum].append((p[0], moduller))
    return out


def etiket(yol):
    if yol.endswith(".css"):
        return '<link rel="stylesheet" href="%s"/>' % yol
    return '<script src="%s"></script>' % yol


def liste(k, bolum, modul):
    """Bir modulun o bolumdeki sirali dosyalari."""
    l = [y for y, m in k[bolum] if m is None or modul in m]
    if bolum == "test":
        # shortcut: yalniz brand/ortak/x.test.js kalibini bilir; modulun kendi testi [test]'e elle yazilir.
        for y in [y for y in liste(k, "govde", modul) if y.startswith("js/core/")]:
            ad = Path(y).stem
            if (ORTAK / (ad + ".test.js")).exists() and ad + ".test.js" not in l:
                if "../" + y not in l:
                    l.append("../" + y)
                l.append(ad + ".test.js")
    return l


def sayfa_uret(metin, k, modul, bolumler):
    for b in bolumler:
        blok = re.compile(r"[ \t]*" + re.escape(ACIK % b) + r".*?" + re.escape(KAPA % b), re.S)
        if not blok.search(metin):
            raise SystemExit("sayfada blok yok: PARCA:%s" % b)
        nl = "\r\n" if "\r\n" in metin else "\n"
        yeni = nl.join([ACIK % b] + [etiket(y) for y in liste(k, b, modul)] + [KAPA % b])
        metin = blok.sub(lambda _: yeni, metin, count=1)
    return metin


def sayfalar():
    for klasor, modul in SISTEMLER.items():
        for rel in sorted(set(SAYFA.values())):
            yol = KOK / klasor / "src" / rel
            if yol.exists():
                yield yol, modul, [b for b, s in SAYFA.items() if s == rel]


def _oku(yol):
    with open(yol, encoding="utf-8", newline="") as f:
        return f.read()


REHBER = ORTAK / "parca-rehber.js"
KING_ALANI = re.compile(r"sayfa\(\{\s*id:'(\w+)',\s*modul:'(\w+)',\s*king:\{ sira:(\d+), ad:'([^']+)', es:\[([^\]]*)\] \}")


def rehber_uret():
    """King baska modulun ekranini yuklemez; sayfalari bu uretilmis listeden tanir."""
    satir = []
    for klasor in SISTEMLER:
        for f in sorted((KOK / klasor / "src" / "js" / "screens").glob("*.js")):
            for m in KING_ALANI.finditer(_oku(f)):
                satir.append((int(m.group(3)), m.group(2), m.group(1), m.group(4), m.group(5)))
    satir.sort()
    if len({x[0] for x in satir}) != len(satir):
        raise SystemExit("King rehberinde ayni sira iki kez: " + str([x[0] for x in satir]))
    return ("/* URETILDI: tools/parca.py, sayfa kayitlarindaki `king` alanindan. Elle duzenleme. */\n"
            "window.LIFEOS = window.LIFEOS || {};\n"
            "window.LIFEOS.PARCA_REHBER = [\n"
            + "".join("  { modul:'%s', route:'%s', ad:'%s', es:[%s] },\n" % x[1:] for x in satir)
            + "];\n")


def rehber_yaz():
    yeni = rehber_uret()
    if not REHBER.exists() or _oku(REHBER) != yeni:
        with open(REHBER, "w", encoding="utf-8", newline="") as f:
            f.write(yeni)


def yay():
    rehber_yaz()
    k, degisen = kayit_oku(), 0
    for yol, modul, bolumler in sayfalar():
        eski = _oku(yol)
        yeni = sayfa_uret(eski, k, modul, bolumler)
        if yeni != eski:
            with open(yol, "w", encoding="utf-8", newline="") as f:
                f.write(yeni)
            degisen += 1
    print("parca: %d sayfa yenilendi" % degisen)
    return 0


def denetle():
    k, kotu = kayit_oku(), []
    if not REHBER.exists() or _oku(REHBER) != rehber_uret():
        kotu.append("brand/ortak/parca-rehber.js sayfalarla ayni degil (tools/parca.py --yay)")
    for yol, modul, bolumler in sayfalar():
        eski = _oku(yol)
        if sayfa_uret(eski, k, modul, bolumler) != eski:
            kotu.append(str(yol.relative_to(KOK)))
        src = yol.parent if yol.name == "index.html" and yol.parent.name == "src" else yol.parent.parent
        for b in bolumler:
            for y in liste(k, b, modul):
                hedef = (yol.parent / y).resolve()
                if not hedef.exists():
                    kotu.append("%s: %s yok" % (yol.relative_to(KOK), y))
    for s in kotu:
        print("PARCA UYUSMAZ:", s)
    if not kotu:
        print("parca: sayfalar kayitla ayni")
    return 1 if kotu else 0


def main():
    if "--yay" in sys.argv:
        return yay()
    if "--denetle" in sys.argv:
        return denetle()
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main())
