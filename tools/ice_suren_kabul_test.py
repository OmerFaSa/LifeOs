#!/usr/bin/env python3
"""Gorev 007 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
sistem/ice.py ics_coz: bugun SUREN etkinlik de gelir (baslangici dun olan cok gunluk, gece yarisini asan);
tum gun etkinlikte DTEND yoksa bitis ertesi gun 00:00 (RFC 5545); bitmis etkinlik gelmez.
python tools/ice_suren_kabul_test.py"""
import datetime
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KOK / "sistem"))
import ice as I  # noqa: E402

hata = []
SIMDI = datetime.datetime(2026, 10, 31, 10, 0)


def ics(*olaylar):
    return "BEGIN:VCALENDAR\r\n" + "".join("BEGIN:VEVENT\r\n" + o + "END:VEVENT\r\n" for o in olaylar) + "END:VCALENDAR\r\n"


def olay(ad, bas, bit=None, ek=""):
    gun = len(bas) == 8
    s = "SUMMARY:%s\r\nDTSTART%s:%s\r\n" % (ad, ";VALUE=DATE" if gun else "", bas)
    if bit:
        s += "DTEND%s:%s\r\n" % (";VALUE=DATE" if gun else "", bit)
    return s + ek


def bul(l, ad):
    return next((x for x in l if x["ad"] == ad), None)


l = I.ics_coz(ics(
    olay("Kamp", "20261030", "20261102"),                  # dun basladi, 1 Kasim dahil surer
    olay("Gece nobeti", "20261030T220000", "20261031T020000"),
    olay("Dun bitti", "20261029", "20261030"),             # yalniz 29'u
    olay("Tam dun", "20261030", "20261031"),               # yalniz 30'u: bitis bugun 00:00, dahil degil
    olay("Bugun tek gun", "20261031"),                     # DTEND yok
    olay("Yarin saatli", "20261101T090000", "20261101T100000"),
    olay("Dun saatli bitti", "20261030T090000", "20261030T100000"),
    olay("Dun saatli bitissiz", "20261030T090000"),
), SIMDI)

k = bul(l, "Kamp")
if not k:
    hata.append("dun baslayip bugun suren cok gunluk etkinlik gelmeli")
elif (k["bas"], k["bit"], k["tum_gun"]) != ("2026-10-30T00:00", "2026-11-02T00:00", True):
    hata.append("Kamp alanlari: %r" % k)
g = bul(l, "Gece nobeti")
if not g or (g["bas"], g["bit"]) != ("2026-10-30T22:00", "2026-10-31T02:00"):
    hata.append("gece yarisini asan etkinlik bugune girmeli: %r" % g)
for ad in ("Dun bitti", "Tam dun", "Dun saatli bitti", "Dun saatli bitissiz"):
    if bul(l, ad):
        hata.append("bitmis etkinlik gelmemeli: " + ad)
b = bul(l, "Bugun tek gun")
if not b or (b["bas"], b["bit"], b["tum_gun"]) != ("2026-10-31T00:00", "2026-11-01T00:00", True):
    hata.append("DTEND'siz tum gun etkinligin bitisi ertesi gun 00:00 olmali: %r" % b)
if not bul(l, "Yarin saatli"):
    hata.append("gelecek etkinlik bozulmamali")
if [x["bas"] for x in l] != sorted(x["bas"] for x in l):
    hata.append("sira baslangica gore kalmali: %r" % [x["bas"] for x in l])

# tekrarlayan: her gece 23:00-01:00; dun geceki ornek bugun 01:00'e dek surer -> gelir, ayni an iki kez gelmez
l2 = I.ics_coz(ics(olay("Gece calismasi", "20261020T230000", "20261021T010000", "RRULE:FREQ=DAILY\r\n")), SIMDI, ufuk=2)
bas = [x["bas"] for x in l2]
if "2026-10-30T23:00" not in bas or "2026-10-31T23:00" not in bas or len(bas) != len(set(bas)):
    hata.append("tekrarlayan gece ornekleri: %r" % bas)
if "2026-10-29T23:00" in bas:
    hata.append("dunden onceki ornek gelmemeli: %r" % bas)

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("ice suren kabul: cok gunluk, gece yarisi, DTEND'siz tum gun, bitmis elenir, tekrarlayan gece.")
