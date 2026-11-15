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
        ok(s.startswith("Hiçbir araç") and "Kullanıcı: a" in s and "King: b" in s and s.index("c") > s.index("b"))
        ok(len(kopru.istem("", [{"role": "user", "content": "x" * 50000}])) <= kopru.EN_COK_ISTEM)
    test("istem tek metin, sinirli uzunluk", t_istem)

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
        ai.KOPRU.set("antigravity:pro")
        try:
            r = ai.ask(con, _cfg(atama=False), "king", "sohbet", [{"role": "user", "content": "Merhaba"}],
                       transport=lambda p, a, m, s, g, **k: ("Merhaba, buradayım.", None, None, False))
        finally:
            ai.KOPRU.set("")
        ok(r["ok"] and r["provider"] == "antigravity" and r["model"] == "pro", r)
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
