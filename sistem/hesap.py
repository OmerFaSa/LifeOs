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
      yalniz bu bilgisayarin kendisinden (127.0.0.1) acilir. Ev agindaki
      bir cihaz admin olamaz, kurulumu da kapamaz. Sonraki hesaplari herkes
      kendisi acar (kayit, uye) — su an ev agiyla sinirli bir beta.
   7. SIFRE KURTARMA KULLANICININ KENDI SORUSUYLA. Kayitta kullanici bir
      soru ve cevap yazar; cevap sifre gibi tuzlu ozetle saklanir (buyuk/
      kucuk harf, Turkce I/İ ve fazla bosluk fark etmez). Dogru cevap yeni
      sifre koydurur ve butun eski oturumlari kapatir; yanlis cevap girisle
      ayni bekletmeye tabidir.
   6. VERI DEPONUN DISINDA. %LOCALAPPDATA%\\LifeOS\\hesap\\hesap.db
      (Windows) ya da ~/.lifeos/hesap: commit'e giremez, guncelleme ona
      dokunmaz. LIFEOS_HESAP_KLASOR testler icin.
   8. PROFIL VE PLAN (depo sahibi, 2026-10-05: «hesap cok daha ayarli
      olsun; ucretli surumler gorunsun»). Gorunen ad ve profil rengi
      kullanicinin kendi ayaridir, kapali bir renk listesinden secilir.
      Plan YALNIZ GORUNURLUKTUR: odeme yok, hicbir ozellik plana bakmaz,
      hicbir sayi ya da karar plana gore degismez (AGENTS §1.1). Katalog
      tek yerde (PLANLAR); istemci onu sunucudan okur. Plani yalniz admin
      atar.
   9. CIHAZLAR. Kullanici kendi oturumlarini (cihaz adi, son gorulme)
      gorur; birini ya da bu cihaz disindakilerin hepsini kapatabilir.
      Jeton ve ozeti hicbir cevaba girmez; oturumun kimligi satir
      numarasidir ve yalniz sahibinin oturumlarinda gecerlidir.
  10. YONETIM. Admin kullanicilarin rolunu ve planini degistirir, yeni
      hesap acmayi kapatabilir (kapaliyken hesabi admin ekler). Son admin
      uyeye dusurulemez: sistem adminsiz kalmaz.
  11. ETKINLIK (2026-10-05, ikinci tur: «detayli hesap ozellikleri»).
      Giris, yanlis sifre, sifre/soru degisikligi, cihazdan cikis ve admin
      degisikligi kullanicinin kendi etkinlik defterine yazilir (cihaz adi,
      ev agindaki IP, zaman). Olmayan kullanicinin yanlis girisi yazilmaz
      (yazacak hesap yok; ad sizmaz). Defter kullanici basina son
      OLAY_EN_COK olayi tutar. Sifre, cevap, jeton hicbir olaya girmez.
  12. KISISEL BILGILER istege baglidir: hitap (King nasil seslensin),
      dogum gunu, e-posta. Hicbiri bir yere gonderilmez, hicbir hesaba
      girmez (SPI'nin dogum yili kendi profilindedir; bu ona yazilmaz).
      Admin listesinde baskasinin kisisel bilgisi gorunmez.
  13. VERIN SENIN. Kullanici bilgisayardaki kopyanin tamamini tek JSON
      olarak indirir; isterse sifresiyle hesabini siler: kayitlar,
      oturumlar ve etkinlik bilgisayardan gider, cihazlardaki veri kalir.
      Hesabin rastgele bir kimligi vardir (kimlik): ayni adla yeniden
      acilan hesap eskisi sayilmaz; cihaz, bagli oldugu hesabin hala
      var olup olmadigini bu kimlikle sorar (hesap.js soz 13).

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

SURUM = 4
TUR = 600000                    # PBKDF2 tur sayisi (OWASP 2023, SHA-256)
EN_KISA_PAROLA = 8
EN_UZUN_PAROLA = 256
AD_RE = re.compile(r"^[0-9A-Za-zÇĞİÖŞÜçğıöşü_.\-]{2,32}$")
ALAN_RE = re.compile(r"^(ays|spi|esp)/[A-Za-z0-9_.\-]{1,40}$")
CIHAZ_RE = re.compile(r"^[A-Za-z0-9_\-]{6,64}$")
SORU_EN_KISA, SORU_EN_UZUN = 4, 120
CEVAP_EN_KISA = 2
YOL_EN_UZUN = 300
KAYIT_EN_BUYUK = 2 * 1024 * 1024      # tek kayit (JSON); fotograf buraya girmez
GOVDE_EN_BUYUK = 24 * 1024 * 1024
GONDER_EN_COK = 5000
SINIR = 1000                          # tek cevapta en cok kayit
OTURUM_GUN = 400
DENEME_ESIK = 5                       # bu kadar yanlistan sonra bekletilir
DENEME_TAVAN_SN = 900
GORUNEN_AD_EN_UZUN = 40
HITAP_EN_UZUN = 30
EPOSTA_RE = re.compile(r"^[^@\s]{1,64}@[^@\s]{1,120}\.[^@\s]{2,24}$")
KIMLIK_RE = re.compile(r"^[0-9a-f]{16}$")
OLAY_EN_COK = 300                     # kullanici basina saklanan etkinlik
OLAY_GOSTER = 80

# Profil rengi: kapali liste (soz 8). Renklerin kendisi istemcide
# (hesap.js RENK); burada yalniz kimlikler dogrulanir.
RENKLER = ("mavi", "turkuaz", "turuncu", "mor", "pembe", "yesil", "grafit")

# PLANLAR — yalniz gorunurluk (soz 8). Odeme yok, hicbir ozellik kilitli
# degil. Ad, ozet ve ozellik satirlari ekranda AYNEN gorunur; degistirmek
# icin yalniz burasi duzenlenir. «yakinda» plan secilemez gibi gorunur ama
# admin elle atayabilir (deneme icin).
PLANLAR = (
    {"id": "ucretsiz", "ad": "Ücretsiz", "etiket": "Beta", "durum": "acik",
     "ozet": "Bugün kullandığın her şey.",
     "ozellik": ["AYS, SPİ, ESP ve Merkez", "PC, telefon ve tablet eşitleme",
                 "Veri kendi bilgisayarında", "King ve kural motoru"]},
    {"id": "plus", "ad": "Plus", "etiket": "Yakında", "durum": "yakinda",
     "ozet": "Daha çok cihaz, daha çok plan.",
     "ozellik": ["Ücretsizdeki her şey", "Fotoğraflar da eşitlenir",
                 "Hedef motoru: 100 günlük planlar", "Kaynaklı internet araştırması"]},
    {"id": "pro", "ad": "Pro", "etiket": "Yakında", "durum": "yakinda",
     "ozet": "Bütün sınavlar ve sağlık hedefleri.",
     "ozellik": ["Plus’taki her şey", "KPSS, DGS ve LGS profilleri",
                 "Sağlık hedef planları", "Yeni özellikler önce sende"]},
)
PLAN_IDS = tuple(p["id"] for p in PLANLAR)
PLAN_AD = {p["id"]: p["ad"] for p in PLANLAR}
VARSAYILAN_PLAN = PLAN_IDS[0]

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
CREATE TABLE IF NOT EXISTS ayar(ad TEXT PRIMARY KEY, deger TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS olay(
  id INTEGER PRIMARY KEY,
  kullanici INTEGER NOT NULL,
  tur TEXT NOT NULL,
  cihaz_ad TEXT,
  ip TEXT,
  ayrinti TEXT,
  zaman REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS olay_kullanici ON olay(kullanici, id);
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
            self._gocur(c)

    def _gocur(self, c):
        """Eski depoya yeni sutunlar (surum 2: kurtarma sorusu; surum 3:
        gorunen ad, profil rengi, plan; surum 4: kimlik, kisisel bilgiler,
        cihazin son esitlemesi)."""
        var = {r["name"] for r in c.execute("PRAGMA table_info(kullanici)")}
        for ad, tur in (("soru", "TEXT"), ("cevap_tuz", "BLOB"), ("cevap_ozet", "BLOB"), ("cevap_tur", "INTEGER"),
                        ("gorunen_ad", "TEXT"), ("renk", "TEXT"), ("plan", "TEXT"),
                        ("kimlik", "TEXT"), ("dogum", "TEXT"), ("hitap", "TEXT"), ("eposta", "TEXT")):
            if ad not in var:
                c.execute("ALTER TABLE kullanici ADD COLUMN %s %s" % (ad, tur))
        for r in c.execute("SELECT id FROM kullanici WHERE kimlik IS NULL").fetchall():
            c.execute("UPDATE kullanici SET kimlik=? WHERE id=?", (secrets.token_hex(8), r["id"]))
        if "esitleme" not in {r["name"] for r in c.execute("PRAGMA table_info(oturum)")}:
            c.execute("ALTER TABLE oturum ADD COLUMN esitleme REAL")

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
            raise Hata(400, "Şifre en az %d karakter olmalı." % EN_KISA_PAROLA)
        if len(parola) > EN_UZUN_PAROLA:
            raise Hata(400, "Şifre çok uzun.")
        return parola

    @staticmethod
    def _cevap_normal(cevap):
        s = str(cevap or "").replace("I", "ı").replace("İ", "i").lower()
        return " ".join(s.split())

    @staticmethod
    def _soru_dogrula(soru, cevap):
        soru = " ".join(str(soru or "").split())
        if not (SORU_EN_KISA <= len(soru) <= SORU_EN_UZUN):
            raise Hata(400, "Kurtarma sorusu %d–%d karakter olmalı." % (SORU_EN_KISA, SORU_EN_UZUN))
        if len(Depo._cevap_normal(cevap)) < CEVAP_EN_KISA:
            raise Hata(400, "Kurtarma cevabı en az %d karakter olmalı." % CEVAP_EN_KISA)
        return soru

    def _soru_yaz(self, c, kid, soru, cevap):
        tuz = secrets.token_bytes(16)
        c.execute("UPDATE kullanici SET soru=?, cevap_tuz=?, cevap_ozet=?, cevap_tur=? WHERE id=?",
                  (soru, tuz, self._ozet(self._cevap_normal(cevap), tuz, self.tur), self.tur, kid))

    def _kullanici_yaz(self, c, ad, parola, rol):
        tuz = secrets.token_bytes(16)
        try:
            cur = c.execute(
                "INSERT INTO kullanici(ad, rol, tuz, ozet, tur, olusturma, kimlik) VALUES(?,?,?,?,?,?,?)",
                (ad, rol, tuz, self._ozet(parola, tuz, self.tur), self.tur,
                 time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime(self.saat())), secrets.token_hex(8)))
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

    @staticmethod
    def _profil(r, ozel=True):
        """ozel=False: admin listesinde baskasinin satiri (soz 12)."""
        plan = r["plan"] if r["plan"] in PLAN_IDS else VARSAYILAN_PLAN
        p = {"id": r["id"], "ad": r["ad"], "rol": r["rol"],
             "gorunen_ad": r["gorunen_ad"] or r["ad"],
             "renk": r["renk"] if r["renk"] in RENKLER else RENKLER[0],
             "plan": plan, "plan_ad": PLAN_AD[plan],
             "olusturma": r["olusturma"]}
        if ozel:
            p.update(kimlik=r["kimlik"] or "", dogum=r["dogum"] or "", hitap=r["hitap"] or "",
                     eposta=r["eposta"] or "")
        return p

    def _kullanici(self, c, kid, ozel=True):
        r = c.execute("SELECT id, ad, rol, gorunen_ad, renk, plan, olusturma, kimlik, dogum, hitap, eposta "
                      "FROM kullanici WHERE id=?", (kid,)).fetchone()
        return self._profil(r, ozel) if r else None

    # ------------------------------------------------------ etkinlik (soz 11)

    def _olay(self, c, kid, tur, cihaz_ad="", ip="", ayrinti=""):
        c.execute("INSERT INTO olay(kullanici, tur, cihaz_ad, ip, ayrinti, zaman) VALUES(?,?,?,?,?,?)",
                  (kid, tur, (cihaz_ad or "")[:80], (ip or "")[:64], (ayrinti or "")[:120], self.saat()))
        c.execute("DELETE FROM olay WHERE kullanici=? AND id <= (SELECT id FROM olay WHERE kullanici=? "
                  "ORDER BY id DESC LIMIT 1 OFFSET ?)", (kid, kid, OLAY_EN_COK))

    def _oturum_cihaz(self, c, jeton):
        r = c.execute("SELECT cihaz_ad FROM oturum WHERE ozet=?", (_jeton_ozeti(jeton or ""),)).fetchone()
        return (r["cihaz_ad"] or "") if r else ""

    def kurulum_gerekli(self):
        with self._islem() as c:
            return c.execute("SELECT COUNT(*) FROM kullanici").fetchone()[0] == 0

    # ------------------------------------------------------- ayar (soz 10)

    def _ayar(self, c, ad, varsayilan):
        r = c.execute("SELECT deger FROM ayar WHERE ad=?", (ad,)).fetchone()
        return r["deger"] if r else varsayilan

    def kayit_acik(self):
        """Yeni hesap acilabilir mi? Varsayilan acik (ev agiyla sinirli beta)."""
        with self._islem() as c:
            return self._ayar(c, "kayit_acik", "1") == "1"

    def kayit_ayarla(self, yapan, acik):
        if not yapan or yapan.get("rol") != "admin":
            raise Hata(403, "Bu ayarı yalnız admin değiştirir.")
        if not isinstance(acik, bool):
            raise Hata(400, "Geçersiz ayar.")
        with self._islem() as c:
            c.execute("INSERT INTO ayar(ad, deger) VALUES('kayit_acik', ?) ON CONFLICT(ad) DO UPDATE "
                      "SET deger=excluded.deger", ("1" if acik else "0",))
        return acik

    def kur(self, ad, parola, yerel, cihaz="", cihaz_ad="", ip=""):
        """Ilk hesap (admin). Yalniz hic kullanici yokken ve yalniz PC'den."""
        if not yerel:
            raise Hata(403, "Admin hesabı yalnız bu bilgisayardan kurulur.")
        ad = self._ad_dogrula(ad)
        self._parola_dogrula(parola)
        with self._islem() as c:
            if c.execute("SELECT COUNT(*) FROM kullanici").fetchone()[0]:
                raise Hata(409, "Admin hesabı zaten kurulmuş; giriş yap.")
            kid = self._kullanici_yaz(c, ad, parola, "admin")
            self._olay(c, kid, "kayit", cihaz_ad, ip)
            return {"jeton": self._oturum_ac(c, kid, cihaz, cihaz_ad),
                    "kullanici": self._kullanici(c, kid)}

    def kayit(self, ad, parola, soru, cevap, yerel, cihaz="", cihaz_ad="", ip=""):
        """Kendi kendine hesap. Ilk hesap admin olur ve yalniz PC'den acilir."""
        ad = self._ad_dogrula(ad)
        self._parola_dogrula(parola)
        soru = self._soru_dogrula(soru, cevap)
        with self._islem() as c:
            ilk = c.execute("SELECT COUNT(*) FROM kullanici").fetchone()[0] == 0
            if ilk and not yerel:
                raise Hata(403, "İlk hesap (admin) bilgisayarın kendisinde açılır.")
            if not ilk and self._ayar(c, "kayit_acik", "1") != "1":
                raise Hata(403, "Yeni hesap açma kapalı. Hesabı admin ekler.")
            kid = self._kullanici_yaz(c, ad, parola, "admin" if ilk else "uye")
            self._soru_yaz(c, kid, soru, cevap)
            self._olay(c, kid, "kayit", cihaz_ad, ip)
            return {"jeton": self._oturum_ac(c, kid, cihaz, cihaz_ad),
                    "kullanici": self._kullanici(c, kid)}

    def soru(self, ad):
        """Sifremi unuttum, adim 1: kullanicinin kendi sorusu."""
        with self._islem() as c:
            r = c.execute("SELECT soru FROM kullanici WHERE ad=?", ((ad or "").strip(),)).fetchone()
        if r is None or not r["soru"]:
            raise Hata(404, "Bu kullanıcı adı için kurtarma sorusu yok.")
        return r["soru"]

    def kurtar(self, ad, cevap, yeni, cihaz="", cihaz_ad="", ip=""):
        """Sifremi unuttum, adim 2: dogru cevap yeni sifre koydurur."""
        ad = (ad or "").strip()
        anahtarlar = [("kurtar", ad.lower()), ("ip", ip)]
        with self.kilit:
            self._deneme_bak(anahtarlar)
        self._parola_dogrula(yeni)
        with self._islem() as c:
            r = c.execute("SELECT id, cevap_tuz, cevap_ozet, cevap_tur FROM kullanici WHERE ad=?", (ad,)).fetchone()
            if r is not None and r["cevap_ozet"]:
                dogru = hmac.compare_digest(
                    self._ozet(self._cevap_normal(cevap), r["cevap_tuz"], r["cevap_tur"]), r["cevap_ozet"])
            else:
                self._ozet("", b"\0" * 16, self.tur)      # sure sizdirmasin
                dogru = False
            if dogru:
                with self.kilit:
                    for a in anahtarlar:
                        self._deneme.pop(a, None)
                tuz = secrets.token_bytes(16)
                c.execute("UPDATE kullanici SET tuz=?, ozet=?, tur=? WHERE id=?",
                          (tuz, self._ozet(yeni, tuz, self.tur), self.tur, r["id"]))
                c.execute("DELETE FROM oturum WHERE kullanici=?", (r["id"],))
                self._olay(c, r["id"], "kurtar", cihaz_ad, ip)
                return {"jeton": self._oturum_ac(c, r["id"], cihaz, cihaz_ad),
                        "kullanici": self._kullanici(c, r["id"])}
            if r is not None:
                self._olay(c, r["id"], "kurtar-yanlis", cihaz_ad, ip)
        with self.kilit:
            self._deneme_yanlis(anahtarlar)
        raise Hata(401, "Cevap yanlış.")

    def soru_ayarla(self, kullanici, parola, soru, cevap, jeton=None, ip=""):
        soru = self._soru_dogrula(soru, cevap)
        with self._islem() as c:
            r = c.execute("SELECT tuz, ozet, tur FROM kullanici WHERE id=?", (kullanici["id"],)).fetchone()
            if r is None or not hmac.compare_digest(self._ozet(parola or "", r["tuz"], r["tur"]), r["ozet"]):
                raise Hata(401, "Şifre yanlış.")
            self._soru_yaz(c, kullanici["id"], soru, cevap)
            self._olay(c, kullanici["id"], "soru", self._oturum_cihaz(c, jeton), ip)

    def soru_var(self, kullanici):
        with self._islem() as c:
            r = c.execute("SELECT soru FROM kullanici WHERE id=?", (kullanici["id"],)).fetchone()
            return bool(r and r["soru"])

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
            if dogru:
                with self.kilit:
                    for a in anahtarlar:
                        self._deneme.pop(a, None)
                self._olay(c, r["id"], "giris", cihaz_ad, ip)
                return {"jeton": self._oturum_ac(c, r["id"], cihaz, cihaz_ad),
                        "kullanici": self._kullanici(c, r["id"])}
            if r is not None:
                self._olay(c, r["id"], "yanlis", cihaz_ad, ip)     # soz 11: hesabin sahibi gorsun
        with self.kilit:
            self._deneme_yanlis(anahtarlar)
        raise Hata(401, "Kullanıcı adı ya da şifre yanlış.")

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

    def cikis(self, jeton, ip=""):
        with self._islem() as c:
            oz = _jeton_ozeti(jeton or "")
            r = c.execute("SELECT kullanici, cihaz_ad FROM oturum WHERE ozet=?", (oz,)).fetchone()
            c.execute("DELETE FROM oturum WHERE ozet=?", (oz,))
            if r is not None:
                self._olay(c, r["kullanici"], "cikis", r["cihaz_ad"], ip)

    def parola_degistir(self, kullanici, jeton, eski, yeni, ip=""):
        self._parola_dogrula(yeni)
        with self._islem() as c:
            r = c.execute("SELECT tuz, ozet, tur FROM kullanici WHERE id=?", (kullanici["id"],)).fetchone()
            if r is None or not hmac.compare_digest(self._ozet(eski or "", r["tuz"], r["tur"]), r["ozet"]):
                raise Hata(401, "Şimdiki şifre yanlış.")
            tuz = secrets.token_bytes(16)
            c.execute("UPDATE kullanici SET tuz=?, ozet=?, tur=? WHERE id=?",
                      (tuz, self._ozet(yeni, tuz, self.tur), self.tur, kullanici["id"]))
            # Oteki cihazlarin oturumu kapanir; bu cihazinki kalir.
            c.execute("DELETE FROM oturum WHERE kullanici=? AND ozet<>?",
                      (kullanici["id"], _jeton_ozeti(jeton or "")))
            self._olay(c, kullanici["id"], "parola", self._oturum_cihaz(c, jeton), ip)

    def kullanici_ekle(self, yapan, ad, parola, rol="uye"):
        if not yapan or yapan.get("rol") != "admin":
            raise Hata(403, "Kullanıcıyı yalnız admin ekler.")
        if rol not in ("admin", "uye"):
            raise Hata(400, "Rol «admin» ya da «uye» olmalı.")
        ad = self._ad_dogrula(ad)
        self._parola_dogrula(parola)
        with self._islem() as c:
            kid = self._kullanici_yaz(c, ad, parola, rol)
            return self._kullanici(c, kid, ozel=False)

    def kullanicilar(self, yapan):
        if not yapan or yapan.get("rol") != "admin":
            raise Hata(403, "Kullanıcı listesini yalnız admin görür.")
        with self._islem() as c:
            out = []
            for r in c.execute(
                    "SELECT k.id, k.ad, k.rol, k.gorunen_ad, k.renk, k.plan, k.olusturma, "
                    "COUNT(o.ozet) AS cihaz, MAX(o.son) AS son FROM kullanici k "
                    "LEFT JOIN oturum o ON o.kullanici=k.id GROUP BY k.id ORDER BY k.id").fetchall():
                p = self._profil(r, ozel=False)          # soz 12: baskasinin kisisel bilgisi yok
                p["cihaz"] = r["cihaz"]
                p["son"] = int(r["son"] * 1000) if r["son"] else None
                out.append(p)
            return out

    # -------------------------------------------------- profil (soz 8)

    @staticmethod
    def _gorunen_ad_dogrula(s):
        s = " ".join(str(s or "").split())
        if any(ord(ch) < 32 for ch in s):
            raise Hata(400, "Görünen ad okunamadı.")
        if len(s) > GORUNEN_AD_EN_UZUN:
            raise Hata(400, "Görünen ad en çok %d karakter olabilir." % GORUNEN_AD_EN_UZUN)
        return s or None

    @staticmethod
    def _dogum_dogrula(s, bugun):
        s = str(s or "").strip()
        if not s:
            return None
        try:
            t = time.strptime(s, "%Y-%m-%d") if re.match(r"^\d{4}-\d{2}-\d{2}$", s) else None
        except ValueError:
            t = None
        if t is None or t.tm_year < 1900 or s > bugun:
            raise Hata(400, "Doğum günü okunamadı (gelecekte olamaz).")
        return s

    @staticmethod
    def _hitap_dogrula(s):
        s = " ".join(str(s or "").split())
        if any(ord(ch) < 32 for ch in s) or len(s) > HITAP_EN_UZUN:
            raise Hata(400, "Hitap en çok %d karakter olabilir." % HITAP_EN_UZUN)
        return s or None

    @staticmethod
    def _eposta_dogrula(s):
        s = str(s or "").strip()
        if not s:
            return None
        if not EPOSTA_RE.match(s):
            raise Hata(400, "E-posta adresi okunamadı.")
        return s

    def profil_ayarla(self, kullanici, gorunen_ad=None, renk=None, dogum=None, hitap=None, eposta=None):
        """Kullanicinin kendi ayari. None verilen alan degismez; bos ad
        kullanici adina doner; bos kisisel bilgi silinir (soz 12)."""
        bugun = time.strftime("%Y-%m-%d", time.localtime(self.saat()))
        kisisel = {}
        if dogum is not None:
            kisisel["dogum"] = self._dogum_dogrula(dogum, bugun)
        if hitap is not None:
            kisisel["hitap"] = self._hitap_dogrula(hitap)
        if eposta is not None:
            kisisel["eposta"] = self._eposta_dogrula(eposta)
        with self._islem() as c:
            for ad, deger in kisisel.items():
                c.execute("UPDATE kullanici SET %s=? WHERE id=?" % ad, (deger, kullanici["id"]))
            if gorunen_ad is not None:
                c.execute("UPDATE kullanici SET gorunen_ad=? WHERE id=?",
                          (self._gorunen_ad_dogrula(gorunen_ad), kullanici["id"]))
            if renk is not None:
                if renk not in RENKLER:
                    raise Hata(400, "Bu renk listede yok.")
                c.execute("UPDATE kullanici SET renk=? WHERE id=?", (renk, kullanici["id"]))
            return self._kullanici(c, kullanici["id"])

    # ------------------------------------------------- cihazlar (soz 9)

    def cihazlar(self, kullanici, jeton):
        bu = _jeton_ozeti(jeton or "")
        with self._islem() as c:
            return [{"id": r["id"], "cihaz_ad": r["cihaz_ad"] or "Cihaz",
                     "olusturma": int(r["olusturma"] * 1000), "son": int(r["son"] * 1000),
                     "esitleme": int(r["esitleme"] * 1000) if r["esitleme"] else None,
                     "bu": r["ozet"] == bu}
                    for r in c.execute("SELECT rowid AS id, ozet, cihaz_ad, olusturma, son, esitleme FROM oturum "
                                       "WHERE kullanici=? ORDER BY (ozet=?) DESC, son DESC",
                                       (kullanici["id"], bu))]

    def cihaz_cikar(self, kullanici, jeton, oid, ip=""):
        """Kendi oturumlarindan birini kapatir. Doner: kapanan bu cihaz miydi."""
        if not isinstance(oid, int) or isinstance(oid, bool):
            raise Hata(400, "Geçersiz cihaz.")
        with self._islem() as c:
            r = c.execute("SELECT ozet, cihaz_ad FROM oturum WHERE rowid=? AND kullanici=?",
                          (oid, kullanici["id"])).fetchone()
            if r is None:
                raise Hata(404, "Bu cihaz artık listede yok.")
            self._olay(c, kullanici["id"], "cihaz", self._oturum_cihaz(c, jeton), ip, r["cihaz_ad"] or "Cihaz")
            c.execute("DELETE FROM oturum WHERE rowid=? AND kullanici=?", (oid, kullanici["id"]))
            return r["ozet"] == _jeton_ozeti(jeton or "")

    def otekilerden_cik(self, kullanici, jeton, ip=""):
        with self._islem() as c:
            cur = c.execute("DELETE FROM oturum WHERE kullanici=? AND ozet<>?",
                            (kullanici["id"], _jeton_ozeti(jeton or "")))
            n = cur.rowcount
            if n:
                self._olay(c, kullanici["id"], "otekiler", self._oturum_cihaz(c, jeton), ip, str(n))
            return n

    # ------------------------------------------------- yonetim (soz 10)

    def yonet(self, yapan, kid, rol=None, plan=None):
        if not yapan or yapan.get("rol") != "admin":
            raise Hata(403, "Kullanıcıları yalnız admin yönetir.")
        if not isinstance(kid, int) or isinstance(kid, bool):
            raise Hata(400, "Geçersiz kullanıcı.")
        if rol is not None and rol not in ("admin", "uye"):
            raise Hata(400, "Rol «admin» ya da «uye» olmalı.")
        if plan is not None and plan not in PLAN_IDS:
            raise Hata(400, "Bu plan katalogda yok.")
        with self._islem() as c:
            r = c.execute("SELECT rol FROM kullanici WHERE id=?", (kid,)).fetchone()
            if r is None:
                raise Hata(404, "Bu kullanıcı yok.")
            if rol == "uye" and r["rol"] == "admin":
                adminler = c.execute("SELECT COUNT(*) FROM kullanici WHERE rol='admin'").fetchone()[0]
                if adminler <= 1:
                    raise Hata(409, "Son admin üyeye düşürülemez; önce başka birini admin yap.")
            if rol is not None:
                c.execute("UPDATE kullanici SET rol=? WHERE id=?", (rol, kid))
                self._olay(c, kid, "yonetim", "", "", "Rol: %s · %s" % ("Admin" if rol == "admin" else "Üye", yapan.get("ad", "")))
            if plan is not None:
                c.execute("UPDATE kullanici SET plan=? WHERE id=?", (plan, kid))
                self._olay(c, kid, "yonetim", "", "", "Plan: %s · %s" % (PLAN_AD[plan], yapan.get("ad", "")))
            return self._kullanici(c, kid, ozel=(kid == yapan.get("id")))

    # ---------------------------------------------------------- esitleme

    def _sira(self, c):
        r = c.execute("SELECT deger FROM sayac WHERE ad='sira'").fetchone()
        return r["deger"] if r else 0

    def esitle(self, kullanici, alan, cihaz, son, gonder, sinir=SINIR, jeton=None):
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
            if jeton:
                c.execute("UPDATE oturum SET esitleme=? WHERE ozet=?", (self.saat(), _jeton_ozeti(jeton)))
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

    def ayrinti(self, kullanici):
        """Alan basina kayit sayisi, bilgisayarda kapladigi yer (bayt) ve
        son degisikligin zamani (ms; kaydi yazan cihazin saati)."""
        with self._islem() as c:
            return {r["alan"]: {"n": r["n"], "bayt": r["bayt"] or 0, "son": r["son"]} for r in c.execute(
                "SELECT alan, COUNT(*) AS n, SUM(LENGTH(deger)) AS bayt, MAX(zaman) AS son FROM kayit "
                "WHERE kullanici=? AND deger IS NOT NULL GROUP BY alan", (kullanici["id"],))}

    def etkinlik(self, kullanici, sinir=OLAY_GOSTER):
        sinir = max(1, min(int(sinir), OLAY_EN_COK))
        with self._islem() as c:
            return [{"tur": r["tur"], "cihaz_ad": r["cihaz_ad"] or "", "ip": r["ip"] or "",
                     "ayrinti": r["ayrinti"] or "", "zaman": int(r["zaman"] * 1000)}
                    for r in c.execute("SELECT tur, cihaz_ad, ip, ayrinti, zaman FROM olay WHERE kullanici=? "
                                       "ORDER BY id DESC LIMIT ?", (kullanici["id"], sinir))]

    def disa(self, kullanici):
        """Bilgisayardaki kopyanin tamami (soz 13). Silinmis kayit girmez."""
        with self._islem() as c:
            alanlar = {}
            for r in c.execute("SELECT alan, yol, deger FROM kayit WHERE kullanici=? AND deger IS NOT NULL "
                               "ORDER BY alan, yol", (kullanici["id"],)):
                alanlar.setdefault(r["alan"], {})[r["yol"]] = json.loads(r["deger"])
            p = self._kullanici(c, kullanici["id"])
        p.pop("kimlik", None)
        return {"lifeos_hesap": SURUM, "tarih": time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime(self.saat())),
                "kullanici": p, "alanlar": alanlar}

    def sil(self, kullanici, parola):
        """Hesabi siler (soz 13): sifre sorulur; son admin, baska kullanici
        varken kendini silemez (sistem adminsiz kalmaz)."""
        with self._islem() as c:
            r = c.execute("SELECT rol, tuz, ozet, tur FROM kullanici WHERE id=?", (kullanici["id"],)).fetchone()
            if r is None or not hmac.compare_digest(self._ozet(parola or "", r["tuz"], r["tur"]), r["ozet"]):
                raise Hata(401, "Şifre yanlış.")
            if r["rol"] == "admin":
                adminler = c.execute("SELECT COUNT(*) FROM kullanici WHERE rol='admin'").fetchone()[0]
                digerleri = c.execute("SELECT COUNT(*) FROM kullanici WHERE id<>?", (kullanici["id"],)).fetchone()[0]
                if adminler <= 1 and digerleri:
                    raise Hata(409, "Son admin hesabını silemez; önce başka birini admin yap.")
            for t in ("kayit", "oturum", "olay"):
                c.execute("DELETE FROM %s WHERE kullanici=?" % t, (kullanici["id"],))
            c.execute("DELETE FROM kullanici WHERE id=?", (kullanici["id"],))

    def yasiyor(self, kimlik):
        """Bu kimlikte bir hesap hala var mi? (cihaz baglantisi, soz 13)"""
        if not isinstance(kimlik, str) or not KIMLIK_RE.match(kimlik):
            raise Hata(400, "Geçersiz kimlik.")
        with self._islem() as c:
            return c.execute("SELECT 1 FROM kullanici WHERE kimlik=?", (kimlik,)).fetchone() is not None


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
            return _cevap(h, 200, {"surum": SURUM, "kurulum": d.kurulum_gerekli(), "kayit": d.kayit_acik(),
                                   "yerel": _yerel_mi(h), "ev_agi": ev_agi()})
        if yontem == "POST":
            # Ozel baslik + JSON: baska bir site tarayicidan «basit istek»
            # gonderemez (on-kontrol ister, on-kontrol yalniz uygulamaya acik).
            if h.headers.get("X-LifeOS") != "hesap":
                raise Hata(403, "İzin yok.")
            v = _govde(h)
            cihaz = str(v.get("cihaz") or "")[:64]
            cihaz_ad = str(v.get("cihaz_ad") or "")[:80]
            ip = (h.client_address or ("",))[0]
            if yol == "/api/hesap/kur":
                return _cevap(h, 200, d.kur(v.get("ad"), v.get("parola"), _yerel_mi(h), cihaz, cihaz_ad, ip))
            if yol == "/api/hesap/kayit":
                return _cevap(h, 200, d.kayit(v.get("ad"), v.get("parola"), v.get("soru"), v.get("cevap"),
                                              _yerel_mi(h), cihaz, cihaz_ad, ip))
            if yol == "/api/hesap/soru":
                return _cevap(h, 200, {"soru": d.soru(v.get("ad"))})
            if yol == "/api/hesap/kurtar":
                return _cevap(h, 200, d.kurtar(v.get("ad"), v.get("cevap"), v.get("yeni"), cihaz, cihaz_ad, ip))
            if yol == "/api/hesap/giris":
                return _cevap(h, 200, d.giris(v.get("ad"), v.get("parola"), cihaz, cihaz_ad, ip))
            k = d.oturum(_jeton(h))
            if k is None:
                raise Hata(401, "Oturum yok ya da süresi doldu; yeniden giriş yap.")
            if yol == "/api/hesap/esitle":
                son = v.get("son", 0)
                return _cevap(h, 200, d.esitle(k, v.get("alan"), cihaz, son if isinstance(son, int) else -1,
                                               v.get("gonder") or [], v.get("sinir") or SINIR, _jeton(h)))
            if yol == "/api/hesap/cikis":
                d.cikis(_jeton(h), ip)
                return _cevap(h, 200, {"ok": True})
            if yol == "/api/hesap/parola":
                d.parola_degistir(k, _jeton(h), v.get("eski"), v.get("yeni"), ip)
                return _cevap(h, 200, {"ok": True})
            if yol == "/api/hesap/soru-ayarla":
                d.soru_ayarla(k, v.get("parola"), v.get("soru"), v.get("cevap"), _jeton(h), ip)
                return _cevap(h, 200, {"ok": True})
            if yol == "/api/hesap/sil":
                d.sil(k, v.get("parola"))
                return _cevap(h, 200, {"ok": True})
            if yol == "/api/hesap/yasiyor":
                return _cevap(h, 200, {"var": d.yasiyor(v.get("kimlik"))})
            if yol == "/api/hesap/kullanici":
                return _cevap(h, 200, d.kullanici_ekle(k, v.get("ad"), v.get("parola"), v.get("rol") or "uye"))
            if yol == "/api/hesap/profil":
                return _cevap(h, 200, {"kullanici": d.profil_ayarla(k, v.get("gorunen_ad"), v.get("renk"),
                                                                    v.get("dogum"), v.get("hitap"), v.get("eposta"))})
            if yol == "/api/hesap/cihaz-cikar":
                return _cevap(h, 200, {"ok": True, "bu": d.cihaz_cikar(k, _jeton(h), v.get("id"), ip)})
            if yol == "/api/hesap/otekilerden-cik":
                return _cevap(h, 200, {"ok": True, "n": d.otekilerden_cik(k, _jeton(h), ip)})
            if yol == "/api/hesap/yonet":
                return _cevap(h, 200, {"kullanici": d.yonet(k, v.get("id"), v.get("rol"), v.get("plan"))})
            if yol == "/api/hesap/ayar":
                return _cevap(h, 200, {"kayit": d.kayit_ayarla(k, v.get("kayit"))})
            raise Hata(404, "Böyle bir istek yok.")
        if yontem == "GET":
            k = d.oturum(_jeton(h))
            if k is None:
                raise Hata(401, "Oturum yok ya da süresi doldu; yeniden giriş yap.")
            if yol == "/api/hesap/ben":
                return _cevap(h, 200, {"kullanici": k, "ozet": d.ozet(k), "ayrinti": d.ayrinti(k),
                                       "soru_var": d.soru_var(k), "planlar": list(PLANLAR),
                                       "renkler": list(RENKLER), "kayit": d.kayit_acik()})
            if yol == "/api/hesap/etkinlik":
                return _cevap(h, 200, {"olaylar": d.etkinlik(k)})
            if yol == "/api/hesap/disa":
                return _cevap(h, 200, d.disa(k))
            if yol == "/api/hesap/cihazlar":
                return _cevap(h, 200, {"cihazlar": d.cihazlar(k, _jeton(h))})
            if yol == "/api/hesap/kullanicilar":
                return _cevap(h, 200, {"kullanicilar": d.kullanicilar(k), "kayit": d.kayit_acik()})
        raise Hata(404, "Böyle bir istek yok.")
    except Hata as e:
        return _cevap(h, e.kod, {"hata": e.mesaj})
    except (sqlite3.Error, OSError) as e:
        return _cevap(h, 503, {"hata": "Hesap deposu açılamadı: %s" % e})
