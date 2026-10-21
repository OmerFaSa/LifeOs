# -*- coding: utf-8 -*-
"""YouTube — video arama ve altyazida kavramin gectigi AN (H1, 2026-10-21;
depo sahibi: «YouTube'a gidip arastirma yapabilecek, link getirebilecek»).

   Internete core/web.py'nin kapisindan cikar: ayni izin (yalniz King ve
   BAM), ayni guvenli tasiyici, ayni gunluk sinir ve onbellek.

   Dort kural:

   1. ANAHTARSIZ CALISIR. Arama YouTube'un kendi arama sayfasindan
      (ytInitialData) okunur; YouTube Data API anahtari girildiyse
      (Ayarlar › Web) resmi API kullanilir. Turkce konu anlatimi once:
      hl=tr, gl=TR ve basligi Turkce olan video one alinir.
   2. ALTYAZI KODLA OKUNUR. Videonun altyazisi (otomatik olani da)
      YouTube'un oynatici ucundan cekilir; dakika MODELE sorulmaz:
      kavramin kelimeleri altyazi pencerelerinde KODLA aranir.
   3. AN KANITIYLA GELIR. Bulunan an, o andaki altyazi cumlesiyle birlikte
      doner; link o saniyeden acilir (watch?v=ID&t=SANIYEs).
   4. ALTYAZI YOKSA SOYLENIR. Altyazisiz videoda «an» uydurulmaz; video
      yalniz basligiyla listelenir."""
import html
import json
import re
import urllib.parse

from core import web

ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")
TARAYICI = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/130.0 Safari/537.36",
            "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.6"}
# Oynatici ucu: ANDROID istemcisi altyaziyi jetonsuz verir (2026-10-21 sinandi;
# WEB istemcisinin altyazi adresi bos donuyor).
OYNATICI = "https://www.youtube.com/youtubei/v1/player"
ISTEMCI = {"clientName": "ANDROID", "clientVersion": "20.10.38", "hl": "tr", "gl": "TR"}
PENCERE = 40            # saniye: kavram bu pencerede aranir
ONCE = 3                # saniye: link anin biraz oncesinden acilir
TR_HARF = re.compile(r"[çğıöşüÇĞİÖŞÜ]")
TR_SOZ = re.compile(r"\b(konu anlatımı|ders|soru çözümü|nedir|ayt|tyt|yks|kpss|lgs)\b", re.I)
DOLGU = {"ve", "ile", "için", "bir", "bu", "şu", "o", "da", "de", "mi", "mı", "nedir", "nasıl",
         "konu", "anlatımı", "anlatım", "video", "videosu", "ders", "dersi", "the", "of", "and"}


def link(vid, saniye=None):
    u = "https://www.youtube.com/watch?v=%s" % vid
    return u + ("&t=%ds" % int(saniye) if saniye else "")


def sure_yaz(saniye):
    s = int(saniye or 0)
    return "%d:%02d:%02d" % (s // 3600, s % 3600 // 60, s % 60) if s >= 3600 else "%d:%02d" % (s // 60, s % 60)


def _sure_sn(metin):
    p = [int(x) for x in re.findall(r"\d+", str(metin or ""))][-3:]
    n = 0
    for x in p:
        n = n * 60 + x
    return n or None


def _iso_sure(s):
    m = re.match(r"^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$", str(s or ""))
    return (int(m.group(1) or 0) * 3600 + int(m.group(2) or 0) * 60 + int(m.group(3) or 0)) if m else None


def _al(con, cfg, rol, url, tasiyici, now, basliklar=None, govde=None):
    """Bir ag cagrisi (gunluk sinirdan duser). Doner: (metin, not)."""
    izin, neden = web._harca(con, cfg, now)
    if not izin:
        return None, neden
    try:
        durum_, _, bayt, _ = tasiyici(url, dict(TARAYICI, **(basliklar or {})), govde, False)
    except Exception as e:                      # noqa: BLE001 — ag, zaman asimi
        return None, "YouTube’a ulaşılamadı: %s" % str(e)[:160]
    if durum_ != 200:
        return None, "YouTube HTTP %s döndü." % durum_
    return bayt.decode("utf-8", "replace"), None


def _metin(o):
    if not isinstance(o, dict):
        return ""
    if o.get("simpleText"):
        return str(o["simpleText"])
    return "".join(str(r.get("text") or "") for r in o.get("runs") or [])


def _videolar(o, out):
    if isinstance(o, dict):
        v = o.get("videoRenderer")
        if isinstance(v, dict) and ID_RE.match(str(v.get("videoId") or "")):
            out.append({"id": v["videoId"], "baslik": _metin(v.get("title"))[:200],
                        "kanal": _metin(v.get("ownerText"))[:120],
                        "sure": _sure_sn(_metin(v.get("lengthText")))})
        for x in o.values():
            _videolar(x, out)
    elif isinstance(o, list):
        for x in o:
            _videolar(x, out)
    return out


def _sayfadan(con, cfg, rol, sorgu, tasiyici, now):
    q = urllib.parse.urlencode({"search_query": sorgu, "hl": "tr", "gl": "TR",
                                "sp": "EgIQAQ=="})         # yalniz video
    s, neden = _al(con, cfg, rol, "https://www.youtube.com/results?" + q, tasiyici, now)
    if s is None:
        return None, neden
    m = re.search(r"ytInitialData\s*=\s*(\{.*?\});\s*</script>", s, re.S)
    if not m:
        return None, "YouTube arama sayfası çözülemedi."
    try:
        return _videolar(json.loads(m.group(1)), []), None
    except ValueError:
        return None, "YouTube arama sayfası çözülemedi."


def _apiden(con, cfg, rol, sorgu, n, tasiyici, now):
    q = urllib.parse.urlencode({"part": "snippet", "type": "video", "q": sorgu, "maxResults": n,
                                "relevanceLanguage": "tr", "regionCode": "TR",
                                "key": web.anahtar_of(cfg, "youtube")})
    s, neden = _al(con, cfg, rol, "https://www.googleapis.com/youtube/v3/search?" + q, tasiyici, now)
    if s is None:
        return None, neden
    try:
        d = json.loads(s)
    except ValueError:
        return None, "YouTube API cevabı çözülemedi."
    out = []
    for x in d.get("items") or []:
        vid = str((x.get("id") or {}).get("videoId") or "")
        sn = x.get("snippet") or {}
        if ID_RE.match(vid):
            out.append({"id": vid, "baslik": html.unescape(str(sn.get("title") or ""))[:200],
                        "kanal": html.unescape(str(sn.get("channelTitle") or ""))[:120], "sure": None})
    return out, None


def turkce_mi(v):
    b = "%s %s" % (v.get("baslik") or "", v.get("kanal") or "")
    return bool(TR_HARF.search(b) or TR_SOZ.search(b))


def ara(con, cfg, rol, sorgu, n=5, tasiyici=None, now=None):
    """Doner: {ok, videolar: [{id, baslik, kanal, sure, url}], saglayici, note}."""
    if not web.izinli(rol):
        return {"ok": False, "videolar": [], "note": "Bu görevlinin web erişimi yok."}
    if not web.settings(cfg)["acik"]:
        return {"ok": False, "videolar": [], "note": "Web kapalı (Ayarlar › Web)."}
    s, neden = web.sorgu_uygun_mu(sorgu)
    if neden:
        return {"ok": False, "videolar": [], "note": neden}
    n = max(1, min(int(n or 5), 10))
    api = bool(web.anahtar_of(cfg, "youtube"))
    ak = web._anahtar("youtube", s.lower(), n, api)
    var = web._onbellek_oku(con, "ara", ak, now)
    if var is not None:
        return dict(var, onbellekten=True)
    tasiyici = tasiyici or web.VARSAYILAN_TASIYICI or web._ag
    vids, neden = _apiden(con, cfg, rol, s, n, tasiyici, now) if api else (None, None)
    saglayici = "youtube_api" if vids else "youtube"
    if not vids:
        vids, neden2 = _sayfadan(con, cfg, rol, s, tasiyici, now)
        neden = neden2 or neden
    gorulen, temiz = set(), []
    for v in vids or []:
        if v["id"] not in gorulen:
            gorulen.add(v["id"])
            temiz.append(dict(v, url=link(v["id"])))
    # Turkce konu anlatimi once; YouTube'un kendi sirasi grup icinde korunur.
    temiz = sorted(temiz, key=lambda v: not turkce_mi(v))[:n]
    out = {"ok": bool(temiz), "videolar": temiz, "saglayici": saglayici, "sorgu": s,
           "note": None if temiz else (neden or "Video bulunamadı.")}
    if temiz:
        web._onbellek_yaz(con, "ara", ak, out, now)
    return dict(out, onbellekten=False)


# ------------------------------------------------------------- altyazi

def _parcalar(xml):
    out = []
    for m in re.finditer(r'<text start="([\d.]+)"(?: dur="([\d.]+)")?[^>]*>(.*?)</text>', xml, re.S):
        t = html.unescape(html.unescape(re.sub(r"<[^>]+>", "", m.group(3))))
        t = re.sub(r"\s+", " ", t).strip()
        if t:
            out.append([round(float(m.group(1)), 2), t])
    if not out:     # srv3 bicimi: <p t="ms" d="ms">
        for m in re.finditer(r'<p t="(\d+)"[^>]*>(.*?)</p>', xml, re.S):
            t = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", m.group(2)))).strip()
            if t:
                out.append([round(int(m.group(1)) / 1000.0, 2), t])
    return out


def _iz_sec(izler):
    """Turkce once; elle yazilmis altyazi otomatikten once."""
    def puan(x):
        dil = str(x.get("languageCode") or "")
        return (0 if dil.startswith("tr") else 1 if dil.startswith("en") else 2,
                1 if x.get("kind") == "asr" else 0)
    izler = [x for x in izler or [] if isinstance(x, dict) and x.get("baseUrl")]
    return sorted(izler, key=puan)[0] if izler else None


def transkript(con, cfg, rol, vid, tasiyici=None, now=None):
    """Doner: {ok, id, baslik, kanal, sure, dil, otomatik, parcalar: [[saniye, metin]], note}."""
    if not web.izinli(rol):
        return {"ok": False, "note": "Bu görevlinin web erişimi yok."}
    if not web.settings(cfg)["acik"]:
        return {"ok": False, "note": "Web kapalı (Ayarlar › Web)."}
    if not ID_RE.match(str(vid or "")):
        return {"ok": False, "note": "Geçersiz video kimliği."}
    ak = web._anahtar("altyazi", vid)
    var = web._onbellek_oku(con, "sayfa", ak, now)
    if var is not None:
        return dict(var, onbellekten=True)
    tasiyici = tasiyici or web.VARSAYILAN_TASIYICI or web._ag
    govde = json.dumps({"context": {"client": ISTEMCI}, "videoId": vid}).encode("utf-8")
    s, neden = _al(con, cfg, rol, OYNATICI, tasiyici, now,
                   {"Content-Type": "application/json",
                    "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14) gzip"}, govde)
    if s is None:
        return {"ok": False, "note": neden}
    try:
        p = json.loads(s)
    except ValueError:
        return {"ok": False, "note": "Video bilgisi çözülemedi."}
    vd = p.get("videoDetails") or {}
    bilgi = {"id": vid, "baslik": str(vd.get("title") or "")[:200], "kanal": str(vd.get("author") or "")[:120],
             "sure": int(vd["lengthSeconds"]) if str(vd.get("lengthSeconds") or "").isdigit() else None}
    iz = _iz_sec(((p.get("captions") or {}).get("playerCaptionsTracklistRenderer") or {}).get("captionTracks"))
    if not iz:
        return dict(bilgi, ok=False, note="Bu videonun altyazısı yok; dakika bulunamaz.")
    adres = re.sub(r"&fmt=[^&]*", "", str(iz["baseUrl"]))
    if not adres.startswith("https://www.youtube.com/"):
        return dict(bilgi, ok=False, note="Altyazı adresi beklenmeyen bir yerde; okunmadı.")
    x, neden = _al(con, cfg, rol, adres, tasiyici, now)
    if x is None:
        return dict(bilgi, ok=False, note=neden)
    parcalar = _parcalar(x)
    if not parcalar:
        return dict(bilgi, ok=False, note="Altyazı boş geldi.")
    out = dict(bilgi, ok=True, dil=str(iz.get("languageCode") or ""), otomatik=iz.get("kind") == "asr",
               parcalar=parcalar)
    web._onbellek_yaz(con, "sayfa", ak, out, now)
    return dict(out, onbellekten=False)


# ------------------------------------------------------------------ an

def _kucuk(s):
    return str(s or "").replace("I", "ı").replace("İ", "i").lower()


def kokler(kavram):
    """Kavramin aranacak kokleri: dolgu atilir, Turkce ekleri tasimak icin
    her kelimenin ilk 5 harfi (kisa kelime butun)."""
    out = []
    for k in re.findall(r"\w+", _kucuk(kavram)):
        if len(k) < 3 or k in DOLGU or k.isdigit():
            continue
        kok = k[:5] if len(k) > 5 else k
        if kok not in out:
            out.append(kok)
    return out[:6]


def an_bul(parcalar, kavram):
    """Kavramin EN COK kelimesinin birlikte gectigi ilk pencere; esitlikte
    kelimenin daha sik gectigi (anlatimin yogunlastigi) pencere.
    Doner: {saniye, an, alinti, eslesen, toplam} ya da None."""
    ks = kokler(kavram)
    if not ks or not parcalar:
        return None
    kelimeler = [[w for w in re.findall(r"\w+", _kucuk(t))] for _, t in parcalar]
    en_iyi = None
    for i, (bas, _) in enumerate(parcalar):
        if not any(w.startswith(k) for w in kelimeler[i] for k in ks):
            continue
        j, kume, sik = i, set(), 0
        while j < len(parcalar) and parcalar[j][0] - bas <= PENCERE:
            for w in kelimeler[j]:
                for k in ks:
                    if w.startswith(k):
                        kume.add(k)
                        sik += 1
            j += 1
        puan = (len(kume), sik)
        if en_iyi is None or puan > en_iyi[0]:
            en_iyi = (puan, i, j)
    if not en_iyi:
        return None
    (adet, _), i, j = en_iyi
    sn = max(0, int(parcalar[i][0]) - ONCE)
    return {"saniye": sn, "an": sure_yaz(sn), "eslesen": adet, "toplam": len(ks),
            "alinti": " ".join(t for _, t in parcalar[i:min(j, i + 6)])[:400]}
