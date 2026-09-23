# Talimat raporu — sıradaki Claude için

> Son güncelleme: 2026-09-23 · bu oturum (`claude/epic-keller-uz103z-y09gx6`; önceki
> oturum `claude/epic-keller-uz103z`, Y7'nin ortasında sınırda kaldı — o iş push
> edilmemişti, bu oturumda baştan kuruldu).
> Bu dosya her Part bitince güncellenir. Yarıda kalan oturum buradan devam eder.

## 0. Önce oku

1. `AGENTS.md` — doktrin. Kısaca: sayıyı ve kararı KOD verir, model yalnız
   cümle kurar; eksik veri sıfır değildir (ölçüldü / tahmin / hesaplandı /
   veri yok); sıfır bağımlılık; HKM hiçbir modüle yazmaz, teklif bırakır;
   aksiyonların üç seviyesi (küçük / orta / büyük); ekrandaki metin düzgün Türkçe.
2. Bu dosyanın §2 yol haritası — sıradaki iş orada «sıradaki» diye işaretli.
3. `ekip/PLAN.md` — büyük plan; §4 turlar, §7 kullanıcı kararları.

## 1. Kullanıcının kuralları

- Türkçe konuşur, sesle yazar: kelimeler bozuk gelebilir, anlamı çıkar.
- **Yavaş yavaş, sindire sindire.** Her şeyi aynı anda açma; bir Part'ı bitir,
  test et, commit + push et, bu dosyayı güncelle, sonra sıradakine geç.
- **Gereksiz test yapma:** yalnız dokunduğun sistemin birim testleri, gerekiyorsa
  bir duman testi. Tam koşum (`tools/sayilar.py --tam`) yalnız büyük bir Part'ın sonunda.
- **Kendi fikrini geliştirmeden önce söyle.** Aşağıdaki 29 madde ONAYLANDI;
  listede olmayan yeni bir KOL (yeni özellik alanı) önce kullanıcıya sorulur.
- **Hata ve eksikte kendini kısıtlama (2026-09-23):** sistemin herhangi bir yerinde
  bir hata ya da atlanmış bir eksik görürsen düzelt — önceki model atlamış olabilir,
  analiz edip tamamla. Doktrin (AGENTS.md) ve test kuralı yine geçerli: önce hatayı
  yakalayan test, sonra düzeltme; commit mesajında ve bu dosyada ne olduğunu yaz.
- **Lokal ağa karışma.** Ağdan erişilen paylaşım, tünel, port açma yok.
- Şirket / YouTube ofisi başka bir Claude'un işi; dokunma.
- PR açma (istenmedi). **`main`'e birleştirmek serbest** (kullanıcı onayı): yalnız
  ileri sarma, asla zorla yazma.
- Token bitmeye yaklaşınca: bu dosyayı güncelle, kullanıcıya gönder, sorulacakları sor.

## 2. Dal düzeni

- Geliştirme dalı: oturumun verdiği dal (bu oturum `claude/epic-keller-uz103z-y09gx6`)
  → `git push -u origin <dal>`. Kullanıcı: «commit edeceğin yer main olsun».
- `main` bu dalın atası; her Part (ve her madde) sonunda `git push origin HEAD:main`
  (yalnız ileri sarma, asla zorla yazma). Eski dalları ayrıca ilerletmek gerekmez.
- **Push edilmemiş iş kaybolur** (konteyner geçicidir): her madde bitince push et.
- Commit sonu: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` ve
  `Claude-Session: <oturum bağlantısı>` satırları.

## 3. Yol haritası — onaylı 29 madde

Numaralar kullanıcıya verilen listenin numaralarıdır (1. kısım 1–18, 2. kısım Y1–Y11).
Durum: ✅ bitti · 🔜 sıradaki · ⏳ bekliyor · ❓ kullanıcı cevabı gerekiyor.

### Part 1 — Toparlama
- ✅ 3 Dallar toplandı; `main` ileri sarıldı (62cfd55).
- ✅ 12 Hedef sohbeti: soru beklerken okunamayan cevap; yeni hedef cümlesiyse
  yarım hedef bırakılır, soru / uzun cümle / modülün kendi komutu (`baskaIs`
  kancası) cevap sanılmaz. `brand/ortak/hedef.js`, testleri `hedef.test.js`.
- ✅ 2 Başlık, sekme, açılış işareti ve telefon kısayolu simgesi: modülün kimlik
  logosu (`brand/medya/kimlik/`) 192 px kareye yerleştirildi, dosya adı aynı
  (`<SYS>/src/img/brand/favicon.png`, `HKM/brand/favicon.png`). Eski altın monogramlar
  git geçmişinde; LifeOS «LF» logosu (`brand/life/`) giriş sayfasında kaldı.
- ✅ 1 Tek dosya görselsiz açılınca (ZIP'ten indirilmiş dist, `file://`) oturumda
  bir kez nasıl düzeleceği söylenir: `brand/ortak/gorsel.js`. 81 MB'lık rütbe
  medyası gömülmez; kalıcı çözüm Y4 (PWA).

### Part 2 — Hedef ağı
- ✅ 8 Modüller etkin hedef + plan özetini HKM'ye eşitler: `brand/ortak/hedefag.js`
  (istemci), `HKM/core/hedefag.py`, `POST /api/hedef/sync/<modül>`. Kayıtta 600 ms
  gecikmeli gönderim, açılışta bir kez. AYS ve ESP planları artık King'e görünür.
- ✅ 6 Zaman bütçesi: `POST /api/zaman` (günlük dk, haftada gün); karar ve cümle
  HKM kodu; modüllerin Hedeflerim kartında «Zaman bütçesi (King)» satırı.
- ✅ Y8 HKM web › Hedefler sekmesi: bütçe, günlük vakit formu, üç modülün hedefleri.
  Zincir testi `tools/entegre.js` §2.9 ve §4.5.

### Part 3 — Uyarlama ve değerlendirme
- ✅ 7 Uyarlama döngüsü: `brand/ortak/hedef.js` `uyarla` (hedef bugünün ölçümüyle
  yeniden değerlendirilir) ve `uyarlamaUygula` (seçilen tarih/vakit hedefe yazılır,
  eski değer `uyarlamalar` geçmişinde). Üç modülde plan «geride»yken Hedeflerim'de
  «Yeniden hesapla»; seçimde eski plan geri alınır, yeni plan önizleme + onayla.
  Motorda `haftalikEk` kancası: AYS'de deneme günü haftalık sabit yük, konu süresine
  2 × 30 dk tekrar eklendi — karar ile plan artık aynı tarihi söylüyor.
- ✅ 13 Değerlendirme seti: `<SYS>/src/tests/degerlendirme.test.js` (AYS 13, SPİ 13,
  ESP 12 cümle; tehlikeli hedeflerin hepsi «güvensiz»).

### Part 4 — Güvence ve teslim
- ✅ 15 Otomatik yedek: HKM açıkken üç modül her gün HKM'ye yedeklenir (`HKM/core/yedek.py`,
  `brand/ortak/yedekag.js`; geri okuyarak doğrular, 14 gün + 6 ay sonu saklar).
- ✅ Y6 Haftalık rapor PDF olarak Telegram'a (`weekly.belge`, «hesaplandı» etiketi; HKM ›
  Sistemler'de PDF indir + kanala gönder).
- ✅ Y7 Akşam yoklaması: `schedule.checkin` sorar; cevap `dil.rapor` ile modüllere
  bölünür, her parça `kayit.add` teklifi olur; modül kendi ayrıştırıcısıyla okur,
  «… şöyle okudu» gösterir, «Kaydet» ile kendi koduyla yazar (HKM/MIMARI.md §8.25).
  Yan düzeltmeler: geçmiş kip plan isteği sanılmıyor, SPİ «7 saat uyudum» = uyku,
  `/api/chat` tarihsiz gövdede düşmüyor, `dil.olumsuz` «çalışmadım»ı görüyor.
- ✅ 5 / W6 Modüller ürün ister ve `urun.add` alır (`brand/ortak/urun.js`: ön süzgeç,
  kendi denetimi, kendi deposu, Ofis › BAM ürünleri, sandbox iframe; HKM
  `POST /api/king/urun`). HKM Ofis: PDF/HTML/SVG indirme, ajan izi, depo denetimi;
  Ayarlar › Web. Dosya adları ASCII (Chromium Türkçe adı «download» yapıyordu).
  HKM/MIMARI.md §8.26.

### Part 5 — Yeni kollar I
- ✅ Y2 Alışkanlık kolu: `brand/ortak/aliskanlik.js` (üç modülde: ESP disiplinleri,
  SPİ hareket, AYS ders çalışma). Taban kendi kaydından, karar «tahmin», kayıt yoksa
  karar yok; Hedeflerim'de «Bu hafta 3/5 gün» ilerlemesi; motorda `karar` kancası ve
  vaktin birleşmesi (genel + paket).
- ✅ Y3 Takvim (AYS): Rehber › İstisnalar'da .ics içe alma (önizleme, tür yalnız
  önerilir, geçmiş / 60 günden uzun / kayıtlı alınmaz, yalnız seçilen yazılır) ve
  dışa aktarma (istisnalar, TYT/AYT günü, hedef son günleri). `AYS/src/js/core/takvim.js`.
- ✅ Y4 Telefon uygulaması (PWA): üç modülde çevrimdışı kabuk (`brand/ortak/pwa.js` +
  `sw.js`), yalnız http(s) ile açılınca; ağ önce, ağ yoksa son kopya; ilk açılışın
  dosyaları da kasaya girer; `build.py` `sw.js`'i `dist/` yanına koyar. Gömülü
  manifestin kapsamı artık mutlak adres (göreli olan yok sayılıyordu). Duman testi
  sunucuyu durdurup sayfayı yeniden açar. Telefon için bir http(s) adresi gerekir;
  yerel ağa açmak kullanıcının kararı (bkz. §4 soru 5).
- ⏳ Y5 Sağlık verisi içe aktarma — **İKİSİ DE** (cevap 4): iPhone için Apple Sağlık
  `export.xml`, Android için Health Connect dışa aktarımı. Aynı önizleme + onay
  yolu (Y3 .ics gibi): okunan kayıt ölçüldü etiketiyle, kullanıcı seçer, SPİ kendi
  koduyla yazar.

### Part 6 — Yeni kollar II
- ⏳ Y1 Para kolu (gelir-gider, abonelik, birikim hedefi) — cevap 3: giriş kanalları
  Telegram'dan yazmak («150 TL market»), King / akşam yoklaması sohbeti («bugün ne
  yaptın») ve Telegram'a **fiş fotoğrafı** atmak. Kanalların hepsi HKM'de olduğu için
  öneri HKM içinde bir bölüm; ilk adımda kullanıcıya bir cümleyle teyit et. Fişten
  okunan tutar/kalem **tahmin**dir: kayda geçmeden önizlenir, kullanıcı onaylar
  (belirsiz girdi sorulur). Tutarı ve toplamı kod hesaplar.
- 🔜 Y9 Bilgi Deposu tarayıcısı (HKM web).
- ⏳ Y10 Veli / koç özeti — DOSYA (PDF). Cevap 7: haftada BİR ya da İKİ PDF; sıklığı
  **kod** karar verir: kullanım yoğunluğu, karar / değişiklik yoğunluğu, aciliyet,
  sağlık durumu, ders durumunun kararlılığı (sabit mi, yükselen mi, düşen mi). Karar
  cümlesi «hesaplandı» etiketli ve gerekçeli. Alıcının kim olduğu henüz söylenmedi;
  şimdilik dosya kullanıcıya (HKM + Telegram) gider, alıcıyı ilk adımda sor.
- ⏳ Y11 Kariyer / proje kolu — cevap 8: esnek; eğitim, staj, proje, iş başvurusu
  hepsi olabilir. **İlk adım: akademi kısmı** — kullanıcının durumuna göre LGS, YKS,
  KPSS, DGS, ALES, YDS gibi sınavların ÖNERİLMESİ (sınav profilleri zaten var:
  `AYS/src/js/core/sinavprofil.js`); öneri gerekçeli, karar kullanıcının.

### Part 7 — Öğrenme bağları ve borçlar
- ⏳ 9 Test kitabındaki yanlış → yanlış defteri / tekrar kartı teklifi.
- ⏳ 10 Ek sınav profilini ana sınav yapmak — cevap 6: şimdilik ana sınav **YKS**,
  ileride değişebilir (üniversite sınavları da). Ana sınav değiştirilebilir olmalı
  (büyük aksiyon: ayrıntılı önizleme + onay + geri dönüş noktası) ve kullanıcı
  ileride **üniversite müfredatı** yükleyebilmeli; sistem ona uyarlanır.
- ⏳ 11 Tahmin tablolarını kaynağa bağlamak — cevap 1: sağlayıcı **esnek**; HKM'nin
  desteklediği hepsi (Vikipedi, Brave, Tavily, Google PSE, SearXNG) seçilebilir ve
  değiştirilebilir kalır, hiçbirine kilitlenme. Bütçe sabit sayı değil, Ayarlar'dan.

### Part 8 — Tek tasarım (ALTYAPI BİTİNCE; şimdi BAŞLAMA)
- ⏳ Dört-beş tasarım dili (SPİ `designs.css` beş düzen, `designcheck.js`) yerine
  **tek, sade ve modern** bir tasarım. Kullanıcı bunu altyapı işleri bittikten sonra
  yapacak. O zamana kadar: yeni bir tasarım diline özel iş ekleme; yeni ekranlar
  ortak bileşenlerle (`components.js`, `base.css`) yazılsın ki geçiş kolay olsun.
- ⏳ 14 Depo göçü (her kayıt kendi anahtarında) — ÖNCE 15 (yedek) bitmeli.
- ⏳ 16 İlk kurulum testleri · 17 ekran sözleşmesi AYS/ESP · 18 labs.js ve AYS llm.js.

## 4. Kullanıcıya sorulanlar ve CEVAPLARI (2026-09-23)

Cevaplar sesle yazıldı; aşağıdaki özet onların anlamıdır. §3'teki maddeler bunlara
göre ❓ → ⏳ oldu.

1. **Web araması:** esnek olsun, değiştirilebilsin, hepsine uyarlanabilsin. Anahtar
   adı verilmedi → sağlayıcı ve bütçe Ayarlar'da; hiçbirine kilitlenme.
2. **Sağlık eşiklerinin dayanağı:** HEPSİ — kaynaklı araştırma + kullanıcının kendi
   verisi ve geçmişi (spor geçmişi, yeme geçmişi vb.). Eşik = kaynaklı genel sınır +
   kişinin kendi tabanı; hangisinden geldiği etiketle söylenir. SPİ teşhis koymaz,
   doz önermez (AGENTS.md §1.5).
3. **Para kolu:** girişler Telegram yazışması, King sohbeti («bugün ne yaptın» gibi)
   ve Telegram'a atılan fiş fotoğrafıyla olacak (bkz. Y1).
4. **Telefon:** hem iPhone hem Android desteklenecek (Y5 ikisi; PWA ikisinde de).
5. **Günlük açılış:** sunucu TEK bilgisayardan başlatılır, sabahtan akşama açık, gece
   kapalı; araştırma sürerken açık bırakılabilir. Başlatmak zahmetli olmamalı.
   Sonuçları: (a) tek tıkla başlatma korunur/kolaylaşır; (b) HKM'nin gece işleri
   bilgisayar kapalıyken kaçar → sabah açılışta **kaçırılanı yakala** davranışı
   denetlenmeli; (c) telefonun bu bilgisayara ağdan bağlanması hâlâ «lokal ağa
   karışma» kuralına takılır — açılmadı, kullanıcı ayrıca karar verecek; telefon
   kanalı şimdilik Telegram.
6. **Ana sınav:** şimdilik YKS; ileride değişebilir, üniversite sınavları ve
   üniversite müfredatı da gelebilir → sistem uyarlanabilir olmalı (madde 10).
7. **Veli / koç özeti:** haftada 1 ya da 2 PDF; sıklığa kod karar verir (Y10). Alıcı
   henüz söylenmedi — sor.
8. **Kariyer / proje:** esnek (eğitim, staj, proje…). Şimdilik akademi: LGS, YKS,
   KPSS gibi sınavların önerilmesi (Y11).

Hâlâ açık (ilgili iş başlarken sor): Y10'un alıcısı; Y1'in yeri (HKM içi öneri) için
teyit; telefonun bilgisayara ağdan bağlanıp bağlanmayacağı.

### Eski sorular (kayıt için)

1. İnternet araması: HKM Vikipedi (anahtarsız), Brave, Tavily, Google Programmable
   Search ve kendi SearXNG'ni destekliyor. Hangisinin anahtarı var, BAM'ın aylık
   bütçesi ne olsun? (madde 11 ve kaynaklı araştırma buna bağlı)
2. Sağlık eşiklerinin dayanağı: kaynaklı araştırma mı, senin / hekiminin girişi mi, ikisi mi?
3. Para kolu nerede olsun: HKM'nin içinde bir bölüm (öneri: tek yerde, Telegram'dan
   «150 TL market» yazılabilir) mi, yoksa AYS / SPİ / ESP gibi ayrı bir uygulama mı?
4. Telefonun iPhone mu, Android mi? (sağlık verisi içe aktarma ve PWA için)
5. Sistemi her gün nasıl açıyorsun: bilgisayarda `BASLAT.bat` ile mi, telefonda
   tek dosya olarak mı?
6. Ana sınavın hangisi, hangi yıl: YKS mi, KPSS mi, ikisi mi? (madde 10)
7. Veli / koç özeti kime gidecek; haftada bir PDF yeterli mi?
8. Kariyer / proje kolunda neyi izlemek istiyorsun (proje bitirme, staj / iş başvurusu, portföy)?

## 5. Komutlar

- HKM: `cd HKM && python3 -m tests.run` · web yüzü:
  `NODE_PATH=/home/user/LifeOs/AYS/node_modules node tools/yuz.js`
- Modül: `cd <SYS> && python3 build.py` · `CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/runtests.js`
  · gerekirse `node tools/smoke.js`
- Ortak kaynak: `python3 tools/ortak.py --yay` (brand/ortak değişince) · `--denetle`
- Tam koşum (yalnız büyük Part sonu): `CHROMIUM_PATH=/opt/pw-browsers/chromium python3 tools/sayilar.py --tam --yaz`
- Açık sunucu ve `HKM/config.json` bırakma; test portlarını kilitler.

## 6. Son biten işler (özet)

- Hedef motoru Tur 1–4: SPİ kilo/VKİ, King onay zinciri, ESP dil/okuma/enstrüman,
  AYS konu bitirme / net hedefi, sınav profilleri, müfredat raporu, bölümlü test kitabı.
- Bürolar B1–B4: Depolama, Araştırma (kaynaklı, web), Planlama v2, Üretim (Editör + Kalite).
- W5: Telegram / WhatsApp'tan gelen işin sonucu aynı sohbete; Telegram'a belge (PDF).
  `king._teslim`, testler `HKM/tests/test_urun.py`.
- Part 1–4 bitti: HKM 507/507, AYS 1609, SPİ 1253, ESP 1294; `tools/entegre.js` temiz
  (§0.6/§2.75 akşam yoklaması, §0.7/§2.76 BAM ürünü, §7 Ofis indirme + Web ayarı).
- Part 5 (Y2, Y3, Y4) bitti: AYS 1632, SPİ 1267, ESP 1309 birim testi, üç duman testi temiz
  (kabuk adımı dahil). **Kalan:** Part 5 sonu tam koşum henüz YAPILMADI (kullanıcının
  limiti doldu) — sıradaki Claude önce bunu koşsun, sayıları yazsın:
  `CHROMIUM_PATH=/opt/pw-browsers/chromium python3 tools/sayilar.py --tam --yaz`
  (koşarken dosya düzenleme). Sonra sırayla: Y9 (Part 6), Part 7'nin 9, 14, 16, 17,
  18'i; ardından cevapları gelen Y5, Y1, Y10, Y11, 10, 11 (§4). Part 8 (tek tasarım)
  EN SON, altyapı bitince.
- Ortam notu: modül testleri için `cd <SYS> && npm ci` (Playwright; node_modules depoda yok).
