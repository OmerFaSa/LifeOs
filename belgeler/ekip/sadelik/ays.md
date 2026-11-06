# AYS sadelik dökümü

Depo sahibi (2026-11-06): «bir bölümde birden fazla özellik olduğundan anlaşılmıyor ve karmaşık
gözüküyor». Kural: **bir bölüm, bir iş.** Fazlası kendi katına gider; hiçbir işlev silinmez.

Ölçüm: örnek veriyle, 390 piksel telefon, her ekran gerçekten açıldı. Söz = görünen sözcük,
düğme = görünen düğme, alan = yazı ya da seçim alanı. «Dolu» = ekrandaki birincil düğme.
Boş profilde de bakıldı (aşağıda). Sayılar tahmin değil ölçümdür; «özellik» elle sayıldı.
Deneme ve Gelecek'te düğme sayısı bölüm seçicisi yüzünden artar; üst düğmeler bu sayıya hiç girmez.

## İkinci tur: ilk bakışta anlaşılıyor mu?

Hedef: daha az görünen şey değil, ilk bakışta anlaşılan ekran. Her ekran telefon boyutunda, boş ve dolu
profille açıldı. Üç soru: **Ne** = beş saniyede burası ne için anlaşılıyor mu; **Şimdi** = ne yapacağım tek
ve belli mi; **Sonuç** = yaptığımın sonucu nerede görünüyor. Değerlendirme benim bakışımdır, kullanıcı
denemesi değildir. ✓ evet · ~ kısmen · ✕ hayır.

| Ekran | Ne | Şimdi | Sonuç | Ne değişti |
|---|---|---|---|---|
| Bugün | ✓ → ✓ | ✓ → ✓ | ~ → ~ | Yeterli: tek cümle ve «Başla». Boşken «Kuruluma başla». Sonuç aynı ekranda, «Gün» altta |
| Tekrar | ~ → ✓ | ~ → ✓ | ✓ → ✓ | Çalışma artık bununla açılır; «Cevabı göster» tek dolu düğme |
| Soru çöz | ✕ → ✓ | ✕ → ✓ | ✕ → ✓ | Model yokken önce işe yarayan «Kaydet» açılır (kod seçer); son kayıtlar yazdığın satırın altında |
| Deneme | ~ → ✓ | ~ → ✓ | ✓ → ✓ | Analiz bekleyen deneme listenin başında «Sırada»; boşken tek düğme |
| Konu takibi (eski «Konu kapanışı») | ✕ → ✓ | ✕ → ✓ | ✓ → ✓ | Başta sıradaki konu, risk sırasından; bekleyen ölçüm varsa onun kartı konuşur |
| Kendini sına (eski «Sınama») | ✕ → ✓ | ~ → ✓ | ✓ → ✓ | Boşken ayar formu yerine ilk adım; ad işi söylüyor |
| Plan › Hafta | ~ → ✓ | ✕ → ✓ | ✓ → ✓ | Günler'in başında imza ya da değerlendirme; imza katta gömülü kalmıyor |
| Plan › Program | ✓ → ✓ | ~ → ~ | ✓ → ✓ | Salt bakış. Telefondaki dar sütun düzeldi |
| Plan › Hedefler | ~ → ✓ | ~ → ~ | ✓ → ✓ | Tablo telefonda okunuyor |
| Analiz › İlerleme | ✕ → ✓ | ✕ → ✓ | ~ → ✓ | Başta tek cümle: ilk deneme, aylık karar ya da düşen net; ikinci «Günün blokları» kalktı |
| Analiz › Tahmin (eski «Gelecek») | ~ → ✓ | ✕ → ✓ | ✓ → ✓ | Boşken «Deneme ekle»; önce cevap, sonra «Neden sınav günü değil?» |
| Analiz › Ayrıntı | ~ → ~ | ~ → ~ | ✓ → ✓ | Kayıt yokken «114 soru geride» yazmıyor; ad açık soru |
| Analiz › Telafi | ✓ → ✓ | ✓ → ✓ | ✓ → ✓ | Yeterli: ilk satır durumu söylüyor |
| Öğren › Konular | ✓ → ✓ | ✓ → ✓ | ✓ → ✓ | Yeterli: başta sıradaki konu ve «Başla», ders kartlarında okunan sayısı |
| Öğren › Adım adım (eski «Öğrenme») | ~ → ✓ | ✓ → ✓ | ✓ → ✓ | Yalnız ad; Konular'la birleşme açık soru |
| Öğren › Anlatım, Sorular, Koç | ✓ → ✓ | ✓ → ✓ | ✓ → ✓ | Yeterli: içeriğin kendisi; model yokken Koç bunu söylüyor |
| Öğren › Ders notları | ~ → ✓ | ~ → ✓ | ✓ → ✓ | Boşken tek düğme |
| Onaylar | ✓ → ✓ | ✓ → ✓ | ✓ → ✓ | Yeterli: boşken ne olduğunu söylüyor |
| Ofis › Ekip özeti (eski «Masalar») | ✕ → ✓ | ~ → ✓ | ✓ → ✓ | Ad işi söylüyor; uzmanların kırmızı uyarısı seçicide sayı |
| Ofis › Uzmana sor (eski «Danışma») | ~ → ✓ | ~ → ✓ | ✓ → ✓ | Ad işi söylüyor; yüzlerin yanında isim |
| Ofis › Toplantı | ✓ → ✓ | ✓ → ✓ | ✓ → ✓ | Yeterli |
| Kütüphane | ✓ → ✓ | ✓ → ✓ | ✓ → ✓ | Yeterli: boşken ne duracağını söylüyor |
| Ayarlar › Genel | ~ → ✓ | ~ → ✓ | ✓ → ✓ | Düz liste; ölçü satırı («Pusula») listenin altına indi |
| Ayarlar › Profil, Kılavuz | ✓ → ✓ | ✓ → ✓ | ✓ → ✓ | Yeterli |
| Ayarlar › Rütbe | — | — | — | Kapsam dışı (depo sahibinin kararı) |

### Kökten yapılanlar

- **Duruma göre konuşan satır («Sırada»).** İlerleme, Hafta, Deneme, Konu takibi: tek cümle, tek düğme. Kod seçer, sayı `Calc`'tan gelir:
  - İlerleme: ilk deneme yoksa onu ister; varsa aylık karar; o da yoksa düşen net («hesaplandı» etiketli). Hiçbiri yoksa satır yok.
  - Hafta: imza yoksa imza; hafta sonuysa değerlendirme; yoksa satır yok.
  - Deneme: analizi bekleyen en eski deneme. Bugünkü deneme bir gün dolmadan borç sayılmaz (var olan kural).
  - Konu takibi: risk sırasının başı; bekleyen ikinci ölçüm varsa onun kartı konuşur.
- **Saklama kusuru düzeltildi.** Birinci turda kata gömülen aylık karar, imza, analiz borcu ve uzman uyarısı yeniden ilk bakışta.
- **Yinelenen birleşti.** «Günün blokları» yalnız Bugün'de. Soru çöz'de sonuç kaydın altında. Kart, deneme ve ders eklerken boş ekranda çift düğme yok.
- **Sıra kullanım sıklığına göre.** Çalışma: Tekrar · Soru çöz · Deneme · Konu takibi · Kendini sına. Kullanım sıklığı ölçülmedi, planın ritminden çıkarıldı: tekrar her gün, deneme haftada bir.
- **Adlar işi söylüyor.** Tablodaki eski adlar. İç bölümler: Kaydet · Sor · Kaynaklar; Özet · Netler · Konular · Aylık karar; Sınav günü · Deney.
- **Boş ekran ilk adımı söyler.** Kendini sına, Tahmin, İlerleme, Tekrar, Ders notları, Deneme.

### Hâlâ anlaşılmayan yerler

- **Öğren alt bantta yok.** Her gün gereken iş Menü'nün içinde. Bant ortak kabukta; KOLAY-PLANI'ndaki «Çalış = Çalışma + Öğren» kararı depo sahibinde.
- **Çalışma'da beş sekme telefona sığmıyor.** «Kendini sına» kaydırınca görünüyor (ortak).
- **Hızlı kayıt sıkışık.** Üç seçim alt alta, kaydet düğmesi küçük `↵` (ortak `vitrin.js tekSatirSoru`).
- **«N bölüm gizli» satırı** yeni kullanıcıya «bir şey saklanmış» dedirtiyor (ortak).
- **İlerleme › Özet uzun** (1999 px). Satır yönü verdi, ama kartların çoğu yine sıralı okunuyor; Tekrar yinelemesi açık soru 3.
- **«Ayrıntı» adı** ne olduğunu söylemiyor (açık soru 2).
- **Konular ve Adım adım** iki ayrı başlama yolu (açık soru 1).
- **Plan › Program ve Hedefler'de eylem yok.** Salt bakış olduğu için «şimdi ne yapacağım» kısmen kalıyor; ekleyecek gerçek bir iş bulamadım.

## Birinci tur: önce / sonra (en karmaşıktan en sadeye)

Sonra sütunları birinci turun sonundaki **açılan ilk katı** gösterir. İkinci tur «Sırada» satırı ekledi; o
ekranlarda sayı biraz arttı (İlerleme 107 söz, Hafta 119, Konu takibi 177, Soru çöz'de ilk kat artık Kaydet: 131).

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
| İlerleme | **Özet** · Netler (trend, test, aylık eğri, hata dağılımı) · Konular (harita, plan geçmişi, göstergeler) · Aylık karar |
| Hafta | **Günler** (hafta takvimi, öneri) · Sözleşme (form, istisna, revizyon) · Özet (ders dağılımı, değerlendirme, denge, geçmiş, müfredat) |
| Konu takibi | **Konular** (bekleyen ölçüm, dersler, konu listesi, zincir, kaynak) · Genel (harita, oran, risk, profiller) |
| Deneme | **Denemeler** (liste) · Özet (net, rekor, ders ders, sıra, hedef, takvim, hacim, yayın) |
| Soru çöz | **Kaydet** (çözüm sayısı, hızlı kayıt, son kayıtlar; model bağlıysa **Sor** önce gelir) · Sor · Kaynaklar (kaynaklar, konu başına çözüm) |
| Uzmana sor | **Sohbet** · Rapor · Ekip (ses, öbür uzmanlar) |
| Ekip özeti | **Özet** (model notu, günün özeti, Patron, ürünler) · Uzmanlar · Kayıtlar (kararlar, kota, son toplantı) |
| Tahmin | **Sınav günü** · Deney |

Bütün ekranlara değen üç değişiklik:

- **Sekme çubuğu yerinde durur.** Ekranın düğmeleri («Kart ekle», «Deneme ekle») başlığın altından
  sekmelerin altına indi; telefonda sekmeler bölümden bölüme oynamıyor (`app.js`, duman testi ölçer).
- **Bölüm seçmek sayfayı oynatmaz.** Bölüm zaten ekrandaysa kayma yok (`components.js bolumeGit`).
- **Başka yerden doğru kata gelinir.** `data-bolum` (Bugün › «Haftalık sözleşmeyi aç» Sözleşme'yi açar; İlerleme › «Hatalara bak» Hata haritası'nı;
  arama ve komutlardaki konu ve ders satırları Konular'ı; King'e gelen fotoğraf Sor'u).

Kaldırılan yalnız yinelenen üç düğme: Uzmana sor ve Toplantı'daki «Ofis» ile Patron kartındaki
«Toplantı odası». Üçü de hemen üstteki sekmeyle aynı yere gidiyordu. Boş ekranda çift «ekle» düğmesinin üstteki kopyası da gizlenir. Bugün'den çıkan iki kısa yol
(Soru çöz, Deneme) Çalışma'da birer dokunuş, aramada ve klavyede duruyor.

## Boş profil

Yeni kullanıcıda da bakıldı (390 px): Deneme 29 söz ve tek birincil düğme («İlk denemeyi ekle»), Tekrar 26 söz,
Kendini sına tek ilk adım. İlerleme başta «İlk tam denemeni gir», Hafta başta imza diyor.

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
4. **Öğren alt banda çıksın mı?** Her gün gereken iş şu an Menü'nün içinde. Ortak kabuk değişir, Y3 = 4 hedefine dokunur.

Birinci turdaki ad değişikliklerinden geri isteyeceğin olursa: `PARCA.sayfa` satırında tek sözcük.

## Yapılmayanlar

- Sayı ve karar kodu değişmedi; tema değişmedi; Rütbe'ye dokunulmadı; `brand/ortak/` değişmedi.
- İlerleme › Özet'in kart düzeni: kartlar `today.js PanoUst` ve ortak pano biçiminde; bölmek Faz 2 kararını açar.
- Konu takibi'nde 40 düğme kaldı: her konu bir düğme, liste ilk beşe kısılmış değil.
- Anlatım ve Sorular'ın içine girilmedi.
- `AYS/dist` yeniden derlenmedi: paralel oturumlarla çakışır, birleştirmeden sonra derlenir.

## Denetim

Davranış testleri: `AYS/src/tests/tekis.test.js` (tek kat açık, en çok bir dolu düğme, taşınan
parçalar yerinde, rozetler, kayma, «Sırada» seçimi, sıra ve adlar, boş ekranın ilk adımı) ve `AYS/tools/smoke.js` `tekIs`.

| Denetim | Sonuç |
|---|---|
| `AYS` `runtests.js` | 3408/3408 |
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
