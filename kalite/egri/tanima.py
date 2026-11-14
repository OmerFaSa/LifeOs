"""Tanıma (plan §6, King). Bugün ölçülemez: değer yok, gereken ve komut aşağıda."""
AD = 'Tanıma'
TANIM = 'doğru ve yerinde kullanılan kişi bilgisi oranı'


def olc(kok):
    return {"deger": None, "birim": 'oran', "etiket": "veri yok", "durum": "ölçülmedi",
            "ayrinti": {"gereken": 'sahibinin doğruladığı kişi bilgisi yoklama seti ve çalışan King; P6 sonrası hafıza kayıtları tek depoda (kisi_bilgisi) ama yoklama sorusu ve doğru cevap yok (tarayıcı + HKM + model); King-Bench hafiza paketi 233 günlük klonla koşar, sahibinin kendisiyle değil'},
            "komut": 'python tools/king_bench/bench.py --paket hafiza; python tools/king_bench/bilinc_bench.py (gerçek tarayıcı + HKM + model)'}
