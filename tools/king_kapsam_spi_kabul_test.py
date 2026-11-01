#!/usr/bin/env python3
"""Kabul testi, gorev 022: SPI ekran islerinin tamami King araci (KING-4 A2).

Sinar: tools/king_kapsam.js --modul=spi kirmizisiz (her Model yazma islevi ve her rota
eslemedeki araca bagli, arac kayitta var); yeni her arac SPI/src/tests/kingarac.test.js'te
en az bir sinamada adiyla geciyor.
"""
import subprocess
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
YENI = "spi_antrenman_sil spi_butce spi_gida spi_hane spi_hane_oku spi_hedefler spi_ilac spi_karar_kapat spi_market spi_mutfak spi_ogun_sil spi_planlar spi_profil spi_tahlil_sil".split()


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    r =subprocess.run(["node", str(KOK / "tools" / "king_kapsam.js"), "--modul=spi", "--port=4471"], cwd=KOK,
                       capture_output=True, text=True, encoding="utf-8", timeout=600)
    if r.returncode != 0:
        print("KABUL KIRMIZI: king_kapsam.js cikis %d: %s" % (r.returncode, (r.stdout + r.stderr)[-1500:]))
        sys.exit(1)
    test = (KOK / "SPI" / "src" / "tests" / "kingarac.test.js").read_text(encoding="utf-8")
    eksik = [a for a in YENI if ("'" + a + "'") not in test]
    if eksik:
        print("KABUL KIRMIZI: kingarac.test.js'te sinanmayan arac: " + ", ".join(eksik))
        sys.exit(1)
    print("king kapsam spi kabul: ekran islerinin tamami arac, %d yeni arac sinanmis." % len(YENI))


if __name__ == "__main__":
    main()
