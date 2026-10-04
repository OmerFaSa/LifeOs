#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""LifeOS — HESAP ve ESITLEME (PC sunucusu).

   NEDEN
   Depo sahibinin karari (2026-10-04): PC, telefon ve tablet AYNI hesapla
   girer; verinin kopyasi PC'deki bu sunucuda durur. Cihaz cevrimdisiyken
   degisiklik sirada bekler, sunucuya ulasinca akar. Sunucu kullanicinin
   KENDI bilgisayaridir: veri hicbir sirketin sunucusuna gitmez.

   SOZLER
   1. VERI CIHAZDA DA KALIR. Her modul once kendi tarayici deposuna
      yazar; sunucu bir kopyadir. PC kapali ya da ev disindayken hicbir
      sey bozulmaz, yavaslamaz; degisiklik sirada bekler.
   2. KAYIT DUZEYINDE SON YAZAN KAZANIR. Anahtar, modulun depo yoludur
      («vitals/2026-10-04»). Iki cihaz ayni kaydi degistirirse zamani yeni
      olan kalir; esit zamanda cihaz kimligi karar verir (her yerde ayni
      sonuc). Silme bir «mezar tasi»dir: oteki cihazlara da gider.
   3. ILK ESITLEME EZMEZ. Bir cihaz bir alani ilk kez esitlerken kendi
      kayitlarini «ilk» isaretiyle yollar: sunucuda olan yol degismez,
      olmayan eklenir. Telefondaki deneme verisi PC'deki gercek kaydi
      ezemez; sunucudaki surum cihaza iner.
   4. PAROLA DUZ TUTULMAZ. PBKDF2-HMAC-SHA256, kullanici basina tuz. Jetonun
      kendisi degil SHA-256 ozeti saklanir. Art arda yanlis giriste
      bekletilir; olmayan kullanicida da ayni hesap yapilir (ad sizmaz).
   5. ADMIN YALNIZ PC'DEN KURULUR. Hic kullanici yokken ilk hesap (admin)
      yalniz bu bilgisayarin kendisinden (127.0.0.1) kurulur. Ev agindaki
      bir cihaz admin olamaz, kurulumu da kapamaz.
   6. VERI DEPONUN DISINDA. %LOCALAPPDATA%\\LifeOS\\hesap\\hesap.db
      (Windows) ya da ~/.lifeos/hesap: commit'e giremez, guncelleme ona
      dokunmaz. LIFEOS_HESAP_KLASOR testler icin.

   Yalniz Python standart kutuphanesi (AGENTS §1.3).
"""

import contextlib
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import threading
import time

SURUM = 1
TUR = 600000                    # PBKDF2 tur sayisi (OWASP 2023, SHA-256)
EN_KISA_PAROLA = 8
EN_UZUN_PAROLA = 256
AD_RE = re.compile(r"^[0-9A-Za-zÇĞİÖŞÜçğıöşü_.\-]{2,32}$")
ALAN_RE = re.compile(r"^(ays|spi|esp)/[A-Za-z0-9_.\-]{1,40}$")
CIHAZ_RE = re.compile(r"^[A-Za-z0-9_\-]{6,64}$")
YOL_EN_UZUN = 300
KAYIT_EN_BUYUK = 2 * 1024 * 1024      # tek kayit (JSON); fotograf buraya girmez
GOVDE_EN_BUYUK = 24 * 1024 * 1024
GONDER_EN_COK = 5000
SINIR = 1000                          # tek cevapta en cok kayit
OTURUM_GUN = 400
DENEME_ESIK = 5                       # bu kadar yanlistan sonra bekletilir
DENEME_TAVAN_SN = 900

SEMA = """
PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS kullanici(
  id INTEGER PRIMARY KEY,
  ad TEXT NOT NULL UNIQUE COLLATE NOCASE,
  rol TEXT NOT NULL,
  tuz BLOB NOT NULL,
  ozet BLOB NOT NULL,
  tur INTEGER NOT NULL,
  olusturma TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS oturum(
  ozet TEXT PRIMARY KEY,
  kullanici INTEGER NOT NULL,
  cihaz TEXT NOT NULL,
  cihaz_ad TEXT,
  olusturma REAL NOT NULL,
  son REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS kayit(
  kullanici INTEGER NOT NULL,
  alan TEXT NOT NULL,
  yol TEXT NOT NULL,
  deger TEXT,
  zaman INTEGER NOT NULL,
  cihaz TEXT NOT NULL,
  sira INTEGER NOT NULL,
  PRIMARY KEY(kullanici, alan, yol)
);
CREATE INDEX IF NOT EXISTS kayit_sira ON kayit(kullanici, alan, sira);
CREATE TABLE IF NOT EXISTS sayac(ad TEXT PRIMARY KEY, deger INTEGER NOT NULL);
"""


def klasor():
    elle = os.environ.get("LIFEOS_HESAP_KLASOR")
    if elle:
        return elle
    if os.name == "nt":
        temel = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
        return os.path.join(temel, "LifeOS", "hesap")
    return os.path.join(os.path.expanduser("~"), ".lifeos", "hesap")


class Hata(Exception):
    """Kullaniciya gidecek hata: HTTP kodu + Turkce cumle."""

    def __init__(self, kod, mesaj):
        super().__init__(mesaj)
        self.kod = kod
        self.mesaj = mesaj


def _jeton_ozeti(jeton):
    return hashlib.sha256(jeton.encode("utf-8")).hexdigest()


class Depo:
    def __init__(self, yol=None, tur=TUR, saat=time.time):
        self.yol = yol or os.path.join(klasor(), "hesap.db")
        os.makedirs(os.path.dirname(self.yol) or ".", exist_ok=True)
        self.kilit = threading.RLock()
        self.tur = tur
        self.saat = saat
        self._deneme = {}               # anahtar -> [yanlis sayisi, bekleme bitisi]
        with self._islem() as c:
            c.executescript(SEMA)

    @contextlib.contextmanager
    def _islem(self):
        with self.kilit:
            c = sqlite3.connect(self.yol, timeout=30)
            c.row_factory = sqlite3.Row
            try:
                yield c
                c.commit()
            except BaseException:
                c.rollback()
                raise
            finally:
                c.close()

    # ------------------------------------------------------------ parola

    def _ozet(self, parola, tuz, tur):
        return hashlib.pbkdf2_hmac("sha256", parola.encode("utf-8"), tuz, tur)

    @staticmethod
    def _ad_dogrula(ad):
        ad = (ad or "").strip()
        if not AD_RE.match(ad):
            raise Hata(400, "Kullanıcı adı 2–32 karakter olmalı: harf, rakam, nokta, tire, alt çizgi.")
        return ad

    @staticmethod
    def _parola_dogrula(parola):
        if not isinstance(parola, str) or len(parola) < EN_KISA_PAROLA:
            raise Hata(400, "Parola en az %d karakter olmalı." % EN_KISA_PAROLA)
        if len(parola) > EN_UZUN_PAROLA:
            raise Hata(400, "Parola çok uzun.")
        return parola

    def _kullanici_yaz(self, c, ad, parola, rol):
        tuz = secrets.token_bytes(16)
        try:
            cur = c.execute(
                "INSERT INTO kullanici(ad, rol, tuz, ozet, tur, olusturma) VALUES(?,?,?,?,?,?)",
                (ad, rol, tuz, self._ozet(parola, tuz, self.tur), self.tur,
                 time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime(self.saat()))))
        except sqlite3.IntegrityError:
            raise Hata(409, "Bu adla bir kullanıcı zaten var.")
        return cur.lastrowid

    # ------------------------------------------------------------ oturum

    def _oturum_ac(self, c, kullanici, cihaz, cihaz_ad):
        jeton = secrets.token_urlsafe(32)
        simdi = self.saat()
        c.execute("INSERT INTO oturum(ozet, kullanici, cihaz, cihaz_ad, olusturma, son) VALUES(?,?,?,?,?,?)",
                  (_jeton_ozeti(jeton), kullanici, cihaz or "", (cihaz_ad or "")[:80], simdi, simdi))
        return jeton

    def _kullanici(self, c, kid):
        r = c.execute("SELECT id, ad, rol FROM kullanici WHERE id=?", (kid,)).fetchone()
        return {"id": r["id"], "ad": r["ad"], "rol": r["rol"]} if r else None

    def kurulum_gerekli(self):
        with self._islem() as c:
            return c.execute("SELECT COUNT(*) FROM kullanici").fetchone()[0] == 0

    def kur(self, ad, parola, yerel, cihaz="", cihaz_ad=""):
        """Ilk hesap (admin). Yalniz hic kullanici yokken ve yalniz PC'den."""
        if not yerel:
            raise Hata(403, "Admin hesabı yalnız bu bilgisayardan kurulur.")
        ad = self._ad_dogrula(ad)
        self._parola_dogrula(parola)
        with self._islem() as c:
            if c.execute("SELECT COUNT(*) FROM kullanici").fetchone()[0]:
                raise Hata(409, "Admin hesabı zaten kurulmuş; giriş yap.")
            kid = self._kullanici_yaz(c, ad, parola, "admin")
            return {"jeton": self._oturum_ac(c, kid, cihaz, cihaz_ad),
                    "kullanici": self._kullanici(c, kid)}

    def _deneme_bak(self, anahtarlar):
        simdi = self.saat()
        for a in anahtarlar:
            d = self._deneme.get(a)
            if d and d[1] > simdi:
                raise Hata(429, "Çok fazla yanlış deneme. %d saniye sonra yeniden dene."
                           % int(d[1] - simdi + 1))

    def _deneme_yanlis(self, anahtarlar):
        simdi = self.saat()
        for a in anahtarlar:
            d = self._deneme.setdefault(a, [0, 0.0])
            d[0] += 1
            if d[0] >= DENEME_ESIK:
                d[1] = simdi + min(DENEME_TAVAN_SN, 30 * 2 ** (d[0] - DENEME_ESIK))

    def giris(self, ad, parola, cihaz="", cihaz_ad="", ip=""):
        ad = (ad or "").strip()
        anahtarlar = [("ad", ad.lower()), ("ip", ip)]
        with self.kilit:
            self._deneme_bak(anahtarlar)
        if not isinstance(parola, str):
            parola = ""
        with self._islem() as c:
            r = c.execute("SELECT id, tuz, ozet, tur FROM kullanici WHERE ad=?", (ad,)).fetchone()
            if r is None:
                # Olmayan kullanicida da ayni hesap: sure adi sizdirmasin.
                self._ozet(parola, b"\0" * 16, self.tur)
                dogru = False
            else:
                dogru = hmac.compare_digest(self._ozet(parola, r["tuz"], r["tur"]), r["ozet"])
            if not dogru:
                with self.kilit:
                    self._deneme_yanlis(anahtarlar)
                raise Hata(401, "Kullanıcı adı ya da parola yanlış.")
            with self.kilit:
                for a in anahtarlar:
                    self._deneme.pop(a, None)
            return {"jeton": self._oturum_ac(c, r["id"], cihaz, cihaz_ad),
                    "kullanici": self._kullanici(c, r["id"])}

    def oturum(self, jeton):
        """Jeton gecerliyse kullanici, degilse None."""
        if not jeton or not isinstance(jeton, str) or len(jeton) > 200:
            return None
        oz = _jeton_ozeti(jeton)
        simdi = self.saat()
        with self._islem() as c:
            r = c.execute("SELECT kullanici, son FROM oturum WHERE ozet=?", (oz,)).fetchone()
            if r is None:
                return None
            if simdi - r["son"] > OTURUM_GUN * 86400:
                c.execute("DELETE FROM oturum WHERE ozet=?", (oz,))
                return None
            if simdi - r["son"] > 60:
                c.execute("UPDATE oturum SET son=? WHERE ozet=?", (simdi, oz))
            return self._kullanici(c, r["kullanici"])

    def cikis(self, jeton):
        with self._islem() as c:
            c.execute("DELETE FROM oturum WHERE ozet=?", (_jeton_ozeti(jeton or ""),))

    def parola_degistir(self, kullanici, jeton, eski, yeni):
        self._parola_dogrula(yeni)
        with self._islem() as c:
            r = c.execute("SELECT tuz, ozet, tur FROM kullanici WHERE id=?", (kullanici["id"],)).fetchone()
            if r is None or not hmac.compare_digest(self._ozet(eski or "", r["tuz"], r["tur"]), r["ozet"]):
                raise Hata(401, "Şimdiki parola yanlış.")
            tuz = secrets.token_bytes(16)
            c.execute("UPDATE kullanici SET tuz=?, ozet=?, tur=? WHERE id=?",
                      (tuz, self._ozet(yeni, tuz, self.tur), self.tur, kullanici["id"]))
            # Oteki cihazlarin oturumu kapanir; bu cihazinki kalir.
            c.execute("DELETE FROM oturum WHERE kullanici=? AND ozet<>?",
                      (kullanici["id"], _jeton_ozeti(jeton or "")))

    def kullanici_ekle(self, yapan, ad, parola, rol="uye"):
        if not yapan or yapan.get("rol") != "admin":
            raise Hata(403, "Kullanıcıyı yalnız admin ekler.")
        if rol not in ("admin", "uye"):
            raise Hata(400, "Rol «admin» ya da «uye» olmalı.")
        ad = self._ad_dogrula(ad)
        self._parola_dogrula(parola)
        with self._islem() as c:
            kid = self._kullanici_yaz(c, ad, parola, rol)
            return self._kullanici(c, kid)

    def kullanicilar(self, yapan):
        if not yapan or yapan.get("rol") != "admin":
            raise Hata(403, "Kullanıcı listesini yalnız admin görür.")
        with self._islem() as c:
            return [{"id": r["id"], "ad": r["ad"], "rol": r["rol"], "olusturma": r["olusturma"]}
                    for r in c.execute("SELECT id, ad, rol, olusturma FROM kullanici ORDER BY id")]

    # ---------------------------------------------------------- esitleme

    def _sira(self, c):
        r = c.execute("SELECT deger FROM sayac WHERE ad='sira'").fetchone()
        return r["deger"] if r else 0

    def esitle(self, kullanici, alan, cihaz, son, gonder, sinir=SINIR):
        """Cihazdan gelenleri uygular, cihazin gormedigi degisiklikleri dondurur.

        gonder: [{"y": yol, "d": deger | None (silme), "z": ms, "ilk": bool}]
        Doner: {"al": [{"y", "d", "z", "s"}], "son": imlec, "daha": bool,
                "kabul": n, "red": n}"""
        if not isinstance(alan, str) or not ALAN_RE.match(alan):
            raise Hata(400, "Geçersiz alan.")
        if not isinstance(cihaz, str) or not CIHAZ_RE.match(cihaz):
            raise Hata(400, "Geçersiz cihaz kimliği.")
        if not isinstance(son, int) or isinstance(son, bool) or son < 0:
            raise Hata(400, "Geçersiz imleç.")
        if not isinstance(gonder, list) or len(gonder) > GONDER_EN_COK:
            raise Hata(400, "Gönderim listesi geçersiz ya da çok uzun.")
        sinir = max(1, min(int(sinir or SINIR), SINIR))
        temiz = []
        for g in gonder:
            if not isinstance(g, dict):
                raise Hata(400, "Geçersiz kayıt.")
            y, z = g.get("y"), g.get("z")
            if not isinstance(y, str) or not y or len(y) > YOL_EN_UZUN or any(ord(ch) < 32 for ch in y):
                raise Hata(400, "Geçersiz kayıt yolu.")
            if not isinstance(z, int) or isinstance(z, bool) or z < 0:
                raise Hata(400, "Geçersiz kayıt zamanı.")
            d = g.get("d")
            metin = None if d is None else json.dumps(d, ensure_ascii=False, separators=(",", ":"))
            if metin is not None and len(metin) > KAYIT_EN_BUYUK:
                raise Hata(413, "Bir kayıt çok büyük: %s" % y[:60])
            temiz.append((y, metin, z, bool(g.get("ilk"))))

        kid = kullanici["id"]
        with self._islem() as c:
            sira = self._sira(c)
            kabul = red = 0
            for y, metin, z, ilk in temiz:
                r = c.execute("SELECT zaman, cihaz FROM kayit WHERE kullanici=? AND alan=? AND yol=?",
                              (kid, alan, y)).fetchone()
                if r is not None:
                    if ilk or (z, cihaz) <= (r["zaman"], r["cihaz"]):
                        red += 1
                        continue
                elif ilk and metin is None:
                    continue                    # ilk esitlemede silme anlamsiz
                sira += 1
                c.execute("INSERT INTO kayit(kullanici, alan, yol, deger, zaman, cihaz, sira) "
                          "VALUES(?,?,?,?,?,?,?) ON CONFLICT(kullanici, alan, yol) DO UPDATE SET "
                          "deger=excluded.deger, zaman=excluded.zaman, cihaz=excluded.cihaz, "
                          "sira=excluded.sira", (kid, alan, y, metin, z, cihaz, sira))
                kabul += 1
            c.execute("INSERT INTO sayac(ad, deger) VALUES('sira', ?) ON CONFLICT(ad) DO UPDATE "
                      "SET deger=excluded.deger", (sira,))
            satirlar = c.execute(
                "SELECT yol, deger, zaman, cihaz, sira FROM kayit WHERE kullanici=? AND alan=? "
                "AND sira>? ORDER BY sira LIMIT ?", (kid, alan, son, sinir + 1)).fetchall()
        daha = len(satirlar) > sinir
        satirlar = satirlar[:sinir]
        yeni_son = satirlar[-1]["sira"] if daha else max(son, sira)
        al = [{"y": s["yol"], "d": None if s["deger"] is None else json.loads(s["deger"]),
               "z": s["zaman"], "s": s["sira"]}
              for s in satirlar if s["cihaz"] != cihaz]
        return {"al": al, "son": yeni_son, "daha": daha, "kabul": kabul, "red": red}

    def ozet(self, kullanici):
        """Alan basina kayit sayisi (hesap panelindeki bilgi)."""
        with self._islem() as c:
            return {r["alan"]: r["n"] for r in c.execute(
                "SELECT alan, COUNT(*) AS n FROM kayit WHERE kullanici=? AND deger IS NOT NULL "
                "GROUP BY alan", (kullanici["id"],))}


# ================================================================ HTTP

# Telefon uygulamasinin sayfalari (uygulama/ios, YerelSunucu.swift) PC'ye
# BASKA kokenden gelir; yalniz bunlara capraz kaynak izni verilir.
UYGULAMA_KOKENLERI = re.compile(r"^http://(127\.0\.0\.1|localhost):(4173|4183|4193|4180)$")

_DEPO = None
_DEPO_KILIT = threading.Lock()


def depo():
    global _DEPO
    with _DEPO_KILIT:
        if _DEPO is None:
            _DEPO = Depo()
        return _DEPO


def depo_kur(d):
    """Testler icin: gecici bir depo tak."""
    global _DEPO
    with _DEPO_KILIT:
        _DEPO = d


def ev_agi():
    """Telefon ve tabletin yazacagi adres(ler): ev agi https acik ise
    bilgisayarin agdaki IP'leri, degilse bos liste (sistem/telefon.py)."""
    try:
        import telefon
        return list(telefon.ipler()) if telefon.acik_mi() else []
    except Exception:          # telefon modulu yoksa ya da ag okunamadiysa
        return []


def _koken_izinli(h):
    """Ayni koken (Origin yok ya da Host ile ayni) ya da telefon uygulamasi."""
    koken = h.headers.get("Origin")
    if not koken:
        return True
    host = h.headers.get("Host") or ""
    if koken.split("://", 1)[-1] == host:
        return True
    return bool(UYGULAMA_KOKENLERI.match(koken))


def _yerel_mi(h):
    ip = (h.client_address or ("",))[0]
    return ip in ("127.0.0.1", "::1", "::ffff:127.0.0.1")


def _cevap(h, kod, veri):
    govde = json.dumps(veri, ensure_ascii=False).encode("utf-8")
    h.send_response(kod)
    koken = h.headers.get("Origin")
    if koken and UYGULAMA_KOKENLERI.match(koken):
        h.send_header("Access-Control-Allow-Origin", koken)
        h.send_header("Vary", "Origin")
    h.send_header("Content-Type", "application/json; charset=utf-8")
    h.send_header("Content-Length", str(len(govde)))
    h.end_headers()
    h.wfile.write(govde)


def _govde(h):
    try:
        n = int(h.headers.get("Content-Length") or 0)
    except ValueError:
        raise Hata(400, "Geçersiz istek.")
    if n > GOVDE_EN_BUYUK:
        raise Hata(413, "İstek çok büyük.")
    ham = h.rfile.read(n) if n else b""
    try:
        v = json.loads(ham.decode("utf-8") or "{}")
    except (UnicodeDecodeError, ValueError):
        raise Hata(400, "İstek okunamadı.")
    if not isinstance(v, dict):
        raise Hata(400, "İstek okunamadı.")
    return v


def _jeton(h):
    a = h.headers.get("Authorization") or ""
    return a[7:].strip() if a.startswith("Bearer ") else ""


def isle(h):
    """Modul sunucusunun /api/hesap/... istegi. h: BaseHTTPRequestHandler."""
    yol = h.path.split("?", 1)[0]
    yontem = h.command
    if yontem == "OPTIONS":
        koken = h.headers.get("Origin") or ""
        h.send_response(204 if UYGULAMA_KOKENLERI.match(koken) else 403)
        if UYGULAMA_KOKENLERI.match(koken):
            h.send_header("Access-Control-Allow-Origin", koken)
            h.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            h.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type, X-LifeOS")
            h.send_header("Access-Control-Max-Age", "600")
            if h.headers.get("Access-Control-Request-Private-Network") == "true":
                h.send_header("Access-Control-Allow-Private-Network", "true")
            h.send_header("Vary", "Origin")
        h.send_header("Content-Length", "0")
        h.end_headers()
        return
    try:
        if not _koken_izinli(h):
            raise Hata(403, "İzin yok.")
        d = depo()
        if yontem == "GET" and yol == "/api/hesap/durum":
            return _cevap(h, 200, {"surum": SURUM, "kurulum": d.kurulum_gerekli(),
                                   "yerel": _yerel_mi(h), "ev_agi": ev_agi()})
        if yontem == "POST":
            # Ozel baslik + JSON: baska bir site tarayicidan «basit istek»
            # gonderemez (on-kontrol ister, on-kontrol yalniz uygulamaya acik).
            if h.headers.get("X-LifeOS") != "hesap":
                raise Hata(403, "İzin yok.")
            v = _govde(h)
            cihaz = str(v.get("cihaz") or "")[:64]
            cihaz_ad = str(v.get("cihaz_ad") or "")[:80]
            if yol == "/api/hesap/kur":
                return _cevap(h, 200, d.kur(v.get("ad"), v.get("parola"), _yerel_mi(h), cihaz, cihaz_ad))
            if yol == "/api/hesap/giris":
                return _cevap(h, 200, d.giris(v.get("ad"), v.get("parola"), cihaz, cihaz_ad,
                                              (h.client_address or ("",))[0]))
            k = d.oturum(_jeton(h))
            if k is None:
                raise Hata(401, "Oturum yok ya da süresi doldu; yeniden giriş yap.")
            if yol == "/api/hesap/esitle":
                son = v.get("son", 0)
                return _cevap(h, 200, d.esitle(k, v.get("alan"), cihaz, son if isinstance(son, int) else -1,
                                               v.get("gonder") or [], v.get("sinir") or SINIR))
            if yol == "/api/hesap/cikis":
                d.cikis(_jeton(h))
                return _cevap(h, 200, {"ok": True})
            if yol == "/api/hesap/parola":
                d.parola_degistir(k, _jeton(h), v.get("eski"), v.get("yeni"))
                return _cevap(h, 200, {"ok": True})
            if yol == "/api/hesap/kullanici":
                return _cevap(h, 200, d.kullanici_ekle(k, v.get("ad"), v.get("parola"), v.get("rol") or "uye"))
            raise Hata(404, "Böyle bir istek yok.")
        if yontem == "GET":
            k = d.oturum(_jeton(h))
            if k is None:
                raise Hata(401, "Oturum yok ya da süresi doldu; yeniden giriş yap.")
            if yol == "/api/hesap/ben":
                return _cevap(h, 200, {"kullanici": k, "ozet": d.ozet(k)})
            if yol == "/api/hesap/kullanicilar":
                return _cevap(h, 200, {"kullanicilar": d.kullanicilar(k)})
        raise Hata(404, "Böyle bir istek yok.")
    except Hata as e:
        return _cevap(h, e.kod, {"hata": e.mesaj})
    except (sqlite3.Error, OSError) as e:
        return _cevap(h, 503, {"hata": "Hesap deposu açılamadı: %s" % e})
