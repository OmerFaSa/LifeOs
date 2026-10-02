#!/usr/bin/env python3
"""`sayilar.py` çıktı okuma testi.

   python3 tools/sayilar_test.py     (cikis 0 temiz, 1 kirmizi)

Hata (2026-10-02): araçların çıktısı varsayılan kod sayfasıyla okunuyordu.
Windows'ta (cp1254) «Ş» gibi bir harfin UTF-8 baytı okuyucu iş parçacığını
düşürüyor, çıktı None kalıyor ve betik TypeError ile duruyordu — `--tam`
bu makinede hiç bitmiyordu. Söz: çıktı her işletim sisteminde UTF-8
okunur, satır olduğu gibi döner; alt Python süreci de UTF-8 yazar."""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sayilar  # noqa: E402

try:   # Windows konsolu (cp1254) «✓» basamaz
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

kirmizi = 0


def dogru(ad, kosul, gelen=None):
    global kirmizi
    print(("  ✓ " if kosul else "  ✕ ") + ad + ("" if kosul else " (gelen %r)" % (gelen,)))
    if not kosul:
        kirmizi += 1


CUMLE = 'Telefon ve tablet düzeni temiz — 390 pikselde taşma yok, Şimdi ölçüldü'

# Bayt düzeyinde UTF-8 yazan süreç: konsol kod sayfasından bağımsız.
kod, satirlar = sayilar.calistir(
    [sys.executable, '-c', 'import sys; sys.stdout.buffer.write(%r.encode("utf-8") + b"\\n")' % CUMLE],
    os.getcwd(), 60)
dogru('UTF-8 çıktı bozulmadan okunur', kod == 0 and satirlar[-1:] == [CUMLE], satirlar)

# Alt Python süreci print() ile yazınca da UTF-8 gelir (PYTHONIOENCODING).
kod, satirlar = sayilar.calistir([sys.executable, '-c', 'print(%r)' % CUMLE], os.getcwd(), 60)
dogru('alt Python print() çıktısı UTF-8 okunur', kod == 0 and satirlar[-1:] == [CUMLE], satirlar)

# stderr de satırlara girer; boş satır atılır.
kod, satirlar = sayilar.calistir(
    [sys.executable, '-c', 'import sys; print("bir"); print(); sys.stderr.write("iki\\n"); sys.exit(3)'],
    os.getcwd(), 60)
dogru('stderr dahil, boş satır atılır, çıkış kodu korunur', kod == 3 and satirlar == ['bir', 'iki'], (kod, satirlar))

# Python araçları çalışan yorumlayıcıyla çağrılır («python3» Windows'ta yok olabilir).
dogru('Python araçları sys.executable ile çağrılır', sayilar.PYTHON == sys.executable, sayilar.PYTHON)

print('\n' + (str(kirmizi) + ' durum kırmızı.' if kirmizi else 'sayilar.py çıktı okuma testi temiz — 4 durum.'))
sys.exit(1 if kirmizi else 0)
