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

   Durum: pending → delivered → applied | dismissed
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

CREATE TABLE IF NOT EXISTS conversations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  channel       TEXT NOT NULL,           -- local | telegram | whatsapp
  role          TEXT NOT NULL,           -- user | manager
  text          TEXT NOT NULL,
  audio_retained INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);
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
]


def _migrate(con):
    uygulanan = []
    for tablo, sutun, tanim in MIGRATIONS:
        var = [r["name"] for r in con.execute("PRAGMA table_info(%s)" % tablo)]
        if sutun in var:
            continue
        con.execute("ALTER TABLE %s ADD COLUMN %s %s" % (tablo, sutun, tanim))
        uygulanan.append("%s.%s" % (tablo, sutun))
    if uygulanan:
        con.commit()
    return uygulanan


def connect(path=None):
    p = path or DB_PATH
    if p != ":memory:":
        os.makedirs(os.path.dirname(p), exist_ok=True)
    con = sqlite3.connect(p)
    con.row_factory = sqlite3.Row
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


def export_all(con):
    """Butun ambar tek bir nesnede — yedegin ta kendisi.

    Turetilmis hicbir sey yazilmaz: raw_events zaten her seyin kaynagi,
    kararlar ve konusmalar da kullanicinin kendi izidir."""
    out = {"__meta": {"app": "hkm", "schema": 1,
                      "exportedAt": datetime.datetime.now().isoformat(
                          timespec="seconds")}}
    for tablo in ("raw_events", "audits", "decisions", "decision_sources",
                  "conversations"):
        rows = con.execute("SELECT * FROM %s ORDER BY rowid" % tablo).fetchall()
        out[tablo] = [dict(r) for r in rows]
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


# ------------------------------------------------------------- niyetler

INTENT_STATES = ("pending", "delivered", "applied", "dismissed")


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
