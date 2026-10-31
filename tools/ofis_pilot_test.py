#!/usr/bin/env python3
"""tools/ofis_pilot.py ve tools/ofis_test.py testi: pilotun karar tablosu, gunluk ve paralel sinir,
kota dususu, olcum ozeti, Testci'nin kilidi ve tablosu, bir pilot turunun yan etkileri (sahte ajanlarla).
python3 tools/ofis_pilot_test.py"""
import json
import sys
import tempfile
import time
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KOK / "tools"))
import ajan as A  # noqa: E402
import ofis_pilot as P  # noqa: E402
import ofis_test as T  # noqa: E402

hata = []
S = 1_000_000


def esit(ad, gercek, beklenen):
    if gercek != beklenen:
        hata.append("%s: %r != %r" % (ad, gercek, beklenen))


def is_(asama="inceleme", son=S - 100, efor="orta", **k):
    return dict({"ad": "007", "tur": "gorev", "asama": asama, "efor": efor, "model": A.EFOR[efor], "dal": "ag/007-x",
                 "canli": {"son_degisim": son, "hal": "turu bitti", "son_adimlar": []}, "denetim": "d-007"}, **k)


def dn(asama="inceleme", karar=("temiz", 0), commit="c1", cevap="KARAR: temiz\nDENEME: python -c x -> 1"):
    return {"asama": asama, "commit": commit, "canli": {"karar": karar, "cevap": cevap}}


def test(commit="c1", durum="bitti", **sonuc):
    l = [{"modul": "AYS", "ad": ad, "kod": {"yeşil": 0, "kırmızı": 1, "koşulamadı": 2}[r], "sonuc": r, "log": "x.log", "son": ["satir"], "sure": 5}
         for ad, r in sonuc.items()]
    return {"commit": commit, "durum": durum, "adimlar": l}


def o(**k):
    return dict({"commit": "c1", "teslim": True, "gorev_durum": "bitti", "test": test(smoke="yeşil"),
                 "denetci_mesgul": False, "test_mesgul": False, "simdi": S}, **k)


# ---------- karar tablosu: her satir bir durum ve beklenen ilk kelime ----------
kota = {"son_degisim": S, "hal": "hata", "son_adimlar": [{"tur": "hata", "metin": "429 RESOURCE_EXHAUSTED: quota"}]}
for ad, args, beklenen in (
        ("calisiyor", (is_("çalışıyor"), None, {}, o()), "bekle"),
        ("kapandi", (is_("kapandı"), None, {}, o()), "birak"),
        ("sorun", (is_("sorun"), None, {}, o()), "birak"),
        ("kota orta->dusuk", (is_("sorun", canli=kota), None, {}, o()), "kota"),
        ("kota bir kez", (is_("sorun", canli=kota), None, {"dusuruldu": "flash→flash_lite"}, o()), "birak"),
        ("kota alt model yok", (is_("sorun", efor="dusuk", canli=kota), None, {}, o()), "birak"),
        ("eski kota hatasi gecti", (is_("çalışıyor", canli=dict(kota, hal="çalışıyor")), None, {}, o()), "bekle"),
        ("teslim bekleniyor", (is_(son=S - 60), None, {}, o(teslim=False)), "bekle"),
        ("teslim yok 5 dk", (is_(son=S - 400), None, {}, o(teslim=False)), "birak"),
        ("takildi", (is_(), None, {}, o(teslim=False, gorev_durum="takıldı")), "hazir"),
        ("denetci yok", (is_(denetim=None), None, {}, o()), "gozden"),
        ("kanca denetci aciyor", (is_(denetim="istendi", son=S - 30), None, {}, o()), "bekle"),
        ("denetci mesgul", (is_(denetim=None), None, {}, o(denetci_mesgul=True)), "bekle"),
        ("eski commit denetlendi", (is_(), dn(commit="c0"), {}, o()), "gozden"),
        ("denetci inceliyor", (is_(), dn("çalışıyor"), {}, o()), "bekle"),
        ("denetci hata", (is_(), dn("sorun"), {}, o()), "birak"),
        ("bulgu tur 1", (is_(), dn(karar=("bulgu", 2)), {}, o()), "duzelt"),
        ("bulgu tur bitti -> test", (is_(), dn(karar=("bulgu", 1)), {"tur": 2}, o(test=None)), "test"),
        ("mesaj sonrasi bekle", (is_(son=S - 50), dn(), {"mesaj_t": S - 40, "mesaj_commit": "c0"}, o()), "bekle"),
        ("mesaja tepki yok", (is_(son=S - 2000), dn(), {"mesaj_t": S - 1000, "mesaj_commit": "c0"}, o()), "birak"),
        ("duzeltme commit yok", (is_(son=S - 10), dn(), {"mesaj_t": S - 40, "mesaj_commit": "c1"}, o()), "hazir"),
        ("temiz test yok", (is_(), dn(), {}, o(test=None)), "test"),
        ("test eski commit", (is_(), dn(), {}, o(test=test("c0", smoke="yeşil"))), "test"),
        ("test kosuyor", (is_(), dn(), {"test_istek": {"c1": 1}, "test_t": S - 60}, o(test=test(durum="koşuyor"))), "bekle"),
        ("test kilit", (is_(), dn(), {}, o(test=None, test_mesgul=True)), "bekle"),
        ("test uc kez sonucsuz", (is_(), dn(), {"test_istek": {"c1": 3}, "test_t": S - 900}, o(test=None)), "birak"),
        ("test kirmizi", (is_(), dn(), {}, o(test=test(smoke="kırmızı"))), "test_duzelt"),
        ("test kirmizi tur bitti", (is_(), dn(), {"test_tur": 1}, o(test=test(smoke="kırmızı"))), "hazir"),
        ("kosulamadi tekrar", (is_(), dn(), {"test_istek": {"c1": 1}, "test_t": S - 400}, o(test=test(smoke="koşulamadı"))), "test"),
        ("kosulamadi 3 kez", (is_(), dn(), {"test_istek": {"c1": 3}, "test_t": S - 400}, o(test=test(smoke="koşulamadı"))), "hazir"),
        ("cakisma", (is_(), dn(), {}, o(test=dict(test(), durum="çakışma"))), "hazir"),
        ("kabul testi degisti", (is_(), None, {}, o(kabul_degisti=["tools/k_test.py"])), "hazir"),
        ("sonuc eksik", (is_(), None, {}, o(sonuc_eksik=["Açık kalan"])), "bicim"),
        ("sonuc eksik bir kez", (is_(), None, {"bicim_tur": 1}, o(sonuc_eksik=["Açık kalan"])), "gozden"),
        ("denemesiz temiz", (is_(), dn(cevap="KARAR: temiz"), {}, o()), "deneme"),
        ("deneme istendi", (is_(), dn(cevap="KARAR: temiz"), {"deneme_istendi": True}, o()), "hazir"),
        ("hepsi yesil", (is_(), dn(), {}, o()), "hazir")):
    esit("adim " + ad, P.adim(*args)[0], beklenen)
esit("hazir cumlesi", P.adim(is_(), dn(), {"tur": 1}, o())[1], "Denetçi temiz (1 tur) · Testçi 1 yeşil, 0 kırmızı, 0 koşulamadı")
esit("kota yeni model", P.adim(is_("sorun", efor="yuksek", canli=kota), None, {}, o())[1], "kota hatası: flash ile yeniden")
if P.kota_hatasi({"son_adimlar": [{"tur": "model", "metin": "quota hakkinda konustuk"}]}):
    hata.append("model metnindeki kelime kota hatasi sayilmamali")

# ---------- sinirlar ----------
bugun = time.time()
k = [{"eylem": "baslat", "t": bugun}, {"eylem": "baslat", "t": bugun - 3 * 86400}, {"eylem": "gozden", "t": bugun}]
esit("bugun baslatilan", P.bugun_baslatilan(k, bugun), 1)
esit("paralel sinir", P.baslatilacaklar(["005", "006", "007", "008"], {"001": {}, "002": {"hazir": True}}, {}, 0), ["005", "006"])
esit("gunluk sinir", P.baslatilacaklar(["005", "006"], {}, {}, P.GUNLUK - 1), ["005"])
esit("gunluk dolu", P.baslatilacaklar(["005"], {}, {}, P.GUNLUK), [])
esit("acilmis gorev yeniden baslatilmaz", P.baslatilacaklar(["003", "005"], {}, {"003": {}}, 0), ["005"])

# ---------- mesajlar ----------
m = P.duzelt_metni(1, "KARAR: 1 bulgu\nx.py:3 · yanlis")
if "tur 1/2" not in m or "x.py:3" not in m or "önce onu yakalayan testi" not in m:
    hata.append("duzelt metni: " + m)
m = P.test_duzelt_metni(test(smoke="kırmızı", a11ycheck="yeşil"), {"AYS": 4711})
if "AYS smoke · çıkış 1 · ham çıktı: x.log" not in m or "a11ycheck" in m or "node tools/smoke.js 4711" not in m:
    hata.append("test duzelt metni: " + m)

# ---------- olcum ----------
oz = P.olcum_ozet([{"model": "flash", "ilk_karar": "temiz", "sure": 600, "token": {"giris": 1000, "cikis": 200}, "tur": 0},
                   {"model": "flash", "ilk_karar": "bulgu", "sure": 1200, "token": {"giris": 3000, "cikis": 0}, "tur": 2},
                   {"model": "pro", "ilk_karar": "temiz", "sure": 60}])
esit("olcum flash", {k: oz["flash"][k] for k in ("is", "ilk_temiz", "oran", "ort_sure", "ort_token", "ort_tur")},
     {"is": 2, "ilk_temiz": 1, "oran": 0.5, "ort_sure": 900, "ort_token": 2100, "ort_tur": 1.0})
esit("olcum pro", oz["pro"]["oran"], 1.0)
oz = P.olcum_ozet([{"no": "1", "model": "flash", "ilk_karar": "temiz"}, {"no": "2", "model": "flash", "ilk_karar": "temiz"},
                   {"no": "1", "son": "bulgu", "ders": "x"}, {"no": "2", "son": "temiz"}])
esit("olcum son inceleme", {k: oz["flash"][k] for k in ("is", "son", "son_temiz")}, {"is": 2, "son": 2, "son_temiz": 1})

# ---------- Sonuc bicimi ----------
tam = "# x\n## Sonuç\n<!-- a -->\n- **Ne değişti:** a\n  - `b`\n- **Koşan testler:** `python t.py` -> temiz\n- **Kabul testi:** yeşil\n- **Açık kalan:** yok\n"
esit("sonuc tam", P.sonuc_eksik(tam), [])
esit("sonuc bos alan", P.sonuc_eksik(tam.replace("yeşil", "")), ["Kabul testi"])
esit("sonuc sablon", P.sonuc_eksik((KOK / "belgeler/ekip/gorevler/_SABLON.md").read_text(encoding="utf-8")), list(A.SONUC_ALAN))
esit("sonuc yok", P.sonuc_eksik("# x\n**Kabul testi:** `a`"), list(A.SONUC_ALAN))
if "Açık kalan" not in P.bicim_metni(["Açık kalan"]) or "push" not in P.bicim_metni(["x"]):
    hata.append("bicim metni eksik alani ve push'u soylemeli")

# ---------- Testci ----------
ad = [(m_, a) for m_, a, _, _ in T.adimlar("py")]
if ad[:3] != [("AYS", "derle"), ("SPI", "derle"), ("ESP", "derle")] or ad[-1] != ("kök", "entegre") or len(ad) != 3 + 3 * len(T.DENETIM) + 1:
    hata.append("testci adim sirasi: %r" % ad)
k_ad = T.adimlar("py", ["tools/k_test.py", "AYS/x.test.js"])
if k_ad[0][:2] != ("kök", "kabul") or k_ad[0][2][-1] != "tools/k_test.py" or "AYS/x.test.js" in k_ad[0][2] or len(k_ad) != len(ad) + 1:
    hata.append("testci kabul adimi once ve yalniz .py: %r" % (k_ad[0],))
for den in ("runtests", "smoke", "a11ycheck", "layoutcheck", "palettecheck", "perfcheck"):
    if not (KOK / "AYS" / "tools" / (den + ".js")).exists():
        hata.append("AGENTS.md denetimi yok: " + den)
esit("sonuc adi", [T.sonuc_adi(k) for k in (0, 1, 2, -1)], ["yeşil", "kırmızı", "koşulamadı", "kırmızı"])
esit("son satirlar", T.son_satirlar("a\r\n\n b\nc\n", 2), [" b", "c"])
tb = T.tablo({"no": "007", "dal": "ag/007-x", "commit": "c1", "main": "m1", "durum": "bitti", "baslangic": 1, "bitis": 121,
              "adimlar": test(smoke="kırmızı", a11ycheck="yeşil", perfcheck="koşulamadı")["adimlar"]})
if "✗ AYS  smoke" not in tb or "✓ AYS  a11ycheck" not in tb or "== AYS smoke (kırmızı) · x.log" not in tb or "2 dk" not in tb \
        or "== AYS a11ycheck" in tb or "== AYS perfcheck (koşulamadı)" not in tb:
    hata.append("testci tablosu:\n" + tb)
if "main ile birleşmiyor" not in T.tablo({"no": "1", "dal": "d", "commit": "c", "durum": "çakışma", "birlesme": "CONFLICT", "adimlar": []}):
    hata.append("cakisma tabloda gorunmeli")

# ---------- gecici klasorde: kilit, pilot turu (sahte ajanlarla) ----------
with tempfile.TemporaryDirectory() as t:
    A.AJAN_KLASOR = Path(t)
    A.DURUM_DOSYA = A.AJAN_KLASOR / "ajanlar.json"
    if not T.kilit_al("007") or T.kilit_al("008") or T.kilit_sahibi()["no"] != "007":
        hata.append("Testci ayni anda tek kosu olmali")
    T.kilit_birak()
    (T.klasor() / "kilit").write_text(json.dumps({"no": "eski", "t": 1}), encoding="utf-8")
    if not T.kilit_al("009"):
        hata.append("eskimis kilit kirilmali")
    T.kilit_birak()

    # guvenlik: kanca yoksa ya da Antigravity kapaliysa tur durur, hicbir sey baslatmaz
    eski = {n: getattr(A, n) for n in ("kanca_kurulu", "sunucu", "hepsi", "baslat", "gozden", "mesaj", "git", "oku_durum")}
    eski_p = {n: getattr(P, n) for n in ("bekleyen_gorevler", "ayrik", "_teslim", "gorev_durumu", "gorev_efor", "gorev_sonuc_eksik")}
    cagri = []
    A.kanca_kurulu = lambda: False
    esit("kanca yok", P.tur({}), "koruma kancası kurulu değil")
    A.kanca_kurulu, A.sunucu = (lambda: True), (lambda: None)
    esit("antigravity kapali", P.tur({}), "Antigravity kapalı")

    # bir tur: 005 baslar; 007'de Denetci 1 bulgu -> duzeltme mesaji; 008 temiz + yesil -> hazir, olcum yazilir
    A.sunucu = lambda: ("exe", {})
    P.bekleyen_gorevler = lambda: ["005"]
    P.gorev_efor = lambda no: "orta"
    A.oku_durum = lambda: {"007": {"model": "flash"}, "008": {"model": "flash"}}
    A.baslat = lambda no, efor=None, ek="", yeni=False: cagri.append(("baslat", no, yeni))
    A.mesaj = lambda no, metin: cagri.append(("mesaj", no, metin[:22]))
    A.gozden = lambda no, efor=None, yeni=False: cagri.append(("gozden", no))
    A.git = lambda *a, **k: "c1"
    P._teslim = lambda x: True
    P.gorev_durumu = lambda x: "bitti"
    P.gorev_sonuc_eksik = lambda x: []
    P.ayrik = lambda argv: cagri.append(("ayrik", argv[-1]))
    A.hepsi = lambda: [dict(is_(), ad="007", denetim="d-007"), dict(dn(karar=("bulgu", 1)), ad="d-007", tur="denetim"),
                       dict(is_(), ad="008", denetim="d-008"), dict(dn(), ad="d-008", tur="denetim")]
    (T.klasor("008")).mkdir(parents=True)
    (T.klasor("008") / "ozet.json").write_text(json.dumps(test(smoke="yeşil")), encoding="utf-8")
    p = {"007": {"baslangic": 1}, "008": {"baslangic": 1}}
    esit("tur sonucu", P.tur(p), None)
    esit("tur cagrilari", cagri, [("baslat", "005", True), ("mesaj", "007", "Denetçi bulgusu (tur 1")])
    esit("007 durumu", (p["007"]["tur"], p["007"]["ilk_karar"], p["007"]["mesaj_commit"]), (1, "bulgu", "c1"))
    esit("008 hazir", (p["008"]["hazir"], p["008"]["ilk_karar"]), (True, "temiz"))
    ol = P.jsonl_oku("olcum.jsonl")
    if len(ol) != 1 or ol[0]["no"] != "008" or ol[0]["model"] != "flash" or ol[0]["ilk_karar"] != "temiz":
        hata.append("olcum satiri: %r" % ol)
    if [k["eylem"] for k in P.jsonl_oku("pilot.jsonl")] != ["baslat", "duzelt", "hazir"]:
        hata.append("pilot.jsonl: %r" % P.jsonl_oku("pilot.jsonl"))
    if not P.jsonl_oku("bildirim.jsonl"):
        hata.append("hazir is bildirime dusmeli")
    # ikinci tur: ayni durum tekrar mesaj gondermez (cevap bekleniyor), bekle kaydi bir kez yazilir
    cagri.clear()
    P.bekleyen_gorevler = lambda: []
    P.tur(p)
    P.tur(p)
    if any(c[0] == "mesaj" for c in cagri) or [k["eylem"] for k in P.jsonl_oku("pilot.jsonl")].count("bekle") != 1:
        hata.append("mesaj sonrasi tekrar gonderilmemeli, bekle bir kez yazilmali: %r" % cagri)
    # ajan.py hata verirse is birakilir, pilot durmaz
    A.hepsi = lambda: [dict(is_(), ad="009", denetim=None)]
    A.gozden = lambda *a, **k: (_ for _ in ()).throw(SystemExit("Antigravity yanıtı: x"))
    p = {"009": {}}
    esit("hata sonrasi tur", P.tur(p), None)
    if not p["009"].get("hazir") or "gozden başarısız" not in p["009"]["sonuc"]:
        hata.append("basarisiz eylem isi birakmali: %r" % p["009"])
    for n, f in eski.items():
        setattr(A, n, f)
    for n, f in eski_p.items():
        setattr(P, n, f)
    # ozet: canli degil, son kararlar 'bekle' icermez
    oz = P.ozet()
    if oz["canli"] or any(k["eylem"] == "bekle" for k in oz["kararlar"]) or oz["bugun"] != 1:
        hata.append("ozet: %r" % {k: oz[k] for k in ("canli", "bugun")})
    (A.AJAN_KLASOR / "pilot.nabiz").write_text(json.dumps({"t": int(time.time())}), encoding="utf-8")
    if not P.canli_mi() or P.canli_mi(time.time() + 10 * P.TUR_SN):
        hata.append("nabiz: taze canli, eski degil")

    # ---------- is istekleri ----------
    # dosya yoksa bos liste
    esit("istekler dosya yok", P.istekler(), [])

    # dosya: 1 gecerli yeni, 1 bozuk json, 1 gecerli planlandi, 1 bos satir, 1 gecerli yeni (uzun metin)
    istek_dosyasi = P.yol("istekler.jsonl")
    uzun_metin = "X" * 150
    istek_icerik = (
        '{"metin": "İstek 1", "durum": "yeni", "t": 1700000000}\n'
        'bu bir bozuk json satiridir\n'
        '{"metin": "İstek 3", "durum": "planlandı", "gorev": "001", "t": 1700000100}\n'
        '\n'
        '{"metin": "%s", "durum": "yeni", "t": 1700000200}\n' % uzun_metin
    )
    istek_dosyasi.write_text(istek_icerik, encoding="utf-8")

    ist = P.istekler()
    esit("istek sayisi", len(ist), 3)
    esit("istek siralar", [x["sira"] for x in ist], [1, 3, 5])
    esit("istek metinler", [x["metin"] for x in ist], ["İstek 1", "İstek 3", uzun_metin])

    # istek_isle: 5. sirayi planlandi yap
    P.istek_isle(5, "006")
    ist_sonra = P.istekler()
    esit("5 planlandi", (ist_sonra[-1]["durum"], ist_sonra[-1].get("gorev")), ("planlandı", "006"))

    # obur satirlar (bozuk olan dahil) bayt bayt ayni kalmali
    yeni_satirlar = istek_dosyasi.read_text(encoding="utf-8").splitlines(keepends=True)
    esit("1. satir ayni", yeni_satirlar[0], '{"metin": "İstek 1", "durum": "yeni", "t": 1700000000}\n')
    esit("2. satir ayni (bozuk)", yeni_satirlar[1], 'bu bir bozuk json satiridir\n')
    esit("3. satir ayni", yeni_satirlar[2], '{"metin": "İstek 3", "durum": "planlandı", "gorev": "001", "t": 1700000100}\n')
    esit("4. satir ayni (bos)", yeni_satirlar[3], '\n')
    esit("5. satir guncellendi", json.loads(yeni_satirlar[4]), {"metin": uzun_metin, "durum": "planlandı", "t": 1700000200, "gorev": "006"})

    # gecersiz sira ve gorev: SystemExit vermeli, dosya degismemeli
    dosya_once = istek_dosyasi.read_text(encoding="utf-8")
    for s, g in ((0, "006"), (10, "006"), (2, "006"), (4, "006"), (1, "6"), (1, "06"), (1, "0006"), (1, "abc")):
        try:
            P.istek_isle(s, g)
            hata.append("istek_isle(%r, %r) SystemExit vermeli" % (s, g))
        except SystemExit:
            pass
    esit("gecersiz islemlerde dosya degismez", istek_dosyasi.read_text(encoding="utf-8"), dosya_once)

    # ajan.py CLI: istekler ve istek komutlari
    import io
    eski_stdout = sys.stdout

    # ajan.py istekler: yalniz yeni olanlar basilmali, metin ilk 100 karaktere kirpilmali
    buf = io.StringIO()
    sys.stdout = buf
    try:
        A.main(["istekler"])
    finally:
        sys.stdout = eski_stdout
    out = buf.getvalue().strip().splitlines()
    esit("istekler ciktisi satir sayisi", len(out), 1)
    if out:
        esit("istek 1 ciktisi", out[0], "1  %s  İstek 1" % time.strftime("%d.%m %H:%M", time.localtime(1700000000)))

    # ajan.py istek 1 007
    buf = io.StringIO()
    sys.stdout = buf
    try:
        A.main(["istek", "1", "007"])
    finally:
        sys.stdout = eski_stdout
    esit("istek komutu basari", buf.getvalue().strip(), "1. istek planlandı: görev 007.")

    # hepsi planlandi olunca 'Yeni istek yok.'
    buf = io.StringIO()
    sys.stdout = buf
    try:
        A.main(["istekler"])
    finally:
        sys.stdout = eski_stdout
    esit("yeni istek yok ciktisi", buf.getvalue().strip(), "Yeni istek yok.")

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("Ofis pilotu temiz: karar tablosu, sinirlar, kota dususu, mesajlar, olcum, Testci kilidi ve tablosu, pilot turu, is istekleri.")
