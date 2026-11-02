#!/usr/bin/env python3
"""Gorev 060 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
AYS sabah brifingi verisi (KING-4 §H «60 sn sabah brifingi»): R.KingVeri.brifing(simdi).
Sayiyi modul kodu uretir, cumleyi King'in modeli kurar (AGENTS §1); eksik veri sifir degildir.
Node'da kosar (tools/kabul_js.py). python tools/kingveri_brifing_ays_kabul_test.py"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kabul_js as J  # noqa: E402

DOSYALAR = ["src/js/core/utils.js", "src/js/core/state.js", "src/js/core/calc.js", "src/js/core/kingveri.js"]
HAZIRLIK = r"""
const YAZILAN = [];
R.Store = { set: async (y, d) => { YAZILAN.push(y); return true; }, get: async () => null, remove: async () => {} };
const SIMDI = new Date(); SIMDI.setHours(7, 30, 0, 0);
const G = n => R.U.iso(R.U.addDays(SIMDI, n));
R.PLAN = Object.assign({}, R.PLAN || {}, { examTytISO:null });
const BLOK = (id, slot, o) => Object.assign({ id, slot, subject:'Matematik', topic:'Türev', targetMin:75, status:'pending',
  actualMin:null, actualQ:null, correctQ:null, startedAt:null }, o || {});
const GUN = (n, bloklar) => { R.S.days[G(n)] = { date:G(n), blocks:bloklar, freeQ:null }; };
"""
hata = []


def js(ifade, ek=""):
    try:
        return J.calistir("AYS", DOSYALAR, ifade, HAZIRLIK + ek)
    except J.JSHatasi as e:
        hata.append("JS hatasi: %s" % e)
        return None


def esit(ne, gelen, beklenen):
    if gelen != beklenen:
        hata.append("%s: beklenen %s, gelen %s" % (ne, json.dumps(beklenen, ensure_ascii=False),
                                                   json.dumps(gelen, ensure_ascii=False)))


B = "R.KingVeri.brifing(SIMDI)"

# 1) bos depo: plan bos, bulgu ve oneri null; gun = bugun; saf (yazmaz), iki cagri ayni
r = js("[%s, %s, G(0), YAZILAN.length]" % (B, B))
if r:
    esit("bos brifing", r[0], {"gun": r[2], "plan": [], "bulgu": None, "oneri": None})
    esit("iki cagri ayni", r[1], r[0])
    esit("brifing yazmaz", r[3], 0)

# 2) plan: bugunun bloklari sirasiyla; ad «ders · konu» (konu yoksa ders), saat null, tamam = done
r = js(B + ".plan", "GUN(0, [BLOK('a', 'Ana ders', {status:'done', actualMin:70}), BLOK('b', 'Tekrar', {subject:'Fizik', topic:''})]);")
esit("plan", r, [{"ad": "Matematik · Türev", "saat": None, "tamam": True}, {"ad": "Fizik", "saat": None, "tamam": False}])

# 3) bulgu: dun 50 + 40 dk (null sayilmaz); onceki 7 gunde (G(-8)..G(-2)) 3 kayitli gun 60, 30, 45 -> ort 45
r = js(B + ".bulgu", """GUN(-1, [BLOK('d1','A',{actualMin:50}), BLOK('d2','B',{actualMin:40}), BLOK('d3','C')]);
  GUN(-2, [BLOK('x','A',{actualMin:60})]); GUN(-5, [BLOK('y','A',{actualMin:30})]); GUN(-8, [BLOK('z','A',{actualMin:45})]);
  GUN(-9, [BLOK('w','A',{actualMin:500})]);""")
esit("bulgu", r, {"id": "calisma_dk", "ad": "Çalışma", "deger": 90, "birim": "dk", "etiket": "ölçüldü",
                  "ort": {"deger": 45, "etiket": "hesaplandı"}})

# 4) ort: 2 kayitli gun -> veri yok; dun hic olculmemis blok -> bulgu null
r = js(B + ".bulgu", "GUN(-1, [BLOK('d1','A',{actualMin:20})]); GUN(-3, [BLOK('x','A',{actualMin:60})]); GUN(-4, [BLOK('y','A',{actualMin:30})]);")
esit("ort veri yok", (r or {}).get("ort"), {"deger": None, "etiket": "veri yok"})
r = js(B + ".bulgu", "GUN(-1, [BLOK('d1','A')]);")
esit("olculmemis dun", r, None)

# 5) oneri: sinav_yaklasti tekrar_gunu'ndan once; sayilar olayinkiyle ayni
r = js("[" + B + ".oneri, R.KingVeri.olaylar(SIMDI)]", "R.PLAN.examTytISO = G(14); GUN(0, [BLOK('a','A')]);")
if r:
    s = [o for o in r[1] if o.get("tur") == "sinav_yaklasti"]
    esit("oneri sinav", r[0], {"id": "sinav_yaklasti", "sayilar": s[0]["sayilar"] if s else None})

# 6) olay yoksa ilk tamamlanmamis plan maddesi
r = js(B + ".oneri", "GUN(0, [BLOK('a','A',{status:'done'}), BLOK('b','B',{subject:'Kimya', topic:'Mol'})]);")
esit("oneri ilk madde", r, {"id": "ilk_madde", "konu": "Kimya · Mol", "sayilar": {}})

if hata:
    print("ays brifing kabul KIRMIZI:")
    for h in hata:
        print(" -", h)
    sys.exit(1)
print("ays brifing kabul: bos, plan, bulgu+ort, ort veri yok, oneri onceligi, ilk madde, saf.")
