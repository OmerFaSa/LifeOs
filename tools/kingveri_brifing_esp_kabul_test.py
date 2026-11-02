#!/usr/bin/env python3
"""Gorev 062 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
ESP sabah brifingi verisi (KING-4 §H «60 sn sabah brifingi»): ESP.KingVeri.brifing(simdi).
Sayiyi modul kodu uretir, cumleyi King'in modeli kurar (AGENTS §1); eksik veri sifir degildir.
Node'da kosar (tools/kabul_js.py). python tools/kingveri_brifing_esp_kabul_test.py"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kabul_js as J  # noqa: E402

DOSYALAR = ["src/js/data/rules.js", "src/js/core/utils.js", "src/js/core/memo.js", "src/js/core/state.js", "src/js/core/srs.js", "src/js/core/kingveri.js"]
HAZIRLIK = r"""
const YAZILAN = [];
ESP.Store = { set: async (y, d) => { YAZILAN.push(y); return true; }, get: async () => null, remove: async () => {} };
const SIMDI = new Date(); SIMDI.setHours(7, 30, 0, 0);
const G = n => ESP.U.iso(ESP.U.addDays(SIMDI, n));
const OTURUM = (n, id, dk, ek) => { const g = G(n);
  ESP.S.days[g] = ESP.S.days[g] || { date:g, sessions:[], note:'' };
  ESP.S.days[g].sessions.push(Object.assign({ id, disc:'dil', minutes:dk, minutesCert:'measured', count:null, countCert:'missing',
    at:new Date().toISOString() }, ek || {})); };
ESP.S.cards.length = 0;
"""
hata = []


def js(ifade, ek=""):
    try:
        return J.calistir("ESP", DOSYALAR, ifade, HAZIRLIK + ek)
    except J.JSHatasi as e:
        hata.append("JS hatasi: %s" % e)
        return None


def esit(ne, gelen, beklenen):
    if gelen != beklenen:
        hata.append("%s: beklenen %s, gelen %s" % (ne, json.dumps(beklenen, ensure_ascii=False),
                                                   json.dumps(gelen, ensure_ascii=False)))


B = "ESP.KingVeri.brifing(SIMDI)"

# 1) bos depo: plan bos, bulgu ve oneri null; gun = bugun; saf (yazmaz), iki cagri ayni
r = js("[%s, %s, G(0), YAZILAN.length]" % (B, B))
if r:
    esit("bos brifing", r[0], {"gun": r[2], "plan": [], "bulgu": None, "oneri": None})
    esit("iki cagri ayni", r[1], r[0])
    esit("brifing yazmaz", r[3], 0)

# 2) plan: ESP'nin gunluk plani yok -> her zaman bos (uydurma yok)
r = js(B + ".plan", "OTURUM(0, 'o1', 30);")
esit("plan", r, [])

# 3) bulgu: dun 30 + 20 dk olculdu (null sayilmaz); onceki 7 gunde (G(-8)..G(-2)) 3 gun 40, 20, 30 -> ort 30
r = js(B + ".bulgu", """OTURUM(-1, 'a', 30); OTURUM(-1, 'b', 20); OTURUM(-1, 'c', null);
  OTURUM(-2, 'x', 40); OTURUM(-5, 'y', 20); OTURUM(-8, 'z', 30); OTURUM(-9, 'w', 300);""")
esit("bulgu", r, {"id": "calisma_dk", "ad": "Çalışma", "deger": 50, "birim": "dk", "etiket": "ölçüldü",
                  "ort": {"deger": 30, "etiket": "hesaplandı"}})

# 4) tahmin dakika varsa etiket tahmin; ort 2 gun -> veri yok; dun yok -> null
r = js(B + ".bulgu", "OTURUM(-1, 'a', 30); OTURUM(-1, 'b', 15, {minutesCert:'estimated'}); OTURUM(-3, 'x', 40); OTURUM(-4, 'y', 20);")
r = r or {}
esit("tahmin etiket", [r.get("deger"), r.get("etiket"), r.get("ort")], [45, "tahmin", {"deger": None, "etiket": "veri yok"}])
r = js(B + ".bulgu", "OTURUM(-2, 'x', 40);")
esit("dun yok", r, None)

# 5) oneri: tekrar_gunu olayi (vadeli kart); sayilar olayinkiyle ayni
r = js("[" + B + ".oneri, ESP.KingVeri.olaylar(SIMDI)]", "ESP.S.cards.push(ESP.SRS.newCard ? Object.assign(ESP.SRS.newCard({ front:'a', back:'b' }), { due:G(-1) }) : { id:'k1', front:'a', back:'b', due:G(-1) });")
if r:
    s = [o for o in r[1] if o.get("tur") == "tekrar_gunu"]
    if not s:
        hata.append("hazirlik: vadeli kart olayi uretilmedi")
    esit("oneri tekrar", r[0], {"id": "tekrar_gunu", "sayilar": s[0]["sayilar"] if s else None})

if hata:
    print("esp brifing kabul KIRMIZI:")
    for h in hata:
        print(" -", h)
    sys.exit(1)
print("esp brifing kabul: bos, plan, bulgu+ort, ort veri yok, oneri onceligi, ilk madde, saf.")
