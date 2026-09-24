# -*- coding: utf-8 -*-
"""Gizlilik panosu (fikir 55) — modele NE gitti, NE ZAMAN.

   Her model cagrisi harcama defterine (usage) yazilir ve cagrida modele
   giden veri TURLERI (icerik degil) `usage.veri` sutununda durur: senin
   mesajin, saglik/calisma/gelisim ozeti (kural motorunun cumleleri,
   sayilariyla), kendi ilkelerin, hatirlananlar, BAM istegi (konu metni ve
   web kaynaklari). Pano bunlari sayar ve durustce soyler:

   1. Saglik ozeti gittiyse KAC KEZ ve SON NE ZAMAN gittigi yazilir; hic
      gitmediyse «gitmedi» denir — her cagri yazildigi icin bu bir olcumdur.
   2. Turu yazilmamis eski cagri «kayit yok» olarak ayri sayilir; «gitmedi»
      sayilmaz.
   3. Modullerin KENDI anahtarlariyla yaptigi cagrilar HKM'den gecmez;
      pano bunu soyler, gormedigini «temiz» diye raporlamaz (AGENTS §1.7)."""
import datetime

ADLAR = {
    "mesaj": "senin mesajın",
    "bio": "sağlık özeti (kural motorunun cümleleri, sayılarıyla)",
    "academic": "çalışma özeti (AYS)",
    "intellect": "gelişim özeti (ESP)",
    "capraz": "çapraz bulgular",
    "genel": "genel durum cümleleri",
    "ilkeler": "kendi ilkelerin (Hayat Mottosu)",
    "hafiza": "hatırlananlar",
    "bam_istegi": "BAM isteği (konu metni, web kaynakları; kişisel veri yok)",
    "sinama": "bağlantı sınaması",
    "fis_gorseli": "fiş fotoğrafı (yalnız «fiş» diye gönderdiğin ya da yüklediğin)",
}


def ozet(con, bugun, gun=30):
    son = datetime.date.fromisoformat(bugun)
    bas = (son - datetime.timedelta(days=gun - 1)).isoformat()
    satir = [dict(r) for r in con.execute(
        "SELECT created_at, provider, model, task, veri FROM usage WHERE day>=? AND day<=? "
        "ORDER BY created_at", (bas, bugun))]
    saglayici, tur, kayitsiz = {}, {}, 0
    for r in satir:
        k = (r["provider"], r["model"])
        saglayici[k] = saglayici.get(k, 0) + 1
        if not r["veri"]:
            kayitsiz += 1
            continue
        for v in r["veri"].split(","):
            t = tur.setdefault(v, {"veri": v, "ad": ADLAR.get(v, v), "n": 0, "son": None})
            t["n"] += 1
            t["son"] = r["created_at"]
    bio = tur.get("bio")
    if bio:
        metin = ("Sağlık özeti son %d günde %d çağrıda modele gitti (son: %s). Giden, kural "
                 "motorunun cümleleridir; tahlil dosyası ya da ham kayıt gitmez."
                 % (gun, bio["n"], bio["son"][:16].replace("T", " ")))
    else:
        metin = ("Son %d günde sağlık özeti modele gitmedi%s." % (
            gun, (" (%d eski çağrının türü kayıtlı değil)" % kayitsiz) if kayitsiz else ""))
    return {"pencere": [bas, bugun], "cagri": len(satir),
            "saglayicilar": [{"provider": p, "model": m, "n": n}
                             for (p, m), n in sorted(saglayici.items(), key=lambda x: -x[1])],
            "turler": sorted(tur.values(), key=lambda x: -x["n"]),
            "kayitsiz": kayitsiz,
            "saglik": {"gitti": bool(bio), "n": bio["n"] if bio else 0,
                       "son": bio["son"] if bio else None, "metin": metin},
            "not": "Modüllerin kendi anahtarlarıyla yaptığı çağrılar HKM’den geçmez; "
                   "burada görünmez. Onlar için modülün kendi Ayarlar › Model bölümüne bak."}
