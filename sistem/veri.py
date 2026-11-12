#!/usr/bin/env python3
"""Tek depo (sadelesme Faz 1 P3, A3). Plan: belgeler/ekip/sadelesme/faz1.md §1 ve §2.

Sema goc.py'deki SEMA'dir (tek kaynak); goc'un yazdigi lifeos.db (surum 1) bu modulle acilir ve
surum 2'ye yukseltilir: kayit tablosuna her ust anahtarin saatini tutan `saatler` sutunu eklenir.

Sozler:
1. Saat: karma mantiksal saat (HLC) "<ms 13 hane>:<sayac 4 hane>:<cihaz>"; sabit genislik oldugu icin
   dizgi karsilastirmasi zamani dogru siralar. Gelen saat depo saatinin 5 dk ilerisine kirpilir:
   saati kaymis bir cihaz gelecekten yazip sonraki her degisikligi ezemez.
2. Cakisma ust anahtar duzeyinde: her anahtarin kendi saati var, yenisi kazanir; ayni kaydin farkli
   anahtarlari iki cihazdan birlesir. Ayni yazim iki kez gelirse ikincisi bir sey degistirmez.
3. Silme mezar tasidir: silme saati kaydin tabani olur, ondan eski anahtarlar duser, ondan eski hicbir
   yazim kaydi diriltmez. Yazim ve silme hangi sirayla gelirse gelsin sonuc aynidir.
4. Uygulanan her yazim ve silme olay defterine eklenir (eklemeli, silinmez).
5. Yedek SQLite'in kendi yedekleme yoluyla: once yarim adla yazilir, denetlenir, sonra adini alir.
"""
import contextlib
import json
import os
import sqlite3
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import goc  # noqa: E402

SURUM = 2
ILERI_MS = 5 * 60 * 1000
# shortcut: silme tabani `saatler` haritasinda bos anahtarla durur; govdede bos ust anahtar olursa ayri sutuna tasi
TABAN = ""


def hlc_coz(h):
    ms, sayac, cihaz = h.split(":", 2)
    return int(ms), int(sayac), cihaz


def hlc_yap(ms, sayac, cihaz):
    return "%013d:%04d:%s" % (ms, sayac, cihaz)


class Depo:
    def __init__(self, klasor, cihaz="pc", saat=time.time):
        os.makedirs(klasor, exist_ok=True)
        self.yol = os.path.join(klasor, "lifeos.db")
        self.cihaz, self.saat = cihaz, saat
        yeni = not os.path.exists(self.yol)
        # Gunluk modu varsayilan (DELETE), WAL degil: 2026-11'de hesap.db'nin verisi -wal ile birlikte kayboldu (faz1.md §0)
        self.c = sqlite3.connect(self.yol, timeout=30)
        if yeni:
            self.c.executescript(goc.SEMA)
        surum = self.c.execute("PRAGMA user_version").fetchone()[0]
        if surum == 1:
            with self.c:
                self.c.execute("ALTER TABLE kayit ADD COLUMN saatler TEXT")
                self.c.execute("PRAGMA user_version = %d" % SURUM)
        elif surum != SURUM:
            self.c.close()
            raise ValueError("Bilinmeyen depo sürümü %s: %s" % (surum, self.yol))
        en = self.c.execute("SELECT max(hlc) FROM kayit").fetchone()[0]
        self._son = hlc_coz(en)[:2] if en else (0, 0)

    def kapat(self):
        self.c.close()

    def _ilerlet(self, ms, sayac):
        """Depo saatini (ms, sayac)'a en az esitler; HLC'nin alma kurali."""
        if (ms, sayac) > self._son:
            self._son = (ms, sayac)

    def damga(self):
        """Bu cihazin yeni bir olayi icin saat: duvar saati geri gitse de hep artar."""
        ms = int(self.saat() * 1000)
        o_ms, o_say = self._son
        self._son = (ms, 0) if ms > o_ms else (o_ms + (o_say >= 9999), 0 if o_say >= 9999 else o_say + 1)
        return hlc_yap(self._son[0], self._son[1], self.cihaz)

    def kirp(self, h):
        """Gelen saati depo saatinin ILERI_MS ilerisine kirpar ve depo saatini ilerletir."""
        ms, sayac, cihaz = hlc_coz(h)
        sinir = int(self.saat() * 1000) + ILERI_MS
        if ms > sinir:
            ms, sayac = sinir, 0
        self._ilerlet(ms, sayac)
        return hlc_yap(ms, sayac, cihaz)

    def _durum(self, kimlik):
        """(satir var mi, govde, saatler). Surum 1 satirlarinda saatler yoktur: her anahtar kaydin saatindedir."""
        r = self.c.execute("SELECT govde, hlc, silindi, saatler FROM kayit WHERE id=?", (kimlik,)).fetchone()
        if not r:
            return False, {}, {}
        govde, kh, silindi, saatler = r
        govde = json.loads(govde) if govde else {}
        saatler = json.loads(saatler) if saatler else {k: kh for k in govde}
        if silindi:
            saatler[TABAN] = max(saatler.get(TABAN, ""), kh)
        return True, govde, saatler

    def _kaydet(self, var, alan, yol, tur, govde, saatler, cihaz, kaynak, islem, hlc):
        kimlik = alan + "|" + yol
        silindi = int(not govde and TABAN in saatler)
        metin = None if silindi else goc.kanon(govde)
        etiket = goc.kanon(goc.etiketle(govde)[0])
        son = max(saatler.values())
        if var:
            self.c.execute("UPDATE kayit SET govde=?, etiket=?, hlc=?, cihaz=?, silindi=?, kaynak=?, saatler=? WHERE id=?",
                           (metin, etiket, son, cihaz, silindi, kaynak, goc.kanon(saatler), kimlik))
        else:
            self.c.execute("INSERT INTO kayit (id, tur, tur_surum, alan, yol, govde, etiket, hlc, cihaz, silindi, kaynak, "
                           "goc_id, saatler) VALUES (?,?,1,?,?,?,?,?,?,?,?,NULL,?)",
                           (kimlik, tur, alan, yol, metin, etiket, son, cihaz, silindi, kaynak, goc.kanon(saatler)))
        self.c.execute("INSERT INTO olay(kayit_id, islem, hlc, cihaz, kaynak, goc_id) VALUES (?,?,?,?,?,NULL)",
                       (kimlik, islem, hlc, cihaz, kaynak))

    @staticmethod
    def _tur(alan, yol, tur):
        if tur:
            return tur
        t, neden = goc.modul_turu(alan.split("/", 1)[0], yol)
        if not t:
            raise ValueError("Tek depoya yazılmaz (%s): %s|%s" % (neden, alan, yol))
        return t

    def yaz(self, alan, yol, degisiklik, hlc, cihaz, tur=None, kaynak="cihaz"):
        """degisiklik: yalniz degisen ust anahtarlar {anahtar: deger}. Doner: uygulanan anahtarlar."""
        if not isinstance(degisiklik, dict) or not degisiklik or TABAN in degisiklik:
            raise ValueError("Değişiklik boş olmayan bir sözlük olmalı, boş anahtar taşımamalı.")
        hlc = self.kirp(hlc)
        with self.c:
            var, govde, saatler = self._durum(alan + "|" + yol)
            tur = None if var else self._tur(alan, yol, tur)
            taban = saatler.get(TABAN, "")
            uygulanan = [k for k in sorted(degisiklik) if hlc > max(saatler.get(k, ""), taban)]
            if not uygulanan:
                return []
            for k in uygulanan:
                govde[k], saatler[k] = degisiklik[k], hlc
            self._kaydet(var, alan, yol, tur, govde, saatler, cihaz, kaynak, "yaz", hlc)
            return uygulanan

    def sil(self, alan, yol, hlc, cihaz, tur=None, kaynak="cihaz"):
        """Mezar tasi: taban = silme saati, ondan eski anahtarlar duser. Doner: bir sey degisti mi."""
        hlc = self.kirp(hlc)
        with self.c:
            var, govde, saatler = self._durum(alan + "|" + yol)
            if hlc <= saatler.get(TABAN, ""):
                return False
            tur = None if var else self._tur(alan, yol, tur)
            saatler = {k: s for k, s in saatler.items() if s > hlc}
            govde = {k: v for k, v in govde.items() if k in saatler}
            saatler[TABAN] = hlc
            self._kaydet(var, alan, yol, tur, govde, saatler, cihaz, kaynak, "sil", hlc)
            return True

    def oku(self, alan, yol):
        """Kaydin govdesi; yoksa ya da silindiyse None."""
        r = self.c.execute("SELECT govde FROM kayit WHERE id=? AND silindi=0", (alan + "|" + yol,)).fetchone()
        return json.loads(r[0]) if r and r[0] is not None else None

    def yedekle(self, hedef):
        """Tutarli bir an, tek dosya. Var olan dosyanin ustune yazmaz. Doner: hedef."""
        if os.path.exists(hedef):
            raise FileExistsError(hedef)
        yarim = hedef + ".yarim"
        with contextlib.suppress(OSError):
            os.remove(yarim)
        h = sqlite3.connect(yarim)
        try:
            self.c.backup(h)
            sonuc = h.execute("PRAGMA integrity_check").fetchone()[0]
        finally:
            h.close()
        if sonuc != "ok":
            os.remove(yarim)
            raise sqlite3.DatabaseError("Yedek denetimi geçmedi: " + sonuc)
        os.replace(yarim, hedef)
        return hedef
