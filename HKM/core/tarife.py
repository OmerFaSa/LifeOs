# -*- coding: utf-8 -*-
"""Model tarifesi — GUNCEL fiyat, kaynagiyla ve tarihiyle.

   Fiyatlar degisir; koda gomulu bir tablo bir gun yanlis olur ve bunu
   kimse fark etmez (deepseek-chat bes kat ucuz yaziyordu). Bu yuzden:

     1. KAYNAK TEK VE ACIKTIR. OpenRouter'in herkese acik model listesi
        (anahtar istemez): giris/cikis fiyati, baglam uzunlugu, girdi
        turleri. Dogrudan saglayici fiyatlari (Anthropic, OpenAI, Google)
        bu listedeki taban fiyatla aynidir; kimlik `or_kimligi` ile eslenir.
     2. HER SATIR TARIHLIDIR. «Bu fiyat ne zaman okundu» sorusunun cevabi
        satirin kendisindedir.
     3. HATA ESKIYI SILMEZ. Kaynak cevap vermezse son okunan tarife
        gecerli kalir; bos bir tablo «her sey bedava» ya da «her sey
        tahmini» demek olurdu.
     4. KANITSIZ SAYI YAZILMAZ. Negatif, sayi olmayan ya da eksik fiyat
        satiri alinmaz.

   ai.py once buradaki canli tarifeye (CANLI_FIYAT), yoksa yedek tabloya
   (FIYAT) bakar."""

import datetime
import json
import re
import urllib.request

from core import ai

KAYNAK = "https://openrouter.ai/api/v1/models"
ZAMAN_ASIMI = 20
_meta = {"tarih": None, "sayi": 0}


def _indir(url, timeout=ZAMAN_ASIMI):
    r = urllib.request.Request(url, headers={"User-Agent": "HKM-tarife"})
    with urllib.request.urlopen(r, timeout=timeout) as y:
        return json.loads(y.read().decode("utf-8", "replace") or "{}")


def or_kimligi(provider, model):
    """Saglayici + model adi -> OpenRouter kimligi (yoksa None)."""
    m = str(model or "").strip()
    if not m:
        return None
    if provider == "openrouter":
        return m
    if provider == "anthropic":
        m = re.sub(r"-\d{8}$", "", m)                 # tarih eki
        m = re.sub(r"-(\d+)-(\d+)$", r"-\1.\2", m)     # 4-5 -> 4.5
        return "anthropic/" + m
    if provider == "google":
        return "google/" + m
    if provider == "openai":
        return "openai/" + m
    return None


def guncelle(con, transport=None, simdi=None):
    """Listeyi indirir ve tabloya yazar. {ok, sayi, tarih, not}."""
    tarih = simdi or datetime.datetime.now().isoformat(timespec="seconds")
    try:
        govde = (transport or _indir)(KAYNAK, timeout=ZAMAN_ASIMI)
    except Exception as e:                      # ag, JSON, zaman asimi
        return {"ok": False, "sayi": 0, "tarih": None,
                "not": "Tarife okunamadı (%s); son okunan tarife geçerli." % type(e).__name__}
    satirlar = []
    for x in (govde or {}).get("data") or []:
        try:
            kimlik = str(x["id"])
            fy = x.get("pricing") or {}
            g, c = float(fy["prompt"]) * 1e6, float(fy["completion"]) * 1e6
        except (KeyError, TypeError, ValueError):
            continue
        if not kimlik or g < 0 or c < 0 or g != g or c != c:
            continue
        girdi = ",".join(((x.get("architecture") or {}).get("input_modalities")) or [])
        baglam = x.get("context_length")
        satirlar.append((kimlik, round(g, 4), round(c, 4),
                         int(baglam) if isinstance(baglam, (int, float)) else None,
                         girdi, KAYNAK, tarih))
    if not satirlar:
        return {"ok": False, "sayi": 0, "tarih": None,
                "not": "Kaynak boş liste döndü; son okunan tarife geçerli."}
    con.execute("BEGIN IMMEDIATE")
    try:
        con.executemany(
            "INSERT OR REPLACE INTO model_tarife(model, giris, cikis, baglam, girdiler,"
            " kaynak, tarih) VALUES (?,?,?,?,?,?,?)", satirlar)
        con.execute("COMMIT")
    except Exception:
        con.execute("ROLLBACK")
        raise
    yukle(con)
    return {"ok": True, "sayi": len(satirlar), "tarih": tarih,
            "not": "%d modelin tarifesi okundu." % len(satirlar)}


def yukle(con):
    """Tablodaki tarifeyi ai.CANLI_FIYAT'a yukler."""
    ai.CANLI_FIYAT.clear()
    son = None
    for r in con.execute("SELECT model, giris, cikis, tarih FROM model_tarife"):
        ai.CANLI_FIYAT[r["model"]] = (r["giris"], r["cikis"])
        son = max(son or r["tarih"], r["tarih"])
    _meta["tarih"], _meta["sayi"] = son, len(ai.CANLI_FIYAT)
    return dict(_meta)


def durum():
    return dict(_meta)


def bilgi(provider, model):
    """Bir modelin tarifesi ve nereden geldigi: canli (tarihli) | yedek | yok."""
    k = or_kimligi(provider, model)
    if k and k in ai.CANLI_FIYAT:
        g, c = ai.CANLI_FIYAT[k]
        return {"fiyat": [g, c], "kaynak": "canli", "tarih": _meta["tarih"]}
    y = ai.FIYAT.get(model) or (ai.FIYAT.get(k) if k else None)
    if y:
        return {"fiyat": list(y), "kaynak": "yedek", "tarih": "2026-09-26"}
    return {"fiyat": None, "kaynak": "yok", "tarih": None}
