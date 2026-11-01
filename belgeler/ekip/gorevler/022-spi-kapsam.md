# 022 · SPI ekran işlerinin tamamı King aracı (KING-4 A2)

**Durum:** bekliyor
**Dal:** `ag/022-spi-kapsam`
**Efor:** orta
**Kabul testi:** `tools/king_kapsam_spi_kabul_test.py`

## Amaç
KING-4 §A2: «her modül ekranındaki her okuma ve yazma işi tipli bir araç olur … hedef: ekranda yapılan işin %100'ü King'de». Kapsam testi `node tools/king_kapsam.js --modul=spi` bugün SPI için kırmızı: `tools/king_kapsam.json`'daki eşleme, `SP.Model`'in her yazma işlevini ve gezinmedeki her rotayı bir araca bağlıyor; şu araçlar henüz yok:

- `spi_antrenman_sil`
- `spi_butce`
- `spi_gida`
- `spi_hane`
- `spi_hane_oku`
- `spi_hedefler`
- `spi_ilac`
- `spi_karar_kapat`
- `spi_market`
- `spi_mutfak`
- `spi_ogun_sil`
- `spi_planlar`
- `spi_profil`
- `spi_tahlil_sil`

## Dokunulacak dosyalar
- `SPI/src/js/core/kingarac.js` — yukarıdaki araçlar, `brand/ortak/arac.js` biçiminde (başındaki «Araç tanımı» yorumu). Örnek: `spi_barkod_ogun` (onizle/uygula/geriAl), okuma için `spi_tahliller`. 2c oturumu SPİ `store.js` üzerinde çalışıyor: `store.js`'e dokunma.
- `SPI/src/tests/kingarac.test.js` — her yeni araç için en az bir sınama (araç adı tırnak içinde geçsin).

## Araç kuralları (AGENTS §1; arac.js sözleri)
- Ad, açıklama (Türkçe, modelin okuyacağı), küçük JSON şeması (`string/number/integer/boolean`, `enum`, `minimum/maximum`, `maxLength`, `required`), tür `oku` ya da `yaz`.
- **Okuma** (`…_oku`, çoğul adlar: `ays_profiller`, `spi_planlar`, `esp_olaylar` …) hiçbir kaydı değiştirmez; sayıyı modülün kendi kaydı ve hesabı verir; kaydı olmayan «veri yok»tur, sıfır değil. Dönüş: `{ sonuc, satirlar }`.
- **Yazma** her zaman `onizle` (ne değişecek, satırlarla) ve `uygula` verir; `uygula` `{ metin, geriAl }` döner ve `geriAl` yapılan işi tam geri alır (silinen kaydı aynen geri yazar). Bir varlığın hem kaydı hem silmesi aynı araçsa `islem` parametresi `enum:['ekle','guncelle','sil']` olur; silme ve güncelleme kaydı `id` ya da kullanıcının söylediği adla bulur, birden çok eşleşmede tahmin etmez, `{ hata }` döner.
- Sağlık ve ilaç araçları teşhis koymaz, doz önermez (§1.5): yalnız kullanıcının söylediğini yazar.
- Model işlevlerini ekranın kullandığı biçimde çağır (ilgili `screens/*.js`'e bak); yeni Model işlevi ya da depolama anahtarı ekleme.
- `tools/king_kapsam.json` eşlemesini değiştirme. Eşlemede bir işlev yanlış araca bağlıysa ya da bir araç gereksizse Sonuç'a yaz, Claude Code düzeltir.

## Dokunma
- `brand/`, `SPI/src/js/core/king*.js` dışındaki kopyalar, `SPI/src/js/app.js`, ekran dosyaları (`screens/`), `tools/king_kapsam.js`, `tools/king_kapsam.json`, kabul testi dosyası, dist ve build.js.

## Kabul ölçütü
- `node tools/king_kapsam.js --modul=spi` çıkış 0 («King kapsamı: tam»).
- Her yeni araç `SPI/src/tests/kingarac.test.js`'te sınanıyor: okuma aracı örnek veriyle doğru sayıyı, kaydı olmayan durumda «veri yok»u; yazma aracı önizlemeyi, uygulamayı ve geri almayı (geri aldıktan sonra kayıt eski hâlinde).
- SPI test takımı yeşil.

## Koşulacak testler
- `python tools/king_kapsam_spi_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd SPI && node tools/runtests.js <senin portun>`

## Sonuç
- **Ne değişti:**
- **Koşan testler:**
- **Kabul testi:**
- **Açık kalan:**
