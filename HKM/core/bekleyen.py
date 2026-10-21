# -*- coding: utf-8 -*-
"""King'in bekleyen mesaji — tetiklenen beceri ya da vadesi gelen söz
module nasil ulasir (King 3.0, K2).

   Uc yol, ayni satirdan:
     1. king_bekleyen satiri: modul King'i acinca alir (GET /api/king/bekleyen,
        core/beceri.py `uc`). Alinan satir bir daha verilmez (kutu gibi).
     2. Konusma akisi (conversations): mesaj King'in akisinda da durur;
        modul kapaliyken bile «King ne dedi» kaybolmaz.
     3. Metin kanali (Telegram/WhatsApp): beceri ya da söz o kanaldan
        geldiyse giden kutusuna (core/outbox.py) girer; sessiz saat ve gunluk
        sinir orada uygulanir (core/bildirim.py).

   Soru ise cevap yazilir: modulun ilk mesaji (12 saat icinde) o sorunun
   cevabi sayilir ve sahibine (söz) baglanir. Cevapta sayi varsa ham satir
   modulun kutusuna (core/kutu.py) birakilir: modul kendi ayristiricisiyla
   onizler, kullanici onaylarsa KENDI koduyla yazar. HKM yazmaz."""
import datetime
import json
import re
import types

from core import kutu, patron

CEVAP_SURESI = datetime.timedelta(hours=12)
EN_COK_ALIS = 20
METIN_KANALI = ("telegram", "whatsapp")


def _simdi(now=None):
    return now or datetime.datetime.now().isoformat(timespec="seconds")


def _satir(r):
    d = dict(r)
    try:
        d["eylemler"] = json.loads(d.get("eylemler") or "[]")
    except ValueError:
        d["eylemler"] = []
    d["soru"] = bool(d.get("soru"))
    return d


def teslim(con, tur, kaynak_id, metin, modul=None, kanal="local", hedef=None, eylemler=None,
           soru=False, now=None, dogrudan=False):
    """Bekleyen mesaji birakir; konusma akisina ve (varsa) metin kanalina
    yazar. `dogrudan`: mesaj zaten sohbet cevabinda gidiyor (söz tetigi);
    satir yalniz cevabi baglamak icin «alindi» dogar. Doner: satir."""
    now = _simdi(now)
    metin = " ".join(str(metin or "").split())[:600]
    cur = con.execute(
        "INSERT INTO king_bekleyen(modul, kanal, tur, kaynak_id, metin, soru, eylemler, created_at, alindi_at) "
        "VALUES (?,?,?,?,?,?,?,?,?)",
        (modul, kanal or "local", tur, int(kaynak_id), metin, 1 if soru else 0,
         json.dumps(eylemler or [], ensure_ascii=False), now, now if dogrudan else None))
    con.commit()
    bid = cur.lastrowid
    if metin and not dogrudan:
        patron.log(con, kanal or "local", "manager", metin, now=now, agent="king")
        if kanal in METIN_KANALI:
            from core import outbox
            outbox.enqueue(con, kanal, "king:%s:%d:%d" % (tur, int(kaynak_id), bid), now[:10],
                           metin, target=hedef or None)
            # Metin kanalinda «alindi» gonderimdir; cevap o kanaldan gelir.
            con.execute("UPDATE king_bekleyen SET alindi_at=? WHERE id=?", (now, bid))
            con.commit()
    return _satir(con.execute("SELECT * FROM king_bekleyen WHERE id=?", (bid,)).fetchone())


def al(con, modul, now=None):
    """Modulun bekleyen mesajlari (kendi + modulsuz). Alinan isaretlenir."""
    now = _simdi(now)
    rows = con.execute(
        "SELECT * FROM king_bekleyen WHERE alindi_at IS NULL AND kanal='local' "
        "AND (modul=? OR modul IS NULL) ORDER BY id LIMIT ?", (modul, EN_COK_ALIS)).fetchall()
    if rows:
        con.executemany("UPDATE king_bekleyen SET alindi_at=? WHERE id=?", [(now, r["id"]) for r in rows])
        con.commit()
    return [_satir(dict(r, alindi_at=now)) for r in rows]


def sayi(con, modul):
    return con.execute("SELECT COUNT(*) FROM king_bekleyen WHERE alindi_at IS NULL AND kanal='local' "
                       "AND (modul=? OR modul IS NULL)", (modul,)).fetchone()[0]


def acik_soru(con, kanal="local", modul=None, now=None):
    """Cevap bekleyen, kullaniciya ulasmis en son soru ya da None."""
    sinir = (datetime.datetime.fromisoformat(_simdi(now)) - CEVAP_SURESI).isoformat(timespec="seconds")
    r = con.execute(
        "SELECT * FROM king_bekleyen WHERE soru=1 AND cevap IS NULL AND alindi_at IS NOT NULL "
        "AND alindi_at>=? AND kanal=? AND (modul IS NULL OR ? IS NULL OR modul=?) "
        "ORDER BY id DESC LIMIT 1", (sinir, kanal or "local", modul, modul)).fetchone()
    return _satir(r) if r else None


def geri_al(con, kanal="local", bid=None, now=None):
    """«O cevap değil»: son bir saatte yazilan cevap (ya da `bid`) silinir,
    söz yeniden «soruldu» olur. Doner: satir ya da None."""
    if bid is None:
        sinir = (datetime.datetime.fromisoformat(_simdi(now)) - datetime.timedelta(hours=1)).isoformat(
            timespec="seconds")
        r = con.execute("SELECT * FROM king_bekleyen WHERE cevap IS NOT NULL AND cevap_at>=? AND kanal=? "
                        "ORDER BY cevap_at DESC, id DESC LIMIT 1", (sinir, kanal or "local")).fetchone()
    else:
        r = con.execute("SELECT * FROM king_bekleyen WHERE id=? AND cevap IS NOT NULL", (bid,)).fetchone()
    if not r:
        return None
    con.execute("UPDATE king_bekleyen SET cevap=NULL, cevap_at=NULL WHERE id=?", (r["id"],))
    if r["tur"] == "soz":
        con.execute("UPDATE king_sozler SET durum='soruldu', cevap=NULL, kapandi_at=NULL, updated_at=? "
                    "WHERE id=? AND durum='kapandi'", (_simdi(now), r["kaynak_id"]))
    con.commit()
    return _satir(r)


def _kutu_sunucusu(con):
    """kutu.py sunucu nesnesi ister (db yolu). Bellek ici ambar kutuya yazmaz."""
    try:
        yol = con.execute("PRAGMA database_list").fetchone()[2]
    except Exception:                           # noqa: BLE001
        yol = ""
    return types.SimpleNamespace(db_path=yol) if yol else None


def cevap_yakala(con, metin, kanal="local", modul=None, now=None):
    """Kullanicinin mesaji acik bir sorunun cevabi mi? Oyleyse yazar.
    Doner: {soru, cevap, kutuya, soz_id} ya da None."""
    m = " ".join(str(metin or "").split())
    if not m or len(m) > 400 or m.endswith("?"):
        return None
    s = acik_soru(con, kanal, modul, now)
    if not s:
        return None
    now = _simdi(now)
    con.execute("UPDATE king_bekleyen SET cevap=?, cevap_at=? WHERE id=?", (m, now, s["id"]))
    con.commit()
    out = {"soru": s["metin"], "cevap": m, "kutuya": None, "soz_id": None, "bekleyen_id": s["id"]}
    hedef_modul = s.get("modul") or modul
    if s["tur"] == "soz":
        from core import soz
        z = soz.kapat(con, s["kaynak_id"], m, now=now)
        out["soz_id"] = s["kaynak_id"]
        hedef_modul = hedef_modul or (z or {}).get("modul")
    if re.search(r"\d", m) and hedef_modul in kutu.MODULLER:
        srv = _kutu_sunucusu(con)
        if srv and kutu.ekle(srv, hedef_modul, m, kaynak=modul)["ok"]:
            out["kutuya"] = hedef_modul
    return out
