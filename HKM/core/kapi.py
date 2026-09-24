# -*- coding: utf-8 -*-
"""HKM giris kapisi — test kitabi, gitar, dil unitesi, kelime.

   Kullanici 2026-09-24: «test kitabi, gitar, sozluk gibi turlu turlu seyi
   HKM'den girecegiz.» HKM sohbeti ve Telegram bu cumleleri TANIR ve ilgili
   modulun ADINA isler:

     test kitabi    → King is emri `test.kitabi` (AYS) — onay kapisindan gecer
     gitar / unite  → King is emri `esp.unite` (ESP)
     kelime         → ESP'ye `kart.add` teklifi (modul kendi koduyla ekler)

   Uc kural:
   1. HKM MODULE YAZMAZ (AGENTS §1.4): is emri ya da teklif birakir.
   2. EKSIK BILGI SORULUR. Gitarin duzeyi, unitenin duzeyi, kelimenin
      karsiligi yoksa tahmin edilmez; tek cumlelik soru doner.
   3. TANIMA KURALLA. Model «bu bir test kitabi istegi mi» diye karar
      vermez."""
import re

from core import unite

MAX_KART = 10
KITAP_ADET = 10


def _kucuk(s):
    return str(s or "").replace("I", "ı").replace("İ", "i").lower()


def _duz(s):
    """Eslestirme icin: kucuk harf, aksansiz."""
    k = _kucuk(s)
    for a, b in (("ı", "i"), ("ş", "s"), ("ğ", "g"), ("ü", "u"), ("ö", "o"), ("ç", "c")):
        k = k.replace(a, b)
    return k


DIL_AD = {_duz(v): k for k, v in unite.DILLER.items()}


def _bas_harf(s):
    s = s.strip()
    if not s:
        return s
    ilk = {"i": "İ", "ı": "I"}.get(s[0], s[0].upper())
    return ilk + s[1:]


def _dil(metin):
    d = _duz(metin)
    for ad, kod in DIL_AD.items():
        if re.search(r"(?<![a-z])" + ad, d):
            return kod
    return None


FIIL = r"(?:\s+(?:hazırla|hazirla|oluştur|olustur|yap|üret|uret|istiyorum|lazım|lazim))"
KITAP = re.compile(r"^(?P<konu>.+?)\s+test\s+kitab[ıi](?:n[ıi])?" + FIIL + r"?\s*[.!]?$", re.I)
KITAP2 = re.compile(r"^test\s+kitab[ıi]\s*:\s*(?P<konu>.+)$", re.I)
GITAR = re.compile(r"^gitar\s+(?:alıştırma(?:sı|ları)?|alistirma(?:si|lari)?|çalışma(?:sı)?|paket(?:i)?)"
                   + FIIL + r"?\s*:?\s*(?P<konu>.*)$", re.I)
UNITE = re.compile(r"^(?P<dil>[^\W\d_]+)\s+(?:(?P<duzey>[abc][12])\s+)?(?P<konu>.+?)\s+ünite(?:si|leri)?"
                   + FIIL + r"?\s*[.!]?$", re.I)
KELIME = re.compile(r"^(?:(?P<dil>[^\W\d_]+)\s+)?(?:sözlüğe\s+ekle|sozluge\s+ekle|kelime(?:ler)?|kart(?:lar)?)"
                    r"\s*:?\s*(?P<govde>.+)$", re.I)


def _kitap(konu):
    konu = konu.strip(" .,:;")
    parca = [p.strip(" .,") for p in re.split(r",|\s+ve\s+", konu) if p.strip(" .,")]
    if not parca or len(konu) < 2:
        return {"soru": "Hangi konuda test kitabı? Konuyu yaz (örn. «türev ve integral test kitabı hazırla»)."}
    return {"tur": "kitap", "kitap": {
        "baslik": _bas_harf(konu)[:100] + " test kitabı",
        "bolumler": [{"ad": _bas_harf(p)[:80], "konular": [], "adet": KITAP_ADET} for p in parca[:6]]}}


def tani(metin):
    """None (bu kapi degil), {"soru": ...} ya da {"tur": ..., ...}."""
    m = str(metin or "").strip()
    if not m or m.startswith("/") or len(m) > 400:
        return None
    x = KITAP.match(m) or KITAP2.match(m)
    if x:
        return _kitap(x.group("konu"))
    x = GITAR.match(m)
    if x:
        k = x.group("konu") or ""
        duzey = next((d for d in unite.GITAR_DUZEY if d in _kucuk(k) or _duz(d) in _duz(k)), None)
        konu = re.sub(r"(?i),?\s*(başlangıç|baslangic|orta|ileri)\s*(düzey(?:i|inde)?|seviye(?:si)?)?", "", k)
        konu = konu.strip(" .,:;")
        if len(konu) < 2:
            return {"soru": "Gitarda hangi konu? Örn. «gitar alıştırması: barre akorları, başlangıç»."}
        if not duzey:
            return {"soru": "«%s» için hangi düzey: başlangıç, orta ya da ileri?" % konu}
        return {"tur": "gitar", "unite": {"alan": "gitar", "duzey": duzey, "konu": konu[:80]}}
    x = UNITE.match(m)
    if x and _dil(x.group("dil")):
        konu = x.group("konu").strip(" .,:;")
        if not x.group("duzey"):
            return {"soru": "«%s» ünitesi hangi düzeyde: A1, A2, B1, B2, C1 ya da C2?" % konu}
        return {"tur": "unite", "unite": {"dil": _dil(x.group("dil")),
                                          "duzey": x.group("duzey").upper(), "konu": konu[:80]}}
    x = KELIME.match(m)
    if x:
        dil = _dil(x.group("dil") or "")
        kartlar = []
        for p in re.split(r"[,;\n]", x.group("govde")):
            p = p.strip()
            if not p:
                continue
            ay = re.split(r"\s*(?:=|:|\s-\s|→)\s*", p, maxsplit=1)
            if len(ay) != 2 or not ay[0].strip() or not ay[1].strip():
                return {"soru": "Kelimeyi ve karşılığını «=» ile yaz: «sözlüğe ekle: apple = elma»."}
            k = {"on": ay[0].strip()[:200], "arka": ay[1].strip()[:300]}
            if dil:
                k["dil"] = dil
            kartlar.append(k)
        if not kartlar:
            return {"soru": "Kelimeyi ve karşılığını «=» ile yaz: «sözlüğe ekle: apple = elma»."}
        if len(kartlar) > MAX_KART:
            return {"soru": "Tek mesajda en çok %d kelime; kalanını ayrı yaz." % MAX_KART}
        return {"tur": "kelime", "kartlar": kartlar}
    return None


def devret(con, cfg, metin, t, now=None, kanal=None, hedef=None):
    """Taninan istegi isler; cevap cumlesini KOD kurar."""
    from core import intents, king, sohbet
    if t.get("soru"):
        return t["soru"]
    if t["tur"] == "kelime":
        yeni = 0
        for k in t["kartlar"]:
            r = intents.create(con, "esp", "kart.add", k, None, source="kapi")
            if not r.get("ok"):
                return "Kart teklifi yazılamadı: %s" % "; ".join(r.get("errors") or [])
            yeni += 0 if r.get("duplicate") else 1
        return ("%d kart ESP’ye teklif olarak bırakıldı; ESP’yi açınca «Ekle» dersen destene girer. "
                "HKM kartı kendisi yazmaz." % len(t["kartlar"])
                + ("" if yeni == len(t["kartlar"]) else " (%d tanesi zaten bekliyordu)" % (len(t["kartlar"]) - yeni)))
    if t["tur"] == "kitap":
        r = king.emir_ac(con, cfg, "ays", "test.kitabi", {"kitap": t["kitap"]},
                         neden="HKM sohbetinden: " + str(metin)[:300], now=now, kanal=kanal, hedef=hedef)
        if not r.get("ok"):
            return "Test kitabı emri açılamadı: %s" % "; ".join(r.get("errors") or ["bilinmeyen hata"])
        return sohbet._emir_cevabi(con, r, "«%s» test kitabını Üretim Bürosu’na verdim",
                                   "Bölüm bölüm üretilir; her soru bağımsız çözümle denetlenir. Kitap AYS’ye "
                                   "teklif olarak gelir.")
    r = king.emir_ac(con, cfg, "esp", "esp.unite", {"unite": t["unite"]},
                     neden="HKM sohbetinden: " + str(metin)[:300], now=now, kanal=kanal, hedef=hedef)
    if not r.get("ok"):
        return "İş emri açılamadı: %s" % "; ".join(r.get("errors") or ["bilinmeyen hata"])
    return sohbet._emir_cevabi(con, r, "«%s» işini Üretim Bürosu’na verdim",
                               ("Alıştırmalar ESP › Stüdyo’ya" if t["tur"] == "gitar" else "Ünite ESP › Dil’e")
                               + " teklif olarak gelir; ESP kendi koduyla sınar.")
