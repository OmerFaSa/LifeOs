"""Modüller arası ilişki sorusu — «az uyuduğum günler daha az soru mu çözüyorum?».

King 5 tur 5 (klon simülasyonu, 233 gün): alışmış kullanıcının asıl sorusu buydu ve
model her seferinde «korelasyon verisi mevcut değil» diyordu. Veri HKM'de vardı:
modüllerin günlük işaretleri (raw_events). Sayıyı KOD üretir (AGENTS §1): iki
ölçü aynı günlerde eşleştirilir, birinci ölçünün ortancasına göre günler ikiye
ayrılır, ikinci ölçünün ortalaması karşılaştırılır. Kayıtsız gün sıfır sayılmaz;
az eşleşmede yargı verilmez; cevap birlikteliktir, neden-sonuç değil.
"""

import datetime
import json
import re

# ad: (modül, metrik, okunur ad, birim, cümlede geçişi)
OLCU = {
    "uyku": ("spi", "sleep_hours", "uyku", "saat", r"uyku|uyudu|uyuduğum|uyuyunca|uykum"),
    "soru": ("ays", "questions", "çözülen soru", "soru", r"\bsoru"),
    "sure": ("ays", "study_minutes", "çalışma süresi", "dk", r"çalışma süre|çalıştığım|kaç saat çalış"),
    "pratik": ("esp", "practice_minutes", "ESP çalışması", "dk", r"\besp\b|gitar|almanca|ingilizce|pratik"),
    # King-Bench (tur 10): «spor yaptığım günler daha çok soru çözüyor muyum». SPİ o gün açıldıysa girilmeyen spor 0 dk.
    "spor": ("spi", "train_minutes", "spor", "dk", r"spor|antrenman|egzersiz|koştuğum|koşu|yürüyüş"),
}
SIFIR_OLUR = {"spor"}
NET = re.compile(r"\bnet", re.I)
ILISKI = re.compile(r"(ilişki|etkisi|etkiliyor|bağlantı|günler(?:de|i)?\b|düşüyor mu|artıyor mu|"
                    r"daha (?:az|çok|fazla|iyi|kötü))", re.I)
EN_AZ = 6


def anla(metin):
    """(x, y) ölçü adları ya da None. x koşuldur («az uyuduğum günler»), y bakılan ölçü."""
    t = str(metin or "").lower()
    if not ILISKI.search(t):
        return None
    yer = []
    for ad, (_, _, _, _, desen) in OLCU.items():
        m = re.search(desen, t)
        if m:
            yer.append((m.start(), ad))
    if NET.search(t):
        yer.append((NET.search(t).start(), "net"))
    yer.sort()
    adlar = [a for _, a in yer]
    if len(adlar) < 2:
        return None
    return adlar[0], adlar[1]


def _seri(con, modul, metrik, bas, son, sifir=False):
    """Gün -> değer; aynı günün son işareti geçerlidir. Ölçülmemiş değer atlanır (sifir: o gün işaret varsa 0)."""
    out = {}
    for tarih, payload in con.execute(
            "SELECT date, payload FROM raw_events WHERE module=? AND date BETWEEN ? AND ? ORDER BY id",
            (modul, bas, son)):
        try:
            m = (json.loads(payload).get("metrics") or {}).get(metrik) or {}
        except ValueError:
            continue
        v = m.get("value") if isinstance(m, dict) else None
        if isinstance(v, (int, float)) and m.get("cert") != "missing":
            out[tarih] = float(v)
        elif sifir and tarih not in out:
            out[tarih] = 0.0
    return out


def _yaz(v, birim):
    s = ("%.1f" % v).rstrip("0").rstrip(".").replace(".", ",")
    return "%s %s" % (s, birim)


def cevap(con, metin, bugun, gun=90):
    """Kural cevabı (metin) ya da None (ilişki sorusu değil)."""
    xy = anla(metin)
    if not xy:
        return None
    x, y = xy
    m = re.search(r"son (\d{1,3}) gün", str(metin or "").lower())
    if m:
        gun = max(7, min(365, int(m.group(1))))
    if "net" in xy:
        return ("Deneme netlerin gün gün değil, son denemelerin ortancası olarak tutuluyor; bu yüzden onu günlük "
                "ölçülerle eşleştirmem doğru olmaz. Aynı soruyu çözülen soru sayısıyla sorarsan hesaplarım.")
    son = str(bugun)[:10]
    bas = (datetime.date.fromisoformat(son) - datetime.timedelta(days=gun - 1)).isoformat()
    ox, oy = OLCU[x], OLCU[y]
    sx, sy = _seri(con, ox[0], ox[1], bas, son, sifir=x in SIFIR_OLUR), _seri(con, oy[0], oy[1], bas, son)
    ortak = sorted(set(sx) & set(sy))
    if len(ortak) < EN_AZ:
        return ("Bunu söylemek için %s ile %s ölçüsünün aynı gün kayıtlı olduğu en az %d gün gerekiyor; son %d günde "
                "%d gün var. Birkaç gün daha ikisini de girersen hesaplarım." % (ox[2], oy[2], EN_AZ, gun, len(ortak)))
    if x in SIFIR_OLUR:
        var = [sy[g] for g in ortak if sx[g] > 0]
        yok = [sy[g] for g in ortak if sx[g] <= 0]
        if not var or not yok:
            return ("Son %d günde %s ile %s birlikte %d günde kayıtlı ama hepsinde %s; karşılaştıracak iki grup yok."
                    % (gun, ox[2], oy[2], len(ortak), "spor var" if not yok else "spor yok"))
        ma, mc = sum(var) / len(var), sum(yok) / len(yok)
        fark = (ma - mc) / mc * 100 if mc else 0
        yon = "aşağı yukarı aynı" if abs(fark) < 10 else ("%%%d daha fazla" % round(fark) if fark > 0 else "%%%d daha az" % round(-fark))
        return ("Son %d günde: %s yaptığın günlerde (%d gün) ortalama %s; yapmadığın günlerde (%d gün) %s. Yani %s "
                "günlerinde %s %s. Bu bir birliktelik, neden-sonuç değil." % (gun, ox[2], len(var), _yaz(ma, oy[3]),
                len(yok), _yaz(mc, oy[3]), ox[2], oy[2], yon))
    xs = sorted(sx[g] for g in ortak)
    orta = xs[len(xs) // 2]
    az = [sy[g] for g in ortak if sx[g] < orta]
    cok = [sy[g] for g in ortak if sx[g] >= orta]
    if not az or not cok:
        return "Son %d günde %s hep aynı düzeyde; karşılaştıracak iki grup çıkmıyor." % (gun, ox[2])
    ma, mc = sum(az) / len(az), sum(cok) / len(cok)
    fark = (ma - mc) / mc * 100 if mc else 0
    yon = "aşağı yukarı aynı" if abs(fark) < 10 else ("%%%d daha az" % round(-fark) if fark < 0 else "%%%d daha fazla" % round(fark))
    return ("Son %d günde %s ile %s birlikte %d günde kayıtlı. %s %s altında olduğu günlerde (%d gün) ortalama %s; "
            "diğer günlerde (%d gün) %s. Yani az %s günlerinde %s %s. Bu bir birliktelik, neden-sonuç değil."
            % (gun, ox[2], oy[2], len(ortak), ox[2].capitalize(), _yaz(orta, ox[3]), len(az), _yaz(ma, oy[3]),
               len(cok), _yaz(mc, oy[3]), ox[2], oy[2], yon))
