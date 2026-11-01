# 013 · AYS takvim içe aktarmada tekrar kuralı (RRULE)

**Durum:** bitti
**Dal:** `ag/013-ays-takvim-tekrar`
**Efor:** yüksek
**Kabul testi:** `tools/ays_takvim_tekrar_kabul_test.py`

## Amaç
AYS'ye okulun ya da telefonun takvimi (.ics) içe aktarılırken tekrarlayan
etkinlikler (haftalık ders, aylık deneme) bugün yalnız ilk günüyle geliyor:
`AYS/src/js/core/takvim.js` `oku()` RRULE görünce yalnız `e.tekrar = true`
der ve «tekrar kuralı okunmadı» notu düşer (başlıktaki değişmez 5). Sunucu
tarafı (`sistem/ice.py` `_rrule_ac`, görev 001) bunu çözdü; istemci eksik.
Tekrarlar açılsın, her tekrar önizlemede ayrı satır olsun.

## Dokunulacak dosyalar
- `AYS/src/js/core/takvim.js` — `oku(metin, bugunISO)` tekrarları açar; `onizle` bugünü `oku`'ya geçirir; başlık yorumundaki değişmez 5 yeni davranışı anlatır.
- `AYS/src/tests/takvim.test.js` — «tekrar kuralı okunmadı» bekleyen sınama yeni davranışa göre güncellenir; açılım için birkaç sınama.

## Dokunma
- `sistem/ice.py` ve başka her dosya; `yaz`, `disa`, `iceAl`, bildirim kısmı.
- Kabul testi dosyası.

## Kabul ölçütü
- `oku(metin, bugunISO)`: `bugunISO` yoksa `U.todayISO()`. Tekrarsız etkinlik eskisi gibi (uid'i değişmez; geçmişte olsa da gelir).
- `RRULE`: `FREQ=DAILY|WEEKLY|MONTHLY`, `INTERVAL`, `COUNT`, `UNTIL` (tarih ya da `…Z` tarih-saat; dahil), WEEKLY için `BYDAY` (`MO,…,SU`). MONTHLY ayın aynı günü; o gün olmayan ay atlanır (RFC 5545: 31 Aralık, COUNT=3 → 31 Ara, 31 Oca, 31 Mar).
- `COUNT` DTSTART'tan sayılır; geçmişteki ve `EXDATE`'teki tekrarlar sayıya girer ama gelmez. `EXDATE` virgüllü liste olabilir.
- Açılan her tekrar ayrı etkinlik: aynı başlık, kendi `bas`/`bit`'i (süre ilk örnekten), `tekrar:true`, ayrı ve kararlı `uid` (ör. `uid + '@' + bas`).
- Aynı UID'li `RECURRENCE-ID` kaydı o tekrarın yerine geçer: açılımdan o tarih çıkar, kayıt kendi tarihinde tek satır gelir (DERSLER 001).
- Yalnız `bit >= bugun` ve `bas < bugun + 365 gün` olan tekrarlar gelir; döngü pencerenin ötesinde ya da `EN_COK` (500, toplam) dolunca durur. Sonu olmayan günlük tekrar, iki yıl önce başlamış olsa da hızlı biter.
- Tanınmayan RRULE (ör. `FREQ=SECONDLY`, `YEARLY` dahil desteklenmeyen her şey): etkinlik yalnız ilk günüyle, «tekrar» sözcüğü geçen bir not düşer. Desteklenenler için «okunmadı» notu çıkmaz.
- `onizle`: açılmış tekrarlar satır satır; `icsUid` kayıtlı tekrar `var`, diğerleri `yeni`.

## Koşulacak testler
- `python tools/ays_takvim_tekrar_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd AYS && node tools/runtests.js 4731`

## Sonuç
<!-- Antigravity doldurur; dört satır da dolu olmalı (yoksa «yok»). Pilot eksik bırakılanı bir kez geri gönderir. -->
- **Ne değişti:** `AYS/src/js/core/takvim.js` içinde `oku(metin, bugunISO)` tekrarlayan etkinlikleri (DAILY, WEEKLY BYDAY/INTERVAL, MONTHLY) açacak şekilde tek bir iç işlevle (`aday`) ~100 satır altında yeniden düzenlendi; UNTIL tek seferde çözüldü; COUNT, EXDATE ve RECURRENCE-ID desteklendi; telefon bildirimi yorum bloğu aynen korundu. `AYS/src/tests/takvim.test.js` içinde eski test güncellendi ve tekrar açılımını doğrulayan 5 yeni test eklendi.
- **Koşan testler:** `cd AYS && node tools/runtests.js 4731` -> `3135/3136 gecti  ·  1 kaldi` (kalan: «King 3.0 — doğal konuşma (K3) › «King» uyanma»; mikrofon/ses testi, takvimle ilgisiz ve değişiklik öncesinde de mevcuttu)
- **Kabul testi:** `python tools/ays_takvim_tekrar_kabul_test.py` -> `ays takvim tekrar kabul: daily, weekly byday/interval, monthly, count/until, exdate, recurrence-id, 365 gun ve 500 sinir.`
- **Açık kalan:** yok
