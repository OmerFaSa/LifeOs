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
