# AYS sadelik dökümü

Depo sahibi (2026-11-06): «bir bölümde birden fazla özellik olduğundan anlaşılmıyor ve karmaşık
gözüküyor». Kural: **bir bölüm, bir iş.** Fazlası kendi katına gider; hiçbir işlev silinmez.

Ölçüm: örnek veriyle, 390 piksel telefon, her ekran gerçekten açıldı. Söz = görünen sözcük,
düğme = görünen düğme, alan = yazı ya da seçim alanı. «Dolu» = ekrandaki birincil düğme.
Boş profilde de bakıldı (aşağıda). Sayılar tahmin değil ölçümdür; «özellik» elle sayıldı.
Deneme ve Gelecek'te düğme sayısı bölüm seçicisi yüzünden artar; üst düğmeler bu sayıya hiç girmez.

## Önce / sonra (en karmaşıktan en sadeye)

Sonra sütunları **açılan ilk katı** gösterir; öbür katlar parantezde.

| Sıra | Ekran | Tek işi | Özellik önce → açılan katta | Söz | Düğme | Alan | Boy (px) | Birincil eylem önce → sonra |
|---|---|---|---|---|---|---|---|---|
| 1 | Analiz › İlerleme | Gidişatım nasıl? | 12 → 9 kart, tek konu | 294 → 116 | 12 → 9 | 3 → 0 | 3452 → 1993 | Karar formu sayfanın ortasında → Özet'te yok; Karar katında, seçicide rozet |
| 2 | Plan › Hafta | Bu hafta ne var? | 7 → 2 (hafta seçici + günler) | 281 → 111 | 12 → 6 | 15 → 0 | 2694 → 2113 | Haftayı imzala 2. ekranda → Sözleşme katında, rozetli |
| 3 | Çalışma › Konu kapanışı | Hangi konu bitti? | 7 → 3 | 195 → 169 | 39 → 39 | 1 → 1 | 2216 → 1908 | Konu listesi haritanın altında → ilk iş |
| 4 | Ofis › Danışma | Uzmana sor | 5 → 1 (sohbet) | 175 → 68 | 18 → 16 | 1 → 1 | 2125 → 1299 | Sor kutusu → değişmedi; yüzlerin altına ad geldi |
| 5 | Ofis › Masalar | Bugün ne dediler? | 6 → 3 | 160 → 92 | 10 → 10 | 0 → 0 | 1858 → 1515 | Toplantı başlat + 3 yan düğme → Toplantı başlat + Patron'a danış |
| 6 | Analiz › Gelecek | Bu gidişle nereye? | 4 → 3 (deney ayrı) | 206 → 147 | 3 → 4 | 0 → 0 | 1967 → 1673 | Yarın başlat tahminin altında → Deney katında |
| 7 | Çalışma › Deneme | Denemelerim | 6 → 1 (liste) | 128 → 76 | 4 → 6 | 0 → 0 | 1920 → 1303 | Boşken iki «ekle» → tek |
| 8 | Çalışma › Soru çöz | Soruyu çöz | 5 → 1 | 149 → 36 | 8 → 6 | 3 → 0 | 1362 → 931 | Sor kartı → değişmedi, tek başına |
| 9 | Çalışma › Tekrar | Kartları tekrar et | 3 → 1 + şerit | 98 → 70 | 7 → 7 | 0 → 0 | 1557 → 1390 | Uyarı 3 satır → 2 satır + «Neden?»; Tekrar paketi şerit |
| 10 | Bugün | Şimdi ne yapayım? | 3 → 3 | 53 → 50 | 11 → 9 | 1 → 1 | 1580 → 1580 | Başla → değişmedi; 7 kısa yol → 5 |
| 11 | Ayarlar › Genel | Ayar bul | 1 → 1 | 87 → 56 | 20 → 20 | 7 → 0 | 2491 → 1766 | Yedi alanlı form açık → iOS gibi satır listesi |
| 12 | Ofis › Toplantı | Toplantı yap | 2 → 1 + şerit | 124 → 58 | 12 → 7 | 1 → 1 | 1643 → 1100 | Toplantıyı başlat → değişmedi |
| 13 | Çalışma › Sınama | Sınava başla | 2 → 1 + şerit | 74 → 59 | 14 → 15 | 1 → 1 | 1396 → 1069 | Sınamayı başlat → değişmedi; Havuz şerit |
| 14 | Plan › Program | Plana bak | 3 | 154 → 154 | 6 → 6 | 0 | 1546 → 1546 | Yok; dar sütun telefonda düzeldi |
| 15 | Öğren › Konular, Öğrenme | Konuya başla | 2 | 171; 39 | 30; 186 | 0; 2 | 2414; 1055 | **Dokunulmadı**, aşağıda soru 1 |
| 16 | Öğren › Anlatım, Sorular | Oku; çöz | 1 | 620; 211 | 16; 24 | 3; 2 | 5149; 1565 | Dokunulmadı: uzunluk içerikten |
| 17 | Plan › Hedefler; Analiz › Ayrıntı, Telafi; Onaylar; Kütüphane | Tek iş | 1 | ≤186 | ≤11 | ≤2 | ≤1991 | Sade; dokunulmadı |
| — | Ayarlar › Rütbe | — | — | 151 | 8 | 0 | 2862 | Kapsam dışı (depo sahibinin kararı) |

Yeni katların içi: İlerleme Netler 62 söz, Yol 80, Karar 94. Hafta Sözleşme 139, Özet 134.
Konu Genel 36. Deneme Özet 62. Soru çöz Kayıt 117, Geçmiş 20. Danışma Rapor 116, Ekip 58.
Masalar Uzmanlar 217, Kayıtlar 8. Gelecek Deney 39.

## Nereye ne gitti

Her şey hâlâ erişilebilir; kapı yalnız bir dokunuş uzakta.

| Ekran | Katlar |
|---|---|
| İlerleme | **Özet** · Netler (trend, test, aylık eğri, hata dağılımı) · Yol (harita, plan geçmişi, göstergeler) · Karar (aylık değerlendirme) |
| Hafta | **Günler** (hafta takvimi, öneri) · Sözleşme (form, istisna, revizyon) · Özet (ders dağılımı, değerlendirme, denge, geçmiş, müfredat) |
| Konu kapanışı | **Konular** (bekleyen ölçüm, dersler, konu listesi, zincir, kaynak) · Genel (harita, oran, risk, profiller) |
| Deneme | **Denemeler** (liste) · Özet (net, rekor, ders ders, sıra, hedef, takvim, hacim, yayın) |
| Soru çöz | **Sor** · Kayıt (çözüm sayısı, hızlı kayıt) · Geçmiş (kaynaklar, konu, son kayıtlar) |
| Danışma | **Sohbet** · Rapor · Ekip (ses, öbür uzmanlar) |
| Masalar | **Özet** (model notu, günün özeti, Patron, ürünler) · Uzmanlar · Kayıtlar (kararlar, kota, son toplantı) |
| Gelecek | **Tahmin** · Deney |

Bütün ekranlara değen üç değişiklik:

- **Sekme çubuğu yerinde durur.** Ekranın düğmeleri («Kart ekle», «Deneme ekle») başlığın altından
  sekmelerin altına indi; telefonda sekmeler bölümden bölüme oynamıyor (`app.js`, duman testi ölçer).
- **Bölüm seçmek sayfayı oynatmaz.** Bölüm zaten ekrandaysa kayma yok (`components.js bolumeGit`).
- **Başka yerden doğru kata gelinir.** `data-bolum` (Bugün › «Haftalık sözleşmeyi aç» Sözleşme'yi açar;
  arama ve komutlardaki konu ve ders satırları Konular'ı; King'e gelen fotoğraf Sor'u).

Kaldırılan yalnız yinelenen üç düğme: Danışma ve Toplantı'daki «Ofis» ile Patron kartındaki
«Toplantı odası». Üçü de hemen üstteki sekmeyle aynı yere gidiyordu. Bugün'den çıkan iki kısa yol
(Soru çöz, Deneme) Çalışma'da birer dokunuş, aramada ve klavyede duruyor.

## Boş profil

Yeni kullanıcıda da bakıldı (390 px): İlerleme 49 söz, Hafta 134, Deneme tek birincil düğme
(«İlk denemeyi ekle»), Soru çöz tek kart. Hafta'da ilk açılan kat Günler kalıyor; Sözleşme rozetle duruyor.

## Ortak gerekli (bu oturum dokunmadı)

Bunlar `brand/ortak/` içinde, üç modülü birden değiştirir:

- **Sekme çubuğu telefonda kesiliyor.** Çalışma'da beş sekme var, «Konu kapanışı» ekran dışında kalıyor. `kabuk.js` `bolumCubugu`.
- **«N bölüm gizli · Göster» her sayfanın dibinde.** Kullanıcı kendi gizlemediği şeyi «gizli» diye okuyor. Yalnız kullanıcının kendi gizledikleri sayılmalı. `gizle.js` söz 10.
- **Artı düğmesi içeriğin üstüne biniyor** (390 piksel). `kabuk.js` `hizliEkle`.
- **Öğrenme ekranı 186 düğme** çiziyor. `brand/ortak/` içindeki öğrenme motoru (`OMEKRAN`).
- **Kısa yollar iki satıra kırılıyor.** «Notlarım» ve «King'e sor» `kisayol.js` içinde sabit.
- **Hızlı kayıt telefonda sıkışık.** `vitrin.js` `tekSatirSoru`.
- **Masaüstünde sekmeler yine oynuyor.** Yaprak dikey ortalı olduğu için sayfa boyuyla kayıyor. Tercihten geldi; yukarı yaslamak üç modülü değiştirir, sormadan yapılmadı.

## Depo sahibine sorular

Hiçbiri yapılmadı; karar bekliyor.

1. **Öğren › Konular ile Öğren › Öğrenme birleşsin mi?** İkisi de konu listesi ve «başla» düğmesi gösteriyor. Biri Anlatım'a, öbürü adım adım öğrenmeye götürüyor. Öğren'de altı sekme bu yüzden kalabalık.
2. **«Ayrıntı» sekmesinin adı değişsin mi?** İçinde deneme karşılaştırma, hata haritası, sıra ve hız var; ad bunu söylemiyor. Öneri: «Neden?».
3. **Özet'te yinelenen kart silinsin mi?** İlerleme › Özet'te Tekrar kartı ile dönen «Tekrar borcu» aynı sayıyı söylüyor.

## Yapılmayanlar

- Sayı ve karar kodu değişmedi; tema değişmedi; Rütbe'ye dokunulmadı; `brand/ortak/` değişmedi.
- İlerleme › Özet hâlâ uzun (1993 px, 9 kart): kartlar `today.js PanoUst` ve ortak pano biçiminde; bölmek Faz 2 kararını açar.
- Konu kapanışı'nda 39 düğme kaldı: her konu bir düğme, liste ilk beşe kısılmış değil.
- Anlatım ve Sorular'ın içine girilmedi.
- `AYS/dist` yeniden derlenmedi: paralel oturumlarla çakışır, birleştirmeden sonra derlenir.

## Denetim

Davranış testleri: `AYS/src/tests/tekis.test.js` (tek kat açık, en çok bir dolu düğme, taşınan
parçalar yerinde, rozetler, kayma) ve `AYS/tools/smoke.js` `tekIs`.

| Denetim | Sonuç |
|---|---|
| `AYS` `runtests.js` | 3402/3402 |
| `AYS` `smoke.js` | temiz, 58 ekran, 10 sekme |
| `AYS` `layoutcheck.js` | temiz, 68 yer, 390 ve 820 piksel |
| `AYS` `a11ycheck.js` | temiz (1 bilinen eksik izin listesinde) |
| `tools/mobil_tara.js AYS` | 268 ölçüm, 0 bulgu |
| `tools/yazi.py --denetle` | temiz |
| `tools/pusula.js` | AYS iyi gün 3 eylem, Bugün 1 kart, 4 menü (hedefte) |
| `tools/sadelik.js AYS` | kuralı aşan tek ekran Rütbe (dokunulmadı) |
| `tools/envanter.js AYS` | 3 kayıp: `q-file`, `q-text`, `q-note`. Bu değişiklikten değil: bu alanlar yalnız model bağlıyken çiziliyor (`solve.js inputCard`, 2026-10-16), kod aynen duruyor |

**Envanter notu:** araç Node 24'te açılışta çöküyor (`sunucuBekle` içindeki `fetch`, `assert(!this.paused)`) ve
sunucusunu açık bırakıyor. Koşum, bekleme adımı `http.get` yapılmış geçici bir kopyayla, boş bir kapıdan alındı;
araç değiştirilmedi. Düzeltmesi kök `tools/` içinde, bu işin dışında.
