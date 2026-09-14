#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Analiz paketi — bir DIS INCELEYICIYE verilecek tek dosya.

   «Şu depoyu analiz et» demek, 106 bin satır kodu ve 211 KB belgeyi bir
   bağlam penceresine sığdırmayı ummaktır. Sığmaz; sığmadığında da eleştiri
   koda değil TAHMINE dayanır — bu depoda üç tur böyle geçti ve her turda
   var olmayan eksikler «bulundu».

   Bu araç onun yerine bir PAKET üretir: harita, sözleşmeler, modül
   yüzeyleri, ölçülmüş sayılar ve açık sorular. Kodun kendisi değil,
   kodun İSKELETI gider — ve inceleyiciden her iddiasını dosya:satır ile
   göstermesi istenir.

     python3 tools/paket.py            # PAKET.md yazar
     python3 tools/paket.py --stdout   # ekrana yazar
"""

import os
import re
import subprocess
import sys

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SISTEMLER = [("AYS", "Akademik Yol Sistemi"), ("SPI", "Sağlık Performans İzleyicisi"),
             ("ESP", "Entelektüel Seviye Planlayıcı"), ("HKM", "Hayat Kontrol Merkezi")]
ATLA = ("node_modules", "dist", ".git", "shots", "db")


def satir_say(yol):
    try:
        with open(yol, encoding="utf-8", errors="replace") as f:
            return sum(1 for _ in f)
    except OSError:
        return 0


def dosyalar(kok, uzanti):
    out = []
    for dizin, alt, isimler in os.walk(kok):
        alt[:] = [d for d in alt if d not in ATLA]
        for ad in isimler:
            if ad.endswith(uzanti):
                yol = os.path.join(dizin, ad)
                out.append((os.path.relpath(yol, KOK), satir_say(yol)))
    return sorted(out)


def harita():
    satir = ["## 1. Harita", "",
             "| Sistem | Dosya | Satır | Test dosyası | Araç |", "|---|---|---|---|---|"]
    for kod, ad in SISTEMLER:
        kokdiz = os.path.join(KOK, kod)
        js = dosyalar(kokdiz, ".js")
        py = dosyalar(kokdiz, ".py")
        test = [d for d, _ in js + py if "test" in d]
        arac = [d for d, _ in js + py if "/tools/" in d.replace("\\\\", "/")]
        toplam = sum(n for _, n in js + py)
        satir.append("| **%s** — %s | %d | %d | %d | %d |"
                     % (kod, ad, len(js) + len(py), toplam, len(test), len(arac)))
    satir += ["", "### En büyük 20 dosya", "", "```"]
    hepsi = []
    for kod, _ in SISTEMLER:
        hepsi += dosyalar(os.path.join(KOK, kod), ".js")
        hepsi += dosyalar(os.path.join(KOK, kod), ".py")
    for yol, n in sorted(hepsi, key=lambda x: -x[1])[:20]:
        satir.append("%6d  %s" % (n, yol))
    satir.append("```")
    return "\n".join(satir)


def js_yuzey(yol):
    """Modülün DIŞA AÇTIĞI yüzey: `return { ... }` satırları."""
    try:
        with open(os.path.join(KOK, yol), encoding="utf-8") as f:
            metin = f.read()
    except OSError:
        return ""
    m = re.findall(r"\n\s*return \{([^}]*)\};\s*\n\}\)\(\);", metin)
    if not m:
        return ""
    alanlar = re.sub(r"\s+", " ", m[-1]).strip()
    return alanlar[:400]


def py_yuzey(yol):
    try:
        with open(os.path.join(KOK, yol), encoding="utf-8") as f:
            adlar = re.findall(r"^def ([a-zA-Z_][a-zA-Z0-9_]*)\(", f.read(), re.M)
    except OSError:
        return ""
    return ", ".join(a for a in adlar if not a.startswith("_"))[:400]


def yuzeyler():
    satir = ["## 2. Modül yüzeyleri", "",
             "Her modülün DIŞA AÇTIĞI isimler. Gövde yok: bir incelemenin",
             "başlangıcı ne yapıldığı değil, neyin çağrılabilir olduğudur.", ""]
    for kod, _ in SISTEMLER:
        satir.append("### %s" % kod)
        satir.append("")
        satir.append("```")
        cekirdek = [d for d, _ in dosyalar(os.path.join(KOK, kod), ".js")
                    if "/core/" in d.replace("\\\\", "/") and "test" not in d]
        for yol in sorted(cekirdek):
            y = js_yuzey(yol)
            if y:
                satir.append("%-34s %s" % (os.path.basename(yol), y))
        for yol, _ in dosyalar(os.path.join(KOK, kod), ".py"):
            if "/test" in yol.replace("\\\\", "/") or "/tools/" in yol.replace("\\\\", "/"):
                continue
            y = py_yuzey(yol)
            if y:
                satir.append("%-34s %s" % (os.path.basename(yol), y))
        satir.append("```")
        satir.append("")
    return "\n".join(satir)


def doktrin():
    """Belgelerden kural başlıklarını toplar — özet değil ALINTI."""
    kaynaklar = [("README.md", 0), ("HKM/MIMARI.md", 0), ("ESP/src/MIMARI.md", 0),
                 ("SPI/src/MIMARI.md", 0), ("AYS/src/OFIS.md", 0)]
    satir = ["## 3. Doktrin — bu depoda neyin YAPILMADIĞI", "",
             "Aşağıdakiler belgelerin kendi başlıklarıdır; öneri getirirken",
             "bunları bilmeyen bir eleştiri, var olan bir kuralı «eksik» sanar.", ""]
    for yol, _ in kaynaklar:
        tam = os.path.join(KOK, yol)
        if not os.path.exists(tam):
            continue
        with open(tam, encoding="utf-8") as f:
            basliklar = [s.strip() for s in f if s.startswith("#")]
        satir.append("**%s**" % yol)
        satir.append("")
        for b in basliklar[:28]:
            satir.append("- " + b.lstrip("# ").strip())
        satir.append("")
    return "\n".join(satir)


def sayilar():
    yol = os.path.join(KOK, "README.md")
    with open(yol, encoding="utf-8") as f:
        metin = f.read()
    m = re.search(r"<!-- SAYILAR:baslangic -->(.*?)<!-- SAYILAR:bitis -->", metin, re.S)
    govde = m.group(1).strip() if m else "(sayılar üretilmemiş)"
    return "## 4. Ölçülmüş sayılar\n\nBu tablo elle yazılmaz; `tools/sayilar.py` " \
           "araçları koşturur ve her aracın kendi son satırını yazar.\n\n" + govde


def git_ozet():
    try:
        son = subprocess.run(["git", "log", "--oneline", "-25"], cwd=KOK,
                             capture_output=True, text=True, timeout=30).stdout.strip()
        say = subprocess.run(["git", "rev-list", "--count", "HEAD"], cwd=KOK,
                             capture_output=True, text=True, timeout=30).stdout.strip()
    except Exception:
        son, say = "", "?"
    return ("## 5. Son 25 commit (toplam %s)\n\n```\n%s\n```" % (say, son))


SORULAR = """## 6. İncelemeden beklenen — ve beklenmeyen

**Beklenen (bu sırayla):**

1. **Yanlış olan bir şey göster.** Bir dosya:satır ver, neyin yanlış
   olduğunu ve hangi girdi ile bozulduğunu yaz. «Şu daha iyi olurdu» bir
   bulgu değildir; «şu girdi ile şu çıktı yanlış» bir bulgudur.
2. **Doktrinin kendisini eleştir.** Kural motoru otoritedir, eksik veri
   sıfır değildir, model sayı üretmez, HKM'ye bağımlılık tek yönlüdür.
   Bunlar seçimdir; yanlış seçim olduklarını düşünüyorsan **neyi imkânsız
   kıldıklarını** göster.
3. **Ölçülmeyeni söyle.** Bu depo kendi kendini ölçmeye çalışıyor
   (sürtünme, Goodhart, kalibrasyon, kanıt eksenleri, etki, kapsama).
   Hangi önemli şey hâlâ ölçülmüyor?
4. **Dokuz aylık ufku hedefle.** On yıllık mimari tavsiyesi istemiyorum;
   dokuz ay boyunca her gün kullanılacak bir sistem için ne kırılır?

**Beklenmeyen:**

- Var olmayan bir eksiği «eksik» diye bildirmek. Paketteki modül
  yüzeylerinde adı geçen bir şey **vardır**; emin değilsen «şunu
  göremedim» yaz, «yok» yazma.
- Genel yazılım tavsiyesi (test yazın, tip ekleyin, CI kurun…).
  Bu depoda 2 618 test ve on denetim aracı var; sayılar §4'te.
- Bir çerçeve/kütüphane önerisi. Üç arayüzün **sıfır çalışma zamanı
  bağımlılığı** bilinçli bir karardır (HKM'de yalnız Python stdlib).

**Cevap biçimi:** her bulgu için `dosya:satır · ne yanlış · hangi girdide ·
nasıl doğrulanır` dörtlüsü. Doğrulanamayan bir bulgu, bulgu değil izlenimdir.
"""


def uret():
    parcalar = [
        "# LifeOS — dış inceleme paketi",
        "",
        "Bu dosya elle yazılmaz: `python3 tools/paket.py` üretir.",
        "İçinde kodun kendisi değil, kodun **iskeleti** vardır — harita,",
        "modül yüzeyleri, doktrin başlıkları, ölçülmüş sayılar ve açık",
        "sorular. Kaynak: <https://github.com/OmerFaSa/LifeOs>",
        "",
        harita(), "", yuzeyler(), doktrin(), "", sayilar(), "", git_ozet(), "",
        SORULAR,
    ]
    return "\n".join(parcalar) + "\n"


def main():
    metin = uret()
    if "--stdout" in sys.argv:
        sys.stdout.write(metin)
        return 0
    yol = os.path.join(KOK, "PAKET.md")
    with open(yol, "w", encoding="utf-8") as f:
        f.write(metin)
    print("PAKET.md yazıldı — %d karakter (≈%d bin jeton)."
          % (len(metin), len(metin) // 3500))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
