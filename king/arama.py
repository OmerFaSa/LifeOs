#!/usr/bin/env python3
"""Arama motoru (sadelesme Faz 5, A6/A7): BAM hizli arastirmasi (HKM/core/arastir.py) ve BAM kaynakli
arastirmasinin (HKM/core/bam.py + kaynakli.py) TEK motoru. Rapor: belgeler/ekip/sadelesme/faz5-arama.md
Test: python king/arama_test.py · Olcum (BAM kapisi): python king/arama_olc.py

    python king/arama.py "zincir kuralı"        cevrimdisi (ag yok, yalniz alan/ icerigi) deneme

Sozler:
1. Kopyalanmaz, cagrilir. Web ve YouTube arama/okuma, alaka suzgeci, ayni adres/kanal elemesi ve cumle
   denetimi HKM'nin kendi kodudur (arastir.web_ara/sayfa_oku/video_ara/video_ici_ara/denetle, kaynakli,
   web onbellegi ve gunluk siniri). Notlar king/mcp.py'nin Not kapisindan (kingOkur suzgeci) gelir.
2. Plan once: sorgudan hangi kaynaklara gidilecegi KODLA secilir (not, alan, web, video); plan sonucta doner.
3. Butce: ag cagrisi, kaynak sayisi ve sure sinirli. Ag cagrisini motorun kendi tasiyicisi sayar;
   sinir dolunca aga cikilmaz (cevap eldekiyle kurulur, `butce_doldu` yazilir).
4. Onbellek: web sayfasi/aramasi HKM web_onbellek'inde (1 gun/7 gun); not ve alan taramasi motor onbelleginde
   (ONBELLEK_SN). Ayni soru ikinci kez aga cikmaz.
5. Her iddia kaynakli: kaynaksiz cumle atilir (arastir.denetle). Kesinlik `estimated`; yalniz iddia
   gosterdigi kaynagin metninde BIREBIR geciyorsa `verified` (anlami: «kaynak bunu soyluyor», dogru oldugu degil).
6. Ozel not girmez: Not kapisinin suzgecine ek olarak ozel/kapali isaretli not motorda da atilir.
7. Hafizaya yazmaz: `hafiza_onerisi` yalniz bir onerdir (yazildi=False, onay sahibinde; AGENTS §0.1).
8. Cevrimdisi kip: ag yok; web adimi yalniz verilen (fixture) tasiyiciyla calisir. Testler hep bu kipte.
"""
import glob
import json
import os
import re
import sys
import time

KOD = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if os.path.join(KOD, "HKM") not in sys.path:
    sys.path.insert(0, os.path.join(KOD, "HKM"))
sys.dont_write_bytecode = True
from core import arastir, kaynakli, web, youtube  # noqa: E402  BAM/arastir'in kendi kodu

ROL = arastir.ROL                      # «bam.arastirma»: web izni ve model atamasi aynen
BUTCE = {"ag": 8, "kaynak": 10, "sure": 40, "iddia": 4}
ONBELLEK_SN = 600
ONBELLEK = {}                          # (kaynak, konu) -> (zaman, sonuc); not ve alan taramasi
NOT_TETIK = re.compile(r"\bnot(?:lar)?(?:ım|um|umda|larımda|larım|umu)\b|\bdefter", re.I)
YEREL_TETIK = re.compile(r"\b(?:yalnız|sadece) (?:notlar|yerel)", re.I)
# Istek fiili konudan duser (sahada konuyu cagiran ayiklardi; motor kendisi yapar): «fotosentezi araştır» -> «fotosentezi»
ISTEK = re.compile(r"(?<!\w)(?:araştır\w*|incele\w*|bul(?:ur musun|abilir misin)?|nedir|ne demek|anlat\w*|"
                   r"hakkında|ile ilgili|lütfen|bana|notlar\w*|notum\w*|defter\w*)(?!\w)", re.I)
CUMLE = re.compile(r"(?<=[.!?…])\s+|\n+")


# ---------------------------------------------------------------- plan

def plan(sorgu, kaynaklar=("not", "alan", "web", "video"), cevrimdisi=False, tasiyici=None):
    """Hangi kaynaga gidilecegi (kodla). Doner: [{kaynak, neden}] sirali."""
    s = str(sorgu or "")
    adim = []
    if "not" in kaynaklar:
        adim.append({"kaynak": "not", "neden": "notlarda geçiyor" if NOT_TETIK.search(s) else "önce kendi notların"})
    if "alan" in kaynaklar:
        adim.append({"kaynak": "alan", "neden": "alan içeriği (yol haritası)"})
    ag_var = tasiyici is not None or not cevrimdisi
    if YEREL_TETIK.search(s) or NOT_TETIK.search(s) and "araştır" not in s.lower():
        return adim                    # «notlarımda ...» yerel soru: web'e cikilmaz
    if "web" in kaynaklar and ag_var:
        adim.append({"kaynak": "web", "neden": "web kaynağı (BAM hızlı yolunun aramaları)"})
    if "video" in kaynaklar and ag_var and arastir.video_istegi(s):
        adim.append({"kaynak": "video", "neden": "video istendi"})
    return adim


# ------------------------------------------------------------- tasiyici

class _Sayac(object):
    """Ag cagrisini sayar ve butceyi uygular. Cevrimdisi kipte fixture tasiyiciyi sarar."""

    def __init__(self, ic, sinir):
        self.ic, self.sinir, self.n, self.reddedilen = ic, sinir, 0, 0

    def __call__(self, url, basliklar=None, govde=None, guvenilir=False):
        if self.n >= self.sinir:
            self.reddedilen += 1
            return 0, {}, b"", url
        self.n += 1
        return self.ic(url, basliklar, govde, guvenilir)


# ----------------------------------------------------------- yerel kaynaklar

def _kucuk(s):
    return youtube._kucuk(s)


def _uyar(metin, terimler):
    m = _kucuk(metin)
    n = sum(t in m for t in terimler)
    return n >= (len(terimler) if len(terimler) <= 2 else (len(terimler) + 1) // 2)


def _ozel_mi(n):
    return bool(n.get("ozel") or n.get("kapali") or n.get("gizli"))


def mcp_notlari(konu, sinir=10):
    """Varsayilan not kaynagi: king/mcp.py Not kapisi (kingOkur suzgecli, canli dosyanin kopyasi)."""
    import importlib.util
    sp = importlib.util.spec_from_file_location("king_mcp", os.path.join(KOD, "king", "mcp.py"))
    m = importlib.util.module_from_spec(sp)
    sp.loader.exec_module(m)
    return m.t_notlar({"ara": konu, "sinir": sinir}).get("notlar") or []


def not_kaynaklari(konu, terimler, notlar):
    out = []
    for n in (notlar(konu) if callable(notlar) else notlar or []):
        if not isinstance(n, dict) or _ozel_mi(n):
            continue
        metin = n.get("metin") or n.get("govde") or n.get("icerik") or n.get("ozet") or ""
        baslik = n.get("baslik") or n.get("ad") or "not"
        if not isinstance(metin, str) or not _uyar(baslik + " " + metin, terimler):
            continue
        out.append({"tur": "not", "baslik": baslik, "url": "not:%s" % (n.get("kimlik") or n.get("id") or baslik),
                    "alan": "not", "ozet": "", "metin": metin})
    return out


def _dizgeler(x, yol=""):
    if isinstance(x, str):
        yield yol, x
    elif isinstance(x, dict):
        for k, v in x.items():
            yield from _dizgeler(v, "%s.%s" % (yol, k) if yol else k)
    elif isinstance(x, list):
        for i, v in enumerate(x):
            yield from _dizgeler(v, "%s[%d]" % (yol, i))


def alan_kaynaklari(konu, terimler, kok=None):
    """alan/**/*.json icindeki metinler; konuya uyan her dosya bir kaynak (uyan alanlar metni olur)."""
    kok = kok or KOD
    out = []
    for yol in sorted(glob.glob(os.path.join(kok, "alan", "**", "*.json"), recursive=True)):
        try:
            with open(yol, encoding="utf-8") as f:
                d = json.load(f)
        except (OSError, ValueError):
            continue
        # Kapi sorulari ve cevaplari kaynak olmaz: ustalik kapisi olcumdur (mcp.py yol_haritasi da vermez)
        parca = [(y, s) for y, s in _dizgeler(d) if len(s) >= 30 and not re.match(r"^[\w./-]+$", s)
                 and not re.search(r"(?:^|\.)kapi\b", y)]
        uyan = [(y, s) for y, s in parca if _uyar(s, terimler)]
        if not uyan:
            continue
        goreli = os.path.relpath(yol, kok).replace("\\", "/")
        out.append({"tur": "alan", "baslik": d.get("ad") or goreli if isinstance(d, dict) else goreli,
                    "url": goreli, "alan": "alan/" + goreli.split("/")[1], "ozet": "",
                    "metin": "\n".join(s for _, s in uyan), "yerler": [y for y, _ in uyan][:10],
                    "taslak": "dogrulanmamis" in json.dumps(d, ensure_ascii=False)})
    return out


def _onbellekli(onbellek, anahtar, fn):
    var = onbellek.get(anahtar)
    if var and time.time() - var[0] < ONBELLEK_SN:
        return [dict(k) for k in var[1]], True
    r = fn()
    onbellek[anahtar] = (time.time(), [dict(k) for k in r])
    return r, False


# --------------------------------------------------------------- iddialar

def _norm(s):
    return kaynakli._norm(re.sub(r"[.!?…]+$", "", str(s or "")))


def _kesinlik(iddia, kaynaklar_):
    dayanak = " ".join(_norm(k.get("metin") or k.get("ozet") or "") for k in kaynaklar_)
    return "verified" if _norm(iddia) and _norm(iddia) in dayanak else "estimated"


def cikar(st, terimler, n):
    """Modelsiz iddia: kaynaklardan konuya uyan cumleler, birebir (yazar yoksa ya da yazamadiysa)."""
    out, gorulen = [], set()
    for k in st.kaynaklar:
        if k["tur"] == "video" and not k.get("an"):
            continue                    # video basligi dayanak degildir (arastir.denetle kurali)
        for c in CUMLE.split(k.get("metin") or k.get("ozet") or ""):
            c = c.strip()
            if len(re.findall(r"\w+", c)) < 4 or not _uyar(c, terimler) or _norm(c) in gorulen:
                continue
            gorulen.add(_norm(c))
            out.append("%s [%d]." % (c.rstrip(".!?…"), k["no"]))   # denetle bicimi: «cumle [n].»
            break
        if len(out) >= n:
            break
    return " ".join(out)


def hkm_yazari(con, cfg, transport=None, now=None):
    """Model yazari: BAM hizli yolunun istemi ve rolu (arastir.SISTEM, bam.arastirma); arac verilmez."""
    from core import ai

    def yaz(konu, blok):
        r = ai.ask(con, cfg, ROL, "arastirma_hizli", [{"role": "user", "content": arastir.GOREV % konu}],
                   sistem=arastir.SISTEM + "\n\n" + blok + arastir.SON_TUR, transport=transport, now=now,
                   denetim="belge", duzeltme=False, jeton=500)
        return r.get("text") if r.get("ok") else None
    return yaz


# ------------------------------------------------------------------- motor

def ara(sorgu, kaynaklar=("not", "alan", "web", "video"), butce=None, con=None, cfg=None, tasiyici=None,
        notlar=mcp_notlari, alan_kok=None, yazar=None, cevrimdisi=False, onbellek=None, now=None):
    """Tek arastirma. Doner: {ok, konu, plan, kaynaklar, iddialar, atilan, hafiza_onerisi, butce, izler,
    onbellekten, saniye, note}. Hicbir yere yazmaz (web onbellegi ve gunluk sayac haric: HKM web kurali)."""
    t0 = time.monotonic()
    b = dict(BUTCE, **(butce or {}))
    onbellek = ONBELLEK if onbellek is None else onbellek
    konu = arastir.yalin(re.sub(r"\s+", " ", ISTEK.sub(" ", arastir.video_istegi(sorgu) or sorgu)))
    terimler = youtube.kokler(konu) or [_kucuk(konu)]
    adimlar = plan(sorgu, kaynaklar, cevrimdisi, tasiyici)
    if con is None:
        from core import db
        con = db.connect(":memory:")   # shortcut: surec ici web onbellegi; kalici icin HKM'nin con'unu ver
    cfg = cfg if cfg is not None else {}
    ic = tasiyici or (None if cevrimdisi else (web.VARSAYILAN_TASIYICI or web._ag))
    sayac = _Sayac(ic, b["ag"]) if ic else None
    st = arastir._Durum(con, cfg, sayac, now, t0 + b["sure"], terimler=terimler)
    st.oncelik = kaynakli.ONCELIK
    onbellekten = []

    def ekle(liste):
        for k in liste:
            if len(st.kaynaklar) < b["kaynak"]:
                st.ekle(k)

    for a in adimlar:
        if len(st.kaynaklar) >= b["kaynak"] or st.kalan() <= 0:
            st.iz("bütçe: %s atlandı" % a["kaynak"])
            continue
        if a["kaynak"] == "web":
            bulunan, _ = arastir.web_ara(st, konu)
            st.kaynaklar = st.kaynaklar[:b["kaynak"]]
            for k in bulunan[:2]:
                if k in st.kaynaklar and k["url"].startswith("http") and (
                        tasiyici or web.url_uygun_mu(k["url"], cozumle=True)[0]):   # canlida SSRF denetimi
                    arastir.sayfa_oku(st, k)
        elif a["kaynak"] == "video":
            vid = arastir.video_ara(st, konu)[0]
            st.kaynaklar = st.kaynaklar[:b["kaynak"]]
            for k in [v for v in vid if v in st.kaynaklar][:2]:
                arastir.video_ici_ara(st, k, konu)
        elif a["kaynak"] == "not":
            r, hit = _onbellekli(onbellek, ("not", konu), lambda: not_kaynaklari(konu, terimler, notlar))
            ekle(r)
            onbellekten += ["not"] if hit else []
            st.iz("notlarda arandı: %d not" % len(r))
        elif a["kaynak"] == "alan":
            r, hit = _onbellekli(onbellek, ("alan", konu, alan_kok), lambda: alan_kaynaklari(konu, terimler, alan_kok))
            ekle(r)
            onbellekten += ["alan"] if hit else []
            st.iz("alan içeriğinde arandı: %d dosya" % len(r))
    cevap = None
    if yazar and st.kaynaklar:
        cevap = yazar(konu, arastir.kaynak_blogu(st, terimler))
    tutulan, atilan = arastir.denetle(cevap, st.kaynaklar) if cevap else ([], [])
    kim = "model" if tutulan else "kod"
    if not tutulan:
        tutulan, atilan2 = arastir.denetle(cikar(st, terimler, b["iddia"]), st.kaynaklar)
        atilan += atilan2
    harita = {k["no"]: k for k in st.kaynaklar}
    iddialar = []
    for c in tutulan[:b["iddia"]]:
        ks = [harita[n] for n in c["kaynaklar"]]
        iddialar.append({"metin": c["metin"], "kaynaklar": [_kaynak_kisa(k) for k in ks],
                         "kesinlik": _kesinlik(c["metin"], ks), "yazan": kim})
    oneri = [{"metin": i["metin"], "kaynak": i["kaynaklar"][0]["url"], "kesinlik": i["kesinlik"]}
             for i in iddialar if i["kesinlik"] == "verified" and i["kaynaklar"][0]["tur"] != "not"]
    return {"ok": bool(iddialar), "konu": konu, "plan": adimlar,
            "kaynaklar": [_kaynak_kisa(k) for k in st.kaynaklar], "iddialar": iddialar, "atilan": atilan,
            "hafiza_onerisi": {"yazildi": False, "onay": "sahibin", "oneriler": oneri},
            "butce": {"ag_cagrisi": sayac.n if sayac else 0, "ag_siniri": b["ag"],
                      "butce_doldu": bool(sayac and sayac.reddedilen), "kaynak": len(st.kaynaklar),
                      "kaynak_siniri": b["kaynak"]},
            "izler": st.izler, "onbellekten": onbellekten, "saniye": round(time.monotonic() - t0, 2),
            "note": None if iddialar else ("Kaynak bulunamadı." if not st.kaynaklar else
                                           "Kaynak var, kaynaklı iddia kurulamadı.")}


def _kaynak_kisa(k):
    return {x: k[x] for x in ("no", "tur", "baslik", "url", "alan", "an", "taslak") if k.get(x) is not None}


if __name__ == "__main__":
    r = ara(" ".join(sys.argv[1:]) or "felsefe", cevrimdisi=True, notlar=[])
    sys.stdout.reconfigure(encoding="utf-8")
    print(json.dumps({k: r[k] for k in ("konu", "plan", "iddialar", "butce", "note")}, ensure_ascii=False, indent=1))
