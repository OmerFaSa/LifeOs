"""Dosya izinleri — HATALAR D-13.

config.json jetonlari (yerel jeton, saglayici anahtarlari, kanal jetonlari),
ambar ve yedekler kisisel veridir. Varsayilan umask ile (0644) yazildiklarinda
bir VPS'teki baska kullanicilar okuyabiliyordu.

Iki katman:
  · daemon acilista umask'i 077 yapar: bundan sonra yazilan her sey yalniz
    sahibine acik dogar (ambar, -wal/-shm, kopyalar, yedek, medya);
  · daha once yazilmis olanlar `sikilastir` ile daraltilir. Yalniz HKM'nin
    KENDI dosyalarina dokunulur: ambar kullanicinin sectigi bir klasorde
    duruyorsa o klasorun kendisi ve icindeki yabanci dosyalar degismez.
"""

import os
import re
import stat

DOSYA = 0o600
KLASOR = 0o700
KOPYA = re.compile(r"^hkm-.+\.db$")
ALT_KLASORLER = ("yedek", "media")


def _daralt(yol, mod):
    try:
        simdi = stat.S_IMODE(os.stat(yol).st_mode)
    except OSError:
        return 0
    if simdi & 0o077 == 0:
        return 0
    try:
        os.chmod(yol, mod)
        return 1
    except OSError:
        return 0


def sikilastir(config_yolu, db_yolu):
    """Var olan HKM dosyalarini daraltir; kac yolun degistigini dondurur."""
    if os.name != "posix":
        return 0
    n = 0
    if config_yolu:
        n += _daralt(config_yolu, DOSYA)
    if not db_yolu or db_yolu == ":memory:":
        return n
    db_yolu = os.path.abspath(db_yolu)
    klasor = os.path.dirname(db_yolu)
    for ek in ("", "-wal", "-shm", "-journal"):
        n += _daralt(db_yolu + ek, DOSYA)
    try:
        adlar = os.listdir(klasor)
    except OSError:
        adlar = []
    for ad in adlar:
        if KOPYA.match(ad):
            n += _daralt(os.path.join(klasor, ad), DOSYA)
    for alt in ALT_KLASORLER:
        kok = os.path.join(klasor, alt)
        if not os.path.isdir(kok):
            continue
        n += _daralt(kok, KLASOR)
        for yer, klasorler, dosyalar in os.walk(kok):
            for k in klasorler:
                n += _daralt(os.path.join(yer, k), KLASOR)
            for d in dosyalar:
                n += _daralt(os.path.join(yer, d), DOSYA)
    return n
