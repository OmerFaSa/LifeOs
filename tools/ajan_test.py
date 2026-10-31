#!/usr/bin/env python3
"""tools/ajan.py ve tools/ajan_kanca.py testi: dokum okuyucu, efor, yuva/port, istem, kanca kararlari.
python3 tools/ajan_test.py"""
import importlib.util
import json
import os
import sys
import tempfile
import time
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KOK / "tools"))
import ajan as A  # noqa: E402
import ajan_kanca as K  # noqa: E402

hata = []
WT = r"C:\Users\ASUS\LifeOs-ajan\003"


def satir(i, tur, durum="DONE", **k):
    return dict(step_index=i, type=tur, status=durum, created_at="2026-10-31T09:%02d:00Z" % i, **k)


def dokum_yaz(kok, kimlik, satirlar):
    y = kok / kimlik / ".system_generated" / "logs"
    y.mkdir(parents=True)
    (y / "transcript.jsonl").write_text("\n".join(json.dumps(s, ensure_ascii=False) for s in satirlar) + "\n", encoding="utf-8")


# arac argumanlari dokumde JSON-kodlu metindir
if A.arglar({"CommandLine": '"git status"', "WaitMsBeforeAsync": "5000", "X": 3}) != {"CommandLine": "git status", "WaitMsBeforeAsync": "5000", "X": 3}:
    hata.append("arglar JSON-kodlu metni cozmeli")
if A.arac_cumle("run_command", {"CommandLine": "git status", "toolSummary": "Durum"}) != "Komut çalıştırıyor: Durum":
    hata.append("arac_cumle komut: %r" % A.arac_cumle("run_command", {"toolSummary": "Durum"}))
if A.arac_cumle("write_file", {"TargetFile": r"C:\x\brand\ortak\cam.css"}) != "Dosya yazıyor: cam.css":
    hata.append("arac_cumle dosya adini kisaltmali")
if A.arac_cumle("mcp_playwright_browser_snapshot", {}) != "MCP aracı: playwright_browser_snapshot":
    hata.append("arac_cumle mcp")

# klasor disi: Antigravity'nin kabugu ana klasorde acilir; cd'siz komut ve disari yazilan dosya yakalanir
bos = {"komut": "", "cwd": "", "yol": "", "arac": ""}
for a, beklenen in ((dict(bos, komut="git commit -m x"), "komut"),
                    (dict(bos, komut=WT.replace("003", "003; git status").join(["cd ", ""])), None),
                    (dict(bos, komut="git status", cwd="C:/Users/ASUS/LifeOs-ajan/003/AYS"), None),
                    (dict(bos, komut="git status", cwd=r"C:\Users\ASUS\LifeOs-ajan\0031"), "komut"),
                    (dict(bos, arac="write_file", yol=r"C:\Users\ASUS\LifeOs\brand\ortak\cam.css"), "dosya"),
                    (dict(bos, arac="write_file", yol=WT + r"\x.md"), None),
                    (dict(bos, arac="read_file", yol=r"C:\Users\ASUS\LifeOs\AGENTS.md"), None)):
    d = A.klasor_disi(a, WT)
    if (d and d[0]) != beklenen:
        hata.append("klasor_disi(%r) = %r" % (a, d))

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

# istem: klasor, dal, yuvanin portlari, efora gore alt ajan, arac siniri
d = A.gorev_dosyasi("003")
ist = A.gorev_istemi(r"C:\x\003", "ag/003-olu-css", d, A.portlar(3), "dusuk", "ek")
for parca in (r"C:\x\003\belgeler\ekip\gorevler\003-olu-css.md", "ag/003-olu-css", "4731", "4732", "4733",
              "Alt ajan açma", "Ek not: ek", "AÇILMAZ", "playwright", "hkm-sqlite"):
    if parca not in ist:
        hata.append("istemde yok: " + parca)
yuksek = A.gorev_istemi("w", "d", d, A.portlar(1), "yuksek")
if "en çok 3 tane" not in yuksek or "gözden geçirt" not in yuksek:
    hata.append("yuksek eforda 3 alt ajan ve gozden gecirici olmali")
if "cd x; " not in A.mini_istemi("x", "i"):
    hata.append("mini istem kabugun klasorunu soylemeli")
for s in sorted((KOK / "belgeler/ekip/gorevler").glob("[0-9][0-9][0-9]-*.md")):
    b = A.gorev_bilgi(s.read_text(encoding="utf-8"))
    if not b["dal"] or b["efor"] is None:
        hata.append("gorev dosyasinda dal ya da efor yok: " + s.name)

# kanca: arac kararlari (saf islev)
for (arac, args, mini), (karar, ust) in (
        (("run_command", {"CommandLine": '"git status"'}, False), ("allow", True)),
        (("run_command", {"CommandLine": "cd %s; git status" % WT}, False), ("allow", False)),
        (("run_command", {"CommandLine": "git status", "Cwd": WT + r"\AYS"}, False), ("allow", False)),
        (("run_command", {"CommandLine": "cd %s; git push origin main" % WT}, False), ("deny", False)),
        (("run_command", {"CommandLine": "cd %s; git push -u origin ag/003-olu-css" % WT}, False), ("allow", False)),
        (("run_command", {"CommandLine": "cd %s; git merge main" % WT}, False), ("deny", False)),
        (("run_command", {"CommandLine": "cd %s; git switch main" % WT}, False), ("deny", False)),
        (("run_command", {"CommandLine": "cd %s; git checkout -- AYS/x.js" % WT}, False), ("allow", False)),
        (("run_command", {"CommandLine": r"Get-Content C:\Users\ASUS\LifeOS-Sistem\HKM\config.json"}, False), ("deny", False)),
        (("run_command", {"CommandLine": r"cd C:\Users\ASUS\LifeOs; git commit -m x"}, False), ("deny", False)),
        (("run_command", {"CommandLine": "cd %s; git commit -m x" % WT}, True), ("deny", False)),
        (("write_file", {"TargetFile": r"C:\Users\ASUS\LifeOs\brand\ortak\cam.css"}, False), ("deny", False)),
        (("write_file", {"TargetFile": WT + r"\brand\ortak\cam.css"}, False), ("allow", False)),
        (("write_file", {"TargetFile": WT + r"\x.md"}, True), ("deny", False)),
        (("mcp_hkm-sqlite_write_query", {}, False), ("deny", False)),
        (("mcp_notion_notion_notion-create-pages", {}, False), ("deny", False)),
        (("mcp_playwright_browser_snapshot", {}, False), ("allow", False)),
        (("call_mcp_tool", {"ServerName": '"hkm-sqlite"'}, False), ("deny", False)),
        (("ask_question", {}, False), ("deny", False)),
        (("read_file", {"Path": r"C:\Users\ASUS\LifeOs\AGENTS.md"}, False), ("allow", False))):
    k, neden, u = K.arac_karari(arac, args, WT, mini)
    if (k, bool(u)) != (karar, ust):
        hata.append("kanca %s %r -> %s %r" % (arac, args, k, u))
    if u and not u["CommandLine"].startswith("Set-Location -LiteralPath '%s'; " % WT):
        hata.append("yonlendirme Set-Location ile baslamali: %r" % u)

# dokum: hal, cevap, araclar, token, alt ajan, kanca isleme (gecici klasorlerle)
with tempfile.TemporaryDirectory() as t:
    t = Path(t)
    A.BEYIN, A.AJAN_KLASOR = t / "brain", t / "ajan"
    A.DURUM_DOSYA = A.AJAN_KLASOR / "ajanlar.json"
    ana, alt = "11111111-2222-3333-4444-555555555555", "99999999-2222-3333-4444-555555555555"
    arac = [{"name": "run_command", "args": {"CommandLine": '"git status"', "toolSummary": '"Durum"'}}]
    dokum_yaz(A.BEYIN, ana, [satir(0, "USER_INPUT", content="Görevi yap"),
                             satir(1, "PLANNER_RESPONSE", tool_calls=arac, input_tokens=100, output_tokens=10, cache_read_tokens=5),
                             satir(2, "GENERIC", content="Created At: x\nOn branch ag/003"),
                             satir(3, "PLANNER_RESPONSE", content="Testler geçti, dal push edildi.", input_tokens=50, output_tokens=20)])
    k = A.konusma_oku(ana, wt=WT)
    if (k["adim"], k["hal"], k["araclar"], k["cevap"]) != (4, "turu bitti", {"run_command": 1}, "Testler geçti, dal push edildi."):
        hata.append("konusma_oku: %r" % {x: k[x] for x in ("adim", "hal", "araclar", "cevap")})
    if k["token"] != {"giris": 150, "cikis": 30, "onbellek": 5} or k["simdi"] != "Komut çalıştırıyor: Durum":
        hata.append("token/simdi: %r %r" % (k["token"], k["simdi"]))
    if [x["tur"] for x in k["disari"]] != ["komut"]:
        hata.append("cd'siz komut disari sayilmali: %r" % k["disari"])
    if k["son_adimlar"][2]["metin"] != "On branch ag/003":
        hata.append("arac sonucundaki zaman satirlari atilmali: %r" % k["son_adimlar"][2]["metin"])
    dokum_yaz(A.BEYIN, alt, [satir(0, "SYSTEM_MESSAGE", content="[Message] sender=%s priority=HIGH content=CSS ara" % ana),
                             satir(1, "PLANNER_RESPONSE", tool_calls=arac), satir(2, "GENERIC", "RUNNING")])
    if A.konusma_oku(alt)["hal"] != "çalışıyor" or A.ebeveyn(alt) != ana or A.ebeveyn(ana) is not None:
        hata.append("alt ajan hali ya da ebeveyni yanlis")
    s = A.alt_ajanlar(ana, time.time() - 60)
    if len(s) != 1 or s[0]["konusma"] != alt or s[0]["istem"] != "CSS ara":
        hata.append("alt_ajanlar: %r" % s)
    dokum_yaz(A.BEYIN, "hatali", [satir(0, "USER_INPUT", content="x"), satir(1, "ERROR_MESSAGE", content="kota")])
    if A.konusma_oku("hatali")["hal"] != "hata" or A.konusma_oku("yok") is not None:
        hata.append("hata hali ya da kaydi olmayan konusma yanlis")
    eski = time.time() - 3600
    os.utime(A.dokum_yolu(ana), (eski, eski))
    dokum_yaz(A.BEYIN, "sessiz", [satir(0, "USER_INPUT", content="x"), satir(1, "PLANNER_RESPONSE", tool_calls=arac)])
    os.utime(A.dokum_yolu("sessiz"), (eski, eski))
    if A.konusma_oku("sessiz")["hal"] != "sessiz":
        hata.append("on dakikadir yazilmayan arac adimi sessiz sayilmali")

    # kanca: yalniz bizim konusmalarimiz; ana ve alt ajan bulunur, olay yazilir
    A.yaz_durum({"003": {"tur": "gorev", "konusma": ana, "worktree": WT, "acik": True, "gorev": "003-olu-css.md"}})
    # bos cevap Antigravity'de reddetmek sayilir: kullanicinin konusmasi "ask" ile normal izin akisina kalir
    if K.isle("PreToolUse", {"conversationId": "baskasi", "toolCall": {"name": "ask_question"}}) != {"decision": "ask"}             or K.isle("Stop", {"conversationId": "baskasi"}) != {}:
        hata.append("kanca kullanicinin kendi konusmasina notr donmeli")
    o = K.isle("PreToolUse", {"conversationId": alt, "toolCall": {"name": "run_command", "args": {"CommandLine": '"git status"'}}})
    if o.get("decision") != "allow" or "Set-Location" not in o.get("overwrite", {}).get("CommandLine", ""):
        hata.append("alt ajanin cd'siz komutu da yonlendirilmeli: %r" % o)
    o = K.isle("PreToolUse", {"conversationId": ana, "toolCall": {"name": "mcp_hkm-sqlite_write_query", "args": {}}})
    if o.get("decision") != "deny":
        hata.append("hkm-sqlite engellenmeli: %r" % o)
    ol = A.olaylar("003")
    if [x.get("karar") for x in ol] != ["yönlendirildi", "engellendi"]:
        hata.append("olaylar: %r" % ol)
    if K.isle("Stop", {"conversationId": ana, "fullyIdle": False}).get("decision") != "continue":
        hata.append("arka planda is surerken durmamali")
    for _ in range(5):
        K.isle("Stop", {"conversationId": ana, "fullyIdle": False})
    if K.isle("Stop", {"conversationId": ana, "fullyIdle": False}) != {}:
        hata.append("Stop en cok %d kez devam ettirmeli" % K.STOP_SINIR)

    # kur: yalniz kendi anahtarini yazar/siler, kullanicinin diger kancalarina dokunmaz
    A.HOOKS = t / "config" / "hooks.json"
    A.HOOKS.parent.mkdir()
    A.HOOKS.write_text(json.dumps({"kullanicinin": {"Stop": []}}), encoding="utf-8")
    A.kur()
    h = json.loads(A.HOOKS.read_text(encoding="utf-8"))
    if set(h) != {"kullanicinin", A.KANCA_AD} or "ajan_kanca.py" not in h[A.KANCA_AD]["PreToolUse"][0]["hooks"][0]["command"]:
        hata.append("kur: %r" % h)
    A.kur(kaldir=True)
    if json.loads(A.HOOKS.read_text(encoding="utf-8")) != {"kullanicinin": {"Stop": []}}:
        hata.append("kur --kaldir yalniz kendi anahtarini silmeli")
    A.HOOKS.write_text("{bozuk", encoding="utf-8")
    try:
        A.kur()
        hata.append("bozuk hooks.json uzerine yazilmamali")
    except SystemExit:
        pass

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("Ajan temiz: dokum okuyucu, arac cumlesi, klasor disi, efor, yuva ve port, istem, kanca kararlari, Stop siniri, kurulum.")
