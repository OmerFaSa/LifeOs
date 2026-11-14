#!/usr/bin/env python3
"""Katman denetimi (plan A5, AGENTS §0.1): her parça kabuğa, bir motora ya da bir alana aittir.

Bir alan başka bir alanın ya da bir motorun içine uzanamaz; yalnız motorun açık arayüzünü çağırır.
Denetim statiktir (yalnız standart kütüphane, kod çalıştırılmaz):

  1. motor-kabuk  · motor/*.js kabuğu bilmez: `LIFEOS.Kabuk` yok, kabuk/ dosyası require edilmez.
  2. motor-ic     · motor, kabuk ve king/*.js bir motorun yalnız AÇIK ARAYÜZÜNÜ kullanır.
                    Açık arayüz: motor dosyasının `LIFEOS.Motor.<Ad> = X` ve `module.exports = X` ile
                    dışarı verdiği X nesnesinin üst düzey anahtarları (`Object.freeze({…})` ya da `{…}`
                    gövdesi) ve dosyada `X.ad = …` ile eklenenler. Geri kalan her işlev ve sabit iç işidir.
                    Kullanım: `<Ad>.ad` ve `<Ad>`'a bağlanan takma ad (`= LIFEOS.Motor.<Ad>`,
                    `= require(…motor…/<ad>.js)`) üzerinden `.ad`; yalnız ilk özellik denetlenir.
  3. alan-kod     · alan/<ad>/ yalnız veridir: .json/.md dışında dosya yok.
  4. alan-ici     · alan JSON'unda kod izi (`LIFEOS.`, `require(`, `<script`, `motor/…`, `kabuk/…`, `king/…`)
                    ve başka bir alanın yolu (`alan/<öteki>/`) yok. İstisna: `kaynaklar[].yol` (tur «depo»)
                    içeriğin geldiği yeri gösteren künyedir, çağrı değildir.

Bugünkü ağaçta kuralı bozan yerler ISTISNALAR'dadır; liste yalnız küçülür: yeni bozulma da,
kapanmış ama listede duran istisna da çıkış 1'dir.

  python kalite/katman.py          denetler, Türkçe satır basar (çıkış 0/1)
"""
import json
import re
import sys
from pathlib import Path

BURASI = Path(__file__).resolve().parent
KOK = BURASI.parent
sys.path.insert(0, str(BURASI))
from olcum import testmi  # noqa: E402  ölçümle aynı test dosyası kuralı

# (dosya, kural, ayrıntı) → neden. Satır numarası yok: satır kayar, istisna kaymaz.
ISTISNALAR = {
}

ALAN_VERI = {".json", ".md"}
KOD_IZI = re.compile(r"LIFEOS\.|require\(|<script|\b(?:motor|kabuk|king)/[\w./-]*\.(?:js|py)\b")
AD = r"[A-Za-z_$][\w$]*"


# ---------- JS temizleme ----------

def temizle(metin):
    """(yorumsuz, kodsuz): ikisinde de yorumlar boşluk; kodsuz'da dizgi ve düzenli ifade içi de boşluk.
    Satır sonları korunur (satır numarası doğru kalır).
    shortcut: şablon dizgisinin ${…} içi de silinir; orada motor çağrısı görünmez, gerekirse ${ } ayrıştırılmalı."""
    yorumsuz, kodsuz = [], []
    i, n, onceki = 0, len(metin), ""

    def bos(parca):
        return re.sub(r"[^\n]", " ", parca)

    while i < n:
        c, iki = metin[i], metin[i:i + 2]
        if iki == "//" or iki == "/*":
            j = metin.find("\n", i) if iki == "//" else metin.find("*/", i + 2)
            j = n if j < 0 else (j if iki == "//" else j + 2)
            parca = bos(metin[i:j])
            yorumsuz.append(parca)
            kodsuz.append(parca)
            i = j
            continue
        dizgi = c in "'\"`"
        duzenli = c == "/" and (onceki == "" or onceki in "(,=:[!&|?{};+-*%<>~^" or
                                re.search(r"\b(?:return|typeof|case|in|of)\s*$", "".join(kodsuz[-1:])))
        if dizgi or duzenli:
            j, sinif = i + 1, False
            while j < n:
                d = metin[j]
                if d == "\\":
                    j += 2
                    continue
                if duzenli and d == "[":
                    sinif = True
                elif duzenli and d == "]":
                    sinif = False
                elif d == c and not sinif:
                    break
                elif d == "\n" and c != "`":
                    break
                j += 1
            j = min(j + 1, n)
            yorumsuz.append(metin[i:j])
            kodsuz.append(c + bos(metin[i + 1:j - 1]) + metin[j - 1:j] if j - i >= 2 else metin[i:j])
            onceki = "a"
            i = j
            continue
        yorumsuz.append(c)
        kodsuz.append(c)
        if not c.isspace():
            onceki = c
        i += 1
    return "".join(yorumsuz), "".join(kodsuz)


def satir_no(metin, konum):
    return metin.count("\n", 0, konum) + 1


def ust_parcalar(govde):
    """Temizlenmiş nesne gövdesini üst düzey virgüllerden böler."""
    parca, derinlik, bas = [], 0, 0
    for j, c in enumerate(govde):
        if c in "([{":
            derinlik += 1
        elif c in ")]}":
            derinlik -= 1
        elif c == "," and derinlik == 0:
            parca.append(govde[bas:j])
            bas = j + 1
    return parca + [govde[bas:]]


def kapanis(metin, i):
    derinlik = 0
    for j in range(i, len(metin)):
        derinlik += metin[j] in "([{"
        derinlik -= metin[j] in ")]}"
        if derinlik == 0:
            return j
    return len(metin)


# ---------- açık arayüz ----------

def js_dosyalari(kok, klasor):
    return sorted(p for p in (kok / klasor).glob("*.js") if not testmi(f"{klasor}/{p.name}"))


def acik_arayuz(kok):
    """{Ad: {anahtar}} — motor/*.js'nin LIFEOS.Motor.<Ad>'a verdiği nesnenin üst düzey anahtarları."""
    arayuz, dosya_motor = {}, {}
    for p in js_dosyalari(kok, "motor"):
        _, kod = temizle(p.read_text(encoding="utf-8"))
        for ad, nesne in re.findall(r"LIFEOS\.Motor\.(" + AD + r")\s*=\s*(" + AD + r")\s*;", kod):
            tanim = re.search(r"\b(?:const|var|let)\s+" + re.escape(nesne) + r"\s*=\s*(?:Object\.freeze\(\s*)?\{", kod)
            if not tanim:
                continue
            ac = tanim.end() - 1
            anahtar = set()
            for s in ust_parcalar(kod[ac + 1:kapanis(kod, ac)]):
                m = re.match(r"\s*(?:async\s+)?(?:[gs]et\s+(?=" + AD + r"\s*\())?\*?\s*(" + AD + r")", s)
                if m and not s.strip().startswith("..."):
                    anahtar.add(m.group(1))
            anahtar |= set(re.findall(r"(?<![\w$.])" + re.escape(nesne) + r"\.(" + AD + r")\s*=(?!=)", kod))
            arayuz.setdefault(ad, set()).update(anahtar)
            dosya_motor[f"motor/{p.name}"] = ad
    return arayuz, dosya_motor


def tutamaklar(yorumsuz, kod, motorlar):
    """{takma ad: motor Ad} — motorun kendi adı ve ona bağlanan değişkenler."""
    t = {ad: ad for ad in motorlar}
    for takma, ad in re.findall(r"\b(" + AD + r")\s*=\s*[\w$.]*Motor(?:\s*&&\s*[\w$.]*Motor)?\.(" + AD + r")\b", kod):
        if ad in motorlar:
            t[takma] = ad
    kucuk = {ad.lower(): ad for ad in motorlar}
    for takma, yol in re.findall(r"\b(" + AD + r")\s*=\s*require\(([^)]*)\)", yorumsuz):
        if "motor" in yol:
            m = re.search(r"([a-z]+)\.js", yol)
            if m and m.group(1) in kucuk:
                t[takma] = kucuk[m.group(1)]
    return t


# ---------- denetim ----------

def bulgular(kok=KOK):
    """[(dosya, satır, kural, ayrıntı, Türkçe ileti)]"""
    kok = Path(kok)
    arayuz, dosya_motor = acik_arayuz(kok)
    sonuc = []
    for klasor in ("motor", "kabuk", "king"):
        for p in js_dosyalari(kok, klasor):
            rel = f"{klasor}/{p.name}"
            yorumsuz, kod = temizle(p.read_text(encoding="utf-8"))
            kendi = dosya_motor.get(rel)
            if klasor == "motor":
                for m in re.finditer(r"LIFEOS\.Kabuk\b", kod):
                    sonuc.append((rel, satir_no(kod, m.start()), "motor-kabuk", "LIFEOS.Kabuk",
                                  "motor kabuğa uzanıyor (LIFEOS.Kabuk); motor kabuğu bilmez"))
                for m in re.finditer(r"require\(([^)]*)\)", yorumsuz):
                    if "kabuk" in m.group(1):
                        sonuc.append((rel, satir_no(yorumsuz, m.start()), "motor-kabuk", "require",
                                      f"motor kabuk dosyası yüklüyor: require({m.group(1).strip()})"))
            for takma, ad in tutamaklar(yorumsuz, kod, arayuz).items():
                if ad == kendi:
                    continue
                for m in re.finditer(r"(?<![\w$])" + re.escape(takma) + r"\s*\.\s*(" + AD + r")", kod):
                    if m.group(1) not in arayuz[ad]:
                        sonuc.append((rel, satir_no(kod, m.start()), "motor-ic", f"{ad}.{m.group(1)}",
                                      f"{ad} motorunun açık arayüzünde olmayan «{m.group(1)}»a uzanıyor "
                                      f"(açık arayüz: LIFEOS.Motor.{ad} nesnesinin anahtarları)"))
    # _/. ile baslayan klasor alan degildir: CI'da alan/denetle_test.py denetle'yi ice aktarinca alan/__pycache__ olusur
    alanlar = sorted(p.name for p in (kok / "alan").iterdir()
                     if p.is_dir() and not p.name.startswith(("_", "."))) if (kok / "alan").is_dir() else []
    for a in alanlar:
        for p in sorted((kok / "alan" / a).rglob("*")):
            if not p.is_file():
                continue
            rel = p.relative_to(kok).as_posix()
            if p.suffix not in ALAN_VERI:
                sonuc.append((rel, 1, "alan-kod", "", "alan klasöründe kod dosyası; alan yalnız veridir (.json/.md)"))
                continue
            if p.suffix != ".json":
                continue
            try:
                veri = json.loads(p.read_text(encoding="utf-8"))
            except ValueError as e:
                sonuc.append((rel, 1, "alan-ici", "json", f"JSON okunamadı: {e}"))
                continue
            for yol, s in dizgiler(veri):
                for m in KOD_IZI.finditer(s):
                    sonuc.append((rel, 1, "alan-ici", m.group(0), f"alan verisinde kod izi «{m.group(0)}» ({yol})"))
                for m in re.finditer(r"\balan/([a-z0-9_-]+)/", s):
                    if m.group(1) != a:
                        sonuc.append((rel, 1, "alan-ici", m.group(0),
                                      f"alan başka bir alana uzanıyor «{m.group(0)}» ({yol})"))
    return sonuc


def dizgiler(veri, yol="$"):
    """JSON'daki her dizge (yol, metin); kaynaklar[] içindeki «depo» künyesinin yol'u atlanır."""
    if isinstance(veri, dict):
        kunye = veri.get("tur") == "depo"
        for k, v in veri.items():
            if not (kunye and k == "yol" and "kaynaklar" in yol):
                yield from dizgiler(v, f"{yol}.{k}")
    elif isinstance(veri, list):
        for i, v in enumerate(veri):
            yield from dizgiler(v, f"{yol}[{i}]")
    elif isinstance(veri, str):
        yield yol, veri


def denetle(kok=KOK, istisnalar=None):
    """(hatalar, bilinenler): Türkçe satırlar. Hata varsa çıkış 1."""
    istisnalar = ISTISNALAR if istisnalar is None else istisnalar
    hata, bilinen, gorulen = [], [], set()
    for dosya, satir, kural, ayr, ileti in bulgular(kok):
        anahtar = (dosya, kural, ayr)
        if anahtar in istisnalar:
            gorulen.add(anahtar)
            bilinen.append(f"BİLİNEN İSTİSNA: {dosya} [{kural}] {ileti} — {istisnalar[anahtar]}")
        else:
            hata.append(f"KATMAN: {dosya}:{satir} [{kural}] {ileti}")
    for anahtar in sorted(set(istisnalar) - gorulen):
        hata.append(f"KAPANDI: {anahtar[0]} [{anahtar[1]}] artık bozmuyor; kalite/katman.py ISTISNALAR'dan "
                    "çıkarın (liste yalnız küçülür)")
    return hata, bilinen


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    hata, bilinen = denetle(Path(sys.argv[1]) if len(sys.argv) > 1 else KOK)
    for s in bilinen + hata:
        print(s)
    if hata:
        return 1
    arayuz, _ = acik_arayuz(KOK if len(sys.argv) < 2 else Path(sys.argv[1]))
    print(f"Katman tamam: {len(arayuz)} motorun açık arayüzü, {len(bilinen)} bilinen istisna, yeni bozulma yok.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
