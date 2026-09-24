# -*- coding: utf-8 -*-
"""Para kolu (Y1) — HKM'nin KENDI kaydi.

   Kullanici 2026-09-24: «para takibi HKM'de toplanacak; turlu turlu seyi
   oradan girecegiz». Girisler: Telegram, HKM sohbeti, HKM › Para formu ve
   fis fotografi (core/fis.py: model okur, kod dogrular, kullanici onaylar).

   Bes kural:

   1. TUTARI KULLANICI SOYLER. Kod yalniz okur; tutarsiz cumle kayit
      degildir. Yazilan tutar kullanicinin beyanidir: «ölçüldü».
   2. PARA OLDUGU BELLI OLMALI. Para birimi (TL, ₺, lira) ya da para
      sozcugu (market, kira, harcadim, maas…) yoksa sayi para sayilmaz:
      «40 soru» 40 lira, «kitap 30» 30 lira degildir (AGENTS §1.7). Ayni
      mesajda acik bir para parcasi varsa oteki tutarlar da paradir.
   3. KUCUK AKSIYON. Tek mesajin kayitlari hemen yazilir; cevapta geri
      alma yolu soylenir («para geri al»). Silinen kayit silinmis
      isaretlenir, kaybolmaz.
   4. KATEGORI KOD SOZLUGUNDEN; bilinmeyen «Diğer». Hic bir sey tahmin
      edilmez; kullanici HKM › Para'dan degistirir.
   5. KUR YOK, CEVIRI YOK. TL disi para birimi kendi satirinda toplanir;
      TL toplamina katilmaz (kur uydurulmaz)."""
import datetime
import re
import uuid

BIRIM = {"tl": "TRY", "₺": "TRY", "lira": "TRY", "try": "TRY",
         "$": "USD", "usd": "USD", "dolar": "USD", "€": "EUR", "eur": "EUR", "euro": "EUR", "avro": "EUR"}
BIRIM_YAZ = {"TRY": "TL", "USD": "USD", "EUR": "EUR"}
TUTAR = re.compile(r"(?<![\w.,])(₺\s?)?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2})|\.(\d{1,2}))?(?![\d])"
                   r"\s*(tl|₺|lira|try|\$|usd|dolar|€|eur|euro|avro)?(?![\wçğıöşü])", re.I)
# YON sozcukleri: kayit zaten para ise gelir mi gider mi. KANIT degildir:
# «deneme sonucu 85 geldi» para degildir.
GELIR = ("maaş", "maas", "gelir", "geldi", "yattı", "yatti", "kazandım", "kazandim", "harçlık",
         "harclik", "burs", "iade", "satış", "satis", "prim")
# KANIT sozcukleri: tek basina «bu para» dedirten sozcukler. «aldım», «verdim»
# ve «para» bilerek YOK: «2 saat ders aldım», «30 dakika ara verdim»,
# «paragraf 20» para degildir (entegre.js bu son hatayi yakaladi).
PARA_SOZ = ("harcadım", "harcadim", "harcama", "ödedim", "odedim", "ödeme", "odeme",
            "fatura", "kira", "market", "maaş", "maas", "borç", "borc", "burs", "harçlık",
            "harclik", "gelir", "lira")
KATEGORI = (
    ("Gıda", ("market", "manav", "bakkal", "fırın", "firin", "kasap", "pazar", "migros", "bim", "a101", "şok")),
    ("Dışarıda yemek", ("kafe", "kahve", "restoran", "lokanta", "döner", "doner", "yemek", "pizza")),
    ("Konut", ("kira", "aidat")),
    ("Fatura", ("fatura", "elektrik", "doğalgaz", "dogalgaz", "internet", "telefon", "su faturası")),
    ("Ulaşım", ("benzin", "otobüs", "otobus", "metro", "taksi", "ulaşım", "ulasim", "akbil", "yol", "mazot")),
    ("Sağlık", ("ilaç", "ilac", "eczane", "doktor", "hastane", "tahlil", "diş", "dis")),
    ("Eğitim", ("kitap", "kurs", "dershane", "okul", "deneme", "kırtasiye", "kirtasiye")),
    ("Spor", ("spor", "salon", "fitness")),
    ("Giyim", ("giyim", "kıyafet", "kiyafet", "ayakkabı", "ayakkabi", "mont", "pantolon")),
    ("Gelir", ("maaş", "maas", "burs", "harçlık", "harclik", "prim", "satış", "satis", "iade")),
)
KATEGORILER = [k for k, _ in KATEGORI] + ["Diğer"]
AYRAC = re.compile(r"\s*(?:;|\n|,(?!\d)|\bve\b)\s*", re.I)
DUN = re.compile(r"\bdün\b|\bdun\b", re.I)


def _kucuk(s):
    return str(s or "").replace("I", "ı").replace("İ", "i").lower()


def _tutar(m):
    tam = int(m.group(2).replace(".", ""))
    ondalik = m.group(3) or m.group(4) or ""
    kurus = tam * 100 + (int(ondalik.ljust(2, "0")) if ondalik else 0)
    birim = BIRIM.get(_kucuk(m.group(5) or ""), None)
    if m.group(1):
        birim = "TRY"
    return kurus, birim


# Sozcuk KENDISI ya da yaygin bir ekle: «kira», «kirayı», «kirası»; ama «kiraz»
# ya da «paragraf» degil.
EK = r"(?:[ıiuü]|y[ıiuüae]|s[ıiuü]|[ıiuü]n[ıiuü]|y[ıiuü]|y[ae]|d[ae]n?|t[ae]n?|[ıiuü]m|[ıiuü]n|l[ae]r[ıi]?|n[ıi])?"


def _kelime_var(k, sozler):
    return any(re.search(r"(?<![\wçğıöşü])" + re.escape(s) + EK + r"(?![\wçğıöşü])", k) for s in sozler)


def _acik(p):
    """Parca KENDI BASINA para mi: birim ya da para sozcugu. Kategori sozcugu
    («kitap», «spor») tek basina kanit DEGIL: «kitap 30» ESP'nin, «spor 45»
    SPI'nin kisa kaydidir."""
    m = TUTAR.search(p)
    return bool(m and (_tutar(m)[1] or _kelime_var(_kucuk(p), PARA_SOZ)))


def _parca(p, baglam=False):
    """Tek parcadan tek kayit ya da None. `baglam`: ayni mesajda acik bir
    para parcasi var; bu parcanin tutari da paradir."""
    k = _kucuk(p)
    tutarlar = list(TUTAR.finditer(p))
    if len(tutarlar) != 1:
        return None                      # tutarsiz ya da iki tutarli parca: kayit degil
    m = tutarlar[0]
    kurus, birim = _tutar(m)
    if not baglam and not _acik(p):
        return None                      # para oldugu belli degil
    if kurus <= 0 or kurus > 100000000 * 100:
        return None
    yon = "gelir" if _kelime_var(k, GELIR) else "gider"
    kategori = "Gelir" if yon == "gelir" else next(
        (ad for ad, s in KATEGORI if ad != "Gelir" and _kelime_var(k, s)), "Diğer")
    aciklama = re.sub(r"\s+", " ", (p[:m.start()] + " " + p[m.end():])).strip(" .,:;-")
    aciklama = re.sub(r"(?i)\b(dün|dun|bugün|bugun)\b", "", aciklama).strip(" .,:;-")
    return {"yon": yon, "kurus": kurus, "birim": birim or "TRY", "kategori": kategori,
            "aciklama": aciklama[:80]}


def tani(metin):
    """Mesaj para kaydi mi? Doner: None ya da {"kayitlar": [...], "gun_kayma": 0|-1}."""
    m = str(metin or "").strip()
    if not m or m.startswith("/") or len(m) > 400:
        return None
    k = _kucuk(m)
    if not TUTAR.search(m):
        return None
    # «para geri al» bir komuttur, kayit degil
    if "geri al" in k:
        return None
    parcalar = [p for p in AYRAC.split(m) if p and p.strip()]
    baglam = any(_acik(p) for p in parcalar)
    if not baglam:
        return None
    kayitlar, anlasilmayan = [], []
    for p in parcalar:
        if not TUTAR.search(p):
            continue
        r = _parca(p, baglam=True)
        if r:
            kayitlar.append(r)
        else:
            anlasilmayan.append(p.strip())
    if not kayitlar:
        return None
    return {"kayitlar": kayitlar, "anlasilmayan": anlasilmayan,
            "gun_kayma": -1 if DUN.search(m) else 0}


def _simdi(now=None):
    return now or datetime.datetime.now().isoformat(timespec="seconds")


def yaz(con, bulgu, kaynak, metin, bugun, now=None):
    gun = (datetime.date.fromisoformat(bugun)
           + datetime.timedelta(days=bulgu.get("gun_kayma") or 0)).isoformat()
    grup = uuid.uuid4().hex[:12]
    ids = []
    for x in bulgu["kayitlar"]:
        cur = con.execute(
            "INSERT INTO para(gun, yon, kurus, birim, kategori, aciklama, kaynak, metin, grup, created_at)"
            " VALUES (?,?,?,?,?,?,?,?,?,?)",
            (gun, x["yon"], x["kurus"], x["birim"], x["kategori"], x["aciklama"], kaynak,
             str(metin or "")[:200], grup, _simdi(now)))
        ids.append(cur.lastrowid)
    con.commit()
    return {"ok": True, "ids": ids, "grup": grup, "gun": gun}


def ekle(con, veri, bugun, now=None, kaynak="web", metin=""):
    """HKM › Para formu: {gun, yon, tutar, birim, kategori, aciklama}. Dogrular.

    `kaynak`: «web» (form) ya da «fis» (onaylanmis fis taslagi, core/fis.py)."""
    if not isinstance(veri, dict):
        return {"ok": False, "errors": ["kayıt bir nesne olmalı"]}
    hata = []
    gun = str(veri.get("gun") or bugun)
    try:
        datetime.date.fromisoformat(gun)
    except ValueError:
        hata.append("gün YYYY-AA-GG olmalı")
    yon = veri.get("yon")
    if yon not in ("gider", "gelir"):
        hata.append("yön gider ya da gelir olmalı")
    t = str(veri.get("tutar") or "").strip()
    m = TUTAR.fullmatch(t) if t else None
    kurus = _tutar(m)[0] if m else 0
    if not kurus:
        hata.append("tutar sıfırdan büyük bir sayı olmalı (örn. 450 ya da 85,50)")
    birim = veri.get("birim") or "TRY"
    if birim not in BIRIM_YAZ:
        hata.append("birim TL, USD ya da EUR olmalı")
    kategori = veri.get("kategori") or "Diğer"
    if kategori not in KATEGORILER:
        hata.append("bilinmeyen kategori")
    if hata:
        return {"ok": False, "errors": hata}
    b = {"kayitlar": [{"yon": yon, "kurus": kurus, "birim": birim, "kategori": kategori,
                       "aciklama": str(veri.get("aciklama") or "").strip()[:80]}], "gun_kayma": 0}
    r = yaz(con, b, kaynak, metin, gun, now=now)
    return {"ok": True, "id": r["ids"][0]}


def sil(con, id_):
    cur = con.execute("UPDATE para SET silindi=1 WHERE id=? AND silindi=0", (id_,))
    con.commit()
    return {"ok": cur.rowcount == 1}


def geri_al(con, kaynak):
    """O kaynaktan gelen SON mesajin kayitlarini silinmis isaretler."""
    r = con.execute("SELECT grup FROM para WHERE kaynak=? AND silindi=0 ORDER BY id DESC LIMIT 1",
                    (kaynak,)).fetchone()
    if not r:
        return {"ok": False, "adet": 0}
    cur = con.execute("UPDATE para SET silindi=1 WHERE grup=?", (r["grup"],))
    con.commit()
    return {"ok": True, "adet": cur.rowcount}


def tl(kurus, birim="TRY"):
    tam, kr = divmod(abs(int(kurus)), 100)
    s = "{:,}".format(tam).replace(",", ".") + ("," + str(kr).zfill(2) if kr else "")
    return ("-" if kurus < 0 else "") + s + " " + BIRIM_YAZ.get(birim, birim)


def ay(con, ay_):
    """Bir ayin kayitlari ve ozeti. Birim basina ayri toplam (kur yok)."""
    try:
        datetime.date.fromisoformat(ay_ + "-01")
    except (ValueError, TypeError):
        return {"ok": False, "error": "ay YYYY-AA olmalı"}
    satir = [dict(r) for r in con.execute(
        "SELECT id, gun, yon, kurus, birim, kategori, aciklama, kaynak FROM para "
        "WHERE silindi=0 AND substr(gun,1,7)=? ORDER BY gun DESC, id DESC", (ay_,)).fetchall()]
    toplam = {}
    kat = {}
    for x in satir:
        t = toplam.setdefault(x["birim"], {"gelir": 0, "gider": 0})
        t[x["yon"]] += x["kurus"]
        if x["yon"] == "gider" and x["birim"] == "TRY":
            kat[x["kategori"]] = kat.get(x["kategori"], 0) + x["kurus"]
    ozet = [{"birim": b, "gelir": t["gelir"], "gider": t["gider"], "net": t["gelir"] - t["gider"],
             "metin": "Gelir %s · gider %s · net %s" % (tl(t["gelir"], b), tl(t["gider"], b),
                                                       tl(t["gelir"] - t["gider"], b))}
            for b, t in sorted(toplam.items())]
    kategoriler = [{"kategori": k, "kurus": v, "tutar": tl(v)}
                   for k, v in sorted(kat.items(), key=lambda kv: -kv[1])]
    for x in satir:
        x["tutar"] = tl(x["kurus"], x["birim"])
    return {"ok": True, "ay": ay_, "kayitlar": satir, "ozet": ozet, "kategoriler": kategoriler,
            "kesinlik": "ölçüldü" if satir else "veri yok",
            "metin": ("Bu ay kayıt yok." if not satir else
                      " · ".join(o["metin"] for o in ozet))}


def cevap(con, r, bugun):
    """Sohbet/Telegram cevabi: ne yazildi, ayin gideri, geri alma yolu."""
    satir = []
    for i in r["ids"]:
        x = con.execute("SELECT yon, kurus, birim, kategori, aciklama FROM para WHERE id=?", (i,)).fetchone()
        satir.append("%s %s (%s%s)" % (tl(x["kurus"], x["birim"]), x["yon"], x["kategori"],
                                       (", " + x["aciklama"]) if x["aciklama"] else ""))
    a = ay(con, r["gun"][:7])
    try_ = next((o for o in a["ozet"] if o["birim"] == "TRY"), None)
    son = (" Bu ay gider: %s." % tl(try_["gider"])) if try_ else ""
    return ("Kaydedildi: " + "; ".join(satir) + "." + son
            + " Yanlışsa «para geri al» yaz; HKM › Para’dan düzeltebilirsin.")
