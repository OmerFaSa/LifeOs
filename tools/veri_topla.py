#!/usr/bin/env python3
"""veri/KAYNAKLAR.json -> veri/ham/<id>.txt (+ .meta.json). Yalniz standart kutuphane.
PDF icin sistemde pdftotext gerekir; yoksa o kaynak atlanir ve raporlanir."""
import hashlib, html, json, re, shutil, subprocess, sys, time, urllib.request
from html.parser import HTMLParser
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
HAM = KOK / "veri" / "ham"
NL = chr(10)


class _Metin(HTMLParser):
    """Tablo satiri tek satira iner: 'konu | 2025 | 2024 ...'. Boylece model satir-hucre eslesmesini tahmin etmez."""
    ATLA = {"script", "style", "noscript", "svg", "nav", "footer", "header"}
    BLOK = {"p", "br", "li", "h1", "h2", "h3", "h4", "div", "table", "section"}

    def __init__(self):
        super().__init__()
        self.parca, self.derin, self.satir, self.hucre = [], 0, None, None

    def handle_starttag(self, t, a):
        if t in self.ATLA:
            self.derin += 1
        elif t == "tr":
            self.satir = []
        elif t in ("td", "th") and self.satir is not None:
            self.hucre = []
        elif t in self.BLOK and self.satir is None:
            self.parca.append(NL)

    def handle_endtag(self, t):
        if t in self.ATLA and self.derin:
            self.derin -= 1
        elif t in ("td", "th") and self.hucre is not None and self.satir is not None:
            self.satir.append(re.sub(r"\s+", " ", "".join(self.hucre)).strip())
            self.hucre = None
        elif t == "tr" and self.satir is not None:
            if any(self.satir):
                self.parca.append(NL + " | ".join(self.satir) + NL)
            self.satir = None

    def handle_data(self, d):
        if self.derin:
            return
        (self.hucre if self.hucre is not None else self.parca).append(d)


def html_metin(ham):
    p = _Metin()
    p.feed(ham)
    s = html.unescape("".join(p.parca))
    s = re.sub(r"[ \t\r\f\v]+", " ", s)
    return re.sub(r"\n\s*\n+", NL, s).strip()


def indir(url):
    r = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 LifeOS-veri"})
    with urllib.request.urlopen(r, timeout=60) as f:
        return f.read()


def pdf_metin(veri, yol):
    if not shutil.which("pdftotext"):
        raise RuntimeError("pdftotext yok")
    yol.write_bytes(veri)
    c = subprocess.run(["pdftotext", "-layout", "-enc", "UTF-8", str(yol), "-"],
                       capture_output=True, timeout=120)
    return c.stdout.decode("utf-8", "replace")


def topla(k):
    HAM.mkdir(parents=True, exist_ok=True)
    veri = indir(k["url"])
    if k["tur"] == "pdf":
        metin = pdf_metin(veri, HAM / (k["id"] + ".pdf"))
    else:
        metin = html_metin(veri.decode("utf-8", "replace"))
    (HAM / (k["id"] + ".txt")).write_text(metin, encoding="utf-8")
    meta = {"id": k["id"], "url": k["url"], "duzey": k["duzey"],
            "alinma": time.strftime("%Y-%m-%d %H:%M:%S"),
            "sha256": hashlib.sha256(veri).hexdigest(), "karakter": len(metin)}
    (HAM / (k["id"] + ".meta.json")).write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
    return meta


def main():
    liste = json.loads((KOK / "veri" / "KAYNAKLAR.json").read_text(encoding="utf-8"))["kaynaklar"]
    sistem = sys.argv[1] if len(sys.argv) > 1 else None
    hata = 0
    for k in liste:
        if sistem and k["sistem"] != sistem:
            continue
        try:
            m = topla(k)
            print("TAMAM", k["id"], m["karakter"], "karakter")
        except Exception as e:  # tek kaynak digerlerini durdurmaz
            hata += 1
            print("HATA ", k["id"], e)
    sys.exit(1 if hata else 0)


if __name__ == "__main__":
    main()
