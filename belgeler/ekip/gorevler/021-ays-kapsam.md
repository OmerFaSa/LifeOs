# 021 · AYS ekran işlerinin tamamı King aracı (KING-4 A2)

**Durum:** bitti
**Dal:** `ag/021-ays-kapsam`
**Efor:** orta
**Kabul testi:** `tools/king_kapsam_ays_kabul_test.py`

## Amaç
KING-4 §A2: «her modül ekranındaki her okuma ve yazma işi tipli bir araç olur … hedef: ekranda yapılan işin %100'ü King'de». Kapsam testi `node tools/king_kapsam.js --modul=ays` bugün AYS için kırmızı: `tools/king_kapsam.json`'daki eşleme, `R.Model`'in her yazma işlevini ve gezinmedeki her rotayı bir araca bağlıyor; şu araçlar henüz yok:

- `ays_deneme`
- `ays_enerji`
- `ays_etkinlik`
- `ays_hafta_degerlendirme`
- `ays_kart`
- `ays_konu_durumu`
- `ays_mesgale_ekle`
- `ays_mola`
- `ays_profil`
- `ays_profiller`
- `ays_takvim`
- `ays_telafi`
- `ays_video_notu`
- `ays_yanlis`

## Dokunulacak dosyalar
- `AYS/src/js/core/kingarac.js` — yukarıdaki araçlar, ortak araç kataloğunun biçiminde (arac.js başındaki «Araç tanımı» yorumu; salt okunur). Mevcut yazma araçları `R.ACTIONS` + `R.Proposals.hemen` yolundan gelir (`yazma()`); yeni araçlar `R.Model` işlevlerini doğrudan çağırır, `liste()`'ye eklenir.
- `AYS/src/tests/kingarac.test.js` — her yeni araç için en az bir sınama (araç adı tırnak içinde geçsin).

## Araç kuralları (AGENTS §1; arac.js sözleri)
- Ad, açıklama (Türkçe, modelin okuyacağı), küçük JSON şeması (`string/number/integer/boolean`, `enum`, `minimum/maximum`, `maxLength`, `required`), tür `oku` ya da `yaz`.
- **Okuma** (`…_oku`, çoğul adlar: `ays_profiller`, `spi_planlar`, `esp_olaylar` …) hiçbir kaydı değiştirmez; sayıyı modülün kendi kaydı ve hesabı verir; kaydı olmayan «veri yok»tur, sıfır değil. Dönüş: `{ sonuc, satirlar }`.
- **Yazma** her zaman `onizle` (ne değişecek, satırlarla) ve `uygula` verir; `uygula` `{ metin, geriAl }` döner ve `geriAl` yapılan işi tam geri alır (silinen kaydı aynen geri yazar). Bir varlığın hem kaydı hem silmesi aynı araçsa `islem` parametresi `enum:['ekle','guncelle','sil']` olur; silme ve güncelleme kaydı `id` ya da kullanıcının söylediği adla bulur, birden çok eşleşmede tahmin etmez, `{ hata }` döner.
- Sağlık ve ilaç araçları teşhis koymaz, doz önermez (§1.5): yalnız kullanıcının söylediğini yazar.
- Model işlevlerini ekranın kullandığı biçimde çağır (ilgili `screens/*.js`'e bak); yeni Model işlevi ya da depolama anahtarı ekleme.
- `tools/king_kapsam.json` eşlemesini değiştirme. Eşlemede bir işlev yanlış araca bağlıysa ya da bir araç gereksizse Sonuç'a yaz, Claude Code düzeltir.

## Dokunma
- `brand/`, `AYS/src/js/core/king*.js` dışındaki kopyalar, `AYS/src/js/app.js`, ekran dosyaları (`screens/`), `tools/king_kapsam.js`, `tools/king_kapsam.json`, kabul testi dosyası, dist ve build.js.

## Kabul ölçütü
- `node tools/king_kapsam.js --modul=ays` çıkış 0 («King kapsamı: tam»).
- Her yeni araç `AYS/src/tests/kingarac.test.js`'te sınanıyor: okuma aracı örnek veriyle doğru sayıyı, kaydı olmayan durumda «veri yok»u; yazma aracı önizlemeyi, uygulamayı ve geri almayı (geri aldıktan sonra kayıt eski hâlinde).
- AYS test takımı yeşil.

## Koşulacak testler
- `python tools/king_kapsam_ays_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd AYS && node tools/runtests.js <senin portun>`

## Sonuç
- **Ne değişti:** AYS/src/js/core/kingarac.js içine 14 yeni King aracı eklendi; ays_deneme eklemede doğru/yanlış/boş zorunlu kılındı (netten veri uydurma engellendi), ays_etkinlik güncellemesinde Object.assign sırası düzeltildi, 10 ayrı arama işlevi tek bir bul() yardımcısında birleştirildi. AYS/src/tests/kingarac.test.js içine her yeni araç için önizleme, uygulama, geri alma ve sınır durum sınamaları eklendi.
- **Koşan testler:** python tools/king_kapsam_ays_kabul_test.py -> king kapsam ays kabul: ekran islerinin tamami arac, 14 yeni arac sinanmis. · cd AYS && node tools/runtests.js 4711 -> 3162/3162 gecti · node tools/king_kapsam.js --modul=ays --port=4441 -> King kapsamı: tam
- **Kabul testi:** python tools/king_kapsam_ays_kabul_test.py -> king kapsam ays kabul: ekran islerinin tamami arac, 14 yeni arac sinanmis. (çıkış 0)
- **Açık kalan:** yok
