# Not ve Tekrar motoru keşfi

Kaynak: `C:\Users\ASUS\LifeOs-sadelesme` (origin/main kopyası, son commit d375ef2d). Salt okuma. Sayılar sayıldı, tahmin değil. Bulamadığım şey «göremedim».

## 1. defter.js bugün (A1)

**Boyut (sayıldı):** `brand/ortak/defter.js` 1968 satır, 96 üst düzey fonksiyon, dönüş nesnesinde 66 dışa açık ad (`defter.js` son satırlar); `defter.css` 322 satır; `defter.test.js` 648 satır, 39 `it(`; `notum.test.js` 5 `it(`. defter.js'i çağıran 19 dosya (AYS 6, ESP 6, SPİ 4, `brand/ortak` 3: `king-arac.js`, `king-yol.js`, `kisayol.js`).

### 1a. Veri modeli

| Kayıt | Yer | Alanlar | Kaynak |
|---|---|---|---|
| Not | modül deposu `defter/<id>` (eşitlenir) | `id, baslik, govde, at, guncel, sabit, tur, klasor` | `defter.js:477` (normalize), `:628` (`yeni`) |
| Tür | not alanı | `not, belge, dosya, siir, deneme, kitap` (6); bilinmeyen → `not` | `defter.js:625` `TURLER` |
| Klasör | not alanı `klasor` (yol biçimi «Sağlık/Uyku») + boş klasörler `defterklasor/liste` | ayrı klasör kaydı yok, yalnız ad listesi | `defter.js:609, :650` |
| Bağlantı | **saklanmaz**, `govde` içindeki `[[Not adı]]`dan türetilir | başlıkla eşleşir (kimlikle değil) | `baglantilar` `:349`, `geriBaglantilar` `:360` |
| Etiket | **saklanmaz**, `govde` içindeki `#etiket`ten türetilir | — | `etiketler` `:354` |
| Medya | IndexedDB `lifeos-defter-<modul>` sürüm 1, depo `medya` (keyPath `id`), **yalnız bu cihaz** | `id, notId, tur, ad, mime, boyut, blob, at`; notta `![[medya:ID]]` | `dbAc` `:252-262`, `:292` |
| Sözlük terimi | `defterterim/<id>` (eşitlenir) | `ad, es[], tanim, ekler[]` (+`at, guncel`) | `:379-402`, başlık yorumu `:83` |
| Bağlam notu (eski) | `notum/<bağlam>` | `baglam, metin, at` — bağlam başına tek not | `notum.js:52-64` |

### 1b. Depolama ve eşitleme

- Metin modülün kendi deposuna yazılır (`ayar.store.set`), modül yedeği ve hesap eşitlemesiyle öteki cihazlara gider; medya gitmez (`defter.js` başlık sözü 1).
- Hesap sunucusu notları **anlamaz ve yazmaz**: `GET /api/hesap/defter` eşitlenmiş `defter/%` ve `defterterim/%` satırlarını olduğu gibi döner (`sistem/hesap.py:1881-1898`, söz 29 `:182`). Yalnız varsayılan profiller (`ays/main, spi/ben, esp/ben`) — kodda `shortcut:` notu var (`hesap.py:1883`).
- Modüller ayrı köken: öbür modülün notu **salt okunur**, «Buraya kopyala» kopya alır (`disKopyala`), gerçek taşıma bilerek yok (`belgeler/ekip/yarim/not-sistemi.md`).
- Yedek: tek `.json` (`app:'lifeos-defter'`, notlar + terimler + medya base64), geri yüklerken var olan not ezilmez (`yedekNesnesi` `:570`, `yedekYukle` `:580-590`).
- Gizlilik/izin alanı: `defter.js` içinde `ozel|gizli|izin` geçmiyor (grep 0 sonuç).

### 1c. Bugünkü özellikler (hepsi)

| # | Özellik | Kanıt |
|---|---|---|
| 1 | Markdown alt kümesi: başlık 1-3, kalın, italik, kod, madde, sıralı, `- [ ]` yapılacak, `---`, `==vurgu==`, `~~üstü çizili~~`, `> alıntı`, https bağlantı | başlık yorumu `:24-28`, `md` |
| 2 | `[[Not adı]]` bağlantı, `[[` yazınca ad önerisi | `baglantiOneri` |
| 3 | `#etiket` | `etiketler` `:354` |
| 4 | Oku / Yaz kipi | `ortak.defter.oku/yaz` |
| 5 | Simge araç çubuğu + kısayollar (Ctrl+B, I, Shift+H, K) | yazılar `:116-119` |
| 6 | Kalemle yazma tuvali: kalem, fosforlu kalem, silgi, çizgili/kareli kâğıt, geri/ileri al, basınç; arkada soru fotoğrafı (AYS Soru çöz, Öğren kullanır) | `tuval` (106 satır), başlık `:31-41` |
| 7 | Çizim ekle | `cizimAc` `:1602` |
| 8 | Resim, video, dosya ekle (cihazda) | `medyaEkle`, `dosyalarEkle` |
| 9 | Ses kaydı (MediaRecorder) | `sesKaydi` `:1716` |
| 10 | Şablonlar: 8 (şiir, felsefi deneme, öykü, kitap vb.) | `SABLONLAR` `:495-512` |
| 11 | Kelime sayısı, okuma dakikası | `sayim`, `:1240` |
| 12 | Hazır not kur / aynı başlığa ekle | `notOlustur` `:857` |
| 13 | Yedekle, yedekten yükle | `yedekAl`, `yedekYukle` |
| 14 | Kalıcı depolama isteği + kullanılan alan | `alan` `:547` |
| 15 | Kütüphanem rafı: Yeni not / Yeni belge / Dosya ekle, en yeni beş, raf klasörü | `rafHtml`, `rafBagla` |
| 16 | Klasör ağacı (sayılarıyla), yeni klasör, yeniden adlandır, sil (notlar klasörsüze), sürükle-bırak taşı | `klasorEkle/Tasi/Sil`, `notTasi` |
| 17 | Ağ görünümü: kuvvet yerleşimi, kimlikten tohum (hep aynı yer), etiket bağları (kesik), bağsızları gizle, seçili notun 2 adım çevresi, kaydır/yakınlaştır | `agVeri` `:688`, `yerlesim`, `agCiz` |
| 18 | Geri bağlantılar («Bu nota bağlananlar») | `geriBaglantilar` `:360` |
| 19 | Sabitleme (listede üste) | `sabit`, sıralama `:366` |
| 20 | Arama (bütün modüller + sözlük) | `ara` `:364` |
| 21 | Boş not otomatik silinir | `bosSil` |
| 22 | Modül gezgini (3 sütun), öbür modül salt okunur, «Buraya kopyala» | `disYukle`, `disKopyala` |
| 23 | Sözlük: terim, başka yazılışlar, tanım, ek; okumada Türkçe eklerle işaretleme + bilgi kartı | `terimKaydet`, `terimKalibi`, `kartAc` `:1066` |
| 24 | Sürtünme: Enter liste sürdürür, başlıkta Enter gövdeye, «Kaydedildi» | `enterDevam` |
| 25 | Dosya olarak indir | `disaAktarMetni` `:529` |
| 26 | Ekran notları (notum.js bağlam notları) bölümü | başlık sözü 5 |
| 27 | Derin bağlantı `#defter=<id>` (Bilinç haritası atıfları buraya) | `derinAc` |
| 28 | Pano kartı «haftanın notu» | `panoHtml` `:1504-1517` |
| 29 | King not araması: bütün notlar + sözlük, kelime puanı, ilk 600 karakterlik parçalar merkeze | `king-arac.js:221-247` `notAra` |

### 1d. Karmaşıklık sıcak noktaları

| Fonksiyon | Satır | Not |
|---|---|---|
| `bagla` | 207 | bütün olay bağlama tek fonksiyonda |
| `tuval` | 106 | kalem tuvali |
| `rafBagla` / `rafHtml` | 82 / 63 | Kütüphanem rafı |
| `terimFormAc` | 76 | sözlük formu |
| `agCiz` / `yerlesim` | 46 / 41 | ağ |
| `ac` / `duzenleyiciHtml` / `md` | 41 / 40 / 37 | |

Yapısal riskler: bağlantı başlıkla kurulur (not adı değişince `[[...]]` kopar; yeniden adlandırmada güncelleme kodu göremedim); medya cihaza bağlı (tek uygulamada da IndexedDB tek köken olacağı için bu kısıt çözülür ama cihazlar arası yine gitmez).

## 2. Diğer not benzeri özellikler (A2)

Öneri sütunu: **düz not** = Not motorunda sıradan not · **türlü not** = not + `tur` + birkaç özellik · **araç** = Not motorunun içinde bir araç · **motorunda kalır** = not değil, kaydın alanı.

| Özellik | Dosya | Veri biçimi | Öneri |
|---|---|---|---|
| Notum (bağlam notu) | `brand/ortak/notum.js:52-64` | `notum/<bağlam>` = `{baglam, metin, at}`, bağlam başına bir not; 3 modülün `app.js`, `kutuphane.js`, King kullanır | **düz not** + bağlam alanı (`baglam:{alan, ders/konu}`); «bağlam başına tek not» kuralı, «bu bağlamın notu» sorgusuna dönüşür |
| AYS konu notu | `AYS/src/js/core/konunotu.js`, alan `topics.states[konu].note` (`state.js:457`) | düz metin, konu durumunun alanı | **düz not** (bağlam = ders/konu); konu durumundan ayrılır |
| AYS video notları | `AYS/src/js/core/state.js:749-768` `newVideoNote`, `videoNotes/` | `{id,title,url,provider,videoId,subjectId,topicId,segments[],transcript,watchedMin,done,...}` | **türlü not** (`tur:'video'`): url + zaman damgalı parçalar özellik olur; izlenen dakika Kayıt'ta kalır |
| AYS yanlış defteri | `AYS/src/js/screens/solve.js:1183-1194`, `exams.js:1295`, `state.js:549` `errors/` | `{id, examId, testName, questionNo, tag, seconds, rootCause, principle, similar, recipe, topicRef, subjectId, topicId, closedAt, repairDoneAt}` | **motorunda kalır** (Soru/Kayıt): ölçüm ve kapanma kuralı var. `rootCause/principle` yazısı nota bağlanabilir; tekrar maddesi Tekrar motoruna girer (bkz. §5) |
| ESP Okuma › «Not ve kitap» notları | `ESP/src/js/core/state.js:679` `newNote`, `notes/` | `{id, text (tek fikir), bookId, concepts[], links[{to, why}], createdAt}` | **düz not** (kısa); `links[].why` bağ açıklaması Not motoruna taşınacak tek yeni bağ özelliği |
| ESP kitaplar | `ESP/src/js/core/state.js:737` `newBook`, `books/` | `{id,title,author,kind,startedAt,finishedAt}` | **motorunda kalır** (Kayıt); notlar `kaynak` bağıyla kitaba işaret eder |
| ESP Tezlerim | `ESP/src/js/screens/symposium.js:32, :411`; `state.js:632` `newArgument`, `args/` | `{id, thesis, supports[], objections[], sourceId, concepts[], status: open/closed/abandoned, createdAt}` | **türlü not** (`tur:'tez'`): destek/itiraz listesi + durum özelliği |
| ESP Taslaklarım | `ESP/src/js/core/state.js:903` `newDraft`, `drafts/` | `{id, title, text, revisions, createdAt, updatedAt}` | **düz not** (`tur:'taslak'`); `revisions` sayacı özellik |
| SPİ kayıt notları | `SPI/src/js/core/state.js:300, 405, 612, 662, 694` (`newLab`, `newMed`, `newMeal` …) | ölçüm kaydında `note:''` alanı | **motorunda kalır** (Kayıt alanı); not değil |
| Öğrenme motoru konu notları | `brand/ortak/ogrenmotor.js:414-423` `notYaz/notlar` | `kayit.n[konuId][tur] = [{g, m, k?}]` (modül Store'u, yoksa localStorage `:94-102`) | **düz not** (bağlam = konu, `tur` = not türü) |
| Defter sözlüğü | `defter.js:379-402` `defterterim/` | `{ad, es[], tanim, ekler[]}` | **araç** («Sözlük») ya da `tur:'terim'` not |
| King hafızası (HKM) | `HKM/core/db.py:181-190` `memories` | `{id, user, scope, text, source, state, created_at, expires_at, last_used_at}` | **motorunda kalır** (King); kişinin elle yazdığı hafıza satırı görünür bir nota bağlanabilir |
| Hafıza katmanları (istemci) | `brand/ortak/hafiza.js` (başlık: dört katman, «ölçülen burada saklanmaz») | katmanlı kişi bilgisi | **motorunda kalır** (King) |
| HKM Meydan desteleri | `HKM/core/db.py:551-570` `meydan_deste`; sayfa kaldırıldı (`HKM/tests/test_meydan.py` başlığı) | `{anahtar, kaynak, on_yuz, arka_yuz, aciklama, adim, vade, tekrar, ...}` | yetim veri; **Tekrar göçü** (§5) |
| Bilinç haritası | `brand/ortak/bilinc.js`; sayfa `sistem/gun.py:987-1030` | aşağıda | **araç** (Not motorunun içinde «Düşünce ağı») |

### 2a. Bilinç haritası ayrıntısı

| Konu | Bugün | Kanıt |
|---|---|---|
| Düğüm (düşünce) | `{id, baslik≤80, metin≤2000, konu≤40, etiket[≤8], tur, kesinlik 1-5, zaman, ozel, evrim[≤30 {zaman,metin,kesinlik}], sohbet[≤24 {kim:sen/king, metin, zaman, model}]}` + iç çatışmada `taraf[2]{ad,ister,korkar}, durum` | `bilinc.js:56-80`, `catismaTemiz` |
| Tür | 8: fikir, inanç, soru, karar, his, değer, karakter, iç çatışma | `bilinc.js:20-24` `TURLER` |
| Bağ | metinde `[[Başlık]]` = bağ, `[[!Başlık]]` = çelişki, ortak etiket = etiket bağı; Defter notuna atıf `[[not:ID|Ad]]` | başlık `:3-4`, `ag` `:10`, `temizMetin` `:210` |
| Kıvılcım soruları | 22 hazır soru (alan + önerilen tür) | `KIVILCIM` `:26-49` |
| Depo | tarayıcı `localStorage['lifeos.bilinc']` + hesap sunucusu `gun/bilinc` (yayın), King yorumları `lifeos.bilinc.yorum` | `sistem/gun.py:992, :1004-1022` |
| King yorumu | düşünce başına `sohbet`; King bağlamı `kingSatirlar(d,id,soru)` = düşünce + komşular (satır ≤160) | `bilinc.js:13`, `gun.py:989` |
| Kişi modeline besleme | `kisiKayitlari(d)` en çok 14 kayıt (`alan: gorus/deger`, `kaynak:'bilinc'`) → `POST /api/hesap/yayin` `ad:'gun/kisi'`; **`izin` kapalıysa boş**, `ozel:true` düşünceler hiç girmez | `bilinc.js:193-208`, `gun.py:1016` |
| Test | `tools/bilinc_kabul_test.py` 121 satır, 44 `bekle(` denetimi (saf katman; JS `kabul_js` ile koşar) | |

**Önemli:** Bilinç haritasında King izni iki düzeyli zaten var: bütün harita (`izin`) ve düşünce başına (`ozel`). Defter'de böyle bir alan yok (§1b). Yeni Not motorunun King izni bu modelden büyütülmeli.

## 3. Önerilen Not motoru (A3)

Dayanak: tek uygulama, tek depo. Bugünkü üç engelin ikisi kendiliğinden düşer: modüller arası salt okunurluk (§1b) ve medyanın modül başına ayrı IndexedDB'si (`lifeos-defter-<modul>`). Medya yine cihazda kalır (AGENTS §1.4 sözü değişmez).

### 3a. En küçük veri modeli (4 kayıt)

| Kayıt | Alanlar | Bugünden farkı |
|---|---|---|
| `not/<id>` | `id, baslik, govde (md), tur, klasor, baglam?, ozellik?, king?, sabit, at, guncel` | yeni: `baglam`, `ozellik`, `king`; `tur` 6 sabit değerden araç kimliğine genişler |
| `klasor/<yol>` | `yol ('Sağlık/Uyku'), king?` | bugün yalnız boş klasör listesi (`defterklasor/liste`); kayıt olunca klasör başına King izni taşır |
| bağ | **kayıt değil**, gövdeden türer; biçim `[[not:ID|Ad]]` (Bilinç'te zaten var, `bilinc.js:210`) + `[[!…]]` çelişki | bugün `[[Ad]]` başlıkla eşleşir; kimlikle bağ, yeniden adlandırmada kopmaz |
| `arac/<id>` (Yeni araç) | `id, ad, simge, kapsam {tur? klasor? etiket?}, sablon?, ozellikler? [{ad, tip}], gorunum ('liste'/'agac'/'ag'), sistemNotu {kingOkur: bool, anlam, kullanim}` | yeni; şablonlar (8), sözlük ve Bilinç haritası birer **hazır araç** olur |

`baglam` = `{ alan: 'ays'|'spi'|'esp'|…, ders?, konu?, kayit? ('errors/r123', 'books/b9'), sayfa? }`. `ozellik` = aracın tanımladığı birkaç alan (tez: `destek[]`, `itiraz[]`, `durum`; video: `url`, `parcalar[]`; düşünce: `kesinlik`, `evrim[]`).

### 3b. Üç görünüm

| Görünüm | Ne gösterir | Gerekenler | Bugün nerede |
|---|---|---|---|
| Klasör | seçili klasörün notları, sabitler üstte, yeni→eski | `klasor` alanı, sıralama | `defter.js` liste + `klasordeki`, sıralama `:366` |
| Ağaç | klasör hiyerarşisi (`/` ile bölünür), sayılarıyla, notlar yaprak; sürükle-bırak taşı | yol ayrıştırma, sayım | `klasorler`, sol sütun ağacı (yalnız klasörler, notlar yaprak değil) |
| Ağ (nöral) | not = düğüm, bağ = çizgi, çelişki = ayrı çizgi, etiket = kesik; süz (klasör/araç), bağsızları gizle, 2 adım çevre | tek `ag()` + tek belirlenimci `yerlesim()` | **iki ayrı uygulama**: `defter.js` `agVeri/yerlesim/agCiz` ve `bilinc.js` `ag/yerlesim/haritaSvg` — birleşmeli |

### 3c. Her yerden çağırma sözleşmesi

```
NOT.ac({ baglam:{ alan, ders?, konu?, kayit?, sayfa? }, baslik?, govde?, ekle?:bool, arac? })  → yan panel, not kimliği döner
NOT.bagli(baglam)   → o bağlamdaki notlar (sayfa kendi köşesinde gösterir)
NOT.secileniEkle(baglam, metin)   → notum.js söz 4'ün aynısı (seçili metni sona ekler)
```
- Sayfa yerinde kalır; panel Windows Not Defteri gibi açılır, kapanınca kaydeder (boş not silinir, bugünkü `bosSil`).
- `ekle:true` ve aynı `baglam` için not varsa onu açar (notum.js'in «bağlam başına bir not»u ve `notOlustur`'un «aynı başlığa ekle»si tek kural olur).
- Bugünkü çağıranlar: 19 dosya `DEFTER.*`, notum.js kullananlar (AYS/ESP `app.js`, `kutuphane.js`, King) — hepsi bu üç çağrıya iner.

### 3d. King ne okur, aracın notu King'e nasıl gider

| Katman | Kural (kod karar verir, AGENTS §1.1) |
|---|---|
| Not | `king` alanı varsa o (`acik/kapali`) |
| Klasör | yoksa klasörün `king`'i (en yakın üst klasör) |
| Araç | yoksa aracın `sistemNotu.kingOkur` |
| Varsayılan | yoksa açık (bugünkü davranış: King bütün notları arar, `king-arac.js:227`) — sahibine sorulacak (§6) |

- Süzme kodda: `notAra` (`king-arac.js:221`) ve Bilinç `kingSatirlar` yalnız izinli notları alır; modele kapalı not hiç gitmez.
- Aracın `anlam` ve `kullanim` metni, King'e giden bağlamda o araca ait ilk notun önüne **bir kez** sistem satırı olarak eklenir (örn. «Bu notlar Tezlerim aracından: tez + destek + itiraz. Kişinin görüşüdür, gerçek diye sunma.»). Uzunluk sınırı kodda (Bilinç'teki ≤160 satır sınırı gibi).
- Kişi modeline (`gun/kisi`) yalnız `kisiKayitlari` gibi açıkça tanımlı araçlar yazar; Bilinç'in `izin` + `ozel` kuralı korunur (`bilinc.js:193-196`).

### 3e. defter.js özellikleri: kalsın / araca / at

| Karar | Özellikler (§1c numaraları) |
|---|---|
| **Çekirdekte kalsın** | 1 md alt kümesi, 2 `[[`, 3 `#etiket`, 4 Oku/Yaz, 5 araç çubuğu, 8 medya, 9 ses kaydı, 11 kelime sayısı, 12 hazır not/ekle, 13 yedek, 14 kalıcı depolama, 16 klasör, 17 ağ, 18 geri bağ, 19 sabit, 20 arama, 21 boş not silme, 24 sürtünme, 25 indir, 27 derin bağlantı, 29 King araması |
| **Araca dönüşsün** | 6-7 kalem tuvali/çizim («Kalemle not» aracı; AYS Soru çöz `tuval()` çağırmaya devam eder), 10 şablonlar (her araç kendi şablonunu taşır), 23 sözlük («Sözlük» aracı), `TURLER`'in `siir/deneme/kitap` değerleri |
| **At** | 15 Kütüphanem rafı (tek depoda klasör görünümü aynı işi görür), 22 modül gezgini + salt okunur + «Buraya kopyala» (tek depo), 26 «Ekran notları» bölümü (notum göçünden sonra), 28 pano kartı (Ana sayfa kararına bağlı, §6) |

En büyük fonksiyon `bagla` (207 satır) yeni yan panelle yeniden yazılır; `tuval` (106) olduğu gibi taşınabilir.

### 3f. Obsidian benzerleriyle karşılaştırma

| Obsidian çekirdeği | Burada | Öneri |
|---|---|---|
| Geri bağlar | var (`geriBaglantilar`) | **kalsın** |
| Özellikler (frontmatter) | yok; `tur` sabit | **küçük hali**: serbest YAML değil, aracın tanımladığı `ozellik` alanları |
| Şablonlar | 8 sabit şablon | **araca katılsın** |
| Günlük not | yok; Gün / Günü kapat ayrı | **değmez**: `baglam` içinde gün zaten var; gerekirse «Günlük» aracı |
| Yerel ağ (çevre) | var (2 adım) | **kalsın** |
| Not gömme `![[not]]` | yalnız medya gömme | **değmez** (ilk sürümde) |
| Takma ad (alias) | sözlükte `es[]` var, notta yok | **ucuz, isteğe bağlı** |
| Bağlanmamış anmalar | sözlük işaretlemesi benzer | **değmez** |
| Tuval (canvas) | Bilinç ağı yeterli | **değmez** |
| Eklentiler | — | **«Yeni araç» bunun kodsuz karşılığı** |

## 4. Tekrar ve zamanlama uygulamaları (B4)

Sayım: **9 ayrı zamanlayıcı** (aralık dizisi ya da vade üreten kod) + 1 yetim tablo. Aralık dizileri sayıldı: `[1,3,7,30]`, `[0,1,3,7,21]`, `[1,3,7]` ×2, `{1,7,21,60}`, `[1,3]` hafta, `gapDays:7`.

| # | Uygulama | Dosya | Algoritma ve aralık | Kart / kayıt biçimi | Vade listesi nerede | Depo | Test |
|---|---|---|---|---|---|---|---|
| 1 | AYS tekrar kartları | `AYS/src/js/core/state.js:560-603` `newCard/schedule`; `data/reference.js:140` | sabit basamak `SRS_INTERVALS=[1,3,7,30]` gün; 3 cevap: unuttum → 1. basamak, zorlandım → aynı basamak, hatırladım → +1; vade sırası konu riskine göre (`prioritizedDue` `:606`) | `{id, front, back, topic, subjectId, source ('manual'/'error'…), sourceRef, stage, dueAt, lastResult, lastReviewedAt, history[≤40 {at, rating, result, stage, gapDays}]}` | `screens/cards.js`, `today.js`, `progress.js`, `protocols.js` (`dueCards` çağıranlar) | modül Store `cards/` (eşitlenir) | `AYS/src/tests/model.test.js` 9 `schedule(` çağrısı, `learn.test.js` 1, `features.test.js` 1 |
| 2 | AYS yanlış defteri → kart | `AYS/src/js/screens/exams.js:1306-1312` | kendi takvimi yok; yanlıştan `source:'error', sourceRef:err.id` ile #1'e kart açar | yanlış kaydı §2 tablosunda | Yanlış defteri ekranı (`cards.js:268`) | `errors/` | #1'in testleri |
| 3 | AYS konu kapanış ölçümü | `AYS/src/js/core/calc.js:~313`; `data/subjects.js:362` | `CLOSURE_RULE {first:75, second:70, gapDays:7}`: ilk ölçümden 7 gün sonra ikinci ölçüm | `topics.states[konu] {state, first, firstAt, second, secondAt, note}` | bekleyen konular listesi (calc) | `topics/` | göremedim |
| 4 | AYS hedef planı konu tekrarı | `AYS/src/js/core/hedefplan.js:68-71` | konu bitince 1 ve 3 **hafta** sonra 30 dk tekrar bloğu (`TEKRAR_ARALIK=[1,3]`, `TEKRAR_DK=30`) | plan bloğu | plan / takvim | plan | göremedim |
| 5 | ESP aralıklı tekrar (Dil, Tarih, diğer desteler) | `ESP/src/js/core/srs.js` (327 satır) | Leitner 5 kutu `[0,1,3,7,21]` gün × ease (1.3-2.8, başlangıç 2.5); 4 not (Yine/Zor/İyi/Kolay); Yine: kutu 1, ease −0.2, aynı gün; Zor: ×0.6; Kolay: ×(ease/2+0.5). Unutma eğrisi `R(t)=e^(−t/S)` yalnız **ölçüm** için | `{id, front, back, lang (deste: dil kodu ya da 'history'), context, tags, box, ease, interval, due, reps, lapses, history[≤50 {at, grade, box, interval}], active, es[], zit[]}` (`state.js:575-592`) | `screens/lang.js`, `history.js`, `today.js`; `SRS.` kullanan 20 dosya | `cards/` (eşitlenir) | `ESP/src/tests/srs.test.js` 22 `it(` |
| 6 | Öğretme motoru (King'in yanlış kavram tekrarı) | `brand/ortak/ogret.js:58, :183-195` | `ARALIK=[1,3,7]`: yanlış → yarın; doğru → 3, sonra 7; 3. doğruda kapanır (`bitti`); vadede **benzer** soru | `{[kavram]: {n, sonraki | bitti, ogeler[], y}}` | «Bugünkü tekrarlar» (`ortak.ogret.bugunku-tekrarlar`); AYS `core/ogren.js:430`, ESP `core/kingogret.js:41` | **localStorage**: `ays.king.tekrar`, `esp.ogret.tekrar`, `spi.ogret.tekrar` | `ogret.test.js` 8 |
| 7 | King dersleri (devrim) | `brand/ortak/king-devrim.js:233-314` | `KD_ARALIK=[1,3,7]`, ogret ile aynı kural, **ayrı kopya** | `d.tekrar[i] = {n, sonraki | bitti:true}` (soru sırasıyla) | King paneli | **localStorage** `lifeos.king.dersler` | `king.test.js` 1 eşleşme; ayrı test dosyası göremedim |
| 8 | Ustalık çekirdeği | `brand/ortak/usta.js:45-77` | aşama sınıflayıcı + sonraki tarih: `ARA {ilk:1, kalici:7, saglam:21, koru:60}`; en uzun tutan aralığa göre hedef | kanıt `{g, isabet, guven?, ipucu?, karisik?}` | AYS `core/quiz.js:68` (kalıcılık), kavrat, ogrenmotor | kanıtı çağıran tutar | `usta.test.js` 13 |
| 9 | Kavrat kartları + Öğrenme motoru | `brand/ortak/kavrat.js` (342), `ogrenmotor.js` (901) | kendi aralığı yok; «Bildim/Bilemedim» → USTA kanıtı, sıra `USTA.sira` | konu kartı `{on, arka}` (3-8); kanıt `<modul>.kavrat.kanit` | konu ekranı, öğrenme akışının «aralıklı tekrar» adımı | kavrat: localStorage; ogrenmotor: modül Store, yoksa localStorage (`:94-102`) | `kavrat.test.js` 17, `ogrenmotor.test.js` 61 |
| — | HKM Meydan destesi (yetim) | `HKM/core/db.py:551-570` | `adim` = «meydan.ARALIK sırası», kod silindi (`HKM/tests/test_meydan.py` başlığı) | `{anahtar, kaynak (bam/esp/sinav/sen), on_yuz, arka_yuz, aciklama, dil, adim, vade, tekrar, son_puan}` | yok (sayfa kalktı) | SQLite | `test_meydan.py` yalnız kaldırılmayı sınar |
| — | HKM dil kartı | `HKM/core/db.py:364-369`, `hedefag.py:194-265` | zamanlayıcı değil: modülün günlük kartlarının anlık kopyası | `{modul, gun, kartlar:[{on, arka}]}` | — | SQLite | göremedim |

**Kapsam dışı (yanlış eşleşme):** `belgeler/ekip/gorevler/001-takvim-tekrar.md` ve `013-ays-takvim-tekrar.md` takvim etkinliklerinin **RRULE** tekrarıdır (haftalık ders), aralıklı tekrar değil → Plan motoruna aittir. `ESP/src/js/data/eartraining.js:14` `ESP.INTERVALS` müzik aralığıdır.

**Eşitleme:** localStorage'daki tekrar anahtarları (#6, #7, #9 kavrat) hesap ayar eşitlemesinin kataloğunda yok (`brand/ortak/animasyon.js:374` `ORTAK` deseni; `tekrar|ogret|dersler|kavrat` grep 0). Yani bu üç zamanlayıcının geçmişi **cihazda kalıyor**; modül Store'u ile eşitlendiklerini göremedim.

## 5. Önerilen tek Tekrar motoru (B5)

### 5a. Tek tekrar maddesi

```
tekrar/<id> = {
  id, tur: 'kart' | 'kavram' | 'not',
  kaynak: { alan, yol },          // 'cards/c12', 'errors/r9', 'not/n3', 'kavram:l-ses'
  deste,                          // 'en', 'history', 'ays:mat' …
  on?, arka?,                     // kartta; kavramda soruyu alan seçer (benzer soru)
  durum: { S, D, son, vade, tekrar, unutma },   // S kararlılık (gün), D zorluk
  kapandi?,                       // ogret'in «bitti»si (bkz. §6)
  gecmis: [{ g, not:1..4, gecen, guven?, ipucu? }]
}
```
Bugünkü 5 ayrı biçimi (AYS kartı, ESP kartı, ogret kaydı, king-devrim kaydı, usta kanıtı) tek biçime indirir. `not` 1-4 = Yine/Zor/İyi/Kolay (ESP'nin 4 notu birebir; AYS'nin 3 notu 1/2/3'e; usta kanıtı `isabet:false→1`, `kararsiz→2`, `emin→3`).

### 5b. Algoritma: sabit aralık mı, FSRS mi

| Ölçüt | Sabit aralık (bugün) | FSRS (bellek modeli) |
|---|---|---|
| Kod | 4 ayrı kopya, ~10'ar satır | saf matematik (`Math.exp`, `Math.pow`); kendi yazımı ~150 satır, **paket gerekmez** → AGENTS §1.3'e uyar |
| Kart başına durum | basamak / kutu + ease | `S` (kararlılık), `D` (zorluk), son tekrar tarihi |
| Cevap başına gereken | sonuç | tarih, 4 düzeyli not, geçen gün (tarihten türer) — **AYS ve ESP geçmişinde zaten var** (`gapDays`, `grade`) |
| Parametre | elle seçilmiş diziler | sürüme göre 17-21 ağırlık; yayımlanmış varsayılanlarla çalışır, kişiye göre eniyileme ayrı ve isteğe bağlı |
| Hedef | «n. tekrar k. gün» | istenen hatırlama oranı (genelde 0,9): aralık = o orana düşme anı |
| Geç kalınan tekrar | AYS'de aralık büyümez | geçen gerçek süre S'yi büyütür (AYS `schedule` yorumu bunu zaten istiyor, `state.js:589-591`) |
| Eksik veri | — | hiç sorulmamış kart = durum yok = «veri yok» (AGENTS §1.2'ye uyar) |

**Öneri:** FSRS biçiminde tek zamanlayıcı, **yayımlanmış varsayılan ağırlıklarla**; tarayıcıda eniyileme yok. Gerekçe: veri zaten 4 düzeyli (ESP) ya da eşlenebilir (AYS), geçen gün kaydediliyor ve ESP `srs.js` kavramsal olarak aynı eğriyi (`R(t)=e^(−t/S)`) ölçüm için kullanıyor. Kişiye göre eniyileme yüzlerce-binlerce cevap ister; tek kullanıcıda ilk aylarda anlamsız, gerekirse sonra Python standart kütüphanesiyle sunucuda yapılır. **Doğrulanmadı:** FSRS sürümlerinin tam ağırlık listesi ve formülleri bu depoda yok; uygulamadan önce kaynağından alınmalı.

Kapanış: ogret'in «3 doğruda kapanır»ı (`ogret.js:192`) FSRS'de yoktur; `S ≥ 21` (usta'nın `saglam` eşiği, `usta.js:45`) gibi bir kuralla korunabilir. Usta'nın 4 aşaması (Öğreniyor/Tutuyor/Kalıcı/Sağlam) `S`'den okunur; ayrı zamanlayıcı kalmaz.

### 5c. Maddeler motora nasıl girer

| Giriş | Bugün | Yarın |
|---|---|---|
| Ders / konu kartı | kavrat kartları + USTA kanıtı; AYS `newCard` (`source:'manual'`) | `TEKRAR.ekle({tur:'kart', kaynak, on, arka})`; kavrat «Bildim/Bilemedim» = cevap |
| Yanlış cevap | AYS yanlış → kart (`exams.js:1306`); ogret kavram kaydı (`ogret.js:187`) | Soru motoru yanlışı kaydeder, `TEKRAR.ekle({tur:'kavram', kaynak:'errors/<id>'})`; vadede soruyu alan seçer (`OGRET.benzer`) |
| Not | yok | notta seçili metin «Tekrara ekle» → `{tur:'not', kaynak:'not/<id>', on, arka}` (Not motoru §3c'deki seçim kuralıyla) |
| King dersleri | `king-devrim.js` ayrı 1/3/7 | aynı `TEKRAR.ekle`; ayrı dizi silinir |

### 5d. Göç

| Kaynak | Eşleme | Tarih |
|---|---|---|
| AYS `cards/` | `stage`'den başlangıç S (`[1,3,7,30][stage-1]`); `history` (≤40) varsa sırayla yeniden oynat | `dueAt` → `vade` **aynen** |
| ESP `cards/` | `box/ease/interval`'dan başlangıç; `history` (≤50, `grade` birebir) yeniden oynat; `lang` → `deste` | `due` aynen |
| ogret (`*.ogret.tekrar`, `ays.king.tekrar`) | `n` → S (1/3/7); `bitti` → `kapandi`; `ogeler` korunur; geçmiş yok | `sonraki` aynen |
| king-devrim (`lifeos.king.dersler`) | ogret ile aynı | aynen |
| kavrat kanıtı (`<modul>.kavrat.kanit`) | her kanıt bir `gecmis` satırı | vade yeniden hesaplanır |
| Meydan destesi (SQLite) | isteğe bağlı (§6) | `vade` aynen |

Kurallar: göç vadeyi değiştirmez (ilk gün tekrar çığı olmaz); ham değer bir kez `<anahtar>.yedek`'e yazılır (ogret'in bugünkü `tasi/yedekle` deseni, `ogret.js:153`); localStorage'da duran üç kaynak (§4 eşitleme notu) göçten sonra ilk kez eşitlenmiş olur. Geçmişler kırpılmış olduğu için (40/50) yeniden oynatma yaklaşık başlangıç verir; bu not ekranda «göçten tahmin» etiketiyle durmalı (AGENTS §1.2).

### 5e. Alana özgü kalanlar

| Kalır | Nerede |
|---|---|
| Soru seçimi (benzer soru, çeldirici), yanlış teşhisi (4 tür) | Soru motoru / `ogret.js` |
| Vade sırası önceliği (AYS konu riski `prioritizedDue`) | alanın verdiği sıralama kancası |
| Dil kartında üretim (`active`, eş/zıt anlam), sesli tekrar, Tarih kronolojisi | ESP Dil / Tarih ekranı |
| Konu kapanış ölçümü (`CLOSURE_RULE` 7 gün), hedef planındaki 1-3 hafta tekrar blokları | Plan motoru (Tekrar'ın vade sayısını okuyabilir) |
| Takvim RRULE (görev 001, 013) | Plan motoru |
| Hatırlama ölçümü ekranları (ESP `retention`, AYS `quiz.js` kalıcılık) | ölçüm ekranları; `S` ve `gecmis`i okur |

## 6. Sahibine açık sorular

| # | Soru | Neden önemli |
|---|---|---|
| 1 | King notları **varsayılan olarak** okusun mu (bugünkü gibi), yoksa yalnız izin verdiğin klasör/araç/notları mı? | Defter'de izin alanı yok (§1b), Bilinç'te var (`izin` + `ozel`); tek kural seçilmeli |
| 2 | «Yeni araç» kodsuz mu kalsın (şablon + özellikler + görünüm + sistem notu), yoksa King'in araç kataloğu gibi bir şey de **yapabilsin** mi (`arac.js` tanımı: `calistir/onizle/uygula`)? | kodsuz araç güvenli ve küçük; çalışan araç yetki seviyesi ister (AGENTS §1.9) |
| 3 | Bilinç düşünceleri sıradan not mu olsun (`tur` = düşünce aracı), yoksa ayrı depoda mı kalsın? | tek depo + tek ağ önerildi (§3b); kişi modeline giden 14 satırlık besleme (`kisiKayitlari`) korunacak |
| 4 | Resim/ses/video bundan sonra da yalnız cihazda mı kalsın? | tek uygulamada da cihazlar arası gitmez (`defter.js` söz 1) |
| 5 | Kütüphanem rafı ve Ana sayfadaki «haftanın notu» kartı kalsın mı? | §3e'de «at» önerildi |
| 6 | Tekrar için FSRS benzeri model (varsayılan ağırlıklarla) mı, yoksa bugünkü sabit aralıkların biri (ör. ESP kutu + ease) mi? | §5b; FSRS geçmişi daha iyi kullanır, sabit aralık daha kolay anlatılır |
| 7 | İstenen hatırlama oranı ve günlük tekrar tavanı ne olsun? | FSRS'de tek ayar; çok yüksek oran tekrar yükünü artırır |
| 8 | «3 doğruda kavram kapanır» kuralı korunsun mu? | FSRS kendiliğinden kapatmaz (§5b) |
| 9 | Kaldırılan Meydan'ın SQLite'taki destesi (`meydan_deste`) yeni Tekrar'a alınsın mı? | yetim veri, sayısını göremedim (gerçek veri açılmadı) |
| 10 | Not ve tekrar geçmişi sınırları (AYS 40, ESP 50 cevap) büyüsün mü? | kişiye göre eniyileme için tam geçmiş gerekir |

---
Doğrulanamayanlar: kayıt sayıları (gerçek veri açılmadı); FSRS formül ve ağırlıkları (depoda yok); `tools/bilinc_kabul_test.py` dışındaki Bilinç ekran testleri; `king-devrim.js`'in ayrı test dosyası; `hedefplan.js` ve `CLOSURE_RULE` testleri.
