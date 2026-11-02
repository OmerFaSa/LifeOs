#!/usr/bin/env python3
"""Gorev 071 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
ESP'nin ogretme motoru adaptoru: ESP.KingOgret (src/js/core/kingogret.js) kelime sorusunu, cevabi,
teshisi ve King araclarini brand/ortak/ogret.js (LIFEOS.OGRET) ile yapar (KING-4 §D). Kartin kendi
SRS takvimi (core/srs.js) DEGISMEZ; motorun 1/3/7 takvimi ayri anahtarda. Node'da kosar (tools/kabul_js.py).
python tools/ogret_esp_kabul_test.py"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kabul_js as J  # noqa: E402

KOK = Path(__file__).resolve().parent.parent
DOSYALAR = ["src/js/core/utils.js", "src/js/core/ogret.js", "src/js/core/kingogret.js"]
HAZIRLIK = r"""
ESP.S = ESP.S || {};
ESP.S.cards = [
  { id:'c1', front:'apple', back:'elma', lang:'en', box:1, reps:0 },
  { id:'c2', front:'house', back:'ev', lang:'en', box:4, reps:6 },
  { id:'c3', front:'water', back:'su', lang:'en', box:2, reps:2 },
  { id:'c4', front:'book', back:'kitap', lang:'en', box:2, reps:1 },
  { id:'c5', front:'', back:'boş', lang:'en' },
];
const K = () => ESP.KingOgret, KOPYA = JSON.stringify(ESP.S.cards);
const T = () => JSON.parse(localStorage.getItem('esp.ogret.tekrar') || '{}');
const HARF = q => q.id.split('|').pop(), SEC = (q, h) => q.sec['ABCD'.indexOf(h)];
const YANLIS = q => 'ABCD'.split('').find(h => h !== HARF(q));
"""
hata = []


def js(ifade, ek=""):
    try:
        return J.calistir("ESP", DOSYALAR, ifade, HAZIRLIK + ek)
    except J.JSHatasi as e:
        hata.append("JS hatasi: %s" % e)
        return None


# 1) soru: kartin on yuzu, 4 secenek (arka yuzler), dogru bir kez; az kartta null
r = js("const q = K().soru(''); [q, q && SEC(q, HARF(q)), q && ESP.S.cards.find(c => c.id === q.id.split('|')[0])]")
if r:
    q, dogruMetin, kart = r
    if not q or len(q.get("sec") or []) != 4 or len(set(q["sec"])) != 4 or not kart:
        hata.append("soru(''): 4 farkli secenek, id '<kart>|<harf>': %r" % (q,))
    else:
        if dogruMetin != kart["back"] or q["soru"] != "«%s» ne demek?" % kart["front"]:
            hata.append("soru: metin '«on» ne demek?', dogru harf kartin arka yuzu: %r" % (q,))
        if "boş" in q["sec"]:
            hata.append("on ya da arka yuzu bos kart soru/secenek olmamali")
        if q.get("konu") != "Kelime kartı" or "ESP" not in q.get("kaynak", ""):
            hata.append("konu 'Kelime kartı', kaynak ESP: %r" % (q,))
r = js("ESP.S.cards = ESP.S.cards.slice(0, 3); [K().soru('')]")
if r and r[0] is not None:
    hata.append("uygun kart 4'ten azsa soru null olmali")

# 2) konu: on ya da arka yuzle eslesen kart; eslesmeyen konu bugunku gibi yok sayilir
r = js("[K().soru('house').id.split('|')[0], K().soru('elma').id.split('|')[0], !!K().soru('kelime')]")
if r and r != ["c2", "c1", True]:
    hata.append("soru('house')->c2, soru('elma')->c1, eslesmeyen konu yine soru getirir: %r" % (r,))

# 3) cevapla: yanlista motorun takvimi + teshis; kartin SRS'i degismez
r = js(r"""(() => {
  const q = K().soru('apple'), a = K().cevapla(q.id, YANLIS(q));
  return [a, HARF(q), T().c1, JSON.parse(localStorage.getItem('esp.ogret.son') || 'null'), JSON.stringify(ESP.S.cards) === KOPYA];
})()""")
if r:
    a, d, t, son, ayni = r
    if not a or a.get("dogru") != d or not str(a.get("not", "")).startswith("Yarın bu konudan benzer bir soru soracağım."):
        hata.append("yanlis: dogru harf ve motorun notu: %r" % (a,))
    if not a or not any("henüz bilmiyordun" in x for x in a.get("cozum") or []):
        hata.append("hic tekrar edilmemis kartta (reps 0) teshis 'henüz bilmiyordun' satiri cozumde olmali: %r" % ((a or {}).get("cozum"),))
    if not t or t.get("n") != 0 or t.get("y") != 1:
        hata.append("esp.ogret.tekrar['c1'] = { n:0, y:1, … }: %r" % (t,))
    if not son or son.get("kavram") != "c1" or not son.get("secMetin") or son.get("dogruMetin") != "elma":
        hata.append("esp.ogret.son kart, secilen metin ve dogru metinle yazilmali: %r" % (son,))
    if ayni is not True:
        hata.append("cevap kartin kendisini (box, reps, due) degistirmemeli")
r = js("const q = K().soru('house'); K().cevapla(q.id, YANLIS(q)).cozum.filter(x => /^Teşhis/.test(x))")
if r is not None and (len(r) != 1 or "dikkat" not in r[0]):
    hata.append("«Yerleşti» kutusundaki (box>=3) kartta yanlis -> dikkat teshisi: %r" % (r,))
r = js("const q = K().soru('house'); [K().cevapla(q.id, HARF(q)).not, T().c2]")
if r and (r[1] is not None or "takvimine yazılmaz" not in (r[0] or "")):
    hata.append("takvimde olmayan kartta dogru: takvim acilmaz, not kartin takvimine yazilmadigini soyler: %r" % (r,))
r = js("[K().cevapla('yok|B', 'A')]")
if r and (not r[0] or r[0].get("dogru") != "B"):
    hata.append("bilinmeyen kartta cevapla eskisi gibi { dogru:<id son harfi> } donmeli: %r" % (r,))

# 4) konusuz soru: vadesi gelen kart once, not «Tekrar (N. tur)»
r = js("localStorage.setItem('esp.ogret.tekrar', JSON.stringify({ c3:{ n:2, sonraki:'2000-01-01' } })); const q = K().soru(''); [q.id.split('|')[0], q.not]")
if r and (r[0] != "c3" or not re.match(r"^Tekrar \(3\. tur\)", r[1] or "")):
    hata.append("vadesi gelen kart 'Tekrar (3. tur)' notuyla once gelmeli: %r" % (r,))

# 5) araclar
r = js("localStorage.setItem('esp.ogret.tekrar', JSON.stringify({ c2:{ n:0, sonraki:'2000-01-01' } })); const l = K().araclar(); [l.map(a => [a.ad, a.tur]), l[0].calistir({}).satirlar]")
if r:
    if r[0] != [["esp_tekrarlarim", "oku"], ["esp_yanlis_teshis", "oku"]]:
        hata.append("araclar(): esp_tekrarlarim ve esp_yanlis_teshis (oku): %r" % (r[0],))
    if r[1] != ["house · 1. tekrar"]:
        hata.append("esp_tekrarlarim satiri kartin on yuzunu vermeli: %r" % (r[1],))

# 6) baglanti: app.js'teki eski satir ici soru/cevapla kalkar, motor cagrilir
app = (KOK / "ESP/src/js/app.js").read_text(encoding="utf-8")
arac = (KOK / "ESP/src/js/core/kingarac.js").read_text(encoding="utf-8")
ko = (KOK / "ESP/src/js/core/kingogret.js").read_text(encoding="utf-8")
if not re.search(r"soru:\s*\(?\w*\)?\s*=>\s*ESP\.KingOgret\.soru\(", app) or not re.search(r"cevapla:\s*\(\w+,\s*\w+\)\s*=>\s*ESP\.KingOgret\.cevapla\(", app):
    hata.append("app.js kartlar.soru ve kartlar.cevapla ESP.KingOgret'e baglanmali")
if "sort(() => Math.random() - 0.5)" in app:
    hata.append("app.js'teki satir ici celdirici kopyasi kalkmali (motorun secenek'i)")
if "KingOgret.araclar" not in arac:
    hata.append("kingarac.js liste() ESP.KingOgret.araclar()'i eklemeli")
if "OGRET.secenek" not in ko or "OGRET.cevap" not in ko or "OGRET.vade" not in ko:
    hata.append("kingogret.js secenek, vade ve cevap icin motoru (OGRET.*) kullanmali")

if hata:
    print("ogret esp kabul: %d hata" % len(hata))
    for h in hata:
        print(" -", h)
    sys.exit(1)
print("ogret esp kabul: soru, konu, cevapla (teshis, SRS degismez), vade, araclar, baglanti.")
