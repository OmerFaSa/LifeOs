#!/usr/bin/env python3
"""sistem/muzik.py sozlerinin testi (kullanicinin muzik dosyalari ve listeleri).

   python3 tools/muzik_test.py     (cikis 0 temiz, 1 kirmizi)"""
import importlib.util
import io
import json
import sys
import tempfile
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KOK / "sistem"))
spec = importlib.util.spec_from_file_location("muzik", KOK / "sistem" / "muzik.py")
M = importlib.util.module_from_spec(spec)
spec.loader.exec_module(M)
hata = []


def bekle(ad, kosul):
    if not kosul:
        hata.append(ad)


MP3 = b"ID3\x04\0\0\0\0\0\0" + bytes(range(256)) * 40
OGG = b"OggS" + b"\0" * 60


class Sahte:
    def __init__(self, komut, yol, ip="127.0.0.1", govde=b"", tur="", baslik=True, ad=""):
        self.command, self.path, self.client_address = komut, yol, (ip, 5000)
        self.headers = {"Content-Length": str(len(govde)), "Content-Type": tur, "X-Ad": ad}
        if baslik:
            self.headers["X-LifeOS"] = "muzik"
        self.rfile, self.wfile, self.kod = io.BytesIO(govde), io.BytesIO(), None

    def send_response(self, kod):
        self.kod = kod

    def send_header(self, *a):
        pass

    def end_headers(self):
        pass

    def json(self):
        return json.loads(self.wfile.getvalue().decode("utf-8"))


with tempfile.TemporaryDirectory() as d:
    M.klasor = lambda: d
    h = Sahte("POST", "/api/muzik/parca", govde=MP3, tur="audio/mpeg", ad="Odak%20M%C3%BCzi%C4%9Fi.mp3")
    M.isle(h)
    p1 = h.json().get("parca") or {}
    bekle("mp3 eklenir, adi temiz", h.kod == 200 and p1.get("ad") == "Odak Müziği" and (Path(d) / (p1["id"] + ".mp3")).read_bytes() == MP3)
    h = Sahte("POST", "/api/muzik/parca", govde=OGG, tur="audio/ogg", ad="spor")
    M.isle(h)
    p2 = h.json().get("parca") or {}
    for ad, govde, tur, kod in [("tur icerikle uyusmaz", OGG, "audio/mpeg", 415), ("bilinmeyen tur", b"GIF89a....", "image/gif", 415),
                                ("bos", b"", "audio/mpeg", 413)]:
        h = Sahte("POST", "/api/muzik/parca", govde=govde, tur=tur)
        M.isle(h)
        bekle(ad + " " + str(kod), h.kod == kod)
    h = Sahte("POST", "/api/muzik/parca", govde=MP3, tur="audio/mpeg", baslik=False)
    M.isle(h)
    bekle("basliksiz yazilmaz", h.kod == 403)
    h = Sahte("GET", "/api/muzik", ip="192.168.1.9")
    M.isle(h)
    bekle("ev agindan okunmaz", h.kod == 403)

    ayar = {"listeler": {"calisma": [p1["id"], "yok-boyle"], "spor": [p2["id"]], "arka": [p1["id"], p2["id"]]},
            "acilis": {"id": p1["id"], "bas": 5, "bit": 3, "ses": 4, "ne": "her"}, "arka": {"acik": True, "ses": .2}}
    h = Sahte("POST", "/api/muzik/ayar", govde=json.dumps(ayar).encode("utf-8"), tur="application/json")
    M.isle(h)
    v = h.json()
    bekle("listede yalniz var olan", v["listeler"]["calisma"] == [p1["id"]] and v["listeler"]["spor"] == [p2["id"]])
    bekle("acilis araligi ve ses sinirlanir", v["acilis"]["bas"] == 5 and v["acilis"]["bit"] == 6 and v["acilis"]["ses"] == 1 and v["acilis"]["ne"] == "her")
    bekle("arka plan kaydedilir", v["arka"] == {"acik": True, "ses": .2, "karistir": True})

    h = Sahte("GET", "/api/muzik/parca/" + p1["id"])
    h.headers["Range"] = "bytes=0-9"
    M.isle(h)
    bekle("parca Range ile okunur", h.kod == 206 and h.wfile.getvalue() == MP3[:10])

    h = Sahte("DELETE", "/api/muzik/parca/" + p1["id"])
    M.isle(h)
    v = h.json()
    bekle("silinen parca her yerden cikar", h.kod == 200 and [p["id"] for p in v["parcalar"]] == [p2["id"]]
          and v["listeler"]["calisma"] == [] and v["listeler"]["arka"] == [p2["id"]] and v["acilis"]["id"] is None
          and v["acilis"]["ne"] == "kapali" and not (Path(d) / (p1["id"] + ".mp3")).exists())
    bekle("bozuk dizin bos baslar", (lambda: ((Path(d) / "dizin.json").write_text("{bozuk", encoding="utf-8"), M.oku(d))[1])()["parcalar"] == [])

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("Muzik temiz: tur, imza, yalniz bu bilgisayar, ozel baslik, listeler, acilis araligi, silme, Range.")
