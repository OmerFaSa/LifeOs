# Faz 4 · Ölçüm motoru (A9) — rapor

Dosyalar: `kalite/olcum.py` (yalnız standart kütüphane), `kalite/butce.json`, `kalite/olcum_test.py`,
`kalite/kayit/2026-11-13.json` (ilk gerçek kayıt).

```
python kalite/olcum.py            # ölçer, JSON basar
python kalite/olcum.py --md       # kısa Türkçe tablo
python kalite/olcum.py --kaydet   # kalite/kayit/<YYYY-MM-DD>.json (sıralı, mutlak yol yok)
python kalite/olcum.py --denetle  # bütçe aşımında çıkış 1, Türkçe satırlar
python kalite/olcum_test.py       # sahte depoda testler
```

## Özet

- Araç depoyu yalnız okur: sunucu, tarayıcı, derleme, ağ yok; bir koşu ≈6 sn. Python dosyalarındaki
  listeler (`DOSYALAR`, `PORTLAR`, `KINDS`…) `ast` ile **çalıştırılmadan** okunur.
- **29 statik ölçüt** ölçülüyor (her biri kesinlik etiketli: 26 `ölçüldü`, 2 `hesaplandı`, 1 `tahmin`).
  **13 eğrinin 13'ü** `ölçülmedi`: değer yok, ölçecek komut yazılı (10 King + 3 Sistem; Sistem eğrilerinin
  statik parçaları `kod_hacmi` ve `ic_icelik` ayrıca ölçülüyor).
- Taban yeniden üretildi: 29 ölçütün 25'i taban belgesindeki sayının aynısı. Dört fark, hepsi açıklandı
  (aşağıda «Bugün / taban / hedef»): kopya dosya 237 (13 Kasım'da `gocpaket.js` eklendi), King aracı
  128 / 166 (taban betiği 4 Gün aracını kaçırmış), not yapısı 16 (belgedeki 13'ün satırları yazılı değil),
  ekran içi sekme 115 (`tahmin`; belge de «≈120»).
- **İlk gerçek aşım:** kayıt yokken `--denetle` tabana karşı çıkış 1 verdi:
  `AŞIM: Üçe kopyalanan dosya 236 → 237 (taban)`. Neden: Faz 1 P2 (`ad26d86e`, `10c4658d`) `brand/ortak/gocpaket.js`'i
  ekledi, `tools/ortak.py` onu üç modüle kopyalıyor. Göç paketi AGENTS §0.1'deki tek yazılı istisna; ama
  kural 5'e göre ya bir kopya çıkmalı ya da sahibi bu artışı kabul etmeli (Açık sorular 1).

## Ölçütler ve sayım yolu

Etiketler AGENTS §1.2: `ölçüldü` (kodda sayıldı) · `hesaplandı` (sayılmış parçalardan türetildi) ·
`tahmin` (yaklaşık sayım kuralı) · `veri yok` (eğriler; değer `null`, durum `ölçülmedi`).

| Kimlik | Ölçüt | Sayım yolu (taban belgesindeki yöntem) | Etiket |
|---|---|---|---|
| `uygulama` | Uygulama | kendi `index.html`'i olan üst klasör: `*/src/index.html` + `*/web/index.html` → AYS, ESP, HKM, SPI | ölçüldü |
| `kapi_yerel` | Kapı (yerel) | `sistem/sunucu.py` `SISTEMLER` portları + `GIRIS_PORT` + `HKM_PORT` | ölçüldü |
| `kapi_ev_agi` | Kapı (ev ağı) | `sistem/telefon.py` `PORTLAR` + `KURULUM_PORT`; Tailscale `KAPILAR` ayrıntıda | ölçüldü |
| `veri_yeri` | Verinin doğrusu | modül kökenleri (3) + 4180 kökeni + `hkm.db` + IndexedDB medya (veri-katmani §1a-c) | hesaplandı |
| `cihaz_yolu` | Cihaz yolu | 4 ağ yolu imzası: modül `build.py` (tek dosya), `telefon.py`, `uzak.py`, iOS `YerelSunucu.swift`; bağlanma biçimi (9) ayrıntıda | ölçüldü |
| `kopya_dosya` | Üçe kopyalanan dosya | `tools/ortak.py` `DOSYALAR` ∪ `brand/ortak`'taki her `.js/.css` (ortak.py yüklenirken böyle genişletiyor, s.513-516) + `tools/seviye.py` `DOSYALAR`; ×3 ayrıntıda | ölçüldü |
| `ayar_yeri` | Elle yazılan ayar yeri | `SECIMLER` + `secimHtml` paneli; `TASINAN/PROFIL_KAPSAR/SIFIRLANAN/ORTAK` katalogdan türemiyorsa her biri +1 | ölçüldü |
| `denetimsiz_secim` | Denetimsiz seçim | `SECIMLER` anahtarları − `secimHtml('…')` ile çizilenler − `vurguHtml` | ölçüldü |
| `ic_icelik` | İç içelik | modül başına var olan katlar: çekmece › disiplin (`ek:{disc}`) › sekme (`TABS`/`SayfaBolumleri`) › açılır araç (`K.Entry`); en derini (AYS 2, SPİ 3, ESP 4) | hesaplandı |
| `sayfa` / `blok` / `komut` | Kayıtlı parça | `\b(P|PARCA)\.<tür>\(` — modül `src/js` (core hariç) + `brand/ortak/**` (testler dahil; taban yöntemi böyle) | ölçüldü |
| `ekran_ici_sekme` | Ekran içi sekme | `screens/*.js`: `SayfaBolumleri({bolumler:[…]})`, `TABS.map`, `GRUPLAR.map` öğeleri; çağrı yoksa `TABS` dizisi | tahmin |
| `ekran_dosyasi` | Ekran dosyası | `ls <modül>/src/js/screens/*.js` | ölçüldü |
| `tekrar_zamanlayici` | Tekrar zamanlayıcısı | not-ve-tekrar §4'teki 9 uygulamanın imzası (dosya + desen) duruyor mu; yetim `meydan_deste` ayrıntıda | ölçüldü |
| `not_yapisi` | Not yapısı | `defter.js` + not-ve-tekrar §2 tablosunun 15 satırının imzası | ölçüldü |
| `ag_cizimi` | Ağ çizimi | `defter.js` `agCiz` + `bilinc.js` `haritaSvg` | ölçüldü |
| `kesinlik_dili` | Kesinlik etiketi dili | «hesaplandı» için koddaki ayrı yazım: `'computed'`, `'derived'` (testler hariç); `'derived'` geçen dosya ayrıntıda (16) | ölçüldü |
| `hkm_tablo` | HKM tablo | `HKM/core/db.py` `CREATE TABLE`, yorum satırı hariç | ölçüldü |
| `hkm_api` | HKM `/api/` yolu | `HKM/daemon.py` tırnak içindeki benzersiz `/api/…` | ölçüldü |
| `hkm_cekirdek` | HKM çekirdek dosyası | `HKM/core/*.py` | ölçüldü |
| `kod_hacmi` | Kod hacmi | test dışı `.js/.css/.py/.html` satırı; `tools, belgeler, veri, kalite, dist`, testler hariç; kopyalar dahil | ölçüldü |
| `king_gorunen_arac` | King'in gördüğü araç | king-hkm §3: `king-arac.js` `ad:'…', tur:'…'` + `dis('…')` + Gün araçları; üç `kingarac.js` `ad/tur`; AYS `tools.js` `name` + `actions.js` (`modelYok/olcum` olmayan); `ogret.js` 2×3 | ölçüldü |
| `king_toplam_arac` | King aracı (toplam) | görünen + `yetki.js` seviyeli eylem (9) + modül eki (`app.js` `eylemler`, 4) + `intents.KINDS` (16) + `patron.COMMANDS` (9) | ölçüldü |
| `king_niyet_kurali` | NIYET kuralı | `brand/ortak/king.js` `const NIYET` dizisinin öğesi | ölçüldü |
| `king_rehber_sozcuk` | Sayfa rehberi sözcüğü | `parca-rehber.js` `es:[…]` dizgeleri (26 sayfa ayrıntıda) | ölçüldü |
| `king_bench_yamasi` | Bench yaması | `brand/ortak/king-yol.js` içinde «Bench» geçen yorum (belge `king.js` diyor; yorumlar `king-yol.js`'te) | ölçüldü |
| `king_sinav_cumle` | Sınav cümlesi | `tools/king_sinav.json` `cumleler` | ölçüldü |
| `king_bench_vaka` | King-Bench vakası | `tools/king_bench/paket/*.json` `"id"` | ölçüldü |

«İmza» yöntemi: envanterin elle bulduğu yapılar (tekrar, not, ağ, cihaz yolu) dosya + desen olarak
yazıldı; silinen yapı sayıdan düşer. Sınırı: **yeni** eklenen bir yapıyı kendiliğinden bulmaz
(kodda `shortcut:` notu var).

## Bugün / taban / hedef

Bugün = 2026-11-13 kaydı. Taban = `taban-20261112.md`. Hedef = plan §10 (taban belgesi).

| Ölçüt | Bugün | Taban (belge) | Hedef | Fark ve nedeni |
|---|---|---|---|---|
| Uygulama | 4 | 4 | 1 | — |
| Kapı yerel + ev ağı | 5 + 4 | 5 + 4 | 1 | — |
| Verinin doğrusu | 6 | 6 | 1 depo | — |
| Üçe kopyalanan dosya | **237** (227 + 10) | 236 (226 + 10) | 0 | +1: `gocpaket.js`, Faz 1 P2, 13 Kasım. 12 Kasım koduyla araç 236 verir |
| Ayar yeri · denetimsiz seçim | 2 · 8 | 2 · 8 | 1 · 0 | — |
| İç içelik | 4 | 4 | ≤ 2 | — |
| Sayfa · blok · komut | 79 · 304 · 69 | 79 · 304 · 69 | sayfa ≤ 40 | — |
| Ekran içi sekme | 115 (tahmin; AYS 32, SPİ 38, ESP 45) | ≈120 (38, 40, 42) | 0 | AYS `cards.js` `bolumler()` ve `solve.js` üçlü ifadesi, SPİ `move.js` `TABS.concat(...)` çalışma anında kuruluyor, sayılamıyor (−); ESP Bugün sekmeleri sayılıyor, belgede yok (+) |
| Ekran dosyası | 64 | 64 | — | — |
| Tekrar zamanlayıcısı | 9 + 1 yetim | 9 + 1 | 1 | — |
| Not yapısı · ağ çizimi | **16** · 2 | 13 · 2 | 1 · 1 | 16 = `defter` + not-ve-tekrar §2'nin 15 satırı; sentezdeki 13'ün hangi satırları dışarıda bıraktığı yazılı değil. Kod değişmedi; tanım farkı |
| Kesinlik etiketi dili | 2 (`derived` 16 dosya) | 2 dil, 4 yerleşim | 1 | yerleşim (4) elle sayıldı, otomatik değil |
| Cihaz yolu | 4 (bağlanma biçimi 9) | 4 (9) | 1 | — |
| HKM tablo · `/api/` · çekirdek | 50 · 126 · 93 | 50 · 126 · 93 | kalkar | — |
| King'in gördüğü araç | **128** (oku 60 / yaz 68) | 124 (57 / 67) | ≤ 12 | +4: `gun_sen`, `gun_sen_yaz`, `gun_kart_cek`, `gun_karne` (`king-arac.js` Gün araçları, 3 Kasım'dan beri var); taban betiği bu gruptan yalnız elle eklediği 2'yi saymış. 12 Kasım kodunda da 128 |
| King aracı toplam | **166** | 162 | — | aynı +4 |
| NIYET · rehber sözcüğü · Bench yaması | 13 · 76 · 23 | 13 · 76 · 23 | 0 (sözcük yönlendirmesi kalkar) | — |
| Sınav cümlesi · Bench vakası | 358 · 350 | 358 · 350 | izlenir | — |
| Kod hacmi | ≈552 bin satır (1 133 dosya, 33,7 MB) | yok | izlenir | ekipten motor/ ve alan/ yazılırken her koşuda değişir |

## Bütçe kuralları

- `kalite/butce.json`: her ölçüt için `taban`, `hedef`, `yon`, isteğe bağlı `grup` ve `belge` (belgedeki
  sayı farklıysa). Taban, bu aracın 12 Kasım koduyla aynı yoldan verdiği sayıdır (King 128/166,
  not 16, sekme 115); kopya dosya belgedeki 236'da tutuldu, çünkü 237 13 Kasım'ın ekidir.
- `yon`: `azalmali` (hedef tabanın altında) ve `artmamali` (hedef yok) için **her artış aşımdır**;
  `izlenir` (kod hacmi, sınav cümlesi, Bench vakası) kaydedilir, denetlenmez.
- Başvuru: `kalite/kayit/` içindeki en son kayıt; kayıt yoksa ya da ölçüt kayıtta yoksa `taban`.
- **Kural 5 (bir giren, bir çıkar):** aynı `grup`taki (yapı, parça, ayar, motor, hkm, yönlendirme)
  bir ölçüt artarken grubun toplamı artmadıysa satır `TAKAS:` olur, aşım sayılmaz. Toplam da arttıysa
  `AŞIM:` ve çıkış 1.
- Ölçülemeyen ya da başvurusu olmayan ölçüt `UYARI:` satırı verir, aşım sayılmaz.
- Bütçe iki yoldan gevşer, ikisi de görünür bir dosya değişikliğidir: `butce.json` tabanını değiştirmek
  ya da yeni kaydı (`--kaydet`) depoya almak.
- Kayıt dosyası belirlenimci: anahtarlar sıralı, `ensure_ascii=False`, mutlak yol yok, tarih yalnız
  gün. Aynı kod aynı gün aynı baytları verir (test bunu sınar).

## Ölçülemeyenler

Hepsi `durum: ölçülmedi`, `deger: null`, etiket `veri yok`; komut kayıtta `komut` alanında.

| Eğri | Ne ölçülür | Ölçecek komut (bugün var olan ya da yapılacak) |
|---|---|---|
| Tanıma | doğru, yerinde kullanılan kişi bilgisi | `python tools/king_bench/bench.py --paket hafiza`; `python tools/king_bench/bilinc_bench.py` |
| Öğretme | ders önce/sonra mini sınav farkı | `bench.py --paket ogretmen,ogrenme`; ön test → ders → son test düzeneği yapılacak |
| Anlama | etiketli gerçek mesajda niyet isabeti | `node tools/king_sinav.js` (Playwright + çalışan sunucu); «yanlış anladın» etiketli set yapılacak |
| Üretim | üretilen soru/kart hakem puanı | yapılacak: örneklem + cevap anahtarı + insan puanı seti |
| Arama | kaynaklı cevap doğruluğu | yapılacak: gerçek sorgu seti (A7 Arama) |
| Kontrol | sistem görevini araçla bitirme | `bench.py --paket kayit,plan,gun` |
| Kendini eğitme | hatanın derse dönüşmesi | yapılacak: ders defteri (düzenek yok) |
| Tekrar | dersi alınmış hatanın yinelenmesi | `python tools/king_bench/oz.py <sonuç.json> <önceki.json>`; hata kimliği yapılacak |
| Sağlayıcı kalitesi | istek başına jeton, boşa çağrı | `python tools/king_olcum.py` (süre, jeton); boşa çağrı sayacı yapılacak |
| Hafıza | eski bilgiyi hatırlama, bağlam boyutu | `python tools/hafiza_olcum.py` (p1/p3); bağlam bütçesi ekseni yapılacak |
| Sistem · Optimizasyon | açılış, kare süresi, kod hacmi | `node tools/akicilik.js` (stil hesabı sayısı); açılış/kare süresi CDP izi yapılacak; **kod hacmi statik olarak ölçülüyor** |
| Sistem · Anlaşılabilirlik | işe kaç adımda varılıyor, iç içelik | adım sayımı tarayıcıda yapılacak; **iç içelik statik olarak ölçülüyor** |
| Sistem · Hayata etki | haftalık öğrenme adımı, süreklilik | sahibinin canlı verisi gerekir; bu araç gerçek veriyi okumaz |

Ayrıca: sınav puanı (taban 293/300, eski 300 cümlelik sürüm) yeniden ölçülmedi, çalışan King ister;
kesinlik etiketinin 4 yerleşimi elle sayıldı, otomatik değil.

## Testler

`python kalite/olcum_test.py` → **30/30 geçti** (çıkış 0; kırmızıda çıkış 1). Yalnız standart kütüphane;
her koşu geçici klasörde 18 dosyalık sahte bir depo kurar, gerçek depoya ve sahibinin verisine dokunmaz.

| Grup | Test | Ne kanıtlar |
|---|---|---|
| Sayım kuralları | 15 | uygulama (`src/` + `web/` index.html), yerel kapı (SISTEMLER + GIRIS + HKM), ev ağı kapısı (PORTLAR + KURULUM), kopya (ortak DOSYALAR ∪ `brand/ortak` .js/.css + seviye, ×3), sayfa (core hariç, `brand/ortak` testleri dahil), blok, ekran içi sekme (TABS + `bolumler:[…]`), ekran dosyası, NIYET öğesi, HKM tablo (yorum satırı hariç), `/api/` (benzersiz, sorgu ayrılır), HKM çekirdek, kesinlik dili (testteki `'derived'` sayılmaz), not imzası; her değerin geçerli bir etiketi var |
| Ölçülmeyenler | 3 | 13 eğrinin hepsi `ölçülmedi`, `deger: null`, `veri yok`, komutlu; `ölçülmedi` olan hiçbir ölçüt sayı taşımaz; `--md` tablosunda eğri satırı yok |
| Belirlenimcilik | 2 | iki koşu bayt bayt aynı kayıt metni; kayıtta mutlak yol (geçici klasör yolu, `X:\`) yok |
| Bütçe | 6 | artış aşımdır; düşüş geçer, `izlenir` denetlenmez; kural 5: grupta biri çıkınca artış `TAKAS`; grup toplamı artarsa `AŞIM`; başvuru son kayıttır (tabandan önce); ölçülemeyen bütçe `UYARI` verir, aşım sayılmaz |
| Komut satırı | 4 | kayıtsız `--denetle` tabana eşitken 0; `--kaydet` `kayit/<YYYY-MM-DD>.json` yazar; taze kayda karşı `--denetle` 0; yeni bir `index.html` eklenince 1 ve `AŞIM: Uygulama 2 → 3` |

Gerçek depoda (13 Kasım): kayıtsız `--denetle` çıkış 1 (`AŞIM: Üçe kopyalanan dosya 236 → 237 (taban)`),
`--kaydet` → **`kalite/kayit/2026-11-13.json`** (15 395 bayt, 13 `null` = 13 eğri, mutlak yol yok; iki
kaydetme bayt bayt aynı), ardından `--denetle` çıkış 0 («26 bütçe, aşım yok»).

`olcum.py`'de tek düzeltme: aşım satırındaki kaynak, ölçüt kayıtta değersiz (`null`) olduğunda da
«son kayıt» yazıyordu; artık başvuru tabansa «taban» yazar.

## Aşım kaydı

**13 Kasım 2026, ana dal bu dala alındıktan sonra (birleştirme `867bde14`): `--denetle` çıkış 1, iki aşım.**

| Ölçüt | Son kayıt | Şimdi | Nedeni |
|---|---|---|---|
| Sayfa | 79 | 81 | Ana daldaki `913e1222`: Kılavuz sayfasının kaydı üç modülün `guide.js` dosyasına taşındı |
| Sözcük yönlendirmesi (sayfa rehberi sözcüğü) | 76 | 82 | Aynı kayıt: `brand/ortak/parca-rehber.js`'e üç satır, her biri iki sözcük |

Yeni ekran yazılmadı: var olan Kılavuz sayfası King kataloğuna kaydedildi (King sınavındaki kapsam kırmızısını
kapatmak için, dondurulmuş eski modüllerde). Sayım kuralı kayıt satırını saydığı için ölçüt yükseldi.
Kayıt bilerek yenilenmedi: `--kaydet` aşımı sessizce başvuru yapar (açık soru 8). Karar sahibinin:
ya artış gerekçesiyle kabul edilir ve kayıt yenilenir, ya da kural 5 gereği karşılığında bir parça çıkar.
O gün `--denetle` CI'a bağlı değildi, aşım CI'ı kızartmadı.

**Karar (sahibi, 13 Kasım 2026): artış kabul edildi, kayıt yenilendi.** Gerekçe: yeni ekran yok, var olan
Kılavuz sayfasının King kataloğuna kaydı; satırlar dondurulmuş eski modüllerde ve Faz 5'te kalkacak. `--kaydet` ile
`kalite/kayit/2026-11-13.json` Sayfa 81 ve sayfa rehberi sözcüğü 82 olarak yazıldı; `--denetle` «26 bütçe, aşım yok».
`butce.json` tabanları (79 ve 76) ve hedefler değişmedi; yeni başvuru 81 ve 82'dir, bundan sonraki her artış yine aşımdır.

## Açık sorular

1. **Kopya dosya 236 → 237.** `gocpaket.js` (göç paketi, AGENTS'teki yazılı istisna) üç modüle kopyalanıyor.
   13 Kasım kaydı 237'yi yazdı, yani bundan sonra `--denetle` buna karşı geçer. Sahibi istisnayı kabul
   ediyor mu, yoksa kural 5 gereği başka bir kopya mı çıkmalı (o zaman `butce.json` tabanı 236 kalır, kayıt silinir)?
2. **Geçişte geçici artış.** Plan «yeni kabuk eskisinin yanında kurulur» diyor; yeni kabuk kendi
   `index.html`'i ve kapısıyla gelirse `uygulama` 4 → 5, `kapi_yerel` 5 → 6 olur ve kural 5 birleştirmeyi
   durdurur. Seçenek: o gün `butce.json`'a gerekçeli geçici taban, ya da yeni kabuk eski kapılardan birinin
   yerine açılır.
3. **Not yapısı 13 mü 16 mı?** Sentezdeki 13'ün hangi satırları içerdiği yazılı değil. Araç 16 sayıyor
   (`defter` + §2'nin 15 satırı); bütçe tabanı 16. Belge düzeltilsin mi?
4. **`brand/ortak` parça sayımı testleri de sayıyor.** Taban yöntemi böyle (12 sayfanın 11'i test
   kaydı); aynen korundu. Testsiz sayım sayfa tabanını 68 yapar. Hangisi?
5. **Yeni kod görünmüyor.** `motor/` ve `alan/` henüz sayım kurallarına girmiyor (sayfa, not, tekrar,
   zamanlayıcı imzaları eski koddan). Yeni motorun kayıt biçimi belli olunca imza ve desen eklenmeli;
   yoksa yeni yapı bütçeye girmeden büyüyebilir. Yalnız `kod_hacmi` onları sayıyor (izlenir).
6. **Birleştirmeyi durdurma** (A9 çıkışı) için `python kalite/olcum.py --denetle` CI'a ve birleştirme
   denetimine bağlanmalı; bu görevde başka dosyaya dokunulmadığı için bağlanmadı. **Bağlandı (13 Kasım 2026):** CI'da «Karmaşıklık bütçesi aşılmadı» adımı; aşım kabul edilip kayıt yenilendikten sonra.
7. **Kod hacmi hedefi** yok; geçişte yeni kod eskinin yanında yazıldığı için bütçeye bağlanmadı.
8. **Kayıt aynı gün üzerine yazılır.** `--kaydet` günde tek dosya tutar; gün içinde bir artıştan sonra
   yeniden kaydetmek o artışı sessizce başvuru yapar. Kaydetme yalnız birleştirme sonrasına mı bağlansın?
9. **Kayıt belirlenimciliği koda bağlı.** `kod_hacmi` ekip `motor/`, `alan/` yazarken her koşuda değişir;
   aynı bayt yalnız aynı kod üzerinde beklenmeli (13 Kasım'da iki kaydetme aynı çıktı).
