#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Marka görsellerini SERVİS EDİLEBİLİR hâle getirir.

   NE İŞE YARAR

   Dört sistemin ortak marka görselleri — modül kapakları, ajan
   portreleri, durum illüstrasyonları, dokular, ikonlar, rapor
   kapakları. Hepsi `brand/medya/<aile>/` altında durur ve
   `/img/marka/<ad>.webp` adresinden servis edilir.

   Seviye medyasıyla (`tools/rutbe.py`) KARIŞMAZ ve karışmamalı: orası
   bir kataloğa bağlıdır ve eksiği kod tarafından bilinir; burası
   serbesttir, bir doku eklenmesi hiçbir kodu kırmaz.

   ------------------------------------------------------------------
   ÖNCE `--dene`

   Büyük bir teslimatta otuz dosyanın adı yanlışsa, bunu YAZDIKTAN
   SONRA değil yazmadan önce bilmek gerekir. `--dene` hiçbir şey
   yazmaz; her dosya için nereye gideceğini ya da neden gitmeyeceğini
   söyler.

       python3 tools/marka.py ~/indirilenler --dene
       python3 tools/marka.py ~/indirilenler
       python3 tools/marka.py --liste

   ------------------------------------------------------------------
   KALİTEDEN ÖDÜN VERİLMEZ

   Varsayılan KAYIPSIZDIR. Hiçbir piksel değişmez, hiçbir görsel
   küçülmez. Yapılan tek şey aynı pikselleri daha iyi PAKETLEMEK:
   saydam kenar boşluğu kırpılır (atılan şey görünmeyen boşluktur,
   ışık değil) ve kayıpsız WebP olarak yazılır. Video olduğu gibi
   kopyalanır — depo sahibinin ürettiğini ikinci kez bozmak olurdu.

   ------------------------------------------------------------------
   AD HEDEFİ BELİRLER, İÇERİK DEĞİL

   Araç görselin içine bakıp «bu hangi ajan» diye TAHMİN ETMEZ. Adı
   bir aileye uymayan dosya işlenmez ve sebebi yazılır; sessizce
   atlanan bir dosya, «neden görünmüyor» diye aranan bir akşam demekti.

   Üreticinin verdiği ad ile servis edilen ad farklı olabilir: alt
   çizgi tireye döner, Türkçe karakter sadeleşir, büyük harf küçülür.
   Çeviri TEK yerde (`kanonik`) yazılıdır.
"""

import os
import re
import shutil
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
MEDYA = KOK / "brand" / "medya"

# Aileler ve ne oldukları. Klasör adı = önek.
AILELER = {
    "kimlik":  "modül kapak ve hero görselleri",
    "ajan":    "ajan portreleri",
    "durum":   "durum illüstrasyonları",
    "tanitim": "ilk kurulum sahneleri",
    "doku":    "arka plan dokuları",
    "bos":     "boş durum illüstrasyonları",
    "kapak":   "rapor kapakları",
    "simge":   "ikon ailesi",
    # AŞAĞIDAKİ DÖRT AİLE BİR KAVRAMA BAĞLIDIR, bir temaya değil —
    # ve adları o kavramın KATALOGTAKİ kimliğinden türer, elle
    # uydurulmaz. Bir katalog kimliği değişirse görsel bulunamaz
    # olur; `tools/gorsel.py --denetle` tam bunu yakalar.
    "etiket":   "kesinlik etiketleri (ölçüldü/tahmin/hesaplandı/veri yok)",
    "ders":     "AYS ders amblemleri (subjects.js kimlikleri)",
    "disiplin": "ESP disiplin amblemleri (rules.js kimlikleri)",
    "olcum":    "SPİ ölçüm ikonları (xpsayim.js OLCUM alanları)",
    "harita":   "sistem haritası ve posterler",
}

GORSEL = {".png", ".jpg", ".jpeg", ".webp", ".svg"}
VIDEO = {".mp4", ".webm"}

# Turkce karakterler dosya adinda YER ALMAZ: ad bir URL parcasidir ve
# yuzde kodlamasi gereken bir ad, bir gun bulunamayan bir istektir.
SADELES = str.maketrans({
    "ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u",
    "Ç": "c", "Ğ": "g", "İ": "i", "I": "i", "Ö": "o", "Ş": "s", "Ü": "u",
})


def kanonik(govde: str):
    """Üreticinin adını servis edilen ada çevirir; (aile, ad) döner.

    Uymuyorsa (None, sebep). Kural tek yerde yazılıdır:
      · küçük harf, Türkçe karakter sadeleşir
      · boşluk ve alt çizgi tire olur
      · art arda tireler tek tireye iner
      · ilk parça AİLE adı olmak zorunda
    """
    ad = govde.translate(SADELES).lower()
    ad = re.sub(r"[\s_]+", "-", ad)
    ad = re.sub(r"[^a-z0-9-]", "", ad)
    ad = re.sub(r"-{2,}", "-", ad).strip("-")
    if not ad:
        return None, "ad boşaldı"
    aile = ad.split("-", 1)[0]
    if aile not in AILELER:
        return None, "aile tanınmadı (%s)" % ", ".join(sorted(AILELER))
    if ad == aile:
        return None, "aileden sonra bir ad gerekiyor (örn. %s-ays)" % aile
    return aile, ad


def _kb(n):
    return "%6.0f KB" % (n / 1024)


# ------------------------------------------------------------------
# KARE PORTRE BIR FOTOGRAFTIR: DELIGI OLAMAZ
#
# 2026-09-25'te bulundu: yirmi bes kare portrenin yirmi ikisinde saydam
# delik vardi — acik renkli ve kenara degen her yer (acik duvar, beyaz
# tisort, krem kazak) silinmisti. «Beyaz zemini sil» isleminin izi:
# portreler beyaz zeminli bir tabakadan kesilmisti. Koyu temada delik
# SIYAH yirtik gibi gorundu; arac ise «kayipsiz» diye oldugu gibi
# yerlestirmisti. Daire portrenin koseleri BILEREK saydamdir; karenin
# tek bir pikseli bile saydam olamaz.
def kare_portre_mu(ad: str) -> bool:
    return ad.startswith("ajan-kare-")


def saydam_oran(im) -> float:
    """Arkasi GORUNEN (alfa < 128) piksellerin orani; alfa yoksa 0.

    Esik 128: HKM karelerinin kenari bilerek yumusatilmis (alfa 250-253)
    ve o bir delik degildir; delik, arkasindaki zeminin gorundugu yerdir."""
    if im.mode not in ("RGBA", "LA", "P", "PA"):
        return 0.0
    a = im.convert("RGBA").getchannel("A")
    return sum(a.histogram()[:128]) / float(a.width * a.height)


def delik() -> int:
    """`--delik`: depodaki kare portrelerden hangisi delikli, ne kadar.
    Pillow ister; CI'da Pillow yok, bu yuzden kapi `isle`dedir (yeni
    delikli dosya zaten yerlesemez) ve bu komut kalanlari sayar."""
    try:
        from PIL import Image
    except ImportError:
        print("HATA: Pillow yok.  pip install pillow")
        return 2
    kotu = []
    dosyalar = sorted((MEDYA / "ajan").glob("ajan-kare-*.webp"))
    for f in dosyalar:
        o = saydam_oran(Image.open(f))
        if o > 0:
            kotu.append((o, f.stem))
    for o, ad in sorted(kotu, reverse=True):
        print("  ✕ %-30s %%%.1f delik" % (ad, 100 * o))
    if kotu:
        print("\n%d / %d kare portre delikli. Temiz kaynak gelince aynı adla "
              "`python3 tools/marka.py <klasör>` ile değiştirilir." % (len(kotu), len(dosyalar)))
        return 1
    print("Kare portreler temiz (%d dosya, delik yok)." % len(dosyalar))
    return 0


_KOMSU = ((-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1))


def doldur(im, esik=128, yumusat=3):
    """Kare portrenin deliklerini (alfa < esik) disaridan ice, bilinen
    komsularin ortalamasiyla doldurur (sogan kabugu), sonra YALNIZ
    doldurulan pikselleri yumusatir. Bilinen piksel DEGISMEZ; delik
    olmayan portre aynen doner. Cikti opak RGB.

    Deliklerin yeri (2026-09-25 olcumu): acik duvar, beyaz tisort, kenar
    cizgisi — yuzler saglam. Doldurma bu yuzden yuzu uydurmaz; yine de
    bir TAHMINDIR: temiz kaynak gelince `isle` ayni adla degistirir."""
    im = im.convert("RGBA")
    w, h = im.size
    px = list(im.getdata())
    bilinen = [p[3] >= esik for p in px]
    renk = [list(p[:3]) for p in px]
    dolan = [not b for b in bilinen]
    bekleyen = {i for i, b in enumerate(bilinen) if not b}
    enaz = 3
    while bekleyen:
        yeni = {}
        for i in bekleyen:
            x, y = i % w, i // w
            s0 = s1 = s2 = c = 0
            for dx, dy in _KOMSU:
                X, Y = x + dx, y + dy
                if 0 <= X < w and 0 <= Y < h and bilinen[Y * w + X]:
                    r = renk[Y * w + X]
                    s0 += r[0]; s1 += r[1]; s2 += r[2]; c += 1
            if c >= enaz:
                yeni[i] = [s0 // c, s1 // c, s2 // c]
        if not yeni:
            if enaz == 1:
                break            # hic bilinen piksel yok: doldurulacak dayanak yok
            enaz -= 1
            continue
        enaz = 3
        for i, v in yeni.items():
            renk[i] = v
            bilinen[i] = True
        bekleyen -= yeni.keys()
    for _ in range(yumusat):
        kopya = [r[:] for r in renk]
        for i in range(w * h):
            if not dolan[i]:
                continue
            x, y = i % w, i // w
            s0 = s1 = s2 = c = 0
            for dy in (-2, -1, 0, 1, 2):
                for dx in (-2, -1, 0, 1, 2):
                    X, Y = x + dx, y + dy
                    if 0 <= X < w and 0 <= Y < h:
                        r = kopya[Y * w + X]
                        s0 += r[0]; s1 += r[1]; s2 += r[2]; c += 1
            renk[i] = [s0 // c, s1 // c, s2 // c]
    from PIL import Image
    out = Image.new("RGB", (w, h))
    out.putdata([tuple(r) for r in renk])
    return out


def onar(dene: bool = False) -> int:
    """`--onar`: delikli kare portreleri yerinde doldurur (bkz. doldur).
    Temiz kaynak geldiginde `isle` ayni adla uzerine yazar."""
    try:
        from PIL import Image
    except ImportError:
        print("HATA: Pillow yok.  pip install pillow")
        return 2
    n = 0
    for f in sorted((MEDYA / "ajan").glob("ajan-kare-*.webp")):
        im = Image.open(f)
        o = saydam_oran(im)
        if o <= 0:
            continue
        n += 1
        if dene:
            print("  → %-30s %%%.1f delik doldurulacak" % (f.stem, 100 * o))
            continue
        doldur(im).save(f, "WEBP", lossless=True, quality=100, method=6)
        print("  ✓ %-30s %%%.1f delik dolduruldu" % (f.stem, 100 * o))
    if not n:
        print("Kare portreler temiz; doldurulacak delik yok.")
    elif dene:
        print("\nDENEME: hiçbir şey yazılmadı. %d portre doldurulacak." % n)
    else:
        print("\n%d portre dolduruldu (tahmin; temiz kaynak gelince aynı adla değiştir). "
              "Künyeyi tazele: python3 tools/marka.py --kunye" % n)
    return 0


def isle(kaynak: Path, dene: bool = False) -> int:
    if not kaynak.is_dir():
        print("HATA: %s bir klasör değil" % kaynak)
        return 1
    try:
        from PIL import Image
    except ImportError:
        if not dene:
            print("HATA: Pillow yok.  pip install pillow")
            return 1
        Image = None

    yazilan = atlanan = reddedilen = 0
    once = sonra = 0
    for dosya in sorted(kaynak.rglob("*")):
        if not dosya.is_file():
            continue
        uzanti = dosya.suffix.lower()
        if uzanti not in GORSEL and uzanti not in VIDEO:
            continue
        aile, ad = kanonik(dosya.stem)
        if not aile:
            print("  · %-36s ATLANDI — %s" % (dosya.name[:36], ad))
            atlanan += 1
            continue

        klasor = MEDYA / aile
        # SVG ve video DÖNÜŞTÜRÜLMEZ: biri zaten vektör, öteki yeniden
        # kodlanınca bozulur.
        koru = uzanti in VIDEO or uzanti == ".svg"
        hedef = klasor / (ad + (uzanti if koru else ".webp"))

        if dene:
            if Image is not None and not koru and kare_portre_mu(ad):
                o = saydam_oran(Image.open(dosya))
                if o > 0:
                    print("  ✕ %-36s YERLEŞTİRİLMEYECEK — kare portrenin %%%.1f'i "
                          "delik" % (dosya.name[:36], 100 * o))
                    atlanan += 1
                    reddedilen += 1
                    continue
            print("  → %-36s %s/%s" % (dosya.name[:36], aile, hedef.name))
            yazilan += 1
            continue

        klasor.mkdir(parents=True, exist_ok=True)
        if koru:
            shutil.copy2(dosya, hedef)
            n = hedef.stat().st_size
            once += n; sonra += n; yazilan += 1
            print("  ✓ %-36s olduğu gibi   %s" % (aile + "/" + hedef.name, _kb(n)))
            continue

        im = Image.open(dosya)
        if kare_portre_mu(ad) and saydam_oran(im) > 0:
            print("  ✕ %-36s YERLEŞTİRİLMEDİ — kare portrenin %%%.1f'i delik "
                  "(arka planı silinmiş bir fotoğraf). Temiz kaynağı ver."
                  % (dosya.name[:36], 100 * saydam_oran(im)))
            atlanan += 1
            reddedilen += 1
            continue
        if im.mode in ("RGBA", "LA", "P"):
            im = im.convert("RGBA")
            kutu = im.getchannel("A").getbbox()
            if kutu:
                im = im.crop(kutu)
        else:
            im = im.convert("RGB")
        im.save(hedef, "WEBP", lossless=True, quality=100, method=6)
        a, b = dosya.stat().st_size, hedef.stat().st_size
        once += a; sonra += b; yazilan += 1
        print("  ✓ %-36s %4dx%-4d %s → %s"
              % (aile + "/" + hedef.name, im.width, im.height, _kb(a), _kb(b)))

    if dene:
        print("\nDENEME: hiçbir şey yazılmadı. %d dosya işlenecek, %d atlanacak."
              % (yazilan, atlanan))
        return 1 if reddedilen else 0
    print("\n%d dosya yazıldı, %d atlandı." % (yazilan, atlanan))
    if once and sonra and once != sonra:
        print("Toplam %.1f MB → %.1f MB (%%%.0f küçüldü)."
              % (once / 1048576, sonra / 1048576, 100 * (1 - sonra / once)))
    return 1 if reddedilen else 0


def liste() -> int:
    """Ne var. EKSİĞİ SÖYLEMEZ — marka medyasında eksik diye bir şey
    yoktur; hiçbir ekran bir görselin varlığına bel bağlamaz."""
    if not MEDYA.is_dir():
        print("brand/medya/ yok.")
        return 0
    toplam = 0
    for aile in sorted(AILELER):
        k = MEDYA / aile
        d = sorted(f for f in k.iterdir() if f.is_file()) if k.is_dir() else []
        boy = sum(f.stat().st_size for f in d)
        toplam += boy
        print("\n%-8s %-34s %d dosya, %.1f MB"
              % (aile.upper(), AILELER[aile], len(d), boy / 1048576))
        for f in d:
            print("   %-30s %s" % (f.name, _kb(f.stat().st_size)))
    print("\nTOPLAM %.1f MB" % (toplam / 1048576))
    return 0


def _maske(im, esik=12):
    """Icerik nerede — arka plandan FARKLI olan pikseller.

    Iki durum var ve ikisi de olculur, tahmin edilmez:
      · saydam zeminli gorsel  -> alfa kanali icerigi zaten soyler
      · duz zeminli gorsel     -> zemin rengi DORT KOSEDEN okunur ve
                                  ondan yeterince farkli olan piksel
                                  icerik sayilir

    Kose rengini okumak, «beyaz zemindir» diye varsaymaktan iyidir:
    koyu bir tabaka gelirse varsayim her seyi icerik sanardi.
    """
    if im.mode in ("RGBA", "LA"):
        a = im.convert("RGBA").getchannel("A")
        return a.point(lambda v: 255 if v > 8 else 0)
    rgb = im.convert("RGB")
    g, y = rgb.size
    koseler = [rgb.getpixel(k) for k in
               ((0, 0), (g - 1, 0), (0, y - 1), (g - 1, y - 1))]
    zemin = tuple(sum(c[i] for c in koseler) // 4 for i in range(3))
    from PIL import Image, ImageChops
    fark = ImageChops.difference(rgb, Image.new("RGB", rgb.size, zemin))
    return fark.convert("L").point(lambda v: 255 if v > esik else 0)


def _kutular(maske, en_az_oran=0.0015, yapistir=0.02):
    """Maskedeki AYRI parcalarin kutulari (tam cozunurlukte).

    `yapistir` bir logonun kopuk parcalarini (simge + altindaki yazi)
    BIRLESTIRIR: maske once yayilir, sonra etiketlenir. Yayma olmadan
    tek bir logo iki parca cikiyordu.

    `en_az_oran`dan kucuk lekeler atilir: JPEG gurultusu ve tek piksel
    artiklar bir logo degildir.
    """
    from PIL import Image
    G, Y = maske.size
    # Etiketleme KUCUK maskede yapilir: 4000x3000 bir tabakada piksel
    # piksel gezmek olculebilir bir bedeldi, sonuc ayni.
    olcek = max(1, max(G, Y) // 640)
    k = maske.resize((max(1, G // olcek), max(1, Y // olcek)), Image.BOX)
    g, y = k.size
    r = max(1, int(round(min(g, y) * yapistir)))
    # Yayma icin MaxFilter. Once `ImageChops.offset` ile kaydirma
    # deneniyordu ve OLCULDU: offset KENARLARI SARIYOR — alttaki icerik
    # uste dolaniyor ve olmayan yerde hayalet parca uretiyordu. Sahte
    # bir tabakada sekiz logo dokuz parca cikti.
    #
    # MaxFilter sarmaz. Buyuk yaricapta yavastir ama maske zaten 640
    # piksele indirilmis durumda, olculebilir bir bedeli yok.
    from PIL import ImageFilter
    yay = k.filter(ImageFilter.MaxFilter(2 * r + 1)) if r >= 1 else k
    p = yay.load()

    gorulen = bytearray(g * y)
    kutular = []
    for by in range(y):
        for bx in range(g):
            if p[bx, by] == 0 or gorulen[by * g + bx]:
                continue
            gorulen[by * g + bx] = 1
            yigin = [(bx, by)]
            x0 = x1 = bx
            y0 = y1 = by
            n = 0
            while yigin:
                cx, cy = yigin.pop()
                n += 1
                if cx < x0: x0 = cx
                if cx > x1: x1 = cx
                if cy < y0: y0 = cy
                if cy > y1: y1 = cy
                for nx, ny in ((cx+1,cy), (cx-1,cy), (cx,cy+1), (cx,cy-1)):
                    if 0 <= nx < g and 0 <= ny < y \
                       and not gorulen[ny * g + nx] and p[nx, ny]:
                        gorulen[ny * g + nx] = 1
                        yigin.append((nx, ny))
            if n < en_az_oran * g * y:
                continue
            kutular.append((max(0, x0 * olcek), max(0, y0 * olcek),
                            min(G, (x1 + 1) * olcek), min(Y, (y1 + 1) * olcek)))
    # Soldan saga, yukaridan asagi — insanin okudugu sira.
    kutular.sort(key=lambda b: (b[1] // max(1, (Y // 8) or 1), b[0]))
    return kutular


def bol(kaynak: Path, cikti: Path, sutun: int, satir: int) -> int:
    """Duzgun bir izgarayi SABIT bolerek keser — tahmin yok.

    Otomatik bulma (`--kes`) kopuk parcalari birlestirmek icin bir
    yaricap kullanir ve o yaricap her tabakada AYNI olamaz: dort logoluk
    bir seritte kurenin simgeyle birlesmesi icin buyuk olmali, yirmi bes
    portrelik sikisik bir izgarada ise hepsini tek parcaya yapistirir.
    Olculdu, ikisi de yasandi.

    Tabakanin kac sutun kac satir oldugu GOZLE bellidir. Bilinen bir sayi
    varken tahmin ettirmek, ayarlanacak bir yaricap demekti.

    Her hucre kesildikten sonra saydam kenar bosluğu kirpilir: izgara
    hucresi esit, icindeki simge esit degildir.
    """
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("HATA: Pillow yok.  pip install pillow")
        return 1
    if not kaynak.is_file():
        print("HATA: %s bir dosya degil" % kaynak)
        return 1
    if sutun < 1 or satir < 1:
        print("HATA: sutun ve satir en az 1 olmali")
        return 1

    im = Image.open(kaynak)
    G, Y = im.size
    cikti.mkdir(parents=True, exist_ok=True)
    parcalar = []
    n = 0
    for r in range(satir):
        for c in range(sutun):
            kutu = (round(c * G / sutun), round(r * Y / satir),
                    round((c + 1) * G / sutun), round((r + 1) * Y / satir))
            p = im.crop(kutu)
            # Hucrenin ICINDEKI bosluk atilir. Izgara hucresi esit,
            # icindeki simge esit degil.
            if p.mode in ("RGBA", "LA", "P"):
                p = p.convert("RGBA")
                kb = p.getchannel("A").getbbox()
                if kb:
                    p = p.crop(kb)
            if p.width < 8 or p.height < 8:
                continue        # bos hucre
            n += 1
            ad = "kesit-%02d.png" % n
            p.save(cikti / ad)
            parcalar.append((ad, p))
            print("  ✓ %-14s %4dx%-4d   hucre (%d,%d)" % (ad, p.width, p.height, c, r))

    if not parcalar:
        print("Hicbir hucrede icerik yok.")
        return 1
    _tabaka(parcalar, cikti)
    print("\n%d parca + tabaka.png -> %s" % (len(parcalar), cikti))
    return 0


def _tabaka(parcalar, cikti):
    """Temas tabakasi — hepsi tek karede, numarali. Adlandirma GOREREK
    yapilir; araca «bu AYS'nin olmali» dedirtmek yanlis adla yerlesen
    bir dosya demekti."""
    from PIL import Image, ImageDraw
    H = 220
    C = min(6, len(parcalar))
    satir = (len(parcalar) + C - 1) // C
    t = Image.new("RGB", (C * (H + 16), satir * (H + 34)), (250, 249, 247))
    ciz = ImageDraw.Draw(t)
    for i, (ad, p) in enumerate(parcalar):
        k = p.convert("RGBA")
        k.thumbnail((H, H), Image.LANCZOS)
        x = (i % C) * (H + 16) + 8
        y = (i // C) * (H + 34) + 6
        t.paste(k, (x + (H - k.width) // 2, y + (H - k.height) // 2), k)
        ciz.text((x, y + H + 6), ad, fill=(20, 20, 20))
    t.save(cikti / "tabaka.png")


def kes(kaynak: Path, cikti: Path, yapistir: float = 0.02) -> int:
    """Toplu tabakayi parcalara ayirir — TAM COZUNURLUKTE.

    Kirpma yalniz KUTUYU bulur; kesilen parca ASIL dosyadan alinir ve
    hicbir piksel yeniden orneklenmez. Kucultme yok, yeniden kodlama
    yok — kalite kararinin depo sahibine ait oldugu bu depoda araca
    dusen is, bulmaktir.

    `yapistir` KOPUK PARCALARI birlestiren yaricaptir (kisa kenarin
    orani). Varsayilan %2 bir simgenin altindaki yaziyi toplar; ama
    sikisik bir izgarada (yan yana yirmi bes portre) hepsini TEK
    parcaya yapistirir. Olculdu: 5x5 dairesel tabakada varsayilanla 1
    parca cikti, `--yapistir 0` ile 25.

    ADLANDIRMA YAPILMAZ. Parcalar `kesit-01`, `kesit-02` diye numaralanir
    ve bir de temas tabakasi yazilir. Hangi parcanin hangi logo oldugunu
    GOREREK soylemek insanin isi; araca «bu AYS'nin olmali» dedirtmek,
    yanlis adla yerlesen bir dosya demekti.
    """
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("HATA: Pillow yok.  pip install pillow")
        return 1
    if not kaynak.is_file():
        print("HATA: %s bir dosya degil" % kaynak)
        return 1

    im = Image.open(kaynak)
    kutular = _kutular(_maske(im), yapistir=yapistir)
    if not kutular:
        print("Parca bulunamadi. Tabaka duz bir zemin uzerinde mi?")
        return 1

    cikti.mkdir(parents=True, exist_ok=True)
    pay = max(2, min(im.width, im.height) // 200)
    parcalar = []
    for i, (x0, y0, x1, y1) in enumerate(kutular, 1):
        kutu = (max(0, x0 - pay), max(0, y0 - pay),
                min(im.width, x1 + pay), min(im.height, y1 + pay))
        p = im.crop(kutu)
        ad = "kesit-%02d.png" % i
        p.save(cikti / ad)
        parcalar.append((ad, p))
        print("  ✓ %-14s %4dx%-4d   kaynakta (%d,%d)" %
              (ad, p.width, p.height, kutu[0], kutu[1]))

    _tabaka(parcalar, cikti)
    print("\n%d parca + tabaka.png -> %s" % (len(parcalar), cikti))
    print("Once tabaka.png'e bak, sonra her parcayi adiyla yeniden adlandir")
    print("ve `python3 tools/marka.py <klasor>` ile yerlestir.")
    return 0


def sina() -> int:
    """Ad kurali ve yol muhafizi — `--sina`.

    Bu arac bir teslimat aldiginda otuz dosyayi tek seferde ISIMLENDIRIR
    ve YERLESTIRIR; kurali bozan bir degisiklik sessizce yanlis yere
    yazabilir. Kural burada, aracin yaninda sinanir: `sayilar.py` bunu
    kok denetimleri arasinda kosar.
    """
    hata = []

    def esit(girdi, bek_aile, bek_ad):
        a, n = kanonik(girdi)
        if (a, n) != (bek_aile, bek_ad):
            hata.append("%r -> (%r, %r), beklenen (%r, %r)"
                        % (girdi, a, n, bek_aile, bek_ad))

    def red(girdi):
        a, _ = kanonik(girdi)
        if a is not None:
            hata.append("%r reddedilmeliydi, kabul edildi" % girdi)

    # Uretici ne verirse versin, servis edilen ad TEK bicimdir.
    esit("kimlik-ays", "kimlik", "kimlik-ays")
    esit("kimlik_AYS", "kimlik", "kimlik-ays")
    esit("Kimlik AYS", "kimlik", "kimlik-ays")
    esit("ajan__patron", "ajan", "ajan-patron")
    # Turkce karakter SADELESIR: ad bir URL parcasidir.
    esit("doku_kağıt", "doku", "doku-kagit")
    esit("kapak_Haftalık Rapor", "kapak", "kapak-haftalik-rapor")
    esit("durum-veri-yok", "durum", "durum-veri-yok")

    # Aile taninmiyorsa ISLENMEZ: sessizce atlanan bir dosya, «neden
    # gorunmuyor» diye aranan bir aksam demekti.
    red("IMG_2931")
    red("rastgele-dosya")
    red("logo")
    # Aileden sonra bir ad gerekir; yoksa klasorle ayni adda dosya olur.
    red("ajan")
    red("kimlik")
    red("---")

    # YOL MUHAFIZI: aile ADDAN turer, yoldan degil.
    import importlib.util
    yol_py = KOK / "brand" / "seviye" / "ortak_yol.py"
    kaynak = "import os\n" + yol_py.read_text(encoding="utf-8")
    ns = {}
    exec(compile(kaynak, str(yol_py), "exec"), ns)
    marka = ns["_ortak_marka_yolu"]

    if not marka("/img/marka/kimlik-ays.webp", "/k"):
        hata.append("gecerli ad reddedildi")
    elif not marka("/img/marka/kimlik-ays.webp", "/k").endswith(
            os.path.join("brand", "medya", "kimlik", "kimlik-ays.webp")):
        hata.append("aile yanlis turedi")
    # IKI KATMAN AYRI AYRI SINANIR. Once `_guvenli_medya_adi`: bolu
    # isareti, ters bolu, gizli dosya ve izinsiz uzanti REDDEDILMELI.
    # Sonra `_ortak_marka_yolu`nun kendi `aile.isalnum()` savunmasi.
    # Tek katmani sinamak yaniltir: oteki katman hatayi orter ve test
    # yesil kalir — olculdu, tam olarak boyle oldu.
    guvenli = ns["_guvenli_medya_adi"]
    for kotu in ("a/b.webp", "a\\b.webp", ".gizli.webp", "ad.txt", ""):
        if guvenli(kotu):
            hata.append("_guvenli_medya_adi(%r) reddetmeliydi" % kotu)
    if not guvenli("kimlik-ays.webp"):
        hata.append("_guvenli_medya_adi gecerli adi reddetti")

    # Alt klasor ve dizin gezinme REDDEDILIR: bir gorsel kapisinin dosya
    # sistemine acilan bir pencereye donusmesi kabul edilebilir degil.
    for kotu in ("/img/marka/../../etc/passwd", "/img/marka/kimlik/gizli.webp",
                 "/img/marka/.gizli.webp", "/img/marka/ad.txt",
                 "/img/marka/", "/img/seviye/kimlik-ays.webp"):
        if kotu != "/img/seviye/kimlik-ays.webp" and marka(kotu, "/k"):
            hata.append("%r reddedilmeliydi" % kotu)

    # KARE PORTRE DELIKSIZ OLMALI. Kural saf: ad + saydam oran. Pillow
    # CI'da yok; varsa gercek bir goruntuyle de sinanir.
    if not kare_portre_mu("ajan-kare-esp-maestro") or kare_portre_mu("ajan-esp-maestro"):
        hata.append("kare_portre_mu adi yanlis ayirdi")
    try:
        from PIL import Image
    except ImportError:
        Image = None
    if Image is not None:
        dolu = Image.new("RGBA", (10, 10), (200, 190, 180, 255))
        delikli = dolu.copy()
        delikli.putpixel((0, 0), (255, 255, 255, 0))
        yumusak = dolu.copy()
        yumusak.putpixel((9, 9), (200, 190, 180, 252))
        if saydam_oran(dolu) != 0 or not (0 < saydam_oran(delikli) < 0.02):
            hata.append("saydam_oran yanlis olctu")
        if saydam_oran(yumusak) != 0:
            hata.append("yumusatilmis kenar (alfa 252) delik sayildi")
        if saydam_oran(Image.new("RGB", (4, 4))) != 0:
            hata.append("alfasiz goruntu saydam sayildi")
        import tempfile
        with tempfile.TemporaryDirectory() as d:
            d = Path(d)
            delikli.save(d / "ajan-kare-deneme-delik.png")
            eski = MEDYA
            try:
                globals()["MEDYA"] = d / "medya"
                import contextlib, io
                with contextlib.redirect_stdout(io.StringIO()):
                    kod = isle(d)
                if kod != 1 or (d / "medya" / "ajan" / "ajan-kare-deneme-delik.webp").exists():
                    hata.append("delikli kare portre yerlestirildi (reddedilmeliydi)")
            finally:
                globals()["MEDYA"] = eski

    if hata:
        print("MARKA SINAMASI KALDI:")
        for h in hata:
            print("  ✕ " + h)
        return 1
    print("marka adlandirma ve yol muhafizi temiz (%d durum)" % 25)
    return 0


# ------------------------------------------------------------------
# MEDYA KUNYESI — ekranin NEYI isteyebilecegi
#
# Ekran bir kimlikten dosya adi turetiyor (`brand/ortak/simge.js`).
# Kimlik katalogda var ama GORSELI gelmemisse istek her acilista 404
# doner. Bir kez yasandi: ESP katalogunda yedi disiplin var, teslimatta
# alti geldi ve `disiplin-music.webp` her acilista aranir oldu.
#
# Tek tek istisna yazmak cozum degil: gorsel geldigi gun o istisnanin
# kaldirilmasini kimse hatirlamaz. Kunye `medya/` altinda GERCEKTEN ne
# varsa onu yazar; simge yardimcisi listede olmayan kimlik icin bos
# doner ve yazi olduğu gibi kalir.
#
# Yalniz SIMGE aileleri yazilir. Otekiler (kimlik, ajan, kapak...)
# dogrudan `<img src>` ile cagriliyor ve adlari kodda sabit; onlari
# kunyeye koymak, degismeyen bir seyi her teslimatta yeniden uretmek
# olurdu.
SIMGE_AILELERI = ("ders", "disiplin", "olcum", "simge")

KUNYE_YOLU = KOK / "brand" / "ortak" / "medya.js"

KUNYE_BASLIK = """/* MEDYA KUNYESI — URETILMIS DOSYA, ELLE DUZENLEME.

   `python3 tools/marka.py --kunye` uretir, `--kunye --denetle` tazeligini
   sinar (CI'da kosar). Iceriginin kaynagi `brand/medya/` altindaki
   DOSYALARIN KENDISIDIR.

   NE ISE YARAR: ekran bir kimlikten gorsel adi turetir
   (`brand/ortak/simge.js`). Kimlik katalogda var ama gorseli gelmemisse
   istek her acilista 404 doner. Kunye, `SIMGE_ADI`nin listede olmayan
   kimlik icin bos donmesini saglar: gorsel yoksa yazi kalir, istek hic
   yapilmaz. */

window.LIFEOS = window.LIFEOS || {};
"""


def _kunye_metni() -> str:
    satir = []
    for aile in SIMGE_AILELERI:
        klasor = MEDYA / aile
        adlar = []
        if klasor.is_dir():
            onek = aile + "-"
            for d in sorted(klasor.iterdir()):
                if not d.is_file() or d.suffix.lower() not in GORSEL:
                    continue
                if d.stem.startswith(onek):
                    adlar.append(d.stem[len(onek):])
        satir.append("  %s:[%s]," % (aile, ",".join("'%s'" % a for a in adlar)))
    return KUNYE_BASLIK + "\nLIFEOS.MEDYA = {\n" + "\n".join(satir) + "\n};\n"


def kunye(denetle: bool = False) -> int:
    yeni = _kunye_metni()
    eski = KUNYE_YOLU.read_text(encoding="utf-8") if KUNYE_YOLU.exists() else None
    if denetle:
        if eski is None:
            print("brand/ortak/medya.js YOK — `python3 tools/marka.py --kunye`")
            return 1
        if eski != yeni:
            print("brand/ortak/medya.js TAZE DEGIL — medya/ degismis.")
            print("Duzeltme: python3 tools/marka.py --kunye")
            return 1
        sayi = sum(len(x) for x in _kunye_sayim().values())
        print("Medya kunyesi taze (%d gorsel, %d aile)."
              % (sayi, len(SIMGE_AILELERI)))
        return 0
    if eski == yeni:
        print("Medya kunyesi zaten guncel.")
        return 0
    KUNYE_YOLU.parent.mkdir(parents=True, exist_ok=True)
    KUNYE_YOLU.write_text(yeni, encoding="utf-8")
    for aile, adlar in _kunye_sayim().items():
        print("  %-10s %d" % (aile, len(adlar)))
    print("yazildi: %s" % KUNYE_YOLU.relative_to(KOK))
    print("Unutma: `python3 tools/ortak.py --yay` ile uc arayuze dagit.")
    return 0


def _kunye_sayim():
    out = {}
    for aile in SIMGE_AILELERI:
        klasor = MEDYA / aile
        onek = aile + "-"
        out[aile] = [d.stem[len(onek):] for d in sorted(klasor.iterdir())
                     if d.is_file() and d.suffix.lower() in GORSEL
                     and d.stem.startswith(onek)] if klasor.is_dir() else []
    return out


def main() -> int:
    if "--onar" in sys.argv:
        return onar("--dene" in sys.argv)
    if "--sina" in sys.argv:
        return sina()

    if "--kunye" in sys.argv:
        return kunye("--denetle" in sys.argv)

    if "--delik" in sys.argv:
        return delik()

    if "--liste" in sys.argv:
        return liste()
    if "--bol" in sys.argv:
        ham = sys.argv[1:]
        arg = [a for i, a in enumerate(ham)
               if not a.startswith("-") and not (i > 0 and ham[i - 1] == "--bol")]
        olcu = None
        for i, a in enumerate(sys.argv):
            if a == "--bol" and i + 1 < len(sys.argv):
                olcu = sys.argv[i + 1]
        m = re.match(r"^(\d+)[xX](\d+)$", olcu or "")
        if not arg or not m:
            print("Kullanim: python3 tools/marka.py <tabaka.png> --bol 5x5 [cikti]")
            return 1
        kaynak = Path(arg[0]).expanduser().resolve()
        cikti = Path(arg[1]).expanduser().resolve() if len(arg) > 1 \
            else kaynak.parent / (kaynak.stem + "-parcalar")
        return bol(kaynak, cikti, int(m.group(1)), int(m.group(2)))
    if "--kes" in sys.argv:
        ham = sys.argv[1:]
        arg = [a for i, a in enumerate(ham)
               if not a.startswith("-")
               and not (i > 0 and ham[i - 1] == "--yapistir")]
        if not arg:
            print("Kullanim: python3 tools/marka.py <tabaka.png> --kes [cikti]"
                  " [--yapistir 0.005]")
            return 1
        kaynak = Path(arg[0]).expanduser().resolve()
        cikti = Path(arg[1]).expanduser().resolve() if len(arg) > 1 \
            else kaynak.parent / (kaynak.stem + "-parcalar")
        yap = 0.02
        for i, a in enumerate(sys.argv):
            if a == "--yapistir" and i + 1 < len(sys.argv):
                try:
                    yap = float(sys.argv[i + 1])
                except ValueError:
                    print("--yapistir bir sayi olmali (orn. 0.005)")
                    return 1
        return kes(kaynak, cikti, yap)
    arg = [a for a in sys.argv[1:] if not a.startswith("-")]
    if not arg:
        print(__doc__)
        return 0
    dene = "--dene" in sys.argv
    if dene:
        print("DENEME koşumu — hiçbir şey yazılmayacak.\n")
    return isle(Path(arg[0]).expanduser().resolve(), dene)


if __name__ == "__main__":
    raise SystemExit(main())
