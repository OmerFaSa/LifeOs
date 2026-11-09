"""King-Bench: King'in gerçek kullanımdaki verimini ölçen seviyeli benchmark (modül testlerinden ayrı).

Modül testleri (AYS/SPİ/ESP runtests, HKM tests) kodun DOĞRU çalıştığını sınar; King-Bench ise
bir kullanıcının King'den ne kadar İŞ aldığını ölçer: 233 günlük klon simülasyonunun donmuş verisi
üzerinde, gerçek tarayıcıda, gerçek HKM ve yerel modelle, kullanıcının cümleleriyle.

  python tools/king_bench/bench.py                 # sıradaki seviye (durum.json)
  python tools/king_bench/bench.py --seviye 2      # belli bir seviye
  python tools/king_bench/bench.py --sadece A02,E01
  python tools/king_bench/bench.py --durum         # seviye geçmişi

Seviyeler (seviye-N.json): bir seviyede %85 ve üstü alınınca sonraki koşu bir üst seviyeye geçer
(%10'u kovalamak yerine daha zor bir ölçüt). Üst seviye yoksa yenisini yazma zamanıdır.

Her koşu: VERI/taban (donmuş hkm.db + tarayıcı profili) → VERI/is kopyalanır, HKM 4290 + modüller
4281-4283 + Ollama açılır, bench.js koşar, hepsi kapanır (8 GB RAM: tek başına koşturun). Sonra
oz.py öz-değerlendirmeyi yazar: eksikler / düzeltilebilir / «şu olsa hayatta daha iyi etki eder mi».

VERI: ortam değişkeni KING_BENCH_VERI ya da C:\\Users\\ASUS\\LifeOS-KingBench (depo dışında; kullanıcının
gerçek verisine ve LifeOS-Sistem'e dokunulmaz).
"""
import datetime, json, os, shutil, subprocess, sys, time, urllib.request

BU = os.path.dirname(os.path.abspath(__file__))
KOK = os.path.dirname(os.path.dirname(BU))
VERI = os.environ.get("KING_BENCH_VERI") or r"C:\Users\ASUS\LifeOS-KingBench"
TABAN, IS = os.path.join(VERI, "taban"), os.path.join(VERI, "is")
DURUM = os.path.join(VERI, "durum.json")
MODUL = {"AYS": 4281, "SPI": 4282, "ESP": 4283}
OLLAMA = os.path.expandvars(r"%LOCALAPPDATA%\Programs\Ollama\ollama.exe")
GIZLI = 0x08000000
ESIK = 0.85


def acik(url):
    try:
        urllib.request.urlopen(url, timeout=2).read()
        return True
    except Exception:
        return False


def bekle(url, n=80):
    for _ in range(n):
        if acik(url):
            return True
        time.sleep(0.5)
    return False


def durum_oku():
    return json.load(open(DURUM, encoding="utf-8")) if os.path.exists(DURUM) else {"seviye": 1, "gecmis": []}


def seviyeler():
    return sorted(int(f[7:-5]) for f in os.listdir(BU) if f.startswith("seviye-") and f.endswith(".json"))


def kos(seviye, etiket, ek):
    shutil.rmtree(IS, ignore_errors=True)
    shutil.copytree(TABAN, IS)
    cfg = json.load(open(os.path.join(VERI, "config.json"), encoding="utf-8"))
    cfg["db_path"] = os.path.join(IS, "hkm.db")
    json.dump(cfg, open(os.path.join(IS, "config.json"), "w", encoding="utf-8"), indent=1)
    pids = []
    try:
        if not acik("http://127.0.0.1:11434/api/tags"):
            subprocess.Popen([OLLAMA, "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=GIZLI)
            bekle("http://127.0.0.1:11434/api/tags")
        env = dict(os.environ, HKM_CONFIG=os.path.join(IS, "config.json"), PYTHONIOENCODING="utf-8", SIM_GUN="2026-11-09")
        log = open(os.path.join(IS, "hkm.log"), "a", encoding="utf-8")
        pids.append(subprocess.Popen([sys.executable, os.path.join(BU, "sim_hkm.py")], cwd=os.path.join(KOK, "HKM"),
                                     env=env, stdout=log, stderr=log, creationflags=GIZLI).pid)
        for m, p in MODUL.items():
            pids.append(subprocess.Popen([sys.executable, os.path.join(KOK, m, "devserver.py"), str(p)], cwd=os.path.join(KOK, m),
                                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=GIZLI).pid)
        if not (bekle("http://127.0.0.1:4290/api/health") and all(bekle("http://127.0.0.1:%d/index.html" % p) for p in MODUL.values())):
            sys.exit("sunucular acilmadi")
        return subprocess.run(["node", os.path.join(BU, "bench.js"), etiket, os.path.join(BU, "seviye-%d.json" % seviye), VERI] + ek).returncode
    finally:
        for pid in pids:
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(pid)], capture_output=True)
        for ad in ("ollama.exe", "ollama app.exe"):
            subprocess.run(["taskkill", "/F", "/IM", ad], capture_output=True)


def main():
    a = sys.argv[1:]
    d = durum_oku()
    if "--durum" in a:
        print(json.dumps(d, ensure_ascii=False, indent=1))
        return
    seviye = int(a[a.index("--seviye") + 1]) if "--seviye" in a else d["seviye"]
    ek = a[a.index("--sadece"):a.index("--sadece") + 2] if "--sadece" in a else []
    etiket = "s%d-%s" % (seviye, datetime.datetime.now().strftime("%Y%m%d-%H%M"))
    if not os.path.isdir(TABAN):
        sys.exit("taban yok: %s (klon simülasyonunun donmuş verisi)" % TABAN)
    kod = kos(seviye, etiket, ek)
    sonuc = os.path.join(VERI, "sonuc", "bench-%s.json" % etiket)
    if kod or not os.path.exists(sonuc):
        sys.exit("bench.js kod %s" % kod)
    R = json.load(open(sonuc, encoding="utf-8"))
    oran = sum(s["gecti"] for s in R) / len(R)
    once = [g for g in d["gecmis"] if g["seviye"] == seviye and not g.get("kismi")]
    onceki = [os.path.join(VERI, "sonuc", "bench-%s.json" % once[-1]["etiket"])] if once else []
    subprocess.run([sys.executable, os.path.join(BU, "oz.py"), sonuc] + onceki)
    d["gecmis"].append({"etiket": etiket, "seviye": seviye, "puan": round(oran * 100), "n": len(R), "kismi": bool(ek)})
    if not ek and seviye == d["seviye"] and oran >= ESIK:
        ust = [s for s in seviyeler() if s > seviye]
        if ust:
            d["seviye"] = ust[0]
            print("Seviye %d %%%d ≥ %%%d: sonraki koşu seviye %d." % (seviye, round(oran * 100), round(ESIK * 100), ust[0]))
        else:
            print("Seviye %d %%%d: en üst seviye; daha zor bir seviye-%d.json yazma zamanı." % (seviye, round(oran * 100), seviye + 1))
    json.dump(d, open(DURUM, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
