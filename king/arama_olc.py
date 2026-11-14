#!/usr/bin/env python3
"""BAM kapisi olcumu: ESKI (HKM arastir.yap hizli yol, BAM is emri kaynakli yol) ve YENI (king/arama.py) motor
AYNI sorularda, AYNI web fixture'i ve AYNI sahte model cevabiyla, AGSIZ kosar; karsilastirma tablosu basar.

    python king/arama_olc.py           ornek set (bu dosyadaki ORNEK; kesinlik: vekil, gercek egri DEGIL)
    python king/arama_olc.py --json    ayni olcum, tek JSON satiri (kalite/egri/arama.py kancasi icin)

kalite/veri/arama.jsonl bicim onerisi (sahibin gercek, etiketli seti; yoksa yalniz ornek set kosar), satir basina:
  {"soru": "zincir kuralını araştır", "beklenen": ["bileşke"], "kaynak": "wikipedia.org", "yasak": ["1700"],
   "etiket": "sahip"}
  beklenen: dogru cevapta gecmesi gereken parcalar ([] = dogru cevap «kaynak yok, bilmiyorum»); kaynak: dogru
  kaynagin adres parcasi; yasak: kaynakta olmayan, gosterilmemesi gereken iddia parcasi.
  shortcut: gercek set canli web ister; bu betik yalniz fixture'la kosar. Gercek set gelince --canli eklenir.

Olcutler (her motor, her soru):
  isabet       beklenen varsa: beklenenin hepsini iceren, dogru kaynaga bagli, SUPHELI ISARETSIZ bir iddia var.
               beklenen yoksa: hic isaretsiz iddia gosterilmedi.
  uydurma      yasak parca iceren ve supheli diye ISARETLENMEDEN gosterilen iddia sayisi (0 olmali).
  kaynaksiz    kaynagi olmayan gosterilen iddia sayisi.
  ag           ag cagrisi (fixture tasiyicisi sayar).
  yazim        web onbellegi disindaki tablolara yazilan satir (hafiza/kayit yazimi).
Supheli isareti: yeni motorda kesinlik «estimated», BAM'de dogrulandi=False; hizli yolda isaret yoktur.
"""
import json
import os
import sys
import time

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import arama  # noqa: E402
from core import arastir, bam, db, kaynakli  # noqa: E402
from tests import test_arastir as ta  # noqa: E402  fixture tasiyicisi ve model ayari

AN = "2026-10-21T10:00:00"


def _wiki(baslik, metin):
    if baslik is None:
        return ta._Ag({"list=search": (200, "application/json", {"query": {"search": []}})})
    return ta._Ag({"list=search": (200, "application/json", {"query": {"search": [{"title": baslik, "snippet": ""}]}}),
                   "prop=extracts": (200, "application/json", {"query": {"pages": {"1": {
                       "title": baslik, "fullurl": "https://tr.wikipedia.org/wiki/" + baslik.replace(" ", "_"),
                       "extract": metin}}}})})


FOTO = ("Fotosentez, bitkilerin ışık enerjisini kimyasal enerjiye dönüştürdüğü süreçtir. "
        "Fotosentez kloroplastlarda gerçekleşir. Süreçte karbondioksit ve su kullanılır. ") * 4
OSM = ("Osmanlı Devleti 1299 yılında kuruldu. Osmanlı Devleti altı yüzyıldan uzun sürdü. "
       "Devletin ilk başkenti Söğüt oldu. ") * 4
ORNEK = [
    {"ad": "zincir", "soru": "zincir kuralını araştır", "ag": ta._ag,
     "model": "Zincir kuralı bileşke fonksiyonların türevini verir [1]. Zincir kuralı 1700'de bulundu [1].",
     "beklenen": ["bileşke", "türev"], "kaynak": "wikipedia.org", "yasak": ["1700"]},
    {"ad": "fotosentez", "soru": "fotosentezi araştır", "ag": lambda: _wiki("Fotosentez", FOTO),
     "model": "Fotosentez kloroplastlarda gerçekleşir [1]. Fotosentez yalnız geceleri olur [1].",
     "beklenen": ["kloroplast"], "kaynak": "wikipedia.org", "yasak": ["geceleri"]},
    {"ad": "osmanli", "soru": "osmanlı devleti kuruluşunu araştır", "ag": lambda: _wiki("Osmanlı Devleti", OSM),
     "model": "Osmanlı Devleti 1299 yılında kuruldu [1]. Kurucusu 1350 yılında doğdu [1].",
     "beklenen": ["1299"], "kaynak": "wikipedia.org", "yasak": ["1350"]},
    {"ad": "ferritin (kaynak yok)", "soru": "ferritin düşüklüğünü araştır", "ag": lambda: _wiki(None, ""),
     "model": "Ferritin 30 ng/mL altında düşük sayılır.", "beklenen": [], "kaynak": "", "yasak": ["30 ng"]},
    {"ad": "suç ve ceza (ilgisiz sonuç)", "soru": "suç ve ceza kitabını araştır",
     "ag": lambda: _wiki("Uluslararası Ceza Mahkemesi", "Uluslararası Ceza Mahkemesi Lahey'dedir. " * 8),
     "model": "Uluslararası Ceza Mahkemesi Lahey'dedir [1].", "beklenen": [], "kaynak": "", "yasak": ["Lahey"]},
    {"ad": "zincir (model sessiz)", "soru": "zincir kuralını araştır", "ag": ta._ag, "model": "",
     "beklenen": ["bileşke"], "kaynak": "wikipedia.org", "yasak": []},
]


def _belge(metin):
    """Ayni cevabin BAM bicimi: her cumle bir bulgu, alinti cumlenin kendisi (kaynakta varsa dogrulanir)."""
    tut = []
    for c in arastir.CUMLE_RE.split(metin or ""):
        n = [int(x) for x in arastir.ATIF_RE.findall(c) for x in x.split(",") if x.strip().isdigit()]
        g = arastir.ATIF_RE.sub("", c).strip().rstrip(".").strip()
        if g:
            tut.append({"iddia": g + ".", "kaynaklar": n, "alinti": g, "guven": "orta"})
    return json.dumps({"baslik": "x", "ozet": "", "bulgular": tut, "acik_kalanlar": []}, ensure_ascii=False)


def _model(metin, konu):
    def t(provider, anahtar, model, sistem, mesajlar, ayar=None):
        if sistem == kaynakli.PLAN_SISTEM:
            return json.dumps({"sorgular": [konu], "alt_sorular": []}, ensure_ascii=False), 50, 20, False, {}
        if sistem == kaynakli.YAZIM_SISTEM or "JSON" in (sistem or "") and "bulgular" in (sistem or ""):
            return _belge(metin), 300, 80, False, {}
        return metin, 300, 40, False, {}
    return t


def _yazim(con):
    return {t[0]: con.execute('SELECT COUNT(*) FROM "%s"' % t[0]).fetchone()[0]
            for t in con.execute("SELECT name FROM sqlite_master WHERE type='table'")
            if t[0] not in ("web_onbellek", "web_sayac") and not t[0].startswith("sqlite_")}


def _fark(once, sonra):
    return sum(max(0, sonra.get(k, 0) - once.get(k, 0)) for k in sonra)


def eski_hizli(s):
    con, ag = db.connect(":memory:"), s["ag"]()
    once = _yazim(con)
    konu = arastir.yalin(s["soru"].replace("araştır", ""))
    r = arastir.yap(con, ta._cfg(), s["soru"], konu=konu, transport=_model(s["model"], konu), tasiyici=ag)
    url = {k["no"]: k["url"] for k in r.get("kaynaklar") or []}
    ozet = (r.get("sablon") or {}).get("ozet") or {}
    idd = [{"metin": c["metin"], "url": [url.get(n, "") for n in c["kaynaklar"]], "supheli": False}
           for c in ozet.get("cumleler") or []]
    return idd, len(ag.cagri), _fark(once, _yazim(con))


def eski_bam(s):
    con, ag = db.connect(":memory:"), s["ag"]()
    once = _yazim(con)
    konu = arastir.yalin(s["soru"].replace("araştır", ""))
    eski_t, bam.web_tasiyici = bam.web_tasiyici, ag
    try:
        i = bam.is_ac(con, s["soru"], now=AN)
        if not i.get("ok"):          # BAM geri sordu ya da talebi almadi (gercek mesajlarda olur): iddia yok
            return [], len(ag.cagri), _fark(once, _yazim(con))
        for _ in range(12):
            bam.ilerlet(con, ta._cfg(), transport=_model(s["model"], konu), now=AN)
            j = bam.is_getir(con, i["id"])
            if j["durum"] in ("tamam", "hata", "iptal"):
                break
    finally:
        bam.web_tasiyici = eski_t
    kid = next((a.get("kayit_id") for a in j["adimlar"] if a.get("ofis") == "arastirma" and a.get("kayit_id")), None)
    g = bam.kayit_getir(con, kid)["govde"] if kid else {}
    url = {k["n"]: k["url"] for k in g.get("kaynaklar") or []}
    idd = [{"metin": b["iddia"], "url": [url.get(n, "") for n in b.get("kaynaklar") or [] if n in url],
            "supheli": not b.get("dogrulandi")} for b in g.get("bulgular") or []]
    return idd, len(ag.cagri), _fark(once, _yazim(con))


def yeni(s):
    con, ag = db.connect(":memory:"), s["ag"]()
    once = _yazim(con)
    konu = arastir.yalin(s["soru"].replace("araştır", ""))
    r = arama.ara(s["soru"], con=con, cfg=ta._cfg(), tasiyici=ag, notlar=[], alan_kok=os.devnull,
                  cevrimdisi=True, onbellek={}, yazar=arama.hkm_yazari(con, ta._cfg(), _model(s["model"], konu)))
    idd = [{"metin": i["metin"], "url": [k["url"] for k in i["kaynaklar"]], "supheli": i["kesinlik"] != "verified"}
           for i in r["iddialar"]]
    return idd, len(ag.cagri), _fark(once, _yazim(con))


def puanla(s, idd):
    temiz = [i for i in idd if not i["supheli"]]
    if s["beklenen"]:
        isabet = any(all(b.lower() in i["metin"].lower() for b in s["beklenen"])
                     and any(s["kaynak"] in u for u in i["url"]) for i in temiz)
    else:
        isabet = not temiz
    return {"isabet": isabet, "uydurma": sum(1 for i in temiz if any(y.lower() in i["metin"].lower()
                                                                    for y in s["yasak"])),
            "kaynaksiz": sum(1 for i in idd if not any(i["url"])), "iddia": len(idd)}


MOTORLAR = (("eski: hızlı yol (arastir)", eski_hizli), ("eski: BAM iş emri", eski_bam), ("yeni: Arama", yeni))


def olc(set_=None):
    set_ = set_ or ORNEK
    satirlar, ozet = [], {}
    for s in set_:
        for ad, fn in MOTORLAR:
            t0 = time.monotonic()
            try:
                idd, ag, yazim = fn(s)
                p = dict(puanla(s, idd), ag=ag, yazim=yazim)
            except Exception as e:   # olcum bozulursa satir «hata» olur, tablo yine basilir
                p = {"hata": "%s: %s" % (type(e).__name__, str(e)[:80])}
            p["saniye"] = round(time.monotonic() - t0, 2)
            satirlar.append(dict(p, soru=s["ad"], motor=ad))
            o = ozet.setdefault(ad, {"isabet": 0, "uydurma": 0, "kaynaksiz": 0, "ag": 0, "yazim": 0, "hata": 0})
            for k in o:
                o[k] += (1 if p.get(k) else 0) if k in ("isabet", "hata") else p.get(k, 0)
    return {"satirlar": satirlar, "ozet": ozet, "n": len(set_), "etiket": "vekil",
            "not": "örnek fixture seti, ağsız, sahte model; gerçek sorgu seti değil (kalite/veri/arama.jsonl yok)"}


def tablo(r):
    out = ["%-28s %-27s %6s %7s %9s %3s %5s" % ("soru", "motor", "isabet", "uydurma", "kaynaksız", "ağ", "yazım")]
    for s in r["satirlar"]:
        if "hata" in s:
            out.append("%-28s %-27s HATA %s" % (s["soru"][:28], s["motor"], s["hata"]))
        else:
            out.append("%-28s %-27s %6s %7d %9d %3d %5d" % (s["soru"][:28], s["motor"], "evet" if s["isabet"] else "hayır",
                                                           s["uydurma"], s["kaynaksiz"], s["ag"], s["yazim"]))
    out.append("")
    out.append("TOPLAM (%d soru; kesinlik: %s — %s)" % (r["n"], r["etiket"], r["not"]))
    for ad, o in r["ozet"].items():
        out.append("  %-27s isabet %d/%d · işaretsiz uydurma %d · kaynaksız %d · ağ %d · yazım %d · hata %d"
                   % (ad, o["isabet"], r["n"], o["uydurma"], o["kaynaksiz"], o["ag"], o["yazim"], o["hata"]))
    return "\n".join(out)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    yol = os.path.join(arama.KOD, "kalite", "veri", "arama.jsonl")
    if os.path.isfile(yol):
        print("not: kalite/veri/arama.jsonl var ama canlı web ister; bu sürüm yalnız örnek seti koşar.", file=sys.stderr)
    r = olc()
    print(json.dumps(r, ensure_ascii=False) if "--json" in sys.argv else tablo(r))
