# -*- coding: utf-8 -*-
"""030 kabul testi: tools/hkm_olcum.py — test HKM'si acar, baslangic ve GET uclarini olcer, kapatir.
Kosu: python tools/hkm_olcum_kabul_test.py"""
import json
import os
import socket
import subprocess
import sys
import tempfile

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARAC = os.path.join(KOK, "tools", "hkm_olcum.py")
KAPI = 4391


def kapi_acik(k):
    with socket.socket() as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", k)) == 0


def main():
    assert os.path.isfile(ARAC), "tools/hkm_olcum.py yok"
    d = tempfile.mkdtemp(prefix="hkm-olcum-kabul-")
    out = os.path.join(d, "olcum.json")
    r = subprocess.run([sys.executable, ARAC, "--port", str(KAPI), "--tekrar", "2", "--json", out],
                       capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=240,
                       env=dict(os.environ, PYTHONIOENCODING="utf-8"))
    assert r.returncode == 0, "cikis kodu %s\n%s\n%s" % (r.returncode, r.stdout[-800:], r.stderr[-800:])
    v = json.load(open(out, encoding="utf-8"))
    assert isinstance(v.get("baslangic_sn"), (int, float)) and 0 < v["baslangic_sn"] < 60, v.get("baslangic_sn")
    uc = v.get("uc") or {}
    assert len(uc) >= 20, "en az 20 GET ucu olculmeli, %d" % len(uc)
    assert uc.get("/api/health", {}).get("kod") == 200, uc.get("/api/health")
    for yol, x in uc.items():
        assert yol.startswith("/api/") and "<" not in yol and "{" not in yol, yol
        assert isinstance(x.get("ms"), (int, float)) and x["ms"] >= 0, (yol, x)
        assert isinstance(x.get("ilk_ms"), (int, float)), (yol, x)
        assert isinstance(x.get("kod"), int), (yol, x)
    besyuz = [y for y, x in uc.items() if x["kod"] >= 500]
    assert not besyuz, "500 donen uc: %s" % besyuz
    assert v.get("yavas") and v["yavas"][0] in uc, "yavas: en yavastan hizliya uc adlari"
    assert [uc[y]["ms"] for y in v["yavas"]] == sorted((uc[y]["ms"] for y in v["yavas"]), reverse=True)
    assert "/api/health" in r.stdout and "baslangic" in r.stdout, r.stdout[-500:]
    assert not kapi_acik(KAPI), "olcumden sonra HKM kapanmali"
    # Gercek config.json'a ve veritabanina dokunulmaz.
    assert "config.json" not in " ".join(v.get("dosyalar") or []), v.get("dosyalar")
    print("hkm olcum kabul: %d uc, baslangic %.2f sn, 500 yok, HKM kapandi." % (len(uc), v["baslangic_sn"]))


if __name__ == "__main__":
    main()
