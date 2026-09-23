# -*- coding: utf-8 -*-
"""Web katmani — BAM ofislerinin ve King'in internete TEK kapisi.

   Arastirma Burosu artik yalniz kendi bilgisiyle yazmaz: arar, sayfayi
   okur, iddiayi kaynagina baglar. Bu dosya o kapidir; baska hicbir yer
   internete kendi basina cikmaz.

   Yedi kural:

   1. YALNIZ BAM VE KING. `izinli(rol)`: King ve BAM kademeleri (bam,
      bam.*). Modul yetenekleri (ays.*, spi.*, esp.*) ve konsey (vp_*)
      web'e cikmaz — kullanici boyle istedi ve katlar atlanmaz: modul
      bilgiye ihtiyac duyarsa King'e is emri yazar.
   2. SAGLAYICIDAN BAGIMSIZ. Anahtarsiz Vikipedi hazir gelir; Brave,
      Tavily, Google Programmable Search ve kendi SearXNG sunucun anahtar
      ya da adres girilince acilir. Sira kullanicinindir.
   3. GETIRME GUVENLIDIR. Yalniz http/https; yalniz GENEL internet adresi
      (bu makine, yerel ag, link-local ve ayrilmis adresler YASAK — HKM
      yerelde calisir ve bir sayfa adresi onu yerel servislere
      yonlendirebilirdi); en cok 3 yonlendirme ve her biri yeniden
      sinanir; en cok 2 MB, 12 saniye; yalniz metin turleri.
   4. ONCE ONBELLEK. Ayni sorgu bir gun, ayni sayfa yedi gun onbellekten
      gelir; kacinilan cagri SAYILIR (PLAN §3.I).
   5. GUNLUK SINIR. Asilinca web durur ve bu soylenir; model tahmine
      donmez, is «kaynaksiz» kalir.
   6. KISISEL VERI SORGUYA GIRMEZ. E-posta, telefon, T.C. kimlik
      kalibi tasiyan sorgu disari gitmez.
   7. KAYNAK HER ZAMAN KAYITLIDIR: adres, baslik, alan adi, erisim
      tarihi ve varsa yayin tarihi. Kaynaksiz metin «kaynak» sayilmaz."""
import datetime
import hashlib
import html
import html.parser
import ipaddress
import json
import re
import socket
import urllib.error
import urllib.parse
import urllib.request

SAGLAYICILAR = {
    "wikipedia": {"ad": "Vikipedi (anahtarsız)", "anahtar": False,
                  "not": "Ansiklopedik genel bilgi. Anahtar gerektirmez."},
    "brave": {"ad": "Brave Search API", "anahtar": True,
              "kayit": "https://api.search.brave.com/"},
    "tavily": {"ad": "Tavily", "anahtar": True, "kayit": "https://tavily.com/"},
    "google_cse": {"ad": "Google Programmable Search", "anahtar": True,
                   "kayit": "https://programmablesearchengine.google.com/"},
    "searxng": {"ad": "SearXNG (kendi sunucun)", "anahtar": False,
                "not": "Kendi çalıştırdığın SearXNG adresi; JSON biçimi açık olmalı."},
}
# guncellik_gun: King'in guncellik turu kac gunde bir ayni kayda bakar
# (core/king.py bekci). 0 -> tur kapali; arastirma istegindeki denetim yine calisir.
DEFAULTS = {"acik": True, "saglayicilar": ["wikipedia"], "anahtarlar": {},
            "google_cx": "", "searxng_url": "", "gunluk_sinir": 200, "dil": "tr",
            "guncellik_gun": 7}
GIZLI = ("anahtarlar",)
AJAN = "LifeOS-HKM/1.0 (yerel kisisel asistan; +https://github.com/OmerFaSa/LifeOs)"

MAX_BAYT = 2 * 1024 * 1024
ZAMAN = 12
MAX_YONLENDIRME = 3
MAX_METIN = 60000
SORGU_UZUNLUK = (3, 160)
ONBELLEK_GUN = {"ara": 1, "sayfa": 7}
METIN_TURLERI = ("text/html", "text/plain", "application/xhtml+xml")
# Testler bunu «ag kapali» bir tasiyiciyla degistirir: hicbir test aga cikmaz.
VARSAYILAN_TASIYICI = None

KISISEL = (re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+"),            # e-posta
           re.compile(r"(?:\+?90|0)?\s*5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}"),  # cep
           re.compile(r"\b[1-9]\d{10}\b"))                      # T.C. kimlik


# ------------------------------------------------------------------ izin

def izinli(rol):
    r = str(rol or "")
    return r == "king" or r == "bam" or r.startswith("bam.")


# ----------------------------------------------------------------- ayar

def settings(cfg):
    out = json.loads(json.dumps(DEFAULTS))
    gelen = (cfg or {}).get("web")
    if isinstance(gelen, dict):
        for k in DEFAULTS:
            if k in gelen:
                out[k] = gelen[k]
    return out


def _maske(v):
    v = str(v or "")
    return ("…" + v[-4:]) if len(v) > 8 else ("****" if v else "")


def read(cfg):
    a = settings(cfg)
    out = {k: v for k, v in a.items() if k != "anahtarlar"}
    out["anahtarlar"] = {k: _maske(v) for k, v in (a.get("anahtarlar") or {}).items()}
    out["katalog"] = {k: dict(v, hazir=hazir_mi(cfg, k)["ok"]) for k, v in SAGLAYICILAR.items()}
    return out


def validate(patch):
    if not isinstance(patch, dict):
        return False, ["web bir nesne olmalı"]
    hata = []
    for k, v in patch.items():
        if k not in DEFAULTS:
            hata.append("bilinmeyen web alanı: %s" % k)
        elif k == "acik" and not isinstance(v, bool):
            hata.append("web.acik bir bool olmalı")
        elif k == "saglayicilar" and (not isinstance(v, list)
                                      or any(x not in SAGLAYICILAR for x in v)
                                      or len(set(v)) != len(v)):
            hata.append("web.saglayicilar yalnız tanımlı sağlayıcılardan oluşmalı: %s"
                        % ", ".join(SAGLAYICILAR))
        elif k == "anahtarlar" and (not isinstance(v, dict)
                                    or any(a not in SAGLAYICILAR or not SAGLAYICILAR[a]["anahtar"]
                                           or not isinstance(s, str) or len(s) > 300
                                           for a, s in v.items())):
            hata.append("web.anahtarlar yalnız anahtarlı sağlayıcılar için metin olmalı")
        elif k in ("google_cx", "searxng_url") and (not isinstance(v, str) or len(v) > 300):
            hata.append("web.%s en fazla 300 karakterlik bir metin olmalı" % k)
        elif k == "searxng_url" and v and not re.match(r"^https?://", v):
            hata.append("web.searxng_url http:// ya da https:// ile başlamalı")
        elif k == "gunluk_sinir" and (isinstance(v, bool) or not isinstance(v, int)
                                      or not 0 <= v <= 5000):
            hata.append("web.gunluk_sinir 0–5000 arasında bir tam sayı olmalı")
        elif k == "guncellik_gun" and (isinstance(v, bool) or not isinstance(v, int)
                                       or not 0 <= v <= 90):
            hata.append("web.guncellik_gun 0–90 arasında bir tam sayı olmalı")
        elif k == "dil" and v not in ("tr", "en"):
            hata.append("web.dil tr ya da en olmalı")
    return not hata, hata


def apply(cfg, patch):
    a = (cfg.get("web") or {}) if isinstance(cfg.get("web"), dict) else {}
    yeni = dict(a)
    for k, v in patch.items():
        if k == "anahtarlar":
            # Bos metin anahtari SILER; maskeli deger («…abcd») geri gelirse
            # dokunulmaz: ekranin gosterdigi maske anahtarin yerine yazilmaz.
            ah = dict(a.get("anahtarlar") or {})
            for ad, s in v.items():
                if not s:
                    ah.pop(ad, None)
                elif not s.startswith("…") and s != "****":
                    ah[ad] = s
            yeni["anahtarlar"] = ah
        else:
            yeni[k] = v
    out = dict(cfg)
    out["web"] = yeni
    return out


def hazir_mi(cfg, ad):
    a = settings(cfg)
    if ad not in SAGLAYICILAR:
        return {"ok": False, "note": "Bilinmeyen sağlayıcı."}
    if SAGLAYICILAR[ad]["anahtar"] and not (a.get("anahtarlar") or {}).get(ad):
        return {"ok": False, "note": "%s için anahtar girilmemiş." % SAGLAYICILAR[ad]["ad"]}
    if ad == "google_cse" and not a.get("google_cx"):
        return {"ok": False, "note": "Google Programmable Search için arama motoru kimliği (cx) yok."}
    if ad == "searxng" and not a.get("searxng_url"):
        return {"ok": False, "note": "SearXNG adresi girilmemiş."}
    return {"ok": True}


# ---------------------------------------------------------- guvenli ag

def adres_genel_mi(host):
    """Host'un BUTUN adresleri genel internette mi? Tek bir ozel adres
    yeter: DNS bir adi hem genel hem yerel adrese cozebilir."""
    if not host:
        return False
    h = host.strip("[]").lower()
    if h in ("localhost",) or h.endswith(".local") or h.endswith(".internal"):
        return False
    try:
        adresler = [ipaddress.ip_address(h)]
    except ValueError:
        try:
            adresler = [ipaddress.ip_address(x[4][0].split("%")[0])
                        for x in socket.getaddrinfo(h, None)]
        except (socket.gaierror, UnicodeError, ValueError):
            return False
    return bool(adresler) and all(a.is_global and not a.is_multicast for a in adresler)


def url_uygun_mu(url, cozumle=True):
    try:
        u = urllib.parse.urlsplit(str(url or ""))
    except ValueError:
        return False, "Adres çözülemedi."
    if u.scheme not in ("http", "https"):
        return False, "Yalnız http ve https adresleri okunur."
    if not u.hostname:
        return False, "Adreste alan adı yok."
    if u.username or u.password:
        return False, "Kullanıcı adı taşıyan adres okunmaz."
    if cozumle and not adres_genel_mi(u.hostname):
        return False, "Bu adres genel internette değil (yerel ağ ya da bu makine); okunmaz."
    return True, None


class _Yonlendirme(urllib.request.HTTPRedirectHandler):
    max_redirections = MAX_YONLENDIRME

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        ok, neden = url_uygun_mu(newurl)
        if not ok:
            raise urllib.error.URLError("yönlendirme reddedildi: " + neden)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def _ag(url, basliklar=None, govde=None, guvenilir=False, zaman=ZAMAN):
    """Varsayilan tasiyici: (durum, basliklar, bayt, son_url). En cok
    MAX_BAYT okunur. `guvenilir` yalniz kullanicinin AYARLARDA yazdigi
    SearXNG adresi icindir (cogu zaman bu makinededir); yonlendirmeler
    yine de sinanir."""
    ok, neden = url_uygun_mu(url, cozumle=not guvenilir)
    if not ok:
        raise urllib.error.URLError(neden)
    acici = urllib.request.build_opener(_Yonlendirme)
    istek = urllib.request.Request(url, data=govde, headers=dict(
        {"User-Agent": AJAN, "Accept-Language": "tr,en;q=0.7"}, **(basliklar or {})))
    with acici.open(istek, timeout=zaman) as r:
        veri = r.read(MAX_BAYT + 1)
        return r.status, dict(r.headers.items()), veri[:MAX_BAYT], r.geturl()


# ---------------------------------------------------------- onbellek

def _simdi(now=None):
    return now or datetime.datetime.now().isoformat(timespec="seconds")


def _anahtar(*parca):
    return hashlib.sha1(json.dumps(parca, ensure_ascii=False).encode("utf-8")).hexdigest()


def _onbellek_oku(con, tur, anahtar, now=None):
    r = con.execute("SELECT govde, alindi FROM web_onbellek WHERE anahtar=? AND tur=?",
                    (anahtar, tur)).fetchone()
    if not r:
        return None
    try:
        yas = (datetime.datetime.fromisoformat(_simdi(now))
               - datetime.datetime.fromisoformat(r["alindi"])).total_seconds()
    except ValueError:
        return None
    if yas > ONBELLEK_GUN[tur] * 86400:
        return None
    _sayac(con, now)
    con.execute("UPDATE web_sayac SET kacinilan=kacinilan+1 WHERE gun=?", (_simdi(now)[:10],))
    try:
        return json.loads(r["govde"])
    except ValueError:
        return None


def _onbellek_yaz(con, tur, anahtar, govde, now=None):
    con.execute("INSERT OR REPLACE INTO web_onbellek(anahtar, tur, govde, alindi) VALUES (?,?,?,?)",
                (anahtar, tur, json.dumps(govde, ensure_ascii=False), _simdi(now)))


def _sayac(con, now=None):
    gun = _simdi(now)[:10]
    con.execute("INSERT OR IGNORE INTO web_sayac(gun, cagri, kacinilan) VALUES (?,0,0)", (gun,))
    return con.execute("SELECT cagri, kacinilan FROM web_sayac WHERE gun=?", (gun,)).fetchone()


def _harca(con, cfg, now=None):
    """Bir ag cagrisi icin izin: (ok, not). Izin verilirse sayilir."""
    s = _sayac(con, now)
    sinir = int(settings(cfg).get("gunluk_sinir") or 0)
    if s["cagri"] >= sinir:
        return False, ("Günlük web sınırına varıldı (%d çağrı). Yarın açılır ya da Ayarlar › "
                       "Web'den sınırı yükselt." % sinir)
    con.execute("UPDATE web_sayac SET cagri=cagri+1 WHERE gun=?", (_simdi(now)[:10],))
    return True, None


def durum(con, cfg, now=None):
    s = _sayac(con, now)
    a = settings(cfg)
    n = con.execute("SELECT COUNT(*) FROM web_onbellek").fetchone()[0]
    return {"acik": bool(a["acik"]), "saglayicilar": [
        {"id": x, "ad": SAGLAYICILAR[x]["ad"], "hazir": hazir_mi(cfg, x)["ok"],
         "not": hazir_mi(cfg, x).get("note")} for x in a["saglayicilar"]],
        "bugun": {"cagri": s["cagri"], "kacinilan": s["kacinilan"],
                  "sinir": a["gunluk_sinir"], "etiket": "olculdu"},
        "onbellek": n}


# -------------------------------------------------------------- metin

class _Metin(html.parser.HTMLParser):
    ATLA = {"script", "style", "noscript", "nav", "footer", "header", "aside", "form",
            "svg", "iframe", "template", "button", "select"}
    BLOK = {"p", "div", "li", "h1", "h2", "h3", "h4", "h5", "h6", "br", "tr", "section",
            "article", "blockquote", "pre", "dd", "dt", "td", "th", "table", "ul", "ol"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parca, self.derin, self.baslik, self.baslikta = [], 0, "", False
        self.meta, self.dil = {}, None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html" and a.get("lang"):
            self.dil = a["lang"][:10]
        if tag == "meta":
            ad = (a.get("name") or a.get("property") or "").lower()
            if ad and a.get("content"):
                self.meta[ad] = a["content"][:500]
        if tag == "title":
            self.baslikta = True
        if tag in self.ATLA:
            self.derin += 1
        elif tag in self.BLOK:
            self.parca.append("\n")

    def handle_endtag(self, tag):
        if tag == "title":
            self.baslikta = False
        if tag in self.ATLA and self.derin:
            self.derin -= 1
        elif tag in self.BLOK:
            self.parca.append("\n")

    def handle_data(self, data):
        if self.baslikta:
            self.baslik += data
        elif not self.derin:
            self.parca.append(data)


def html_metin(ham):
    p = _Metin()
    try:
        p.feed(ham)
        p.close()
    except Exception:                           # noqa: BLE001 — bozuk HTML
        pass
    metin = re.sub(r"[ \t\r\f\v]+", " ", "".join(p.parca))
    metin = re.sub(r"\n\s*\n+", "\n\n", metin).strip()
    yayin = (p.meta.get("article:published_time") or p.meta.get("date")
             or p.meta.get("dc.date") or None)
    return {"baslik": re.sub(r"\s+", " ", p.baslik).strip()[:300]
            or p.meta.get("og:title", "")[:300],
            "aciklama": p.meta.get("description") or p.meta.get("og:description") or "",
            "metin": metin[:MAX_METIN], "dil": p.dil, "yayin": (yayin or "")[:25] or None}


def _coz(bayt, basliklar):
    tur = ""
    for k, v in (basliklar or {}).items():
        if k.lower() == "content-type":
            tur = v
    m = re.search(r"charset=([\w-]+)", tur, re.I)
    if not m:
        m = re.search(rb'<meta[^>]+charset=["\']?([\w-]+)', bayt[:4000], re.I)
        kod = m.group(1).decode("ascii", "ignore") if m else "utf-8"
    else:
        kod = m.group(1)
    try:
        return bayt.decode(kod, "replace"), tur.split(";")[0].strip().lower()
    except LookupError:
        return bayt.decode("utf-8", "replace"), tur.split(";")[0].strip().lower()


# ------------------------------------------------------------- arama

def sorgu_uygun_mu(sorgu):
    s = re.sub(r"\s+", " ", str(sorgu or "")).strip()
    if not (SORGU_UZUNLUK[0] <= len(s) <= SORGU_UZUNLUK[1]):
        return None, "Sorgu %d–%d karakter olmalı." % SORGU_UZUNLUK
    if any(k.search(s) for k in KISISEL):
        return None, "Sorgu kişisel bilgi (e-posta, telefon, kimlik) taşıyor; dışarı gönderilmez."
    return s, None


def _alan(url):
    try:
        return (urllib.parse.urlsplit(url).hostname or "").lower().replace("www.", "", 1)
    except ValueError:
        return ""


def _temiz(s, n=400):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", str(s or "")))).strip()[:n]


def _json(tasiyici, url, basliklar=None, govde=None, guvenilir=False):
    durum_, _, bayt, _ = tasiyici(url, basliklar, govde, guvenilir)
    if durum_ != 200:
        raise urllib.error.URLError("HTTP %s" % durum_)
    return json.loads(bayt.decode("utf-8", "replace"))


def _wikipedia(cfg, sorgu, n, tasiyici):
    dil = settings(cfg)["dil"]
    q = urllib.parse.urlencode({"action": "query", "list": "search", "srsearch": sorgu,
                                "srlimit": n, "format": "json", "utf8": 1})
    d = _json(tasiyici, "https://%s.wikipedia.org/w/api.php?%s" % (dil, q))
    return [{"baslik": x.get("title", ""), "ozet": _temiz(x.get("snippet")),
             "url": "https://%s.wikipedia.org/wiki/%s" % (
                 dil, urllib.parse.quote(x.get("title", "").replace(" ", "_")))}
            for x in (d.get("query") or {}).get("search") or []]


def _brave(cfg, sorgu, n, tasiyici):
    a = settings(cfg)
    q = urllib.parse.urlencode({"q": sorgu, "count": n, "search_lang": a["dil"]})
    d = _json(tasiyici, "https://api.search.brave.com/res/v1/web/search?" + q,
              {"Accept": "application/json", "X-Subscription-Token": a["anahtarlar"]["brave"]})
    return [{"baslik": _temiz(x.get("title")), "url": x.get("url"),
             "ozet": _temiz(x.get("description")), "yayin": x.get("page_age")}
            for x in (d.get("web") or {}).get("results") or []]


def _tavily(cfg, sorgu, n, tasiyici):
    a = settings(cfg)
    d = _json(tasiyici, "https://api.tavily.com/search",
              {"Content-Type": "application/json",
               "Authorization": "Bearer " + a["anahtarlar"]["tavily"]},
              json.dumps({"query": sorgu, "max_results": n}).encode("utf-8"))
    return [{"baslik": _temiz(x.get("title")), "url": x.get("url"),
             "ozet": _temiz(x.get("content")), "yayin": x.get("published_date")}
            for x in d.get("results") or []]


def _google(cfg, sorgu, n, tasiyici):
    a = settings(cfg)
    q = urllib.parse.urlencode({"key": a["anahtarlar"]["google_cse"], "cx": a["google_cx"],
                                "q": sorgu, "num": min(n, 10), "lr": "lang_" + a["dil"]})
    d = _json(tasiyici, "https://www.googleapis.com/customsearch/v1?" + q)
    return [{"baslik": _temiz(x.get("title")), "url": x.get("link"),
             "ozet": _temiz(x.get("snippet"))} for x in d.get("items") or []]


def _searxng(cfg, sorgu, n, tasiyici):
    a = settings(cfg)
    q = urllib.parse.urlencode({"q": sorgu, "format": "json", "language": a["dil"]})
    d = _json(tasiyici, a["searxng_url"].rstrip("/") + "/search?" + q, guvenilir=True)
    return [{"baslik": _temiz(x.get("title")), "url": x.get("url"),
             "ozet": _temiz(x.get("content")), "yayin": x.get("publishedDate")}
            for x in (d.get("results") or [])[:n]]


ARAYICI = {"wikipedia": _wikipedia, "brave": _brave, "tavily": _tavily,
           "google_cse": _google, "searxng": _searxng}


def ara(con, cfg, rol, sorgu, n=5, tasiyici=None, now=None):
    """Siradaki hazir saglayicilardan sonuc toplar; ayni adres bir kez.
    Doner: {ok, sonuclar, kullanilan, hatalar, onbellekten, note}."""
    if not izinli(rol):
        return {"ok": False, "sonuclar": [], "note": "Bu görevlinin web erişimi yok."}
    a = settings(cfg)
    if not a["acik"]:
        return {"ok": False, "sonuclar": [], "note": "Web araması kapalı (Ayarlar › Web)."}
    s, neden = sorgu_uygun_mu(sorgu)
    if neden:
        return {"ok": False, "sonuclar": [], "note": neden}
    n = max(1, min(int(n or 5), 10))
    ak = _anahtar("ara", s.lower(), n, a["saglayicilar"], a["dil"])
    var = _onbellek_oku(con, "ara", ak, now)
    if var is not None:
        return dict(var, onbellekten=True)
    tasiyici = tasiyici or VARSAYILAN_TASIYICI or _ag
    sonuclar, kullanilan, hatalar, gorulen = [], [], [], set()
    for ad in a["saglayicilar"]:
        if len(sonuclar) >= n:
            break
        h = hazir_mi(cfg, ad)
        if not h["ok"]:
            hatalar.append(h["note"])
            continue
        izin, neden = _harca(con, cfg, now)
        if not izin:
            hatalar.append(neden)
            break
        try:
            gelen = ARAYICI[ad](cfg, s, n, tasiyici)
        except Exception as e:                  # noqa: BLE001 — ag, JSON, zaman asimi
            hatalar.append("%s: %s" % (SAGLAYICILAR[ad]["ad"], str(e)[:160]))
            continue
        kullanilan.append(ad)
        for x in gelen:
            u = str(x.get("url") or "")
            if not u or u in gorulen or not url_uygun_mu(u, cozumle=False)[0]:
                continue
            gorulen.add(u)
            sonuclar.append({"baslik": x.get("baslik") or u, "url": u, "ozet": x.get("ozet") or "",
                             "alan": _alan(u), "saglayici": ad, "yayin": x.get("yayin") or None})
            if len(sonuclar) >= n:
                break
    out = {"ok": bool(sonuclar), "sonuclar": sonuclar, "kullanilan": kullanilan,
           "hatalar": hatalar, "sorgu": s,
           "note": None if sonuclar else ("; ".join(hatalar) or "Sonuç bulunamadı.")}
    if sonuclar:
        _onbellek_yaz(con, "ara", ak, out, now)
    return dict(out, onbellekten=False)


# ----------------------------------------------------------- getirme

def _wiki_metin(url, tasiyici):
    u = urllib.parse.urlsplit(url)
    baslik = urllib.parse.unquote(u.path.split("/wiki/", 1)[1]).replace("_", " ")
    q = urllib.parse.urlencode({"action": "query", "prop": "extracts|info", "explaintext": 1,
                                "redirects": 1, "titles": baslik, "format": "json",
                                "inprop": "url"})
    d = _json(tasiyici, "%s://%s/w/api.php?%s" % (u.scheme, u.hostname, q))
    sayfa = next(iter(((d.get("query") or {}).get("pages") or {}).values()), {})
    metin = str(sayfa.get("extract") or "")
    if not metin:
        raise urllib.error.URLError("Vikipedi sayfası boş ya da yok")
    return {"baslik": sayfa.get("title") or baslik, "metin": metin[:MAX_METIN],
            "dil": u.hostname.split(".")[0], "yayin": None, "aciklama": "",
            "son_url": sayfa.get("fullurl") or url}


def getir(con, cfg, rol, url, tasiyici=None, now=None, taze=False):
    """Sayfayi okur ve metne cevirir. Doner: {ok, url, son_url, baslik,
    metin, alan, erisim, yayin, onbellekten, note}.

    `taze=True` onbellegi OKUMAZ (guncellik denetimi: «degisti mi» sorusu
    onbellekten cevaplanamaz); okunan sayfa yine onbellege yazilir."""
    if not izinli(rol):
        return {"ok": False, "note": "Bu görevlinin web erişimi yok."}
    if not settings(cfg)["acik"]:
        return {"ok": False, "note": "Web kapalı (Ayarlar › Web)."}
    tasiyici = tasiyici or VARSAYILAN_TASIYICI
    ok, neden = url_uygun_mu(url, cozumle=tasiyici is None)
    if not ok:
        return {"ok": False, "note": neden}
    ak = _anahtar("sayfa", url)
    var = None if taze else _onbellek_oku(con, "sayfa", ak, now)
    if var is not None:
        return dict(var, onbellekten=True)
    izin, neden = _harca(con, cfg, now)
    if not izin:
        return {"ok": False, "note": neden}
    tasiyici = tasiyici or _ag
    try:
        if _alan(url).endswith("wikipedia.org") and "/wiki/" in url:
            m = _wiki_metin(url, tasiyici)
        else:
            durum_, basliklar, bayt, son = tasiyici(url, None, None, False)
            if durum_ != 200:
                return {"ok": False, "note": "Sayfa HTTP %s döndü." % durum_}
            metin, tur = _coz(bayt, basliklar)
            if tur and tur not in METIN_TURLERI:
                return {"ok": False, "note": "Bu içerik türü okunmuyor (%s)." % tur}
            m = html_metin(metin) if tur != "text/plain" else {
                "baslik": "", "metin": metin[:MAX_METIN], "dil": None, "yayin": None,
                "aciklama": ""}
            m["son_url"] = son or url
    except Exception as e:                      # noqa: BLE001
        return {"ok": False, "note": "Sayfa okunamadı: %s" % str(e)[:200]}
    if len(m["metin"]) < 200:
        return {"ok": False, "note": "Sayfada okunacak metin yok."}
    out = {"ok": True, "url": url, "son_url": m.get("son_url") or url,
           "baslik": m["baslik"] or _alan(url), "metin": m["metin"], "alan": _alan(url),
           "dil": m.get("dil"), "yayin": m.get("yayin"), "aciklama": m.get("aciklama") or "",
           "erisim": _simdi(now)[:10]}
    _onbellek_yaz(con, "sayfa", ak, out, now)
    return dict(out, onbellekten=False)
