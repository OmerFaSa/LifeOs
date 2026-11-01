# -*- coding: utf-8 -*-
"""EYLEM DEFTERI — King'in yazdigi her isin kaydi ve geri alinmasi (KING-4 A4,
2026-11-01; olcu: «yazan eylemlerin %100'u geri alinabiliyor»).

   Iki tur yazma vardir:

   1. HKM'NIN KENDI YAZMASI (para kaydi, soz). Yazan kod deftere satiri
      kendisi birakir; `geri` HKM'nin calistiracagi isleyicidir
      ({"hkm": "para", "grup": ...}). Geri alma burada uygulanir.
   2. MODULUN YAZMASI (arac katalogundaki «yaz» araclari). HKM modullere
      yazmaz (AGENTS §1.4): istemci onaylanmis araci uygular, sonra
      POST /api/eylem ile tersini ({"istemci": {"ad", "param"}}) birakir.
      Geri almada HKM satiri isaretler ve tersini istemciye dondurur;
      tersini modul calistirir.

   Ters islemi olmayan yazma `geri` NULL birakir; zaman cizgisinde «geri
   alinamaz» diye gorunur (sessiz bir «geri alindi» yoktur)."""
import datetime
import json

from core import para, soz

EN_COK_PARAM = 2000
EN_COK_OZET = 200
EN_COK_LISTE = 200


def _simdi(now=None):
    return (now or datetime.datetime.now()).isoformat(timespec="seconds")


def _json(x):
    return json.dumps(x, ensure_ascii=False, sort_keys=True) if x is not None else None


def _satir(r):
    d = dict(r)
    for k in ("param", "geri"):
        d[k] = json.loads(d[k]) if d.get(k) else None
    d["geri_alinabilir"] = bool(d["geri"]) and d["durum"] == "uygulandi"
    return d


def kaydet(con, arac, ozet, geri=None, param=None, kaynak="king", kanal="local", modul=None, now=None):
    cur = con.execute(
        "INSERT INTO eylem(created_at, kaynak, kanal, modul, arac, param, ozet, geri) VALUES (?,?,?,?,?,?,?,?)",
        (_simdi(now), kaynak, kanal or "local", modul, str(arac)[:60], (_json(param) or "")[:EN_COK_PARAM] or None,
         str(ozet)[:EN_COK_OZET], _json(geri)))
    con.commit()
    return cur.lastrowid


def istemciden(con, govde, now=None):
    """POST /api/eylem: modulun uyguladigi yazma. (id, hata)."""
    g = govde if isinstance(govde, dict) else {}
    arac, ozet = str(g.get("arac") or "").strip(), str(g.get("ozet") or "").strip()
    if not arac or not ozet:
        return None, "arac ve ozet gerekli"
    ters = g.get("geri")
    if ters is not None and not (isinstance(ters, dict) and isinstance(ters.get("ad"), str) and ters["ad"]
                                 and isinstance(ters.get("param", {}), dict)):
        return None, "geri {ad, param} olmalı"
    if len(_json(ters) or "") > EN_COK_PARAM:
        return None, "geri çok uzun"
    geri = {"istemci": {"ad": ters["ad"], "param": ters.get("param") or {}}} if ters else None
    modul = g.get("modul") if g.get("modul") in ("ays", "spi", "esp") else None
    return kaydet(con, arac, ozet, geri, g.get("param") if isinstance(g.get("param"), dict) else None,
                  kaynak="istemci", kanal=str(g.get("kanal") or "local")[:20], modul=modul, now=now), None


def listele(con, limit=50):
    n = max(1, min(int(limit or 50), EN_COK_LISTE))
    return [_satir(r) for r in con.execute("SELECT * FROM eylem ORDER BY id DESC LIMIT ?", (n,))]


def _para(con, g):
    cur = con.execute("UPDATE para SET silindi=1 WHERE grup=? AND silindi=0", (g.get("grup"),))
    con.commit()
    return cur.rowcount > 0


def _soz(con, g):
    return soz.sil(con, g.get("id"))["ok"]


HKM_GERI = {"para": _para, "soz": _soz}


def geri_al(con, eid, now=None):
    """{ok, eylem, istemci?} ya da {ok:False, note}. Istemci turunde tersi doner."""
    r = con.execute("SELECT * FROM eylem WHERE id=?", (eid,)).fetchone()
    if not r:
        return {"ok": False, "note": "Böyle bir eylem yok."}
    e = _satir(r)
    if e["durum"] != "uygulandi":
        return {"ok": False, "note": "Bu eylem zaten geri alındı."}
    if not e["geri"]:
        return {"ok": False, "note": "Bu eylemin geri alma yolu yok."}
    istemci = e["geri"].get("istemci")
    if not istemci:
        isle = HKM_GERI.get(e["geri"].get("hkm"))
        if not isle or not isle(con, e["geri"]):
            return {"ok": False, "note": "Geri alınamadı: kayıt artık yok."}
    con.execute("UPDATE eylem SET durum='geri_alindi', geri_at=? WHERE id=?", (_simdi(now), eid))
    con.commit()
    out = {"ok": True, "eylem": _satir(con.execute("SELECT * FROM eylem WHERE id=?", (eid,)).fetchone())}
    if istemci:
        out["istemci"] = istemci
    return out


def para_yazildi(con, sonuc, kanal, metin):
    """sohbet'in para kaydi deftere (kural 1)."""
    if sonuc and sonuc.get("ok") and sonuc.get("ids"):
        kaydet(con, "para.yaz", "Para kaydı: %s" % str(metin or "")[:120],
               {"hkm": "para", "grup": sonuc["grup"]}, kanal=kanal)


def soz_yazildi(con, s, kanal, modul=None):
    if s and s.get("soz"):
        kaydet(con, "soz.ekle", "Söz: %s" % str(s["soz"].get("soru") or "")[:120],
               {"hkm": "soz", "id": s["soz"]["id"]}, kanal=kanal, modul=modul)
