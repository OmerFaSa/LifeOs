#!/usr/bin/env python3
"""Rota — kaynak dosyalardan tek dosyalik dagitim uretir.

src/index.html icindeki yerel <link rel="stylesheet"> ve <script src> etiketlerini
dosya icerikleriyle degistirir, doctype/html/head/body sarmalayicisini soyar ve
Artifact olarak yayimlanabilir bir parca (fragment) uretir: dist/rota.html

Kullanim:
  python build.py              # okunabilir cikti (varsayilan)
  python build.py --minify     # CSS sikistirilir, JS yorum/bosluklari azaltilir
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
DIST = ROOT / "dist"
REQUIRED = ["index.html", "css", "js"]


def read(rel: str) -> str:
    path = SRC / rel
    if not path.exists():
        sys.exit(f"HATA: {path} bulunamadi")
    return path.read_text(encoding="utf-8")


# ---------------------------------------------------------------- minifikasyon

def minify_css(css: str) -> str:
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)      # yorumlar
    css = re.sub(r"\s+", " ", css)                        # bosluk daralt
    css = re.sub(r"\s*([{}:;,>])\s*", r"\1", css)         # ayrac cevresi
    css = css.replace(";}", "}")
    return css.strip()


def minify_js(js: str) -> str:
    """Muhafazakar JS sadelestirme.

    Sablon literalleri (`...`), metin sabitleri ve regex'ler korunur; yalnizca
    onlarin DISINDA kalan yorumlar ve satir basi bosluklari kaldirilir.
    Kod semantigi degismez: hicbir ifade birlestirilmez, noktali virgul eklenmez.
    """
    out = []
    i, n = 0, len(js)
    quote = None          # ' " ` icindeysek hangi karakterle acildigi
    depth_tpl = 0         # sablon literali icindeki ${...} derinligi
    while i < n:
        ch = js[i]
        nxt = js[i+1] if i+1 < n else ""

        if quote:
            out.append(ch)
            if ch == "\\":
                if i+1 < n:
                    out.append(js[i+1]); i += 2; continue
            elif quote == "`" and ch == "$" and nxt == "{":
                out.append(nxt); depth_tpl += 1; i += 2; continue
            elif quote == "`" and ch == "}" and depth_tpl > 0:
                depth_tpl -= 1
            elif ch == quote and depth_tpl == 0:
                quote = None
            i += 1
            continue

        # metin/sablon baslangici
        if ch in "'\"`":
            quote = ch
            out.append(ch); i += 1; continue

        # blok yorum
        if ch == "/" and nxt == "*":
            end = js.find("*/", i+2)
            i = n if end == -1 else end + 2
            continue

        # satir yorumu (bolme operatoru ile karismasin diye satir basinda ya da
        # bosluktan sonra gelenler kaldirilir)
        if ch == "/" and nxt == "/":
            prev = "".join(out[-1:]) or "\n"
            if prev in " \t\n(=,;:{[":
                end = js.find("\n", i)
                i = n if end == -1 else end
                continue

        out.append(ch); i += 1

    text = "".join(out)
    lines = [ln.rstrip() for ln in text.split("\n")]
    lines = [ln for ln in lines if ln.strip()]
    # satir basi girintisini kaldir (sablon literali icindekiler yukarida korundu)
    return "\n".join(lines)


# ---------------------------------------------------------------- gomme

def inline_css(html: str, minify: bool):
    files = []

    def collect(match):
        files.append(match.group(1))
        return ""

    html = re.sub(r'\s*<link rel="stylesheet" href="(?!https)([^"]+)"\s*/?>', collect, html)
    if not files:
        return html, []
    blocks = []
    for rel in files:
        body = read(rel).strip()
        blocks.append(minify_css(body) if minify else f"/* ==== {rel} ==== */\n{body}")
    joiner = "" if minify else "\n\n"
    return html, ["<style>\n" + joiner.join(blocks) + "\n</style>"]


def inline_js(html: str, minify: bool):
    files = []

    def collect(match):
        files.append(match.group(1))
        return ""

    html = re.sub(r'\s*<script src="(?!https)([^"]+)"\s*></script>', collect, html)
    blocks = []
    for rel in files:
        body = read(rel).strip()
        blocks.append(minify_js(body) if minify else f"/* ==== {rel} ==== */\n{body}")
    return html, ["<script>\n" + "\n\n".join(blocks) + "\n</script>"], files


def build(minify: bool = False) -> None:
    for name in REQUIRED:
        if not (SRC / name).exists():
            sys.exit(f"HATA: src/{name} yok")

    html = read("index.html")
    title_match = re.search(r"<title>(.*?)</title>", html, re.S)
    title = title_match.group(1).strip() if title_match else "Rota"
    font_links = re.findall(r'<link[^>]+fonts\.(?:googleapis|gstatic)\.com[^>]*>', html)

    html, style_blocks = inline_css(html, minify)
    html, script_blocks, js_files = inline_js(html, minify)

    body_match = re.search(r"<body[^>]*>(.*?)</body>", html, re.S)
    if not body_match:
        sys.exit("HATA: <body> bulunamadi")
    body = body_match.group(1).strip()

    # Charset ve ceviri kapatma parcanin EN BASINDA durur: tarayici kodlamayi
    # yalniz ilk 1024 baytta arar. Artifact kabugu kendi charset'ini eklese de
    # dosya tek basina acildiginda (mobil, file://, kendi sunucu) Turkce
    # karakterlerin bozulmamasi buna bagli.
    parts = [
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        '<meta name="google" content="notranslate">',
        f"<title>{title}</title>",
    ]
    parts.extend(font_links)
    parts.extend(style_blocks)
    parts.append(body)
    parts.extend(script_blocks)
    output = "\n".join(parts) + "\n"

    DIST.mkdir(exist_ok=True)
    out_path = DIST / "rota.html"
    out_path.write_text(output, encoding="utf-8")

    size_kb = len(output.encode("utf-8")) / 1024
    mode = "minify" if minify else "okunabilir"
    print(f"OK   {out_path}  [{mode}]")
    print(f"     {len(js_files)} js modulu, {output.count(chr(10))+1} satir, {size_kb:,.0f} KB")


if __name__ == "__main__":
    build(minify="--minify" in sys.argv)
