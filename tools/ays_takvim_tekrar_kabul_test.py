#!/usr/bin/env python3
"""Gorev 013 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
AYS .ics ice aktarma (core/takvim.js oku, onizle) tekrar kuralini (RRULE) acar: DAILY/WEEKLY(BYDAY, INTERVAL)/MONTHLY,
COUNT/UNTIL, EXDATE, RECURRENCE-ID; gecmis tekrar gelmez, acilim bugunden itibaren 365 gunle ve 500 etkinlikle sinirli.
Node'da kosar (tools/kabul_js.py). python tools/ays_takvim_tekrar_kabul_test.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kabul_js as J  # noqa: E402

DOSYALAR = ["src/js/core/utils.js", "src/js/core/takvim.js"]
HAZIRLIK = "R.S = { calendar: [] };"
BUGUN = "2026-11-02"  # pazartesi


def ics(*olaylar):
    s = ["BEGIN:VCALENDAR", "VERSION:2.0"]
    for o in olaylar:
        s += ["BEGIN:VEVENT", *o, "END:VEVENT"]
    return "\r\n".join(s + ["END:VCALENDAR"]) + "\r\n"


ANA = ics(
    ["UID:w1", "SUMMARY:Haftalik", "DTSTART;VALUE=DATE:20261102", "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=4"],
    ["UID:d1", "SUMMARY:GunlukSayili", "DTSTART;VALUE=DATE:20261105", "RRULE:FREQ=DAILY;COUNT=3"],
    ["UID:d2", "SUMMARY:GunlukSonlu", "DTSTART;VALUE=DATE:20261108", "RRULE:FREQ=DAILY;UNTIL=20261110"],
    ["UID:d3", "SUMMARY:GunlukSonluZ", "DTSTART;VALUE=DATE:20261108", "RRULE:FREQ=DAILY;UNTIL=20261109T120000Z"],
    ["UID:m1", "SUMMARY:Aylik", "DTSTART;VALUE=DATE:20261115", "RRULE:FREQ=MONTHLY;COUNT=3"],
    ["UID:m2", "SUMMARY:Aylik31", "DTSTART;VALUE=DATE:20261231", "RRULE:FREQ=MONTHLY;COUNT=3"],
    ["UID:x1", "SUMMARY:Haric", "DTSTART;VALUE=DATE:20261103", "RRULE:FREQ=WEEKLY;COUNT=3", "EXDATE;VALUE=DATE:20261110"],
    ["UID:x2", "SUMMARY:HaricListe", "DTSTART;VALUE=DATE:20261120", "RRULE:FREQ=DAILY;COUNT=5",
     "EXDATE;VALUE=DATE:20261121,20261123"],
    ["UID:i1", "SUMMARY:IkiHafta", "DTSTART;VALUE=DATE:20261104", "RRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=3"],
    ["UID:u1", "SUMMARY:IkiGunluk", "DTSTART;VALUE=DATE:20261106", "DTEND;VALUE=DATE:20261108", "RRULE:FREQ=WEEKLY;COUNT=2"],
    ["UID:z1", "SUMMARY:Saatli", "DTSTART:20261105T150000Z", "DTEND:20261105T160000Z", "RRULE:FREQ=WEEKLY;BYDAY=TH;COUNT=2"],
    ["UID:p1", "SUMMARY:Gecmisten", "DTSTART;VALUE=DATE:20261019", "RRULE:FREQ=WEEKLY;COUNT=4"],
    ["UID:r1", "SUMMARY:Ders", "DTSTART;VALUE=DATE:20261102", "RRULE:FREQ=WEEKLY;COUNT=3"],
    ["UID:r1", "SUMMARY:Ders tasindi", "RECURRENCE-ID;VALUE=DATE:20261109", "DTSTART;VALUE=DATE:20261110"],
    ["UID:t1", "SUMMARY:Tek", "DTSTART;VALUE=DATE:20261201"],
)
BEKLENEN = {
    "Haftalik": [("2026-11-02",) * 2, ("2026-11-04",) * 2, ("2026-11-09",) * 2, ("2026-11-11",) * 2],
    "GunlukSayili": [("2026-11-05",) * 2, ("2026-11-06",) * 2, ("2026-11-07",) * 2],
    "GunlukSonlu": [("2026-11-08",) * 2, ("2026-11-09",) * 2, ("2026-11-10",) * 2],  # UNTIL dahil
    "GunlukSonluZ": [("2026-11-08",) * 2, ("2026-11-09",) * 2],
    "Aylik": [("2026-11-15",) * 2, ("2026-12-15",) * 2, ("2027-01-15",) * 2],
    "Aylik31": [("2026-12-31",) * 2, ("2027-01-31",) * 2, ("2027-03-31",) * 2],  # RFC 5545: olmayan gun atlanir
    "Haric": [("2026-11-03",) * 2, ("2026-11-17",) * 2],  # COUNT EXDATE'ten once sayilir
    "HaricListe": [("2026-11-20",) * 2, ("2026-11-22",) * 2, ("2026-11-24",) * 2],
    "IkiHafta": [("2026-11-04",) * 2, ("2026-11-18",) * 2, ("2026-12-02",) * 2],
    "IkiGunluk": [("2026-11-06", "2026-11-07"), ("2026-11-13", "2026-11-14")],  # sure ilk ornekten
    "Saatli": [("2026-11-05",) * 2, ("2026-11-12",) * 2],
    "Gecmisten": [("2026-11-02",) * 2, ("2026-11-09",) * 2],  # 19 ve 26 Ekim gecmis: gelmez, COUNT'a sayilir
    "Ders": [("2026-11-02",) * 2, ("2026-11-16",) * 2],
    "Ders tasindi": [("2026-11-10",) * 2],  # 9 Kasim tekrari RECURRENCE-ID ile tasindi: iki kez gorunmez
    "Tek": [("2026-12-01",) * 2],
}

hata = []
r = J.calistir("AYS", DOSYALAR, """(() => { const r = R.Takvim.oku(%r, %r);
  return { ok:r.ok, notlar:r.notlar, e:r.etkinlikler.map(e => [e.baslik, e.bas, e.bit, e.uid, !!e.tekrar]) }; })()"""
               % (ANA, BUGUN), HAZIRLIK)
if not r.get("ok"):
    hata.append("oku basarisiz: %r" % r)
else:
    gelen = {}
    for b, bas, bit, _, _ in r["e"]:
        gelen.setdefault(b, []).append((bas, bit))
    for b, bek in BEKLENEN.items():
        if sorted(gelen.get(b, [])) != bek:
            hata.append("%s -> %r (beklenen %r)" % (b, sorted(gelen.get(b, [])), bek))
    for b in set(gelen) - set(BEKLENEN):
        hata.append("beklenmeyen etkinlik %r" % b)
    uidler = [e[3] for e in r["e"]]
    if len(set(uidler)) != len(uidler):
        hata.append("her tekrarin kimligi (uid) ayri olmali: %r" % uidler)
    if [e[3] for e in r["e"] if e[0] == "Tek"] != ["t1"]:
        hata.append("tekrarsiz etkinligin uid'i degismemeli (eski kayitlarla 'zaten var' eslesmesi)")
    if any(e[4] != (e[0] not in ("Tek", "Ders tasindi")) for e in r["e"]):
        hata.append("tekrar alani yalniz RRULE acilimindan gelen satirlarda true olmali")
    if "okunmad" in " ".join(r["notlar"]):
        hata.append("desteklenen kurallar icin 'okunmadi' notu cikmamali: %r" % r["notlar"])

# Taninmayan FREQ: eskisi gibi yalniz ilk ornek, not soylenir.
r = J.calistir("AYS", DOSYALAR, "(() => { const r = R.Takvim.oku(%r, %r); return [r.etkinlikler.map(e => e.bas), r.notlar]; })()"
               % (ics(["UID:s1", "SUMMARY:Saniye", "DTSTART;VALUE=DATE:20261105", "RRULE:FREQ=SECONDLY"]), BUGUN), HAZIRLIK)
if r[0] != ["2026-11-05"] or "tekrar" not in " ".join(r[1]):
    hata.append("FREQ=SECONDLY yalniz ilk ornek ve 'tekrar' notu vermeli: %r" % r)

# Sinirli acilim penceresi: sonu olmayan gunluk tekrar bugunden 365 gun; gecmis gelmez.
r = J.calistir("AYS", DOSYALAR, "(() => { const e = R.Takvim.oku(%r, %r).etkinlikler.map(e => e.bas); return [e.length, e[0], e[e.length - 1]]; })()"
               % (ics(["UID:n1", "SUMMARY:Sonsuz", "DTSTART;VALUE=DATE:20241001", "RRULE:FREQ=DAILY"]), BUGUN), HAZIRLIK)
if r != [365, "2026-11-02", "2027-11-01"]:
    hata.append("sonsuz gunluk tekrar [365, ilk 2026-11-02, son 2027-11-01] olmali: %r" % r)

# Toplam ust sinir (EN_COK=500) acilimda da gecerli.
r = J.calistir("AYS", DOSYALAR, "R.Takvim.oku(%r, %r).etkinlikler.length"
               % (ics(["UID:n1", "SUMMARY:A", "DTSTART;VALUE=DATE:20261102", "RRULE:FREQ=DAILY"],
                      ["UID:n2", "SUMMARY:B", "DTSTART;VALUE=DATE:20261102", "RRULE:FREQ=DAILY"]), BUGUN), HAZIRLIK)
if r != 500:
    hata.append("toplam etkinlik 500'de durmali: %r" % r)

# onizle bugunu oku'ya gecirir; tek tekrar kayitliysa yalniz o satir 'var'.
r = J.calistir("AYS", DOSYALAR, """(() => { const ham = %r;
  const u = R.Takvim.oku(ham, %r).etkinlikler.map(e => e.uid);
  R.S.calendar = [{ id:1, kind:'tatil', from:'2026-11-04', to:null, icsUid:u[1] }];
  return R.Takvim.onizle(ham, %r).satirlar.map(s => [s.bas, s.durum, s.tekrar]); })()"""
               % (ics(["UID:w1", "SUMMARY:Kulup", "DTSTART;VALUE=DATE:20261102", "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=3"]),
                  BUGUN, BUGUN), HAZIRLIK)
if r != [["2026-11-02", "yeni", True], ["2026-11-04", "var", True], ["2026-11-09", "yeni", True]]:
    hata.append("onizle acilmis tekrarlari gostermeli, kayitli tekrar 'var': %r" % r)

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("ays takvim tekrar kabul: daily, weekly byday/interval, monthly, count/until, exdate, recurrence-id, 365 gun ve 500 sinir.")
