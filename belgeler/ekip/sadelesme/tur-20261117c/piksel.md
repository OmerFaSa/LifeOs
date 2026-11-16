# Piksel sahneler · daha ustaca (tur 2026-11-17c)

Sahibin isteği: «pixel artı daha güzel yap». Dosya: brand/ortak/piksel-doga.js (yalnız bu değişti). Kabuğa dokunulmadı.

## Durum
- [x] Mevcut kodu oku, önce panoları (scratchpad `once/`)
- [x] Ortak iyileştirmeler (gece tonu, ışık havuzu, hale)
- [x] Sahne iyileştirmeleri (kale, yaylak, ufuk, pınar, hattat, ateş, iç mekân pencereleri)
- [x] Sonra panoları (scratchpad `sonra/`, `karsi/`)
- [x] Testler: `node tools/ortak_test.js` 276 geçti 0 kaldı (piksel 50/52, 2 eski modül vakası atlandı, önceden de öyle); `node tools/kabuk_gez.js` hepsi geçti

## Ortak (bütün sahneler)
- **Gece tonu**: eskiden her renk %64 sabit bir laciverte karışıyordu → bütün sahne aynı griye çöküyor, yer gökten açık kalıyor, siluet kayboluyordu. Şimdi ay ışığı: renk değeri korunur, doygunluk düşer, maviye kayar (çarpma); yer gökten koyu, yakın/uzak ayrımı gece de okunur.
- **İç mekân gecesi**: oda soğuk maviye değil, kandille loş ve sıcak tona gider (kahverengi-kızıl); pencerede mavi gece kalır (sıcak/soğuk karşıtlığı).
- **Işık havuzu (isik)**: iç içe sert halkalar yerine üç kademe, kademe sınırında ince Bayer şeridi.
- **Güneş/ay halesi**: sürekli azalan yoğunluk kumlu görünüyordu; şimdi sabit yoğunluklu halkalar (kenarda dama, sonra çeyrek, sonra seyrek). Yakın görüntü: `karsi\gunes-yakin.png`.
- **Gece parlak yüzeyler**: açık taş, keçe, kar ay ışığında öne çıkar (değerin karesiyle küçük bir parlaklık terimi); kale duvarı, otağ gece okunur.
- Denenip geri alınan: gökle sınırdaki kenarlara otomatik kenar ışığı (rim). Gece sırtlarda çizgi gibi kontur bıraktı, «programla üretilmiş» göründü; kaldırıldı.

## Sahne notları
- **kale**: tepedeki çapraz çizgiler (taranmış gibi) yerine dalgalı yatay kaya tabakaları, ışık alan çıkıntılar, seyrek yarıklar. Soldaki nokta nokta ırmak düz çizgi + koyu kıyı.
- **yaylak**: karın düz alt kenarı (bulut/şapka gibi) yerine derelere inen geniş kar dilleri; gece kar ay ışığında parlak kalır.
- **ufuk**: lolipop ağaç yerine Pınar'ın küme küme taçlı ağacı (ortak `agac()`; Pınar'daki çınar da artık bu işlevle çizilir, görünüşü aynı).
- **hattat**: levhadaki tarak gibi dikmeler yerine kâşide (solda kıvrılan kuyruk), eğik elifler, nun çanağı, eğik harekeler.
- **ates**: ateşin ışığı ozanın üstüne de düşer, gece havuzu geniş; ozan gece siluet olarak kaybolmuyor.
- **kitaplik, yazi, hattat**: pencerenin altı tek gri banttı; şimdi uzak tepe soluk, önde sıcak yeşil ova.
- **otuken, medrese, kervansaray, pinar, cadir, sifahane, taht**: yalnız ortak iyileştirmeler (gece, ışık, hale).

## Panolar (scratchpad)
Kök: `C:\Users\ASUS\AppData\Local\Temp\claude\5d634c12ea7c4647\693ee8fd-ac31-49fb-b30d-a0d6485ef7d9\scratchpad`
- `karsi\<sahne>.png`: 4 satır (önce gündüz, sonra gündüz, önce gece, sonra gece); solda masaüstü 480×100 (2×), sağda telefon 195×72 (2×)
- `karsi\hepsi-{once,sonra}-{gunduz,gece}.png`: 14 sahne alt alta, 1×
- `once\`, `sonra\`: sahne başına pano + `sure.txt` (binaCiz süresi, renk sayısı)
- Çizim betikleri: `ciz.js` (renk sayımı eklendi), `pano.py`, `karsi.py`

## Ölçümler
- binaCiz (Node, 25 denemenin en kısası, aynı süreçte önce/sonra; betik `olc2.js`): 14 sahne × 2 vakit toplamı masaüstü 480×100 **46,0 → 47,0 ms**, telefon 195×72 **24,8 → 25,8 ms** (+%2–4, sahne başına ≤0,4 ms; gürültü düzeyinde).
- Renk sayısı (test sınırı ≤72, üst-sol ≤8; 480×100): en yüksek önce 65 (yazi gece) → sonra 63 (yazi gece); üst-sol en çok 7 (yaylak gece), değişmedi. Ayrıntı `sonra\sure.txt`.

## Açık kalanlar
- Gündüz değişiklikleri ölçülü (kale, ufuk ağacı, hattat levhası, pencereler, hale); en görünür fark gecede. Gündüzde daha büyük adım istenirse sıradaki adaylar: kervansaray duvarının düz yüzeyi, çadır (kara çadır ahşap baraka gibi duruyor), yaylakta zirveye oturan bulut (şapka gibi), iç mekân duvarlarında pencereden gelen ortam ışığı (üst-sol sakin kuralıyla dikkatli).
- Kenar ışığı (rim) genel geçişle denendi, kontur gibi durduğu için kaldırıldı; istenirse odak yapılara tek tek eklenebilir.
- Gerçek uygulamada (kabuk üstündeki örtü `--kapak-ortu` ve alt solma ile) gözle bakılmadı; panolar ham sahne. Kabuğa istek yok.

---

# İkinci tur · gündüz (koordinatör: «gündüzde fark görünmüyor, görünür adım at»)

## Durum
- [x] İç mekân duvarları, kervansaray, kara çadır, yaylak bulutu, atmosfer perspektifi
- [x] Panolar: `karsi\hepsi-gunduz-yanyana.png` (sol önce = ilk hâl, sağ sonra), `karsi\<sahne>.png` güncel; birinci turun çıktısı `sonra-tur1\`
- [x] Testler: `node tools/ortak_test.js` 276 geçti 0 kaldı (piksel 50/52); `node tools/kabuk_gez.js` hepsi geçti

## Ne değişti
- **İç mekânlar (kitaplik, hattat, yazi)**:
  - Pencereden duvara düşen gün ışığı: pencerenin sola-aşağı kaymış eğik kopyası, kayıt gölgeleri, kenarı titreşimli. Yalnız gündüz; başlık bölgesine (x < %42, üst üçte bir) girmez.
  - Duvar dibinde kuşak: kitaplik ve yazıda ahşap lambri (ışık alan pervaz, gölge çizgisi, panel derzleri); hattatta mavi-firuze baklava desenli çini kuşak (eski tek çizginin yerine).
  - Tavan gölgesi aynı kaldı (başlığın arkasında kumlanma yok). Sağ köşe koyulaşması denendi, kenarda kumlu sütun gibi durdu, kaldırıldı.
- **kervansaray**:
  - Duvar: kesme taş sıraları (derz çizgisi, şaşırtmalı dikey derzler), üstte ışık alan saçak ve dendanlar.
  - Gölgeler: duvar dibinde zemine düşen gölge; payandaların ve taç kapının sağa düşen gölgesi.
  - Taç kapı: iki renkli örgü (zencerek) çerçeve, kemerin üstünde kitabe kuşağı.
- **cadir**: Kara çadır baştan çizildi.
  - Biçim: üç direkle gerilmiş, direk başlarında tepe, aralarda sarkan çatı, uçlarda yere inen yamaç. Gergi ipleri ve kazıklar var.
  - Doku: dokuma şeritleri çatıyla aynı eğride, seyrek kıl dokusu.
  - Kapı: önde kamış çiğ, gece ışığın önünde siluet olur.
  - Eski dikey çizgiler ahşap barakaya benziyordu.
- **yaylak**: Zirveye değen bulut çıkarılır (dağ eğrisi `o.p.dag`'a taşındı, `yer` içinde süzülür).
- **Atmosfer (bütün dış sahneler)**:
  - Yeni pus rengi `o.pus`: ufuk rengi, ufkun biraz üstündeki gök rengine karışır (gündüz mavimsi, şafak/akşam mor-pembe).
  - Uzak katmanlar bu pusa karışıyor, en uzak sırtlar ~0,08 daha soluk.
  - Zemin bantları öne doğru daha doygun (`doy`, en önde +%35).
  - Gündüz güneşin altında ufukta alçak, sıcak bir hale var (tek renk, kenarı dama/seyrek; çoğu yerde sırtın arkasında kalır, hafif). Daha geniş ve yoğun titreşimli ilk deneme kumlu göründü, alçak ve dolu kuşağa çevrildi.

## Ölçümler
- binaCiz toplamı (25 denemenin en kısası):
  - İlk hâl → şimdi: masaüstü 44,6 → 48,2 ms, telefon 23,8 → 25,5 ms.
  - Birinci tur → şimdi: 46,5 → 47,7 ms.
  - Sahne başına en çok +0,2 ms.
- Renk sayısı (sınır 72, 480×100):
  - En yüksek: kitaplik gece 65, yazi gece 66. Lambri ve kandil ışığı birlikte 71'e çıkmıştı; gece pervaz ışığı kaldırıldı, panel derzi tek renge indi.
  - Gündüz en çok 52 (ates).
  - Üst-sol en çok 7.

## Açık kalanlar
- Atmosfer perspektifi bilerek hafif; dış sahnelerde gündüz farkı iç mekânlar kadar büyük değil.
- Hattattaki çini kuşak 1× küçültmede ince bir çizgi gibi kalıyor; masaüstünde (3×) okunur.
- Gerçek kabukta, örtü (`--kapak-ortu`) ve alt solma ile gözle bakılmadı.
