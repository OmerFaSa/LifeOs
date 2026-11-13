"""Öğretme (plan §6, King). Bugün ölçülemez: değer yok, gereken ve komut aşağıda."""
AD = 'Öğretme'
TANIM = 'dersten önce/sonra mini sınav farkı'


def olc(kok):
    return {"deger": None, "birim": 'puan farkı', "etiket": "veri yok", "durum": "ölçülmedi",
            "ayrinti": {"gereken": "ön test → King'in dersi → son test düzeneği (yok) ve dersi anlatan çalışan model; gerçek ölçüm için sahibinin ön ve son test cevapları"},
            "komut": 'python tools/king_bench/bench.py --paket ogretmen,ogrenme (gerçek tarayıcı + HKM + model); yapılacak: ön/son test düzeneği'}
