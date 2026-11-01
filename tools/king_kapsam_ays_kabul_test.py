#!/usr/bin/env python3
"""Kabul testi, gorev 021: AYS ekran islerinin tamami King araci (KING-4 A2).

Sinar: tools/king_kapsam.js --modul=ays kirmizisiz (her Model yazma islevi ve her rota
eslemedeki araca bagli, arac kayitta var); yeni her arac AYS/src/tests/kingarac.test.js'te
en az bir sinamada adiyla geciyor.
"""
import subprocess
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
YENI = "ays_deneme ays_enerji ays_etkinlik ays_hafta_degerlendirme ays_kart ays_konu_durumu ays_mesgale_ekle ays_mola ays_profil ays_profiller ays_takvim ays_telafi ays_video_notu ays_yanlis".split()


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    r =subprocess.run(["node", str(KOK / "tools" / "king_kapsam.js"), "--modul=ays", "--port=4441"], cwd=KOK,
                       capture_output=True, text=True, encoding="utf-8", timeout=600)
    if r.returncode != 0:
        print("KABUL KIRMIZI: king_kapsam.js cikis %d: %s" % (r.returncode, (r.stdout + r.stderr)[-1500:]))
        sys.exit(1)
    test = (KOK / "AYS" / "src" / "tests" / "kingarac.test.js").read_text(encoding="utf-8")
    eksik = [a for a in YENI if ("'" + a + "'") not in test]
    if eksik:
        print("KABUL KIRMIZI: kingarac.test.js'te sinanmayan arac: " + ", ".join(eksik))
        sys.exit(1)
    print("king kapsam ays kabul: ekran islerinin tamami arac, %d yeni arac sinanmis." % len(YENI))


if __name__ == "__main__":
    main()
