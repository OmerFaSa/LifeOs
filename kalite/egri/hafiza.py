"""Hafıza (plan §6, King). Bugün ölçülemez: değer yok, gereken ve komut aşağıda."""
AD = 'Hafıza'
TANIM = 'eski bilgiyi doğru hatırlama, bağlam boyutu'


def olc(kok):
    return {"deger": None, "birim": 'oran', "etiket": "veri yok", "durum": "ölçülmedi",
            "ayrinti": {"gereken": 'HKM hafızası ve gömme modeli (Ollama) çalışırken arama doğruluğu; bağlam boyutu ekseni (jeton bütçeli bağlam derleyici, A7) yok'},
            "komut": 'python tools/hafiza_olcum.py (p1/p3; HKM + Ollama); yapılacak: bağlam bütçesi ekseni'}
