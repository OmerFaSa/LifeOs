#!/usr/bin/env python3
"""King'in bağlam derleyicisi (sadelesme Faz 5, A7). Niyet başına yalnız gereken veri dilimi, jeton bütçesi içinde.
Rapor: belgeler/ekip/sadelesme/faz5-king-cekirdek.md · Test: python king/baglam_test.py

    python king/baglam.py "bugünün planı ne?"     niyet + derlenen bağlam (JSON; gerçek depo yalnız kopyadan okunur)

Veri king/mcp.py'nin okuma kapılarından gelir (canlı depo hiç açılmaz, kopyası okunur; sır «gizli»; notlar Not
motorunun King süzgecinden). Burada ikinci kilit: gövdesinde ozel:true olan her parça bağlama girmeden atılır.
Bütçe serttir: dilim sığmazsa en uzun listesi kırpılır, yine sığmazsa dilim dışarıda kalır ve nedeni yazılır.
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import katalog  # noqa: E402
import mcp  # noqa: E402
import niyet as niyet_mod  # noqa: E402

# dilim: (mcp okuma kapısı, argüman, ne için)
DILIMLER = {
    "bugun": (mcp.t_bugun, {}, "bugünün özeti, planı ve kayıtları"),
    "son_kayitlar": (mcp.t_kayit_ara, {"sinir": 10}, "en yeni on kaydın kimliği ve türü"),
    "notlar": (mcp.t_notlar, {"sinir": 5}, "en yeni beş not (özel notlar süzgeçte kalır)"),
    "yol": (mcp.t_yol, {}, "alanın öğrenme yolu (kapı soruları verilmez)"),
    "tekrar": (mcp.t_tekrar, {}, "bugün vadesi gelen kartlar"),
}
# Niyet başına dilimler, önem sırasıyla (bütçe önce baştakine harcanır). Kayıt modele gitmez: bağlamı yok.
NIYET_DILIMLERI = {
    "sohbet": ("bugun",),
    "kayit": (),
    "ogren": ("yol", "tekrar", "notlar"),
    "arastir": ("notlar",),
    "yonet": ("bugun", "son_kayitlar", "tekrar"),
}
BUTCE = {"sohbet": 600, "kayit": 0, "ogren": 1500, "arastir": 1000, "yonet": 1500}


def jeton(x):
    """Jeton tahmini: JSON uzunluğu / 3 (Türkçe metinde sağlayıcı sayacından cömert; bütçe taşmasın diye)."""
    return math.ceil(len(json.dumps(x, ensure_ascii=False, separators=(",", ":"))) / 3) if x is not None else 0


def ozelsiz(x):
    """ozel:true işaretli her nesne atılır (Not süzgecinin arkasında ikinci kilit)."""
    if isinstance(x, dict):
        return {k: ozelsiz(v) for k, v in x.items() if not (isinstance(v, dict) and v.get("ozel") is True)}
    if isinstance(x, list):
        return [ozelsiz(v) for v in x if not (isinstance(v, dict) and v.get("ozel") is True)]
    return x


def _en_uzun_liste(x):
    en = None
    for v in (x.values() if isinstance(x, dict) else x if isinstance(x, list) else ()):
        if isinstance(v, list) and v and (en is None or len(v) > len(en)):
            en = v
        alt = _en_uzun_liste(v)
        if alt and (en is None or len(alt) > len(en)):
            en = alt
    return en


def kirp(veri, sinir):
    """Sığana dek en uzun listenin sonundan atar (en yeni önce gelir). Sığmazsa None. Kırpılan adet de döner."""
    atilan = 0
    while jeton(veri) > sinir:
        l = _en_uzun_liste(veri)
        if not l:
            return None, atilan
        l.pop()
        atilan += 1
    return veri, atilan


def derle(metin, butce=None, simdi=None):
    """{niyet, guven, neden, arac_yolu, araclar, dilimler, disarida, jeton, butce}.

    Kayıt niyetinde model yolu yoktur: öneri kural motoruna gider, bağlam ve araç boştur. Bütçe yalnız veri
    dilimlerine uygulanır; kapı şemalarının jetonu ayrıca yazılır (masadaki kapılar sabittir, katalog.py)."""
    n = niyet_mod.siniflandir(metin, simdi)
    ad = n["niyet"]
    butce = BUTCE[ad] if butce is None else butce
    araclar = katalog.model_araclari(ad)
    sonuc = {"niyet": ad, "guven": n["guven"], "neden": n["neden"],
             "arac_yolu": "kural motoru (kaydet)" if ad == "kayit" else "model",
             "araclar": [a["name"] for a in araclar], "arac_jeton": jeton(araclar),
             "dilimler": [], "disarida": [], "jeton": 0, "butce": butce}
    if ad == "kayit":
        sonuc["kayit"] = n["kayit"]
        return sonuc
    for d in NIYET_DILIMLERI[ad]:
        fn, arg, ne = DILIMLER[d]
        try:
            veri = ozelsiz(fn(dict(arg)))
        except mcp.AracHatasi as e:
            sonuc["disarida"].append({"ad": d, "neden": "okunamadı: %s" % e})
            continue
        kalan = butce - sonuc["jeton"]
        veri, atilan = kirp(veri, kalan)
        if veri is None:
            sonuc["disarida"].append({"ad": d, "neden": "bütçe: %d jetonluk yer kaldı" % kalan})
            continue
        j = jeton(veri)
        sonuc["dilimler"].append({"ad": d, "ne": ne, "jeton": j, "kirpilan": atilan, "veri": veri})
        sonuc["jeton"] += j
    return sonuc


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    print(json.dumps(derle(" ".join(sys.argv[1:])), ensure_ascii=False, indent=1))
