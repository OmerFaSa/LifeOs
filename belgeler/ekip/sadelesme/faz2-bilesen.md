# Faz 2 · Bileşen kataloğu, adım 1 (A2)

Karar A2: «Kabuk on iki kadar yapı taşı sunar … Ekranlar yalnız bunlardan kurulur;
boyutu ekrandan ekrana değişen kutu sorunu yapısal olarak biter. Tema yalnız jetonlara
dokunur». Bu belge kataloğun ilk adımıdır; ekranların kataloğa çevrilmesi sonraki paket.

## 1. Tarama

Salt okundu: `kabuk/kabuk.js` (710 satır), `kabuk/araclar.js` (980), `kabuk/deneme.js` (329), `kabuk/tanisma.js` (470).
Dört dosya da ekranı HTML metni olarak elle birleştiriyor (`'<div class="…">' + kac(x) + …`); kaçış her dosyada ayrı
bir yerel işlevle (`kac`, `k`). Sayımlar `class="…"` geçişleridir (grep, 2026-11-14, 11ef9c89).

| Elle kurulan parça | Bugünkü sınıf | kabuk.js | araclar.js | deneme.js | tanisma.js | Toplam | Örnek satırlar |
|---|---|---|---|---|---|---|---|
| Düğme | `dugme` (+ `--ana`, `--sade`) | 23 | 38 | 8 | 16 | **85** | kabuk 226, 247; araclar 427; deneme 192; tanisma 358 |
| Eylem sırası | `eylemler` | 10 | 20 | 4 | 4 | **38** | kabuk 316-446; araclar 401-874 |
| Sayfa üstü + başlık | `I.ust(kirinti)` + `govde` + `<h1>` | 10 | 17 | 5 | 1 | **33** | kabuk 254; araclar 405-869; deneme 166-247 |
| Rozet / etiket | `pul` (+ `--pilot`) | 8 | 13 | 5 | 2 | **28** | kabuk 237, 264; araclar 352-872; deneme 191-260 |
| Form alanı | `label.alanet` + `.giris` | 0 | 22 (+23 `giris`) | 0 | 2 `giris` | **22** | araclar 418-789 |
| Boş durum / yuva | `yuva` (role=note) | 6 | 8 | 5 | 0 | **19** | kabuk 307-431; araclar 344-854; deneme 166-222 |
| Uyarı / durum satırı | `notform__ileti`, `role=alert/status`, `aria-live` | 4 | 10 | 4 | 3 | **21** | araclar 417, 477, 561, 624, 746, 774 |
| Sayı satırı (sayı + kesinlik etiketi) | `ozet li` > `b` + `pul` | 1 | 6 | 6 | 0 | **13** | araclar 633-668; deneme 190-260 |
| Liste satırı | `satir` (+ `--kilitli`, `--kapi`), `yer`, `blok`, `kartliste li`, `tn__olgu` | 7+1 | 3+8+1 | 0 | 1 | **21** | kabuk 236, 298, 327; araclar 350, 389, 581, 718 |
| Sonuç paneli / kart | `kapisonuc`, `kart`, `sistemnot`, `soru`, `dal`, `tn__panel` | 5 | 7 | 3 | 2 | **17** | kabuk 397, 425; araclar 538, 870; deneme 238, 247; tanisma 396 |
| Onay kutusu / radyo | `isaret` | 0 | 6 | 0 | 0 | **6** | araclar 421-756 |
| Ders / ünite kutusu | `unitekutu`, `satir` (ders) | 3 | 0 | 0 | 0 | **3** | kabuk 324-332 |
| İlerleme | yalnız metin «3/8 ders okundu» | 2 | 0 | 0 | 0 | **2** | kabuk 318, 324 — çubuk yok |

**Ekrandan ekrana değişen boyutlar (sorunun kanıtı, `kabuk/kabuk.css`):**
- 20 ayrı `font-size` değeri (.72, .78, .8, .82, .85, .9, .95, 1, 1.05, 1.08, 1.1, 1.15, 1.2, 1.4, 1.5 rem, 13 px, 20 px, iki `clamp`).
- 35 ayrı `padding` değeri; aynı «satır» işi beş dolguyla çiziliyor: `.satir` 14/16, `.unite` 12/14, `.blok` 10/14,
  `.hafta .blok` 8/10, `.ozet li` 10/0, `.kartliste li` 8/0.
- Aynı düğme bağlama göre boy değiştiriyor: `.dugme` 44 px, `.dugme--ana` 52, `.seg button` 40, `.notlar .dugme` 52,
  `.tn__ben .dugme` 36 (bağlam seçicileri: `.notlar .dugme`, `.tn__ben .dugme`, `.tn__dug .dugme`, `.hafta .blok`, `.satir .pul`).
- Panel dolgusu 14 (`kapisonuc`, `soru`, `dal`), 16 (`yuva`, `sistemnot`, `tn__panel`), 20 (`kart`).
- `.liste` iki kez tanımlı (gap 8 px, sonra 6 px; ikincisi kazanıyor).
- `tanisma.js` kendi 23 satırlık CSS'ini JS içinde sayfaya basıyor (`STIL`, s.315-340): `tn__*` sınıfları kabuk.css'te yok.
- Kesinlik etiketi (`ölçüldü / tahmin / hesaplandı / veri yok`, AGENTS §1.2) her yerde elle yazılıyor; iki ayrı sözlük
  (`araclar.js` 723 ve 764 `E = { computed, estimated, missing }`), etiket kodda zorunlu değil, yazanın dikkatine kalmış (örn. `deneme.js` 190'da test başına soru sayısı etiketsiz; sayım, ölçü değil, ama kuralı denetleyen yok).

## 2. Yapı taşları ve boyut kuralları

Dosyalar: `kabuk/bilesen.js` (taşlar, saf işlevler, HTML metni döndürür; tarayıcıda `window.Bilesen` ve
`LIFEOS.Kabuk.Bilesen`, Node'da `module.exports`; ad çakışması yok: depoda `Bilesen` yalnız eski CSS yorumlarında geçiyor),
`kabuk/bilesen.css` (bütün ölçüler), `kabuk/bilesen.html` (katalog). Kabuk HTML metni kurduğu için taşlar da HTML metni döndürür.

**Ortak kurallar**
- Yalnız `kabuk/kabuk.css` jetonları (`--bg --yuzey --yuzey-2 --cizgi --cizgi-guclu --yazi --yazi-2 --soluk --ana --altin --vurgu
  --vurgu-yazi --golge --piksel --govde --sure --satir`); yeni jeton, renk, yazı tipi, köşe yok (testte denetleniyor).
- Bağlam seçicisi yok: her kural `.b-…` ile başlar (testte denetleniyor). Bugünkü `.notlar .dugme`, `.hafta .blok` türü
  «aynı parça başka yerde başka boy» yapısal olarak yazılamaz.
- Ölçek: aralık 4 · 8 · 12 · 16 px; yazı .72 · .85 · 1 · 1.15 · 1.5 rem (20 değerden 5'e); dokunma 44 px, ana düğme 52 px;
  çizgi 2 px, vurgulu 3 px. Satır yükseklikleri `--satir` ayarıyla hesaplanır, yazı boyutu ayarıyla birlikte büyür.
- Metin hep kaçışlı (`& < > " '`); yanlış girdi `TypeError` atar. İç içe parça HTML değil seçenek nesnesiyle verilir
  (`bos.eylem`, `liste.ogeler`…); yalnız `bolum` ve `panel`'in `govde`'si başka taşların çıktısını alır.
- Renk tek başına anlam taşımaz: kilitli = kesik çizgi + «kilitli» yazısı; tahmin = kesik çizgi + «tahmin»; hata = kalın çizgi + «Hata:».
- Zorunlu renk kipinde (`forced-colors`) gölge çizgileri kenarlık olarak geri gelir.

| # | Taş | İşlev | Sabit boyut kuralı | Erişilebilirlik | Bugün yerine geçtiği |
|---|---|---|---|---|---|
| 1 | Düğme | `dugme({metin, tur: ikincil\|ana\|sade, href?, kapali?, etiket?, veri?, tip?})` | yükseklik 44 px (ana 52), dolgu 0 16 (ana 0 24, sade 0 12), yazı 1 rem (ana 1.15), tek satır, en çok 40 karakter | `<button>` ya da `<a href>`; kapalı = `aria-disabled` (odakta kalır); `etiket` → `aria-label` | `dugme`, `dugme--ana/--sade`, `deneme__nobt`, `tn__cip` |
| 2 | Rozet | `pul(metin \| {metin, tur: normal\|vurgu\|altin\|kesik})` | yükseklik 1.5 rem, yazı .72 rem, en çok 24 karakter, kesilmez | düz metin, okunur | `pul`, `pul--pilot` |
| 3 | Liste satırı + liste | `satir({ad, not?, pul?, href?, durum: acik\|kilitli\|secili, veri?})`, `liste({ad, ogeler, tur: satir\|ders})` | yükseklik = (1 + .85 rem) × satır aralığı + 24 px; notu olmayan satır da aynı boy; ad ve not tek satır, taşan kısaltılır | `<ul aria-label>`; seçili `aria-current`; kilitli `aria-disabled` + yazı; ok `aria-hidden` | `satir`, `unite`, `yer`, `blok`, `kartliste li`, `tn__olgu` |
| 4 | Ders kartı | `ders({baslik, ozet?, durum: yeni\|okundu\|kilitli, href, sure?, taslak?})` | yükseklik = (1.15 + 2 rem) × satır aralığı + 1.5 rem + 48 px: başlık 1 satır, özet en çok 2 satır, alt satır; ızgarada sütun ≥ 280 px | açık ders bağlantı, kilitli `aria-disabled` ve bağlantı değil; taslak yazıyla | `unitekutu` içindeki ders `satir`'ı, `kart` |
| 5 | İlerleme çubuğu | `ilerleme({ad, deger, toplam})` | çubuk 16 px; toplam ≤ 12 tik tik (adım başına kare), üstü sürekli; sayı «3 / 8» hep yazılı | `role=progressbar`, `aria-valuemin/max/now`, `aria-valuetext` «8 içinden 3»; hedef yoksa çizilmez (kural 10) | yalnız metin «3/8 ders okundu» (kabuk.js 318) |
| 6 | Form alanı | `alan({ad, isim, tur: metin\|cok\|sayi\|tarih\|saat\|secim\|onay, deger?, ipucu?, hata?, zorunlu?, secenekler?, enCok?})` | giriş 44 px; çok satır sabit 4 satır; etiket .85 rem üstte | `<label for>`; ipucu ve hata `aria-describedby`; hata `aria-invalid` + «Hata:»; zorunlu `required` + «· gerekli» yazısı | `alanet` + `giris`, `isaret`, `sayiayar` |
| 7 | Boş durum | `bos({baslik, metin?, eylem?})` | dolgu 16, aralık 8, 2 px kesik çizgi; en çok bir eylem | `role=note` | `yuva` |
| 8 | Başlık + eylem | `baslik({metin, duzey: 1\|2, alt?, eylem?, id?})` | ızgara: başlık sütunu + eylem; en az 44 px; eylem her genişlikte sağda | `h1`/`h2` + kimlik (Türkçe harfler katlanır) | `<h1>` + `<p class="soluk">` + `eylemler` |
| 9 | Sayı kutusu + ızgara | `sayi({ad, deger, birim?, etiket})`, `sayilar({ad, ogeler})` | yükseklik = .85 rem × satır aralığı + 3.3 rem + 32 px; sayı 1.5 rem piksel; ızgarada sütun ≥ 9 rem | **etiket zorunlu** (`measured/estimated/computed/missing/eski` → ölçüldü/tahmin/hesaplandı/veri yok/eski kayıt); `missing`'de sayı yok, «—»; `aria-label` sayıyı cümleyle söyler | `ozet li` > `b` + `pul` |
| 10 | Uyarı / bilgi satırı | `uyari({tur: bilgi\|tamam\|dikkat\|hata, metin})` | en az 44 px; dolgu 10 16; sol çizgi 4 px; tür sözcüğü sabit 3.5 rem sütun | hata `alert`, tamam `status`, öteki `note`; tür sözcükle de | `notform__ileti`, `ipucu`, dağınık `role=alert/status` |
| 11 | Bölüm | `bolum({baslik, govde, eylem?, id?})` | aralık 12 px; üst sıra ızgara, en az 44 px | `<section aria-labelledby>` + `h2` | `<section><h2>`, `ayargrup`, `hafta__gun` |
| 12 | Panel | `panel({baslik?, govde, tur: normal\|guclu\|basari, id?})` | dolgu 16, aralık 12; çizgi 2 px (başarı 3 px altın) | başlıklıysa `<section aria-labelledby>` | `kapisonuc(--gecti)`, `kart`, `sistemnot`, `soru`, `dal`, `tn__panel` |

**Ölçüldü (Chromium, 1280 ve 390 px, açık tema, `tools/bilesen_goruntu.js` ile aynı sayfa):** satır 68 px, ders kartı 148 px,
sayı kutusu 105 px, giriş 44 px, çok satırlı giriş 116 px, düğme 44/52 px, bölüm üstü 44 px; **iki genişlikte de aynı**. Kilitli,
seçili, notsuz satırlar ve kilitli kart da aynı boyda. Başlık yüksekliği yazıya göre değişir (h1 kabuk.css'te `clamp(1.6rem,4vw,2.1rem)`).

Ölçerken çıkan bir hata düzeltildi: başlık ve bölüm üst sırası önce sarmalayan flex'ti; sütun flex içinde (`.govde` öyle)
Chromium yüksekliği 67 yerine 123 px hesaplıyordu. İkisi de ızgaraya çevrildi.

## 3. Ayarlar karşılaştırması

`envanter-kabuk-sunucu.md` §3b-§3d (s.205-250) «tut» satırları ↔ `kabuk/ayar.js` `SEMA` (17 satır).
**Sonuç: `kabuk/ayar.js`'e eklenecek ayar çıkmadı; dosya değişmedi.** «Tut» denen her tercih zaten şemada; kalanlar tercih değil
durum, ya da tarayıcı deposuna değil sunucuya ait.

| Envanter satırı | Öneri | `kabuk/ayar.js` | Not |
|---|---|---|---|
| §3b lifeos.boyut | tut, tek yerde | var | Erişilebilirlik |
| §3b lifeos.satir | tut | var | |
| §3b lifeos.kontrast | tut | var | |
| §3b lifeos.odak | tut | var | |
| §3b lifeos.altcizgi | tut | var | |
| §3b lifeos.vurgu | tut («modül» → alan rengi) | var | `modul` değeri «Alanın rengi» adıyla |
| §3b lifeos.rozet | tut | var | Bildirim |
| §3c tema.secim, tema.oto, yazi | tut | var (üçü) | |
| §3c hareket | hareket tut | var | `hareket.hiz`, `hareket.bulut` «tut» değil |
| §3c sessiz saatler | tut | var (`lifeos.sessiz`, saat aralığı) | `sessiz.bitis` anlık «şimdi sustur» durumu |
| §3c kilit.odeme | tut | var (eşitlenmez) | |
| §3c ice.var | tut | **yok, bilerek** | Tercih değil durum: `brand/ortak/ice.js` s.52-61 kod yazıyor («Google verisi var» = `'1'`); kullanıcı seçmiyor. Envanterin kendi önerisi (§3c sonu): «durum anahtarları şemaya girmez». faz2-kabuk.md ile aynı karar |
| §3d 4180 levhası «Tema tut» | tut | var | aynı anahtar (`lifeos.tema.secim`) |
| §3d Planlama (`sistem/planlama.py` 6 iş) | tut | **yok, dışarıda** | Sunucu tarafı: kayıt `%LOCALAPPDATA%\LifeOS\planlama.json`, gün başına saat; şemanın türleri (secim, saatAraligi, sayi) ve tarayıcı deposu bunu taşımaz. `sistem/` bu pakette başka mühendiste |
| §3d Bu modül › Gizlilik kilidi | Hesap'a | **yok, dışarıda** | `lifeos.kilit.<modül>` modül başına 4 haneli kilit (`brand/ortak/kilit.js` s.60): gizli değer, tek sistemde «modül» yok. Sahibin kararı gerekir (§6) |

**Test değişikliği gerekirse (kabuk.test.js'e dokunulmadı):** §3d'den bir satır şemaya girerse `kabuk/kabuk.test.js`'teki
«ayar: her satırın zorunlu alanları var» testinin kaynak denetimi `/envanter-kabuk-sunucu\.md §3[bc]|envanter-spi\.md §/` → `§3[bcd]`
olmalı. Planlama için ayrıca yeni bir `tur` (ör. `isPlani`) ile `dogrula`/`ciz` dalı ve o türün varsayılan örneği gerekir.

## 4. Test sonuçları

| Komut | Sonuç |
|---|---|
| `node kabuk/bilesen.test.js` | **9 geçti, 0 kaldı** (çıkış 0) |
| `node tools/bilesen_goruntu.js` | 4/4 görünüm: yatay taşma 0 px, 12 taş; konsolda hata yok (çıkış 0) |
| `node kabuk/kabuk.test.js` (dokunulmadı, denetim için) | 51 geçti, 0 kaldı |
| `python kalite/olcum.py --denetle` | «Bütçe tamam: 28 bütçe, aşım yok.» (çıkış 0); `kalite/butce.json` değişmedi |

`bilesen.test.js` kapsamı (kurulum yok, Node):
1. Katalog on iki taş sunar (`Bilesen.TASLAR`), her birinin örneği var.
2. **Kaçış:** her taşın her metin alanına `<img onerror>`, tırnak, `&` verilir; ham etiket ya da kaçışsız tırnak çıkmaz.
   Kaçış işlevi bozulunca bu test kırılıyor (bir kez elle bozularak denendi).
3. **Rol ve etiket:** düğme/bağlantı, kapalı düğme bağlantı değil, `aria-label`; liste `<ul aria-label>`, `aria-current`, kilitli
   `aria-disabled` + yazı; `progressbar` ve beş `aria-*`; `<label for>` + `aria-describedby` + `aria-invalid` + «Hata:»; `note`,
   `alert`, `status`; `section aria-labelledby` + `h2`; Türkçe başlıktan kimlik.
4. **Kötü girdi:** her taş seçeneksiz çağrıda, eksik/yanlış türde metin, 40/24 karakter sınırı, bilinmeyen `tur`/`durum`/`duzey`,
   `javascript:`, `data:`, `//alan`, boşluklu yol, kötü `data-` anahtarı, ilerlemede `deger > toplam` / kesirli / `null` /
   `toplam 0`, kötü `isim` ve `id`, seçenekte olmayan değer, nesne `govde` → `TypeError`.
5. **Kesinlik etiketi zorunlu:** etiketsiz, boş, görünen ad («ölçüldü»), prototip adı (`toString`) reddedilir; `missing` + sayı,
   `null`/`NaN`/metin sayı reddedilir; `sayilar` ızgarasında da; beş etiketin görünen adı ve `aria-label` cümlesi; veri yokken «—»
   (sıfır değil); tahmin kesik çizgiyle de.
6. `bilesen.css` yalnız kabuk.css'te tanımlı jetonları kullanır; yeni jeton, elle renk, köşe, başka yazı tipi yok.
7. `bilesen.css`'te bağlam seçicisi yok (her seçici `.b-…`).
8. Katalog sayfası yalnız `../brand/ortak/piksel-yazi.css`, `kabuk.css`, `bilesen.css`, `bilesen.js` yükler ve on iki taşı gösterir.

## 5. Ekran görüntüleri

`node tools/bilesen_goruntu.js` → `belgeler/ekip/sadelesme/kabuk-onizleme/`:
`bilesen-masaustu-acik.png`, `bilesen-masaustu-koyu.png` (1280 px), `bilesen-telefon-acik.png`, `bilesen-telefon-koyu.png` (390 px).
Tam sayfa, `file://`, sunucusuz, tek headless Chromium (`SPI/node_modules/playwright`), iş bitince kapanır.

Görüntülere bakılarak düzeltilenler:
- Uyarı satırında tür sözcüğü («Bilgi», «Dikkat») farklı genişlikteydi, metinler farklı yerden başlıyordu → sözcük sütunu 3.5 rem sabit.
- Masaüstünde başlık örnekleri arasında ~60 px boşluk vardı (§2'deki flex hatası) → ızgara.
- Katalogda başlık ve uyarı örnekleri dar sütuna sıkışıyordu → tam genişlik gösterim (yalnız katalog düzeni).

Kalan görsel not: varsayılan temada `--vurgu` = `--ana`, bu yüzden hatalı alanın kalın çizgisi seçili satırın çizgisiyle aynı renk;
ayrım «Hata:» yazısı ve 3 px çizgiyle yapılıyor (§6, soru 2).

## 6. Sahibine açık sorular

Tasarım kuralı «önce örnek göster» (AGENTS §0.1 kural 6): **örnek `kabuk/bilesen.html` sayfasının kendisidir** (tarayıcıda
dosyadan açılır; tema ve 390/1280 genişlik düğmeleri sayfada). Hiçbir ekran bu taşlara çevrilmedi; çevirme sonraki paket ve bu
sayfadaki onaya bağlı.

1. **On iki taş ve ölçek uygun mu?** Yazı 20 değerden 5'e (.72 · .85 · 1 · 1.15 · 1.5 rem), aralık 4/8/12/16 px. Liste satırında ve
   ders kartında uzun metin kısaltılıyor (tamamı ekran okuyucuda); kısaltmak yerine satırın uzaması mı istenir?
2. **Hata rengi:** kabuk.css'te hata jetonu yok (`.sayiayar` `var(--hata, #c0392b)` yazıyor, `--hata` hiç tanımlı değil). Taşlar
   hatada `--ana` kullanıyor; varsayılan temada bu vurguyla aynı renk. kabuk.css'e `--hata` jetonu eklensin mi (açık ve koyu değeri sahibin)?
3. **İlerleme:** 12 adıma kadar tik tik, üstü sürekli çubuk (AGENTS kural 10 «küçük tam sayı hedef → tik sayacı»). Eşik 12 uygun mu?
4. **Gizlilik kilidi** (§3d «Hesap'a»): tek sistemde tek bir uygulama kilidi mi olsun, yoksa kalksın mı? Karar gelirse şemaya
   ayrı tür olarak girer, kabuk.test.js kaynak denetimi `§3[bcd]` olur.
5. **Planlama işleri** (§3d «tut»): Ayarlar ekranında mı gösterilsin (sunucu ayarı olarak, ayrı tür), yoksa Sistem haritasındaki bir yerde mi?
6. Katalog sayfası istenen üç dosyaya ek olarak gömülü piksel yazı tipini (`../brand/ortak/piksel-yazi.css`) yüklüyor; yüklemezse
   sayfa tek aralıklı yedek yazıyla açılıyor ve kabuğa benzemiyordu. Kod değil, yazı tipi; uygun mu?
7. Sonraki paket (ekranları çevirme) için öneri: önce `kabuk.js` (Bugün, dal sayfaları), sonra `deneme.js`, en son `araclar.js` ve
   `tanisma.js`'in kendi CSS'i (`STIL`); her ekran çevrilince kabuk.css'ten karşılık gelen eski sınıflar silinir (kural 5: bir giren, bir çıkar).
