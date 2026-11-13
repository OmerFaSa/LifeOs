"""Sistem · Optimizasyon (plan §6): açılış süresi, kare süresi, kod hacmi.

Değer: her uygulamanın kullanıcıya giden kodunun baytı (statik, her koşuda ölçülür).
Açılış süresi tarayıcı ister; olcum.py tarayıcı açmaz, son ölçümü kalite/veri/acilis.json'dan okur:

  python kalite/egri/optimizasyon.py --acilis   üç modülü tools/olcum_modul.js ile ölçer (≈90 sn)
"""
import datetime
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

AD = "Sistem · Optimizasyon"
TANIM = "açılış süresi, kare süresi, kod hacmi"
ACILIS = "kalite/veri/acilis.json"
MODULLER = ("AYS", "SPI", "ESP")
PORT = 4571  # AYS 4571, SPİ 4572, ESP 4573 (sırayla): sahibinin portları (4173-4200) ve 4391 dışında
ACILIS_KOMUT = f"python kalite/egri/optimizasyon.py --acilis (node tools/olcum_modul.js <modül> --port {PORT}.. --tekrar 3)"


def dagitilan(kok):
    """Uygulama başına kullanıcıya giden kod dosyaları (yazı tipi ve görsel hariç).
    Modül: <M>/dist/ üst düzey .html/.js/.css. Kabuk: kabuk/index.html + bağladığı .js/.css (motor/ dahil)."""
    kok = Path(kok)
    app = {m: sorted(p for p in (kok / m / "dist").glob("*") if p.suffix in (".html", ".js", ".css")) for m in MODULLER}
    giris = kok / "kabuk/index.html"
    if giris.is_file():
        # shortcut: yalnız index.html'deki src/href sayılır; kabuk.js çalışırken bir betik yüklerse görünmez.
        bag = re.findall(r'(?:src|href)="([^"#?:]+\.(?:js|css))"', giris.read_text(encoding="utf-8"))
        app["kabuk"] = [giris] + [(giris.parent / b).resolve() for b in bag]
    return {a: [p for p in l if p.is_file()] for a, l in app.items() if l}


def olc(kok):
    kok = Path(kok).resolve()
    app, motor = {}, {"dosya": 0, "bayt": 0, "satir": 0}
    for a, dosyalar in dagitilan(kok).items():
        t = {"dosya": 0, "bayt": 0, "satir": 0}
        for p in dosyalar:
            veri = p.read_bytes()
            for h in (t, motor) if p.parent == kok / "motor" else (t,):
                h["dosya"] += 1
                h["bayt"] += len(veri)
                h["satir"] += veri.count(b"\n")
        app[a] = t
    ayrinti = {"uygulama": app, "motor_kabukta": motor, "kare_suresi": {"etiket": "veri yok",
               "gereken": "kaydırma/geçiş sırasında kare süresi izi (CDP); tools/akicilik.js süre değil stil hesabı sayar"}}
    try:
        a = json.loads((kok / ACILIS).read_text(encoding="utf-8"))
        ayrinti["acilis"] = dict(a, etiket="ölçüldü")
    except (OSError, ValueError):
        ayrinti["acilis"] = {"etiket": "veri yok", "komut": ACILIS_KOMUT}
    toplam = sum(t["bayt"] for t in app.values())
    return {"deger": toplam or None, "birim": "bayt (dağıtılan kod)", "etiket": "ölçüldü" if toplam else "veri yok",
            "durum": "ölçüldü" if toplam else "ölçülmedi", "ayrinti": ayrinti,
            "komut": f"python kalite/olcum.py (kod hacmi); açılış: {ACILIS_KOMUT}"}


def acilis_olc(kok):
    sonuc = {}
    with tempfile.TemporaryDirectory() as d:
        for i, m in enumerate(MODULLER):
            yol = Path(d) / f"{m}.json"
            r = subprocess.run(["node", "tools/olcum_modul.js", m, "--port", str(PORT + i), "--tekrar", "3",
                                "--json", str(yol)], cwd=kok, capture_output=True)
            if r.returncode != 0 or not yol.is_file():
                sys.stderr.write(f"{m}: ölçülemedi (çıkış {r.returncode})\n" + r.stderr.decode("utf-8", "replace"))
                return r.returncode or 1
            sonuc[m] = json.loads(yol.read_text(encoding="utf-8"))["acilis"]
    kod = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=kok, capture_output=True, text=True).stdout.strip()
    veri = {"tarih": datetime.date.today().isoformat(), "kod": kod, "moduller": sonuc,
            "yontem": "tools/olcum_modul.js: <modül>/src http.server ile, başsız Chromium, her tekrar yeni bağlam "
                      "(boş tarayıcı verisi); cizimMs = sayfaya gitmeden .site görünene kadar; 3 tekrarın ortancası",
            "kabuk": "veri yok: olcum_modul.js yalnız AYS/SPI/ESP ölçer"}
    (kok / ACILIS).parent.mkdir(parents=True, exist_ok=True)
    (kok / ACILIS).write_text(json.dumps(veri, ensure_ascii=False, indent=1, sort_keys=True) + "\n", encoding="utf-8")
    print(f"yazıldı: {ACILIS} " + ", ".join(f"{m} {v['cizimMs']} ms" for m, v in sonuc.items()))
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    if "--acilis" not in sys.argv:
        sys.exit(__doc__)
    sys.exit(acilis_olc(Path(__file__).resolve().parents[2]))
