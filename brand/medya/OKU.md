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
| `kimlik/` | modül kapak ve hero görselleri | `kimlik-ays` · `kimlik-hkm` |
| `ajan/` | ajan portreleri | `ajan-patron` · `ajan-bio` |
| `durum/` | durum illüstrasyonları | `durum-basari` · `durum-veri-yok` |
| `tanitim/` | ilk kurulum sahneleri | `tanitim-1` … `tanitim-5` |
| `doku/` | arka plan dokuları | `doku-kagit` · `doku-blueprint` |
| `bos/` | boş durum illüstrasyonları | `bos-kayit-yok` · `bos-plan-yok` |
| `kapak/` | rapor kapakları | `kapak-haftalik` · `kapak-saglik` |
| `simge/` | LifeOS ikon ailesi | `simge-kaydet` · `simge-sil` |

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
