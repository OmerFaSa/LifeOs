# LifeOS — devir notu

Bu belge bir sonraki geliştirici içindir: ister ESP'yi sıfırdan yazsın,
ister HKM'yi kursun, ister AYS ve SPİ'yi geliştirsin.

Amacı övünmek değil, **bir kez öğrenilmiş şeyleri ikinci kez öğrenmek
zorunda bırakmamaktır.** İçindeki her madde ya gerçek bir hatadan ya
gerçek bir ölçümden geliyor. Tahmin yok; olmayan yerde "ölçmedim" yazar.

---

# BÖLÜM I — SİSTEM

## 0 · Otuz saniyede

```
LifeOs/
├── AYS/   Akademik Yol Sistemi        sınav hazırlığı          :4173   R.*
├── SPI/   Sağlık Performans İzleyici  sağlık, besin, hareket   :4183   SP.*
├── ESP/   Entelektüel Seviye Planl.   dil, felsefe, müzik…     :4193   ESP.*   [yapılacak]
└── HKM/   Hayat Kontrol Merkezi       senkron, denetim, sentez :4200   —       [yapılacak]
```

İlk üçü **birbirini import etmez.** Sıfır çalışma zamanı bağımlılığı:
ne çerçeve, ne derleyici, ne paket. Playwright yalnız test betikleri
için. HKM bir istisna ve tek istisna (bkz. §18).

| | AYS | SPİ | ESP |
|---|---|---|---|
| Ad alanı | `R.*` | `SP.*` | `ESP.*` |
| Depo anahtarı | `rota84285.v2[.profil]` | `spi.v1.<profil>` | `esp.v1.<profil>` |
| Şema sürümü | 5 | 1 | 1 |
| Dağıtım | `dist/rota.html` | `dist/spi.html` | `dist/esp.html` |
| Test | 897 ✅ | 656 ✅ | — |

### Komutlar

```bash
python devserver.py          # önbelleksiz geliştirme sunucusu
python build.py              # tek dosyalık dağıtım + derleme damgası
python build.py --minify     # sıkıştırılmış

node tools/runtests.js       # birim testleri (başsız tarayıcı)
node tools/a11ycheck.js      # erişilebilirlik — ÇİZİLEN sayfadan
node tools/palettecheck.js   # 7 palet × 2 tema × N bölüm × 5 düzen
node tools/smoke.js          # duman testi: ekranları gezer
```

> **AYS'de test çalıştırmadan önce:**
> `ln -sfn ../SPI/node_modules AYS/node_modules`
> (AYS'nin kendi `node_modules`'ü yok, `.gitignore`'da.)
>
> **Chromium:** `CHROMIUM_PATH=/opt/pw-browsers/chromium`

---

## 1 · Doktrin

Bunlar slogan değil. Her biri koda gömülü ve **testle korunuyor** —
bozmak isteyen önce testi silmek zorunda kalır. Kasıt tam olarak bu.

### 1.1 Kural motoru otoritedir

```
kural motoru  (skor, eşik, sıradaki adım)
      │  brief(agentId)  ← yalnız ölçülmüş metrik + durum etiketi
      ▼
    LLM  (yorum, cümle, soru)
      │
      ▼
  ekranda metin
```

Ajan sayıyı **yorumlar, yeniden hesaplamaz.** "Sıradaki iş"
`core/planner.js`'ten gelir; Patron'un toplantı kapanışında yaptığı şey
kararı *gerekçelendirmektir*, değiştirmek değil.

**Model kapalıyken ofis kapanmaz.** Brifing doğrudan kural cümlesine
çevrilir (`Office.ruleText`) ve ajanlar arayüzde "kural motoru"
rozetiyle konuşur.

Denetimi var — `office.validate(text, {agentId, brief})`:

```js
{ text,                    // METİN DEĞİŞTİRİLMEZ
  warnings:[…],            // yasak kalıp, alan dışı, uydurma sayı
  unsupported:[…] }        // brifingde olmayan sayılar
```

> `validate` **metni yeniden yazmaz, işaretler.** Sessizce düzeltmek
> anlamı tersine çevirebilir; çağıran ya uyarıyı gösterir ya kural
> motorunun cümlesine düşer.
>
> HKM spec'i §1.3'te emir kipini öneri kipine *çevirmeyi* öneriyor.
> Bu depodaki kanıtlanmış desen bu değil. Reddet-ve-düş daha güvenli.

### 1.2 Girilmemiş alan SIFIR DEĞİLDİR

En çok ihlal edilen kural bu ve ihlali **görünmez**: sayı orada durur,
makul görünür, üstüne tavsiye üretilir. Bugün üç ihlal buldum:

| Nerede | Ne oluyordu | Sonucu |
|---|---|---|
| Deneme formu | `Number('')\|\|0` → boş alan `0` | 30D+5Y girip boşu bırakan için gerçek 5'ti, kayıt 0 dedi |
| `blankStrategy` | uydurma sıfırlar ortalamaya girdi | «daha çok soruya gir» tavsiyesi verilmemiş sayıdan üretildi |
| `distractionTrend` | sayaç açılmamış gün 0 sayıldı | sonuç hep «odak sorunu görünmüyor» |

Dört etiketli sözlük ikisinde de var ve **birebir aynı olmalı**:

```js
R.CERTAINTY / SP.CERTAINTY / ESP.CERTAINTY = {
  measured : 'ölçüldü',     // cihaz/kullanıcı girdisi, ham veri
  estimated: 'tahmin',      // öznel değerlendirme, düzeltilebilir
  derived  : 'hesaplandı',  // iki ölçülmüş değerden formülle
  missing  : 'veri yok',    // hiç girilmemiş — SIFIR SAYILMAZ
}
```

**Son satır sistemin belkemiği.** Bir haftalık boşluğu "0 performans"
diye grafiğe sokmak kullanıcıyı yanlış alarma sürükler.

> **AYS tuzağı:** `R.CERTAINTY` aslında bir **kaynak** sözlüğüydü (ÖSYM
> resmî mi, geçen yıl mı, koçluk hedefi mi). Adı `R.PROVENANCE` oldu.
> İkisi farklı sorular ve aynı ekranda yan yana durabilirler: bir sıra
> tahmini hem "2026 referansı" (kaynak) hem "hesaplandı" (kesinlik)
> olabilir.

**ESP ve HKM için bağlayıcı:** HKM spec'i §5 etiketsiz payload'ı `422`
ile reddediyor. Sözlük tutmuyorsa sync hiç çalışmaz.

### 1.3 Ölçülen türetilenden üstündür — ve türetilen söylenir

Boş sayısı iyi bir şablon; her yeni alan için bu kalıbı kullan:

```js
function blankCertainty(correct, wrong, raw, q){
  const yazildi = raw != null && String(raw).trim() !== '';
  if(yazildi){
    const n = Number(raw);
    if(isFinite(n) && n >= 0) return { blank:Math.round(n), blankCert:'measured' };
  }
  const c = Number(correct)||0, w = Number(wrong)||0, toplam = Number(q);
  if(isFinite(toplam) && toplam > 0){
    const kalan = toplam - c - w;
    if(kalan >= 0) return { blank:kalan, blankCert:'derived' };
  }
  return { blank:null, blankCert:'missing' };
}
```

Son satırdan önceki `if` önemli: doğru+yanlış soru sayısını aşıyorsa
**sessizce kırpma.** Negatif üretmek yerine "bilinmiyor" de.

Ve ortalamalar için ikinci bir kapı:

```js
function blankKnown(exam){            // bir testi bile eksikse deneme
  const t = (exam && exam.tests) || [];   // ortalamaya GİRMEZ
  return t.length > 0 && t.every(x => x.blank != null && x.blankCert !== 'missing');
}
```

**Kapsam ekranda yazılır:** *"3 denemeden hesaplandı; 1 denemede boş
alanı doldurulmadığı için dışarıda kaldı."* Bir ortalamanın kaç
ölçümden geldiğini bilmeden ona güvenilmez.

### 1.4 Durum renkleri palete göre değişmez

Bir tahlil sonucunun ya da bir eşiğin rengi, seçilen temaya göre
değişemez — sağlık verisinde bu kabul edilemez. Palet yalnız `--sec`
(bölüm imzası) ve zemin ailesini değiştirir; `ok / warn / danger`
sabittir. `palettecheck.js` bunu 70 kombinasyonda ölçer.

### 1.5 Sistem kullanıcının yerine karar vermez

```
ajan önerir → kural motoru DOĞRULAR → kullanıcı ONAYLAR
            → motor uygular → GERİ ALINABİLİR
```

- **Kapalı eylem kataloğu.** Serbest metin asla doğrudan eyleme dönüşmez.
- `check` **her çağrıda yeniden koşar** — öneri bekleyen bir kutu, arada
  değişen duruma göre geçersizleşebilir.
- `apply` bir **geri alma anlık görüntüsü** döner.

### 1.6 Klinik / pedagojik / idari sınır

| | Ne demez |
|---|---|
| SPİ | tanı koymaz, doz önermez |
| ESP | sertifika vermez, yetenek yargısı kurmaz ("yeteneksizsin") |
| HKM | geri döndürülemez bir eylemi onaysız uygulamaz |

Üçü de `validate()` tarafından desen olarak denetlenir.

### 1.7 Uygulama modelsiz çalışır

Anahtar yoksa, kota dolmuşsa, internet yoksa: hiçbir ekran kapanmaz.
Ajanlar kural cümlesi üretir. Bu bir yedek plan değil, **varsayılan**
plan; model bir iyileştirmedir.

---

## 2 · Mimari

### 2.1 Katmanlar

```
data/       saf veri. Fonksiyon yok, durum yok, import yok.
            biomarkers.js, foods.js, curriculum.js, agents.js, rules.js…

core/       kural motorları ve altyapı.
            state.js  store.js  calc.js  planner.js  office.js
            llm.js    quota.js  ui.js    components.js  h.js

screens/    ekranlar. Birbirini TANIMAZ. Yalnız S'yi okur.
            Bir ekranın çizim hatası diğerlerini kapatmaz.

app.js      kabuk: router, boot, olay veriyolu, tema, palet, düzen
```

### 2.2 Ekran sözleşmesi

Her ekran tek bir nesne döner:

```js
{
  id:'today',
  title:'Günlük',
  headline(){ … },     // hero başlığı — DURUMUN KENDİSİ, ekranın adı değil
  lede(){ … },         // alt satır: ne yapılacağını söyler
  stats(){ return [{ value, unit, label }] },   // hero'nun sağ tarafı
  subtitle(){ … },     // headline yoksa kullanılır
  actions(){ … },      // hero düğmeleri (HTML dizesi)
  render(){ … },       // gövde — tek bir C.Grid/Ledger döner
  handle:{ 'act-adi'(el, e){} },      // data-act
  change:{ 'change-adi'(el, e){} },   // data-change
  afterRender(){ … },  // isteğe bağlı
}
```

**Etkileşim yalnız `data-act` / `data-change` ile bağlanır.** Inline
`onclick` yok. Kabuk tek bir dinleyiciyle devralır:

```js
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]');
  const fn = (screen().handle && screen().handle[el.dataset.act]) || globalHandle[…];
  …
});
```

Klavye de aynı yerden devralınır (`role="button"` taşıyan ögelerde
Enter/Boşluk) — bkz. §16.

### 2.3 Bölüm ağacı

SPİ `SECTIONS`, AYS `NAV` (aynı fikir, farklı alan adı):

```js
// SPİ
{ id:'testler', num:'02', icon:'flask', label:'Testler',
  note:'Hastane testini gir, sonucu izle',
  views:[{ route:'labs', label:'Tahliller', icon:'flask' }, …] }

// AYS
{ id:'plan', num:'02', icon:'map', label:'Plan',
  note:'Program, dersler ve hedef',
  items:[{ id:'plan', icon:'map', label:'Program' }, …] }
```

`num` bir süs değil: bölümlerin **sırası anlamlıdır** (önce girilen,
sonra okunan) ve numara o sırayı görünür kılar.

### 2.4 Çizim döngüsü

```
go(route) → S.route = route
          → applySection(route)     // data-section kökte → --sec
          → rotaDegisti = true
          → render()
              → focusSnapshot()     // odak nerede?
              → markup üret
              → innerHTML
              → restoreFocus()
              → revealActiveTab()
              → if(rotaDegisti) odağı #main'e taşı + duyur
```

Aynı karede peş peşe gelen `render()` çağrıları tek çizime indirgenir
(`nextFrame`, arka plan sekmesi için zamanlayıcı yedeği var).

---

## 3 · Şablon motoru — `core/h.js`

```js
const { html, raw, isRaw, val, when, cls, attrs, map, esc } = SP.h;
```

**Kural: araya giren her değer otomatik kaçırılır.** Ham HTML istiyorsan
`raw()` demek zorundasın — yani XSS'e giden yol açıkça işaretlidir.

```js
html`<p>${kullaniciMetni}</p>`            // kaçırılır ✅
html`<div>${raw(UI.icon('flask'))}</div>` // bilerek ham ✅

when(kosul, () => html`…`)                // koşullu parça
map(liste, x => html`<li>${x.ad}</li>`)   // liste
cls('card', o.flat && 'card--flat')       // sınıf birleştirme
attrs({ id:o.id, 'data-act':o.act })      // nitelik birleştirme
```

> `when(deger, fn)` — `deger` yanlışsa `fn` **hiç çağrılmaz.** Pahalı bir
> hesabı koşula sokmanın ucuz yolu budur.

---

## 4 · Bileşen seti — `core/components.js`

Her bileşen tek ve net bir API'ye sahiptir; varyantlar açık alanlarla
gelir (`tone:'ok'`, `size:'sm'`). Hepsi `h.raw` döner, iç içe geçebilir.

### 4.1 Yapısal

| Bileşen | Ne çizer |
|---|---|
| `Entry({label, meta, note, action, body, wide, id, class, hint})` | **defter satırı** — sistemin ana düzen birimi |
| `Ledger(rows)` | satırların kabı |
| `Card({title, sub, badge, actions, body, foot, box, flat})` | AYS'de her zaman satır; SPİ'de `Ledger` kipinde satır, dışında kutu |
| `Box(o)` | kutu, adıyla — seçilebilir/yüzen şeyler için |
| `Collapsible({title, meta, act, open, body})` | katlanır bölüm |
| `Grid / Span / Stack / Cols / Row / SectionTitle` | düzen |

> **AYS'nin tek bilinçli sapması:** orada 181 çağrının hepsi `Card`
> olduğu için dönüşüm **koşulsuzdur** — `Card` her zaman satır çizer,
> kutu isteyen `box:true` ya da `Box` der. SPİ'de bayrak `Ledger(fn)`
> ile açılır. Görünen sonuç aynı, sözleşme farklı ve bilerek farklı.

### 4.2 Ölçüm ve gösterim

```js
Stat({ label, value, unit, note, tone, progress, spark, hint })
Bar({ value, tone, auto, large })      // auto YOKSA renk YOK — §16
Meter({ label, value, text, tone })
Badge({ label, tone })                 // ok / warn / danger / info / muted
Chip({ label, act, on, data })         // act verilirse klavyeye açılır
```

### 4.3 Girdi

```js
Field({ label, hint, input })
Input({ id, value, type, aria, change, data })
Textarea({ id, rows, value, class, aria, placeholder, change })
Select({ id, value, options, aria, change })
Checkbox({ id, label, checked, change })
Mic({ target })      // tarayıcı desteklemiyorsa HİÇ ÇİZİLMEZ
Drop({ … })          // dosya bırakma
```

> `Mic` koşulludur: çalışmayan bir düğme göstermek kullanıcıya seçenek
> değil hayal kırıklığı verir.

### 4.4 Geri bildirim

```js
Notice({ tone, title, body })
Empty({ icon, text, action })   // icon verilmezse BÖLÜMÜN İMZASI çizilir
Skeleton() / Busy()
NextUp({ … })                   // sıradaki tek iş
Table({ headers, rows, tight })
Pager / paginate
```

---

## 5 · Tasarım sistemi

### 5.1 Hangi dosya ortak

Şu **altı dosya AYS ile SPİ'de birebir aynıdır** ve elle düzenlenmez:

```
css/tokens.css   palettes.css   base.css   layout.css   components.css   designs.css
```

Uygulamaya özgü her şey ayrı dosyada: AYS'de `css/rota.css` (üç boyutlu
ofis, kat planı, hafta ızgarası, sınama kartı, soru çözüm defteri).
**ESP de aynısını yapmalı:** `css/esp.css`.

> **Borç:** ESP spec'i "tokens.css kopyalanmaz, referans alınır" diyor.
> Sıfır bağımlılıklı vanilla'da böyle bir mekanizma **yok.** Bugün
> kopyaladım. Doğru çözüm: ortak dosyalar `LifeOs/ortak/` altında tek
> nüsha dursun, her `build.py` derleme anında oradan çeksin. Kopya
> değil, **derleme zamanı birleştirme.**

### 5.2 Jeton ailesi

```
yüzey      --bg --surface --surface-2 --surface-3 --surface-hover
metin      --text --text-2 --text-3
anlam      --primary --primary-hover --primary-ink --accent --danger --info
yumuşak    --primary-soft --accent-soft --danger-soft --info-soft   (TÜRETİLİR)
mürekkep   --ink --ink-2 --ink-on --ink-on-2                        (TÜRETİLİR)
çizgi      --border --border-strong --rule --ring
bölüm      --sec --sec-base --sec-soft                              (TÜRETİLİR)
kimlik     --macro-* --agent-* --c-* (grafik serileri)
ölçü       --r-sm --r --r-pill  --sp-1…--sp-10  --gutter --gutter-gap
tip        --font-serif --font-display --font-body  --fs-xs…--fs-display
hareket    --ease --dur --dur-lg
```

**Renk türetilir, elle yazılmaz:**

```css
--surface-hover: color-mix(in oklab, var(--surface) 58%, var(--bg));
--info-soft:     color-mix(in oklab, var(--info) 11%, var(--surface));
--ink:           color-mix(in oklab, var(--primary) 24%, #0C0C0A);
--sec:           color-mix(in oklab, var(--sec-base) 70%, var(--primary));
```

Elle yazılsaydı yedi paletin her birinde ayrıca tanımlanması gerekir ve
biri unutulurdu — **nitekim unutuluyordu.**

> **Ölümcül tuzak:** bir jeton kendi türevinden türetilemez. CSS özel
> değişken döngüsü **sessizdir**: değer boş kalır, konsola hata düşmez,
> ekran tuhaf görünür. Kraft düzeninde bir kez oldu.

### 5.3 Tipografi — üç aile, her birinin tek işi

```
serif    YALNIZ başlık (hero h1, bölüm h2). Editoryal ağırlık.
display  YALNIZ sayı ve kart başlığı. Tabular rakamlar hizalanır.
body     geri kalan her şey.
```

**Kural:** serif hiçbir yerde sayı taşımaz, display hiçbir yerde
paragraf taşımaz. Karıştırıldığında ikisi de amatörleşir.

### 5.4 Defter dili — kutu değil satır

Kart dili bir yönetim panelinin dilidir: her şey eşit ağırlıkta beyaz
bir dikdörtgene konur, on beş dikdörtgen yan yana dizilir ve sayfa bir
tepsiye döner. Günde birkaç kez açılıp aylarca okunacak bir sistemde bu
dil yorar.

```
solda   dar künye sütunu — bölüm adı, ölçü, eylem   (--gutter: 196px, SABİT)
sağda   içeriğin kendisi, tam genişlikte akan
arada   ince bir kıl çizgi
```

```html
<section class="lrow">
  <div class="lrow__side">
    <div class="lrow__label">GÜNÜN ÖLÇÜMÜ</div>
    <div class="lrow__meta">12 Eylül 2026</div>
    <p class="lrow__note">Boş bıraktığın alan sıfır sayılmaz.</p>
    <div class="lrow__act"><button class="btn">Kaydet</button></div>
  </div>
  <div class="lrow__main">…</div>
</section>
```

Üç kural:

1. **Kutu yalnız SEÇİLEBİLİR ya da YÜZEN şeylerde kalır** — masa kartı,
   gün sütunu, bırakma alanı, sohbet balonu, alt sayfa, şık.
   *Okunacak bir şey kutuya konmaz.*
2. **Künyeye koyacak bir şey yoksa sütun hiç açılmaz** (`lrow--wide`).
   Açsaydı 196px boş bir sol sütun kalır, içerik sağa sıkışırdı.
3. **Künye sütunu uzun içerikte yapışır** (`position:sticky`) — yüz
   satırlık bir listeyi kaydırırken hangi bölümde olduğunu unutmayasın.

### 5.5 Ölçü ekrandan değil KUTUDAN gelir

Bileşenler duyarlı kurallarını pencere genişliğine göre uyguluyordu;
asıl soru "pencere kaç piksel" değil **"bu satıra kaç piksel kaldı"**.

```css
.lrow__main{ min-width:0; container-type:inline-size; container-name:satir; }
@container satir (min-width:640px){ … }
```

İkisi "Katmanlı" düzeninde ayrışır (raf 228px alır) ve "Harita"
düzeninde büsbütün ayrışır (satır bir karta girer).

### 5.6 Beş düzen · yedi palet · iki tema

```
defter     varsayılan — künye sütunu, kutusuz satırlar, ince çizgiler
odak       ekranda tek büyük sayı, gerisi ikinci planda
kraft      kâğıt dokusu, daktilo künyesi
katmanlı   bölümler sol kenar çubuğuna iner
harita     satırlar noktalı tuval üstünde düğüm kartlara döner
```

Düzen yalnız **iskeleti** değiştirir: durum renkleri ve kesinlik
etiketleri hiçbir düzende değişmez.

Varsayılan olan **hiçbir şey yazmaz**: `data-design` niteliği yalnız
varsayılan dışı bir seçimde köke yazılır. Varsayılanın bedeli sıfır
olmalıdır. Tanımsız bir düzen adı (eski profil) varsayılana düşer.

### 5.7 Bölüm imzaları

Hero'da bölümün kendi çizimi durur (`UI.motif(sectionId)`). Boş ekran da
tasarımın parçasıdır: jenerik bir ikon yerine bölümün imzası durur ve
ekran boşken bile hangi bölümde olunduğu bellidir.

Hepsi **aynı kalemle**: `viewBox="0 0 265 34"`, `stroke-width:1.5`, tek
renk, dolgu yok. Farklı kalemlerle çizilmiş motifler altı ayrı
uygulamadan toplanmış gibi durur.

---

## 6 · Durum ve model — `core/state.js`

```js
SP.S      // canlı durum: profil, günler, kayıtlar, ui
SP.Model  // veri modeli: ensure*, save*, hesap yardımcıları
```

**Desen:** `ensureX` kaydı yoksa varsayılanıyla oluşturur, `saveX`
yazar. Ekranlar `S`'yi okur, `Model` üzerinden yazar.

```js
const day = await M.ensureDay('2026-09-15');
day.distractions = 3;
day.distractionsTracked = true;      // §16 — "hiç açılmadı" ile "sıfır" ayrı
await M.saveDay('2026-09-15');
```

### 6.1 Göç

`R.SCHEMA_VERSION` / `SP.SCHEMA_VERSION` tek yerde durur (`core/store.js`).
`migrate()` açılışta koşar, yıkıcı değildir: yeni koleksiyonlar boş
başlar, ilk yazmada oluşur.

AYS'nin v5 göçü iyi bir örnek — **yalnız kendini ele veren veriyi
onarır:**

```js
// v4 → v5: uydurma sıfırların onarımı
// Testin soru sayısı biliniyorsa ve doğru+yanlış ondan azsa,
// gerçek boş sayısı sıfır OLAMAZ. Böyle bir kayıt yeniden türetilir.
// Sıfırdan büyük her değer elle yazılmış sayılır ve KORUNUR.
```

Şablon eşleştirmesi önce `templateId` ile, yoksa `type` (şablon adı) ile
yapılır — v5'ten önce elle girilen denemeler `templateId` taşımıyordu.

---

## 7 · Depolama — `core/store.js`

```js
Store.init()                 // bulut yeteneği varsa aç, yoksa yerel
Store.get(path)              // → veri | null   (undefined DEĞİL)
Store.set(path, data)        // → yerel yazma başarılı mı
Store.remove(path)
Store.list(collection)       // → [{ id, …data }]  alt koleksiyonlar SIZMAZ
Store.exportAll()            // { __meta:{app,schemaVersion,exportedAt,mode}, data }
Store.importAll(obj)         // TAM DEĞİŞTİRİR (birleştirmez)
Store.readBackup(obj)        // { ok, data, meta } | { ok:false, error }
Store.clear()
Store.localSize() / localQuota()
Store.health()               // { mode, cloud, local, lastError, pendingCloudWrites }
Store.onError = fn           // app.js bağlar
```

### 7.1 Yol biçimi

```
'profile'            tekil kayıt
'labs/<id>'          koleksiyon üyesi   → list('labs') döndürür
'labs/<id>/alt'      alt ağaç           → list('labs') DÖNDÜRMEZ
```

### 7.2 Ölçüm — yazma maliyeti

Her yazma tüm depoyu ayrıştırıp yeniden serileştiriyordu; bir ölçüm
girmenin maliyeti o güne kadar girilmiş **her şeyin boyutuyla** büyüyordu.

| kayıt | önce | sonra | kazanç |
|---|---|---|---|
| 50 | 0,17 ms | 0,11 ms | %35 |
| 200 | 0,78 ms | 0,41 ms | **%47** |
| 500 | 2,71 ms | 1,95 ms | %28 |
| 1000 | 5,00 ms | 4,44 ms | %11 |

Ayrıştırılmış kopya artık bellekte. **Serileştirme kasten kaldı:**
yazma anında diske iner, ertelenmez. Ertelenmiş bir yazma, sekmesini
kapatan kullanıcının verisini kaybeder ve burası verinin kaybolabileceği
tek yerdir.

Kopyanın tek tehlikesi ikinci bir sekmenin yazmasıdır:

```js
window.addEventListener('storage', e => {
  if(!e || e.key === null || e.key === LOCAL_KEY) kopya = null;
});
```

`storage` olayı yalnız **diğer** sekmelerde tetiklenir — tam da gereken
şey. Testle kilitli.

### 7.3 Açık borç: ölçeklenme

Kalan maliyet tüm deponun **tek anahtarda** durmasından geliyor; yazma
hâlâ O(toplam). Gerçek çözüm her kaydı kendi anahtarına taşımaktır
(yazma sabit maliyet olur) ama bu **yaşayan kişisel sağlık verisinde bir
göç** demek. Sormadan yapma.

### 7.4 Açık borç: içe aktarma geri alınamıyor

`importAll` her şeyi değiştirir ve **geri dönüş yoktur.** Yanlış dosya =
dokuz aylık veri. Doktrin her yerde "geri alınabilir" diyor; tek istisna
burası.

Önerilen çözüm:
1. Değiştirmeden önce mevcut durumu **ayrı bir anahtara** al
   (`<LOCAL_KEY>.geri`) — aynı anahtara yazmak onu da yok eder.
2. Anlık görüntü alınamıyorsa (kota) **içe aktarmayı reddet.** Geri
   dönüşü olmayan yıkıcı işlem yapılmaz.
3. `canUndoImport()` / `undoImport()` dışa aç, rehber ekranında göster.
4. Tek anlık görüntü tut (son içe aktarma); çoğaltmak depoyu ikiye katlar.

---

## 8 · Ofis

### 8.1 Ajanlar

SPİ'de 5 uzman + Patron, AYS'de 5 koç + Patron, ESP'de 6 uzman + Patron.

**Yetki ayrımı kasıtlıdır:** bir ajan alan dışına çıkan bir soru görürse
sahibine yönlendirir, cevap uydurmaz. Çelişkiyi Patron çözer.
`validate()` alan ihlalini (`scopeBreaches`) yakalar.

### 8.2 Brifing — ajanın gördüğü TEK şey

```js
Office.labBrief() / nutriBrief() / moveBrief() / moneyBrief() / patronBrief()
Office.brief(agentId)
```

**Modele giden budur ve fazlası değildir.** Ham dosya, tam metin,
kişisel günlük notu brifinge **girmez** — yalnız ölçülmüş metrik ve
durum etiketi. Bu bir testle denetlenir; ESP ve HKM'de de denetlenmeli.

### 8.3 Hafıza ve devir

```js
Office.historyFor(agentId, extra)   // HAFIZA_TUR = 8 tur
Office.handoffs() / handoffsFor(agentId)
Office.notes(agentId)              // masa notları
Office.agendaCandidates()
Office.dailyBriefing() / runMeeting()
```

**Masa notu** kullanıcı silmez; koşul sağlandığında kendiliğinden düşer.
Türleri: tıkanma, vadesi geçmiş, kazanım, bilgi.

> **Tuzak (yaşandı):** `send()` kullanıcı mesajını geçmişe *önce*
> ekliyor, sonra `ask()` çağırıyordu → soru sohbet geçmişinde iki kez
> görünüyordu. Geçmişi **önce yakala**, sonra ekle.

### 8.4 Haftalık rapor

*"İyi haberi kötü haberin arkasına saklama."* Kötü olan önce söylenir:

> «Diksiyon pratiği bu hafta hiç yapılmadı **fakat** felsefi okuma
> hedefi %140 aşıldı ve iki yeni sentopik bağlantı kuruldu.»

---

## 9 · Model katmanı — `core/llm.js` + `core/quota.js`

```js
LLM.chat(cfg, messages, opts)   LLM.complete(…)   LLM.test(cfg)
LLM.getKeys(p) / setKey / addKey / removeKeyAt / clearKeys / maskKey(s)
LLM.pickKey(cfg)                // kotası müsait anahtarı seçer
LLM.truncated(finish) / trimToSentence / dropLastWord / joinContinuation
LLM.errorText(code) / retryable(code) / resumable(code)
LLM.offline() / onceOnline(fn) / inSandbox()
```

### 9.1 Anahtar deposu

Bir sağlayıcıya **birden çok anahtar** verilebilir; kota anahtar başına
sayıldığı için ikinci anahtar günlük hakkı ikiye katlar — ücretsiz
katmanda en ucuz büyüme yolu.

- Aynı anahtar iki kez sayılmaz (sahte ikinci hak üretirdi).
- Eski tek-dize biçimi okunmaya devam eder.
- Bozuk depo çökmez, boş sayılır.
- **Tam anahtar hiçbir yerde çizilmez:** `mask()` uzunda uçları
  gösterir, kısada tamamen gizler.

### 9.2 Kesik yanıtın onarımı

```js
truncated('length')        → true    // devam iste
dropLastWord(metin)        // yarım kalan son kelimeyi at
joinContinuation(prev, piece)  // örtüşmeyi bul ve at, yoksa boşlukla ekle
trimToSentence(metin)      // sarkan yarım cümleyi at
```

İki incelik:

- `trimToSentence` **kesilen kısım gövdeyse atmaz** (geriye %40'tan azı
  kalıyorsa). Yarım cümle kötüdür, boş ekran daha kötüdür.
- `"1.500 lira"` içindeki nokta cümle sonu **sayılmaz**; sayılsaydı
  metin oradan kesilirdi.

### 9.3 Hata taksonomisi

```js
RETRYABLE = ['rate_limited','server','bad_model','timeout','empty']  // yedek modele geç
RESUMABLE = ['offline','network','server','timeout']                 // bağlantı gelince devam
```

Karıştırılırsa ya boşuna deneme ya kayıp oturum olur. **Anahtar hatası
yeniden denenmez** — tekrar denemek yalnız kota yakar.

### 9.4 Kota

```js
Quota.check(cfg)      // → { ok, reason:'daily'|…, waitMs, usedToday, rpd }
Quota.acquire(cfg) / release(cfg) / penalize(cfg, sn)
Quota.limitsFor(cfg) / effective(cfg) / status(cfg)
Quota.setOverride(p, {rpm, rpd}) / getOverride / clearOverrides
```

**Güvenlik payı yalnız dakikalık sınıra uygulanır.** Günlük sayaçta pay
YOKTUR ve olmamalıdır: bu bir zamanlama sorunu değil düz bir sayımdır;
pay düşmek kullanıcının ücretsiz hakkının bir kısmını harcamadan
çürütür.

**Dakikalık hak beklenir, günlük hak beklenmez.** Gün dolduysa "üç
saniye sonra dene" demek yanlıştır → `reason:'daily'`, `waitMs:0`.

`release` yalnız **istek hiç gönderilmediyse** günlük sayacı geri alır;
429 alan istek de günü tüketir.

---

## 10 · Ses — `core/speak.js` + `voice.js` + `talk.js`

Web Speech API'nin üç tuzağı, üçü de yaşandı:

**1 · Chrome uzun metni ~15 saniyede sessizce keser** ve `onend` hiç
tetiklenmez. Çözüm: metni cümlelere böl, `PARCA = 180` karakterlik
parçalarda söyle.

**2 · `onend` hiç gelmeyebilir.** Her parça için emniyet zamanlayıcısı:

```js
emniyetMs(text, rate) = min(45000, 3000 + len/(10*rate)*1000)
```

**3 · Akustik geri besleme.** Koç konuşurken mikrofon açık kalamaz —
kendi sesini duyar. Bu yüzden **sözü kesme sesle değil dokunmayla
olur**; en yakın tuş boşluk (bir alana yazarken elbette boşluktur).

### 10.1 Sohbet döngüsü — `talk.js`

```
dinliyor → (SESSIZLIK_MS = 1400 ms sessizlik) → düşünüyor
         → konuşuyor → (SIRA_GECIS_MS = 260 ms) → dinliyor
```

`opts.gonder(soru)` ajanın yanıt metnini döndürmek zorundadır.
`Talk.stop()` ekran değişince çağrılır: paneli olmayan bir ekranda açık
kalan mikrofon, kullanıcının göremediği bir kayıttır.

### 10.2 Telaffuz hazırlığı

`konusulacak(s)` metni seslendirmeden önce düzeltir:
`%40 → "yüzde 40"`, `ng/mL → "ng mL"`, `· → ", "`.

---

## 11 · Türkçe ayrıştırma

Kazanılmış üç ders:

**1 · İnsanlar fiil söyler, isim değil.** "Tempolu yürüyüş" değil
**"yürüdüm"**. Katalogdaki her öge takma ad listesi taşımalı:

```js
{ id:'walk-brisk', name:'Tempolu yürüyüş',
  aliases:['yürüdüm','yürüyüş','yürüyüş yaptım','tempolu yürüdüm'] }
```

**2 · Takma ad dizini uzundan kısaya sıralanır.** Yoksa "yürüyüş"
"tempolu yürüyüş"ten önce eşleşir ve yanlış kayıt düşer.

**3 · Sayı içindeki virgül cümle ayracı değildir:**

```js
const AYRAC = /\s+(?:ve|ayrıca|bir de|sonra|artı)\s+|[;]|,(?!\d)/gi;
```

> **Emin olunamayan satır atılmaz ve uydurulmaz**; "eşleşmedi" olarak
> işaretlenir, kullanıcı elle bağlar.

---

## 12 · Öneri kutusu — `core/proposals.js`

```js
Proposals.KATALOG                 // kapalı eylem kataloğu
Proposals.eylem(id)               // { label, check, preview, apply }
Proposals.catalogPrompt()         // modele verilen katalog tarifi
Proposals.fromText(metin)         // serbest metin → öneriler
Proposals.fromModel(json)         // model çıktısı → öneriler
Proposals.check(p) / preview(p)
Proposals.propose / approve / reject / undo / clearResolved
Proposals.pending() / all()
```

Kurallar:

- **Katalog dışı eylem düşer** (`why:'Katalog dışı eylem.'`).
- `check` **her çağrıda yeniden koşar.**
- `apply` geri alma anlık görüntüsü döner.
- Önizleme her satırda **önce/sonra** taşır — kaydetmeden ne olacağı
  görünür.
- **Komut kendiliğinden kaydetmez.** `run` çağrılmadıkça durum değişmez;
  bu bir testle kilitli.

---

## 13 · Test altyapısı

```js
const { describe, it, expect, run, mockStore, resetState, testProfile,
        withToday, withTodayAsync, makeLab, pushLab, pushVitals,
        pushMeal, pushWorkout, suites, realStore } = SP.Test;
```

- `resetState()` — temiz durum; `SP.Store`'u **bellek içi sahte depoyla**
  değiştirir ve profili bilerek TAM doldurur (çoğu hesap profilsiz hiç
  çalışmaz).
- `realStore` — gerçek modülün referansı. Gerçek depoyu denemek için.
- `withTodayAsync('2026-09-15', async () => {…})` — "bugün"ü sabitler.

### 13.1 Yeni paket ekleme

1. `src/tests/<ad>.test.js` yaz.
2. `src/tests/index.html` içine `<script>` ekle.
3. `node tools/runtests.js`

### 13.2 Test adı bir CÜMLE olsun

```js
it('girilmemiş alan sıfır sayılmaz')
it('sayaç açılmamış günü ortalamaya katmaz')
it('öneri komutu KENDİLİĞİNDEN KAYDETMEZ')
it('günlük hak dolunca bekleme değil RET döner')
```

Test listesi okunduğunda **sistemin sözleşmesi** okunmuş olmalı.

### 13.3 Bugünkü kapsam

| modül | AYS | SPİ |
|---|---|---|
| `llm.js` | %68 | %61 *(oturum başında %3)* |
| `quota.js` | %84 | %76 *(%15)* |
| `store.js` | %64 | %76 *(%35)* |
| `office.js` | %59 | %84 |
| `state.js` | %73 | %61 |

**Kalıcılığa dokunmadan önce test yaz.** Depo modülünün on yedi
işlevinden altısı deneniyordu; önce testleri yazdım, sonra optimize
ettim. Sıra tersi olsaydı bozduğumu anlamazdım.

---

## 14 · Denetleyiciler — ve kendilerinin denetlenmesi

| Betik | Ne korur |
|---|---|
| `runtests.js` | birim testleri |
| `a11ycheck.js` | klavye + ekran okuyucu, **çizilen sayfadan** |
| `palettecheck.js` | kontrast: 7 palet × 2 tema × N bölüm × 5 düzen |
| `designcheck.js` `tasarimcheck.js` `ledgercheck.js` | düzen tutarlılığı (SPİ) |
| `loadcheck.js` | açılış maliyeti (SPİ) |
| `smoke.js` | ekranları gezer, JS hatası arar |

### 14.1 `a11ycheck.js` neyi arar

adsız düğme/bağlantı · etiketsiz form alanı · başlık sırası atlaması ·
24px altı dokunma hedefi · alt'sız görsel · pozitif tabindex · klavyeyle
ulaşılamayan tıklanabilir öge · yer imi eksikliği · atlama bağlantısının
ilk durak olmaması · alt sayfa kipliliği (odak hapsi, kaydırma kilidi,
`inert`, odağın geri dönmesi) · **yönlendirme duyurusu ve odak** ·
**yeniden çizimde odağın korunması**

### 14.2 BU OTURUMDA ALTI DENETLEYİCİ HATASI ÇIKTI

Saymak kasıtlı: **bir denetleyicinin yanlış susması, denetlediği
hatadan pahalıdır.**

1. Kaydırıcı içindeki geniş tablo "yatay taşma" sayıldı → dört olmayan hata.
2. `aria-hidden` ağacındaki gizli dosya girdisi "etiketsiz alan" sayıldı.
3. Kendi temizlik kodum alt sayfanın **perdesini** sayfada bırakıyordu
   (AYS'de perde `.overlay`, iç kutu `.sheet`) → ölçülen her şey %64
   karartılmıştı; koyu temayı bozuk sandım, uygulamada hata aradım.
4. Dokunma hedefi görsel kutudan ölçüldü → `::after` ile doğru
   büyütülmüş düğme hâlâ "küçük" bildirildi, sahte bir borç satırı
   tutmaya zorladı.
5. Aynı ölçüm `elementFromPoint`e çevrildi → künye sayfanın dibinde,
   görünen alanın dışında; **görünmeyen her düğme "küçük" sayıldı.**
6. Kontrast, ögenin gerçek zeminine değil gövde zeminine karşı ölçüldü.

### 14.3 Kural: geçen denetim de SAYI gösterir

```
butun paletler AA gecti
en dar pay: ucuncul/zemin 4.52 (asgari 4.5) — light/indigo/today
```

Hiçbir şey ölçmeyen bir betik de "geçti" yazar. **Sayı görünmedikçe
geçtiğine güvenme.**

### 14.4 İzin listesi bir BORÇ defteridir

`a11ycheck.js` içindeki `IZIN` listesi bilinen ve gerekçeli eksikleri
tutar. Bahane defteri değil: dolu kalması normal değildir. Bugün dörtten
bire indi (kalan tek borç tarayıcının kendi onay kutusu).

---

## 15 · Derleme — `build.py`

`src/index.html` içindeki yerel `<link>` ve `<script src>` etiketlerini
dosya içerikleriyle değiştirir, sarmalayıcıyı soyar ve tek dosyalık bir
parça üretir. CSS/JS listesi HTML'den okunur — yeni dosya eklemek için
yalnız `index.html`'e eklemek yeter.

**Derleme damgası** (`src/js/data/build.js`, her derlemede yeniden
yazılır):

```js
R.BUILD = { id:'ee520d0', at:'2026-09-12 08:37', dirty:true };
```

Ekrandaki sayfanın hangi derleme olduğunu söyleyen tek şey budur.
Tarayıcı eski bir js dosyasını önbellekten verdiğinde arayüz aynı
görünür, **davranış eskidir**; damga olmadan bunu anlamanın yolu yok.
Künyedeki "tazele" düğmesi adrese bir kerelik damga ekleyerek önbelleği
atlar (`location.reload()` bunu garanti etmez).

---

## 16 · Bugün kaybettiğim zamanı sen kaybetme

Her biri gerçekten oldu.

**`--fs-2xl` ve `--fs-3xl` hiç tanımlanmamıştı.** İki uygulamanın
tarihinde de yoklar; üç öge yıllardır devralınan puntoyla çiziliyordu.

```bash
# düzenli tara:
grep -oh 'var(--[a-z0-9-]*' src/css/*.css | sed 's/var(//' | sort -u > /tmp/k
grep -oh -- '--[a-z0-9-]*\s*:' src/css/*.css | tr -d ' :' | sort -u > /tmp/t
comm -23 /tmp/k /tmp/t          # kullanılan ama TANIMSIZ
```

**Kopyalanan `palettes.css` SPİ'nin bölüm adlarını taşıyordu**
(`besin`, `hareket`, `finans`). AYS'nin altı bölümünün dördünün
karşılığı yoktu → hepsi ana renkteydi. Üstelik `data-section` köke hiç
yazılmıyordu: kural yazılıydı ama **hiç çalışmıyordu.**

**`Textarea` `class` ve `aria` alanlarını sessizce düşürüyordu.** İki
çağrı yeri `class:'composer__input'` geçiyordu ve hiç yazılmıyordu.
→ *Bileşen kabul etmediği bir alanı sessizce yutmasın.*

**`S.ui.analyticsTab` varsayılanı `'overview'` idi**, o adda sekme
kalmamıştı. Şeritte hiçbir sekme seçili görünmüyor, gövdede
karşılaştırma çiziliyordu.
→ Kayıtlı sekme adı listede yoksa ilk sekmeye düş.
→ Test: *her sekmeli ekranda TAM BİR sekme seçili.*

**`Bar` tonu yüzdeden türetiyordu:**

```js
// YANLIŞ — %60 altındaki her şerit kırmızı; sabah 1/3'te olmak
// başarısızlık değildir. Ayrıca tone:'' geçen on çağrı yok sayılıyordu
// (boş dize yanlış değerdir, || onu yutar).
const tone = o.tone || (pct >= 85 ? '' : pct >= 60 ? 'warn' : 'danger');

// DOĞRU — eşik renklendirmesi İSTENİR
const tone = o.tone != null && o.tone !== ''
  ? o.tone
  : (o.auto ? (pct >= 85 ? '' : pct >= 60 ? 'warn' : 'danger') : '');
```

**Odak bambaşka düğmeye atlıyordu.** Anlık görüntü seçicisi
niteliklerden türetiliyor (`button[data-act="day-tab"]`) ve tek başına
benzersiz değil; `document.querySelector` belge sırasında **ilk**
eşleşeni döndürüyor.
→ Anlık görüntü içerikte alındıysa aramayı `#main` ile sınırla.

**Yeniden çizimde odak `<body>`ye düşüyordu**, çünkü anlık görüntü
yalnız form alanlarını işaretliyordu — oysa **düğmeye basmak da çizim
tetikler.** Klavyeyle çalışan biri her eylemden sonra sayfanın başına
dönüyordu.
→ Odaklanabilir her ögeyi işaretle; öge bulunamazsa içerik alanına dön.

**Gezinme tamamen sessizdi.** Tek sayfalık bir uygulamada adres
değişmez, başlık okunmaz, odak yerinde kalır. Ekran okuyucuyla çalışan
biri için **hiçbir şey olmamıştır.**
→ Yönlendirmede (yalnız yönlendirmede!) ekran adını görünmez bir canlı
alana yaz ve odağı `#main`'e taşı. Her çizimde yapılırsa yazarken odak
elden gider.

**`i.grams` / `i.g`** — ayrıştırıcı `g` üretiyor, üç yer `grams`
okuyordu. Palet üzerinden girilen her öğün `g:undefined` kaydediliyordu:
listede görünüyor, hesapta sıfır.
→ *Bir alanın adı iki yerde farklıysa test yaz.*

**Bir hata bulduğunda kardeş uygulamada da ara.** Ortak soy var: bugün
`Textarea`, `Select` ve `--fs-2xl` hataları **ikisinde de** çıktı.

---

# BÖLÜM II — ESP

## 17 · Entelektüel Seviye Planlayıcı

### 17.1 Kopyala, değiştirme

- Altı ortak CSS dosyası **olduğu gibi** (§5.1).
- `core/h.js`, `components.js`, `ui.js`, `store.js`, `llm.js`, `quota.js`,
  `memo.js`, `speak.js`, `talk.js`, `voice.js`, `proposals.js`
- `app.js` kabuğu: künye + numaralı şerit + hero + sayfa şeridi + alt
  bant + telefon sekmeleri + **görünüm paneli** + **derleme damgası**
- `tools/runtests.js`, `a11ycheck.js`, `palettecheck.js`, `smoke.js`
- `build.py`, `devserver.py` (port 4193)

### 17.2 Kendin yaz

```
css/esp.css              metronom göstergesi, sentopik matris, dalga formu
data/canon.js            felsefe/edebiyat kanonu — YALNIZ VERİ
data/lexicon.js          dil/kelime referansı
data/guitar_tabs.js      gamlar, akor ilerleyişleri
data/phonetics.js        tekerlemeler, artikülasyon modelleri
data/rules.js            pedagojik sınır, öncelik sırası, validate desenleri
data/agents.js           yedi ajan — TEK yerde, core/ altında YOK
core/intellect.js        EHS / SSK / okunabilirlik
core/srs.js              Leitner / SM-2
core/acoustic.js         metronom + artikülasyon (Maestro ve Demosthenes PAYLAŞIR)
core/planner.js          haftalık rota, öncelik sırası
core/office.js           yedi ajan, brifingler, validate()
screens/                 today library studio symposium writing analytics office
```

### 17.3 Yedi ajan

| # | Alan | Ajan | Kural motoru |
|---|---|---|---|
| 1 | Yabancı Dil | Polyglot Mentor | `srs.js` |
| 2 | Felsefe | Socrates | `intellect.js` (argüman ağacı) |
| 3 | Müzik / Gitar | Maestro | `acoustic.js` (metronom/armoni) |
| 4 | Diksiyon | Demosthenes | `acoustic.js` (artikülasyon) |
| 5 | Derin Okuma | Aristoteles | `intellect.js` (sentopik matris) |
| 6 | Yazı | Montaigne | `intellect.js` (okunabilirlik) |
| 7 | **Orkestrasyon** | **Patron** | `planner.js` |

`acoustic.js`'in iki ajan tarafından paylaşılması kasıtlıdır: ikisi de
aynı ham girdiyi farklı eşiklerle okur — kod tekrarı yerine tek sinyal
işleme katmanı.

### 17.4 Öncelik sırası — `ESP.PRECEDENCE`

Sınırlı olan kaynak **zamandır**, doğruluk değil:

```
1  Tıkanmış temel (retansiyon <%50, teknik platoda 14+ gün)
2  Zamana bağlı hedef (yaklaşan sunum, konser, sınav)
3  SRS'in vadesi geçmiş kartları
4  Sentopik sentez
5  Yeni içerik / repertuar genişletme
```

> Örnek: Maestro "yeni parçaya hazır" derken Polyglot "retansiyon %38"
> diyorsa **temel disiplin yeni içeriği yener.** Ama Maestro'nun işi
> bitmez — mevcut repertuarda BPM artışı önerir. *"Hiçbir şey yapma"
> demek değildir.*

### 17.5 Skorlama

```
EHS = Σ (D_i × H_i × K_i)          H_i YALNIZ ölçülen pratik saati;
                                   "veri yok" günler toplama girmez
R(t) = e^(−t/S)                    kavramsal retansiyon
SSK = (Bağlantılı/Toplam) × log(1 + Yazar_Sayısı)
```

> **SSK düzeltmesi doğru, aynen uygula.** Orijinal `log(Yazar_Sayısı)`
> tek yazarda `log(1)=0` ile tüm sentezi sıfırlıyordu — bir kitabı
> derinlemesine analiz eden kullanıcı cezalandırılıyordu. `log(1+n)`
> tekilliği giderir ve `n=0`'da da tanımlı kalır.

Üçü de `core/intellect.js`'te **tek kaynaktan** hesaplanır; ekranlar ve
brifingler aynı fonksiyonu çağırır, kopya hesap yapmaz.

### 17.6 Pedagojik sınır — `validate()` dört desen arar

| Denetim | Ne arar |
|---|---|
| Sahte sertifikasyon | "Artık C1'sin, sertifikaya hazırsın" |
| Mutlak yetenek yargısı | "Bu alanda yeteneklisin/yeteneksizsin" |
| Sonuç garantisi | "Bu tempoyla kesin 3 ayda konsere çıkarsın" |
| Estetik otorite | "Bu deneme yayımlanmaya hazır, kusursuz" |

Doğru cümle biçimi: *"CEFR B2'sin"* değil → *"son 30 günlük üretimin B2
bandının kriterlerini karşılıyor — bu bir öz-değerlendirmedir, resmî
sınav yerine geçmez."*

### 17.7 Bilinçli olarak ertelenenler

- Otomatik transkripsiyon (konuşma-metin modeli ister; MVP'de süre ve
  öz-değerlendirme elle işaretlenir)
- Canlı CEFR / müzik teorisi sınavı entegrasyonu (§1.6)
- Giyilebilir cihaz entegrasyonu

---

# BÖLÜM III — HKM

## 18 · Hayat Kontrol Merkezi

### 18.1 Ne olduğu ve ne OLMADIĞI

HKM üç uygulamanın **üstünde değil, yanında** duran bir servistir.

```
┌─────────┐  ┌─────────┐  ┌─────────┐
│ AYS:4173│  │ SPİ:4183│  │ ESP:4193│   ← HKM olmadan da TAM işlevli
└────┬────┘  └────┬────┘  └────┬────┘
     │  JSON push  │  JSON push  │
     └─────────────┼─────────────┘
                   ▼
        ┌──────────────────────┐
        │   HKM DAEMON  :4200  │   ← İSTEĞE BAĞLI ek katman
        │  SQLite · VP'ler ·   │      çöktüğünde üçü de çalışır,
        │  Yönetici · Gateway  │      geriye senkron olur
        └──────────────────────┘
```

**Tek yönlü bağımlılık kuralı:** AYS/SPİ/ESP, HKM'nin var olduğunu
**bilmez** — yalnız "varsa gönder" (best-effort POST, hata sessizce
yutulur). HKM kapalıyken hiçbir modülün arayüzünde hata, bekleme ya da
bozulma olmaz.

> Bugün ölçtüm: her iki uygulamada da `llm.js` dışında **sıfır ağ
> çağrısı** var. Beacon eklemek temiz bir başlangıç — ama iki kural
> koy: her çizimde çalışmasın, ve kaydetmeyi **bloklamasın.**

### 18.2 Bağımlılık istisnası

AYS/SPİ/ESP'nin "sıfır bağımlılık" kuralı `HKM/core/` ve
`HKM/gateways/` için geçerli **değildir** — bir arka plan servisi
Telegram/WhatsApp SDK'sı ve bir SQLite sürücüsü olmadan var olamaz.
İstisna yalnız buraya sınırlıdır.

`HKM/gateways/web_dashboard/` ise AYS/SPİ/ESP ile aynı vanilla JS +
ortak `tokens.css` kuralına tabidir. **Burada da hiçbir çerçeve yok.**

### 18.3 VP Konseyi — LLM'e HİÇ dokunmaz

```
raw_events (JSON) → VP audit (saf Python kural motoru)
                  → APPROVED / INCOMPLETE / ANOMALY
                  → Yönetici (LLM) → kullanıcı
```

| VP | Modül | Neye bakar |
|---|---|---|
| VP-Academic | AYS | soru sayısı, deneme neti, çalışma süresi, konu hâkimiyeti |
| VP-Bio | SPİ | uyku, HRV, makro, biyobelirteç, hareket skoru |
| VP-Intellect | ESP | SRS retansiyonu, BPM, okuma sayfası, argüman sayısı |

`vp_academic.py`, `vp_bio.py`, `vp_intellect.py` **saf kural
motorlarıdır.** Eşikleri `core/thresholds.py`'den **veri olarak** okurlar
(koddan değil — kullanıcı kendi hedef uykusunu ayarlayabilsin).

> Bu `test_vps.py`'de denetlenir: **VP modüllerinin hiçbiri `llm.py`
> import etmez.** Bu tek satırlık test, katmanın bütün anlamını korur.

### 18.4 Çapraz çelişki — `HKM.PRECEDENCE`

```
1  SPİ kırmızı bayrağı (kritik biyobelirteç / toparlanma eşiği)
2  Dış dünyanın sabit takvimi (sınav tarihi, teslim tarihi)
3  AYS'nin zamana bağlı akademik hedefi
4  ESP'nin tıkanmış temeli (SRS vadesi, teknik plato)
5  ESP'nin yeni içerik hedefi          ← ilk feda edilen
```

Doğru cümle biçimi (emir değil öneri):

> «Fiziksel sermaye çöküş eşiğinde. AYS'nin bugünkü denemesinin yarına
> **ertelenmesini öneririm** — kötü skorun motivasyonunu bozabilir;
> **onaylarsan** yerine hafif konu tekrarı koyarım. Saat 22:30'da sana
> bir **hatırlatma göndereceğim**.»

**"22:30'da ekran kapatma zorunlu kılındı" ifadesi kod düzeyinde bile
yanlıştır** — HKM'nin işletim sistemi seviyesinde ekran kapatma yetkisi
yoktur ve olmamalıdır.

### 18.5 Şema — ve spec'te gördüğüm üç sorun

```sql
CREATE TABLE raw_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,              -- 'AYS' | 'SPI' | 'ESP'
  event_type TEXT NOT NULL,
  payload JSON NOT NULL,             -- her alan {value, certainty} çifti
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_by_vp BOOLEAN DEFAULT 0
);

CREATE TABLE vp_audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES raw_events(id),
  vp_name TEXT NOT NULL,
  status TEXT NOT NULL,              -- APPROVED | INCOMPLETE | ANOMALY
  critique TEXT, metrics JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE executive_decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  daily_focus TEXT NOT NULL,
  energy_allocation JSON,
  executive_summary TEXT,
  status TEXT NOT NULL DEFAULT 'proposed',   -- proposed|accepted|declined|modified
  date DATE UNIQUE
);
```

**Sorun 1 — `date DATE UNIQUE` ile `status` çelişiyor.** Spec'in en iyi
düzeltmesi §1.3: her karar bir öneridir, kullanıcı reddedebilir. Ama
günde **tek satır** varken `proposed → declined → yeni öneri` aynı güne
sığmıyor. Öneri: `UNIQUE(date, id)` kalksın, `date` üzerinde indeks
kalsın; "günün geçerli kararı" en son `accepted` satırdır.

**Sorun 2 — `executive_decisions → vp_audits` FK yok.** `vp_audits →
raw_events` eklenmiş ama bir üst katman açık kalmış. *"Yönetici karar
üretmez, karar taşır"* diyorsan **taşıdığı şeyin izi durmalı**; yoksa
bir kararı sonradan gerekçelendiremezsin. Öneri: bir ara tablo
(`decision_sources(decision_id, audit_id)`).

**Sorun 3 — `validate()` metni yeniden yazmamalı.** Spec emir kipini
öneri kipine *çevirmeyi* öngörüyor. Sessizce yeniden yazmak anlamı
tersine çevirebilir; bu depodaki kanıtlanmış desen **reddet-ve-düş**
(§1.1).

### 18.6 Güvenlik

- `daemon.py` varsayılan olarak **yalnız `127.0.0.1`**'e bağlanır.
- `Authorization: Bearer <local_token>` zorunlu; `config.json`
  `.gitignore`'da, yanında `config.example.json` durur.
- Telegram: yalnız `config.json`'daki `chat_id` ile eşleşen kullanıcı.
- WhatsApp: **webhook imzası doğrulanmadan istek işlenmez.**
- `hkm.db` SQLCipher ile şifreli; anahtar `config.json`'dan **ayrı** bir
  dosyada.
- **Ham ses dosyası transkripsiyondan sonra silinir**
  (`conversations.audio_retained = 0` varsayılan). Saklanması ayrı bir
  onay ekranı ister.
- Yöneticiye yalnız VP onaylı brifing gider — `test_privacy.py` ile
  denetlenir.

### 18.7 Fazlar

```
1  Çekirdek daemon & API hub    daemon.py, SQLite şeması, bearer token'lı sync
2  Başkan Yardımcıları          vp_academic/bio/intellect.py, thresholds.py
3  Dijital İkiz & Sentez        executive.py, calc.py, office.py
4  Telegram ağ geçidi           bot, komutlar, push
5  WhatsApp & ses               Baileys/Cloud API, yerel Whisper, saklama politikası
6  Tam döngü                    üç arayüze best-effort sync beacon'ı
```

### 18.8 Ve dürüst bir soru

HKM'nin gerçek faydası tek cümle: **"üçünü tek sesle özetlemek."**

O fayda için bir daemon, SQLite, iki bot ve bir VP konseyi gerekiyor mu
— yoksa SPİ'nin ofisine üç satırlık bir çapraz bulgu mu yeter?

AYS+SPİ zaten çalışıyor. ESP ve HKM ikisini daha iyi yapmıyor; sisteme
iki cephe daha açıyor. Bunu yazan ben de spec'i okurken etkilendim, ama
**karar veren ben değilim** — sormadan geçseydim iyi bir devir notu
yazmamış olurdum.

---

# BÖLÜM IV — KAPANIŞ

## 19 · Açık borçlar

| Borç | Nerede | Risk | Not |
|---|---|---|---|
| İçe aktarma geri alınamıyor | ikisi | **yüksek** | §7.4 — tasarımı hazır, kod yazılmadı |
| Depo ölçeklenmesi | `core/store.js` | orta | §7.3 — yaşayan veride göç, sormadan yapma |
| `SPI/screens/labs.js` 1434 satır | — | orta | testi yok; bölmeden önce kapsam ister |
| `AYS/core/office.js` 2049 satır | — | orta | kapsam %59 |
| Ortak CSS kopyaları | üç uygulama | orta | §5.1 — `LifeOs/ortak/` + derleme zamanı birleştirme |
| `palette.js` kapsamı | ikisi | düşük | UI açan işlevler denenmiyor (kasıtlı) |

> **Büyük dosyaları bölmek, testi olan bir hatayı düzeltmekten daha
> risklidir.** Önce kapsam, sonra bölme.

## 20 · Çalışma biçimi

**Ölç, değiştir, tekrar ölç.** "Daha hızlı oldu" bir iddia değil bir
ölçümdür. Depo optimizasyonunda öncesi/sonrası tablosu var; onsuz
konuşulmaz.

**Kalıcılığa dokunmadan önce test yaz.** Verinin kaybolabileceği tek yer
orası.

**Yorum NE yaptığını değil NİÇİN öyle olduğunu anlatır.** Bu depoda
yorumlar uzun ve bu kasıtlı — çoğu bir hatanın mezar taşı. Sildiğinde
hata geri gelir.

**Küçük ve gerekçeli commit.** Commit mesajı *neyin* değiştiğini değil
*neden* değiştiğini anlatır; ölçüm varsa sayıyı taşır.

**Bir hata bulduğunda kardeş uygulamada da ara.**

**Denetleyicini denetle.** Geçtiğinde kaç şey ölçtüğünü söylesin.

## 21 · Son söz

Sistem iyi durumda ve bunu ölçtüm: 1553 test, erişilebilirlik temiz,
paletler AA, beş düzen × iki temada taşma yok, altı CSS dosyası iki
uygulamada birebir aynı.

Ama **henüz gerçek bir gün yaşamadı.** Testler kodu doğrular, kullanım
tasarımı doğrular. Bir hafta gerçekten kullanıldığında çıkacak şeyler
hiçbir denetleyicinin bulamayacağı şeyler olacak: hangi ekranı açmak can
sıkıyor, hangi giriş üç dokunuş fazla, hangi cümle okunmuyor.

**Ne yaparsan yap, o geri bildirimin önüne geçme.**
