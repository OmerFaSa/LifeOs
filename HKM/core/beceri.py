# -*- coding: utf-8 -*-
"""Beceri — King'e konusarak ogretilen is (King 3.0, K2).

   «Her pazartesi bana deneme hatırlat, akşam sonucunu sor»
   «'ders bitti' deyince süreyi AYS'ye yaz ve 5 dakikalık mola sayacı aç»

   Beceri = TETIK + EYLEMLER.
     tetik   {tur: "zaman", gunler: [0-6] (bos = her gün), saat: "HH:MM"}
             {tur: "soz", kalip: "ders bitti"}
     eylem   {tur: "mesaj", metin, saat?}      King soyler
             {tur: "soru", metin, saat?}       King sorar; cevap yazilir
             {tur: "sayac", dakika, ad}        modul sayaci acar
             {tur: "kayit", modul, metin, alan?}  modulun ayristiricisi onizler, ONAYLA yazar
             {tur: "arac", ad, param, yaz}     arac katalogu (core/arac.py); yaz -> onay karti

   Bes kural:
   1. OGRETMEYI KOD COZER. Tetik (core/tarihsoz.py, tirnakli söz) ve
      eylemler kalipla cikarilir; kod cikaramazsa model YALNIZ bir JSON
      onerir ve ayni dogrulamadan (`dogrula`) gecer. Gecmeyen soru olur.
   2. YAZAN EYLEM ONAYSIZ CALISMAZ. HKM hicbir module yazmaz: kayit ve
      yazan arac eylemi modulde onay kartiyla calisir (AGENTS §1.4, §1.9).
   3. GORUNUR. Listelenir, acilir-kapanir, duzeltilir, silinir; her cevap
      becerinin numarasini ve nasil kapatilacagini soyler.
   4. ZAMANI KOD TUTAR. Dakikalik ritim (`tik`) gunu ve saati gelen eylemi
      bir kez calistirir; gec kalan (HKM kapaliydi) GECIKME icinde calisir,
      daha eskisi atlanir. Ogretildigi andan once kalan saat calismaz.
   5. SÖZ TETIGI KISA MESAJDA CALISIR. «ders bitti» cumlenin ICINDE kisa
      bir mesajda gecmelidir; uzun bir paragrafta gecen kalip tetik degildir."""
import datetime
import json
import re

from core import ai, arac, bekleyen, kutu, seviye, soz, tarihsoz

TETIK_TUR = ("zaman", "soz")
EYLEM_TUR = ("mesaj", "soru", "sayac", "kayit", "arac")
EN_COK_EYLEM = 6
EN_COK_BECERI = 40
VARSAYILAN_SAAT = "09:00"
GECIKME = datetime.timedelta(hours=6)
SAAT_RE = re.compile(r"^(?:[01]\d|2[0-3]):[0-5]\d$")
MODUL_AD = {"ays": "AYS", "spi": "SPİ", "esp": "ESP"}

_TIRNAK = r"[«\"'‘“]"
_TIRNAK_SON = r"[»\"'’”]"
SOZ_TETIK = re.compile(
    _TIRNAK + r"([^«»\"'‘’“”]{2,40})" + _TIRNAK_SON + r"\s*(?:diye\s+)?"
    r"(?:de(?:yince|diğimde|diğim zaman|rsem|yip)|yaz(?:ınca|dığımda|arsam))\b", re.I)
SOZ_TETIK_DUZ = re.compile(
    r"^(?:bundan (?:sonra|böyle)\s*,?\s*|artık\s+)?(.{2,30}?)\s+"
    r"(?:deyince|dediğimde|dediğim zaman|dersem)\b", re.I)
OGRET_SON = re.compile(r"[\s,.;]*(?:(?:bunu|şunu)\s+)?(?:öğren|beceri olarak (?:kaydet|öğren)|beceri yap)"
                       r"(?:ir misin|ebilir misin)?\s*[.!]?\s*$", re.I)
OGRET_ON = re.compile(r"^\s*(?:king\s*,?\s*)?(?:bundan (?:sonra|böyle)|artık)\s*,?\s*", re.I)
EYLEM_FIIL = re.compile(r"(hatırlat|\bsor\b|\bsorar|söyle|\bde\b|\byaz\b|kaydet|\bekle\b|\baç\b|başlat|"
                        r"sayaç|sayac|zamanlayıcı|bildir|uyar)", re.I)
BOL = re.compile(r"\s*(?:,|;|\bve\b|\bsonra da\b|\bardından\b|\bsonra\b)\s*", re.I)
SAAT_SOZ = re.compile(r"\b(?:saat\s*\d{1,2}(?:[:.]\d{2})?(?:['’]?\w+)?|\d{1,2}[:.]\d{2}(?:['’]?\w+)?|"
                      r"sabah(?:ları)?|öğleden sonra|öğlen?|akşam(?:ları|a doğru)?|gece(?:leri)?)\b", re.I)
_SAYI = tarihsoz._SAYI
SAYAC = re.compile(_SAYI + r"\s*(?:dakika|dk)(?:lık)?\b", re.I)
SAYAC_SOZ = re.compile(r"sayaç|sayac|zamanlayıcı|mola|geri sayım|timer", re.I)
KAYIT_MODUL = re.compile(r"\b(ays|spi|esp)(?:['’]?(?:ye|ya|e|a|y[ae]))?\b", re.I)
KAYIT_FIIL = re.compile(r"\b(yaz|kaydet|ekle|gir|işle)", re.I)
HATIRLAT = re.compile(r"\b(?:bana\s+)?(?:hatırlat(?:ır mısın|)|bildir|uyar)\b", re.I)
SOR = re.compile(r"\b(?:bana\s+)?(?:sor(?:ar mısın|uver|)|sorar)\b", re.I)
BANA = re.compile(r"\b(?:bana|beni)\b", re.I)
SOYLE = re.compile(r"\s+(?:de|söyle|yaz)\s*[.!]?\s*$", re.I)
SONUC = re.compile(r"sonuc|sonuç|nasıl geçti|nasıl gitti", re.I)
LISTE = re.compile(r"^\s*(becerilerim|beceriler(?:im)?(?:i|ı)?\s*(göster|listele|say)|beceri listesi|"
                   r"ne(?:ler)? öğrendin)\s*[.?!]*\s*$", re.I)
NO_KOMUT = re.compile(r"^\s*beceri\s*#?(\d+)(?:['’]?[iı])?\s*(aç|kapat|sil|unut)\s*[.!]?\s*$", re.I)
SON_KOMUT = re.compile(r"^\s*(?:son|bu)\s+beceriyi\s+(aç|kapat|sil|unut)\s*[.!]?\s*$|^\s*beceriyi\s+(sil|unut)\s*[.!]?\s*$",
                       re.I)
CEVAP_DEGIL = re.compile(r"^\s*(?:o|bu)\s+(?:bir\s+)?cevap\s+değil(?:di)?\s*[.!]?\s*$", re.I)


def _simdi(now=None):
    return datetime.datetime.fromisoformat(now) if now else datetime.datetime.now().replace(microsecond=0)


def _bas(s):
    s = " ".join(str(s or "").split()).strip(" ,.;")
    return s[:1].upper() + s[1:] if s else s


def _nokta(s):
    s = _bas(s)
    return s if not s or s[-1] in ".!?" else s + "."


# ------------------------------------------------------------ dogrulama

def dogrula(tetik, eylemler, katalog=None):
    """(tetik, eylemler, hata). API'den, kod cozumunden ve modelden gelen
    beceri ayni kapidan gecer; uymayan alan duzeltilmez, reddedilir."""
    if not isinstance(tetik, dict) or tetik.get("tur") not in TETIK_TUR:
        return None, None, "tetik zaman ya da söz olmalı"
    if tetik["tur"] == "zaman":
        g = tetik.get("gunler") or []
        if not isinstance(g, list) or any(isinstance(x, bool) or not isinstance(x, int) or not 0 <= x <= 6 for x in g):
            return None, None, "günler 0 (pazartesi) ile 6 (pazar) arası olmalı"
        saat = str(tetik.get("saat") or "")
        if not SAAT_RE.match(saat):
            return None, None, "saat SS:DD olmalı"
        t = {"tur": "zaman", "gunler": sorted(set(g)), "saat": saat}
    else:
        k = " ".join(tarihsoz.kucuk(tetik.get("kalip")).split()).strip(" .!?")
        if not 2 <= len(k) <= 40:
            return None, None, "söz kalıbı 2-40 harf olmalı"
        t = {"tur": "soz", "kalip": k}
    if not isinstance(eylemler, list) or not 1 <= len(eylemler) <= EN_COK_EYLEM:
        return None, None, "1-%d eylem olmalı" % EN_COK_EYLEM
    out = []
    for e in eylemler:
        tur = (e or {}).get("tur") if isinstance(e, dict) else None
        if tur not in EYLEM_TUR:
            return None, None, "eylem türü mesaj, soru, sayac, kayit ya da arac olmalı"
        if tur in ("mesaj", "soru"):
            m = " ".join(str(e.get("metin") or "").split())
            if not 2 <= len(m) <= 300:
                return None, None, "mesaj 2-300 harf olmalı"
            d = {"tur": tur, "metin": m[:1].upper() + m[1:]}
        elif tur == "sayac":
            dk = e.get("dakika")
            if isinstance(dk, bool) or not isinstance(dk, int) or not 1 <= dk <= 180:
                return None, None, "sayaç 1-180 dakika olmalı"
            d = {"tur": "sayac", "dakika": dk, "ad": _bas(e.get("ad") or "Sayaç")[:30]}
        elif tur == "kayit":
            m = " ".join(str(e.get("metin") or "").split())
            if e.get("modul") not in kutu.MODULLER or not 2 <= len(m) <= 200:
                return None, None, "kayıt eylemi modül (ays, spi, esp) ve metin ister"
            if e.get("alan") not in (None, "sure"):
                return None, None, "kayıt alanı yalnız «sure» olabilir"
            d = {"tur": "kayit", "modul": e["modul"], "metin": m, "alan": e.get("alan")}
        else:
            ad, param = str(e.get("ad") or ""), e.get("param") or {}
            if not arac.AD_RE.match(ad) or not isinstance(param, dict):
                return None, None, "araç adı ve parametreleri geçersiz"
            yaz = True                      # katalog bilinmiyorsa yazan sayilir: onay karti
            if katalog:
                gecerli, red = arac.cagri_dogrula([{"ad": ad, "param": param}], katalog)
                if not gecerli:
                    return None, None, "araç: %s" % (red[0]["neden"] if red else "geçersiz")
                param, yaz = gecerli[0]["param"], gecerli[0]["tur"] == "yaz"
            d = {"tur": "arac", "ad": ad, "param": param, "yaz": yaz}
        if t["tur"] == "zaman" and e.get("saat") not in (None, "", t["saat"]):
            if not SAAT_RE.match(str(e["saat"])):
                return None, None, "eylem saati SS:DD olmalı"
            d["saat"] = e["saat"]
        out.append(d)
    return t, out, None


# ------------------------------------------------------------ cumleden beceri

def ogretme_mi(metin):
    t = str(metin or "").strip()
    if not t or len(t) > 400 or t.endswith("?"):
        return False
    if OGRET_SON.search(t) or SOZ_TETIK.search(t) or SOZ_TETIK_DUZ.search(OGRET_SON.sub("", t)):
        return True
    return bool(tarihsoz.tekrar_of(t) and EYLEM_FIIL.search(tarihsoz.kucuk(t)))


def _eylem_of(parca, konu):
    """Tek parca -> (eylem, konu) ya da (None, konu)."""
    ham = parca.strip(" ,.;")
    saat = tarihsoz.saat_of(ham) if SAAT_SOZ.search(ham) else None
    temiz = " ".join(SAAT_SOZ.sub(" ", ham).split()).strip(" ,.;")
    k = tarihsoz.kucuk(temiz)
    e = None
    sm = SAYAC.search(k)
    if sm and SAYAC_SOZ.search(k):
        dk = tarihsoz._sayi(sm.group(1))
        if dk and 1 <= dk <= 180:
            e = {"tur": "sayac", "dakika": dk, "ad": "Mola" if "mola" in k else "Sayaç"}
    if e is None:
        km = KAYIT_MODUL.search(k)
        if km and KAYIT_FIIL.search(k):
            e = {"tur": "kayit", "modul": km.group(1).lower(), "metin": temiz,
                 "alan": "sure" if "süre" in k else None}
    if e is None and SOR.search(k):
        obj = " ".join(BANA.sub(" ", SOR.sub(" ", temiz)).split()).strip(" ,.;")
        if not obj or SONUC.search(obj):
            m = (_bas(konu) + " nasıl geçti?") if konu else "Nasıl geçti?"
        else:
            m = "Sormamı istediğin şey: «%s». Ne durumda?" % obj
        e = {"tur": "soru", "metin": m}
    if e is None and HATIRLAT.search(k):
        obj = " ".join(BANA.sub(" ", HATIRLAT.sub(" ", temiz)).split()).strip(" ,.;")
        if obj:
            konu = konu or obj
            e = {"tur": "mesaj", "metin": "Hatırlatma: %s." % obj}
    if e is None:
        q = re.search(_TIRNAK + r"([^«»\"'‘’“”]{2,200})" + _TIRNAK_SON, temiz)
        if q or SOYLE.search(temiz):
            m = q.group(1) if q else re.sub(r"^\s*bana\s+", "", SOYLE.sub("", temiz))
            if len(m.strip()) >= 2:
                e = {"tur": "mesaj", "metin": _nokta(m)}
    if e is not None and saat:
        e["saat"] = saat
    return e, konu


def tani(metin):
    """Ogreten cumle -> {tetik, eylemler, ad, anlasilmayan, varsayilan_saat}
    ya da {eksik: ...} (kod cikaramadi). Ogretme degilse None."""
    t = " ".join(str(metin or "").split())
    if not ogretme_mi(t):
        return None
    govde = OGRET_ON.sub("", OGRET_SON.sub("", t)).strip(" ,.;")
    tetik, kalan, varsayilan = None, govde, False
    m = SOZ_TETIK.search(govde) or SOZ_TETIK_DUZ.search(govde)
    if m:
        tetik = {"tur": "soz", "kalip": " ".join(tarihsoz.kucuk(m.group(1)).split()).strip(" .!?")}
        kalan = govde[m.end():]
    else:
        z = tarihsoz.tekrar_of(govde)
        if z:
            i = tarihsoz.kucuk(govde).find(z["ifade"])
            kalan = govde[:i] + " " + govde[i + len(z["ifade"]):]
            tetik = {"tur": "zaman", "gunler": z["gunler"], "saat": z["saat"]}
    if not tetik:
        return {"eksik": "tetik"}
    eylemler, anlasilmayan, konu = [], [], None
    for p in [x for x in BOL.split(kalan) if x and x.strip(" ,.;")]:
        e, konu = _eylem_of(p, konu)
        if e:
            eylemler.append(e)
        else:
            anlasilmayan.append(p.strip(" ,.;"))
    if not eylemler:
        return {"eksik": "eylem", "tetik": tetik, "anlasilmayan": anlasilmayan}
    if tetik["tur"] == "zaman":
        if not tetik["saat"]:
            ilk = eylemler[0].pop("saat", None)
            tetik["saat"] = ilk or VARSAYILAN_SAAT
            varsayilan = not ilk
        for e in eylemler:
            if e.get("saat") == tetik["saat"]:
                e.pop("saat")
    else:
        for e in eylemler:
            e.pop("saat", None)
    return {"tetik": tetik, "eylemler": eylemler, "anlasilmayan": anlasilmayan,
            "varsayilan_saat": varsayilan, "ad": ad_of(tetik, eylemler, konu)}


def ad_of(tetik, eylemler, konu=None):
    if tetik["tur"] == "soz":
        return "«%s» deyince" % tetik["kalip"]
    ne = konu or next((e["metin"] for e in eylemler if e["tur"] in ("mesaj", "soru")), "") or eylemler[0]["tur"]
    return ("%s %s · %s" % (tarihsoz.gunler_metni(tetik["gunler"]), tetik["saat"], ne))[:80]


MODEL_SISTEM = (
    "Kullanıcı yardımcısına bir beceri öğretiyor. Cümleyi YALNIZ şu JSON'a çevir, başka hiçbir şey yazma:\n"
    '{"tetik": {"tur": "zaman", "gunler": [0], "saat": "09:00"} ya da {"tur": "soz", "kalip": "<kullanıcının '
    'tırnak içindeki sözü>"},\n'
    ' "eylemler": [{"tur": "mesaj", "metin": "..."} | {"tur": "soru", "metin": "..."} | '
    '{"tur": "sayac", "dakika": 5, "ad": "Mola"} | {"tur": "kayit", "modul": "ays|spi|esp", "metin": "..."}]}\n'
    "gunler: 0 pazartesi … 6 pazar; boş liste her gün. Saat cümlede yoksa \"09:00\". Cümlede olmayan sayıyı "
    "yazma. Anlamadıysan {} yaz.")


def model_ile(con, cfg, metin, katalog=None, transport=None, tetik=None):
    """Kod cikaramadiginda modelin JSON onerisi; `dogrula`dan gecmezse None.
    `tetik`: kodun buldugu tetik — o zaman modelden yalniz eylemler alinir."""
    # Paket seciliyse model seviyeyle bulunur (core/seviye.py); cozumleme en alt basamakta.
    if not ai.hazir_mi(cfg, "king", seviye=seviye.ALT)["ok"]:
        return None
    r = ai.ask(con, cfg, "king", "beceri.ogren", [{"role": "user", "content": str(metin)[:400]}],
               sistem=MODEL_SISTEM, transport=transport, duzeltme=False, denetim="belge", jeton=300,
               seviye=seviye.ALT)
    if not r.get("ok"):
        return None
    ham = r.get("text") or ""
    a, b = ham.find("{"), ham.rfind("}")
    v = arac.gevsek_json(ham[a:b + 1]) if a >= 0 and b > a else None
    if not isinstance(v, dict):
        return None
    kod_tetik = tetik
    tetik, eylemler, hata = dogrula(kod_tetik or v.get("tetik"), v.get("eylemler"), katalog)
    if hata:
        return None
    # Modelin söz kalibi cumlede gecmeli (sahada gemma4 ornekteki kalibi kopyaladi).
    if not kod_tetik and tetik["tur"] == "soz" and tetik["kalip"] not in tarihsoz.kucuk(metin):
        return None
    # Model sayi uyduramaz: sayac dakikasi ve saat cumlede gecmeli.
    rakam = set(re.findall(r"\d+", str(metin)))
    for e in eylemler:
        if e["tur"] == "sayac" and str(e["dakika"]) not in rakam and not SAYAC.search(tarihsoz.kucuk(metin)):
            return None
    if not kod_tetik and tetik["tur"] == "zaman" and tetik["saat"] != VARSAYILAN_SAAT and not SAAT_SOZ.search(str(metin)):
        return None
    return {"tetik": tetik, "eylemler": eylemler, "anlasilmayan": [], "varsayilan_saat": False,
            "ad": ad_of(tetik, eylemler), "model": r.get("model")}


# ------------------------------------------------------------ kayit

def _satir(r):
    d = dict(r)
    for k, v0 in (("tetik", {}), ("eylemler", []), ("son", {})):
        try:
            d[k] = json.loads(d.get(k) or json.dumps(v0))
        except ValueError:
            d[k] = v0
    d["acik"] = bool(d["acik"])
    d["ozet"] = ozet(d)
    return d


def _eylem_metni(e):
    if e["tur"] in ("mesaj", "soru"):
        return "«%s»" % e["metin"]
    if e["tur"] == "sayac":
        return "%d dakikalık %s sayacı" % (e["dakika"], e["ad"].lower())
    if e["tur"] == "kayit":
        return "%s kaydı (onayla)" % MODUL_AD.get(e["modul"], e["modul"])
    return "%s aracı%s" % (e["ad"], " (onayla)" if e.get("yaz") else "")


def ozet(b):
    """Ekran cumlesi: «Her pazartesi 09:00 → «Hatırlatma: deneme.»; 20:00 → «…»»."""
    t = b["tetik"]
    if t["tur"] == "soz":
        bas = "«%s» deyince" % t["kalip"]
        return bas + " → " + ", ".join(_eylem_metni(e) for e in b["eylemler"])
    gruplar = {}
    for e in b["eylemler"]:
        gruplar.setdefault(e.get("saat") or t["saat"], []).append(_eylem_metni(e))
    parca = ["%s → %s" % (s, ", ".join(gruplar[s])) for s in sorted(gruplar)]
    return "%s %s" % (tarihsoz.gunler_metni(t["gunler"]), "; ".join(parca))


def ekle(con, tetik, eylemler, ad=None, modul=None, kanal="local", hedef=None, kaynak="", katalog=None, now=None):
    tetik, eylemler, hata = dogrula(tetik, eylemler, katalog)
    if hata:
        return {"ok": False, "note": hata}
    now = now or _simdi().isoformat()
    tj, ej = json.dumps(tetik, ensure_ascii=False, sort_keys=True), json.dumps(eylemler, ensure_ascii=False, sort_keys=True)
    var = con.execute("SELECT * FROM king_beceriler WHERE tetik=? AND eylemler=?", (tj, ej)).fetchone()
    if var:
        return {"ok": True, "beceri": _satir(var), "yinelenen": True}
    if con.execute("SELECT COUNT(*) FROM king_beceriler").fetchone()[0] >= EN_COK_BECERI:
        return {"ok": False, "note": "Beceri sınırı dolu (%d); önce kullanmadıklarını sil." % EN_COK_BECERI}
    ad = " ".join(str(ad or ad_of(tetik, eylemler)).split())[:80]
    cur = con.execute(
        "INSERT INTO king_beceriler(ad, tetik, eylemler, modul, kanal, hedef, kaynak, created_at, updated_at) "
        "VALUES (?,?,?,?,?,?,?,?,?)",
        (ad, tj, ej, modul if modul in kutu.MODULLER else None, kanal or "local", hedef, str(kaynak)[:400], now, now))
    con.commit()
    return {"ok": True, "beceri": getir(con, cur.lastrowid), "yinelenen": False}


def getir(con, bid):
    r = con.execute("SELECT * FROM king_beceriler WHERE id=?", (bid,)).fetchone()
    return _satir(r) if r else None


def listele(con):
    return [_satir(r) for r in con.execute("SELECT * FROM king_beceriler ORDER BY acik DESC, id").fetchall()]


def ac_kapat(con, bid, acik, now=None):
    b = getir(con, bid)
    if not b:
        return {"ok": False, "note": "Böyle bir beceri yok."}
    con.execute("UPDATE king_beceriler SET acik=?, updated_at=? WHERE id=?",
                (1 if acik else 0, now or _simdi().isoformat(), bid))
    con.commit()
    return {"ok": True, "beceri": getir(con, bid)}


def sil(con, bid):
    b = getir(con, bid)
    if not b:
        return {"ok": False, "note": "Böyle bir beceri yok."}
    con.execute("DELETE FROM king_beceriler WHERE id=?", (bid,))
    con.commit()
    return {"ok": True, "beceri": b}


def duzelt(con, bid, alanlar, katalog=None, now=None):
    """ad, tetik, eylemler duzeltilir; yeni hali ayni dogrulamadan gecer."""
    b = getir(con, bid)
    if not b:
        return {"ok": False, "note": "Böyle bir beceri yok."}
    tetik, eylemler, hata = dogrula(alanlar.get("tetik", b["tetik"]), alanlar.get("eylemler", b["eylemler"]), katalog)
    if hata:
        return {"ok": False, "note": hata}
    ad = " ".join(str(alanlar.get("ad") or b["ad"]).split())[:80]
    con.execute("UPDATE king_beceriler SET ad=?, tetik=?, eylemler=?, updated_at=? WHERE id=?",
                (ad, json.dumps(tetik, ensure_ascii=False, sort_keys=True),
                 json.dumps(eylemler, ensure_ascii=False, sort_keys=True), now or _simdi().isoformat(), bid))
    con.commit()
    return {"ok": True, "beceri": getir(con, bid)}


# ------------------------------------------------------------ calistirma

def _paket(eylemler):
    """Eylemler -> (King'in cumlesi, soru mu, modulde calisacak eylemler)."""
    soz_ = [e["metin"] for e in eylemler if e["tur"] in ("mesaj", "soru")]
    for e in eylemler:
        if e["tur"] == "sayac":
            soz_.append("%d dakikalık %s sayacını açıyorum." % (e["dakika"], e["ad"].lower()))
        elif e["tur"] == "kayit":
            soz_.append("%s kaydı için onayını isteyeceğim." % MODUL_AD.get(e["modul"], e["modul"]))
        elif e["tur"] == "arac" and e.get("yaz"):
            soz_.append("Bunun için önce onayını isteyeceğim.")
    return " ".join(soz_), any(e["tur"] == "soru" for e in eylemler), [
        {k: v for k, v in e.items() if k != "saat"} for e in eylemler]


def tik(con, now=None):
    """Gunu ve saati gelen zaman eylemlerini calistirir. Doner: teslim sayisi."""
    simdi = _simdi(now)
    bugun, n = simdi.date().isoformat(), 0
    for r in con.execute("SELECT * FROM king_beceriler WHERE acik=1 ORDER BY id").fetchall():
        b = _satir(r)
        t = b["tetik"]
        if t.get("tur") != "zaman" or (t["gunler"] and simdi.weekday() not in t["gunler"]):
            continue
        gruplar = {}
        for i, e in enumerate(b["eylemler"]):
            gruplar.setdefault(e.get("saat") or t["saat"], []).append(i)
        son, degisti = dict(b["son"]), False
        for saat, sira in sorted(gruplar.items()):
            an = datetime.datetime.combine(simdi.date(), datetime.time(*map(int, saat.split(":"))))
            if an > simdi or all(son.get(str(i)) == bugun for i in sira):
                continue
            for i in sira:
                son[str(i)] = bugun
            degisti = True
            if b["created_at"] > an.isoformat() or simdi - an > GECIKME:
                continue                    # ogretilmeden once kalan ya da cok gec: atlanir
            metin, soru_mu, eylemler = _paket([b["eylemler"][i] for i in sira])
            bekleyen.teslim(con, "beceri", b["id"], metin, modul=b["modul"], kanal=b["kanal"], hedef=b["hedef"],
                            eylemler=eylemler, soru=soru_mu, now=simdi.isoformat())
            con.execute("UPDATE king_beceriler SET calisma=calisma+1, son_calisma=? WHERE id=?",
                        (simdi.isoformat(), b["id"]))
            n += 1
        if degisti:
            con.execute("UPDATE king_beceriler SET son=? WHERE id=?", (json.dumps(son), b["id"]))
    con.commit()
    return n


def soz_eslesir(kalip, metin):
    t = " ".join(re.sub(r"[^\w\s]", " ", tarihsoz.kucuk(metin)).split())
    return len(t) <= len(kalip) + 25 and re.search(r"(?<!\w)%s(?!\w)" % re.escape(kalip), t) is not None


def soz_tetigi(con, metin, modul=None, kanal="local", now=None):
    """Mesaj acik bir söz becerisini tetikliyor mu? Doner (beceri, cumle, eylemler) ya da None."""
    for r in con.execute("SELECT * FROM king_beceriler WHERE acik=1 ORDER BY id").fetchall():
        b = _satir(r)
        if b["tetik"].get("tur") == "soz" and soz_eslesir(b["tetik"]["kalip"], metin):
            now = now or _simdi().isoformat()
            metin_, soru_mu, eylemler = _paket(b["eylemler"])
            if soru_mu:
                bekleyen.teslim(con, "beceri", b["id"], metin_, modul=modul or b["modul"], kanal=kanal,
                                eylemler=eylemler, soru=True, now=now, dogrudan=True)
            con.execute("UPDATE king_beceriler SET calisma=calisma+1, son_calisma=? WHERE id=?", (now, b["id"]))
            con.commit()
            return b, metin_, eylemler
    return None


# ------------------------------------------------------------ sohbet yolu

def _ogrendim_metni(b, t):
    satir = ["Öğrendim (beceri #%d): %s." % (b["id"], b["ozet"])]
    if t.get("varsayilan_saat"):
        satir.append("Saat söylemediğin için %s yazdım; değiştirmek için yeniden öğret ya da listeden düzelt."
                     % b["tetik"]["saat"])
    if t.get("anlasilmayan"):
        satir.append("Şu kısmı anlamadım, eklemedim: «%s»." % "», «".join(t["anlasilmayan"]))
    if any(e["tur"] in ("kayit", "arac") for e in b["eylemler"]):
        satir.append("Yazan adımlar her seferinde önce onayını ister.")
    satir.append("Kapatmak için «beceri %d kapat», silmek için «beceri %d sil»." % (b["id"], b["id"]))
    return " ".join(satir)


def sohbet_cevabi(con, cfg, metin, kanal="local", hedef=None, modul=None, katalog=None, transport=None, now=None):
    """King sohbetinin kural yolu: beceri ogretme, liste, ac/kapat/sil,
    söz komutlari, söz tetigi. Doner cevap nesnesi ya da None."""
    m = " ".join(str(metin or "").split())
    if not m:
        return None
    if CEVAP_DEGIL.match(m):
        r = bekleyen.geri_al(con, kanal, now=now)
        return {"command": "cevap", "text": ("Tamam, «%s» sorusunun cevabını sildim; soru açık kaldı." % r["soru"])
                if r else "Geri alınacak bir cevap yok."}
    sk = soz.komut(con, m, kanal=kanal, now=now)
    if sk:
        return {"command": "soz", "text": sk}
    if LISTE.match(m):
        l = listele(con)
        if not l:
            return {"command": "beceri", "text": "Henüz beceri öğretmedin. Örnek: «her pazartesi bana deneme hatırlat, "
                                                  "akşam sonucunu sor» ya da «'ders bitti' deyince 5 dakikalık mola sayacı aç»."}
        return {"command": "beceri", "beceriler": l, "text": "Beceriler:\n" + "\n".join(
            "#%d · %s%s" % (b["id"], b["ozet"], "" if b["acik"] else " (kapalı)") for b in l)
            + "\nAçmak, kapatmak ya da silmek için «beceri N kapat» gibi yaz."}
    n = NO_KOMUT.match(m)
    s = SON_KOMUT.match(m) if not n else None
    if n or s:
        if n:
            bid, is_ = int(n.group(1)), n.group(2).lower()
        else:
            son = con.execute("SELECT id FROM king_beceriler ORDER BY id DESC LIMIT 1").fetchone()
            if not son:
                return {"command": "beceri", "text": "Henüz bir beceri yok."}
            bid, is_ = son["id"], (s.group(1) or s.group(2)).lower()
        if is_ in ("sil", "unut"):
            r = sil(con, bid)
            return {"command": "beceri", "text": ("Beceri #%d silindi: %s." % (bid, r["beceri"]["ozet"]))
                    if r["ok"] else r["note"]}
        r = ac_kapat(con, bid, is_ == "aç", now=now)
        return {"command": "beceri", "beceri": r.get("beceri"),
                "text": ("Beceri #%d %s." % (bid, "açık" if is_ == "aç" else "kapalı")) if r["ok"] else r["note"]}
    t = tani(m)
    if t is not None:
        if "eksik" in t:
            kod, varsayilan = t.get("tetik"), False
            if kod and kod["tur"] == "zaman" and not kod["saat"]:
                varsayilan = not tarihsoz.saat_of(m)
                kod = dict(kod, saat=tarihsoz.saat_of(m) or VARSAYILAN_SAAT)
            mt = model_ile(con, cfg, m, katalog, transport, tetik=kod)
            t = dict(mt, varsayilan_saat=varsayilan) if mt else t
        if "eksik" in t:
            neden = ("ne zaman ya da hangi sözle çalışacağını" if t["eksik"] == "tetik" else "ne yapacağımı")
            return {"command": "ogren", "text": "Bunu beceri olarak öğrenmek istiyorum ama %s anlayamadım. Örnek: "
                    "«her pazartesi bana deneme hatırlat, akşam sonucunu sor» ya da «'ders bitti' deyince "
                    "5 dakikalık mola sayacı aç»." % neden}
        r = ekle(con, t["tetik"], t["eylemler"], ad=t["ad"], modul=modul, kanal=kanal, hedef=hedef, kaynak=m,
                 katalog=katalog, now=now)
        if not r["ok"]:
            return {"command": "ogren", "text": "Bu beceriyi kaydedemedim: %s." % r["note"]}
        b = r["beceri"]
        if r["yinelenen"]:
            return {"command": "ogren", "beceri": b, "text": "Bunu zaten biliyorum (beceri #%d): %s." % (b["id"], b["ozet"])}
        return {"command": "ogren", "beceri": b, "text": _ogrendim_metni(b, t), "dayanak": "model" if t.get("model") else "kural"}
    st = soz_tetigi(con, m, modul=modul, kanal=kanal, now=now)
    if st:
        b, cumle, eylemler = st
        return {"command": "beceri", "beceri": b, "eylemler": eylemler,
                "text": cumle or "«%s» becerisi çalıştı." % b["tetik"]["kalip"]}
    return None


# ------------------------------------------------------------ HTTP

UCLAR = ("beceriler", "sozler", "bekleyen")


def bizim_mi(yol):
    p = str(yol or "").strip("/").split("/")
    return len(p) >= 3 and p[:2] == ["api", "king"] and p[2] in UCLAR


def _no(p, i):
    try:
        return int(p[i])
    except (ValueError, IndexError):
        return None


def uc(con, cfg, yontem, yol, q=None, govde=None, now=None):
    """/api/king/{beceriler,sozler,bekleyen}. Doner (kod, nesne) ya da None."""
    if not bizim_mi(yol):
        return None
    q = q or {}
    govde = govde if isinstance(govde, dict) else {}
    p = yol.strip("/").split("/")
    ilk = lambda k, v=None: (q.get(k) or [v])[0]           # noqa: E731
    if yontem == "GET":
        if p[2] == "beceriler" and len(p) == 3:
            return 200, {"beceriler": listele(con)}
        if p[2] == "beceriler" and len(p) == 4:
            b = getir(con, _no(p, 3))
            return (200, {"beceri": b}) if b else (404, {"error": "beceri yok"})
        if p[2] == "sozler" and len(p) == 3:
            return 200, {"sozler": soz.listele(con, ilk("durum"))}
        if p[2] == "bekleyen" and len(p) == 3:
            m = ilk("modul")
            if m not in kutu.MODULLER + ("hkm",):
                return 422, {"error": "modul ays, spi, esp ya da hkm olmalı"}
            return 200, {"mesajlar": bekleyen.al(con, m, now=now)}
        return 404, {"error": "bilinmeyen uç"}
    if yontem != "POST":
        return 405, {"error": "yöntem desteklenmiyor"}
    katalog = arac.katalog_temizle(govde["araclar"])[0] if isinstance(govde.get("araclar"), list) else None
    if p[2] == "beceriler" and len(p) == 3:
        if govde.get("metin") and not govde.get("tetik"):
            t = tani(govde["metin"])
            if t is None or "eksik" in t:
                return 422, {"ok": False, "note": "Bu cümleden beceri çıkaramadım.", "eksik": (t or {}).get("eksik")}
            r = ekle(con, t["tetik"], t["eylemler"], ad=t["ad"], modul=govde.get("modul"), kaynak=govde["metin"],
                     katalog=katalog, now=now)
        else:
            r = ekle(con, govde.get("tetik"), govde.get("eylemler"), ad=govde.get("ad"), modul=govde.get("modul"),
                     kaynak=govde.get("kaynak") or "", katalog=katalog, now=now)
        return (201 if r["ok"] else 422), r
    if p[2] == "beceriler" and len(p) == 4:
        r = duzelt(con, _no(p, 3), govde, katalog=katalog, now=now)
        return (200 if r["ok"] else 404 if r["note"] == "Böyle bir beceri yok." else 422), r
    if p[2] == "beceriler" and len(p) == 5 and p[4] in ("ac", "kapat", "sil"):
        r = sil(con, _no(p, 3)) if p[4] == "sil" else ac_kapat(con, _no(p, 3), p[4] == "ac", now=now)
        return (200 if r["ok"] else 404), r
    if p[2] == "sozler" and len(p) == 3:
        if govde.get("vade"):
            try:
                vade = datetime.datetime.fromisoformat(str(govde["vade"]))
            except ValueError:
                return 422, {"ok": False, "note": "Vade YYYY-AA-GGTSS:DD olmalı."}
            metin = " ".join(str(govde.get("metin") or "").split())
            if not 2 <= len(metin) <= soz.EN_UZUN:
                return 422, {"ok": False, "note": "Söz metni gerekli."}
            r = soz.ekle(con, metin, govde.get("soru") or "«%s» demiştin; oldu mu?" % metin, vade, vade.date(),
                         modul=govde.get("modul"), now=now)
        else:
            s = soz.tani(govde.get("metin"), now)
            if not s:
                return 422, {"ok": False, "note": "Bu cümlede zamanı belli bir plan bulamadım; «vade» ile ekleyebilirsin."}
            r = soz.ekle(con, s["metin"], s["soru"], s["vade"], s["gun"], s["son"], govde.get("modul") or s["modul"],
                         now=now)
        return (201 if r["ok"] else 422), r
    if p[2] == "sozler" and len(p) == 4:
        r = soz.duzelt(con, _no(p, 3), govde, now=now)
        return (200 if r["ok"] else 422), r
    if p[2] == "sozler" and len(p) == 5 and p[4] == "sil":
        r = soz.sil(con, _no(p, 3), now=now)
        return (200 if r["ok"] else 404), r
    if p[2] == "bekleyen" and len(p) == 5 and p[4] == "geri":
        r = bekleyen.geri_al(con, None, bid=_no(p, 3), now=now)
        return (200, {"ok": True, "bekleyen": r}) if r else (404, {"ok": False, "note": "Geri alınacak cevap yok."})
    return 404, {"error": "bilinmeyen uç"}
