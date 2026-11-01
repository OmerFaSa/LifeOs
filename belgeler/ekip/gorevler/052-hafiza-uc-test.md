# 052 · Hafıza ve kendiliğinden King uç nokta testleri + belge

**Durum:** bekliyor
**Dal:** `ag/052-hafiza-uc-test`
**Efor:** orta
**Kabul testi:** `tools/hafiza_uc_kabul_test.py`

## Amaç
(051 «Dokunulacak dosyalar»da okunacak çekirdek dosyaları andığı için başlatılamadı; aynı iş.)
KING-4 tur 3b HKM'ye yeni uçlar ekledi (bkz. HKM daemon'unun baş belgesi). Belgenin kaynağı: hafıza ve
kendiliğinden modüllerinin (HKM çekirdeği, `core` klasörü) baş belgeleri; okunur, değiştirilmez. Çekirdek mantığın birim testleri
var (`HKM/tests/test_hafiza3.py`); uçların HTTP üzerinden testi ve HKM belgesi eksik.

## Dokunulacak dosyalar
- `HKM/tests/test_hafiza_uc.py` (yeni): `run()` işlevi; `tests.test_daemon._Server` ile gerçek HKM açar
  (`HKM/tests/test_dongu.py` `run_daemon` kalıbı). En az 6 `test(...)`:
  1. `GET /api/hafiza` jetonsuz 401; jetonla 200 ve `bilgiler`, `olanlar`, `beceriler`, `adaylar` anahtarları.
     `POST /api/memory {text}` ile yazılan bilgi `bilgiler`de `kaynak` ve `tarih`le görünür.
  2. `GET /api/hafiza/ara?q=...` 200, `yontem` «kok» (testte ağ kapalı), ilk sonuç yazılan bilgi.
  3. `POST /api/hafiza/<id>/duzelt {text}` 200 ve metin değişir; boş metin 404; olmayan id 404.
     `POST /api/hafiza/<id>/unut` 200, ikinci kez 404; `GET /api/hafiza`'da artık yok.
  4. `POST /api/olay` (KING-OLAY.md biçimi; `spi`, `uyku_dustu`, `ort7` 5,5, `ort28` 7,2, `at` şimdi) 200 ve
     karar «basla» ya da «bekliyor» (sessiz saat 23:00–08:00); aynı kimlik ikinci kez `tekrar: true`.
     Biçimsiz gövde 400.
  5. `GET /api/king/kendiliginden` 200: `butce.toplam` 3, `sessiz_saat`, `kararlar[0].tur` «uyku_dustu».
     Karar «basla» ise `bekleyen[0].neden.olay` «spi.uyku_dustu».
  6. Karar «basla» ise `GET /api/king/bekleyen?modul=spi` mesajı `neden` alanıyla verir.
- `HKM/tests/run.py`: `test_hafiza_uc` içe aktarılır ve `test_dongu.run_daemon()` satırının ardından
  `test_hafiza_uc.run()` çağrılır.
- `HKM/MIMARI.md`: «Hafıza (üç katman) ve kendiliğinden King» başlıklı kısa bölüm (≤ 25 satır): katmanlar ve
  kaynakları, gömme önbelleği (`hafiza_gomme`, yedeğe girmez), uçlar, kural motoru kararları, bütçe ve sessiz
  saat, `belgeler/ekip/KING-OLAY.md` bağlantısı. Bilgiyi Amaç'ta anılan baş belgelerden al; uydurma yok.

## Dokunma
- HKM çekirdeği ve daemon (kırmızı bölge). Testte bulduğun hata varsa düzeltme; «Açık kalan»a yaz.
- Kabul testi dosyası.

## Kabul ölçütü
- `HKM/tests/test_hafiza_uc.py` `run()` en az 6 test koşar, hepsi geçer.
- Dosya şu yolların hepsini çağırır: `/api/hafiza`, `/api/hafiza/ara`, `/duzelt`, `/unut`, `/api/olay`,
  `/api/king/kendiliginden`, `/api/king/bekleyen`.
- `HKM/tests/run.py` onu koşar; `HKM/MIMARI.md`'de bölüm var ve `KING-OLAY.md`'ye bağlanır.

## Koşulacak testler
- `python tools/hafiza_uc_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd HKM && python -m tests.run`

## Sonuç
<!-- Antigravity doldurur; dört satır da dolu olmalı (yoksa «yok»). -->
- **Ne değişti:**
- **Koşan testler:**
- **Kabul testi:**
- **Açık kalan:**
