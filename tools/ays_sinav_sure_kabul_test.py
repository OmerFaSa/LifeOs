#!/usr/bin/env python3
"""AYS deneme sinavi suresi kabul testi (Claude Code yazdi; Uygulayici degistirmez).
Sahibin 2026-11-01 karari: sinav surerken sekme kapali gecen sure sinav suresine SAYILIR (gercek sinav kosulu).
core/examrun.js sureyi duvar saatinden (startedMs) hesaplar; bu test karari sabitler:
sekme kapanip 10 dk sonra acilinca toplam ve test suresi 10 dk ilerlemis, kalan sure 10 dk azalmis olmali;
yalniz elle basilan Duraklat sureyi durdurur. Node'da kosar (tools/kabul_js.py). python tools/ays_sinav_sure_kabul_test.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kabul_js as J  # noqa: E402

DOSYALAR = ["src/js/core/examrun.js"]
# Bellekte depo: restore() diskten (Store) okur, bellekten degil.
HAZIRLIK = ("const d = {}; R.Store = { get: async k => (k in d ? JSON.parse(d[k]) : null),"
            " set: async (k, v) => { d[k] = JSON.stringify(v); }, remove: async k => { delete d[k]; } };")
IFADE = """(async () => {
  const X = R.ExamRun, g = Date.now, dk = 60 * 1000;
  const T = { id:'t', name:'T', family:'tyt', kind:'full', duration:165, tests:[{ name:'A', q:40 }, { name:'B', q:40 }] };
  X.start(T, { date:'2026-11-12' }); await X.flush();
  X.unutDurum();                                   // sekme kapandi: bellek gitti, disk kaldi
  try {
    Date.now = () => g() + 10 * dk;                // 10 dk sonra sekme yeniden acildi
    const geri = !!(await X.restore());
    const r = { geri, toplam: X.elapsedTotal(), test: X.elapsedTest(), kalan: X.remaining() };
    X.pause(); r.durakladi = X.elapsedTotal();
    Date.now = () => g() + 20 * dk;                // duraklatilmis 10 dk daha
    r.duraklamaSonu = X.elapsedTotal();
    X.cancel(); await X.flush();
    return r;
  } finally { Date.now = g; }
})()"""

r = J.calistir("AYS", DOSYALAR, IFADE, HAZIRLIK)
hata = []
if not r["geri"]:
    hata.append("oturum diskten geri yuklenmedi")
if not 600 <= r["toplam"] < 610:
    hata.append("toplam sure %r sn; kapali gecen 10 dk sayilmali (600 sn)" % r["toplam"])
if not 600 <= r["test"] < 610:
    hata.append("test suresi %r sn; kapali gecen 10 dk sayilmali" % r["test"])
if not 165 * 60 - 610 < r["kalan"] <= 165 * 60 - 600:
    hata.append("kalan sure %r sn; 10 dk azalmali" % r["kalan"])
if r["duraklamaSonu"] - r["durakladi"] > 1:
    hata.append("elle duraklatma sureyi durdurmadi: %r -> %r" % (r["durakladi"], r["duraklamaSonu"]))

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("ays sinav sure kabul: sekme kapali gecen sure sayilir (toplam, test, kalan); elle duraklatma sureyi durdurur.")
