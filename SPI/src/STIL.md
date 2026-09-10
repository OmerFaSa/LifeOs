# SPİ — Stil Rehberi

Tek token kaynağı: `css/tokens.css`. Bileşenler yalnız bu değişkenleri kullanır;
ham renk veya ölçü yazılmaz.

Tasarım sistemi kardeş proje AYS ile ortaktır: aynı jetonlar, aynı kart, düğme
ve tablo dili. Bu kasıtlıdır — iki uygulama aynı kişinin gün içinde dönüşümlü
kullandığı iki araçtır ve aynı yerde durmalıdır. Ayrılan yer yalnızca alana özel
yapılardır: referans aralığı çubuğu, öğün kartı, porsiyon paylaştırma.

## Renk

İki eksen vardır ve birbirinden bağımsızdır:

| Eksen | Nitelik | Değerler |
|---|---|---|
| Tema | `data-theme` | açık · koyu · sistem (varsayılan) |
| Palet | `data-palette` | indigo (varsayılan) · grafit · okyanus · mor · bordo · orman |

Dört anlam rengi, gerisi nötr.

| Rol | Token | Kullanım |
|---|---|---|
| Birincil | `--primary` | Ana eylem, hedefte olan ölçüm, tamamlanan durum |
| Vurgu | `--accent` | Uyarı, hedef bandın dışı, bekleyen ölçüm |
| Tehlike | `--danger` | Kırmızı bayrak, referans dışı, yıkıcı işlem |
| Bilgi | `--info` | Nötr açıklama, kesinlik etiketi |

Yüzeyler `--bg → --surface → --surface-2 → --surface-3` sırasıyla derinleşir.
Metin `--text → --text-2 → --text-3` sırasıyla soluklaşır.
`--surface-hover` yalnız fare üstündeyken, `--ring` yalnız odak halkasında.

Koyu palet **tek yerde** tanımlanır: `--d-*` değişkenleri. `data-theme="dark"`
ve `prefers-color-scheme:dark` bu tek kaynağı eşler. Bir rengin koyu karşılığı
iki yere yazılmaz.

**Renk tek başına anlam taşımaz.** Bu kural sağlık verisinde ihmal edilemez:
bir tahlil değeri asla yalnızca renkle «kötü» gösterilmez. Durum her zaman
rozet ve metinle birlikte verilir; referans çubuğunun yanında daima sayı,
birim ve gerekçe durur.

İki renk grubu **kimlik** taşır, durum değil:

- **Ajan renkleri** (`--agent-patron` … `--agent-money`) yalnız avatarda
  kullanılır. Ajanın durumu her zaman ayrıca rozetle verilir.
- **Makro renkleri** (`--macro-protein` · `--macro-fat` · `--macro-carb`)
  yalnız makro şeridinde. Şeridin altında her dilimin yazılı etiketi durur.

## Tipografi

İki aile: **Manrope** (başlık, sayı) · **Inter** (gövde, veri).
Ağırlıklar: 400 / 600 / 700 / 800.

| Adım | Token | Kullanım |
|---|---|---|
| xs | 11.5px | Etiket, kesinlik rozeti, yardımcı bilgi |
| sm | 12.75px | İkincil metin, tablo hücresi |
| base | 14px | Gövde, form |
| md | 15.5px | Kart başlığı (h3), ölçüm değeri |
| lg | 18.5px | Bölüm başlığı (h2) |
| xl | 24px | Ekran başlığı (h1) |
| hero | 30px | Yalnız KPI sayısı |

Ölçek bilinçli olarak dardır. Altı adım arasındaki fark küçüktür; hiyerarşi
punto sıçratarak değil **ağırlık, renk ve boşlukla** kurulur. Bir ekranda en
fazla bir `hero` sayı bulunur.

Sayısal veride `.num` (tabular-nums) zorunlu. Ölçüm değerleri, gramajlar ve
fiyatlar hizalanmadan okunamaz.

## Ölçü

**Boşluk 8px ritmi:** 4 · 8 · 12 · 16 · 24 · 32 · 40.

Tekrar eden boşluk/hizalama için `style=""` yerine yardımcı sınıf kullanılır:
`mt-2/4/8/10/12`, `row`, `row-sm`, `wrap`, `grow`, `minw0`, `cols-2/3/4`.
`style=""` yalnız **değere bağlı** yerlerde kalır: çubuk genişliği, referans
çubuğundaki işaret konumu, iskelet satırı.

**Yarıçap üç seviye:** `--r-sm` 9px (kontrol) · `--r` 16px (kart, panel) ·
`--r-pill` (sekme hapı, rozet, avatar).
**Gölge iki seviye:** `--shadow` (kart) · `--shadow-lg` (katman). Kart gölgesi
kasıtlı olarak çok soluktur: derinlik gölgeyle değil kenarlıkla anlatılır,
gölge yalnız yüzeyi zeminden ayırır.
**Perde:** `--scrim` — sheet, palet ve mobil kenar çubuğunun arkasındaki karartma.

## Hareket

Tek easing `--ease`, iki süre: `--dur` 160ms (durum değişimi) ·
`--dur-lg` 220ms (panel açılış). `prefers-reduced-motion` süreleri sıfıra çeker.

Dikkat çekmek için animasyon yoktur: yanıp sönme, zıplama, sürekli döngü
(iskelet ve açılış çubuğu dışında) kullanılmaz. Bir kırmızı bayrak yanıp
sönerek değil, sayfanın en üstünde durarak dikkat çeker.

## Gezinme

Dört gezinme grubu, on üç ekran. Grup **iş türüne** göre ayrılır, alana göre
değil: kullanıcı «tahlil mi hareket mi» diye değil «girecek miyim, bakacak
mıyım» diye düşünür.

| Grup | Ekranlar |
|---|---|
| Günlük | Bugün · Günlük ölçüm |
| İzleme | Tahliller · Öğünler · **Mutfak** · Hareket · Sepet |
| Değerlendirme | Analiz · **Ofis** · Danışma · Toplantı |
| Sistem | Hane · Rehber |

Her ekranın bir de `short` etiketi vardır (Günlük ölçüm → Ölçüm). Uzun ad
kenar çubuğunda, kısa ad mobil sekme çubuğunda görünür; etiket **hiçbir yerde
sarmaz**. Mobil sekme çubuğu beş ekrandır: Bugün · Ölçüm · Öğün · Hareket · Ofis.

### Alt sekmeler

Alt sekme bir filtre değil **yer**dir: seçilen sekme hap biçiminde dolu görünür,
seçilmeyen boş. Alt çizgi kullanılmaz — dokunmatikte hedef alanı belirsizdir.
Sekmenin yanında sayı varsa (`subtab__count`) o sekmedeki kayıt sayısıdır.

| Ekran | Alt sekmeler |
|---|---|
| Tahliller | paneller · eğilim · geçmiş |
| Hareket | bugün · program · ilerleme |
| Sepet | sepet · ikame · fiyat |
| Analiz | çapraz bağlar · haftalık rapor · seriler |
| Rehber | kullanım · model · veri · sınırlar |

`Hareket` **iki** hap şeridi taşır: üstte bölüm (bugün/program/ilerleme), altta
hareket kalıbı (Tümü · itiş · çekiş · diz · kalça · taşıma · gövde ·
Dayanıklılık · Mobilite). İkinci şerit egzersiz listesini süzer; hangi kalıpta
kaç hareket olduğu sekmenin üstünde yazar. Bu ayrım kasıtlıdır: antrenman
ekranı tek uzun liste değil, net seçilebilir bölümlerdir.

### Görünüm paneli

Tema ve palet üst çubuktaki palet düğmesinden açılır (`.appear`), ekranın
içine gömülmez. Panel iki satırdır: üç tema düğmesi (Sistem · Açık · Koyu),
altında altı palet. Seçim profile yazılır ve anında uygulanır; `Escape`,
dışarı tıklama ve pencere boyutu değişimi paneli kapatır.

Üst çubuk tek satırdır ve şu sırayla okunur:
ekran eylemi → ayraç → arama → palet → ayarlar. 620px altında ekran eylemi
düğmesinin **etiketi** gizlenir, ikonu kalır; satır asla ikiye bölünmez.

`Mutfak` tek tencereyi hane hedeflerine göre paylaştırır; Öğünler ekranından
açılır ama kendi gezinme yerine de sahiptir.

`Ofis` beş ajanlıdır: Patron ekibi yönetir, Kerem laboratuvara, Nesrin
beslenmeye, Barış harekete, Sedef ekonomiye bakar. Ayrıntı için `src/OFIS.md`.

## Bileşen sözlüğü

Genel (uygulamadan bağımsız, `core/components.js`):

`C.Card` `C.Collapsible` `C.Stat` `C.Bar` `C.Meter` `C.Badge` `C.Chip`
`C.Button` `C.IconButton` `C.Segmented` `C.Subtabs` `C.PickCard` `C.Toolbar`
`C.Field` `C.Input` `C.Textarea` `C.Select` `C.Checkbox` `C.Notice` `C.Empty`
`C.Skeleton` `C.NextUp` `C.Table` `C.Pager` (+ `C.paginate`)
düzen: `C.Grid` `C.Span` `C.Stack` `C.Cols` `C.Row` `C.SectionTitle`

Üçü yeni ve seçim dilini taşır:

- `C.Subtabs` — hap şeridi. `icon` ve `count` alır; taşarsa yatay kayar,
  720px altında tam genişliğe yayılır.
- `C.Toolbar` — alt sekme şeridi ile ekran eylemlerini aynı satırda tutar.
  Ekranların `actions()` gövdesi bu yüzden çoğu yerde boştur: eylem üst
  çubukta değil, ait olduğu sekmenin yanındadır.
- `C.PickCard` — seçilebilir kart (`on` niteliğiyle dolu görünür). Seans
  şablonu ve egzersiz seçimi bu kartlarla yapılır; onay kutusu kullanılmaz.

SPİ'ye özel, veriye bağlı (`core/parts.js`):

`P.cert` `P.markerRow` `P.flagCard` `P.avatar` `P.sourceBadge` `P.nutCell`
`P.minRow` `P.clinicalNote` `P.absorbNote` `P.empty`

**Ayrım korunur:** `C.*` içine sağlık alanı sızmaz, `P.*` içine genel bileşen
girmez.

Ekrana özel yapılar CSS'te adlandırılır, bileşene çevrilmez:
`rangebar` (referans aralığı), `markerrow` (ölçüm satırı), `flagcard` (kırmızı
bayrak), `mealcard` / `mealitem` / `absorb` (öğün ve emilim), `foodrow` (besin
arama), `splitrow` (hane paylaştırma), `pricerow` (fiyat), `minrow` (asgari gün),
`readypart` (toparlanma bileşeni), `ladder` / `ladderstep` (ilerleme merdiveni),
`kpi` (tek büyük sayı), `picks` / `pickcard` (seçim ızgarası), `appear`
(görünüm paneli), `toolbar` (sekme + eylem satırı),
`quick` (hızlı giriş), `pasterow` (yapıştırılan tahlil), `nutgrid` / `nutcell`
(besin öğesi ölçeri), `agentav` / `desk` / `note` (ofis masaları),
`meetturn` (toplantı turu), `msg` (danışma sohbeti).

## Kart kuralı

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

## Durumlar

Her ekran dört durumu tanımlar:

- **Boş** → `C.Empty({ text, action })` — tek net eylem sunar.
- **Yükleniyor** → `C.Skeleton({ rows })` — spinner değil iskelet.
- **Veri yetersiz** → `C.Notice({ tone:'info' })` — *neyin* eksik olduğunu ve
  kaç tane gerektiğini söyler. «Eğilim için en az 3 ölçüm gerekir; 2 var.»
- **Hata** → `C.Notice({ tone:'danger' })` veya kabuk düzeyinde hata paneli;
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
