"""Kabul testi 080 · sistem/bilgisayar.py: King'in bilgisayar araçlarının platform katmanı (KING-4 §E).

Gerçek bilgisayara dokunmaz: her dış çağrı `calistir(argv, zaman)` sahtesinden geçer.
    python tools/bilgisayar_kabul_test.py
"""
import os
import sys
import tempfile
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KOK / "sistem"))
import bilgisayar as B  # noqa: E402

hata = []


def esit(ad, gercek, beklenen):
    if gercek != beklenen:
        hata.append("%s: %r != %r" % (ad, gercek, beklenen))


class Sahte:
    def __init__(self, kod=0, cikti=""):
        self.kod, self.cikti, self.cagri = kod, cikti, []

    def __call__(self, argv, zaman):
        self.cagri.append((argv, zaman))
        return self.kod, self.cikti


with tempfile.TemporaryDirectory() as t:
    t = Path(t)
    belge = t / "rapor'; Remove-Item x; '.txt"
    belge.write_text("x", encoding="utf-8")

    # 1. ac: yalniz var olan, mutlak, calistirilabilir olmayan yol
    for ad, yol in (("yok", str(t / "yok.txt")), ("goreli", "rapor.txt"), ("bos", "")):
        s = Sahte(0, "1\n")
        r = B.ac(yol, calistir=s)
        esit("ac %s reddedilir" % ad, (r.get("ok"), bool(r.get("hata")), len(s.cagri)), (False, True, 0))
    for uzanti in (".exe", ".bat", ".cmd", ".ps1", ".vbs", ".lnk", ".msi", ".scr", ".js", ".reg"):
        p = t / ("x" + uzanti)
        p.write_text("x", encoding="utf-8")
        s = Sahte(0, "1\n")
        esit("ac %s calistirmaz" % uzanti, (B.ac(str(p), calistir=s).get("ok"), len(s.cagri)), (False, 0))
    s = Sahte(0, "4242\r\n")
    r = B.ac(str(belge), calistir=s)
    esit("ac belge", (r.get("ok"), r.get("pid")), (True, 4242))
    esit("ac tek cagri", len(s.cagri), 1)
    if s.cagri:
        argv = s.cagri[0][0]
        esit("ac argv liste", isinstance(argv, list), True)
        esit("ac PowerShell", os.path.basename(str(argv[0])).lower() in ("powershell", "powershell.exe"), True)
        esit("ac tirnak kacisi", "rapor''; Remove-Item" in " ".join(map(str, argv)), True)
    esit("baslatilan kaydi", 4242 in B.BASLATILAN, True)
    s = Sahte(0, "77\n")
    esit("ac klasor", B.ac(str(t), calistir=s).get("ok"), True)
    esit("ac basarisiz", B.ac(str(belge), calistir=Sahte(1, "erisim engellendi")).get("ok"), False)

    # 2. uygulamalar: Baslat menusu kisayollari; kaldirici ve kisayol olmayan girmez
    m = t / "menu"
    (m / "Araçlar").mkdir(parents=True)
    for ad in ("Notepad++.lnk", "Araçlar/Hesap Makinesi.lnk", "Spotify.url", "beni oku.txt",
               "Uninstall Notepad++.lnk", "Araçlar/Kaldır Spotify.lnk"):
        (m / ad).write_text("x", encoding="utf-8")
    u = B.uygulamalar([str(m)])
    esit("uygulama adlari", [x["ad"] for x in u], ["Hesap Makinesi", "Notepad++", "Spotify"])
    esit("uygulama yolu", all(Path(x["yol"]).exists() for x in u), True)

    # 3. baslat: tam ad (Turkce buyuk harf), tek on ek; bulunamayan ya da belirsiz calismaz
    s = Sahte(0, "5150\n")
    r = B.baslat("HESAP MAKİNESİ", [str(m)], calistir=s)
    esit("baslat tam ad", (r.get("ok"), r.get("pid"), r.get("ad")), (True, 5150, "Hesap Makinesi"))
    esit("baslat kisayolu acar", bool(s.cagri) and "Hesap Makinesi.lnk" in " ".join(map(str, s.cagri[0][0])), True)
    esit("baslat on ek", B.baslat("spot", [str(m)], calistir=Sahte(0, "9\n")).get("ad"), "Spotify")
    for ad in ("photoshop", "", "  "):
        s = Sahte(0, "1\n")
        r = B.baslat(ad, [str(m)], calistir=s)
        esit("baslat %r yok" % ad, (r.get("ok"), bool(r.get("hata")), len(s.cagri)), (False, True, 0))
    (m / "Spotify Yardım.lnk").write_text("x", encoding="utf-8")
    s = Sahte(0, "1\n")
    r = B.baslat("spo", [str(m)], calistir=s)
    esit("baslat belirsiz", (r.get("ok"), sorted(r.get("adaylar") or []), len(s.cagri)), (False, ["Spotify", "Spotify Yardım"], 0))

    # 4. kapat: yalniz bu katmanin baslattigi sureci, zorlamadan (kaydedilmemis is kaybolmasin)
    s = Sahte(0, "")
    esit("kapat yabanci", (B.kapat(999999, calistir=s).get("ok"), len(s.cagri)), (False, 0))
    s = Sahte(0, "")
    esit("kapat kendi", B.kapat(4242, calistir=s).get("ok"), True)
    esit("kapat argv", s.cagri[0][0] if s.cagri else None, ["taskkill", "/PID", "4242"])
    esit("kapat kayittan duser", 4242 in B.BASLATILAN, False)
    esit("kapat ikinci kez", B.kapat(4242, calistir=Sahte()).get("ok"), False)

    # 5. ekran_oku: metin doner; hata ya da zaman asimi istisna degil, ok False
    esit("ekran metni", B.ekran_oku(calistir=Sahte(0, "  Merhaba dünya\r\nİkinci satır \n")),
         {"ok": True, "metin": "Merhaba dünya\nİkinci satır"})
    esit("ekran uzun", len(B.ekran_oku(calistir=Sahte(0, "a" * 9000))["metin"]), B.EN_COK_METIN)
    r = B.ekran_oku(calistir=Sahte(-1, "zaman aşımı"))
    esit("ekran hata", (r.get("ok"), bool(r.get("hata"))), (False, True))

    # 6. varsayilan calistir: eksik program ve zaman asimi istisna firlatmaz
    kod, _ = B.calistir(["yok_boyle_bir_program_lifeos_080"], 5)
    esit("eksik program", kod != 0, True)
    kod, _ = B.calistir([sys.executable, "-c", "import time; time.sleep(5)"], 1)
    esit("zaman asimi", kod, -1)

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("bilgisayar kabul: ac, uygulamalar, baslat, kapat, ekran_oku, calistir temiz.")
