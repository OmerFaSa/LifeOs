#!/usr/bin/env python3
"""Gelistirme sunucusu — src/ klasorunu onbelleksiz servis eder.

python -m http.server tarayiciya Last-Modified gonderir ve tarayici dosyalari
onbellege alir; kaynak duzenlendikten sonra eski surum calismaya devam eder.
Bu sunucu her yanita no-store ekleyerek bunu engeller.

Kullanim:  python devserver.py [port]
"""

import os
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
ROOT = "src"
REPO = os.path.dirname(os.path.abspath(__file__))


class NoCacheHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # /dist/... derlenmis tek dosyaya cikar; boylece kaynak ve urun
        # ayni sunucudan, ayni sekilde denenebilir.
        clean = path.split("?", 1)[0].split("#", 1)[0]
        if clean == "/dist" or clean.startswith("/dist/"):
            rel = clean[len("/dist/"):] if clean.startswith("/dist/") else ""
            safe = os.path.normpath(rel).replace("\\", "/").lstrip("./")
            if safe.startswith(".."):
                return os.path.join(REPO, "dist")
            return os.path.join(REPO, "dist", *[p for p in safe.split("/") if p])
        return super().translate_path(path)

    def guess_type(self, path):
        # Kaynaklar UTF-8; charset bildirilmezse tarayici latin-1 varsayar
        # ve Turkce karakterler bozulur. dist/rota.html kendi <meta>'sini
        # tasimaz (Artifact kabugu ekler), bu yuzden basligi burada veriyoruz.
        ctype = super().guess_type(path)
        base = ctype.split(";", 1)[0].strip()
        if base in ("text/html", "text/css", "application/javascript",
                    "text/javascript", "application/json", "text/plain"):
            return base + "; charset=utf-8"
        return ctype

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        # 200'leri sessiz gec, yalniz hatalari yaz
        status = str(args[1]) if len(args) > 1 else ""
        if status.startswith("2") or status.startswith("3"):
            return
        super().log_message(fmt, *args)


def main():
    handler = partial(NoCacheHandler, directory=ROOT)
    server = ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    print(f"Rota dev sunucusu:  http://localhost:{PORT}")
    print(f"Testler:            http://localhost:{PORT}/tests/")
    print(f"Derlenmis surum:    http://localhost:{PORT}/dist/rota.html")
    print(f"Kok:                {ROOT}/  (onbellek kapali)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nkapatiliyor")
        server.server_close()


if __name__ == "__main__":
    main()
