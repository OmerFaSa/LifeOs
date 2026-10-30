#!/usr/bin/env python3
"""sistem/planlama.py sozlerinin testi (Sistem planlamasi).

   python3 tools/planlama_test.py     (cikis 0 temiz, 1 kirmizi)"""
import datetime
import importlib.util
import io
import json
import sqlite3
import sys
import tempfile
import time
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("planlama", KOK / "sistem" / "planlama.py")
P = importlib.util.module_from_spec(spec)
spec.loader.exec_module(P)
hata = []


def bekle(ad, kosul):
    if not kosul:
        hata.append(ad)


D = datetime.datetime
CMT_0700 = D(2026, 10, 31, 7, 0)          # 31 Ekim 2026 cumartesi

# 1) Haftalik vade
bekle("vade: cumartesi 07:05 -> ayni gun 07:00", P.son_vade(5, "07:00", D(2026, 10, 31, 7, 5)) == CMT_0700)
bekle("vade: cumartesi 06:59 -> bir hafta once", P.son_vade(5, "07:00", D(2026, 10, 31, 6, 59)) == CMT_0700 - datetime.timedelta(days=7))
bekle("vade: pazartesi -> gecen cumartesi", P.son_vade(5, "07:00", D(2026, 11, 2, 12, 0)) == CMT_0700)

# 2) Dogrulama
for ad, v in [("bos gun", {"acilis": {"gunler": []}}), ("kotu saat", {"kapanis": {"saat": "25:00"}}),
              ("kotu kacarsa", {"isler": {"yedek": {"kacarsa": "belki"}}}), ("kotu gun", {"isler": {"yedek": {"gun": 9}}})]:
    try:
        P.dogrula(v)
        hata.append("dogrula reddetmedi: " + ad)
    except ValueError as e:
        bekle("dogrula 400: " + ad, e.args[0][0] == 400)
try:
    P.dogrula({"acilis": {"saatler": ["07:00"] * 6}})
    hata.append("dogrula reddetmedi: 6 gunluk saatler")
except ValueError as e:
    bekle("dogrula 400: 6 gunluk saatler", e.args[0][0] == 400)
p = P.dogrula({"isler": {"yedek": {"acik": True, "gun": 5, "saat": "07:00", "kacarsa": "onay"}}}, simdi=1000.0)
bekle("eski tek gun yeni gunler olur", p["isler"]["yedek"]["gunler"] == [5])
bekle("isler kapali baslar", all(not p["isler"][i]["acik"] for i in P.IS_IDLER if i != "yedek"))
bekle("acilan isin acildi zamani", p["isler"]["yedek"]["acildi"] == 1000.0)
bekle("kur yalniz guncellemede", P.dogrula({"isler": {"yedek": {"kur": True}}})["isler"]["yedek"]["kur"] is False)
# 2b) Esneklik (soz 7): eski acilis bicimi cevrilir; her gunun kendi saati; hepsi bos ise kapali
eski = P.dogrula({"acilis": {"acik": True, "gunler": [0, 5], "saat": "08:15"}})
bekle("eski acilis saatlere cevrilir", eski["acilis"]["saatler"] == ["08:15", None, None, None, None, "08:15", None] and eski["acilis"]["acik"])
yeni = P.dogrula({"acilis": {"acik": True, "saatler": ["07:00", "07:00", None, "07:30", "07:00", "10:00", None]}})
bekle("gun gun saat", yeni["acilis"]["saatler"][5] == "10:00" and yeni["acilis"]["saatler"][2] is None)
bekle("hepsi bos ise acilis kapali", P.dogrula({"acilis": {"acik": True, "saatler": [None] * 7}})["acilis"]["acik"] is False)
x = {"gunler": [0, 2, 4], "saat": "06:00"}
bekle("cok gunlu isin vadesi en yakin gecmis gun", P.is_vadesi(x, D(2026, 11, 4, 7, 0)) == D(2026, 11, 4, 6, 0)
      and P.is_vadesi(x, D(2026, 11, 3, 7, 0)) == D(2026, 11, 2, 6, 0))

# 3) Vadesi gelenler: acilmadan onceki vade sayilmaz; saatinde / kacti
plan = P.varsayilan()
plan["isler"]["yedek"].update(acik=True, acildi=(CMT_0700 + datetime.timedelta(hours=1)).timestamp())
bekle("acilmadan onceki vade kacmis sayilmaz", P.vadesi_gelenler(plan, D(2026, 11, 2, 9, 0)) == [])
plan["isler"]["yedek"]["acildi"] = 0
bekle("saatinde", P.vadesi_gelenler(plan, D(2026, 10, 31, 7, 3)) == [("yedek", "saatinde")])
bekle("kacti", P.vadesi_gelenler(plan, D(2026, 11, 1, 9, 0)) == [("yedek", "kacti")])
plan["son"]["yedek"] = {"vade": CMT_0700.timestamp()}
bekle("yapilan vade tekrar gelmez", P.vadesi_gelenler(plan, D(2026, 11, 1, 9, 0)) == [])

# 4) Kapanis vakti
plan = P.varsayilan()
plan["kapanis"].update(acik=True, saatler=[None, None, None, None, None, "23:30", "22:00"])
bekle("kapanis saatinde", P.kapanis_vakti(plan, D(2026, 10, 31, 23, 31), 0))
bekle("kapanis bir kez", not P.kapanis_vakti(plan, D(2026, 10, 31, 23, 31), D(2026, 10, 31, 23, 30, 30).timestamp()))
bekle("kapanis baska gun yok", not P.kapanis_vakti(plan, D(2026, 11, 2, 23, 31), 0))
bekle("pazar kendi saatinde kapanir", P.kapanis_vakti(plan, D(2026, 11, 1, 22, 2), 0) and not P.kapanis_vakti(plan, D(2026, 11, 1, 23, 31), 0))
bekle("kapanis gec kalinca yok (acilista kapatmaz)", not P.kapanis_vakti(plan, D(2026, 10, 31, 23, 59), 0))

# 5) Windows acilis gorevi: komut ve kaldirma; baska isletimde soylenir
cagri = []


class R:
    def __init__(self, kod):
        self.returncode, self.stdout, self.stderr = kod, "", ""


def sahte(arg, **k):
    cagri.append(arg)
    return R(0)


ok, m = P.acilis_gorevi({"acik": True, "saatler": ["07:00", None, None, None, None, "07:00", None]}, r"C:\LifeOS\BASLAT.bat", isletim="nt", calistir=sahte)
bekle("schtasks olusturur", ok and cagri[-1][:2] == ["schtasks", "/Create"] and "MON,SAT" in cagri[-1] and "07:00" in cagri[-1]
      and P.GOREV_ADI in cagri[-1] and '"C:\\LifeOS\\BASLAT.bat"' in cagri[-1])
cagri.clear()
ok, m = P.acilis_gorevi({"acik": True, "saatler": ["07:00", "07:00", None, None, None, "10:00", None]}, "x", isletim="nt", calistir=sahte)
olusan = [c for c in cagri if c[1] == "/Create"]
bekle("farkli saatler ayri gorev; eskiler once silinir", ok and len(olusan) == 2 and "MON,TUE" in olusan[0] and "SAT" in olusan[1]
      and P.gorev_adi(2) in olusan[1] and sum(c[1] == "/Delete" for c in cagri) == 7 and cagri.index(olusan[0]) > 6)
ok, m = P.acilis_gorevi({"acik": False, "saatler": ["07:00"] * 7}, "x", isletim="nt", calistir=sahte)
bekle("schtasks siler", cagri[-1][:2] == ["schtasks", "/Delete"])
ok, m = P.acilis_gorevi({"acik": True, "saatler": ["07:00"] * 7}, "x", isletim="posix", calistir=sahte)
bekle("windows disinda soylenir", not ok and "Windows" in m)

with tempfile.TemporaryDirectory() as d:
    # 6) Veri denetimi yalniz okur
    db = Path(d) / "hesap.db"
    c = sqlite3.connect(db)
    c.execute("CREATE TABLE kayit (anahtar TEXT, deger TEXT)")
    c.executemany("INSERT INTO kayit VALUES (?, ?)", [("a", '{"x":1}'), ("b", "{bozuk"), ("c", None)])
    c.commit()
    c.close()
    once = db.read_bytes()
    ok, m = P.veri_denetimi(str(db))
    bekle("denetim bozuk kaydi sayar", not ok and "2 kayıttan 1" in m)
    bekle("denetim dosyaya dokunmaz", db.read_bytes() == once)

    # 7) Zamanlayici: kacan is «onay» ise Bekleyen'e, «hemen» ise yapilir; atla
    yapilan = []
    z = P.Zamanlayici({"yedek": lambda: (yapilan.append("yedek") or (True, "Yedek alındı")),
                       "denetim": lambda: (yapilan.append("denetim") or (True, "Temiz"))},
                      kok=d, saat=lambda: D(2026, 11, 1, 9, 0))
    p = P.varsayilan()
    p["isler"]["yedek"].update(acik=True, kacarsa="onay")
    p["isler"]["denetim"].update(acik=True, kacarsa="hemen")
    P.yaz(p, d)
    z.tur()
    time.sleep(.3)
    q = P.oku(d)
    bekle("onay isi bekleyen", q["bekleyen"] == ["yedek"] and "yedek" not in yapilan)
    bekle("hemen isi yapildi", yapilan == ["denetim"] and q["son"]["denetim"]["ok"] is True)
    z.tur()
    time.sleep(.2)
    bekle("ikinci turda tekrar yok", yapilan == ["denetim"] and P.oku(d)["bekleyen"] == ["yedek"])
    z.yap("yedek")
    bekle("Yap bekleyeni yapar ve listeden cikarir", "yedek" in yapilan and P.oku(d)["bekleyen"] == [])

    # 8) Uc: ev agindan 403, basliksiz yazma 403
    class H:
        def __init__(self, komut, yol, ip="127.0.0.1", govde=b"", baslik=True):
            self.command, self.path, self.client_address = komut, yol, (ip, 1)
            self.headers = {"Content-Length": str(len(govde))}
            if baslik:
                self.headers["X-LifeOS"] = "planlama"
            self.rfile, self.wfile, self.kod = io.BytesIO(govde), io.BytesIO(), None

        def send_response(self, k):
            self.kod = k

        def send_header(self, *a):
            pass

        def end_headers(self):
            pass

    h = H("GET", "/api/planlama", ip="192.168.1.5")
    P.isle(h, z, "x")
    bekle("ev agindan 403", h.kod == 403)
    h = H("POST", "/api/planlama", govde=b"{}", baslik=False)
    P.isle(h, z, "x")
    bekle("basliksiz 403", h.kod == 403)
    h = H("GET", "/api/planlama")
    P.isle(h, z, "x")
    v = json.loads(h.wfile.getvalue().decode("utf-8"))
    bekle("GET plani ve isleri verir", h.kod == 200 and len(v["isler"]) == len(P.ISLER) and v["plan"]["isler"]["yedek"]["acik"])

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("Sistem planlamasi temiz: vade, kacan is, kapanis, acilis gorevi, denetim, uc.")
