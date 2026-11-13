"""Kendini eğitme (plan §6, King). Bugün ölçülemez: değer yok, gereken ve komut aşağıda."""
AD = 'Kendini eğitme'
TANIM = 'hatanın derse dönüşme ve havuza girme oranı'


def olc(kok):
    return {"deger": None, "birim": 'oran', "etiket": "veri yok", "durum": "ölçülmedi",
            "ayrinti": {"gereken": 'hata kaydı ve ders defteri (hata → kural cümlesi → sahibinin onayı → ortak havuz); ikisi de bugün yok'},
            "komut": 'yapılacak: A7 ders defteri; oran = derse dönen hata / kaydedilen hata'}
