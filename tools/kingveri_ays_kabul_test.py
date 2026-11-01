#!/usr/bin/env python3
"""Gorev 040 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
AYS'nin King verisi (KING-4 §C olaylari, §H saglayicilari): R.KingVeri (src/js/core/kingveri.js).
Olay bicimi belgeler/ekip/KING-OLAY.md; sayiyi modul kodu uretir (AGENTS §1), eksik veri sifir degildir.
Node'da kosar (tools/kabul_js.py). python tools/kingveri_ays_kabul_test.py"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kabul_js as J  # noqa: E402

DOSYALAR = ["src/js/core/utils.js", "src/js/core/state.js", "src/js/core/calc.js", "src/js/core/kingveri.js"]
# Depo bellekte; SIMDI bugun 10:00 (yerel); G(n) = bugunden n gun sonra (ISO).
HAZIRLIK = r"""
const YAZILAN = [];
R.Store = { set: async (y, d) => { YAZILAN.push(y); return true; }, get: async () => null, remove: async () => {} };
const SIMDI = new Date(); SIMDI.setHours(10, 0, 0, 0);
const G = n => R.U.iso(R.U.addDays(SIMDI, n));
const ZAMAN = (n, s, d) => { const x = R.U.addDays(SIMDI, n); x.setHours(s, d, 0, 0); return x.toISOString(); };
R.PLAN = Object.assign({}, R.PLAN || {}, { examTytISO:null });
const BLOK = (id, slot, o) => Object.assign({ id, slot, subject:'Matematik', topic:'Türev', targetMin:75, status:'pending',
  actualMin:null, actualQ:null, correctQ:null, startedAt:null }, o || {});
const GUN = (n, bloklar, ek) => { R.S.days[G(n)] = Object.assign({ date:G(n), blocks:bloklar, freeQ:null }, ek || {}); };
"""
ETIKET = {"ölçüldü", "hesaplandı", "tahmin", "veri yok"}
hata = []


def js(ifade, ek=""):
    try:
        return J.calistir("AYS", DOSYALAR, ifade, HAZIRLIK + ek)
    except J.JSHatasi as e:
        hata.append("JS hatasi: %s" % e)
        return None


def bicim(olaylar, ne):
    """KING-OLAY.md: modul, tur, kimlik (<=80), at (yerel saniyeli), sayilar (<=8, etiketli)."""
    for o in olaylar or []:
        if o.get("modul") != "ays" or not o.get("tur") or not o.get("kimlik") or len(o.get("kimlik")) > 80:
            hata.append("%s: olay bicimi bozuk %r" % (ne, o))
        if not re.match(r"^\d{4}-\d\d-\d\dT10:00:00$", str(o.get("at"))):
            hata.append("%s: at simdinin yerel saati olmali (YYYY-AA-GGT10:00:00): %r" % (ne, o.get("at")))
        s = o.get("sayilar") or {}
        if not s or len(s) > 8 or any(x.get("etiket") not in ETIKET or "deger" not in x for x in s.values()):
            hata.append("%s: sayilar bicimi bozuk %r" % (ne, s))


OLAY = "R.KingVeri.olaylar(SIMDI)"
TUR = lambda l, t: [o for o in (l or []) if o.get("tur") == t]  # noqa: E731

# 1) sinav_yaklasti: sinav 30 gun sonra -> kalan_gun 30; tekrar_gunu: 2 kart bugun/gecmiste vadeli, 1 yarin
r = js("[%s, G(0)]" % OLAY, """R.PLAN.examTytISO = G(30);
R.S.cards = [{ id:'k1', dueAt:G(-2) }, { id:'k2', dueAt:G(0) }, { id:'k3', dueAt:G(1) }];""")
if r:
    l, bugun = r
    bicim(l, "ays")
    s = TUR(l, "sinav_yaklasti")
    if len(s) != 1 or s[0].get("sayilar") != {"kalan_gun": {"deger": 30, "birim": "gün", "etiket": "hesaplandı"}} \
            or s[0].get("kimlik") != "ays.sinav_yaklasti." + bugun:
        hata.append("sinav_yaklasti: tek olay, kalan_gun 30 gün hesaplandı, kimlik ays.sinav_yaklasti.<bugun>: %r" % s)
    t = TUR(l, "tekrar_gunu")
    if len(t) != 1 or t[0].get("sayilar") != {"adet": {"deger": 2, "birim": "kart", "etiket": "hesaplandı"}} \
            or t[0].get("kimlik") != "ays.tekrar_gunu." + bugun:
        hata.append("tekrar_gunu: tek olay, adet 2 kart hesaplandı (R.Calc.dueCards), kimlik ays.tekrar_gunu.<bugun>: %r" % t)

# 2) sinav tarihi yok ya da gecmiste, vadeli kart yok -> iki olay da yok; sinav bugun -> kalan_gun 0
r = js("[%s, (R.PLAN.examTytISO = G(-3), %s), (R.PLAN.examTytISO = G(0), %s)]" % (OLAY, OLAY, OLAY),
       "R.S.cards = [{ id:'k3', dueAt:G(1) }];")
if r:
    if r[0] or r[1]:
        hata.append("sinav tarihi yok/gecmis ve vadeli kart yokken olay olmamali: %r %r" % (r[0], r[1]))
    s = TUR(r[2], "sinav_yaklasti")
    if len(s) != 1 or (s[0].get("sayilar") or {}).get("kalan_gun", {}).get("deger") != 0:
        hata.append("sinav bugunse kalan_gun 0 olmali: %r" % r[2])

# 3) ayni an iki kez -> ayni kimlikler
r = js("[%s, %s].map(l => l.map(o => o.kimlik).sort().join(','))" % (OLAY, OLAY),
       "R.PLAN.examTytISO = G(14); R.S.cards = [{ id:'k1', dueAt:G(0) }];")
if r and (r[0] != r[1] or not r[0]):
    hata.append("olaylar ayni anda ayni kimlikleri vermeli: %r" % r)

# 4) hafta(bitis): bu hafta 2 gun; 75 + 40 dk, 30 + 10 soru (+ 5 serbest), 2 bitmis blok; onceki hafta 60 dk, 20 soru, 1 blok
HAFTA = r"""
GUN(0, [BLOK('b0', 'Ana ders', { status:'done', actualMin:75, actualQ:30 }), BLOK('b1', 'İkinci ders')], { freeQ:5 });
GUN(-4, [BLOK('b0', 'Ana ders', { status:'done', actualMin:40, actualQ:10 })]);
GUN(-8, [BLOK('b0', 'Ana ders', { status:'done', actualMin:60, actualQ:20 })]);
"""
r = js("[R.KingVeri.hafta(G(0)), G(-6), G(0)]", HAFTA)
if r:
    h, bas, bit = r
    if (h or {}).get("bas") != bas or h.get("bit") != bit:
        hata.append("hafta: bas = bitisten 6 gun once, bit = bitis olmali: %r" % h)
    s = {x.get("id"): x for x in (h or {}).get("satirlar") or []}
    bek = {"calisma_dk": (115, "dk", "ölçüldü", 60), "soru": (45, None, "ölçüldü", 20), "blok": (2, None, "ölçüldü", 1)}
    for k, (d, b, e, o) in bek.items():
        x = s.get(k) or {}
        if x.get("deger") != d or x.get("etiket") != e or x.get("onceki") != o or (b and x.get("birim") != b) or not x.get("ad"):
            hata.append("hafta.%s: deger %r birim %r etiket %r onceki %r ve ad bekleniyordu: %r" % (k, d, b, e, o, x))
r = js("R.KingVeri.hafta(G(0)).satirlar.map(x => [x.id, x.deger, x.etiket])", "GUN(0, [BLOK('b0', 'Ana ders')]);")
if r is not None and (not r or any(d is not None or e != "veri yok" for _, d, e in r)):
    hata.append("hic kaydi olmayan haftada her satir {deger null, 'veri yok'} olmali (sifir degil): %r" % r)

# 5) hatirlat: 'Ana ders' blogu gercekte 09:10/09:20/09:40/10:00 basladi (oturumlar[0].bas ya da kayitAt) -> 09:30;
#    'Rutin' iki gun -> veri yok; dun Ana ders yapildi, Rutin isaretlenmedi; kurulu saat yok (AYS bloklari saatsiz)
HAT = r"""
GUN(-1, [BLOK('b0', 'Ana ders', { status:'done', actualMin:70, oturumlar:[{ bas:ZAMAN(-1, 9, 10), dk:70 }] }), BLOK('b2', 'Rutin')]);
GUN(-2, [BLOK('b0', 'Ana ders', { status:'done', actualMin:70, kayitAt:ZAMAN(-2, 9, 40) }),
  BLOK('b2', 'Rutin', { status:'done', actualMin:30, kayitAt:ZAMAN(-2, 20, 0) })]);
GUN(-3, [BLOK('b0', 'Ana ders', { status:'done', actualMin:70, oturumlar:[{ bas:ZAMAN(-3, 9, 20), dk:30 }, { bas:ZAMAN(-3, 11, 0), dk:40 }] }),
  BLOK('b2', 'Rutin', { status:'done', actualMin:30, kayitAt:ZAMAN(-3, 21, 0) })]);
GUN(-5, [BLOK('b0', 'Ana ders', { status:'done', actualMin:70, kayitAt:ZAMAN(-5, 10, 0) })]);
GUN(-20, [BLOK('b0', 'Ana ders', { status:'done', actualMin:70, kayitAt:ZAMAN(-20, 23, 0) })]);
"""
r = js("R.KingVeri.hatirlat(SIMDI)", HAT)
if r is not None:
    s = {x.get("ad"): x for x in r}
    a, b = s.get("Ana ders") or {}, s.get("Rutin") or {}
    if (a.get("kurulu"), a.get("gercek"), a.get("n"), a.get("etiket"), a.get("dun")) != (None, "09:30", 4, "hesaplandı", "yapildi"):
        hata.append("hatirlat Ana ders: kurulu null, gercek 09:30 (son 14 gun ortancasi), n 4, 'hesaplandı', dun 'yapildi': %r" % a)
    if (b.get("gercek"), b.get("n"), b.get("etiket"), b.get("dun")) != (None, 2, "veri yok", "isaretlenmedi"):
        hata.append("hatirlat Rutin: 3'ten az kayit -> gercek null 'veri yok', dun 'isaretlenmedi': %r" % b)
    if len({x.get("anahtar") for x in r}) != len(r) or not all(x.get("anahtar") for x in r):
        hata.append("hatirlat satirlarinin anahtari ayri ve dolu olmali: %r" % r)

# 6) sonKayit / duzelt: en son kaydedilen blok (dk ve soru alani); dk 1..600, soru 0..1000; geri al eski degeri koyar
SON = r"""
GUN(-1, [BLOK('b0', 'Ana ders', { status:'done', actualMin:60, actualQ:25, kayitAt:ZAMAN(-1, 20, 0) })]);
GUN(0, [BLOK('b0', 'Ana ders', { status:'done', actualMin:45, actualQ:null, kayitAt:ZAMAN(0, 9, 30) }), BLOK('b1', 'İkinci ders')]);
"""
r = js("""(async () => { const s = R.KingVeri.sonKayit();
  const k = [await R.KingVeri.duzelt(s.id, 'dk', 0), await R.KingVeri.duzelt(s.id, 'dk', 700), await R.KingVeri.duzelt(s.id, 'soru', -1),
    await R.KingVeri.duzelt('yok', 'dk', 30), await R.KingVeri.duzelt(s.id, 'kalori', 30)].map(x => !!(x && x.ok));
  const d = await R.KingVeri.duzelt(s.id, 'dk', 30);
  const sonra = R.S.days[G(0)].blocks[0].actualMin, yaz = YAZILAN.slice();
  await d.geriAl();
  return [s, G(0), k, { ok:d.ok, once:d.once, sonra:d.sonra }, sonra, yaz, R.S.days[G(0)].blocks[0].actualMin]; })()""", SON)
if r:
    s, bugun, kotu, d, sonra, yaz, geri = r
    if not s or s.get("gun") != bugun or s.get("tur") != "blok" or not s.get("id") or not s.get("ad") \
            or (s.get("alanlar") or [None])[0] != {"ad": "dk", "deger": 45, "birim": "dk"}:
        hata.append("sonKayit en son kaydedilen blogu vermeli (gun bugun, tur 'blok', ilk alan dk 45): %r" % s)
    if any(kotu):
        hata.append("duzelt 0 dk, 700 dk, -1 soru, olmayan kayit ve bilinmeyen alani reddetmeli: %r" % kotu)
    if d != {"ok": True, "once": 45, "sonra": 30} or sonra != 30 or ("days/" + bugun) not in yaz or geri != 45:
        hata.append("duzelt dk 30: {ok, once 45, sonra 30}, depoya days/<bugun>, geriAl 45: %r %r %r %r" % (d, sonra, yaz, geri))
r = js("R.KingVeri.sonKayit()")
if r is not None:
    hata.append("kaydi olmayan profilde sonKayit null olmali: %r" % r)

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("ays king verisi kabul: sinav_yaklasti, tekrar_gunu, kimlik, hafta, hatirlat, sonKayit/duzelt.")
