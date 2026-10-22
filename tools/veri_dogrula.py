#!/usr/bin/env python3
"""taslak/ kaydini resmi kaynagin METNIYLE dogrular; dogrulananı temiz/'e alir.

Kural (veri/DENETIM.md, tools/veri_denetle.py): temiz/'de her kaynakli kayit
kaynaktan AYNEN bir alinti tasir. Bu arac kaydin adini ve onerdigi her sayiyi
kaynak metninde AYNI sutun parcasinda (ya da bir alt satirin ayni sutununda)
arar:
  - hepsi bulunursa kayit temiz/'e gider: kaynak adresi, o parcanin metni
    'alinti' olarak, etiket 'kaynakli-birincil'. Kaydin kaynakta olmayan
    alanlari (ust sinir, aciklama) ALINMAZ.
  - bulunamazsa kayit taslak/'ta kalir; 'dogrulama' alani nedenini soyler.
Sayi kaydin BIRIMIYLE birlikte aranir: yuzde «%45-60», gram «5 g», litre
«2.5 litre», mg / µg (mcg). Icindekiler satirlari (noktali) sayilmaz.
Eslesme bir insanin bakacagi yeri gosterir, anlami kanitlamaz: alinti bu
yuzden kayitla birlikte durur ve ekranda gorunur.

Kaynak metni: veri/ham/<id>.txt (pdftotext -layout). PDF yoksa indirilir
(KAYNAKLAR.json'daki adres) ve metne cevrilir.

Kullanim: python tools/veri_dogrula.py tuber
"""
import json
import re
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
VERI = KOK / "veri"
HAM = VERI / "ham"

IS = {
    "tuber": {
        "kaynak": "tuber-2022",
        "url": "https://hsgm.saglik.gov.tr/depo/birimler/saglikli-beslenme-ve-hareketli-hayat-db/Dokumanlar/Rehberler/Turkiye_Beslenme_Rehber_TUBER_2022_min.pdf",
        "baslik": "Türkiye Beslenme Rehberi (TÜBER) 2022, T.C. Sağlık Bakanlığı",
        "taslak": VERI / "taslak" / "spi" / "tuber_beslenme_rehberi.jsonl",
        "temiz": VERI / "temiz" / "spi" / "tuber_dogrulanan.jsonl",
        "ad": "besin_ogesi",
        "sayi": "oneri_degeri",
        "anahtar": {
            "Karbonhidrat": ["karbonhidrat"], "Serbest Şeker": ["serbest şeker"], "Protein": ["protein"],
            "Toplam Yağ": ["yağ"], "Doymuş Yağ": ["doymuş"], "Trans Yağ": ["trans"],
            "Diyet Lifi (Posa)": ["posa", "lif"], "Tuz (Sodyum Klorür)": ["tuz"], "Su Tüketimi": ["su", "sıvı"],
            "Kalsiyum (Ca)": ["kalsiyum"], "Demir (Fe) - Erkek": ["demir"], "Demir (Fe) - Kadın": ["demir"],
            "Magnezyum (Mg) - Erkek": ["magnezyum"], "Magnezyum (Mg) - Kadın": ["magnezyum"],
            "Çinko (Zn) - Erkek": ["çinko"], "Çinko (Zn) - Kadın": ["çinko"], "İyot (I)": ["iyot"],
            "Selenyum (Se)": ["selenyum"], "Potasyum (K)": ["potasyum"], "Vitamin D (Kolekalsiferol)": ["d vitamini", "vitamin d"],
            "Vitamin B12 (Kobalamin)": ["b12"], "Folat (Folik Asit)": ["folat"],
            "Vitamin C (Askorbik Asit) - Erkek": ["c vitamini", "vitamin c"], "Vitamin C (Askorbik Asit) - Kadın": ["c vitamini", "vitamin c"],
        },
    },
}

HARF = "a-zçğıöşüâîû"


def kucuk(s):
    return s.replace("I", "ı").replace("İ", "i").lower()


def metin(kaynak, url):
    txt = HAM / f"{kaynak}.txt"
    if txt.exists():
        return txt.read_text(encoding="utf-8")
    pdf = HAM / f"{kaynak}.pdf"
    if not pdf.exists():
        HAM.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(url, headers={"User-Agent": "LifeOS-Veri/2.0 (dogrulama)"})
        with urllib.request.urlopen(req, timeout=300) as r:
            pdf.write_bytes(r.read())
    if not shutil.which("pdftotext"):
        raise SystemExit("pdftotext yok: kaynak metne cevrilemedi")
    subprocess.run(["pdftotext", "-layout", "-enc", "UTF-8", str(pdf), str(txt)], check=True)
    return txt.read_text(encoding="utf-8")


def sayilar(s):
    """'45 - 60' -> ['45', '60']; '< 10 (ideal < 5)' -> ['10']; '15 (600 IU)' -> ['15']."""
    s = re.sub(r"\(.*?\)", " ", str(s))
    return re.findall(r"\d+(?:[.,]\d+)?", s)


def sayi_govde(x):
    a, _, b = x.replace(",", ".").partition(".")
    return re.escape(a) + (r"[.,]" + re.escape(b) if b else "")


def birim_kalip(birim):
    """(once, sonra): sayinin onunde ve ardinda gecmesi gereken birim."""
    b = kucuk(str(birim or ""))
    if b.startswith("%"):
        return r"%\s*", ""
    if b.startswith("mg"):
        return "", r"\s*mg"
    if b.startswith("µg") or b.startswith("mcg"):
        return "", r"\s*(?:µg|μg|mcg|mikrogram)"
    if b.startswith("l"):
        return "", r"\s*(?:litre|lt|l)(?![" + HARF + "])"
    if b.startswith("g"):
        return "", r"\s*(?:g|gram)(?![" + HARF + "])"
    return "", ""


def sayi_kaliplari(sl, birim):
    """Aralik once butun olarak («%45-60»), olmazsa her sayi kendi biriminle."""
    once, sonra = birim_kalip(birim)
    sinir = r"(?<![\d.,])"
    if len(sl) == 2:
        butun = re.compile(sinir + once + sayi_govde(sl[0]) + r"\s*[-–]\s*" + (r"(?:%\s*)?" if once else "")
                           + sayi_govde(sl[1]) + r"(?![\d]|[.,]\d)" + sonra)
        return [[butun], [re.compile(sinir + once + sayi_govde(x) + r"(?![\d]|[.,]\d)" + sonra) for x in sl]]
    return [[re.compile(sinir + once + sayi_govde(x) + r"(?![\d]|[.,]\d)" + sonra) for x in sl]]


def parcalar(satirlar):
    """Her satir sutunlara (3+ bosluk) bolunur; (satir no, sutun no, metin)."""
    for i, s in enumerate(satirlar):
        for j, p in enumerate(re.split(r"\s{3,}", s.strip())):
            if p:
                yield i, j, p


YAKIN = 80                      # ad ile sayi arasi en cok bu kadar karakter
BASKA_GRUP = re.compile(r"(bebek|çocuk|gebe|emzik|ergen|okul öncesi|yaşlı)")


def bul(satirlar, anahtarlar, sayi_l, birim, cinsiyet=None):
    """Ad ve sayi(lar) ayni parcada, birbirine YAKIN; kayit bir cinsiyete aitse o
    kelime de parcada; baska bir yas/durum grubunu anlatan parca sayilmaz."""
    an = [re.compile(r"(?<![" + HARF + r"])" + re.escape(kucuk(a))) for a in anahtarlar]
    secenekler = sayi_kaliplari(sayi_l, birim)
    sutun = {}
    for i, j, p in parcalar(satirlar):
        sutun.setdefault(i, {})[j] = p
    for i in sorted(sutun):
        for j, p in sutun[i].items():
            if "....." in p:
                continue
            for aday in (p, p + " " + sutun.get(i + 1, {}).get(j, "")):
                k = kucuk(aday)
                if BASKA_GRUP.search(k) or (cinsiyet and cinsiyet not in k):
                    continue
                ad_yer = [m.start() for a in an for m in a.finditer(k)]
                for sr in secenekler:
                    eslesen = [r.search(aday) for r in sr]
                    if ad_yer and all(eslesen) and all(min(abs(m.start() - y) for y in ad_yer) <= YAKIN for m in eslesen):
                        return i + 1, re.sub(r"\s+", " ", aday).strip()
    return None, None


def calistir(ad):
    c = IS[ad]
    satirlar = metin(c["kaynak"], c["url"]).splitlines()
    kayitlar = [json.loads(x) for x in c["taslak"].read_text(encoding="utf-8").splitlines() if x.strip()]
    temiz, kalan = [], []
    tarih = time.strftime("%Y-%m-%d")
    for r in kayitlar:
        r = {k: v for k, v in r.items() if k != "dogrulama"}
        anahtar = c["anahtar"].get(r[c["ad"]], [r[c["ad"]].split()[0]])
        sl = sayilar(r[c["sayi"]])
        cins = "erkek" if "Erkek" in r[c["ad"]] else "kadın" if "Kadın" in r[c["ad"]] else None
        satir, alinti = bul(satirlar, anahtar, sl, r.get("birim"), cins) if sl else (None, None)
        if alinti:
            temiz.append({"sistem": r.get("sistem", "SPI"), "kategori": r.get("kategori"), c["ad"]: r[c["ad"]],
                          "oneri": r[c["sayi"]], "birim": r.get("birim"), "kaynak": c["url"], "kaynak_ad": c["baslik"],
                          "satir": satir, "alinti": alinti, "alinma": tarih, "duzey": "birincil", "etiket": "kaynakli-birincil"})
        else:
            r["dogrulama"] = f"kaynakta bulunamadı ({c['baslik']}, {tarih}): ad ve {', '.join(sl) or 'sayı'} aynı yerde geçmiyor"
            kalan.append(r)
    yaz = lambda yol, l: yol.write_text("".join(json.dumps(x, ensure_ascii=False) + "\n" for x in l), encoding="utf-8")
    yaz(c["temiz"], temiz)
    yaz(c["taslak"], kalan)
    print(f"{ad}: {len(temiz)} kayit dogrulandi -> {c['temiz'].relative_to(KOK)}; {len(kalan)} taslakta kaldi")
    for x in temiz:
        print(f"  + {x[c['ad']]}: {x['oneri']}  | satir {x['satir']}: {x['alinti'][:110]}")
    for x in kalan:
        print(f"  - {x[c['ad']]}: {x[c['sayi']]}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in IS:
        sys.exit("Kullanim: python tools/veri_dogrula.py " + "|".join(IS))
    sys.exit(calistir(sys.argv[1]))
