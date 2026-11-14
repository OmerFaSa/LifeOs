#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""KABUK BASLANGIC PAKETI — tek depodaki eski kayitlari yeni kabugun bicimine cevirir (sadelesme Faz 1 P6 sonrasi).

   python tools/kabuk_baslangic.py            # %LOCALAPPDATA%/LifeOS/veri/lifeos.db -> .../veri/kabuk-baslangic.json
   python tools/kabuk_baslangic.py --depo <lifeos.db> --cikti <dosya.json>

   Ne yapar: tek depoyu KOPYADAN okur (canli dosya SQLite ile acilmaz), her canli kaydi rotasina gore motorlarin
   goc bagdastiricilarina verir (tools/kabuk_baslangic.js; yonlendirme tools/gercek_kosu.js ROTA) ve ciktiyi tek
   dosyaya yazar: { lifeos_kabuk_baslangic, kimlik, uretildi, say, notlar, kayitlar, kartlar, plan, soru, yol, beden }.
   Kabuk bu dosyayi /api/kabuk/baslangic ile (yalniz bu bilgisayardan) gorur ve «Eski kayitlarimi getir» der.
   Tek depoya ve eski depolara yazmaz. Ekrana yalniz ad ve sayi basar (rota, bagdastirici, neden); icerik dosyada kalir.
   Rapor: belgeler/ekip/sadelesme/faz1-p4b-kabuk-tum-veri.md
"""
import argparse
import collections
import hashlib
import json
import os
import re
import shutil
import sqlite3
import subprocess
import sys
import tempfile

ARAC = os.path.dirname(os.path.abspath(__file__))
sys.dont_write_bytecode = True
sys.path.insert(0, ARAC)
import gercek_kosu  # noqa: E402  (rota: tek yerde)

JS = os.path.join(ARAC, "kabuk_baslangic.js")
PARTI = 500
AYS_BAS = "2026-09-14"   # AYS programinin varsayilan ilk gunu (AYS data/curriculum.js PROGRAM.startISO); profilde startDate varsa o
LISTE = ("notlar", "kayitlar", "kartlar")
ALT = {"plan": ("gunler", "hedefler", "sablonlar"), "soru": ("denemeler", "hatalar", "gunler")}
# Kabukta ekrani olmayan rotalar: kayit tek depoda kalir («yalniz depoda»), neden rapora yazilir. Ilk uyan desen kazanir.
GOSTERILMEZ = (
    (r"^hkm:(conversations|usage|memories)$", "King'in kendi verisi (king/hafiza.py: sohbet, model maliyeti, kişi hafızası). Kabukta King sohbet ekranı yok, King Claude uygulamasında konuşur: yalnız depoda"),
    (r"^anahtar:(king\.|lifeos\.king|ays\.king)", "eski cihazın King sohbeti, arşivi ya da King ayarı: King'in işi, yalnız depoda"),
    (r"^spi:chats$", "SPİ'nin eski King sohbeti: yalnız depoda"),
    (r"^anahtar:lifeos\.gun$", "eski Gün sayfasının gün bloğu ve kartı (lifeos.gun.*): sahibi motor yok, göremedim"),
    (r"^anahtar:spi\.household$", "SPİ hane listesi: sahibi motor yok, göremedim"),
    (r"^anahtar:esp\.profiles$", "ESP profil listesi: Çekirdek göçünün işi"),
    (r"^anahtar:rota\.snapshots$", "AYS'nin cihazdaki anlık yedeği: türetilmiş"),
    (r"^anahtar:", "cihazın arayüz ayarı ya da izi (tema, ses, manzara…): kabuk kendi ayarını tutar; köken taşıması (kabuk/tasima.js) eski kökene geri yazar"),
    (r":meta$", "modülün iç sürüm, yedek ve hafıza izi: türetilmiş"),
    (r"^(ays|esp):profile$", "modül profili: Çekirdek göçünün işi (AYS programının ilk günü plan haftalarına verildi)"),
    (r"^(esp:prefs|pc:tercih)$", "eski arayüz tercihi: Çekirdek"),
    (r"^spi:(basarim|seviye)$", "rozet ve seviye: §0.1 arşiv"),
    (r"^ays:defterklasor$", "klasör ağacı notlardan yeniden çıkar (boş klasör kaybolur)"),
    (r"^gun:gun_kopya$", "sunucunun gün kopyası: türetilmiş"),
    (r"^pc:planlama$", "PC planlama kuyruğu: Çekirdek göçünün işi"),
)
# Pakete girmeyen bagdastirici ciktisinin nedeni (bag onekiyle; tools/kabuk_baslangic.js DISARIDA ile ayni)
DISARIDA = {"kayit": "kayıt olmayan çıktı", "tekrar": "iki yüzü olmayan kart: Tekrar ekranı ön ve arka yüz ister",
            "plan": "tanınmayan plan çıktısı", "soru": "tanınmayan soru çıktısı", "not": "not doğrulamasından geçmedi"}


def neden(rt):
    """Ekrani olmayan rotanin nedeni; HKM arsiv tablosu goc.HKM_ARSIV'in kendi nedeniyle."""
    t = rt[4:] if rt.startswith("hkm:") else None
    if t in gercek_kosu.goc.HKM_ARSIV:
        return "arşiv: " + gercek_kosu.goc.HKM_ARSIV[t]
    for desen, n in GOSTERILMEZ:
        if re.search(desen, rt):
            return n
    return "sahibi motor yok: göremedim"


def anahtar(o):
    """tools/kabuk_baslangic.js anahtar() ile ayni: kimlik, yoksa kaynak:gun (AYS gun plani)."""
    if not isinstance(o, dict):
        return None
    if isinstance(o.get("id"), str):
        return o["id"]
    return o["kaynak"] + ":" + o["gun"] if isinstance(o.get("gun"), str) and o.get("kaynak") else None


def varsayilan():
    yerel = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
    veri = os.path.join(yerel, "LifeOS", "veri")
    return os.path.join(veri, "lifeos.db"), os.path.join(veri, "kabuk-baslangic.json")


def gruplar_oku(depo):
    """Depo dosyasini gecici klasore kopyalar, canli kayitlari (kaynak, rota, alan) basina gruplar."""
    g = tempfile.mkdtemp(prefix="lifeos-kabuk-baslangic-")
    try:
        kopya = os.path.join(g, "lifeos.db")
        shutil.copyfile(depo, kopya)
        for ek in ("-wal", "-shm"):
            if os.path.exists(depo + ek):
                shutil.copyfile(depo + ek, kopya + ek)
        c = sqlite3.connect(kopya)
        try:
            gr, bas = collections.defaultdict(list), AYS_BAS
            for tur, alan, yol, govde in c.execute("SELECT tur, alan, yol, govde FROM kayit WHERE silindi=0 ORDER BY alan, yol"):
                v = json.loads(govde)
                gr[(gercek_kosu.rota(alan, yol, tur), alan)].append({"yol": yol, "govde": v})
                if alan == "ays/main" and yol == "profile/main" and isinstance(v, dict) and re.match(r"^\d{4}-\d{2}-\d{2}$", str(v.get("startDate") or "")):
                    bas = v["startDate"]
        finally:
            c.close()
        return [{"rota": r, "alan": a, "kayitlar": k} for (r, a), k in sorted(gr.items())], {"baslangic": bas}
    finally:
        shutil.rmtree(g, ignore_errors=True)


def cevir(gruplar, baglam=None):
    """Node yardimcisina en cok PARTI kayitlik partiler verir; ciktilari kimlikle tekillestirerek birlestirir."""
    out = {"notlar": [], "kayitlar": [], "kartlar": [], "plan": {a: [] for a in ALT["plan"]}, "soru": {a: [] for a in ALT["soru"]},
           "yol": {}, "beden": {}, "say": {}, "disarida": {}, "eksik": {}, "rotasiz": {}}
    gor = collections.defaultdict(set)

    def ekle(yer, ad, o):
        k = anahtar(o)
        if k is not None and k not in gor[ad]:
            gor[ad].add(k)
            yer.append(o)
    parti, n = [], 0
    for g in gruplar + [None]:
        if g is not None:
            parti.append(g)
            n += len(g["kayitlar"])
        if parti and (g is None or n >= PARTI):
            p = subprocess.run(["node", JS], input=json.dumps({"gruplar": parti, "baglam": baglam or {}}, ensure_ascii=False),
                               capture_output=True, text=True, encoding="utf-8")
            if p.returncode != 0:   # yigin izi kayit icerigi tasiyabilir: yalniz cikis kodu
                raise RuntimeError("Node yardımcısı çöktü (çıkış %d)." % p.returncode)
            r = json.loads(p.stdout)
            for ad in LISTE:
                for o in r[ad]:
                    ekle(out[ad], ad, o)
            for bol, altlar in ALT.items():
                for a in altlar:
                    for o in r[bol][a]:
                        ekle(out[bol][a], bol if bol == "plan" else bol + "." + a, o)   # plan tek kimlik uzayi (js ile ayni)
            for asama, y in r["yol"].items():   # parti parti gelen Yol parcalari: ilk gelen kalir
                hedef = out["yol"].setdefault(asama, {"dersler": {}, "cevaplar": {}, "eski": {}})
                for a in hedef:
                    for k, v in (y.get(a) or {}).items():
                        hedef[a].setdefault(k, v)
            for bag, m in r["eksik"].items():
                out["eksik"].setdefault(bag, m)
            for rt, k in r["rotasiz"].items():
                out["rotasiz"][rt] = out["rotasiz"].get(rt, 0) + k
            for a, v in (r.get("beden") or {}).items():
                out["beden"].setdefault(a, v)
            for bag, s in r["say"].items():
                t = out["say"].setdefault(bag, {"girdi": 0, "cikti": 0, "ret": 0, "cokme": 0})
                for k in t:
                    t[k] += s.get(k, 0)
            for bag, k in r["disarida"].items():
                out["disarida"][bag] = out["disarida"].get(bag, 0) + k
            parti, n = [], 0
    return out


def sayilar(p):
    """Paketin bolum sayilari; kabuk teklif metnini bunlardan kurar (yol: eski konu + cevap + okuma girdisi)."""
    s = {k: len(p[k]) for k in LISTE}
    for bol, altlar in ALT.items():
        s[bol] = sum(len(p[bol][a]) for a in altlar)
    s["yol"] = sum(len(v) for y in p["yol"].values() for v in y.values())
    return s


def paket(depo, zaman):
    gruplar, baglam = gruplar_oku(depo)
    r = cevir(gruplar, baglam)
    icerik = {k: r[k] for k in LISTE + ("plan", "soru", "yol", "beden")}
    # kimlik icerikten: ayni depo ayni paketi verir, kabuk ayni paketi iki kez onermez
    kimlik = hashlib.sha256(json.dumps(icerik, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()[:16]
    r["depoda"] = collections.Counter()
    for g in gruplar:
        r["depoda"][g["rota"]] += len(g["kayitlar"])
    return dict({"lifeos_kabuk_baslangic": 1, "kimlik": kimlik, "uretildi": zaman, "say": sayilar(icerik)}, **icerik), r


def rapor(p, r):
    """Tur tablosu, yalniz ad ve sayi. Rota basina: depoda, nereye, gosterilmeyen ve nedeni. Bagdastirici basina:
    girdi, pakete giren, ret, coktu, pakete girmeyen cikti (nedeniyle), tasinamayan (EKSIK) madde sayisi."""
    gz = gercek_kosu.gizle
    s = ["Bağdaştırıcıya giden rotalar (depoda): " + ", ".join("%s %d" % (gz(rt), n) for rt, n in sorted(r["depoda"].items()) if rt not in r["rotasiz"]),
         "", "| Yalnız depoda: neden | Rotalar | Kayıt |", "|---|---|---:|"]
    grup = collections.defaultdict(list)
    for rt in sorted(r["rotasiz"]):
        grup[neden(rt)].append(rt)
    for nd, rl in sorted(grup.items(), key=lambda x: -sum(r["rotasiz"][rt] for rt in x[1])):
        s.append("| %s | %s | %d |" % (nd.replace("|", "/"), ", ".join(gz(rt) for rt in rl), sum(r["rotasiz"][rt] for rt in rl)))
    s += ["", "| Bağdaştırıcı | Girdi | Pakete giren | Ret | Çöktü | Pakete girmeyen çıktı | Taşınamayan (EKSIK madde) |",
          "|---|---:|---:|---:|---:|---|---:|"]
    for bag in sorted(r["say"]):
        x, dis = r["say"][bag], r["disarida"].get(bag, 0)
        s.append("| %s | %d | %d | %d | %d | %s | %d |" % (bag, x["girdi"], x["cikti"], x["ret"], x["cokme"],
                 "%d (%s)" % (dis, DISARIDA.get(bag.split(".")[0], "?")) if dis else "0", len(r["eksik"].get(bag, []))))
    gor = ["- %s: %s" % (bag, m) for bag in sorted(r["eksik"]) for m in r["eksik"][bag] if "göremedim" in m]
    s += ["", "Göremedim (EKSIK maddelerinde «göremedim» geçenler): %d" % len(gor)] + gor
    for asama, y in sorted(p["yol"].items()):
        s.append("Yol %s: %d eski konu durumu, %d cevap, %d okuma." % (asama, len(y["eski"]), len(y["cevaplar"]), len(y["dersler"])))
    return "\n".join(s)


def main(argv=None):
    depo, cikti = varsayilan()
    ap = argparse.ArgumentParser(description="Tek depodaki eski kayıtları yeni kabuğun başlangıç paketine çevirir.")
    ap.add_argument("--depo", default=depo)
    ap.add_argument("--cikti", default=cikti)
    ap.add_argument("--zaman", type=int, default=None, help="üretim zamanı (ms); verilmezse şimdi")
    a = ap.parse_args(argv)
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    if not os.path.isfile(a.depo):
        print("Tek depo yok: " + a.depo + " (önce göç: python sistem/goc.py --gercek)")
        return 1
    import time
    p, r = paket(a.depo, a.zaman if a.zaman is not None else int(time.time() * 1000))
    os.makedirs(os.path.dirname(os.path.abspath(a.cikti)), exist_ok=True)
    yarim = a.cikti + ".yaziliyor"
    with open(yarim, "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(p, ensure_ascii=False, sort_keys=True) + "\n")
    os.replace(yarim, a.cikti)
    x, pl = p["say"], p["plan"]
    print("Kabuk başlangıç paketi `%s`: %d not, %d kayıt, %d kart, %d plan (%d gün, %d hafta hedefi/program, %d şablon), "
          "%d soru, %d Yol girdisi, %d beden alanı → %s" % (p["kimlik"], x["notlar"], x["kayitlar"], x["kartlar"], x["plan"], len(pl["gunler"]),
                                                          len(pl["hedefler"]), len(pl["sablonlar"]), x["soru"], x["yol"], len(p["beden"]), a.cikti))
    print("Depoda %d canlı kayıt; yalnız depoda kalan %d." % (sum(r["depoda"].values()), sum(r["rotasiz"].values())))
    print(rapor(p, r))
    return 1 if any(s["cokme"] for s in r["say"].values()) else 0


if __name__ == "__main__":
    raise SystemExit(main())
