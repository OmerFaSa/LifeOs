# -*- coding: utf-8 -*-
"""PDF yazici (core/pdf.py) — dis kutuphanesiz, yapisal olarak sinanir.

   Kanitladigi sozler:
     1. Yazi tipi yoksa PDF uretilmez ve bu SOYLENIR.
     2. Dosya tutarlidir: xref'teki her konum dogru nesneyi gosterir.
     3. Metin geri okunur: ToUnicode eslemesiyle Turkce harfler dahil.
     4. Yazi tipi alt kumelenir: yalniz kullanilan glifler veri tasir.
     5. Sunum kapak + yatay slaytlardir; uzun tablo sayfalara bolunur ve
        her sayfada alt bilgi (etiket, sayfa X/Y) vardir.

   Makinede Turkce harfli bir TrueType yazi tipi yoksa yalniz 1. soz
   sinanir; bu bir basari degil, bir olcum eksigidir ve oyle yazilir."""
import os
import re
import tempfile
import zlib

from core import cikti, pdf, urunler
from tests.harness import eq, no, ok, suite, test


def _nesneler(bayt):
    out = {}
    for m in re.finditer(rb"(\d+) 0 obj\n(.*?)\nendobj", bayt, re.S):
        out[int(m.group(1))] = m.group(2)
    return out


def _akis(govde):
    m = re.search(rb"stream\n(.*)\nendstream", govde, re.S)
    return zlib.decompress(m.group(1)) if m else b""


def _metin(bayt):
    """Butun sayfalarin metni: Tj hex glifleri ToUnicode ile cozulur."""
    nes = _nesneler(bayt)
    esle = {}
    for n, g in nes.items():
        if b"/Subtype /Type0" in g:
            tu = int(re.search(rb"/ToUnicode (\d+) 0 R", g).group(1))
            cm = _akis(nes[tu]).decode("ascii")
            f = {}
            for gid, u in re.findall(r"<([0-9A-F]{4})> <([0-9A-F]+)>", cm):
                f[gid] = bytes.fromhex(u).decode("utf-16-be")
            esle[n] = f
    sayfa_metni = []
    for n, g in nes.items():
        if b"/Type /Page " in g or g.startswith(b"<< /Type /Page /"):
            kaynak = {k.decode(): int(v) for k, v in re.findall(rb"/(F\d) (\d+) 0 R", g)}
            c = int(re.search(rb"/Contents (\d+) 0 R", g).group(1))
            parca = []
            for f, hx in re.findall(r"/(F\d) [\d.]+ Tf .*? <([0-9A-F]*)> Tj",
                                    _akis(nes[c]).decode("latin-1")):
                tablo = esle[kaynak[f]]
                parca.append("".join(tablo.get(hx[i:i + 4], "?") for i in range(0, len(hx), 4)))
            sayfa_metni.append(" ".join(parca))
    return sayfa_metni


def _belge(g, dogruluk="kaynakli"):
    return cikti.belge({"id": 7, "tur": "materyal", "baslik": "x", "dogruluk": dogruluk,
                        "created_at": "2026-09-23", "govde": g})


OZET = {"baslik": "Kurtuluş Savaşı", "alt_baslik": "ğüşıöç İĞÜŞÖÇ", "bolumler": [
    {"baslik": "Giriş", "bloklar": [{"t": "p", "metin": "Milli mücadele 1919'da başladı [1]."},
                                    {"t": "liste", "maddeler": ["Amasya", "Sivas"]}]}]}
KAYNAK = [{"n": 1, "baslik": "Vikipedi", "url": "https://tr.wikipedia.org/wiki/X", "alan": "x",
           "erisim": "2026-09-23"}]


def run():
    suite("pdf")
    yt = pdf.yazi_tipi_bul()

    def t_yazi_tipi_yok():
        r = pdf.belge_pdf(_belge(urunler.ayikla("ozet", OZET)[0]), yazi_tipleri=(None, None))
        no(r["ok"])
        ok("TrueType" in r["note"] and "HTML" in r["note"])
    test("yazi tipi yoksa PDF yok ve bu soylenir", t_yazi_tipi_yok)

    if not yt[0]:
        test("OLCULMEDI: makinede Turkce harfli TrueType yazi tipi yok", lambda: None)
        return

    def t_tutarlilik_ve_metin():
        g, _ = urunler.ayikla("ozet", OZET, KAYNAK)
        r = pdf.belge_pdf(_belge(g))
        ok(r["ok"], r.get("note"))
        b = r["bayt"]
        ok(b.startswith(b"%PDF-1.7") and b.rstrip().endswith(b"%%EOF"))
        xref = int(re.search(rb"startxref\n(\d+)", b).group(1))
        eq(b[xref:xref + 4], b"xref")
        konumlar = re.findall(rb"(\d{10}) 00000 n ", b[xref:])
        for i, k in enumerate(konumlar):
            eq(b[int(k):int(k) + len(b"%d 0 obj" % (i + 1))], b"%d 0 obj" % (i + 1))
        m = " ".join(_metin(b))
        ok("Kurtuluş Savaşı" in m and "ğüşıöç İĞÜŞÖÇ" in m, m[:200])
        ok("sayfa 1/1" in m and "kaynaklı" in m.lower())
        ok("[1] Vikipedi" in m)
    test("xref tutarli; metin ToUnicode ile geri okunur", t_tutarlilik_ve_metin)

    def t_alt_kume():
        g, _ = urunler.ayikla("ozet", OZET)
        b = pdf.belge_pdf(_belge(g))["bayt"]
        nes = _nesneler(b)
        ff = next(n for n, x in nes.items() if b"/Length1 " in x)
        font = _akis(nes[ff])
        ok(len(font) < os.path.getsize(yt[0].yol) * 0.5, "alt kume kucuk olmali")
        with tempfile.NamedTemporaryFile(suffix=".ttf", delete=False) as f:
            f.write(font)
        try:
            k = pdf.YaziTipi(f.name)
        finally:
            os.unlink(f.name)
        eq(k.n, yt[0].n, "glif numaralari degismez")
        ok(len(k._glif(k.gid("ş"))) > 0 or len(k._glif(k.gid("K"))) > 0)
        eq(len(k._glif(k.gid("Q"))), 0, "kullanilmayan glif veri tasimaz")
    test("yazi tipi alt kumelenir ve yeniden okunur", t_alt_kume)

    def t_sunum_ve_tablo():
        g, _ = urunler.ayikla("sunum", {"baslik": "Fotosentez", "slaytlar": [
            {"baslik": "Nedir?", "maddeler": ["Işık enerjisi"] * 8, "not": "Kısa anlat."},
            {"baslik": "Denklem", "maddeler": ["6CO₂ + 6H₂O"]}]})
        b = pdf.belge_pdf(_belge(g, "dogrulanmadi"))
        eq(b["sayfa"], 3)                                   # kapak + 2 slayt
        ok(b"/MediaBox [0 0 841.89 473.56]" in b["bayt"])
        uzun = {"baslik": "Tablo", "bolumler": [{"baslik": "Uzun", "bloklar": [
            {"t": "tablo", "basliklar": ["A", "B"],
             "satirlar": [["satır %d" % i, "değer " * 6] for i in range(90)]}]}]}
        g2, _ = urunler.ayikla("karsilastirma", uzun)
        eq(len(g2["bolumler"][0]["bloklar"][0]["satirlar"]), 40)   # katalog siniri
        r = pdf.belge_pdf(_belge(g2))
        ok(r["sayfa"] >= 2)
        sayfalar = _metin(r["bayt"])
        ok(all(("sayfa %d/%d" % (i + 1, len(sayfalar))) in s for i, s in enumerate(sayfalar)))
        pk, _ = urunler.ayikla("pankart", {"baslik": "Su iç", "maddeler": ["Bir", "İki"]})
        eq(pdf.belge_pdf(_belge(pk))["sayfa"], 1, "afis basligin altina ayni sayfada")
    test("sunum kapak + yatay slayt; uzun tablo bolunur; afis tek sayfa", t_sunum_ve_tablo)
