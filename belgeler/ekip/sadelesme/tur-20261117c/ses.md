# Ses kalitesi turu (2026-11-17c)

Sahip: «sesleri daha kaliteli yap». Dal sadelesme; commit/push yok. Dokunulan dosyalar yalnız: kabuk/ses.js, kabuk/ses.test.js, kabuk/gece.js (gece.test.js değişmedi; saf parçalar aynı).

## Durum
- [x] Mevcut kod okundu
- [x] Önce ölçümü (OfflineAudioContext, WAV): ölçer `sesTur\olc.js` (scratchpad)
- [x] Değişiklik (ses.js tını ve düzey, gece.js ambiyans)
- [x] Sonra ölçümü
- [x] Kalite kapısı: `node kabuk/ses.test.js` 10/10, `node kabuk/gece.test.js` 6/6, `python tools/ci_yerel.py -k "hesap ekranı"` (Gece sesi ve Arayüz sesleri bu adımda koşar; `-k Gece`/`-k ses` adlı adım yok) yeşil, `-k "Kabuk haritası"` yeşil, `node tools/kabuk_gez.js` hepsi geçti. Canlı bağlam sınaması (gerçek tıklama, AudioContext): ana düğme `bas`, onay kutusu `acik` çaldı, ambiyans çalışıyor, konsol hatası yok.

## Ölçüm yöntemi
Gerçek Chromium (Playwright). Her ses `Kabuk.Ses.cevrimdisi(tur, düzey)` ile 48 kHz stereo; ambiyans `Kabuk.Gece.cevrimdisi(kip, 60)` ile 44,1 kHz, 60 sn işlendi.
- **LUFS-M en yüksek**: ITU BS.1770 K ağırlıklı, 400 ms pencerenin en yükseği (kısa seslerde algılanan yükseklik). Ambiyansta lufs_I bütün; **LRA** 3 sn pencerelerin %10–%95 aralığı.
- **kesilme**: 5 ms içindeki en büyük düşüş (−40 dB üstünden; ani kesilme 20 dB üstü verir). **atak**: zarfın %10→%90 süresi (ms).
- **pay_2_6k**: 2–6 kHz enerji payı (%), sertlik ölçüsü. **merkez**: tını merkezi (Hz).
- **lr_kor / yan_orta**: kanallar arası ilinti (1 mono, 0 tamamen ayrı) ve yan/orta enerji oranı (genişlik).
- **yavaş değişim**: ~1 sn'lik oktav düzeylerinin zaman içindeki std'si (tekdüzelik; yüksek = daha canlı). **tik_yerel**: 1 ms tiz enerjinin ±15 ms komşuluğuna oranı (yalıtık tık).

## Ölçümler (orta düzey, önce → sonra)
Arayüz sesleri:

| ses | LUFS-M en yüksek önce→sonra | tepe_dBFS önce→sonra | sure_ms önce→sonra | atak_ms önce→sonra | kesilme_dB_5ms önce→sonra | pay_2_6k önce→sonra | merkez_Hz önce→sonra | yan_orta_dB önce→sonra |
|---|---|---|---|---|---|---|---|---|
| tik | -39.7 → -34.6 | -19.3 → -14.4 | 47 → 48 | 2 → 1 | 5.4 → 5.4 | 2.2 → 4.5 | 1103 → 1090 | -119.9 → -124.9 |
| sec | -41.9 → -35.7 | -21.2 → -14.7 | 44 → 43 | 2 → 2 | 5.7 → 5.7 | 1.1 → 2.6 | 1053 → 1092 | -118 → -124 |
| ac | -35.3 → -31.6 | -21.1 → -16.5 | 383 → 246 | 39 → 52 | 6.5 → 7.3 | 4.5 → 7.7 | 937 → 1051 | -27 → -26.3 |
| bas | -37.2 → -34.2 | -19.9 → -17.4 | 81 → 82 | 2 → 2 | 3.4 → 3.4 | 0.2 → 0.4 | 660 → 633 | -123.1 → -126.1 |
| acik | -37.2 → -32 | -20.9 → -15 | 130 → 131 | 56 → 56 | 4.3 → 4.3 | 0.2 → 0.3 | 875 → 877 | -123 → -128.2 |
| kapali | -37.9 → -32.5 | -21.2 → -15.8 | 131 → 131 | 56 → 56 | 4 → 4 | 0 → 0 | 659 → 659 | -122.6 → -128 |
| kayit | -31 → -30 | -20.3 → -18 | 370 → 317 | 73 → 70 | 3 → 2 | 0.3 → 0.4 | 1139 → 1146 | -28.4 → -31.4 |
| dogru | -28.7 → -29.2 | -18.2 → -17.6 | 445 → 362 | 87 → 86 | 2 → 2.4 | 0.9 → 0.4 | 1165 → 1151 | -27.3 → -25.5 |
| yanlis | -32.6 → -31.1 | -20.5 → -18 | 384 → 319 | 114 → 111 | 2.7 → 3.5 | 0 → 0 | 380 → 380 | -33.2 → -36.1 |
| ders | -25.9 → -27.7 | -18.2 → -19.8 | 792 → 898 | 270 → 270 | 2.1 → 2.1 | 1.5 → 0.3 | 1029 → 1005 | -27 → -20.4 |
| kapi | -22.5 → -26.9 | -14.2 → -18.3 | 943 → 887 | 55 → 75 | 2 → 2.1 | 1.3 → 0.8 | 813 → 810 | -26.2 → -19.2 |
| uyari | -32.3 → -30.5 | -17.6 → -14.9 | 278 → 261 | 143 → 142 | 2.8 → 3.5 | 0 → 0 | 459 → 450 | -35.4 → -36.2 |
| king | -35.1 → -32.6 | -24.5 → -21 | 421 → 323 | 62 → 62 | 2.6 → 2.5 | 0 → 0 | 1318 → 1323 | -21.6 → -25.7 |
| bildirim | -29.6 → -30.2 | -19.5 → -18.2 | 378 → 400 | 121 → 121 | 3 → 1.7 | 1 → 0.1 | 943 → 928 | -27 → -27.5 |

- **Aile tutarlı:** yükseklik açıklığı −41,9 … −22,5 (19,4 LU) iken −35,7 … −26,9 (**8,8 LU**) oldu. Dört kademe: dokunuş (tik, sec, bas) −34/−36, durum (ac, acik, kapali, king) −32/−33, sonuç (kayit, uyari, yanlis, bildirim, dogru) −29/−31, kutlama (ders, kapi) −27/−28. Önce dokunuş sesleri neredeyse duyulmuyordu, kapı onlardan 17 LU yüksekti.
- **Kırpma yok** (3 düzey × 14 ses). Yüksek düzeyde en büyük tepe −9,7 → −6,9 dBFS (tik; sınırlayıcı −8 dB'de tutuyor).
- **Tık ve kesilme yok:** bütün seslerde 5 ms'de en çok 7,3 dB düşüş (doğal sönüm); atak dokunuşta 1–2 ms; ilk örnek tepenin %0,2'sinden küçük; DC ~0; 90 Hz alçak kesici eklendi.
- **Tizlik düşük:** 2–6 kHz payı en çok %7,7 (ac'ın hava kabarması), çoğunda %1'in altında. 8 kHz üstünde kısmi çalınmaz (takma yok).
- **Daha kısa ve sıkı:** kayit 370→317, dogru 445→362, king 421→323, ac 383→246 ms (duyulur süre, −40 dB).
- **Genişlik:** önce durum seslerindeki iki ses 4–7 cent aralıklıydı ve ortadaydı (titreşim duyulur). Şimdi 2–3 cent, sağa-sola ±0,35 açık; yan/orta ≈ −20…−36 dB (hafif genişlik, mono uyumlu). Dokunuş sesleri mono.

Ambiyans (60 sn):

| ambiyans | lufs_I | LUFS-M en yüksek | tepe dBFS | LRA dB | yavaş değişim dB | spektral değişim dB | merkez Hz | L/R ilinti | yan/orta dB | 2–6 kHz % | tik_yerel dB | kesilme 5 ms dB |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ambiyans | lufs_I | lufs_M_max | tepe_dBFS | lra_dB | yavas_degisim_dB | spektral_degisim_dB | merkez_Hz | lr_kor | yan_orta_dB | pay_2_6k | tik_yerel_dB | kesilme_dB_5ms |
| ambiyans-gece | -36.8 → -38.7 | -34.6 → -32.9 | -21.6 → -22 | 4.4 → 9 | 1.85 → 3.34 | 1.24 → 1.52 | 200 → 267 | 0.01 → 0.57 | -0.1 → -5.7 | 0.6 → 1.5 | 6.8 → 13.7 | 18.6 → 16.2 |
| ambiyans-gunduz | -38.2 → -38.7 | -35.8 → -35.5 | -24.4 → -23.6 | 4.5 → 7.4 | 1.67 → 2.84 | 0.97 → 1.05 | 410 → 524 | 0.01 → 0.53 | -0.1 → -5.1 | 3 → 5.2 | 4.4 → 6.6 | 15.9 → 13.6 |

- **Tekdüzelik azaldı:** LRA 4,4 → 9,0 dB (gece), 4,5 → 7,4 dB (gündüz); yavaş değişim 1,85 → 3,34 ve 1,67 → 2,84 dB. Artık sakin anlar ve esintiler var. En yüksek an önceki kadar: esintiler daha gür değil, sakin anlar daha kısık. Ortalama düzey aynı kademede (ikisi de −38,7 LUFS), arayüz seslerinin 8–12 LU altında.
- **Uğultu azaldı, hava açıldı:** gece merkez 200 → 267 Hz, gündüz 410 → 524 Hz; gecede 1–2 kHz oktavı +5 dB, 2–4 kHz +3 dB.
- **Stereo doğal:** L/R ilinti 0,01 → 0,57 (gece) ve 0,53 (gündüz). Önce iki kanal tamamen ayrı gürültüydü, kafanın içinde boşluk yapıyordu. Şimdi gövde ortada, hışırtı geniş.
- **Cırcır:** doğrusal sıfıra iniş yerine yumuşak hece; kesilme 18,6 → 16,2 dB. tik_yerel 6,8 → 13,7 dB yükseldi. `bul.js` ile yerleri bulundu: hepsi cırcır hecelerinin başı (40–44 ms arayla), tık değil. Sakin anlarda zemin daha kısık olduğu için heceler komşuluktan daha çok ayrışıyor.
- **Döngü dikişi:** gece.test.js'teki dikiş sınaması geçiyor; esinti eğrisinin son noktası ilk noktasına eşit (dikişsiz).
- **Kurulum maliyeti** (ilk açılışta bir kez, ana iş parçacığı): 179 → 192 ms.

## Ne değişti
**kabuk/ses.js**
- FM yerine vurulan cisim tınısı: `TINI` (yumusak, tahta, cam). Her kısmi [oran, pay, sönüm çarpanı]; üst kısmiler daha çabuk söner (atak parlak, kuyruk yuvarlak sinüs); tiz notada üst kısminin payı azalır; 8 kHz üstü yok. Dokunuş ve anahtar sesleri tahta, sonuç ve kutlama sesleri cam.
- Her seste `db`: ölçülen LUFS'u kademesine oturtan düzey (ölçümle ayarlandı). Katman kazançları (`g`) sesin içindeki karışım olarak kaldı.
- `ayri`: 2–3 cent, iki ses sağa-sola açılır (önce 4–7 cent, ortada: titreşim).
- Yankı: 8 ms ön gecikme, 4 ms yumuşak giriş, T60 0,85 sn, kuyruk zamanla koyulaşır (5 kHz'den 300 Hz'e). Önce düz, parlak bir gürültü kuyruğuydu (1,25 sn).
- 90 Hz alçak kesici (uğultu, DC). Gürültü atakları 1 → 2 ms. kayit, dogru, yanlis, king, bildirim ve uyari biraz kısaldı.
- API aynı: `Kabuk.Ses.cal('tik'|'ac'|'tamam')`, `basbug-ses`, `lifeos.ses.arayuz` / `lifeos.ses.duzey`, sessiz saatler, 60 ms ve 1,5 sn kuralları. Yeni dışa açık ad: `Kabuk.Ses.TINI`.

**kabuk/ses.test.js**: fm denetimi yerine tını denetimi (TINI'de var mı), `ayri` ≤ 3 cent, `db` ≤ ±12. Yeni test: tınıda üst kısmilerin payı ve sönümü temelden küçük. 10/10.

**kabuk/gece.js**
- Düzensiz esinti eğrisi (`esintiEgrisi`): 83 sn, 8 kHz tek kanal, 3–9 sn arayla rastgele noktalar, kosinüs geçiş, çoğu an sakin. Rüzgârın ortak dalgasına eklendi, sinüs dalgalanmaları kısıldı. Esince hava ve hışırtının süzgeci de yükselir (renk değişir).
- `gurultu(sn, tip, kor)`: kanallar arası ortak pay (gövde 0,6, esinti 0,35, dere 0,4, hışırtı 0,15).
- Yeni katmanlar: «hava» (1,4 / 1,8 kHz, esintide açılır) ve gecede «uzak cırcır korosu» (4,5 kHz dar bant, çok kısık). Gövde kısıldı, 55 Hz alçak kesici eklendi.
- Yankı: 25 ms ön gecikme, yumuşak giriş, kuyruk koyulaşır.
- Cırcır hecesi: 5 ms açılış, 9 ms tutma, üstel sönüm (önce doğrusal sıfıra iniş). Baykuş: 60–90 ms yumuşak açılış ve hafif titreşim. Kuş cıvıltılarının yarısı hızlı titreşimli (28–46 Hz). Guguk yumuşak açılır. `ton()` `atak` ve `vib` seçeneklerini aldı.
- ANA 0,4 → 0,55 (yeni denge aynı ortalama düzeyi verir). Plan, kip, ayar ve düğme davranışı aynı.
- Eski Safari 8 kHz tamponu reddederse esinti eğrisi bağlamın kendi örnekleme hızıyla kurulur.

## WAV yolları (sahip dinlesin; repo dışında, scratchpad)
- Önce: `C:\Users\ASUS\AppData\Local\Temp\claude\5d634c12ea7c4647\693ee8fd-ac31-49fb-b30d-a0d6485ef7d9\scratchpad\sesTur\once-wav\` (tik.wav … bildirim.wav, ambiyans-gece.wav, ambiyans-gunduz.wav; ambiyans 60 sn)
- Sonra: `C:\Users\ASUS\AppData\Local\Temp\claude\5d634c12ea7c4647\693ee8fd-ac31-49fb-b30d-a0d6485ef7d9\scratchpad\sesTur\sonra-wav\` (aynı adlar)
- Hepsi orta düzeyde, 16 bit stereo (ses 48 kHz, ambiyans 44,1 kHz). Ölçü dökümü her klasörde `ozet.json`. Betikler: `C:\Users\ASUS\AppData\Local\Temp\claude\5d634c12ea7c4647\693ee8fd-ac31-49fb-b30d-a0d6485ef7d9\scratchpad\sesTur\olc.js` (ölçer), `bul.js` (tık yeri), `canli.js` (canlı sınama), `sure.js` (kurulum süresi).
- Ambiyans her işlemede rastgeledir (olay zamanları, esinti). Önce ve sonra aynı saniyeyi değil, karakteri karşılaştırır.

## Açık kalanlar
1. **Kulakla dinlenmedi.** Ölçümler sayısal; tını yargısı sahibin. Değerler tek yerde duruyor (`TINI`, `SESLER[].db`), ayarlamak kolay.
2. Yüksek düzeyde tik'in tepesi −6,9 dBFS: sınırlayıcı (−8 dB eşik) çok kısa devreye giriyor; kırpma yok. İstenirse tik'in db'si 1–2 dB indirilir.
3. Önceki turdan kalanlar sürüyor: bildirim sesinin tetikleyicisi yok; ambiyans sessiz saatlere uymuyor (karar sahibin). **Kabuğa istek:** kabuk.js'in tık seçicisinde `#sayfa` dışlanmalı (`[data-yol]:not(#sayfa)`); ses.js bunu şimdilik kendi tarafında nötrlüyor.
