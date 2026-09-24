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
- **Sahiplendiğim çekirdek dosyalar:** —
- **Biten** (özellik · commit): 024 025 026 028 sayı bileşeni `brand/ortak/sayi.js` · 009cf92
- **T ve K2 için:** `LIFEOS.SAYI.html({ deger, birim, kesinlik, aralik, kaynak, zaman, formul,
  girdiler, tazelik })` sayıyı ve köken kartını üretir; `LIFEOS.SAYI.kutuGlifi([...])` →
  `C.Kutu` yuvası; `LIFEOS.SAYI.farkHtml({ deger, yon:'artis-iyi'|'azalis-iyi', ek })`.
  Stil tek dosyada: `kart.css` (T'nin jetonlarıyla; yazıda `-ink`, zeminde `-t`).
- **Yarım / sıradaki:** K1b grafik (027 035 037 041) → K1c öneri ve onay (110 111 112 114
  116 121 150) → K1d sözlük, düğme, şüpheli giriş, model kapalı (16 22 18 139) → K1e güven
  (173 177 179)
- **Soru / öneri:**
  - T: üç `index.html`'e `css/kart.css` (temel.css'ten sonra) ve `js/core/sayi.js`
    (kesinlik.js'ten sonra) bağlantısı K2'de gerekecek; şimdi eklenirse uygulamada etkisi
    yok. Senin dosyan, ben dokunmuyorum.
  - H · bulgu: `AYS/src/js/core/perde.js:501` (`acHemen`) · perde testleri ~15 perdeyi açık
    bırakıyor, her biri `keydown` yakalayıcısı · sonraki bir testte ilk Esc yutuluyor
    (SPİ ve ESP'de aynı test aynı biçimde kaldı) · doğrulama: test sayfasında yakalayıcı
    izi, ~5,2 sn'de +15, sayi testinin Esc'inde −15. `sayi.test.js` Esc'yi iframe'de sınıyor.
  - H: `ESP/src/tests/index.html:215` ve `:229` · `audit.test.js` iki kez yükleniyor, ESP
    audit testleri iki kez koşuyor.
  - H (öneri): SPİ `core/audit.js` `TAHLIL_ESKI_GUN = 180` ile `LIFEOS.SAYI.TAZELIK.tahlil`
    aynı sayı; audit.js tabloyu okursa eşik tek yerde kalır.

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
- **Denetlenen push'lar:** T1 23e3a7c ✅ · T1 9b12bef ✅ (üç modülde runtests, duman, a11y, 390 px, palet, dist, ortak/seviye temiz) · K 009cf92 kod okundu → T2-01
- **T ve K için:** taşıdığın ekrandan sonra `node tools/envanter.js <MODÜL>` koş (~1 dk). «KAYIP» çıkarsa ya geri koy ya da kullanıcı onayıyla `ekip/envanter/kaldirilan.json`'a yaz. Envanter ekran ölçülerini de verir (sadelik bütçesi, H1)
- **Bulgu özeti** (`T2-NN → sahip · durum`, ayrıntı `ekip/HATALAR.md` Tur 2): T2-01 → K · açık (fark rozeti «+0» renkli) · T2-02 → K/137 · açık (AYS Ofis'te ham veri kimlikleri)
- **Son tam koşum:** —
- **Katalog kapsamı** (envanter çıktısı): 0 / 183
- **Yarım / sıradaki:** H0b tıklama taraması → bulguları düzelt → T1 9b12bef denetimi
