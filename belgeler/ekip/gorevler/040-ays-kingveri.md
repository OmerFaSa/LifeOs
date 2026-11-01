# 040 · AYS King verisi: olaylar ve yardım sağlayıcıları (KING-4 §C, §H)

**Durum:** bitti
**Dal:** `ag/040-ays-kingveri`
**Efor:** orta
**Kabul testi:** `tools/kingveri_ays_kabul_test.py`

## Amaç
KING-4 §C: «modüller olay yayınlar: sınava 30 gün kaldı, tekrar günü geldi»; §H: haftalık otomatik rapor, alışkanlığın gerçek saatine göre hatırlatma, «onu 30 dk yap» düzeltmesi. Bu görev yalnız **modülün verisini** üretir: sayıyı AYS'nin kendi kodu hesaplar (AGENTS §1), eksik veri sıfır değildir (§1.2). Olayı HKM'ye taşıyan ortak katman (`brand/ortak/olay.js`), King kartları ve `app.js` bağlantısı Claude Code'dadır.

Olay biçimi: `belgeler/ekip/KING-OLAY.md` (oku). Her olay `{ modul:'ays', tur, kimlik, at, sayilar }`; `at` = `simdi`'nin **yerel** saati `YYYY-AA-GGTSS:DD:ss` (UTC değil); her sayı `{ deger, birim, etiket }`, etiket `ölçüldü | hesaplandı | tahmin | veri yok`.

## Dokunulacak dosyalar
- `AYS/src/js/core/kingveri.js` — `R.KingVeri` (yer tutucu var; doldur). Saf okuma; yazan tek işlev `duzelt`.
- `AYS/src/tests/kingveri.test.js` — modül birim testleri (yer tutucu var; test sayfasına bağlı). Biçim: aynı klasördeki `kingarac.test.js`.

## Sözleşme (`R.KingVeri`)
- `olaylar(simdi: Date) → [olay]` — `gun = R.U.iso(simdi)`.
  - `sinav_yaklasti`: `R.PLAN.examTytISO` geçerli ve `kalan = R.U.diffDays(gun, examTytISO) ≥ 0` ise `kalan_gun` (birim `gün`, `hesaplandı`). Kimlik `ays.sinav_yaklasti.<gun>`. Eşiği (30, 14, 7…) HKM uygular; modül her gün yollar.
  - `tekrar_gunu`: `R.Calc.dueCards(gun).length ≥ 1` ise `adet` (birim `kart`, `hesaplandı`). Kimlik `ays.tekrar_gunu.<gun>`.
  - `plan_kacti` bu görevde yok (AYS blokları saatsiz).
  - Aynı `simdi` ile iki çağrı aynı kimlikleri verir.
- `hafta(bitisISO) → { bas, bit, satirlar }` — `bas` = bitişten 6 gün önce; `R.S.days[iso].blocks`'tan. Satırlar `{ id, ad, deger, birim?, etiket, onceki }`; `onceki` bir önceki 7 gün (yoksa `null`):
  - `calisma_dk`: blokların `actualMin` toplamı (`dk`, `ölçüldü`); `soru`: blokların `actualQ` + günün `freeQ` toplamı (`ölçüldü`); `blok`: `status` `done` ya da `partial` blok adedi (`ölçüldü`).
  - Kaydı olmayan ölçü `{ deger:null, etiket:'veri yok' }` (0 değil).
- `hatirlat(simdi) → [satır]` — blok **yuvası** (`slot`, ör. «Ana ders») başına `{ anahtar, ad:slot, kurulu:null, gercek, n, etiket, dun }`: bloğun gerçek başlangıcı = `oturumlar[0].bas`, yoksa `kayitAt` (ISO ya da ms sayısı). `gercek` = son 14 gün (bugün dahil) bu anların **yerel saatlerinin ortancası** (`SS:DD`, çift sayıda iki ortanın ortalaması, dakikaya yuvarla), `n` = sayılan blok; `n < 3` → `gercek:null, etiket:'veri yok'`, yoksa `hesaplandı`. `dun`: dün o yuvada `done`/`partial` blok varsa `'yapildi'`, blok var ama bitmemişse `'isaretlenmedi'`, hiç yoksa `null`. Son 14 günde hiç görünmeyen yuva satır vermez.
- `sonKayit() → { id, tur:'blok', gun, ad, alanlar } | null` — son 14 günde `actualMin` dolu, kayıt anı (`kayitAt`, `oturumlar` son `bas`) en yeni blok; `ad` konu ya da ders; `alanlar[0] = { ad:'dk', deger:actualMin, birim:'dk' }`, `actualQ` doluysa `{ ad:'soru', deger, birim:'soru' }`. `id` günü ve blok kimliğini taşır.
- `duzelt(id, alan, deger) → Promise<{ ok:true, once, sonra, geriAl } | { ok:false, why }>` — `alan:'dk'` tam sayı 1–600 (`actualMin`), `alan:'soru'` tam sayı 0–1000 (`actualQ`); `R.Model.saveDay(gun)` ile yazılır; `geriAl()` eski değeri aynı yoldan geri yazar. Olmayan kayıt, bilinmeyen alan, sınır dışı değer `ok:false` ve Türkçe `why`.

## Dokunma
- `brand/`, `AYS/src/js/app.js`, `index.html` dosyaları, `screens/`, `state.js`, `store.js`, `calc.js`, `king*.js`, `kingarac.js`, `HKM/`, dist ve build.js, kabul testi dosyası.
- Yeni Model işlevi, yeni depolama anahtarı, ekran metni ekleme.

## Kabul ölçütü
- Kabul testindeki altı sınama: sınav ve tekrar olayları; sınav yok/geçmiş/bugün; aynı kimlikler; hafta satırları ve boş hafta «veri yok»; hatırlatma ortancası ve `dun`; son kayıt ve düzeltme (sınırlar, depo yolu, geri al).
- `AYS/src/tests/kingveri.test.js` bu sözleşmenin kenarlarını sınar (en az: veri yok, `kayitAt` ms sayısı, 600/601 dk) ve AYS test takımı yeşil.

## Koşulacak testler
- `python tools/kingveri_ays_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd AYS && node tools/runtests.js <senin portun>`

## Sonuç
- **Ne değişti:** AYS/src/js/core/kingveri.js içinde R.KingVeri (olaylar, hafta, hatirlat, sonKayit, duzelt) işlevleri sözleşmeye uygun şekilde tamamlandı; AYS/src/tests/kingveri.test.js içine boş veri, ms sayısı kayitAt, 600/601 dk sınırları, duzelt ve geri al durumlarını sınayan birim testleri eklendi.
- **Koşan testler:** cd AYS && node tools/runtests.js 4731 -> 3167/3167 gecti
- **Kabul testi:** python tools/kingveri_ays_kabul_test.py -> ays king verisi kabul: sinav_yaklasti, tekrar_gunu, kimlik, hafta, hatirlat, sonKayit/duzelt.
- **Açık kalan:** yok
