# -*- coding: utf-8 -*-
"""050 kabul testi: tools/hafiza_olcum.py — hafiza aramasi kok ve gomme ile olculur.
Kosu: python tools/hafiza_olcum_kabul_test.py"""
import http.server
import json
import os
import re
import subprocess
import sys
import tempfile
import threading

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARAC = os.path.join(KOK, "tools", "hafiza_olcum.py")
KUME = os.path.join(KOK, "tools", "hafiza_olcum_kume.json")


def kokler(t):
    t = str(t).replace("İ", "i").replace("I", "ı").lower()
    return {w[:5] for w in re.findall(r"\w+", t) if len(w) >= 4}


class Sahte(http.server.BaseHTTPRequestHandler):
    def do_POST(self):                           # noqa: N802
        g = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        assert self.path == "/api/embed", self.path
        # Kelimenin ilk 4 harfi bir boyuta duser: sahte ama kararli bir gomme.
        v = []
        for t in g["input"]:
            kova = {sum(map(ord, w[:4])) % 64 for w in re.findall(r"\w+", t.lower())}
            v.append([0.01] + [float(i in kova) for i in range(64)])
        b = json.dumps({"embeddings": v}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def log_message(self, *a):
        pass


def kos(adres):
    out = os.path.join(tempfile.mkdtemp(prefix="hafiza-olcum-"), "o.json")
    r = subprocess.run([sys.executable, ARAC, "--ollama", adres, "--json", out], capture_output=True, text=True,
                       encoding="utf-8", errors="replace", timeout=180, env=dict(os.environ, PYTHONIOENCODING="utf-8"))
    assert r.returncode == 0, "cikis %s\n%s\n%s" % (r.returncode, r.stdout[-600:], r.stderr[-600:])
    return json.load(open(out, encoding="utf-8")), r.stdout


def main():
    assert os.path.isfile(ARAC), "tools/hafiza_olcum.py yok"
    kume = json.load(open(KUME, encoding="utf-8"))
    assert isinstance(kume, list) and len(kume) >= 24, "kume en az 24 cift"
    for c in kume:
        assert isinstance(c.get("bilgi"), str) and isinstance(c.get("soru"), str), c
    kopuk = sum(1 for c in kume if not (kokler(c["bilgi"]) & kokler(c["soru"])))
    assert kopuk >= 8, "en az 8 ciftte kok eslemesi bos kalmali, %d" % kopuk

    v, ekran = kos("http://127.0.0.1:9")
    assert v["kume"] == len(kume) and v["motor"] is False and v["gomme"] is None, v
    assert 0 <= v["kok"]["p1"] <= v["kok"]["p3"] <= 1, v["kok"]
    assert "kok" in ekran, ekran[-300:]

    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Sahte)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    try:
        v, _ = kos("http://127.0.0.1:%d" % srv.server_address[1])
    finally:
        srv.shutdown()
    g = v["gomme"]
    assert v["motor"] is True and isinstance(g, dict), v
    for k in ("p1", "p3", "ilk_ms", "ms", "dogru_benzerlik", "yanlis_benzerlik"):
        assert isinstance(g.get(k), (int, float)), (k, g)
    assert 0 <= g["p1"] <= g["p3"] <= 1 and g["ilk_ms"] >= g["ms"] >= 0, g
    print("hafiza olcum kabul: kume %d (kokte bos %d), kok p1 %.2f, sahte gomme p1 %.2f."
          % (len(kume), kopuk, v["kok"]["p1"], g["p1"]))


if __name__ == "__main__":
    main()
