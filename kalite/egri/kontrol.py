"""Kontrol (plan §6, King): sistem görevini araçlarla tamamlama oranı.

Gerçek ölçüm görevin bittiğini veriyle denetler (King-Bench kayit/plan/gun: gerçek tarayıcı, HKM, model).
Bugün yalnız «vekil: sınav, araç seçimi» var: King doğru aracı/sayfayı/kaydı SEÇTİ mi; çalıştırılmaz.
"""
import _sinav

AD = "Kontrol"
TANIM = "sistem görevini araçlarla tamamlama oranı"
BENCH = "python tools/king_bench/bench.py --paket kayit,plan,gun (gerçek tarayıcı + HKM + model)"


def vekil(kok):
    s = _sinav.satirlar(kok)
    if not s:
        return None
    # Sistem görevi: beklenen her karar bir araç, sayfa, kayıt ya da yerel komut (sohbet ve belirsiz değil).
    gorev = [r for r in s["satirlar"] if all(_sinav.niyet(b) in ("kayit", "ogren", "yonet") for b in r["b"])]
    dogru = sum(r["ok"] for r in gorev)
    return {"ad": "vekil: sınav, araç seçimi", "deger": round(dogru / len(gorev), 3) if gorev else None,
            "birim": "oran", "etiket": "tahmin", "dogru": dogru, "gorev_cumlesi": len(gorev),
            "olculdu": s["tarih"], "kod": s["kod"], "komut": _sinav.KOMUT,
            "neden_tahmin": "araç seçilir, çalıştırılmaz (görevin bittiği denetlenmez); cümleler bugünkü King'e göre "
                            "yazılmış; argüman yalnız 'a' alanı olan 9 cümlede denetlenir"}


def olc(kok):
    ayrinti = {"gereken": "çalışan King (tarayıcı + HKM + model) ve görevin sonunda verinin doğru yazıldığının "
                          "denetimi; King-Bench'in donmuş klon verisiyle koşar"}
    v = vekil(kok)
    if v:
        ayrinti["vekil"] = v
    return {"deger": None, "birim": "oran", "etiket": "veri yok", "durum": "ölçülmedi", "ayrinti": ayrinti,
            "komut": f"{BENCH}; vekil: {_sinav.KOMUT}"}
