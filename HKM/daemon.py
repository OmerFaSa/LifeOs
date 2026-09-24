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
    GET  /api/weekly/belge?date=&bicim=pdf|html  haftalik raporun basilir hali
    POST /api/weekly/gonder         haftalik raporu simdi kanala kuyruga koyar (Telegram'a PDF)
    GET  /api/outbox                giden kutusu durumu
    GET  /api/bildirim              sessiz saat, gunluk sinir, susturulanlar
    POST /api/bildirim/ac|sustur    «bir daha sorma» turunu ac / sustur ({anahtar, ad})
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
    GET  /api/urunler               Uretim Burosu'nun urun katalogu
    GET  /api/bam/kayit/<id>/cikti?bicim=html|svg|pdf  kaydin basilir hali
    GET  /api/bam/depo              Depolama Burosu'nun depo denetimi (kod; model yok)
    GET  /api/bam/depo/tara?q=&tur=&durum=  Bilgi Deposu tarayicisi: tazelik, surum, kaynak
    GET  /api/web                   web katmaninin durumu: saglayicilar, bugunku cagri
    GET  /api/hedefler              uc modulun etkin hedefleri ve zaman butcesi (kod)
    POST /api/hedef/sync/<modul>    modulun hedef ozetlerinin anlik goruntusu
    POST /api/zaman                 kullanicinin gunluk toplam vakti (gunluk_dk, haftalik_gun)
    GET  /api/disa-aktar            her sey tek zip: HKM ambari + modullerin en yeni yedegi
    GET  /api/gizlilik              modele ne gitti, ne zaman (veri turu; icerik degil)
    GET  /api/tani                  bozuk olani soyleyen tek liste ve duzeltme yeri
    GET  /api/yedek                 uc modulun HKM'de sakli otomatik yedekleri
    GET  /api/yedek/<modul>/<tarih> sakli bir yedegin kendisi (indirme)
    POST /api/yedek/<modul>         modulun gunluk yedegi (yaz, geri oku, dogrula)
    POST /api/web/dene              web aramasini King adina dener (sorgu)
    POST /api/king/urun             modul sohbetindeki urun istegi -> King emri (modul adina)
    POST /api/king/emir/<id>/onayla King'in teklifini onaylar (secenek: tam|kucuk)
    GET  /api/king/teklifler/<modul> modulun onay bekleyen teklifleri (teklif karti)
    POST /api/king/emir/<id>/devam|dur  parca parca uretimde ara onaya cevap
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

from core import (ai, bam, bildirim, butce, channels, cikti, cross, db, depo, gelen,  # noqa: E402
                  hedefag, impact,
                  intents, kanal, king, manager, media, memory, models, motto, outbox, patron,
                  profil, schedule,
                  settings, sohbet, streak, sync_engine, thresholds, twin,
                  urunler, weekly, web, yedek, yoklama)

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


def _nesne(ham):
    """Govde bir JSON NESNESI olmali. `[]`, `null`, `1`, `"x"` gecerli JSON'dur
    ama `.get` tasimaz: once her uc bunlarla cevap vermeden kopuyordu
    (HATALAR O-7). ValueError, her ucun zaten yakaladigi hatadir."""
    v = json.loads(ham or b"{}")
    if not isinstance(v, dict):
        raise ValueError("govde bir JSON nesnesi olmali")
    return v


def _gun_mu(metin):
    try:
        datetime.date.fromisoformat(str(metin))
        return True
    except ValueError:
        return False


_HATA_KILIDI = threading.Lock()


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

    def _send_bytes(self, code, body, ctype, dosya=None, indir=False):
        """Uretilen belge (HTML, SVG, PDF). HTML ve SVG kati bir icerik
        politikasiyla gider: metin zaten kacislanir; bu ikinci kilittir —
        belge dogrudan acilsa bile betik calismaz."""
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        if ctype.startswith(("text/html", "image/svg")):
            self.send_header("Content-Security-Policy",
                             "default-src 'none'; style-src 'unsafe-inline'; img-src data:; "
                             "font-src 'none'; base-uri 'none'; form-action 'none'")
        if dosya:
            from urllib.parse import quote
            self.send_header("Content-Disposition", "%s; filename*=UTF-8''%s" % (
                "attachment" if indir else "inline", quote(dosya)))
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

    def _motto(self, u, body):
        """Motto uclari. Kimlik dogrulamasi cagiranda (TypeError/ValueError → 400)."""
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
            govde = _nesne(ham)
        except ValueError:
            return self._send(400, {"error": "govde bir JSON nesnesi olmali"})

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
            govde = _nesne(ham)
        except ValueError:
            return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
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

    # --------------------------------------------------------- guvenlik agi
    # HATALAR O-7: beklenmeyen bir hata istegi CEVAPSIZ kapatiyordu; istemci
    # bunu «HKM ulasilamiyor» diye goruyordu. Her istek bir cevap alir ve
    # beklenmeyen hata sayilir (/api/tani «beklenmeyen_hata»).
    def send_response(self, code, message=None):
        self._yanitlandi = True
        super().send_response(code, message)

    def do_GET(self):
        self._korumali(self._get)

    def do_POST(self):
        self._korumali(self._post)

    def _korumali(self, is_):
        self._yanitlandi = False
        try:
            is_()
        except (BrokenPipeError, ConnectionResetError):
            return
        except Exception as e:                  # noqa: BLE001
            srv = self.server
            with _HATA_KILIDI:
                srv.beklenmeyen = getattr(srv, "beklenmeyen", 0) + 1
                srv.son_beklenmeyen = {
                    "yol": urlparse(self.path).path, "tur": type(e).__name__,
                    "zaman": datetime.datetime.now().isoformat(timespec="seconds")}
            sys.stderr.write("[hkm] beklenmeyen hata %s %s: %r\n"
                             % (self.command, urlparse(self.path).path, e))
            if not self._yanitlandi:
                try:
                    self._send(500, {"error": "beklenmeyen hata",
                                     "tur": type(e).__name__})
                except OSError:
                    pass

    def _get(self):
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
        if not _gun_mu(date):
            return self._send(400, {"error": "date yyyy-aa-gg olmali"})
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
        # ---- Web katmani (core/web.py): yalniz BAM ve King kullanir ----
        if u.path == "/api/web":
            return self._send(200, web.durum(self.con, self.server.config))
        # ---- BAM (core/bam.py): ofisler, isler, kayitlar ----
        if u.path == "/api/bam":
            return self._send(200, bam.ozet(self.con))
        if u.path == "/api/bam/depo":
            # Olcum her istekte tazedir ve koddur: kopya surumler baglanir,
            # eskiyen ve kaynaksiz kayit sayilir; hicbir kayit silinmez.
            return self._send(200, {"rapor": depo.denetim(self.con)})
        # Bilgi Deposu tarayicisi (core/depo.py tarayici): arama, tur ve
        # tazelik suzgeci. Tazelik ve sayim koddur; aga cikilmaz.
        if u.path == "/api/bam/depo/tara":
            tur = (q.get("tur") or [""])[0]
            durum = (q.get("durum") or [""])[0]
            try:
                limit = int((q.get("limit") or ["50"])[0])
            except ValueError:
                limit = 50
            return self._send(200, depo.tarayici(
                self.con, sorgu=(q.get("q") or [""])[0][:120],
                tur=tur if tur in bam.TURLER else None,
                durum=durum if durum in depo.TAZELIK_DURUM else None, limit=limit))
        if u.path == "/api/bam/ara":
            return self._send(200, {"kayitlar": bam.kayit_ara(
                self.con, (q.get("q") or [""])[0], limit=20)})
        if u.path == "/api/urunler":
            return self._send(200, {"urunler": [
                {"id": k, "ad": v["ad"], "aile": v["aile"], "kaynak": v["kaynak"]}
                for k, v in urunler.URUNLER.items()]})
        # Kaydin basilir hali (core/cikti.py): HTML, SVG, PDF.
        if u.path.startswith("/api/bam/kayit/") and u.path.endswith("/cikti"):
            parca = u.path.strip("/").split("/")
            try:
                kid = int(parca[3])
            except (ValueError, IndexError):
                return self._send(400, {"error": "kayit kimligi sayi olmali"})
            k = bam.kayit_getir(self.con, kid)
            if not k:
                return self._send(404, {"error": "kayit yok"})
            bicim = (q.get("bicim") or ["html"])[0]
            if bicim not in cikti.BICIMLER:
                return self._send(422, {"ok": False, "note": "Biçim html, svg ya da pdf olmalı."})
            bayt, mime, ad = cikti.uret(k, bicim)
            if bayt is None:
                return self._send(422, {"ok": False, "note": ad})
            return self._send_bytes(200, bayt, mime, ad, indir=(q.get("indir") or [""])[0] == "1")
        if u.path.startswith("/api/bam/kayit/"):
            try:
                kid = int(u.path.rsplit("/", 1)[-1])
            except ValueError:
                return self._send(400, {"error": "kayit kimligi sayi olmali"})
            k = bam.kayit_getir(self.con, kid)
            if not k:
                return self._send(404, {"error": "kayit yok"})
            return self._send(200, {"kayit": k, "iz": bam.iz_zinciri(self.con, "kayit", kid),
                                    "depo": depo.kayit_depo(self.con, kid)})
        # ---- King onay zinciri (core/king.py): is emirleri ve bildirimler ----
        # Hedef agi (core/hedefag.py): uc modulun etkin hedefleri ve zaman butcesi.
        if u.path == "/api/hedefler":
            return self._send(200, hedefag.pano(self.con))
        # Otomatik yedek (core/yedek.py): liste ve indirme. Ad disaridan
        # kurulmaz; modul ve tarih dogrulanmazsa dosyaya hic bakilmaz.
        if u.path == "/api/tani":
            from core import tani
            r = tani.ozet(self.con, self.server.config,
                          datetime.date.today().isoformat(), self.server.db_path)
            # O-7: cevapsiz kopus artik yok; beklenmeyen hata SAYILIR.
            r["beklenmeyen_hata"] = {
                "sayi": getattr(self.server, "beklenmeyen", 0),
                "son": getattr(self.server, "son_beklenmeyen", None)}
            return self._send(200, r)
        if u.path == "/api/para":
            # Para kolu (Y1, core/para.py): bir ayin kayitlari ve ozeti.
            from core import para
            ay_ = (q.get("ay") or [datetime.date.today().isoformat()[:7]])[0]
            r = para.ay(self.con, ay_)
            r["kategoriler_hepsi"] = para.KATEGORILER
            return self._send(200 if r.get("ok") else 400, r)
        if u.path == "/api/gizlilik":
            from core import gizlilik
            return self._send(200, gizlilik.ozet(self.con, datetime.date.today().isoformat()))
        if u.path == "/api/disa-aktar":
            gun = datetime.date.today().isoformat()
            return self._send_bytes(200, yedek.zip_paketi(self.con, yedek.kok(self.server.db_path), gun),
                                    "application/zip", dosya="lifeos-%s.zip" % gun, indir=True)
        if u.path == "/api/yedek":
            return self._send(200, yedek.liste(yedek.kok(self.server.db_path)))
        if u.path.startswith("/api/yedek/"):
            parca = u.path.strip("/").split("/")
            ham = (yedek.oku(yedek.kok(self.server.db_path), parca[2], parca[3])
                   if len(parca) == 4 else None)
            if ham is None:
                return self._send(404, {"error": "yedek yok"})
            return self._send_bytes(200, ham, "application/json; charset=utf-8",
                                    dosya="%s-yedek-%s.json" % (parca[2], parca[3]), indir=True)
        if u.path == "/api/king":
            return self._send(200, king.ozet(self.con))
        # Modulun onay bekleyen teklifleri (Part 8a-3b): modulun teklif karti.
        if u.path.startswith("/api/king/teklifler/"):
            mod = u.path.rsplit("/", 1)[-1]
            if mod not in king.MODULLER:
                return self._send(404, {"error": "bilinmeyen modul"})
            return self._send(200, {"teklifler": king.teklifler(self.con, mod)})
        if u.path.startswith("/api/king/emir/"):
            try:
                eid = int(u.path.rsplit("/", 1)[-1])
            except ValueError:
                return self._send(400, {"error": "emir kimligi sayi olmali"})
            e = king.emir(self.con, eid)
            if not e:
                return self._send(404, {"error": "is emri yok"})
            j = bam.is_getir(self.con, e["bam_is_id"]) if e.get("bam_is_id") else None
            return self._send(200, {"emir": e, "is": j})
        if u.path.startswith("/api/bildirim/"):
            mod = u.path.rsplit("/", 1)[-1]
            if mod not in king.MODULLER:
                return self._send(404, {"error": "bilinmeyen modul"})
            return self._send(200, dict(king.bildirimler(
                self.con, mod, hepsi=(q.get("hepsi") or ["0"])[0] == "1"), modul=mod))
        # Patronlar arasi kanal (core/kanal.py): YALNIZ OKUR.
        if u.path.startswith("/api/kanal/"):
            r = kanal.modul_icin(self.con, u.path.rsplit("/", 1)[-1], date)
            return self._send(200 if r.get("ok") else 422, r)
        if u.path == "/api/memory":
            user = (q.get("user") or ["ben"])[0]
            scope = (q.get("scope") or [None])[0]
            try:
                limit = int((q.get("limit") or ["50"])[0])
            except ValueError:
                return self._send(400, {"error": "limit sayi olmali"})
            return self._send(200, {"memories": memory.list_active(
                self.con, user=user, scope=scope, limit=limit)})

        # ---- Hayat Mottosu: kullanicinin KENDI dusunce agi ----
        #
        # Butun HKM uclari bir olcumden ya da bir modelden turer; bunlar
        # tek istisnadir. Okuma uclari yargi tasimaz, yalniz kullanicinin
        # yazdigini geri verir.
        if u.path == "/api/motto":
            return self._send(200, {
                "tree": motto.agac(self.con),
                "principles": motto.ilkeler(self.con),
                "ideas": motto.fikirler(self.con),
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
            # BAM'in bu dusunceden urettikleri AYRI alanda: kullanicinin
            # sozu ile uretilen hicbir yerde karismaz.
            d["bam"] = bam.mottonun_isleri(self.con, nid)
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
            govde = weekly.report(self.con, date, th=self.server.thresholds)
            govde["gecmis"] = weekly.gecmis(self.con, date)
            return self._send(200, govde)
        if u.path == "/api/weekly/belge":
            # Haftalik raporun basilir hali. PDF cizilemezse HTML'e duser ve
            # bu dosyanin adiyla (uzantisiyla) soylenir.
            bicim = (q.get("bicim") or ["pdf"])[0]
            if bicim not in ("pdf", "html"):
                return self._send(400, {"error": "bicim pdf ya da html olmali"})
            bayt, mime, ad = weekly.dosya(self.con, date, bicim, th=self.server.thresholds)
            if bayt is None:
                return self._send(422, {"error": ad or "rapor uretilemedi"})
            return self._send_bytes(200, bayt, mime, dosya=ad, indir=True)
        if u.path == "/api/outbox":
            return self._send(200, outbox.status(self.con))
        if u.path == "/api/bildirim":
            # Sessiz saat, gunluk sinir ve susturulanlar (core/bildirim.py).
            # Sayi ekranda uretilmez: bugun giden ve simdi sessiz mi burada.
            an = datetime.datetime.now()
            return self._send(200, {
                "ayar": bildirim.settings(self.server.config),
                "susturulanlar": bildirim.susturulanlar(self.con),
                "bugun_giden": bildirim.bugun_giden(self.con, an),
                "sessiz_mi": bildirim.sessiz_mi(self.server.config, an)})
        if u.path == "/api/impact":
            return self._send(200, impact.summary(self.con))
        if u.path == "/api/decisions":
            return self._send(200, {"date": date,
                                    "decisions": db.decisions_of(self.con, date),
                                    "current": db.current_decision(self.con, date)})
        return self._send(404, {"error": "yok"})

    def _post(self):
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
                istek = _nesne(ham)
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
                body = _nesne(ham)
            except ValueError:
                return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
            r = memory.add(self.con, body.get("text"), body.get("user") or "ben",
                           body.get("scope") or "all", expires=body.get("expires"))
            return self._send(200 if r.get("ok") else 422, r)
        # ---- Hayat Mottosu yazma uclari ----
        #
        # Butun yazmalar KULLANICININDIR (`author='ben'`). Uretilen bir
        # metin bu uclardan GIREMEZ: onun tek yolu `oner`dir ve o da
        # dugumu degistirmez, onay bekleyen bir surum birakir.
        # Bir dusunceden BAM'a is (core/bam.py). BAM dusunceyi OKUR, yazmaz.
        if u.path.startswith("/api/motto/node/") and u.path.endswith("/bam"):
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                body = _nesne(ham)
                nid = int(u.path.strip("/").split("/")[3])
            except (ValueError, IndexError):
                return self._send(400, {"error": "gecersiz istek"})
            r = bam.mottodan_is(self.con, nid, (body or {}).get("istek") or "arastir")
            return self._send(200 if r.get("ok") else 422, r)
        if u.path.startswith("/api/motto"):
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                body = _nesne(ham)
            except ValueError:
                return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
            try:
                return self._motto(u, body)
            except (TypeError, ValueError):
                # Kimliksiz ya da sayi olmayan kimlik: int(None) (O-7).
                return self._send(400, {"error": "kimlik alanlari sayi olmali"})


        # Haftalik rapor elle: zamanlanmis isin AYNISI (metin + Telegram'a
        # PDF). Giden kutusunun kimligi (kanal, tur, gun) ayni gun ikinci
        # gonderimi engeller; bu soylenir.
        if u.path == "/api/weekly/gonder":
            r = schedule.run(self.con, self.server.config, {"kind": "weekly"},
                             th=self.server.thresholds)
            if r.get("ok") and not r.get("queued"):
                r["note"] = "Bugünün haftalık raporu zaten kuyrukta ya da gönderildi."
            return self._send(200 if r.get("ok") else 409, r)
        # Modulun gunluk yedegi (core/yedek.py). Govde AYRISTIRILIP yeniden
        # yazilmaz: saklanan, modulun urettigi baytlarin kendisidir. Sinir
        # geri yuklemeyle aynidir — modulun yedegi kendi yolundan gecebilmeli.
        if u.path.startswith("/api/yedek/"):
            self._body_limit = RESTORE_BODY
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            r = yedek.kaydet(yedek.kok(self.server.db_path), u.path.rsplit("/", 1)[-1], ham)
            return self._send(200 if r.get("ok") else 422, r)
        # Modul hedeflerinin anlik goruntusu (core/hedefag.py). Hafizayla ayni
        # kural: modul tamamini yollar, HKM kopyasini esitler.
        if u.path.startswith("/api/hedef/sync/") or u.path == "/api/zaman":
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                body = _nesne(ham)
            except ValueError:
                return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
            if not isinstance(body, dict):
                return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
            if u.path == "/api/zaman":
                r = hedefag.zaman_yaz(self.con, body.get("gunluk_dk"), body.get("haftalik_gun"))
                if r.get("ok"):
                    r["butce"] = hedefag.butce(self.con)
                return self._send(200 if r.get("ok") else 422, r)
            r = hedefag.esitle(self.con, u.path.rsplit("/", 1)[-1], body.get("hedefler"))
            if r.get("ok"):
                r["butce"] = hedefag.butce(self.con)
                if "tatil" in body:
                    # Tatil modu (brand/ortak/seri.js): yalniz tarih; null siler.
                    r["tatil"] = hedefag.tatil_yaz(self.con, u.path.rsplit("/", 1)[-1],
                                                   body.get("tatil"))
                if body.get("yarin") is not None:
                    # Aksam «yarin sunlar var» (core/schedule.py): modulun sectigi isler.
                    r["yarin"] = hedefag.yarin_yaz(self.con, u.path.rsplit("/", 1)[-1],
                                                   body.get("yarin"))
                if body.get("dil_karti") is not None:
                    # Gunun dil karti (fikir 38): yalniz ESP; HKM saatinde dizer.
                    r["dil_karti"] = hedefag.dilkart_yaz(self.con, u.path.rsplit("/", 1)[-1],
                                                         body.get("dil_karti"))
            return self._send(200 if r.get("ok") else 422, r)
        # Modul hafizasinin anlik goruntusu (core/memory.py esitle). Modul
        # TAMAMINI yollar, HKM kendi kopyasini esitler; ayni goruntu iki
        # kez gelirse hicbir sey degismez.
        if u.path.startswith("/api/memory/sync/"):
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                body = _nesne(ham)
            except ValueError:
                return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
            if not isinstance(body, dict):
                return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
            r = memory.esitle(self.con, u.path.rsplit("/", 1)[-1], body.get("items"))
            return self._send(200 if r.get("ok") else 422, r)
        # ---- BAM: is ac, ilerlet, iptal, devam ----
        if u.path == "/api/bam/is":
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                body = _nesne(ham)
            except ValueError:
                return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
            if not isinstance(body, dict):
                return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
            r = bam.is_ac(self.con, body.get("talep"), kaynak=body.get("kaynak") or "kullanici",
                          hedef_modul=body.get("hedef_modul") or None)
            return self._send(200 if r.get("ok") else 422, r)
        # Web aramasini King adina DENER: Ayarlar ekranindaki «dene» dugmesi.
        # Rol sunucuda sabittir; istemci rol secemez.
        if u.path == "/api/web/dene":
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                body = _nesne(ham)
            except ValueError:
                return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
            r = web.ara(self.con, self.server.config, "king", (body or {}).get("sorgu"), n=5)
            return self._send(200, r)
        # Modul sohbetindeki urun istegi: taniyici HKM'dedir (core/sohbet.py
        # urun_istegi). Taninmazsa `tanindi: False` doner; modul kendi
        # sohbetine devam eder. Emir modul adina acilir, urun ona teklif olur.
        if u.path == "/api/king/urun":
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                body = _nesne(ham)
            except ValueError:
                return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
            if not isinstance(body, dict) or not str(body.get("metin") or "").strip():
                return self._send(400, {"error": "metin gerekli"})
            r = sohbet.urun_modulden(self.con, self.server.config, body.get("modul"),
                                     str(body.get("metin")))
            return self._send(200 if r.get("ok") else 422, r)
        if u.path in ("/api/bildirim/ac", "/api/bildirim/sustur"):
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                body = _nesne(ham)
            except ValueError:
                return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
            anahtar = str((body or {}).get("anahtar") or "").strip()
            if not anahtar:
                return self._send(422, {"ok": False, "note": "anahtar gerekli"})
            if u.path.endswith("/ac"):
                r = bildirim.ac(self.con, anahtar)
            else:
                r = bildirim.sustur(self.con, anahtar, str(body.get("ad") or anahtar))
            return self._send(200 if r.get("ok") else 404, r)
        if u.path == "/api/bam/ilerlet":
            r = bam.ilerlet(self.con, self.server.config)
            king.esitle(self.con)
            return self._send(200, r or {"ok": False, "note": "Kuyrukta bekleyen iş yok."})
        # ---- King: is emri (modulden), iptal, bildirim okundu ----
        #
        # Modul yalniz KENDI adina is emri yazar; zincirin HKM tarafini
        # sunucu kurar (core/king.py). Karar kuralladir ve cevapta durur:
        # 200 + karar=ret, «reddedildi» bir hata degil bir KARARDIR.
        if u.path == "/api/king/emir":
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                body = _nesne(ham)
            except ValueError:
                return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
            if not isinstance(body, dict):
                return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
            r = king.emir_ac(self.con, self.server.config, body.get("modul"), body.get("tur"),
                             body.get("govde"), konu=body.get("konu"), neden=body.get("neden"))
            return self._send(200 if r.get("ok") else 422, r)
        # Teklif onayi (Part 8a-3): secilen secenekle is BAM'da acilir. Uc
        # kanalin (HKM ekrani, modulun karti, sohbet) hepsi bu isleve gelir.
        if u.path.startswith("/api/king/emir/") and u.path.endswith("/onayla"):
            parca = u.path.strip("/").split("/")
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                eid = int(parca[3])
                body = _nesne(ham)
            except (ValueError, IndexError):
                return self._send(400, {"error": "gecersiz istek"})
            r = king.teklif_onayla(self.con, self.server.config, eid,
                                   (body or {}).get("secenek") or None)
            return self._send(200 if r.get("ok") else 409, r)
        # Ara onay (Part 8b): parca parca uretimde «devam» ya da «dur».
        if u.path.startswith("/api/king/emir/") and u.path.rsplit("/", 1)[-1] in ("devam", "dur"):
            parca = u.path.strip("/").split("/")
            try:
                eid = int(parca[3])
            except (ValueError, IndexError):
                return self._send(400, {"error": "emir kimligi sayi olmali"})
            r = king.parca(self.con, eid, parca[4])
            return self._send(200 if r.get("ok") else 409, r)
        if u.path.startswith("/api/king/emir/") and u.path.endswith("/iptal"):
            parca = u.path.strip("/").split("/")
            try:
                eid = int(parca[3])
            except (ValueError, IndexError):
                return self._send(400, {"error": "emir kimligi sayi olmali"})
            r = king.iptal(self.con, eid)
            return self._send(200 if r.get("ok") else 409, r)
        if u.path.startswith("/api/bildirim/") and u.path.endswith("/okundu"):
            parca = u.path.strip("/").split("/")
            try:
                bid = int(parca[2])
            except (ValueError, IndexError):
                return self._send(400, {"error": "bildirim kimligi sayi olmali"})
            r = king.okundu(self.con, bid)
            return self._send(200 if r.get("ok") else 404, r)
        if u.path.startswith("/api/bam/is/") and u.path.rsplit("/", 1)[-1] in ("iptal", "devam"):
            parca = u.path.strip("/").split("/")
            try:
                iid = int(parca[3])
            except (ValueError, IndexError):
                return self._send(400, {"error": "is kimligi sayi olmali"})
            r = (bam.iptal if parca[4] == "iptal" else bam.devam)(self.con, iid)
            king.esitle(self.con)
            return self._send(200 if r.get("ok") else 409, r)
        if u.path.startswith("/api/memory/") and u.path.endswith("/forget"):
            parca = u.path.strip("/").split("/")
            try:
                id_ = int(parca[2])
            except (ValueError, IndexError):
                return self._send(400, {"error": "hafiza kimligi sayi olmali"})
            r = memory.forget(self.con, id_)
            return self._send(200 if r.get("ok") else 404, r)
        # Para kolu (Y1): form ile kayit ve silme. Silinen kayit isaretlenir.
        if u.path == "/api/para" or (u.path.startswith("/api/para/") and u.path.endswith("/sil")):
            from core import para
            if u.path.endswith("/sil"):
                try:
                    id_ = int(u.path.split("/")[3])
                except (ValueError, IndexError):
                    return self._send(400, {"error": "kayıt kimliği sayı olmalı"})
                r = para.sil(self.con, id_)
                return self._send(200 if r["ok"] else 404, r)
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                govde = _nesne(ham)
            except ValueError:
                return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
            r = para.ekle(self.con, govde, datetime.date.today().isoformat())
            return self._send(200 if r.get("ok") else 422, r)
        if u.path == "/api/probe":
            # «Kurulu» ile «calisiyor» ayri seylerdir: anahtarin gecerliligi
            # ancak SINANARAK bilinir.
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                govde = _nesne(ham)
            except ValueError:
                return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
            return self._send(200, models.probe(
                self.server.config, (govde or {}).get("provider"),
                key_id=(govde or {}).get("key")))
        if u.path == "/api/config":
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                yama = _nesne(ham)
            except ValueError:
                return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
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
                govde = _nesne(ham)
            except ValueError:
                return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
            veri = govde.get("backup") or govde
            r = db.import_all(self.con, veri, replace=bool(govde.get("replace")))
            return self._send(200 if r.get("ok") else 409, r)
        if u.path == "/api/prune":
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                govde = _nesne(ham)
            except ValueError:
                govde = {}
            if not govde.get("confirm"):
                return self._send(400, {"error": "onay gerekli",
                                        "note": "Silme islemi confirm:true ister."})
            # HATALAR D-7: «or 180» days:0'i sessizce 180 yapiyordu. Alan
            # yoksa varsayilan; varsa oldugu gibi dogrulanir (en az 7).
            gun = govde.get("days", 180)
            if isinstance(gun, bool) or not isinstance(gun, int):
                return self._send(400, {"error": "days bir tam sayi olmali"})
            res = db.prune_events(self.con, gun)
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
                govde = _nesne(ham)
            except ValueError:
                return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
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
                govde = _nesne(ham)
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
                govde = _nesne(ham)
            except ValueError:
                govde = {}
            gorevli = (govde or {}).get("agent") or "king"
            if gorevli not in sohbet.GOREVLILER:
                return self._send(404, {"error": "bilinmeyen gorevli"})
            # `date` bu yolda TANIMLI DEGIL (yalniz do_GET'te); govdesiz
            # istek NameError ile baglantiyi dusuruyordu.
            return self._send(200, sohbet.tani(
                self.con, self.server.config,
                (govde or {}).get("date") or datetime.date.today().isoformat(),
                gorevli=gorevli,
                th=self.server.thresholds))
        if u.path == "/api/chat":
            # Sohbet: once komut, sonra model, sonra durust bir «yok».
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                govde = _nesne(ham)
            except ValueError:
                return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
            metin = (govde or {}).get("text")
            if not metin or not str(metin).strip():
                return self._send(400, {"error": "bos mesaj"})
            gorevli = (govde or {}).get("agent") or "king"
            if gorevli not in sohbet.GOREVLILER:
                return self._send(404, {"error": "bilinmeyen gorevli"})
            gun = (govde or {}).get("date") or datetime.date.today().isoformat()
            if not _gun_mu(gun):
                return self._send(400, {"error": "date yyyy-aa-gg olmali"})
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
                body = _nesne(ham)
            except ValueError:
                return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
            if body.get("date") is not None and not _gun_mu(body.get("date")):
                return self._send(400, {"error": "date yyyy-aa-gg olmali"})
            res = patron.respond(self.con, body.get("text"),
                                 date=body.get("date"),
                                 th=self.server.thresholds, channel="local")
            return self._send(200, res)
        if u.path == "/api/say":
            ham, hata = self._read_body()
            if hata:
                return self._send(413, {"error": hata})
            try:
                body = _nesne(ham)
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
            body = _nesne(ham)
        except ValueError:
            return self._send(400, {"error": "govde bir JSON nesnesi olmali"})
        yol_modul = u.path.rsplit("/", 1)[-1]
        # HATALAR D-1: govdedeki «module» yolu ezip kaydi baska modulun
        # ambarina yaziyordu. Yol belirler; uyusmazlik reddedilir.
        if body.get("module", yol_modul) != yol_modul:
            return self._send(400, {"error": "govdedeki module yol ile uyusmuyor"})
        body["module"] = yol_modul
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
            # BAM: her tikte EN FAZLA bir adim — uzun is sunucuyu kilitlemez.
            bam.ilerlet(con, srv.config)
            # King: isin durumu emre tasinir, DEGISIM bildirilir.
            king.esitle(con)
            # Depolama Burosu: gunluk depo denetimi (kod, gunde bir kez).
            depo.bakim(con)
            # King'in guncellik turu: arada bir, tikte en cok bir kayit.
            king.bekci(con, srv.config)
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
