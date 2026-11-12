# Faz 3 · Not motoru (`motor/not.js`)

Dal `sadelesme`, 2026-11-13. Dayanak: `not-ve-tekrar.md` (§1-§3, §6), `sentez.md` satır 111, `plan.html` kararları
(«King notları okur, hafızaya yalnız öneri yazar»), AGENTS §0.1 ve §1.1-§1.3. Commit yok; dosyalar yerelde.

## Özet

| | |
|---|---|
| Dosyalar | `motor/not.js` (motor, ~470 satır), `motor/not.test.js` (26 test), bu rapor |
| Test | `node motor/not.test.js` → **26/26 yeşil** (çıkış 0) |
| Bağımlılık | yok; tarayıcıda `LIFEOS.Motor.Not`, Node'da `module.exports` |
| Saflık | saat ve rastgele okunmaz; kimlik ve zaman çağırandan gelir (test kaynak kodda `Date.now(`, `Math.random(`, `new Date(` arar) |
| Kapsam | tek kayıt + doğrulama, kimlikle bağ + yeniden adlandırma + geri bağ, tek ağ, King süzgeci + öneri, Türkçe arama, 10 göç bağdaştırıcısı |
| Yapılmayan | ekran, depo, yerleşim (çizim), medya taşıma, `NOT.ac/bagli` çağrı sözleşmesi (§3c; ekran fazının işi) |

Üç tasarım seçimi:
1. **Göçte kimlik ad alanı eski yeri söyler** (`esp/n1a`, `bilinc/d1`, `esp-tez/a1` …). Böylece Bilinç'in bugünkü Defter atfı `[[not:esp/ID|Ad]]` (`bilinc.js:291`) göçten sonra **hiç yeniden yazılmadan** doğru nota çıkar; ayrı yapılardan gelen kimlikler çakışmaz.
2. **Bağ yalnız gövdede yaşar.** Ayrı bağ kaydı yok (bugün de yok); ağ, geri bağ ve King süzgeci hepsi gövdeden türetir. Yeniden adlandırma bağı koparamaz, yalnız eski adı taşıyan görünen metni tazeler.
3. **King yazamaz, önerir; önerinin dokunamayacağı alanlar kodda.** `oneri()` yalnız başlık/gövde/etiket/klasör/alan/tür önerebilir (`ozel` asla); `oneriUygula()` sahibin onayı ve King'in okuduğu sürümün damgası (`taban`) tutmadan çalışmaz.

## Kayıt biçimi

```
{ id, baslik, govde, alan, etiketler[], kaynak{yapi,…}, olusturma, guncelleme,
  ozel, tur, klasor, sabit, baglam?, ozellik{} }
```

| Alan | Kural | Nereden |
|---|---|---|
| `id` | boşluk, `|`, `[`, `]` yok; ≤160 | çağıran verir |
| `baslik` | ≤120; boş olabilir (ad gövdenin ilk satırından), ama başlık **ve** gövde boşsa kayıt reddedilir | `defter.js:628` (120), `bosSil` |
| `govde` | düz metin / md, ≤60000 | `defter.js:221` |
| `alan` | küçük harfli kısa ad (`felsefe`) ya da boş | görev; eşleme alan/ ekibinde |
| `etiketler` | tekrarsız, `#`'siz, ≤30 | Bilinç `etiket`, ESP `concepts`; gövdedeki `#etiket` ayrıca türetilir (`etiketleri()`) |
| `kaynak` | en az `{yapi}`; göçte `{yapi, modul, yol}`, King'den `{yapi:'king', oneri}` | |
| `olusturma`, `guncelleme` | ms tam sayı, güncelleme ≥ oluşturma | |
| `ozel` | evet/hayır; King okuyamaz | Bilinç `ozel` (`bilinc.js:68`) |
| `tur` | 11 değer: Defter'in 6'sı (`not belge dosya siir deneme kitap`) + `dusunce terim video tez taslak` | `defter.js:625` |
| `klasor` | «Sağlık/Uyku», ≤3 kat, `klasorAdi` ile aynı biçim | `defter.js:650`; Bilinç `konu` buraya iner |
| `sabit` | evet/hayır | `defter.js` |
| `baglam` | yoksa `null`; varsa yalnız metin alanları: `modul, ders, konu, kayit, sayfa` | `not-ve-tekrar.md` §3a |
| `ozellik` | türe özgü küçük alanlar (aşağıda) | §3a |

Türe özgü özellikler (yalnız denetimin gösterdiği kadar): `dusunce` → `dusunce` (8 tür, `bilinc.js:20`), `kesinlik` 1-5, `evrim[]`, `sohbet[]`, iç çatışmada `taraf[2]`, `durum`; `tez` → `destek[]`, `itiraz[{id,metin,cevaplandi,cevap}]`, `durum` (`acik/kapali/birakildi`); `video` → `url, saglayici, videoId, parcalar[{ts,metin,etiket}], dokum, seri, sayfa`; `terim` → `es[]`; `taslak` → `revizyon`; öğrenme notu → `ogren` (not türü).

Doğrulama `dogrula(n)` boş metin ya da tek Türkçe cümle döner; `yeni(o)` eksikleri doldurur ve kötü kayıtta o cümleyle hata atar. Bilinmeyen üst düzey alan reddedilir (tek biçim korunur).

## Bağlar ve ağ

**Biçim:** `[[not:KİMLİK|Görünen ad]]`, çelişki `[[!not:KİMLİK|Ad]]`, adsız `[[not:KİMLİK]]` (ekran güncel başlığı gösterir). `baglar(govde)` sırayla `{id, ad, celiski, bas, son}` verir; eski `[[Başlık]]` ve `![[medya:…]]` bağ sayılmaz.

**Yeniden adlandırma:** `yenidenAdlandir(notlar, id, baslik, zaman)` → `{notlar, degisen}`. Bağ kimlikle durduğu için kopmaz; görünen metni eski ada eşit olanlar (katlanmış karşılaştırma) yeni adı alır, kişinin yazdığı takma ad (`[[not:a|şu fikir]]`) değişmez. Yalnız değişen notların `guncelleme`si ilerler; girdi dizisi değişmez.

**Geri bağ:** `geriBaglar(notlar, id)` → `{id, ad, celiski}`, kimlik sırası, kendisi hariç.

**Tek ağ:** `ag(notlar, o)` → `{dugum, kenar}`, yerleşim yok. Düğüm `{id, ad, tur, klasor, alan, ozel, derece}` (+ düşüncede `dusunce`, `durum`); kenar `{a<b, tur: bag|celiski|etiket}`, çift başına tek kenar, öncelik çelişki > bağ > etiket. Düğüm ve kenarlar kimliğe göre sıralı: girdi sırası çıktıyı değiştirmez (testte JSON eşitliği). Seçenekler: `klasor` (alt klasör dahil; `''` = klasörsüz), `etiket` (varsayılan açık), `merkez` + `cevre` (adım sayısı), `bagsizGizle`.

İki eski ağın ihtiyacı ve karşılığı:

| Eski | Ne kullanıyordu | Yeni ağda |
|---|---|---|
| `defter.js` `agVeri` (`:688`) + `yerlesim` + `agCiz` | modülün notları (klasör süzgeci), `[[Başlık]]` bağı (başlıkla eşleşme), isteğe bağlı etiket bağı (12+ not → zincir), düğüm `{id, ad, klasor, derece}`, `cevre` (2 adım) + `merkez`, `bagsizGizle`; yerleşim tohumu kimlikten, aynı klasör çekimi `klasor`dan | hepsi var; `cevre` artık adım sayısı (Defter 2 verir); bağ başlıkla değil kimlikle |
| `bilinc.js` `ag` (`:103`) + `yerlesim` + `haritaSvg` | düğüm `{id, derece}`; kenar `bag/celiski/etiket`, aynı öncelik; etiket her zaman açık, 12+ etiket **atılıyor**; çizim `baslik` (ad), `konu` (renk ve öbek), `tur` (`catisma` kare, `soru` sınıfı), `durum` (`cozuldu`), `ozel` (`is-ozel`) okuyor; `komsular` kenardan | `konu` → `klasor`, `tur` → `dusunce`, `durum`, `ozel`, `ad` düğümde; `komsular` kenarlardan aynı şekilde çıkar |

Tek davranış farkı: 12'den kalabalık etiket Bilinç'te atılıyordu, şimdi Defter'deki gibi zincir olur (bkz. Açık sorular 2).

## King erişimi

| İşlev | Kural |
|---|---|
| `kingIzin(n, o)` | `ozel` değilse ve `o.kapaliKlasorler` içindeki bir klasörde (ya da altında) değilse okur. Varsayılan: okur (plan kararı). Boş klasör adı «klasörsüz notları kapat» anlamına gelmez. |
| `kingOkur(notlar, o)` | izinli notların **kopyası**; izinsiz bir nota giden bağ (gövdede ve `ozellik` içindeki her metinde, ör. Bilinç `evrim`) «özel not» olur: özel notun başlığı bağ yoluyla sızmaz. King'in araması `ara(kingOkur(notlar), q)`, King'in ağı `ag(kingOkur(notlar))`. |
| `oneri(o)` | King'in önerisi bir kayıttır: `{id, tur:'yeni'|'degistir', hedef, taban, alanlar, gerekce, kim:'king', durum:'bekliyor', olusturma}`. Önerilebilen alanlar: başlık, gövde, etiketler, klasör, alan, tür. `ozel`, `kaynak`, kimlik, zamanlar önerilemez. Değiştirme önerisi okuduğu sürümün `guncelleme`sini (`taban`) taşımak zorunda. |
| `oneriUygula(notlar, oneri, onay)` | `onay = {kim:'sahip', zaman}` yoksa hata. Not öneriden sonra değiştiyse (`taban` tutmuyor) hata: sahibin yazısı ezilmez. Özel nota öneri uygulanmaz. Yeni not `kaynak:{yapi:'king', oneri}` taşır. Girdi değişmez, yeni dizi döner. |

Bilinç'in iki düzeyli izni: düşünce başına `ozel` aynen taşındı. Harita düzeyi `izin` bugün yalnız kişi modeline beslemeyi (`kisiKayitlari`, `bilinc.js:197`) kapatıyor; not başına alanı yok, bu yüzden göçte `izin:false` ise **bütün düşünceler özel** işaretlenir (daha sıkı yön; Açık sorular 1).

Sınır: özel notun adı bir başka notta **düz metin** olarak geçerse (bağ değil) King görür; motor bunu ayırt edemez.

## Arama

`ara(notlar, sorgu, o)` saf; `[{id, ad, puan, parca}]`, en çok `o.sinir` (20).

- **Katlama** (`katla`): `I → ı`, `İ → i` (ICU'suz), küçük harf, NFD ile işaret silme (ç ğ ö ş ü â î û), `ı → i`. «IŞIK», «ışık», «Işık», «isik» aynı; «ISTANBUL» «İstanbul»u bulur.
- **Eşleşme:** her kelime başlıkta, etikette ya da metinde (gövde + `ozellik` metinleri, King'in `sohbet`i hariç) geçmeli (VE).
- **Puan:** başlıkta 10 (+5 kelime başıysa), etikette 6, metinde geçiş başına 1 (en çok 5); başlık sorguya tam eşitse +30. Eşitlikte sabit önce, sonra yeni güncellenen, sonra kimlik: sonuç girdi sırasından bağımsız.
- `#etiket` sorgusu süzgeçtir (Defter'deki gibi). `parca` ilk eşleşmenin çevresi (~160 karakter); King'in 600 karakterlik parçası (`king-arac.js:221`) King'in bağlam derleyicisinin işi.

## Göç bağdaştırıcıları

Hepsi `goc.<ad>(kaynak, {zaman, modul?, alan?, konuAdi?, kavramAdi?})` → `{notlar, rapor}`. `zaman` (göç anı, ms) zorunlu: zamanı okunamayan kayıt onu alır ve `rapor.zamanYok` sayılır. Rapor: `tasinamayan[]` (cümle), `belirsiz[]`, `kopuk[]`, `reddedilen[]` (doğrulamadan geçmeyen ya da aynı kimlik). Her kaynak satırı kaynak dosyada okundu.

| Bağdaştırıcı | Kaynak biçim (doğrulandı) | Kimlik | Taşıyamadığı / kural |
|---|---|---|---|
| `defter` | `defter.js:607` `{id, baslik, govde, at, guncel, sabit, tur, klasor}`, at/guncel ISO | `<modül>/<id>` | medya dosyası (yalnız `![[medya:ID]]` başvurusu kalır); boş klasör listesi; `[[Başlık]]` yalnız **aynı modülde** tek aday varsa kimliğe döner, çok aday `belirsiz`, hiç yoksa `kopuk` (metin olduğu gibi kalır) |
| `terim` | `defter.js:383` `{id, ad, es[], tanim, ekler[], at, guncel}` | `terim/<modül>/<id>` | medya; «bu modülün terimi kazanır» önceliği (aynı terim iki modülde → iki not) |
| `notum` | `notum.js:63` `{baglam, metin, at}` | `notum/<modül>/<bağlam>` | «bağlam başına tek not» kayıtta değil, sorguda; boş metin not değildir (atlanır); `ayar.kaynak` ile modülün kendi alanına yazılanlar `aysKonu`'da |
| `aysKonu` | `state.js:457` `topics.states[konu].note` | `ays-konu/<ders>/<konu>` | yazılma zamanı yok (göç anı); konu adı yok (`konuAdi` verilmezse kimlik); konu durumu ve ölçümler Kayıt/Plan'da |
| `aysVideo` | `state.js:749` `newVideoNote`; parça `{ts, text, tag}` (`learn.js:586`) | `ays-video/<id>` | `watchedMin`, `done`, `source` ölçümdür → Kayıt motoru |
| `espNot` | `state.js:679` `{id, text, bookId, concepts[], links[{to, why}], createdAt}` | `esp-not/<id>` | `why` gövdede bağın yanında « — açıklama» (ağ kenarı açıklama taşımaz); güncelleme zamanı yoktu; `concepts` kavram **kimliği** (`library.js:355` `ESP.CONCEPT_BY_ID`), `kavramAdi` verilmezse kimlik etiket olur; olmayan hedef `kopuk` |
| `espTez` | `state.js:632`/`:644` `{thesis, supports[metin], objections[{id,text,answered,answer}], sourceId, concepts, status}` | `esp-tez/<id>` | «cevapsız itirazlı tez kapanmaz» kuralı (`:663`) ESP'de kalır; `sourceId`'nin çıplak kimlik mi `books/<id>` mi olduğunu kesin göremedim (yorum `books/<id>` diyor): eğik çizgi yoksa `books/` eklenir |
| `espTaslak` | `state.js:903` `{id, title, text, revisions, createdAt, updatedAt}` | `esp-taslak/<id>` | yok |
| `ogren` | `ogrenmotor.js:414` `kayit.n[konu][tur] = [{g, m, k?}]`, `g` = YYYY-AA-GG | `ogren/<modül>/<konu>/<tür>/<sıra>` | saat yok (gün 00:00 UTC); kaynağında da en son 3 not var (`NOT_SAKLA`); konu adı yok |
| `bilinc` | `bilinc.js:56`/`:89` `{dusunceler[], izin}` | `bilinc/<id>` | harita `izin`i (bkz. King erişimi); kıvılcım soruları araçtır; King yorumlarının ayrı deposu `lifeos.bilinc.yorum`: biçimini **göremedim**, yalnız düşüncedeki `sohbet[]` taşınır. `[[Başlık]]`/`[[!Başlık]]` gövdede ve `evrim`de kimliğe döner (belirsiz raporlanır) |

Bağdaştırıcısı **olmayan** yapılar (denetimde «motorunda kalır» ya da Tekrar göçü): AYS yanlış defteri, ESP kitaplar, SPİ kayıt `note` alanları, HKM `memories`, `hafiza.js` katmanları, HKM Meydan destesi. Bunlar nota değil kendi motoruna gider; not onlara `baglam.kayit` (`errors/r9`, `books/b7`) ile işaret eder.

Sayım notu: «13 not benzeri yapı» sayısını denetim tablolarında birebir göremedim; `not-ve-tekrar.md` §1a + §2'de tekrarsız **16** satır var: 10'u nota döner (yukarıdaki tablo), 6'sı motorunda kalır.

## Testler

`node motor/not.test.js` → **26/26 ✓**, çıkış 0. Kapsananlar:

| Konu | Test |
|---|---|
| Doğrulama | dolu kayıt geçer; 18 kötü kayıt Türkçe cümleyle reddedilir; `yeni` hata atar |
| Bağ | ayrıştırma (çelişki, adsız, eski başlık ve medya bağ değil); yeniden adlandırmada bağ kimliği aynı, eski ad tazelenir, takma ad kalır, yalnız değişen notun zamanı ilerler, girdi değişmez |
| Geri bağ | çelişki işareti, kendisi hariç, sıra |
| Ağ | girdi tersine çevrilince JSON aynı; kenar önceliği; klasör (alt klasör, klasörsüz); etiket kapalı; 2 adım çevre; bağsızları gizle; 13 notluk etiket = 12 kenar; düşünce düğümü |
| King | özel not ve kapalı klasör dışarıda; özel nota giden bağın adı silinir; varsayılan okur; King araması özel notu bulamaz; öneri onaysız, yanlış onaylayanla, eski sürümle, özel hedefle, yasak alanla reddedilir; yeni not `kaynak:king` |
| Arama | «IŞIK» → «ışık», «isik» → «Işık», «ISTANBUL» → «İstanbul», «CIG SUT OGUTUCU SISE»; sıralama başlık > etiket > metin; VE; `#etiket`; boş sorgu; girdi sırası bağımsız; özellik metni (tez desteği) aranır |
| Göç | 10 bağdaştırıcının her biri kaynağın biçimiyle kurulmuş örnekle; Defter'de tek aday → kimlik, iki aday («Uyku düzeni» / «uyku  düzeni») belirsiz, olmayan kopuk; Bilinç'te belirsiz («Tekrar» / «tekrar»), çelişki, özel, iç çatışma, evrim, sohbet; `izin:false` → hepsi özel; Bilinç'in `[[not:esp/ID|Ad]]` atfı Defter göçüyle aynı ağda bağ olur; bozuk ve kopya kayıt reddedilir; her rapor taşıyamadığını yazar |
| Saflık | kaynakta saat/rastgele çağrısı yok; `LIFEOS.Motor.Not` bağlı |

Doğrulanmayan: tarayıcıda yükleme (yalnız Node'da koştu); gerçek veriyle göç (sahibin verisi açılmadı, sayılar yok).

## Açık sorular

| # | Soru | Neden |
|---|---|---|
| 1 | Bilinç'te harita izni kapalıysa bütün düşünceler **özel** mi olsun (şimdiki seçim, daha sıkı), yoksa ayrı bir «kişi modeline besleme» işareti mi? | Bugün `izin` yalnız kişi modeli beslemesini kapatıyor, King'in düşünceyi okumasını değil |
| 2 | 12'den kalabalık etiket: zincir (Defter, şimdiki seçim) mi, hiç bağ yok (Bilinç) mu? | İki eski ağ farklı yapıyordu; tek kural gerekiyordu |
| 3 | Eski `[[Başlık]]` bağları yalnız aynı modülde mi aransın (bugünkü davranış, şimdiki seçim), yoksa tek depoda bütün notlarda mı? | Modüller arası tek eşleşme bugün hiç çalışmamış bir bağı «kurmak» olur; şimdi `kopuk` raporlanıyor |
| 4 | King'i klasör düzeyinde kapatma kalıcı bir kayıt mı olsun (`klasor/<yol>` + `king`, denetim §3a)? | Şimdilik çağıranın verdiği `kapaliKlasorler` listesi; kalıcı yer yok |
| 5 | Özel notun adı başka notta düz metinle geçerse King görüyor; kabul mü? | Motor bağı siler, düz metni ayırt edemez |
| 6 | Eski modülden alana eşleme (ör. ESP Okuma → felsefe) kimin kararı? | Bağdaştırıcılar `alan`ı boş bırakıyor; `o.alan` verilirse yazar (alan/ ekibiyle) |
| 7 | ESP'nin bağ açıklaması (`why`) ağda kenar etiketi olarak görünsün mü? | Şimdi gövdede düz metin; ağ kenarı açıklama taşımıyor |
