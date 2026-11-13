# Faz 1 · AYS konu durumu → Yol sahipliği (2026-11-13)

## Özet

- Son bilinen sahiplik boşluğu kapandı (faz1-modul-bosluklari.md Açık 5, gercek-kosu Kalanlar 2 üçüncü madde).
  AYS konu durumunun sahibi artık **Yol motoru**: `Yol.GOC.aysKonu(belge, y)` ve `Yol.EKSIK.aysKonu`.
- Taşınanlar: konunun durumu (`state`), «Okudum» beyanı (`okunduAt` → anlatım dersinin `okundu` alanı) ve örnek
  soru cevapları (`ornek` → anlatım dersinin alıştırma cevapları). Durum «eski kayıt» etiketiyle zamansız
  durur ve hiçbir kapıyı geçirmez.
- Çift taşıma yok: ilk/ikinci ölçüm (`first`, `firstAt`, `second`, `secondAt`) Tekrar'ın (`Tekrar.GOC.aysKapanis`),
  not (`note`) Not'un (`Not.goc.aysKonu`). Yol bunları okumaz; test bunu denetliyor.
- Gerçek veride (kopya, yalnız sayı) bu koleksiyonda **sahipsiz konu 1 → 0** (ölçüldü). Bu kaydın tek dolu iç
  alanı `ornek`. Kayıt 1 cevap olarak taşındı; ret 0, çökme 0.
- Değişen dosyalar: `motor/yol.js`, `motor/yol.test.js`, `tools/gercek_kosu.js` (sahip kaydı, `ROTA`), bu rapor.

## Eski biçim

AYS `topics/<ders>` = `{ subjectId, states: { [konuId]: durum } }` (core/state.js 447-481). Konu durumunun
varsayılanı `{ state:'not_started', first:null, firstAt:null, second:null, secondAt:null, note:'' }`. Bunlara ek
olarak iki alan daha var:
- `okunduAt`: ISO an. «Okudum» bir beyandır; ilk kez işaretlenince durum `learning` olur (core/ogrenyolu.js 132).
- `ornek`: `{ [sıra]: { h, d, at, ip?, sure?, bak? } }` (core/ogren.js 228-253). `h` harftir, `d` doğru mu bilgisidir,
  `at` ISO andır. `bak:true` «çözüme bakıldı» demektir; bu durumda `h` null'dır ve cevap yanlış sayılır.
  Sıra `sorular(konu)` sırasıdır: önce anlatımın taban soruları, sonra derin sorular (ogren.js 187-195).

Durum değerleri (kodda geçenler): `not_started`, `learning`, `practicing`, `provisional`, `closed`, `reopened`.
Kapanış kuralı `R.CLOSURE_RULE = { first:75, second:70, gapDays:7 }` (data/subjects.js 362).

## Bağdaştırıcı

`Yol.GOC.aysKonu(belge, y)`. Burada `y = Yol.yukle(alan/akademik/asama-1.json)`. Çıktı:
`{ kayit:{ dersler, cevaplar, kapilar:{}, asamalar:{}, eski }, red:[{ konu, neden }], say:{ neden:n } }`.

- **Konu → ders eşlemesi** aşamanın kendi kaynaklarından okunur. donustur.js anlatım dersinin ilk kaynağını
  `bolum: "R.KONU_ANLATIM['<konu>']"` diye yazıyor; derinleştirme dersi `KONU_DERIN` kaynağını taşıdığı için
  karışmaz. AYS verisi Yol'a yüklenmez.
- **Sıra eşlemesi** ölçüldü (tek seferlik betik, AYS verisi ile asama-1.json karşılaştırıldı). 184 konunun
  184'ünde anlatım dersinin alıştırmaları AYS taban sorularıyla aynı sayıda ve aynı sıradadır: soru metni ve
  doğru harf aynı. Bu yüzden `ornek[i]` → `alistirmalar[i]`. Sıra alıştırma sayısından büyükse cevap derin
  soruya aittir.
- `okunduAt` → `dersler[<anlatım dersi>] = { okundu: Date.parse(okunduAt) }`. Okunamayan tarih ret alır; tarih
  uydurulmaz.
- `ornek[i]` → `cevaplar[<alıştırma>] = [{ cevap:h, dogru:d, zaman:Date.parse(at), ipucu?, sure?, bakildi? }]`.
  Harf ile `d` uyuşmalıdır (`(h === dogru) === d`). Uyuşmazsa cevap ret alır («soru yenilenmiş olabilir»).
  Zamanı olmayan cevap da ret alır.
- `state` → `eski['ays:<ders>/<konu>'] = { konu, ders, dersId, durum, etiket:'eski kayıt', kaynak:'ays:topics/<ders>#<konu>' }`.
  `not_started` ve boş durum yazılmaz. Bilinmeyen değer ret alır («göremedim»). Okuması ya da cevabı taşınan,
  başlanmamış bir konu da `durum:null` ile kaydını alır.
- `kapilar` ve `asamalar` hep boş döner. `closed` hiçbir kapıyı geçirmez (AGENTS 0.1: ustalık kapısı zorunlu).
  Test bunu `Yol.durum` ile denetliyor: ünite geçilmemiş, okunan ders 1.
- `kayit.eski`, Yol kaydının yeni ve isteğe bağlı alanı. Başlık yorumunda yazıyor; motorun öteki fonksiyonları
  okumaz, ama kopya yoluyla korur. Kayıtlar ders başına döner ve kimlikler ayrıktır, P6 bunları birleştirir.

## Taşınamayanlar

Liste `Yol.EKSIK.aysKonu` içinde, adıyla. `say` sayaçları gerçek kayıtta kaç kez olduğunu verir.

| Alan | Neden | Nereye |
|---|---|---|
| `first`, `firstAt`, `second`, `secondAt` | Kapanış ölçümü | `Tekrar.GOC.aysKapanis` (Yol taşımaz) |
| `note` | Konu notu | `Not.goc.aysKonu` (Yol taşımaz) |
| Durumun değiştiği an | Konu durumunda yok: göremedim | Durum zamansız, «eski kayıt» |
| `closed` → kapı | AGENTS 0.1 ustalık kapısı | Ünite kapısı yeniden ölçülür |
| Derin soru cevabı (`ornek` sırası ≥ anlatım alıştırma sayısı) | Yol'da bu sorular kapı sorusu; tek cevap kapı denemesi sayılmaz | Taşınmaz (`say` sayar) |
| Yenilenen sorunun eski cevabı | Yol içeriğinde `yenilendi` tarihi yok | Yalnız harf tutarlılığı denetlenir (2 konuda yenilenmiş soru var) |
| Bilinmeyen iç alan | göremedim | `say`: «bilinmeyen konu alanı «x»» |

## Sahiplik kaydı

Sahipler `tools/gercek_kosu.js` `ROTA` tablosunda kayıtlı. Kayıtların sahibe yönlendirildiği tek yer burası
(gercek-kosu-20261113.md Yöntem 3). `ays:topics` rotasına üçüncü bağdaştırıcı eklendi: `yol.aysKonu`. Akademik
aşamayı bir kez, gerektiğinde, salt okur yükler. Çıktı `kayit.eski` girdileridir, ret nedenler listesine gider,
`say` sayaçları taşınamayan sütununa gider. Kaynak metni sessiz alan denetimine girer.

Bu araç sessiz düşen alanı yalnız üst düzeyde ölçüyor: `subjectId` ve `states`, ikisi de daha önce okunuyordu.
Asıl boşluk iç düzeydeydi (`states[k].state / okunduAt / ornek`). Ölçüm yolu önceki paketlerle aynı: kopya
düzeneğiyle (`gercek_kosu.kopyalar` + `goc.goc`) tek seferlik bir betik koştu. Betik depoya girmedi ve yalnız ad
ile sayı bastı. Hiçbir sahibin okumadığı dolu iç alan taşıyan konu sayısı:

| Koleksiyon | Konu | Dolu iç alan | Önce sahipsiz | Sonra sahipsiz | Yol çıktısı |
|---|---:|---|---:|---:|---|
| ays:topics | 1 | `ornek` 1 | 1 | 0 | 1 eski kayıt (durum null), 1 cevap, 0 okuma, ret 0 |

Registry testi: `python tools/gercek_kosu_test.py` yeşil. Testi değiştirmedim, çünkü izinli dosyalar arasında
değil. Yeni rotayı doğrudan sınayan bir test eklemek koordinatörün kararı (Açık sorular 3).

## Testler

- `node motor/yol.test.js`: 17/17. Önceden 13'tü, 4 yeni test var. Örnekler gerçek Akademik aşamada ve AYS'nin
  eski biçiminde:
  1. Okuma, üç cevap (doğru, yanlış, çözüme bakıldı) ve iki durum taşınıyor. Derin soru cevabı yazılmıyor,
     sayılıyor. Başlanmamış konu yazılmıyor. Kapı ve aşama boş kalıyor, `durum` üniteyi geçilmiş göstermiyor.
  2. Çift sayım yok. Yol çıktısında `first/second/firstAt/secondAt/note` anahtarları ve değerleri yok. Aynı
     belgeyi Tekrar kapanış kartına, Not da nota çeviriyor. EKSIK ikisini adıyla anıyor.
  3. Boş ve bozuk girdi sessizce düşmüyor. Şu durumların her biri bir ret nedeniyle çıkıyor: boş belge, null,
     states yok, subjectId yok, bilinmeyen durum, okunamayan tarih, harf uyuşmazlığı, zamansız cevap, sıra
     olmayan anahtar, nesne olmayan durum, dizi `ornek`, aşamada olmayan konu, aşamasız çağrı. Bilinmeyen iç
     alan sayılıyor.
  4. AYS konu alanlarının hepsi ve `ornek` cevabının alanları bağdaştırıcıda okunuyor ya da EKSIK'te geçiyor.
- `python tools/gercek_kosu_test.py`: hepsi yeşil (27 ✓, 0 ✕).
- `python tools/goc_test.py`: temiz (35 ✓).
- `python kalite/olcum.py --denetle`: «Bütçe tamam: 26 bütçe, aşım yok.»
- Değişmeyenler: `motor/tekrar.test.js` 21/21, `motor/not.test.js` 27/27.

## Gerçek koşu

`python tools/gercek_kosu.py` gercek-kosu-20261113.md'nin anlattığı gibi yeniden koşuldu: kopya, kuru depo, yalnız
sayı. Sonuç: çıkış 0, göç kimliği `b0ad37c8b0aa6e58`, sayı dengesi tutuyor, gidiş-dönüş birebir, çökme 0, sessiz
düşen alan 0. Geçici klasör kalmadı. Canlı veritabanı ya da tarayıcı deposu açılmadı.

| Rota | Bağdaştırıcı | Okunan | Çıktı | Ret | Boş | Çöktü | Önce |
|---|---|---:|---:|---:|---:|---:|---|
| ays:topics | yol.aysKonu | 1 | 1 | 0 | 0 | 0 | yok (iç alanlar sahipsiz) |
| ays:topics | tekrar.aysKapanis | 1 | 0 | 0 | 1 | 0 | değişmedi |
| ays:topics | not.aysKonu | 1 | 0 | 0 | 1 | 0 | değişmedi |

Taşınamayan sütunu, öteki bağdaştırıcılarda olduğu gibi, EKSIK listesinin her satırını kayıt başına bir kez
sayar. Gerçek derin cevap sayısı (`say`) 0. gercek-kosu-20261113.md bu paketin izinli dosyaları arasında
olmadığı için tablo buraya yazıldı.

## Açık sorular

1. **Ölçüm yüzdelerinin sahibi yok.** `Tekrar.GOC.aysKapanis` yalnız tarihleri taşıyor: `firstAt` kartın `son`
   alanı olur, `secondAt` da `kapandi` alanı. Kendi EKSIK listesi «ölçüm yüzdeleri (first/second) … ölçüm
   kaydında kalır» diyor, ama Kayıt motorunda konu ölçümü bağdaştırıcısı yok. Görev gereği Yol bunları
   taşımadı. Gerçek veride bugün ölçüm yok, yani bir kayıp yok. P6'dan önce kimin taşıyacağına karar
   verilmeli: Kayıt ya da Tekrar kartına `ek`.
2. **`Not.goc.aysKonu` listesi eskidi.** Liste «Konu durumu … Kayıt/Plan motorunda kalır» diyor; doğrusu Yol
   (durum) ve Tekrar (ölçüm). Dosya bu paketin dışında olduğu için düzeltilmedi.
3. **Rota testi.** `tools/gercek_kosu_test.py`'ye «ays:topics → yol.aysKonu» satırı eklenmeli mi? İzinli dosya
   değildi.
4. **Hafta başı tarihleri null kalıyor** (devir notunun ikinci açık işi; düzeltilmedi). `Plan.GOC.aysHafta` ve
   `aysPlan` tarihi `baslangic` girdisinden hesaplıyor, gerçek koşuda bu girdi verilmiyor. P6, AYS profilinin
   `startDate` alanını (o yoksa `2026-09-14`) Çekirdek göçünde okurken bu bağdaştırıcılara geçirmeli.
5. **Yenilenen sorular.** İki konuda yenilenmiş taban sorusu var. Yenilenmeden önce verilmiş bir cevabın
   harfi yeni anahtarla tesadüfen uyuşursa cevap taşınır. AYS bu cevabı tarihle süzüyordu. Alan/akademik'e
   `yenilendi` tarihi girerse bağdaştırıcı aynı süzmeyi yapabilir.
6. **P6 birleştirmesi.** Bağdaştırıcı ders başına ayrı bir Yol kaydı döndürüyor, kimlikler ayrık. P6 bu
   kayıtları `Object.assign` ile tek kayda birleştirmeli.
