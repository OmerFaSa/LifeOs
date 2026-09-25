# -*- coding: utf-8 -*-
"""Belge okuma — yalniz Python standart kutuphanesi (AGENTS.md §1.3).

   Telegram'dan gelen belgenin METNI yerelde cikarilir; model gerekmez,
   belge disari gitmez (GELISTIRME_PLANI: «PDF/belge: yerel metin
   cikarimi»). Desteklenen: PDF (metin katmani), Word (.docx),
   OpenDocument (.odt), duz metin (.txt .md .csv .json).

   Uc kural:
   1. OKUYAMADIGINI SOYLER. Sifreli PDF, taranmis (metin katmani olmayan)
      PDF ya da desteklenmeyen tur «okunamadı» der; bos metin «okundu»
      diye donmez (AGENTS §1.7).
   2. UYDURMAZ. Metin belgenin kendi baytlarindan gelir; eksik harf
      eslemesi tahmin edilmez, oldugu gibi birakilir.
   3. SINIRLI. En cok EN_COK_KARAKTER karakter tutulur; fazlasi kesilir ve
      bu soylenir."""
import os
import re
import zipfile
import zlib
from xml.etree import ElementTree

EN_COK_KARAKTER = 200000
DUZ = (".txt", ".md", ".csv", ".json")
_BOS = re.compile(r"[ \t]+")


def _sonuc(metin, tur, sayfa=None):
    metin = "\n".join(_BOS.sub(" ", s).strip() for s in (metin or "").splitlines())
    metin = re.sub(r"\n{3,}", "\n\n", metin).strip()
    harf = sum(1 for c in metin if c.isalpha())
    if harf < 3:
        not_ = ("Belgede okunabilir metin yok (taranmış bir PDF olabilir; görsel metni "
                "okumak için fotoğraf olarak gönder)." if tur == "pdf"
                else "Belgede okunabilir metin yok.")
        return {"ok": False, "tur": tur, "note": not_}
    kesildi = len(metin) > EN_COK_KARAKTER
    return {"ok": True, "tur": tur, "metin": metin[:EN_COK_KARAKTER], "kesildi": kesildi,
            "sayfa": sayfa, "kelime": len(metin.split())}


def _duz(ham):
    for kod in ("utf-8-sig", "cp1254"):
        try:
            return ham.decode(kod)
        except UnicodeDecodeError:
            continue
    return ham.decode("latin-1")


def _xml_metni(ham, paragraf):
    kok = ElementTree.fromstring(ham)
    satirlar = []
    for el in kok.iter():
        if el.tag.endswith(paragraf):
            satirlar.append("".join(el.itertext()))
    return "\n".join(satirlar)


def _zip(yol, uye, paragraf, tur):
    try:
        with zipfile.ZipFile(yol) as z:
            ham = z.read(uye)
        return _sonuc(_xml_metni(ham, paragraf), tur)
    except (zipfile.BadZipFile, KeyError, ElementTree.ParseError, OSError):
        return {"ok": False, "tur": tur, "note": "Belge açılamadı (bozuk ya da farklı biçim)."}


# ------------------------------------------------------------------ PDF

_NESNE = re.compile(rb"(\d+)\s+(\d+)\s+obj\b(.*?)\bendobj", re.S)
_AKIS = re.compile(rb"stream\r?\n(.*?)\r?\n?endstream", re.S)


def _coz(sozluk, veri):
    if b"/FlateDecode" in sozluk:
        try:
            return zlib.decompress(veri)
        except zlib.error:
            try:
                return zlib.decompressobj().decompress(veri)
            except zlib.error:
                return None
    if b"/Filter" in sozluk:
        return None            # DCT, LZW vb.: metin tasimaz ya da desteklenmez
    return veri


def _nesneler(ham):
    """{no: (sozluk_baytlari, akis_ya_da_None)} — nesne akislari (ObjStm) acilir."""
    out = {}
    for m in _NESNE.finditer(ham):
        no, govde = int(m.group(1)), m.group(3)
        a = _AKIS.search(govde)
        if a:
            sozluk = govde[:a.start()]
            out[no] = (sozluk, _coz(sozluk, a.group(1)))
        else:
            out[no] = (govde, None)
    for no, (sozluk, akis) in list(out.items()):
        if akis and b"/ObjStm" in sozluk:
            n = re.search(rb"/N\s+(\d+)", sozluk)
            ilk = re.search(rb"/First\s+(\d+)", sozluk)
            if not n or not ilk:
                continue
            bas = [int(x) for x in akis[:int(ilk.group(1))].split()]
            ciftler = list(zip(bas[0::2], bas[1::2]))
            for i, (ic_no, ofs) in enumerate(ciftler):
                s = int(ilk.group(1)) + ofs
                e = int(ilk.group(1)) + ciftler[i + 1][1] if i + 1 < len(ciftler) else len(akis)
                out.setdefault(ic_no, (akis[s:e], None))
    return out


def _cmap(akis):
    """ToUnicode CMap → ({kod: metin}, kod_uzunlugu)."""
    esle = {}
    uzun = 1
    cs = re.search(rb"begincodespacerange\s*<([0-9A-Fa-f]+)>", akis)
    if cs:
        uzun = max(1, len(cs.group(1)) // 2)

    def u(h):
        b = bytes.fromhex(h.decode())
        try:
            return b.decode("utf-16-be")
        except UnicodeDecodeError:
            return ""
    for blok in re.findall(rb"beginbfchar(.*?)endbfchar", akis, re.S):
        for k, v in re.findall(rb"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]*)>", blok):
            esle[int(k, 16)] = u(v)
    for blok in re.findall(rb"beginbfrange(.*?)endbfrange", akis, re.S):
        for a, b, v in re.findall(rb"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(<[0-9A-Fa-f]*>|\[[^\]]*\])", blok):
            a, b = int(a, 16), int(b, 16)
            if v.startswith(b"["):
                for i, h in enumerate(re.findall(rb"<([0-9A-Fa-f]*)>", v)):
                    esle[a + i] = u(h)
            else:
                taban = int(v[1:-1], 16) if v[1:-1] else 0
                gen = len(v[1:-1]) // 2
                for i in range(min(b - a + 1, 65536)):
                    try:
                        esle[a + i] = (taban + i).to_bytes(max(gen, 2), "big").decode("utf-16-be")
                    except (UnicodeDecodeError, OverflowError):
                        pass
    return esle, uzun


def _fontlar(nesneler):
    """Kaynak adi (/F1) → (cmap, kod_uzunlugu). Ad birden cok sayfada ayni
    fonta gider varsayilir (ilk bulunan); cmap'siz font None."""
    cmaplar = {}
    for no, (sozluk, akis) in nesneler.items():
        if akis and b"begincmap" in akis:
            cmaplar[no] = _cmap(akis)
    out = {}

    def font_cmap(fno):
        s = nesneler.get(fno, (b"", None))[0]
        t = re.search(rb"/ToUnicode\s+(\d+)\s+\d+\s+R", s)
        return cmaplar.get(int(t.group(1))) if t else None
    for no, (sozluk, _) in nesneler.items():
        m = re.search(rb"/Font\s*<<(.*?)>>", sozluk, re.S)
        govde = m.group(1) if m else None
        if govde is None:
            d = re.search(rb"/Font\s+(\d+)\s+\d+\s+R", sozluk)
            if d:
                govde = nesneler.get(int(d.group(1)), (b"", None))[0]
        if not govde:
            continue
        for ad, fno in re.findall(rb"/([A-Za-z0-9_.+-]+)\s+(\d+)\s+\d+\s+R", govde):
            out.setdefault(ad.decode("latin-1"), font_cmap(int(fno)))
    return out


def _literal(b, i):
    """(...) dizgesi; kacislar cozulur. Doner (bayt, yeni_i)."""
    out = bytearray()
    derin = 1
    i += 1
    kacis = {b"n": 10, b"r": 13, b"t": 9, b"b": 8, b"f": 12}
    while i < len(b) and derin:
        c = b[i:i + 1]
        if c == b"\\":
            n = b[i + 1:i + 2]
            if n in kacis:
                out.append(kacis[n]); i += 2
            elif n.isdigit():
                j = i + 1
                while j < len(b) and j < i + 4 and b[j:j + 1].isdigit():
                    j += 1
                out.append(int(b[i + 1:j], 8) & 255); i = j
            elif n in (b"\r", b"\n"):
                i += 2
            else:
                out += n; i += 2
            continue
        if c == b"(":
            derin += 1
        elif c == b")":
            derin -= 1
            if not derin:
                i += 1
                break
        out += c
        i += 1
    return bytes(out), i


def _cevir(bayt, font):
    if font:
        esle, uzun = font
        return "".join(esle.get(int.from_bytes(bayt[k:k + uzun], "big"), "")
                       for k in range(0, len(bayt) - uzun + 1, uzun))
    return bayt.decode("latin-1")


_JETON = re.compile(rb"\(|<[0-9A-Fa-f\s]*>|\[|\]|/[^\s/\[\]()<>]+|-?\d*\.?\d+|[A-Za-z'\"*]+")


def _icerik_metni(akis, fontlar):
    out = []
    yigin = []
    font = None
    i = 0
    while i < len(akis):
        m = _JETON.search(akis, i)
        if not m:
            break
        j = m.group(0)
        if j == b"(":
            s, i = _literal(akis, m.start())
            yigin.append(("s", s))
            continue
        i = m.end()
        if j.startswith(b"<"):
            h = re.sub(rb"\s", b"", j[1:-1])
            yigin.append(("s", bytes.fromhex((h + b"0" * (len(h) % 2)).decode())))
        elif j == b"[":
            yigin.append(("[", None))
        elif j == b"]":
            dizi = []
            while yigin and yigin[-1][0] != "[":
                dizi.append(yigin.pop())
            if yigin:
                yigin.pop()
            yigin.append(("a", list(reversed(dizi))))
        elif j.startswith(b"/"):
            yigin.append(("n", j[1:].decode("latin-1")))
        elif re.match(rb"-?\d*\.?\d+$", j):
            yigin.append(("f", float(j)))
        else:
            op = j
            if op == b"Tf":
                adlar = [v for t, v in yigin if t == "n"]
                if adlar:
                    font = fontlar.get(adlar[-1])
            elif op in (b"Tj", b"'", b'"'):
                s = [v for t, v in yigin if t == "s"]
                if op != b"Tj":
                    out.append("\n")
                if s:
                    out.append(_cevir(s[-1], font))
            elif op == b"TJ":
                a = [v for t, v in yigin if t == "a"]
                for t, v in (a[-1] if a else []):
                    if t == "s":
                        out.append(_cevir(v, font))
                    elif t == "f" and v < -200:
                        out.append(" ")
            elif op in (b"Td", b"TD", b"T*", b"Tm", b"ET"):
                if out and not out[-1].endswith("\n"):
                    out.append("\n")
            yigin = []
    return "".join(out)


def _pdf(ham):
    if not ham.startswith(b"%PDF"):
        return {"ok": False, "tur": "pdf", "note": "PDF değil (başlık yok)."}
    if b"/Encrypt" in ham:
        return {"ok": False, "tur": "pdf", "note": "Şifreli PDF okunamadı; şifresiz hâlini gönder."}
    nesneler = _nesneler(ham)
    fontlar = _fontlar(nesneler)
    sayfa = sum(len(re.findall(rb"/Type\s*/Page(?![A-Za-z])", sozluk))
                for sozluk, _ in nesneler.values())
    parcalar = []
    for no in sorted(nesneler):
        sozluk, akis = nesneler[no]
        if not akis or b"begincmap" in akis or b"/ObjStm" in sozluk:
            continue
        if b"BT" in akis and (b"Tj" in akis or b"TJ" in akis):
            parcalar.append(_icerik_metni(akis, fontlar))
    return _sonuc("\n".join(parcalar), "pdf", sayfa or None)


def metin_cikar(yol, mime=None, ad=None):
    """Belgenin metni. Doner {ok, tur, metin, kelime, sayfa, kesildi} ya da
    {ok: False, tur, note}. Hicbir kosulda firlatmaz."""
    uzanti = os.path.splitext(ad or yol or "")[1].lower()
    try:
        if uzanti == ".pdf" or mime == "application/pdf":
            with open(yol, "rb") as f:
                return _pdf(f.read())
        if uzanti == ".docx":
            return _zip(yol, "word/document.xml", "}p", "docx")
        if uzanti == ".odt":
            return _zip(yol, "content.xml", "}p", "odt")
        if uzanti in DUZ or (mime or "").startswith("text/"):
            with open(yol, "rb") as f:
                return _sonuc(_duz(f.read()), "metin")
    except Exception:  # noqa: BLE001 — bozuk belge daemon'u dusurmez
        return {"ok": False, "tur": uzanti.lstrip(".") or "belge", "note": "Belge okunamadı (bozuk)."}
    return {"ok": False, "tur": uzanti.lstrip(".") or "belge",
            "note": "Bu türü okuyamıyorum (%s). PDF, Word (.docx), .odt ya da metin gönder."
                    % (uzanti or mime or "bilinmiyor")}
