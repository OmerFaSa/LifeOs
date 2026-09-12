# Bozukluk denetimi — AYS'nin SPİ'ye benzememesinin sebepleri

Şikâyet tek cümleydi: *"neredeyse SPİ'ye hiç benzemiyor."* Doğruydu.
Kabuk (künye, numaralı şerit, hero, alt bant) SPİ'den birebir
alınmıştı ve gerçekten aynıydı; **gövde** benzemiyordu. Bu belge neyin
kırık olduğunu, neden kırıldığını ve nasıl kapandığını yazar.

Sıralama etkiye göre: bir numara tek başına ekranın yarısını açıklıyor.

---

## 1 · Palet hiçbir şeyi değiştirmiyordu

**Bulgu.** Yedi paletin hiçbiri hiçbir rengi değiştirmiyordu.

**Sebep.** SPİ'de paleti okuyan dosya `tokens.css`'tir; `palettes.css`
yalnız `--d-*` ham değerlerini verir ve `tokens.css` onları türetir.
AYS'ye `palettes.css` kopyalanmış, `tokens.css` ise AYS'nin elle
yazılmış indigo sabitleriyle bırakılmıştı. Kopyalanan dosyayı kimse
okumuyordu.

**Görünen sonuç.** Ana renk her zaman indigo (`#3D3F8F`), bilgi
kutuları her zaman soğuk mavi (`#E6ECF1`), yumuşak zeminler seçilen
paletin değil sabit bir ailenin tonunda.

**Kapanış.** `tokens.css` SPİ'ninkiyle aynı — tek fark AYS'nin altı
koçunun rengi ve beş grafik serisi. Yumuşak zeminler (`--info-soft`,
`--accent-soft`…) artık `color-mix` ile türetiliyor.

**Yanında çıkan hata.** `[data-theme="dark"]` bloğunda `--agent-koc`
eşlemesi eksikti: koyu temada koçun rengi açık tema değerinde
kalıyordu. Sistem tercihi bloğunda vardı, açık seçim bloğunda yoktu —
iki listeyi elle eşit tutmanın tipik bedeli.

## 2 · Gövde hâlâ kart dilindeydi

**Bulgu.** On iki sütunluk ızgara, üç sütun yan yana beyaz dikdörtgen
diziyordu. SPİ'de sayfa bir defterdir: tek sütun, solda künye, sağda
içerik, arada kıl çizgi.

**Sebep.** `defter.css` yalnız `.card`'ı çeviriyordu ve o çeviri de
kapsayıcı sorgusuna bağlıydı (640 piksel eşiği). Dar bir sütunda duran
kart kutu kalıyordu; ölçüm kutuları (`.stat`), gün blokları (`.block`)
ve uyarılar zaten hiç çevrilmiyordu.

**Kapanış.** Çeviri CSS'ten JS'e taşındı: `C.Card` artık defter satırı,
`C.Grid` defter kabı, `C.Span` tam genişlikte şerit çiziyor. **181 kart
çağrısının, 19 ekranın hiçbirine dokunulmadı.**

Üç kural yazıldı ve testle kilitlendi:

- **Başlıksız kart künye sütunu AÇMAZ.** Açsaydı 196 piksellik boş bir
  sol sütun kalır, içerik sağa sıkışırdı — ekranda görülen tam olarak
  buydu.
- **Kutu yalnız seçilebilir ya da yüzen şeylerde kalır** ve artık adı
  `C.Box`. Ofisteki masalar, patronun masası, gün sütunları kutu.
- **Ölçüm kutusu da kutu olmaktan çıktı:** dört beyaz dikdörtgen yerine
  dört sütun, aralarında kıl çizgi.

## 3 · Altı bölümün altısı da aynı renkti

**Bulgu.** `palettes.css` "tek tasarım, yedi imza" kuralını taşıyordu
ama bölüm renkleri hiç görünmüyordu.

**Sebep.** İki ayrı ölüm:

1. İmzalar SPİ'nin bölüm adlarına yazılıydı (`besin`, `hareket`,
   `finans`, `testler`, `ayarlar`). AYS'nin altı bölümünün dördünün
   karşılığı yoktu ve `var(--primary)`'ye düşüyorlardı.
2. `data-section` köke **hiç yazılmıyordu**. Yani karşılığı olan iki
   bölüm de imzasını almıyordu.

**Kapanış.** İmzalar AYS'nin bölümlerine göre yeniden yazıldı;
`applySection()` yönlendirmede köke yazıyor. Odak halkası da artık
bölümün renginde — SPİ'deki gibi.

## 4 · Alt sekmeler çizgiydi, hap değil

**Bulgu.** SPİ'nin sekme şeridi bir hap grubudur; AYS'ninki tam
genişlikte alt çizgiydi.

**Yan etkisi.** Şeridin alt çizgisiyle defterin ilk kıl çizgisi 15
piksel arayla üst üste geliyordu: iki paralel çizgi.

**Kapanış.** SPİ'nin şeridi alındı — kayan uçlarını kendi söyleyen dört
katmanlı zemin dahil (iki örtü `local`, iki gölge `scroll`; şerit bir
uca dayandığında örtü gölgeyi yutar, JavaScript gerekmez).

## 5 · Şeridin rengi kendiliğinden geliyordu

**Bulgu.** Günün akışında 1/3'te olmak KIRMIZI gösteriliyordu.

**Sebep.** `Bar` tonu yüzdeden türetiyordu: `%60`ın altındaki her şerit
`danger`. Dahası `tone:''` geçen on çağrı yok sayılıyordu, çünkü boş
dize yanlış değerdir ve `||` onu yutar — çağıran "renk olmasın"
diyemiyordu.

**Kapanış.** Eşik renklendirmesi artık `auto:true` ile İSTENİR ve
yalnız gerçek bir hedefe karşı ölçülen yerde kullanılır (plan
tamamlama, %85 hedefi). Dört test bu davranışı kilitliyor.

Bu bir tasarım hatası değil, **doğruluk** hatasıydı: sabahın dokuzunda
kırmızı bir şerit kullanıcıya yanlış bir şey söylüyordu.

## 6 · Sekme şeridi nerede olduğunu yanlış söylüyordu

**Bulgu.** Analiz ekranında altı sekmenin hiçbiri seçili görünmüyor,
gövdede ise karşılaştırma çiziliyordu.

**Sebep.** `S.ui.analyticsTab` varsayılanı `'overview'` idi; o adda bir
sekme kalmamıştı. `BODIES['overview']` tanımsız olduğu için gövde
sessizce ilk sekmeye düşüyor, şerit ise hiçbir şey seçmiyordu.

**Kapanış.** Varsayılan düzeltildi ve iki sekmeli ekran da savunmacı
yapıldı: kayıtlı ad artık yoksa ilk sekmeye düşer. Test adı tek tek
bilmez — her sekmeli ekranda **tam bir** sekmenin seçili olmasını
ister, böylece aynı hata başka ekranda da yakalanır.

## 7 · Klavye fareye yetişmiyordu

**Bulgu.** Satırın tamamı tıklanabilir olduğu altı yerde (haftanın
günü, program haftası, risk satırı, konu satırı, iki öneri rozeti) o
eylem klavyeyle çalışan biri için **yoktu**.

**Sebep.** Tıklama `[data-act]` taşıyan her ögeden devralınıyordu;
klavye devralmıyordu ve ögeler odaklanabilir değildi.

**Kapanış.** Delegasyon tek yere yazıldı (`role="button"` taşıyan
ögelerde Enter/Boşluk), ögeler odaklanabilir yapıldı. `Chip` bileşeni
düzeltildi — aynı hata SPİ'de de vardı, orada da kapandı.

## 8 · Alt sayfa kipli değildi

**Bulgu.** Alt sayfa açıkken Tab arkadaki sayfaya çıkıyor, tekerlek
arkayı kaydırıyor, ekran okuyucu arkadaki tabloyu okuyor, kapanınca
odak kayboluyordu. Dördü de yoktu.

**Kapanış.** SPİ'nin sürümü alındı: odak hapsi, kaydırma kilidi,
`inert` + `aria-hidden`, odağın açan ögeye dönmesi. Çizimden sonra
`inert` geri konuyor (kabuk her karede yeniden kuruluyor).

## 9 · Sessizce düşen özellik — iki uygulamada da

`Textarea` bileşeni `class` ve `aria` alanlarını hiç yazmıyordu. İki
çağrı yeri `class:'composer__input'` geçiyordu ve sohbet kutusu bu
yüzden satırı doldurmuyordu. Yer tutucu da etiket yerine geçmez: ekran
okuyucu yalnızca "metin alanı" der.

## 10 · Başlık sırası atlıyordu

Hero `h1`, sonraki başlık `h3`. İki yerde `h2`'ye çekildi.

---

## Ölçüm

| Koşum | Önce | Sonra |
|---|---|---|
| `tools/runtests.js` | 860/860 | 872/872 |
| `tools/a11ycheck.js` | *yoktu* | temiz (2 bilinen eksik) |
| `tools/palettecheck.js` | *yoktu* | 7 palet × 2 tema × 6 bölüm × 5 düzen — hepsi AA |

Palet denetimi geçse bile **en dar payı** yazar: `ucuncul/zemin 4.52
(asgari 4.5) — light/indigo/today`. Hiçbir şey ölçmeyen bir betik de
"geçti" yazar; sayı görünmedikçe geçtiğine güvenilmez.

---

## Denetleyicilerin kendi hataları

Bu turda **üç** denetleyici hatası çıktı. Not düşülüyor çünkü bir
denetleyicinin yanlış susması, denetlenen hatadan daha pahalıdır.

1. **Kaydırıcı içindeki geniş öge taşma sayılıyordu.** Tablo ve grafik
   bilerek kendi kutusunda yatayda kayar. Dört olmayan hata bildirildi.
   Düzeltme: üst soylarında `overflow-x` varsa taşma değildir.

2. **`aria-hidden` ağacındaki öge "etiketsiz alan" diye
   bildiriliyordu.** Görünür bir bırakma alanının arkasındaki gizli
   dosya girdisi ekran okuyucuya hiç görünmez. SPİ'nin denetleyicisi de
   aynı kördü; ikisi de düzeltildi.

3. **Alt sayfanın perdesi ölçümün üstünde kalıyordu.** AYS'de perde
   `.overlay`, iç kutu `.sheet`. Betikler yalnız `.sheet`'i siliyordu;
   perde (`z:60`, `rgba(0,0,0,.64)`) sayfanın üstünde kalıyor ve
   **ölçülen her şey %64 karartılmış** oluyordu. Koyu tema ekran
   görüntüleri bu yüzden okunmaz görünüyordu — uygulamada değil, ölçen
   elde bir hata. Jetonlar `getComputedStyle` ile okunduğu için palet
   denetiminin sonucu değişmedi; değişen, göze güvenilen kısımdı.

---

## SPİ'den bilerek ayrılan tek yer

SPİ'de `Card` kutu çizer, `Entry` defter satırı çizer ve `Ledger(fn)`
bir bayrak açarak aradaki dönüşümü yapar. AYS'de 181 çağrının hepsi
`Card` olduğu için dönüşüm koşulsuz yapıldı: `Card` her zaman satır
çizer, kutu isteyen `Box` çağırır.

Sonuç aynı görünür; sözleşme farklıdır. Buraya yazılmasının sebebi
budur — ileride biri "neden ikisi aynı değil?" diye sorduğunda cevabı
aramak zorunda kalmasın.

---

## Motor

Kural motoru, çözücü ve planlayıcı tek satır almadı. Bu turda
değişenlerin hepsi sunum katmanındadır; tek istisna `Bar`'ın ton
mantığı ve eskimiş sekme varsayılanıdır, ikisi de arayüz kararıdır.

---

# İkinci tur: arayüz komple silindi, sıfırdan kuruldu

Yukarıdaki on bulgu tek tek kapatıldı ama istek daha sertti: *"tasarımı
komple sil, sıfırdan SPİ'nin aynısını yap."* Yapılan tam olarak budur.

## Ne silindi

AYS'nin `tokens.css`, `palettes.css`, `base.css`, `layout.css`,
`components.css`, `designs.css` dosyaları silindi ve SPİ'ninkiler
konuldu. `defter.css` — SPİ'de karşılığı olmayan bir uydurmaydı —
tamamen kalktı. `components.js`, `ui.js` ve `designs.js` de SPİ
sürümüne geçti.

Körlemesine silinmedi: önce ölçüldü. AYS'nin `components.css`'indeki
818 kuralın **437'si zaten SPİ'de vardı** (ortak soy), **381'i AYS'ye
özgüydü**. O 381 kural `rota.css`'e taşındı.

## `rota.css` nedir

AYS'nin SPİ'de karşılığı olmayan nesneleri: üç boyutlu ofis, kat planı,
haftanın ızgarası, sınama kartı, soru çözüm defteri, program zaman
çizgisi. Kuralı ortak dosyalarınkiyle aynıdır ve kutunun kaldığı her
yer dosyanın başlığında gerekçesiyle yazılıdır.

Taşınırken altı kural defter diline çevrildi, çünkü okunacak şeydiler:
gün bloğu, sınama kartı, öneri satırı, önce→sonra tablosu, cevap sütunu.

## Ne kazanıldı

| | Önce | Sonra |
|---|---|---|
| `designs.css` | 141 satırlık taslak | SPİ'nin 565 satırı, beş gerçek tasarım dili |
| Görünüm paneli | **yok** — tema/palet rehber ekranından | künyede tek dokunuş: 3 tema × 7 palet × 5 düzen |
| Bölüm imzası | **yok** | hero'da altı bölümün altı çizimi |
| Derleme damgası | **yok** | künyede sürüm + önbellek atlayan tazele düğmesi |
| Bileşen seti | 30 | 37 (Entry, Ledger, PickCard, Toolbar, Mic, Drop, Busy) |
| Sekme rozetleri | yok | var |

## Yolda çıkan gerçek hatalar

**`--fs-2xl` ve `--fs-3xl` hiç tanımlanmamış jetonlardı.** İki
uygulamanın tarihinde de yoklar. Üç öge bu yüzden hep devralınan
puntoyla çiziliyordu: süreli deneme sayacı, tahmini sıra ve büyük net
skoru. Sonuncusu SPİ'de de kırıktı.

**Künye sütunu içine koyacak bir şey olmasa da açılıyordu.** Başlıksız
satır 196 piksellik boş bir sol sütun bırakıyordu. İki uygulamada da
koşullu yapıldı.

**`Entry` `id` almıyordu.** AYS'nin panel hedefleri (`#pane-flow` gibi)
bu yüzden kayboluyordu.

**`Select` `aria` almıyordu** — `Input` alıyordu. Etiketsiz bir seçici
ekran okuyucuda yalnızca "açılır liste" diye anılır.

**Kopyalanan `components.css` SPİ'nin beş ajanına yazılıydı**
(lab/nutri/move/money). AYS'nin altı koçuna eşlendi; eksik olan altıncı
(koç) üç yere de eklendi.

## Erişilebilirlik borcu dörtten bire indi

`::after` ile dokunma alanı büyütülen iki düğme (ⓘ ipucu 16×16, künye
tazele 50×17) gerçekten düzeltildi; öğün yuvası seçicisine etiket
eklendi. Kalan tek borç tarayıcının kendi onay kutusu — boyutunu
işletim sistemi verir.

## Denetleyicinin iki hatası daha

**Dokunma hedefi ölçümü iki kez yanlıştı.** İlk sürüm görsel kutuyu
ölçüyordu; oysa doğru çözüm görünmez bir `::after` ile alanı
büyütmektir ve o ölçüm doğru düzeltilmiş bir düğmeyi hâlâ "küçük" diye
bildiriyor, borç defterinde sahte bir satır tutmaya zorluyordu. İkinci
sürüm `elementFromPoint` ile tarayıcıya soruyordu; o da yanlıştı —
künye sayfanın dibinde, görünen alanın dışında kalıyor ve
`elementFromPoint` null dönüyordu, yani **görünmeyen her düğme "küçük"
sayılıyordu**. Doğru ölçüm sahte ögenin kutusunu okumaktır; kaydırma
konumundan bağımsızdır.

Bu oturumda beşinci ve altıncı denetleyici hatası. Sayıyı burada tutmak
kasıtlı: bir denetleyicinin yanlış susması ya da yanlış bağırması,
denetlediği hatadan pahalıdır.
