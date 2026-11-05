# Usta planı

Kullanıcı (2026-11-05): her alanın uzman uygulamasındaki mekanikleri al; kullanıcıyı o dalda en profesyonel ve en hızlı şekilde ustalaştıran altyapıyı kur; insanın nasıl öğrendiğini araştır. Mekanik ve fikir alınır; başka uygulamanın adı, görseli ve içeriği alınmaz.

Çekirdek kuruldu: `brand/ortak/usta.js` (`LIFEOS.USTA`). Ekranı yok. Modüller kendi kaydını kanıta çevirip verir.

## Araştırmadan çıkan kurallar

| Bulgu | Güç | Burada ne yapar |
|---|---|---|
| Kendini sınama ve aralıklı pratik, on teknik içinde en yararlı ikisi; yeniden okuma ve altını çizme düşük (Dunlosky 2013) | Yüksek | Ustalık ölçüsü hatırlamadır, okuma ya da süre değil |
| Karışık pratik: 54 sınıflık ön kayıtlı deneyde %61'e karşı %38, d=0,83 (Rohrer 2020); başka saha deneyinde daha küçük, yıl sonunda etkisiz (Kremer) | Orta | Sağlam aşaması karışık sınama ister; sıra konuları karıştırır |
| Emin olup yanılmak geri bildirimle en kolay düzelen hatadır, ama gecikmeli testte daha sık geri döner (Butterfield 2001, Butler 2011) | Orta | Güven işareti; bu hata listenin başına ve yeniden sorulur |
| Bilinçli pratik başarıdaki farkın müzik ve oyunda ~%21-26'sını, eğitimde ~%4'ünü açıklıyor (Macnamara 2014; Ericsson itiraz eder) | Tartışmalı | Sonuç vaat edilmez (§1.5); sayı süre değil kalite ölçer |
| Motor beceride karışık pratik uzun vadede orta düzeyde iyi, uygulamada etki küçülüyor (Czyż 2024) | Orta-düşük | Müzikte öneri, kural değil |
| Polarize antrenman VO2peak'te küçük üstünlük (SMD 0,24), yarış süresinde fark yok (Oliveira 2024) | Orta | 80/20 kural olarak dayatılmaz, yalnız dağılım gösterilir |
| ACWR'nin sakatlık öngördüğüne kanıt yok; etkinin büyük kısmı istatistik yapaylığı olabilir (Impellizzeri 2020, 2021) | Yüksek | SPİ'deki «sakatlanma riski yükselir» cümlesi fazla iddialı, düzeltilecek |
| %95-98 kelime kapsamı okuma eşiği, 98 tartışmalı (Hu-Nation 2000, Nation 2006, tekrar çalışması) | Orta | Sıklık kapsamı zaten var; eşik «sistem ayarı» etiketiyle kalır |
| Çok konuşmacılı ses eğitimi meta-analizi 79 çalışma (Uchihara 2025); gölgeleme için yalnız hakemsiz tez | Düşük-orta | Dikte öncelikli; gölgeleme zaten var, ağırlık verilmez |

**Kullanılmayanlar:** iki sigma etkisi (2020 derlemesi 0,37 SD; ikincil kaynak), %85 kuralı (yazarı sınıfa aktarılmasına karşı), FSRS'in tekrar azaltma yüzdeleri (yalnız ikincil kaynaklar, 10-50 arası çelişkili).

## Çekirdek

Beceri, araya zaman girince ipucusuz da tutuyorsa ilerler. Kelime, konu, temiz tempo, koşu hedefi aynı biçime iner.

| Aşama | Kural (sistem ayarı, araştırma sayısı değil) |
|---|---|
| Veri yok | Kanıt yok; sıfır değil |
| Öğreniyor | Son ipucusuz sınama yanlış ya da hiç doğru yok |
| Tutuyor | Doğru, kanıtlı ara < 7 gün |
| Kalıcı | İki doğru arasında ≥ 7 gün |
| Sağlam | ≥ 21 gün ara ve karışık sınamada doğru |

Yanlış zinciri keser. Son aşamanın adı «usta» değildir: yargı kişiye değil kayda söylenir (§1.5).

## Durum (2026-11-05)

Çalışıyor: 1 (yalnız ESP dil), 2'nin kalıcılık kartı (yalnız ESP dil), 3, 4. `USTA.sira` testli ama henüz hiçbir ekrana bağlı değil; ilk kullanıcısı AYS olacak.

## Boşluklar (etkiye göre)

Var olan ve önerilmeyen: AYS'de hız-isabet, sülük kart, karışık sınav, öğrenme yolu, yanlış defteri; ESP'de aralıklı tekrar, sıklık kapsamı, gölgeleme, cümle kurma, merdiven, temiz tempo, kulak eğitimi, okuma düzeyleri, «anlat»; SPİ'de GPX, canlı kayıt, km dilimleri, ısı haritası, RPE yükü, programlar.

| # | Alan | Mekanik | Veri hazır mı | Boyut |
|---|---|---|---|---|
| 1 | AYS + ESP dil | Soru başına güven işareti, emin yanılan başa | Yeni girdi | Küçük |
| 2 | AYS + ESP dil | Kalıcılık haritası ve karışık günlük sıra | Var (kart ve test geçmişi) | Küçük |
| 3 | SPİ koşu | Kişisel rekorlar (1/5/10 km en iyi çaba, rota noktalarından) | Var | Küçük |
| 4 | SPİ koşu | Tempo grafiği (dilimler hesaplanıyor, çizilmiyor) | Var | Çok küçük |
| 5 | SPİ koşu | Aynı rotada kendinle yarış (segment fikri) | Var | Orta |
| 6 | SPİ koşu | Haftalık yoğunluk dağılımı (RPE'den kolay/zor) | Var | Küçük |
| 7 | ESP dil | Dikte: duy ve yaz | Var (kartlar, tarayıcı sesi) | Küçük |
| 8 | ESP dil | Kişisel unutma eğrisi: geçmişten kart başına kararlılık | Var, göç riski | Büyük |
| 9 | ESP okuma | Kitabı kapat, notlardan hatırla | Var | Küçük |
| 10 | ESP müzik | Karışık parça sırası ve hata bölgesi | Kısmi, doğrulanmadı | Orta |
| 11 | SPİ kuvvet | Hareket başına en iyi set (1RM testi yok, kataloğun sözü) | Var | Küçük |
| 12 | SPİ | ACWR cümlesini kanıta çek (`SPI/src/js/data/movement.js:329`) | Yok, metin | Çok küçük |

## Kaynaklar

- [Dunlosky ve ark. 2013, özet](https://www.psychologicalscience.org/news/releases/which-study-strategies-make-the-grade.html)
- [Rohrer ve ark. 2020 kaydı](https://ies.ed.gov/ncee/WWC/Study/80702), [Kremer ve ark., NBER](https://nber.org/system/files/working_papers/w31853/w31853.pdf)
- [Hiperdüzeltme kalıcılığı, Butler ve ark. 2011](https://pubmed.ncbi.nlm.nih.gov/21989771/)
- [Macnamara ve ark. 2014](https://pmc.ncbi.nlm.nih.gov/articles/PMC4101876)
- [Czyż ve ark. 2024](https://link.springer.com/10.1038/s41598-024-65753-3)
- [Oliveira ve ark. 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11329428)
- [Impellizzeri ve ark. 2020](https://read.qxmd.com/read/32125672/analyzing-activity-and-injury-lessons-learned-from-the-acute-chronic-workload-ratio)
- [Kelime kapsamı tekrarı](https://www.cambridge.org/core/journals/language-teaching/article/how-much-vocabulary-is-needed-to-use-english-replication-of-van-zeeland-schmitt-2012-nation-2006-and-cobb-2007/1D217A56A2E0056E67802A6A8360FDDE)
- [Uchihara ve ark. 2025](https://www.cambridge.org/core/product/6ABB8C1F32D88D53EA8D05A4565E76F6/core-reader)
- [Anki aralıklı tekrar SSS](https://docs.ankiweb.net/faqs/what-spaced-repetition-algorithm)
