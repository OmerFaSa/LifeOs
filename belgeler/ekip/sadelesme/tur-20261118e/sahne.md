# Tur 2026-11-18e · Sahne zanaatı + Türk öğeleri (piksel kapaklar)

Sahibin sözü (18 Kasım): «arka plandaki pixel artı, sistemin genel pixel artını çok daha fazla geliştirmeni istiyorum».
Ek yön (aynı gün): sahnelerde Türklük çok daha belirgin işlensin.
Dokunulan: `brand/ortak/piksel-doga.js`, `brand/ortak/piksel.test.js` (yalnız renk sınırı). Commit yok; koordinatör inceleyip commit'leyecek.

## Durum: BİTTİ
- [x] HEAD panoları (önce) çizildi
- [x] Gök, bulut, hale
- [x] Derinlik: arka sırt, vadi pusu, zemin dokusu
- [x] Odak yapılar (otağ, medrese, kale, kervansaray, şifahane, çeşme)
- [x] İç mekânlar (huzme, toz, kilim, raf, levha, kandil)
- [x] Figürler (atlı, deve + kervancı, ozan)
- [x] Türk öğeleri (ayrı bölüm aşağıda)
- [x] Testler: `node tools/ortak_test.js` 281 geçti / 0 kaldı; `node tools/kabuk_gez.js` «hepsi geçti»; `python kalite/olcum.py --denetle` «aşım yok»

## Ortak (bütün açık hava sahneleri)
- **Gök**: Bayer titreşim şeridi kalktı; düz bantlar. Başlığın altından (y ≥ 0.36H) ufka dek iki durak arasına bir ara ton girer (geçiş yumuşar); üstte iki durak tam ortada keskin değişir (üst-sol ≤ 8 renk kalsın diye). İç sahnelerin pencere göğü de bantlı.
- **Güneş halesi**: dağınık nokta halkaları (kumlu) yerine iki dolu halka; gece ay yalnız iç halkayı alır. **Ufuk halesi** dolu kuşak.
- **Kümülüs**: bir boy daha kabarık (h = w/5, 3–8); her tümseğin sağ üste bakan kubbesi aydınlık, sol alt hilali ara ton, taban gölge.
- **Atmosfer perspektifi**: `sirt({ ard:1 })` arkada ufka karışmış, daha yüksek, soluk bir sırt çizer (8 sahne: otuken, ufuk, kale, kervansaray, ates, pinar, cadir, sifahane); uzak sırtın eteğinde dalgalı **vadi pusu** (yalnız `ard`/`vadi` sırtlarda; yakın çayır yıkanmaz).
- **Zemin dokusu**: yeni renk açmadan alttaki (koyu) bandın rengiyle kısa çizgiler, üstünde bir satır açık bandın rengi (ışık alan öbek); ufukta seyrek/kısa, önde sık/uzun; başlığın altında yarı yoğun; en öndeki band tek bir koyu ton alır. Kışın kapalı (kar düz kalır, eski rüzgâr çizgileri sürer).
- **Hız**: sırt sütunları artık `sutun()` ile doğrudan yazılır (R'nin satır başına iki `fill` çağrısı tek piksellik sütunda pahalıydı) ve `ard`/pus sütunu öndeki sırtın altında biter. Piksel çıktısı aynı (ciz2 çıktısı birebir), süre HEAD'den de kısa.

## Sahne sahne
- **Ötüken**: otağ: saçak gölgesi, etekte koyuluk, güneş yanında ışık kenarı, sola düşen yer gölgesi, iki kanatlı kapı + tokmak, çatı kaburgası; + Türk öğeleri.
- **Ufuk**: arka sırt, zemin dokusu, al bayrak.
- **Kale**: burç: ışık/gölge yüzünde ayrı tonlu taş sıraları, şaşırtmalı derz, dendan altı konsollar, ışık kenarı, eteğinde şev; sur: kesme taş sıraları, kayaya oturduğu koyu satır; kayanın eteğindeki yeşil yamaçta öbek dokusu; büyük al bayrak.
- **Medrese**: kanatlar: tuğla örgü, saçak gölgesi, her kemer kendi çerçevesinde, kemer içinde sağdan gölge; pîştak: köşeliklerde firuze-lacivert çini örgüsü, beyaz yazılı lacivert kitabe kuşağı, kemer başında **mukarnas** (yeni ortak `mukarnas()`), ahşap iki kanatlı kapı + pirinç tokmak, binanın yere oturduğu çizgi; minare: şerefe + altında gölge, çini kuşaklarında dama, ışık kenarı, alem; avlu: öne doğru büyüyen şaşırtmalı döşeme derzi; kubbe kasnağında iki Selçuklu yıldızı.
- **Kervansaray**: taç kapıda mukarnas (eski nokta taraması yerine), ahşap kanatlar + demir çiviler, çini kitabe, kapının iki yanında sekiz köşeli yıldız; develerin hörgücünde kırmızı çul ve yük, kervanın önünde yürüyen kervancı (`POZ.yaya`).
- **Ateş**: ozan kaftanında kıvrım tonu (`P_SABIT.C`), kırmızı kuşak, bıyık, çizme; ufukta atlı (börklü), gündüz süzülen doğan.
- **Yaylak**: dağın eteğinde vadi pusu; yayla evlerinin yanında keçe otağ.
- **Pınar**: çeşme: kesme taş sıraları, niş çerçevesi, nişte mukarnas, ayna taşı.
- **Çadır**: kara çadıra kırmızı-lacivert dokuma kuşak (altın düğümlü).
- **Şifahane**: taç kapıda mukarnas ve çini kitabe, iki yanda sekiz köşeli yıldız; havuz: kenar gölgesi ve göğü yansıtan dalga çizgileri.
- **Kitaplık**: pencereden dolu huzme (`huzme()`: havada bir ton, yerde ikinci ton; eskiden dama titreşimi) + durağan toz zerreleri; yer kilimi (`kilim()`, günün dokuması, baklava dizisi, saçak); raf gözlerinin tepesinde gölge, korniş, dolabın duvara düşen gölgesi, kitap sırtlarında yaldız şerit; pencereyle raf arasında küçük hat levhası. Tavan gölgesi dama yerine ara ton bandı (bütün iç sahneler).
- **Hattat**: dolu huzme + toz; asma kandil (gece hale).
- **Yazı**: huzme masaya iner; tahta döşeme derzi; yer kilimi; asma kandil.
- **Taht**: tündük huzmesi dama yerine dolu iki ton; perdede günün dokumasından baklava (günden güne çeşitlilik sancaklardan buraya taşındı); al sancak + gök sancak; halıda koç boynuzu.

## Türk öğeleri
Hepsi mevcut piksel dilinde, sınırlı paletten (al `#c8302c/#b8352f`, gök `#2c5585/#2c6aa8`, altın `#d8b456/#c69a48`, firuze `#3ea0a8`, lacivert `#1e3a62`):
- **Ötüken**: tuğun yanında **Göktürk sancağı** (`gokSancak`: direk tepesinde altın kurt başı, altında gök mavisi alem, altın üst kenar); otağın solunda **Orhun tarzı dikili taş** (`dikiliTas`: yuvarlak tepe, ışık/gölge yüzü, iki sütun çentik — Göktürk harfi izlenimi, gerçek yazı iddiası yok) ve önünde üç **balbal**. Tuğ zaten vardı.
- **Kale**: burçtaki bayrak büyüdü (masaüstü 10×6, telefon 7×5) ve **ay yıldızlı al bayrak** oldu (beş piksellik hilal, açığı uca bakar, yanında yıldız; dalgayla birlikte kayar; `bayrak` hareketinde `ay`).
- **Ufuk**: yolun sağında direkte dalgalanan **al bayrak**.
- **Medrese / Kervansaray / Şifahane**: **Selçuklu sekiz köşeli yıldızı** (`yildiz8`: 5×5 kare + baklava, göbeği ayrı renk) — medresede kasnakta, kervansaray ve şifahanede taç kapının iki yanında; **çini kitabe şeridi** (`kitabe`: lacivert zemin, firuze kenar, beyaz yazı izlenimi) taç kapıların üstünde; medresede köşelik çinisi.
- **Taht**: iki tuğ (vardı) + solda **al sancak** (ay yıldız), sağda **gök sancak** (altın kurt başı); kırmızı halı yolunda **koç boynuzu** motifi.
- **Yaylak / Çadır / Ateş**: yaylada keçe otağ (günün keçe kuşağıyla), kara çadırda kırmızı-lacivert dokuma kuşak, Ateş'te ufukta **atlı Türk** (börk kırmızı; atlı sprite'ı bir boy büyüdü, her sahnede) ve doğan; Yaylak'ta kartal zaten vardı.
- **Hattat / Yazı / Kitaplık**: rahle ve hat levhası (Hattat, vardı) + asma kandil; Kitaplık'ta küçük hat levhası ve Türk kilimi; Yazı'da kilim ve asma kandil.

## Ölçümler
- **Bayt**: 107 497 → 124 197 (+16 700 B ≈ +16.3 KB; izin verilen ≲ +21 KB içinde). `kalite/olcum.py --denetle`: «Bütçe tamam: 28 bütçe, aşım yok».
- **Renk (480×100, bugün = Kasım/sonbahar, 6.3 · 12.5 · 19.6 · 22)**: en çok 86 (otuken 22:00; önce en çok 68, yazi 22:00); üst-sol en çok 7 (önce 7). 480×127 otuken gece 93.
  **Test sınırı 72 → 96** (`piksel.test.js` üç yerde): ara ton bantları, mukarnas/çini/taş sırası tonları, bayrak/sancak renkleri bilinçli eklendi; renkler hâlâ elle seçilmiş sınırlı palet (gürültü olsa yüzlerce çıkardı). Üst-sol ≤ 8 sınırı değişmedi; mevsim/hava testi (`günün hâli`) 96 ile geçiyor.
- **binaCiz (Node, 480×127, sahne başına 4 saatin en kötüsü, 7 denemenin en kısası, art arda koşu)**: HEAD en kötü 5.67 ms (kervansaray) → yeni en kötü 3.98 ms (kale); iç sahneler ≤ 2.4 ms. Ölçüm betiği: scratchpad `sahne2/sure.js`.

## Panolar (sahne-gorsel/, toplam ~260 KB, 255 renk optimize PNG)
Her satır bir sahne, sol HEAD, sağ yeni; masaüstü 480×100 2×, telefon 195×72 3×:
- `dis-1-125.png`, `dis-1-22.png` — otuken, ufuk, kale, medrese
- `dis-2-125.png`, `dis-2-22.png` — kervansaray, ates, yaylak, pinar
- `dis-3-125.png`, `dis-3-22.png` — cadir, sifahane
- `ic-125.png`, `ic-22.png` — kitaplik, hattat, yazi, taht
- `telefon-125.png`, `telefon-22.png` — otuken, kale, medrese, kervansaray, kitaplik, taht, ates

## Açık kalanlar
- Gece ışık havuzları (`isik`) hâlâ Bayer kenarlı (eski tasarım; dokunulmadı). Dolu iki tona çevrilebilir.
- Medrese köşelik çinisi 480×100'de ince; daha iri bir girih denenebilir.
- Hakan figürü ve otlayan atlar dokunulmadı (yele/ışık tonu eklenebilir).
- Gerçek kabukta (`cek.js`) tam sayfa görüntü alınmadı; değerlendirme Node panolarından (kabuk_gez kapakları gerçek tarayıcıda çizip geçti).
