"""Sahibin etiket kapısı (kalite eğrileri; rapor: belgeler/ekip/sadelesme/faz4-gercek-egriler.md).

Gerçek setler yalnız bu bilgisayarda, git dışı: kalite/veri/yerel/<set>-aday.jsonl (kurucu: kalite/egri/_yerel_set.py).
Sunucu (sunucu.py, yalnız bu bilgisayardan):
  GET  /api/kalite/etiket/adaylar?set=arama|anlama  → sahibin etiketlemediği ilk SINIR satır (yalnız gösterilecek alanlar)
  POST /api/kalite/etiket {set, id, etiket}          → satıra etiket + etiketleyen «sahip» + zaman; dosya bütün yazılır
Etiket: anlama → beş niyetten biri; arama → o satırın aday numaralarından liste ([] = hiçbiri doğru değil) ya da
«arama-degil» (mesaj bir arama sorusu değil, isabete girmez). Model taslağı (etiketleyen «model») bekleyen sayılır.
"""
import datetime
import json
import os
import tempfile
import threading

SETLER = ("arama", "anlama")
NIYETLER = ("sohbet", "kayit", "ogren", "arastir", "yonet")  # kalite/egri/_sinav.py NIYETLER ile aynı (test denetler)
ARAMA_DEGIL = "arama-degil"
SINIR = 20
_kilit = threading.Lock()


def dosya(dizin, set_):
    return os.path.join(dizin, set_ + "-aday.jsonl")


def oku(yol):
    """Satırlar; dosya yoksa []. Bozuk satır ValueError verir: bozuk set üstüne yazılmaz."""
    try:
        with open(yol, encoding="utf-8") as f:
            return [json.loads(s) for s in f if s.strip()]
    except FileNotFoundError:
        return []


def gecerli(set_, satir, etiket):
    if set_ == "anlama":
        return etiket in NIYETLER
    nolar = {a.get("no") for a in satir.get("adaylar") or [] if isinstance(a, dict)}
    return etiket == ARAMA_DEGIL or (isinstance(etiket, list) and len(set(map(str, etiket))) == len(etiket)
                                     and all(isinstance(x, str) and x in nolar for x in etiket))


def adaylar(dizin, set_):
    """(sahibin etiketlemediği ilk SINIR satır, bekleyen sayısı). Model taslağı ve motor adı gösterilmez."""
    bekleyen = [r for r in oku(dosya(dizin, set_)) if r.get("etiketleyen") != "sahip"]
    return [{"id": r.get("id"), "metin": r.get("metin") or r.get("soru"),
             "adaylar": [{"no": a.get("no"), "baslik": a.get("baslik"), "ozet": a.get("ozet")}
                         for a in r.get("adaylar") or [] if isinstance(a, dict)]}
            for r in bekleyen[:SINIR]], len(bekleyen)


def etiketle(dizin, set_, id_, etiket, simdi=None):
    """Sahibin etiketini yazar. Döner: Türkçe hata ya da None (yazıldı)."""
    if set_ not in SETLER:
        return "set «arama» ya da «anlama» olmalı"
    yol = dosya(dizin, set_)
    with _kilit:
        try:
            satirlar = oku(yol)
        except ValueError:
            return "set okunamadı (bozuk satır); dosya değiştirilmedi"
        r = next((x for x in satirlar if isinstance(id_, str) and x.get("id") == id_), None)
        if r is None:
            return "bilinmeyen id"
        if not gecerli(set_, r, etiket):
            return "geçersiz etiket"
        r.update(etiket=etiket, etiketleyen="sahip",
                 etiket_zamani=(simdi or datetime.datetime.now()).isoformat(timespec="seconds"))
        fd, gecici = tempfile.mkstemp(dir=os.path.dirname(yol), suffix=".yarim")
        try:
            with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
                f.writelines(json.dumps(x, ensure_ascii=False) + "\n" for x in satirlar)
                f.flush()
                os.fsync(f.fileno())
            os.replace(gecici, yol)
        except BaseException:
            if os.path.exists(gecici):
                os.remove(gecici)
            raise
    return None
