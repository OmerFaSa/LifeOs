# -*- coding: utf-8 -*-
"""Hedef agi — uc modulun etkin hedefleri tek resimde ve ZAMAN BUTCESI.
   (ekip/PLAN.md §3.A «Zaman butcesi», §3.H «Hedefler panosu»)

   Uc modul kendi hedefini kendi kuraliyla kurar ve birbirini gormez
   (AGENTS.md §1.4). Ama uc hedef AYNI GUNU paylasir: AYS konu bitirme
   haftada 7 saat, ESP dil hedefi haftada 5 saat isterken kullanicinin
   haftada 10 saati varsa, bunu yalniz merkez gorebilir.

   Bes kural:

   1. HKM MODULE YAZMAZ. Modul etkin hedeflerinin OZETINI yollar
      (anlik goruntu, tamami); HKM kopyasini esitler. Ayni goruntu iki
      kez gelirse hicbir sey degismez.
   2. OZET, HEDEFIN KENDISI DEGILDIR. Yalniz pano ve butce icin gereken
      alanlar gelir, kurala gore suzulur; fazlasi atilir.
   3. KARARI KOD VERIR. Talep = etkin hedeflerin haftalik vakti (gunluk
      dakika x haftada gun); vakit = kullanicinin beyan ettigi toplam.
      Sigar / sikisik (vaktin 1,25 katina kadar) / sigmaz. Cumle koddur.
   4. EKSIK VERI SIFIR DEGILDIR. Vakti bilinmeyen hedef (SPI kilo hedefi
      gibi saat istemeyen) toplama 0 ile girmez; «hesaba katilmadi» diye
      ADIYLA soylenir. Kullanicinin toplam vakti bilinmiyorsa karar
      verilmez ve bu soylenir.
   5. SECIM KULLANICININDIR. Sigmiyorsa secenekler sayilir (askiya al,
      tarihi uzat, vakti artir); King hicbirini kendisi yapmaz."""
import datetime
import json
import re

MODULLER = ("ays", "spi", "esp")
MODUL_AD = {"ays": "AYS", "spi": "SPİ", "esp": "ESP"}
MAX_HEDEF = 30
SIKISIK_KAT = 1.25
DURUMLAR = ("aktif", "askida")
BANTLAR = ("gercekci", "zorlayici", "gercekci_degil", "guvensiz")
# 112 cakisma — dilim duzeyinde (kullanici karari 2026-09-25): saat yok,
# hedefin vakti gunun hangi DILIMINDE. Iki FARKLI modulun etkin hedefi ayni
# dilimi istiyorsa cakisma; cozum kullanicinin (kart yalniz gosterir).
DILIMLER = ("sabah", "ogle", "aksam", "gece")
DILIM_ADI = {"sabah": "sabah", "ogle": "öğle", "aksam": "akşam", "gece": "gece"}
ETIKETLER = ("olculdu", "tahmin", "hesaplandi", "veri_yok")
ILERLEME = ("yolunda", "onde", "geride", "veri_yok")
ISO = re.compile(r"^\d{4}-\d{2}-\d{2}$")
GUNLUK_DK = (15, 1200)


def _simdi(now=None):
    return now or datetime.datetime.now().isoformat(timespec="seconds")


def _metin(x, en_cok):
    t = str(x or "").strip()
    return t[:en_cok] if t else None


def _tam(x, alt, ust):
    try:
        n = int(x)
    except (TypeError, ValueError):
        return None
    return n if alt <= n <= ust else None


def _yaz(x):
    """Sayiyi Turkce yazar: 3.5 -> «3,5», 7.0 -> «7»."""
    s = ("%.1f" % x).rstrip("0").rstrip(".")
    return s.replace(".", ",")


# ------------------------------------------------------------ esitleme

def temizle(h):
    """Modulden gelen ozeti kurala gore suzer; bozuksa None."""
    if not isinstance(h, dict):
        return None
    id_ = _metin(h.get("id"), 40)
    ozet = _metin(h.get("ozet"), 160)
    if not id_ or not ozet or h.get("durum") not in DURUMLAR:
        return None
    out = {"id": id_, "ozet": ozet, "durum": h["durum"],
           "paket": _metin(h.get("paket"), 20) or "?"}
    t = str(h.get("son_tarih") or "")
    out["son_tarih"] = t if ISO.match(t) else None
    k = h.get("kapasite") if isinstance(h.get("kapasite"), dict) else {}
    dk = _tam(k.get("gunluk_dk"), 1, 1440)
    out["kapasite"] = ({"gunluk_dk": dk, "haftalik_gun": _tam(k.get("haftalik_gun"), 1, 7) or 7}
                       if dk else None)
    if dk and k.get("dilim") in DILIMLER:
        out["kapasite"]["dilim"] = k["dilim"]
    g = h.get("gerceklik") if isinstance(h.get("gerceklik"), dict) else {}
    out["gerceklik"] = ({"bant": g["bant"], "etiket": g.get("etiket")
                         if g.get("etiket") in ETIKETLER else "tahmin"}
                        if g.get("bant") in BANTLAR else None)
    p = h.get("plan") if isinstance(h.get("plan"), dict) else None
    if p:
        il = p.get("ilerleme") if isinstance(p.get("ilerleme"), dict) else {}
        b = str(p.get("bitis") or "")
        out["plan"] = {"bitis": b if ISO.match(b) else None,
                       "ilerleme": {"durum": il.get("durum") if il.get("durum") in ILERLEME
                                    else "veri_yok",
                                    "metin": _metin(il.get("metin"), 300)}}
    else:
        out["plan"] = None
    return out


def esitle(con, modul, hedefler, now=None):
    """Modulun hedef ozetlerinin ANLIK GORUNTUSUNU esitler.

    Modulde olmayan ozet duser (hedef bitti ya da birakildi). Bozuk ozet
    reddedilir ve SAYILIR. Oku-sonra-yaz tek islemdir (bkz. memory.esitle)."""
    if modul not in MODULLER:
        return {"ok": False, "note": "Bilinmeyen modül."}
    if not isinstance(hedefler, list):
        return {"ok": False, "note": "Hedefler liste olmalı."}
    if len(hedefler) > MAX_HEDEF:
        return {"ok": False, "note": "Bir modül en fazla %d hedef yollayabilir." % MAX_HEDEF}
    at = _simdi(now)
    kendi = not con.in_transaction
    if kendi:
        con.execute("BEGIN IMMEDIATE")
    try:
        var = {r["dis_id"]: r["govde"] for r in con.execute(
            "SELECT dis_id, govde FROM hedef_ozet WHERE modul=?", (modul,)).fetchall()}
        gelen, yazilan, reddedilen = set(), 0, 0
        for ham in hedefler:
            h = temizle(ham)
            if not h or h["id"] in gelen:
                reddedilen += 1
                continue
            gelen.add(h["id"])
            govde = json.dumps(h, ensure_ascii=False, sort_keys=True)
            if var.get(h["id"]) == govde:
                continue
            con.execute("INSERT OR REPLACE INTO hedef_ozet(modul, dis_id, govde, guncelleme) "
                        "VALUES (?,?,?,?)", (modul, h["id"], govde, at))
            yazilan += 1
        dusen = [d for d in var if d not in gelen]
        for d in dusen:
            con.execute("DELETE FROM hedef_ozet WHERE modul=? AND dis_id=?", (modul, d))
        if kendi:
            con.execute("COMMIT")
    except Exception:
        if kendi:
            con.execute("ROLLBACK")
        raise
    return {"ok": True, "yazilan": yazilan, "reddedilen": reddedilen, "dusen": len(dusen),
            "toplam": len(gelen)}


def yarin_yaz(con, modul, yarin, now=None):
    """Modulun yarin icin ilk islerinin anlik goruntusu. Bozuksa YAZILMAZ."""
    if modul not in MODULLER or not isinstance(yarin, dict):
        return {"ok": False, "note": "Yarın özeti bir nesne olmalı."}
    gun = str(yarin.get("gun") or "")
    try:
        datetime.date.fromisoformat(gun)
    except ValueError:
        return {"ok": False, "note": "Yarın özetinin günü geçersiz."}
    isler = []
    ham = yarin.get("isler") if isinstance(yarin.get("isler"), list) else []
    for x in ham[:5]:
        if not isinstance(x, dict):
            continue
        metin = _metin(x.get("metin"), 80)
        dk = x.get("dk")
        dk = dk if isinstance(dk, int) and not isinstance(dk, bool) and 0 < dk <= 960 else None
        if metin:
            isler.append({"metin": metin, "dk": dk})
    con.execute("INSERT OR REPLACE INTO yarin_ozet(modul, gun, isler, guncelleme) VALUES (?,?,?,?)",
                (modul, gun, json.dumps(isler, ensure_ascii=False), _simdi(now)))
    return {"ok": True, "adet": len(isler)}


def yarin_oku(con, gun):
    """{modul: [isler]} — yalniz o GUNE ait goruntu; eskisi yok sayilir."""
    out = {}
    for r in con.execute("SELECT modul, isler FROM yarin_ozet WHERE gun=?", (gun,)).fetchall():
        try:
            out[r["modul"]] = json.loads(r["isler"])
        except ValueError:
            continue
    return out


DILKART_EN_COK = 5
DILKART_ESKI_GUN = 1


def dilkart_yaz(con, modul, veri, now=None):
    """Gunun dil karti (fikir 38). Yalniz ESP yazar; kartlari ESP secer.
    Bozuk kart atlanir, bozuk govde YAZILMAZ."""
    if modul != "esp" or not isinstance(veri, dict):
        return {"ok": False, "note": "Dil kartı yalnız ESP’den gelir."}
    gun = str(veri.get("gun") or "")
    try:
        datetime.date.fromisoformat(gun)
    except ValueError:
        return {"ok": False, "note": "Dil kartının günü geçersiz."}
    kartlar = []
    ham = veri.get("kartlar") if isinstance(veri.get("kartlar"), list) else []
    for x in ham:
        if len(kartlar) >= DILKART_EN_COK:
            break
        if not isinstance(x, dict):
            continue
        on, arka = _metin(x.get("on"), 80), _metin(x.get("arka"), 80)
        if on and arka:
            kartlar.append({"on": on, "arka": arka})
    con.execute("INSERT OR REPLACE INTO dil_karti(modul, gun, kartlar, guncelleme) VALUES (?,?,?,?)",
                (modul, gun, json.dumps(kartlar, ensure_ascii=False), _simdi(now)))
    return {"ok": True, "adet": len(kartlar)}


def dilkart_oku(con, gun):
    """{gun, kartlar, eski} — liste bugunun ya da dunun degilse None."""
    r = con.execute("SELECT gun, kartlar FROM dil_karti WHERE modul='esp'").fetchone()
    if not r:
        return None
    try:
        fark = (datetime.date.fromisoformat(gun) - datetime.date.fromisoformat(r["gun"])).days
        kartlar = json.loads(r["kartlar"])
    except ValueError:
        return None
    if fark > DILKART_ESKI_GUN or not kartlar:
        return None
    return {"gun": r["gun"], "kartlar": kartlar, "eski": fark > 0}


def tatil_yaz(con, modul, tatil, now=None):
    """Modulun tatil tarihi. None: silinir (tatil yok)."""
    if modul not in MODULLER:
        return {"ok": False, "note": "Bilinmeyen modül."}
    if tatil is None:
        con.execute("DELETE FROM tatil_ozet WHERE modul=?", (modul,))
        return {"ok": True, "tatil": None}
    if not isinstance(tatil, dict):
        return {"ok": False, "note": "Tatil bir nesne olmalı."}
    try:
        bas = datetime.date.fromisoformat(str(tatil.get("bas")))
        bit = datetime.date.fromisoformat(str(tatil.get("bit")))
    except ValueError:
        return {"ok": False, "note": "Tatil tarihi geçersiz."}
    if bit < bas or (bit - bas).days > 30:
        return {"ok": False, "note": "Tatil aralığı geçersiz."}
    con.execute("INSERT OR REPLACE INTO tatil_ozet(modul, bas, bit, donus_planli, guncelleme) "
                "VALUES (?,?,?,?,?)", (modul, bas.isoformat(), bit.isoformat(),
                                       1 if tatil.get("donus_planli") else 0, _simdi(now)))
    return {"ok": True, "tatil": {"bas": bas.isoformat(), "bit": bit.isoformat()}}


def tatilde(con, gun):
    """O gun tatilde olan moduller ve en gec bitis: {moduller, bit} ya da None."""
    rows = con.execute("SELECT modul, bit FROM tatil_ozet WHERE bas<=? AND bit>=?",
                       (gun, gun)).fetchall()
    if not rows:
        return None
    return {"moduller": [r["modul"] for r in rows], "bit": max(r["bit"] for r in rows)}


def donenler(con, gun):
    """Tatili DUN biten moduller: [(modul, donus_planli)]."""
    dun = (datetime.date.fromisoformat(gun) - datetime.timedelta(days=1)).isoformat()
    return [(r["modul"], bool(r["donus_planli"])) for r in con.execute(
        "SELECT modul, donus_planli FROM tatil_ozet WHERE bit=?", (dun,)).fetchall()]


def hedefler(con):
    out = []
    for r in con.execute("SELECT modul, govde, guncelleme FROM hedef_ozet "
                         "ORDER BY modul, guncelleme").fetchall():
        try:
            h = json.loads(r["govde"])
        except ValueError:
            continue
        h["modul"], h["guncelleme"] = r["modul"], r["guncelleme"]
        out.append(h)
    return out


# ------------------------------------------------------------ zaman

def zaman(con):
    r = con.execute("SELECT gunluk_dk, haftalik_gun, updated_at FROM zaman_butcesi "
                    "WHERE id=1").fetchone()
    return dict(r) if r else None


def zaman_yaz(con, gunluk_dk, haftalik_gun=7, now=None):
    dk = _tam(gunluk_dk, *GUNLUK_DK)
    gun = _tam(haftalik_gun if haftalik_gun is not None else 7, 1, 7)
    if dk is None:
        return {"ok": False, "note": "Günlük vakit %d ile %d dakika arasında olmalı." % GUNLUK_DK}
    if gun is None:
        return {"ok": False, "note": "Haftada gün 1 ile 7 arasında olmalı."}
    con.execute("INSERT OR REPLACE INTO zaman_butcesi(id, gunluk_dk, haftalik_gun, updated_at) "
                "VALUES (1,?,?,?)", (dk, gun, _simdi(now)))
    return {"ok": True, "zaman": zaman(con)}


def _haftalik(kap):
    return kap["gunluk_dk"] * (kap.get("haftalik_gun") or 7) / 60.0


def cakismalar(etkin):
    """Ayni dilimi isteyen, FARKLI modullerin etkin hedef ciftleri (en cok 3).
    Dilimi bilinmeyen hedef hic eslesmez: bilinmeyen, bilinmeyen kalir."""
    out = []
    dilimli = [h for h in etkin if (h.get("kapasite") or {}).get("dilim") in DILIMLER]
    for i, a in enumerate(dilimli):
        for b in dilimli[i + 1:]:
            if a["modul"] == b["modul"] or a["kapasite"]["dilim"] != b["kapasite"]["dilim"]:
                continue
            taraf = lambda h: {"modul": h["modul"], "modul_adi": MODUL_AD[h["modul"]], "ad": h["ozet"],
                               "dilim": h["kapasite"]["dilim"], "gunluk_dk": h["kapasite"]["gunluk_dk"]}
            out.append({"dilim": a["kapasite"]["dilim"], "dilim_adi": DILIM_ADI[a["kapasite"]["dilim"]],
                        "a": taraf(a), "b": taraf(b)})
    return out[:3]


def butce(con):
    """Zaman butcesinin kararini ve cumlesini KOD kurar."""
    etkin = [h for h in hedefler(con) if h["durum"] == "aktif"]
    askida = [h for h in hedefler(con) if h["durum"] == "askida"]
    sayilan = [h for h in etkin if h.get("kapasite")]
    bilinmeyen = [h for h in etkin if not h.get("kapasite")]
    modul_saat = {}
    for h in sayilan:
        modul_saat[h["modul"]] = modul_saat.get(h["modul"], 0) + _haftalik(h["kapasite"])
    talep = round(sum(modul_saat.values()), 2)
    z = zaman(con)
    out = {"talep": talep, "vakit": None, "bant": None, "etiket": "veri_yok",
           "modul_saat": {m: round(v, 2) for m, v in modul_saat.items()},
           "sayilan": len(sayilan), "bilinmeyen": [
               {"modul": h["modul"], "ozet": h["ozet"]} for h in bilinmeyen],
           "askida": len(askida), "zaman": z, "cakismalar": cakismalar(etkin)}
    parca = []
    dagilim = " · ".join("%s %s" % (MODUL_AD[m], _yaz(v)) for m, v in sorted(modul_saat.items()))
    if not etkin:
        out["metin"] = "Etkin bir hedefin yok; zaman bütçesi hesaplanacak bir şey yok."
        return out
    if sayilan:
        parca.append("Etkin %d hedefin haftada %s saat istiyor (%s)." % (
            len(sayilan), _yaz(talep), dagilim))
    if not z:
        parca.append("Günde toplam ne kadar vaktin olduğunu bilmiyorum; bilmeden «sığar» ya da "
                     "«sığmaz» diyemem. HKM › Hedefler’de günlük vaktini yazabilirsin.")
    elif sayilan:
        vakit = round(_haftalik(z), 2)
        out["vakit"], out["etiket"] = vakit, "tahmin"
        fark = round(vakit - talep, 2)
        if talep <= vakit + 1e-9:
            out["bant"] = "sigar"
            parca.append("Senin vaktin haftada %s saat; sığıyor%s." % (
                _yaz(vakit), (", %s saat payın var" % _yaz(fark)) if fark > 0 else ""))
        else:
            out["bant"] = "sikisik" if talep <= vakit * SIKISIK_KAT + 1e-9 else "sigmaz"
            parca.append("Senin vaktin haftada %s saat; %s: %s saat açık var." % (
                _yaz(vakit), "sıkışık" if out["bant"] == "sikisik" else "sığmıyor", _yaz(-fark)))
            parca.append("Seçenekler: bir hedefi askıya al, bir hedefin tarihini uzat ya da "
                         "günlük vaktini artır. Seçim senin.")
    if bilinmeyen:
        parca.append("%d hedefin haftalık vakti bilinmiyor, hesaba katılmadı: %s." % (
            len(bilinmeyen), "; ".join("%s: %s" % (MODUL_AD[h["modul"]], h["ozet"])
                                       for h in bilinmeyen[:4])))
    if z and sayilan:
        parca.append("Vakit senin beyanın olduğu için karar «tahmin»dir.")
    out["metin"] = " ".join(parca)
    return out


def pano(con, bugun=None):
    """HKM › Hedefler: uc modulun etkin hedefleri, butce ve YARININ isleri
    (modullerin sectigi; aksam ozetinin kaynagi)."""
    l = hedefler(con)
    gun = datetime.date.fromisoformat(bugun) if bugun else datetime.date.today()
    yarin = (gun + datetime.timedelta(days=1)).isoformat()
    return {"hedefler": l, "butce": butce(con),
            "moduller": {m: len([h for h in l if h["modul"] == m]) for m in MODULLER},
            "yarin": {"gun": yarin, "isler": yarin_oku(con, yarin)}}
