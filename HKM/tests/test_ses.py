# -*- coding: utf-8 -*-
"""Ses — King'in sesi (core/ses.py).

   Kanitladigi sozler:
     1. Sira: «oto» once Gemini, olmazsa Piper, olmazsa «yok» ve iki
        neden de adiyla; «gemini»/«piper» yalniz kendini dener; «cihaz»
        sunucuda ses uretmez.
     2. Gemini anahtarsiz ya da butcesiz cagrilmaz; cagri deftere yazilir
        (basarisiz da); PCM, dogru ornekleme hiziyla WAV olur.
     3. Piper bilinen klasorde bulunur (piper.exe + tr_TR*.onnx); yoksa
        nerede aranacagi soylenir; gecersiz cikti kabul edilmez.
     4. Ayni metin ikinci kez uretilmez (onbellek).
     5. Bos metin ses istemez; metin sinirlanir.
     6. Ayar dogrulanir; uclar bearer ister, uretilemezse 503 + notlar,
        uretilirse audio/wav ve motor basligi; sira ilerlediyse neden basligi.
     7. Kota beklemesi (kural 8): 429/503 sonrasi Gemini bir sure hic
        denenmez ve deftere yazilmaz; «oto» Piper'a gecer; bekleme ust uste
        iki katina cikar, tavanda durur, Google'in suresine uyar; basarili
        cagri sifirlar."""
import base64
import io
import json
import os
import tempfile
import wave

from core import butce, db, models, ses, settings
from tests.harness import eq, no, ok, suite, test

PCM = b"\x00\x01" * 2400
GEMINI_CEVAP = {"candidates": [{"content": {"parts": [{"inlineData": {
    "mimeType": "audio/L16;codec=pcm;rate=24000", "data": base64.b64encode(PCM).decode()}}]}}],
    "usageMetadata": {"promptTokenCount": 20, "candidatesTokenCount": 100}}
RIFF = ses.wav(b"\x00\x00" * 100, 22050)


def _con():
    return db.connect(":memory:")


def _sahte_post(cevap, kayit=None):
    def post(url, baslik, govde, timeout):
        if kayit is not None:
            kayit.append((url, govde))
        if isinstance(cevap, Exception):
            raise cevap
        return cevap
    return post


def _piper_dizini():
    d = tempfile.mkdtemp(prefix="hkm-piper-")
    open(os.path.join(d, "piper.exe"), "wb").close()
    os.makedirs(os.path.join(d, "sesler"))
    open(os.path.join(d, "sesler", "tr_TR-fahrettin-medium.onnx"), "wb").close()
    return d


def _gemini_acik(fn):
    """Anahtar ve butce kapisini acar; testten sonra geri koyar."""
    def sar():
        k, g = models.key_value, butce.guard
        models.key_value = lambda cfg, p, kid=None: "AIza-test" if p == "google" else None
        butce.guard = lambda con, cfg, **kw: {"ok": True}
        try:
            fn()
        finally:
            models.key_value, butce.guard = k, g
    return sar


class _Http(Exception):
    """urllib.error.HTTPError gibi: code, headers, read()."""
    def __init__(self, code, govde=b"", headers=None):
        super().__init__("HTTP %d" % code)
        self.code, self._g, self.headers = code, govde, headers or {}

    def read(self):
        return self._g


class _Saat:
    def __init__(self):
        self.t = 1000.0

    def __call__(self):
        return self.t


def _bekleme_sifir():
    ses._BEKLE.update({"bitis": 0.0, "sure": 0})


def run():
    suite("ses")
    ses._ONBELLEK.clear()
    _bekleme_sifir()

    def t_wav():
        w = ses.wav(PCM, 24000)
        with wave.open(io.BytesIO(w)) as r:
            eq((r.getnchannels(), r.getsampwidth(), r.getframerate(), r.getnframes()), (1, 2, 24000, 2400))
        eq(ses._hz("audio/L16;codec=pcm;rate=16000"), 16000)
        eq(ses._hz("audio/L16"), 24000)

    def t_gemini_kapi():
        con = _con()
        w, n = ses.gemini(con, {}, "Merhaba", post=_sahte_post(GEMINI_CEVAP))
        eq(w, None)
        ok("anahtar" in n, n)
        eq(con.execute("SELECT COUNT(*) FROM usage").fetchone()[0], 0)

    @_gemini_acik
    def t_gemini():
        con = _con()
        kayit = []
        cfg = {"ses": {"gemini_ses": "Puck"}}
        w, n = ses.gemini(con, cfg, "Merhaba", post=_sahte_post(GEMINI_CEVAP, kayit))
        eq((w[:4], n), (b"RIFF", ""))
        url, govde = kayit[0]
        ok(url.endswith(ses.GEMINI_MODEL + ":generateContent"), url)
        eq(govde["generationConfig"]["speechConfig"]["voiceConfig"]["prebuiltVoiceConfig"]["voiceName"], "Puck")
        r = con.execute("SELECT role, provider, ok, in_tok, out_tok, usd FROM usage").fetchone()
        eq((r["role"], r["provider"], r["ok"], r["in_tok"], r["out_tok"]), ("ses", "google", 1, 20, 100))
        ok(abs(r["usd"] - (20 * 0.5 + 100 * 10.0) / 1e6) < 1e-12, r["usd"])
        w2, n2 = ses.gemini(con, cfg, "Merhaba", post=_sahte_post(OSError("ag yok")))
        eq(w2, None)
        ok("internet" in n2, n2)
        eq(con.execute("SELECT COUNT(*) FROM usage WHERE ok=0").fetchone()[0], 1)

    def t_piper_bul():
        # Gercek kurulu Piper'i gormesin: yalniz verilen klasorde arar.
        eski = ses._adaylar
        ses._adaylar = lambda cfg: [ses.settings(cfg)["piper_yol"]] * 2
        try:
            _t_piper_bul()
        finally:
            ses._adaylar = eski

    def _t_piper_bul():
        d = _piper_dizini()
        p = ses.piper_bul({"ses": {"piper_yol": d}}, ara=lambda x: None)
        eq((p["bulundu"], os.path.basename(p["exe"]), os.path.basename(p["ses"])),
           (True, "piper.exe", "tr_TR-fahrettin-medium.onnx"))
        ok("fahrettin" in p["metin"], p["metin"])
        bos = tempfile.mkdtemp()
        y = ses.piper_bul({"ses": {"piper_yol": bos}}, ara=lambda x: None)
        if not y["exe"]:
            ok("Piper bulunamadı" in y["metin"], y["metin"])
        open(os.path.join(bos, "piper.exe"), "wb").close()
        z = ses.piper_bul({"ses": {"piper_yol": bos}}, ara=lambda x: None)
        if z["exe"] and z["exe"].startswith(bos):
            no(z["bulundu"], "ses dosyasi yok")
            ok("Türkçe ses yok" in z["metin"], z["metin"])

    def t_piper():
        d = _piper_dizini()
        cfg = {"ses": {"piper_yol": d}}
        bul = ses.piper_bul(cfg, ara=lambda x: None)
        w, n = ses.piper(cfg, "Merhaba", calistir=lambda e, s, m, t: RIFF, bul=bul)
        eq((w, n), (RIFF, ""))
        w, n = ses.piper(cfg, "Merhaba", calistir=lambda e, s, m, t: b"bozuk", bul=bul)
        eq(w, None)
        ok("geçerli" in n, n)

    @_gemini_acik
    def t_sira():
        con = _con()
        ses._ONBELLEK.clear()
        d = _piper_dizini()
        cfg = {"ses": {"piper_yol": d}}
        bul = ses.piper_bul(cfg, ara=lambda x: None)
        piper_ok = lambda e, s, m, t: RIFF                       # noqa: E731
        r = ses.seslendir(con, cfg, "Bir", post=_sahte_post(GEMINI_CEVAP), calistir=piper_ok, bul=bul)
        eq((r["ok"], r["motor"]), (True, "gemini"))
        r = ses.seslendir(con, cfg, "İki", post=_sahte_post(OSError("yok")), calistir=piper_ok, bul=bul)
        eq((r["ok"], r["motor"], len(r["notlar"])), (True, "piper", 1))
        r = ses.seslendir(con, cfg, "Üç", "gemini", post=_sahte_post(OSError("yok")), calistir=piper_ok, bul=bul)
        no(r["ok"], "yalniz gemini")
        r = ses.seslendir(con, cfg, "Dört", "piper", post=_sahte_post(GEMINI_CEVAP), calistir=piper_ok, bul=bul)
        eq(r["motor"], "piper")
        r = ses.seslendir(con, cfg, "Beş", "cihaz", post=_sahte_post(GEMINI_CEVAP), calistir=piper_ok, bul=bul)
        no(r["ok"], "cihaz secili")
        r = ses.seslendir(con, cfg, "Altı", post=_sahte_post(OSError("yok")),
                          calistir=lambda *a: (_ for _ in ()).throw(OSError("x")), bul=bul)
        eq((r["ok"], len(r["notlar"])), (False, 2))
        no(ses.seslendir(con, cfg, "   ")["ok"], "bos metin")

    @_gemini_acik
    def t_onbellek():
        con = _con()
        ses._ONBELLEK.clear()
        kayit = []
        for _ in range(3):
            r = ses.seslendir(con, {}, "Aynı cümle", "gemini", post=_sahte_post(GEMINI_CEVAP, kayit))
            ok(r["ok"], r)
        eq(len(kayit), 1)
        eq(con.execute("SELECT COUNT(*) FROM usage").fetchone()[0], 1)
        kayit2 = []
        ses.seslendir(con, {}, "x" * 5000, "gemini", post=_sahte_post(GEMINI_CEVAP, kayit2))
        eq(len(kayit2[0][1]["contents"][0]["parts"][0]["text"]), ses.EN_COK)

    def t_ayar():
        eq(settings.read({})["ses"], {"gemini_ses": "Kore", "piper_yol": ""})
        ok(settings.validate({"ses": {"gemini_ses": "Puck", "piper_yol": "C:/piper"}})[0])
        no(settings.validate({"ses": {"gemini_ses": "Yok"}})[0], "tanimsiz ses")
        no(settings.validate({"ses": {"hiz": 2}})[0], "bilinmeyen alan")
        eq(ses.settings({"ses": {"gemini_ses": "Yok"}})["gemini_ses"], "Kore")
        d = ses.durum(_con(), {})
        eq((d["gemini"]["hazir"], len(d["sesler"]), d["tercihler"]), (False, 30, ["oto", "gemini", "piper", "cihaz"]))

    @_gemini_acik
    def t_bekleme():
        eski = ses.SAAT
        saat = _Saat()
        ses.SAAT = saat
        _bekleme_sifir()
        ses._ONBELLEK.clear()
        try:
            con = _con()
            d = _piper_dizini()
            cfg = {"ses": {"piper_yol": d}}
            bul = ses.piper_bul(cfg, ara=lambda x: None)
            piper_ok = lambda e, s_, m, t: RIFF                   # noqa: E731
            kayit = []
            r = ses.seslendir(con, cfg, "Bir", post=_sahte_post(_Http(429), kayit), calistir=piper_ok, bul=bul)
            eq((r["ok"], r["motor"], len(kayit)), (True, "piper", 1))
            ok("kotası doldu" in r["notlar"][0] and "60 sn" in r["notlar"][0], r["notlar"])
            eq(ses.gemini_bekliyor(), 60)
            # Beklerken Gemini'ye istek gitmez, deftere yazilmaz; oto dogrudan Piper.
            n0 = con.execute("SELECT COUNT(*) FROM usage").fetchone()[0]
            r = ses.seslendir(con, cfg, "İki", post=_sahte_post(GEMINI_CEVAP, kayit), calistir=piper_ok, bul=bul)
            eq((r["motor"], len(kayit)), ("piper", 1))
            ok("yeniden denenecek" in r["notlar"][0], r["notlar"])
            eq(con.execute("SELECT COUNT(*) FROM usage").fetchone()[0], n0)
            r = ses.seslendir(con, cfg, "Üç", "gemini", post=_sahte_post(GEMINI_CEVAP, kayit), calistir=piper_ok, bul=bul)
            eq((r["ok"], len(kayit)), (False, 1))
            no(ses.durum(con, cfg)["gemini"]["hazir"], "beklerken hazir degil")
            eq(ses.durum(con, cfg)["gemini"]["bekliyor"], 60)
            # Sure dolunca yeniden denenir; ust uste ikinci 429 iki kati.
            saat.t += 61
            r = ses.seslendir(con, cfg, "Dört", post=_sahte_post(_Http(503), kayit), calistir=piper_ok, bul=bul)
            eq((r["motor"], len(kayit), ses.gemini_bekliyor()), ("piper", 2, 120))
            ok("yoğun" in r["notlar"][0] and "2 dk" in r["notlar"][0], r["notlar"])
            for _ in range(8):
                saat.t += ses.BEKLE_EN_COK + 1
                ses.gemini(con, cfg, "x", post=_sahte_post(_Http(429)))
            eq(ses.gemini_bekliyor(), ses.BEKLE_EN_COK)
            # Basarili cagri sifirlar; sonraki 429 yine BEKLE_ILK'ten baslar.
            saat.t += ses.BEKLE_EN_COK + 1
            w, n = ses.gemini(con, cfg, "Beş", post=_sahte_post(GEMINI_CEVAP))
            eq((w[:4], ses._BEKLE["sure"], ses.gemini_bekliyor()), (b"RIFF", 0, 0))
            # Google'in soyledigi sure: Retry-After ya da retryDelay.
            ses.gemini(con, cfg, "Altı", post=_sahte_post(_Http(429, headers={"Retry-After": "300"})))
            eq(ses.gemini_bekliyor(), 300)
            _bekleme_sifir()
            govde = json.dumps({"error": {"code": 429, "details": [
                {"@type": "type.googleapis.com/google.rpc.RetryInfo", "retryDelay": "97.2s"}]}}).encode()
            ses.gemini(con, cfg, "Yedi", post=_sahte_post(_Http(429, govde)))
            eq(ses.gemini_bekliyor(), 98)
            # Baska hata (400, internet yok) beklemeye sokmaz.
            _bekleme_sifir()
            ses.gemini(con, cfg, "Sekiz", post=_sahte_post(_Http(400)))
            ses.gemini(con, cfg, "Dokuz", post=_sahte_post(OSError("ag yok")))
            eq(ses.gemini_bekliyor(), 0)
        finally:
            ses.SAAT = eski
            _bekleme_sifir()

    test("WAV ve örnekleme hızı", t_wav)
    test("Gemini anahtarsız çağrılmaz, deftere bir şey yazılmaz", t_gemini_kapi)
    test("Gemini: ses adı, deftere yazılır, internet yoksa söylenir", t_gemini)
    test("Piper bulunur; yoksa nerede aranacağı söylenir", t_piper_bul)
    test("Piper: geçersiz çıktı kabul edilmez", t_piper)
    test("sıra: Gemini, Piper, yok; tercih yalnız kendini dener", t_sira)
    test("aynı metin ikinci kez üretilmez; metin sınırlı", t_onbellek)
    test("ayar doğrulanır; durum ses üretmez", t_ayar)
    test("kota dolunca Gemini bir süre denenmez; bekleme büyür, sıfırlanır", t_bekleme)


def run_daemon():
    from tests.test_daemon import _Server
    suite("ses · uçlar")

    def t_uclar():
        s = _Server()
        ses._ONBELLEK.clear()
        try:
            eq(s.call("/api/ses/durum", token=None)[0], 401)
            st, d = s.call("/api/ses/durum")
            eq((st, d["gemini"]["hazir"]), (200, False))
            eq(s.call("/api/ses", token=None, body={"metin": "x"})[0], 401)
            st, r = s.call("/api/ses", body={"metin": "Merhaba", "tercih": "oto"})
            eq((st, r["ok"]), (503, False))
            ok(len(r["notlar"]) == 2, r["notlar"])
            eski = ses.VARSAYILAN_CALISTIR
            d2 = _piper_dizini()
            s.srv.config["ses"] = {"piper_yol": d2}
            ses.VARSAYILAN_CALISTIR = lambda e, sd, m, t: RIFF
            try:
                import urllib.request
                req = urllib.request.Request(s.url("/api/ses"), method="POST",
                                             data=json.dumps({"metin": "Merhaba", "tercih": "piper"}).encode())
                from tests.test_daemon import TOKEN
                req.add_header("Authorization", "Bearer " + TOKEN)
                req.add_header("Content-Type", "application/json")
                with urllib.request.urlopen(req, timeout=10) as y:
                    eq((y.status, y.headers["Content-Type"], y.headers["X-Ses-Motor"], y.read()[:4]),
                       (200, "audio/wav", "piper", b"RIFF"))
                    eq(y.headers.get("X-Ses-Not"), None)
                # Oto: Gemini anahtarsiz -> Piper; neden basliga yuzde kodlu yazilir.
                ses._ONBELLEK.clear()
                req2 = urllib.request.Request(s.url("/api/ses"), method="POST",
                                              data=json.dumps({"metin": "Selam", "tercih": "oto"}).encode())
                req2.add_header("Authorization", "Bearer " + TOKEN)
                req2.add_header("Content-Type", "application/json")
                with urllib.request.urlopen(req2, timeout=10) as y:
                    from urllib.parse import unquote
                    eq(y.headers["X-Ses-Motor"], "piper")
                    ok("anahtar" in unquote(y.headers["X-Ses-Not"]), y.headers["X-Ses-Not"])
                    ok("X-Ses-Not" in y.headers["Access-Control-Expose-Headers"], y.headers["Access-Control-Expose-Headers"])
            finally:
                ses.VARSAYILAN_CALISTIR = eski
            eq(s.call("/api/config", body={"ses": {"gemini_ses": "Yok"}})[0], 422)
        finally:
            s.close()

    test("uçlar bearer ister; 503 + notlar; WAV, motor ve neden başlığı", t_uclar)
