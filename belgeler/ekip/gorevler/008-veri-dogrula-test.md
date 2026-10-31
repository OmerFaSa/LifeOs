# 008 — Veri doğrulayıcısının eşleme mantığına testler

**Durum:** bitti   <!-- bekliyor | sürüyor | bitti | takıldı -->
**Dal:** `ag/008-veri-dogrula-test`
**Efor:** düşük   <!-- düşük (flash_lite) | orta (flash) | yüksek (pro; ölçülen 2026-10-31: flash ile aynı model) -->

## Amaç
`tools/veri_dogrula.py` taslak sağlık verisini resmi PDF metniyle eşleyip temiz katmana taşıyan kapıdır; yanlış
eşleme uydurma bir sayıyı kaynaklı yapar (AGENTS.md: eksik veri sıfır değildir, sayı uydurulmaz). Saf ayrıştırma
işlevlerinin (`sayilar`, `sayi_govde`, `birim_kalip`, `sayi_kaliplari`, `parcalar`, `bul`) hiç testi yok.

## Dokunulacak dosyalar
- `tools/veri_dogrula_test.py` — yeni: saf işlevlerin testleri; ağ, PDF ve `pdftotext` kullanmaz (metin satırları elle verilir).
- `tools/veri_dogrula.py` — YALNIZ bir test gerçek bir hata gösterirse, en küçük düzeltme; önce o hatayı yakalayan test.

## Dokunma
- `veri/` altındaki her dosya.
- Docstring'lerde yazan davranış sözdür: test onu sınar, davranışı değiştirmez (hata değilse).

## Kabul ölçütü
- `sayilar`: «45 - 60» → ["45", "60"]; «< 10 (ideal < 5)» → ["10"]; «15 (600 IU)» → ["15"]; «1,5» → ["1,5"].
- `birim_kalip`: «%» → (r"%\s*", ""); «mg» önce boş sonra mg; «mcg» ve «g» aynı kalıp; «litre/lt/l» ama «lif»i değil; «g» «gram» tutar «günü» tutmaz.
- `sayi_kaliplari` + `bul`: «Demir    15 mg» satırında (demir, 15, mg) bulunur ve satır no 1'den; 80 karakterden uzak sayı bulunmaz;
  cinsiyet «erkek» verilince «kadın» parçası atlanır; çocuk/gebe geçen parça atlanır; «12,5» aranırken «112,5» eşleşmez;
  aralık «%45-60» bütün olarak eşleşir.
- Bir sözü kod tutmuyorsa: testi yaz, kırmızıyı gör, düzelt; «Açık kalan»a hangi söz olduğunu yaz.

## Koşulacak testler
- `python tools/veri_dogrula_test.py`
- `python tools/yazi.py --denetle`

## Sonuç
- **Ne değişti:** `tools/veri_dogrula_test.py` yeni testi eklendi; `sayilar`, `birim_kalip`, `bul` ve cinsiyet/grup filtreleme saf işlevleri için birim testler yazıldı.
- **Koşan testler:** `python tools/veri_dogrula_test.py` -> Ran 4 tests in 0.002s, OK; `python tools/yazi.py --denetle` -> Yazı denetimi: temiz.
- **Kabul testi:** `tools/veri_dogrula_test.py`
- **Açık kalan:** yok
