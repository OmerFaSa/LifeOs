#!/usr/bin/env python3
"""KABUL_JS — Python kabul testinin modul JS mantigini tarayicisiz kosmasi (Node vm).

Ofisin kabul testleri Python'dur (Testci .py kosar); LifeOS'un mantigi ise modul
JS'inde (`window.SP = …; SP.X = (function(){…})()`). Bu yardimci verilen dosyalari
tek bir vm baglamina sirayla yukler (window = self = globalThis = baglam, bellekte
localStorage) ve bir ifadeyi degerlendirip sonucunu JSON olarak dondurur. Promise
beklenir. Tarayici API'si (document, fetch) yoktur: yalniz saf mantik sinanir.

    import kabul_js as J
    J.calistir("SPI", ["src/js/core/utils.js", "src/js/core/dunku.js"], "SP.Dunku.oneriler('2026-10-31')")

Hata: ifade ya da yukleme hata verirse JSHatasi (mesaj ve yigin ilk satiri).
"""
import json
import subprocess
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent

BETIK = r"""
const vm = require('vm'), fs = require('fs');
const [dosyalar, ifade, hazirlik] = JSON.parse(fs.readFileSync(0, 'utf8'));
const depo = {};
const c = { console, setTimeout, clearTimeout, Promise, Date, Math, JSON, Intl,
  localStorage: { getItem: k => (k in depo ? depo[k] : null), setItem: (k, v) => { depo[k] = String(v); },
                  removeItem: k => { delete depo[k]; }, clear: () => { for (const k in depo) delete depo[k]; },
                  key: i => Object.keys(depo)[i] ?? null, get length(){ return Object.keys(depo).length; } } };
c.window = c; c.self = c; c.globalThis = c;
vm.createContext(c);
const yaz = o => process.stdout.write(JSON.stringify(o));
const ileti = e => e && e.message !== undefined
  ? e.name + ': ' + e.message + ' ' + ((e.stack || '').split('\n').find(s => s.trim().startsWith('at ')) || '').trim() : String(e);
try {
  for (const f of dosyalar) vm.runInContext(fs.readFileSync(f, 'utf8'), c, { filename: f });
  if (hazirlik) vm.runInContext(hazirlik, c, { filename: 'hazirlik' });
  Promise.resolve(vm.runInContext(ifade, c, { filename: 'ifade' }))
    .then(v => yaz({ ok: v === undefined ? null : v }), e => yaz({ hata: ileti(e) }));
} catch (e) { yaz({ hata: ileti(e) }); }
"""


class JSHatasi(Exception):
    pass


# utils.js ortak cekirdeklere dayanir (2026-11-01, KING-4 Olcum 1c): istenince yanindakiler onune eklenir.
CEKIRDEK = ("tarih.js", "bicim.js")


def on_cekirdek(dosyalar):
    """utils.js'ten once ayni klasordeki ortak cekirdekler (zaten listede olan eklenmez). Saf islev."""
    out = []
    for d in dosyalar:
        if d.replace("\\", "/").endswith("core/utils.js"):
            klasor = d[:-len("utils.js")]
            out += [klasor + c for c in CEKIRDEK if klasor + c not in dosyalar and klasor + c not in out]
        out.append(d)
    return out


def calistir(modul, dosyalar, ifade, hazirlik="", zaman=30):
    """modul: 'AYS' | 'SPI' | 'ESP' (dosyalar ona goreli) ya da '' (depo kokune goreli)."""
    kok = KOK / modul if modul else KOK
    yollar = [str(kok / d) for d in on_cekirdek(dosyalar)]
    for y in yollar:
        if not Path(y).exists():
            raise JSHatasi("dosya yok: " + y)
    r = subprocess.run(["node", "-e", BETIK], input=json.dumps([yollar, ifade, hazirlik]), capture_output=True,
                       text=True, encoding="utf-8", timeout=zaman)
    try:
        out = json.loads(r.stdout or "{}")
    except ValueError:
        raise JSHatasi((r.stdout + r.stderr).strip()[:600])
    if "hata" in out or "ok" not in out:
        raise JSHatasi((out.get("hata") or r.stderr or "sonuç yok").strip().splitlines()[0][:600])
    return out["ok"]
