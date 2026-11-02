# 063 · A6 model merdiveni ölçüm betiği: `tools/merdiven_olcum.py`

**Durum:** bitti
**Dal:** `ag/063-merdiven-olcum`
**Efor:** orta
**Kabul testi:** `tools/merdiven_olcum_kabul_test.py`

## Amaç
KING-4 A6 (commit 7e526375): kolay iş yerel modelde, zor iş bulutta; bulut kotası (429/RESOURCE_EXHAUSTED) dolunca yerele düşülür. Ölçüm şimdiye dek oturuma özel betikle yapıldı; bu görev onu depoya kalıcı ve tekrar koşulabilir yapar (aynı ders: 030, 050).

## Dokunulacak dosyalar
- `tools/merdiven_olcum.py` (yeni), `tools/DIZIN.md` (bir satır).

## Ne yapar
- HKM'yi içe aktarır (`sys.path` → `HKM`), `core.ai.ask`'i doğrudan çağırır. Defter **geçici** SQLite (`tempfile`), ayar canlı `HKM/config.json`'un **bellekteki kopyası** (yazılmaz) ya da `--kuru`'da sabit test ayarı. Canlı ayar ve `HKM/db/hkm.db` asla yazılmaz.
- Altı mesaj, sırayla: kolay `selam, nasılsın?`, `teşekkürler King`, `45 dk koştum cümlesi hangi modüle ait? tek kelime`, `bugün için tek cümlelik sabah brifingi yaz`; zor `önümüzdeki iki hafta için AYS çalışma planı çıkar, gün gün`, `sabah mı akşam mı çalışmalıyım, karar ver ve gerekçelendir`. Her biri için `seviye = core.seviye.sinifla(metin)["seviye"]`, rol `king`, `ai.ask(..., seviye=...)`.
- Ayar: `yer: hibrit`, `yerel.ekonomik` = `--yerel` (varsayılan `gemma4:e2b`), `king` ataması `google` + `--bulut` (varsayılan `gemini-3.6-flash`).
- `--kuru`: ağ yok; `ai.ask`'e `transport` verilir (sahte sağlayıcı: her çağrıda `"Tamam.", 10, 3` döner; `--kota` ile `google` çağrısı `urllib.error.HTTPError(…, 429, …)` gövdesi `{"error":{"message":"RESOURCE_EXHAUSTED … retry in 120s"}}` yükseltir). Test ayarında anahtarlar sahte (`{"keys":{"google":"g-test"}}`). Her koşu başında `core.motor.kota_sifirla()`.
- Çıktı: varsayılan okunur tablo (metin, seviye, kat, model, ms, giriş, çıkış, neden); `--json` ile tek JSON nesnesi: `{"satirlar":[{metin, seviye, kat, neden, model, ms, giris, cikis}], "seviyeler": ai_olcum(con)["seviyeler"], "dususler": ai_olcum(con)["dususler"]}`. `kat` ve `neden` = cevabın `motor.kat` / `motor.kat_neden`'i; `ms` duvar saati.
- Canlı koşu (`--kuru` yoksa) Ollama ya da bulut yoksa çökmez; hata satırını yazar.

## Dokunma
- `HKM/` altında hiçbir dosya, `HKM/config.json`, `HKM/db/`, diğer `tools/` betikleri, kabul testi dosyası, görev dosyasının Sonuç dışı.

## Kabul ölçütü
- Kabul testi yeşil: kuru koşu 6 satır, ilk dört `yerel`, son iki `bulut`; `seviyeler` yerel+bulut; düşüş yok. `--kota`: zor ikisi `yerel`, nedende «kotası dolu», `dususler` dolu. Canlı ayar ve defterin değişme zamanı aynı.

## Koşulacak testler
- `python tools/merdiven_olcum_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd HKM && python -X utf8 -m tests.run`

## Sonuç
- **Ne değişti:** `tools/merdiven_olcum.py` betiği eklendi (KING-4 A6 model merdiveninin 6 mesajlık kolay/zor ayrımını, yerel/bulut atamasını ve 429 kota düşüşünü geçici SQLite defteri ve sahte/canlı taşıyıcıyla ölçer; varsayılan tablo ve `--json` destekler). `tools/DIZIN.md` dizinine ölçüm bölümü altına `merdiven_olcum.py` satırı eklendi.
- **Koşan testler:**
  - `python tools/merdiven_olcum_kabul_test.py` -> `merdiven olcum kabul: kuru kosu, kolay yerel / zor bulut, kota dususu, canli dokunulmadi.`
  - `python tools/tools_dizin_kabul_test.py` -> `tools dizin kabul: 101 dosya, sekiz bolum, her biri bir kez ve aciklamali.`
  - `cd HKM && python -X utf8 -m tests.run` -> `1013/1013 test gecti`
- **Kabul testi:** `python tools/merdiven_olcum_kabul_test.py` -> `merdiven olcum kabul: kuru kosu, kolay yerel / zor bulut, kota dususu, canli dokunulmadi.`
- **Açık kalan:** yok
