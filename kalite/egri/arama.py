"""Arama (plan §6, King). Bugün ölçülemez: değer yok, gereken ve komut aşağıda."""
AD = 'Arama'
TANIM = 'kaynaklı cevabın doğruluğu, hafızaya eklenenin isabeti'


def olc(kok):
    return {"deger": None, "birim": 'oran', "etiket": "veri yok", "durum": "ölçülmedi",
            "ayrinti": {"gereken": 'gerçek sorgu seti, her sorgu için doğru cevap ve kaynak etiketi; tek Arama motoru (A7: bam.py ve arastir.py birleşince)'},
            "komut": 'yapılacak: gerçek sorgu seti + A7 Arama motoru'}
