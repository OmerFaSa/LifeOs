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
| AYS | ✅ sekiz çekmece, iç sekme 0, Bugün üç alan (H kapısı yeşil: a861d79) | dd97f56 | — |
| SPİ | ⏳ | — | — |
| ESP | ⏳ | — | — |
| HKM yüzü | kullanıcı onayı bekliyor | — | — |

## KARTLAR (K)

- **Şu an:** T 2-3 saat yok (kullanım süresi). Kullanıcı: bu arada K ve H birlikte ilerlesin. K kendi
  dosyalarında: K5 (164 bildirim kartı `pwa.js`/`sw.js`, 167 araştırması), T2-02 hazırlığı (137 veri
  adları `sozluk.js`), K2 hazırlığı (22 etiket listesi). T'nin dosyasına ve ekranlara dokunulmuyor.
- **Sahiplendiğim çekirdek dosyalar:** — (üç `ui.js` bırakıldı: `toast` 150 çizgisi ve
  `confirmSheet(…, danger, onay)` 22 etiketi eklendi, 2d765cc)
- **Biten** (özellik · commit): 024 025 026 028 sayı `sayi.js` · 009cf92; 027 035 037 041 grafik
  `grafik.js` · 076bb29; 110 111 112 114 116 121 150 022 öneri ve onay `oneri.js`, 016 139 sözlük
  `sozluk.js`, 018 şüpheli giriş (`sayi.js`) · 2d765cc; 173 177 179 güven `guven.js` +
  bozuk tarih (31 Şubat) koruması `sayi.js`/`grafik.js` · 0443561; P2: 015 170 son bilinen değer,
  sesli okuma (`sayi.js`) · 138bf20; 029 030 031 033 034 038 039 grafik ekleri
  (`grafik.js`) · 464a54c; 113 123 124 127 öneri ekleri (`oneri.js`) · 6a7fd82; P3: 032 036 040
  geçen dönem, dağılım, birikim (`grafik.js`) · 9bb2be7
- **Bulgular:** T2-01 ✅ a798671 · T2-03 ✅ c063316 · (K'nin bulduğu, H kapattı: T2-04, T2-05,
  T2-07, T2-08) · T2-02 (AYS Ofis ham kimlik, 137) ekran dosyası
  (`office.js`, `team.js`): AYS teslim edilince K2'de 137 ile
- **Hata (benim):** 076bb29 dist'i derlemeden gitti (T `kart.css`'i `index.html`'e bağlamıştı);
  0780206 ile düzeldi. Artık her commit'te üç `build.py` + `--denetle` koşuyorum
- **T ve K2 için:** stil tek dosyada `kart.css`; hepsi `LIFEOS.*` altında, üç arayüzde aynı.
  - Sayı: `SAYI.html({ deger, birim, kesinlik, aralik, kaynak, zaman, formul, girdiler, tazelik })`,
    `SAYI.kutuGlifi([...])` → `C.Kutu` yuvası, `SAYI.farkHtml({ deger, yon, ek })`,
    `SAYI.suphe(yeni, dun, { tur, birim })` + `supheHtml` (18)
    P2: `SAYI.html(s, { yenileniyor, etiket, fark })`, `SAYI.sesli(s, { etiket, fark })`
  - Grafik: `GRAFIK.seri(noktalar)` → `cizgiSvg(s, { bant, cumle })`, `egilimHtml(seri, { yon })`,
    `aralikHtml`, `dolulukHtml`, `esikCubukHtml`, `tikHtml`, `yukHtml`, `cumleHtml`, `hucreHtml`,
    `hizKoniSvg(noktalar, hedef)`; P3: `cizgiSvg(s, { onceki })` + `gecenDonemDugmesi(acik)`,
    `dagilimSvg({ degerler })`, `birikimSvg(gunluk, plan, { bugun })`
  - Öneri: `ONERI.kartHtml(oneri, R.ACTIONS)`, `alan(liste, katalog)` (alanda tek kart),
    `cakismaHtml`, `ayarHtml(katalog, ayar)`, `sormadanMi(oneri, katalog, ayar, { kaynak })`;
    yıkıcı onay: `UI.confirmSheet(baslik, mesaj, fn, true, ONERI.sonucEtiketi({ fiil, sayi, nesne }))`
    P2: `onceSonraHtml(once, sonra)`, `gecmeHtml(oneri)` + `gecmeKaydi`, `oneri.capraz = { kaynak, hedef,
    olcum }`, `kapsamHtml(oneri, katalog, secili)` + `kapsamSeviyesi`
  - Sözlük: `SOZLUK.html('tekrar-borcu', 'tekrar borcunu')`, `seritHtml({ acik, neden })`,
    `hazir(kalip, degerler)` + `hazirHtml` (139)
  - Güven: `GUVEN.yedekHtml({ damga, boyut, iz, kayit, bugun })` (kural `yedek.js`'ten),
    `silmeHtml({ nesne, sayi, donusNoktasi, yazilan })` + `silmeDurumu`, `gecmisHtml(olaylar)`
    (olay: `{ zaman, kaynak:'kullanici'|'merkez'|'ofis'|'kural'|'plan'|'ice-aktarma', alan, eski, yeni, onay }`)
- **Yarım / sıradaki:** K2 — AYS teslim satırı ✅ olunca hemen (P1'leri AYS ekranlarına)
- **Soru / öneri:**
  - **H için — T yokken ortak çalışma (kullanıcının isteği):**
    - Durum: K1 bitti (38 ortak bileşen). AYS teslim kapısı senin denetiminde temiz; teslim satırı
      T'nin. T gelince yazar ya da kullanıcı sana/bana yetki verirse (soru kullanıcıda). O an K2 başlar,
      sen H4 tam koşum.
    - K şimdi (yalnız kendi dosyaları): 164 bildirim kartı; 167 araştırıldı (telefonda PWA için ana ekran
      bileşeni yolu yok — kullanıcıya söylendi); 137 için veri kimliği → Türkçe ad tablosu ve her modülün
      `agents.js` `reads` kimliğinin adı olduğunu sınayan test; 36 `confirmSheet` çağrısı için
      «sonucu söyleyen» etiket listesi (K2'de tek commit).
    - H'den ricam (senin alanın; K2'yi güvenli yapar):
      a) Ölçen (kırmızı yapmayan) doktrin denetimi: ekranda «Evet», «Tamam», «Evet, devam et» etiketli
         onay düğmesi sayısı (22) ve Merkez dışı öğede mor (`--mer`, `--mer-ink`, `--mer-t`; 110). K2
         ilerledikçe 0'a iner; 0 olunca zorunlu yaparsın.
      b) K'nin P2/P3 commit'lerini oku: 138bf20, 464a54c, 6a7fd82, 9bb2be7 — bulgu varsa `T2-NN → K`.
      c) SPİ/ESP tıklama taraması ve H4 hazırlığı senin sırana göre.
    - Cevabını kendi bölümüne yaz; her turda okuyorum.
  - T ve H için: T'nin devir notunda «koşulmadı» dediği denetimler 9bb2be7 üstünde (dd97f56 + K P3)
    koştu: üç modülde runtests (AYS 1902, SPİ 1532, ESP 1534), smoke, a11ycheck, layoutcheck,
    palettecheck — 15/15 temiz. H'nin sadelik düzeltmesi de geldi (a861d79); teslim satırı T'nin.
  - T: üç `index.html`'e `js/core/grafik.js`, `oneri.js`, `sozluk.js`, `guven.js` (sayi.js'ten sonra). `oneri.js`
    yüklenmeden 150'nin süre çizgisi görünmez (`ui.js` onu arar, yoksa eskisi gibi kalır).

## TASARIM (T)

- **Şu an:** ⏸ T molada (kullanıcı: limit). **AYS teslim edildi** (dd97f56; H kapısı a861d79) — AYS `screens/*.js` artık K'nin. Kalan iş aşağıda DEVİR'de.
- **T0 kararları:** ✅ cevaplandı (2026-09-24): sekizi de öneri gibi — EKIP-PLANI §8 ve CEKMECE-HARITASI'na işlendi
- **Biten** (adım ya da özellik · commit): T1 jetonlar `brand/ortak/jeton.css` · 23e3a7c;
  T1 temel kalıplar `brand/ortak/temel.css` + `C.Kutu` (02) + `C.ModulIsareti` (165) +
  alt çekmece tutamağı (162) · 9b12bef; **T2-06 ✅ 4656788** (`.lrow__act` telefonda sarar);
  **T2 kabuk** `brand/ortak/kabuk.{js,css,test.js}` — üst çubuk: 008 modül menüsü, sekiz
  çekmece, 115 mor sayaç, 013 ara, 009 gruplu bildirim, 118 bağlantı noktası, 140 rütbe çipi;
  gün şeridi: 151 şimdi çizgisi, 001 modül şeridi, 005 hafta, 163 sabit etiket; 155 geçiş
  rengi; telefon: 169 alt bant, 166 hızlı ekle, 160; 019 bölüm çubuğu; Menü sayfası · 7c0a728;
  **§8-4** paletler ve beş düzen kalktı, Görünüm Açık · Koyu · Sistem · 5d4e8d2 (envanter kayıp 0)
- **AYS iskeleti (7c0a728):** menü sekiz çekmece (`R.App.NAV`, adlar `LIFEOS.KABUK.CEKMECELER`
  'den); yol yazısı `R.App.yolOf`; yeni ekranlar **Onaylar** (`screens/onaylar.js`: King +
  HKM teklifi Bugün'den, ofis önerileri Ofis'ten buraya taşındı; Bugün yalnız en öndeki kartı
  gösterir, fazlası «+N öneri Onaylar'da») ve **Kütüphanem** (`screens/kutuphane.js`: test
  kitapları Sınama'dan taşındı; «Çöz» Sınama'ya geçer). Envanter AYS: kayıp 0.
- **K için:** kabuk HTML'i `LIFEOS.KABUK` üretir; ekran yalnız `render()` + `headline/lede/
  actions` verir. Bugün'ün Öneri alanı `R.Screens.onaylar.oneriAlani()` (data-oz 110) — K1c
  bileşeni teslimden sonra buraya ve `onaylar.js`'e girer. Kutu başlığı artık `h2`.
- **K için bağlantılar:** üç `index.html`'e `css/kart.css` (temel.css'ten sonra) ve
  `js/core/sayi.js` (kesinlik.js'ten sonra) eklendi.
- **H için (araçlar senin):** sayfa başlığı `.sayfabasi__baslik` ve eski ad `.hero__title` birlikte
  (duman ve envanter okuyor; istersen yeni ada geç). AYS'de `.sitefoot` yok, künye `footer.sayfasonu`
  — palettecheck'in «alt bant» ölçüsü AYS'de ölçecek öğe bulamıyor (siyaha düşüyor), yeni öğeye
  bakmalı. Derleme kimliği hâlâ `.sitefoot__sha`. entegre 2.77/2.78 King/HKM kartını Bugün'de
  arıyor: Bugün en öndeki kartı gösterdiği için geçer, ama ikisi birden bekliyorsa HKM kartı
  yalnız Onaylar'dadır — `go('onaylar')` daha sağlam. Yeni kabuk eylemleri: `modul-menu`,
  `bildirim-ac`, `hafta-ac`, `hizli-ekle`.
- **T3 AYS (bu commit):** ekran içi sekme 0 — Analiz, Genel ayarlar, Tekrar, Rütbe alt alta bölüm
  (`C.SayfaBolumleri` + `C.bolumeGit`, 019; eski `*-tab` eylemi düğmede kalır). Bugün üç alan (03):
  Şimdi (tek uyarı + sıradaki blok) · Durum (Günün akışı, Özet, Günlük sayaç) · Öneri (tek kart);
  geri kalan kartlar **Bugün › Ayrıntı** (`R.Screens.gun`, aynı işleyiciler). Uzun açıklamalar
  `C.Ayrinti` («Neden?», D katmanı). Ekran başına en çok bir dolu düğme. Boş durum: Onaylar,
  Kütüphanem. Düzeltme: Analiz'de «asgari çaba undefined dk.» (politikada tek değer yok) + test.
  Denetim: runtests AYS 1897 · SPİ 1529 · ESP 1527; AYS duman, a11y, 390 px temiz; envanter AYS
  kayıp 0; sadelik AYS: yalnız tablo sayımı kaldı (aşağıdaki bulgu).
- **H · bulgu:** `tools/envanter.js:296` · `BLOK` `table`'ı içeriyor, tablonun çocukları
  (`table-row-group`) BLOK değil → her tablo «30+ kelimelik tek parça yazı» sayılıyor · AYS target 2,
  cards 2, analytics 1, guide 6 aşımın hepsi tablo · doğrulama: aşan öğelerin etiketi TABLE.
  Düzelince AYS sadelik yeşil olur.
- **DEVİR (sıradaki çalışan için):**
  1. ✅ AYS teslim edildi (H tablo sayımını a861d79'da düzeltti, kapı yeşil).
  2. SPİ ve ESP kabuğa geçer: AYS `app.js`'teki `NAV`/`ustCubukHtml`/`gunSeridiHtml`/`sayfaBasiHtml`/
     `bolumCubuguHtml`/`altBantHtml`/`menuHtml` kalıbı birebir; SPİ `SECTIONS` ve ESP menüsü sekiz
     çekmeceye (`LIFEOS.KABUK.CEKMECELER`), `index.html`'e `css/kabuk.css` ve `js/core/kabuk.js`.
     Sonra T3: sekmeler `C.SayfaBolumleri`'ye, Bugün üç alana, onaylar tek çekmeceye.
  3. Sonra T4 hareket · T5 ayarlar · T6 HKM yüzü (EKIP-PLANI §4.2).
  4. Açık kullanıcı soruları (eski oturum): telefon için yerel ağ erişimi; başka hangi fotoğraf
     okuma özellikleri.
- **Soru / öneri:** —

## HATA (H)

- **Şu an:** AYS teslim kapısı — a861d79 üzerinde (ayrı worktree): runtests 1897/1897, duman 44 ekran, a11y, 390 px, palet (tek tasarım, 132 ölçüm), çizim bütçesi (en ağır office 86,9 ms / 120), dist aynı; envanter kayıp 0; sadelik AYS bütçede. Tıklama taraması AYS (T3 sonrası, a861d79): **580 düğmeye basıldı, 0 sorun**. H tarafından AYS kapısı yeşil; teslim tablosuna T yazınca H4 tam koşum.
- **Biten:** H0 taban envanteri · 1600f75 — `node tools/envanter.js` her push'ta CI'da koşar
- **Biten:** H0b tıklama taraması ilk tam koşum (T3'ten önceki kod): AYS 652 · SPİ 501 · ESP 678 düğmeye basıldı, **gerçek sorun 0**. AYS'de görülen 3 «Unexpected token '<<'» H'nin kendi rebase'inin çalışma alanında bıraktığı çakışma işaretinden (build.js) geldi; aynı ekran temiz ağaçta yeniden tarandı: 70 basış, 0 sorun. Ders: uzun koşumlar ayrı `git worktree`'de (plan §7 zaten böyle diyor).
- **Biten:** H1 sadelik denetimi (`tools/sadelik.js`, plan §1.2 bütçesi) — CI'da envanterle aynı gezintiden; teslim tablosunda ✅ olan modülde kırmızı olur, diğerlerinde yalnız ölçer
- **Denetlenen push'lar:** T1 23e3a7c ✅ · T1 9b12bef ⚠ → T2-06 ✅ 4656788 (üç modülde runtests, duman, a11y, 390 px, palet, dist, ortak/seviye temiz) · K 009cf92 kod okundu → T2-01 · K 076bb29 + 0780206: dist ve ortak kopyalar temiz, kod okundu → T2-03 · K 2d765cc (öneri, onay, sözlük) ve 0443561 (güven): üç modül runtests yeşil, kod okundu (sormadanMi, seviye kalıbı, silme kapısı, kayıt geçmişi doktrine uygun) — K2'de `silme-onay` işleyicisi `silmeDurumu`nu YENİDEN sınamalı, düğmenin disabled olması yetmez
- **T ve K için:** taşıdığın ekrandan sonra `node tools/envanter.js <MODÜL>` koş (~1 dk). «KAYIP» çıkarsa ya geri koy ya da kullanıcı onayıyla `ekip/envanter/kaldirilan.json`'a yaz. Envanter ekran ölçülerini de verir (sadelik bütçesi, H1)
- **H: §8-4 testleri hazır** (T'nin isteği): AYS `planner.test.js` palet testleri → «Görünüm — tek tasarım» (tema profilden uygulanır; eski profildeki palet/düzen değeri bozmaz); SPİ `ui.test.js` «seçilen düzen köke yazılır» kalktı, görünüm listesi testi yalnız `pref-theme`'e bakıyor; SPİ `data.test.js` değişmedi (SP.DESIGNS tek girdiyle geçer). Üç `palettecheck.js` palet ve düzeni artık uygulamanın CSS'inden okuyor (bugün 7 palet + 4 düzen, kaldırınca kendiliğinden tek palet); SPİ `designcheck.js` zaten SP.DESIGNS'tan okuyor. Envanter: `set-palette`, `set-design` (üçü), AYS işleyicileri ve SPİ `pref-palette`/`pref-design` alanları `kaldirilan.json`'da (§8-4 gerekçesiyle). **Dikkat:** `open-palette` KOMUT paletidir (⌘K), kalmalı. Silinen `data/palettes.js`/`designs.js` dosyalarının `tests/index.html` bağlantılarını kaldırma commit'inde sen çıkar (dosya yoksa test sayfası 404 verir).
- **T2-06 kapandı:** T 4656788, H doğruladı (yeni «pencere kenarına yapışık» denetimiyle de SPİ 390 px temiz).
- **T'ye cevap (tablo sayımı):** düzeltildi (bu commit) — tablo artık «tek parça yazı» sayılmıyor. dd97f56 üzerinde AYS: envanter kayıp 0, sadelik `--denetle AYS` **bütçede (22 ekran)**. AYS'yi teslim tablosuna yazabilirsin; teslimden sonra CI'da AYS sadeliği zorunlu olur.
- **H: T3 testleri hazır** (T'nin isteği): `ux.test.js` «sekme şeridi olan ekranda tam bir sekme seçilidir» — bütün ekranları tarar, şeridi olmayan ekran sözün dışında («sekme yok»u sadelik.js ölçer); `ekran.test.js` tatil sınırı alanını Bugün + (varsa) `R.Screens.gun` çiziminde arar. İkisi de T3'ten önce yeşil (AYS 1876/1876), T3'ten sonra da geçecek biçimde.
- **K'ye cevap:** perde bulgun T2-04 olarak düzeltildi; `audit.test.js` T2-05; yayımın elle yazılmış dosyayı ezmesi T2-07 (ortak.py ve seviye.py artık reddeder); planner testi T2-08. `TAHLIL_ESKI_GUN` önerisi: bırakıyorum — senin testin iki sayıyı yan yana tutuyor; audit.js'in sayi.js'e yükleme sırası bağımlılığı kazanması daha kırılgan.
- **Bulgu özeti** (`T2-NN → sahip · durum`, ayrıntı `ekip/HATALAR.md` Tur 2): açık: T2-02 → K/137 (AYS Ofis'te ham veri kimlikleri). Kapandı: T2-01 ✅ K a798671 · T2-03 ✅ K c063316 (ikisini de H yeniden çalıştırıp doğruladı) · T2-04 ✅ H b32fe7f · T2-05 ✅ H b32fe7f
- **Son tam koşum:** —
- **Katalog kapsamı** (envanter çıktısı): 0 / 183
- **Yarım / sıradaki:** H0b tıklama taraması → bulguları düzelt → T1 9b12bef denetimi
