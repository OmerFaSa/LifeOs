# Faz 2 · Ekranların bileşen kataloğuna geçişi (A2, adım 2)

Karar A2: «Ekranlar yalnız bileşen kataloğundan kurulur … Tema yalnız jetonlara dokunur».
Başlangıç: dal `sadelesme`, temiz, 695d69db. Katalog: `faz2-bilesen.md`. **Commit yok** (çalışma ağacı; 14 dosya değişti, bu belge yeni).

## 1. Çevrilen ekranlar

`kabuk/index.html` artık `bilesen.css` (kabuk.css'ten sonra) ve `bilesen.js` (motorlardan sonra, `harita.js` ve bütün ekran
betiklerinden önce) yükler. Ekran dosyaları `B = LIFEOS.Kabuk.Bilesen` ile çizer (dört dosyada 153 taş çağrısı).

| Dosya | Ekran | Ne oldu |
|---|---|---|
| `kabuk.js` | üst çubuk (Ara, Yerler) | `B.dugme` (sade; `kisayol` + `tus` ile `aria-keyshortcuts` ve `<kbd>`) |
| `kabuk.js` | Bugün | ana düğme `B.dugme`; ipucu `B.uyari` (bilgi + «Anladım»); **yeni:** depo `bellek` kipindeyse `B.uyari` (dikkat): «Kayıtlarına bu açılışta ulaşılamadı. Önceki kayıtların silinmedi, ama bu oturumda yaptıkların sayfa yenilenince kaybolur.» Karşılama düzeni (`.karsila`, selam) olduğu gibi |
| `kabuk.js` | dal sayfaları | `B.baslik` + `B.liste` (taşınma durumu `B.pul`, «taşınıyor» altın) |
| `kabuk.js` | Sistem haritası | dal başına `B.panel` + `B.liste`; katman artık yazıyla da («sayfa · halkada»; eskiden yalnız sol çizgi rengi) |
| `kabuk.js` | Ayarlar | `B.baslik`, grup başına `B.bolum` (`id=grup-…`, gezinme bağlantıları aynı), «Hepsini varsayılana döndür» `B.eylemler` |
| `kabuk.js` | alan (yol haritası) | aşama listesi `B.bolum` + `B.liste` (seçili = `aria-current`); aşama adı `B.baslik` düzey 2; **ilerleme iki `B.ilerleme` çubuğu** (okunan ders, geçilen ünite kapısı; eskiden yalnız metin); ünite `B.acilir`, içinde dersler `B.liste` tür `ders` (ders kartı, özetiyle), kapı `B.liste` satırı; aşama kapısı `B.bolum`; «Nereden başlayalım?» `B.panel` + `B.eylemler`; hata/kilit `B.bos`; «Aşama tamamlandı» `B.uyari` (tamam) |
| `kabuk.js` | ders | `B.baslik`, taslak ve kaynak notu `B.uyari`, kaynaklar `B.acilir` (künye kısaltılmasın diye içi düz liste), alıştırmalar `B.bolum`, açık uçlu cevap `B.alan` (çok satır, görünür etiket), eylemler `B.eylemler` |
| `kabuk.js` | ünite/aşama kapısı | sonuç `B.panel` (başarı/güçlü, `durum` = `role=status` + odak), `B.eylemler` |
| `kabuk.js` | Seviyemi bul (soru + sonuç) | `B.baslik`, sonuç `B.panel`, aşama sonuçları `B.liste` («atlandı» altın), üretim görevi `B.uyari` |
| `kabuk.js` | taşınmamış yer, «bulunamadı» | `B.baslik` + `B.eylemler`; `B.bos` (eylemi kutunun içinde) |
| `deneme.js` | başlangıç, süren deneme, sonuç | `B.baslik`; testler + süre `B.liste` («hesaplandı»); başlat/önceki/sonraki/bitir `B.eylemler`; prova `B.bolum` (yetmeyen prova kapalı `B.dugme` + görünür neden); son denemeler, testlere/derslere göre, puan tahmini `B.bolum` + `B.liste`; özet `B.panel` (`durum`); cevap anahtarı `B.acilir`; eksik soru `B.bos` |
| `tanisma.js` | Tanışma, Bugün daveti | **JS içinde basılan 26 satırlık `STIL` silindi**; kalan sohbet düzeni kabuk.css «tanışma» bölümünde (15 satır). Seçim çipleri `B.dugme` (`basili` = `aria-pressed`), cevap `B.alan` (görünür etiket, ipucu, soru metni `tarif` ile bağlı), düzeltme `B.alan`, öneriler `B.bolum` + `B.panel`, «Kaydedildi» `B.panel` (`durum`), King'in anladığı `B.panel`, bütün düğmeler `B.eylemler`/`B.dugme`, davet `B.uyari` (iki eylem) |
| `araclar.js` | Not (liste, not formu, araç sayfası ve formu), Tekrar, Yol haritası, Kayıt, Kayıt haftası | not/araç/alan/kart/kayıt satırları `B.liste` (silme düğmesi satır `eylemler`'i); başlıklar `B.baslik`; boş/eksik `B.bos`; sisteme not `B.panel`; bütün eylem sıraları `B.eylemler`; onay kutuları (Özel, Üstte tut, King okuyabilsin, Sayılar tahmin) `B.alan` tür `onay`; Tekrar sonucu `B.panel`, hatırlama düğmeleri `B.dugme` («İyi · 3 gün»), kart listesi ve kapı kartları `B.acilir`; kayıt özeti, kurallar, haftanın toplamı, toparlanma `B.bolum` + `B.liste` (kesinlik etiketi rozet) |
| `ayar.js` | Ayarlar › Hesap ve güvenlik | **yeni salt bilgi satırı** «Bu cihazdaki kayıtlar: Kalıcı / Tarayıcı silebilir / Bilinmiyor» (`Depo.kalici()` true/false/null); şemada yeni tür `bilgi`: değeri satırın `oku()`'sundan, depoya yazılmaz (`yaz` false döner), eşitlenmez, sıfırlama dokunmaz. Anahtar `depo.kalici` (`lifeos.` öneki yok: kayıt/ayar taramasına girmez) |

**Çevrilmedi (sonraki paket):** `araclar.js` Plan (gün ve hafta planı, bloklar, plan formları) ve Soru (karma test, sonuç);
form metin alanları (`label.alanet` + `.giris`: not başlığı/gövdesi, kart, kayıt sayıları, araç adı/klasörü, arama) — `B.alan`'da
`readonly`, satır sayısı ve yer tutucu yok; not ağı (SVG), kayıt haftası tablosu, Tekrar kartı (`.kart`), soru/seçenek (`.soru`,
`.secenek`, üç dosyada ortak), deneme sayacı ve soru numaraları (`.deneme__ust`, `.deneme__nobt`), halka ve komut çubuğu, Ayarlar satırları
(`ayar.js` `ciz`: `.ayar`, `.seg`). Elle kalan: `class="dugme…"` 19, `eylemler` 9, `yuva` 5 — hepsi `araclar.js` Plan/Soru'da.

## 2. Eklenen taşlar ve seçenekler

Katalog 12 → **14 taş** (`kabuk/bilesen.js`, `bilesen.css`, testleri `bilesen.test.js`, örnekleri `bilesen.html` taş 13 ve 14):
- **13 · Eylem sırası** `eylemler([dugme seçenekleri…, {yazi}])`: elle `eylemler` kutusunun yerine; boş öğe atlanır, hepsi boşsa hiçbir şey
  çizilmez; `{yazi}` kısa soluk açıklama; HTML metni öğe olamaz (`TypeError`).
- **14 · Açılır bölüm** `acilir({baslik, not?, govde, acik?, duzey: 2|3, veri?})`: `<details>/<summary>` + h2/h3; ünite kutuları, kaynaklar,
  cevap anahtarı, kart listeleri.

Var olan taşlara eklenenler (her biri testli):
- `dugme`: `basili` (aç/kapa, `aria-pressed`, seçili 3 px çizgi), `kisayol` (`aria-keyshortcuts`), `tus` (`<kbd>`).
- `satir`: `eylemler` (bağlantı olmayan satırın sağında düğmeler; bağlantı satırında `TypeError`: iç içe etkileşim yok).
- `uyari`: `eylem` (bir düğme ya da dizi), `veri`; dar ekranda eylemler alt satıra geçer (metin 12 rem'in altına sıkışmaz).
- `panel`: `durum` (`role=status` + `tabindex=-1`: sonuç kutusu odaklanır), `veri`, başlıksız panelde `id`.
- `bolum`: `veri`. `alan`: `tarif` (ek `aria-describedby` kimliği, biçimi denetlenir).
- bağlantı: aynı kökte kök yolu (`/esp/`) kabul; `//alan` hâlâ reddedilir.

## 3. Ölçümler (önce / sonra)

| | Önce (695d69db) | Sonra |
|---|---|---|
| `kabuk.js` / `araclar.js` / `deneme.js` / `tanisma.js` | 713 / 980 / 329 / 470 | 706 / 967 / 331 / 437 |
| `ayar.js` / `bilesen.js` | 149 / 233 | 159 / 259 (2 taş, 8 seçenek) |
| **JS toplam** | **2874** | **2859** (−15; ekran dosyaları −51) |
| `kabuk.css` / `bilesen.css` | 287 / 117 | 262 / 132 |
| **CSS toplam** | **404** | **394** (−10; ayrıca JS içindeki 26 satırlık `STIL` yok) |
| Ayrı `font-size` (kabuk.css) | 20 (+ `STIL` 5) | **11**: ölçek .72 · .85 · 1 · 1.15 · 1.5 rem, iki `clamp` (h1, selam), SVG 13/20 px, `var(--boy)`, ve Plan listesinde kalan `.8rem` |
| Ayrı `font-size` (kabuk.css ∪ bilesen.css) | 20 | 11 |
| Ayrı `padding` (kabuk.css) | 32 (+ `STIL` 8) | 29 |
| Ayrı `padding` (kabuk.css ∪ bilesen.css) | 37 | 33 |

Sayım: `grep -o 'font-size:[^;}]*' | sort -u`, `padding:` aynı biçimde (`faz2-bilesen.md` 35 dediği sayı başka bir ayrıştırma; burada iki taraf aynı komutla).
kabuk.css'ten silinenler: `.satir*`, `.liste` (iki tanım), `.ipucu`, `.asama`, `.uniteler/.unite*`, `.dal*`, `.yer*`, `.ayargrup*`, `.ayarlar__son`,
`.unitekutu*`, `.satir--kapi`, `.kaynak*`, `.soru__yazi`, `.kapisonuc--gecti`, `.ozet__not`, `.asamalar …`, `.notlar .dugme/small`,
`.khafta … .pul`, `.sistemnot h2/p` (kabuk.css'e tanışma bölümü 16 satır girdi, yine de 287 → 262). Ölçek dışı boylar (.8, .82, .9, .95, 1.05, 1.08, 1.1, 1.2, 1.4) ölçeğe çekildi; `.dugme--ana` dolgusu
`.b-dugme--ana` ile aynı (0 24). Bağlantı altçizgisi ve «Sayaçlar ve noktalar: Gizle» ayarları yeni taşları da kapsar (davranış aynı).

## 4. Testler

14 Kasım 2026, çalışma ağacı.

| Komut | Sonuç | Beklenti değişikliği |
|---|---|---|
| `node kabuk/kabuk.test.js` | **52/52** (önce 51) | +1 test: salt bilgi satırı okunur, yazılmaz, üç durumu yazıyla çizer, eşitlenmez; kaynak deseni `faz2-indexeddb.md §`'yi de kabul eder |
| `node kabuk/depo.test.js` | 13/13 | yok |
| `node kabuk/bilesen.test.js` | **9/9** (içindeki denetimler arttı) | 12 → 14 taş; yeni seçenekler ve kötü girdileri (basili, satır içi eylem, eylem dizisi, HTML öğe, açılır gövde/düzey, tarif, kök yolu, panel durum/kimlik, bölüm veri) |
| `node kabuk/tanisma.test.js` | 25/25 | yok |
| `node kabuk/deneme.test.js` | 6/6 | yok |
| `node tools/kabuk_gez.js` (gerçek Chromium, tek kapı) | **205/205** | yalnız seçiciler (eski sınıf → taş sınıfı ya da `data-`/`aria-label` kancası); maddeler ve koşulların gücü aynı. Metin düzenli ifadesi yerine ölçü: alan ilerlemesi artık `role=progressbar` değerlerinden (`3/9 · 1/3`), aşama satırında `aria-current` `page` → `true`, sınav provası «Süre» satırı; sayılar aynı |
| `node tools/bilesen_goruntu.js` | 4/4 görünüm, taşma 0, 14 taş, konsol temiz | 12 → 14 bölüm |
| `python kalite/olcum.py --denetle` | «Bütçe tamam: 28 bütçe, aşım yok.» | `kalite/butce.json` değişmedi |
| motor testleri | koşulmadı | motor dosyasına dokunulmadı |

## 5. Görsel denetim

Önce görüntüleri 695d69db'de `node tools/kabuk_gez.js --goruntu` ile yeniden çekildi ve kenara kopyalandı; sonra hepsi yeniden çekildi
(`belgeler/ekip/sadelesme/kabuk-onizleme/`). Gezinin çekmediği Bugün, Ayarlar, Sistem haritası, Felsefe, ders ve Tanışma da aynı yalıtılmış
tek kapıyla dört görünümde çekildi (`karsilama-*`, `ayarlar-*`, `harita-*`, `felsefe-*`, `ders-*`, `tanisma-ilk-*`; hepsinde yatay taşma 0).
Önce/sonra çiftleri yan yana bakıldı (390 açık/koyu, 1280 koyu):
- **Düzeltilen gerileme:** Bugün'de eylemli uyarı satırı (Tanışma daveti, ipucu) 390 px'te metni ~100 px'lik sütuna sıkıştırıyordu
  («tanıyayı / m mı?»). Taşta düzeltildi: eylemler dar ekranda alt satıra geçer, metin 12 rem'den dar olmaz.
- Tanışma formu ilk çekimde soluk göründü; ölçüldü: giriş canlandırmasının ortası yakalanmış (bittiğinde `opacity` 1). Çekim canlandırmasız yapıldı.
- Odak halkası: klavyeyle ana düğmeye gelince 3 px düz çizgi, vurgu renginde (ölçüldü).
- Beklenen görünüş değişiklikleri: liste satırları her yerde aynı boy (68 px), bu yüzden Sistem haritası ve Felsefe sayfası uzadı; dersler ders
  kartı (özetli, 148 px); ilerleme çubukları; sayfa başlıkları ve ayar grupları aynı h1/h2; Ayarlar'da «Hepsini varsayılana döndür» artık solda.
- Bakılan çiftler: karşılama, Ayarlar, Sistem haritası, Tanışma, aşama listesi (alan), deneme başlangıcı ve sonucu, sisteme not. Plan, Soru,
  kayıt haftası ve not ağı çiftlerine ayrıca bakılmadı (Plan/Soru çevrilmedi; diğerlerinde gezinin taşma denetimi geçti).

## 6. Açık noktalar

1. **`araclar.js` Plan ve Soru ekranları ile form metin alanları çevrilmedi** (bkz. §1 sonu). Sıradaki paket: `B.alan`'a `salt` (readonly),
   `satir` (çok satırda boy) ve yer tutucu; soru/seçenek için bir taş (üç dosya ortak `.soru/.secenek`); Plan bloğu için satır taşının eylemli hâli
   yetebilir. Bunlar bitince `.dugme*`, `.yuva`, `.eylemler`, `.pul`, `.kapisonuc`, `.ozet`, `.alanet`, `.giris`, `.isaret`, `.kartliste` kabuk.css'ten düşer.
2. **Satır taşı uzun metni kısaltır.** Deneme sonucunda test başına «2 doğru · 0 yanlış (ölçüldü) · 3 boş (hesaplandı) · 4 dk (ölçüldü)» notu
   390 px'te kesiliyor (tamamı ekran okuyucuda). Kesmek mi satırı uzatmak mı: `faz2-bilesen.md` §6 soru 1, sahibin kararı.
3. **«Sayaçlar ve noktalar: Gizle» ayarı rozetleri gizliyor; kesinlik etiketleri de rozet** (eskiden de `.pul` öyleydi, davranış korundu). AGENTS §1.2
   ile çelişiyor olabilir; etiket rozetlerinin bu ayardan muaf tutulması sahibin kararı.
4. Kalıcı depolama satırı sayfa çizildiği andaki değeri gösterir; yanıt sonra gelirse sayfa yeniden açılınca güncellenir. Başsız Chromium'da
   «Tarayıcı silebilir» çıkıyor (izin verilmedi).
5. `bellek` kipi uyarısı gerçek tarayıcıda tetiklenmedi (IndexedDB'yi bozmak gerekir); kip koşulu `depo.test.js`'te, metin kodda.
6. Ayarlar satırları (`ayar.js` `ciz`: `.ayar`, `.seg`) ve Bugün karşılama düzeni kataloğa girmedi; şema tek yerde ürettiği için zarar yok, ama A2
   tam olacaksa «seçim düğmeleri» (`seg`) bir taş olmalı (katalog sayfası da `.seg` kullanıyor).
7. Kalan ayrı `padding` değerleri (29) çoğunlukla çevrilmeyen parçalarda (Plan bloğu, komut çubuğu, halka, deneme üst şeridi, tablo).
