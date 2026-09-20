<p align="center"><img src="brand/life/logo.png" alt="LifeOS" width="180"/></p>

# LifeOS

Tek kişinin gündelik hayatını yöneten üç bağımsız sistem.

<!-- Her sistemin kendi marka gorseli kendi src/img/brand/logo.png dosyasindadir
     (bkz. brand/OKU.md); burada yalniz kucuk bir referans olarak gosterilir.
     Dosya degisirse bu satirlar hic dokunulmadan guncel kalir. -->
| Klasör | Sistem | Alan | Belge |
|---|---|---|---|
| [`AYS/`](AYS/) | <img src="AYS/src/img/brand/favicon.png" width="20" valign="middle"/> **Akademik Yol Sistemi** | Sınav hazırlığı, çalışma düzeni, deneme analizi | [`AYS/src/OFIS.md`](AYS/src/OFIS.md) |
| [`SPI/`](SPI/) | <img src="SPI/src/img/brand/favicon.png" width="20" valign="middle"/> **Sağlık Performans İzleyicisi** | Sağlık, beslenme, hareket, sağlık ekonomisi | [`SPI/src/MIMARI.md`](SPI/src/MIMARI.md) |
| [`ESP/`](ESP/) | <img src="ESP/src/img/brand/favicon.png" width="20" valign="middle"/> **Entelektüel Seviye Planlayıcı** | Dil, felsefe, müzik, diksiyon, okuma, yazı, tarih | [`ESP/src/MIMARI.md`](ESP/src/MIMARI.md) |

Yanlarında dördüncü, **isteğe bağlı** bir katman durur:

| Klasör | Katman | Durum | Belge |
|---|---|---|---|
| [`HKM/`](HKM/) | <img src="HKM/brand/favicon.png" width="20" valign="middle"/> **Hayat Kontrol Merkezi** | merkez katman: brifing, çapraz bulgu, etki, sohbet, niyet kuyruğu, ritim (312 test) | [`HKM/MIMARI.md`](HKM/MIMARI.md) |

HKM'nin kendi yüzü (`HKM/web/index.html`) İÇERİK ikonu kullanmaz — panonun
kendi doktrini "ikon yok, sözcük var" der (bkz. dosyanın baş yorumu). Markanın
kendisi bir içerik ikonu değildir: sekme ikonu ve künyedeki küçük görsel
`HKM/brand/` klasöründen gelir, panonun içi yine sözcüklerle çalışır.

HKM üçünün **üstünde değil yanındadır**: üç sistem onun var olduğunu bilmez ve
o kapalıyken hiçbiri bozulmaz. Tek bağ, her arayüzdeki `core/beacon.js`
işaretidir: **varsayılan kapalı**, tek yönlü, hiçbir çizimde çalışmayan ve
hiçbir kaydı bekletmeyen bir en-iyi-çaba gönderimi. Giden şey günün
özetidir — birkaç sayı, her biri kesinlik etiketiyle; içerik gitmez.

İki tarafın gerçekten konuşup konuşmadığını `node tools/entegre.js`
denetler: HKM'yi geçici bir veritabanıyla ayağa kaldırır, üç arayüzü gerçek
tarayıcıda açar, işareti açıp gönderir, HKM'nin üç modülü de gördüğünü
doğrular — ve HKM kapalıyken hiçbir arayüzün bozulmadığını. Bu denetim
yazıldığı gün, iki tarafın da kendi testlerinde geçip birbiriyle
konuşamadığı bir boşluğu buldu (tarayıcının CORS ön-isteği).

> **Sırada ne var:** [`GELISTIRME_RAPORU.md`](GELISTIRME_RAPORU.md) —
> ölçülmüş bulgular, öncelik sırası ve bilinçli olarak yapılmayacaklar.
> Açık teknik borçlar `NOTLAR.md` §19'da.

## Üçü neyi paylaşır

- **Doktrin.** Kural motoru otoritedir: sayıyı hesap üretir, dil modeli yalnızca
  cümleye çevirir. Model kapalıysa sistem kapanmaz.
- **Ofis.** Bir ekip: dikey uzmanlar ve bir orkestratör (SPİ'de beş, ESP'de
  dokuz ajan). Her ajan yalnız kendi alanına bakar, çelişkiyi patron çözer.
- **Tasarım dili.** Aynı jetonlar, aynı kart/düğme/tablo dili, aynı altı palet
  ve iki tema.
- **Bağımlılıksızlık.** Ne çerçeve, ne derleyici, ne paket. Tarayıcıda düz
  JavaScript. Test betikleri için yalnızca Playwright.
- **Seviye sistemi.** Altı kademe (Bronz → Kutsal), her kademede üç basamak.
  Ortak olan TANIMDIR — ad, renk, eşik: "Altın" üçünde de aynı şeydir. Her
  sistemin **kendi seviyesi** vardır ve kendi işleriyle dolar: ESP'de pratik
  yaparak, SPİ'de antrenman kaydederek, AYS'de soru çözerek. Puanlar karışmaz.
  XP tetiklenmez, o günün verisinden **türetilir**; silinen kayıt puanını
  bırakmaz. Üç sistemin günlük tavanı birbirine yakın tutulur (430 / 410 /
  420) — aynı kademe üçünde de aynı emeği istesin diye. HKM'nin kendi XP'si
  yoktur, üçünün kademesini yalnızca **gösterir**.

  Altı kademe: **Bronz · Gümüş · Altın · Yakut · Safir · Kutsal.** İlk
  beşinde üçer basamak vardır ve noktayla yazılır (`5.2`); her basamağın
  kendi **rütbe kartı** vardır. Kutsal'da nokta yoktur: basamakları
  `K100`'den `K1000`'e gider ve her biri bir öncekinin yaklaşık iki katı
  emek ister — K1000 bilerek ulaşılmaz, çünkü tepesi görünen bir merdiven
  varıldığı gün biter.

  Rütbe kazanıldığında önce sağ üstte **üç saniyelik bir haberci** çıkar;
  **Space** o ekrana hiç sokmaz. Geçilmezse arka plan kararır, kademenin
  sahnesi gelir ve rütbe kartı gösterilir.

  Üç arayüzde de gezinmede kendi **Rütbe** bölümü vardır: kazanılmış
  rütbenin kartı, yirmi beş basamaklık merdivenin tamamı, ham defter — ve
  **XP'nin hangi işten geldiği**: her iş için kaç puan, hangi birimden,
  hangi ekranda yapıldığı, bugün tavanın ne kadarının dolduğu ve o ekrana
  giden bir düğme.

  **Rozetler** rütbeden ayrıdır ve başka şey ölçer: yedi aile, 37 rozet
  — görev, gün, saat, odak, istikrar, kusursuz. Her modül kendi verisinden
  sayar; kazanılmış rozet sayaç düşse de geri alınmaz, çünkü rozet bir
  durum değil bir **olay**dır. Günün odak rozeti günlük raporda,
  eylemlerin yanında durur.

  **HKM profili** dördünün toplamını gösterir — üç arayüz birbirini
  görmediği için o toplamı yalnız merkez yapabilir. Kademeler yan yana
  durur, toplanmaz. Zirvede tek bir onur rozeti var: **Sistem Ustası**,
  dört şart birden ister.

  **Mühür** kazanılmaz, **basılır**: bir belgenin damgasıdır. Beş alan —
  eğitim, sağlık, entelektüellik, yönetim, yönetici — HKM'nin günlük
  özetine, haftalık raporuna ve karar belgelerine.

  Tek kaynak `brand/seviye/`; üçe `python3 tools/seviye.py --yay` ile
  dağıtılır (bkz. [`brand/seviye/OKU.md`](brand/seviye/OKU.md)).

## Üçü neyi paylaşmaz

Kodları ayrıdır ve birbirini import etmez:

| | AYS | SPİ | ESP |
|---|---|---|---|
| Ad alanı | `R.*` | `SP.*` | `ESP.*` |
| Depo anahtarı | `rota84285.v2` | `spi.v1.<profil>` | `esp.v1.<profil>` |
| Test paketi | `AYS/src/tests/` | `SPI/src/tests/` | `ESP/src/tests/` |
| Dev sunucu portu | 4173 | 4183 | 4193 |
| Dağıtım | `AYS/dist/rota.html` | `SPI/dist/spi.html` | `ESP/dist/esp.html` |
| Seviye defteri | kendi deposunda | kendi deposunda | kendi deposunda |

Birinde yapılan bir değişiklik diğerini bozamaz. Üç proje ayrı ayrı
geliştirilir.

**Paylaştıkları şey derleme zamanında paylaşılır, çalışma zamanında
değil.** İki kaynak üçe birden dağıtılır ve ayrışmaları denetlenir:

| Tek kaynak | Ne | Dağıtan |
|---|---|---|
| [`brand/seviye/`](brand/seviye/) | kademeler, XP motoru, perde | `python3 tools/seviye.py --yay` |
| [`brand/ortak/`](brand/ortak/) | `base.css`, `layout.css`, `designs.css` | `python3 tools/ortak.py --yay` |

İkisinin de `--denetle` biçimi CI'da koşar: bir kopya elle düzenlenirse
sessiz kalmaz. Üretilen kopyalar başlıklarında bunu yazar.

## Çalıştırma

**Hepsi tek komutla** (deponun kökünden):

```bash
python3 baslat.py
```

Üç sistemi ve HKM'yi tek süreçte açar, tarayıcıda giriş sayfasını
gösterir: <http://127.0.0.1:4180>. Çift tıklamak isteyene
`BASLAT.command` (macOS) · `BASLAT.bat` (Windows) · `baslat.sh` (Linux).

| | adres |
|---|---|
| Giriş | `127.0.0.1:4180` |
| AYS | `127.0.0.1:4173` |
| SPİ | `127.0.0.1:4183` |
| ESP | `127.0.0.1:4193` |
| HKM | `127.0.0.1:4200` |

Tek süreç ama **ayrı kapılar**: tarayıcı depolaması kökene bağlıdır ve
köken porttur. Üçünü tek porta toplamak iki şeyi kırardı — var olan veri
başka bir kökende kalıp «silinmiş» görünürdü, ve üç sistem tek
localStorage kotasını (~5 MB) paylaşırdı. `python3 baslat.py --hkmsiz`
HKM'yi hiç açmaz; üç sistem bundan etkilenmez.

## Telefonda kullanım

**Seçilen yol: tek dosya + elle yedek.** Telefon burada İKİNCİL cihazdır:
ara sıra bakmak için. Kod yok, altyapı yok — üç adım.

1. Tek dosyalık sürümü üret (her sistem kendi klasöründen):

   ```bash
   cd AYS && python3 build.py     # -> AYS/dist/rota.html
   cd SPI && python3 build.py     # -> SPI/dist/spi.html
   cd ESP && python3 build.py     # -> ESP/dist/esp.html
   ```

2. Dosyayı telefona taşı (bulut, e-posta, kablo — fark etmez) ve
   tarayıcıda aç. Tek dosyadır: CSS, JS, yazı tipleri ve marka görselleri
   içindedir, dışarıdan hiçbir şey indirmez.
3. Tarayıcının «Ana ekrana ekle» seçeneğiyle kısayol yap. Dosya tek
   başına açıldığında da doğru ikonu ve adı taşır: manifest, tema rengi,
   `apple-mobile-web-app-*` etiketleri ve **gömülü ikon** dosyanın
   içindedir — yanında `img/` klasörü olmasa bile.

   *Dürüst sınır:* gerçek bir PWA kurulumu (tam ekran, ayrı uygulama
   penceresi) tarayıcıların çoğunda **`http(s)` üzerinden** servis
   edilmeyi ister; `file://` ile açılan bir dosyada çoğu tarayıcı
   yalnız bir kısayol oluşturur. Uygulamanın kendisi iki durumda da
   eksiksiz çalışır — fark yalnız kabuğundadır.

   (Tek dosya sürümü uzun süre bu etiketlerin hepsini kaybediyordu;
   `build.py` artık onları kaynaktan taşıyor ve duman testi her koşumda
   arıyor.)

**Veriyi taşımak — yedek dosyası.** Her sistemde *Rehber* ekranında
(ESP'de ayrıca *Profil*) iki düğme var:

| | indir | yükle |
|---|---|---|
| AYS | *Rehber* → «Yedek al (JSON)» | *Rehber* → «Yedekten yükle» |
| SPİ | *Rehber* → «Yedek indir» | *Rehber* → «Yedek yükle» |
| ESP | *Profil* → «Yedek indir» | *Profil* → «Yedekten yükle» |

Dizüstünde yedeği indir, telefona taşı, telefonda yükle. Ters yön de
aynı. Yanlış yöne yüklersen: içe aktarma **geri alınabilir** — *Rehber*
ekranındaki «Bu içe aktarmayı geri al».

> ### İKİ CİHAZ = İKİ AYRI DEFTER
>
> Bunu bilerek yazıyoruz, çünkü bilmeden kullanmak veri kaybettirir.
> Telefondaki kopya ile dizüstündeki kopya **birbirini görmez**. Tarayıcı
> depolaması kökene bağlıdır ve iki cihaz iki ayrı kökendir. İki tarafta
> da kayıt girersen, bir sonraki yedek yüklemesi birini diğerinin üstüne
> yazar.
>
> Pratik kural: **bir taraf yazar, öteki bakar.** Telefonda yalnız
> bakıyorsan sorun yok; telefonda da kayıt girmeye başladıysan, o günün
> sonunda hangi tarafın gerçek olduğuna karar et ve tek yönde taşı.
>
> Yerel kullanımda veri **cihaza bağlıdır**; cihazlar arası senkron yalnız
> uygulama Claude Artifact olarak yayımlandığında çalışır
> (`core/store.js`, `window.claude.use('db')`). `python3 baslat.py` ile
> açılan yerel sürümde mod **her zaman** `local`'dir ve bu bir arıza
> değildir. Yerelde tek köprü yedek dosyasıdır.

**Neden yerel ağ modu yok.** Sunucular bilerek `127.0.0.1`'e bağlıdır
(`sunucu.py`). Dışarı açmak verinin şifresiz servis edilmesi ve yerel ağ
güvenliğinin kullanıcıya geçmesi demektir; «ara sıra bakıyorum» bu bedeli
karşılamaz. Telefon birincil cihaz hâline gelirse doğru cevap bu bölüm
değil, `baslat.py --ag` bayrağıdır (GELISTIRME_RAPORU.md İP-4, Seçenek A).

Tek tek çalıştırmak da mümkün — her proje kendi klasöründen:

```bash
python devserver.py          # geliştirme sunucusu
python build.py              # tek dosyalık dağıtım üretir
node tools/runtests.js       # birim testleri
```

Üç sistemin **üçü de** gerçek uygulamayı açıp gezen denetimler taşır. Bir
denetim bir sistemde bir hata bulduysa, aynı denetim ötekilere de taşınır:

```bash
node tools/smoke.js          # ekranları ve sekmeleri gezer, akışları dener
node tools/a11ycheck.js      # erişilebilirlik — çizilen sayfadan
node tools/palettecheck.js   # bütün paletlerde kontrastı ölçer
node tools/layoutcheck.js    # 390 pikselde taşma ve 24px dokunma hedefi
node tools/perfcheck.js      # DOKUZ AYLIK veriyle çizim maliyeti
node tools/ledgercheck.js    # defter düzenini denetler (yalnız SPİ)
```

`perfcheck` özellikle dokuz aylık ufka göre kurulur: 270 gün kaydı, yüzlerce
deneme/tahlil/kart. Boş bir ekran hızlı çizilir; asıl soru dokuz ayın sonunda
ekranların hâlâ açılıp açılmadığıdır.

Bir denetim geçtiğinde de **sayı gösterir**: hiçbir şey ölçmeyen bir betik de
«geçti» yazar. Bu sayılar belgeye elle yazılmaz — elle yazılan sayı, yazıldığı
gün doğrudur ve sonra sessizce eskir. `python3 tools/sayilar.py --tam --yaz`
araçları koşturur ve her aracın **kendi son satırını** aşağıya yazar:

<!-- SAYILAR:baslangic -->

_Bu bölüm elle yazılmaz: `python3 tools/sayilar.py --yaz` araçları koşturur ve her aracın kendi son satırını buraya yazar. Son koşum: 2026-09-18._

| Araç | AYS | SPI | ESP |
|---|---|---|---|
| `runtests.js` | 1192/1192 gecti | 941/941 gecti | 759/759 gecti |
| `smoke.js` | Duman testi temiz — 2 hedefte 38 ekran, 44 sekme gezildi. | Duman testi temiz — 2 hedefte 26 ekran, 72 sekme gezildi. | Duman testi temiz — 2 hedefte 30 ekran, 190 sekme gezildi. |
| `a11ycheck.js` | (1 bilinen eksik izin listesinde — bkz. tools/a11ycheck.js) | (1 bilinen eksik izin listesinde — bkz. tools/a11ycheck.js) | (3 bilinen eksik izin listesinde — bkz. tools/a11ycheck.js) |
| `palettecheck.js` | 924 kontrast ölçümü AA geçti — en dar pay: ucuncul/zemin 4.52 (asgari 4.5) — light/indigo/today | 1694 kontrast olcumu AA gecti — en dar pay: ucuncul/zemin 4.52 (asgari 4.5) — light/indigo/today | 1848 kontrast ölçümü AA geçti — en dar pay: ucuncul/zemin 4.52 (asgari 4.5) — light/indigo/today |
| `layoutcheck.js` | Telefon düzeni temiz — 390 pikselde 41 yerde taşma yok, bütün dokunma hedefleri 24px ve üstü. | Telefon düzeni temiz — 390 pikselde 49 yerde taşma yok, bütün dokunma hedefleri 24px ve üstü. | Telefon düzeni temiz — 390 pikselde 110 yerde taşma yok, bütün dokunma hedefleri 24px ve üstü. |
| `perfcheck.js` | Bütün ekranlar bütçede — en ağırı office 38.1 ms (bütçe 120). | Bütün ekranlar bütçede — en ağırı office 22.7 ms (bütçe 120). | Bütün ekranlar bütçede — en ağırı office 47 ms (bütçe 100). |
| `ledgercheck.js` | — | 32 ekran/sekmede defter düzeni temiz | — |
| `designcheck.js` | — | beş düzen temiz — 460 ekran/genişlik kombinasyonu bakıldı | — |
| `tasarimcheck.js` | — | 21 tasarım örneği temiz | — |
| `loadcheck.js` | yuk denetimi temiz (5 yillik veri) | yuk denetimi temiz (5 yillik veri) | yuk denetimi temiz (5 yillik veri) |

| Depo denetimi | Sonuç |
|---|---|
| `HKM tests` | 314/314 test gecti |
| `HKM perf` | Bütün sorgular bütçede. |
| `HKM yuz` | HKM yüzü temiz — 40 görünümde taşma yok, bütün hedefler 24px ve üstü, etiketler yerinde, kontrast AA. |
| `entegre.js` | Butunlesme temiz: uc arayuz de HKM ile konustu, HKM kapaliyken hicbiri bozulmadi. |
<!-- SAYILAR:bitis -->

Üç sistem de artık **kendini denetleyen bir katman** taşır — dışarıdan gelen
eleştirilerin koda dönüşmüş hâli:

| Katman | Ne sorar | Nerede |
|---|---|---|
| **Sürtünme** | Sistemi yönetmek, çalışmanın yerine mi geçiyor? | AYS + SPİ + ESP `core/friction.js` |
| **Goodhart nöbetçisi** | Çaba arttı da sonuç yerinde mi saydı? | AYS + SPİ + ESP `core/goodhart.js` |
| **Kalibrasyon defteri** | Sistem kapalıyken de kendi durumunu biliyor musun? | AYS + SPİ + ESP `core/calib.js` |
| **Kanıt eksenleri** | Bu eşik nereden geliyor, ne kadar kesin, kime uyar, ne söylemeye yetkili? | SPİ `core/evidence.js` |
| **Sinyal katmanı** | Bu denetim yeni bir ekran mı gerektiriyor, yoksa tek bir soru mu? | AYS + SPİ + ESP `core/signals.js` |
| **Kör nokta** | Bu merdiven neyi ölçemez? | ESP `data/curriculum.js` |

Üçü de kötü çıkabilir; bu bir arıza değil, ölçüldüğü için görünür olmasıdır.
Ayrıntı: [`AYS/src/DURUSTLUK.md`](AYS/src/DURUSTLUK.md), ESP ve SPİ mimari
belgelerinin ilgili bölümleri.

ESP ayrıca bir **merdiven** taşır: yedi disiplinin her birinde sıfırdan
üstatlığa beş kademe, her kademede ölçülebilir kapılar ve o kapıya çalışan
somut bir günlük reçete. Kademe kişiye değil ÜRETİME verilir.

Bölümler **açılıp kapanabilir** (kapatmak veriyi silmez), her bölümün altında
koçuyla yazılı ve sesli konuşulabilen bir **tezgâh** durur, ve koçlar sistemi
**teklif** ederek değiştirir: onayı kullanıcı verir, uygulamayı kural motoru
yapar.

HKM bir tarayıcı uygulaması değil bir arka plan servisidir. Açmak **tek
tıktır**: `HKM` klasöründe **`BASLAT.command`** (macOS), **`BASLAT.bat`**
(Windows) ya da **`baslat.sh`** (Linux). Kurar, daemon'u başlatır, yüzü
açar; jeton ne ekranda ne adres çubuğunda görünür. Durdurmak:
`python3 baslat.py --dur`.

Terminalden kullanmak isteyene (yalnızca Python standart kütüphanesi):

```bash
cd HKM
python3 baslat.py                     # tek tıkın komut hâli
python3 -m tests.run                  # VP, sync, şema, öncelik, ikiz,
                                      # Yönetici, daemon ve yüz
python3 tools/perf.py                 # dokuz aylık ambarda sorgu bütçesi
node tools/yuz.js                     # yüz: telefon, kontrast, etiket
node ../tools/entegre.js              # üç arayüz + HKM: uçtan uca

python3 hkm.py durum                  # terminalden: brifing
python3 hkm.py sor "bugün ne yapmalıyım"
```

Tarayıcıda `http://127.0.0.1:4200` açıldığında günün brifingi, çapraz
bulgular, dijital ikiz ve **tek** öneri durur; öneri oradan kabul ya da
reddedilir. Sayfa hiçbir sayı hesaplamaz — ekrandaki her satır kural
motorundan geldiği gibi yazılır.

Aynı özet WhatsApp ya da Telegram'a da gidebilir (**varsayılan kapalı**):
komut seti küçük ve kapalıdır (`durum`, `kabul`, `ret`, `neden`, `capraz`,
`yardim`), izin listesi boşsa kimseye cevap verilmez ve gelen webhook
gövdesi imzası doğrulanmadan ayrıştırılmaz bile. Sunucu, systemd, tünel ve
kanal kurulumu: [`HKM/KURULUM.md`](HKM/KURULUM.md).

## Sınırlar

Her sistemin ne YAPMADIĞI, ne yaptığı kadar tanımlıdır ve `validate()`
tarafından desen olarak denetlenir.

**SPİ — klinik sınır.** Bir hekim ya da tıp merkezi değildir; teşhis koymaz,
doz önermez. Ürettiği her çıktı «yaşam kalitesi ve zindelik rehberliği»
statüsündedir. Ayrıntı: [`SPI/src/MIMARI.md`](SPI/src/MIMARI.md) § 1 ve § 5.

**ESP — pedagojik sınır.** Bir öğretmen, dilbilimci ya da müzik jürisi
değildir; sertifika vermez, yetenek yargısı kurmaz, sonuç garantisi etmez.
Seviye etiketi kişiye değil ÜRETİME verilir ve daima tarih aralığıyla birlikte.
Ayrıntı: [`ESP/src/MIMARI.md`](ESP/src/MIMARI.md) § 1.3.
