#!/usr/bin/env python3
"""king/hafiza.py sınaması: HKM satırları GERÇEK şemadan (HKM/core/db.py, göçleriyle) kurulur, goc.topla_hkm gibi
sütun -> değer gövdesine çevrilir; içerik uydurmadır. Çıkış 0 yeşil, 1 kırmızı. python king/hafiza_test.py"""
import inspect
import os
import sys

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.join(KOK, "king"))
sys.path.insert(0, os.path.join(KOK, "HKM"))
sys.path.insert(0, os.path.join(KOK, "sistem"))
import goc  # noqa: E402
import hafiza  # noqa: E402
from core import db  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass
kirmizi = 0


def dogru(ad, kosul, ek=""):
    global kirmizi
    print(("  ✓ " if kosul else "  ✕ ") + ad + ("" if kosul else "  %r" % (ek,)))
    kirmizi += 0 if kosul else 1


def ret(f, satir):
    try:
        f(satir)
    except ValueError as e:
        return str(e)
    return None


con = db.connect(":memory:")
sutun = {t: [r[1] for r in con.execute('PRAGMA table_info("%s")' % t)] for t in hafiza.GOC}
Z = "2026-11-13T09:00:00+03:00"
satirlar = {
    "memories": [
        ("ben", "all", "Sabah koşmayı severim.", "explicit", "active", Z, None, None, None, None, None, None, None),
        ("ben", "king", "Kahveyi şekersiz içer.", "kural", "aday", Z, None, None, None, "sohbet", None, None, None),
        ("ben", "all", "Model uydurması.", "model", "active", Z, None, None, None, "soz", None, None, None),
        ("tg:42", "spi", "Süresi geçmiş bilgi.", "kullanici", "active", Z, "2026-01-01T00:00:00", None, None, "soz", "spi", "d1", Z),
        ("ben", "all", "   ", "explicit", "active", Z, None, None, None, None, None, None, None),
        ("ben", "all", "Bilinmeyen durum.", "explicit", "silindi", Z, None, None, None, None, None, None, None),
    ],
    "conversations": [("local", "user", "Merhaba King.", 0, Z, None, 0), ("telegram", "manager", "Merhaba.", 1, Z, "bio", 1),
                      ("local", "user", "", 0, Z, "king", 0)],
    "usage": [(Z, "2026-11-13", "ben", "king", "sohbet", "openrouter", "m1", 100, 20, 0, 5, 0.0012, 0.04, 34.1, 0, 0, 1,
               None, "mesaj", 10, None, 850, "bulut", None, 300)],
}
SORGU = {"memories": "INSERT INTO memories(user,scope,text,source,state,created_at,expires_at,last_used_at,forgotten_at,"
                     "katman,modul,dis_id,onaylandi_at) VALUES (%s)" % ",".join("?" * 13),
         "conversations": "INSERT INTO conversations(channel,role,text,audio_retained,created_at,agent,arsiv) VALUES (?,?,?,?,?,?,?)",
         "usage": "INSERT INTO usage(created_at,day,user,role,task,provider,model,in_tok,out_tok,image_tok,reason_tok,usd,try_,"
                  "rate,cached,escalated,ok,note,veri,cached_tok,is_id,ms,seviye,neden,ilk_ms) VALUES (%s)" % ",".join("?" * 25)}
govde = {}
for t, l in satirlar.items():
    con.executemany(SORGU[t], l)
    govde[t] = [dict(zip(sutun[t], r)) for r in con.execute('SELECT * FROM "%s" ORDER BY rowid' % t)]   # goc.topla_hkm gövdesi

print("hafiza: şema")
for t in hafiza.GOC:
    eksik_metin = " ".join(hafiza.EKSIK[t])
    sessiz = [c for c in sutun[t] if c not in hafiza.OKUR[t] and c not in eksik_metin]
    dogru("%s: her sütun okunur ya da EKSIK'te adıyla" % t, not sessiz, sessiz)
    dogru("%s: okunan sütunlar gerçek şemada" % t, set(hafiza.OKUR[t]) <= set(sutun[t]), set(hafiza.OKUR[t]) - set(sutun[t]))
    dogru("%s: goc HKM_GERCEK'te, arşivde değil" % t, t in goc.HKM_GERCEK and t not in goc.HKM_ARSIV)

print("hafiza: hafıza bağdaştırıcısı")
h = govde["memories"]
k, n = hafiza.hafiza(h[0])
dogru("etkin, katmanı boş -> «soz», kimlik hafiza/1", (k["durum"], k["katman"], k["id"], n) == ("etkin", "soz", "hafiza/1", []), (k, n))
dogru("metin ve zaman olduğu gibi (ISO)", k["metin"] == "Sabah koşmayı severim." and k["olusturma"] == Z)
dogru("aday -> öneri", hafiza.hafiza(h[1])[0]["durum"] == "oneri")
k, n = hafiza.hafiza(h[2])
dogru("model kaynaklı etkin satır öneriye iner (model hafızaya yazmaz)", k["durum"] == "oneri" and len(n) == 1, (k, n))
k, n = hafiza.hafiza(h[3])
dogru("«ben» olmayan kişi adı notlanır, ad taşınmaz", "user" not in k and any("ben" in x for x in n), (k, n))
dogru("kapsam, modül, dış kimlik, onay taşınır", (k["kapsam"], k["modul"], k["dis_id"], k["onay"]) == ("spi", "spi", "d1", Z))
dogru("boş metin ret", ret(hafiza.hafiza, h[4]) == "Metni boş hafıza kaydı taşınmaz.")
dogru("bilinmeyen durum ret (içeriksiz neden)", ret(hafiza.hafiza, h[5]) == "Hafıza durumu bilinmiyor (state).")

print("hafiza: sohbet ve kullanım")
s = govde["conversations"]
k, _ = hafiza.sohbet(s[0])
dogru("kişi sözü: rol kisi, görevli varsayılan king, arşivde değil", (k["rol"], k["gorevli"], k["arsiv"], k["ses"]) == ("kisi", "king", False, False), k)
k, _ = hafiza.sohbet(s[1])
dogru("King sözü, arşivli ve ses işaretli; görevli korunur", (k["rol"], k["gorevli"], k["arsiv"], k["ses"], k["kanal"]) == ("king", "bio", True, True, "telegram"), k)
dogru("boş sohbet satırı ret", ret(hafiza.sohbet, s[2]) == "Boş sohbet satırı taşınmaz.")
k, _ = hafiza.kullanim(govde["usage"][0])
u = govde["usage"][0]
dogru("kullanım: ölçülmüş sütunlar değeriyle aynı", all(k[a] == u[a] for a in hafiza.OKUR["usage"] if a != "id"), k)
dogru("kullanım: kişi adı yok, kimlik kullanim/1", "user" not in k and k["id"] == "kullanim/1", k)

print("hafiza: okuma kapısı ve öneri")
kayit = [hafiza.hafiza(x)[0] for x in h[:4]] + [hafiza.sohbet(x)[0] for x in s[:2]]
kayit.append(dict(hafiza.hafiza(h[0])[0], id="hafiza/99", ozel=True, olusturma="2026-11-14T00:00:00"))
l = hafiza.listele(kayit, "hafiza", simdi="2026-11-13T12:00:00")
dogru("etkin hafıza: öneri, süresi geçmiş ve özel dışarıda", [x["id"] for x in l] == ["hafiza/1"], [x["id"] for x in l])
dogru("öneriler ayrı listelenir", [x["id"] for x in hafiza.listele(kayit, "hafiza", durum="oneri")] == ["hafiza/2", "hafiza/3"])
dogru("sohbet: arşive kalkan görünmez", [x["id"] for x in hafiza.listele(kayit, "sohbet")] == ["sohbet/1"])
o = hafiza.oner("Akşam yürüyüşü sever.", zaman=Z)
dogru("öneri yalnız nesne: durum oneri", o == {"tur": "hafiza", "durum": "oneri", "metin": "Akşam yürüyüşü sever.",
                                               "katman": "sohbet", "kaynak": "king", "olusturma": Z}, o)
dogru("boş ya da 600'den uzun öneri ret", ret(hafiza.oner, "") and ret(hafiza.oner, "x" * 601))
kaynak = inspect.getsource(hafiza)
dogru("modülde yazan yol yok (sqlite, open, INSERT)", not any(x in kaynak for x in ("sqlite3", "open(", "INSERT", "UPDATE ")))

print(("✕ %d kırmızı" % kirmizi) if kirmizi else "✓ hepsi yeşil")
sys.exit(1 if kirmizi else 0)
