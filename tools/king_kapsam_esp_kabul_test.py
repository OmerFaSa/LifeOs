#!/usr/bin/env python3
"""Kabul testi, gorev 023: ESP ekran islerinin tamami King araci (KING-4 A2).

Sinar: tools/king_kapsam.js --modul=esp kirmizisiz (her Model yazma islevi ve her rota
eslemedeki araca bagli, arac kayitta var); yeni her arac ESP/src/tests/kingarac.test.js'te
en az bir sinamada adiyla geciyor.
"""
import subprocess
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
YENI = "esp_arguman esp_argumanlar esp_dosya esp_eser esp_hatirlatma esp_hedef esp_karar_kapat esp_kart_sil esp_kaynak esp_kitap esp_merdiven esp_not_sil esp_olay esp_olaylar esp_oturum esp_repertuvar esp_ses_kaydi esp_taslak esp_zincir".split()


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    r =subprocess.run(["node", str(KOK / "tools" / "king_kapsam.js"), "--modul=esp", "--port=4501"], cwd=KOK,
                       capture_output=True, text=True, encoding="utf-8", timeout=600)
    if r.returncode != 0:
        print("KABUL KIRMIZI: king_kapsam.js cikis %d: %s" % (r.returncode, (r.stdout + r.stderr)[-1500:]))
        sys.exit(1)
    test = (KOK / "ESP" / "src" / "tests" / "kingarac.test.js").read_text(encoding="utf-8")
    eksik = [a for a in YENI if ("'" + a + "'") not in test]
    if eksik:
        print("KABUL KIRMIZI: kingarac.test.js'te sinanmayan arac: " + ", ".join(eksik))
        sys.exit(1)
    print("king kapsam esp kabul: ekran islerinin tamami arac, %d yeni arac sinanmis." % len(YENI))


if __name__ == "__main__":
    main()
