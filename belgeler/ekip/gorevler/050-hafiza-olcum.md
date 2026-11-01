# 050 · Hafıza arama ölçüm aracı (`tools/hafiza_olcum.py`)

**Durum:** bitti
**Dal:** `ag/050-hafiza-olcum`
**Efor:** orta
**Kabul testi:** `tools/hafiza_olcum_kabul_test.py`

## Amaç
KING-4 B: King'in hafızası artık gömmeyle aranıyor (`HKM/core/memory.py` `ara`, `HKM/core/ollama.py` `gomme`,
qwen3-embedding CPU'da). «Gömme kök eşlemesinden iyi mi, ne kadar sürüyor?» sorusu tek komutla ve her turda
aynı yolla ölçülsün (AGENTS §1: sayıyı kod üretir).

## Dokunulacak dosyalar
- `tools/hafiza_olcum_kume.json` (yeni): en az 24 çift `[{"bilgi": "...", "soru": "..."}]`. Türkçe, gerçekçi
  kişisel bilgiler (sınav tarihi, alerji, hedef, alışkanlık, aile, para, spor) ve her bilgiyi soran ama
  **kelimesini tekrar etmeyen** bir soru (ör. bilgi «Fıstık alerjim var», soru «kuruyemiş yiyebilir miyim»).
  En az 8 çiftte kök eşlemesi (ilk 5 harf) soruyla bilgiyi bağlayamamalı.
- `tools/hafiza_olcum.py` (yeni). Komut: `python tools/hafiza_olcum.py [--ollama http://127.0.0.1:11434] [--json çıktı.json]`.
  - `HKM/`'yi `sys.path`'e ekler; `core.db.connect(":memory:")` ile boş ambar açar, kümedeki her bilgiyi
    `memory.add` ile yazar.
  - `cfg = {"models": {"yerel_adres": <--ollama>}}`. Her soru için iki ölçüm:
    `memory.ara(con, None, soru, k=3)` (kök) ve `memory.ara(con, cfg, soru, k=3)` (gömme; gerçek Ollama).
    Doğru cevap = sorunun çiftindeki bilgi. `p1` = ilk sonuç doğru oranı, `p3` = ilk üçte olma oranı.
  - Gömmede: ilk `ara` çağrısının süresi `ilk_ms` (bütün bilgiler gömülür), sonraki çağrıların ortancası `ms`.
    Doğru bilginin benzerlik ortancası `dogru_benzerlik`, ilk sıradaki yanlışların ortancası `yanlis_benzerlik`.
  - Motor yoksa (`ara` `yontem` «kok» döner) `gomme` alanı `null`, `motor` false; çıkış kodu yine 0.
  - JSON: `{"kume": n, "motor": bool, "kok": {"p1", "p3"}, "gomme": {"p1", "p3", "ilk_ms", "ms", "dogru_benzerlik", "yanlis_benzerlik"} | null}`.
  - Ekrana tek tablo: yöntem, p1, p3, ms.
- `belgeler/ekip/KING-4.md`: «Ölçüm 3b» bölümünün sonuna tek satır: «Tekrar ölçmek için: `python tools/hafiza_olcum.py`».

## Dokunma
- `HKM/` altındaki her şey (kırmızı bölge). Gerçek `HKM/config.json` ve gerçek veritabanı okunmaz.
- Kabul testi dosyası.

## Kabul ölçütü
- Ulaşılamayan adresle (`--ollama http://127.0.0.1:9`) çıkış 0, `motor` false, `gomme` null, `kok.p1` 0–1 arası.
- Kabul testinin açtığı sahte gömme sunucusuyla (`/api/embed`, kelime sayımı) çıkış 0, `motor` true, `gomme`
  alanlarının hepsi sayı, `ilk_ms` ≥ `ms`.
- Küme ≥ 24 çift; en az 8 çiftte kök eşlemesi boş kalır (kabul testi kendisi sayar).

## Koşulacak testler
- `python tools/hafiza_olcum_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd HKM && python -m tests.run` (değişmemeli)

## Sonuç
<!-- Antigravity doldurur; dört satır da dolu olmalı (yoksa «yok»). -->
- **Ne değişti:** `tools/hafiza_olcum_kume.json` (24 çift, 21 kökte boş) ve `tools/hafiza_olcum.py` aracı eklendi; `belgeler/ekip/KING-4.md` Ölçüm 3b sonuna ölçüm komutu eklendi.
- **Koşan testler:** `cd HKM && python -m tests.run` -> `1000/1000 test gecti`
- **Kabul testi:** `python tools/hafiza_olcum_kabul_test.py` -> `hafiza olcum kabul: kume 24 (kokte bos 21), kok p1 0.12, sahte gomme p1 0.12.`
- **Açık kalan:** yok
