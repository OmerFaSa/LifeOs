# iPhone planı — LifeOS'un tamamı sade, öz, modern

> 2026-10-02 · Kullanıcı kararı: «Sistemin tamamını iPhone vibe'ına çeviriyoruz. iPhone'da
> sadelik olur; ne kullanıyorsan karşında olur, biter. Ben ekstra bir şey istemiyorum.»
>
> Bu dosya planın kendisi ve canlı durumudur (§8). Bir faz bitince durum satırı ve commit
> buraya yazılır; oturum yarıda kalırsa iş buradan sürer.

## 1. Ölçülen başlangıç (dolu örnek profil, 1440 × 900)

Gezinti betiği 58 ekranda 434 başlıklı kart saydı (kapalı sekmeler dahil). **Araç ölçüsü**
(§5: görünen, en dıştaki, küçük/gizli olmayan; Rütbe hariç): **188 açık kart, 3'ü aşan 22
ekran** (AYS 74 / 8 · SPİ 55 / 8 · ESP 59 / 6). En kalabalıklar:

| Ekran | Açık kart | Sayfa boyu |
|---|---|---|
| AYS Analiz › Ayrıntı | 23 | 2 078 px |
| ESP Rütbe · SPİ Rütbe · AYS Rütbe | 22 · 22 · 21 | ~2 500 px |
| ESP Dil | 21 | 972 px (sekmeli) |
| AYS Ayarlar › Genel | 19 | 4 728 px |
| ESP Tarih · ESP Stüdyo · ESP Analiz | 18 · 18 · 18 | 1 495 · 3 668 · 2 509 px |
| SPİ Hareket | 17 | 1 433 px |
| ESP Okuma | 16 | 1 575 px |
| ESP Merdiven · ESP Yazı · ESP Ayarlar | 12 · 12 · 12 | — |
| SPİ Testler · SPİ Analiz · SPİ Ayarlar | 11 · 11 · 11 | — |
| SPİ Bütçe | 10 | 1 331 px |
| AYS Telafi | 9 | 1 438 px |
| AYS İlerleme | 8 | 2 738 px |
| AYS Hedefler | 5 | 3 010 px |

Ölçüm aracı: `node tools/sadelik.js` (§5). Sayılar elle yazılmaz.

## 2. iPhone sözleşmesi

1. **Bir ekran, bir iş.** Ekranın işi ne ise o karşında durur; gerisi bir dokunuş ötededir
   (widget bağı, «Tümü», ⓘ, sayfa sonundaki «N bölüm gizli · Göster»).
2. **Açık kart ≤ 3.** İşin kendisi + en çok iki küçük widget. Ara sıra açılanlar tek satırlık
   şerittir (küçük), başvuru/açıklama/tekrar kartları baştan gizlidir.
3. **Sayfa boyu ≤ 1 200 px** (1440 × 900). Telefonda en çok iki ekran boyu.
4. **Ekranda açıklama yok.** Açıklama başlığın yanındaki ⓘ'dedir; kart alt yazısı en çok
   altı kelime; doktrin, araştırma, kılavuz metni ekranda durmaz.
5. **Uzun liste kısa gelir.** İlk 3–5 satır (ya da «şimdi» etrafı) + «Tümü».
   Geçmiş, istenince açılır.
6. **Sayılar küçük dönen widget'ta.** Durum sayıları (`LIFEOS.VITRIN.donen`) kesinlik
   işaretiyle; eksik veri sayı değil cümle.
7. **Grafik ≤ 1** ve yalnız ekranın işi grafikse (Analiz); en çok 180 px.
8. **Gezinme sakin.** Kenarda tek düğmeli sistem seçici, ikincil çekmeceler «Daha fazla»da,
   alt bölümler bölümlü seçicide; «Ayrıntı» sayfaları menüde yok.
9. **Hiçbir işlev silinmez, kalabalık gizlenir.** Gizli kart verisiyle ve koduyla durur
   (envanter kayıp 0). Kalıcı silme yalnız bir hafta hiç açılmayan ve kullanıcının onayladığı
   şey için (`belgeler/ekip/envanter/kaldirilan.json`).

Doktrin aynen: kural motoru otorite, eksik veri sıfır değil, sıfır bağımlılık, Türkçe metin,
SPİ sınır satırı (sayfa sonu) kalır. **Rütbe ekranları olduğu gibi kalır** (kullanıcı kararı).

**Sıkı ölçü** (kullanıcı, 2026-10-02, 2b'den sonra: «çok daha sade, çok daha minimalist devam
edelim»). 2c'den itibaren her ekranda:

- Açık yalnız işin kendisi (1–2 kart) ve en çok bir dönen kart.
- Şerit yalnız ara sıra açılan araç için; başvuru tablosu, tekrar ve ayrıntı kartı gizli ya da
  şerit — açık değil.
- **Hiçbir bölümde sabit açıklama notu yok.** Öğreti ⓘ'dedir (`data/hints.js`; yoksa önce
  oraya taşınır). Veriden gelen not kalır: zincirin sorusu, tezgâhın sıradaki kapısı, formülün
  kendi değerleri.
- Aynı cümle iki yerde yazılmaz (kart notu + bilgi kutusu, kutu adı + bileşen künyesi).
- Uzun liste ilk 5 + «Tümü»; arama/süzgeç açıkken liste kesilmez.
- Bölümlü ekranda HER bölüm ayrı ayrı bu ölçüye girer (araç yalnız varsayılan bölümü ölçer;
  öbürleri testte sayılır — `ESP/src/tests/iphone.test.js` «her bölümde açık en çok üç»).

## 3. Ekran türleri ve kalıpları

| Tür | Ekranlar | Açık kalan (iş) | Widget | Şerit (küçük) | Gizli |
|---|---|---|---|---|---|
| Bugün | 3 × Bugün | kahraman / ölçüm / sıradaki iş + akış | 2 dönen | — | büyük durum kartları (Günü düzenle'de) |
| Plan | Hafta · Program · Hedefler · SPİ Hedefler · ESP Merdiven | bu hafta / sıradaki haftalar / hedef katmanı / bu kademe | 1 dönen | sözleşme, özet, matris, tercih | geçmiş, ısı haritası, referans tabloları |
| Liste | Deneme · Testler · Notlar · Kitaplar · Kütüphanem | listenin kendisi | 1 dönen | süzgeç | yan istatistik, başvuru |
| Giriş | Soru çöz · Öğün · Mutfak · Oturum · Tekrar · Sınama | form / oturum | — | son kayıtlar (5) | açıklama, katalog |
| Analiz | İlerleme · Analiz · SPİ Analiz · ESP Analiz · Telafi | kural seçtiği ≤ 3 grafik | 1 dönen | öbür grafikler | meta (doluluk, denetim, sürtünme) |
| Ofis | Masalar · Danışma · Toplantı (3 ×) | günün brifingi + tek eylem | — | masalar, gündem | açıklama, geçmiş |
| Ayarlar | Genel · Profil (3 ×) | — (iOS Ayarlar listesi) | — | **her bölüm bir satır** | kılavuz, doktrin |
| Rütbe | 3 × Rütbe | aynen | — | — | — |

## 4. Araçlar

Var olan (bu oturumda kuruldu): dönen widget (`vitrin.js donen`), `SADE_GIZLI` (her
`app.js`), `kucukVarsayilan` (ekran nesnesi), ⓘ bilgi kartı (`kabuk.sayfaBasi`), «N bölüm
gizli · Göster», `App.UST` (menüde olmayan alt ekran).

Eklenecek: §5 ölçüleri; uzun liste kısaltıcı kalıbı (ilk N + «Tümü», ekran başına).

## 5. Ölçüm

`tools/envanter.js` her ekranda **açık kart** sayısını (görünen, küçük ve gizli olmayan bölüm)
ölçer; `tools/sadelik.js` iki yeni kural taşır:

- `acikKart` en çok 3 (Rütbe hariç)
- `boyHepsi` en çok 1 200 px (Rütbe hariç)

Önce **ölçüm** (kırmızı yapmaz); bir çekmecenin bütün ekranları bütçeye girince o çekmece için
zorunlu olur, Faz 7'de hepsi zorunlu.

**Faz 7 durumu (2026-10-02):** `acikKart` artık ZORUNLU (üç modülde üçü aşan ekran 0; aşarsa
`sadelik.js` kırmızı). `boyHepsi` hâlâ ölçüm: 1 200 px'i aşan sayfalar §8'in son satırında; çoğu
bölümlü ekranın en uzun bölümü ya da raf kesme tabanıdır.

## 6. Fazlar

| Faz | Kapsam | Hedef |
|---|---|---|
| 0 | Plan + ölçü (`acikKart`, `boyHepsi`) | başlangıç sayıları araçla |
| 1 | **Plan çekmecesi**: AYS Hafta · Program · Hedefler, SPİ Hedefler, ESP Merdiven | açık ≤ 3, boy ≤ 1 200 |
| 2 | **Çalışma**: AYS Konu çalış · Ders notları · Soru çöz · Deneme · Tekrar · Sınama; SPİ Testler · Öğün · Mutfak · Hareket · Bütçe; ESP Dil · Felsefe · Tarih · Ses · Okuma · Yazı | açık ≤ 3 |
| 3 | **Analiz**: AYS İlerleme · Analiz · Telafi; SPİ Analiz; ESP Analiz | ≤ 3 grafik, gerisi şerit |
| 4 | **Onaylar · Ofis · Kütüphanem** (3 ×) | brifing + tek eylem |
| 5 | **Ayarlar** (Genel, Profil; 3 ×) | iOS Ayarlar listesi |
| 6 | **Kabuk ve Merkez**: sayfa sonu, «nasıl okunur» şeridi, HKM yüzü | aynı dil |
| 7 | Kurallar zorunlu, telefon (390 px) turu, belgeler | bütçe kırmızıya bağlı |

Her faz sonunda: üç modülde `runtests` · `smoke` · `layoutcheck` · `a11ycheck` ·
`palettecheck`, depo kökünde `sadelik` · `envanter`, `build.py --denetle`, `ortak.py
--denetle`; sonra commit ve §8'e satır.

### Faz 1 kararları (ayrıntı)

- **AYS Hafta:** açık yalnız hafta (gezinme + yedi gün şeridi). Sözleşme imzalıysa şerit, imza
  bekliyorsa açık; «Haftanın özeti» şerit. Plan tamamlama geçmişi, sınava kadar, plan
  ızgarası, planın şekli, müfredat referansı gizli.
- **AYS Program:** dört istatistik → dönen widget (ilerleme, sınava kalan, planlanan soru).
  Isı haritası ve «Program» notu gizli. Zaman çizgisi **bu hafta + sonraki üç hafta**;
  «Tüm program · 40 hafta» ile açılır.
- **AYS Hedefler:** dönen widget (ana hedef, tahmini sıra, hedefe kalan). Açık yalnız hedef
  katmanları. Net matrisi, 24 tercih, OBP şerit. Tahmini sıra kartı, sıra referansları,
  yerleşen profilleri gizli. Kesinlik açıklama satırı ve medyan tekrarı kalkar.
- **ESP Merdiven:** açık yalnız bulunduğun kademe; öbür kademeler ve açıklamalar şerit/gizli.

Faz 1'de yapılan (testler: `AYS/src/tests/iphone.test.js`, `ESP/src/tests/iphone.test.js`):

- AYS Hafta: açık yalnız hafta şeridi + imza bekleyen sözleşme (imzalanınca o da şerit;
  `kucukVarsayilan` artık hesaplanır). Ders dengesi ve revizyon kaydı da gizli. Sözleşme
  kartındaki iki açıklama cümlesi ⓘ'de zaten vardı, ekrandan kalktı.
- AYS Program: dönen «Program» kartı; «Sıradaki haftalar» (bu hafta + 3) ve «Tüm program ·
  40 hafta» düğmesi (`program-tumu`). Varsayılan sınav tarihi TAHMİN etiketiyle. Sayfa başı
  «Bu haftayı aç» kalktı (bölümlü seçicide Hafta var).
- AYS Hedef: dönen «Hedef» kartı (ana hedef, tahmini sıra, hedefe kalan; az denemede cümle).
  Kesinlik satırı, medyan tekrarı ve katman tablosunun açıklama paragrafı kalktı.
- ESP Merdiven: dört açıklama paragrafı ekrandan kalktı (aynı öğreti `data/hints.js`'te,
  ⓘ'de); ölçülemeyen kapılar ve kör noktalar şerit; Yol'da yalnız şimdiki kademe açık.
- Ortak (`brand/ortak/kart.css`): katmanlı bölümde seçili sekmenin adını ikinci kez yazan
  başlık gözden kalktı (ekran okuyucuya kalır) — üç modülde.
- SPİ Hedefler zaten tek kart (ölçü bütçede); dokunulmadı.

Faz 1'de görülen, sonraki fazlara kalan:

- Hafta 1 253 px (imza bekleyen sözleşme açıkken). Sayfa sonundaki «Bu ekran nasıl okunur»
  şeridi (~56 px) ⓘ'ye taşınınca bütçeye girer — Faz 6'nın ilk işi, öne alındı (6a): şimdi
  1 197 px.
- ESP'de sayfa başlığı ekranın cümlesi («Merdiven henüz başlamadı.»); iPhone'da başlık addır,
  cümle ⓘ ya da widget'tadır — Faz 6.
- Dolu profilde ilk açılışta üç rozet bildirimi üst üste çıkıyor — Faz 6.

### Faz 2 kararları (ayrıntı)

Yapılan (2a, AYS; testler `AYS/src/tests/iphone.test.js` «Faz 2»):

- **AYS Dersler:** üç kapanış istatistiği → dönen «Kapanış» kartı. Açık: ders listesi ve
  konular (yan yana — raf kutuları DOM sırasıyla ikişer dizer, `subjectPanel` parçalara
  ayrıldı). Öncelik sırası ve seçili dersin künyesi şerit (anahtar `kucukVarsayilan`
  getter'ında hesaplanır); Sınav profilleri gizli; «emir değil öneri» notu ⓘ'de (hints: risk).
- **AYS Soru çöz:** «Çözüm kaydı» kartı → dönen «Çözüm» kartı (kayıt yokken oran cümle).
  Kaynaklarım, konu başına çözüm, çözülen sorular şerit.
- **AYS Tekrar:** Due/Borç istatistikleri kalktı (sekme rozeti + uyarı + ⓘ zaten söylüyor);
  gelecek yük, tekrar takvimi, defter alanları gizli; «Dokun veya boşluk tuşuna bas» kalktı.

Yapılan (2b, SPİ; testler `SPI/src/tests/iphone.test.js` «Faz 2b», `money.test.js`):

- **SPİ Testler:** Referans bandı gizli (satırlardaki bantların tekrarı); Sonraki kontrol
  şerit. Sonuçlar tam en (`wide`): satır 700 px'ten geniş kutuda tek satırlık cetveldir, yarım
  kutuda üç satıra kırılıp «Tamamını göster»e düşüyordu — şimdi yedi ölçüm kesilmeden görünür.
  «Önem sırasına göre…» ⓘ'de (hints: `lab-results`); kart içindeki ikinci «Test gir» kalktı.
  Sayfa içi «Sınır» kutusu kalktı; sayfa sonu satırı her ekranda durur ve test edilir
  (`SP.App.footerHtml` dışa açıldı, AGENTS §1.5).
- **SPİ Öğün:** dönen «Öğün» kartı (Kalori, Protein; tahlil bağı varsa üçüncü madde). Yenen
  toplam ev ölçüsünden geldiyse TAHMİN, hepsi tartıldıysa HESAPLANDI; köken kartı dolu.
  Öğün yokken, gramı olmayan kalemde ve profil eksikken sayı değil cümle; eksik kalem yazılır
  («3 kalemin gramı yok; toplama girmedi»). Günlük hedef şerit; Tabak ve Öğün çizelgesi gizli.
  Ev ölçüsü listesi ⓘ'de (hints: `portion`). Yerleşim: sol sütun yazma alanı + günün öğünleri,
  sağ sütun dönen kart + sık öğünler (1 228 → 1 133 px). «Sık öğünler» kutusu adını içinde
  ikinci kez yazıyordu; künyesi artık «son 30 gün».
- **SPİ Mutfak:** açık pişen yemek, paylaştırma, yemeğin kartı (yan yana); Hane, Evde ne var?,
  Kendi gıdaların şerit; üç açıklama ⓘ'de (hints: `household`, yeni `evdeki`, `custom-food`).
  Yemeğin kartı 100 gramın değerini «132 / 132 kcal · %100» diye kendi hedefiymiş gibi
  çiziyordu (aynı sayı iki kez); artık bir kez yazılır, bilinmeyen değer «veri yok» (demiri
  bilinmeyen yemek «0 / 1 mg» çizilirdi).
- **SPİ Hareket:** dönen «Hareket» kartı (günün yük emri: toparlanma skoru + bant + yük; bu
  hafta: asgari dakikayı geçen gün n/7, kayıtsız gün sayısı). Kırmızı/sarı gerekçe (ateş, aşırı
  yük, indirme haftası) emrin altında söylenir. Günün yük emri şerit; Bu hafta hareket ve
  Antrenman haftası gizli. İki açıklama ⓘ'de (hints: `recovery-order`, yeni `session-pick`).
- **SPİ Bütçe:** Bütçenin yeri ve Fiyatlar nereden geliyor? gizli; sınır girilince çıkan
  Harcama şeritleri şerit. **Hata düzeltildi:** hiçbir kalemin karşılığı bilinmezken talep
  rozeti «0 TL / ay», sınır kartı «0 / 3.000 TL · Talep aylık sınırın içinde» yazıyordu
  (AGENTS §1.2) — artık «veri yok» ve «sınıra göre durum hesaplanmadı».

Faz 2b'de görülen, sonraya kalan:

- `tools/envanter.js` dolu SPİ profilinin öğün kalemleri `grams` alanıyla yazılıyor; uygulama
  gramı `g`'de tutar («Öğün — gram kaybı» testleri). Bu yüzden dolu profilde öğün kartı
  «0 kcal · veri yok» gösteriyor. Ölçü aracının verisidir, uygulama hatası değil; düzeltilince
  Öğün'ün boyu değişir (ölçü tabanıyla birlikte ele alınmalı).
- Çekirdekte gramı olmayan kalem 0 sayılır (`Nutri.contribution`: `Number(grams) || 0`);
  arayüz gramsız kalem yazmadığı için uykuda. Dönen kart bunu artık dürüstçe söylüyor; öğün
  kartı hâlâ «0 kcal» yazar.
- `meals.js` `adviceView` hiçbir yerden çağrılmıyor (eski düzen); içinde sayfa içi sınır kutusu var.

Yapılan (2c, sıkı ölçüyle; testler `ESP/src/tests/iphone.test.js` «Faz 2c»,
`brand/ortak/vitrinkart.test.js`):

- **ESP Tarih:** dönen «Kapsam» kartı (dönem, alan, bölge n/N, yüzyıl boşluğu; boş eksen
  adıyla). Açık yalnız zaman şeridi; Dönemler şerit; Yüzyıl boşlukları ve Dağılım gizli. Her
  bölümdeki 15 sabit not kalktı (öğreti ipuçlarında; yeni `belge`, `tarih-pratik`; `chrono`,
  `srs` genişledi). «Tohumu yükle» her bölümün üstündeki ayrı satırdan «Olay ekle»nin yanına
  taştı. Belge iste, iki başvuru tablosu şerit. 1 463 → 900 px.
- **ESP Ses:** altı «TEKNİK» kartı (3 636 px) tek «Parçalar» listesine döndü: satırda ad · tür ·
  eşik/hedef BPM, dokununca eşik çubuğu, sıradaki basamak, son tekrarlar, Sil (`details`);
  ilk 5 + «Tümü», seçili parça her zaman görünür ve açık. İki tezgâh Müzik ve Diksiyon'un
  başından kendi «Tezgâh» bölümüne taştı (öbür ESP ekranları gibi). Metronom künyesi vuruş
  aralığını taşır («80 BPM · 750 ms»). 18 sabit not kalktı (yeni ipuçları: `metronome`,
  `paket`, `kayit-olcumu`, `diksiyon-egilimi`, `hedef-tempo`, `nefes`, `isinma`). Paket iste
  gizli; Parça ekle, Telaffuz kuralları, Son kayıtlar, Kulak'ın üç tablosu şerit. → 1 084 px.
- **ESP Okuma:** not satırı tek satır (metin solda, etiket ve eylem sağda); en yeni 5 not +
  «Tümü» (arama/kavram süzgecinde kesilmez); Bağlı notlar gizli; Raf, Okuma listesi iste ve
  Yöntem'in beş başvuru kartı şerit; 11 sabit not ve iki açıklama paragrafı kalktı (yeni
  `kavram-matrisi`, `anlat`). Sentez katsayısı eksikken gerekçeyi iki kez yazıyordu (not +
  kutu). → 1 182 px.
- **AYS Soru çöz:** fotoğraf kutusu boşken tek satır (132 → 64 px); kart alt yazısı (bırakma
  kutusunun ve metin alanının söylediğinin üçüncü tekrarı), «Notun»un uzun ipucu ve hızlı
  kaydın «Açılır pencere yok · Enter kaydeder / küçük · geri alınır» notları ⓘ'de (yeni
  `solve`, `quick-log`). Ortak `tekSatirSoru` artık `not:false` alır. 1 293 → 1 176 px.
- **AYS Dersler:** ders listesi sıklaştı (satır 58 → 52 px) ama sayfa 1 238 px kaldı: satırın
  boyunu Konular'ın raf kesme tabanı belirliyor (en az 560 + 56 px «Tamamını göster»,
  `hareket.js kesimler`). Ortak raf kuralıdır; Faz 7'de bütçeyle birlikte ele alınır.

Yapılan (2d, bölüm turu; testler `ESP/…/iphone.test.js` «Faz 2d», `SPI/…/iphone.test.js`
«Faz 2d», `AYS/…/iphone.test.js` «Faz 2d»):

- **ESP Dil:** Dilbilgisi'nin altı «A1…C2» kartı tek «Düzeyler» kartı: her düzey açılır satır
  (`details.acsatir`), beyanı eksik ilk düzey açık. Eski başlıklar rakam atılınca aynı anahtara
  düşüyordu («A1»/«A2» → `a`): ikinci kart hiç gizlenemiyordu. Öğren'de Pratik ve Üniteler açık;
  konuşma, cümle kurma, dinleme, Konular, Ünite iste şerit. İlerleme'de Kutu dağılımı ve
  Shadowing, Ekle'de Tohum deste şerit. 15 sabit not ve üç açıklama paragrafı ipuçlarına (yeni:
  `deste`, `kelime-agi`, `liste-yapistir`, `tohum-deste`, `bant`, `konusma-pratigi`,
  `cumle-kur`, `dinle-oku`, `unite-iste`). Çalış'ta not yalnız gecikmeyi söyler.
- **ESP Felsefe:** Belge iste, Sokratik sorular, iki egzersiz kataloğu şerit; 8 not (yeni
  `sokratik`, `kanon`). **ESP Yazı:** Ölçüm'de üç sayı açık, Pratik süresi şerit, Sınır kartı
  gizli (pedagojik sınır sayfa sonunda ve ⓘ'de); Araçlar'ın dördü şerit; 8 not.
- **SPİ:** bölümlerdeki 20 sabit not kalktı (yeni `lab-entry`, `paneller`, `karsilastir`,
  `ilac`, `hekim`; `load`, `progression`, `recovery-order` genişledi). Aynı başlıklı kopyalar
  yönetilemiyordu: Hareket'in üç «İlerleme kuralı» kartı «İlerleme kuralı · Kardiyo» vb. oldu
  (gizli), Bütçe › İkame'deki «Bütçenin yeri» kopyası «Kural sırası» (gizli). 2b'ye sıkı ölçü:
  Günlük hedef, Günün yük emri, Hane şeritten gizliye. **İstisna (doktrin):** Testler › «Birlikte
  okuma»daki «Hiçbiri teşhis değildir» sağlık çıkarımının yanındaki klinik sınırdır — kalır.
- **AYS:** Sınama kur ve Kaynaklarım'ın öğreti alt yazısı ⓘ'de (`quiz`, `solve`). AYS'de kart
  alt yazısı not satırı olarak çizilir; dört kelimeyi aşmayan künyeler kaldı.
- Gizli bir başvuru kartının GÖVDESİ içeriktir (İlerleme kuralı, Bütçenin yeri, Yazı › Sınır):
  kalır; kalkan, kartların üstündeki açıklama notudur.
- Testler: bölümlü ekranlarda her bölüm ≤ 3 açık; aynı anahtarlı ikinci kart yok (SPİ);
  kaldırılan cümleler ekranda yok, ipuçlarında var.

### Faz 3 kararları (yapıldı; testler üç `iphone.test.js`'te «Faz 3»)

- **AYS İlerleme:** sekiz KPI kutusu tek dönen «Gidişat» kartı (hedefin dışındakiler önce;
  ölçülmemiş KPI cümle; AYT medyanı varsa ek madde). Açık: Deneme net trendi (grafik 180 px,
  altındaki dört istatistik kalktı — dönen kartta ve karar kapısında var) ve Aylık karar kapısı
  (karar verilince şerit). Test bazlı trend, Plan tamamlama, Hata paretosu şerit; Aylık net
  gelişim eğrisi, KPI sözlüğü, Süreç göstergeleri gizli. Karar kapısı algoritması ⓘ'de (`gate`,
  tek kaynak `R.GATE_ALGORITHM`). 2 682 → 1 516 px.
- **AYS Telafi:** tetiklenmeyen ve sürmeyen protokoller şerit (getter), Minimum gün, Uyku,
  Geçmiş şerit; Motivasyon ve Sınav kaygısı gizli. Protokolün tetik satırı kart gövdesinde.
- **Analiz (üç modül):** 41 sabit not ⓘ'ye (`notlar.py` kalıbı: not ipucunda varsa silinir,
  yoksa `hints.js` sonundaki ek bloğa eklenir — yeni ipucu ya da `more`). Dürüstlük'ün üç meta
  kartı (Denetim defteri, Sürtünme, Gösterge ayrışması) şerit, Kalibrasyon girişi açık; ikincil
  analizler şerit; ESP Rapor › Sınır gizli; AYS Denetim'de beş alanın kartı şerit.
- **Hata düzeltildi (üç modül, `goodhart.js`):** önceki pencerede çaba sıfırken oran sonsuz
  çıkıyor ve ekranda «okuma dakikası %Infinity arttı» yazıyordu. Cümle artık `ayrismaNotu`'nda
  kurulur: «sıfırdan başladı»; sonuç değişmediyse «değişmedi».
- **Tuzak:** «KPI» Türkçe küçük harfte «kpı» olur — gizleme anahtarı `kpı-sözlüğü`.

### Faz 4–5 kararları (yapıldı; testler «Faz 4», «Faz 5», `gizle.test.js`)

- **Ofis (3 ×):** «brifing + tek eylem». Masa cümleleri toplantı satırında, Patron'da ve uzman
  kartında üç kez yazılıyordu: açık günün brifingi ve Patron (AYS'de ofis sahnesi en üstte kalır —
  depo sahibi kararı); Günün toplantısı, uzman masaları, konuşan masa, gündem, takipteki kararlar
  şerit. AYS'nin dört istatistik şeridi (bugün, sınava kalan, toplantı, açık karar) kalktı; uzman
  masaları başlıklı karta sarıldı (şerit olabilsin). 17 sabit not ⓘ'de.
- **Danışma (3 ×):** açık sohbet ve ajanın raporu/masası; tanıtım, örnek sorular, brifing,
  ekibin geri kalanı şerit.
- **Ayarlar (3 ×):** iOS Ayarlar listesi — `App.ayarListesi`: Ayarlar çekmecesindeki her ekranda
  ilk görünür bölüm (profil formu, görünüm) açık, gerisi baştan şerit. Rütbe hariç (kullanıcı
  kararı).
- **Hata düzeltildi (`gizle.js`):** şeride gelince önizleme 250 ms sonra açılıyordu; o arada sayfa
  değişirse ÖNCEKİ ekranın bölümü yeni sayfada açılıyordu (duman testi: ESP Profil'in düğmeleri
  Genel'de «ölü düğme»). `uygula` önizlemeyi ve bekleyen zamanlayıcıyı düşürür; DOM'dan düşmüş
  bölüm önizlenmez.
- SPİ `a11ycheck` alt sayfa kipliliğini «Karar ekle» ile sınar: kart artık şerit olduğu için önce
  şeridi açar (kullanıcının yaptığı gibi).

### Faz 6–7 kararları (yapıldı; testler «Faz 6», `sadelik.js`)

- **Başlık ad olur:** `sayfaBasiHtml` (üç `app.js`) — başlık ekranın adıdır («Testler»,
  «Merdiven», «Ofis»); kural motorunun durum cümlesi ⓘ kartının ilk satırı. Bugün'ün günün
  cümlesi (004) başlıkta kalır.
- **Rozet bildirimi tek:** sessiz kipte zincirle gelen rozetler `rozetBildir`'de toplanır,
  zincir bitince bir kez söylenir («3 yeni rozet — İstikrar 1 ay · +2»); açılışta üç balon üst
  üste biniyordu.
- **SPİ Bugün:** «Günün hissi» şerit (dört giriş kartı açıktı).
- **HKM yüzü:** jetonlar zaten ortak (`t_jetonlar_ortak`); bu turda ek değişiklik yok.
- **Kural:** `acikKart` zorunlu (Faz 7). 390 px turu: `layoutcheck` üç modülde temiz; Bugün,
  SPİ Testler, ESP Ses elle bakıldı.

## 7. Bilinen riskler

- Testler kartları ekranda arar: gizlemek uygulama düzeyindedir (`Gizle.uygula`), çizimi
  değiştirmez; kart taşıyan testler etkilenmez. Çizimden çıkan tekrarlar için test güncellenir.
- Raf düzeni gizlemeden sonra yeniden ölçülür (2026-10-02 düzeltmesi); yeni şerit kesikte kalmaz.

## 8. Durum (canlı)

| Faz | Durum | Commit | Açık kart (toplam) |
|---|---|---|---|
| — | başlangıç (araç) | c689817 | 188 · aşan 22 ekran |
| 0 | ✅ ölçü: `acikKart`, `boyHepsi` (ölçüm), envanter.test 13 durum | 2f7df20 | 188 · aşan 22 |
| 1 | ✅ AYS Hafta · Program · Hedef, ESP Merdiven (SPİ Hedefler zaten bütçede) | 147c177 | 180 · aşan 21 |
| 6a | ✅ öne alındı: «Bu ekran nasıl okunur» şeridi her ekranda ⓘ kartına taşınır (`kabuk.railBilgiye`, `Gizle.uygula`'dan); terim kaybolmaz | 75a889a | 180 · aşan 21 (boy: Hafta 1 197) |
| 2a | ✅ AYS Dersler · Soru çöz · Tekrar | 1d22ef6 | 172 · aşan 19 (AYS 59/5 · SPİ 55/8 · ESP 58/6) |
| 2b | ✅ SPİ Testler · Öğün · Mutfak · Hareket · Bütçe (beşi de açık ≤ 3, boy ≤ 1 200); Bütçe «0 TL» hatası | f73a9a7 | 161 · aşan 15 (AYS 59/5 · SPİ 44/4 · ESP 58/6) |
| 2c | ✅ sıkı ölçü: ESP Tarih · Ses · Okuma (her bölüm), AYS Soru çöz; Dersler 1 238 (raf tabanı) | a36e5e6 | 150 · aşan 13 (AYS 59/5 · SPİ 44/4 · ESP 47/4) |
| 2d | ✅ bölüm turu: ESP Dil · Felsefe · Yazı, SPİ bölümleri, AYS Sınama; 2b'ye sıkı ölçü; Faz 2 bitti | 207c451 | 150 · aşan 13 (araç varsayılan bölümü sayar; öbür bölümler testte) |
| 3 | ✅ Analiz: AYS İlerleme · Ayrıntılı analiz · Telafi, SPİ Analiz, ESP Analiz; `%Infinity` hatası | 55b2015 | 131 · aşan 9 (AYS 43/2 · SPİ 43/4 · ESP 45/3) |
| 4–5 | ✅ Ofis · Danışma (3 ×; Onaylar ve Kütüphanem zaten bütçede); Ayarlar iOS listesi (3 ×); önizleme hatası | 2db1f82 | 87 · aşan 1 (AYS 26/0 · SPİ 31/1 · ESP 30/0) |
| 6–7 | ✅ başlık ad, durum cümlesi ⓘ'de; rozet bildirimi tek; SPİ Bugün 3 açık; `acikKart` zorunlu; 390 px turu | 9b44df0 | 86 · aşan 0 (AYS 26 · SPİ 30 · ESP 30) |
| tam | ✅ `sayilar.py --tam --yaz` yeşil (ilk kez bu makinede): Windows UTF-8, dönen kart kırpması, ESP Tarih 631 → 157 ms, HKM eşleme durumu, tarihe bağlı iki HKM testi; README/NOTLAR sayıları | ce98d9b | — |
| tasarım | ✅ orta başlık; kaydırmalı bölüm seçici (yazı + nokta, sürükle/ok tuşu, seçili ortada); AYS Ofis 3B oda ve kat planı kalktı (kullanıcı kararı; kaldirilan.json) | ba051c9 | 86 · aşan 0 |
| kabuk 2 | ✅ başlık çekmecenin adı (Çalışma; bölüm çubukta); sayfa bölümleri bölümlü seçici; kayan işaret (kenar zemini, bölüm noktası, seçici hapı — FLIP; azaltılmış harekette solma); sol üst boş; grafit koyu tema; SPİ 3B kampüs kalktı | a7d051d | 86 · aşan 0 |
| sade içerik | ✅ SPİ/ESP/HKM AYS'nin diline: nötr uyarı, sınırlı grafik, çerçevesiz seçim kartı, serifsiz vitrin; SPİ/ESP Bugün sade; HKM yüzü (ortalı başlık + ⓘ, çerçevesiz kart, hap, bölümlü seçici, grafit) | 4df9260 | 85 (AYS 26 · SPİ 30 · ESP 29) |
| koyu son | ✅ Meydan ve giriş paneli grafit; telefonda sağ üst simgeler çerçevesiz | (bu commit) | — |
| ses · hareket | ✅ «Animasyonlar: Tam · Az · Sistem» (Görünüm; varsayılan Tam, webdriver'da Sistem — Windows'ta animasyon kapalıyken de kenar kayar); üst şeritte ♪ radyo (7 tür, çalınarak doğrulanmış istasyonlar) ve tık sesleri; tercihler modül geçişinde adresle taşınır (kapılar ayrı köken); SPİ/ESP a11y künyeyi Genel'de arar. Ayrıntı: DEVIR-RADYO.md «DURUM» | 7d59ca2 | — |
| zemin | ✅ «Zemin: Yumuşak · Sade» (Görünüm; varsayılan Yumuşak): modül rengine çalan yumuşak renk lekeleri + içerik sütununun arkasında buzlu levha (ekranı kaplamaz; telefonda yok). Kullanıcı canlı denemeyi görüp seçti (`brand/ortak/zemin.*`). Bilinen, önceden kalma: Ayarlar'da çekmece seçicisi ile sayfa rayı aynı yükseklikte yapışıp üst üste biniyor (ayrı dalda düzeltildi: 9f3e7356) | 71a00f68 | — |
| kenar · orta | ✅ Masaüstünde üst şerit yok; araçlar (ara, sayfa düzeni, radyo, bildirimler, profil) kenarın dibinde, rütbe çipi ve Merkez satırı kenardan kalktı (Ayarlar'da duruyor); kenardan açılan katman kenarı açık tutar, sağında açılır. Kenarın açılışı akıcı: kapalı ve açık hâlde her simge aynı yerde (sistem seçicinin kapalı listesi 8 px kaydırıyordu), ad ve ayraç kapalıyken yok, açılınca solarak/yükseklikte gelir (@starting-style, allow-discrete). «Daha fazla» kalktı: sekiz çekmece düz listede (2026-10-03). Levha her sayfada aynı en (1180) ve dikeyde hep ortada; zemin renkleri modülün renginden türetilir (oklch), ince gren, koyuda derinlik | (bu commit) | — |
| boy | ⏭ açık iş: 1 200 px'i aşan sayfalar — AYS Dersler 1 238 (raf tabanı), İlerleme 1 516, Ayrıntılı analiz 1 608, Ofis 1 838, Danışma 1 314, Genel 1 557, Günü düzenle 1 748; SPİ Analiz 1 506, Ofis 1 390, Günü düzenle 1 682; ESP Bugün 1 377, Analiz 1 803, Profil 1 286, Günü düzenle 1 525 | — | ölçüm |

## 9. Devir notu — sıradaki oturum buradan başlar

**Son devir (2026-10-02, 5. oturum, gece):** `DEVIR-RADYO.md`'deki üç iş bitti — internet
radyosu, tık sesleri, «Animasyonlar» ayarı (ayrıntı ve nottan ayrılan yerler o belgenin
başındaki DURUM kutusunda). Aşağıdaki «Windows animasyonu kapalı → LifeOS solarak geçer»
notu ESKİDİ: LifeOS artık kendi ayarına bakar (Görünüm › Animasyonlar, varsayılan Tam).
Denetim araçları webdriver'da Sistem kipinde ölçer, yani ölçümler değişmedi. Kalan tek
açık iş yine §8 «boy» satırı.

**Son devir (2026-10-02, 4. oturum, akşam):** kullanıcının beş isteği bitti — sol üst boş,
başlık çekmecenin adı, iki seçici iki dil (yazı + nokta / bölümlü seçici), kayan işaret ve
sayfa geçişi, SPİ/ESP/HKM sadeleşti, koyu tema grafit, SPİ 3B kampüs kalktı (a7d051d,
4df9260 ve sonraki commit). Bilinen: bu makinede Windows «Animasyon efektleri» KAPALI;
tarayıcı «hareketi azalt» bildirir, LifeOS kaymaz ama solarak geçer. Tam hareket için
Windows Ayarlar › Erişilebilirlik › Görsel efektler › Animasyon efektleri açılmalı.
HKM ekran görüntüsü için gerçek config'e dokunmadan: HKM'yi geçici klasöre kopyala,
kendi deneme jetonunla `config.json` yaz, kopyadan `daemon.py` aç (jeton hiçbir çıktıya
yazılmaz). Kalan tek açık iş yine §8 «boy» satırı.

**Son devir (2026-10-02, 3. oturum):** Faz 3, 4–5, 6–7 bitti (55b2015, 2db1f82, 9b44df0), tam denetim yeşil (ce98d9b);
açık kart 150 → 86, üçü aşan ekran 13 → 0, `acikKart` zorunlu. Kalan tek iş §8'deki «boy»
satırı (sayfa boyu ölçüm olarak kalıyor). Her şey commit'li; push'u kullanıcı yapar.

**Önceki devir (2026-10-02, 2. oturum):** Faz 2 bitti (2b f73a9a7, 2c a36e5e6, 2d 207c451); her şey
commit'li, üç modülde bütün denetimler temiz. Kullanıcı 2b'den sonra «çok daha sade, çok daha
minimalist» dedi → §2 «sıkı ölçü» bundan sonra her fazın ölçüsü. Push'u kullanıcı yapar.

**Faz 3 (Analiz) başlamadı — yalnız ölçüldü** (1440, dolu profil; bölüm bölüm):

- AYS İlerleme (`progress`, 2 682 px): 8 açık + 6 not — KPI ızgarası, Deneme net trendi,
  Test bazlı trend, Plan tamamlama, Aylık net gelişim eğrisi, KPI sözlüğü, Aylık karar kapısı,
  Hata paretosu, Süreç göstergeleri. Öneri: KPI ızgarası + Süreç göstergeleri → tek dönen kart;
  açık Deneme net trendi + Aylık karar kapısı (karar eylemi); Test bazlı trend, Plan tamamlama,
  Hata paretosu şerit; Aylık eğri ve KPI sözlüğü gizli; notlar ⓘ'ye.
- AYS Telafi (`protocols`, 1 382 px): 9 açık + 7 not — dokuz protokol kartı → tek liste,
  her protokol açılır satır (`details`, ESP `acsatir` kalıbı); tetiklenen protokol açık.
- AYS Analiz (`analytics`): Karşılaştırma 4 · Hata haritası 2 · Sıra geçmişi 2 · Hız 2 · Konu
  değeri 1 · Alışkanlık 4 · Denetim 3 · Dürüstlük 4 — hepsinde not.
- SPİ Analiz: Dürüstlük 4 + 4 not; öbürleri ≤ 2. ESP Analiz: Dürüstlük 7 + 8 not (disiplin
  başına gösterge ayrışması kartları), Rapor 4 (+ Sınır kartı), Radar 3, Seriler 3.
- «Dürüstlük» (üç modülde aynı: Denetim defteri, Sürtünme, Gösterge ayrışması, Kalibrasyon)
  §3'e göre «meta» → şerit (bölümün kendisi bunlar; tek satır kalsın) ya da tek dönen kart.

**Bu oturumda öğrenilen tuzaklar:**

- Gizleme anahtarı başlıktan üretilir, RAKAMLAR atılır: «A1»/«A2» aynı anahtar → ikinci kart
  yönetilemez. Aynı başlık birden çok bölümde (ör. «İlerleme kuralı») → yalnız ilki yönetilir.
  Çare: başlığa ayırt edici kelime ya da tek kart + açılır satır.
- Gizli başvuru kartının GÖVDESİ kalır; kalkan, üstündeki açıklama notudur. Testte metin
  arıyorsan gizli kartın gövdesi de DOM'dadır.
- Dönen kart defter (ledger) içinde bir hücredir: yarım kartla eşleşir, geniş kartın önünde
  tam satır olur. SPİ'de `lband` yok.
- Satır içi not (`note:'…', body:…` aynı satırda) betikle silinmez, elle.
- Python betiği heredoc'la değil dosyayla çalıştır (heredoc `\\`'yi `\`'ye indiriyor); konsol
  çıktısı için `PYTHONIOENCODING=utf-8`; dosyalar CRLF — okurken `\r\n`→`\n`, yazarken geri.
- AYS'de `K.Card` alt yazısı (`sub`) not satırı olarak çizilir.
- Raf, eşi kısa olan uzun kutuyu en az 560 + 56 px'te keser (Dersler 1 238 px bundan).

**Bir ekranı sadeleştirme kalıbı** (Faz 1–2'de oturdu):

1. Ekranın görüntüsünü al (aşağıdaki betik) ve kartları say: iş hangisi, gerisi ne?
2. Durum sayıları → `LIFEOS.VITRIN.donen({ id, ad, maddeler:[{ ust, sayi, cumle, vurgu,
   sistem, dugme }] })`; sayı `LIFEOS.SAYI.html({ deger, birim, kesinlik, formul })` ile
   (`measured / computed / estimated`; veri yoksa sayı değil cümle). Örnek:
   `AYS/src/js/screens/plan.js` `DonenProgram`, `target.js` `DonenHedef`, SPİ `meals.js`
   `DonenOgun`, `move.js` `DonenHareket`. Köken kartı (025) alanları: tahminde `kaynak`,
   hesapta `formul` + `girdiler` + `zaman` — verilmeyen alan «kayıtlı değil» yazar. Cümle ve
   vurgu TEK satırdır (sığmayan üç noktayla kesilir): her madde tek söz söyler. Dönen kart
   defterin içinde bir hücredir: yanındaki yarım kartla eşleşir (SPİ Öğün: yazma alanının
   yanında), geniş kartın önünde tam satır olur (SPİ Hareket).
3. Başvuru/açıklama/tekrar kartı → `app.js` `SADE_GIZLI[ekran]` (gizli); ara sıra açılan →
   ekranın `kucukVarsayilan`'ı (şerit). Duruma göre değişiyorsa getter: `week.js`,
   `ESP/.../ladder.js`, `subjects.js`. Anahtar `LIFEOS.Gizle.anahtar(başlık)`: Türkçe küçük
   harf, RAKAMLAR ve gün adları atılır, aynı anahtarlı ikinci bölüm yok sayılır.
4. Kart içindeki açıklama cümlesi → önce o ekranın `data/hints.js`'inde aynı öğreti var mı
   bak; varsa ekrandan sil, yoksa hint'e taşı (bilgi kaybolmaz, ⓘ'de durur).
5. Raf iki sütunu DOM sırasıyla ikişer dizer (`.card`/`.lrow` bir hücre, `kutu`/`donen` tam
   satır): yerleşimi sıra belirler (`subjects.js` render örneği).
6. Test: `AYS/…`, `SPI/…` ya da `ESP/src/tests/iphone.test.js` kalıbı (`bolumle(ekran[,
   bölüm])` → `acik / kucuk / gizli`; bölümlü ekranda yalnız varsayılan bölüm `#bl-<id>`
   sayılır). Önce test, sonra kod. Bir vitrin kutusu ancak verisi varsa çizilir (ör. «Sık
   öğünler» aynı öğün iki günde girilince): testte veriyi kur.

**Denetim sırası** (her faz sonunda; Windows'ta `export PATH="/c/Program Files/nodejs:$PATH"`
ve `PYTHONIOENCODING=utf-8`): değişen modülde `python build.py` → `node tools/runtests.js`;
üç modülde `node tools/smoke.js <4179|4189|4199>`, `layoutcheck`, `a11ycheck`,
`palettecheck`; `brand/ortak` değiştiyse `python tools/ortak.py --yay` ve üç `build.py`;
kökte `node tools/envanter.js` (kayıp 0), `node tools/sadelik.js` (§8'e sayı),
`build.py --denetle`, `ortak.py --denetle`. `runtests` yalnız özet basar; tek bir testin
sonucunu görmek için `/tests/` sayfası açılıp `window.__ROTA_TESTS__` / `__SPI_TESTS__` /
`__ESP_TESTS__` süzülür.

**Ekran görüntüsü** (sistem `python sistem/baslat.py --tarayicisiz` ile açıkken; AYS 4173,
SPİ 4183, ESP 4193; dolu örnek profil envanterden):

```js
// node ekran.js AYS week  -> AYS_week.png
const ENV = require('<depo>/tools/envanter.js');
const { chromium } = require('<depo>/AYS/node_modules/playwright');
const PORT = { AYS:4173, SPI:4183, ESP:4193 };
(async () => {
  const [ad, rota] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ reducedMotion:'reduce', viewport:{ width:1440, height:900 } });
  await p.goto('http://127.0.0.1:' + PORT[ad] + '/index.html');
  await p.waitForSelector('.site');
  const gec = await p.$('[data-act="setup-skip"]'); if(gec) await gec.click();
  await p.evaluate(ENV.DOLDUR_KAYNAK[ad]);
  await p.evaluate(a => window[a.ns].App.go(a.rota), { ns:ENV.MODUL[ad].ns, rota });
  await p.waitForTimeout(1200); await p.mouse.move(1430, 890);
  await p.screenshot({ path:ad + '_' + rota + '.png', fullPage:true });
  await b.close();
})();
```

**Bölüm ölçümü** (araç yalnız varsayılan bölümü görür). Yukarıdaki betikte `go`dan sonra
her `section.sayfabolum` için sayılır: en dıştaki başlıklı `section.lrow, section.kutu, .card`
(gizli: `[data-gizle-gizli]`; şerit: `.gizle-kucuk`; geri kalanı açık) ve `.lrow__note`
(tezgâh notu hariç = sabit not). Açılışta `localStorage`'daki `lifeos.gizli.*` silinir, yoksa
eski elle seçimler ölçüye karışır. Bash aracında heredoc içindeki `\\` tek `\`'ye iner:
ters bölü taşıyan Python betiği önce dosyaya yazılıp öyle çalıştırılır.

**Değişmeyenler:** Rütbe ekranlarına dokunulmaz. Hiçbir işlev silinmez (envanter kayıp 0).
Kullanıcının kendi dosyaları commit'e girmez: `.gitignore` değişikliği, `veri/`,
`tools/veri_*.py`, `HKM/db/`. HKM `local_token` hiçbir çıktıya yazılmaz. Commit kimliği
kalıcı ayarlanmaz (`git -c user.name=… -c user.email=…`); bu makinede push kimlik bilgisi
yok — `git push origin main`'i depo sahibi koşar.

