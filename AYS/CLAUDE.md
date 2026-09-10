# AYS — Akademik Yardımcı Sistem

Bu dosya, projeye yeni oturan bir geliştirici (ya da Claude oturumu) için
yazıldı. Amaç kodu satır satır anlatmak değil; **neden böyle kurulduğunu**
anlatmak, çünkü buradaki kararların çoğu keyfi değil, bir sorunun cevabı.

---

## 0. Kapsam sınırı — önce bunu oku

Bu depo (`LifeOs`) **iki ayrı projeyi** yan yana tutar:

| Klasör | Ne | Kim bakar |
|---|---|---|
| `AYS/` | Akademik Yardımcı Sistem — YKS çalışma uygulaması | bu oturum |
| `SPI/` | Sağlık Performans İzleyici | **başka bir oturum** |

`SPI/` klasörüne dokunma. Ayrı bir oturum orayı yönetiyor; oradaki bir
dosyayı değiştirmek onun işini ezer. İkisi aynı kod tabanından çatallandı,
o yüzden dosya adları birbirine benzer — yol adını her seferinde kontrol et.

Kök dizindeki `README.md` ve `.gitignore` ortaktır; oralarda bir değişiklik
gerekiyorsa önce kullanıcıya sor.

---

## 1. Uygulamanın tek cümlelik tarifi

YKS'ye hazırlanan bir öğrencinin **müfredat takibi, deneme ölçümü, tekrar
planı ve soru çözümü** tek yerde toplandığı, tarayıcıda çalışan, sunucusuz
bir uygulama. Üstüne, kullanıcının verisini yorumlayan altı kişilik bir
"AI ofisi" oturtulmuş.

---

## 2. Değişmez kural: sıfır bağımlılık

Uygulamanın çalışma zamanında **hiçbir paketi yoktur**. Framework yok,
derleme adımı yok, `node_modules` uygulamaya girmez.

- Saf JavaScript, saf CSS, tek `index.html`
- `package.json`'daki tek bağımlılık `playwright` ve o **yalnızca testleri
  başsız koşturmak için** var — uygulama onu hiç görmez
- `python build.py` her şeyi tek dosyaya gömer → `dist/rota.html`.
  O dosya indirilip çift tıklanınca çalışır, kurulum istemez.

Bir kütüphane eklemek istediğinde: **ekleme.** Bu kural ürünün taşınabilir
olmasının tek sebebi. Gerçekten gerekiyorsa önce kullanıcıya sor.

---

## 3. Mimari

### Modül kalıbı

Her dosya aynı iskeleti kullanır — global bir `R` isim alanına IIFE ile
yazar:

```js
window.R = window.R || {};

R.U = (function(){
  function iso(d){ … }
  return { iso, … };   // yalnız dışarıya lazım olanlar
})();
```

`import`/`export` yok, bundler yok. Bağımlılık **yükleme sırasıyla**
çözülür: `src/index.html` içindeki 57 `<script>` etiketi sırayla okunur.
Yeni bir modül eklediğinde onu `index.html`'e **kendisinden önce gelmesi
gereken modüllerden sonra** yazmayı unutma.

### Klasörler

```
src/
├── index.html          57 script etiketi — yükleme sırası burada
├── css/         (5)    tokens · base · layout · components · palettes
├── js/data/     (14)   sabit veri ve istem metinleri (müfredat, ajanlar…)
├── js/core/     (23)   mantık: hesap, depolama, kural motoru, LLM taşıma
├── js/screens/  (19)   ekranlar
└── tests/       (17)   tarayıcıda koşan test paketi
```

Ayrım basit: `data/` **bilgi** tutar (değişmez tablolar, istem metinleri),
`core/` **karar** verir, `screens/` yalnız **gösterir**.

### Ekran sözleşmesi

Her ekran şu nesneyi döndürür:

```js
R.Screens.today = {
  id, title, subtitle(),
  render(),        // tek bir C.Grid döndürür
  afterRender(),   // DOM'a ihtiyaç duyan işler
  handle: { … },   // data-act eşlemesi
  change: { … },   // data-change eşlemesi
};
```

**Etkileşim yalnız `data-act` / `data-change` ile bağlanır.** Inline
`onclick` yok, ekrana `addEventListener` yok — olaylar tek bir yerden
devredilir. Bu kuralı bozan bir ekran testten geçmez.

### Veri

Tek `localStorage` anahtarı: `rota84285.v2` (profil başına
`rota84285.v2.<profil>`). `core/store.js` önce Artifact "db" yeteneğini
dener, yoksa `localStorage`'a düşer. Ekranlar depoya doğrudan dokunmaz;
`core/state.js` üzerinden geçer.

---

## 4. Doktrin: kural motoru otoritedir

Bu, projenin en önemli tasarım kararı. Uygulamada dil modelleri var ama
**hiçbiri sayı hesaplamaz.**

- Bütün ölçümler (netler, oranlar, sıra tahmini, tekrar zamanı) `core/`
  içindeki kural motorundan çıkar
- Modele giden şey bir **brifingdir**: kural motorunun ürettiği, doğrulanmış
  sayılar
- Modelin işi o brifingi **yorumlamak** — üretmek değil
- Modelden dönen her yapısal çıktı geri doğrulanır (kapalı konu kataloğu,
  kapalı zorluk ölçeği); eşleşmeyen değer **bağlanmaz**, ham hâliyle
  saklanır

Sebebi acı deneyim: model serbest bırakıldığında sayı uyduruyor, üstelik
kendinden emin bir tonla. Kural motoru otorite olunca en kötü ihtimalle
"yorum kötü" olur, "veri yanlış" olmaz.

Aynı mantığın soru çözümündeki hâli: **model çözer, ayrı bir tur doğrular.**
Modele kendi çözümünü kontrol ettirmek işe yaramaz — kendi hatasını onaylar.
Bu yüzden doğrulama turu çözümü **hiç görmeden** sıfırdan çözer, tercihen
başka bir modelde. Ayrıntısı `src/SORU.md`'de.

---

## 5. Yapı ve test

```bash
python build.py                                   # dist/rota.html üretir
CHROMIUM_PATH=/opt/pw-browsers/chromium \
  node tools/runtests.js                          # 837 test, başsız
python devserver.py                               # elde denemek için
```

Test paketi tarayıcıda çalışır (`src/tests/harness.js`), sonucu
`window.__ROTA_TESTS__`'e yazar; `tools/runtests.js` bunu başsız Chromium'da
okuyup özetler.

**Commit etmeden önce ikisini de koş.** `dist/rota.html` depoda tutuluyor,
yani kaynağı değiştirip `build.py` koşmayı unutursan dağıtım dosyası
kaynaktan sapar.

---

## 6. Tuzaklar — hepsi bu projede gerçekten canımızı yaktı

**CRLF karışıklığı.** 84 kaynak dosyanın 32'si CRLF satır sonu kullanıyor
(`STIL.md`, `app.js`, `rules.js`, `tokens.css`, `store.js`, birkaç test…).
Bir betikle toplu düzenleme yaparsan satır sonlarını **bozmadan geri yaz**,
yoksa tek satırlık bir değişiklik 700 satırlık sahte bir diff üretir.
Commit öncesi `git diff --stat` ile bak: beklediğinden büyükse sebebi budur.

**JS'te `\b` yalnız ASCII tanır.** `/nasıl çalış\b/` ifadesi "nasıl
çalışılır" metnini **hiç** eşleştirmez, çünkü `ı` harfi `\b` için kelime
karakteri değil. Türkçe metinde sınır gerekiyorsa açık sınıf yaz:
`(^|[^a-zçğıöşü0-9])`. Bu hata bütün konu sorularının yanlış sınıflanmasına
yol açtı ve fark edilmesi haftalar sürebilirdi.

**`preserve-3d` bağlamında isabet testi.** 3B ofis odasında zemin gibi büyük
bir düzlem, kendisiyle aynı derinlikteki masa düğmelerini örtüp tıklanamaz
hâle getiriyor. Dekor sayılan her yüzeye `pointer-events:none` verilir
(`components.css` içinde yorumla işaretli).

**`Object.assign` `undefined` değerleri de kopyalar.** `{ id: el.dataset.id
|| undefined }` yazarsan üretilmiş id'yi ezersin. Alanı ya koy ya hiç koyma.

**`R.App.render()` DOM'a yazdığın geçici mesajı siler.** Hata bildirimini
doğrudan bir `<div>`'e yazarsan sonraki render onu yok eder ve kullanıcı
hiçbir şey görmez. Böyle durumları **ekranın state'inde** tut, render
sırasında yeniden çiz.

**Model kataloğu eskir.** Ücretsiz model kimlikleri aylık değişiyor.
`data/providers.js` içindeki liste **doğruluk kaynağı değil**, yalnız
tohumdur; canlı keşif `core/llm.js`'deki `listModels()` ile yapılır. Bir
model çalışmıyor diye listeyi elle yamamaya çalışma.

**API anahtarları asla depoya girmez.** Kullanıcının anahtarı
`localStorage`'da durur. Testte gerçek bir anahtar kullanma — GitHub'ın
gizli tarayıcısı push'u reddeder (bir kez oldu).

---

## 7. Belge haritası

Bu dosya üst katmandır; alt sistemlerin ayrıntısı ayrı belgelerde:

| Belge | Ne anlatır |
|---|---|
| `src/STIL.md` | Renk, tipografi, ölçü, bileşen sözlüğü, erişilebilirlik |
| `src/OFIS.md` | Altı ajanlı ofis: brifingler, toplantı akışı, konuşma kuralları |
| `src/SORU.md` | Soru çözümü: çıktı sözleşmesi, fotoğraf, doğrulama turu |
| `src/DONUSTURME.md` | Eski yüzeyi bileşenlere çevirme rehberi |

Bir alt sistemi değiştiriyorsan **ilgili belgeyi de güncelle.** Belgeler
burada süs değil; sonraki oturumun tek bağlamı onlar.

---

## 8. Yazım ve dil

- Arayüz Türkçe. Buton fiil ("Kaydet"), bildirim geçmiş zaman ("Kaydedildi")
- Hata mesajı ne olduğunu **ve ne yapılacağını** söyler, özür dilemez
- Sayı ve tarih Türkçe biçimde: `19,50` · `14 Eylül 2026`
- Kod yorumları Türkçe ama **ASCII** (şapkasız): `cozum`, `dogrulama`
- Commit mesajları Türkçe, ne yapıldığını ve **neden** yapıldığını söyler

---

## 9. Çalışma düzeni

- Değişikliği yap → `python build.py` → testleri koş → sonra commit
- Testler kırmızıysa commit etme; bir testi susturarak yeşile boyama
- Yeni davranış eklediysen testini de ekle (`src/tests/`)
- Kullanıcı Türkçe yazıyor ve ürünü kendisi kullanıyor; teknik ayrıntıdan
  çok **ne değiştiğini** duymak istiyor
