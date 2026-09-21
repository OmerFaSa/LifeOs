#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Rütbe görsellerini SERVİS EDİLEBİLİR hâle getirir.

   NE İŞE YARAR

   Seviye sisteminin iki tür görseli var ve ikisi de depo sahibinden
   gelir: rütbe kartları (dikey) ve kademe sahneleri (yatay). Üretildikleri
   hâlleriyle 15 MB ediyorlardı — bir arayüzün bütün kodundan büyük.

   ------------------------------------------------------------------
   KALİTEDEN ÖDÜN VERİLMEZ

   Varsayılan KAYIPSIZDIR. Bu betik hiçbir pikseli değiştirmez, hiçbir
   görseli küçültmez. Yaptığı tek şey aynı pikselleri daha iyi PAKETLEMEK:

     · rütbe kartı (PNG)   tam saydam kenar boşluğu kırpılır — atılan
                           şey görünmeyen boşluktur, ışık değil — ve
                           KAYIPSIZ WebP olarak yazılır.
     · kademe sahnesi      kayıpsız WebP — kaynağı PNG de olsa JPEG de.
     · video               olduğu gibi kopyalanır.

   Ölçüldü (kayıpsız): 15,0 MB → 11,8 MB. Görüntü bit düzeyinde aynı.

   JPEG'İ NEDEN YİNE DE ÇEVİRİYORUZ. Zaten kayıplı bir dosyayı kayıpsız
   WebP'ye sarmak onu BÜYÜTÜR (ölçüldü: 233 KB → 682 KB); tek kazancı
   şudur: servis edilen her sahnenin uzantısı AYNI olur. Kod o zaman
   `sahne-4.webp` der ve biter. Karışık uzantı, çalışma zamanında
   «önce .webp dene, olmazsa .jpeg dene» demekti — yani her açılışta
   bulunamayacağı bilinen bir istek. Bir megabayt, her kutlamada bir
   404'ten ucuzdur. Çevirme KAYIPSIZDIR: JPEG'in çözülmüş pikselleri
   aynen saklanır, ikinci bir kalite kaybı yoktur.

   İleride yer sorun olursa `--kayipli` vardır ve ölçüsü de yazılı:
   kart WebP q92, sahne q86 ile toplam 1,6 MB'a iner ve fark gözle
   seçilmez. Ama varsayılan o DEĞİLDİR — kalite kararı depo sahibinin,
   betiğin değil.

   NASIL KULLANILIR

       python3 tools/rutbe.py <klasör>            kayıpsız (varsayılan)
       python3 tools/rutbe.py <klasör> --kayipli  küçük ama kayıplı
       python3 tools/rutbe.py --liste             medya/ altında ne var

   Gelen dosyanın ADI hedefi belirler; betik görselin içine bakıp
   «bu hangi rütbe» diye TAHMİN ETMEZ:

       rutbe-5-2.png   →  brand/seviye/medya/rutbe-5-2.webp
       rutbe-k300.png  →  brand/seviye/medya/rutbe-k300.webp
       sahne-4.jpg     →  brand/seviye/medya/sahne-4.webp
       rutbe-5-2.mp4   →  brand/seviye/medya/rutbe-5-2.mp4   (kopyalanır)

   Adı bu kalıba uymayan dosya İŞLENMEZ ve sebebi yazılır. Sessizce
   atlanan bir dosya, «neden görünmüyor» diye aranan bir akşam demekti.

   ADLANDIRMA NEREDEN GELİYOR

   Dosya adı ekranda yazan ETİKETTEN türer: `5.2` → `rutbe-5-2`,
   `K300` → `rutbe-k300`. Kural tek satırdır (`js/core/perde.js`,
   `medyaAdi`) ve iki yerde yazılı olmasın diye burada tekrarlanmaz —
   buradaki iş yalnız adı DOĞRULAMAKTIR.
"""

import os
import re
import shutil
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
MEDYA = KOK / "brand" / "seviye" / "medya"

# `--kayipli` verildiğinde kullanılan ayarlar. Varsayılan koşumda
# HİÇBİRİ uygulanmaz: ne küçültme, ne yeniden kodlama.
KART_YUKSEK = 900      # kartın en yüksek kenarı
KART_KALITE = 92
SAHNE_GENIS = 1600     # sahnenin genişliği
SAHNE_KALITE = 86

GORSEL = {".png", ".jpg", ".jpeg", ".webp"}
VIDEO = {".mp4", ".webm"}

# Ad kalıpları. Etiket küçük harf, nokta yerine tire: `5.2` → `5-2`.
RUTBE = re.compile(r"^rutbe-(\d+-\d+|k\d+)$")
SAHNE = re.compile(r"^sahne-(\d+)$")

# RÜTBE KARTININ YANINDAKİ DÖRT AİLE. Hepsi kademeye bağlıdır, hiçbiri
# rütbe kartı DEĞİLDİR; ayrı adlandırılmalarının sebebi, bir gün
# birinin diğerinin dosyasını çağırmaması:
#
#   rutbe-5-2    basamağın KARTI — bir sayfa kaplar, tek başına durur
#   nisan-5-2    aynı basamağın AMBLEMİ — bir satırın yanına sığar
#   gecis-5      o kademeye GEÇİLDİĞİNDE basılan tam ekran sahne
#   bant-4       kademenin adını taşıyan yatay bant
#   onay-3       kullanıcı bir şeyi onayladığında basılan mühür
#   cerceve-3    profil fotoğrafının çevresine takılan halka
#
# `bant-hukum`: teslimatta beşinci bandın ÜZERİNDE «HÜKÜM» yazıyor,
# «SAFİR» değil. Safir'in yerine konsaydı ekranda kademenin adı yanlış
# yazardı; adıyla saklanır ve Safir bandı gelene kadar ekrana çıkmaz.
NISAN = re.compile(r"^nisan-\d+-\d+$")
GECIS = re.compile(r"^gecis-\d+$")
BANT = re.compile(r"^bant-(\d+|hukum)$")
ONAY = re.compile(r"^onay-\d+$")
CERCEVE = re.compile(r"^cerceve-\d+$")
SAYDAM = (NISAN, BANT, ONAY, CERCEVE)

# ------------------------------------------------------------------
# BAŞARIM ROZETLERİ, MÜHÜRLER VE ONUR
#
# Bunlar rütbe kartından BAŞKA bir şeydir ve karışmamaları önemlidir:
#
#   rutbe-5-2    seviye merdiveninin bir basamağı — XP ile gelinir
#   basarim-…    bir eşiği geçmekle kazanılan rozet (500 saat, 100 gün…)
#   muhur-…      kazanılmaz, BASILIR — raporun alan damgası
#   onur-…       tüm alanların zirvesi (Sistem Ustası)
#
# ÖNEK NEDEN `basarim-`. `rozet-` denemezdi: `rozet-1.png` … `rozet-6.png`
# zaten kademe rozetidir (bkz. `brand/seviye/xp.js`, `panelHtml`). İki
# ayrı kavramı tek önekle adlandırmak, bir gün birinin diğerinin
# dosyasını çağırması demekti. Kullanıcıya hâlâ «rozet» denir; ayrım
# dosya adındadır, ekranda değil.
#
# ÜRETİCİNİN VERDİĞİ AD ile SERVİS EDİLEN AD farklıdır: gelen dosya
# `saat_500_a.png` olabilir, servis edilen `basarim-saat-500.webp`
# olur. Çeviri burada, TEK yerde yazılı; başka hiçbir yerde tekrar
# edilmez.
BASARIM_AILE = {
    "gorev":     r"\d+",          # gorev_500      → basarim-gorev-500
    "gun":       r"\d+",          # gun_100        → basarim-gun-100
    "saat":      r"\d+",          # saat_2500_a    → basarim-saat-2500
    "istikrar":  r"\d+",          # istikrar_12    → basarim-istikrar-12
    "odak":      r"\d+[Hh]?",     # odak_7H        → basarim-odak-7
    "kusursuz":  r"gun|hafta|ay",  # kusursuz_hafta → basarim-kusursuz-hafta
}
MUHUR = re.compile(r"^muhur[-_]([a-z]+)(?:[-_][ab])?$", re.I)
ONUR = re.compile(r"^onur[-_]([a-z-]+)$", re.I)

# `_a` ve `_b` AYNI dosyadır (depo sahibinin üreticisi ikisini birden
# veriyor; md5 ile doğrulandı). İkincisi yazılmaz, atlandığı söylenir —
# sessizce üstüne yazmak, ikisi bir gün FARKLILAŞTIĞINDA hangisinin
# kazandığını kimsenin bilmemesi demekti.
KOPYA_SON = re.compile(r"_[ab]$", re.I)


def basarim_adi(govde: str):
    """Üreticinin adını servis edilen ada çevirir. Uymuyorsa None."""
    temiz = KOPYA_SON.sub("", govde).lower()
    for aile, kalip in BASARIM_AILE.items():
        m = re.match(r"^%s[-_](%s)$" % (aile, kalip), temiz)
        if m:
            # `7H` → `7`: birim adın içinde taşınmaz, katalogda yazılıdır.
            return "basarim-%s-%s" % (aile, m.group(1).rstrip("Hh"))
    m = MUHUR.match(govde)
    if m:
        return "muhur-" + m.group(1).lower()
    m = ONUR.match(govde)
    if m:
        return "onur-" + m.group(1).lower().replace("_", "-")
    return None


def _boyut(yol: Path) -> int:
    return yol.stat().st_size if yol.exists() else 0


def _kb(n: int) -> str:
    return "%6.0f KB" % (n / 1024)


def isle(kaynak: Path, kayipli: bool = False) -> int:
    try:
        from PIL import Image
    except ImportError:
        print("HATA: Pillow yok.  pip install pillow")
        return 1

    if not kaynak.is_dir():
        print("HATA: %s bir klasör değil" % kaynak)
        return 1

    MEDYA.mkdir(parents=True, exist_ok=True)
    yazilan = atlanan = 0
    once = sonra = 0

    for dosya in sorted(kaynak.iterdir()):
        if not dosya.is_file():
            continue
        govde, uzanti = dosya.stem, dosya.suffix.lower()
        rutbe, sahne = RUTBE.match(govde), SAHNE.match(govde)
        saydam = any(k.match(govde) for k in SAYDAM)
        gecis = GECIS.match(govde)
        basarim = (None if (rutbe or sahne or saydam or gecis)
                   else basarim_adi(govde))
        if not (rutbe or sahne or saydam or gecis or basarim):
            print("  · %-34s ADI UYMUYOR — rutbe-5-2 / nisan-5-2 / gecis-5 / "
                  "bant-4 / onay-3 / cerceve-3 / sahne-4 / saat_500 / "
                  "muhur_saglik" % dosya.name[:34])
            atlanan += 1
            continue

        if uzanti in VIDEO:
            # Video DOKUNULMADAN kopyalanır: yeniden kodlamak, depo
            # sahibinin ürettiği şeyi ikinci kez bozmaktır.
            hedef = MEDYA / (govde + uzanti)
            shutil.copy2(dosya, hedef)
            n = _boyut(hedef)
            once += n; sonra += n; yazilan += 1
            print("  ✓ %-34s video, kopyalandı   %s" % (hedef.name, _kb(n)))
            continue

        if uzanti not in GORSEL:
            print("  · %-34s TÜR DESTEKLENMİYOR (%s)" % (dosya.name[:34], uzanti))
            atlanan += 1
            continue

        hedef = MEDYA / ((basarim or govde) + ".webp")
        # `_a`/`_b` ikizinin ikincisi: yazma, ama ATLADIĞINI SÖYLE.
        if basarim and hedef.exists() and KOPYA_SON.search(govde):
            print("  · %-34s ikiz (%s zaten yazıldı)"
                  % (dosya.name[:34], hedef.name))
            atlanan += 1
            continue
        if rutbe or basarim or saydam:
            im = Image.open(dosya).convert("RGBA")
            # Tam saydam kenar boşluğu atılır. Parıltı ALFASI SIFIR
            # DEĞİLDİR, yani kırpma ışığı kesmez — yalnız boşluğu alır.
            kutu = im.getchannel("A").getbbox()
            if kutu:
                im = im.crop(kutu)
            if kayipli:
                if im.height > KART_YUKSEK:
                    o = KART_YUKSEK / im.height
                    im = im.resize((round(im.width * o), KART_YUKSEK), Image.LANCZOS)
                im.save(hedef, "WEBP", quality=KART_KALITE, method=6)
            else:
                im.save(hedef, "WEBP", lossless=True, quality=100, method=6)
        else:
            # Sahnede ve geçiş karesinde saydamlık yok: RGB'ye indirilir,
            # alfa kanalı taşımak bedava değildir.
            im = Image.open(dosya).convert("RGB")
            if kayipli:
                if im.width > SAHNE_GENIS:
                    o = SAHNE_GENIS / im.width
                    im = im.resize((SAHNE_GENIS, round(im.height * o)), Image.LANCZOS)
                im.save(hedef, "WEBP", quality=SAHNE_KALITE, method=6)
            else:
                im.save(hedef, "WEBP", lossless=True, quality=100, method=6)

        a, b = _boyut(dosya), _boyut(hedef)
        once += a; sonra += b; yazilan += 1
        print("  ✓ %-34s %4dx%-4d %s → %s" % (hedef.name, im.width, im.height,
                                              _kb(a), _kb(b)))

    print("\n%d dosya yazıldı, %d atlandı." % (yazilan, atlanan))
    if once and sonra and once != sonra:
        print("Toplam %.1f MB → %.1f MB (%%%.0f küçüldü)."
              % (once / 1048576, sonra / 1048576, 100 * (1 - sonra / once)))
    return 0


def _katalogdan_beklenen():
    """Katalogun BEKLEDIGI butun medya adlari — kaynagi `brand/seviye/`.

       NEDEN NODE ILE. Katalog gercek JavaScript'tir ve turetilmis
       diziler tasir (`LIFEOS.BASAMAKLAR`, kademe sayisi, rozet
       esikleri). Ayni yapiyi Python'da ikinci kez yazmak, iki kopyanin
       bir gun ayrismasi demekti — bu depoda tam olarak bundan
       kacinilir. Katalog TEK KAYNAKTIR; burasi onu OKUR.

       Node yoksa None doner ve `--eksik` sebebini soyler. Arac bir
       teshis aracidir, CI'nin parcasi degil; node'a bagimli olmasi
       hicbir denetimi durdurmaz.
    """
    import json
    import subprocess

    betik = r"""
      var window = globalThis; globalThis.window = window;
      var fs = require('fs'), path = require('path');
      /* Yol ORTAM DEGISKENINDEN gelir. `node -e` ile calisirken
         `process.argv` betik adini tasimaz ve kullanici argumani
         argv[1]'e kayar; iki farkli node surumunde iki farkli yerde
         cikti. Ortam degiskeni her surumde ayni yerde. */
      var kok = process.env.SEVIYE_KOK;
      ['kademeler.js', 'basarimlar.js'].forEach(function(ad){
        (0, eval)(fs.readFileSync(path.join(kok, ad), 'utf8'));
      });
      var L = window.LIFEOS, bekle = [];
      (L.BASAMAKLAR || []).forEach(function(b){
        bekle.push(['rutbe', L.MEDYA_ADI(b.etiket)]);
        var k = L.KADEME_ILE(b.kademe);
        if(!(k && k.etiketler)) bekle.push(['nisan', 'nisan-' + b.kademe + '-' + b.basamak]);
      });
      (L.KADEMELER || []).forEach(function(k){
        ['sahne', 'gecis', 'bant', 'onay', 'cerceve'].forEach(function(aile){
          bekle.push([aile, aile + '-' + k.no]);
        });
      });
      (L.BASARIM_AILELER || []).forEach(function(a){
        (a.esikler || []).forEach(function(e){
          bekle.push(['basarim', L.BASARIM_MEDYA_ADI(a.id, e)]);
        });
      });
      (L.MUHURLER || []).forEach(function(m){ bekle.push(['muhur', 'muhur-' + m.id]); });
      if(L.ONUR) bekle.push(['onur', 'onur-' + L.ONUR.id]);
      process.stdout.write(JSON.stringify(bekle));
    """
    try:
        ortam = dict(os.environ, SEVIYE_KOK=str(KOK / "brand" / "seviye"))
        r = subprocess.run(["node", "-e", betik], env=ortam,
                           capture_output=True, text=True, timeout=30)
    except (OSError, subprocess.SubprocessError) as e:
        return None, "node calistirilamadi (%s)" % e
    if r.returncode != 0:
        return None, (r.stderr or "").strip().splitlines()[-1:] or "node hata verdi"
    try:
        return json.loads(r.stdout), None
    except ValueError:
        return None, "node ciktisi okunamadi"


def eksik() -> int:
    """Katalogun bekledigi ama `medya/` altinda OLMAYAN dosyalar.

       `--liste` NE VAR der; bu NE YOK der. Ikisi ayri sorudur ve
       ikincisi bir suredir cevapsizdi: eksik dosya hata degildir
       (ekran kendini toparlar) ama hangi gorselin gelmedigini bilmek,
       teslimat geldiginde neyin yerine oturdugunu gormeyi saglar.
    """
    bekle, hata = _katalogdan_beklenen()
    if bekle is None:
        print("Katalog okunamadi: %s" % hata)
        print("(`--eksik` katalogu node ile okur; node kurulu degilse"
              " calismaz. `--liste` node olmadan da calisir.)")
        return 2

    var = {d.stem for d in MEDYA.iterdir() if d.is_file()} if MEDYA.is_dir() else set()
    gruplar = {}
    for aile, ad in bekle:
        if ad not in var:
            gruplar.setdefault(aile, []).append(ad)

    toplam = sum(len(v) for v in gruplar.values())
    if not toplam:
        print("Katalogun beklediği %d görselin hepsi yerinde." % len(bekle))
        return 0

    print("Katalog %d görsel bekliyor; %d tanesi yok.\n" % (len(bekle), toplam))
    for aile in sorted(gruplar):
        adlar = gruplar[aile]
        print("%-10s %d eksik" % (aile.upper(), len(adlar)))
        for ad in adlar:
            print("   · %s.webp" % ad)
        print("")
    print("Eksik dosya HATA DEĞİLDİR: kart yoksa banner kendi dairesini")
    print("çizer, sahne yoksa kademe renginden bir zemin kalır (bkz.")
    print("brand/seviye/OKU.md). Bu liste yalnız «ne gelmedi» sorusunun")
    print("cevabıdır.")
    return 0


def liste() -> int:
    """medya/ altında NE VAR. Eksiği söylemez — eksik dosya hata değildir
    (bkz. brand/seviye/OKU.md): rütbe kartı yoksa perde kartı kendisi
    çizer, sahne yoksa kademe rengi kullanılır."""
    if not MEDYA.is_dir():
        print("brand/seviye/medya/ yok.")
        return 0
    kartlar, sahneler, ötekiler = [], [], []
    for d in sorted(MEDYA.iterdir()):
        if not d.is_file():
            continue
        if RUTBE.match(d.stem):
            kartlar.append(d)
        elif SAHNE.match(d.stem) or GECIS.match(d.stem):
            sahneler.append(d)
        else:
            ötekiler.append(d)

    def yaz(baslik, liste_):
        if not liste_:
            return
        toplam = sum(_boyut(d) for d in liste_)
        print("\n%s — %d dosya, %.1f MB" % (baslik, len(liste_), toplam / 1048576))
        for d in liste_:
            print("  %-22s %s" % (d.name, _kb(_boyut(d))))

    yaz("RÜTBE KARTLARI", kartlar)
    yaz("KADEME SAHNELERİ", sahneler)
    yaz("ADI KALIBA UYMAYANLAR (servis edilir ama kimse istemez)", ötekiler)
    return 0


def main() -> int:
    if "--liste" in sys.argv:
        return liste()
    if "--eksik" in sys.argv:
        return eksik()
    arg = [a for a in sys.argv[1:] if not a.startswith("-")]
    if not arg:
        print(__doc__)
        return 0
    kayipli = "--kayipli" in sys.argv
    if kayipli:
        print("KAYIPLI koşum: görseller yeniden kodlanacak ve küçültülecek.\n")
    return isle(Path(arg[0]).expanduser().resolve(), kayipli)


if __name__ == "__main__":
    raise SystemExit(main())
