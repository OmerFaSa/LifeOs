"""SISTEM PLANLAMASI — haftalik cizgide acilis, kapanis ve periyodik isler.

Kullanici (2026-10-29): «sistemin kendini ne zaman baslatacagini, ne zaman
kapatacagini bir periyodik cizgi uzerinden haftalik olarak ayarlayalim; misal
her hafta cumartesi saat 7'de genel tarama; gerceklesmezse en musait vakitte
yapsin ya da onayimizi beklesin». Yeri: Ayarlar › Sistem › Sistem planlamasi.
Secimleri: tarama = guncelleme kontrolu, yedek, veri denetimi, haftalik ozet
«ve daha fazlasi»; acilis Windows'a kaydedilsin; kacan is icin her iste secim.

Sozler:
  1. YALNIZ BU BILGISAYAR. /api/planlama okunur ve yazilir yalniz 127.0.0.1'den;
     yazma X-LifeOS: planlama basligi ister (zemin.py ile ayni koruma).
  2. ISLER KAPALI BASLAR. Hicbir is kullanici acmadan calismaz. Acilan is,
     acildigi andan ONCEKI bir vadeyi «kacti» saymaz.
  3. KACAN IS: «hemen» ise LifeOS acilinca yapilir; «onay» ise Bekleyen'e
     duser, kullanici «Yap» ya da «Atla» der.
  4. HICBIR IS VERIYI DEGISTIRMEZ. Veri denetimi yalniz okur ve rapor eder;
     yedek yalniz kopya ekler; guncelleme yalniz «kur» seciliyse kurar.
  5. ACILIS Windows Gorev Zamanlayici'da «LifeOS\\Acilis» gorevidir; plan
     kaydedilince yazilir, kapaninca silinir. Baska isletim sisteminde yok
     ve bu soylenir. Kapanis'i sunucu kendisi uygular.
  6. KAYIT DEPONUN DISINDA: %LOCALAPPDATA%\\LifeOS\\planlama.json.
  7. ESNEK (kullanici, 2026-10-30: «her gun ayni saat olmak zorunda degil;
     daha degisik planlar»): acilis ve kapanisin her gunun kendi saati var
     (saatler[gun] ya da None = o gun yok); bir is birden cok gunde calisir.
     Eski bicim (gunler + tek saat, isde tek gun) okunurken cevrilir.
"""

import datetime
import json
import os
import re
import sqlite3
import subprocess
import threading
import time

GUN_KISA = ("Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz")
SCHTASKS_GUN = ("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN")
ISLER = (
    ("guncelleme", "Güncelleme", "Yeni sürüm var mı bakar; «kur» açıksa kurar"),
    ("yedek", "Yedek", "Bütün kayıtların tam yedeğini alır"),
    ("denetim", "Veri denetimi", "Bozuk ya da okunamayan kayıt var mı bakar; düzeltmez"),
    ("ozet", "Haftalık özet", "Merkez haftanın özetini çıkarır"),
    ("temizlik", "Artık temizliği", "Güncellemeden kalan geçici dosyaları siler"),
    ("hkm", "Merkez'i tazele", "Merkez açıksa yeniden başlatır"),
)
IS_IDLER = tuple(i[0] for i in ISLER)
SAAT_RE = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")
ZAMANINDA_SN = 10 * 60          # vadeden bu kadar sonrasina kadar «saatinde» sayilir
GOREV_ADI = "LifeOS\\Acilis"


def klasor():
    elle = os.environ.get("LIFEOS_PLAN_KLASOR")
    if elle:
        return elle
    if os.name == "nt":
        return os.path.join(os.environ.get("LOCALAPPDATA") or os.path.expanduser("~"), "LifeOS")
    return os.path.join(os.path.expanduser("~"), ".lifeos")


def varsayilan():
    return {
        "acilis": {"acik": False, "saatler": ["07:00"] * 7},
        "kapanis": {"acik": False, "saatler": ["23:30"] * 7},
        "isler": {i: {"acik": False, "gunler": [5], "saat": "07:00", "kacarsa": "hemen", "kur": False, "acildi": 0}
                  for i in IS_IDLER},
        "son": {},
        "bekleyen": [],
    }


def _yol(kok=None):
    return os.path.join(kok or klasor(), "planlama.json")


def oku(kok=None):
    p = varsayilan()
    try:
        with open(_yol(kok), encoding="utf-8") as f:
            v = json.load(f)
    except (OSError, ValueError):
        return p
    try:
        return dogrula(v, onceki=p, sakla_durum=True)
    except ValueError:
        return p


def yaz(plan, kok=None):
    k = kok or klasor()
    os.makedirs(k, exist_ok=True)
    gecici = _yol(k) + ".yaziliyor"
    with open(gecici, "w", encoding="utf-8") as f:
        json.dump(plan, f, ensure_ascii=False, indent=1)
    os.replace(gecici, _yol(k))


def _gunler(v):
    if not isinstance(v, list) or not v:
        raise ValueError((400, "En az bir gün seçilmeli."))
    g = sorted({int(x) for x in v if isinstance(x, int) and 0 <= x <= 6})
    if len(g) != len(v):
        raise ValueError((400, "Gün 0 (Pazartesi) ile 6 (Pazar) arasında olmalı."))
    return g


def _saat(v):
    if not isinstance(v, str) or not SAAT_RE.match(v):
        raise ValueError((400, "Saat SS:DD biçiminde olmalı (ör. 07:00)."))
    return v


def _saatler(x, vars_saat):
    """Gunun saatleri: yeni bicim saatler[7]; eski bicim gunler + saat (soz 7)."""
    if "saatler" in x:
        l = x["saatler"]
        if not isinstance(l, list) or len(l) != 7:
            raise ValueError((400, "Her gün için bir saat ya da boş olmalı (7 gün)."))
        return [None if g in (None, "") else _saat(g) for g in l]
    gunler = _gunler(x.get("gunler", list(range(7))))
    saat = _saat(x.get("saat", vars_saat))
    return [saat if g in gunler else None for g in range(7)]


def dogrula(v, onceki=None, simdi=None, sakla_durum=False):
    """Gelen plani dogrular ve tamamlar. Yeni acilan isin «acildi» zamani
    simdi olur (soz 2). sakla_durum: dosyadan okunuyorsa son/bekleyen kalir."""
    if not isinstance(v, dict):
        raise ValueError((400, "Plan okunamadı."))
    onceki = onceki or varsayilan()
    simdi = time.time() if simdi is None else simdi
    p = varsayilan()
    for ad in ("acilis", "kapanis"):
        x = v.get(ad) or {}
        saatler = _saatler(x, p[ad]["saatler"][0])
        p[ad] = {"acik": bool(x.get("acik")) and any(saatler), "saatler": saatler}
    gelen = v.get("isler") or {}
    for i in IS_IDLER:
        x = gelen.get(i) or {}
        o = onceki["isler"].get(i) or {}
        gun = x.get("gun", 5)
        if "gunler" not in x and (not isinstance(gun, int) or not 0 <= gun <= 6):
            raise ValueError((400, "Gün 0 (Pazartesi) ile 6 (Pazar) arasında olmalı."))
        gunler = _gunler(x["gunler"]) if "gunler" in x else [gun]
        kacarsa = x.get("kacarsa", "hemen")
        if kacarsa not in ("hemen", "onay"):
            raise ValueError((400, "Kaçarsa «hemen» ya da «onay» olmalı."))
        acik = bool(x.get("acik"))
        acildi = x.get("acildi", 0) if sakla_durum else (o.get("acildi", 0) if o.get("acik") and acik else (simdi if acik else 0))
        p["isler"][i] = {"acik": acik, "gunler": gunler, "saat": _saat(x.get("saat", "07:00")), "kacarsa": kacarsa,
                         "kur": bool(x.get("kur")) if i == "guncelleme" else False, "acildi": acildi or 0}
    if sakla_durum:
        p["son"] = v.get("son") if isinstance(v.get("son"), dict) else {}
        p["bekleyen"] = [b for b in (v.get("bekleyen") or []) if b in IS_IDLER]
    else:
        p["son"] = onceki.get("son", {})
        p["bekleyen"] = [b for b in onceki.get("bekleyen", []) if p["isler"][b]["acik"]]
    return p


def son_vade(gun, saat, simdi):
    """`simdi`den (datetime) once ya da ona esit en yakin haftalik vade."""
    s, d = (int(x) for x in saat.split(":"))
    aday = simdi.replace(hour=s, minute=d, second=0, microsecond=0) - datetime.timedelta(days=(simdi.weekday() - gun) % 7)
    if aday > simdi:
        aday -= datetime.timedelta(days=7)
    return aday


def is_vadesi(x, simdi):
    """Isin gunlerinden `simdi`ye en yakin gecmis vade."""
    return max(son_vade(g, x["saat"], simdi) for g in x["gunler"])


def vadesi_gelenler(plan, simdi):
    """[(is, «saatinde» | «kacti»)] — calisilmasi ya da sorulmasi gerekenler."""
    l = []
    for i in IS_IDLER:
        x = plan["isler"][i]
        if not x["acik"] or i in plan["bekleyen"]:
            continue
        vz = is_vadesi(x, simdi).timestamp()
        if vz < (x.get("acildi") or 0):
            continue                                    # acilmadan onceki vade sayilmaz (soz 2)
        son = (plan["son"].get(i) or {}).get("vade", 0)
        if son >= vz:
            continue                                    # bu vade zaten yapildi ya da soruldu
        l.append((i, "saatinde" if simdi.timestamp() - vz <= ZAMANINDA_SN else "kacti"))
    return l


def kapanis_vakti(plan, simdi, son_kapanis):
    k = plan["kapanis"]
    saat = k["saatler"][simdi.weekday()]
    if not k["acik"] or not saat:
        return False
    v = son_vade(simdi.weekday(), saat, simdi)
    return v.date() == simdi.date() and 0 <= (simdi - v).total_seconds() <= ZAMANINDA_SN and son_kapanis < v.timestamp()


def veri_denetimi(db_yolu):
    """Yalniz okur: SQLite butunlugu ve okunamayan kayit sayisi."""
    if not db_yolu or not os.path.isfile(db_yolu):
        return True, "Hesap deposu yok; denetlenecek kayıt yok."
    c = sqlite3.connect("file:%s?mode=ro" % db_yolu.replace("\\", "/"), uri=True, timeout=30)
    try:
        sonuc = c.execute("PRAGMA integrity_check").fetchone()[0]
        bozuk, toplam = 0, 0
        try:
            for (deger,) in c.execute("SELECT deger FROM kayit WHERE deger IS NOT NULL"):
                toplam += 1
                try:
                    json.loads(deger)
                except (ValueError, TypeError):
                    bozuk += 1
        except sqlite3.Error:
            pass
    finally:
        c.close()
    if sonuc != "ok":
        return False, "Depo bütünlüğü bozuk: %s" % str(sonuc)[:120]
    if bozuk:
        return False, "%d kayıttan %d tanesi okunamıyor; değiştirilmedi." % (toplam, bozuk)
    return True, "Temiz: %d kayıt okundu, bütünlük sağlam." % toplam


def gorev_adi(n):
    """Ayni saatteki gunler tek gorev: 1. «LifeOS\\Acilis», sonrakiler «LifeOS\\Acilis 2» ..."""
    return GOREV_ADI if n == 1 else "%s %d" % (GOREV_ADI, n)


def acilis_gorevi(acilis, bat, isletim=None, calistir=subprocess.run):
    """Windows Gorev Zamanlayici'ya acilis gorevlerini yazar ya da siler (soz 5, 7).
    Her farkli saat bir gorevdir; eskiler once silinir (en cok 7)."""
    if (isletim or os.name) != "nt":
        return False, "Kendiliğinden açılış yalnız Windows'ta; bu bilgisayarda LifeOS'u elle aç."
    silinen = [calistir(["schtasks", "/Delete", "/F", "/TN", gorev_adi(n)], capture_output=True, text=True).returncode == 0
               for n in range(1, 8)]
    if not acilis["acik"]:
        return True, "Açılış görevi kaldırıldı." if any(silinen) else "Kayıtlı açılış görevi yoktu."
    gruplar = {}
    for g, saat in enumerate(acilis["saatler"]):
        if saat:
            gruplar.setdefault(saat, []).append(g)
    ozet = []
    for n, (saat, gunler) in enumerate(sorted(gruplar.items()), 1):
        r = calistir(["schtasks", "/Create", "/F", "/SC", "WEEKLY", "/D", ",".join(SCHTASKS_GUN[g] for g in gunler), "/ST", saat,
                      "/TN", gorev_adi(n), "/TR", '"%s"' % bat], capture_output=True, text=True)
        if r.returncode != 0:
            return False, "Windows açılış görevini kaydetmedi: %s" % ((r.stderr or r.stdout or "").strip()[:160] or "bilinmeyen hata")
        ozet.append("%s %s" % (", ".join(GUN_KISA[g] for g in gunler), saat))
    return True, "Açılış Windows'a kaydedildi: %s." % "; ".join(ozet)


class Zamanlayici:
    """Sunucu acikken her yarim dakikada vadeyi denetler. araclar: {is: fn() -> (ok, mesaj)}
    ve "kapat": fn(). Islerin kendisi sunucudadir; burada yalniz ne zaman."""

    def __init__(self, araclar, kok=None, saat=None):
        self.araclar = araclar
        self.kok = kok
        self.saat = saat or datetime.datetime.now
        self.kilit = threading.Lock()
        self.calisan = set()
        self.son_kapanis = time.time()

    def yap(self, i, vade=None):
        """Isi simdi yapar ve sonucu yazar (elle «Yap» da buradan)."""
        with self.kilit:
            if i in self.calisan:
                return False
            self.calisan.add(i)
        try:
            try:
                ok, mesaj = self.araclar[i]()
            except Exception as e:                       # bir isin hatasi oteki isleri durdurmaz
                ok, mesaj = False, "Yapılamadı: %s" % e
            with self.kilit:
                p = oku(self.kok)
                p["son"][i] = {"zaman": time.time(), "vade": vade if vade is not None else time.time(), "ok": bool(ok), "mesaj": str(mesaj)[:400]}
                p["bekleyen"] = [b for b in p["bekleyen"] if b != i]
                yaz(p, self.kok)
            return True
        finally:
            with self.kilit:
                self.calisan.discard(i)

    def atla(self, i):
        with self.kilit:
            p = oku(self.kok)
            vade = is_vadesi(p["isler"][i], self.saat()).timestamp()
            p["son"][i] = dict(p["son"].get(i) or {}, vade=vade)
            p["bekleyen"] = [b for b in p["bekleyen"] if b != i]
            yaz(p, self.kok)

    def tur(self):
        """Bir denetim: vadesi gelen isi yapar ya da Bekleyen'e koyar; kapanis."""
        simdi = self.saat()
        p = oku(self.kok)
        for i, hal in vadesi_gelenler(p, simdi):
            vade = is_vadesi(p["isler"][i], simdi).timestamp()
            if hal == "kacti" and p["isler"][i]["kacarsa"] == "onay":
                with self.kilit:
                    q = oku(self.kok)
                    if i not in q["bekleyen"]:
                        q["bekleyen"].append(i)
                    q["son"][i] = dict(q["son"].get(i) or {}, vade=vade)
                    yaz(q, self.kok)
            else:
                threading.Thread(target=self.yap, args=(i, vade), daemon=True).start()
        if kapanis_vakti(p, simdi, self.son_kapanis) and "kapat" in self.araclar:
            self.son_kapanis = time.time()
            self.araclar["kapat"]()

    def baslat(self, aralik=30):
        def dongu():
            time.sleep(20)                               # acilisin ilk anini isle bogma
            while True:
                try:
                    self.tur()
                except Exception:
                    pass
                time.sleep(aralik)
        threading.Thread(target=dongu, daemon=True).start()


def _yanit(h, kod, veri):
    govde = json.dumps(veri, ensure_ascii=False).encode("utf-8")
    h.send_response(kod)
    h.send_header("Content-Type", "application/json; charset=utf-8")
    h.send_header("Content-Length", str(len(govde)))
    h.send_header("Cache-Control", "no-store")
    h.end_headers()
    h.wfile.write(govde)


def isle(h, zamanlayici, bat):
    """GET /api/planlama · POST /api/planlama · POST /api/planlama/yap/<is> · POST /api/planlama/atla/<is>"""
    if h.client_address[0] not in ("127.0.0.1", "::1"):
        return _yanit(h, 403, {"hata": "Sistem planlaması yalnız bu bilgisayardan."})
    yol = h.path.split("?", 1)[0].rstrip("/")
    if h.command == "GET" and yol == "/api/planlama":
        return _yanit(h, 200, {"plan": oku(zamanlayici.kok), "isler": [{"id": a, "ad": b, "not": c} for a, b, c in ISLER],
                               "gunler": list(GUN_KISA), "windows": os.name == "nt", "calisan": sorted(zamanlayici.calisan)})
    if h.command != "POST":
        return _yanit(h, 405, {"hata": "Desteklenmiyor."})
    if h.headers.get("X-LifeOS") != "planlama":
        return _yanit(h, 403, {"hata": "Plan yalnız LifeOS'un kendi sayfasından değişir."})
    if yol == "/api/planlama":
        try:
            boy = min(int(h.headers.get("Content-Length") or 0), 64 * 1024)
            gelen = json.loads(h.rfile.read(boy).decode("utf-8") or "{}")
            onceki = oku(zamanlayici.kok)
            p = dogrula(gelen, onceki=onceki)
        except (ValueError, UnicodeDecodeError) as e:
            kod, cumle = e.args[0] if e.args and isinstance(e.args[0], tuple) else (400, "Plan okunamadı.")
            return _yanit(h, kod, {"hata": cumle})
        mesaj = ""
        if p["acilis"] != onceki["acilis"]:
            _, mesaj = acilis_gorevi(p["acilis"], bat)
        with zamanlayici.kilit:
            yaz(p, zamanlayici.kok)
        return _yanit(h, 200, {"plan": p, "mesaj": mesaj})
    m = re.match(r"^/api/planlama/(yap|atla)/([a-z]+)$", yol)
    if not m or m.group(2) not in IS_IDLER:
        return _yanit(h, 404, {"hata": "Böyle bir iş yok."})
    if m.group(1) == "atla":
        zamanlayici.atla(m.group(2))
        return _yanit(h, 200, {"ok": True})
    threading.Thread(target=zamanlayici.yap, args=(m.group(2),), daemon=True).start()
    return _yanit(h, 202, {"ok": True})
