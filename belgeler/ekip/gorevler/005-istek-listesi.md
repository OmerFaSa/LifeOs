# 005 · İş isteklerini listele ve planlandı işaretle

**Durum:** bekliyor   <!-- bekliyor | sürüyor | bitti | takıldı -->
**Dal:** `ag/005-istek-listesi`
**Efor:** orta   <!-- düşük (flash_lite) | orta (flash) | yüksek (pro) -->

## Amaç
Görev Takibi'nin «iş iste» kutusu her isteği `LifeOs-ajan/istekler.jsonl`'e bir
satır olarak yazar: `{"metin": "...", "durum": "yeni", "t": 1793450000}`.
Claude Code bu istekleri tek komutla görmeli ve görev dosyasını yazınca isteği
«planlandı» diye işaretleyebilmeli.

## Dokunulacak dosyalar
- `tools/ofis_pilot.py` — iki işlev: `istekler()` ve `istek_isle(sira, gorev)`.
  Dosya yolu için var olan `yol("istekler.jsonl")`'i kullan.
- `tools/ajan.py` — `main()`'e iki komut: `istekler` ve `istek <sıra> <görev-no>`
  (var olan `pilot` dalı gibi `import ofis_pilot` ile); dosya başındaki kullanım
  listesine iki satır.
- `tools/ofis_pilot_test.py` — yeni davranışın testi (geçici klasörde).

## Dokunma
- `tools/gorev_takip.py`, `tools/ajan_kanca.py`, `tools/ofis_test.py`, `.github/`,
  `brand/`, `sistem/`, `HKM/`, `AYS/`, `SPI/`, `ESP/`, bu görev dosyası dışındaki belgeler.

## Kabul ölçütü
- `istekler()` dosyadaki boş olmayan her satır için bir sözlük döndürür; `sira`
  1'den başlar ve satır sırasıdır (bozuk JSON satırı da bir sıra tüketir, ama
  listeye girmez). Dosya yoksa `[]`.
- `python tools/ajan.py istekler` yalnız `durum` «yeni» olanları basar, her biri
  bir satır: sıra, `GG.AA SS:DD` zamanı, metnin ilk 100 karakteri. Yeni istek
  yoksa tam olarak `Yeni istek yok.` basar.
- `istek_isle(2, "006")`: 2. satırın `durum`'unu `planlandı`, `gorev`'ini `"006"`
  yapar; öbür satırlar (bozuk olan dahil) bayt bayt aynı kalır. Dosya geçici
  dosyaya yazılıp `os.replace` ile değiştirilir.
- Geçersiz sıra (0, satır sayısından büyük, bozuk satır) ya da `\d{3}` olmayan
  görev numarası `SystemExit` verir; mesaj düzgün Türkçe, dosya değişmez.
- `python tools/ajan.py istek 2 006` başarıda `2. istek planlandı: görev 006.` basar.

## Koşulacak testler
- `python tools/ofis_pilot_test.py`
- `python tools/ajan_test.py`

## Sonuç
<!-- Antigravity doldurur: ne değişti, hangi testler koştu (çıktı satırı), açık kalan / sorular. -->
