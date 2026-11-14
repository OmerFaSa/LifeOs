#!/usr/bin/env python3
"""Sahibin etiket kapısı (sistem/etiket.py + sunucu.py /api/kalite/etiket…) sınaması — yalnız stdlib.

Giris işleyicisi bu süreçte, BOŞ YÜKSEK PORTTA açılır; set klasörü geçici klasördür (gerçek kalite/veri/yerel'e
dokunulmaz), LOCALAPPDATA/APPDATA da geçici klasöre yönlenir.

  python tools/kalite_etiket_test.py
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import threading
import urllib.error
import urllib.request

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GECICI = tempfile.mkdtemp(prefix="kalite-etiket-")
os.environ["LOCALAPPDATA"] = os.environ["APPDATA"] = GECICI
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.join(KOK, "sistem"))
sys.path.insert(0, os.path.join(KOK, "kalite", "egri"))
import _sinav  # noqa: E402
import etiket  # noqa: E402
import hesap  # noqa: E402
import sunucu  # noqa: E402

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
hatali = toplam = 0


def dene(ad, tamam, ayrinti=""):
    global hatali, toplam
    toplam += 1
    hatali += not tamam
    print(("✓ " if tamam else "✕ ") + ad + ("" if tamam else " — %s" % (ayrinti,)))


VARSAYILAN = sunucu.ETIKET_DIZIN
DIZIN = os.path.join(GECICI, "yerel")
os.makedirs(DIZIN)
sunucu.ETIKET_DIZIN = DIZIN
srv = sunucu.ThreadingHTTPServer(("127.0.0.1", 0), sunucu.Giris)
threading.Thread(target=srv.serve_forever, daemon=True).start()
ADRES = "http://127.0.0.1:%d" % srv.server_address[1]


def iste(yol, govde=None, basliklar=None, ham=None):
    veri = ham if ham is not None else (json.dumps(govde).encode() if govde is not None else None)
    r = urllib.request.Request(ADRES + yol, data=veri, headers=dict({"Content-Type": "application/json"}, **(basliklar or {})))
    try:
        with urllib.request.urlopen(r, timeout=10) as c:
            return c.status, json.loads(c.read() or b"null")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"null")


def yaz(set_, satirlar):
    with open(etiket.dosya(DIZIN, set_), "w", encoding="utf-8", newline="\n") as f:
        f.writelines(json.dumps(r, ensure_ascii=False) + "\n" for r in satirlar)


def oku(set_):
    with open(etiket.dosya(DIZIN, set_), "rb") as f:
        return f.read()


try:
    dene("niyet listesi kalite/egri/_sinav.py ile aynı", etiket.NIYETLER == _sinav.NIYETLER)
    gi = subprocess.run(["git", "check-ignore", "kalite/veri/yerel/arama-aday.jsonl", "kalite/veri/yerel/anlama-aday.jsonl",
                         "kalite/veri/yerel/arama-aday.jsonl.yarim"], cwd=KOK, capture_output=True, text=True)
    dene("varsayılan set klasörü kalite/veri/yerel; setler ve yarım dosya git dışı",
         VARSAYILAN == os.path.join(KOK, "kalite", "veri", "yerel") and gi.returncode == 0 and len(gi.stdout.split()) == 3,
         (VARSAYILAN, gi.stdout, gi.stderr))

    k, g = iste("/api/kalite/etiket/adaylar?set=arama")
    dene("set dosyası yokken boş liste", k == 200 and g == {"ok": True, "set": "arama", "bekleyen": 0, "satirlar": []}, (k, g))
    dene("bilinmeyen set 400", iste("/api/kalite/etiket/adaylar?set=x")[0] == 400 and iste("/api/kalite/etiket/adaylar")[0] == 400)

    ARAMA = [{"id": "s%02d" % i, "soru": "soru %d" % i, "tarih": "2026-01-01", "kosul": "x",
              "adaylar": [{"no": "a1", "motor": "arama", "baslik": "B%d" % i, "ozet": "O", "kaynak": "alan/x.json", "kesinlik": "verified"},
                          {"no": "a2", "motor": "bam", "baslik": "C", "ozet": "P", "kaynak": "https://x", "kesinlik": "dogrulanmadi"}],
              "etiket": ["a1"] if i % 5 == 0 else None, "etiketleyen": "sahip" if i % 5 == 0 else ("model" if i % 2 else None)}
             for i in range(30)]
    yaz("arama", ARAMA)
    k, g = iste("/api/kalite/etiket/adaylar?set=arama")
    s0 = g["satirlar"][0] if g.get("satirlar") else {}
    dene("en çok 20 satır; sahibin etiketlediği gelmez, model taslağı bekleyen sayılır",
         k == 200 and len(g["satirlar"]) == 20 and g["bekleyen"] == 24 and all(r["id"] not in ("s00", "s05", "s10") for r in g["satirlar"]), g.get("bekleyen"))
    dene("yalnız gösterilecek alanlar: motor, etiket, kaynak, tarih gitmez",
         set(s0) == {"id", "metin", "adaylar"} and set(s0["adaylar"][0]) == {"no", "baslik", "ozet"} and s0["metin"] == "soru 1", s0)

    once = oku("arama")
    for ad, govde in (("bilinmeyen set", {"set": "x", "id": "s01", "etiket": []}),
                      ("bilinmeyen id", {"set": "arama", "id": "yok", "etiket": []}),
                      ("id dizge değil", {"set": "arama", "id": 1, "etiket": []}),
                      ("adayda olmayan numara", {"set": "arama", "id": "s01", "etiket": ["a9"]}),
                      ("aynı numara iki kez", {"set": "arama", "id": "s01", "etiket": ["a1", "a1"]}),
                      ("liste ya da «arama-degil» değil", {"set": "arama", "id": "s01", "etiket": "a1"}),
                      ("etiket yok", {"set": "arama", "id": "s01"})):
        k, g = iste("/api/kalite/etiket", govde)
        dene("POST %s → 400, dosya değişmez" % ad, k == 400 and g["ok"] is False and g["mesaj"] and oku("arama") == once, (k, g))
    for ad, ham in (("JSON değil", b"{bozuk"), ("nesne değil", b"[1]")):
        k, g = iste("/api/kalite/etiket", ham=ham)
        dene("POST gövde %s → 400" % ad, k == 400 and oku("arama") == once, (k, g))
    k, g = iste("/api/kalite/etiket", {"set": "arama", "id": "s01", "etiket": ["a2"]}, {"Origin": "http://kotu.example"})
    dene("başka bir sayfanın (Origin) isteği 403, dosya değişmez", k == 403 and oku("arama") == once, k)

    k, g = iste("/api/kalite/etiket", {"set": "arama", "id": "s01", "etiket": ["a2"]}, {"Origin": "http://127.0.0.1:%d" % sunucu.GIRIS_PORT})
    satir = [json.loads(x) for x in oku("arama").decode().splitlines()]
    dene("geçerli etiket yazılır: etiket, etiketleyen «sahip», zaman", k == 200 and g == {"ok": True}
         and satir[1]["etiket"] == ["a2"] and satir[1]["etiketleyen"] == "sahip" and len(satir[1]["etiket_zamani"]) == 19, (k, satir[1]))
    dene("öteki satırlar aynen kalır, yarım dosya kalmaz", satir[:1] + satir[2:] == ARAMA[:1] + ARAMA[2:]
         and os.listdir(DIZIN) == ["arama-aday.jsonl"], os.listdir(DIZIN))
    k, _ = iste("/api/kalite/etiket", {"set": "arama", "id": "s03", "etiket": "arama-degil"})
    k2, _ = iste("/api/kalite/etiket", {"set": "arama", "id": "s04", "etiket": []})
    dene("«arama-degil» ve boş liste (hiçbiri) geçerli", k == k2 == 200, (k, k2))
    k, g = iste("/api/kalite/etiket/adaylar?set=arama")
    dene("etiketlenen satır bir daha gelmez", g["bekleyen"] == 21 and "s01" not in [r["id"] for r in g["satirlar"]], g["bekleyen"])

    yaz("anlama", [{"id": "n1", "metin": "m", "king_bugun": "sohbet", "etiket": None, "etiketleyen": None}])
    k, g = iste("/api/kalite/etiket", {"set": "anlama", "id": "n1", "etiket": "uyku"})
    dene("anlama: beş niyet dışı etiket 400", k == 400, (k, g))
    k, g = iste("/api/kalite/etiket/adaylar?set=anlama")
    dene("anlama: King'in bugünkü kararı gösterilmez", k == 200 and g["satirlar"] == [{"id": "n1", "metin": "m", "adaylar": []}], g)
    k, g = iste("/api/kalite/etiket", {"set": "anlama", "id": "n1", "etiket": "kayit"})
    dene("anlama: niyet etiketi yazılır", k == 200 and json.loads(oku("anlama"))["etiket"] == "kayit", (k, g))

    with open(etiket.dosya(DIZIN, "anlama"), "a", encoding="utf-8") as f:
        f.write("{bozuk\n")
    once = oku("anlama")
    k, g = iste("/api/kalite/etiket", {"set": "anlama", "id": "n1", "etiket": "sohbet"})
    dene("bozuk set üstüne yazılmaz (400), dosya değişmez", k == 400 and oku("anlama") == once, (k, g))
    dene("bozuk set listelenemez (500)", iste("/api/kalite/etiket/adaylar?set=anlama")[0] == 500)

    gercek, hesap._yerel_mi = hesap._yerel_mi, lambda h: False
    try:
        once = oku("arama")
        k1 = iste("/api/kalite/etiket/adaylar?set=arama")[0]
        k2 = iste("/api/kalite/etiket", {"set": "arama", "id": "s02", "etiket": []})[0]
        dene("bu bilgisayar dışından iki yol da 403, dosya değişmez", k1 == k2 == 403 and oku("arama") == once, (k1, k2))
    finally:
        hesap._yerel_mi = gercek
finally:
    srv.shutdown()
    shutil.rmtree(GECICI, ignore_errors=True)

print("%d/%d test geçti" % (toplam - hatali, toplam))
sys.exit(1 if hatali else 0)
