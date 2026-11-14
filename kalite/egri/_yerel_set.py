"""Gerçek setlerin kurucusu (yalnız bu bilgisayarda): tek depodaki sahibin King'e mesajlarından
kalite/veri/yerel/anlama-aday.jsonl ve arama-aday.jsonl yazar. Çıktı git dışıdır; ekrana yalnız sayı basar.

    python kalite/egri/_yerel_set.py

- Kaynak: tek depo (_tekdepo.py, salt-okur kopya), `sohbet` türü, yalnız sahibin (role=user) mesajı; P6 HKM'nin
  conversations tablosunu buraya taşıdı. Aynı mesaj (katlanmış metin) bir kez. Kimlik metnin özetidir: yeniden
  kurunca sahibin etiketi (etiketleyen «sahip») korunur.
- Anlama: her mesaj; `king_bugun` bugünkü king/niyet.py'nin kararıdır, o anki King'in değil (o anki niyet
  kaydedilmemiş: conversations'da niyet sütunu yok, usage yalnız model rolünü tutar). Etiket boş: sahip etiketler.
- Arama: soru biçimli mesajlar (SORU). İki motor ÇEVRİMDIŞI koşar (ağ yok, model yok): yeni Arama (king/arama.py:
  sahibin notları + alan/ içeriği) ve eski BAM iş emri yolu (king/arama_olc.py eski_bam, boş web taşıyıcısıyla).
  Adaylar motor adıyla saklanır; etiket API'si motoru göstermez.
"""
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parents[2]
sys.dont_write_bytecode = True
sys.path.insert(0, str(KOK / "king"))
sys.path.insert(0, str(KOK / "sistem"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
import _tekdepo  # noqa: E402
import etiket  # noqa: E402
import niyet  # noqa: E402

DIZIN = KOK / "kalite" / "veri" / "yerel"
SORU = re.compile(r"\?|%s|%s|\b(anlat|acikla|detaylandir|oner|tanimla|ne demek)\w*" % (niyet.SORU_EKI, niyet.SORU_SOZ))
ADAY = 3  # motor başına en çok aday


def mesajlar(kayitlar):
    """[(kimlik, metin, gün)] sahibin tekil mesajları, zaman sırasıyla."""
    gor, out = set(), []
    for _t, _a, _y, g in sorted((k for k in kayitlar if k[0] == "sohbet" and isinstance(k[3], dict)
                                 and k[3].get("role") == "user"), key=lambda k: str(k[3].get("created_at"))):
        f = niyet.katlanmis(g.get("text") or "")
        if len(re.sub(r"[^a-z]", "", f)) < 2 or f in gor:
            continue
        gor.add(f)
        out.append((hashlib.sha256(f.encode()).hexdigest()[:10], g["text"].strip(), str(g.get("created_at"))[:10]))
    return out


def soru_mu(metin):
    f = niyet.katlanmis(metin)
    return len(f.split()) >= 2 and bool(SORU.search(f))


def arama_adaylari(soru, notlar):
    import arama
    import arama_olc
    from core import db
    r = arama.ara(soru, con=db.connect(":memory:"), cfg={}, notlar=notlar, alan_kok=str(KOK), cevrimdisi=True, onbellek={})
    yeni = [{"motor": "arama", "baslik": (i["kaynaklar"][0].get("baslik") if i["kaynaklar"] else "kaynaksız"),
             "ozet": i["metin"][:300], "kaynak": (i["kaynaklar"][0].get("url") if i["kaynaklar"] else ""),
             "kesinlik": i["kesinlik"]} for i in r["iddialar"][:ADAY]]
    idd, ag, _ = arama_olc.eski_bam({"soru": soru, "ag": lambda: arama_olc._wiki(None, ""), "model": ""})
    eski = [{"motor": "bam", "baslik": next((u for u in i["url"] if u), "kaynaksız"), "ozet": i["metin"][:300],
             "kaynak": next((u for u in i["url"] if u), ""), "kesinlik": "dogrulanmadi" if i["supheli"] else "dogrulandi"}
            for i in idd[:ADAY]]
    return [dict(a, no="a%d" % n) for n, a in enumerate(yeni + eski, 1)], {"arama_kaynak": len(r["kaynaklar"]), "bam_ag": ag}


def yaz(set_, satirlar):
    """Var olan, hâlâ geçerli etiketi (sahip ya da model taslağı) kimliğe göre korur; dosyayı bütün yazar."""
    yol = Path(etiket.dosya(str(DIZIN), set_))
    eski = {r.get("id"): r for r in etiket.oku(str(yol))}
    for r in satirlar:
        e = eski.get(r["id"])
        if e and e.get("etiketleyen") in ("sahip", "model") and etiket.gecerli(set_, r, e.get("etiket")):
            r.update(etiket=e["etiket"], etiketleyen=e["etiketleyen"], etiket_zamani=e.get("etiket_zamani"))
    yol.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in satirlar), encoding="utf-8")
    return yol


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    k = _tekdepo.kayitlar()
    if k is None:
        sys.exit("tek depo yok (%s ya da %%LOCALAPPDATA%%/LifeOS/veri/lifeos.db)" % _tekdepo.ORTAM)
    assert subprocess.run(["git", "check-ignore", "-q", str(DIZIN / "x.jsonl")], cwd=KOK).returncode == 0, \
        "kalite/veri/yerel git dışı değil: yazılmadı"
    kod = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=KOK, capture_output=True, text=True).stdout.strip()
    notlar = [g for t, _a, _y, g in k if t == "not" and isinstance(g, dict)]
    m = mesajlar(k)
    anlama = [{"id": i, "metin": t, "tarih": d, "king_bugun": niyet.siniflandir(t)["niyet"],
               "king_kaynak": "king/niyet.py bugün (%s); o anki King değil" % kod,
               "etiket": None, "etiketleyen": None} for i, t, d in m]
    arama_, ag = [], 0
    for i, t, d in m:
        if soru_mu(t):
            ad, bilgi = arama_adaylari(t, notlar)
            ag += bilgi["bam_ag"]
            arama_.append({"id": i, "soru": t, "tarih": d, "adaylar": ad, "kosul": "çevrimdışı, ağsız, modelsiz (%s)" % kod,
                           "etiket": None, "etiketleyen": None})
    yaz("anlama", anlama)
    yaz("arama", arama_)
    print("anlama-aday: %d mesaj · arama-aday: %d soru (adaylı: arama %d, bam %d) · BAM ağ çağrısı %d"
          % (len(anlama), len(arama_), sum(any(a["motor"] == "arama" for a in r["adaylar"]) for r in arama_),
             sum(any(a["motor"] == "bam" for a in r["adaylar"]) for r in arama_), ag))


if __name__ == "__main__":
    main()
