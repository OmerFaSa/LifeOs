# LifeOS telefon uygulaması (iOS)

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
- **Veri telefonda.** Uygulamanın verisi bilgisayardakinden ayrıdır; taşımak
  için modüllerin «Yedek indir / Yedek yükle» düğmeleri (indirme paylaş
  menüsüyle Dosyalar'a kaydedilir). HKM telefonda yoktur; modüller onsuz
  çalışır (§1.4).

## Aşamalar

| | Durum | Ne |
|---|---|---|
| 1 | yazıldı | Kabuk: üç modül uygulamada, yerel sunucu, kamera, ön planda konum, yedek indirme. CI simülatörde sınar. |
| 2 | yazıldı | **Ekran kapalıyken rota:** `KonumKoprusu.swift` sayfanın `navigator.geolocation`'ını CoreLocation'a bağlar (arka plan konum kipi). Arka plandayken noktalar telefonda birikir, öne gelince kendi sırası ve zamanıyla SPİ'ye gider; `canli.js` aynı arayüzden okur. Uygulamada ekran kilidi istenmez, «ekranı açık tut» denmez (`window.LIFEOS_YEREL`). Her sayfa kimlik taşır: modül değişince eski izleyici biter, GPS durur. |
| 2b | yazıldı | **Nokta kaybolmaz:** izlenen her nokta diske de yazılır (`KaliciTampon.swift`); SPİ taslağını depoya yazınca «buraya kadar yazdım» der (`yazildi`), o kısım silinir. **iOS web sürecini öldürürse** GPS durmaz, noktalar diske akmaya devam eder; yeniden açılan sayfa sorar (`kurtar`) ve kayıt kaldığı yerden sürer (süre ve yol kesilmez). **Uygulamanın kendisi kapanırsa** noktalar diskte kalır; SPİ açılınca kayda eklenir, kayıt duraklatılmış gelir, süre son noktaya dek sayılır. Önceden bu iki durumda ekran kapalı kısım kayboluyordu. |
| 2c | yazıldı | **Konum neden gelmiyor, ekran söyler:** köprü durumunu sayfaya bildirir (izin soruldu mu · Konum Servisleri · Kesin Konum · GPS · gelen konum sayısı); SPİ «Konum bekleniyor…» yerine nedenini yazar. Durum hiç gelmezse «konum servisi cevap vermedi» der: istek köprüye ulaşmamıştır. Kullanıcının ilk telefon denemesinde (2026-10-05) ekranda yalnız «Konum bekleniyor…» vardı ve Ayarlar › LifeOS'ta Konum satırı yoktu; neden henüz görülmedi. |
| 3 | yapılmayacak (2026-10-07) | Android: telefon iPhone, tablet tarayıcıdan açar (`LIFEOS2.md` §3). |
| 4 | yazıldı (2026-10-09) | **Yerel bildirim:** WKWebView'da tarayıcı bildirimi yok; SPİ hatırlatmaları uygulamada hiç gelmiyordu. `BildirimKoprusu.swift` sayfanın isteğini iOS'un yerel bildirimine çevirir (`brand/ortak/bildirim.js`): SPİ hatırlatma saatleri ve ESP hatırlatıcıları (vade günü 09:00) önümüzdeki 7 güne kurulur, uygulama kapalıyken de gelir; her açılış ve arka plana geçiş pencereyi ileri taşır. Modül sayfanın kapısından bilinir, biri ötekinin bildirimine dokunamaz; iOS'un 64 sınırının altında modül başına üst sınır. İzin yalnız kullanıcı açınca sorulur. Bildirime dokununca o modül açılır. |
| 5 | yazıldı (2026-10-09) | **Ana ekran kısayolları:** uygulama simgesine basılı tutunca AYS · SPİ · ESP doğrudan açılır (Info.plist `UIApplicationShortcutItems`; yetki gerektirmez). **AYS telefon bildirimi:** Ofis › Ofis ayarları › Telefon bildirimi — her gün seçilen saatte günün planı (yükü sıfır istisna günü, örneğin tatil, atlanır), hedefin son günü ve önceki akşam, sınavdan bir gün önce akşam (yalnız kullanıcının profilde yazdığı tarih; planın tahmini tarihi bildirilmez). Modül başına sınır SPİ 30 · ESP 16 · AYS 16 (toplam 62 < 64). |
| — | yapılmadı (2026-10-09) | **Apple Sağlık'ı uygulamanın kendisi okumaz:** HealthKit bir yetki (entitlement) ister; ücretsiz Apple kimliğiyle AltStore'un bu yetkiyi verdiği doğrulanamadı ve yetki tutmazsa AltStore kurmayı reddeder (güncelleme yolu kırılır). Yerine Hesap › Kısayollar › «Apple Sağlık’tan her sabah» tarifi: Kısayollar otomasyonu Sağlık örneğini okur, gelen kutusuna yollar, SPİ Onaylar'a bırakır. |

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

Güncellemeler (bir kez kaynak ekle, sonra tek dokunuş):

5. AltStore › **Sources** (Kaynaklar) › **+** › şu adresi yapıştır:
   `https://github.com/OmerFaSa/LifeOs/releases/download/ios-son/altstore-kaynak.json`
6. Yeni derleme çıkınca AltStore › **My Apps**'te LifeOS'un yanında
   **Update** belirir; dokun. Veri silinmez.

Kaynak her derlemede CI'da üretilir (`uygulama/ios/kaynak.py`): sürüm ve izin
metinleri derlenmiş uygulamanın kendi Info.plist'inden okunur (AltStore izinler
uyuşmazsa kurmayı reddeder); her derleme kendi numarasını taşır
(`github.run_number`). Elle kurulum da çalışır: sürüm sayfasından
`LifeOS.ipa` → AltStore › My Apps › **+**.

**Sınırlar (Apple'ın, bizim değil):** ücretsiz kimlikle uygulama **7 günde bir
yenilenmeli**. AltStore bunu, iPhone ve AltServer'lı bilgisayar aynı
Wi-Fi'dayken kendiliğinden yapar; yenilenmezse uygulama açılmaz ama **veri
silinmez**, yenileyince geri gelir. Aynı anda en çok 3 böyle uygulama.
Yıllık 99 $'lık geliştirici hesabıyla TestFlight'a geçilebilir (90 gün,
yenileme derdi yok).

## Denetim

`.github/workflows/ios.yml` her `uygulama/ios/` ya da `dist/` değişikliğinde:
simülatörde `YerelSunucuTests` (sayfa, MIME, parça isteği, kökün dışı, gizli
dosya, yöntem), `KabukTests` (üç modül uygulamada açılır, `isSecureContext`,
konum arayüzü), `BildirimKoprusuTests` (kapıdan modül, yalnız kendi bildirimi,
üst sınır, geçmiş kurulmaz; gerçek SPİ sayfasından istek) ve `KonumKoprusuTests` (arka planda birikme, diskteki tampon;
gerçek SPİ sayfasında web süreci ölünce kaydın sürmesi, uygulama kapanınca
noktaların kayda eklenmesi). Telefonda deneme kullanıcıdadır: kurulum, kamera izni, konum.
