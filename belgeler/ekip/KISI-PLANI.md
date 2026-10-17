# Kişi Planı — King seni tanır, ajanlar işi kadarını bilir

> Depo sahibinin isteği (2026-10-17): «Analiz işi kullanıcıyı daha iyi
> tanısın: psikolojisi, fizyolojisi, maddiyatı, maneviyatı, ne inandığı,
> nasıl düşündüğü, kişiliği, hayat planı, sevdikleri, sevmedikleri,
> nefret ettikleri, hobileri… King her şeyi öğrenecek; diğer ajanlar
> yalnız gerektiği kadarını. King kullanıcı gibi konuşacak, ona benzeyecek.
> Deneme ve ders analizi, vücut analizi de daha donanımlı olsun.»

## 0. Bugün ne var (koddan, 2026-10-17)

| Var olan | Nerede | Ne yapıyor |
|---|---|---|
| Hafıza (4 katman) | `brand/ortak/hafiza.js`, `HKM/core/memory.py` | ölçülen · senin sözün · sohbetten · çıkarım; model kalıcı kayıt YAZAMAZ |
| Görme kuralı | `memory.py` SCOPES | her ajan kendi modülünü + «all»u görür; **King hepsini görür** |
| Hayat Mottosu | `HKM/core/motto.py` | kendi düşünce ve ilkelerin ağı, sürümleriyle |
| Dijital ikiz | `HKM/core/twin.py` | üç modülün son 14 günü tek resim, etiketli |
| Çapraz bulgu | `HKM/core/cross.py` | modüller arası eşleşme (neden-sonuç yok) |
| Gizlilik panosu | `HKM/core/gizlilik.py` | modele hangi veri türü ne zaman gitti |
| Vücut | SPİ: kilo, bel, yağ oranı alanları; fotoğraftan duruş | **BKİ, bel/boy, yağsız kütle, kilo eğilimi YOK** |

İstenen «King her şeyi görür, ajan işi kadarını» modeli hafıza düzeyinde
zaten kurulu. Eksik olan: yaşam alanlarına göre düzenli bir **kişi modeli**,
onu besleyen öğrenme yolları, King'in onu kullanması ve senin onu görmen.

## 1. Sözleşme — bu planın kuralları

1. **Sahibi sensin.** King'in senin hakkında bildiği her şey «Beni nasıl
   tanıyorsun» sayfasında görünür, düzeltilir, silinir. Gizli profil yok.
2. **Kaynak hep yazılı.** Her bilgi üç etiketten birini taşır:
   *senin sözün* (beyan) · *gözlem* (ölçülen veriden kural motoru) ·
   *tahmin* (çıkarım). Model kalıcı kayıt yazamaz (§1.1); King yalnız
   **önerir**, kural motoru yazar.
3. **Teşhis ve yargı yok (§1.5).** «Kaygılısın», «yeteneksizsin», «depresif»
   denmez. Kişilik, kendi cevapladığın kamu malı bir envanterden gelir
   (IPIP, ölçeğin kendisi «tahmin» etiketli); ruh hâli senin yazdığındır.
4. **King hepsini görür; ajan işi kadarını.** Alan × ajan izin tablosu:
   ör. SPİ ajanı fizyoloji ve ritmi, AYS ajanı öğrenme tarzı ve ritmi görür;
   inanç ve maddiyat varsayılan olarak yalnız King'dedir.
5. **Veri PC'de kalır (§1.4).** Modele (yapay zekâ sağlayıcısına) hangi
   alanın gideceği alan alan senin ayarındır; giden her şey gizlilik
   panosunda sayılır.
6. **Senin gibi konuşmak.** King üslubunu kendi mesajlarından öğrenir:
   sohbette ve taslakta senin gibi yazar. Senin adına **dışarıya** bir şey
   göndermek her zaman ayrı onaydır.
7. **Ölçmediğini söylemez (§1.7).** Az veride «henüz tanımıyorum» denir.

## 2. Alanlar — kişi modelinin bölümleri

| # | Alan | Örnek | Nereden öğrenilir |
|---|---|---|---|
| 1 | Kimlik ve hayat planı | hedef meslek, 5 yıllık plan | söz, tanışma |
| 2 | Değerler ve inanç | maneviyat, ilkeler | söz, Hayat Mottosu |
| 3 | Görüşler | bir konudaki düşüncen | söz |
| 4 | Kişilik | Beş Faktör (IPIP) | envanter (isteğe bağlı) |
| 5 | Ruh hâli ve stres | günlük his, stres kaynakları | söz, his kaydı |
| 6 | Fizyoloji | uyku, kronotip, vücut | SPİ ölçümü → gözlem |
| 7 | Öğrenme ve düşünme | çalışma tarzı, hata tipleri | AYS ölçümü → gözlem |
| 8 | Gelişim | disiplinler, istikrar | ESP ölçümü → gözlem |
| 9 | Maddiyat | bütçe tavrı, harcama düzeni | söz, SPİ bütçe |
| 10 | İlişkiler | önemli insanlar, sosyal ritim | söz |
| 11 | Sevdikleri / sevmedikleri | yemek, müzik, nefret ettiği | söz, sohbet |
| 12 | Hobiler ve ilgiler | | söz, ESP |
| 13 | Günlük ritim | en verimli saat, uyanış | ölçüm → gözlem |
| 14 | İletişim üslubu | kısa/uzun, resmi/samimi | kendi mesajların → gözlem |

## 3. Öğrenme yolları

1. **Sohbetten açık beyan.** «X'i seviyorum / sevmiyorum / nefret ediyorum,
   hobim X, X'e inanıyorum, hedefim X» gibi birinci tekil cümleler kural
   motoruyla alana yazılır; ekranda «Öğrendim: … · Geri al».
2. **Tanışma soruları.** King günde en çok bir kısa soru sorar (atlanabilir):
   «Seni en çok ne dinlendirir?» Cevap «senin sözün»dür.
3. **Ölçülen veriden gözlem.** Kronotip, en verimli saat, uyku–performans
   eşleşmesi (cross.py), harcama düzeni. Etiket: gözlem; yeterli veri yoksa yok.
4. **Kişilik envanteri.** IPIP Beş Faktör (kamu malı), isteğe bağlı, sonuç
   yargısız dille ve «tahmin» etiketiyle.
5. **Üslup.** Kendi mesajlarının uzunluğu, sıcaklığı, kullandığın sözler;
   King cevabını buna yaklaştırır.

## 4. Alan analizleri (ikinci iş kolu)

- **SPİ vücut:** BKİ (DSÖ bantları), bel/boy oranı (≥ 0,5 «dikkat» işareti,
  teşhis değil), boyun-bel(-kalça) girilirse ABD Donanması yağ oranı
  (tahmin), yağsız kütle ve FFMI, kilonun 7 günlük eğilimi (tartı gürültüsü
  ayıklanır), kalori ile kilo eğiliminden enerji dengesi tahmini.
- **AYS deneme ve ders:** test bazlı eğilim (Theil–Sen), konu × hata tipi
  zamanla, süre yönetimi (soru başına süre testlere özgü), yayın farkını
  zamandan arındırma, «hangi derste kaç net bırakıyorum» özeti.
- Formüller kaynağıyla yazılır; internetten çekilen her referans (tablo,
  katsayı) dosyada künyesiyle durur ve yıl yıl tazelenir.

## 5. Fazlar

| Faz | İş | Ölçüt |
|---|---|---|
| 0 | Bu sözleşme + AGENTS notu | depo sahibinin onayı |
| 1 | Kişi modeli çekirdeği: alanlar, kayıt, etiket; «Beni nasıl tanıyorsun» sayfası; King'in kullanması | 14 alan görünür, düzeltilir, silinir |
| 2 | Sohbetten açık beyan + günlük tanışma sorusu | «X'i severim» → alanda, geri alınır |
| 3 | Ölçülen veriden gözlemler (ritim, kronotip, verim saati) | az veride «henüz yok» |
| 4 | Kişilik envanteri + üslup öğrenme | King senin üslubunda yazar |
| 5 | Ajan izin tablosu + gizlilik ayarları | ajan yalnız izinli alanı görür |
| 6 | SPİ vücut kompozisyonu | formül testleri, etiketler |
| 7 | AYS deneme ve ders analizi derinleştirme | elle hesapla doğrulanmış testler |

## 6. Durum

- 2026-10-17: plan yazıldı. Depo sahibinin kararları: (1) sohbetten
  **kendiliğinden** öğrensin (açık beyan; «Geri al» kalır), (2) hassas
  alanlar dahil **hepsi modele gidebilir**, (3) **önce kişi modeli**.
- 2026-10-17: **Faz 1 + 2 yapıldı.** `brand/ortak/kisi.js` (14 alan, açık
  beyan kuralları, tanışma, özet), hafıza kayıtlarına `alan`, King söz 22
  (kendiliğinden öğrenme, günde bir tanışma sorusu, «⋯ › Beni nasıl
  tanıyorsun», King'de hafıza komutları, görüntü modeline kişi özeti),
  sunucu sözü 24 (`<modul>/kisi` yayını + `GET /api/hesap/kisi`: bir modülde
  öğrenilen öbüründeki King'e ulaşır).
- Sıradaki: Faz 3 (ölçülen veriden gözlemler), sonra 4 (envanter + üslup).
- Açık: HKM'deki King (Merkez) `alan`ı henüz kullanmıyor; hafıza metni
  zaten eşitleniyor, alan bilgisi Faz 5'te HKM tarafına taşınacak.
