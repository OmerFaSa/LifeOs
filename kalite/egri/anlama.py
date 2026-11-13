"""Anlama (plan §6, King): etiketli gerçek mesajlarda niyet isabeti.

Gerçek eğri «yanlış anladın» setinden okunur (plan A7): kalite/veri/yerel/anlama.jsonl, git dışı, yalnız bu
bilgisayarda. Biçim kalite/veri/README.md'de; her satır SATIR_KURALI'na göre denetlenir:

  python kalite/egri/anlama.py --denetle    seti denetler, bozuk satırı Türkçe yazar (çıkış 0/1)

Set boşken eğri ölçülmedi kalır. Yalnız işaretlenmiş («yanlış anladın») satır varsa da ölçülmez: o örneklemde
isabet hep 0'dır, sayı yanıltır. Yanındaki «vekil: sınav cümleleri» tahmin etiketlidir, eğrinin yerine geçmez.
"""
import datetime
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))  # betik olarak da _sinav bulunsun
import _sinav  # noqa: E402

AD = "Anlama"
TANIM = "etiketli gerçek mesajlarda niyet isabeti"
SET = "kalite/veri/yerel/anlama.jsonl"
ISARET = "yanlis-anladin"  # King'in cevabının altındaki tek dokunuşluk işaretten gelen satırın kaynağı
ALANLAR = {"metin", "niyet", "kaynak", "king", "tarih"}
METIN_SINIR = 2000


def satir_hatalari(r):
    """Bir satırın Türkçe hata listesi (boşsa geçerli). Kişisel veri sızmasın diye bilinmeyen alan da hatadır."""
    if not isinstance(r, dict):
        return ["satır bir JSON nesnesi değil"]
    h = []
    fazla = sorted(set(r) - ALANLAR)
    if fazla:
        h.append(f"bilinmeyen alan: {', '.join(fazla)} (izinli: {', '.join(sorted(ALANLAR))})")
    m = r.get("metin")
    if not (isinstance(m, str) and m.strip()):
        h.append("metin boş ya da dizge değil")
    elif len(m) > METIN_SINIR:
        h.append(f"metin {METIN_SINIR} karakterden uzun")
    if not (isinstance(r.get("kaynak"), str) and r["kaynak"].strip()):
        h.append("kaynak yok (ör. «yanlis-anladin», «ornek»)")
    isaretli = r.get("kaynak") == ISARET
    niyet, king = r.get("niyet"), r.get("king")
    if niyet is None and not isaretli:
        h.append("niyet yok; etiketsiz satır yalnız «yanlis-anladin» kaynağında olabilir")
    elif niyet is not None and niyet not in _sinav.NIYETLER:
        h.append(f"niyet «{niyet}» beşten biri değil ({', '.join(_sinav.NIYETLER)})")
    if king is not None and king not in _sinav.NIYETLER:
        h.append(f"king «{king}» beşten biri değil")
    if isaretli and king is None:
        h.append("«yanlis-anladin» satırında King'in seçtiği niyet (king) zorunlu")
    if isaretli and niyet is not None and niyet == king:
        h.append("«yanlis-anladin» işaretli ama niyet King'inkiyle aynı: çelişki")
    t = r.get("tarih")
    if t is not None:
        try:
            datetime.date.fromisoformat(t)
        except (TypeError, ValueError):
            h.append("tarih YYYY-AA-GG değil")
    return h


def etiketli(kok):
    """(geçerli satırlar, [(satır no, hatalar)]). Dosya yoksa boş."""
    gecerli, bozuk = [], []
    try:
        metin = (Path(kok) / SET).read_text(encoding="utf-8")
    except OSError:
        return gecerli, bozuk
    for no, satir in enumerate(metin.splitlines(), 1):
        if not satir.strip():
            continue
        try:
            r = json.loads(satir)
        except ValueError as e:
            bozuk.append((no, [f"JSON okunamadı: {e.msg}"]))
            continue
        h = satir_hatalari(r)
        if h:
            bozuk.append((no, h))
        else:
            gecerli.append(r)
    return gecerli, bozuk


def isaretle(kok, metin, king, niyet=None, tarih=None):
    """«Yanlış anladın» işaretini sete ekler (sunucudaki tek yazma yolu; doğrulanmayan satır yazılmaz).
    Döner: hata listesi (boşsa yazıldı)."""
    r = {"metin": metin, "kaynak": ISARET, "king": king, "niyet": niyet,
         "tarih": tarih or datetime.date.today().isoformat()}
    h = satir_hatalari(r)
    if not h:
        yol = Path(kok) / SET
        yol.parent.mkdir(parents=True, exist_ok=True)
        with open(yol, "a", encoding="utf-8") as f:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    return h


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
    satir, bozuk = etiketli(kok)
    kingli = [r for r in satir if r.get("king") is not None and r.get("niyet") is not None]
    isaretsiz = [r for r in kingli if r["kaynak"] != ISARET]
    deger = round(sum(r["king"] == r["niyet"] for r in kingli) / len(kingli), 3) if isaretsiz else None
    ayrinti = {"etiketli": len(satir), "gecersiz_satir": len(bozuk), "king_kararli": len(kingli),
               "yanlis_anladin": sum(r["kaynak"] == ISARET for r in satir),
               "etiket_bekleyen": sum(r.get("niyet") is None for r in satir), "set": SET,
               "gereken": "sahibinin etiketlediği gerçek mesajlar; her satırda King'in o an seçtiği niyet (king). "
                          "«Yanlış anladın» işareti seti doldurur ama yalnız işaretli satırla isabet hep 0 çıkar: "
                          "değer için işaretlenmemiş (King'in doğru anladığı) örneklem de gerekir"}
    if kingli and not isaretsiz:
        ayrinti["neden_degersiz"] = "yalnız «yanlış anladın» satırı var; örneklem yanlı, isabet yazılmaz"
    v = vekil(kok)
    if v:
        ayrinti["vekil"] = v
    return {"deger": deger, "birim": "oran", "etiket": "ölçüldü" if deger is not None else "veri yok",
            "durum": "ölçüldü" if deger is not None else "ölçülmedi", "ayrinti": ayrinti,
            "komut": f"{SET} doldurulunca python kalite/olcum.py; vekil: {_sinav.KOMUT}"}


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    if "--denetle" not in sys.argv:
        sys.exit(__doc__)
    iyi, kotu = etiketli(Path(__file__).resolve().parents[2])
    for no, h in kotu:
        print(f"{SET}:{no}: " + "; ".join(h))
    print(f"{len(iyi)} geçerli, {len(kotu)} bozuk satır" + ("" if iyi or kotu else " (set boş ya da yok)"))
    sys.exit(1 if kotu else 0)
