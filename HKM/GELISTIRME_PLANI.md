# HKM kullanım ve yapay zekâ geliştirme planı

Bu planın hedefi HKM'yi günlük kullanılan, Telegram'dan farklı veri türleri
alabilen ve maliyeti denetlenebilir bir yardımcıya dönüştürmektir. Kural
motoru kararın kaynağı olarak kalır; model yalnız izin verilen içeriği işler
ve sonuç her zaman kaynağıyla etiketlenir.

## 1. Medya taşıma

Durum: **ilk kapı tamamlandı.** Telegram fotoğraf, video, sesli mesaj, ses ve
belge güncellemeleri artık kaybolmuyor; güvenli metaveriyle `attachments`
kuyruğuna giriyor.

Sonraki teslim:

- `getFile` ile dosyayı arka planda indirme; webhook/yoklama yanıtını
  bekletmeme.
- Tür ve boyut için ayrı üst sınırlar; sınırı aşan dosyayı indirmeden
  açıklamalı ret.
- Dosya özeti ve SHA-256 ile tekrar yüklemeyi ayırma.
- Ham dosya için kullanıcı tarafından seçilen saklama süresi ve otomatik
  budama.

## 2. Tür bazlı analiz

- Fotoğraf: görsel model; tahlil veya sağlık belgesinde teşhis ve doz sınırı.
- Sesli mesaj/ses: transkripsiyon, ardından açık komut veya kullanıcı onaylı
  hafıza adayı çıkarma.
- PDF/belge: yerel metin çıkarımı; yalnız gereken sayfaları modele gönderme.
- Video: süre, boyut ve kare örnekleme sınırı; tüm videoyu varsayılan olarak
  modele göndermeme.

Her analiz `pending / processing / analyzed / failed / rejected` durumlarından
birini taşır. Başarısız analiz dosyayı kaybetmez ve uydurma sonuç üretmez.

## 3. Yapay zekâ hafızası

Hafıza iki ayrı sınıf olacaktır:

- **Açık hafıza:** kullanıcı “bunu hatırla” dediğinde yazılır; kullanıcı
  listeler, düzeltir ve siler.
- **Hafıza adayı:** model konuşmadan bir aday çıkarabilir ama kullanıcı
  onaylamadan kalıcı hafızaya dönüşmez.

Her kayıtta kaynak, oluşturulma tarihi, son kullanım tarihi, kapsam ve son
kullanma tarihi bulunur. Sağlık verisi varsayılan olarak kalıcı sohbet
hafızasına alınmaz.

## 4. Model API geçidi ve limit

- OpenRouter, OpenAI, Anthropic ve Google için tek çağrı sözleşmesi.
- Çağrı öncesi aylık TL bütçe kilidi ve sağlayıcı anahtar limiti kontrolü.
- Zaman aşımı, 429 geri çekilmesi ve en fazla bir güvenli tekrar.
- Sağlayıcının bildirdiği giriş/çıkış tokenı ile maliyet kaydı.
- Maliyet dönmediyse `0` yazmak yerine `veri yok`; sonradan fatura uzlaştırma.
- API çalışmadığında mevcut yerel HKM cevabına anında geri dönüş.

Model yalnız kural motorunun kurduğu cevap, kullanıcı tarafından analiz için
gönderilen dosya veya açık hafıza kapsamını görür. Ham ambarın tamamı modele
verilmez.

## 5. Günlük kullanım akışı

- Telegram yanıtında “alındı”, “analiz bekliyor”, “analiz tamamlandı” ve
  “limit nedeniyle yerel yanıt kullanıldı” durumları açıkça görünür.
- Uzun işler giden kutusundan sonuçlanır; kullanıcı Telegram yanıtını
  beklerken bağlantı açık tutulmaz.
- HKM yüzünde ek kuyruğu, hata nedeni, model/yerel cevap işareti ve bütçe
  durumu tek ekranda gösterilir.

## Teslim sırası

1. Güvenli indirme, boyut sınırı ve saklama politikası.
2. Model geçidi, bütçe koruması ve kullanım ölçümü.
3. Fotoğraf, ses ve belge analiz işçileri.
4. Onaylı hafıza ve hafıza yönetim ekranı.
5. Video kare örnekleme ve uzun iş bildirimleri.

Her aşama HKM birim testleri ve duman testi geçmeden sonraki aşamaya
taşınmaz.
