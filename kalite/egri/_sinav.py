"""Anlama ve Kontrol vekillerinin ortak kaynağı: King sınavının (tools/king_sinav.js) son koşusu.

  python kalite/egri/_sinav.py   sınavı kendi test portlarında koşar, kalite/veri/sinav-sonuc.json yazar

Sınav modeli ve HKM'yi çağırmaz (Merkez çağrısı yakalanır), araç seçer ama çalıştırmaz, her modül boş
tarayıcı verisiyle açılır. Alt çizgili dosya eğri değildir; olcum.py onu eğri olarak yüklemez.
"""
import datetime
import json
import re
import subprocess
import sys
from pathlib import Path

ONBELLEK = "kalite/veri/sinav-sonuc.json"
PORT = 4571  # AYS 4571, SPİ 4581, ESP 4591: sahibinin portları (4173-4200) ve 4391 dışında
KOMUT = f"python kalite/egri/_sinav.py (node tools/king_sinav.js --port={PORT} --json; Playwright, model ve HKM yok)"
NIYETLER = ("sohbet", "kayit", "ogren", "arastir", "yonet")

# Sınav kararından niyete. Bu eşleme benimdir, sahibinin etiketi değildir; ilk eşleşen kazanır.
# None: King geri soruyor, karar yok ya da belirsiz. «arastir» kararı sınavda yok.
ESLEME = [
    (r"^merkez$|^tur:(olumsuz-gun|yorgun|nefes|tanisma-kapali)$", "sohbet"),
    (r"^veri$|^arac:(kayit_gir|.*_ekle|.*_yaz|.*_bitir|spi_barkod_ogun|ays_card_from_error)$", "kayit"),
    (r"^arac:(soru_sor|.*_tekrarlarim|.*_yanlis_teshis)$|^tur:ders$", "ogren"),
    (r"^tur:(sor|ara-sor|hatirlat-sor|hafiza|yok|hata)$", None),
    (r"^(git:|ayar$|arac:|tur:)", "yonet"),
]


def niyet(karar):
    for desen, n in ESLEME:
        if re.search(desen, karar):
            return n
    return None


def satirlar(kok):
    """Önbellekteki koşu, beklenen kararlarla (m, c) üzerinden birleşik. Önbellek yoksa None."""
    kok = Path(kok)
    try:
        onb = json.loads((kok / ONBELLEK).read_text(encoding="utf-8"))
        cumle = json.loads((kok / "tools/king_sinav.json").read_text(encoding="utf-8"))["cumleler"]
    except (OSError, ValueError, KeyError):
        return None
    beklenen = {(s["m"], s["c"]): s["b"] for s in cumle}
    birlesik = [dict(r, b=beklenen[(r["m"], r["c"])]) for r in onb["satirlar"] if (r["m"], r["c"]) in beklenen]
    return {"tarih": onb["tarih"], "kod": onb["kod"], "satirlar": birlesik,
            "sinavda_olmayan": len(onb["satirlar"]) - len(birlesik), "sinav_cumle": len(cumle)}


def kos(kok):
    r = subprocess.run(["node", "tools/king_sinav.js", f"--port={PORT}", "--json"], cwd=kok, capture_output=True)
    if r.returncode != 0:
        sys.stderr.write(r.stderr.decode("utf-8", "replace"))
        return r.returncode or 2
    sonuc = json.loads(r.stdout.decode("utf-8"))
    cumle = json.loads((kok / "tools/king_sinav.json").read_text(encoding="utf-8"))["cumleler"]
    sira = [s for m in ("ays", "spi", "esp") for s in cumle if s["m"] == m]  # king_sinav.js modül sırası
    if len(sira) != len(sonuc) or any(a["c"] != b["c"] for a, b in zip(sonuc, sira)):
        sys.stderr.write("sınav çıktısı cümle listesiyle hizalanmadı; önbellek yazılmadı\n")
        return 1
    kod = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=kok, capture_output=True, text=True).stdout.strip()
    yollar = ["--", "brand", "AYS", "SPI", "ESP", "tools/king_sinav.json"]  # sınavın koştuğu kod; satır sonu farkı sayılmaz
    kirli = "".join(subprocess.run(["git", *k, *yollar], cwd=kok, capture_output=True, text=True).stdout
                    for k in (["diff", "--name-only", "HEAD"], ["ls-files", "-o", "--exclude-standard"])).strip()
    bas = {"tarih": datetime.date.today().isoformat(), "kod": kod + ("+yerel değişiklik" if kirli else ""), "port": PORT}
    satir = [json.dumps({"m": s["m"], "c": x["c"], "karar": x["karar"], "ok": x["ok"]}, ensure_ascii=False)
             for s, x in zip(sira, sonuc)]
    (kok / ONBELLEK).parent.mkdir(parents=True, exist_ok=True)
    # satır başına bir cümle: iki koşunun farkı git diff'te karar karar okunur
    (kok / ONBELLEK).write_text(json.dumps(bas, ensure_ascii=False)[:-1] + ', "satirlar": [\n' + ",\n".join(satir) + "\n]}\n",
                                encoding="utf-8")
    print(f"yazıldı: {ONBELLEK} ({sum(x['ok'] for x in sonuc)}/{len(sonuc)} sınav kararı doğru)")
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(kos(Path(__file__).resolve().parents[2]))
