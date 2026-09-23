"""SQLite semasi ve erisim — spec'ten uc yerde bilerek ayrilir (MIMARI.md §6).

1. decisions.date UNIQUE kalkti: bir gun icinde
   proposed -> declined -> yeni oneri zinciri mumkun olmali.
2. decision_sources ara tablosu eklendi: karar tasiyan bir katman neyi
   tasidiginin izini birakmazsa karar sonradan gerekcelendirilemez.
3. Dogrulama metni yeniden yazmaz; reddeder (sync_engine).
"""

import datetime
import json
import os
import sqlite3
import time

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(_ROOT, "db", "hkm.db")

SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS raw_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  module     TEXT NOT NULL,              -- ays | spi | esp
  date       TEXT NOT NULL,              -- ISO yyyy-mm-dd
  received_at TEXT NOT NULL,
  payload    TEXT NOT NULL               -- ham JSON, etiketleriyle
);
CREATE INDEX IF NOT EXISTS ix_raw_module_date ON raw_events(module, date);

CREATE TABLE IF NOT EXISTS audits (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id   INTEGER NOT NULL REFERENCES raw_events(id) ON DELETE CASCADE,
  vp         TEXT NOT NULL,              -- academic | bio | intellect
  verdict    TEXT NOT NULL,              -- APPROVED | INCOMPLETE | ANOMALY
  findings   TEXT NOT NULL,              -- JSON dizi
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_audits_event ON audits(event_id);

CREATE TABLE IF NOT EXISTS decisions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       TEXT NOT NULL,              -- UNIQUE DEGIL: gunde birden cok oneri
  rank       INTEGER NOT NULL,           -- HKM.PRECEDENCE sirasi
  key        TEXT,                       -- hangi oncelik kurali (bio_red, ...)
  proposal   TEXT NOT NULL,              -- oneri cumlesi (emir degil)
  state      TEXT NOT NULL DEFAULT 'proposed',  -- proposed|accepted|declined
  answered_at TEXT,                      -- kabul/ret zamani
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_decisions_date ON decisions(date);

CREATE TABLE IF NOT EXISTS decision_sources (
  decision_id INTEGER NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  audit_id    INTEGER NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  PRIMARY KEY (decision_id, audit_id)
);

/* Niyet kuyrugu — HKM'nin modullere YAZMADAN is baslatma yolu.

   «Yarin iki saat matematik» istegi, HKM'nin AYS'ye yazmasi demek olurdu
   ve tek yonlu bagimliligi kirardi. Bunun yerine HKM bir NIYET yazar;
   modul acilista kuyrugu sorar, kullaniciya gosterir ve onaylanirsa
   KENDI kodu ile uygular. Yazan yine moduldur.

   Durum: pending → delivered → applied | acknowledged | dismissed | unknown
   «delivered» modulun gordugu, «applied» kullanicinin onayladigi demektir;
   ikisini ayirmak, gorulmeyen bir niyetle reddedilmis bir niyeti
   birbirinden ayirir. */
CREATE TABLE IF NOT EXISTS intents (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  module      TEXT NOT NULL,             -- ays | spi | esp
  kind        TEXT NOT NULL,             -- plan.add | focus.set | ...
  payload     TEXT NOT NULL,             -- JSON: modulun anlayacagi alanlar
  note        TEXT NOT NULL,             -- kullaniciya gosterilecek cumle
  source      TEXT NOT NULL,             -- patron | precedence | user
  state       TEXT NOT NULL DEFAULT 'pending',
  created_at  TEXT NOT NULL,
  delivered_at TEXT,
  answered_at TEXT
);
CREATE INDEX IF NOT EXISTS ix_intents_module ON intents(module, state);

/* Giden kutusu — teslim GUVENCESI.

   Kanal gonderimi agdan gecer ve ag her zaman calismaz. Basarisiz bir
   gonderimi yutmak, kullaniciya hicbir sey soylemeden sessizce kaybolan
   bir mesaj demektir; gec gelen bir mesaj bundan iyidir.

   Ama tekrar denemek TEKRAR GONDERMEK olmamali: her satirin bir kimligi
   var (channel + kind + day) ve ayni kimlikle ikinci bir satir yazilmaz. */
CREATE TABLE IF NOT EXISTS outbox (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  channel    TEXT NOT NULL,
  target     TEXT,                      -- alici (bos: kanalin varsayilani)
  kind       TEXT NOT NULL,             -- daily | weekly | reply | ...
  day        TEXT NOT NULL,             -- kimligin parcasi: gunde tek mesaj
  text       TEXT NOT NULL,
  state      TEXT NOT NULL DEFAULT 'queued',  -- queued|sent|failed|given_up
  attempts   INTEGER NOT NULL DEFAULT 0,
  next_at    TEXT NOT NULL,             -- bir sonraki deneme zamani
  last_error TEXT,
  created_at TEXT NOT NULL,
  sent_at    TEXT,
  UNIQUE(channel, kind, day)
);
CREATE INDEX IF NOT EXISTS ix_outbox_state ON outbox(state, next_at);

/* Gelen mesaj defteri — AYNI MESAJI IKI KEZ ISLEMEMEK icin.

   WhatsApp ve Telegram, cevap alamadiklarinda ayni webhook'u TEKRAR
   yollar. Bu bir ariza degil, sozlesmenin parcasidir: saglayici teslimi
   garanti eder, TEK teslimi degil.

   Tekrar gelen bir mesaji yeniden islemek, «kabul» komutunu iki kez
   calistirmak demektir. Bu yuzden her gelen mesajin saglayici kimligi
   (WhatsApp wamid, Telegram chat:message_id) burada durur ve ayni kimlik
   ikinci kez islenmez.

   Defter KALICIDIR: bellekte tutulan bir kume, daemon yeniden baslatildigi
   anda bosalir ve koruma tam da en kirilgan anda kaybolurdu. */
CREATE TABLE IF NOT EXISTS inbox_seen (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  channel    TEXT NOT NULL,
  msg_id     TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(channel, msg_id)
);
CREATE INDEX IF NOT EXISTS ix_inbox_seen ON inbox_seen(created_at);

/* Telegram ekleri — dosyanin kendisinden once gelen guvenli kuyruk. */
CREATE TABLE IF NOT EXISTS attachments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  channel     TEXT NOT NULL,
  sender      TEXT NOT NULL,
  message_id  TEXT NOT NULL,
  kind        TEXT NOT NULL,
  file_id     TEXT NOT NULL,
  unique_id   TEXT,
  mime_type   TEXT,
  file_name   TEXT,
  size        INTEGER,
  duration    INTEGER,
  caption     TEXT,
  state       TEXT NOT NULL DEFAULT 'received',
  local_path  TEXT,
  sha256      TEXT,
  downloaded_at TEXT,
  analyzed_at TEXT,
  error       TEXT,
  created_at  TEXT NOT NULL,
  UNIQUE(channel, sender, message_id, file_id)
);
CREATE INDEX IF NOT EXISTS ix_attachments_state ON attachments(state, created_at);

CREATE TABLE IF NOT EXISTS memories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user        TEXT NOT NULL,
  scope       TEXT NOT NULL DEFAULT 'all',
  text        TEXT NOT NULL,
  source      TEXT NOT NULL,
  state       TEXT NOT NULL DEFAULT 'active',
  created_at  TEXT NOT NULL,
  expires_at  TEXT,
  last_used_at TEXT,
  forgotten_at TEXT
);
CREATE INDEX IF NOT EXISTS ix_memories_user_state ON memories(user,state,scope);

/* BAM — Bilgi ve Aksiyon Modulu (core/bam.py). Is kuyrugu, kayitlar
   ve «bu neden var» iz zinciri. BAM hicbir module YAZMAZ; teklifi
   niyet kuyruguna (intents) birakir. */
CREATE TABLE IF NOT EXISTS bam_isler (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  talep       TEXT NOT NULL,
  kaynak      TEXT NOT NULL DEFAULT 'kullanici',  -- kullanici|ays|spi|esp|motto
  hedef_modul TEXT,                               -- ays|spi|esp|NULL
  ofisler     TEXT NOT NULL,                      -- JSON dizi
  adimlar     TEXT NOT NULL DEFAULT '[]',         -- JSON: ofis basina durum
  durum       TEXT NOT NULL DEFAULT 'bekliyor',   -- bekliyor|beklemede|tamam|kismen|hata|iptal
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_bam_isler_durum ON bam_isler(durum, id);

CREATE TABLE IF NOT EXISTS bam_kayitlar (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tur         TEXT NOT NULL,                      -- arastirma|plan|materyal
  baslik      TEXT NOT NULL,
  govde       TEXT NOT NULL,                      -- JSON
  dogruluk    TEXT NOT NULL,                      -- dogrulanmadi|kaynakli|celiskili
  etiketler   TEXT NOT NULL DEFAULT '',
  surum       INTEGER NOT NULL DEFAULT 1,
  onceki_id   INTEGER,
  is_id       INTEGER,
  created_at  TEXT NOT NULL,
  anahtar     TEXT,                               -- konu anahtari (core/depo.py)
  denetim     TEXT                                -- son guncellik denetimi, JSON
);

/* Web katmani (core/web.py): onbellek ve gunluk sayac. Yedege girmez:
   onbellek yeniden uretilebilir, sayac yalniz bugunu korur. */
CREATE TABLE IF NOT EXISTS web_onbellek (
  anahtar     TEXT NOT NULL,
  tur         TEXT NOT NULL,                      -- ara|sayfa
  govde       TEXT NOT NULL,                      -- JSON
  alindi      TEXT NOT NULL,
  PRIMARY KEY (anahtar, tur)
);

CREATE TABLE IF NOT EXISTS web_sayac (
  gun         TEXT PRIMARY KEY,                   -- YYYY-MM-DD
  cagri       INTEGER NOT NULL DEFAULT 0,
  kacinilan   INTEGER NOT NULL DEFAULT 0          -- onbellek sayesinde yapilmayan
);

/* Depolama Burosu'nun gunluk denetim raporu (core/depo.py). Turetilmistir:
   yedege girmez, yeniden uretilir. */
CREATE TABLE IF NOT EXISTS bam_depo_rapor (
  gun    TEXT PRIMARY KEY,
  rapor  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bam_iz (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  kaynak_tur  TEXT NOT NULL,
  kaynak_id   TEXT NOT NULL,
  hedef_tur   TEXT NOT NULL,
  hedef_id    TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  UNIQUE(kaynak_tur, kaynak_id, hedef_tur, hedef_id)
);

/* KING ONAY ZINCIRI (core/king.py). Modulun is emri King'e gelir;
   King imkan kontrolunu yapar, onaylarsa isi BAM'da acar. `iz` katlarin
   zinciridir ve SUNUCUDA kurulur. `govde` yalniz dogrulanmis alanlari
   tasir: modulun fazladan gonderdigi hicbir sey ambara girmez. */
CREATE TABLE IF NOT EXISTS is_emirleri (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  modul       TEXT NOT NULL,                      -- ays|spi|esp
  tur         TEXT NOT NULL,                      -- hedef.plan ...
  konu        TEXT NOT NULL,
  neden       TEXT NOT NULL DEFAULT '',
  govde       TEXT NOT NULL DEFAULT '{}',         -- JSON
  anahtar     TEXT,                               -- ayni is tekrar acilmaz
  iz          TEXT NOT NULL DEFAULT '[]',         -- JSON: kat zinciri
  karar       TEXT NOT NULL,                      -- onay|kismi|ret
  kontrol     TEXT NOT NULL DEFAULT '[]',         -- JSON: imkan maddeleri
  tahmin      TEXT,                               -- JSON: {sn, etiket, dayanak}
  durum       TEXT NOT NULL,                      -- core/king.py DURUMLAR
  bam_is_id   INTEGER,
  sonuc       TEXT,                               -- JSON: kayit_id, gercek_sn
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_is_emirleri_durum ON is_emirleri(durum, id);
CREATE INDEX IF NOT EXISTS ix_is_emirleri_anahtar ON is_emirleri(anahtar);

/* Bildirim kuyrugu: onaylandi, basladi, bekliyor, bitti, reddedildi...
   Modul acilista sorar. «Okundu» bildirimi SILMEZ. */
CREATE TABLE IF NOT EXISTS bildirimler (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  modul       TEXT NOT NULL,
  emir_id     INTEGER,
  tur         TEXT NOT NULL,
  metin       TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  okundu_at   TEXT
);
CREATE INDEX IF NOT EXISTS ix_bildirimler_modul ON bildirimler(modul, okundu_at, id);

-- Hedef agi (core/hedefag.py): modullerin etkin hedeflerinin ANLIK GORUNTUSU.
-- Modul tamamini yollar; HKM kopyasini esitler. HKM modullere yazmaz.
CREATE TABLE IF NOT EXISTS hedef_ozet (
  modul       TEXT NOT NULL,
  dis_id      TEXT NOT NULL,
  govde       TEXT NOT NULL,
  guncelleme  TEXT NOT NULL,
  PRIMARY KEY (modul, dis_id)
);

-- Zaman butcesi: kullanicinin KENDI beyani (gunde kac dakika, haftada kac gun).
CREATE TABLE IF NOT EXISTS zaman_butcesi (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  gunluk_dk     INTEGER NOT NULL,
  haftalik_gun  INTEGER NOT NULL,
  updated_at    TEXT NOT NULL
);

/* Kullanim defteri — PARANIN kaydi.

   Bir model cagrisinin maliyeti ancak KAYDEDILIRSE bilinir. Fatura ay
   sonunda gelir; o zamana kadar «ne kadar harcadim» sorusunun cevabi
   tahmin olurdu ve tahmin, bu sistemde olcum yerine gecmez.

   Uc kural:

   1. BASARISIZ CAGRI DA YAZILIR. Para, cevap alinmadan da harcanmis
      olabilir; yazilmayan bir cagri, gorunmeyen bir gider demektir.
   2. HER SATIR KENDI FIYATINI TASIR. Fiyat sonradan degisir; gecmis
      satirin maliyeti, o gunku fiyatla hesaplanmis haliyle DURUR.
   3. TOKEN TURLERI AYRI SAYILIR. Gorsel ve dusunme token'lari faturada
      gorunur ama cevapta gorunmez: ayri sutun, ayri gercek. */
CREATE TABLE IF NOT EXISTS usage (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  TEXT NOT NULL,
  day         TEXT NOT NULL,            -- YYYY-MM-DD (aylik toplam icin)
  user        TEXT NOT NULL DEFAULT 'ben',
  role        TEXT NOT NULL,            -- king | vp_bio | ays.gorsel ...
  task        TEXT NOT NULL,            -- sohbet | gorev_cikar | gorsel_oku ...
  provider    TEXT NOT NULL,
  model       TEXT NOT NULL,
  in_tok      INTEGER NOT NULL DEFAULT 0,
  out_tok     INTEGER NOT NULL DEFAULT 0,
  image_tok   INTEGER NOT NULL DEFAULT 0,
  reason_tok  INTEGER NOT NULL DEFAULT 0,
  usd         REAL NOT NULL DEFAULT 0,
  try_        REAL NOT NULL DEFAULT 0,  -- o gunku kurla, SATIRDA DONDURULMUS
  rate        REAL NOT NULL DEFAULT 0,  -- kullanilan USD/TRY
  cached      INTEGER NOT NULL DEFAULT 0,
  escalated   INTEGER NOT NULL DEFAULT 0,
  ok          INTEGER NOT NULL DEFAULT 1,
  note        TEXT
);
CREATE INDEX IF NOT EXISTS ix_usage_day ON usage(day, user);

CREATE TABLE IF NOT EXISTS conversations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  channel       TEXT NOT NULL,           -- local | telegram | whatsapp
  role          TEXT NOT NULL,           -- user | manager
  text          TEXT NOT NULL,
  audio_retained INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);

/* HAYAT MOTTOSU — kullanicinin KENDI dusunce ve yasam felsefesi agi.

   Bu tablolar HKM'nin geri kalanindan bir seyde ayrilir: buradaki
   icerigi SISTEM URETMEZ, kullanici yazar. Butun HKM kayitlari bir
   olcumden ya da bir modelden turer; burasi tek istisnadir ve o yuzden
   kurallari da farklidir.

   UC DEGISMEZ

   1. ESKI DUSUNCE KAYBOLMAZ. Her duzenleme oncekini `motto_versions`
      icine yazar. Bir insanin «basari benim icin X» dedigi gun ile «artik
      Y diyorum» dedigi gun arasindaki fark, dusuncenin KENDISI kadar
      degerlidir — ustune yazmak o farki siler.

   2. KULLANICININ SOZU ILE URETILEN AYRI DURUR. `author` alani her
      surumde kimin yazdigini tasir ('ben' ya da bir uretici). Bir dil
      modelinin cumlesi kullanicinin ilkesi gibi gorunurse, kisi bir sure
      sonra kendi dusuncesi ile kendisine soylenen seyi ayirt edemez. Bu
      alan gorsel bir ayrinti degil, bu bolumun var olma sebebi.

   3. BASKA MODUL BURAYA YAZMAZ. AYS, SPI ve ESP bu tablolari hic
      gormez; HKM'nin kendi icinde de yalniz `core/motto.py` yazar.

   AGAC VE AG AYNI ANDA

   `parent_id` bir AGAC kurar (Hayat → Zaman), `motto_links` ise agactan
   BAGIMSIZ bir ag (Disiplin ↔ Ozgurluk). Ikisi ayri seydir: agac
   kullanicinin siniflandirmasi, ag ise dusuncenin gercek akrabaligi.
   Tek yapiya indirgenseydi biri otekini bozardi — ya her bag bir dal
   olurdu ve agac okunmaz hale gelirdi, ya da akrabalik hic yazilamazdi. */
CREATE TABLE IF NOT EXISTS motto_nodes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user        TEXT NOT NULL DEFAULT 'ben',
  parent_id   INTEGER,                   -- NULL = kok dal
  title       TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  kind        TEXT NOT NULL DEFAULT 'dusunce',   -- dusunce | motto | ilke
  sort        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  archived_at TEXT
);
CREATE INDEX IF NOT EXISTS ix_motto_parent ON motto_nodes(user, parent_id, sort);
CREATE INDEX IF NOT EXISTS ix_motto_kind ON motto_nodes(user, kind, archived_at);

CREATE TABLE IF NOT EXISTS motto_versions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id     INTEGER NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  kind        TEXT NOT NULL,
  author      TEXT NOT NULL DEFAULT 'ben',   -- ben | uretilen
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_motto_ver ON motto_versions(node_id, id);

CREATE TABLE IF NOT EXISTS motto_links (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  a_id        INTEGER NOT NULL,
  b_id        INTEGER NOT NULL,
  note        TEXT,
  created_at  TEXT NOT NULL,
  UNIQUE(a_id, b_id)
);
CREATE INDEX IF NOT EXISTS ix_motto_link_a ON motto_links(a_id);
CREATE INDEX IF NOT EXISTS ix_motto_link_b ON motto_links(b_id);

CREATE TABLE IF NOT EXISTS motto_tags (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id     INTEGER NOT NULL,
  tag         TEXT NOT NULL,
  UNIQUE(node_id, tag)
);
CREATE INDEX IF NOT EXISTS ix_motto_tag ON motto_tags(tag);
"""


# Sema degisikligi: CREATE TABLE IF NOT EXISTS var olan bir tabloyu
# GUNCELLEMEZ. Yeni bir sutun eklendiginde eski veritabani sessizce eski
# semayla kalir ve ilk sorguda patlar. Tasima bu yuzden ACIK yazilir ve
# her acilista kosar: yoksa «calisiyor gorunen» bir surum, gercekte eski
# kaydi okuyamayan bir surumdur.
MIGRATIONS = [
    # (tablo, sutun, tanim)
    ("decisions", "key", "TEXT"),          # oncelik kurali kimligi
    ("decisions", "answered_at", "TEXT"),  # kabul/ret ne zaman verildi
    # Hangi gorevliyle konusuldugu: king, bio, academic, intellect.
    # Tek bir konusma akisi, dort ayri gorevlinin sozlerini birbirine
    # karistirirdi — ve «bunu kim soyledi» sorusu cevapsiz kalirdi.
    ("conversations", "agent", "TEXT"),
    ("attachments", "local_path", "TEXT"),
    ("attachments", "sha256", "TEXT"),
    ("attachments", "downloaded_at", "TEXT"),
    ("attachments", "analyzed_at", "TEXT"),
    ("attachments", "error", "TEXT"),
    # Hafiza katmani (soz / sohbet / cikarim) ve modulden gelen kaydin
    # kimligi — core/memory.py. Eski satirlarda katman bostur: onlar
    # yalniz acik komutla yazilabiliyordu, yani «senin sozun»dur.
    ("memories", "katman", "TEXT"),
    ("memories", "modul", "TEXT"),
    ("memories", "dis_id", "TEXT"),
    # BAM'a durum profiliyle is (King'in is emri): yapilandirilmis govde
    # ve isi acan emrin kimligi. Serbest cumleyle acilan islerde bostur.
    ("bam_isler", "govde", "TEXT"),
    ("bam_isler", "emir_id", "INTEGER"),
    # Depolama Burosu (core/depo.py): ayni konunun anahtari ve son
    # guncellik denetimi. Eski kayitlarda bostur; bos anahtar «eslesmez».
    ("bam_kayitlar", "anahtar", "TEXT"),
    ("bam_kayitlar", "denetim", "TEXT"),
    # Is emrinin geldigi kanal ve alici (Telegram sohbeti): sonuc AYNI
    # kanaldan teslim edilir. HKM ekranindan gelen emirde bostur.
    ("is_emirleri", "kanal", "TEXT"),
    ("is_emirleri", "hedef", "TEXT"),
    # Giden kutusunda belge satiri: {"kayit_id", "bicim"}. Bayt ambara
    # yazilmaz; gonderim aninda kayittan uretilir.
    ("outbox", "ek", "TEXT"),
]


def _migrate(con):
    uygulanan = []
    for tablo, sutun, tanim in MIGRATIONS:
        var = [r["name"] for r in con.execute("PRAGMA table_info(%s)" % tablo)]
        # Tablo YOKSA tasinacak bir sey de yoktur. Onceki hal burada
        # OperationalError ile cokuyordu: eksik bir tablo, tasimanin
        # tamamini durduruyor ve VAR OLAN tablolarin tasimasi da
        # yapilmiyordu.
        if not var:
            continue
        if sutun in var:
            continue
        con.execute("ALTER TABLE %s ADD COLUMN %s %s" % (tablo, sutun, tanim))
        uygulanan.append("%s.%s" % (tablo, sutun))
    if uygulanan:
        con.commit()
    return uygulanan


# Es zamanli yazma — «database is locked» ONLENIR.
#
# Daemon is parcacikli calisir ve her is parcaciginin kendi baglantisi var.
# Varsayilan SQLite kipinde (rollback journal) tek bir yazar butun
# okuyuculari kilitler: bir webhook cevabi yazilirken gelen bir modul
# senkronu «database is locked» ile DUSER. Bu, bir performans ayari degil
# bir DOGRULUK ayaridir — kaybolan yazma, olmamis bir olaydir.
#
#   WAL          okuyucu ile yazari birbirine engellemez
#   busy_timeout kilitli bir an icin BEKLER, hemen hata vermez
#   NORMAL       WAL ile birlikte guvenli; her yazmada diske fsync yapmaz
# Turkce kucultme — iki ayri tuzak birden.
#
# 1. SQLite'in `LOWER`i yalniz ASCII'yi kucultur: «Çalışmak» → «çalişmak».
#    Turkce harfler oldugu gibi kalir ve «çalışmak» arayan kullanici
#    kendi notunu bulamaz.
# 2. Python'un `.lower()`i de tek basina dogru degildir: «İ» kucultulunce
#    «i̇» olur (i + birlesen nokta) ve «i» ile eslesmez.
#
# Ikisi de ayni sonucu verir: kullanici aradigi seyi BULAMAZ ve sistem
# ona «boyle bir not yok» der. Olmayan bir seyi yok diye bildirmek
# dogrudur; VAR OLANI yok diye bildirmek degil.
_TR_KUCUK = str.maketrans({"I": "ı", "İ": "i", "Ş": "ş", "Ğ": "ğ",
                           "Ü": "ü", "Ö": "ö", "Ç": "ç"})


def tr_kucuk(s):
    if s is None:
        return None
    return str(s).translate(_TR_KUCUK).lower()


PRAGMALAR = (
    "PRAGMA journal_mode=WAL",
    "PRAGMA busy_timeout=5000",
    "PRAGMA synchronous=NORMAL",
)


def connect(path=None):
    p = path or DB_PATH
    if p != ":memory:":
        os.makedirs(os.path.dirname(p), exist_ok=True)
    # isolation_level=None: OTOMATIK COMMIT.
    #
    # Python'un varsayilaninda her INSERT/UPDATE sessizce bir islem acar ve
    # commit() cagrilana kadar YAZMA KILIDINI TUTAR. Bir yerde unutulan tek
    # bir commit, baska bir is parcaciginin yazmasini «database is locked»
    # ile dusurur — hem de bes saniye bekledikten sonra. Otomatik commit'te
    # kilit tek bir ifade boyunca yasar.
    #
    # Atomik olmasi gereken tek yer geri yuklemedir ve orada islem ACIKCA
    # baslatilir (BEGIN IMMEDIATE ... COMMIT). Ortuk bir guvence yerine
    # yazili bir guvence.
    con = sqlite3.connect(p, isolation_level=None)
    con.row_factory = sqlite3.Row
    # TURKCE KUCULTME — SQLite'in `LOWER`i yalniz ASCII'yi kucultur.
    # «Çalışmak» LOWER'dan «çalişmak» diye gecer ve «çalışmak» arayan
    # kullanici kendi notunu bulamaz. Python'un `.lower()`i de tek
    # basina yetmez: «İ» nokta birakir. Ikisi de `tr_kucuk` ile cozulur.
    con.create_function("tr_kucuk", 1, tr_kucuk)
    for pragma in PRAGMALAR:
        try:
            con.execute(pragma)
        except sqlite3.Error:
            # Bellek veritabani WAL kabul etmez; bu bir ariza degildir.
            pass
    con.executescript(SCHEMA)
    _migrate(con)
    return con


def insert_event(con, module, date, received_at, payload):
    cur = con.execute(
        "INSERT INTO raw_events(module, date, received_at, payload) VALUES (?,?,?,?)",
        (module, date, received_at, json.dumps(payload, ensure_ascii=False)),
    )
    con.commit()
    return cur.lastrowid


def insert_audit(con, event_id, vp, verdict, findings, created_at):
    cur = con.execute(
        "INSERT INTO audits(event_id, vp, verdict, findings, created_at) VALUES (?,?,?,?,?)",
        (event_id, vp, verdict, json.dumps(findings, ensure_ascii=False), created_at),
    )
    con.commit()
    return cur.lastrowid


def insert_decision(con, date, rank, proposal, created_at, audit_ids=(), key=None):
    cur = con.execute(
        "INSERT INTO decisions(date, rank, key, proposal, created_at) "
        "VALUES (?,?,?,?,?)",
        (date, rank, key, proposal, created_at),
    )
    did = cur.lastrowid
    for aid in audit_ids:
        con.execute(
            "INSERT OR IGNORE INTO decision_sources(decision_id, audit_id) VALUES (?,?)",
            (did, aid),
        )
    con.commit()
    return did


def current_decision(con, date):
    """Gunun gecerli karari: en son 'accepted' satir; yoksa None.

    Bir oneri reddedilmis olabilir — reddedilmis bir oneri gunun karari
    degildir, ama kaydi silinmez."""
    row = con.execute(
        "SELECT * FROM decisions WHERE date=? AND state='accepted' "
        "ORDER BY id DESC LIMIT 1", (date,)
    ).fetchone()
    return dict(row) if row else None


def set_decision_state(con, decision_id, state, answered_at=None):
    if state not in ("proposed", "accepted", "declined"):
        raise ValueError("gecersiz karar durumu: %r" % (state,))
    con.execute("UPDATE decisions SET state=?, answered_at=? WHERE id=?",
                (state, answered_at or datetime.datetime.now()
                 .isoformat(timespec="seconds"), decision_id))
    con.commit()


def sources_of(con, decision_id):
    rows = con.execute(
        "SELECT a.* FROM decision_sources ds JOIN audits a ON a.id = ds.audit_id "
        "WHERE ds.decision_id=? ORDER BY a.id", (decision_id,)
    ).fetchall()
    return [dict(r) for r in rows]


def events_between(con, start, end, module=None):
    """[start, end] araligindaki ham olaylar — eskiden yeniye.

    Ham olay SILINMEZ ve OZETLENMEZ: ikizin butun resmi buradan turetilir,
    turetilmis bir tablodan degil. Turetilmis tabloyu duzeltmek mumkun,
    kaybolan ham olayi geri getirmek degildir."""
    q = ("SELECT * FROM raw_events WHERE date BETWEEN ? AND ? "
         + ("AND module=? " if module else "")
         + "ORDER BY date, id")
    args = (start, end, module) if module else (start, end)
    rows = con.execute(q, args).fetchall()
    out = []
    for r in rows:
        d = dict(r)
        d["payload"] = json.loads(d["payload"])
        out.append(d)
    return out


def latest_payloads(con, date):
    """Gunun her modulu icin EN SON gonderilen govde.

    Brifing bunu kullanir: ayni gun iki kez gonderilen bir govdenin
    ikincisi birincisini gecersiz kilar, ama birincisi ambarda durur."""
    out = {}
    for e in events_between(con, date, date):
        out[e["module"]] = e["payload"]
    return out


def answered_decisions(con, states=("accepted", "declined")):
    """Cevaplanmis butun oneriler — etki olcumunun girdisi."""
    isaret = ",".join("?" * len(states))
    rows = con.execute(
        "SELECT * FROM decisions WHERE state IN (%s) ORDER BY date, id" % isaret,
        tuple(states)).fetchall()
    return [dict(r) for r in rows]


def decisions_of(con, date):
    """Gunun butun onerileri — reddedilenler dahil, eskiden yeniye.

    Reddedilen oneri silinmez: bir katmanin neyi onerdigi ve kullanicinin
    neyi reddettigi, sonradan o katmani denetlemenin tek yoludur."""
    rows = con.execute(
        "SELECT * FROM decisions WHERE date=? ORDER BY id", (date,)).fetchall()
    return [dict(r) for r in rows]


def open_decision(con, date, proposal):
    """Ayni gun ayni cumleyle duran, henuz reddedilmemis oneri."""
    row = con.execute(
        "SELECT * FROM decisions WHERE date=? AND proposal=? AND state<>'declined' "
        "ORDER BY id DESC LIMIT 1", (date, proposal)).fetchone()
    return dict(row) if row else None


def decision(con, decision_id):
    row = con.execute("SELECT * FROM decisions WHERE id=?", (decision_id,)).fetchone()
    return dict(row) if row else None


# Yedegin kapsami TEK YERDE tanimlanir. Once iki liste vardi — disa
# aktarma bes tablo yaziyor, geri yukleme yedi tablo kabul ediyordu — ve
# aradaki fark sessizdi: teklif ve gonderim kuyruklari yedege hic girmiyor,
# «yedek aldim» diyen kullanicinin islem durumu eksik kaliyordu.
BACKUP_TABLES = ("raw_events", "audits", "decisions", "decision_sources",
                 "conversations", "attachments", "memories", "intents", "outbox", "usage",
                 "inbox_seen", "bam_isler", "bam_kayitlar", "bam_iz",
                 "is_emirleri", "bildirimler", "hedef_ozet", "zaman_butcesi")
BACKUP_SCHEMA = 4


def export_all(con):
    """Butun ambar tek bir nesnede — yedegin ta kendisi.

    Turetilmis hicbir sey yazilmaz: raw_events zaten her seyin kaynagi;
    kararlar, konusmalar, teklifler ve gonderim gecmisi de kullanicinin
    kendi izidir.

    Manifesto (`__meta.tables`) hangi tablonun kac satirla cikitigini
    yazar: geri yuklemede «eksik geldi mi» sorusu ancak boyle
    cevaplanabilir."""
    out = {"__meta": {"app": "hkm", "schema": BACKUP_SCHEMA,
                      "exportedAt": datetime.datetime.now().isoformat(
                          timespec="seconds"),
                      "tables": {}}}
    for tablo in BACKUP_TABLES:
        rows = con.execute("SELECT * FROM %s ORDER BY rowid" % tablo).fetchall()
        out[tablo] = [dict(r) for r in rows]
        out["__meta"]["tables"][tablo] = len(out[tablo])
    return out


def prune_events(con, days, today=None):
    """Belirtilen gunden ESKI ham olaylari siler.

    Kararlar ve konusmalar SILINMEZ: onlar kullanicinin kendi izi ve
    HKM'nin kendi denetiminin tek kaynagi. Silinen sey yalniz olcum
    gecmisidir ve kac satirin silindigi geri bildirilir — «temizlendi»
    diyen ama sayi vermeyen bir islem, ne yaptigini gizler."""
    gun = int(days)
    if gun < 7:
        return {"ok": False, "error": "en az yedi gun saklanir"}
    t = datetime.date.fromisoformat(today or datetime.date.today().isoformat())
    sinir = (t - datetime.timedelta(days=gun)).isoformat()
    say = con.execute("SELECT COUNT(*) FROM raw_events WHERE date < ?",
                      (sinir,)).fetchone()[0]
    con.execute("DELETE FROM raw_events WHERE date < ?", (sinir,))
    con.commit()
    return {"ok": True, "deleted": say, "before": sinir, "kept_days": gun}


# --------------------------------------------------------- gelen mesajlar

INBOX_TUTMA_GUN = 30        # bundan eski kimlikler budanir


def seen_message(con, channel, msg_id, now=None):
    """Bu mesaj DAHA ONCE islendi mi.

    Gorulmemisse kaydeder ve False doner; gorulmusse hicbir sey yazmaz ve
    True doner. Kontrol ile kayit AYNI islemdedir: ikisini ayirmak, iki
    webhook'un ayni anda gelmesi halinde ikisinin de «yeni» gormesine yol
    acardi."""
    if not msg_id:
        # Kimliksiz mesaj tekrar korumasi ALAMAZ. Uydurulmus bir kimlik
        # (metnin ozeti gibi) ayni cumleyi iki kez yazan kullaniciyi
        # susturardi.
        return False
    now = now or datetime.datetime.now().isoformat(timespec="seconds")
    try:
        con.execute(
            "INSERT INTO inbox_seen(channel, msg_id, created_at) VALUES (?,?,?)",
            (channel, str(msg_id), now))
        con.commit()
        return False
    except sqlite3.IntegrityError:
        return True


def prune_inbox(con, days=INBOX_TUTMA_GUN, now=None):
    """Eski kimlikleri budar: saglayici bir mesaji haftalarca tekrar
    yollamaz, defterin sonsuza kadar buyumesi gereksizdir."""
    t = now or datetime.datetime.now()
    sinir = (t - datetime.timedelta(days=int(days))).isoformat(timespec="seconds")
    cur = con.execute("DELETE FROM inbox_seen WHERE created_at < ?", (sinir,))
    con.commit()
    return {"ok": True, "deleted": cur.rowcount, "before": sinir}


# ------------------------------------------------------------- niyetler

INTENT_STATES = ("pending", "delivered", "applied", "acknowledged",
                 "dismissed", "unknown")


def insert_intent(con, module, kind, payload, note, source, created_at=None):
    created_at = created_at or datetime.datetime.now().isoformat(timespec="seconds")
    cur = con.execute(
        "INSERT INTO intents(module, kind, payload, note, source, created_at) "
        "VALUES (?,?,?,?,?,?)",
        (module, kind, json.dumps(payload, ensure_ascii=False), note, source,
         created_at))
    con.commit()
    return cur.lastrowid


def intents_for(con, module, states=("pending",)):
    isaret = ",".join("?" * len(states))
    rows = con.execute(
        "SELECT * FROM intents WHERE module=? AND state IN (%s) ORDER BY id" % isaret,
        (module,) + tuple(states)).fetchall()
    out = []
    for r in rows:
        d = dict(r)
        d["payload"] = json.loads(d["payload"])
        out.append(d)
    return out


def intent(con, intent_id):
    row = con.execute("SELECT * FROM intents WHERE id=?", (intent_id,)).fetchone()
    if not row:
        return None
    d = dict(row)
    d["payload"] = json.loads(d["payload"])
    return d


def set_intent_state(con, intent_id, state, at=None):
    if state not in INTENT_STATES:
        raise ValueError("gecersiz niyet durumu: %r" % (state,))
    at = at or datetime.datetime.now().isoformat(timespec="seconds")
    alan = "delivered_at" if state == "delivered" else "answered_at"
    con.execute("UPDATE intents SET state=?, %s=? WHERE id=?" % alan,
                (state, at, intent_id))
    con.commit()
    return intent(con, intent_id)


# Kac kopya saklanir. Sinirsiz kopya, diski dolduran ve hicbiri
# bakilmayan bir yigindir; sifir kopya ise geri donusu olmayan bir islem.
KOPYA_SAKLA = 10


def kopya_kok(con):
    """Bu BAGLANTININ dosyasi hangi klasorde — modul sabitine sorulmaz.

    Yol once `DB_PATH`ten geliyordu ve bu sessizce yanlisti: daemon gercek
    yolu `config.json`daki `db_path`ten alip tasir (`daemon.py`), yani
    kullanici ambarini baska bir yere koyduysa kopyasi ambarinin yaninda
    DEGIL `HKM/db/` icinde birikiyordu. Ayni hata test kosumunda da
    yasandi: bellekteki bir veritabaninin kopyasi gercek `HKM/db/` icine
    dusuyor ve `KOPYA_SAKLA=10` halkasi kullanicinin GERCEK geri donus
    kopyasini disari itiyordu.

    Baglanti kendi dosyasini bilir; dogruyu ondan sormak, ayri bir kayit
    tutmaktan daha az yalan soyler. Bellekteki veritabaninda dosya yoktur
    ve `None` doner."""
    try:
        for _sira, ad, dosya in con.execute("PRAGMA database_list"):
            if ad == "main":
                return os.path.dirname(os.path.abspath(dosya)) if dosya else None
    except sqlite3.Error:
        return None
    return None


def snapshot_file(con, etiket="oncesi", sakla=KOPYA_SAKLA, kok=None):
    """Geri yukleme ONCESI kopya — geri donusu olan bir islem.

    SQLite'in kendi yedekleme API'si kullanilir: dosyayi kopyalamak,
    yazilmakta olan bir veritabaninda yarim kopya uretebilir.

    ONEMLI: bu cagri, cagiran baglantinin ACIK BIR YAZMA ISLEMI OLMADIGI
    anda yapilmalidir. Yedekleme API'si kaynagin kilidini bekler; kendi
    actigi kilidi bekleyen bir cagri sonsuza kadar kilitlenir.

    Kopya, baglantinin KENDI dosyasinin yanina yazilir (bkz. `kopya_kok`).
    Bellekteki bir veritabaninin dogal bir evi yoktur: sessizce baska
    birinin halkasina yazmaktansa HATA DONER. Iki cagiran da bu hatayi
    zaten yakaliyor (`import_all`, `schedule.maintenance`)."""
    kok = kok or kopya_kok(con)
    if not kok:
        raise ValueError(
            "kopya nereye yazilacagi bilinmiyor: baglanti bellekte "
            "(dosyasi yok). Acik bir hedef klasor ver ya da dosyaya bagli "
            "bir baglanti kullan.")
    os.makedirs(kok, exist_ok=True)
    damga = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    # Sira, dosya adinin sonuna gomulu nanosaniyeden gelir — dosya
    # sisteminin mtime cozunurlugune guvenmez. Bazi dosya sistemleri
    # (FAT/exFAT, HFS+, bazi NFS/konteyner katmanlari) mtime'i 1 saniyeye
    # yuvarlar; o cozunurlukte ayni saniyede alinan kopyalar ayirt
    # edilemez, siralama os.listdir()'in keyfi sirasina duser ve EN YENI
    # kopya silinebilirdi — geri donus kopyasinin tam ihanet ettigi an.
    sira = time.time_ns()
    yol = os.path.join(kok, "hkm-%s-%s-%d.db" % (etiket, damga, sira))
    while os.path.exists(yol):
        sira += 1
        yol = os.path.join(kok, "hkm-%s-%s-%d.db" % (etiket, damga, sira))
    hedef = sqlite3.connect(yol)
    try:
        con.backup(hedef)
    finally:
        hedef.close()
    _kopya_donusu(kok, etiket, sakla)
    return yol


# Nanosaniye damgasi bu tarihlerde hep 19 hanelidir; eski bicimli (damga
# yalniz saniye + kucuk bir cakisma soneki tasiyan) kopyalarda kuyruk kisa
# kalir ve bu esik onlari yanlislikla nanosaniye sanmaz.
_NANO_HANE_ASGARI = 15


def _kopya_sira_anahtari(kok, ad):
    """Dosya adindaki sira numarasini kullanir — mtime'a degil.

    Yeni kopyalar adin sonunda kendi sirasini tasir (bkz. snapshot_file);
    o deger dosya sisteminin ne kadar hassas mtime tuttugundan bagimsizdir.
    Bu fonksiyon yazilmadan ONCE alinmis eski bicimli kopyalar icin
    (sirasi adinda olmayanlar) mtime'a duser — geriye donuk uyumluluk."""
    govde = ad[:-3] if ad.endswith(".db") else ad
    kuyruk = govde.rsplit("-", 1)[-1]
    if kuyruk.isdigit() and len(kuyruk) >= _NANO_HANE_ASGARI:
        return int(kuyruk)
    try:
        return int(os.path.getmtime(os.path.join(kok, ad)) * 1e9)
    except OSError:
        return 0


def _kopya_donusu(kok, etiket, sakla):
    """Eski kopyalari siler. Once hicbiri silinmiyordu: her geri yukleme
    bir dosya birakiyor ve dizin sessizce buyuyordu — dokuz aylik ufuk
    disiplinini kiran sey veritabani degil, yaninda biriken kopyalardi."""
    if not sakla or sakla < 1:
        return []
    try:
        adlar = [a for a in os.listdir(kok)
                 if a.startswith("hkm-%s-" % etiket) and a.endswith(".db")]
        adlar.sort(key=lambda a: _kopya_sira_anahtari(kok, a))
    except OSError:
        return []
    silinen = []
    for a in adlar[:-int(sakla)]:
        try:
            os.remove(os.path.join(kok, a))
            silinen.append(a)
        except OSError:
            pass
    return silinen


def import_all(con, veri, replace=False):
    """Yedegi geri yukler.

    Iki kural:

    1. USTUNE YAZMAK ACIK BIR KARARDIR. `replace` verilmedikce var olan
       ambara dokunulmaz: bir geri yukleme, sessizce silinmis bir gecmis
       olamaz.
    2. TANIMADIGI TABLOYA DOKUNMAZ. Yedekteki bilinmeyen anahtarlar
       ATLANIR ve kac satirin atlandigi geri bildirilir; sessizce
       yutulan bir alan, eksik geri yuklenmis bir ambardir."""
    if not isinstance(veri, dict) or "__meta" not in veri:
        return {"ok": False, "error": "Bu dosya bir HKM yedegi degil."}
    meta = veri.get("__meta") or {}
    if meta.get("app") != "hkm":
        return {"ok": False, "error": "Bu yedek baska bir uygulamadan."}
    if int(meta.get("schema") or 0) > BACKUP_SCHEMA:
        return {"ok": False,
                "error": "Bu yedek daha yeni bir surumle alinmis (sema %s)."
                         % meta.get("schema")}

    tablolar = BACKUP_TABLES
    # Cakisma kontrolu BUTUN tablolara bakar. Once yalniz raw_events
    # sayiliyordu: ham olay yokken var olan bir teklif, replace=False
    # olmasina ragmen INSERT OR REPLACE ile sessizce eziliyordu.
    dolu = {}
    for t in tablolar:
        n = con.execute("SELECT COUNT(*) FROM %s" % t).fetchone()[0]
        if n:
            dolu[t] = n
    if dolu and not replace:
        return {"ok": False,
                "error": "Ambar bos degil (%s). Ustune yazmak icin replace "
                         "istenir." % ", ".join("%s: %d" % (k, v)
                                                for k, v in sorted(dolu.items())),
                "existing": dolu}

    atlanan = [k for k in veri
               if k != "__meta" and k not in tablolar]

    # Manifesto varsa DOGRULANIR: dosyada yazan satir sayisi ile gercek
    # satir sayisi ayrisiyorsa yedek eksik ya da bozuktur.
    beyan = (meta.get("tables") or {})
    uyusmaz = []
    for t, n in beyan.items():
        gercek = len(veri.get(t) or [])
        if gercek != n:
            uyusmaz.append("%s: beyan %d, gelen %d" % (t, n, gercek))
    if uyusmaz:
        return {"ok": False, "error": "Yedek manifestosu tutmuyor — "
                                      + "; ".join(uyusmaz)}

    yazilan = {}
    kopya = None
    # Ustune yazmadan ONCE geri donus kopyasi: «geri alinamaz» bir islem,
    # geri alinabilir hale gelmelidir. Kopya ISLEMIN DISINDA alinir; iceride
    # alinirsa iki sey birden bozulur: kopya zaten degistirilmis bir ambari
    # gosterir, ve SQLite'in yedekleme API'si kendi baglantisinin actigi
    # yazma kilidini beklerken SONSUZA KADAR KILITLENIR.
    if replace:
        try:
            kopya = snapshot_file(con)
        except (sqlite3.Error, OSError, ValueError):
            # ValueError: baglanti bellekte, kopyanin dogal bir evi yok
            # (bkz. `kopya_kok`). Geri yukleme bu yuzden DURMAZ — kopya
            # bir nezakettir, sarti degil; ama alinmadigi `rollback_copy`
            # bos donerek SOYLENIR.
            kopya = None
    try:
        # Geri yukleme YA TAMAMEN OLUR YA HIC: yarim yazilmis bir ambar,
        # bozuk bir ambardir. Otomatik commit kipinde bu guvence ortuk
        # degildir, ACIKCA istenir.
        con.execute("BEGIN IMMEDIATE")
        if replace:
            for t in tablolar:
                con.execute("DELETE FROM %s" % t)
        for t in tablolar:
            satirlar = veri.get(t) or []
            if not satirlar:
                continue
            sutunlar = [r["name"] for r in con.execute("PRAGMA table_info(%s)" % t)]
            kullanilan = [c for c in sutunlar if c in satirlar[0]]
            if not kullanilan:
                continue
            isaret = ",".join("?" * len(kullanilan))
            # INSERT OR REPLACE DEGIL: replace=False durumunda var olan bir
            # kaydin ustune yazmak, «ustune yazmiyorum» sozunu icten kirar.
            # replace=True zaten tablolari bosaltti; catisma kalirsa bu bir
            # yedek butunlugu sorunudur ve gorunur olmalidir.
            con.executemany(
                "INSERT INTO %s(%s) VALUES (%s)"
                % (t, ",".join(kullanilan), isaret),
                [tuple(r.get(c) for c in kullanilan) for r in satirlar])
            yazilan[t] = len(satirlar)
        con.execute("COMMIT")
    except sqlite3.Error as e:
        try:
            con.execute("ROLLBACK")
        except sqlite3.Error:
            pass
        return {"ok": False, "error": "Geri yukleme yarida kesildi: %s" % e}
    return {"ok": True, "written": yazilan, "skipped": atlanan,
            "replaced": bool(replace), "rollback_copy": kopya,
            "note": ("Üstüne yazıldı; öncesinin kopyası: %s" % kopya)
                    if kopya else None}
