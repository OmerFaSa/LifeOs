# ===== BU BLOK URETILMISTIR — BURAYI DUZENLEME =====
# Kaynak: brand/seviye/dist_kopya.py
# Yayan:  python3 tools/seviye.py --yay   (denetim: --denetle)
def copy_level_assets() -> None:
    """Seviye videolari ve rozetleri TEK KOPYA durur: depo kokundeki
    brand/seviye/. Uc sistem de onlari /img/seviye/... adresinden okur
    (bkz. devserver.py ve sunucu.py). Tek dosya surumu ise kendi basina
    tasinabilmeli, bu yuzden burada dist/img/seviye/ icine kopyalanir.

    Klasor yoksa ya da bossa hicbir sey yapilmaz: eksik video hata
    degildir, kutlama banner'a duser."""
    src_dir = ROOT.parent / "brand" / "seviye"
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
# ===== URETILMIS BLOK SONU =====
