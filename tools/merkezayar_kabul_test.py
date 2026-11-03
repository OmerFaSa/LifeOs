#!/usr/bin/env python3
"""Kabul testi, Gün planı F1: brand/ortak/merkezayar.js (LIFEOS.MerkezAyar).

   Modül Ayarlar'ındaki «King ve bağlantılar» bölümünün veri katmanı: HKM'nin
   /api/config ayarlarından yalnız GÖRÜNEN kısmı okur ve yazar (model paketi,
   aylık tavan, kanal aç-kapa, birkaç eşik). Sır göndermez, bilinmeyen alan
   yazmaz, aralık dışını HKM'ye sormadan reddeder.

   python3 tools/merkezayar_kabul_test.py     (çıkış 0 temiz, 1 kırmızı)"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kabul_js as J  # noqa: E402

DOSYA = ["brand/ortak/merkezayar.js"]
hata = []


def bekle(ad, kosul):
    if not kosul:
        hata.append(ad)


def js(ifade, hazirlik=""):
    try:
        return J.calistir("", DOSYA, ifade, hazirlik)
    except J.JSHatasi as e:
        hata.append("JS: " + str(e)[:300])
        return None


CFG = {
    "budget": {"ceiling_currency": "usd", "monthly_usd": 10.0, "monthly_try": 0.0},
    "channels": {"whatsapp": {"enabled": False, "ready": False, "token": {"set": True, "value": "••••••ab"}},
                 "telegram": {"enabled": True, "ready": True, "bot_token": {"set": True, "value": "••••••cd"}}},
    "thresholds": {"bio": {"sleep_hours_min": 7.0, "hrv_drop_pct": 15.0},
                   "academic": {"study_minutes_min": 60, "questions_min": 40},
                   "intellect": {"practice_minutes_min": 20, "retention_floor": 0.8}},
    "ranges": {"bio": {"sleep_hours_min": [3.0, 12.0], "hrv_drop_pct": [1.0, 90.0]},
               "academic": {"study_minutes_min": [1, 1440], "questions_min": [1, 2000]},
               "intellect": {"practice_minutes_min": [1, 1440], "retention_floor": [0.05, 0.99]}},
    "threshold_names": {"bio": {"sleep_hours_min": "Uyku tabanı (saat)", "hrv_drop_pct": "HRV düşüşü (%)"},
                        "academic": {"study_minutes_min": "Günlük çalışma (dk)", "questions_min": "Günlük soru"},
                        "intellect": {"practice_minutes_min": "Günlük pratik (dk)", "retention_floor": "Hatırlama tabanı"}},
}
PAKET = {"aktif": "A+", "paketler": [{"id": "A", "ad": "A", "aylik": 1.25}, {"id": "A+", "ad": "A artı", "aylik": None},
                                    {"id": "S", "ad": "S", "aylik": 4.5}, {"id": "S+", "ad": "S artı", "aylik": None}]}
C = json.dumps(CFG)
P = json.dumps(PAKET)
M = "LIFEOS.MerkezAyar"

# 1. Saf görünüm
g = js("%s.gorunum(%s, %s)" % (M, C, P))
if g:
    bekle("paket seçili", g["paket"]["secili"] == "A+")
    bekle("paket listesi 4", [x["id"] for x in g["paket"]["liste"]] == ["A", "A+", "S", "S+"])
    bekle("aylık ölçülmüşse tahmin etiketi", g["paket"]["liste"][0]["aylik"] == 1.25 and g["paket"]["liste"][0]["etiket"] == "tahmin")
    bekle("aylık yoksa veri yok (sıfır değil)", g["paket"]["liste"][1]["aylik"] is None and g["paket"]["liste"][1]["etiket"] == "veri yok")
    bekle("tavan", g["tavan"] == {"birim": "usd", "deger": 10.0})
    bekle("kanallar", g["kanallar"] == [{"ad": "whatsapp", "baslik": "WhatsApp", "acik": False, "hazir": False},
                                        {"ad": "telegram", "baslik": "Telegram", "acik": True, "hazir": True}])
    es = g["esikler"]
    bekle("üç eşik, modül başına bir", [(x["grup"], x["ad"]) for x in es] ==
          [("bio", "sleep_hours_min"), ("academic", "study_minutes_min"), ("intellect", "practice_minutes_min")])
    bekle("eşik alanları", es[0] == {"grup": "bio", "ad": "sleep_hours_min", "etiket": "Uyku tabanı (saat)",
                                      "deger": 7.0, "min": 3.0, "max": 12.0})
    bekle("görünümde sır yok", "••••" not in json.dumps(g, ensure_ascii=False))
g2 = js("%s.gorunum({}, null)" % M)
if g2:
    bekle("boş ayar: paket null, liste boş", g2["paket"] == {"secili": None, "liste": []})
    bekle("boş ayar: tavan usd 0 değil null", g2["tavan"] == {"birim": "usd", "deger": None})
    bekle("boş ayar: kanallar kapalı", [x["acik"] for x in g2["kanallar"]] == [False, False])
    bekle("boş ayar: eşik yok", g2["esikler"] == [])

# 2. Saf yama: yalnız izinli alanlar
def yama(d):
    return js("%s.yama(%s, %s)" % (M, json.dumps(d), C))

r = yama({"tur": "paket", "deger": "S"})
bekle("paket yaması", r == {"ok": True, "yama": {"models": {"paket": "S"}}})
bekle("bilinmeyen paket", (yama({"tur": "paket", "deger": "Z"}) or {}).get("ok") is False)
r = yama({"tur": "tavan", "birim": "try", "deger": 500})
bekle("tavan TL yaması", r == {"ok": True, "yama": {"budget": {"ceiling_currency": "try", "monthly_try": 500}}})
bekle("tavan USD üst sınır 5000", (yama({"tur": "tavan", "birim": "usd", "deger": 5001}) or {}).get("ok") is False)
bekle("tavan eksi olmaz", (yama({"tur": "tavan", "birim": "usd", "deger": -1}) or {}).get("ok") is False)
bekle("tavan sayı olmalı", (yama({"tur": "tavan", "birim": "usd", "deger": "10"}) or {}).get("ok") is False)
r = yama({"tur": "kanal", "ad": "whatsapp", "acik": True})
bekle("kanal yalnız enabled", r == {"ok": True, "yama": {"channels": {"whatsapp": {"enabled": True}}}})
bekle("bilinmeyen kanal", (yama({"tur": "kanal", "ad": "sms", "acik": True}) or {}).get("ok") is False)
bekle("kanal bool olmalı", (yama({"tur": "kanal", "ad": "telegram", "acik": "evet"}) or {}).get("ok") is False)
r = yama({"tur": "esik", "grup": "bio", "ad": "sleep_hours_min", "deger": 6.5})
bekle("eşik yaması", r == {"ok": True, "yama": {"thresholds": {"bio": {"sleep_hours_min": 6.5}}}})
bekle("eşik aralık dışı", (yama({"tur": "esik", "grup": "bio", "ad": "sleep_hours_min", "deger": 40}) or {}).get("ok") is False)
bekle("bilinmeyen eşik", (yama({"tur": "esik", "grup": "bio", "ad": "yok", "deger": 5}) or {}).get("ok") is False)
bekle("bilinmeyen tür", (yama({"tur": "token", "deger": "x"}) or {}).get("ok") is False)
r = yama({"tur": "paket", "deger": "S"}) or {}
bekle("hata mesajı Türkçe dize", isinstance((yama({"tur": "kanal", "ad": "sms", "acik": True}) or {}).get("hata"), str))

# 3. Bağlantı ve HTTP (sahte fetch)
SAHTE = """
var CAGRI = [];
function beacon(acik){ return { settings:function(){ return { enabled:acik, token:'jeton', url:'http://127.0.0.1:4200/' }; }, urlOk:function(){ return true; } }; }
function cevap(durum, govde){ return Promise.resolve({ status:durum, json:function(){ return Promise.resolve(govde); } }); }
var YANIT = { cfg:%s, paket:%s, yaz:{ durum:200, govde:{ ok:true } } };
function sahteFetch(url, o){
  o = o || {}; CAGRI.push({ url:url, method:o.method || 'GET', auth:(o.headers || {})['Authorization'] || '', body:o.body ? JSON.parse(o.body) : null });
  if(url.indexOf('/api/config') >= 0 && (o.method || 'GET') === 'GET') return cevap(200, YANIT.cfg);
  if(url.indexOf('/api/models/paketler') >= 0) return cevap(200, YANIT.paket);
  if(url.indexOf('/api/config') >= 0 && o.method === 'POST') return cevap(YANIT.yaz.durum, YANIT.yaz.govde);
  return cevap(404, {});
}
""" % (C, P)

r = js("%s.kur({ hkm:function(){ return beacon(false); }, fetch:sahteFetch }).oku().then(function(x){ return [x, CAGRI.length]; })" % M, SAHTE)
bekle("bağlı değilse neden baglanti, istek yok", r == [{"ok": False, "neden": "baglanti"}, 0])
r = js("%s.kur({ fetch:sahteFetch }).oku()" % M, SAHTE)
bekle("hkm yoksa baglanti", r == {"ok": False, "neden": "baglanti"})

r = js("""(function(){ var a = %s.kur({ hkm:function(){ return beacon(true); }, fetch:sahteFetch });
  return a.oku().then(function(x){ return [x.ok, x.gorunum.paket.secili, x.gorunum.kanallar.length, CAGRI.map(function(c){ return c.method + ' ' + c.url + ' ' + c.auth; })]; }); })()""" % M, SAHTE)
if r:
    bekle("oku ok", r[0] is True and r[1] == "A+" and r[2] == 2)
    bekle("oku iki GET, Bearer jeton, sondaki / tek", sorted(r[3]) == sorted([
        "GET http://127.0.0.1:4200/api/config Bearer jeton",
        "GET http://127.0.0.1:4200/api/models/paketler Bearer jeton"]))

r = js("""(function(){ var a = %s.kur({ hkm:function(){ return beacon(true); }, fetch:sahteFetch });
  return a.oku().then(function(){ CAGRI = []; return a.yaz({ tur:'kanal', ad:'telegram', acik:false }); })
    .then(function(x){ return [x, CAGRI]; }); })()""" % M, SAHTE)
if r:
    bekle("yaz ok", r[0].get("ok") is True)
    posts = [c for c in r[1] if c["method"] == "POST"]
    bekle("yaz tek POST /api/config", len(posts) == 1 and posts[0]["url"] == "http://127.0.0.1:4200/api/config")
    bekle("yaz gövdesi yalnız yama", posts and posts[0]["body"] == {"channels": {"telegram": {"enabled": False}}})
    bekle("yaz Content-Type ve Bearer", posts and posts[0]["auth"] == "Bearer jeton")

r = js("""(function(){ var a = %s.kur({ hkm:function(){ return beacon(true); }, fetch:sahteFetch });
  return a.yaz({ tur:'tavan', birim:'usd', deger:99999 }).then(function(x){ return [x.ok, typeof x.hata, CAGRI.filter(function(c){ return c.method === 'POST'; }).length]; }); })()""" % M, SAHTE)
bekle("geçersiz yama HKM'ye gitmez", r == [False, "string", 0])

r = js("""(function(){ YANIT.yaz = { durum:422, govde:{ errors:['budget.monthly_usd 0.0–5000.0 aralığında olmalı'] } };
  var a = %s.kur({ hkm:function(){ return beacon(true); }, fetch:sahteFetch });
  return a.oku().then(function(){ return a.yaz({ tur:'tavan', birim:'usd', deger:20 }); }); })()""" % M, SAHTE)
bekle("422 hatası iletilir", r == {"ok": False, "hata": "budget.monthly_usd 0.0–5000.0 aralığında olmalı"})

r = js("""(function(){ var a = %s.kur({ hkm:function(){ return beacon(true); }, fetch:function(){ return Promise.reject(new Error('ağ')); } });
  return Promise.all([a.oku(), a.yaz({ tur:'paket', deger:'A' })]); })()""" % M, SAHTE)
bekle("ağ hatası çökertmez", r == [{"ok": False, "neden": "hata"}, {"ok": False, "neden": "hata"}])

# 4. Ayarlar › Merkez: sema, degerler, alan yamasi (2026-11-03)
CFG2 = dict(CFG, king={"kendiliginden": True, "sormadan_dusuk": False}, schedule={"morning": "08:00", "weekly_day": ""},
            models={"providers": [{"id": "openrouter", "key_set": True, "key_hint": "••••••xy"}, {"id": "google", "key_set": False, "key_hint": ""}]})
C2 = json.dumps(CFG2, ensure_ascii=False)
sk = js("%s.sekmeler(%s)" % (M, C2))
if sk:
    bekle("sekmeler sirasi", [x["id"] for x in sk] == ["genel", "yz", "kanallar", "zaman", "bildirim", "esikler"])
    alan = {a["yol"]: a for s in sk for g in s["gruplar"] for a in g["alanlar"]}
    bekle("bool degeri", alan["king.kendiliginden"]["deger"] is True and alan["king.kendiliginden"]["tur"] == "bool")
    bekle("saglayici anahtari yalniz kurulu bilgisi", alan["models.keys.openrouter"]["deger"] == {"kurulu": True, "ipucu": "xy"}
          and alan["models.keys.google"]["deger"] == {"kurulu": False, "ipucu": ""})
    bekle("kanal sirri maskeli kalir", alan["channels.whatsapp.token"]["deger"] == {"kurulu": True, "ipucu": "ab"})
    bekle("esikler araliktan, butun alanlar", "thresholds.bio.hrv_drop_pct" in alan and alan["thresholds.bio.hrv_drop_pct"]["min"] == 1.0)
    bekle("esik adi", alan["thresholds.bio.sleep_hours_min"]["ad"] == "Uyku tabanı (saat)")
    bekle("sekmelerde sir degeri yok", "••••" not in json.dumps(sk, ensure_ascii=False))

def ay(yol, deger):
    return js("%s.alanYama(%s, %s, %s)" % (M, json.dumps(yol), json.dumps(deger, ensure_ascii=False), C2))

bekle("bool alan", ay("king.kendiliginden", False) == {"ok": True, "yama": {"king": {"kendiliginden": False}}})
bekle("saat alan", ay("schedule.morning", "07:30") == {"ok": True, "yama": {"schedule": {"morning": "07:30"}}})
bekle("bos saat kapatir", (ay("schedule.evening", "") or {}).get("ok") is True)
bekle("bozuk saat", (ay("schedule.morning", "25:00") or {}).get("ok") is False)
bekle("secim", (ay("schedule.weekly_day", "pazar") or {}).get("ok") is True and (ay("schedule.weekly_day", "x") or {}).get("ok") is False)
bekle("liste virgulden", ay("channels.telegram.allow_from", "a, b ,") == {"ok": True, "yama": {"channels": {"telegram": {"allow_from": ["a", "b"]}}}})
bekle("sir yazilir", ay("models.keys.google", " AIza-1 ") == {"ok": True, "yama": {"models": {"keys": {"google": "AIza-1"}}}})
bekle("bos sir yazilmaz", (ay("models.keys.google", "  ") or {}).get("ok") is False)
bekle("esik aralik", (ay("thresholds.bio.hrv_drop_pct", 95) or {}).get("ok") is False and (ay("thresholds.bio.hrv_drop_pct", 20) or {}).get("ok") is True)
bekle("sema disi yol yazilmaz", (ay("local_token", "x") or {}).get("ok") is False and (ay("channels.whatsapp.yeni", 1) or {}).get("ok") is False)
bekle("aralik disi sayi", (ay("aktif.aralik_dk", 1) or {}).get("ok") is False)

if hata:
    print("KIRMIZI (%d):" % len(hata))
    for h in hata:
        print(" -", h)
    sys.exit(1)
print("YEŞİL: merkezayar kabul testi")
