# Gün modülü planı: HKM arayüzü yerine yaşayan bir merkez

> Durum: **F0, F1, F2, F3a, F7 tamam** (2026-11-03; F7 öne alındı, §13); açık: SPİ günlük özeti, Motto/Para/Ofis'in yeni yeri. Antigravity kotası bittiği
> için fazları Claude yapar; geniş okuma Kod Asistanı'na (`arastir`) gider.
> Kararlar 2026-11-03: §9. İlk durum: plan (2026-11-02). Fikirlerin hepsinin görsel
> örnekleri tuvalde: https://claude.ai/artifact/7ipZ98otKnCdEHtzJLwcy4
> (sayfalar: Cep, 30 taze fikir, 20 fikir · gün modülü ve modüllerin içi).

## 0. Tek cümlede

HKM'nin ayrı arayüzü (Merkez, :4200 web) kalkar. Yerine AYS, SPİ ve ESP
verilerini birlikte, sıkıcı olmayan biçimde gösteren ve günü kurmaya yarayan
beşinci bir modül gelir: **Gün**. HKM'nin ayarlanabilir kısımları her
modülün Ayarlar'ına sade bir bölüm olarak taşınır.

## 1. Karar ve sınır

- **Kalkan:** HKM'nin kullanıcıya görünen web arayüzü (`HKM/web/index.html`)
  ve kabuktaki «Merkez» satırı (`brand/ortak/kabuk.js`, `MODULLER.mer`).
- **Kalan:** HKM'nin motoru: daemon, veritabanı, King'in hafızası
  (`HKM/core/memory.py`), kural motoru (`kendiliginden.py`), model merdiveni,
  eylem defteri, kanallar. King bu motor olmadan çalışmaz. Kullanıcı motoru
  görmez, yalnız sonuçlarını görür.
- **Tek yönlü bağımlılık kuralı aynen sürer:** AYS, SPİ ve ESP motor
  kapalıyken de tam işlevli kalır. Gün modülü motor kapalıyken boş değil,
  «yerel özet» ile açılır.
- Giriş sayfasındaki dördüncü kart (HKM) Gün modülünün kartı olur.

## 2. Gün modülü: ne işe yarar, ne yaramaz

**Yarar:** günü planlamak, kendini ve ruh halini izlemek, üç modülün
verisini tek yerde canlı görmek, kart tabanlı küçük ritüeller.
**Yaramaz:** ders çalışmak, antrenman kaydı tutmak, okuma yapmak. Bunlar
AYS, SPİ ve ESP'de kalır; Gün yalnız onlara kapı açar.

**Diğer modüllere benzemez.** AYS, SPİ ve ESP bir alanda bir şey öğrenmek
ve yapmak için; Gün o alanlarda **ne yaptığını ve ne yapacağını görmek**
için, daha etkileşimli. Ana ekran taslağı (tuvalde «Plan özeti › Gün modülü
· ana ekran»): ortada günün şeridi (07–23, «şimdi» çizgisi, «Yaptıklarım /
Yapacaklarım» geçişi), altında alan çubukları (dokununca şeride süzer),
«Şimdi ne yapsam?» kartı ve haftanın hayat karnesi; üstte niyet, enerji pili
ve iç hava.

**Üç bölüm** (KOLAY-PLANI'nın «az ekran» ilkesi; yedi bölüm yerine üç):

| Bölüm | Sorusu | İçindekiler (cepten) |
|---|---|---|
| **Bugün** (F3a önce, §9.3) | Ne yaptım, ne yapacağım? | Günün şeridi, sabah kurulumu, günün niyeti, enerji pili, ruh hali ve iç hava, kendi sözün, akıllı boşluk, mola menüsü, yorgun gün modu; plan araçları: zaman blokları, haftanın terazisi, iş borcu defteri, üç büyük taş, hayır listesi |
| **Geçmiş** | Nasıl gidiyor? | Hayat karnesi, günün şekli, ayın dokuması, plan ve gerçek, AYS/SPİ/ESP'den taşınan özetler (§2a); defter: gün sayacı defteri, kayıtlı yapışkan notlar, ses notları, zaman kapsülleri |
| **Sen** | Ne beni besliyor? | Işık ipliği, kendi bağını kur (bağ güçlendikçe büyüyen enerji), enerji veren / çalan, kök salan alışkanlık (ayrıca derin tasarlanacak), «Ne yapsam?» destesi (öğrenen deste), soru kutusu |

## 2b. Kural: her özellik King'e de araç olarak gelir

Gün modülüne ya da modüllere eklenen her yeni özellik aynı turda King'in
aracı olarak da yazılır: King onu okuyabilir, kullanıcı isterse yazabilir.
Yazma işlemleri eylem defterine düşer, geri alınabilir.

- Kapsam testi (ekranda olup King'de olmayan iş kalırsa kırmızı) her fazda
  yeşil kalmalı.
- Her yeni araç için King sınavına cümleler eklenir; sınav puanı düşmez.
- Örnek: «yarın 10:00'a 2 saat AYS koy», «bu hafta karnem nasıl?»,
  «bugüne not bırak», «bir kart çek».

## 2c. Kural: yeni sunucu açılmaz

Gün modülü için yeni süreç, yeni port ya da yeni sunucu yok. Mevcut giriş
sunucusu (`sistem/sunucu.py`) ve ortak kabuk (`brand/ortak`) kullanılır;
veri motor kapalıyken modüllerin yerel kaydından okunur. 8 GB RAM'de bir
süreç daha ofis, Ollama ve testlerle birlikte belleği taşırır.

**Hayat karnesi:** deneme karnesi fikrinin genişletilmiş hali. Her gün bir
sıra kare, her kare bir alan (uyku, beslenme, hareket, çalışma, okuma…):
yapıldı, eksik, boş. Günler alt alta dizildikçe hayatın hangi alanında
takıldığın görünür. AYS'ye özel değil, Gün › Geçmiş'te durur.

## 2a. Sadeleştirme ilkesi: modüller ferahlar

AYS, SPİ ve ESP'nin ekranlarındaki **statik özet kartları** (yalnız bir
rakam ya da durum gösteren, iş yaptırmayan kartlar) kaldırılır. Bu tür
özetler Gün modülüne taşınır ve orada üç modülün verisiyle birlikte,
yaşayan görsellerle gösterilir (Gün › Geçmiş).

- Amaç: sistemin kalabalığını azaltmak, bilgiyi dağıtmak, ferah bir görünüm.
- Modüllerde kalan: o modülde **iş yapmaya** yarayan şeyler (kayıt, çalışma,
  deneme, okuma) ve o alana özgü yaşayan görseller (§4).
- Kural: bir kart taşınmadan önce Gün'deki karşılığı hazır olur; hiçbir
  bilgi arada kaybolmaz.
- Ölçüm: KOLAY-PLANI'nın pusulası (`node tools/pusula.js`) ile ekran
  başına kart ve öğe sayısı önce ve sonra ölçülür; sayı düşmeli.

## 3. Ayarlar: HKM'nin ayarları nereye gider

HKM ayar sekmeleri bugün dört tane: Yapay zekâ ve bütçe, Kanallar ve
cihazlar, Eşikler, Sunucu. Her modülün Ayarlar'ında tek, sade bir bölüm olur:
**King ve bağlantılar**.

- **Görünen (herkes):** model seçimi ve aylık bütçe, telefon / kanal
  bağlantısı aç-kapa, bildirim eşikleri (birkaç kaydırıcı).
- **Gizli («Gelişmiş», yalnız sahip):** sağlayıcı anahtarları, sunucu ve port,
  kanal jetonları, ofis araçları. Varsayılan kapalı, tek satırda açılır.
- Ayarlar tek yerde tutulur, üç modül ve Gün aynı ayarı okur (mevcut ayar
  eşitlemesi kullanılır, `081`).
- Anahtar sorma kuralı korunur (bkz. hafıza: Merkez without key).

HKM web'in diğer bölümlerinin taşınacağı yer (taslak, F0'da ekran ekran
doğrulanır):

| HKM bölümü | Yeni yeri |
|---|---|
| `#/bugun` | Gün › Bugün |
| `#/hedefler` | Gün › Bugün plan araçları |
| `#/motto` | Gün › Bugün «kendi sözün» |
| `#/sistemler` | Gün › Geçmiş |
| `#/teklifler` | King önerileri ve Gün › Sen «Ne yapsam?» |
| `#/sohbet` | King (zaten her modülde) |
| `#/profil` | Ayarlar › Profil |
| `#/para` | Gün › Bugün içinde isteğe bağlı parça ya da Ayarlar; F0'da karar |
| `#/ofis` | Ayarlar › Gelişmiş (yalnız sahip) |
| `#/ayarlar` | Ayarlar › King ve bağlantılar |

## 4. Cepteki fikirlerin yerleşimi

**Giriş sayfası (3 kartlı ekran):** zaman kapsülü.
**Sistem geneli (her modülde):**
- akışkan sol menü,
- damlanın izi: netlik ziyaret sayısına göre (2 kez soluk, 6 belirgin, 10 çok belirgin),
- sağ tıkla not: herhangi bir yere o güne yapışkan not; kaldır ya da kaydet; kayıtlılar Gün › Geçmiş'te,
- ses notu: King'le konuşmadan 30 sn ses, King'e gider,
- telefonda devam et.

Modüllerin içine, kaldırılan statik kartların yerine (§2a) o alana özgü
yaşayan görseller gelir:

- **AYS:** konu haritası (mevcut bilgi ağının yanına), solan konu.
- **SPİ:**
  - uyku şeritleri: son yedi gece, yatış saatinden sapma;
  - günün tabağı: yediklerin dilimleri doldurur, eksik dilim kesik çizgi;
  - saatli şişe: su hedefi saat çizgileriyle;
  - hareket silüeti: çalışan bölgeler ısınır. Bu fikir daha **detaylı**
    tasarlanacak: kas grupları ayrı ayrı, önden ve arkadan görünüm, son
    çalışmadan bu yana geçen gün.
- **ESP:** okuma patikası (yıllık hedef bir patika, kitaplar duraklar).

## 5. Fazlar

Her faz ayrı oturumda başlar. Görsel ve kabuk işi **kırmızı** (yalnız
Claude); veri ve mantık parçaları kabul testiyle ofise gider.

- **F0 · Envanter (yeşil, ofis):** HKM web'deki her ekranı, butonu ve ayarı
  listele; her birinin yeni yerini §3 tablosunda kesinleştir; HKM web'e
  bağlı testleri ve araçları bul. Çıktı: bu dosyada tamamlanmış tablo.
- **F1 · Ayarlar (kırmızı):** «King ve bağlantılar» bölümü üç modülde;
  Gelişmiş kısmı yalnız sahipte. HKM web'deki ayarlar o sırada yerinde kalır.
- **F2 · Gün iskeleti (kırmızı):** yeni modül, yeni sunucu açmadan (§2c);
  kabukta yeri, giriş sayfasında HKM kartının yerine Gün kartı, üç boş
  bölüm.
- **F3a · Bugün çekirdeği:** günün şeridi, günün niyeti, tek dokunuşla
  enerji ve ruh hali, «Şimdi ne yapsam?». Bir hafta kullanılır, pusulayla
  ölçülür.
- **F3b · Bugün geri kalanı:** sabah kurulumu, iç hava, plan araçları; yalnız
  F3a'nın ölçümü yer bırakıyorsa. Her parça King aracıyla birlikte (§2b).
- **F4 · Geçmiş, sonra Sen:** iki ayrı tur, yine her parça King aracıyla.
- **F5 · Sistem geneli dokunuşlar:** akışkan menü, damlanın izi, sağ tıkla
  not, ses notu, zaman kapsülü (giriş sayfası).
- **F6 · Modülleri sadeleştir:** AYS, SPİ ve ESP'deki statik kartların
  envanteri (yeşil, ofis); her birinin Gün'deki karşılığı hazır olunca kart
  kalkar, yerine §4'teki yaşayan görsel gelir (kırmızı). Pusulayla önce ve
  sonra ölçülür.
- **F7 · HKM web'i kullanıcıdan kaldır:** her şey taşındıktan sonra kabuktaki
  Merkez satırı ve giriş sayfasındaki HKM kartı kalkar; `:4200` kapanmaz,
  yalnız sahibe açık **Atölye** olur (§9.4). Belgeler güncellenir.

## 6. Kabul

- HKM web kapatıldığında hiçbir ayar ve hiçbir veri kaybolmaz (F0 listesinin
  her satırı yeni yerinde bir testle doğrulanır).
- King sınavı (`node tools/king_sinav.js --port=4876`) düşmez; kapsam testi
  yeşil; her yeni özelliğin King aracı ve sınav cümlesi var (§2b).
- Yeni süreç ya da port açılmamış (§2c).
- Motor kapalıyken AYS, SPİ, ESP ve Gün açılır, hata vermez.
- Her hareket hafif CSS; «hareketi azalt» açıkken durur; akıcılık ölçümü
  (`lifeos-akicilik-olcum`) kötüleşmez.

## 7. Riskler

- **Motor ile arayüzü karıştırmak:** HKM klasörü silinmez; yalnız web
  arayüzü emekliye ayrılır.
- **Port ve adresler:** kabuktaki `mer:4200`, giriş sayfasındaki
  `KARTLAR` listesi (`sistem/sunucu.py`) ve telefon iskeleti birlikte değişmeli.
- **Bellek (8 GB):** §2c bunun için var; beşinci modül bir sunucu daha
  demek değil.
- **Kapsam şişmesi:** Gün modülü «her şeyin yeri» olmaya kayabilir; §2'deki
  «yaramaz» listesi sınırdır.

## 8. Açık sorular

- Modülün kesin adı (çalışma adı «Gün»).
- `#/para` (bütçe) nereye gidecek?

## 9. Kararlar (2026-11-03)

1. **Antigravity kotası bitti:** fazları Claude yapar. Geniş okuma ve envanter
   Kod Asistanı'na (`arastir`, ücretsiz modeller) gider; bulgu satırı kendi
   okunmadan plana girmez (F0'da bir cevap tamamen uydurmaydı).
2. **Modüllerde bir satır durum kalır (§2a'ya ek):** statik kartlar kalksa da
   her modülün ana ekranında «bugün ne durumdayım» tek satırı kalır; Gün'e
   gitmeden görülür.
3. **Dürüstlük:** hayat karnesi üç hal: *yapıldı*, *eksik*, *veri yok*.
   Kayıt girilmemiş gün «eksik» boyanmaz. Ruh hali ve enerji «senin girdiğin»
   diye etiketlenir. «Şimdi ne yapsam?» kuralla seçer, model yalnız cümle
   kurar. F3, F3a ve F3b'ye bölündü.
4. **Ofis ve sahip araçları → Atölye:** `#/ofis` bir Ayarlar bölümüne
   sıkıştırılmaz. HKM web, F7'de **Atölye** olur: yalnız sahip, `:4200`'de,
   düzenli bir sol menüyle (§10.3). Modüllerin Ayarlar'ındaki «Gelişmiş»
   yalnız Atölye'ye bir bağlantıdır, ayarları kopyalamaz.

## 10. F0 envanteri (2026-11-03)

Kaynak: `HKM/web/index.html` (7873 satır; `GORUNUMLER` 5344, `AYAR_SEKMELERI`
5357), `brand/ortak/ayarlar.js`, `brand/ortak/hkmbag.js`, `brand/ortak/kabuk.js`.

### 10.1 Ekranlar ve kartlar → yeni yer

| HKM ekranı | Kartlar (`id`) | Yeni yeri |
|---|---|---|
| `#/bugun` Bugün | `serit` (üç sistemin durumu), `onay`, `aktif` (aktif kip, `/api/aktif`), `brifing`, `bugun-sohbet` (King), `konsey` (üç patron), `seri`, `capraz` (Dayanağı göster) | `serit` → Gün › Bugün üst şerit; `brifing` → Gün › Bugün; `bugun-sohbet` → King (zaten var); `konsey`, `capraz` → Gün › Geçmiş; `aktif` → Atölye; `onay` → King Onaylar |
| `#/sohbet` Sohbet | `gorevliler`, `konusma` (yedekle, temizle) | King (her modülde) + King › Kütüphane › Sohbetler; `gorevliler` → Atölye |
| `#/profil` Profil | `profil-kimlik`, `profil-hafiza`, `profil-onur`, `profil-kademe`, `profil-rozet`, `profil-muhur` | Gün › Sen (kademe, rozet, mühür, onur); `profil-hafiza` → King «Beni nasıl tanıyorsun» (zaten var) |
| `#/para` Para (`core/para.py`, Telegram «market 450 TL») | `para-ozet`, `para-vitrin`, `para-ekle`, `para-liste` | **Açık:** kişisel para takibi; Gün'ün işi değil. F7'ye kadar Atölye'de kalır, veri kaybolmaz |
| `#/sistemler` Sistemler | `tani`, `sistemler`, `hafta`, `ikiz`, `etki`, `gecmis` | `sistemler`, `hafta` → Gün › Geçmiş; `ikiz`, `etki`, `gecmis`, `tani` → Atölye |
| `#/motto` Hayat Mottosu | `motto-ilkeler`, sekmeler Ağaç / Harita / Ara, `motto-detay` | Gün › Sen («kendi sözün» + düşünce ağacı); ölçmez kuralı aynen |
| `#/ofis` Ofis | `ofis-katlar`, `ofis-king` (emir onay/iptal), `ofis-is-ver` (`/api/bam/is`), `ofis-isler`, `ofis-kayit`, `ofis-kayitlar`, `ofis-depo-tara`, `ofis-depo`, `ofis-bam` | Atölye › Ofis |
| `#/hedefler` Hedefler (`core/hedefag.py`) | `hedef-butce`, `hedef-zaman`, `hedef-liste` | Gün › Bugün plan araçları (haftanın terazisi = zaman bütçesi) |
| `#/teklifler` Onaylar | `teklif-liste`, `teklif-form` | King Onaylar (`yetki`) + Gün › Sen «Ne yapsam?» |
| `#/ayarlar` Ayarlar | §10.2 | §10.2 |

### 10.2 Ayarlar → yeni yer

| HKM ayar bölümü | Kartlar | Yeni yeri |
|---|---|---|
| Yapay zekâ ve bütçe (`yapayzeka`, `butce`, `web`) | `baslarken`, `saglayicilar` (anahtarlar), `gorevler` (görev → model), `butce` (aylık tavan, kur; `/api/budget`), `king-ayar`, `web-ayar`, `web-dene` | Modül › Ayarlar › **King ve bağlantılar**: model seçimi, aylık tavan. Anahtarlar, görev ataması, web araması → Atölye › Yapay zekâ |
| Kanallar ve cihazlar (`kanallar`, `cihazlar`) | `kanallar` (WhatsApp, Telegram, SMS; `/api/channels`), `ucbag`, `esle`, `cikis`, `esleme` | King ve bağlantılar: kanal aç-kapa, «Bu cihazı bağla». Jetonlar ve webhook → Atölye › Kanallar |
| Eşikler (`esikler`) | `esikler` (`/api/thresholds`) | King ve bağlantılar: birkaç kaydırıcı. Ham anahtarlar → Atölye |
| Sunucu (`sunucu`) | `ritim`, `kutu`, `bakim`, `modul-yedek`, `gizlilik` | Atölye › Sunucu; `modul-yedek` modülün Hesap › yedeklerinde zaten var |

Modüllerin Ayarlar'ı bugün (`ayarlar.js` `BOLUMLER`, 13 bölüm): Profiller,
Görünüm, Arka plan, Ses ve müzik, Animasyon, Erişilebilirlik, King, Minikler,
Bildirimler, Planlama (`/api/planlama`), Modül ayarları, Güvenlik,
Bağlantılar. HKM, model, bütçe, kanal ve eşik hiçbirinde yok. **F1:** «King»
bölümü «King ve bağlantılar» olur; sahiplik `hkmbag.js`'deki cihaz sahibi
(`lifeos.hkm.sahip.<modül>`) ile belirlenir, yeni bir kimlik kurulmaz.

### 10.3 Atölye menüsü (F7, yalnız sahip)

Sol menü, dört grup, iç içelik en çok iki kat:
- **Ofis:** Kat şeması · King kuyruğu · İş ver · İşler · Kayıtlar · Bilgi deposu
- **Yapay zekâ:** Sağlayıcılar ve anahtarlar · Görev → model · Web araması
- **Kanallar:** WhatsApp · Telegram · SMS · Cihaz eşleme
- **Sunucu:** Ritim · Kutu · Bakım · Gizlilik · Tanı · Dijital ikiz · Karar geçmişi · Para (açık soru çözülene kadar)

### 10.4 F7'de birlikte değişecek yerler

- `brand/ortak/kabuk.js` 66-72 (`MODULLER.mer`, `SIRA`), 758-811 (sistem
  seçici, modül menüsü).
- `sistem/sunucu.py` 449-454 (`KARTLAR`, HKM kartı), 1197-1258 (giriş
  sayfası HKM durumu).
- `HKM/daemon.py` 817, 940 (web/index.html servis; Atölye'de kalır).
- Testler: `HKM/tests/test_web.py`, `test_daemon.py` (355), `test_baslat.py`
  (73); `tools/entegre.js` (HKM yüzü adımları); `.github/workflows/ci.yml`
  (290, 331).
- `uygulama/ios/LifeOS/Web/giris/index.html` (HKM kartı).
- Telefon iskeleti (`sistem/telefon.py`) HKM'yi zaten içermiyor.

## 11. F1 ve F2 notları (2026-11-03)

- **F1:** Modül › Ayarlar › «King ve bağlantılar». Veri katmanı
  `brand/ortak/merkezayar.js` (kabul: `tools/merkezayar_kabul_test.py`).
  Yalnız `/api/config`'in görünen alanları; sır yok, aralık dışı HKM'ye
  gitmez. Gerçek HKM'ye yazma henüz elle denenmedi.
- **F2:** Gün, giriş sunucusunda `/gun/` (`sistem/gun.py`; kabul:
  `tools/gun_iskelet_kabul_test.py`). Yeni port yok. Giriş şeridinin ortası
  Gün; HKM'yi başlatan düğme «M · Merkez» ucu oldu. Kabukta `MODULLER.gun`
  (harf G, Merkez'in rengi, kubbe şekli), `SIRA` beş sistem.
- **F3 için kritik:** Gün 4180 kökenindedir; AYS, SPİ ve ESP'nin
  `localStorage`'ını OKUYAMAZ (kök = port; `sistem/sunucu.py` başındaki not).
  Merkez kapalıyken «yerel özet», giriş kartlarının minik özetiyle aynı yoldan
  gelmeli (`hesap.js` söz 16, `data-ozet`): modül özetini sunucuya bırakır,
  Gün oradan okur. Yeni bir depo icat edilmez.
- **F7 listesine ek:** hesap kapısındaki tanıtım kutularında da «Merkez ·
  Günün özeti» yazıyor (`brand/ortak/hesap.js`).

## 12. F3a (2026-11-03)

- **Veri yolu:** Gün, giriş sayfasıyla ortak oturum çerezinden (`lifeos_hesap`,
  host'a bağlı, port'a değil) hesap sunucusunu okur: `GET /api/hesap/tekgun`
  (sunucu sözü 22, modüllerin bugünkü blokları) ve `GET /api/hesap/gunluk`
  (söz 25, günlük özet). Yeni depo yok, yeni port yok.
- **Saf katman:** `brand/ortak/gunveri.js` (`serit`, `siradaki`, `karne`;
  kabul `tools/gunveri_kabul_test.py`). Karnede üç hal: yapıldı, kayıt yok
  (modül yayınladı, o gün iş yok), veri yok (modülden bilgi yok).
- **King aracı (§2b) tamam:** niyet, enerji (1–5), iç hava hesap sunucusunda
  `gun/kayit` (sunucu sözü 26; ad bilerek `/bugun` ile bitmez, Siri özeti o
  soneki toplar). Okuma `GET /api/hesap/gunkayit`; dünkü kayıt bayat ve boş.
  King: `gun_kaydi` (oku) ve `gun_kaydi_yaz` (yaz; önizlenir, onaylanır, geri
  alınır; verilmeyen alan değişmez), kuralla da çağrılır. Gün sayfası aynı
  kaydı okur ve yazar. Sınava 6 cümle (306 cümle, 299 geçti; 6 yeni cümle yeşil).
- **Açık 2 · SPİ günlük özeti:** SPİ `gunluk` yayınlamıyor (yalnız AYS ve
  ESP); uyku, beslenme, hareket satırları bu yüzden «veri yok».
- **Ofis notu:** ofis, çalışma ağacı kirliyken görevi başlatmadan bekledi
  (söylemeden). Ofise görev vermeden önce ağaç temiz olmalı.

## 13. HKM arayüzü kalktı, Gün güçlendi (2026-11-03)

Kullanıcı: «HKM'yi komple kaldır, ayarlara taşı; günü daha güzel, profesyonel,
modelle, daha işlevli yap; sormadan sıra sıra yap».

- **F7 öne alındı:** kabukta Merkez satırı, giriş şeridindeki Merkez ucu ve
  hesap kapısındaki Merkez kutusu kalktı. `:4200/` kısa bir bilgi sayfası
  (`HKM/web/merkez.html`); eski yüz yalnız `/atolye`'de **arşiv** (Motto,
  Para, ofis ekranları yeni yer bulana dek; verileri yerinde). Motor aynen.
- **Ayarlar › Merkez:** eski HKM Ayarlar'ının hepsi altı sekmede, açık şemayla
  (`MerkezAyar.sekmeler`, `alanYama`); sır okunmaz. Merkez'i başlatma ve
  bağlama da burada (`POST /api/merkez/ac`, modül sunucusu, yalnız kendi sayfası).
- **Gün:** üst kartta günün cümlesi — satırları Gün'ün kodu kurar, cümleyi
  Merkez'deki model yazar (`/api/gun/cumle` → HKM `/api/king/cumle`, tür
  «gun»); model yoksa kodun cümlesi, etiketiyle; aynı satırlar için bir kez
  sorulur. İlerleme halkası (biten/toplam, hesaplandı). **Gün planım:** kendi
  işlerin (ad, isteğe bağlı saat, bitti) `gun/kayit` içinde (en çok 20);
  şeritte dördüncü sıra; «Şimdi ne yapsam?» onları da görür; King okur ve
  yazma aracı planı silmez.
- **Açık:** Motto, Para ve ofis ekranlarının kalıcı yeri (Gün › Sen ve
  Ayarlar › Merkez adayları); SPİ günlük özeti; King'e «plana iş ekle» aracı.
