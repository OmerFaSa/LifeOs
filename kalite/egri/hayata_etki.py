"""Sistem · Hayata etki (plan §6, Sistem). Bugün ölçülemez: değer yok, gereken ve komut aşağıda."""
AD = 'Sistem · Hayata etki'
TANIM = 'haftada tamamlanan öğrenme adımı, süreklilik'


def olc(kok):
    return {"deger": None, "birim": 'adım/hafta', "etiket": "veri yok", "durum": "ölçülmedi",
            "ayrinti": {"gereken": 'göç sonrası tek veride sahibinin gerçek kullanımı (Yol motorunda tamamlanan adımlar ve günler); bu araç sahibinin verisini okumaz'},
            "komut": 'yapılacak: göç sonrası tek depodan haftalık özet (Yol motoru kaydı)'}
