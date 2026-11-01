#!/usr/bin/env python3
"""KING-4 3c uctan uca: modulun GERCEK urettigi olay (core/kingveri.js) tasiyicinin bicim denetiminden
(brand/ortak/olay.js gecerli) ve HKM'nin kural motorundan (HKM/core/kendiliginden.py, POST /api/olay) gecer mi.
Sozlesme belgeler/ekip/KING-OLAY.md; iki taraf ayri oturumlarda yazildi, bu test birbirine baglar.
python tools/king_olay_uctan_test.py"""
import sqlite3  # noqa: F401  (HKM db sqlite3 kullanir)
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KOK / "tools"))
sys.path.insert(0, str(KOK / "HKM"))
import kabul_js as J  # noqa: E402
from core import db, kendiliginden  # noqa: E402

ORTAK = "src/js/core/olay.js"
SIMDI = "const SIMDI = new Date(); SIMDI.setHours(10, 0, 0, 0); const G = n => {N}.U.iso({N}.U.addDays(SIMDI, n));"
URET = {
    "SPI": (["src/js/core/utils.js", "src/js/core/state.js", "src/js/core/haftaplan.js", "src/js/core/kingveri.js", ORTAK],
            "for(let i = -27; i <= 0; i++) SP.S.vitals[G(i)] = { date:G(i), sleep:i > -7 ? 5.5 : 7.5 };", "SP"),
    "AYS": (["src/js/core/utils.js", "src/js/core/state.js", "src/js/core/calc.js", "src/js/core/kingveri.js", ORTAK],
            "R.PLAN = Object.assign({}, R.PLAN || {}, { examTytISO:G(30) }); R.S.cards = [{ id:'k', dueAt:G(0) }];", "R"),
    "ESP": (["src/js/data/rules.js", "src/js/core/utils.js", "src/js/core/memo.js", "src/js/core/state.js", "src/js/core/srs.js",
             "src/js/core/kingveri.js", ORTAK],
            "ESP.S.cards.length = 0; ESP.S.cards.push({ id:'k', front:'a', back:'b', due:G(0), box:1 });", "ESP"),
}
hata = []
con = db.connect(":memory:")
for modul, (dosyalar, tohum, ns) in URET.items():
    try:
        l = J.calistir(modul, dosyalar, "%s.KingVeri.olaylar(SIMDI).map(o => [o, LIFEOS.OLAY.gecerli(o, '%s')])" % (ns, modul.lower()),
                       SIMDI.replace("{N}", ns) + tohum)
    except J.JSHatasi as e:
        hata.append("%s: %s" % (modul, e))
        continue
    if not l:
        hata.append("%s: tohumlanan veriyle olay uretilmedi" % modul)
    for o, gecerli in l:
        if not gecerli:
            hata.append("%s: tasiyici olayi reddetti: %r" % (modul, o))
        kod, cevap = kendiliginden.uc(con, {}, "POST", "/api/olay", govde=o)[:2]
        if kod != 200 or not cevap.get("ok") or cevap.get("karar") in ("kural_yok", "eksik_veri", "bayat"):
            hata.append("%s.%s: HKM cevabi %r %r" % (modul, o.get("tur"), kod, cevap))

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("king olay uctan uca: ays, spi, esp olaylari tasiyicidan ve HKM kural motorundan gecti.")
