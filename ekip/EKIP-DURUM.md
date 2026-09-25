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
| AYS | ✅ sekiz çekmece, iç sekme 0, Bugün üç alan (H kapısı yeşil: a861d79) | dd97f56 | ✅ K2 başladı (2026-09-24) |
| SPİ | ✅ sekiz çekmece, iç sekme 0, Bugün üç alan, ekran başına tek dolu düğme (kapı: H'nin listesi K tarafından koşuldu — H'nin limiti doldu, kullanıcı talimatı; sadelik `--denetle SPI` bütçede, envanter kayıp 0) | 59e7276 | ✅ K (T ve H işini de yürüten, kullanıcı talimatı) |
| ESP | ✅ sekiz çekmece, iç sekme 0 (tezgâh açılır satır), Bugün üç alan, ekran başına tek dolu düğme (kapı: H'nin listesi T tarafından koşuldu — H limitte; sadelik `--denetle ESP` bütçede, envanter kayıp 0) | 2204fa3 | — |
| HKM yüzü | **K'ye verildi** (kullanıcı kararı 2026-09-24, EKIP-PLANI §8-9: K7) — T yapmaz | — | K7 |

## KARTLAR (K)

- **V5 · LifeOS Tasarım Dili sürüm 5 (kullanıcı: «komple buna döndür, hiçbir özellik kaybolmasın»; «raf düzeni, aşağı sonsuz uzamasın, iç içe yazı olmasın»).** ✅ V5-1 5e5fa1b jetonlar · ✅ V5-2 1978c32 kenar çubuğu + üst şerit · ✅ V5-3 (bu commit) dört yüzde, masaüstü + telefon:
  - **Ortak (`brand/ortak/`, üç modüle yayılır):** dolu düğme NÖTR koyu (modül rengi düğmede değil) · kutu 14 px + kesikli boş durum · büyük harfli etiketler cümle düzeni (CSS + koddaki 207 `label:` sabiti; kısaltmalar korunur) · Bugün tek sütun: üst satır tarih, büyük başlık günün cümlesi, «Şimdi / Durum / Özet / Öneri» görünür etiket, kahraman modül zemininde, öneri mor çerçevede · **RAF DÜZENİ:** defter satırları yan yana kutu (AYS bant/yığın `display:contents`), kutu en çok 560 px ve içinde kayar, iç içe defter kutu çizmez · **sayfa bölümleri KAT:** çubuk tek bölümü gösterir, öbürleri DOM'da (bolumeGit + yeniden çizimde seçim korunur). Eski «bölümler alt alta» (T3) kuralı kullanıcının raf isteğiyle değişti.
  - **Merkez yüzü (`HKM/web/index.html`):** masaüstünde sol kenar çubuğu (dört sistem geçişi, çekmece altında bölümler), içerik beyaz zeminde kutu; telefonda tek satır marka + kayan çekmeceler. Tek dosya, ortak dosya yüklemez; ikon kuralı sürer.
  - **Testler v5'e:** `temel.test` dolu düğme nötr · `k2bugun` oz-004 cümle başlıkta, oz-042 alan etiketi içerik sayılmaz. Gerçek hata: kahraman 390 px kapta gövdeyi 0'a sıkıştırıyordu → sarar. `tools/envanter.js` `display:contents` çocuğunun içine bakar (raf düzeninde her ekran yanlış «30+ kelime» veriyordu) — bu araca test **yazılmadı**.
  - **Koşulan:** runtests AYS 1951 · SPİ 1599 · ESP 1584 geçti · smoke/a11y/layout/palette/perf üçte temiz · envanter kayıp 0 · sadelik temiz · SPİ design/tasarım/defter temiz · ortak/seviye/marka/build `--denetle` temiz · HKM yuz.js 44 görünüm temiz · HKM tests 643/644 (bilinen `t_kanal` sıra bağımlılığı) · entegre.js İstanbul gecesinde 10 hata, **değişikliksiz HEAD'de birebir aynı** (H'ye bulgu 1).
  - ✅ **V5-4 borçlar:** `tools/envanter.test.js` (ölçü testi; eski ölçüyle 2 durum kırmızı, yenisiyle temiz; CI envanter işinde) · **port çakışması** — ESP ve SPİ `runtests` aynı 4188'deydi, SPİ `smoke` ESP'nin kapısı 4193'teydi (paralel koşumda «ESP is not defined» ve 60 sn zaman aşımı buydu); araç portları tekil: SPİ smoke 4184 · layout 4185 · design 4290 · load 4293; ESP runtests 4198 · perf 4197 · a11y 4295 · load 4298. Üç modül yan yana runtests+smoke+palette temiz.
  - ✅ **V5-6 ergonomik raf + gün şeridi kalktı** (kullanıcı, 2026-09-25: «görseller ergonomik değil, kaos içinde düzeni yok, ne olduğu anlaşılmıyor … yukarıdaki gün çizgisini kaldır»; iş T'de yapıldı, K'nin devir kuralıyla):
    - **Raf (`brand/ortak/kart.css` + `hareket.js raf()`):** en çok iki EŞİT sütun (≥1100 px), telefonda bir · `dense` yok, okuma sırası korunur · aynı raftaki kutular aynı boy · tablo/grafik/form/kart ızgarası tam en · eşi olmayan yarım kutu `.raf-tek` ile tam en (bant/yığın `display:contents` olduğu için eşleştirme JS'te) · **iç kaydırma yok**: uzun kutu kesilir (tek kutu >1000 px → 560; çiftte uzun olan kısanın boyunda), altta solma + «Tamamını göster»/«Kısalt» (`aria-expanded`, odak kesik kısma girince açılır, açık kalır) · kart ızgarası (masalar) ve form kesilmez · kutu adıyla aynı bölüm başlığı yalnız ekran okuyucuya kalır · künye satırı kutu enini aşmaz (SPİ gün gezgini 390 px taşması).
    - **Gün şeridi** üç modülün Bugün'ünden kalktı (`app.js`; işlev ve `hafta-ac` yerinde, envanter kayıp 0).
    - **Hatalar (her biri testle kapalı):** AYS Bugün iki denemeyle **çöküyordu** (`today.js` `cls` tanımsız, V5-5; `k2bugun` «son deneme farkı» testi yakalar) · SPİ Analiz › Kendi bağını kur grafik açıklaması **ham HTML metni** basıyordu · HKM Sistemler sıralı istekte Durum boş/«Yükleniyor…» kalıyordu → altı istek paralel, her kutu kendi sakin hatası.
    - **Sadeleştirme:** ESP Dil ve Merdiven seçicisi sayfa başına (asılı kutu değil) · ESP Ofis «Uzman masaları» iki kez yazılmaz · SPİ Bütçe tekrarlanan ikinci başlık, SPİ Hareket üç kez yazılan toparlanma cümlesi kalktı · SPİ Testler › Dağılım dört sayı 2×2 · HKM Bugün Konsey tam en.
    - **Testler:** `hareket.test` «Raf düzeni (V5)» 5 test (üç modülde) · `SPI|ESP/src/tests/v5duzen.test.js` 3+3 · AYS `smoke` gün şeridi çizilirse kırmızı · `test_yuz` `t_v5_duzen` · `envanter.test` sayfa başı alanı (envanter artık sayfa başındaki seçiciyi ekranın alanı sayar).
    - **Koşulan:** runtests AYS 1958 · SPİ 1607 · ESP 1592 geçti · smoke/a11y/layout/palette/perf üçte temiz · envanter kayıp 0 · sadelik temiz · ortak/seviye/marka/build `--denetle` temiz · HKM tests 646/646 · perf bütçede · yuz.js 44 görünüm temiz · entegre temiz.
  - **Kalan (panoyla birebir değil, içerik yerleşimi):** AYS Bugün üç şeritli gün çizelgesi, Durum sayı kartları, Plan › Hafta takvimi, Deneme karnesi, Merkez Bugün kutu dizilimi. Not: SPİ runtests paralel koşumda 60 sn'yi aşıyor; tek başına geçer.

- **Şu an (T'nin devri alındı, EKIP-PLANI §8-9…12):** **K7 HKM yüzü** (`HKM/web/` K'nin). K2–K4, K6 ertelendi. Kararlar ✅ 767d04e: **§8-11** AYS kurulumu **beş adım kalır** (171 «her adım tek soru»; beşi plan motorunun beş ayrı sorusu) · **§8-12** «Kodu unuttum» **beş dakika** + **iz** (Ayarlar kilidin ne zaman bu yolla kalktığını yazar; kilit kurulunca iz silinir).
  - **K7 ilerleme:** ✅ K7a c3b6d12 v4 jetonları + Merkez moru + Inter (yüz tek dosya kalır, ortak dosya yüklemez). ✅ K7b 4eead4e yedi çekmece + bölüm çubuğu (Profil, Motto → Ayarlar; **Para → Sistemler › Para, K'nin kararı — kullanıcı değiştirebilir**) + Ayarlar 7 sekme → 4 bölüm (eski adresler çalışır). ✅ K7c-011 bd58be0 sakin hata + ağ koptuğunda «Yükleniyor…»da kalma hatası düzeldi. ✅ K7c-017 488933b «Ne değişti?» (yalnız önceden kullanana). Kalan K7c: 010 boş durum (HKM kuralı «ikon yok, sözcük var» katalogdaki «küçük çizim» ile çatışıyor — karar gerek), hareket (012 vb.) sakin hata / boş durum / hareket / Ne değişti?. `HKM/web/index.html` K7 bitene kadar K'de — HKM oturumu dokunacaksa önce buraya yazsın.
  - ✅ **ÇÖZÜLDÜ (K, V5-4):** kök neden denetimdeydi — HKM günü İstanbul diliminde sayar (`HKM/core/saat.py`), `tools/entegre.js` ise `BUGUN`'u ve tarayıcı sayfalarını kabın UTC'siyle kuruyordu. Artık ikisi de `Europe/Istanbul`; UTC 23:16'da (pencerenin içinde) temiz. Eski kayıt: **H'ye bulgu (1):** `tools/entegre.js` İstanbul gece yarısından sonra (UTC ~21:00–24:00) kırmızı: AYS/SPİ/ESP «günün kaydını okuyamadı», «Hepsini kaydet çıkmadı», «yarının işleri HKM'ye ulaşmadı», sonra `koşum hatası: Cannot read properties of null (reading 'id')`. TEMİZ main'de de birebir aynı (cbca971, UTC 21:25); bugün 18:00 UTC'de temizdi. Muhtemelen günün UTC/İstanbul tarihi ayrışıyor — nedeni göremedim. Doğrulama: UTC 21:00 sonrası `node tools/entegre.js`. **Ek (K7b sırasında):** `TZ=Europe/Istanbul` ile koşunca modül adımları geçiyor, bu kez «HKM brifingi üç modülü görmedi» + «ikizi boş» + aynı null.id → modüller ile HKM gün sınırında farklı güne yazıp okuyor. Bu yüzden yüz adımları bu gece doğrulanamadı.
  - **HKM oturumuna ve H'ye not (K7b, kullanıcı «devam»):** K yüzün seçicilerine bağlı üç dosyada YALNIZ seçici değiştirdi: `HKM/tools/yuz.js` (Profil/Para çekmece + `#bolumcubugu` üzerinden; Ayarlar dört bölüm), `tools/entegre.js:957` (`[data-ayar="web"]` → `"yapayzeka"`); `HKM/tests/test_yuz.py`'ye iki YENİ test (`t_cekmeceler`, `t_jetonlar_ortak`), var olan testlere dokunulmadı.
  - ✅ **ÇÖZÜLDÜ (K, V5-4):** `test_ritim.run_kurtarma` `cli.main(["geri", …])` ile süreç dilimini İstanbul'a kurup geri koymuyordu; `test_kanal` günü içe aktarmada UTC'den okuyordu. Kaynak kapandı, `test_kanal` günü koşumda `saat.bugun()` ile sabitler, `tests/run.py` her modülden sonra **dilim sızıntısı muhafızı** koşar (sızan modül adıyla kırmızı). Tam koşum 644/644. Eski kayıt: **H'ye / HKM oturumuna bulgu (2):** `HKM/tests/test_kanal.py:50` «kanal yalnız okur; King'in önerisi brifingten gelir» tam koşumda (`python3 -m tests.run`) kırmızı, aynı adımlar tek başına koşunca yeşil (öneri doğuyor) → sıra bağımlı; başka bir testten sızan ortak durum olabilir, göremedim. Temiz main'de de kırmızı.
- **Şu an:** K2 · AYS (teslim b3c1733; AYS `screens/*.js` artık K'nin). ✅ Bugün 004 042 024 (bu
  725fdf8). ✅ T2-09 T2-10 T2-11 (96037ce). Sıradaki: Bugün 060 (110 `oneri.js`
  bağlanınca) → Çalışma (46 55 35) → Analiz (27 37 41) → Ofis (129 139 + T2-02/137) → Onaylar/Plan
  (111 112 121) → 22 (onay etiketleri). Her ekrandan sonra envanter + sadelik + 15 denetim.
- **K2 AYS Bugün (725fdf8):** 004 sayfa başı cümlesi `R.Screens.today.cumle(gun, iso)` → `lede()`
  (`<span class="bugun-cumle" data-oz="004">`; kural koddan, model kapalıyken aynı) · 042 sıradaki blok
  `.kahraman[data-oz="042"]` Şimdi alanının ilk kartı, başlığı ekrandaki her kart başlığından büyük
  (18 > 15 px), alanın tek dolu düğmesi onda; 390 px'te ilk ekranda (ölçüldü: alt kenar 682 / 780) ·
  024 Özet'in dört sayısı `SAYI.html` (kesinlik + formül + girdiler; sınav tarihi plan varsayılanıysa
  kalan gün **tahmin**, kullanıcı yazdıysa **hesaplandı**), kutu yuvasında en zayıf glif. Test
  `AYS/src/tests/k2bugun.test.js` (5). AYS 1916/1916, duman, a11y, 390 px, palet, perf temiz;
  envanter kayıp 0; sadelik AYS bütçede.
  - **Kullanıcıya karar (042'nin ikinci yarısı):** katalog «adımlar süreyle orantılı çubukta» diyor;
    AYS'de bir bloğun adımları (ısınma · ana set · yanlış notu) HİÇBİR kuralda tanımlı değil — v4
    görselindeki adımlar örnek veri. Uydurmadım. Kural yazılırsa (ör. «ana ders = 10 dk ısınma + ana
    set + 5 dk yanlış notu») çubuk `GRAFIK.yukHtml` ile tek satır.
  - **H'ye (T2-11'in kullanımı, T devrinde app.js senin):** bir modül bildirimi bağladığında
    `window.addEventListener('lifeos:bildirim', …)` ÖNCE, `LIFEOS.Pwa.bildirimDinle()` SONRA; olayda
    `kapaliyken:true` varsa sessizce uygulanmaz, `LIFEOS.Pwa.bildirimSorusu(detay)` ile sorulur.
  - **H'ye (layoutcheck, senin aracın):** «042 kahraman 390×780'de ilk ekranda» ölçüsü şimdilik
    karalamada; istersen `.kahraman[data-oz="042"]` alt kenarı ≤ görünür yükseklik kuralı.
- **Sahiplendiğim çekirdek dosyalar:** — (üç `ui.js` bırakıldı: `toast` 150 çizgisi ve
  `confirmSheet(…, danger, onay)` 22 etiketi eklendi, 2d765cc)
- **Biten** (özellik · commit): 024 025 026 028 sayı `sayi.js` · 009cf92; 027 035 037 041 grafik
  `grafik.js` · 076bb29; 110 111 112 114 116 121 150 022 öneri ve onay `oneri.js`, 016 139 sözlük
  `sozluk.js`, 018 şüpheli giriş (`sayi.js`) · 2d765cc; 173 177 179 güven `guven.js` +
  bozuk tarih (31 Şubat) koruması `sayi.js`/`grafik.js` · 0443561; P2: 015 170 son bilinen değer,
  sesli okuma (`sayi.js`) · 138bf20; 029 030 031 033 034 038 039 grafik ekleri
  (`grafik.js`) · 464a54c; 113 123 124 127 öneri ekleri (`oneri.js`) · 6a7fd82; P3: 032 036 040
  geçen dönem, dağılım, birikim (`grafik.js`) · 9bb2be7; T yokken: 137 veri adları tablosu (`sozluk.js`),
  164 bildirim kartı (`pwa.js`, `sw.js`) · c0b9d6c
- **Bulgular:** T2-09 ✅ 96037ce · T2-10 ✅ 96037ce · T2-11 ✅ 96037ce (önce kırmızı test; H doğrulasın, HATALAR satırları senin) · T2-01 ✅ a798671 · T2-03 ✅ c063316 · (K'nin bulduğu, H kapattı: T2-04, T2-05,
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
- **Yarım / sıradaki:** K2 AYS Bugün 060 → Çalışma (46 55 35)
- **Soru / öneri:**
  - **T'nin devrini alan H için (kullanıcı T'nin yarım işini H'ye verdi):** AYS `index.html`'e
    `js/core/grafik.js`, `oneri.js`, `sozluk.js`, `guven.js` bağlantısı (`sayi.js`'ten sonra; SPİ/ESP'de de).
    Bağlanana kadar yalnız `sayi.js` isteyen yerleştirmeleri yapıyorum. `AYS/src/js/app.js:842`
    `confirmSheet` etiketi (22) T dosyası → artık sende. T2-12 (rutbe.js) de T devrinde.
  - Kullanıcıya (K5): 167 ana ekran bileşeni — telefonda tarayıcı uygulaması için yol doğrulanamadı
    (Android/iOS'ta PWA bileşeni yok); uydurulmadı. En yakını simge rozeti (Badge API) — karar kullanıcıda.
  - K2 hazırlığı (22): 36 `confirmSheet` çağrısı çıkarıldı; çoğu tek kayıt → «Denemeyi ve 7 hata kaydını
    sil» biçimi. Biri T'nin dosyasında: `AYS/src/js/app.js:842` — T'ye.
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
  - `oneri.js` yüklenmeden 150'nin süre çizgisi görünmez (`ui.js` onu arar, yoksa eskisi gibi kalır).

## TASARIM (T)

- **Şu an:** T döndü (K'nin devri, T-DEVIR §6). ✅ ESP Onaylar + Kütüphanem 6c92411 · ✅ **T3 ESP 2204fa3 → teslim** (tabloda). ✅ AYS küçükleri (§2.C): 011 sakin hata + 010 boş durum işareti + 022 plan onay etiketi d83d085 · STIL.md 334f4db · ✅ **T4 hareket** 852f6fd · ✅ **T5a ayarlar** e0b2385 · ✅ **T5b** 7eddd14. **T1–T5 bitti; T'nin işi bitti.** Kullanıcı kararı (EKIP-PLANI §8-9…12): HKM yüzü K'de (K7), kartların ekranlara yerleşmesi sonraki işe kaldı, T'nin iki sorusunu K karara bağlar.
- **K yürütüyor (kullanıcı talimatı, 2026-09-24 akşam):** T-DEVIR §5'ten devam. ✅ T2-13 designcheck d58720d · ✅ entegre.js koştu (temiz) · ✅ yarım T3 SPİ yaması 826fbe3 · ✅ **T3 SPİ → teslim 59e7276** (sekme 0, tek dolu düğme, 30+ kelime katmanda, T2-14) · ✅ **T2 ESP ccedf0a** (kabuk + sekiz çekmece; disiplin bölüm düzeyinde). Sıradaki: ESP Onaylar + Kütüphanem → T3 ESP (sekmeler, Bugün üç alan, Ofis dolu düğme) → teslim → AYS küçükleri (§2.C) → T4 → T5; T6 yalnız kullanıcı «başla» derse. **⏸ K'nin limiti doldu → T'ye döndü: `ekip/T-DEVIR.md` §6** (kalan: ESP Onaylar + Kütüphanem → T3 ESP → AYS küçükleri → T4 → T5).
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
- **T3 ESP (2204fa3):** ekran içi sekme 0 — Dil, Felsefe, Tarih, Okuma, Yazı, Stüdyo, Basamak,
  Analiz, Rehber bölümleri alt alta (`ESP.Parts.bolumler` → `C.SayfaBolumleri`; eski `*-tab` eylemi
  bölüm çubuğunda kalır, `S.ui.<x>Tab` isteği bir kez `bolumeGit`'e gider: `ESP.Parts.bolumIstegi`).
  Tezgâh bölümün sonunda kendi bölümüdür; yedi iç sekmesi açılır satır oldu (gerçek düğme +
  `aria-expanded`; kapalı gövde `hidden` ama yerinde — envanter alanı kaybolmaz). Danışma'nın ajan
  sekmeleri çip grubu (`aria-pressed`). Bugün üç alan: Şimdi (sıradaki iş, hızlı kayıt, günün
  sorusu) · Durum (oturumlar, plan; «Oturum gir ve bütün satırlar» → **Bugün › Ayrıntı**,
  `ESP.Screens.gun`, aynı işleyiciler) · sağda Özet + tek Öneri kartı. Ekran başına en çok bir dolu
  düğme (King'e ilet, pratik, yedek, ikinci «Ekle»ler sade). 30+ kelimelik açıklamalar `C.Ayrinti`
  (HKM işareti notu AYS/SPİ ile aynı kalıp: ilk ve son cümle görünür). Okuma'da `↔` yazı karakteri
  yerine çizgi simge (`bag`). Denetim: runtests ESP 1555/1555; duman, a11y, 390 px, palet, perf,
  dist, ortak, seviye temiz; envanter ESP kayıp 0 (6 eylem görünürden gizliye: kapalı tezgâh
  satırları); `sadelik --denetle ESP` bütçede (18 ekran).
- **H için (T3 ESP):** `ESP/src/tests/ekran.test.js` tatil sınırı testi senin AYS kalıbınla (d7072ac)
  güncellendi: alan Bugün + `ESP.Screens.gun` çiziminde aranıyor (Seri satırı Ayrıntı'ya geçti).
  Test senin; istersen kendi diline çevir. Yeni: `ESP/src/tests/bolumler.test.js` (sekme yok,
  bölüm adları, tezgâh açılır satırları).
- **§2.C (d83d085 + bu commit):** `C.SakinHata` üç modülde (011: kırmızı yok, ilk cümle «Verin
  yerinde; hiçbir kayıt silinmedi.», tek düğme, teknik ileti «Teknik ayrıntı» altında) — ekran,
  kabuk ve açılış hatası bunu kullanır. `C.Empty` `data-oz="010"`; **hata düzeldi:** motifi olmayan
  bölümde (yeni çekmeceler) boş durum çizimsizdi, artık ikon düşer. AYS `auto-replan` onayı «Kalan
  N haftayı yeniden diz» (022). Test `durum.test.js` (üç modül). STIL.md: AYS ve SPİ'de Renk,
  Tipografi, Ölçü v4 jetonlarından yeniden yazıldı; Hareket süreleri düzeldi (tam metin T4'te);
  AYS Ekranlar ve SPİ Gezinme/Görünüm/Düzenler çekmecelere ve tek tasarıma çekildi. **Göremedim:**
  SPİ STIL.md'nin «Düzen — bir sağlık defteri», «Bölüm kimlikleri», «Filigran numara» bölümleri
  serif ve eski düzene değiniyor olabilir; T5'te okunacak.
- **T4 hareket (852f6fd):** `brand/ortak/hareket.{js,css,test.js}` → üç arayüz. Uygulama her eylemde
  #app'i baştan çizdiği için hareket CSS'e bırakılmadı: çizimden önce/sonra fotoğraf, yalnız DEĞİŞEN öğe
  hareket eder. 12 tek canlı öğe (sakin olmayan `C.NextUp`; ikincisi `.h-sakin`) · 14 odak kapısı (AYS odak
  modu sis katmanı + `data-oz="014"`; ESP kart tekrarı `data-h-odak`, Esc «Oturumu bitir») · 149 sayı
  (`C.Stat`, `C.Meter`, üst çubuk sayaçları) · 152 tik (`C.Checkbox`) · 153 kart → ekran görünüm geçişi
  (AYS'de de artık yönlendirme geçişi var) · 154 küçülen başlık (≤ 1039 px) · 156 odak halkası akışı · 158
  satır kapanma · 159 önizleme (`.linkbtn`/`a`/`[data-h-onizle]` + `data-route`). **Düzelen iki hata:**
  `.content` ve üst çubuğun renk çizgisi her yeniden çizimde, yani her tıklamada, baştan oynuyordu; artık
  yalnız yeni ekranda / ilk açılışta. Denetim: runtests AYS 1936 · SPİ 1584 · ESP 1569; duman, a11y, 390 px,
  palet, perf, SPİ designcheck, dist, ortak temiz; sadelik üçü bütçede; envanter temiz; tarayıcıda: aynı
  ekranda yeniden çizim içerik animasyonu üretmiyor, yeni ekranda üretiyor; ESP tekrarında üst çubuk .28
  sis, kart 1; Esc oturumu bitiriyor.
- **T5a ayarlar (e0b2385):** `brand/ortak/ayar.{js,css,test.js}` → üç arayüz. 21 kaydedilmemiş değişiklik
  (Ayarlar çekmecesinde; «Kaydet»li kutudaki alan noktalanır, şerit «N değişiklik kaydedilmedi · Vazgeç ·
  Kaydet»; yeniden çizimde/ekrandan dönüşte yazılan kaybolmaz; kaydettikten sonra eski değer geri konmaz) ·
  182 varsayılana dön (`data-varsayilan`: HKM aralığı 60 dk ve kapsam Özet — `Beacon.varsayilan()` yeni,
  üç modülde; SPİ tema seçimi Sistem) · 183 ayar arama (sayfa başında, dizin ayar ekranlarının kendi
  çiziminden, sonuç tam yolla ve alana kayar) · 181 `C.TemaSecici` (üç örnek kendi renginde; görünüm
  paneli üç modülde, AYS Genel ve ESP Profil'de; SPİ Profil'deki seçim kutusu envanter alanı olduğu için
  kaldı, varsayılanı eklendi). **Düzelen hata:** tema seçilince ekran yeniden çizilmiyordu — ESP Ayarlar ›
  Profil'de seçili kart eskisinde kalıyordu; üç modülün `set-theme`'i artık çiziyor. **Göremedim:** 183'ün
  «modüllere göre gruplu» sonucu yalnız o modülün ayarlarını bulur; öteki iki modülün ayarları ayrı
  sayfada, dizin kurulamıyor. Denetim: runtests AYS 1943 · SPİ 1591 · ESP 1576; duman, a11y, 390 px,
  palet, perf, SPİ designcheck, dist, ortak temiz; sadelik üçü bütçede; envanter temiz; tarayıcıda arama
  (üç modül), şerit + yeniden çizim + Vazgeç, varsayılana dön (60 dk), tema seçimi ve geri dönüş denendi.
  **K'nin dosyalarına dokundum:** AYS `guide.js` (tema seçici, iki alana `data-varsayilan`), SPİ
  `guide.js` ve `family.js` (`data-varsayilan`), ESP `profile.js` (tema seçici, `data-varsayilan`).
- **T5b (7eddd14):** 171 kurulum — `LIFEOS.KURULUM_HTML/KURULUM_GIT` (tanitim.js): SPİ ve ESP ilk
  kurulumu üç adım, adımlar tanıtımın soruları (Ne ölçüyoruz? · Neye karar vermiyoruz? · Nasıl
  başlıyoruz?), ilerleme üstte, «Başla» yalnız son adımda, adım değişimi yeniden çizmez (yazılan kalır);
  AYS'de ilerleme çubuğu üste alındı (beş adım kaldı, aşağıdaki soru). 176 gizlilik kilidi —
  `brand/ortak/kilit.*`: Ayarlar'da kur/değiştir/kaldır (iki kez yazılır), açılışta çizimden ÖNCE dört
  haneli kod (modül işaretiyle), üç yanlışta 5 sn bekleme, kod tuzlu SHA-256 özetiyle tutulur, «Kodu
  unuttum» bir dakika sonra kilidi kaldırır; metin «veriyi şifrelemez» der. 17 Ne değişti? —
  `brand/ortak/yenilik.*`: yalnız başka bir sürüm görülmüşse ve kurulum bitmişse sayfanın başında tek kart
  (Yeni · Düzeltilen · Kaldırılan), «Kapat» deyince bir daha yok. Denetim: runtests AYS 1950 · SPİ 1598 ·
  ESP 1583; duman, a11y, 390 px, palet, perf, SPİ designcheck, dist, ortak, seviye temiz; sadelik üçü
  bütçede; envanter temiz; tarayıcıda SPİ kurulum üç adım + kayıt, «Ne değişti?» göster/kapat, kilit
  kur → yeniden aç → perde (arkada #main yok) → kodla açıl (SPİ, AYS, ESP) denendi.
  **K'nin dosyalarına dokundum:** AYS `guide.js`, SPİ `family.js`, ESP `profile.js` (kilit kutusu).
- **Meydan (fikir, sisteme bağlı DEĞİL — kullanıcı kararı 2026-09-24):** `ekip/meydan/MEYDAN.md` (tasarım ve
  mantık) + `ekip/meydan/meydan.html` (etkileşimli örnek, örnek veri). Dört sistem için tek bileşen: kapsam
  Hepsi · AYS · SPİ · ESP · Merkez, sadelik Sade · Dengeli · Tam. Hiçbir modül yüklemez; aşamalar M1–M4
  belgede, başlatmak kullanıcı kararı.
- **K'ye devir (kullanıcı kararı, 2026-09-24):**
  1. **K7 — HKM yüzü** (eski T6): `HKM/web/` aynı dile geçer. Kullanılacaklar hazır: jetonlar
     `brand/ortak/jeton.css` (renk sahipliği: Merkez = mor `--mer`), kabuk kalıbı `brand/ortak/kabuk.*`,
     sakin hata `C.SakinHata` (011), boş durum (010), hareket `brand/ortak/hareket.*` (`data-h-*`
     sözleşmesi, STIL.md «Hareket»), ayarlar `brand/ortak/ayar.*`, tema seçici `C.TemaSecici`, kilit
     `brand/ortak/kilit.*`, «Ne değişti?» `brand/ortak/yenilik.*`. HKM yalnız Python standart kütüphanesi
     + kendi web dosyaları: ortak dosyalar oraya `tools/ortak.py` ile yayılmıyor; nasıl taşınacağına K
     karar verir. HKM'de başka bir oturum çalışıyorsa önce çakışmayı denetle (§5).
  2. **Ertelendi:** K2–K4 ve K6 (kartların ekranlara yerleşmesi) — sonraki iş.
  3. **K karar verir (T sordu, kullanıcı K'ye bıraktı):** (a) AYS kurulumu beş adım mı kalsın, üçe mi
     insin (171; `AYS/src/js/core/setup.js`, H'nin `setup.test.js`'i ve `planner.test.js` «kurulum beş
     adım» beşi bekliyor) · (b) kilitte «Kodu unuttum» süresi (176; `brand/ortak/kilit.js` `UNUTTUM_SN`,
     bugün 60 sn, sonra kilit kalkar — «unutan kilitli kalır» veri kaybı demek).
- **Kullanıcıya soru (T5b) — K'ye bırakıldı:** (a) Katalog 171 «ilk açılış üç adım» diyor; AYS kurulumu beş veri adımı (kim,
  hedef, takvim, kapasite, seviye — H'nin testi beşi bekliyor). Üçe birleştireyim mi, yoksa AYS beş
  kalsın mı? (b) Kilitte kodu unutan bir dakika bekleyip açabiliyor (veriden kilitlenip kalmasın diye);
  daha sıkı bir kilit istenirse bekleme uzatılabilir — ama «unutan kilitli kalır» seçeneği veri kaybı
  demek, önermem.
- **K için (T4 sözleşmesi, ekranlar senin):** hareket istersen yalnız işaretle — satır listesi
  `data-h-satir="<kimlik>"` (silinen satır yerinde kapanır), bitirilen iş `data-h="<kimlik>"
  data-h-bitti="0|1"` (tik çizilir), değişen büyük sayı `data-h-sayi="<anahtar>"`, süren iş
  `data-h-odak` + çıkış düğmesinde `data-h-odak-cik`. **Senin dosyana dokundum:** `ESP/src/js/screens/
  lang.js` kart tekrarında iki öznitelik (`data-h-odak` sarmalayıcı, «Oturumu bitir»e `data-h-odak-cik`)
  — 14'ün ESP yeri orasıydı; başka satır değişmedi.
- **K için (010):** Onaylar ve Kütüphanem'in boş durumu `C.Kutu` + tek düğme; `C.Empty({ text,
  action })`'ı Kutu'nun gövdesine koyarsan 010 işareti ve çizim kendiliğinden gelir (ekranlar
  senin). 022'nin kalan «varsayılan Evet, devam et» çağrıları (sadelik ölçümü) ekran dosyalarında.
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

- **Meydan → HKM (kullanıcı kararı 2026-09-25: «bu sistemi HKM'ye ekler misin», «HKM'nin içinde olacak»; 2026-09-24'teki «şimdi entegre etme» kararının yerine):** `HKM/core/meydan.py` (olay → gönderi, kapalı tür kataloğu, Meydan'ın KENDİ tekrar destesi; modüle yazmaz), `/api/meydan*` uçları, `HKM/web/meydan.html` (tek dosya, `/meydan`). **K'ye (yüz senin, önce buraya yazıyorum):** `HKM/web/index.html`'e YALNIZ ayrık ekler: bölüm çubuğunda yeni `data-cekmece="bugun"` grubu (Bugün · Meydan), yeni `data-bolme="meydan"` bölmesi (içinde `/meydan?gomulu=1` çerçevesi), `GORUNUMLER` / `CEKMECE` / `yukle` birer satır. Çekmece sayısı yedi kalır, `t_cekmeceler` değişmez. Başka satırına dokunmuyorum; çakışırsa senin satırın kazanır, ben yeniden eklerim. `brand/ortak/kart.css` ve modül kartlarına dokunulmadı.
- **Şu an:** ⏸ H'nin limiti doldu; H işini de K yürütüyor (kullanıcı talimatı). T2-12 ✅ 5a5c024 · T2-13 ✅ d58720d · T2-14 ✅ 59e7276 (bulan K) · T2-09/10/11 ✅ 96037ce (K; H doğrulaması yok). SPİ teslim kapısı K tarafından H'nin listesiyle koşuldu (59e7276). Eski satır: ⚠ **main CI kırmızı — T2-12 → T:** T3 AYS üretilmiş kopya `AYS/src/js/screens/rutbe.js`'i elle değiştirdi, `seviye.py --denetle` kırmızı (koşu 230'dan beri). H4 tam koşum bunun dışında yeşil (AYS/SPİ/ESP her araç, HKM 640, yüz, entegre); `--yaz` bu yüzden belgeleri güncellemedi. K'nin ricaları: (a) ✅ ec55ed7 · (b) ✅ df4017e (T2-09, T2-10, T2-11) · (c) ✅ SPİ/ESP taraması temiz, H4 koşuldu.
- **Biten:** H0 taban envanteri · 1600f75 — `node tools/envanter.js` her push'ta CI'da koşar
- **Biten:** H0b tıklama taraması ilk tam koşum (T3'ten önceki kod): AYS 652 · SPİ 501 · ESP 678 düğmeye basıldı, **gerçek sorun 0**. AYS'de görülen 3 «Unexpected token '<<'» H'nin kendi rebase'inin çalışma alanında bıraktığı çakışma işaretinden (build.js) geldi; aynı ekran temiz ağaçta yeniden tarandı: 70 basış, 0 sorun. Ders: uzun koşumlar ayrı `git worktree`'de (plan §7 zaten böyle diyor).
- **Biten:** H1 sadelik denetimi (`tools/sadelik.js`, plan §1.2 bütçesi) — CI'da envanterle aynı gezintiden; teslim tablosunda ✅ olan modülde kırmızı olur, diğerlerinde yalnız ölçer
- **Denetlenen push'lar:** T1 23e3a7c ✅ · T1 9b12bef ⚠ → T2-06 ✅ 4656788 (üç modülde runtests, duman, a11y, 390 px, palet, dist, ortak/seviye temiz) · K 009cf92 kod okundu → T2-01 · K 076bb29 + 0780206: dist ve ortak kopyalar temiz, kod okundu → T2-03 · K 2d765cc (öneri, onay, sözlük) ve 0443561 (güven): üç modül runtests yeşil, kod okundu (sormadanMi, seviye kalıbı, silme kapısı, kayıt geçmişi doktrine uygun) — K2'de `silme-onay` işleyicisi `silmeDurumu`nu YENİDEN sınamalı, düğmenin disabled olması yetmez
- **T ve K için:** taşıdığın ekrandan sonra `node tools/envanter.js <MODÜL>` koş (~1 dk). «KAYIP» çıkarsa ya geri koy ya da kullanıcı onayıyla `ekip/envanter/kaldirilan.json`'a yaz. Envanter ekran ölçülerini de verir (sadelik bütçesi, H1)
- **H: §8-4 testleri hazır** (T'nin isteği): AYS `planner.test.js` palet testleri → «Görünüm — tek tasarım» (tema profilden uygulanır; eski profildeki palet/düzen değeri bozmaz); SPİ `ui.test.js` «seçilen düzen köke yazılır» kalktı, görünüm listesi testi yalnız `pref-theme`'e bakıyor; SPİ `data.test.js` değişmedi (SP.DESIGNS tek girdiyle geçer). Üç `palettecheck.js` palet ve düzeni artık uygulamanın CSS'inden okuyor (bugün 7 palet + 4 düzen, kaldırınca kendiliğinden tek palet); SPİ `designcheck.js` zaten SP.DESIGNS'tan okuyor. Envanter: `set-palette`, `set-design` (üçü), AYS işleyicileri ve SPİ `pref-palette`/`pref-design` alanları `kaldirilan.json`'da (§8-4 gerekçesiyle). **Dikkat:** `open-palette` KOMUT paletidir (⌘K), kalmalı. Silinen `data/palettes.js`/`designs.js` dosyalarının `tests/index.html` bağlantılarını kaldırma commit'inde sen çıkar (dosya yoksa test sayfası 404 verir).
- **T2-06 kapandı:** T 4656788, H doğruladı (yeni «pencere kenarına yapışık» denetimiyle de SPİ 390 px temiz).
- **T'ye cevap (tablo sayımı):** düzeltildi (bu commit) — tablo artık «tek parça yazı» sayılmıyor. dd97f56 üzerinde AYS: envanter kayıp 0, sadelik `--denetle AYS` **bütçede (22 ekran)**. AYS'yi teslim tablosuna yazabilirsin; teslimden sonra CI'da AYS sadeliği zorunlu olur.
- **H: T3 testleri hazır** (T'nin isteği): `ux.test.js` «sekme şeridi olan ekranda tam bir sekme seçilidir» — bütün ekranları tarar, şeridi olmayan ekran sözün dışında («sekme yok»u sadelik.js ölçer); `ekran.test.js` tatil sınırı alanını Bugün + (varsa) `R.Screens.gun` çiziminde arar. İkisi de T3'ten önce yeşil (AYS 1876/1876), T3'ten sonra da geçecek biçimde.
- **K'ye cevap (T yokken ortak çalışma, a):** doktrin ölçümü sadelik çıktısında «ölçüm» satırı olarak var, kırmızı yapmaz: (1) Merkez dışında mor — ekranda, Merkez kabı `.okart--merkez, .cakisma__cozum, [data-kaynak="merkez"], .capraz, .modis--mer, [data-merkez]` dışında jeton moru taşıyan görünen öğe (bugün 0; yeni Merkez öğesine `data-merkez` koyarsan sayılmaz); (2) ekranda ve açık pencerede «Evet/Tamam/Evet, …» düğmesi (bugün 0 — pencereler gezintide açılmıyor); (3) KAYNAKTA varsayılan etiketli `confirmSheet` (beşinci argüman yok): **AYS 20 · SPİ 7 · ESP 9 = 36**, senin sayınla aynı, dosya:satır listeli. Üçü sıfıra inince zorunlu yaparım.
- **K'ye cevap (b):** 138bf20, 464a54c, 6a7fd82, 9bb2be7 ve c0b9d6c okundu; üç bulgu → K: **T2-09** hız tahmini (039) hedefe ulaşılmamışken geçmiş tarih veriyor · **T2-10** `hucreHtml` (038) kesinliği verilmemiş sayıyı «hesaplandı» sayıyor · **T2-11** bildirim kartı (164) uygulama kapalıyken basılan eylemi düşürüyor. Ayrıntı ve tekrar girdileri HATALAR Tur 2'de. 138bf20 (015, 170) ve 6a7fd82 (113 123 124 127) temiz.
- **K'ye cevap:** perde bulgun T2-04 olarak düzeltildi; `audit.test.js` T2-05; yayımın elle yazılmış dosyayı ezmesi T2-07 (ortak.py ve seviye.py artık reddeder); planner testi T2-08. `TAHLIL_ESKI_GUN` önerisi: bırakıyorum — senin testin iki sayıyı yan yana tutuyor; audit.js'in sayi.js'e yükleme sırası bağımlılığı kazanması daha kırılgan.
- **Bulgu özeti** (`T2-NN → sahip · durum`, ayrıntı `ekip/HATALAR.md` Tur 2): açık: T2-02 → K/137 (AYS Ofis'te ham veri kimlikleri). Kapandı: T2-01 ✅ K a798671 · T2-03 ✅ K c063316 (ikisini de H yeniden çalıştırıp doğruladı) · T2-04 ✅ H b32fe7f · T2-05 ✅ H b32fe7f
- **Son tam koşum:** —
- **Katalog kapsamı** (envanter çıktısı): 0 / 183
- **Yarım / sıradaki:** H0b tıklama taraması → bulguları düzelt → T1 9b12bef denetimi
