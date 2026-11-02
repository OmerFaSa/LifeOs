# 030 · HKM ölçüm aracı (`tools/hkm_olcum.py`)

**Durum:** takıldı
**Dal:** `ag/030-hkm-olcum`
**Efor:** orta
**Kabul testi:** `tools/hkm_olcum_kabul_test.py`

## Amaç
KING-4 «O · Sistem optimizasyonu» kuralı: ölçümsüz düzeltme yok. Ölçüm 1b'de HKM başlangıç süresi ve uç noktaların süresi elle yazılmış bir betikle ölçüldü. Bu betik depoya kalıcı ve tek komutluk bir araç olarak girsin; sonraki turlar aynı sayıyı aynı yolla alsın.

## Dokunulacak dosyalar
- `tools/hkm_olcum.py` (yeni). Komut: `python tools/hkm_olcum.py [--port 4391] [--tekrar 5] [--db <hkm.db yolu>] [--json <çıktı.json>]`.
  - Geçici bir klasör açar; içine `HKM/config.example.json`'dan türetilmiş bir ayar yazar: `host` 127.0.0.1, `port` verilen kapı, `local_token` rastgele, `db_path` geçici klasörde. Telegram/WhatsApp ve bulut anahtarları boş. `--db` verilirse o dosya geçici klasöre **kopyalanır**, kopya kullanılır.
  - `HKM_CONFIG=<geçici ayar>` ile `HKM/daemon.py`'yi alt süreç olarak başlatır. `/api/health` 200 dönene kadar geçen süre `baslangic_sn` olur (en çok 60 sn).
  - Ölçülecek uçlar: `HKM/daemon.py`'nin baş belgesindeki `GET  /api/...` satırlarından, yolunda `<` ya da `{` olmayanlar (ayrıca `/api/health`). Her uç `Authorization: Bearer <token>` ile `--tekrar` kez çağrılır. Uç başına ortanca `ms`, ilk çağrı `ilk_ms`, son HTTP `kod`.
  - JSON: `{"baslangic_sn", "uc": {yol: {ms, ilk_ms, kod}}, "yavas": [en yavaştan hızlıya en çok 10 yol], "dosyalar": [kullanılan ayar ve veritabanı yolları]}`.
  - Ekrana: `baslangic X sn` satırı ve en yavaş 10 uç (`yol  ms  kod`).
  - Her durumda (hata dahil) HKM sürecini kapatır ve bekler (`try/finally`).
- `belgeler/ekip/KING-4.md` — «Ölçüm 1b» bölümünün sonuna tek satır: «Tekrar ölçmek için: `python tools/hkm_olcum.py --db <kopya>`».

## Dokunma
- `HKM/` altındaki her şey (kırmızı bölge); gerçek `HKM/config.json` ve gerçek veritabanı (yalnız kopyası okunur).
- Kabul testi dosyası.

## Kabul ölçütü
- `python tools/hkm_olcum.py --port 4391 --tekrar 2 --json x.json` çıkış kodu 0.
- `baslangic_sn` 0 ile 60 arasında; en az 20 GET ucu; `/api/health` 200; hiçbir uç 500 ya da üstü dönmez.
- `yavas` listesi en yavaştan hızlıya sıralı ve yolları `uc` içinde.
- Bittiğinde 4391 kapısı kapalı; `dosyalar` gerçek `config.json`'u içermez.

## Koşulacak testler
- `python tools/hkm_olcum_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd HKM && python tests/run.py` (değişmemeli)

## Sonuç
<!-- Antigravity doldurur; dört satır da dolu olmalı (yoksa «yok»). -->
- **Ne değişti:**
- **Koşan testler:**
- **Kabul testi:**
- **Açık kalan:**
