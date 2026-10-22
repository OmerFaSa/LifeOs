#!/usr/bin/env python3
"""Gezgin ajan: internette YALNIZCA izinli alan adlarinda gezer, sayfa okur, veri toplar.

    python tools/veri_gezgin.py                       # tum hedefler, kaldigi yerden
    python tools/veri_gezgin.py --hedef spi-resmi     # tek hedef
    python tools/veri_gezgin.py --sayfa 40 --sure 90  # en fazla 40 sayfa ya da 90 dakika
    python tools/veri_gezgin.py --model lifeos-ana

ROLLER
  Kod   : arar, indirir, robots.txt'ye uyar, hiz sinirlar, metni ayiklar, kaydi yazar, SAYI HESAPLAMAZ.
  Model : (1) hangi baglantilarin hedefle ilgili oldugunu SECER, (2) sayfadan alintili olgu cikarir.
  Kapi  : alinti kaynakta birebir yoksa / sayi alintida yoksa / alinti olguyu desteklemiyorsa kayit reddedilir.

Guvenlik: yalniz https, yalniz veri/GEZGIN.json 'izinli' alanlar, dosya indirme yalniz PDF (boyut sinirli),
sayfadaki komutlar VERIDIR (modele talimat degildir), sicaklik asilirsa bekler. Yalniz standart kutuphane.
"""
import json, re, subprocess, sys, time, urllib.error, urllib.parse, urllib.robotparser
from html.parser import HTMLParser
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import veri_cikar as vc
import veri_ek as ek
import veri_gece as vg
from veri_topla import html_metin, pdf_metin

KOK = vc.KOK
AYAR = KOK / "veri" / "GEZGIN.json"
DURUM = vg.GUNLUK / "gezgin_durum.json"
YASAK_UZANTI = re.compile(r"\.(zip|rar|7z|exe|msi|dmg|apk|mp3|mp4|avi|mov|jpg|jpeg|png|gif|svg|webp|docx?|xlsx?|pptx?|css|js)(\?|$)", re.I)
SECIM_SEMA = {"type": "object", "required": ["secilen"], "properties": {"secilen": {"type": "array", "items": {"type": "integer"}}}}
SECIM_ISTEM = ("Sana bir HEDEF ve numaralanmis bir BAĞLANTI listesi verilecek. HEDEFLE doğrudan ilgili bilgi içerebilecek "
               "bağlantıların yalnızca numaralarını seç. Menü, giriş, iletişim, reklam, haber arşivi, kişisel sayfa bağlantılarını seçme. "
               "Emin değilsen seçme. Yalnızca JSON: {\"secilen\":[numaralar]}")


# ---------------------------------------------------------------- saf yardimcilar (test edilir)
def alan_izinli(url, izinli):
    try:
        u = urllib.parse.urlsplit(url)
    except ValueError:
        return False
    return u.scheme == "https" and (u.hostname or "").lower() in izinli and not YASAK_UZANTI.search(u.path or "")


class _Baglanti(HTMLParser):
    def __init__(self):
        super().__init__()
        self.bag, self._href, self._metin = [], None, []

    def handle_starttag(self, t, a):
        if t == "a":
            self._href, self._metin = dict(a).get("href"), []

    def handle_data(self, d):
        if self._href is not None:
            self._metin.append(d)

    def handle_endtag(self, t):
        if t == "a" and self._href is not None:
            self.bag.append((self._href, re.sub(r"\s+", " ", "".join(self._metin)).strip()))
            self._href = None


def baglantilar(html, taban, izinli):
    """[(mutlak_url, etiket)] yalniz izinli alanlardan, parcasiz, tekrarsiz."""
    p = _Baglanti()
    p.feed(html)
    gorulen, out = set(), []
    for href, etiket in p.bag:
        if not href or href.startswith(("mailto:", "javascript:", "#", "tel:")):
            continue
        url = urllib.parse.urldefrag(urllib.parse.urljoin(taban, href))[0]
        if url in gorulen or not alan_izinli(url, izinli) or not etiket:
            continue
        gorulen.add(url)
        out.append((url, etiket))
    return out


def gecerli_secim(sonuc, n, k):
    """Modelin dondurdugu secimi temizler: yalniz 0..n-1 arasi tam sayilar, tekrarsiz, en fazla k."""
    liste = sonuc.get("secilen", []) if isinstance(sonuc, dict) else []
    out = []
    for x in liste if isinstance(liste, list) else []:
        if isinstance(x, int) and not isinstance(x, bool) and 0 <= x < n and x not in out:
            out.append(x)
    return out[:k]


def duzey(host):
    return "birincil" if host.endswith(("who.int", "saglik.gov.tr", "osym.gov.tr", "nih.gov", "cdc.gov", "nhs.uk", "medlineplus.gov")) else "ikincil"


# ---------------------------------------------------------------- ag ve donanim
_robots = {}


def robots_izin(url):
    u = urllib.parse.urlsplit(url)
    kok = "%s://%s" % (u.scheme, u.netloc)
    if kok not in _robots:
        rp = urllib.robotparser.RobotFileParser()
        try:
            rp.parse(ek.al(kok + "/robots.txt", deneme=2, zaman=30).decode("utf-8", "replace").splitlines())
            _robots[kok] = rp
        except urllib.error.HTTPError as e:
            _robots[kok] = None if e.code in (404, 410) else False   # robots yok = serbest; baska hata = temkinli ol
        except Exception:
            _robots[kok] = False
    rp = _robots[kok]
    return True if rp is None else (False if rp is False else rp.can_fetch(ek.UA["User-Agent"], url))


def sicaklik():
    try:
        c = subprocess.run(["nvidia-smi", "--query-gpu=temperature.gpu", "--format=csv,noheader,nounits"],
                           capture_output=True, timeout=10, text=True)
        return int(c.stdout.strip().splitlines()[0])
    except Exception:
        return None


def sogumayi_bekle(sinir, log):
    t = sicaklik()
    while t is not None and t >= sinir:
        log("ekran karti %d C >= %d, 60 sn bekleniyor" % (t, sinir))
        time.sleep(60)
        t = sicaklik()


# ---------------------------------------------------------------- sayfa alma
def wiki_ara(host, sorgu, n=6):
    d = ek.wiki_api(host, action="query", list="search", srsearch=sorgu, srlimit=n, srnamespace=0)
    return [x["title"] for x in d.get("query", {}).get("search", [])]


def wiki_sayfa(host, baslik):
    d = ek.wiki_api(host, action="query", prop="extracts|info|links", explaintext=1, exsectionformat="wiki", redirects=1,
                    inprop="url", pllimit=200, plnamespace=0, titles=baslik)
    for s in d.get("query", {}).get("pages", {}).values():
        if "missing" in s or not s.get("extract"):
            continue
        metin = s["extract"]
        m = vg.KESIT.search(metin)
        metin = metin[:m.start()] if m else metin
        if len(metin) < 400:
            continue
        return {"metin": metin, "url": s.get("fullurl", ""), "revid": s.get("lastrevid"),
                "adaylar": [("wiki", l["title"], l["title"]) for l in s.get("links", [])]}
    return None


def web_sayfa(url, izinli, ayar):
    if not robots_izin(url):
        return None
    veri = ek.al(url)
    if url.lower().split("?")[0].endswith(".pdf"):
        if len(veri) > ayar["pdf_en_fazla_mb"] * 1024 * 1024:
            return None
        yol = vc.HAM / "gezgin" / (re.sub(r"\W+", "_", url)[-80:] + ".pdf")
        yol.parent.mkdir(parents=True, exist_ok=True)
        return {"metin": pdf_metin(veri, yol), "url": url, "revid": None, "adaylar": []}
    html = veri.decode("utf-8", "replace")
    return {"metin": html_metin(html), "url": url, "revid": None,
            "adaylar": [("web", u, e) for u, e in baglantilar(html, url, izinli)]}


# ---------------------------------------------------------------- durum
def durum_yukle():
    if DURUM.exists():
        return json.loads(DURUM.read_text(encoding="utf-8"))
    return {"ziyaret": [], "kuyruk": [], "tohumlandi": []}


def durum_kaydet(d):
    vg.GUNLUK.mkdir(parents=True, exist_ok=True)
    DURUM.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")


def anahtar(o):
    return "wiki|%s|%s" % (o["host"], o["ref"]) if o["tur"] == "wiki" else "web|" + o["ref"]


# ---------------------------------------------------------------- ana dongu
def baglanti_sec(model, hedef, adaylar, k, log):
    if not adaylar:
        return []
    liste = adaylar[:60]
    govde = "HEDEF: %s%sBAĞLANTILAR:%s%s" % (hedef["yonerge"], vg.NL, vg.NL,
                                             vg.NL.join("%d: %s" % (i, a[2][:90]) for i, a in enumerate(liste)))
    try:
        sonuc = vc.model_cagir(model, govde, istem=SECIM_ISTEM, sema=SECIM_SEMA, deneme=2)
    except Exception as e:
        log("  baglanti secimi yapilamadi:", str(e)[:60])
        return []
    return [liste[i] for i in gecerli_secim(sonuc, len(liste), k)]


def tohumla(ayar, durum, hedefler, log):
    for h in hedefler:
        if h["id"] in durum["tohumlandi"]:
            continue
        for host, sorgu in h.get("aramalar", []):
            if host not in ayar["izinli"]:
                continue
            try:
                for b in wiki_ara(host, sorgu):
                    durum["kuyruk"].append({"h": h["id"], "tur": "wiki", "host": host, "ref": b, "d": 0})
                time.sleep(1.5)
            except Exception as e:
                log("ARAMA HATA", host, sorgu, str(e)[:60])
        for u in h.get("tohum", []):
            if alan_izinli(u, ayar["izinli"]):
                durum["kuyruk"].append({"h": h["id"], "tur": "web", "ref": u, "d": 0})
        durum["tohumlandi"].append(h["id"])
        durum_kaydet(durum)
        log("tohumlandi:", h["id"], "kuyruk:", len(durum["kuyruk"]))


def gez(model, hedef_id, sayfa_siniri, sure_dk, log):
    ayar = json.loads(AYAR.read_text(encoding="utf-8"))
    sn = ayar["sinirlar"]
    vg.MAKS_PARCA = sn["en_fazla_parca"]
    hedefler = {h["id"]: h for h in ayar["hedefler"] if not hedef_id or h["id"] == hedef_id}
    durum = durum_yukle()
    tohumla(ayar, durum, list(hedefler.values()), log)
    bitis = time.time() + sure_dk * 60 if sure_dk else None
    ziyaret, islenen, ardisik = set(durum["ziyaret"]), 0, 0
    while durum["kuyruk"]:
        if (sayfa_siniri and islenen >= sayfa_siniri) or (bitis and time.time() > bitis):
            log("sinira ulasildi, duruluyor (kaldigi yerden devam edilebilir)")
            break
        o = durum["kuyruk"].pop(0)
        h = hedefler.get(o["h"])
        if not h or anahtar(o) in ziyaret:
            continue
        sogumayi_bekle(sn["sicaklik_siniri_c"], log)
        host = o["host"] if o["tur"] == "wiki" else urllib.parse.urlsplit(o["ref"]).hostname
        try:
            s = wiki_sayfa(o["host"], o["ref"]) if o["tur"] == "wiki" else web_sayfa(o["ref"], ayar["izinli"], sn)
        except Exception as e:
            log("SAYFA HATA", o["ref"][:70], str(e)[:60])
            ziyaret.add(anahtar(o))
            continue
        time.sleep(sn["sayfa_basina_saniye"])
        ziyaret.add(anahtar(o))
        durum["ziyaret"] = sorted(ziyaret)
        if not s:
            log("ATLANDI (bos/robots/buyuk)", o["ref"][:70])
            durum_kaydet(durum)
            continue
        kabul, red, basarili = vg.olgular(s["metin"], model, h["yonerge"], log)
        if basarili == 0:
            ardisik += 1
            durum["kuyruk"].insert(0, o)          # model yanit vermedi: sayfayi kaybetme
            ziyaret.discard(anahtar(o))
            durum["ziyaret"] = sorted(ziyaret)
            durum_kaydet(durum)
            log("MODEL YOK", o["ref"][:60], "ardisik:", ardisik)
            if ardisik >= 4 and not vg.ollama_ayaga_kaldir(log):
                time.sleep(120)
            if ardisik >= 15:
                log("cok fazla hata, duruluyor")
                break
            continue
        ardisik = 0
        islenen += 1
        ortak = {"sistem": h["sistem"], "kategori": h["kategori"], "konu": o["ref"] if o["tur"] == "wiki" else s["url"],
                 "kaynak": s["url"], "revid": s["revid"], "lisans": ayar["izinli"].get(host, "belirsiz"),
                 "duzey": duzey(host or ""), "model": model, "alinma": time.strftime("%Y-%m-%d"), "gezgin": True,
                 "derinlik": o["d"], "hedef": h["id"]}
        sistem = h["sistem"].lower()
        vg.ekle(vc.TEMIZ / sistem / "olgular.jsonl", [dict(ortak, baslik=x["baslik"], olgu=x["olgu"], alinti=x["alinti"], parca=i,
                                                          etiket="kaynakli-ikincil") for i, x, _ in kabul])
        vg.ekle(vc.TEMIZ / sistem / "reddedilen.jsonl", [dict(kaynak=s["url"], neden=n, kayit=x) for i, x, n in red])
        log("TAMAM d=%d %s kabul %d red %d" % (o["d"], o["ref"][:60], len(kabul), len(red)))
        if o["d"] < sn["en_fazla_derinlik"] and kabul:
            for tur, ref, etiket in baglanti_sec(model, h, [a for a in s["adaylar"]], sn["secilecek_baglanti"], log):
                y = {"h": h["id"], "tur": tur, "ref": ref, "d": o["d"] + 1}
                if tur == "wiki":
                    y["host"] = o["host"]
                if anahtar(y) not in ziyaret:
                    durum["kuyruk"].append(y)
        durum_kaydet(durum)
    durum_kaydet(durum)
    log("gezgin bitti: islenen sayfa", islenen, "| kuyrukta kalan", len(durum["kuyruk"]))


def main():
    a = sys.argv[1:]
    arg = lambda ad, vars_=None: a[a.index(ad) + 1] if ad in a else vars_
    vg.GUNLUK.mkdir(parents=True, exist_ok=True)
    kayit = (vg.GUNLUK / "gezgin.log").open("a", encoding="utf-8")

    def log(*x):
        s = time.strftime("%H:%M:%S ") + " ".join(str(i) for i in x)
        print(s, flush=True)
        kayit.write(s + vg.NL)
        kayit.flush()
    vg.uyanik_tut()
    vg.ollama_ayaga_kaldir(log)
    gez(arg("--model", "gemma3:4b"), arg("--hedef"), int(arg("--sayfa", 0)), int(arg("--sure", 0)), log)


if __name__ == "__main__":
    main()
