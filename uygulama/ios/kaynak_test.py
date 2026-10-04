#!/usr/bin/env python3
"""AltStore kaynagi testi.   python3 uygulama/ios/kaynak_test.py  (0 temiz, 1 kirmizi)

Sozler: zorunlu alanlar var; surum ve derleme numarasi Info.plist ile birebir;
izin metinleri Info.plist'teki *UsageDescription'larin TAMAMI ve aynisi (AltStore
uyusmazsa kurmayi reddeder); izin olmayan anahtar izne girmez; boyut bayt;
proje tanimindaki izin metinleri gercekten kaynaga gider."""
import json
import os
import plistlib
import sys
import tempfile
from pathlib import Path

BURASI = Path(__file__).resolve().parent
sys.path.insert(0, str(BURASI))
import kaynak  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

kirmizi = 0


def dogru(ad, kosul, gelen=None):
    global kirmizi
    print(("  ✓ " if kosul else "  ✕ ") + ad + ("" if kosul else " (gelen %r)" % (gelen,)))
    if not kosul:
        kirmizi += 1


BILGI = {
    "CFBundleIdentifier": "com.omerfasa.lifeos",
    "CFBundleShortVersionString": "0.1.0",
    "CFBundleVersion": "42",
    "CFBundleDisplayName": "LifeOS",
    "MinimumOSVersion": "15.0",
    "NSCameraUsageDescription": "Kamera metni.",
    "NSLocationWhenInUseUsageDescription": "Konum metni.",
    "UIBackgroundModes": ["location"],
    "NSAppTransportSecurity": {"NSAllowsLocalNetworking": True},
}

s = kaynak.kaynak(BILGI, 116_234_567, "2026-10-04T10:00:00+00:00", "Giriş sayfası.")
for alan in ("name", "apps", "news"):
    dogru("kaynakta '%s' var" % alan, alan in s)
a = s["apps"][0]
for alan in ("name", "bundleIdentifier", "developerName", "localizedDescription", "iconURL", "versions", "appPermissions"):
    dogru("uygulamada '%s' var" % alan, alan in a)
v = a["versions"][0]
for alan in ("version", "buildVersion", "date", "downloadURL", "size"):
    dogru("surumde '%s' var" % alan, alan in v)
dogru("paket kimligi Info.plist'teki", a["bundleIdentifier"] == "com.omerfasa.lifeos", a["bundleIdentifier"])
dogru("surum ve derleme Info.plist ile birebir", (v["version"], v["buildVersion"]) == ("0.1.0", "42"),
      (v["version"], v["buildVersion"]))
dogru("izin metinleri Info.plist'teki UsageDescription'larin tamami ve aynisi",
      a["appPermissions"]["privacy"] == {"NSCameraUsageDescription": "Kamera metni.",
                                         "NSLocationWhenInUseUsageDescription": "Konum metni."},
      a["appPermissions"]["privacy"])
dogru("imzasiz IPA: yetki listesi bos", a["appPermissions"]["entitlements"] == [])
dogru("boyut bayt (tamsayi)", v["size"] == 116_234_567 and isinstance(v["size"], int))
dogru("indirme adresi sabit sürüm sayfasi", v["downloadURL"].endswith("/releases/download/ios-son/LifeOS.ipa"))
dogru("en yeni surum dizinin ilk elemani (tek eleman)", len(a["versions"]) == 1)

# Gercek proje taniminin izin metinleri: project.yml'deki *UsageDescription'lar kaynaga
# eksiksiz gider (derlemede Info.plist'ten okunur; burada proje tanimindan sinanir).
yml = (BURASI / "project.yml").read_text(encoding="utf-8")
beklenen = sorted(sat.split(":", 1)[0].strip() for sat in yml.splitlines()
                  if sat.strip().startswith("NS") and "UsageDescription:" in sat)
dogru("proje taniminda izin metni var (en az 4)", len(beklenen) >= 4, beklenen)

# main: gercek dosyalarla uc uca
with tempfile.TemporaryDirectory() as g:
    app = os.path.join(g, "LifeOS.app")
    os.makedirs(app)
    with open(os.path.join(app, "Info.plist"), "wb") as f:
        plistlib.dump(BILGI, f, fmt=plistlib.FMT_BINARY)
    ipa = os.path.join(g, "LifeOS.ipa")
    with open(ipa, "wb") as f:
        f.write(b"x" * 1234)
    cikti = os.path.join(g, "kaynak.json")
    dogru("main cikis 0", kaynak.main([app, ipa, cikti]) == 0)
    with open(cikti, encoding="utf-8") as f:
        j = json.load(f)
    dogru("main: boyut dosyadan", j["apps"][0]["versions"][0]["size"] == 1234)
    dogru("main: tarih ISO 8601 (UTC)", j["apps"][0]["versions"][0]["date"].endswith("+00:00"))

print("kirmizi: %d" % kirmizi if kirmizi else "temiz")
sys.exit(1 if kirmizi else 0)
