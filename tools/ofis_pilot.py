#!/usr/bin/env python3
"""OFIS PILOTU — ofisi Claude Code beklemeden yuruten arka plan sureci.

Kullanici (2026-10-31): «ofisi bir adim oteye tasi; otomatik pilotu Claude Code
denetler; kaliteden odun yok». Pilot kuyruktaki «bekliyor» gorevleri en cok
PARALEL tane baslatir, Denetci bulgusunu Uygulayici'ya geri gonderir (en cok
MAX_TUR tur), Testci'yi (tools/ofis_test.py) kosturur, kirmiziyi bir kez geri
gonderir ve isi «Claude'un incelemesine hazir» diye isaretler.

ASLA birlestirmez, main'e push etmez, gorev yazmaz: yalniz tools/ajan.py'nin
baslat/gozden/mesaj komutlarini ve Testci'yi cagirir. Koruma kancasi kurulu
degilse ya da Antigravity kapaliysa durur. Gunde en cok GUNLUK is baslatir.
Her karar LifeOs-ajan/pilot.jsonl'e, her bitmis isin olcumu olcum.jsonl'e yazilir.

  python tools/ajan.py pilot baslat     arka planda baslatir (pythonw, ayrik)
  python tools/ajan.py pilot dur        durdurur (bayrak dosyasi; en gec bir tur sonra)
  python tools/ajan.py pilot durum      canli mi, isler, son kararlar
  python tools/ofis_pilot.py calis      on planda calistirir (ayiklama)
"""
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import ajan as A  # noqa: E402
import ofis_test as T  # noqa: E402

PARALEL = 3
GUNLUK = 8                       # bir gunde pilotun baslatabilecegi is
MAX_TUR = 2                      # Denetci bulgusunu geri gonderme
MAX_TEST_TUR = 1                 # Testci kirmizisini geri gonderme
MAX_TEST_ISTEK = 3               # ayni commit icin Testci cagrisi (kosulamadi dahil)
TUR_SN = 30
ALT_EFOR = {"yuksek": "orta", "orta": "dusuk"}
KOTA = re.compile(r"RESOURCE_EXHAUSTED|quota|rate.?limit|\b429\b|kota", re.I)


def yol(ad):
    return A.AJAN_KLASOR / ad


# ---------- kayit dosyalari ----------

def jsonl_ekle(ad, kayit):
    A.AJAN_KLASOR.mkdir(parents=True, exist_ok=True)
    with open(yol(ad), "a", encoding="utf-8") as f:
        f.write(json.dumps(dict(kayit, t=kayit.get("t") or int(time.time())), ensure_ascii=False) + "\n")


def jsonl_oku(ad, son=None):
    try:
        satir = yol(ad).read_text(encoding="utf-8").splitlines()
    except OSError:
        return []
    out = []
    for s in satir[-son:] if son else satir:
        try:
            out.append(json.loads(s))
        except ValueError:
            pass
    return out


def durum_oku():
    try:
        return json.loads(yol("pilot.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def durum_yaz(p):
    A.AJAN_KLASOR.mkdir(parents=True, exist_ok=True)
    g = yol("pilot.json.tmp")
    g.write_text(json.dumps(p, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(g, yol("pilot.json"))


def canli_mi(simdi=None):
    """Nabiz dosyasi uc tur icinde yazildiysa pilot calisiyor."""
    try:
        n = json.loads(yol("pilot.nabiz").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    return n if (simdi or time.time()) - n.get("t", 0) < 3 * TUR_SN + 10 else None


# ---------- is istekleri ----------

def istekler():
    p = yol("istekler.jsonl")
    try:
        with open(p, "r", encoding="utf-8") as f:
            satirlar = f.readlines()
    except OSError:
        return []
    out = []
    for sira, s in enumerate(satirlar, 1):
        s_temiz = s.strip()
        if not s_temiz:
            continue
        try:
            d = json.loads(s_temiz)
        except (ValueError, TypeError):
            continue
        if isinstance(d, dict):
            out.append(dict(d, sira=sira))
    return out


def istek_isle(sira, gorev):
    try:
        sira_no = int(sira)
    except (ValueError, TypeError):
        raise SystemExit("Geçersiz istek sırası: %s." % sira)
    if sira_no < 1:
        raise SystemExit("Geçersiz istek sırası: %d." % sira_no)
    gorev_str = str(gorev) if isinstance(gorev, (str, int)) else ""
    if not re.fullmatch(r"\d{3}", gorev_str):
        raise SystemExit("Geçersiz görev numarası (üç basamaklı olmalı): %s." % gorev)

    p = yol("istekler.jsonl")
    try:
        with open(p, "r", encoding="utf-8", newline="") as f:
            satirlar = f.readlines()
    except OSError:
        raise SystemExit("İstek dosyası bulunamadı: %s." % p)

    if sira_no > len(satirlar):
        raise SystemExit("Geçersiz istek sırası (%d satır var): %d." % (len(satirlar), sira_no))

    hedef = satirlar[sira_no - 1]
    s_temiz = hedef.strip()
    if not s_temiz:
        raise SystemExit("Bu sıradaki istek boş, işlenemez: %d." % sira_no)
    try:
        d = json.loads(s_temiz)
        if not isinstance(d, dict):
            raise ValueError
    except (ValueError, TypeError):
        raise SystemExit("Bu sıradaki istek bozuk, işlenemez: %d." % sira_no)

    d["durum"] = "planlandı"
    d["gorev"] = gorev_str
    son_ek = "\r\n" if hedef.endswith("\r\n") else "\n"
    satirlar[sira_no - 1] = json.dumps(d, ensure_ascii=False) + son_ek

    A.AJAN_KLASOR.mkdir(parents=True, exist_ok=True)
    gecici = yol("istekler.jsonl.tmp")
    with open(gecici, "w", encoding="utf-8", newline="") as f:
        f.writelines(satirlar)
    os.replace(gecici, p)
    return d


# ---------- saf kararlar (testli) ----------

def kota_hatasi(canli):
    """Dokumde kota/RESOURCE_EXHAUSTED hatasi var mi (yalniz hata adimlarinda)."""
    return any(KOTA.search(a.get("metin") or "") for a in (canli or {}).get("son_adimlar") or []
               if a.get("tur") == "hata" or a.get("durum") == "ERROR")


def bugun_baslatilan(kayitlar, simdi=None):
    gun = time.strftime("%Y-%m-%d", time.localtime(simdi or time.time()))
    return sum(1 for k in kayitlar if k.get("eylem") == "baslat"
               and time.strftime("%Y-%m-%d", time.localtime(k.get("t", 0))) == gun)


def baslatilacaklar(bekleyen, p, ajanlar, gunluk_sayi):
    """Kuyruktan baslatilacak gorev numaralari: hic acilmamis, paralel ve gunluk sinir icinde."""
    aktif = sum(1 for s in p.values() if not s.get("hazir"))
    yer = min(PARALEL - aktif, GUNLUK - gunluk_sayi)
    return [no for no in bekleyen if no not in p and no not in ajanlar][:max(0, yer)]


def duzelt_metni(tur, cevap):
    return ("Denetçi bulgusu (tur %d/%d):\n%s\n\nHer bulguyu düzelt; düzeltilen her hata için önce onu yakalayan testi yaz. "
            "Görevdeki testleri koş, commit et ve dalını push et. Bir bulguya katılmıyorsan nedenini görev dosyasının "
            "«Sonuç» bölümüne yaz, yine commit ve push et." % (tur, MAX_TUR, (cevap or "").strip()[:3000]))


def test_duzelt_metni(test, portlar=None):
    kirmizi = [a for a in test.get("adimlar") or [] if a.get("sonuc") == "kırmızı"]
    satir = ["Testçi kırmızı (main + dalın birleşmesi, commit %s):" % test.get("commit")]
    for a in kirmizi:
        satir.append("- %s %s · çıkış %s · ham çıktı: %s" % (a["modul"], a["ad"], a.get("kod"), a.get("log")))
        satir += ["    " + s for s in (a.get("son") or [])[-15:]]
    p = portlar or {}
    satir.append("Ham çıktıyı oku, kökü düzelt (önce hatayı yakalayan test). Aynı denetimi KENDİ portunla koş "
                 "(ör. cd AYS && node tools/smoke.js %s), commit et ve dalını push et." % p.get("AYS", "<port>"))
    return "\n".join(satir)


def adim(x, dn, s, o):
    """Bir pilot isinin sonraki adimi: (eylem, neden). Saf islev.
    x: ajan.hepsi() kaydi; dn: Denetci kaydi (ya da None); s: pilotun bu isle ilgili durumu;
    o: {commit, teslim, gorev_durum, test, denetci_mesgul, test_mesgul, simdi}."""
    c = x.get("canli") or {}
    simdi = o["simdi"]
    if x.get("asama") == "kapandı":
        return "birak", "iş kapatıldı"
    if c.get("hal") == "hata" and kota_hatasi(c):
        if not s.get("dusuruldu") and ALT_EFOR.get(x.get("efor")):
            return "kota", "kota hatası: %s ile yeniden" % A.EFOR[ALT_EFOR[x["efor"]]]
        return "birak", "kota hatası (daha alt model yok ya da bir kez denendi)"
    if x.get("asama") == "sorun":
        return "birak", "Uygulayıcı: " + (c.get("hal") or "sorun")
    if x.get("asama") != "inceleme":
        return "bekle", "Uygulayıcı çalışıyor"
    son = c.get("son_degisim") or 0
    if s.get("mesaj_t"):
        if son < s["mesaj_t"]:
            return ("birak", "düzeltme mesajına 15 dakikada tepki yok") if simdi - s["mesaj_t"] > 900 \
                else ("bekle", "düzeltme bekleniyor")
        if o["commit"] == s.get("mesaj_commit"):
            return "hazir", "düzeltme commit'i gelmedi"
    if not o["teslim"]:
        if o.get("gorev_durum") == "takıldı":
            return "hazir", "Uygulayıcı takıldı"
        return ("birak", "teslim edilmedi (bitti, commit ya da push yok)") if simdi - son > 300 \
            else ("bekle", "teslim bekleniyor")
    if not dn or dn.get("commit") != o["commit"]:
        if x.get("denetim") == "istendi" and simdi - son < 180 or o["denetci_mesgul"]:
            return "bekle", "Denetçi sırası"
        return "gozden", "Denetçi istendi (commit %s)" % o["commit"]
    if dn.get("asama") == "çalışıyor":
        return "bekle", "Denetçi inceliyor"
    if dn.get("asama") == "sorun":
        return "birak", "Denetçi hata verdi"
    karar = (dn.get("canli") or {}).get("karar")
    if karar and karar[0] == "bulgu" and s.get("tur", 0) < MAX_TUR:
        return "duzelt", "Denetçi: %d bulgu; tur %d" % (karar[1], s.get("tur", 0) + 1)
    t = o.get("test")
    istek = (s.get("test_istek") or {}).get(o["commit"], 0)
    if not t or t.get("commit") != o["commit"] or t.get("durum") == "koşuyor":
        if o["test_mesgul"] or (istek and simdi - s.get("test_t", 0) < 300):
            return "bekle", "Testçi koşuyor"
        if istek >= MAX_TEST_ISTEK:
            return "birak", "Testçi %d kez sonuç vermedi" % istek
        return "test", "Testçi istendi (commit %s)" % o["commit"]
    kirmizi = [a for a in t.get("adimlar") or [] if a.get("sonuc") == "kırmızı"]
    if t.get("durum") == "çakışma":
        return "hazir", "main ile çakışıyor"
    if kirmizi and s.get("test_tur", 0) < MAX_TEST_TUR:
        return "test_duzelt", "Testçi: %d kırmızı" % len(kirmizi)
    kosulamadi = [a for a in t.get("adimlar") or [] if a.get("sonuc") == "koşulamadı"]
    if kosulamadi and not kirmizi and istek < MAX_TEST_ISTEK:
        if o["test_mesgul"] or simdi - s.get("test_t", 0) < 300:
            return "bekle", "Testçi yeniden koşacak (port doluydu)"
        return "test", "%d denetim koşulamadı; yeniden" % len(kosulamadi)
    return "hazir", sonuc_cumle(karar, s, t)


def sonuc_cumle(karar, s, t):
    ad = ("temiz" if karar and karar[0] == "temiz" else "%d bulgu" % karar[1] if karar else "kararsız")
    a = t.get("adimlar") or []
    say = lambda r: sum(1 for x in a if x.get("sonuc") == r)
    return "Denetçi %s (%d tur) · Testçi %d yeşil, %d kırmızı, %d koşulamadı" % (
        ad, s.get("tur", 0), say("yeşil"), say("kırmızı"), say("koşulamadı"))


def olcum_ozet(kayitlar):
    """Model basina: is sayisi, ilk turda temiz orani, ortalama sure ve token (yalniz oneri)."""
    out = {}
    for k in kayitlar:
        m = out.setdefault(k.get("model") or "?", {"is": 0, "ilk_temiz": 0, "sure": 0, "token": 0, "tur": 0})
        m["is"] += 1
        m["ilk_temiz"] += k.get("ilk_karar") == "temiz"
        m["sure"] += k.get("sure") or 0
        m["token"] += (k.get("token") or {}).get("giris", 0) + (k.get("token") or {}).get("cikis", 0)
        m["tur"] += k.get("tur") or 0
    for m in out.values():
        m["oran"] = m["ilk_temiz"] / m["is"]
        m["ort_sure"], m["ort_token"], m["ort_tur"] = m["sure"] // m["is"], m["token"] // m["is"], m["tur"] / m["is"]
    return out


# ---------- dunya ile temas ----------

def bekleyen_gorevler():
    """main'e commit edilmis, Durum: bekliyor olan gorevler (ajan klasoru main'den acilir)."""
    out = []
    for ad in (A.git("ls-tree", "--name-only", "main", A.GOREVLER + "/", kontrol=False) or "").splitlines():
        m = re.search(r"/(\d{3})-[^/]+\.md$", ad)
        if not m:
            continue
        d = re.search(r"\*\*Durum:\*\*\s*([^\s<]+)", A.git("show", "main:" + ad, kontrol=False) or "")
        if d and d.group(1).lower() == "bekliyor":
            out.append(m.group(1))
    return sorted(out)


def gorev_efor(no):
    return A.gorev_bilgi(A.gorev_dosyasi(no).read_text(encoding="utf-8"))["efor"] or "orta"


def gorev_durumu(a):
    try:
        d = re.search(r"\*\*Durum:\*\*\s*([^\s<]+)",
                      (Path(a["worktree"]) / A.GOREVLER / a.get("gorev", "")).read_text(encoding="utf-8"))
    except OSError:
        return None
    return d.group(1).lower() if d else None




def ayrik(argv):
    """Ana surecten bagimsiz, pencere acmadan calisan surec."""
    bayrak = 0
    for n in ("DETACHED_PROCESS", "CREATE_NEW_PROCESS_GROUP", "CREATE_NO_WINDOW"):
        bayrak |= getattr(subprocess, n, 0)
    return subprocess.Popen(argv, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                            close_fds=True, creationflags=bayrak, cwd=str(A.KOK),
                            env=dict(os.environ, PYTHONUTF8="1", PYTHONIOENCODING="utf-8"))


def python_exe():
    p = Path(sys.executable)
    return str(p.with_name("python.exe")) if p.name.lower() == "pythonw.exe" else str(p)


def kaydet(no, eylem, neden, **ek):
    jsonl_ekle("pilot.jsonl", dict(no=no, eylem=eylem, neden=neden, **ek))


def olcum_yaz(no, x, s, sonuc):
    c = x.get("canli") or {}
    jsonl_ekle("olcum.jsonl", {"no": no, "efor": x.get("efor"), "model": x.get("model"),
                               "ilk_karar": s.get("ilk_karar"), "tur": s.get("tur", 0), "test_tur": s.get("test_tur", 0),
                               "dusuruldu": s.get("dusuruldu"), "token": c.get("token") or {},
                               "sure": int(time.time() - (s.get("baslangic") or x.get("baslangic") or time.time())),
                               "sonuc": sonuc})


def uygula(no, eylem, neden, x, dn, s, o):
    """Kararin yan etkisi. ajan.py hata verirse (SystemExit) is birakilir; pilot durmaz."""
    if eylem == "gozden":
        A.gozden(no)
    elif eylem == "duzelt":
        s["tur"] = s.get("tur", 0) + 1
        A.mesaj(no, duzelt_metni(s["tur"], (dn.get("canli") or {}).get("cevap")))
        s.update(mesaj_t=time.time(), mesaj_commit=o["commit"])
    elif eylem == "test":
        s.setdefault("test_istek", {})[o["commit"]] = (s.get("test_istek") or {}).get(o["commit"], 0) + 1
        s["test_t"] = time.time()
        ayrik([python_exe(), str(A.KOK / "tools" / "ofis_test.py"), no])
    elif eylem == "test_duzelt":
        s["test_tur"] = s.get("test_tur", 0) + 1
        A.mesaj(no, test_duzelt_metni(o["test"], x.get("portlar")))
        s.update(mesaj_t=time.time(), mesaj_commit=o["commit"])
    elif eylem == "kota":
        yeni = ALT_EFOR[x["efor"]]
        d = A.oku_durum()
        d[no].update(acik=False, kapanis=int(time.time()))      # klasor kalir: yarim is yeni modelde surer
        A.yaz_durum(d)
        s["dusuruldu"] = "%s→%s" % (x.get("model"), A.EFOR[yeni])
        A.baslat(no, yeni, "Önceki model (%s) kota hatası verdi; klasördeki yarım işi incele ve görevi bitir." % x.get("model"),
                 yeni=True)
        s.pop("mesaj_t", None)
    elif eylem in ("hazir", "birak"):
        s.update(hazir=True, sonuc=("bırakıldı: " if eylem == "birak" else "") + neden, hazir_t=int(time.time()))
        olcum_yaz(no, x, s, s["sonuc"])


def tur(p, simdi=None):
    """Bir pilot turu: guvenlik, kuyruk, her aktif isin sonraki adimi. Durmasi gerekiyorsa nedenini dondurur."""
    simdi = simdi or time.time()
    if not A.kanca_kurulu():
        return "koruma kancası kurulu değil"
    if not A.sunucu():
        return "Antigravity kapalı"
    d = A.oku_durum()
    for no in baslatilacaklar(bekleyen_gorevler(), p, A._isler(d), bugun_baslatilan(jsonl_oku("pilot.jsonl"), simdi)):
        try:
            efor = gorev_efor(no)
            ayni = any(not s.get("hazir") and d.get(n, {}).get("model") == A.EFOR[efor] for n, s in p.items())
            A.baslat(no, yeni=ayni)              # pilotun paralel isleri ayni konusmayi paylasmaz
            p[no] = {"baslangic": int(time.time())}
            kaydet(no, "baslat", "kuyrukta bekliyordu", model=A.EFOR[efor])
        except SystemExit as e:
            p[no] = {"hazir": True, "sonuc": "başlatılamadı: %s" % e}
            kaydet(no, "hata", "başlatılamadı: %s" % e)
    ada = {x["ad"]: x for x in A.hepsi()}
    mesgul = any(x.get("tur") == "denetim" and x.get("asama") == "çalışıyor" for x in ada.values())
    for no, s in p.items():
        x = ada.get(no)
        if s.get("hazir") or not x:
            continue
        dn = ada.get(x.get("denetim") or "")
        o = {"commit": A.git("rev-parse", "--short", x["dal"], kontrol=False), "simdi": simdi,
             "teslim": x.get("asama") == "inceleme" and _teslim(x), "gorev_durum": gorev_durumu(x),
             "test": T.son_ozet(no), "denetci_mesgul": mesgul, "test_mesgul": T.kilit_sahibi() is not None}
        if dn and dn.get("asama") not in ("çalışıyor", "sorun") and dn.get("commit") == o["commit"] and "ilk_karar" not in s:
            k = (dn.get("canli") or {}).get("karar")
            s["ilk_karar"] = k[0] if k else "kararsız"
        eylem, neden = adim(x, dn, s, o)
        if eylem == "bekle":
            if s.get("son") != neden:
                kaydet(no, "bekle", neden)
            s["son"] = neden
            continue
        try:
            uygula(no, eylem, neden, x, dn, s, o)
            kaydet(no, eylem, neden, commit=o["commit"])
        except SystemExit as e:
            s.update(hazir=True, sonuc="bırakıldı: %s başarısız (%s)" % (eylem, e))
            kaydet(no, "hata", s["sonuc"])
        s["son"] = neden
        if eylem == "gozden":
            mesgul = True
        if eylem in ("hazir", "birak"):
            bildir(no, s["sonuc"])
    return None


def _teslim(x):
    import ajan_kanca as K
    return K.teslim_edildi(x)


def bildir(no, sonuc):
    """Windows bildirimi yok; telefon itme yolu da yok (bkz. OFIS.md). Gorev Takibi ve 'pilot durum' gosterir."""
    jsonl_ekle("bildirim.jsonl", {"no": no, "metin": "%s Claude'un incelemesine hazır: %s" % (no, sonuc)})


def calis():
    if canli_mi():
        raise SystemExit("Pilot zaten çalışıyor.")
    yol("pilot.dur").unlink(missing_ok=True)
    kaydet("-", "basla", "pilot başladı (paralel %d, günlük %d)" % (PARALEL, GUNLUK))
    neden = None
    while not neden:
        yol("pilot.nabiz").write_text(json.dumps({"t": int(time.time()), "pid": os.getpid()}), encoding="utf-8")
        p = durum_oku()
        try:
            neden = tur(p)
        except Exception as e:  # beklenmeyen hata pilotu sessizce oldurmesin: kaydet ve dur
            neden = "beklenmeyen hata: %r" % e
        durum_yaz(p)
        for _ in range(TUR_SN // 5):
            if yol("pilot.dur").exists():
                neden = neden or "durduruldu"
                break
            time.sleep(5)
    kaydet("-", "dur", neden)
    yol("pilot.nabiz").unlink(missing_ok=True)
    yol("pilot.dur").unlink(missing_ok=True)


def komut(argv):
    k = argv[0] if argv else "durum"
    if k == "baslat":
        if canli_mi():
            print("Pilot zaten çalışıyor.")
            return
        if not A.kanca_kurulu():
            raise SystemExit("Koruma kancası kurulu değil; pilot başlatılmaz (python tools/ajan.py kur).")
        exe = Path(sys.executable)
        w = exe.with_name("pythonw.exe")
        ayrik([str(w if w.exists() else exe), str(Path(__file__).resolve()), "calis"])
        print("Pilot başlatıldı (paralel %d, günlük %d, tur %d sn). Durum: python tools/ajan.py pilot durum" % (PARALEL, GUNLUK, TUR_SN))
    elif k == "dur":
        A.AJAN_KLASOR.mkdir(parents=True, exist_ok=True)
        yol("pilot.dur").write_text(str(int(time.time())), encoding="utf-8")
        print("Durdurma istendi; pilot en geç %d sn içinde durur." % TUR_SN)
    elif k == "durum":
        print(durum_metni())
    else:
        raise SystemExit("pilot baslat|dur|durum")


def ozet(son=12):
    """Gorev Takibi ve 'pilot durum' icin."""
    n = canli_mi()
    return {"canli": bool(n), "nabiz": (n or {}).get("t"), "isler": durum_oku(),
            "kararlar": [k for k in jsonl_oku("pilot.jsonl", son * 4) if k.get("eylem") != "bekle"][-son:],
            "bugun": bugun_baslatilan(jsonl_oku("pilot.jsonl")), "gunluk": GUNLUK, "paralel": PARALEL,
            "olcum": olcum_ozet(jsonl_oku("olcum.jsonl"))}


def durum_metni():
    o = ozet()
    sat = ["Pilot: %s · bugün %d/%d iş · paralel %d" % ("ÇALIŞIYOR" if o["canli"] else "durmuş", o["bugun"], o["gunluk"], o["paralel"])]
    for no, s in sorted(o["isler"].items()):
        sat.append("  %-6s %-8s %s" % (no, "HAZIR" if s.get("hazir") else "aktif", s.get("sonuc") or s.get("son") or ""))
    sat.append("Son kararlar:")
    for k in o["kararlar"]:
        sat.append("  %s %-6s %-11s %s" % (time.strftime("%d.%m %H:%M", time.localtime(k["t"])), k.get("no"), k.get("eylem"), k.get("neden")))
    for m, v in sorted(o["olcum"].items()):
        sat.append("Model %-10s %d iş · ilk turda temiz %%%d · ort. %d dk · %d bin token"
                   % (m, v["is"], round(100 * v["oran"]), v["ort_sure"] // 60, v["ort_token"] // 1000))
    return "\n".join(sat)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure") and sys.stdout:
        sys.stdout.reconfigure(encoding="utf-8")
    if sys.argv[1:2] == ["calis"]:
        calis()
    else:
        komut(sys.argv[1:])
