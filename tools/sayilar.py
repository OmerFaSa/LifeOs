#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sayıları TEK KAYNAKTAN üretir.

   Belgelerde elle yazılan test sayıları sessizce eskiyordu: belgede 939
   yazarken kod 1019 testle koşuyordu. Elle yazılan bir sayı, yazıldığı gün
   doğru olan bir sayıdır.

   Bu betik tek sistemin (kabuk, motorlar, ortak çekirdek, King, kalite,
   tek kapı) test takımlarını ÇALIŞTIRIR ve her takımın KENDİ son satırını
   belgeye yazar. Yorum katmaz, yuvarlamaz, özetlemez.

   Kullanım:
     python3 tools/sayilar.py              # birim takımları (hızlı)
     python3 tools/sayilar.py --tam        # gerçek tarayıcı gezileri de
     python3 tools/sayilar.py --tam --yaz  # ölçer VE belgeyi günceller

   `--yaz`, `--tam` olmadan çalışmaz: hızlı koşum gezileri ölçmez ve onunla
   yazmak, ölçülmemiş satırları belgeden **silerdi**.

   Belgede şu iki işaret arasındaki bölge değiştirilir:
     <!-- SAYILAR:baslangic -->  …  <!-- SAYILAR:bitis -->
"""

import os
import re
import subprocess
import sys
from datetime import date

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASLANGIC = '<!-- SAYILAR:baslangic -->'
BITIS = '<!-- SAYILAR:bitis -->'
BELGELER = [os.path.join('belgeler', 'NOTLAR.md')]

# Python araçları çalışan yorumlayıcıyla çağrılır: «python3» Windows'ta yok
# olabilir (ya da Mağaza yönlendirmesidir).
PYTHON = sys.executable or 'python3'

# (ad, komut). Liste CI'daki tek sistem işinin (`.github/workflows/ci.yml`) takımlarıdır.
HIZLI = [('Kabuk', ['node', 'kabuk/kabuk.test.js']), ('Bileşenler', ['node', 'kabuk/bilesen.test.js']),
         ('Onay', ['node', 'kabuk/onay.test.js']), ('Kayıt deposu', ['node', 'kabuk/depo.test.js']),
         ('Tanışma', ['node', 'kabuk/tanisma.test.js']), ('Deneme', ['node', 'kabuk/deneme.test.js']),
         ('Yol', ['node', 'motor/yol.test.js']), ('Tekrar', ['node', 'motor/tekrar.test.js']),
         ('Not', ['node', 'motor/not.test.js']), ('Soru', ['node', 'motor/soru.test.js']),
         ('Kayıt', ['node', 'motor/kayit.test.js']), ('Plan', ['node', 'motor/plan.test.js']),
         ('Tek kapı', [PYTHON, 'tools/tekkapi_test.py']), ('King', [PYTHON, 'king/mcp_test.py']),
         ('Ölçüm bütçesi', [PYTHON, 'kalite/olcum.py', '--denetle'])]
TAM = HIZLI + [('Ortak çekirdek (tarayıcı)', ['node', 'tools/ortak_test.js']),
               ('Kabuk gezisi (tarayıcı)', ['node', 'tools/kabuk_gez.js']),
               ('Eşitleme gezisi (tarayıcı)', ['node', 'tools/kabuk_esit_gez.js'])]


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


def kosu(komut):
    """(durum, son satır)."""
    try:
        kod, satirlar = calistir(komut, KOK, 900, yalniz_stdout=True)
    except subprocess.TimeoutExpired:
        return ('KALDI', 'zaman aşımı')
    except OSError as e:
        return ('KALDI', str(e))
    return ('geçti' if kod == 0 else 'KALDI', satirlar[-1] if satirlar else '—')


def govde(sonuc):
    return ('\n_Bu bölüm elle yazılmaz: `python3 tools/sayilar.py --tam --yaz` takımları koşturur ve '
            'her takımın kendi son satırını buraya yazar. Son koşum: ' + date.today().isoformat() + '._\n\n'
            '| Takım | Son satır |\n|---|---|\n'
            + ''.join('| %s | %s |\n' % (ad, r[1].replace('|', '¦')) for ad, r in sonuc) )


def yaz(dosya, metin):
    yol = os.path.join(KOK, dosya)
    with open(yol, encoding='utf-8') as f:
        s = f.read()
    if BASLANGIC not in s or BITIS not in s:
        print('atlandı (işaret yok): ' + dosya)
        return False
    yeni = re.sub(re.escape(BASLANGIC) + '.*?' + re.escape(BITIS),
                  lambda _m: BASLANGIC + '\n' + metin + BITIS, s, flags=re.S)
    if yeni == s:
        return False
    with open(yol, 'w', encoding='utf-8') as f:
        f.write(yeni)
    print('yazıldı: ' + dosya)
    return True


def main():
    try:   # Windows konsolu (cp1254) «✓» basamaz
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
    tam = '--tam' in sys.argv
    sonuc = []
    for ad, komut in (TAM if tam else HIZLI):
        r = kosu(komut)
        sonuc.append((ad, r))
        print('%-28s %s — %s' % (ad, r[0], r[1]))
    metin = govde(sonuc)
    kalan = [ad for ad, r in sonuc if r[0] != 'geçti']
    if '--yaz' in sys.argv:
        # OLCULMEYEN SATIR SILINMEZ: hizli kosum gezileri olcmez; onunla yazmak satirlari belgeden kaldirirdi.
        if not tam:
            print('yazılmadı: --yaz için --tam gerekir; ölçülmeyen satırı silmek belgeyi daha az şey ölçüyormuş gibi gösterirdi.')
            return 2
        # KALAN VARKEN YAZILMAZ: kalan takimin son satiri bir hata iletisidir; tabloya girerse onceki DOGRU olcumu siler.
        if kalan:
            print('yazılmadı: ' + ', '.join(kalan) + ' geçmedi; belge eski (doğru) ölçümü korur.')
            return 1
        for d in BELGELER:
            yaz(d, metin)
    else:
        print('\n' + metin)
    if kalan:
        print('KALAN: ' + ', '.join(kalan))
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
