# Tur 2026-11-18 · Kapak birleşmesi, Bugün, Öğren ve alan sayfası

Sahibin isteği: «görsel kaliteyi arttırır mısın». Paket: (1) kapaktan sayfaya geçiş, (2) Bugün, (3) Öğren ve alan sayfası. Yön: tur-20261117e/yon.md.

## Durum
- [x] Önce görüntüleri (HEAD dda7fd31: 4 sayfa × gündüz 14:10/gece 22:10 × açık/koyu × 1440/390; saat sayfaya Date taklidiyle sabitlendi)
- [x] Kapak kenarı denendi (CSS enjeksiyonuyla: örtüsüz ham sahne, sonra kenar seçenekleri), uygulandı
- [x] Bugün, Öğren, alan sayfası
- [x] İkinci tur görüntü ve düzeltmeler
- [x] Kalite kapısı ve geçiş karesi ölçümü

## Ne değişti
**1 · Kapaktan sayfaya geçiş** (kabuk.css). Eski 96 px'lik koyu→krem solma ve örtünün dibe doğru %70'e koyulaşması kalktı: o ikisi sahnenin toprağını kahverengi-mor bir bulanık banda çeviriyordu. Örtüsüz ham sahne denendiğinde sahnelerin kendi toprağıyla zaten temiz bittiği görüldü. Şimdi:
- sahne sabit bir ufukta biter: kenarda ortası parlak, uçları sönen 1 px ışık çizgisi, altında kısa yumuşak gölge (`:is(.kapak, .b-karsilama__sahne)` ve `::before`);
- örtüler (`--kapak-ortu`, `--sahne-ortu` jetonları) yalnız üst çubuğun ve yazının arkasını koyultur, dipte hafif kalır;
- sayfanın zemini alanın tonunu taşımayı sürdürür (`#sayfa::before`), kenarın hemen altından başlar.
Gündüz/gece, açık/koyu, 1440/390 hepsinde aynı kural. Piksel çizimlerine dokunulmadı.

**2 · Bugün.** Sahne geniş ekranda 300 → 380 px, yazı biraz aşağıda (88 px). Tarih küçük, aralıklı büyük harf, günün yayı 52×17 px ve tarihle aynı hizada. Özet cümlesi biraz büyük. Bölüm başlıkları («Bekleyenler», «İlerleme») 1.3 rem serif (eskiden 17d'nin küçük etiket kuralı 17e'nin serif kuralını eziyordu, ortaya küçük serif bir etiket çıkıyordu). Bölümler arası 56 px.
İlerleme: çalışılan alan (yüzdesi olan tek kart) tam genişlik, alanın tonunda, gölgeli; 52 px simge, serif ad, «Sıradaki: …» tam metin, 320 px ince ilerleme çizgisi, sağda yüzde. Öbür alanlar sakin küçük kutular (gölgesiz, yarı saydam yüzey, üzerine gelince kalkar): geniş ekranda üç sütun, telefonda iki sütun, simge üstte.
kabuk.js `alanKartlari`: çalışılan alanın yüzdesi %0'da da verilir (eskiden ilk ders okunana dek boştu, çizgi görünmüyordu).

**3 · Öğren ve alan sayfası.** «Sıradaki» kartı çalışılan alanın tonunda (kabuk.js `siraKarti` Öğren'de `data-ton` koyar), üst satır alanın renginde, başlık 1.5–1.875 rem serif, geniş ekranda düğme sağda ortalı (48 px yuvarlak). Kapaklı sayfalarda başlıktan sonraki ilk blok sahnenin kenarından 24 px aşağıda (`kapakPay`, eskiden 8 px; kenara yapışıyordu). Alan sayfasında bölüm sekmeleri 36 px, 15 px yazı, seçili olan alanın renginde; aşama özeti alanın tonunda sakin bir pano; şimdiki ders kartı ve listedeki «sıradaki» dersin işareti vurgu rengi yerine alanın tonunda.

**Temizlik** (aynı seçiciyi ezen eski katmanlar): `.kapak__simge` için 5 ölü kural (simge artık yalnız h1 içinde, `:root h1 > .kapak__simge` hepsini eziyordu), kapak boyunun dört ayrı yerde tanımı tek yere indi (temel 144, geniş ekran 300), 2026-11-15 cila ve 2026-11-16 «büyük adım» bloklarındaki kenar solması ve örtü geçersiz kılmaları, 17e'deki `--zemin-isik` ve erime kuralı, `.sira` gölgesinin iki tanımı, `.b-karsilama__alan` min-height ve `.b-karsilama__cizgi` için ikinci tanımlar (17d kuralıyla birleşti).

## Önce/sonra
`kapak-bugun-gorsel/bugun.png`, `ogren.png`, `tarih.png`, `akademik.png`: solda önce (HEAD dda7fd31), sağda sonra; üst iki satır 1440 (açık tema gece 22:10, koyu tema gündüz 14:10), alt satır 390 (açık gündüz önce/sonra, koyu gece önce/sonra). Saat sayfaya `Date` taklidiyle sabitlendi; yalıtılmış sunucu, boş hesap.
Tam takım (4 sayfa × gündüz/gece × açık/koyu × 1440/390, önce ve sonra) iş sırasında scratchpad'de üretildi; iki tur bakılıp düzeltildi (ilk turda serif yazıda «%0» binde işaretine benziyordu → sans; telefonda öne çıkan kartın simgesi küçüldü; Öğren'de düğme kartın üstüne yapışıktı → ortalandı).

## Bayt farkı (LF)
- kabuk/kabuk.css: 98 986 → 99 565 (+579; eklenen ~2.2 KB, silinen ~1.65 KB)
- kabuk/kabuk.js: +136 (üç satır; aynı dosyada başka ajanın değişiklikleri bu sayıya dahil değil)
- Net: +715 bayt (bütçe +3 KB).

## Testler
- `node kabuk/kabuk.test.js` geçti; `node kabuk/bilesen.test.js` 24/0 (ilk koşuda başka ajanın bilesen.css'teki ara hâlinden bir kırmızı vardı, yeniden koşunca yeşil); `node tools/ortak_test.js` geçti; `node tools/kabuk_gez.js` hepsi geçti; `node tools/hareket_gez.js` hepsi geçti. Test ve seçici değişmedi.
- Geçiş kareleri (scratchpad `hiz/gecis_olc.js`, 1440×900, CPU 4× yavaş, 21 geçiş; HEAD kopyası ile çalışan ağaç, dört koşu çifti):

| koşu | en uzun kare önce · sonra | ortanca en uzun | >50 ms kare |
|---|---|---|---|
| 1 | 95 · 111 | 68 · 68 | 23 · 23 |
| 2 | 86 · 82 | 67 · 67 | 22 · 23 |
| 3 | 168 · 107 | 81 · 79 | 31 · 25 |
| 4 | 110 · 110 | 76 · 77 | 24 · 26 |

Fark gürültü içinde; kötüleşme yok (1. koşudaki 111 Sağlık'a geçişte, sonraki koşularda 70-81). Not: «sonra» ağacında öbür ajanların o anki değişiklikleri de var.

## Açık kalanlar
- Sayfa zemini sahnenin kendi rengini değil alanın tonunu taşıyor (Bugün'de sıcak ana renk). Sahnenin dip rengini tuvalden okuyup zemine süzmek denenmedi; gerekirse `manzara()` çizimden sonra bir satır `getImageData` ile `--sahne-dip` yazabilir.
- Bugün geniş ekranda sahne 380 px: 900 px yüksek ekranda İlerleme'nin ikinci satırı katlanmanın altında kalıyor (bilerek: ilk ekran sahne + bekleyen + çalışılan alan).
- Telefonda selamın altındaki özet cümlesi sahnenin dolu yerine (çadır) denk gelebiliyor; örtüyle okunuyor ama sahnenin yerleşimi piksel-doga.js'te.
- Yüksek kontrastta öne çıkan kart ve küçük kutular eski kenar kuralıyla çerçevelenir; ayrıca görüntüyle bakılmadı.

