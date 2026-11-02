# 065 · King sınavını her modül aracına genişlet (53 araç, 2'şer cümle)

**Durum:** bekliyor
**Dal:** `ag/065-sinav-genis`
**Efor:** yüksek
**Kabul testi:** `tools/king_sinav_genis_kabul_test.py`

## Amaç
`tools/king_sinav_300_kabul_test.py` (görev 020, CI'da) her modül aracının (`ays_`, `spi_`, `esp_`, `eylem_`) sınavda en az 2 cümleyle beklenmesini ister. 2a'dan sonra eklenen 53 aracın hiç cümlesi yok; bu yüzden test her Testçi koşusunda kırmızı. Eksik listesi: `node tools/king_sinav.js --adlar` çıktısındaki araçlardan `tools/king_sinav.json`'da `arac:<ad>` olarak 2'den az geçenler (kabul testi ilk eksiği söyler; hepsini kendin say).

## Dokunulacak dosyalar
- `tools/king_sinav.json` — **sona** yeni cümleler (ilk 300 aynen kalır; sıra, metin, beklenen, `not` dahil).
- Gerekirse aracın tanımında `anahtar` / `es` / `ornek` alanları: `AYS/src/js/core/kingarac.js`, `SPI/src/js/core/kingarac.js`, `ESP/src/js/core/kingarac.js` (3a'daki 031–033 kalıbı: `belgeler/ekip/KING-4.md` «Tur 3a»). Aracın davranışı ve parametre şeması değişmez.

## Cümle kuralları
- Her eksik araç için en az 2 **gerçek, doğal Türkçe** cümle (öğrenci kullanıcının ağzından; biri emir, biri soru ya da farklı kalıp). Aynı cümle iki modülde olabilir ama aynı modülde tekrar yok.
- Biçim aynen: `{"g": <ays|spi|esp|genel grubu, modülüyle aynı>, "m": <modül>, "c": "<cümle>", "b": ["arac:<ad>", …kabul edilen başka kararlar], "a": {…}}`; `a` yalnız aracın zorunlu parametresi cümlede açıkça geçiyorsa, beklenen alt küme olarak.
- Yazan araç (silme, ekleme) cümlesi zorunlu parametreyi taşır («dünkü koşuyu sil», «3 numaralı öğünü sil» gibi); taşımayan cümle yazma (kural: eksik parametreyle yazma seçimi karar sayılmaz).
- Uydurma kimlik, tarih ya da sayı yok; danışma cümlesi («… nedir», «nasıl yaparım») araç beklemez, bu görevde kullanılmaz.
- `b`'de birden çok karar yalnız gerçekten ikisi de doğruysa (ör. `["arac:spi_hedefler", "git:spi:today"]` değil: yalnız biri).

## Dokunma
- `brand/`, `app.js`, araçların uygula/oku işlevleri, `tools/king_sinav.js`, `tools/king_sinav_300_kabul_test.py`, kabul testi dosyası, görev dosyasının Sonuç dışı. İlk 300 cümle.

## Kabul ölçütü
- `python tools/king_sinav_genis_kabul_test.py` yeşil: ilk 300 aynı; `king_sinav_300_kabul_test.py` yeşil (her araç ≥ 2); yeni cümlelerin ≥ %85'i doğru karara gider; eski 300'ün puanı 293'ün altına düşmez.
- Modül test takımları yeşil (kingarac.js'e dokunduysan).

## Koşulacak testler
- `python tools/king_sinav_genis_kabul_test.py` (önce kırmızı, sonra yeşil; ~3 dk)
- `node tools/king_sinav.js --port=<senin portun>`
- Dokunduğun modülde `node tools/runtests.js <senin portun>`

## Sonuç
