# Faz 8 · P3 Optimizasyon raporu (2026-11-15)

Dal: `taze-hiz` (worktree `LifeOs-taze-hiz`, `origin/sadelesme`'den). Davranış değişmedi: ekranlar, metinler ve test işaretleri aynı.
Değişen yalnız yükleme yolu.

## Ölçüm nasıl alındı

`node kalite/hiz_olcum.js [--tekrar 5] [--yavas 4] [--gecikme 40] [--iz] [--css] [--denetle] [--json <dosya>]`

- Ortam yalıtılmış: geçici LOCALAPPDATA, HKM'siz tek kapı, port 4398. Açılan sayfa `#/bugun`.
- Soğuk açılış yeni tarayıcı bağlamında yapılır: önbellek ve depo boş. Sıcak açılış aynı bağlamda yeniden yüklemedir.
- Tablolar 3 tekrarın medyanıdır.
- «Telefon» satırları telefonu benzetir: CPU 4× yavaş ve istek başına 40 ms gecikme (Tailscale).
- «Etkileşime hazır», `#sayfa`'nın ilk kez `data-yer` aldığı andır. O anda `kabuk.js baslat` dinleyicileri bağlamış ve ilk rotayı çizmiştir.

## Önce / sonra

### Masaüstü (CPU 1×)

| Ölçüt | Soğuk önce | Soğuk sonra | Sıcak önce | Sıcak sonra |
|---|---|---|---|---|
| İlk boyama (FP) | 60 ms | 36 ms | 44 ms | 24 ms |
| İlk anlamlı çizim (FCP) | 152 ms | 132 ms | 76 ms | 64 ms |
| En büyük çizim (LCP) | 216 ms | 180 ms | 100 ms | 92 ms |
| Etkileşime hazır | 77 ms | 60 ms | 46 ms | 29 ms |
| Son istek bitti | 156 ms | 67 ms | 127 ms | 37 ms |
| İstek | 55 | **14** | 56 | **15** |
| Aktarılan | 1063 KB | **384 KB** | 16,2 KB | **4,2 KB** |
| JS yığını | 8,0 MB | **3,4 MB** | 15,8 MB | **4,8 MB** |
| Uzun görev (> 50 ms) | 0 | 0 | 0 | 0 |

### Telefon benzetimi (CPU 4×, 40 ms gecikme)

| Ölçüt | Soğuk önce | Soğuk sonra | Sıcak önce | Sıcak sonra |
|---|---|---|---|---|
| İlk boyama | 216 ms | 212 ms | 140 ms | 140 ms |
| İlk anlamlı çizim | 736 ms | 600 ms | 408 ms | **228 ms** |
| En büyük çizim | 1068 ms | 764 ms | 408 ms | **228 ms** |
| Etkileşime hazır | 358 ms | 300 ms | 336 ms | **166 ms** |
| DOMContentLoaded | 311 ms | 269 ms | 309 ms | 148 ms |
| Son istek bitti | 889 ms | 403 ms | 683 ms | 254 ms |
| Uzun görev toplamı | 156 ms | 74 ms | 141 ms | 62 ms |

**Hedef tutuldu:** sıcak açılışta etkileşime hazır < 600 ms. Masaüstünde 29 ms, telefon benzetiminde 166 ms.

### Kalan maliyetin izi (CDP, soğuk, 1×)

- Yerleşim 73 ms, stil hesabı 46 ms, betik değerlendirme 20 ms, CSS ayrıştırma 1 ms.
- Betiğin payı küçük (paket.js 12 ms). Soğuk açılışın asıl bedeli yerleşim (aşağıda P1 önerisi 1).

## Ne değişti

1. **Üretim paketi.**
   - `kabuk/index.html`'deki 25 `<script src>` dosyası tek istekte gelir: `/kabuk/paket.js`.
   - Paketi sunucu kurar (`sistem/sunucu.py kabuk_paketi`). Kimse elle bir şey yazmaz.
   - Paket önbellekte tutulur. Parçalardan biri değişince ETag da değişir; gzip, 304 ve Last-Modified aynen çalışır.
   - Kaynak dosyalar ayrı kalır, yani geliştirme, file://, telefon paketi (`uygulama/ios/web_paket.py`) ve node testleri değişmedi. `index.html`'e dokunulmadı.
   - Her parça kendi `try`'ında çalışır. Böylece bir betiğin hatası ötekileri durdurmaz, ayrı dosyalardaki gibi.
   - Paket hiç çalışmazsa (sözdizimi hatası) sayfa kendini bir kez `?ayri` ile açar.
   - `/kabuk/?ayri` her zaman ayrı dosyaları verir. Hata ayıklamak için bu adres kullanılır.
   - Neden gerekliydi: sunucu HTTP/1.0 konuşuyor, yani her betik ayrı bir bağlantı açıyor. Telefonda her biri ayrı bir gidiş-dönüş demek.
2. **Bugün'ün onay satırı alan paketlerini indirmiyor.**
   - «Onay bekleyen N ders» satırını saymak için Bugün her açılışta 20 alan paketini indirip kuruyordu: 4,5 MB ham, 674 KB gzip. Soğuk açılışın %63'ü buydu.
   - Artık sunucunun küçük özetinden sayıyor: `/api/kabuk/taslak`, dosyada onaylı olmayan ders kimlikleri. Yerel onay kaydı bu özetten düşülür.
   - Açık alanlar yine tam içerikten sayılır.
   - Özet gelmezse (file://, eski sunucu) eski yol çalışır.
   - Sonuç: Bugün yalnız etkin alanın paketlerini istiyor (2 istek).
3. **`/parca.js` ve `/hesap.js` aynı anda iniyor** (`async=false`: sıra korunur). Aradaki bir gidiş-dönüş kalktı.
4. **Köprü ölçümü görünür.**
   - `python tools/kopru_olcum.py [--port N] [--json]` çalışan tek kapıdan bir tablo yazar.
   - İçinde her köprünün hâli, eş/kuyruk sınırı, çalışan ve bekleyen, istek, başarı, hata, zaman aşımı, kuyruk dolu ve gecikme (medyan/p95) var.
   - Salt okur, köprüye dokunmaz. Sayaçlar `HKM/core/kopru.py`'nin bellekteki sayaçlarıdır.
5. **CI'ya hız bütçesi eklendi:** «Kabuk hız bütçesi» adımı, `kalite/hiz_olcum.js --denetle`.
   - Denetim süre değil, sayı ölçer:
     - soğuk istek ≤ 20;
     - soğuk aktarılan ≤ 600 KB;
     - Bugün'de alan JSON isteği ≤ 3;
     - sıcak aktarılan ≤ 40 KB;
     - betik isteği ≤ 6.
   - Bugün'e yeniden toplu yükleme giren bir değişiklik kırmızı yanar.

## Veri yolları

- **IndexedDB:** her açılışta tek `open` ve tek işlem (`getAllKeys` + `getAll`). Bu kadarı yeterli, dokunulmadı.
- **`/api/kabuk/baslangic`:** tek istek, açılışta bir kez (`araclar.js baslangicYokla`).
- **404'ün nedeni:**
  - Yalıtılmış ortamda 404 bir hata değil. Paket dosyası (`%LOCALAPPDATA%/LifeOS/veri/kabuk-baslangic.json`, `tools/kabuk_baslangic.py` üretir) bu ortamda yok.
  - Sunucu dosya yokken bilerek 404 verir, `tools/tekkapi_test.py` de bunu sınar.
  - `kabuk_gez.js` paketi kendisi yazdığı için orada 200 görülür.
  - Tarayıcı konsolunda «404» satırı çıkıyor ama kabuk bunu sessizce yutuyor. Sözleşme eski kapıyla (`ayni`) aynı tutulsun diye değiştirilmedi.

## CSS maliyeti (`--css`: 27 yer × 1280/390 px)

| Dosya | Kullanılan / toplam |
|---|---|
| `kabuk/bilesen.css` | 18,0 / 35,5 KB (%51) |
| `kabuk/kabuk.css` | 19,3 / 41,4 KB (%47) |
| `brand/ortak/piksel-yazi.css` | 35 KB, yalnız `@font-face` (gömülü yazı tipi) |

Ek gözlemler:

- Pahalı seçiciler:
  - `kabuk.css`'te 4 `:has(` ve 15 `:is(`, 5 `backdrop-filter` var;
  - `bilesen.css`'te 2 `:has(` var.
- Bugün 3 sn boşta durunca:
  - 0 stil hesabı, 0 yerleşim;
  - betik 4 ms (manzara tuvali saniyede 8 kez yokluyor, kare değişmedikçe çizmiyor);
  - sonsuz CSS animasyonu yok.
  Sürekli animasyonun boşta bir maliyeti yok.

## P1 / P2'ye öneriler (dokunulmadı)

1. **P1 · ilk yerleşim.** Soğuk açılışta ilk tam yerleşim (379 nesne) 1×'te yaklaşık 60 ms, 4×'te 243 ms sürüyor. Aynı süreçte yeniden yüklemede bu süre 3–13 ms'ye iniyor. Yani maliyet, yeni süreçte yazı tipi kurulumu ve yedek yazı tipi aramasından geliyor.
   - Önerim: `--govde` / `--baslik` yazı yığınında yedek sayısını azaltın, `system-ui` ile tek aile yeterli.
   - Soğuk FCP'yi (4×'te 600 ms) taşıyan bu.
2. **P1 · piksel yazı tipi.** `piksel-yazi.css` 35 KB ve ilk boyamayı bloklayan bir stil dosyası. Kabukta yalnız logodaki «L» ile açılış yazısı «LifeOS» bu yazı tipini kullanıyor.
   - Seçenek 1: yazı tipini yalnız bu iki glif için alt kümeye indirin.
   - Seçenek 2: logoyu SVG yapın ve bağlantıyı `index.html`'den kaldırın. Bu ikincisi P3'e de uyar; P1 kararı verirse yapılır.
3. **P1 · kullanılmayan CSS.** `bilesen.css` ve `kabuk.css`'in yarısı 27 yerin hiçbirinde eşleşmedi.
   - Bir kısmı durum seçicisi (hover, odak, hata) ya da yalnız etkileşimde açılan katman olabilir.
   - Silmeden önce `node kalite/hiz_olcum.js --tekrar 1 --css` ile önce/sonra bakın.
4. **P2 · manzara.** Bugün'ün ilk çiziminde `manzara()` (sahne kurulumu + `binaCiz`) 1×'te yaklaşık 20 ms, 4×'te 70–80 ms. Ölçümdeki tek uzun görev bu.
   - Sahne ilk karede yer tutucu gök rengiyle çizilebilir; ardından `requestIdleCallback` ile kurulabilir.
   - Başka bir seçenek: hazır görüntü, saat ve boy anahtarıyla oturum boyunca saklanır.
5. **P2 · `backdrop-filter`.** Yapışkan üst çubuktaki `blur(12px)` kaydırmada her karede yeniden hesaplanır. Hareket bütçesi ölçümünde (50 ms) önce buna bakın.
6. **P1/P2 · bütçe.** Yeni bir ekran Bugün'de alan paketi yüklerse CI'daki «Kabuk hız bütçesi» adımı kırmızı yanar. Sayıyı başka bir yoldan alın, örnek `/api/kabuk/taslak`.

## Kapılar

| Kapı | Sonuç |
|---|---|
| `node kabuk/*.test.js` (14 dosya) | hepsi yeşil |
| `node tools/kabuk_gez.js` | hepsi geçti (340 ✓) |
| `node tools/kabuk_esit_gez.js` | hepsi geçti |
| `python tools/tekkapi_test.py` | 165/165 (paket, `?ayri`, taslak özeti, ETag/304/gzip için yeni sınamalar dahil) |
| `uygulama/ios/web_paket_test.py`, `kaynak_test.py` | temiz |
| `python HKM/tests/run.py` | 1062/1062 |
| `python kalite/olcum.py --denetle` / `python kalite/katman.py` | bütçe tamam (28) / katman tamam |
| `python tools/ci_yerel.py` (bütün CI adımları, yeni hız bütçesi dahil) | 48/49 |

`ci_yerel`'de tek kırmızı «Ofis kabul ve birim testleri» adımındaydı. Nedeni `tools/belge_dizin_kabul_test.py`: `faz8-taze-plan.md` `belgeler/DIZIN.md`'de yoktu, `origin/sadelesme`'de de böyleydi. Bu dalda plan ve bu rapor dizine eklendi; adımın 13 testi tek tek yeşil.

Birleştirme notu: P1 ya da P2 de plan satırını eklerse satır iki kez görünür. Dizin testi bunu yakalar; birini silin.

## Açık kalanlar

- Sunucu hâlâ HTTP/1.0 (her istek ayrı bağlantı). HTTP/1.1 keep-alive bütün işleyicilerde `Content-Length` disiplini ister, bu yüzden bu tura sığmadı. Paket bunun en büyük bedelini kaldırdı.
- Onay özeti, aşamayı kabuktaki gibi ilk eksik ya da kimliği uymayan dosyada keser. `Yol.yukle`'nin öbür denetimlerini yapmaz; bozuk içeriği CI zaten `alan/denetle.py` ile yakalıyor.
- Paketin hata satırları `paket.js` satırı olarak görünür. Her parçanın başında `/* <dosya> */` var; ayrıntı için `?ayri` kullanılır.
- Sıcak açılış hâlâ 15 koşullu istek yapıyor (3 CSS, 4 betik, 4 API, 2 alan, index ve 1 diğer). CSS'i de pakete almak ya da `<link rel=preload>` 2 gidiş-dönüş daha kazandırır, ama CSS P1'in alanı.
- Kare bütçesi ve geçiş ölçümü P2'nin hareket gezisinde.
