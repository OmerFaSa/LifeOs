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

| Kademe | Ad | Basamaklar | Bu kademeyi bitiren toplam XP |
|---:|---|---|---:|
| 1 | Bronz | 1.1 · 1.2 · 1.3 | 1 200 |
| 2 | Gümüş | 2.1 · 2.2 · 2.3 | 3 900 |
| 3 | Altın | 3.1 · 3.2 · 3.3 | 9 000 |
| 4 | Yakut | 4.1 · 4.2 · 4.3 | 18 000 |
| 5 | Safir | 5.1 · 5.2 · 5.3 | 34 500 |
| 6 | **Kutsal** | K100 … K1000 | 6 863 500 |

### Kutsal'da nokta yoktur

Altıncı kademe bir varış değil bir devamdır; sahnesinde yazdığı gibi
**«daima daha yükseğe»**. Basamakları `6.1` diye değil `K100`, `K200`,
… `K1000` diye adlanır ve her biri bir öncekinin yaklaşık **1,85 katı**
emek ister.

| Rütbe | Kümülatif eşik | Günde ~250 XP ile |
|---|---:|---|
| K100 | 46 500 | ~6 ay |
| K200 | 68 500 | ~9 ay |
| K300 | 108 500 | ~1,2 yıl |
| K400 | 183 500 | ~2 yıl |
| K500 | 323 500 | ~3,5 yıl |
| K600 | 583 500 | ~6,4 yıl |
| K700 | 1 063 500 | ~11,7 yıl |
| K800 | 1 963 500 | ~21,5 yıl |
| K900 | 3 663 500 | ~40 yıl |
| **K1000** | **6 863 500** | **~75 yıl** |

**K1000 bilerek ulaşılmaz.** Bir sistemin günlük tavanı ~430 XP; o
tavanın tamamını **her gün, hiç atlamadan** alan biri için bile kırk üç
yıl eder. Tepesi görünen bir merdiven, tepesine varıldığı gün biten bir
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
  perde.js        rütbe gösterimi ve haberci
  seviye.css      perde, haberci, rozet biçimleri
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
| **Kademe sahnesi** (yatay) | `sahne-5.webp` | gösterimin arka planı, karartılmış |
| Rütbe kartının idle videosu | `rutbe-5-2.mp4` | *ileride* — bkz. aşağıda |
| Küçük rozet (kare) | `rozet-5.png` | künye ve alt bant; **yok**, numaraya düşüyor |

Adlandırma kuralı tek satırdır ve tek yerde yazılıdır
(`kademeler.js` → `LIFEOS.MEDYA_ADI`): etiket küçük harfe iner, nokta
tireye döner. `5.2` → `rutbe-5-2`, `K300` → `rutbe-k300`.

Sahne **kademeye** bağlıdır: 5.1, 5.2 ve 5.3 aynı `sahne-5.webp`
önünde gösterilir.

### Şu an ne var

| Dosya | Durum |
|---|---|
| `rutbe-1-1 … rutbe-5-3` | **15'i de var** |
| `sahne-1 … sahne-6` | **6'sı da var** |
| `rutbe-k100 … rutbe-k1000` | yok — daire içinde etiket yazılıyor (K300) |
| `rozet-1 … rozet-6` | yok — künyede kademe numarası çiziliyor |
| `rutbe-*.mp4` | yok — bkz. idle video |

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
