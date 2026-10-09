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

   BAGLANTILAR (depo sahibi, 2026-10-08: «hesap ozelligini cok daha
   profesyonel yap; bazi uygulamalari ucretsiz baglayabilelim»). Hicbiri
   bir sirket hesabi, ucret ya da internet istemez; hepsi bu bilgisayarda.
  14. IKI ADIMLI DOGRULAMA (TOTP, RFC 6238: SHA-1, 6 hane, 30 sn). Google
      Authenticator, Microsoft Authenticator, iPhone Sifreler ayni kodu
      uretir. Acikken sifre dogru olsa da oturum ACILMAZ: 5 dakikalik bir
      bilet doner, kod (ya da tek kullanimlik yedek kod) bileti oturuma
      cevirir. Ayni kod iki kez kullanilmaz (son adim saklanir); yanlis
      kod girisle ayni bekletmeye tabidir. Sifremi unuttum da kodu ister:
      yeni sifre ancak kod dogrulaninca yazilir. Sir, sunucunun kodu
      dogrulayabilmesi icin bu depoda acik durur (her TOTP sunucusu gibi);
      yedek kodlarin yalniz ozeti saklanir. Telefon da yedek kodlar da
      kaybolursa bilgisayarin kendisinde:
      `python sistem/hesap.py --iki-adim-kapat <ad>`.
  15. KODLA CIHAZ BAGLAMA. Girisli bir cihaz 5 dakikalik, tek kullanimlik
      6 haneli bir kod acar; yeni cihaz sifre yazmadan o kodla girer. Kod
      girisli (iki adimi gecmis) bir oturumdan acildigi icin ikinci adim
      sorulmaz. Yanlis kodda IP basina ve toplamda bekletilir.
  16. ERISIM ANAHTARLARI ve GELEN KUTUSU. iPhone Kisayollar, Android HTTP
      Shortcuts, Home Assistant gibi uygulamalar kullanicinin actigi bir
      anahtarla «su 250», «kilo 72,4» gibi tek satir gonderir. Sunucu
      satiri ANLAMAZ ve hicbir modulun kaydina yazmaz (AGENTS §1.1, §1.4):
      gelen kutusuna koyar; modul (SPI) kendi ayristiricisiyla okur ve
      Onaylar'a oneri olarak birakir — olcum onaysiz yazilmaz. Anahtar
      bir kez gosterilir, yalniz ozeti saklanir; oturum jetonu yerine
      gecmez (hesap API'sinin geri kalanina girmez).
  17. TAKVIM ABONELIGI. Modul kendi takvimini (.ics) yayinlar; sunucu
      onu ANLAMADAN birlestirir ve gizli bir adreste sunar (iPhone Takvim,
      Thunderbird, klasik Outlook abone olur). Adres yalniz okumadir;
      Google Takvim gibi internetten ceken takvimler ev agina ulasamaz,
      bu ekranda soylenir. Adres yeniden gosterilebilsin diye jetonu acik
      saklanir; «yenile» eskisini hemen gecersiz kilar.
  18. CIHAZLAR KENDI ADIYLA (2026-10-08 ikinci tur: «hesap sistemini
      gelistir»). Her oturum nasil acildigini (sifre, iki adim, yedek kod,
      baglama kodu, kurtarma, kayit) ve son goruldugu adresi tasir.
      Kullanici bir cihaza ad verir («Omer'in iPhone'u»); ad cihaz
      kimligine baglidir: o cihaz cikip yeniden girse de ad kalir.
  19. YENI GIRIS UYARISI. Giris, kodla baglanma, kurtarma ve yanlis
      denemeler actiklari oturuma ve cihaza bagli yazilir; hesap
      sayfasi baska bir cihazdan gelenleri «Bendim / Incele» diye sorar.
      Hangisinin goruldugu CIHAZDA tutulur (her cihaz kendisi gorur);
      sunucu yalniz son olaylari ve hangisinin bu cihazdan oldugunu verir.
  20. DEPONUN YEDEGI (2026-10-08 ucuncu tur: «hesap deposunun yedegi»).
      Her gun ilk istekte, ARKADA (istek beklemez) SQLite'in kendi
      yedekleme yoluyla tutarli bir kopya alinir: <klasor>/yedek, son 7
      gunluk + 5 elle + 5 «geri yuklemeden once». Her yedek yazildiktan
      sonra SQLite denetiminden gecer; gecmeyen yedek sayilmaz. Admin
      bilgisayardan bir IKINCI YER (baska disk, USB) secer: disk bozulursa
      asil koruma odur; ulasilamazsa bu soylenir, yedek yine alinir.
      Geri yukleme BUYUK aksiyondur (AGENTS §1.9): admin, yalniz bu
      bilgisayardan, sifreyle, onizlemeden sonra; once simdiki halin
      yedegi alinir (geri donus noktasi). Guvenlik geri gitmez: butun
      oturumlar kapanir, simdi silinmis anahtar ve takvim adresi geri
      gelmez. Deponun DONEMI degisir; cihazlar kendi kayitlarini yeniden
      yollar (son yazan kazanir): yedekten sonraki degisiklik cihazlardan
      geri akar (hesap.js soz 23). Sunucu acilamazsa:
      `python sistem/hesap.py --yedekle | --yedekler | --geri-yukle <ad>`.

   Yalniz Python standart kutuphanesi (AGENTS §1.3).
"""

import base64
import contextlib
import hashlib
import hmac
import json
import os
import re
import pathlib
import secrets
import shutil
import sqlite3
import struct
import sys
import threading
import time
import urllib.parse

SURUM = 7
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

# Iki adimli dogrulama (soz 14)
KOD_ADIM = 30                         # sn (RFC 6238 varsayilani)
KOD_HANE = 6
KOD_PENCERE = 1                       # +-1 adim: telefon saati biraz kaymis olabilir
BILET_SN = 300
BILET_DENEME = 5
YEDEK_ADET = 10
YEDEK_ABECE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"   # 0/O, 1/I karismaz
YEDEK_RE = re.compile(r"^[%s]{8}$" % YEDEK_ABECE)
SIR_RE = re.compile(r"^[A-Z2-7]{16,64}$")
# Kodla cihaz baglama (soz 15)
BAG_SN = 300
# Erisim anahtarlari ve gelen kutusu (soz 16)
ANAHTAR_ON = "lifeos_"
ANAHTAR_EN_COK = 20
ANAHTAR_AD_EN_UZUN = 40
YETKILER = ("kayit",)                 # disaridan tek yetki: gelen kutusuna satir birakmak
GELEN_MODULLER = ("spi",)
GELEN_METIN_EN_UZUN = 300
GELEN_EN_COK = 200                    # kullanici basina saklanan
GELEN_SAAT_EN_COK = 120               # bir anahtarla saatte (dongude kalan bir kisayol)
GELEN_PARTI = 20
GELEN_ALIM_SN = 600                   # alinip sonucu gelmeyen satir 10 dk sonra yeniden verilir
GELEN_SONUC_EN_UZUN = 160
GELEN_DURUMLAR = ("onayda", "anlasilmadi")
# Takvim aboneligi (soz 17)
YAYIN_RE = re.compile(r"^(ays|spi|esp)/takvim$")
YAYIN_EN_BUYUK = 512 * 1024
TAKVIM_YOL_RE = re.compile(r"^/api/hesap/takvim/([A-Za-z0-9_\-]{20,64})\.ics$")
# Cihazlar ve uyarilar (soz 18-19)
YONTEMLER = ("sifre", "iki-adim", "yedek", "kod", "kurtar", "kayit", "kur")
CIHAZ_AD_EN_UZUN = 40
UYARI_TURLERI = ("giris", "bag", "kurtar", "yanlis", "kurtar-yanlis", "kod-yanlis", "parola", "iki-adim-kapat")
UYARI_GUN = 30
UYARI_EN_COK = 20

# Deponun yedegi (soz 20). Kodda «kopya»: «yedek» iki adimin yedek kodudur.
KOPYA_SAKLA = {"gunluk": 7, "elle": 5, "once": 5}     # tur basina saklanan en yeni
KOPYA_RE = re.compile(r"^hesap-(gunluk|elle|once)-(\d{8})-(\d{6})\.db$")
IKINCI_RE = re.compile(r"^lifeos-hesap-(\d{8})-(\d{6})\.db$")
IKINCI_SAKLA = 7
IKINCI_YOL_EN_UZUN = 260
KOPYA_BAKIS_SN = 600                  # gunluk yedek en cok bu aralikla denetlenir
KOPYA_TABLOLAR = ("kullanici", "oturum", "kayit")

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
CREATE TABLE IF NOT EXISTS iki_adim(
  kullanici INTEGER PRIMARY KEY,
  sir TEXT NOT NULL,
  acik INTEGER NOT NULL DEFAULT 0,
  son_adim INTEGER NOT NULL DEFAULT 0,
  olusturma REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS yedek_kod(
  kullanici INTEGER NOT NULL,
  ozet TEXT NOT NULL,
  kullanildi REAL,
  PRIMARY KEY(kullanici, ozet)
);
CREATE TABLE IF NOT EXISTS bilet(
  ozet TEXT PRIMARY KEY,
  kullanici INTEGER NOT NULL,
  tur TEXT NOT NULL,
  cihaz TEXT,
  cihaz_ad TEXT,
  bitis REAL NOT NULL,
  deneme INTEGER NOT NULL DEFAULT 0,
  bekleyen TEXT
);
CREATE TABLE IF NOT EXISTS bag_kodu(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ozet TEXT NOT NULL UNIQUE,
  kullanici INTEGER NOT NULL,
  olusturma REAL NOT NULL,
  bitis REAL NOT NULL,
  kullanan TEXT,
  kullanildi REAL
);
CREATE TABLE IF NOT EXISTS anahtar(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kullanici INTEGER NOT NULL,
  ad TEXT NOT NULL,
  ozet TEXT NOT NULL UNIQUE,
  on_ek TEXT NOT NULL,
  yetki TEXT NOT NULL,
  olusturma REAL NOT NULL,
  son REAL
);
CREATE TABLE IF NOT EXISTS gelen(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kullanici INTEGER NOT NULL,
  modul TEXT NOT NULL,
  metin TEXT NOT NULL,
  kaynak TEXT,
  anahtar INTEGER,
  zaman REAL NOT NULL,
  durum TEXT NOT NULL,
  alan_cihaz TEXT,
  alim REAL,
  sonuc TEXT,
  islenme REAL
);
CREATE INDEX IF NOT EXISTS gelen_kullanici ON gelen(kullanici, modul, id);
CREATE TABLE IF NOT EXISTS yayin(
  kullanici INTEGER NOT NULL,
  ad TEXT NOT NULL,
  icerik TEXT NOT NULL,
  adet INTEGER,
  zaman REAL NOT NULL,
  PRIMARY KEY(kullanici, ad)
);
CREATE TABLE IF NOT EXISTS takvim(
  kullanici INTEGER PRIMARY KEY,
  jeton TEXT NOT NULL UNIQUE,
  olusturma REAL NOT NULL,
  son REAL
);
CREATE TABLE IF NOT EXISTS cihaz_adi(
  kullanici INTEGER NOT NULL,
  cihaz TEXT NOT NULL,
  ad TEXT NOT NULL,
  PRIMARY KEY(kullanici, cihaz)
);
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


# ------------------------------------------------------------ TOTP (soz 14)

def sir_uret():
    """160 bitlik rastgele sir, Base32 (dolgusuz) — dogrulayici uygulamalarin
    QR'dan ya da elle okudugu bicim."""
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii").rstrip("=")


def _sir_bayt(sir):
    s = str(sir or "").upper()
    return base64.b32decode(s + "=" * (-len(s) % 8))


def totp(sir, adim, hane=KOD_HANE):
    """RFC 6238 / RFC 4226: HMAC-SHA1(sir, adim) -> dinamik kesme -> hane."""
    h = hmac.new(_sir_bayt(sir), struct.pack(">Q", int(adim)), hashlib.sha1).digest()
    o = h[-1] & 0x0F
    n = (struct.unpack(">I", h[o:o + 4])[0] & 0x7FFFFFFF) % (10 ** hane)
    return str(n).zfill(hane)


def otpauth(ad, sir):
    """Dogrulayici uygulamanin okudugu adres (Key Uri Format)."""
    etiket = urllib.parse.quote("LifeOS:" + ad, safe=":")
    return "otpauth://totp/%s?secret=%s&issuer=LifeOS&algorithm=SHA1&digits=%d&period=%d" % (
        etiket, sir, KOD_HANE, KOD_ADIM)


def _kod_normal(kod):
    """Bosluk ve tire atilir; yedek kodda harf buyutulur."""
    return re.sub(r"[\s\-]", "", str(kod or "")).upper()


def _yedek_uret():
    return "".join(secrets.choice(YEDEK_ABECE) for _ in range(8))


def _yedek_ozeti(kod):
    return hashlib.sha256(("lifeos-yedek:" + kod).encode("utf-8")).hexdigest()


class Depo:
    def __init__(self, yol=None, tur=TUR, saat=time.time):
        self.yol = yol or os.path.join(klasor(), "hesap.db")
        os.makedirs(os.path.dirname(self.yol) or ".", exist_ok=True)
        self.kilit = threading.RLock()
        self.tur = tur
        self.saat = saat
        self._deneme = {}               # anahtar -> [yanlis sayisi, bekleme bitisi]
        # Soz 20: gunluk yedek yalniz asil depoda kendiliginden alinir (yol
        # verilmediyse); testlerin gecici deposu elle ister.
        self.otomatik_kopya = yol is None
        self._kopya_kilit = threading.RLock()
        self._kopya_bakis = float("-inf")
        self._kopya_hata = ""
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
        var = {r["name"] for r in c.execute("PRAGMA table_info(oturum)")}
        # surum 6 (soz 18): girisin yolu ve son adres.
        for ad, tur in (("esitleme", "REAL"), ("yontem", "TEXT"), ("ip", "TEXT")):
            if ad not in var:
                c.execute("ALTER TABLE oturum ADD COLUMN %s %s" % (ad, tur))
        var = {r["name"] for r in c.execute("PRAGMA table_info(olay)")}
        # surum 6 (soz 19): olayin cihazi ve actigi oturum (uyari «Bendim / Cikar»).
        for ad, tur in (("cihaz", "TEXT"), ("oturum", "INTEGER")):
            if ad not in var:
                c.execute("ALTER TABLE olay ADD COLUMN %s %s" % (ad, tur))

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

    def _oturum_ac(self, c, kullanici, cihaz, cihaz_ad, yontem="sifre", ip=""):
        """Soz 18: kullanicinin bu cihaza verdigi ad varsa o kullanilir."""
        jeton = secrets.token_urlsafe(32)
        simdi = self.saat()
        if cihaz:
            r = c.execute("SELECT ad FROM cihaz_adi WHERE kullanici=? AND cihaz=?", (kullanici, cihaz)).fetchone()
            if r is not None:
                cihaz_ad = r["ad"]
        c.execute("INSERT INTO oturum(ozet, kullanici, cihaz, cihaz_ad, olusturma, son, yontem, ip) "
                  "VALUES(?,?,?,?,?,?,?,?)", (_jeton_ozeti(jeton), kullanici, cihaz or "", (cihaz_ad or "")[:80],
                                             simdi, simdi, yontem if yontem in YONTEMLER else "sifre", (ip or "")[:64]))
        return jeton

    def _giris(self, c, kid, tur, cihaz, cihaz_ad, ip, yontem, ayrinti=""):
        """Oturum acar ve olayi o oturuma bagli yazar (soz 19). Doner: cevap."""
        jeton = self._oturum_ac(c, kid, cihaz, cihaz_ad, yontem, ip)
        r = c.execute("SELECT rowid AS id, cihaz_ad FROM oturum WHERE ozet=?", (_jeton_ozeti(jeton),)).fetchone()
        self._olay(c, kid, tur, r["cihaz_ad"], ip, ayrinti, cihaz=cihaz, oturum=r["id"])
        return {"jeton": jeton, "kullanici": self._kullanici(c, kid)}

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

    def _olay(self, c, kid, tur, cihaz_ad="", ip="", ayrinti="", cihaz="", oturum=None):
        c.execute("INSERT INTO olay(kullanici, tur, cihaz_ad, ip, ayrinti, zaman, cihaz, oturum) VALUES(?,?,?,?,?,?,?,?)",
                  (kid, tur, (cihaz_ad or "")[:80], (ip or "")[:64], (ayrinti or "")[:120], self.saat(),
                   (cihaz or "")[:64], oturum))
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
            return self._giris(c, kid, "kayit", cihaz, cihaz_ad, ip, "kur")

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
            return self._giris(c, kid, "kayit", cihaz, cihaz_ad, ip, "kayit")

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
                ozet = self._ozet(yeni, tuz, self.tur)
                if self._iki_adim_acik(c, r["id"]):
                    # Soz 14: yeni sifre ancak kod dogrulaninca yazilir.
                    return self._bilet_ac(c, r["id"], "kurtar", cihaz, cihaz_ad, json.dumps(
                        {"tuz": tuz.hex(), "ozet": ozet.hex(), "tur": self.tur}))
                c.execute("UPDATE kullanici SET tuz=?, ozet=?, tur=? WHERE id=?",
                          (tuz, ozet, self.tur, r["id"]))
                c.execute("DELETE FROM oturum WHERE kullanici=?", (r["id"],))
                return self._giris(c, r["id"], "kurtar", cihaz, cihaz_ad, ip, "kurtar")
            if r is not None:
                self._olay(c, r["id"], "kurtar-yanlis", cihaz_ad, ip, cihaz=cihaz)
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
                if self._iki_adim_acik(c, r["id"]):
                    return self._bilet_ac(c, r["id"], "giris", cihaz, cihaz_ad)     # soz 14
                return self._giris(c, r["id"], "giris", cihaz, cihaz_ad, ip, "sifre")
            if r is not None:
                self._olay(c, r["id"], "yanlis", cihaz_ad, ip, cihaz=cihaz)     # soz 11: hesabin sahibi gorsun
        with self.kilit:
            self._deneme_yanlis(anahtarlar)
        raise Hata(401, "Kullanıcı adı ya da şifre yanlış.")

    def oturum(self, jeton, ip=None):
        """Jeton gecerliyse kullanici, degilse None. ip: oturumun son
        adresi (soz 18) degistiyse yazilir."""
        if not jeton or not isinstance(jeton, str) or len(jeton) > 200:
            return None
        oz = _jeton_ozeti(jeton)
        simdi = self.saat()
        with self._islem() as c:
            r = c.execute("SELECT kullanici, son, ip FROM oturum WHERE ozet=?", (oz,)).fetchone()
            if r is None:
                return None
            if simdi - r["son"] > OTURUM_GUN * 86400:
                c.execute("DELETE FROM oturum WHERE ozet=?", (oz,))
                return None
            if simdi - r["son"] > 60:
                c.execute("UPDATE oturum SET son=? WHERE ozet=?", (simdi, oz))
            if ip and ip != r["ip"]:
                c.execute("UPDATE oturum SET ip=? WHERE ozet=?", (str(ip)[:64], oz))
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
            iki = {r["kullanici"] for r in c.execute("SELECT kullanici FROM iki_adim WHERE acik=1")}
            for r in c.execute(
                    "SELECT k.id, k.ad, k.rol, k.gorunen_ad, k.renk, k.plan, k.olusturma, "
                    "COUNT(o.ozet) AS cihaz, MAX(o.son) AS son FROM kullanici k "
                    "LEFT JOIN oturum o ON o.kullanici=k.id GROUP BY k.id ORDER BY k.id").fetchall():
                p = self._profil(r, ozel=False)          # soz 12: baskasinin kisisel bilgisi yok
                p["cihaz"] = r["cihaz"]
                p["son"] = int(r["son"] * 1000) if r["son"] else None
                p["iki_adim"] = r["id"] in iki
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
            ozel = {r["cihaz"] for r in c.execute("SELECT cihaz FROM cihaz_adi WHERE kullanici=?", (kullanici["id"],))}
            return [{"id": r["id"], "cihaz_ad": r["cihaz_ad"] or "Cihaz",
                     "olusturma": int(r["olusturma"] * 1000), "son": int(r["son"] * 1000),
                     "esitleme": int(r["esitleme"] * 1000) if r["esitleme"] else None,
                     "yontem": r["yontem"] or "", "ip": r["ip"] or "",
                     "ozel_ad": bool(r["cihaz"]) and r["cihaz"] in ozel,
                     "bu": r["ozet"] == bu}
                    for r in c.execute("SELECT rowid AS id, ozet, cihaz, cihaz_ad, olusturma, son, esitleme, yontem, ip "
                                       "FROM oturum WHERE kullanici=? ORDER BY (ozet=?) DESC, son DESC",
                                       (kullanici["id"], bu))]

    def cihaz_adlandir(self, kullanici, oid, ad):
        """Soz 18: kullanici kendi oturumlarindan birinin cihazina ad verir.
        Ad cihaz kimligine yazilir: o cihazin sonraki girisleri de bu adla."""
        if not isinstance(oid, int) or isinstance(oid, bool):
            raise Hata(400, "Geçersiz cihaz.")
        ad = " ".join(str(ad or "").split())
        if not ad or len(ad) > CIHAZ_AD_EN_UZUN or any(ord(ch) < 32 for ch in ad):
            raise Hata(400, "Cihaz adı 1–%d karakter olmalı." % CIHAZ_AD_EN_UZUN)
        with self._islem() as c:
            r = c.execute("SELECT cihaz FROM oturum WHERE rowid=? AND kullanici=?", (oid, kullanici["id"])).fetchone()
            if r is None:
                raise Hata(404, "Bu cihaz artık listede yok.")
            c.execute("UPDATE oturum SET cihaz_ad=? WHERE rowid=?", (ad, oid))
            if r["cihaz"]:
                c.execute("UPDATE oturum SET cihaz_ad=? WHERE kullanici=? AND cihaz=?", (ad, kullanici["id"], r["cihaz"]))
                c.execute("INSERT INTO cihaz_adi(kullanici, cihaz, ad) VALUES(?,?,?) ON CONFLICT(kullanici, cihaz) "
                          "DO UPDATE SET ad=excluded.ad", (kullanici["id"], r["cihaz"], ad))
            return ad

    def uyarilar(self, kullanici, jeton):
        """Soz 19: son UYARI_GUN gunun giris ve yanlis deneme olaylari; hangisi
        bu cihazdan (bu) ve actigi oturum hala acik mi (oturum)."""
        sinir = self.saat() - UYARI_GUN * 86400
        with self._islem() as c:
            r = c.execute("SELECT cihaz FROM oturum WHERE ozet=?", (_jeton_ozeti(jeton or ""),)).fetchone()
            bu = (r["cihaz"] or "") if r else ""
            acik = {x["id"] for x in c.execute("SELECT rowid AS id FROM oturum WHERE kullanici=?", (kullanici["id"],))}
            soru = ",".join("?" * len(UYARI_TURLERI))
            return [{"id": x["id"], "tur": x["tur"], "cihaz_ad": x["cihaz_ad"] or "", "ip": x["ip"] or "",
                     "ayrinti": x["ayrinti"] or "", "zaman": int(x["zaman"] * 1000),
                     "bu": bool(bu) and x["cihaz"] == bu,
                     "oturum": x["oturum"] if x["oturum"] in acik else None}
                    for x in c.execute("SELECT id, tur, cihaz_ad, ip, ayrinti, zaman, cihaz, oturum FROM olay "
                                       "WHERE kullanici=? AND zaman>=? AND tur IN (%s) ORDER BY id DESC LIMIT ?" % soru,
                                       (kullanici["id"], sinir) + UYARI_TURLERI + (UYARI_EN_COK,))]

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

    def yonet(self, yapan, kid, rol=None, plan=None, iki_adim=None):
        """iki_adim=False: uyenin iki adimli dogrulamasini kapatir (telefonunu
        ve yedek kodlarini kaybetmis bir aile uyesi). Admin kendi iki adimini
        buradan kapatamaz: kendi sayfasindan kodla ya da bilgisayardan."""
        if not yapan or yapan.get("rol") != "admin":
            raise Hata(403, "Kullanıcıları yalnız admin yönetir.")
        if not isinstance(kid, int) or isinstance(kid, bool):
            raise Hata(400, "Geçersiz kullanıcı.")
        if rol is not None and rol not in ("admin", "uye"):
            raise Hata(400, "Rol «admin» ya da «uye» olmalı.")
        if plan is not None and plan not in PLAN_IDS:
            raise Hata(400, "Bu plan katalogda yok.")
        if iki_adim is not None and iki_adim is not False:
            raise Hata(400, "İki adımlı doğrulamayı yalnız kullanıcının kendisi açar.")
        if iki_adim is False and kid == yapan.get("id"):
            raise Hata(409, "Kendi iki adımlı doğrulamanı Güvenlik sayfasından kapatırsın.")
        with self._islem() as c:
            if iki_adim is False and c.execute("SELECT 1 FROM kullanici WHERE id=?", (kid,)).fetchone():
                if c.execute("DELETE FROM iki_adim WHERE kullanici=?", (kid,)).rowcount:
                    c.execute("DELETE FROM yedek_kod WHERE kullanici=?", (kid,))
                    c.execute("DELETE FROM bilet WHERE kullanici=?", (kid,))
                    self._olay(c, kid, "iki-adim-kapat", "", "", "admin: " + yapan.get("ad", ""))
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
            p = self._kullanici(c, kid, ozel=(kid == yapan.get("id")))
            p["iki_adim"] = self._iki_adim_acik(c, kid)
            return p

    # ---------------------------------------------------------- esitleme

    def _sira(self, c):
        r = c.execute("SELECT deger FROM sayac WHERE ad='sira'").fetchone()
        return r["deger"] if r else 0

    def esitle(self, kullanici, alan, cihaz, son, gonder, sinir=SINIR, jeton=None, yalniz_gonder=False):
        """Cihazdan gelenleri uygular, cihazin gormedigi degisiklikleri dondurur.

        gonder: [{"y": yol, "d": deger | None (silme), "z": ms, "ilk": bool}]
        yalniz_gonder: geri yuklemeden sonra cihaz once kendi kayitlarini
        yollar (soz 20); bu turda bir sey dondurulmez, imlec ilerlemez.
        Doner: {"al": [{"y", "d", "z", "s"}], "son": imlec, "daha": bool,
                "kabul": n, "red": n, "donem": deponun donemi}"""
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
            donem = self._donem(c)
            if yalniz_gonder:
                return {"al": [], "son": son, "daha": False, "kabul": kabul, "red": red, "donem": donem}
            satirlar = c.execute(
                "SELECT yol, deger, zaman, cihaz, sira FROM kayit WHERE kullanici=? AND alan=? "
                "AND sira>? ORDER BY sira LIMIT ?", (kid, alan, son, sinir + 1)).fetchall()
        daha = len(satirlar) > sinir
        satirlar = satirlar[:sinir]
        yeni_son = satirlar[-1]["sira"] if daha else max(son, sira)
        al = [{"y": s["yol"], "d": None if s["deger"] is None else json.loads(s["deger"]),
               "z": s["zaman"], "s": s["sira"]}
              for s in satirlar if s["cihaz"] != cihaz]
        return {"al": al, "son": yeni_son, "daha": daha, "kabul": kabul, "red": red, "donem": donem}

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
            for t in ("kayit", "oturum", "olay", "iki_adim", "yedek_kod", "bilet", "bag_kodu", "anahtar",
                      "gelen", "yayin", "takvim", "cihaz_adi"):
                c.execute("DELETE FROM %s WHERE kullanici=?" % t, (kullanici["id"],))
            c.execute("DELETE FROM kullanici WHERE id=?", (kullanici["id"],))

    def yasiyor(self, kimlik):
        """Bu kimlikte bir hesap hala var mi? (cihaz baglantisi, soz 13)"""
        if not isinstance(kimlik, str) or not KIMLIK_RE.match(kimlik):
            raise Hata(400, "Geçersiz kimlik.")
        with self._islem() as c:
            return c.execute("SELECT 1 FROM kullanici WHERE kimlik=?", (kimlik,)).fetchone() is not None

    # --------------------------------------------- iki adimli dogrulama (soz 14)

    def _parola_bak(self, c, kid, parola, mesaj="Şifre yanlış."):
        r = c.execute("SELECT tuz, ozet, tur FROM kullanici WHERE id=?", (kid,)).fetchone()
        p = parola if isinstance(parola, str) else ""
        if r is None or not hmac.compare_digest(self._ozet(p, r["tuz"], r["tur"]), r["ozet"]):
            raise Hata(401, mesaj)

    @staticmethod
    def _iki_adim_acik(c, kid):
        return c.execute("SELECT 1 FROM iki_adim WHERE kullanici=? AND acik=1", (kid,)).fetchone() is not None

    def _totp_adim(self, sir, son_adim, kod):
        """Kod pencerede ve daha once kullanilmamis bir adimdaysa o adim."""
        if not re.match(r"^\d{%d}$" % KOD_HANE, kod):
            return None
        simdi = int(self.saat() // KOD_ADIM)
        for a in range(simdi - KOD_PENCERE, simdi + KOD_PENCERE + 1):
            if a > son_adim and hmac.compare_digest(totp(sir, a), kod):
                return a
        return None

    def _kod_dogrula(self, c, kid, kod):
        """'kod' (dogrulayici), 'yedek' (tek kullanimlik) ya da None. Dogru
        kod kullanildi olarak isaretlenir: ayni kod ikinci kez gecmez."""
        k = _kod_normal(kod)
        r = c.execute("SELECT sir, son_adim FROM iki_adim WHERE kullanici=? AND acik=1", (kid,)).fetchone()
        if r is None:
            return None
        adim = self._totp_adim(r["sir"], r["son_adim"], k)
        if adim is not None:
            c.execute("UPDATE iki_adim SET son_adim=? WHERE kullanici=?", (adim, kid))
            return "kod"
        if YEDEK_RE.match(k):
            oz = _yedek_ozeti(k)
            y = c.execute("SELECT kullanildi FROM yedek_kod WHERE kullanici=? AND ozet=?", (kid, oz)).fetchone()
            if y is not None and y["kullanildi"] is None:
                c.execute("UPDATE yedek_kod SET kullanildi=? WHERE kullanici=? AND ozet=?", (self.saat(), kid, oz))
                return "yedek"
        return None

    def _yedek_yaz(self, c, kid):
        c.execute("DELETE FROM yedek_kod WHERE kullanici=?", (kid,))
        kodlar = []
        while len(kodlar) < YEDEK_ADET:
            k = _yedek_uret()
            if k not in kodlar:
                kodlar.append(k)
                c.execute("INSERT INTO yedek_kod(kullanici, ozet) VALUES(?,?)", (kid, _yedek_ozeti(k)))
        return [k[:4] + "-" + k[4:] for k in kodlar]

    def iki_adim(self, kullanici):
        with self._islem() as c:
            r = c.execute("SELECT acik, olusturma FROM iki_adim WHERE kullanici=?", (kullanici["id"],)).fetchone()
            kalan = c.execute("SELECT COUNT(*) FROM yedek_kod WHERE kullanici=? AND kullanildi IS NULL",
                              (kullanici["id"],)).fetchone()[0]
        acik = bool(r and r["acik"])
        return {"acik": acik, "olusturma": int(r["olusturma"] * 1000) if acik else None,
                "yedek_kalan": kalan if acik else 0}

    def iki_adim_baslat(self, kullanici, parola):
        """Kurulum adim 1: sifre sorulur, yeni sir uretilir (henuz kapali)."""
        with self._islem() as c:
            self._parola_bak(c, kullanici["id"], parola)
            if self._iki_adim_acik(c, kullanici["id"]):
                raise Hata(409, "İki adımlı doğrulama zaten açık.")
            sir = sir_uret()
            c.execute("INSERT INTO iki_adim(kullanici, sir, acik, son_adim, olusturma) VALUES(?,?,0,0,?) "
                      "ON CONFLICT(kullanici) DO UPDATE SET sir=excluded.sir, acik=0, son_adim=0, "
                      "olusturma=excluded.olusturma", (kullanici["id"], sir, self.saat()))
        return {"sir": sir, "uri": otpauth(kullanici["ad"], sir)}

    def iki_adim_onayla(self, kullanici, kod, jeton=None, ip=""):
        """Kurulum adim 2: uygulamanin urettigi kod tutarsa acilir; yedek
        kodlar BIR KEZ doner (yalniz ozetleri saklanir)."""
        kid = kullanici["id"]
        anahtarlar = [("kurulum", kid)]
        with self.kilit:
            self._deneme_bak(anahtarlar)
        with self._islem() as c:
            r = c.execute("SELECT sir, acik FROM iki_adim WHERE kullanici=?", (kid,)).fetchone()
            if r is None or r["acik"]:
                raise Hata(409, "Kurulum başlatılmadı ya da doğrulama zaten açık.")
            adim = self._totp_adim(r["sir"], 0, _kod_normal(kod))
            if adim is not None:
                with self.kilit:
                    self._deneme.pop(anahtarlar[0], None)
                c.execute("UPDATE iki_adim SET acik=1, son_adim=?, olusturma=? WHERE kullanici=?",
                          (adim, self.saat(), kid))
                yedek = self._yedek_yaz(c, kid)
                self._olay(c, kid, "iki-adim", self._oturum_cihaz(c, jeton), ip)
                return {"yedek": yedek}
        with self.kilit:
            self._deneme_yanlis(anahtarlar)
        raise Hata(400, "Kod tutmadı. Uygulamadaki güncel kodu yaz; telefonun saati otomatik ayarda olmalı.")

    def iki_adim_kapat(self, kullanici, parola, kod, jeton=None, ip=""):
        kid = kullanici["id"]
        with self._islem() as c:
            self._parola_bak(c, kid, parola)
            if not self._iki_adim_acik(c, kid):
                raise Hata(409, "İki adımlı doğrulama zaten kapalı.")
            if self._kod_dogrula(c, kid, kod):
                for t in ("iki_adim", "yedek_kod", "bilet"):
                    c.execute("DELETE FROM %s WHERE kullanici=?" % t, (kid,))
                self._olay(c, kid, "iki-adim-kapat", self._oturum_cihaz(c, jeton), ip)
                return
        raise Hata(401, "Kod yanlış.")

    def yedek_yenile(self, kullanici, parola, jeton=None, ip=""):
        kid = kullanici["id"]
        with self._islem() as c:
            self._parola_bak(c, kid, parola)
            if not self._iki_adim_acik(c, kid):
                raise Hata(409, "Önce iki adımlı doğrulamayı aç.")
            yedek = self._yedek_yaz(c, kid)
            self._olay(c, kid, "yedek", self._oturum_cihaz(c, jeton), ip)
            return {"yedek": yedek}

    def iki_adim_sifirla(self, ad):
        """Bilgisayarin kendisinden (komut satiri): telefon da yedek kodlar
        da kaybolduysa. Doner: kapatilacak bir sey var miydi."""
        with self._islem() as c:
            r = c.execute("SELECT id FROM kullanici WHERE ad=?", ((ad or "").strip(),)).fetchone()
            if r is None:
                raise Hata(404, "Bu kullanıcı yok.")
            n = c.execute("DELETE FROM iki_adim WHERE kullanici=?", (r["id"],)).rowcount
            c.execute("DELETE FROM yedek_kod WHERE kullanici=?", (r["id"],))
            c.execute("DELETE FROM bilet WHERE kullanici=?", (r["id"],))
            if n:
                self._olay(c, r["id"], "iki-adim-kapat", "Bu bilgisayar", "", "komut satırından")
            return bool(n)

    def _bilet_ac(self, c, kid, tur, cihaz, cihaz_ad, bekleyen=None):
        """Sifre (ya da kurtarma cevabi) dogru, kod bekleniyor."""
        b = secrets.token_urlsafe(24)
        simdi = self.saat()
        c.execute("DELETE FROM bilet WHERE bitis < ?", (simdi,))
        c.execute("INSERT INTO bilet(ozet, kullanici, tur, cihaz, cihaz_ad, bitis, deneme, bekleyen) "
                  "VALUES(?,?,?,?,?,?,0,?)", (_jeton_ozeti(b), kid, tur, cihaz or "", (cihaz_ad or "")[:80],
                                             simdi + BILET_SN, bekleyen))
        return {"iki_adim": True, "bilet": b, "bitis": int((simdi + BILET_SN) * 1000)}

    def giris_kod(self, bilet, kod, ip=""):
        """Bilet + dogrulayici kodu (ya da yedek kod) -> oturum."""
        suresi = Hata(401, "Doğrulama süresi doldu; yeniden giriş yap.")
        if not isinstance(bilet, str) or not bilet or len(bilet) > 200:
            raise suresi
        oz = _jeton_ozeti(bilet)
        with self._islem() as c:
            b = c.execute("SELECT kullanici, bitis FROM bilet WHERE ozet=?", (oz,)).fetchone()
        if b is None or b["bitis"] < self.saat():
            raise suresi
        kid = b["kullanici"]
        anahtarlar = [("kod", kid), ("ip", ip)]
        with self.kilit:
            self._deneme_bak(anahtarlar)
        with self._islem() as c:
            b = c.execute("SELECT * FROM bilet WHERE ozet=?", (oz,)).fetchone()
            if b is None:
                raise suresi
            tur = self._kod_dogrula(c, kid, kod)
            if tur:
                with self.kilit:
                    for a in anahtarlar:
                        self._deneme.pop(a, None)
                c.execute("DELETE FROM bilet WHERE ozet=?", (oz,))
                ayrinti = "yedek kod" if tur == "yedek" else "iki adımlı"
                if b["tur"] == "kurtar" and b["bekleyen"]:
                    y = json.loads(b["bekleyen"])
                    c.execute("UPDATE kullanici SET tuz=?, ozet=?, tur=? WHERE id=?",
                              (bytes.fromhex(y["tuz"]), bytes.fromhex(y["ozet"]), int(y["tur"]), kid))
                    c.execute("DELETE FROM oturum WHERE kullanici=?", (kid,))
                    return self._giris(c, kid, "kurtar", b["cihaz"], b["cihaz_ad"], ip, "kurtar", ayrinti)
                return self._giris(c, kid, "giris", b["cihaz"], b["cihaz_ad"], ip,
                                   "yedek" if tur == "yedek" else "iki-adim", ayrinti)
            deneme = b["deneme"] + 1
            if deneme >= BILET_DENEME:
                c.execute("DELETE FROM bilet WHERE ozet=?", (oz,))
            else:
                c.execute("UPDATE bilet SET deneme=? WHERE ozet=?", (deneme, oz))
            self._olay(c, kid, "kod-yanlis", b["cihaz_ad"], ip, cihaz=b["cihaz"])
        with self.kilit:
            self._deneme_yanlis(anahtarlar)
        if deneme >= BILET_DENEME:
            raise Hata(401, "Kod üst üste yanlış; yeniden giriş yap.")
        raise Hata(401, "Kod yanlış ya da az önce kullanıldı; uygulamadaki yeni kodu yaz.")

    # ------------------------------------------------ kodla cihaz baglama (soz 15)

    def bag_kodu_ac(self, kullanici):
        kid, simdi = kullanici["id"], self.saat()
        with self._islem() as c:
            # Bir kullanicinin tek acik kodu olur; biten kodlar bir saat durum icin kalir.
            c.execute("DELETE FROM bag_kodu WHERE bitis < ? OR (kullanici=? AND kullanildi IS NULL)",
                      (simdi - 3600, kid))
            for _ in range(50):
                kod = str(secrets.randbelow(10 ** 6)).zfill(6)
                oz = _jeton_ozeti("bag:" + kod)
                if c.execute("SELECT 1 FROM bag_kodu WHERE ozet=?", (oz,)).fetchone() is None:
                    break
            else:
                raise Hata(503, "Kod üretilemedi; yeniden dene.")
            cur = c.execute("INSERT INTO bag_kodu(ozet, kullanici, olusturma, bitis) VALUES(?,?,?,?)",
                            (oz, kid, simdi, simdi + BAG_SN))
            return {"kod": kod, "id": cur.lastrowid, "bitis": int((simdi + BAG_SN) * 1000)}

    def bag_durum(self, kullanici, bid):
        if not isinstance(bid, int) or isinstance(bid, bool):
            raise Hata(400, "Geçersiz kod.")
        with self._islem() as c:
            r = c.execute("SELECT bitis, kullanan, kullanildi FROM bag_kodu WHERE id=? AND kullanici=?",
                          (bid, kullanici["id"])).fetchone()
        if r is None:
            return {"durum": "yok"}
        if r["kullanildi"]:
            return {"durum": "baglandi", "cihaz_ad": r["kullanan"] or "Cihaz"}
        if r["bitis"] < self.saat():
            return {"durum": "bitti"}
        return {"durum": "bekliyor", "bitis": int(r["bitis"] * 1000)}

    def bag_kodu_kapat(self, kullanici, bid):
        if not isinstance(bid, int) or isinstance(bid, bool):
            raise Hata(400, "Geçersiz kod.")
        with self._islem() as c:
            c.execute("DELETE FROM bag_kodu WHERE id=? AND kullanici=? AND kullanildi IS NULL",
                      (bid, kullanici["id"]))

    def bagla(self, kod, cihaz="", cihaz_ad="", ip=""):
        """Yeni cihaz: 6 haneli kod -> oturum (ikinci adim sorulmaz, soz 15)."""
        anahtarlar = [("ip", ip), ("bag", "*")]
        with self.kilit:
            self._deneme_bak(anahtarlar)
        k = re.sub(r"\D", "", str(kod or ""))
        simdi = self.saat()
        with self._islem() as c:
            r = None
            if len(k) == 6:
                r = c.execute("SELECT id, kullanici FROM bag_kodu WHERE ozet=? AND bitis>=? "
                              "AND kullanildi IS NULL", (_jeton_ozeti("bag:" + k), simdi)).fetchone()
            if r is not None:
                with self.kilit:
                    self._deneme.pop(anahtarlar[0], None)
                c.execute("UPDATE bag_kodu SET kullanildi=?, kullanan=? WHERE id=?",
                          (simdi, (cihaz_ad or "Cihaz")[:80], r["id"]))
                return self._giris(c, r["kullanici"], "bag", cihaz, cihaz_ad, ip, "kod")
        with self.kilit:
            self._deneme_yanlis(anahtarlar)
        raise Hata(401, "Kod yanlış ya da süresi doldu. Girişli cihazdan yeni kod al.")

    # ------------------------------------- erisim anahtarlari ve gelen (soz 16)

    def anahtar_ac(self, kullanici, parola, ad, yetki="kayit", jeton=None, ip=""):
        ad = " ".join(str(ad or "").split())
        if not ad or len(ad) > ANAHTAR_AD_EN_UZUN or any(ord(ch) < 32 for ch in ad):
            raise Hata(400, "Anahtara 1–%d karakterlik bir ad ver (örnek: iPhone Kısayollar)." % ANAHTAR_AD_EN_UZUN)
        if yetki not in YETKILER:
            raise Hata(400, "Bu yetki tanımlı değil.")
        kid = kullanici["id"]
        with self._islem() as c:
            self._parola_bak(c, kid, parola)
            if c.execute("SELECT COUNT(*) FROM anahtar WHERE kullanici=?", (kid,)).fetchone()[0] >= ANAHTAR_EN_COK:
                raise Hata(409, "En çok %d anahtar açılabilir; kullanmadığını sil." % ANAHTAR_EN_COK)
            a = ANAHTAR_ON + secrets.token_urlsafe(24)
            cur = c.execute("INSERT INTO anahtar(kullanici, ad, ozet, on_ek, yetki, olusturma) VALUES(?,?,?,?,?,?)",
                            (kid, ad, _jeton_ozeti(a), a[:len(ANAHTAR_ON) + 4], yetki, self.saat()))
            self._olay(c, kid, "anahtar", self._oturum_cihaz(c, jeton), ip, ad)
            return {"anahtar": a, "id": cur.lastrowid, "ad": ad, "yetki": yetki}

    def anahtarlar(self, kullanici):
        with self._islem() as c:
            return [{"id": r["id"], "ad": r["ad"], "yetki": r["yetki"], "on_ek": r["on_ek"],
                     "olusturma": int(r["olusturma"] * 1000), "son": int(r["son"] * 1000) if r["son"] else None}
                    for r in c.execute("SELECT id, ad, yetki, on_ek, olusturma, son FROM anahtar "
                                       "WHERE kullanici=? ORDER BY id", (kullanici["id"],))]

    def anahtar_sil(self, kullanici, aid, jeton=None, ip=""):
        if not isinstance(aid, int) or isinstance(aid, bool):
            raise Hata(400, "Geçersiz anahtar.")
        with self._islem() as c:
            r = c.execute("SELECT ad FROM anahtar WHERE id=? AND kullanici=?", (aid, kullanici["id"])).fetchone()
            if r is None:
                raise Hata(404, "Bu anahtar artık yok.")
            c.execute("DELETE FROM anahtar WHERE id=?", (aid,))
            self._olay(c, kullanici["id"], "anahtar-sil", self._oturum_cihaz(c, jeton), ip, r["ad"])

    def gelen_ekle(self, anahtar, metin, modul="spi", ip=""):
        """Disaridan (Kisayollar, Home Assistant) tek satir. Sunucu satiri
        anlamaz; modul kendi koduyla okur (soz 16)."""
        anahtarlar = [("ip", ip)]
        with self.kilit:
            self._deneme_bak(anahtarlar)
        metin = " ".join(metin.split()) if isinstance(metin, str) else ""
        simdi = self.saat()
        with self._islem() as c:
            r = None
            if isinstance(anahtar, str) and anahtar.startswith(ANAHTAR_ON) and len(anahtar) <= 200:
                r = c.execute("SELECT id, kullanici, ad, yetki FROM anahtar WHERE ozet=?",
                              (_jeton_ozeti(anahtar),)).fetchone()
            if r is not None:
                if r["yetki"] != "kayit":
                    raise Hata(403, "Bu anahtarın kayıt yetkisi yok.")
                if not metin or any(ord(ch) < 32 for ch in metin):
                    raise Hata(400, "Gönderilecek bir satır yok: gövdede «metin» olmalı (örnek: su 250).")
                if len(metin) > GELEN_METIN_EN_UZUN:
                    raise Hata(400, "Satır çok uzun (en çok %d karakter)." % GELEN_METIN_EN_UZUN)
                if modul not in GELEN_MODULLER:
                    raise Hata(400, "Bu modül gelen kutusu kabul etmiyor.")
                if c.execute("SELECT COUNT(*) FROM gelen WHERE anahtar=? AND zaman>?",
                             (r["id"], simdi - 3600)).fetchone()[0] >= GELEN_SAAT_EN_COK:
                    raise Hata(429, "Bu anahtarla bir saatte çok fazla satır geldi; kısayolu denetle.")
                cur = c.execute("INSERT INTO gelen(kullanici, modul, metin, kaynak, anahtar, zaman, durum) "
                                "VALUES(?,?,?,?,?,?,'bekliyor')", (r["kullanici"], modul, metin, r["ad"], r["id"], simdi))
                c.execute("UPDATE anahtar SET son=? WHERE id=?", (simdi, r["id"]))
                c.execute("DELETE FROM gelen WHERE kullanici=? AND id <= (SELECT id FROM gelen WHERE kullanici=? "
                          "ORDER BY id DESC LIMIT 1 OFFSET ?)", (r["kullanici"], r["kullanici"], GELEN_EN_COK))
                return {"ok": True, "id": cur.lastrowid, "durum": "bekliyor",
                        "mesaj": "Alındı. SPİ açılınca Onaylar’a düşer; sen onaylayınca yazılır."}
        with self.kilit:
            self._deneme_yanlis(anahtarlar)
        raise Hata(401, "Anahtar geçersiz ya da silinmiş.")

    def anahtar_dene(self, anahtar, ip=""):
        """Kisayolun ilk adimi: anahtar gecerli mi? Satir birakmaz (soz 16)."""
        anahtarlar = [("ip", ip)]
        with self.kilit:
            self._deneme_bak(anahtarlar)
        with self._islem() as c:
            r = None
            if isinstance(anahtar, str) and anahtar.startswith(ANAHTAR_ON) and len(anahtar) <= 200:
                r = c.execute("SELECT id, ad FROM anahtar WHERE ozet=?", (_jeton_ozeti(anahtar),)).fetchone()
            if r is not None:
                c.execute("UPDATE anahtar SET son=? WHERE id=?", (self.saat(), r["id"]))
                return {"ok": True, "anahtar": r["ad"],
                        "mesaj": "Bağlantı tamam. Satırı POST ile gönder: {\"metin\": \"su 250\"}"}
        with self.kilit:
            self._deneme_yanlis(anahtarlar)
        raise Hata(401, "Anahtar geçersiz ya da silinmiş.")

    def gelen_al(self, kullanici, modul, cihaz):
        """Modul icin bekleyen satirlar. Alinan satir baska cihaza verilmez;
        sonucu gelmezse GELEN_ALIM_SN sonra yeniden verilir."""
        if modul not in GELEN_MODULLER:
            raise Hata(400, "Bu modül gelen kutusu kabul etmiyor.")
        if not isinstance(cihaz, str) or not CIHAZ_RE.match(cihaz):
            raise Hata(400, "Geçersiz cihaz kimliği.")
        simdi = self.saat()
        with self._islem() as c:
            l = c.execute("SELECT id, metin, kaynak, zaman FROM gelen WHERE kullanici=? AND modul=? AND "
                          "(durum='bekliyor' OR (durum='alindi' AND alim<?)) ORDER BY id LIMIT ?",
                          (kullanici["id"], modul, simdi - GELEN_ALIM_SN, GELEN_PARTI)).fetchall()
            for r in l:
                c.execute("UPDATE gelen SET durum='alindi', alan_cihaz=?, alim=? WHERE id=?", (cihaz, simdi, r["id"]))
            return [{"id": r["id"], "metin": r["metin"], "kaynak": r["kaynak"] or "",
                     "zaman": int(r["zaman"] * 1000)} for r in l]

    def gelen_sonuc(self, kullanici, gid, durum, sonuc, cihaz):
        if not isinstance(gid, int) or isinstance(gid, bool):
            raise Hata(400, "Geçersiz satır.")
        if durum not in GELEN_DURUMLAR:
            raise Hata(400, "Geçersiz durum.")
        sonuc = " ".join(str(sonuc or "").split())[:GELEN_SONUC_EN_UZUN]
        with self._islem() as c:
            return c.execute("UPDATE gelen SET durum=?, sonuc=?, islenme=? WHERE id=? AND kullanici=? "
                             "AND durum='alindi' AND alan_cihaz=?",
                             (durum, sonuc, self.saat(), gid, kullanici["id"], cihaz)).rowcount == 1

    def gelen_liste(self, kullanici, sinir=30):
        with self._islem() as c:
            return [{"id": r["id"], "metin": r["metin"], "kaynak": r["kaynak"] or "", "modul": r["modul"],
                     "zaman": int(r["zaman"] * 1000),
                     "durum": "bekliyor" if r["durum"] == "alindi" else r["durum"], "sonuc": r["sonuc"] or "",
                     "islenme": int(r["islenme"] * 1000) if r["islenme"] else None}
                    for r in c.execute("SELECT * FROM gelen WHERE kullanici=? ORDER BY id DESC LIMIT ?",
                                       (kullanici["id"], max(1, min(int(sinir), GELEN_EN_COK))))]

    # ------------------------------------------------ takvim aboneligi (soz 17)

    def yayinla(self, kullanici, ad, icerik, adet=None):
        if not isinstance(ad, str) or not YAYIN_RE.match(ad):
            raise Hata(400, "Geçersiz yayın.")
        if not isinstance(icerik, str) or not icerik.lstrip().startswith("BEGIN:VCALENDAR") \
                or "END:VCALENDAR" not in icerik:
            raise Hata(400, "Takvim okunamadı.")
        if len(icerik.encode("utf-8")) > YAYIN_EN_BUYUK:
            raise Hata(413, "Takvim çok büyük.")
        adet = adet if isinstance(adet, int) and not isinstance(adet, bool) and adet >= 0 else None
        with self._islem() as c:
            c.execute("INSERT INTO yayin(kullanici, ad, icerik, adet, zaman) VALUES(?,?,?,?,?) "
                      "ON CONFLICT(kullanici, ad) DO UPDATE SET icerik=excluded.icerik, adet=excluded.adet, "
                      "zaman=excluded.zaman", (kullanici["id"], ad, icerik, adet, self.saat()))

    def takvim(self, kullanici):
        with self._islem() as c:
            r = c.execute("SELECT jeton, olusturma, son FROM takvim WHERE kullanici=?", (kullanici["id"],)).fetchone()
            y = c.execute("SELECT ad, adet, zaman FROM yayin WHERE kullanici=? ORDER BY ad",
                          (kullanici["id"],)).fetchall()
        return {"acik": r is not None, "yol": "/api/hesap/takvim/%s.ics" % r["jeton"] if r else None,
                "olusturma": int(r["olusturma"] * 1000) if r else None,
                "son": int(r["son"] * 1000) if r and r["son"] else None,
                "yayinlar": [{"ad": x["ad"], "adet": x["adet"], "zaman": int(x["zaman"] * 1000)} for x in y]}

    def takvim_ac(self, kullanici, yenile=False, jeton=None, ip=""):
        """Abonelik adresini acar; yenile: eskisi hemen gecersiz olur."""
        with self._islem() as c:
            var = c.execute("SELECT 1 FROM takvim WHERE kullanici=?", (kullanici["id"],)).fetchone() is not None
            if not var or yenile:
                c.execute("INSERT INTO takvim(kullanici, jeton, olusturma) VALUES(?,?,?) ON CONFLICT(kullanici) "
                          "DO UPDATE SET jeton=excluded.jeton, olusturma=excluded.olusturma, son=NULL",
                          (kullanici["id"], secrets.token_urlsafe(24), self.saat()))
                self._olay(c, kullanici["id"], "takvim", self._oturum_cihaz(c, jeton), ip,
                           "yenilendi" if var else "açıldı")
        return self.takvim(kullanici)

    def takvim_kapat(self, kullanici, jeton=None, ip=""):
        with self._islem() as c:
            if c.execute("DELETE FROM takvim WHERE kullanici=?", (kullanici["id"],)).rowcount:
                self._olay(c, kullanici["id"], "takvim-kapat", self._oturum_cihaz(c, jeton), ip)

    def takvim_ics(self, t):
        """Abonelik adresi: modullerin yayinladigi etkinlikler tek takvimde.
        Bilinmeyen adres None (404)."""
        with self._islem() as c:
            r = c.execute("SELECT kullanici FROM takvim WHERE jeton=?", (t,)).fetchone()
            if r is None:
                return None
            c.execute("UPDATE takvim SET son=? WHERE kullanici=?", (self.saat(), r["kullanici"]))
            return ics_birlestir([x["icerik"] for x in c.execute(
                "SELECT icerik FROM yayin WHERE kullanici=? ORDER BY ad", (r["kullanici"],))])

    def baglanti_ozet(self, kullanici):
        """Hesap sayfasinin «Baglantilar» satiri icin sayilar."""
        kid = kullanici["id"]
        with self._islem() as c:
            return {"anahtar": c.execute("SELECT COUNT(*) FROM anahtar WHERE kullanici=?", (kid,)).fetchone()[0],
                    "takvim": c.execute("SELECT 1 FROM takvim WHERE kullanici=?", (kid,)).fetchone() is not None,
                    "gelen_bekleyen": c.execute("SELECT COUNT(*) FROM gelen WHERE kullanici=? AND durum IN "
                                                "('bekliyor', 'alindi')", (kid,)).fetchone()[0]}

    # ------------------------------------------------ deponun yedegi (soz 20)

    def _ayar_yaz(self, c, ad, deger):
        if deger is None:
            c.execute("DELETE FROM ayar WHERE ad=?", (ad,))
        else:
            c.execute("INSERT INTO ayar(ad, deger) VALUES(?, ?) ON CONFLICT(ad) DO UPDATE SET deger=excluded.deger",
                      (ad, deger))

    def _donem(self, c):
        """Deponun donemi: geri yuklemede degisir; cihaz bunu gorunce kendi
        kayitlarini yeniden yollar ve bastan indirir (hesap.js soz 23)."""
        d = self._ayar(c, "donem", None)
        if d is None:
            d = secrets.token_hex(8)
            self._ayar_yaz(c, "donem", d)
        return d

    def kopya_klasoru(self):
        return os.path.join(os.path.dirname(os.path.abspath(self.yol)), "yedek")

    @staticmethod
    def _kopya_bak(yol):
        """Dosya saglam bir hesap deposu mu? SQLite'in kendi denetimi ve
        hesap tablolari; salt okunur acilir. Doner: kac kullanici, kac kayit."""
        try:
            c = sqlite3.connect(pathlib.Path(os.path.abspath(yol)).as_uri() + "?mode=ro", uri=True, timeout=30)
        except (sqlite3.Error, ValueError):
            raise Hata(422, "Yedek dosyası açılamadı.")
        try:
            if c.execute("PRAGMA quick_check").fetchone()[0] != "ok":
                raise Hata(422, "Yedek dosyası bozuk.")
            tablolar = {r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            if not set(KOPYA_TABLOLAR) <= tablolar:
                raise Hata(422, "Bu dosya bir LifeOS hesap yedeği değil.")
            return {"kullanici": c.execute("SELECT COUNT(*) FROM kullanici").fetchone()[0],
                    "kayit": c.execute("SELECT COUNT(*) FROM kayit WHERE deger IS NOT NULL").fetchone()[0]}
        except sqlite3.Error:
            raise Hata(422, "Yedek dosyası okunamadı (bozuk ya da hesap yedeği değil).")
        finally:
            c.close()

    def _kopya_yaz(self, hedef):
        """SQLite'in kendi yedekleme yolu: sunucu calisirken de tutarli bir an.
        Once yarim adla yazilir ve denetlenir; yarim dosya hicbir zaman
        yedek gibi gorunmez."""
        yarim = hedef + ".yarim"
        with contextlib.suppress(OSError):
            os.remove(yarim)
        kaynak = sqlite3.connect(self.yol, timeout=30)
        try:
            h = sqlite3.connect(yarim)
            try:
                kaynak.backup(h)
                h.execute("PRAGMA journal_mode=DELETE")     # tek dosya: yaninda -wal/-shm kalmaz
            finally:
                h.close()
        finally:
            kaynak.close()
        try:
            bilgi = self._kopya_bak(yarim)
        except Hata:
            with contextlib.suppress(OSError):
                os.remove(yarim)
            raise
        os.replace(yarim, hedef)
        return bilgi

    def kopyalar(self):
        """Yedek klasorundeki yedekler, en yenisi once."""
        k = self.kopya_klasoru()
        try:
            adlar = os.listdir(k)
        except OSError:
            return []
        l = []
        for ad in adlar:
            m = KOPYA_RE.match(ad)
            if not m:
                continue
            try:
                bayt = os.path.getsize(os.path.join(k, ad))
                zaman = time.mktime(time.strptime(m.group(2) + m.group(3), "%Y%m%d%H%M%S"))
            except (OSError, ValueError, OverflowError):
                continue
            l.append({"ad": ad, "tur": m.group(1), "zaman": int(zaman * 1000), "bayt": bayt})
        l.sort(key=lambda x: (x["zaman"], x["ad"]), reverse=True)
        return l

    def _kopya_buda(self):
        say = {}
        for x in self.kopyalar():
            say[x["tur"]] = say.get(x["tur"], 0) + 1
            if say[x["tur"]] > KOPYA_SAKLA[x["tur"]]:
                with contextlib.suppress(OSError):
                    os.remove(os.path.join(self.kopya_klasoru(), x["ad"]))

    def _ikinci(self):
        """Ikinci yerin ayari ve son durumu: {"yol", "son" (ms), "hata"}."""
        with self._islem() as c:
            yol = self._ayar(c, "kopya_ikinci", "")
            try:
                d = json.loads(self._ayar(c, "kopya_ikinci_durum", "{}"))
            except ValueError:
                d = {}
        return {"yol": yol, "son": d.get("son") if yol else None, "hata": (d.get("hata") or "") if yol else ""}

    def _ikinci_yaz(self, kaynak):
        """Yedegin ikinci yerdeki esi (baska disk, USB). Ulasilamazsa bu
        yazilir; yedek yine sayilir, asil kopya yerindedir."""
        ik = self._ikinci()
        if not ik["yol"]:
            return None
        son, hata = ik["son"], ""
        try:
            if not os.path.isdir(ik["yol"]):
                raise OSError("yok")
            ad = "lifeos-hesap-%s.db" % time.strftime("%Y%m%d-%H%M%S", time.localtime(self.saat()))
            hedef = os.path.join(ik["yol"], ad)
            shutil.copyfile(kaynak, hedef + ".yarim")
            os.replace(hedef + ".yarim", hedef)
            son = int(self.saat() * 1000)
            eskiler = sorted(a for a in os.listdir(ik["yol"]) if IKINCI_RE.match(a))
            for a in eskiler[:-IKINCI_SAKLA]:            # yalniz kendi adimizdaki dosyalar
                with contextlib.suppress(OSError):
                    os.remove(os.path.join(ik["yol"], a))
        except OSError:
            hata = "İkinci yere yazılamadı: klasör yok, disk takılı değil ya da yazma izni yok."
        with self._islem() as c:
            self._ayar_yaz(c, "kopya_ikinci_durum", json.dumps({"son": son, "hata": hata}))
        return not hata

    def kopya_al(self, tur="elle"):
        """Simdi bir yedek. Doner: {ad, tur, zaman, bayt, kullanici, kayit, ikinci}."""
        if tur not in KOPYA_SAKLA:
            raise Hata(400, "Geçersiz yedek türü.")
        with self._kopya_kilit:
            k = self.kopya_klasoru()
            os.makedirs(k, exist_ok=True)
            zaman = self.saat()
            ad = "hesap-%s-%s.db" % (tur, time.strftime("%Y%m%d-%H%M%S", time.localtime(zaman)))
            hedef = os.path.join(k, ad)
            try:
                bilgi = self._kopya_yaz(hedef)
            except (sqlite3.Error, OSError, Hata) as e:
                self._kopya_hata = "Son yedek alınamadı: %s" % (e.mesaj if isinstance(e, Hata) else e)
                raise
            self._kopya_hata = ""
            ikinci = self._ikinci_yaz(hedef) if tur != "once" else None
            self._kopya_buda()
            return dict(bilgi, ad=ad, tur=tur, zaman=int(zaman * 1000), bayt=os.path.getsize(hedef), ikinci=ikinci)

    def kopya_gunluk(self):
        """Bugunun yedegi yoksa alir. Hic hesap yoksa yedeklenecek bir sey yok."""
        bugun = time.strftime("%Y%m%d", time.localtime(self.saat()))
        if any(KOPYA_RE.match(x["ad"]).group(2) == bugun for x in self.kopyalar() if x["tur"] == "gunluk"):
            return None
        if self.kurulum_gerekli():
            return None
        return self.kopya_al("gunluk")

    def kopya_tetikle(self):
        """Istek yolunda cagrilir; en cok KOPYA_BAKIS_SN'de bir bakar, yedegi
        ARKADA alir: istek beklemez, yedek alinamazsa sunucu durmaz (hata
        yazilir, sonraki bakista yeniden denenir)."""
        if not self.otomatik_kopya:
            return False
        simdi = time.monotonic()
        with self.kilit:
            if simdi - self._kopya_bakis < KOPYA_BAKIS_SN:
                return False
            self._kopya_bakis = simdi

        def is_():
            with contextlib.suppress(Exception):
                self.kopya_gunluk()
        threading.Thread(target=is_, daemon=True, name="hesap-yedek").start()
        return True

    @staticmethod
    def _admin(yapan, mesaj="Bunu yalnız admin yapar."):
        if not yapan or yapan.get("rol") != "admin":
            raise Hata(403, mesaj)

    def kopya_ozet(self, kullanici):
        """Hesap sayfasi icin: son yedegin zamani (herkes); admin icin ikinci
        yer ve son hata da."""
        l = self.kopyalar()
        o = {"son": l[0]["zaman"] if l else None, "adet": len(l)}
        if kullanici and kullanici.get("rol") == "admin":
            ik = self._ikinci()
            o.update(ikinci=bool(ik["yol"]), ikinci_hata=ik["hata"], hata=self._kopya_hata)
        return o

    def kopya_durum(self, yapan, yerel):
        """Yedekler sayfasi (admin). Klasor yollari yalniz bilgisayarin
        kendisine gosterilir."""
        self._admin(yapan)
        ik = self._ikinci()
        asil = self.kopya_klasoru()
        ayni = bool(ik["yol"]) and (os.path.splitdrive(os.path.abspath(ik["yol"]))[0].lower()
                                    == os.path.splitdrive(asil)[0].lower()) and os.name == "nt"
        return {"yedekler": self.kopyalar(), "yerel": bool(yerel), "klasor": asil if yerel else "",
                "ikinci": {"acik": bool(ik["yol"]), "yol": ik["yol"] if yerel else "", "son": ik["son"],
                           "hata": ik["hata"], "ayni_disk": ayni},
                "hata": self._kopya_hata, "saklama": dict(KOPYA_SAKLA)}

    def kopya_ayarla(self, yapan, yerel, yol):
        """Ikinci yer: baska bir disk ya da USB'deki klasor. Bos: kapali."""
        self._admin(yapan)
        if not yerel:
            raise Hata(403, "Yedeğin ikinci yeri yalnız bu bilgisayardan ayarlanır.")
        yol = str(yol or "").strip().strip('"')
        if yol:
            if len(yol) > IKINCI_YOL_EN_UZUN or any(ord(ch) < 32 for ch in yol):
                raise Hata(400, "Klasör yolu geçersiz.")
            if not os.path.isabs(yol):
                raise Hata(400, "Tam bir klasör yolu yaz (örnek: E:\\LifeOS-yedek).")
            if not os.path.isdir(yol):
                raise Hata(400, "Bu klasör yok ya da disk şu an takılı değil.")
            yol = os.path.abspath(yol)
            if os.path.normcase(yol) == os.path.normcase(self.kopya_klasoru()):
                raise Hata(400, "Bu zaten asıl yedek klasörü; başka bir disk seç.")
            deneme = os.path.join(yol, ".lifeos-yazma-%s" % secrets.token_hex(4))
            try:
                with open(deneme, "wb") as f:
                    f.write(b"lifeos")
                os.remove(deneme)
            except OSError:
                raise Hata(400, "Bu klasöre yazılamıyor.")
        with self._islem() as c:
            self._ayar_yaz(c, "kopya_ikinci", yol or None)
            self._ayar_yaz(c, "kopya_ikinci_durum", None)
        if yol:
            # Hemen bir es: ayar dogru mu, simdi gorulsun.
            l = self.kopyalar()
            if l:
                self._ikinci_yaz(os.path.join(self.kopya_klasoru(), l[0]["ad"]))
            else:
                self.kopya_al("elle")
        return self.kopya_durum(yapan, yerel)

    def _kopya_yolu(self, ad):
        if not isinstance(ad, str) or not KOPYA_RE.match(ad):
            raise Hata(400, "Geçersiz yedek adı.")
        yol = os.path.join(self.kopya_klasoru(), ad)
        if not os.path.isfile(yol):
            raise Hata(404, "Bu yedek yok (silinmiş ya da süresi dolmuş olabilir).")
        return yol

    def kopya_onizle(self, yapan, ad):
        """Geri yukleme onizlemesi: yedekte ve simdi kac kullanici, kac kayit."""
        self._admin(yapan)
        yol = self._kopya_yolu(ad)
        b = self._kopya_bak(yol)
        with self._islem() as c:
            simdi = {"kullanici": c.execute("SELECT COUNT(*) FROM kullanici").fetchone()[0],
                     "kayit": c.execute("SELECT COUNT(*) FROM kayit WHERE deger IS NOT NULL").fetchone()[0]}
        x = next(x for x in self.kopyalar() if x["ad"] == ad)
        return dict(x, yedek=b, simdi=simdi)

    def geri_yukle(self, yapan, yerel, parola, ad, jeton=None, ip=""):
        """BUYUK AKSIYON (AGENTS §1.9): admin, bilgisayarin kendisinden,
        sifreyle; once simdiki halin yedegi alinir (geri donus noktasi)."""
        self._admin(yapan, "Geri yüklemeyi yalnız admin yapar.")
        if not yerel:
            raise Hata(403, "Geri yükleme yalnız bu bilgisayardan yapılır.")
        with self._islem() as c:
            self._parola_bak(c, yapan["id"], parola)
            cihaz_ad = self._oturum_cihaz(c, jeton)
        return self._geri_yukle(self._kopya_yolu(ad), yapan.get("ad", ""), cihaz_ad, ip)

    def _geri_yukle(self, yol, yapan_ad="", cihaz_ad="", ip=""):
        """Yedegi canli depoya yazar (SQLite yedekleme yolu, ters yonde).

        Guvenlik geri gitmez: butun oturumlar kapanir (herkes yeniden
        girer), simdi silinmis erisim anahtari ve takvim adresi geri gelmez.
        Sira sayaci ve otomatik kimlikler geri gitmez (eski numara yeni bir
        seye verilmez). Donem degisir: cihazlar kendi kayitlarini yeniden
        yollar, son yazan kazanir; yedekten sonraki degisiklikler cihazlardan
        geri akar."""
        bilgi = self._kopya_bak(yol)
        with self._kopya_kilit, self.kilit:
            once = self.kopya_al("once")
            with self._islem() as c:
                tasi = {
                    "anahtar": {r[0] for r in c.execute("SELECT ozet FROM anahtar")},
                    "takvim": {r[0] for r in c.execute("SELECT jeton FROM takvim")},
                    "sira": self._sira(c),
                    "sekans": {r[0]: r[1] for r in c.execute("SELECT name, seq FROM sqlite_sequence")},
                    "ayar": {a: self._ayar(c, a, None) for a in ("kopya_ikinci", "kopya_ikinci_durum")},
                }
            kaynak = sqlite3.connect(pathlib.Path(os.path.abspath(yol)).as_uri() + "?mode=ro", uri=True, timeout=30)
            try:
                hedef = sqlite3.connect(self.yol, timeout=30)
                try:
                    kaynak.backup(hedef)
                finally:
                    hedef.close()
            finally:
                kaynak.close()
            with self._islem() as c:
                c.executescript(SEMA)
                self._gocur(c)
                for t in ("oturum", "bilet", "bag_kodu"):
                    c.execute("DELETE FROM %s" % t)
                for r in c.execute("SELECT id, ozet FROM anahtar").fetchall():
                    if r["ozet"] not in tasi["anahtar"]:
                        c.execute("DELETE FROM anahtar WHERE id=?", (r["id"],))
                for r in c.execute("SELECT kullanici, jeton FROM takvim").fetchall():
                    if r["jeton"] not in tasi["takvim"]:
                        c.execute("DELETE FROM takvim WHERE kullanici=?", (r["kullanici"],))
                for ad, seq in tasi["sekans"].items():
                    if c.execute("UPDATE sqlite_sequence SET seq=MAX(seq, ?) WHERE name=?", (seq, ad)).rowcount == 0:
                        c.execute("INSERT INTO sqlite_sequence(name, seq) VALUES(?, ?)", (ad, seq))
                c.execute("INSERT INTO sayac(ad, deger) VALUES('sira', ?) ON CONFLICT(ad) DO UPDATE "
                          "SET deger=MAX(deger, excluded.deger)", (tasi["sira"],))
                for a, v in tasi["ayar"].items():
                    self._ayar_yaz(c, a, v)
                self._ayar_yaz(c, "donem", secrets.token_hex(8))
                m = re.search(r"(\d{8})-(\d{6})\.db$", os.path.basename(yol))
                try:
                    tarih = time.strftime("%d.%m.%Y %H:%M", time.strptime(m.group(1) + m.group(2), "%Y%m%d%H%M%S"))
                except (AttributeError, ValueError):
                    tarih = os.path.basename(yol)[:40]
                for r in c.execute("SELECT id FROM kullanici WHERE rol='admin'").fetchall():
                    self._olay(c, r["id"], "geri-yukle", cihaz_ad, ip,
                               ("%s yedeği · %s" % (tarih, yapan_ad)) if yapan_ad else "%s yedeği" % tarih)
            self._deneme.clear()
        return {"ok": True, "yedek": bilgi, "once": once["ad"]}


def ics_birlestir(icerikler):
    """Yayinlarin VEVENT bloklari tek VCALENDAR'da. Satirlar ANLASILMAZ,
    oldugu gibi tasinir (katlanmis satir da bozulmaz)."""
    olaylar = []
    for metin in icerikler:
        ic = None
        for s in str(metin or "").replace("\r\n", "\n").split("\n"):
            if s == "BEGIN:VEVENT":
                ic = [s]
            elif ic is not None:
                ic.append(s)
                if s == "END:VEVENT":
                    olaylar.append("\r\n".join(ic))
                    ic = None
    bas = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//LifeOS//Hesap//TR", "CALSCALE:GREGORIAN",
           "METHOD:PUBLISH", "X-WR-CALNAME:LifeOS", "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
           "X-PUBLISHED-TTL:PT1H"]
    return "\r\n".join(bas + olaylar + ["END:VCALENDAR"]) + "\r\n"


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


def _ics_cevap(h, metin):
    govde = metin.encode("utf-8")
    h.send_response(200)
    # Telefon uygulamasi «Dosyayi indir»i baska kokenden ister (_cevap gibi).
    koken = h.headers.get("Origin")
    if koken and UYGULAMA_KOKENLERI.match(koken):
        h.send_header("Access-Control-Allow-Origin", koken)
        h.send_header("Vary", "Origin")
    h.send_header("Content-Type", "text/calendar; charset=utf-8")
    h.send_header("Content-Disposition", 'inline; filename="lifeos.ics"')
    h.send_header("Content-Length", str(len(govde)))
    h.end_headers()
    h.wfile.write(govde)


def gunluk_maskele(satir):
    """Sunucu gunlugune yazilacak istek satiri: takvim adresinin gizli
    kismi atilir (soz 17; o adres bir anahtardir)."""
    return re.sub(r"(/api/hesap/takvim/)[^\s?]+", r"\1…", str(satir))


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
        d.kopya_tetikle()                       # soz 20: gunluk yedek, arkada
        if yontem == "GET" and yol == "/api/hesap/durum":
            return _cevap(h, 200, {"surum": SURUM, "kurulum": d.kurulum_gerekli(), "kayit": d.kayit_acik(),
                                   "yerel": _yerel_mi(h), "ev_agi": ev_agi()})
        if yontem == "GET":
            m = TAKVIM_YOL_RE.match(yol)
            if m:
                # Soz 17: takvim uygulamasi baslik gonderemez; anahtar adresin kendisi.
                ics = d.takvim_ics(m.group(1))
                if ics is None:
                    raise Hata(404, "Bu takvim adresi kapalı ya da yenilendi.")
                return _ics_cevap(h, ics)
        ip = (h.client_address or ("",))[0]
        if yontem == "GET" and yol == "/api/hesap/gelen":
            # Kisayolun «dene» adimi: anahtar gecerli mi (satir birakmaz).
            return _cevap(h, 200, d.anahtar_dene(_jeton(h), ip))
        if yontem == "POST" and yol == "/api/hesap/gelen":
            # Soz 16: Kisayollar, Home Assistant... Kimlik erisim anahtaridir
            # (cerez ya da oturum degil): tarayicidaki bir site onu bilemez.
            try:
                v = _govde(h)
            except Hata as e:
                if e.kod != 400:
                    raise
                raise Hata(400, "Gövde JSON olmalı: {\"metin\": \"su 250\"}")
            return _cevap(h, 200, d.gelen_ekle(_jeton(h), v.get("metin"), v.get("modul") or "spi", ip))
        if yontem == "POST":
            # Ozel baslik + JSON: baska bir site tarayicidan «basit istek»
            # gonderemez (on-kontrol ister, on-kontrol yalniz uygulamaya acik).
            if h.headers.get("X-LifeOS") != "hesap":
                raise Hata(403, "İzin yok.")
            v = _govde(h)
            cihaz = str(v.get("cihaz") or "")[:64]
            cihaz_ad = str(v.get("cihaz_ad") or "")[:80]
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
            if yol == "/api/hesap/giris-kod":
                return _cevap(h, 200, d.giris_kod(v.get("bilet"), v.get("kod"), ip))
            if yol == "/api/hesap/bagla":
                return _cevap(h, 200, d.bagla(v.get("kod"), cihaz, cihaz_ad, ip))
            k = d.oturum(_jeton(h), ip)
            if k is None:
                raise Hata(401, "Oturum yok ya da süresi doldu; yeniden giriş yap.")
            if yol == "/api/hesap/esitle":
                son = v.get("son", 0)
                return _cevap(h, 200, d.esitle(k, v.get("alan"), cihaz, son if isinstance(son, int) else -1,
                                               v.get("gonder") or [], v.get("sinir") or SINIR, _jeton(h),
                                               v.get("yalniz_gonder") is True))
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
                return _cevap(h, 200, {"kullanici": d.yonet(k, v.get("id"), v.get("rol"), v.get("plan"),
                                                            v.get("iki_adim"))})
            if yol == "/api/hesap/ayar":
                return _cevap(h, 200, {"kayit": d.kayit_ayarla(k, v.get("kayit"))})
            j = _jeton(h)
            if yol == "/api/hesap/iki-adim/baslat":
                return _cevap(h, 200, d.iki_adim_baslat(k, v.get("parola")))
            if yol == "/api/hesap/iki-adim/onayla":
                return _cevap(h, 200, d.iki_adim_onayla(k, v.get("kod"), j, ip))
            if yol == "/api/hesap/iki-adim/kapat":
                d.iki_adim_kapat(k, v.get("parola"), v.get("kod"), j, ip)
                return _cevap(h, 200, {"ok": True})
            if yol == "/api/hesap/iki-adim/yedek":
                return _cevap(h, 200, d.yedek_yenile(k, v.get("parola"), j, ip))
            if yol == "/api/hesap/bag-kodu":
                return _cevap(h, 200, d.bag_kodu_ac(k))
            if yol == "/api/hesap/bag-durum":
                return _cevap(h, 200, d.bag_durum(k, v.get("id")))
            if yol == "/api/hesap/bag-kapat":
                d.bag_kodu_kapat(k, v.get("id"))
                return _cevap(h, 200, {"ok": True})
            if yol == "/api/hesap/anahtar":
                return _cevap(h, 200, d.anahtar_ac(k, v.get("parola"), v.get("ad"), v.get("yetki") or "kayit", j, ip))
            if yol == "/api/hesap/anahtar-sil":
                d.anahtar_sil(k, v.get("id"), j, ip)
                return _cevap(h, 200, {"ok": True})
            if yol == "/api/hesap/gelen-al":
                return _cevap(h, 200, {"gelen": d.gelen_al(k, v.get("modul"), cihaz)})
            if yol == "/api/hesap/gelen-sonuc":
                return _cevap(h, 200, {"ok": d.gelen_sonuc(k, v.get("id"), v.get("durum"), v.get("sonuc"), cihaz)})
            if yol == "/api/hesap/yayin":
                d.yayinla(k, v.get("ad"), v.get("icerik"), v.get("adet"))
                return _cevap(h, 200, {"ok": True})
            if yol == "/api/hesap/takvim":
                return _cevap(h, 200, {"takvim": d.takvim_ac(k, v.get("yenile") is True, j, ip)})
            if yol == "/api/hesap/cihaz-ad":
                return _cevap(h, 200, {"ad": d.cihaz_adlandir(k, v.get("id"), v.get("ad")),
                                       "cihazlar": d.cihazlar(k, j)})
            if yol == "/api/hesap/takvim-kapat":
                d.takvim_kapat(k, j, ip)
                return _cevap(h, 200, {"takvim": d.takvim(k)})
            if yol == "/api/hesap/yedekle":
                d._admin(k, "Yedeği yalnız admin alır.")
                x = d.kopya_al("elle")
                return _cevap(h, 200, dict(d.kopya_durum(k, _yerel_mi(h)), alinan=x["ad"]))
            if yol == "/api/hesap/yedek-ayar":
                return _cevap(h, 200, d.kopya_ayarla(k, _yerel_mi(h), v.get("ikinci")))
            if yol == "/api/hesap/yedek-onizle":
                return _cevap(h, 200, d.kopya_onizle(k, v.get("ad")))
            if yol == "/api/hesap/geri-yukle":
                return _cevap(h, 200, d.geri_yukle(k, _yerel_mi(h), v.get("parola"), v.get("ad"), j, ip))
            raise Hata(404, "Böyle bir istek yok.")
        if yontem == "GET":
            k = d.oturum(_jeton(h), ip)
            if k is None:
                raise Hata(401, "Oturum yok ya da süresi doldu; yeniden giriş yap.")
            if yol == "/api/hesap/ben":
                return _cevap(h, 200, {"kullanici": k, "ozet": d.ozet(k), "ayrinti": d.ayrinti(k),
                                       "soru_var": d.soru_var(k), "planlar": list(PLANLAR),
                                       "renkler": list(RENKLER), "kayit": d.kayit_acik(),
                                       "iki_adim": d.iki_adim(k), "baglantilar": d.baglanti_ozet(k),
                                       "yedek": d.kopya_ozet(k)})
            if yol == "/api/hesap/uyarilar":
                return _cevap(h, 200, {"uyarilar": d.uyarilar(k, _jeton(h))})
            if yol == "/api/hesap/baglantilar":
                return _cevap(h, 200, {"anahtarlar": d.anahtarlar(k), "gelen": d.gelen_liste(k),
                                       "takvim": d.takvim(k), "iki_adim": d.iki_adim(k)})
            if yol == "/api/hesap/etkinlik":
                return _cevap(h, 200, {"olaylar": d.etkinlik(k)})
            if yol == "/api/hesap/disa":
                return _cevap(h, 200, d.disa(k))
            if yol == "/api/hesap/cihazlar":
                return _cevap(h, 200, {"cihazlar": d.cihazlar(k, _jeton(h))})
            if yol == "/api/hesap/kullanicilar":
                return _cevap(h, 200, {"kullanicilar": d.kullanicilar(k), "kayit": d.kayit_acik()})
            if yol == "/api/hesap/yedekler":
                return _cevap(h, 200, d.kopya_durum(k, _yerel_mi(h)))
        raise Hata(404, "Böyle bir istek yok.")
    except Hata as e:
        return _cevap(h, e.kod, {"hata": e.mesaj})
    except (sqlite3.Error, OSError) as e:
        return _cevap(h, 503, {"hata": "Hesap deposu açılamadı: %s" % e})


def _boyut(n):
    return "%.1f MB" % (n / 1048576.0) if n >= 1048576 else "%d KB" % max(1, n // 1024)


def main(argv):
    """Bilgisayarin kendisinden kurtarma. Hesap deposu bu bilgisayarda
    oldugu icin bu kapi zaten bilgisayarin sahibinindir.
    --iki-adim-kapat: telefon da yedek kodlar da kaybolduysa (soz 14).
    --yedekle / --yedekler / --geri-yukle: sunucu acilamazsa ya da yeni bir
    bilgisayara ikinci yerdeki (USB) dosyadan donulecekse (soz 20)."""
    if len(argv) == 2 and argv[1] == "--yedekle":
        try:
            x = Depo().kopya_al("elle")
        except (Hata, sqlite3.Error, OSError) as e:
            print("Yedek alınamadı: %s" % (e.mesaj if isinstance(e, Hata) else e))
            return 1
        print("Yedek alındı: %s · %d kullanıcı · %d kayıt · %s" % (x["ad"], x["kullanici"], x["kayit"], _boyut(x["bayt"])))
        if x["ikinci"] is False:
            print("İkinci yere yazılamadı (disk takılı mı?).")
        return 0
    if len(argv) == 2 and argv[1] == "--yedekler":
        d = Depo()
        l = d.kopyalar()
        print("Klasör: %s" % d.kopya_klasoru())
        for x in l:
            print("  %s  %s" % (x["ad"], _boyut(x["bayt"])))
        if not l:
            print("  Henüz yedek yok.")
        return 0
    if len(argv) in (3, 4) and argv[1] == "--geri-yukle":
        d = Depo()
        yol = argv[2] if os.path.isfile(argv[2]) else os.path.join(d.kopya_klasoru(), argv[2])
        if not os.path.isfile(yol):
            print("Yedek bulunamadı: %s" % argv[2])
            return 1
        try:
            b = d._kopya_bak(yol)
        except Hata as e:
            print(e.mesaj)
            return 1
        if argv[3:] != ["--evet"]:
            print("Geri yüklenecek: %s · %d kullanıcı · %d kayıt" % (os.path.basename(yol), b["kullanici"], b["kayit"]))
            print("Önce şimdiki hâlin yedeği alınır; bütün cihazlar yeniden giriş yapar; yedekten sonra")
            print("cihazlarda yapılan değişiklikler eşitlemeyle geri gelir.")
            print("Onaylıyorsan aynı komutu sonuna --evet ekleyerek yeniden çalıştır.")
            return 2
        try:
            x = d._geri_yukle(yol, "bilgisayardan (komut satırı)")
        except (Hata, sqlite3.Error, OSError) as e:
            print("Geri yüklenemedi: %s" % (e.mesaj if isinstance(e, Hata) else e))
            return 1
        print("Geri yüklendi. Şimdiki hâlin yedeği: %s" % x["once"])
        return 0
    if len(argv) == 3 and argv[1] == "--iki-adim-kapat":
        try:
            var = Depo().iki_adim_sifirla(argv[2])
        except Hata as e:
            print(e.mesaj)
            return 1
        print("İki adımlı doğrulama kapatıldı: %s" % argv[2] if var
              else "Bu hesapta iki adımlı doğrulama zaten kapalı: %s" % argv[2])
        return 0
    print("Kullanım:")
    print("  python sistem/hesap.py --iki-adim-kapat <kullanıcı adı>")
    print("  python sistem/hesap.py --yedekle | --yedekler")
    print("  python sistem/hesap.py --geri-yukle <yedek adı ya da dosya yolu> [--evet]")
    return 2


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    sys.exit(main(sys.argv))
