# -*- coding: utf-8 -*-
"""Alan adlari — makinenin adi ve INSANIN adi.

   Ambardaki anahtar `sleep_hours`tir ve oyle kalmalidir: uc sistem bu adla
   gonderir, testler bu adla arar, yedek bu adla tasinir. Ama ekranda
   `sleep_hours` yazmak, kullaniciya kendi verisini yabanci bir dilde
   gostermektir.

   Iki kural:

   1. TERCUME EKRAN ICINDIR, VERI ICIN DEGIL. Buradaki karsilik hicbir
      hesaba girmez; anahtar her yerde ingilizce kalir. Adlandirma bir
      SUNUM katmanidir ve tek yerden gelir.

   2. KARSILIGI OLMAYAN ANAHTAR UYDURULMAZ. Sozlukte yoksa anahtarin
      kendisi gosterilir. «Bilmedigim alani guzel bir Turkce ile ortmek»,
      yanlis bir ad uretmenin kibar bicimidir.
"""

# Uc sistemin gonderdigi olcumler.
METRIK = {
    # AYS
    "questions": "çözülen soru",
    "study_minutes": "çalışma süresi (dk)",
    "mock_net": "deneme neti",
    "mock_net_baseline": "deneme neti tabanı",
    "exam_days_left": "sınava kalan gün",
    "topics_done": "biten konu",
    "topics_total": "toplam konu",
    "plan_adherence": "plana uyum",
    "blocks_done": "biten blok",
    "blocks_planned": "planlanan blok",
    "correct_ratio": "doğru oranı",
    "correct_questions": "doğru soru",
    "exam_count": "deneme sayısı",
    "plan_blocks": "plandaki blok",
    "plan_done": "biten plan bloğu",
    "paragraph_done": "çözülen paragraf",
    "problem_done": "çözülen problem",
    "errors_open": "açık hata kartı",
    # SPİ
    "sleep_hours": "uyku (saat)",
    "recovery": "toparlanma skoru",
    "hrv": "HRV",
    "hrv_baseline": "HRV tabanı",
    "steps": "adım",
    "resting_hr": "istirahat nabzı",
    "weight": "kilo",
    "protein_g": "protein (g)",
    "calories": "kalori",
    "water_ml": "su (ml)",
    "training_minutes": "antrenman (dk)",
    "train_minutes": "antrenman (dk)",
    "kcal": "kalori",
    "water": "su (ml)",
    "rhr": "istirahat nabzı",
    "sbp": "büyük tansiyon",
    "dbp": "küçük tansiyon",
    "waist": "bel (cm)",
    "symptom_count": "belirti kaydı",
    # ESP
    "retention": "kalıcılık",
    "retention_cards": "kalıcılık kart sayısı",
    "practice_minutes": "pratik süresi (dk)",
    "synthesis_gap_days": "sentezsiz geçen gün",
    "cards_due": "vadesi gelen kart",
    "cards_done": "çalışılan kart",
    "cards_total": "toplam kart",
    "sessions": "oturum",
    "reading_minutes": "okuma (dk)",
    # UCUNDE DE AYNI: seviye sistemi (bkz. brand/seviye/). HKM'nin kendi
    # XP'si YOKTUR ve olmamali — ucunun uzerinde degil yaninda durur;
    # burada yalnizca GORUR.
    "xp_today": "bugünkü XP",
    "xp_total": "toplam XP",
    "level_step": "seviye basamağı (1–18)",
    "level_tier": "kademe (1–6)",
    "level_sub": "kademe içindeki adım (1–3)",
    # ROZET SAYACLARI. Modulun KENDI rozeti degil, merkezin toplamak
    # icin kullandigi ham sayilardir: uc arayuz birbirini gormez, «butun
    # alanlarda 5000 saat» gibi bir rozet yalniz burada hesaplanabilir.
    "badge_days": "kayıtlı gün",
    "badge_hours": "ölçülmüş saat",
    "badge_tasks": "tamamlanan görev",
    "badge_focus_hours": "bir günde en uzun odak (saat)",
    "badge_streak_months": "kesintisiz ay",
    "badge_count": "kazanılmış rozet",
}

# Esikler: kullanicinin ELLE degistirdigi sayilar. Burada anlam, adin
# kendisinden daha onemlidir — «bio.hrv_drop_pct» bir sayidir ama neyin
# sayisi oldugu ancak yazilinca belli olur.
ESIK = {
    "bio.sleep_hours_min": "Uyku tabanı — altına inince VP uyarır",
    "bio.sleep_hours_critical": "Uyku kritik sınırı — altı ağır uyarıdır",
    "bio.hrv_drop_pct": "HRV düşüşü — tabana göre yüzde kaç düşünce uyarılır",
    "bio.recovery_floor": "Toparlanma tabanı — altına inince VP uyarır",
    "academic.questions_min": "Günlük soru tabanı",
    "academic.study_minutes_min": "Günlük çalışma tabanı (dk)",
    "academic.net_drop_pct": "Net düşüşü — tabana göre yüzde kaç düşünce uyarılır",
    "intellect.retention_floor": "Kalıcılık tabanı (0–1)",
    "intellect.retention_min_cards": "Kalıcılık için en az kaç kart gerekli",
    "intellect.practice_minutes_min": "Günlük pratik tabanı (dk)",
    "intellect.synthesis_gap_max": "Sentezsiz geçebilecek en çok gün",
    "intellect.synthesis_gap_days": "Sentezsiz geçebilecek en çok gün",
}

MODUL = {"ays": "AYS", "spi": "SPİ", "esp": "ESP"}


def metrik(anahtar):
    """Ekran adi. Sozlukte yoksa ANAHTARIN KENDISI doner."""
    return METRIK.get(anahtar, anahtar)


def esik(grup, ad):
    return ESIK.get("%s.%s" % (grup, ad), "")


def modul(anahtar):
    return MODUL.get(anahtar, str(anahtar).upper())
