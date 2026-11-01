# 041 · SPİ King verisi: olaylar ve yardım sağlayıcıları (KING-4 §C, §H)

**Durum:** bitti
**Dal:** `ag/041-spi-kingveri`
**Efor:** orta
**Kabul testi:** `tools/kingveri_spi_kabul_test.py`

## Amaç
KING-4 §C: «modüller olay yayınlar: uyku düştü, plan maddesi kaçtı»; §H: «Unuttuğun ne var?», haftalık otomatik rapor, alışkanlığın gerçek saatine göre hatırlatma, «onu 30 dk yap» düzeltmesi. Bu görev yalnız **modülün verisini** üretir: sayıyı SPİ'nin kendi kodu hesaplar (AGENTS §1), eksik veri sıfır değildir (§1.2). Olayı HKM'ye taşıyan ortak katman (`brand/ortak/olay.js`), King kartları ve `app.js` bağlantısı Claude Code'dadır.

Olay biçimi: `belgeler/ekip/KING-OLAY.md` (oku). Her olay `{ modul:'spi', tur, kimlik, at, sayilar, konu? }`; `at` = `simdi`'nin **yerel** saati `YYYY-AA-GGTSS:DD:ss` (UTC değil); her sayı `{ deger, birim, etiket }`, etiket `ölçüldü | hesaplandı | tahmin | veri yok`, «veri yok»un değeri `null`.

## Dokunulacak dosyalar
- `SPI/src/js/core/kingveri.js` — `SP.KingVeri` (yer tutucu var; doldur). Saf okuma; yazan tek işlev `duzelt`.
- `SPI/src/tests/kingveri.test.js` — modül birim testleri (yer tutucu var; test sayfasına bağlı). Biçim: aynı klasördeki `kingarac.test.js`.

## Sözleşme (`SP.KingVeri`)
- `olaylar(simdi: Date) → [olay]` — `gun = SP.U.iso(simdi)`.
  - `uyku_dustu`: `ort7` = `gun` dahil son 7 günün `SP.S.vitals[iso].sleep` ortalaması (kayıtlı geceler, en az 4; yoksa olay yok); `ort28` = son 28 gün (en az 14 gece; azsa `{ deger:null, etiket:'veri yok' }`). Bir ondalık, birim `saat`, etiket `hesaplandı`. Yayın: (`ort28` var ve `ort7 < ort28`) ya da `ort7 < 6`. Kimlik `spi.uyku_dustu.<gun>`.
  - `plan_kacti`: `SP.HaftaPlan.liste()` → her plan için `bugunMaddeleri(p, gun)`; madde **saatli** (`zamanYaz(m.zaman)` `SS:DD`), `sayim(p, m, gun).tamam` değil ve `simdi` dakikası − `zamanAn(m.zaman)` ≥ 30 ise olay: `gecikme_dk` (birim `dk`, `hesaplandı`), `konu` = madde metni (≤ 80 harf). Kimlik `spi.plan_kacti.<gun>.<plan ve madde kimliği>` (≤ 80, maddeye özgü). Dilim («akşam») ve zamansız madde olay değildir.
  - Aynı `simdi` ile iki çağrı aynı kimlikleri verir. Kişisel not yollanmaz.
- `hafta(bitisISO) → { bas, bit, satirlar }` — `bas` = bitişten 6 gün önce. Satırlar `{ id, ad, deger, birim?, etiket, gun?, onceki }`; `onceki` aynı ölçünün bir önceki 7 günü (yoksa `null`):
  - `uyku`: kayıtlı gecelerin ortalaması (bir ondalık, `saat`, `hesaplandı`), `gun` = kayıtlı gece sayısı;
  - `antrenman`: `SP.S.workouts` adedi (`ölçüldü`); `hareket_dk`: dakikaları toplamı (`dk`, `ölçüldü`); `ogun`: `SP.S.meals[iso]` satır adedi (`ölçüldü`).
  - Kaydı olmayan ölçü `{ deger:null, etiket:'veri yok' }` (0 değil).
- `hatirlat(simdi) → [satır]` — `SP.S.hatirlat.liste`'deki her hatırlatmanın her saati için `{ anahtar:'<id>@<SS:DD>', ad, kurulu:'SS:DD', gercek, n, etiket, dun }`: `gercek` = son 14 gün (bugün dahil) `yapildi[gun][anahtar]` zaman damgalarının **yerel saatlerinin ortancası** (`SS:DD`, çift sayıda iki ortanın ortalaması, dakikaya yuvarla), `n` = sayılan işaret; `n < 3` → `gercek:null, etiket:'veri yok'`, yoksa `hesaplandı`. `dun`: dün işaretliyse `'yapildi'`, değilse `'isaretlenmedi'`. İlaç hatırlatmasının adı **ilaç adını taşımaz** (`'İlaç / takviye'`; `core/hatirlat.js` söz 3). Geçersiz hatırlatma (`gecerli` değil) atlanır.
- `sonKayit() → { id, tur:'antrenman', gun, ad, alanlar:[{ ad:'dk', deger, birim:'dk' }] } | null` — `createdAt`'i en yeni antrenman.
- `duzelt(id, alan, deger) → Promise<{ ok:true, once, sonra, geriAl } | { ok:false, why }>` — yalnız `alan:'dk'`, tam sayı 1–600; kayıt `SP.Model.saveWorkout` ile yazılır (yeni depolama anahtarı yok); `geriAl()` eski değeri aynı yoldan geri yazar. Olmayan kayıt, bilinmeyen alan, sınır dışı değer `ok:false` ve Türkçe `why`.

## Dokunma
- `brand/`, `SPI/src/js/app.js`, `index.html` dosyaları, `screens/`, `state.js`, `store.js`, `haftaplan.js`, `hatirlat.js`, `king*.js`, `kingarac.js`, `HKM/`, dist ve build.js, kabul testi dosyası.
- Yeni Model işlevi, yeni depolama anahtarı, ekran metni ekleme.

## Kabul ölçütü
- Kabul testindeki sekiz sınama: uyku düşüşü sayıları ve kimliği; düşüş yok / `ort7 < 6`; yetersiz veri ve `ort28` «veri yok»; plan kaçtı (yalnız saatli, tamamlanmamış, ≥ 30 dk); aynı kimlikler; hafta satırları ve boş hafta «veri yok»; hatırlatma ortancası, `dun`, ilaç adı gizli; son kayıt ve düzeltme (sınırlar, depo yolu, geri al).
- `SPI/src/tests/kingveri.test.js` bu sözleşmenin kenarlarını sınar (en az: hiç veri yok, tek gece, 600/601 dk) ve SPI test takımı yeşil.

## Koşulacak testler
- `python tools/kingveri_spi_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd SPI && node tools/runtests.js <senin portun>`

## Sonuç
- **Ne değişti:** SP.KingVeri (SPI/src/js/core/kingveri.js) sözleşmesi tamamlandı: uyku_dustu ve plan_kacti olayları, hafta özeti, hatırlatma ortancası ve sonKayit/duzelt uygulandı. Kenar durumları sınayan birim testleri (SPI/src/tests/kingveri.test.js) eklendi.
- **Koşan testler:** python tools/kingveri_spi_kabul_test.py -> spi king verisi kabul: uyku_dustu, plan_kacti, kimlik, hafta, hatirlat, sonKayit/duzelt. · cd SPI && node tools/runtests.js 4722 -> 2935/2935 gecti
- **Kabul testi:** python tools/kingveri_spi_kabul_test.py -> spi king verisi kabul: uyku_dustu, plan_kacti, kimlik, hafta, hatirlat, sonKayit/duzelt.
- **Açık kalan:** yok
