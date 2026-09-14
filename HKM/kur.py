#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""HKM kurulumu — tek komut.

    python3 kur.py              # yapilandirma + sema + saglik ozeti
    python3 kur.py --baslat     # kurup daemon'u da baslatir
    python3 kur.py --durum      # yalniz durumu yazar, hicbir sey degistirmez

   Uc kural:

   1. VAR OLANI EZMEZ. config.json duruyorsa jetonu, esikleri ve kanal
      ayarlari OLDUGU GIBI kalir; yalnizca eksik alanlar tamamlanir.
      Kurulum betiginin en pahali hatasi, calisan bir kurulumu sessizce
      sifirlamaktir.

   2. SIR EKRANDA GORUNMEZ. Uretilen jeton konsola YAZILMAZ; cihazlar
      esleme penceresiyle baglanir (bkz. daemon.py → /api/pair).
      Ekrana basilan bir jeton, terminal gecmisinde ve omuz ustunde kalir.

   3. HER SATIR OLCUMDUR. Ciktidaki her «✓» gercekten denenmis bir seyi
      soyler: dosya yazildi mi, sema kuruldu mu, daemon cevap veriyor mu.
      Denenmeden basilan bir onay isareti, yalan soyleyen bir arayuzdur.
"""

import json
import os
import secrets
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)

CONFIG = os.path.join(ROOT, "config.json")
ORNEK = os.path.join(ROOT, "config.example.json")

from core import channels, db  # noqa: E402

ISARET = {"ok": "✓", "yok": "•", "hata": "✕"}


def satir(durum, metin, not_=""):
    print("  %s %s%s" % (ISARET.get(durum, "•"), metin,
                         ("  — " + not_) if not_ else ""))


def oku(yol):
    if not os.path.exists(yol):
        return {}
    try:
        with open(yol, encoding="utf-8") as f:
            return json.load(f)
    except ValueError as e:
        print("HATA: %s okunamadi (%s). Elle duzeltilmeli; bu betik bozuk bir "
              "yapilandirmayi ezmez." % (yol, e))
        raise SystemExit(1)


def varsayilanlar():
    taban = {"host": "127.0.0.1", "port": 4200, "local_token": ""}
    ornek = oku(ORNEK)
    for k, v in ornek.items():
        taban.setdefault(k, v)
    taban.setdefault("channels", {})
    for ad in ("whatsapp", "telegram"):
        taban["channels"].setdefault(ad, dict(channels.DEFAULTS[ad]))
    return taban


def birlestir(taban, mevcut):
    """Mevcut degerler KAZANIR. Eksik olanlar tabandan tamamlanir."""
    out = dict(taban)
    for k, v in (mevcut or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = birlestir(out[k], v)
        else:
            out[k] = v
    return out


def daemon_durumu(cfg):
    url = "http://%s:%s/api/health" % (cfg.get("host", "127.0.0.1"),
                                       cfg.get("port", 4200))
    try:
        with urllib.request.urlopen(url, timeout=2) as r:
            return r.status == 200
    except Exception:
        return False


def kur(yaz=True, yol_goster=True):
    print("\nHKM kurulumu\n")
    mevcut = oku(CONFIG)
    cfg = birlestir(varsayilanlar(), mevcut)

    yeni_jeton = not cfg.get("local_token") or \
        cfg["local_token"] == "buraya-uzun-rastgele-bir-dize-koy"
    if yeni_jeton:
        cfg["local_token"] = secrets.token_urlsafe(32)

    if yaz:
        with open(CONFIG, "w", encoding="utf-8") as f:
            f.write(json.dumps(cfg, indent=2, ensure_ascii=False) + "\n")
        satir("ok", "Yapılandırma hazır",
              "yeni jeton üretildi" if yeni_jeton else "var olan ayarlar korundu")
    else:
        satir("ok" if mevcut else "yok", "Yapılandırma",
              "var" if mevcut else "henüz yok")

    # Sema: gercekten kurulup kurulmadigi TABLO SAYARAK dogrulanir.
    yol = cfg.get("db_path") or db.DB_PATH
    try:
        con = db.connect(yol)
        tablolar = [r[0] for r in con.execute(
            "SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
        con.close()
        beklenen = {"raw_events", "audits", "decisions", "decision_sources",
                    "conversations"}
        eksik = beklenen - set(tablolar)
        if eksik:
            satir("hata", "Veri ambarı", "eksik tablo: " + ", ".join(sorted(eksik)))
        else:
            satir("ok", "Veri ambarı hazır", "%d tablo · %s" % (len(tablolar), yol))
    except Exception as e:
        satir("hata", "Veri ambarı kurulamadı", str(e))

    for ad in ("whatsapp", "telegram"):
        acik = channels.enabled(cfg, ad)
        izin = len(channels.settings(cfg, ad).get("allow_from") or [])
        satir("ok" if acik else "yok", ad.capitalize(),
              ("açık · izin listesinde %d kişi" % izin) if acik
              else "kapalı (varsayılan)")

    ayakta = daemon_durumu(cfg)
    satir("ok" if ayakta else "yok", "Daemon",
          "ayakta · http://%s:%s" % (cfg["host"], cfg["port"]) if ayakta
          else "çalışmıyor")

    if yol_goster:
        print("""
  Tek tık:  baslat.py  (ya da BASLAT.command / BASLAT.bat)
  — kurar, daemon'u başlatır, yüzü açar. Jeton elle yazılmaz.

  Modül bağlantısı da jetonla değil EŞLEME ile yapılır: yüzdeki
  «Cihazları bağla» düğmesi kısa bir pencere açar, sonra
  AYS/SPİ/ESP → Ayarlar → HKM işareti → «Bağlan».
""")
    return cfg


def main():
    if "--durum" in sys.argv:
        kur(yaz=False)
        return 0
    cfg = kur(yaz=True)
    if "--baslat" in sys.argv:
        os.execv(sys.executable, [sys.executable,
                                  os.path.join(ROOT, "daemon.py")])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
