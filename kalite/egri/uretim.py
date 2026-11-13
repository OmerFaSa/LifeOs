"""Üretim (plan §6, King). Bugün ölçülemez: değer yok, gereken ve komut aşağıda."""
AD = 'Üretim'
TANIM = 'üretilen soru/kartın hakem puanı, hata oranı'


def olc(kok):
    return {"deger": None, "birim": 'oran', "etiket": "veri yok", "durum": "ölçülmedi",
            "ayrinti": {"gereken": "King'in ürettiği soru ve kartlardan örneklem, cevap anahtarı ve sahibinin (insan hakem) puanı; üretim için çalışan model"},
            "komut": 'yapılacak: örneklem + cevap anahtarı + hakem puanı seti (kalite/veri/uretim.jsonl) ve puanlayan dosya'}
