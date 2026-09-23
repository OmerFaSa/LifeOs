# -*- coding: utf-8 -*-
"""Uretim Burosu'nun son iki masasi — Editor ve Kalite Kontrol. Ikisi de KOD.

   Model urunu yazar, urunler.ayikla bicimini suzer; bu dosya urune son
   eli surer ve OLCER:

     Editor               bosluk ve noktalama duzeltmesi, ust uste ayni
                          madde, ilac dozu iceren cumle (SPI siniri:
                          doz onerilmez — AGENTS.md §1.5) cikarilir.
     Kalite Kontrol       kelime sayisi istenen uzunlukla uyusuyor mu;
                          kaynakli urunde paragraflarin kaci atif tasiyor;
                          metindeki buyuk sayilarin (yil, adet) kaynak
                          bulgusunda gecip gecmedigi.

   Kalite olcumu URUNU DEGISTIRMEZ; yalniz raporlar ve belge «Kalite
   kontrolu» notunu tasir. Olcum «hesaplandi»dir."""
import re

KELIME_HEDEF = {"kisa": (250, 400), "orta": (600, 900), "uzun": (1200, 1800)}
ATLA = {"t", "tur", "urun", "aile", "urun_ad", "url", "alan", "erisim", "yayin", "n",
        "kaynaklar", "istek", "dayanak", "kalite", "tarih"}
# Birimli miktar (500 mg, 1000 IU) her urunde; «doz» kelimesi yalniz SPI'den
# gelen iste: fizikte «radyasyon dozu» mesru bir konudur.
DOZ = re.compile(r"\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|µg|μg|iu|ünite)\b", re.I)
DOZ_SPI = re.compile(r"(\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|µg|μg|iu|ünite)\b|\bdoz\w*|\bdozaj\w*)",
                     re.I)
CUMLE = re.compile(r"[^.!?]+[.!?]*")
SAYI = re.compile(r"\b\d{3,}\b")
ATIF = re.compile(r"\[\d{1,2}\]")


def _duzelt(s):
    """Bosluk ve noktalama: cift bosluk, noktalamadan once bosluk, harfler
    arasinda bosluksuz virgul. Sayilara ve adreslere dokunulmaz."""
    t = re.sub(r"[ \t]+", " ", s).strip()
    t = re.sub(r" +([.,;:!?)])", r"\1", t)
    t = re.sub(r"([(]) +", r"\1", t)
    return re.sub(r"(?<=[^\d\s,]),(?=[^\d\s,])", ", ", t)


def _dozsuz(s, desen):
    """Doz iceren cumleyi cikarir. Doner: (metin, cikan_sayisi)."""
    if not desen.search(s):
        return s, 0
    kalan, cikan = [], 0
    for c in CUMLE.findall(s):
        if desen.search(c):
            cikan += 1
        else:
            kalan.append(c.strip())
    return " ".join(x for x in kalan if x), cikan


def _gez(x, desen, say):
    if isinstance(x, dict):
        return {k: (v if k in ATLA else _gez(v, desen, say)) for k, v in x.items()}
    if isinstance(x, list):
        out = []
        for v in x:
            y = _gez(v, desen, say)
            if isinstance(y, str):
                if not y:
                    say["bos_dusen"] += 1
                    continue
                if out and isinstance(out[-1], str) and out[-1].lower() == y.lower():
                    say["tekrar_dusen"] += 1
                    continue
            out.append(y)
        return out
    if isinstance(x, str):
        y, cikan = _dozsuz(x, desen)
        say["doz"] += cikan
        z = _duzelt(y)
        if z != x and not cikan:
            say["duzeltilen"] += 1
        return z
    return x


def duzenle(govde, spi=False):
    """Editor. Doner: (yeni_govde, sayim)."""
    say = {"duzeltilen": 0, "tekrar_dusen": 0, "bos_dusen": 0, "doz": 0}
    return _gez(govde, DOZ_SPI if spi else DOZ, say), say


def _metinler(x, out):
    if isinstance(x, dict):
        for k, v in x.items():
            if k not in ATLA:
                _metinler(v, out)
    elif isinstance(x, list):
        for v in x:
            _metinler(v, out)
    elif isinstance(x, str):
        out.append(x)
    return out


def _paragraflar(govde):
    """Atif tasimasi beklenen birimler: paragraf ve liste maddeleri."""
    out = []
    for b in govde.get("bolumler") or []:
        for bl in b.get("bloklar") or []:
            if bl.get("t") == "p":
                out.append(bl.get("metin") or "")
            elif bl.get("t") in ("liste", "numarali"):
                out += bl.get("maddeler") or []
    for s in govde.get("slaytlar") or []:
        out += s.get("maddeler") or []
    for o in govde.get("olaylar") or []:
        out.append(" ".join(str(o.get(k) or "") for k in ("baslik", "aciklama")))
    if isinstance(govde.get("maddeler"), list):
        out += govde["maddeler"]
    return [p for p in out if isinstance(p, str) and len(p.split()) >= 4]


def olc(govde, istek, kaynaklar=None, dayanak_metni="", editor_sayimi=None):
    """Kalite Kontrol. Urunu degistirmez; olcum dondurur."""
    metin = " ".join(_metinler(govde, []))
    kelime = len(re.findall(r"\w+", metin))
    out = {"kelime": kelime, "etiket": "hesaplandi"}
    if govde.get("aile") == "belge":
        a, b = KELIME_HEDEF.get((istek or {}).get("uzunluk") or "orta")
        out["hedef"] = [a, b]
        out["uyum"] = bool(a * 0.6 <= kelime <= b * 1.5)
    if kaynaklar:
        par = _paragraflar(govde)
        atifli = sum(1 for p in par if ATIF.search(p))
        out["atif_orani"] = round(atifli / float(len(par)), 2) if par else None
        dayanak = dayanak_metni + " " + " ".join(k.get("baslik") or "" for k in kaynaklar)
        bilinen = set(SAYI.findall(dayanak))
        out["kaynaksiz_sayilar"] = sorted({s for s in SAYI.findall(re.sub(r"\[\d+\]", " ", metin))
                                           if s not in bilinen})[:10]
    if editor_sayimi:
        out["editor"] = editor_sayimi
    notlar = []
    if out.get("uyum") is False:
        notlar.append("Uzunluk istenenin dışında: %d kelime (hedef %d–%d)." % (
            kelime, out["hedef"][0], out["hedef"][1]))
    if out.get("atif_orani") is not None and out["atif_orani"] < 0.5:
        notlar.append("Paragrafların yalnız %%%d kadarı kaynak numarası taşıyor." % int(
            out["atif_orani"] * 100))
    if out.get("kaynaksiz_sayilar"):
        notlar.append("Kaynak bulgularında geçmeyen sayılar: %s — resmî kaynaktan doğrula."
                      % ", ".join(out["kaynaksiz_sayilar"]))
    if editor_sayimi and editor_sayimi.get("doz"):
        notlar.append("İlaç dozu içeren %d cümle çıkarıldı: LifeOS doz önermez."
                      % editor_sayimi["doz"])
    out["notlar"] = notlar
    return out
