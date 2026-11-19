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


def _json_len(x):
    return len(json.dumps(x, ensure_ascii=False, separators=(",", ":")))


def _icinde_liste_var(x):
    if isinstance(x, list):
        return True
    if isinstance(x, dict):
        return any(_icinde_liste_var(v) for v in x.values())
    return False


def _en_uzun_liste_bilgi(x):
    """_en_uzun_liste ile ayni DFS sirasinda (en_liste, dur_boy, guvenli) bulur."""
    listeler = []

    def gez(dugum):
        for v in (dugum.values() if isinstance(dugum, dict) else dugum if isinstance(dugum, list) else ()):
            if isinstance(v, list) and v:
                listeler.append(v)
            gez(v)

    gez(x)
    if not listeler:
        return None, 0, False
    en_i, en = 0, listeler[0]
    for i, l in enumerate(listeler):
        if len(l) > len(en):
            en_i, en = i, l
    en_id = id(en)
    if sum(1 for l in listeler if id(l) == en_id) > 1 or any(_icinde_liste_var(e) for e in en):
        return en, 0, False
    onceki = max((len(l) for l in listeler[:en_i]), default=0)
    sonraki = max((len(l) for l in listeler[en_i + 1:]), default=0)
    dur = max(onceki, max(0, sonraki - 1), 0)
    return en, dur, True


def kirp(veri, sinir):
    """Sığana dek en uzun listenin sonundan atar (en yeni önce gelir). Sığmazsa None. Kırpılan adet de döner."""
    if veri is None:
        return (None, 0) if sinir < 0 else (veri, 0)
    mevcut_len = _json_len(veri)
    max_bayt = -1 if sinir < 0 else sinir * 3
    atilan = 0
    while mevcut_len > max_bayt:
        l, dur, guvenli = _en_uzun_liste_bilgi(veri)
        if not l:
            return None, atilan
        if not guvenli:
            l.pop()
            atilan += 1
            mevcut_len = _json_len(veri)
            continue
        i = len(l) - 1
        while i >= dur and mevcut_len > max_bayt:
            mevcut_len -= _json_len(l[i]) + (1 if i > 0 else 0)
            i -= 1
        sil_bas = i + 1
        atilan += len(l) - sil_bas
        del l[sil_bas:]
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
    with mcp.oturum_anlik():
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
