# -*- coding: utf-8 -*-
"""Eksik veri — TEK soruyla toplamak (kolaylik fikri 9) ve «bir daha sorma» (14).

   Sabah brifingi dunun eksik kalan TEK olcumunu sorar: «Dun uyku kaydi
   yok. Kac saat uyudun? «6» · «7» · «8» · «bilmiyorum»». Cevap tek sayi
   olabilir; hangi soruya ait oldugu `sorular` satirindan bilinir.

   Dort kural:

   1. SAYIYI MODUL OKUR. Cevap «7» ise HKM bunu «uyku 7» cumlesine cevirir
      ve dunun tarihiyle SPI'nin kuyruguna `kayit.add` teklifi birakir; SPI
      kendi koduyla okur, onizler, onayla yazar (patron._kayit_kur).
   2. «BILMIYORUM» BIR CEVAPTIR, SIFIR DEGIL. Dunun olcumu «veri yok»
      kalir; ayni soru o gun icin bir daha sorulmaz.
   3. GUNDE TEK SORU. Birden cok eksik varsa oncelik sirasina gore biri.
      Kullanilmayan modul sorulmaz: son yedi gunde hic kayit gelmediyse
      soru gurultudur, eksik degil.
   4. «BIR DAHA SORMA» TURU SUSTURUR (core/bildirim.py). Acik soru yoksa
      gunun cevaplanmamis onerisinin kuralini susturur; SAGLIK KIRMIZI
      BAYRAGI (bio_red) susturulamaz — o bir tercih degil bir guvenliktir."""

import datetime
import json
import re

from core import bildirim, db
from core import certainty as C

SORULAR = (
    {"anahtar": "eksik:sleep_hours", "modul": "spi", "metrik": "sleep_hours",
     "ad": "Dünkü uyku sorusu", "soru": "Dün uyku kaydı yok. Kaç saat uyudun?",
     "kalip": "uyku %s", "secenekler": ("6", "7", "8")},
    {"anahtar": "eksik:questions", "modul": "ays", "metrik": "questions",
     "ad": "Dünkü soru sayısı sorusu", "soru": "Dün AYS’de soru kaydı yok. Kaç soru çözdün?",
     "kalip": "soru %s", "secenekler": ("20", "40", "60")},
)
SORU_BY = {s["anahtar"]: s for s in SORULAR}
KULLANIM_GUN = 7
SUSTURULAMAZ = ("bio_red",)

BILMIYORUM = re.compile(r"^(bilmiyorum|bilmiyom|bilmem|hatırlamıyorum|hatirlamiyorum|"
                        r"emin değilim|emin degilim)[.!]*$", re.IGNORECASE)
SORMA = re.compile(r"^(bunu )?bir daha sorma[.!]*$|^sorma[.!]*$", re.IGNORECASE)
SAYI = re.compile(r"^(\d{1,4}(?:[.,]\d)?)$")


def _gun(iso, fark):
    return (datetime.date.fromisoformat(iso) + datetime.timedelta(days=fark)).isoformat()


def _kullaniliyor(con, modul, dun):
    r = con.execute("SELECT 1 FROM raw_events WHERE module=? AND date BETWEEN ? AND ? LIMIT 1",
                    (modul, _gun(dun, -(KULLANIM_GUN - 1)), dun)).fetchone()
    return bool(r)


def _eksik_mi(con, modul, metrik, dun):
    govde = db.latest_payloads(con, dun).get(modul)
    if not govde:
        return True
    return C.value_of((govde.get("metrics") or {}).get(metrik)) is None


def sor(con, bugun, kanal=None, now=None):
    """Sorulacak tek soru; yoksa None. Sorulan soru kayda gecer."""
    dun = _gun(bugun, -1)
    for s in SORULAR:
        if bildirim.susturuldu_mu(con, s["anahtar"]):
            continue
        if con.execute("SELECT 1 FROM sorular WHERE anahtar=? AND gun=?",
                       (s["anahtar"], dun)).fetchone():
            continue
        if not _kullaniliyor(con, s["modul"], dun) or not _eksik_mi(con, s["modul"], s["metrik"], dun):
            continue
        t = (now or datetime.datetime.now()).isoformat(timespec="seconds")
        con.execute("INSERT INTO sorular(anahtar, gun, kanal, govde, created_at) VALUES (?,?,?,?,?)",
                    (s["anahtar"], dun, kanal, json.dumps({"modul": s["modul"]}), t))
        secenek = " · ".join("«%s»" % x for x in s["secenekler"] + ("bilmiyorum",))
        return "%s %s\n(Bir daha sorulmasın istersen «bir daha sorma».)" % (s["soru"], secenek)
    return None


def _acik(con, bugun):
    r = con.execute("SELECT * FROM sorular WHERE durum='acik' AND substr(created_at,1,10)=? "
                    "ORDER BY id DESC LIMIT 1", (bugun,)).fetchone()
    return dict(r) if r else None


def _kapat(con, soru_id, durum, now=None):
    t = (now or datetime.datetime.now()).isoformat(timespec="seconds")
    con.execute("UPDATE sorular SET durum=?, answered_at=? WHERE id=?", (durum, t, soru_id))


def _oneri_sustur(con, bugun, now=None):
    """Acik soru yoksa: gunun cevaplanmamis onerisinin kurali."""
    r = con.execute("SELECT * FROM decisions WHERE date=? AND state='proposed' AND key IS NOT NULL "
                    "ORDER BY id DESC LIMIT 1", (bugun,)).fetchone()
    if not r:
        return None
    if r["key"] in SUSTURULAMAZ:
        return ("Bu öneri bir sağlık uyarısı; güvenlik gereği susturulamaz. "
                "«ret» yazarak bugünkü öneriyi reddedebilirsin.")
    bildirim.sustur(con, "oneri:" + r["key"], "Öneri: " + str(r["proposal"])[:80], now=now)
    db.set_decision_state(con, r["id"], "declined",
                          (now or datetime.datetime.now()).isoformat(timespec="seconds"))
    return ("Tamam, bu tür öneriyi bir daha getirmeyeceğim. Bugünkü öneri reddedildi olarak "
            "kaydedildi. HKM › Ayarlar › Otomatik mesajlar’dan geri açabilirsin.")


def cevap(con, metin, bugun, now=None):
    """Acik soruya ya da «bir daha sorma»ya cevap; ilgisizse None."""
    ham = " ".join(str(metin or "").strip().split())
    if not ham:
        return None
    s = _acik(con, bugun)
    if SORMA.match(ham):
        if s:
            tanim = SORU_BY.get(s["anahtar"], {})
            bildirim.sustur(con, s["anahtar"], tanim.get("ad", s["anahtar"]), now=now)
            _kapat(con, s["id"], "susturuldu", now)
            return ("Tamam, «%s»nu bir daha sormayacağım. HKM › Ayarlar › Otomatik "
                    "mesajlar’dan geri açabilirsin." % tanim.get("ad", "bu soru"))
        return _oneri_sustur(con, bugun, now) or "Susturulacak açık bir soru ya da öneri yok."
    if not s:
        return None
    tanim = SORU_BY.get(s["anahtar"])
    if not tanim:
        return None
    if BILMIYORUM.match(ham):
        _kapat(con, s["id"], "bilinmiyor", now)
        return ("Tamam; %s günü için bu ölçüm «veri yok» olarak kalır — sıfır sayılmaz ve "
                "bugün bir daha sorulmaz." % s["gun"])
    m = SAYI.match(ham)
    if not m:
        return None
    from core import patron
    bild = {"offset": None, "parcalar": [{"modul": tanim["modul"],
                                            "metin": tanim["kalip"] % m.group(1)}]}
    metin_ = patron._kayit_kur(con, bild, s["gun"],
                               (now or datetime.datetime.now()).isoformat(timespec="seconds"))
    _kapat(con, s["id"], "cevaplandi", now)
    return metin_

