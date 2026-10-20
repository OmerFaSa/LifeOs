# -*- coding: utf-8 -*-
"""Dinle (core/dinle.py): Whisper varsa o, yoksa Gemini; ikisi de yoksa
   notlarla «yok». Gecersiz kayit reddedilir; uc bearer ister. Kural 6:
   CUDA'li ikili (ggml-cuda + cublas yaninda) turbo ile once; hata verirse
   CPU'da small; cublas'siz CUDA paketi CPU sayilir."""
import os
import tempfile

from core import butce, db, dinle, models, ses
from tests.harness import eq, no, ok, suite, test

WAV = ses.wav(b"\x00\x00" * 1600, 16000)


def _bul():
    d = tempfile.mkdtemp(prefix="hkm-whisper-")
    return {"bulundu": True, "exe": os.path.join(d, "whisper-cli.exe"),
            "model": os.path.join(d, "ggml-small.bin"), "aranan": [d], "metin": ""}


def _t_whisper_uydurma():
    """Sahada (2026-10-19): Whisper sessizlikte «(Müzik çalıyor)», «(KAPI
    TIKTIK)» yazdi; King «Müziği açtım» dedi. Etiket metin degildir."""
    from core import dinle as d
    for ham in ("(Müzik çalıyor)", "(KAPI TIKTIK)", "[Müzik]", "♪♪", "*alkış*", "(Gerilim müziği)",
                "Altyazı M.K.", "İzlediğiniz için teşekkürler.", "  ", "..."):
        if d._temiz(ham) != "":
            raise AssertionError("bos olmali: %r -> %r" % (ham, d._temiz(ham)))
    for ham, beklenen in (("(Müzik) Merhaba King", "Merhaba King"), ("Teşekkürler.", "Teşekkürler."),
                          ("«Nasılsın?»", "Nasılsın?"), ("Bugün [gürültü] uyku 7 saat", "Bugün uyku 7 saat")):
        if d._temiz(ham) != beklenen:
            raise AssertionError("%r -> %r, beklenen %r" % (ham, d._temiz(ham), beklenen))


def _kur(d, *dosyalar):
    for f in dosyalar:
        p = os.path.join(d, *f.split("/"))
        os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, "wb").close()


def _t_gpu_once():
    d = tempfile.mkdtemp(prefix="hkm-whisper-")
    _kur(d, "cuda/Release/whisper-cli.exe", "cuda/Release/ggml-cuda.dll", "cuda/Release/cublas64_12.dll",
         "Release/whisper-cli.exe", "Release/main.exe", "ggml-small.bin", "ggml-large-v3-turbo-q5_0.bin")
    eski = dinle._adaylar
    dinle._adaylar = lambda: [d]
    try:
        w = dinle.whisper_bul(ara=lambda x: None)
        eq([(os.path.relpath(y["exe"], d), os.path.basename(y["model"]), y["cuda"]) for y in w["yollar"]],
           [(os.path.join("cuda", "Release", "whisper-cli.exe"), "ggml-large-v3-turbo-q5_0.bin", True),
            (os.path.join("Release", "whisper-cli.exe"), "ggml-small.bin", False)])
        eq((w["bulundu"], w["cuda"]), (True, True))
        ok("GPU" in w["metin"] and "ggml-small.bin" in w["metin"], w["metin"])
        cagri = []

        def calistir(exe, model, wav, t, ng=False):
            cagri.append((os.path.basename(model), ng))
            if "turbo" in model:
                raise OSError("GPU dolu")
            return "Merhaba"
        eq(dinle.whisper(WAV, calistir=calistir, bul=w), ("Merhaba", ""))
        eq(cagri, [("ggml-large-v3-turbo-q5_0.bin", False), ("ggml-small.bin", False)])
        # cuBLAS yoksa CUDA paketi GPU'yu goremez: CPU sayilir, small secilir.
        os.remove(os.path.join(d, "cuda", "Release", "cublas64_12.dll"))
        os.remove(os.path.join(d, "Release", "whisper-cli.exe"))
        os.remove(os.path.join(d, "Release", "main.exe"))
        c = dinle.whisper_bul(ara=lambda x: None)
        eq([(os.path.basename(y["model"]), y["cuda"]) for y in c["yollar"]], [("ggml-small.bin", False)])
        # Yalniz CUDA'li ikili varsa yedek ayni ikiliyle «-ng» (CPU).
        _kur(d, "cuda/Release/cublas64_12.dll")
        g = dinle.whisper_bul(ara=lambda x: None)
        eq([(y["cuda"], y.get("ng")) for y in g["yollar"]], [(True, None), (False, True)])
        cagri.clear()
        dinle.whisper(WAV, calistir=calistir, bul=g)
        eq(cagri, [("ggml-large-v3-turbo-q5_0.bin", False), ("ggml-small.bin", True)])
        # Model yoksa ne indirilecegi soylenir.
        for f in ("ggml-small.bin", "ggml-large-v3-turbo-q5_0.bin"):
            os.remove(os.path.join(d, f))
        y = dinle.whisper_bul(ara=lambda x: None)
        no(y["bulundu"], "model yok")
        ok("ggml-large-v3-turbo-q5_0.bin" in y["metin"], y["metin"])
    finally:
        dinle._adaylar = eski


def run():
    suite("dinle")
    test("GPU önce: CUDA'lı ikili turbo ile, olmazsa CPU'da small", _t_gpu_once)
    test("Whisper altyazı etiketleri ve sessizlik uydurmaları metin değildir", _t_whisper_uydurma)

    def t_sira():
        con = db.connect(":memory:")
        r = dinle.yaziya(con, {}, WAV, calistir=lambda e, m, w, t: " «Merhaba King» \n", bul=_bul())
        eq((r["ok"], r["metin"], r["motor"]), (True, "Merhaba King", "whisper"))
        yok = {"bulundu": False, "metin": "Whisper bu bilgisayarda yok."}
        r = dinle.yaziya(con, {}, WAV, bul=yok)
        eq((r["ok"], len(r["notlar"])), (False, 2))
        k, g = models.key_value, butce.guard
        models.key_value = lambda cfg, p, kid=None: "AIza" if p == "google" else None
        butce.guard = lambda con, cfg, **kw: {"ok": True}
        try:
            post = lambda u, b, gv, t: {"candidates": [{"content": {"parts": [{"text": "Bugün koştum."}]}}],
                                        "usageMetadata": {"promptTokenCount": 50, "candidatesTokenCount": 5}}
            r = dinle.yaziya(con, {}, WAV, post=post, bul=yok)
            eq((r["ok"], r["metin"], r["motor"]), (True, "Bugün koştum.", "gemini"))
            eq(con.execute("SELECT role FROM usage").fetchone()["role"], "dinle")
        finally:
            models.key_value, butce.guard = k, g
        no(dinle.yaziya(con, {}, b"bozuk", bul=_bul())["ok"], "gecersiz kayit")

    def t_bul():
        w = dinle.whisper_bul(ara=lambda x: None)
        if not w["exe"]:
            ok("tavsiye" in w["metin"], w["metin"])

    test("sıra: Whisper, Gemini, yok; geçersiz kayıt reddedilir", t_sira)
    test("Whisper yoksa tavsiye yazılır", t_bul)


def run_daemon():
    from tests.test_daemon import _Server
    suite("dinle · uçlar")

    def t_uclar():
        s = _Server()
        try:
            eq(s.call("/api/dinle/durum", token=None)[0], 401)
            eq(s.call("/api/dinle/durum")[0], 200)
            st, r = s.call("/api/dinle", body={"wav": "eHg="})
            eq((st, r["ok"]), (503, False))
        finally:
            s.close()

    test("uçlar bearer ister; geçersiz kayıt 503", t_uclar)
