#!/usr/bin/env python3
"""sistem/ice.py sozlerinin testi (Google verisini hesap baglamadan getirmek).

   python3 tools/ice_test.py     (cikis 0 temiz, 1 kirmizi)"""
import datetime
import importlib.util
import io
import json
import sys
import tempfile
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("ice", KOK / "sistem" / "ice.py")
I = importlib.util.module_from_spec(spec)
spec.loader.exec_module(I)
hata = []


def bekle(ad, kosul):
    if not kosul:
        hata.append(ad)


ICS = """BEGIN:VCALENDAR\r
BEGIN:VEVENT\r
DTSTART:20261031T090000\r
DTEND:20261031T100000\r
SUMMARY:Matematik dersi\\, sınıf\r
END:VEVENT\r
BEGIN:VEVENT\r
DTSTART;VALUE=DATE:20261102\r
SUMMARY:Doğum günü\r
END:VEVENT\r
BEGIN:VEVENT\r
DTSTART:20261001T090000\r
SUMMARY:Geçmiş\r
END:VEVENT\r
BEGIN:VEVENT\r
DTSTART:20261231T090000\r
SUMMARY:Çok uzak\r
END:VEVENT\r
END:VCALENDAR\r
"""
SIMDI = datetime.datetime(2026, 10, 30, 12, 0)
l = I.ics_coz(ICS, SIMDI)
bekle("ufuktakiler, sirali", [x["ad"] for x in l] == ["Matematik dersi, sınıf", "Doğum günü"])
bekle("tum gun ve saat", l[1]["tum_gun"] and l[0]["bas"] == "2026-10-31T09:00" and l[0]["bit"] == "2026-10-31T10:00")


class Sahte:
    def __init__(self, komut, yol, ip="127.0.0.1", govde=None, baslik=True):
        b = json.dumps(govde).encode("utf-8") if govde is not None else b""
        self.command, self.path, self.client_address = komut, yol, (ip, 5000)
        self.headers = {"Content-Length": str(len(b))}
        if baslik:
            self.headers["X-LifeOS"] = "ice"
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
    istek = []
    getir = lambda u: (istek.append(u), ICS)[1]
    h = Sahte("GET", "/api/ice", ip="192.168.1.4")
    I.isle(h, d, getir)
    bekle("ev agindan 403", h.kod == 403)
    h = Sahte("POST", "/api/ice/takvim", govde={"adres": "https://x/basic.ics"}, baslik=False)
    I.isle(h, d, getir)
    bekle("basliksiz 403", h.kod == 403)
    h = Sahte("POST", "/api/ice/takvim", govde={"adres": "http://x/basic.ics"})
    I.isle(h, d, getir)
    bekle("https olmayan 400", h.kod == 400)
    h = Sahte("POST", "/api/ice/takvim", govde={"adres": "https://calendar.google.com/x/basic.ics"})
    I.isle(h, d, getir)
    v = h.json()
    bekle("adres kaydedilir, disari verilmez", h.kod == 200 and v["takvim"]["var"] and "adres" not in v["takvim"] and len(istek) == 1)
    h = Sahte("GET", "/api/ice")
    I.isle(h, d, getir)
    bekle("yarim saat icinde yeniden cekilmez", h.kod == 200 and len(istek) == 1)
    h = Sahte("POST", "/api/ice/veri", govde={"tur": "adim", "ozet": {"2026-10-29": 8123, "kotu": 5, "2026-10-30": -3}})
    I.isle(h, d, getir)
    bekle("adim ozeti suzulur", h.kod == 200 and h.json()["veri"]["adim"]["gunler"] == {"2026-10-29": 8123})
    h = Sahte("POST", "/api/ice/veri", govde={"tur": "youtube", "ozet": {"gunler": {"2026-10-29": 12}, "kanallar": [["Khan Academy", 9]]}})
    I.isle(h, d, getir)
    bekle("youtube ozeti", h.json()["veri"]["youtube"]["kanallar"] == [["Khan Academy", 9]])
    h = Sahte("POST", "/api/ice/veri", govde={"tur": "sifre", "ozet": {}})
    I.isle(h, d, getir)
    bekle("bilinmeyen tur 400", h.kod == 400)
    v = I.oku(d)
    v["takvim"]["cekildi"] = 0
    I.yaz(v, d)
    h = Sahte("GET", "/api/ice")
    I.isle(h, d, lambda u: (_ for _ in ()).throw(OSError("ag yok")))
    v = h.json()
    bekle("ag hatasi eski olaylari silmez", len(v["takvim"]["olaylar"]) == 2 and "okunamadı" in v["takvim"]["hata"])

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("Ice aktarma temiz: ics, ufuk, yalniz bu bilgisayar, ozel baslik, adres gizli, onbellek, ozet suzgeci, ag hatasi.")
