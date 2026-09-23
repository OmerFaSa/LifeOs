# -*- coding: utf-8 -*-
"""Kullanici hafizasi — model kendiliginden kalici kayit yazamaz.

Modullerle AYNI sozlesme (brand/ortak/hafiza.js):

  katman   soz      «senin sozun» — yalniz kullanici yazar
           sohbet   «sohbetten»   — kullanici ya da kural motoru
           cikarim  «tahmin»      — yalniz kural motoru; her zaman
                                    «tahmin» etiketiyle gorunur
  kaynak   explicit/kullanici · kural · (model: HER KATMANDA REDDEDILIR)

Bir dil modelinin «kullanici X'i sever» diye kalici kayit birakmasi,
halusinasyonu kalici yapmak olurdu (AGENTS.md §1.1).

Kapsam: her gorevli kendi modulunun hafizasini + «all»u gorur; King
ust patrondur ve HEPSINI gorur. Modullerden gelen kayitlar `esitle` ile
gelir ve kendi modulunun kapsamina yazilir."""
import datetime

SCOPES = {"all", "king", "ays", "spi", "esp"}
MODULLER = ("ays", "spi", "esp")
MAX_TEXT = 600
MAX_ESITLE = 200          # modulun tuttugu en fazla kayit (hafiza.js MAX_KAYIT)

KATMANLAR = {"soz": "senin sözün", "sohbet": "sohbetten", "cikarim": "tahmin"}
KAYNAK_IZNI = {"soz": {"explicit", "kullanici"},
               "sohbet": {"explicit", "kullanici", "kural"},
               "cikarim": {"kural"}}
# Gorevli adi kapsam adi DEGILDIR: sohbet «bio» der, hafiza «spi» tutar.
GOREVLI_KAPSAM = {"bio": "spi", "academic": "ays", "intellect": "esp"}
MODUL_ADI = {"ays": "AYS", "spi": "SPİ", "esp": "ESP"}


def _simdi(now=None):
    return now or datetime.datetime.now().isoformat(timespec="seconds")


def _izin(katman, source):
    if katman not in KATMANLAR:
        return "Bilinmeyen hafıza katmanı."
    if source == "model":
        return "Model hafızaya yazamaz; yalnız sen ve kural motoru yazar."
    if source not in KAYNAK_IZNI[katman]:
        return "Bu katmana bu kaynak yazamaz."
    return None


def add(con, text, user="ben", scope="all", source="explicit", expires=None,
        now=None, katman="soz"):
    metin = str(text or "").strip()
    if not metin:
        return {"ok": False, "reason": "empty", "note": "Hatırlanacak bilgi boş."}
    if len(metin) > MAX_TEXT:
        return {"ok": False, "reason": "long", "note": "Hafıza kaydı fazla uzun."}
    if scope not in SCOPES:
        return {"ok": False, "reason": "scope", "note": "Bilinmeyen hafıza kapsamı."}
    red = _izin(katman, source)
    if red:
        return {"ok": False, "reason": "izin", "note": red}
    cur = con.execute("INSERT INTO memories(user,scope,text,source,state,created_at,"
                      "expires_at,katman) VALUES (?,?,?,?, 'active',?,?,?)",
                      (user, scope, metin, source, _simdi(now), expires, katman))
    return {"ok": True, "id": cur.lastrowid, "text": metin, "scope": scope,
            "katman": katman}


def _kapsamlar(scope):
    """Bir gorevlinin gordugu kapsamlar; None = hepsi (King)."""
    if not scope or scope == "king":
        return None
    return ("all", GOREVLI_KAPSAM.get(scope, scope))


def list_active(con, user="ben", scope=None, now=None, limit=50):
    args = [user, _simdi(now)]
    q = ("SELECT id,scope,text,source,created_at,expires_at,last_used_at,"
         "COALESCE(katman,'soz') AS katman,modul,dis_id FROM memories "
         "WHERE user=? AND state='active' AND (expires_at IS NULL OR expires_at>?)")
    kapsam = _kapsamlar(scope)
    if kapsam:
        q += " AND scope IN (?,?)"
        args.extend(kapsam)
    q += " ORDER BY id DESC LIMIT ?"
    args.append(max(1, min(int(limit), 200)))
    return [dict(r) for r in con.execute(q, args).fetchall()]


def forget(con, id_, user="ben", now=None):
    cur = con.execute("UPDATE memories SET state='forgotten',forgotten_at=? "
                      "WHERE id=? AND user=? AND state='active'",
                      (_simdi(now), int(id_), user))
    return {"ok": cur.rowcount == 1, "id": int(id_),
            "note": "Hafıza silindi." if cur.rowcount else "Etkin hafıza bulunamadı."}


def etiket(r):
    """«senin sözün», «tahmin · AYS» gibi — satirin nereden geldigi."""
    parca = [KATMANLAR.get(r.get("katman") or "soz", "senin sözün")]
    if r.get("modul"):
        parca.append(MODUL_ADI.get(r["modul"], r["modul"]))
    return " · ".join(parca)


def context(con, user="ben", scope="king", limit=12):
    rows = list_active(con, user, scope, limit=limit)
    if not rows:
        return ""
    ids = [r["id"] for r in rows]
    con.execute("UPDATE memories SET last_used_at=? WHERE id IN (%s)" %
                ",".join("?" * len(ids)), (_simdi(),) + tuple(ids))
    return "\n".join("- [hafıza #%d · %s] %s" % (r["id"], etiket(r), r["text"])
                     for r in reversed(rows))


EKLE_ONEK = ("bunu hatırla:", "hatırla:", "bunu hatirla:", "hatirla:", "unutma:",
             "aklında tut:", "aklinda tut:")
LISTE = ("hafızam", "hafizam", "neyi hatırlıyorsun", "neyi hatirliyorsun",
         "benim hakkımda ne biliyorsun", "benim hakkimda ne biliyorsun",
         "benim hakkımda neyi hatırlıyorsun")


def command(con, text, user="ben"):
    """Yalniz acik hafiza komutlarini isler; serbest cumleyi tahmin etmez.
    Dil, modullerle aynidir (brand/ortak/hafiza.js)."""
    ham = str(text or "").strip()
    kucuk = ham.lower().replace("i̇", "i")
    for onek in EKLE_ONEK:
        if kucuk.startswith(onek):
            r = add(con, ham[len(onek):].strip(), user=user)
            return {"handled": True, "text": ("Hafızaya eklendi (#%d)." % r["id"])
                    if r["ok"] else r["note"], "result": r}
    if kucuk.rstrip("?!. ") in LISTE:
        rows = list_active(con, user)
        metin = "\n".join("#%d · %s · %s" % (r["id"], etiket(r), r["text"])
                           for r in reversed(rows))
        return {"handled": True, "text": metin or "Etkin hafıza kaydı yok."}
    parca = kucuk.split()
    if len(parca) == 2 and parca[1] in ("unut", "sil") and parca[0].lstrip("#").isdigit():
        r = forget(con, int(parca[0].lstrip("#")), user)
        return {"handled": True, "text": r["note"], "result": r}
    return None


def _gecerli_kayit(k):
    if not isinstance(k, dict):
        return None
    dis_id = k.get("id")
    metin = str(k.get("metin") or "").strip()
    katman = k.get("katman") or "soz"
    kaynak = k.get("kaynak") or "kullanici"
    if not isinstance(dis_id, str) or not dis_id or len(dis_id) > 60:
        return None
    if not metin or len(metin) > MAX_TEXT or _izin(katman, kaynak):
        return None
    at = k.get("at") if isinstance(k.get("at"), str) and len(k.get("at")) <= 40 else None
    return {"dis_id": dis_id, "metin": metin, "katman": katman, "kaynak": kaynak, "at": at}


def esitle(con, modul, kayitlar, user="ben", now=None):
    """Modul hafizasinin ANLIK GORUNTUSUNU HKM kopyasina esitler.

    - Ayni goruntu iki kez gelirse hicbir sey degismez (idempotent).
    - Modulde degisen kayit guncellenir; modulde olmayan kayit dusar.
    - HKM'de UNUTULMUS kayit geri gelmez: HKM module yazamaz ve
      kullanicinin «unut» sozu bir senkronla ezilemez.
    - Modelden gelen ya da bozuk kayit reddedilir ve SAYILIR."""
    if modul not in MODULLER:
        return {"ok": False, "note": "Bilinmeyen modül."}
    if not isinstance(kayitlar, list):
        return {"ok": False, "note": "Kayıtlar liste olmalı."}
    if len(kayitlar) > MAX_ESITLE:
        return {"ok": False, "note": "Bir modül en fazla %d hafıza kaydı yollayabilir." % MAX_ESITLE}
    at = _simdi(now)
    var = {r["dis_id"]: dict(r) for r in con.execute(
        "SELECT id,dis_id,text,COALESCE(katman,'soz') AS katman,state FROM memories "
        "WHERE user=? AND modul=? AND dis_id IS NOT NULL", (user, modul)).fetchall()}
    eklenen = guncellenen = reddedilen = dusen = 0
    gelen = set()
    for ham in kayitlar:
        k = _gecerli_kayit(ham)
        if not k or k["dis_id"] in gelen:
            reddedilen += 1
            continue
        gelen.add(k["dis_id"])
        onceki = var.get(k["dis_id"])
        if onceki is None:
            con.execute("INSERT INTO memories(user,scope,text,source,state,created_at,"
                        "katman,modul,dis_id) VALUES (?,?,?,?, 'active',?,?,?,?)",
                        (user, modul, k["metin"], k["kaynak"], k["at"] or at,
                         k["katman"], modul, k["dis_id"]))
            eklenen += 1
        elif onceki["state"] == "active" and (onceki["text"] != k["metin"]
                                              or onceki["katman"] != k["katman"]):
            con.execute("UPDATE memories SET text=?,katman=? WHERE id=?",
                        (k["metin"], k["katman"], onceki["id"]))
            guncellenen += 1
    for dis_id, r in var.items():
        if r["state"] == "active" and dis_id not in gelen:
            con.execute("UPDATE memories SET state='forgotten',forgotten_at=? WHERE id=?",
                        (at, r["id"]))
            dusen += 1
    return {"ok": True, "modul": modul, "eklenen": eklenen, "guncellenen": guncellenen,
            "dusen": dusen, "reddedilen": reddedilen}
