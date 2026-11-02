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
GUNLUK = 20                      # bir gunde pilotun baslatabilecegi is; kota senaryosu Gemini sinirini ayrica korur
MAX_TUR = 2                      # Denetci bulgusunu geri gonderme
MAX_TEST_TUR = 1                 # Testci kirmizisini geri gonderme
MAX_TEST_ISTEK = 3               # ayni commit icin Testci cagrisi (kosulamadi dahil)
TUR_SN = 30
GECICI_SINIR = 10                # ust uste bu kadar gecici hata kalici sayilir: pilot durur
ALT_EFOR = {"yuksek": "dusuk", "orta": "dusuk"}  # pro ve flash ayni model (M322): gercek alt kademe flash_lite
KOTA = re.compile(r"RESOURCE_EXHAUSTED|quota|rate.?limit|\b429\b|kota|usage limit|limit (?:reached|exceeded)"
                  r"|exhausted|try again (?:in|after|later)|resets? (?:in|at)", re.I)
# KOTA SENARYOSU (depo sahibi, 2026-11-01: «5 saatlik ya da haftalik limit bitince sistem anlasin»):
# alt modele dus; o da doluysa is BIRAKILMAZ, «kota bekliyor» olur, pilot yeni is baslatmaz ve yoklar.
KOTA_YOKLA = 30 * 60              # 5 saatlik pencerede yoklama araligi (duran ajana «devam et»; doluysa kota harcamaz)
KOTA_HAFTALIK = 6 * 3600          # bu kadar suredir doluysa ya da acilis bundan uzaksa haftalik limit sayilir
KOTA_HAFTALIK_YOKLA = 6 * 3600


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


def kota_acilis(metin, simdi):
    """Hata metnindeki acilis zamani (epoch) ya da None: «resets in 2h 15m», «try again in 45 minutes», «at 14:30»."""
    t = metin or ""
    m = re.search(r"\b(?:in|after)\s+(?=\d)((?:\d+\s*(?:h|hr|hours?|saat|sa)\b\s*)?(?:\d+\s*(?:m|min|minutes?|dakika|dk)\b)?)", t, re.I)
    if m and m.group(1).strip():
        s = re.search(r"(\d+)\s*(?:h|hr|hours?|saat|sa)\b", m.group(1), re.I)
        d = re.search(r"(\d+)\s*(?:m|min|minutes?|dakika|dk)\b", m.group(1), re.I)
        return int(simdi + (int(s.group(1)) * 3600 if s else 0) + (int(d.group(1)) * 60 if d else 0))
    m = re.search(r"\bat\s+(\d{1,2}):(\d{2})", t, re.I)
    if m:
        y = time.localtime(simdi)
        hedef = time.mktime((y.tm_year, y.tm_mon, y.tm_mday, int(m.group(1)), int(m.group(2)), 0, 0, 0, -1))
        return int(hedef if hedef > simdi else hedef + 86400)
    return None


def kota_karari(k, metin, simdi):
    """Kota durumunu gunceller (saf): {ilk, sayi, tur: '5 saatlik'|'haftalık', sonraki (yoklama zamani), metin}."""
    k = dict(k or {"ilk": int(simdi), "sayi": 0})
    k["sayi"] += 1
    acilis = kota_acilis(metin, simdi)
    haftalik = simdi - k["ilk"] >= KOTA_HAFTALIK or (acilis is not None and acilis - simdi > KOTA_HAFTALIK)
    sonraki = acilis + 60 if acilis else simdi + (KOTA_HAFTALIK_YOKLA if haftalik else KOTA_YOKLA)
    k.update(tur="haftalık" if haftalik else "5 saatlik", sonraki=int(sonraki), metin=(metin or "")[:240])
    return k


def kota_metni(c):
    """Dokumdeki son kota hatasinin metni."""
    return next((a.get("metin") or "" for a in reversed((c or {}).get("son_adimlar") or [])
                 if (a.get("tur") == "hata" or a.get("durum") == "ERROR") and KOTA.search(a.get("metin") or "")), "")


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


def sonuc_eksik(metin):
    """Gorev dosyasinin «Sonuc» bolumunde bos ya da hic olmayan alanlar (SONUC_ALAN sirasiyla). Saf islev."""
    bolum = re.sub(r"<!--.*?-->", "", metin.split("## Sonuç", 1)[1] if "## Sonuç" in metin else "", flags=re.S)
    eksik = []
    for ad in A.SONUC_ALAN:
        m = re.search(r"\*\*%s:\*\*(.*?)(?=\n\s*-\s*\*\*|\Z)" % re.escape(ad), bolum, re.S)
        if not m or not m.group(1).strip():
            eksik.append(ad)
    return eksik


def bicim_metni(eksik):
    return ("Görev dosyasının «Sonuç» bölümü eksik: %s. Şablondaki dört satırı doldur (- **Ne değişti:** · "
            "- **Koşan testler:** komut -> çıktı satırı · - **Kabul testi:** · - **Açık kalan:**; yoksa «yok»). "
            "Commit et ve dalını push et." % ", ".join(eksik))


KOTA_DEVAM_METNI = ("Antigravity kotası yenilendi. Kaldığın yerden devam et: klasördeki yarım işi incele, işi bitir, "
                    "testleri koş; Uygulayıcıysan commit et ve dalını push et, Denetçiysen KARAR satırını ver.")


def kota_dosya():
    return yol("kota.json")


def kota_oku():
    try:
        return json.loads(kota_dosya().read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def kota_yaz(k):
    A.AJAN_KLASOR.mkdir(parents=True, exist_ok=True)
    if k is None:
        kota_dosya().unlink(missing_ok=True)
    else:
        kota_dosya().write_text(json.dumps(k, ensure_ascii=False), encoding="utf-8")


def kota_isaretle(metin, simdi):
    """Kota doldu: durumu gunceller; ilk kez ya da haftaliga donunce bildirir."""
    once = kota_oku()
    k = kota_karari(once, metin, simdi)
    kota_yaz(k)
    if not once or once.get("tur") != k["tur"]:
        jsonl_ekle("bildirim.jsonl", {"no": "-", "metin": "Antigravity kotası doldu (%s). Yeni iş başlatılmıyor; yarım işler bekliyor, "
                                      "yoklama %s. Acil kritik işi Claude Code kendisi yapar." % (k["tur"], time.strftime("%d.%m %H:%M", time.localtime(k["sonraki"])))})
        kaydet("-", "kota", "kota doldu (%s); yoklama %s" % (k["tur"], time.strftime("%H:%M", time.localtime(k["sonraki"]))))
    return k


DENEME_METNI = ("Cevabında DENEME satırı yok. Kabul ölçütü dışındaki en az iki kenar girdiyi gerçekten çalıştır, "
                "her birini 'DENEME: komut -> çıktı' diye yaz; sonra KARAR satırını yeniden ver.")


def adim(x, dn, s, o):
    """Bir pilot isinin sonraki adimi: (eylem, neden). Saf islev.
    x: ajan.hepsi() kaydi; dn: Denetci kaydi (ya da None); s: pilotun bu isle ilgili durumu;
    o: {commit, teslim, gorev_durum, test, denetci_mesgul, test_mesgul, simdi}."""
    c = x.get("canli") or {}
    simdi = o["simdi"]
    if x.get("asama") == "kapandı":
        return "birak", "iş kapatıldı"
    k = o.get("kota")
    if s.get("kota_bekliyor"):
        if k and simdi < k["sonraki"]:
            return "bekle", "kota dolu (%s); yoklama %s" % (k["tur"], time.strftime("%H:%M", time.localtime(k["sonraki"])))
        return "kota_devam", "kota yoklaması: kaldığı yerden devam"
    if k and simdi < k["sonraki"]:
        return "bekle", "kota dolu (%s); yeni adım yok" % k["tur"]
    if s.get("kota_devam_t") and simdi - s["kota_devam_t"] < 180:
        return "bekle", "kota sonrası devam bekleniyor"
    if c.get("hal") == "hata" and kota_hatasi(c):
        if not s.get("dusuruldu") and ALT_EFOR.get(x.get("efor")) and A.EFOR[ALT_EFOR[x["efor"]]] != x.get("model"):
            return "kota", "kota hatası: %s ile yeniden" % A.EFOR[ALT_EFOR[x["efor"]]]
        return "kota_bekle", "kota doldu (alt model de); iş bırakılmaz, açılınca devam"
    if x.get("asama") == "sorun":
        return "birak", "Uygulayıcı: " + (c.get("hal") or "sorun")
    if x.get("asama") != "inceleme":
        return "bekle", "Uygulayıcı çalışıyor"
    son = c.get("son_degisim") or 0
    if s.get("mesaj_t"):
        if son < s["mesaj_t"]:
            return ("birak", "düzeltme mesajına 15 dakikada tepki yok") if simdi - s["mesaj_t"] > 900 \
                else ("bekle", "düzeltme bekleniyor")
        if o["commit"] == s.get("mesaj_commit"):      # kanca «push et» deyip devam ettirirken araya kisa durma girer
            return ("hazir", "düzeltme commit'i gelmedi") if simdi - son > 300 else ("bekle", "düzeltme commit'i bekleniyor")
    if not o["teslim"]:
        if o.get("gorev_durum") == "takıldı":
            return "hazir", "Uygulayıcı takıldı"
        return ("birak", "teslim edilmedi (bitti, commit ya da push yok)") if simdi - son > 300 \
            else ("bekle", "teslim bekleniyor")
    if o.get("yasak"):
        return "hazir", "yasak bölgeye dokundu: " + ", ".join(o["yasak"])
    if o.get("kabul_degisti"):
        return "hazir", "kabul ölçütü dalda değiştirildi: " + ", ".join(o["kabul_degisti"])
    if o.get("sonuc_eksik") and not s.get("bicim_tur"):
        return "bicim", "Sonuç eksik: " + ", ".join(o["sonuc_eksik"])
    if not dn or dn.get("commit") != o["commit"]:
        if x.get("denetim") == "istendi" and simdi - son < 180 or o["denetci_mesgul"]:
            return "bekle", "Denetçi sırası"
        return "gozden", "Denetçi istendi (commit %s)" % o["commit"]
    if dn.get("asama") == "çalışıyor":
        return "bekle", "Denetçi inceliyor"
    if dn.get("asama") == "sorun":
        if kota_hatasi(dn.get("canli")):
            return "kota_bekle", "Denetçi kotaya takıldı; açılınca devam"
        return "birak", "Denetçi hata verdi"
    karar = (dn.get("canli") or {}).get("karar")
    if karar and karar[0] == "temiz" and not A.deneme_var((dn.get("canli") or {}).get("cevap")) and not s.get("deneme_istendi"):
        return "deneme", "Denetçi denemesiz «temiz» dedi"
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
    son = {k["no"]: k["son"] for k in kayitlar if k.get("son")}   # ajan.py ders: Claude Code'un son incelemesi
    for k in kayitlar:
        if k.get("son"):
            continue
        m = out.setdefault(k.get("model") or "?", {"is": 0, "ilk_temiz": 0, "sure": 0, "token": 0, "tur": 0, "son": 0, "son_temiz": 0})
        if k.get("no") in son:
            m["son"] += 1
            m["son_temiz"] += son[k["no"]] == "temiz"
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


def gorev_sonuc_eksik(a):
    try:
        return sonuc_eksik((Path(a["worktree"]) / A.GOREVLER / a.get("gorev", "")).read_text(encoding="utf-8"))
    except OSError:
        return []


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
    elif eylem == "bicim":
        s["bicim_tur"] = 1
        A.mesaj(no, bicim_metni(o["sonuc_eksik"]))
        s.update(mesaj_t=time.time(), mesaj_commit=o["commit"])
    elif eylem == "deneme":
        s["deneme_istendi"] = True
        A.mesaj(x.get("denetim") or "d-" + no, DENEME_METNI)
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
    elif eylem == "kota_bekle":
        s.update(kota_bekliyor=True, kota_hedef="denetci" if "Denetçi" in neden else "uygulayici")
    elif eylem == "kota_devam":
        hedef = (x.get("denetim") or "d-" + no) if s.get("kota_hedef") == "denetci" else no
        A.mesaj(hedef, KOTA_DEVAM_METNI)
        s.update(kota_bekliyor=False, kota_devam_t=time.time())
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
    kota = kota_oku()
    bekleyen = [] if kota and simdi < kota["sonraki"] else bekleyen_gorevler()       # kota doluyken yeni is yok
    for no in baslatilacaklar(bekleyen, p, A._isler(d), bugun_baslatilan(jsonl_oku("pilot.jsonl"), simdi)):
        try:
            efor = gorev_efor(no)
            ayni = any(not s.get("hazir") and d.get(n, {}).get("model") == A.EFOR[efor] for n, s in p.items())
            A.baslat(no, yeni=ayni)              # pilotun paralel isleri ayni konusmayi paylasmaz
            p[no] = {"baslangic": int(time.time())}
            kaydet(no, "baslat", "kuyrukta bekliyordu", model=A.EFOR[efor])
        except SystemExit as e:
            if KOTA.search(str(e)):                      # baslatirken kota: is kuyrukta kalir, sonra denenir
                kota = kota_isaretle(str(e), simdi)
                break
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
             "test": T.son_ozet(no), "denetci_mesgul": mesgul, "test_mesgul": T.kilit_sahibi() is not None,
             "kabul_degisti": [k for k in x.get("kabul") or () if A.git("diff", "--name-only", "main..." + x["dal"], "--", k, kontrol=False)]
             + (["görev dosyasının ölçütü"] if A.gorev_degisti(x["dal"], x.get("gorev", "")) else []),
             "sonuc_eksik": gorev_sonuc_eksik(x),
             "yasak": [y for y, _ in A.yasak_bolge((A.git("diff", "--name-only", "main..." + x["dal"], kontrol=False) or "").splitlines())],
             "kota": kota}
        if dn and dn.get("asama") not in ("çalışıyor", "sorun") and dn.get("commit") == o["commit"] and "ilk_karar" not in s:
            k = (dn.get("canli") or {}).get("karar")
            s["ilk_karar"] = k[0] if k else "kararsız"
        eylem, neden = adim(x, dn, s, o)
        if eylem == "kota_bekle":
            kota = kota_isaretle(kota_metni(x.get("canli")) or kota_metni((dn or {}).get("canli")) or neden, simdi)
        elif kota and s.get("kota_devam_t") and simdi - s["kota_devam_t"] > 180 and (x.get("canli") or {}).get("hal") != "hata":
            kota_yaz(None)                               # devam ettirilen is ilerliyor: kota acildi
            kota = None
            jsonl_ekle("bildirim.jsonl", {"no": "-", "metin": "Antigravity kotası açıldı; ofis kaldığı yerden sürüyor."})
            kaydet("-", "kota", "kota açıldı")
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


def tur_hatasi(e, ust_uste):
    """Turdaki hata. Gecici olan (bellek dolu: OSError 1455, PowerShell TimeoutExpired) turu atlar, pilot surer;
    beklenmeyen ya da ust uste GECICI_SINIR'inci gecici hata durma nedenidir. (neden|None, yeni ust_uste)"""
    ust_uste += 1
    if not isinstance(e, (OSError, MemoryError, subprocess.TimeoutExpired)):
        return "beklenmeyen hata: %r" % e, ust_uste
    if ust_uste >= GECICI_SINIR:
        return "üst üste %d geçici hata: %r" % (ust_uste, e), ust_uste
    kaydet("-", "atla", "geçici hata, tur atlandı: %r" % e)
    return None, ust_uste


def calis():
    if canli_mi():
        raise SystemExit("Pilot zaten çalışıyor.")
    yol("pilot.dur").unlink(missing_ok=True)
    kaydet("-", "basla", "pilot başladı (paralel %d, günlük %d)" % (PARALEL, GUNLUK))
    neden, ust_uste = None, 0
    while not neden:
        yol("pilot.nabiz").write_text(json.dumps({"t": int(time.time()), "pid": os.getpid()}), encoding="utf-8")
        p = durum_oku()
        try:
            neden = tur(p)
            ust_uste = 0
        except Exception as e:  # hata pilotu sessizce oldurmesin: gecicide tur atlanir, gerisinde kaydet ve dur
            neden, ust_uste = tur_hatasi(e, ust_uste)
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
            "olcum": olcum_ozet(jsonl_oku("olcum.jsonl")), "kota": kota_oku()}


def durum_metni():
    o = ozet()
    sat = ["Pilot: %s · bugün %d/%d iş · paralel %d" % ("ÇALIŞIYOR" if o["canli"] else "durmuş", o["bugun"], o["gunluk"], o["paralel"])]
    if o["kota"]:
        sat.append("KOTA DOLU · %s · %s'den beri · yoklama %s · %s" % (
            o["kota"]["tur"], time.strftime("%d.%m %H:%M", time.localtime(o["kota"]["ilk"])),
            time.strftime("%d.%m %H:%M", time.localtime(o["kota"]["sonraki"])), o["kota"].get("metin", "")[:80]))
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
