# -*- coding: utf-8 -*-
from core import db, memory, sohbet
from tests.harness import eq, no, ok, suite, test


def run():
    suite("hafiza")

    def t_only_explicit_command_writes():
        con = db.connect(":memory:")
        eq(memory.command(con, "Cuma spor yapıyorum"), None)
        eq(con.execute("SELECT COUNT(*) FROM memories").fetchone()[0], 0)
        r = memory.command(con, "Bunu hatırla: cuma spor yapıyorum")
        ok(r["result"]["ok"])
        eq(con.execute("SELECT text FROM memories").fetchone()[0],
           "cuma spor yapıyorum")
    test("yalniz acik komut kalici hafiza yazar", t_only_explicit_command_writes)

    def t_scope_separates_context():
        con = db.connect(":memory:")
        memory.add(con, "genel tercih", scope="all")
        memory.add(con, "sağlık tercihi", scope="spi")
        ok("genel tercih" in memory.context(con, scope="academic"))
        no("sağlık tercihi" in memory.context(con, scope="academic"))
        ok("sağlık tercihi" in memory.context(con, scope="spi"))
    test("hafiza kapsami gorevlileri ayirir", t_scope_separates_context)

    def t_user_can_list_and_forget():
        con = db.connect(":memory:")
        id_ = memory.add(con, "erken çalışmayı seviyorum")["id"]
        ok("erken çalışmayı" in memory.command(con, "hafızam")["text"])
        ok(memory.command(con, "%d unut" % id_)["result"]["ok"])
        eq(memory.list_active(con), [])
    test("kullanici hafizasini gorur ve unutur", t_user_can_list_and_forget)

    def t_chat_handles_memory_before_model():
        con = db.connect(":memory:")
        r = sohbet.konus(con, {}, "hatırla: sabah çalışırım", "2026-09-15")
        eq(r["mode"], "memory")
        ok("Hafızaya eklendi" in r["text"])
    test("hafiza komutu modele para harcamadan calisir", t_chat_handles_memory_before_model)

    # ---- katman, kaynak izni ----------------------------------------
    #
    # Modullerle ayni sozlesme (brand/ortak/hafiza.js): model hicbir
    # katmana yazamaz; «cikarim» yalniz kural motorundan gelir ve her
    # zaman «tahmin» etiketiyle gorunur.

    def t_model_cannot_write():
        con = db.connect(":memory:")
        r = memory.add(con, "kullanıcı gitarı sever", source="model")
        no(r["ok"])
        ok("Model" in r["note"])
        no(memory.add(con, "x", katman="cikarim", source="explicit")["ok"])
        ok(memory.add(con, "deneme haftasında uyku düşüyor", katman="cikarim",
                      source="kural")["ok"])
        no(memory.add(con, "x", katman="uydurma")["ok"])
        eq(con.execute("SELECT COUNT(*) FROM memories").fetchone()[0], 1)
    test("model hafizaya yazamaz; cikarim yalniz kuraldan", t_model_cannot_write)

    def t_context_carries_labels():
        con = db.connect(":memory:")
        memory.add(con, "sabahları verimliyim")
        memory.add(con, "deneme haftasında uyku düşüyor", katman="cikarim", source="kural")
        b = memory.context(con, scope="king")
        ok("senin sözün" in b and "sabahları verimliyim" in b)
        ok("tahmin" in b and "uyku düşüyor" in b)
    test("baglam her satirin katmanini tasir", t_context_carries_labels)

    # ---- gorevli -> kapsam ------------------------------------------
    #
    # HATA: sohbet.py baglami `scope=gorevli` ile istiyordu; gorevli adi
    # «bio», kapsam adi «spi». «spi» kapsamli hafiza SPI gorevlisine HIC
    # ulasmiyordu. King ust patrondur: butun kapsamlari gorur.

    def t_agent_scope_mapping():
        con = db.connect(":memory:")
        memory.add(con, "laktoz dokunuyor", scope="spi")
        memory.add(con, "pazar çalışmam", scope="ays")
        memory.add(con, "genel tercih", scope="all")
        bio = memory.context(con, scope="bio")
        ok("laktoz" in bio and "genel tercih" in bio)
        no("pazar" in bio)
        ok("pazar" in memory.context(con, scope="academic"))
        king = memory.context(con, scope="king")
        ok("laktoz" in king and "pazar" in king and "genel tercih" in king)
    test("gorevli kendi modulunun hafizasini gorur, King hepsini", t_agent_scope_mapping)

    def t_commands_match_modules():
        con = db.connect(":memory:")
        ok(memory.command(con, "unutma: pazar çalışmam")["result"]["ok"])
        ok(memory.command(con, "Aklında tut: sabah koşarım")["result"]["ok"])
        r = memory.command(con, "Benim hakkımda ne biliyorsun?")
        ok("pazar çalışmam" in r["text"] and "senin sözün" in r["text"])
        eq(memory.command(con, "unutmuşum"), None)
    test("hafiza komutlari modullerle ayni dili konusur", t_commands_match_modules)

    # ---- modulden gelen hafiza (anlik goruntu esitleme) -------------
    #
    # Modul hafizasinin TAMAMINI yollar; HKM kendi kopyasini ona esitler.
    # Ayni goruntu iki kez gelirse hicbir sey degismez. Modulde silinen
    # kayit HKM'de de etkinligini yitirir. HKM'de unutulan modul kaydi
    # bir sonraki esitlemede GERI GELMEZ: HKM module yazamaz (AGENTS.md
    # §1.4), kullanicinin «unut» sozu de ezilemez.

    def _kayit(id_, metin, katman="soz", kaynak="kullanici"):
        return {"id": id_, "metin": metin, "katman": katman, "kaynak": kaynak,
                "at": "2026-09-20T10:00:00"}

    def t_module_sync_idempotent():
        con = db.connect(":memory:")
        r = memory.esitle(con, "ays", [_kayit("h1", "Pazar çalışmam"),
                                       _kayit("h2", "gitarı sever", kaynak="model")])
        ok(r["ok"])
        eq((r["eklenen"], r["reddedilen"]), (1, 1))
        r2 = memory.esitle(con, "ays", [_kayit("h1", "Pazar çalışmam")])
        eq((r2["eklenen"], r2["guncellenen"], r2["dusen"]), (0, 0, 0))
        satir = memory.list_active(con, scope="ays")
        eq(len(satir), 1)
        eq((satir[0]["modul"], satir[0]["katman"], satir[0]["scope"]), ("ays", "soz", "ays"))
    test("modul esitlemesi ayni goruntude hicbir sey degistirmez",
         t_module_sync_idempotent)

    def t_module_sync_follows_module():
        con = db.connect(":memory:")
        memory.esitle(con, "spi", [_kayit("a", "laktoz"), _kayit("b", "akşam yemem")])
        r = memory.esitle(con, "spi", [_kayit("a", "laktoz dokunuyor")])
        eq((r["guncellenen"], r["dusen"]), (1, 1))
        metinler = [x["text"] for x in memory.list_active(con, scope="spi")]
        eq(metinler, ["laktoz dokunuyor"])
    test("modulde degisen ve silinen kayit HKM'ye yansir", t_module_sync_follows_module)

    def t_forgotten_in_hkm_stays_forgotten():
        con = db.connect(":memory:")
        memory.esitle(con, "esp", [_kayit("x", "diksiyonu sevmiyorum")])
        id_ = memory.list_active(con, scope="esp")[0]["id"]
        ok(memory.forget(con, id_)["ok"])
        memory.esitle(con, "esp", [_kayit("x", "diksiyonu sevmiyorum")])
        eq(memory.list_active(con, scope="esp"), [])
    test("HKM'de unutulan modul kaydi geri gelmez", t_forgotten_in_hkm_stays_forgotten)

    def t_module_sync_rejects_bad_input():
        con = db.connect(":memory:")
        no(memory.esitle(con, "king", [])["ok"])
        no(memory.esitle(con, "ays", "bozuk")["ok"])
        r = memory.esitle(con, "ays", [None, {"id": "", "metin": "x"}, _kayit("k", "")])
        eq((r["eklenen"], r["reddedilen"]), (0, 3))
    test("esitleme bozuk girdiyi reddeder", t_module_sync_rejects_bad_input)

    # ---- kat zinciri (brand/ortak/ofis.js ile ayni) -----------------

    def t_king_knows_the_chain():
        k = sohbet.sistem_metni("king", "")
        ok("baş patron" in k and "teklif" in k)
        for g in ("bio", "academic", "intellect"):
            ok("King'e bağlısın" in sohbet.sistem_metni(g, ""))
    test("King ve gorevliler kat zincirini bilir", t_king_knows_the_chain)
