# -*- coding: utf-8 -*-
"""Bolumlu test kitabi (ekip/PLAN.md §3.E ve §3.L; Tur 4).

   AYS bir sinav profilinden (ders -> konu) test kitabi ister. Is King'in
   onayindan gecer; BAM Uretim Burosu her ritim tikinde BIR bolum uretir ve
   o bolumu cevap anahtarini gormeyen bagimsiz bir cozumle denetler.

   Bes kural:

   1. GIRDI KAPALIDIR. Baslik, en cok 6 bolum (ders adi, en cok 12 konu,
      bolum basina 3-15 soru), zorluk dagilimi. Toplam en cok 60 soru:
      maliyet sinirsiz buyumez.
   2. ZORLUK DAGILIMINI KOD HESAPLAR (en buyuk kalan yontemi). Modelin her
      soruya yazdigi zorluk etiketi bir BEYANDIR; kayitta «tahmin» diye
      durur. Gercek zorluk kullanicinin cozumuyle olculur (AYS).
   3. KALITE KONTROLU ZORUNLUDUR. Bagimsiz cozum anahtarla tutmayan soru
      duser; dusenler ve nedeni kayda yazilir.
   4. HIC SORU GECMEYEN BOLUM KITABA GIRMEZ; hic bolum kalmazsa kayit
      yazilmaz ve teklif birakilmaz.
   5. KISISEL VERI YOK: istemde yalniz ders ve konu adlari gider."""
import json
import re

MAX_BOLUM = 6
MAX_KONU = 12
ADET = (3, 15)
MAX_TOPLAM = 60
ZORLUKLAR = ("kolay", "orta", "zor")
VARSAYILAN_ZORLUK = {"kolay": 30, "orta": 50, "zor": 20}


def _bosluk(s):
    return re.sub(r"\s+", " ", str(s or "")).strip()


def temizle(govde):
    """Is emri govdesi: {baslik, bolumler:[{ad, konular, adet}], zorluk?}."""
    if not isinstance(govde, dict):
        return None, ["kitap bir nesne olmalı"]
    hata = []
    for k in govde:
        if k not in ("baslik", "bolumler", "zorluk"):
            hata.append("kitap: bilinmeyen alan %s" % k)
    baslik = _bosluk(govde.get("baslik"))
    if not (2 <= len(baslik) <= 120):
        hata.append("baslik 2-120 karakter olmalı")
    ham = govde.get("bolumler")
    bolumler = []
    if not isinstance(ham, list) or not (1 <= len(ham) <= MAX_BOLUM):
        hata.append("bolumler 1-%d ögelik bir liste olmalı" % MAX_BOLUM)
        ham = []
    for i, b in enumerate(ham):
        if not isinstance(b, dict) or set(b) - {"ad", "konular", "adet"}:
            hata.append("%d. bölüm {ad, konular, adet} olmalı" % (i + 1))
            continue
        ad = _bosluk(b.get("ad"))
        konular = b.get("konular") if b.get("konular") is not None else []
        adet = b.get("adet")
        if not (2 <= len(ad) <= 80):
            hata.append("%d. bölümün adı 2-80 karakter olmalı" % (i + 1))
        if (not isinstance(konular, list) or len(konular) > MAX_KONU
                or any(not isinstance(k, str) or not (2 <= len(_bosluk(k)) <= 120)
                       for k in konular)):
            hata.append("%d. bölümün konuları en çok %d kısa metin olmalı" % (i + 1, MAX_KONU))
            konular = []
        if isinstance(adet, bool) or not isinstance(adet, int) or not (ADET[0] <= adet <= ADET[1]):
            hata.append("%d. bölümün soru sayısı %d-%d olmalı" % (i + 1, ADET[0], ADET[1]))
            adet = 0
        bolumler.append({"ad": ad, "konular": [_bosluk(k) for k in konular], "adet": adet})
    if len({b["ad"].lower() for b in bolumler}) != len(bolumler):
        hata.append("bölüm adları birbirinden farklı olmalı")
    if sum(b["adet"] for b in bolumler) > MAX_TOPLAM:
        hata.append("toplam soru en çok %d olabilir" % MAX_TOPLAM)
    z = govde.get("zorluk", VARSAYILAN_ZORLUK)
    if (not isinstance(z, dict) or set(z) != set(ZORLUKLAR)
            or any(isinstance(z[k], bool) or not isinstance(z[k], int) or z[k] < 0 for k in z)
            or sum(z.values()) != 100):
        hata.append("zorluk {kolay, orta, zor} tam sayı yüzdeleri olmalı ve toplamı 100 olmalı")
    if hata:
        return None, hata
    return {"baslik": baslik, "bolumler": bolumler, "zorluk": dict(z)}, []


def dagilim(adet, zorluk):
    """Bolumun zorluk dagilimi — en buyuk kalan yontemi. Toplam hep `adet`."""
    ham = {k: adet * zorluk[k] / 100.0 for k in ZORLUKLAR}
    out = {k: int(ham[k]) for k in ZORLUKLAR}
    kalan = adet - sum(out.values())
    for k in sorted(ZORLUKLAR, key=lambda x: (-(ham[x] - out[x]), ZORLUKLAR.index(x)))[:kalan]:
        out[k] += 1
    return out


BICIM = """
{"sorular": [{"soru": "...", "secenekler": ["...", "...", "...", "...", "..."],
 "dogru": "A|B|C|D|E", "cozum": "adım adım çözüm", "zorluk": "kolay|orta|zor"}]}
Kurallar: tam beş şık, şıklar birbirinden farklı; «hepsi» ya da «hiçbiri» şıkkı yok;
çeldiriciler makul ve tipik hatalardan gelsin; şıklara harf yazma. İstenen zorluk
sayılarına uy ve her soruya zorluğunu yaz."""


def istem(kitap, bolum, d):
    konular = ", ".join(bolum["konular"]) or "dersin genel kapsamı"
    return ("Test kitabı: %s\nBölüm: %s\nKonular: %s\nSoru sayısı: %d (kolay %d, orta %d, zor %d)"
            % (kitap["baslik"], bolum["ad"], konular, bolum["adet"],
               d["kolay"], d["orta"], d["zor"]))
