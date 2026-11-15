#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""KOPRU OLCUMU — King koprulerinin (HKM/core/kopru.py) gecikme ve kuyruk sayaclarini calisan tek kapidan okur ve tablo yazar.

   python tools/kopru_olcum.py               # http://127.0.0.1:4180/api/kabuk/king/kopru (yalniz bu bilgisayardan)
   python tools/kopru_olcum.py --port 4398 --json
   python tools/kopru_olcum.py --selftest

   Salt okur: koprunun davranisina dokunmaz, cagri yapmaz (hal onbellekten; tazele yok). Sayaclar surec acildigindan beri
   bellektedir; sunucu yeniden baslayinca sifirlanir. Jeton ya da sir yazmaz (kopru.durum sir icermez).
"""
import argparse
import json
import sys
import urllib.request


def satirlar(kopruler):
    """kopru.durum() ciktisi -> okunur satirlar."""
    if not kopruler:
        return ["Merkez bu süreçte açık değil: köprü hâli bilinmiyor (veri yok)."]
    s = ["| Köprü | Hâl | Eş/kuyruk | Çalışan/bekleyen | İstek | Başarı | Hata | Zaman aşımı | Kuyruk dolu | Başarı % | Gecikme medyan/p95 (n) | Etiket |",
         "|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for ad in sorted(kopruler):
        k = kopruler[ad]
        c, g = k.get("sayac") or {}, k.get("gecikme_ms") or {}
        hal = "açık" if k.get("acik") else "kapalı"
        gec = "—" if not g.get("n") else "%s/%s ms (%s)" % (g.get("medyan"), g.get("p95"), g.get("n"))
        s.append("| %s | %s | %s/%s | %s/%s | %s | %s | %s | %s | %s | %s | %s | %s |" % (
            k.get("ad", ad), hal, k.get("sinir"), k.get("kuyruk"), k.get("calisan"), k.get("bekleyen"), c.get("istek", 0),
            c.get("basari", 0), c.get("hata", 0), c.get("zaman_asimi", 0), c.get("kuyruk_dolu", 0),
            "—" if k.get("basari_orani") is None else k["basari_orani"], gec, k.get("etiket", "veri yok")))
    return s


def oku(port):
    with urllib.request.urlopen("http://127.0.0.1:%d/api/kabuk/king/kopru" % port, timeout=10) as r:
        return json.loads(r.read().decode("utf-8")).get("kopruler")


def selftest():
    ornek = {"claude": {"ad": "Claude", "acik": True, "sinir": 2, "kuyruk": 4, "calisan": 1, "bekleyen": 0,
                        "sayac": {"istek": 3, "basari": 2, "hata": 1}, "basari_orani": 67,
                        "gecikme_ms": {"medyan": 900, "p95": 1400, "n": 2}, "etiket": "ölçüldü"},
             "antigravity": {"ad": "Antigravity", "acik": False, "sinir": 2, "kuyruk": 4, "calisan": 0, "bekleyen": 0,
                             "sayac": {}, "basari_orani": None, "gecikme_ms": {"n": 0}, "etiket": "veri yok"}}
    s = satirlar(ornek)
    assert len(s) == 4 and "| Antigravity | kapalı |" in s[2] and "| — | — | veri yok |" in s[2], s
    assert "900/1400 ms (2)" in s[3] and "| 67 |" in s[3], s
    assert "veri yok" in satirlar(None)[0]
    print("kopru_olcum selftest: geçti")
    return 0


def main(argv=None):
    p = argparse.ArgumentParser(description="King köprülerinin gecikme ve kuyruk ölçümü (salt okur)")
    p.add_argument("--port", type=int, default=4180)
    p.add_argument("--json", action="store_true", help="ham kopru.durum çıktısı")
    p.add_argument("--selftest", action="store_true")
    a = p.parse_args(argv)
    if a.selftest:
        return selftest()
    try:
        k = oku(a.port)
    except OSError as e:
        print("tek kapı %d'de yanıt vermedi: %s" % (a.port, e), file=sys.stderr)
        return 1
    print(json.dumps(k, ensure_ascii=False, indent=1) if a.json else "\n".join(satirlar(k)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
