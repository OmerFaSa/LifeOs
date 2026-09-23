#!/usr/bin/env python3
"""python -m tests.run — butun HKM testleri."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tests import (harness, test_baslat, test_butce, test_channels,  # noqa: E402
                   test_cross,
                   test_daemon, test_dil, test_impact, test_intents, test_kanal,
                   test_manager, test_media, test_memory, test_models, test_motto,
                   test_precedence, test_profil, test_ritim,
                   test_sohbet, test_streak, test_sync, test_twin,
                   test_vps, test_yoklama, test_yuz)


def main():
    for mod in (test_vps, test_sync, test_precedence, test_twin,
                test_cross, test_impact, test_dil, test_intents,
                test_manager, test_profil, test_ritim, test_streak, test_channels,
                test_daemon, test_models, test_butce, test_media, test_memory,
                test_motto, test_yoklama, test_kanal,
                test_sohbet, test_baslat, test_yuz):
        mod.run()
    test_channels.run_bot()

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
