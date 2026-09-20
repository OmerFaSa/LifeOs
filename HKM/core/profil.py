# -*- coding: utf-8 -*-
"""Profil — dort alanin tek sayfada toplandigi yer.

   NE YAPAR

   Uc arayuz birbirini GORMEZ (AGENTS.md §1.4) ve gormemeli. Bu yuzden
   «butun alanlarda 5000 saat» gibi bir rozet hicbir modulun kendi
   basina verebilecegi bir sey degildir: uclu toplami yalniz merkez
   gorur. Bu dosya o toplami yapar ve HICBIR SEY DAHA yapmaz.

   NE YAPMAZ — ve neden

   1. HKM'NIN KENDI XP'SI YOKTUR. Burada bir siralama, bir ortalama,
      bir «genel seviye» hesabi yoktur. Uc sistemin kademesi YAN YANA
      gosterilir, toplanmaz: «AYS 3.2 + SPI 2.1 = 5.3» diye bir sey
      yoktur ve olmasi saglikli da degildir.

   2. ROZET HICBIR KARARI VERMEZ (AGENTS.md §1.6). Ne plan, ne rapor,
      ne oneri buraya bakar. Profil bir GOZLEM sayfasidir.

   3. EKSIK VERI SIFIR DEGILDIR. Bir modul rozet sayaci gondermediyse
      o modul toplama 0 ile GIRMEZ, hic girmez — ve kac modulun
      konustugu sayfada YAZILIR. «Iki modulden gelen 300 saat»i «uc
      modulun toplami» diye sunmak, olculmemis bir seyi olculmus gibi
      gostermektir.

   ONUR ROZETI — Sistem Ustasi

   Tek rozettir ve tek yerde durur. Sarti dordu birden ister; biri bile
   eksikse verilmez. Esikler bilerek yuksek: bu rozet «bir sey yaptin»
   demez, «hepsini uzun sure surdurdun» der.
"""

from . import certainty as C

MODULLER = ("ays", "spi", "esp")

MODUL_ADI = {"ays": "AYS", "spi": "SPİ", "esp": "ESP"}

# SEVIYE:kart-bas
def rutbe_kart_adi(kademe, adim):
    """Bir basamagin RUTBE KARTI dosya adi — uzantisiz.

    JS tarafindaki kuralin AYNISI (`kademeler.js`, `LIFEOS.MEDYA_ADI`):
    ad ekranda yazan ETIKETTEN turer, kucuk harf, nokta yerine tire.

        kademe 3, adim 2   ->  rutbe-3-2      (etiket «3.2»)
        kademe 6, adim 3   ->  rutbe-k300     (etiket «K300»)

    NEDEN BURADA BIR KOPYA VAR. Merkez profili uc sistemin rutbe
    kartlarini gosteriyor ve kart adini bilmek zorunda. Kurali elle
    ikinci kez yazmak, iki kopyanin bir gun ayrismasi demekti; bu
    dosya tek kaynaktir ve `tools/seviye.py --yay` ile merkeze
    yerlestirilir, `--denetle` ayrismayi yakalar ve CI'da kosar.

    Iki tarafta da AYNI ornekleri sinayan birer test var (JS:
    xp.test.js, Python: tests/test_profil.py). Kural bir gun degisirse
    once onlar kirilir.

    KUTSAL'DA NOKTA YOKTUR. Altinci kademenin basamaklari K100, K200 …
    diye adlanir; adim numarasi yuze carpilir. Kademe ya da adim
    beklenmedikse None doner — uydurma bir ad uretmek, olmayan bir
    dosyayi istemektir.
    """
    try:
        k, a = int(kademe), int(adim)
    except (TypeError, ValueError):
        return None
    if k < 1 or a < 1:
        return None
    if k == 6:
        return "rutbe-k%d" % (a * 100)
    return "rutbe-%d-%d" % (k, a)
# SEVIYE:kart-bit

# Toplanabilir sayaclar. `badge_focus_hours` ve `badge_streak_months`
# TOPLANMAZ: biri bir gunun en iyisi, oteki kesintisiz bir seri —
# ikisini toplamak «uc sistemde ayri ayri 3'er saat odaklandim, demek
# ki 9 saat odaklandim» demekti.
TOPLANIR = ("badge_days", "badge_hours", "badge_tasks", "badge_count")
EN_YUKSEK = ("badge_focus_hours", "badge_streak_months")

# Merkezin KENDI rozetleri. Modul rozetiyle ayni aileleri kullanir ama
# esikleri dorde katlanmis degildir — uc sistemin toplami zaten daha
# hizli birikir, esigi de ona gore yuksek tutuldu.
AILELER = [
    {"id": "saat", "ad": "Saat", "birim": "saat", "alan": "badge_hours",
     "esikler": [100, 250, 500, 1000, 2500, 5000]},
    {"id": "gorev", "ad": "Görev", "birim": "görev", "alan": "badge_tasks",
     "esikler": [100, 250, 500, 1000, 2500, 5000]},
    {"id": "gun", "ad": "Gün", "birim": "gün", "alan": "badge_days",
     "esikler": [25, 50, 100, 250, 500, 1000]},
    {"id": "istikrar", "ad": "İstikrar", "birim": "ay",
     "alan": "badge_streak_months", "esikler": [1, 3, 6, 9, 12, 24]},
    {"id": "odak", "ad": "Odak", "birim": "saat",
     "alan": "badge_focus_hours", "esikler": list(range(1, 11))},
]

# Sistem Ustasi'nin sarti. Dordu birden — biri eksikse rozet yok.
ONUR_SARTI = {
    "badge_hours": 1000,
    "badge_tasks": 2500,
    "badge_days": 365,
    "badge_streak_months": 12,
}


def _sayi(metrikler, anahtar):
    """Etiketli metrikten sayiyi cikarir; yoksa None (SIFIR DEGIL)."""
    d = C.value_of((metrikler or {}).get(anahtar))
    if d is None:
        return None
    try:
        n = int(d)
    except (TypeError, ValueError):
        return None
    return n if n >= 0 else None


def metrik_sozlugu(con, date):
    """Modul -> METRIK sozlugu. Ambardaki govde `{"metrics": {...}}`
    seklindedir; acma isi TEK yerde yapilir (`manager.daily_message` de
    aynisini yapar) — iki yerde acmak, birinde unutulmasi demekti."""
    from . import db
    return {m: (b.get("metrics") or {})
            for m, b in db.latest_payloads(con, date).items()}


def toplamlar(payloads):
    """Dort modulun rozet sayaclarini birlestirir.

    Doner: {"badge_hours": 420, ..., "konusan": ["ays","esp"],
            "eksik": ["spi"]}
    Bir modul sayac gondermediyse toplama GIRMEZ ve `eksik`te yazar."""
    out = {a: 0 for a in TOPLANIR}
    for a in EN_YUKSEK:
        out[a] = 0
    konusan, eksik = [], []

    for mod in MODULLER:
        metrikler = payloads.get(mod) or {}
        degerler = {a: _sayi(metrikler, a) for a in TOPLANIR + EN_YUKSEK}
        if all(v is None for v in degerler.values()):
            eksik.append(mod)
            continue
        konusan.append(mod)
        for a in TOPLANIR:
            if degerler[a] is not None:
                out[a] += degerler[a]
        for a in EN_YUKSEK:
            if degerler[a] is not None:
                out[a] = max(out[a], degerler[a])

    out["konusan"] = konusan
    out["eksik"] = eksik
    return out


def rozetler(toplam):
    """Merkezin rozet listesi — kazanilan ve kazanilmayan, hepsi."""
    out = []
    for aile in AILELER:
        deger = toplam.get(aile["alan"]) or 0
        for esik in aile["esikler"]:
            out.append({
                "kod": "%s-%s" % (aile["id"], esik),
                "aile": aile["id"], "aileAd": aile["ad"],
                "esik": esik, "birim": aile["birim"],
                "gorsel": "basarim-%s-%s" % (aile["id"], esik),
                "kazanildi": deger >= esik,
                "deger": deger,
            })
    return out


def onur(toplam):
    """Sistem Ustasi — dort sart birden.

    Doner: {"kazanildi": bool, "eksikler": [{"ad","olan","gereken"}]}
    Eksikler HER ZAMAN doner, kazanilmis olsa bile: «neyle kazanildi»
    sorusunun cevabi da bir bilgidir."""
    eksikler = []
    for anahtar, gereken in ONUR_SARTI.items():
        olan = toplam.get(anahtar) or 0
        eksikler.append({
            "anahtar": anahtar, "olan": olan, "gereken": gereken,
            "tamam": olan >= gereken,
        })
    return {
        "kazanildi": all(e["tamam"] for e in eksikler),
        "sartlar": eksikler,
    }


def kademeler(payloads):
    """Uc sistemin kademesi — YAN YANA, toplanmadan.

    `manager._level_line` ile ayni veriyi okur ama cumle kurmaz: orasi
    brifing satiri yazar, burasi sayfa besler. Ikisi de ayni ambardan
    okudugu icin ayrisamazlar."""
    out = []
    for mod in MODULLER:
        metrikler = payloads.get(mod) or {}
        kademe = C.value_of(metrikler.get("level_tier"))
        adim = C.value_of(metrikler.get("level_sub"))
        if kademe is None or adim is None:
            continue
        out.append({
            "module": mod, "ad": MODUL_ADI.get(mod, mod.upper()),
            "tier": int(kademe), "sub": int(adim),
            "xp_total": C.value_of(metrikler.get("xp_total")),
            # Rutbe kartinin dosya adi. Kural tek kaynaktan gelir
            # (`brand/seviye/ortak_kart.py`), burada elle yazilmaz.
            "kart": rutbe_kart_adi(kademe, adim),
        })
    return out


def anlik(con, date):
    """Profilin tamami — API'nin dondurdugu govde."""
    payloads = metrik_sozlugu(con, date)
    toplam = toplamlar(payloads)
    return {
        "date": date,
        "kademeler": kademeler(payloads),
        "toplamlar": {a: toplam[a] for a in TOPLANIR + EN_YUKSEK},
        "konusan": toplam["konusan"],
        "eksik": toplam["eksik"],
        "rozetler": rozetler(toplam),
        "onur": onur(toplam),
    }
