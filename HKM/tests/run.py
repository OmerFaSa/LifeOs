#!/usr/bin/env python3
"""python -m tests.run — butun HKM testleri."""

import os
import time
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tests import (harness, test_bam, test_baslat, test_bildirim, test_butce, test_channels,  # noqa: E402
                   test_cross, test_merkez, test_meydan,
                   test_daemon, test_dil, test_impact, test_intents, test_kanal, test_king,
                   test_depo, test_kaynakli, test_kitap, test_mufredat, test_pdf, test_program,
                   test_spibilgi, test_tani, test_unite, test_espbelge, test_para, test_kapi, test_fis,
                   test_urun,
                   test_web, test_hedefag, test_teklif, test_yedek, test_izin, test_saat,
                   test_manager, test_media, test_memory, test_models, test_motto,
                   test_precedence, test_profil, test_ritim,
                   test_sohbet, test_streak, test_sync, test_twin,
                   test_vps, test_yoklama, test_yuz)


# SAAT DILIMI SIZMAZ: `hkm.main` ve daemon sureci saat dilimini kurar
# (core/saat.py, KO-1). Bir test modulu onu geri koymazsa SONRAKI
# modullerin «bugun»u kayar ve hata yalniz tam kosumda, yalniz UTC
# 21:00-24:00 arasi gorunur (test_kanal «King'in onerisi brifingten
# gelir» boyle kirmiziydi). Her modulden sonra bakilir; sizan modul adiyla
# KIRMIZI yazilir ve dilim geri konur ki ardindakiler dogru kossun.
_TZ0 = os.environ.get("TZ")


def _dilim_muhafizi(mod):
    tz = os.environ.get("TZ")
    if tz == _TZ0:
        return
    harness.RESULTS.append(("kosum", mod.__name__ + " saat dilimini geri koydu",
                            "TZ %r kaldi (baslangicta %r)" % (tz, _TZ0)))
    if _TZ0 is None:
        os.environ.pop("TZ", None)
    else:
        os.environ["TZ"] = _TZ0
    if hasattr(time, "tzset"):
        time.tzset()


def main():
    for mod in (test_vps, test_sync, test_precedence, test_twin,
                test_cross, test_impact, test_dil, test_intents,
                test_manager, test_profil, test_ritim, test_streak, test_channels,
                test_daemon, test_models, test_butce, test_media, test_memory,
                test_motto, test_yoklama, test_kanal, test_bam, test_king, test_mufredat, test_kitap, test_web, test_kaynakli, test_urun, test_pdf, test_depo, test_program, test_hedefag, test_teklif, test_yedek, test_izin, test_saat, test_spibilgi, test_tani,
                test_unite, test_espbelge, test_para, test_kapi, test_fis, test_bildirim,
                test_sohbet, test_baslat, test_yuz, test_meydan, test_merkez):
        mod.run()
        _dilim_muhafizi(mod)
    test_channels.run_bot()
    test_bildirim.run_eksik()
    test_bildirim.run_bayat()
    test_bildirim.run_yarin()
    test_bildirim.run_tatil()
    test_meydan.run_daemon()
    test_merkez.run_daemon()

    suite = None
    fails = 0
    for s, name, err in harness.RESULTS:
        if s != suite:
            suite = s
            print("\n  " + s)
        if err:
            fails += 1
            print("    x %s\n        %s" % (name, err))
        else:
            print("    . %s" % name)

    total = len(harness.RESULTS)
    print("\n%d/%d test gecti%s" % (total - fails, total,
                                    "" if not fails else " — %d BASARISIZ" % fails))
    return 1 if fails else 0


if __name__ == "__main__":
    raise SystemExit(main())
