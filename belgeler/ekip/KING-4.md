# King 4.0 · Tek ajan, bütün sistem

Depo sahibi (2026-11-01): «arayüz çok kaliteli oldu ama bazen sadece King'i
kullanarak bunları yapacağız; King'e her alanda devasa bir güncelleme, çok daha
AGI gibi olsun; saf verimlilik, saf altyapı».

Hedef cümlesi: **LifeOS'ta ekranla yapılabilen her şey King'e söylenerek de
yapılabilsin; King planlasın, araç kullansın, sonucu doğrulasın, hatırlasın ve
gerektiğinde kendisi başlasın.** AGENTS §1 aynen kalır: sayıyı kod üretir, model
cümle kurar; uydurma sayı yok.

## Bugün nerede (ölçüldü)

| Parça | Durum | Sorun |
|---|---|---|
| `brand/ortak/king.js` | 6.840 satır, tek dosya | her değişiklik bütün dosyayı okur; yavaş ve pahalı |
| Yönlendirme | ≈184 düzenli ifade (regex) yolu | yeni cümle kalıbı = yeni regex; ölçeklenmez |
| Araçlar | `arac.js` + üç `kingarac.js` ≈ 50 araç | modüllerin yaptığı işin küçük bir kısmı; ekranda olup King'de olmayan çok iş var |
| HKM çekirdeği | 80+ dosya, ≈30 bin satır | ekip, görev, beceri, söz, araştırma var ama tek bir ajan döngüsünde birleşmiyor |
| Hafıza | `memory.py` (382 satır) + sohbet geçmişi | kişi hakkında ne bilindiği tek yerde değil, unutturulamıyor |
| Kendiliğinden davranış | `kendiliginden.py` 18 satır | King neredeyse hiç kendisi başlamıyor |
| Ölçüm | birim testleri var, King doğruluk ölçüsü yok | «King daha akıllı oldu mu?» sorusunun cevabı yok |

## Yedi aşama

### A · Altyapı (önce bu; geri kalan her şey buna dayanır)

1. **king.js'i böl.** Çekirdek (durum, yönlendirme), görünüm, kartlar, ses,
   araçlar, devrim bölümleri ayrı dosyalara. Davranış değişmez; 3.481 satırlık
   `king.test.js` aynen yeşil kalır. Kazanç: her tur daha az token, daha hızlı.
2. **Tek yetenek kaydı.** Her modül ekranındaki her okuma ve yazma işi tipli bir
   araç olur (`arac.js` biçimi: ad, JSON şeması, oku/yaz). Kapsam testi: modülün
   eylem listesinde olup araç kaydında olmayan iş varsa test kırmızı. Hedef:
   ekranda yapılan işin %100'ü King'de.
3. **Regex'ten niyet çözücüye.** 184 yol silinmez, aynı araçları çağıran
   «hızlı yol» olur; eşleşmeyen her cümle modelin araç seçimine gider.
   Böylece yeni cümle kalıbı için kod yazmak gerekmez.
4. **Ajan döngüsü (HKM).** Anla → planla → araç çağır → sonucu gözle →
   doğrula → yanıtla. Adım ve süre sınırı var. Yazan her araç onay ister ve
   **geri al** kaydı bırakır. Mevcut `gorev.py`, `ekip.py`, `is_kuyrugu.py`
   bu döngünün parçası olur, yeni bir sistem kurulmaz.
5. **King sınavı (eval).** 300 gerçek Türkçe cümle ve her biri için beklenen
   araç ve argümanlar. CI'da koşar; yerel model ve bulut ayrı puanlanır
   (doğruluk, gecikme). Her King değişikliği bu puanı düşürmemek zorunda.
6. **Model merdiveni.** Kolay iş yerel gemma4'e, zor plan buluta gider;
   Gemini kotası dolunca ofisteki kota senaryosu burada da geçerli. Mevcut
   `motor.py`/`seviye.py` kullanılır.

### B · Hafıza ve kişi modeli

- Üç katman: **olanlar** (ne zaman ne yaptın), **bilgiler** (seninle ilgili
  doğrular: sınav tarihi, alerji, hedef), **beceriler** (öğrettiğin yöntemler;
  `beceri.py` zaten var).
- Arama gömme ile yapılır (`qwen3-embedding` kurulu). Her bilginin kaynağı ve
  tarihi tutulur.
- «Benim hakkımda ne biliyorsun» ekranı: gör, düzelt, unuttur.

### C · Kendiliğinden King

- Modüller olay yayınlar (`kutu.py` var): uyku düştü, sınava 30 gün kaldı,
  plan maddesi kaçtı, tekrar günü geldi.
- Kurallar olayı «King başlasın mı?» sorusuna çevirir; günlük **bölme bütçesi**
  ve sessiz saatler var. King bildirimle, sesle ya da gün açılışında konuşur.
- Her kendiliğinden mesajın altında «neden şimdi?» satırı (hangi olay, hangi
  sayı) durur.

### D · Her alanda öğretmen ve koç

AYS, SPİ ve ESP'deki öğretme parçaları (ders kartı, aralıklı tekrar, derse
çevir) **tek öğretme motoru** olur: yanılgıyı teşhis eder, Sokratik anlatır,
1/3/7 günde benzer soru sorar ve kavramı kapatır. Fotoğraftan soru, PDF'ten
ders ve yürürken sesli ders de aynı motoru kullanır.

### E · Dünyayı ve bilgisayarı kullanmak

- Araştırma (web ve YouTube, kaynaklı) zaten var; ajan döngüsünün bir aracı olur.
- Bilgisayar araçları: dosya ve klasör açmak, uygulama başlatmak, ekrandaki
  metni okumak. Her biri ayrı izinle verilir.
- Telefon (K4): dışarıda topla, evde eşitle; King'in telefona mesaj ve sesli
  özet göndermesi.

### F · Arayüz: King komuta merkezi (görsel, Claude yapar)

- Tek giriş kutusu; sonuçlar kart olarak gelir.
- **«King ne yaptı» zaman çizgisi:** her eylem, kaynağı ve tek tıkla geri al.
- Plan çalışırken adımlar canlı görünür; onay kartları tek dokunuşla verilir.

### G · Güven (her aşamaya gömülü)

Her eylem günlüğe yazılır, açıklanabilir («neden») ve geri alınabilir. İzinler
üç kademe: okuma serbest, yazma onaylı, dış dünya (mesaj, bilgisayar)
ayrıca izinli.

### O · Sistem optimizasyonu (King'le birlikte, depo sahibi 2026-11-01)

Ölçmeden düzeltme yok: her madde önce bugünkü sayıyı ölçer, sonra düzeltir.

- **Sesle veri girişi:** konuşmanın bitişinden kaydın ekrana düşmesine kadar
  geçen süre ölçülür (Whisper, ayrıştırma, onay). Hedef 1,5 saniyenin altı.
  Kısa komutlar (örneğin «45 dk yürüdüm») model çağrılmadan yerelde ayrıştırılır.
- **AI kullanımı:**
  - Aynı soruya önbellek.
  - Sabit sistem metni bir kez gönderilir, buluttaki prompt önbelleğinden okunur.
  - Bağlam bütçesi rol başına sabittir.
  - Her model çağrısı süre, token ve model adıyla `ai_olcum` günlüğüne yazılır;
    «King bugün ne harcadı» kartı bu günlükten çıkar.
- **Ollama:** sıcak tutma, iki modelin birlikte yüklü kalması, gereksiz düşünme
  tokenı (`think`) kapatma.
- **Arayüz:** ilk açılış süresi ve büyük CSS hacmi (akıcılık ölçümünden kalan
  açık); tembel yükleme.
- **HKM:** başlangıç süresi, veritabanı indeksleri, yavaş uç noktaların listesi.

### H · Kullanıcıya doğrudan yardım eden yenilikler

- **Tek dokunuşla her yerden kayıt:** kısayol tuşu ya da telefon widget'ı
  açılır, söylenir, kayıt doğru modüle düşer.
- **«Unuttuğun ne var?»:** gün sonunda eksik kayıtlar (öğün, uyku, çalışma)
  tek kartta toplanır, sesle tamamlanır (`eksik.py` var).
- **60 saniyelik sabah brifingi:** sesli, bugünün planı, dünün tek bulgusu,
  tek öneri.
- **Haftalık otomatik rapor:** üç modülden kodun ürettiği sayılar, tek sayfa,
  King'in tek cümlelik yorumu.
- **Akıllı hatırlatma:** sabit saat yerine alışkanlığın gerçek saatine göre;
  kaçırılınca ertesi gün yumuşak tekrar.
- **Hata affı:** yanlış kayıt «geri al» ya da «onu 30 dk yap» diye düzeltilir.

## Sıra, iş bölümü, ölçü

| Tur | İş | Kim |
|---|---|---|
| 1a | A1 king.js bölme + A5 King sınavının ilk 100 cümlesi | Claude (kırmızı) |
| 1b | O: HKM tarafı ölçüm ve optimizasyon (ses, AI, Ollama, uç noktalar) | Claude; king.js'e dokunmaz |
| 2 | A2 yetenek kaydı: SPİ, AYS, ESP araçları + kapsam testi | ofis (sarı), kabul testlerini Claude yazar |
| 3 | A3 + A4 niyet çözücü ve ajan döngüsü, geri al | Claude |
| 4 | A6 model merdiveni, sınav 300 cümleye | Claude + ofis |
| 5 | B hafıza | Claude çekirdek, ofis ekran mantığı |
| 6 | C kendiliğinden King | Claude kurallar, ofis olay yayıncıları |
| 7 | D tek öğretme motoru | Claude |
| 8 | E bilgisayar ve telefon + F arayüz | Claude |

Her tur **yeni oturumda** başlar ve bu belgeden yürür.

**Başarı ölçüleri:**
- King sınavında araç seçimi ≥ %90.
- Ekran işlerinin %100'ü King'den yapılabiliyor.
- Yazan eylemlerin %100'ü geri alınabiliyor.
- İlk söz 1 saniyenin altında.
- king.js'te tek dosya 1.500 satırı geçmiyor.

## Tur 1a sonuçları (2026-11-01)

**A1 · bölme (2eb223f4).** `brand/ortak/king.js` sekiz parça: `king.js` (çekirdek,
1.263 satır), `king-ses`, `king-kayit`, `king-gorunum`, `king-kart`, `king-arac`,
`king-devrim`, `king-yol` (son yüklenir; `kur` ve dışa açılan nesne). En büyük
dosya 1.263 satır. Parçalar arası okunan adlar ve ortak durum
`window.LIFEOS.KING_IC`'te (`KI.ad`); kural `king.js` başında. Dışa açılan King
nesnesi aynı (193 anahtar). Testler: AYS 3136, SPI 2892, ESP 2598, hepsi yeşil.

**A5 · King sınavı, ilk 100 cümle.** `node tools/king_sinav.js` (cümleler
`tools/king_sinav.json`). Her modülün kendi sayfası tarayıcıda açılır, cümle
`KING.isle`'ye verilir ve **ilk karar** yakalanır: sayfaya gitme, veri önizleme,
araç seçimi, Merkez'e sorma ya da yerel araç kutusu. Hiçbir şey yazılmaz;
HKM bağlı sayılır ama Merkez çağrısı yakalanır. Yani bu puan **istemcinin
yerel yönlendirmesini** ölçer; modelin araç seçimi (HKM) henüz ölçülmüyor.

Bugünkü puan: **59/100 (%59)**. AYS 19/32, SPİ 15/30, ESP 11/22, genel 14/16.
Yerel karar süresi ortanca 1 ms. Hedef ≥ %90. İki koşuda aynı sonuç çıktı.

Kayıpların dökümü (41):

| Kayıp türü | Sayı | Örnek |
|---|---|---|
| Okuma sorusu sayfaya götürülüyor (araç var) | 17 | «son denemelerim nasıl» → Deneme sayfası; `ays_denemeler` beklenir |
| Merkez'e düşüyor; yerelde araç ya da kayıt var | 9 | «kilom 78.4», «Suç ve Ceza'yı bitirdim», «4006381333931 barkodu ne» |
| Yanlış modüle gidiyor | 6 | SPİ'de «son bir haftada uykum nasıl» → AYS Hafta; ESP'de «… kart yap» → AYS Tekrar |
| Okuma sorusu kayıt sanılıyor | 3 | «yulafın besin değeri» öğün önizlemesi oluyor |
| Sohbet cümlesi sayfaya gidiyor | 3 | «bana motive edici bir şey söyle» → Bugün |
| Ödeme kilidi yanlış alarm | 1 | «yapılacak: fatura öde» ödeme sanılıyor |
| Diğer | 2 | «bana bir integral sorusu sor» sorma komutu sanılıyor |

Merkez'e düşen 9 cümleyi HKM'deki model doğru araca götürebilir; o zaman
tavan %68. A3 (niyet çözücü) bu tabloyu hedef alır: sayfa adı içeren soru
cümlesi önce araç kaydına, sonra sayfaya; modül adı geçmeyen cümle bulunduğu
modülde kalır.
