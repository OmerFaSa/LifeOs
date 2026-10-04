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
  LifeOSTests/               simülatörde koşan testler
.github/workflows/ios.yml    macOS'ta derle → sına → imzasız IPA → sürüm sayfası
```

- **Web kodu değişmez.** Uygulama üç modülün derlenmiş tek dosyasını
  (`AYS/SPI/ESP dist/`) içine alır. Kabukta çerçeve ve üçüncü taraf paket yok;
  yalnız Apple'ın kitaplıkları (UIKit, WebKit, Network).
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
| 2 | yazıldı | **Ekran kapalıyken rota:** `KonumKoprusu.swift` sayfanın `navigator.geolocation`'ını CoreLocation'a bağlar (arka plan konum kipi). Arka plandayken noktalar telefonda birikir, öne gelince kendi sırası ve zamanıyla SPİ'ye gider; `canli.js` aynı arayüzden okur. Uygulamada ekran kilidi istenmez, «ekranı açık tut» denmez (`window.LIFEOS_YEREL`). Her sayfa kimlik taşır: modül değişince eski izleyici biter, GPS durur. **Sınır:** iOS web sürecini öldürürse (nadir) o ana kadar biriken noktalar kayıtta değil, taslak duraklatılmış döner. |
| 3 | sonra | Android (ücretsiz, APK). |

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

Her yeni sürümde:

5. iPhone'da Safari ile GitHub'daki **«LifeOS iOS — son derleme»** sürüm
   sayfasını aç (`github.com/OmerFaSa/LifeOs/releases/tag/ios-son`),
   `LifeOS.ipa`'yı indir.
6. AltStore › **My Apps** › **+** › indirilen `LifeOS.ipa`.

**Sınırlar (Apple'ın, bizim değil):** ücretsiz kimlikle uygulama **7 günde bir
yenilenmeli**. AltStore bunu, iPhone ve AltServer'lı bilgisayar aynı
Wi-Fi'dayken kendiliğinden yapar; yenilenmezse uygulama açılmaz ama **veri
silinmez**, yenileyince geri gelir. Aynı anda en çok 3 böyle uygulama.
Yıllık 99 $'lık geliştirici hesabıyla TestFlight'a geçilebilir (90 gün,
yenileme derdi yok).

## Denetim

`.github/workflows/ios.yml` her `uygulama/ios/` ya da `dist/` değişikliğinde:
simülatörde `YerelSunucuTests` (sayfa, MIME, parça isteği, kökün dışı, gizli
dosya, yöntem) ve `KabukTests` (üç modül uygulamada açılır, `isSecureContext`,
konum arayüzü). Telefonda deneme kullanıcıdadır: kurulum, kamera izni, konum.
