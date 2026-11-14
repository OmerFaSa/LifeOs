"""Sağlayıcı kalitesi (plan §6, King): gerçek model çağrılarında istek başına jeton ve boşa giden çağrı.

Kaynak: tek depodaki model kullanım defteri (`kullanim`, P6'da HKM usage tablosundan taşındı; salt-okur kopya,
kalite/egri/_tekdepo.py). Başlık değeri: başarılı ve jetonu sağlayıcıdan gelen (not'unda «tahmini-jeton» olmayan)
çağrılarda ortalama girdi+çıktı jetonu. Başarısız çağrı (ok=0) boşa giden çağrıdır; «gereksiz» çağrı (cevap için
gerekmeyen) ayrı bir sayaç ister, yok. Depo yoksa (CI) ölçülmedi.
"""
import statistics
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _tekdepo  # noqa: E402

AD = 'Sağlayıcı kalitesi'
TANIM = 'istek başına jeton, gereksiz çağrı'
GEREKEN = ("gereksiz çağrı sayacı (cevap için gerekmeyen çağrı) yok; bugünkü defter yalnız başarısız çağrıyı gösterir. "
           "Tahmini jetonlu satır (sağlayıcı sayı vermedi) başlık değerine girmez")


def olc(kok):
    k = _tekdepo.kayitlar()
    if k is None:
        return {"deger": None, "birim": 'jeton/istek', "etiket": "veri yok", "durum": "ölçülmedi",
                "ayrinti": {"gereken": "tek depo (P6) bu bilgisayarda: model kullanım defteri (kullanim); " + GEREKEN},
                "komut": "tek depo varken python kalite/olcum.py; canlı: python tools/king_olcum.py sohbet --config <ayar>"}
    c = [g for t, _a, _y, g in k if t == "kullanim" and isinstance(g, dict)]
    olcu = [g for g in c if g.get("ok") and "tahmini-jeton" not in str(g.get("note") or "")]
    jeton = [(g.get("in_tok") or 0) + (g.get("out_tok") or 0) for g in olcu]
    deger = round(sum(jeton) / len(jeton), 1) if jeton else None
    say = lambda f: {v: sum(1 for g in c if f(g) == v) for v in sorted({str(f(g)) for g in c})}  # noqa: E731
    ayr = {"cagri": len(c), "basarili": sum(1 for g in c if g.get("ok")), "basarisiz": sum(1 for g in c if not g.get("ok")),
           "tahmini_jetonlu": sum(1 for g in c if "tahmini-jeton" in str(g.get("note") or "")),
           "olculen_cagri": len(olcu), "ortanca_jeton": statistics.median(jeton) if jeton else None,
           "onbellekli": sum(1 for g in c if g.get("cached")), "yukseltilen": sum(1 for g in c if g.get("escalated")),
           "saglayici": say(lambda g: str(g.get("provider"))), "rol": say(lambda g: str(g.get("role"))),
           "ortanca_ms": statistics.median([g["ms"] for g in c if g.get("ms")]) if any(g.get("ms") for g in c) else None,
           "gun": [min(str(g.get("day")) for g in c), max(str(g.get("day")) for g in c)] if c else None,
           "kaynak": "tek depo, kullanim (HKM usage), salt-okur kopya", "gereken": GEREKEN}
    if c:
        ayr["basarisiz_oran"] = round(ayr["basarisiz"] / len(c), 3)
    return {"deger": deger, "birim": 'jeton/istek', "etiket": "ölçüldü" if deger is not None else "veri yok",
            "durum": "ölçüldü" if deger is not None else "ölçülmedi", "ayrinti": ayr,
            "komut": "python kalite/olcum.py (tek depo varken); canlı: python tools/king_olcum.py sohbet --config <ayar>"}
