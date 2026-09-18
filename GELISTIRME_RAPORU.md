# LifeOS — geliştirme raporu

> **Tarih:** 2026-09-18 · **Kapsam:** dört sistemin tamamı
> **Yöntem:** ölçüm önce, öneri sonra.

Bu rapor `AGENTS.md` §4'ün bulgu tanımına uyar:

```
dosya:satır · ne yanlış · hangi girdide bozulur · nasıl doğrulanır
```

«Şu daha iyi olurdu» buraya girmedi. Her madde ya bir **ölçümle** ya da
deponun kendi belgesinde yazılı bir **sözle** dayanıyor. Ölçemediğim
yerde «göremedim» yazdım.

---

## 0 · Yöntem ve sınırlar

**Ne yaptım.** Depoyu taradım, on dört denetim aracının hangisinin
nerede olduğunu çıkardım, üç uygulamanın CSS'lerini bayt düzeyinde
karşılaştırdım, ESP'yi beş yıllık sentetik veriyle ölçtüm, CI iş
akışının gerçekte ne koşturduğunu okudum ve `NOTLAR.md` §19'daki açık
borçların bugünkü durumunu tek tek doğruladım.

**Ne yapmadım.** Dört sistemin iş mantığını (müfredat eşikleri, klinik
sınırlar, ajan kadrosu) denetlemedim — orası alan bilgisi ister ve bu
raporun konusu değil. Model katmanının maliyet davranışını gerçek bir
sağlayıcıyla denemedim. Türkçe ayrıştırmanın doğruluğunu ölçmedim.

**Yeniden önermediklerim.** `NOTLAR.md` §19 zaten bir borç listesi
tutuyor; oradakileri tekrar «keşfetmedim». Durumlarını §4'te
doğruladım — biri kapanmış, biri büyümüş.

---

## 1 · Sistem bugün nerede

| | AYS | SPİ | ESP | HKM |
|---|---:|---:|---:|---:|
| Kaynak satırı (js+py, dist hariç) | 45 811 | 37 353 | 37 855 | 13 656 |
| Birim testi | 1 174 | 923 | 738 | 312 |
| Denetim aracı | 8 | 11 | 6 | 3 |
| Ofis ekranı çizimi (9 ay) | 40,4 ms / 120 | 20,8 ms / 120 | **66,9 ms / 100** | — |

Toplam **3 147 test** ve on dört ayrı denetim aracı. Bu, bu ölçekteki
çoğu özel projenin üstünde bir disiplin — aşağıdaki bulgular o
disiplinin *uygulanmadığı* yerleri gösteriyor, eksikliğini değil.

---

## 2 · Bulgular

### B1 — CI on dört denetimin ikisini koşuyor · **öncelik: en yüksek**

`.github/workflows/ci.yml:37,40` · CI yalnız `runtests.js` ve
`smoke.js` koşturuyor (artı HKM testleri ve `seviye.py --denetle`).
`a11ycheck`, `layoutcheck`, `palettecheck`, `perfcheck`, `ledgercheck`,
`designcheck`, `loadcheck`, `yuz.js`, `perf.py` ve `entegre.js` **CI'da
hiç koşmuyor**.

**Hangi girdide bozulur:** erişilebilirliği bozan, 390 pikselde taşma
yapan, kontrastı AA'nın altına düşüren ya da çizim bütçesini aşan bir
değişiklik CI'dan **yeşil** geçer. Bu oturumda tam olarak bu oldu:
seviye paneli eklendikten sonra düzen ve erişilebilirlik denetimleri
kırmızıya döndü, ama onları elle koşturmasaydım fark edilmeyecekti.

**Nasıl doğrulanır:** `.github/workflows/ci.yml` içinde `run:`
satırlarını say — dört tane.

**Öneri:** var olan `matrix.system` işine denetimleri ekle. Üçü paralel
koştuğu için toplam süre bir sistemin kendi denetimleri kadar (~4-5 dk).
Ağır olanları (`loadcheck`) haftalık zamanlanmış bir işe ayır.

---

### B2 — Beş yıllık yük denetimi üç sistemin yalnız birinde · **yüksek**

`SPI/tools/loadcheck.js` var; `AYS/tools/` ve `ESP/tools/` altında
yok. Üstelik `tools/sayilar.py:37`'deki `TAM` listesinde de yok — yani
SPİ'de bile rutin koşumda çalışmıyor.

Bu aracın var olma sebebi belgede yazılı: *«ofis ekranının bir çizimi
beş yıllık veriyle 996 ms sürüyordu, boş veriyle 60 ms»*. Diğer
koşumlar sekiz ölçümle çalışıyor ve bu bir kör nokta yaratmıştı.
`README.md:186` ise şunu vaat ediyor: *«Bir denetim bir sistemde bir
hata bulduysa, aynı denetim ötekilere de taşınır.»* Taşınmamış.

**Ölçtüm.** ESP'yi beş yıllık hacimle (10 050 kart, 2 680 not, 2 010
olay, 1 825 gün, 268 taslak) çizdirdim:

| ekran | 5 yıl | eşik |
|---|---:|---:|
| office | 210,3 ms | 400 |
| team | 142,8 ms | 400 |
| lang | 87,5 ms | 400 |
| **toplam** | **775 ms** | 3 500 |

**ESP bugün geçiyor** — alarm yok. Ama 9 aydan 5 yıla giderken ofis
ekranı 66,9 → 210,3 ms'ye çıkıyor (3,1 kat) ve bunu izleyen hiçbir şey
yok. AYS hiç ölçülmedi; en büyük dosyası `AYS/src/js/core/office.js`
2 049 satır.

**Öneri:** `loadcheck.js`'i AYS ve ESP'ye taşı, `TAM` listesine ekle.
Bu bir düzeltme değil bir **nöbetçi**: bugün geçen bir şeyin yarın
geçmeye devam ettiğini söyleyen tek şey.

---

### B3 — 4 365 satır birebir aynı CSS, koruyan hiçbir şey yok · **yüksek**

Üç uygulamanın şu dosyaları **bayt düzeyinde aynı**:

| dosya | satır | kopya | toplam |
|---|---:|---:|---:|
| `base.css` | 219 | ×3 | 657 |
| `layout.css` | 671 | ×3 | 2 013 |
| `designs.css` | 565 | ×3 | 1 695 |
| | | | **4 365** |

(`tokens.css`, `components.css`, `palettes.css` küçük farklar taşıyor —
onlar kasıtlı, sisteme özel değerler.)

**Hangi girdide bozulur:** birinde yapılan bir düzeltme diğer ikisinde
unutulur ve fark ancak iki ekran yan yana konunca görülür. `NOTLAR.md`
§19 bunu zaten bir borç olarak sayıyor ve çözümünü de yazıyor:
*«`LifeOs/ortak/` + derleme zamanı birleştirme»*.

**Neden şimdi:** o mekanizma artık **var ve çalışıyor.** Bu oturumda
`tools/seviye.py` yazıldı; dokuz dosyayı tek kaynaktan üç uygulamaya
yayıyor, `--denetle` ayrışmayı yakalıyor ve CI'da koşuyor. Elle
kurcalayıp kırmızıya döndüğünü doğruladım. Aynı mekanizmayı CSS'e
genişletmek yeni bir icat değil, var olanı bir dizin daha kapsatmak.

**Nasıl doğrulanır:** `diff AYS/src/css/layout.css ESP/src/css/layout.css`
— çıktı boş.

---

### B4 — Telefon her yerde hedefleniyor, telefona giden yol yok · **yüksek (ürün kararı)**

Depo telefonu ciddiye alıyor: her sistemde 390 piksel düzen denetimi,
PWA kurulum manifesti (`app.js` → `installManifest`), `apple-mobile-web-app-capable`
etiketleri, «telefonda alt gezinme» için ayrı bir bileşen. Ama:

- `sunucu.py:51` → `HOST = "127.0.0.1"`. Dışarı açmak bilinçli olarak
  reddedilmiş (ve bu doğru bir varsayılan).
- `README.md`'de telefonda çalıştırmanın **belgeli bir yolu yok**.
- Verinin telefona nasıl gideceği de yazılı değil.

**Hangi girdide bozulur:** kullanıcı «bunu telefonumda kullanayım»
dediği an. Bugün cevap: ya elle yedek taşıyacak ya da dist dosyasını
telefona kopyalayacak — ikisi de belgesiz.

**Öneri:** karar senin. Üç seçenek, üçü de küçük:
1. `baslat.py --ag` bayrağı: `0.0.0.0`'a bağlan, ekrana QR + uyarı bas.
   Açıkça istenmedikçe kapalı kalır.
2. `dist/*.html` dosyasını telefona kopyala + yedek dosyasıyla veri taşı.
   Sıfır altyapı, ama iki cihaz iki ayrı defter demek (bkz. B5).
3. Telefonu hiç hedefleme ve 390 piksel denetimlerini «dar pencere»
   olarak yeniden adlandır.

Üçünden biri seçilmeli; bugünkü hâl «hedefliyoruz ama yolu yok».

---

### B5 — Cihazlar arası senkron yalnız Artifact çalışma zamanında var · **orta**

`ESP/src/js/core/store.js:154` · Bulut yolu `window.claude.use('db')`
ile açılıyor. Bu nesne yalnız uygulama **Claude Artifact olarak
yayımlandığında** var. Belgelenen çalıştırma yolu (`python3 baslat.py`,
localhost) bu nesneyi asla sağlamaz — yani yerel kullanımda mod her
zaman `local`.

**Hangi girdide bozulur:** dizüstünde SPİ'ye ölçüm girip telefonda
bakmak isteyen kullanıcı iki ayrı veri kümesiyle karşılaşır. Kod bunu
doğru yapıyor (sessizce yerelde çalışıyor, hata vermiyor); eksik olan
**bu sonucun yazılı olmaması**.

**Öneri:** ya README'ye tek cümle («yerel kullanımda veri cihaza
bağlıdır; cihazlar arası tek köprü yedek dosyasıdır»), ya da B4 ile
birlikte gerçek bir cevap.

---

### B6 — Açık borçların bugünkü durumu · **bilgi**

`NOTLAR.md` §19'u tek tek doğruladım:

| Borç | Durum |
|---|---|
| İçe aktarma geri alınamıyor | **kapandı** — `store.js` içinde `undoImport` üç sistemde de var |
| `SPI/screens/labs.js` 1434 satır | **büyümüş: 1 482** — hâlâ testsiz |
| `AYS/core/office.js` 2 049 satır | değişmemiş |
| Ortak CSS kopyaları | açık — bkz. B3 |
| Depo ölçeklenmesi | açık |
| `palette.js` kapsamı | açık (kasıtlı) |

§19 kendi uyarısını taşıyor ve katılıyorum: *«Büyük dosyaları bölmek,
testi olan bir hatayı düzeltmekten daha risklidir. Önce kapsam, sonra
bölme.»* `labs.js` büyüdüğü hâlde hâlâ testsiz olması, o uyarının
gerçekleşmekte olduğunu gösteriyor.

---

### B7 — Seviye sistemi: bir sonraki adımlar · **düşük**

Sistem bu oturumda kuruldu, bağlandı ve oturdu. Kalan üç şey:

1. **Rozet ve video dosyaları** — `brand/seviye/kademe-1..6.png` ve
   `kademe-2..6.mp4` yok. Kod hazır: dosya yoksa numaraya ve banner'a
   düşüyor. Bu bir kod işi değil, bir dosya işi.
2. **HKM brifinginde seviye satırı yok** — kademe yalnız *Sistemler*
   sayfasında görünüyor, günlük brifingde değil. Küçük bir ekleme.
3. **XP'nin dokuz aylık davranışı ölçülmedi** — defterin 120 günlük
   kırılımı ve arşiv çıkarması testliyken, gerçek bir yılın sonunda
   defterin kaç bayt ettiğini kimse ölçmedi.

---

## 3 · Ne YAPMAYALIM

Bunlar bilinçli olarak önerilmiyor:

- **Büyük dosyaları şimdi bölmek.** `NOTLAR.md` §19'un kendi uyarısı.
  Önce kapsam.
- **XP'ye ödül döngüsü eklemek.** Seri sayacı tatile çıkanı
  cezalandırır ve dokuz aylık ufukla çelişir; sıralama tek kullanıcılı
  bir sistemde anlamsız; «geride kaldın» uyarısı XP'nin karar vermemesi
  kuralını kırar.
- **Beşinci bir sistem eklemek.** Dördü de daha dolmadı.
- **Çerçeve/paket getirmek.** `AGENTS.md` §1.3 sözleşme.
- **CSS'i «ortak» yapmak için üç uygulamayı tek kökene toplamak.**
  `sunucu.py`'nin baş yorumu bunun neden veri kaybı gibi görüneceğini
  anlatıyor; paylaşım **derleme zamanında** olmalı, çalışma zamanında
  değil.

---

## 4 · Önerilen sıra

Üç tur, her biri kendi başına bitmiş bir iş.

### Tur 1 — nöbetçileri yerine koy *(yarım gün)*

| İş | Bulgu | Neden önce |
|---|---|---|
| CI'a bütün denetimleri ekle | B1 | Diğer her şeyin güvencesi bu |
| `loadcheck.js`'i AYS ve ESP'ye taşı, `TAM`'a ekle | B2 | Ölçülmeyen şey bozulur |

Bu turdan sonra: bir değişiklik erişilebilirliği, düzeni, kontrastı ya
da bütçeyi bozarsa **birleştirmeden önce** görülür.

### Tur 2 — tekrarı bitir *(bir gün)*

| İş | Bulgu |
|---|---|
| `brand/ortak/` kur, üç CSS dosyasını oraya taşı | B3 |
| `tools/ortak.py` (ya da `seviye.py`'yi genelleştir) ile yay + `--denetle` | B3 |
| CI'a ayrışma denetimi ekle | B3 |

Ölçüt: `diff` ile doğrulanan 4 365 satırlık tekrar, tek kaynağa iner ve
ayrışması otomatik yakalanır.

### Tur 3 — telefon sorusunu cevapla *(karara bağlı)*

| İş | Bulgu |
|---|---|
| B4'teki üç seçenekten birini seç | B4 |
| Seçimin sonucunu README'ye yaz (veri nerede durur) | B5 |

---

## 5 · Sana ait sorular

Bunları ben karara bağlayamam:

1. **Bu sistemi telefonda kullanacak mısın?** Cevap «evet»se B4 birinci
   önceliğe çıkar ve B5 onun parçası olur.
2. **Kaç cihaz?** Tek cihazsa B5 bir cümlelik belge işi; iki cihazsa
   gerçek bir senkron kararı.
3. **Seviye rozetleri ve videoları ne zaman gelecek?** Kod bekliyor,
   eksik dosya hata vermiyor — ama sistem o dosyalar gelene kadar yarım
   görünür.

---

## 6 · Kapanış

Bu deponun sorunu eksik disiplin değil; **var olan disiplinin bazı
yerlerde uygulanmaması**. On dört denetim aracı yazılmış, ikisi
otomatik koşuyor. Beş yıllık yük denetimi yazılmış, bir sistemde
duruyor. Ortak CSS'in tek kaynaktan yayılması gerektiği yazılmış,
mekanizması bu hafta kurulmuş ama CSS'e uygulanmamış.

Üç turun tamamı yeni bir özellik getirmiyor. Getirdikleri şey şu: bugün
doğru olan şeylerin **yarın da doğru kalacağının güvencesi**.
