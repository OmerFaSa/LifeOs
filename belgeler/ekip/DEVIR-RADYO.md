# Devir — internet radyosu, tık sesleri, «Animasyonlar» ayarı

> Yazan: Claude Code (masaüstü), 2026-10-02 gece. Kullanıcı: «bunu sonra CLI
> Claude'a yaz». Kod YAZILMADI; aşağıdaki her şey yapılacak iş + bulgulardır.
> Son durum commit'li: 02732fb (ayraç animasyonu, sayfa sonu yalnız Genel'de).

## Kullanıcının istekleri (sözü sözüne)

1. «İnternet chill radyo — Türkçe pop, Türkçe slow, İngilizce pop, İngilizce
   slow, İngilizce rap, Türkçe rap gibi radyo türleri olacak.»
2. Önceki mesajdan: «ses efektleri açma kapatma; tıklama kısık, tok, kısa.»
3. «Sol taraftaki bölümler kartı hâlâ üzerine geldiğimde aniden var oluyor,
   animasyonla açılmıyor.»

## 3 · Kenar «aniden» açılıyor — NEDEN ve ÇÖZÜM

Kullanıcının Windows'unda «Animasyon efektleri» KAPALI (ölçüldü:
`SystemParameters.ClientAreaAnimation=False`, `MinAnimate=0`). Chrome bunu
`prefers-reduced-motion: reduce` bildirir; `brand/ortak/base.css` bu durumda
bütün geçişleri .001ms'ye indirir. Kenarın 64→208 px genişlemesi (kabuk.css
`html.kenar-dar .site--v5 > .kenar` width geçişi) bu yüzden ANINDA olur. Şu an
azaltılmış kipte yalnız solmalar var (kabuk.css «PROFESYONEL KABUK §4», «AYRAÇ»).
Kullanıcı üç kez animasyon istedi → LifeOS'a kendi ayarı:

- **«Animasyonlar: Tam · Az · Sistem»**, varsayılan **Tam** (kullanıcı kararı
  sayılır; nedenini koda yaz). Tercih `localStorage` (`lifeos.hareket`), üç
  modülde ortak.
- Uygulama (tek yerde, `brand/ortak/hareket.js` ya da yeni ortak dosya, ilk
  çizimden ÖNCE): `document.styleSheets` içindeki her `CSSMediaRule`'da
  `prefers-reduced-motion: reduce` geçen kuralın `media.mediaText`'i
  değiştirilir — Tam: `not all`; Az: koşul düşülür (`all` ya da kalan
  `(min-width:…)`); Sistem: özgün metin (WeakMap'te sakla). JS tarafı:
  `matchMedia('(prefers-reduced-motion: reduce)')` ~37 yerde çağrılıyor;
  ya tek bir `LIFEOS.hareketAz()`'a bağla ya da `window.matchMedia`'yı yalnız
  bu sorgu için saran küçük bir katman yaz (hareket.js `azMi`, kabuk.js
  `gecis`, components.js `bolumeGit` vb.).
- **Denetim araçları** (smoke, layout, design, palette…) `reducedMotion:'reduce'`
  ile koşar ve belirli yerleşim bekler: `navigator.webdriver === true` iken
  varsayılan **Sistem** olsun, yoksa ölçümler animasyonun ortasına düşer.
- Ayar yeri: Görünüm paneli (her modülün app.js'indeki `THEMES` / openAppearance)
  ya da aşağıdaki ses panelinin içinde «Animasyonlar» satırı.
- Kenarın genişlemesi Tam'da: `width` geçişi + etiketlerin ve ayraç satırlarının
  sırayla gelişi zaten yazılı (kabuk.css «AYRAÇ»); yalnız sıfırlama kalkınca
  görünür. Kenar açıkken yeniden çizimde dizilişin tekrar oynamaması için
  `.kenar--acik-kaldi` mantığı kabuk.js'te (dokunma).

## 1 · İnternet radyosu

**Kural:** AGENTS §1.3 kod bağımlılığını yasaklar, ağ akışını değil; ama
varsayılan KAPALI, yalnız kullanıcı başlatınca ağa çıkar, kullanıcı verisi
gitmez, internet yoksa sakin bir cümle («Bağlantı yok») — hiçbir ekran bozulmaz.

**Tasarım önerisi (kullanıcının sade tercihine uygun, bkz. sadelik tercihi):**
- Üst şeritte (kabuk.js `ustSerit`, sağ grup) çerçevesiz yuvarlak ♪ düğmesi;
  çalarken küçük modül renkli nokta. Basınca katman (kabuk `katmanAc`):
  tür çipleri (Chill · Türkçe Pop · Türkçe Slow · Türkçe Rap · İngilizce Pop ·
  İngilizce Slow · İngilizce Rap), «Şimdi: <istasyon>», çal/durdur, «Sonraki
  istasyon», ses kaydırıcısı, «Tık sesleri: Açık/Kapalı».
- Yeni ortak dosyalar `brand/ortak/ses.js` + `ses.css` (tools/ortak.py
  listesine ekle, üç `src/index.html` + `src/tests/index.html`; `--yay` sonra
  üç `build.py`). `<audio>` öğesi `document.body`'ye BİR KEZ eklenir (#app'in
  dışında): her yeniden çizimde müzik kesilmesin.
- Modüller ayrı sayfa (4173/4183/4193): modül değişince müzik durur. Tercih
  (tür, ses, «çalıyordu») `localStorage`'da; yeni sayfada `play()` dene,
  tarayıcı reddederse ♪ «dokun, sürsün» hâline geçer (otomatik oynatma kuralı).
- Desktop Chrome **HLS (.m3u8) çalmaz** → yalnız mp3/aac doğrudan akışlar.
  Sayfa http://127.0.0.1 — https ve http akışlar `<audio>` ile çalar (CORS
  gerekmez; Web Audio ile işlenmeyecek).
- Ölü akış: `error`/`stalled` → türün sonraki istasyonuna geç; hepsi düşerse
  «Bu türde şu an çalan istasyon yok». İsteğe bağlı yedek: radio-browser
  API'si (`https://de1.api.radio-browser.info/json/stations/search?tag=…&hidebroken=true&order=clickcount&reverse=true`) — çalışıyor (denendi).

**Aday istasyonlar (radio-browser'dan 2026-10-02; HER BİRİNİ ÇALARAK DOĞRULA):**

| Tür | İstasyon | Akış |
|---|---|---|
| Chill | SomaFM Groove Salad | https://ice6.somafm.com/groovesalad-128-mp3 |
| Chill | FluxFM Chillhop | https://streams.fluxfm.de/Chillhop/mp3-320/streams.fluxfm.de/ |
| Chill | 0R LO-FI | https://0nlineradio.radioho.st/0r-lo-fi |
| Türkçe Pop | Süper FM | https://playerservices.streamtheworld.com/api/livestream-redirect/SUPER_FM_SC |
| Türkçe Pop | Radyo Fenomen | https://live.radyofenomen.com/fenomen/128/icecast.audio |
| Türkçe Pop | Radyo Viva | https://radyoviva.radyotvonline.net/radyovivaaac |
| Türkçe Slow | Powertürk Slow | https://listen.powerapp.com.tr/powerturkslow/mpeg/icecast.audio |
| Türkçe Slow | Joy Türk | https://playerservices.streamtheworld.com/api/livestream-redirect/JOY_TURK_SC |
| Türkçe Slow | Slow Türk | https://radyo.duhnet.tv/ak_dtvh_slowturk |
| İngilizce Pop | Metro FM | https://playerservices.streamtheworld.com/api/livestream-redirect/METRO_FM_SC |
| İngilizce Slow | Joy FM | http://29053.live.streamtheworld.com/JOY_FMAAC_SC |
| İngilizce Rap | 90s90s HipHop & Rap | http://streams.90s90s.de/hiphop/mp3-192/streams.90s90s.de/ |
| Türkçe Rap | — bulunmadı | radio-browser'da `tag=turkish rap`, «Türkçe Rap», «Rap Türk» ara |

Power Türk, Kral Pop, Power FM yalnız m3u8 verdi (Chrome'da çalmaz) — atla.

## 2 · Tık sesleri (Web Audio, dosyasız)

- Varsayılan **kapalı**; ♪ panelinde aç/kapa. Ses bilgi taşımaz: kapalıyken
  her şey aynı çalışır.
- «Kısık, tok, kısa»: tık = 40–60 ms, ~200 Hz'den ~140 Hz'e inen sinüs,
  hızlı zarf, kazanç ≈ 0.04; aç = iki kısa tık yukarı (180→240 Hz), kapa =
  aşağı; kayıt/tamam = tek yumuşak nota. AudioContext ilk dokunuşta kurulur.
- Tetik: `button, [role=button], a, .chip--tap` tıklaması; onay kutusu /
  `aria-pressed` değişince aç/kapa sesi.

## Kurallar ve denetim (AGENTS §2)

- Önce test: `brand/ortak/*.test.js` (ses: tercih kalıcı, kapalıyken
  AudioContext kurulmaz, ölü akışta sonraki istasyon; hareket: üç kip
  mediaText'i doğru değiştirir, webdriver'da Sistem).
- `python tools/ortak.py --yay`, üç `build.py`, üç `runtests.js`, smoke,
  layoutcheck, a11ycheck, palettecheck, SPI designcheck, `node tools/envanter.js`
  (kayıp 0), `node tools/sadelik.js`, `ortak.py --denetle`, `build.py --denetle`;
  sonunda `python tools/sayilar.py --tam --yaz`.
- Commit kimliği kalıcı ayarlanmaz (`git -c user.name=OmerFaSa -c
  user.email=omerfaruksagsozz@gmail.com`); kullanıcının dosyaları (`.gitignore`
  değişikliği, `veri/`, `tools/veri_*.py`, `HKM/db/`) commit'e girmez; push'u
  kullanıcı yapar.
