# 007 · Takvimde bugün süren etkinlikler

**Durum:** bekliyor   <!-- bekliyor | sürüyor | bitti | takıldı -->
**Dal:** `ag/007-takvim-suren`
**Efor:** orta   <!-- düşük (flash_lite) | orta (flash) | yüksek (pro; ölçülen 2026-10-31: flash ile aynı model) -->
**Kabul testi:** `tools/ice_suren_kabul_test.py`

## Amaç
Google Takvim kartı (`sistem/ice.py` `ics_coz`) yalnız bugün ya da sonra BAŞLAYAN etkinlikleri alıyor
(`gun_basi <= bas`). Dün başlayıp bugün süren çok günlük bir etkinlik (kamp, tatil) ya da gece yarısını
aşan bir etkinlik kartta hiç görünmüyor. Ayrıca tüm gün etkinlikte DTEND yoksa bitiş boş kalıyor; RFC 5545'e
göre tek günlük etkinliktir.

## Dokunulacak dosyalar
- `sistem/ice.py` — `_rrule_ac` ve `ics_coz`: bir etkinlik (ya da tekrarın bir örneği) [bugün 00:00, ufuk) aralığıyla
  ÖRTÜŞÜYORSA gelir: başlangıcı aralıkta, ya da başlangıcı önce ama bitişi bugün 00:00'dan SONRA. Tüm gün + DTEND
  yoksa bitiş = başlangıç + 1 gün. Bitişi olmayan saatli etkinlik eskisi gibi yalnız başlangıcıyla değerlendirilir.
- `tools/ice_test.py` — yeni davranışın kendi birim testleri (kabul testinin dışındaki kenarlar: haftalık/aylık
  tekrarda süren örnek, EXDATE ile dışlanan süren örnek, ufuk sınırı).

## Dokunma
- `tools/ice_suren_kabul_test.py` (kabul testi).
- `brand/ortak/ice.js` ve modüllerdeki kopyaları (kartın görünümü Claude Code'da).
- `ics_coz`'un çıktı biçimi: `{bas, bit, tum_gun, ad}`, saat «YYYY-MM-DDTHH:MM», en çok 60, başlangıca göre sıralı.

## Kabul ölçütü
- 30 Eki–2 Kas (DTEND hariç) tüm gün «Kamp», 31 Eki 10:00'da gelir: bas 2026-10-30T00:00, bit 2026-11-02T00:00.
- 30 Eki 22:00–31 Eki 02:00 etkinliği 31 Eki'de gelir.
- Bitişi bugün 00:00 ya da öncesi olan (tüm gün ya da saatli) etkinlik gelmez.
- DTEND'siz tüm gün 31 Eki: bit 2026-11-01T00:00.
- Her gece 23:00–01:00 tekrarlayan: dün geceki örnek gelir, ondan öncekiler gelmez, aynı an iki kez gelmez.
- `python tools/ice_test.py` yeşil kalır (RRULE, EXDATE, RECURRENCE-ID davranışı bozulmaz).

## Koşulacak testler
- `python tools/ice_suren_kabul_test.py` (önce kırmızı, sonra yeşil)
- `python tools/ice_test.py`
- `python tools/yazi.py --denetle`

## Sonuç
<!-- Antigravity doldurur; dört satır da dolu olmalı (yoksa «yok»). Pilot eksik bırakılanı bir kez geri gönderir. -->
- **Ne değişti:**
- **Koşan testler:**
- **Kabul testi:**
- **Açık kalan:**
