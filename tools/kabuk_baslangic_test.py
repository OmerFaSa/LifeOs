#!/usr/bin/env python3
"""tools/kabuk_baslangic.py testi, uydurma tek depoyla ve eski modullerin gercek bicimleriyle: not, kayit (olcu, ogun,
antrenman, calisma, uyku), kart (AYS ve ESP), plan (AYS gunu, hafta sozlesmesi, program; SPI hafta sablonu), soru (AYS
denemesi, hata, gun sorusu), Yol (AYS konu durumu, gercek Akademik asamasiyla) pakete girer; bos not ve sinir disi olcu
girmez; iki yuzu olmayan kart pakete girmeyen cikti sayilir; King sohbeti «yalniz depoda» kalir ve nedeni yazilir;
hafta tarihi AYS profilinin ilk gununden; kimlik icerikten; ekrana icerik basilmaz; depo degismez.

  python tools/kabuk_baslangic_test.py
"""
import hashlib
import io
import json
import os
import sqlite3
import sys
import tempfile
from contextlib import redirect_stdout
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
sys.dont_write_bytecode = True
sys.path.insert(0, str(KOK / "sistem"))
sys.path.insert(0, str(KOK / "tools"))
import goc  # noqa: E402
import kabuk_baslangic  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass
kirmizi = 0
GIZLI = "GIZLI-ICERIK-9c1"


def dogru(ad, kosul, ek=""):
    global kirmizi
    print(("  ✓ " if kosul else "  ✕ ") + ad + ("" if kosul else "  %r" % (ek,)))
    kirmizi += 0 if kosul else 1


# Gercek Akademik asamasi: AYS tr-01 konusunun anlatim dersi ve ilk alistirmasi (Yol.GOC.aysKonu ayni eslemeyi yapar)
AK = json.loads((KOK / "alan" / "akademik" / "asama-1.json").read_text(encoding="utf-8"))
KAYNAK = next(k["id"] for k in AK["kaynaklar"] if k.get("bolum") == "R.KONU_ANLATIM['tr-01']")
DERS = next(d for u in AK["uniteler"] for d in u["dersler"] if (d.get("kaynak") or [None])[0] == KAYNAK)
A0 = DERS["alistirmalar"][0]

SATIRLAR = [
    ("not", "ays/main", "defter/n1", {"id": "n1", "baslik": GIZLI, "govde": GIZLI, "at": "2026-11-01T10:00:00Z", "guncel": "2026-11-01T10:00:00Z"}),
    ("not", "ays/main", "defter/n2", {"id": "n2", "baslik": "", "govde": "", "at": "2026-11-01T10:00:00Z", "guncel": "2026-11-01T10:00:00Z"}),   # bos: ret
    ("olcum", "spi/ben", "vitals/2026-11-01", {"date": "2026-11-01", "weight": 72, "water": 1500}),
    ("olcum", "spi/ben", "vitals/2026-11-02", {"date": "2026-11-02", "hrv": 987654}),                                                             # sinir disi: ret
    ("spi.meals", "spi/ben", "meals/2026-11-01", {"date": "2026-11-01", "rows": [{"id": "m1", "slot": "ogle", "note": "", "at": "2026-11-01T12:00:00Z",
                                                                                   "items": [{"foodId": "yumurta", "g": 100, "cert": "measured"}]}]}),
    ("spi.workouts", "spi/ben", "workouts/w1", {"id": "w1", "date": "2026-11-01", "kind": "cardio", "minutes": 30, "rpe": None, "name": "Koşu", "items": []}),
    ("ays.days", "ays/main", "days/2026-11-03", {"date": "2026-11-03", "sleepHours": 7, "blocks": [
        {"id": "b1", "slot": "Sabah", "subject": "Matematik", "topic": "Türev", "targetMin": 50, "actualMin": 45, "status": "done",
         "targetQ": 30, "actualQ": 28, "correctQ": 20, "startedAt": "2026-11-03T07:00:00Z"},
        {"id": "b2", "slot": "Öğle", "subject": "Fizik", "targetMin": 40, "status": "skipped", "skipReason": GIZLI}]}),
    ("profil", "ays/main", "profile/main", {"startDate": "2026-09-07", "name": GIZLI}),
    ("plan_blogu", "ays/main", "weeks/w02", {"n": 2, "title": "Hafta iki", "questionTarget": 400, "capacityMin": 900, "mainTopics": [{"name": "Türev", "subjectId": "ayt-mat"}]}),
    ("plan_blogu", "ays/main", "plan/main", {"meta": {"generatedAt": "2026-09-07T08:00:00Z", "dropped": []}, "weeks": [{"n": 1, "title": "Başlangıç", "q": 300, "items": []}]}),
    ("spi.haftaplan", "spi/ben", "haftaplan/h1", {"id": "h1", "tur": "hareket", "ad": "Yürüyüş", "gunler": [{"ne": "yürü", "dk": 30}, None, None, None, None, None, None]}),
    ("ays.cards", "ays/main", "cards/c1", {"id": "c1", "front": GIZLI, "back": "Cevap", "dueAt": "2026-11-20", "lastReviewedAt": "2026-11-13", "history": [{"rating": "good"}]}),
    ("esp.cards", "esp/ben", "cards/e1", {"id": "e1", "front": "hola", "back": "merhaba", "due": "2026-11-20", "interval": 3, "reps": 2, "lapses": 0, "lang": "es"}),
    ("ays.exams", "ays/main", "exams/d1", {"id": "d1", "date": "2026-10-19", "type": "Tam TYT", "family": "TYT", "kind": "full", "publisher": "345", "duration": 165,
                                         "tests": [{"name": "Türkçe", "correct": 30, "wrong": 8, "blank": 2, "blankCert": "measured"}]}),
    ("ays.errors", "ays/main", "errors/r1", {"id": "r1", "tag": "K", "examId": "d1", "subjectId": "tyt-turkce", "createdAt": "2026-10-19T12:00:00Z"}),
    ("ays.topics", "ays/main", "topics/tyt-turkce", {"subjectId": "tyt-turkce", "states": {
        "tr-01": {"state": "practicing", "first": 82, "firstAt": "2026-10-01", "second": None, "secondAt": None, "note": "",
                  "ornek": {"0": {"h": A0["dogru"], "d": True, "at": "2026-09-30T09:00:00.000Z"}}}}}),
    ("sohbet", "hkm/conversations", "conversations/1", {"id": 1, "user_message": GIZLI, "bot_reply": GIZLI}),                                    # King: yalniz depoda
    ("profil", "spi/ben", "profile", {"heightCm": 175, "birthYear": 2001, "sex": "male", "goal": "cut", "weightKg": 70, "name": GIZLI}),
    ("esp.prefs", "esp/ben", "prefs/x", {"metin": GIZLI}),                                                                                         # sahibi motor yok
]


def depo_kur(yol):
    c = sqlite3.connect(yol)
    c.executescript(goc.SEMA)
    for i, (tur, alan, yol_, govde) in enumerate(SATIRLAR):
        c.execute("INSERT INTO kayit(id, tur, tur_surum, alan, yol, govde, etiket, hlc, cihaz, silindi, kaynak, goc_id) VALUES (?,?,1,?,?,?,?,?,?,0,?,?)",
                  ("k%d" % i, tur, alan, yol_, json.dumps(govde, ensure_ascii=False), "{}", "0001-%d" % i, "cPC", "hesap", "g1"))
    c.execute("INSERT INTO kayit(id, tur, tur_surum, alan, yol, govde, etiket, hlc, cihaz, silindi, kaynak, goc_id) VALUES ('sil',?,1,?,?,NULL,'{}','0002','cPC',1,'hesap','g1')",
              ("not", "ays/main", "defter/silinen"))
    c.commit()
    c.close()


with tempfile.TemporaryDirectory() as t:
    depo, cikti = os.path.join(t, "lifeos.db"), os.path.join(t, "veri", "kabuk-baslangic.json")
    depo_kur(depo)
    once = hashlib.sha256(open(depo, "rb").read()).hexdigest()
    yazi = io.StringIO()
    with redirect_stdout(yazi):
        kod = kabuk_baslangic.main(["--depo", depo, "--cikti", cikti, "--zaman", "1763000000000"])
    p, ekran = json.load(open(cikti, encoding="utf-8")), yazi.getvalue()
    print("paket")
    dogru("çıkış 0, dosya yazıldı, biçim imi var", kod == 0 and p["lifeos_kabuk_baslangic"] == 1 and p["uretildi"] == 1763000000000, kod)
    dogru("geçerli not pakette, boş not ve silinen yok", len(p["notlar"]) == 1 and p["notlar"][0]["baslik"] == GIZLI, p["say"])
    turler = sorted((k["tur"], k["gun"]) for k in p["kayitlar"])
    dogru("kayıtlar: ölçü (kilo, su), öğün, antrenman, çalışma, uyku; sınır dışı ölçü girmedi",
          turler == sorted([("kilo", "2026-11-01"), ("su", "2026-11-01"), ("ogun", "2026-11-01"), ("hareket", "2026-11-01"),
                            ("calisma", "2026-11-03"), ("uyku", "2026-11-03")]), turler)
    dogru("kayıtlar motor biçiminde: değer ve kesinlik etiketi", all(set(k) >= {"id", "tur", "gun", "deger"} and all("k" in v and "v" in v for v in k["deger"].values()) for k in p["kayitlar"]))
    dogru("kartlar: AYS ve ESP kartı, iki yüzüyle", sorted(k["id"] for k in p["kartlar"]) == ["ays-kart:c1", "esp-kart:e1"] and all(k["on"] and k["arka"] for k in p["kartlar"]), p["kartlar"])
    pl = p["plan"]
    dogru("plan: AYS günü blokları ve durumuyla", [g["gun"] for g in pl["gunler"]] == ["2026-11-03"] and [b["durum"] for b in pl["gunler"][0]["bloklar"]] == ["yapildi", "atlandi"], pl["gunler"])
    hed = {h["id"]: h for h in pl["hedefler"]}
    dogru("plan: hafta sözleşmesi ve program; hafta başı AYS profilinin ilk gününden", set(hed) == {"goc:ays:hafta:w02", "goc:ays:program", "goc:ays:program:w01"}
          and hed["goc:ays:hafta:w02"]["bas"] == "2026-09-14" and hed["goc:ays:program:w01"]["bas"] == "2026-09-07", sorted(hed))
    dogru("plan: SPİ hafta şablonu", [s["id"] for s in pl["sablonlar"]] == ["spi:haftaplan:h1"], pl["sablonlar"])
    so = p["soru"]
    dogru("soru: deneme, hata ve gün sorusu (eski kayıt)", [x["id"] for x in so["denemeler"]] == ["d1"] and [x["id"] for x in so["hatalar"]] == ["r1"]
          and [(x["id"], x["etiket"]) for x in so["gunler"]] == [("ays:gun:2026-11-03", "eski kayıt")], so)
    y = p["yol"].get("akademik.1") or {}
    dogru("yol: konu durumu «eski kayıt», cevap gerçek alıştırmaya; ölçüm ve not Yol'a girmez",
          list(y.get("eski", {})) == ["ays:tyt-turkce/tr-01"] and y["eski"]["ays:tyt-turkce/tr-01"]["durum"] == "practicing"
          and list(y.get("cevaplar", {})) == [A0["id"]] and "first" not in json.dumps(y), y)
    dogru("eski profil Beden alanlarına döndü (kilo ve ad girmez)", p["beden"] == {"cinsiyet": "erkek", "boy": 175, "dogumYili": 2001, "hedef": "ver"}, p["beden"])
    dogru("sayılar içerikle tutuyor", p["say"] == {"notlar": 1, "kayitlar": 6, "kartlar": 2, "plan": 5, "soru": 3, "yol": 2}, p["say"])
    dogru("ekrana kişisel içerik basılmadı", GIZLI not in ekran and "Cevap" not in ekran and "hola" not in ekran, ekran[:200])
    satir = [l for l in ekran.splitlines() if l.startswith("| ")]
    dogru("King sohbeti yalnız depoda, nedeniyle", any("hkm:conversations" in l and "King" in l and l.rstrip().endswith("| 1 |") for l in satir), satir)
    dogru("sahibi olmayan rota da yalnız depoda, nedeniyle", any("esp:prefs" in l and "Çekirdek" in l for l in satir), satir)
    dogru("iki yüzü olmayan kart (kapanış ölçümü) pakete girmeyen çıktı sayılır", any(l.startswith("| tekrar.aysKapanis | 1 | 0 |") and "1 (iki yüzü" in l for l in satir), satir)
    dogru("göremedim listesi EKSIK'ten", "Göremedim" in ekran and "distractions" in ekran)
    dogru("depo değişmedi, geçici kopya kalmadı", hashlib.sha256(open(depo, "rb").read()).hexdigest() == once
          and not [a for a in os.listdir(tempfile.gettempdir()) if a.startswith("lifeos-kabuk-baslangic-")])
    with redirect_stdout(io.StringIO()):
        kabuk_baslangic.main(["--depo", depo, "--cikti", cikti + "2", "--zaman", "1763999999999"])
    iki = json.load(open(cikti + "2", encoding="utf-8"))
    dogru("kimlik içerikten: aynı depo aynı kimlik ve aynı içerik (zaman değişse de)", iki["kimlik"] == p["kimlik"]
          and {k: v for k, v in iki.items() if k != "uretildi"} == {k: v for k, v in p.items() if k != "uretildi"})
    # parti sınırı: her grup ayrı Node çağrısına düşse de içerik aynı (Yol parçaları ve plan kimlikleri partiler arası birleşir)
    eski_parti, kabuk_baslangic.PARTI = kabuk_baslangic.PARTI, 1
    try:
        with redirect_stdout(io.StringIO()):
            kabuk_baslangic.main(["--depo", depo, "--cikti", cikti + "4", "--zaman", "1763000000000"])
    finally:
        kabuk_baslangic.PARTI = eski_parti
    dogru("parti parti çevirmek aynı paketi verir", json.load(open(cikti + "4", encoding="utf-8")) == p)
    with redirect_stdout(io.StringIO()):
        kod = kabuk_baslangic.main(["--depo", os.path.join(t, "yok.db"), "--cikti", cikti + "3"])
    dogru("depo yoksa çıkış 1, dosya yazılmaz", kod == 1 and not os.path.exists(cikti + "3"))

print("Kabuk başlangıç paketi: " + ("temiz" if not kirmizi else "%d KIRMIZI" % kirmizi))
sys.exit(1 if kirmizi else 0)
