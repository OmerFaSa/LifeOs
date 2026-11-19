# -*- coding: utf-8 -*-
"""Anahtarsiz kopruler (core/kopru.py): kuyruk, sinir, yeniden deneme, geri dusme.

Hicbir test Antigravity'ye ya da claude komutuna gitmez: cagri `_uygula` ya da
ai.ask'in `transport`u ile verilir."""

import threading
import time

from core import ai, db, kopru, models
from tests.harness import eq, no, ok, suite, test


def _taze(ad="claude", es=2, kuyruk=1):
    kopru._DURUM[ad] = kopru._Durum(es, kuyruk)
    kopru.BEKLE_SN = 0.01


def _cfg(atama=True):
    cfg = {"local_token": "x", "budget": {"ceiling_currency": "usd", "monthly_usd": 5.0,
                                          "usd_try": 0.0, "rate_date": ""}}
    if not atama:
        return cfg
    return models.apply(cfg, {"keys": {"google": "AIza-test"},
                              "assignments": {"king": {"provider": "google", "model": "gemini-2.5-pro"}}})


def run():
    suite("kopru")

    def t_sinir_ve_kuyruk():
        _taze(es=2, kuyruk=1)
        kapi, en_cok, simdi, kilit = threading.Event(), [0], [0], threading.Lock()

        def uygula(m, s, g, t):
            with kilit:
                simdi[0] += 1
                en_cok[0] = max(en_cok[0], simdi[0])
            kapi.wait(5)
            with kilit:
                simdi[0] -= 1
            return "tamam", 3, 4, False
        sonuc = []
        ip = [threading.Thread(target=lambda: sonuc.append(kopru.cagir("claude", "", "", [], sure=5, _uygula=uygula)))
              for _ in range(3)]
        for x in ip:
            x.start()
        for _ in range(100):                    # ikisi calisiyor, biri kuyrukta
            d = kopru._DURUM["claude"]
            if d.calisan == 2 and d.bekleyen == 1:
                break
            time.sleep(0.01)
        try:
            kopru.cagir("claude", "", "", [], sure=5, _uygula=uygula)
            ok(False, "dorduncu cagri kuyruk dolu demeliydi")
        except kopru.Gecici as e:
            ok("kuyruğu dolu" in str(e), str(e))
        kapi.set()
        for x in ip:
            x.join(5)
        eq(en_cok[0], 2)
        eq(len(sonuc), 3)
        h = kopru.durum()["claude"]
        eq((h["sayac"]["basari"], h["sayac"]["kuyruk_dolu"], h["calisan"], h["bekleyen"]), (3, 1, 0, 0))
        ok(h["gecikme_ms"]["n"] == 3 and h["basari_orani"] == 100, h)
    test("es zamanli sinir 2, kuyruk 1; fazlasi «kuyruk dolu» der; olcum tutulur", t_sinir_ve_kuyruk)

    def t_gecici_bir_kez_yeniden():
        _taze()
        deneme = []

        def uygula(m, s, g, t):
            deneme.append(1)
            if len(deneme) == 1:
                raise kopru.Gecici("ilk sefer bozuk")
            return "ikinci", None, None, False
        r = kopru.cagir("claude", "", "", [], sure=5, _uygula=uygula)
        eq((r[0], len(deneme), kopru._DURUM["claude"].sayac["yeniden"]), ("ikinci", 2, 1))

        def hep_bozuk(m, s, g, t):
            deneme.append(1)
            raise kopru.Gecici("yine bozuk")
        deneme.clear()
        try:
            kopru.cagir("claude", "", "", [], sure=5, _uygula=hep_bozuk)
            ok(False)
        except RuntimeError as e:
            ok("yine bozuk" in str(e))
        eq(len(deneme), kopru.DENEME)
    test("gecici hata bir kez yeniden denenir, sonra hata", t_gecici_bir_kez_yeniden)

    def t_kapali_yeniden_denenmez():
        _taze()
        deneme = []

        def kapali(m, s, g, t):
            deneme.append(1)
            raise kopru.Kapali("Antigravity açık değil")
        try:
            kopru.cagir("claude", "", "", [], sure=5, _uygula=kapali)
            ok(False)
        except kopru.Kapali:
            pass
        eq((len(deneme), kopru._DURUM["claude"].sayac["kapali"]), (1, 1))
        no(kopru.hal("claude")["acik"])         # sonraki soru onbellekten «kapali» der
        kopru._HAL.clear()
    test("kapali uygulama yeniden denenmez ve hal kapali olur", t_kapali_yeniden_denenmez)

    def t_antigravity_dokum():
        eq(kopru.ag_cevap([]), (False, None, None))
        eq(kopru.ag_cevap([{"type": "USER_INPUT"}, {"type": "PLANNER_RESPONSE", "status": "RUNNING"}]),
           (False, None, None))
        eq(kopru.ag_cevap([{"type": "PLANNER_RESPONSE", "status": "DONE", "tool_calls": [{"name": "x"}],
                            "content": "bakıyorum"}]), (False, None, None))
        eq(kopru.ag_cevap([{"type": "PLANNER_RESPONSE", "status": "DONE", "content": "Created At: 2026\nCevap."}]),
           (True, "Cevap.", None))
        b, m, h = kopru.ag_cevap([{"type": "ERROR_MESSAGE", "content": "quota"}])
        ok(b and m is None and h == "quota")
    test("Antigravity dokumunden bitmis cevap okunur, arac adimi cevap sayilmaz", t_antigravity_dokum)

    def t_istem():
        s = kopru.istem("Kural.", [{"role": "user", "content": "a"}, {"role": "assistant", "content": "b"},
                                   {"role": "user", "content": "c"}], aracsiz=True)
        ok(s.startswith("Hiçbir araç") and "Kullanıcı: a" in s and "Başbuğ: b" in s and s.index("c") > s.index("b"))
        ok(len(kopru.istem("", [{"role": "user", "content": "x" * 50000}])) <= kopru.EN_COK_ISTEM)
    test("istem tek metin, sinirli uzunluk", t_istem)

    def t_istem_kimlik_kirpilmaz():
        uzun = [{"role": "user" if i % 2 == 0 else "assistant", "content": "tur%d " % i + "y" * 2000} for i in range(40)]
        uzun.append({"role": "user", "content": "SON-SORU"})
        s = kopru.istem("KING-KIMLIGI-VE-KIP-TALIMATI", uzun, aracsiz=True)
        ok(len(s) <= kopru.EN_COK_ISTEM and s.startswith("Hiçbir araç") and "KING-KIMLIGI-VE-KIP-TALIMATI" in s
           and "SON-SORU" in s and s.endswith("yalnız cevabı yaz."), "baş ve son korunur")
        dev = "BAS-KIMLIK " + "k" * 40000 + " SON-KURAL"          # şişkin sistem metni: yalnız ortası kesilir
        s = kopru.istem(dev, [{"role": "user", "content": "SON-SORU"}])
        ok(len(s) <= kopru.EN_COK_ISTEM and s.startswith("BAS-KIMLIK") and "SON-KURAL" in s and "SON-SORU" in s)
    test("istem uzunsa baştaki kimlik/talimat düşmez, geçmişin eskisi düşer", t_istem_kimlik_kirpilmaz)

    def t_kapaliyken_merdiven_devralir():
        gidilen = []

        def tasiyici(provider, anahtar, model, sistem, mesajlar, **k):
            gidilen.append(provider)
            if provider == "claude":
                raise kopru.Kapali("Claude Code bu bilgisayarda bulunamadı.")
            return "Bugün matematik tekrarı iyi olur.", 10, 8, False
        con = db.connect(":memory:")
        ai.KOPRU.set("claude")
        try:
            r = ai.ask(con, _cfg(), "king", "sohbet", [{"role": "user", "content": "Ne çalışayım?"}],
                       transport=tasiyici)
        finally:
            ai.KOPRU.set("")
        ok(r["ok"] and r["provider"] == "google", r)
        eq(gidilen, ["claude", "google"])
        no(r["kopru"]["kullanildi"])
        ok("Claude" in r["kopru"]["not"] and "Sıradaki model" in r["kopru"]["not"], r["kopru"])
        u = [dict(x) for x in con.execute("SELECT provider, ok, usd FROM usage ORDER BY rowid")]
        eq([(x["provider"], x["ok"]) for x in u], [("claude", 0), ("google", 1)])
        eq(u[0]["usd"], 0.0)
    test("kopru kapaliyken King soyler ve siradaki model cevaplar; deftere yazilir", t_kapaliyken_merdiven_devralir)

    def t_kopru_cevaplar_bedelsiz():
        con = db.connect(":memory:")
        ai.KOPRU.set("antigravity:gemini-4-hydrogen-high")
        try:
            r = ai.ask(con, _cfg(atama=False), "king", "sohbet", [{"role": "user", "content": "Merhaba"}],
                       transport=lambda p, a, m, s, g, **k: ("Merhaba, buradayım.", None, None, False))
        finally:
            ai.KOPRU.set("")
        ok(r["ok"] and r["provider"] == "antigravity" and r["model"] == "gemini-4-hydrogen-high", r)
        ok(r["kopru"]["kullanildi"])
        eq(r["usd"], 0.0)
        no(r["price_estimated"])
    test("model atanmamis olsa da kopru cevaplar; bedel 0, tahmini fiyat yok", t_kopru_cevaplar_bedelsiz)

    def t_yedeksiz_kapali_durust():
        con = db.connect(":memory:")
        ai.KOPRU.set("antigravity")
        try:
            def kapali(*a, **k):
                raise kopru.Kapali("Antigravity açık değil.")
            r = ai.ask(con, _cfg(atama=False), "king", "sohbet", [{"role": "user", "content": "Merhaba"}],
                       transport=kapali)
        finally:
            ai.KOPRU.set("")
        no(r["ok"])
        ok(r["text"] is None)
        ok("Yedek model atanmamış" in r["kopru"]["not"], r["kopru"])
    test("yedek yoksa uydurma yok: cevap bos, not durust", t_yedeksiz_kapali_durust)

    def t_ayarlar():
        cfg = models.apply({"local_token": "x"}, {"assignments": {"king": {"provider": "claude", "model": "haiku"}}})
        a = models.resolve(cfg, "king")
        ok(a["key_set"] and a["provider"] == "claude")
        ok(ai.kopru_basamagi("claude:yok", "king")["atama"]["model"] == "sonnet")
        ok(ai.kopru_basamagi("openrouter", "king") is None)
        ok(all(p["id"] != "claude" or not p["key_set"] for p in models.read(cfg)["providers"]))
    test("kopru atanabilir, anahtar istemez; gecersiz secim yok sayilir", t_ayarlar)

    def t_hydrogen_varsayilan():
        # agentapi gecersiz kimligi sessizce flash'a dusurur (tur-20261116/king.md); varsayilan ve eski takma adlar hydrogen
        eq(ai.kopru_basamagi("antigravity", "king")["atama"]["model"], "gemini-4-hydrogen-medium")
        eq(ai.kopru_basamagi("antigravity:yok", "king")["atama"]["model"], "gemini-4-hydrogen-medium")
        eq([kopru.ag_model(x) for x in ("", None, "pro", "flash_lite", "flash", "gemini-4-hydrogen-low")],
           ["gemini-4-hydrogen-medium"] * 2 + ["gemini-4-hydrogen-high", "gemini-4-hydrogen-low", "gemini-4-hydrogen-medium",
                                               "gemini-4-hydrogen-low"])
        eq(kopru.SAGLAYICI["antigravity"]["modeller"], models.PROVIDERS["antigravity"]["models"])
    test("Antigravity varsayilani hydrogen; eski takma adlar hydrogen kademesine", t_hydrogen_varsayilan)

    def t_gecmis_butcesi():
        m = [{"role": "user" if i % 2 == 0 else "assistant", "content": ("tur%d " % i) + "kelime " * 100} for i in range(20)]
        l, kisa, atilan = kopru.gecmis_butcele(m, tam=6, kisa=50, butce=10 ** 6)
        eq((len(l), kisa, atilan), (20, 14, 0))
        ok(all(len(x["content"]) <= 52 for x in l[:-6]) and l[-6:] == m[-6:], "son alti tam, eskiler kisa")
        ok(l[0]["content"].startswith("tur0 ") and l[0]["content"].endswith("…"))
        l, _, atilan = kopru.gecmis_butcele(m, tam=6, kisa=50, butce=4000)
        ok(atilan > 0 and l[-1] == m[-1] and sum(len(x["content"]) for x in l) <= 4000, (atilan, len(l)))
        l, _, _ = kopru.gecmis_butcele([{"role": "user", "content": "x" * 9000}], butce=100)
        eq(len(l), 1)                               # son mesaj hic atilmaz
        eq(kopru.gecmis_butcele([{"role": "user", "content": "  "}, {"role": "user", "content": "a"}])[0],
           [{"role": "user", "content": "a"}])
        ok("eski turlar kısaltıldı" in kopru.istem("", m) and "tur19" in kopru.istem("", m))
    test("uzun gecmis: son turlar tam, eskiler kisa, butce asilirsa en eski atilir", t_gecmis_butcesi)

    def t_ag_devam():
        k = {"kimlik": "c1", "soru": "Thales kim?", "t": 100.0}
        m = [{"role": "user", "content": "Thales kim?"}, {"role": "assistant", "content": "Miletli bir düşünür."},
             {"role": "user", "content": "Neden su dedi?"}]
        ok(kopru.ag_devam_mi(k, m, simdi=200.0))
        no(kopru.ag_devam_mi(k, m, simdi=100.0 + kopru.AG_OTURUM_SN + 1), "bayat konusma")
        no(kopru.ag_devam_mi(dict(k, soru="baska"), m, simdi=200.0), "arada baska saglayici cevapladi")
        no(kopru.ag_devam_mi(k, m[-1:], simdi=200.0), "gecmis sifirlandi")
        no(kopru.ag_devam_mi(None, m))
        eq(kopru.ag_oturum_anahtari("", "flash"), "")
        ok(kopru.ag_oturum_anahtari("2026-11-16T10:00|ogretmen|", "") ==
           kopru.ag_oturum_anahtari("2026-11-16T10:00|ogretmen|", "gemini-4-hydrogen-medium"))
        ok(kopru.ag_oturum_anahtari("a", "flash") != kopru.ag_oturum_anahtari("a", "pro"))
    test("Antigravity ayni konusmaya yalniz gecmis tutarliysa devam eder", t_ag_devam)

    def t_ag_surekli_cagri():
        # Gercek akis: ilk tur new-conversation (tam istem), ikinci tur send-message (yalniz yeni mesaj);
        # cevap dokumun gonderimden SONRAKI kismindan okunur (oncekinin DONE cevabi yeni cevap sanilmaz).
        dokum, cagri = [], []

        def agentapi(exe, ortam, args, sure=60):
            cagri.append(args[0])
            if args[0] == "new-conversation":
                dokum[:] = [{"type": "USER_INPUT"}, {"type": "PLANNER_RESPONSE", "status": "DONE", "content": "Bir."}]
                return {"response": {"newConversation": {"conversationId": "c1"}}}
            dokum.extend([{"type": "USER_INPUT"}, {"type": "PLANNER_RESPONSE", "status": "DONE", "content": "İki."}])
            return {"response": {"sendMessage": {"recipientId": args[1]}}}
        eski = (kopru._agentapi, kopru._dokum, kopru._ag_sunucu)
        kopru._agentapi, kopru._dokum, kopru._ag_sunucu = agentapi, lambda k: list(dokum), lambda tazele=False: ("exe", {})
        jeton = kopru.OTURUM.set("2026-11-16T10:00|ortak|")
        try:
            kopru._AG_KONUSMA.clear()
            m1 = [{"role": "user", "content": "Selam"}]
            eq(kopru._antigravity("", "Sistem.", m1, 5)[0], "Bir.")
            m2 = m1 + [{"role": "assistant", "content": "Bir."}, {"role": "user", "content": "Devam"}]
            eq(kopru._antigravity("", "Sistem.", m2, 5)[0], "İki.")
            eq(cagri, ["new-conversation", "send-message"])
            kopru.OTURUM.set("")
            kopru._antigravity("", "Sistem.", m2, 5)
            eq(cagri[-1], "new-conversation")      # oturumsuz istek (Telegram, eski yuz): eskisi gibi
        finally:
            kopru.OTURUM.reset(jeton)
            kopru._agentapi, kopru._dokum, kopru._ag_sunucu = eski
            kopru._AG_KONUSMA.clear()
    test("Antigravity ikinci turda send-message ile devam eder, cevap yeni dokumden", t_ag_surekli_cagri)

    def t_kip_ve_ders():
        from core import sohbet
        eq([sohbet.kip_of(x) for x in ("ogretmen", "filozof", "ortak", "x", None)],
           ["ogretmen", "filozof", "ortak", "ortak", "ortak"])
        b = sohbet.ders_blogu({"asama": "A1", "unite": "U1", "ders": {
            "ad": "Thales", "ozet": "Su.", "durum": "taslak (onaysız)", "metin": ["Bir.", "İki."],
            "alistirmalar": [{"soru": "S?", "dogru": "GIZLI-CEVAP"}]}})
        ok(b.startswith("Açık ders") and "Ders: Thales" in b and "A1 › U1" in b and "taslak" in b and "Bir.\nİki." in b, b)
        no("GIZLI-CEVAP" in b, "alistirma cevabi modele gitmez")
        ok(len(sohbet.ders_blogu({"ders": {"ad": "x", "metin": ["kelime " * 3000]}}, sinir=1000)) <= 1020)
        eq(sohbet.ders_blogu({}), "")
        eq([sohbet.ders_oku(x) for x in ({"tur": "ders", "id": "../../x"}, {"tur": "ders", "alan": "dil", "id": "felsefe.1.1.1"},
                                         {"tur": "not", "id": "felsefe.1.1.1"}, "felsefe.1.1.1", None)], [""] * 5)
        gercek = sohbet.ders_oku({"tur": "ders", "alan": "felsefe", "id": "felsefe.1.1.1"})
        ok(gercek.startswith("Açık ders") and "Thales" in gercek, gercek[:120])   # alan/felsefe/asama-1.json
        l = sohbet.lifeos_blogu({"dilimler": [{"ad": "notlar", "ne": "notlar", "veri": [{"baslik": "Açık"}, {"baslik": "Sır", "ozel": True}]},
                                              {"ad": "bos", "ne": "boş", "veri": []}]})
        ok("Açık" in l and "Sır" not in l and "boş" not in l, l)
        eq(sohbet.lifeos_blogu({"dilimler": []}), "")
    test("kip talimati, ders blogu (cevapsiz, sinirli) ve Başbuğ blogu (ozelsiz)", t_kip_ve_ders)

    def t_kip_sisteme_girer():
        from core import sohbet
        olcu = {}

        def tas(provider, anahtar, model, sistem, mesajlar, ayar=None):
            olcu["sistem"] = sistem
            return "Tamam.", 10, 3
        con = db.connect(":memory:")
        ders = sohbet.ders_blogu({"ders": {"ad": "Thales ve arkhe", "metin": ["Su her şeyin ilkesidir."]}})
        sohbet.konus(con, _cfg(), "bunu bana anlatır mısın", "2026-11-16", transport=tas, kayit=False,
                     kip="filozof", ders=ders)
        ok("KİP: FİLOZOF" in olcu["sistem"] and "Thales ve arkhe" in olcu["sistem"], olcu["sistem"][-400:])
        sohbet.konus(con, _cfg(), "bunu bana anlatır mısın", "2026-11-16", transport=tas, kayit=False)
        no("KİP:" in olcu["sistem"] or "Açık ders" in olcu["sistem"], "kipsiz istek eskisi gibi")
    test("kip ve ders sistem metnine girer; kipsiz istek eskisi gibi", t_kip_sisteme_girer)

    def t_dokum_artimli():
        import json
        import os
        import shutil
        import tempfile
        from pathlib import Path
        d = tempfile.mkdtemp(prefix="kopru-dokum-")
        eski_beyin = kopru.BEYIN
        try:
            kopru.BEYIN = Path(d)
            log = Path(d) / "k1" / ".system_generated" / "logs" / "transcript.jsonl"
            log.parent.mkdir(parents=True, exist_ok=True)
            log.write_text('{"type":"USER_INPUT"}\n{"type":"PLANNER_RES', encoding="utf-8")
            s1, off1 = kopru._dokum_oku("k1", 0)
            eq(len(s1), 1)
            eq(s1[0]["type"], "USER_INPUT")
            s2, off2 = kopru._dokum_oku("k1", off1)
            eq((s2, off2), ([], off1))
            with open(log, "ab") as f:
                f.write(b'PONSE","status":"DONE","content":"Merhaba."}\n')
            s3, off3 = kopru._dokum_oku("k1", off1)
            eq(len(s3), 1)
            eq(kopru.ag_cevap(s3), (True, "Merhaba.", None))
            ok(off3 > off1)
            # Dosya kisalirsa bastan okur
            log.write_text('{"type":"PLANNER_RESPONSE","status":"DONE","content":"Yeni."}\n', encoding="utf-8")
            s4, off4 = kopru._dokum_oku("k1", off3 + 500)
            eq((len(s4), s4[0]["content"], off4 > 0), (1, "Yeni.", True))
        finally:
            kopru.BEYIN = eski_beyin
            shutil.rmtree(d, ignore_errors=True)
    test("Antigravity dokumu artimli ve yarim satir guvenli okunur", t_dokum_artimli)

    def t_buyuk_gecmis_ve_es_zaman():
        m = [{"role": "user" if i % 2 == 0 else "assistant", "content": ("mesaj%d " % i) + "kelime " * 30}
             for i in range(200)]
        l, kisa, atilan = kopru.gecmis_butcele(m, tam=6, kisa=80, butce=2500)
        ok(l[-6:] == [dict(x) for x in m[-6:]], "son 6 tam kalir")
        ok(sum(len(x["content"]) for x in l) <= 2500 and atilan > 0 and kisa > 0, (atilan, kisa))
        hatalar = []
        eski_hal = dict(kopru._HAL)
        eski_claude = kopru._claude_yolu
        kopru._claude_yolu = lambda: "claude-test"
        try:
            def isci():
                try:
                    for _ in range(30):
                        kopru.hal("claude", tazele=True)
                        kopru.durum()
                except Exception as exc:  # noqa: BLE001
                    hatalar.append(exc)
            ipler = [threading.Thread(target=isci) for _ in range(4)]
            for t in ipler:
                t.start()
            for t in ipler:
                t.join(5)
            eq(hatalar, [])
        finally:
            kopru._claude_yolu = eski_claude
            with kopru._HAL_KILIT:
                kopru._HAL.clear()
                kopru._HAL.update(eski_hal)
    test("200 mesajli gecmis butcelenir ve _HAL eszamanli erisimde yarismaz", t_buyuk_gecmis_ve_es_zaman)

    def t_claude_iptal():
        import os
        import shutil
        import sys
        import tempfile
        d = tempfile.mkdtemp(prefix="kopru-iptal-")
        eski_yol = kopru._claude_yolu
        try:
            if os.name == "nt":
                betik = os.path.join(d, "yavas.cmd")
                with open(betik, "w", encoding="utf-8") as f:
                    f.write('@echo off\n"%s" -c "import time; time.sleep(10)"\n' % sys.executable)
            else:
                betik = os.path.join(d, "yavas.sh")
                with open(betik, "w", encoding="utf-8") as f:
                    f.write('#!/bin/sh\nexec "%s" -c "import time; time.sleep(10)"\n' % sys.executable)
                os.chmod(betik, 0o755)
            kopru._claude_yolu = lambda: betik
            t0 = time.monotonic()
            sayac = [0]

            def iptal():
                sayac[0] += 1
                return sayac[0] >= 2

            try:
                kopru._claude(None, "", [{"role": "user", "content": "x"}], 10, iptal=iptal)
                ok(False, "iptal TimeoutError atmaliydi")
            except TimeoutError as e:
                ok("istemci gitti" in str(e) and time.monotonic() - t0 < 5, str(e))
        finally:
            kopru._claude_yolu = eski_yol
            shutil.rmtree(d, ignore_errors=True)
    test("claude cagrisi istemci iptalinde bekletmeden durur", t_claude_iptal)


