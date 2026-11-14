#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""KABUK BASLANGIC PAKETI — tek depodaki eski kayitlari yeni kabugun bicimine cevirir (sadelesme Faz 1 P6 sonrasi).

   python tools/kabuk_baslangic.py            # %LOCALAPPDATA%/LifeOS/veri/lifeos.db -> .../veri/kabuk-baslangic.json
   python tools/kabuk_baslangic.py --depo <lifeos.db> --cikti <dosya.json>

   Ne yapar: tek depoyu KOPYADAN okur (canli dosya SQLite ile acilmaz), her canli kaydi rotasina gore motorlarin
   goc bagdastiricilarina verir (tools/kabuk_baslangic.js; yonlendirme tools/gercek_kosu.js ROTA) ve ciktiyi tek
   dosyaya yazar: { lifeos_kabuk_baslangic, kimlik, uretildi, say, notlar, kayitlar, kartlar, beden }.
   Kabuk bu dosyayi /api/kabuk/baslangic ile (yalniz bu bilgisayardan) gorur ve «Eski kayitlarimi getir» der.
   Tek depoya ve eski depolara yazmaz. Ekrana yalniz sayi basar; icerik dosyada, bu bilgisayarda kalir.
"""
import argparse
import collections
import hashlib
import json
import os
import shutil
import sqlite3
import subprocess
import sys
import tempfile

ARAC = os.path.dirname(os.path.abspath(__file__))
sys.dont_write_bytecode = True
sys.path.insert(0, ARAC)
import gercek_kosu  # noqa: E402  (rota: tek yerde)

JS = os.path.join(ARAC, "kabuk_baslangic.js")
PARTI = 500


def varsayilan():
    yerel = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
    veri = os.path.join(yerel, "LifeOS", "veri")
    return os.path.join(veri, "lifeos.db"), os.path.join(veri, "kabuk-baslangic.json")


def gruplar_oku(depo):
    """Depo dosyasini gecici klasore kopyalar, canli kayitlari (kaynak, rota, alan) basina gruplar."""
    g = tempfile.mkdtemp(prefix="lifeos-kabuk-baslangic-")
    try:
        kopya = os.path.join(g, "lifeos.db")
        shutil.copyfile(depo, kopya)
        for ek in ("-wal", "-shm"):
            if os.path.exists(depo + ek):
                shutil.copyfile(depo + ek, kopya + ek)
        c = sqlite3.connect(kopya)
        try:
            gr = collections.defaultdict(list)
            for tur, alan, yol, govde in c.execute("SELECT tur, alan, yol, govde FROM kayit WHERE silindi=0 ORDER BY alan, yol"):
                gr[(gercek_kosu.rota(alan, yol, tur), alan)].append({"yol": yol, "govde": json.loads(govde)})
        finally:
            c.close()
        return [{"rota": r, "alan": a, "kayitlar": k} for (r, a), k in sorted(gr.items())]
    finally:
        shutil.rmtree(g, ignore_errors=True)


def cevir(gruplar):
    """Node yardimcisina en cok PARTI kayitlik partiler verir; ciktilari kimlikle tekillestirerek birlestirir."""
    out = {"notlar": [], "kayitlar": [], "kartlar": [], "beden": {}, "say": {}, "disarida": {}}
    gor = {k: set() for k in ("notlar", "kayitlar", "kartlar")}
    parti, n = [], 0
    for g in gruplar + [None]:
        if g is not None:
            parti.append(g)
            n += len(g["kayitlar"])
        if parti and (g is None or n >= PARTI):
            p = subprocess.run(["node", JS], input=json.dumps(parti, ensure_ascii=False), capture_output=True, text=True, encoding="utf-8")
            if p.returncode != 0:   # yigin izi kayit icerigi tasiyabilir: yalniz cikis kodu
                raise RuntimeError("Node yardımcısı çöktü (çıkış %d)." % p.returncode)
            r = json.loads(p.stdout)
            for ad in gor:
                for o in r[ad]:
                    if o["id"] not in gor[ad]:
                        gor[ad].add(o["id"])
                        out[ad].append(o)
            for a, v in (r.get("beden") or {}).items():
                out["beden"].setdefault(a, v)
            for bag, s in r["say"].items():
                t = out["say"].setdefault(bag, {"girdi": 0, "cikti": 0, "ret": 0, "cokme": 0})
                for k in t:
                    t[k] += s.get(k, 0)
            for bag, k in r["disarida"].items():
                out["disarida"][bag] = out["disarida"].get(bag, 0) + k
            parti, n = [], 0
    return out


def paket(depo, zaman):
    r = cevir(gruplar_oku(depo))
    icerik = {k: r[k] for k in ("notlar", "kayitlar", "kartlar", "beden")}
    # kimlik icerikten: ayni depo ayni paketi verir, kabuk ayni paketi iki kez onermez
    kimlik = hashlib.sha256(json.dumps(icerik, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()[:16]
    return dict({"lifeos_kabuk_baslangic": 1, "kimlik": kimlik, "uretildi": zaman,
                 "say": {k: len(icerik[k]) for k in ("notlar", "kayitlar", "kartlar")}}, **icerik), r


def main(argv=None):
    depo, cikti = varsayilan()
    ap = argparse.ArgumentParser(description="Tek depodaki eski kayıtları yeni kabuğun başlangıç paketine çevirir.")
    ap.add_argument("--depo", default=depo)
    ap.add_argument("--cikti", default=cikti)
    ap.add_argument("--zaman", type=int, default=None, help="üretim zamanı (ms); verilmezse şimdi")
    a = ap.parse_args(argv)
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    if not os.path.isfile(a.depo):
        print("Tek depo yok: " + a.depo + " (önce göç: python sistem/goc.py --gercek)")
        return 1
    import time
    p, r = paket(a.depo, a.zaman if a.zaman is not None else int(time.time() * 1000))
    os.makedirs(os.path.dirname(os.path.abspath(a.cikti)), exist_ok=True)
    yarim = a.cikti + ".yaziliyor"
    with open(yarim, "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(p, ensure_ascii=False, sort_keys=True) + "\n")
    os.replace(yarim, a.cikti)
    print("Kabuk başlangıç paketi `%s`: %d not, %d kayıt, %d kart, %d beden alanı → %s" % (
        p["kimlik"], p["say"]["notlar"], p["say"]["kayitlar"], p["say"]["kartlar"], len(p["beden"]), a.cikti))
    print("| Bağdaştırıcı | Girdi | Pakete giren | Ret | Çöktü | Kabuk deposu dışında |")
    print("|---|---:|---:|---:|---:|---:|")
    for bag in sorted(r["say"]):
        s = r["say"][bag]
        print("| %s | %d | %d | %d | %d | %d |" % (bag, s["girdi"], s["cikti"], s["ret"], s["cokme"], r["disarida"].get(bag, 0)))
    return 1 if any(s["cokme"] for s in r["say"].values()) else 0


if __name__ == "__main__":
    raise SystemExit(main())
