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

# RRULE ve EXDATE testleri (001-takvim-tekrar)
ICS_HAFTALIK = """BEGIN:VCALENDAR\r
BEGIN:VEVENT\r
DTSTART:20261026T090000\r
DTEND:20261026T103000\r
RRULE:FREQ=WEEKLY;BYDAY=MO,WE\r
SUMMARY:Haftalık ders\r
END:VEVENT\r
END:VCALENDAR\r
"""
l_haftalik = I.ics_coz(ICS_HAFTALIK, SIMDI)
bekle("haftalik ders 14 gunde 4 kez", len(l_haftalik) == 4 and [x["bas"] for x in l_haftalik] == [
    "2026-11-02T09:00", "2026-11-04T09:00", "2026-11-09T09:00", "2026-11-11T09:00"
] and all(x["bit"].endswith("T10:30") for x in l_haftalik))

ICS_COUNT = """BEGIN:VCALENDAR\r
BEGIN:VEVENT\r
DTSTART:20261031T100000\r
DTEND:20261031T110000\r
RRULE:FREQ=DAILY;COUNT=2\r
SUMMARY:İki günlük seminer\r
END:VEVENT\r
END:VCALENDAR\r
"""
l_count = I.ics_coz(ICS_COUNT, SIMDI)
bekle("COUNT=2 iki kez", len(l_count) == 2 and [x["bas"] for x in l_count] == ["2026-10-31T10:00", "2026-11-01T10:00"])

ICS_UNTIL = """BEGIN:VCALENDAR\r
BEGIN:VEVENT\r
DTSTART:20261001T090000\r
DTEND:20261001T100000\r
RRULE:FREQ=DAILY;UNTIL=20261020T180000Z\r
SUMMARY:Geçmiş kurs\r
END:VEVENT\r
END:VCALENDAR\r
"""
l_until = I.ics_coz(ICS_UNTIL, SIMDI)
bekle("UNTIL gecmiste biten tekrar hic", len(l_until) == 0)

ICS_UNTIL_TARIH = """BEGIN:VCALENDAR\r
BEGIN:VEVENT\r
DTSTART:20261031T090000\r
RRULE:FREQ=DAILY;UNTIL=20261102\r
SUMMARY:Tarihli bitiş\r
END:VEVENT\r
END:VCALENDAR\r
"""
l_u_tar = I.ics_coz(ICS_UNTIL_TARIH, SIMDI)
bekle("UNTIL tarih degeri gun sonuna kadar kapsar", [x["bas"] for x in l_u_tar] == ["2026-10-31T09:00", "2026-11-01T09:00", "2026-11-02T09:00"])

ICS_EXDATE = """BEGIN:VCALENDAR\r
BEGIN:VEVENT\r
DTSTART:20261101T140000\r
DTEND:20261101T150000\r
RRULE:FREQ=DAILY;COUNT=3\r
EXDATE:20261102T140000\r
SUMMARY:İstisnalı toplantı\r
END:VEVENT\r
END:VCALENDAR\r
"""
l_exdate = I.ics_coz(ICS_EXDATE, SIMDI)
bekle("bir EXDATE atlanir", len(l_exdate) == 2 and [x["bas"] for x in l_exdate] == ["2026-11-01T14:00", "2026-11-03T14:00"])

ICS_EXDATE_VIRGUL = """BEGIN:VCALENDAR\r
BEGIN:VEVENT\r
DTSTART:20261101T140000\r
RRULE:FREQ=DAILY;COUNT=4\r
EXDATE:20261102T140000,20261103T140000\r
SUMMARY:Çoklu istisna\r
END:VEVENT\r
END:VCALENDAR\r
"""
l_ex_virgul = I.ics_coz(ICS_EXDATE_VIRGUL, SIMDI)
bekle("virgullu EXDATE atlanir", len(l_ex_virgul) == 2 and [x["bas"] for x in l_ex_virgul] == ["2026-11-01T14:00", "2026-11-04T14:00"])

ICS_GUNLUK = """BEGIN:VCALENDAR\r
BEGIN:VEVENT\r
DTSTART;VALUE=DATE:20261031\r
RRULE:FREQ=DAILY\r
SUMMARY:Günlük rutin\r
END:VEVENT\r
END:VCALENDAR\r
"""
l_gunluk = I.ics_coz(ICS_GUNLUK, SIMDI)
bekle("gunluk tum gun etkinligi her gun", len(l_gunluk) == 14 and all(x["tum_gun"] for x in l_gunluk) and l_gunluk[0]["bas"] == "2026-10-31T00:00" and l_gunluk[-1]["bas"] == "2026-11-13T00:00")

ICS_SECONDLY = """BEGIN:VCALENDAR\r
BEGIN:VEVENT\r
DTSTART:20261031T160000\r
RRULE:FREQ=SECONDLY\r
SUMMARY:Saniyelik etkinlik\r
END:VEVENT\r
END:VCALENDAR\r
"""
l_secondly = I.ics_coz(ICS_SECONDLY, SIMDI)
bekle("taninmayan FREQ=SECONDLY yalniz ilk ornek", len(l_secondly) == 1 and l_secondly[0]["bas"] == "2026-10-31T16:00")

ICS_INTERVAL = """BEGIN:VCALENDAR\r
BEGIN:VEVENT\r
DTSTART:20261031T080000\r
RRULE:FREQ=DAILY;INTERVAL=2\r
SUMMARY:İki günde bir\r
END:VEVENT\r
END:VCALENDAR\r
"""
l_int = I.ics_coz(ICS_INTERVAL, SIMDI)
bekle("INTERVAL=2 iki gunde bir", [x["bas"] for x in l_int][:3] == ["2026-10-31T08:00", "2026-11-02T08:00", "2026-11-04T08:00"])

ICS_AYLIK = """BEGIN:VCALENDAR\r
BEGIN:VEVENT\r
DTSTART:20260905T100000\r
RRULE:FREQ=MONTHLY\r
SUMMARY:Aylık kontrol\r
END:VEVENT\r
END:VCALENDAR\r
"""
l_aylik = I.ics_coz(ICS_AYLIK, SIMDI)
bekle("aylik tekrar", len(l_aylik) == 1 and l_aylik[0]["bas"] == "2026-11-05T10:00")

ICS_YILLIK = """BEGIN:VCALENDAR\r
BEGIN:VEVENT\r
DTSTART:20241103T110000\r
RRULE:FREQ=YEARLY\r
SUMMARY:Yıllık anma\r
END:VEVENT\r
END:VCALENDAR\r
"""
l_yillik = I.ics_coz(ICS_YILLIK, SIMDI)
bekle("yillik tekrar", len(l_yillik) == 1 and l_yillik[0]["bas"] == "2026-11-03T11:00")


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
print("Ice aktarma temiz: ics, rrule, exdate, ufuk, yalniz bu bilgisayar, ozel baslik, adres gizli, onbellek, ozet suzgeci, ag hatasi.")
