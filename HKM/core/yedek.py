# -*- coding: utf-8 -*-
"""Otomatik yedek — uc modulun verisi her gun HKM'nin klasorune.
   (ekip/DEVIR.md Part 4, madde 15)

   Uc arayuzun verisi tarayicinin deposunda durur. Tarayici verisi
   silinirse (site verisini temizle, profil sifirlama, yeni cihaz) geri
   gelmez; bugune kadar tek koruma kullanicinin elle indirdigi dosyaydi.
   HKM aciksa modul GUNDE BIR KEZ kendi yedegini buraya yollar.

   Bes kural:

   1. HKM MODULE YAZMAZ. Yalniz modulun yolladigi dosyayi saklar; geri
      yukleme yine modulun kendi yedek yukleme yolundan gecer (Rehber > Veri).
   2. YAZILDI DEMEK, OKUNDU DEMEKTIR. Dosya once gecici ada yazilir,
      diske indirilir, adi degistirilir ve GERI OKUNUR; bayt sayisi ve
      SHA-256 gelenle ayni degilse «yazildi» denmez. Modul hatirlatmasini
      ancak bu cevapla «alindi» sayar.
   3. BASKA MODULUN DOSYASI KABUL EDILMEZ. Govdedeki uygulama kimligi
      yolun modulune ait degilse dosya reddedilir: AYS'nin yerine SPI'nin
      yedegini saklamak, AYS'yi korumasiz birakmak demekti.
   4. SILINMIS BIR TARAYICI IYI YEDEKLERI SILDIREMEZ. Veri silinmis bir
      modul her gun bos bir yedek yollarsa, yalniz son 14 gunu tutan bir
      dondurme iki haftada butun iyi yedekleri atardi. Bu yuzden son 14
      gunun yaninda son 6 ayin HER BIRINDEN ayin son yedegi de kalir; ve
      bir oncekinin yarisindan kucuk bir yedek UYARIYLA doner.
   5. DOSYA ADI DISARIDAN GELMEZ. Ad yalniz modul ve tarihten kurulur;
      tarih ISO bicimini tutmuyorsa hic okunmaz."""
import datetime
import hashlib
import json
import os
import re

from core.planlama import _tarih_yaz

# Modul -> uygulama kimligi (store.js APP_ID). Kimlik degisirse eski
# yedekler de reddedilir; bu bilerek boyledir.
MODULLER = {"ays": "rota-84285", "spi": "spi-saglik", "esp": "esp-entelektuel"}
MODUL_AD = {"ays": "AYS", "spi": "SPİ", "esp": "ESP"}
GUNLUK = 14
AYLIK = 6
KUCULME = 0.5
AD = re.compile(r"^(\d{4}-\d{2}-\d{2})\.json$")
ISO = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def kok(db_path):
    """Yedek klasoru ambarin yanindadir: testler gecici ambarla calisir,
    gercek klasore dokunmaz."""
    return os.path.join(os.path.dirname(os.path.abspath(db_path)), "yedek")


def _gecerli_tarih(t):
    if not ISO.match(str(t or "")):
        return False
    try:
        datetime.date.fromisoformat(t)
    except ValueError:
        return False
    return True


def _dosyalar(klasor):
    """(tarih, yol) listesi, en yeni once."""
    if not os.path.isdir(klasor):
        return []
    out = []
    for ad in os.listdir(klasor):
        m = AD.match(ad)
        if m and _gecerli_tarih(m.group(1)):
            out.append((m.group(1), os.path.join(klasor, ad)))
    return sorted(out, reverse=True)


def _sakla(tarihler):
    """Hangi tarihler kalir: son GUNLUK tarih + son AYLIK ayin her birinden
    ayin en yeni yedegi. `tarihler` en yeni once siralidir."""
    kal = set(tarihler[:GUNLUK])
    aylar = []
    for t in tarihler:
        ay = t[:7]
        if ay in aylar:
            continue
        aylar.append(ay)
        if len(aylar) > AYLIK:
            break
        kal.add(t)
    return kal


def _ozet(ham):
    return len(ham), hashlib.sha256(ham).hexdigest()


def kaydet(klasor_kok, modul, ham, bugun=None):
    """Modulun yedegini yazar, geri okuyarak dogrular, eskileri dondurur.

    `ham` modulun yolladigi govdenin BAYTLARIDIR; ayristirilip yeniden
    yazilmaz — geri yuklenecek olan, modulun urettigi dosyanin kendisidir."""
    if modul not in MODULLER:
        return {"ok": False, "note": "Bilinmeyen modül."}
    if not ham:
        return {"ok": False, "note": "Yedek boş geldi."}
    try:
        govde = json.loads(ham.decode("utf-8"))
    except (UnicodeDecodeError, ValueError):
        return {"ok": False, "note": "Yedek okunamadı: geçerli bir JSON değil."}
    meta = govde.get("__meta") if isinstance(govde, dict) else None
    if not isinstance(meta, dict) or not isinstance(govde.get("data"), dict):
        return {"ok": False, "note": "Bu bir LifeOS yedeği değil."}
    if meta.get("app") != MODULLER[modul]:
        return {"ok": False, "note": "Bu dosya %s yedeği değil; saklanmadı." % MODUL_AD[modul]}
    tarih = bugun or datetime.date.today().isoformat()
    if not _gecerli_tarih(tarih):
        return {"ok": False, "note": "Geçersiz tarih."}

    klasor = os.path.join(klasor_kok, modul)
    os.makedirs(klasor, exist_ok=True)
    onceki = [d for d in _dosyalar(klasor) if d[0] != tarih]
    yol = os.path.join(klasor, tarih + ".json")
    gecici = yol + ".yaziliyor"
    with open(gecici, "wb") as f:
        f.write(ham)
        f.flush()
        os.fsync(f.fileno())
    os.replace(gecici, yol)

    bayt, sha = _ozet(ham)
    with open(yol, "rb") as f:
        okunan = f.read()
    if _ozet(okunan) != (bayt, sha):
        return {"ok": False, "note": "Yedek yazıldı ama geri okunduğunda aynı çıkmadı; "
                                     "yazıldı sayılmadı."}

    out = {"ok": True, "modul": modul, "tarih": tarih, "bayt": bayt, "sha256": sha,
           "yazildi": datetime.datetime.now().isoformat(timespec="seconds")}
    if onceki:
        onceki_bayt = os.path.getsize(onceki[0][1])
        out["onceki"] = {"tarih": onceki[0][0], "bayt": onceki_bayt}
        if onceki_bayt and bayt < onceki_bayt * KUCULME:
            out["uyari"] = ("%s yedeği bir öncekinin (%s) yarısından küçük. Veri silinmiş "
                            "olabilir; eski yedekler HKM’de duruyor, silinmedi."
                            % (MODUL_AD[modul], onceki[0][0]))

    tumu = _dosyalar(klasor)
    kal = _sakla([t for t, _ in tumu])
    silinen = 0
    for t, p in tumu:
        if t not in kal:
            os.remove(p)
            silinen += 1
    out["saklanan"] = len(tumu) - silinen
    out["silinen"] = silinen
    return out


def _boyut(bayt):
    """Yuzun gosterecegi boyut: yuz kendi sayisini uretmez."""
    if bayt < 1024:
        return "%d bayt" % bayt
    kb = bayt / 1024.0
    if kb < 1024:
        return ("%.1f KB" % kb).replace(".", ",")
    return ("%.1f MB" % (kb / 1024.0)).replace(".", ",")


def liste(klasor_kok):
    """Her modulun sakli yedekleri (en yeni once) ve her biri icin cumle."""
    out, metin = {}, {}
    for m in MODULLER:
        l = [{"tarih": t, "bayt": os.path.getsize(p), "tarih_yazi": _tarih_yaz(
                  datetime.date.fromisoformat(t)), "boyut": _boyut(os.path.getsize(p))}
             for t, p in _dosyalar(os.path.join(klasor_kok, m))]
        out[m] = l
        metin[m] = ("Son yedek %s · %s · HKM’de %d yedek saklı." % (
            l[0]["tarih_yazi"], l[0]["boyut"], len(l)) if l else
            "HKM’de henüz yedeği yok. %s, HKM’ye bağlıyken günde bir kez kendiliğinden "
            "yollar." % MODUL_AD[m])
    return {"moduller": out, "metin": metin, "gunluk": GUNLUK, "aylik": AYLIK,
            "tasima": TASIMA_ADIMLARI,
            "kural": "Son %d günün her biri ve son %d ayın her birinden ayın son yedeği "
                     "saklanır." % (GUNLUK, AYLIK)}


def oku(klasor_kok, modul, tarih):
    """Bir yedegin baytlari; yoksa ya da ad gecersizse None."""
    if modul not in MODULLER or not _gecerli_tarih(tarih):
        return None
    yol = os.path.join(klasor_kok, modul, tarih + ".json")
    if not os.path.isfile(yol):
        return None
    with open(yol, "rb") as f:
        return f.read()


# ------------------------------------------------------------ tek zip
#
# Fikir 53: her sey TEK dosyada, okunur. HKM ambari (db.export_all) + her
# modulun HKM'de sakli EN YENI yedegi + ne oldugunu anlatan BENIOKU.
# Yalniz standart kutuphane (zipfile). Geri yukleme yine modulun kendi
# ekranindadir; HKM module yazmaz.

# Yeni cihaza tasima (fikir 54): uc durum, uc yol. HKM web'deki kart ayni
# adimlari gosterir; iki yerde ayri yazilmasin diye metin burada.
TASIMA_ADIMLARI = [
    "Yeni cihaza taşıma:",
    "  1. HKM bu bilgisayarda kalıyorsa: yeni cihazda modülü aç, Ayarlar › HKM bağlantısından "
    "eşle, sonra Rehber › Veri › «HKM’deki yedekten yükle». Yanlışsa «İçe aktarmayı geri al».",
    "  2. HKM de taşınıyorsa: yeni bilgisayarda HKM'yi kur, bu zip'i aç ve "
    "«python3 hkm.py geri hkm/hkm-ambar.json» çalıştır; sonra 1. adım.",
    "  3. HKM kullanmıyorsan: <modül>/<modül>-yedek-<tarih>.json dosyasını modülün "
    "Rehber › Veri bölümündeki yedek yükleme düğmesiyle seç.",
]


def zip_paketi(con, klasor_kok, bugun):
    import io
    import json as _json
    import zipfile
    from core import db
    tampon = io.BytesIO()
    satir = ["LifeOS — tek dosya dışa aktarma (%s)" % bugun, "",
             "İçindekiler:",
             "  hkm/hkm-ambar.json   HKM'nin bütün kaydı (sohbet, kararlar, iş emirleri, ölçümler)"]
    with zipfile.ZipFile(tampon, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("hkm/hkm-ambar.json",
                   _json.dumps(db.export_all(con), ensure_ascii=False, indent=1, default=str))
        for m in MODULLER:
            l = _dosyalar(os.path.join(klasor_kok, m))
            if not l:
                satir.append("  %s: HKM’de yedek yok — %s, HKM’ye bağlıyken günde bir kez "
                             "kendiliğinden yollar." % (MODUL_AD[m], MODUL_AD[m]))
                continue
            tarih, yol = l[0]
            with open(yol, "rb") as f:
                z.writestr("%s/%s-yedek-%s.json" % (m, m, tarih), f.read())
            satir.append("  %s/%s-yedek-%s.json   %s'nin en yeni yedeği (%s)"
                         % (m, m, tarih, MODUL_AD[m], tarih))
        satir += ["", "Geri yükleme: modül yedeğini modülün Rehber › Veri bölümündeki yedek "
                      "yükleme düğmesiyle seç. HKM ambarı HKM › Sistemler › Yedek ile geri yüklenir.",
                  "Dosyalar düz JSON'dur; herhangi bir metin düzenleyiciyle okunabilir.", ""]
        satir += TASIMA_ADIMLARI
        z.writestr("BENIOKU.txt", "\n".join(satir) + "\n")
    return tampon.getvalue()

