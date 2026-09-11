# LifeOS

Tek kişinin gündelik hayatını yöneten iki bağımsız sistem.

| Klasör | Sistem | Alan | Belge |
|---|---|---|---|
| [`AYS/`](AYS/) | **Akademik Yol Sistemi** | Sınav hazırlığı, çalışma düzeni, deneme analizi | [`AYS/src/OFIS.md`](AYS/src/OFIS.md) |
| [`SPI/`](SPI/) | **Sağlık Performans İzleyicisi** | Sağlık, beslenme, hareket, sağlık ekonomisi | [`SPI/src/MIMARI.md`](SPI/src/MIMARI.md) |

## İkisi neyi paylaşır

- **Doktrin.** Kural motoru otoritedir: sayıyı hesap üretir, dil modeli yalnızca
  cümleye çevirir. Model kapalıysa sistem kapanmaz.
- **Ofis.** Beş ajanlı bir ekip; dört dikey uzman ve bir orkestratör. Her ajan
  yalnız kendi alanına bakar, çelişkiyi patron çözer.
- **Tasarım dili.** Aynı jetonlar, aynı kart/düğme/tablo dili, aynı altı palet
  ve iki tema.
- **Bağımlılıksızlık.** Ne çerçeve, ne derleyici, ne paket. Tarayıcıda düz
  JavaScript. Test betikleri için yalnızca Playwright.

## İkisi neyi paylaşmaz

Kodları ayrıdır ve birbirini import etmez:

| | AYS | SPİ |
|---|---|---|
| Ad alanı | `R.*` | `SP.*` |
| Depo anahtarı | `rota84285.v2` | `spi.v1.<profil>` |
| Test paketi | `AYS/src/tests/` | `SPI/src/tests/` |
| Dev sunucu portu | 4173 | 4183 |
| Dağıtım | `AYS/dist/rota.html` | `SPI/dist/spi.html` |

Birinde yapılan bir değişiklik diğerini bozamaz. İki proje ayrı ayrı
geliştirilir.

## Çalıştırma

Her iki proje de aynı komutlarla çalışır, kendi klasöründen:

```bash
python devserver.py          # geliştirme sunucusu
python build.py              # tek dosyalık dağıtım üretir
node tools/runtests.js       # birim testleri
```

SPİ ayrıca gerçek uygulamayı gezen bir duman testi taşır:

```bash
node tools/smoke.js          # 12 ekranı gezer, akışları dener
node tools/palettecheck.js   # bütün paletlerde kontrastı ölçer
node tools/ledgercheck.js    # defter düzenini denetler
```

## Klinik sınır

SPİ bir hekim ya da tıp merkezi değildir. Ürettiği her çıktı «yaşam kalitesi
ve zindelik rehberliği» statüsündedir. Teşhis ve tedavide karar hekimindir.
Ayrıntı için [`SPI/src/MIMARI.md`](SPI/src/MIMARI.md) § 1 ve § 5.
