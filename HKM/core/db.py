"""SQLite semasi ve erisim — spec'ten uc yerde bilerek ayrilir (MIMARI.md §6).

1. decisions.date UNIQUE kalkti: bir gun icinde
   proposed -> declined -> yeni oneri zinciri mumkun olmali.
2. decision_sources ara tablosu eklendi: karar tasiyan bir katman neyi
   tasidiginin izini birakmazsa karar sonradan gerekcelendirilemez.
3. Dogrulama metni yeniden yazmaz; reddeder (sync_engine).
"""

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
  proposal   TEXT NOT NULL,              -- oneri cumlesi (emir degil)
  state      TEXT NOT NULL DEFAULT 'proposed',  -- proposed|accepted|declined
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_decisions_date ON decisions(date);

CREATE TABLE IF NOT EXISTS decision_sources (
  decision_id INTEGER NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  audit_id    INTEGER NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  PRIMARY KEY (decision_id, audit_id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  channel       TEXT NOT NULL,           -- local | telegram | whatsapp
  role          TEXT NOT NULL,           -- user | manager
  text          TEXT NOT NULL,
  audio_retained INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);
"""


def connect(path=None):
    p = path or DB_PATH
    if p != ":memory:":
        os.makedirs(os.path.dirname(p), exist_ok=True)
    con = sqlite3.connect(p)
    con.row_factory = sqlite3.Row
    con.executescript(SCHEMA)
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


def insert_decision(con, date, rank, proposal, created_at, audit_ids=()):
    cur = con.execute(
        "INSERT INTO decisions(date, rank, proposal, created_at) VALUES (?,?,?,?)",
        (date, rank, proposal, created_at),
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


def set_decision_state(con, decision_id, state):
    if state not in ("proposed", "accepted", "declined"):
        raise ValueError("gecersiz karar durumu: %r" % (state,))
    con.execute("UPDATE decisions SET state=? WHERE id=?", (state, decision_id))
    con.commit()


def sources_of(con, decision_id):
    rows = con.execute(
        "SELECT a.* FROM decision_sources ds JOIN audits a ON a.id = ds.audit_id "
        "WHERE ds.decision_id=? ORDER BY a.id", (decision_id,)
    ).fetchall()
    return [dict(r) for r in rows]
