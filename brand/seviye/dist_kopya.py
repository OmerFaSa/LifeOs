# ===== BU BLOK URETILMISTIR — BURAYI DUZENLEME =====
# Kaynak: brand/seviye/dist_kopya.py
# Yayan:  python3 tools/seviye.py --yay   (denetim: --denetle)
def copy_level_assets() -> None:
    """Rutbe kartlari ve kademe sahneleri TEK KOPYA durur: depo
    kokundeki brand/seviye/medya/. Uc sistem de onlari /img/seviye/...
    adresinden okur (bkz. devserver.py ve sunucu.py). Tek dosya surumu
    ise kendi basina tasinabilmeli, bu yuzden burada dist/img/seviye/
    icine kopyalanir.

    Yalniz `medya/` kopyalanir. `brand/seviye/eski/` servis EDILMEZ ve
    buraya da girmez: arsivlenmis bir dosyayi uc dagitima birden
    tasimak, sakladigin seyi uc kez tasimaktir.

    Klasor yoksa ya da bossa hicbir sey yapilmaz: eksik gorsel hata
    degildir, perde karti kendisi cizer."""
    src_dir = ROOT.parent / "brand" / "seviye" / "medya"
    if not src_dir.exists():
        return
    medya = [f for f in src_dir.iterdir()
             if f.is_file() and f.suffix.lower() in (".mp4", ".webm", ".png",
                                                     ".jpg", ".webp", ".svg")]
    if not medya:
        return
    dst_dir = DIST / "img" / "seviye"
    dst_dir.mkdir(parents=True, exist_ok=True)
    for f in medya:
        shutil.copy2(f, dst_dir / f.name)

    # KAYNAKTA OLMAYAN DOSYA HEDEFTE DE KALMAZ. Bu betik uzun sure
    # yalniz KOPYALIYORDU: adi degisen ya da arsive kaldirilan bir
    # medya dosyasi uc `dist/` icinde yasamaya devam ediyordu. Olculdu
    # — `kademe-1.mp4` arsive alindiktan sonra uc dagitimda 4,6 MB'lik
    # olu kopya olarak duruyordu. Dagitim, kaynagin AYNASIDIR.
    # MARKA MEDYASI da tek dosya surumune gider. Ayri bir klasorden
    # gelir (`brand/medya/<aile>/`) ama AYNI duz adla servis edilir —
    # aile addan turer, yoldan degil (bkz. `_ortak_marka_yolu`).
    marka_kok = ROOT.parent / "brand" / "medya"
    marka = []
    if marka_kok.is_dir():
        for aile in sorted(marka_kok.iterdir()):
            if not aile.is_dir():
                continue
            marka += [f for f in sorted(aile.iterdir())
                      if f.is_file() and f.suffix.lower() in (
                          ".mp4", ".webm", ".png", ".jpg", ".webp", ".svg")]
    if marka:
        m_dst = DIST / "img" / "marka"
        m_dst.mkdir(parents=True, exist_ok=True)
        for f in marka:
            shutil.copy2(f, m_dst / f.name)
        m_kalan = {f.name for f in marka}
        for eski in m_dst.iterdir():
            if eski.is_file() and eski.name not in m_kalan:
                eski.unlink()

    kalanlar = {f.name for f in medya}
    for eski in dst_dir.iterdir():
        if eski.is_file() and eski.name not in kalanlar:
            eski.unlink()
# ===== URETILMIS BLOK SONU =====
