# -*- coding: utf-8 -*-
"""Merkez kayitlari — katalog 119, 120, 126.

   Uc gorunum, uc soru:

     119 oneri_gecmisi  Merkez ne onerdi, kullanici ne secti? Cevaplanmis
                        her teklif ve gunun karari TEK SATIR: uygulandi,
                        goruldu, istenmedi, sonucu belirsiz, kabul, gecildi.
     120 hafta_ozeti    Hafta tek karttan okunur: her modulden BIR satir,
                        bekleyen oneriler en altta. Sayi weekly.report'tan
                        gelir; burada yeniden hesaplanmaz (iki hesap iki
                        gercek yaratir).
     126 gunluk         Merkez bugun ne OKUDU, ne URETTI — saat saat. Altta
                        «hicbir module yazmadi»: kural 4'un gorunur hali.

   Uc kural:

   1. HICBIRI YAZMAZ. Yalniz okur; model cagrilmaz, cumleler koddandir.
   2. EKSIK VERI SIFIR DEGILDIR. Kaydi gelmeyen modulun satiri «veri yok»
      etiketini tasir; «0 gun» diye bir sayi uydurulmaz.
   3. GERI ALMA MODULDEDIR. Modulde «Geri al» ile donen bir oneriyi HKM
      bilmez (modul yalniz cevabini bildirir); bu, satirin notunda yazar.
"""

import datetime

from core import weekly

MODULLER = ("ays", "spi", "esp")
MODUL_ADI = {"ays": "AYS", "spi": "SPİ", "esp": "ESP", "merkez": "Merkez"}

# Teklif cevaplari (core/intents.py ANSWERS) ve gunun karari (decisions).
DURUM_ADI = {"applied": "uygulandı", "acknowledged": "görüldü", "dismissed": "istenmedi",
             "unknown": "sonucu belirsiz", "accepted": "kabul edildi", "declined": "geçildi"}
ACIK_TEKLIF = ("pending", "delivered")
KING_BEKLEYEN = ("teklif", "ara_onay")      # core/king.py: onay kapisinda bekleyen


def _buyuk(s):
    """Cumlenin ilk harfi buyuk; Turkce «i» → «İ»."""
    s = str(s or "")
    return (s[:1].replace("i", "İ").upper() + s[1:]) if s else s


def _saat(ts):
    s = str(ts or "")
    return s[11:13] if len(s) >= 13 else ""


# ------------------------------------------------------------ 119

def oneri_gecmisi(con, n=40):
    """Cevaplanmis teklifler ve gunun kararlari, en yeni once, tek satir."""
    n = max(1, min(int(n), 200))
    satir = []
    for r in con.execute(
            "SELECT id, module, kind, note, source, state, answered_at FROM intents "
            "WHERE state IN ('applied','acknowledged','dismissed','unknown') "
            "AND answered_at IS NOT NULL ORDER BY answered_at DESC, id DESC LIMIT ?", (n,)):
        satir.append({"zaman": r["answered_at"], "modul": r["module"], "tur": "teklif",
                      "kind": r["kind"], "cumle": r["note"], "durum": r["state"],
                      "durum_adi": DURUM_ADI[r["state"]], "kaynak": r["source"]})
    for r in con.execute(
            "SELECT id, proposal, state, answered_at FROM decisions "
            "WHERE state IN ('accepted','declined') AND answered_at IS NOT NULL "
            "ORDER BY answered_at DESC, id DESC LIMIT ?", (n,)):
        satir.append({"zaman": r["answered_at"], "modul": "merkez", "tur": "karar",
                      "kind": None, "cumle": r["proposal"], "durum": r["state"],
                      "durum_adi": DURUM_ADI[r["state"]], "kaynak": "merkez"})
    satir.sort(key=lambda x: str(x["zaman"]), reverse=True)
    satir = satir[:n]
    for x in satir:
        x["modul_adi"] = MODUL_ADI.get(x["modul"], x["modul"])
    return {"satirlar": satir,
            "not": "Modülde «Geri al» ile dönen öneri modülün kendi geçmişinde "
                   "(Onaylar › Son kararlar) durur; HKM yalnız verilen cevabı bilir."}


# ------------------------------------------------------------ 120

def _bekleyen(con):
    out = {m: 0 for m in MODULLER}
    for r in con.execute("SELECT module, COUNT(*) AS n FROM intents WHERE state IN (?,?) "
                         "GROUP BY module", ACIK_TEKLIF):
        if r["module"] in out:
            out[r["module"]] = r["n"]
    king = con.execute("SELECT COUNT(*) FROM is_emirleri WHERE durum IN (?,?)",
                       KING_BEKLEYEN).fetchone()[0]
    return {"moduller": out, "king": king, "toplam": sum(out.values()) + king}


def pazar_aksami(now):
    """Kart pazar 17:00'den sonra one cikar (katalog: «pazar aksami»)."""
    if isinstance(now, str):
        now = datetime.datetime.fromisoformat(now)
    return now.weekday() == 6 and now.hour >= 17


def hafta_ozeti(con, date, now=None, th=None):
    """Her modulden bir satir: en cok hareket eden olculen deger ya da
    kapsam; kaydi gelmeyen modul «veri yok». Bekleyen oneriler en altta."""
    r = weekly.report(con, date, th=th)
    gorulen = r.get("days_seen") or {}
    satirlar = []
    for m in MODULLER:
        gun = gorulen.get(m, 0)
        karsi = [x for x in r["rows"] if x.get("module") == m and x.get("status") == "compared"]
        if not gun:
            satirlar.append({"modul": m, "modul_adi": MODUL_ADI[m], "gun": None,
                             "cumle": "Bu hafta kayıt gelmedi.", "kesinlik": "veri yok"})
            continue
        if karsi:
            x = karsi[0]            # report() en cok hareket edeni basa dizer
            satirlar.append({"modul": m, "modul_adi": MODUL_ADI[m], "gun": gun,
                             "cumle": "%s: %s" % (_buyuk(x["ad"]), x["note"]), "kesinlik": "hesaplandı"})
        else:
            satirlar.append({"modul": m, "modul_adi": MODUL_ADI[m], "gun": gun,
                             "cumle": "7 günün %d gününde kayıt geldi; önceki haftayla "
                                      "karşılaştırmak için ölçüm az." % gun,
                             "kesinlik": "ölçüldü"})
    return {"from": r["from"], "to": r["to"], "satirlar": satirlar,
            "bekleyen": _bekleyen(con),
            "zamani": pazar_aksami(now or datetime.datetime.now()),
            "not": "Satırlar haftalık raporun aynı hesabından gelir; «veri yok» sıfır değildir."}


# ------------------------------------------------------------ 126

# Merkez'in URETTIGI: her satir kendi tablosundan, olusturma saatiyle.
URETIM = (
    ("oneri", "gün önerisi", "SELECT created_at AS t FROM decisions WHERE substr(created_at,1,10)=?"),
    ("teklif", "modüle teklif (onayını bekler)",
     "SELECT created_at AS t FROM intents WHERE substr(created_at,1,10)=?"),
    ("mesaj", "kanal mesajı", "SELECT created_at AS t FROM outbox WHERE substr(created_at,1,10)=?"),
    ("bildirim", "bildirim", "SELECT created_at AS t FROM bildirimler WHERE substr(created_at,1,10)=?"),
    ("is_emri", "iş emri (King)", "SELECT created_at AS t FROM is_emirleri WHERE substr(created_at,1,10)=?"),
    ("model", "model çağrısı", "SELECT created_at AS t FROM usage WHERE day=?"),
)


def gunluk(con, gun):
    """Saat saat: hangi modulden kac kayit OKUNDU, Merkez ne URETTI."""
    saatler = {}

    def kova(s):
        return saatler.setdefault(s, {"saat": s, "okudu": {}, "uretti": {}})

    okunan = 0
    for r in con.execute("SELECT module, received_at FROM raw_events "
                         "WHERE substr(received_at,1,10)=?", (gun,)):
        s = _saat(r["received_at"])
        if not s:
            continue
        k = kova(s)["okudu"]
        k[r["module"]] = k.get(r["module"], 0) + 1
        okunan += 1
    uretilen = 0
    adlar = {}
    for tur, ad, sql in URETIM:
        adlar[tur] = ad
        for r in con.execute(sql, (gun,)):
            s = _saat(r["t"])
            if not s:
                continue
            k = kova(s)["uretti"]
            k[tur] = k.get(tur, 0) + 1
            uretilen += 1
    liste = []
    for s in sorted(saatler):
        b = saatler[s]
        liste.append({"saat": s,
                      "okudu": [{"modul": m, "modul_adi": MODUL_ADI.get(m, m), "n": b["okudu"][m]}
                                for m in MODULLER if m in b["okudu"]],
                      "uretti": [{"tur": t, "ad": adlar[t], "n": b["uretti"][t]}
                                 for t, _, _ in URETIM if t in b["uretti"]]})
    uygulanan = con.execute("SELECT COUNT(*) FROM intents WHERE state='applied' "
                            "AND substr(answered_at,1,10)=?", (gun,)).fetchone()[0]
    return {"gun": gun, "saatler": liste, "okunan": okunan, "uretilen": uretilen,
            "modullere_yazilan": 0, "uygulanan_teklif": uygulanan,
            "yazmadi": "Merkez hiçbir modüle yazmadı — yazamaz: modüllerin verisi kendi "
                       "cihazlarında durur ve Merkez'den modüle giden tek şey tekliftir. "
                       + ("Bugün %d teklifi modül kendi koduyla, senin onayınla uyguladı."
                          % uygulanan if uygulanan else "Bugün uygulanan teklif yok.")}
