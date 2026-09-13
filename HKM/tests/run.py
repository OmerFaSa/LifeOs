#!/usr/bin/env python3
"""python -m tests.run — butun HKM testleri."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tests import (harness, test_channels, test_cross, test_daemon,  # noqa: E402
                   test_manager, test_precedence, test_sync, test_twin,
                   test_vps)


def main():
    for mod in (test_vps, test_sync, test_precedence, test_twin,
                test_cross, test_manager, test_channels, test_daemon):
        mod.run()

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
