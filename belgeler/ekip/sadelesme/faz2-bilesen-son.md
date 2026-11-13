# Faz 2 · Bileşen geçişinin sonu (A2, adım 3)

Karar A2: «Ekranlar yalnız bileşen kataloğundan kurulur». Önceki paket: `faz2-bilesen-gecis.md`. Başlangıç: dal `sadelesme`, temiz, 17e9a17c.
**Commit yok** (çalışma ağacı).

## 1. Çevrilen ekranlar

| Dosya | Ekran | Ne oldu |
|---|---|---|
| `araclar.js` | Plan › gün planı | başlık `B.baslik`; üç bölüm `B.bolum` (Bugünün planı, Boş zamanım, İşler); bloklar `B.liste` + `B.satir` **uzun** (ad «09:00–09:30 Rapor», not «30 dk · tahmin · sınıf · 2. gün», durum rozeti, Yapıldı/Atla/Geri al satırın `eylemler`'i; tür ve durum `data-blok`, `data-blok-durum`); sığmayanlar `B.uyari` (dikkat); boş zaman ve işler `B.liste` + satır içi «Sil» (`aria-label` aynı); formlar `B.alan` (saat, sayı, tarih) + `B.eylemler`; ileti `B.uyari` (hata) |
| `araclar.js` | Plan › hafta planı | gün başına `B.bolum` (`data-gun`; «bugün» rozeti yerine başlıkta «· bugün»), bloklar aynı satır taşı; devreden/bekleyen `B.liste`; boş zaman yoksa `B.bos` (eylemli); motor hatası `B.uyari` |
| `araclar.js` | Plan › sabit bloklar | `B.bolum` + `B.liste` (satır içi Sil); gün seçimi **yeni** `B.alan` tür `coklu` (fieldset + legend, aynı adlı onay kutuları) |
| `araclar.js` | Soru › karma test başlangıcı | test düğmeleri ve süreli deneme `B.eylemler`; az soru `B.bos`; «Son testler» `B.bolum` + `B.liste` (uzun satır, «ölçüldü» rozeti) |
| `araclar.js` | Soru › soru ekranı | **yeni** `B.soru` (üst not «Felsefe · soru 3 / 10 · konu», doğru/yanlış işareti, kilit, sonuç satırı); eylemler `B.eylemler`; içerikte olmayan soru `B.bos` (eylemli) |
| `araclar.js` | Soru › sonuç | `B.panel` (`durum`, `data-sonuc="soru"`), derslere göre `B.bolum` + `B.liste`, eylemler |
| `araclar.js` | form alanları | not arama (`arama` türü; «Yeni not» başlığın eylemine geçti), not başlığı/gövdesi (`uzun`: 12 satır), bağ ekle (`secim`), araç adı/klasörü (`salt`: readonly), görünüm (`radyo`), sisteme not formu (`B.panel` içinde iki `cok` alan, yer tutuculu), kart ön/arka yüzü, kayıt günü/türü (`secim`, tür seçimi `optgroup`), kayıt sayıları (`sayi`, yer tutucu «min – max») ve metinleri. **Bütün form iletileri** (not, araç, kart, kayıt, plan) `B.uyari` (hata ya da tamam, odak alır) |
| `araclar.js` | not bağları | `<ul class="baglar">` → `B.liste` (bağlantı satırı; silinmiş not düz satır; «çelişki» rozeti) |
| `deneme.js` | süren deneme / prova sorusu | `B.soru` (`sikVeri` `data-deneme="cevap"`, provada kilit ve «Cevabın kaydedildi» sonucu); A–E klavyesi aynı |
| `deneme.js` | sonuç | test/ders satırları ve puan tahmini `uzun` satır (telefonda kesilmiyor, §2) |
| `kabuk.js` | ders alıştırmaları, ünite/aşama kapısı, Seviyemi bul | `B.soru`: seçmeli alıştırma (düğme kipi), açık uçlu alıştırma (gövde + sonuçta ölçütler ve örnek cevap), kapı ve yerleştirme soruları (radyo kipi, `name` = içerik kimliği) |
| `ayar.js` | Ayarlar seçim satırları | `.seg` → **yeni** `B.tercih`; sayı satırı `.giris` sınıfını bıraktı (`.sayiayar input`) |
| `bilesen.html` | katalog | tema/genişlik düğmeleri `B.tercih`; taş 15 ve 16 örnekleri |

**`.seg` kararı:** taş oldu (`B.tercih`, katalog 16). `B.dugme({basili})` ile değiştirmek radyo grubunu aç/kapa düğmelerine çevirirdi
(ok tuşu ve tek sekme durağı gider, `kabuk.test.js`'in radyo testi anlam değiştirirdi); seçim tek ve zorunlu olduğu için radiogroup doğru anlam.
Elle yazılmış hiçbir `.seg` kalmadı.

## 2. Eklenen taşlar

Katalog 14 → **16 taş**:
- **15 · Soru** `soru({soru, secenekler | govde, kip: dugme|radyo, isim?, secili?, dogru?, kilitli?, ust?, sikVeri?, veri?, sonuc?: {baslik, metin?, maddeler?, not?}})`.
  `<fieldset>` + `<legend>`; düğme kipinde her şık `<button aria-pressed data-h>`, radyo kipinde `<label><input type=radio>` (ok tuşlarını tarayıcı yönetir).
  Seçili 3 px vurgu; doğru şık 3 px altın + «✓ doğru», seçilen yanlış kesik çizgi + «✕ senin cevabın» (renk tek başına değil); `dogru` verilmezse
  (deneme) hiçbir işaret yok. Sonuç `role=status`, odak alır, boşken görünmez. 2–8 şık; geçersiz harf, `isim`siz radyo, dizi olmayan madde → `TypeError`.
- **16 · Tercih düğmeleri** `tercih({etiket | ad, secenekler, deger, veri?})`: `radiogroup` + `radio` (`aria-checked`), tek sekme durağı (seçili, yoksa ilki), 44 px.

Var olan taşlara eklenenler (hepsi testli):
- `alan`: tür `arama`, `coklu` (onay kutusu grubu), `radyo`; `salt` (readonly), `uzun` (12 satır), `yerTutucu`, `veri` (denetime `data-*`),
  `secim`'de iç içe nesne → `<optgroup>`. **`sayi` artık `type=text inputmode=decimal`** (eskiden `number`; Türkçe «72,5» yazılamıyordu; hiçbir ekran
  kullanmıyordu, Kayıt ve Plan elle aynısını yazıyordu).
- `satir`: `uzun` (ad ve not sarılır, satır en az standart boyda).
- `uyari`: `hata` ve `tamam` `tabindex=-1` (form iletisine odak; eski `.notform__ileti` gibi).

## 3. «Gizle» ayarı ve kesinlik etiketleri

**Bulgu:** «Sayaçlar ve noktalar: Gizle» (`lifeos.rozet` = `kapali`, kök `data-rozet`) kabuk.css'te `.pul, .b-pul { display:none }` yapıyordu: bütün rozetler
gidiyordu. Bunların arasında **sayıların kesinlik etiketleri** (sayı kutusu, satır rozeti: «ölçüldü / hesaplandı / tahmin / veri yok»), «kilitli» (kilitli
satırın renk dışı yarısı), «taslak» (AGENTS: onaysız içerik taslak etiketiyle), «King okur / okumaz», «özel», «yapıldı» vardı. Ayarın kendi tanımı
«Bekleyen işleri gösteren küçük işaretler»; eski sistemde (AYS `cam.css`) yalnız kenar sayaçlarını ve zil noktasını gizliyordu. Kabukta bekleyen iş sayacı ya da
nokta **yok**; gizlenen her rozet bir durum ya da kesinlik etiketiydi.

**Yapılan:** kural silindi. **Ayar şimdi kabukta hiçbir şeyi gizlemiyor** (şemada ve eşitlemede duruyor; AYS'de sayaçları gizlemeye devam ediyor).
Kesinlik etiketleri her ayarda görünür. Gezide yeni denetim: `data-rozet="kapali"` iken deneme sonucundaki her kesinlik etiketi görünür.
Sahibe: kabuğa bir gün bekleyen iş sayacı gelirse ayar ona bağlanır; ayarı şemadan kaldırmak da bir seçenek (§7).

## 4. Ölçümler (önce / sonra)

Önce = 17e9a17c (`git show HEAD:…`), sonra = çalışma ağacı; sayım önceki raporla aynı komut (`grep -o 'font-size:[^;}]*' | sort -u`, `padding:` aynı biçimde).

| | Önce (17e9a17c) | Sonra |
|---|---|---|
| `kabuk.js` / `araclar.js` / `deneme.js` / `tanisma.js` | 706 / 967 / 331 / 437 | 696 / 941 / 328 / 437 |
| `ayar.js` / `bilesen.js` | 159 / 259 | 155 / 327 (2 taş, 10 seçenek) |
| **JS toplam** (bu altı dosya) | **2859** | **2884** (+25; ekran dosyaları −43, katalog +68) |
| `kabuk.css` / `bilesen.css` | 262 / 132 | **202** / 168 |
| **CSS toplam** | **394** | **370** (−24) |
| Ayrı `font-size` (kabuk.css) | 11 | **10** (Plan listesindeki `.8rem` gitti; kalan: ölçek .72 · .85 · 1 · 1.15 · 1.5 rem, iki `clamp`, SVG 13/20 px, `var(--boy)`) |
| Ayrı `font-size` (kabuk.css ∪ bilesen.css) | 11 | **10** |
| Ayrı `padding` (kabuk.css) | 29 | **20** |
| Ayrı `padding` (kabuk.css ∪ bilesen.css) | 33 | **27** |

kabuk.css'ten silinenler: `.dugme*` (8 kural), `.pul*`, `.eylemler`, `.yuva`, `.seg*` (5), `.soru*`, `.secenek*` (12), `.kapisonuc`, `.giris*`, `.aracust`,
`.alanet`, `.isaret`, `.notform__ileti`, `.baglar`, `.kartliste*` (5), `.ozet*` (3), `.bloklar`, `.blok*` (8 + dar ekran), `.hafta__gun*`, `.hafta .blok`,
`.blok--sabit`, `.gunsec*`, `.sistemnot*`, «Gizle» kuralı; `h1,h2,…` ve alt çizgi kuralından `.dugme` seçicisi. Form kapları tek yerleşim kuralında
(`.notform, .kartform, .aracform, .kayitform, .planform`), `.hafta` yalnız ızgara. Ayar sayı kutusu `.giris` yerine `.sayiayar input` (aynı görünüş, 44 px).
Bu paketle kabuğun hiçbir ekran dosyası `class="dugme|pul|eylemler|yuva|alanet|giris|isaret|soru|secenek|ozet|kartliste|blok|seg"` yazmıyor (grep 0).
JS toplamı katalog büyüdüğü için +25: ekranların kendi kodu kısaldı, ölçü ve erişilebilirlik kuralı taşlara taşındı.

## 5. Testler

14 Kasım 2026, çalışma ağacı, son CSS değişikliğinden sonra.

| Komut | Sonuç | Beklenti değişikliği |
|---|---|---|
| `node kabuk/kabuk.test.js` | **52/52** | yok (ayar radyo testi `B.tercih` çıktısıyla olduğu gibi geçiyor) |
| `node kabuk/depo.test.js` | 13/13 | yok |
| `node kabuk/bilesen.test.js` | **13/13** (önce 9) | 14 → 16 taş (sayı, kaçış örnekleri, katalog sayfası); **+4 test**: soru taşı (düğme/radyo/açık uçlu, işaretler, kilit, sonuç, 8 kötü girdi), tercih taşı (tek seçili, tek sekme durağı, 3 kötü girdi), alanın yeni seçenekleri (arama, salt, uzun, yer tutucu, veri, optgroup, çoklu, radyo, ondalık metin kutusu, 3 kötü girdi), uzun satır ve odaklanan ileti |
| `node kabuk/tanisma.test.js` | 25/25 | yok |
| `node kabuk/deneme.test.js` | 6/6 | yok |
| `node tools/kabuk_gez.js` (gerçek Chromium) | **207/207** (önce 205) | yalnız seçiciler: `.soru/.secenek*` → `.b-soru*`, `data-cevap` → `data-h`, `.notform__ileti` → `.b-uyari` (plan/hafta'da `.b-uyari--hata`), `.kapisonuc` → `[data-sonuc="soru"]`, `.ozet`/`.kartliste`/`.baglar`/`.bloklar` → listenin `aria-label`'ı, `.blok--is/--ders` → `[data-blok]`, `.blok--bitti` → `:not([data-blok-durum="bekliyor"])`, `.hafta__gun` → `[data-gun]`. Maddeler ve koşulların gücü aynı. **+2 denetim:** `data-rozet="kapali"` iken kesinlik etiketleri görünür; deneme test notu 390 px'te kesilmez |
| `node tools/kabuk_gez.js --goruntu` | 207/207, görüntüler yenilendi | — |
| `node tools/bilesen_goruntu.js` | 4/4 görünüm, taşma 0, **16 taş**, konsol temiz | beklenen bölüm sayısı 14 → 16 |
| `python kalite/olcum.py --denetle` | «Bütçe tamam: 28 bütçe, aşım yok.» | `kalite/butce.json` değişmedi |

## 6. Görsel denetim

ÖNCE görüntüleri (17e9a17c'de commit'li `kabuk-onizleme/`, 114 dosya) iş başlamadan çalışma alanına kopyalandı; sonra `node tools/kabuk_gez.js --goruntu`
ve `node tools/bilesen_goruntu.js` ile hepsi yeniden çekildi. Önce/sonra çiftleri yan yana bakıldı: hafta (390 açık, 390 koyu, 1280 koyu, 1280 açık), plan
(1280 koyu), soru (1280 koyu), deneme sorusu (390 koyu), deneme sonucu (390 açık, 1280 koyu), prova sonucu (390 açık), kayıt (1280 koyu), kayıt haftası (390 açık),
not formu (1280 koyu), katalog taş 15–16 (390 açık).
- **Düzeltilen açık nokta:** deneme sonucunda test notu 390 px'te «… 4 boş (h…» diye kesiliyordu; şimdi iki satıra sarılıyor (görüntüde ve gezide ölçüldü).
- **Düzeltilen gerileme:** ilk çekimde yer tutucu `--soluk` rengindeydi; koyu temada «20 – 250» girilmiş değer gibi okunuyordu. Kural silindi, tarayıcının
  soluk yer tutucusu (önceki görünüş) geri geldi; son çekim bu hâliyle.
- Beklenen görünüş değişiklikleri: plan blokları ve hafta günleri her yerde aynı 68 px satır (hafta sayfası 390 px'te 2678 → 3134 px uzadı); sabit blok ve
  mola satırları ayrı zemin rengi yerine aynı yüzey, türleri yazıyla («sabit», «Mola»); «bugün» altın rozeti yerine gün başlığında «· bugün»; form alanları
  .85 yerine 1 rem yazı (katalogdaki giriş); not arama alanının görünür etiketi var, «Yeni not» başlığın sağında; şıklar 8 px aralık, soru kutusu 16 px dolgu;
  Ayarlar seçim düğmeleri 40 → 44 px.
- Taşma: gezinin dört görünümlük taşma denetimleri ve katalog 4/4 görünümde yatay taşma 0.

## 7. Açık noktalar

1. **«Gizle» ayarı kabukta artık boş** (§3). Sahibin kararı: kabuğa bekleyen iş sayacı gelince ona mı bağlansın, yoksa ayar şemadan mı kalksın.
2. Hâlâ elle kurulan ve kataloğa girmeyen parçalar (bu pakette istenmedi): Tekrar kartı (`.kart`, `.notlar`), not ağı (SVG), kayıt haftası tablosu
   (`.khafta`), deneme üst şeridi ve soru numaraları (`.deneme__ust`, `.sayac`, `.deneme__nobt`), cevap anahtarı listesi, halka ve komut çubuğu, Ayarlar
   satır kabı (`.ayar`) ile sayı ve saat aralığı denetimleri (`.sayiayar`, `.aralik`), sisteme not sayfasındaki `h3`'ler, Bugün karşılama ve Tanışma sohbet
   düzeni. Kalan 20 ayrı `padding` değerinin hepsi bunlarda.
3. Uzun satır (`satir.uzun`) yalnız sayı + kesinlik etiketi taşıyan satırlarda ve saatli plan bloklarında; öteki listeler hâlâ kısaltıyor
   (`faz2-bilesen.md` §6 soru 1 genel kararı sahibin).
4. Soru taşı kilitli şıkları `disabled` yapar (davranış eskisi gibi, gezi bunu denetliyor): cevaptan sonra şıklar sekme sırasından çıkar, odak sonuç satırına
   gider; doğru şık yazısı («✓ doğru») okuma kipinde okunur. `aria-disabled` ile şıkları sekmede tutmak üç olay işleyicisinde kontrol ister; istenirse ayrı iş.
5. Hafta planı günleri ızgarası (`.hafta`) ve form kapları kabuk.css'te yerleşim kuralı olarak kaldı (parça değil, kutu ölçüsü yok).
6. Satır sonları: Python ile yazılan dosyalar LF; git `autocrlf` uyarısı veriyor, içerik farkı yok (diff yalnız değişen satırları gösteriyor).
