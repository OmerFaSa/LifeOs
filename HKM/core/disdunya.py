# -*- coding: utf-8 -*-
"""DIS DUNYA — King'in bilgisayara ve telefona dokunan isleri (KING-4 §E, §G).

   Uc kademe (§G): okuma serbest, yazma onayli, DIS DUNYA ayrica izinli.

   1. HER YETENEK AYRI IZIN. config `dis_dunya` = {dosya, uygulama, ekran,
      telefon}; hepsi varsayilan KAPALI. Izni depo sahibi verir (King'de
      «Onaylıyorum» karti → POST /api/dis/izin).
   2. HER EYLEM ONAYLI. Istemci araci (king-arac.js) once onizler, kullanici
      onaylar; HKM izni yine denetler (istemciye guvenmez).
   3. HER EYLEM DEFTERDE (core/eylem.py). Acilan dosya ve uygulama
      zorlamasiz kapatilarak geri alinir (yalniz bizim baslattigimiz surec);
      telefon mesaji GERI_PENCERE boyunca giden kutusunda bekler, o surede
      geri alinirsa hic gitmez. Ekran okuma bir sey degistirmez: satir
      «kalıcı» gorunur ama yine yazilir.
   4. PLATFORM KATMANI sistem/bilgisayar.py (Windows). Yoksa yetenek «bu
      makinede yok» der; uydurma basari yoktur."""
import datetime
import os
import sys

from core import channels, eylem, outbox

IZINLER = {"dosya": "dosya ve klasör açma", "uygulama": "uygulama başlatma",
           "ekran": "ekrandaki metni okuma", "telefon": "telefona mesaj ve sesli özet"}
ISLER = {"ac": "dosya", "baslat": "uygulama", "ekran": "ekran", "telefon": "telefon"}
METIN_KANALI = ("telegram", "whatsapp")
GERI_PENCERE = 60                      # saniye: telefon mesaji bu kadar bekler, geri alinabilir
EN_COK_MESAJ = 1500
PLATFORM = None                        # testler sahte katman koyar


def izinler(cfg):
    d = cfg.get("dis_dunya") if isinstance(cfg.get("dis_dunya"), dict) else {}
    return {k: d.get(k) is True for k in IZINLER}


def izin_ver(cfg, ad, acik):
    """(yeni_cfg, hata). cfg degismez; kaydetmek cagiranin isi."""
    if ad not in IZINLER:
        return None, "bilinmeyen izin: %s" % ad
    if not isinstance(acik, bool):
        return None, "acik true/false olmali"
    yeni = dict(cfg)
    yeni["dis_dunya"] = dict(izinler(cfg), **{ad: acik})
    return yeni, None


def platform():
    if PLATFORM is not None:
        return PLATFORM
    if os.name != "nt":
        return None
    kok = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "sistem")
    if not os.path.isfile(os.path.join(kok, "bilgisayar.py")):
        return None
    if kok not in sys.path:
        sys.path.append(kok)
    import bilgisayar
    return bilgisayar


def kanal(cfg):
    return next((k for k in METIN_KANALI if channels.enabled(cfg, k)), None)


def durum(cfg):
    return {"izinler": izinler(cfg), "adlar": IZINLER, "bilgisayar": platform() is not None,
            "telefon": kanal(cfg)}


def uygula(con, cfg, is_, govde, now=None):
    """POST /api/dis/<is>. {ok, metin, eylem?} ya da {ok:False, note, izin?}."""
    g = govde if isinstance(govde, dict) else {}
    iz = ISLER.get(is_)
    if not iz:
        return {"ok": False, "note": "Böyle bir iş yok."}
    if not izinler(cfg)[iz]:
        return {"ok": False, "izin": iz,
                "note": "«%s» izni kapalı. «%s iznini ver» dersen açarım." % (IZINLER[iz], IZINLER[iz])}
    if is_ == "telefon":
        return _telefon(con, cfg, g, now)
    B = platform()
    if B is None:
        return {"ok": False, "note": "Bu makinede bilgisayar araçları yok (yalnız Windows'taki Merkez'de)."}
    if is_ == "ekran":
        r = B.ekran_oku()
        if not r.get("ok"):
            return {"ok": False, "note": "Ekranı okuyamadım: %s" % r.get("hata")}
        eid = eylem.kaydet(con, "dis.ekran", "Ekran okundu (%d harf)" % len(r["metin"]), now=now)
        return {"ok": True, "metin": r["metin"], "eylem": eid}
    hedef = str(g.get("yol" if is_ == "ac" else "ad") or "").strip()
    r = B.ac(hedef) if is_ == "ac" else B.baslat(hedef)
    if not r.get("ok"):
        ek = " Hangisi: %s?" % ", ".join(r["adaylar"][:5]) if r.get("adaylar") else ""
        return {"ok": False, "note": "%s%s" % (r.get("hata") or "Olmadı.", ek), "adaylar": r.get("adaylar")}
    ad = os.path.basename(hedef.rstrip("\\/")) or hedef if is_ == "ac" else r.get("ad") or hedef
    pid = r.get("pid")
    eid = eylem.kaydet(con, "dis." + is_, ("Açıldı: " if is_ == "ac" else "Başlatıldı: ") + ad,
                       {"hkm": "bilgisayar", "pid": pid} if pid else None, {"hedef": hedef}, now=now)
    return {"ok": True, "metin": "%s %s." % (ad, "açıldı" if is_ == "ac" else "başlatıldı"), "eylem": eid}


def _telefon(con, cfg, g, now):
    metin = " ".join(str(g.get("metin") or "").split())[:EN_COK_MESAJ]
    if not metin:
        return {"ok": False, "note": "Gönderilecek metin yok."}
    k = kanal(cfg)
    if not k:
        return {"ok": False, "note": "Telefona giden kanal kurulu değil: Merkez › Kanallar'da Telegram'ı aç."}
    sesli = g.get("sesli") is True
    t = now or datetime.datetime.now()
    r = outbox.enqueue(con, k, "king:telefon:%s" % t.strftime("%H%M%S%f"), t.date().isoformat(), metin,
                       ek={"ses": True} if sesli else None, now=t)
    oid = r["row"]["id"]
    con.execute("UPDATE outbox SET next_at=? WHERE id=?",
                (outbox._iso(t + datetime.timedelta(seconds=GERI_PENCERE)), oid))
    con.commit()
    eid = eylem.kaydet(con, "dis.telefon", ("Telefona sesli özet: " if sesli else "Telefona mesaj: ") + metin[:120],
                       {"hkm": "telefon", "outbox": oid}, {"sesli": sesli}, kanal=k, now=t)
    return {"ok": True, "eylem": eid,
            "metin": "%d sn içinde telefona gidiyor; o zamana dek «Geri al» ile durdurabilirsin." % GERI_PENCERE}


def geri(con, g):
    """eylem.geri_al'in isleyicisi: True ya da neden (metin)."""
    if g.get("hkm") == "telefon":
        cur = con.execute("UPDATE outbox SET state='iptal', last_error='geri alındı' "
                          "WHERE id=? AND state IN ('queued','failed')", (g.get("outbox"),))
        con.commit()
        return True if cur.rowcount else "Mesaj telefona gitti; oradan geri alınamaz."
    B = platform()
    if B is None:
        return "Bu makinede bilgisayar araçları yok."
    r = B.kapat(g.get("pid"))
    return True if r.get("ok") else "Pencere kapatılamadı (Merkez yeniden başladı ya da pencere zaten kapalı)."
