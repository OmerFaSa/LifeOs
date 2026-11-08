# King 5 · Sahada çalışan King

**Amaç.** King 4.0 laboratuvarda 293/300 aldı; sahada ise model çağrılarının yarısı düşüyor,
kendiliğinden King hiç tetiklenmemiş, hafıza neredeyse boş. King 5'in işi **var olanı sahada
güvenilir, hızlı ve hatırlayan hâle getirmek**, sonra üstüne az ama yararlı yetenek koymaktır.

**Ana ders.** Testler yeşilken saha kırmızı olabilir. Bu yüzden her iş paketi iki yerde
kabul edilir: testte ve sahada (`tools/king_saha.py`).

Depo sahibinin istekleri (2026-11-07):
- «PC kasmasın.»
- «Altyapı güçlensin, performans, hafıza, hayata dokunuş.»
- «Arayüz iyi, dokunma.»
- «Konuşa konuşa ilerleyelim, yanlış anlaşılmasın.»

## 1. Saha durumu (2026-11-07, ölçüldü)

Kaynaklar:
- canlı HKM veritabanı (`usage`, `king_olaylar`, `eylem`, `memories`; salt okunur),
- canlı HKM günlüğü (`daemon.log`),
- Ollama ölçümü (`olc.py`),
- koda karşı denetlenmiş kod okuması.

| # | Bulgu | Sayı |
|---|---|---|
| S1 | King model çağrılarının başarısı | 14 günde **19/34 (%56)**; SPİ 7/15, ESP 2/7 |
| S2 | Düşme nedenleri | Ollama kapalı **20** · model belleğe sığmadı **4** · 60 sn zaman aşımı **4** |
| S3 | İlk söz süresi | sıcak modelde 0,2–0,8 sn · soğuk modelde **27–43 sn** |
| S4 | Kamera | iki model birbirini atıyor; boş sanal bellek 19 MiB'a iniyor, PC takasa düşüyor (**Tur 1'de düzeltildi**) |
| S5 | Eski jetonla reddedilen istek (401) | ≈ **2.800** (kutu 1.438 · ofis/kamera cevabı 966 · hedef eşitleme 367) |
| S6 | Boşuna sorgu | teklif ve iş sorguları ≈ **10.500**; AYS sekme gizliyken de 60 sn'de bir soruyor (`AYS/src/js/app.js:2140`) |
| S7 | Kendiliğinden King | `/api/olay` **0 istek**, `king_olaylar` 0 satır |
| S8 | «King ne yaptı» sunucu defteri | `eylem` **0 satır** |
| S9 | Hafıza | sunucuda **5 kayıt**, 3 gömme (108 sohbet satırına karşı) |
| S10 | Konuşma | kamera açıkken her mesaj görsel isteğe dönüşüyor, önceki konuşma gitmiyor; belirsiz cümlede soru yalnız istemde yazılı, kodda ve sınavda yok |

Korunacak iyi taraflar:
- Bağlam 2,7–4,6 bin jetondan 0,44–0,76 bin jetona inmiş.
- Seviyeye göre geçmiş ve hafıza sınırı var (`HKM/core/sohbet.py:169`).
- İlk söz zaten ölçülüyor (`usage.ilk_ms`).
- Kota dolunca yerel yedek basamak var.

### Deneme kullanımı (2026-11-08)

Worktree'den ayrı bir kopya açıldı: HKM 4290, modüller 4281–4283, boş veritabanı, gerçek Ollama
(`gemma4:e2b`), kanallar kapalı. Yeni bir öğrenci gibi kullanıldı: tanışma sihirbazı, sohbet, süre
değişikliği, kayıt, soru çözme, ders, hafıza, hatırlatma.

| # | Cümle | Ne oldu | Kök neden | Durum |
|---|---|---|---|---|
| D1 | «yarın sabah 7'de bana koşuyu hatırlat», ardından «onu 8'e al» | King «hatırlatırım» ve «tamam, 8'de» dedi; **hiçbir şey kurulmadı** | hatırlatma kuralı yalnız «20 dk sonra hatırlat: X» biçimini tanıyor; model yapmadığı işi söylüyor ve bu denetim yalnız araçlı turda çalışıyordu | **düzeltildi:** doğal gün/vakit/saat çözücüsü + «onu 8'e al»; HKM her turda «yaptım/yaparım» sözünü durduruyor, akışta da |
| D2 | «kahve içmem, bunu aklında tut», sonra «ben ne içmem?» | «Bu ders sistemde yok..» hatası; sonra hatırlamadı | hafıza komutu yalnız «aklında tut: X» önekini tanıyor; cümle modelin araç seçimine düştü | **düzeltildi:** «X, bunu aklında tut / bunu unutma», «aklında tut, X» |
| D3 | «bugünkü çalışmayı kısalt, 30 dakika yeter» | **kalıcı** değişiklik önerildi: her gün 180 → 30 dk, 156 konu plandan çıkıyor (onay kartı durdurdu) | AYS çözücüsü «yeter» fiilini tanımıyor; model kalıcı aracı seçti | **düzeltildi:** tarihli «… yeter» geçici süredir |
| D4 | «hayır, kalıcı değil sadece bugün için» | yalnız «hayır» anlaşıldı, «sadece bugün» atıldı | onay beklerken «hayır + düzeltme» iptal sayılıyor | açık (K5-09) |
| D5 | ders kartından sonra «peki bir örnek ver» | «Konuyu tekrara al için konu kimliği (ays_konular) ne olsun?» | konu ipi yok; araç parametresi sorusunda şema açıklaması kullanıcıya gidiyor | **düzeltildi:** yazılı «devam» ve «örnek/soru» derse bağlanır; iç ad sorudan atılır |
| D6 | «bugün matematikten 40 soru çözdüm 32 doğru» (pazar) | önizleme 40 soruyu «Dinlenme» bloğuna yazıyor, «matematik» kayboluyor; King kaydetmeden «Helal olsun» dedi | AYS kayıt çözücüsü dinlenme gününde dersi bloğa bağlayamıyor | açık (AYS modül mantığı, ofise uygun) |
| D7 | «günaydın King, bugün biraz yorgunum» | ilk söz 10,2 sn (soğuk); cevap plana bağlanmadı | soğuk model (K5-05); yorgunluk → «bugünü kısaltayım mı?» önerisi yok | açık |
| D8 | tanışma sihirbazı | 2. adım (hedef sıralaması) boşken geçiliyor; hata 5. adımın sonunda «2. adıma dön» diye çıkıyor | doğrulama yalnız sonda | açık (AYS, ofise uygun) |
| D9 | «2x+3=11 ise x kaç?» | doğru, 1,5 sn; cevapta `$2x + 3 = 11$` LaTeX işareti | model biçimi | açık (küçük) |
| D10 | «notlarımı kaydettin mi, dün ne çalıştım?» | dürüst («kaydetmedim») ama «bir araç çağırmam gerekiyor» diyor, dünü söylemiyor | iç terim «araç» akışta süzülüyor ama tam cevapta süzülmüyor; veri sorusu okuma aracına bağlanmadı | açık |
| D1–D5 doğrulama | aynı cümleler yeni kodla | hatırlatma 07:00 → «onu 8'e al» 08:00, saatsiz istekte «Ne zaman?», «ben ne içmem?» → «Bana şöyle demiştin: «kahve içmem»», ders kartından sonra «örnek ver» → Türev sorusu | — | **canlıda doğrulandı** (3c6073ed) |

İyi çalışanlar: geçici süre önizlemesi ve onayı, türev ders kartı (dürüst etiketli), sıcak modelde
0,6–1,5 sn cevap, onaylanan eylemin `eylem` defterine düşmesi.

## 2. İlkeler

1. **Ölç → kök neden → düzelt → yeniden ölç.** Ölçüsüz değişiklik yok.
2. **AGENTS §1 aynen.**
   - Sayıyı kod üretir.
   - Model kalıcı kayıt yazamaz.
   - Model kapalıyken hiçbir şey kapanmaz.
   - Yazan her eylem geri alınır.
3. **Arayüz yeniden tasarlanmaz.** Gerekirse var olan kart ve çip kalıbı kullanılır.
4. **Her tur «ne anladım» paragrafıyla başlar, senin onayınla yürür.** Her tur ayrı commit
   olur (OmerFaSa). Push yalnız sen «gönder» deyince yapılır.
5. **Bu bilgisayar 8 GB RAM.** Testler, Ollama ölçümleri ve derlemeler **yalnız depo sahibinin
   talimatıyla** ve sırayla koşar (karar 2026-11-08). Talimat gelene kadar yalnız kod ve belge
   yazılır; koşulmamış her test turun «bekleyen» listesinde durur.

## 3. İş paketleri (öncelik sırasıyla)

Her paket şu biçimdedir:
- **Sorun → Çözüm**
- **Kabul:** testte ve sahada ne görülmeli
- **Kim:** Claude ya da ofis (AGENTS kademesi)

### Temel · ölçmeden başlama

**K5-00 Saha raporu ve günlükte saat**
- **Sorun → Çözüm:** «Düzeldi mi?» sorusunun bugün tek komutluk cevabı yok; günlük satırlarında
  saat de yok. Çözüm:
  - `tools/king_saha.py` (salt okur): çağrı başarısı, düşme nedenleri, sıcak/soğuk oranı, ilk söz,
    bağlam, uç başına istek ve 401, olay, eylem ve hafıza sayıları; tek tablo.
  - HKM istek satırına zaman damgası ve süre (ms).
  - `olc.py` kalıcı araç olur.
- **Kabul:** Sahte veritabanı ve günlükle beklenen tablo çıkar. Bugünkü sayıları (bölüm 1) aynen üretir.
- **Kim:** araç ofise uygun (yeşil); günlük satırı Claude (HKM çekirdeği).

### P0 · Güvenilirlik (sahada düşmesin)

**K5-01 Bellek bekçisi** (Tur 1'de kamera kısmı yazıldı)
- **Sorun:** 8 GB'ta ikinci model yüklenince sistem takasa düşüyor (S2, S4).
- **Çözüm:**
  - Bellek dar ya da boş RAM 6 GiB'ın altındaysa ikinci model yüklenmez, bellekteki model iş görür.
    Görsel için yazıldı; metin rollerine de genişletilir.
  - «Sığmadı» hatasında diğer yerel model bırakılır ve bir kez daha denenir.
  - **Tek görsel model kararı** (aşağıda) canlı ayara uygulanır.
- **Tek görsel model kararı (2026-11-08, depo sahibi: «en performanslı ve en iyi anlayan hangisiyse o»):**
  - **Aday:** `gemma4:e2b`, yani hem sohbet hem görüntü için tek model.
  - **Gerekçe 1:** Sohbet için zaten bellekte duruyor; görüntü için ikinci yükleme yok.
  - **Gerekçe 2:** Kamera karesindeki soruları eksiksiz okudu: sıcakken 1,6–4,9 sn.
  - **Gerekçe 3:** Ölçüm 2b'de fiş okumada gemma4 3'te 2 doğru yaptı, qwen3-vl 3'te 0 (boş cevap,
    düşünme kapanmıyor).
  - **Rakipler:**
    - `qwen3-vl:4b` ikinci bir 3,9 GiB yükleme istiyor ve PC'yi takasa düşürdü.
    - `gemma3:4b` aynı sorunu taşıyor (ayrı 3,3 GB).
    - 8 GB RAM'de daha büyük bir görsel model (ör. gemma4 e4b) denenmez.
  - **Karar ölçüyle kesinleşir:** küçük bir görsel sınav koşulur, 6 kare:
    - 2 kamera sorusu,
    - 2 fiş ya da öğün fotoğrafı,
    - 2 ekran görüntüsü.

    Her modelde doğruluk (beklenen metin ve sayı), ilk söz ve toplam süre, en düşük boş bellek
    ölçülür. Doğrulukta geride kalmayan ve en hızlı olan kazanır. Beklenen kazanan: gemma4.
  - **Uygulama:** `<modül>.gorsel` atamaları (AYS, SPİ, ESP) HKM › Modeller'in kendi ayar yolundan
    kazanan modele çevrilir. Dosya elle düzenlenmez, önceki hâl geri alınabilir kalır.
  - **Disk:** qwen3-vl'in silinmesi (3,3 GB) ayrı karardır, ayrıca sorulur.
  - **Yeniden değerlendirme:** RAM 32 GB'a çıkınca aynı görsel sınav yeniden koşulur.
- **Kabul:**
  - Kamera «oku» 26,6 → ≤ 5 sn (ölçüldü: 4,9).
  - 30 dk kamera kullanımında boş sanal bellek hiç 1 GiB'ın altına inmez.
  - Sahada «sığmadı» düşmesi 0.
- **Kim:** Claude.

**K5-02 Ollama kapalıyken sessiz çalış**
- **Sorun:** Düşmelerin en büyük kalemi bu (20). Arka plan kartı bile her seferinde bağlanmayı deniyor (S2).
- **Çözüm:**
  - Sohbetteki «kapalı kalan süre» kuralı bütün model çağrılarına uygulanır.
  - Gün kartı model yokken kural cümlesiyle yazılır.
- **Kabul:** Sahada «bağlantı reddedildi» 0. Model kapalıyken kart yine görünür.
- **Kim:** Claude.

**K5-03 Tek jeton yenileme yolu**
- **Sorun:** Eski jetonla ≈ 2.800 istek reddedilmiş; kamera ve ofis cevapları bunlara dahil (S5).
- **Çözüm:**
  - HKM'ye giden her çağrı (sohbet, kutu, ofis, hedef eşitleme, olay) 401'de aynı yoldan bir kez
    yeniden bağlanır, sonra bir kez daha dener.
  - Yenilenemezse o uç bir süre susar.
  - **Asıl klasördeki commit'lenmemiş 401 çalışması:**
    - Durum: `C:\Users\ASUS\LifeOs`'ta `king.js` `jetonYenile`, `hesap.js`, `king-ses.js`,
      `HKM/daemon.py` ve testleri değiştirilmiş. Muhtemelen önceki bir oturumun işi; sahibi bilinmiyor.
    - Kural: o klasöre dokunulmaz, o değişiklikler silinmez ve commit'lenmez.
    - Kullanım: K5-03 bu worktree'de sıfırdan yazılır, o fark yalnız örnek olarak okunur.
    - Birleştirme: K5-03 main'e girmeden önce asıl klasörde o fark hâlâ duruyorsa depo sahibine
      gösterilir: «bu artık K5-03'ün içinde, atılabilir mi?».
- **Kabul:** Sahada 401 ≈ 0. Test: her uçta 401 → yenile → tekrar; yenilenemezse istek fırtınası yok.
- **Kim:** Claude (`brand/ortak`).

**K5-04 Cevap garantisi**
- **Sorun:** Soğuk modelde King 27–43 sn susuyor; 4 kez 60 sn'de düştü (S2, S3).
- **Çözüm:**
  - Zaman aşımı «ilk söze kadar» ve «toplam» diye ikiye ayrılır.
  - İlk söz gecikirse King «hazırlanıyorum» der.
  - Bulut anahtarı varsa bulut yedeği devralır.
- **Kabul:** Hiçbir soru 2 sn'den uzun cevapsız kalmaz. Sahada zaman aşımı düşmesi 0.
- **Kim:** Claude.

### P1 · Hız ve verim

**K5-05 Soğuk başlangıç**
- **Sorun:**
  - Isınma bellek darken atlanıyor ve bir daha denenmiyor.
  - Yerel çağrı `/v1` yolunda model süresini veremiyor; Ollama'nın 5 dk varsayılanı geçerli,
    ısıtma ise 30 dk istiyor (S3).
- **Çözüm:**
  - Bellek açıldığı an ısınma yeniden denenir.
  - Yerel çağrı model süresini taşıyan yola alınır.
- **Kabul:** Sahada soğuk çağrı oranı ve ortalama ilk söz yarıya iner. Sıcakta < 1 sn korunur.
- **Kim:** Claude.

**K5-06 Sorgu diyeti**
- **Sorun:** ≈ 10.500 sorgu; çoğu boş cevap, sekme gizliyken de gidiyor (S6).
- **Çözüm:**
  - Sorgular yalnız sekme görünürken atılır.
  - Değişiklik yoksa sunucu 204 döner ve modül sorgu aralığını uzatır.
  - Yeni teklif gelince olay tetikler (`kingteklif.js` ortak).
- **Kabul:** Sekme gizliyken 0 sorgu; toplam en az 5 kat az. Teklif gecikmesi değişmez.
- **Kim:** Claude (`brand/ortak`); modül bağlantıları ofise uygun (sarı).

**K5-07 Kamera sohbeti**
- **Sorun:** Kamerada her mesaj görsel isteğe dönüşüyor, geçmiş gitmiyor. Kendiliğinden bakış sensör
  gürültüsünü «değişiklik» sanıp 6 dk'da bir istek atıyor (S10).
- **Çözüm:**
  - Görüntüyle ilgisiz mesaj normal sohbete gider.
  - Görsel soruya son mesajlar eklenir.
  - Kare küçültülmüş parlaklık iziyle karşılaştırılır.
- **Kabul:** «teşekkürler» görsele gitmez. «peki ikincisi?» önceki kareye bağlanır. Durağan masada
  kendiliğinden bakış istek atmaz.
- **Kim:** Claude.

### P2 · Zekâ: ip, hafıza, kendiliğindenlik

**K5-08 Kendiliğinden King'i sahada aç**
- **Sorun:** Modüller olay yayınlamak üzere kurulu ama HKM'ye hiç olay gelmemiş. Eylem defteri de boş (S7, S8).
- **Teşhis (önce):** Hangisi doğru?
  - modül olay üretmiyor (`KingVeri.olaylar`),
  - bağlantı kurulmuyor (`olay.js` `baglanti()` null; jeton ya da ayar),
  - istek gidip reddediliyor.

  Gerçek veriyle ölçülür, kök nedene göre düzeltilir.
- **Çözüm:**
  - Uçtan uca yol yeşil olur: modül olayı → `/api/olay` → kural kararı.
  - Yazan her King eylemi sunucu defterine düşer.
- **Kabul:**
  - Sahada gerçek olaylar akıyor.
  - Kendiliğinden konuşma günde en çok N kez, sessiz saatlere uyuyor, «neden şimdi» satırı taşıyor.
  - `eylem` defteri dolu.
- **Kim:** Claude.

**K5-09 Konuşmanın ipi**
- **Sorun:** Göndermeler («peki ikincisi», «onu», «dünkü») ve belirsiz cümleler kodla değil, modelin
  iyi niyetiyle çözülüyor; sınav bunları ölçmüyor (S10).
- **Çözüm:**
  - Kural motoru **son anılan şeyi** tutar (ders, gün, kayıt).
  - Niyet çözücü iki yola yakınsa iki seçenekli çip sorar.
  - «hayır onu demedim» son anlaşılanı ve son eylemi düzeltir.
  - Seviye sınırını aşan eski mesajlar atılmaz, kısa bir konu özeti olarak kalır; özet görünür ve silinebilir.
- **Kabul:** Sınava **«belirsiz»** ve **«çok turlu»** bölümleri girer ve geçer. Toplam puan ≥ 293 kalır.
- **Kim:** Claude (niyet çözücü); sınav cümleleri ofise uygun (yeşil, kabul Claude'dan).

**K5-10 Hafızayı besle**
- **Sorun:** Hafıza altyapısı çalışıyor ama içi boş (S9).
- **Teşhis (önce):** Cihazdaki kayıtlar ile sunucudakiler karşılaştırılır. Eşitleme mi eksik, yoksa
  kayıt mı hiç oluşmuyor?
- **Çözüm:**
  - Açık beyanlar (tarih, kişi, hedef, tercih) kuralla aday olur; **«hatırlayayım mı?»** çipiyle sen onaylarsın.
  - «bunu unut» ve «artık öyle değil» tek adımdır, Geri al kalır.
  - Dünden açık kalan iş ertesi gün tek satırla döner.
- **Kabul:** Model yine kayıt yazamaz (test aynen). Sahada onaylı kayıt sayısı artıyor, cevapta
  kullanılma oranı ölçülüyor.
- **Kim:** Claude (çekirdek); ekran mantığı ofise uygun (sarı).

### P3 · Yeni yetenekler (sen seçeceksin; en çok 2)

Sahadaki kanıta en yakın üç aday:

| # | Yetenek | Neden işe yarar |
|---|---|---|
| K5-11 | **Kamerayla ders:** masadaki soruyu oku, çöz, AYS'ye yanlış olarak kaydetmeyi öner (onaylı) | gemma4 soruyu 2,6 sn'de eksiksiz okudu; K5-01 ve K5-07 bunu güvenli kılar |
| K5-12 | **Bilgisayar durumu cümlesi:** «bilgisayar şu an dar, ağır işi sonraya bıraktım» | P0'ın kullanıcıya görünen yüzü; sessiz yavaşlık yerine açıklama |
| K5-13 | **Günün ipi:** sabah brifingi ile gün kapatma aynı kısa hikâyeyi taşır | var olan iki kartı birleştirir; yeni ekran gerekmez |

Plandan çıkarılanlar ve nedenleri:
- haftalık bakış ve telefonda aynı King: zaten var;
- odak ve mola: kanıtı yok;
- teyit cümlesi: onay kartı zaten yapıyor;
- arka plan envanteri: K5-06'ya katıldı.

## 4. Turlar

| Tur | Paketler | Bitti sayılır |
|---|---|---|
| 1 | K5-01 (kamera) | kod hazır · **testler bekliyor** |
| 2 | K5-00, K5-02 | saha raporu bugünkü sayıları üretiyor; Ollama kapalıyken düşme yok |
| 3 | K5-03, K5-06 | 401 ve boş sorgu testleri; diğer oturumla birleşme tamam |
| 4 | K5-01 (kalan), K5-04, K5-05 | soğuk ve sıcak ilk söz ölçüldü; hiçbir soru cevapsız kalmıyor |
| 5 | K5-07, K5-09 | sınavda iki yeni bölüm geçiyor, toplam ≥ 293 |
| 6 | K5-08, K5-10 | uçtan uca olay testi; hafıza teşhisi ve onaylı aday |
| 7 | seçilen P3 + son rapor | belgeler, sınav, saha raporu; push (izinle) |

Her turun **bitiş koşulu** aynıdır:
1. Dokunduğu sistemin testleri, `entegre.js` ve King sınavı yeşil.
2. `brand/ortak` değiştiyse yayılım ve derleme yapılmış.
3. Saha raporu «önce → sonra» yazılmış.
4. Ayrı commit atılmış. Geri dönüş `git revert` ile tek adımdır.

## 5. Sahada doğrulama (yeni kapı)

Push ve «Güncelle»den sonra paket hemen «bitti» sayılmaz.
- **Gözlem süresi:** 3 günlük normal kullanımdan sonra `tools/king_saha.py` yeniden koşulur.
- **Hedef tutarsa:** paket kapanır.
- **Hedef tutmazsa:** paket açık kalır ve nedeni bir sonraki turun ilk maddesi olur.
- **Neden bu kapı var:** King 4.0'ın sınavı geçip sahada düşmesinin dersi.

## 6. Testler

Bütün testler depo sahibinin talimatıyla koşar (ilke 5).

**Tur 1'den bekleyen (talimat bekliyor, sırayla):**

1. `cd HKM && python -m tests.run`
   - Fiziksel RAM eki sonrası; ilk sürüm 1085/1085 geçmişti.
   - Çıktı dosyaya gidecekse `PYTHONIOENCODING=utf-8` gerekir; yoksa iki CLI testi Windows kod
     sayfası yüzünden yanlış kırmızı verir.
2. `node tools/entegre.js`
3. `node tools/king_sinav.js --port=4876`: 293/300'ün altına düşmemeli.
4. `olc.py`: bir kez oyun kapalıyken, bir kez açıkken.

**Yazılacak testler (paket başına en az biri; önce hatayı yakalayan test):**

| Paket | Test |
|---|---|
| K5-00 | sahte veritabanı ve günlük → beklenen saha tablosu; günlük satırında saat ve ms |
| K5-01 | bellek darken görsel ve metin rolü bellekteki modele düşer; «sığmadı» → boşalt → bir kez tekrar; görsel sınav (6 kare) her aday modelde doğruluk ve süre üretir |
| K5-02 | Ollama kapalıyken arka plan model çağırmaz; kart kural cümlesiyle yazılır |
| K5-03 | her HKM ucunda 401 → yenile → tekrar; yenilenemezse uç susar |
| K5-04 | ilk söz gecikince «hazırlanıyorum» ve bulut yedeği |
| K5-05 | bellek açılınca ısınma yeniden denenir; yerel çağrı model süresini taşır |
| K5-06 | sekme gizliyken sorgu yok; değişiklik yoksa 204 |
| K5-07 | kamera açıkken ilgisiz mesaj görsele gitmez; görsele geçmiş eklenir; gürültülü kare «değişti» sayılmaz |
| K5-08 | modül olayı → `/api/olay` → `king_olaylar` → kural kararı; yazan eylem `eylem` defterine düşer |
| K5-09 | sınav: «belirsiz» bölümünde beklenen «sor»; «çok turlu» bölümünde gönderme doğru şeye bağlanır |
| K5-10 | açık beyan aday üretir, onaysız kayıt yok; «bunu unut» siler, Geri al getirir |

## 7. Başarı ölçüleri (sahada, `tools/king_saha.py`)

| Ölçü | Bugün | Hedef |
|---|---|---|
| Model çağrısı başarısı (Ollama açıkken) | %56 | **≥ %95** |
| Ollama kapalı / sığmadı / zaman aşımı düşmeleri | 20 / 4 / 4 | 0 / 0 / 0 |
| 401 reddi | ≈ 2.800 | ≈ 0 |
| Cevapsız bekleme | 27–43 sn | ≤ 2 sn içinde ilk ses |
| Sıcak ilk söz | 0,2–0,8 sn | < 1 sn (korunur) |
| Boş sorgu | ≈ 10.500 | en az 5 kat az; gizliyken 0 |
| Kendiliğinden olay / eylem defteri | 0 / 0 | akıyor / dolu |
| Onaylı hafıza kaydı | 5 | artıyor; kullanılma oranı ölçülüyor |
| King sınavı | 293/300 | ≥ 293 ve iki yeni bölüm geçiyor |

## 8. Kararlar

**Verilen kararlar (2026-11-08):**

| Konu | Karar |
|---|---|
| Görüntü modeli | en hızlı ve en iyi anlayan model; ölçüyle seçilir, aday `gemma4:e2b` (K5-01) |
| Asıl klasördeki 401 çalışması | sahibi bilinmiyor; dokunulmaz, örnek olarak okunur, birleşmeden önce sorulur (K5-03) |
| Test saatleri | testler yalnız depo sahibinin talimatıyla koşar (ilke 5) |

**Bekleyen kararlar:**

1. **P3:** K5-11, 12 ve 13'ten en çok ikisini seç.
2. **Disk:** görsel sınavdan sonra qwen3-vl silinsin mi (3,3 GB)?
