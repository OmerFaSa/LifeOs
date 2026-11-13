"""Anlama (plan §6, King): etiketli gerçek mesajlarda niyet isabeti.

Gerçek eğri kalite/veri/anlama.jsonl'den okunur (sahibinin etiketlediği mesaj; biçim kalite/veri/README.md).
Set boşken eğri ölçülmedi kalır. Yanındaki «vekil: sınav cümleleri» tahmin etiketlidir, eğrinin yerine geçmez.
"""
import json
from pathlib import Path

import _sinav

AD = "Anlama"
TANIM = "etiketli gerçek mesajlarda niyet isabeti"
SET = "kalite/veri/anlama.jsonl"


def etiketli(kok):
    """Geçerli satırlar ve geçersiz satır sayısı (sahibinin elle yazdığı dosya: biçim denetlenir)."""
    gecerli, gecersiz = [], 0
    try:
        metin = (Path(kok) / SET).read_text(encoding="utf-8")
    except OSError:
        return gecerli, gecersiz
    for satir in filter(str.strip, metin.splitlines()):
        try:
            r = json.loads(satir)
            tamam = (isinstance(r.get("metin"), str) and r["metin"].strip() and r.get("niyet") in _sinav.NIYETLER
                     and isinstance(r.get("kaynak"), str) and r.get("king", r["niyet"]) in _sinav.NIYETLER)
        except (ValueError, AttributeError):
            tamam = False
        if tamam:
            gecerli.append(r)
        else:
            gecersiz += 1
    return gecerli, gecersiz


def vekil(kok):
    s = _sinav.satirlar(kok)
    if not s:
        return None
    sayac, disari = {}, 0
    for r in s["satirlar"]:
        beklenen = {_sinav.niyet(b) for b in r["b"]}
        if len(beklenen) != 1 or None in beklenen:
            disari += 1  # beklenen kararlar iki niyete ya da belirsize düşüyor: sayılmaz
            continue
        n = beklenen.pop()
        t = sayac.setdefault(n, [0, 0])
        t[0] += _sinav.niyet(r["karar"]) == n
        t[1] += 1
    isabet, toplam = sum(v[0] for v in sayac.values()), sum(v[1] for v in sayac.values())
    return {"ad": "vekil: sınav cümleleri", "deger": round(isabet / toplam, 3) if toplam else None, "birim": "oran",
            "etiket": "tahmin", "isabet": isabet, "cumle": toplam, "disarida": disari,
            "niyet_basina": {k: f"{a}/{b}" for k, (a, b) in sorted(sayac.items())},
            "sinav_tam_karar": f"{sum(r['ok'] for r in s['satirlar'])}/{len(s['satirlar'])}",
            "olculdu": s["tarih"], "kod": s["kod"], "komut": _sinav.KOMUT,
            "neden_tahmin": "cümleler sahibinin gerçek mesajı değil, bugünkü King'e göre yazılmış hazır cümleler; "
                            "karar→niyet eşlemesi kalite/egri/_sinav.py ESLEME (sahibinin etiketi değil); "
                            "«arastir» niyetli cümle yok; model çağrılmaz, Merkez'e giden cümle «sohbet» sayılır"}


def olc(kok):
    satir, gecersiz = etiketli(kok)
    kingli = [r for r in satir if "king" in r]
    deger = round(sum(r["king"] == r["niyet"] for r in kingli) / len(kingli), 3) if kingli else None
    ayrinti = {"etiketli": len(satir), "gecersiz_satir": gecersiz, "king_kararli": len(kingli), "set": SET,
               "gereken": "sahibinin etiketlediği gerçek mesajlar; her satırda King'in o an seçtiği niyet (king). "
                          "«Yanlış anladın» işareti (plan: gerçek kullanımdan ölçüm seti) yazılınca set dolar; yalnız işaretlenen mesaj girerse "
                          "isabet hep 0 çıkar, işaretlenmeyenlerden de örneklem gerekir"}
    v = vekil(kok)
    if v:
        ayrinti["vekil"] = v
    return {"deger": deger, "birim": "oran", "etiket": "ölçüldü" if deger is not None else "veri yok",
            "durum": "ölçüldü" if deger is not None else "ölçülmedi", "ayrinti": ayrinti,
            "komut": f"{SET} doldurulunca python kalite/olcum.py; vekil: {_sinav.KOMUT}"}
