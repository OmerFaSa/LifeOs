# -*- coding: utf-8 -*-
"""Kullanıcı onaylı hafıza — model kendiliğinden kalıcı kayıt yazamaz."""
import datetime

SCOPES = {"all", "king", "ays", "spi", "esp"}
MAX_TEXT = 600


def add(con, text, user="ben", scope="all", source="explicit", expires=None,
        now=None):
    metin = str(text or "").strip()
    if not metin:
        return {"ok": False, "reason": "empty", "note": "Hatırlanacak bilgi boş."}
    if len(metin) > MAX_TEXT:
        return {"ok": False, "reason": "long", "note": "Hafıza kaydı fazla uzun."}
    if scope not in SCOPES:
        return {"ok": False, "reason": "scope", "note": "Bilinmeyen hafıza kapsamı."}
    at = now or datetime.datetime.now().isoformat(timespec="seconds")
    cur = con.execute("INSERT INTO memories(user,scope,text,source,state,created_at,"
                      "expires_at) VALUES (?,?,?,?, 'active',?,?)",
                      (user, scope, metin, source, at, expires))
    return {"ok": True, "id": cur.lastrowid, "text": metin, "scope": scope}


def list_active(con, user="ben", scope=None, now=None, limit=50):
    at = now or datetime.datetime.now().isoformat(timespec="seconds")
    args = [user, at]
    q = ("SELECT id,scope,text,source,created_at,expires_at,last_used_at FROM memories "
         "WHERE user=? AND state='active' AND (expires_at IS NULL OR expires_at>?)")
    if scope:
        q += " AND scope IN ('all',?)"
        args.append(scope)
    q += " ORDER BY id DESC LIMIT ?"
    args.append(max(1, min(int(limit), 200)))
    return [dict(r) for r in con.execute(q, args).fetchall()]


def forget(con, id_, user="ben", now=None):
    at = now or datetime.datetime.now().isoformat(timespec="seconds")
    cur = con.execute("UPDATE memories SET state='forgotten',forgotten_at=? "
                      "WHERE id=? AND user=? AND state='active'", (at, int(id_), user))
    return {"ok": cur.rowcount == 1, "id": int(id_),
            "note": "Hafıza silindi." if cur.rowcount else "Etkin hafıza bulunamadı."}


def context(con, user="ben", scope="king", limit=12):
    rows = list_active(con, user, scope, limit=limit)
    if not rows:
        return ""
    ids = [r["id"] for r in rows]
    con.execute("UPDATE memories SET last_used_at=? WHERE id IN (%s)" %
                ",".join("?" * len(ids)),
                (datetime.datetime.now().isoformat(timespec="seconds"),) + tuple(ids))
    return "\n".join("- [hafıza #%d] %s" % (r["id"], r["text"])
                     for r in reversed(rows))


def command(con, text, user="ben"):
    """Yalnız açık hafıza komutlarını işler; serbest cümleyi tahmin etmez."""
    ham = str(text or "").strip()
    kucuk = ham.lower().replace("i̇", "i")
    for onek in ("bunu hatırla:", "hatırla:", "bunu hatirla:", "hatirla:"):
        if kucuk.startswith(onek):
            r = add(con, ham[len(onek):].strip(), user=user)
            return {"handled": True, "text": ("Hafızaya eklendi (#%d)." % r["id"])
                    if r["ok"] else r["note"], "result": r}
    if kucuk in ("hafızam", "hafizam", "neyi hatırlıyorsun", "neyi hatirliyorsun"):
        rows = list_active(con, user)
        metin = "\n".join("#%d · %s · %s" % (r["id"], r["scope"], r["text"])
                           for r in reversed(rows))
        return {"handled": True, "text": metin or "Etkin hafıza kaydı yok."}
    parca = kucuk.split()
    if len(parca) == 2 and parca[1] in ("unut", "sil") and parca[0].lstrip("#").isdigit():
        r = forget(con, int(parca[0].lstrip("#")), user)
        return {"handled": True, "text": r["note"], "result": r}
    return None
