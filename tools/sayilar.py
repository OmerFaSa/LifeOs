#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sayıları TEK KAYNAKTAN üretir.

   README ve NOTLAR'da elle yazılan test sayıları sessizce eskiyordu:
   belgede 939 yazarken kod 1019 testle koşuyordu. Elle yazılan bir sayı,
   yazıldığı gün doğru olan bir sayıdır.

   Bu betik denetim araçlarını ÇALIŞTIRIR ve her aracın KENDİ son satırını
   belgelere yazar. Yorum katmaz, yuvarlamaz, özetlemez: araç ne yazdıysa
   o gider. Böylece belgedeki sayı, koşan koda bağlı kalır.

   Kullanım:
     python3 tools/sayilar.py            # yalnız birim testleri (hızlı)
     python3 tools/sayilar.py --tam      # duman, palet, düzen, başarım da
     python3 tools/sayilar.py --tam --yaz  # ölçer VE belgeleri günceller

   `--yaz`, `--tam` olmadan çalışmaz: hızlı koşum yalnız birim testlerini
   ölçer ve onunla yazmak, ölçülmemiş satırları belgeden **silerdi**.

   Belgelerde şu iki işaret arasındaki bölge değiştirilir:
     <!-- SAYILAR:baslangic -->  …  <!-- SAYILAR:bitis -->
"""

import os
import re
import subprocess
import sys
from datetime import date

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SISTEMLER = [('AYS', 'Akademik Yol Sistemi'),
             ('SPI', 'Sağlık Performans İzleyicisi'),
             ('ESP', 'Entelektüel Seviye Planlayıcı')]

HIZLI = ['runtests.js']
# `loadcheck.js` bu listede: aracin var olmasi yetmez, RUTINE girmesi
# gerekir. Uc sistemde de vardi ama hicbirinin rutin kosumunda yoktu —
# yazildigi gun kosan, sonra unutulan bir denetim, yazilmamis bir
# denetimle ayni sonucu verir. Agirdir (bes yillik veri uretir) ve bu
# yuzden yalniz `--tam` kosumundadir; her PR'da degil, haftada bir CI
# isinde de ayrica kosar (bkz. .github/workflows/ci.yml, `yuk`).
TAM = ['runtests.js', 'smoke.js', 'a11ycheck.js', 'palettecheck.js',
       'layoutcheck.js', 'perfcheck.js', 'ledgercheck.js', 'designcheck.js',
       'tasarimcheck.js', 'loadcheck.js']

BASLANGIC = '<!-- SAYILAR:baslangic -->'
BITIS = '<!-- SAYILAR:bitis -->'

# Python araçları çalışan yorumlayıcıyla çağrılır: «python3» Windows'ta yok
# olabilir (ya da Mağaza yönlendirmesidir).
PYTHON = sys.executable or 'python3'


def calistir(komut, cwd, timeout, yalniz_stdout=False):
    """Komutu çalıştırır; (çıkış kodu, boş olmayan satırlar). Çıktı UTF-8
    okunur ve alt Python süreci UTF-8 yazar: varsayılan kod sayfasıyla
    (Windows'ta cp1254) «Ş» gibi bir harf okuyucu iş parçacığını düşürüyor,
    çıktı None kalıyor, betik TypeError ile duruyordu (2026-10-02,
    tools/sayilar_test.py)."""
    env = dict(os.environ, PYTHONIOENCODING='utf-8')
    p = subprocess.run(komut, cwd=cwd, capture_output=True, text=True,
                       encoding='utf-8', errors='replace', timeout=timeout, env=env)
    metin = (p.stdout or '') if yalniz_stdout else (p.stdout or '') + '\n' + (p.stderr or '')
    return p.returncode, [x.strip() for x in metin.splitlines() if x.strip()]


def kosu(sistem, arac):
    """Aracı çalıştırır; (durum, son satır) döner. Yoksa None."""
    yol = os.path.join(KOK, sistem, 'tools', arac)
    if not os.path.exists(yol):
        return None
    try:
        kod, satirlar = calistir(['node', 'tools/' + arac], os.path.join(KOK, sistem), 900)
    except subprocess.TimeoutExpired:
        return ('zaman aşımı', '—')
    son = satirlar[-1] if satirlar else '—'
    return ('geçti' if kod == 0 else 'KALDI', son)


def kok_araclar():
    """Depo kokundeki denetimler — tek bir sistemin degil, ARALARININ."""
    out = {}
    for ad, komut in (("HKM tests", [PYTHON, "-m", "tests.run"]),
                      ("HKM perf", [PYTHON, "tools/perf.py"]),
                      ("HKM yuz", ["node", "tools/yuz.js"])):
        try:
            kod, satir = calistir(komut, os.path.join(KOK, "HKM"), 900, yalniz_stdout=True)
        except Exception as e:
            out[ad] = ("KALDI", str(e))
            continue
        out[ad] = ("gecti" if kod == 0 else "KALDI",
                   satir[-1] if satir else "—")
    # Marka adlandirmasi ve yol muhafizi. Bu arac bir teslimatta otuz
    # dosyayi tek seferde isimlendirip yerlestiriyor; kurali bozan bir
    # degisiklik sessizce yanlis yere yazabilir.
    #
    # KUNYE ve TEK KAYNAK DENETIMLERI de burada: ucu de saf Python,
    # saniyeler suruyor ve ucu de SESSIZ bir bozulmayi yakaliyor —
    # kopyanin kaynaktan ayrismasi, kunyenin tazeligini yitirmesi,
    # adin kurali bozmasi. Hicbiri ekranda gorunmuyor; ancak bir denetim
    # soylerse bilinir.
    for ad, komut in (
            ("marka.py", [PYTHON, "tools/marka.py", "--sina"]),
            ("marka kunyesi", [PYTHON, "tools/marka.py", "--kunye", "--denetle"]),
            ("seviye.py", [PYTHON, "tools/seviye.py", "--denetle"]),
            ("ortak.py", [PYTHON, "tools/ortak.py", "--denetle"]),
    ):
        try:
            kod, satir = calistir(komut, KOK, 120)
            out[ad] = ("gecti" if kod == 0 else "KALDI",
                       satir[-1] if satir else "—")
        except Exception as e:
            out[ad] = ("KALDI", str(e))

    try:
        kod, satir = calistir(["node", "tools/entegre.js"], KOK, 1800, yalniz_stdout=True)
        out["entegre.js"] = ("gecti" if kod == 0 else "KALDI",
                             satir[-1] if satir else "—")
    except Exception as e:
        out["entegre.js"] = ("KALDI", str(e))
    return out


def topla(araclar):
    out = {}
    for sistem, _ad in SISTEMLER:
        out[sistem] = {}
        for arac in araclar:
            r = kosu(sistem, arac)
            if r is None:
                continue
            out[sistem][arac] = r
            print('%-4s %-16s %s — %s' % (sistem, arac, r[0], r[1]))
    return out


def tablo(sonuc, araclar):
    kullanilan = [a for a in araclar
                  if any(a in sonuc[s] for s, _ in SISTEMLER)]
    satir = ['| Araç | ' + ' | '.join(s for s, _ in SISTEMLER) + ' |',
             '|---|' + '---|' * len(SISTEMLER)]
    for arac in kullanilan:
        hucreler = []
        for sistem, _ad in SISTEMLER:
            r = sonuc[sistem].get(arac)
            hucreler.append('—' if r is None else r[1].replace('|', '¦'))
        satir.append('| `' + arac + '` | ' + ' | '.join(hucreler) + ' |')
    return '\n'.join(satir)


def govde(sonuc, araclar):
    return ('\n_Bu bölüm elle yazılmaz: `python3 tools/sayilar.py --yaz` '
            'araçları koşturur ve her aracın kendi son satırını buraya '
            'yazar. Son koşum: ' + date.today().isoformat() + '._\n\n'
            + tablo(sonuc, araclar) + '\n')


def yaz(dosya, metin):
    yol = os.path.join(KOK, dosya)
    with open(yol, encoding='utf-8') as f:
        s = f.read()
    if BASLANGIC not in s or BITIS not in s:
        print('atlandı (işaret yok): ' + dosya)
        return False
    yeni = re.sub(re.escape(BASLANGIC) + '.*?' + re.escape(BITIS),
                  BASLANGIC + '\n' + metin + BITIS, s, flags=re.S)
    if yeni == s:
        return False
    with open(yol, 'w', encoding='utf-8') as f:
        f.write(yeni)
    print('yazıldı: ' + dosya)
    return True


def main():
    tam = '--tam' in sys.argv
    araclar = TAM if tam else HIZLI
    sonuc = topla(araclar)
    kok = kok_araclar() if tam else {}
    for ad, r in kok.items():
        print('%-4s %-16s %s — %s' % ('kök', ad, r[0], r[1]))
    metin = govde(sonuc, araclar)
    if kok:
        metin += ('\n| Depo denetimi | Sonuç |\n|---|---|\n'
                  + ''.join('| `%s` | %s |\n' % (a, r[1].replace('|', '¦'))
                            for a, r in kok.items()))
    kalan = [(s, a) for s in sonuc for a in sonuc[s] if sonuc[s][a][0] != 'geçti']
    kalan += [('kök', a) for a, r in kok.items() if r[0] != 'gecti']
    if '--yaz' in sys.argv:
        # OLCULMEYEN SATIR SILINMEZ. Hizli kosum yalnizca birim testlerini
        # olcer; onunla yazmak, olculmemis satirlari belgeden KALDIRIRDI ve
        # belge daha az sey olcuyormus gibi gorunurdu. Olculmeyen bir sey
        # icin bos satir yazmak da, «bu arac artik yok» demekti.
        if not tam:
            print('yazilmadi: --yaz icin --tam gerekir. Hizli kosum yalniz '
                  'birim testlerini olcer; olculmeyen satirlari silmek, '
                  'belgeyi daha az sey olcuyormus gibi gosterirdi.')
            return 2
        # KALAN VARKEN YAZILMAZ. Kalan bir aracin son satiri bir hata
        # mesajidir; onu tabloya yazmak, belgeye olculmus bir sayi gibi
        # girer ve bir onceki DOGRU olcumu siler.
        if kalan:
            print('yazilmadi: ' + ', '.join(s + '/' + a for s, a in kalan)
                  + ' gecmedi; belgeler eski (dogru) olcumu korur.')
            return 1
        for d in ['README.md', os.path.join('belgeler', 'NOTLAR.md')]:
            yaz(d, metin)
    else:
        print()
        print(metin)
    if kalan:
        print('KALAN: ' + ', '.join(s + '/' + a for s, a in kalan))
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
