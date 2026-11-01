#!/usr/bin/env python3
"""Kabul testi, gorev 031: King sinavi AYS kayiplari (KING-4 3a).

Sinar: `node tools/king_sinav.js --modul=ays --json` ile
- HEDEF cumlelerinden en cok 3 tanesi kalabilir;
- hedef disinda kalan her cumle gecer (gerileme yok; IZINLI listesi Claude Code'un isi);
- sinav cumleleri AYS/src/js/core/kingarac.js'te aynen gecmez (ezber yok: anahtar kelime
  aracin isini anlatir, sinav cumlesini kopyalamaz).
"""
import json
import socket
import subprocess
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
HEDEF = {
    "bugün yorgunum, çalışma süresini kısalt",
    "TYT ve AYT durum özetimi çıkar",
    "en çok hangi derste yanlış yapıyorum",
    "biyolojide kaç konu bitirdim",
    "geçen haftanın review metni",
    "bu hafta hangi gün kaç soru çözdüm",
    "bugün kaç kez mola verdim",
    "son günlerde enerji seviyem nasıl seyrediyor",
    "en çok hangi konularda net kaybediyorum",
    "şu anki netlerle kaç bine girerim",
    "optik konusunu tekrara al",
    "polinomları tekrar çalışılacaklara ekle",
    "vadesi geçmiş kartları bugüne aktar",
    "toplantı kararını yapıldı işaretle",
    "bayram günleri için mola tanımla",
    "bu hafta çalışma süresini geçici olarak 3 saate düşür",
    "iki günlüğüne günlük çalışma süresini 120 dakika yap",
    "günlük temel çalışma süresini 5 saat yap",
    "kartlar bölümünü tekrar aç",
    "1 buçuk saat geometri çalıştım",
}
IZINLI = {
    "deneme çözerken süreyi yetiştiremiyorum",
}
EN_COK_KACAN = 3


def bos_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    p = s.getsockname()[1]
    s.close()
    return p


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    port = bos_port() - 0   # king_sinav.js: AYS PORT, SPI PORT+10, ESP PORT+20
    r = subprocess.run(["node", str(KOK / "tools" / "king_sinav.js"), "--modul=ays", "--json", "--port=%d" % port],
                       cwd=KOK, capture_output=True, text=True, encoding="utf-8", timeout=900)
    if r.returncode != 0:
        print("KABUL KIRMIZI: king_sinav.js cikis %d: %s" % (r.returncode, (r.stdout + r.stderr)[-1500:]))
        sys.exit(1)
    sonuc = json.loads(r.stdout.strip().splitlines()[-1])
    kalan = [s for s in sonuc if not s["ok"]]
    gerileme = [s for s in kalan if s["c"] not in HEDEF and s["c"] not in IZINLI]
    kacan = [s for s in kalan if s["c"] in HEDEF]
    sinav = [c["c"] for c in json.loads((KOK / "tools" / "king_sinav.json").read_text(encoding="utf-8"))["cumleler"] if c["m"] == "ays"]
    kod = (KOK / "AYS" / "src" / "js" / "core" / "kingarac.js").read_text(encoding="utf-8").lower()
    ezber = [c for c in sinav if len(c.split()) > 2 and c.lower() in kod]
    hata = []
    if gerileme:
        hata.append("gerileme (once gecen cumle kaldi): " + "; ".join("%s -> %s" % (s["c"], s["karar"]) for s in gerileme))
    if len(kacan) > EN_COK_KACAN:
        hata.append("%d hedef kaldi (en cok %d): " % (len(kacan), EN_COK_KACAN) + "; ".join("%s -> %s" % (s["c"], s["karar"]) for s in kacan))
    if ezber:
        hata.append("sinav cumlesi kingarac.js'e kopyalanmis: " + "; ".join(ezber))
    if hata:
        print("KABUL KIRMIZI: " + " | ".join(hata))
        sys.exit(1)
    print("king sinav ays kabul: %d/%d gecti, %d hedeften %d kaldi, gerileme yok." % (len(sonuc) - len(kalan), len(sonuc), len(HEDEF), len(kacan)))


if __name__ == "__main__":
    main()
