# Faz 3 · Kayıt ve Plan motorları (A6)

## Özet
- `motor/kayit.js` + `motor/kayit.test.js`: tipli günlük kayıt motoru. 16 tür tek tabloda; eski SPİ kural motorları (enerji hedefi, toparlanma, yük, uyku) sadık taşındı ve test eski kaynağı Node'da yükleyip aynı geçmişte gün gün karşılaştırıyor. **28/28 yeşil.**
- `motor/plan.js` + `motor/plan.test.js`: gün ve hafta planı. Tek öncelik sırası (ESP), boş zamana yerleştirme, mola, günlük süre bütçesi, devir, ara günü, ölçekleme ve hafifletme (AYS istisna.js) — eski kurallar gerçek kaynağa karşı testli. Yol dersleri ve Tekrar kartları girdi olarak gelir; Kayıt'ın günün emri çarpanı hareket bloklarını yalnız kısaltır. **23/23 yeşil.**
- Her iki motor saf (saat okumaz), sıfır bağımlılık, tarayıcı + Node sarmalayıcı (`LIFEOS.Motor.Kayit` / `.Plan`). Eski modüllere ve başka dosyalara dokunulmadı.

## Kayıt türleri
Hepsi `Kayit.TURLER` tablosunda, her biri tek satır: alanlar, birimler, alt/üst sınır, tam sayı şartı, zorunluluk, Türkçe hata cümlesi.

| Tür | Alanlar (birim) | Not |
|---|---|---|
| `ogun` | kcal, protein (g); içerik*, öğün (kahvalti/ogle/aksam/ara) | kcal yoksa sıfır sayılmaz |
| `su` | ml* (1–8000) | 0 ml ölçüm değil (SPI state.js:624-629) |
| `uyku` | saat* (0–16) | gece uykusu |
| `kestirme` | dk* (1–240), başlangıç saati | günde en çok 6 (SPI uyku.js:51) |
| `hareket` | dk* (1–600), RPE (1–10), MET; ad, tür (kuvvet/kardiyo/mobilite) | göçte hareket kalemleri `kalemler`de |
| `kilo`, `bel`, `yagOrani` | kg, cm, % | |
| `nabiz`, `hrv` | atım/dk, ms | |
| `tansiyon`, `spo2`, `ates` | mmHg, %, °C | |
| `enerji` | puan* (1–5); not | SPİ «ağrı ve enerji» ile AYS ruh hâli tek tür |
| `calisma` | dk* (1–720), sayı, kalite (0–10); alan*, konu | akademik, esp, … |
| `mola` | dk* (1–120) | |

Sınırlar eski giriş ekranından (SPI screens/today.js:298-309); test kaynaktan okuyup karşılaştırır.

**Etiketler (AGENTS §1.2):** kullanıcının yazdığı sayı `measured`; kendisi «tahmin» derse `estimated`; kullanıcı `computed`/`eski` yazamaz. Motorun ürettiği sayı `computed`, boş `missing`, göçle gelen etiketsiz sayı `eski` (karar 11, goc.py ile aynı kod). Toplam en zayıf parçanın etiketini alır (tahmin > eski > hesaplandı; ESP state.js:430-441 kuralı). Eksik veri hiçbir toplamda sıfır sayılmaz; `eksik` sayısı ayrıca döner.

**Toplamlar:** `gunluk(kayitlar, gun)` su, uyku (gece + kestirme; gece yoksa toplam «veri yok», SPI uyku.js:71-77), hareket süresi ve yükü (yükü bilinmeyen seans sayısıyla), alan alan çalışma, öğün, mola, günün son ölçümleri. `haftalik(kayitlar, bitis)` 7 gün; ortalamalar yalnız verisi olan günlerden (AYS calc.js:330-339), 0 saatlik gece ortalamaya girmez.

## Kural motorları ve güvenlik sınırları
`Kayit.Kural` eski kodun **sadık taşımasıdır**; sabitler aynı, test eski dosyaları (`SPI/src/js/core/move.js`, `nutri.js`, `uyku.js`, `kotugun.js`, `data/movement.js`, `nutrients.js`, `biomarkers.js`) Node'da yükler ve 4 tohumlu rastgele geçmiş × 50 günde sonuçları karşılaştırır:

- **Toparlanma** (move.js:96-160): puan, bant, ince ölçüm, kapsam — eski `readiness` ile aynı.
- **Yük** (move.js:170-306): ACWR oranı/bölgesi/kronik pencere/bilinmeyen seans, indirme haftası, haftalık büyüme — eski `acwr`, `deloadWeek`, `weeklyGrowth` ile aynı.
- **Günün emri** (move.js:310-383): çarpan ve tür eski `prescription` ile aynı; kötü gün (kotugun.js:28) aynı.
- **Enerji hedefi** (nutri.js:63-143, :276-310): 4 hedef × plan farkı/sabit kcal × 2 cinsiyet; kcal, BMR, ihtiyaç, hareket enerjisi, bazal tabanı eski `targets` ile aynı.

**Güvenlik sınırları (testli):**
1. Enerji hedefi hiçbir hedefte ve planda bazalın altına inmez (nutri.js:309-310).
2. Haftalık yük geçen haftadan %10'dan fazla artmaz: `haftalikBuyume` aşan haftayı işaretler, `enCok` (yük) ve `dkEnCok` (süre) tavanını verir (movement.js:337-341). Geçen hafta yoksa tavan uydurulmaz (`missing`).
3. Sistem yükü yalnız azaltır: çarpan hiçbir zaman toparlanma bandını geçmez; ince ölçüm artıramaz; ateş ≥ 38,5 / oksijen < %92 dinlenme (move.js:124-130).
4. Teşhis ve doz yok: tabloda ilaç/doz/teşhis alanı yoktur (test arar).

**Bilinçli sapmalar (ikisi de daha temkinli ya da eksik veriyi doğru sayan yönde):**
- Eski kod ateş/oksijen bayrağını hiç toparlanma girdisi olmayan günde uygulamıyordu (move.js:116-122 erken dönüş): yalnız ateş 39 girilen gün tam yük çıkıyordu. Burada bayrak her zaman geçerli (test bunu ayrıca gösteriyor).
- Seans yükünde MET kalemin kendisinden de okunur (eski kod enerjide okuyup yükte okumuyordu: move.js:174 / nutri.js:89-93); MET hesabından eklenen seans artık «yük bilinmiyor» değil.
- Yaş: eski kod yılı saatten okuyordu (state.js:202-206); motor saf olduğu için `yil` dışarıdan gelir, verilmezse hata.

## Plan motoru
`Plan.gunPlani(girdi)` → `{ok, plan}` ya da `{ok:false, hatalar:[Türkçe cümle]}`. Girdi: gün, boş zaman aralıkları (`musait`, SS:DD), sabit bloklar (toplantı vb.), isteğe bağlı günlük süre (30–720), gün şablonu, işler, Yol dersleri, Tekrar planı, hareket çarpanı.

**Sıra (ESP core/planner.js:8-14, tartışılmaz):** `temel` > `sureli` > `vadeli` > `sentez` > `yeni`. Son tarihi 14 gün içinde (ESP planner.js:76 `DEADLINE_DAYS`) ya da geçmiş iş kendiliğinden `sureli` olur. Aynı sınıfta önce devreden (AYS auto.js:71), sonra yakın son tarih, sonra veriliş sırası (şablon → işler → tekrar → Yol dersleri).

**Yerleştirme:** sabitler ve ilerlemesi başlamış bloklar yerinde kalır; her aday sırayla en erken sığdığı boşluğa konur. Bölünebilir iş (tekrar bloğu hep bölünebilir) en az 10 dk parçalarla. Sığmayan `sigmayan`a nedeniyle düşer: «boş zaman yetmedi», «günlük süre doldu», «kısmen sığdı» (kalan dk ile), «ara günü», «toparlanma günü». Test 300 rastgele günde çakışma olmadığını, boş zaman dışına taşmadığını, bütçenin aşılmadığını ve hiçbir dakikanın kaybolmadığını denetler.

**Eski kurallar (gerçek kaynağa karşı testli):**
- Ölçekleme: AYS istisna.js:224-240 `olcekle` aynen (5'in katı, en az 10 dk, artık son bloğa); 7 gün şablonu × 8 hedefte eskisiyle birebir.
- Deneme (Cmt) ve kapanış (Paz) günü ölçeklenmez ve günlük süreyle sınırlanmaz (istisna.js:80, :208-215); Dinlenme bloğu doldurulmaz.
- Ara günü: blok yok, işler «ara günü» ile bekler ve devreder — kaçırılmış sayılmaz (istisna.js:10-12).
- Geçmiş gün yeniden planlanmaz; ilerlemesi başlamış blok yeniden kurulmaz (`yenidenKur`, istisna.js:21-27).
- Hafifletme: oranla, en az 30 dk; oransız yarısı; deneme/kapanış kısaltılmaz (istisna.js:453-488).
- Mola: blok 50 dk altıysa 5, değilse 15 dk; günde en çok 6 (AYS data/activities.js:101-106).
- Hafta: sığmayanların en öncelikli 2'si gelecek haftaya `devir`, gerisi `bekleyen` (AYS auto.js:311-316) — hiçbiri kaybolmaz.

**Durum ve devir:** `durumYaz` yapıldı / kısmen (süre şart) / atlandı (neden şart, `birak` ile bırakılabilir). `devret` ertesi güne bekleyen ve atlanan işleri, kısmen yapılanın kalanını taşır, `devir` sayacını artırır. **Tekrar, Yol dersi, şablon bloğu ve toparlanma günü devretmez**: ertesi gün Tekrar vadeli kartları, Yol sıradaki dersi, şablon kendi bloklarını, Kayıt çarpanı yeniden verir; devretmek iki kez saymak olurdu.

**Hafta planı:** `haftaPlani` 7 günü sırayla kurar; iş verildiği günden başlar, Yol dersleri sırayla tükenir, sığmayan ertesi güne devreder. Öngörüdür: planlanan blok yapılacak sayılır.

**Bağlar (girdi olarak):** Tekrar.plan() çıktısı tek «Tekrar kartları» bloğu olur; süresi kart × 12 sn, 5'e yuvarlanmış, en az 10 dk, etiketi `estimated`. Yeni kartlar `yeni` sınıfında ayrı blok. Kayit.Kural.gununEmri çarpanı `alan:'hareket'` bloklarını yalnız kısaltır (1,1 artırmaz; 10 dk altına düşerse «toparlanma günü»). Bağ testleri yalnız arkadaşın dosyası varsa ve kendi testi geçiyorsa koşar (ikisi de koştu, geçti).

**Etiketler:** plan dakikaları `computed`; tekrar bloğu içeren günün toplamı `estimated`; boş plan `missing`.

## Göç bağdaştırıcıları
Kayıt tarafı (`Kayit.GOC`, her biri `{kayitlar, reddedilen}` döner; sınırı aşan eski değer sessizce atılmaz, nedeniyle `reddedilen`e düşer; taşınamayanlar `Kayit.EKSIK`):

| Bağdaştırıcı | Kaynak (doğrulandı) | Taşınmayan / «göremedim» |
|---|---|---|
| `spiVitals` | SPI state.js:608-631 | semptomlar ve adet günü (Tahlil alanı); günün notu (Not motoru); öğün değil |
| `spiOgun` | state.js:160-166, :661-668 | kcal/besin değerleri besin tablosundan türer (Beslenme alanı taşınınca yeniden hesaplanır); öğün saati kayıt anıdır: göremedim |
| `spiAntrenman` | state.js:684-700, move.js:444-450 | şablon ve basamak (Hareket yol haritası); boş süre 40 dk varsayılanla doluyordu (state.js:690), ayırt edilemez → «eski» |
| `spiProfil` | state.js:178-200 | etkinlik düzeyi hiçbir hedefe girmiyordu (nutri.js:74-82) |
| `aysMood` | AYS state.js:926-933 | boş enerji 3 yazılıyordu: gerçek mi varsayılan mı göremedim → «eski» |
| `aysMola` | AYS state.js:948-958 | etkinlik; boş süre 5 dk varsayılan |
| `aysGun` | AYS state.js:379-412 | blok hedef/durum Plan bağdaştırıcısında; soru sayıları Soru motorunda; dikkat dağılması göremedim |
| `espGun` | ESP state.js:372-395 | kalite aralığı göremedim (0-10 kabul); disiplin `konu`ya, alan `esp` |

Test 4 rastgele SPİ geçmişini bu bağdaştırıcılardan geçirir: hiçbir değer reddedilmez ve kural sonuçları eskisiyle aynı çıkar.

Plan tarafı (`Plan.GOC`, taşınamayanlar `Plan.EKSIK`):

| Bağdaştırıcı | Kaynak | Taşınmayan / «göremedim» |
|---|---|---|
| `aysGun` | AYS state.js:379-412, istisna.js:280-294 | blok soru hedefi ve çözülen/doğru soru, paragraf/problem (Soru motoru); kontrol listesi (Akademik alan; göremedim); not (Not); uyku (Kayıt); saat yoktu → bas/bit null; konu kimlikleri (Akademik müfredat bağı) |
| `aysSablon` | AYS data/curriculum.js:113-128 | ritüel türleri korunur, içeriği Akademik alanda |
| ESP planlayıcı | ESP planner.js | «sıradaki tek iş» kaydedilmiyordu, her açılışta hesaplanıyordu: taşınacak kayıt yok; sıra kuralı `Plan.SIRA` olarak taşındı |

## Testler
- `node motor/kayit.test.js` → 28/28 ✓ (çıkış 0).
- `node motor/plan.test.js` → 23/23 ✓ (çıkış 0). Eski AYS kaynakları (curriculum.js, activities.js, istisna.js) Node'da yüklenir; Tekrar ve Kayıt bağ testleri arkadaşların testleri geçtiği için koştu.
- İkisi birlikte ~1,5 sn; bağımlılık yok.

## Açık konular
1. **Kart başı süre 12 sn** bir karardır, ölçülmedi (`Plan.SABIT.TEKRAR_KART_SN`). Tekrar motoru cevap süresi kaydederse ölçülmüş ortalamayla değiştirilmeli.
2. **Ateş bayrağı sapması:** eski SPİ kodu ölçümsüz günde ateşi yok sayıyordu; yeni motor her zaman dinlenme diyor (daha temkinli). Sahibin bilgisine.
3. **Seans yükünde kalemin MET'i** artık okunuyor (eski kod MET hesabıyla eklenen seansın yükünü «bilinmiyor» sayıyordu). ACWR bu seanslarda değişir.
4. **AYS ruh hâli enerjisi 3** ve **mola 5 dk** varsayılanları gerçek değerden ayırt edilemiyor: «eski kayıt» etiketiyle taşındı.
5. **Haftalık süre tavanı** (`dkEnCok`) yük tavanının yanına eklendi (movement.js:339 «süre için ayrı ayrı» der); eski kod süre tavanını hesaplamıyordu.
6. **Öne alma** (yoğun günde fazla süre ≥ 30 dk → sıradaki konu, istisna.js:315-340) Plan'da genel kuralla karşılanıyor: boş zaman kaldıkça sıradaki Yol dersi yerleşir. Müfredata özgü «sıradaki konu» seçimi Akademik alanın işi.
7. **Gün şablonu** AYS'nin akademik şablonudur; diğer alanların şablonu yok. Kabuk hangi şablonun hangi güne uygulanacağını seçmeli.
8. Göç koşucusu (`sistem/goc.py`) bu bağdaştırıcıları henüz çağırmıyor; bağlamak sonraki iş.
