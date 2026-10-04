#!/usr/bin/env python3
"""AltStore kaynagi (source) uretir: telefonda tek dokunusla guncelleme.

   python3 uygulama/ios/kaynak.py <LifeOS.app> <LifeOS.ipa> <cikti.json>

Kullanici (2026-10-04): «surekli boyle yeniden mi indirecegiz». AltStore'a
bu dosyanin adresi BIR KEZ eklenir; yeni derleme cikinca AltStore
«Guncelle» der.

Kurallar (faq.altstore.io/developers/make-a-source):
  - version ve buildVersion Info.plist ile BIREBIR ayni olmali.
  - appPermissions.privacy Info.plist'teki *UsageDescription'larla birebir
    ayni olmali; uyusmazsa AltStore kurmayi REDDEDER. Bu yuzden elle
    yazilmaz, derlenmis uygulamanin kendi Info.plist'inden okunur.
  - Imzasiz IPA'da yetki (entitlement) yoktur; liste bostur.
  - Surum dizisinin SIRASI onemlidir: ilk eleman en yeni surumdur.
  - Gorunen surum de her derlemede degisir (0.1.<derleme>): ilk kaynakta hep
    «0.1.0» idi, yalniz buildVersion degisiyordu ve AltStore telefonda «No
    Updates» dedi (2026-10-04) — gorunen surume bakiyor.
"""
import datetime
import json
import os
import plistlib
import sys

KAYNAK_ADRESI = "https://github.com/OmerFaSa/LifeOs/releases/download/ios-son/altstore-kaynak.json"
IPA_ADRESI = "https://github.com/OmerFaSa/LifeOs/releases/download/ios-son/LifeOS.ipa"
SIMGE = "https://raw.githubusercontent.com/OmerFaSa/LifeOs/main/brand/life/logo.png"


def kaynak(bilgi, ipa_boyutu, tarih, aciklama="", entitlements=()):
    """bilgi: Info.plist sozlugu. Doner: AltStore kaynak sozlugu."""
    gizlilik = {k: v for k, v in sorted(bilgi.items()) if k.endswith("UsageDescription")}
    surum = {
        "version": bilgi["CFBundleShortVersionString"],
        "buildVersion": str(bilgi["CFBundleVersion"]),
        "date": tarih,
        "localizedDescription": aciklama or "Yeni derleme.",
        "downloadURL": IPA_ADRESI,
        "size": int(ipa_boyutu),
        "minOSVersion": bilgi.get("MinimumOSVersion", "15.0"),
    }
    return {
        "name": "LifeOS",
        "identifier": "com.omerfasa.lifeos.kaynak",
        "subtitle": "AYS · SPİ · ESP — telefon uygulaması",
        "website": "https://github.com/OmerFaSa/LifeOs",
        "iconURL": SIMGE,
        "apps": [{
            "name": bilgi.get("CFBundleDisplayName", "LifeOS"),
            "bundleIdentifier": bilgi["CFBundleIdentifier"],
            "developerName": "OmerFaSa",
            "subtitle": "Sınav, sağlık, gelişim — veri telefonda kalır.",
            "localizedDescription": ("Üç modül tek uygulamada. SPİ'de ekran kapalıyken de rota "
                                     "kaydı. Veri yalnız bu telefonda kalır."),
            "iconURL": SIMGE,
            "tintColor": "#3D3F8F",
            "versions": [surum],
            "appPermissions": {"entitlements": sorted(entitlements), "privacy": gizlilik},
        }],
        "news": [],
    }


def main(argv):
    if len(argv) != 3:
        print(__doc__)
        return 2
    app, ipa, cikti = argv
    with open(os.path.join(app, "Info.plist"), "rb") as f:
        bilgi = plistlib.load(f)
    tarih = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat()
    aciklama = os.environ.get("KAYNAK_ACIKLAMA", "")
    s = kaynak(bilgi, os.path.getsize(ipa), tarih, aciklama)
    with open(cikti, "w", encoding="utf-8") as f:
        json.dump(s, f, ensure_ascii=False, indent=2)
    v = s["apps"][0]["versions"][0]
    print("AltStore kaynağı: %s (%s) · %d bayt · %d izin metni"
          % (v["version"], v["buildVersion"], v["size"], len(s["apps"][0]["appPermissions"]["privacy"])))
    return 0


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    raise SystemExit(main(sys.argv[1:]))
