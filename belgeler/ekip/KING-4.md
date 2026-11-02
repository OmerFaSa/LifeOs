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

## Ölçüm 1b · HKM tarafı (2026-11-01)

Ölçümler canlı HKM'ye dokunmadan yapıldı: canlı veritabanının kopyası, 4299
portunda test HKM'si (Telegram, zamanlayıcı ve bulut anahtarları kapalı), bu
makinedeki Ollama 0.40.9 (RTX 4050, 6 GB) ve Whisper. «Önce» sütunu HEAD kodudur
(`ff9c80fd`); karşılaştırmalar aynı anda, yan yana koşuldu.

| Madde | Önce | Sonra | Ne değişti |
|---|---|---|---|
| 1 · `ai_olcum` günlüğü | 74 çağrının 0'ında süre var; yerel ses çağrısı deftere hiç yazılmıyor | her çağrıda `usage.ms`; Gemma ses çağrısı da yazılıyor | `butce.record(ms=)`, `ai._gonder` süreyi ölçer; `GET /api/ai_olcum?date=` (toplam + rol/model kırılımı: çağrı, giriş/çıkış/düşünme jetonu, USD, toplam/ortalama/en uzun ms) |
| 2a · aynı istek önbelleği | aynı istek ikinci kez 0,69 sn, yeni model çağrısı | 0,000 sn, 0 jeton | `ai.ask` içinde 120 sn, 64 kayıt; anahtar rol + model + sistem + bağlam + mesajlar; araç, görsel ve medya çağrısı saklanmaz |
| 2b · rol başına bağlam bütçesi | sınır yok (yalnız son 12 mesaj); en büyük `king` çağrısı 4.717 jeton, ortalama 2.295 | `king` 3.500 · `*.sohbet` 3.000 · `*.gorsel` 2.000 · `bam.*` 6.000 · diğer 4.000 (sistem + geçmiş, tahmini jeton) | `ai.butceye_sigdir`: en eski geçmiş düşer; sistem metni (ölçüler) ve son kullanıcı mesajı kırpılmaz |
| 2c · sabit sistem metni önce | araç turunda değişen hafıza satırının ardında 726 sabit harf; ikinci mesajda gemma4 istem süresi 152–161 ms | 0 harf; 41 ms | `sohbet.sistem_metni(ek=)`: hafıza adayı, derinlik, üslup ve araç talimatı değişen bağlamın önüne geçti. Düz sohbette kazanç küçük (ortak önek 1.082 → 1.228 harf); bulutta aynı önek Anthropic/Gemini önbelleğine girer |
| 2d · `think` · gemma4:e2b | bayrak verilmezse 275 çıktı jetonu, 2,35 sn | `reasoning_effort=none` ile 23 jeton, 0,30 sn, düşünme 0 | kod bunu zaten yapıyordu; canlı ölçümle doğrulandı |
| 2d · `think` · qwen3-vl:4b | 400 jeton düşünme, 8,4 sn, **boş cevap**; defterde `ays.gorsel` 4 çağrının 1'i başarılı | değişmedi | 4 yol denendi (`reasoning_effort`, `/v1` ve `/api/chat`'te `think:false`, `/no_think`); bu model düşünmeyi kapatmıyor. **Karar depo sahibinin:** görseli gemma4:e2b'ye vermek (görsel yeteneği var, zaten bellekte) ya da qwen3-vl'in instruct sürümünü indirmek |
| 3 · ses → metin (sıcak) | Gemma 4: 0,18–0,58 sn · Whisper turbo GPU: 1,8–2,9 sn (iç süre 1,44 sn'nin 0,93'ü model yükleme) | Gemma 4: 0,23–0,31 sn | değişmedi; hedef 1,5 sn altı sağlanıyor |
| 3 · ses → metin (soğuk) **darboğaz** | görsel model Gemma'yı VRAM'den itince ilk kayıt 13,9–20,1 sn | 1,85–3,9 sn; Gemma ısınınca yine 0,23–0,31 sn | `dinle.gemma_sicak` (`/api/ps`): Gemma bellekte değilse kayıt Whisper'la yazılır; arka planda önce görsel model boşaltılır, sonra Gemma ısıtılır (ikisi birlikte 6 GB'a sığmıyor; boşaltmadan denenince Gemma CPU'ya taştı, ikinci kayıt 25 sn sürdü) |
| 4 · başlangıç | 0,51–1,04 sn (iki tepeli) | 0,51–1,04 sn | darboğaz yok; dokunulmadı. İçe aktarmalar 0,67 sn |
| 4 · veritabanı indeksleri | 48 tablo, 24 indeks; en büyük tablo 78 satır; sık sorgular indeksli | aynı | ölçülebilir kazanç yok, indeks eklenmedi |
| 4 · yavaş uçlar (günlükteki sıklık × süre) | ilk üç: `teklifler/ays` (×3.612), `king/isler` (×2.392), `teklifler/esp`·`spi`: 3,4–5,0 ms; ortak neden: her istek yeni iş parçacığı → `db.connect` tüm şemayı yeniden kuruyor (3,55 ms) | `db.connect` 1,80 ms; bu uçlar 2,4–2,8 ms | `db.connect` şemayı süreç başına bir kez kurar; dosya silinmişse yeniden kurar. En yavaş tek uç `/api/ollama` 35–58 ms (Ollama'nın kendi listesi), dokunulmadı |

Testler: HKM 984/984 yeşil; 7'si yeni (`tests/test_olcum.py`).

Açık kalanlar:
- İstemci yoklaması: `teklifler/ays` tek günlükte 3.612 istek; sıklığı king.js tarafında düşürmek, sunucuyu hızlandırmaktan büyük kazanç (1a'nın alanı).
- Whisper'ı sıcak tutmak (`whisper-server.exe` klasörde var): yükleme payı 0,93 sn gider, soğuk kayıt ~1 sn'ye iner.
- qwen3-vl kararı (yukarıda).
- Kısa komutları modelsiz yerelde ayrıştırmak («45 dk yürüdüm») istemci tarafı, bu turda yapılmadı.

## Ölçüm 1c · Modüller ve `sistem/` (2026-11-01, tur 1c)

Ortam: bu PC, Playwright Chromium (başsız), modülün `dist/` tek dosyası yerel
`http.server`'dan (açılış) ya da `src/` (profil, iz). Gürültü: aynı anda iki
oturum daha test koşuyordu; milisaniye farkları ±%30–40 oynar, **sayılar
(olay, çağrı, test) oynamaz**. Tekrar: `node tools/olcum_modul.js <MOD>` (016).

### Bugün (ölçüldü)

| Ölçü | AYS | SPİ | ESP | Okuma |
|---|---|---|---|---|
| Açılış: ilk dolu çizim (dist, medyan 5) | 941 ms | 482 ms | 669 ms | `sistem/` kapısı dist'i bölüp arka planda derletir, gerçek açılış daha kısa |
| Açılış: HTML ayrıştırma / betik değerlendirme (iz) | 348 / 271 ms | 224 / 172 ms | 289 / 241 ms | betik = derleme + çalışma |
| JS / CSS hacmi (dist) | 6 230 / 1 320 KB | 4 597 / 1 280 KB | 4 911 / 1 302 KB | |
| Kullanılmayan: CSS (açılış + bütün rotalar) | %86 | %86 | %87 | bilinen «CSS hacmi» açığı (akıcılık ölçümü) |
| Kullanılmayan: adlı JS işlevi hiç koşmayan | %70 | %70 | %67 | |
| Büyük veri dosyalarının açılış payı | 22 ms (1,7 MB) | 6 ms | 14 ms | tembel yükleme **değmez** |
| Ekran çizimi, dokuz aylık veri (perfcheck, en ağır) | 15,8 ms office | 19,1 ms analytics | 20,4 ms office | bütçenin ≤ %23'ü: çizim JS'i darboğaz değil |
| Rota geçişi: stil hesabı / yerleşim (iz, AYS) | 7,1 / 5,3 olay, 11 / 3,9 ms | | | ilk zorlama `kabuk.esle`, ikinci `hareket.raf`; ikisi de yeni sayfanın zaten ödenecek ilk hesabı |
| Depolama: rota başına `getItem` / `JSON.parse` | 36 / 27 | 50 / 25 | 51 / 26 | en çok: `lifeos.hesap.sira.*` 9, `*.activeProfile` 5–6, `lifeos.hareket.hiz` 4–6 kez; toplam ayrıştırma 27 rotada ~3 ms → **darboğaz değil**, düzeltilmedi |
| Kayıt (SPİ, 270 gün): her kayıt bütün profili yazar | | 157 KB; 0,32 → 4,7 ms | | veriyle doğrusal büyür; anında yazma sözü (store.js) yüzünden bilinçli |
| Yerel biçim: `toLocaleString('tr-TR')` | 231 çağrı/tur | 116 (paylaşılan Intl) | 190 çağrı/tur | çağrı başına 11,8 µs; paylaşılan `Intl.NumberFormat` 0,7 µs |
| Ses bağlamı (ilk `AudioContext`) | 314 ms, bir kez | | | boşta önceden kurulur (2026-10-29 kararı: ilk tık 470–700 ms'ydi) |
| Birim testleri (runtests) | 46,5 sn | ~40 sn | 39,7 sn | AYS'de 32 test (> 300 ms) sürenin %54'ü: gerçek zaman beklemesi |
| Perde takımları (`perde.test.js`, 10 takım) | 8,9 sn | 8,9 sn | 8,9 sn | `bekle(520)`, haberci 3,3 sn |
| Testçi (ofis), iş başına | 7,3 dk (013) | | | üç modülün denetimleri sırayla 5,9 dk |
| `sistem/` testleri (8 betik) | 6,9 sn toplam | | | en uzun `telefon_test` 3,2 sn |
| `sistem/` kapı denetimi (`_guncel_dist`) | 0,9 ms/istek | | | imza önbellekli; darboğaz değil |
| Bir kez gözlendi | ESP «Defter Faz 1c» 25,7 sn, «Ses — radyo» 20,8 sn, 3 kırmızı | | | yük altında; ağ sahte, yeniden üretilemedi (sonraki iki koşu yeşil) |

### Kopya kod (ofis taraması `kopya` + elle doğrulama)

| Aile | Nerede | Fark | Karar |
|---|---|---|---|
| Tarih: `parse, isISO, diffDays, addDays, today, weekdayIndex, fmtDate…` (14 işlev) | üç `core/utils.js` | AYS/SPİ `parse('2026-02-31')` 3 Mart'a kayar, `relativeDay('bozuk')` «NaN gün sonra»; ESP önbellekli ve null döner, ama `fmtRange` bozukta istisna | **`brand/ortak/tarih.js`** (`LIFEOS.TARIH`), modüller ona bağlı (014) |
| Biçim: `median, round, clamp, sum, pct, fmtNet, fmtNum, fmtMin, fmtClock` | üç `core/utils.js` | birebir; yalnız SPİ paylaşılan Intl kullanıyordu | **`brand/ortak/bicim.js`** (`LIFEOS.BICIM`) |
| Depo: `store.js` (~500 satır) | üç modül | ad alanı ve yorum dışında aynı | sonraki tur: ortak depo fabrikası (veri katmanı; ayrı, testli tur) |
| `perde.js`, `harness.js` | üç modül | ad alanı | sonraki tur |
| `activeProfile` doğrudan okuma | `beacon.js`, `canli.js`, `foto.js`, `store.js` | aynı satır dört yerde | ucuz; `Store` üzerinden tek okuma önerisi |
| Ofisin iddiası «`sayi.js` `SAYI.sure()` aynı işi yapar» | | **yanlış**: `sayi.js`'te yok (kesinlik etiketi modülü) | elendi |

Katman düzeni: üç modül zaten `data/` (salt veri), `core/` (durum, depo, kural,
ortak kopyalar), `screens/` (ekran) düzeninde; yeni ortak çekirdekler
`core/`'a yayılır ve `utils.js`'ten önce yüklenir.

### Beş optimizasyon (önce → sonra)

| # | Darboğaz | Düzeltme | Önce | Sonra | Kim |
|---|---|---|---|---|---|
| 1 | Tarih işlevleri her çağrıda yeniden ayrıştırıyor (AYS, SPİ) | ortak önbellekli `tarih.js` | 300 bin `diffDays` + `weekdayIndex`: 1 050 ms | 600 ms | ofis 014 |
| 2 | Perde testleri gerçek zamanı bekliyor | test içi sahte saat | 8,9 sn/modül (26,8 sn) | 0,20 / 0,18 / 0,19 sn (0,57 sn) | ofis 015 |
| 3 | Testçi modülleri sırayla koşuyor | üç modül zinciri paralel (`evreler()`) | 7 dk (014, modül evresi ~6 dk) | 3,9 dk (016, modül evresi ~2,1 dk) | Claude |
| 4 | AYS/ESP her sayıda yeni `Intl.NumberFormat` | ortak `bicim.js`, paylaşılan biçimleyici | 11,8 µs/çağrı | 0,7 µs/çağrı | Claude |
| 5 | Toast testleri şeridin kendiliğinden kalkmasını bekliyor | doğrudan kaldır | «Geri al şeridi» 1 251 ms | 132 ms | Claude |

Toplam etki: AYS birim testleri 36,6 → 29,7 sn (test sayısı 3 143 → 3 147),
SPİ 29,8 sn, ESP 26,3 sn (2 903 ve 2 609 test); hepsi yeşil, entegre temiz.
Ortak altyapı: `brand/ortak/tarih.js` ve `brand/ortak/bicim.js` (üç `utils.js`'ten
23 işlev tek kaynağa; `tools/ortak.py --yay`), `tools/kabul_js.py` `utils.js`
istendiğinde çekirdekleri önüne ekler. Testçi'de geri dönüş: `OFIS_TEST_SIRALI=1`.

**Sonraki iş (ölçüldü, bu turda yapılmadı):** ortak testlerde kalan gerçek
beklemeler (gizle 1,2 sn, ayarlar 0,9 sn, animasyon 0,7 sn, köken kartı 3×0,5 sn,
terim ipucu 0,5 sn; modül başına ~5 sn); `store.js` üçlüsünün ortak depo
fabrikasına taşınması; CSS hacmi (%86 kullanılmıyor; akıcılık ölçümünde
yeniden yapılanma kararı depo sahibinde).


## Ölçüm 2c · Düzen ve kalan darboğazlar (2026-11-01, tur 2c)

Ortam: bu PC, Playwright Chromium (başsız). Açılış bu kez **gerçek kapıdan**
(`sistem/sunucu.py`'nin kendi sunucu sınıfı: bölünmüş betik, V8 önbelleği)
ölçüldü. 1c'deki 941 ms düz `http.server` içindi; gerçek yolda sıcak açılış
AYS 698, SPİ 413, ESP 526 ms. Milisaniyeler diğer oturumların yüküyle ±%30
oynar; bayt ve sayı (olay, test) oynamaz.

### Düzen

| İş | Önce | Sonra |
|---|---|---|
| Depolama katmanı | üç `store.js` (~520 satır, ad alanı ve metin dışında aynı; ayrışmaya başlamıştı) | `brand/ortak/depo.js` tek kaynak; her modülün `store.js`'i 18 satırlık ayar (anahtarlar, şema, yedek kimliği aynı) |
| Test saati | `perde.test.js` içinde 130 satırlık sahte saat | `brand/ortak/sahtesaat.js` (`LIFEOS.SahteSaat.saatle`), perde ve dört ortak test kullanır |
| Belgeler | 8 biten devir/plan belgesi güncellerin arasında | `belgeler/arsiv/`; atıflar yeni yolda; `belgeler/DIZIN.md` (32 belge, ofis 018) |
| `tools/` | 75 dosya tek düzlemde | `tools/DIZIN.md` sekiz bölüm (ofis 017); iki dizin kabul testi CI'da: sonradan eklenen dosya dizini kırmızı yapar |
| Kök çöpler | `sunucu.log` (eski kök sunucunun çökme günlüğü), `AYS/debug.log` (Chromium) | silindi (izlenmiyordu, kullanıcı verisi yok); `.gitignore`: `debug.log`, `HKM/config.json.*` (yerel anahtar taşır: **silinmedi**, yok sayılır) |
| Ölü dosya taraması (ofis `olu`) | | gerçekten ölü dosya çıkmadı. Ofisin «0 atıf» dediği `portreonar_test.py` `brand/medya/OKU.md`'de anılıyordu ve çalışıyor: CI'a eklendi. Üç modüldeki aynı yazı tipleri, `fonts.css`, `package.json` bilinçli (her modül tek başına derlenir); `SPI/tasarim/` tasarım geçmişi, `tools/veri_*` veri üretim betikleri: dokunulmadı |

### Kalan beş darboğaz (1c'den sonra)

| # | Darboğaz | Ölçüldü | Ne yapıldı | Sonra |
|---|---|---|---|---|
| 1 | Her açılışta satır içi CSS yeniden iniyor ve ayrıştırılıyor (kök sayfa `no-store`) | kök HTML 1 337–1 376 KB; sıcak HTML ayrıştırma SPİ 49, ESP 47, AYS 90 ms | `sistem/sunucu.py` büyük `<style>`'ı da sürümlü, kalıcı önbellekli `/dist-stil.css`'e ayırır (küçük stil yerinde; kaskad aynı) | kök HTML 35–39 KB; ayrıştırma SPİ 4, ESP 4, AYS 61 ms; AYS sıcak açılış 698 → 609 ms |
| 2 | Ortak testler gerçek zamanı bekliyor | modül başına gizle 1 212, köken kartı ~1 560, animasyon 703, terim ipucu 512 ms | ortak sahte saat | ~200 / ~550 / ~210 / ~3 ms (iframe'li köken testi ve ağ bekleyen ayarlar testleri gerçek saatte) |
| 3 | CSS hacmi | modül başına 1,30–1,34 MB, %86–87'si hiç kullanılmıyor; rota başına ~10 stil hesabı, 6–7 yerleşim (`tools/olcum_modul.js`) | aktarım ve ayrıştırma 1 numarayla önbelleğe alındı; stil hesabı yükü kaldı | ekran başına CSS bölme yeniden yapılanmadır (akıcılık ölçümü: on özellik CSS'ini kapatmak geçiş stilini yalnız %16 azaltıyordu); karar depo sahibinde |
| 4 | İlk ses bağlamı | `new AudioContext()` bir kez 314 ms, açılıştan sonra boşta | **düzeltilmedi**: dokunuşa ertelemek ilk tıkı 470–700 ms yapıyordu (2026-10-29 kararı); telefonda dokunuştan önce işaret yok | — |
| 5 | Her kayıt bütün profili yazar | SPİ 270 gün: 157 KB, kayıt başı 0,32 → 4,7 ms | **düzeltilmedi**: anında yazma sözü (veri kaybı yok); yol başına anahtar veri göçü ister. Depo artık tek dosya (`depo.js`): değişiklik bir yerde yapılır | — |

Ek: etkin profili doğrudan okuyan altı satır (`beacon.js` ×3, `canli.js`,
`foto.js`, `sorufoto.js`) artık `Store.activeProfileId()` ile okunabilir; işi
ölçülemeyecek kadar küçük, sonraki dokunuşta yapılır.

## Tur 2a · King sınavı ve yetenek kaydı (2026-11-01)

**Sınav, ilk 100 cümle: 59 → 95/100** (AYS 30/32, SPİ 29/30, ESP 20/22, genel 16/16;
yerel karar ortanca 1–2 ms). Yapılan (e98fad92 ve bu tur):
- **Hızlı araç yolu (A3'ün ilk adımı).** `arac.js`'te araç `kural(t, metin)` ile
  cümleden kendi parametresini çıkarabilir (besin, barkod, kelime kartı, alıntı,
  kitap bitirme, deftere not); `es` taşıyan okuma aracı «… aç» sayfa komutunu almaz.
  `king-yol.js` bu yolu sayfa ve veri tahmininden önce dener: okuma sorusu sayfa
  açmaz, sistemden cevaplanır; yazan araç yine önizlenir ve onay ister.
- Sayfa sözü geçen uzun cümle komut değildir: Merkez cevaplar, Merkez yoksa sayfa.
- Modül adı geçen sayfa komutu yalnız o modülde aranır («SPİ tahlil sayfasını aç»);
  «… ekranına dön» de komut. Sayfa eş sözleri: sempozyum, kronoloji, stüdyo, kütüphane, plan.
- «yapılacak: fatura öde» ödeme kilidine girmez; günlük cümleyle VKİ; «… sorusu sor».
- Koşucu düzeltmesi: karar **ilk olaydır** (Merkez'e sorulup cevap gelmeyince açılan
  sayfa yedektir); yetki eylemi yakalanır, uygulanmaz (sınav temayı değiştiriyordu);
  anlatımdaki kayıtlar kartı veri sayılır.

Kalan 5 (ilk 100): «bu hafta ara ver» AYS'nin kendi komut yolundan doğru öneriyi
önizliyor ama önizleme hangi eylem olduğunu taşımıyor (`veri` sayılıyor); «çalışma
süresini kısalt» dakikasız (sorulmalı); «kilom 78.4» ve «30 sayfa kitap okudum»
modül ayrıştırıcısının işi; «kitap ekle» adsız (sorulmalı).

**Sınav 300 cümle (ofis 020): 209/300 (%70).** AYS 44/95, SPİ 70/90, ESP 54/70,
genel 41/45. Yeni 200 cümle bilerek kalıp dışı yazıldı; kayıpların çoğu Merkez'e
düşen okuma ve plan cümleleri («hedef netlerime ne kadar yaklaştım», «bu haftanın
soru hedefini 500 yap»). Bunlar regex'le değil **modelin araç seçimiyle** çözülür:
cümle başına kalıp yazmak sınavı ezberlemek olur. Sonraki adım (tur 3): sınavı HKM'deki
modelin araç seçimiyle de koşmak (Merkez çağrısı yakalanmadan), yerel ve bulut ayrı
puan. Ayrıştırıcı açıkları (kilo, «1 buçuk saat», «45 dakika tarih çalıştım»)
modüllerin giriş işidir.

**A2 · yetenek kaydı: kapsam tam.** `node tools/king_kapsam.js` (eşleme
`tools/king_kapsam.json`): modülün `Model`'indeki her yazma işlevi ve gezinmedeki her
rota bir araca bağlı mı, araç kayıtta var mı; yeni yazma işlevi ya da ekran eşlemesiz
kalırsa kırmızı. Başlangıçta 72 eksik vardı; ofis 021 (AYS, 14 araç), 022 (SPİ, 14),
023 (ESP, 19) ile **47 yeni araç** girdi, test yeşil. Araç sayısı: AYS 58, SPİ 40,
ESP 46. «-: neden» ile dışarıda kalanlar yalnız iç işlevler (yedek zamanı, tercihler,
süreli deneme oturumu) ve içerik/ofis sayfaları. Yazan her araç önizler, onayla
uygular, `geriAl` döner ve modülün `kingarac.test.js`'inde geri almasıyla sınanır.

İncelemede (Denetçi «temiz» dediği hâlde) düzeltilen: tek net sayısından uydurulan
deneme testi, eski değeri yeninin üstüne yazan güncelleme, adı söylenmeden tek kaydı
silen arama (ESP'de 18 yer, SPİ'de antrenman), varsayılan uydurma (1 kg, «Dil» bölümü,
kuru fasulye, 1000 g), `eylem_kitap_ekle` ile çakışan ikinci kitap ekleme aracı,
10 işlevlik kopya arama. Ders: ajanın arama yardımcısı boş aramayı reddetmeli.

Ofisin eklediği okuma kalıbı «market bütçeme bakalım» sayfa komutunu yakaladı (sınav
1 puan düştü); «… bakalım» sayfa komutu sayıldı, puan geri geldi. Sınav son hâli:
ilk 100 cümle 95/100, 300 cümle 209/300.

## Ölçüm 2b · HKM tarafı (2026-11-01)

Aynı düzen: canlı veritabanının kopyası, bu makinedeki Ollama 0.40.9 (RTX 4050, 6 GB)
ve whisper.cpp CUDA. Görsel ölçümde 3 sentetik fiş ve 3 ekran görüntüsü, her istekten
önce gemma4 sohbet modeli sıcak (gerçek sıra: sohbet → görsel → sesli giriş).

| Madde | Önce | Sonra | Ne değişti |
|---|---|---|---|
| Fiş okuma (`para.fis`, toplam doğru) | qwen3-vl:4b 0/3 (hepsi boş cevap), 34–46 sn | gemma4:e2b 3/3, 0,9–2,2 sn | `ollama.GORSEL_TERCIH` önce gemma4:e2b; canlı ayarda `models.yerel.gorsel` = gemma4:e2b. qwen3-vl silinmedi |
| Ekran okuma (`ays.gorsel`) | 3/3, 11–20 sn | 2/3, 0,4–2,3 sn | kaçan: görseldeki denklemi çözme sorusu (C dedi, doğrusu B); okuma soruları doğru |
| Görselden sonra sesli giriş | 11–19 sn (qwen3-vl gemma4'ü bellekten atıyor) | 0,22–0,42 sn | GPU'da tek model kalıyor |
| Whisper, model sıcak | `whisper-cli` her kayıtta modeli yükler: 1,8–2,9 sn | 0,18–0,29 sn | `whisper-server` mikrofon açılınca (`/api/dinle/durum`) ya da ilk Whisper kaydında arka planda açılır, HKM yaşadıkça modeli GPU'da tutar (~1 GB); hazır değilse cli |
| Sesli giriş, Gemma soğuk | ~2,5 sn (1b) | 0,24–0,62 sn | soğuk Gemma'da kayıt sıcak Whisper'a gider, Gemma arka planda ısınır |
| A4 · araç adımı | soru başına 1 okuma turu | en çok 4 adım, 30 sn | sonuç turunda katalog yeniden sunulur (`dongu: {adim, gecen_ms}`); aynı (ad, param) ikinci kez çağrılamaz; sınırda son tur araçsız cevap. `dongu` yollamayan istemci bugünkü tek turu görür |
| A4 · geri alınabilen yazma | HKM'nin yazdığı para ve söz kaydı deftere girmiyor; geri alma yalnız «para geri al» (son kayıt) | para ve söz kaydı `eylem` defterinde, kayıt başına geri alınır | `core/eylem.py`; `GET /api/eylem` zaman çizgisi, `POST /api/eylem` modülün uyguladığı yazma ve tersi, `POST /api/eylem/<id>/geri` (HKM kaydını kendi geri alır, modül kaydında tersini döner) |

HKM testleri 992/992 (yeni: `test_dongu` 7, sıcak Whisper 1). Açık: istemci
(`king-arac.js`) henüz `dongu` yollamıyor ve uyguladığı yazmayı `/api/eylem`'e
bırakmıyor; 2a'nın araçları `geriAl` döndürüyor, bağlantı istemci işi. Ofis görevi
030 (`tools/hkm_olcum.py`, kabul testi kırmızı) kuyrukta; pilot durmuş ve bugünkü
8/8 iş sınırı dolu. Ölçüm betikleri depoda değil (030 bunu kalıcı yapar).

## Ölçüm 3b · Hafıza ve kendiliğinden King (2026-11-01, tur 3b)

Yeni sistem kurulmadı: hafıza var olan tabloları üç katmanda okur, kural motoru
`kendiliginden.py`'de büyüdü, mesaj bugünkü `king_bekleyen` yolundan gider.

| Madde | Önce | Sonra | Ne değişti |
|---|---|---|---|
| Hafıza katmanları | yalnız `memories` (bilgiler); olanlar ve beceriler ayrı yerlerde, «benim hakkımda» yalnız bilgileri listeliyor | `GET /api/hafiza`: bilgiler (kaynak, tarih), olanlar (eylem defteri + modül olayları), beceriler, adaylar | `memory.bildiklerim`; düzelt `POST /api/hafiza/<id>/duzelt` ve sohbette «#N düzelt: …» (modül kaydı: eskisi unutulur, düzeltilmiş HKM'ye yazılır, modülün sonraki görüntüsü diriltemez), unut `POST /api/hafiza/<id>/unut` |
| Arama (20 bilgi, kelimesini tekrar etmeyen 20 soru, gerçek qwen3-embedding) | kök eşlemesi: ilk sırada 6/20, ilk üçte 7/20 | gömme: ilk sırada 13/20, ilk üçte 18/20 | `memory.ara` (`GET /api/hafiza/ara?q=`); vektörler `hafiza_gomme` önbelleğinde (metin değişince yeniden), yedeğe girmez; motor yoksa köke düşer |
| Gömme süresi | — | sorgu ortanca 223 ms; ilk arama (20 bilgi gömülür) 3,4 sn; soğuk yükleme CPU 3,4 sn, GPU 31,9 sn | model CPU'da (`num_gpu: 0`, VRAM 0, RAM 1,3 GB) ve 60 dk sıcak: 6 GB'ta Gemma'yı itmez. Zaman aşımı 5 sn; hatadan sonra 60 sn denenmez, sohbet beklemez |
| İlgi eşiği | — | 0,35 | doğru eşleşmenin benzerlik ortancası 0,448 (en düşük 0,262), en yakın yanlışın 0,379 (en yüksek 0,635): eşik tek başına ayırmaz, bağlamda sıra + bütçe ayırır |
| A4 bağlamına hafıza | son 12 kayıt ya da kök eşleşmesi; boyut sınırı yok | ilgili bilgiler + King'e ilgili «olanlar» (en çok 3); rol bütçesinin beşte biri (`king` 700 jeton) aşılmaz | `memory.context(cfg, butce, soru)`; kesme sırası: ilgili bilgi > ilgili olan > yalnız yeni olduğu için gelen bilgi |
| Yedek | `eylem` defteri yedekte yok | `eylem` ve `king_olaylar` `BACKUP_TABLES`'ta (`yedek.py` tek dosya paketi dahil) | gömme önbelleği türetilmiş: yedeğe girmez |
| Kendiliğinden King | `kendiliginden.py` 18 satır, yalnız model anahtarı | kural motoru: `POST /api/olay` → karar (`basla · bekliyor · butce · tekrar · esik_alti · eksik_veri · kural_yok · bayat`) | sözleşme `belgeler/ekip/KING-OLAY.md` (3c buna uyar); 4 kural (sınav 30/14/7/3/1 gün, uyku 7 gün ≤ 28 gün − 0,75 ya da < 6 sa, plan ≥ 30 dk gecikme, tekrar ≥ 1); günde 3 mesaj (`king.kendiliginden_butce`), önce öncelikli olay; sessiz saat bildirim ayarından, boşsa 23:00–08:00 (arada gelen olay bekler, dakikalık tik sonra bakar); aynı modül+tür 20 saatte bir; mesajın `neden` alanı `{olay, kural, sayilar, cumle}`; `GET /api/king/kendiliginden` bekleyenler, bütçe, kararlar |

HKM testleri 1000/1000 (yeni `test_hafiza3` 8). Ofis: 050 (`tools/hafiza_olcum.py`, bu tablonun
tekrar ölçümü) ve 052 (uç nokta testleri + `HKM/MIMARI.md` bölümü) kabul testleriyle kuyrukta;
bugün pilot 8/8 dolu ve Antigravity kapalıydı. Açık: istemci `neden` alanını «neden şimdi?» satırı
olarak henüz göstermiyor (king.js, 3a/F alanı); «benim hakkımda» ekranı (F); modül olay yayıncıları 3c'de.

Tekrar ölçmek için: `python tools/hafiza_olcum.py`.

## Tur 3c · Olay yayıncıları, yardım verisi, kalan optimizasyon (2026-11-01)

Sayıyı modül kodu üretir (AGENTS §1); taşıyıcı yalnız biçimi denetler, kararı HKM verir
(`kendiliginden.py`, 3b). Kartların görünümü 3a'nın; bu tur yalnız veri ve taşıma.

| Parça | Ne | Nerede | Test |
|---|---|---|---|
| Taşıyıcı | `LIFEOS.OLAY.kur({ modul, hkm, uret }).baslat()`: açılışta boşta, 15 dk'da bir (gizli sekmede değil); biçime uymayan olay yola çıkmaz; kabul edilen kimlik iki gün cihazda tutulur, kabul edilmeyen sonraki turda yeniden; 4 sn zaman aşımı, HKM kapalıysa sessiz | `brand/ortak/olay.js` (yeni ortak dosya) | `olay.test.js` 5 sınama, üç modülde |
| Olaylar | SPİ `uyku_dustu` (ort7/ort28, yetersiz 28 gün «veri yok»), `plan_kacti` (saatli, tamamlanmamış, ≥ 30 dk); AYS `sinav_yaklasti` (`kalan_gun`), `tekrar_gunu` (vadeli kart); ESP `tekrar_gunu` | `X/src/js/core/kingveri.js` → `olaylar(simdi)` | kabul `tools/kingveri_{ays,spi,esp}_kabul_test.py`, modül `kingveri.test.js` |
| «Unuttuğun ne var?» | `kartlar.eksik(gun)`: Günü kapat'ın yazılmamış satırları `{ id, ad, tur }` | üç `app.js` (King kurulumu) | — (Günü kapat'ın kendi testleri) |
| Haftalık rapor | `kartlar.hafta(bitis)` → `{ bas, bit, satirlar:[{ id, ad, deger, birim, etiket, onceki }] }`; SPİ uyku/antrenman/hareket dk/öğün, AYS çalışma dk/soru/blok, ESP çalışma dk/oturum/gün; kaydı yok = «veri yok», tahmin dakika = «tahmin» | `kingveri.js` | kabul + modül |
| Akıllı hatırlatma | `kartlar.hatirlat(simdi)` → `{ anahtar, ad, kurulu, gercek, n, etiket, dun }`: son 14 günün gerçek saatlerinin ortancası (en az 3), dün yapıldı mı; SPİ hatırlatma işaretleri (ilaç adı gizli), AYS blok başlangıcı, ESP oturum anı | `kingveri.js` | kabul + modül |
| «Onu 30 dk yap» | `kartlar.sonKayit()` + `kartlar.duzelt(id, alan, deger)` → `{ ok, once, sonra, geriAl }`; modülün kendi kayıt işleviyle, sınırlı (1–600 dk), geri alınır | `kingveri.js` | kabul + modül |

İstemci sözleşmesi (3a için): `KI.ayar.kartlar.{eksik, hafta, hatirlat, sonKayit, duzelt}`; yazan tek
işlev `duzelt`, King onu önizleyip onayla çağırmalı ve `geriAl`'ı «Geri al»a bağlamalı.

**Kayıt maliyeti (2c'den ertelenen, ölçüldü, değiştirilmedi).** SPİ, gerçek yol (`Store.set`), dist:

| Veri | Depo | Yazma | Serileştirme | `setItem` |
|---|---|---|---|---|
| 270 gün (dokuz ay) | 125 KB | 1,1 ms (yük altında 3,5) | 0,6 ms | 0,45 ms |
| ~5 yıl (aynı kayıtlar ×7) | 861 KB | 38 ms (yük altında) | 16 ms | 18 ms |

2c'deki «4,7 ms» yük altındaydı. Dokuz aylık ufukta (AGENTS §5.3) yazma bir karenin %7–20'si: darboğaz
değil. Beş yılda yarısı serileştirme, yarısı `setItem`; yol başına serileştirme önbelleği yalnız ilk
yarıyı keser ve bellekte yerinde değiştirilip kaydedilmemiş nesnenin sonraki yazmada diske inmesi
davranışını değiştirir (veri katmanı riski); ikinci yarı ancak yol başına anahtar göçüyle gider.
Karar: dokunulmadı; `loadcheck` haftalık işinde izlenir.

**Test beklemeleri.** Ortak `ayarlar.test.js`'te Planlama'nın iki testi kayıt ertelemesini (350 ms)
gerçek zamanda 450 ms bekliyordu: sahte saat (erteleme sınırı da sınanıyor: 349 ms'de kayıt yok,
350'de tek kayıt). Modül başına ~0,9 sn. Kalan en yavaş takımlar King'in (SPİ: «sohbette kalır» 7,3 sn,
«düşünme derinliği» 6,1 sn): king.test.js 3a'nın alanı, ona bırakıldı. Hesap'taki 400 ms perde beklemesi
gerçek zamanda kurulan yoklamaya bağlı: sahte saate alınamaz, kaldı.

**Ofis.** 040 (AYS), 041 (SPİ), 042 (ESP), üçü `flash`, kabul testleri önceden yazıldı (kırmızıydı),
CI'da. 041'de Denetçi iki bulgu buldu (süresiz antrenman «0 dk ölçüldü», geri alma `null` yerine 0
yazıyordu), son incelemede bir üçüncüsü (son kayıt 0 dk); 040'ta Denetçi «temiz» dedi ama son
incelemede iki bulgu çıktı (bozuk bitiş tarihinde `while(true)` sonsuz döngü, kayıt hatasında bellek
geri alınmıyordu); 042 temiz. Üçü düzeltildi, sınandı, birleşti. Yan iş: `tools/DIZIN.md`'de önceki
turlardan kalan 11 eksik araç (dizin kabul testi CI'da kırmızıydı) tamamlandı.

Açık: kartların görünümü ve «neden şimdi?» satırı (3a); `plan_kacti` yalnız SPİ'de (AYS blokları
saatsiz, ESP planı gezinme sırası); olayların uçtan uca sınaması süreç içinde (`tools/king_olay_uctan_test.py`: modülün gerçek olayı → `olay.js` biçimi → HKM `POST /api/olay`, CI'da); gerçek HTTP ve sekme turu entegre testinde yok.

## Tur 3a · Niyet çözücü, «King ne yaptı», harcama kartı (2026-11-01/02)

**Sınav: 209 → 293/300 (%98).** AYS 91/95, SPİ 89/90, ESP 69/70, genel 44/45; yerel karar
ortanca 2 ms. Gerileme yok (her adımda önceki koşuyla cümle cümle karşılaştırıldı).

| Adım | Puan | Ne |
|---|---|---|
| Başlangıç | 209 | 2a sonu |
| Niyet çözücü (`arac.js` söz 6) | 247 | regex'siz araç seçimi: cümle, aracın adı + açıklaması + örneği + yeni `anahtar` alanıyla Türkçe ek payıyla puanlanır (az araçta geçen kelime ağır, ardışık iki kelime artı). Soru ve ad öbeği okuma, emir yazma aracına; kayıt («… çözdüm») ve danışma («ne yapmalıyım», «nasıl korurum», «… nedir») girmez. Eşik altı ya da başa baş: null, model ya da sayfa karar verir |
| Ölçüm düzeltmesi | −2 | sınav, zorunlu parametresi eksik yazma seçimini artık karar saymaz (gerçek `aracIsle` gibi doğrular) |
| Eksik parametreyi sorma, kelime sonu | 256 | «kitap ekle» → «Kitap ekle için kitabın adı ne olsun?» (§1.7; tek zorunlu metin parametresi); sayfa fiili kelime olarak («ses açma», «gitar», «geçmiş» komut değil); açıklamadaki başka aracın adı puana girmez |
| Ofis 032 (SPİ), 033 (ESP) | 279 | `anahtar`, `es` ve `kural` (besin, barkodlu öğün, bölüm aç/kapa `SP.Bolum` kataloğundan), kilo takma adları, «buçuk»/«çeyrek» süre, sayfa sayısıyla okuma oturumu (dakika «veri yok») |
| Ofis 031 (AYS) | 293 | okuma araçlarına `anahtar`/`es`; Onaylar eylemlerine zorunlu parametre ve `komut.js` üzerinden `kural`; «buçuk» süre |

Beklentisi düzeltilen dört cümle (gerekçe `king_sinav.json`'da `not`): «4-7-8 nefes tekniği başlat»
(araç yalnız kutu nefesi yapar; Merkez anlatır), «bugün kendimi çok halsiz hissediyorum» (SPİ'de his
kaydı da doğru), «tahlil bölümünü aç» ve «kartlar bölümünü tekrar aç» (gizlenebilir bölüm değiller;
sayfa komutu doğru). Kalan 7: AYS'de miktarsız «çalışma süresini kısalt» ve takvimde bayram yokken «bayram günleri için mola
tanımla» (ikisi de bilerek sorulur, uydurulmaz), «toplantı kararını yapıldı işaretle» (toplantı eylemine
gidiyor; tek açık karar yoksa zaten sorulmalı), «deneme çözerken süreyi yetiştiremiyorum» (sayfa açıyor,
Merkez beklenir); SPİ «gece geç saatte yemek yemek uykuyu bozar mı» (sayfa açıyor) ve «King'in konuşma
hızını ayarla» (King ayarlarında hız yok); ESP «Almanca gramer hakkında soru sor» (soru kartı bulunamadı;
karar doğru, sınav `kart-yok`u ayırt etmiyor).

**Ofis.** 031–033 elle başlatıldı (pilotun günlük sınırı doluydu); Denetçi 032 ve 033'e «temiz» dedi,
son incelemede 032'de elle yazılmış ve 8'i gizlenemeyen 13 bölüm kimliği, 031'de üç uydurma (takvimde
bayram yokken bugünden 2 gün, açık karar yokken sahte kimlik, miktarsız «kısalt»ta bugün) ve kayıt
cümlelerini okumaya çeken geniş `es` ifadeleri çıktı. 031'in ajanı takıldı; bulguları Claude düzeltti,
ayrıca «10 dk mola verdim» gibi geçmiş zamanlı kayıt cümlesinin `ara_ver` önerisine dönmesini kapattı
(eylem kuralları kayıt cümlesini almaz). Dersler defterde. Testçi oturum kesintisinde yarıda kaldı; §2 denetimleri birleşik main'de elle koşuldu.

**«King ne yaptı» zaman çizgisi (F).** Rayda «Eylemler» bölümü: bu oturumun yazmaları ve HKM'nin
eylem defteri (`GET /api/eylem`) tek çizgide, güne göre, modül noktası, saat ve kaynakla. Onaylı her
yazma (araç, yetki eylemi, kayıt) `POST /api/eylem` ile Merkez'e de düşer. Geri al tek tık: modül
yazmasını modülün kendi `geriAl`'ı yapar ve HKM satırı işaretlenir; HKM'nin kendi yazması (para, söz)
HKM'de geri alınır. Sınır: modül `geriAl`'ı bellekteki bir işlevdir, sayfa kapanınca o satır «kalıcı»
görünür (sessiz geri alma yok); kalıcı geri alma için araçların tersini `{ad, param}` olarak dönmesi
gerekir (sonraki iş). «Geri al» çipi de çizgiyi günceller.

**Plan canlı, onay tek dokunuş.** İstemci artık `dongu` yollar: model sonuçtan sonra yine okuma
isterse araç çalışır, adımlar bekleme balonunda canlı («çalışıyor/bitti/olmadı») görünür ve cevabın
üstünde kalır (en çok 4 tur, aynı çağrı tekrar edilmez). «Onayla» birincil düğme; onay bekleyen cevap
çerçeveli kart.

**«King bugün ne harcadı».** Eylemler bölümünün başında: çağrı, jeton, maliyet, ortalama süre ve
modüle göre tek yığılmış çubuk (rol öneki `ays.`/`spi.`/`esp.`, gerisi Merkez); `aria-label` sayıları
cümleyle söyler. Sohbette «bugün ne harcadın» `king_harcama` aracıyla aynı sayıları verir. Sayı
HKM defterinden gelir; tarifesi bilinmeyen modelde maliyet HKM'nin tahminidir (`ai_olcum` bu etiketi
henüz dönmüyor: HKM işi).
