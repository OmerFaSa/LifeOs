#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""LifeOS — HER YERDEN ERISIM (Tailscale).

   Telefon ve tablet evden uzaktayken de bu bilgisayardaki modullere ve
   Merkez'e (yerel model, API anahtari yok) ulasir. Sozler:

   1. YALNIZ KULLANICININ OZEL AGI. `tailscale serve` kullanilir, `funnel`
      asla: hicbir kapi internete acilmaz. Merkez yine 127.0.0.1'de dinler.
   2. VEKIL YEREL DEGILDIR. serve istegi 127.0.0.1'den getirir; «yalniz bu
      bilgisayar» denetimleri aciga cikmasin diye Sunucu kapida isaretler
      (vekilden_mi). Admin kurulumu, yedek, ayar yine yalniz bilgisayardan.
   3. KURMAZ, GIRIS YAPMAZ. Tailscale'i kullanici kurar ve hesabina girer.
   4. DURUMUN TEK KAYNAGI TAILSCALE'IN KENDISI; ayri ayar dosyasi yok.
      Funnel elle acilmissa erisim «acik» sayilmaz, jeton verilmez.
   5. ACILISTA BASLAMA KULLANICININ DUGMESIDIR, varsayilan kapali. Windows'un kullaniciya
      ait baslangic listesine tek satir (yonetici izni istemez); kapatinca iz kalmaz. Oturum
      acilmadan calismaz. Bilgisayarin uyku ve guc ayarina hic dokunmaz.
"""

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# dis kapi -> bilgisayardaki kapi. Dis modul kapilari telefon.PORTLAR ile ayni:
# modul baglantilari ve adres duzeltme (hesap.js TELEFON_KAPI) degismeden calisir.
KAPILAR = {5173: 4173, 5183: 4183, 5193: 4193, 443: 4200}
HESAP_KAPI = 5183
# Tek kapi (tekkapi.ETKIN, P6): her sey 4180'de, tek adreste (Merkez /api/hkm/ altinda).
# tekkapi ice aktarilinca kapilari_sec(ETKIN) cagirir; bayrak kapaliyken yukaridakiler aynen kalir.
ESKI_KAPILAR, TEK_KAPILAR = dict(KAPILAR), {443: 4180}
VEKIL_IP = "100.64.0.0"     # yerel olmayan, gecerli bicimli isaret adresi
VEKIL_BASLIKLARI = ("X-Forwarded-For", "X-Forwarded-Host", "X-Forwarded-Proto", "Forwarded",
                    "Tailscale-User-Login", "Tailscale-User-Name")
YEREL_HOST = re.compile(r"^(127\.0\.0\.1|localhost|\[::1\]|[a-z0-9-]+\.localhost)(:\d+)?$")
_ONBELLEK = {"t": 0.0, "ad": ""}


def kapilari_sec(tek):
    """Tailscale'in sunacagi kapilar: tek kapi devredeyse yalniz 443 -> 4180, degilse bugunku dort."""
    global KAPILAR, HESAP_KAPI
    KAPILAR, HESAP_KAPI = (dict(TEK_KAPILAR), 443) if tek else (dict(ESKI_KAPILAR), 5183)


def vekilden_mi(ip, basliklar):
    """127.0.0.1'den gelen istek gercekten bu bilgisayardan mi, vekilden mi?"""
    if ip not in ("127.0.0.1", "::1", "::ffff:127.0.0.1"):
        return False
    if any(basliklar.get(b) for b in VEKIL_BASLIKLARI):
        return True
    return not YEREL_HOST.match((basliklar.get("Host") or "127.0.0.1").strip().lower())


def _cli():
    return shutil.which("tailscale") or next(
        (y for y in (r"C:\Program Files\Tailscale\tailscale.exe",) if os.path.exists(y)), None)


def _tailscale(cli, argumanlar, calistir):
    ek = {"creationflags": 0x08000000} if os.name == "nt" else {}   # konsol penceresi acilmasin
    return calistir([cli] + argumanlar, capture_output=True, text=True, encoding="utf-8",
                    errors="replace", timeout=30, **ek)


def durum(calistir=subprocess.run):
    """{kurulu, bagli, acik, ad}. Tailscale yoksa ya da cevap vermezse hepsi bos; firlatmaz."""
    sonuc = {"kurulu": False, "bagli": False, "acik": False, "ad": "", "funnel": False}
    cli = _cli()
    if not cli:
        return sonuc
    sonuc["kurulu"] = True
    try:
        s = json.loads(_tailscale(cli, ["status", "--json"], calistir).stdout or "{}")
        sonuc["bagli"] = s.get("BackendState") == "Running"
        sonuc["ad"] = ((s.get("Self") or {}).get("DNSName") or "").rstrip(".")
        if sonuc["bagli"] and sonuc["ad"]:
            serve = json.loads(_tailscale(cli, ["serve", "status", "--json"], calistir).stdout or "{}")
            web = serve.get("Web") or {}
            sonuc["funnel"] = any((serve.get("AllowFunnel") or {}).values())
            sonuc["acik"] = not sonuc["funnel"] and all(
                ((web.get("%s:%d" % (sonuc["ad"], dis)) or {}).get("Handlers") or {}).get("/", {}).get("Proxy")
                == "http://127.0.0.1:%d" % ic
                for dis, ic in KAPILAR.items())
    except (OSError, ValueError, subprocess.SubprocessError):
        pass
    return sonuc


def acik_ad(simdi=time.time, oku=durum):
    """Acik ise bilgisayarin adi, degilse ''. /api/hesap/durum sik cagrilir: 60 sn onbellek."""
    if simdi() - _ONBELLEK["t"] > 60:
        d = oku()
        _ONBELLEK.update(t=simdi(), ad=d["ad"] if d["acik"] else "")
    return _ONBELLEK["ad"]


def _kokenleri_yaz(ad, yol=None):
    """Android tarayicisindaki modul Merkez'e capraz koken: yalniz bu bilgisayarin kapilari."""
    yol = yol or os.path.join(KOK, "HKM", "config.json")
    with open(yol, encoding="utf-8") as f:
        cfg = json.load(f)
    kokenler = ["https://%s:%d" % (ad, p) for p in sorted(KAPILAR) if p != 443]
    # Baska bir bilgisayar adindan kalan .ts.net kokeni tasinmaz.
    eski = [k for k in cfg.get("allowed_origins", []) if ".ts.net" not in k]
    cfg["allowed_origins"] = eski + kokenler
    fd, gecici = tempfile.mkstemp(dir=os.path.dirname(yol), suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)
    os.replace(gecici, yol)


def ac(calistir=subprocess.run, kok_yaz=_kokenleri_yaz):
    d = durum(calistir)
    if not d["kurulu"]:
        return {"ok": False, "mesaj": "Önce bu bilgisayara Tailscale'i kur."}
    if not d["bagli"] or not d["ad"]:
        return {"ok": False, "mesaj": "Tailscale'e giriş yap, sonra yeniden dene."}
    if d["funnel"]:
        return {"ok": False, "mesaj": "Bu bilgisayarda funnel açık, yani internete açık bir kapı var. "
                                      "Önce kapat: tailscale funnel reset"}
    cli = _cli()
    for dis, ic in KAPILAR.items():
        try:
            r = _tailscale(cli, ["serve", "--bg", "--https=%d" % dis, "http://127.0.0.1:%d" % ic], calistir)
        except subprocess.TimeoutExpired as e:
            # Serve agda kapaliysa tailscale onay bekler, cikmaz; onay adresi ciktisindadir.
            cikti = "".join(x.decode("utf-8", "replace") if isinstance(x, bytes) else (x or "")
                            for x in (e.stdout, e.stderr))
            m = re.search(r"https://login\.tailscale\.com/\S+", cikti)
            return {"ok": False, "onay": m.group(0) if m else "",
                    "mesaj": "Tailscale'de bu özellik kapalı. Şu sayfadan aç, sonra yeniden dene: %s" % m.group(0)
                    if m else "Tailscale cevap vermedi; yeniden dene."}
        if r.returncode != 0:
            # Sik sebep: agda HTTPS kapali; Tailscale'in yonergesi aynen gosterilir.
            return {"ok": False, "mesaj": (r.stderr or r.stdout or "Tailscale kapıyı açamadı.").strip()[:400]}
    for dis in ESKI_KAPILAR:
        if dis not in KAPILAR:      # tek kapiya geciste eski kapi bos bir porta acik kalmasin
            _tailscale(cli, ["serve", "--https=%d" % dis, "off"], calistir)
    kok_yaz(d["ad"])
    _ONBELLEK["t"] = 0.0
    return {"ok": True, "ad": d["ad"], "mesaj": "Açıldı. Telefon ve tablette sunucu adresi: %s" % d["ad"]}


def kapat(calistir=subprocess.run):
    cli = _cli()
    if not cli:
        return {"ok": False, "mesaj": "Tailscale kurulu değil."}
    for dis in list(KAPILAR) + [d for d in ESKI_KAPILAR if d not in KAPILAR]:
        _tailscale(cli, ["serve", "--https=%d" % dis, "off"], calistir)
    _ONBELLEK["t"] = 0.0
    return {"ok": True, "mesaj": "Her yerden erişim kapandı."}


def merkez(oku=durum, yol=None):
    """Girisli admin cihazina Merkez'in adresi ve jetonu; erisim kapaliysa None."""
    d = oku()
    if not d["acik"]:
        return None
    with open(yol or os.path.join(KOK, "HKM", "config.json"), encoding="utf-8") as f:
        jeton = (json.load(f) or {}).get("local_token") or ""
    if not jeton:
        return None
    return {"url": "https://%s" % d["ad"], "token": jeton,
            "adres": "https://%s" % d["ad"] + ("" if HESAP_KAPI == 443 else ":%d" % HESAP_KAPI)}


def sahip(calistir=subprocess.run):
    """Bu bilgisayarin Tailscale hesabi (kucuk harf); okunamazsa ''."""
    cli = _cli()
    if not cli:
        return ""
    try:
        s = json.loads(_tailscale(cli, ["status", "--json"], calistir).stdout or "{}")
        u = (s.get("User") or {}).get(str((s.get("Self") or {}).get("UserID"))) or {}
        return (u.get("LoginName") or "").lower()
    except (OSError, ValueError, subprocess.SubprocessError):
        return ""


def merkez_kimlikle(basliklar, oku_sahip=sahip, oku_merkez=merkez):
    """Hesapsiz bag: serve kimlik basligini kendisi yazar, disaridan geleni ezer (2026-11-06'da
    canli denendi). Yalniz vekilden gelen istekte cagrilir ve yalniz bilgisayarin sahibine verir."""
    giris = (basliklar.get("Tailscale-User-Login") or "").lower()
    if not giris or giris != oku_sahip():
        return None
    return oku_merkez()


RUN_ANAHTAR = r"Software\Microsoft\Windows\CurrentVersion\Run"
RUN_AD = "LifeOS"


def _reg(reg):
    if reg is not None:
        return reg
    import winreg       # Windows disinda ImportError: secenek yok
    return winreg


def acilis_komutu():
    """Pencere acmayan Python; tarayici da acilmaz. Her yerden erisimi degistirmez."""
    w = os.path.join(os.path.dirname(sys.executable), "pythonw.exe")
    return '"%s" "%s" --tarayicisiz' % (w if os.path.exists(w) else sys.executable,
                                        os.path.join(KOK, "sistem", "baslat.py"))


def acilis_acik(reg=None):
    try:
        r = _reg(reg)
        with r.OpenKey(r.HKEY_CURRENT_USER, RUN_ANAHTAR) as k:
            return bool(r.QueryValueEx(k, RUN_AD)[0])
    except (ImportError, OSError):
        return False


def acilis_ayarla(acik, reg=None):
    """Soz 5. Doner: {ok, acilis, mesaj}."""
    try:
        r = _reg(reg)
        with r.OpenKey(r.HKEY_CURRENT_USER, RUN_ANAHTAR, 0, r.KEY_SET_VALUE) as k:
            if acik:
                r.SetValueEx(k, RUN_AD, 0, r.REG_SZ, acilis_komutu())
            else:
                try:
                    r.DeleteValue(k, RUN_AD)
                except FileNotFoundError:
                    pass
    except ImportError:
        return {"ok": False, "acilis": False, "mesaj": "Bu seçenek yalnız Windows'ta var."}
    except OSError as e:
        return {"ok": False, "acilis": acilis_acik(reg), "mesaj": "Ayar yazılamadı: %s" % e}
    return {"ok": True, "acilis": bool(acik),
            "mesaj": "Bilgisayar açılınca LifeOS da başlayacak." if acik else "LifeOS açılışta başlamayacak."}


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    import tekkapi      # gec: tekkapi sunucu'yu, sunucu bu dosyayi ice aktarir
    kapilari_sec(tekkapi.ETKIN)
    islem = {"--ac": ac, "--kapat": kapat}.get((sys.argv[1:] or [""])[0], durum)
    print(json.dumps(islem(), ensure_ascii=False, indent=2))
