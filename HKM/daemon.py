#!/usr/bin/env python3
"""HKM daemon — yalniz 127.0.0.1, yalniz bearer'li istek.

    python daemon.py            # http://127.0.0.1:4200

Ucnoktalar:
    POST /api/sync/<modul>          etiketli metrikleri yutar (202 / 422)
    GET  /api/briefing?date=        gunun brifingi: VP raporlari + TEK oneri
    GET  /api/twin?date=&days=      dijital ikiz: son N gunun tek resmi
    GET  /api/decisions?date=       gunun butun onerileri (reddedilenler dahil)
    GET  /api/impact                oneri sonrasi olculer ne yapti (etki)
    GET  /api/config                ayarlar — SIRLAR MASKELI
    GET  /api/budget                aylik harcama, tahmin ve sinir durumu
    POST /api/config                ayar yamasi (dogrulanir; jetona dokunmaz)
    POST /api/probe                 saglayici anahtarini SINAR (mesaj uretmez)
    POST /api/models                saglayicinin anahtara ACIK model listesi
    POST /api/telegram/yoklama      webhook'u siler ve bir yoklama turu dener
    GET  /api/backup                butun ambar tek JSON
    POST /api/prune                 eski ham olaylari siler (kararlar kalir)
    POST /api/restore               yedegi geri yukler (replace acik karar)
    GET  /api/streak?date=&days=    ust uste suren esik kiriklari
    GET  /api/weekly?date=          haftalik rapor
    GET  /api/outbox                giden kutusu durumu
    GET  /api/intents/<modul>       modulun acik niyetleri (teklifler)
    POST /api/intents/<modul>       yeni teklif olusturur (tur + govde)
    POST /api/intents/<modul>/take  kuyrugu alir (delivered isaretler)
    POST /api/intent/<id>/applied   modul uyguladi
    POST /api/intent/<id>/dismissed kullanici istemedi
    POST /api/intent/<id>/acknowledged goruldu; uygulamak kullanicinin isi
    POST /api/intent/<id>/unknown   uygulandigi belirsiz (yarida kaldi)
    GET  /api/profil?date=          dort alanin profili: kademe, rozet, onur
    GET  /api/cross?date=&days=     capraz bulgular: uc ambar yan yana
    GET  /api/series?date=&days=&module=  metrik metrik zaman serisi
    POST /api/message               Buyuk Patron'a kisa komut (yerel kanal)
    POST /api/chat                  sohbet: once komut, sonra model
    POST /api/chat/tani             sohbet zincirini dener, nerede koptugunu soyler
    GET  /api/agents                gorevliler ve her birinin hazir olup olmadigi
    GET  /api/conversation          son konusma kayitlari
    GET  /api/attachments           gelen medya ve analiz kuyrugu
    POST /api/pair/open             esleme penceresini acar (bearer ister)
    GET  /api/pair/status           pencere acik mi (bearer ister)
    POST /api/pair                  jetonu YEREL cihaza verir — pencere acikken,
                                    tek kullanimlik, bearer ISTEMEZ
    POST /api/say                   gunun mesajini kanala gonderir (gunde bir)
    GET/POST /api/wa/webhook        WhatsApp — jetonsuz ama IMZALI (bkz. §7)
    POST /api/tg/webhook            Telegram — gizli baslikla dogrulanir
    POST /api/decision/<id>/accept  oneriyi kabul et
    POST /api/decision/<id>/decline oneriyi reddet — kayit silinmez
    GET  /api/health                token istemez
    GET  /                          tek dosyalik yerel yuz (token istemez;
                                    jetonu kullanici girer, veri yine korumali)

Dis dunyaya acilmaz: host varsayilani 127.0.0.1'dir ve config.json ile
degistirilmesi bilincli bir karardir.
"""

import datetime
import json
import os
import re
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core import (ai, butce, channels, cross, db, gelen,  # noqa: E402
                  impact,
                  intents, manager, media, memory, models, motto, outbox, patron,
                  profil, schedule,
                  settings, sohbet, streak, sync_engine, thresholds, twin,
                  weekly, yoklama)

ROOT = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(ROOT, "config.json")

# Esleme penceresi: jetonu elle yapistirmayi bitirir ama kapiyi acik
# birakmaz. Kisa, TEK KULLANIMLIK ve yalniz YEREL kokene.
PAIR_SECONDS = 120
PAIR_MIN_SECONDS = 15        # pencere bundan kisa da olamaz, uzun da

# --------------------------------------------------------------- sinirlar
#
# Yerel bir daemon da olsa, disari acilan bir yuzeyin sinirlari olmali:
# sinirsiz bir gövde, bir hatayla butun belleği yiyebilir; sinirsiz bir
# webhook, bir yanlis yapilandirmada daemon'u mesgul eder.
MAX_BODY = 1024 * 1024          # 1 MB — etiketli metrik govdesi icin fazlasiyla
# Geri yukleme AYRI bir sinirla calisir. Dokuz aylik ambarin kendi yedegi
# 4,5 MB olcuuldu: genel govde siniri altinda kalsaydi, uygulamanin kendi
# uretttigi yedek kendi geri yukleme yolundan gecemezdi. Genel sinir
# GEVSETILMEZ; yalniz bu yol icin ayri ve acik bir sinir tanimlanir.
RESTORE_BODY = 64 * 1024 * 1024
WEBHOOK_LIMIT = 60              # dakikada en fazla webhook istegi
WEBHOOK_WINDOW = 60


"""Tarayici, HKM'ye BASKA BIR KOKENDEN konusur.

Uc arayuz kendi devserver'inda (4173/4183/4193) kosar; HKM 4200'dedir.
Bu yuzden isaret istegi cifte kokenlidir ve tarayici once bir on-istek
(OPTIONS) yollar. On-istege cevap verilmezse gonderim hic denenmez ve
disaridan bakinca «HKM ulasilamiyor» gibi gorunur — oysa daemon ayaktadir.

Izin YALNIZ yerel kokenlere verilir: 127.0.0.1, localhost ve ::1. Bunun
disindaki bir kokene acmak, kullanicinin ziyaret ettigi herhangi bir web
sayfasinin yerel HKM'ye istek atabilmesi demektir. Jeton yine sarttir;
CORS bir kimlik dogrulama degil, bir tarayici sinirdir."""
LOCAL_ORIGIN = re.compile(
    r"^https?://(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$", re.I)


def cors_origin(headers, cfg):
    origin = headers.get("Origin", "")
    if not origin:
        return None
    if LOCAL_ORIGIN.match(origin):
        return origin
    if origin in (cfg or {}).get("allowed_origins", []):
        return origin
    return None


def load_config():
    cfg = {"host": "127.0.0.1", "port": 4200, "local_token": ""}
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            cfg.update(json.load(f))
    return cfg


def briefing(con, date, th=None, days=twin.WINDOW_DAYS):
    """Brifing artik Yoneticiden gecer.

    Onceki hali onceligi ham VP raporlarindan hesapliyor ama gunun
    govdesini precedence'a GECIRMIYORDU: «sabit takvim» sirasi (rank 2)
    boylece uretimde hic ateslenmiyordu — testte gecen bir yol, uretimde
    olu bir yoldu. manager.brief() govdeleri de tasir."""
    return manager.brief(con, date, th=th, days=days)


# Seviye medyasinin muhafizi. Uc devserver ve sunucu.py ile AYNI blok;
# tek kaynaktan (`brand/seviye/ortak_yol.py`) yayilir. Merkez profili
# ayni rozet gorsellerini gosterdigi icin burada da gerekli — ikinci
# bir kopya yazmak, iki kopyanin bir gun ayrismasi demekti.
# SEVIYE:yol-bas
# ===== BU BLOK URETILMISTIR — BURAYI DUZENLEME =====
# Kaynak: brand/seviye/ortak_yol.py
# Yayan:  python3 tools/seviye.py --yay   (denetim: --denetle)
#
# Ayni muhafiz dort sunucuda da duruyordu ve dordunu elle guncellemek
# gerekiyordu: bu depoda tam olarak bunu onlemek icin --denetle yazildi,
# ama Python tarafi disarida kalmisti. Artik o da yayiliyor.
from urllib.parse import unquote as _unquote

# Servis edilen medya turleri. Listede olmayan uzanti hic acilmaz: bir
# gorsel kapisinin dosya sistemine acilan bir pencereye donusmesi, bu
# depoda kabul edilebilir bir bedel degil.
MEDYA_TURLERI = {
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".webp": "image/webp", ".svg": "image/svg+xml",
    ".mp4": "video/mp4", ".webm": "video/webm",
}


def _guvenli_medya_adi(ad, izinli=None):
    """URL parcasini DUZ bir dosya adina indirger; olmuyorsa None.

    Yuzde kodlamasi ONCE cozulur. Cozmeden birakmak iki sey yapardi:
    `kademe%201.png` gibi bosluklu bir ad hic bulunamaz (sessiz 404) ve
    muhafiz, cozulmus hali hic gormedigi icin yanlis yerde guven
    duyardi. Cozduktan sonra alt klasor, ".." ve gizli dosya reddedilir.
    """
    try:
        ad = _unquote(ad or "")
    except Exception:
        return None
    if not ad or "/" in ad or "\\" in ad or ad.startswith("."):
        return None
    uzanti = os.path.splitext(ad)[1].lower()
    if uzanti not in (izinli if izinli is not None else MEDYA_TURLERI):
        return None
    return ad


def _ortak_marka_yolu(clean, kok):
    """/img/marka/<ad> -> <kok>/brand/medya/<aile>/<ad>, yoksa None.

    AILE ADDAN TURER, yoldan degil: `kimlik-ays.webp` ->
    `brand/medya/kimlik/kimlik-ays.webp`. Boylece URL duz kalir ve
    muhafiz alt klasor gezmek zorunda kalmaz — bir gorsel kapisinin
    dosya sistemine acilan bir pencereye donusmesi, bu depoda kabul
    edilebilir bir bedel degil.

    Marka medyasi seviye medyasindan AYRI durur (bkz. brand/medya/OKU.md):
    seviye medyasi bir kataloga baglidir ve eksigi kod tarafindan
    bilinir; marka medyasi serbesttir ve eksik gorsel hata degildir."""
    onek = "/img/marka/"
    if not clean.startswith(onek):
        return None
    ad = _guvenli_medya_adi(clean[len(onek):])
    if not ad:
        return None
    aile = os.path.splitext(ad)[0].split("-", 1)[0]
    if not aile or not aile.isalnum():
        return None
    return os.path.join(kok, "brand", "medya", aile, ad)


def _ortak_seviye_yolu(clean, kok):
    """/img/seviye/<ad> -> <kok>/brand/seviye/medya/<ad>, yoksa None.

    Rutbe kartlari ve kademe sahneleri uc sistemin de AYNI dosyasidir;
    uc kez kopyalamak depoyu buyutmekten baska bir sey yapmazdi.
    Sistemlerin bagimsizligi bozulmaz: dosya yoksa perde karti kendisi
    cizer, arayuzde hicbir sey kirilmaz.

    MEDYA KENDI KLASORUNDE. Once gorseller `brand/seviye/` icinde,
    `xp.js` ve `perde.js` ile yan yana duruyordu; yirmi bir dosya
    eklenince o klasorde kodu bulmak zorlasti. Kaynak kod ve servis
    edilen medya ayni yerde durmaz — `medya/` yalniz servis edilen
    dosyalari tutar, `eski/` ise servis EDILMEYENLERI (bkz. OKU.md).
    """
    onek = "/img/seviye/"
    if not clean.startswith(onek):
        return None
    ad = _guvenli_medya_adi(clean[len(onek):])
    if not ad:
        return None
    return os.path.join(kok, "brand", "seviye", "medya", ad)
# ===== URETILMIS BLOK SONU =====
# SEVIYE:yol-bit


class Handler(BaseHTTPRequestHandler):
    server_version = "HKM/1.0"

    @property
    def con(self):
        """Her isleve kendi baglantisi.

        SQLite bir baglantiyi yaratildigi is parcacigi disinda kullandirmaz;
        ThreadingHTTPServer altinda tek paylasimli baglanti ilk es zamanli
        istekte patlar. Baglantiyi is parcacigina bagliyoruz."""
        local = self.server.local
        if not hasattr(local, "con"):
            local.con = db.connect(self.server.db_path)
        return local.con

    # --- yardimcilar -----------------------------------------------------
    def _send(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _cors(self):
        origin = cors_origin(self.headers, self.server.config)
        if not origin:
            return
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Vary", "Origin")

    def do_OPTIONS(self):
        """On-istek: yalniz yerel kokene, yalniz kullanilan basliklara."""
        origin = cors_origin(self.headers, self.server.config)
        if not origin:
            self.send_response(403)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Vary", "Origin")
        self.send_header("Content-Length", "0")
        self.end_headers()

    # --------------------------------------------------------- sinirlar

    def _read_body(self):
        """Govdeyi SINIRLI okur. (bytes, hata) doner.

        Content-Length'e guvenmek yetmez: sinirdan buyuk bir govde HIC
        okunmaz — okunup sonra reddedilen bir govde, zaten bellege
        alinmistir."""
        try:
            n = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            return b"", "gecersiz Content-Length"
        # ALT SINIR da denetlenir: negatif bir uzunlukla rfile.read(-1)
        # cagirmak, EOF'a kadar okumak demektir — yani sinirin hic
        # uygulanmamasi. Yalniz ust siniri denetleyen bir okuma, sinirsiz
        # bir okumadir.
        if n < 0:
            return b"", "gecersiz Content-Length (negatif)"
        sinir = getattr(self, "_body_limit", MAX_BODY)
        if n > sinir:
            return b"", "govde cok buyuk (en fazla %d bayt)" % sinir
        return (self.rfile.read(n) if n else b""), None

    def _rate_ok(self, anahtar, limit=WEBHOOK_LIMIT, pencere=WEBHOOK_WINDOW):
        """Kaba bir hiz siniri — jetonsuz yollar icin.

        Bir yanlis yapilandirma ya da tekrar tekrar yollanan bir webhook,
        daemon'u mesgul etmemeli. Sinir KABADIR ve oyle olmali: ince bir
        sayac, korumadigi bir seyi korur gibi gorunur."""
        srv = self.server
        if not hasattr(srv, "rate"):
            srv.rate = {}
            srv.rate_lock = threading.Lock()
        simdi = time.time()
        with srv.rate_lock:
            kayit = [t for t in srv.rate.get(anahtar, []) if simdi - t < pencere]
            if len(kayit) >= limit:
                srv.rate[anahtar] = kayit
                return False
            kayit.append(simdi)
            srv.rate[anahtar] = kayit
            return True

    def _authorized(self):
        head = self.headers.get("Authorization", "")
        given = head[7:] if head.startswith("Bearer ") else ""
        return sync_engine.check_token(given, self.server.config.get("local_token"))

    def log_message(self, fmt, *args):
        sys.stderr.write("[hkm] " + (fmt % args) + "\n")

    # --- yollar ----------------------------------------------------------
    def _wa_webhook(self):
        cfg = self.server.config
        a = channels.settings(cfg, "whatsapp")
        if not channels.enabled(cfg, "whatsapp"):
            return self._send(404, {"error": "kanal kapali"})
        if not self._rate_ok("wa"):
            return self._send(429, {"error": "cok fazla istek"})
        ham, hata = self._read_body()
        if hata:
            return self._send(413, {"error": hata})
        imza = self.headers.get("X-Hub-Signature-256", "")
        if not channels.verify_signature(a.get("app_secret"), ham, imza):
            return self._send(401, {"error": "imza dogrulanmadi"})
        try:
            govde = json.loads(ham or b"{}")
        except ValueError:
            return self._send(400, {"error": "gecersiz JSON"})

        cevaplar = []
        for m in channels.parse_whatsapp(govde):
            cevaplar.append(self._gelen_mesaj("whatsapp", m, cfg))
        return self._send(200, {"handled": len(cevaplar), "results": cevaplar})

    def _tg_webhook(self):
        """Telegram imza yollamaz; kurulumda verilen gizli basligi geri
        gonderir. Sir tanimsizsa webhook KAPALIDIR."""
        cfg = self.server.config
        if not channels.enabled(cfg, "telegram"):
            return self._send(404, {"error": "kanal kapali"})
        if not channels.verify_telegram_secret(
                cfg, self.headers.get("X-Telegram-Bot-Api-Secret-Token")):
            return self._send(401, {"error": "gizli baslik dogrulanmadi"})
        if not self._rate_ok("tg"):
            return self._send(429, {"error": "cok fazla istek"})
        ham, hata = self._read_body()
        if hata:
            return self._send(413, {"error": hata})
        try:
            govde = json.loads(ham or b"{}")
        except ValueError:
            return self._send(400, {"error": "gecersiz JSON"})
        cevaplar = []
        for m in channels.parse_telegram(govde):
            cevaplar.append(self._gelen_mesaj("telegram", m, cfg))
        return self._send(200, {"handled": len(cevaplar), "results": cevaplar})

    def _gelen_mesaj(self, kanal, m, cfg):
        """Gelen mesajin islenmesi core/gelen.py'de — webhook ve yoklama
        AYNI yoldan gecer. Kopyalanan bir mantik, bir gun yalniz bir
        kapida duzeltilir ve otekinde bozuk kalir."""
        return gelen.isle(self.con, cfg, kanal, m, th=self.server.thresholds)

    def _say(self, body):
        """Gunun mesajini kanala gonderir. GUNDE TEK MESAJ: ayni gun ayni
        kanala ikinci kez gonderilmez (force ile bilincli olarak asilir)."""
        cfg = self.server.config
        kanal = body.get("channel") or "whatsapp"
        tarih = body.get("date") or datetime.date.today().isoformat()
        if not channels.enabled(cfg, kanal):
            return {"ok": False, "reason": "off", "note": "Kanal kapalı."}
        if not body.get("force") and patron.already_sent(self.con, tarih, kanal):
            return {"ok": False, "reason": "already-sent",
                    "note": "Bugünün mesajı bu kanala zaten gönderildi."}
        m = patron.daily_message(self.con, tarih, th=self.server.thresholds)
        if not m["ok"]:
            return {"ok": False, "reason": "imperative", "note": m["error"]}
        # Gunun mesaji da GIDEN KUTUSUNDAN gecer: dogrudan gonderim, ag
        # koptugunda tekrar denenmeyen ve hicbir yere yazilmayan bir
        # mesajdi. Kimlik (kanal, «daily», gun) zaten gunde tek mesaj
        # demektir; ikinci cagri var olan satiri bulur.
        satir = outbox.enqueue(self.con, kanal, "daily", tarih, m["text"],
                               target=body.get("to"))
        ozet = outbox.flush(self.con, cfg, limit=5)
        gonderildi = ozet.get("sent", 0) > 0
        if gonderildi:
            patron.log(self.con, kanal, "manager", m["text"])
        return {"ok": gonderildi, "queued": True,
                "duplicate": satir.get("duplicate", False),
                "uncertain": ozet.get("uncertain", 0),
                "note": "Mesaj giden kutusuna yazıldı." if not gonderildi
                        else "Gönderildi.",
                "chars": len(m["text"])}

    # ------------------------------------------------------------ esleme
    #
    # Jetonu uc arayuze elle yapistirmak, HKM'nin hic acilmamasinin en
    # olasi sebebiydi. Cozum jetonu gevsetmek DEGIL, kisa bir pencere
    # acmak:
    #
    #   · pencereyi yalniz jetonu ZATEN bilen taraf acabilir (bearer),
    #   · pencere iki dakika yasar ve TEK KULLANIMLIKTIR,
    #   · jeton yalniz YEREL kokene verilir (127.0.0.1 / localhost / ::1),
    #   · jeton hicbir kayda, hicbir loga ve hicbir ekrana yazilmaz.
    #
    # Boylece «kapiyi ac» ile «kapiyi kir» arasindaki fark korunur.

    def _pair_state(self):
        srv = self.server
        if not hasattr(srv, "pair"):
            srv.pair = {"until": 0.0, "used": True}
            srv.pair_lock = threading.Lock()
        return srv.pair

    def _pair_open(self, seconds=None):
        """Pencereyi acar. Sure ISTENEBILIR ama uzatilamaz.

        Tek tikla baslatma (baslat.py) yuzun kendisi icin cok kisa bir
        pencere acar: pencere ne kadar acik kalirsa, o makinede acik duran
        baska bir sayfanin jetonu kapma ihtimali o kadar uzun surer. Kisa
        pencere istemek serbesttir; UZATMAK degil."""
        try:
            sure = int(seconds) if seconds is not None else PAIR_SECONDS
        except (TypeError, ValueError):
            sure = PAIR_SECONDS
        sure = max(PAIR_MIN_SECONDS, min(sure, PAIR_SECONDS))
        durum = self._pair_state()
        with self.server.pair_lock:
            durum["until"] = time.time() + sure
            durum["used"] = False
        return self._send(200, {"ok": True, "seconds": sure,
                                "note": "Eşleme penceresi açıldı. Tek cihaz "
                                        "bağlanabilir; süre dolunca kapanır."})

    def _pair_status(self):
        durum = self._pair_state()
        kalan = max(0, int(durum["until"] - time.time()))
        return self._send(200, {"open": bool(kalan) and not durum["used"],
                                "seconds_left": kalan, "used": durum["used"]})

    def _pair_take(self):
        """Jetonu yerel cihaza verir. Bearer ISTEMEZ — isteyen taraf zaten
        jetonu bilmiyor; kapi pencerenin kendisidir."""
        origin = self.headers.get("Origin", "")
        if origin and not LOCAL_ORIGIN.match(origin):
            return self._send(403, {"error": "yalniz yerel koken"})
        if not self._rate_ok("pair", limit=20):
            return self._send(429, {"error": "cok fazla esleme denemesi"})
        durum = self._pair_state()
        with self.server.pair_lock:
            acik = time.time() < durum["until"] and not durum["used"]
            if not acik:
                return self._send(403, {
                    "error": "esleme penceresi kapali",
                    "note": "HKM yüzünden «Cihazları bağla» denmeli."})
            durum["used"] = True
        return self._send(200, {"token": self.server.config.get("local_token"),
                                "note": "Bu jeton yalnız bu cihazda saklanır."})

    def _send_page(self):
        """Yerel yuz — tek dosya, sifir bagimlilik.

        Sayfanin KENDISI jeton istemez cunku icinde veri yoktur: butun
        veri /api/* uzerinden gelir ve orasi bearer ister. Kullanici jetonu
        sayfaya girer, sayfa da kendi tarayicisinda saklar."""
        yol = os.path.join(ROOT, "web", "index.html")
        if not os.path.exists(yol):
            return self._send(404, {"error": "yuz kurulu degil"})
        with open(yol, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _send_seviye(self, yol):
        """Rutbe kartlari, kademe sahneleri ve basarim rozetleri.

        Uc arayuzun okudugu AYNI dosyalar (`brand/seviye/medya/`);
        merkez profili de ayni gorselleri gosterir. Marka kapisi gibi
        jeton ISTEMEZ: bir rozette veri yoktur. Yol muhafizi tek
        kaynaktan yayilan blokta (`_ortak_seviye_yolu`)."""
        kok = os.path.dirname(ROOT)
        dosya = _ortak_seviye_yolu(yol, kok) or _ortak_marka_yolu(yol, kok)
        if not dosya or not os.path.exists(dosya):
            return self._send(404, {"error": "yok"})
        tur = MEDYA_TURLERI.get(os.path.splitext(dosya)[1].lower())
        if not tur:
            return self._send(404, {"error": "yok"})
        with open(dosya, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", tur)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _send_brand(self, ad):
        """Marka gorseli — HKM/brand/ altindaki sabit adli dosya.

        Yuzun kendisi gibi jeton ISTEMEZ: bir logoda veri yoktur. Yalniz
        duz dosya adi kabul edilir ve yalniz gorsel uzantilari; bir
        gorsel kapisinin dosya sistemine acilan bir pencereye donusmesi
        bu depoda kabul edilebilir bir bedel degil."""
        # Yuzde kodlamasi ONCE cozulur: cozmeden birakmak bosluklu bir
        # dosya adini (kademe%201.png) sessizce bulunamaz yapardi ve
        # muhafiz, cozulmus hali hic gormedigi icin yanlis yerde guven
        # duyardi. (Ayni gerekce: brand/seviye/ortak_yol.py)
        ad = unquote(ad or "")
        if not ad or "/" in ad or "\\" in ad or ad.startswith("."):
            return self._send(404, {"error": "yok"})
        uzanti = os.path.splitext(ad)[1].lower()
        turler = {".png": "image/png", ".jpg": "image/jpeg",
                  ".jpeg": "image/jpeg", ".webp": "image/webp",
                  ".svg": "image/svg+xml", ".mp4": "video/mp4"}
        if uzanti not in turler:
            return self._send(404, {"error": "yok"})
        yol = os.path.join(ROOT, "brand", ad)
        if not os.path.exists(yol):
            return self._send(404, {"error": "yok"})
        with open(yol, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", turler[uzanti])
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urlparse(self.path)
        if u.path in ("/", "/index.html"):
            return self._send_page()
        if u.path.startswith("/img/seviye/") or u.path.startswith("/img/marka/"):
            return self._send_seviye(u.path)
        if u.path.startswith("/brand/"):
            return self._send_brand(u.path[len("/brand/"):])
        if u.path == "/api/health":
            return self._send(200, {"ok": True, "service": "hkm"})
        if u.path == "/api/wa/webhook":
            """Meta'nin kurulum dogrulamasi. Bearer TASIYAMAZ (istegi Meta
            yollar), bu yuzden tek kapi dogrulama jetonudur: yanlis jetonda
            hicbir sey yansitilmaz."""
            meydan = channels.verify_challenge(self.server.config, parse_qs(u.query))
            if meydan is None:
                return self._send(403, {"error": "dogrulama basarisiz"})
            body = str(meydan).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if not self._authorized():
            return self._send(401, {"error": "bearer gerekli"})
        q = parse_qs(u.query)
        date = (q.get("date") or [datetime.date.today().isoformat()])[0]
        if u.path == "/api/briefing":
            return self._send(200, briefing(self.con, date,
                                            th=self.server.thresholds))
        if u.path == "/api/twin":
            try:
                days = int((q.get("days") or [twin.WINDOW_DAYS])[0])
            except ValueError:
                return self._send(400, {"error": "days bir sayi olmali"})
            days = max(1, min(days, 365))
            return self._send(200, twin.snapshot(self.con, date, days))
        if u.path == "/api/series":
            try:
                days = int((q.get("days") or [twin.WINDOW_DAYS])[0])
            except ValueError:
                return self._send(400, {"error": "days bir sayi olmali"})
            days = max(1, min(days, 365))
            mod = (q.get("module") or [None])[0]
            return self._send(200, {"date": date, "days": days, "module": mod,
                                    "series": twin.series(self.con, date, days, mod)})
        if u.path == "/api/profil":
            return self._send(200, profil.anlik(self.con, date))
        if u.path == "/api/cross":
            try:
                days = int((q.get("days") or [cross.PENCERE])[0])
            except ValueError:
                return self._send(400, {"error": "days bir sayi olmali"})
            days = max(7, min(days, 365))
            return self._send(200, {"date": date, "days": days,
                                    "pairs": cross.scan(self.con, date, days)})
        if u.path == "/api/pair/status":
            return self._pair_status()
        if u.path == "/api/conversation":
            try:
                limit = int((q.get("limit") or [40])[0])
            except ValueError:
                limit = 40
            return self._send(200, {"messages": patron.history(
                self.con, max(1, min(limit, 200)),
                (q.get("channel") or [None])[0],
                (q.get("agent") or [None])[0])})
        if u.path == "/api/attachments":
            try:
                limit = max(1, min(int((q.get("limit") or [40])[0]), 200))
            except ValueError:
                limit = 40
            rows = self.con.execute(
                "SELECT id,channel,kind,mime_type,file_name,size,duration,"
                "caption,state,error,downloaded_at,analyzed_at,created_at "
                "FROM attachments ORDER BY id DESC LIMIT ?",
                (limit,)).fetchall()
            return self._send(200, {"attachments": [dict(r) for r in rows]})
        if u.path == "/api/memory":
            user = (q.get("user") or ["ben"])[0]
            scope = (q.get("scope") or [None])[0]
            return self._send(200, {"memories": memory.list_active(
                self.con, user=user, scope=scope)})

        # ---- Hayat Mottosu: kullanicinin KENDI dusunce agi ----
        #
        # Butun HKM uclari bir olcumden ya da bir modelden turer; bunlar
        # tek istisnadir. Okuma uclari yargi tasimaz, yalniz kullanicinin
        # yazdigini geri verir.
        if u.path == "/api/motto":
            return self._send(200, {
                "tree": motto.agac(self.con),
                "principles": motto.ilkeler(self.con),
                "tags": motto.etiketler(self.con),
                "summary": motto.ozet(self.con)})
        if u.path == "/api/motto/map":
            return self._send(200, motto.harita(self.con))
        if u.path == "/api/motto/search":
            return self._send(200, {"results": motto.ara(
                self.con, (q.get("q") or [""])[0],
                tag=(q.get("tag") or [None])[0],
                kind=(q.get("kind") or [None])[0])})
        if u.path.startswith("/api/motto/node/"):
            try:
                nid = int(u.path.rsplit("/", 1)[-1])
            except ValueError:
                return self._send(400, {"error": "dusunce kimligi sayi olmali"})
            d = motto.dugum(self.con, nid)
            if not d:
                return self._send(404, {"error": "dusunce bulunamadi"})
            return self._send(200, d)
        if u.path.startswith("/api/intents/"):
            mod = u.path.rsplit("/", 1)[-1]
            if mod not in intents.MODULES:
                return self._send(404, {"error": "bilinmeyen modul"})
            return self._send(200, {"module": mod,
                                    "intents": db.intents_for(
                                        self.con, mod, ("pending", "delivered")),
                                    "answered": db.intents_for(
                                        self.con, mod, intents.ANSWERS),
                                    "kinds": intents.KINDS,
                                    "fields": intents.FIELD_RULES,
                                    "summary": intents.summary(self.con)})
        if u.path == "/api/agents":
            # Kim bagli kim degil — ve degilse NEDEN. «Yapay zeka yok» ile
            # «sistem bozuk» ayri seylerdir.
            out = []
            for k, g in sohbet.GOREVLILER.items():
                h = ai.hazir_mi(self.server.config, g["role"])
                a = models.resolve(self.server.config, g["role"])
                rol = models.ROLES.get(g["role"]) or {}
                mod = rol.get("module") or ""
                out.append({"id": k, "ad": g["ad"], "is": g["is"],
                            "role": g["role"], "ready": h["ok"],
                            "reason": h.get("reason", ""),
                            "note": h.get("note", ""),
                            "model": (a or {}).get("model", ""),
                            "provider": (a or {}).get("provider_label", ""),
                            # Hangi sistemin alt patronu — ekran, gorevliyi
                            # sistemiyle birlikte gostermeli: «Biyolojik
                            # sermaye» tek basina hangi modul oldugunu
                            # soylemiyordu.
                            "module": mod,
                            "module_label": models.MODULLER.get(mod, ""),
                            "inherited": bool((a or {}).get("inherited")),
                            "from": (a or {}).get("from") or ""})
            return self._send(200, {"agents": out})
        if u.path == "/api/config":
            return self._send(200, settings.read(self.server.config))
        if u.path == "/api/budget":
            # Harcama OLCUMDUR: defterdeki satirlardan gelir, tahminden degil.
            return self._send(200, {
                "month": butce.month(self.con, self.server.config, date),
                "projection": butce.project(self.con, self.server.config, date),
                "guard": butce.guard(self.con, self.server.config, date)})
        if u.path == "/api/backup":
            return self._send(200, db.export_all(self.con))
        if u.path == "/api/streak":
            try:
                days = int((q.get("days") or [streak.PENCERE])[0])
            except ValueError:
                return self._send(400, {"error": "days bir sayi olmali"})
            return self._send(200, {"date": date,
                                    "streaks": streak.scan(
                                        self.con, date, max(7, min(days, 365)),
                                        th=self.server.thresholds)})
        if u.path == "/api/weekly":
            return self._send(200, weekly.report(self.con, date,
                                                 th=self.server.thresholds))
        if u.path == "/api/outbox":
            return self._send(200, outbox.status(self.con))
        if u.path == "/api/impact":
            return self._send(200, impact.summary(self.con))
        if u.path == "/api/decisions":
            return self._send(200, {"date": date,
                                    "decisions": db.decisions_of(self.con, date),
                                    "current": db.current_decision(self.con, date)})
        return self._send(404, {"error": "yok"})

    def do_POST(self):
        u = urlparse(self.path)

        """WhatsApp webhook'u BEARER TASIYAMAZ: istegi Meta yollar. Kapisi
        imzadir — govde, uygulama sirriyla HMAC-SHA256 imzalanmamissa
        AYRISTIRILMAZ bile. Gonderen izin listesinde degilse icerik ambara
        yazilmaz; yalniz reddedildigi not edilir."""
        if u.path == "/api/wa/webhook":
            return self._wa_webhook()
        if u.path == "/api/tg/webhook":
            return self._tg_webhook()
        if u.path == "/api/pair":
            return self._pair_take()

        if not self._authorized():
            return self._send(401, {"error": "bearer gerekli"})
        if u.path == "/api/pair/open":
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                istek = json.loads(ham or b"{}")
            except ValueError:
                istek = {}
            return self._pair_open((istek or {}).get("seconds"))
        if u.path == "/api/telegram/yoklama":
            # Yoklamayi acmadan once webhook SILINIR: Telegram ikisini
            # ayni anda kabul etmez ve sessizce reddeder.
            silme = yoklama.webhook_sil(self.server.config)
            # Komut menusu de burada kurulur: kullanici «/» yazdiginda
            # komutlari gormeli. Basarisizligi olumcul degildir ve
            # sonucu donulur — sessizce atlanmaz.
            menu = yoklama.komut_menusu(self.server.config)
            r = yoklama.tur(self.con, self.server.config,
                            th=self.server.thresholds, timeout=1)
            return self._send(200, {"webhook_deleted": silme, "menu": menu,
                                    "poll": r})
        if u.path == "/api/attachments/process":
            r = media.process_next(self.con, self.server.config)
            return self._send(200 if r.get("ok") else 409, r)
        if u.path == "/api/memory":
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                body = json.loads(ham or b"{}")
            except ValueError:
                return self._send(400, {"error": "gecersiz JSON"})
            r = memory.add(self.con, body.get("text"), body.get("user") or "ben",
                           body.get("scope") or "all", expires=body.get("expires"))
            return self._send(200 if r.get("ok") else 422, r)
        # ---- Hayat Mottosu yazma uclari ----
        #
        # Butun yazmalar KULLANICININDIR (`author='ben'`). Uretilen bir
        # metin bu uclardan GIREMEZ: onun tek yolu `oner`dir ve o da
        # dugumu degistirmez, onay bekleyen bir surum birakir.
        if u.path.startswith("/api/motto"):
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                body = json.loads(ham or b"{}")
            except ValueError:
                return self._send(400, {"error": "gecersiz JSON"})

            if u.path == "/api/motto/node":
                r = motto.ekle(self.con, body.get("title"),
                               parent_id=body.get("parent_id"),
                               body=body.get("body") or "",
                               kind=body.get("kind") or "dusunce",
                               tags=body.get("tags"))
                return self._send(200 if r.get("ok") else 422, r)
            if u.path == "/api/motto/edit":
                r = motto.duzenle(self.con, body.get("id"),
                                  title=body.get("title"), body=body.get("body"),
                                  kind=body.get("kind"), tags=body.get("tags"))
                return self._send(200 if r.get("ok") else 422, r)
            if u.path == "/api/motto/move":
                r = motto.tasi(self.con, body.get("id"), body.get("parent_id"))
                return self._send(200 if r.get("ok") else 422, r)
            if u.path == "/api/motto/archive":
                r = motto.arsivle(self.con, body.get("id"))
                return self._send(200 if r.get("ok") else 422, r)
            if u.path == "/api/motto/link":
                r = motto.bagla(self.con, body.get("a"), body.get("b"),
                                note=body.get("note"))
                return self._send(200 if r.get("ok") else 422, r)
            if u.path == "/api/motto/unlink":
                r = motto.bagi_kaldir(self.con, body.get("a"), body.get("b"))
                return self._send(200 if r.get("ok") else 404, r)
            if u.path == "/api/motto/accept":
                # Eski bir hale donmek ve uretilen bir oneriyi kabul
                # etmek AYNI YOLDAN gecer: ikisi de «su surum artik
                # gecerli olsun» demektir.
                r = motto.onayla(self.con, body.get("version_id"))
                return self._send(200 if r.get("ok") else 404, r)
            return self._send(404, {"error": "bilinmeyen motto ucu"})

        if u.path.startswith("/api/memory/") and u.path.endswith("/forget"):
            parca = u.path.strip("/").split("/")
            try:
                id_ = int(parca[2])
            except (ValueError, IndexError):
                return self._send(400, {"error": "hafiza kimligi sayi olmali"})
            r = memory.forget(self.con, id_)
            return self._send(200 if r.get("ok") else 404, r)
        if u.path == "/api/probe":
            # «Kurulu» ile «calisiyor» ayri seylerdir: anahtarin gecerliligi
            # ancak SINANARAK bilinir.
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                govde = json.loads(ham or b"{}")
            except ValueError:
                return self._send(400, {"error": "gecersiz JSON"})
            return self._send(200, models.probe(
                self.server.config, (govde or {}).get("provider"),
                key_id=(govde or {}).get("key")))
        if u.path == "/api/config":
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                yama = json.loads(ham or b"{}")
            except ValueError:
                return self._send(400, {"error": "gecersiz JSON"})
            ok, hatalar = settings.validate(yama)
            if not ok:
                # Yarim yazilmis bir yapilandirma, bozuk bir yapilandirmadir.
                return self._send(422, {"errors": hatalar})
            yeni = settings.apply(self.server.config, yama)
            # Yazma yolu SUNUCUDAN gelir: testler gercek config.json'u
            # ezmemeli. Bir test kosumu, kullanicinin yapilandirmasini
            # degistirdigi an test olmaktan cikar.
            settings.write(yeni, getattr(self.server, "config_path", None))
            self.server.config = yeni
            self.server.thresholds = thresholds.from_config(yeni)
            return self._send(200, {"ok": True,
                                    "config": settings.read(yeni)})
        if u.path == "/api/restore":
            self._body_limit = RESTORE_BODY
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                govde = json.loads(ham or b"{}")
            except ValueError:
                return self._send(400, {"error": "gecersiz JSON"})
            veri = govde.get("backup") or govde
            r = db.import_all(self.con, veri, replace=bool(govde.get("replace")))
            return self._send(200 if r.get("ok") else 409, r)
        if u.path == "/api/prune":
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                govde = json.loads(ham or b"{}")
            except ValueError:
                govde = {}
            if not govde.get("confirm"):
                return self._send(400, {"error": "onay gerekli",
                                        "note": "Silme islemi confirm:true ister."})
            res = db.prune_events(self.con, govde.get("days") or 180)
            return self._send(200 if res.get("ok") else 400, res)
        if (u.path.startswith("/api/intents/")
                and not u.path.endswith("/take")):
            # Teklif OLUSTURMA. Kullanici kendi arayuzunden de teklif
            # yazabilmeli: Patron'a cumle kurmak tek yol olmamali.
            # Dogrulama intents.validate'de — iki yerde iki sozlesme
            # olmasin diye burada tekrar edilmez.
            mod = u.path.rsplit("/", 1)[-1]
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                govde = json.loads(ham or b"{}")
            except ValueError:
                return self._send(400, {"error": "gecersiz JSON"})
            r = intents.create(self.con, mod, (govde or {}).get("kind"),
                               (govde or {}).get("payload") or {},
                               (govde or {}).get("note") or "",
                               source=(govde or {}).get("source") or "user")
            return self._send(200 if r.get("ok") else 422, r)
        if u.path.startswith("/api/intents/") and u.path.endswith("/take"):
            mod = u.path.split("/")[3]
            return self._send(200, intents.take(self.con, mod))
        if u.path.startswith("/api/intent/"):
            parca = u.path.strip("/").split("/")
            if len(parca) != 4 or parca[3] not in intents.ANSWERS:
                return self._send(404, {"error": "yok"})
            try:
                nid = int(parca[2])
            except ValueError:
                return self._send(400, {"error": "niyet kimligi sayi olmali"})
            r = intents.answer(self.con, nid, parca[3])
            return self._send(200 if r.get("ok") else 409, r)
        if u.path == "/api/models":
            # Model adlarini SAGLAYICIYA sorar. Koda gomulu bir liste
            # zamanla eskir ve bunu kullanici 404 ile ogrenir.
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                govde = json.loads(ham or b"{}")
            except ValueError:
                govde = {}
            r = models.probe(self.server.config, (govde or {}).get("provider"),
                             key_id=(govde or {}).get("key"))
            return self._send(200, {"ok": bool(r.get("ok")),
                                    "models": r.get("models") or [],
                                    "note": r.get("note") or "",
                                    "reason": r.get("reason") or ""})
        if u.path == "/api/chat/tani":
            # «API girdim ama calismiyor» cumlesinin tek cevabi, zinciri
            # GERCEKTEN kosturup hangi halkanin koptugunu gostermektir.
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                govde = json.loads(ham or b"{}")
            except ValueError:
                govde = {}
            gorevli = (govde or {}).get("agent") or "king"
            if gorevli not in sohbet.GOREVLILER:
                return self._send(404, {"error": "bilinmeyen gorevli"})
            return self._send(200, sohbet.tani(
                self.con, self.server.config,
                (govde or {}).get("date") or date, gorevli=gorevli,
                th=self.server.thresholds))
        if u.path == "/api/chat":
            # Sohbet: once komut, sonra model, sonra durust bir «yok».
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                govde = json.loads(ham or b"{}")
            except ValueError:
                return self._send(400, {"error": "gecersiz JSON"})
            metin = (govde or {}).get("text")
            if not metin or not str(metin).strip():
                return self._send(400, {"error": "bos mesaj"})
            gorevli = (govde or {}).get("agent") or "king"
            if gorevli not in sohbet.GOREVLILER:
                return self._send(404, {"error": "bilinmeyen gorevli"})
            gun = (govde or {}).get("date") or date
            # Gecmis AMBARDAN gelir, istemciden degil: istemcinin
            # gonderdigi bir gecmis, modele istedigini soyletmenin en
            # kisa yoludur.
            onceki = patron.history(self.con, limit=12, agent=gorevli)
            mesajlar = [{"role": ("user" if m["role"] == "user"
                                  else "assistant"), "content": m["text"]}
                        for m in onceki if m["role"] in ("user", "manager")]
            # Kayit sorumlulugu TEK yerde: core/sohbet.py. Burasi da
            # yazsaydi ayni cumle akista iki kez gorunurdu.
            r = sohbet.konus(self.con, self.server.config, metin, gun,
                             gorevli=gorevli, gecmis=mesajlar,
                             th=self.server.thresholds)
            return self._send(200, r)
        if u.path == "/api/message":
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                body = json.loads(ham or b"{}")
            except ValueError:
                return self._send(400, {"error": "gecersiz JSON"})
            res = patron.respond(self.con, body.get("text"),
                                 date=body.get("date"),
                                 th=self.server.thresholds, channel="local")
            return self._send(200, res)
        if u.path == "/api/say":
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                body = json.loads(ham or b"{}")
            except ValueError:
                body = {}
            return self._send(200, self._say(body))
        if u.path.startswith("/api/decision/"):
            parca = u.path.strip("/").split("/")
            if len(parca) != 4 or parca[3] not in ("accept", "decline"):
                return self._send(404, {"error": "yok"})
            try:
                did = int(parca[2])
            except ValueError:
                return self._send(400, {"error": "oneri kimligi sayi olmali"})
            durum = "accepted" if parca[3] == "accept" else "declined"
            res = manager.respond(self.con, did, durum)
            return self._send(res["status"], res)
        if not u.path.startswith("/api/sync/"):
            return self._send(404, {"error": "yok"})
        ham, hata = self._read_body()
        if hata:
            return self._send(413, {"error": hata})
        try:
            body = json.loads(ham or b"{}")
        except ValueError:
            return self._send(400, {"error": "gecersiz JSON"})
        body.setdefault("module", u.path.rsplit("/", 1)[-1])
        res = sync_engine.ingest(self.con, body, th=self.server.thresholds)
        return self._send(res["status"], res)


def _ritim(srv, aralik=60):
    """Dakikalik tik — zamanlanmis isler ve giden kutusu.

    Ayri bir is parcaciginda ve KENDI baglantisiyla calisir: SQLite bir
    baglantiyi yaratildigi is parcaciginin disinda kullandirmaz. Hicbir
    kosulda firlatmaz; bir zamanlayici hatasi daemon'u durduramaz."""
    con = db.connect(srv.db_path)
    while not srv.dur.is_set():
        try:
            schedule.tick(con, srv.config, th=srv.thresholds)
            media.process_next(con, srv.config)
        except Exception as e:                  # noqa: BLE001
            sys.stderr.write("[hkm] ritim hatasi: %s\n" % e)
        srv.dur.wait(aralik)


def main():
    cfg = load_config()
    if not cfg.get("local_token"):
        sys.stderr.write(
            "config.json yok ya da local_token bos. config.example.json'u "
            "kopyalayip uzun rastgele bir token koy.\n")
        return 1
    srv = ThreadingHTTPServer((cfg["host"], int(cfg["port"])), Handler)
    srv.config = cfg
    srv.config_path = CONFIG_PATH
    srv.local = threading.local()
    srv.db_path = cfg.get("db_path") or db.DB_PATH
    db.connect(srv.db_path).close()          # sema bir kez kurulur
    srv.thresholds = thresholds.load()
    srv.dur = threading.Event()
    ritim = threading.Thread(target=_ritim, args=(srv,), daemon=True)
    ritim.start()
    # Yoklama AYRI bir is parcaciginda: Telegram bizi 25 saniye bekletir ve
    # o sirada ritim ile HTTP sunucusu durmamali.
    yok = threading.Thread(target=yoklama.dongu, args=(srv, srv.db_path),
                           daemon=True)
    yok.start()
    zaman = schedule.settings(cfg)
    sys.stderr.write("[hkm] http://%s:%s · ritim %s\n"
                     % (cfg["host"], cfg["port"],
                        "acik (%s)" % zaman.get("morning") if zaman.get("enabled")
                        else "kapali"))
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.dur.set()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
