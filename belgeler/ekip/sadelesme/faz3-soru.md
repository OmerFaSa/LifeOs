# Faz 3 · Soru motoru (plan A6)

`motor/soru.js` + `motor/soru.test.js`. Akademik alanın soru, alıştırma, deneme ve puanlama motoru.

## Özet
AYS'de dağınık duran soru, alıştırma, süreli deneme, net, sıra tahmini ve deneme analizi kuralları tek saf motora (`LIFEOS.Motor.Soru`, Node'da `module.exports`) toplandı. Saat (`simdi`, ms) ve rastgelelik (`rnd`) hep dışarıdan gelir, yoksa TypeError; girdi kaydı değiştirilmez. Dışarı verilen her sayı `{ deger, etiket }` ya da etiketli bir nesnenin içindedir (ölçüldü / hesaplandı / tahmin / veri yok); sıra ve puan tahmini her zaman `tahmin`. Formül ve sabitler AYS'den birebir taşındı; test, sabitleri eski dosyadan okuyup karşılaştırır ve eski motorları rastgele girdilerle yan yana koşturur (bkz. Testler). AYS'nin hiçbir dosyası değiştirilmedi.

Birleşenler:
| Burada | AYS kaynağı |
|---|---|
| net, medyan gidişi, taban, test medyanı, hata paretosu, OBP, ham puan, sıra tahmini, hedef farkı | `AYS/src/js/core/calc.js`, `core/state.js` |
| süreli deneme oturumu (işaret, duraklatma, test geçişi, özet, bitiş) | `core/examrun.js` |
| karma test, sınav provası, Yanlışlarım | `core/ogrentest.js` |
| cevap anahtarı ayrıştırma ve soru soru karşılaştırma | `core/denemeanaliz.js` |
| iki deneme farkı | `core/analytics.js:83-121` |
| gidiş izdüşümü (Theil–Sen) | `core/gelecek.js:49-174` |

Envanterdeki «4 alıştırma yolu» tek oturum biçiminde toplandı: `oturumKur` (sırası verilmiş set: ders alıştırması, kapı soruları, yeniden çözüm), `alistirmaKur` (karma test), `provaKur` (süreli prova), `yanlislarim` (yeniden çözüm listesi). Hepsi `cevapla` / `bak` / `oturumBitir` / `sonucOzeti` ile biter. «4 deneme analizi yeri» tek `denemeAnalizi` (özet, netler, anahtar farkı, konu ve hata türü) ile `denemeFarki`'na indi.

## Soru modeli
`{ id, tur:'secmeli'|'acik', soru, sec?, dogru, olcut?, cozum?, ipucu?, seviye?, konu?, ders?, durum? }` — `alan/SEMA.md` «Alıştırma» biçimiyle aynı.
- **Seçmeli**: 2–5 seçenek, anahtar A–E içinden. **Doğru/yanlış** ayrı tür değil, iki seçenekli seçmelidir (`['Doğru','Yanlış']`); AYS içeriği de böyle.
- **Açık uçlu** puanlanmaz (SEMA): `kontrol` `dogru:null` ve öz değerlendirme ölçütlerini döndürür; ölçütsüz açık uçlu soru reddedilir.
- **Eşleştirme** türü yok: AYS kaynaklarında eşleştirme şeması bulunmadı (geçen yerler soru metni), uydurulmadı. `soruDenetle` bilinmeyen türü nedeniyle reddeder.
- AYS içerik sorusu (`KONU_ANLATIM`, `KONU_DERIN`, `PARAGRAF_HAVUZU`) `GOC.aysSoru` ile bu biçime girer ve onay alanı olmadığı için **taslak** olur.
- `cevapla`: ilk cevap kilitlenir; çözüme bakılan (`bak`) soru doğru sayılmaz; cevapsız soru boş (yanlış değil). Doğruluk her okumada bugünkü anahtarla hesaplanır (ogrentest.js söz 5).

## Net ve sıra (formül kaynakları)
| Kural | Kaynak |
|---|---|
| net = doğru − yanlış/4, testler toplanır, negatif olabilir | `core/state.js:530-533` |
| boş: yazıldıysa ölçüldü, yoksa soru − D − Y (hesaplandı), tutmazsa veri yok (sıfır uydurulmaz) | `core/state.js:505-520` |
| yalnız tam deneme, aile ayrı, tarihe göre | `core/calc.js:105-109` |
| son 3 / önceki 3 medyanı ve farkı | `core/calc.js:113-124` |
| taban: son 4'ün en düşüğü; test medyanı son 4 | `core/calc.js:125-139` |
| hata dağılımı ve paretosu (K, İ, Y, S, D) | `core/calc.js:162-176`, türler `data/reference.js:119-125` |
| OBP: diploma × 5, 250–500 kırp, katsayı 0,12 / yerleşmişse 0,06 | `data/reference.js:43` |
| ham puan: 100 + net × 3,33 (TYT); SAY = 0,4·TYT payı + 0,6·(100 + AYT net × 5), 100–500 | `core/calc.js:834-841`, sabitler `data/scoring.js:16-89` |
| sıra: tablo noktaları arasında log-lineer aradeğer, uçlarda kırpılır | `core/calc.js:844-858`, tablo `data/scoring.js` `sayRankTable` |
| puan tahmini: en az 3 tam TYT, son 3 medyanı, bant yarı genişliği 18/12/8 (deneme <5/<8/≥8), konum | `core/calc.js:862-916`, `data/scoring.js:93-104` |
| hedef sıra 84285, gereken puan ve net farkı | `data/curriculum.js:13`, `core/calc.js:919-950` |
| gidiş: Theil–Sen eğim + çeyrekler, MAD sapma, en az 4 deneme / 14 gün, ufuk ≤ 3× yayılım | `core/gelecek.js:49-131` |

Eşlik: eski testlerin beklenen değerleri (`calc.test` examNet, medianTrend, examBase, testMedian, errorPareto, obp; `engine.test` sıra ve puan tahmini; `denemeanaliz.test`, `prova.test`, `gelecek.test`, `features.test`) motor testinde yeniden üretiliyor. Ayrıca eski kodla yan yana fark testleri: 150–600 arası her puanda sıra ve ham puan; 300 rastgele deneme geçmişinde puan tahmini, bant, konum ve hedef farkı; 3000 rastgele anahtar/cevap metninde ayrıştırma; 200 rastgele seride gidiş; boş kuralı ve net — hepsi birebir.

Tek bilinen sapma: `hataDagilimi` gün sınırı ISO zamanın ilk 10 harfi (UTC); AYS yerel günü alıyordu. Gece yarısına yakın kayıtta bir gün kayabilir (kodda `shortcut:` notu).

## Deneme ve süre
`denemeBaslat` (AYS `EXAM_TEMPLATES` şablonu `GOC.aysSablon` ile), `isaretle` (Yaptım / Zorlandım / Atladım; test, soru no, o soruya saniye), `isaretGeriAl`, `sonrakiTest`, `testeGit`, `duraklat` / `surdur`, `gecenSn`, `testSn`, `kalanSure`, `denemeOzeti` (test test süre ve plan sapması, en yavaş 5 soru, medyan, ilk 20 dk ısınma: 15 puanlık fark), `denemeBitir` (deneme kaydı + oturum kaydı; dakika ölçülür, boş yazılmadıysa sorudan türetilir). Kaynak `core/examrun.js`; test aynı sahte saatle eski `examrun.js`'i yan yana koşturup her adımda geçen / test / kalan saniyeyi ve özeti karşılaştırır.

**Sahibin 2026-11-01 kararı** (`tools/ays_sinav_sure_kabul_test.py`, bellek notu): süre duvar saatinden; deneme sürerken sekme kapalı geçen süre toplam, test ve kalan süreye sayılır; yalnız elle duraklatma durdurur. Motor bunu yapısıyla sağlar (oturum `bas` + `durakMs`, sekme kapanışı motoru ilgilendirmez); testte 10 dakikalık kapalı sekme ve eski motorun `flush/restore` döngüsü ile doğrulandı. Prova da aynı kuralla: `bitis = basladi + süre`, süre dolunca cevap alınmaz.

Prova planı: kota ders soru oranıyla (en büyük kalan), süre ÖSYM ölçeğiyle (TYT 165 dk/120, AYT 180 dk/80); sınav tarzı (temel olmayan) soru yeterse o seçilir. TYT 20 → 7/3/7/3, 28 dk; AYT 20 → 10/4/3/3, 45 dk (`core/ogrentest.js:62-76, 208-243`).

## Analiz
`denemeAnalizi(deneme, hatalar)`: test test net, D/Y/B, boş ve dakika etiketiyle; anahtar ve cevap varsa soru soru karşılaştırma. Kayıt kendiliğinden değişmez: anahtardan çıkan D/Y/B kayıttakinden farklıysa yalnız `fark` söylenir (denemeanaliz.js söz 2). Konu ve hata türü yalnız o denemeye bağlı hata kayıtlarından (ders::konu gruplanır, en çok önce), hata paretosu reçeteleriyle. `ayristir` anahtar ya da cevap metnini yan yana veya numaralı («1-A 2-C») okur; belirsiz girdi tahmin edilmez, nedeni söylenir. `karsilastir`: iptal (`*`) D/Y/B'ye girmez. `denemeFarki`: iki deneme test test net, boş, isabet, dakika farkı ve en çok oynayan test.

## Yol ve Tekrar bağları
- **Yol**: `yolGirdisi(sonuc)` → `Yol.kapiDene`'nin beklediği `{ soruId: harf }`. Çözüme bakılan ve boş soru yazılmaz, Yol'da yanlış sayılır. Eşik ve geçiş kararı Yol'undur; Soru motoru karar vermez. Testte `motor/yol.js` ile uçtan uca denendi.
- **Tekrar**: `tekrarOnerileri(sonuc, sozluk)` yanlış ya da çözüme bakılmış seçmeli sorudan `Tekrar.yeniKart(id, ek)` önerisi üretir (`id:'soru:<id>'`, ön yüz soru, arka yüz doğru şık). Yalnız `durum:'onayli'` içerik; taslak soru `disarida` listesine nedeniyle düşer, asla karta girmez. Testte öneri `motor/tekrar.js` planına sokuldu.
- Göç: `GOC.aysDeneme`, `aysHata`, `aysSablon`, `aysSoru` AYS kayıtlarını bu biçime çevirir; etiketsiz eski boş «eski kayıt» olur (AGENTS §0.1).

## Testler
`node motor/soru.test.js` → **32/32 geçti**, çıkış 0. Bölümler: sabitlerin eski kaynakla birebirliği (3), eski testlerin beklenen değerleri ve sahibin süre kararı (13), eski kodla rastgele girdili fark testleri (6), motorun kendi sözleri (10: soru modeli, karma test, alıştırma, prova, Yanlışlarım, analiz, etiketsiz sayı yok, Yol bağı, Tekrar bağı, saflık).

Kesilen ilk koşuda kırmızı kalan iki test (30/32) ve kararı:
1. **karma test «aynı konu ard arda gelmez»** — test yanlıştı. AYS `ogrentest.js:174-185` açgözlü serpiştirir ve başka konu kalmayınca sonda tekrarı kabul eder («mümkünse»); motor birebir taşıdı. Test bu kurala çekildi: ard arda aynı konu yalnız sonda, geriye başka konu kalmadığında olabilir; beş tohumla denenir.
2. **etiketsiz sayı çıkmaz** — motor yanlıştı. `denemeOzeti.testler[].q` (soru sayısı) ve `enYavas[]` işaretleri çıplak sayı taşıyordu; söz 2'ye aykırı. İkisi de `ölçüldü` etiketi aldı (`q:{deger,etiket}`, her işarete `etiket`). examrun eşlik testi değişmeden geçiyor.

## Açık konular
- **AYS'de kalanlar** (Akademik alan taşınana kadar): ekranlar ve kayıt katmanı (`state.js` IndexedDB, `examrun.js` taslak sakla/geri yükle, `ogrentest.js` havuz kurma ve kapsam seçimi), içerik bankaları (`data/anlatim-*`, `derin-*`, `paragraf.js`), fotoğrafla deneme okuma (`denemefoto.js`), sesli asistan ve ofis. Motor bunların yalnız kurallarını aldı; havuzu ve kalıcılığı alan katmanı verecek.
- AYS içerik soruları onay alanı taşımadığı için hepsi taslak; Tekrar'a kart önerisi ancak sahip içeriği onaylayınca açılır.
- Sıra tablosu (`sayRankTable`) ve OBP katsayıları AYS'deki referans değerleri; yeni yıl ÖSYM verisiyle güncellenmesi sahibin işi (tahmin etiketi bu yüzden).
- `hataDagilimi` UTC gün sınırı (yukarıda); yerel gün gerekirse `tarih.js` ile düzeltilmeli.
- Eşleştirme türü ileride içerik isterse SEMA'ya önce şema olarak girmeli.
- Ekrana bağlanmadı; tarayıcıda denenmedi (yalnız Node testi).
