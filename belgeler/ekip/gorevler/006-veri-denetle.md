# 006 · Veri denetleyicisini sağlamlaştır

**Durum:** bekliyor   <!-- bekliyor | sürüyor | bitti | takıldı -->
**Dal:** `ag/006-veri-denetle`
**Efor:** orta   <!-- düşük (flash_lite) | orta (flash) | yüksek (pro; ölçülen 2026-10-31: flash ile aynı model) -->
**Kabul testi:** `tools/veri_denetle_kabul_test.py`

## Amaç
`tools/veri_denetle.py` veri kuralının bekçisidir (temiz/ yalnız kaynaklı, taslak/ elle yazılan). Üç açığı var:
JSON satırı nesne değilse (`[1]`, `5`) `r.get` ile çöker; `kaynak` için `startswith("http")` «httpx-kitap»ı da URL sayar;
aynı dosyada birebir tekrarlanan kayıt yakalanmaz. Üçü de ihlal olarak raporlanmalı, araç çökmemeli.

## Dokunulacak dosyalar
- `tools/veri_denetle.py` — `denetle_dosya(katman, ad, metin)` işlevi: `[(satır_no, [hata, …]), …]` yalnız ihlalli satırlar;
  boş satır atlanır, satır numarası 1'den ve boşları da sayar. `main()` bunu kullanır (rapor biçimi aynı kalır).
- `tools/veri_denetle_test.py` — yeni: kendi birim testlerin (kabul testinin dışındaki kenarlar).

## Dokunma
- `tools/veri_denetle_kabul_test.py` (kabul testi).
- `veri/` altındaki veri dosyaları; `veri/DENETIM.md` yalnız aracı koşunca kendiliğinden yenilenir, commit'e girmez.
- `.github/` (CI'a eklemeyi Claude Code yapar).

## Kabul ölçütü
- Nesne olmayan satır (`[1, 2]`, `5`, `"metin"`, `null`) çökertmez; o satır «nesne değil» ihlalidir. Bozuk JSON eskisi gibi ihlaldir.
- `kaynakli-*` kayıtta `kaynak` URL'si yalnız `http://` ya da `https://` ile (büyük-küçük harf önemsiz) başlarsa geçerlidir; `veri/ham/<id>.meta.json` yolu eskisi gibi geçerli.
- Aynı dosyada içerikçe aynı kayıt (anahtar sırası önemsiz) ikinci kez gelirse ikincisi «yinelenen kayıt (satır N ile aynı)» ihlalidir; N ilk görüldüğü satır. Farklı dosyalarda aynı kayıt serbest.
- Eski kurallar aynen: taslak etiketi, taslakta `kaynak` yasak, temiz etiketleri, `reddedilen.jsonl` için `neden`.
- Gerçek veride `python tools/veri_denetle.py` koşar; yeni kural ihlal bulursa sayısını ve ilk örneğini «Açık kalan»a yaz, veriyi düzeltme.

## Koşulacak testler
- `python tools/veri_denetle_kabul_test.py` (önce kırmızı, sonra yeşil)
- `python tools/veri_denetle_test.py`
- `python tools/veri_denetle.py`
- `python tools/yazi.py --denetle`

## Sonuç
<!-- Antigravity doldurur; dört satır da dolu olmalı (yoksa «yok»). Pilot eksik bırakılanı bir kez geri gönderir. -->
- **Ne değişti:**
- **Koşan testler:**
- **Kabul testi:**
- **Açık kalan:**
