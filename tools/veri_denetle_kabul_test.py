#!/usr/bin/env python3
"""Gorev 006 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
tools/veri_denetle.py: nesne olmayan satir cokertmez, URL siki, ayni dosyada yinelenen kayit ihlal.
python tools/veri_denetle_kabul_test.py"""
import importlib.util
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("veri_denetle", KOK / "tools" / "veri_denetle.py")
V = importlib.util.module_from_spec(spec)
spec.loader.exec_module(V)

hata = []


def esit(ad, gercek, beklenen):
    if gercek != beklenen:
        hata.append("%s: %r != %r" % (ad, gercek, beklenen))


def ihlaller(katman, ad, metin):
    return {no: h for no, h in V.denetle_dosya(katman, ad, metin)}


TASLAK = '{"etiket": "dogrulanmamis", "x": 1}'
KAYNAKLI = '{"etiket": "kaynakli-birincil", "kaynak": "%s", "alinti": "a"}'

# 1) nesne olmayan satir: cokme yok, ihlal
for satir in ("[1, 2]", "5", '"metin"', "null"):
    try:
        h = ihlaller("taslak", "a.jsonl", satir)
    except Exception as e:  # noqa: BLE001
        hata.append("nesne olmayan satir cokertti %r: %r" % (satir, e))
        continue
    esit("nesne degil %s" % satir, list(h), [1])
    if 1 in h and not any("nesne değil" in x for x in h[1]):
        hata.append("nesne olmayan satirin ihlali 'nesne değil' demeli: %r" % h[1])
esit("bozuk JSON hala ihlal", list(ihlaller("taslak", "a.jsonl", "{bozuk")), [1])

# 2) URL siki: yalniz http:// ya da https://
for kaynak, gecerli in (("https://ornek.org/x", True), ("http://ornek.org", True), ("httpx-kitap", False),
                        ("http:ornek", False), ("HTTPS://ORNEK.ORG", True), ("", False)):
    h = ihlaller("temiz", "a.jsonl", KAYNAKLI % kaynak)
    esit("kaynak %r" % kaynak, not h, gecerli)

# 3) ayni dosyada icerikce ayni kayit (anahtar sirasi onemsiz) ikinci kez: ihlal, ilk satiri soyler
metin = "\n".join([TASLAK, '{"etiket": "dogrulanmamis", "x": 2}', "", '{"x": 1, "etiket": "dogrulanmamis"}'])
h = ihlaller("taslak", "a.jsonl", metin)
esit("yinelenen yalniz ikincisi", list(h), [4])
if 4 in h and not any("yinelenen" in x and "1" in x for x in h[4]):
    hata.append("yinelenen ihlali ilk satiri (1) soylemeli: %r" % h[4])
esit("farkli dosyada ayni kayit serbest", ihlaller("taslak", "b.jsonl", TASLAK), {})
esit("reddedilen neden kurali korunur", list(ihlaller("temiz", "reddedilen.jsonl", '{"x": 1}')), [1])

# 4) eski davranis korunur
esit("temiz taslak kaydi", ihlaller("taslak", "a.jsonl", TASLAK), {})
esit("taslakta kaynak alani", list(ihlaller("taslak", "a.jsonl", '{"etiket": "dogrulanmamis", "kaynak": "x"}')), [1])
esit("hesaplandi kaynak ister", list(ihlaller("temiz", "a.jsonl", '{"etiket": "hesaplandı"}')), [1])

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("veri_denetle kabul: nesne olmayan satir, siki URL, yinelenen kayit, eski kurallar.")
