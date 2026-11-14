# CI'da ara sıra kırılan iki test

Durum: bitti (2026-11-14).

İki birim testi yalnız CI'da (GitHub Actions, Linux) ara sıra kırılıyordu, yerelde geçiyordu. İkisinin de kökü zamana bağlı bir değerin testte başka bir şeyle çakışması. Ürün kodunda hata yok; ikisi de test kurulumunda düzeltildi, hiçbir denetim silinmedi ya da gevşetilmedi.

Kanıt CI notlarından (`actions/runs` → `jobs` → `check_run_url/annotations`; iş günlükleri yönetici izni istiyor, okunamadı).

## 1 · AYS paragraf · «gün kaydına yazıldı»

**Görülen.** 13 Kasım 21:28Z, e3f76523, `perde_test_hiz` içinde 3477/3478: `Günlük paragraf › set › Bugün önerisi, Ctrl+K ve ekran kipi`. «Gün kaydına yaz» düğmesine basıldıktan sonra ekranda hâlâ «Günün paragraf sayısına ekle (+5)» düğmesi var. Set bitmiş, havuzda 95 görülmemiş soru var (yani gün değişmemiş). Demek ki `gunKaydinaYaz` yazmadı.

**Kök neden.** `gunKaydinaYaz` öneriyi tek-uygulama anahtarıyla açıyor: `'ogren-paragraf:<gün>:<setin kurulduğu an>:<sıra>'`. «Kurulduğu an» milisaniyelik ISO saati. Ortak test kurulumu `resetState()`, `S.officeProposals` ile `S.officeProposalKeys`'i silmiyor. `temiz()` paragraf deposunu sıfırlıyor ama önceki testin anahtarı hafızada kalıyor. Aynı takımdaki üç test (`ilk cevap kilitli…`, `havuz soruları…`, `Bugün önerisi…`) toplam 1–4 ms sürüyor. Ölçüm şöyle: üçü de tek bir mikro görev zinciri, sırada 0 makro görev ve 0 kare var. Hızlı bir makinede ilk testle üçüncü test seti aynı milisaniyede kurarsa anahtarlar aynı çıkıyor (`…:<aynı an>:1`). `propose` bu durumda `null` döndürüyor, `hemen` de «öneri kurulamadı» diyor; yazım düşüyor. Saat dilimiyle ve gece yarısıyla ilgisi yok. Saati 21:30Z'ye ve 23:59:20'ye kaydırarak tüm takımı koşturdum, ikisi de geçti. Takımda başka testin zamanlayıcısı bu testlere sızmıyor (sızma sondası: 0 geç çağrı). Gerçek kullanımda aynı gün için iki set aynı milisaniyede kurulamaz, bu yüzden ürün kodu değişmedi.

**Düzeltme.** `AYS/src/tests/paragraf.test.js` → `temiz()` artık öneri kuyruğunu ve anahtarları da boşaltıyor (`R.S.officeProposals = []; R.S.officeProposalKeys = [];`). `hedefler`, `features` ve `beacon` testleri de aynı kalıbı kullanıyor. Her test kendi temiz kuyruğuyla başlıyor.

## 2 · SPI/ESP Defter · «modül gezgini»

**Görülen.** `Defter — modül gezgini › gezgin öbür modülleri gösterir…` testi `beklenen false, gelen true` hatasıyla beş CI koşusunda kırıldı: 8c26b2d9'da SPI ile ESP aynı anda, ayrıca 6f889141, 0514cd7f, 11ef9c89 ve d71202d7.

**Kök neden.** Son denetim `Object.keys(s.depo).some(k => k.indexOf('s1') >= 0)` idi, yani «öbür modülün `s1` notu buraya yazılmadı» kontrolünü alt dizgi aramasıyla yapıyordu. Testin kendi notunun kimliği ise `'n' + Date.now().toString(36) + 5 rastgele harf`. Bu kimlikte ~%0,75 olasılıkla «s1» geçiyor (2 milyon kimlik üzerinde simülasyonla ölçüldü). Kimliğin zaman kısmı da «s1» içerebiliyor: 13 Kasım 09:30:47–09:31:34Z arasında zaman damgası `mwes1…` biçimindeydi. 8c26b2d9 koşusu tam bu pencerede bitti (adım 09:29:04–09:31:08), bu yüzden SPI ile ESP birlikte kırıldı. Diğer kırılmalar rastgele kısımdan geliyor. AYS'de de aynı olasılık var.

**Düzeltme.** Kaynak: `brand/ortak/defter.test.js`. Değişiklik `tools/ortak.py --yay` ile üç modüle yayıldı. Alt dizgi araması yerine iki kesin denetim kondu:

- depoda yalnız bu modülün notu var: `defter/<kendi kimliği>`;
- hiçbir kayıt `s1`/`s2` kimliğini ya da «Uyku»/«Beslenme» başlığını taşımıyor.

Yeni denetim eskisinden sıkı. Eski denetim öbür modülün notunun yeni bir kimlikle buraya kopyalanmasını yakalamazdı, yenisi yakalar.

## Zorlama koşuları (önce / sonra)

Koşucu: `node stres.js <modül> <port> <test dosyası|all> <N> [tz] [init]` (geçici, depoda değil). Test sayfasını ağda yeniden yazıp yalnız seçilen dosyalarla açar. Hata ve saat sondaları init betiğiyle eklenir.

| Deneme | Önce | Sonra |
|---|---|---|
| SPI `defter.test.js` ×200 | 2/200 kırık (CI'daki iletinin aynısı) | 0/200 |
| ESP `defter.test.js` ×200 (SPI ile paralel) | koşu değişiklikle karıştı, sayılmadı | 0/200 |
| SPI + ESP, kimlik rastgelesi zorla «s1…» (hata enjeksiyonu) | 3/3 kırık | 3/3 geçti (SPI ve ESP) |
| AYS tüm takım ×5, paragraf `set` testlerinde saat tek tık (1 sn kaba, «hızlı makine» benzetimi) | 5/5 kırık (aynı test, aynı ileti) | 3/3 geçti |
| AYS tüm takım, saat 00:30 İstanbul (CI anı) ve 23:59:20 (gece yarısı geçişi) | ikisi de geçti (saat kökü değil) | — |
| AYS tüm takım, tek tık saat, TZ = UTC / Los_Angeles / Kiritimati | — | paragraf üçünde de geçti |

Not: TZ İstanbul dışındayken başka testler kırılıyor (Verimli saat, Takvim UTC, King önceki gün sohbeti, Müzik «günde bir», Takeout). Bunlar `runtests.js`'nin sabitlediği `Europe/Istanbul` saat dilimini varsayıyor. CI da bu dilimi sabitlediği için bu iki kararsızlıkla ilgileri yok; dokunulmadı.

## Takımlar

- `python tools/perde_test_hiz_kabul_test.py`: üç modülün `node tools/runtests.js` koşusu paralel, «testler eksiksiz ve yeşil».
- `python tools/ortak.py --denetle`: kopyalar kaynakla aynı.
- `python build.py --denetle` (AYS, SPI, ESP): derlenmiş sayfalar kaynakla aynı.
- `python tools/belge_dizin_kabul_test.py`: yeşil.

Dokunulan dosyalar: `brand/ortak/defter.test.js` ve üç kopyası (`AYS|SPI|ESP/src/tests/defter.test.js`), `AYS/src/tests/paragraf.test.js`, bu belge ve `belgeler/DIZIN.md`'deki satırı.
