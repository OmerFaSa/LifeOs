# LifeOS telefon uygulaması (iOS) ve Android

**Neden.** Tarayıcı ekran kapalıyken konum vermez; koşuda telefon cepteyken
SPİ'nin canlı rotası duraklar. Ana ekrana eklenen web uygulaması bunu aşamaz.
Depo sahibinin kararı (2026-10-04): üç modül tek bir iPhone uygulamasında,
Mac ve ücretli geliştirici hesabı olmadan (AltStore). AGENTS.md §1.3'teki
«telefon kabuğu istisnası» bu belgeye dayanır.

## Nasıl çalışır

```
uygulama/ios/
  project.yml            XcodeGen tanımı (Xcode projesi depoda durmaz, CI üretir)
  hazirla.py             dist/ → LifeOS/Web/ (ortak görseller tek kopya)
  LifeOS/Uygulama.swift      açılış: üç sunucu, sonra kabuk
  LifeOS/YerelSunucu.swift   sistem/sunucu.py'nin telefondaki ikizi
  LifeOS/KabukDenetleyici.swift  tek web görünümü, izinler, indirme
  LifeOS/KonumKoprusu.swift      ekran kapalıyken konum (CoreLocation)
  LifeOS/KaliciTampon.swift      sayfanın yazmadığı noktalar diskte
  LifeOS/BildirimKoprusu.swift   yerel bildirim (SPİ hatırlatmaları, ESP hatırlatıcıları)
  LifeOSTests/               simülatörde koşan testler
.github/workflows/ios.yml    macOS'ta derle → sına → imzasız IPA → sürüm sayfası
```

- **Web kodu değişmez.** Uygulama üç modülün derlenmiş tek dosyasını
  (`AYS/SPI/ESP dist/`) içine alır. Kabukta çerçeve ve üçüncü taraf paket yok;
  yalnız Apple'ın kitaplıkları (UIKit, WebKit, Network).
- **Giriş sayfasıyla açılır.** Uygulama bilgisayardaki giriş sayfasının aynısıyla
  (`:4180`, modül kartları) başlar; sayfa derlemede `sistem/sunucu.py`
  `giris_html(telefon=True)`'dan üretilir: aynı stil ve kartlar, HKM kartı,
  güncelleme kutusu ve bilgisayarın API'leri yok.
- **Yerel sunucu, aynı kapılar.** Telefonun içinde (yalnız loopback)
  `127.0.0.1:4173` AYS, `:4183` SPİ, `:4193` ESP. Bilgisayardaki gibi ayrı
  köken, ayrı depo; `kabuk.js`'in modül geçişi olduğu gibi çalışır. `127.0.0.1`
  güvenli kökendir: kamera ve konum burada çalışır.
- **Ortak görsel tek kopya.** `img/seviye` ve `img/marka` üç modülde aynıdır;
  uygulamada bir kez durur (~110 MB yerine ~320 MB olurdu).
- **Web kodu bilgisayarsız güncellenir.** Uygulama açılışta ve öne gelişte
  `web-son` sürümüne bakar (`LifeOS/WebGuncelleme.swift`, paket `web_paket.py`).
  Yalnız uygulamanın içindekinden farklı dosyalar iner, her biri özetle doğrulanır,
  hepsi inince tek yazımla geçilir; yeni kod sonraki açılışta ya da modül
  değişince görünür. Paket yalnız testlerden geçen derlemeden yayımlanır. Yeni
  sürüm iki açılışta ayağa kalkmazsa uygulama içindeki sürüme döner ve o sürümü
  atlar. Yalnız kod iner; kayıtlara dokunulmaz, hiçbir kayıt gönderilmez.
  **Swift değişirse** yine AltStore gerekir; sayfa yeni bir köprü istiyorsa
  `project.yml › LifeOSWebUyum` artırılır, eski kabuk o paketi almaz.
- **Veri telefonda.** Uygulamanın verisi bilgisayardakinden ayrıdır; taşımak
  için modüllerin «Yedek indir / Yedek yükle» düğmeleri (indirme paylaş
  menüsüyle Dosyalar'a kaydedilir). HKM telefonda yoktur; modüller onsuz
  çalışır (§1.4).

## Her yerden erişim (King evden uzakta)

Model ve Merkez bilgisayarda kalır; API anahtarı ve ücret yoktur. Bilgisayar, telefon ve tablet aynı
Tailscale ağına girer. Bilgisayarda Hesap › cihaz bağlama › «Her yerden erişimi aç» (ya da
`python sistem/uzak.py --ac`), Tailscale yönetiminde MagicDNS ve HTTPS açık olmalı. Cihazda sunucu
adresi olarak bilgisayarın `.ts.net` adı yazılır; admin girişinden sonra Merkez kendiliğinden bağlanır.
Android'de yerel uygulama yok, modüller web uygulaması olarak kurulur (aşağıda). Bilgisayar açık kalmalı ve uyumamalıdır;
kapalıyken AI olmaz, kayıtlar cihazda sıraya girer.

Hesap › Bağlantılar › Her yerden erişim bağlantının hâlini söyler. Bilgisayarda aynı sayfada aç, kapat ve
«Bilgisayar açılınca LifeOS başlasın» vardır: varsayılan kapalı, kullanıcının Windows başlangıç listesine tek
satır yazar, kapatınca iz kalmaz. Oturum açılmadan başlamaz. LifeOS uygulaması sunucuyu kendisi başlattıysa
penceresi kapanınca Merkez de kapanır; açılışta başlamışsa pencere kapansa da açık kalır.

Kesilme davranışı: serve kapıları Tailscale'de durur, LifeOS kapanınca kalkmaz. LifeOS kapalıyken dış adres boş
502 döner: daha önce açılmış modül kopyasından açılır, hesap «ulaşılamıyor» der; cihazda hiç açılmamışsa boş
sayfa görünür. LifeOS açıkken Merkez düşerse bir dakikada kendisi kalkar. Yerel model bir cevabı en çok 120 sn
bekler, mesajlar sırayla gider. Samsung ve Android'de gerçek cihazda henüz denenmedi: Özel DNS ayarı «Kapalı» ya
da «Otomatik» olmalı, Tailscale pil kısıtlamasından çıkarılmalı (kurulum sayfası ve Hesap › Her yerden erişim söyler).

## Android telefon ve tablet (web uygulaması)

Karar (2026-11-06, depo sahibi): yerel APK değil, kurulabilir web uygulaması. §1.3'e istisna gelmez. iPhone'daki kabukla
farkı: üç ayrı simge (üç köken), ekran kapalıyken rota yok, kapalı uygulamaya zamanlı bildirim yok, modül en az bir kez
çevrimiçi açılmış olmalı. Bir kez açılan modül bilgisayar kapalıyken de açılır (`sw.js`), kayıtlar cihazda sıraya girer.

Akış: Hesap › Cihazlar › Yeni cihaz bağla › QR. Kurulum sayfası sırayla Tailscale adresini (sertifika istemez), `.local`
adını ve IP'yi dener; ulaştığı ilkine geçer, hesaba bağlar. Hiçbirine ulaşamazsa Tailscale'i ya da sertifikayı kurdurur
ve 2 saniyede bir yeniden dener. Modül açılınca altta «Bu modülü ana ekrana kur» şeridi çıkar (`pwa.js` söz 6); kurulum
yine tarayıcının onayıyla olur, «Şimdi değil» o modülde bir daha sormaz. Oturum üç modülde ortaktır (aynı ad, çerez).
Bilinen ama burada denenmemiş davranış: Chrome kurulumda Google'ın sunucusundan WebAPK ister (modül adı ve adres gider,
kayıt gitmez); özel adreste üretilemezse ana ekran kısayolu koyar.

## Aşamalar

| | Durum | Ne |
|---|---|---|
| 1 | yazıldı | Kabuk: üç modül uygulamada, yerel sunucu, kamera, ön planda konum, yedek indirme. CI simülatörde sınar. |
| 2 | yazıldı | **Ekran kapalıyken rota:** `KonumKoprusu.swift` sayfanın `navigator.geolocation`'ını CoreLocation'a bağlar (arka plan konum kipi). Arka plandayken noktalar telefonda birikir, öne gelince kendi sırası ve zamanıyla SPİ'ye gider; `canli.js` aynı arayüzden okur. Uygulamada ekran kilidi istenmez, «ekranı açık tut» denmez (`window.LIFEOS_YEREL`). Her sayfa kimlik taşır: modül değişince eski izleyici biter, GPS durur. |
| 2b | yazıldı | **Nokta kaybolmaz:** izlenen her nokta diske de yazılır (`KaliciTampon.swift`); SPİ taslağını depoya yazınca «buraya kadar yazdım» der (`yazildi`), o kısım silinir. **iOS web sürecini öldürürse** GPS durmaz, noktalar diske akmaya devam eder; yeniden açılan sayfa sorar (`kurtar`) ve kayıt kaldığı yerden sürer (süre ve yol kesilmez). **Uygulamanın kendisi kapanırsa** noktalar diskte kalır; SPİ açılınca kayda eklenir, kayıt duraklatılmış gelir, süre son noktaya dek sayılır. Önceden bu iki durumda ekran kapalı kısım kayboluyordu. |
| 2c | yazıldı | **Konum neden gelmiyor, ekran söyler:** köprü durumunu sayfaya bildirir (izin soruldu mu · Konum Servisleri · Kesin Konum · GPS · gelen konum sayısı); SPİ «Konum bekleniyor…» yerine nedenini yazar. Durum hiç gelmezse «konum servisi cevap vermedi» der: istek köprüye ulaşmamıştır. Kullanıcının ilk telefon denemesinde (2026-10-05) ekranda yalnız «Konum bekleniyor…» vardı ve Ayarlar › LifeOS'ta Konum satırı yoktu; neden henüz görülmedi. |
| 3 | web uygulaması (2026-11-06) | Android yerel kabuk yazılmadı; 2026-10-07'deki «yapılmayacak» kararı değişti: Android kurulabilir web uygulamasıyla açılır (yukarıda). |
| 4 | yazıldı (2026-10-09) | **Yerel bildirim:** WKWebView'da tarayıcı bildirimi yok; SPİ hatırlatmaları uygulamada hiç gelmiyordu. `BildirimKoprusu.swift` sayfanın isteğini iOS'un yerel bildirimine çevirir (`brand/ortak/bildirim.js`): SPİ hatırlatma saatleri ve ESP hatırlatıcıları (vade günü 09:00) önümüzdeki 7 güne kurulur, uygulama kapalıyken de gelir; her açılış ve arka plana geçiş pencereyi ileri taşır. Modül sayfanın kapısından bilinir, biri ötekinin bildirimine dokunamaz; iOS'un 64 sınırının altında modül başına üst sınır. İzin yalnız kullanıcı açınca sorulur. Bildirime dokununca o modül açılır. |
| 5 | yazıldı (2026-10-09) | **Ana ekran kısayolları:** uygulama simgesine basılı tutunca AYS · SPİ · ESP doğrudan açılır (Info.plist `UIApplicationShortcutItems`; yetki gerektirmez). **AYS telefon bildirimi:** Ofis › Ofis ayarları › Telefon bildirimi — her gün seçilen saatte günün planı (yükü sıfır istisna günü, örneğin tatil, atlanır), hedefin son günü ve önceki akşam, sınavdan bir gün önce akşam (yalnız kullanıcının profilde yazdığı tarih; planın tahmini tarihi bildirilmez). Modül başına sınır SPİ 30 · ESP 16 · AYS 16 (toplam 62 < 64). |
| 6 | yazıldı (2026-10-09) | **Bildirim temizliği ve rozet:** bir modül açılınca ve öne her gelişinde o modülün iPhone bildirim ekranında duran bildirimleri kalkar (kurulu olanlara ve öteki modüllere dokunulmaz). Uygulama simgesindeki sayı üç modülün Onaylar'da bekleyen önerilerinin toplamıdır (karar 167, PC'deki kurulu uygulamayla aynı sayı); kabuk tarayıcının `navigator.setAppBadge`'ini kendisi sağlar, modül kodu değişmez. Rozet için bildirim izni gerekir. |
| 7 | yazıldı (2026-10-09) | **Bildirimdeki düğmeler:** SPİ hatırlatmasında «Aldım / İçtim / Yaptım / Ölçtüm», ESP hatırlatıcısında «Yapıldı», ikisinde de «15 dk ertele». Uygulamayı açmadan basılır; işaret (kilit açık olmalı) telefonda sıraya girer, kabuk hiçbir kayda yazmaz. Modül açılınca sırayı alır, kendi koduyla ve basıldığı anla yazar, ancak yazdıktan sonra sıradan siler (işaret kaybolmaz). Hatırlatma silinmişse ya da zaten yapılmışsa işaret uydurulmaz. «İçtim» bir işarettir, su miktarı yazmaz. Ertelenen bildirim, iş işaretlenince kalkar. |
| 8 | yazıldı (2026-10-09) | **Kurulu bildirimler ve sessiz saat:** AYS (Ofis ayarları › Telefon bildirimi), SPİ (hatırlatma penceresi) ve ESP'de (Profil) «Kurulu bildirimler» bu modülün telefonda bekleyen bildirimlerini saatiyle listeler. «Bunu sil» o tek bildirimi siler ve modül yeniden kurduğunda da kurmaz (zamanı geçene dek, bu cihazda); «Hepsini sil» şu an kurulu olanları siler, yeni günlerinki yine kurulur; «Geri al» silineni geri kurar. Sessiz saat ve tür ayarı artık ESP'de ve uygulamadaki AYS'de de var; değişince kurulu bildirimler hemen yeniden kurulur. |
| — | yapılmadı (2026-10-09) | **Apple Sağlık'ı uygulamanın kendisi okumaz:** HealthKit bir yetki (entitlement) ister; ücretsiz Apple kimliğiyle AltStore'un bu yetkiyi verdiği doğrulanamadı ve yetki tutmazsa AltStore kurmayı reddeder (güncelleme yolu kırılır). Yerine Hesap › Kısayollar › «Apple Sağlık’tan her sabah» tarifi: Kısayollar otomasyonu Sağlık örneğini okur, gelen kutusuna yollar, SPİ Onaylar'a bırakır. |

## Yeni bilgisayar

Eski bilgisayarda PowerShell'e yapıştır; şifreyi iki kez yaz. LifeOS açıksa betik
onu kendisi kapatır, paket bitince yeniden açar; şifreli tek dosya masaüstüne çıkar:

```powershell
py $env:USERPROFILE\LifeOS-Sistem\sistem\tasi.py --paket
```

Yeni bilgisayarda PowerShell'e yapıştır:

```powershell
irm https://raw.githubusercontent.com/OmerFaSa/LifeOs/main/sistem/kur.ps1 | iex
```

Python, Git, depo, masaüstü uygulaması ve kısayol kurulur; dosya masaüstünde,
İndirilenler'de ya da USB'de ise açılsın mı diye sorar. Pakette hesap deposu, kök
sertifika, HKM verisi ve ayarı (kasadaki API anahtarları dahil), arka plan, müzik
ve uygulama depoları vardır; önbellek ve oturum çerezi yoktur (yeniden girilir).
Var olan hiçbir dosya silinmez: `.once-<tarih>` adıyla kenara alınır. Kök sertifika
taşındığı için telefon ve tablete sertifika yeniden kurulmaz; bilgisayarın adresi
değiştiyse yalnız yeni kodla bağlanır.

## Yeni cihaz (telefon, tablet)

Bilgisayarda Hesap › Cihazlar › Yeni cihaz bağla: QR çıkar (ev ağı kapalıysa aynı
sayfadan açılır). Cihazın kamerasıyla okut; açılan kurulum sayfası yalnız o cihazın
adımlarını gösterir (`sistem/sunucu.py` `telefon_kurulum_html`):

- **iPhone/iPad (3 adım):** «LifeOS profilini indir» › Ayarlar › İndirilen Profil ›
  Yükle › Genel › Hakkında › Sertifika Güven Ayarları › «LifeOS Yerel Kök». Tek profil
  (`/lifeos.mobileconfig`, `telefon.profil`) kök sertifikayı ve AYS · SPİ · ESP ana
  ekran simgelerini birlikte kurar; «Ana Ekrana Ekle» üç kez yapılmaz. Güven anahtarını
  Apple elle açtırır (elle kurulan her kök için).
- **Android telefon/tablet:** Tailscale kuruluysa adım yok, QR doğrudan bağlar. Değilse Tailscale'i kur ya da
  yalnız ev ağı için sertifikayı indir › Ayarlar araması «CA sertifikası» › yükle; sayfa kendiliğinden devam eder.
  Her modülde altta «Kur» (çıkmazsa Chrome ⋮ › Ana ekrana ekle).

Kök sertifika yalnız LifeOS adreslerine (`.local`, `localhost`, özel IP aralıkları) etki eder; tarayıcının başka
sitelerine etkisi yoktur (`sistem/telefon.py` `kok_kisiti`). 2026-11-06'dan önce kurulan kök kısıtsızdı: LifeOS onu
açılışta yenisiyle değiştirir ve Hesap › Cihazlar bir kez söyler. O cihazlarda yeni sertifikayı kur, eskisini kaldır
(Android: Ayarlar › Güvenlik › Kullanıcı sertifikaları; iPhone: Ayarlar › Genel › VPN ve Cihaz Yönetimi). Yeniden
kurulana dek ev ağı adresi o cihazda sertifika uyarısı verir; Tailscale adresi etkilenmez, kendi sertifikası vardır.

Sertifika kurulunca cihaz kendiliğinden hesabına bağlanır. iPhone'da «LifeOS
uygulamasında aç» adresi ve kodu uygulamaya taşır. Adres değişirse sunucu sertifikası
kendiliğinden yenilenir; kök aynı kaldığı için cihazda bir şey yapılmaz.

**Güncelleme: her cihazda 0 dokunuş.** Giriş sayfasındaki güncelleme kutusunda
«Kendiliğinden güncelle» açıksa PC her gece 04:00'te (kapalıysa açılınca) kendini
günceller (Sistem planlaması › Güncelleme, «kur» açık). Tablet ve tarayıcıdaki telefon
kodu PC'den alır; modüllerin `sw.js`'i yeni sürümü sonraki açılışta devralır.
iPhone uygulaması web kodunu ayrıca kendisi indirir (aşağıda).

## Kurulum (Windows + iPhone, ücretsiz — AltStore)

Bir kez:

1. **Bilgisayara:** Apple'ın sitesinden **iTunes** ve **iCloud** (Microsoft
   Store sürümü değil), sonra **AltServer** (altstore.io). AltServer görev
   çubuğunda simge olarak çalışır.
2. iPhone'u kabloyla bağla, «Bu bilgisayara güven». iTunes'ta iPhone için
   «Wi-Fi üzerinden eşzamanla»yı aç (sonraki yenilemeler kablosuz olsun).
3. AltServer simgesi › **Install AltStore** › iPhone'unu seç › Apple kimliğin.
   (Kimliği sen girersin; ikinci bir Apple kimliği kullanmak daha temiz olur.)
4. iPhone'da: Ayarlar › Genel › **VPN ve Aygıt Yönetimi** › kimliğine güven.
   iOS 16 ve sonrası: Ayarlar › Gizlilik ve Güvenlik › **Geliştirici Kipi**'ni
   aç (telefon yeniden başlar).

Uygulamayı kur (bir kez):

5. iPhone'da kurulum sayfasını aç (Hesap › Cihazlar › Yeni cihaz bağla'daki QR) ›
   **AltStore'a LifeOS'u ekle** (`altstore://source?url=…`; adres kopyalanmaz). Elle:
   AltStore › Sources › **+** ›
   `https://github.com/OmerFaSa/LifeOs/releases/download/ios-son/altstore-kaynak.json`
6. AltStore › Browse › LifeOS › **Free**.
7. **Haftalık yenileme kendiliğinden olsun:** Kısayollar › Otomasyon › **+** ›
   Günün Saati (ör. 04:00, her gün) › eylem: AltStore › **Refresh All Apps** ›
   «Çalıştırmadan önce sor» kapalı. AltServer'ı LifeOS kendisi açar
   (`sistem/baslat.py`, kuruluysa ve kapalıysa); telefon evdeki Wi-Fi'dayken yenilenir.

Sonra: web kodu bilgisayarsız kendisi gelir. Swift değişirse AltStore › **My Apps**'te
LifeOS'un yanında **Update** belirir; evdeyken bir kez dokun (yenileme otomasyonu
güncelleme kurmaz). Veri silinmez.

Kaynak her derlemede CI'da üretilir (`uygulama/ios/kaynak.py`): sürüm ve izin
metinleri derlenmiş uygulamanın kendi Info.plist'inden okunur (AltStore izinler
uyuşmazsa kurmayı reddeder); her derleme kendi numarasını taşır
(`github.run_number`). Elle kurulum da çalışır: sürüm sayfasından
`LifeOS.ipa` → AltStore › My Apps › **+**.

**Sınırlar (Apple'ın, bizim değil):** ücretsiz kimlikle uygulama **7 günde bir
yenilenmeli**. Yukarıdaki otomasyon bunu, iPhone ve AltServer'lı bilgisayar aynı
Wi-Fi'dayken her gece yapar (2026-11-05'e dek AltServer Windows açılışında başlamıyordu,
yenileme olmuyordu; şimdi LifeOS onu açar); yenilenmezse uygulama açılmaz ama **veri
silinmez**, yenileyince geri gelir. Aynı anda en çok 3 böyle uygulama.
Yıllık 99 $'lık geliştirici hesabıyla TestFlight'a geçilebilir (90 gün,
yenileme derdi yok).

**7 günlük yenilemede de bilgisayar istemiyorsan: SideStore (denenmedi; 2026'da iOS 26.4
bilgisayarsız yenilemeyi bozdu diye raporlar var, önce durumuna bak).** AltStore'un
çatalıdır; bilgisayar yalnız ilk kurulumda gerekir, sonra yenileme telefonda yerel
bir VPN üzerinden yapılır (LocalDevVPN aç, SideStore › Refresh All). Eşleştirme dosyası
iOS güncellemesi ya da sıfırlama sonrası bozulabilir; o zaman bilgisayar yine gerekir.
Apple kimliğini girdiğin için ikinci bir kimlik kullan. Rehber: docs.sidestore.io.
Web kodu güncellemeleri bu seçimden bağımsızdır, ikisinde de bilgisayarsız gelir.

## Denetim

`.github/workflows/ios.yml` her `uygulama/ios/` ya da `dist/` değişikliğinde:
simülatörde `YerelSunucuTests` (sayfa, MIME, parça isteği, kökün dışı, gizli
dosya, yöntem), `KabukTests` (üç modül uygulamada açılır, `isSecureContext`,
konum arayüzü), `BildirimKoprusuTests` (kapıdan modül, yalnız kendi bildirimi,
üst sınır, geçmiş kurulmaz; gerçek SPİ sayfasından istek) ve `KonumKoprusuTests` (arka planda birikme, diskteki tampon;
gerçek SPİ sayfasında web süreci ölünce kaydın sürmesi, uygulama kapanınca
noktaların kayda eklenmesi), `WebGuncellemeTests` (yalnız farklı dosya iner, bozuk dosya
sürümü değiştirmez, uyumsuz paket alınmaz, bozuk sürüm geri alınır). Telefonda deneme
kullanıcıdadır: kurulum, kamera izni, konum, web güncellemesinin gerçek ağda inmesi.
