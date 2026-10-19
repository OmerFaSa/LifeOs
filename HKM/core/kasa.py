# -*- coding: utf-8 -*-
"""Kasa — saglayici anahtarlarini config.json yerine isletim sisteminin
   kimlik kasasinda tutmak (2026-10-19, mimari denetim: «API anahtarlari
   config.json'da duz metin»).

   Windows'ta Kimlik Yoneticisi (Credential Manager; advapi32 CredWriteW /
   CredReadW / CredDeleteW, yalniz standart kutuphane ctypes). Baska
   isletim sistemlerinde kasa yoktur ve hicbir sey tasinmaz (destek()).

   Dort kural:
   1. ANAHTAR DUZ YAZILMAZ: tasindiktan sonra config.json'da yalniz «kasa:
      saglayici:kimlik» gondermesi durur; deger kasadan okunur
      (core/models.py key_value).
   2. TASIMA GERI ALINIR: «geri» anahtari kasadan okuyup config'e geri
      yazar ve kasadaki kaydi siler. Kasa okunamazsa (baska kullanici,
      baska bilgisayar) gonderme ölü kalir ve bu adiyla soylenir.
   3. DOGRULANMADAN SILINMEZ: tasimada her anahtar kasaya yazilir ve GERI
      OKUNUP ayni oldugu gorulmeden config'teki deger degistirilmez.
   4. TESTLER KASAYA DOKUNMAZ: ARKA (yaz/oku/sil) degistirilebilir;
      tests/harness.py bellek ici bir kasa koyar."""
import ctypes
import os

ONEK = "kasa:"
HEDEF = "LifeOS/HKM/%s"


def destek():
    return os.name == "nt"


if os.name == "nt":                                         # pragma: no cover — yalniz Windows
    from ctypes import wintypes as _wt

    class _KIMLIK(ctypes.Structure):
        _fields_ = [("Flags", _wt.DWORD), ("Type", _wt.DWORD), ("TargetName", _wt.LPWSTR),
                    ("Comment", _wt.LPWSTR), ("LastWritten", _wt.FILETIME),
                    ("CredentialBlobSize", _wt.DWORD), ("CredentialBlob", ctypes.POINTER(ctypes.c_char)),
                    ("Persist", _wt.DWORD), ("AttributeCount", _wt.DWORD), ("Attributes", ctypes.c_void_p),
                    ("TargetAlias", _wt.LPWSTR), ("UserName", _wt.LPWSTR)]

    def _adv():
        return ctypes.WinDLL("advapi32", use_last_error=True)

    def _win_yaz(hedef, deger):
        b = str(deger).encode("utf-16-le")
        tampon = ctypes.create_string_buffer(b, len(b))
        k = _KIMLIK()
        k.Type = 1                                          # CRED_TYPE_GENERIC
        k.TargetName = hedef
        k.CredentialBlobSize = len(b)
        k.CredentialBlob = ctypes.cast(tampon, ctypes.POINTER(ctypes.c_char))
        k.Persist = 2                                       # CRED_PERSIST_LOCAL_MACHINE
        k.UserName = "LifeOS"
        return bool(_adv().CredWriteW(ctypes.byref(k), 0))

    def _win_oku(hedef):
        p = ctypes.POINTER(_KIMLIK)()
        a = _adv()
        if not a.CredReadW(hedef, 1, 0, ctypes.byref(p)):
            return None
        try:
            n = p.contents.CredentialBlobSize
            return ctypes.string_at(p.contents.CredentialBlob, n).decode("utf-16-le") if n else ""
        finally:
            a.CredFree(p)

    def _win_sil(hedef):
        return bool(_adv().CredDeleteW(hedef, 1, 0))

    ARKA = {"yaz": _win_yaz, "oku": _win_oku, "sil": _win_sil}
else:
    ARKA = None


def gonderme_mi(deger):
    return isinstance(deger, str) and deger.startswith(ONEK)


def oku(deger):
    """«kasa:google:k1» -> anahtar ya da None. Gonderme degilse oldugu gibi."""
    if not gonderme_mi(deger):
        return deger
    if not ARKA:
        return None
    try:
        return ARKA["oku"](HEDEF % deger[len(ONEK):])
    except Exception:                                       # noqa: BLE001
        return None


def _anahtar_listeleri(cfg):
    k = ((cfg or {}).get("models") or {}).get("keys")
    out = []
    if isinstance(k, dict):
        for saglayici, liste in k.items():
            if isinstance(liste, list):
                for e in liste:
                    if isinstance(e, dict) and isinstance(e.get("key"), str) and e.get("key"):
                        out.append((saglayici, e))
    return out


def durum(cfg):
    l = _anahtar_listeleri(cfg)
    return {"destek": destek() and ARKA is not None, "toplam": len(l),
            "kasada": sum(1 for _, e in l if gonderme_mi(e["key"]))}


def tasi(cfg):
    """(yeni_cfg, tasinan, hata). Kural 1 ve 3. cfg'yi degistirmez."""
    import copy
    if not (destek() and ARKA):
        return None, 0, "Bu bilgisayarda kimlik kasası yok (yalnız Windows)."
    yeni = copy.deepcopy(cfg)
    n = 0
    for saglayici, e in _anahtar_listeleri(yeni):
        if gonderme_mi(e["key"]) or saglayici == "yerel":
            continue
        ad = "%s:%s" % (saglayici, e.get("id") or "k%d" % (n + 1))
        try:
            ok = ARKA["yaz"](HEDEF % ad, e["key"]) and ARKA["oku"](HEDEF % ad) == e["key"]
        except Exception:                                   # noqa: BLE001
            ok = False
        if not ok:
            return None, 0, "Anahtar kasaya yazılamadı (%s); hiçbir şey değişmedi." % saglayici
        e["key"] = ONEK + ad
        n += 1
    return yeni, n, None


def geri(cfg):
    """(yeni_cfg, geri_alinan, okunamayan). Kural 2."""
    import copy
    yeni = copy.deepcopy(cfg)
    n, okunamayan = 0, []
    for saglayici, e in _anahtar_listeleri(yeni):
        if not gonderme_mi(e["key"]):
            continue
        deger = oku(e["key"])
        if deger is None:
            okunamayan.append(saglayici)
            continue
        ad = e["key"][len(ONEK):]
        e["key"] = deger
        try:
            ARKA["sil"](HEDEF % ad)
        except Exception:                                   # noqa: BLE001
            pass
        n += 1
    return yeni, n, okunamayan
