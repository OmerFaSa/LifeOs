#!/usr/bin/env python3
"""Telefon uygulamasinin PC'siz web guncellemesi: yayimlanacak paket.

   python3 uygulama/ios/web_paket.py <LifeOS.app> <cikti-klasoru> <surum>

Kullanici (2026-11-05): «her guncelleme yaptigimda PC baglamam lazim». Swift
degismedikce AltStore'a gerek yok: uygulama web kodunu kendisi indirir
(LifeOS/WebGuncelleme.swift). Bu betik, testlerden gecmis derlemenin Web
klasorunden sunlari uretir:

  web-surum.json   surum, uyum, her dosyanin yolu ve sha256'si
  w-<sha16>[.z]    dosyanin kendisi; ad icerigindir, ayni dosya yeniden yuklenmez
                   (.z: ham DEFLATE; NSData .zlib bunu acar)

temel.json (hazirla.py) uygulamanin icine girer: telefon yalniz uygulamadakinden
farkli dosyalari indirir. Sozlesme belgeler/UYGULAMA.md'de.
"""
import hashlib
import json
import os
import plistlib
import sys
import zlib
from pathlib import Path

SIKISAN = {".html", ".js", ".css", ".json", ".svg", ".txt"}
TEMEL = "temel.json"


def ozet(yol):
    h = hashlib.sha256()
    with open(yol, "rb") as f:
        for parca in iter(lambda: f.read(1024 * 1024), b""):
            h.update(parca)
    return h.hexdigest()


def dosyalar(web):
    web = Path(web)
    return sorted((f.relative_to(web).as_posix(), f) for f in web.rglob("*")
                  if f.is_file() and f.name != TEMEL)


def temel_yaz(web):
    """Uygulamaya giren dosyalarin ozeti: telefon farki buna gore bulur."""
    harita = {yol: ozet(f) for yol, f in dosyalar(web)}
    with open(Path(web) / TEMEL, "w", encoding="utf-8") as f:
        json.dump(harita, f, separators=(",", ":"), sort_keys=True)
    return harita


def _ham_deflate(veri):
    c = zlib.compressobj(9, zlib.DEFLATED, -15)
    return c.compress(veri) + c.flush()


def paket(web, cikti, surum, uyum):
    os.makedirs(cikti, exist_ok=True)
    liste = []
    for yol, f in dosyalar(web):
        s = ozet(f)
        z = f.suffix.lower() in SIKISAN
        hedef = Path(cikti) / ("w-" + s[:16] + (".z" if z else ""))
        veri = f.read_bytes()
        hedef.write_bytes(_ham_deflate(veri) if z else veri)
        liste.append({"yol": yol, "sha256": s, "boyut": len(veri), "z": z})
    m = {"bicim": 1, "surum": int(surum), "uyum": int(uyum), "dosyalar": liste}
    with open(Path(cikti) / "web-surum.json", "w", encoding="utf-8") as f:
        json.dump(m, f, separators=(",", ":"))
    return m


def main(argv):
    if len(argv) != 3:
        print(__doc__)
        return 2
    app, cikti, surum = argv
    with open(os.path.join(app, "Info.plist"), "rb") as f:
        uyum = plistlib.load(f)["LifeOSWebUyum"]
    m = paket(os.path.join(app, "Web"), cikti, surum, uyum)
    toplam = sum(os.path.getsize(os.path.join(cikti, a)) for a in os.listdir(cikti))
    print("Web paketi: sürüm %d · uyum %d · %d dosya · %.1f MB" % (m["surum"], m["uyum"], len(m["dosyalar"]), toplam / 1e6))
    return 0


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    raise SystemExit(main(sys.argv[1:]))
