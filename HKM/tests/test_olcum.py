# -*- coding: utf-8 -*-
"""KING-4 Olcum 1b: ai_olcum gunlugu (sure, jeton, rol), ayni istek
   onbellegi, rol basina baglam butcesi, sabit sistem metni once, soguk
   Gemma'da ses Whisper'a, sema surec basina bir kez."""
import os
import tempfile

from core import ai, butce, db, dinle, models, ses, sohbet
from tests.harness import eq, no, ok, suite, test


def _cfg():
    cfg = {"local_token": "x", "budget": {"ceiling_currency": "usd", "monthly_usd": 20.0}}
    return models.apply(models.apply(cfg, {"keys": {"openrouter": "sk-or-test"}}), {"paket": "S"})


def run():
    suite("olcum 1b")

    def t_gunluk():
        con = db.connect(":memory:")
        butce.record(con, role="king", task="sohbet", provider="yerel", model="gemma4:e2b",
                     in_tok=100, out_tok=20, ms=300)
        butce.record(con, role="king", task="sohbet", provider="yerel", model="gemma4:e2b",
                     in_tok=50, out_tok=10, ms=100, ok=False)
        butce.record(con, role="dinle", task="stt", provider="yerel", model="gemma4:e2b")
        r = butce.ai_olcum(con)
        eq((r["toplam"]["cagri"], r["toplam"]["giris"], r["toplam"]["cikis"]), (3, 150, 30))
        eq((r["toplam"]["sure_ms"], r["toplam"]["ort_ms"]), (400, 200), "olculmeyen sure ortalamaya girmez")
        eq([x["rol"] for x in r["satirlar"]], ["king", "dinle"])

    def t_ask_sure_ve_onbellek():
        con = db.connect(":memory:")
        cagri = []

        def sahte(provider, anahtar, model, sistem, mesajlar, ayar=None):
            cagri.append(model)
            return ("Merhaba, buradayım.", 40, 5, False, {})
        eski, ai._cagir, ai.ONBELLEK_SN = ai._cagir, sahte, 120
        ai._ONBELLEK.clear()
        akan = []
        try:
            m = [{"role": "user", "content": "selam"}]
            r1 = ai.ask(con, _cfg(), "king", "sohbet", m, baglam="Tarih: x", sistem="s")
            r2 = ai.ask(con, _cfg(), "king", "sohbet", m, baglam="Tarih: x", sistem="s", akis=akan.append)
            r3 = ai.ask(con, _cfg(), "king", "sohbet", m, baglam="Tarih: y", sistem="s")
        finally:
            ai._cagir, ai.ONBELLEK_SN = eski, 0
            ai._ONBELLEK.clear()
        eq(len(cagri), 2, "ikinci ayni istek modele gitmez; baglam degisince gider")
        ok(r2.get("onbellek") and r2["text"] == r1["text"] and r2["usd"] == 0.0)
        eq(akan, ["Merhaba, buradayım.", None], "onbellekten gelen cevap da akar")
        ok(r3["ok"] and not r3.get("onbellek"))
        ms = [x["ms"] for x in con.execute("SELECT ms FROM usage")]
        eq(len(ms), 2)
        ok(all(isinstance(x, int) and x >= 0 for x in ms), ms)

    def t_butce():
        uzun = "x" * 4000                               # ~1000 jeton
        m = [{"role": "user", "content": uzun}, {"role": "assistant", "content": uzun}] * 3 \
            + [{"role": "user", "content": "son soru"}]
        k, atilan = ai.butceye_sigdir("king", "s" * 400, m)
        ok(atilan > 0 and k[-1]["content"] == "son soru" and k[0]["role"] == "user", (atilan, len(k)))
        ok(ai._jeton_tahmini("s" * 400, *[x["content"] for x in k]) <= ai.baglam_butcesi("king"))
        eq(ai.butceye_sigdir("king", "s", m[-1:])[1], 0)
        eq((ai.baglam_butcesi("ays.sohbet"), ai.baglam_butcesi("bam.arastirma"), ai.baglam_butcesi("vp_bio")),
           (3000, 6000, ai.BAGLAM_VARSAYILAN))

    def t_sira():
        for kisa, serbest in ((False, False), (True, False), (True, True)):
            s = sohbet.sistem_metni("king", "Tarih: DEGISEN", kisa=kisa, serbest=serbest, ek="\n\nSABIT TALIMAT")
            ok(s.index("SABIT TALIMAT") < s.index("DEGISEN") and s.endswith("DEGISEN"), (kisa, serbest))

    def t_soguk_gemma():
        cfg = {"models": {"yerel": {"ekonomik": "gemma4:e2b", "gorsel": "qwen3-vl:4b"}}}
        isinan = []
        bul = {"bulundu": True, "exe": "w", "model": "m", "yollar": [{"exe": "w", "model": "m"}]}
        wav = ses.wav(b"\x00\x00" * 1600, 16000)
        r = dinle.yaziya(None, cfg, wav, calistir=lambda *a, **k: "Kırk beş dakika yürüdüm.", bul=bul,
                         getir=lambda url, t: {"models": [{"name": "qwen3-vl:4b"}]},
                         gonder=lambda url, g, t: isinan.append((g["model"], g["keep_alive"])))
        eq((r["motor"], r["metin"]), ("whisper", "Kırk beş dakika yürüdüm."))
        for _ in range(50):
            if len(isinan) == 2:
                break
            import time
            time.sleep(0.01)
        eq(isinan, [("qwen3-vl:4b", 0), ("gemma4:e2b", "30m")], "gorsel bosalir, Gemma isinir")
        ok(dinle.gemma_sicak(cfg, getir=lambda url, t: {"models": [{"name": "gemma4:e2b"}]}))
        ok(dinle.gemma_sicak(cfg, getir=lambda url, t: (_ for _ in ()).throw(OSError())), "bilinmiyorsa eski sira")

    def t_sema_bir_kez():
        d = tempfile.mkdtemp(prefix="hkm-sema-")
        p = os.path.join(d, "hkm.db")
        db.connect(p).close()
        ok(p in db._KURULU)
        os.remove(p)
        con = db.connect(p)                             # silinmis dosya yeniden kurulur
        ok(con.execute("SELECT COUNT(*) FROM usage").fetchone()[0] == 0)
        ok("ms" in [r["name"] for r in con.execute("PRAGMA table_info(usage)")])
        con.close()

    test("ai_olcum: sure, jeton, rol kirilimi", t_gunluk)
    test("her cagrinin suresi yazilir; ayni istek onbellekten", t_ask_sure_ve_onbellek)
    test("rol basina baglam butcesi en eski gecmisi atar", t_butce)
    test("sabit talimat degisen baglamin onunde", t_sira)
    test("soguk Gemma: kayit Whisper'la, Gemma isinir", t_soguk_gemma)
    test("sema surec basina bir kez, silinen dosya yeniden kurulur", t_sema_bir_kez)


def run_daemon():
    from tests.test_daemon import _Server
    suite("olcum 1b · uc")

    def t_uc():
        s = _Server()
        try:
            eq(s.call("/api/ai_olcum", token=None)[0], 401)
            st, r = s.call("/api/ai_olcum?date=2026-11-01")
            eq((st, r["gun"], r["toplam"]["cagri"]), (200, "2026-11-01", 0))
        finally:
            s.close()

    test("/api/ai_olcum bearer ister, gunu doner", t_uc)
