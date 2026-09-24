# T (TASARIM) devri — yarım kalan işin tam listesi

> 2026-09-24. Bu belgeyi T rolünü devralan çalışan okur. Kaynak plan `ekip/EKIP-PLANI.md`
> §4.2 (T'nin adımları), düzen `ekip/CEKMECE-HARITASI.md`, canlı durum `ekip/EKIP-DURUM.md`.
> Hedef görünüm `ekip/tasarim/v4-*.png`.

## 0 · Başlarken

1. `git fetch origin main && git rebase origin/main`; sırayla oku: `AGENTS.md`, `ekip/EKIP-PLANI.md`
   (§1, §3, §4.2, §5, §6, §7), `ekip/CEKMECE-HARITASI.md`, `ekip/EKIP-DURUM.md` (TASARIM bölümü).
2. Doğrudan `main`'de çalışılır; her iş ayrı commit, `[T] …` başlığıyla. Push öncesi
   `git fetch && git rebase origin/main`, sonra `git push origin HEAD:main`. **Force-push yok, PR yok.**
   dist/build.js çakışırsa: `git checkout --ours`, `python3 build.py`, testler, `git add`, devam.
3. Dosya sahipliği (§5): CSS, `index.html`, `app.js`, `components.js`, `brand/ortak/{base,layout,
   temel,kabuk,jeton,simge,tanitim}.css`, `brand/ortak/kabuk.js` → T. **Teslim edilmemiş** modülün
   `screens/*.js` dosyaları → T; teslimden sonra K'nin. **Var olan testi yalnız H değiştirir:**
   kırılacak testi `dosya:satır` ile EKIP-DURUM'daki kendi bölümünde H'den iste.
4. Önce test: yeni davranış testsiz gelmez. Kırmızıyı göstermek için çalışan dosyanın üstüne
   yazılmaz (kullanıcı kuralı); karalama kopyada ya da bellekte gösterilir.
5. Uzun koşumlar (duman, envanter) kaynak dosyaları okur: düzenleme sürerken koşturma; gerekiyorsa
   ayrı `git worktree` kullan.
6. Her push öncesi, dokunulan her modülde: `python3 build.py` · `node tools/runtests.js` ·
   `node tools/smoke.js` · `node tools/a11ycheck.js` · `node tools/layoutcheck.js` ·
   `node tools/palettecheck.js` (`CHROMIUM_PATH=/opt/pw-browsers/chromium`). Kökte:
   `python3 tools/ortak.py --yay` + `--denetle`, `python3 tools/seviye.py --denetle`,
   `python3 tools/marka.py --sina`, `node tools/envanter.js <MODÜL>` (kayıp 0 olmalı),
   `node tools/sadelik.js --denetle <MODÜL>` (teslimden önce bütçede olmalı).

## 1 · Biten (main'de)

| Adım | Ne | Commit |
|---|---|---|
| T0 | Kullanıcı kararları: «önerilerini uygula» (§8'in sekizi) | 9363ead |
| T1 | Jetonlar `brand/ortak/jeton.css`, Inter, açık/koyu tema; `temel.css`; `C.Kutu` (02), `C.ModulIsareti` (165), alt çekmece tutamağı (162) | 23e3a7c, 9b12bef |
| T2-06 | Defter satırı eylem kutusu telefonda sarar | 4656788 |
| T2 | Ortak kabuk `brand/ortak/kabuk.{js,css,test.js}` (`LIFEOS.KABUK`): üst çubuk (008 013 009 118 140 115), gün şeridi (151 001 005 163), 155, telefon alt bandı (169 166 160), bölüm çubuğu (019), Menü sayfası, açılır katman yöneticisi. **Yalnız AYS'ye bağlı.** | 7c0a728 |
| §8-4 | Paletler ve beş düzen kalktı; Görünüm Açık · Koyu · Sistem (üç modül) | 5d4e8d2 |
| T3 AYS | Sekiz çekmece, ekran içi sekme 0 (`C.SayfaBolumleri`), Bugün üç alan + «Bugün › Ayrıntı» (`R.Screens.gun`), Onaylar ve Kütüphanem ekranları, `C.Ayrinti` («Neden?» katmanı), dolu düğme ≤ 1 | dd97f56 |
| Teslim | **AYS teslim edildi** (H kapısı yeşil a861d79) — AYS ekranları artık K'nin | b3c1733 |

AYS'nin nasıl yapıldığının kalıbı: `AYS/src/js/app.js` (`NAV`, `UST`, `BANT`, `onaySayisi`,
`bildirimGruplari`, `baglantiVerisi`, `rutbeVerisi`, `gunSeridiHtml`, `yolOf`, `sayfaBasiHtml`,
`bolumCubuguHtml`, `menuHtml`, `altBantHtml`, `HIZLI`, `doRender`), `AYS/src/js/screens/onaylar.js`,
`kutuphane.js`, `today.js` (`render` üç alan / `renderAyrinti`), `AYS/src/STIL.md` v4 bölümü,
testler `AYS/src/tests/cekmece.test.js`, `brand/ortak/kabuk.test.js`, `temel.test.js`.

## 2 · Kalan iş — bu sırayla

### A · SPİ: kabuk (T2) + çekmeceler (T3) → teslim

1. **Kabuk.** `SPI/src/index.html`'e `css/kabuk.css` (en sona) ve `js/core/kabuk.js`
   (`sayi.js`'ten sonra). `SPI/src/js/app.js`'te masthead/sitenav/hero/pagenav/footer/tabbar/
   navsheet yerine AYS'deki `doRender` kalıbı (üst çubuk, gün şeridi, sayfa başı, bölüm çubuğu,
   `footer.sayfasonu`, alt bant, Menü). Görünüm paneli `K.katmanAc('appearance', …)` ile.
   Başlık h1'i `hero__title` sınıfını da taşımalı (duman testi ve envanter onu okur).
2. **Sekiz çekmece** (`SECTIONS` → adlar `LIFEOS.KABUK.CEKMECELER`'den). Öneri:
   - Bugün: `today` (bugünkü Giriş/Özet/Geçmiş sekmeleri → Bugün + Ayrıntı bölümü, AYS gibi)
   - Plan: SPİ'de ayrı ekran yok → **karar gerek**; boş çekmece zaten gizlenir. Öneri: plan
     motorunun hafta görünümü ve hedefler buraya.
   - Çalışma: `labs` Testler · `meals` Öğün · `kitchen` Mutfak · `move` Hareket · `basket` Bütçe
   - Analiz: `analytics` · Onaylar: **yeni** `onaylar` (King + HKM teklifi Bugün'den, ofis önerileri
     Ofis'ten; Bugün en öndeki tek kartı gösterir) · Ofis: `office` · `team` · `meeting`
   - Kütüphanem: **yeni** (BAM gıdası, ürünler) · Ayarlar: `family` Profil · `guide` Genel · `rutbe` Rütbe
3. **İç sekmeler → `C.SayfaBolumleri`** (taban sayıları): labs 7 (Sonuçlar, Test gir, Geçmiş,
   Karşılaştır, Paneller, İlaç, Eğilim), move 6, basket 4, meals 3, analytics 5, rutbe 5, guide 4,
   today 3. Eski sekme eylemi düğmede kalır, işleyici `C.bolumeGit(id)` çağırır. Segmented süzgeçler
   de sekme sayılır → tek düğmeye çevir (AYS `cards.js` notebook-filter örneği).
4. **Bugün üç alan** (03): taban boy 3 064 px / 54 düğme → ≤ 1 800 / ≤ 14. Şimdi (tek canlı öğe:
   SPİ'de tek dokunuş sayaçlar, 73) · Durum (2–4 `C.Kutu`) · Öneri (tek kart). Kalanlar Ayrıntı'ya.
5. Sadelik: dolu düğme ≤ 1, 30+ kelimelik yazı → `C.Ayrinti`, ham renk 0, XP yalnız Rütbe'de.
6. Kırılacak testleri önceden bul ve H'ye yaz (SPİ `ui.test.js` sekme/tasarım testleri, ekran
   sözleşmesi testi varsa). Envanter kayıp 0, sadelik `--denetle SPI` bütçede → H kapıyı denetler →
   EKIP-DURUM teslim tablosuna SPİ satırı (commit kimliğiyle).

### B · ESP: aynısı → teslim

- `ESP/src/js/app.js` menüsü `ESP.Nav.sections`'tan geliyor. Çekmeceler: Bugün `today` ·
  Plan `ladder` Merdiven (+ hedefler) · Çalışma: `lang` Dil · `symposium` Felsefe · `history` Tarih ·
  `studio` Ses · `library` Okuma · `writing` Yazı (karar 4: altı disiplin tek Çalışma'da) · Analiz ·
  Onaylar (yeni) · Ofis `office` `team` `meeting` · Kütüphanem (yeni: ünite, gitar paketi; «Okuma ›
  Kütüphane» adı Okuma'da kalır) · Ayarlar `profile` `guide` `rutbe`.
- En ağır iş sekmeler: lang 13, symposium 13, history 13, library 12, writing 11 (iki kat sekme:
  Çalış · Kartlar · Ekle · Öğren · Dilbilgisi · İlerleme · Reçete · Koç) → kartlar alt alta;
  team 9 (ajan sekmeleri → ajan seçici liste), studio 5, rutbe 5, guide 5, analytics 4, ladder 3.
- Bugün taban 2 813 px / 39 düğme → ≤ 1 800 / ≤ 14. Ofis'te 24 dolu düğme var.

### C · AYS'de T'ye kalan küçükler (ekranlar artık K'nin; yalnız T dosyaları)

- **011 Sakin hata:** `AYS/src/js/app.js` `errorPanel` hâlâ kırmızı «danger» uyarısı → sakin
  `C.Kutu` + «Verin yerinde» + iki eylem, `data-oz="011"`, test. SPİ/ESP'de de aynı.
- **010 Boş durum:** Onaylar ve Kütüphanem'de var ama `data-oz="010"` işareti yok (ekranlar K'nin →
  K'ye yaz ya da ortak bir `C.Bos` bileşeni ver).
- K'nin 022 (sonucu söyleyen onay düğmesi) çağrılarından biri T dosyasında: `AYS/src/js/app.js:842`
  civarı `confirmSheet` — K istediğinde birlikte değiştir.
- `*/src/STIL.md`: v4 bölümünün altındaki eski Renk/Tipografi/Ölçü bölümleri yeniden yazılacak.
- H için not: AYS `core/state.js` varsayılan profilde hâlâ `palette/design` alanı yazıyor (kaldırılan
  global'lere bakıyor, zararsız) — H'nin dosyası.

### D · T4 hareket (ESP teslim edilince)

012 tek canlı öğe · 014 odak kapısı (var olan odak kipi giydirilir) · 149 sayı yuvarlanması ·
152 tik çizimi · 153 kart açılma · 154 küçülen başlık · 156 odak halkası akışı · 158 satır kapanma ·
159 üzerine gelince önizleme. Azaltılmış harekette hepsi 0 (jeton.css zaten süreleri 0 yapar).
Sadelik: aynı anda hareket eden öğe ≤ 1.

### E · T5 ayarlar (T4'ten sonra)

017 «Ne değişti?» · 021 kaydedilmemiş değişiklik · 171 kurulum adımları (var olan `tanitim.js`
giydirilir) · 176 gizlilik kilidi · 181 ayar önizlemesi · 182 varsayılana dön · 183 ayar arama.
Ayarlar düzeni: Profil · Görünüm · Veri ve yedek · Bildirim · Merkez · Ofis · Rütbe · Rehber.

### F · T6 HKM yüzü (en son)

`HKM/web/` aynı dile geçer (CEKMECE-HARITASI «HKM yüzü»: Bugün · Onaylar · Hedefler · Sistemler ·
Ofis · Sohbet · Ayarlar; Ayarlar'ın 7 sekmesi → 4 bölüm). Karar 8 «evet, en sonda»; plan §5
gereği kullanıcıdan ayrıca «başla» alınır. HKM'de ayrı bir oturum çalışıyor olabilir.

## 5 · T'yi devralan H'nin devri — nerede kaldı (2026-09-24 akşam)

> H oturumu T işini sürdürdü; limiti dolduğu için T'ye geri veriyor. Önce bunu oku,
> sonra §2'nin kalanına dön.

**main'de (bu devirle birlikte push edildi):**

| Commit | Ne | Denetim |
|---|---|---|
| 5a5c024 | T2-12: Rütbe sekme → bölüm tek kaynakta; SPİ/ESP `kabuk.css` | 5 denetim temiz (designcheck koşmadı → aşağıda KIRMIZI) |
| 84bdb43 | K'nin `grafik/oneri/sozluk/guven.js` üç `index.html`'e bağlandı; SPİ/ESP `kabuk.js`; `ortak.py --denetle` yayılıp **bağlanmayan** kopyayı yakalar | 15/15 temiz |
| b06c28d | **T2 SPİ**: kabuk + sekiz çekmece (`SP.App.SECTIONS`, `yolOf`); yeni `screens/onaylar.js` (King + HKM teklifi + Danışma'nın bekleyen kaydı + sonucu belirsiz teklif — bu sonuncusu çekiliyor ama hiç çizilmiyordu), `screens/kutuphane.js` (BAM ürünleri Ofis'ten, bilgi isteği ve yerler Mutfak'tan), Plan › Hedefler (`SP.Screens.hedefler`, hedef kartı Bugün'den); `cekmece.test.js` (8) | SPİ runtests, duman, 390, palet, ledger, tasarım, perf temiz; envanter SPİ kayıp 0 |
| e8c364c | Sayfa sonu okunur (AYS derleme kimliği 1,06 kontrasttaydı); `palettecheck` alt bandı gerçek öğeden ölçer | 15/15 temiz |
| d9d19ef | Kütüphanem/Onaylar kutuları h2 (a11y h1→h3) | SPİ a11y temiz |

**KIRMIZI — önce bunu kapat (CI «Sisteme özel denetimler», 5a5c024'ten beri):**
`SPI/tools/designcheck.js` → `rutbe: içerik kırpılıyor — div.rutbe-kademe (1136>1114)` (4 sorun).
Sebep: Rütbe artık alt alta bölüm, Merdiven her zaman çiziliyor; `brand/seviye/seviye.css:937`
`.rutbe-kademe__sahne` (dekor görsel, `alt="" aria-hidden="true"`) `transform:scale(1.04)` ile
bilerek taşar ve `.rutbe-kademe{overflow:hidden}` onu kırpar (1114 × 1,02 = 1136). Gizlenen veri
yok → **yanlış alarm**. Önerilen düzeltme (H aracı): `SPI/tools/designcheck.js:202-206` kırpma
kuralı yalnız dekor OLMAYAN bir torun (`closest('[aria-hidden="true"]')` değil, `img[alt=""]`
değil) kutunun kenarını aşıyorsa saysın. Doğrulama: `cd SPI && node tools/designcheck.js`
4 sorun → 0. (ESP'de designcheck yok.) Ayrıca aynı dosyada `.sitefoot` zemin ölçüsü yeni
`footer.sayfasonu`'yu görmüyor — saydam zemin olduğu için oraya bakma, yalnız not.

**Koşmayan:** `node tools/entegre.js` (kökte) b06c28d sonrası koşmadı. Değişen: 2.76 ürünün
ekranı modülden okunur (SPİ'de `kutuphane`), 2.78 ve 2.80 HKM kartını `onaylar`'da arar.

**YARIM — T3 SPİ:** `ekip/yarim/t3-spi.patch` (main'e girmedi, kod değil yama).
`git apply ekip/yarim/t3-spi.patch && (cd SPI && python3 build.py)` ile geri gelir; sonra
yamayı sil. İçinde: Bugün üç alan (Şimdi: en acil tek uyarı · vakti gelen hatırlatma · günün
sorusu · dört ölçüm `sleep/rhr/hrv/weight` + öğün satırı; Durum: Toparlanma · Asgari gün ·
Beslenme kutuları; Öneri: `oneriAlani`), **Bugün › Ayrıntı** (`route gun`, Giriş · Özet ·
Geçmiş alt alta, `day-tab` bölüm çubuğunda), `bugun.test.js` (4), `ui.test.js` tatil testi
`SP.Screens.gun`'u çizer. Koşan: SPİ runtests 1560/1560. Koşmayan: duman, a11y, 390, palet,
envanter, sadelik. Ölçülen (boş profil, 1440): Bugün 1006 px, 4 düğme.

**T3 SPİ'nin kalanı (§2.A-3, 5, 6):**
- Sekme → `C.SayfaBolumleri` (AYS `analytics.js` kalıbı: `govde(t)` try/catch, `afterRender`
  ile istenen bölüme `bolumeGit`, eski `*-tab` eylemi bölüm çubuğunda):
  `labs.js` 7 (`TABS` satır 34, `render` 1195) + **panel süzgeci** (`panelFilter`, `Subtabs`
  → tek düğme ya da `Select`; `lab-filter` eylemi kalmalı), `move.js` 6 (+ satır 211 kuvvet
  örüntü `Subtabs`), `basket.js` 4, `meals.js` 3, `analytics.js` 5, `guide.js` 4.
  `S.ui.labTab` başka yerlerden de set ediliyor: `core/office.js:737,790`, `core/palette.js:48`,
  `screens/meals.js:684` — bunlar `go('labs')` sonrası o bölüme kaymalı.
- Ölçü notu: sadelik/envanter `.seg` (C.Segmented) sekme SAYMAZ; yalnız `.subtabs`/`role=tab`.
  His ölçeği ve gün kaydırıcı olduğu gibi kalabilir.
- Dolu düğme ≤ 1 (her ekranda), 30+ kelime → `C.Ayrinti`, sonra `node tools/envanter.js SPI`
  (kayıp 0) ve `node tools/sadelik.js --denetle SPI`, sonra teslim satırı.

**Çalışma notları:** SPİ alt bandın Menü'sü `toggle-menu` taşır (envanter tabanı; üst çubuk
`toggle-sidebar`, ikisi aynı iş). Uzun koşumları `git worktree` içinde koş; `entegre.js`
Playwright'ı `ESP/node_modules`'ten yükler (worktree'ye `ln -s` gerekir). Envanter kapıları
4391–4393: o kapılarda başka sunucu açma. SPİ ve ESP `runtests` aynı kapıyı (4188) kullanır:
paralel koşacaksan kapı ver (`node tools/runtests.js 4288`).

**Sonra:** ESP (§2.B) → AYS küçükleri (§2.C) → T4 → T5; T6 yalnız kullanıcı «başla» derse.

## 6 · K'nin devri — T işinin nerede kaldığı (2026-09-24 gece)

> Kullanıcı talimatıyla K, §5'ten sonra T'nin ve H'nin yarım işini yürüttü; K'nin limiti
> doldu, iş T'ye döner. Önce bunu oku, sonra aşağıdaki «Kalan» sırasıyla devam et.

**main'de (hepsi push edildi, son 5bea926 + bu devir):**

| Commit | Ne | Denetim |
|---|---|---|
| d58720d | T2-13: SPİ designcheck dekor kırpmasını saymaz | 4 → 0; negatif kontrol: gerçek kırpma yakalanıyor |
| 826fbe3 | §5'teki yarım T3 SPİ yaması uygulandı, yama silindi | 15 denetim + envanter + sadelik (today bütçede) |
| 59e7276 | **T3 SPİ bitti → teslim** (satır 42ee91c): 6 ekranda sekme → bölüm, tek dolu düğme, 30+ kelime katmanda, T2-14 | SPİ 1570/1570, smoke, a11y, 390, palet, perf, design, ledger, tasarım; envanter 0; **sadelik SPI zorunlu ve bütçede** |
| ccedf0a | **T2 ESP**: v4 kabuk + sekiz çekmece | ESP 1547/1547, smoke, a11y, 390, palet, perf; envanter 0; entegre.js temiz |

**Kurulan kalıplar (ESP'de aynısını kullan):**
- Sekme → bölüm: `C.SayfaBolumleri({ act:'<eski>-tab', bolumler })`, `govde(t)` try/catch,
  `afterRender` içinde `S.ui.<ekran>Tab`'ı OKU, SİL, `C.bolumeGit` et («istek bir kez»); eski
  `*-tab` işleyicisi `bolumeGit(el.dataset.tab)`. Başka yerden bölüm isteyen kod önce
  `S.ui.xTab = …` sonra `App.go(…)` yapmalı (SPİ `core/palette.js:43` ters sıradaydı).
- Rozet sekmeden bölüm çubuğuna: `bolumler[i].sayi`.
- Süzgeç sekme değildir: `C.Chip({ act:<eski eylem>, on, data:{ 'data-tab', 'aria-pressed' } })`
  satırı, `role="group"` (SPİ `labs.js` panel süzgeci, `move.js` kalıp şeridi). Eylem adı
  aynı kalır → envanter kaybı 0.
- Alt alta çizim aynı kartı iki kez gösterebilir (SPİ «Kalıp dengesi» üç sekmedeydi): tek
  yerde bırak. Ayrı sekmelerde hiç birlikte çizilmemiş alanlar aynı `id`'yi taşıyabilir —
  `SPI/src/tests/bolumler.test.js` yardımcısı `bolumlu()` bunu da sınar; ESP'ye kopyala.
- Sekmeler kalkınca gizli sekmedeki etiketsiz alanlar a11ycheck'e görünür olur (SPİ'de 5).
- Tek dolu düğme: ekranın asıl eylemi kalır, boş durum `P.empty(…, sade)` (SPİ `parts.js`).
- 30+ kelime: sabit metin `C.Ayrinti({ ozet, govde })`; koddan kurulan (uzunluğu veriye
  bağlı) metin `C.Katmanli({ metin, sinif })` (SPİ `components.js`: ilk cümle görünür,
  gerisi «Ayrıntı»). Gizlilik cümlesi SAKLANMAZ: kısa görünür paragraflara böl.
- `★` Chromium'da `Extended_Pictographic` sayılır (Node'da sayılmaz): çizgi simge kullan.
- **Yer bulucu:** `CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/nerede.js ESP [rota,…]`
  — sadelik yalnız SAYAR; bu, uzun yazının ve fazla dolu düğmenin YERİNİ (bölümüyle) yazar.

**ESP'nin durumu (ccedf0a):**
- `data/sections.js`: sekiz çekmece; `disc` artık SAYFADA (Çalışma'nın bölümü). `core/nav.js`
  kapalı disiplini bölüm düzeyinde süzer, sayfası olmayan çekmeceyi çizmez. **Onaylar ve
  Kütüphanem `views:[]`** — ekranları gelince oraya `{ route:'onaylar', label:'Bekleyen' }`
  ve `{ route:'kutuphane', label:… }` ekle; `app.js` `onaySayisi()` zaten
  `ESP.Screens.onaylar.bekleyen()`'i arıyor.
- `modules.test.js` gezinme testleri karar 4'e göre güncellendi (K, H yerine): Tarih artık
  Çalışma › Tarih; kapanan disiplin Çalışma'dan düşer; sekiz çekmece ortak kaynaktan.
- Gün şeridi açık disiplinlerden (seans yazılan «bitti»); açık sayaç sayfa başının üstünde
  (`sayacHtml`, `startClock` tazeler). `data-section` kalktı (`--sec-base` okunmuyordu).
- ESP'de designcheck yok; a11y izin listesinde 3 bilinen eksik (değişmedi).

**Kalan — bu sırayla:**
1. **ESP Onaylar + Kütüphanem** (SPİ b06c28d şablon: `screens/onaylar.js`, `kutuphane.js`,
   `cekmece.test.js`). Bugün'deki King/HKM teklif kartı Onaylar'a taşınırsa **`tools/entegre.js`
   ESP adımlarını güncelle** («King teklifi Bugun kartinda goruldu», BAM ünite/tarih belgesi);
   H SPİ'de aynısını yaptı. Ünite, tarih belgesi, gitar paketi → Kütüphanem; «Okuma ›
   Kütüphane» adı Okuma'da kalır.
2. **T3 ESP** (sadelik ölçümü: 29 aşım · 15 ekran): sekme → bölüm lang 13, symposium 13,
   history 13, library 12, writing 11 (iki kat sekme: Çalış · Kartlar · Ekle · Öğren ·
   Dilbilgisi · İlerleme …), team 9 (ajan sekmeleri → ajan seçici), studio 5, guide 5,
   analytics 4, ladder 3; tezgâh (`desk-tab`, yedi ekranda ortak) ölç. Bugün taban 2 813 px /
   39 düğme → ≤ 1 800 / ≤ 14, üç alan (SPİ `today.js` + `bugun.test.js` kalıbı). Ofis'te 24
   dolu düğme (`prop-accept` «Onayla» her öneride — Onaylar'a taşınınca çoğu gider). Sonra
   envanter ESP (kayıp 0), `sadelik --denetle ESP`, teslim satırı.
3. **AYS küçükleri (§2.C)**: 011 sakin hata, 010 boş durum işareti, `app.js:842` onay
   etiketi (22), STIL.md eski bölümler. (Sadelik ölçümü «varsayılan Evet, devam et» AYS 9,
   SPİ 7, ESP 9 — 22'nin işi; ekran çağrıları K'nin, `app.js`'teki T'nin.)
4. T4 → T5; T6 yalnız kullanıcı «başla» derse.

**Sahiplik:** SPİ teslim edildi (59e7276) → SPİ `screens/*.js` artık **K'nin** (K2). T'nin
SPİ'de kalan işi yalnız T dosyaları (CSS, `app.js`, `components.js`). ESP ekranları teslime
kadar T'nin.

**Kullanıcıya açık sorular (K'den):** (a) HKM anahtar notunda «günde bir kez BÜTÜN veri
HKM'ye yedeklenir» cümlesi AYS/SPİ'de «Bu anahtar neyi açar?» katmanında — her zaman
görünür mü olsun? (b) AYS 042: blok adımları (ısınma · ana set · yanlış notu) için kural
yok; çubuk ancak kural yazılınca. (c) 167 ana ekran bileşeni yerine Badge API.

## 3 · Bilinmesi gerekenler

- Katalogda T'nin 37 özelliğinden kodda işaretli olan 19'u (001 002 003 005 008 009 013 019 115 118
  140 151 155 160 162 163 165 166 169) — kabuk özellikleri **yalnız AYS'de bağlı**; SPİ/ESP
  bağlanınca «3 modül» sözü tutar.
- `LIFEOS.KABUK` modül kapıları kök `sunucu.py` ile aynı (4173/4183/4193/4200); başka yoldan açılmış
  sayfada öteki sistemin adresi uydurulmaz.
- H'nin araçları sayfa başlığını `.hero__title`, derleme kimliğini `.sitefoot__sha` ile okur (ikisi de
  korunuyor). Palet denetiminin «alt bant» ölçüsü AYS'de `.sitefoot` bulamıyor (siyaha düşüyor).
- SPİ `SP.DESIGNS` tek girdi (`defter`) kalır: SPİ düzen denetimleri ve veri testleri onu okur.
- Açık kullanıcı soruları (eski oturumdan): telefon için yerel ağ erişimi; başka hangi fotoğraf okuma
  özellikleri.
