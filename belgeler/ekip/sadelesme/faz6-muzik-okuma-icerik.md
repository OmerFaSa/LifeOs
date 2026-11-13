# Faz 6 · Müzik ve Okuma-yazı 1. aşama içeriği

Tarih: 2026-11-13 · Dal: `sadelesme` · Yazan: model (ekip üyesi, içerik) · Commit yok.

## Özet
İki alanın 1. aşaması şemaya uygun yazıldı ve denetleyiciden temiz geçti. **Müzik**: 3 ünite, 9 ders, 31 ders alıştırması, 16 kapı sorusu, 13 kaynak. Ses adları ve perde → klavyede notalar (boş teller, bir telde nota, akordaki notalar) → majör/minör, beş açık akor, metronom. **Okuma ve yazı**: 3 ünite, 10 ders, 32 ders alıştırması, 16 kapı sorusu, 21 kaynak. Okumanın düzeyleri, gözden geçirme, okuma oturumu → kitabın konusu, ana düşünce, kendi cümlenle not → cümlenin öğeleri, açık cümle, paragraf, ilk taslak. Her öğe `taslak` / `yazan: "model"`, her kaynak `dogrulanmamis`, her ders kaynak dosyası ve satır aralığı gösteriyor. En önemli açık: **standart akort hiçbir kaynakta yazmıyor**; ders kataloğun akor tablarından çıkarıyor, sahip onayı gerekiyor. Duruş, pena ve akort yöntemi için kaynak yok, yazılmadı.

## Müzik

Dosya: `alan/muzik/asama-1.json` · aşama `muzik.1` «Sesler, klavye ve ilk akorlar».
Sayılar (denetleyiciden): 3 ünite, 9 ders, 47 alıştırma (ders alıştırması 31, bunun 8'i açık uçlu; ünite kapısı 12; aşama kapısı 4), 13 kaynak. Hepsi `taslak` / `yazan: "model"`, kaynaklar `dogrulanmamis`. Ünite kapısı eşiği 0,75, aşama kapısı 0,8 (Tarih/Dil ile aynı).

Sıra gerekçesi: sahibin sözü «gitarda klavyedeki notalar». Önce ses adları ve perde (sayı), sonra klavye (boş teller → bir telde nota → akordaki notalar), en son ilk açık akorlar ve metronom. Merdiven 1. basamak «El ve ses» (`curriculum.js` 198-204) ile ESP konu sırası (`topics.js` 161-172) bunu destekliyor. CAGED, gam pozisyonları, bareli akorlar sonraki aşamaya bırakıldı (yalnız F ve Bm, 6. tel notasını sınamak için kullanıldı, öğretilmedi).

| Ünite | Dersler | Kaynak |
|---|---|---|
| 1.1 Ses adları ve perde | On iki ses ve adları · Perde, yarım ses, oktav · Tel numaraları ve tab | `ESP/src/js/data/guitar_tabs.js` 13-46; G: `gitar_armoni_ve_diksiyon_ustalik.md` 13-35, 57-67; G: `akustik_fizigi_…md` 38-56; `eartraining.js` 54-62 |
| 1.2 Klavyede notalar | Boş tellerin notaları · Bir telde nota bulmak · Akordaki notaları okumak | `veri/taslak/esp/gitar_akor_gam_katalogu.jsonl` 1-7; `gitar_armoni_…md` 57-67 |
| 1.3 İlk akorlar ve düzenli vuruş | Majör ve minör üçlü · İlk beş açık akor (C, Am, G, Em, D) · Metronom, ölçü, ısınma | `gitar_armoni_…md` 13-29, 71-78; katalog 1-5; `guitar_tabs.js` 1-9, 65-114 |

**Önemli:** standart akort (boş teller E A D G B E) hiçbir kaynakta açıkça yazmıyor (gemini-data, `ESP/src/js/data`, `veri/` içinde arandı). Ders 1.2.1 bunu katalogdaki akor tablarından adım adım **çıkarıyor** (boş çalınan tel akorun notalarından biri olmalı → kesişim); çıkarım derste «(model)» diye işaretli ve ders `not` alanında yazılı. Katalog da `dogrulanmamis`. Sahibin onayı gerekir. Modelin hesap ve bağlantı cümleleri metinde «(model)» diye işaretli. Aralık tablosundaki şarkı örnekleri ve duygu adları ses olmadan sınanamadığı için derse alınmadı.

## Okuma ve yazı

Dosya: `alan/okuma/asama-1.json` · aşama `okuma.1` «Etkin okuma, cümle ve paragraf».
Sayılar (denetleyiciden): 3 ünite, 10 ders, 48 alıştırma (ders alıştırması 32, bunun 10'u açık uçlu; ünite kapısı 12; aşama kapısı 4), 21 kaynak. Eşikler 0,75 / 0,8. Kanıt işi: gözden geçirme notu + tek cümlelik «ne hakkında» + üç not + bunlardan kurulmuş tek paragraf (okuma merdiveni 1. basamak kanıtı «üç cümleyle özet» ile yazı 1. basamağını birleştirir).

Sıra gerekçesi: sahibin sözü «etkin okuma, cümle ve paragraf kurmak». Okuma → anlama/not → yazma sırası, her ünite öncekine önkoşullu. Sentopik okuma, Minto/MECE, deneme planı, IMRaD, safsatalar, üslup ileri aşamalara bırakıldı.

| Ünite | Dersler | Kaynak |
|---|---|---|
| 1.1 Etkin okumaya başlamak | Okumanın dört düzeyi · Gözden geçirme · Bir okuma oturumu | G: `ESP/okuma_ve_sentez/adler_…md` 30-43; `reading_method.js` 1-26, 60-76; `curriculum.js` 308-314 |
| 1.2 Anlamak ve kaydetmek | Kitap ne hakkında? · Ana düşünceyi bulmak · Kendi cümlenle not | `adler_…md` 47-69; `reading_method.js` 28-58; G: `AYS/tyt/tyt_paragraf_12_…md` 19-54; G: `AYS/tyt/tyt_turkce_paragraf_algoritmalari_…md` 11-16; G: `retorik_kompozisyon_…md` 42-52; G: `deneme_akademik_…md` 73-74 |
| 1.3 Cümle ve paragraf kurmak | Cümlenin iskeleti · Açık cümle (Orwell) · Paragrafı kurmak · İlk taslak ve ilk düzeltme | G: `AYS/tyt/tyt_turkce_dil_bilgisi_…md` 60-77; G: `akademik_makale_…md` 36-46, `retorik_…md` 54-62; `tyt_paragraf_12_…md` 19-40, 67-95, 148-160; `tyt_turkce_paragraf_…md` 60-65; `rhetoric.js` 65-90; `curriculum.js` 363-369 |

Not: verilen ESP kaynaklarında cümle öğeleri ve paragraf yapısı yok; bu yüzden `C:\gemini-data\AYS\tyt` altındaki üç Türkçe atlasından yalnız yapı bilgisi (öğeler, cümle türleri, paragrafın üç kolonu, ana düşünce, akış) alındı. Sınav taktikleri (şıkları önce okuma, ÖSYM soru kökleri) alınmadı. Bu dosyalar Akademik alanıyla ortak; Dil raporu da aynı ayrımı yapmıştı. Cümle örnekleri ve alıştırma metinleri modelin; derslerde «(model)» diye işaretli.

## Kaynaklar ve hatalar

Hiçbiri derse alınmadı.

### Müzik
- **Standart akort açıkça yok** (bkz. Müzik). Gitara özgü tek gemini dosyası (`gitar_armoni_ve_diksiyon_ustalik.md`) aralık/gam/mod/CAGED ile başlıyor; boş teller, tutuş, akort yöntemi yok.
- **Eşit temperamenti Bach'a bağlama** (`akustik_fizigi_…md` satır 52): «Wohltemperierte Klavier eseriyle zirveye taşınan sistem». Eser «iyi düzenlenmiş» akort içindir, eşit temperamentle aynı şey sayılması tartışmalı. Derste yalnız «oktav 12 eşit yarım tona bölünür» kaldı.
- **Kendi içinde çelişki** (`akustik_…md` satır 29): tınıyı belirleyen «yegâne unsur» harmoniklerin genliği deniyor; aynı dosya hemen sonra ADSR zarfını (satır 60) anlatıyor.
- **Abartılı nörobilim** (`ritim_matematigi_…md` satır 13-33): senkopun «dopaminerjik ödül» şeması, popüler müziğin 100-120 BPM'de toplanmasının «biyolojik rezonans sebebiyle» olduğu. Kaynak yok.
- **Şişirilmiş vaat** (`gitar_armoni_…md` satır 67): CAGED'i çözen gitaristin «klavyenin hiçbir yerinde kaybolmaz»ı.
- **Bağlama göre doğru iddia** (katalog satır 3): Sol majörü «dominant karakterde» diye tanımlıyor; bu yalnız Do majör tonunda geçerli.
- **Sabit eşik ile kişisel ölçüm gerilimi**: `curriculum.js` 204 kanıtı «60 BPM'de temiz geçiş» diye sabitliyor; `guitar_tabs.js` 1-9 «ilk tempo girilene kadar hiçbir eşik üretilmez» diyor. Derste kişisel ölçüm ilkesi kullanıldı, 60 BPM alınmadı.
- Katalogun kaynağı belirsiz («Klasik Müzik Teorisi & Guitar Fretboard Standartları»), `veri/taslak` içinde ve `dogrulanmamis`. Tablar elle kontrol edildi ve birbirleriyle tutarlı (çıkarım her teli tek bir notaya indiriyor).
- Aralık tablosundaki şarkı örnekleri (satır 18-29) ses olmadan sınanamıyor, alınmadı.

### Okuma ve yazı
- **«15 Altın Kural» başlığı, 11 kural** (`adler_…md` satır 47-69): başlık 15 diyor, liste 11'de bitiyor. Derste kural numaraları yalnız listedeki kadarıyla kullanıldı.
- **Uydurma oran** (`adler_…md` satır 43): «Anlamadığınız %30'a takılırsanız … %70'i de kaçırırsınız». Alınmadı. Süre de iki kaynakta farklı: Adler atlası 15-30 dk, `reading_method.js` 15 dk; derste ikisi de kendi kaynağıyla verildi.
- **Kesinlik dili**: Koestler'in yaratıcılığı «kanıtlar» (satır 104); El-Biruni'nin dünya yarıçapını «binde bir hata payıyla» ölçmesi (satır 92); Zeigarnik etkisinin «bilinçaltını gece boyunca kemirmesi» (satır 137). Alınmadı (zaten 1. aşama konusu değil).
- **Yanlış atıf** (`akademik_makale_…md` satır 42): «Omit needless words!» Orwell'in 3. kuralının içine konmuş; bu söz Strunk'a aittir (başlık «Orwell ve Strunk & White» diye ikisini birleştiriyor). Derste kural 3 alıntısız verildi.
- **Tırnak içinde uydurma görünen alıntı** (`retorik_…md` satır 64-66): Zinsser'e atfedilen «… dünya yazınının en büyük hastalığıdır … parazittir» cümlesi kaynaksız ve kitaptaki bilinen ifadeyle örtüşmüyor. Alınmadı.
- **Doğrulanamayan sayı**: Luhmann'ın «70 kitap ve 400 makale»si (`retorik_…md` satır 43). Alınmadı.
- **Uydurma olasılık** (`tyt_turkce_paragraf_…md` satır 13): kırılma bağlacından sonraki cümle «%90 ihtimalle ana fikirdir». Derste «çoğu zaman» dendi.
- **Doğrulanamayan köken iddiası** (`tyt_paragraf_12_…md` satır 165): atlasın «ÖSYM'nin son 10 yıllık … soru havuzunun çözümlemesiyle» yazıldığı.
- **Mutlak kurallar**: giriş cümlesinde gönderme sözünün «asla» bulunamayacağı (`tyt_paragraf_12_…md` satır 20, 71) sınav kuralı olarak doğru, yazı kuralı olarak fazla kesin. Derste kural olarak verildi ama «asla» düşürüldü.
- `rhetoric.js` satır 80 «Hedef yüzde yirmi» (kısaltma oranı) kaynaksız; alınmadı.

## Eksikler

### Müzik
- **Duruş, oturuş, pena tutuşu, akort yöntemi (alet/kulak)**: merdivende ve konu listesinde başlık olarak var (`curriculum.js` 198, `topics.js` 161-165), içerik hiçbir kaynakta yok. Kendi bilgimle doldurmadım. Sahip ya da kurum kaynağı gerekli; bu iş metinle değil gösterimle (video, fotoğraf) daha iyi öğretilir.
- **Ses yok**: aralık, majör/minör farkı ve akort dinleme ister; dersler öğrenenin kendi gitarına ve açık alıştırmalarına dayanıyor.
- **Konu listesindeki 8 açık akordan 3'ü (E, A, Dm) katalogda yok**; yalnız 5'i öğretildi.
- **Klavye şeması yok**: şema `motor`/kabuk tarafında bir görsel bileşen ister; şema JSON'da metin olarak tutulabiliyor, görsel tutulamıyor (şema sınırı).
- **Şema sınırı**: `tur` yalnız `secmeli | acik`. Beceri alanında «çal ve kaydet» gibi bir üretim türü (`calma`) yok; bu yüzden çalma işleri puanlanmayan `acik` alıştırma olarak yazıldı. Kapıda çalma kanıtı istenemiyor, yalnız bilgi soruluyor.

### Okuma ve yazı
- Okuma listesi düzeyleri (hangi kitapla başlanır) kaynakta yok; `edebiyat_kitap` atlasları ileri düzey eser çözümlemesi, 1. aşamaya alınmadı.
- Noktalama ve yazım kuralları (`tyt_turkce_paragraf_…md` 95-255) cümle kurmanın parçası ama sınav odaklı ve Akademik'le ortak; 2. aşamaya ya da Akademik'e bırakıldı.
- Yazı merdiveninin sayaçları (günde 200 kelime, 30 günde 1500) ölçüm ister; bu motorun işi, içerikte yalnız anıldı.

## Açık sorular

1. **Standart akort**: boş tel notalarını katalogdan çıkarmak kabul mü, yoksa bir kurum ya da kitap kaynağı (ör. bir gitar metodu) mı eklensin? Kaynak gelirse ders 1.2.1 sadeleşir.
2. **Duruş, pena, akort** nereden gelsin: sahibin çektiği kısa video ya da fotoğraf, dış kaynak bağlantısı, yoksa King taslağı?
3. Şemaya beceri alanları için puanlanan bir üretim türü (`calma`/`kayit`, sahip ya da öğretmen onayıyla) eklensin mi? Şu an çalma kapıya giremiyor.
4. Okuma-yazı için `AYS/tyt` Türkçe atlaslarını kullanmak doğru mu, yoksa cümle/paragraf temeli yalnız Akademik alanında mı dursun (Okuma oradan önkoşul alsın)?
5. Aşama adları ve id `okuma` uygun mu (plan `okuma-yazi` diyordu; görevde `okuma` verildi)?

## Doğrulama
- `python alan/denetle.py alan/muzik` → «Temiz · 1 dosya, 1 aşama, 3 ünite, 9 ders, 47 alıştırma, 13 kaynak» (çıkış 0).
- `python alan/denetle.py alan/okuma` → «Temiz · 1 dosya, 1 aşama, 3 ünite, 10 ders, 48 alıştırma, 21 kaynak» (çıkış 0).
- Kapı soruları ders alıştırmalarından ayrı yazıldı (denetleyici bunu sınamıyor, elle bakıldı). Nota hesapları (her tab, her perde sorusu) on iki ses dizisiyle elle yeniden hesaplandı.
- Dokunulan dosyalar yalnız `alan/muzik/asama-1.json`, `alan/okuma/asama-1.json` ve bu rapor; git işlemi yapılmadı.
