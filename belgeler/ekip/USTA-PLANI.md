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

Çalışıyor:

- **ESP dil:** güven işareti, kalıcılık kartı.
- **AYS:** güven işareti, konu kalıcılığı, Bugünkü sıra, «Sıradaki konular» kaynağı.
- **SPİ koşu:** kişisel rekorlar, göreli hız.
- **ESP bütün alanlar:** alan sınaması (`ESP/src/js/core/alan.js`). 68 konunun çalışma sorusu önce üretilir, sonra karşılaştırılır; kalıcı olan konuda soru aktarım görevine döner. Merdiven'de karışık sınama, konu listelerinde aşama.

## Alan başına kaynak ve yöntem

Ortak iskelet her alanda aynı: geri getir, ara ver, karıştır, kaynağa bak. Alan farkı yalnız neyin kanıt sayıldığıdır.

| Alan | Kaynak (uygulamada) | En güçlü bulgu | Durum | Boşluk |
|---|---|---|---|---|
| Felsefe | Stanford Felsefe Ansiklopedisi, kanon | Argüman haritalama ~0,8 SD, standart ders ~0,34 (eleştirel düşünme testinde; felsefe öğrenimini doğrudan ölçmüyor) | Tez ve itiraz, safsata denetimi, alan sınaması | Tezi görsel harita olarak çizmek |
| Tarih | Kongre Kütüphanesi | Kaynağı sorgulama ve yakın okuma kazandırıyor, kaynakları karşılaştırma zayıf (Reisman 2012, rastgele atamalı değil) | Kaynak eleştirisi, olay kartları, alan sınaması | Bir olay için iki kaynağı karşılaştırma görevi |
| Okuma | Open Library | Okuduktan sonra geri getirme yeniden okumadan iyi (ön bulgular); strateji tek başına değil, ön bilgiyle (Peng 2023) | Dört düzey, not, «anlat», alan sınaması | Kitabı kapatıp notlardan sorma; hızlı okuma için kanıt taranmadı |
| Yazı | Purdue OWL | Strateji öğretimi 0,59, akran desteği 0,59, geri bildirim 0,30 (Graham 2024; 2007'deki 0,82 sonra düştü) | Rubrikler, projeler, alan sınaması | Planla-gözden geçir adımları, dış okur geri bildirimi |
| Müzik | Open Music Theory, Mutopia | Göreve yönelik pratik ile başarı r≈0,61 (Platz 2014), süre değil nitelik; karışık pratik uygulamada küçük (Czyż 2024) | Temiz tempo, plato, kulak eğitimi, alan sınaması | Parça sırası ve hata bölgesi |
| Diksiyon | NIDCD | Bu taramada doğrudan kanıt bulunamadı | Ölçümlü diksiyon, alan sınaması | Yöntem önerilmedi, önce araştırılmalı |
| Dil | CEFR, Universal Dependencies | Bkz. yukarıdaki tablo | SRS, sıklık, gölgeleme, alan sınaması | Dikte, kişisel unutma eğrisi |

Bütün alanlarda: başkasına öğretmeye hazırlanmak salt çalışmadan iyi (Kobayashi 2019, etki büyüklüğü okunmadı); «anlat» bunun için temel.

Sınır: 68 kart öğretmen incelemesinden geçmedi (`ready_for_app:false`); ekran bunu söyler. Kaynak adresleri eklenirken tek tek açılmadı.

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
- [Argüman haritalama, Twardy](https://philarchive.org/archive/TWAAMIv1), [van Gelder özeti](https://ecampusontario.pressbooks.pub/criticalthinking1234/chapter/introduction/)
- [Tarih okuryazarlığı derlemesi](https://www.societyforhistoryeducation.org/pdfs/M18_Cribb_Maglio_and_Greenleaf.pdf)
- [Graham ve ark. 2024](https://bohrium.dp.tech/paper/arxiv/812122954769891329), [Writing Next özeti](https://www.adlit.org/topics/writing/summary-writing-next)
- [Prinz ve ark. 2020](https://link.springer.com/doi/10.1007/s10648-020-09558-6), [okumada geri getirme, bildiri](https://www.psychologicalscience.org/conventions/archive/2017annual/paper/3391/)
- [Platz ve ark. 2014](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4073287/)
