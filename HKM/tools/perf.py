# -*- coding: utf-8 -*-
"""Dokuz aylik ufuk — HKM sorgulari 270 gunluk ambarda ne kadar suruyor?

Uc arayuzde perfcheck var; HKM'de yoktu. Bos bir ambarda her sorgu hizlidir:
asil soru dokuz ayin sonunda brifingin hala acilip acilmadigi.
"""
import datetime
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core import bam, cross, db, impact, manager, meydan, patron, twin, weekly  # noqa: E402

GUN = 270
BASE = datetime.date(2026, 1, 1)


GUNDE_GONDERIM = 6      # isaret araligi 60 dk olsa da kullanici gun boyu
                        # acip kapatir; gunde birkac gonderim gercekcidir


def kur(con):
    ay = {"ays": ["questions", "study_minutes", "mock_net", "mock_net_baseline",
                  "exam_days_left", "plan_blocks", "plan_done", "paragraph_done",
                  "problem_done", "correct_questions", "exam_count",
                  "cards_total", "cards_due", "errors_open"],
          "spi": ["sleep_hours", "recovery", "hrv", "hrv_baseline", "weight",
                  "rhr", "sbp", "dbp", "waist", "water", "protein_g", "kcal",
                  "train_minutes", "symptom_count"],
          "esp": ["retention", "retention_cards", "practice_minutes",
                  "synthesis_gap_days", "sessions", "cards_total", "cards_due",
                  "disc.lang.minutes", "disc.music.minutes", "disc.philo.minutes"]}
    n = 0
    for i in range(GUN):
        d = (BASE + datetime.timedelta(days=i)).isoformat()
        for mod, alanlar in ay.items():
            for k in range(GUNDE_GONDERIM):
                metrics = {}
                for j, ad in enumerate(alanlar):
                    metrics[ad] = {"value": 50 + ((i + j + k) % 40),
                                   "cert": "measured" if j % 3 else "computed"}
                db.insert_event(con, mod, d, "%sT%02d:00:00" % (d, 8 + k * 2),
                                {"module": mod, "date": d, "metrics": metrics})
                n += 1
        # Gunde bir oneri ve iki konusma satiri: ambar yalniz olcumden
        # ibaret degil.
        did = db.insert_decision(con, d, 1, "Öneri cümlesi.", d + "T10:00:00",
                                 key="bio_red")
        db.set_decision_state(con, did, "accepted" if i % 2 else "declined",
                              d + "T20:00:00")
        con.execute("INSERT INTO conversations(channel, role, text, "
                    "audio_retained, created_at) VALUES (?,?,?,0,?)",
                    ("local", "user", "durum", d + "T20:01:00"))
        con.execute("INSERT INTO conversations(channel, role, text, "
                    "audio_retained, created_at) VALUES (?,?,?,0,?)",
                    ("local", "manager", "HKM · " + d, d + "T20:01:01"))
    # Meydan: bir haftalik BAM urunu (her gun iki kayit) ve dolu bir deste.
    for i in range(GUN - 7, GUN):
        d = (BASE + datetime.timedelta(days=i)).isoformat()
        for j in range(2):
            bam.kayit_ekle(con, "materyal", "Soru seti %d-%d" % (i, j), {"tur": "soru", "maddeler": [
                {"soru": "S%d?" % k, "secenekler": ["a", "b", "c", "d", "e"], "dogru": "B"}
                for k in range(10)]}, now=d + "T11:00:00")
    for k in range(300):
        meydan.kart_yap(con, "Ön %d" % k, "Arka %d" % k, now=son_an())
    con.commit()
    return n


def son_an():
    return (BASE + datetime.timedelta(days=GUN - 1)).isoformat() + "T12:00:00"


def olc(ad, fn, butce_ms):
    t = time.time()
    fn()
    ms = (time.time() - t) * 1000
    isaret = "✓" if ms <= butce_ms else "✕"
    # Butcenin yarisini gecen bir sorgu bugun «gecti» yazar ama iki yil
    # sonra gecmez. Buyume gorunur kalmali: sessizce dolan bir butce,
    # dolana kadar hicbir sey soylemez.
    not_ = "  ← bütçenin yarısını geçti, büyümesi izlenmeli" \
        if butce_ms / 2 < ms <= butce_ms else ""
    print("  %s %-22s %7.1f ms   (bütçe %d)%s" % (isaret, ad, ms, butce_ms, not_))
    return ms <= butce_ms


def main():
    yol = os.environ.get("HKM_PERF_DB", ":memory:")
    con = db.connect(yol)
    t = time.time()
    n = kur(con)
    son = (BASE + datetime.timedelta(days=GUN - 1)).isoformat()
    print("\nDokuz aylık ufuk — %d gün, %d olay (%.1f sn'de kuruldu)\n"
          % (GUN, n, time.time() - t))

    temiz = True
    temiz &= olc("brifing", lambda: manager.brief(con, son), 400)
    temiz &= olc("ikiz (14 gün)", lambda: twin.snapshot(con, son, 14), 200)
    temiz &= olc("ikiz (270 gün)", lambda: twin.snapshot(con, son, 270), 1500)
    temiz &= olc("seri (60 gün)", lambda: twin.series(con, son, 60), 400)
    temiz &= olc("çapraz (60 gün)", lambda: cross.scan(con, son, 60), 500)
    temiz &= olc("haftalık", lambda: weekly.report(con, son), 1200)
    temiz &= olc("etki", lambda: impact.summary(con), 300)
    temiz &= olc("günün mesajı", lambda: patron.daily_message(con, son), 500)
    temiz &= olc("meydan akışı", lambda: meydan.akis(con, son, now=son_an()), 400)
    temiz &= olc("meydan destesi", lambda: meydan.deste(con, now=son_an()), 150)
    print("\n%s\n" % ("Bütün sorgular bütçede." if temiz
                      else "BÜTÇE AŞILDI — yukarıdaki ✕ satırlarına bak."))
    return 0 if temiz else 1


if __name__ == "__main__":
    raise SystemExit(main())
