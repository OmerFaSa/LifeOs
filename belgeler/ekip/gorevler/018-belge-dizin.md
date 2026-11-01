# 018 · `belgeler/` dizini (DIZIN.md)

**Durum:** bekliyor
**Dal:** `ag/018-belge-dizin`
**Efor:** orta
**Kabul testi:** `tools/belge_dizin_kabul_test.py`

## Amaç
Depo sahibi (2026-11-01): «organizasyonla sistemi düzenli hale getir». Biten planlar `belgeler/arsiv/`'e taşındı (b38d7eaa). Hangi belgenin güncel olduğunu ve ne anlattığını tek sayfada gösteren bir dizin yok.

## Dokunulacak dosyalar
- `belgeler/DIZIN.md` (yeni) — başlık, iki cümle «nereden başlanır» (önce AGENTS.md, README.md, belgeler/TEKNIK.md), sonra bölümler: `## Teknik`, `## Ekip ve planlar`, `## Ofis`, `## Arşiv`. Her belge tek satır: `- [AD](göreli/yol.md) — ne anlatır, durumu (güncel / tamamlandı / sürüyor) ve tarihi`. Açıklama belgenin kendi başlığından ve ilk paragrafından; uydurma yok. Göreli yollar `belgeler/`'e göredir (`ekip/OFIS.md`, `arsiv/T-DEVIR.md`). Görev dosyaları (`ekip/gorevler/NNN-*.md`) tek tek yazılmaz; `ekip/gorevler/README.md` ve `DERSLER.md` yazılır.
- `README.md` — belgelerin anlatıldığı yere tek satır: `belgeler/DIZIN.md` (bütün belgelerin dizini). (AGENTS.md'ye Claude ekledi.)

## Dokunma
- `AGENTS.md` (yasak bölge).
- Var olan belgelerin içeriği ve yeri (taşıma yok); kod; kabul testi dosyası.

## Kabul ölçütü
- `belgeler/` altındaki her izlenen `.md` (NNN görev dosyaları hariç) dizinde tam bir kez; her bağlantı çalışır; açıklama ≥ 12 karakter.
- `belgeler/arsiv/` dosyaları yalnız `## Arşiv` bölümünde, ötekiler orada değil.
- `README.md` ve `AGENTS.md` `belgeler/DIZIN.md`'yi anar (AGENTS.md'de zaten var).

## Koşulacak testler
- `python tools/belge_dizin_kabul_test.py`

## Sonuç
- **Ne değişti:**
- **Koşan testler:**
- **Kabul testi:**
- **Açık kalan:**
