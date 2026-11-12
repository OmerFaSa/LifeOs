#!/usr/bin/env python3
"""Goc araci (sadelesme Faz 1, A3): bes kaynaktan tek depoya. Plan: belgeler/ekip/sadelesme/faz1.md

    python sistem/goc.py --kuru [--cikti KLASOR] [--hesap DB] [--hkm DB] [--paket KLASOR] [--pc KLASOR]

Kuru kosu goce GECICI bir lifeos.db'ye yapar, geri okur, kaynak x tur sayar ve raporu
(goc-kuru.json + goc-kuru.md) yazar. Gercek goc (P6) ayni `goc()` islevidir, baska hedefle;
sahibinin acik onayi olmadan bu dosyadan cagrilmaz.

Sozler:
1. Kaynaga yazmaz. Her SQLite dosyasi (+ -wal, -shm) once gecici klasore KOPYALANIR, kopya acilir;
   canli dosya hic acilmaz (salt okur acilis bile -shm yazar).
2. Sayi dengesi: her kaynak x tur icin okunan = tasinan (hedeften geri okunarak) + atlanan (nedeniyle).
3. Gidis-donus: hedefteki her govde kaynak govdesiyle ayni SHA-256'yi verir.
4. Kesinlik tek dilde: measured, estimated, computed, missing, eski. `derived` -> computed sayilir;
   etiketsiz sayi `eski` olur (karar 11), govde degismez.
5. Turetilmis kayitlar tasinmaz, sayilir, yeniden hesaplanir (karar 10). Cihaza ait yollar atlanir.
6. Sir pakete girmez: pakette sir adli anahtar varsa goc durur.
7. Ayni girdi, bayt bayt ayni rapor (rapor saat ve gecici yol tasimaz).
8. Geri donus: her satir goc_id tasir; geri_al(hedef, goc_id) o turu tumden siler.
"""
import argparse
import base64
import collections
import datetime
import hashlib
import json
import os
import re
import shutil
import sqlite3
import sys
import tempfile

ETIKETLER = ("measured", "estimated", "computed", "missing", "eski")
ESKI_ETIKET = {"derived": "computed"}
# Modul koleksiyonu -> birlesik tur (veri-katmani.md §4). Listede olmayan koleksiyon kendi adiyla tasinir.
KATALOG = {
    "spi:vitals": "olcum", "ays:mood": "olcum", "spi:meals": "ogun", "spi:foods": "gida",
    "spi:workouts": "antrenman", "spi:labs": "tahlil", "spi:meds": "ilac",
    "ays:sessions": "oturum", "ays:breaks": "oturum", "ays:exams": "deneme",
    "ays:solved": "soru_denemesi", "ays:errors": "soru_denemesi",
    "ays:cards": "kart", "esp:cards": "kart",
    "*:defter": "not", "*:defterterim": "not", "*:defterklasor": "not", "esp:notes": "not",
    "*:hedefler": "hedef", "ays:hedefPlanlar": "hedef", "esp:goals": "hedef",
    "ays:plan": "plan_blogu", "ays:weeks": "plan_blogu", "ays:calendar": "plan_blogu",
    "esp:weekplan": "plan_blogu", "esp:reminders": "plan_blogu", "esp:events": "plan_blogu",
    "*:profile": "profil", "*:meta": "meta",
}
TURETILMIS = {"decisions", "briefings", "signals", "forecasts", "meetings", "office"}
CIHAZA_AIT = {"hkm", "storage", "usage"}            # brand/ortak/depo.js CIHAZA_AIT
HKM_GERCEK = {
    "para": "para_hareketi", "motto_nodes": "not", "motto_versions": "not", "motto_links": "not",
    "motto_tags": "not", "memories": "kisi_bilgisi", "conversations": "sohbet", "attachments": "ek",
    "eylem": "eylem", "king_olaylar": "eylem", "king_isler": "king", "king_gorevler": "king",
    "king_beceriler": "king", "king_sozler": "king", "king_bekleyen": "king",
    "zaman_butcesi": "plan_blogu", "susturmalar": "tercih", "sorular": "olcum",
    "meydan_deste": "kart", "meydan_isaret": "kart", "meydan_not": "not", "meydan_yanit": "kart",
    "bam_isler": "bam", "bam_kayitlar": "bam", "intents": "akis", "outbox": "akis",
    "inbox_seen": "akis", "bildirimler": "akis", "is_emirleri": "akis", "usage": "kullanim",
}
HKM_TURETILMIS = {
    "raw_events", "audits", "decisions", "decision_sources", "hedef_ozet", "hafiza_gomme", "bam_iz",
    "bam_depo_rapor", "meydan_hikaye", "duyurular", "yarin_ozet", "tatil_ozet", "dil_karti",
    "goruntu_sira", "web_onbellek", "web_sayac", "model_tarife", "aktif_tur", "aktif_is", "para_taslak",
}
KIMLIK = ("kullanici", "oturum", "iki_adim", "yedek_kod", "bilet", "bag_kodu", "anahtar", "takvim",
          "cihaz_adi", "gelen", "olay", "sayac", "ayar")
SIR_RE = re.compile(r"(llm\.keys|anahtar|apikey|api_key|token|jeton|parola|sifre|secret|password)", re.I)
# shortcut: sayi olmayan sayilar (zaman, kimlik, sira, surum) ada gore ayiklanir; tur katalogu alan alan
# yazilinca (Faz 2, alan tasinirken) katalogdaki «olcu alani» listesine gecer.
META_RE = re.compile(r"^(id|.*Id|.*_id|rowid|at|.*At|.*_at|ts|z|zaman|tarih|date|dow|sira|seq|surum|version|"
                     r".*Version|index|idx|order|sort|due|dueAt|.*Ms|.*_ms|created|updated|guncel|kayit)$")
ZAMAN_ALANI = ("updatedAt", "guncel", "at", "createdAt", "ts", "updated_at", "created_at")
MODULLER = ("ays", "spi", "esp")
PAKET_KAYNAK = MODULLER + ("gun",)
CIHAZ_RE = re.compile(r"^[A-Za-z0-9_\-]{6,64}$")       # hesap.py CIHAZ_RE ile ayni; paket adinda da kullanilir
# Bir paket (JSON). Istemci (brand/ortak/gocpaket.js) medyayi 48 MB'lik parcalara boler: base64 ile ~64 MB.
PAKET_EN_BUYUK = 96 * 1024 * 1024

SEMA = """
PRAGMA user_version = 1;
CREATE TABLE kayit(id TEXT PRIMARY KEY, tur TEXT NOT NULL, tur_surum INTEGER NOT NULL, alan TEXT NOT NULL,
  yol TEXT NOT NULL, govde TEXT, etiket TEXT NOT NULL, hlc TEXT NOT NULL, cihaz TEXT NOT NULL,
  silindi INTEGER NOT NULL DEFAULT 0, kaynak TEXT NOT NULL, goc_id TEXT);
CREATE INDEX kayit_tur ON kayit(tur, alan);
CREATE TABLE olay(sira INTEGER PRIMARY KEY AUTOINCREMENT, kayit_id TEXT NOT NULL, islem TEXT NOT NULL,
  hlc TEXT NOT NULL, cihaz TEXT NOT NULL, kaynak TEXT NOT NULL, goc_id TEXT);
CREATE TABLE medya(sha256 TEXT PRIMARY KEY, tur TEXT, boyut INTEGER NOT NULL, sahip TEXT NOT NULL, goc_id TEXT);
CREATE TABLE dosya(yol TEXT PRIMARY KEY, boyut INTEGER NOT NULL, sha256 TEXT NOT NULL, goc_id TEXT);
"""


def kanon(x):
    return json.dumps(x, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def ozet(b):
    return hashlib.sha256(b if isinstance(b, bytes) else b.encode("utf-8")).hexdigest()


def dosya_ozeti(yol):
    h = hashlib.sha256()
    with open(yol, "rb") as f:
        for parca in iter(lambda: f.read(1 << 20), b""):
            h.update(parca)
    return h.hexdigest()


def hlc(ms, cihaz):
    return "%013d:%04d:%s" % (max(0, int(ms)), 0, cihaz or "goc")


def kopyala(yol, gecici):
    """SQLite dosyasini yanindaki -wal/-shm ile kopyalar; kopyanin yolunu dondurur (yoksa None)."""
    if not yol or not os.path.isfile(yol):
        return None
    hedef = os.path.join(gecici, "%s-%s" % (ozet(os.path.abspath(yol))[:8], os.path.basename(yol)))
    for ek in ("", "-wal", "-shm"):
        if os.path.isfile(yol + ek):
            shutil.copyfile(yol + ek, hedef + ek)
    return hedef


def kayit_zamani(govde):
    """Kaydin kendi degisiklik zamani (ms); bulunamazsa 0."""
    if not isinstance(govde, dict):
        return 0
    for k in ZAMAN_ALANI:
        v = govde.get(k)
        if isinstance(v, (int, float)) and not isinstance(v, bool) and v > 0:
            return int(v if v > 1e11 else v * 1000)
        if isinstance(v, str) and v:
            try:
                return int(datetime.datetime.fromisoformat(v.replace("Z", "+00:00")).timestamp() * 1000)
            except ValueError:
                pass
    return 0


def etiketle(govde):
    """Govdedeki her sayiya tek dilde etiket: ({yol: kod}, Counter). Govde degismez."""
    etiket, say = {}, collections.Counter()

    def kod(ham):
        if ham in ESKI_ETIKET:
            say["derived_cevrim"] += 1
            return ESKI_ETIKET[ham]
        return ham if ham in ETIKETLER else None

    def gez(x, yol):
        if isinstance(x, list):
            for i, v in enumerate(x):
                gez(v, "%s.%d" % (yol, i) if yol else str(i))
            return
        if not isinstance(x, dict):
            return
        ortak = x.get("cert") if isinstance(x.get("cert"), str) else None
        for k, v in x.items():
            alt = "%s.%s" % (yol, k) if yol else k
            if isinstance(v, (dict, list)):
                gez(v, alt)
            elif isinstance(v, (int, float)) and not isinstance(v, bool) and not META_RE.match(k):
                ham = x.get(k + "Cert") if isinstance(x.get(k + "Cert"), str) else ortak
                e = kod(ham) if ham else None
                if ham and not e:
                    say["bilinmeyen_etiket"] += 1
                e = e or "eski"
                etiket[alt] = e
                say[e] += 1

    gez(govde, "")
    return etiket, say


def modul_turu(modul, yol):
    kol = yol.split("/", 1)[0]
    if kol in CIHAZA_AIT:
        return None, "cihaza ait"
    if kol in TURETILMIS:
        return None, "türetilmiş: yeniden hesaplanır"
    return KATALOG.get("%s:%s" % (modul, kol)) or KATALOG.get("*:" + kol) or "%s.%s" % (modul, kol), None


class Sayim:
    def __init__(self):
        self.okunan = collections.defaultdict(collections.Counter)      # kaynak -> tur -> n
        self.atlanan = collections.defaultdict(lambda: collections.defaultdict(collections.Counter))
        self.etiket = collections.defaultdict(collections.Counter)      # tur -> kod -> n

    def oku(self, kaynak, tur):
        self.okunan[kaynak][tur] += 1

    def atla(self, kaynak, tur, neden):
        self.atlanan[kaynak][tur][neden] += 1


def _hesap_dolu_mu(yol):
    try:
        c = sqlite3.connect(yol)
        try:
            if c.execute("PRAGMA quick_check").fetchone()[0] != "ok":
                return -1
            return c.execute("SELECT count(*) FROM kayit").fetchone()[0] + c.execute("SELECT count(*) FROM kullanici").fetchone()[0]
        finally:
            c.close()
    except sqlite3.Error:
        return -1


def hesap_kaynagi(yol, gecici, bilgi, uyari):
    """Canli hesap.db kopyasi; bossa en yeni dolu, saglam gunluk yedek (faz1.md §0)."""
    kopya = kopyala(yol, gecici)
    if not kopya:
        bilgi["durum"] = "yok"
        return None
    bilgi.update(durum="okundu", dosya=os.path.basename(yol), ozet=dosya_ozeti(kopya))
    if _hesap_dolu_mu(kopya) > 0:
        return kopya
    yedek = os.path.join(os.path.dirname(yol), "yedek")
    adaylar = sorted((a for a in os.listdir(yedek) if re.match(r"^hesap-.*\.db$", a)), reverse=True) if os.path.isdir(yedek) else []
    for ad in adaylar:
        k = kopyala(os.path.join(yedek, ad), gecici)
        if _hesap_dolu_mu(k) > 0:
            uyari.append("Canlı hesap deposu boş; kayıtlar en yeni dolu yedekten okundu: %s." % ad)
            bilgi.update(durum="canlı boş, yedekten okundu", dosya=ad, ozet=dosya_ozeti(k))
            return k
    return kopya


def topla_hesap(kopya, adaylar, sayim, bilgi):
    c = sqlite3.connect(kopya)
    try:
        kim = {t: c.execute('SELECT count(*) FROM "%s"' % t).fetchone()[0]
               for t in KIMLIK if c.execute("SELECT 1 FROM sqlite_master WHERE name=?", (t,)).fetchone()}
        bilgi["kimlik"] = {t: n for t, n in sorted(kim.items()) if n}
        kullanici = collections.Counter()
        for kul, alan, yol, deger, zaman, cihaz in c.execute(
                "SELECT kullanici, alan, yol, deger, zaman, cihaz FROM kayit ORDER BY alan, yol, kullanici"):
            modul = alan.split("/", 1)[0]
            tur, neden = modul_turu(modul, yol)
            sayim.oku("hesap", tur or yol.split("/", 1)[0])
            kullanici[str(kul)] += 1
            if neden:
                sayim.atla("hesap", yol.split("/", 1)[0], neden)
            elif deger is None:
                sayim.atla("hesap", tur, "silinmiş (mezar taşı)")
            else:
                adaylar[alan + "|" + yol].append(dict(kaynak="hesap", tur=tur, alan=alan, yol=yol, metin=deger,
                                                      zaman=kayit_zamani(json.loads(deger)), saat=zaman if zaman and zaman > 1 else 0,
                                                      cihaz=cihaz or "sunucu"))
        bilgi["kaydi_olan_kullanici"] = len(kullanici)
        for ad, icerik in c.execute("SELECT ad, icerik FROM yayin ORDER BY ad"):
            if ad.startswith("gun/") and icerik is not None:
                # Gun gecmisinin sunucudaki tek kopyasi (son gun); paket gelmezse kaybolmasin.
                sayim.oku("gun", "gun_kopya")
                adaylar["gun/sunucu|" + ad].append(dict(kaynak="gun", tur="gun_kopya", alan="gun/sunucu", yol=ad,
                                                       metin=icerik, zaman=0, cihaz="sunucu"))
            else:
                sayim.oku("hesap", "yayin")
                sayim.atla("hesap", "yayin", "türetilmiş: yeniden hesaplanır" if icerik is not None else "boş yayın")
    finally:
        c.close()


def topla_paketler(klasor, adaylar, sayim, medya, bilgi, uyari, hata):
    paketler = sorted(a for a in os.listdir(klasor) if a.endswith(".json")) if klasor and os.path.isdir(klasor) else []
    bilgi.update(durum="okundu" if paketler else "paket yok", paket=len(paketler), bekleyen={}, cihaz={})
    for ad in paketler:
        yol = os.path.join(klasor, ad)
        try:
            with open(yol, "rb") as f:
                ham = f.read()
            p = json.loads(ham.decode("utf-8"))
        except (OSError, ValueError) as e:
            hata.append("Paket okunamadı: %s (%s)." % (ad, e.__class__.__name__))
            continue
        kaynak, cihaz = p.get("kaynak"), str(p.get("cihaz") or "bilinmeyen")
        if p.get("lifeos_goc") != 1 or kaynak not in PAKET_KAYNAK:
            hata.append("Paket biçimi tanınmadı: %s." % ad)
            continue
        etiket = "paket" if kaynak in MODULLER else "gun"
        bilgi["cihaz"].setdefault(cihaz, []).append(kaynak)
        for alan, n in sorted((p.get("bekleyen") or {}).items()):
            bilgi["bekleyen"].setdefault(cihaz, {})[alan] = int(n)
        sirlar = sorted(k for k in (p.get("anahtarlar") or {}) if SIR_RE.search(k))
        if sirlar:
            hata.append("Pakette sır var, göç durdu: %s (%s)." % (ad, ", ".join(sirlar)))
            continue
        for profil, d in sorted((p.get("profiller") or {}).items()):
            veri = d.get("data", d) if isinstance(d, dict) else {}
            alan = "%s/%s" % (kaynak, profil)
            for yol_, deger in sorted(veri.items()):
                tur, neden = modul_turu(kaynak, yol_)
                sayim.oku(etiket, tur or yol_.split("/", 1)[0])
                if neden:
                    sayim.atla(etiket, yol_.split("/", 1)[0], neden)
                    continue
                adaylar[alan + "|" + yol_].append(dict(kaynak=etiket, tur=tur, alan=alan, yol=yol_, metin=kanon(deger),
                                                      zaman=kayit_zamani(deger), cihaz=cihaz))
        for anahtar, deger in sorted((p.get("anahtarlar") or {}).items()):
            gunluk = anahtar.startswith("lifeos.gun.") or anahtar.startswith("lifeos.bilinc")
            tur = "gun_kaydi" if gunluk else "anahtar"
            alan = ("gun/" if gunluk else kaynak + "/anahtar/") + cihaz
            sayim.oku(etiket, tur)
            adaylar[alan + "|" + anahtar].append(dict(kaynak=etiket, tur=tur, alan=alan, yol=anahtar, metin=kanon(deger),
                                                      zaman=kayit_zamani(deger), cihaz=cihaz))
        for m in p.get("medya") or []:
            sayim.oku(etiket, "medya")
            try:
                veri = base64.b64decode(m.get("veri") or "", validate=True)
            except ValueError:
                veri = None
            if veri is None or ozet(veri) != m.get("sha256") or len(veri) != m.get("boyut"):
                hata.append("Medya bozuk: %s içinde %s." % (ad, m.get("anahtar")))
                sayim.atla(etiket, "medya", "bozuk")
                continue
            onceki = medya.get(m["sha256"])
            if onceki:
                sayim.atla(etiket, "medya", "aynı dosya bir kez")
                continue
            medya[m["sha256"]] = dict(veri=veri, tur=m.get("tur") or "", sahip="%s|%s|%s" % (kaynak, m.get("db"), m.get("anahtar")))


def paket_kaydet(akis, uzunluk, klasor, zaman=None):
    """POST /api/hesap/goc-paket govdesi (Faz 1 P2): once yarim adla diske, bicim, sir ve medya denetimi,
    sonra kendi adiyla klasore. Ustune yazmaz; reddedilen paketten diskte iz kalmaz.
    Doner: {ad, bayt, kaynak, cihaz, profil, anahtar, medya, bekleyen}. Hata: ValueError((kod, cumle))."""
    if not isinstance(uzunluk, int) or isinstance(uzunluk, bool) or uzunluk <= 0:
        raise ValueError((400, "Paket boş."))
    if uzunluk > PAKET_EN_BUYUK:
        raise ValueError((413, "Paket çok büyük; medya daha küçük parçalara bölünmeli."))
    os.makedirs(klasor, exist_ok=True)
    yarim = os.path.join(klasor, ".yukleniyor-%s" % os.urandom(6).hex())
    try:
        kalan = uzunluk
        with open(yarim, "wb") as f:
            while kalan > 0:
                parca = akis.read(min(1 << 16, kalan))
                if not parca:
                    break
                f.write(parca)
                kalan -= len(parca)
        if kalan:
            raise ValueError((400, "Paket yarım geldi."))
        with open(yarim, "rb") as f:
            try:
                p = json.loads(f.read().decode("utf-8"))
            except (UnicodeDecodeError, ValueError):
                raise ValueError((400, "Paket okunamadı."))
        if not isinstance(p, dict) or p.get("lifeos_goc") != 1 or p.get("kaynak") not in PAKET_KAYNAK:
            raise ValueError((400, "Paket biçimi tanınmadı."))
        cihaz = p.get("cihaz")
        if not isinstance(cihaz, str) or not CIHAZ_RE.match(cihaz):
            raise ValueError((400, "Geçersiz cihaz kimliği."))
        if any(SIR_RE.search(k) for k in (p.get("anahtarlar") or {})):
            raise ValueError((400, "Pakette sır adlı anahtar var; kaydedilmedi."))
        for m in p.get("medya") or []:
            try:
                veri = base64.b64decode(m.get("veri") or "", validate=True)
            except (ValueError, AttributeError):
                veri = None
            if veri is None or ozet(veri) != m.get("sha256") or len(veri) != m.get("boyut"):
                raise ValueError((400, "Pakette bozuk medya var: %s." % str(m.get("anahtar"))[:80]))
        an = datetime.datetime.fromtimestamp(zaman) if zaman else datetime.datetime.now()
        ad = "%s-%s-%s-%s.json" % (p["kaynak"], cihaz, an.strftime("%Y%m%d-%H%M%S"), os.urandom(3).hex())
        hedef = os.path.join(klasor, ad)
        if os.path.exists(hedef):
            raise ValueError((409, "Aynı adla paket var."))
        os.rename(yarim, hedef)                     # Windows'ta rename de var olanin ustune yazmaz
        return {"ad": ad, "bayt": uzunluk, "kaynak": p["kaynak"], "cihaz": cihaz,
                "profil": len(p.get("profiller") or {}), "anahtar": len(p.get("anahtarlar") or {}),
                "medya": len(p.get("medya") or []), "bekleyen": p.get("bekleyen") or {}}
    finally:
        if os.path.exists(yarim):
            os.remove(yarim)


def topla_hkm(kopya, adaylar, sayim, bilgi, uyari):
    c = sqlite3.connect(kopya)
    try:
        tablolar = [r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")]
        bilgi["tablo"] = len(tablolar)
        for t in tablolar:
            sutun = [r[1] for r in c.execute('PRAGMA table_info("%s")' % t)]
            tur = HKM_GERCEK.get(t)
            if t not in HKM_GERCEK and t not in HKM_TURETILMIS:
                tur = "hkm." + t
                uyari.append("HKM tablosu katalogda yok, kendi adıyla taşınır: %s." % t)
            for satir in c.execute('SELECT rowid, * FROM "%s" ORDER BY rowid' % t):
                sayim.oku("hkm", tur or t)
                if t in HKM_TURETILMIS:
                    sayim.atla("hkm", t, "türetilmiş: yeniden hesaplanır")
                    continue
                govde = {k: ({"$b64": base64.b64encode(v).decode("ascii")} if isinstance(v, bytes) else v)
                         for k, v in zip(sutun, satir[1:])}
                alan = "hkm/" + t
                adaylar["%s|%d" % (alan, satir[0])].append(dict(kaynak="hkm", tur=tur, alan=alan, yol=str(satir[0]),
                                                               metin=kanon(govde), zaman=kayit_zamani(govde), cihaz="hkm"))
    finally:
        c.close()


def topla_pc(klasor, adaylar, sayim, dosyalar, bilgi):
    if not klasor or not os.path.isdir(klasor):
        bilgi["durum"] = "yok"
        return
    bilgi["durum"] = "okundu"
    ayar = os.path.join(klasor, "ayar.json")
    if os.path.isfile(ayar):
        with open(ayar, encoding="utf-8") as f:
            d = json.load(f)
        for k, v in sorted(d.items()):
            sayim.oku("pc", "tercih")
            adaylar["pc|ayar/" + k].append(dict(kaynak="pc", tur="tercih", alan="pc", yol="ayar/" + k, metin=kanon(v), zaman=0, cihaz="pc"))
    for ad, yol in (("planlama", "planlama.json"), ("ice", os.path.join("ice", "ice.json"))):
        tam = os.path.join(klasor, yol)
        if os.path.isfile(tam):
            with open(tam, encoding="utf-8") as f:
                v = json.load(f)
            sayim.oku("pc", ad)
            adaylar["pc|" + ad].append(dict(kaynak="pc", tur=ad, alan="pc", yol=ad, metin=kanon(v), zaman=0, cihaz="pc"))
    for alt in ("muzik", "zemin", "telefon"):
        kok = os.path.join(klasor, alt)
        for d, _, adlar in sorted(os.walk(kok)):
            for ad in sorted(adlar):
                tam = os.path.join(d, ad)
                goreli = os.path.relpath(tam, klasor).replace(os.sep, "/")
                sayim.oku("pc", "dosya:" + alt)
                if alt == "telefon":
                    sayim.atla("pc", "dosya:" + alt, "emekli: ev ağı sertifikası (karar 8)")
                    continue
                dosyalar[goreli] = (os.path.getsize(tam), dosya_ozeti(tam))


def sec(adaylar_):
    """Ayni kimlige birden cok aday: ayni govde -> biri; farkli -> kaydin KENDI zamani (sunucunun esitleme
    saati degil: paketteki kopyada o yok); karar yoksa catisma."""
    tekil = {}
    for a in adaylar_:
        tekil.setdefault(ozet(kanon(json.loads(a["metin"]))), []).append(a)
    if len(tekil) == 1:
        return adaylar_[0], [a for a in adaylar_[1:]], None
    sirali = sorted(adaylar_, key=lambda a: a["zaman"], reverse=True)
    if sirali[0]["zaman"] > 0 and sirali[0]["zaman"] > sirali[1]["zaman"]:
        return sirali[0], sirali[1:], None
    return None, adaylar_, sorted({a["kaynak"] + ":" + a["cihaz"] for a in adaylar_})


def goc(hedef_klasor, hesap=None, hkm=None, paket=None, pc=None):
    """Goc: kaynaklari kopyadan okur, hedef_klasor/lifeos.db + medya/'ya yazar, geri okuyup raporu dondurur."""
    gecici = tempfile.mkdtemp(prefix="lifeos-goc-")
    try:
        return _goc(hedef_klasor, gecici, hesap, hkm, paket, pc)
    finally:
        shutil.rmtree(gecici, ignore_errors=True)


def _goc(hedef_klasor, gecici, hesap, hkm, paket, pc):
    sayim, adaylar, medya, dosyalar = Sayim(), collections.defaultdict(list), {}, {}
    kaynak = {ad: {} for ad in ("hesap", "paket", "gun", "hkm", "pc")}
    uyari, hata = [], []
    k = hesap_kaynagi(hesap, gecici, kaynak["hesap"], uyari)
    if k:
        topla_hesap(k, adaylar, sayim, kaynak["hesap"])
    topla_paketler(paket, adaylar, sayim, medya, kaynak["paket"], uyari, hata)
    kaynak["gun"]["durum"] = "paketlerden ve sunucudaki son gün kopyasından"
    k = kopyala(hkm, gecici)
    if k:
        kaynak["hkm"].update(durum="okundu", ozet=dosya_ozeti(k))
        topla_hkm(k, adaylar, sayim, kaynak["hkm"], uyari)
    else:
        kaynak["hkm"]["durum"] = "yok"
    topla_pc(pc, adaylar, sayim, dosyalar, kaynak["pc"])

    h = hashlib.sha256(kanon(sorted(medya)).encode() + kanon(sorted(dosyalar.items())).encode())
    for kimlik in sorted(adaylar):
        h.update(kanon([kimlik] + [a["metin"] for a in adaylar[kimlik]]).encode("utf-8"))
    goc_id = h.hexdigest()[:16]

    os.makedirs(hedef_klasor, exist_ok=True)
    db = os.path.join(hedef_klasor, "lifeos.db")
    if os.path.exists(db):
        raise SystemExit("Hedefte zaten bir depo var, üstüne yazılmaz: " + db)
    c = sqlite3.connect(db)
    catisma, beklenen = [], {}
    try:
        c.executescript(SEMA)
        for kimlik in sorted(adaylar):
            secilen, digerleri, cat = sec(adaylar[kimlik])
            for a in digerleri:
                sayim.atla(a["kaynak"], a["tur"], "çatışma" if cat else ("ikinci kopya (aynı)" if secilen and ozet(kanon(json.loads(a["metin"]))) == ozet(kanon(json.loads(secilen["metin"]))) else "eski sürüm (kendi zamanı)"))
            if cat:
                catisma.append({"kimlik": kimlik, "kaynaklar": cat})
                continue
            govde = json.loads(secilen["metin"])
            etiket, say = etiketle(govde)
            sayim.etiket[secilen["tur"]].update(say)
            h = hlc(secilen.get("saat") or secilen["zaman"], secilen["cihaz"])
            c.execute("INSERT INTO kayit VALUES (?,?,?,?,?,?,?,?,?,0,?,?)",
                      (kimlik, secilen["tur"], 1, secilen["alan"], secilen["yol"], kanon(govde), kanon(etiket), h,
                       secilen["cihaz"], secilen["kaynak"], goc_id))
            c.execute("INSERT INTO olay(kayit_id, islem, hlc, cihaz, kaynak, goc_id) VALUES (?,?,?,?,?,?)",
                      (kimlik, "goc", h, secilen["cihaz"], "goc:" + secilen["kaynak"], goc_id))
            beklenen[kimlik] = ozet(kanon(govde))
        for sha, m in sorted(medya.items()):
            yer = os.path.join(hedef_klasor, "medya", sha[:2])
            os.makedirs(yer, exist_ok=True)
            with open(os.path.join(yer, sha), "wb") as f:
                f.write(m["veri"])
            c.execute("INSERT INTO medya VALUES (?,?,?,?,?)", (sha, m["tur"], len(m["veri"]), m["sahip"], goc_id))
        for yol, (boyut, sha) in sorted(dosyalar.items()):
            c.execute("INSERT INTO dosya VALUES (?,?,?,?)", (yol, boyut, sha, goc_id))
        c.commit()

        # Geri okuma: tasinan hedeften sayilir, govdeler kaynakla karsilastirilir.
        tasinan = collections.defaultdict(collections.Counter)
        bozuk = []
        for kimlik, tur, kay, govde in c.execute("SELECT id, tur, kaynak, govde FROM kayit ORDER BY id"):
            tasinan[kay][tur] += 1
            if ozet(kanon(json.loads(govde))) != beklenen.get(kimlik):
                bozuk.append(kimlik)
        for sha, sahip in c.execute("SELECT sha256, sahip FROM medya ORDER BY sha256"):
            tasinan["gun" if sahip.startswith("gun|") else "paket"]["medya"] += 1
            if dosya_ozeti(os.path.join(hedef_klasor, "medya", sha[:2], sha)) != sha:
                bozuk.append("medya:" + sha)
        for (alt,) in c.execute("SELECT yol FROM dosya ORDER BY yol"):
            tasinan["pc"]["dosya:" + alt.split("/", 1)[0]] += 1
    finally:
        c.close()

    tablo, denge = {}, True
    for kay in sorted(set(sayim.okunan) | set(tasinan)):
        for tur in sorted(set(sayim.okunan[kay]) | set(tasinan[kay]) | set(sayim.atlanan[kay])):
            ok, ta, at = sayim.okunan[kay][tur], tasinan[kay][tur], dict(sorted(sayim.atlanan[kay][tur].items()))
            tablo.setdefault(kay, {})[tur] = {"okunan": ok, "tasinan": ta, "atlanan": at}
            denge = denge and ok == ta + sum(at.values())
    bekleyen = sum(n for c_ in kaynak["paket"].get("bekleyen", {}).values() for n in c_.values())
    return {
        "goc_id": goc_id, "kaynak": kaynak, "sayim": tablo,
        "etiket": {t: dict(sorted(v.items())) for t, v in sorted(sayim.etiket.items()) if v},
        "medya": {"dosya": len(medya), "bayt": sum(len(m["veri"]) for m in medya.values())},
        "pc_dosya": {"dosya": len(dosyalar), "bayt": sum(b for b, _ in dosyalar.values())},
        # Paket yoksa bekleyen olculmedi: sifir yazilmaz (AGENTS §1.2).
        "bekleyen_toplam": bekleyen if kaynak["paket"]["paket"] else None, "catisma": catisma, "uyari": uyari, "hata": hata,
        "denge": denge, "gidis_donus": not bozuk, "bozuk": bozuk,
    }


def geri_al(hedef_klasor, goc_id):
    """Bir goc turunu tumden siler (faz1.md P6 geri donusu). Doner: silinen kayit sayisi."""
    c = sqlite3.connect(os.path.join(hedef_klasor, "lifeos.db"))
    try:
        for (sha,) in c.execute("SELECT sha256 FROM medya WHERE goc_id=?", (goc_id,)).fetchall():
            yol = os.path.join(hedef_klasor, "medya", sha[:2], sha)
            if os.path.exists(yol):
                os.remove(yol)
        n = c.execute("DELETE FROM kayit WHERE goc_id=?", (goc_id,)).rowcount
        for t in ("olay", "medya", "dosya"):
            c.execute("DELETE FROM %s WHERE goc_id=?" % t, (goc_id,))
        c.commit()
        return n
    finally:
        c.close()


ETIKET_ADI = {"measured": "ölçüldü", "estimated": "tahmin", "computed": "hesaplandı", "missing": "veri yok",
              "eski": "eski kayıt", "derived_cevrim": "derived → hesaplandı", "bilinmeyen_etiket": "tanınmayan etiket"}
KAYNAK_ADI = {"hesap": "Hesap sunucusu (hesap.db)", "paket": "Cihazların göç paketleri", "gun": "Gün geçmişi",
              "hkm": "HKM ambarı (hkm.db)", "pc": "PC dosyaları"}


def md(r):
    s = ["# Göç kuru koşusu", "", "Göç kimliği `%s`. Sayı dengesi: **%s**. Gidiş-dönüş: **%s**. Çatışma: %d. Cihazda bekleyen: %s."
         % (r["goc_id"], "tutuyor" if r["denge"] else "TUTMUYOR", "birebir" if r["gidis_donus"] else "BOZUK",
            len(r["catisma"]), "ölçülemedi (paket yok)" if r["bekleyen_toplam"] is None else r["bekleyen_toplam"]), ""]
    for x in r["hata"]:
        s.append("- **Hata:** " + x)
    for x in r["uyari"]:
        s.append("- Uyarı: " + x)
    s += ["", "## Kaynaklar", "", "| Kaynak | Durum | Ayrıntı |", "|---|---|---|"]
    for ad, b in r["kaynak"].items():
        ek = {k: v for k, v in b.items() if k not in ("durum", "ozet")}
        s.append("| %s | %s | %s |" % (KAYNAK_ADI[ad], b.get("durum", ""), kanon(ek) if ek else ""))
    s += ["", "## Kaynak × tür", "", "| Kaynak | Tür | Okunan | Taşınan | Atlanan |", "|---|---|---:|---:|---|"]
    for kay, turler in r["sayim"].items():
        for tur, v in turler.items():
            at = ", ".join("%s %d" % (n, x) for n, x in v["atlanan"].items())
            s.append("| %s | %s | %d | %d | %s |" % (kay, tur, v["okunan"], v["tasinan"], at))
    s += ["", "## Kesinlik etiketleri (taşınan kayıtlardaki sayılar)", "", "| Tür | Etiketler |", "|---|---|"]
    for tur, v in r["etiket"].items():
        s.append("| %s | %s |" % (tur, ", ".join("%s %d" % (ETIKET_ADI.get(k, k), n) for k, n in v.items())))
    s += ["", "Medya: %d dosya, %d bayt. PC dosyaları (yerinde kalır, sağlaması alındı): %d dosya, %d bayt."
          % (r["medya"]["dosya"], r["medya"]["bayt"], r["pc_dosya"]["dosya"], r["pc_dosya"]["bayt"])]
    if r["catisma"]:
        s += ["", "## Çatışmalar (sahibi görmeden gerçek göç yok)", ""] + ["- `%s`: %s" % (x["kimlik"], ", ".join(x["kaynaklar"])) for x in r["catisma"]]
    return "\n".join(s) + "\n"


def varsayilan():
    yerel = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
    sistem = os.path.join(os.path.expanduser("~"), "LifeOS-Sistem")
    return dict(hesap=os.path.join(yerel, "LifeOS", "hesap", "hesap.db"), hkm=os.path.join(sistem, "HKM", "db", "hkm.db"),
                paket=os.path.join(yerel, "LifeOS", "goc", "paket"), pc=os.path.join(yerel, "LifeOS"))


def main(argv=None):
    v = varsayilan()
    ap = argparse.ArgumentParser(description="LifeOS göç aracı (Faz 1). Yalnız kuru koşu.")
    ap.add_argument("--kuru", action="store_true", required=True, help="geçici hedefe göç et, say, raporla")
    ap.add_argument("--cikti", default=os.path.join(tempfile.gettempdir(), "lifeos-goc-kuru"))
    for ad in ("hesap", "hkm", "paket", "pc"):
        ap.add_argument("--" + ad, default=v[ad])
    a = ap.parse_args(argv)
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    hedef = tempfile.mkdtemp(prefix="lifeos-goc-hedef-")
    try:
        r = goc(hedef, a.hesap, a.hkm, a.paket, a.pc)
    finally:
        shutil.rmtree(hedef, ignore_errors=True)
    os.makedirs(a.cikti, exist_ok=True)
    with open(os.path.join(a.cikti, "goc-kuru.json"), "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(r, sort_keys=True, ensure_ascii=False, indent=1) + "\n")
    with open(os.path.join(a.cikti, "goc-kuru.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write(md(r))
    print(md(r))
    print("Rapor: " + a.cikti)
    return 0 if r["denge"] and r["gidis_donus"] and not r["hata"] else 1


if __name__ == "__main__":
    sys.exit(main())
