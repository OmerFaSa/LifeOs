#!/usr/bin/env python3
"""Uygulamanin icine girecek sayfalari hazirlar (CI ve elle).

   python3 uygulama/ios/hazirla.py

Uc modulun derlenmis tek dosyasi (AYS/SPI/ESP `dist/`) uygulama/ios/
LifeOS/Web/ altina kopyalanir. Ortak gorseller (img/seviye, img/marka) uc
modulde AYNI dosyalardir; tek kopya `Web/ortak/` altina gider ve yerel
sunucu onu uc kapidan da verir (sistem/sunucu.py gibi) — uygulama ~320 MB
yerine ~110 MB olur.

Ortak gorseller KAYNAKTAN alinir (build.py copy_level_assets ile ayni
kural): dist/img/seviye ve dist/img/marka git'te degildir (.gitignore),
CI'daki kopyada yoktur. Ilk derlemede bu yuzden uygulamaya hic girmediler
ve sessizce atlandilar (IPA 10,8 MB). Artik bos kalirlarsa betik durur.

Simge: brand/life/logo.png → AppIcon (macOS'ta `sips` ile 1024 px'e).
"""
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
MEDYA = (".mp4", ".webm", ".png", ".jpg", ".webp", ".svg")


def ortak_kaynak():
    """{"seviye": [dosya], "marka": [dosya]} — build.py ile ayni secim:
    brand/seviye/medya/* ve brand/medya/<aile>/* (duz adla)."""
    sec = lambda d: sorted(f for f in d.iterdir() if f.is_file() and f.suffix.lower() in MEDYA) if d.is_dir() else []
    seviye = sec(KOK / "brand" / "seviye" / "medya")
    marka_kok = KOK / "brand" / "medya"
    marka = []
    if marka_kok.is_dir():
        for aile in sorted(marka_kok.iterdir()):
            if aile.is_dir():
                marka += sec(aile)
    return {"seviye": seviye, "marka": marka}


def boyut(yol):
    return sum(f.stat().st_size for f in Path(yol).rglob("*") if f.is_file())


def main():
    for ad, sayfa in MODULLER:
        d = KOK / ad / "dist"
        for gerek in (d / sayfa, d / "sw.js", d / "img" / "brand"):
            if not gerek.exists():
                print("✕ eksik: %s — önce `python3 build.py` (%s klasöründe)" % (gerek, ad))
                return 1
    kaynak = ortak_kaynak()
    for o in ORTAK:
        if not kaynak[o]:
            print("✕ ortak görsel kaynağı boş: img/%s (brand/) — uygulama eksik çıkardı" % o)
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
        hedef = WEB / "ortak" / o
        hedef.mkdir(parents=True)
        for f in kaynak[o]:
            if (hedef / f.name).exists():
                print("✕ aynı adlı iki ortak görsel: %s" % f.name)
                return 1
            shutil.copy2(f, hedef / f.name)

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
