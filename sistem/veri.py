#!/usr/bin/env python3
"""Tek depo (sadelesme Faz 1 P3-P4, A3). Plan: belgeler/ekip/sadelesme/faz1.md §1 ve §2.

Sema goc.py'deki SEMA'dir (tek kaynak); goc'un yazdigi lifeos.db (surum 1) bu modulle acilir ve
surum 2'ye yukseltilir: kayit tablosuna her ust anahtarin saatini tutan `saatler` sutunu eklenir.

Sozler:
1. Saat: karma mantiksal saat (HLC) "<ms 13 hane>:<sayac 4 hane>:<cihaz>"; sabit genislik oldugu icin
   dizgi karsilastirmasi zamani dogru siralar. Gelen saat depo saatinin 5 dk ilerisine kirpilir:
   saati kaymis bir cihaz gelecekten yazip sonraki her degisikligi ezemez.
2. Cakisma ust anahtar duzeyinde: her anahtarin kendi saati var, yenisi kazanir; ayni kaydin farkli
   anahtarlari iki cihazdan birlesir. Ayni yazim iki kez gelirse ikincisi bir sey degistirmez.
   Sozluk olmayan govde (liste, sayi) tek parcadir: kaydin en yeni saatini gecen yazim onu degistirir.
3. Silme mezar tasidir: silme saati kaydin tabani olur, ondan eski anahtarlar duser, ondan eski hicbir
   yazim kaydi diriltmez. Butun govdeyi degistirme (eski istemcinin yazimi) eksik anahtarlara anahtar
   mezar tasi koyar. Yazim, degistirme ve silme hangi sirayla gelirse gelsin sonuc aynidir.
4. Uygulanan her yazim ve silme olay defterine eklenir (eklemeli, silinmez).
5. Yedek SQLite'in kendi yedekleme yoluyla: once yarim adla yazilir, denetlenir, sonra adini alir.
6. Kopru (P4a): hesap esitlemesinin kabul ettigi yazimlar sahibin tek deposuna da yazilir; eski
   esitleme sozlesmesi ve hesap.db degismez, kopru hatasi esitlemeyi durdurmaz (karsilastir farki gosterir).
"""
import contextlib
import json
import os
import sqlite3
import sys
import threading
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import goc  # noqa: E402

SURUM = 2
ILERI_MS = 5 * 60 * 1000
# shortcut: iki ayrilmis anahtar `saatler` haritasinda durur (silme tabani, tek parca govde); govdede bu adla ust anahtar olursa ayri sutuna tasi
TABAN = ""
BUTUN = "\u0000"


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
        self._kilit = threading.RLock()          # sunucu cok is parcacikli; tek baglanti, tek sira
        yeni = not os.path.exists(self.yol)
        # Gunluk modu varsayilan (DELETE), WAL degil: 2026-11'de hesap.db'nin verisi -wal ile birlikte kayboldu (faz1.md §0)
        self.c = sqlite3.connect(self.yol, timeout=30, check_same_thread=False)
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
        with self._kilit:
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
        """(satir var mi, govde ya da None (yok/silindi), saatler). Surum 1 satirlarinda saatler yoktur:
        her anahtar kaydin saatindedir."""
        r = self.c.execute("SELECT govde, hlc, silindi, saatler FROM kayit WHERE id=?", (kimlik,)).fetchone()
        if not r:
            return False, None, {}
        metin, kh, silindi, saatler = r
        govde = None if silindi or metin is None else json.loads(metin)
        if saatler:
            saatler = json.loads(saatler)
        elif govde is None:
            saatler = {}
        else:
            saatler = {k: kh for k in govde} if isinstance(govde, dict) else {BUTUN: kh}
        if silindi:
            saatler[TABAN] = max(saatler.get(TABAN, ""), kh)
        return True, govde, saatler

    def _kaydet(self, var, alan, yol, tur, govde, saatler, cihaz, kaynak, islem, hlc):
        kimlik = alan + "|" + yol
        silindi = int(govde is None)
        metin = None if silindi else goc.kanon(govde)
        etiket = goc.kanon(goc.etiketle(govde)[0]) if govde is not None else "{}"
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
        if not isinstance(degisiklik, dict) or not degisiklik or TABAN in degisiklik or BUTUN in degisiklik:
            raise ValueError("Değişiklik boş olmayan bir sözlük olmalı, ayrılmış anahtar taşımamalı.")
        hlc = self.kirp(hlc)
        with self._kilit, self.c:
            var, govde, saatler = self._durum(alan + "|" + yol)
            if govde is not None and not isinstance(govde, dict):
                raise ValueError("Tek parça kayda alan yazılmaz, degistir kullan: %s|%s" % (alan, yol))
            govde = govde if govde is not None else {}
            tur = None if var else self._tur(alan, yol, tur)
            taban = saatler.get(TABAN, "")
            uygulanan = [k for k in sorted(degisiklik) if hlc > max(saatler.get(k, ""), taban)]
            if not uygulanan:
                return []
            for k in uygulanan:
                govde[k], saatler[k] = degisiklik[k], hlc
            self._kaydet(var, alan, yol, tur, govde, saatler, cihaz, kaynak, "yaz", hlc)
            return uygulanan

    def degistir(self, alan, yol, yeni, hlc, cihaz, tur=None, kaynak="cihaz"):
        """Butun govdeyi koyar (eski istemcinin yazimi) = ayni anda sil + yaz: taban bu saate cikar, ondan eski
        her anahtar duser ve bir daha donmez; yeni anahtarlar bu saatle yazilir, yalniz daha yeni bir alan
        yazimi korunur. Sozluk olmayan govde tek parcadir (BUTUN). Doner: bir sey degisti mi."""
        if yeni is None:
            raise ValueError("Silmek için sil kullan.")
        hlc = self.kirp(hlc)
        with self._kilit, self.c:
            var, govde, saatler = self._durum(alan + "|" + yol)
            if hlc <= saatler.get(TABAN, ""):
                return False
            tur = None if var else self._tur(alan, yol, tur)
            saatler = {k: s for k, s in saatler.items() if s > hlc and k != TABAN}    # daha yeni olanlar kalir
            if isinstance(govde, dict):
                govde = {k: v for k, v in govde.items() if k in saatler}
            elif BUTUN not in saatler:
                govde = None
            if isinstance(yeni, dict) and BUTUN not in saatler:
                govde = govde or {}
                for k in yeni:
                    if k not in saatler:
                        govde[k], saatler[k] = yeni[k], hlc
            elif not isinstance(yeni, dict) and not saatler:
                govde, saatler[BUTUN] = yeni, hlc
            # shortcut: tur degisimi (sozluk <-> liste) cakisirsa daha yeni olan kalir, eskisi duser; ikisi karismaz
            saatler[TABAN] = hlc
            self._kaydet(var, alan, yol, tur, govde, saatler, cihaz, kaynak, "degistir", hlc)
            return True

    def sil(self, alan, yol, hlc, cihaz, tur=None, kaynak="cihaz"):
        """Mezar tasi: taban = silme saati, ondan eski anahtarlar duser. Doner: bir sey degisti mi."""
        hlc = self.kirp(hlc)
        with self._kilit, self.c:
            var, govde, saatler = self._durum(alan + "|" + yol)
            if hlc <= saatler.get(TABAN, ""):
                return False
            tur = None if var else self._tur(alan, yol, tur)
            saatler = {k: s for k, s in saatler.items() if s > hlc}
            if isinstance(govde, dict):
                govde = {k: v for k, v in govde.items() if k in saatler} or None
            elif BUTUN not in saatler:
                govde = None
            saatler[TABAN] = hlc
            self._kaydet(var, alan, yol, tur, govde, saatler, cihaz, kaynak, "sil", hlc)
            return True

    def oku(self, alan, yol):
        """Kaydin govdesi; yoksa ya da silindiyse None."""
        with self._kilit:
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
            with self._kilit:
                self.c.backup(h)
            sonuc = h.execute("PRAGMA integrity_check").fetchone()[0]
        finally:
            h.close()
        if sonuc != "ok":
            os.remove(yarim)
            raise sqlite3.DatabaseError("Yedek denetimi geçmedi: " + sonuc)
        os.replace(yarim, hedef)
        return hedef


class Kopru:
    """Hesap esitlemesinin (sistem/hesap.py esitle) kabul ettigi yazimlari tek depoya da yazar (P4a).
    Yalniz sahibin kayitlari: tek depo tek kisinindir, ikinci hesabin verisi karismaz."""

    def __init__(self, depo, sahip):
        self.depo, self.sahip = depo, sahip

    def __call__(self, kullanici, alan, cihaz, yazimlar):
        """yazimlar: [(yol, metin | None, z)] hesap.db'ye yazildigi bicimde. Doner: tek depoda degisen sayisi."""
        if kullanici != self.sahip:
            return 0
        n = 0
        for yol, metin, z in yazimlar:
            if goc.modul_turu(alan.split("/", 1)[0], yol)[0] is None:
                continue                                # turetilmis / cihaza ait: tek depoya girmez (karar 10)
            h = hlc_yap(z, 0, cihaz)
            if metin is None:
                n += self.depo.sil(alan, yol, h, cihaz, kaynak="hesap")
            else:
                n += self.depo.degistir(alan, yol, json.loads(metin), h, cihaz, kaynak="hesap")
        return n


def kopru_ac(hesap_klasoru, sahip):
    """Tek depo kurulduysa (Faz 1 P6 sonrasi, hesap klasorunun yanindaki veri/) kopruyu acar; yoksa None.
    Depoyu kendisi kurmaz: gercek goc sahibinin onayiyla yapilir."""
    klasor = os.path.join(os.path.dirname(os.path.abspath(hesap_klasoru)), "veri")
    if sahip is None or not os.path.exists(os.path.join(klasor, "lifeos.db")):
        return None
    return Kopru(Depo(klasor), sahip)


def karsilastir(hesap_yol, depo, sahip):
    """Hesap.db'deki sahibin her tasinan kaydi tek depoda ayni mi. Doner: [(kimlik, neden)] (bos = ayni).
    hesap_yol canli dosya degil, KOPYASI olmali (goc.kopyala)."""
    fark = []
    c = sqlite3.connect(hesap_yol)
    try:
        for alan, yol, deger in c.execute("SELECT alan, yol, deger FROM kayit WHERE kullanici=? ORDER BY alan, yol",
                                          (sahip,)):
            if goc.modul_turu(alan.split("/", 1)[0], yol)[0] is None:
                continue
            beklenen = None if deger is None else json.loads(deger)
            if depo.oku(alan, yol) != beklenen:
                fark.append((alan + "|" + yol, "tek depoda yok" if depo.oku(alan, yol) is None else "farklı"))
    finally:
        c.close()
    return fark
