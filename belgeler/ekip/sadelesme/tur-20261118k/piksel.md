# piksel.md · tur 2026-11-18k

Görev: taht (Başbuğ figürü), king amblemi (taç → tuğ), yaylak (Sağlık) profesyonelleşme, medrese (Öğren) ışık huzmeleri + toz.
Dosyalar: brand/ortak/piksel-doga.js, brand/ortak/piksel-simge.js, brand/ortak/piksel*.test.js

## Durum: BİTTİ (commit yok)
- 19 Kasım: limit sonrası devam. Dosyalarım el değmemişti (git diff boş). ÖNCE görüntüleri ve süreleri alındı.
- ÖNCE süre (Chromium, 4× yavaş CPU, 430×100, 4 saatin en kötüsü, 5 koşu ortancası): taht 7.2 ms, yaylak 17.4 ms, medrese 10.6 ms.
- Görüntü/ölçüm betiği: scratchpad `pk/cek.js` + `pk/sahne.html` (piksel-doga.js'i dosyadan yükler, binaCiz + kare çizer, 3×/2× büyütür).
- [x] Taht: HAKAN yeniden çizildi (13×19 aynı ölçü): altın sorguçlu ak börk + samur kenar, buğday ten yüz (göz, sarkık bıyık), lacivert kaftan, al iç entari, altın yaka/düğme/kuşak, eller dizde, çizme; gölge solda, sağ konturda ışık. Gece yüz/el/altın '!' sıcak tonlarla (mangal ateşi). Eller arasından geçen eski altın çubuk kaldırıldı. Yeni palet HAKAN_P.
- [x] Amblem: piksel-doga AMBLEM.king taç → Türk tuğu (altın ay alem, kırmızı bağ, beyaz at kuyruğu, direk). piksel-simge: yeni `tug` (12×12), `king` ve `king e sor` → tug; `rutbe` taçta kaldı.
- [x] Medrese: yeni sakin `huzme` (HAREKET; satır başına fillRect, 'screen' karışımı, gündüz 9 sn'de 12 adımla nefes, gece kandil titremesi). Gündüz güneşten avluya 6 huzme + eyvanda mukarnastan kapıya inen huzme, iki `toz` sakini; gece eyvanda asma kandil (statik) + konisi, yanan alt hücrelerden avluya ışık, sıcak toz. Huzmeler binaCiz'e girmez (renk sınırı etkilenmez).
- [x] Yaylak (Sağlık): dağın eteğinde çam kuşağı (öbek öbek, sağdan ışık, kışın karlı), orta planda çayır dokusu (yeni renk açmadan), önde büyük keçe otağ (oba; ocak dumanı sakini), otlayan iki at (sakin `at`, orta katman), 9 yakın koyun (yeni KOYUN spritı) + değnekli çoban, dağdan kıvrılarak inen dere (sol kıyı gölge, sağ kıyı ışık, köpük; kışın donuk), önde saplı lale ve sarı çiçekler. Bir hata da düzeldi: `kat(b, 1)` yorumun içinde kalmıştı (orta plan uzak katmanla kayıyordu), çağrı yorumdan çıktı.

## Doğrulama
- `node tools/ortak_test.js piksel`: 55 geçti, 0 kaldı (2 eski modül vakası her zamanki gibi atlandı). Test dosyasına dokunulmadı: sınırlar (96 renk, üst-sol ≤ 8) olduğu gibi geçiyor.
- `node tools/kabuk_gez.js`: «hepsi geçti».
- Renk (480×100; 5 tarih × 6 saat en kötüsü): taht 38 → 49, yaylak 57 → 89, medrese 84 → 88 (sınır 96); üst-sol değişmedi (5 / 7 / 6). Yaylak sınıra yakın: oraya yeni öğe eklenecekse renk payı ~7.
- Çizim süresi (binaCiz, Chromium 4× yavaş CPU, 430×100, 4 saatin en kötüsü, 5 koşu ortancası; aynı koşuda önce/sonra): taht 9.8 → 10.2 ms, yaylak 19.8 → 23.5 ms, medrese 11.3 → 11.9 ms. 300 ms bütçesinin çok altında. Huzmeler binaCiz'e değil kareye girer: yalnız imza değişince (gündüz ~0.75 sn'de bir, gece 4/sn), satır başına bir fillRect (~300 dikdörtgen).

## Görüntüler (`piksel-gorsel/`, 255 renk PNG, ~750 KB)
- Gerçek kabuk (Playwright, saat sabit 12:30 / 22:30, 19 Kasım; açık tema gündüz, koyu tema gece): `once-|sonra-` × `king|saglik|ogren` × `masaustu (1280)|telefon (390)` × `gunduz|gece`.
- Yalnız sahne panoları (önce/sonra, taht/yaylak/medrese, 12.5 ve 22): `sahne-once-masaustu.png` (420×100 3×), `sahne-sonra-masaustu.png`, `sahne-once-telefon.png` (207×72 2×), `sahne-sonra-telefon.png`.
- Betikler scratchpad'de (repo dışı): `pk/cek.js` (pano + süre), `pk/yakin.js` (6× yakın plan), `pk/kabuk.js` (gerçek kabuk; «once» için piksel-doga.js'i yönlendirmeyle eski sürüme çevirir), `pk/renk.js` (renk sayımı).

## Açık kalanlar
- `kabuk/index.html` SVG sprite'taki `#i-king` ve `kabuk/harita.js` `ikon:'tac'` başkalarının dosyası; çizgi simge kapakta amblemle değişiyor ama üst çubuktaki gezinti simgesi sprite'tan gelir (zaten tuğa benzer bir çizim görünüyor; taç ise sahibi o dosyanın sahibine iletmeli).
- Telefonda (390) medrese güneş huzmeleri dar sahnede kısmen görünüyor; asıl etki eyvan huzmesi ve tozda.
- Gece medresede yanan hücrelerin avluya düşen ışığı ince bir yamuk; daha yumuşak (iki tonlu) yapılabilir.
