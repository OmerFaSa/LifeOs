#!/usr/bin/env python3
"""ESP — kaynak dosyalardan tek dosyalik dagitim uretir.

src/index.html icindeki yerel <link rel="stylesheet"> ve <script src> etiketlerini
dosya icerikleriyle degistirir, doctype/html/head/body sarmalayicisini soyar ve
Artifact olarak yayimlanabilir bir parca (fragment) uretir: dist/esp.html

Kullanim:
  python build.py              # okunabilir cikti (varsayilan)
  python build.py --minify     # CSS sikistirilir, JS yorum/bosluklari azaltilir
"""

import base64
import re
import shutil
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


def stamp() -> str:
    """Derleme damgasini src/js/data/build.js icine yazar ve kimligi doner.

    Ekrandaki sayfanin hangi derleme oldugunu soyleyen tek sey budur.
    Tarayici eski bir js dosyasini onbellekten verdiginde arayuz ayni
    gorunur ama davranis eskidir; damga olmadan bunu anlamanin yolu yok.
    """
    import subprocess
    from datetime import datetime, timezone

    def git(*args):
        try:
            return subprocess.run(["git"] + list(args), cwd=ROOT,
                                  capture_output=True, text=True, timeout=5).stdout.strip()
        except Exception:
            return ""

    sha = git("rev-parse", "--short", "HEAD") or "surumsuz"
    # Calisma kopyasinda kaydedilmemis degisiklik varsa damga bunu SOYLER:
    # "bu derleme bir commit'e karsilik gelmiyor" demek durustur.
    kirli = bool(git("status", "--porcelain", "--", "src", "build.py"))
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")

    body = (
        "/* DERLEME DAMGASI — bu dosyayi elle duzenleme.\n"
        "   build.py her derlemede yeniden yazar. */\n\n"
        "window.ESP = window.ESP || {};\n\n"
        "ESP.BUILD = { id:'%s', at:'%s', dirty:%s };\n"
        % (sha, now, "true" if kirli else "false")
    )
    (SRC / "js" / "data" / "build.js").write_text(body, encoding="utf-8")
    return sha


def copy_brand_assets() -> None:
    """Marka gorselleri/videosu METNE gomulmez — HTML'e kopyalanirsa dosya
    boyutu megabaytlarca sisiyor (video ~1.8MB). Bunun yerine dist/ yaninda
    ayri dosya olarak durur, index.html'deki gibi ayni goreli yoldan
    okunur. Kaynagi degistirmek (ayni ad, yeni icerik) tek gerekli adim;
    kod hic degismez. """
    src_dir = SRC / "img" / "brand"
    if not src_dir.exists():
        return
    dst_dir = DIST / "img" / "brand"
    dst_dir.mkdir(parents=True, exist_ok=True)
    for f in src_dir.iterdir():
        if f.is_file():
            shutil.copy2(f, dst_dir / f.name)


# SEVIYE:dist-bas
# ===== BU BLOK URETILMISTIR — BURAYI DUZENLEME =====
# Kaynak: brand/seviye/dist_kopya.py
# Yayan:  python3 tools/seviye.py --yay   (denetim: --denetle)
def copy_level_assets() -> None:
    """Rutbe kartlari ve kademe sahneleri TEK KOPYA durur: depo
    kokundeki brand/seviye/medya/. Uc sistem de onlari /img/seviye/...
    adresinden okur (bkz. devserver.py ve sunucu.py). Tek dosya surumu
    ise kendi basina tasinabilmeli, bu yuzden burada dist/img/seviye/
    icine kopyalanir.

    Yalniz `medya/` kopyalanir. `brand/seviye/eski/` servis EDILMEZ ve
    buraya da girmez: arsivlenmis bir dosyayi uc dagitima birden
    tasimak, sakladigin seyi uc kez tasimaktir.

    Klasor yoksa ya da bossa hicbir sey yapilmaz: eksik gorsel hata
    degildir, perde karti kendisi cizer."""
    src_dir = ROOT.parent / "brand" / "seviye" / "medya"
    if not src_dir.exists():
        return
    medya = [f for f in src_dir.iterdir()
             if f.is_file() and f.suffix.lower() in (".mp4", ".webm", ".png",
                                                     ".jpg", ".webp", ".svg")]
    if not medya:
        return
    dst_dir = DIST / "img" / "seviye"
    dst_dir.mkdir(parents=True, exist_ok=True)
    for f in medya:
        shutil.copy2(f, dst_dir / f.name)

    # KAYNAKTA OLMAYAN DOSYA HEDEFTE DE KALMAZ. Bu betik uzun sure
    # yalniz KOPYALIYORDU: adi degisen ya da arsive kaldirilan bir
    # medya dosyasi uc `dist/` icinde yasamaya devam ediyordu. Olculdu
    # — `kademe-1.mp4` arsive alindiktan sonra uc dagitimda 4,6 MB'lik
    # olu kopya olarak duruyordu. Dagitim, kaynagin AYNASIDIR.
    # MARKA MEDYASI da tek dosya surumune gider. Ayri bir klasorden
    # gelir (`brand/medya/<aile>/`) ama AYNI duz adla servis edilir —
    # aile addan turer, yoldan degil (bkz. `_ortak_marka_yolu`).
    marka_kok = ROOT.parent / "brand" / "medya"
    marka = []
    if marka_kok.is_dir():
        for aile in sorted(marka_kok.iterdir()):
            if not aile.is_dir():
                continue
            marka += [f for f in sorted(aile.iterdir())
                      if f.is_file() and f.suffix.lower() in (
                          ".mp4", ".webm", ".png", ".jpg", ".webp", ".svg")]
    if marka:
        m_dst = DIST / "img" / "marka"
        m_dst.mkdir(parents=True, exist_ok=True)
        for f in marka:
            shutil.copy2(f, m_dst / f.name)
        m_kalan = {f.name for f in marka}
        for eski in m_dst.iterdir():
            if eski.is_file() and eski.name not in m_kalan:
                eski.unlink()

    kalanlar = {f.name for f in medya}
    for eski in dst_dir.iterdir():
        if eski.is_file() and eski.name not in kalanlar:
            eski.unlink()
# ===== URETILMIS BLOK SONU =====
# SEVIYE:dist-bit


def pwa_etiketleri(html: str) -> list:
    """Kaynak <head>'deki TELEFON etiketlerini tek dosya surumune tasir.

    Tek dosya surumu telefona kopyalanip «Ana ekrana ekle» ile kurulmak
    icin var (bkz. README, «Telefonda kullanim»). Ama bu betik uzun sure
    <head>'i SIFIRDAN yaziyordu — dort etiket ve baslik — ve kaynaktaki
    su bes satir sessizce dusuyordu:

        <link id="pwa-manifest" rel="manifest">
        <link rel="icon" ...>
        <meta name="theme-color" ...>
        <meta name="apple-mobile-web-app-capable" ...>
        <meta name="apple-mobile-web-app-title" ...>

    Sonucu olculdu: `installManifest()` (app.js) `#pwa-manifest`
    dugumunu bulamayip sessizce donuyor, iOS'ta uygulama tam ekran
    acilmiyor ve sekme ikonu hic gelmiyordu. Yani telefona kopyalanan
    dosya, telefon icin yazilmis her seyi kaybediyordu.

    Etiketler ELLE YAZILMAZ, kaynaktan cikarilir: yarin <head>'e bir
    tanesi daha eklenirse burasi da tasir.
    """
    desenler = [
        r'<link[^>]+id="pwa-manifest"[^>]*>',
        r'<link[^>]+rel="icon"[^>]*>',
        r'<meta[^>]+name="theme-color"[^>]*>',
        r'<meta[^>]+name="apple-mobile-web-app-[^"]*"[^>]*>',
    ]
    out = []
    for d in desenler:
        out.extend(re.findall(d, html))
    return out


def ikonu_gom(etiketler: list) -> list:
    """Sekme ikonunu data URI olarak gomer.

    Tek dosya TEK DOSYADIR: telefona yalniz o kopyalanir, yanindaki
    `img/` klasoru gitmez. Goreli bir ikon yolu orada 404 verir — ve
    manifest ikonu da ayni etiketten okundugu icin (app.js,
    `installManifest`) kurulan uygulamanin ikonu bos kalirdi.
    """
    yol = SRC / "img" / "brand" / "favicon.png"
    if not yol.exists():
        return etiketler
    veri = base64.b64encode(yol.read_bytes()).decode("ascii")
    uri = "data:image/png;base64," + veri
    return [re.sub(r'href="[^"]*"', 'href="%s"' % uri, e)
            if 'rel="icon"' in e else e
            for e in etiketler]


def build(minify: bool = False) -> None:
    for name in REQUIRED:
        if not (SRC / name).exists():
            sys.exit(f"HATA: src/{name} yok")

    damga = stamp()

    html = read("index.html")
    title_match = re.search(r"<title>(.*?)</title>", html, re.S)
    title = title_match.group(1).strip() if title_match else "ESP"
    font_links = re.findall(r'<link[^>]+fonts\.(?:googleapis|gstatic)\.com[^>]*>', html)
    telefon_etiketleri = ikonu_gom(pwa_etiketleri(html))

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
    parts.extend(telefon_etiketleri)
    parts.extend(font_links)
    parts.extend(style_blocks)
    parts.append(body)
    parts.extend(script_blocks)
    output = "\n".join(parts) + "\n"

    DIST.mkdir(exist_ok=True)
    out_path = DIST / "esp.html"
    out_path.write_text(output, encoding="utf-8")
    copy_brand_assets()
    copy_level_assets()

    size_kb = len(output.encode("utf-8")) / 1024
    mode = "minify" if minify else "okunabilir"
    print(f"OK   {out_path}  [{mode}]")
    print(f"     {len(js_files)} js modulu, {output.count(chr(10))+1} satir, {size_kb:,.0f} KB")
    print(f"     damga {damga}")


if __name__ == "__main__":
    build(minify="--minify" in sys.argv)
