#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Vitrindeki kartların GÖRÜNÜMÜNÜ sisteme taşır.

   NE İŞE YARAR

   `ekip/vitrin.html` 183 kartın onaylanmış görünümüdür (katalog). Kartın
   biçimi orada bir kez yazılır; sistem aynı biçimi ikinci kez elle
   yazarsa iki kopya bir gün ayrışır. Bu araç vitrinin kart kurallarını
   çıkarır ve `brand/ortak/vitrin.css`'e yazar; oradan `tools/ortak.py
   --yay` üç arayüze dağıtır.

       python3 tools/vitrin.py            # brand/ortak/vitrin.css'i yazar
       python3 tools/vitrin.py --denetle  # yazılı kopya taze mi (CI)

   ------------------------------------------------------------------
   NE DEĞİŞİR

   1. KAPSAM. Her seçicinin önüne `.vk ` gelir: vitrinin `.cap`, `.kt`,
      `.mod` gibi kısa adları sistemin kendi sınıflarına dokunmaz.
      Kartın kökü `<div class="vk" data-oz="NNN"><div class="d xNN">`.
   2. JETONLAR. Vitrinin `--ink`, `--s1`, `--l1`… adları `--vk-` önekini
      alır ve `.vk` içinde SİSTEMİN jetonlarına bağlanır: tema, kontrast
      ve modül rengi sistemden gelir. Önek şart: sistemin `--ink`'i koyu
      temada düğme zeminidir, vitrininki yazı rengi.
   3. DEMO DÖNGÜSÜ YOK. Vitrin bir davranışı sonsuz döngüyle GÖSTERİR
      (kart çevrilir, sayı yuvarlanır). Sistemde hareket yalnız gerçek
      bir olayla olur; `infinite` animasyonlar atılır, anahtar kareler
      `vk-` önekiyle kalır.
   4. KATALOG KABUĞU atılır (galeri ızgarası, çekmece, liste görünümü):
      yalnız kartların kendisi ve ortak minik parçalar taşınır.
"""

import re
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
KAYNAK = KOK / "ekip" / "vitrin.html"
HEDEF = KOK / "brand" / "ortak" / "vitrin.css"

# Vitrinin kendi jetonları; `.vk` içinde sistemin jetonuna bağlanır.
JETON = ["s1", "s2", "s3", "s4", "l1", "l2", "ink", "ink2", "ink3", "ink4",
         "iyi", "kotu", "on", "golge", "sans", "serif", "mono",
         "bronz", "gumus", "altin", "yakut", "safir", "kutsal"]

BAGLAR = """.vk{
  --vk-s1:var(--surface);--vk-s2:var(--surface-2);--vk-s3:var(--surface-3);
  --vk-s4:var(--border-strong);
  --vk-l1:var(--border);--vk-l2:var(--border-strong);
  --vk-ink:var(--text);--vk-ink2:var(--text-2);--vk-ink3:var(--text-3);
  --vk-ink4:color-mix(in oklab,var(--text-3) 45%,var(--surface));
  --vk-iyi:var(--ok-ink);--vk-kotu:var(--bad-ink);--vk-on:var(--surface);
  --vk-golge:var(--shadow-lg);
  --vk-sans:var(--font-body);
  --vk-serif:'Newsreader',Georgia,'Times New Roman',serif;
  --vk-mono:ui-monospace,'SF Mono','Cascadia Mono',Menlo,Consolas,'DejaVu Sans Mono',monospace;
  --vk-bronz:#B87333;--vk-gumus:#C9CDD3;--vk-altin:#E3B341;
  --vk-yakut:#B31432;--vk-safir:#1E3FA8;--vk-kutsal:#C9A227;
  color:var(--vk-ink);font:13px/1.5 var(--vk-sans);
  -webkit-font-smoothing:antialiased;min-width:0
}
.vk *{box-sizing:border-box;margin:0}
.vk :is(button,input){font:inherit;color:inherit;border:0;background:none}
.vk button{cursor:pointer}
.vk button:focus-visible,.vk input:focus-visible{outline:2px solid var(--ring,var(--ays));outline-offset:2px;border-radius:6px}
.vk>.d{width:100%}
.vk .mono{font-family:var(--vk-mono);font-variant-numeric:tabular-nums}
.vk .serif{font-family:var(--vk-serif);font-weight:400}
.vk svg.i{width:14px;height:14px;flex:none;stroke:currentColor;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.vk .c-ays{--c:var(--ays)}.vk .c-spi{--c:var(--spi)}.vk .c-esp{--c:var(--esp)}.vk .c-mer{--c:var(--mer)}
"""

BASLIK = """/* VİTRİN KARTLARI — ÜRETİLMİŞ DOSYA, ELLE DÜZENLEME.
   Kaynak `ekip/vitrin.html` (kart kuralları); `python3 tools/vitrin.py`
   yazar, `tools/ortak.py --yay` üç arayüze dağıtır. Kural: kartın
   biçimi vitrinde değişir, burada değil. Ayrıntı: tools/vitrin.py. */
"""

# Galeri kabuğu: kartın kendisi değil, kataloğun iskeleti.
KABUK_BOLUMLERI = ("KATALOG KABUGU", "SURUM 3 · KABUK", "SURUM 4 · KABUK")


def bolumler(css):
    """`/* ===== AD ===== */` başlıklarına göre (ad, gövde) çiftleri."""
    parca = re.split(r"/\* =+ (.+?) =+ \*/", css)
    yield "BAS", parca[0]
    for i in range(1, len(parca), 2):
        yield parca[i].strip(), parca[i + 1]


def kurallar(css):
    """Üst düzey kurallar: (başlık, gövde). @media gövdesi iç içedir."""
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    i, n = 0, len(css)
    while i < n:
        j = css.find("{", i)
        if j < 0:
            return
        bas = css[i:j].strip()
        derin, k = 1, j + 1
        while k < n and derin:
            if css[k] == "{":
                derin += 1
            elif css[k] == "}":
                derin -= 1
            k += 1
        yield bas, css[j + 1:k - 1]
        i = k


def bol_virgul(secici):
    parca, derin, bas = [], 0, 0
    for i, ch in enumerate(secici):
        if ch in "([":
            derin += 1
        elif ch in ")]":
            derin -= 1
        elif ch == "," and derin == 0:
            parca.append(secici[bas:i])
            bas = i + 1
    parca.append(secici[bas:])
    return [p.strip() for p in parca if p.strip()]


def kapsa(secici):
    """Her seçiciye `.vk ` öneki; vitrinin açık tema kuralı sistemin
    açık temasına çevrilir (vitrinin varsayılanı koyu, sistemin açık)."""
    acik, cikti = False, []
    for s in bol_virgul(secici):
        if s.startswith('[data-theme="acik"]'):
            acik = True
            s = s[len('[data-theme="acik"]'):].strip()
        cikti.append(".vk " + s)
    return acik, ",".join(cikti)


def jetonla(govde):
    ad = "|".join(sorted(JETON, key=len, reverse=True))
    govde = re.sub(r"var\(--(%s)\b(?![-\w])" % ad, r"var(--vk-\1", govde)
    govde = re.sub(r"(?<![-\w])--(%s):" % ad, r"--vk-\1:", govde)
    return govde


def ayikla(govde):
    """Sonsuz demo animasyonu atılır; anahtar kare adları öneklenir."""
    beyan = [b for b in govde.split(";") if b.strip()]
    kalan = []
    for b in beyan:
        ad = b.split(":", 1)[0].strip()
        if ad in ("animation", "animation-iteration-count") and "infinite" in b:
            continue
        if ad in ("animation", "animation-name"):
            b = re.sub(r"(:\s*)([a-z][\w-]*)", lambda m: m.group(1) + "vk-" + m.group(2), b, count=1)
        kalan.append(b.strip())
    return jetonla(";".join(kalan))


def yaz_kurallar(css, cikti, acik_cikti):
    for bas, govde in kurallar(css):
        if bas.startswith("@keyframes"):
            ad = bas.split()[1]
            cikti.append("@keyframes vk-%s{%s}" % (ad, jetonla(govde)))
        elif bas.startswith("@media"):
            ic, ic_acik = [], []
            yaz_kurallar(govde, ic, ic_acik)
            if ic:
                cikti.append("%s{\n%s\n}" % (bas, "\n".join(ic)))
        else:
            acik, sec = kapsa(bas)
            g = ayikla(govde)
            if not g:
                continue
            (acik_cikti if acik else cikti).append("%s{%s}" % (sec, g))


def uret():
    html = KAYNAK.read_text(encoding="utf-8")
    css = html[html.index("<style>") + 7:html.index("</style>")]
    cikti, acik = [], []
    for ad, govde in bolumler(css):
        if ad == "BAS" or ad in KABUK_BOLUMLERI:
            continue
        cikti.append("\n/* ---- %s ---- */" % ad.lower())
        yaz_kurallar(govde, cikti, acik)
    son = BASLIK + BAGLAR + "\n".join(cikti) + "\n"
    if acik:
        # Vitrinin açık teması = sistemin açık teması (elle ya da tercih).
        son += "\n/* ---- açık tema ---- */\n"
        son += "\n".join(r.replace(".vk ", ':root[data-theme="light"] .vk ') for r in acik) + "\n"
        son += "@media not (prefers-color-scheme:dark){\n"
        son += "\n".join(r.replace(".vk ", ':root:not([data-theme="dark"]) .vk ') for r in acik) + "\n}\n"
    return son


def main(argv):
    yeni = uret()
    if "--denetle" in argv:
        eski = HEDEF.read_text(encoding="utf-8") if HEDEF.exists() else ""
        if eski != yeni:
            print("KIRMIZI: brand/ortak/vitrin.css vitrinden bayat. "
                  "`python3 tools/vitrin.py` sonra `tools/ortak.py --yay`.")
            return 1
        print("vitrin.css taze (%d kural)." % yeni.count("{"))
        return 0
    HEDEF.write_text(yeni, encoding="utf-8")
    print("yazıldı: %s (%d bayt)" % (HEDEF.relative_to(KOK), len(yeni.encode("utf-8"))))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
