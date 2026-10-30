#!/usr/bin/env python3
"""sistem/ayar.py sozlerinin testi (sistem ayarlarinin tek kopyasi).

   python3 tools/ayar_test.py     (cikis 0 temiz, 1 kirmizi)"""
import importlib.util
import io
import json
import sys
import tempfile
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("ayar", KOK / "sistem" / "ayar.py")
A = importlib.util.module_from_spec(spec)
spec.loader.exec_module(A)
hata = []


def bekle(ad, kosul):
    if not kosul:
        hata.append(ad)


class Sahte:
    def __init__(self, komut, ip="127.0.0.1", govde=None, baslik=True):
        b = json.dumps(govde).encode("utf-8") if govde is not None else b""
        self.command, self.path, self.client_address = komut, "/api/ayar", (ip, 5000)
        self.headers = {"Content-Length": str(len(b))}
        if baslik:
            self.headers["X-LifeOS"] = "ayar"
        self.rfile, self.wfile, self.kod = io.BytesIO(b), io.BytesIO(), None

    def send_response(self, k):
        self.kod = k

    def send_header(self, *a):
        pass

    def end_headers(self):
        pass

    def json(self):
        return json.loads(self.wfile.getvalue().decode("utf-8"))


with tempfile.TemporaryDirectory() as d:
    h = Sahte("GET", ip="192.168.1.9")
    A.isle(h, d)
    bekle("ev agindan 403", h.kod == 403)
    h = Sahte("POST", govde={"ayar": {"lifeos.cam": "cok"}}, baslik=False)
    A.isle(h, d)
    bekle("basliksiz 403", h.kod == 403)
    h = Sahte("POST", govde={"ayar": {"lifeos.cam": "cok", "lifeos.manzara.tur.gunduz": "video", "lifeos.zemin.video": "{\"ses\":true}",
                                       "lifeos.kilit.odeme": "acik", "lifeos.king.kartlarim": "[]", "lifeos.yuzey.ays": "ferah", "baska": "x"}})
    A.isle(h, d)
    v = h.json()
    bekle("tercihler yazilir", v["ayar"] == {"lifeos.cam": "cok", "lifeos.manzara.tur.gunduz": "video", "lifeos.zemin.video": "{\"ses\":true}"})
    bekle("kilit, hafiza, modul yuzeyi reddedilir", sorted(v["reddedilen"]) == ["baska", "lifeos.kilit.odeme", "lifeos.king.kartlarim", "lifeos.yuzey.ays"])
    h = Sahte("POST", govde={"ayar": {"lifeos.cam": None, "lifeos.yazi": "x" * 5000}})
    A.isle(h, d)
    bekle("null siler, buyuk deger reddedilir", "lifeos.cam" not in h.json()["ayar"] and h.json()["reddedilen"] == ["lifeos.yazi"])
    h = Sahte("GET")
    A.isle(h, d)
    bekle("okunur", h.kod == 200 and h.json()["ayar"]["lifeos.manzara.tur.gunduz"] == "video")
    s = A.sayfaya_ekle(b"<!doctype html><html><head><title>x</title></head></html>", d).decode("utf-8")
    bekle("sayfanin basina konur", s.startswith("<!doctype html><html><head><script>window.__LIFEOS_AYAR__={") and "video" in s)
    A.birlestir({"lifeos.king.ad": "</script><b>"}, d)
    s = A.sayfaya_ekle("<head></head>", d)
    bekle("betik kapanisi kacirilir", "</script><b>" not in s.split("</script>", 1)[0] + "</script>" and s.count("</script>") == 1)
    bekle("head yoksa dokunulmaz", A.sayfaya_ekle(b"<p>x</p>", d) == b"<p>x</p>")

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("Ortak ayarlar temiz: yalniz bu bilgisayar, ozel baslik, yalniz tercih, silme, sinir, sayfa basi, kacirma.")
