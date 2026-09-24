"""Yonetici — karar URETMEZ, karar TASIR (MIMARI.md §3, Faz 3).

   VP'ler saf kural motorudur; oncelik sirasi da kuraldir. Yoneticinin isi
   bu ikisinin sonucunu TEK BIR brifinge cevirmek, kaynagini yaninda
   tasimak ve kullanicinin onayini beklemektir.

   Dort kural bu dosyayi yonetir:

   1. KURAL MOTORU OTORITEDIR. Bu modul bir model katmani IMPORT ETMEZ.
      Bir dil modeli eklenecekse yeri burasi degil, bu brifingi cumleye
      cevirecek ayri bir katmandir — ve o katman sayi uretemez, yalnizca
      burada uretilmis sayiyi yeniden ifade edebilir.

   2. CUMLE EMIR DEGIL ONERIDIR. Uretilen her satir buyurgan kelime
      denetcisinden gecer. Gecemeyen satir SESSIZCE DUZELTILMEZ: dusurulur
      ve dusuruldugu brifingde yazar. Bu depodaki kanitlanmis desen
      reddet-ve-dus'tur; sessiz yeniden yazim anlami tersine cevirebilir.

   3. GUNDE TEK ONERI. Ikinci bir oneri, birincinin onceligini yok eder.
      Oncelik sirasi zaten «ustteki alttakini yener» demek icin var.

   4. KAYNAK GORUNUR. Her oneri, hangi VP denetimlerinden dogdugunu
      decision_sources'ta tasir. Kaynagini gosteremeyen bir oneri sonradan
      denetlenemez; denetlenemeyen bir katman da guvenilemez.
"""

import datetime
import re

from core import certainty as C
from core import cross, db, precedence, streak, sync_engine, twin

# --- buyurgan kip denetcisi -------------------------------------------------
# TAM KELIME aranir: «kapatmani oneririm» bir oneridir, «kapat» degil.
# Yanlis oten bir denetci, denetledigi hatadan pahaliya mal olur.
IMPERATIVE_WORDS = ("zorunlu", "kapat", "yasak", "mecbur", "zorundasin",
                    "kilindi", "derhal", "hemen")
_TR_W = "A-Za-zCGIOSUcgiosuçğıiöşüÇĞİÖŞÜ0-9_"
IMPERATIVE_RE = re.compile(
    "(?<![%s])(?:%s)(?![%s])" % (_TR_W, "|".join(IMPERATIVE_WORDS), _TR_W),
    re.IGNORECASE)

VERDICT_TEXT = {
    "APPROVED": "ölçülmüş veriler eşikleri geçti",
    "INCOMPLETE": "hüküm verecek veri yok",
    "ANOMALY": "ölçülmüş bir değer eşiği kırdı",
}

VP_LABEL = {"academic": "AYS", "bio": "SPİ", "intellect": "ESP"}
# Isaret govdeleri MODUL kimligiyle gelir (ays/spi/esp), VP kimligiyle
# degil. Ikisini tek sozlukte toplamak, bir gun birinin otekinin
# anahtariyla aranmasi demekti.
MODUL_LABEL = {"ays": "AYS", "spi": "SPİ", "esp": "ESP"}

# KONSEY — kimin ne hakkinda konustugu.
#
# Uc alt patron (VP) vardir ve her biri YALNIZ kendi alanina bakar: biri
# otekinin verisini gormez, goremedigi bir sey hakkinda hukum vermez. Uc
# hukum catistiginda kimse tartismaz; sirayi precedence.PRECEDENCE soyler
# ve gunun tek cumlesini Buyuk Patron tasir.
#
# Bu sozluk bir sunum katmanidir ve EKRANA CIKAR: kullanicinin «bunu kim
# soyledi ve kim susturuldu» sorusunun cevabi, hiyerarsi gorunmeden
# verilemez.
KONSEY = [
    {"vp": "bio", "module": "spi", "title": "Biyolojik sermaye",
     "scope": "uyku, toparlanma, HRV"},
    {"vp": "academic", "module": "ays", "title": "Akademik hedef",
     "scope": "soru, çalışma süresi, net"},
    {"vp": "intellect", "module": "esp", "title": "Entelektüel gelişim",
     "scope": "kalıcılık, pratik, sentez"},
]


def council(audits, prop):
    """Konseyin o gunku hali: kim ne dedi, kim duyuldu.

    «Duyuldu» kelimesi dikkatle secildi: duyulmayan VP yanilmis degildir,
    sirasi gelmemistir. Bir VP'nin susturulmasi onun bulgusunu silmez —
    bulgu yerinde durur ve ertesi gun yine sayilir."""
    duyulan = (prop or {}).get("vp")
    out = []
    for uye in KONSEY:
        a = audits.get(uye["vp"])
        bulgular = (a or {}).get("findings") or []
        out.append({
            "vp": uye["vp"],
            "module": uye["module"],
            "module_label": VP_LABEL.get(uye["vp"], uye["vp"]),
            "title": uye["title"],
            "scope": uye["scope"],
            "verdict": (a or {}).get("verdict"),
            "verdict_text": VERDICT_TEXT.get((a or {}).get("verdict"),
                                             "bu modülden veri gelmedi"),
            "findings": len(bulgular),
            "first": bulgular[0]["text"] if bulgular else None,
            "heard": bool(duyulan) and uye["vp"] == duyulan,
        })
    return {"members": out, "heard": duyulan,
            "rank": (prop or {}).get("rank"),
            "label": (prop or {}).get("label"),
            "note": "Üç alt patron yalnız kendi alanına bakar; çelişkiyi "
                    "tartışma değil SIRA çözer. Duyulmayan bir VP yanılmış "
                    "değildir, sırası gelmemiştir — bulgusu silinmez."}

# Brifing bir liste degil bir OZETTIR: iki capraz bulgudan fazlasi,
# okunmayan bir rapor uretir.
CAPRAZ_SATIR = 2
SERI_SATIR = 2


def imperatives(text):
    """Metindeki buyurgan kelimeler. Bos liste = cumle oneri kipinde."""
    return [m.group(0) for m in IMPERATIVE_RE.finditer(text or "")]


def advisory(text):
    return not imperatives(text)


def _line(text, kind, **extra):
    d = {"kind": kind, "text": text}
    d.update(extra)
    return d


def _vp_line(vp, audit):
    ad = VP_LABEL.get(vp, vp)
    if not audit:
        return _line("%s: bugün bu modülden veri gelmedi. Sessizlik bir ölçüm "
                     "değildir; bu satır bir yargı taşımaz." % ad, "vp",
                     vp=vp, verdict=None)
    bulgular = audit.get("findings") or []
    ozet = VERDICT_TEXT.get(audit["verdict"], audit["verdict"])
    if audit.get("suruyor") and audit["verdict"] == "INCOMPLETE":
        # HATALAR O-9: kismi gun «veri yok» degildir, «henuz bitmedi»dir.
        ozet = "gün sürüyor; günlük taban gün kapanınca yargılanır"
    metin = "%s: %s." % (ad, ozet)
    if bulgular:
        ilk = bulgular[0]
        etiket = C.EKRAN.get(ilk.get("cert"), ilk.get("cert") or "veri yok")
        metin += " %s (%s)" % (ilk["text"], etiket)
        if len(bulgular) > 1:
            metin += " · %d bulgu daha" % (len(bulgular) - 1)
    return _line(metin, "vp", vp=vp, verdict=audit["verdict"],
                 findings=len(bulgular))


def _coverage_line(t):
    c = t["coverage"]
    if not c["total"]:
        return _line("Son %d günde hiçbir modülden etiketli metrik gelmedi; "
                     "bu brifing bir şey ölçmüyor." % t["days"], "coverage")
    return _line(
        "Bu resim %d metriğe dayanıyor: %d ölçüldü, %d hesaplandı, %d tahmin, "
        "%d veri yok. Kapsama bir kalite notu değil, dayanağın genişliğidir."
        % (c["total"], c["measured"], c["computed"], c["estimated"], c["missing"]),
        "coverage", **c)


def _level_line(payloads):
    """Uc sistemin kademesi — bir GOZLEM satiri.

    Kademe bugune kadar yalniz panonun *Sistemler* sayfasinda goruluyordu;
    gunluk brifing uc sistemin ozetini veriyor ama seviyeyi tasimiyordu.
    Veri zaten ambarda: `level_tier`, `level_sub` ve `xp_total` isaretle
    geliyor (bkz. core/adlar.py).

    UC KURAL, ve ucu de bilerek:

    1. HKM'nin KENDI XP'si YOKTUR ve olmamali — ucunun ustunde degil
       yanindadir. Burada bir toplam, bir ortalama, bir siralama yok.
    2. Bu satir bir HEDEF ya da UYARI degildir. "XP'n dusuk" demek,
       AGENTS.md'nin "XP karar vermez" kuralini dogrudan kirardi.
       Cumle bunu kendi icinde de soyler ki, bir gun baska bir satirla
       karistirilmasin.
    3. Kademe ADI yazilmaz, NUMARASI yazilir. Adlar
       `brand/seviye/kademeler.js` icinde degisebilir; merkezde ikinci
       bir kopya tutmak, iki kopyanin bir gun ayrismasi demekti.

    Hicbir modul seviye gondermediyse satir HIC cizilmez: bos bir
    "Seviye: —" satiri, bilgi degil gurultudur.
    """
    parca, kayitlar = [], []
    for mod in ("ays", "spi", "esp"):
        metrikler = payloads.get(mod) or {}
        kademe = C.value_of(metrikler.get("level_tier"))
        adim = C.value_of(metrikler.get("level_sub"))
        if kademe is None or adim is None:
            continue
        ad = MODUL_LABEL.get(mod, mod.upper())
        parca.append("%s %d.%d" % (ad, int(kademe), int(adim)))
        kayitlar.append({"module": mod, "tier": int(kademe),
                         "sub": int(adim),
                         "xp_total": C.value_of(metrikler.get("xp_total"))})
    if not parca:
        return None
    return _line("Seviye: " + " · ".join(parca)
                 + ". Bu bir gözlemdir; seviye hiçbir kararı vermez ve "
                   "bu brifingin sırasını değiştirmez.",
                 "level", items=kayitlar)


def _blind_line(t):
    kor = t["blind"]
    if not kor:
        return None
    sessiz = [b for b in kor if b["kind"] == "never_seen"]
    eksik = [b for b in kor if b["kind"] == "missing"]
    parca = []
    if sessiz:
        parca.append("%s hiç veri göndermedi"
                     % ", ".join(b["module"].upper() for b in sessiz))
    if eksik:
        parca.append("%d alan boş geldi" % len(eksik))
    if not parca:
        return None
    return _line("Bu brifingin göremediği yerler: " + "; ".join(parca)
                 + ". Görülmeyen şey sıfır değildir.", "blind", items=kor)


def brief(con, date, th=None, days=twin.WINDOW_DAYS):
    """Gunun brifingi: VP raporlari, tek oneri, dayanak ve korluk.

    Oneri uretilirse AMBARA YAZILIR ve kaynak denetimleriyle baglanir.
    Ayni gun ayni cumle iki kez yazilmaz; reddedilmis bir cumle yeniden
    onerilebilir ama eskisi silinmez."""
    audits = sync_engine.latest_audits(con, date)
    # precedence METRIK sozlugu bekler, govdenin tamamini degil: govdeyi
    # oldugu gibi gecirmek rank 2'yi sessizce olu birakirdi.
    payloads = {m: (b.get("metrics") or {})
                for m, b in db.latest_payloads(con, date).items()}
    resim = twin.snapshot(con, date, days)

    prop = precedence.resolve(
        bio=audits.get("bio"), academic=audits.get("academic"),
        intellect=audits.get("intellect"), payloads=payloads)

    lines, dropped = [], []
    # Veri gelmeyen moduller TEK satirda toplanir. Once her biri icin ayri
    # ayri ayni 20 kelimelik cumle yaziliyordu: bos bir gunde ekranin
    # tamami ayni cumlenin uc kopyasiydi. Tekrar, bilgi degil gurultudur —
    # ve gurultu, gercek bir bulguyu gormeyi zorlastirir.
    sessiz = [vp for vp in ("bio", "academic", "intellect")
              if not audits.get(vp)]
    for vp in ("bio", "academic", "intellect"):
        if vp in sessiz and len(sessiz) > 1:
            continue
        lines.append(_vp_line(vp, audits.get(vp)))
    if len(sessiz) > 1:
        adlar_ = ", ".join(VP_LABEL.get(v, v) for v in sessiz)
        lines.append(_line(
            "%s: bugün bu modüllerden veri gelmedi. Sessizlik bir ölçüm "
            "değildir; bu satır bir yargı taşımaz." % adlar_, "vp",
            vp=None, verdict=None, silent=sessiz))
    lines.append(_coverage_line(resim))
    kor = _blind_line(resim)
    if kor:
        lines.append(kor)
    seviye = _level_line(payloads)
    if seviye:
        lines.append(seviye)

    # Capraz bulgu: UC AMBAR YAN YANA konmadan gorunmeyen sey. Bu
    # satirlar bir oneri DEGILDIR ve onceligi degistirmez; bir
    # gozlemdir ve oyle yazilir.
    # Seri: bir gunun degil ART ARDA gelen gunlerin hikayesi. VP'ler her
    # gunu tek basina denetler; ust uste dorduncu gece ayni sey degildir.
    seriler = streak.findings(con, date, th=th)
    for f in seriler[:SERI_SATIR]:
        lines.append(_line(f["note"], "streak", rule=f["id"],
                           status=f["status"], length=f.get("length")))

    capraz = cross.findings(con, date)
    for f in capraz[:CAPRAZ_SATIR]:
        lines.append(_line(f["note"], "cross", pair=f["id"], status=f["status"],
                           cert=f["cert"], n=f["n"], question=f["question"]))

    karar = None
    if prop and prop.get("key") not in ("bio_red",):
        # «Bir daha sorma» ile susturulan oneri turu URETILMEZ (core/bildirim.py).
        # Saglik kirmizi bayragi susturulamaz: o bir tercih degil guvenliktir.
        from core import bildirim
        if bildirim.susturuldu_mu(con, "oneri:" + str(prop.get("key"))):
            dropped.append({"text": prop["proposal"], "words": [],
                            "note": "Bu öneri türü «bir daha sorma» ile susturuldu."})
            prop = None
    if prop:
        suc = imperatives(prop["proposal"])
        if suc:
            # Reddet-ve-dus: sessizce duzeltmek anlami tersine cevirebilir.
            dropped.append({"text": prop["proposal"], "words": suc,
                            "note": "Öneri buyurgan kip taşıdığı için düşürüldü. "
                                    "HKM'nin işletim sistemi seviyesinde böyle "
                                    "bir yetkisi yoktur."})
            prop = None
        else:
            karar = carry(con, date, prop, audits)
            lines.append(_line(prop["proposal"], "proposal",
                               rank=prop["rank"], key=prop["key"],
                               decision_id=karar["id"]))
    if not prop:
        lines.append(_line(
            "Bugün için bir öneri yok. Uydurulmuş bir öneri, öneri "
            "olmamasından kötüdür.", "proposal", rank=None))

    for ln in lines:
        assert advisory(ln["text"]), "buyurgan satir sizdi: " + ln["text"]

    return {"date": date, "audits": audits, "twin": resim,
            "council": council(audits, prop),
            "cross": capraz, "streaks": seriler,
            "proposal": prop, "decision": karar, "lines": lines,
            "dropped": dropped, "precedence": precedence.PRECEDENCE,
            "source": "kural motoru"}


def carry(con, date, prop, audits, now=None):
    """Oneriyi ambara TASIR — uretmez, tasir.

    Ayni gun ayni cumle acik duruyorsa yenisi yazilmaz: ikinci bir kayit
    yeni bir bilgi degil, gurultudur."""
    now = now or datetime.datetime.now().isoformat(timespec="seconds")
    var = db.open_decision(con, date, prop["proposal"])
    if var:
        return var
    kaynak = [a["id"] for a in audits.values() if a.get("id")]
    did = db.insert_decision(con, date, prop["rank"], prop["proposal"], now,
                             audit_ids=kaynak, key=prop.get("key"))
    return db.decision(con, did)


def respond(con, decision_id, state):
    """Kullanicinin cevabi: kabul ya da ret. Ucuncu bir sey yok.

    Reddedilen oneri SILINMEZ. Bir katmanin neyi onerdigi ve kullanicinin
    neyi reddettigi, o katmani sonradan denetlemenin tek yoludur."""
    if state not in ("accepted", "declined"):
        return {"status": 400, "error": "durum yalnızca accepted ya da declined"}
    d = db.decision(con, decision_id)
    if not d:
        return {"status": 404, "error": "öneri yok"}
    if d["state"] != "proposed":
        return {"status": 409, "error": "bu öneri zaten %s" % d["state"],
                "decision": d}
    db.set_decision_state(con, decision_id, state)
    return {"status": 200, "decision": db.decision(con, decision_id),
            "sources": db.sources_of(con, decision_id)}
