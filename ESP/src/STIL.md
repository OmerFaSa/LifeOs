# ESP — Stil Rehberi

Tasarım sistemi kardeş projelerle **ortaktır**: aynı jetonlar, aynı kart, düğme
ve tablo dili, aynı defter düzeni. Bu kasıtlıdır — üç uygulama aynı kişinin gün
içinde dönüşümlü kullandığı üç araçtır ve aynı yerde durmalıdır.

Bu belge yalnızca **ESP'ye özel olanı** anlatır. Ortak dilin tamamı için
[`SPI/src/STIL.md`](../../SPI/src/STIL.md) okunur; oradaki her kural burada da
geçerlidir.

---

## Hangi dosya ortak, hangisi değil

Altı dosya AYS/SPİ ile aynıdır ve **elle düzenlenmez**:

```
css/tokens.css   palettes.css   base.css   layout.css   components.css   designs.css
```

Uygulamaya özgü ne varsa `css/esp.css` içinde yaşar — AYS'de `rota.css`,
SPİ'de `components.css`in alt yarısı ne yapıyorsa o.

> **Açık borç.** Spesifikasyon «tokens.css kopyalanmaz, referans alınır»
> diyor. Sıfır bağımlılıklı vanilla'da böyle bir mekanizma **yok**; bugün
> kopyalandı. Doğru çözüm: ortak dosyalar `LifeOs/ortak/` altında tek nüsha
> dursun, her `build.py` derleme anında oradan çeksin. Kopya değil,
> **derleme zamanı birleştirme**.

`esp.css` iki şeyi ortak dosyaların **üzerine yazar** (dosya sırası gereği en
son yüklenir):

1. **Bölüm kimlikleri.** `palettes.css` SPİ'nin bölüm adlarını taşır
   (`testler`, `besin`, `hareket`, `finans`). ESP'nin bölüm adları başka;
   eşleşmeyen her bölüm ana renkte kalırdı. Bu, devir notundaki *«kopyalanan
   palettes.css yanlış bölüm adlarını taşıyordu, kural yazılıydı ama hiç
   çalışmıyordu»* hatasının tekrarı olurdu.
2. **Ajan renkleri.** `tokens.css` beş SPİ ajanı tanımlar; ESP'nin altı uzmanı
   var. Patron ortak jetondan gelir, altısı burada.

---

## Sekiz bölüm, sekiz imza

Düzen, tipografi, boşluk ve bileşenler **her bölümde aynıdır**. Değişen tek şey
`--sec`: bölümün kendi rengi.

| # | Bölüm | Renk |
|---|---|---|
| 01 | Günlük | Adaçayı |
| 02 | Dil | Mürekkep mavisi |
| 03 | Felsefe | Erik |
| 04 | Ses | Kiremit |
| 05 | Okuma | Kehribar |
| 06 | Yazı | Zeytin |
| 07 | Ofis | Çivit grisi |
| 08 | Ayarlar | Taş |

Renkler aynı doygunluk ailesinden seçildi: yan yana konduklarında gökkuşağı
değil tek bir palet gibi okunurlar.

`--sec` yalnız **beş** yerde görünür: bölüm numarası, etkin sekme çizgisi,
bölüm başlığının üstündeki kısa çizgi, ana düğme ve bölüm imzası.

**Durum renkleri buna karışmaz.** `ok` / `warn` / `danger` her bölümde aynıdır.
Kesinlik etiketleri de hiçbir düzende gizlenmez.

Ölçüm: `tools/palettecheck.js` 7 palet × 2 tema × 8 bölüm × 5 düzeni gezer.
Son koşum **1848 ölçüm**, hepsi AA — en dar pay 4,52 (asgari 4,5).

---

## Ajan renkleri

Her uzmanın rengi kendi disiplininin bölüm rengiyle aynı aileden gelir: masa
hangi bölüme bakıyorsa oradan.

```
--agent-lang     Polyglot Mentor    (Dil bölümüyle aynı aile)
--agent-philo    Socrates           (Felsefe)
--agent-music    Maestro            (Ses)
--agent-diction  Demosthenes        (Ses — bir ton kayık, ayırt edilsin diye)
--agent-reading  Aristoteles        (Okuma)
--agent-writing  Montaigne          (Yazı)
--agent-patron   Patron             (tokens.css'ten)
```

**Kimlik taşır, durum değil.** Yalnızca avatarda ve masanın sol kenarındaki
şeritte kullanılır; ajanın durumu her zaman ayrıca rozetle verilir.

---

## ESP'ye özel yapılar

Bileşen sözlüğüne (`C.*`) girmezler çünkü alana bağımlıdırlar. Veriye bağlı
olanlar `core/parts.js` içinde (`P.*`), yalnız görsel olanlar `css/esp.css`
içinde adlandırılır.

| Yapı | Ne yapar |
|---|---|
| `daystrip` / `daycell` | On dört günün şeridi. Dolu gün ile boş gün ayrı görünür: boş hücrede sayı yerine tire durur — «veri yok» rengin değil **içeriğin** işidir |
| `cert` / `measure` | Kesinlik rozeti ve ölçüm. Çerçevesizdir: on beş kez tekrarlanan bir rozetin çerçevesi gürültü üretir |
| `srscard` | Çalışma kartı. Karşılık **açılmadan önce görünmez**: görünüyorsa hatırlama denenmemiş olur |
| `thesis` / `argcols` | Tez serifle yazılır (okunacak bir cümledir, veri değil); destek ve itiraz iki sütun, dar kutuda alt alta |
| `metro` | Metronom. Sayı sayfanın en büyük nesnesidir: metronom açıkken bakılan tek şey odur |
| `twister` | Çalışma metni — bölüm renginde bir kenar çizgisiyle |
| `noterow` / `linkform` | Atomik not ve bağ kurma |
| `sugg` | Bağ önerisi: iki not ve aralarındaki işaret |
| `desknote` / `handoff` / `crossrow` | Masa notu, devir satırı, çapraz bulgu |
| `radar` | Entelektüel sermaye radarı — aşağıda |
| `rulesay` | Kural motorunun cümlesi. Serif değil gövde yazısı: bu bir başlık değil bir **rapordur** |
| `jsonbox` | Ham brifing |

### Radar

Altı eksen, altı disiplin. Süs değil: altı sayıyı yan yana okumanın en hızlı
yolu, aralarındaki **dengeyi** göstermektir — ve sistemin bulgusu tam olarak
dengedir («bir disipline yığılmış, biri hiç açılmamış»).

İki kural:

1. **Ölçülmemiş eksen sıfıra çekilmez.** Sıfır «hiç çalışılmadı» gibi
   görünürdü; oysa «veri yok» ayrı bir durumdur. Ölçülmemiş eksen poligona
   **hiç girmez** ve yerine eksenin dibinde kesik bir nokta durur.
2. **Ölçek daima yazılır.** Radar bir oran gösterir; oranın neye göre olduğu
   görünmezse şekil yanıltır.

---

## Bileşen düzeltmesi

`C.Textarea` ve `C.Select` `aria` alanını **sessizce yutuyordu** — devir notu
§16'daki tuzağın aynısı. On altı alan erişilebilirlik denetiminden «etiketsiz»
olarak düşüyordu ve hata çağıran tarafta aranıyordu.

> Bir bileşen kabul etmediği bir alanı sessizce yutmamalı: yutarsa hata
> görünmez olur.

`Textarea` artık `class` ve `aria`, `Select` `aria` ve `class` kabul ediyor.
**Aynı hata SPİ'nin kopyasında duruyor** (bkz. `MIMARI.md` § 9).

## Tıklanabilir çip yerine düğme

`C.Chip` `act` aldığında bir `<span>` çizer: fareyle çalışır, **klavyeyle
ulaşılamaz**. ESP'de tıklanabilir hiçbir yerde çip kullanılmaz; onun yerine
`C.Button({ size:'sm' })` durur. Çip yalnızca **okunacak** etiketlerde kalır.

---

## Yazım

Arayüz Türkçe. Buton fiil («Kaydet»), sonuç bildirimi geçmiş zaman
(«Kaydedildi»). Hata mesajı ne olduğunu ve ne yapılacağını söyler, özür dilemez.

Entelektüel alana özel üç yazım kuralı:

1. **Seviye dili yasaktır.** «C1'sin» denmez; «son 30 günlük üretimin C1
   bandının kriterlerini karşılıyor» denir ve öz-değerlendirme olduğu yazılır.
2. **Yetenek yargısı kurulmaz.** «Yeteneklisin» değil; «şu kadar tekrarladın,
   eğim şu yönde».
3. **Korelasyon nedensellik gibi yazılmaz.** «Sebep oldu» değil, «birlikte
   hareket ediyor».

Ve her yerde geçerli olan: **ölçülmemiş bir şey sıfır diye yazılmaz.** Ekranda
«0 dakika» ile «veri yok» ayrı iki şeydir ve ayrı görünürler.
