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
if "en çok 3 tane" not in yuksek or "Denetçi" not in yuksek:
    hata.append("yuksek eforda 3 alt ajan olmali ve Denetci'nin inceleyecegi soylenmeli")
if "cd x; " not in A.soru_istemi("x", "i") or "AGENTS.md'yi yeniden okumana gerek yok" not in A.gorev_devam_istemi("w", "d", d, A.portlar(1)):
    hata.append("arastirmaci istemi kabugu, devam istemi kurallarin bilindigini soylemeli")
if "KARAR:" not in A.denetim_istemi("w", "003", "ag/003", d) or "4791" not in A.denetim_govde("w", "003", "ag/003", d):
    hata.append("denetim istemi KARAR bicimini ve denetci portlarini soylemeli")
den = A.denetim_govde("w", "003", "ag/003", d)
if "DENEME:" not in den or "bozmaya" not in den:
    hata.append("denetim istemi bozma denemesini zorunlu kilmali")
if not A.deneme_var("KARAR: temiz\n- DENEME: x -> y") or A.deneme_var("KARAR: temiz\nDeneme yapmadim"):
    hata.append("deneme_var DENEME satirini tanimali")
if A.DENETCI_EFOR != {"dusuk": "orta", "orta": "yuksek", "yuksek": "yuksek"}:
    hata.append("denetci bir ust kademede calismali")
g = "# 9\n**Dal:** `ag/9-x`\n**Efor:** orta\n**Kabul testi:** `tools/a_test.py`, `tools/b_test.py`  <!-- n -->\n## Sonuç\n- **Kabul testi:** `tools/c.py`\n"
if A.gorev_bilgi(g)["kabul"] != ["tools/a_test.py", "tools/b_test.py"]:
    hata.append("gorev_bilgi kabul: %r" % A.gorev_bilgi(g)["kabul"])
if A.gorev_bilgi(g.replace("**Kabul testi:** `tools/a_test.py`, `tools/b_test.py`", ""))["kabul"] != []:
    hata.append("Sonuc'taki «Kabul testi» satiri kabul testi sayilmamali")
if "DEĞİŞTİRME" not in A.kabul_satiri(["tools/a_test.py"]) or A.kabul_satiri([]) or "git diff" not in A.kabul_denetim_satiri(["x"]):
    hata.append("kabul satirlari")
for metin, beklenen in (("KARAR: temiz\nx", ("temiz", 0)), ("**KARAR: 2 bulgu**", ("bulgu", 2)), ("hic", None)):
    if A.karar_oku(metin) != beklenen:
        hata.append("karar_oku(%r) = %r" % (metin, A.karar_oku(metin)))
if A.yuva_sec({str(n): {"acik": True, "yuva": n} for n in range(1, A.YUVA_SAY - 1)}) != A.YUVA_SAY - 1:
    hata.append("uygulayici son bos yuvayi almali")
try:
    A.yuva_sec({str(n): {"acik": True, "yuva": n} for n in range(1, A.YUVA_SAY)})
    hata.append("denetci yuvasi uygulayiciya verilmemeli")
except SystemExit:
    pass
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
for yol, beklenen in ((WT + r"\tools\k_test.py", "deny"), (WT + "/tools/k_test.py", "deny"), (WT + r"\tools\k.py", "allow")):
    if K.arac_karari("replace_file_content", {"TargetFile": yol}, WT, False, ["tools/k_test.py"])[0] != beklenen:
        hata.append("kanca kabul testi %s -> %s olmali" % (yol, beklenen))

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
    dokum_yaz(A.BEYIN, "aracHata", [satir(0, "USER_INPUT", content="x"), satir(1, "PLANNER_RESPONSE", tool_calls=arac),
                                    satir(2, "GENERIC", "ERROR", content="target content not found")])
    if A.konusma_oku("aracHata")["hal"] != "çalışıyor":
        hata.append("taze arac hatasi calisiyor sayilmali (ajan tepki verecek)")
    os.utime(A.dokum_yolu("aracHata"), (time.time() - 600, time.time() - 600))
    if A.konusma_oku("aracHata")["hal"] != "hata":
        hata.append("tepkisiz kalan arac hatasi hata sayilmali")
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

    # ofis: ayni konusmada iki is adim araligiyla ayrilir; bos, kisa ve bagli konusma yeniden kullanilir
    ofis = "aaaaaaaa-2222-3333-4444-555555555555"
    dokum_yaz(A.BEYIN, ofis, [satir(0, "USER_INPUT", content="soru 1"),
                              satir(1, "PLANNER_RESPONSE", content="cevap 1", input_tokens=1000, cache_read_tokens=500),
                              satir(2, "SYSTEM_MESSAGE", content="soru 2"),
                              satir(3, "PLANNER_RESPONSE", content="cevap 2", input_tokens=2000, cache_read_tokens=1000)])
    k1, k2 = A.konusma_oku(ofis, bas=0, bit=2), A.konusma_oku(ofis, bas=2)
    if (k1["cevap"], k1["adim"], k1["hal"], k2["cevap"], k2["adim"], k2["baglam"]) != ("cevap 1", 2, "turu bitti", "cevap 2", 2, 3000):
        hata.append("is araligi: %r %r" % ({x: k1[x] for x in ("cevap", "adim")}, {x: k2[x] for x in ("cevap", "adim", "baglam")}))
    dd = {"s-1": {"tur": "soru", "model": "flash_lite", "konusma": ofis, "baslangic": 1}}
    if A.devam_edilebilir(dd, "arastirmaci", "flash_lite") != (ofis, 4):
        hata.append("bos konusma yeniden kullanilmali: %r" % (A.devam_edilebilir(dd, "arastirmaci", "flash_lite"),))
    if A.devam_edilebilir(dd, "arastirmaci", "pro") or A.devam_edilebilir(dd, "uygulayici", "flash_lite"):
        hata.append("baska model ya da rol ayni konusmayi almamali")
    dolu = {"s-%d" % i: dict(dd["s-1"]) for i in range(A.MAX_IS)}
    if A.devam_edilebilir(dolu, "arastirmaci", "flash_lite"):
        hata.append("MAX_IS dolunca yeni konusma acilmali")
    eski_sinir, A.BAGLAM_SINIR = A.BAGLAM_SINIR, 2000
    if A.devam_edilebilir(dd, "arastirmaci", "flash_lite"):
        hata.append("bagluk siniri asilinca yeni konusma acilmali")
    A.BAGLAM_SINIR = eski_sinir
    if A.devam_edilebilir({"s-1": dict(dd["s-1"], konusma=alt)}, "arastirmaci", "flash_lite"):
        hata.append("calisan konusmaya yeni is verilmemeli")
    u = A.uyeler([dict(ad="s-1", rol="arastirmaci", model="flash_lite", konusma=ofis, adim_bas=0, acik=False,
                       canli={"son_degisim": time.time(), "token": {"giris": 1, "cikis": 2, "onbellek": 3}}),
                  dict(ad="s-2", rol="arastirmaci", model="flash_lite", konusma=ofis, adim_bas=2, acik=True,
                       canli={"hal": "turu bitti", "baglam": 3000, "son_degisim": time.time(), "token": {"giris": 10, "cikis": 20, "onbellek": 30}}),
                  dict(ad="eski", rol="uygulayici", model="pro", konusma="x", adim_bas=0, acik=False,
                       canli={"son_degisim": time.time() - 86400}),
                  dict(ad="onceki", rol="arastirmaci", model="flash_lite", konusma="y", adim_bas=0, acik=False, baslangic=-1,
                       canli={"son_degisim": time.time()})])
    if len(u) != 1 or u[0]["isler"] != ["s-1", "s-2"] or u[0]["is"] != "s-2" or u[0]["token"] != {"giris": 11, "cikis": 22, "onbellek": 33}:
        hata.append("uyeler: %r" % u)

    # bekle: gorev Denetci bitmeden hazir sayilmaz; soru cevapla hazir
    simdi = time.time()
    g = {"ad": "007", "tur": "gorev", "asama": "inceleme", "denetim": "d-007", "canli": {"son_degisim": simdi}}
    for dn_asama, beklenen in (("çalışıyor", False), ("inceleme", True)):
        if A.hazir_mi(g, {"d-007": {"asama": dn_asama}}, simdi)[0] != beklenen:
            hata.append("hazir_mi denetci %s -> %s olmali" % (dn_asama, beklenen))
    if A.hazir_mi(dict(g, denetim="istendi"), {}, simdi)[0] or not A.hazir_mi(dict(g, denetim=None), {}, simdi + 600)[0]:
        hata.append("istenen denetci beklenmeli; hic gelmeyen 3 dakikadan sonra beklenmemeli")
    if A.hazir_mi({"tur": "gorev", "asama": "çalışıyor"}, {})[0] or not A.hazir_mi({"tur": "soru", "asama": "inceleme"}, {})[0]:
        hata.append("calisan is hazir degil, cevaplanan soru hazir")

    # kanca: ayni konusmada en son is verilen isin klasoru gecerli; teslimde Denetci kendiliginden
    A.yaz_durum({"003": {"tur": "gorev", "konusma": ana, "worktree": WT, "acik": True, "gorev": "003-olu-css.md", "etkin": 1},
                 "004": {"tur": "gorev", "konusma": ana, "worktree": WT.replace("003", "004"), "acik": True, "etkin": 2}})
    if K.ajan_bul(ana)[0] != "004":
        hata.append("ayni konusmada en son is verilen is secilmeli")
    A.yaz_durum({"005": {"tur": "gorev", "konusma": "c5", "worktree": WT, "acik": True, "gorev": "005.md"}})
    istenen = []
    eski_teslim, eski_spawn, eski_dur = K.teslim_edildi, K.SPAWN, K.dur_karari
    K.teslim_edildi, K.SPAWN = (lambda a: True), (lambda ad: istenen.append(ad) or True)
    K.dur_karari = lambda a, g, o: (False, "")
    if K.isle("Stop", {"conversationId": "c5", "fullyIdle": True}) != {} or istenen != ["005"]:
        hata.append("teslimde Denetci istenmeli: %r" % istenen)
    K.teslim_edildi = lambda a: False
    K.isle("Stop", {"conversationId": "c5", "fullyIdle": True})
    if istenen != ["005"]:
        hata.append("teslim yokken Denetci istenmemeli")
    K.teslim_edildi, K.SPAWN, K.dur_karari = eski_teslim, eski_spawn, eski_dur
    A.yaz_durum({"005": {"tur": "gorev", "konusma": "c5", "worktree": WT, "acik": True, "denetim": "d-005"}})
    if K.denetime_gonder("005"):
        hata.append("ikinci kez Denetci istenmemeli")
    o = K.isle("PreToolUse", {"conversationId": "c6", "toolCall": {"name": "write_file", "args": {}}})
    A.yaz_durum({"d-005": {"tur": "denetim", "konusma": "c6", "worktree": WT, "acik": True}})
    o = K.isle("PreToolUse", {"conversationId": "c6", "toolCall": {"name": "write_file", "args": {"TargetFile": WT + r"\x"}}})
    if o.get("decision") != "deny":
        hata.append("Denetci dosya yazamamali: %r" % o)

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

# ders defteri: son inceleme olcume, ders DERSLER.md'ye ve istemlere (gecici kok ve ajan klasoru)
with tempfile.TemporaryDirectory() as t:
    t, eski_kok, eski_ajan = Path(t), A.KOK, A.AJAN_KLASOR
    A.KOK, A.AJAN_KLASOR = t, t / "ajan"
    try:
        (t / A.GOREVLER).mkdir(parents=True)
        A.AJAN_KLASOR.mkdir()
        if A.dersler():
            hata.append("ders dosyasi yokken istem bos olmali")
        A.ders_ekle("007", "temiz")
        A.ders_ekle("008", "Boş   listede\nçöküyordu", simdi=1793448416)
        kayit = [json.loads(s) for s in (A.AJAN_KLASOR / "olcum.jsonl").read_text(encoding="utf-8").splitlines()]
        if [(k["no"], k["son"]) for k in kayit] != [("007", "temiz"), ("008", "bulgu")]:
            hata.append("ders olcum kaydi: %r" % kayit)
        if "- 008 (" not in A.dersler() or "Boş listede çöküyordu" not in A.dersler() or "007" in A.dersler():
            hata.append("ders istemi: %r" % A.dersler())
    finally:
        A.KOK, A.AJAN_KLASOR = eski_kok, eski_ajan

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("Ajan temiz: dokum okuyucu, arac cumlesi, klasor disi, efor, yuva ve port, istem, kanca kararlari, Stop siniri, kurulum, "
      "kabul testi, bozma denemesi, ders defteri.")
