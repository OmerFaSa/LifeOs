# Marka medyası — tek kaynak burasıdır

Rütbe kartları ve rozetler `brand/seviye/medya/` altında durur; **onlar
seviye sisteminin parçasıdır**. Burası ondan ayrı: dört sistemin ortak
marka görselleri.

İkisinin ayrı durmasının sebebi şu: seviye medyası bir KATALOĞA bağlıdır
(`kademeler.js`, `basarimlar.js`) ve eksiği kod tarafından bilinir.
Marka medyası ise serbesttir — bir doku eklenmesi ya da çıkarılması
hiçbir kodu kırmaz.

## Aileler

| Klasör | Ne | Ad kalıbı |
|---|---|---|
| `kimlik/` | modül logoları — **marka girişinde** | `kimlik-ays` · `kimlik-hkm` |
| `ajan/` | ajan portreleri, **daire ve kare** | `ajan-esp-patron` · `ajan-kare-esp-patron` |
| `durum/` | durum illüstrasyonları | `durum-tamamlandi-gorev` |
| `tanitim/` | **ilk giriş şeridi**, modül başına ÜÇ adım | `tanitim-ays-1` … `tanitim-hkm-3` |
| `doku/` | arka plan dokuları | `doku-kagit` · `doku-blueprint` |
| `bos/` | boş durum illüstrasyonları | `bos-kayit-yok` · `bos-plan-yok` |
| `kapak/` | rapor kapakları | `kapak-haftalik-ozet` · `kapak-saglik-raporu` |
| `simge/` | genel ikon seti | `simge-takvim` · `simge-hedef` · `simge-uyku` |
| `etiket/` | **kesinlik etiketleri** | `etiket-olculdu` · `etiket-veri-yok` |
| `olcum/` | SPİ ölçüm ikonları | `olcum-sbp` · `olcum-hrv` · `olcum-sleep` |
| `disiplin/` | ESP disiplin amblemleri | `disiplin-lang` · `disiplin-philo` |
| `ders/` | AYS ders amblemleri | `ders-tyt-turkce` · `ders-ayt-fizik` |
| `harita/` | sistem haritası ve posterler | `harita-sistem` |

### Dört aile KATALOĞA bağlıdır

`etiket/`, `olcum/`, `disiplin/` ve `ders/` ile `simge/` serbest
değildir: adları bir kataloğun **kimliğinden** türer ve ekran o kimliği
verir, dosya adını kurmaz (`brand/ortak/simge.js`).

| Aile | Kaynak katalog | Kimlik |
|---|---|---|
| `olcum/` | `SPI/src/js/core/xpsayim.js` → `OLCUM` | `sbp`, `hrv`, `sleep`… |
| `disiplin/` | `ESP/src/js/data/rules.js` → `DISCIPLINES` | `lang`, `philo`… |
| `ders/` | `AYS/src/js/data/subjects.js` → `SUBJECTS` | `tyt-turkce`… |
| `simge/` | `brand/seviye/kademeler.js` → `XP_ETKINLIK`, `basarimlar.js` → aileler | `takvim`, `hedef`… |
| `etiket/` | `brand/ortak/kesinlik.js` | `measured` → `etiket-olculdu` |

Katalogda olup **görseli gelmemiş** bir kimlik, her açılışta bir 404
demektir. Bir kez yaşandı: ESP katalogunda yedi disiplin var, teslimatta
altı geldi ve `disiplin-music.webp` her açılışta arandı. Bunun için
**künye** var:

```bash
python3 tools/marka.py --kunye            # brand/ortak/medya.js uretir
python3 tools/marka.py --kunye --denetle  # taze mi (CI'da kosar)
python3 tools/ortak.py --yay              # uc arayuze dagit
```

Künye `brand/medya/` altında **gerçekten ne varsa** onu yazar. Listede
olmayan bir kimlik için `SIMGE_ADI` `null` döner ve istek **hiç
yapılmaz**; görsel yoksa yazı kalır. Yeni görsel eklediğinde künyeyi
tazelemeyi unutma — CI hatırlatır.

### Daire ile kare aynı kişidir

Depo sahibinin sözü: «dairesel ve kareleri sistemin farklı yerlerinde
kullan». Yirmi beş kişinin iki kırpımı var ve **aynı ajanda aynı yüz**
görünmek zorunda:

| Dosya | Nerede | Neden |
|---|---|---|
| `ajan-<mod>-<id>` (daire) | mesajın yanında, listenin solunda, toplantı turunda | küçük yerde bir İŞARET |
| `ajan-kare-<mod>-<id>` | masanın kendi başlığında | orada bir PORTRE gerekir |

Eşleme **gözle** yapıldı ve `tools/marka.py` içinde değil, kesim
betiğinde sabitlendi: yüz benzerliğini ölçen iki betik denendi, ikisi de
aynı kişiyi birden fazla ajana verdi. «Hepsi gülümseyen, bulanık oda
önünde duran insanlar» bir ölçüte yetecek kadar farklılaşmıyor.

### Neyin ne olduğu

| Dosya | Nerede görünür |
|---|---|
| `kimlik-<mod>` | açılıştaki marka perdesi (üç saniye) ve HKM künyesi |
| `tanitim-<mod>-1..3` | ilk kurulum şeridi — **üç adım**, yalnız ilk açılışta |
| `etiket-<kesinlik>` | «Bugün ne gidiyor» tablosunun Kaynak sütununda |
| `olcum-<alan>` | SPİ'nin günün ölçümü formunda, etiketin solunda |
| `disiplin-<id>` | ESP'nin bölüm kartlarında ve rehber tablosunda |
| `ders-<id>` | AYS'nin ders listesinde |
| `simge-<id>` | «XP nereden gelir» satırlarında, rozet aile başlıklarında |
| `harita-sistem` | README'nin başında — **marka görseli**, mimari çizim değil |
| `durum-tamamlandi-<tur>` | «bekleyen iş yok» kartının arkasında |
| `kapak-<rapor>` | raporun sağ üst köşesinde, kayan bir levha gibi |

`tanitim-<mod>` (tek panelli eski afiş) artık **çağrılmıyor**: yerine
üç adımlı şerit geçti (`brand/ortak/tanitim.js`). Dosya silinmedi.

`tanitim-*` afişlerinin **alt şeridi kesildi**: orada görüntünün üzerine
basılmış bir «Şimdi Başla» düğmesi vardı. Bir görüntüye basılmış düğme
tıklanmaz ve tıklanmadığı anlaşılana kadar kullanıcı üç kere üstüne
basar — hele gerçek «Başla» düğmesi bir karış aşağıdayken.

Her ad **küçük harf, tire ile** yazılır ve Türkçe karakter içermez:
dosya adı bir URL parçasıdır ve yüzde kodlaması gereken bir ad, bir gün
bulunamayan bir istek demektir.

## Nasıl eklenir

```bash
python3 tools/marka.py <klasör>          # kayıpsız işler ve yerleştirir
python3 tools/marka.py <klasör> --dene   # HİÇBİR ŞEY YAZMAZ, ne olacağını söyler
python3 tools/marka.py --liste           # ne var
```

Gelen dosyanın **adı hedefi belirler**; araç görselin içine bakıp «bu
hangi ajan» diye TAHMİN ETMEZ. Adı bir aileye uymayan dosya işlenmez ve
sebebi yazılır — sessizce atlanan bir dosya, «neden görünmüyor» diye
aranan bir akşam demektir.

`--dene` önce koşulur. Büyük bir teslimatta otuz dosyanın adı yanlışsa,
bunu yazdıktan sonra değil YAZMADAN ÖNCE bilmek gerekir.

## Toplu tabaka geldiyse

Birden çok logo tek bir görselde geliyorsa önce kesilir:

```bash
python3 tools/marka.py tabaka.png --kes
```

Ayrı duran parçalar bulunur, **tam çözünürlükten** kırpılır (hiçbir
piksel yeniden örneklenmez) ve `kesit-01`, `kesit-02` diye numaralanır.
Yanına bir de `tabaka.png` yazılır: hepsi tek karede, numaralı.

**Araç ad vermez.** Hangi parçanın hangi logo olduğunu GÖREREK söylemek
insanın işi; araca «bu AYS'nin olmalı» dedirtmek, yanlış adla yerleşen
bir dosya demekti. Temas tabakasına bakılır, parçalar adlarıyla yeniden
adlandırılır, sonra normal yerleştirme koşulur.

Üç zemin türünde de çalışır: saydam, beyaz ve koyu. Zemin rengi dört
köşeden okunur — «beyazdır» diye varsaymak, koyu bir tabakada her şeyi
içerik sanmak olurdu.

Kopuk parçalar birleştirilir: simgenin altında ayrı duran bir yazı
şeridi aynı logonun parçasıdır. Birleşme yarıçapı tabakanın kısa
kenarının %2'sidir.

## Kaliteden ödün verilmez

Varsayılan **kayıpsızdır**. Araç hiçbir pikseli değiştirmez, hiçbir
görseli küçültmez; yaptığı tek şey aynı pikselleri daha iyi
paketlemektir (PNG → kayıpsız WebP). Video olduğu gibi kopyalanır.

Saydam kenar boşluğu kırpılır — atılan şey görünmeyen boşluktur, ışık
değil.

## Nerede servis edilir

`/img/marka/<ad>.webp` — dört sunucu da aynı muhafızı kullanır
(`brand/seviye/ortak_yol.py`, tek kaynaktan yayılır) ve `build.py` tek
dosya sürümüne kopyalar.

**Eksik görsel hata değildir.** Hiçbir ekran bir marka görselinin
varlığına bel bağlamaz: `onerror` düğümü kaldırır, altındaki yazı ya da
renk görünür kalır.
