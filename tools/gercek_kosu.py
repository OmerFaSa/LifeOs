#!/usr/bin/env python3
"""Goc baglastiricilarinin gercek veride kosusu: YALNIZ SAYILAR.

Canli kaynaklarin (hesap.db ve gunluk yedekleri, hkm.db, goc paketleri, PC'nin JSON ayarlari) KOPYASINI
gecici klasore alir; canli dosyayi hic acmaz (faz1.md: ?mode=ro bile yanina -shm yazar). Kopyadan
sistem/goc.py ile kuru tek depoyu kurar, her kaydi turunun sahibi motorun baglastiricisina verir
(tools/gercek_kosu.js, Node, partiler hâlinde) ve kaynak x tur x rota icin sayar: okunan, uyarlanan,
reddedilen (baglastiricinin Turkce nedeni, gruplu), tasinamayan (baglastiricinin kendi listesi),
okunmayan alan, cikti alaninda tanimsiz, sahipsiz. Rapor kayit icerigi, ad ya da govde tasimaz.
Gecici kopyalar sonunda (hatada da) silinir. Cikis 1: bir baglastirici coktu ya da goc hata verdi.

  python tools/gercek_kosu.py [--cikti KLASOR] [--hesap ...] [--hkm ...] [--paket ...] [--pc ...]
"""
import argparse
import collections
import json
import os
import re
import shutil
import sqlite3
import subprocess
import sys
import tempfile

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(KOK, "sistem"))
import goc  # noqa: E402

JS = os.path.join(KOK, "tools", "gercek_kosu.js")
PARTI = 500
PC_DOSYA = ("ayar.json", "planlama.json", os.path.join("ice", "ice.json"))   # goc.topla_pc'nin okudugu JSON'lar
SAYAC = ("girdi", "cikti", "bos")
SOZLUK = ("red", "eksik", "sessiz", "tanimsiz", "cokme")


def gizle(s):
    """Rota ve alan adlarinda rakam (tarih, kimlik) gorunmez."""
    return re.sub(r"\d+", "#", str(s))


def sqlite_kopya(yol, hedef):
    os.makedirs(os.path.dirname(hedef), exist_ok=True)
    for ek in ("", "-wal", "-shm"):
        if os.path.isfile(yol + ek):
            shutil.copyfile(yol + ek, hedef + ek)


def kopyalar(kaynak, gecici):
    """Canli kaynaklarin kopyasi -> goc.goc'a verilecek yollar. Canli dosya acilmaz, yalniz bayt kopyalanir."""
    out = {}
    h = kaynak.get("hesap")
    if h and os.path.isfile(h):
        out["hesap"] = os.path.join(gecici, "hesap", "hesap.db")
        sqlite_kopya(h, out["hesap"])
        yedek = os.path.join(os.path.dirname(h), "yedek")    # goc.hesap_kaynagi canli bossa buradan okur
        for ad in sorted(os.listdir(yedek)) if os.path.isdir(yedek) else []:
            if re.match(r"^hesap-.*\.db$", ad):
                sqlite_kopya(os.path.join(yedek, ad), os.path.join(gecici, "hesap", "yedek", ad))
    if kaynak.get("hkm") and os.path.isfile(kaynak["hkm"]):
        out["hkm"] = os.path.join(gecici, "hkm", "hkm.db")
        sqlite_kopya(kaynak["hkm"], out["hkm"])
    if kaynak.get("paket") and os.path.isdir(kaynak["paket"]):
        out["paket"] = os.path.join(gecici, "paket")
        shutil.copytree(kaynak["paket"], out["paket"])
    if kaynak.get("pc") and os.path.isdir(kaynak["pc"]):
        out["pc"] = os.path.join(gecici, "pc")
        os.makedirs(out["pc"])
        for ad in PC_DOSYA:
            if os.path.isfile(os.path.join(kaynak["pc"], ad)):
                os.makedirs(os.path.dirname(os.path.join(out["pc"], ad)), exist_ok=True)
                shutil.copyfile(os.path.join(kaynak["pc"], ad), os.path.join(out["pc"], ad))
    return out


def rota(alan, yol, tur):
    modul = alan.split("/", 1)[0]
    if "/anahtar/" in alan or alan.startswith("gun/") and tur == "gun_kaydi":
        return "anahtar:" + ".".join(yol.split(".")[:2])
    if modul == "hkm":
        return "hkm:" + alan.split("/", 1)[1]
    if modul in ("gun", "pc"):
        return modul + ":" + tur
    return modul + ":" + yol.split("/", 1)[0]


def node(gruplar):
    p = subprocess.run(["node", JS], input=json.dumps(gruplar, ensure_ascii=False), capture_output=True,
                       text=True, encoding="utf-8")
    if p.returncode != 0:
        # stderr yalniz son satir: yigin izi kayit icerigi tasimaz ama kisa tutulur
        raise RuntimeError("Node yardımcısı çöktü (çıkış %d): %s" % (p.returncode, gizle((p.stderr.strip().splitlines() or ["?"])[-1])[:200]))
    return json.loads(p.stdout)


def kos(depo):
    """Depodaki her canli kaydi baglastiricisina verir; doner {(kaynak, tur, rota, bag): sayilar}."""
    gruplar = collections.defaultdict(list)
    c = sqlite3.connect(depo)
    try:
        for kaynak, tur, alan, yol, govde in c.execute(
                "SELECT kaynak, tur, alan, yol, govde FROM kayit WHERE silindi=0 ORDER BY alan, yol"):
            gruplar[(kaynak, tur, rota(alan, yol, tur), alan)].append({"yol": yol, "govde": json.loads(govde)})
    finally:
        c.close()
    sonuc = {}
    anahtarlar = sorted(gruplar)
    parti, n = [], 0
    for no, a in enumerate(anahtarlar + [None]):
        if a is not None:
            parti.append({"no": no, "rota": a[2], "alan": a[3], "kayitlar": gruplar[a]})
            n += len(gruplar[a])
        if parti and (a is None or n >= PARTI):
            for no_, satirlar in node(parti).items():
                kaynak, tur, rt, _ = anahtarlar[int(no_)]
                for s in satirlar or [{"bag": "", "girdi": len(gruplar[anahtarlar[int(no_)]])}]:
                    t = sonuc.setdefault((kaynak, tur, gizle(rt), s["bag"]), {k: 0 for k in SAYAC} | {k: collections.Counter() for k in SOZLUK})
                    for k in SAYAC:
                        t[k] += s.get(k, 0)
                    for k in SOZLUK:
                        t[k].update(s.get(k) or {})
            parti, n = [], 0
    return sonuc


def md(sonuc, r):
    sat = ["## Sonuç tablosu", "",
           "Göç kimliği `%s`; goc.py sayı dengesi %s, gidiş-dönüş %s, hata %d. Paket: %s." % (
               r["goc_id"], "tutuyor" if r["denge"] else "TUTMUYOR", "birebir" if r["gidis_donus"] else "FARKLI",
               len(r["hata"]), r["kaynak"]["paket"].get("paket", 0)), "",
           "Okunan: kuru depodaki canlı kayıt (goc.py'nin atladıkları sayılmaz). Çıktı: bağdaştırıcının ürettiği "
           "kayıt/kart/not/plan sayısı (bir gün kaydı birçok ölçü verebilir). Boş: ne çıktı ne ret (null ya da boş liste).", "",
           "| Kaynak | Tür | Rota | Bağdaştırıcı | Okunan | Çıktı | Ret | Boş | Çöktü |", "|---|---|---|---|---:|---:|---:|---:|---:|"]
    sahipsiz = []
    for (kay, tur, rt, bag), t in sorted(sonuc.items()):
        if not bag:
            sahipsiz.append((kay, tur, rt, t["girdi"]))
            continue
        sat.append("| %s | %s | %s | %s | %d | %d | %d | %d | %d |" % (kay, tur, rt, bag, t["girdi"], t["cikti"],
                   sum(t["red"].values()), t["bos"], sum(t["cokme"].values())))
    sat += ["", "### Sahibi motor olmayan kayıtlar", "", "| Kaynak | Tür | Rota | Kayıt |", "|---|---|---|---:|"]
    sat += ["| %s | %s | %s | %d |" % x for x in sahipsiz]
    for baslik, k, i in (("Ret nedenleri (bağdaştırıcının metni)", "red", 3), ("Çökmeler", "cokme", 3),
                         ("Sessiz düşen girdi alanları (rotada ne okunan ne taşınamayan listesinde adı geçen)", "sessiz", 2),
                         ("Çıktıda tanımsız ya da NaN alan", "tanimsiz", 3), ("Taşınamayan (bağdaştırıcının kendi listesi)", "eksik", 3)):
        sat += ["", "### " + baslik, "", "| %s | Ne | Sayı |" % ("Rota" if i == 2 else "Bağdaştırıcı"), "|---|---|---:|"]
        sat += ["| %s | %s | %d |" % (a[i], m.replace("|", "/"), n) for a, t in sorted(sonuc.items())
                for m, n in sorted(t[k].items())]
    return "\n".join(sat) + "\n"


def main(argv=None):
    v = goc.varsayilan()
    ap = argparse.ArgumentParser(description="Göç bağdaştırıcılarının gerçek veride koşusu (yalnız sayılar).")
    ap.add_argument("--cikti", default=os.path.join(tempfile.gettempdir(), "lifeos-gercek-kosu"))
    for ad in ("hesap", "hkm", "paket", "pc"):
        ap.add_argument("--" + ad, default=v[ad])
    a = ap.parse_args(argv)
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    gecici = tempfile.mkdtemp(prefix="lifeos-gercek-kosu-")
    try:
        kop = kopyalar(vars(a), gecici)
        hedef = os.path.join(gecici, "hedef")
        os.makedirs(hedef)
        r = goc.goc(hedef, kop.get("hesap"), kop.get("hkm"), kop.get("paket"), kop.get("pc"))
        sonuc = kos(os.path.join(hedef, "lifeos.db"))
    finally:
        shutil.rmtree(gecici, ignore_errors=True)
        if os.path.exists(gecici):
            print("UYARI: geçici kopya silinemedi: " + gecici, file=sys.stderr)
    rapor = md(sonuc, r)
    os.makedirs(a.cikti, exist_ok=True)
    with open(os.path.join(a.cikti, "gercek-kosu.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write(rapor)
    print(rapor)
    print("Rapor: " + a.cikti)
    coktu = sum(sum(t["cokme"].values()) for t in sonuc.values())
    return 1 if coktu or r["hata"] else 0


if __name__ == "__main__":
    sys.exit(main())
