# -*- coding: utf-8 -*-
"""Cikti — BAM kayitlarini okunur, basilir, paylasilir hale getirir.

   Her kayit (arastirma, mufredat, soru seti, kart, test kitabi, katalogdaki
   her urun) ONCE tek bir belge modeline cevrilir; HTML, SVG ve PDF
   (core/pdf.py) cizicileri yalniz o modeli bilir. Yeni bir kayit turu tek
   bir cevirici ekleyerek her bicimde basilir.

   Gorsel urunlerin (pankart, zihin haritasi, zaman cizelgesi) YERLESIMI
   KODUNDUR: model yalniz metni yazar; kutular, cizgiler ve yazilar bir
   SAHNEYE yerlestirilir ve ayni sahne hem SVG'ye hem PDF'e basilir.

   Uc kural:
   1. HER METIN KACISLANIR. Modelin ya da web'in yazdigi hicbir sey HTML/SVG
      olarak yorumlanmaz; baglantilar yalniz http(s) ve «noopener»dir.
   2. ETIKET HER SAYFADA. «kaynakli / dogrulanmadi / celiskili» basligin
      yaninda ve alt bilgide durur; basilan kagit da etiketini tasir.
   3. CEVAP ANAHTARI AYRI BOLUMDE. Soru setlerinde cevap sorunun yaninda
      degil, belgenin sonunda durur."""
import html
import re

RENK = {"kagit": "#F7F4EE", "yazi": "#1F2A2E", "ikincil": "#4A5A5E", "vurgu": "#2F6B5E",
        "vurgu2": "#9A5B12", "cizgi": "#B9C2BF", "yumusak": "#E7EFEC", "beyaz": "#FFFFFF"}
ETIKET = {"kaynakli": "kaynaklı", "dogrulanmadi": "doğrulanmadı", "celiskili": "çelişkili"}
HARF = "ABCDE"


def _e(s):
    return html.escape(str(s if s is not None else ""), quote=True)


# ============================================================ belge modeli
#
# {"baslik", "alt", "tur_ad", "dogruluk", "tarih", "bolumler":[{"baslik",
#  "bloklar":[...]}], "kaynaklar":[...], "gorsel": sahne|None, "slaytlar"}

def _p(m):
    return {"t": "p", "metin": m}


KANIT_AD = {"guclu": "güçlü kanıt", "orta": "orta kanıt", "zayif": "zayıf kanıt"}
KAYNAK_TUR_AD = {"resmi": "resmî", "akademik": "akademik", "ansiklopedi": "ansiklopedi",
                 "kurum": "kurum"}


def _arastirma(k, g):
    bol = []
    if g.get("onceki_surum"):
        o = g["onceki_surum"]
        bol.append({"baslik": "Bu sürümde değişen", "bloklar": [
            {"t": "not", "metin": "Sürüm %s — kayıt #%s (%s) kaynakları değiştiği için yeniden "
                                  "araştırıldı." % (k.get("surum") or "?", o.get("id"), o.get("tarih"))}]
            + ([{"t": "liste", "maddeler": g["degisiklikler"]}] if g.get("degisiklikler") else [])})
    if g.get("ozet"):
        bol.append({"baslik": "Özet", "bloklar": [_p(g["ozet"])]})
    if g.get("bulgular"):
        ms = []
        for b in g["bulgular"]:
            n = "".join("[%d]" % x for x in b.get("kaynaklar") or [])
            durum = "" if "dogrulandi" not in b else (
                " (doğrulandı%s)" % (", " + KANIT_AD[b["kanit"]] if b.get("kanit") in KANIT_AD
                                     else "") if b["dogrulandi"] else " (doğrulanamadı)")
            ms.append("%s %s%s" % (b.get("iddia", ""), n, durum))
        bol.append({"baslik": "Bulgular", "bloklar": [{"t": "liste", "maddeler": ms}]})
    for alan, ad in (("celiskiler", "Çelişkiler"), ("acik_kalanlar", "Açık kalanlar")):
        if g.get(alan):
            bol.append({"baslik": ad, "bloklar": [{"t": "liste", "maddeler": g[alan]}]})
    if g.get("tur") == "mufredat":
        for d in g.get("dersler") or []:
            ek = " · %d soru" % d["soru_sayisi"] if d.get("soru_sayisi") else ""
            bol.append({"baslik": d["ad"] + ek, "bloklar": [{"t": "numarali",
                                                             "maddeler": d["konular"]}]})
        if g.get("uyari"):
            bol.append({"baslik": "Not", "bloklar": [{"t": "not", "metin": g["uyari"]}]})
    if g.get("metin") and not bol:
        bol.append({"baslik": "", "bloklar": [_p(g["metin"])]})
    return bol


def _sure(dk):
    from core import program
    return program.sure_yaz(dk or 0)


def _program(g):
    """Planlama Burosu v2 programi: ozet, haftalar, birimler, simulasyon,
    denetim. Her sayinin etiketi yazilir."""
    gi = g.get("girdi") or {}
    k = g.get("kapasite") or {}
    hs = g.get("haftalar") or []
    bol = [{"baslik": "Özet", "bloklar": [
        _p("%d hafta · haftada %s · günde %s (%s) · başlangıç %s." % (
            gi.get("hafta", len(hs)), _sure(gi.get("haftalik_dk")), _sure(k.get("gunluk_dk")),
            ", ".join(g.get("gunler") or []), hs[0]["baslangic"] if hs else "?")),
        {"t": "not", "metin": "Dakikalar, haftalar ve senaryolar hesaplandı; birimlerin saat "
                              "tahmini Hedef Analisti’nin tahminidir."}]}]
    if not g.get("gecti"):
        bol[0]["bloklar"].append({"t": "not", "metin": "Plan denetçisi bu programı geçirmedi; "
                                                       "aşağıdaki denetime bak."})
    satir = []
    for h in hs:
        cal = "; ".join("%s%s" % (c["ad"], " (%d. kısım)" % c["parca"] if c["parca"] > 1 or
                                  c.get("devam") else "") for c in h["calisma"]) or "—"
        satir.append(["%d" % h["no"], h["baslangic"], cal, "; ".join(h["tekrar"]) or "—",
                      _sure(h["ogrenme_dk"] + h.get("tekrar_dk", 0))])
    bol.append({"baslik": "Haftalar", "bloklar": [{"t": "tablo", "basliklar": [
        "Hafta", "Başlangıç", "Çalışma", "Tekrar", "Süre"], "satirlar": satir}]})
    birim = [["%d" % (i + 1), b["ad"], "%d" % b["agirlik"], _sure(b.get("dk")),
              ("%s sa" % ("%g" % b["tahmini_saat"]).replace(".", ",")) if b.get("tahmini_saat")
              else "—", ", ".join(map(str, b.get("onkosul") or [])) or "—"]
             for i, b in enumerate(g.get("birimler") or [])]
    bol.append({"baslik": "Çalışma birimleri", "bloklar": [{"t": "tablo", "basliklar": [
        "#", "Birim", "Ağırlık", "Pay", "Tahmin", "Önkoşul"], "satirlar": birim}]
        + ([{"t": "liste", "maddeler": ["%s — %s" % (b["ad"], b["cikti"])
                                        for b in g["birimler"] if b.get("cikti")]}]
           if any(b.get("cikti") for b in g.get("birimler") or []) else [])})
    kap = ["Toplam %s: öğrenme %s, tekrar %s (hesaplandı)." % (
        _sure(k.get("toplam_dk")), _sure(k.get("ogrenme_dk")), _sure(k.get("tekrar_dk")))]
    if k.get("ihtiyac_dk"):
        kap.append("Tahmini ihtiyaç %s; karşılama oranı %%%d (tahmin)." % (
            _sure(k["ihtiyac_dk"]), k["oran"] * 100))
    if k.get("gereken_hafta"):
        kap.append("Bu tahminle yaklaşık %d hafta gerekir (tahmin)." % k["gereken_hafta"])
    bol.append({"baslik": "Kapasite ve simülasyon", "bloklar": [
        {"t": "liste", "maddeler": kap + [x["metin"] for x in (g.get("simulasyon") or {})
                                          .get("senaryolar") or []]}]})
    bol.append({"baslik": "Plan denetimi", "bloklar": [{"t": "liste", "maddeler": [
        "%s — %s" % ("Tamam" if d["ok"] else ("Kritik" if d["kritik"] else "Uyarı"), d["not"])
        for d in g.get("denetim") or []]}]})
    if g.get("notlar"):
        bol.append({"baslik": "Notlar", "bloklar": [{"t": "liste", "maddeler": g["notlar"]}]})
    return bol


def _soru_bolumu(baslik, sorular, bas=0):
    bloklar = []
    for i, s in enumerate(sorular):
        bloklar.append({"t": "soru", "no": bas + i + 1, "soru": s["soru"],
                        "secenekler": s["secenekler"]})
    return {"baslik": baslik, "bloklar": bloklar}


def _anahtar(sorular, bas=0):
    return ", ".join("%d-%s" % (bas + i + 1, s["dogru"]) for i, s in enumerate(sorular))


def _materyal(k, g):
    tur, bol = g.get("tur"), []
    if tur == "soru":
        bol.append(_soru_bolumu("Sorular", g.get("maddeler") or []))
        bol.append({"baslik": "Cevap anahtarı", "bloklar": [_p(_anahtar(g.get("maddeler") or []))]})
        coz = ["%d. %s" % (i + 1, s.get("cozum") or "") for i, s in enumerate(g.get("maddeler") or [])]
        bol.append({"baslik": "Çözümler", "bloklar": [{"t": "liste", "maddeler": coz}]})
    elif tur == "kitap":
        bas, anahtar = 0, []
        for b in g.get("bolumler") or []:
            bol.append(_soru_bolumu(b["ad"], b["sorular"], bas))
            anahtar.append("%s: %s" % (b["ad"], _anahtar(b["sorular"], bas)))
            bas += len(b["sorular"])
        bol.append({"baslik": "Cevap anahtarı", "bloklar": [{"t": "liste", "maddeler": anahtar}]})
    elif tur == "kart":
        bol.append({"baslik": "Kartlar", "bloklar": [{"t": "tablo", "basliklar": ["Ön", "Arka"],
                    "satirlar": [[m["on"], m["arka"]] for m in g.get("maddeler") or []]}]})
    elif tur == "alistirma":
        bol.append({"baslik": "Alıştırma", "bloklar": [{"t": "numarali", "maddeler": [
            "%s — %s" % (m["yonerge"], m["madde"]) for m in g.get("maddeler") or []]}]})
        bol.append({"baslik": "Cevap anahtarı", "bloklar": [{"t": "numarali", "maddeler": [
            m["cevap"] for m in g.get("maddeler") or []]}]})
    return bol


def belge(k):
    """Kayit -> belge modeli. Taninmayan kayit bos bolumle doner."""
    g = k.get("govde") or {}
    b = {"baslik": k.get("baslik") or "BAM kaydı", "alt": g.get("alt_baslik"),
         "tur_ad": g.get("urun_ad") or {"arastirma": "Araştırma", "materyal": "Materyal",
                                        "plan": "Plan"}.get(k.get("tur"), "Kayıt"),
         "dogruluk": k.get("dogruluk") or "dogrulanmadi", "tarih": str(k.get("created_at") or "")[:10],
         "kimlik": k.get("id"), "bolumler": [], "kaynaklar": g.get("kaynaklar") or [],
         "gorsel": None, "slaytlar": None, "kavramlar": g.get("anahtar_kavramlar") or [],
         "kalite": list((g.get("kalite") or {}).get("notlar") or [])}
    if g.get("tur") == "mufredat":
        b["tur_ad"] = "Müfredat raporu"
    if g.get("tur") == "urun":
        b["baslik"] = g.get("baslik") or b["baslik"]
        if g["aile"] == "belge":
            b["bolumler"] = g["bolumler"]
        elif g["aile"] == "sunum":
            b["slaytlar"] = g["slaytlar"]
            b["bolumler"] = [{"baslik": s["baslik"], "bloklar": ([{"t": "liste", "maddeler": s["maddeler"]}]
                              if s["maddeler"] else []) + ([{"t": "not", "metin": s["not"]}] if s.get("not") else [])}
                             for s in g["slaytlar"]]
        else:
            b["gorsel"] = sahne(g)
    elif k.get("tur") == "arastirma":
        b["bolumler"] = _arastirma(k, g)
    elif k.get("tur") == "plan" and g.get("tur") == "program":
        b["tur_ad"] = "Haftalık program"
        b["bolumler"] = _program(g)
    elif k.get("tur") == "materyal":
        b["bolumler"] = _materyal(k, g)
        if g.get("tur") == "kitap":
            b["tur_ad"] = "Test kitabı"
    return b


# ============================================================== sahne
#
# Gorsel urunlerin yerlesimi. Genislik olcusu YAKLASIKTIR ve temkinlidir
# (karakter basina 0,58 em; kalin 0,62): SVG'de de PDF'te de ayni satir
# kirimi kullanilir, cizim ayni gorunur.

def olcu(metin, boy, kalin=False):
    return len(str(metin)) * boy * (0.62 if kalin else 0.58)


def sar(metin, boy, genislik, kalin=False, en_cok=None):
    kelimeler, satir, out = str(metin or "").split(), "", []
    for w in kelimeler:
        aday = (satir + " " + w).strip()
        if satir and olcu(aday, boy, kalin) > genislik:
            out.append(satir)
            satir = w
        else:
            satir = aday
    if satir:
        out.append(satir)
    if en_cok and len(out) > en_cok:
        out = out[:en_cok]
        out[-1] = out[-1].rstrip(".,;: ") + "…"
    return out


def _yazi(x, y, metin, boy, renk=None, kalin=False, hiza="sol"):
    return {"k": "yazi", "x": round(x, 1), "y": round(y, 1), "metin": metin, "boy": boy,
            "renk": renk or RENK["yazi"], "kalin": kalin, "hiza": hiza}


def _satirlar(ogeler, x, y, metin, boy, gen, renk=None, kalin=False, hiza="sol", ara=1.25,
              en_cok=None):
    for s in sar(metin, boy, gen, kalin, en_cok):
        y += boy
        ogeler.append(_yazi(x, y, s, boy, renk, kalin, hiza))
        y += boy * (ara - 1)
    return y


def _pankart_sahne(g, olcek):
    W, H, M = 1080, 1350, 90
    o, gen = [], W - 2 * M
    o.append({"k": "kutu", "x": 0, "y": 0, "w": W, "h": 18, "dolgu": RENK["vurgu"]})
    y = M
    o.append(_yazi(M, y, g.get("urun_ad", "Afiş").upper(), 24 * olcek, RENK["vurgu"], True))
    y += 40 * olcek
    y = _satirlar(o, M, y, g["baslik"], 74 * olcek, gen, kalin=True, ara=1.12)
    if g.get("alt_baslik"):
        y = _satirlar(o, M, y + 14 * olcek, g["alt_baslik"], 34 * olcek, gen, RENK["ikincil"])
    if g.get("vurgu"):
        y = _satirlar(o, M, y + 30 * olcek, g["vurgu"], 110 * olcek, gen, RENK["vurgu2"], True, ara=1.05)
    y += 36 * olcek
    for m in g["maddeler"]:
        b = 36 * olcek
        o.append({"k": "daire", "cx": M + 12, "cy": y + b * 0.62, "r": 9 * olcek, "dolgu": RENK["vurgu"]})
        y = _satirlar(o, M + 44, y, m, b, gen - 44, ara=1.22) + 18 * olcek
    if g.get("alt_not"):
        y = _satirlar(o, M, y + 10 * olcek, g["alt_not"], 24 * olcek, gen, RENK["ikincil"])
    return {"w": W, "h": H, "arka": RENK["kagit"], "ogeler": o}, y


def _pankart(g):
    """Sigan EN BUYUK olcek secilir: az metin buyur, cok metin kuculur;
    afis bos kalmaz, tasmaz."""
    for olcek in (1.5, 1.35, 1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.62, 0.55):
        s, y = _pankart_sahne(g, olcek)
        if y <= s["h"] - 110:
            return s
    return s


def _zihin(g):
    import math
    W, H = 1600, 1200
    cx, cy = W / 2, H / 2
    o = []
    n = len(g["dallar"])
    for i, d in enumerate(g["dallar"]):
        a = -math.pi / 2 + 2 * math.pi * i / n
        bx, by = cx + math.cos(a) * 390, cy + math.sin(a) * 320
        o.append({"k": "cizgi", "x1": cx, "y1": cy, "x2": bx, "y2": by, "renk": RENK["vurgu"],
                  "kalinlik": 4})
        m = len(d["alt"])
        for j, alt in enumerate(d["alt"]):
            aa = a + (j - (m - 1) / 2.0) * min(0.34, 2.4 / max(n, 1))
            ax, ay = cx + math.cos(aa) * 650, cy + math.sin(aa) * 510
            o.append({"k": "cizgi", "x1": bx, "y1": by, "x2": ax, "y2": ay,
                      "renk": RENK["cizgi"], "kalinlik": 2})
            o.append({"k": "daire", "cx": ax, "cy": ay, "r": 6, "dolgu": RENK["vurgu2"]})
            # Etiket noktanin DISINA: solda saga dayali, sagda sola dayali,
            # ustte noktanin ustune, altta altina — dal cizgisiyle cakismaz.
            sat = sar(alt, 19, 200, False, 2)
            if abs(math.cos(aa)) > 0.35:
                hiza, tx = ("sag", ax - 14) if math.cos(aa) < 0 else ("sol", ax + 14)
                ty = ay + 6 - (len(sat) - 1) * 12
            else:
                hiza, tx = "orta", ax
                ty = ay - 16 - (len(sat) - 1) * 23 if math.sin(aa) < 0 else ay + 30
            for s_ in sat:
                o.append(_yazi(tx, ty, s_, 19, RENK["ikincil"], False, hiza))
                ty += 23
        o.append({"k": "kutu", "x": bx - 125, "y": by - 38, "w": 250, "h": 76, "r": 16,
                  "dolgu": RENK["beyaz"], "kenar": RENK["vurgu"]})
        sat = sar(d["ad"], 22, 228, True, 2)
        yy = by - (len(sat) * 26) / 2.0 + 18
        for s in sat:
            o.append(_yazi(bx, yy, s, 22, RENK["yazi"], True, "orta"))
            yy += 26
    o.append({"k": "daire", "cx": cx, "cy": cy, "r": 118, "dolgu": RENK["vurgu"]})
    sat = sar(g["merkez"], 28, 200, True, 3)
    yy = cy - (len(sat) * 32) / 2.0 + 24
    for s in sat:
        o.append(_yazi(cx, yy, s, 28, RENK["beyaz"], True, "orta"))
        yy += 32
    return {"w": W, "h": H, "arka": RENK["kagit"], "ogeler": o}


def _zaman(g):
    W, X, o, y = 1200, 300, [], 150
    o.append(_yazi(80, 90, g.get("baslik") or "Zaman çizelgesi", 40, RENK["yazi"], True))
    ilk = y
    for ol in g["olaylar"]:
        o.append({"k": "daire", "cx": X, "cy": y + 12, "r": 11, "dolgu": RENK["vurgu"]})
        _satirlar(o, X - 30, y - 8, ol["tarih"], 24, 200, RENK["vurgu2"], True, "sag", en_cok=2)
        yy = _satirlar(o, X + 36, y - 8, ol["baslik"], 26, W - X - 110, kalin=True)
        if ol.get("aciklama"):
            yy = _satirlar(o, X + 36, yy + 2, ol["aciklama"], 20, W - X - 110, RENK["ikincil"])
        y = max(yy, y + 40) + 40
    o.insert(1, {"k": "cizgi", "x1": X, "y1": ilk, "x2": X, "y2": y - 30, "renk": RENK["cizgi"],
                 "kalinlik": 4})
    return {"w": W, "h": int(y + 40), "arka": RENK["kagit"], "ogeler": o}


def sahne(g):
    if g.get("urun") == "pankart":
        return _pankart(g)
    if g.get("urun") == "zihin_haritasi":
        return _zihin(g)
    if g.get("urun") == "zaman_cizelgesi":
        return _zaman(g)
    return None


# ================================================================ SVG

HIZA = {"sol": "start", "orta": "middle", "sag": "end"}


def svg(sahne_, baslik=""):
    p = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" '
         'role="img" aria-label="%s" font-family="Inter, Segoe UI, DejaVu Sans, Arial, sans-serif">'
         % (sahne_["w"], sahne_["h"], sahne_["w"], sahne_["h"], _e(baslik)),
         '<rect width="100%%" height="100%%" fill="%s"/>' % sahne_["arka"]]
    for x in sahne_["ogeler"]:
        if x["k"] == "kutu":
            p.append('<rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="%s"%s/>' % (
                x["x"], x["y"], x["w"], x["h"], x.get("r", 0), x.get("dolgu", "none"),
                ' stroke="%s" stroke-width="2"' % x["kenar"] if x.get("kenar") else ""))
        elif x["k"] == "daire":
            p.append('<circle cx="%s" cy="%s" r="%s" fill="%s"/>' % (x["cx"], x["cy"], x["r"],
                                                                     x.get("dolgu", "none")))
        elif x["k"] == "cizgi":
            p.append('<line x1="%s" y1="%s" x2="%s" y2="%s" stroke="%s" stroke-width="%s" '
                     'stroke-linecap="round"/>' % (x["x1"], x["y1"], x["x2"], x["y2"], x["renk"],
                                                   x.get("kalinlik", 2)))
        elif x["k"] == "yazi":
            p.append('<text x="%s" y="%s" font-size="%s" fill="%s" text-anchor="%s"%s>%s</text>' % (
                x["x"], x["y"], round(x["boy"], 1), x["renk"], HIZA[x["hiza"]],
                ' font-weight="700"' if x["kalin"] else "", _e(x["metin"])))
    p.append("</svg>")
    return "".join(p)


# =============================================================== HTML

ATIF = re.compile(r"\[(\d{1,2})\]")


def _satir_ici(metin, n_ler):
    """Kacisla, sonra [n] atiflarini kaynakca baglantisina cevir."""
    t = _e(metin)
    return ATIF.sub(lambda m: ('<sup><a href="#k%s">[%s]</a></sup>' % (m.group(1), m.group(1)))
                    if int(m.group(1)) in n_ler else "", t)


def _blok_html(b, n_ler):
    t = b["t"]
    if t == "p":
        return "<p>%s</p>" % _satir_ici(b["metin"], n_ler)
    if t == "not":
        return '<p class="not">%s</p>' % _satir_ici(b["metin"], n_ler)
    if t in ("liste", "numarali"):
        et = "ol" if t == "numarali" else "ul"
        return "<%s>%s</%s>" % (et, "".join("<li>%s</li>" % _satir_ici(m, n_ler)
                                           for m in b["maddeler"]), et)
    if t == "tablo":
        return ('<div class="tablo"><table><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>'
                % ("".join("<th>%s</th>" % _e(h) for h in b["basliklar"]),
                   "".join("<tr>%s</tr>" % "".join("<td>%s</td>" % _satir_ici(h, n_ler) for h in s)
                           for s in b["satirlar"])))
    if t == "soru":
        return ('<div class="soru"><p><b>%d.</b> %s</p><ol type="A">%s</ol></div>'
                % (b["no"], _e(b["soru"]), "".join("<li>%s</li>" % _e(x) for x in b["secenekler"])))
    return ""


CSS = """
:root{--kagit:%(kagit)s;--yazi:%(yazi)s;--ikincil:%(ikincil)s;--vurgu:%(vurgu)s;--cizgi:%(cizgi)s;--yumusak:%(yumusak)s}
*{box-sizing:border-box}
body{margin:0;background:var(--kagit);color:var(--yazi);font:16px/1.6 Inter,"Segoe UI",system-ui,sans-serif}
main{max-width:820px;margin:0 auto;padding:40px 22px 60px}
header{border-bottom:3px solid var(--vurgu);padding-bottom:14px;margin-bottom:24px}
.ust{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--vurgu);font-weight:700}
h1{font-size:30px;line-height:1.2;margin:8px 0 6px}
h2{font-size:20px;margin:28px 0 8px;border-left:4px solid var(--vurgu);padding-left:10px}
.alt{color:var(--ikincil);margin:0}
.rozet{display:inline-block;font-size:12px;padding:2px 10px;border-radius:999px;border:1px solid var(--cizgi);margin-left:6px;color:var(--ikincil)}
.rozet.kaynakli{border-color:var(--vurgu);color:var(--vurgu)}
.not{background:var(--yumusak);padding:10px 14px;border-radius:8px}
.tablo{overflow-x:auto}
table{border-collapse:collapse;width:100%%;font-size:15px}
th,td{border:1px solid var(--cizgi);padding:6px 8px;text-align:left;vertical-align:top}
th{background:var(--yumusak)}
.soru{break-inside:avoid;margin:10px 0}
.soru ol{margin:4px 0 0}
sup a{text-decoration:none;color:var(--vurgu)}
.kaynak li{word-break:break-word;font-size:14px}
.gorsel svg{width:100%%;height:auto;border-radius:12px}
.slayt{aspect-ratio:16/9;background:#fff;border:1px solid var(--cizgi);border-radius:12px;padding:28px 34px;margin:18px 0;break-after:page}
.slayt h2{border:0;padding:0;margin-top:0;font-size:26px;color:var(--vurgu)}
.slayt .not{font-size:13px}
footer{margin-top:36px;font-size:12px;color:var(--ikincil);border-top:1px solid var(--cizgi);padding-top:10px}
@media print{body{background:#fff}main{padding:0}@page{size:A4;margin:16mm}}
""" % RENK


def html_belge(b):
    n_ler = {k["n"] for k in b["kaynaklar"]}
    et = ETIKET.get(b["dogruluk"], b["dogruluk"])
    govde = []
    if b.get("gorsel"):
        govde.append('<div class="gorsel">%s</div>' % svg(b["gorsel"], b["baslik"]))
    elif b.get("slaytlar"):
        for s in b["slaytlar"]:
            govde.append('<section class="slayt"><h2>%s</h2>%s%s</section>' % (
                _e(s["baslik"]),
                "<ul>%s</ul>" % "".join("<li>%s</li>" % _satir_ici(m, n_ler) for m in s["maddeler"])
                if s["maddeler"] else "",
                '<p class="not">Konuşmacı notu: %s</p>' % _satir_ici(s["not"], n_ler)
                if s.get("not") else ""))
    else:
        for bl in b["bolumler"]:
            govde.append("<section>%s%s</section>" % (
                "<h2>%s</h2>" % _satir_ici(bl["baslik"], n_ler) if bl.get("baslik") else "",
                "".join(_blok_html(x, n_ler) for x in bl["bloklar"])))
    if b.get("kavramlar"):
        govde.append("<section><h2>Anahtar kavramlar</h2><ul>%s</ul></section>" % "".join(
            "<li><b>%s</b>: %s</li>" % (_e(k["terim"]), _satir_ici(k["tanim"], n_ler))
            for k in b["kavramlar"]))
    if b.get("kalite"):
        govde.append('<section><h2>Kalite kontrolü</h2><ul>%s</ul></section>' % "".join(
            "<li>%s</li>" % _e(x) for x in b["kalite"]))
    if b["kaynaklar"]:
        govde.append('<section><h2>Kaynaklar</h2><ol class="kaynak">%s</ol></section>' % "".join(
            '<li id="k%d"><a href="%s" rel="noopener noreferrer" target="_blank">%s</a> — %s '
            '(%serişim %s%s)</li>' % (
                k["n"], _e(k["url"]) if re.match(r"^https?://", str(k.get("url"))) else "#",
                _e(k.get("baslik")), _e(k.get("alan")),
                (_e(KAYNAK_TUR_AD[k["tur"]]) + ", ") if k.get("tur") in KAYNAK_TUR_AD else "",
                _e(k.get("erisim")),
                (", yayın " + _e(str(k["yayin"])[:10])) if k.get("yayin") else "")
            for k in b["kaynaklar"]))
    uyari = ("Kaynaklı: bilgiler numaralı kaynaklara dayanır ve alıntılar kodla denetlendi."
             if b["dogruluk"] == "kaynakli" else
             "Doğrulanmadı: bu içerik kaynakla doğrulanmadı; önemli bilgiyi resmî kaynaktan "
             "kontrol et." if b["dogruluk"] == "dogrulanmadi" else
             "Çelişkili: kaynaklar bazı noktalarda birbiriyle çelişiyor.")
    return ('<!doctype html><html lang="tr"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>%s</title><style>%s</style></head><body><main><header>'
            '<div class="ust">%s<span class="rozet %s">%s</span></div><h1>%s</h1>%s</header>'
            '%s<footer>%s</footer></main></body></html>') % (
        _e(b["baslik"]), CSS, _e(b["tur_ad"]), _e(b["dogruluk"]), _e(et), _e(b["baslik"]),
        '<p class="alt">%s</p>' % _e(b["alt"]) if b.get("alt") else "", "".join(govde),
        " · ".join(_e(x) for x in ("LifeOS · HKM", "BAM kayıt #%s" % b.get("kimlik"),
                                    b.get("tarih"), uyari) if x))


# ============================================================ disa acik

BICIMLER = ("html", "svg", "pdf")


def dosya_adi(b, bicim):
    ad = re.sub(r"[^\w\-]+", "-", str(b["baslik"]).lower(), flags=re.UNICODE).strip("-")[:60]
    return "%s-%s.%s" % (ad or "bam", b.get("kimlik") or "kayit", bicim)


def uret(k, bicim):
    """Kayit -> (bayt, mime, dosya_adi) ya da (None, None, neden)."""
    b = belge(k)
    if bicim == "html":
        return html_belge(b).encode("utf-8"), "text/html; charset=utf-8", dosya_adi(b, "html")
    if bicim == "svg":
        if not b.get("gorsel"):
            return None, None, "Bu kayıt görsel değil; SVG yok."
        return svg(b["gorsel"], b["baslik"]).encode("utf-8"), "image/svg+xml", dosya_adi(b, "svg")
    if bicim == "pdf":
        try:
            from core import pdf
        except ImportError:
            return None, None, "PDF çizicisi yok."
        r = pdf.belge_pdf(b)
        if not r.get("ok"):
            return None, None, r.get("note")
        return r["bayt"], "application/pdf", dosya_adi(b, "pdf")
    return None, None, "Bilinmeyen biçim."
