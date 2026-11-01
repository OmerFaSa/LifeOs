#!/usr/bin/env python3
"""Gorev 041 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
SPI'nin King verisi (KING-4 §C olaylari, §H saglayicilari): SP.KingVeri (src/js/core/kingveri.js).
Olay bicimi belgeler/ekip/KING-OLAY.md; sayiyi modul kodu uretir (AGENTS §1), eksik veri sifir degildir.
Node'da kosar (tools/kabul_js.py). python tools/kingveri_spi_kabul_test.py"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kabul_js as J  # noqa: E402

DOSYALAR = ["src/js/core/utils.js", "src/js/core/state.js", "src/js/core/haftaplan.js",
            "src/js/core/hatirlat.js", "src/js/core/kingveri.js"]
# Depo bellekte; SIMDI bugun 10:00 (yerel); G(n) = bugunden n gun sonra (ISO).
HAZIRLIK = r"""
const YAZILAN = [];
SP.Store = { set: async (y, d) => { YAZILAN.push(y); return true; }, get: async () => null, remove: async () => {} };
const SIMDI = new Date(); SIMDI.setHours(10, 0, 0, 0);
const G = n => SP.U.iso(SP.U.addDays(SIMDI, n));
const ZAMAN = (n, s, d) => { const x = SP.U.addDays(SIMDI, n); x.setHours(s, d, 0, 0); return x.toISOString(); };
const UYKU = (bas, bit, saat) => { for(let i = bas; i <= bit; i++) SP.S.vitals[G(i)] = { date:G(i), sleep:saat }; };
SP.HaftaPlan = { liste: () => [], bugunMaddeleri: () => [], sayim: () => ({ tamam:false, n:0, hedef:1 }),
  zamanAn: () => 24 * 60, zamanYaz: () => '' };
"""
ETIKET = {"ölçüldü", "hesaplandı", "tahmin", "veri yok"}
hata = []


def js(ifade, ek=""):
    try:
        return J.calistir("SPI", DOSYALAR, ifade, HAZIRLIK + ek)
    except J.JSHatasi as e:
        hata.append("JS hatasi: %s" % e)
        return None


def bicim(olaylar, ne):
    """KING-OLAY.md: modul, tur, kimlik (<=80), at (yerel saniyeli), sayilar (<=8, etiketli)."""
    for o in olaylar or []:
        if o.get("modul") != "spi" or not o.get("tur") or len(o.get("kimlik") or "") > 80 or not o.get("kimlik"):
            hata.append("%s: olay bicimi bozuk %r" % (ne, o))
        if not re.match(r"^\d{4}-\d\d-\d\dT10:00:00$", str(o.get("at"))):
            hata.append("%s: at simdinin yerel saati olmali (YYYY-AA-GGT10:00:00): %r" % (ne, o.get("at")))
        s = o.get("sayilar") or {}
        if not s or len(s) > 8 or any(x.get("etiket") not in ETIKET or ("deger" not in x) for x in s.values()):
            hata.append("%s: sayilar bicimi bozuk %r" % (ne, s))
        if any(x.get("etiket") == "veri yok" and x.get("deger") is not None for x in s.values()):
            hata.append("%s: 'veri yok' sayinin degeri null olmali %r" % (ne, s))


OLAY = "SP.KingVeri.olaylar(SIMDI)"
TUR = lambda l, t: [o for o in (l or []) if o.get("tur") == t]  # noqa: E731

# 1) uyku_dustu: son 7 gece 5,5; ondan onceki 21 gece 7,5 -> ort7 5,5, ort28 7,0
r = js("[%s, G(0)]" % OLAY, "UYKU(-27, -7, 7.5); UYKU(-6, 0, 5.5);")
if r:
    l, bugun = r
    bicim(l, "uyku")
    u = TUR(l, "uyku_dustu")
    bek = {"ort7": {"deger": 5.5, "birim": "saat", "etiket": "hesaplandı"},
           "ort28": {"deger": 7.0, "birim": "saat", "etiket": "hesaplandı"}}
    if len(u) != 1 or u[0].get("sayilar") != bek or u[0].get("kimlik") != "spi.uyku_dustu." + bugun:
        hata.append("uyku_dustu: tek olay, sayilar %r, kimlik spi.uyku_dustu.<bugun> bekleniyordu: %r" % (bek, u))

# 2) dusus yok (28 gece 7) -> olay yok; ort7 < 6 (28 gece 5,8) -> olay var
r = js("[%s, (SP.S.vitals = {}, UYKU(-27, 0, 5.8), %s)]" % (OLAY, OLAY), "UYKU(-27, 0, 7);")
if r:
    if TUR(r[0], "uyku_dustu"):
        hata.append("uyku dusmediyse uyku_dustu olmamali: %r" % r[0])
    u = TUR(r[1], "uyku_dustu")
    if len(u) != 1 or (u[0].get("sayilar") or {}).get("ort7", {}).get("deger") != 5.8:
        hata.append("ort7 < 6 ise uyku_dustu olmali (ort7 5,8): %r" % r[1])

# 3) yetersiz veri: son 7 gunde 3 gece -> olay yok; yalniz 7 gece 5,0 -> ort28 'veri yok' (null)
r = js("[%s, (SP.S.vitals = {}, UYKU(-6, 0, 5), %s)]" % (OLAY, OLAY), "UYKU(-2, 0, 4); UYKU(-27, -10, 8);")
if r:
    if TUR(r[0], "uyku_dustu"):
        hata.append("son 7 gunde 4 geceden az kayit varsa uyku_dustu olmamali: %r" % r[0])
    u = TUR(r[1], "uyku_dustu")
    if len(u) != 1 or (u[0].get("sayilar") or {}).get("ort28") != {"deger": None, "birim": "saat", "etiket": "veri yok"}:
        hata.append("28 gunde 14 geceden az kayit: ort28 {deger null, 'veri yok'} ile olay olmali: %r" % r[1])
    bicim(r[1], "uyku veri yok")

# 4) plan_kacti: saat 10:00; 08:30 ve 07:30 kacti (90, 150 dk), 09:45 (15 dk) degil, tamam, dilim ve zamansiz degil
PLAN = r"""
SP.HaftaPlan = { liste: () => [{ id:'p1', maddeler:[1] }],
  bugunMaddeleri: (p, iso) => iso === G(0) ? [{ id:'m1', metin:'Sabah yürüyüşü', zaman:'08:30' }, { id:'m2', metin:'Esneme', zaman:'09:45' },
    { id:'m3', metin:'Su', zaman:'07:00' }, { id:'m4', metin:'Akşam', zaman:'aksam' }, { id:'m5', metin:'Zamansız', zaman:null },
    { id:'m6', metin:'Vitamin', zaman:'07:30' }] : [],
  sayim: (p, m) => ({ tamam:m.id === 'm3', n:0, hedef:1 }),
  zamanAn: z => /^\d\d:\d\d$/.test(z || '') ? Number(z.slice(0, 2)) * 60 + Number(z.slice(3)) : z === 'aksam' ? 18 * 60 : 24 * 60,
  zamanYaz: z => /^\d\d:\d\d$/.test(z || '') ? z : z === 'aksam' ? 'Akşam' : '' };
"""
r = js("[%s, G(0)]" % OLAY, PLAN)
if r:
    l, bugun = r
    bicim(l, "plan")
    p = sorted(TUR(l, "plan_kacti"), key=lambda o: o.get("konu") or "")
    if [(o.get("konu"), (o.get("sayilar") or {}).get("gecikme_dk")) for o in p] != [
            ("Sabah yürüyüşü", {"deger": 90, "birim": "dk", "etiket": "hesaplandı"}),
            ("Vitamin", {"deger": 150, "birim": "dk", "etiket": "hesaplandı"})]:
        hata.append("plan_kacti: yalniz saatli, tamamlanmamis, >= 30 dk gecikmis maddeler (Sabah yürüyüşü 90, Vitamin 150): %r" % p)
    k = [o.get("kimlik") or "" for o in p]
    if len(set(k)) != len(k) or not all(x.startswith("spi.plan_kacti." + bugun) for x in k):
        hata.append("plan_kacti kimlikleri ayri ve spi.plan_kacti.<bugun> ile baslamali: %r" % k)

# 5) ayni an iki kez -> ayni kimlikler (HKM tekrari tek sayar)
r = js("[%s, %s].map(l => l.map(o => o.kimlik).sort().join(','))" % (OLAY, OLAY), PLAN + "UYKU(-27, 0, 5);")
if r and (r[0] != r[1] or not r[0]):
    hata.append("olaylar ayni anda ayni kimlikleri vermeli: %r" % r)

# 6) hafta(bitis): bu hafta uyku 6 gece 7 sa, 2 antrenman (45 + 30 dk), 3 ogun; onceki hafta uyku 6 sa, 1 antrenman 60 dk
HAFTA = r"""
UYKU(-6, 0, 7); delete SP.S.vitals[G(-3)]; UYKU(-13, -7, 6);
SP.S.workouts = [{ id:'a', date:G(-1), minutes:45, items:[] }, { id:'b', date:G(-5), minutes:30, items:[] },
  { id:'c', date:G(-9), minutes:60, items:[] }];
SP.S.meals[G(0)] = [{ id:'x', slot:'kahvalti', items:[] }, { id:'y', slot:'ogle', items:[] }];
SP.S.meals[G(-2)] = [{ id:'z', slot:'aksam', items:[] }];
"""
r = js("[SP.KingVeri.hafta(G(0)), G(-6), G(0)]", HAFTA)
if r:
    h, bas, bit = r
    if (h or {}).get("bas") != bas or h.get("bit") != bit:
        hata.append("hafta: bas = bitisten 6 gun once, bit = bitis olmali: %r" % h)
    s = {x.get("id"): x for x in (h or {}).get("satirlar") or []}
    bek = {"uyku": (7, "saat", "hesaplandı", 6), "antrenman": (2, None, "ölçüldü", 1),
           "hareket_dk": (75, "dk", "ölçüldü", 60), "ogun": (3, None, "ölçüldü", None)}
    for k, (d, b, e, o) in bek.items():
        x = s.get(k) or {}
        if x.get("deger") != d or x.get("etiket") != e or x.get("onceki") != o or (b and x.get("birim") != b) or not x.get("ad"):
            hata.append("hafta.%s: deger %r birim %r etiket %r onceki %r ve ad bekleniyordu: %r" % (k, d, b, e, o, x))
    if (s.get("uyku") or {}).get("gun") != 6:
        hata.append("hafta.uyku.gun kayitli gece sayisi (6) olmali: %r" % s.get("uyku"))
r = js("SP.KingVeri.hafta(G(0)).satirlar.map(x => [x.id, x.deger, x.etiket])")
if r is not None and (not r or any(d is not None or e != "veri yok" for _, d, e in r)):
    hata.append("kaydi olmayan haftada her satir {deger null, 'veri yok'} olmali (sifir degil): %r" % r)

# 7) hatirlat: su 08:00 dort gun 08:30/08:40/08:50/09:10 isaretlendi -> gercek 08:45 (ortanca), dun yapildi;
#    ilac 21:00 iki gun -> gercek null 'veri yok', ad ilac adini tasimaz; 20 gun onceki isaret sayilmaz
HAT = r"""
SP.Meds = { activeOn: () => true, kindOf: () => ({ name:'İlaç' }) };
SP.S.meds = [{ id:'x', name:'Demir' }];
SP.S.hatirlat = { liste:[{ id:'h1', tur:'su', saatler:['08:00'] }, { id:'h2', tur:'ilac', medId:'x', saatler:['21:00'] }],
  yapildi:{}, seans:{}, bildirim:false };
const ISARET = (n, k, s, d) => { const y = SP.S.hatirlat.yapildi; (y[G(n)] = y[G(n)] || {})[k] = ZAMAN(n, s, d); };
ISARET(-1, 'h1@08:00', 8, 40); ISARET(-2, 'h1@08:00', 8, 50); ISARET(-3, 'h1@08:00', 8, 30); ISARET(-4, 'h1@08:00', 9, 10);
ISARET(-20, 'h1@08:00', 23, 0); ISARET(-2, 'h2@21:00', 21, 5); ISARET(-3, 'h2@21:00', 21, 15);
"""
r = js("SP.KingVeri.hatirlat(SIMDI)", HAT)
if r is not None:
    s = {x.get("anahtar"): x for x in r}
    a, b = s.get("h1@08:00") or {}, s.get("h2@21:00") or {}
    if (a.get("kurulu"), a.get("gercek"), a.get("n"), a.get("etiket"), a.get("dun")) != ("08:00", "08:45", 4, "hesaplandı", "yapildi"):
        hata.append("hatirlat su: kurulu 08:00, gercek 08:45, n 4, 'hesaplandı', dun 'yapildi' bekleniyordu: %r" % a)
    if (b.get("kurulu"), b.get("gercek"), b.get("n"), b.get("etiket"), b.get("dun")) != ("21:00", None, 2, "veri yok", "isaretlenmedi"):
        hata.append("hatirlat ilac: 3'ten az isaret -> gercek null 'veri yok', dun 'isaretlenmedi': %r" % b)
    if "Demir" in str(r):
        hata.append("hatirlat ilac adini tasimamali (core/hatirlat.js soz 3; 'İlaç / takviye'): %r" % b)

# 8) sonKayit / duzelt: en son eklenen antrenman; dk 1..600; geri al eski degeri koyar
SON = r"""
SP.S.workouts = [{ id:'w1', date:G(-1), name:'Bacak', kind:'strength', items:[], minutes:50, createdAt:ZAMAN(-1, 18, 0) },
  { id:'w2', date:G(0), name:'Yürüyüş', kind:'cardio', items:[], minutes:45, createdAt:ZAMAN(0, 9, 0) }];
"""
r = js("""(async () => { const s = SP.KingVeri.sonKayit();
  const k = [await SP.KingVeri.duzelt('w2', 'dk', 0), await SP.KingVeri.duzelt('w2', 'dk', 700),
    await SP.KingVeri.duzelt('yok', 'dk', 30), await SP.KingVeri.duzelt('w2', 'kalori', 30)].map(x => !!(x && x.ok));
  const d = await SP.KingVeri.duzelt('w2', 'dk', 30);
  const sonra = SP.S.workouts.find(w => w.id === 'w2').minutes, yaz = YAZILAN.slice();
  await d.geriAl();
  return [s, G(0), k, { ok:d.ok, once:d.once, sonra:d.sonra }, sonra, yaz, SP.S.workouts.find(w => w.id === 'w2').minutes]; })()""", SON)
if r:
    s, bugun, kotu, d, sonra, yaz, geri = r
    if s != {"id": "w2", "tur": "antrenman", "gun": bugun, "ad": "Yürüyüş", "alanlar": [{"ad": "dk", "deger": 45, "birim": "dk"}]}:
        hata.append("sonKayit en son eklenen antrenmani vermeli: %r" % s)
    if any(kotu):
        hata.append("duzelt 0 dk, 700 dk, olmayan kayit ve bilinmeyen alani reddetmeli (ok false): %r" % kotu)
    if d != {"ok": True, "once": 45, "sonra": 30} or sonra != 30 or "workouts/w2" not in yaz or geri != 45:
        hata.append("duzelt w2 dk 30: {ok, once 45, sonra 30}, depoya workouts/w2, geriAl 45'e dondurmeli: %r %r %r %r" % (d, sonra, yaz, geri))
r = js("SP.KingVeri.sonKayit()")
if r is not None:
    hata.append("kaydi olmayan profilde sonKayit null olmali: %r" % r)

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("spi king verisi kabul: uyku_dustu, plan_kacti, kimlik, hafta, hatirlat, sonKayit/duzelt.")
