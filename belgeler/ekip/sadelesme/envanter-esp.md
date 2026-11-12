# ESP envanteri (Sadeleşme keşfi)

Kaynak: `C:\Users\ASUS\LifeOs-sadelesme` (origin/main temiz kopya), salt okuma. Tarih: 2026-11-12.
Kural: her iddia dosya yolu gösterir; bulamadığım şey «göremedim».

## 1. Özet sayılar

| Ne | Sayı | Nasıl sayıldı |
|---|---|---|
| Ekran dosyası | 19 (12.730 satır) | `ls ESP/src/js/screens`, `wc -l` |
| Kayıtlı sayfa (`PARCA.sayfa`, modul `esp`) | 18 + 1 (`kilavuz`, ortak `core/kilavuz.js:170`) | grep `PARCA.sayfa(`; `office.js` ve `rehber.js` sayfa değil, gömülü (Uzmana sor › Masalar, her disiplinin Öğren'i) |
| Çekmece | 8 (Bugün, Plan, Çalışma, Analiz, Onaylar, Ofis, Kütüphanem, Ayarlar) | `data/sections.js` `CEKMECE` |
| Çalışma bölümü / disiplin | 6 sayfa / 7 disiplin (Ses = müzik + diksiyon) | `screens/*.js` `ek:{ disc }` |
| Sekme (ekran içi bölüm) | 42 = 6 disiplin × 4 (24) + Merdiven 4 + Analiz 4 + Rütbe 5 + Genel (rehber) 5 | `const TABS` |
| Açılır araç (`K.Entry` çağrı yeri) | 6 disiplin ekranında 114 (Dil 28, Tarih 21, Ses 22, Okuma 20, Yazı 8+4, Felsefe 11) + ortak 4 (`core/parts.js`: Şimdi, Bugünkü çalışma, Yol haritası, Uzman masası) + Uzman masasının 5 katı; bütün ekranlarda 234 | grep `K.Entry(`/`K2.Entry(`; bir aracın birkaç durumu ayrı çağrı olabilir (ör. Dil «Çalışma» ×3) |
| Blok (`PARCA.blok`) | 54 (ekranlarda) | grep |
| Çekirdek .js | 156; 97'si `brand/ortak` kopyası; 59'u değil (56 gerçek ESP + 3 `brand/seviye` kopyası) | ad karşılaştırma döngüsü |
| Veri dosyası | 31 (15.416 satır) | `ESP/src/js/data` |
| Test dosyası | 152 | `ESP/src/tests` |
| `brand/parcalar.txt` satırı | yalnız ESP: [bas] 1, [govde] 61, [tembel] 4, [test] 106; ESP + başka modül: [govde] 13, [test] 23; modül etiketsiz (üçüne de): [bas] 57, [govde] 123, [test] 216 | awk sayımı |
| Merdiven | 7 merdiven × 5 basamak, 86 kapı, 38 metrik, 76 egzersiz | §7 |
| Öğrenme içeriği | 68 konu (`data/topics.js`), 68 öğrenme kartı (hepsi `ready_for_app:false`), 14 anlatım (`data/rehber.js`) | §3 |
| Ofis ajanı | 9 (`data/agents.js` `AGENTS`) | §8 |

## 2. Ekran envanteri

Satır = bir sekme (içindeki bütün açılır araçlarla) ya da bir sayfa. Araç adları ekranda görünen adlardır (`yz` anahtarlarının metni); satır no'su ilgili `*Rows` fonksiyonudur. Disiplin sekmesinin gövdesi her ekranın `GOVDE` haritasından gelir (`lang.js:952`, `symposium.js:417`, `history.js:702`, `studio.js:674`, `library.js:595`, `writing.js:363`). Kısaltma: S. = `ESP.S` alanı (§6).

### 2a. Çalışma › altı disiplin

| Görünen ad | Dosya | Ne yapar | Okur/yazar | Öneri | Yeni yer | Not / risk |
|---|---|---|---|---|---|---|
| Dil › Çalış: Çalışma (kart oturumu; 3 durum + Kart + Oturum bitti), Bugünkü çalışma, Uzman masası | `lang.js` reviewRows 309-437, finishRow 437 | vadesi gelen kartları sorar, cevabı SRS'e yazar | S.cards, S.days | Çalışma → MOTOR:Tekrar; reçete → MOTOR:Plan; masa → SİL | Dil yolunun «bugünkü tekrar» adımı | `srs.js` kart takvimi + `kingogret` ikinci takvim (§6) |
| Dil › Kartlarım: Tek kart, Liste yapıştır, Tohum deste, Sık kelimeler, Bağlamda, Kelime ağı | `lang.js` addRows 491-550, cardRows 464 | kart ekleme, sık kelimeden ekleme (`KELIME_SIKLIK`), örnek cümle (`KELIME_ORNEK`), eş/zıt anlam | S.cards | ekleme → MOTOR:Tekrar; Bağlamda/Kelime ağı → ALAN:Dil | kelime dersinin sonunda «desteye ekle» | Tohum deste yalnız en/de (`lexicon.js SEED_CARDS`) |
| Dil › Öğren: Konuşma pratiği, Cümle kur, Dinle ve oku, Pratik, Konular, Üniteler, Ünite iste | `lang.js` learnRows 892-932 | konu listesi (11), ünite kartları (`LANG_UNITS` 6), ünite sınavı, HKM'den ünite isteme | S.cards, `meta/uniteSinav`, `meta/bamUniteler` | Konular/Üniteler → MOTOR:Yol; Pratik → MOTOR:Soru; Ünite iste → MOTOR:Arama | Dil yol haritası | — |
| Dil › Öğren: İki eksen, Düzeyler, Hata günlüğü, 8 dilde paralel cümleler | `lang.js` grammarRows 727-807 | dilbilgisi bant tablosu (`GRAMMAR_TOPICS` 15), 8 üretim hatası türü, hatayı karta çevirme, 60 paralel cümle | S.cards | ALAN:Dil (içerik); Hata günlüğü → MOTOR:Tekrar | dilbilgisi dersleri | büyük kısmı statik tablo |
| Dil › İlerleme: Kart hatırlama, Kutu dağılımı, Bant, Shadowing, Sık kelime kapsamı, Yol haritası | `lang.js` progressRows 650-697 | retansiyon, kutu dağılımı, CEFR bandı, shadowing dakikası, sıklık kapsamı | S.cards, S.days | MOTOR:Tekrar (istatistik) + MOTOR:Yol | alanın tek ilerleme şeridi | — |
| Dil panoları: Gelecek yük, Dil panosu | `lang.js:1015,1018` | 7 günlük vade grafiği | S.cards | MOTOR:Tekrar | — | — |
| Felsefe › Çalış: Şimdi, Bugünkü çalışma, Düşünce deneyleri, Argüman alıştırmaları, Uzman masası | `symposium.js` calisRows 401, experimentRows 135-163 | 15 deney, 6 argüman alıştırması listesi (`data/experiments.js`) | S.args | deney/alıştırma → ALAN:Felsefe (ders içi alıştırma); Şimdi/reçete → MOTOR:Plan; masa → SİL | Felsefe yolunun derslerinde | — |
| Felsefe › Tezlerim: Yeni tez, Sokratik sorular, Açık tez, Kapanan tez | `symposium.js` addRows 289-319, openRows 268, closedRows 279 | tez yazma/kapama, 8 Sokratik soru, argüman denetimi (`intellect.js`) | S.args | MOTOR:Not (tipli not «tez») + ALAN:Felsefe kuralı | Not motoru | — |
| Felsefe › Öğren: Konular, Kaynaklar, Belge iste, Kanondan ekle | `symposium.js` topicRows 388, textRows 331-359 | 12 konu, BAM belgesi, 34 kanon eserini Okuma'ya ekleme | S.books, `meta/dayanaklar` | Konular → MOTOR:Yol; Belge iste → MOTOR:Arama; Kanon → ALAN:Felsefe | Felsefe yolu | — |
| Felsefe › İlerleme: Yol haritası; Tez panosu | `symposium.js:418,441` | merdiven; açık tezlerin yaşı | S.args | MOTOR:Yol | — | sekmede tek satır var |
| Tarih › Çalışma: Bugünün egzersizi, Tarih destesi, Anakronizm tuzakları, Tarih yazımı okulları, Egzersiz kataloğu, Bugünkü çalışma, Uzman masası (boşken Şimdi) | `history.js` calismaRows 612-651 | `HISTORY_DRILLS` 10, `ANACHRONISMS` 5, `HISTORIOGRAPHY` 8, tarih destesi | S.events, S.cards | egzersiz/okullar/anakronizm → ALAN:Tarih (ders içeriği); deste → MOTOR:Tekrar; masa → SİL | Tarih yolu | — |
| Tarih › Olaylar: Şerit, Dönemler, Yüzyıl boşlukları, Dağılım, Olay ekle, Olaylar, Neden zinciri, Belge iste, Kaynak ekle, Denge, Kaynaklar | `history.js` seritRows 194-258, olayRows 337-372, zincirRows 540, kaynakRows 443-492 | zaman şeridi, 64 tohum olay, neden zinciri kuralı, kaynak dengesi (`chrono.js`) | S.events, S.chains, S.sources | olay/kaynak → MOTOR:Kayıt (tipli kayıt); şerit/zincir kuralı → ALAN:Tarih; Belge iste → MOTOR:Arama | Tarih alanının kayıt türleri | 11 araç tek sekmede |
| Tarih › Öğren: Pratik, Konular, Üniteler | `history.js` learnRows 671-687 | 10 konu, 8 ünite (`HISTORY_UNITS`), pratik sorular | S.cards | MOTOR:Yol + MOTOR:Soru | Tarih yolu | — |
| Tarih › İlerleme: şerit özeti, Yol haritası | `history.js:708` | — | S.events | MOTOR:Yol | — | — |
| Ses › Müzik: Bugünkü çalışma, Metronom, Tekrar kaydet, Parça ekle, Parçalar, Paket iste, Gam ve mod cetveli | `studio.js` musicRows 314-395, parcalarEntry 267, scaleCalculatorEntry 409 | metronom ve temiz BPM (`acoustic.js`), repertuar, HKM'den paket, 144 gam örneği (`gamkatalog.js`) | S.pieces, S.days | Metronom, Gam cetveli → ALAN:Müzik (dersin içinde açılan araç); Tekrar kaydet/Parça → MOTOR:Kayıt; Paket iste → MOTOR:Arama | Müzik yolunun ilgili derslerinde | sahibinin şikâyet ettiği yığın |
| Ses › Müzik: Kulak egzersizleri, Aralıklar, Caged, Deşifre, Repertuar bakımı | `studio.js` earRows 166-198 | ilk dördü **statik tablo** (`K.Table`: `EAR_DRILLS` 7, `INTERVALS` 11, `CAGED` 5, `SIGHT_READING` 5), etkileşimli alıştırma değil; repertuar bakımı = bayatlayan parçalar | S.pieces | dördü → ALAN:Müzik ders içeriği; Repertuar bakımı → MOTOR:Tekrar | kulak/akor/deşifre dersleri | — |
| Ses › Müzik ve Diksiyon: Uzman masası (iki ayrı) | `studio.js:676-677`, `parts.js:962` | bkz. ortak satır | — | SİL | — | Ses sayfasında iki masa |
| Ses › Diksiyon: Bugünkü çalışma, Çalışma metni, Telaffuz kuralları, Kayıt ölçümü, Konuşma hızı, Nefes ve vurgu, Son kayıtlar | `studio.js` dictionRows 462-550 | 10 tekerleme, WPM, hata oranı (beyan) (`phonetics.js`) | S.recordings | SORU | yeni alan listesinde Diksiyon yok | §9 soru 1 |
| Ses › Öğren: Konular (müzik 9 + diksiyon 9) | `studio.js` topicRows 630 | iki konu listesi | — | MOTOR:Yol | — | — |
| Ses › İlerleme: Tempo panosu, Plato, Hedefe ulaşma, Diksiyon eğilimi, Isınma sırası, Yol haritası ×2 | `studio.js` progressRows 580-612, 682 | plato (14 gün), temiz BPM eğilimi | S.pieces, S.recordings | MOTOR:Yol + ALAN:Müzik kuralı | — | — |
| Okuma › Çalış: Şimdi, Bugünkü çalışma, Uzman masası | `library.js` calisRows 587 | bağsız not sayısı, reçete | S.notes | MOTOR:Plan; masa → SİL | — | — |
| Okuma › Not ve kitap: Not ekle, Notlar, Bağlı notlar, Sentez katsayısı, Bağ önerileri, Kavram matrisi, Raf, Özet, Alıntı, Kaynaklar, Öğrendiğini anlat, Okuma listesi iste, Kaynak ekle | `library.js` noteRows 212-241, matrixRows 325-366, bookRows 510-551, anlatEntry 407 | atomik not + bağlar, sentez katsayısı (`intellect.js`), kitap rafı | S.notes, S.books, `meta/anlatim` | not/bağ → MOTOR:Not; raf → MOTOR:Kayıt; Sentez katsayısı → ARŞİV; Okuma listesi iste → MOTOR:Arama | Not motoru | 13 araç tek sekmede |
| Okuma › Öğren: Konular, Dört düzey, Analitik okumanın dört sorusu, Okuma protokolü, Not şablonları, Bırakma izni | `library.js` topicRows 574, methodRows 152-187 | 8 konu; yöntem **statik tabloları** (`reading_method.js`) | — | ALAN:Okuma ve yazı (ders içeriği) | Okuma yolu | — |
| Okuma › İlerleme: Yol haritası; Okuma panosu | `library.js:596,620` | biten kitaplar | S.books | MOTOR:Yol | — | — |
| Yazı › Çalış: Şimdi (son taslak), Bugünkü çalışma, Uzman masası | `writing.js` calisRows 354 | — | S.drafts | MOTOR:Plan; masa → SİL | — | — |
| Yazı › Taslaklarım: Taslak (düzenleyici), Taslaklar | `writing.js` draftRows 185-232 | taslak yazma/revizyon | S.drafts | MOTOR:Not (tipli not «taslak») | Not motoru | — |
| Yazı › Öğren: Konular, Yazı örnekleri iste, Revizyon geçişleri, Yapı kalıpları, Retorik figürler | `writing.js` topicRows 341, toolRows 121-160 | 9 konu; 7 revizyon geçişi, 6 yapı, 16 figür (**statik tablo**, `rhetoric.js`) | — | ALAN:Okuma ve yazı (ders içeriği); örnek iste → MOTOR:Arama | Yazı yolu | — |
| Yazı › İlerleme: Haftalık üretim, Taslak–revizyon, Okunabilirlik, Pratik süresi, Sınır, Yol haritası | `writing.js` measureRows 270-324 | okunabilirlik (`intellect.js`), revizyon oranı | S.drafts, S.days | MOTOR:Yol + ALAN:Okuma ve yazı kuralı | — | — |

### 2b. Disiplinlerin ortak parçaları (`core/parts.js`, `core/desk.js`, `screens/rehber.js`)

| Görünen ad | Dosya | Ne yapar | Okur/yazar | Öneri | Not |
|---|---|---|---|---|---|
| Şimdi | `parts.js:944` | bugünün dakikası + sıradaki tek iş | S.days | MOTOR:Plan | — |
| Bugünkü çalışma | `parts.js:951` | `Coach.prescribe` reçetesi | DRILLS, S.days | MOTOR:Plan | §7 |
| Yol haritası | `parts.js:957` `deskMap` 387 | merdivende nerede olduğun | curriculum | MOTOR:Yol | — |
| Uzman masası: Uzmanla konuş, Ekler, Hatırlatma, Öneriler, Bakım | `parts.js:962`, `desk.js:52` | disipline bağlı ajanla sohbet, ek, hatırlatma, öneri, bakım denetimi (`audit.js`) | chats, S.assets, S.reminders, proposals | SİL: sohbet → KING, ek → MOTOR:Not, hatırlatma → MOTOR:Plan, öneri → KING, bakım → ARŞİV | 7 disiplinde ayrı masa |
| Öğren'deki anlatım kartı + «Adım adım öğren» düğmesi | `parts.js:1013-1021`, `rehber.js` `alanKarti` | 14 anlatımdan alanınkini gösterir, Öğrenme sayfasına götürür | — | MOTOR:Yol | Öğrenme başka çekmecede (Kütüphanem) |

### 2c. Öteki sayfalar

| Görünen ad | Dosya | Ne yapar (bloklar) | Okur/yazar | Öneri | Yeni yer / not |
|---|---|---|---|---|---|
| Bugün › Genel bakış | `today.js` (1680 sat.) | Oturum listesi, Hızlı giriş formu ve kutusu, Sinyal satırı, Öğrenme tekrarı, Soru kartı, Sık kullanılanlar, Onay bekleyen teklifler (`today.js:1263-1285`) | S.days, proposals, signals | KABUK (giriş) + MOTOR:Kayıt (hızlı giriş) + MOTOR:Plan | en büyük ekran dosyası |
| Plan › Merdiven | `ladder.js` | Durum, Basamaklar, Projeler (14 proje), Sınama + Karışık sınama (`ladder.js:462`) | curriculum, `meta/alanKanit` | Basamaklar → MOTOR:Yol; Sınama → MOTOR:Soru; Projeler → ALAN (basamak kanıt işi) | alanın yol haritası olur |
| Analiz | `analytics.js` | Özet, Alanlar, Zaman, Rapor + Isı haritası, İçe aktarma kartı, Alan karoları, Bugünden özet | hepsi | SORU | ayrı ekran mı, alan İlerleme'si mi (bir özellik bir yer) |
| Onaylar › Bekleyen | `onaylar.js` | Sana sorulacaklar, Bekleyen öneriler | proposals | KING («yönet» niyeti) | — |
| Ofis › Bu hafta | `meeting.js` | Tutanak, Kararlar, Bulgular, Fikirler, Gündem, Karar, Hafta | office, meetings, briefings, decisions | KING / ARŞİV | §8 |
| Ofis › Uzmana sor | `team.js` + `office.js` (`masalar`) | Ajan masası, penceresi, seçimi, Masalar (Uzman masaları, Sözlük şeridi) | chats | KING | §8 |
| Kütüphanem › Notlar | `kutuphane.js:37` | Notlar, Defter özeti, Notlar ve belgeler | S.notes, S.assets | MOTOR:Not | — |
| Kütüphanem › Öğrenme | `ogrenme.js` | 68 öğrenme kartı + 14 anlatım, ortak öğrenme motorunda (`brand/ortak/ogrenmotor.js`) | `meta/alanKanit` | MOTOR:Yol | öğrenme Çalışma'da değil Kütüphanem'de: «bir özellik bir yer» ihlali |
| Kütüphanem › Ürünler | `kutuphane.js:38` | BAM ürünleri, Üniteler | `meta/bamUniteler` | MOTOR:Arama | — |
| Ayarlar › Profil | `profile.js` | Kişi bilgileri | profile | KABUK | — |
| Ayarlar › Genel | `guide.js` | Kullanım, Ofis, Veri, Sınırlar, Dayanak + Kolaylık pusulası | — | KABUK (Veri/yedek); Ofis, Dayanak → ARŞİV | — |
| Ayarlar › Rütbe | `rutbe.js` (1099 sat.) | Şu an, Merdiven, Başarımlar, XP nereden gelir, Defter | `seviye`, `basarim` | SORU | §8 |
| Ayarlar › Kılavuz | `core/kilavuz.js` (ortak) | modül kılavuzu | — | KABUK | — |

## 3. Disiplin başına öğrenme yolu bugün

**Ortak tablo (yedi disiplinin hepsi için geçerli).** Öğrenilebilecek içerik üç katmandır:
1. **Konu** (`data/topics.js` `ESP.TOPICS`, 68): `{ id, level 1–5, band?, title, goal, items[4–8] }`. `items` yalnız başlıktır (ör. müzik l1: «Oturuş ve el pozisyonu», «Akort (kulak ve alet ile)»).
2. **Öğrenme kartı** (`data/ogrenmekartlari.js`, 68, konu başına **bir** kart): `explanation` (birkaç cümle), `worked_example`, `common_misinterpretation`, `practice.steps[3] + prompt + expected_answer`, `transfer.prompt + rubric`. Derinlik: basit 12, orta 29, ileri 27. **68'inin hepsi `ready_for_app:false`**; ekranda «öğretmen incelemesi bekliyor» etiketiyle çıkar (`screens/ogrenme.js` `kartKonu`).
3. **Anlatım** (`data/rehber.js` `REHBER_KONULAR`, 14 = disiplin başına 2).

Sıra: hiçbir konuda önkoşul alanı yok (`prereq/onkosul/requires` grep = 0, dört veri dosyası). Konular yalnız `level` taşır; Öğrenme sayfası (`ogrenme.js` `liste`) anlatımları ve konuları veri sırasıyla, disipline göre gruplar. «Sıradaki» önerisi `core/alan.js:105` `sira` → `LIFEOS.USTA.sira`: kanıta ve vadeye göre sıralar, önkoşula göre değil. Yani **sıfırdan sıralı bir ders yolu yok**; düzeyli bir konu kataloğu + konu başına tek açıklama kartı var. Merdivenin `study` başlıkları (§7) konu listesinden ayrı bir ikinci listedir.

| Disiplin | Başlangıç (level 1) | Bitiş (level 5) | Konu (düzey dağılımı) | Ek içerik | Eksik (bugünkü veride göremediğim) | Hangi araç hangi derse bağlanır |
|---|---|---|---|---|---|---|
| Dil | «Ses ve alfabe», «Günlük hayat» | «Aracılık», «Çevrim içi etkileşim», «Deyim, ima ve mizah» | 11 (2·2·2·2·3) | `LANG_UNITS` 6 ünite (en: 10+6+6+6+6+5 kart; de: 10+5+5+5, l3-l4 yalnız en), `GRAMMAR_TOPICS` 15, 60 paralel cümle, `LANGS` 8 dil, tohum deste yalnız en/de | dile özgü alfabe dersi yok (kart dile değil «ses ve yazı» fikrine yazılmış); ses dosyası yok (kartın kendi «yaygın hata»sı bunu söylüyor); 8 dilden 6'sında ünite yok | Tek kart/Liste/Tohum/Sık kelime → kelime dersinin sonu; Hata günlüğü → üretim dersleri; İki eksen/Düzeyler → dilbilgisi dersleri; Shadowing → dinleme dersleri; Konuşma pratiği/Cümle kur → üretim dersleri |
| Felsefe | «Mantık ve argüman» | «Zihin felsefesi», «Bilim felsefesi», «Türk düşüncesi» | 12 (1·2·3·3·3) | `CONCEPTS` 20, `CANON` 34 eser / 32 yazar, `TRADITIONS` 11, `SOCRATIC` 8, `EXPERIMENTS` 15, `ARGUMENT_DRILLS` 6 | «felsefi nasıl düşünülür» için adım adım ders göremedim; l1 tek konu | Sokratik sorular, Argüman alıştırmaları → mantık dersi; Düşünce deneyleri → etik/metafizik dersleri; Kanondan ekle → her konunun okuma adımı; Yeni tez → dersin kanıt işi |
| Müzik (gitar) | «Duruş, akort, ilk sesler», «Açık akorlar ve ritim» | «Repertuar ve sahne» | 9 (2·2·2·2·1) | `SCALES` 12, `PROGRESSIONS` 6, `TECHNIQUES` 10, `INTERVALS` 11, `EAR_DRILLS` 7, `CAGED` 5, `SIGHT_READING` 5, 144 gam örneği | sapta nota yerleri dersi göremedim; enstrüman `profile.instrument` ('gitar') ama içerik gitara sabit; kulak alıştırmaları etkileşimli değil (tablo) | Metronom → ritim ve teknik dersleri; Gam ve mod cetveli → «Gam ve pozisyon», «Temel teori»; Aralıklar/Kulak egzersizleri → «Kulak eğitimi»; Caged → «Barre ve CAGED»; Deşifre → teori; Tekrar kaydet/Repertuar bakımı → «Repertuar ve sahne» |
| Diksiyon | «Nefes ve diyafram», «Ses ve rezonans» | «Metin seslendirme» | 9 (2·2·2·2·1) | `TONGUE_TWISTERS` 10, `BREATH_DRILLS` 4, `STRESS_DRILLS` 2, `ARTICULATION_ERRORS` 7 | yeni alan listesinde yeri yok (SORU) | Nefes ve vurgu → l1-l2; Çalışma metni/Kayıt ölçümü/Konuşma hızı → tempo ve seslendirme dersleri |
| Okuma | «Dört okuma düzeyi», «Gözden geçirme tekniği» | «Kendi kanonunu kurmak» | 8 (2·1·2·2·1) | `READING_LEVELS` 4, `ANALYTIC_QUESTIONS` 4, `NOTE_TEMPLATES` 7, `READING_PROTOCOL` 5 | okuma metni/alıştırma metni göremedim; içerik yöntem tablosu | Not şablonları/Not ekle → «Atomik not»; Bağ önerileri/Kavram matrisi → «Bağ kurma», «Sentopik okuma»; Öğrendiğini anlat → her kitabın sonu |
| Yazı | «Cümle», «Paragraf» | «Uzun biçim» | 9 (2·2·2·2·1) | `RHETORIC` 16, `REVISION_PASSES` 7, `STRUCTURES` 6 | yazma ödevi dizisi göremedim (kartın `practice`'i dışında) | Revizyon geçişleri → «Revizyon»; Yapı kalıpları → «Metin yapısı»; Retorik figürler → «Söz sanatları»; Okunabilirlik → «Cümle», «Üslup» |
| Tarih | «Kronoloji kurma» | «Kendi araştırman» | 10 (1·2·3·3·1; veri sırası düzeye göre değil: 1,2,3,4,4,3,3,4,2,5) | `ERAS` 6, `SEED_EVENTS` 64, `HISTORIOGRAPHY` 8, `ANACHRONISMS` 5, `HISTORY_DRILLS` 10, `HISTORY_UNITS` 8 | dönem anlatısı (ne oldu) göremedim; içerik yöntem ağırlıklı | Şerit/Olay ekle → «Kronoloji kurma»; Neden zinciri → «Nedensellik»; Kaynak ekle/Denge → «Kaynak eleştirisi»; Tarih yazımı okulları → aynı adlı konu; Anakronizm tuzakları → «Anakronizm» |

Sonuç: sahibinin istediği «alfabeden / sapta notadan / felsefi düşünmenin ilk adımından üstatlığa» sıralı ders yolu **bugün veri olarak yok**; iskelet (düzeyli konu + kart + merdiven kapısı) var, ders içeriği her konu için tek karttır ve uygulamaya hazır işaretli değildir.

## 4. Modüle özgü çekirdek dosyalar

`ESP/src/js/core/` içinde 156 .js var; 97'si `brand/ortak/` ile aynı adlı (kopya), **59'u** orada yok. Bu 59'dan 3'ü (`basarim.js`, `perde.js`, `xp.js`) başka bir yerin kopyasıdır: baş yorumları «ÜRETİLMİŞ KOPYA … Düzeltme brand/seviye/… içine yazılır». Gerçekten ESP'ye özgü: **56 dosya**. Rol = dosyanın ilk yorum satırı; test = `ESP/src/tests/<ad>.test.js` var mı.

| Dosya (satır) | Rol | Test | Öneri |
|---|---|---|---|
| state.js (1558) | veri modeli, yükleme/kaydetme | var | KABUK (çekirdek: tek depoya taşınır) |
| store.js (25) | depo ayarları | var | KABUK (çekirdek) |
| storage.js (305) | depo sağlığı | var | KABUK (çekirdek) |
| utils.js (101), h.js (69), memo.js (60), ui.js (903), components.js (670) | yardımcılar, şablon, çizim önbelleği, ikon/grafik, bileşenler | ui/utils/h/memo: göremedim; components var | KABUK (ortak bileşenlerle birleşir) |
| nav.js (53), modules.js (146) | çekmece şeridi; disiplin açma-kapama | modules var | KABUK (alan aç/kapa ayarı tek şemada) |
| setup.js (251), ornekveri.js (55), palette.js (245), bilgiler.js (10) | ilk açılış soruları; örnek profil; Ctrl+K; sayıların bilgi parçası | setup, ornekveri var | KABUK |
| curriculum.js (637) | müfredat motoru: kademeyi ölçümden üretir | var | MOTOR:Yol |
| evidence.js (284) | kanıt motoru: eşiğin neyi söylemeye yetkili olduğu | var | MOTOR:Yol (kapı kanıtı) |
| lesson.js (533) | ünite kartlaşır, pratik ölçüme döner | var | MOTOR:Yol + MOTOR:Tekrar |
| unite.js (328) | HKM'nin hazırladığı dil ünitesini almak | var | MOTOR:Yol (içerik girişi) |
| kingogret.js (175) | ESP'nin öğretme motoru adaptörü (`brand/ortak/ogret.js`) | var | MOTOR:Yol |
| alan.js (109) | alan sınaması «konuyu gerçekten biliyor muyum» | var | MOTOR:Soru |
| srs.js (327) | Leitner kutuları + SM-2 | var | MOTOR:Tekrar |
| siklik.js (110) | sık kelime kapsamı | var | ALAN:Dil (Tekrar'a dil kuralı) |
| coach.js (267) | günlük reçete yazar | var | MOTOR:Plan |
| planner.js (502) | sıradaki tek iş, haftalık rota | var | MOTOR:Plan |
| plans.js (715), hedefplan.js (330), hedefler.js (470) | öneri/eylem planı; hedefi günlük düzene çevirme; hedef paketleri | plans, hedefler var; hedefplan göremedim | MOTOR:Plan |
| gunsure.js (131), kotugun.js (62), takvim.js (152) | tarihli günlük süre; kötü gün modu; takvim yayını | var | MOTOR:Plan |
| timer.js (182), dunku.js (74), parse.js (316) | süreölçer; dünün aynısı; serbest metin ayrıştırma | var | MOTOR:Kayıt |
| anlat.js (98) | öğrendiğini anlat | var | MOTOR:Not (Yol'da ders adımı) |
| belge.js (471) | BAM'dan kaynaklı malzeme | var | MOTOR:Arama |
| chrono.js (335) | kronoloji sayıları | var | ALAN:Tarih |
| acoustic.js (320) | metronom, temiz BPM, artikülasyon | var | ALAN:Müzik (dersin içinde açılan araç) |
| intellect.js (567) | EHS/SSK skoru, okunabilirlik, argüman denetimi | var | bölünür: okunabilirlik → ALAN:Okuma ve yazı; argüman → ALAN:Felsefe; EHS/SSK → ARŞİV |
| parts.js (1050) | veriye bağlı parçalar (Şimdi, Reçete, Yol haritası, Uzman masası, bölümler) | var | bölünür: `simdi/recete` → MOTOR:Plan, `yol/deskMap` → MOTOR:Yol, `desk*` → SİL |
| desk.js (232) | «Uzman masası» katmanı (5 açılır kat) | var | SİL (sohbet → KING, ekler → MOTOR:Not, hatırlatma → MOTOR:Plan) |
| office.js (1105) | dokuz ajanın çalışma düzeni | var | KING (ajanlar yerine tek King) / ARŞİV |
| kingarac.js (1208), kingveri.js (531), komut.js (249) | King araçları, olaylar, konuşarak değiştirme | kingarac, kingveri var; komut göremedim | KING |
| beacon.js (1088) | HKM'ye «varsa gönder» işareti | var | KING (bağlam kurucunun veri kaynağı) |
| speak.js (369), talk.js (261), voice.js (221) | sesli cevap, sesli sohbet, dikte | speak var | KING |
| inceleme.js (152) | Ofis›Toplantı yerine veri incelemesi | göremedim | SORU: haftalık inceleme Plan'a mı King'e mi? |
| audit.js (657) | bölüm denetimi («ters giden ne») | var | ARŞİV (gerekli kural Yol'un «takıldın» uyarısına) |
| signals.js (296) | sinyal katmanı | var | ARŞİV |
| calib.js (374), friction.js (287), goodhart.js (375) | kalibrasyon, sürtünme, Goodhart nöbetçisi | var | ARŞİV (bkz. §8) |
| xp.js, basarim.js, perde.js (brand/seviye kopyası), xpsayim.js (82), basarimsayim.js (64) | XP/rozet motoru, rütbe perdesi, sayımlar | xp, basarim, perde var | SORU (alanın kendi XP'si yok kuralı; sistem geneli XP kalsın mı?) |

## 5. Sayı hesaplayan kural motorları

Test sayısı = `ESP/src/tests/<ad>.test.js` içindeki `it(` satırı (grep).

| Dosya | Ne hesaplar | Ana sabitler | Test | Motor |
|---|---|---|---|---|
| `core/curriculum.js` | metrik ölçümü (`METRICS`, `measure`), kapı durumu pass/fail/unknown, basamak tamamlanması, kademe (`levelOf`), `masteryPct`, `nextGate`, yerleştirme tahmini | `SELF_REPORTED` 3 metrik, `ASGARI_BEYAN = 5` (319) | 27 | MOTOR:Yol |
| `core/coach.js` | günlük reçete (ısınma/asıl/zorlanma), bütçe `dailyBase`, asgari gün | `PRESCRIPTION_SHAPE` (drills.js:361) | 23 | MOTOR:Plan |
| `core/srs.js` | kart zamanlama: Leitner 5 kutu (0/1/3/7/21 gün) + SM-2 kolaylık, vadesi gelenler, gecikme, retansiyon | `EASE_MIN 1.3`, `EASE_MAX 2.8` (`clampEase` 69) | 22 | MOTOR:Tekrar |
| `brand/ortak/ogret.js` (ESP'de `core/kingogret.js` adaptörü) | King öğretmeninin kavram tekrarı | `ARALIK = [1, 3, 7]` (58) | kingogret.test.js var | MOTOR:Tekrar (ikinci takvim; birleşmeli) |
| `core/alan.js` → `LIFEOS.USTA.asama/sira/harita` | konu sınama aşaması ve sıradaki konu | `SAKLA = 40` kanıt | 9 | MOTOR:Soru + MOTOR:Tekrar |
| `core/lesson.js` | ünite ilerlemesi, konu işaretleri, pratik/ünite sınavı sonucu, kalıcılık | `KNOWN_BOX` | 37 | MOTOR:Yol + MOTOR:Soru |
| `core/siklik.js` | destenin en sık N kelimeyi kapsama oranı, bantlar | `OTURMUS_KUTU = 4` | 13 | ALAN:Dil (Tekrar kuralı) |
| `core/acoustic.js` | vuruş ms, temiz BPM eşiği, sonraki tempo, plato, diksiyon WPM bandı | `CLEAN_STREAK 3`, `CLEAN_WINDOW_DAYS 14`, `PLATEAU_DAYS 14`, `BPM_STEP 4` (40-49) | 19 | ALAN:Müzik |
| `core/chrono.js` | dönem yayılımı, yüzyıl boşlukları, kaynak dengesi, eleştiri derinliği, zincir dengesi, tarih retansiyonu | — | 26 | ALAN:Tarih |
| `core/intellect.js` | EHS = Σ(D×H×K) «Entelektüel Hacim Skoru» (51-149), kalite katsayısı (77), okunabilirlik (439), sentez, argüman denetimi | — | 31 | bölünür: okunabilirlik → ALAN:Okuma ve yazı, argüman → ALAN:Felsefe, EHS → ARŞİV |
| `core/planner.js` | sıradaki tek iş, haftalık rota, denge, tıkanmış temel | `RETENTION_FLOOR 0.50` (66) | 17 | MOTOR:Plan |
| `core/timer.js`, `core/gunsure.js` | ölçülmüş dakika; tarihli günlük taban | — | 14; 5 | MOTOR:Kayıt; MOTOR:Plan |
| `core/state.js` `minutesInfo/olculenDakika` (~420-445) | gün/disiplin dakikası ve kesinliği (measured/estimated); `null` ≠ 0 | — | state.test.js var | MOTOR:Kayıt |
| `core/evidence.js` | bir eşiğin yetkisi (kaynak, kesinlik, uygulanabilirlik) | `data/evidence.js` 17 kanıt | 27 | MOTOR:Yol (kapı kanıtı) / ARŞİV |
| `core/audit.js` | disiplin başına bakım bulguları | `ASGARI 5`, `SULUK_LAPSE 4`, `BAYAT_GUN 21` | 21 | ARŞİV |
| `core/goodhart.js` | çaba↑ sonuç→ ayrışması, iki pencere | `POLICY.windowDays` vb. (84-86) | 24 | ARŞİV |
| `core/calib.js` | tahmin–gerçek hatası, yanlılık, bant | `ASGARI 5`, `PENCERE 20` | 19 | ARŞİV |
| `core/friction.js` | yönetim dakikası / çalışma dakikası | `BUTCE_DK 12`, `ORAN_ESIK 0.34`, `PENCERE 14` | 15 | ARŞİV |
| `core/signals.js` | sinyal satırları | — | 15 | ARŞİV |
| `core/xp.js` (brand/seviye) + `data/kademeler.js` | XP, kademe ve basamak, defter | `LIFEOS.BASAMAK_SAYISI 3`, `SEVIYE_SURUM 4` | 110 | SORU |
| `core/basarim.js` (brand/seviye) + `data/basarimlar.js` | rozet ve kazanım | `BASARIM_SURUM 1` | 42 | SORU |
| `core/xpsayim.js`, `core/basarimsayim.js` | «o gün ne yapıldı» sayımı | — | göremedim | SORU |

Gözlem: kart kolaylığı iki yerde farklı kıstırılıyor: `srs.js:69` 1.3–2.8, `state.js` `normCard` 1.3–3.2. Tek Tekrar motorunda tek sınır olmalı. İki ayrı tekrar takvimi (SRS kartı + `esp.ogret.tekrar`) Tekrar motorunda birleşmeli.

## 6. Saklanan veri

**Depo katmanı.** `ESP/src/js/core/store.js` yalnız ayar verir: `ESP.SCHEMA_VERSION = 1`, `LIFEOS.Depo.kur({ appId:'esp-entelektuel', yerelAnahtar:p => 'esp.v1.' + p, profilAnahtari:'esp.activeProfile', varsayilanProfil:'ben', alan:'esp' })`. Davranış `brand/ortak/depo.js`'tedir (baş yorum: önce Artifact "db" yeteneği, yoksa localStorage; her durumda yerel kopya).

| localStorage anahtarı | İçerik | Kaynak |
|---|---|---|
| `esp.v1.<profil>` | profilin bütün belgeleri (aşağıdaki koleksiyonlar) | `core/store.js` `yerelAnahtar` |
| `esp.profiles` | cihazdaki profil listesi | `core/state.js:296` `LIST_KEY` |
| `esp.activeProfile` | etkin profil (varsayılan `ben`) | `core/state.js:309,344` |

**Belgeler/koleksiyonlar** (`ESP.Store.get/set/list` çağrıları sayıldı; yükleme `core/state.js` `loadAll` ~1391-1500):

| Anahtar | Ne tutar | Yazan dosya |
|---|---|---|
| `meta` | `schemaVersion`, `migratedAt` | `core/state.js` `migrate` 1380 |
| `profile` | `id, name, focus, langs[], instrument, dailyMinutes(60), startedAt, createdAt` | `core/state.js:249` `defaultProfile` |
| `prefs` | `reduceMotion, autoBriefing, pinned[]` | `core/state.js:276` |
| `days/<tarih>` | gün kaydı; `sessions[]` (her oturum `disc, minutes, minutesCert` measured/estimated/missing, `count`), `note` | `core/state.js:358-490` (`addSession`, `saveDay`; boş gün yazılmaz) |
| `cards/<id>` | dil kartları; SRS alanları `box, ease(1.3–3.2), interval, reps, lapses, active, history[]`, `tags, es[], zit[]` | `core/state.js:575-613` |
| `args/<id>` | felsefe tezleri (açık/kapalı) | `core/state.js:632-668` |
| `notes/<id>` | okuma notları ve `links[]` (bağlı not) | `core/state.js:679-713` |
| `books/<id>` | kitaplar (`finishedAt` …) | `core/state.js:737-760` |
| `pieces/<id>` | müzik parçaları (repertuar, temiz BPM) | `core/state.js:813-859` |
| `recordings/<id>` | diksiyon kayıt ölçümleri | `core/state.js:842-892` |
| `drafts/<id>` | yazı taslakları | `core/state.js:903-918` |
| `goals/<id>` | hedefler | `core/state.js:932-945` |
| `assets/<id>` | uzman masası ekleri (bağlantı/metin) | `core/state.js:979-1008` |
| `reminders/<id>` | uzman masası hatırlatmaları | `core/state.js:1039-1094` |
| `events/<id>`, `sources/<id>`, `chains/<id>` | tarih olayları, kaynaklar, neden zincirleri | `core/state.js:1129-1278` |
| `decisions/<id>` | karar kaydı | `core/state.js:1316-1325` |
| `proposals/*` | öneriler (onay bekleyen) | `core/state.js`, `core/plans.js`, `core/hedefplan.js` |
| `weekplan` | haftalık plan | `core/plans.js`, `core/state.js:1486` |
| `office`, `chats/*`, `meetings/*`, `briefings/*` | ofis durumu, uzman sohbetleri, toplantılar, brifingler | `core/office.js:110,1080` |
| `forecasts/*` | kalibrasyon tahminleri | `core/calib.js` |
| `usage` | sürtünme/kullanım sayaçları | `core/friction.js` |
| `signals/*` | sinyaller | `core/signals.js` |
| `hedefler` | hedef planı | `core/hedefler.js` |
| `timer` | süreölçer durumu | `core/timer.js` |
| `storage` | depolama sağlık bilgisi | `core/storage.js` |
| `hkm` | HKM bağlantı durumu | `core/beacon.js` |
| `meta/alanKanit` | konu sınama kanıtları (son 40), aşama `LIFEOS.USTA.asama` ile hesaplanır | `core/alan.js:23` |
| `meta/anlatim` | «öğrendiğini anlat» kayıtları | `core/anlat.js:32` |
| `meta/uniteSinav` | ünite sınavı sonuçları | `core/lesson.js:431` |
| `meta/bamUniteler` | HKM'den alınan dil üniteleri | `core/unite.js:65` |
| `meta/diksiyon`, `meta/dayanaklar` | BAM belgesi önbelleği | `core/belge.js:263,323` |
| `meta/gunSure`, `meta/kotugun` | tarihli günlük süre; kötü gün | `core/gunsure.js:37`, `core/kotugun.js:23` |
| `seviye` | XP defteri | `core/xp.js:76` (brand/seviye kopyası) |
| `basarim` | rozet defteri | `core/basarim.js:64` |
| `esp.ogret.tekrar`, `esp.ogret.son` | King öğretmeninin kendi tekrar takvimi (aralık 1-3-7 gün, `brand/ortak/ogret.js:58`) — kartın SRS takviminden **ayrı ikinci takvim** | `core/kingogret.js:41,132` |

Not: koleksiyonların her birinin alan alan şeması yalnız `cards` ve `days` için okundu; ötekiler için alan listesi «göremedim» (norm/new fonksiyonlarının satırları yukarıda).

**Göç (migration).** Tek göç vardır: `core/state.js:1380` `migrate` — `schemaVersion < 1` ise 1 yapar ve `migratedAt` yazar; başka dönüşüm yok. Alan düzeltmeleri `norm*` fonksiyonlarında yüklemede yapılır (ör. `normCard` bozuk kutuyu 1–5'e kıstırır).

**Dışa aktarma/yedek.** `brand/ortak/depo.js:347` `exportAll()` → `{ __meta:{ app:'esp-entelektuel', schemaVersion, exportedAt, mode }, data:{ "<koleksiyon>/<id>": belge, … } }`. `readBackup` (aynı dosya, 358+) önce `app` kimliğini, sonra şema sürümünü denetler; eski düz sözlük biçimini de kabul eder. Yeni tek depoya geçişte bu biçim doğrudan okunabilir bir kaynak olur.

## 7. Merdiven (data/curriculum.js) ayrıntılı

Dosya: `ESP/src/js/data/curriculum.js` (496 satır). Tanımladığı: `ESP.LEVELS`, `ESP.LADDERS`, `ESP.PLACEMENT` (sandbox'ta yükleyip saydım). Görev metnindeki «beş kademe» doğru değil: **altı kademe** var (`rank` 0–5: Temas, Acemi, Çırak, Kalfa, Usta, Üstat); 0 = «henüz ölçülmüş üretim yok», kapısı yok; her merdivende 1–5 arası **beş basamak** tanımlı.

**Basamak şekli:** `{ rank, title, study[], gates[], proof }`. `gates[].metric` + `min`/`max`; `study` = o basamakta ne çalışılacağı (kısa başlıklar); `proof` = kapanış işi (tek cümle). Merdivenin kendisi: `{ disc, coach, aim, blind[4], levels[5] }`; `blind` = kapıların göremediği 4 şey.

| Merdiven | Koç | Kapı (r1..r5) | Toplam kapı | r1 çalışma başlıkları | r5 kanıt |
|---|---|---|---|---|---|
| lang (Dil) | polyglot | 2·3·4·3·3 | 15 | Alfabe ve ses uyumu; günlük 10 yeni kart; 10 dk shadowing; sayılar/saat/yön | çeviri–geri çeviri kayıp analizi |
| philo (Felsefe) | socrates | 2·2·3·2·2 | 11 | dört ana soru; Sokratik diyalog okuma; kavram sözlüğü | kimsenin sormadığı soruyu savunmak |
| music (Müzik) | maestro | 2·3·3·3·2 | 13 | duruş ve pena; açık akorlar; metronomla dörtlük | kendi besteni kaydetmek |
| diction (Diksiyon) | demosthenes | 2·2·2·3·2 | 11 | diyafram nefesi; tekerleme; kaydını dinleme | yarım saat notsuz konuşma |
| reading (Okuma) | aristoteles | 2·2·2·3·2 | 11 | günde 20 dk; altını çizme; kaynak kaydı | kendi kanonunu yazmak |
| writing (Yazı) | montaigne | 2·2·3·2·2 | 11 | günde 200 kelime; düzeltmeden yazma; günlük | bölümlü uzun metin |
| history (Tarih) | herodot | 2·3·3·3·3 | 14 | büyük dönemler; yüzyıl mantığı; on dönüm noktası | kaynaklı özgün tarih yazısı |

Toplam **86 kapı** (`grep -c "metric:'"` = 86), **38 ayrı metrik**. Metrik kaydı `core/curriculum.js` `METRICS` (~42 kayıt satırı, `'lang.minutes30'` gibi; 107. satırdan başlar). Kapı örnekleri: `lang.cards>=100; lang.days14>=5` (r1) … `lang.cards>=4000; lang.retention>=0.85; lang.langs>=2` (r5); `music.cleanBpm>=80…160`; `diction.errorRate<=0.08…0.03`; `writing.readability>=45`.

**Kapı mantığı** (`core/curriculum.js`): `gateStatus` (339) ölçü yoksa `unknown/missing` («önce ölç»), `stepStatus` (386) basamak = bütün kapılar `pass` (`complete:gecen === kapilar.length`), beyana dayalı kapıyla geçilirse `weak` (kesinlik `measured` olamaz); `SELF_REPORTED` (313): `diction.errorRate`, `music.cleanBpm`, `music.noPlateau`; `levelOf` (421) ilk tamamlanmamış basamakta durur; `masteryPct` (471); `placement` (597) `ESP.PLACEMENT` sorularıyla yalnız «tahmin» etiketli başlangıç verir.

**Günlük reçete** (`core/coach.js` `prescribe` 78): kademe + açık kapının metriği → `ESP.DRILLS` (`data/drills.js`, **76 egzersiz**: dil 14, tarih 12, müzik 11, felsefe 11, diksiyon 10, okuma 9, yazı 9) içinden `ESP.PRESCRIPTION_SHAPE` (drills.js:361) kalıbıyla 1 ısınma + 2 asıl iş + 1 zorlanma (bir üst kademe) seçer; bütçe `dailyBase()` = `GunSure` tabanı ya da `profile.dailyMinutes` (60). Egzersiz alanları: `level, minutes, task, targets[], kind`.

**Yol motorunun iskeleti olarak ne kadar kullanılır:**

| Yanı | Değerlendirme |
|---|---|
| Kapıların ölçülebilir olması, `unknown ≠ fail` kuralı, beyan = zayıf kesinlik | Doğrudan alınır; «sayılar koddan gelir» kuralına birebir uyar. |
| `study` başlıkları | Ders değil, başlık (r1'de 3–4 madde, r5'te 3). Sıfırdan ders sırası yok: «Alfabe ve ses uyumu» bir maddedir, içinde alfabe dersi göremedim. Yol için her maddenin altına ders/adım listesi yazılmalı. |
| Kapılar | Çoğu **hacim** ölçer (kart sayısı, dakika, kitap, not sayısı), **bilgi** ölçmez (ör. felsefe r1 `philo.concepts>=5; philo.minutes30>=180`). Yol'da hacim kapısının yanına Soru motorundan bir sınama kapısı gerekir. |
| Altı kademe adı (lonca) | Alan-bağımsız, yeniden kullanılabilir. |
| Disiplin kümesi | 7 merdiven: Ses ekranı iki merdiven (music, diction) taşır. Yeni alan listesinde Diksiyon yok: SORU §9. Okuma ve Yazı iki merdiven, yeni planda tek alan «Okuma ve yazı». |
| Reçete (drills + shape) | Plan motorunun «bugün ne» cevabı olarak taşınabilir; ders içeriği değildir. |

## 8. Ofis, XP/rütbe/rozet, sürtünme/goodhart/kalibrasyon

**Ofis (dokuz ajan).** Tanım `ESP/src/js/data/agents.js` (`AGENTS` 9, `COACH_IDS ['mnemosyne']`, `AGENDA_TYPES` 8: blocked, retention, balance, synthesis, deadline, gate, coverage, review); düzen `core/office.js` (1105 satır); tasarım `ESP/src/OFIS.md` (240 satır).

| Ajan | Görev | Bağlı merdiven |
|---|---|---|
| patron | Baş danışman, orkestrasyon | — |
| polyglot | Yabancı dil | lang |
| socrates | Felsefe ve diyalektik | philo |
| maestro | Müzik ve gitar | music |
| demosthenes | Diksiyon ve hitabet | diction |
| aristoteles | Derin okuma | reading |
| montaigne | Yazı ve üslup | writing |
| herodot | Tarih ve kaynak eleştirisi | history |
| mnemosyne | Hafıza ve tekrar koçu | — |

| Parça | Nerede | Ne | Öneri |
|---|---|---|---|
| Ilke «kural motoru otoritedir» | `OFIS.md:63` | sayı motordan, karar `Planner.nextAction`'dan, gündem `Office.agendaCandidates` puanından; model yalnız yorumlar | KING'e aynen taşınır (plan kuralı «sayılar koddan, model açıklar» ile aynı) |
| Brifing, masalar arası devir, çelişki önceliği, çıktı denetimi, toplantı, haftalık rapor | `OFIS.md` başlıkları 84-237; `core/office.js` | ajan başına rapor (JSON) → model → cümle | KING (bağlam kurucu + tek sağlayıcı); dokuz kişilik ofis ARŞİV |
| Ofis › Bu hafta | `screens/meeting.js` | 7 kutu (Tutanak … Hafta) | KING («yönet» niyeti) / ARŞİV |
| Ofis › Uzmana sor + Masalar | `screens/team.js`, `screens/office.js:117` | ajan seç, sohbet; uzman masaları katlı | KING |
| Uzman masası (her disiplinde) | `core/parts.js:962`, `core/desk.js` | 5 kat: Uzmanla konuş, Ekler, Hatırlatma, Öneriler, Bakım | SİL (parçalar §2b'deki yerlere) |
| Ofis ayarı | `core/office.js:91` `defaults` | `provider, model, perAgent{}, autoBriefing, temperature 0.4, otomatikUygula` | KABUK (çekirdek: model geçidi tek ayar) |
| «Sempozyum» | `core/office.js:16`, `core/kingarac.js:33-67` | ayrı bir özellik değil: Felsefe ekranının (`screens/symposium.js`) eski adı; King aracı `esp_argumanlar` tezleri okur | ad temizliği (tek ad: Felsefe › tezler) |

**XP / rütbe / rozet.** `core/xp.js`, `core/basarim.js`, `core/perde.js` `brand/seviye/`'den üretilmiş kopyalardır; kademe tablosu `data/kademeler.js` (`LIFEOS.SEVIYE_SURUM 4`, «altı kademe; beşi noktalı, altıncısı sonsuz», `BASAMAK_SAYISI 3`), rozetler `data/basarimlar.js` (`BASARIM_SURUM 1`). Depo: `seviye`, `basarim` (§6). Ekran: Ayarlar › Rütbe (`screens/rutbe.js`, 1099 satır, 5 sekme). Rütbe perdesi: `perde.js` (localStorage `lifeos.perde.ses`, `lifeos.perde.kutlama`). Kullanan: `rutbe.js, today.js, beacon.js, ui.js, app.js`. Uyarı: ESP'de iki ayrı «kademe» dili var: merdiven kademesi (Temas…Üstat, ölçülmüş üretim, §7) ve XP kademesi (`kademeler.js`). Plan «alanın kendi XP'si yok» der; sistem geneli XP için karar sahibinde (SORU).

**Sürtünme / Goodhart / kalibrasyon / sinyal.** Hepsi yalnız Analiz ekranında ve Bugün'ün sinyal satırında görünür (`grep ESP.Friction|Goodhart|Calib`: `analytics.js`, `signals.js`, `today.js` üzerinden).

| Katman | Dosya | Ne ölçer | Öneri |
|---|---|---|---|
| Sürtünme | `core/friction.js` | sistemi yönetmeye harcanan dakika / çalışma dakikası (bütçe 12 dk, eşik 0,34, 14 gün); depo `usage` | ARŞİV — sadeleşme bu sorunu kökten çözmeyi hedefliyor |
| Goodhart | `core/goodhart.js` | çaba arttı da sonuç durdu mu (iki pencere) | ARŞİV; fikri Yol kapısına «bilgi sınaması» olarak geçer (§7) |
| Kalibrasyon | `core/calib.js` | kendi tahmininle gerçek arasındaki hata; depo `forecasts` | ARŞİV |
| Sinyaller | `core/signals.js` | yukarıdakilerin satırları; depo `signals` | ARŞİV |
| Kanıt | `core/evidence.js` + `data/evidence.js` (17) | eşiğin dayanağı ve yetkisi | ARŞİV (Ayarlar › Genel › Dayanak'ta görünür) |
| EHS | `core/intellect.js` | hacim skoru | ARŞİV |

## 9. İlk 10 kaldırma/birleştirme adayı ve sahibine sorular

Sıra = sadeleşmeye katkı / risk oranı (tahmin). Satır sayıları §4'ten.

| # | Aday | Neden (dayanak) | Etki / risk | Önerilen hedef |
|---|---|---|---|---|
| 1 | Uzman masası (7 disiplinde ayrı, Ses'te 2) | §2b, §8; `core/parts.js:962`, `core/desk.js` (232), `studio.js:676-677` | her disiplin sekmesinden bir katman kalkar; `assets`, `reminders` koleksiyonları (§6, `state.js:979-1094`) taşınmalı, yoksa veri yetim kalır | SİL; sohbet/öneri → KING, ek → MOTOR:Not, hatırlatma → MOTOR:Plan |
| 2 | Dokuz ajanlı Ofis (Bu hafta, Uzmana sor, Masalar) | §8; `data/agents.js`, `core/office.js` (1105), `screens/meeting.js`, `team.js`, `office.js` | bir çekmece kalkar; «kural motoru otoritedir» ilkesi (`OFIS.md:63`) korunmalı; `office/chats/meetings/briefings` verisi arşive | KING (tek ajan) + ARŞİV |
| 3 | İki tekrar takvimi | §5 gözlem; `core/srs.js` (Leitner+SM-2) ve `brand/ortak/ogret.js:58` `ARALIK [1,3,7]` (`esp.ogret.tekrar`, `kingogret.js:41`) | aynı kavram iki ayrı vadeyle sorulabilir; birleştirmede `esp.ogret.tekrar` kayıtları karta göçmeli | birleştir → MOTOR:Tekrar |
| 4 | Kart kolaylığı iki sınır | `srs.js:50,69` 1.3–2.8, `state.js:598` 1.3–3.2 | küçük ama sessiz tutarsızlık: yüklemede 3.2'ye izin, hesapta 2.8'e kıstırma | birleştir → MOTOR:Tekrar tek sabit |
| 5 | Sürtünme / Goodhart / Kalibrasyon / Sinyal / EHS / Bakım denetimi | §5, §8; `friction.js` 287, `goodhart.js` 375, `calib.js` 374, `signals.js` 296, `audit.js` 657, `intellect.js` EHS 51-149 | ~2.000 satır + ~110 test (§5 sayıları) yalnız Analiz ve Bugün sinyal satırında görünür; kaldırınca Analiz ekranı boşalır (bkz. 6) | ARŞİV; Goodhart fikri Yol'a «bilgi sınaması kapısı» olarak |
| 6 | Analiz ekranı | §2c; `screens/analytics.js` | alanların İlerleme sekmeleriyle aynı veriyi ikinci yerde gösterir («bir özellik bir yer»); tek sistem panosu istenirse kalabilir | birleştir → alan İlerleme'si + MOTOR:Ölçüm (SORU 4) |
| 7 | XP / rütbe / rozet katmanı | §8; `rutbe.js` (1099), `xp.js`, `basarim.js`, `perde.js`, `xpsayim.js`, `basarimsayim.js`; 152 test (§5: 110+42) | merdiven kademesiyle (Temas…Üstat) çakışan ikinci «kademe» dili; `today.js, beacon.js, ui.js, app.js` kullanıyor, söküm dokunuşu geniş | SORU 3; kalırsa sistem geneli tek yerde (`brand/seviye`), ESP ekranı SİL |
| 8 | Öğrenme sayfasının Kütüphanem'de olması + Konular/Öğren sekmeleri | §2c (`ogrenme.js`), §2a her disiplinin Öğren sekmesi, §3 | aynı konu iki yerden açılıyor; taşıma riski düşük (ortak `ogrenmotor.js` zaten var) | birleştir → her alanın kendi öğrenme sayfası (MOTOR:Yol) |
| 9 | Not benzeri altı ayrı koleksiyon (`notes`, `args`, `drafts`, `assets`, Hata günlüğü, `meta/anlatim`) | §2a (Felsefe Tezlerim, Okuma Not, Yazı Taslaklarım), §6 | not motoru tek yerde olur; göç her koleksiyonun şemasını ister (§6: yalnız `cards`/`days` şeması okundu) | birleştir → MOTOR:Not (tipli not: tez, taslak, alıntı, ek) |
| 10 | Statik tablo «araçlar» + 11-13 araçlı sekmeler | §2a: `EAR_DRILLS/INTERVALS/CAGED/SIGHT_READING` (`studio.js` 166-198), `reading_method.js`, `rhetoric.js`, Tarih › Olaylar 11 araç, Okuma › Not 13 araç | sahibinin «yığın» şikâyeti (§2a Müzik satırı); içerik silinmez, ders içine taşınır | birleştir → ALAN ders içeriği; araç dersin içinde açılır |

Kapsam dışı bıraktım (tahmin: sonra): «Sempozyum» ad temizliği (§8), HKM'den içerik isteme düğmelerinin (Ünite iste, Belge iste, Paket iste, Okuma listesi iste) MOTOR:Arama'da tek düğmeye inmesi (§2a).

**Sahibine sorular**

| # | Soru | Neden önemli |
|---|---|---|
| 1 | Diksiyon yeni alan listesinde yok: ayrı alan mı, Müzik'le «Ses» alanı mı, kaldırılsın mı? | 1 merdiven (11 kapı), 9 konu, `recordings` koleksiyonu ve Ses sayfasının yarısı buna bağlı (§2a, §3, §7) |
| 2 | Okuma ve Yazı tek alan «Okuma ve yazı» olunca iki merdiven tek merdivene mi iner, alan içinde iki yol mu kalır? | merdiven kapıları ve `reading`/`writing` metrikleri buna göre birleşir ya da kalır (§7) |
| 3 | XP/rütbe/rozet sistem genelinde kalsın mı, tamamen kalksın mı? | 1099 satırlık ekran + 152 test; merdiven kademesiyle iki «kademe» dili var (§8) |
| 4 | Ayrı bir Analiz/sistem panosu istiyor musun, yoksa her alanın İlerleme'si yeter mi? | Aday 5 ve 6'nın kaderi buna bağlı |
| 5 | Dokuz ajanlı ofis tamamen King'e mi iniyor, «uzman sesi» (Sokrates, Herodot…) King içinde bir kişilik olarak kalsın mı? | `agents.js` koç adları merdivenlerde `coach` alanı olarak da geçiyor (§7); ses/ton kararı King tasarımını etkiler |
| 6 | Kapıların çoğu hacim ölçüyor (kart sayısı, dakika). Basamak geçişine bilgi sınaması (Soru motoru) zorunlu eklensin mi? | Yol motorunun «üstatlık» tanımı değişir; bugünkü kademeler yeniden hesaplanır (§7) |
| 7 | 68 öğrenme kartının hepsi `ready_for_app:false`. Ders içeriğini kim yazar/onaylar (sen, King, ofis turu)? | sıralı ders yolu bugün veri olarak yok (§3); içerik üretimi en uzun iş kalemi (tahmin) |
| 8 | Dil: 8 dilin hepsi mi, yalnız en/de mi destekli kalsın? | ünite ve tohum deste yalnız en/de (§3); 6 dil için içerik borcu doğar |
| 9 | Eski veriler (ofis sohbetleri, tahminler, sinyaller, XP defteri) yeni tek depoya taşınsın mı, yalnız arşiv dosyası olarak mı saklansın? | göç işinin büyüklüğü; `exportAll` biçimi okunabilir kaynak (§6) |
| 10 | Kötü gün modu, dünün aynısı, süreölçer gibi küçük yardımcılar yeni Plan/Kayıt motorunda kalsın mı? | küçük ama günlük kullanılan özellikler olabilir; kullanım verisi göremedim (tahmin) |

**Göremediklerim**

- Gerçek kullanım verisi: hangi araç/sekme ne sıklıkla açılıyor (sahibinin cihazındaki `esp.v1.<profil>` okunmadı).
- `cards`/`days` dışındaki koleksiyonların alan alan şeması (§6 notu).
- `hedefplan.js`, `komut.js`, `inceleme.js`, `xpsayim.js`, `basarimsayim.js` ve `ui/utils/h/memo` testleri (§4, §5).
- ESP dışı modüllerin (`brand/ortak`, `brand/seviye`) aynı parçaları ne kadar kullandığı; aday 3, 5 ve 7'nin başka modülde kırdığı yer bu raporda sayılmadı.
- `office.js` içindeki model çağrılarının maliyeti/sıklığı.
