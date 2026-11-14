"""Sistem · Hayata etki (plan §6, Sistem): tek depodan haftalık özet.

Tek depo (kalite/egri/_tekdepo.py, salt-okur kopya) varsa sahibinin elinden çıkan kayıtlar ISO haftasına göre
sayılır: hangi gün kayıt var (süreklilik), tür başına etkinlik, AYS'de biten çalışma bloğu. Başlık değeri son dört
haftada (verideki en yeni haftaya göre; bugünün tarihine değil, aynı depo aynı kayıt) haftalık ortalama etkin gün.
Kaydın zamanı gövdedeki tarih alanıdır; `hlc` göç anıdır, kullanılmaz. Depo yoksa (CI) ölçülmedi.

    python kalite/egri/hayata_etki.py     özet (JSON; yalnız sayımlar)
"""
import datetime
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _tekdepo  # noqa: E402

AD = 'Sistem · Hayata etki'
TANIM = 'haftada tamamlanan öğrenme adımı, süreklilik'
PENCERE = 4  # hafta

# tür → (etkinlik, tarih alanları). Yalnız sahibinin eylemiyle oluşan kayıt; sohbette yalnız sahibin mesajı.
ETKINLIK = {
    "sohbet": ("king", ("created_at",)),
    "ays.days": ("kayit", ("date",)),
    "olcum": ("kayit", ("date",)),
    "gun_kaydi": ("kayit", ("zaman",)),
    "not": ("not", ("at",)),
    "spi.haftaplan": ("plan", ("at",)),
    "plan_blogu": ("plan", ("signedAt",)),
}
# Gün ve ölçüm kaydı uygulamanın açtığı boş kabuk olabilir (AYS her güne kayıt açar): sahibin doldurduğu alan yoksa sayılmaz
KENDILIGINDEN = {"date", "id", "dow", "blocks", "paragraphTarget", "problemTarget"}
BLOK_BITTI = {"done"}  # AYS gün kaydındaki çalışma bloğunun durumu (ays.days.blocks[].status)
YOK = {"yol_adim": "tek depoda Yol kaydı yok: kabuğun Yol/Soru/Tekrar kayıtları hâlâ tarayıcıda (kabuk/depo.js, "
                   "IndexedDB «lifeos-kabuk»), tek kapı bayrağı kapalı; P6 göçü yalnız eski modül ve HKM verisini taşıdı",
       "soru": "soru bankası cevapları (motor/soru.js) aynı nedenle tek depoda yok"}


def _gun(v):
    if isinstance(v, str) and re.match(r"\d{4}-\d\d-\d\d", v):
        return datetime.date.fromisoformat(v[:10])  # shortcut: «Z»li zaman UTC günüdür; gece yarısı kayabilir, saat dilimi yazılınca düzelt
    if isinstance(v, (int, float)) and v > 1e12:
        return datetime.datetime.fromtimestamp(v / 1000, datetime.timezone.utc).date()
    return None


def _dolu(v):
    if isinstance(v, dict):
        return any(_dolu(x) for x in v.values())
    if isinstance(v, list):
        return any(_dolu(x) for x in v)
    return bool(v.strip()) if isinstance(v, str) else bool(v)


def hafta(g):
    y, w, _ = g.isocalendar()
    return "%d-W%02d" % (y, w)


def ozet(kayitlar):
    """Kayıt listesinden haftalık sayım (yalnız sayılar ve tür adları)."""
    haftalar, sayilmayan, tarihsiz, bos = {}, {}, {}, {}
    for tur, _alan, _yol, g in kayitlar:
        if tur not in ETKINLIK or not isinstance(g, dict):
            sayilmayan[tur] = sayilmayan.get(tur, 0) + 1
            continue
        if tur == "sohbet" and g.get("role") != "user":
            continue
        if tur in ("ays.days", "olcum") and not any(_dolu(v) for a, v in g.items() if a not in KENDILIGINDEN):
            bos[tur] = bos.get(tur, 0) + 1
            continue
        etk, alanlar = ETKINLIK[tur]
        gun = next((d for d in (_gun(g.get(a)) for a in alanlar) if d), None)
        if not gun:
            tarihsiz[tur] = tarihsiz.get(tur, 0) + 1
            continue
        h = haftalar.setdefault(hafta(gun), {"gunler": set(), "etkinlik": {}, "biten_blok": 0})
        h["gunler"].add(gun)
        h["etkinlik"][etk] = h["etkinlik"].get(etk, 0) + 1
        if tur == "ays.days":
            h["biten_blok"] += sum(1 for b in g.get("blocks") or [] if isinstance(b, dict) and b.get("status") in BLOK_BITTI)
    return haftalar, sayilmayan, tarihsiz, bos


def olc(kok):
    k = _tekdepo.kayitlar()
    gereken = "tek depo (P6 göçü) bu bilgisayarda; Yol adımı için kabuk kayıtlarının tek depoya geçmesi"
    if k is None:
        return {"deger": None, "birim": "gün/hafta", "etiket": "veri yok", "durum": "ölçülmedi",
                "ayrinti": {"gereken": gereken, "yol_adim": {"etiket": "veri yok", "neden": YOK["yol_adim"]}},
                "komut": "tek depo varken python kalite/olcum.py (depo yolu: %s ya da %%LOCALAPPDATA%%/LifeOS/veri/lifeos.db)"
                         % _tekdepo.ORTAM}
    haftalar, sayilmayan, tarihsiz, bos = ozet(k)
    son = max(haftalar) if haftalar else None
    pencere = []
    if son:
        y, w = map(int, son.split("-W"))
        pazartesi = datetime.date.fromisocalendar(y, w, 1)
        pencere = [hafta(pazartesi - datetime.timedelta(weeks=i)) for i in range(PENCERE - 1, -1, -1)]
    gun = [len(haftalar.get(h, {}).get("gunler", ())) for h in pencere]
    deger = round(sum(gun) / PENCERE, 2) if pencere else None
    tablo = {h: {"etkin_gun": len(v["gunler"]), "etkinlik": dict(sorted(v["etkinlik"].items())),
                 "biten_blok_ays": v["biten_blok"]} for h, v in sorted(haftalar.items())}
    ayr = {"pencere": pencere, "pencere_etkin_gun": gun, "hafta_sayisi": len(haftalar),
           "toplam_etkin_gun": sum(len(v["gunler"]) for v in haftalar.values()),
           "haftalar": tablo, "sayilan_turler": {t: e for t, (e, _) in sorted(ETKINLIK.items())},
           "sayilmayan_turler": dict(sorted(sayilmayan.items())), "tarihsiz": dict(sorted(tarihsiz.items())),
           "bos_kabuk": dict(sorted(bos.items())),
           "yol_adim": {"etiket": "veri yok", "neden": YOK["yol_adim"]}, "soru": {"etiket": "veri yok", "neden": YOK["soru"]},
           "kaynak": "tek depo, salt-okur kopya (kalite/egri/_tekdepo.py)", "gereken": gereken}
    if deger is None:
        ayr["neden_degersiz"] = "depoda tarihli sahip kaydı yok"
    return {"deger": deger, "birim": "gün/hafta", "etiket": "ölçüldü" if deger is not None else "veri yok",
            "durum": "ölçüldü" if deger is not None else "ölçülmedi", "ayrinti": ayr,
            "komut": "python kalite/olcum.py (tek depo varken); ayrıntı: python kalite/egri/hayata_etki.py"}


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    print(json.dumps(olc(Path(__file__).resolve().parents[2]), ensure_ascii=False, indent=1))
