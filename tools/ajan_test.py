#!/usr/bin/env python3
"""tools/ajan.py testi: konusma kaydi okuyucu, efor, yuva/port, istem.  python3 tools/ajan_test.py"""
import importlib.util
import sqlite3
import sys
import tempfile
import time
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("ajan", KOK / "tools" / "ajan.py")
A = importlib.util.module_from_spec(spec)
spec.loader.exec_module(A)
hata = []


def vi(n):
    out = b""
    while True:
        b, n = n & 0x7F, n >> 7
        out += bytes([b | (0x80 if n else 0)])
        if not n:
            return out


def alan(no, govde):
    if isinstance(govde, str):
        govde = govde.encode("utf-8")
    return vi(no << 3 | 2) + vi(len(govde)) + govde


def sayi(no, n):
    return vi(no << 3) + vi(n)


# protobuf: ic ice mesajdaki metinler sirayla, sayilar atlanir
pb = alan(1, sayi(3, 7) + alan(2, "call_1") + alan(4, "run_command") + alan(5, '{"CommandLine":"git status","toolSummary":"Durum"}'))
if A.pb_metinler(pb) != ["call_1", "run_command", '{"CommandLine":"git status","toolSummary":"Durum"}']:
    hata.append("pb_metinler: %r" % A.pb_metinler(pb))
if A.pb_metinler(b"\xff\xff\xff") not in ([], None):
    hata.append("bozuk govde bos donmeli")
o = A.adim_ozet(15, 3, pb)
if (o["arac"], o["ozet"]) != ("run_command", "Durum"):
    hata.append("arac cagrisi: %r" % o)
cevap = alan(1, alan(2, "bot-64dd2089-a4c0-4e00-a594-0761c4b5cb6b") + alan(3, "Testler geçti, dal push edildi."))
if A.adim_ozet(15, 3, cevap)["metin"] != "Testler geçti, dal push edildi.":
    hata.append("model cevabi: %r" % A.adim_ozet(15, 3, cevap))

# klasor disi: Antigravity'nin kabugu ana klasorde acilir; cd'siz komut ve disari yazilan dosya yakalanir
wt = r"C:\Users\ASUS\LifeOs-ajan\003"
bos = {"komut": "", "cwd": "", "yol": "", "arac": ""}
for a, beklenen in ((dict(bos, komut="git commit -m x"), "komut"),
                    (dict(bos, komut=r"cd C:\Users\ASUS\LifeOs-ajan\003; git status"), None),
                    (dict(bos, komut="git status", cwd="C:/Users/ASUS/LifeOs-ajan/003/AYS"), None),
                    (dict(bos, komut="git status", cwd=r"C:\Users\ASUS\LifeOs-ajan\0031"), "komut"),
                    (dict(bos, arac="write_file", yol=r"C:\Users\ASUS\LifeOs\brand\ortak\cam.css"), "dosya"),
                    (dict(bos, arac="write_file", yol=r"C:\Users\ASUS\LifeOs-ajan\003\x.md"), None),
                    (dict(bos, arac="read_file", yol=r"C:\Users\ASUS\LifeOs\AGENTS.md"), None)):
    d = A.klasor_disi(a, wt)
    if (d and d[0]) != beklenen:
        hata.append("klasor_disi(%r) = %r" % (a, d))
if "AÇILMAZ" not in A.gorev_istemi(wt, "d", A.gorev_dosyasi("003"), A.portlar(1)) or "cd x; " not in A.mini_istemi("x", "i"):
    hata.append("istem kabugun klasorunu acikca soylemeli")

# efor
for g, b in (("düşük", "dusuk"), ("Orta", "orta"), ("yüksek", "yuksek"), ("YUKSEK", "yuksek"), ("pro", None), ("", None)):
    if A.efor_cevir(g) != b:
        hata.append("efor_cevir(%r) = %r" % (g, A.efor_cevir(g)))
if set(A.EFOR.values()) != {"flash_lite", "flash", "pro"}:
    hata.append("efor modelleri agentapi'nin kabul ettikleri olmali")

# yuva ve port: bos yuva, kapali ajan yer tutmaz, portlar baska denetimlerle carpismaz
if A.yuva_sec({"001": {"acik": True, "yuva": 1}, "002": {"acik": False, "yuva": 2}}) != 2:
    hata.append("yuva_sec kapali ajanin yuvasini vermeli")
butun = [p for n in range(1, A.YUVA_SAY + 1) for p in A.portlar(n).values()]
if len(set(butun)) != len(butun) or set(butun) & {4178, 4188, 4198, 4378, 4388, 4398, 4590, 4601, 4602, 4603, 4573, 4583, 4593}:
    hata.append("portlar carpisiyor: %r" % butun)

# istem: klasor, dal, yuvanin portlari, efora gore alt ajan
d = A.gorev_dosyasi("003")
ist = A.gorev_istemi(r"C:\x\003", "ag/003-olu-css", d, A.portlar(3), "dusuk", "ek")
for parca in (r"C:\x\003\belgeler\ekip\gorevler\003-olu-css.md", "ag/003-olu-css", "4731", "4732", "4733", "Alt ajan açma", "Ek not: ek"):
    if parca not in ist:
        hata.append("istemde yok: " + parca)
if "en çok 3 tane" not in A.gorev_istemi("w", "d", d, A.portlar(1), "yuksek"):
    hata.append("yuksek eforda alt ajan siniri 3 olmali")
for s in sorted((KOK / "belgeler/ekip/gorevler").glob("[0-9][0-9][0-9]-*.md")):
    b = A.gorev_bilgi(s.read_text(encoding="utf-8"))
    if not b["dal"] or b["efor"] is None:
        hata.append("gorev dosyasinda dal ya da efor yok: " + s.name)

# konusma kaydi: sahte .db ile hal, cevap, araclar, alt ajan


def db_yaz(yol, adimlar):
    c = sqlite3.connect(str(yol))
    c.execute("create table steps (idx integer primary key, step_type integer, status integer,"
              " has_subtrajectory numeric, step_payload blob, error_details blob)")
    c.executemany("insert into steps values (?,?,?,0,?,?)", adimlar)
    c.commit()
    c.close()


with tempfile.TemporaryDirectory() as t:
    A.KONUSMALAR = Path(t)
    ana, alt = "11111111-2222-3333-4444-555555555555", "99999999-2222-3333-4444-555555555555"
    db_yaz(Path(t) / (ana + ".db"), [(0, 14, 3, alan(1, "Görevi yap"), None), (1, 15, 3, pb, None),
                                     (2, 132, 3, alan(1, "On branch ag/003"), None), (3, 15, 3, cevap, None)])
    k = A.konusma_oku(ana)
    if (k["adim"], k["hal"], k["araclar"]) != (4, "turu bitti", {"run_command": 1}):
        hata.append("konusma_oku: %r" % {x: k[x] for x in ("adim", "hal", "araclar")})
    if k["cevap"] != "Testler geçti, dal push edildi.":
        hata.append("son cevap: %r" % k["cevap"])
    db_yaz(Path(t) / (alt + ".db"), [(0, 101, 3, alan(1, "[Message] sender=%s content=CSS ara" % ana), None), (1, 15, 3, pb, None)])
    if A.konusma_oku(alt)["hal"] != "çalışıyor":
        hata.append("arac cagrisinda biten konusma calisiyor sayilmali")
    s = A.alt_ajanlar(ana, time.time() - 60)
    if len(s) != 1 or s[0]["konusma"] != alt or s[0]["istem"] != "CSS ara":
        hata.append("alt_ajanlar: %r" % s)
    if A.alt_ajanlar(alt, time.time() - 60):
        hata.append("alt ajan kendi ebeveynini alt ajan saymamali")
    db_yaz(Path(t) / "hatali.db", [(0, 14, 3, alan(1, "x"), None), (1, 15, 3, pb, b"\x0a\x01e")])
    if A.konusma_oku("hatali")["hal"] != "hata":
        hata.append("hata ayrintisi olan adim hata sayilmali")
    if A.konusma_oku("yok") is not None:
        hata.append("kaydi olmayan konusma None donmeli")

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("Ajan temiz: protobuf okuyucu, arac/cevap, efor, yuva ve port, istem, konusma hali, alt ajan.")
