#!/usr/bin/env python3
"""Kabul testi, gorev 033: King sinavi ESP kayiplari (KING-4 3a).

Sinar: `node tools/king_sinav.js --modul=esp --json` ile
- HEDEF cumlelerinden en cok 3 tanesi kalabilir;
- hedef disinda kalan her cumle gecer (gerileme yok; IZINLI listesi Claude Code'un isi);
- sinav cumleleri ESP/src/js/core/kingarac.js'te aynen gecmez (ezber yok: anahtar kelime
  aracin isini anlatir, sinav cumlesini kopyalamaz).
"""
import json
import socket
import subprocess
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
HEDEF = {
    "30 sayfa kitap okudum",
    "kitap ekle",
    "okunacaklar listesine kitap ekle",
    "bugün entelektüel pratik sürem ne kadar",
    "bu hafta toplam gitar ve dil çalışma saatim",
    "son 7 günde hangi disipline ne kadar vakit ayırdım",
    "şu an okuduğum kitaplar hangileri",
    "bu yıl bitirdiğim kitapların listesi",
    "kitaptan alıntı ekle: Sorgulanmayan hayat yaşanmaya değmez",
    "Sefiller'i okumayı tamamladım",
    "45 dakika tarih çalıştım",
    "çeyrek saat ses açma egzersizi yaptım",
    "15 dakika artikülasyon ve nefes çalıştım",
}
IZINLI = {
    "deneme yazarken paragraflar arası geçişi nasıl bağlayabilirim",
    "Almanca gramer hakkında soru sor",
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
    port = bos_port() - 20   # king_sinav.js: AYS PORT, SPI PORT+10, ESP PORT+20
    r = subprocess.run(["node", str(KOK / "tools" / "king_sinav.js"), "--modul=esp", "--json", "--port=%d" % port],
                       cwd=KOK, capture_output=True, text=True, encoding="utf-8", timeout=900)
    if r.returncode != 0:
        print("KABUL KIRMIZI: king_sinav.js cikis %d: %s" % (r.returncode, (r.stdout + r.stderr)[-1500:]))
        sys.exit(1)
    sonuc = json.loads(r.stdout.strip().splitlines()[-1])
    kalan = [s for s in sonuc if not s["ok"]]
    gerileme = [s for s in kalan if s["c"] not in HEDEF and s["c"] not in IZINLI]
    kacan = [s for s in kalan if s["c"] in HEDEF]
    sinav = [c["c"] for c in json.loads((KOK / "tools" / "king_sinav.json").read_text(encoding="utf-8"))["cumleler"] if c["m"] == "esp"]
    kod = (KOK / "ESP" / "src" / "js" / "core" / "kingarac.js").read_text(encoding="utf-8").lower()
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
    print("king sinav esp kabul: %d/%d gecti, %d hedeften %d kaldi, gerileme yok." % (len(sonuc) - len(kalan), len(sonuc), len(HEDEF), len(kacan)))


if __name__ == "__main__":
    main()
