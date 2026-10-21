# -*- coding: utf-8 -*-
"""King'in arka plan isleri — kalici kuyruk (tablo: king_isler).

   King agir bir isi (alt ajanin raporu, gorevin bir adimi) kuyruga koyar
   ve kullaniciyla konusmaya devam eder; ekranda «King şu an 2 iş yapıyor»
   gorunur. Bes kural:

   1. AYNI ANDA EN COK BIR IS. Yerel model tek GPU'da (6 GB VRAM, 7 GB
      RAM) calisir; iki model isi birbirini bellekten atar. Tek isci ve
      ayrica MODEL_KILIDI: ikinci bir isci acilsa bile ikinci model isi
      bekler.
   2. DURUM KAPALI BIR KUMEDIR: bekliyor → calisiyor → bitti | hata | iptal.
   3. IS KALICIDIR. HKM kapanirsa «calisiyor» kalan is acilista yeniden
      siraya girer; iki kez yarida kalan is «hata» olur (sonsuz dongu yok).
   4. IPTAL SOZDUR. Bekleyen is hemen iptal olur; calisan is adim arasinda
      durur ve sonucu YAZILMAZ.
   5. IS MODULE YAZMAZ. Sonuc bir rapordur; yazma isteyen adim yalniz
      niyet kuyruguna teklif birakir (core/gorev.py)."""
import datetime
import json
import sys
import threading

DURUMLAR = ("bekliyor", "calisiyor", "bitti", "hata", "iptal")
ACIK = ("bekliyor", "calisiyor")
DURUM_AD = {"bekliyor": "Sırada", "calisiyor": "Çalışıyor", "bitti": "Bitti",
            "hata": "Olmadı", "iptal": "İptal edildi"}
TURLER = ("devir", "gorev_adim")
EN_COK_DENEME = 2
EN_COK_BASLIK = 120
ISCI_ARALIK = 30          # saniye; yeni is gelince beklemeden uyanir

MODEL_KILIDI = threading.Lock()
UYAN = threading.Event()         # yeni is: isci beklemeden uyanir


def uyandir():
    UYAN.set()


def _simdi(now=None):
    return now or datetime.datetime.now().isoformat(timespec="seconds")


def _satir(r):
    if not r:
        return None
    d = dict(r)
    for k in ("girdi", "sonuc"):
        try:
            d[k] = json.loads(d[k]) if d.get(k) else ({} if k == "girdi" else None)
        except ValueError:
            d[k] = None
    d["durum_ad"] = DURUM_AD.get(d["durum"], d["durum"])
    d["iptal_istendi"] = bool(d.get("iptal_istendi"))
    return d


def baslat(con, ajan, tur, baslik, girdi=None, gorev_id=None, adim_no=None, now=None):
    if tur not in TURLER:
        raise ValueError("bilinmeyen is turu: %s" % tur)
    t = _simdi(now)
    cur = con.execute(
        "INSERT INTO king_isler(ajan,tur,baslik,girdi,gorev_id,adim_no,created_at,updated_at) "
        "VALUES (?,?,?,?,?,?,?,?)",
        (ajan, tur, str(baslik or "")[:EN_COK_BASLIK], json.dumps(girdi or {}, ensure_ascii=False),
         gorev_id, adim_no, t, t))
    return getir(con, cur.lastrowid)


def getir(con, is_id):
    return _satir(con.execute("SELECT * FROM king_isler WHERE id=?", (is_id,)).fetchone())


def listele(con, durum=None, gorev_id=None, limit=30):
    q, a = "SELECT * FROM king_isler WHERE 1=1", []
    if durum in DURUMLAR:
        q += " AND durum=?"
        a.append(durum)
    elif durum == "acik":
        q += " AND durum IN ('bekliyor','calisiyor')"
    if gorev_id is not None:
        q += " AND gorev_id=?"
        a.append(gorev_id)
    q += " ORDER BY id DESC LIMIT ?"
    a.append(max(1, min(int(limit or 30), 200)))
    return [_satir(r) for r in con.execute(q, a).fetchall()]


def ozet(con):
    """Ekranin tek satiri: «King şu an 2 iş yapıyor». Sayi koddur."""
    say = {d: 0 for d in DURUMLAR}
    for r in con.execute("SELECT durum, COUNT(*) AS n FROM king_isler GROUP BY durum"):
        say[r["durum"]] = r["n"]
    acik = say["calisiyor"] + say["bekliyor"]
    if not acik:
        metin = "King şu an boşta"
    elif say["bekliyor"] and say["calisiyor"]:
        metin = "King şu an %d iş yapıyor (%d çalışıyor, %d sırada)" % (acik, say["calisiyor"], say["bekliyor"])
    else:
        metin = "King şu an %d iş yapıyor" % acik
    calisan = con.execute("SELECT * FROM king_isler WHERE durum='calisiyor' ORDER BY id LIMIT 1").fetchone()
    return {"acik": acik, "calisiyor": say["calisiyor"], "bekliyor": say["bekliyor"],
            "bitti": say["bitti"], "hata": say["hata"], "iptal": say["iptal"], "metin": metin,
            "simdi": _satir(calisan)}


def ilerle(con, is_id, yuzde, adim=None, now=None):
    con.execute("UPDATE king_isler SET ilerleme=?, adim=?, updated_at=? WHERE id=? AND durum='calisiyor'",
                (max(0, min(int(yuzde), 100)), (adim or "")[:160] or None, _simdi(now), is_id))


def iptal_mi(con, is_id):
    r = con.execute("SELECT durum, iptal_istendi FROM king_isler WHERE id=?", (is_id,)).fetchone()
    return not r or r["durum"] == "iptal" or bool(r["iptal_istendi"])


def iptal(con, is_id, now=None):
    t = _simdi(now)
    i = getir(con, is_id)
    if not i:
        return {"ok": False, "error": "iş yok"}
    if i["durum"] == "bekliyor":
        con.execute("UPDATE king_isler SET durum='iptal', finished_at=?, updated_at=? "
                    "WHERE id=? AND durum='bekliyor'", (t, t, is_id))
    elif i["durum"] == "calisiyor":
        # Calisan is adim arasinda durur (iptal_mi); sonucu yazilmaz.
        con.execute("UPDATE king_isler SET iptal_istendi=1, updated_at=? WHERE id=?", (t, is_id))
    else:
        return {"ok": False, "error": "iş zaten kapandı (%s)" % i["durum_ad"], "is": i}
    return {"ok": True, "is": getir(con, is_id)}


def al(con, now=None):
    """En eski bekleyen isi «calisiyor» yapar ve dondurur; yoksa None.
    Kosullu UPDATE: iki isci ayni isi alamaz."""
    t = _simdi(now)
    while True:
        r = con.execute("SELECT id FROM king_isler WHERE durum='bekliyor' ORDER BY id LIMIT 1").fetchone()
        if not r:
            return None
        cur = con.execute("UPDATE king_isler SET durum='calisiyor', deneme=deneme+1, started_at=?, "
                          "updated_at=?, ilerleme=0 WHERE id=? AND durum='bekliyor'", (t, t, r["id"]))
        if cur.rowcount:
            return getir(con, r["id"])


def bitir(con, is_id, sonuc, now=None):
    t = _simdi(now)
    if iptal_mi(con, is_id):
        con.execute("UPDATE king_isler SET durum='iptal', finished_at=?, updated_at=? WHERE id=?",
                    (t, t, is_id))
        return getir(con, is_id)
    con.execute("UPDATE king_isler SET durum='bitti', ilerleme=100, adim=NULL, sonuc=?, finished_at=?, "
                "updated_at=? WHERE id=?", (json.dumps(sonuc, ensure_ascii=False), t, t, is_id))
    return getir(con, is_id)


def hata(con, is_id, mesaj, now=None):
    t = _simdi(now)
    durum = "iptal" if iptal_mi(con, is_id) else "hata"
    con.execute("UPDATE king_isler SET durum=?, adim=NULL, hata=?, finished_at=?, updated_at=? WHERE id=?",
                (durum, str(mesaj or "")[:400], t, t, is_id))
    return getir(con, is_id)


def kurtar(con, now=None):
    """Acilista: yarida kalan is yeniden siraya girer; ikinci kez yarida
    kalan «hata» olur. Doner: (siraya_giren, hataya_dusen)."""
    t = _simdi(now)
    a = con.execute("UPDATE king_isler SET durum='bekliyor', adim=NULL, updated_at=? "
                    "WHERE durum='calisiyor' AND deneme<? AND iptal_istendi=0", (t, EN_COK_DENEME)).rowcount
    b = con.execute("UPDATE king_isler SET durum=CASE WHEN iptal_istendi=1 THEN 'iptal' ELSE 'hata' END, "
                    "hata='HKM kapanırken yarıda kaldı.', finished_at=?, updated_at=? "
                    "WHERE durum='calisiyor'", (t, t)).rowcount
    return a, b


def isle(con, cfg, calistirici, now=None):
    """Bir is alir ve calistirir. `calistirici(con, cfg, is_, ilerle, iptal_mi)`
    raporu (dict) dondurur ya da firlatir. Doner: kapanan is ya da None."""
    with MODEL_KILIDI:
        i = al(con, now=now)
        if not i:
            return None
        try:
            sonuc = calistirici(con, cfg, i,
                                lambda yuzde, adim=None: ilerle(con, i["id"], yuzde, adim),
                                lambda: iptal_mi(con, i["id"]))
        except Exception as e:                      # noqa: BLE001
            return hata(con, i["id"], "%s: %s" % (type(e).__name__, e))
        return bitir(con, i["id"], sonuc)


def isci(srv, calistirici, tik=None, aralik=ISCI_ARALIK):
    """Arka plan iscisi: kendi baglantisi, tek is parcacigi. Firlatmaz.
    `tik(con, cfg)`: her turda (gorevlerin gunu gelen adimlarini siraya koyar)."""
    from core import db
    con = db.connect(srv.db_path)
    kurtar(con)
    while not srv.dur.is_set():
        try:
            if tik:
                tik(con, srv.config)
            while not srv.dur.is_set() and isle(con, srv.config, calistirici):
                pass
        except Exception as e:                      # noqa: BLE001
            sys.stderr.write("[hkm] is kuyrugu: %s\n" % e)
        UYAN.wait(aralik)
        UYAN.clear()
