#!/usr/bin/env python3
"""Uygulamanin icine girecek sayfalari hazirlar (CI ve elle).

   python3 uygulama/ios/hazirla.py

Uc modulun derlenmis tek dosyasi (AYS/SPI/ESP `dist/`) uygulama/ios/
LifeOS/Web/ altina kopyalanir. Ortak gorseller (img/seviye, img/marka) uc
modulde AYNI dosyalardir; tek kopya `Web/ortak/` altina gider ve yerel
sunucu onu uc kapidan da verir (sistem/sunucu.py gibi) — uygulama ~320 MB
yerine ~110 MB olur. Uc kopya ayrisirsa (biri digerinden farkliysa) hicbir
sey yazilmaz: hangisinin dogru oldugu tahmin edilmez.

Simge: brand/life/logo.png → AppIcon (macOS'ta `sips` ile 1024 px'e).
"""
import filecmp
import os
import shutil
import subprocess
import sys
from pathlib import Path

BURASI = Path(__file__).resolve().parent
KOK = BURASI.parent.parent
WEB = BURASI / "LifeOS" / "Web"
SIMGE = BURASI / "LifeOS" / "Assets.xcassets" / "AppIcon.appiconset" / "icon-1024.png"
MODULLER = [("AYS", "rota.html"), ("SPI", "spi.html"), ("ESP", "esp.html")]
ORTAK = ("seviye", "marka")


def ayni_agac(a, b):
    k = filecmp.dircmp(a, b)
    if k.left_only or k.right_only or k.diff_files or k.funny_files:
        return False
    return all(ayni_agac(os.path.join(a, d), os.path.join(b, d)) for d in k.common_dirs)


def boyut(yol):
    return sum(f.stat().st_size for f in Path(yol).rglob("*") if f.is_file())


def main():
    for ad, sayfa in MODULLER:
        d = KOK / ad / "dist"
        for gerek in (d / sayfa, d / "sw.js", d / "img"):
            if not gerek.exists():
                print("✕ eksik: %s — önce `python3 build.py` (%s klasöründe)" % (gerek, ad))
                return 1
    ilk = KOK / MODULLER[0][0] / "dist" / "img"
    for ad, _ in MODULLER[1:]:
        for o in ORTAK:
            if (ilk / o).exists() and not ayni_agac(ilk / o, KOK / ad / "dist" / "img" / o):
                print("✕ img/%s üç modülde aynı değil (%s farklı); tek kopya yapılamaz" % (o, ad))
                return 1

    if WEB.exists():
        shutil.rmtree(WEB)
    for ad, sayfa in MODULLER:
        d, h = KOK / ad / "dist", WEB / ad
        h.mkdir(parents=True)
        shutil.copy2(d / sayfa, h / sayfa)
        shutil.copy2(d / "sw.js", h / "sw.js")
        for alt in (d / "img").iterdir():
            if alt.name in ORTAK:
                continue
            if alt.is_dir():
                shutil.copytree(alt, h / "img" / alt.name)
            else:
                (h / "img").mkdir(parents=True, exist_ok=True)
                shutil.copy2(alt, h / "img" / alt.name)
    for o in ORTAK:
        if (ilk / o).exists():
            shutil.copytree(ilk / o, WEB / "ortak" / o)

    shutil.copy2(KOK / "brand" / "life" / "logo.png", SIMGE)
    if sys.platform == "darwin":
        subprocess.run(["sips", "-z", "1024", "1024", str(SIMGE)], check=True, capture_output=True)

    print("Web: %.1f MB (%s)" % (boyut(WEB) / 1e6, ", ".join(
        "%s %.1f MB" % (p.name, boyut(p) / 1e6) for p in sorted(WEB.iterdir()))))
    print("Simge: %s" % SIMGE.relative_to(KOK))
    return 0


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    raise SystemExit(main())
