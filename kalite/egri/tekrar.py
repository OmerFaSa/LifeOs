"""Tekrar (plan §6, King). Bugün ölçülemez: değer yok, gereken ve komut aşağıda."""
AD = 'Tekrar'
TANIM = 'dersi alınmış hatanın yinelenme oranı (düşük iyi)'


def olc(kok):
    return {"deger": None, "birim": 'oran', "etiket": "veri yok", "durum": "ölçülmedi",
            "ayrinti": {"gereken": 'aynı hatayı tanıyan hata kimliği ve sayacı (yok), ders defteri ve ardışık iki King-Bench sonucu (çalışan King)'},
            "komut": 'python tools/king_bench/oz.py <bench-sonuc.json> <önceki.json>; yapılacak: hata kimliği ve sayacı'}
