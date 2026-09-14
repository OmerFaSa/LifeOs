# LifeOS

Tek kişinin gündelik hayatını yöneten üç bağımsız sistem.

| Klasör | Sistem | Alan | Belge |
|---|---|---|---|
| [`AYS/`](AYS/) | **Akademik Yol Sistemi** | Sınav hazırlığı, çalışma düzeni, deneme analizi | [`AYS/src/OFIS.md`](AYS/src/OFIS.md) |
| [`SPI/`](SPI/) | **Sağlık Performans İzleyicisi** | Sağlık, beslenme, hareket, sağlık ekonomisi | [`SPI/src/MIMARI.md`](SPI/src/MIMARI.md) |
| [`ESP/`](ESP/) | **Entelektüel Seviye Planlayıcı** | Dil, felsefe, müzik, diksiyon, okuma, yazı, tarih | [`ESP/src/MIMARI.md`](ESP/src/MIMARI.md) |

Yanlarında dördüncü, **isteğe bağlı** bir katman durur:

| Klasör | Katman | Durum | Belge |
|---|---|---|---|
| [`HKM/`](HKM/) | **Hayat Kontrol Merkezi** | merkez katman: brifing, çapraz bulgu, etki, sohbet, niyet kuyruğu, ritim (184 test) | [`HKM/MIMARI.md`](HKM/MIMARI.md) |

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

## Üçü neyi paylaşır

- **Doktrin.** Kural motoru otoritedir: sayıyı hesap üretir, dil modeli yalnızca
  cümleye çevirir. Model kapalıysa sistem kapanmaz.
- **Ofis.** Bir ekip: dikey uzmanlar ve bir orkestratör (SPİ'de beş, ESP'de
  dokuz ajan). Her ajan yalnız kendi alanına bakar, çelişkiyi patron çözer.
- **Tasarım dili.** Aynı jetonlar, aynı kart/düğme/tablo dili, aynı altı palet
  ve iki tema.
- **Bağımlılıksızlık.** Ne çerçeve, ne derleyici, ne paket. Tarayıcıda düz
  JavaScript. Test betikleri için yalnızca Playwright.

## Üçü neyi paylaşmaz

Kodları ayrıdır ve birbirini import etmez:

| | AYS | SPİ | ESP |
|---|---|---|---|
| Ad alanı | `R.*` | `SP.*` | `ESP.*` |
| Depo anahtarı | `rota84285.v2` | `spi.v1.<profil>` | `esp.v1.<profil>` |
| Test paketi | `AYS/src/tests/` | `SPI/src/tests/` | `ESP/src/tests/` |
| Dev sunucu portu | 4173 | 4183 | 4193 |
| Dağıtım | `AYS/dist/rota.html` | `SPI/dist/spi.html` | `ESP/dist/esp.html` |

Birinde yapılan bir değişiklik diğerini bozamaz. Üç proje ayrı ayrı
geliştirilir.

## Çalıştırma

Her iki proje de aynı komutlarla çalışır, kendi klasöründen:

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

_Bu bölüm elle yazılmaz: `python3 tools/sayilar.py --yaz` araçları koşturur ve her aracın kendi son satırını buraya yazar. Son koşum: 2026-09-14._

| Araç | AYS | SPI | ESP |
|---|---|---|---|
| `runtests.js` | 1044/1044 gecti | 786/786 gecti | 604/604 gecti |
| `smoke.js` | Duman testi temiz — 2 hedefte 36 ekran, 36 sekme gezildi. | Duman testi temiz — 2 hedefte 24 ekran, 64 sekme gezildi. | Duman testi temiz — 2 hedefte 28 ekran, 182 sekme gezildi. |
| `a11ycheck.js` | erisilebilirlik temiz (1 bilinen eksik izin listesinde) | erisilebilirlik temiz (1 bilinen eksik izin listesinde) | erisilebilirlik temiz (4 bilinen eksik izin listesinde) |
| `palettecheck.js` | 924 kontrast ölçümü AA geçti — en dar pay: ucuncul/zemin 4.52 (asgari 4.5) — light/indigo/today | 1694 kontrast olcumu AA gecti — en dar pay: ucuncul/zemin 4.52 (asgari 4.5) — light/indigo/today | 1848 kontrast ölçümü AA geçti — en dar pay: ucuncul/zemin 4.52 (asgari 4.5) — light/indigo/today |
| `layoutcheck.js` | Telefon düzeni temiz — 390 pikselde 36 yerde taşma yok, bütün dokunma hedefleri 24px ve üstü. | Telefon düzeni temiz — 390 pikselde 44 yerde taşma yok, bütün dokunma hedefleri 24px ve üstü. | Telefon düzeni temiz — 390 pikselde 105 yerde taşma yok, bütün dokunma hedefleri 24px ve üstü. |
| `perfcheck.js` | Bütün ekranlar bütçede — en ağırı office 31.2 ms (bütçe 120). | Bütün ekranlar bütçede — en ağırı office 20.9 ms (bütçe 120). | Bütün ekranlar bütçede — en ağırı office 54.9 ms (bütçe 100). |
| `ledgercheck.js` | — | 32 ekran/sekmede defter düzeni temiz | — |
| `designcheck.js` | — | beş düzen temiz — 440 ekran/genişlik kombinasyonu bakıldı | — |

| Depo denetimi | Sonuç |
|---|---|
| `HKM tests` | 184/184 test gecti |
| `HKM perf` | Bütün sorgular bütçede. |
| `HKM yuz` | HKM yüzü temiz — 16 görünümde taşma yok, bütün hedefler 24px ve üstü, etiketler yerinde, kontrast AA. |
| `entegre.js` | Butunlesme temiz: uc arayuz de HKM ile konustu, HKM kapaliyken hicbiri bozulmadi. |
<!-- SAYILAR:bitis -->

Üç sistem de artık **kendini denetleyen bir katman** taşır — dışarıdan gelen
eleştirilerin koda dönüşmüş hâli:

| Katman | Ne sorar | Nerede |
|---|---|---|
| **Sürtünme** | Sistemi yönetmek, çalışmanın yerine mi geçiyor? | AYS + ESP `core/friction.js` |
| **Goodhart nöbetçisi** | Çaba arttı da sonuç yerinde mi saydı? | AYS + ESP `core/goodhart.js` |
| **Kalibrasyon defteri** | Sistem kapalıyken de kendi durumunu biliyor musun? | AYS + ESP `core/calib.js` |
| **Kanıt eksenleri** | Bu eşik nereden geliyor, ne kadar kesin, kime uyar, ne söylemeye yetkili? | SPİ `core/evidence.js` |
| **Sinyal katmanı** | Bu denetim yeni bir ekran mı gerektiriyor, yoksa tek bir soru mu? | AYS + ESP `core/signals.js` |
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

HKM bir tarayıcı uygulaması değil bir arka plan servisidir; kendi komutları
vardır (yalnızca Python standart kütüphanesi):

```bash
cd HKM
cp config.example.json config.json    # local_token'ı değiştir
python3 daemon.py                     # 127.0.0.1:4200 — yerel yüz de burada
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
