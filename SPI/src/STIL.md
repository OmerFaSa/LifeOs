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
| Palet | `data-palette` | **kâğıt** (varsayılan) · indigo · grafit · okyanus · mor · bordo · orman |

**Varsayılan palet «kâğıt»tır:** sıcak kırık beyaz bir zemin üzerinde derin
yeşil. İki tercih de kasıtlı:

- Zemin saf gri değildir. Saf gri bir zemin ekranda klinik ve ucuz durur;
  bir derece sıcaklık aynı düzeni pahalı gösterir.
- Ana renk mavi-mor değildir. Mavi-mor her yönetim panelinin varsayılanıdır
  ve kimlik taşımaz. Derin yeşil sağlıkla ilişkilidir, doygundur ama
  bağırmaz.

Eski indigo palet kaybolmadı; seçilebilir bir palet olarak duruyor.

Dört anlam rengi, gerisi nötr.

| Rol | Token | Kullanım |
|---|---|---|
| Birincil | `--primary` | Ana eylem, hedefte olan ölçüm, tamamlanan durum |
| Vurgu | `--accent` | Uyarı, hedef bandın dışı, bekleyen ölçüm |
| Tehlike | `--danger` | Kırmızı bayrak, referans dışı, yıkıcı işlem |
| Bilgi | `--info` | Nötr açıklama, kesinlik etiketi |

**Mürekkep** (`--ink`) saf siyah değil, koyu çamdır: klinik bir kesinlik
verir ama soğumaz. Marka işaretinde, alt bantta ve ölçüm cetvelinin
ibresinde kullanılır. Her sayfada en az bir koyu öge bulunması kasıtlıdır —
baştan sona açık bir sayfanın ağırlık merkezi olmaz.

Yüzeyler `--bg → --surface → --surface-2 → --surface-3` sırasıyla derinleşir.
Metin `--text → --text-2 → --text-3` sırasıyla soluklaşır.
`--surface-hover` yalnız fare üstündeyken, `--ring` yalnız odak halkasında.

Koyu palet **tek yerde** tanımlanır: `--d-*` değişkenleri. `data-theme="dark"`
ve `prefers-color-scheme:dark` bu tek kaynağı eşler. Bir rengin koyu karşılığı
iki yere yazılmaz.

**Renk tek başına anlam taşımaz.** Bu kural sağlık verisinde ihmal edilemez:
bir tahlil değeri asla yalnızca renkle «kötü» gösterilmez. Durum her zaman
metinle birlikte verilir; referans çubuğunun yanında daima sayı, birim ve
gerekçe durur.

İki renk grubu **kimlik** taşır, durum değil:

- **Ajan renkleri** (`--agent-patron` … `--agent-money`) yalnız avatarda
  kullanılır. Ajanın durumu her zaman ayrıca rozetle verilir.
- **Makro renkleri** (`--macro-protein` · `--macro-fat` · `--macro-carb`)
  yalnız makro şeridinde. Şeridin altında her dilimin yazılı etiketi durur.

## Tipografi

**Üç aile, her birinin tek işi var.** Karıştırıldıklarında üçü de amatörleşir.

| Aile | Nerede | Kural |
|---|---|---|
| `--font-serif` (Newsreader) | Hero başlığı, bölüm başlığı, kart başlığı | Hiçbir yerde **sayı** taşımaz |
| `--font-display` (Manrope) | Sayı, KPI, ölçüm değeri | Hiçbir yerde **paragraf** taşımaz |
| `--font-body` (Inter) | Geri kalan her şey | — |

Serif başlıklar kasıtlıdır: bir yönetim panelinin dili kalın sans başlıktır;
editoryal bir serif aynı içeriği bir yayın gibi okutur.

| Adım | Token | Kullanım |
|---|---|---|
| xs | 11.5px | Etiket, kesinlik rozeti, yardımcı bilgi |
| sm | 12.75px | İkincil metin, tablo hücresi |
| base | 14px | Gövde, form |
| md | 15.5px | Ölçüm değeri |
| lg | 19px | — |
| xl | 24px | — |
| hero | 30px | Yalnız KPI sayısı |
| display | 40px | Yalnız hero başlığı (serif) |

Ölçek bilinçli olarak dardır. Hiyerarşi punto sıçratarak değil **aile,
ağırlık, renk ve boşlukla** kurulur. Bir ekranda en fazla bir `display`
başlık ve bir `hero` sayı bulunur.

Sayısal veride `.num` (tabular-nums) zorunlu. Ölçüm değerleri, gramajlar ve
fiyatlar hizalanmadan okunamaz.

**Gezinmede ikon yoktur.** Yedi ikon + yedi etiket + dört araç ikonu aynı
satırda yarışınca hiçbiri okunmaz. Üst gezinme ve sayfa sekmeleri yalnız
metindir; ikon, anlamı metnin taşımadığı yerlerde kalır (araç düğmeleri,
boş durum, uyarı).

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

### Bölüm imzaları (motif)

Her bölümün hero'sunda duran ince, tek renkli işaret. Süs değil: bölümün
**ne ölçtüğünü** soyutlar ve kullanıcı sayfayı okumadan hangi bölümde
olduğunu çevresel görüşle anlar.

Hepsi aynı dille çizilir: 38px yükseklik, 1.5px çizgi, tek renk, dolgu yok.
Farklı kalınlıkta ya da çok renkli bir imza, tek tasarım kuralını bozardı.

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

Yedi bölüm, on iki sayfa. Bölüm alana göre değil **işe** göre ayrılır.

| # | Bölüm | Sayfalar |
|---|---|---|
| 01 | **Günlük** | Günlük |
| 02 | Testler | Testler |
| 03 | Besin | Öğünler · Mutfak |
| 04 | Hareket | Hareket |
| 05 | Finans | Finans |
| 06 | Ofis | Masalar · Danışma · Toplantı · Analiz |
| 07 | Ayarlar | Hane · Rehber |

**Günlük ilk sıradadır ve tek sayfadır.** Önce «Bugün» (özet) ve «Günlük
ölçüm» (giriş) diye iki ayrı ekran vardı; ikisi de aynı günü anlatıyor,
kullanıcı hangisine gireceğini düşünmek zorunda kalıyordu. Şimdi tek sayfa,
üç sekme — ve **Giriş varsayılan sekmedir**: bu sayfaya girmenin sebebi çoğu
zaman okumak değil yazmaktır.

Gezinmedeki **numara süs değildir**: yedi bölümün sırası anlamlıdır (önce
yazılan, sonra okunan) ve numara o sırayı görünür kılar.

860px altında bölümler tam ekran bir **içindekiler** sayfasına iner:
numaralı, serif, tek sütun. Alt sekme çubuğu yoktur — o bir panel dilidir.

### Ekran içi sekmeler

Ekranın kendi bölümleri hap biçimli `Subtabs`'tır: seçilen dolu, seçilmeyen
boş. Alt çizgi kullanılmaz — dokunmatikte hedef alanı belirsizdir.

| Ekran | Sekmeler |
|---|---|
| Günlük | **Giriş** · Özet · Geçmiş |
| Testler | Sonuçlar · Test gir · Geçmiş · Eğilim |
| Öğünler | Öğünler · Öneri · Besin değeri |
| Hareket | Bugün · Kardiyo · Kuvvet · Esneklik · Dinlenme · İlerleme |
| Finans | Bütçe · Sepet · İkame · Fiyat |
| Analiz | Çapraz bağlar · Haftalık rapor · Seriler |
| Rehber | Kullanım · Model · Veri · Sınırlar |

`Hareket` **iki** şerit taşır: üstte alan, kuvvetin içinde hareket kalıbı
(itme · çekme · çömelme · kalça · gövde · taşıma). İkinci şerit yalnız
kuvvette çizilir; kardiyoda ve esneklikte kalıp yoktur, orada şerit çizmek
boş bir seçim sunmak olurdu.

### Görünüm paneli

Tema ve palet üst çubuktaki palet düğmesinden açılır (`.appear`), ekranın
içine gömülmez. Panel iki satırdır: üç tema düğmesi (Sistem · Açık · Koyu),
altında altı palet. Seçim profile yazılır ve anında uygulanır; `Escape`,
dışarı tıklama ve pencere boyutu değişimi paneli kapatır.

Üst çubuk tek satırdır ve şu sırayla okunur: marka → yedi bölüm → arama →
palet → ayarlar → menü. Ekrana ait eylemler üst çubukta değil **hero'da**
durur; bir eylem hangi sayfaya aitse orada görünür.

`Mutfak` tek tencereyi hane hedeflerine göre paylaştırır; Besin bölümünün
ikinci sayfasıdır.

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
