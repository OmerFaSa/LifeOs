#!/usr/bin/env python3
"""sistem/zemin.py sozlerinin testi (kullanicinin arka plan dosyasi).

   python3 tools/zemin_test.py     (cikis 0 temiz, 1 kirmizi)

Sinar: yalniz iki yuva ve bes tur; tur basligi dosyanin ilk baytlariyla
uyusmali; yeni dosya eskisini (baska uzantida olsa da) siler; ev agindan
okuma ve yazma 403; ozel baslik olmadan yazma 403."""
import importlib.util
import io
import sys
import tempfile
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("zemin", KOK / "sistem" / "zemin.py")
Z = importlib.util.module_from_spec(spec)
spec.loader.exec_module(Z)

PNG = b"\x89PNG\r\n\x1a\n" + b"\0" * 32
JPG = b"\xff\xd8\xff\xe0" + b"\0" * 32
MP4 = b"\0\0\0\x18ftypmp42" + b"\0" * 32
hata = []


def bekle(ad, kosul):
    if not kosul:
        hata.append(ad)


class Sahte:
    def __init__(self, komut, yol, ip="127.0.0.1", govde=b"", tur="", baslik=True):
        self.command, self.path, self.client_address = komut, yol, (ip, 5000)
        self.headers = {"Content-Length": str(len(govde)), "Content-Type": tur}
        if baslik:
            self.headers["X-LifeOS"] = "zemin"
        self.rfile, self.wfile, self.kod = io.BytesIO(govde), io.BytesIO(), None

    def send_response(self, kod):
        self.kod = kod

    def send_header(self, *a):
        pass

    def end_headers(self):
        pass


with tempfile.TemporaryDirectory() as d:
    Z.klasor = lambda: d
    Z.yaz("gunduz", "image/png", PNG, d)
    bekle("png yazilir ve bulunur", Z.bul("gunduz", d)[1] == "image/png")
    Z.yaz("gunduz", "image/jpeg", JPG, d)
    bekle("yeni tur eskisini siler", Z.bul("gunduz", d)[1] == "image/jpeg"
          and not (Path(d) / "gunduz.png").exists())
    for ad, args, kod in [
        ("bilinmeyen yuva", ("ogle", "image/png", PNG), 404),
        ("bilinmeyen tur", ("gece", "image/gif", b"GIF89a"), 415),
        ("tur ile icerik uyusmaz", ("gece", "image/png", JPG), 415),
        ("bos dosya", ("gece", "image/png", b""), 413),
    ]:
        try:
            Z.yaz(*args, kok=d)
            hata.append(ad + ": reddedilmedi")
        except ValueError as e:
            bekle(ad + " " + str(kod), e.args[0][0] == kod)
    Z.yaz("gece", "video/mp4", MP4, d)
    bekle("video yazilir", Z.bul("gece", d)[1] == "video/mp4")

    h = Sahte("GET", "/api/zemin/gunduz")
    Z.isle(h)
    bekle("PC'den okunur", h.kod == 200 and h.wfile.getvalue() == JPG)
    h = Sahte("GET", "/api/zemin/gunduz", ip="192.168.1.20")
    Z.isle(h)
    bekle("ev agindan okunmaz", h.kod == 403)
    h = Sahte("POST", "/api/zemin/gece", govde=PNG, tur="image/png", baslik=False)
    Z.isle(h)
    bekle("ozel basliksiz yazilmaz", h.kod == 403 and Z.bul("gece", d)[1] == "video/mp4")
    h = Sahte("POST", "/api/zemin/gece", govde=PNG, tur="image/png")
    Z.isle(h)
    bekle("baslikla yazilir", h.kod == 204 and Z.bul("gece", d)[1] == "image/png")
    # 2026-10-30: video parca parca yazilir ve okunur; Range 206; MOV kabul; 600 MB siniri
    BUYUK = MP4 + bytes(range(256)) * 12000                    # ~3 MB, birden cok parca
    h = Sahte("POST", "/api/zemin/gece", govde=BUYUK, tur="video/mp4")
    Z.isle(h)
    bekle("buyuk video akarak yazilir", h.kod == 204 and (Path(d) / "gece.mp4").read_bytes() == BUYUK)
    h = Sahte("GET", "/api/zemin/gece")
    h.headers["Range"] = "bytes=100-199"
    Z.isle(h)
    bekle("Range 206 ve dogru aralik", h.kod == 206 and h.wfile.getvalue() == BUYUK[100:200])
    h = Sahte("GET", "/api/zemin/gece")
    h.headers["Range"] = "bytes=%d-" % (len(BUYUK) + 5)
    Z.isle(h)
    bekle("aralik disi 416", h.kod == 416)
    MOV = b"\0\0\0\x14ftypqt  " + b"\0" * 32
    Z.yaz("gece", "video/quicktime", MOV, d)
    bekle("mov yazilir", Z.bul("gece", d)[1] == "video/quicktime")
    h = Sahte("POST", "/api/zemin/gece", govde=b"x", tur="video/mp4")
    h.headers["Content-Length"] = str(Z.UST_SINIR + 1)
    Z.isle(h)
    bekle("600 MB ustu 413, eski dosya kalir", h.kod == 413 and Z.bul("gece", d)[1] == "video/quicktime" and Z.UST_SINIR == 600 * 1024 * 1024)
    h = Sahte("POST", "/api/zemin/gece", govde=MP4[:20], tur="video/mp4")
    h.headers["Content-Length"] = "5000"
    Z.isle(h)
    bekle("yarida kalan yukleme eskisini bozmaz", h.kod == 400 and Z.bul("gece", d)[1] == "video/quicktime")
    h = Sahte("POST", "/api/zemin/gece", govde=PNG, tur="image/png")
    Z.isle(h)
    h = Sahte("DELETE", "/api/zemin/gece")
    Z.isle(h)
    bekle("silinir", h.kod == 204 and Z.bul("gece", d)[0] is None)

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("Zemin dosyalari temiz: yuva, tur, imza, yalniz bu bilgisayar, ozel baslik.")
