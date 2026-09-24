# Ekip durumu — canlı pano

> Plan: `ekip/EKIP-PLANI.md` (sabit). Bu dosya canlıdır.
> **Kural:** herkes yalnız kendi bölümüne yazar. Teslim tablosuna T, kapı satırına ve bulgu
> özetine H yazar. Her satır kısa olur: numara · durum · commit.
> Başlarken oku; bitirirken ya da limit yaklaşınca kendi bölümünü güncelle ve push et.

## Kapılar (H yazar)

| Kapı | Durum | Commit |
|---|---|---|
| Kapı 1 · H0 taban envanteri (`ekip/envanter/taban-2026-09-24.json`) | ✅ **açık** — T2 ve T3 başlayabilir | 1600f75 |

## Teslim tablosu (T yazar)

Bir modülün satırı «teslim» olunca o modülün `screens/*.js` dosyaları K'ye geçer.

| Modül | İskelet (T3) | Teslim commit | K aldı |
|---|---|---|---|
| AYS | ⏳ | — | — |
| SPİ | ⏳ | — | — |
| ESP | ⏳ | — | — |
| HKM yüzü | kullanıcı onayı bekliyor | — | — |

## KARTLAR (K)

- **Şu an:** K1 · P1 ortak bileşenler (ekrana dokunmadan)
- **Sahiplendiğim çekirdek dosyalar:** — (üç `ui.js` bırakıldı: `toast` 150 çizgisi ve
  `confirmSheet(…, danger, onay)` 22 etiketi eklendi, 2d765cc)
- **Biten** (özellik · commit): 024 025 026 028 sayı `sayi.js` · 009cf92; 027 035 037 041 grafik
  `grafik.js` · 076bb29; 110 111 112 114 116 121 150 022 öneri ve onay `oneri.js`, 016 139 sözlük
  `sozluk.js`, 018 şüpheli giriş (`sayi.js`) · 2d765cc
- **Bulgular:** T2-01 ✅ a798671 · T2-03 ✅ c063316 · T2-02 (AYS Ofis ham kimlik, 137) ekran dosyası
  (`office.js`, `team.js`): AYS teslim edilince K2'de 137 ile
- **Hata (benim):** 076bb29 dist'i derlemeden gitti (T `kart.css`'i `index.html`'e bağlamıştı);
  0780206 ile düzeldi. Artık her commit'te üç `build.py` + `--denetle` koşuyorum
- **T ve K2 için:** stil tek dosyada `kart.css`; hepsi `LIFEOS.*` altında, üç arayüzde aynı.
  - Sayı: `SAYI.html({ deger, birim, kesinlik, aralik, kaynak, zaman, formul, girdiler, tazelik })`,
    `SAYI.kutuGlifi([...])` → `C.Kutu` yuvası, `SAYI.farkHtml({ deger, yon, ek })`,
    `SAYI.suphe(yeni, dun, { tur, birim })` + `supheHtml` (18)
  - Grafik: `GRAFIK.seri(noktalar)` → `cizgiSvg`, `egilimHtml(seri, { yon })`, `aralikHtml`, `dolulukHtml`
  - Öneri: `ONERI.kartHtml(oneri, R.ACTIONS)`, `alan(liste, katalog)` (alanda tek kart),
    `cakismaHtml`, `ayarHtml(katalog, ayar)`, `sormadanMi(oneri, katalog, ayar, { kaynak })`;
    yıkıcı onay: `UI.confirmSheet(baslik, mesaj, fn, true, ONERI.sonucEtiketi({ fiil, sayi, nesne }))`
  - Sözlük: `SOZLUK.html('tekrar-borcu', 'tekrar borcunu')`, `seritHtml({ acik, neden })`,
    `hazir(kalip, degerler)` + `hazirHtml` (139)
- **Yarım / sıradaki:** K1e güven (173 177 179) → K1 P2'ler (15 170 29–34 36 38–40 113 123 124
  127) → K2 (AYS teslimini bekliyor)
- **Soru / öneri:**
  - T: üç `index.html`'e `js/core/grafik.js`, `oneri.js`, `sozluk.js` (sayi.js'ten sonra). `oneri.js`
    yüklenmeden 150'nin süre çizgisi görünmez (`ui.js` onu arar, yoksa eskisi gibi kalır).
  - H · bulgu: `tools/ortak.py` `yay()` · hedefte elle yazılmış bir dosya varsa sessizce üstüne
    yazıyor · `brand/ortak/oneri.test.js` adı SPİ'nin kendi `src/tests/oneri.test.js`'iyle çakıştı ve
    yayın onu ezdi (commit'ten önce yakalandı, git'ten geri alındı; ortak dosya
    `onerikart.test.js` oldu) · öneri: başı «ÜRETİLMİŞ KOPYA» olmayan var olan hedefe yazmayı reddet.
  - H · bulgu: `AYS/src/tests/planner.test.js:204` «kapasite değişince plan yeniden üretilir» ·
    `generatedAt` ms çözünürlüğünde (`AYS/src/js/core/planner.js:265`); iki `ensurePlan` aynı ms'ye
    düşünce damgalar eşit, test kalır · doğrulama: aynı kodla bir koşumda kaldı, sonrakinde geçti.

## TASARIM (T)

- **Şu an:** T1 temel (jetonlar, tema, Inter, temel bileşenler)
- **T0 kararları:** ✅ cevaplandı (2026-09-24): sekizi de öneri gibi — EKIP-PLANI §8 ve CEKMECE-HARITASI'na işlendi
- **Biten** (adım ya da özellik · commit): T1 jetonlar `brand/ortak/jeton.css` · 23e3a7c;
  T1 temel kalıplar `brand/ortak/temel.css` + `C.Kutu` (02) + `C.ModulIsareti` (165) +
  alt çekmece tutamağı (162) · (bu commit)
- **K için:** renk/ölçü/süre yalnız jetonlardan: `--ays --spi --esp --mer` (+ `-ink` yazı,
  `-t` açık ton), `--ok --bad --now`, `--r-xs/-sm/-md/-r`, `--sp-*`, `--dur-press/--dur/
  --dur-lg/--dur-in`. Kart iskeleti: `C.Kutu({ simge, ad, yuva, govde, ayak, bitisik })`;
  yuva = kesinlik yeri (sizin sayı bileşeniniz). Düğme tonları: `primary` (modül),
  `ink` (siyah), `ghost`.
- **Not (H):** üç `src/tests/index.html`'e `jeton.css` ve `temel.css` bağlantısı eklendi
  (test sayfası gerçek stil ortamında koşsun diye); test değiştirilmedi.
- **K için bağlantılar:** üç `index.html`'e `css/kart.css` (temel.css'ten sonra) ve
  `js/core/sayi.js` (kesinlik.js'ten sonra) eklendi.
- **H'ye istek (§8-4, kullanıcı kararı: paletler ve beş düzen kalkar):** var olan testleri
  yalnız sen değiştirebildiğin için sırayı sana bırakıyorum. Güncellenmesi gerekenler:
  `AYS/src/tests/planner.test.js:324-336` (R.PALETTES > 4), `SPI/src/tests/ui.test.js:467-505`
  (data-design='harita'), `SPI/src/tests/data.test.js:358-374` (SP.DESIGNS listesi). Araçlar:
  `*/tools/palettecheck.js` palet/düzen döngüleri tek temaya (açık + koyu) iner; SPİ
  `designcheck.js` ve `tasarimcheck.js` ölçecek düzen bulmayacak (SP.DESIGNS tek girdi
  kalacak: `defter`). Envanter: `set-palette`, `set-design` eylemleri «bilerek kaldırıldı»
  listesine. Hazır olunca buraya «H: §8-4 testleri hazır» yaz; kaldırmayı tek commit'te
  yapacağım (palettes.css, designs.css, görünüm panelinde palet/düzen, ekranlardaki seçiciler).
- **Yarım / sıradaki:** T2 kabuk (üst çubuk, gün şeridi, alt band) → §8-4 kaldırma (H'nin
  testlerinden sonra) → T3 AYS
- **Soru / öneri:** —

## HATA (H)

- **Şu an:** H0b tıklama taraması (`tools/tiklama.js`: her ekranın her düğmesine temiz sayfada basar; ilk koşum sürüyor)
- **Biten:** H0 taban envanteri · 1600f75 — `node tools/envanter.js` her push'ta CI'da koşar
- **Biten:** H1 sadelik denetimi (`tools/sadelik.js`, plan §1.2 bütçesi) — CI'da envanterle aynı gezintiden; teslim tablosunda ✅ olan modülde kırmızı olur, diğerlerinde yalnız ölçer
- **Denetlenen push'lar:** T1 23e3a7c ✅ · T1 9b12bef ✅ (üç modülde runtests, duman, a11y, 390 px, palet, dist, ortak/seviye temiz) · K 009cf92 kod okundu → T2-01 · K 076bb29 + 0780206: dist ve ortak kopyalar temiz, kod okundu → T2-03
- **T ve K için:** taşıdığın ekrandan sonra `node tools/envanter.js <MODÜL>` koş (~1 dk). «KAYIP» çıkarsa ya geri koy ya da kullanıcı onayıyla `ekip/envanter/kaldirilan.json`'a yaz. Envanter ekran ölçülerini de verir (sadelik bütçesi, H1)
- **H: §8-4 testleri hazır** (T'nin isteği): AYS `planner.test.js` palet testleri → «Görünüm — tek tasarım» (tema profilden uygulanır; eski profildeki palet/düzen değeri bozmaz); SPİ `ui.test.js` «seçilen düzen köke yazılır» kalktı, görünüm listesi testi yalnız `pref-theme`'e bakıyor; SPİ `data.test.js` değişmedi (SP.DESIGNS tek girdiyle geçer). Üç `palettecheck.js` palet ve düzeni artık uygulamanın CSS'inden okuyor (bugün 7 palet + 4 düzen, kaldırınca kendiliğinden tek palet); SPİ `designcheck.js` zaten SP.DESIGNS'tan okuyor. Envanter: `set-palette`, `set-design` (üçü), AYS işleyicileri ve SPİ `pref-palette`/`pref-design` alanları `kaldirilan.json`'da (§8-4 gerekçesiyle). **Dikkat:** `open-palette` KOMUT paletidir (⌘K), kalmalı. Silinen `data/palettes.js`/`designs.js` dosyalarının `tests/index.html` bağlantılarını kaldırma commit'inde sen çıkar (dosya yoksa test sayfası 404 verir).
- **⚠ T'ye ACİL — main CI kırmızı (T2-06):** 9b12bef'ten beri SPİ «Telefon düzeni (390px)» CI'da kırmızı: `guide/veri: yatay taşma 11px`. Neden `layout.css` `.lrow__act` telefonda `flex-direction:row` ama `flex-wrap` yok; v4 düğmesi üç düğmeyi genişletti. Yerelde sınırda geçiyor (387 px), CI tarayıcısında taşıyor. Düzeltme: iki `.lrow__act` kuralına `flex-wrap:wrap` (denendi: taşma kalkıyor). Senin dosyan; istersen «H düzeltsin» yaz, ben yaparım.
- **K'ye cevap:** perde bulgun T2-04 olarak düzeltildi; `audit.test.js` T2-05. `TAHLIL_ESKI_GUN` önerisi: bırakıyorum — senin testin iki sayıyı yan yana tutuyor; audit.js'in sayi.js'e yükleme sırası bağımlılığı kazanması daha kırılgan.
- **Bulgu özeti** (`T2-NN → sahip · durum`, ayrıntı `ekip/HATALAR.md` Tur 2): açık: T2-02 → K/137 (AYS Ofis'te ham veri kimlikleri). Kapandı: T2-01 ✅ K a798671 · T2-03 ✅ K c063316 (ikisini de H yeniden çalıştırıp doğruladı) · T2-04 ✅ H b32fe7f · T2-05 ✅ H b32fe7f
- **Son tam koşum:** —
- **Katalog kapsamı** (envanter çıktısı): 0 / 183
- **Yarım / sıradaki:** H0b tıklama taraması → bulguları düzelt → T1 9b12bef denetimi
