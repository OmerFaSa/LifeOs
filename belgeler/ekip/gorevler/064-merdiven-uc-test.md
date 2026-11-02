# 064 · A6 merdiveni ve kart cümlesi uç nokta testleri + HKM belgesi

**Durum:** bitti
**Dal:** `ag/064-merdiven-uc-test`
**Efor:** orta
**Kabul testi:** `tools/merdiven_uc_kabul_test.py`

## Amaç
KING-4 tur 4a (commit 7e526375 ve d6bb8528) HKM'ye model merdiveni (kolay iş yerel, zor iş bulut, kota düşüşü),
`usage.seviye/neden` defter alanları, `GET /api/ai_olcum`'a `seviyeler` ve `dususler`, ve `POST /api/king/cumle`
ekledi. Bilginin kaynağı: HKM daemon'unun baş belgesi, motor, seviye ve kendiliğinden modüllerinin baş belgeleri
(HKM çekirdeği, `core` klasörü; okunur, değiştirilmez) ve `HKM/tests/test_merdiven.py`. Çekirdek birim testleri var;
uçların HTTP üzerinden testi ve HKM belgesi eksik.

## Dokunulacak dosyalar
- `HKM/tests/test_merdiven_uc.py` (yeni): `run()`; `tests.test_daemon._Server` ile gerçek HKM açar
  (`HKM/tests/test_hafiza_uc.py` kalıbı). En az 4 `test(...)`:
  1. `GET /api/ai_olcum` jetonsuz 401; jetonla 200 ve `toplam`, `satirlar`, `seviyeler`, `dususler` anahtarları (liste).
  2. Sunucunun veritabanına `butce.record(..., seviye="yerel", neden="kolay iş (alt)")` ve
     `(..., seviye="yerel", neden="düşüş: google kotası dolu, 10:00'a kadar denenmez")` ile iki satır yazılır;
     `GET /api/ai_olcum?date=<bugün>` `seviyeler`de `{seviye:"yerel", cagri:2}`, `dususler`de tek satır (`neden` «düşüş» ile başlar).
  3. `POST /api/king/cumle` jetonsuz 401; `{tur:"x", satirlar:["a"]}` 200 ve `ok:false`; `{tur:"hafta", satirlar:[]}` 200 ve `ok:false`.
  4. `POST /api/king/cumle {tur:"brifing", satirlar:["Uyku: 6,2 saat (ölçüldü)"]}` modelsiz kurulumda (testte ağ kapalı) 200,
     `ok:false` ve sunucu çökmez (ardından `GET /api/health` 200).
- `HKM/tests/run.py`: `test_merdiven_uc` içe aktarılır, `test_hafiza_uc.run()` satırının ardından `test_merdiven_uc.run()`.
- `HKM/MIMARI.md`: «Model merdiveni (A6) ve kart cümlesi» başlıklı kısa bölüm (≤ 25 satır): `seviye.zorluk` kuralları
  (döngü 2+ adım, > 3.000 jeton, üst/araştırma bulut), hibritte diziliş ve yerel yedek, kota (429/RESOURCE_EXHAUSTED,
  pencere, yerel yoksa `reason:"kota"`), defter alanları (`usage.seviye`, `usage.neden`), `ai_olcum` ekleri, `/api/king/cumle`.
  Bilgiyi Amaç'ta anılan baş belgelerden al; uydurma yok.

## Dokunma
- HKM çekirdeği ve daemon (kırmızı bölge). Testte hata bulursan düzeltme; «Açık kalan»a yaz.
- Kabul testi dosyası, görev dosyasının Sonuç dışı.

## Kabul ölçütü
- `HKM/tests/test_merdiven_uc.py` `run()` en az 4 test, hepsi geçer; dosya `/api/ai_olcum`, `/api/king/cumle`, `seviyeler`, `dususler` geçirir.
- `HKM/MIMARI.md` bölümü `zorluk`, `RESOURCE_EXHAUSTED`, `usage.seviye`, `/api/king/cumle` içerir.

## Koşulacak testler
- `python tools/merdiven_uc_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd HKM && python -X utf8 -m tests.run`

## Sonuç
- **Ne değişti:** `HKM/tests/test_merdiven_uc.py` oluşturuldu (`run()` ile 4 adet HTTP uç testi: `GET /api/ai_olcum` yetki ve `toplam`, `satirlar`, `seviyeler`, `dususler` anahtarları, `butce.record` sonrası `seviyeler` ve `dususler` kırılımı, `POST /api/king/cumle` yetki ve geçersiz girdi denetimi, modelsiz kurulumda `ok:false` ve sunucu ayakta kontrolü). `HKM/tests/run.py`'ye `test_merdiven_uc` aktarımı ve `test_merdiven_uc.run()` çağrısı eklendi. `HKM/MIMARI.md`'ye «Model merdiveni (A6) ve kart cümlesi» bölümü eklendi (`seviye.zorluk`, hibrit diziliş, 429/`RESOURCE_EXHAUSTED`, pencere, `reason:"kota"`, `usage.seviye`, `usage.neden`, `ai_olcum`, `POST /api/king/cumle`).
- **Koşan testler:** `python tools/merdiven_uc_kabul_test.py` -> `merdiven uc kabul: 4 test yesil.` · `cd HKM && python -X utf8 -m tests.run` -> `1017/1017 test gecti`
- **Kabul testi:** `tools/merdiven_uc_kabul_test.py` yeşil (4 test yeşil)
- **Açık kalan:** yok
