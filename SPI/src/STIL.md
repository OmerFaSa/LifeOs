# SPİ — Stil Rehberi

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


Tek token kaynağı: `css/tokens.css`. Bileşenler yalnız bu değişkenleri kullanır;
ham renk veya ölçü yazılmaz.

Tasarım sistemi kardeş proje AYS ile ortaktır: aynı jetonlar, aynı kart, düğme
ve tablo dili. Bu kasıtlıdır — iki uygulama aynı kişinin gün içinde dönüşümlü
kullandığı iki araçtır ve aynı yerde durmalıdır. Ayrılan yer yalnızca alana özel
yapılardır: referans aralığı çubuğu, öğün kartı, porsiyon paylaştırma.

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

## Düzen — bir sağlık defteri

Tasarımın fikri şudur: bu bir yönetim paneli değil, **tutulan bir kayıt
defteri**. Sistemin bütün doktrini dürüst ölçüm üzerine kurulu — kesinlik
etiketleri, eksik verinin sıfır sayılmaması, kural motorunun otoritesi.
Görsel dil de bunu söylemeli: klinik bir hassasiyet, ama soğumayan bir
sıcaklık.

Kabuk dört parçadır:

| Parça | Ne yapar | Yapışır mı |
|---|---|---|
| `masthead` | Kimlik · tarih · araçlar | Hayır — okurken kimliğe ihtiyaç yok |
| `sitenav` | Numaralı yedi bölüm | **Evet** |
| `hero` | Bölüm imzası, durum, eylem, özet sayılar | Hayır |
| `sitefoot` | Koyu bant: klinik sınır ve mahremiyet | Hayır |

Kimlik satırının kaymasına izin vermek kasıtlıdır: sabit kalan çubuk böylece
yarı yüksekliğe iner ve içerik nefes alır.

**Alt bant her sayfayı sonlandırır.** Sistemin iki değişmez cümlesini
(klinik sınır, mahremiyet) her ekranda bir kez söyler. Bunları kart olarak
içeriğin ortasına koymak her seferinde okumayı bölüyordu.

**İçerik ortalanır ve genişliği sınırlıdır** (`--content-max` 1200px). Ekran
büyüdükçe satırlar uzamaz, kenar boşluğu büyür.

### Hero kuralı

Panel dilinde başlıkta ekranın **adı** yazardı («Tahliller») ve durumu okumak
için aşağı bakmak gerekirdi. Burada başlık **durumun kendisidir**:

```
02 ——— TESTLER                        ← bölüm imzası (kendi renginde)
1 ölçüm referans aralığının dışında.   ← durum (serif, display)
11 ölçüm kayıtlı. Değerler organa…     ← ne yapılacağı (lede)
[Test gir] [Rapor yapıştır]            ← eylem
                    11  1  5  1        ← özet sayılar
                    ╌╌╌╌╌╌╌╌╌          ← bölüm imzası (motif)
```

Ekran sözleşmesi:

```js
{ id, title, headline?(), lede?(), stats?(), actions(), render(), handle, change }
```

`headline` yoksa `title`, `lede` yoksa `subtitle()` kullanılır. `stats`
**en fazla dört** sayı döndürür.

Aynı cümle bir ekranda iki kez görünmez: hero sıradaki hamleyi söylüyorsa
gövdede onu tekrarlayan kart bulunmaz.

## Defter düzeni — ana düzen birimi

**Kart, yönetim panelinin dilidir.** Her şey eşit ağırlıkta beyaz bir
dikdörtgene konur, on beş dikdörtgen yan yana dizilir ve sayfa bir tepsiye
döner. Günde birkaç kez açılıp aylarca okunacak bir sistemde bu dil yorar:
hiçbir şey öne çıkmaz ve göz dinlenecek yer bulamaz.

Yerine defter satırı geldi — kitapların, defterlerin ve teknik belgelerin
yüzyıllardır kullandığı düzen:

```
KÜNYE SÜTUNU          İÇERİK
(196px)               (kalan genişlik)

SONUÇLAR              Ferritin      26 ng/mL   ──●──   referans altı
9 ölçüm · 20 Ağustos  ────────────────────────────────────────────
                      B12 vitamini  288 pg/mL  ──●──   hedefin altı
Önem sırasına göre…   ────────────────────────────────────────────
[Ölçüm ara…]          HDL kolesterol 44 mg/dL  ──●──   hedefin altı
[Test gir]
──────────────────────────────────────────────────────────────────
DAĞILIM               …
```

| Parça | Ne taşır |
|---|---|
| `lrow__label` | Bölümün adı — küçük, harf aralıklı, büyük harf |
| `lrow__meta` | Ölçü: kaç kayıt, hangi tarih |
| `lrow__note` | Neden böyle — gerekçe cümlesi |
| `lrow__act` | O bölümün eylemi |
| `lrow__main` | İçeriğin kendisi, çerçevesiz |

**Künye sütunu yapışır.** Yüz satırlık bir listeyi kaydırırken hangi
bölümde olduğunu unutmayasın diye.

`lrow--wide` künyeyi üste alır, içeriği tam genişliğe yayar: bir grafiğin
ya da uzun bir cetvelin künye sütunu kadar daralması saçmadır.

### Kutu nerede kalır?

Kutu yalnız **seçilebilir** ya da **yüzen** şeylerde: seçim kartı
(`pickcard`), alt sayfa (`sheet`), uyarı (`notice`), kırmızı bayrak
(`flagcard`), ofis masası (`desk`). **Okunacak bir şey kutuya konmaz.**

### Defter kipi

`C.Ledger` bir **işlev** alırsa, o işlev çalışırken `C.Card` ve
`C.Collapsible` kendilerini kutu olarak değil defter satırı olarak çizer:

```js
K.Ledger(() => [ totalCard(), itemsCard(), coverageCard() ])
```

Böylece ekranlar tek satırlık bir değişiklikle defter düzenine geçti ve
iki ayrı bileşen sözlüğü taşımak gerekmedi.

**`box:true` bu kipten kaçıştır.** Bir kartın gövdesinin içinde duran
kartlar (ofis masaları) satıra dönüşmemeli: onlar okunacak bir bölüm değil,
yan yana dizilen nesnelerdir. Bunu unutmak sessizce bozuk düzen üretir —
`tools/ledgercheck.js` on iki ekranın bütün sekmelerinde iç içe satır,
dönüştürülmemiş kart ve yatay taşma arar.

## Bölüm kimlikleri — tek tasarım, yedi imza

Düzen, tipografi, boşluk ve bileşenler **her bölümde aynıdır**. Değişen tek
şey `--sec`: bölümün kendi rengi.

| # | Bölüm | Renk | İmza |
|---|---|---|---|
| 01 | Günlük | Adaçayı | Bir günün yirmi dört çentiği |
| 02 | Testler | Klinik mavi | Ölçüm cetveli ve ibresi |
| 03 | Besin | Kehribar | Tabak ve üç makro dilimi |
| 04 | Hareket | Kiremit | Efor eğrisi ve toparlanma |
| 05 | Finans | Zeytin | Defter sütunu ve toplam çizgisi |
| 06 | Ofis | Erik | Patron ve dört koç |
| 07 | Ayarlar | Taş | Üç sürgü |

Renkler aynı doygunluk ailesinden seçildi: yan yana konduklarında gökkuşağı
değil, tek bir palet gibi okunurlar.

`--sec` yalnız **beş** yerde görünür: bölüm numarası, etkin sekme çizgisi,
bölüm başlığının üstündeki kısa çizgi, ana düğme ve bölüm imzası.

**Durum renkleri buna karışmaz.** `ok` / `warn` / `danger` her bölümde
aynıdır. Aksi hâlde bir tahlil sonucunun rengi hangi sayfada olduğuna göre
değişirdi ve bu, sağlık verisinde kabul edilemez.

### Filigran numara

Hero'nun sağ üst köşesinde bölüm numarası, çok soluk ve çok büyük (150px,
%6 opaklık). Bir yayının bölüm sayfalarındaki numara gibi: okunmak için
değil, sayfaya ağırlık ve yer duygusu vermek için. İçerik genişliğinin sağ
kenarına hizalanır; taşarak kesilmez.

Sayfanın en üstünde de bölümün renginde 2px'lik bir şerit durur — hangi
bölümde olunduğunu, gezinmeye bakmadan, kenardan söyler.

### Bölüm imzaları (motif)

Her bölümün hero'sunda duran ince, tek renkli işaret. Süs değil: bölümün
**ne ölçtüğünü** soyutlar ve kullanıcı sayfayı okumadan hangi bölümde
olduğunu çevresel görüşle anlar.

Hepsi aynı dille çizilir: 38px yükseklik, 1.5px çizgi, tek renk, dolgu yok.
Farklı kalınlıkta ya da çok renkli bir imza, tek tasarım kuralını bozardı.

**Boş durum da bu imzayı taşır.** Jenerik bir ikon yerine bölümün kendi
işareti durur: ekran boşken bile hangi bölümde olunduğu bellidir ve boşluk
tasarımın parçası olur, eksikliği değil.

## Kadran

Toparlanma skoru bir yüzde değil bir **durumdur**; yatay bir çubuk onu «ne
kadar dolduruldu» gibi okutuyordu. Kadran, bir ölçeğin üzerindeki ibre gibi
durur: sıfır ve yüz uçlarda, değer arada bir yerde.

Bant sınırları (düşük/orta/yüksek) yayın üzerinde **çentiklerle** işaretlidir
— skorun hangi banda düştüğü renkten önce **konumdan** okunur. Renk tek
başına anlam taşımaz.

## Ölçüm cetveli — imza bileşen

Sistemin en ayırt edici parçası. **Bir ilerleme çubuğu değildir:** dolu bir
kutu «ne kadar tamamlandı» der; burada sorulan o değil — «değer nerede
duruyor».

Bu yüzden:

- Zemin **boş**tur, eksen tek bir hairline'dır.
- Referans aralığı ince bir bant, hedef bandı onun üstünde bir alt çizgi.
- Aralığın iki ucunda **çentik** vardır: aralık renkle değil, çizgiyle de
  okunur.
- Değer tek bir **ibre**dir — üstünde küçük bir nokta taşıyan hassas bir
  çizgi. Dışarı taştığında incelmez; uzar ve renk değiştirir.

Uzun listelerde `{ bare:true }` ile yalnız eksen çizilir; sayı satırı satıra
tıklayınca açılan kâğıtta durur. On beş satırın altında «30 · referans ·
hedef 80–250 · 400 ng/mL» yazmak satırı okunmaz hâle getiriyordu.

## Gezinme

Sekiz çekmece (`LIFEOS.KABUK.CEKMECELER`: Bugün · Plan · Çalışma · Analiz ·
Onaylar · Ofis · Kütüphanem · Ayarlar); hangi ekranın hangi çekmecede
durduğu `SP.App.SECTIONS`'ta, yolu `SP.App.yolOf(rota)`'da, gerekçesi
`ekip/CEKMECE-HARITASI.md`'de. Liste burada tekrar yazılmaz: kopya bir gün
kaynağından ayrışır. Kabuk (üst çubuk, gün şeridi, sayfa başı, bölüm
çubuğu, telefonda alt bant) `brand/ortak/kabuk.js`'tedir.

### Ekranın içinde sekme yok

T3'ten beri ekranın parçaları alt alta bölümdür (`C.SayfaBolumleri`);
bölüm çubuğu (019) aralarında kaydırır, eski `*-tab` eylemi çubuğun
düğmesinde kalır. Bugün üç alandır: Şimdi · Durum · Öneri; geri kalan
satırlar Bugün › Ayrıntı'dadır.

### Görünüm

Tema **Açık · Koyu · Sistem**'dir; üst çubuktaki «Profil ve görünüm»
katmanından ve Ayarlar › Hane'den seçilir, profile yazılır. Palet ve düzen
seçimi kalktı (§8-4): tek tasarım.

### Kalıcı CSS kuralları

Beş düzen kalktı ama o dönemde öğrenilen üç kural geçerlidir:

1. **Bir jeton kendi türevine dayanamaz.** `--bg`yi `--surface-2`den,
   `--surface-2`yi de `--bg`den türetmek CSS özel değişken DÖNGÜSÜ kurar
   ve zincirdeki her değer geçersiz olur — ekran sessizce zeminsiz kalır,
   metin görünmez olur. Kraft'ta tam olarak bu oldu: koyu temada kâğıt
   paletinde kontrast 1.00'e düştü. Kural: bir düzenin türettiği her renk,
   o düzenin **yeniden tanımlamadığı** jetonlara dayanmalıdır.
2. **Bileşenler PENCEREYE değil KENDİ KUTULARINA göre daralır.**
   Duyarlı kurallar `@media` ile pencere genişliğine bağlandığında
   düzenler bozuluyor: «Katmanlı» raf için 228 px alıyor, «Harita»
   satırı bir karta sokuyor. Masaüstü genişliğinde bir pencerede satır
   570 piksellik bir kutuda duruyor ama hâlâ masaüstü kalıbını
   kullanıyor ve taşıyordu. Defter satırının içeriği bu yüzden bir
   kapsayıcıdır (`.lrow__main`, adı `satir`) ve tablo benzeri bileşenler
   dar kalıplarını `@container satir (max-width: …)` ile açar. Pencere
   sorgusu yanında **durur**, yerine geçmez: kapsayıcısı olmayan bir
   yerde kullanılan bileşen yine de daralabilsin diye.
3. **Metin merdiveni sıralı kalır.** `--text-2` her zaman `--text-3`ten
   güçlüdür; bir düzen jetonları yeniden türetirken bu sıra bozulabilir ve
   gözle fark edilmez. `palettecheck.js` bunu ölçer.

Üst çubukta ekrana ait eylem durmaz; bir eylem hangi sayfaya aitse o
sayfanın başında görünür.

`Mutfak` tek tencereyi hane hedeflerine göre paylaştırır.

`Ofis` beş ajanlıdır: Patron ekibi yönetir, Kerem laboratuvara, Nesrin
beslenmeye, Barış harekete, Sedef ekonomiye bakar. Ayrıntı için `src/OFIS.md`.

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

## Bileşen sözlüğü

Genel (uygulamadan bağımsız, `core/components.js`):

v4: `C.Kutu` `C.ModulIsareti` `C.SayfaBolumleri` (+ `C.bolumeGit`)
`C.Ayrinti` `C.Katmanli` `C.SakinHata` `C.TemaSecici`

`C.Card` `C.Collapsible` `C.Stat` `C.Bar` `C.Meter` `C.Badge` `C.Chip`
`C.Button` `C.IconButton` `C.Segmented` `C.Subtabs` `C.PickCard` `C.Toolbar`
`C.Mic` `C.Drop` `C.Field` `C.Input` `C.Textarea` `C.Select` `C.Checkbox` `C.Notice` `C.Empty`
`C.Skeleton` `C.NextUp` `C.Table` `C.Pager` (+ `C.paginate`)
düzen: `C.Grid` `C.Span` `C.Stack` `C.Cols` `C.Row` `C.SectionTitle`

Üçü yeni ve seçim dilini taşır:

- `C.Subtabs` — hap şeridi. `icon` ve `count` alır; taşarsa yatay kayar,
  720px altında tam genişliğe yayılır.
- `C.Toolbar` — alt sekme şeridi ile ekran eylemlerini aynı satırda tutar.
  Ekranların `actions()` gövdesi bu yüzden çoğu yerde boştur: eylem üst
  çubukta değil, ait olduğu sekmenin yanındadır.
- `C.Mic` — dikte anahtarı. Tarayıcı ses tanımayı desteklemiyorsa **hiç
  çizilmez**: çalışmayan bir düğme kullanıcıya seçenek değil, hayal
  kırıklığı verir. Dinlerken çevresinde yavaş bir halka genişler.
- `C.Drop` — dosya bırakma alanı. Hem tıklanır hem üzerine bırakılır.
  Sürükleme başlayınca sayfadaki **tek** bırakma alanı belirginleşir;
  kullanıcı küçük bir kutuya nişan almak zorunda kalmaz.
- `C.Entry` / `C.Ledger` — defter satırı ve kabı. Sistemin **ana düzen
  birimi**; ayrıntı yukarıda.
- `C.PickCard` — seçilebilir kart (`on` niteliğiyle dolu görünür). Seans
  şablonu ve egzersiz seçimi bu kartlarla yapılır; onay kutusu kullanılmaz.

Düğme **hap** biçiminde ve gölgesizdir; köşeli ve gölgeli düğme bir yönetim
panelinin dilidir. Rozet küçük ve sakindir. Uzun bir listede rozet düz metne
iner (`.resrow__status .badge`): aynı rozet on beş kez tekrarlandığında
çerçevesi gürültü üretir.

Site düzenine ait sınıflar (bileşen değil, kabuk): `wrapc` (ortalayıcı),
`sitenav` / `navlink` / `navtools`, `navsheet` (mobil bölüm menüsü),
`hero` / `herostat`, `pagenav` / `pagelink`, `sect` / `sect__h`.

SPİ'ye özel, veriye bağlı (`core/parts.js`):

`P.cert` `P.markerRow` `P.flagCard` `P.avatar` `P.sourceBadge` `P.nutCell`
`P.minRow` `P.clinicalNote` `P.absorbNote` `P.empty`

**Ayrım korunur:** `C.*` içine sağlık alanı sızmaz, `P.*` içine genel bileşen
girmez.

Ekrana özel yapılar CSS'te adlandırılır, bileşene çevrilmez:
`scale` (ölçüm cetveli — imza bileşen), `markerrow` (ölçüm satırı), `flagcard` (kırmızı
bayrak), `mealcard` / `mealitem` / `absorb` (öğün ve emilim), `foodrow` (besin
arama), `splitrow` (hane paylaştırma), `pricerow` (fiyat), `minrow` (asgari gün),
`readypart` (toparlanma bileşeni), `ladder` / `ladderstep` (ilerleme merdiveni),
`kpi` (tek büyük sayı), `picks` / `pickcard` (seçim ızgarası), `appear`
(görünüm paneli), `toolbar` (sekme + eylem satırı), `reslist` / `resrow`
(düz sonuç listesi), `entrygrid` / `entryrow` / `entrybar` (kapsamlı test
girişi), `chain` (bazal metabolizmadan hedefe giden zincir), `link`
(koçlar arası bağ), `sugg` / `suggfood` (gıda önerisi), `demand`
(bütçe talebi),
`quick` (hızlı giriş), `pasterow` (yapıştırılan tahlil), `nutgrid` / `nutcell`
(besin öğesi ölçeri), `agentav` / `desk` / `note` (ofis masaları),
`meetturn` (toplantı turu), `msg` (danışma sohbeti).

## Kart kuralı

Kart artık ana düzen birimi **değildir** — defter satırı odur. Kart yalnız
seçilebilir ya da yüzen şeylerde kalır.

**Kart bir kutu değil, bir yüzeydir.** Gölge kaldırıldı: on beş kartın yan
yana gölge düşürdüğü bir sayfa kâğıt yığını gibi durur ve ucuzlar. Derinlik
yalnız ince kenarlıkla anlatılır. Uzun listeler kart içine hiç alınmaz —
`reslist` gibi yapılar çerçevesizdir, satırları ince çizgiyle ayrılır.

Tek kart stili vardır. Vurgu için renkli sol kenarlık **kullanılmaz**; başlık
yanında rozet kullanılır. Kart içinde en fazla üç bilgi katmanı.

Tek istisna `flagcard`'dır: kırmızı bayrak kart değil **uyarıdır**, kendi
kenarlığı ve `role="alert"` niteliği vardır. Sistemde yorum yapmayı bıraktığı
tek durum budur ve görsel olarak da ayrılır.

## Ölçer kuralı

`C.Bar` **kendiliğinden renk seçmez.** Doluluğa bakıp «%40 ise kırmızı» demek
gün ortasında hedefin yarısında olan herkesi alarma sokar; bütün çubuklar
kırmızıya döner ve gerçek uyarı görünmez olur. Ton yalnız çağıran tarafından
verilir; otomatik ton isteniyorsa `auto:true` açıkça yazılır.

Bundan çıkan iki kural:

- Besin öğesi ölçeri (`nutCell`) nötr çizilir. Yalnız **sınır** tipindeki bir
  öğenin (sodyum) aşılması kırmızı işaretlenir; eksik kalmak hata değildir.
- Yüzde her zaman çubuğun altında **sayıyla** yazılır. Çubuk tek başına
  ölçü bildirmez.

## Zanaat detayları

Bir arayüzü «yapılmış» değil «tasarlanmış» gösteren şeyler. Hiçbiri yeni
bileşen eklemez; var olanların okunuşunu düzeltir.

- **Optik boyut.** Serif değişken bir yazıdır: `opsz` ekseni büyük puntoda
  ince ve zarif, küçük puntoda kalın ve okunur çizer. Hero başlığı 40,
  kart başlığı 20 optik boyutta.
- **Çizgili sıfır.** Bütün sayılarda `tnum` + `zero`. Bir ölçüm listesinde
  `0` ile `O`'nun karışması kabul edilemez.
- **Dengeli sarma.** Uzun cümlelerde `text-wrap:pretty` — son satırda tek
  kelime kalmaz.
- **Odak halkası** bölümün renginde, gövdeden 2px ayrık.
- **Seçim rengi** de bölümden gelir.
- **Kaydırma çubuğu** içeriğin parçası gibi durur, sistem eklentisi gibi
  değil.
- **Grafikler oranını korur.** Önceden esnetiliyordu: çizgi kalınlıkları
  yatayda ezilip dikeyde inceliyordu — grafik doğruydu ama ucuz duruyordu.
- **Görünüm geçişi.** Bölüm değişiminde tarayıcının `startViewTransition`
  katmanı kullanılır: eski sayfa söner, yeni sayfa hafifçe yükselerek gelir.
  Yalnız **yol değişiminde** çalışır — her küçük yeniden çizimde geçiş
  üretmek arayüzü sarhoş gösterir.
- **Basma durumu.** Düğmeye basınca yarım piksel çöker; dokunmanın
  karşılığı görünür olur.
- **Sayfa geçişi** altı piksel yükselerek gelir. Geçişin kendisi görünmez;
  görünen tek şey sayfanın «yerleşmiş» olmasıdır. `prefers-reduced-motion`
  bunu kapatır.

## Durumlar

Her ekran dört durumu tanımlar:

- **Boş** → `C.Empty({ text, action })` (katalog 010) — küçük çizim, tek
  cümle, en çok tek eylem. Boş grafik ya da «0» gösterilmez: «ölçüldü ve
  sıfır» diye okunur.
- **Yükleniyor** → `C.Skeleton({ rows })` — spinner değil iskelet.
- **Veri yetersiz** → `C.Notice({ tone:'info' })` — *neyin* eksik olduğunu ve
  kaç tane gerektiğini söyler. «Eğilim için en az 3 ölçüm gerekir; 2 var.»
- **Hata** → `C.SakinHata` (katalog 011): kırmızı yok, ilk cümle «Verin
  yerinde; hiçbir kayıt silinmedi.», tek düğme, teknik ileti «Teknik
  ayrıntı» altında. Ekran, kabuk ve açılış hatası aynı kalıbı kullanır;
  diğer ekranlar açılmaya devam eder.

Üçüncüsü bu uygulamada özellikle önemlidir: sağlık verisi seyrektir ve boş
ekran çok görülür. «Veri yok» demek yetmez — ne kadar veri gerektiği yazılır.

## Erişilebilirlik kuralları

- Etkileşimli her öğe `<button>`; ikon-only olanlara `aria-label`.
- Görünür odak halkası (`:focus-visible`) hiçbir yerde kaldırılmaz.
- Form etiketi `C.Field` ile input'u sarar.
- Kırmızı bayrak `role="alert"` taşır.
- `Escape` sırayla: komut paleti → ipucu balonu → alt sayfa → kenar çubuğu.
- Yeniden çizimde odak ve imleç konumu korunur (`focusSnapshot`).

## Yazım

Arayüz Türkçe. Buton fiil («Kaydet»), sonuç bildirimi geçmiş zaman
(«Kaydedildi»). Hata mesajı ne olduğunu ve ne yapılacağını söyler, özür dilemez.
Sayı ve tarih Türkçe biçimde (`14,2` · `19 Eylül 2026`).

Sağlık alanına özel üç yazım kuralı:

1. **Teşhis dili yasaktır.** «Sende şu var» denmez; «şu ölçüm şu bandın
   dışında» denir.
2. **Garanti verilmez.** «Düzelir» değil, «istenen yönde hareket ediyor».
3. **Korelasyon nedensellik gibi yazılmaz.** «Sebep oldu» değil, «birlikte
   hareket ediyor».
