# -*- coding: utf-8 -*-
"""Hayat Mottosu — kullanicinin KENDI dusunce ve yasam felsefesi agi.

   NE ISE YARAR

   HKM'nin geri kalani olcer: veri gelir, kural motoru karar uretir,
   ekranda bir sayi durur. Burasi olcmez. Burasi kisinin hayat hakkinda
   ne dusundugunu YAZDIGI, zamanla DEGISTIRDIGI ve dusuncelerini
   birbirine BAGLADIGI yerdir.

   Amac kullaniciya nasil dusunmesi gerektigini soylemek DEGILDIR. Amac
   kendi dusuncesini yazmasi, duzenlemesi, baglamasi, gelistirmesi ve
   gecmisini gorebilmesi icin kalici bir alan acmaktir.

   ------------------------------------------------------------------
   AGAC VE AG AYNI ANDA, VE BU BILEREK BOYLE

   `parent_id` bir AGAC kurar: Hayat → Zaman, Karakter → Disiplin.
   `motto_links` ise agactan BAGIMSIZ bir ag: Disiplin ↔ Ozgurluk.

   Ikisi ayri seydir. Agac kullanicinin SINIFLANDIRMASIDIR; ag
   dusuncenin gercek AKRABALIGIDIR. Disiplin «Karakter» dalinda durur
   ama Ozgurluk ile, Uzun Vadeli Hedefler ile ve Calisma ile
   akrabadir — ve bunlar baska dallarda.

   Tek yapiya indirgenseydi biri otekini bozardi: ya her akrabalik bir
   dal olurdu ve agac okunmaz hale gelirdi, ya da akrabalik hic
   yazilamazdi.

   ------------------------------------------------------------------
   ESKI DUSUNCE KAYBOLMAZ

   Her duzenleme, duzenlemeden ONCEKI hali `motto_versions` icine yazar.
   Sebebi kayit tutma aliskanligi degil: bir insanin «basari benim icin
   X» dedigi gun ile «artik Y diyorum» dedigi gun arasindaki FARK,
   dusuncenin kendisi kadar degerlidir. Ustune yazmak o farki siler ve
   kisi kendi degisimini goremez.

   ------------------------------------------------------------------
   KULLANICININ SOZU ILE URETILEN AYRI DURUR

   Her surum `author` tasir: `ben` ya da `uretilen`. Bir dil modelinin
   cumlesi kullanicinin ilkesi gibi gorunurse, kisi bir sure sonra kendi
   dusuncesi ile kendisine SOYLENEN seyi ayirt edemez hale gelir. Bu
   alan gorsel bir ayrinti degil, bu bolumun var olma sebebidir.

   Uretilen bir metin bir dugumun GOVDESINI SESSIZCE DEGISTIREMEZ:
   `oner()` ayri bir surum birakir ve kullanici onaylayana kadar dugumun
   kendisi degismez.

   ------------------------------------------------------------------
   BASKA MODUL BURAYA YAZMAZ

   AYS, SPI ve ESP bu tablolari hic gormez. HKM'nin kendi icinde de
   yalniz bu dosya yazar. «Hayat Mottosu icerisindeki kisisel dusunceler
   diger sistemler tarafindan kontrolsuz bicimde degistirilmemelidir»
   kurali, bir niyet degil bir SINIRDIR.
"""

import datetime
import re

# Bir dugumun turu. `motto` ve `ilke` normal dusunceden ayrilir ve ana
# ekranda ayrica gosterilir; ayrim kullanicinindir, sistem bir dusunceyi
# kendiliginden ilkeye yukseltmez.
TURLER = ("dusunce", "motto", "ilke")

# Kullanicinin yazdigi ile uretilenin ayrildigi tek yer.
YAZARLAR = ("ben", "uretilen")

MAX_BASLIK = 200
MAX_GOVDE = 20000        # bir dusunce uzun olabilir; sinir kotayi korur
MAX_ETIKET = 40
MAX_DERINLIK = 12        # agac derinligi: dongu ve sonsuz dal korumasi


def _simdi(now=None):
    return now or datetime.datetime.now().isoformat(timespec="seconds")


def _etiket_sadelestir(ham):
    """`#Disiplin` → `disiplin`. Etiket bir ADRES degil bir ETIKETTIR:
    buyuk/kucuk harf ve bas `#` ayirt edici olsaydi `#Disiplin` ile
    `#disiplin` iki ayri raf olurdu ve kullanici aradigini bulamazdi."""
    from core import db as _db
    t = _db.tr_kucuk(str(ham or "").strip().lstrip("#").strip())
    t = re.sub(r"\s+", "-", t)
    t = re.sub(r"[^0-9a-zçğıöşü\-_]", "", t)
    return t[:MAX_ETIKET]


def _satir(r):
    return dict(r) if r is not None else None


# ---------------------------------------------------------------- dugum

def ekle(con, title, parent_id=None, body="", kind="dusunce", tags=None,
         user="ben", author="ben", now=None):
    """Yeni bir dusunce dugumu. Basligi bos olan dugum kabul edilmez:
    adsiz bir dal agacta bulunamaz."""
    baslik = str(title or "").strip()
    if not baslik:
        return {"ok": False, "reason": "empty", "note": "Başlık boş olamaz."}
    if len(baslik) > MAX_BASLIK:
        return {"ok": False, "reason": "long", "note": "Başlık fazla uzun."}
    if kind not in TURLER:
        return {"ok": False, "reason": "kind", "note": "Bilinmeyen düşünce türü."}
    if author not in YAZARLAR:
        return {"ok": False, "reason": "author", "note": "Bilinmeyen yazar."}
    govde = str(body or "")
    if len(govde) > MAX_GOVDE:
        return {"ok": False, "reason": "body", "note": "Düşünce fazla uzun."}

    if parent_id is not None:
        ust = _satir(con.execute(
            "SELECT id,user FROM motto_nodes WHERE id=?", (int(parent_id),)).fetchone())
        if not ust or ust["user"] != user:
            return {"ok": False, "reason": "parent", "note": "Üst dal bulunamadı."}
        if _derinlik(con, int(parent_id)) + 1 > MAX_DERINLIK:
            return {"ok": False, "reason": "depth",
                    "note": "Ağaç fazla derinleşti; yeni dal başka bir yere açılmalı."}

    at = _simdi(now)
    sira = con.execute(
        "SELECT COALESCE(MAX(sort),0)+1 AS s FROM motto_nodes "
        "WHERE user=? AND parent_id IS ?", (user, parent_id)).fetchone()["s"]
    cur = con.execute(
        "INSERT INTO motto_nodes(user,parent_id,title,body,kind,sort,created_at,"
        "updated_at) VALUES (?,?,?,?,?,?,?,?)",
        (user, parent_id, baslik, govde, kind, sira, at, at))
    nid = cur.lastrowid
    # ILK HAL DE BIR SURUMDUR. Yalniz degisiklikleri yazsaydik, bir
    # dusuncenin ILK yazildigi an gecmiste hic gorunmezdi.
    con.execute(
        "INSERT INTO motto_versions(node_id,title,body,kind,author,created_at) "
        "VALUES (?,?,?,?,?,?)", (nid, baslik, govde, kind, author, at))
    _etiketle(con, nid, tags)
    con.commit()
    return {"ok": True, "id": nid, "title": baslik, "kind": kind}


def duzenle(con, node_id, title=None, body=None, kind=None, tags=None,
            user="ben", author="ben", now=None):
    """Dugumu gunceller ve ONCEKI hali surum defterine yazar."""
    n = _satir(con.execute("SELECT * FROM motto_nodes WHERE id=? AND user=?",
                           (int(node_id), user)).fetchone())
    if not n:
        return {"ok": False, "reason": "yok", "note": "Düşünce bulunamadı."}
    if author not in YAZARLAR:
        return {"ok": False, "reason": "author", "note": "Bilinmeyen yazar."}

    yeni_baslik = n["title"] if title is None else str(title).strip()
    yeni_govde = n["body"] if body is None else str(body)
    yeni_tur = n["kind"] if kind is None else kind
    if not yeni_baslik:
        return {"ok": False, "reason": "empty", "note": "Başlık boş olamaz."}
    if len(yeni_baslik) > MAX_BASLIK:
        return {"ok": False, "reason": "long", "note": "Başlık fazla uzun."}
    if yeni_tur not in TURLER:
        return {"ok": False, "reason": "kind", "note": "Bilinmeyen düşünce türü."}
    if len(yeni_govde) > MAX_GOVDE:
        return {"ok": False, "reason": "body", "note": "Düşünce fazla uzun."}

    degisti = (yeni_baslik != n["title"] or yeni_govde != n["body"]
               or yeni_tur != n["kind"])
    at = _simdi(now)
    if degisti:
        # ONCEKI hal yazilir, yenisi degil: surum defteri «neydi»
        # sorusunun cevabidir. Yeni hali zaten dugumun kendisinde durur.
        con.execute(
            "INSERT INTO motto_versions(node_id,title,body,kind,author,created_at) "
            "VALUES (?,?,?,?,?,?)",
            (n["id"], yeni_baslik, yeni_govde, yeni_tur, author, at))
        con.execute(
            "UPDATE motto_nodes SET title=?,body=?,kind=?,updated_at=? WHERE id=?",
            (yeni_baslik, yeni_govde, yeni_tur, at, n["id"]))
    if tags is not None:
        con.execute("DELETE FROM motto_tags WHERE node_id=?", (n["id"],))
        _etiketle(con, n["id"], tags)
    con.commit()
    return {"ok": True, "id": n["id"], "changed": degisti}


def oner(con, node_id, body, user="ben", now=None):
    """URETILEN bir metin — dugumun govdesini DEGISTIRMEZ.

    Bir dil modelinin cumlesi, kullanicinin dusuncesinin yerine sessizce
    gecemez. Oneri bir SURUM olarak birakilir (`author='uretilen'`) ve
    kullanici `onayla()` demedikce dugumun kendisi oldugu gibi kalir."""
    n = _satir(con.execute("SELECT * FROM motto_nodes WHERE id=? AND user=?",
                           (int(node_id), user)).fetchone())
    if not n:
        return {"ok": False, "reason": "yok", "note": "Düşünce bulunamadı."}
    metin = str(body or "").strip()
    if not metin:
        return {"ok": False, "reason": "empty", "note": "Öneri boş."}
    if len(metin) > MAX_GOVDE:
        return {"ok": False, "reason": "body", "note": "Öneri fazla uzun."}
    at = _simdi(now)
    cur = con.execute(
        "INSERT INTO motto_versions(node_id,title,body,kind,author,created_at) "
        "VALUES (?,?,?,?,'uretilen',?)", (n["id"], n["title"], metin, n["kind"], at))
    con.commit()
    return {"ok": True, "id": n["id"], "version_id": cur.lastrowid,
            "applied": False,
            "note": "Öneri kaydedildi; düşüncen değişmedi. Onaylarsan uygulanır."}


def onayla(con, version_id, user="ben", now=None):
    """Bir surumu dugumun GUNCEL hali yapar — ileri ya da geri.

    Ayni yol hem uretilen bir oneriyi kabul etmek hem de eski bir hale
    DONMEK icin kullanilir: ikisi de «su surum artik gecerli olsun»
    demektir ve ikisi de yeni bir surum birakir. Geri donusu ayri bir
    yol yapmak, geri donusun kendisini gecmiste GORUNMEZ kilardi."""
    v = _satir(con.execute("SELECT * FROM motto_versions WHERE id=?",
                           (int(version_id),)).fetchone())
    if not v:
        return {"ok": False, "reason": "yok", "note": "Sürüm bulunamadı."}
    n = _satir(con.execute("SELECT * FROM motto_nodes WHERE id=? AND user=?",
                           (v["node_id"], user)).fetchone())
    if not n:
        return {"ok": False, "reason": "yok", "note": "Düşünce bulunamadı."}
    at = _simdi(now)
    # Onaylayan KULLANICIDIR: yeni surumun yazari 'ben'dir, uretilen
    # metni kabul etmis olsa bile. Kabul etmek, sahiplenmektir.
    con.execute(
        "INSERT INTO motto_versions(node_id,title,body,kind,author,created_at) "
        "VALUES (?,?,?,?,'ben',?)", (n["id"], v["title"], v["body"], v["kind"], at))
    con.execute("UPDATE motto_nodes SET title=?,body=?,kind=?,updated_at=? WHERE id=?",
                (v["title"], v["body"], v["kind"], at, n["id"]))
    con.commit()
    return {"ok": True, "id": n["id"], "from_version": v["id"]}


def arsivle(con, node_id, user="ben", now=None):
    """Dugum SILINMEZ, arsivlenir. Bir dusunceyi geri donusu olmayacak
    bicimde silmek, bu bolumun sozune aykiridir: eski dusunce kaybolmaz."""
    n = _satir(con.execute("SELECT id FROM motto_nodes WHERE id=? AND user=?",
                           (int(node_id), user)).fetchone())
    if not n:
        return {"ok": False, "reason": "yok", "note": "Düşünce bulunamadı."}
    alt = con.execute("SELECT COUNT(*) AS n FROM motto_nodes "
                      "WHERE parent_id=? AND archived_at IS NULL",
                      (n["id"],)).fetchone()["n"]
    if alt:
        return {"ok": False, "reason": "alt",
                "note": "Bu dalın altında %d düşünce var; önce onları taşı ya da "
                        "arşivle." % alt}
    con.execute("UPDATE motto_nodes SET archived_at=? WHERE id=?", (_simdi(now), n["id"]))
    con.commit()
    return {"ok": True, "id": n["id"]}


def tasi(con, node_id, parent_id=None, user="ben", now=None):
    """Dali baska bir dalin altina alir. Kendi altina almak ve dongu
    kurmak REDDEDILIR: bir agacin kendi icine dolanmasi, gezilemeyen bir
    agactir."""
    n = _satir(con.execute("SELECT * FROM motto_nodes WHERE id=? AND user=?",
                           (int(node_id), user)).fetchone())
    if not n:
        return {"ok": False, "reason": "yok", "note": "Düşünce bulunamadı."}
    if parent_id is not None:
        pid = int(parent_id)
        if pid == n["id"]:
            return {"ok": False, "reason": "dongu",
                    "note": "Bir düşünce kendi altına alınamaz."}
        if _ustunde_mi(con, n["id"], pid):
            return {"ok": False, "reason": "dongu",
                    "note": "Bir dal kendi alt dalının altına alınamaz."}
        ust = _satir(con.execute("SELECT id,user FROM motto_nodes WHERE id=?",
                                 (pid,)).fetchone())
        if not ust or ust["user"] != user:
            return {"ok": False, "reason": "parent", "note": "Üst dal bulunamadı."}
    con.execute("UPDATE motto_nodes SET parent_id=?,updated_at=? WHERE id=?",
                (parent_id, _simdi(now), n["id"]))
    con.commit()
    return {"ok": True, "id": n["id"], "parent_id": parent_id}


def _ustunde_mi(con, ata_id, dugum_id):
    """`dugum_id`, `ata_id`'nin altinda mi — donguyu boyle yakalariz."""
    gorulen = set()
    cur = dugum_id
    for _ in range(MAX_DERINLIK + 2):
        if cur is None or cur in gorulen:
            return False
        if cur == ata_id:
            return True
        gorulen.add(cur)
        r = con.execute("SELECT parent_id FROM motto_nodes WHERE id=?", (cur,)).fetchone()
        if not r:
            return False
        cur = r["parent_id"]
    return False


def _derinlik(con, node_id):
    d = 0
    cur = node_id
    for _ in range(MAX_DERINLIK + 2):
        r = con.execute("SELECT parent_id FROM motto_nodes WHERE id=?", (cur,)).fetchone()
        if not r or r["parent_id"] is None:
            return d
        d += 1
        cur = r["parent_id"]
    return d


# ---------------------------------------------------------------- baglar

def bagla(con, a_id, b_id, note=None, user="ben", now=None):
    """Iki dusunceyi birbirine baglar. Bag YONSUZDUR: «Disiplin ↔
    Ozgurluk» ile «Ozgurluk ↔ Disiplin» ayni seydir, o yuzden kucuk
    kimlik once yazilir ve ayni cift iki kez kaydedilemez."""
    a, b = int(a_id), int(b_id)
    if a == b:
        return {"ok": False, "reason": "kendine",
                "note": "Bir düşünce kendisine bağlanamaz."}
    a, b = (a, b) if a < b else (b, a)
    for x in (a, b):
        r = con.execute("SELECT id FROM motto_nodes WHERE id=? AND user=?",
                        (x, user)).fetchone()
        if not r:
            return {"ok": False, "reason": "yok", "note": "Düşünce bulunamadı."}
    var = con.execute("SELECT id FROM motto_links WHERE a_id=? AND b_id=?",
                      (a, b)).fetchone()
    if var:
        return {"ok": True, "id": var["id"], "already": True}
    cur = con.execute(
        "INSERT INTO motto_links(a_id,b_id,note,created_at) VALUES (?,?,?,?)",
        (a, b, (str(note).strip() if note else None), _simdi(now)))
    con.commit()
    return {"ok": True, "id": cur.lastrowid, "already": False}


def bagi_kaldir(con, a_id, b_id, user="ben"):
    a, b = int(a_id), int(b_id)
    a, b = (a, b) if a < b else (b, a)
    cur = con.execute("DELETE FROM motto_links WHERE a_id=? AND b_id=?", (a, b))
    con.commit()
    return {"ok": cur.rowcount == 1}


def baglari(con, node_id):
    """Bu dusunceye bagli olan dusunceler — iki yonden de."""
    nid = int(node_id)
    rows = con.execute(
        "SELECT l.id AS link_id, l.note, "
        "       CASE WHEN l.a_id=? THEN l.b_id ELSE l.a_id END AS other "
        "FROM motto_links l WHERE l.a_id=? OR l.b_id=?", (nid, nid, nid)).fetchall()
    out = []
    for r in rows:
        n = _satir(con.execute(
            "SELECT id,title,kind,archived_at FROM motto_nodes WHERE id=?",
            (r["other"],)).fetchone())
        if n and not n["archived_at"]:
            out.append({"link_id": r["link_id"], "note": r["note"],
                        "id": n["id"], "title": n["title"], "kind": n["kind"]})
    return out


# -------------------------------------------------------------- etiketler

def _etiketle(con, node_id, tags):
    if not tags:
        return
    if isinstance(tags, str):
        tags = re.split(r"[,\s]+", tags)
    for ham in tags:
        t = _etiket_sadelestir(ham)
        if not t:
            continue
        con.execute("INSERT OR IGNORE INTO motto_tags(node_id,tag) VALUES (?,?)",
                    (node_id, t))


def etiketler(con, user="ben"):
    """Butun etiketler ve kac dusuncede gectikleri."""
    return [dict(r) for r in con.execute(
        "SELECT t.tag AS tag, COUNT(*) AS n FROM motto_tags t "
        "JOIN motto_nodes n ON n.id=t.node_id "
        "WHERE n.user=? AND n.archived_at IS NULL "
        "GROUP BY t.tag ORDER BY n DESC, t.tag ASC", (user,)).fetchall()]


# ---------------------------------------------------------------- okuma

def dugum(con, node_id, user="ben"):
    """Tek bir dusunce: govdesi, etiketleri, baglari ve surum gecmisi."""
    n = _satir(con.execute("SELECT * FROM motto_nodes WHERE id=? AND user=?",
                           (int(node_id), user)).fetchone())
    if not n:
        return None
    n["tags"] = [r["tag"] for r in con.execute(
        "SELECT tag FROM motto_tags WHERE node_id=? ORDER BY tag", (n["id"],))]
    n["links"] = baglari(con, n["id"])
    n["versions"] = [dict(r) for r in con.execute(
        "SELECT id,title,body,kind,author,created_at FROM motto_versions "
        "WHERE node_id=? ORDER BY id DESC", (n["id"],))]
    # BEKLEYEN ONERI: uretilen ve henuz onaylanmamis son surum. «Henuz
    # onaylanmamis» demek, ondan SONRA kullanici surumu gelmemis demek.
    n["pending"] = None
    for v in n["versions"]:
        if v["author"] == "uretilen":
            n["pending"] = v
        break
    return n


def agac(con, user="ben", archived=False):
    """Butun agac, dal dal. Ekran cizmek icin duz bir liste doner ve
    `parent_id` ile kurulur: ic ice sozluk uretmek, derinligi bilinmeyen
    bir agaci ekranda yeniden duzlestirmek demekti."""
    q = "SELECT id,parent_id,title,kind,sort,updated_at,archived_at FROM motto_nodes WHERE user=?"
    if not archived:
        q += " AND archived_at IS NULL"
    q += " ORDER BY sort, id"
    dugumler = [dict(r) for r in con.execute(q, (user,)).fetchall()]
    kimlikler = [d["id"] for d in dugumler]
    etiket = {}
    if kimlikler:
        isaret = ",".join("?" * len(kimlikler))
        for r in con.execute("SELECT node_id,tag FROM motto_tags "
                             "WHERE node_id IN (%s)" % isaret, kimlikler):
            etiket.setdefault(r["node_id"], []).append(r["tag"])
    for d in dugumler:
        d["tags"] = sorted(etiket.get(d["id"], []))
    return dugumler


def ilkeler(con, user="ben"):
    """Motto ve temel ilkeler — ana ekranda ayrica gosterilenler."""
    return [dict(r) for r in con.execute(
        "SELECT id,title,body,kind,updated_at FROM motto_nodes "
        "WHERE user=? AND archived_at IS NULL AND kind IN ('motto','ilke') "
        "ORDER BY kind, updated_at DESC", (user,)).fetchall()]


def harita(con, user="ben"):
    """Dusunce haritasi: dugumler ve aralarindaki baglar.

    Agac bagi (`parent_id`) ile akrabalik bagi (`motto_links`) haritada
    AYRI TURDE doner. Ikisini tek cizgi yapmak, kullanicinin kendi
    siniflandirmasi ile dusuncenin akrabaligini ayni sey gostermek
    olurdu — oysa haritanin anlatmaya calistigi sey tam olarak bu
    ikisinin FARKLI olmasi."""
    dugumler = agac(con, user)
    var = set(d["id"] for d in dugumler)
    kenarlar = []
    for d in dugumler:
        if d["parent_id"] in var:
            kenarlar.append({"a": d["parent_id"], "b": d["id"], "tur": "dal"})
    for r in con.execute("SELECT a_id,b_id,note FROM motto_links"):
        if r["a_id"] in var and r["b_id"] in var:
            kenarlar.append({"a": r["a_id"], "b": r["b_id"], "tur": "bag",
                             "note": r["note"]})
    return {"nodes": dugumler, "edges": kenarlar}


def ara(con, q, user="ben", tag=None, kind=None, limit=50):
    """Baslik, govde ve etiket uzerinde arama.

    BUYUK/KUCUK HARF TURKCE KURALINA GORE ESITLENIR (`db.tr_kucuk`).
    SQLite'in kendi `LOWER`i yalniz ASCII'yi kucultur ve «Çalışmak»
    aynen kalir; Python'un `.lower()`i de «İ»yi noktali birakir. Ikisi
    de ayni sonucu verirdi: kullanici kendi yazdigi notu ARARKEN
    bulamaz ve sistem ona «boyle bir sey yok» derdi.

    «dısıplın» ise AYRI bir kelimedir ve uydurulmaz: harf sadelestirme
    yapilmaz, yalnizca buyuk/kucuk esitlenir."""
    from core import db as _db
    metin = str(q or "").strip()
    args = [user]
    sql = ("SELECT DISTINCT n.id,n.title,n.kind,n.body,n.updated_at "
           "FROM motto_nodes n LEFT JOIN motto_tags t ON t.node_id=n.id "
           "WHERE n.user=? AND n.archived_at IS NULL")
    if metin:
        sql += (" AND (tr_kucuk(n.title) LIKE ? OR tr_kucuk(n.body) LIKE ? "
                "OR tr_kucuk(t.tag) LIKE ?)")
        kalip = "%" + _db.tr_kucuk(metin) + "%"
        args += [kalip, kalip, kalip]
    if tag:
        sql += " AND t.tag=?"
        args.append(_etiket_sadelestir(tag))
    if kind:
        if kind not in TURLER:
            return []
        sql += " AND n.kind=?"
        args.append(kind)
    sql += " ORDER BY n.updated_at DESC LIMIT ?"
    args.append(max(1, min(int(limit), 200)))
    out = []
    for r in con.execute(sql, args):
        d = dict(r)
        # Govdenin tamami arama sonucunda tasinmaz: uzun bir dusunce
        # listeyi okunmaz yapar. Ozet ilk satirdir.
        govde = (d.pop("body") or "").strip()
        d["ozet"] = (govde[:160] + "…") if len(govde) > 160 else govde
        out.append(d)
    return out


def ozet(con, user="ben"):
    """Ana ekran icin sayilar. Hicbiri bir YARGI tasimaz: «az yazmissin»
    diye bir olcu yoktur, bu bolum kullaniciyi olcmez."""
    n = con.execute("SELECT COUNT(*) AS n FROM motto_nodes "
                    "WHERE user=? AND archived_at IS NULL", (user,)).fetchone()["n"]
    ilke = con.execute("SELECT COUNT(*) AS n FROM motto_nodes WHERE user=? "
                       "AND archived_at IS NULL AND kind IN ('motto','ilke')",
                       (user,)).fetchone()["n"]
    bag = con.execute("SELECT COUNT(*) AS n FROM motto_links").fetchone()["n"]
    surum = con.execute(
        "SELECT COUNT(*) AS n FROM motto_versions v JOIN motto_nodes m "
        "ON m.id=v.node_id WHERE m.user=?", (user,)).fetchone()["n"]
    return {"dusunce": n, "ilke": ilke, "bag": bag, "surum": surum}
