#!/usr/bin/env python3
"""Gorev 070 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
SPI'nin ogretme motoru adaptoru: SP.KingDers (src/js/core/kingders.js) ders, soru, cevapla ve
King araclarini brand/ortak/ogret.js (LIFEOS.OGRET) ile yapar (KING-4 §D). Metin kavramin kendisidir;
soru, secenek ve dogru cevap koddan (AGENTS §1). Node'da kosar (tools/kabul_js.py).
python tools/ogret_spi_kabul_test.py"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kabul_js as J  # noqa: E402

KOK = Path(__file__).resolve().parent.parent
DOSYALAR = ["src/js/core/utils.js", "src/js/core/ogret.js", "src/js/data/ogrenme.js", "src/js/core/kingders.js"]
HAZIRLIK = r"""
const K = () => SP.KingDers, O = window.LIFEOS.OGRET;
const SET = SP.OGRENME_KAVRAMLAR.find(x => x.id === 'concept-set');
const T = () => JSON.parse(localStorage.getItem('spi.ogret.tekrar') || '{}');
const BUGUN = SP.U.todayISO();
"""
hata = []


def js(ifade, ek=""):
    try:
        return J.calistir("SPI", DOSYALAR, ifade, HAZIRLIK + ek)
    except J.JSHatasi as e:
        hata.append("JS hatasi: %s" % e)
        return None


# 1) ders: cikti ayni, eslestirme motorda; soru artik var
r = js("[K().ders('set'), K().ders('kuantum alan kuramı'), K().ders(''), [SET.definition, SET.watch, SET.example]]")
if r:
    d, yok, bos, metin = r
    if not d or d.get("baslik") != "Set" or [b.get("metin") for b in d.get("bolumler", [])] != metin:
        hata.append("ders('set') eski ciktiyi vermeli: %r" % (d,))
    if d and d.get("soruVar") is not True:
        hata.append("ders: kavramdan soru sorulabildigi icin soruVar true olmali")
    if yok is not None or bos is not None:
        hata.append("kavrami olmayan/bos metinde ders null olmali")

# 2) soru(konu): tanim -> kavram; 4 secenek, dogru bir kez, harf dogru
r = js("const q = K().soru('set'); [q, q && q.sec[q.id.split('|').pop().charCodeAt(0) - 65], K().soru('kuantum alan kuramı')]")
if r:
    q, dogruMetin, yok = r
    if not q or not str(q.get("id", "")).startswith("concept-set|") or len(q.get("sec") or []) != 4:
        hata.append("soru('set'): id 'concept-set|<harf>', 4 secenek: %r" % (q,))
    else:
        if dogruMetin != "Set" or q["sec"].count("Set") != 1:
            hata.append("soru: dogru harfin secenegi 'Set' olmali ve bir kez gecmeli: %r" % (q["sec"],))
        if len(set(q["sec"])) != 4:
            hata.append("soru: secenekler farkli olmali")
        if not q.get("soru") or (q["soru"].find(r"«") < 0):
            hata.append("soru metni kavramin tanimini «» icinde vermeli: %r" % q.get("soru"))
        if "SPİ" not in q.get("kaynak", ""):
            hata.append("kaynak SPİ kavrami oldugunu soylemeli: %r" % q.get("kaynak"))
    if yok is not None:
        hata.append("kavrami olmayan konuda soru null olmali")
r = js("[K().soru('set').soru.indexOf(SET.definition.slice(0, 40)) >= 0]")
if r and r[0] is not True:
    hata.append("soru metni kavramin tanimini (data/ogrenme.js) aynen icermeli")

# 3) cevapla: yanlista motorun 1/3/7 takvimi, son yanlis; dogruda 3 gun
r = js(r"""(() => {
  const q = K().soru('set'), d = q.id.split('|').pop(), y = 'ABCD'.split('').find(h => h !== d);
  const a = K().cevapla(q.id, y);
  return Promise.resolve(a).then(a => {
    const t1 = T()['concept-set'], son = JSON.parse(localStorage.getItem('spi.ogret.son') || 'null');
    return Promise.resolve(K().cevapla(q.id, d)).then(b => [a, t1, son, b, T()['concept-set'], d]);
  });
})()""")
if r:
    a, t1, son, b, t2, d = r
    if not a or a.get("dogru") != d or a.get("not") != "Yarın bu konudan benzer bir soru soracağım.":
        hata.append("yanlis cevap: { dogru, not:'Yarın bu konudan benzer…' }: %r" % (a,))
    if not a or not any(str(x).startswith("Tanım: ") for x in (a.get("cozum") or [])):
        hata.append("yanlis cevap cozumu kavramin tanimini 'Tanım: …' satiriyla vermeli: %r" % ((a or {}).get("cozum"),))
    if not t1 or t1.get("n") != 0 or t1.get("y") != 1:
        hata.append("yanlis: spi.ogret.tekrar['concept-set'] = { n:0, y:1, … }: %r" % (t1,))
    if not son or son.get("kavram") != "concept-set" or not son.get("secMetin"):
        hata.append("yanlis: spi.ogret.son kavram ve secilen secenegin metni (secMetin) ile yazilmali: %r" % (son,))
    if not b or b.get("not") != "3 gün sonra bir kez daha soracağım." or (t2 or {}).get("n") != 1:
        hata.append("tekrarda dogru: 3 gun, n=1: %r %r" % (b, t2))
r = js("[K().cevapla('yok|A', 'A'), K().cevapla('', 'A')]")
if r and any(x is not None for x in r):
    hata.append("bilinmeyen kimlikte cevapla null donmeli: %r" % (r,))

# 4) konusuz soru: vadesi gelen kavram once, not «Tekrar (N. tur)»; yoksa hic sorulmamis kavram
r = js("localStorage.setItem('spi.ogret.tekrar', JSON.stringify({ 'concept-set':{ n:1, sonraki:'2000-01-01' } })); const q = K().soru(''); [q.id.split('|')[0], q.not]")
if r and (r[0] != "concept-set" or not re.match(r"^Tekrar \(2\. tur\)", r[1] or "")):
    hata.append("konusuz soru vadesi gelen kavrami 'Tekrar (2. tur)' notuyla getirmeli: %r" % (r,))
r = js("const ilk = SP.OGRENME_KAVRAMLAR.find(c => c.title && c.definition); localStorage.setItem('spi.ogret.tekrar', JSON.stringify({ [ilk.id]:{ n:3, bitti:'2000-01-01' } })); [K().soru('').id.split('|')[0] !== ilk.id, K().soru('').not]")
if r and (r[0] is not True or r[1] != ""):
    hata.append("vadesi gelen yokken takvimde olmayan (sorulmamis) kavram gelmeli, not bos: %r" % (r,))

# 5) araclar: motorun iki okuma araci; tekrar araci kavramin adini verir
r = js("localStorage.setItem('spi.ogret.tekrar', JSON.stringify({ 'concept-set':{ n:0, sonraki:'2000-01-01' } })); const l = K().araclar(); [l.map(a => [a.ad, a.tur]), l[0].calistir({}).satirlar]")
if r:
    if r[0] != [["spi_tekrarlarim", "oku"], ["spi_yanlis_teshis", "oku"]]:
        hata.append("araclar(): spi_tekrarlarim ve spi_yanlis_teshis (oku): %r" % (r[0],))
    if r[1] != ["Set · 1. tekrar"]:
        hata.append("spi_tekrarlarim satiri kavramin adini vermeli: %r" % (r[1],))

# 6) baglanti: King'in kartlari ve arac kaydi motoru cagirir
app = (KOK / "SPI/src/js/app.js").read_text(encoding="utf-8")
arac = (KOK / "SPI/src/js/core/kingarac.js").read_text(encoding="utf-8")
if not re.search(r"soru:\s*\w*\s*=>\s*SP\.KingDers\.soru\(", app) or not re.search(r"cevapla:\s*\(\w+,\s*\w+\)\s*=>\s*SP\.KingDers\.cevapla\(", app):
    hata.append("app.js kartlar.soru ve kartlar.cevapla SP.KingDers'e baglanmali")
if "KingDers.araclar" not in arac:
    hata.append("kingarac.js liste() SP.KingDers.araclar()'i eklemeli")
kd = (KOK / "SPI/src/js/core/kingders.js").read_text(encoding="utf-8")
if "OGRET.bul" not in kd or "OGRET.cevap" not in kd or "OGRET.secenek" not in kd or re.search(r"\[1,\s*3,\s*7\]", kd):
    hata.append("kingders.js eslestirme, secenek ve takvim icin motoru (OGRET.bul/secenek/cevap) kullanmali; kendi 1/3/7'si olmamali")

if hata:
    print("ogret spi kabul: %d hata" % len(hata))
    for h in hata:
        print(" -", h)
    sys.exit(1)
print("ogret spi kabul: ders, soru, cevapla (1/3/7), vade, araclar, baglanti.")
