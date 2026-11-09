"""King-Bench: King'in ve sistemin gerçek kullanımdaki verimini ölçen benchmark (modül testlerinden ayrı).

Modül testleri (AYS/SPİ/ESP runtests, HKM tests) kodun DOĞRU çalıştığını sınar; King-Bench bir insanın
King ve LifeOS ile ne kadar iş çıkardığını ölçer: 233 günlük klon simülasyonunun donmuş verisi üzerinde,
gerçek tarayıcıda, gerçek Merkez (HKM) ve yerel modelle, kullanıcının kendi cümleleriyle.

Yedi paket (paket/*.json), her biri ayrı bir alan:
  kayit    Veri girişi       tek cümleden doğru miktar, doğru GÜN, doğru modül
  icgoru   İçgörü            sayısal cevap GERÇEK değerle; aynı soru farklı söylenişte aynı sayı; «neden»
  ogrenme  Öğrenme           anlatım, soru döngüsü, yanlışın açıklaması, unutma eğrisi, öğrenme özeti
  plan     Organizasyon      plan onaysız değişmez, mola günleri sorulur, hatırlatma, ilaç takibi
  guven    Güven/güvenlik    acil, kriz, ilaç/tahlil sınırı, talimat enjeksiyonu, gizlilik, silme
  diyalog  Diyalog           düzeltme, «aslında», geri al, eksik cümle, hafıza
  kocluk   Koçluk            haftalık değerlendirme, uyku borcu, hedef sapması, motivasyon
  gun      Gerçek gün        bir günün tamamı üç modülde yaşanır; gün sonunda veri TAM değerle denetlenir
  dayaniklilik Dayanıklılık  büyük harf, harfsiz yazım, ses dökümü, emoji, uzun mesaj, yanıltıcı zaman

Her vakanın zorluğu 1–3; paket puanı zorluk ağırlıklıdır (zor vaka 3 kat sayılır). King puanı = paket
puanlarının ortalaması. Bir paket her zorlukta %90'ı geçince öz-değerlendirme «sertleştir» der: o pakete
daha zor vakalar yazma zamanıdır (kolay %10'u kovalamak yerine ölçütü yükselt).

  python tools/king_bench/bench.py                       # bütün paketler
  python tools/king_bench/bench.py --paket guven,kocluk  # seçili paketler
  python tools/king_bench/bench.py --sadece K-01,K-02    # tek vakalar
  python tools/king_bench/bench.py --durum               # geçmiş

Her koşu: VERI/taban (donmuş hkm.db + tarayıcı profili) → VERI/is, HKM 4290 + modüller 4281-4283 + Ollama
açılır, bench.js koşar, hepsi kapanır (8 GB RAM: tek başına koşturun; ~8 dk). Sonra oz.py öz-değerlendirmeyi
yazar. VERI: KING_BENCH_VERI ya da C:\\Users\\ASUS\\LifeOS-KingBench (depo dışı; gerçek veriye dokunulmaz).
"""
import datetime, json, os, shutil, subprocess, sys, time, urllib.request

BU = os.path.dirname(os.path.abspath(__file__))
KOK = os.path.dirname(os.path.dirname(BU))
VERI = os.environ.get("KING_BENCH_VERI") or r"C:\Users\ASUS\LifeOS-KingBench"
TABAN, IS = os.path.join(VERI, "taban"), os.path.join(VERI, "is")
DURUM = os.path.join(VERI, "durum.json")
SIRA = ["kayit", "icgoru", "ogrenme", "plan", "guven", "diyalog", "kocluk", "gun", "dayaniklilik", "ogretmen", "hafiza", "gorsel"]
MODUL = {"AYS": 4281, "SPI": 4282, "ESP": 4283}
OLLAMA = os.path.expandvars(r"%LOCALAPPDATA%\Programs\Ollama\ollama.exe")
GIZLI = 0x08000000


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


def senaryo(secili):
    """Paketlerden tek senaryo: ziyaretler paket sırasıyla, her ziyaret paket adını taşır."""
    out = []
    for p in SIRA:
        if secili and p not in secili:
            continue
        for z in json.load(open(os.path.join(BU, "paket", p + ".json"), encoding="utf-8"))["ziyaret"]:
            out.append(dict(z, paket=p))
    return out


def kos(etiket, sen, ek):
    shutil.rmtree(IS, ignore_errors=True)
    shutil.copytree(TABAN, IS)
    cfg = json.load(open(os.path.join(VERI, "config.json"), encoding="utf-8"))
    cfg["db_path"] = os.path.join(IS, "hkm.db")
    json.dump(cfg, open(os.path.join(IS, "config.json"), "w", encoding="utf-8"), indent=1)
    yol = os.path.join(IS, "senaryo.json")
    json.dump(sen, open(yol, "w", encoding="utf-8"), ensure_ascii=False)
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
        return subprocess.run(["node", os.path.join(BU, "bench.js"), etiket, yol, VERI] + ek).returncode
    finally:
        for pid in pids:
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(pid)], capture_output=True)
        for ad in ("ollama.exe", "ollama app.exe"):
            subprocess.run(["taskkill", "/F", "/IM", ad], capture_output=True)


def puan(l):
    t = sum(s.get("zor", 1) for s in l)
    return round(100 * sum(s.get("zor", 1) for s in l if s["gecti"]) / t) if t else None


def main():
    a = sys.argv[1:]
    d = json.load(open(DURUM, encoding="utf-8")) if os.path.exists(DURUM) else {"gecmis": []}
    if "--durum" in a:
        for g in d["gecmis"][-12:]:
            print(g.get("etiket"), g.get("king", g.get("puan")), g.get("paketler", ""))
        return
    secili = a[a.index("--paket") + 1].split(",") if "--paket" in a else None
    ek = a[a.index("--sadece"):a.index("--sadece") + 2] if "--sadece" in a else []
    etiket = "v2-" + datetime.datetime.now().strftime("%Y%m%d-%H%M")
    if not os.path.isdir(TABAN):
        sys.exit("taban yok: %s (klon simülasyonunun donmuş verisi)" % TABAN)
    kod = kos(etiket, senaryo(secili), ek)
    sonuc = os.path.join(VERI, "sonuc", "bench-%s.json" % etiket)
    if kod or not os.path.exists(sonuc):
        sys.exit("bench.js kod %s" % kod)
    R = json.load(open(sonuc, encoding="utf-8"))
    paketler = {p: puan([s for s in R if s.get("paket") == p]) for p in SIRA if any(s.get("paket") == p for s in R)}
    once = [g for g in d["gecmis"] if g.get("paketler") and not g.get("kismi")]
    onceki = [os.path.join(VERI, "sonuc", "bench-%s.json" % once[-1]["etiket"])] if once else []
    subprocess.run([sys.executable, os.path.join(BU, "oz.py"), sonuc] + onceki)
    d["gecmis"].append({"etiket": etiket, "king": round(sum(paketler.values()) / len(paketler)), "paketler": paketler,
                        "n": len(R), "kismi": bool(ek or secili)})
    json.dump(d, open(DURUM, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
