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
| `tanitim/` | **sisteme ilk giriş kartı**, modül başına bir tane | `tanitim-ays` … `tanitim-hkm` |
| `doku/` | arka plan dokuları | `doku-kagit` · `doku-blueprint` |
| `bos/` | boş durum illüstrasyonları | `bos-kayit-yok` · `bos-plan-yok` |
| `kapak/` | rapor kapakları | `kapak-haftalik-ozet` · `kapak-saglik-raporu` |
| `simge/` | LifeOS ikon ailesi | `simge-kaydet` · `simge-sil` |

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
| `tanitim-<mod>` | ilk kurulum sihirbazının en üstünde, **yalnız ilk açılışta** |
| `durum-tamamlandi-<tur>` | «bekleyen iş yok» kartının arkasında |
| `kapak-<rapor>` | raporun sağ üst köşesinde, kayan bir levha gibi |

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
