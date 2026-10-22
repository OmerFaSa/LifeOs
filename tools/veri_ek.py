#!/usr/bin/env python3
"""veri_gece.py'nin MODELSIZ ek asamalari. Yalniz standart kutuphane.
Hepsi kaynaktan kodla okur; hicbir cevirisi/sayisi model uretmez.

  japonca   Leeds derlemi sira listesi (hingston/japanese), yalniz CJK karakterli kelimeler
  ceviri    en.wiktionary 'Translations' tablosundan Ingilizce kelime -> Turkce (kaynakli)
  anlam     yabanci kelime -> en.wiktionary Ingilizce tanimlari (Turkce karsilik DEGIL, ara veri)
  tatoeba   Turkce <-> 12 dil ornek cumle ciftleri (CC BY 2.0 FR)
  osym      ÖSYM'nin kendi sitesinden 2018-2025 YKS soru kitapciklari ve cevap anahtarlari (yerel, git disi)
"""
import bz2, io, json, re, subprocess, shutil, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path

import veri_cikar as vc

KOK, TEMIZ, HAM = vc.KOK, vc.TEMIZ, vc.HAM
UA = {"User-Agent": "LifeOS-veri/1.0 (kisisel arastirma, dusuk hiz)"}
NL = chr(10)
CJK = re.compile(r"[぀-ヿ㐀-鿿]")


def al(url, deneme=6, zaman=90):
    """GET; 429/5xx'te Retry-After'a ya da ustel bekleyisle yeniden dener (Vikimedya'ya nazik olmak icin)."""
    son = None
    for i in range(deneme):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=zaman) as f:
                return f.read()
        except urllib.error.HTTPError as e:
            son = e
            if e.code not in (429, 500, 502, 503, 504):
                raise
            bekle = int(e.headers.get("Retry-After", "0") or 0) or 30 * (2 ** i)
            time.sleep(min(bekle, 900))
        except (urllib.error.URLError, TimeoutError) as e:
            son = e
            time.sleep(10 * (i + 1))
    raise son


def wiki_api(host, **p):
    p["format"] = "json"
    return json.loads(al("https://%s/w/api.php?%s" % (host, urllib.parse.urlencode(p))))


# ------------------------------------------------------------ japonca
def japonca_filtre(metin, adet):
    """Leeds listesi: bir satir bir kelime, sira = siklik sirasi. Latin/isaret/EOS gurultusu atilir."""
    out, sira = [], 0
    for satir in metin.splitlines():
        sira += 1
        k = satir.strip()
        if k and CJK.search(k) and len(k) <= 8:
            out.append({"dil": "ja", "sira": sira, "kelime": k, "sayi": None,
                        "kaynak": "hingston/japanese (Leeds Uni. derlemi)", "lisans": "kaynak reposunda belirtildigi gibi",
                        "duzey": "ikincil", "etiket": "hesaplandı", "ceviri": None})
        if len(out) >= adet:
            break
    return out


# ------------------------------------------------------------ wiktionary
TR_SATIR = re.compile(r"^\*+\s*Turkish:\s*(.+)$", re.M)
TR_SABLON = re.compile(r"\{\{(?:t\+?|tt\+?)\|tr\|([^|}]+)")
TRANS_TOP = re.compile(r"\{\{trans-top\|([^}]*)\}\}")


def ceviri_cikar(wikitext):
    """[{'anlam_en': gloss, 'tr': [kelime,...]}] . Yalniz Translations tablosundaki acik {{t|tr|..}} girdileri."""
    sonuc, gloss = [], ""
    for satir in wikitext.splitlines():
        m = TRANS_TOP.search(satir)
        if m:
            gloss = re.sub(r"\[\[|\]\]|\{\{[^}]*\}\}", "", m.group(1)).strip()
            continue
        m = TR_SATIR.match(satir.strip())
        if m:
            kelimeler = [w.strip() for w in TR_SABLON.findall(m.group(1)) if w.strip()]
            if kelimeler:
                sonuc.append({"anlam_en": gloss, "tr": kelimeler})
    return sonuc


def _temiz_tanim(s):
    s = re.sub(r"\{\{[^{}]*\}\}", "", s)
    s = re.sub(r"\[\[(?:[^\]|]*\|)?([^\]]*)\]\]", r"\1", s)
    s = re.sub(r"'''?|<[^>]+>", "", s)
    return re.sub(r"\s+", " ", s).strip(" .;:")


def anlam_cikar(wikitext, dil_adi):
    """Bir dilin bolumundeki '# tanim' satirlari (Ingilizce). Sablonlar ve baglantilar sadelestirilir."""
    bol = re.search(r"^==\s*%s\s*==\s*$" % re.escape(dil_adi), wikitext, re.M)
    if not bol:
        return []
    kalan = wikitext[bol.end():]
    son = re.search(r"^==[^=].*==\s*$", kalan, re.M)
    kalan = kalan[:son.start()] if son else kalan
    out = []
    for s in kalan.splitlines():
        if re.match(r"^#(?![#:*])\s*\S", s):
            t = _temiz_tanim(s[1:])
            if len(t) >= 2:
                out.append(t)
    return out[:4]


def wikitext(host, sayfa):
    d = wiki_api(host, action="parse", page=sayfa, prop="wikitext", redirects=1)
    return d.get("parse", {}).get("wikitext", {}).get("*", "")


def asama_ceviri(log, tamamlananlar, tamamla, ekle, sinir=0):
    yol = TEMIZ / "esp" / "kelime_sikligi.jsonl"
    if not yol.exists():
        log("ceviri: once yapisal asama (kelime_sikligi.jsonl) lazim")
        return
    ing = [json.loads(l) for l in yol.open(encoding="utf-8") if '"dil": "en"' in l]
    bitti, n = tamamlananlar(), 0
    for k in ing:
        anahtar = "ceviri|en|" + k["kelime"]
        if anahtar in bitti:
            continue
        if sinir and n >= sinir:
            return
        n += 1
        try:
            c = ceviri_cikar(wikitext("en.wiktionary.org", k["kelime"]))
        except Exception as e:
            log("CEVIRI HATA", k["kelime"], str(e)[:60])
            time.sleep(5)
            continue
        ekle(TEMIZ / "esp" / "kelime_ceviri.jsonl", [{
            "dil": "en", "kelime": k["kelime"], "sira": k["sira"], "ceviriler": c,
            "etiket": "kaynakli-ikincil" if c else "veri yok",
            "kaynak": "https://en.wiktionary.org/wiki/" + urllib.parse.quote(k["kelime"]), "lisans": "CC BY-SA 4.0 (Vikisözlük)"}])
        tamamla(anahtar)
        time.sleep(1.2)
        if n % 100 == 0:
            log("ceviri", n, "kelime")


DIL_ADLARI = {"de": "German", "ru": "Russian", "es": "Spanish", "fr": "French", "it": "Italian", "ar": "Arabic",
              "ko": "Korean", "zh_cn": "Chinese", "ja": "Japanese", "pt": "Portuguese", "nl": "Dutch"}


def asama_anlam(log, tamamlananlar, tamamla, ekle, sinir=0, ilk=1500):
    yol = TEMIZ / "esp" / "kelime_sikligi.jsonl"
    if not yol.exists():
        return
    kayit = [json.loads(l) for l in yol.open(encoding="utf-8")]
    bitti, n = tamamlananlar(), 0
    for k in kayit:
        if k["dil"] not in DIL_ADLARI or k["sira"] > ilk:
            continue
        anahtar = "anlam|%s|%s" % (k["dil"], k["kelime"])
        if anahtar in bitti:
            continue
        if sinir and n >= sinir:
            return
        n += 1
        try:
            t = anlam_cikar(wikitext("en.wiktionary.org", k["kelime"]), DIL_ADLARI[k["dil"]])
        except Exception as e:
            log("ANLAM HATA", k["dil"], k["kelime"], str(e)[:60])
            time.sleep(5)
            continue
        ekle(TEMIZ / "esp" / "kelime_anlam_en.jsonl", [{
            "dil": k["dil"], "kelime": k["kelime"], "sira": k["sira"], "anlamlar_en": t,
            "etiket": "kaynakli-ikincil" if t else "veri yok",
            "kaynak": "https://en.wiktionary.org/wiki/" + urllib.parse.quote(k["kelime"]), "lisans": "CC BY-SA 4.0 (Vikisözlük)"}])
        tamamla(anahtar)
        time.sleep(1.2)


# ------------------------------------------------------------ tatoeba
TATOEBA = "https://downloads.tatoeba.org/exports/per_language/"
TATOEBA_DIL = {"en": "eng", "de": "deu", "ru": "rus", "ja": "jpn", "es": "spa", "fr": "fra", "it": "ita", "ar": "ara",
               "ko": "kor", "zh": "cmn", "pt": "por", "nl": "nld"}


def tatoeba_ciftleri(tur_cumleler, diger_cumleler, link_satirlari, sinir, kisa=(12, 90)):
    """tur_cumleler/diger_cumleler: {id: metin}; link_satirlari: 'tur_id<TAB>diger_id'. Kisa cumleler oncelikli."""
    out, gorulen = [], set()
    for s in link_satirlari:
        p = s.rstrip(NL).split(chr(9))
        if len(p) != 2:
            continue
        t, d = tur_cumleler.get(p[0]), diger_cumleler.get(p[1])
        if not t or not d or t in gorulen:
            continue
        if not (kisa[0] <= len(t) <= kisa[1]):
            continue
        gorulen.add(t)
        out.append((t, d, p[0], p[1]))
    out.sort(key=lambda x: len(x[0]))
    return out[:sinir]


def _bz2_satirlar(url):
    return bz2.decompress(al(url, zaman=300)).decode("utf-8", "replace").splitlines()


def _cumleler(url):
    d = {}
    for s in _bz2_satirlar(url):
        p = s.split(chr(9))
        if len(p) >= 3:
            d[p[0]] = p[2]
    return d


def asama_tatoeba(log, tamamlananlar, tamamla, ekle, sinir=4000):
    bitti = tamamlananlar()
    tur = None
    for kisa, kod in TATOEBA_DIL.items():
        if "tatoeba|" + kisa in bitti:
            continue
        try:
            if tur is None:
                tur = _cumleler(TATOEBA + "tur/tur_sentences.tsv.bz2")
            diger = _cumleler("%s%s/%s_sentences.tsv.bz2" % (TATOEBA, kod, kod))
            link = _bz2_satirlar("%stur/tur-%s_links.tsv.bz2" % (TATOEBA, kod))
        except Exception as e:
            log("TATOEBA HATA", kisa, str(e)[:80])
            continue
        cift = tatoeba_ciftleri(tur, diger, link, sinir)
        ekle(TEMIZ / "esp" / "cumle_ciftleri.jsonl", [{
            "dil": kisa, "tr": t, "yabanci": d, "tatoeba_tr_id": a, "tatoeba_id": b, "etiket": "kaynakli-ikincil",
            "kaynak": "https://tatoeba.org/tr/sentences/show/" + b, "lisans": "CC BY 2.0 FR (Tatoeba katkıcıları)"}
            for t, d, a, b in cift])
        tamamla("tatoeba|" + kisa)
        log("TATOEBA", kisa, len(cift), "cift")


# ------------------------------------------------------------ osym
OSYM_SAYFA = ["https://www.osym.gov.tr/{y}yks-tyt-ayt-ve-ydt-temel-soru-kitapciklari-ve-cevap-anahtarlari",
              "https://www.osym.gov.tr/{y}-yks-tyt-ayt-ve-ydt-temel-soru-kitapciklari-ve-cevap-anahtarlari",
              "https://www.osym.gov.tr/{y}yks-temel-soru-kitapciklari-ve-cevap-anahtarlari",
              "https://www.osym.gov.tr/{y}-yks-temel-soru-kitapciklari-ve-cevap-anahtarlari"]
PDF_LINK = re.compile(r'href="(https://dokuman\.osym\.gov\.tr/pdfdokuman/[^"\s]+\.pdf)\s*"', re.I)


def osym_pdf_linkleri(html_metin):
    return sorted(set(PDF_LINK.findall(html_metin)) - {"https://dokuman.osym.gov.tr/pdfdokuman/yasakli-ve-izinli-belgeler.pdf"})


def asama_osym(log, tamamlananlar, tamamla, yillar=range(2018, 2026)):
    bitti = tamamlananlar()
    for y in yillar:
        if "osym|%d" % y in bitti:
            continue
        linkler = []
        for kalip in OSYM_SAYFA:
            try:
                linkler = osym_pdf_linkleri(al(kalip.format(y=y), deneme=2).decode("utf-8", "replace"))
            except Exception:
                continue
            if linkler:
                break
        if not linkler:
            log("OSYM sayfa/link bulunamadi:", y, "(elle bakilmali: osym.gov.tr > YKS > temel soru kitapcikleri)")
            continue
        kok = HAM / "osym" / str(y)
        kok.mkdir(parents=True, exist_ok=True)
        for u in linkler:
            ad = u.rsplit("/", 1)[-1]
            pdf = kok / ad
            try:
                if not pdf.exists():
                    pdf.write_bytes(al(u, zaman=180))
                    time.sleep(2)
                if shutil.which("pdftotext") and not pdf.with_suffix(".txt").exists():
                    subprocess.run(["pdftotext", "-layout", "-enc", "UTF-8", str(pdf), str(pdf.with_suffix(".txt"))],
                                   capture_output=True, timeout=180)
            except Exception as e:
                log("OSYM indirme hatasi", ad, str(e)[:60])
        (kok / "kaynak.json").write_text(json.dumps({"yil": y, "pdf": linkler, "alinma": time.strftime("%Y-%m-%d")}, indent=1), encoding="utf-8")
        tamamla("osym|%d" % y)
        log("OSYM", y, len(linkler), "pdf")
