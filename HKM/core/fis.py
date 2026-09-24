# -*- coding: utf-8 -*-
"""Fis okuma — para kolunun fotograf girisi (kullanici karari 2026-09-24:
«fis okuma gibi ozellikler eklensin»).

Sira hic degismez:

   model OKUR  →  kod DOGRULAR  →  TASLAK  →  kullanici ONAYLAR  →  para kaydi

1. SAYIYI MODEL URETMEZ, OKUR (AGENTS §1.1). Okudugu bir taslaktir,
   «tahmin» etiketlidir ve kullanici onaylamadan para kaydina GIRMEZ.
   Onaylanan kayit kullanicinin beyanidir (kaynak «fis»).
2. OKUNAMAYAN UYDURULMAZ. Toplam yoksa ya da sifirsa taslak olmaz;
   «tutari kendin yaz» denir. Tarih okunamazsa ya da gelecekteyse bugun
   yazilir ve SOYLENIR. Kalemlerin toplami fisin toplamini tutmuyorsa
   SOYLENIR (kullanici duzeltir).
3. KATEGORIYI KOD SECER (para.KATEGORI sozlugu, magaza + kalem adlari);
   bilinmeyen «Diğer». Model kategori onermez.
4. MAHREMIYET. Telegram'da yalniz «fiş» basligiyla gelen fotograf okunur;
   gelen her fotograf modele gitmez.
5. MODEL YOKSA KAPANMAZ, SOYLER. Gorsel model atanmamissa fis okunmaz ve
   neyin eksik oldugu soylenir; elle ekleme her zaman calisir.
"""

import base64
import datetime
import json
import re

from core import ai, para

ROL = "para.fis"
TARIH_GERI_GUN = 60                 # bundan eski fis tarihi supheli sayilir
TUTMAZLIK_ORAN = 0.01               # kalem toplami ile fis toplami arasi pay
MAX_KALEM = 40
BASLIK = re.compile(r"(?i)\b(fi[sş]|fatura|makbuz)\b")
KOMUT = re.compile(r"(?i)^\s*fi[sş]\s+(kaydet|onayla|iptal|vazge[cç])\s*[.!]?\s*$")

SISTEM = (
    "Bir alışveriş fişinin fotoğrafını okuyorsun. Yalnız fişte YAZANI oku; "
    "tahmin etme, hesaplama yapma, eksik olanı doldurma. Cevabın YALNIZ şu JSON "
    "olsun, başka hiçbir şey yazma:\n"
    '{"magaza": "fişteki işletme adı ya da null", '
    '"tarih": "YYYY-AA-GG ya da null", '
    '"toplam": "fişteki GENEL TOPLAM, yazıldığı gibi (örn. 245,90) ya da null", '
    '"para_birimi": "fişte yazan (TL, USD, EUR) ya da null", '
    '"kalemler": [{"ad": "ürün adı", "tutar": "yazıldığı gibi"}], '
    '"okunamadi": false}\n'
    "Fotoğraf fiş değilse ya da toplam okunmuyorsa \"okunamadi\": true yaz.")


def _simdi(now=None):
    return now or datetime.datetime.now().isoformat(timespec="seconds")


def kategori(magaza, kalemler):
    """Kod sozlugu: once magaza adi, sonra kalem adlari. Bilinmeyen «Diğer»."""
    for metin in [magaza] + [(k or {}).get("ad") for k in (kalemler or [])]:
        k = para._kucuk(metin)
        if not k:
            continue
        for ad, sozler in para.KATEGORI:
            if ad != "Gelir" and para._kelime_var(k, sozler):
                return ad
    return "Diğer"


def _kurus(deger):
    """«245,90», «1.245,90», 245.9 → kurus; okunamazsa None."""
    if isinstance(deger, bool) or deger is None:
        return None
    if isinstance(deger, (int, float)):
        return int(round(float(deger) * 100)) if deger > 0 else None
    t = str(deger).strip().replace("₺", "").replace("TL", "").replace("tl", "").strip()
    m = para.TUTAR.fullmatch(t)
    if not m:
        return None
    k = para._tutar(m)[0]
    return k or None


def _metin(kurus):
    """Formun tutar alani: «245,90» — sayiyi yuz degil KOD yazar."""
    return para.tl(kurus, "TRY").rsplit(" ", 1)[0]


def _json(ham):
    t = str(ham or "").strip()
    t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t)
    i, j = t.find("{"), t.rfind("}")
    if i < 0 or j <= i:
        return None
    try:
        d = json.loads(t[i:j + 1])
    except ValueError:
        return None
    return d if isinstance(d, dict) else None


def dogrula(d, bugun):
    """Modelin okudugu → taslak govdesi ya da (None, neden). Kod karar verir."""
    if not d or d.get("okunamadi") is True:
        return None, "Fişi okuyamadım. Tutarı kendin yazabilirsin: «market 245,90 TL»."
    kurus = _kurus(d.get("toplam"))
    if not kurus:
        return None, ("Fişin toplamı okunamadı; tutar uydurulmaz. Tutarı kendin "
                      "yazabilirsin: «market 245,90 TL».")
    uyari = []
    birim = para.BIRIM.get(para._kucuk(d.get("para_birimi") or ""))
    if not birim:
        birim = "TRY"
        uyari.append("Fişte para birimi okunmadı; TL yazıldı.")
    gun = str(d.get("tarih") or "")
    try:
        g = datetime.date.fromisoformat(gun)
        b = datetime.date.fromisoformat(bugun)
        if g > b or (b - g).days > TARIH_GERI_GUN:
            raise ValueError
    except ValueError:
        if d.get("tarih"):
            uyari.append("Fişteki tarih (%s) geçerli görünmüyor; bugünün tarihi yazıldı."
                         % str(d.get("tarih"))[:20])
        else:
            uyari.append("Fişte tarih okunmadı; bugünün tarihi yazıldı.")
        gun = bugun
    kalemler = []
    for k in (d.get("kalemler") or [])[:MAX_KALEM]:
        if not isinstance(k, dict):
            continue
        ad = " ".join(str(k.get("ad") or "").split())[:60]
        tk = _kurus(k.get("tutar"))
        if ad and tk:
            kalemler.append({"ad": ad, "kurus": tk, "tutar": _metin(tk)})
    if kalemler:
        top = sum(k["kurus"] for k in kalemler)
        if abs(top - kurus) > max(100, kurus * TUTMAZLIK_ORAN):
            uyari.append("Kalemlerin toplamı (%s) fişin toplamını (%s) tutmuyor; "
                         "kaydetmeden önce tutarı kontrol et."
                         % (para.tl(top, birim), para.tl(kurus, birim)))
    magaza = " ".join(str(d.get("magaza") or "").split())[:60]
    return {"kurus": kurus, "tutar": _metin(kurus), "birim": birim, "gun": gun, "yon": "gider",
            "kategori": kategori(magaza, kalemler), "aciklama": magaza,
            "kalemler": kalemler, "uyarilar": uyari, "etiket": "tahmin"}, None


def _taslak_yaz(con, govde, kanal, hedef, now=None):
    cur = con.execute("INSERT INTO para_taslak(kanal, hedef, govde, created_at) VALUES (?,?,?,?)",
                      (kanal, hedef, json.dumps(govde, ensure_ascii=False), _simdi(now)))
    con.commit()
    return cur.lastrowid


def taslak(con, id_):
    r = con.execute("SELECT * FROM para_taslak WHERE id=?", (int(id_),)).fetchone()
    if not r:
        return None
    d = dict(r)
    d["govde"] = json.loads(d["govde"])
    return d


def bekleyen(con, kanal, hedef=None):
    r = con.execute("SELECT id FROM para_taslak WHERE durum='bekliyor' AND kanal=? "
                    "AND COALESCE(hedef,'')=COALESCE(?,'') ORDER BY id DESC LIMIT 1",
                    (kanal, hedef)).fetchone()
    return taslak(con, r["id"]) if r else None


def oku(con, cfg, gorsel, mime, bugun, kanal="web", hedef=None, transport=None, now=None):
    """Fotograf baytlari → taslak. Para kaydina HICBIR SEY yazmaz."""
    h = ai.hazir_mi(cfg, ROL)
    if not h.get("ok"):
        return {"ok": False, "reason": "model",
                "note": "Fiş okumak için bir görsel model gerekli (HKM › Modeller › "
                        "«Para · Fiş okuyan»). " + str(h.get("note") or "")}
    veri = base64.b64encode(gorsel or b"").decode("ascii")
    r = ai.ask(con, cfg, ROL, "gorsel_oku",
               [{"role": "user", "content": "Bu fişi oku."}], sistem=SISTEM,
               transport=transport, now=now, denetim="belge", duzeltme=False,
               veri=["fis_gorseli"], gorseller=[{"mime": mime, "data": veri}])
    if not r.get("ok"):
        return {"ok": False, "reason": r.get("reason"), "note": r.get("note") or "Fiş okunamadı."}
    govde, neden = dogrula(_json(r.get("text")), bugun)
    if not govde:
        return {"ok": False, "reason": "okunamadi", "note": neden}
    id_ = _taslak_yaz(con, govde, kanal, hedef, now)
    return {"ok": True, "id": id_, "taslak": govde}


def ozet(govde):
    """Kullaniciya giden tek cumle — sayilar KODUN yazdigi."""
    s = "Fişten okudum (tahmin, sen onaylayana kadar yazılmaz): %s%s, %s, %s." % (
        (govde["aciklama"] + " · ") if govde.get("aciklama") else "",
        para.tl(govde["kurus"], govde["birim"]), govde["kategori"], govde["gun"])
    if govde.get("uyarilar"):
        s += " Dikkat: " + " ".join(govde["uyarilar"])
    return s


def kaydet(con, id_, duzeltme, bugun, now=None):
    """Taslagi kullanicinin ONAYIYLA para kaydina yazar; duzeltme verilebilir."""
    t = taslak(con, id_)
    if not t:
        return {"ok": False, "note": "Taslak bulunamadı."}
    if t["durum"] != "bekliyor":
        return {"ok": False, "note": "Bu taslak zaten %s." % (
            "kaydedildi" if t["durum"] == "kaydedildi" else "iptal edildi")}
    g = t["govde"]
    d = duzeltme if isinstance(duzeltme, dict) else {}
    veri = {"yon": d.get("yon") or g["yon"],
            "tutar": str(d.get("tutar")) if d.get("tutar") not in (None, "") else
            _metin(g["kurus"]),
            "birim": d.get("birim") or g["birim"],
            "kategori": d.get("kategori") or g["kategori"],
            "aciklama": d.get("aciklama") if d.get("aciklama") is not None else g["aciklama"],
            "gun": d.get("gun") or g["gun"]}
    r = para.ekle(con, veri, bugun, now=now, kaynak="fis", metin="fiş taslağı %d" % t["id"])
    if not r.get("ok"):
        return r
    con.execute("UPDATE para_taslak SET durum='kaydedildi', para_id=?, karar_at=? WHERE id=?",
                (r["id"], _simdi(now), t["id"]))
    con.commit()
    return {"ok": True, "para_id": r["id"], "taslak_id": t["id"]}


def iptal(con, id_, now=None):
    cur = con.execute("UPDATE para_taslak SET durum='iptal', karar_at=? "
                      "WHERE id=? AND durum='bekliyor'", (_simdi(now), int(id_)))
    con.commit()
    return {"ok": cur.rowcount == 1}


def komut(con, metin, kanal, hedef, bugun):
    """«fiş kaydet» / «fiş iptal». Komut degilse None."""
    m = KOMUT.match(str(metin or ""))
    if not m:
        return None
    t = bekleyen(con, kanal, hedef)
    if not t:
        return "Bekleyen bir fiş taslağı yok. Fişin fotoğrafını «fiş» yazarak gönderebilirsin."
    if m.group(1).lower() in ("iptal", "vazgec", "vazgeç"):
        iptal(con, t["id"])
        return "Fiş taslağı iptal edildi; hiçbir şey yazılmadı."
    r = kaydet(con, t["id"], None, bugun)
    if not r.get("ok"):
        return "Kaydedilmedi: " + (r.get("note") or "; ".join(r.get("errors") or []))
    return ("Fiş kaydedildi: %s. Yanlışsa «para geri al» değil, HKM › Para'dan sil."
            % para.tl(t["govde"]["kurus"], t["govde"]["birim"]))


def telegram_isle(con, cfg, transport=None, bugun=None, now=None, limit=1):
    """Ritim: «fiş» baslikli, indirilmis Telegram fotograflarini okur; taslak
    cevap olarak gonderene gider. Her tikte en cok `limit` fotograf."""
    from core import outbox
    bugun = bugun or datetime.date.today().isoformat()
    satirlar = con.execute(
        "SELECT * FROM attachments WHERE kind='photo' AND state='ready' AND analyzed_at IS NULL "
        "AND local_path IS NOT NULL ORDER BY id").fetchall()
    islenen = 0
    for a in satirlar:
        if not BASLIK.search(a["caption"] or ""):
            continue
        if islenen >= limit:
            break
        con.execute("UPDATE attachments SET analyzed_at=? WHERE id=?", (_simdi(now), a["id"]))
        con.commit()
        islenen += 1
        try:
            with open(a["local_path"], "rb") as f:
                ham = f.read()
        except OSError:
            continue
        mime = a["mime_type"] if a["mime_type"] in ai.GORSEL_MIME else "image/jpeg"
        r = oku(con, cfg, ham, mime, bugun, kanal=a["channel"], hedef=a["sender"],
                transport=transport, now=now)
        metin = (ozet(r["taslak"]) + " Kaydetmek için «fiş kaydet», vazgeçmek için «fiş iptal» yaz."
                 if r.get("ok") else r.get("note"))
        outbox.enqueue(con, a["channel"], "fis:%d" % a["id"], bugun, metin, target=a["sender"],
                       now=now)
    return {"ok": True, "islenen": islenen}

