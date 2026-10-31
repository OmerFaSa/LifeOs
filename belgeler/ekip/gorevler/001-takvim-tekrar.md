# 001 · Takvimde tekrarlayan etkinlikler

**Durum:** bitti
**Dal:** `ag/001-takvim-tekrar`
**Efor:** yüksek

## Amaç
Google Takvim'in gizli iCal adresinden okunan etkinliklerde tekrarlayanlar
(her hafta aynı ders gibi) bugün yalnız ilk tarihleriyle görünüyor
(`sistem/ice.py` `ics_coz` içindeki `shortcut:` yorumu). Önümüzdeki 14 günde
düşen bütün tekrarları göster.

## Dokunulacak dosyalar
- `sistem/ice.py` — `ics_coz` RRULE ve EXDATE okusun; `shortcut:` yorumu kalksın.
- `tools/ice_test.py` — yeni durumların testi.

## Dokunma
- `brand/ortak/`, modüllerin `src/` klasörleri, `sistem/` içindeki başka dosyalar.
- `disari()`, `isle()`, `takvim_tazele()` davranışı (adres dışarı verilmez, 30 dk önbellek).

## Kabul ölçütü
- Yalnız Python standart kütüphanesi.
- `RRULE` içinde `FREQ=DAILY|WEEKLY|MONTHLY|YEARLY`, `INTERVAL`, `COUNT`,
  `UNTIL` (tarih ya da tarih-saat, `Z` dahil) ve WEEKLY için `BYDAY`
  (`MO,TU,…`) desteklenir. Tanınmayan bir RRULE olursa etkinlik eskisi gibi
  yalnız ilk tarihiyle kalır (hata vermez).
- `EXDATE` satırlarındaki tarihler (virgüllü liste de olabilir) atlanır.
- Her tekrar ayrı satır: aynı `ad`, kendi `bas`/`bit`'i (süre ilk örnekten),
  `tum_gun` korunur. Sonuç saate göre sıralı, en çok 60 satır (bugünkü sınır).
- Tekrar üretimi sonsuz döngüye girmez: ufkun (14 gün) ötesinde durur;
  `COUNT`/`UNTIL` yoksa da biter.
- Test: haftalık ders (BYDAY=MO,WE) 14 günde 4 kez; `COUNT=2` iki kez;
  `UNTIL` geçmişte biten tekrar hiç; bir `EXDATE` atlanır; günlük tüm gün
  etkinliği her gün; tanınmayan `FREQ=SECONDLY` yalnız ilk örnek.

## Koşulacak testler
- `python tools/ice_test.py` (çıkış 0)

## Sonuç
- **Ne değişti:**
  - `sistem/ice.py`: `ics_coz` ve yardımcıları (`_rrule_ac`, `_haric_mi`, `_ay_ekle`, `_yil_ekle`) eklendi. `RRULE` (`FREQ=DAILY|WEEKLY|MONTHLY|YEARLY`, `INTERVAL`, `COUNT`, `UNTIL`, `BYDAY`) ve `EXDATE` desteği sağlandı; `shortcut:` yorumu kaldırıldı. Tanınmayan `FREQ` (örn. `SECONDLY`) durumunda etkinlik ilk tarihiyle bırakıldı.
  - `tools/ice_test.py`: Haftalık ders (BYDAY=MO,WE 14 günde 4 kez), `COUNT=2`, geçmişte biten `UNTIL`, tarihli `UNTIL`, tekil ve virgüllü `EXDATE`, günlük tüm gün ve tanınmayan `FREQ=SECONDLY` test senaryoları eklendi.
- **Koşan testler:**
  - `python tools/ice_test.py` -> Çıkış: 0 (`Ice aktarma temiz: ics, rrule, exdate, ufuk, yalniz bu bilgisayar, ozel baslik, adres gizli, onbellek, ozet suzgeci, ag hatasi.`)
  - `cd AYS && node tools/runtests.js 4721` -> 3121/3121 geçti
  - `cd SPI && node tools/runtests.js 4722` -> 2880/2880 geçti
  - `cd ESP && node tools/runtests.js 4723` -> 2587/2587 geçti
- **Açık kalan / soru:** Yok.
