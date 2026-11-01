#!/usr/bin/env python3
"""Gorev 042 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
ESP'nin King verisi (KING-4 §C olaylari, §H saglayicilari): ESP.KingVeri (src/js/core/kingveri.js).
Olay bicimi belgeler/ekip/KING-OLAY.md; sayiyi modul kodu uretir (AGENTS §1), eksik veri sifir degildir.
Node'da kosar (tools/kabul_js.py). python tools/kingveri_esp_kabul_test.py"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kabul_js as J  # noqa: E402

DOSYALAR = ["src/js/data/rules.js", "src/js/core/utils.js", "src/js/core/memo.js", "src/js/core/state.js",
            "src/js/core/srs.js", "src/js/core/kingveri.js"]
# Depo bellekte; SIMDI bugun 10:00 (yerel); G(n) = bugunden n gun sonra (ISO). ESP.S yerinde degisir (state.js S'yi yakalar).
HAZIRLIK = r"""
const YAZILAN = [];
ESP.Store = { set: async (y, d) => { YAZILAN.push(y); return true; }, get: async () => null, remove: async () => {} };
const SIMDI = new Date(); SIMDI.setHours(10, 0, 0, 0);
const G = n => ESP.U.iso(ESP.U.addDays(SIMDI, n));
const ZAMAN = (n, s, d) => { const x = ESP.U.addDays(SIMDI, n); x.setHours(s, d, 0, 0); return x.toISOString(); };
const OTURUM = (n, id, disc, dk, s, d, ek) => { const g = G(n);
  ESP.S.days[g] = ESP.S.days[g] || { date:g, sessions:[], note:'' };
  ESP.S.days[g].sessions.push(Object.assign({ id, disc, minutes:dk, minutesCert:'measured', count:null, countCert:'missing',
    at:ZAMAN(n, s, d) }, ek || {})); };
ESP.S.cards.length = 0;
"""
ETIKET = {"ölçüldü", "hesaplandı", "tahmin", "veri yok"}
hata = []


def js(ifade, ek=""):
    try:
        return J.calistir("ESP", DOSYALAR, ifade, HAZIRLIK + ek)
    except J.JSHatasi as e:
        hata.append("JS hatasi: %s" % e)
        return None


def bicim(olaylar, ne):
    """KING-OLAY.md: modul, tur, kimlik (<=80), at (yerel saniyeli), sayilar (<=8, etiketli)."""
    for o in olaylar or []:
        if o.get("modul") != "esp" or not o.get("tur") or not o.get("kimlik") or len(o.get("kimlik")) > 80:
            hata.append("%s: olay bicimi bozuk %r" % (ne, o))
        if not re.match(r"^\d{4}-\d\d-\d\dT10:00:00$", str(o.get("at"))):
            hata.append("%s: at simdinin yerel saati olmali (YYYY-AA-GGT10:00:00): %r" % (ne, o.get("at")))
        s = o.get("sayilar") or {}
        if not s or len(s) > 8 or any(x.get("etiket") not in ETIKET or "deger" not in x for x in s.values()):
            hata.append("%s: sayilar bicimi bozuk %r" % (ne, s))


OLAY = "ESP.KingVeri.olaylar(SIMDI)"
TUR = lambda l, t: [o for o in (l or []) if o.get("tur") == t]  # noqa: E731

# 1) tekrar_gunu: vadesi gecmis, bugun ve vadesiz kart (SRS: vadesiz = bugun) -> 3; yarinki sayilmaz
r = js("[%s, %s, G(0)]" % (OLAY, OLAY), """ESP.S.cards.push({ id:'k1', front:'a', back:'b', due:G(-3), box:1 },
  { id:'k2', front:'c', back:'d', due:G(0), box:2 }, { id:'k3', front:'e', back:'f', box:1 }, { id:'k4', front:'g', back:'h', due:G(2), box:3 });""")
if r:
    l, l2, bugun = r
    bicim(l, "esp")
    t = TUR(l, "tekrar_gunu")
    if len(t) != 1 or t[0].get("sayilar") != {"adet": {"deger": 3, "birim": "kart", "etiket": "hesaplandı"}} \
            or t[0].get("kimlik") != "esp.tekrar_gunu." + bugun:
        hata.append("tekrar_gunu: tek olay, adet 3 kart hesaplandı (ESP.SRS.dueCards), kimlik esp.tekrar_gunu.<bugun>: %r" % t)
    if sorted(o.get("kimlik") for o in l) != sorted(o.get("kimlik") for o in l2):
        hata.append("olaylar ayni anda ayni kimlikleri vermeli: %r %r" % (l, l2))

# 2) vadeli kart yok -> olay yok
r = js(OLAY, "ESP.S.cards.push({ id:'k4', front:'g', back:'h', due:G(2), box:3 });")
if r is not None and TUR(r, "tekrar_gunu"):
    hata.append("vadeli kart yokken tekrar_gunu olmamali: %r" % r)

# 3) hafta(bitis): bu hafta 3 oturum (30 + 20 dil, 40 okuma tahmin), 2 gun; onceki hafta 1 oturum 25 dk
HAFTA = r"""
OTURUM(0, 's1', 'lang', 30, 9, 0); OTURUM(0, 's2', 'lang', 20, 21, 0);
OTURUM(-3, 's3', ESP.DISCIPLINES[1].id, 40, 20, 0, { minutesCert:'estimated' });
OTURUM(-9, 's4', 'lang', 25, 9, 0);
"""
r = js("[ESP.KingVeri.hafta(G(0)), G(-6), G(0)]", HAFTA)
if r:
    h, bas, bit = r
    if (h or {}).get("bas") != bas or h.get("bit") != bit:
        hata.append("hafta: bas = bitisten 6 gun once, bit = bitis olmali: %r" % h)
    s = {x.get("id"): x for x in (h or {}).get("satirlar") or []}
    bek = {"calisma_dk": (90, "dk", "tahmin", 25), "oturum": (3, None, "ölçüldü", 1), "gun": (2, None, "ölçüldü", 1)}
    for k, (d, b, e, o) in bek.items():
        x = s.get(k) or {}
        if x.get("deger") != d or x.get("etiket") != e or x.get("onceki") != o or (b and x.get("birim") != b) or not x.get("ad"):
            hata.append("hafta.%s: deger %r birim %r etiket %r onceki %r ve ad bekleniyordu "
                        "(tahmin dakika iceren toplam 'tahmin'): %r" % (k, d, b, e, o, x))
r = js("ESP.KingVeri.hafta(G(0)).satirlar.map(x => [x.id, x.deger, x.etiket])")
if r is not None and (not r or any(d is not None or e != "veri yok" for _, d, e in r)):
    hata.append("hic oturumu olmayan haftada her satir {deger null, 'veri yok'} olmali (sifir degil): %r" % r)

# 4) hatirlat: dil oturumlari 07:50/08:00/08:20/08:40 -> 08:10; dun dil var; okuma iki gun -> veri yok, dun yok
HAT = r"""
const OK = ESP.DISCIPLINES[1].id;
OTURUM(-1, 'a', 'lang', 20, 7, 50); OTURUM(-2, 'b', 'lang', 20, 8, 0); OTURUM(-4, 'c', 'lang', 20, 8, 20); OTURUM(-6, 'd', 'lang', 20, 8, 40);
OTURUM(-20, 'e', 'lang', 20, 23, 0); OTURUM(-2, 'f', OK, 30, 21, 0); OTURUM(-3, 'g', OK, 30, 22, 0);
OTURUM(-5, 'h', 'lang', 0, 12, 0, { minutes:null, minutesCert:'missing' });
"""
r = js("[ESP.KingVeri.hatirlat(SIMDI), ESP.DISCIPLINES[1].id]", HAT)
if r:
    l, ok = r
    s = {x.get("anahtar"): x for x in l or []}
    a, b = s.get("disc:lang") or {}, s.get("disc:" + ok) or {}
    if (a.get("kurulu"), a.get("gercek"), a.get("n"), a.get("etiket"), a.get("dun"), a.get("ad")) != \
            (None, "08:10", 4, "hesaplandı", "yapildi", "Yabancı Dil"):
        hata.append("hatirlat disc:lang: kurulu null, gercek 08:10 (son 14 gun, dakikasi olan oturumlarin ortancasi), n 4, "
                    "'hesaplandı', dun 'yapildi', ad 'Yabancı Dil': %r" % a)
    if (b.get("gercek"), b.get("n"), b.get("etiket"), b.get("dun")) != (None, 2, "veri yok", "isaretlenmedi"):
        hata.append("hatirlat disc:%s: 3'ten az oturum -> gercek null 'veri yok', dun 'isaretlenmedi': %r" % (ok, b))

# 5) sonKayit / duzelt: en son eklenen oturum (at); dk 1..600; geri al eski degeri koyar
SON = "OTURUM(-1, 'x1', 'lang', 50, 20, 0); OTURUM(0, 'x2', 'lang', 45, 9, 0); OTURUM(0, 'x0', 'lang', 15, 7, 0);"
r = js("""(async () => { const s = ESP.KingVeri.sonKayit();
  const k = [await ESP.KingVeri.duzelt(s.id, 'dk', 0), await ESP.KingVeri.duzelt(s.id, 'dk', 700),
    await ESP.KingVeri.duzelt('yok', 'dk', 30), await ESP.KingVeri.duzelt(s.id, 'kalori', 30)].map(x => !!(x && x.ok));
  const d = await ESP.KingVeri.duzelt(s.id, 'dk', 30);
  const bul = () => ESP.S.days[G(0)].sessions.find(x => x.id === 'x2');
  const sonra = [bul().minutes, bul().minutesCert], yaz = YAZILAN.slice();
  await d.geriAl();
  return [s, G(0), k, { ok:d.ok, once:d.once, sonra:d.sonra }, sonra, yaz, bul().minutes]; })()""", SON)
if r:
    s, bugun, kotu, d, sonra, yaz, geri = r
    if not s or s.get("gun") != bugun or s.get("tur") != "oturum" or not s.get("id") or not s.get("ad") \
            or s.get("alanlar") != [{"ad": "dk", "deger": 45, "birim": "dk"}]:
        hata.append("sonKayit en son eklenen oturumu (x2, 45 dk) vermeli: %r" % s)
    if any(kotu):
        hata.append("duzelt 0 dk, 700 dk, olmayan kayit ve bilinmeyen alani reddetmeli: %r" % kotu)
    if d != {"ok": True, "once": 45, "sonra": 30} or sonra != [30, "measured"] or ("days/" + bugun) not in yaz or geri != 45:
        hata.append("duzelt dk 30: {ok, once 45, sonra 30}, dakika 'measured', depoya days/<bugun>, geriAl 45: %r %r %r %r"
                    % (d, sonra, yaz, geri))
r = js("ESP.KingVeri.sonKayit()")
if r is not None:
    hata.append("kaydi olmayan profilde sonKayit null olmali: %r" % r)

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("esp king verisi kabul: tekrar_gunu, kimlik, hafta, hatirlat, sonKayit/duzelt.")
