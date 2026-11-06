# -*- coding: utf-8 -*-
"""KODLAMA ADAYI — ogrenme motorunun ipucu merdiveni icin web'den hafiza kodlamasi.

   Depo sahibi (2026-11-06): «internetten bu konularla alakali mantikli
   kodlamalari bulsun, kodlamalarla ipucu versin, cevabi direkt vermesin,
   dusundursun». Plan: belgeler/ekip/OGRETME-PLANI.md (Faz 2).

   MODEL YOK. Kod arar (core/web.py, BAM arastirma rolunun izniyle), ilk
   sayfalari okur ve sayfanin KENDI cumlelerini suzer. Dort soz:

   1. KAYNAKSIZ ADAY YOK. Her aday okunan sayfanin bir cumlesidir ve
      adresiyle doner; cumle degistirilmez, yalniz kirpilir.
   2. KONUYA BAGLI. Aday bir kodlama isareti (kisaltma, akilda tut, kafiye…)
      ve konunun ya da verilen terimlerin kokunden birini birlikte tasir.
   3. CEVABI VERMEZ. Istemcinin verdigi cevaplardan birini (4+ harf) iceren
      aday elenir; istemci ayni denetimi bir kez daha yapar.
   4. YAZMAZ. Hicbir sey kaydedilmez; kisi «Kodlamalarima ekle» derse modul
      kendi deposuna yazar (AGENTS §1.4). Web kapaliysa {ok:false} ve neden."""
import re

from core import arastir, web

YOL = "/api/kodlama"
ISARET = re.compile(r"kodla|kısaltma|akılda (?:kal|tut)|aklında (?:kal|tut)|ezber|hafıza tekni|şifrele|kafiye|"
                    r"tekerleme|baş harf|ilk harf", re.I)
EN_AZ, EN_COK = 15, 220
SAYFA = 4          # okunacak en cok sayfa
KOK = 5


def _kucuk(s):
    return str(s or "").replace("I", "ı").replace("İ", "i").lower()


def _kokler(metinler):
    out = set()
    for m in metinler:
        for w in re.findall(r"[0-9a-zçğıöşüâîû]+", _kucuk(m)):
            if len(w) >= 4:
                out.add(w[:KOK])
    return out


def _cumleler(metin):
    parca = re.split(r"(?<=[.!?…])\s+|\n+", str(metin or ""))
    return [re.sub(r"\s+", " ", p).strip() for p in parca if p and p.strip()]


def adaylar(metin, konu, terimler=None, cevaplar=None, n=3):
    """Saf suzgec: metnin kodlama cumleleri. Soz 1-3 burada; agsiz sinanir."""
    kokler = _kokler([konu] + list(terimler or []))
    cevap = [_kucuk(c).strip() for c in (cevaplar or []) if len(str(c or "").strip()) >= 4]
    out, gor = [], set()
    for c in _cumleler(metin):
        if not (EN_AZ <= len(c) <= EN_COK) or not ISARET.search(c):
            continue
        k = _kucuk(c)
        if not any(w[:KOK] in kokler for w in re.findall(r"[0-9a-zçğıöşüâîû]+", k) if len(w) >= 4):
            continue
        if any(x and x in k for x in cevap):
            continue
        if k in gor:
            continue
        gor.add(k)
        out.append(c)
        if len(out) >= n:
            break
    return out


def ara(con, cfg, konu, terimler=None, cevaplar=None, tasiyici=None, now=None, n=3):
    konu = str(konu or "").strip()[:100]
    if len(konu) < 2:
        return {"ok": False, "adaylar": [], "note": "Konu adı gerekli."}
    r = web.ara(con, cfg, arastir.ROL, "%s kodlama" % konu, n=5, tasiyici=tasiyici, now=now)
    if not r.get("sonuclar"):
        return {"ok": False, "adaylar": [], "note": r.get("note") or "Sonuç yok."}
    bulunan = []
    for x in r["sonuclar"][:SAYFA]:
        metin = x.get("ozet") or ""
        s = web.getir(con, cfg, arastir.ROL, x["url"], tasiyici=tasiyici, now=now)
        if s.get("ok"):
            metin = (s.get("metin") or "") + "\n" + metin
        for c in adaylar(metin, konu, terimler, cevaplar, n=n):
            if all(c != b["metin"] for b in bulunan):
                bulunan.append({"metin": c, "url": x["url"], "baslik": (s.get("baslik") if s.get("ok") else None) or x.get("baslik") or ""})
        if len(bulunan) >= n:
            break
    return {"ok": bool(bulunan), "adaylar": bulunan[:n],
            "note": None if bulunan else "Kaynaklı ve cevabı vermeyen bir kodlama bulunamadı."}


def bizim_mi(yol):
    return yol == YOL


def _liste(v, en=10, uzun=120):
    return [str(x)[:uzun] for x in (v if isinstance(v, list) else []) if isinstance(x, str) and x.strip()][:en]


def uc(con, cfg, metod, yol, q, govde, tasiyici=None, now=None):
    if metod != "POST" or yol != YOL:
        return 404, {"error": "yok"}
    g = govde if isinstance(govde, dict) else {}
    if not isinstance(g.get("konu"), str):
        return 400, {"error": "konu metin olmali"}
    return 200, ara(con, cfg, g["konu"], _liste(g.get("terimler")), _liste(g.get("cevaplar"), 4, 300),
                    tasiyici=tasiyici, now=now)
