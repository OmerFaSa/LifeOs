#!/usr/bin/env python3
"""Kabul testi, gorev 020: King sinavi 300 cumle (belgeler/ekip/gorevler/020-king-sinav-300.md).

Sinar: tools/king_sinav.json en az 300 cumle; ilk 100 cumle degismemis; bicim gecerli;
cumleler tekrarsiz; beklenen araclar ve rotalar modulde gercekten var; her modul araci
en az iki cumlede beklenir; kosucu 300 cumleyle sonuna kadar kosar.
"""
import hashlib
import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
# 2026-11-12: King 5 tur 5-7 kodla cevaplanan olcu sorulari (tur:olcu) ve kiler araci beklentiye eklendi (KING-5.md).
ILK_100 = "a544f2a99607d34a783f645462179979140d990cefb5ade0cf93815bdfcc2793"
KARAR = re.compile(r"^(veri|merkez|ayar|git:(ays|spi|esp):[a-z_]+|arac:[a-z0-9_]+|tur:[a-z-]+)$")
EN_AZ = {"ays": 95, "spi": 90, "esp": 70, "genel": 45}
MODUL_ARACI = re.compile(r"^(ays_|spi_|esp_|eylem_)")
# Borc (2026-11-12): bu araclarin sinav cumlesi yok; gorev 065 sadelesme Faz 5'e baglandi (sozcuk yonlendirmesi
# 12 ust araca iner, AGENTS.md 0.1). Kume yalniz kuculur: yeni arac kuralda kirmizi, 2 cumlesi olan borctan cikar.
BORC = {
    "ays": {"ays_deneme", "ays_enerji", "ays_etkinlik", "ays_hafta_degerlendirme", "ays_kart", "ays_konu_durumu", "ays_mesgale_ekle", "ays_mola", "ays_profil", "ays_profiller", "ays_takvim", "ays_tekrarlarim", "ays_telafi", "ays_video_notu", "ays_yanlis", "ays_yanlis_teshis"},
    "spi": {"spi_antrenman_sil", "spi_butce", "spi_gida", "spi_hane", "spi_hane_oku", "spi_hedefler", "spi_ilac", "spi_ilac_alim", "spi_karar_kapat", "spi_kiler", "spi_kiler_oku", "spi_market", "spi_mutfak", "spi_ogun_sil", "spi_planlar", "spi_profil", "spi_tahlil_sil", "spi_tekrarlarim", "spi_yanlis_teshis"},
    "esp": {"esp_arguman", "esp_argumanlar", "esp_dosya", "esp_eser", "esp_hatirlatma", "esp_hedef", "esp_karar_kapat", "esp_kart_sil", "esp_kaynak", "esp_kitap", "esp_merdiven", "esp_not_sil", "esp_olay", "esp_olaylar", "esp_oturum", "esp_repertuvar", "esp_ses_kaydi", "esp_taslak", "esp_tekrarlarim", "esp_yanlis_teshis", "esp_zincir"},
}
BORC_EN_COK = 56


def hata(m):
    print("KABUL KIRMIZI:", m)
    sys.exit(1)


def node(*a):
    r = subprocess.run(["node", str(KOK / "tools" / "king_sinav.js"), "--port=4379", *a], cwd=KOK,
                       capture_output=True, text=True, encoding="utf-8", timeout=900)
    if r.returncode != 0:
        hata("king_sinav.js %s cikis %d: %s" % (" ".join(a), r.returncode, (r.stderr or r.stdout)[-400:]))
    return r.stdout


def sade(c):
    return re.sub(r"[^\w ]+", "", c.lower().replace("’", "'")).strip()


def main():
    s = json.loads((KOK / "tools" / "king_sinav.json").read_text(encoding="utf-8"))
    l = s.get("cumleler") or []
    if len(l) < 300:
        hata("cumle sayisi %d < 300" % len(l))
    h = hashlib.sha256(json.dumps(l[:100], ensure_ascii=False, sort_keys=True).encode()).hexdigest()
    if h != ILK_100:
        hata("ilk 100 cumle degismis (sira, metin ya da beklenen)")
    g = Counter(x.get("g") for x in l)
    for k, n in EN_AZ.items():
        if g[k] < n:
            hata("grup %s: %d cumle < %d" % (k, g[k], n))
    gorulen = {}
    ALANLAR = {"g", "m", "c", "b", "a", "not"}
    for i, x in enumerate(l):
        # «not»: beklentisi duzeltilen cumlenin gerekcesi (3a, KING-4 «Tur 3a»).
        if set(x) - ALANLAR:
            hata("%d: bilinmeyen alan %s" % (i, sorted(set(x) - ALANLAR)))
        if x.get("m") not in ("ays", "spi", "esp") or x.get("g") not in EN_AZ:
            hata("%d: m/g gecersiz: %r" % (i, x))
        c = x.get("c")
        if not isinstance(c, str) or not c.strip() or len(c) > 200:
            hata("%d: cumle bos ya da 200'den uzun" % i)
        b = x.get("b")
        if not isinstance(b, list) or not b or not all(isinstance(k, str) and KARAR.match(k) for k in b):
            hata("%d: beklenen gecersiz: %r" % (i, b))
        if "a" in x and not (isinstance(x["a"], dict) and x["a"] and any(k.startswith("arac:") for k in b)):
            hata("%d: a yalniz arac beklenen cumlede, bos olmayan nesne" % i)
        k = (x["m"], sade(c))
        if k in gorulen:
            hata("%d: %r, %d ile ayni" % (i, c, gorulen[k]))
        gorulen[k] = i

    adlar = json.loads(node("--adlar").strip().splitlines()[-1])
    beklenen = Counter()
    for i, x in enumerate(l):
        for k in x["b"]:
            if k.startswith("arac:"):
                if k[5:] not in adlar[x["m"]]["araclar"]:
                    hata("%d: %s %s modulunde yok" % (i, k, x["m"]))
                beklenen[(x["m"], k[5:])] += 1
            if k.startswith("git:") and k[4:] not in adlar[x["m"]]["rotalar"]:
                hata("%d: %s King'in sayfa katalogunda yok" % (i, k))
    if sum(len(v) for v in BORC.values()) > BORC_EN_COK:
        hata("borc kumesi buyumus (en cok %d); yeni araca 2 sinav cumlesi yaz" % BORC_EN_COK)
    for m, d in adlar.items():
        borc = BORC.get(m, set())
        for a in sorted(borc - set(d["araclar"])):
            hata("%s borcundaki %s artik arac kaydinda yok; BORC'tan cikar" % (m, a))
        for a in d["araclar"]:
            if not MODUL_ARACI.match(a):
                continue
            if a in borc:
                if beklenen[(m, a)] >= 2:
                    hata("%s araci %s artik %d cumlede; BORC'tan cikar" % (m, a, beklenen[(m, a)]))
            elif beklenen[(m, a)] < 2:
                hata("%s araci %s yalniz %d cumlede beklenmis (en az 2)" % (m, a, beklenen[(m, a)]))

    cikti = node()
    m = re.search(r"King sınavı: (\d+)/(\d+)", cikti)
    if not m or int(m.group(2)) != len(l):
        hata("kosucu %d cumleyi puanlamadi: %s" % (len(l), cikti[-300:]))
    print("king sinavi 300 kabul: %d cumle, bicim ve araclar gecerli, kosucu %s/%s." % (len(l), m.group(1), m.group(2)))


if __name__ == "__main__":
    main()
