# LifeOS

Tek kişinin gündelik hayatını yöneten üç bağımsız sistem.

| Klasör | Sistem | Alan | Belge |
|---|---|---|---|
| [`AYS/`](AYS/) | **Akademik Yol Sistemi** | Sınav hazırlığı, çalışma düzeni, deneme analizi | [`AYS/src/OFIS.md`](AYS/src/OFIS.md) |
| [`SPI/`](SPI/) | **Sağlık Performans İzleyicisi** | Sağlık, beslenme, hareket, sağlık ekonomisi | [`SPI/src/MIMARI.md`](SPI/src/MIMARI.md) |
| [`ESP/`](ESP/) | **Entelektüel Seviye Planlayıcı** | Dil, felsefe, müzik, diksiyon, okuma, yazı | [`ESP/src/MIMARI.md`](ESP/src/MIMARI.md) |

## Üçü neyi paylaşır

- **Doktrin.** Kural motoru otoritedir: sayıyı hesap üretir, dil modeli yalnızca
  cümleye çevirir. Model kapalıysa sistem kapanmaz.
- **Ofis.** Bir ekip: dikey uzmanlar ve bir orkestratör (SPİ'de beş, ESP'de
  yedi ajan). Her ajan yalnız kendi alanına bakar, çelişkiyi patron çözer.
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
«geçti» yazar. ESP'nin son koşumu: 151 birim testi, 1848 kontrast ölçümü.

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
