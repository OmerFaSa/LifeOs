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
| [`HKM/`](HKM/) | **Hayat Kontrol Merkezi** | iskelet (Faz 1–2, 36 test) | [`HKM/MIMARI.md`](HKM/MIMARI.md) |

HKM üçünün **üstünde değil yanındadır**: üç sistem onun var olduğunu bilmez ve
o kapalıyken hiçbiri bozulmaz.

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

SPİ ve ESP ayrıca gerçek uygulamayı gezen denetimler taşır:

```bash
node tools/smoke.js          # ekranları gezer, akışları dener
node tools/a11ycheck.js      # erişilebilirlik — çizilen sayfadan
node tools/palettecheck.js   # bütün paletlerde kontrastı ölçer
node tools/ledgercheck.js    # defter düzenini denetler (yalnız SPİ)
```

Bir denetim geçtiğinde de **sayı gösterir**: hiçbir şey ölçmeyen bir betik de
«geçti» yazar. ESP'nin son koşumu: 343 birim testi, 14 ekran ve 75 sekmelik
duman testi, 1848 kontrast ölçümü.

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
python3 daemon.py                     # 127.0.0.1:4200
python3 -m tests.run                  # 36 test
```

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
