# -*- coding: utf-8 -*-
"""Kendiliginden model kullanimi — TEK ANAHTAR (`king.kendiliginden`).

   Kullanici, 2026-10-26: «HKM modeli ne zaman kullanir, ben karar vereyim;
   kendi basina arastirmayi tek dugmeyle acip kapatayim.»

   1. VARSAYILAN KAPALI. Kapaliyken HKM modeli yalniz kullanici isteyince
      cagirir: sohbet, «Araştır», onaylanan teklif ve gorev.
   2. TEK ANAHTAR, UC KAPI. Kullanicinin istemedigi model isi uc yerden
      dogar ve uc de buna bakar: King'in guncellik turu (core/king.py
      bekci) yeni arastirma ACMAZ; sirada bekleyen kendiliginden BAM isi
      (kaynak «kendiliginden») KOSMAZ, acilinca sirasi gelir; Ollama'nin
      sicak tutmasi (core/ollama.py isit) modeli YUKLEMEZ.
   3. Anahtar Bugun'un sistem kartindadir (web/index.html aktifCiz).

   KURAL MOTORU (KING-4 C, 2026-11-01; sozlesme belgeler/ekip/KING-OLAY.md).
   Moduller olay yollar (POST /api/olay); kod olayi «King simdi konussun mu?»
   kararina cevirir. Model YOK: mesaj ve «neden simdi?» satiri sablondan,
   sayi modulun yolladigi etiketli sayidan gelir (AGENTS §1.1, §1.2). Bu
   yuzden yukaridaki model anahtarina bagli degildir; kapatmak icin
   `king.kendiliginden_butce` = 0.
   1. GUNLUK BOLME BUTCESI: gunde en cok BUTCE mesaj; once oncelikli olay.
   2. SESSIZ SAAT: bildirim ayarindaki pencere (bossa 23:00-08:00); bu arada
      gelen olay «bekliyor» kalir, pencere bitince dakikalik tik yeniden bakar.
   3. AYNI SEY IKI KEZ SOYLENMEZ: ayni kimlik tek olaydir; ayni modul ve tur
      TEKRAR suresi icinde bir kez konusur; BAYAT olay konusmaz.
   4. Mesaj king_bekleyen'e (tur «kendiliginden») duser; modul onu bugunku
      yoldan alir (GET /api/king/bekleyen). Satirin `neden` alani: olay, kural,
      sayilar, cumle."""
import datetime
import json
import re

from core import bekleyen, bildirim

MODULLER = ("ays", "spi", "esp")
ETIKETLER = ("ölçüldü", "hesaplandı", "tahmin", "veri yok")
TUR = re.compile(r"^[a-z][a-z_]{2,39}$")
SAYI_AD = re.compile(r"^[a-z][a-z0-9_]{0,23}$")
EN_COK_SAYI = 8
BUTCE = 3
EN_COK_BUTCE = 10
SESSIZ = ("23:00", "08:00")
TEKRAR = datetime.timedelta(hours=20)
BAYAT = datetime.timedelta(hours=18)
YAKIN_GUNLER = (30, 14, 7, 3, 1)
OKUNUR = {"ort7": "7 günlük ortalama", "ort28": "28 günlük ortalama", "kalan_gun": "kalan gün",
          "gecikme_dk": "gecikme", "adet": "tekrar"}


def acik(cfg):
    return bool(((cfg or {}).get("king") or {}).get("kendiliginden") is True)


def _s(x):
    """5.9 -> «5,9»; tam sayi ondaliksiz."""
    x = round(float(x), 1)
    return str(int(x)) if x == int(x) else str(x).replace(".", ",")


# tur -> moduller, zorunlu sayilar, oncelik (kucuk once), esik, mesaj.
KURALLAR = {
    "sinav_yaklasti": {
        "moduller": ("ays",), "sayilar": ("kalan_gun",), "oncelik": 1, "kural": "sinav_gun_esigi",
        "esik": lambda d, o: d["kalan_gun"] in YAKIN_GUNLER,
        "mesaj": lambda d, o: "Sınava %s gün kaldı. Bu haftanın planına birlikte bakalım mı?" % _s(d["kalan_gun"])},
    "uyku_dustu": {
        "moduller": ("spi",), "sayilar": ("ort7", "ort28"), "oncelik": 2, "kural": "uyku_7g_dusus",
        "esik": lambda d, o: d["ort7"] <= d["ort28"] - 0.75 or d["ort7"] < 6,
        "mesaj": lambda d, o: ("Son 7 günde uykun ortalama %s saate düştü (28 günlük ortalaman %s saat). "
                               "Bu akşamın yatış saatini birlikte planlayalım mı?" % (_s(d["ort7"]), _s(d["ort28"])))},
    "plan_kacti": {
        "moduller": MODULLER, "sayilar": ("gecikme_dk",), "oncelik": 3, "kural": "plan_30dk",
        "esik": lambda d, o: d["gecikme_dk"] >= 30,
        "mesaj": lambda d, o: "%s planda %s dakika gecikti. Yeni bir saate alalım mı?"
                              % ("«%s»" % o["konu"] if o.get("konu") else "Bir plan maddesi", _s(d["gecikme_dk"]))},
    "tekrar_gunu": {
        "moduller": ("ays", "esp"), "sayilar": ("adet",), "oncelik": 3, "kural": "tekrar_var",
        "esik": lambda d, o: d["adet"] >= 1,
        "mesaj": lambda d, o: "Bugün %s tekrarın var%s. Başlayalım mı?"
                              % (_s(d["adet"]), " (%s)" % o["konu"] if o.get("konu") else "")},
}


def _an(now=None):
    return now or datetime.datetime.now().replace(microsecond=0)


def butce(cfg):
    n = ((cfg or {}).get("king") or {}).get("kendiliginden_butce", BUTCE)
    return max(0, min(n, EN_COK_BUTCE)) if isinstance(n, int) and not isinstance(n, bool) else BUTCE


def sessiz_saat(cfg):
    a = bildirim.settings(cfg)
    return (a["sessiz_bas"], a["sessiz_bit"]) if a.get("sessiz_bas") and a.get("sessiz_bit") else SESSIZ


def sessiz_mi(cfg, now):
    bas, bit = sessiz_saat(cfg)
    return bildirim.sessiz_mi({"bildirim": {"sessiz_bas": bas, "sessiz_bit": bit}}, now)


def dogrula(g):
    """Govde -> (olay, hata). Bicim KING-OLAY.md'dedir."""
    if not isinstance(g, dict):
        return None, "gövde nesne olmalı"
    modul, tur, kimlik = g.get("modul"), g.get("tur"), g.get("kimlik")
    if modul not in MODULLER:
        return None, "modul ays, spi ya da esp olmalı"
    if not isinstance(tur, str) or not TUR.match(tur):
        return None, "tur küçük harf ve alt çizgi olmalı"
    if not isinstance(kimlik, str) or not kimlik.strip() or len(kimlik) > 80:
        return None, "kimlik gerekli (en çok 80 harf)"
    at = g.get("at")
    if at is not None:
        try:
            at = datetime.datetime.fromisoformat(str(at)).replace(tzinfo=None, microsecond=0).isoformat()
        except ValueError:
            return None, "at ISO tarih-saat olmalı"
    ham = g.get("sayilar") or {}
    if not isinstance(ham, dict) or len(ham) > EN_COK_SAYI:
        return None, "sayilar en çok %d alanlı nesne olmalı" % EN_COK_SAYI
    sayilar = {}
    for ad, v in ham.items():
        if not SAYI_AD.match(str(ad)) or not isinstance(v, dict) or v.get("etiket") not in ETIKETLER:
            return None, "sayilar.%s: {deger, birim, etiket} ve etiket %s olmalı" % (ad, " | ".join(ETIKETLER))
        d = v.get("deger")
        if v["etiket"] == "veri yok":
            d = None
        elif isinstance(d, bool) or not isinstance(d, (int, float)) or d != d:
            return None, "sayilar.%s.deger sayı olmalı" % ad
        sayilar[ad] = {"deger": d, "birim": str(v.get("birim") or "")[:12], "etiket": v["etiket"]}
    konu = " ".join(str(g.get("konu") or "").split())[:80] or None
    return {"modul": modul, "tur": tur, "kimlik": kimlik.strip(), "at": at, "sayilar": sayilar, "konu": konu}, None


def _satir(r):
    d = dict(r)
    d["sayilar"] = json.loads(d.get("sayilar") or "{}")
    return d


def neden_cumlesi(o):
    parca = ["%s %s%s (%s)" % (OKUNUR.get(ad, ad), "veri yok" if v["deger"] is None else _s(v["deger"]),
                               " " + v["birim"] if v["birim"] and v["deger"] is not None else "", v["etiket"])
             for ad, v in o["sayilar"].items()]
    return "%s.%s · %s" % (o["modul"], o["tur"], ", ".join(parca) if parca else "sayı yok")


def _karar(con, o, now, kalan):
    """(karar, kural, mesaj) — yazmaz."""
    if now - datetime.datetime.fromisoformat(o["at"]) > BAYAT:
        return "bayat", None, None
    k = KURALLAR.get(o["tur"])
    if not k or o["modul"] not in k["moduller"]:
        return "kural_yok", None, None
    d = {ad: (o["sayilar"].get(ad) or {}).get("deger") for ad in k["sayilar"]}
    if any(v is None for v in d.values()):
        return "eksik_veri", k["kural"], None
    if not k["esik"](d, o):
        return "esik_alti", k["kural"], None
    if con.execute("SELECT 1 FROM king_olaylar WHERE modul=? AND tur=? AND karar='basla' AND karar_at>=?",
                   (o["modul"], o["tur"], (now - TEKRAR).isoformat())).fetchone():
        return "tekrar", k["kural"], None
    if kalan <= 0:
        return "butce", k["kural"], None
    return "basla", k["kural"], k["mesaj"](d, o)


def _bugun_konusulan(con, now):
    return con.execute("SELECT COUNT(*) FROM king_olaylar WHERE karar='basla' AND karar_at LIKE ?",
                       (now.date().isoformat() + "%",)).fetchone()[0]


def degerlendir(con, cfg, now=None):
    """Karari bekleyen olaylara bakar; sessiz saatte yalniz «bekliyor» isaretler.
    Doner: {olay_id: karar}."""
    now = _an(now)
    acik_olay = [_satir(r) for r in con.execute("SELECT * FROM king_olaylar WHERE karar IN ('yeni','bekliyor')")]
    if not acik_olay:
        return {}
    if sessiz_mi(cfg, now):
        con.execute("UPDATE king_olaylar SET karar='bekliyor' WHERE karar='yeni'")
        con.commit()
        return {o["id"]: "bekliyor" for o in acik_olay}
    acik_olay.sort(key=lambda o: ((KURALLAR.get(o["tur"]) or {}).get("oncelik", 9), o["id"]))
    kalan = butce(cfg) - _bugun_konusulan(con, now)
    out, at = {}, now.isoformat()
    for o in acik_olay:
        karar, kural, mesaj = _karar(con, o, now, kalan)
        bid = None
        if karar == "basla":
            neden = {"olay": "%s.%s" % (o["modul"], o["tur"]), "olay_id": o["id"], "kural": kural,
                     "sayilar": o["sayilar"], "cumle": neden_cumlesi(o)}
            bid = bekleyen.teslim(con, "kendiliginden", o["id"], mesaj, now=at, neden=neden)["id"]
            kalan -= 1
        con.execute("UPDATE king_olaylar SET karar=?, kural=?, bekleyen_id=?, karar_at=? WHERE id=?",
                    (karar, kural, bid, at, o["id"]))
        out[o["id"]] = karar
    con.commit()
    return out


def olay_al(con, cfg, govde, now=None):
    """POST /api/olay. Ayni kimlik ikinci kez gelirse ilk kayit doner."""
    o, hata = dogrula(govde)
    if hata:
        return {"ok": False, "note": hata}
    now = _an(now)
    var = con.execute("SELECT id, karar FROM king_olaylar WHERE kimlik=?", (o["kimlik"],)).fetchone()
    if var:
        return {"ok": True, "id": var["id"], "karar": var["karar"], "tekrar": True}
    cur = con.execute("INSERT INTO king_olaylar(modul, tur, kimlik, at, sayilar, konu, created_at) "
                      "VALUES (?,?,?,?,?,?,?)",
                      (o["modul"], o["tur"], o["kimlik"], o["at"] or now.isoformat(),
                       json.dumps(o["sayilar"], ensure_ascii=False), o["konu"], now.isoformat()))
    con.commit()
    oid = cur.lastrowid
    return {"ok": True, "id": oid, "karar": degerlendir(con, cfg, now).get(oid) or "yeni", "tekrar": False}


def tik(con, cfg, now=None):
    """Dakikalik ritim: sessiz saati biten olaylar."""
    return degerlendir(con, cfg, now)


def durum(con, cfg, now=None, limit=20):
    now = _an(now)
    rows = con.execute("SELECT * FROM king_bekleyen WHERE tur='kendiliginden' AND alindi_at IS NULL "
                       "ORDER BY id").fetchall()
    return {"bekleyen": [bekleyen._satir(r) for r in rows],
            "butce": {"gun": now.date().isoformat(), "toplam": butce(cfg), "kullanilan": _bugun_konusulan(con, now)},
            "sessiz": sessiz_mi(cfg, now), "sessiz_saat": list(sessiz_saat(cfg)),
            "kararlar": [_satir(r) for r in con.execute(
                "SELECT * FROM king_olaylar ORDER BY id DESC LIMIT ?", (max(1, min(limit, 100)),))]}


def bizim_mi(yol):
    return yol in ("/api/olay", "/api/king/kendiliginden")


def uc(con, cfg, yontem, yol, q=None, govde=None, now=None):
    """GET /api/king/kendiliginden · POST /api/olay. Doner (kod, nesne) ya da None."""
    if yontem == "GET" and yol == "/api/king/kendiliginden":
        try:
            n = int(((q or {}).get("limit") or [20])[0])
        except ValueError:
            n = 20
        return 200, durum(con, cfg, now, n)
    if yontem == "POST" and yol == "/api/olay":
        r = olay_al(con, cfg, govde, now)
        return (200 if r["ok"] else 400), r
    return None


# ------------------------------------------- §H kartlarinin cumlesi (KING-4)
# Sayiyi modulun kodu verir (satirlar «ad: deger birim (etiket)»), cumleyi model
# kurar (AGENTS §1). Satirlar baglamdir: cevaptaki sayi onlarla denetlenir
# (ai._temizle). Kolay is: merdivende yerel modelden baslar (A6).
KART_TALIMAT = {
    "brifing": ("60 saniyelik sabah brifingi: bugünün planını, dünün tek bulgusunu ve tek öneriyi "
                "en çok üç kısa cümleyle söyle. Yalnız verilen sayıları kullan."),
    "hafta": "Bu haftanın sayılarına tek cümlelik sakin bir yorum yaz. Yalnız verilen sayıları kullan.",
    # Gun bolumu (2026-11-03): gunun durumu tek cumle; satirlar Gun'un kodundan, sayi uydurulmaz.
    "gun": ("Kullanıcının bugününe tek cümlelik, sıcak ve kısa bir bakış yaz: ne bitti, sırada ne var. "
            "Yalnız verilen sayıları ve adları kullan; yeni sayı, saat ya da öneri ekleme."),
}
KART_SISTEM = "Sen King'sin. Türkçe, kısa ve sıcak konuş; buyurgan kip kullanma, madde listesi yazma."


def kart_cumlesi(con, cfg, govde, transport=None):
    """{tur, satirlar} -> {ok, text, model, kat}. Model yoksa ok:false; istemci kodun cumlesini kullanir."""
    from core import ai
    govde = govde if isinstance(govde, dict) else {}
    tur = govde.get("tur")
    satirlar = [str(x)[:160] for x in (govde.get("satirlar") or []) if str(x or "").strip()][:16]
    if tur not in KART_TALIMAT or not satirlar:
        return {"ok": False, "note": "tur (brifing|hafta|gun) ve satirlar gerekli"}
    r = ai.ask(con, cfg, "king", "kart." + tur, [{"role": "user", "content": KART_TALIMAT[tur]}],
               baglam="\n".join(satirlar), sistem=KART_SISTEM, seviye="alt", transport=transport)
    ok = bool(r.get("ok") and (r.get("text") or "").strip())
    return {"ok": ok, "text": (r.get("text") or "").strip() if ok else None, "note": r.get("note"),
            "model": r.get("model"), "kat": (r.get("motor") or {}).get("kat")}
