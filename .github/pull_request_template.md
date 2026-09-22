## Ne değişti

<!-- Bir cümle: hangi davranış değişti? Dosya listesi değil, DAVRANIŞ. -->

## Neden

<!-- Hangi bulgu? `dosya:satır · ne yanlış · hangi girdide bozulur` -->

## Koşturulan denetimler

<!-- Çıktının SON SATIRINI yapıştır; «geçti» demek yetmez, sayı gösterir. -->

- [ ] `node tools/runtests.js` →
- [ ] `node tools/smoke.js` →
- [ ] `node tools/layoutcheck.js` / `a11ycheck.js` (arayüz değiştiyse) →
- [ ] `cd HKM && python3 -m tests.run` (HKM değiştiyse) →
- [ ] `node tools/entegre.js` (iki tarafı birden ilgilendiriyorsa) →

## Doktrin kontrolü

- [ ] Kural motoru otoritedir; model sayı üretmiyor
- [ ] Eksik veri sıfır sayılmıyor, etiketi taşınıyor
- [ ] Yeni çalışma zamanı bağımlılığı **yok**
- [ ] Hiçbir modül HKM'ye bağımlı değil (HKM kapalıyken çalışıyor)
- [ ] Yeni aksiyonun seviyesi katalogda (küçük/orta/büyük) ve geri alınabiliyor
- [ ] Kullanıcıya giden metin düzgün Türkçe
- [ ] Yeni davranışın testi var / düzeltilen hatayı yakalayan test var
