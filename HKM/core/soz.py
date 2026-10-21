# -*- coding: utf-8 -*-
"""Söz — sohbette soylenen gelecek plani (King 3.0, K2).

   «Yarın fizik sınavım var», «bu hafta türevi bitireceğim» bir sözdür:
   King onu not eder, zamani gelince sorar («Fizik sınavın nasıl geçti?»).
   Cevap ilgili module onayli oneri olabilir (core/bekleyen.py).

   Dort kural:
   1. YAKALAMAYI KOD YAPAR. Zaman ifadesi (core/tarihsoz.py) ve gelecek
      isareti (-ecek/-acak, «var», «olacak») birlikte yoksa soz yoktur.
      Model soz kurmaz; soru cumlesi de koddur.
   2. GORUNUR VE SILINIR. Her yakalanan soz cevapta soylenir; «bunu söz
      yapma» son sozu siler, liste HTTP ucundadir.
   3. TEKRAR EDEN PLAN SOZ DEGILDIR. «Her pazartesi…» bir beceridir
      (core/beceri.py); soru cumlesi ve gecmis zaman soz kurmaz.
   4. SAYI UYDURULMAZ. Vade tarihten hesaplanir; saat yoksa olay gunu
      aksam sorulur (tarihsoz.SORU_SAATI)."""
import datetime
import re

from core import bekleyen, tarihsoz

DURUMLAR = ("bekliyor", "soruldu", "kapandi", "iptal")
DURUM_AD = {"bekliyor": "Zamanı bekleniyor", "soruldu": "Soruldu", "kapandi": "Kapandı", "iptal": "Silindi"}
EN_UZUN = 200
EN_COK_ACIK = 50

# Birinci kisi gelecek: «bitireceğim», «gideceğiz», «çalışcam», «yapmam lazım».
KISI1 = re.compile(r"(?:acağı[mz]|eceği[mz]|acağ[ıi]m|ıcam|icem|ucam|ücem|acam\b|ecem\b|"
                   r"ma[mk] lazım|me[mk] lazım|ma[mk] gerek|me[mk] gerek|planlıyorum|niyetindeyim)", re.I)
TEKRAR = re.compile(r"\bher\s+\w+|\b\w+(?:ları|leri)\s+(?:hep|her)\b", re.I)
SAHIPLIK = re.compile(r"[aeıioöuü]m$")    # sınavım, randevum, provam
_DOLGU = re.compile(r"\b(ben(?:im)?|king|bil(?:gin olsun|iyorsun)|bu arada|ya|ki)\b", re.I)
SOZ_YAPMA = re.compile(r"^\s*(bunu|onu|şunu)?\s*(söz|hatırlatma)\s*(yapma|olarak kaydetme|tutma|"
                       r"kaydetme|alma|sil)\b|^\s*(o|bu)\s+bir\s+söz\s+değil", re.I)
LISTE = re.compile(r"^\s*(sözlerim|sözleri(?:mi)?\s*(göster|listele|say)|bekleyen sözler(?:im)?|"
                   r"verdiğim sözler)\s*[.?!]*\s*$", re.I)
NO_KOMUT = re.compile(r"^\s*söz\s*#?(\d+)(?:['’]?[iı])?\s*(sil|iptal|kapat)\s*[.!]?\s*$", re.I)
MODUL_SOZ = (("ays", r"sınav|deneme|ders|türev|integral|fizik|kimya|biyoloji|matematik|tyt|ayt|ödev|konu"),
             ("esp", r"kitap|kitab|kelime|ingilizce|almanca|dil\b|gitar|okuma|yazı|sunum|kurs"),
             ("spi", r"koşu|maç|antrenman|spor|doktor|tahlil|diyet|uyku|yürüyüş|salon|randevu"))


def _simdi(now=None):
    return datetime.datetime.fromisoformat(now) if now else datetime.datetime.now().replace(microsecond=0)


def _satir(r, now=None):
    d = dict(r)
    d["son"] = bool(d.get("son"))
    d["durum_ad"] = DURUM_AD.get(d["durum"], d["durum"])
    try:
        d["vade_metin"] = tarihsoz.an_metni(datetime.datetime.fromisoformat(d["vade"]), _simdi(now))
    except ValueError:
        d["vade_metin"] = d["vade"]
    return d


def modul_of(metin):
    t = tarihsoz.kucuk(metin)
    for m, desen in MODUL_SOZ:
        if re.search(desen, t):
            return m
    return None


def olay_of(metin, z):
    """«(yarın) fizik sınavım var» -> «fizik sınavın»; sahiplikli olay yoksa None."""
    m = re.search(r"(.+?)\s+(?:var|olacak)\b", tarihsoz.kucuk(metin))
    if not m:
        return None
    konu = m.group(1)
    if z.get("ifade"):
        konu = konu.replace(tarihsoz.kucuk(z["ifade"]), " ")
    konu = _DOLGU.sub(" ", konu)
    konu = re.sub(r"\bsaat\s*\d{1,2}(?:[:.]\d{2})?(?:['’]?\w+)?|\b\d{1,2}[:.]\d{2}(?:['’]?\w+)?", " ", konu)
    konu = re.sub(r"\b(sabah|öğlen|öğle|akşam|gece|bugün|yarın)\b", " ", konu)
    kelime = konu.split()
    if not 1 <= len(kelime) <= 5 or not SAHIPLIK.search(kelime[-1]):
        return None
    kelime[-1] = kelime[-1][:-1] + "n"
    return " ".join(kelime)


def soru_of(metin, z):
    """Vadede sorulacak cumle (kod). «X sınavım var» -> «X sınavın nasıl
    geçti?»; plan fiili -> «… demiştin; oldu mu?»."""
    olay = None if z["son"] else olay_of(metin, z)
    if olay:
        return olay[0].upper() + olay[1:] + " nasıl geçti?"
    t = " ".join(str(metin).split()).strip(" .!")
    return "«%s» demiştin; oldu mu?" % (t[0].upper() + t[1:])


def tani(metin, now=None):
    """Cumle bir söz mü? Doner {metin, soru, vade (datetime), gun, son, modul}
    ya da None. Soru cumlesi, tekrar eden plan ve gecmis zaman soz degildir."""
    t = " ".join(str(metin or "").split())
    if not t or len(t) > EN_UZUN or t.rstrip().endswith("?") or TEKRAR.search(t):
        return None
    simdi = _simdi(now)
    z = tarihsoz.tarih_of(t, simdi)
    if not z or not (KISI1.search(tarihsoz.kucuk(t)) or (not z["son"] and olay_of(t, z))):
        return None
    return {"metin": t, "soru": soru_of(t, z), "vade": tarihsoz.soru_ani(z, simdi), "gun": z["gun"],
            "son": z["son"], "modul": modul_of(t)}


def ekle(con, metin, soru, vade, gun, son=False, modul=None, kanal="local", hedef=None, now=None):
    now_s = (now or _simdi().isoformat())
    vade_s = vade.isoformat(timespec="seconds") if isinstance(vade, datetime.datetime) else str(vade)
    gun_s = gun.isoformat() if isinstance(gun, datetime.date) else str(gun)
    var = con.execute("SELECT * FROM king_sozler WHERE metin=? AND gun=? AND durum IN ('bekliyor','soruldu')",
                      (metin, gun_s)).fetchone()
    if var:
        return {"ok": True, "soz": _satir(var), "yinelenen": True}
    if con.execute("SELECT COUNT(*) FROM king_sozler WHERE durum='bekliyor'").fetchone()[0] >= EN_COK_ACIK:
        return {"ok": False, "note": "Açık söz sınırı dolu (%d); önce eskileri sil." % EN_COK_ACIK}
    cur = con.execute(
        "INSERT INTO king_sozler(metin, soru, vade, gun, son, modul, kanal, hedef, created_at, updated_at) "
        "VALUES (?,?,?,?,?,?,?,?,?,?)",
        (str(metin)[:EN_UZUN], str(soru)[:240], vade_s, gun_s, 1 if son else 0,
         modul if modul in bekleyen.kutu.MODULLER else None, kanal or "local", hedef, now_s, now_s))
    con.commit()
    return {"ok": True, "soz": getir(con, cur.lastrowid), "yinelenen": False}


def yakala(con, metin, modul=None, kanal="local", hedef=None, now=None):
    """Sohbet yolu: cumle soz ise yazar. Doner {soz, not} ya da None."""
    s = tani(metin, now)
    if not s:
        return None
    r = ekle(con, s["metin"], s["soru"], s["vade"], s["gun"], s["son"], modul or s["modul"],
             kanal, hedef, now=now)
    if not r["ok"] or r["yinelenen"]:
        return None
    z = _satir(con.execute("SELECT * FROM king_sozler WHERE id=?", (r["soz"]["id"],)).fetchone(), now)
    return {"soz": z, "not": "Söz aldım: %s soracağım («%s»). İstemezsen «bunu söz yapma» de." % (
        z["vade_metin"], z["soru"])}


def getir(con, sid):
    r = con.execute("SELECT * FROM king_sozler WHERE id=?", (sid,)).fetchone()
    return _satir(r) if r else None


def listele(con, durum=None, limit=50):
    if durum == "acik":
        rows = con.execute("SELECT * FROM king_sozler WHERE durum IN ('bekliyor','soruldu') "
                           "ORDER BY vade LIMIT ?", (limit,)).fetchall()
    elif durum in DURUMLAR:
        rows = con.execute("SELECT * FROM king_sozler WHERE durum=? ORDER BY vade DESC LIMIT ?",
                           (durum, limit)).fetchall()
    else:
        rows = con.execute("SELECT * FROM king_sozler WHERE durum!='iptal' ORDER BY "
                           "durum IN ('kapandi'), vade LIMIT ?", (limit,)).fetchall()
    return [_satir(r) for r in rows]


def sil(con, sid, now=None):
    z = getir(con, sid)
    if not z or z["durum"] == "iptal":
        return {"ok": False, "note": "Böyle bir söz yok."}
    now = now or _simdi().isoformat()
    con.execute("UPDATE king_sozler SET durum='iptal', updated_at=? WHERE id=?", (now, sid))
    con.commit()
    return {"ok": True, "soz": getir(con, sid)}


def duzelt(con, sid, alanlar, now=None):
    """Soru cumlesi ya da vade duzeltilir (yalniz acik sozde)."""
    z = getir(con, sid)
    if not z or z["durum"] not in ("bekliyor", "soruldu"):
        return {"ok": False, "note": "Düzeltilecek açık bir söz yok."}
    yeni = {}
    if "soru" in alanlar:
        s = " ".join(str(alanlar["soru"] or "").split())
        if not 3 <= len(s) <= 240:
            return {"ok": False, "note": "Soru 3-240 harf olmalı."}
        yeni["soru"] = s
    if "vade" in alanlar:
        try:
            v = datetime.datetime.fromisoformat(str(alanlar["vade"]))
        except ValueError:
            return {"ok": False, "note": "Vade YYYY-AA-GGTSS:DD olmalı."}
        yeni.update(vade=v.isoformat(timespec="seconds"), durum="bekliyor")
    if not yeni:
        return {"ok": False, "note": "Düzeltilecek alan: soru ya da vade."}
    yeni["updated_at"] = now or _simdi().isoformat()
    con.execute("UPDATE king_sozler SET %s WHERE id=?" % ", ".join("%s=?" % k for k in yeni),
                list(yeni.values()) + [sid])
    con.commit()
    return {"ok": True, "soz": getir(con, sid)}


def kapat(con, sid, cevap, now=None):
    now = now or _simdi().isoformat()
    con.execute("UPDATE king_sozler SET durum='kapandi', cevap=?, kapandi_at=?, updated_at=? "
                "WHERE id=? AND durum IN ('bekliyor','soruldu')", (str(cevap)[:400], now, now, sid))
    con.commit()
    return getir(con, sid)


def tik(con, now=None):
    """Vadesi gelen sozu sorar: King'in bekleyen mesaji olur. Doner: sayi."""
    simdi = _simdi(now)
    now_s = simdi.isoformat()
    rows = con.execute("SELECT * FROM king_sozler WHERE durum='bekliyor' AND vade<=? ORDER BY vade LIMIT 10",
                       (now_s,)).fetchall()
    for r in rows:
        bekleyen.teslim(con, "soz", r["id"], r["soru"], modul=r["modul"], kanal=r["kanal"], hedef=r["hedef"],
                        soru=True, now=now_s)
        con.execute("UPDATE king_sozler SET durum='soruldu', soruldu_at=?, updated_at=? WHERE id=?",
                    (now_s, now_s, r["id"]))
    con.commit()
    return len(rows)


def komut(con, metin, kanal="local", now=None):
    """«bunu söz yapma», «sözlerim», «söz 3 sil». Doner cevap metni ya da None."""
    m = str(metin or "").strip()
    if SOZ_YAPMA.search(m):
        r = con.execute("SELECT * FROM king_sozler WHERE kanal=? AND durum IN ('bekliyor','soruldu') "
                        "ORDER BY id DESC LIMIT 1", (kanal or "local",)).fetchone()
        if not r:
            return "Silinecek bir söz yok."
        sil(con, r["id"], now=now)
        return "Tamam, «%s» söz değil; sildim, sormayacağım." % r["metin"]
    n = NO_KOMUT.match(m)
    if n:
        r = sil(con, int(n.group(1)), now=now)
        return ("Söz #%s silindi." % n.group(1)) if r["ok"] else r["note"]
    if LISTE.match(m):
        acik = listele(con, "acik")
        if not acik:
            return "Açık bir söz yok. «Yarın fizik sınavım var» gibi bir plan söylersen not alırım."
        return "Açık sözler:\n" + "\n".join("#%d · %s · %s" % (z["id"], z["vade_metin"], z["metin"])
                                             for z in acik) + "\nSilmek için «söz N sil» yaz."
    return None
