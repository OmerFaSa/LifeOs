#!/usr/bin/env python3
"""Sahibin onaylarını içerik dosyalarına yazar (belgeler/ekip/sadelesme/faz6-onay-ekrani.md).

Girdi: kabuktaki «Onayları dosya olarak al» düğmesinin indirdiği JSON (lifeos.onay kaydı):
  {"<alan>/<aşama no>/<öğe kimliği>": {"durum": "onayli", "onaylayan": "sahip", "onayTarihi": "YYYY-MM-DD"}, ...}
Her anahtar alan/<alan>/asama-<no>.json içindeki, kimliği BİREBİR eşleşen ve `durum` taşıyan öğeye (ders, alıştırma,
kapı sorusu) yazılır: durum, onaylayan, onayTarihi. Bilinmeyen kimlik raporlanır, asla tahmin edilmez.
Dosyanın biçimi korunur: yalnız o üç değer değişir ya da durumun hemen ardına eklenir (satır sonu, girinti aynı).

Kullanım:
  python tools/onay_uygula.py <dosya>          # kuru koşu: ne değişeceğini söyler, hiçbir şey yazmaz
  python tools/onay_uygula.py <dosya> --yaz    # yazar
  --kok <klasör>                               # depo kökü yerine (test için geçici kopya)
Çıkış: 0 = her anahtar eşleşti; 1 = bilinmeyen ya da geçersiz anahtar var (eşleşenler yine de işlenir); 2 = girdi okunamadı.
"""
import argparse
import json
import re
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
ANAHTAR = re.compile(r"^([a-z]+)/([1-9]\d*)/([\w.-]+)$")
TARIH = re.compile(r"^\d{4}-\d{2}-\d{2}")
DIZGE = re.compile(r'"(?:[^"\\]|\\.)*"')
YALIN = re.compile(r"-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null")


def tara(s):
    """JSON metnindeki her nesnenin doğrudan üyelerini konumlarıyla döndürür: [{anahtar: (anahtar_bas, deger_bas, deger_son)}]."""
    nesneler = []

    def bosluk(i):
        while i < len(s) and s[i] in " \t\r\n":
            i += 1
        return i

    def deger(i):
        i = bosluk(i)
        c = s[i]
        if c == "{":
            uyeler, i = {}, bosluk(i + 1)
            if s[i] != "}":
                while True:
                    m = DIZGE.match(s, bosluk(i))
                    ks = m.start()
                    i = bosluk(m.end())
                    if s[i] != ":":
                        raise ValueError(f"{i}: ':' bekleniyordu")
                    vs = bosluk(i + 1)
                    ve = deger(vs)
                    uyeler[json.loads(m.group(0))] = (ks, vs, ve)
                    i = bosluk(ve)
                    if s[i] == ",":
                        i += 1
                        continue
                    break
            if s[i] != "}":
                raise ValueError(f"{i}: '}}' bekleniyordu")
            nesneler.append(uyeler)
            return i + 1
        if c == "[":
            i = bosluk(i + 1)
            if s[i] != "]":
                while True:
                    i = bosluk(deger(i))
                    if s[i] == ",":
                        i += 1
                        continue
                    break
            if s[i] != "]":
                raise ValueError(f"{i}: ']' bekleniyordu")
            return i + 1
        m = (DIZGE if c == '"' else YALIN).match(s, i)
        if not m:
            raise ValueError(f"{i}: geçersiz değer")
        return m.end()

    deger(0)
    return nesneler


def dosya_duzelt(metin, istek):
    """istek: {kimlik: onay kaydı}. Döner: (yeni metin, {kimlik: 'yazildi'|'ayni'|'durumsuz'|'yok'})."""
    dizin = {}
    for uyeler in tara(metin):
        if "id" in uyeler:
            ks, vs, ve = uyeler["id"]
            dizin.setdefault(json.loads(metin[vs:ve]), []).append(uyeler)
    nl = "\r\n" if "\r\n" in metin else "\n"
    sonuc, duzeltme = {}, []  # duzeltme: (bas, son, yeni metin)
    for kimlik, g in istek.items():
        bulunan = dizin.get(kimlik, [])
        if len(bulunan) != 1:
            sonuc[kimlik] = "yok" if not bulunan else "yinelenen"
            continue
        u = bulunan[0]
        if "durum" not in u:
            sonuc[kimlik] = "durumsuz"  # aşama, ünite, kaynak: onaylanan öğe değil
            continue
        yeni = {"durum": "onayli", "onaylayan": g["onaylayan"], "onayTarihi": g["onayTarihi"]}
        if json.loads(metin[u["durum"][1]:u["durum"][2]]) == "onayli" and "onaylayan" in u and "onayTarihi" in u:
            sonuc[kimlik] = "ayni"  # dosyada zaten onaylı: ilk onayın kimi ve tarihi korunur
            continue
        ks, vs, ve = u["durum"]
        duzeltme.append((vs, ve, json.dumps("onayli")))
        ekle = []
        for a in ("onaylayan", "onayTarihi"):
            if a in u:
                duzeltme.append((u[a][1], u[a][2], json.dumps(yeni[a], ensure_ascii=False)))
            else:
                ekle.append(f'"{a}": {json.dumps(yeni[a], ensure_ascii=False)}')
        if ekle:
            satir_bas = metin.rfind("\n", 0, ks) + 1
            girinti = metin[satir_bas:ks]
            ayrac = ("," + nl + girinti) if girinti.strip(" \t") == "" else ", "  # çok satırlı nesne: her üye kendi satırında
            son = max(u[a][2] for a in ("durum", "onaylayan", "onayTarihi") if a in u)  # onay üyeleri yan yana kalsın
            duzeltme.append((son, son, "".join(ayrac + e for e in ekle)))
        sonuc[kimlik] = "yazildi"
    for bas, son, yeni in sorted(duzeltme, key=lambda x: x[0], reverse=True):
        metin = metin[:bas] + yeni + metin[son:]
    return metin, sonuc


def oku_girdi(yol):
    veri = json.loads(Path(yol).read_text(encoding="utf-8-sig"))
    if not isinstance(veri, dict):
        raise ValueError("girdi bir JSON nesnesi olmalı (lifeos.onay)")
    return veri


def uygula(girdi, kok, yaz):
    """Döner: (rapor satırları, sorun sayısı)."""
    gruplar, sorun, rapor = {}, 0, []
    for k, g in sorted(girdi.items()):
        m = ANAHTAR.match(k)
        if not m:
            rapor.append(f"geçersiz anahtar: {k}")
            sorun += 1
            continue
        if not (isinstance(g, dict) and g.get("durum") == "onayli" and isinstance(g.get("onaylayan"), str) and g["onaylayan"].strip()
                and isinstance(g.get("onayTarihi"), str) and TARIH.match(g["onayTarihi"])):
            rapor.append(f"geçersiz onay kaydı: {k}")
            sorun += 1
            continue
        gruplar.setdefault((m.group(1), int(m.group(2))), {})[m.group(3)] = g
    for (alan, n), istek in sorted(gruplar.items()):
        yol = kok / "alan" / alan / f"asama-{n}.json"
        ad = yol.relative_to(kok).as_posix()
        if not yol.is_file():
            rapor.append(f"{ad}: dosya yok; {len(istek)} anahtar uygulanmadı")
            sorun += len(istek)
            continue
        with open(yol, encoding="utf-8", newline="") as f:
            eski = f.read()
        yeni, sonuc = dosya_duzelt(eski, istek)
        if yeni != eski:
            json.loads(yeni)  # biçim bozulduysa yazmadan dur
        say = {d: sorted(k for k, v in sonuc.items() if v == d) for d in ("yazildi", "ayni", "durumsuz", "yok", "yinelenen")}
        rapor.append(f"{ad}: {len(say['yazildi'])} öğe {'yazıldı' if yaz else 'yazılacak'}, {len(say['ayni'])} zaten onaylı")
        for d, ac in (("yok", "bilinmeyen kimlik"), ("yinelenen", "kimlik dosyada birden çok"), ("durumsuz", "onaylanan öğe değil (durum alanı yok)")):
            for k in say[d]:
                rapor.append(f"  {ac}: {alan}/{n}/{k}")
                sorun += 1
        if yaz and yeni != eski:
            with open(yol, "w", encoding="utf-8", newline="") as f:
                f.write(yeni)
    if not yaz:
        rapor.append("kuru koşu: hiçbir dosya yazılmadı (yazmak için --yaz)")
    return rapor, sorun


def main(argv=None):
    ap = argparse.ArgumentParser(description="Kabuktan alınan onay dosyasını alan/<id>/asama-N.json dosyalarına yazar.")
    ap.add_argument("dosya", help="«Onayları dosya olarak al» ile inen JSON")
    ap.add_argument("--yaz", action="store_true", help="dosyalara yaz (yoksa kuru koşu)")
    ap.add_argument("--kok", default=str(KOK), help="depo kökü (varsayılan: bu depo)")
    a = ap.parse_args(argv)
    try:
        girdi = oku_girdi(a.dosya)
    except (OSError, ValueError) as e:
        print(f"girdi okunamadı: {e}")
        return 2
    rapor, sorun = uygula(girdi, Path(a.kok), a.yaz)
    print("\n".join(rapor))
    if sorun:
        print(f"{sorun} anahtar uygulanmadı; kimlikler tahmin edilmez, onay ekranından yeniden al.")
    return 1 if sorun else 0


if __name__ == "__main__":
    sys.exit(main())
