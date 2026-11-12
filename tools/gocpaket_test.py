#!/usr/bin/env python3
"""Goc paketi PC tarafi testi (Faz 1 P2): python3 tools/gocpaket_test.py   (cikis 0 temiz, 1 kirmizi)

Ucdan uca: tools/gocpaket.test.js'in (brand/ortak/gocpaket.js) urettigi paketler goc.paket_kaydet'ten
ve goc.goc okuyucusundan gecer; sinirlar ve POST /api/hesap/goc-paket ucu (hesap.isle) sinanir.
Gecici klasorde; kullanicinin hicbir dosyasina dokunmaz."""
import base64
import hashlib
import io
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KOK / "sistem"))
sys.dont_write_bytecode = True

import goc  # noqa: E402

kirmizi = 0


def dogru(ad, kosul, ek=""):
    global kirmizi
    print(("  ✓ " if kosul else "  ✕ ") + ad + ("" if kosul else "  %r" % (ek,)))
    kirmizi += 0 if kosul else 1


try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


def kaydet(govde, klasor, uzunluk=None):
    b = govde if isinstance(govde, bytes) else json.dumps(govde, ensure_ascii=False).encode("utf-8")
    try:
        return goc.paket_kaydet(io.BytesIO(b), len(b) if uzunluk is None else uzunluk, klasor, 1_800_000_000)
    except ValueError as e:
        return e.args[0]


def dosyalar(klasor):
    return sorted(os.listdir(klasor)) if os.path.isdir(klasor) else []


t = tempfile.mkdtemp(prefix="lifeos-gocpaket-test-")
try:
    uretilen = os.path.join(t, "uretilen")
    r = subprocess.run(["node", str(KOK / "tools" / "gocpaket.test.js"), uretilen], capture_output=True, text=True,
                       encoding="utf-8")
    dogru("cihaz tarafı testi (gocpaket.test.js) temiz", r.returncode == 0, r.stdout[-600:] + r.stderr[-600:])

    paket = os.path.join(t, "goc", "paket")
    makbuz = [kaydet(open(os.path.join(uretilen, a), "rb").read(), paket) for a in dosyalar(uretilen)]
    dogru("cihazın paketleri PC'de kabul edilir", len(makbuz) == 2 and all(isinstance(m, dict) for m in makbuz), makbuz)
    dogru("makbuz sayıları", makbuz[0]["profil"] == 2 and makbuz[0]["medya"] == 1 and makbuz[1]["medya"] == 1
          and makbuz[0]["bekleyen"] == {"spi/ben": 2}, makbuz)
    dogru("ad: kaynak-cihaz-zaman-rastgele", all(m["ad"].startswith("spi-cihazTEL01-") and m["ad"].endswith(".json")
                                                for m in makbuz))
    rapor = goc.goc(os.path.join(t, "hedef"), paket=paket)
    dogru("göç okuyucusu paketleri okur, denge tutar", rapor["denge"] and rapor["gidis_donus"] and not rapor["hata"],
          (rapor["hata"], rapor["sayim"].get("paket")))
    dogru("iki medya taşındı", rapor["medya"]["dosya"] == 2, rapor["medya"])
    dogru("bekleyen göç raporunda", rapor["bekleyen_toplam"] == 2, rapor["bekleyen_toplam"])

    temel = {"lifeos_goc": 1, "kaynak": "esp", "cihaz": "cihazPC0001", "profiller": {}, "anahtarlar": {"a": 1}}
    k2 = os.path.join(t, "k2")
    a1, a2 = kaydet(temel, k2), kaydet(temel, k2)
    dogru("aynı paket iki kez: iki ayrı dosya, üstüne yazılmaz", a1["ad"] != a2["ad"] and len(dosyalar(k2)) == 2)
    k3 = os.path.join(t, "k3")
    dogru("çok büyük paket 413", kaydet(temel, k3, goc.PAKET_EN_BUYUK + 1)[0] == 413 and not dosyalar(k3))
    dogru("yarım gelen paket 400, iz kalmaz", kaydet(temel, k3, 10_000)[0] == 400 and not dosyalar(k3))
    dogru("sır adlı anahtar 400, diske yazılmaz", kaydet(dict(temel, anahtarlar={"x.llm.keys": "G"}), k3)[0] == 400
          and not dosyalar(k3))
    dogru("tanınmayan biçim 400", kaydet(dict(temel, lifeos_goc=2), k3)[0] == 400 and kaydet(b"[1]", k3)[0] == 400)
    dogru("geçersiz cihaz kimliği 400 (dosya adına girmez)", kaydet(dict(temel, cihaz="../x"), k3)[0] == 400)
    veri = b"abc"
    bozuk = {"db": "spi-foto", "anahtar": "f", "boyut": 3, "sha256": hashlib.sha256(b"xyz").hexdigest(),
             "veri": base64.b64encode(veri).decode()}
    dogru("bozuk medya 400", kaydet(dict(temel, medya=[bozuk]), k3)[0] == 400 and not dosyalar(k3))

    # Uc: hesap.isle uzerinden (gecici hesap klasoru).
    os.environ["LIFEOS_HESAP_KLASOR"] = os.path.join(t, "ev", "hesap")
    import hesap  # noqa: E402
    hesap.depo_kur(hesap.Depo(os.path.join(t, "ev", "hesap", "hesap.db")))

    class Istek:
        def __init__(self, govde, baslik, ip="127.0.0.1"):
            self.path, self.command, self.client_address = "/api/hesap/goc-paket", "POST", (ip, 5)
            self.headers = dict({"Content-Length": str(len(govde))}, **baslik)
            self.rfile, self.wfile, self.kod = io.BytesIO(govde), io.BytesIO(), None

        def send_response(self, kod):
            self.kod = kod

        def send_header(self, *a):
            pass

        def end_headers(self):
            pass

    def uc(govde, baslik, ip="127.0.0.1"):
        h = Istek(json.dumps(govde).encode(), baslik, ip)
        hesap.isle(h)
        return h.kod, json.loads(h.wfile.getvalue() or b"{}")

    dogru("uç: X-LifeOS: goc olmadan 403", uc(temel, {})[0] == 403)
    dogru("uç: başka cihazdan oturumsuz 401", uc(temel, {"X-LifeOS": "goc"}, "192.168.1.5")[0] == 401)
    kod, v = uc(temel, {"X-LifeOS": "goc"})
    dogru("uç: bu bilgisayardan 200, paket hesap klasörünün yanında",
          kod == 200 and os.path.exists(os.path.join(t, "ev", "goc", "paket", v.get("ad", "-"))), (kod, v))
    dogru("uç: sır anahtarı cümleyle reddedilir", uc(dict(temel, anahtarlar={"jeton": 1}), {"X-LifeOS": "goc"})[0] == 400)
finally:
    shutil.rmtree(t, ignore_errors=True)

print("\nGöç paketi (PC): %s" % ("temiz" if not kirmizi else "%d kırmızı" % kirmizi))
sys.exit(1 if kirmizi else 0)
