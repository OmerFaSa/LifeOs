# 042 · ESP King verisi: olaylar ve yardım sağlayıcıları (KING-4 §C, §H)

**Durum:** bekliyor
**Dal:** `ag/042-esp-kingveri`
**Efor:** orta
**Kabul testi:** `tools/kingveri_esp_kabul_test.py`

## Amaç
KING-4 §C: «modüller olay yayınlar: tekrar günü geldi»; §H: haftalık otomatik rapor, alışkanlığın gerçek saatine göre hatırlatma, «onu 30 dk yap» düzeltmesi. Bu görev yalnız **modülün verisini** üretir: sayıyı ESP'nin kendi kodu hesaplar (AGENTS §1), eksik veri sıfır değildir (§1.2). Olayı HKM'ye taşıyan ortak katman (`brand/ortak/olay.js`), King kartları ve `app.js` bağlantısı Claude Code'dadır.

Olay biçimi: `belgeler/ekip/KING-OLAY.md` (oku). Her olay `{ modul:'esp', tur, kimlik, at, sayilar }`; `at` = `simdi`'nin **yerel** saati `YYYY-AA-GGTSS:DD:ss` (UTC değil); her sayı `{ deger, birim, etiket }`, etiket `ölçüldü | hesaplandı | tahmin | veri yok`.

## Dokunulacak dosyalar
- `ESP/src/js/core/kingveri.js` — `ESP.KingVeri` (yer tutucu var; doldur). Saf okuma; yazan tek işlev `duzelt`.
- `ESP/src/tests/kingveri.test.js` — modül birim testleri (yer tutucu var; test sayfasına bağlı). Biçim: aynı klasördeki `kingarac.test.js`.

## Sözleşme (`ESP.KingVeri`)
- `olaylar(simdi: Date) → [olay]` — `gun = ESP.U.iso(simdi)`.
  - `tekrar_gunu`: `ESP.SRS.dueCards(gun).length ≥ 1` ise `adet` (birim `kart`, `hesaplandı`). Kimlik `esp.tekrar_gunu.<gun>`.
  - `plan_kacti` bu görevde yok.
  - Aynı `simdi` ile iki çağrı aynı kimlikleri verir.
- `hafta(bitisISO) → { bas, bit, satirlar }` — `bas` = bitişten 6 gün önce; `ESP.Model.sessionsOf(iso)`'dan, yalnız dakikası olan oturumlar (`minutesCert !== 'missing'`, `minutes != null`). Satırlar `{ id, ad, deger, birim?, etiket, onceki }`; `onceki` bir önceki 7 gün (yoksa `null`):
  - `calisma_dk`: dakika toplamı (`dk`); etiket `ölçüldü`, toplamda `estimated` dakika varsa `tahmin`;
  - `oturum`: oturum adedi (`ölçüldü`); `gun`: oturumlu gün adedi (`ölçüldü`).
  - Kaydı olmayan ölçü `{ deger:null, etiket:'veri yok' }` (0 değil).
- `hatirlat(simdi) → [satır]` — disiplin başına `{ anahtar:'disc:<id>', ad:<ESP.DISCIPLINES label>, kurulu:null, gercek, n, etiket, dun }`: `gercek` = son 14 gün (bugün dahil) dakikası olan oturumların `at` **yerel saatlerinin ortancası** (`SS:DD`, çift sayıda iki ortanın ortalaması, dakikaya yuvarla), `n` = sayılan oturum; `n < 3` → `gercek:null, etiket:'veri yok'`, yoksa `hesaplandı`. `dun`: dün o disiplinde dakikalı oturum varsa `'yapildi'`, yoksa `'isaretlenmedi'`. Son 14 günde hiç oturumu olmayan disiplin satır vermez.
- `sonKayit() → { id, tur:'oturum', gun, ad, alanlar:[{ ad:'dk', deger, birim:'dk' }] } | null` — son 14 günde `at`'i en yeni, dakikası olan oturum; `ad` disiplinin adı; `id` günü ve oturum kimliğini taşır.
- `duzelt(id, alan, deger) → Promise<{ ok:true, once, sonra, geriAl } | { ok:false, why }>` — yalnız `alan:'dk'`, tam sayı 1–600; `ESP.Model.updateSession(gun, id, { minutes })` ile yazılır (dakika `measured` olur: kullanıcı söyledi); `geriAl()` eski dakikayı **ve eski kesinliği** geri yazar. Olmayan kayıt, bilinmeyen alan, sınır dışı değer `ok:false` ve Türkçe `why`.

## Dokunma
- `brand/`, `ESP/src/js/app.js`, `index.html` dosyaları, `screens/`, `state.js`, `store.js`, `srs.js`, `king*.js`, `kingarac.js`, `HKM/`, dist ve build.js, kabul testi dosyası.
- Yeni Model işlevi, yeni depolama anahtarı, ekran metni ekleme.

## Kabul ölçütü
- Kabul testindeki beş sınama: tekrar olayı ve aynı kimlikler; vadeli kart yok; hafta satırları (tahmin dakika → `tahmin`) ve boş hafta «veri yok»; hatırlatma ortancası ve `dun`; son kayıt ve düzeltme (sınırlar, depo yolu, geri al).
- `ESP/src/tests/kingveri.test.js` bu sözleşmenin kenarlarını sınar (en az: veri yok, dakikasız oturum, 600/601 dk, geri alınca kesinlik eski hâli) ve ESP test takımı yeşil.

## Koşulacak testler
- `python tools/kingveri_esp_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd ESP && node tools/runtests.js <senin portun>`

## Sonuç
- **Ne değişti:**
- **Koşan testler:**
- **Kabul testi:**
- **Açık kalan:**
