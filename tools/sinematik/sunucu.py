"""Karistirma sayfasinin sunucusu (yalniz 127.0.0.1:4598).

GET  /karistir.html, /sinematik.js (SATIR buradan okunur), /ses/NN.wav (is klasoru)
POST /kaydet  -> is klasorune anlatim.aac yazar; sonra:
     python tools/sinematik/mux.py <is>/anlatim.aac brand/medya/tanitim/tanitim-sinematik.mp4"""
import http.server
import os
import tempfile

BURA = os.path.dirname(os.path.abspath(__file__))
KAYNAK = os.path.join(BURA, "..", "..", "brand", "ortak", "sinematik.js")
IS = os.path.join(tempfile.gettempdir(), "lifeos-sinematik")


class Kapi(http.server.BaseHTTPRequestHandler):
    def _gonder(self, yol, tur):
        try:
            govde = open(yol, "rb").read()
        except OSError:
            return self.send_error(404)
        self.send_response(200)
        self.send_header("Content-Type", tur)
        self.send_header("Content-Length", str(len(govde)))
        self.end_headers()
        self.wfile.write(govde)

    def do_GET(self):
        yol = self.path.split("?", 1)[0]
        if yol == "/karistir.html":
            return self._gonder(os.path.join(BURA, "karistir.html"), "text/html; charset=utf-8")
        if yol == "/sinematik.js":
            return self._gonder(KAYNAK, "text/javascript; charset=utf-8")
        ad = os.path.basename(yol)
        if yol.startswith("/ses/") and ad.endswith(".wav"):
            return self._gonder(os.path.join(IS, "ses", ad), "audio/wav")
        self.send_error(404)

    def do_POST(self):
        if self.path.split("?", 1)[0] != "/kaydet":
            return self.send_error(404)
        n = int(self.headers.get("Content-Length") or 0)
        os.makedirs(IS, exist_ok=True)
        open(os.path.join(IS, "anlatim.aac"), "wb").write(self.rfile.read(n))
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")


if __name__ == "__main__":
    print("http://127.0.0.1:4598/karistir.html  (is klasoru: %s)" % IS)
    http.server.ThreadingHTTPServer(("127.0.0.1", 4598), Kapi).serve_forever()
