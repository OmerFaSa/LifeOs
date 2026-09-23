# -*- coding: utf-8 -*-
"""Planlama Ofisi v1 — hedefi haftalik bir yol haritasina ceviren KURAL.

   BAM'in dort ofisinden biri (core/bam.py). v1 model kullanmaz: modulun
   kendi plan motorunun (SPI src/js/core/plan.js) kurdugu planin OZETINI
   alir ve uc sey uretir:

     program     donem -> hafta -> gorev. Her haftanin beklenen degeri,
                 tarti gunu, gunluk enerji ve protein hedefi (modul
                 verdiyse), kullanicinin verdigi vakit, dort haftada bir
                 degerlendirme.
     simulasyon  «bu hizla giderse ne zaman biter»: plan temposu, onun
                 dortte ucu ve yarisi. Aritmetik kesindir ama girdisi
                 (tempo, kilo) tahmin tasidigi icin sonuc «tahmin»dir.
     denetim     plan denetcisi: tempo guvenli bantta mi, enerji bazal
                 metabolizmanin altina iniyor mu, hekim kapisindaki bir
                 planda enerji hedefi yazilmis mi. KRITIK bir madde
                 gecmezse program TEKLIF EDILMEZ.

   Degismezler:
   1. PAKETI OLMAYAN HEDEFTE PLAN KURULMAZ. v1 yalniz SPI kilo paketini
      tanir; tanimadigini «ertelendi» diye birakir, uydurmaz.
   2. MODULUN SAYISI YENIDEN HESAPLANMAZ, DENETLENIR. Enerji ve protein
      SPI'nin kendi hesabidir (bazal metabolizma, aktivite, kilo);
      Planlama onlari yalniz takvime yerlestirir ve sinira karsi sinar.
   3. KISISEL VERI EN AZ. Girdi planin ozetidir (tarih, tempo, kilo ve
      etiketi); tahlil, ilac adi, hekim talimatinin METNI gelmez — yalniz
      sayisi. Tanimsiz alan sessizce DUSER, saklanmaz."""
import datetime
import hashlib
import json
import math

PAKETLER = ("kilo",)
YONLER = ("azalt", "artir")
ETIKETLER = ("olculdu", "tahmin", "hesaplandi", "veri_yok")
GUNLER = ("Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar")

# Plan denetcisinin esikleri — SPI'nin kendi paketiyle AYNI sayilar
# (SPI core/hedefler.js: KAYIP ust %1, guvenlik siniri %1,5; ALIM ust
# %0,5). Iki yerde iki esik olursa bir gun ayrisirlar: bu yuzden
# denetim, modulun izin verdigini degil, GUVENLIK SINIRINI sinar.
KAYIP_UST = 0.01
KAYIP_SINIR = 0.015
ALIM_UST = 0.005
EN_COK_HAFTA = 104
DEGERLENDIRME_ARALIGI = 4


def _tarih(x):
    try:
        return datetime.date.fromisoformat(str(x))
    except (TypeError, ValueError):
        return None


def _sayi(x, alt, ust):
    if isinstance(x, bool) or not isinstance(x, (int, float)):
        return None
    if not (alt <= float(x) <= ust) or not math.isfinite(float(x)):
        return None
    return float(x)


def _yaz(x, n=1):
    """Turkce ondalik: 83.7 -> «83,7». Tam sayi ise ondalik yazilmaz."""
    x = round(float(x), n)
    s = ("%d" % x) if x == int(x) else (("%." + str(n) + "f") % x).rstrip("0").rstrip(".")
    return s.replace(".", ",")


def _binlik(n):
    return "{:,}".format(int(round(n))).replace(",", ".")


def _tarih_yaz(d):
    ay = ("Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz",
          "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık")
    return "%d %s %d" % (d.day, ay[d.month - 1], d.year)


# ---------------------------------------------------------------- girdi

def temizle(ham):
    """Modulun gonderdigi plan ozetini dogrular. (girdi, hatalar).

    Yalniz tanimli alanlar gecer; bilinmeyen alan HATA degildir ama
    SAKLANMAZ (mahremiyet: modul fazlasini gonderse de ambara girmez)."""
    if not isinstance(ham, dict):
        return None, ["plan bir nesne olmalı"]
    h = []
    paket = ham.get("paket")
    if paket not in PAKETLER:
        h.append("tanımsız paket: %r" % (paket,))
    yon = ham.get("yon")
    if yon not in YONLER:
        h.append("yön «azalt» ya da «artir» olmalı")
    bas, bit = _tarih(ham.get("baslangic")), _tarih(ham.get("bitis"))
    if not bas:
        h.append("başlangıç yyyy-aa-gg biçiminde olmalı")
    if not bit:
        h.append("bitiş yyyy-aa-gg biçiminde olmalı")
    if bas and bit and bit <= bas:
        h.append("bitiş başlangıçtan sonra olmalı")
    hafta = ham.get("hafta")
    if isinstance(hafta, bool) or not isinstance(hafta, int) or not (1 <= hafta <= EN_COK_HAFTA):
        h.append("hafta 1–%d arasında bir tam sayı olmalı (plan en çok iki yıl sürer)" % EN_COK_HAFTA)
    tempo = _sayi(ham.get("tempo"), 0.01, 5)
    if tempo is None:
        h.append("tempo haftada 0,01–5 kg aralığında olmalı")
    s = ham.get("simdi") or {}
    simdi = _sayi(s.get("deger") if isinstance(s, dict) else None, 20, 400)
    if simdi is None:
        h.append("şu anki kilo 20–400 kg aralığında olmalı")
    s_etiket = s.get("etiket") if isinstance(s, dict) else None
    if s_etiket not in ETIKETLER:
        h.append("şu anki kilonun etiketi tanımsız")
    hedef = _sayi(ham.get("hedef_deger"), 20, 400)
    if hedef is None:
        h.append("hedef kilo 20–400 kg aralığında olmalı")
    if yon and simdi is not None and hedef is not None:
        if (yon == "azalt" and hedef >= simdi) or (yon == "artir" and hedef <= simdi):
            h.append("hedef kilo yönle çelişiyor")

    enerji = None
    e = ham.get("enerji")
    if e is not None:
        kcal = _sayi((e or {}).get("kcal") if isinstance(e, dict) else None, 800, 6000)
        taban = (e or {}).get("taban") if isinstance(e, dict) else None
        taban = _sayi(taban, 600, 5000) if taban is not None else None
        if kcal is None:
            h.append("enerji hedefi 800–6000 kcal aralığında olmalı")
        else:
            enerji = {"kcal": int(round(kcal)),
                      "taban": int(round(taban)) if taban is not None else None,
                      "etiket": e.get("etiket") if e.get("etiket") in ETIKETLER else "tahmin"}
    protein = None
    p = ham.get("protein")
    if p is not None:
        lo = _sayi((p or {}).get("min") if isinstance(p, dict) else None, 10, 500)
        hi = _sayi((p or {}).get("max") if isinstance(p, dict) else None, 10, 500)
        if lo is None or hi is None or hi < lo:
            h.append("protein bandı 10–500 g aralığında olmalı, alt sınır üst sınırı geçmemeli")
        else:
            protein = {"min": int(round(lo)), "max": int(round(hi))}
    kapasite = None
    k = ham.get("kapasite")
    if isinstance(k, dict):
        dk = k.get("gunluk_dk")
        gun = k.get("haftalik_gun")
        kapasite = {}
        if isinstance(dk, int) and not isinstance(dk, bool) and 5 <= dk <= 600:
            kapasite["gunluk_dk"] = dk
        if isinstance(gun, int) and not isinstance(gun, bool) and 1 <= gun <= 7:
            kapasite["haftalik_gun"] = gun
        kapasite = kapasite or None
    talimat = ham.get("talimat", 0)
    if isinstance(talimat, bool) or not isinstance(talimat, int) or not (0 <= talimat <= 100):
        h.append("talimat bir sayı olmalı (talimatın metni gönderilmez)")
    hekim = ham.get("hekim_kapisi", False)
    if not isinstance(hekim, bool):
        h.append("hekim kapısı true ya da false olmalı")
    hedef_id = str(ham.get("hedef_id") or "").strip()
    if not (1 <= len(hedef_id) <= 40):
        h.append("hedef kimliği 1–40 karakter olmalı")
    if h:
        return None, h
    return {"paket": paket, "yon": yon, "hedef_id": hedef_id,
            "baslangic": bas.isoformat(), "bitis": bit.isoformat(), "hafta": hafta,
            "tempo": round(tempo, 3), "simdi": {"deger": round(simdi, 1), "etiket": s_etiket},
            "hedef_deger": round(hedef, 1), "enerji": enerji, "protein": protein,
            "kapasite": kapasite, "hekim_kapisi": hekim, "talimat": talimat}, []


def anahtar(girdi):
    """Ayni girdi -> ayni anahtar. «Once depo» (PLAN §1.5): ayni plan ikinci
    kez istenirse yeniden kurulmaz."""
    ham = json.dumps(girdi, sort_keys=True, ensure_ascii=False)
    return hashlib.sha1(ham.encode("utf-8")).hexdigest()[:20]


# -------------------------------------------------------------- program

def _beklenen(g, hafta_no):
    adim = g["tempo"] * hafta_no
    if g["yon"] == "azalt":
        return max(g["hedef_deger"], g["simdi"]["deger"] - adim)
    return min(g["hedef_deger"], g["simdi"]["deger"] + adim)


def program_kur(g):
    """Donem -> hafta -> gorev. Hafta 0 baslangic tartisidir (taban);
    i. haftanin kontrol tartisi baslangictan 7*i gun sonradir, yani tarti
    gunu baslangicin haftanin gunudur."""
    bas = _tarih(g["baslangic"])
    gun_adi = GUNLER[bas.weekday()]
    haftalar = []
    for i in range(1, g["hafta"] + 1):
        h_bas = bas + datetime.timedelta(days=7 * (i - 1) + 1)
        tarti = bas + datetime.timedelta(days=7 * i)
        beklenen = round(_beklenen(g, i), 1)
        gorevler = [{"tur": "tarti", "tarih": tarti.isoformat(),
                     "metin": "%s sabah, aç karnına tartıl; beklenen %s kg."
                              % (gun_adi, _yaz(beklenen))}]
        if g["enerji"]:
            gorevler.append({"tur": "enerji", "metin": "Günlük enerji hedefi yaklaşık %s kcal (%s)."
                             % (_binlik(g["enerji"]["kcal"]),
                                "tahmin" if g["enerji"]["etiket"] != "olculdu" else "ölçüldü")})
        if g["protein"]:
            gorevler.append({"tur": "protein", "metin": "Günlük protein %d–%d g."
                             % (g["protein"]["min"], g["protein"]["max"])})
        kap = g["kapasite"] or {}
        if kap.get("gunluk_dk"):
            gorevler.append({"tur": "hareket", "metin": "%sgünde %d dakika hareket (senin verdiğin vakit)."
                             % (("Haftada %d gün, " % kap["haftalik_gun"])
                                if kap.get("haftalik_gun") else "", kap["gunluk_dk"])})
        if i == g["hafta"]:
            gorevler.append({"tur": "kapanis", "metin": "Son tartı: hedef %s kg. Hedefe varıldıysa "
                             "hedefi «tamamlandı» yap." % _yaz(g["hedef_deger"])})
        elif i % DEGERLENDIRME_ARALIGI == 0:
            gorevler.append({"tur": "degerlendirme",
                             "metin": "%d haftalık değerlendirme: ölçülen kilo beklenenle "
                                      "karşılaştırılır; sapma varsa plan farkı önerilir." % i})
        haftalar.append({"no": i, "baslangic": h_bas.isoformat(), "bitis": tarti.isoformat(),
                         "beklenen": beklenen, "gorevler": gorevler,
                         "aralik": "%s – %s" % (_tarih_yaz(h_bas), _tarih_yaz(tarti))})
    donemler = []
    for d in range(0, len(haftalar), DEGERLENDIRME_ARALIGI):
        parca = haftalar[d:d + DEGERLENDIRME_ARALIGI]
        ilk, son = parca[0]["no"], parca[-1]["no"]
        # Ekrana giden metin SUNUCUDA kurulur: pano sayi bicimlemez.
        donemler.append({"no": len(donemler) + 1, "ilk_hafta": ilk, "son_hafta": son,
                         "baslangic": parca[0]["baslangic"], "bitis": parca[-1]["bitis"],
                         "beklenen": parca[-1]["beklenen"],
                         "metin": "Dönem %d · %s · beklenen %s kg" % (
                             len(donemler) + 1,
                             ("hafta %d" % ilk) if ilk == son else ("hafta %d–%d" % (ilk, son)),
                             _yaz(parca[-1]["beklenen"]))})
    return {"tarti_gunu": gun_adi, "haftalar": haftalar, "donemler": donemler}


# ------------------------------------------------------------ simulasyon

def simule(g):
    """«Bu hizla giderse ne zaman biter?» Uc tempo; hepsi «tahmin»."""
    bas = _tarih(g["baslangic"])
    fark = abs(g["hedef_deger"] - g["simdi"]["deger"])
    out = []
    for ad, oran in (("plan temposu", 1.0), ("dörtte üç hız", 0.75), ("yarı hız", 0.5)):
        hiz = round(g["tempo"] * oran, 3)
        hafta = int(math.ceil(fark / hiz - 1e-9))
        biter = bas + datetime.timedelta(days=7 * hafta)
        out.append({"ad": ad, "hiz": hiz, "hafta": hafta, "bitis": biter.isoformat(),
                    "metin": "%s (haftada %s kg): %d hafta, %s"
                             % (ad[0].upper() + ad[1:], _yaz(hiz, 2), hafta, _tarih_yaz(biter)),
                    "etiket": "tahmin"})
    return out


# ---------------------------------------------------------------- denetim

def denetle(g):
    """Plan denetcisi. Her madde: ad, ok, kritik, not. Kritik ve gecmeyen
    bir madde varsa plan teklif edilmez."""
    out = []
    kilo = g["simdi"]["deger"]
    if g["yon"] == "azalt":
        sinir, ust = kilo * KAYIP_SINIR, kilo * KAYIP_UST
        if g["tempo"] > sinir + 1e-9:
            out.append({"ad": "tempo", "ok": False, "kritik": True,
                        "not": "Haftada %s kg, kilonun %%1,5 güvenlik sınırını (%s kg) aşıyor."
                               % (_yaz(g["tempo"], 2), _yaz(sinir, 2))})
        elif g["tempo"] > ust + 1e-9:
            out.append({"ad": "tempo", "ok": False, "kritik": False,
                        "not": "Haftada %s kg zorlayıcı: üst tempo %s kg."
                               % (_yaz(g["tempo"], 2), _yaz(ust, 2))})
        else:
            out.append({"ad": "tempo", "ok": True, "kritik": True,
                        "not": "Haftada %s kg güvenli bantta (üst %s kg)."
                               % (_yaz(g["tempo"], 2), _yaz(ust, 2))})
    else:
        ust = kilo * ALIM_UST
        ok_ = g["tempo"] <= ust + 1e-9
        out.append({"ad": "tempo", "ok": ok_, "kritik": False,
                    "not": ("Haftada %s kg alım üst tempo içinde (%s kg)." if ok_ else
                            "Haftada %s kg alım üst tempoyu (%s kg) aşıyor; kazanılanın "
                            "çoğu yağ olabilir.") % (_yaz(g["tempo"], 2), _yaz(ust, 2))})

    if g["hekim_kapisi"]:
        out.append({"ad": "hekim", "ok": g["enerji"] is None, "kritik": True,
                    "not": "Hekim kapısındaki planda enerji hedefi yazılmamış; enerji hekimle "
                           "kurulur." if g["enerji"] is None else
                           "Hekim kapısındaki bir planda enerji hedefi yazılmış; bu kısım "
                           "hekimle kurulmalı."})
    e = g["enerji"]
    if e:
        if e.get("taban") is None:
            out.append({"ad": "enerji", "ok": True, "kritik": False,
                        "not": "Bazal metabolizma gönderilmedi; taban denetlenemedi."})
        else:
            ok_ = e["kcal"] >= e["taban"]
            out.append({"ad": "enerji", "ok": ok_, "kritik": True,
                        "not": ("Günlük %s kcal, bazal metabolizmanın (%s kcal) üstünde."
                                if ok_ else "Günlük %s kcal, bazal metabolizmanın (%s kcal) "
                                "altında; bu plan kurulmaz.")
                               % (_binlik(e["kcal"]), _binlik(e["taban"]))})

    varis = _beklenen(g, g["hafta"])
    fark = abs(varis - g["hedef_deger"])
    out.append({"ad": "tutarlilik", "ok": fark <= max(0.2, g["tempo"]), "kritik": False,
                "not": ("Tempo %d haftada hedefe varıyor." % g["hafta"]) if fark <= max(0.2, g["tempo"])
                else ("Bu tempoyla %d haftanın sonunda %s kg beklenir, hedef %s kg."
                      % (g["hafta"], _yaz(varis), _yaz(g["hedef_deger"])))})
    return out


def kur(ham):
    """Tek giris. {ok, girdi, program, simulasyon, denetim, gecti} ya da hata."""
    g, hatalar = temizle(ham)
    if hatalar:
        return {"ok": False, "hatalar": hatalar}
    d = denetle(g)
    return {"ok": True, "girdi": g, "program": program_kur(g), "simulasyon": simule(g),
            "denetim": d, "gecti": not any(x["kritik"] and not x["ok"] for x in d),
            "etiket": "tahmin", "anahtar": anahtar(g)}
