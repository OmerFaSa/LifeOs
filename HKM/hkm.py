#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""hkm — terminalden HKM.

    python3 hkm.py durum              gunun brifingi
    python3 hkm.py hafta              haftalik rapor
    python3 hkm.py capraz             capraz bulgular
    python3 hkm.py etki               oneri sonrasi olculer ne yapti
    python3 hkm.py seri               ust uste suren esik kiriklari
    python3 hkm.py kararlar           gunun onerileri
    python3 hkm.py kutu               giden kutusu
    python3 hkm.py niyetler           bekleyen teklifler
    python3 hkm.py sor "<cumle>"      Buyuk Patron'a yaz
    python3 hkm.py gonder [kanal]     gunun ozetini kanala GONDERIR
    python3 hkm.py yedek [dosya]      butun ambari JSON olarak yazar
    python3 hkm.py geri <dosya> [--ustune]   yedegi geri yukler

   Daemon'a HTTP ile gitmez: veritabanini DOGRUDAN okur. Sebebi sade —
   daemon kapaliyken de ambara bakabilmek gerekir, ve bir bakis icin bir
   servisin ayakta olmasini sart kosmak, ayakta olmadigi anda hicbir sey
   soyleyememek demektir.

   Yazan komutlar (sor) ambara yazar; okuyanlar hicbir sey degistirmez.
"""

import datetime
import json
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)

from core import (channels, cross, db, impact, intents, outbox,  # noqa: E402
                  patron, streak, thresholds, weekly)
from daemon import load_config  # noqa: E402


def _con(cfg):
    return db.connect(cfg.get("db_path") or db.DB_PATH)


def _bugun():
    return datetime.date.today().isoformat()


def yaz(*parcalar):
    sys.stdout.write(" ".join(str(p) for p in parcalar) + "\n")


def komut_durum(con, cfg, args):
    tarih = args[0] if args else _bugun()
    m = patron.daily_message(con, tarih, th=thresholds.from_config(cfg))
    yaz(m["text"] if m["ok"] else m["error"])


def komut_hafta(con, cfg, args):
    yaz(weekly.message(con, args[0] if args else _bugun(),
                       th=thresholds.from_config(cfg)))


def komut_capraz(con, cfg, args):
    bulgular = cross.scan(con, args[0] if args else _bugun())
    for b in bulgular:
        isaret = {"higher": "↑", "lower": "↓", "flat": "=",
                  "missing": "·"}.get(b["status"], "?")
        yaz(" %s %-28s %s" % (isaret, b["id"], b["note"]))


def komut_seri(con, cfg, args):
    for b in streak.scan(con, args[0] if args else _bugun(),
                         th=thresholds.from_config(cfg)):
        isaret = {"running": "→", "ended": "·", "clean": " ", "missing": "?"}
        yaz(" %s %-14s %s" % (isaret.get(b["status"], "?"), b["id"], b["note"]))


def komut_etki(con, cfg, args):
    ozet = impact.summary(con)
    yaz((ozet["verdict"] or {}).get("note", ""))
    for k, g in (ozet["rules"] or {}).items():
        yaz("   %-18s kabul %d · ret %d · ↑%d ↓%d =%d"
            % (k, g["accepted"], g["declined"], g["accepted_improved"],
               g["accepted_worsened"], g["accepted_flat"]))


def komut_kararlar(con, cfg, args):
    tarih = args[0] if args else _bugun()
    kayitlar = db.decisions_of(con, tarih)
    if not kayitlar:
        yaz("Bu güne yazılmış öneri yok.")
        return
    for k in kayitlar:
        yaz(" [%s] sıra %s · %s" % (k["state"], k["rank"], k["proposal"]))


def komut_kutu(con, cfg, args):
    d = outbox.status(con)
    yaz("durum:", json.dumps(d["counts"], ensure_ascii=False))
    for r in d["recent"][:10]:
        yaz(" %-9s %-7s %s · %s" % (r["state"], r["kind"], r["day"],
                                    (r["last_error"] or "")[:60]))


def komut_niyetler(con, cfg, args):
    for mod in intents.MODULES:
        bekleyen = db.intents_for(con, mod, ("pending", "delivered"))
        for n in bekleyen:
            yaz(" %-4s %-10s %-9s %s" % (mod.upper(), n["kind"], n["state"],
                                         n["note"]))
    if not any(db.intents_for(con, m, ("pending", "delivered"))
               for m in intents.MODULES):
        yaz("Bekleyen teklif yok.")


def komut_sor(con, cfg, args):
    if not args:
        yaz("Ne soracağını yazmadın.")
        return 1
    r = patron.respond(con, " ".join(args), th=thresholds.from_config(cfg),
                       channel="cli")
    yaz(r["text"])


def komut_geri(con, cfg, args):
    """Dosyadan geri yukleme — HTTP govde sinirina takilmadan.

    Dokuz aylik bir yedek megabaytlarca olur; onu bir HTTP govdesine
    sigdirmaya calismak yerine dosyayi dogrudan okumak hem basit hem
    guvenli. «--ustune» verilmedikce dolu ambara dokunulmaz."""
    if not args:
        yaz("Hangi dosya? Ornek: python3 hkm.py geri hkm-yedek-2026-09-14.json")
        return 1
    yol = args[0]
    if not os.path.exists(yol):
        yaz("Dosya yok: %s" % yol)
        return 1
    with open(yol, encoding="utf-8") as f:
        try:
            veri = json.load(f)
        except ValueError as e:
            yaz("Dosya gecerli bir JSON degil: %s" % e)
            return 1
    r = db.import_all(con, veri, replace=("--ustune" in args))
    if not r.get("ok"):
        yaz("Geri yuklenmedi — " + r["error"])
        return 1
    yaz("Geri yuklendi: " + ", ".join("%s %d" % (k, v)
                                      for k, v in sorted(r["written"].items())))
    if r.get("rollback_copy"):
        yaz("Oncesinin kopyasi: " + r["rollback_copy"])
    if r.get("skipped"):
        yaz("Atlanan anahtarlar: " + ", ".join(r["skipped"]))
    return 0


def komut_yedek(con, cfg, args):
    veri = db.export_all(con)
    yol = args[0] if args else ("hkm-yedek-%s.json" % _bugun())
    with open(yol, "w", encoding="utf-8") as f:
        f.write(json.dumps(veri, ensure_ascii=False, indent=2))
    say = sum(len(v) for k, v in veri.items() if isinstance(v, list))
    yaz("%s yazıldı — %d satır." % (yol, say))


def komut_gonder(con, cfg, argv):
    """Gunun ozetini kanala gonderir — GIDEN yon.

    Giden yon icin tunele gerek yoktur: HKM disari cikar, disarinin iceri
    girmesi gerekmez. Gelen yon (senin yazdigin mesaj) ayri bir istir ve
    webhook ister.

    Mesaj once GIDEN KUTUSUNA yazilir, sonra gonderilmeye calisilir:
    ag koptugunda kaybolmaz, tekrar denenir."""
    kanal = (argv[0] if argv else "") or cfg.get("schedule", {}).get(
        "channel") or "telegram"
    if kanal not in ("telegram", "whatsapp"):
        yaz("Bilinmeyen kanal: %s (telegram ya da whatsapp)" % kanal)
        return 2
    if not channels.enabled(cfg, kanal):
        yaz("%s kapalı ya da kimlik bilgileri eksik." % kanal)
        yaz("Ayarlar → Sohbet kanalları bölümünden doldur ve «Aç» de.")
        return 1
    gun = _bugun()
    th = thresholds.from_config(cfg)
    m = patron.daily_message(con, gun, th=th)
    if not m["ok"]:
        yaz("Mesaj üretilemedi: %s" % m.get("error"))
        return 1
    zorla = "--zorla" in argv
    if not zorla and patron.already_sent(con, gun, kanal):
        yaz("Bugünün mesajı bu kanala zaten gönderildi. (--zorla ile yine gönderilir)")
        return 0
    outbox.enqueue(con, kanal, "daily", gun, m["text"])
    ozet = outbox.flush(con, cfg, limit=5)
    if ozet.get("sent"):
        patron.log(con, kanal, "manager", m["text"])
        yaz("Gönderildi — %d karakter." % len(m["text"]))
        return 0
    son = outbox.status(con, limit=3)["recent"]
    sebep = (son[0].get("last_error") if son else "") or "sebep yazılmadı"
    yaz("Gönderilemedi ama KAYBOLMADI: mesaj giden kutusunda bekliyor.")
    yaz("  " + str(sebep))
    return 1


KOMUTLAR = {
    "durum": komut_durum, "hafta": komut_hafta, "capraz": komut_capraz,
    "etki": komut_etki, "seri": komut_seri, "kararlar": komut_kararlar, "kutu": komut_kutu,
    "niyetler": komut_niyetler, "sor": komut_sor, "yedek": komut_yedek,
    "geri": komut_geri, "gonder": komut_gonder,
}


def main(argv=None):
    argv = list(argv if argv is not None else sys.argv[1:])
    if not argv or argv[0] in ("-h", "--help", "yardim"):
        yaz(__doc__.strip())
        return 0
    ad = argv[0]
    fn = KOMUTLAR.get(ad)
    if not fn:
        yaz("Bilinmeyen komut: %s" % ad)
        yaz("Şunlar var: " + ", ".join(sorted(KOMUTLAR)))
        return 1
    cfg = load_config()
    from core import saat
    saat.dilimi_kur(cfg)          # HATALAR KO-1: gun kullanicinin gunudur
    con = _con(cfg)
    try:
        return fn(con, cfg, argv[1:]) or 0
    finally:
        con.close()


if __name__ == "__main__":
    raise SystemExit(main())
