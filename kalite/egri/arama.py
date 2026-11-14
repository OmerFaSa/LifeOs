"""Arama (plan §6, King): sahibin gerçek sorularında kaynaklı cevabın isabeti, yeni Arama'ya karşı eski BAM.

Set yalnız bu bilgisayarda, git dışı: LIFEOS_ARAMA_SET ya da kalite/veri/yerel/arama-aday.jsonl (kurucu:
kalite/egri/_yerel_set.py; etiket: sistem/etiket.py, POST /api/kalite/etiket). Satır: {id, soru, adaylar: [{no, motor,
baslik, ozet, kaynak, kesinlik}], etiket, etiketleyen}. Etiket: ilgili aday numaraları ([] = hiçbiri) ya da «arama-degil».

İsabet (motor başına): arama sorusu olan satırlarda motorun en az bir ilgili adayı var. Yalnız sahibin etiketi
(etiketleyen «sahip») ölçüldü sayılır; model taslağı (etiketleyen «model») ayrıntıda «tahmin», eğrinin değeri olmaz.
Adaylar çevrimdışı (ağsız, modelsiz) üretildi: web ve model yolu bu sayıya girmez.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "sistem"))
import etiket  # noqa: E402

AD = 'Arama'
TANIM = 'kaynaklı cevabın doğruluğu, hafızaya eklenenin isabeti'
ORTAM = "LIFEOS_ARAMA_SET"
SET = "kalite/veri/yerel/arama-aday.jsonl"
MOTORLAR = ("arama", "bam")


def puan(satirlar):
    """Etiketli arama sorularında motor başına isabet ve gürültü (ilgisiz aday gösterilen soru)."""
    soru = [r for r in satirlar if r["etiket"] != etiket.ARAMA_DEGIL]
    out = {"soru": len(soru), "arama_degil": len(satirlar) - len(soru)}
    for m in MOTORLAR:
        hit = gurultu = 0
        for r in soru:
            benim = {a["no"] for a in r["adaylar"] if a.get("motor") == m}
            hit += bool(benim & set(r["etiket"]))
            gurultu += bool(benim) and not benim & set(r["etiket"])
        out[m] = {"isabet": hit, "oran": round(hit / len(soru), 3) if soru else None, "ilgisiz_gosterim": gurultu}
    return out


def olc(kok):
    yol = Path(os.environ.get(ORTAM) or Path(kok) / SET)
    try:
        satirlar = etiket.oku(str(yol))
        bozuk = 0
    except ValueError:
        satirlar, bozuk = [], 1
    gecerli = [r for r in satirlar if isinstance(r, dict) and isinstance(r.get("adaylar"), list)]
    sahip = [r for r in gecerli if r.get("etiketleyen") == "sahip" and etiket.gecerli("arama", r, r.get("etiket"))]
    model = [r for r in gecerli if r.get("etiketleyen") == "model" and etiket.gecerli("arama", r, r.get("etiket"))]
    ps = puan(sahip)
    deger = ps["arama"]["oran"]
    ayr = {"set": SET if not os.environ.get(ORTAM) else ORTAM, "satir": len(satirlar), "bozuk_dosya": bozuk,
           "sahip_etiketli": len(sahip), "bekleyen": len(gecerli) - len(sahip),
           "adayli": {m: sum(any(a.get("motor") == m for a in r["adaylar"]) for r in gecerli) for m in MOTORLAR},
           "sahip": ps, "kosul": "adaylar çevrimdışı: ağ ve model yok; BAM'in tek kaynağı web olduğundan çevrimdışı boş döner",
           "gereken": "sahibin etiketi (POST /api/kalite/etiket, set=arama); BAM kapısı için en az 30 arama sorusu "
                      "ve canlı web koşusu (king/arama_olc.py shortcut); hafızaya eklenenin isabeti ölçülmüyor"}
    if model:
        pm = puan(model)
        ayr["vekil"] = {"ad": "vekil: model etiketi, gerçek sorular", "deger": pm["arama"]["oran"], "birim": "oran",
                        "etiket": "tahmin", "satir": len(model), **pm,
                        "neden_tahmin": "etiketleri model (Claude) taslak olarak yazdı; sahibin etiketi değil"}
    if not sahip:
        ayr["neden_degersiz"] = "sahibin etiketlediği arama sorusu yok" if not satirlar else "sahip etiketi bekleniyor"
    return {"deger": deger, "birim": "oran", "etiket": "ölçüldü" if deger is not None else "veri yok",
            "durum": "ölçüldü" if deger is not None else "ölçülmedi", "ayrinti": ayr,
            "komut": "python kalite/egri/_yerel_set.py (set) → sahip etiketler (/api/kalite/etiket) → python kalite/olcum.py"}
