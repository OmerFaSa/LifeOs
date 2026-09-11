# SPİ — Derin denetim ve geliştirme raporu

Tarih: 11 Eylül 2026 · Derleme: `f6a6b40` · 51 commit

`DURUM.md` planların durumunu söyler. Bu belge **sistemi kazır**: kaynağı
sayar, uygulamayı yükler, düşmanca girdi verir, depoyu bozar, ekranı
çökertir ve ne olduğunu yazar.

Yedi denetim koşuldu; hepsi bu oturumda yazıldı ve `/.tmpaudit` altında
tek kullanımlıktı. Kalıcı olması gerekenler §8'de.

---

## 0. Özet — sekiz bulgu

| # | Bulgu | Ağırlık | Durum |
|---|---|---|---|
| **A1** | Depoda tek anahtar: her okuma/yazma TÜM veritabanını çözüp yeniden kuruyor. Tek kayıt 0,04 ms → **23 ms** | Ağır | açık |
| **A2** | Kural motorları tek çizimde defalarca çağrılıyordu; ofis **996 ms** | Ağır | **kapandı** |
| **A3** | `llm.js` + `quota.js` = 1.017 satır, **sıfır test** | Orta | açık |
| **A4** | Kabuk çökerse hata paneli üretilip atılıyordu — sessiz çökme | Orta | **kapandı** |
| **A5** | Yönlendirmede odak ve duyuru yok; ekran okuyucu sessiz kalıyor | Orta | açık |
| **A6** | Alt sayfa açıkken arka plan `inert` değil | Orta | **kapandı** |
| **A7** | 58 ölçümün **42'sinin** besin bağı yok — Kerem→Nesrin devri 16 ölçümle sınırlı | Orta | açık |
| **A8** | Yayımlanan raporda üç sayı **sayılmamış**, devralınmıştı | Hafif | **kapandı** |

Beşi bu oturumda kapandı; ayrıca iki kalıcı denetim koşumu eklendi.
Kalan üçünün sırası §9'da.

---

## 1. Yöntem

Hiçbir sayı tahmin değildir; her biri aşağıdaki koşumlardan birinden
çıktı.

| Koşum | Ne yaptı |
|---|---|
| `a11y` | 12 ekranı gezip adsız düğme, etiketsiz alan, başlık atlaması, 24 px altı dokunma hedefi, `alt`sız görsel, pozitif `tabindex` aradı |
| `a11y2` | İlk altı Tab durağını, yer imlerini, kipli pencereyi, odak halkasını ölçtü |
| `load` | Beş yıllık veri üretip yazdı, on iki ekranı çizdi, on kural motoru fonksiyonunu ölçtü |
| `count` | Motor fonksiyonlarını sayaçla sarıp tek çizimde kaç kez çağrıldıklarını saydı |
| `robust` | Düşmanca metin, bozuk depo, kapalı `localStorage`, çöken ekran |
| `store` | Depo dolarken tek bir kaydın maliyetini beş noktada ölçtü |
| `env` | Çalışma zamanından envanter saydı |

---

## 2. Doğrulanmış envanter

Önceki raporda üç sayı yanlıştı. Aşağıdakiler **çalışan uygulamadan**
sayıldı, kaynaktan göz kararı değil.

| Ölçü | Gerçek | Önceki raporda |
|---|---|---|
| Gıda | **61** | 79 ✗ |
| Besin öğesi | **15** | 24 ✗ |
| Hareket | **12** (40 basamak) | 77 ✗ |
| Biyobelirteç | 58 | 58 ✓ |
| Türetilmiş indeks | 11 | 11 ✓ |
| Panel | 12 | 12 ✓ |
| Örüntü | 8 | 8 ✓ |
| İlaç/takviye | 18 | 18 ✓ |
| Semptom | 18 | 18 ✓ |
| Palet · düzen · ipucu | 7 · 5 · 31 | ✓ |
| JS modülü | 51 · 17.871 satır | ✓ |
| Test | **512** | ✓ |

Üç yanlış sayı da bir önceki rapordan **devralınmıştı**: yeniden
sayılmadan taşındı. Bu, raporun kendi yöntem kuralını çiğnemesidir ve
düzeltildi.

---

## 3. A1 · Depo katmanı — sistemin tek gerçek ölçekleme sorunu

### Bulgu

Bütün veritabanı `localStorage`'ta **tek bir anahtarda** duruyor
(`spi.v1.<profil>`). `store.js` içindeki üç fonksiyon bunu şöyle kullanır:

```js
function lGet(path){ const all = localAll(); return all[path]; }
function lSet(path, data){ const all = localAll(); all[path] = data; return localWrite(all); }
function lList(prefix){ const all = localAll(); /* … */ }
```

`localAll()` her çağrıldığında **tüm veritabanını `JSON.parse` eder**;
`localWrite()` **tümünü `JSON.stringify` eder**. Yani bir günün uyku
saatini kaydetmek, beş yıllık verinin tamamını çözüp yeniden kurar.

### Ölçüm

Depo beş noktada dolduruldu, her noktada tek bir kayıt/okuma beş kez
ölçülüp ortalandı:

| Veri | Depo | Tek yazma | Tek okuma | `list('meals')` |
|---|---|---|---|---|
| boş | 0 | 0,04 ms | 0,02 ms | 0 ms |
| 6 ay | 137 KB | 1,68 ms | 0,80 ms | 1,43 ms |
| 1 yıl | 279 KB | 3,36 ms | 1,54 ms | 2,17 ms |
| 3 yıl | 838 KB | **23,92 ms** | 6,08 ms | 6,10 ms |
| 5 yıl | 1.399 KB | **23,12 ms** | 6,96 ms | 8,87 ms |

Tek bir ölçüm kaydetmek **575 kat** yavaşlıyor. Artış doğrusal da değil:
279 KB ile 838 KB arasında maliyet yedi katına çıkıyor.

Daha kötüsü: bir ekran çizimi onlarca `get`/`list` çağırır ve
`saveVitals` ayrıca `refreshFlags()` çalıştırır. Beş yıllık bir kullanıcı
için «kaydet»e basmak ile ekranın tazelenmesi arasında yüzlerce
milisaniye birikir.

Bir yan gözlem: denetim koşumunda depoyu 1.825 gün boyunca **tek tek**
doldurmaya çalışınca sekme çöktü. Uygulama bunu asla yapmaz (günde bir
kayıt yazar) ama **yedek geri yükleme** tam olarak bu şekli alır.

### Önerilen çözüm — üç adım, artan maliyet

1. **Bellekte ayna** (en ucuz, en çok kazandıran). `localAll()` açılışta
   bir kez çözülür ve bellekte tutulur; `lGet`/`lList` aynadan okur.
   Okuma **O(1)**'e iner, yazma hâlâ tam `stringify` yapar.
2. **Yazmayı geciktir.** Ardışık yazmalar tek `stringify`'da toplanır
   (≈250 ms pencere). Sayfa kapanırken `visibilitychange` ile boşaltılır.
   Bir öğün girişi altı ayrı yazma yerine bir yazma olur.
3. **Öneke göre böl.** `spi.v1.ben.vitals`, `.meals`, `.labs`… Bir vital
   kaydı yalnız vital dilimini yeniden kurar. Şema sürümü ve göç yolu
   gerektirir; ilk ikisi yetmezse yapılır.

**Uyarı:** burası verinin kaybolabileceği tek yerdir. Bu yüzden bu
oturumda **yapılmadı** — ayrı bir iş olarak, kendi testleriyle
yapılmalıdır. Gereken testler: açılışta ayna doğru kuruluyor mu, yazma
geciktirilirken okuma taze değeri görüyor mu, sayfa kapanırken bekleyen
yazma boşalıyor mu, kota dolduğunda ayna ile depo ayrışıyor mu.

---

## 4. A2 · Kare önbelleği — **kapandı**

### Bulgu

Beş yıllık veriyle ofis ekranının bir çizimi **996 ms** sürüyordu. Sebep
ağır bir fonksiyon değildi. Sayaç şunu gösterdi — tek çizimde:

| Fonksiyon | Çağrı |
|---|---|
| `Bio.attention()` | 12 |
| `Bio.overdue()` | 11 |
| `Calc.crossFindings()` | 9 |
| `Office.notes()` | 9 |
| `Office.brief()` | 5 |
| `Office.ruleText()` | 5 |

Her masa kendi notunu süzmek için notların **tamamını** üretiyor, patron
brifingi çapraz bulguları yeniden hesaplıyor, başlık/istatistik/alt
başlık üçlüsü aynı şeyi bir kez daha istiyordu.

Bu boş veriyle görünmez: denetim koşumları sekiz ölçümle çalışıyor.

### Çözüm

`core/memo.js` — **kare önbelleği**. Çizim başlarken açılır, biterken
kapanır ve boşalır. Kare dışında hiçbir şey saklamaz.

Sınırı bilerek dar tutuldu. Kalıcı bir önbellek «durum değişti mi?»
sorusunu sormak zorundadır; o soru yanlış cevaplanırsa sistem **eski
sayıyı** gösterir. Bu sistemde bir sayının yanlış olması, geç
gelmesinden çok daha kötüdür. Kare içinde böyle bir soru yoktur: veri
kare içinde değişmez.

Yedi fonksiyon sarıldı. Hepsinde **argümanlı çağrı önbelleğe girmez** —
başka bir profille sorulduğunda taze hesaplanır.

### Ölçülen sonuç

| Ekran | Önce | Sonra |
|---|---|---|
| Ofis | 996 ms | **261 ms** |
| Testler | 302 ms | 216 ms |
| On iki ekran toplamı | 2,9 s | **2,0 s** |

---

## 5. A3 · Model yolu test edilmiyor

`core/llm.js` (737 satır) ve `core/quota.js` (280 satır) — **1.017 satır,
sıfır test**. Testlerde `SP.LLM` ya da `SP.Quota` geçen tek bir satır yok.

Kod kötü değil; tersine sistemin en savunmacı yeri. Yedi ayrı hata kodu
(`unauthorized`, `no_credit`, `bad_model`, `timeout`, `rate_limited`,
`offline`, `empty`), `AbortController` ile zaman aşımı, `retry-after`
başlığı okuma, yeniden denenebilir/sürdürülebilir ayrımı, akış
ayrıştırma, cümle ortasında kesilen yanıtı toparlama.

Sorun şu: **hiçbiri doğrulanmıyor.** `networkCode()` içindeki bir durum
kodunun yanlış eşlenmesi, `errorText()` içindeki bir anahtarın silinmesi
ya da `RETRYABLE` listesinden bir kodun düşmesi sessizce geçer. Bu
fonksiyonlar saf — ağ gerektirmiyorlar, doğrudan çağrılabilirler.

**Yazılması gereken testler (≈25):** durum kodu → hata kodu eşlemesi;
her hata kodunun kullanıcıya dönük bir metni var mı; `retryable` ve
`resumable` listeleri; `truncated` tespiti; `trimToSentence` cümle
sınırı; `joinContinuation` örtüşen parçaları birleştirme;
`dropLastWord`; anahtar maskeleme (anahtar ekranda tam görünmemeli);
kota penceresi ve sıfırlama.

Ayrıca `store.js` yalnızca sahte depo üzerinden dolaylı test ediliyor:
gerçek düşüş yolu (bulut → yerel), kota hatası ve bozuk JSON kurtarma
hiç çalıştırılmıyor. §7'deki dayanıklılık koşumu bunların **çalıştığını**
gösterdi ama test olarak kayıtlı değiller — yarın bozulursa kimse
söylemez.

---

## 6. Erişilebilirlik — beklenenden iyi, dört gerçek eksik

`DURUM.md` bunu «ham» diye işaretlemişti. Denetim koşunca tablo tersine
döndü: yapı sağlam.

**Sorunsuz çıkanlar:** atlama bağlantısı (ilk Tab durağı «İçeriğe atla»),
`lang="tr"`, `main`/`nav`/`footer` yer imleri, adsız düğme yok, başlık
sırası atlaması yok, `alt`sız görsel yok, pozitif `tabindex` yok,
klavyeyle ulaşılamayan tıklanabilir öge yok, odak halkası 2 px belirgin,
dokuz `prefers-reduced-motion` kuralı, alt sayfada `role="dialog"` ve
(bu oturumda eklenen) odak tuzağı.

**A5 · Yönlendirmede odak ve duyuru yok.** Tek sayfalık bir uygulamada
bölüm değiştirince ekran okuyucu **hiçbir şey söylemiyor**: odak `BODY`
üzerinde kalıyor, canlı bölgeye de yazılmıyor. `<main tabindex="-1">`
zaten var ama `go()` ona odaklanmıyor. Gören kullanıcı için ekran
değişti; görmeyen için hiçbir şey olmadı. *En ağır erişilebilirlik
eksiği budur.*
→ `go()` içinde `#main`'e odaklan ve ekranın başlığını `aria-live`
bölgesine yaz.

**A6 · Alt sayfa arkayı gizlemiyordu — kapandı.** Odak hapsedilmişti ama
`.site` üzerinde `inert` yoktu: ekran okuyucunun sanal imleci alt sayfayı
hiç görmeden arka plandaki tabloyu okumaya devam edebiliyordu. Odağı
hapsetmek yalnızca klavyeyi durdurur.

Bir incelik çıktı: kabuk her çizimde yeniden kuruluyor, yani açık bir alt
sayfa varken gelen bir yeniden çizim `inert`i düşürüyordu. Çizimden sonra
geri konuyor.

**A9 · 24 px altı dokunma hedefi** (WCAG 2.2 AA «Target Size»):

| Öge | Ölçü | Nerede |
|---|---|---|
| `.hint` (ⓘ düğmesi) | 16×16 | 9 ekran |
| `.sitefoot__reload` | 50×17 | 12 ekran |
| Bir onay kutusu | 15×15 | Günlük |

→ Görsel boyut korunarak `::after` ile 24×24 dokunma alanı genişletilir.

**A10 · Etiketsiz tek alan:** `select#meal-slot` (Öğünler ekranı).
→ `aria-label`.

---

## 7. Dayanıklılık — dördü de geçti

| Sınama | Sonuç |
|---|---|
| Düşmanca metin (`<img onerror>`, `<script>`) profil adına, tahlil adına, karar başlığına, gıda adına yazılıp 12 ekran gezildi | **Tetiklenmedi.** Metin kaçışlı görünüyor, enjekte `img` yok, `alert` yok |
| `localStorage`'a bozuk JSON yazıp yeniden açma | **Açıldı.** Ekran boş değil, sayfa hatası yok |
| `localStorage` tamamen kapalı (gizli kip) | **Açıldı** ve kullanıcıya depolama uyarısı gösterdi |
| Bir ekranın `render`'ı bilerek çökertildi | **Kabuk ayakta**, hata paneli çizildi, diğer ekranlar açılmaya devam etti |

`raw()` 86 yerde geçiyor ama hiçbirine kullanıcı verisi girmiyor: ikon
markup'ı, ipucu markup'ı, `selected`/`checked` öznitelikleri. Yedi
`innerHTML` kullanımının hepsi ya `U.esc` ya etiketli şablondan geçiyor.

**A4 · Bulunan tek gerçek hata — kapandı.** `doRender`'ın dış
yakalayıcısı hata panelini **üretip atıyordu**: değişken kuruluyor, DOM'a
hiç yazılmıyordu. Kabuk çizilemezse kullanıcı bir bölüme basıp eski
ekranda kalacak ve hiçbir şey görmeyecekti. Sessiz çökme, en kötü
çökmedir. Düzeltildi.

---

## 8. Ölü kod ve veri boşlukları

**Çağrılmayan dışa açılanlar (doğrulanmış):** `C.Chip`, `C.NextUp`,
`C.Toolbar`, `C.Grid`, `C.SectionTitle`, `LLM.getKey`, `LLM.setKey`,
`Bio.needsFasting`, `LLM.inSandbox`, `Meds.changedBetween`.

`getKey`/`setKey`, çoklu anahtar desteği gelince `getKeys`/`addKey`'in
gölgesinde kaldı. Beş bileşen hiç kullanılmadı. Toplam ≈120 satır.
Silmek serbest; ama `Chip` ve `Toolbar` ileride lazım olursa yeniden
yazmak yerine durmaları da savunulabilir — karar, sözlüğün *sözlük* mü
yoksa *kullanılanlar listesi* mi olduğuna bağlı.

**A7 · Besin bağı olmayan ölçümler.** 58 biyobelirtecin **42'sinde**
`nutrients` alanı boş. Kerem→Nesrin devri yalnız 16 ölçüm üzerinden
çalışabiliyor; ferritin, D vitamini ve B12 kapsanıyor ama çinko,
magnezyum, potasyum, selenyum gibi besinle doğrudan ilişkili birçok
ölçüm kapsanmıyor. Bu bir hata değil **veri boşluğu**: her ölçüm için
«hangi besin öğesi bunu belirler» satırı yazılmalı.

**Kırmızı bayrak eşiği:** 58 ölçümün 45'inde var, 13'ünde yok. Eşiksiz
bir ölçüm asla bayrak üretmez — bu bilinçli olabilir (bazı ölçümlerin
tek başına acil eşiği yoktur) ama **hangisinin bilinçli olduğu yazılı
değil**. Bir `redYok:'gerekçe'` alanı bunu belgelerdi.

**İpucu sözlüğü:** 31 anahtarın 31'i kullanılıyor. Temiz.

---

## 9. Sıradaki iş — önerilen sıra

| Sıra | İş | Neden bu sırada |
|---|---|---|
| **1** | **A1 · Depo ayna + geciktirilmiş yazma** | Tek gerçek ölçekleme sorunu; kullanıcı veriyi biriktirdikçe kötüleşiyor ve fark edilmesi en zor olan yavaşlama bu |
| **2** | **A5 + A9 + A10 · Erişilebilirlik kalanı** | Üçü küçük; `a11ycheck` izin listesi boşaldığında bu satır kapanır |
| **3** | **A3 · `llm.js` ve `quota.js` testleri** | Saf fonksiyonlar, ağ gerektirmiyor; ≈25 test bir oturumda yazılır |
| **4** | **B1 · `labs.js` bölünmesi** (1.434 satır) | Önce a11y koşumu olsun ki bölme neyi bozduğunu söyleyebilsin |
| **5** | **A7 · Besin bağı tamamlama** | Devir motorunun kapsamını 16'dan 58'e çıkarır; saf veri işi |
| **6** | **B3 · `core/office.js` bölünmesi** (816 satır) | Brifing üretimi ile devir motoru ayrışmalı |
| **7** | Ölü kod temizliği (≈120 satır) | Riski sıfır, aciliyeti de |

**Kalıcı denetim koşumu olarak eklendi — artık sekiz araç var:**

- `tools/a11ycheck.js` · adsız düğme, etiketsiz alan, başlık atlaması,
  24 px altı dokunma hedefi, `alt`sız görsel, pozitif `tabindex`,
  klavyeyle ulaşılamayan öge, yer imleri, atlama bağlantısının ilk durak
  olması, alt sayfa kipliliği. Bilinen ve kabul edilen eksikler `IZIN`
  listesinde **gerekçesiyle** durur — bir bahane defteri değil, borç
  defteri. Bugün dört kayıt var (§6'daki A9 ve A10).
- `tools/loadcheck.js` · beş yıllık veri üretip on iki ekranı çizer.
  Eşik ekran başına 400 ms, toplam 3.500 ms. Bugünkü sonuç: en yavaş
  ekran 216 ms, toplam 1.519 ms.

İkisi de bu denetimde bulunan hataları **yeniden bulabilir**; kalıcı
olmasalardı aynı hatalar sessizce geri gelirdi.

---

## 10. Değişmeyecekler

Bu denetim doktrini sınadı, değiştirmedi. Aşağıdakiler hâlâ geçerli ve
kodda karşılığı var:

- Kural motoru otoritedir; model yeniden yazar, yerine geçmez.
- Eksik veri sıfır sayılmaz. *(İncelendi: `nutri.js` içinde
  `(f.sat || 0)` ve `(f.fib || 0)` yazan iki satır var — eksik alanı
  sıfır sayacak bir yol. Tablo sayıldı: 61 gıdanın **hepsinde** iki
  alan da dolu, yani yol bugün hiç çalışmıyor. Yine de mikro
  besinlerde bir `unknown` sayacı varken makrolarda yok; kullanıcı
  kendi gıdasını eksik girerse fark ortaya çıkar. Kayıtlara geçti.)*
- Tahmin ölçüm gibi gösterilmez; ölçülen türetilene üstün gelir.
- Durum renkleri bölüme, palete ve düzene göre değişmez.
- Model kapalıyken uygulama çalışır.
- Teşhis ve doz yok.
