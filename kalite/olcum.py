#!/usr/bin/env python3
"""Kalite ölçüm motoru (plan A9, Faz 4).

Depoyu yalnız OKUR; sunucu, tarayıcı, derleme yok. Her sayı bir kesinlik
etiketi taşır (AGENTS §1.2: ölçüldü / tahmin / hesaplandı / veri yok).
On üç eğri kalite/egri/*.py'dedir (bir dosya bir eğri). Tarayıcı isteyen
ölçüm kendi komutuyla kalite/veri/'ye yazar, eğri oradan okur. Çalışan King
isteyen eğriler `ölçülmedi`, değersiz ve ölçecek komutla listelenir; vekil
ölçüm `tahmin` etiketiyle ayrıntıda durur, eğrinin değeri olmaz.

  python kalite/olcum.py            ölçer, JSON basar
  python kalite/olcum.py --md       kısa Türkçe tablo
  python kalite/olcum.py --kaydet   kalite/kayit/<YYYY-MM-DD>.json yazar
  python kalite/olcum.py --denetle  bütçe aşımında çıkış 1 (son kayda ve tabana karşı)

Sayım yolları taban belgesindeki (belgeler/ekip/sadelesme/taban-20261112.md)
yöntemlerin aynısıdır; farklar belgeler/ekip/sadelesme/faz4-olcum.md'de.
"""
import argparse
import ast
import datetime
import importlib.util
import json
import os
import re
import sys
from pathlib import Path

BURASI = Path(__file__).resolve().parent
KOK = BURASI.parent
MODULLER = ("AYS", "SPI", "ESP")
ETIKETLER = ("ölçüldü", "tahmin", "hesaplandı", "veri yok")
TEST_DIZIN = {"tests", "test", "__pycache__", "node_modules", "dist", ".git"}


# ---------- okuma yardımcıları ----------

def oku(kok, yol):
    try:
        return (kok / yol).read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def bul(kok, desen):
    """Göreli, sıralı, '/' ayraçlı yollar (belirlenimci)."""
    return sorted(p.relative_to(kok).as_posix() for p in kok.glob(desen) if p.is_file())


def say(metin, desen):
    return len(re.findall(desen, metin))


def testmi(yol):
    parca = yol.split("/")
    ad = parca[-1]
    return (bool(TEST_DIZIN.intersection(parca[:-1])) or ad.endswith(".test.js")
            or ad.startswith("test_") or ad.endswith("_test.py"))


def imza(kok, yol, desen=None):
    metin = oku(kok, yol)
    if not (kok / yol).is_file():
        return False
    return desen is None or re.search(desen, metin) is not None


def atama(kok, yol, ad):
    """Python dosyasındaki `AD = <sabit>` değerini çalıştırmadan okur."""
    try:
        agac = ast.parse(oku(kok, yol))
    except SyntaxError:
        return None
    for dugum in agac.body:
        if isinstance(dugum, ast.Assign) and any(getattr(h, "id", None) == ad for h in dugum.targets):
            try:
                return ast.literal_eval(dugum.value)
            except ValueError:
                return None
    return None


def dengeli(metin, i):
    """metin[i] bir açılış ([{( ise eşinin indeksini döner; dizgileri atlar."""
    ac, kapa = "([{", ")]}"
    derinlik, j, n = 0, i, len(metin)
    while j < n:
        c = metin[j]
        if c in "'\"`":
            k = j + 1
            while k < n and metin[k] != c:
                k += 2 if metin[k] == "\\" else 1
            j = k
        elif c in ac:
            derinlik += 1
        elif c in kapa:
            derinlik -= 1
            if derinlik == 0:
                return j
        j += 1
    return n


def ust_oge(icerik):
    """Dizi gövdesindeki üst düzey öğe sayısı."""
    sayi, derinlik, dolu, j, n = 0, 0, False, 0, len(icerik)
    while j < n:
        c = icerik[j]
        if c in "'\"`":
            j = dengeli_dizgi(icerik, j)
            dolu = True
        elif c == "/" and icerik[j:j + 2] == "/*":
            k = icerik.find("*/", j + 2)
            j = n if k < 0 else k + 1
        elif c in "([{":
            derinlik += 1
            dolu = True
        elif c in ")]}":
            derinlik -= 1
        elif c == "," and derinlik == 0:
            sayi += dolu
            dolu = False
        elif not c.isspace():
            dolu = True
        j += 1
    return sayi + dolu


def dengeli_dizgi(metin, j):
    c, k, n = metin[j], j + 1, len(metin)
    while k < n and metin[k] != c:
        k += 2 if metin[k] == "\\" else 1
    return k


def olcut(id_, ad, deger, etiket, yol, katman="sistem", ayrinti=None):
    assert etiket in ETIKETLER, etiket
    return {"id": id_, "ad": ad, "katman": katman, "durum": "ölçüldü" if deger is not None else "ölçülmedi",
            "deger": deger, "etiket": etiket, "yol": yol, "ayrinti": ayrinti or {}}


# ---------- Sistem ölçütleri ----------

def uygulamalar(kok):
    ust = sorted({y.split("/")[0] for y in bul(kok, "*/src/index.html") + bul(kok, "*/web/index.html")})
    return [olcut("uygulama", "Uygulama", len(ust), "ölçüldü",
                  "kendi index.html'i olan üst klasör: */src/index.html + */web/index.html",
                  ayrinti={"klasorler": ust})]


def kapilar(kok):
    sunucu = oku(kok, "sistem/sunucu.py")
    blok = re.search(r"SISTEMLER\s*=\s*\[(.*?)\n\]", sunucu, re.S)
    modul = [int(p) for p in re.findall(r",\s*(\d{4})\s*,", blok.group(1))] if blok else []
    tek = [int(m) for ad in ("GIRIS_PORT", "HKM_PORT") for m in re.findall(ad + r"\s*=\s*(\d{4})", sunucu)[:1]]
    yerel = sorted(set(modul + tek))
    ev = atama(kok, "sistem/telefon.py", "PORTLAR") or {}
    kur = atama(kok, "sistem/telefon.py", "KURULUM_PORT")
    ev_agi = sorted(set(ev.values()) | ({kur} if kur else set()))
    uzak = atama(kok, "sistem/uzak.py", "KAPILAR") or {}
    idb = any("indexedDB" in oku(kok, y) for y in bul(kok, "**/*.js")
              if not testmi(y) and y.split("/")[0] in ("brand",) + MODULLER)
    kokenler = len(modul) + (1 if re.search(r"GIRIS_PORT\s*=", sunucu) else 0)
    hkm_db = 1 if (kok / "HKM/core/db.py").is_file() else 0
    return [
        olcut("kapi_yerel", "Kapı (yerel adres)", len(yerel), "ölçüldü",
              "sistem/sunucu.py SISTEMLER portları + GIRIS_PORT + HKM_PORT", ayrinti={"portlar": yerel}),
        olcut("kapi_ev_agi", "Kapı (ev ağı)", len(ev_agi), "ölçüldü",
              "sistem/telefon.py PORTLAR + KURULUM_PORT",
              ayrinti={"portlar": ev_agi, "tailscale": sorted(int(k) for k in uzak)}),
        olcut("veri_yeri", "Verinin doğrusu (yer)", kokenler + hkm_db + int(idb), "hesaplandı",
              "modül kökenleri + 4180 kökeni + hkm.db + IndexedDB medya (veri-katmani §1a-c)",
              ayrinti={"koken": kokenler, "hkm_db": hkm_db, "indexeddb": int(idb)}),
    ]


def kopyalar(kok):
    ortak = atama(kok, "tools/ortak.py", "DOSYALAR")
    # ortak.py yüklenirken brand/ortak'ta listede olmayan her .js/.css'i de ekler (s.513-516).
    if ortak is not None:
        ortak = set(ortak) | {p.name for p in (kok / "brand/ortak").glob("*") if p.suffix in (".js", ".css")}
    ortak = ortak or set()
    seviye = atama(kok, "tools/seviye.py", "DOSYALAR") or []
    hedef = atama(kok, "tools/ortak.py", "SISTEMLER") or []
    return [olcut("kopya_dosya", "Üçe kopyalanan dosya", len(ortak) + len(seviye), "ölçüldü",
                  "tools/ortak.py DOSYALAR girdisi + tools/seviye.py DOSYALAR girdisi (ast, çalıştırmadan)",
                  ayrinti={"ortak": len(ortak), "seviye": len(seviye), "hedef_modul": len(hedef),
                           "diskteki_kopya": (len(ortak) + len(seviye)) * len(hedef)})]


def ayarlar(kok):
    ay = oku(kok, "brand/ortak/ayarlar.js")
    an = oku(kok, "brand/ortak/animasyon.js")
    blok = re.search(r"SECIMLER\s*=\s*Object\.freeze\(\{(.*?)\n  \}\);", ay, re.S)
    secim = re.findall(r"\n\s*([a-zA-Z]+)\s*:\s*\{\s*anahtar", blok.group(1)) if blok else []
    denetimli = set(re.findall(r"secimHtml\('([a-zA-Z]+)'", ay)) | ({"vurgu"} if "vurguHtml(" in ay else set())
    denetimsiz = sorted(set(secim) - denetimli)
    # Elle yazılan yer: SECIMLER satırı + panel HTML'i; türetilmesi gereken listeler katalogdan değilse +1.
    elle = int(bool(secim)) + int(bool(re.search(r"secimHtml\(", ay)))
    turetilen = {"TASINAN": an, "PROFIL_KAPSAR": ay, "SIFIRLANAN": ay}
    elle += sum(1 for ad, m in turetilen.items()
                if re.search(ad + r"\s*=", m) and not re.search(ad + r"\s*=\s*[\w.]*katalogListe\(", m))
    if re.search(r"const ORTAK\s*=", an) and "KATALOG" not in (re.search(r"const ORTAK\s*=.*", an).group(0)):
        elle += 1
    return [
        olcut("ayar_yeri", "Elle yazılan ayar yeri", elle, "ölçüldü",
              "SECIMLER + secimHtml paneli; TASINAN/PROFIL_KAPSAR/SIFIRLANAN/ORTAK katalogdan türemiyorsa +1"),
        olcut("denetimsiz_secim", "Denetimsiz seçim", len(denetimsiz), "ölçüldü",
              "SECIMLER anahtarı − secimHtml('…') ile çizilenler − vurguHtml",
              ayrinti={"secim": len(secim), "denetimsiz": denetimsiz}),
    ]


def parcalar(kok):
    sonuc, ayr = {}, {}
    for tur in ("sayfa", "blok", "komut"):
        desen = r"\b(?:P|PARCA)\." + tur + r"\("
        kirilim = {m: sum(say(oku(kok, y), desen) for y in bul(kok, m + "/src/js/**/*.js") if "/core/" not in y)
                   for m in MODULLER}
        # shortcut: taban yöntemi brand/ortak'ı test dosyalarıyla sayıyordu (12 sayfanın 11'i testte); aynen korundu.
        kirilim["brand/ortak"] = sum(say(oku(kok, y), desen) for y in bul(kok, "brand/ortak/**/*.js"))
        sonuc[tur], ayr[tur] = sum(kirilim.values()), kirilim
    yol = "grep \\b(P|PARCA)\\.<tür>\\( : modül src/js (core hariç) + brand/ortak (testler dahil, taban yöntemi)"
    return [olcut(t, {"sayfa": "Sayfa", "blok": "Blok", "komut": "Komut"}[t], sonuc[t], "ölçüldü", yol,
                  ayrinti=ayr[t]) for t in ("sayfa", "blok", "komut")]


def sekmeler(kok):
    kirilim = {}
    for m in MODULLER:
        n = 0
        for y in bul(kok, m + "/src/js/screens/*.js"):
            t = oku(kok, y)
            gruplar = re.search(r"\bGRUPLAR\s*=\s*\[", t)
            tabs = re.search(r"\bTABS\s*=\s*\[", t)
            cagri = list(re.finditer(r"SayfaBolumleri\(\{", t))
            if tabs and not cagri:  # ESP disiplinleri TABS'ı ortak parts.js ile çizer
                n += ust_oge(t[tabs.end():dengeli(t, tabs.end() - 1)])
            for e in cagri:
                govde = t[e.end():dengeli(t, e.end() - 1)]
                b = re.search(r"bolumler\s*:\s*", govde)
                if not b:
                    continue
                kalan = govde[b.end():]
                if kalan.startswith("["):
                    n += ust_oge(kalan[1:dengeli(kalan, 0)])
                elif kalan.startswith("GRUPLAR.map") and gruplar:
                    n += ust_oge(t[gruplar.end():dengeli(t, gruplar.end() - 1)])
                elif kalan.startswith("TABS.map") and tabs:
                    n += ust_oge(t[tabs.end():dengeli(t, tabs.end() - 1)])
        kirilim[m] = n
    return [olcut("ekran_ici_sekme", "Ekran içi sekme", sum(kirilim.values()), "tahmin",
                  "screens/*.js: TABS dizisi öğeleri + SayfaBolumleri({bolumler:[…]}) / GRUPLAR.map öğeleri; "
                  "çalışma anında kurulan diziler (TABS.concat, bolumler()) sayılmaz",
                  ayrinti=kirilim)]


def ekranlar(kok):
    kirilim = {m: len(bul(kok, m + "/src/js/screens/*.js")) for m in MODULLER}
    return [olcut("ekran_dosyasi", "Ekran dosyası", sum(kirilim.values()), "ölçüldü",
                  "ls <modül>/src/js/screens/*.js", ayrinti=kirilim)]


def ic_icelik(kok):
    kirilim = {}
    for m in MODULLER:
        js = [oku(kok, y) for y in bul(kok, m + "/src/js/**/*.js") if not testmi(y)]
        if not js:
            continue
        hepsi = "\n".join(js)
        katlar = ["cekmece:" in hepsi,                               # çekmece
                  re.search(r"ek\s*:\s*\{\s*disc", hepsi) is not None,  # disiplin sayfası
                  re.search(r"\bTABS\s*=|SayfaBolumleri\(\{", hepsi) is not None,  # ekran içi sekme
                  re.search(r"\bK2?\.Entry\(", hepsi) is not None]    # açılır araç
        kirilim[m] = sum(katlar)
    return [olcut("ic_icelik", "İç içelik (kat)", max(kirilim.values()) if kirilim else 0, "hesaplandı",
                  "modül başına var olan katlar: çekmece › disiplin (ek:{disc}) › sekme (TABS/SayfaBolumleri) › "
                  "açılır araç (K.Entry); en derini", ayrinti=kirilim)]


# Envanterde elle bulunmuş yapıların imzası (dosya, desen). Silinen yapı sayıdan düşer;
# shortcut: yeni eklenen yapı otomatik bulunmaz, yeni motor (motor/) imzası belli olunca eklenmeli.
TEKRAR_IMZA = {
    "ays_kart": ("AYS/src/js/data/reference.js", r"SRS_INTERVALS"),
    "ays_yanlis_kart": ("AYS/src/js/screens/exams.js", r"source\s*:\s*'error'"),
    "ays_konu_kapanis": ("AYS/src/js/data/subjects.js", r"CLOSURE_RULE"),
    "ays_hedef_tekrar": ("AYS/src/js/core/hedefplan.js", r"TEKRAR_ARALIK"),
    "esp_srs": ("ESP/src/js/core/srs.js", None),
    "ogret": ("brand/ortak/ogret.js", r"ARALIK\s*=\s*\[1,\s*3,\s*7\]"),
    "king_devrim": ("brand/ortak/king-devrim.js", r"KD_ARALIK"),
    "usta": ("brand/ortak/usta.js", r"\bARA\s*=\s*\{"),
    "kavrat_ogrenmotor": ("brand/ortak/kavrat.js", None),
}
NOT_IMZA = {
    "defter": ("brand/ortak/defter.js", None),
    "notum": ("brand/ortak/notum.js", None),
    "ays_konu_notu": ("AYS/src/js/core/konunotu.js", None),
    "ays_video_notu": ("AYS/src/js/core/state.js", r"newVideoNote"),
    "ays_yanlis_defteri": ("AYS/src/js/core/state.js", r"errors/"),
    "esp_not": ("ESP/src/js/core/state.js", r"newNote\b"),
    "esp_kitap": ("ESP/src/js/core/state.js", r"newBook\b"),
    "esp_tez": ("ESP/src/js/core/state.js", r"newArgument\b"),
    "esp_taslak": ("ESP/src/js/core/state.js", r"newDraft\b"),
    "spi_kayit_notu": ("SPI/src/js/core/state.js", r"note\s*:\s*''"),
    "ogrenmotor_notu": ("brand/ortak/ogrenmotor.js", r"notYaz"),
    "defter_sozluk": ("brand/ortak/defter.js", r"defterterim/"),
    "king_hafiza": ("HKM/core/db.py", r"\bmemories\b"),
    "hafiza_katman": ("brand/ortak/hafiza.js", None),
    "meydan_deste": ("HKM/core/db.py", r"meydan_deste"),
    "bilinc": ("brand/ortak/bilinc.js", None),
}
AG_IMZA = {"defter_ag": ("brand/ortak/defter.js", r"\bagCiz\b"), "bilinc_ag": ("brand/ortak/bilinc.js", r"\bharitaSvg\b")}
AG_YOLU_IMZA = {
    "tek_dosya": ("tools/ortak.py", None),  # dist/<modül>.html derlemesi üç build.py ile; bkz. ayrinti
    "ev_agi": ("sistem/telefon.py", None),
    "tailscale": ("sistem/uzak.py", None),
    "ios_kabugu": ("uygulama/ios/LifeOS/YerelSunucu.swift", None),
}
BAGLANMA_IMZA = {
    "pc_tarayici": ("sistem/sunucu.py", None),
    "electron": ("uygulama/masaustu/main.js", None),
    "android_pwa": ("brand/ortak/sw.js", None),
    "kisayollar": ("sistem/hesap.py", r"ozet\.txt"),
    "takvim": ("sistem/hesap.py", r"TAKVIM_YOL_RE"),
}


def imzali(kok, tablo):
    return sorted(k for k, (y, d) in tablo.items() if imza(kok, y, d))


def motor_yapilari(kok):
    tekrar = imzali(kok, TEKRAR_IMZA)
    notlar = imzali(kok, NOT_IMZA)
    ag = imzali(kok, AG_IMZA)
    tek = any((kok / m / "build.py").is_file() for m in MODULLER)
    yollar = [k for k in imzali(kok, AG_YOLU_IMZA) if k != "tek_dosya"] + (["tek_dosya"] if tek else [])
    baglanma = sorted(set(yollar) | set(imzali(kok, BAGLANMA_IMZA)))
    return [
        olcut("tekrar_zamanlayici", "Tekrar zamanlayıcısı", len(tekrar), "ölçüldü",
              "not-ve-tekrar §4'teki 9 uygulamanın imzası (dosya + desen) hâlâ var mı",
              ayrinti={"var": tekrar, "yetim_tablo": int(imza(kok, "HKM/core/db.py", r"meydan_deste"))}),
        olcut("not_yapisi", "Not yapısı", len(notlar), "ölçüldü",
              "not-ve-tekrar §1-2'deki yapıların imzası: defter + §2 tablosunun 15 satırı", ayrinti={"var": notlar}),
        olcut("ag_cizimi", "Ağ çizimi", len(ag), "ölçüldü", "defter.js agCiz + bilinc.js haritaSvg",
              ayrinti={"var": ag}),
        olcut("cihaz_yolu", "Cihaz yolu (ağ yolu)", len(yollar), "ölçüldü",
              "tek dosya (modül build.py) + ev ağı (telefon.py) + Tailscale (uzak.py) + iOS kabuğu",
              ayrinti={"ag_yolu": sorted(yollar), "baglanma_bicimi": len(baglanma)}),
    ]


def kesinlik(kok):
    kod = [y for y in bul(kok, "**/*.js") + bul(kok, "**/*.py")
           if not testmi(y) and y.split("/")[0] in ("brand", "HKM", "sistem") + MODULLER and "/dist/" not in y]
    metinler = {y: oku(kok, y) for y in kod}
    derived = sorted(y for y, t in metinler.items() if "'derived'" in t)
    computed = any("'computed'" in t or '"computed"' in t for t in metinler.values())
    diller = int(computed) + int(bool(derived))
    return [olcut("kesinlik_dili", "Kesinlik etiketi dili", diller, "ölçüldü",
                  "«hesaplandı» için koddaki ayrı yazımlar: 'computed' ve 'derived' (testler hariç)",
                  ayrinti={"derived_dosya": len(derived)})]


def hkm(kok):
    db = oku(kok, "HKM/core/db.py")
    tablo = sum(1 for s in db.splitlines() if "CREATE TABLE" in s and not s.strip().startswith("#"))
    api = len(set(re.findall(r"[\"'](/api/[^\"'\s?]*)", oku(kok, "HKM/daemon.py"))))
    return [
        olcut("hkm_tablo", "HKM tablo", tablo, "ölçüldü", "HKM/core/db.py CREATE TABLE (yorum satırı hariç)"),
        olcut("hkm_api", "HKM /api/ yolu", api, "ölçüldü", "HKM/daemon.py tırnak içindeki benzersiz /api/… dizgesi"),
        olcut("hkm_cekirdek", "HKM çekirdek dosyası", len(bul(kok, "HKM/core/*.py")), "ölçüldü",
              "ls HKM/core/*.py (__init__ dahil)"),
    ]


def kod_hacmi(kok):
    satir = bayt = dosya = 0
    for dizin, altlar, adlar in os.walk(kok):
        rel = Path(dizin).relative_to(kok).as_posix()
        ust = rel.split("/")[0]
        altlar[:] = sorted(a for a in altlar if a not in TEST_DIZIN and not a.startswith("."))
        if ust in ("tools", "belgeler", "veri", "kalite", "arsiv"):
            altlar[:] = []
            continue
        for ad in sorted(adlar):
            y = (rel + "/" + ad) if rel != "." else ad
            if ad.rsplit(".", 1)[-1] in ("js", "css", "py", "html") and not testmi(y):
                veri = (kok / y).read_bytes()
                dosya, bayt, satir = dosya + 1, bayt + len(veri), satir + veri.count(b"\n")
    return [olcut("kod_hacmi", "Kod hacmi (satır)", satir, "ölçüldü",
                  "test dışı .js/.css/.py/.html satırı; tools, belgeler, veri, kalite, dist, testler hariç; "
                  "kopyalar dahil (dağıtılan kod)", ayrinti={"dosya": dosya, "bayt": bayt})]


# ---------- King ölçütleri ----------

ARAC_DESENI = r"\bad\s*:\s*'([a-z0-9_]+)'\s*,\s*tur\s*:\s*'(oku|yaz)'"
YETKI_DESENI = r"\bid\s*:\s*'([a-z-]+)'\s*,\s*seviye\s*:\s*'"


def king(kok):
    kirilim, oku_yaz = {}, {"oku": 0, "yaz": 0}

    def ekle(ad, adlar):
        kirilim[ad] = kirilim.get(ad, 0) + len(adlar)
        for _, tur in adlar:
            oku_yaz[tur] += 1

    ka = oku(kok, "brand/ortak/king-arac.js")
    ekle("ortak", re.findall(ARAC_DESENI, ka) + [(a, "yaz") for a in re.findall(r"\bdis\('([a-z0-9_]+)'", ka)]
         + re.findall(r"\{\s*ad\s*:\s*'([a-z0-9_]+)'\s*,\s*tahminle\s*:[^\n]*?tur\s*:\s*'(oku|yaz)'", ka))
    for m in MODULLER:
        ekle(m, re.findall(ARAC_DESENI, oku(kok, m + "/src/js/core/kingarac.js")))
    okuma = say(oku(kok, "AYS/src/js/core/tools.js"), r"\bname\s*:\s*'")
    eylem = [p for p in re.split(r"\n\s*\{\s*id\s*:\s*'", oku(kok, "AYS/src/js/data/actions.js"))[1:]
             if not re.search(r"\b(?:modelYok|olcum)\s*:\s*(?!false)", p)]
    kirilim["AYS"] = kirilim.get("AYS", 0) + okuma + len(eylem)
    oku_yaz["oku"] += okuma
    oku_yaz["yaz"] += len(eylem)
    ogret = oku(kok, "brand/ortak/ogret.js")
    kirilim["ogretme"] = len(set(re.findall(r"_(tekrarlarim|yanlis_teshis)", ogret))) * len(MODULLER) if ogret else 0
    oku_yaz["oku"] += kirilim["ogretme"]
    gorunen = sum(kirilim.values())
    yetki = say(oku(kok, "brand/ortak/yetki.js"), YETKI_DESENI)
    modul_eki = sum(say(re.sub(r"\n\s*", " ", oku(kok, m + "/src/js/app.js")), r"(?:eylemler\s*:\s*\[|\}\s*,)\s*\{\s*id\s*:\s*'[a-z-]+'\s*,\s*seviye\s*:\s*'")
                    for m in MODULLER)
    kinds = atama(kok, "HKM/core/intents.py", "KINDS") or {}
    komut = atama(kok, "HKM/core/patron.py", "COMMANDS") or []
    toplam = gorunen + yetki + modul_eki + len(kinds) + len(komut)
    k = oku(kok, "brand/ortak/king.js")
    niyet = re.search(r"const NIYET\s*=\s*\[", k)
    niyet_n = ust_oge(k[niyet.end():dengeli(k, niyet.end() - 1)]) if niyet else 0
    rehber = re.findall(r"es:\[([^\]]*)\]", oku(kok, "brand/ortak/parca-rehber.js"))
    sinav = oku(kok, "tools/king_sinav.json")
    try:
        cumle = len(json.loads(sinav).get("cumleler", [])) if sinav else 0
    except ValueError:
        cumle = 0
    vaka = sum(say(oku(kok, y), r'"id"\s*:') for y in bul(kok, "tools/king_bench/paket/*.json"))
    return [
        olcut("king_gorunen_arac", "King'in gördüğü araç", gorunen, "ölçüldü",
              "model kataloğu: king-arac.js + 3 kingarac.js ad/tur + AYS tools.js name + actions.js "
              "(modelYok/olcum hariç) + ogret.js 2×3 (king-hkm §3)", "king",
              ayrinti={"kirilim": kirilim, "oku": oku_yaz["oku"], "yaz": oku_yaz["yaz"]}),
        olcut("king_toplam_arac", "King aracı (toplam)", toplam, "ölçüldü",
              "görünen + yetki.js seviyeli eylem + modül eki (app.js eylemler) + intents KINDS + patron COMMANDS",
              "king", ayrinti={"yetki": yetki, "modul_eki": modul_eki, "niyet_turu": len(kinds),
                               "patron_komutu": len(komut)}),
        olcut("king_niyet_kurali", "Sözcük yönlendirmesi: NIYET kuralı", niyet_n, "ölçüldü",
              "brand/ortak/king.js const NIYET dizisinin öğesi", "king"),
        olcut("king_rehber_sozcuk", "Sözcük yönlendirmesi: sayfa rehberi sözcüğü",
              sum(say(e, r"'[^']*'") for e in rehber), "ölçüldü",
              "brand/ortak/parca-rehber.js es:[…] dizgeleri", "king", ayrinti={"sayfa": len(rehber)}),
        olcut("king_bench_yamasi", "Bench yaması", say(oku(kok, "brand/ortak/king-yol.js"), r"Bench"), "ölçüldü",
              "brand/ortak/king-yol.js içinde «Bench» geçen yorum", "king"),
        olcut("king_sinav_cumle", "Sınav cümlesi", cumle, "ölçüldü", "tools/king_sinav.json cumleler", "king"),
        olcut("king_bench_vaka", "King-Bench vakası", vaka, "ölçüldü", "tools/king_bench/paket/*.json \"id\"", "king"),
    ]


# ---------- Hız bütçesinin statik parçası (plan A9; süre ölçmez, CI'da oynamaz) ----------

def hiz(kok):
    spec = importlib.util.spec_from_file_location("egri_optimizasyon_hiz", EGRI_DIZIN / "optimizasyon.py")
    opt = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(opt)
    kabuk = opt.dagitilan(kok).get("kabuk", [])  # Optimizasyon eğrisiyle aynı sayım: index.html + bağladıkları
    paket = {p.relative_to(kok).as_posix(): p.stat().st_size for p in sorted(kok.glob("alan/*/asama-*.json"))}
    en = max(paket.items(), key=lambda kv: (kv[1], kv[0])) if paket else (None, None)
    return [
        olcut("kabuk_acilis_yuku", "Kabuk açılış yükü (bayt)", sum(p.stat().st_size for p in kabuk) if kabuk else None,
              "ölçüldü", "kabuk/index.html + src/href ile bağladığı .js/.css (motor/ ve brand/ dahil; yazı tipi, görsel, "
              "sonradan yüklenen alan paketi hariç)", ayrinti={"dosya": len(kabuk)}),
        olcut("alan_paketi_en_buyuk", "En büyük alan paketi (bayt)", en[1], "ölçüldü",
              "alan/*/asama-*.json içinde en büyüğü (alan açılınca tek seferde yüklenen paket)", ayrinti={"dosya": en[0]}),
    ]


# ---------- Kullanım sayacı (plan A2; yazan kalite/kullanim.js) ----------

KULLANIM = "kalite/veri/yerel/kullanim.json"  # git dışı (kalite/veri/yerel/.gitignore): yalnız bu bilgisayar
KULLANIM_GUN = 28


def kullanim(kok):
    """Son 28 gün (verideki en yeni güne kadar; bugünün tarihine değil, aynı girdi aynı kayıt) açılış sayısı."""
    komut = f"kabuk kalite/kullanim.js ile sayınca tarayıcı deposundaki «lifeos.kullanim» değeri {KULLANIM}'a yazılır"
    try:
        v = json.loads(oku(kok, KULLANIM) or "null")
        gunler = v["gunler"] if v and v.get("surum") == 1 and isinstance(v.get("gunler"), dict) else {}
        gunler = {g: s for g, s in gunler.items() if re.fullmatch(r"\d{4}-\d{2}-\d{2}", g) and isinstance(s, dict)}
    except (ValueError, AttributeError, TypeError):
        gunler = {}
    sayi, ayr = {}, {"dosya": KULLANIM, "pencere_gun": KULLANIM_GUN}
    if gunler:
        son = datetime.date.fromisoformat(max(gunler))
        bas = (son - datetime.timedelta(days=KULLANIM_GUN - 1)).isoformat()
        for g, s in gunler.items():
            for k, n in s.items():
                if g >= bas and isinstance(n, int) and n > 0 and re.fullmatch(r"(?:ekran|arac)/[a-z0-9-]+", k):
                    sayi[k] = sayi.get(k, 0) + n
        yerler = set(re.findall(r"\{\s*id\s*:\s*'([a-z0-9-]+)'", oku(kok, "kabuk/harita.js")))
        acilan = {k.split("/", 1)[1] for k in sayi}
        ayr.update(bas=bas, son=son.isoformat(), sayim=dict(sorted(sayi.items(), key=lambda kv: (-kv[1], kv[0]))),
                   hic_acilmayan_yer=sorted(yerler - acilan))
    deger = sum(sayi.values()) or None
    return [dict(olcut("kullanim", "Kullanım (son 28 gün açılış)", deger, "ölçüldü" if deger else "veri yok",
                       "kalite/kullanim.js'nin bu bilgisayarda gün gün saydığı ekran/araç açılışı; " + KULLANIM,
                       ayrinti=ayr), komut=komut)]


# ---------- Eğriler (plan §6: 10 King + 3 Sistem) ----------
# Eğri eklemek dosya eklemektir: kalite/egri/<ad>.py → AD, TANIM ve
# olc(kok) -> {deger, birim, etiket, durum, ayrinti, komut}. Alt çizgili dosya yardımcıdır.

EGRI_DIZIN = BURASI / "egri"


def egriler(kok):
    if str(EGRI_DIZIN) not in sys.path:
        sys.path.insert(0, str(EGRI_DIZIN))  # eğriler ortak yardımcıyı (_sinav) adıyla alır
    sonuc = []
    for yol in sorted(EGRI_DIZIN.glob("[!_]*.py")):
        try:
            spec = importlib.util.spec_from_file_location("egri_" + yol.stem, yol)
            m = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(m)
            r = m.olc(kok)
            o = dict(olcut("egri_" + yol.stem, m.AD, r["deger"], r["etiket"], m.TANIM, "egri", r.get("ayrinti")),
                     birim=r.get("birim"), komut=r["komut"])
            # sözleşme: değer yoksa durum ölçülmedi ve etiket «veri yok»; değer varsa etiket «veri yok» olamaz
            assert o["durum"] == r["durum"] and (r["deger"] is None) == (r["etiket"] == "veri yok"), "eğri sözleşmesi bozuk"
        except Exception as e:  # bozuk bir eğri ölçümün tamamını düşürmesin; değersiz kalır, hatası yazılır
            o = dict(olcut("egri_" + yol.stem, yol.stem, None, "veri yok", "", "egri",
                           {"hata": type(e).__name__ + ": " + str(e)}),
                     birim=None, komut=f"kalite/egri/{yol.name} düzeltilmeli")
        sonuc.append(o)
    return sonuc


OLCUMLER = [uygulamalar, kapilar, kopyalar, ayarlar, ic_icelik, parcalar, sekmeler, ekranlar,
            motor_yapilari, kesinlik, hkm, kod_hacmi, king, hiz, kullanim, egriler]


def olc(kok=KOK):
    kok = Path(kok)
    sonuc = {}
    for f in OLCUMLER:
        for o in f(kok):
            sonuc[o["id"]] = o
    return sonuc


# ---------- Bütçe ----------

def butce_oku(yol=BURASI / "butce.json"):
    return json.loads(Path(yol).read_text(encoding="utf-8"))["olcutler"]


def son_kayit(kayit_dizin=BURASI / "kayit"):
    kayitlar = sorted(Path(kayit_dizin).glob("????-??-??.json"))
    if not kayitlar:
        return None, {}
    son = kayitlar[-1]
    return son.stem, json.loads(son.read_text(encoding="utf-8"))["olcutler"]


def denetle(olcum, butce, onceki, onceki_ad=None):
    """Aşım satırları (Türkçe). Başvuru: son kayıttaki değer, kayıtta yoksa taban.
    Kural 5: aynı gruptan bir parça çıktıysa (grup toplamı artmadıysa) artış takastır."""
    def ref(id_):
        v = (onceki.get(id_) or {}).get("deger")
        return v if isinstance(v, (int, float)) else butce[id_].get("taban")

    artis, notlar, gruplar, tavan = {}, [], {}, []
    for id_, b in sorted(butce.items()):
        if b.get("yon") == "tavan":  # hız bütçesi: kayda değil sabit tavana karşı; takas yok
            o = olcum.get(id_)
            if not o or o["deger"] is None:
                notlar.append(f"UYARI: {id_} ölçülemedi; tavanı denetlenmedi.")
            elif o["deger"] > b["tavan"]:
                tavan.append(f"AŞIM: {o['ad']} {o['deger']} > tavan {b['tavan']}; hız bütçesi. "
                             "Yük azaltılmadan birleştirilmez.")
            continue
        if b.get("yon") not in ("artmamali", "azalmali"):
            continue
        o = olcum.get(id_)
        if not o or o["deger"] is None or ref(id_) is None:
            notlar.append(f"UYARI: {id_} ölçülemedi ya da başvurusu yok; bütçesi denetlenmedi.")
            continue
        if b.get("grup"):
            gruplar.setdefault(b["grup"], []).append(id_)
        if o["deger"] > ref(id_):
            artis[id_] = (ref(id_), o["deger"])
    satirlar = tavan
    for id_, (once_v, simdi) in sorted(artis.items()):
        grup = butce[id_].get("grup")
        if grup:
            uyeler = gruplar[grup]
            if sum(olcum[u]["deger"] for u in uyeler) <= sum(ref(u) for u in uyeler):
                notlar.append(f"TAKAS: {olcum[id_]['ad']} {once_v} → {simdi}; «{grup}» grubunun toplamı artmadı (kural 5).")
                continue
        kayitta = isinstance((onceki.get(id_) or {}).get("deger"), (int, float))
        kaynak = f"son kayıt {onceki_ad}" if onceki_ad and kayitta else "taban"
        satirlar.append(f"AŞIM: {olcum[id_]['ad']} {once_v} → {simdi} ({kaynak}); bütçe «{butce[id_]['yon']}». "
                        "Kural 5: yeni parça ancak eskisi çıkınca girer.")
    return satirlar, notlar


def md(olcum, butce):
    s = ["| Ölçüt | Bugün | Taban | Hedef | Kesinlik |", "|---|---|---|---|---|"]
    for id_, o in sorted(olcum.items(), key=lambda kv: (kv[1]["katman"], kv[0])):
        if o["durum"] != "ölçüldü":
            continue
        b = butce.get(id_, {})
        taban, hedef = (("—" if b.get(k) is None else b[k]) for k in ("taban", "tavan" if "tavan" in b else "hedef"))
        hedef = f"≤ {hedef}" if "tavan" in b else hedef
        birim = f" {o['birim']}" if o.get("birim") else ""
        s.append(f"| {o['ad']} | {o['deger']}{birim} | {taban} | {hedef} | {o['etiket']} |")
    s += ["", "Ölçülmedi (değer yok; ölçecek komut):"]
    for _, o in sorted(olcum.items()):
        if o["durum"] == "ölçülmedi":
            v = o["ayrinti"].get("vekil") or {}
            s.append(f"- {o['ad']}: {o.get('komut') or o['yol']}" + (f" · {v['ad']} = {v['deger']} ({v['etiket']}, eğri değil)" if v else ""))
    return "\n".join(s)


def kayit_metni(olcum, tarih):
    return json.dumps({"tarih": tarih, "surum": 1, "olcutler": olcum}, ensure_ascii=False, sort_keys=True, indent=1) + "\n"


def main(argv=None):
    for akis in (sys.stdout, sys.stderr):
        try:
            akis.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--kaydet", action="store_true")
    ap.add_argument("--denetle", action="store_true")
    ap.add_argument("--md", action="store_true")
    ap.add_argument("--kok", default=str(KOK), help=argparse.SUPPRESS)
    ap.add_argument("--kalite", default=str(BURASI), help=argparse.SUPPRESS)
    a = ap.parse_args(argv)
    kalite = Path(a.kalite)
    olcum = olc(a.kok)
    butce = butce_oku(kalite / "butce.json") if (kalite / "butce.json").is_file() else {}
    if a.kaydet:
        tarih = datetime.date.today().isoformat()
        (kalite / "kayit").mkdir(exist_ok=True)
        (kalite / "kayit" / f"{tarih}.json").write_text(kayit_metni(olcum, tarih), encoding="utf-8")
        print(f"yazıldı: kalite/kayit/{tarih}.json")
    if a.denetle:
        ad, onceki = son_kayit(kalite / "kayit")
        satirlar, notlar = denetle(olcum, butce, onceki, ad)
        for s in notlar + satirlar:
            print(s)
        if satirlar:
            return 1
        print(f"Bütçe tamam: {sum(1 for b in butce.values() if b.get('yon') in ('artmamali', 'azalmali', 'tavan'))} bütçe, aşım yok.")
    if a.md:
        print(md(olcum, butce))
    if not (a.kaydet or a.denetle or a.md):
        print(json.dumps(olcum, ensure_ascii=False, sort_keys=True, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
