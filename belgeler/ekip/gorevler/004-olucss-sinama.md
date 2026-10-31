# 004 · Ölü CSS aracının sınaması CI'da

**Durum:** bekliyor
**Dal:** `ag/004-olucss-sinama`
**Efor:** düşük

## Amaç
`tools/olucss.py` kendi sınamasını taşıyor (`python tools/olucss.py --sina`,
`sina()` işlevi), ama CI onu hiç koşmuyor: araç bozulsa kimse görmez.
Sınamayı CI'a ekle ve henüz sınanmayan saf `ust_virgulle_bol` işlevini
sınamaya kat.

## Dokunulacak dosyalar
- `tools/olucss.py` — yalnız `sina()` işlevinin içi (yeni `assert` satırları).
- `.github/workflows/ci.yml` — «Ajan okuyucusu ve istemi» adımından sonra yeni
  bir adım: `python3 tools/olucss.py --sina`.

## Dokunma
- `olucss.py`'nin `sina()` dışındaki hiçbir işlevi; başka araç ve CSS dosyası.

## Kabul ölçütü
- `sina()` şunları da doğrular: `ust_virgulle_bol(".a, .b")` →
  `[".a", " .b"]`; `ust_virgulle_bol(":is(.a, .b), .c")` →
  `[":is(.a, .b)", " .c"]` (parantez içindeki virgül bölmez);
  `ust_virgulle_bol('[data-x="a,b"], .c')` → köşeli parantez içindeki
  virgül de bölmez; `ust_virgulle_bol(".a")` → `[".a"]`.
- `python tools/olucss.py --sina` çıktısı yine `olucss sinama: temiz`, çıkış 0.
- CI adımının adı Türkçe ve kısa: «Ölü CSS aracının sınaması».

## Koşulacak testler
- `python tools/olucss.py --sina`
- `python tools/olucss.py` (davranış değişmedi: «Toplam: 0 olu secici»)

## Sonuç
