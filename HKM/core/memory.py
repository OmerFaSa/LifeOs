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
gelir ve kendi modulunun kapsamina yazilir.

Kisi modeli (2026-10-17, belgeler/ekip/KISI-PLANI.md Faz 5): moduller
kaydin `alan`ini (inanc, maddiyat…) ve onu GOREBILEN modul ajanlarini
(`gorenler`) yollar; izin haritasinin tek kaynagi moduldur (kisi.js).
King hepsini gorur; gorevli ajan yalniz kendi modulu `gorenler`de olan
kaydi gorur. Alani olmayan ya da eski (gorenler NULL) kayit eskisi gibi."""
import datetime
import re

from core import goruntu

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
         "COALESCE(katman,'soz') AS katman,modul,dis_id,onaylandi_at,alan,gorenler FROM memories "
         "WHERE user=? AND state='active' AND (expires_at IS NULL OR expires_at>?)")
    kapsam = _kapsamlar(scope)
    if kapsam:
        q += " AND scope IN (?,?)"
        args.extend(kapsam)
        # Kisi modeli izni: gorevli yalniz kendi modulu `gorenler`de olan
        # alanli kaydi gorur (NULL = eski kayit, eskisi gibi gorunur).
        q += " AND (gorenler IS NULL OR instr(',' || gorenler || ',', ',' || ? || ',') > 0)"
        args.append(kapsam[1])
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
    if r.get("onaylandi_at"):
        parca.append("senin onayınla")
    if r.get("modul"):
        parca.append(MODUL_ADI.get(r["modul"], r["modul"]))
    return " · ".join(parca)


def _kokler(metin):
    """Kaba kok: 4+ harfli kelimelerin ilk 5 harfi (Turkce kucultmeyle).
    «türev», «türevde», «türevler» ayni koke duser."""
    import re as _re
    k = str(metin or "").replace("İ", "i").replace("I", "ı").lower()
    return {w[:5] for w in _re.findall(r"\w+", k) if len(w) >= 4}


def context(con, user="ben", scope="king", limit=12, ilgili=None, sozler=False,
            cfg=None, butce=None, soru=None, gonder=None):
    """Modelin baglamina girecek hafiza satirlari.

    `ilgili` verilirse (mesaj metni) yalniz o mesajla ilgili kayitlar
    gider — ihtiyaci kadar veri (core/motor.py, alt/orta seviye). `cfg`
    varsa ilgi gommeyle olculur (KING-4 B); motor yoksa KOK paylasimi.
    `soru`: ilgili verilmese de King'e o mesajla ilgili «olanlar» girer (gommede).
    `sozler`: ilgili olmasa da kullanicinin KENDI sozleri (katman «soz»)
    eklenir; orta seviye bunu kullanir.
    `butce`: tahmini jeton tavani; asan en az ilgili satir duser."""
    rows = list_active(con, user, scope, limit=50 if ilgili is not None else limit)
    sorgu = ilgili if ilgili is not None else soru
    a = ara(con, cfg, sorgu, k=50, user=user, scope=scope, gonder=gonder) if cfg is not None and sorgu else None
    gomme = bool(a and a["yontem"] == "gomme")
    uygun = [s for s in a["sonuclar"] if s["benzerlik"] >= ESIK] if gomme else []
    olanlar = [s for s in uygun if s["katman"] == "olanlar"][:EN_COK_OLAN]
    if ilgili is not None:
        if gomme:
            sira = [s["id"] for s in uygun if s["tur"] == "bilgi"]
            secili = sorted((r for r in rows if r["id"] in sira), key=lambda r: sira.index(r["id"]))
        else:
            kok = _kokler(ilgili)
            puanli = [(len(kok & _kokler(r["text"])), r) for r in rows]
            secili = [r for p, r in sorted(puanli, key=lambda x: -x[0]) if p > 0]
        if sozler:
            secili += [r for r in rows if r["katman"] == "soz" and r not in secili]
        rows = secili[:limit]
    # Butce sondan keser: ilgili bilgi > ilgili olan > yalniz yeni oldugu icin gelen bilgi.
    bilgi = [("- [hafıza #%d · %s] %s" % (r["id"], etiket(r), r["text"]), r["id"]) for r in rows]
    olan = [("- [olan · %s] %s" % (str(s["at"] or "")[:10], s["metin"]), None) for s in olanlar]
    satir = bilgi + olan if ilgili is not None else olan + bilgi
    if butce:
        from core import ai
        while satir and ai._jeton_tahmini(*[x[0] for x in satir]) > butce:
            satir.pop()
    if not satir:
        return ""
    ids = [i for _, i in satir if i is not None]
    if ids:
        con.execute("UPDATE memories SET last_used_at=? WHERE id IN (%s)" %
                    ",".join("?" * len(ids)), (_simdi(),) + tuple(ids))
    return "\n".join(x[0] for x in reversed(satir))


EKLE_ONEK = ("bunu hatırla:", "hatırla:", "bunu hatirla:", "hatirla:", "unutma:",
             "aklında tut:", "aklinda tut:")
LISTE = ("hafızam", "hafizam", "neyi hatırlıyorsun", "neyi hatirliyorsun",
         "benim hakkımda ne biliyorsun", "benim hakkimda ne biliyorsun",
         "benim hakkımda neyi hatırlıyorsun")


# ------------------------------------------------------------ hafiza adayi
#
# GELISTIRME_PLANI §3: «model konusmadan bir aday cikarabilir ama kullanici
# onaylamadan kalici hafizaya donusmez.» Aday ayni tabloda `state='aday'`
# satiridir; list_active/context yalniz 'active' okur, yani aday MODELIN
# BAGLAMINA GIRMEZ. Onaylanan aday «sohbetten · senin onayınla» olur;
# reddedilen metin yeniden aday olamaz. Saglik bilgisi aday olmaz (plan:
# saglik verisi varsayilan olarak kalici sohbet hafizasina alinmaz).

MAX_ADAY = 20             # bekleyen aday tavani
MAX_ADAY_METIN = 200
# Kucuk model etiketi tek parantezle kapatabilir ya da satir sonunda acik
# birakabilir (sahada, 2026-10-19); etiket yine metne sizmaz.
ADAY_ETIKET = __import__("re").compile(r"\[\[\s*HAFIZA ADAYI\s*:\s*([^\]\n]+?)\s*(?:\]{1,2}|(?=\n)|$)",
                                       __import__("re").I)
SAGLIK = ("ilaç", "ilac", "doz", "tahlil", "teşhis", "teshis", "hastalı", "hastali", "tansiyon",
          "reçete", "recete", "depresyon", "kilo", "şeker has", "seker has", "ağrı", "agri", "ameliyat")


def aday_ayikla(metin):
    """Model cevabindaki [[HAFIZA ADAYI: …]] satirlarini ayiklar.
    Doner: (kullaniciya gidecek temiz metin, aday metinleri). Etiket
    — aday reddedilse bile — ASLA kullaniciya gitmez."""
    ham = str(metin or "")
    adaylar = [m.strip() for m in ADAY_ETIKET.findall(ham) if m.strip()]
    temiz = ADAY_ETIKET.sub("", ham)
    # Kalan cift koseli etiketler modelin TAKLIDIDIR («[[ÖLÇÜM UYDURMA: …]]»;
    # sahada, 2026-10-19): kullaniciya gitmez. Motorun «[[YUKSELT]]» isareti
    # buraya gelmeden ai.py/motor.py'de islenir.
    temiz = __import__("re").sub(r"[ \t]*\[\[[^\[\]\n]{1,120}\]\]?", "", temiz)
    # Etiketin ardindaki nokta («yok. [[…]].») cumlenin sonunda yalniz kalir:
    # «yok. .» degil «yok.» (sahada, 2026-10-19). «...» ellipsine dokunulmaz.
    temiz = __import__("re").sub(r"([.!?\u2026])[ \t]+[.!?](?=\s|$)", r"\1", temiz)
    temiz = "\n".join(sat.rstrip() for sat in temiz.splitlines()).strip()
    return temiz, adaylar


def aday_ekle(con, text, user="ben", scope="all", now=None):
    """Modelin onerdigi hafiza — YALNIZ aday olarak yazilir."""
    metin = " ".join(str(text or "").split())
    if not metin:
        return {"ok": False, "reason": "empty", "note": "Aday boş."}
    if len(metin) > MAX_ADAY_METIN:
        return {"ok": False, "reason": "long", "note": "Aday fazla uzun."}
    if scope not in SCOPES:
        return {"ok": False, "reason": "scope", "note": "Bilinmeyen hafıza kapsamı."}
    kucuk = metin.lower()
    if any(k in kucuk for k in SAGLIK):
        return {"ok": False, "reason": "saglik", "note": "Sağlık bilgisi hafıza adayı olmaz."}
    ayni = con.execute("SELECT id FROM memories WHERE user=? AND lower(text)=? "
                       "AND state IN ('active','aday','reddedildi')", (user, kucuk)).fetchone()
    if ayni:
        return {"ok": False, "reason": "tekrar", "note": "Bu bilgi zaten hafızada ya da daha önce reddedildi."}
    bekleyen = con.execute("SELECT COUNT(*) FROM memories WHERE user=? AND state='aday'",
                           (user,)).fetchone()[0]
    if bekleyen >= MAX_ADAY:
        return {"ok": False, "reason": "dolu", "note": "Bekleyen %d aday var; önce onlara bak." % MAX_ADAY}
    cur = con.execute("INSERT INTO memories(user,scope,text,source,state,created_at,katman)"
                      " VALUES (?,?,?,'model','aday',?,'sohbet')", (user, scope, metin, _simdi(now)))
    return {"ok": True, "id": cur.lastrowid, "text": metin}


def adaylar(con, user="ben"):
    return [dict(r) for r in con.execute(
        "SELECT id,scope,text,created_at FROM memories WHERE user=? AND state='aday' "
        "ORDER BY id", (user,)).fetchall()]


def aday_onayla(con, id_, user="ben", now=None):
    """Kullanicinin onayi: aday kalici olur. Kaynak kullanicidir (onaylayan)."""
    at = _simdi(now)
    cur = con.execute("UPDATE memories SET state='active',source='kullanici',onaylandi_at=? "
                      "WHERE id=? AND user=? AND state='aday'", (at, int(id_), user))
    return {"ok": cur.rowcount == 1, "id": int(id_),
            "note": "Hafızaya alındı." if cur.rowcount else "Bekleyen aday bulunamadı."}


def aday_reddet(con, id_, user="ben", now=None):
    cur = con.execute("UPDATE memories SET state='reddedildi',forgotten_at=? "
                      "WHERE id=? AND user=? AND state='aday'", (_simdi(now), int(id_), user))
    return {"ok": cur.rowcount == 1, "id": int(id_),
            "note": "Aday silindi; bu bilgi hafızaya alınmadı." if cur.rowcount else "Bekleyen aday bulunamadı."}


ADAY_LISTE = ("adaylar", "hafıza adayları", "hafiza adaylari")
DUZELT = re.compile(r"^#?(\d+)\s+d[üu]zelt\s*:\s*(.+)$", re.I | re.S)


def command(con, text, user="ben"):
    """Yalniz acik hafiza komutlarini isler; serbest cumleyi tahmin etmez.
    Dil, modullerle aynidir (brand/ortak/hafiza.js)."""
    ham = str(text or "").strip()
    kucuk = ham.lower().replace("i̇", "i")
    if kucuk.rstrip("?!. ") in ADAY_LISTE:
        ad = adaylar(con, user)
        return {"handled": True, "text": "\n".join("aday %d · %s" % (a["id"], a["text"]) for a in ad)
                + ("\n«aday N kaydet» ya da «aday N sil» yaz." if ad else "")
                if ad else "Bekleyen hafıza adayı yok."}
    p = kucuk.split()
    if len(p) == 3 and p[0] == "aday" and p[1].lstrip("#").isdigit() and p[2] in ("kaydet", "sil"):
        n = int(p[1].lstrip("#"))
        r = aday_onayla(con, n, user) if p[2] == "kaydet" else aday_reddet(con, n, user)
        return {"handled": True, "text": r["note"], "result": r}
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
    m = DUZELT.match(ham)
    if m:
        r = duzelt(con, int(m.group(1)), m.group(2), user)
        return {"handled": True, "text": r["note"], "result": r}
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
    alan = k.get("alan") if isinstance(k.get("alan"), str) and re.match(r"^[a-z]{2,16}$", k.get("alan")) else None
    g = k.get("gorenler")
    gorenler = None
    if isinstance(g, list):
        gorenler = ",".join(sorted(set(x for x in g if x in MODULLER)))
    return {"dis_id": dis_id, "metin": metin, "katman": katman, "kaynak": kaynak, "at": at,
            "alan": alan, "gorenler": gorenler}


def esitle(con, modul, kayitlar, user="ben", now=None, oturum=None, sira=None):
    """Modul hafizasinin ANLIK GORUNTUSUNU HKM kopyasina esitler.

    - Ayni goruntu iki kez gelirse hicbir sey degismez (idempotent).
    - Modulde degisen kayit guncellenir; modulde olmayan kayit DUSER
      (durum «dustu») — ama «unutuldu» OLMAZ: sonraki goruntude yeniden
      gelirse dirilir (HATALAR O-6: eksik eski bir yedek HKM'deki kayitlari
      kalici olarak unutturuyordu).
    - HKM'de UNUTULMUS kayit geri gelmez: HKM module yazamaz ve
      kullanicinin «unut» sozu bir senkronla ezilemez.
    - Modelden gelen ya da bozuk kayit reddedilir ve SAYILIR.
    - GEC GELEN ESKI GORUNTU YOK SAYILIR. Modul goruntuyu beklemeden
      yollar (hafiza.js); varis sirasi gonderim sirasi degildir: ekle'nin
      [kayit] goruntusu yazma kilidini beklerken unut'un [] goruntusu once
      uygulanirsa eski goruntu unutulani diriltiyordu (tools/entegre.js
      arada bir). Goruntu `oturum` + `sira` tasir; ayni oturumda
      uygulanandan eski ya da ona esit sira hicbir sey yazmaz
      ({"eski": True}). Kural core/goruntu.py'dedir."""
    if modul not in MODULLER:
        return {"ok": False, "note": "Bilinmeyen modül."}
    if not isinstance(kayitlar, list):
        return {"ok": False, "note": "Kayıtlar liste olmalı."}
    if len(kayitlar) > MAX_ESITLE:
        return {"ok": False, "note": "Bir modül en fazla %d hafıza kaydı yollayabilir." % MAX_ESITLE}
    if not goruntu.gecerli(oturum, sira):
        return {"ok": False, "note": goruntu.NOT}
    at = _simdi(now)
    # OKU-SONRA-YAZ TEK ISLEMDIR. Modul kaydi ekler eklemez arka planda bir
    # esitleme yollar; hemen ardindan ikincisi gelebilir. Iki istek ayri
    # is parcaciklarinda ayni anda «bu dis_id yok» gorurse ayni hafiza IKI
    # KEZ yazilirdi (tools/entegre.js bunu arada bir yakaliyordu). BEGIN
    # IMMEDIATE yazma kilidini okumadan ONCE alir: ikinci istek bekler
    # (busy_timeout) ve birincinin yazdigini gorur.
    kendi = not con.in_transaction
    if kendi:
        con.execute("BEGIN IMMEDIATE")
    try:
        if goruntu.eski_mi(con, "hafiza", modul, oturum, sira, at):
            if kendi:
                con.execute("COMMIT")
            return {"ok": True, "modul": modul, "eski": True, "eklenen": 0,
                    "guncellenen": 0, "dusen": 0, "dirilen": 0, "reddedilen": 0}
        var = {r["dis_id"]: dict(r) for r in con.execute(
            "SELECT id,dis_id,text,COALESCE(katman,'soz') AS katman,state,alan,gorenler FROM memories "
            "WHERE user=? AND modul=? AND dis_id IS NOT NULL", (user, modul)).fetchall()}
        eklenen = guncellenen = reddedilen = dusen = dirilen = 0
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
                            "katman,modul,dis_id,alan,gorenler) VALUES (?,?,?,?, 'active',?,?,?,?,?,?)",
                            (user, modul, k["metin"], k["kaynak"], k["at"] or at,
                             k["katman"], modul, k["dis_id"], k["alan"], k["gorenler"]))
                eklenen += 1
            elif onceki["state"] == "dustu":
                con.execute("UPDATE memories SET state='active',forgotten_at=NULL,"
                            "text=?,katman=?,alan=?,gorenler=? WHERE id=?",
                            (k["metin"], k["katman"], k["alan"], k["gorenler"], onceki["id"]))
                dirilen += 1
            elif onceki["state"] == "active" and (onceki["text"] != k["metin"]
                                                  or onceki["katman"] != k["katman"]
                                                  or onceki["alan"] != k["alan"]
                                                  or onceki["gorenler"] != k["gorenler"]):
                con.execute("UPDATE memories SET text=?,katman=?,alan=?,gorenler=? WHERE id=?",
                            (k["metin"], k["katman"], k["alan"], k["gorenler"], onceki["id"]))
                guncellenen += 1
        for dis_id, r in var.items():
            if r["state"] == "active" and dis_id not in gelen:
                con.execute("UPDATE memories SET state='dustu',forgotten_at=? WHERE id=?",
                            (at, r["id"]))
                dusen += 1
        if kendi:
            con.execute("COMMIT")
    except Exception:
        if kendi:
            con.execute("ROLLBACK")
        raise
    return {"ok": True, "modul": modul, "eklenen": eklenen, "guncellenen": guncellenen,
            "dusen": dusen, "dirilen": dirilen, "reddedilen": reddedilen}


# ------------------------------------------------------- uc katman (KING-4 B)
#
# Yeni bir hafiza sistemi YOK; var olan kayitlar uc katmanda okunur:
#   bilgiler   memories (kaynak ve tarihiyle; yukaridaki kurallar aynen)
#   olanlar    eylem defteri (King ne yazdi) + king_olaylar (moduller ne bildirdi)
#   beceriler  king_beceriler (core/beceri.py)
# Arama gomme ile (core/ollama.py gomme, qwen3-embedding); vektorler
# hafiza_gomme onbelleginde durur, yedege girmez. Motor yoksa kaba kok
# eslesmesine duser (AGENTS §1.1: model kapaliyken sistem kapanmaz).

ESIK = 0.35                # Olcum 3b: dogru eslesme ortancasi 0,45, en dusugu 0,26
EN_COK_OLAN = 3            # baglama girecek en cok «olan» satiri
GOMME_PARTI = 64


def _derlem(con, user="ben", scope="king"):
    """(tur, id, metin, at) — aranan butun satirlar. Gorevli olanlari ve becerileri gormez."""
    out = [("bilgi", r["id"], r["text"], r["created_at"]) for r in list_active(con, user, scope, limit=200)]
    if _kapsamlar(scope) is None:
        out += [("olan", r[0], r[1], r[2]) for r in con.execute(
            "SELECT id, ozet, created_at FROM eylem WHERE durum='uygulandi' ORDER BY id DESC LIMIT 100")]
        out += [("olay", r[0], "%s: %s%s" % (MODUL_ADI.get(r[1], r[1]), r[2].replace("_", " "),
                                             " · " + r[3] if r[3] else ""), r[4]) for r in con.execute(
            "SELECT id, modul, tur, konu, at FROM king_olaylar WHERE karar='basla' ORDER BY id DESC LIMIT 100")]
        out += [("beceri", r[0], r[1], r[2]) for r in con.execute(
            "SELECT id, ad, created_at FROM king_beceriler WHERE acik=1 ORDER BY id DESC LIMIT 40")]
    return out


def _ozet(metin):
    import hashlib
    return hashlib.sha1(metin.encode("utf-8")).hexdigest()


def _birim(v):
    import array
    n = sum(x * x for x in v) ** 0.5 or 1.0
    return array.array("f", [x / n for x in v])


def _vektorler(con, cfg, ogeler, gonder=None):
    """{(tur, id): vektor} ya da None (motor yok). Eksik ya da metni degismis
    olanlar parti parti uretilir ve onbellege yazilir."""
    import array
    from core import ollama
    model = ollama.gomme_modeli(cfg)
    var = {(r[0], r[1]): (r[2], r[3]) for r in con.execute(
        "SELECT tur, kaynak_id, ozet, vektor FROM hafiza_gomme WHERE model=?", (model,))}
    out, eksik = {}, []
    for o in ogeler:
        v = var.get(o[:2])
        if v and v[0] == _ozet(o[2]):
            out[o[:2]] = array.array("f", v[1])
        else:
            eksik.append(o)
    for i in range(0, len(eksik), GOMME_PARTI):
        parti = eksik[i:i + GOMME_PARTI]
        vs = ollama.gomme(cfg, [o[2] for o in parti], gonder)
        if vs is None:
            return None
        for o, v in zip(parti, vs):
            out[o[:2]] = b = _birim(v)
            con.execute("INSERT OR REPLACE INTO hafiza_gomme(tur, kaynak_id, ozet, model, vektor) "
                        "VALUES (?,?,?,?,?)", (o[0], o[1], _ozet(o[2]), model, b.tobytes()))
    if eksik:
        con.commit()
    return out


SORGU_ONEK = "Instruct: Given a user message, retrieve the user's facts and past events relevant to it\nQuery: "


def ara(con, cfg, sorgu, k=8, user="ben", scope="king", gonder=None):
    """{yontem: gomme|kok, sonuclar: [{katman, tur, id, metin, at, benzerlik}]}.
    Gommede ESIK alti dusmez; cagiran secer."""
    from core import ollama
    katman = {"bilgi": "bilgiler", "olan": "olanlar", "olay": "olanlar", "beceri": "beceriler"}
    ogeler = _derlem(con, user, scope)
    q = " ".join(str(sorgu or "").split())[:500]
    puan, yontem = {}, "kok"
    if q and ogeler and cfg is not None:
        vs = _vektorler(con, cfg, ogeler, gonder)
        qv = vs is not None and ollama.gomme(cfg, [SORGU_ONEK + q], gonder)
        if qv:
            qb = _birim(qv[0])
            puan = {o[:2]: sum(a * b for a, b in zip(qb, vs[o[:2]])) for o in ogeler}
            yontem = "gomme"
    if yontem == "kok":
        kq = _kokler(q)
        puan = {o[:2]: len(kq & _kokler(o[2])) / (len(kq) or 1) for o in ogeler}
    sirali = sorted(ogeler, key=lambda o: -puan[o[:2]])[:max(1, min(int(k), 50))]
    return {"yontem": yontem, "sonuclar": [
        {"katman": katman[o[0]], "tur": o[0], "id": o[1], "metin": o[2], "at": o[3],
         "benzerlik": round(puan[o[:2]], 3)} for o in sirali]}


def bildiklerim(con, user="ben", limit=30):
    """«Benim hakkımda ne biliyorsun»: uc katman, her satir kaynagi ve tarihiyle."""
    from core import eylem
    bilgiler = [{"id": r["id"], "metin": r["text"], "etiket": etiket(r), "kaynak": r["source"],
                 "katman": r["katman"], "modul": r["modul"], "alan": r["alan"], "tarih": r["created_at"],
                 "onaylandi_at": r["onaylandi_at"]} for r in list_active(con, user, limit=200)]
    olanlar = [{"tur": "eylem", "id": e["id"], "metin": e["ozet"], "at": e["created_at"], "modul": e["modul"],
                "geri_alinabilir": e["geri_alinabilir"]} for e in eylem.listele(con, limit)]
    olanlar += [{"tur": "olay", "id": r["id"], "metin": "%s: %s" % (MODUL_ADI.get(r["modul"], r["modul"]),
                                                                    r["tur"].replace("_", " ")),
                 "at": r["at"], "modul": r["modul"], "karar": r["karar"]} for r in con.execute(
        "SELECT id, modul, tur, at, karar FROM king_olaylar ORDER BY id DESC LIMIT ?", (int(limit),))]
    olanlar.sort(key=lambda x: x["at"] or "", reverse=True)
    beceriler = [{"id": r["id"], "ad": r["ad"], "acik": bool(r["acik"]), "kaynak": r["kaynak"],
                  "tarih": r["created_at"]} for r in con.execute(
        "SELECT id, ad, acik, kaynak, created_at FROM king_beceriler ORDER BY id DESC")]
    return {"bilgiler": bilgiler, "olanlar": olanlar[:int(limit)], "beceriler": beceriler,
            "adaylar": adaylar(con, user)}


def duzelt(con, id_, text, user="ben", now=None):
    """Kullanici bir bilgiyi duzeltir; duzeltilen satir «senin sözün» olur.
    Modulden gelen kayit yerinde duzeltilmez (modulun sonraki goruntusu ezerdi):
    eskisi unutulur, duzeltilmisi HKM'ye yazilir."""
    metin = str(text or "").strip()
    if not metin or len(metin) > MAX_TEXT:
        return {"ok": False, "note": "Düzeltme boş ya da fazla uzun."}
    r = con.execute("SELECT * FROM memories WHERE id=? AND user=? AND state='active'",
                    (int(id_), user)).fetchone()
    if not r:
        return {"ok": False, "id": int(id_), "note": "Etkin hafıza bulunamadı."}
    if r["modul"]:
        forget(con, r["id"], user, now)
        y = add(con, metin, user, scope=r["scope"], source="kullanici", now=now)
        con.commit()
        return dict(y, eski=r["id"], note="Düzeltildi (#%d → #%d)." % (r["id"], y["id"]))
    con.execute("UPDATE memories SET text=?, source='kullanici', katman='soz' WHERE id=?", (metin, r["id"]))
    con.commit()
    return {"ok": True, "id": r["id"], "text": metin, "note": "Düzeltildi (#%d)." % r["id"]}
