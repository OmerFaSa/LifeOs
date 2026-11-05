#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""King LLM olcumu: ilk soz, toplam sure, jeton ve ses baslama gecikmesi.

Canli HKM'ye dokunmaz. Ayar bellekte okunur (anahtar yazdirilmaz), defter
gecici dosyadir; --db verilirse o veritabaninin KOPYASI kullanilir.

  python tools/king_olcum.py sohbet --config C:/.../config.json --db C:/.../hkm.db \
      --katalog katalog.json --modul ays --cikti once.json
  python tools/king_olcum.py sohbet --kuru            # agsiz: sahte tasiyici (CI)
  python tools/king_olcum.py ses --config C:/.../config.json --motor piper,ema --wav klasor/

Buluta giden cumle kullanicinin verisini tasimasin diye --bulut MODEL verilince
--db reddedilir: bos defterle (kisisel olcum yok) koşulur.
"""
import argparse
import datetime
import json
import os
import shutil
import sqlite3
import statistics
import sys
import tempfile
import time

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(KOK, "HKM"))

from core import ai, db, models, ses, sohbet  # noqa: E402

SORULAR = [
    "selam King, nasılsın?",
    "bugün çok yorgunum, ne önerirsin?",
    "uykum nasıl gidiyor?",
    "son denemelerim nasıl?",
    "bana motive edici bir şey söyle",
    "pomodoro nedir, kısaca anlatır mısın?",
    "türev nedir, basit bir örnekle anlat",
    "sabah mı akşam mı çalışmalıyım, karar ver ve gerekçelendir",
    "önümüzdeki iki hafta için çalışma planı önerir misin?",
    "fotosentez neden önemli?",
]
SES_METINLERI = [
    "Tamam, hemen bakıyorum.",
    "Bugün yirmi beş dakikalık iki blokla başlamak iyi olabilir; ardından kısa bir mola verirsin.",
    "Son üç denemende Türkçe netin yükseliyor, matematikte ise türev konusunda hâlâ birkaç eksik görünüyor.",
]


def _kopya(yol, hedef):
    """Canli dosyaya dokunmadan tutarli kopya (WAL dahil)."""
    kaynak = sqlite3.connect("file:%s?mode=ro" % yol.replace("\\", "/"), uri=True)
    ic = sqlite3.connect(hedef)
    with ic:
        kaynak.backup(ic)
    kaynak.close()
    ic.close()


def _ayar(args):
    if args.kuru:
        return models.apply({"local_token": "x", "budget": {"ceiling_currency": "usd", "monthly_usd": 20.0}},
                            {"yer": "yerel", "yerel": {"ekonomik": "sahte"}})
    with open(args.config, encoding="utf-8") as f:
        cfg = {"host": "127.0.0.1", "port": 4200, "local_token": ""}
        cfg.update(json.load(f))
    if getattr(args, "bulut", None):
        cfg = models.apply(cfg, {"yer": "bulut", "assignments": {"king": {"provider": args.saglayici, "model": args.bulut}}})
    return cfg


def _sahte(provider, anahtar, model, sistem, mesajlar, ayar=None, **_):
    metin = "Kısa bir cevap. İkinci cümle de burada."
    if ayar and callable(ayar.get("akis")):
        for p in ("Kısa bir cevap. ", "İkinci cümle ", "de burada."):
            ayar["akis"](p)
        ayar["akis"](None)
    return metin, 10, 5


def sohbet_olc(args):
    cfg = _ayar(args)
    if getattr(args, "bulut", None) and args.db:
        sys.exit("--bulut ile --db birlikte verilemez: kisisel olcum buluta gitmesin.")
    katalog = []
    if args.katalog:
        with open(args.katalog, encoding="utf-8") as f:
            katalog = json.load(f)[args.modul]
    td = tempfile.mkdtemp(prefix="king-olcum-")
    try:
        yol = os.path.join(td, "hkm.db")
        if args.db:
            _kopya(args.db, yol)
        con = db.connect(yol)
        gun = datetime.date.today().isoformat()
        satirlar = []
        ai.ONBELLEK_SN = 0              # ayni soru tekrarinda onbellek olcumu bozmasin
        for tur in range(args.tekrar):
            for soru in SORULAR[:args.n]:
                t0 = time.perf_counter()
                ilk = [None]

                def yay(p, ilk=ilk, t0=t0):
                    if ilk[0] is None and str(p).strip():
                        ilk[0] = time.perf_counter() - t0
                r = sohbet.konus(con, cfg, soru, gun, gecmis=[], kayit=False, akis=yay, modul=args.modul,
                                 araclar=katalog or None, transport=_sahte if args.kuru else None)
                top = time.perf_counter() - t0
                d = con.execute("SELECT in_tok, out_tok FROM usage ORDER BY id DESC LIMIT 1").fetchone()
                satirlar.append({"tur": tur, "soru": soru, "mod": r.get("mode"), "model": r.get("model"),
                                 "ilk_ms": round((ilk[0] if ilk[0] is not None else top) * 1000),
                                 "akti": ilk[0] is not None, "toplam_ms": round(top * 1000),
                                 "giris": d[0] if d else None, "cikis": d[1] if d else None,
                                 "cagrilar": [c.get("ad") for c in (r.get("cagrilar") or [])],
                                 "metin": (r.get("text") or "")[:600], "ai": r.get("ai")})
                s = satirlar[-1]
                print("%-48s %-6s ilk %6d ms  top %6d ms  giris %5s  %s" % (
                    soru[:48], s["mod"], s["ilk_ms"], s["toplam_ms"], s["giris"], ",".join(s["cagrilar"])), flush=True)
        con.close()
    finally:
        shutil.rmtree(td, ignore_errors=True)
    ozet = _ozet(satirlar)
    print(json.dumps(ozet, ensure_ascii=False))
    if args.cikti:
        with open(args.cikti, "w", encoding="utf-8") as f:
            json.dump({"ozet": ozet, "satirlar": satirlar}, f, ensure_ascii=False, indent=1)
    return ozet


def _ozet(satirlar):
    if not satirlar:
        return {}
    ilk = [s["ilk_ms"] for s in satirlar]
    top = [s["toplam_ms"] for s in satirlar]
    return {"n": len(satirlar), "ilk_ortanca_ms": round(statistics.median(ilk)), "ilk_en_cok_ms": max(ilk),
            "toplam_ortanca_ms": round(statistics.median(top)), "toplam_en_cok_ms": max(top),
            "akan": sum(1 for s in satirlar if s["akti"]),
            "giris_ortanca": statistics.median([s["giris"] or 0 for s in satirlar])}


def ses_olc(args):
    cfg = _ayar(args)
    td = tempfile.mkdtemp(prefix="king-olcum-")
    try:
        con = db.connect(os.path.join(td, "hkm.db"))
        sonuc = []
        for motor in args.motor.split(","):
            for i, metin in enumerate(SES_METINLERI * args.tekrar):
                t0 = time.perf_counter()
                r = ses.akis(con, cfg, metin, motor)
                if not r.get("ok"):
                    sonuc.append({"motor": motor, "ok": False, "not": r.get("notlar")})
                    print(motor, "OLMADI", r.get("notlar"), flush=True)
                    break
                ilk, pcm = None, []
                for p in r["parcalar"]:
                    if ilk is None:
                        ilk = time.perf_counter() - t0
                    pcm.append(p)
                top = time.perf_counter() - t0
                veri = b"".join(pcm)
                sure = len(veri) / 2 / r["hz"]
                sonuc.append({"motor": motor, "ok": True, "harf": len(metin), "ilk_ms": round(ilk * 1000),
                              "toplam_ms": round(top * 1000), "ses_sn": round(sure, 2), "onbellek": bool(r.get("onbellek"))})
                print("%-7s %3d harf  ilk %6d ms  top %6d ms  ses %5.2f sn%s" % (
                    motor, len(metin), sonuc[-1]["ilk_ms"], sonuc[-1]["toplam_ms"], sure,
                    "  (onbellek)" if r.get("onbellek") else ""), flush=True)
                if args.wav:
                    os.makedirs(args.wav, exist_ok=True)
                    with open(os.path.join(args.wav, "%s-%d.wav" % (motor, i)), "wb") as f:
                        f.write(ses.wav(veri, r["hz"]))
                with ses._KILIT:
                    ses._ONBELLEK.clear()   # ayni metin tekrarinda onbellek olcumu bozmasin
        con.close()
    finally:
        ses._ema_kapat()
        shutil.rmtree(td, ignore_errors=True)
    if args.cikti:
        with open(args.cikti, "w", encoding="utf-8") as f:
            json.dump(sonuc, f, ensure_ascii=False, indent=1)
    return sonuc


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    alt = p.add_subparsers(dest="is_", required=True)
    s = alt.add_parser("sohbet")
    s.add_argument("--config")
    s.add_argument("--db")
    s.add_argument("--katalog")
    s.add_argument("--modul", default="ays")
    s.add_argument("--kuru", action="store_true")
    s.add_argument("--n", type=int, default=len(SORULAR))
    s.add_argument("--tekrar", type=int, default=1)
    s.add_argument("--bulut")
    s.add_argument("--saglayici", default="google")
    s.add_argument("--cikti")
    v = alt.add_parser("ses")
    v.add_argument("--config", required=True)
    v.add_argument("--motor", default="piper,ema")
    v.add_argument("--tekrar", type=int, default=1)
    v.add_argument("--wav")
    v.add_argument("--cikti")
    v.set_defaults(kuru=False)
    a = p.parse_args()
    if a.is_ == "sohbet" and not a.kuru and not a.config:
        p.error("--config ya da --kuru gerekir")
    (sohbet_olc if a.is_ == "sohbet" else ses_olc)(a)


if __name__ == "__main__":
    main()
