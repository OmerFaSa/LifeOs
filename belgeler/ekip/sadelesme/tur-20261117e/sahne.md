# Tur 2026-11-17e · Sahne ve anlar paketi (yon.md adım 3–4)

Sahibi: sahne ajanı. Dosyalar: brand/ortak/piksel-doga.js, piksel.js, piksel.css, piksel.test.js, kabuk/etkilesim.js(+test), kabuk/kabuk.js yalnız `var KAPAK`, yeni kabuk/an.js. Commit yok.

## Durum (adım adım doldurulur)
- [x] 1 Gerçek saate göre gök (5 an)
- [x] 2 Paralaks + atmosferik solma
- [x] 3 Alan amblemleri `PIKSEL_DOGA.amblem(alan)`
- [x] 4 Anlar (kabuk/an.js)
- [x] 5 Ölçüm
- [ ] Testler, görseller

## Sayfalar ajanına istek
(doldurulacak)

## İlerleme notları
- Adım 1–3 kodu yazıldı (piksel-doga.js): `vaktinIsigi(saat)` (SEYIR durakları gece·alaca·şafak·sabah·öğle·ikindi·akşam·alaca·gece, smoothstep), `gunTon` ışık tonu + gölge rengi, kenar ışığı boyu, güneş alçaklığı; tampon katmanı (`kat(b, n)`), `katmanYap`, `kare` paralaks, kaydırma izleyici; `AMBLEM` + `amblem(alan)`. Doğrulama sürüyor.
- Görsel denetim (scratchpad pano, 14 × 5 an): anlar belirgin ayrı; ilk çizimde şafak ile gün batımı benzerdi → akşam paleti turuncu-kor, şafak ışığı lila-pembe yapıldı.
- Testler: `node tools/ortak_test.js piksel` 54/56 geçti (2 eski modül vakası atlandı); yeni: beş an + eski adlar + gerçek saat, 14 sahne × 12 saat boşluksuz/≤72 renk/üst-sol ≤8, anlar arası fark + 10 dk'da sıçramama (20:00 ve 06:00 sınırı dahil), paralaks 3 katman/boşluksuz/ön plan yerinde/hareket-az'da kaymaz, amblemler.

## Kapanış (2026-11-17, devralan oturum)
Ajan hesap sınırında kesildi, raporu doldurulmadı; kod tamdı: gerçek saate göre gök (`PIKSEL_DOGA.an`, `AN_SAAT`, `saatAl`), kaydırınca paralaks,
alan amblemleri (`PIKSEL_DOGA.amblem`, başlığın yanında), anlar (`kabuk/an.js`: ders, kapı, günün ilk kaydı; hareket azsa yok).
Devralan oturum: `an.js` açılış yükünde değil, sayfa yüklenince ilk boşlukta gelir (kabuk.js; açılış bütçesi LF ile 1 008 142 → 998 463 bayt, tavan 1 000 000),
`an.test.js` CI'da «Anlar» adımı. Kapılar: ortak_test 280/0, kabuk_gez ve hareket_gez hepsi geçti, kabuk/bilesen testleri yeşil. Ölçüm aşağıda (2026-11-18).

## Ölçüm: geçiş kareleri (2026-11-18, devralan oturum)
Yalıtılmış sunucu, 1440×900, CPU 4× yavaş, yedi yer arasında 21 geçiş (her yer önce bir kez ısıtıldı), rAF aralıkları; iki koşu.
Tur öncesi b88e0826 ile tur sonrası c6e3ef3d aynı betikle (scratchpad `hiz/gecis_olc.js`):

| | önce (b88e0826) | sonra (c6e3ef3d) |
|---|---|---|
| en uzun kare | 80 · 68 ms | 68 · 75 ms |
| ortanca en uzun kare | 51 · 51 ms | 51 · 52 ms |
| 50 ms'yi aşan kare (21 geçişte) | 15 · 15 | 16 · 20 |
| en çok bir uzun kareli geçiş | 21/21 · 21/21 | 20/21 · 19/21 |

Ölçüt (yon.md: en uzun kare kötüleşmez) tutuyor. 50 ms'yi aşan kare sayısı biraz arttı; fark en çok Öğren ve Bugün'e geçişte (60-70 ms'lik ikinci kare).
Açık: bu ikinci karenin kaynağı (serif yazı tipinin ilk çizimi, alan tonlu zemin geçişi ya da gök) ayrıca ölçülmedi.
