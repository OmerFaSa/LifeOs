#!/usr/bin/env python3
"""OFIS TESTCISI — AGENTS.md §2 tam denetimlerini bir ajan dalinda LLM'siz kosar.

Kullanici (2026-10-31): «Testci istenir ama sonucu Claude dogrular». Testci bir
model degil, bu betiktir: ayri bir klasorde (LifeOs-ajan/ofis-test, ayrik) main
ile dalin deneme birlesmesini kurar, uc modulu derler, her modulde runtests,
smoke, a11ycheck, layoutcheck, palettecheck, perfcheck; sonra entegre kosar.
Her denetimin ham ciktisi ve cikis kodu LifeOs-ajan/test/<no>/'ya yazilir;
Claude ajan ozetine degil bu ham ciktiya bakar (python tools/ajan.py testler <no>).

Gorevde «Kabul testi» varsa (Claude Code'un yazdigi, dalda degismemesi gereken test) once o kosar.
Denetim portlari sabittir: ayni anda tek kosu (kilit dosyasi). Cikis 2 = port
dolu ya da arac eksik: «kosulamadi», kirmizi degil. Birlesme main'e gitmez,
push edilmez; klasor her kosuda sifirlanir.

  python tools/ofis_test.py <no>           kosar (uzun: arka planda kos)
  python tools/ofis_test.py <no> --tablo   son kosunun tablosu
"""
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import ajan as A  # noqa: E402

MODUL = ("AYS", "SPI", "ESP")
DENETIM = ("runtests", "smoke", "a11ycheck", "layoutcheck", "palettecheck", "perfcheck")
ZAMAN_ASIMI = 20 * 60
KILIT_OMUR = 3 * 3600
KIMLIK = ["-c", "user.name=OmerFaSa", "-c", "user.email=omerfaruksagsozz@gmail.com"]


def klasor(no=None):
    k = A.AJAN_KLASOR / "test"
    return k / no if no else k


def adimlar(py="python", kabul=()):
    """(modul, ad, komut, calisma klasoru goreli) — sira onemli: once kabul ve derleme, entegre en sonda."""
    # shortcut: kabul testi yalniz .py; JS kabul testi gerekirse buraya node ile eklenir
    kabul = [k for k in kabul if k.endswith(".py")]
    out = [("kök", "kabul", [py, "-c", "import subprocess,sys; sys.exit(max(subprocess.call([sys.executable, f]) "
                                       "for f in sys.argv[1:]))"] + kabul, ".")] if kabul else []
    out += [(m, "derle", [py, "build.py"], m) for m in MODUL]
    out += [(m, d, ["node", "tools/%s.js" % d], m) for m in MODUL for d in DENETIM]
    return out + [("kök", "entegre", ["node", "tools/entegre.js"], ".")]


def sonuc_adi(kod):
    return "yeşil" if kod == 0 else "koşulamadı" if kod == 2 else "kırmızı"


def son_satirlar(metin, n=20):
    return [s for s in metin.replace("\r", "").splitlines() if s.strip()][-n:]


# ---------- kilit: denetim portlari sabit, ayni anda tek kosu ----------

def kilit_sahibi(simdi=None):
    try:
        k = json.loads((klasor() / "kilit").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    return k if (simdi or time.time()) - k.get("t", 0) < KILIT_OMUR else None


def kilit_al(no):
    klasor().mkdir(parents=True, exist_ok=True)
    y = klasor() / "kilit"
    if y.exists() and not kilit_sahibi():
        y.unlink()                                   # eskimis kilit (cokmus kosu)
    try:
        fd = os.open(str(y), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        return False
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump({"no": no, "pid": os.getpid(), "t": int(time.time())}, f)
    return True


def kilit_birak():
    (klasor() / "kilit").unlink(missing_ok=True)


# ---------- kosu ----------

def son_ozet(no):
    try:
        return json.loads((klasor(no) / "ozet.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def ozet_yaz(o):
    k = klasor(o["no"])
    g = k / "ozet.json.tmp"
    g.write_text(json.dumps(o, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(g, k / "ozet.json")


def hazirla(wt, dal):
    """Ayrik klasoru main + dal birlesmesine getirir: (tamam, aciklama)."""
    A.worktree_kur(wt, None)
    A.git("reset", "-q", "--hard", kok=wt, kontrol=False)
    A.git("clean", "-fdq", kok=wt, kontrol=False)    # -x yok: node_modules baglantilari kalsin
    A.git("checkout", "-q", "--detach", "main", kok=wt)
    r = subprocess.run(["git", "-C", str(wt)] + KIMLIK + ["merge", "--no-ff", "--no-edit", dal], capture_output=True,
                       text=True, encoding="utf-8", errors="replace", creationflags=A.SESSIZ)
    if r.returncode:
        A.git("merge", "--abort", kok=wt, kontrol=False)
        return False, (r.stdout + r.stderr).strip()[-2000:]
    return True, A.git("log", "-1", "--format=%h %s", kok=wt)


def kos(no):
    a = A.oku_durum().get(no)
    if not a or not a.get("dal"):
        raise SystemExit("Böyle bir görev ajanı yok: %s" % no)
    if not kilit_al(no):
        print("Testçi meşgul (%s); koşulamadı." % (kilit_sahibi() or {}).get("no"))
        sys.exit(2)
    try:
        k = klasor(no)
        shutil.rmtree(k, ignore_errors=True)
        k.mkdir(parents=True)
        wt = A.AJAN_KLASOR / "ofis-test"
        o = {"no": no, "dal": a["dal"], "commit": A.git("rev-parse", "--short", a["dal"]),
             "main": A.git("rev-parse", "--short", "main"), "baslangic": int(time.time()), "durum": "koşuyor", "adimlar": []}
        ozet_yaz(o)
        tamam, aciklama = hazirla(wt, a["dal"])
        o["birlesme"] = aciklama
        if not tamam:
            o.update(durum="çakışma", bitis=int(time.time()))
            ozet_yaz(o)
            return o
        py = str(Path(sys.executable).with_name("python.exe")) if Path(sys.executable).name.lower() == "pythonw.exe" else sys.executable
        ortam = dict(os.environ, PYTHONUTF8="1", PYTHONIOENCODING="utf-8")
        for modul, ad, komut, cwd in adimlar(py, a.get("kabul") or ()):
            log = k / ("%s-%s.log" % ("kok" if modul == "kök" else modul, ad))
            bas = time.time()
            try:
                with open(log, "w", encoding="utf-8", errors="replace") as f:
                    kod = subprocess.run(komut, cwd=str(wt / cwd), stdout=f, stderr=subprocess.STDOUT, env=ortam,
                                         timeout=ZAMAN_ASIMI, creationflags=A.SESSIZ).returncode
            except subprocess.TimeoutExpired:
                kod = -1
            except OSError as e:
                log.write_text(repr(e), encoding="utf-8")
                kod = -2
            metin = log.read_text(encoding="utf-8", errors="replace")
            o["adimlar"].append({"modul": modul, "ad": ad, "kod": kod, "sonuc": sonuc_adi(kod), "sure": round(time.time() - bas),
                                 "log": str(log), "son": son_satirlar(metin) if kod else []})
            ozet_yaz(o)
        o.update(durum="bitti", bitis=int(time.time()))
        ozet_yaz(o)
        return o
    finally:
        kilit_birak()


def tablo(o):
    """'ajan.py testler' ciktisi: her denetim bir satir, kirmizilarin son satirlari altta."""
    if not o:
        return "Bu iş için Testçi koşusu yok."
    sat = ["Testçi · %s · dal %s @ %s + main %s · %s%s" % (o["no"], o["dal"], o["commit"], o.get("main"), o["durum"],
           " · %d dk" % ((int(o.get("bitis") or time.time()) - o["baslangic"]) // 60) if o.get("baslangic") else "")]
    if o["durum"] == "çakışma":
        sat.append("main ile birleşmiyor:\n" + o.get("birlesme", ""))
    isaret = {"yeşil": "✓", "kırmızı": "✗", "koşulamadı": "–"}
    for x in o["adimlar"]:
        sat.append("  %s %-4s %-12s çıkış %-3s %4d sn" % (isaret[x["sonuc"]], x["modul"], x["ad"], x["kod"], x["sure"]))
    for x in o["adimlar"]:
        if x["sonuc"] != "yeşil":
            sat.append("\n== %s %s (%s) · %s" % (x["modul"], x["ad"], x["sonuc"], x["log"]))
            sat += ["   " + s for s in x.get("son") or []]
    return "\n".join(sat)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure") and sys.stdout:
        sys.stdout.reconfigure(encoding="utf-8")
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    no = sys.argv[1]
    if "--tablo" in sys.argv:
        print(tablo(son_ozet(no)))
    else:
        print(tablo(kos(no)))
