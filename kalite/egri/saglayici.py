"""Sağlayıcı kalitesi (plan §6, King). Bugün ölçülemez: değer yok, gereken ve komut aşağıda."""
AD = 'Sağlayıcı kalitesi'
TANIM = 'istek başına jeton, gereksiz çağrı'


def olc(kok):
    return {"deger": None, "birim": 'jeton/istek', "etiket": "veri yok", "durum": "ölçülmedi",
            "ayrinti": {"gereken": 'gerçek sağlayıcıya (Claude ya da yerel model) giden istekler ve boşa çağrı sayacı (yok); king_olcum.py --kuru sahte taşıyıcıyla koşar, gerçek jeton vermez'},
            "komut": 'python tools/king_olcum.py sohbet --config <ayar> (model çağırır: süre, jeton); yapılacak: boşa çağrı sayacı'}
