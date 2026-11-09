# -*- coding: utf-8 -*-
"""Görsel ve sesli öğrenme kaynakları — ders kartına konuyla ilgili resim, dil kartına telaffuz.

   Kaynak: Wikimedia (Vikipedi sayfa görseli, Commons araması, Commons'taki telaffuz kayıtları).
   İnternete web.py'nin tek kapısından çıkılır: aynı güvenli adres kuralları, önbellek (30 gün),
   günlük web sınırı ve «web kapalı» ayarı geçerlidir.

   LİSANS SINIFI (kullanıcı, 2026-11-09: «şimdi kendim ve kardeşim için kullanıyorum, ticari değil;
   satışa geçince telifliler çıkarılsın»). Her sonuç `sinif` taşır:
     acik     kamu malı, CC0, CC BY, CC BY-SA — her kullanımda serbest (atıfla).
     kisisel  CC BY-NC / -ND gibi yalnız ticari olmayan ya da değiştirilmeden kullanım.
   Ayar `icerik.mod`: «kisisel» (varsayılan) iki sınıfı da döndürür; «ticari» yalnız «acik»ı.
   Satış sürümünde mod «ticari» yapılır; önbellekte kalan «kisisel» kayıtlar da süzülür.
   Yazar, lisans ve kaynak sayfası HER sonuçta vardır; dosya depoya kopyalanmaz, kaynağından gösterilir."""
import re
import urllib.parse

from core import web

ACIK = re.compile(r"^(?:public domain|pd(?:[- ].*)?|cc0(?: 1\.0)?|cc[- ]by(?:[- ]sa)?(?: \d\.\d)?(?: [a-z]{2})?)$", re.I)
KISISEL = re.compile(r"^cc[- ]by(?:[- ](?:sa|nc|nd)){1,3}(?: \d\.\d)?(?: [a-z]{2})?$", re.I)
ONBELLEK_GUN = 30
web.ONBELLEK_GUN.setdefault("gorsel", ONBELLEK_GUN)


def sinif(lisans):
    """'acik' | 'kisisel' | None (kullanılmaz: lisansı bilinmeyen ya da tüm hakları saklı)."""
    l = re.sub(r"\s+", " ", str(lisans or "")).strip()
    if not l:
        return None
    if ACIK.match(l):
        return "acik"
    if KISISEL.match(l):
        return "kisisel"
    return None


def mod(cfg):
    m = ((cfg or {}).get("icerik") or {}).get("mod")
    return m if m in ("kisisel", "ticari") else "kisisel"


def _bilgiler(adlar, tasiyici, genislik=640):
    if not adlar:
        return []
    q = urllib.parse.urlencode({"action": "query", "titles": "|".join(adlar[:8]), "prop": "imageinfo",
                                "iiprop": "url|extmetadata|mime", "iiurlwidth": genislik, "format": "json", "utf8": 1})
    d = web._json(tasiyici, "https://commons.wikimedia.org/w/api.php?" + q)
    sayfalar = (d.get("query") or {}).get("pages") or {}
    out = []
    for ad in adlar:                                   # istenen sırayla (en ilgili önce)
        p = next((x for x in sayfalar.values() if x.get("title") == ad), None)
        ii = ((p or {}).get("imageinfo") or [None])[0]
        if not ii:
            continue
        md = ii.get("extmetadata") or {}
        lisans = web._temiz((md.get("LicenseShortName") or {}).get("value", ""), 60)
        s = sinif(lisans)
        if not s:
            continue
        resim = str(ii.get("mime", "")).startswith("image/")
        out.append({"baslik": ad.split(":", 1)[-1], "url": (ii.get("thumburl") if resim else None) or ii.get("url"), "tam": ii.get("url"),
                    "sayfa": ii.get("descriptionurl"), "lisans": lisans, "sinif": s, "tur": ii.get("mime", ""),
                    "yazar": web._temiz((md.get("Artist") or {}).get("value", ""), 120) or "bilinmiyor"})
    return out


def _getir(con, cfg, anahtar, bul, now=None):
    if not web.settings(cfg).get("acik"):
        return {"ok": False, "not": "Web kapalı; görsel aranmadı."}
    o = web._onbellek_oku(con, "gorsel", anahtar, now)
    if o is None:
        ok, neden = web._harca(con, cfg, now)
        if not ok:
            return {"ok": False, "not": neden}
        try:
            o = {"liste": bul()}
        except Exception:
            return {"ok": False, "not": "Görsel kaynağına ulaşılamadı."}
        web._onbellek_yaz(con, "gorsel", anahtar, o, now)
    l = [x for x in o.get("liste") or [] if mod(cfg) == "kisisel" or x.get("sinif") == "acik"]
    return {"ok": bool(l), "liste": l[:3], "mod": mod(cfg),
            "not": None if l else "Bu konu için lisansı uygun bir kaynak bulunamadı."}


def resim(con, cfg, konu, dil="tr", tasiyici=None, now=None):
    s, hata = web.sorgu_uygun_mu(konu)
    if not s:
        return {"ok": False, "not": hata}
    tas = tasiyici or web.VARSAYILAN_TASIYICI or web._ag

    def bul():
        # 1) Vikipedi'deki sayfanın kendi görseli: konuyla en ilgili olan budur.
        q = urllib.parse.urlencode({"action": "query", "titles": s, "prop": "pageimages", "piprop": "name",
                                    "redirects": 1, "format": "json", "utf8": 1})
        d = web._json(tas, "https://%s.wikipedia.org/w/api.php?%s" % (dil, q))
        adlar = ["File:" + p["pageimage"] for p in ((d.get("query") or {}).get("pages") or {}).values() if p.get("pageimage")]
        l = _bilgiler(adlar, tas)
        if not l:
            # 2) Sayfa görseli yoksa Commons araması (ilgisi daha zayıf: yalnız yedek).
            q = urllib.parse.urlencode({"action": "query", "list": "search", "srsearch": s, "srnamespace": 6,
                                        "srlimit": 6, "format": "json", "utf8": 1})
            d = web._json(tas, "https://commons.wikimedia.org/w/api.php?" + q)
            ek = [x["title"] for x in (d.get("query") or {}).get("search") or [] if x.get("title") not in adlar]
            l += _bilgiler(ek, tas)
        return [x for x in l if str(x.get("tur", "")).startswith("image/")]

    return dict(_getir(con, cfg, web._anahtar("resim", dil, s.lower()), bul, now), konu=s)


def ses(con, cfg, kelime, dil="de", tasiyici=None, now=None):
    """Telaffuz kaydı: Commons'taki «De-Haus.ogg» biçimli dosyalar (Vikisözlük'ün kullandıkları)."""
    s, hata = web.sorgu_uygun_mu(kelime if len(str(kelime or "")) >= 3 else str(kelime or "") + "   ")
    k = re.sub(r"\s+", " ", str(kelime or "")).strip()
    if not k or not re.match(r"^[\wäöüßéèàçğışÄÖÜ' -]{1,40}$", k):
        return {"ok": False, "not": "Kelime uygun değil."}
    tas = tasiyici or web.VARSAYILAN_TASIYICI or web._ag
    on = {"de": ["De-"], "en": ["En-us-", "En-uk-"], "fr": ["Fr-"], "es": ["Es-"], "tr": ["Tr-"]}.get(dil, [dil.capitalize() + "-"])
    adlar = []
    for o in on:
        for w in (k, k[:1].upper() + k[1:], k.lower()):
            for uz in (".ogg", ".wav", ".mp3"):
                a = "File:" + o + w.replace(" ", "_") + uz
                if a not in adlar:
                    adlar.append(a)

    def bul():
        return [x for x in _bilgiler(adlar[:8], tas) if str(x.get("tur", "")).startswith(("audio/", "application/ogg"))]

    return dict(_getir(con, cfg, web._anahtar("ses", dil, k.lower()), bul, now), kelime=k)
