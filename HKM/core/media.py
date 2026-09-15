# -*- coding: utf-8 -*-
"""Telegram eklerini kanal isteğini bekletmeden güvenli yerel ambara indirir."""
import datetime
import hashlib
import json
import os
import urllib.parse
import urllib.request

from core import channels

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA_ROOT = os.path.join(ROOT, "db", "media")
TIMEOUT = 20
DEFAULTS = {"enabled": True, "max_photo_mb": 12, "max_audio_mb": 30,
            "max_video_mb": 80, "max_document_mb": 30, "keep_days": 30}
KINDS = {"photo", "voice", "audio", "video", "document"}


def settings(cfg):
    out = dict(DEFAULTS)
    gelen = (cfg or {}).get("media")
    if isinstance(gelen, dict):
        out.update({k: v for k, v in gelen.items() if k in out})
    return out


def validate(patch):
    if not isinstance(patch, dict):
        return False, ["media bir nesne olmalı"]
    hata = []
    for k, v in patch.items():
        if k not in DEFAULTS:
            hata.append("bilinmeyen media alanı: %s" % k)
        elif k == "enabled" and not isinstance(v, bool):
            hata.append("media.enabled bir bool olmalı")
        elif k != "enabled" and (isinstance(v, bool) or not isinstance(v, int)
                                  or not 1 <= v <= 3650):
            hata.append("media.%s geçerli bir tam sayı olmalı" % k)
    return not hata, hata


def _limit(a, kind):
    grup = "audio" if kind in ("voice", "audio") else kind
    return int(a.get("max_%s_mb" % grup, 1)) * 1024 * 1024


def _get_json(url):
    with urllib.request.urlopen(url, timeout=TIMEOUT) as r:
        return json.loads(r.read().decode("utf-8", "replace") or "{}")


def _get_bytes(url, limit):
    with urllib.request.urlopen(url, timeout=TIMEOUT) as r:
        uzunluk = r.headers.get("Content-Length")
        if uzunluk and int(uzunluk) > limit:
            raise ValueError("too-large")
        veri = r.read(limit + 1)
    if len(veri) > limit:
        raise ValueError("too-large")
    return veri


def process_next(con, cfg, transport=None, root=None, now=None):
    """Bekleyen tek eki işler; bütün hataları kalıcı bir duruma çevirir."""
    a = settings(cfg)
    if not a["enabled"]:
        return {"ok": False, "reason": "off"}
    row = con.execute("SELECT * FROM attachments WHERE state='received' "
                      "ORDER BY id LIMIT 1").fetchone()
    if not row:
        return {"ok": True, "processed": 0}
    d = dict(row)
    limit = _limit(a, d["kind"])
    if d["kind"] not in KINDS:
        return _fail(con, d["id"], "rejected", "Desteklenmeyen dosya türü.", "kind")
    if d.get("size") is not None and d["size"] > limit:
        return _fail(con, d["id"], "rejected", "Dosya boyut sınırını aşıyor.",
                     "too-large")
    tg = channels.settings(cfg, "telegram")
    token = tg.get("bot_token") or ""
    if not token:
        return {"ok": False, "reason": "no-token", "id": d["id"]}
    get_json, get_bytes = transport or (_get_json, _get_bytes)
    try:
        base = tg.get("api_base", "https://api.telegram.org").rstrip("/")
        meta = get_json("%s/bot%s/getFile?%s" % (
            base, token, urllib.parse.urlencode({"file_id": d["file_id"]})))
        file_path = ((meta.get("result") or {}).get("file_path") or "")
        if not meta.get("ok") or not file_path or ".." in file_path:
            raise ValueError("get-file")
        veri = get_bytes("%s/file/bot%s/%s" % (base, token, file_path), limit)
        digest = hashlib.sha256(veri).hexdigest()
        kok = root or MEDIA_ROOT
        os.makedirs(kok, exist_ok=True)
        hedef = os.path.join(kok, digest + os.path.splitext(file_path)[1][:12])
        if not os.path.exists(hedef):
            gecici = hedef + ".yeni"
            with open(gecici, "wb") as f:
                f.write(veri)
            os.replace(gecici, hedef)
        at = now or datetime.datetime.now().isoformat(timespec="seconds")
        con.execute("UPDATE attachments SET state='ready',local_path=?,sha256=?,"
                    "downloaded_at=?,error=NULL WHERE id=?", (hedef, digest, at, d["id"]))
        return {"ok": True, "processed": 1, "id": d["id"], "state": "ready",
                "bytes": len(veri), "sha256": digest}
    except ValueError as e:
        sebep = "too-large" if str(e) == "too-large" else "provider"
    except Exception as e:  # noqa: BLE001
        sebep = type(e).__name__
    return _fail(con, d["id"], "failed", "Dosya indirilemedi: %s" % sebep, sebep)


def _fail(con, id_, state, note, reason):
    con.execute("UPDATE attachments SET state=?,error=? WHERE id=?", (state, note, id_))
    return {"ok": False, "reason": reason, "id": id_}


def prune(con, cfg, today=None):
    """Süresi dolan ham dosyayı siler; kayıt ve analiz izi kalır."""
    gun = today or datetime.date.today()
    sinir = (gun - datetime.timedelta(days=settings(cfg)["keep_days"])).isoformat()
    rows = con.execute("SELECT id,local_path FROM attachments WHERE local_path IS NOT NULL "
                       "AND substr(downloaded_at,1,10) < ?", (sinir,)).fetchall()
    silinen = 0
    for r in rows:
        try:
            if os.path.exists(r["local_path"]): os.remove(r["local_path"])
        except OSError:
            continue
        con.execute("UPDATE attachments SET local_path=NULL,state='deleted' WHERE id=?",
                    (r["id"],))
        silinen += 1
    return {"ok": True, "deleted": silinen, "before": sinir}
