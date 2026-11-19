#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""CI_YEREL — CI'nin denetimlerini bu bilgisayarda TEK KOMUTLA kosar (AGENTS §2).

Liste ikinci kez yazilmaz: adimlar `.github/workflows/ci.yml`'den okunur (ayni `run:` satiri, ayni
`working-directory`). Tarayicisiz adimlar paralel, tarayicili (Playwright) adimlar sonra sirayla kosar:
ayni anda bir suru tarayici sahte kirmizi uretir (belgeler/NOTLAR, denetim yuku).

  python tools/ci_yerel.py            hepsi (paralel + tarayicilar sirayla)
  python tools/ci_yerel.py --liste    yalniz adimlari yazar
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
    p.add_argument("-k", default="", help="adında bu geçen adımlar")
    a = p.parse_args(argv)
    with open(CI, encoding="utf-8") as f:
        liste = [x for x in adimlar(f.read()) if a.k.lower() in x["ad"].lower()]
    if a.liste:
        for x in liste:
            print("%-10s %s%s" % (x["is"], x["ad"], "  [tarayıcı]" if TARAYICI.search(x["ad"] + " ".join(x["komutlar"])) else ""))
        return 0
    gecici = tempfile.mkdtemp(prefix="ci-yerel-")
    ortam = _ortam(gecici)
    tarayicili = [x for x in liste if TARAYICI.search(x["ad"] + " ".join(x["komutlar"]))]
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
        if os.name == "nt":
            b = _bash()
            assert b.lower().endswith("bash.exe") and os.path.isfile(b), b
        print("ci_yerel selftest yeşil (%d adım)" % len(gercek))
        raise SystemExit(0)
    raise SystemExit(main())
