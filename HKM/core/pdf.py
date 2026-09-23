# -*- coding: utf-8 -*-
"""PDF yazici — yalniz Python standart kutuphanesi (AGENTS.md §1.3).

   BAM'in her kaydi (core/cikti.py belge modeli) PDF olarak basilir:
   ozet, rapor, ders notu, sunum, test kitabi, pankart, zihin haritasi…

   Turkce harfler (ğ ş ı İ) PDF'in yerlesik yazi tiplerinde YOKTUR. Bu
   yuzden sistemdeki bir TrueType yazi tipi bulunur, YALNIZ kullanilan
   harflerle alt kumelenir ve gomulur (CIDFontType2, Identity-H). Metin
   kopyalanabilsin ve aranabilsin diye ToUnicode eslemesi eklenir.

   Dort kural:
   1. YAZI TIPI YOKSA PDF YOK — ve bu SOYLENIR. Harfleri bozuk bir PDF,
      hic olmayan PDF'ten kotudur; HTML bicimi her zaman vardir.
   2. LISANS: gomulmeye izin vermeyen yazi tipi (OS/2 fsType) kullanilmaz.
   3. OLCU GERCEKTIR: satir kirimi yazi tipinin kendi genislikleriyle yapilir.
   4. ETIKET HER SAYFADA: alt bilgide kayit, tarih, etiket ve sayfa X/Y."""
import glob
import hashlib
import os
import struct
import zlib

A4 = (595.28, 841.89)
SLAYT = (841.89, 473.56)
KENAR = 50
ALT_BOSLUK = 34

ADAYLAR = {
    "normal": ["DejaVuSans.ttf", "LiberationSans-Regular.ttf", "NotoSans-Regular.ttf",
               "Arial.ttf", "arial.ttf", "segoeui.ttf", "calibri.ttf", "FreeSans.ttf"],
    "kalin": ["DejaVuSans-Bold.ttf", "LiberationSans-Bold.ttf", "NotoSans-Bold.ttf",
              "Arial Bold.ttf", "arialbd.ttf", "segoeuib.ttf", "calibrib.ttf", "FreeSansBold.ttf"],
}
KLASORLER = [os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                          "brand", "fonts"),
             "/usr/share/fonts", "/usr/local/share/fonts", os.path.expanduser("~/.fonts"),
             os.path.expanduser("~/.local/share/fonts"), "/System/Library/Fonts",
             "/System/Library/Fonts/Supplemental", "/Library/Fonts",
             os.path.expanduser("~/Library/Fonts"), "C:\\Windows\\Fonts"]
TURKCE = "ğşıİĞŞçöüÇÖÜ"


def _hex(renk):
    r = renk.lstrip("#")
    return tuple(int(r[i:i + 2], 16) / 255.0 for i in (0, 2, 4))


# ============================================================ TrueType

class YaziTipi(object):
    """TrueType dosyasini okur: olcu, cmap, glif verisi, alt kume."""

    def __init__(self, yol):
        self.yol = yol
        with open(yol, "rb") as f:
            self.veri = f.read()
        s = self.veri
        surum = s[:4]
        if surum not in (b"\x00\x01\x00\x00", b"true"):
            raise ValueError("TrueType değil (OpenType-CFF ya da koleksiyon)")
        n = struct.unpack(">H", s[4:6])[0]
        self.tablo = {}
        for i in range(n):
            tag, _, ofs, uz = struct.unpack(">4sIII", s[12 + 16 * i:28 + 16 * i])
            self.tablo[tag.decode("latin-1")] = (ofs, uz)
        for t in ("head", "hhea", "maxp", "hmtx", "loca", "glyf", "cmap"):
            if t not in self.tablo:
                raise ValueError("eksik tablo: " + t)
        h = self._t("head")
        self.upm = struct.unpack(">H", h[18:20])[0]
        self.bbox = struct.unpack(">hhhh", h[36:44])
        self.loca_uzun = struct.unpack(">h", h[50:52])[0] == 1
        hh = self._t("hhea")
        self.ascent, self.descent = struct.unpack(">hh", hh[4:8])
        n_hm = struct.unpack(">H", hh[34:36])[0]
        self.n = struct.unpack(">H", self._t("maxp")[4:6])[0]
        hm = self._t("hmtx")
        gen = [struct.unpack(">H", hm[4 * i:4 * i + 2])[0] for i in range(n_hm)]
        self.genislik = gen + [gen[-1]] * (self.n - n_hm)
        self.cap = self.ascent
        self.fstype = 0
        if "OS/2" in self.tablo:
            o = self._t("OS/2")
            self.fstype = struct.unpack(">H", o[8:10])[0]
            if struct.unpack(">H", o[0:2])[0] >= 2 and len(o) >= 90:
                self.cap = struct.unpack(">h", o[88:90])[0] or self.ascent
        self.italik = 0
        if "post" in self.tablo:
            self.italik = struct.unpack(">i", self._t("post")[4:8])[0] / 65536.0
        self.ad = self._ps_ad()
        self.cmap = self._cmap()
        loca = self._t("loca")
        if self.loca_uzun:
            self.loca = list(struct.unpack(">%dI" % (self.n + 1), loca[:4 * (self.n + 1)]))
        else:
            self.loca = [x * 2 for x in struct.unpack(">%dH" % (self.n + 1), loca[:2 * (self.n + 1)])]

    def _t(self, ad):
        ofs, uz = self.tablo[ad]
        return self.veri[ofs:ofs + uz]

    def _ps_ad(self):
        if "name" not in self.tablo:
            return "Yazi"
        t = self._t("name")
        say, bas = struct.unpack(">HH", t[2:6])
        for i in range(say):
            p, e, _, nid, uz, ofs = struct.unpack(">HHHHHH", t[6 + 12 * i:18 + 12 * i])
            if nid != 6:
                continue
            ham = t[bas + ofs:bas + ofs + uz]
            ad = ham.decode("utf-16-be", "ignore") if p in (0, 3) else ham.decode("latin-1")
            ad = "".join(c for c in ad if c.isalnum() or c == "-")
            if ad:
                return ad[:60]
        return "Yazi"

    def _cmap(self):
        t = self._t("cmap")
        say = struct.unpack(">H", t[2:4])[0]
        secenek = {}
        for i in range(say):
            p, e, ofs = struct.unpack(">HHI", t[4 + 8 * i:12 + 8 * i])
            bic = struct.unpack(">H", t[ofs:ofs + 2])[0]
            secenek[(p, e, bic)] = ofs
        for anahtar in ((3, 10, 12), (0, 4, 12), (0, 6, 12), (3, 1, 4), (0, 3, 4), (0, 1, 4)):
            if anahtar in secenek:
                ofs = secenek[anahtar]
                return self._cmap12(t, ofs) if anahtar[2] == 12 else self._cmap4(t, ofs)
        raise ValueError("Unicode cmap yok")

    @staticmethod
    def _cmap4(t, ofs):
        seg = struct.unpack(">H", t[ofs + 6:ofs + 8])[0] // 2
        a = ofs + 14
        son = struct.unpack(">%dH" % seg, t[a:a + 2 * seg])
        bas = struct.unpack(">%dH" % seg, t[a + 2 * seg + 2:a + 4 * seg + 2])
        delta = struct.unpack(">%dh" % seg, t[a + 4 * seg + 2:a + 6 * seg + 2])
        ro_ofs = a + 6 * seg + 2
        ro = struct.unpack(">%dH" % seg, t[ro_ofs:ro_ofs + 2 * seg])
        out = {}
        for i in range(seg):
            for c in range(bas[i], son[i] + 1):
                if c == 0xFFFF:
                    continue
                if ro[i] == 0:
                    g = (c + delta[i]) & 0xFFFF
                else:
                    yer = ro_ofs + 2 * i + ro[i] + 2 * (c - bas[i])
                    g = struct.unpack(">H", t[yer:yer + 2])[0]
                    if g:
                        g = (g + delta[i]) & 0xFFFF
                if g:
                    out[c] = g
        return out

    @staticmethod
    def _cmap12(t, ofs):
        n = struct.unpack(">I", t[ofs + 12:ofs + 16])[0]
        out = {}
        for i in range(n):
            s, e, g = struct.unpack(">III", t[ofs + 16 + 12 * i:ofs + 28 + 12 * i])
            for c in range(s, min(e, s + 0x3000) + 1):
                out[c] = g + (c - s)
        return out

    def gomulebilir(self):
        # fsType: 0x0002 «kisitli lisans» — 0x0004/0x0008 izin vermiyorsa gomulmez.
        return not (self.fstype & 0x0002) or bool(self.fstype & 0x000C)

    def gid(self, ch):
        return self.cmap.get(ord(ch), 0)

    def en(self, metin, boy):
        return sum(self.genislik[self.gid(c)] for c in metin) * boy / float(self.upm)

    def _glif(self, g):
        a, b = self.loca[g], self.loca[g + 1]
        ofs = self.tablo["glyf"][0]
        return self.veri[ofs + a:ofs + b]

    def _bilesenler(self, g):
        d = self._glif(g)
        if len(d) < 10 or struct.unpack(">h", d[:2])[0] >= 0:
            return []
        out, i = [], 10
        while True:
            bayrak, gg = struct.unpack(">HH", d[i:i + 4])
            out.append(gg)
            i += 4 + (4 if bayrak & 0x0001 else 2)
            i += 2 if bayrak & 0x0008 else 4 if bayrak & 0x0040 else 8 if bayrak & 0x0080 else 0
            if not bayrak & 0x0020:
                return out

    def alt_kume(self, gidler):
        """Yalniz kullanilan glifler (+ bilesik glif parcalari) veri tasir;
        glif numaralari DEGISMEZ (CIDToGIDMap Identity)."""
        tut, bak = {0}, list(gidler)
        while bak:
            g = bak.pop()
            if g in tut or g >= self.n:
                continue
            tut.add(g)
            bak.extend(self._bilesenler(g))
        glyf, loca = bytearray(), [0]
        for g in range(self.n):
            if g in tut:
                d = self._glif(g)
                glyf += d + b"\0" * ((4 - len(d) % 4) % 4)
            loca.append(len(glyf))
        tablolar = {"glyf": bytes(glyf), "loca": struct.pack(">%dI" % len(loca), *loca)}
        h = bytearray(self._t("head"))
        h[8:12] = b"\0\0\0\0"                              # checkSumAdjustment
        h[50:52] = struct.pack(">h", 1)                    # uzun loca
        tablolar["head"] = bytes(h)
        for t in ("hhea", "maxp", "hmtx", "cvt ", "fpgm", "prep", "cmap", "OS/2", "post", "name"):
            if t in self.tablo:
                tablolar[t] = self._t(t)
        return _sfnt(tablolar)


def _toplam(v):
    v = v + b"\0" * ((4 - len(v) % 4) % 4)
    return sum(struct.unpack(">%dI" % (len(v) // 4), v)) & 0xFFFFFFFF


def _sfnt(tablolar):
    adlar = sorted(tablolar)
    n = len(adlar)
    es = 1
    while es * 2 <= n:
        es *= 2
    bas = struct.pack(">IHHHH", 0x00010000, n, es * 16, es.bit_length() - 1, n * 16 - es * 16)
    ofs = 12 + 16 * n
    kayit, govde = b"", b""
    for ad in adlar:
        v = tablolar[ad]
        kayit += struct.pack(">4sIII", ad.encode("latin-1"), _toplam(v), ofs + len(govde), len(v))
        govde += v + b"\0" * ((4 - len(v) % 4) % 4)
    font = bytearray(bas + kayit + govde)
    duz = (0xB1B0AFBA - _toplam(bytes(font))) & 0xFFFFFFFF
    i = adlar.index("head")
    h_ofs = struct.unpack(">I", kayit[16 * i + 8:16 * i + 12])[0]
    font[h_ofs + 8:h_ofs + 12] = struct.pack(">I", duz)
    return bytes(font)


def yazi_tipi_bul(ek=None):
    """(normal, kalin) YaziTipi ya da (None, None). Turkce harfleri olan ve
    gomulmeye izin veren ilk aday secilir; kalin yoksa normal kullanilir."""
    bulunan = {}
    klasorler = ([ek] if ek else []) + KLASORLER
    for tur, adlar in ADAYLAR.items():
        for k in klasorler:
            if not k or not os.path.isdir(k):
                continue
            for ad in adlar:
                for yol in glob.glob(os.path.join(k, "**", ad), recursive=True)[:1]:
                    try:
                        y = YaziTipi(yol)
                    except (ValueError, OSError, struct.error, IndexError):
                        continue
                    if y.gomulebilir() and all(y.gid(c) for c in TURKCE):
                        bulunan[tur] = y
                        break
                if tur in bulunan:
                    break
            if tur in bulunan:
                break
    n = bulunan.get("normal")
    return n, bulunan.get("kalin") or n


_ONBELLEK = {}


def _yazi_tipleri():
    if "yt" not in _ONBELLEK:
        _ONBELLEK["yt"] = yazi_tipi_bul()
    return _ONBELLEK["yt"]


# ============================================================ sayfalar

class _Sayfa(object):
    def __init__(self, w, h):
        self.w, self.h, self.ops = w, h, []


class Dizgi(object):
    """Belge modelini sayfalara dizer. Koordinatlar ustten asagi (y
    buyudukce asagi); PDF'e yazarken cevrilir."""

    def __init__(self, normal, kalin, boyut=A4):
        self.yt = {"n": normal, "k": kalin}
        self.kullanilan = {"n": set(), "k": set()}
        self.boyut = boyut
        self.sayfalar = []
        self.yeni()

    # ---------------------------------------------------------------- temel
    def yeni(self, boyut=None):
        self.s = _Sayfa(*(boyut or self.boyut))
        self.sayfalar.append(self.s)
        self.y = KENAR

    def sigar(self, h):
        if self.y + h > self.s.h - KENAR - ALT_BOSLUK:
            self.yeni()
            return False
        return True

    def en(self, metin, boy, kalin=False):
        return self.yt["k" if kalin else "n"].en(metin, boy)

    def yazi(self, x, y, metin, boy, renk="#1F2A2E", kalin=False, hiza="sol"):
        f = "k" if kalin else "n"
        yt = self.yt[f]
        gid = [yt.gid(c) for c in metin]
        self.kullanilan[f].update(gid)
        if hiza != "sol":
            x -= self.en(metin, boy, kalin) / (2.0 if hiza == "orta" else 1.0)
        r, g, b = _hex(renk)
        self.s.ops.append("BT /%s %.2f Tf %.3f %.3f %.3f rg %.2f %.2f Td <%s> Tj ET" % (
            "F2" if kalin else "F1", boy, r, g, b, x, self.s.h - y,
            "".join("%04X" % x_ for x_ in gid)))

    def kutu(self, x, y, w, h, dolgu=None, kenar=None, r=0, kalinlik=1):
        yol = _yuvarlak(x, self.s.h - y - h, w, h, r) if r else \
            "%.2f %.2f %.2f %.2f re" % (x, self.s.h - y - h, w, h)
        self.s.ops.append(_boya(yol, dolgu, kenar, kalinlik))

    def daire(self, cx, cy, r, dolgu=None, kenar=None):
        k = 0.5523 * r
        y = self.s.h - cy
        yol = ("%.2f %.2f m %.2f %.2f %.2f %.2f %.2f %.2f c %.2f %.2f %.2f %.2f %.2f %.2f c "
               "%.2f %.2f %.2f %.2f %.2f %.2f c %.2f %.2f %.2f %.2f %.2f %.2f c h") % (
            cx + r, y, cx + r, y + k, cx + k, y + r, cx, y + r, cx - k, y + r, cx - r, y + k,
            cx - r, y, cx - r, y - k, cx - k, y - r, cx, y - r, cx + k, y - r, cx + r, y - k,
            cx + r, y)
        self.s.ops.append(_boya(yol, dolgu, kenar, 1))

    def cizgi(self, x1, y1, x2, y2, renk="#B9C2BF", kalinlik=1):
        r, g, b = _hex(renk)
        self.s.ops.append("%.3f %.3f %.3f RG %.2f w 1 J %.2f %.2f m %.2f %.2f l S" % (
            r, g, b, kalinlik, x1, self.s.h - y1, x2, self.s.h - y2))

    # ------------------------------------------------------------ metin
    def sar(self, metin, boy, gen, kalin=False):
        out = []
        for paragraf in str(metin or "").split("\n"):
            satir = ""
            for w in paragraf.split():
                while self.en(w, boy, kalin) > gen:          # cok uzun kelime (adres)
                    kes = len(w)
                    while kes > 1 and self.en(w[:kes], boy, kalin) > gen:
                        kes -= 1
                    if satir:
                        out.append(satir)
                        satir = ""
                    out.append(w[:kes])
                    w = w[kes:]
                aday = (satir + " " + w).strip()
                if satir and self.en(aday, boy, kalin) > gen:
                    out.append(satir)
                    satir = w
                else:
                    satir = aday
            out.append(satir)
        return [x for x in out if x] or [""]

    def paragraf(self, metin, boy=10.5, x=KENAR, gen=None, renk="#1F2A2E", kalin=False,
                 ara=1.42, sonra=6):
        gen = gen or (self.s.w - x - KENAR)
        for s in self.sar(metin, boy, gen, kalin):
            self.sigar(boy * ara)
            self.yazi(x, self.y + boy, s, boy, renk, kalin)
            self.y += boy * ara
        self.y += sonra


def _boya(yol, dolgu, kenar, kalinlik):
    p = []
    if dolgu:
        p.append("%.3f %.3f %.3f rg" % _hex(dolgu))
    if kenar:
        p.append("%.3f %.3f %.3f RG %.2f w" % (_hex(kenar) + (kalinlik,)))
    p.append(yol)
    p.append("B" if dolgu and kenar else "f" if dolgu else "S")
    return " ".join(p)


def _yuvarlak(x, y, w, h, r):
    r = min(r, w / 2.0, h / 2.0)
    k = 0.5523 * r
    return ("%.2f %.2f m %.2f %.2f l %.2f %.2f %.2f %.2f %.2f %.2f c %.2f %.2f l "
            "%.2f %.2f %.2f %.2f %.2f %.2f c %.2f %.2f l %.2f %.2f %.2f %.2f %.2f %.2f c "
            "%.2f %.2f l %.2f %.2f %.2f %.2f %.2f %.2f c h") % (
        x + r, y, x + w - r, y, x + w - r + k, y, x + w, y + r - k, x + w, y + r,
        x + w, y + h - r, x + w, y + h - r + k, x + w - r + k, y + h, x + w - r, y + h,
        x + r, y + h, x + r - k, y + h, x, y + h - r + k, x, y + h - r,
        x, y + r, x, y + r - k, x + r - k, y, x + r, y)


# ============================================================ belge -> dizgi

RENK = {"yazi": "#1F2A2E", "ikincil": "#4A5A5E", "vurgu": "#2F6B5E", "vurgu2": "#9A5B12",
        "cizgi": "#B9C2BF", "yumusak": "#E7EFEC"}
ETIKET = {"kaynakli": "kaynaklı", "dogrulanmadi": "doğrulanmadı", "celiskili": "çelişkili"}
HARF = "ABCDE"


def _baslik(d, b):
    d.yazi(KENAR, d.y + 9, "%s · %s" % (b["tur_ad"].upper(), ETIKET.get(b["dogruluk"],
                                                                     b["dogruluk"]).upper()),
           8.5, RENK["vurgu"], True)
    d.y += 18
    d.paragraf(b["baslik"], 20, kalin=True, ara=1.2, sonra=2)
    if b.get("alt"):
        d.paragraf(b["alt"], 11.5, renk=RENK["ikincil"], sonra=2)
    d.cizgi(KENAR, d.y + 4, d.s.w - KENAR, d.y + 4, RENK["vurgu"], 2)
    d.y += 16


def _tablo(d, blok):
    gen = d.s.w - 2 * KENAR
    n = len(blok["basliklar"])
    sut = gen / float(n)
    boy, pad = 9.5, 4

    def satir(hucreler, kalin, dolgu):
        satirlar = [d.sar(h, boy, sut - 2 * pad, kalin) for h in hucreler]
        yuk = max(len(s) for s in satirlar) * boy * 1.35 + 2 * pad
        d.sigar(yuk)
        for i, s in enumerate(satirlar):
            x = KENAR + i * sut
            d.kutu(x, d.y, sut, yuk, dolgu, RENK["cizgi"], kalinlik=0.6)
            for j, t in enumerate(s):
                d.yazi(x + pad, d.y + pad + boy * (j + 1) * 1.35 - boy * 0.3, t, boy,
                       RENK["yazi"], kalin)
        d.y += yuk

    satir(blok["basliklar"], True, RENK["yumusak"])
    for s in blok["satirlar"]:
        satir(s, False, None)
    d.y += 8


def _blok(d, blok):
    t = blok["t"]
    if t == "p":
        d.paragraf(blok["metin"])
    elif t == "not":
        satirlar = d.sar(blok["metin"], 10, d.s.w - 2 * KENAR - 20)
        yuk = len(satirlar) * 14 + 14
        d.sigar(yuk)
        d.kutu(KENAR, d.y, d.s.w - 2 * KENAR, yuk, RENK["yumusak"], r=6)
        for i, s in enumerate(satirlar):
            d.yazi(KENAR + 10, d.y + 7 + 10 + 14 * i, s, 10)
        d.y += yuk + 8
    elif t in ("liste", "numarali"):
        for i, m in enumerate(blok["maddeler"]):
            isaret = "%d." % (i + 1) if t == "numarali" else ("•" if d.yt["n"].gid("•") else "-")
            satirlar = d.sar(m, 10.5, d.s.w - 2 * KENAR - 18)
            for j, s in enumerate(satirlar):
                d.sigar(15)
                if j == 0:
                    d.yazi(KENAR + 2, d.y + 10.5, isaret, 10.5, RENK["vurgu"], True)
                d.yazi(KENAR + 18, d.y + 10.5, s, 10.5)
                d.y += 15
        d.y += 6
    elif t == "tablo":
        _tablo(d, blok)
    elif t == "soru":
        d.sigar(15 * 4)
        d.paragraf("%d. %s" % (blok["no"], blok["soru"]), 10.5, kalin=False, sonra=2)
        for i, x in enumerate(blok["secenekler"]):
            d.paragraf("%s) %s" % (HARF[i], x), 10, x=KENAR + 16, sonra=0, ara=1.35)
        d.y += 8


def _kaynaklar(d, b):
    if not b["kaynaklar"]:
        return
    _bolum_basligi(d, "Kaynaklar")
    for k in b["kaynaklar"]:
        d.paragraf("[%d] %s — %s (erişim %s)" % (k["n"], k.get("baslik", ""), k.get("url", ""),
                                                 k.get("erisim", "")), 9, sonra=3)


def _bolum_basligi(d, metin):
    d.sigar(40)
    d.y += 8
    d.kutu(KENAR, d.y + 1, 3, 16, RENK["vurgu"])
    d.yazi(KENAR + 10, d.y + 14, metin, 13.5, RENK["yazi"], True)
    d.y += 26


def _gorsel(d, sahne):
    """Sahneyi basligin altina, AYNI sayfaya olcekler; cok kuculecekse
    (yatay bir harita dikey sayfada) kendi yatay sayfasina gecer."""
    w, h = sahne["w"], sahne["h"]
    alan_w = d.s.w - 2 * KENAR
    alan_h = d.s.h - d.y - KENAR - ALT_BOSLUK
    o = min(alan_w / w, alan_h / h)
    if o < 0.38:
        boyut = A4 if h >= w else (A4[1], A4[0])
        d.yeni(boyut)
        alan_w, alan_h = boyut[0] - 2 * KENAR, boyut[1] - 2 * KENAR - ALT_BOSLUK
        o = min(alan_w / w, alan_h / h)
    ox, oy = KENAR + (alan_w - w * o) / 2, d.y
    d.kutu(ox, oy, w * o, h * o, sahne["arka"])
    for x in sahne["ogeler"]:
        if x["k"] == "kutu":
            d.kutu(ox + x["x"] * o, oy + x["y"] * o, x["w"] * o, x["h"] * o, x.get("dolgu"),
                   x.get("kenar"), x.get("r", 0) * o)
        elif x["k"] == "daire":
            d.daire(ox + x["cx"] * o, oy + x["cy"] * o, x["r"] * o, x.get("dolgu"))
        elif x["k"] == "cizgi":
            d.cizgi(ox + x["x1"] * o, oy + x["y1"] * o, ox + x["x2"] * o, oy + x["y2"] * o,
                    x["renk"], x.get("kalinlik", 2) * o)
        elif x["k"] == "yazi":
            d.yazi(ox + x["x"] * o, oy + x["y"] * o, x["metin"], x["boy"] * o, x["renk"],
                   x["kalin"], x["hiza"])


def _slaytlar(d, b):
    gen = SLAYT[0] - 2 * KENAR - 26
    for i, s in enumerate(b["slaytlar"]):
        d.yeni(SLAYT)
        d.kutu(0, 0, SLAYT[0], 8, RENK["vurgu"])
        d.y = KENAR + 10
        d.paragraf(s["baslik"], 24, kalin=True, renk=RENK["vurgu"], ara=1.2, sonra=12)
        # Slayt TASMAZ: maddeler sigmiyorsa yazi kuculur.
        alan = SLAYT[1] - d.y - KENAR - ALT_BOSLUK - (40 if s.get("not") else 0)
        boy = next((b_ for b_ in (15, 13, 11.5, 10) if sum(
            len(d.sar(m, b_, gen)) * b_ * 1.4 + 5 for m in s["maddeler"]) <= alan), 10)
        for m in s["maddeler"]:
            for j, t in enumerate(d.sar(m, boy, gen)):
                if j == 0:
                    d.daire(KENAR + 6, d.y + boy * 0.66, 3.5, RENK["vurgu"])
                d.yazi(KENAR + 22, d.y + boy, t, boy)
                d.y += boy * 1.4
            d.y += 5
        if s.get("not"):
            d.y = max(d.y, SLAYT[1] - KENAR - ALT_BOSLUK - 40)
            d.paragraf("Not: " + s["not"], 8.5, renk=RENK["ikincil"], sonra=0)


def _alt_bilgi(d, b):
    n = len(d.sayfalar)
    et = ETIKET.get(b["dogruluk"], b["dogruluk"])
    for i, s in enumerate(d.sayfalar):
        d.s = s
        d.cizgi(KENAR, s.h - KENAR - 14, s.w - KENAR, s.h - KENAR - 14, RENK["cizgi"], 0.6)
        sol = " · ".join(x for x in ("LifeOS · HKM", "BAM kayıt #%s" % b.get("kimlik"),
                                     b.get("tarih"), et) if x)
        d.yazi(KENAR, s.h - KENAR, sol, 7.5, RENK["ikincil"])
        d.yazi(s.w - KENAR, s.h - KENAR, "sayfa %d/%d" % (i + 1, n), 7.5, RENK["ikincil"],
               hiza="sag")


def _kapak(d, b):
    """Sunumun kapak slayti: tur, etiket, baslik, alt baslik."""
    d.kutu(0, 0, d.s.w, 8, RENK["vurgu"])
    d.y = d.s.h * 0.32
    d.yazi(KENAR, d.y, "%s · %s" % (b["tur_ad"].upper(), ETIKET.get(b["dogruluk"],
                                                                    b["dogruluk"]).upper()),
           10, RENK["vurgu"], True)
    d.y += 14
    d.paragraf(b["baslik"], 32, kalin=True, ara=1.15, sonra=4)
    if b.get("alt"):
        d.paragraf(b["alt"], 16, renk=RENK["ikincil"])


def diz(b, normal, kalin):
    if b.get("slaytlar"):
        d = Dizgi(normal, kalin, SLAYT)
        _kapak(d, b)
        _slaytlar(d, b)
        d.yeni()
    else:
        d = Dizgi(normal, kalin)
        _baslik(d, b)
    if b.get("gorsel"):
        _gorsel(d, b["gorsel"])
        d.yeni()
    elif b.get("slaytlar"):
        pass
    else:
        for bl in b["bolumler"]:
            if bl.get("baslik"):
                _bolum_basligi(d, bl["baslik"])
            for x in bl["bloklar"]:
                _blok(d, x)
    if b.get("kavramlar"):
        _bolum_basligi(d, "Anahtar kavramlar")
        for k in b["kavramlar"]:
            d.paragraf("%s: %s" % (k["terim"], k["tanim"]), 10.5, sonra=3)
    _kaynaklar(d, b)
    if len(d.sayfalar) > 1 and not d.sayfalar[-1].ops:
        d.sayfalar.pop()
    _alt_bilgi(d, b)
    return d


# ============================================================ PDF yazimi

def _akis(sozluk, veri):
    z = zlib.compress(veri, 9)
    return b"<<" + sozluk + b" /Filter /FlateDecode /Length " + str(len(z)).encode() + \
        b">>\nstream\n" + z + b"\nendstream"


def _tounicode(yt, gidler):
    ters = {}
    for cp, g in yt.cmap.items():
        if g in gidler and g not in ters:
            ters[g] = cp
    ciftler = sorted((g, cp) for g, cp in ters.items())
    satir = []
    for i in range(0, len(ciftler), 100):
        parca = ciftler[i:i + 100]
        satir.append("%d beginbfchar" % len(parca))
        for g, cp in parca:
            u = chr(cp).encode("utf-16-be").hex().upper()
            satir.append("<%04X> <%s>" % (g, u))
        satir.append("endbfchar")
    return ("/CIDInit /ProcSet findresource begin 12 dict begin begincmap "
            "/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def "
            "/CMapName /Adobe-Identity-UCS def /CMapType 2 def 1 begincodespacerange "
            "<0000> <FFFF> endcodespacerange\n%s\nendcmap CMapName currentdict /CMap "
            "defineresource pop end end" % "\n".join(satir)).encode("ascii")


def _font_nesneleri(yt, gidler, ilk):
    """Type0 + CIDFontType2 + FontDescriptor + FontFile2 + ToUnicode.
    Doner: (nesneler, type0_no)."""
    gidler = set(gidler) | {0}
    etiket = "".join(chr(65 + b % 26) for b in hashlib.sha1(
        (yt.ad + ",".join(map(str, sorted(gidler)))).encode()).digest()[:6])
    ad = "%s+%s" % (etiket, yt.ad)
    o = 1000.0 / yt.upm
    w = " ".join("%d [%d]" % (g, round(yt.genislik[g] * o)) for g in sorted(gidler))
    font = yt.alt_kume(gidler)
    no = list(range(ilk, ilk + 5))
    nes = [
        ("<< /Type /Font /Subtype /Type0 /BaseFont /%s /Encoding /Identity-H "
         "/DescendantFonts [%d 0 R] /ToUnicode %d 0 R >>" % (ad, no[1], no[4])).encode(),
        ("<< /Type /Font /Subtype /CIDFontType2 /BaseFont /%s /CIDSystemInfo << /Registry "
         "(Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor %d 0 R /DW 1000 "
         "/W [%s] /CIDToGIDMap /Identity >>" % (ad, no[2], w)).encode(),
        ("<< /Type /FontDescriptor /FontName /%s /Flags 32 /FontBBox [%d %d %d %d] "
         "/ItalicAngle %d /Ascent %d /Descent %d /CapHeight %d /StemV 80 /FontFile2 %d 0 R >>"
         % (ad, yt.bbox[0] * o, yt.bbox[1] * o, yt.bbox[2] * o, yt.bbox[3] * o, yt.italik,
            yt.ascent * o, yt.descent * o, yt.cap * o, no[3])).encode(),
        _akis(b" /Length1 " + str(len(font)).encode(), font),
        _akis(b"", _tounicode(yt, gidler)),
    ]
    return nes, no[0]


def yaz(d, baslik=""):
    nes = [None, None]                                     # 1 katalog, 2 sayfalar
    ayni = d.yt["k"] is d.yt["n"]
    # Kalin yazi tipi yoksa ikisi AYNI dosyadir: iki kumenin glifleri birlesir.
    f1, n1 = _font_nesneleri(d.yt["n"], d.kullanilan["n"] | (d.kullanilan["k"] if ayni else set()),
                             3)
    nes += f1
    if ayni:
        n2 = n1
    else:
        f2, n2 = _font_nesneleri(d.yt["k"], d.kullanilan["k"], len(nes) + 1)
        nes += f2
    kaynak = "<< /Font << /F1 %d 0 R /F2 %d 0 R >> >>" % (n1, n2)
    sayfa_no = []
    for s in d.sayfalar:
        icerik = _akis(b"", "\n".join(s.ops).encode("latin-1"))
        nes.append(icerik)
        c_no = len(nes)
        nes.append(("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %.2f %.2f] /Resources %s "
                    "/Contents %d 0 R >>" % (s.w, s.h, kaynak, c_no)).encode())
        sayfa_no.append(len(nes))
    nes[0] = b"<< /Type /Catalog /Pages 2 0 R >>"
    nes[1] = ("<< /Type /Pages /Kids [%s] /Count %d >>" % (
        " ".join("%d 0 R" % n for n in sayfa_no), len(sayfa_no))).encode()
    bilgi_ = "<< /Producer (LifeOS HKM) /Title <FEFF%s> >>" % baslik.encode("utf-16-be").hex().upper()
    nes.append(bilgi_.encode())
    out = bytearray(b"%PDF-1.7\n%\xe2\xe3\xcf\xd3\n")
    konum = []
    for i, n in enumerate(nes):
        konum.append(len(out))
        out += b"%d 0 obj\n" % (i + 1) + n + b"\nendobj\n"
    xref = len(out)
    out += b"xref\n0 %d\n0000000000 65535 f \n" % (len(nes) + 1)
    for k in konum:
        out += b"%010d 00000 n \n" % k
    out += b"trailer\n<< /Size %d /Root 1 0 R /Info %d 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (
        len(nes) + 1, len(nes), xref)
    return bytes(out)


def belge_pdf(b, yazi_tipleri=None):
    """Belge modeli -> {ok, bayt, sayfa, yazi_tipi} ya da {ok:False, note}."""
    normal, kalin = yazi_tipleri or _yazi_tipleri()
    if not normal:
        return {"ok": False, "note": "PDF için Türkçe harfleri olan ve gömülmeye izin veren bir "
                                     "TrueType yazı tipi bulunamadı. HTML biçimini kullan ya da "
                                     "HKM/brand/fonts/ klasörüne bir .ttf dosyası koy."}
    d = diz(b, normal, kalin)
    return {"ok": True, "bayt": yaz(d, b.get("baslik") or ""), "sayfa": len(d.sayfalar),
            "yazi_tipi": os.path.basename(normal.yol)}
