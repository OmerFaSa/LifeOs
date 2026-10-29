#!/usr/bin/env python3
"""Olu CSS: hicbir ogeye uyamayacak kurallari bulur (ister siler).

  python3 tools/olucss.py            # rapor (dosya basina olu kural)
  python3 tools/olucss.py --ayrinti  # her olu secici
  python3 tools/olucss.py --sil      # olu kurallari ve olu secicileri siler
  python3 tools/olucss.py --sina     # kendi sinamasi

Neden (2026-10-29): her arayuz ~7 500 kural tasiyor; stil hesabi acilista
75-100 ms. Bir kural ancak gerektirdigi her sinif bir ogede olabiliyorsa
yasar. Olcut STATIK ve muhafazakardir (kapsam olcumu degil: nadir durum,
palet, dar ekran olcumde gorunmez ama olu degildir):

  Sinif adi hicbir kaynak dosyada (JS, HTML, JSON, Swift, MD — uc arayuz,
  brand/, HKM/web, uygulama/) gecmiyorsa VE dinamik kurulmus olabilecek
  bir parcasi da yoksa ('kart--' + x, `kart--${x}`, `${x}__ad`) olu sayilir.

Yalniz kaynak CSS taranir (brand/ortak, brand/seviye, arayuzlerin kendi
dosyalari); uretilmis kopyalar --yay ile duzelir. Sozde-sinif ici (:not,
:is, :where, :has) gerekli sayilmaz; ters egik cizgili secici dokunulmaz.
Sonra: ortak.py --yay, seviye.py --yay, uc build.py."""
import re
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
URETILMIS = ("ÜRETİLMİŞ", "URETILMIS", "elle düzenlenmez", "elle duzenlenmez", "BURAYI DÜZENLEME")
METIN_UZANTI = {".js", ".html", ".json", ".swift", ".md", ".py", ".txt"}
ATLA = ("node_modules", "dist", ".git")


def css_kaynaklari():
    adaylar = sorted(KOK.glob("brand/ortak/*.css")) + sorted(KOK.glob("brand/seviye/**/*.css"))
    for m in ("AYS", "SPI", "ESP"):
        adaylar += sorted((KOK / m / "src" / "css").glob("*.css"))
    return [p for p in adaylar if not any(u in p.read_text(encoding="utf-8")[:600] for u in URETILMIS)]


def derlem():
    """Butun kaynak metni tek dizgede (css haric)."""
    parcalar = []
    for kok in ("AYS/src", "SPI/src", "ESP/src", "brand", "HKM/web", "uygulama", "belgeler/ekip"):
        for p in (KOK / kok).rglob("*"):
            if p.suffix in METIN_UZANTI and p.is_file() and not any(a in p.parts for a in ATLA):
                parcalar.append(p.read_text(encoding="utf-8", errors="replace"))
    return "\n".join(parcalar)


def yasar_mi(sinif, metin):
    if sinif in metin:
        return True
    # Bolme noktalari: ayirici dizileri ('kart--' + x, `${x}__ad`) ve sondaki
    # rakamlar ('pk-renk' + n). Her noktada bolmek her seyi canli sayardi.
    onler = {m.end() for m in re.finditer(r"[-_]+", sinif) if m.start()}
    arkalar = {m.start() for m in re.finditer(r"[-_]+", sinif) if m.start()}
    rakam = re.search(r"\d+$", sinif)
    if rakam and rakam.start():
        onler.add(rakam.start())
    if any(sinif[:i] + s in metin for i in onler for s in ("'", '"', "`", "${")):
        return True
    return any(s + sinif[i:] in metin for i in arkalar for s in ("}", "'", '"'))


def ust_virgulle_bol(s):
    parca, derin, bas = [], 0, 0
    for i, c in enumerate(s):
        if c in "([":
            derin += 1
        elif c in ")]":
            derin -= 1
        elif c == "," and derin == 0:
            parca.append(s[bas:i]); bas = i + 1
    parca.append(s[bas:])
    return parca


def gerekli_siniflar(secici):
    s = re.sub(r"\[[^\]]*\]", "", secici)            # [class*="x"] gibi oznitelik
    while True:                                      # :not(...) vb. ici gerekli degil
        y = re.sub(r":[\w-]+\([^()]*\)", "", s)
        if y == s:
            break
        s = y
    return re.findall(r"\.(-?[A-Za-z_][\w-]*)", s)


def secici_olu(secici, metin):
    if "\\" in secici:
        return False
    return any(not yasar_mi(c, metin) for c in gerekli_siniflar(secici))


def bloklar(css, bas=0, son=None):
    """(prelude_bas, suslu_ac, suslu_kapa) — yorum ve dizgi atlanir; ic ice @ kurallari icin."""
    son = len(css) if son is None else son
    i, pre = bas, bas
    while i < son:
        c = css[i]
        if css.startswith("/*", i):
            i = css.index("*/", i + 2) + 2
            if css[pre:i].strip().startswith("/*"):
                pre = i
            continue
        if c in "'\"":
            i = css.index(c, i + 1) + 1
            continue
        if c == ";":
            i += 1; pre = i
            continue
        if c == "{":
            derin, j = 1, i + 1
            while derin:
                if css.startswith("/*", j):
                    j = css.index("*/", j + 2) + 2; continue
                if css[j] in "'\"":
                    j = css.index(css[j], j + 1) + 1; continue
                derin += {"{": 1, "}": -1}.get(css[j], 0)
                j += 1
            yield pre, i, j - 1
            i = pre = j
            continue
        i += 1


def temizle(css, metin, rapor):
    """Olu kurallar silinmis css."""
    kes = []   # (bas, son, yeni)
    for pre, ac, kapa in bloklar(css):
        bas = pre + (len(css[pre:ac]) - len(css[pre:ac].lstrip()))
        prelude = css[bas:ac].strip()
        if prelude.startswith("@"):
            ad = prelude.split()[0].split("(")[0].lower()
            if ad in ("@media", "@supports", "@layer", "@container", "@document"):
                ic = temizle(css[ac + 1:kapa], metin, rapor)
                if not ic.strip():
                    kes.append((bas, kapa + 1, ""))
                elif ic != css[ac + 1:kapa]:
                    kes.append((ac + 1, kapa, ic))
            continue
        seciciler = ust_virgulle_bol(prelude)
        olu = [s for s in seciciler if secici_olu(s, metin)]
        if not olu:
            continue
        rapor.extend(s.strip() for s in olu)
        if len(olu) == len(seciciler):
            kes.append((bas, kapa + 1, ""))
        else:
            kalan = [s.strip() for s in seciciler if s not in olu]
            bosluk = css[bas:ac][len(css[bas:ac].rstrip()):]
            kes.append((bas, ac, (",\n" if "\n" in prelude else ", ").join(kalan) + bosluk))
    for b, s, y in reversed(kes):
        css = css[:b] + y + css[s:]
    return re.sub(r"\n[ \t]*\n(?:[ \t]*\n)+", "\n\n", css)


def sina():
    metin = "el.className = 'kart kart--' + tur; `ozet${x}__ad`; q('.canli'); 'is-' + a; 'pk-renk' + n"
    css = ("/* c */\n.canli{a:b}\n.olu{a:b}\n.canli, .olu2{a:b}\n.kart--mavi{a:b}\n.pk-renk2{a:b}\n"
           ".x__ad{a:b}\n.is-acik{a:b}\n@media (x){.olu3{a:b}}\n@media (y){.canli{a:b} .olu4{c:d}}\n"
           ".canli:not(.olu5){a:b}\n.a\\:b{a:b}\n@keyframes k{from{a:b}}\n.s[data-x=\"{\"]{a:b}\n")
    r = []
    y = temizle(css, metin, r)
    assert r == [".olu", ".olu2", ".olu3", ".olu4"], r
    for kalir in (".canli{a:b}", ".kart--mavi", ".pk-renk2", ".x__ad", ".is-acik", "@media (y){.canli{a:b}", ".canli:not(.olu5)", ".a\\:b", "@keyframes", "/* c */"):
        assert kalir in y, (kalir, y)
    assert "\n.canli{a:b}\n.kart" in y and "@media (x)" not in y and ".olu4" not in y, y
    print("olucss sinama: temiz")


def main():
    if "--sina" in sys.argv:
        return sina()
    metin = derlem()
    toplam_k = toplam_b = 0
    for p in css_kaynaklari():
        css = p.read_text(encoding="utf-8")
        rapor = []
        yeni = temizle(css, metin, rapor)
        if not rapor:
            continue
        fark = len(css.encode()) - len(yeni.encode())
        toplam_k += len(rapor); toplam_b += fark
        print("%5d secici %6.1f KB  %s" % (len(rapor), fark / 1024, p.relative_to(KOK).as_posix()))
        if "--ayrinti" in sys.argv:
            for s in rapor:
                print("        " + s.replace("\n", " ")[:110])
        if "--sil" in sys.argv:
            p.write_text(yeni, encoding="utf-8", newline="")
    print("Toplam: %d olu secici, %.1f KB%s" % (toplam_k, toplam_b / 1024, " silindi" if "--sil" in sys.argv else ""))


if __name__ == "__main__":
    main()
