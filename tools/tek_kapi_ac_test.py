#!/usr/bin/env python3
"""Tek kapiyi acma komutu (sistem/tek_kapi_ac.py) testi: python tools/tek_kapi_ac_test.py   (cikis 0 temiz, 1 kirmizi)

Her senaryo kendi dunyasinda: gecici LOCALAPPDATA ve USERPROFILE (hesap.db, paketler, deneme deposu, PC dosyalari),
sahte bir agac (LIFEOS_TKA_KOK: gercek tekkapi.py'nin kopyasi, sahte baslat.py + sahte sunucu, gercek
kabuk_baslangic.py'ye giden sarmal) ve bos yuksek portlar. Gercek veriye, gercek portlara (4173/4180/4183/4193/4200,
51xx) ve gercek tekkapi.py'ye dokunmaz. Goc, karsilastirma ve kabuk baslangic paketi GERCEK kodla kosar."""
import hashlib
import io
import json
import os
import shutil
import socket
import sqlite3
import subprocess
import sys
import tempfile
import time
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KOK / "sistem"))
sys.dont_write_bytecode = True
import goc  # noqa: E402
import hesap  # noqa: E402
import veri  # noqa: E402

GERCEK_PORTLAR = {4173, 4180, 4183, 4193, 4200, 5173, 5183, 5193, 5180}
KOMUT = str(KOK / "sistem" / "tek_kapi_ac.py")
kirmizi, gecen = 0, 0
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


def dogru(ad, kosul, ek=""):
    global kirmizi, gecen
    print(("  ✓ " if kosul else "  ✕ ") + ad + ("" if kosul else "  %s" % (str(ek)[-1500:],)))
    kirmizi += 0 if kosul else 1
    gecen += 1 if kosul else 0


SAHTE_SUNUCU = r'''
import http.server, os, re, sys, threading
AGAC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEK = re.search(r"^ETKIN = True", open(os.path.join(AGAC, "sistem", "tekkapi.py"), encoding="utf-8").read(), re.M)
G = int(os.environ["LIFEOS_TKA_PORT"]); ESKI = [int(p) for p in os.environ["LIFEOS_TKA_ESKI_PORTLAR"].split(",")]
HATA = os.environ.get("LIFEOS_TKA_SAHTE", "")
if TEK and HATA == "baslat":
    sys.exit(4)                                   # tek kapi acilista coker
if TEK:                                           # acilista PC dosyasina yazar: geri donus yedekten onarmali
    open(os.path.join(os.environ["LOCALAPPDATA"], "LifeOS", "ayar.json"), "w").write('{"tema": "tek"}')
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        p = self.path
        if TEK and p == "/":
            self.send_response(302); self.send_header("Location", "/kabuk/"); self.send_header("Content-Length", "0"); self.end_headers(); return
        ok = (not TEK and self.server.server_address[1] != G) or p in ("/", "/kabuk/", "/api/hkm/health") \
            or (p in ("/ays/", "/spi/", "/esp/") and TEK and HATA != "dogrula")
        b = b"<html>sahte</html>"
        self.send_response(200 if ok else 404); self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
ss = [http.server.ThreadingHTTPServer(("127.0.0.1", p), H) for p in ([G] if TEK else [G] + ESKI)]
for s in ss[1:]:
    threading.Thread(target=s.serve_forever, daemon=True).start()
open(os.path.join(AGAC, "sunucu.pid"), "w").write(str(os.getpid()))
ss[0].serve_forever()
'''

SAHTE_BASLAT = r'''
import os, signal, socket, subprocess, sys, time
AGAC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PID = os.path.join(AGAC, "sunucu.pid"); G = int(os.environ["LIFEOS_TKA_PORT"])
def acik():
    try:
        socket.create_connection(("127.0.0.1", G), 0.3).close(); return True
    except OSError:
        return False
if "--dur" in sys.argv:
    if os.environ.get("LIFEOS_TKA_SAHTE") == "dur":
        sys.exit(0)                               # durduramaz
    if os.path.exists(PID):
        try:
            os.kill(int(open(PID).read()), signal.SIGTERM)
        except OSError:
            pass
        os.remove(PID)
    sys.exit(0)
if acik():
    print("zaten"); sys.exit(0)
p = subprocess.Popen([sys.executable, os.path.join(AGAC, "sistem", "sahte_sunucu.py")], stdin=subprocess.DEVNULL,
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, cwd=AGAC)
son = time.time() + 10
while time.time() < son and not acik() and p.poll() is None:
    time.sleep(0.2)
sys.exit(0 if acik() else 1)
'''

SARMAL = r'''
import os, runpy, sys
if os.environ.get("LIFEOS_TKA_SAHTE") == "baslangic":
    sys.exit(3)
GERCEK = %r
sys.argv[0] = GERCEK
runpy.run_path(GERCEK, run_name="__main__")
''' % str(KOK / "tools" / "kabuk_baslangic.py")


def bos_portlar(n):
    ss, out = [], []
    while len(out) < n:
        s = socket.socket()
        s.bind(("127.0.0.1", 0))
        p = s.getsockname()[1]
        ss.append(s)
        if p not in GERCEK_PORTLAR and p not in out:
            out.append(p)
    for s in ss:
        s.close()
    return out


def j(x):
    return json.dumps(x, ensure_ascii=False)


def paket_yaz(klasor, zaman, **p):
    b = j(dict({"lifeos_goc": 1}, **p)).encode("utf-8")
    return goc.paket_kaydet(io.BytesIO(b), len(b), klasor, zaman)["ad"]


TMP = tempfile.mkdtemp(prefix="lifeos-tka-test-")
DUNYALAR = []
PC, TEL = "cPCsinama0001", "cTELsinama001"


def dunya(ad, telefon=True, pc_taze=True, cakisma=False, pc_iz="adli"):
    k = os.path.join(TMP, ad)
    yerel, ev, agac = os.path.join(k, "yerel"), os.path.join(k, "ev"), os.path.join(k, "agac")
    L = os.path.join(yerel, "LifeOS")
    portlar = bos_portlar(9)
    env = dict(os.environ, LOCALAPPDATA=yerel, USERPROFILE=ev, HOME=ev, LIFEOS_TKA_KOK=agac, PYTHONIOENCODING="utf-8",
               LIFEOS_TKA_PORT=str(portlar[0]), LIFEOS_TKA_ESKI_PORTLAR=",".join(map(str, portlar[1:5])),
               LIFEOS_TKA_EV_PORTLAR=",".join(map(str, portlar[5:9])), LIFEOS_TKA_PENCERE="yok-boyle-surec-tka.exe",
               LIFEOS_TKA_TAILSCALE="yok")
    for x in ("LIFEOS_TKA_TEST_HATA", "LIFEOS_TKA_SAHTE", "LIFEOS_HESAP_KLASOR", "LIFEOS_VERI_DB"):
        env.pop(x, None)
    os.makedirs(os.path.join(agac, "sistem"))
    os.makedirs(os.path.join(agac, "tools"))
    shutil.copyfile(KOK / "sistem" / "tekkapi.py", os.path.join(agac, "sistem", "tekkapi.py"))
    for yol, metin in (("sistem/baslat.py", SAHTE_BASLAT), ("sistem/sahte_sunucu.py", SAHTE_SUNUCU), ("tools/kabuk_baslangic.py", SARMAL)):
        with open(os.path.join(agac, *yol.split("/")), "w", encoding="utf-8") as f:
            f.write(metin)
    # hesap.db: sahibin iki kaydi (bu bilgisayardan), telefonun oturumu «iPhone» adiyla
    d = hesap.Depo(os.path.join(L, "hesap", "hesap.db"))
    with d._islem() as c:
        d._kullanici_yaz(c, "sahip", "tka-sinama-parolasi-42", "admin")
        for alan, y, deger in (("ays/main", "cards/k1", {"front": "a"}), ("esp/ben", "days/2026-11-01", {"not": "x"})):
            c.execute("INSERT INTO kayit(kullanici, alan, yol, deger, zaman, cihaz, sira) VALUES (1,?,?,?,5,?,1)",
                      (alan, y, j(deger), "sunucu" if pc_iz == "yok" else PC))
        if pc_iz == "adli":                           # sahip PC'de girip gonderdi: oturum «Windows PC»
            c.execute("INSERT INTO oturum(ozet, kullanici, cihaz, cihaz_ad, olusturma, son) VALUES ('pc',1,?,'Windows PC',1,1)", (PC,))
        c.execute("INSERT INTO oturum(ozet, kullanici, cihaz, cihaz_ad, olusturma, son) VALUES ('oz',1,?,'iPhone',1,1)", (TEL,))
    pk = os.path.join(L, "goc", "paket")
    simdi = time.time()
    # eski gonderim: cards/eski cihazda sonradan silindi; goce girerse dirilirdi
    paket_yaz(pk, simdi - 86400, kaynak="ays", cihaz=PC, bekleyen={"ays/main": 0},
              profiller={"main": {"data": {"cards/k1": {"front": "a"}, "cards/eski": {"front": "silinmis"}}}})
    z = simdi if pc_taze else simdi - 5 * 3600
    paket_yaz(pk, z, kaynak="ays", cihaz=PC, bekleyen={"ays/main": 2},
              profiller={"main": {"data": {"cards/k1": {"front": "b"}}}})
    for kay in ("spi", "esp", "gun"):
        paket_yaz(pk, z, kaynak=kay, cihaz=PC, bekleyen={}, anahtarlar={"lifeos.%s.sinama" % kay: 1})
    if telefon:
        veri_ = {"cards/tel": {"front": "telefon"}}
        if cakisma:
            veri_["cards/k1"] = {"front": "telefonda başka"}       # ayni kayit, baska cihaz, zamansiz: catisma
        paket_yaz(pk, simdi, kaynak="ays", cihaz=TEL, bekleyen={"ays/main": 0}, profiller={"main": {"data": veri_}})
    dp = veri.Depo(os.path.join(L, "veri"))                       # deneme deposu (eski goc)
    dp.yaz("ays/main", "cards/deneme", {"front": "deneme"}, veri.hlc_yap(1, 0, "pc"), "pc")
    dp.kapat()
    with open(os.path.join(L, "veri", "kabuk-baslangic.json"), "w", encoding="utf-8") as f:
        f.write('{"lifeos_kabuk_baslangic": 1, "kimlik": "eski"}')
    with open(os.path.join(L, "ayar.json"), "w", encoding="utf-8") as f:
        f.write('{"tema": "eski"}')
    hk = os.path.join(ev, "LifeOS-Sistem", "HKM", "db")
    os.makedirs(hk)
    c = sqlite3.connect(os.path.join(hk, "hkm.db"))
    c.execute("CREATE TABLE para(id INTEGER PRIMARY KEY, tutar INTEGER)")
    c.execute("INSERT INTO para(tutar) VALUES (12)")
    c.commit()
    c.close()
    w = dict(ad=ad, L=L, agac=agac, env=env, port=portlar[0], eski=portlar[1:5], ev=portlar[5:9],
             tekkapi=os.path.join(agac, "sistem", "tekkapi.py"))
    w["ilk"] = izler(w)
    DUNYALAR.append(w)
    return w


def izler(w):
    """Dunyanin butun dosyalari: {yol: (sha, mtime)}; sahte agac haric pid dosyasi."""
    out = {}
    for kok in (w["L"], os.path.dirname(w["tekkapi"])):
        for d, _, adlar in os.walk(kok):
            for a in adlar:
                p = os.path.join(d, a)
                out[p] = (hashlib.sha256(open(p, "rb").read()).hexdigest(), os.path.getmtime(p))
    return out


def sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()


def kos(w, *arg, **ek):
    env = dict(w["env"], **ek)
    r = subprocess.run([sys.executable, KOMUT] + list(arg), env=env, capture_output=True, text=True,
                       encoding="utf-8", errors="replace", timeout=600)
    return r.returncode, r.stdout + r.stderr


def acik(p):
    try:
        socket.create_connection(("127.0.0.1", p), 0.3).close()
        return True
    except OSError:
        return False


def eski_baslat(w):
    subprocess.run([sys.executable, os.path.join(w["agac"], "sistem", "baslat.py")], env=w["env"], timeout=60,
                   stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def durdur(w):
    subprocess.run([sys.executable, os.path.join(w["agac"], "sistem", "baslat.py"), "--dur"], env=w["env"], timeout=60,
                   stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def depo_kayitlari(db):
    c = sqlite3.connect(db)
    try:
        return {r[0]: (r[1], r[2]) for r in c.execute("SELECT id, govde, kaynak FROM kayit")}
    finally:
        c.close()


def yedek_klasoru(w):
    y = os.path.join(w["L"], "yedek")
    ad = sorted(a for a in os.listdir(y) if a.startswith("tek-kapi-")) if os.path.isdir(y) else []
    return os.path.join(y, ad[-1]) if ad else None


def eski_duzen_yerinde(w, cikti, ad):
    db = os.path.join(w["L"], "veri", "lifeos.db")
    ilk = w["ilk"]
    dogru(ad + ": ETKIN satırı eski hâlinde, tekkapi.py bayt bayt aynı", sha(w["tekkapi"]) == ilk[w["tekkapi"]][0], cikti)
    dogru(ad + ": deneme deposu yerinde ve aynı", os.path.isfile(db) and sha(db) == ilk[db][0], cikti)
    hs = os.path.join(w["L"], "hesap", "hesap.db")
    dogru(ad + ": hesap.db ve paketler aynı", sha(hs) == ilk[hs][0]
          and all(sha(p) == ilk[p][0] for p in ilk if os.sep + "paket" + os.sep in p), cikti)
    ay = os.path.join(w["L"], "ayar.json")
    dogru(ad + ": PC dosyası yedekten onarıldı (ayar.json)", sha(ay) == ilk[ay][0], open(ay, encoding="utf-8").read())
    dogru(ad + ": eski düzen yeniden açık (giriş + modül kapıları)", acik(w["port"]) and all(acik(p) for p in w["eski"][:3]), cikti)
    dogru(ad + ": çıktı geri dönüşü söyler", "Geri alınıyor" in cikti and "AÇILMADI" in cikti, cikti)


try:
    print("denetle")
    w = dunya("tel-yok", telefon=False, pc_iz="yok")
    kod, out = kos(w)
    dogru("telefon paketi yoksa: Hazır değil, eksik söylenir", kod == 1 and "Karar: Hazır değil" in out
          and "telefon/tablet paketi yok" in out and "Telefon/tablet paketi: yok." in out, out)
    dogru("bu bilgisayar oturumsuz kimlikten tanınır", "bu bilgisayar (hiç oturum açmamış" in out, out)
    kod, out = kos(w, "--telefon-yok")
    dogru("--telefon-yok: Hazır, beyan açıkça yazılır", kod == 0 and "Karar: Hazır." in out
          and "başka hiçbir cihazda LifeOS verisi yok" in out and "boş başlar" in out, out)
    dogru("denetim hiçbir dosyayı değiştirmedi (sha + mtime)", izler(w) == w["ilk"])

    w = dunya("tel-var")
    dinle = socket.socket()
    dinle.bind(("127.0.0.1", w["ev"][0]))
    dinle.listen(1)
    kod, out = kos(w)
    dinle.close()
    dogru("telefon paketi varsa: Hazır, iPhone adıyla telefon sayılır", kod == 0 and "Karar: Hazır." in out
          and "telefon/tablet («iPhone»)" in out and "Telefon/tablet paketi: var" in out, out)
    dogru("ev ağı kapısı açıksa söylenir", "Ev ağı kapıları: açık (%d)" % w["ev"][0] in out, out)
    dogru("kaynak başına en yeni gönderim ve bekleyen sayısı yazılır", "sunucuya gitmemiş 2 değişiklik" in out, out)
    kod, out = kos(w, LIFEOS_TKA_PENCERE="python.exe" if os.name == "nt" else "python")
    dogru("LifeOS penceresi açıkken Hazır değil", kod == 1 and "LifeOS penceresi açık" in out, out)
    dogru("denetimler hiçbir dosyayı değiştirmedi", izler(w) == w["ilk"])

    w = dunya("pc-adsiz", pc_iz="adsiz")
    kod, out = kos(w)
    dogru("bu bilgisayar tanınamazsa «göremedim» ve ne yapılacağı söylenir", kod == 1 and "türünü göremedim" in out
          and "paketlerini tanıyamadım" in out, out)

    w = dunya("pc-eski", pc_taze=False)
    kod, out = kos(w)
    dogru("bu bilgisayarın paketi eskiyse yeniden gönder denir", kod == 1 and "dakikadan eski; yeniden gönder" in out, out)

    print("reddetme")
    w = dunya("ret", telefon=False)
    eski_baslat(w)
    kod, out = kos(w, "--ac")
    dogru("telefon paketi yokken --ac reddeder, hiçbir şeye dokunmaz", kod == 1 and "Hiçbir şey değiştirilmedi" in out
          and yedek_klasoru(w) is None and izler(w) == w["ilk"], out)
    dogru("reddederken LifeOS durdurulmadı", acik(w["port"]) and acik(w["eski"][0]))
    kod, out = kos(w, "--geri")
    dogru("tek kapı açık değilken --geri reddeder", kod == 1 and "geri alınacak bir şey yok" in out, out)
    durdur(w)

    print("başarılı geçiş ve --geri")
    w = dunya("basari")
    eski_baslat(w)
    kod, out = kos(w, "--ac")
    dogru("--ac açar (çıkış 0)", kod == 0 and "Tek kapı açıldı" in out, out)
    satir_once = open(KOK / "sistem" / "tekkapi.py", encoding="utf-8").read().splitlines()
    satir_sonra = open(w["tekkapi"], encoding="utf-8").read().splitlines()
    fark = [(a, b) for a, b in zip(satir_once, satir_sonra) if a != b]
    dogru("yalnız ETKIN satırı değişti", len(satir_once) == len(satir_sonra) and len(fark) == 1
          and fark[0][1].startswith("ETKIN = True") and fark[0][0].startswith("ETKIN = False"), fark)
    dogru("tek kapı çalışıyor, eski kapılar kapalı", acik(w["port"]) and not any(acik(p) for p in w["eski"]), out)
    yk = yedek_klasoru(w)
    m = json.load(open(os.path.join(yk, "manifest.json"), encoding="utf-8"))
    adlar = {x["ad"] for x in m["dosyalar"]}
    dogru("manifest: hesap.db, hkm.db, deneme deposu, paketler, PC dosyası ve tekkapi.py", {"hesap/hesap.db", "hkm/hkm.db",
          "veri/lifeos.db", "veri/kabuk-baslangic.json", "pc/ayar.json", "kod/tekkapi.py"} <= adlar
          and sum(a.startswith("paket/") for a in adlar) == 6, sorted(adlar))
    dogru("manifest: her kopyanın SHA-256'sı ve boyutu tutuyor, kaynağı canlı ilk hâl", all(
        sha(os.path.join(yk, *x["ad"].split("/"))) == x["sha256"] == w["ilk"].get(x["asil"], (x["sha256"],))[0]
        and os.path.getsize(os.path.join(yk, *x["ad"].split("/"))) == x["boyut"] for x in m["dosyalar"]))
    girdi = sorted(os.listdir(os.path.join(yk, "goc-girdi", "paket")))
    dogru("göçe her cihazın her kaynağının yalnız en yeni gönderimi girdi (5 paket, eski PC paketi yok)",
          len(girdi) == 5 and len(os.listdir(os.path.join(w["L"], "goc", "paket"))) == 6, girdi)
    kay = depo_kayitlari(os.path.join(w["L"], "veri", "lifeos.db"))
    dogru("tek depo: cihazın son hâli kazandı, silinen kayıt dirilmedi, telefon kaydı geldi",
          json.loads(kay["ays/main|cards/k1"][0]) == {"front": "b"} and kay["ays/main|cards/k1"][1] == "paket"
          and "ays/main|cards/eski" not in kay and "ays/main|cards/tel" in kay, sorted(kay))
    dogru("karşılaştırmadaki fark paket kuralıyla açıklandı", "1 fark; hepsi cihazın paketindeki" in out, out)
    once = [a for a in os.listdir(w["L"]) if a.startswith("veri.deneme-")]
    dogru("deneme deposu silinmedi, kenara alındı", len(once) == 1 and sha(os.path.join(w["L"], once[0], "lifeos.db"))
          == w["ilk"][os.path.join(w["L"], "veri", "lifeos.db")][0], once)
    bas = json.load(open(os.path.join(w["L"], "veri", "kabuk-baslangic.json"), encoding="utf-8"))
    dogru("kabuk başlangıç paketi yeni depodan üretildi", bas.get("lifeos_kabuk_baslangic") == 1 and bas.get("kimlik") != "eski", bas)
    dur = json.load(open(os.path.join(yk, "durum.json"), encoding="utf-8"))
    dogru("durum.json: tamam, göç kimliği yazılı", dur["tamam"] and dur["goc_id"], dur)
    dogru("çıktı sahibin göreceğini söyler", "Sahibin göreceği" in out and "--geri" in out and "uzak.py --ac" in out, out)
    kod, out = kos(w, "--ac")
    dogru("açıkken ikinci --ac reddeder", kod == 1 and "tek kapı zaten açık" in out, out)

    kod, out = kos(w, "--geri")
    dogru("--geri eski düzene döner", kod == 0 and "Eski düzen geri geldi" in out, out)
    dogru("--geri: tekkapi.py ilk hâlinde", sha(w["tekkapi"]) == w["ilk"][w["tekkapi"]][0])
    dogru("--geri: deneme deposu yerinde, tek kapı deposu silinmedi", sha(os.path.join(w["L"], "veri", "lifeos.db"))
          == w["ilk"][os.path.join(w["L"], "veri", "lifeos.db")][0]
          and len([a for a in os.listdir(w["L"]) if a.startswith("veri.tek-kapi-")]) == 1)
    dogru("--geri: eski kapılar açık", acik(w["port"]) and all(acik(p) for p in w["eski"][:3]))
    dogru("--geri: hesap.db yedekten geri konmadığını söyler", "geri KONMADI" in out, out)
    kod, out = kos(w, "--geri")
    dogru("ikinci --geri reddeder", kod == 1, out)
    durdur(w)

    print("her adımda zorlanmış hata → geri dönüş")
    for adim in ("LifeOS durdu", "Yedek alındı", "Göç yapıldı", "Kabuk başlangıç paketi", "Karşılaştırma temiz",
                 "ETKIN = True", "LifeOS açıldı", "Doğrulandı"):
        w = dunya("hata-%d" % len(DUNYALAR))
        eski_baslat(w)
        kod, out = kos(w, "--ac", LIFEOS_TKA_TEST_HATA=adim)
        dogru("«%s» bozulunca çıkış 1" % adim, kod == 1 and "✕ %s" % adim in out, out)
        eski_duzen_yerinde(w, out, adim)
        durdur(w)

    print("doğal hatalar")
    for ad, ek, beklenen in (("sunucu doğrulanmaz", {"LIFEOS_TKA_SAHTE": "dogrula"}, "✕ Doğrulandı"),
                             ("tek kapı açılışta çöker", {"LIFEOS_TKA_SAHTE": "baslat"}, "✕ LifeOS açıldı"),
                             ("başlangıç aracı çöker", {"LIFEOS_TKA_SAHTE": "baslangic"}, "✕ Kabuk başlangıç paketi"),
                             ("LifeOS durmaz", {"LIFEOS_TKA_SAHTE": "dur"}, "✕ LifeOS durdu")):
        w = dunya("dogal-%d" % len(DUNYALAR))
        w["env"].update(ek)
        eski_baslat(w)
        kod, out = kos(w, "--ac")
        dogru(ad + ": durur", kod == 1 and beklenen in out, out)
        eski_duzen_yerinde(w, out, ad)
        w["env"].pop("LIFEOS_TKA_SAHTE")
        durdur(w)
    w = dunya("cakisma", cakisma=True)
    eski_baslat(w)
    kod, out = kos(w, "--ac")
    dogru("çatışmalı veri: göç yazmaz, geri döner", kod == 1 and "✕ Göç yapıldı" in out and "çatışma var" in out, out)
    eski_duzen_yerinde(w, out, "çatışma")
    durdur(w)
finally:
    for w in DUNYALAR:
        w["env"].pop("LIFEOS_TKA_SAHTE", None)
        try:
            durdur(w)
        except Exception:
            pass
    shutil.rmtree(TMP, ignore_errors=True)

print("\n%d/%d geçti" % (gecen, gecen + kirmizi))
sys.exit(1 if kirmizi else 0)
