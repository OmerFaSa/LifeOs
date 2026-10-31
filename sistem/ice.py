"""ICE AKTARMA — Google verisini hesap baglamadan sisteme getirmek.

Kullanici (2026-10-30): «Chrome/Google baglama calismiyor, ne yapacagimiz
acik degil; bircok seyimizi baglayip sistemin bunu cekmesini ve bu
verilerden ESP, SPI, AYS icin yararlanmasini saglayalim». Secimi: hesap
BAGLANMAZ (AGENTS §1.4); Takeout dosyasi ve takvimin gizli iCal adresi.

  GET  /api/ice                 { takvim:{ var, olaylar, cekildi, hata }, veri:{ adim, youtube } }
  POST /api/ice/takvim          { adres } — gizli iCal adresi (https); bos adres siler
  POST /api/ice/veri            { tur:'adim'|'youtube', ozet } — tarayicinin okudugu ozet

Sozler:
  1. YALNIZ BU BILGISAYAR; yazma X-LifeOS: ice ister.
  2. HESAP YOK. Takvim yalniz kullanicinin yapistirdigi https adresinden,
     yarim saatte bir okunur; adres disari verilmez (GET yalniz «var» der).
  3. DOSYA SUNUCUYA GELMEZ. Takeout dosyasini tarayici okur; buraya yalniz
     ozeti gelir (gun basina adim; gun basina izlenen video ve en cok
     izlenen kanallar), sinirli boyda.
  4. HICBIR MODULE YAZILMAZ. Moduller ozeti GOSTERIR; olcum kayda ancak
     kullanicinin onayiyla gecer (§1.4).
"""

import datetime
import json
import os
import re
import time
import urllib.request

TAZE_SN = 30 * 60
UFUK_GUN = 14


def klasor():
    elle = os.environ.get("LIFEOS_ICE_KLASOR")
    if elle:
        return elle
    if os.name == "nt":
        return os.path.join(os.environ.get("LOCALAPPDATA") or os.path.expanduser("~"), "LifeOS", "ice")
    return os.path.join(os.path.expanduser("~"), ".lifeos", "ice")


def _yol(kok=None):
    return os.path.join(kok or klasor(), "ice.json")


def oku(kok=None):
    try:
        with open(_yol(kok), encoding="utf-8") as f:
            v = json.load(f)
        return v if isinstance(v, dict) else {}
    except (OSError, ValueError):
        return {}


def yaz(v, kok=None):
    k = kok or klasor()
    os.makedirs(k, exist_ok=True)
    gecici = _yol(k) + ".yaziliyor"
    with open(gecici, "w", encoding="utf-8") as f:
        json.dump(v, f, ensure_ascii=False)
    os.replace(gecici, _yol(k))


def _tarih(deger):
    """DTSTART degeri -> (datetime, tum_gun). TZ bilgisi okunmaz, Z UTC'dir."""
    d = deger.strip()
    if re.match(r"^\d{8}$", d):
        return datetime.datetime.strptime(d, "%Y%m%d"), True
    m = re.match(r"^(\d{8}T\d{6})(Z?)$", d)
    if not m:
        return None, False
    t = datetime.datetime.strptime(m.group(1), "%Y%m%dT%H%M%S")
    if m.group(2):
        t = t.replace(tzinfo=datetime.timezone.utc).astimezone().replace(tzinfo=None)
    return t, False


def _haric_mi(r_bas, tum_gun, exdates):
    for ex_t, ex_tum in exdates:
        if ex_tum or tum_gun:
            if r_bas.date() == ex_t.date():
                return True
        else:
            if r_bas == ex_t:
                return True
    return False


def _ay_ekle(dt, n):
    toplam_ay = dt.year * 12 + (dt.month - 1) + n
    y = toplam_ay // 12
    m = (toplam_ay % 12) + 1
    if m in (1, 3, 5, 7, 8, 10, 12):
        max_gun = 31
    elif m in (4, 6, 9, 11):
        max_gun = 30
    else:
        max_gun = 29 if (y % 4 == 0 and (y % 100 != 0 or y % 400 == 0)) else 28
    return dt.replace(year=y, month=m, day=min(dt.day, max_gun))


def _yil_ekle(dt, n):
    y = dt.year + n
    d = dt.day
    if dt.month == 2 and d == 29 and not (y % 4 == 0 and (y % 100 != 0 or y % 400 == 0)):
        d = 28
    return dt.replace(year=y, day=d)


GUN_KODLARI = {"MO": 0, "TU": 1, "WE": 2, "TH": 3, "FR": 4, "SA": 5, "SU": 6}


def _rrule_ac(o, gun_basi, son):
    """Tekrarlayan etkinligi ufuk icindeki orneklerine acar."""
    bas = o["bas"]
    bit = o.get("bit")
    sure = (bit - bas) if bit else None
    tum_gun = bool(o.get("tum_gun"))
    ad = o.get("ad")
    exdates = o.get("exdate", [])
    rrule_str = o.get("rrule")

    if not rrule_str:
        if gun_basi <= bas < son and not _haric_mi(bas, tum_gun, exdates):
            return [{"bas": bas, "bit": bit, "tum_gun": tum_gun, "ad": ad}]
        return []

    kurallar = {}
    for p in rrule_str.split(";"):
        if "=" in p:
            k, v = p.split("=", 1)
            kurallar[k.strip().upper()] = v.strip()

    freq = kurallar.get("FREQ", "").upper()
    if freq not in ("DAILY", "WEEKLY", "MONTHLY", "YEARLY"):
        # Taninmayan RRULE: yalniz ilk ornegi ufuktaysa kalir
        if gun_basi <= bas < son and not _haric_mi(bas, tum_gun, exdates):
            return [{"bas": bas, "bit": bit, "tum_gun": tum_gun, "ad": ad}]
        return []

    try:
        interval = int(kurallar.get("INTERVAL", 1))
        if interval <= 0:
            interval = 1
    except ValueError:
        interval = 1

    count = None
    if "COUNT" in kurallar:
        try:
            count = int(kurallar["COUNT"])
            if count < 0:
                count = 0
        except ValueError:
            count = None

    until_dt = None
    if "UNTIL" in kurallar:
        u_dt, u_tum = _tarih(kurallar["UNTIL"])
        if u_dt:
            until_dt = u_dt.replace(hour=23, minute=59, second=59) if u_tum else u_dt

    if count == 0 or (until_dt and until_dt < gun_basi):
        return []

    cikti = []
    toplam = 0
    dongu_siniri = 50000

    if freq == "DAILY":
        cur = bas
        if count is None and cur < gun_basi:
            fark_gun = (gun_basi - cur).days
            atla = (fark_gun // interval) * interval
            if atla > 0:
                cur += datetime.timedelta(days=atla)

        while dongu_siniri > 0:
            dongu_siniri -= 1
            if until_dt and cur > until_dt:
                break
            if count is not None and toplam >= count:
                break
            if cur >= son:
                break
            if cur >= gun_basi and not _haric_mi(cur, tum_gun, exdates):
                cikti.append({"bas": cur, "bit": (cur + sure) if sure else None, "tum_gun": tum_gun, "ad": ad})
            toplam += 1
            cur += datetime.timedelta(days=interval)

    elif freq == "WEEKLY":
        if "BYDAY" in kurallar:
            byday = []
            for g in kurallar["BYDAY"].upper().split(","):
                kod = g.strip()[-2:]
                if kod in GUN_KODLARI and GUN_KODLARI[kod] not in byday:
                    byday.append(GUN_KODLARI[kod])
            byday.sort()
            if not byday:
                byday = [bas.weekday()]
        else:
            byday = [bas.weekday()]

        w_basi = bas.replace(hour=bas.hour, minute=bas.minute, second=bas.second, microsecond=0)
        w_basi = w_basi - datetime.timedelta(days=bas.weekday())

        if count is None and w_basi + datetime.timedelta(days=7) < gun_basi:
            fark_hafta = (gun_basi - w_basi).days // 7
            atla_hafta = (fark_hafta // interval) * interval
            if atla_hafta > 0:
                w_basi += datetime.timedelta(weeks=atla_hafta)

        bitti = False
        while dongu_siniri > 0 and not bitti:
            dongu_siniri -= 1
            for gun_indeks in byday:
                cur = w_basi + datetime.timedelta(days=gun_indeks)
                if cur < bas:
                    continue
                if until_dt and cur > until_dt:
                    bitti = True
                    break
                if count is not None and toplam >= count:
                    bitti = True
                    break
                if cur >= son:
                    bitti = True
                    break
                if cur >= gun_basi and not _haric_mi(cur, tum_gun, exdates):
                    cikti.append({"bas": cur, "bit": (cur + sure) if sure else None, "tum_gun": tum_gun, "ad": ad})
                toplam += 1
            w_basi += datetime.timedelta(weeks=interval)

    elif freq == "MONTHLY":
        adim = 0
        if count is None:
            fark_ay = (gun_basi.year - bas.year) * 12 + (gun_basi.month - bas.month)
            if fark_ay > interval:
                adim = ((fark_ay - 1) // interval) * interval

        while dongu_siniri > 0:
            dongu_siniri -= 1
            cur = _ay_ekle(bas, adim)
            if until_dt and cur > until_dt:
                break
            if count is not None and toplam >= count:
                break
            if cur >= son:
                break
            if cur >= gun_basi and not _haric_mi(cur, tum_gun, exdates):
                cikti.append({"bas": cur, "bit": (cur + sure) if sure else None, "tum_gun": tum_gun, "ad": ad})
            toplam += 1
            adim += interval

    elif freq == "YEARLY":
        adim = 0
        if count is None:
            fark_yil = gun_basi.year - bas.year
            if fark_yil > interval:
                adim = ((fark_yil - 1) // interval) * interval

        while dongu_siniri > 0:
            dongu_siniri -= 1
            cur = _yil_ekle(bas, adim)
            if until_dt and cur > until_dt:
                break
            if count is not None and toplam >= count:
                break
            if cur >= son:
                break
            if cur >= gun_basi and not _haric_mi(cur, tum_gun, exdates):
                cikti.append({"bas": cur, "bit": (cur + sure) if sure else None, "tum_gun": tum_gun, "ad": ad})
            toplam += 1
            adim += interval

    return cikti


def ics_coz(metin, simdi, ufuk=UFUK_GUN):
    """Onumuzdeki `ufuk` gunun etkinlikleri, saate gore sirali.
    RRULE ve EXDATE ile tekrarlayan etkinlikler cozulur."""
    satirlar = []
    for s in metin.replace("\r\n", "\n").split("\n"):
        if s.startswith((" ", "\t")) and satirlar:
            satirlar[-1] += s[1:]
        else:
            satirlar.append(s)
    olaylar, o = [], None
    for s in satirlar:
        if s == "BEGIN:VEVENT":
            o = {}
        elif s == "END:VEVENT" and o is not None:
            if o.get("bas"):
                olaylar.append(o)
            o = None
        elif o is not None and ":" in s:
            ad, deger = s.split(":", 1)
            anahtar = ad.split(";", 1)[0]
            if anahtar == "DTSTART":
                o["bas"], o["tum_gun"] = _tarih(deger)
            elif anahtar == "DTEND":
                o["bit"], _ = _tarih(deger)
            elif anahtar == "SUMMARY":
                o["ad"] = deger.replace("\\,", ",").replace("\\;", ";").replace("\\n", " ").strip()[:120]
            elif anahtar == "RRULE":
                o["rrule"] = deger.strip()
            elif anahtar == "EXDATE":
                for p in deger.split(","):
                    p = p.strip()
                    if p:
                        t, tum = _tarih(p)
                        if t:
                            o.setdefault("exdate", []).append((t, tum))
    son = simdi + datetime.timedelta(days=ufuk)
    gun_basi = simdi.replace(hour=0, minute=0, second=0, microsecond=0)
    l = []
    for o in olaylar:
        l.extend(_rrule_ac(o, gun_basi, son))
    l.sort(key=lambda x: x["bas"])
    return [{"bas": x["bas"].strftime("%Y-%m-%dT%H:%M"), "bit": x["bit"].strftime("%Y-%m-%dT%H:%M") if x.get("bit") else None,
             "tum_gun": bool(x.get("tum_gun")), "ad": x.get("ad") or "Etkinlik"} for x in l[:60]]


def takvim_tazele(v, simdi=None, getir=None, kok=None):
    """Adres varsa ve onbellek eskiyse ceker. Ag hatasi eskiyi silmez."""
    t = v.get("takvim") or {}
    if not t.get("adres"):
        return v
    if time.time() - (t.get("cekildi") or 0) < TAZE_SN and t.get("olaylar") is not None:
        return v
    getir = getir or (lambda u: urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "LifeOS"}), timeout=10).read(2 * 1024 * 1024).decode("utf-8", "replace"))
    try:
        t["olaylar"] = ics_coz(getir(t["adres"]), simdi or datetime.datetime.now())
        t["hata"] = None
    except Exception as e:                         # ag yok, adres bozuk: eski olaylar kalir
        t["hata"] = "Takvim okunamadı: %s" % str(e)[:120]
    t["cekildi"] = time.time()
    v["takvim"] = t
    yaz(v, kok)
    return v


def disari(v):
    t = v.get("takvim") or {}
    return {"takvim": {"var": bool(t.get("adres")), "olaylar": t.get("olaylar") or [], "cekildi": t.get("cekildi"), "hata": t.get("hata")},
            "veri": v.get("veri") or {}}


def ozet_dogrula(tur, ozet):
    """Ozet sinirli ve tipli olmali (soz 3)."""
    if tur == "adim":
        if not isinstance(ozet, dict):
            raise ValueError((400, "Adım özeti okunamadı."))
        gunler = {k: int(n) for k, n in list(ozet.items())[-400:]
                  if re.match(r"^\d{4}-\d{2}-\d{2}$", str(k)) and isinstance(n, (int, float)) and 0 <= n <= 200000}
        return {"gunler": gunler}
    if tur == "youtube":
        if not isinstance(ozet, dict):
            raise ValueError((400, "YouTube özeti okunamadı."))
        gunler = {k: int(n) for k, n in list((ozet.get("gunler") or {}).items())[-400:]
                  if re.match(r"^\d{4}-\d{2}-\d{2}$", str(k)) and isinstance(n, (int, float)) and 0 <= n <= 5000}
        kanallar = [[str(a)[:80], int(n)] for a, n in (ozet.get("kanallar") or [])[:15] if isinstance(n, (int, float))]
        return {"gunler": gunler, "kanallar": kanallar}
    raise ValueError((400, "Bilinmeyen veri türü."))


def _json(h, kod, veri):
    govde = json.dumps(veri, ensure_ascii=False).encode("utf-8")
    h.send_response(kod)
    h.send_header("Content-Type", "application/json; charset=utf-8")
    h.send_header("Content-Length", str(len(govde)))
    h.send_header("Cache-Control", "no-store")
    h.end_headers()
    h.wfile.write(govde)


def isle(h, kok=None, getir=None):
    if h.client_address[0] not in ("127.0.0.1", "::1"):
        return _json(h, 403, {"hata": "İçe aktarılan veri yalnız bu bilgisayardan."})
    yol = h.path.split("?", 1)[0].rstrip("/")
    if h.command == "GET" and yol == "/api/ice":
        return _json(h, 200, disari(takvim_tazele(oku(kok), getir=getir, kok=kok)))
    if h.command != "POST":
        return _json(h, 405, {"hata": "Desteklenmiyor."})
    if h.headers.get("X-LifeOS") != "ice":
        return _json(h, 403, {"hata": "Yalnız LifeOS'un kendi sayfasından."})
    try:
        boy = min(int(h.headers.get("Content-Length") or 0), 512 * 1024)
        gelen = json.loads(h.rfile.read(boy).decode("utf-8") or "{}")
    except (ValueError, UnicodeDecodeError):
        return _json(h, 400, {"hata": "Okunamadı."})
    v = oku(kok)
    if yol == "/api/ice/takvim":
        adres = str(gelen.get("adres") or "").strip()
        if adres and not re.match(r"^https://[^\s]+$", adres):
            return _json(h, 400, {"hata": "Adres https:// ile başlamalı (Google Takvim › Ayarlar › Gizli adres, iCal biçiminde)."})
        v["takvim"] = {"adres": adres} if adres else {}
        yaz(v, kok)
        return _json(h, 200, disari(takvim_tazele(v, getir=getir, kok=kok)))
    if yol == "/api/ice/veri":
        try:
            ozet = ozet_dogrula(gelen.get("tur"), gelen.get("ozet"))
        except ValueError as e:
            kod, cumle = e.args[0]
            return _json(h, kod, {"hata": cumle})
        v.setdefault("veri", {})[gelen["tur"]] = dict(ozet, aktarildi=int(time.time()))
        yaz(v, kok)
        return _json(h, 200, disari(v))
    return _json(h, 404, {"hata": "Böyle bir adres yok."})
