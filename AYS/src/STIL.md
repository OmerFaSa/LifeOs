# Rota — Stil Rehberi

> ## v4 — geçerli görsel dil (2026-09-24, ekip/EKIP-PLANI.md §2)
>
> Özet budur; ayrıntı aşağıdaki **Renk, Tipografi, Ölçü** bölümlerindedir
> (T3 sonrası yeniden yazıldı). Çelişkide jetonun kendisi (`jeton.css`) geçer.
>
> - **Jetonlar tek kaynakta:** `brand/ortak/jeton.css` → `src/css/jeton.css`
>   (kopyayı elle düzenleme; `python3 tools/ortak.py --yay`). Modülün
>   `tokens.css`'i yalnız kuyruktur: `--mod-*` bağlaması, ajan, makro ve
>   grafik serisi renkleri. Yükleme: `fonts → jeton → tokens`. Paletler ve beş düzen kalktı (§8-4): tek tasarım, tema Açık · Koyu · Sistem.
> - **Renk sahipliği söyler:** mavi AYS (`--ays`), yeşil SPİ (`--spi`),
>   turuncu ESP (`--esp`), mor Merkez (`--mer`). Yeşil ve kırmızı yalnız
>   yön bildirir (`--ok`, `--bad`, `--now`). Derse, kategoriye, süse renk yok.
> - **Her rengin iki jetonu:** v4 tonu (`--spi`) işaret içindir (nokta,
>   çubuk, çizgi); yazı ve dolu düğme aynı ailenin AA tonunu kullanır
>   (`--spi-ink`). `--primary` modülün `-ink` tonudur.
> - **Yüzey:** ton + ince çizgi (`--border`, `--border-soft`). Kartta gölge
>   yok; gölge (`--shadow-lg`) yalnız açılır katmanda.
> - **Yazı:** Inter tek aile; rakamlar her yerde tablo hizalı (`tnum`). Rol
>   ayrımı boyut ve ağırlıkla: sayfa başlığı `--fs-display` 26, kutu adı
>   `--fs-md` 15/600, büyük sayı `--fs-hero` 28/700.
> - **Köşe:** rozet `--r-xs` 6 · düğme `--r-sm` 8 · iç kart `--r-md` 10 ·
>   kart `--r` 14. **Hareket:** basma 120 · geçiş 200 · açılma 320 ·
>   giriş 700 ms; azaltılmış harekette hepsi 0.
> - **Temel kalıplar** `brand/ortak/temel.css`'te: `C.Kutu` (katalog 02:
>   simge · ad · sağda kesinlik yuvası), `C.ModulIsareti` (165: renk + harf
>   + şekil), düğme (`primary` modül rengi, `ink` siyah, `ghost`), çip
>   (köşeli), rozet (hap), alt çekmece tutamağı (162).
> - **Hap biçimi** yalnız etkin sekmede ve rozette.
> - **Kabuk** (T2) `brand/ortak/kabuk.js` + `kabuk.css`'te; app.js yalnız
>   veriyi verir. Sıra: üst çubuk (modül menüsü · sekiz çekmece · ara ·
>   zil · bağlantı noktası · rütbe çipi · profil) → gün şeridi → sayfa
>   başı (yol «Plan › Hafta», başlık, tek cümle, eylemler) → bölüm çubuğu
>   → ekran → sayfa sonu. Telefonda alt bant (Bugün · Plan · Çalışma ·
>   Menü) ve sağ altta +. Çekmece adları `LIFEOS.KABUK.CEKMECELER`'den
>   gelir; ekranın yeri `R.App.NAV`'da, yolu `R.App.yolOf(rota)`'da.
> - **Ekranın içinde sekme yok** (sadelik bütçesi): çekmecenin bölümleri
>   bölüm çubuğunda, ekranın parçaları alt alta kutularda durur. Boş
>   durum bir `C.Kutu` + tek eylemdir; kutu başlığı `h2`'dir.


## Renk

Tek tasarım, üç tema: **Açık · Koyu · Sistem** (`data-theme`, varsayılan
Sistem). Palet ve düzen seçimi yoktur (EKIP-PLANI §8-4). Bütün renkler
`jeton.css`'tedir; modülün `tokens.css`'i yalnız `--mod-*` bağlamasını ve
kimlik renklerini (ajan, grafik serisi) ekler. Ham renk yazılmaz.

**Renk sahipliği söyler, süs değildir.** Her ailenin üç jetonu vardır:
işaret (nokta, çubuk, çizgi), yazı ve dolu düğme için AA tonu (`-ink`),
açık zemin (`-t`).

| Aile | İşaret | Yazı (`-ink`) | Kimin |
|---|---|---|---|
| `--ays` | #2D5BE3 | #2D5BE3 | AYS |
| `--spi` | #0E8C79 | #0A7A69 | SPİ |
| `--esp` | #C8741C | #A65B0F | ESP |
| `--mer` | #7453D4 | #7453D4 | Merkez (HKM) |

`--primary` modülün `-ink` tonudur (`--mod-ink`), `--primary-soft` açık
tonu. Mor yalnız Merkez'indir; sadelik ölçümü «Merkez dışında mor»u sayar.

**Yön renkleri yalnız iyi / kötü / şimdi söyler:** `--ok` yeşil, `--bad`
kırmızı, `--now` şimdi çizgisi. Derse, kategoriye, bölüme renk verilmez.
`--accent` koyu hardaldır (uyarı); `--info` nötrdür (bilgi kutusu mavi
değildir, mavi AYS'nindir); `--danger` (`--bad-ink`) yalnız yıkıcı eylem
ve borç içindir.

Yüzey `--bg → --surface → --surface-2 → --surface-3` derinleşir, çizgi
`--border-soft → --border → --border-strong` koyulaşır, metin `--text →
--text-2 → --text-3` soluklaşır (beyaz üzerinde 5,9:1 ve 4,9:1). Kontrastı
`tools/palettecheck.js` iki temada ölçer; hepsi AA.

**Renk tek başına anlam taşımaz:** durum her zaman ikon ya da metinle
birlikte verilir (`C.Badge` tona göre ikon ekler). Ajan renkleri durum
değil **imza**dır: masanın kime ait olduğunu söyler.

## Tipografi

Tek aile: **Inter** (`--font-body`; `--font-display` ve `--font-serif`
eski adlar kırılmasın diye aynı aileye bağlıdır). Rakamlar her yerde tablo
hizalıdır (`tnum`). Rol ayrımı boyut ve ağırlıkla yapılır:

| Jeton | Boyut | Kullanım |
|---|---|---|
| `--fs-xs` | 11.5px | etiket, yardımcı bilgi |
| `--fs-sm` | 12.75px | ikincil metin, tablo hücresi |
| `--fs-base` | 14px | gövde, form |
| `--fs-md` | 15px | kutu adı (600) |
| `--fs-lg` | 18px | bölüm başlığı |
| `--fs-xl` | 22px | ara başlık |
| `--fs-display` | 26px | yalnız sayfa başlığı |
| `--fs-hero` | 28px | yalnız özet kutusundaki büyük sayı (700) |

Ekranda 30 kelimeyi aşan tek parça yazı durmaz: kısa cümle görünür,
gerekçe `C.Ayrinti`'nin («Neden?») altına iner. Hiçbir metin silinmez,
yalnız katmanı değişir.

## Ölçü

**Boşluk 4'ün katları:** `--sp-1` 4 · `--sp-2` 8 · `--sp-3` 12 ·
`--sp-4` 16 · `--sp-6` 24 · `--sp-8` 32 · `--sp-10` 40. Tekrar eden boşluk
için yardımcı sınıf (`gap-*`, `mt-*`); `style=""` yalnız değere bağlı
yerde kalır (çubuk genişliği, iskelet satırı).

**Köşe:** rozet `--r-xs` 6 · düğme ve kontrol `--r-sm` 8 · iç kart
`--r-md` 10 · kart `--r` 14 · hap `--r-pill` (yalnız rozette ve etkin
seçimde).

**Yüzey:** ton + ince çizgi. Kartta gölge yok (`--shadow:none`);
`--shadow-lg` yalnız açılır katmanda (alt sayfa, komut paleti, açılır
menü), arkasında `--scrim` perdesi.

**Dokunma:** her hedef en az 24 px; açılır satır başlığı 40 px
(`tools/layoutcheck.js`, 390 px'te).

**Sadelik bütçesi** (ekran başına, `tools/sadelik.js`; teslim edilen
modülde CI'da kırmızı): ekran içi sekme 0 · dolu (birincil) düğme en çok
1 · 30+ kelimelik tek parça yazı 0 · resimsi simge (emoji) 0 · Bugün
≤ 1 800 px ve ≤ 14 düğme.

## Hareket

Tek easing `--ease`, dört süre: basma `--dur-press` 120 · geçiş `--dur`
200 · açılma `--dur-lg` 320 · giriş `--dur-in` 700 ms. Hareket bilgi
taşımaz, yalnız DEĞİŞİKLİĞİ gösterir. Azaltılmış harekette hepsi kapanır
ve hiçbir işlev bozulmaz.

Uygulama her eylemde sayfayı baştan çizer; bu yüzden hareket CSS'e
bırakılmaz (her tıklamada baştan oynardı). `LIFEOS.HAREKET`
(`brand/ortak/hareket.js` + `hareket.css`, T4) çizimden önce fotoğraf
alır, sonra karşılaştırır: yalnız değişen öğe hareket eder. Ekran hangi
öğenin izlendiğini `data-h-*` ile söyler.

| Katalog | Ne | Nasıl işaretlenir |
|---|---|---|
| 12 | Tek canlı öğe: yalnız sıradaki iş nabız atar | sakin olmayan `C.NextUp` ve gün şeridindeki süren blok; ikincisi `.h-sakin` |
| 14 | Odak kapısı: süren iş kalır, gerisi sis; Esc çıkar | `data-h-odak`, çıkış düğmesinde `data-h-odak-cik` (AYS odak modu kendi katmanı) |
| 149 | Sayı yuvarlanması | `data-h-sayi="<anahtar>"` — `C.Stat`, `C.Meter`, üst çubuk sayaçları |
| 152 | Tik çizimi, satır yavaşça solar | `data-h="<anahtar>" data-h-bitti="0/1"` — `C.Checkbox` |
| 153 | Kart açılma geçişi | yönlendirmede basılan kutu, kart, satır yeni ekrana büyür (görünüm geçişi) |
| 154 | Küçülen başlık | dar ekranda (≤ 1039 px) sayfa başlığı üst çubuğa yerleşir |
| 156 | Odak halkası akışı | klavye odağında halka kayarak gelir, varınca söner; kalıcı halka `:focus-visible` |
| 158 | Satır kapanma | `data-h-satir="<anahtar>"`; bir çizimde en çok 3 satır kaybolursa |
| 159 | Üzerine gelince önizleme | `.linkbtn`, `a` ya da `[data-h-onizle]` taşıyan `data-route`; yalnız fareli cihazda |

İçerik yalnız YENİ ekranda yükselir (`.content.h-yeni`); üst çubuğun renk
çizgisi yalnız ilk açılışta uzar. Düğme basınca oturur, katman yükselir,
bildirim alttan girer.

Dikkat çekmek için animasyon yoktur: yanıp sönme, zıplama kullanılmaz.
Döngü yalnız **süren bir işi** gösterir (iskelet parıltısı, açılış çubuğu,
konuşmakta olan ajanın nabzı) ve iş bitince durur.

## Ekranlar

Sekiz çekmece (`LIFEOS.KABUK.CEKMECELER`: Bugün · Plan · Çalışma · Analiz ·
Onaylar · Ofis · Kütüphanem · Ayarlar); hangi ekranın hangi çekmecede
durduğu `R.App.NAV`'da, yolu `R.App.yolOf(rota)`'da, gerekçesi
`ekip/CEKMECE-HARITASI.md`'de. Liste burada tekrar yazılmaz: kopya bir gün
kaynağından ayrışır.

Ekranın içinde sekme yoktur (T3): parçalar alt alta bölümdür
(`C.SayfaBolumleri`), bölüm çubuğu (019) aralarında kaydırır. `Analiz`
altı bölümdür: deneme karşılaştırma · boş bırakma · hata haritası · sıra
geçmişi · unutma eğrisi · kapasite gerçekliği. Hepsi `R.Analytics`
üzerinden okur; hiçbiri yazmaz.

`Profiller` çok kullanıcılıdır: her profil kendi `localStorage` anahtarında
durur (`rota84285.v2.<profil>`), veriler karışmaz. Karşılaştırma ve veli
görünümü yalnız özet okur.

Konu özeti (`topic`) gezinmede yer almaz; Dersler ekranından açılır.

`Ofis` altı ajanlıdır: Patron ekibi yönetir, Tuna TYT'ye, Yaman AYT'ye, Rana
rehberliğe, Deniz ölçüme, Kerem çözülen soruya bakar. Her ajan yalnız kendi brifingini görür; karar
ve gündem kural motorundan gelir. Ayrıntı için `src/OFIS.md`.

Günlük yolculuk tek zincirdir ve `Bugün` ekranındaki **Günün akışı** kartı bu
zinciri gösterir: **izle → not → soru → kart → mola**. Her adım bir ekrana bağlanır;
tamamlananlar sönükleşir, tamamlanmayanların yanında “Git” durur.

## Ayarlar

Ayarlar çekmecesinin ekranları `LIFEOS.AYAR`'ı (`brand/ortak/ayar.js`, T5)
kullanır; ekran kodu bir şey bilmek zorunda değildir:

- **Kaydedilmemiş değişiklik (21):** «Kaydet» (`save-*`) düğmesi olan
  kutudaki alan değişince yanında nokta, altta «N değişiklik kaydedilmedi
  · Vazgeç · Kaydet». Neyin değiştiğini tarayıcı bilir (`defaultValue`);
  anında uygulanan alan (`data-change`) sayılmaz. Yeniden çizimde ve
  ekrandan çıkıp dönünce yazılan değer kaybolmaz.
- **Varsayılana dön (182):** alan `data-varsayilan` (+ `data-varsayilan-ad`)
  taşırsa ve değeri farklıysa altında «Varsayılan: … · Varsayılana dön».
- **Ayar arama (183):** sayfa başında; dizin ayar ekranlarının kendi
  çiziminden kurulur, sonuç tam yoluyla («AYS › Ayarlar › Genel › …»).
- **Tema önizlemesi (181):** `C.TemaSecici` — üç seçenek kendi renginde
  küçük örnekle; açık örnek `--l-*`, koyu örnek `--d-*` jetonlarından.
- **İlk açılış (171):** SPİ ve ESP kurulumu üç adımdır ve adımlar tanıtımın
  soruları: Ne ölçüyoruz? · Neye karar vermiyoruz? · Nasıl başlıyoruz?
  («Başla» yalnız son adımda; sınır atlanamaz). AYS kurulumu beş veri
  adımıdır; ilerleme çubuğu üstte.
- **Gizlilik kilidi (176):** Ayarlar'da; açılışta dört haneli kod, veri
  çizilmeden önce. Perdedir, kasa değil; «Kodu unuttum» bir dakika sonra
  kilidi kaldırır.
- **Ne değişti? (17):** güncellemeden sonraki ilk açılışta sayfanın başında
  tek kart (`brand/ortak/yenilik.js`).

## Bileşen sözlüğü

v4: `C.Kutu` `C.ModulIsareti` `C.SayfaBolumleri` (+ `C.bolumeGit`)
`C.Ayrinti` `C.SakinHata` `C.TemaSecici`

`C.Card` `C.Collapsible` `C.Stat` `C.Bar` `C.Meter` `C.Badge` `C.Chip`
`C.Button` `C.IconButton` `C.Segmented` `C.Subtabs` `C.Field` `C.Input`
`C.Textarea` `C.Select` `C.Checkbox` `C.Notice` `C.Empty` `C.Skeleton`
`C.NextUp` `C.Table` `C.Pager` (+ `C.paginate`)
düzen: `C.Grid` `C.Span` `C.Stack` `C.Cols` `C.Row` `C.SectionTitle`

Varyantlar açık alanlarla gelir: `tone:'ok'|'warn'|'danger'|'info'|'muted'`,
`size:'sm'|'lg'`, `block:true`, `pad:'sm'`, `flat:true`.

Ekrana özel yapılar CSS'te adlandırılır, bileşene çevrilmez:
`quizcard` / `choice` (sınama), `riskrow` (öncelik), `estimate` (tahmini sıra),
`flowstep` (günün akışı), `energy` / `reward` (davranış), `player` / `seg-row` (ders notu),
`runclock` (süreli deneme oturumu), `wizstep` / `levelbtn` (kurulum sihirbazı),
`palettebtn` (palet seçici), `notedot` (profil notu), `msg--me` / `msg--coach` (koç),
`agentav` / `desk` / `deskstate` / `finding` / `note` (ofis masaları),
`qdrop` / `qsolution` / `qthread` / `tsug` / `srcrow` (soru çözüm),
`voicerow` (ses eşleştirme),
`floor` / `seat` (ofis kat planı), `room3d` / `desk3d` (ofisin 3B odası),
`board` (ofis panosu), `keyrow` (API anahtarları),
`meetbar` / `meetturn` / `agentref` / `reportrow` (toplantı, hitap ve rapor).

**Bileşen tek yerdedir.** Eski `UI.stat / badge / notice / table / field / input`
köprüsü kaldırıldı; `R.UI` yalnız ikon, SVG çizim, ipucu rayı ve katman
(sheet / toast) işlerini tutar.

## Kart kuralı

Tek kart stili vardır. Vurgu için renkli sol kenarlık **kullanılmaz**;
başlık yanında rozet kullanılır. Kart içinde en fazla üç bilgi katmanı.

## Durumlar

Her ekran üç durumu tanımlar:

- **Boş** → `C.Empty({ text, action })` (katalog 010) — küçük çizim, tek
  cümle, en çok tek eylem. Boş grafik ya da «0» gösterilmez: «ölçüldü ve
  sıfır» diye okunur.
- **Yükleniyor** → `C.Skeleton({ rows })` — spinner değil iskelet.
- **Süzgeç boş** → `C.Empty` + “süzgeci sıfırla” eylemi; kullanıcı çıkmaza düşmez.
- **Hata** → `C.SakinHata` (katalog 011): kırmızı yok, ilk cümle «Verin
  yerinde; hiçbir kayıt silinmedi.», tek düğme, teknik ileti «Teknik
  ayrıntı» altında. Ekran, kabuk ve açılış hatası aynı kalıbı kullanır;
  diğer ekranlar açılmaya devam eder.

## Erişilebilirlik kuralları

- Etkileşimli her öğe `<button>`; ikon-only olanlara `aria-label`.
- Görünür odak halkası (`:focus-visible`) hiçbir yerde kaldırılmaz.
- Form etiketi `C.Field` ile input'u sarar.
- `Escape` sırayla: komut paleti → odak modu → ipucu balonu → sheet → kenar çubuğu.

## Yazım

Arayüz Türkçe. Buton fiil ("Kaydet"), sonuç bildirimi geçmiş zaman ("Kaydedildi").
Hata mesajı ne olduğunu ve ne yapılacağını söyler, özür dilemez.
Sayı ve tarih Türkçe biçimde (`19,50` · `14 Eylül 2026`).
