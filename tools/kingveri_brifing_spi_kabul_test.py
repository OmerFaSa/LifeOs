#!/usr/bin/env python3
"""Gorev 061 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
SPİ sabah brifingi verisi (KING-4 §H «60 sn sabah brifingi»): SP.KingVeri.brifing(simdi).
Sayiyi modul kodu uretir, cumleyi King'in modeli kurar (AGENTS §1); eksik veri sifir degildir.
Node'da kosar (tools/kabul_js.py). python tools/kingveri_brifing_spi_kabul_test.py"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kabul_js as J  # noqa: E402

DOSYALAR = ["src/js/core/utils.js", "src/js/core/state.js", "src/js/core/haftaplan.js", "src/js/core/hatirlat.js", "src/js/core/kingveri.js"]
HAZIRLIK = r"""
const YAZILAN = [];
SP.Store = { set: async (y, d) => { YAZILAN.push(y); return true; }, get: async () => null, remove: async () => {} };
const SIMDI = new Date(); SIMDI.setHours(7, 30, 0, 0);
const G = n => SP.U.iso(SP.U.addDays(SIMDI, n));
const UYKU = (bas, bit, saat) => { for(let i = bas; i <= bit; i++) SP.S.vitals[G(i)] = { date:G(i), sleep:saat }; };
const MADDE = [];
SP.HaftaPlan = { liste: () => MADDE.length ? [{ id:'p1' }] : [], bugunMaddeleri: (p, iso) => iso === G(0) ? MADDE : [],
  sayim: (p, m) => ({ tamam:!!m.bitti, n:0, hedef:1 }), zamanAn: z => z && z.includes(':') ? Number(z.slice(0,2)) * 60 + Number(z.slice(3)) : 24 * 60,
  zamanYaz: z => z && z.includes(':') ? z : '' };
"""
hata = []


def js(ifade, ek=""):
    try:
        return J.calistir("SPI", DOSYALAR, ifade, HAZIRLIK + ek)
    except J.JSHatasi as e:
        hata.append("JS hatasi: %s" % e)
        return None


def esit(ne, gelen, beklenen):
    if gelen != beklenen:
        hata.append("%s: beklenen %s, gelen %s" % (ne, json.dumps(beklenen, ensure_ascii=False),
                                                   json.dumps(gelen, ensure_ascii=False)))


B = "SP.KingVeri.brifing(SIMDI)"

# 1) bos depo: plan bos, bulgu ve oneri null; gun = bugun; saf (yazmaz), iki cagri ayni
r = js("[%s, %s, G(0), YAZILAN.length]" % (B, B))
if r:
    esit("bos brifing", r[0], {"gun": r[2], "plan": [], "bulgu": None, "oneri": None})
    esit("iki cagri ayni", r[1], r[0])
    esit("brifing yazmaz", r[3], 0)

# 2) plan: saatliler saat sirasina, saatsiz (dilim) sonra; tamam = sayim().tamam; en cok 8
r = js(B + ".plan", """MADDE.push({ id:'m1', metin:'Esneme', zaman:'09:45' }, { id:'m2', metin:'Su iç', zaman:'akşam' },
  { id:'m3', metin:'Sabah yürüyüşü', zaman:'08:30', bitti:true });""")
esit("plan", r, [{"ad": "Sabah yürüyüşü", "saat": "08:30", "tamam": True}, {"ad": "Esneme", "saat": "09:45", "tamam": False},
                 {"ad": "Su iç", "saat": None, "tamam": False}])
r = js(B + ".plan.length", "for(let i = 0; i < 12; i++) MADDE.push({ id:'k' + i, metin:'M' + i, zaman:'' });")
esit("plan en cok 8", r, 8)

# 3) bulgu: dun 6,2 saat; onceki 7 gecede (G(-8)..G(-2)) 4 kayitli gece 7, 7.5, 8, 6.5 -> ort 7,3 (bir ondalik)
r = js(B + ".bulgu", """SP.S.vitals[G(-1)] = { sleep:6.2 }; SP.S.vitals[G(-2)] = { sleep:7 }; SP.S.vitals[G(-4)] = { sleep:7.5 };
  SP.S.vitals[G(-6)] = { sleep:8 }; SP.S.vitals[G(-8)] = { sleep:6.5 }; SP.S.vitals[G(-9)] = { sleep:2 };""")
esit("bulgu", r, {"id": "uyku", "ad": "Uyku", "deger": 6.2, "birim": "saat", "etiket": "ölçüldü",
                  "ort": {"deger": 7.3, "etiket": "hesaplandı"}})

# 4) ort: 2 gece -> veri yok; dun kayit yok -> bulgu null
r = js(B + ".bulgu", "SP.S.vitals[G(-1)] = { sleep:6 }; SP.S.vitals[G(-3)] = { sleep:7 }; SP.S.vitals[G(-5)] = { sleep:7 };")
esit("ort veri yok", (r or {}).get("ort"), {"deger": None, "etiket": "veri yok"})
r = js(B + ".bulgu", "SP.S.vitals[G(-2)] = { sleep:7 };")
esit("dun yok", r, None)

# 5) oneri: uyku_dustu olayi (sayilar olayinkiyle ayni)
r = js("[" + B + ".oneri, SP.KingVeri.olaylar(SIMDI)]", "UYKU(-27, -7, 7.5); UYKU(-6, 0, 5.5); MADDE.push({ id:'m1', metin:'Esneme', zaman:'' });")
if r:
    s = [o for o in r[1] if o.get("tur") == "uyku_dustu"]
    esit("oneri uyku", r[0], {"id": "uyku_dustu", "sayilar": s[0]["sayilar"] if s else None})

# 6) olay yoksa ilk tamamlanmamis madde (plan sirasiyla)
r = js(B + ".oneri", "MADDE.push({ id:'m1', metin:'Esneme', zaman:'09:45' }, { id:'m3', metin:'Yürüyüş', zaman:'08:30', bitti:true });")
esit("oneri ilk madde", r, {"id": "ilk_madde", "konu": "Esneme", "sayilar": {}})

if hata:
    print("spi brifing kabul KIRMIZI:")
    for h in hata:
        print(" -", h)
    sys.exit(1)
print("spi brifing kabul: bos, plan, bulgu+ort, ort veri yok, oneri onceligi, ilk madde, saf.")
