# 023 · ESP ekran işlerinin tamamı King aracı (KING-4 A2)

**Durum:** bitti
**Dal:** `ag/023-esp-kapsam`
**Efor:** orta
**Kabul testi:** `tools/king_kapsam_esp_kabul_test.py`

## Amaç
KING-4 §A2: «her modül ekranındaki her okuma ve yazma işi tipli bir araç olur … hedef: ekranda yapılan işin %100'ü King'de». Kapsam testi `node tools/king_kapsam.js --modul=esp` bugün ESP için kırmızı: `tools/king_kapsam.json`'daki eşleme, `ESP.Model`'in her yazma işlevini ve gezinmedeki her rotayı bir araca bağlıyor; şu araçlar henüz yok:

- `esp_arguman`
- `esp_argumanlar`
- `esp_dosya`
- `esp_eser`
- `esp_hatirlatma`
- `esp_hedef`
- `esp_karar_kapat`
- `esp_kart_sil`
- `esp_kaynak`
- `esp_kitap`
- `esp_merdiven`
- `esp_not_sil`
- `esp_olay`
- `esp_olaylar`
- `esp_oturum`
- `esp_repertuvar`
- `esp_ses_kaydi`
- `esp_taslak`
- `esp_zincir`

## Dokunulacak dosyalar
- `ESP/src/js/core/kingarac.js` — yukarıdaki araçlar, ortak araç kataloğunun biçiminde (arac.js başındaki «Araç tanımı» yorumu; salt okunur). Örnek: `esp_kitap_bitir`, `esp_alinti_ekle` (onizle/uygula/geriAl), okuma için `esp_kitaplar`.
- `ESP/src/tests/kingarac.test.js` — her yeni araç için en az bir sınama (araç adı tırnak içinde geçsin).

## Araç kuralları (AGENTS §1; arac.js sözleri)
- Ad, açıklama (Türkçe, modelin okuyacağı), küçük JSON şeması (`string/number/integer/boolean`, `enum`, `minimum/maximum`, `maxLength`, `required`), tür `oku` ya da `yaz`.
- **Okuma** (`…_oku`, çoğul adlar: `ays_profiller`, `spi_planlar`, `esp_olaylar` …) hiçbir kaydı değiştirmez; sayıyı modülün kendi kaydı ve hesabı verir; kaydı olmayan «veri yok»tur, sıfır değil. Dönüş: `{ sonuc, satirlar }`.
- **Yazma** her zaman `onizle` (ne değişecek, satırlarla) ve `uygula` verir; `uygula` `{ metin, geriAl }` döner ve `geriAl` yapılan işi tam geri alır (silinen kaydı aynen geri yazar). Bir varlığın hem kaydı hem silmesi aynı araçsa `islem` parametresi `enum:['ekle','guncelle','sil']` olur; silme ve güncelleme kaydı `id` ya da kullanıcının söylediği adla bulur, birden çok eşleşmede tahmin etmez, `{ hata }` döner.
- Sağlık ve ilaç araçları teşhis koymaz, doz önermez (§1.5): yalnız kullanıcının söylediğini yazar.
- Model işlevlerini ekranın kullandığı biçimde çağır (ilgili `screens/*.js`'e bak); yeni Model işlevi ya da depolama anahtarı ekleme.
- `tools/king_kapsam.json` eşlemesini değiştirme. Eşlemede bir işlev yanlış araca bağlıysa ya da bir araç gereksizse Sonuç'a yaz, Claude Code düzeltir.

## Dokunma
- `brand/`, `ESP/src/js/core/king*.js` dışındaki kopyalar, `ESP/src/js/app.js`, ekran dosyaları (`screens/`), `tools/king_kapsam.js`, `tools/king_kapsam.json`, kabul testi dosyası, dist ve build.js.

## Kabul ölçütü
- `node tools/king_kapsam.js --modul=esp` çıkış 0 («King kapsamı: tam»).
- Her yeni araç `ESP/src/tests/kingarac.test.js`'te sınanıyor: okuma aracı örnek veriyle doğru sayıyı, kaydı olmayan durumda «veri yok»u; yazma aracı önizlemeyi, uygulamayı ve geri almayı (geri aldıktan sonra kayıt eski hâlinde).
- ESP test takımı yeşil.

## Koşulacak testler
- `python tools/king_kapsam_esp_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd ESP && node tools/runtests.js <senin portun>`

## Sonuç
- **Ne değişti:** `ESP/src/js/core/kingarac.js` içine 19 yeni King aracı (4 okuma: `esp_merdiven`, `esp_argumanlar`, `esp_olaylar`, `esp_repertuvar`; 15 yazma: `esp_oturum`, `esp_arguman`, `esp_dosya`, `esp_eser`, `esp_hatirlatma`, `esp_hedef`, `esp_karar_kapat`, `esp_kart_sil`, `esp_kaynak`, `esp_kitap`, `esp_not_sil`, `esp_olay`, `esp_ses_kaydi`, `esp_taslak`, `esp_zincir`) eklendi. `ESP/src/tests/kingarac.test.js` içine her yeni araç için okuma ve yazma (önizleme, uygulama, geri alma) testleri eklendi.
- **Koşan testler:** `node tools/king_kapsam.js --modul=esp` -> `King kapsamı: tam` · `cd ESP && node tools/runtests.js 4733` -> `2611/2611 gecti`
- **Kabul testi:** `python tools/king_kapsam_esp_kabul_test.py` -> `king kapsam esp kabul: ekran islerinin tamami arac, 19 yeni arac sinanmis.`
- **Açık kalan:** yok
