# Seviye sistemi — tek kaynak burasıdır

Altı kademe. Beşinde üçer basamak, altıncısında on.

**Ortak olan TANIMDIR, defter değil.** AYS'nin, SPİ'nin ve ESP'nin her
birinin **kendi seviyesi** vardır: "Altın" üçünde de aynı şeyi ifade
eder (aynı ad, aynı renk, aynı eşik) ama ayrı ayrı kazanılır — ESP'de
pratik yaparak, SPİ'de antrenman kaydederek, AYS'de soru çözerek. Motor,
başka bir sistemin etkinliğini deftere yazmaz. Bir sistemin *içindeki*
alt modüller (ESP'de dil/felsefe/müzik) ayrı seviye tutmaz: hepsi o
sistemin tek seviyesini besler.

## Merdiven

Altı kademe, her birinde üç basamak — Kutsal hariç. Zorluk kademeden
kademeye **sertleşir** ve bu depo sahibinin tarifidir, kelimesi
kelimesine: «bronz çok kolay, gümüş gene kolay, altın orta seviye,
yakut zor, safir çok zor, kutsal çok nadir».

| Kademe | Ad | Basamaklar | Bitiren XP | Günde ~250 XP ile | |
|---:|---|---|---:|---|---|
| 1 | Bronz | 1.1 · 1.2 · 1.3 | 800 | 3 gün | çok kolay |
| 2 | Gümüş | 2.1 · 2.2 · 2.3 | 4 000 | 16 gün | kolay |
| 3 | Altın | 3.1 · 3.2 · 3.3 | 16 000 | 2,1 ay | orta |
| 4 | Yakut | 4.1 · 4.2 · 4.3 | 55 000 | 7,2 ay | zor |
| 5 | Safir | 5.1 · 5.2 · 5.3 | 200 000 | 2,2 yıl | çok zor |
| 6 | **Kutsal** | K100 … K1000 | 300 000'den başlar | 3,3 yıl | **çok nadir** |

Her kademe bir öncekinin yaklaşık **üç katı** emek ister. Fark
kademeler arasında hissedilir, basamaklar arasında değil: bir basamak
bir gün-hafta işi olmalı, yoksa ilerleme durur ve merdiven işe yaramaz.
İki test bunu koruyor — biri eğrinin sertleştiğini, öteki ilk üç
kademenin her basamağının tavanla bir ayda geçildiğini denetler.

> Önceki eğri DÜZDÜ: Safir'e dört buçuk ayda, Kutsal'a altı ayda
> geliniyordu. «Çok zor» ve «çok nadir» bunlar değildi.

### Kutsal'da nokta yoktur

Altıncı kademe bir varış değil bir devamdır; sahnesinde yazdığı gibi
**«daima daha yükseğe»**. Basamakları `6.1` diye değil `K100`, `K200`,
… `K1000` diye adlanır.

**K100 Kutsal'a girişin kendisidir**; K merdiveni oradan itibaren
Kutsal'ın İÇİNDE devam eder ve her basamak bir öncekinin yaklaşık
**1,7 katı** emek ister.

| Rütbe | Kümülatif eşik | Günde ~250 XP ile |
|---|---:|---|
| K100 | 300 000 | ~3,3 yıl |
| K200 | 500 000 | ~5,5 yıl |
| K300 | 850 000 | ~9,3 yıl |
| K400 | 1 400 000 | ~15 yıl |
| K500 | 2 400 000 | ~26 yıl |
| K600 | 4 000 000 | ~44 yıl |
| K700 | 6 800 000 | ~75 yıl |
| K800 | 11 500 000 | ~126 yıl |
| K900 | 19 500 000 | ~214 yıl |
| **K1000** | **33 000 000** | **~362 yıl** |

**K1000 bilerek ulaşılmaz.** Bir sistemin günlük tavanı ~430 XP; o
tavanın tamamını **her gün, hiç atlamadan** alan biri için bile 210 yıl
eder. Tepesi görünen bir merdiven, tepesine varıldığı gün biten bir
merdivendir. Bir test bunu koruyor: eşik otuz yıldan yakına düşerse
paket kırmızıya döner.

## Neyi nerede değiştirirsin

| İstediğin | Dosya | Sonra |
|---|---|---|
| Kademe adı, rengi, sloganı | `kademeler.js` → `LIFEOS.KADEMELER` | `python3 tools/seviye.py --yay` |
| XP eşikleri (basamak maliyetleri) | `kademeler.js` → `basamak:[…]` | aynı |
| Hangi iş kaç XP veriyor | `kademeler.js` → `LIFEOS.XP_ETKINLIK` | aynı |
| Sayma davranışı, tavan, defter | `xp.js` | aynı |
| Perde/banner görünümü | `seviye.css`, `perde.js` | aynı |
| Rehberdeki seviye paneli | `xp.js` → `panelHtml` | aynı |
| Rütbe ekranının kendisi | `rutbe.js` | aynı |
| Rütbe ekranının biçimleri | `seviye.css` → `.rutbe…` | aynı |
| Bir işin hangi ekranda yapıldığı | `kademeler.js` → `rota` · `nerede` · `nasil` | aynı |
| Açılıştaki durağan perde markupı | `perde.html` | aynı |
| Sunucuların `/img/seviye/` muhafızı | `ortak_yol.py` | aynı |
| `dist/` medya kopyalayıcı | `dist_kopya.py` | aynı |

`--yay` bunların hepsini üç arayüzün içine **birebir** yerleştirir; ad
alanı yer tutucusu her sistemin kendi adıyla değişir (`R`, `SP`, `ESP`).
HTML ve Python blokları dosyaların içine `SEVIYE:…` işaretleri arasına
yazılır. **Bu özellikte elle kopyalanan hiçbir blok kalmadı**; kopyaları
elle düzenleme, bir sonraki yayında kaybolur.
`python3 tools/seviye.py --denetle` ayrışmayı söyler ve CI'da koşar.

> `id` alanlarını değiştirme. Defterde yazılı olan `id`'dir; değişirse
> geçmiş kayıt sahipsiz kalır. Ekranda görünen `ad` alanıdır ve serbestçe
> değiştirilebilir.

## Dosya düzeni

```
brand/seviye/
  OKU.md          bu belge
  kademeler.js    kademeler, etiketler, eşikler, etkinlikler
  xp.js           motor
  basarimlar.js   rozet kataloğu (yedi aile, mühürler, onur)
  basarim.js      rozet motoru (ay özeti, kazanım, kuyruk)
  perde.js        rütbe gösterimi ve haberci
  rutbe.js        Rütbe ekranı (dört sekme)
  seviye.css      perde, haberci, rozet ve Rütbe ekranı biçimleri
  perde.html      index.html içindeki durağan marka perdesi
  ortak_yol.py    sunucuların /img/seviye/ muhafızı
  dist_kopya.py   build.py'nin medya kopyalayıcısı
  xp.test.js · perde.test.js

  medya/          SERVİS EDİLEN görseller — /img/seviye/… buraya bakar
  eski/           servis EDİLMEYEN arşiv
```

`eski/` bugün tek bir dosya tutuyor: **`kademe-1.mp4`** — eski
sistemdeki «1. kademeye geçiş» videosu (4,6 MB). Yeni akış onu
kullanmıyor; servis edilmiyor, dağıtıma kopyalanmıyor. İçeriği uygunsa
`medya/rutbe-1-1.mp4` ya da `medya/sahne-1.mp4` olarak yeniden
adlandırılabilir; değilse silinebilir. Karar depo sahibinin, o yüzden
silinmedi.

Kaynak kod ve medya aynı klasörde durmaz. Yirmi bir görsel eklendiğinde
`xp.js`'i bulmak zorlaşıyordu; `medya/` yalnız servis edilen dosyaları
tutar ve `build.py` de yalnız onu `dist/img/seviye/` içine **aynalar**
(kaynakta olmayan dosya dağıtımda da kalmaz).

## Rütbe kartları ve kademe sahneleri

`medya/` altında iki tür görsel var ve adları **ekranda yazan etiketten**
türer:

| Ne | Ad | Nerede görünür |
|---|---|---|
| **Rütbe kartı** (dikey) | `rutbe-5-2.webp`, `rutbe-k300.webp` | gösterimin kahramanı |
| **Nişan** (kartın küçük kardeşi) | `nisan-5-2.webp` | merdivendeki basamak kutusu |
| **Kademe sahnesi** (yatay) | `sahne-5.webp` | gösterimin arka planı, karartılmış |
| **Geçiş karesi** (tam ekran) | `gecis-5.webp` | kademe atlandığında, tek başına |
| **Arma** (kademenin adını taşır) | `bant-4.webp` | merdivende kademe bandının sağında |
| **Kademe mührü** (yuvarlak) | `onay-3.webp` | künyedeki küçük rozet + onay damgası |
| **Profil çerçevesi** | `cerceve-3.webp` | HKM profilinde, **isteğe bağlı** |
| Rütbe kartının idle videosu | `rutbe-5-2.mp4` | *ileride* — bkz. aşağıda |

**Kart ile nişan neden ayrı.** Kart dikey, yazılı ve bir sayfa kaplar;
nişan yüz piksellik bir kutu için çizilmiş amblemdir. Kartı merdivene
küçültmek, ne taşı ne yazısı okunan bir şey göstermekti.

**Sahne ile geçiş karesi neden ayrı.** Sahne bir DEKORDUR: kartın
arkasında durur, karartılır. Geçiş karesi gösterimin KENDİSİDİR —
«Altın → Yakut» diye iki kademeyi yan yana gösterir ve yüklendiğinde
kartı da banner'ı da gizler. Yalnız YENİ KADEMEDE istenir; basamak
(1.1 → 1.2) aynı kademenin içinde kalır ve bir geçiş değildir.

**Kademe mührü iki yerde, tek anlam.** `onay-N.webp` kullanıcının kademe
mührüdür: künyede kim olduğunu söyler, bir teklifi onaylarken de aynı
şeyi söyler (`UI.onayMuhru`). İki ayrı dosya tutmak, ikisinin bir gün
farklı kademe göstermesi demekti.

Adlandırma kuralı tek satırdır ve tek yerde yazılıdır
(`kademeler.js` → `LIFEOS.MEDYA_ADI`): etiket küçük harfe iner, nokta
tireye döner. `5.2` → `rutbe-5-2`, `K300` → `rutbe-k300`.

Sahne **kademeye** bağlıdır: 5.1, 5.2 ve 5.3 aynı `sahne-5.webp`
önünde gösterilir.

### Kilitli olan nasıl görünür — iki ayrı kural

Depo sahibinin kuralı şuydu: **«gelmediğimiz rankları göremeyelim.»**
Doğru kural, ama bir süre fazla ileri gitti: otuz yedi rozet ve on beş
basamak boş tarama kutusuydu ve yeni bir kullanıcı sistemdeki **yüz
görselden hiçbirini** görmüyordu. Ekran, kazanılacak bir şey olduğunu
bile söylemiyordu.

Şimdi ikisi ayrılıyor, çünkü **rozet ile rütbe kartı aynı şey değil**:

| | Ne olduğu | Kilitliyken |
|---|---|---|
| **Rütbe kartı / basamak** | bir AÇILIŞ — kademe başına üç tane, tam ekran bir kutlamayla gelir | **siluet** (`.siluet`): yalnız dış hat; rengi, taşı, yazısı görünmez |
| **Rozet** | bir HEDEF — otuz yedi tane, bakıp nereye çalıştığını gördüğün bir duvar | **rengi alınmış** (`.rozet-kilit`): madalya görünür, «henüz senin değil» der |

Gerekçe tek cümle: bir açılışı önden göstermek onu geldiği gün
değersizleştirir; bir hedefi gizlemek ise hedefi ortadan kaldırır.

**Siluetin kaynağını motor seçer** (`xp.js`, `merdiven` → `siluet`) ve
kaynak **yazısız** olmak zorunda: siluet alfayı korur, yani kaynağın
üzerindeki yazı da okunur kalır.

| Kademe | Kaynak | Neden |
|---|---|---|
| 1–5 | nişan | üzerinde yazı yoktur |
| 6 (Kutsal) | K madalyonu | üzerinde yalnız SAYI var («100») ve o sayı zaten kutunun altında yazılı |

Rütbe kartı 1–5 arasında kaynak **olamaz**: üzerinde kademenin adı
yazılı ve kilitli bir kartın silueti «YAKUT» yazısını okunur bırakırdı.

**Telefonda kare akışa girer, geniş ekranda tam ekran olur.** Kare
yatay (3:2), telefon dikey (1:2): `contain` ile ekranın ortasında
390×260'lık bir şerit oluyor ve üstündeki yazı sekiz piksele iniyor.
Orada sözü **banner taşır** — karenin RESMİ, banner'ın YAZISI. Geniş
ekranda kare zaten okunuyor ve banner çekiliyor, yani bu bir tekrar
değil. Telefonda sahne de çekilir: `object-position` orada işe
yaramıyor (dikey kutuda `cover` yatayda kırpar) ve sahnenin kendi
başlığı banner'ın arkasına düşüyordu.

**Kutlama, grinin kalkmasıdır.** Kazanılmamış rozet haftalarca ekranda
rengi alınmış hâlde durur; rozet kazanıldığında perde onu ÖNCE GRİ
açar, çeyrek saniye bekler, sonra bir saniyede rengine döndürür
(`@keyframes rozet-acil`). Madalyayı doğrudan renkli açmak, bekleyişin
karşılığını ödememek olurdu.

### Şu an ne var

Bu tablo **elle tutulmaz**; tek komutla sorulur:

```bash
python3 tools/rutbe.py --eksik    # katalog ne bekliyor, ne yok — ve ne fazla
```

Araç kataloğu (`kademeler.js`, `basarimlar.js`) node ile okur ve
beklenen her adı `medya/` altındakiyle karşılaştırır. Yapıyı Python'da
ikinci kez yazmak, iki kopyanın bir gün ayrışması demekti.

**İki yönü birden söyler.** Eksik dosya zararsızdır (ekran kendini
toparlar); **fazla** dosya değildir: adı bir harf yanlış yazılmış bir
görsel hem yerine oturmaz hem de «koydum ama görünmüyor» diye aranır.
Katalogun istemediği dosyalar ayrı bir başlıkta listelenir.

Bu satırlar yazıldığında katalog **113 görsel** bekliyordu ve **8
tanesi** eksikti:

| Eksik | Ne oluyor |
|---|---|
| `rutbe-k600 … rutbe-k1000` (5) | daire içinde etiket yazılıyor (K600) |
| `bant-5`, `bant-6` | Safir ile Kutsal'ın arması gelmedi; bant armasız kalıyor |
| `onur-usta` | Sistem Ustası rozeti gelmedi; HKM kartı görselsiz çiziliyor |

`bant-hukum` ve `rutbe-*.mp4` katalogda BEKLENMEZ, o yüzden bu listede
yoktur: birincisi adıyla saklanan bir teslimat (aşağıya bak), ikincisi
bayrağı kapalı bir özellik (bkz. idle video).

**`bant-hukum` neden ekranda yok.** Teslimatta beş arma geldi; dördünün
üzerinde kademenin adı birebir yazıyor (BRONZ, GÜMÜŞ, ALTIN, YAKUT).
Beşincisinin üzerinde **«HÜKÜM»** yazıyor, «SAFİR» değil. Safir'in
yerine konsaydı ekranda kademenin adı yanlış yazardı; dosya adıyla
saklanıyor ve Safir'in arması gelene kadar bekliyor.

**Eksik dosya hata değildir.** Kart yoksa banner kendi dairesini çizer,
sahne yoksa kademe renginden bir zemin kalır. Sistem hiçbir aşamada
bozulmaz; dosyalar geldikçe biraz daha tamamlanır.

### Görsel eklemek

Dosyaları doğru adla bir klasöre koy ve:

```bash
python3 tools/rutbe.py <klasör>     # kayıpsız: piksel değişmez
python3 tools/rutbe.py --liste      # medya/ altında ne var
```

Araç saydam kenar boşluğunu kırpar ve **kayıpsız WebP** yazar — görüntü
bit düzeyinde aynı kalır, dosya %30 küçülür. Küçültme ya da yeniden
kodlama YAPILMAZ; yer sorun olursa `--kayipli` vardır ve ölçüsü aracın
başında yazılı.

### İdle video — ileride

Rütbe kartlarının yerinde kısa, sessiz, döngülü videolar oynayacak.
Geldiklerinde:

1. `rutbe-5-2.mp4` gibi adlarla `medya/` altına koy
   (`tools/rutbe.py` videoyu dokunmadan kopyalar),
2. `kademeler.js` içinde `LIFEOS.RUTBE_VIDEO = true` yap.

Bayrak kapalıyken hiç video isteği yapılmaz — yani bugün her kutlamada
bulunamayacak bir dosya aranmaz. Açıkken video oynayana kadar kart
görünür; video hiç gelmezse kart olduğu yerde kalır.

## Gösterim nasıl çalışır

Bir rütbe kazanıldığında perde **hemen açılmaz**:

1. **Haberci** — sağ üstte üç saniyelik bir bildirim çıkar: hangi rütbe,
   kaç saniye kaldı, geri sayım çubuğu.
2. **Space** (ya da habercinin «Geç» düğmesi) o ekrana **hiç sokmaz**.
   Rütbe yine kazanılmıştır, defterde durur, rozet yenilenir — atlanan
   yalnız gösterimdir.
3. Üç saniye dolunca perde açılır: arka plan kararır, kademe sahnesi
   gelir, rütbe kartı ortada durur, altında kademe adı, etiket ve slogan.
4. Perde de geçilebilir: **Space**, **Esc** ya da sağ alttaki «Geç».
   Yeni kademede 7, yeni basamakta 5 saniye durur.

Hareket azaltma tercihinde **hiçbiri açılmaz**: bilgi sakin bir satırla
verilir. Tam ekran bir katman açıp odağı çalmak, o tercihi isteyen
kişinin istemediği şeydir.

## Rütbe ekranı — dört sekme

Perde bir **an**dır: kazanıldığı saniye görünür, geçer, bir daha
gelmez. Rütbe ekranı o anın **durağan** karşılığıdır — üç arayüzde de
gezinmede kendi bölümü var (Ayarlar ve Ofis gibi), `rutbe.js` tek
kaynaktan yayılır ve dört sekmeden oluşur:

| Sekme | Ne gösterir |
|---|---|
| **Şu an** | Kazanılmış rütbenin kartı, kademe · etiket · slogan, bugünkü ve toplam XP, bir sonraki basamağa kalan yol, bugünün iş iş dökümü |
| **Merdiven** | Yirmi beş basamağın hepsi — geçilen, şu an olunan, kilitli. Kutsal'ın K merdiveni de burada |
| **XP nereden gelir** | Katalogdaki her iş: kaç XP, hangi birimden, **nerede yapılır**, bugün tavanın ne kadarı dolmuş — ve o ekrana giden bir «Git» düğmesi |
| **Defter** | Son günlerin ham dökümü; sayının nereden geldiğini kanıtlar |

GÖRSELLER NEREDE GÖRÜNÜR — ve nerede GÖRÜNMEZ:

| Görsel | Nerede |
|---|---|
| Rütbe kartı | kutlama perdesinde · «Şu an» sekmesinde · merdivende **geçilen ve şu an olunan** basamakta |
| Kademe sahnesi | kutlama perdesinde · «Şu an» panelinin arkasında · merdivende **açılmış** kademenin başlık bandında |

**Gelmediğin rütbe görünmez.** Kilitli basamağın kartı ve kilitli
kademenin sahnesi ÇİZİLMEZ; onların yerinde kademe renginde mühürlü bir
kutu durur, üstünde etiketi ve eşiği yazılı. Merdivenin şekli görünür,
içeriği görünmez. Bu bir tasarım tercihi değil depo sahibinin kararıdır
ve iki kez teyit edildi: görülmemiş bir kartın görüntüsünü önden vermek,
gelindiği gün onu değersizleştiriyor.

Üçüncü sekme bu özelliğin sebebidir. «Bugün 40 XP aldım» bilgisi tek
başına işe yaramaz; **hangi işten** geldiği ve **nereye gidip** daha
fazlasını yapabileceğim bilgisi yarar. O yüzden katalogdaki her satır
artık üç alan daha taşır:

```js
{ id:'esp.kart', ad:'SRS kartı tekrarı', xp:1, tavan:60, birim:'kart',
  rota:'lang',                       // «Git» düğmesi nereye götürür
  nerede:'Dil › Dil Stüdyosu',       // insan diliyle yeri
  nasil:'Tekrarladığın her kart' },  // ne yapınca kazanılır
```

`rota` gerçek bir ekran kimliği olmak zorunda — bir test her satırın
üçünü de taşıdığını denetler, `smoke.js` de her rotanın açıldığını.
Ölü bir «Git» düğmesi, olmayan bir puandan beterdir.

Ekran motora iki erişimciyle konuşur; ikisi de `xp.js` içindedir ve
hiçbir şey **hesaplamaz**, yalnız defterde yazılı olanı okunabilir
hâle getirir:

- `XP.merdiven()` — yirmi beş basamağın hepsi, durumuyla
  (`gecildi` · `simdi` · `kilitli`) ve kart yoluyla birlikte.
- `XP.bugunku()` — bugün her işten kaç adet yapılmış, kaç XP gelmiş,
  tavanın ne kadarı dolmuş.

Rehberdeki eski «Seviye» sekmesi kaldırıldı: aynı bilgi iki yerde
durursa bir gün ikisi farklı şey söyler.

## Rozet, mühür ve onur — rütbeden AYRI üç şey

Rütbe TEK bir merdivendir: XP birikir, basamak geçilir. Rozet ise
**birbirinden bağımsız eşiklerdir** ve başka şeyler ölçer. Üçü birbirine
karışmasın diye rozetin XP ile hiçbir ilişkisi kurulmadı — XP'yi
çoğaltmaz, hızlandırmaz, eşiğini değiştirmez.

| | Ne | Kime ait | Nerede |
|---|---|---|---|
| **Rozet** | bir eşiği geçmenin kaydı | kullanıcıya | Rütbe › Başarımlar |
| **Mühür** | bir belgenin damgası | **belgeye** | HKM raporları |
| **Onur** | bütün alanların zirvesi | kullanıcıya | HKM › Profil |

### Rozet — yedi aile, 37 rozet

| Aile | Ölçü | Eşikler |
|---|---|---|
| Görev | toplam | 100 · 250 · 500 · 1000 · 2500 · 5000 |
| Gün | toplam | 25 · 50 · 100 · 250 · 500 · 1000 |
| Saat | toplam | 100 · 250 · 500 · 1000 · 2500 · 5000 |
| Odak | **günlük** | 1 → 10 saat |
| İstikrar | **seri** | 1 · 3 · 6 · 9 · 12 · 24 ay |
| Kusursuz | özel | gün · hafta · ay |

Dört ölçü türü ve dördü de ayrı: `toplam` ömür boyu birikir, `gunluk`
BİR GÜNE ait en iyi değerdir, `seri` kesintisiz ay sayısıdır, `ozel`
kendi kuralı olandır.

### Ekranda nerede görünür

| Nerede | Ne gösterir |
|---|---|
| Rütbe › **Şu an** | tek kart: kaç rozet, son kazanılan, sıradaki |
| Rütbe › **Başarımlar** | «Sıradaki» üçlüsü + yedi ailenin tamamı |
| **Günlük rapor** | o günün odak rozeti, eylemlerin yanında |
| HKM › **Profil** | dört alanın toplamı ve onur rozeti |

**«Sıradaki»** en çok yaklaşılan üç rozeti gösterir ve **orana** göre
seçer, eşiğe göre değil: 90 saatlik biri için «100 saat» (%90),
«250 görev» (%12) rozetinden daha yakındır. **Aile başına bir tane**
alınır — sıralama tek başına bırakıldığında üçü de aynı aileden
geliyordu («3 saat · 4 saat · 5 saat odak»), yani tek hedef ve beş aile
gizli.

**Rozete dokunmak** ayrıntısını kendi ailesinin altında açar: ne
ölçtüğü, kazanıldıysa tarihi, kazanılmadıysa ne kadar kaldığı. Tekrar
dokunmak kapatır. Önce `div` + `title` idi ve telefonda hiçbir
karşılığı yoktu.

### Defter neden AY ÖZETİ üstüne kurulu

XP defteri gün kırılımını 120 günde bir budar. XP için doğru: toplam
ayrı alanda durur. Rozet için yetmez — «1000 gün» üç yıllık bir sayı,
«24 ay istikrar» iki yıllık bir seri; ikisi de 120 günlük pencereden
okunamaz. Ham veriyi her açılışta taramak ise ölçülmüş bir bedeldi.

Her ay için dört sayı saklanır — `{ gun, dakika, gorev, kusursuz }` — ve
bu özet **asla budanmaz**. Yirmi beş yıl = 300 satır ≈ 12 KB. Toplam
özetin toplamı, seri özetin sırası, kusursuz ay özetin kendisidir.

### Kazanılmış rozet GERİ ALINMAZ

Sayaç düşebilir (kayıt silinirse düşer), rozet düşmez. Rozet bir DURUM
değil bir **OLAY**dır: «şu gün 500 saate ulaştın» cümlesi, sonradan veri
silinse de doğru kalır. Sayacın düştüğünü ekran zaten gösterir.

### «Kusursuz» ne demek

O modülün **günlük beklenen** işlerinin hepsinin yapıldığı gün.
«XP tavanının dolması» denenmedi ve bilerek: tavan bir ÜST SINIRDIR,
hedef değil — «bugün 420 XP'ye ulaş» demek §1.6'yı kırardı.

Nadir işler (deneme, tahlil, yazı taslağı) girmez. SPİ'de **antrenman da
girmez** ve bu bir sağlık kararıdır: dinlenme günü eksiklik değildir.

### Odak iki yerde, iki ayrı şey

| Nerede | Ne söyler |
|---|---|
| Rütbe › Başarımlar | **ömür boyunca** görülen en iyi gün |
| Günlük rapor, eylemlerin yanında | **bu günün** kendisi |

İkisi aynı görseli kullanır ama aynı şeyi söylemez. Günlük rapora
ömürlük rekoru basmak, o günün raporunu o günden başka bir şey hakkında
yapardı.

**Rekor DÜZELTİLEBİLİR — ama geçmişin altına düşemez.** «Ömür boyunca
en iyi gün» bir sayaçtır ve sayaç düşebilir (düşmeyen şey rozettir).
Bir süre düşmüyordu: yalnız büyüyen bir işaretti ve 70 dakika yerine
700 yazılan bir gün düzeltilse bile ekranda «11 saat» yazmaya devam
ediyor, on saatlik rozet artık var olmayan bir veriyle kazanılmış
kalıyordu.

Defterde iki alan durur:

| Alan | Ne | Ne zaman değişir |
|---|---|---|
| `enIyi.odakDakika` | ekrana çıkan değer | **her yazmada** yeniden hesaplanır: penceredeki günlerin en büyüğü ile tabanın büyüğü |
| `enIyi.odakTaban` | budanmış geçmişten kalan taban | bir gün pencereden çıkıp silinmeden **hemen önce** |

Gün kırılımı **yazılabilir pencere kadar** tutulur — `PENCERE_GUN`,
yedi gün — ve ondan eskisi silinir; o günlerin en büyüğü bir daha
bulunamaz. Silmeden önce tabana yazılır, böylece rekor düzeltilebilir
ama **geçmişin altına düşemez**.

**Düzeltme penceresi bir haftadır.** Bir hafta içinde fark edilen bir
yanlış tam olarak düzelir; daha eskisi tabana yazılmış olur ve artık
düşmez. Pencereyi büyütmek defteri büyütür; yedi gün, yanlış girilen
bir günü fark etmeye yeten süre olarak seçildi ve XP defterinin
yazılabilir penceresiyle aynıdır.

> Bu, XP defterinin **120 günlük** gün kırılımıyla karıştırılmamalı:
> o başka bir defterin başka bir penceresidir (`xp.js`, `DETAY_GUN`).
> Başarım defterinde gün kırılımı yalnız yazılabilir pencere için
> tutulur, çünkü ömür boyu toplam zaten AY ÖZETİNDE durur.

Eski defterler göçerken taban **ölçülür, uydurulmaz**: rekoru tutan gün
hâlâ pencerede bulunabiliyorsa taban 0'dır (düzeltme tam çalışır),
bulunamıyorsa kayıtlı değer taban olur (budanmış, korunur).

### HKM profili — toplamı yalnız merkez görür

Üç arayüz birbirini görmez (AGENTS.md §1.4), o yüzden «bütün alanlarda
5000 saat» gibi bir rozeti hiçbir modül kendi başına veremez. Modüller
sayaçlarını işaretle gönderir (`badge_hours`, `badge_days` …), merkez
toplar.

Üç kural, üçü de bilerek:

1. **Merkezin kendi XP'si yoktur.** Kademe yan yana durur; toplanmaz,
   ortalanmaz, sıralanmaz.
2. **Eksik veri sıfır değildir.** Sayaç göndermeyen modül toplama 0 ile
   girmez ve kaç modülün konuştuğu sayfada yazar.
3. **Her sayaç toplanmaz.** Odak ve istikrarda en yüksek alınır —
   toplamak «üç sistemde 3'er saat odaklandım, demek ki 9 saat» demekti.

**Sistem Ustası** dört şart birden ister: 1000 saat · 2500 görev ·
365 gün · 12 ay kesintisiz. Biri eksikse verilmez, ama kazanılmamışken
de şartlarıyla gösterilir.

### Dosya adları

```
basarim-gorev-500.webp      rozet    (aile + eşik)
basarim-odak-7.webp
basarim-kusursuz-ay.webp
muhur-saglik.webp           mühür    (alan)
onur-usta.webp              onur
```

Önek `basarim-`, `rozet-` değil: `rozet-1.png` … `rozet-6.png` zaten
KADEME rozetidir (`xp.js`, `panelHtml`). İki ayrı kavramı tek önekle
adlandırmak, bir gün birinin diğerinin dosyasını çağırması demekti.
Kullanıcıya hâlâ «rozet» denir; ayrım dosya adında, ekranda değil.

## XP nereden gelir — türetilir, tetiklenmez

Hiçbir ekran «bana puan ver» demez. Her sistem, o günün kendi
verisinden bir **sayım** çıkarır (`core/xpsayim.js`) ve motor defteri o
sayıma **eşitler** (`XP.esitleCok`). Doktrin zaten bu: sayıyı ve kararı
kod üretir.

Eşitleme **yalnız bugüne değil, yazılabilir pencerenin tamamına**
bakar (bugün + 7 gün geriye). Dünkü antrenmanı bu sabah girdiğinde puan
düne yazılır; sekiz gün TEK GEÇİŞTE okunur, en çok bir kez yazılır.

Değişiklik olduğunda **sayfa yeniden çizilmez**: yalnız rozet ve panel
düğümleri tazelenir (`XP.tazele`). Tam çizim, tıklanan öğeyi
kullanıcının altından çekiyordu.

Hareket azaltma tercihinde seviye kutlaması **perde açmaz**; bilgi sakin
bir satırla verilir. Tam ekran bir katman açıp odağı çalmak, o tercihi
isteyen kişinin istemediği şeydir.

Üç şey bedavaya gelir:

- **Bir ekran unutulamaz** — sayım verinin kendisinden okunur.
- **Silinen kayıt puanını bırakmaz** — sayım düşer, XP düşer.
- **Tekrar çalışması zararsızdır** — eşitleme iki kez çağrılabilir.

Katalogdaki her işin sayımda bir karşılığı, sayımdaki her kimliğin
katalogda bir satırı olmak zorunda — iki test bunu denetler. Biri
diğerinden önce değişirse paket kırmızıya döner.

| Sistem | Ne sayılıyor |
|---|---|
| AYS | bloklara yazılan + serbest soru, deneme, biten plan bloğu, tahmin kaydı, gün |
| SPİ | antrenman, öğün, uyku kaydı, girilmiş ölçüm alanı, tahlil, gün |
| ESP | SRS tekrarı, pratik dakikası, atomik not, yazı taslağı, gün |

> Katalogdaki her satırın burada bir karşılığı olmalı, ve tersi de
> doğru. Karşılığı olmayan bir satır, hiç kazanılamayan bir puandır.

## XP nasıl sayılır — üç kural

1. **Her etkinliğin günlük tavanı vardır.** `tavan:null` «tavan yok»
   değil **«günde bir kez»** demektir (gün kapanışı, beslenme günü
   gibi). Tavansız bir sayaç bir gün otuz kez tıklanır ve anlamını
   kaybeder.
2. **Geriye dönük puan toplanmaz.** Geleceğe hiç, geçmişe en fazla
   **bir hafta** yazılır — dünkü antrenmanı bu sabah girmek olağandır,
   geçen ayın gününe puan yazmak değildir.
3. **XP hiçbir kararı vermez.** Ne plan, ne reçete, ne uyarı ona bakar.
   XP yalnızca kullanıcının kendi emeğini görmesidir.

## Defter ne kadar yer kaplar — ölçüldü

Tahmin değil ölçüm: gün kırılımı **120 günle** sınırlıdır, yani defter
büyümez, **tavanı vardır**. Tavan hâli — budama penceresinin her
gününde katalogdaki her etkinlik yazılı — üç sistemde şu kadar eder:

| Sistem | Etkinlik | `seviye` anahtarı (tavan) |
|---|---:|---:|
| AYS | 5 | 13 117 bayt (~12,8 KB) |
| SPİ | 6 | 15 157 bayt (~14,8 KB) |
| ESP | 5 | 12 397 bayt (~12,1 KB) |

Gerçek bir kullanıcının defteri bundan **küçüktür**: hiç kimse her gün
katalogdaki her işi yapmaz. Karşılaştırma için: tarayıcının tek kökene
verdiği kota ~5 MB. Yani seviye defteri, bir yılın sonunda bile o
kotanın **binde üçünden azını** kullanır.

Bu sayı `python3 tools/sayilar.py` ile tazelenmez — ölçüm bir kereliktir
ve katalog ya da `DETAY_GUN` değişmedikçe değişmez. İkisinden biri
değişirse burası da yeniden ölçülür.

Defter olay listesi değil **gün × etkinlik** toplamıdır ve her kayıt
`[adet, kazanılan XP]` tutar — kazanılan XP yazıldığı anda **donar**.
Fiyat değişir, kaydedilmiş işlem değişmez; bir muhasebe defteri böyle
çalışır. Gün kırılımı son 120 gün için saklanır, daha eskisi silinir.
Toplam XP ayrı ve tek yönlü bir sayaçtır: budama onu değiştirmez, yani
seviye geçmiş silindi diye düşmez. Arşiv saklanan bir sayaç değil bir
**çıkarmadır** (`toplam − defterde duran günler`), bu yüzden «kırılım +
arşiv = toplam» katalog değişse de bozulmaz.

## Üçü ve HKM

HKM'nin **kendi XP'si yoktur ve olmamalı**: üçünün üstünde değil
yanındadır. Üç arayüz işaretle (`core/beacon.js`) günlük özetine dört
sayı daha ekler — `xp_today`, `xp_total`, `level_tier`, `level_sub` —
ve HKM panosunun *Sistemler* sayfasında üçünün kademesi yan yana
görünür. Kademe **adı** gönderilmez, numarası gönderilir: panonun kendi
doktrini «renk yok, süs yok, sözcük var» der ve merkezde ikinci bir ad
kopyası tutmak, iki kopyanın bir gün ayrışması demekti.

Bu bağ da tek yönlüdür: HKM kapalıyken hiçbir sistemin seviyesi
etkilenmez.

## Ses — marka girişi

Bu bölüm **marka açılış videosunu** anlatır (`img/brand/intro.mp4`);
rütbe gösteriminin sesi yoktur.

Videolar **sesli** oynar. Tarayıcı, kullanıcı sayfaya dokunmadan sesli
otomatik oynatmayı reddederse video sessiz başlar, sağ altta «sesi aç»
düğmesi belirir ve ilk dokunuşta ses kendiliğinden açılır. Kullanıcı sesi
kendi kapattıysa tercihi `lifeos.perde.ses` anahtarında saklanır ve üç
arayüzde de geçerlidir.

## Videonun kenarı — marka girişi

Videonun arka planı tam siyah olmasa da kenarı görünmez: perde, arkaya
aynı videonun bulanık ve büyütülmüş bir kopyasını koyar (`perde__ortam`),
kenar kendi renginin içinde kaybolur. Kapatmak için perdeye
`data-ortam="kapali"`.
