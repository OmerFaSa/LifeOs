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
        ok("genel tercih" in memory.context(con, scope="king"))
        no("sağlık tercihi" in memory.context(con, scope="king"))
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
