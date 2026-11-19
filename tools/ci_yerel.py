#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""CI_YEREL — CI'nin denetimlerini bu bilgisayarda TEK KOMUTLA kosar (AGENTS §2).

Liste ikinci kez yazilmaz: adimlar `.github/workflows/ci.yml`'den okunur (ayni `run:` satiri, ayni
`working-directory`). Tarayicisiz adimlar paralel, tarayicili (Playwright) adimlar sonra sirayla kosar:
ayni anda bir suru tarayici sahte kirmizi uretir (belgeler/NOTLAR, denetim yuku).

  python tools/ci_yerel.py            hepsi (paralel + tarayicilar sirayla)
  python tools/ci_yerel.py --liste    yalniz adimlari yazar
  python tools/ci_yerel.py --hizli    tarayici adimlarini atlar (hizli ic dongu)
  python tools/ci_yerel.py --degisen [TABAN]  yalniz degisen dosyalardan etkilenen adimlar
  python tools/ci_yerel.py -k kabuk   adinda «kabuk» gecenler
  python tools/ci_yerel.py --sira     hepsi sirayla (yuklu makinede)

Kurulum adimlari (npm ci, playwright install) atlanir; tools/node_modules hazir olmali. Cikis: kalan sayisi.
"""
import argparse
import concurrent.futures
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CI = os.path.join(KOK, ".github", "workflows", "ci.yml")
KURULUM = re.compile(r"\bnpm ci\b|playwright install")
TARAYICI = re.compile(r"tarayıcı|_gez\.js|ortak_test\.js")
GENEL_YOLLAR = {
    "AGENTS.md",
    "tools/ci_yerel.py",
    "tools/ci_hata.sh",
    "tools/ci_satir.sh",
    "tools/gez_sunucu.js",
    "tools/package.json",
    "tools/package-lock.json",
}
BILINEN_ONEKLER = (
    "belgeler/",
    "HKM/",
    "king/",
    "motor/",
    "alan/",
    "kabuk/",
    "brand/",
    "sistem/",
    "kalite/",
    "uygulama/",
    "tools/",
)


def _tarayici_mi(adim):
    return bool(TARAYICI.search(adim["ad"] + " " + " ".join(adim["komutlar"])))


def _degisen_yollar(taban):
    """Calisma agaci (HEAD) ya da TABAN...HEAD arasindaki degisen yollar; git okunamazsa None."""
    def _git(*args):
        try:
            return subprocess.run(
                ["git", "-c", "core.quotepath=false", *args],
                cwd=KOK, capture_output=True, text=True, encoding="utf-8", errors="replace",
            )
        except OSError:
            return None

    yollar = set()
    if taban != "HEAD":
        r = _git("diff", "--name-only", "%s...HEAD" % taban)
        if r is None or r.returncode != 0:
            return None
        yollar.update(x.strip().replace("\\", "/") for x in r.stdout.splitlines() if x.strip())
    r_head = _git("diff", "--name-only", "HEAD")
    r_yeni = _git("ls-files", "--others", "--exclude-standard")
    if r_head is None or r_yeni is None or r_head.returncode != 0 or r_yeni.returncode != 0:
        return None
    yollar.update(x.strip().replace("\\", "/") for x in r_head.stdout.splitlines() if x.strip())
    yollar.update(x.strip().replace("\\", "/") for x in r_yeni.stdout.splitlines() if x.strip())
    if taban == "HEAD" and not yollar:
        for ref in ("origin/main", "main"):
            r_v = _git("rev-parse", "--verify", ref)
            if r_v is not None and r_v.returncode == 0:
                r_ref = _git("diff", "--name-only", "%s...HEAD" % ref)
                if r_ref is None or r_ref.returncode != 0:
                    return None
                yollar.update(x.strip().replace("\\", "/") for x in r_ref.stdout.splitlines() if x.strip())
                break
    return sorted(yollar)


def _adim_eslesir(adim, yol):
    k = " ".join(adim["komutlar"])
    is_ = adim["is"]
    if yol.startswith("belgeler/"):
        return "belge_dizin_kabul_test" in k or "vitrin.py" in k
    if yol.startswith("HKM/"):
        return (is_ == "hkm" or "tekkapi_test" in k or "king/" in k or "olcum.py" in k
                or "not-hkm.test.js" in k or "hafiza_" in k or "merdiven_" in k or "goc_test" in k)
    if yol.startswith("king/"):
        return ("king/" in k or "king-sohbet.test.js" in k or "tekkapi_test" in k
                or "olcum.py" in k or "bilgisayar_kabul_test" in k
                or "katman" in k or "gercek_kosu" in k or "kopru" in adim["ad"].lower())
    if yol.startswith("motor/"):
        return ("motor/" in k or "king/" in k or "kabuk" in k or "ortak_test" in k
                or "hiz_olcum" in k or "hareket_gez" in k or "gercek_kosu" in k
                or "tekkapi_test" in k or "olcum.py" in k or "kalite/katman" in k)
    if yol.startswith("alan/"):
        return ("alan/" in k or "king/" in k or "kabuk.test.js" in k or "kabuk_gez" in k
                or "kabuk_baslangic" in k or "gercek_kosu" in k or "hareket_gez" in k
                or "hiz_olcum" in k or "onay_uygula" in k or "veri_" in k
                or "olcum.py" in k or "kalite/katman" in k)
    if yol.startswith(("kabuk/", "brand/")):
        return ("kabuk" in k or "brand/" in k or "ortak_test" in k or "hiz_olcum" in k
                or "hareket_gez" in k or "marka.py" in k or "vitrin.py" in k
                or "tekkapi_test" in k or "gocpaket" in k or "web_paket" in k
                or "kabul_js" in k or "kullanim" in k or "bilinc_kabul" in k
                or "turk_tablo_kabul" in k or "portreonar_test" in k or "ayar_test" in k
                or "kalite/katman" in k or "olcum.py" in k or "king/" in k)
    if yol.startswith("sistem/"):
        return is_ == "hkm" or any(t in k for t in (
            "tekkapi_test", "kuyruk_test", "tasi_test", "goc_test", "tekdepo_test",
            "gocpaket_test", "zemin_test", "planlama_test", "muzik_test", "ice_test",
            "ayar_test", "kalite_etiket_test", "bilgisayar_kabul_test", "olcum.py",
            "kabuk_esit_gez", "kabuk_gez", "ayar_esit_kabul", "ice_suren_kabul",
            "mcp_test", "gercek_kosu", "kabuk_baslangic", "anlama", "hiz_olcum", "hareket_gez",
        ))
    if yol.startswith("kalite/"):
        return any(t in k for t in (
            "olcum", "katman", "kullanim", "anlama", "hiz_olcum", "kalite_etiket_test", "king/",
        ))
    if yol.startswith("uygulama/"):
        return "web_paket" in k or "olcum.py" in k
    if yol.startswith("tools/"):
        ad = os.path.basename(yol)
        kok_ad = re.sub(r"(?:_kabul_test|_test|\.test)?\.(?:py|js)$", "", ad)
        if ad == "ema_isci.py" and is_ == "hkm":
            return True
        if ad == "ajan_kanca.py" and "ajan_test" in k:
            return True
        if ad in ("ajan.py", "ofis_test.py") and "ofis_pilot" in k:
            return True
        if ad == "gercek_kosu.js" and ("kabuk_baslangic" in k or "kabuk_gez" in k or "gercek_kosu" in k):
            return True
        if ad == "kabuk_baslangic.js" and ("kabuk_baslangic" in k or "kabuk_gez" in k):
            return True
        if ad.endswith(".json") and "olcum.py" in k:
            return True
        if "tools_dizin_kabul_test" in k:
            return True
        if ("tools/" + ad) in k:
            return True
        return len(kok_ad) >= 4 and ("tools/" + kok_ad) in k
    return False


def etkilenen_adimlar(liste, yollar):
    """Degisen yollardan etkilenen CI adimlarini guvenli geri dususle secer."""
    if yollar is None:
        return list(liste), "git okunamadı: tüm adımlar"
    if not yollar:
        return [], "değişen dosya yok"
    for y in yollar:
        yol = y.replace("\\", "/")
        if yol.startswith(".github/") or yol in GENEL_YOLLAR or not yol.startswith(BILINEN_ONEKLER):
            return list(liste), "genel değişiklik (%s): tüm adımlar" % yol
    secilen = [a for a in liste if any(_adim_eslesir(a, y.replace("\\", "/")) for y in yollar)]
    if not secilen:
        return list(liste), "eşleşen özel adım yok: tüm adımlar"
    return secilen, "%d dosya -> %d/%d adım" % (len(yollar), len(secilen), len(liste))


def adimlar(metin):
    """ci.yml -> [{"is", "ad", "dizin", "komutlar"}]; `run: |` + ci_satir.sh blogunun her satiri ayri komut."""
    out, is_, adim, blok = [], "", None, None
    for satir in metin.splitlines():
        if blok is not None:
            if satir.strip() and (len(satir) - len(satir.lstrip())) > blok[0]:
                blok[1].append(satir.strip())
                continue
            adim["komutlar"] = blok[1] if adim.get("satir_satir") else ["\n".join(blok[1])]
            blok = None
        m = re.match(r"^  ([a-z][\w-]*):\s*$", satir)
        if m:
            is_ = m.group(1)
            continue
        m = re.match(r"^\s*- (?:name|uses):\s*(.+)$", satir)
        if m:
            adim = {"is": is_, "ad": m.group(1).strip(), "dizin": "", "komutlar": []}
            if satir.lstrip().startswith("- name"):
                out.append(adim)
            continue
        if adim is None:
            continue
        m = re.match(r"^(\s*)(run|working-directory|shell):\s*(.*)$", satir)
        if not m:
            continue
        anahtar, deger = m.group(2), m.group(3).strip()
        if anahtar == "working-directory":
            adim["dizin"] = deger
        elif anahtar == "shell":
            adim["satir_satir"] = "ci_satir.sh" in deger
            if adim["satir_satir"] and len(adim["komutlar"]) == 1:
                adim["komutlar"] = adim["komutlar"][0].split("\n")
        elif deger == "|":
            blok = (len(m.group(1)), [])
        else:
            adim["komutlar"] = [deger]
    if blok is not None:
        adim["komutlar"] = blok[1] if adim.get("satir_satir") else ["\n".join(blok[1])]
    return [a for a in out if a["komutlar"] and not KURULUM.search(" ".join(a["komutlar"]))]


def _ortam(gecici):
    o = dict(os.environ, GITHUB_WORKSPACE=KOK.replace("\\", "/"), PYTHONUTF8="1", PYTHONIOENCODING="utf-8",
             PYTHONDONTWRITEBYTECODE="1")
    if os.name == "nt":
        # Windows'ta `python3` Store kisayoluna ya da baska bir Python'a gidebilir: bu Python'a bagla.
        with open(os.path.join(gecici, "python3"), "w", newline="\n") as f:
            f.write('#!/bin/sh\nexec "%s" "$@"\n' % sys.executable.replace("\\", "/"))
        o["PATH"] = gecici + os.pathsep + o["PATH"]
    return o


def _bash():
    """Windows'ta PATH'te `bash` yoksa Git'in bash.exe'sini bulur; aksi halde `bash`."""
    b = shutil.which("bash")
    if b:
        return b
    if os.name == "nt":
        adaylar = []
        git = shutil.which("git")
        if git:
            ust = os.path.dirname(os.path.dirname(git))
            adaylar.extend([os.path.join(ust, "bin", "bash.exe"), os.path.join(ust, "usr", "bin", "bash.exe")])
        adaylar.extend([r"C:\Program Files\Git\bin\bash.exe", r"C:\Program Files\Git\usr\bin\bash.exe"])
        for aday in adaylar:
            if os.path.isfile(aday):
                return aday
    return "bash"


def kos(adim, ortam):
    t0, cikti, kod = time.time(), [], 0
    kabuk = _bash()
    for komut in adim["komutlar"]:
        r = subprocess.run([kabuk, "-c", komut], cwd=os.path.join(KOK, adim["dizin"]),
                           env=ortam, capture_output=True, text=True, encoding="utf-8", errors="replace",
                           stdin=subprocess.DEVNULL)
        cikti.append(r.stdout + r.stderr)
        kod = kod or r.returncode
    return adim, kod, time.time() - t0, "".join(cikti)


def main(argv=None):
    p = argparse.ArgumentParser(description="CI denetimlerini yerelde tek komutla koşar.")
    p.add_argument("--liste", action="store_true")
    p.add_argument("--sira", action="store_true")
    p.add_argument("--hizli", action="store_true", help="tarayıcı adımlarını atlar")
    p.add_argument("--degisen", nargs="?", const="HEAD", default=None, metavar="TABAN",
                   help="yalnız değişen dosyalardan etkilenen adımlar (varsayılan HEAD)")
    p.add_argument("-k", default="", help="adında bu geçen adımlar")
    a = p.parse_args(argv)
    with open(CI, encoding="utf-8") as f:
        liste = adimlar(f.read())
    if a.degisen is not None:
        liste, neden = etkilenen_adimlar(liste, _degisen_yollar(a.degisen))
        print("[ci_yerel] --degisen: %s" % neden, file=sys.stderr)
    if a.hizli:
        liste = [x for x in liste if not _tarayici_mi(x)]
    liste = [x for x in liste if a.k.lower() in x["ad"].lower()]
    if a.liste:
        for x in liste:
            print("%-10s %s%s" % (x["is"], x["ad"], "  [tarayıcı]" if _tarayici_mi(x) else ""))
        return 0
    if not liste:
        print("Koşulacak adım yok.")
        return 0
    gecici = tempfile.mkdtemp(prefix="ci-yerel-")
    ortam = _ortam(gecici)
    tarayicili = [x for x in liste if _tarayici_mi(x)]
    duz = [x for x in liste if x not in tarayicili]
    kalan, t0 = [], time.time()

    def yaz(sonuc):
        adim, kod, sure, cikti = sonuc
        print("%s %5.1f sn  %s" % ("✓" if kod == 0 else "✗", sure, adim["ad"]), flush=True)
        if kod:
            kalan.append((adim["ad"], cikti))

    try:
        isci = 1 if a.sira else max(2, (os.cpu_count() or 4) // 2)
        with concurrent.futures.ThreadPoolExecutor(isci) as h:
            for s in concurrent.futures.as_completed([h.submit(kos, x, ortam) for x in duz]):
                yaz(s.result())
        for x in tarayicili:
            yaz(kos(x, ortam))
    finally:
        shutil.rmtree(gecici, ignore_errors=True)
    for ad, cikti in kalan:
        print("\n── KALDI: %s ──\n%s" % (ad, "\n".join(cikti.strip().splitlines()[-25:])))
    print("\n%d/%d yeşil, %.0f sn" % (len(liste) - len(kalan), len(liste), time.time() - t0))
    return len(kalan)


if __name__ == "__main__":
    for akis in (sys.stdout, sys.stderr):
        akis.reconfigure(encoding="utf-8", errors="replace")   # Windows konsolu cp1254: Turkce ad bozulmasin
    if "--selftest" in sys.argv:
        ornek = ("jobs:\n  a:\n    steps:\n      - uses: actions/checkout@v4\n      - name: Bir\n        run: echo 1\n"
                 "      - name: Kur\n        working-directory: tools\n        run: npm ci && npx playwright install\n"
                 "      - name: Iki\n        run: |\n          echo 2\n          echo 3\n        shell: bash tools/ci_satir.sh {0}\n"
                 "  b:\n    steps:\n      - name: Uc\n        working-directory: HKM\n        run: echo 4\n")
        x = adimlar(ornek)
        assert [(s["is"], s["ad"], s["dizin"], s["komutlar"]) for s in x] == [
            ("a", "Bir", "", ["echo 1"]), ("a", "Iki", "", ["echo 2", "echo 3"]), ("b", "Uc", "HKM", ["echo 4"])], x
        with open(CI, encoding="utf-8") as f:
            gercek = adimlar(f.read())
        assert len(gercek) > 30 and any("tekkapi_test" in " ".join(s["komutlar"]) for s in gercek)
        assert any(s["is"] == "hkm" and s["dizin"] == "HKM" for s in gercek)
        assert len(etkilenen_adimlar(gercek, [])[0]) == 0
        assert len(etkilenen_adimlar(gercek, None)[0]) == len(gercek)
        assert len(etkilenen_adimlar(gercek, [".github/workflows/ci.yml"])[0]) == len(gercek)
        assert len(etkilenen_adimlar(gercek, ["tools/gez_sunucu.js"])[0]) == len(gercek)
        assert len(etkilenen_adimlar(gercek, ["bilinmeyen/x.txt"])[0]) == len(gercek)
        b_adimlar = [s["ad"] for s in etkilenen_adimlar(gercek, ["belgeler/DIZIN.md"])[0]]
        assert any("Ofis kabul" in ad for ad in b_adimlar) and len(b_adimlar) <= 2, b_adimlar
        assert any("Vitrin" in s["ad"] for s in etkilenen_adimlar(gercek, ["belgeler/ekip/vitrin.html"])[0])
        a_adimlar = [s["ad"] for s in etkilenen_adimlar(gercek, ["king/arama.py"])[0]]
        assert any("Arama motoru" in ad for ad in a_adimlar) and any("Katman" in ad for ad in a_adimlar)
        assert not any(_tarayici_mi(s) for s in etkilenen_adimlar(gercek, ["king/arama.py"])[0]), a_adimlar
        h_adimlar = [s["ad"] for s in etkilenen_adimlar(gercek, ["HKM/core/depo.py"])[0]]
        assert "Testler" in h_adimlar and "Sorgu bütçesi" in h_adimlar and "Göç aracı kuru koşusu" in h_adimlar, h_adimlar
        s_adimlar = [s["ad"] for s in etkilenen_adimlar(gercek, ["sistem/hesap.py"])[0]]
        assert "Testler" in s_adimlar and "Tek kapı, tek süreç" in s_adimlar, s_adimlar
        goc_adimlar = [s["ad"] for s in etkilenen_adimlar(gercek, ["sistem/goc.py"])[0]]
        assert "King MCP ucu salt okur" in goc_adimlar and "Göç aracı kuru koşusu" in goc_adimlar, goc_adimlar
        k_adimlar = etkilenen_adimlar(gercek, ["kabuk/kabuk.css"])[0]
        assert any(_tarayici_mi(s) for s in k_adimlar) and any("Kabuk haritası" in s["ad"] for s in k_adimlar)
        assert len([s for s in k_adimlar if not _tarayici_mi(s)]) < len(k_adimlar)
        t_adimlar = [s["ad"] for s in etkilenen_adimlar(gercek, ["tools/pano_cek.js"])[0]]
        assert any("Ofis kabul" in ad for ad in t_adimlar) and any("Görsel pano aracı" in ad for ad in t_adimlar), t_adimlar
        assert any("Karmaşıklık" in s["ad"] for s in etkilenen_adimlar(gercek, ["tools/king_sinav.json"])[0])
        hizli = [s for s in gercek if not _tarayici_mi(s)]
        assert len(hizli) == len(gercek) - 5 and any("Görsel pano aracı" in s["ad"] for s in hizli)
        eski_run = subprocess.run
        subprocess.run = lambda *a, **kw: subprocess.CompletedProcess(a[0], 128, "", "fatal")
        try:
            assert _degisen_yollar("origin/main") is None
        finally:
            subprocess.run = eski_run
        if os.name == "nt":
            b = _bash()
            assert b.lower().endswith("bash.exe") and os.path.isfile(b), b
        print("ci_yerel selftest yeşil (%d adım)" % len(gercek))
        raise SystemExit(0)
    raise SystemExit(main())
