# Piksel sahne paketi — tur 2026-11-16

Sahip: piksel ajanı. Dokunulan dosyalar yalnız `brand/ortak/piksel*.js`, `brand/ortak/piksel.css`, `brand/ortak/piksel.test.js`. Commit yok (koordinatör atar).

## Durum
- [x] Okuma (AGENTS, OKU, piksel kodu, kabuk KAPAK/manzara)
- [x] Yaşayan insanlar
- [x] Kalite
- [x] Zaman tabanlı konum (tekrar yok)
- [x] Testler + olcum
- [x] Önce/sonra görüntüler

## Bulgular
### Okuma (ilk bulgular)
- Kabukta görünen sahneler `brand/ortak/piksel-doga.js` (`LIFEOS.PIKSEL_DOGA`): KAPAK on türün hepsini kullanıyor (magara, tarla, deniz, col, selale, kiraz, dag, gol, kis, yayla). Bugün'ün `canvas.b-karsilama__manzara`'sında `data-sahne` yok → **yayla** (en çok görülen sahne).
- `piksel-figur.js` yalnız logo/modül yüzleri; sahne figürleri `piksel-doga.js` › `POZ` sprit'leri + `rutin()` (saf saat) ile yürüyor. Kabuk `D.kare(g, arka, yer, Date.now()/1000)` çağırıyor, 125 ms aralık, kare yalnız imza değişince çizilir, gizli sekmede/az harekette/geçişte durur.
- Yani sakinlerin konumu **zaten zaman tabanlı** (Date): sayfaya dönünce kaldığı yerden sürer. Tekrar şikâyetinin piksel-doga kaynağı bulunmadı; aday kaynaklar aşağıda «açık kalanlar»da.
- Hata: yayla `ciz()`'de bir satır sonu yorumu `gunesCiz` ve `gokBulutlari` çağrılarını yutmuş → Bugün'ün sahnesinde güneş/ay ve sabit bulutlar hiç çizilmiyor.
- Baz test: `node tools/ortak_test.js piksel` → 43 geçti, 0 kaldı (2 eski modül vakası atlandı).


### Ara durum (yazılan, doğrulanan)
- `piksel-doga.js`: INSAN pozları (dur, yuru, otur, capa, egil, balik, coban, fener) × 5 giysi; yumuşak yarı saydam kontur; fener gece kararmaz.
- Her sahneye gündüz 1-3, gece 0-1 kişi (fenerli eve dönüş, sonra «içeride» gizli).
- `durgun()`: data-hareket az/tam → LIFEOS.hareketAz → prefers-reduced-motion; azken `kare` t=0 kullanır (herkes ilk pozunda, ikinci çağrı çizmez).
- Kıyı çizgisi hatası (koordinatör bulgusu, mağara): `magara` sonundaki tam genişlik `#8ae0f4` satırı silindi; `suCiz`'in tam genişlik `#e6f6fa` satırı kesik, %35 örtüye çevrildi (dağ ve gölde de aynı çizgi vardı).
- Yayla güneş/bulut hatası düzeldi; uzak sırtlara göğün ufuk rengiyle soluklaşma (gündüz açık mavi, gece mor).
- Kiraz: ördekler köprünün üstünde yüzüyordu → derenin aşağısına alındı.
- Test: `node tools/ortak_test.js piksel` 47 geçti 0 kaldı (4 yeni). `python kalite/olcum.py --denetle` → «Bütçe tamam: 28 bütçe, aşım yok».

### kabuk.js'te gereken düzeltme (benim dosyam değil; kabuk sahibine)
**Bugün'ün manzarası ilk açılışta hiç çizilmiyor** (gerçek tarayıcıda ölçüldü, eski ve yeni piksel-doga ile aynı): `manzara()` önbellekte sahne yoksa
`bostaCiz(..., function () { if (c.isConnected) manzara(); })` ile boşta çizimi sıraya koyar. Sayfa veri gelince hemen yeniden çizilince
(innerHTML) ikinci `manzara()` yeni tuvalle gelir, ama `bostaCiz` aynı anahtarı ikinci kez sıraya koymadığı için **onun geri çağrısı düşer**;
boşta iş bitince ilk tuval artık bağlı değildir → hiçbir tuval çizilmez, gök rengi kalır. Ölçüm: 6,8 sn boyunca manzara tuvaline sıfır drawImage;
`resize` olayı (manzara'yı yeniden çağırır) gelince hemen çiziliyor. Ayrıca `sahneleriHazirla` yalnız başarılı çizimden sonra koştuğu için
bütün kapakların önceden çizimi de bu yüzden hiç başlamıyor.

Düzeltme (tek satır, kabuk/kabuk.js `manzara()` içinde):
```js
if (!o) { bostaCiz(D, tur, saat, c.width, c.height, manzara); return; }   // manzara() o anki tuvali kendisi arar; eski tuvale bağlı koşul geri çağrıyı düşürüyordu
```

## Son durum (rapor)

### Değişen dosyalar
- `brand/ortak/piksel-doga.js` (+128/−15)
- `brand/ortak/piksel.test.js` (+60, dört yeni vaka)
- Bu rapor ve `piksel-gorsel/` (görüntüler). Başka dosyaya dokunulmadı; commit yok.

### Yaşayan insanlar
- Sekiz poz (dur, yuru 2 kare, otur, capa, egil, balik, coban, fener), her biri beş giysi/saç eşiyle (`yuruB`, `capaa`…); 4-7 px genişlik, 8 px boy.
  Yumuşak, yarı saydam koyu kontur (`q`, %44): çiçekli çayırda kaybolmasınlar diye; sert kenar çizgisi değil.
- Sahne başına gündüz 1-3 kişi, gece 0-1:
  - **yayla (Bugün)**: terasta iki çay toplayıcı, çitin ardında çoban + iki koyun; hepsi sağ yarıda (solda selam yazısı var). Gece: fenerli çoban eve döner, 60 sn «içeride», geri çıkar; ev pencereleri yanık.
  - **tarla**: çapalayan çiftçi (hasır şapka), hasat eden, çoban. Gece: fenerle ambara dönen.
  - **deniz**: kıyıda oltacı, kumda yürüyen, palmiye dibinde oturan. Gece: fenere yürüyen fenerli.
  - **göl**: iskelede oltacı, sandalda oturan (sandal bacaklarını örter). Gece: kimse.
  - **dağ**: kulübe yanında odun kıran, teknede oltacı. Gece: kimse (kulübe ışıklı).
  - **kiraz**: köprünün yayını adım adım geçen (güverteye basar), ağaç altında oturan. Gece: köprüden fenerle geçen.
  - **kış**: donmuş gölette kayan, evlerin önünde yürüyen. Gece: fenerle eve dönen.
  - **çöl**: kervanın önünde kervancı (gece fenerli), vahada dinlenen.
  - **şelale**: kanyon tepesinde manzaraya bakan, nehir kıyısında oltacı.
  - **mağara**: kristallerin arasında fenerli gezgin.
- Fener ve hâlesi gece karartmasından muaf (gorsel'de karartmadan sonra yeniden basılır).
- Hız: yürüyüş 2,5 px/sn, adım 2,5 kare/sn; kabuğun mevcut 8 fps döngüsü ve «kare değişmedikçe çizme» imzası aynen kullanılıyor (yeni zamanlayıcı yok).

### Kalite
- **Yayla hatası**: `gunesCiz`/`gokBulutlari` bir satır sonu yorumunun içinde kalmıştı → Bugün'de güneş/ay ve sabit bulutlar yoktu. Düzeldi.
- **Kıyı çizgisi (koordinatör bulgusu)**: mağaradaki uçtan uca turkuaz çizgi = `magara.ciz` sonundaki `R(b, 0, su, W, 1, '#8ae0f4')`; silindi. Aynı türden
  `suCiz`'in tam genişlik `#e6f6fa` satırı (dağ, göl, mağara) kesik ve %35 örtüye çevrildi. Test: göğün altında uçtan uca tek açık renk satır yok.
- **Atmosferik soluklaşma**: `dagCiz` her pikseli göğün ufuk rengine %22 yaklaştırır (yakın ikinci sırtlarda %10); ufuk rengi vakitten gelir (gündüz açık mavi, gece mor) → uzak dağlar her vakitte gökle aynı palette.
- Kiraz: ördekler köprünün üstünde yüzüyordu → derenin aşağısına.
- `kare` çizimden önce `imageSmoothingEnabled = false`.
- Ölçek: kabuk tuvali kutunun 1/3'ü (transform'lu kutu ölçüldüğü için scale(1.05) sonrası etkin ölçek 3,0); ek iş gerekmedi.

### Animasyon tekrarı
- Sakinlerin konumu zaten saf saatti (`kareAl(t)`, kabuk `Date.now()/1000` veriyor); yeni insanlar da aynı yoldan. Test: aynı sahne baştan kurulsa
  (sayfaya dönüş) aynı anda aynı kare; tur boyunca 0,25 sn adımlarda ayak en çok 3 px oynar (sıçrama yok).
- Hareket az (`data-hareket="az"`, yoksa `LIFEOS.hareketAz()`, yoksa `prefers-reduced-motion`): `kare` t=0 kullanır → herkes ilk pozunda, sonraki çağrılar çizmez. Test var.

### Testler
- `node tools/ortak_test.js piksel` → **47 geçti, 0 kaldı** (2 eski modül vakası atlandı; baz 43). Yeni: insan sayısı/poz biçimi, zamana bağlılık ve sıçramasızlık, hareket azken durma, kıyı çizgisi.
- `python kalite/olcum.py --denetle` → **Bütçe tamam: 28 bütçe, aşım yok.**
- `tools/ortak.py` artık yok (kopya dağıtımı kalktı); `kabuk_gez.js` koşulmadı (kabuk dosyalarına dokunmadım, eşzamanlı başka işler var).

### Performans (gerçek kabuk, 1280×800, 4× yavaş CPU, kapaklı sayfalar arası 12 gezinme; eski piksel-doga istek yakalamayla)
| | en uzun kare | medyan (gezinme başına en uzun) | boşta 5 sn, >50 ms kare |
|---|---|---|---|
| önce | 283 ms | 83 ms | 0 (en uzun 17 ms) |
| sonra | 283 ms | 83 ms | 0 (en uzun 17 ms) |
İlk koşuda (manzara hatası yüzünden Bugün çizilmeden) medyan 67 → 100 ms çıktı; ikinci koşuda ikisi de 83 ms: gürültü. 283 ms her iki sürümde ilk gezinme (önbellek boş, sahne boşta çiziliyor). Önceki turun 217 ms ölçümü farklı betikle; bu betikte ikisi aynı koşulda.

### Görüntüler (`belgeler/ekip/sadelesme/tur-20261116/piksel-gorsel/`)
- `sahneler-{once,sonra}-{gunduz,gece}.png`: on sahne 480×100, 3×, aynı t (1000 sn).
- `kabuk-{once,sonra}-{bugun,felsefe,akademik}-{gunduz,gece}.png`: gerçek kabuk, saat 12:00 / 23:30 sabit.
- `yakin-yayla-gunduz.png`, `yakin-yayla-gece-fener.png`, `yakin-deniz-gunduz.png`: insanların yakın görünümü.

Dürüst değerlendirme: insanlar 3× ölçekte 24 px boyunda; yakında okunuyor (çoban asasıyla, oltacı oltasıyla, fener ışığıyla), tam sayfada «minik canlılık» düzeyinde, göze batmıyor.
Kapakta başlık bölgesine düşenler yazının altında kalıyor (tarla ve yaylada sağa alındı; diğer sahnelerde başlıkla çakışma görmedim ama yalnız 1280 genişlikte baktım).
Soluklaşma ince; fotoğrafta fark küçük, en çok gece dağlarda görülüyor. Yayla güneşi 1280'de arama kutusunun arkasına düşüyor.

### Açık kalanlar
1. **kabuk.js manzara geri çağrısı** (yukarıda, tek satır): düzelmeden Bugün ilk açılışta çizilmiyor ve kapakların önceden çizimi hiç başlamıyor. Bu, sahibin
   «animasyonlar tekrarlıyor / sahne geç geliyor» hissine de katkı veriyor olabilir. En önemli madde.
2. «Animasyon tekrarı»nın piksel-doga dışı kaynakları bu paketin dışında: kabuk sayfa çiziminde CSS hareketleri (kabuk.js `surdur` zaten ele alıyor) ve `kabuk.css` `.kapak__sahne` transform geçişi.
3. Telefon genişliğinde (390 px, olc 2) insan konumlarına bakılmadı; testler yalnız 480×100 için sayı/biçim denetler.
4. Gece pencere ışıkları mevcut sahnelerde zaten vardı (yayla, kış, dağ); yeni pencere eklenmedi.
