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

- **Doğrudan `main` (kullanıcı, 2026-09-23):** «main üzerinden çalış». Yerel `main`
  `origin/main`'i izler; her madde bitince commit + `git push origin main` (yalnız
  ileri sarma, asla zorla yazma). Oturum dalı varsa ayrıca ilerletmek gerekmez.
- Uzun bir koşum (`sayilar.py --tam`) sürerken iş ayrı bir `git worktree`'de yapılır,
  koşum bitince main'e alınır: koşum ölçtüğü dosyanın değişmediğinden emin olur.
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
- ✅ Y9 Bilgi Deposu tarayıcısı: HKM › Ofis › Bilgi Deposu — arama, tür ve tazelik
  süzgeci; tazelik kodla ve etiketli (ölçüldü / hesaplandı / veri yok), sürüm zinciri
  ve kaynaklar kaydın içinde (`depo.tarayici`, `depo.kayit_depo`; HKM/MIMARI.md §8.27).
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
- ✅ 9 Test kitabındaki yanlış → yanlış defteri (8b-2). Tekrar kartı teklifi mevcut
  kuraldan gelir: etiket seçilince reçete yazılır, `proposals.js` «card-from-error» önerir.
- ⏳ 10 Ek sınav profilini ana sınav yapmak — cevap 6: şimdilik ana sınav **YKS**,
  ileride değişebilir (üniversite sınavları da). Ana sınav değiştirilebilir olmalı
  (büyük aksiyon: ayrıntılı önizleme + onay + geri dönüş noktası) ve kullanıcı
  ileride **üniversite müfredatı** yükleyebilmeli; sistem ona uyarlanır.
- ⏳ 11 Tahmin tablolarını kaynağa bağlamak — cevap 1: sağlayıcı **esnek**; HKM'nin
  desteklediği hepsi (Vikipedi, Brave, Tavily, Google PSE, SearXNG) seçilebilir ve
  değiştirilebilir kalır, hiçbirine kilitlenme. Bütçe sabit sayı değil, Ayarlar'dan.

### Part 8 — Akıllı iş sistemi: iste → King'in fiyat/süre teklifi → onay → modüle monte edilen çıktı
Kullanıcının fikri (2026-09-23), yön ONAYLI. Altyapıdır; Part 9 tasarımdan ÖNCE yapılır.
Amaç kullanım kolaylığı: kullanıcı ne isterse istesin, sistem işin büyüklüğünü anlar,
bedelini ve süresini önceden söyler, onay alır, çıktıyı serbest metin olarak değil
modülün içinde KULLANILABİLİR biçimde teslim eder.

**ÖNEMLİ — aşağıdakiler yalnız ÖRNEKTİR, liste değildir.** Sistem GENEL olmalı:
kullanıcı hangi modülde, hangi konuda, hangi işi isterse istesin (burada adı geçmeyen
bir ders, spor, enstrüman, dil, sağlık konusu, ürün…) aynı akış çalışır. Yoğunluk
sınıfı, teklif ve montaj örneğe özel kodla değil genel kuralla yapılır; yeni bir çıktı
türü gerekince katalog ve niyet listesi GENİŞLETİLİR (tek yerde), akış değişmez.
Aşağıdaki niyet adları (`besin.add` vb.) da ilk ihtiyaçlardır, sınır değildir.

**Kullanıcının örnekleri (yoğunluk sınıfıyla):**
- AYS: bir test fasikülü, 30–40 soru (düşük) · bir test kitabı (yüksek) · bir branşın
  bütün derslerinin bütün konularına test ya da özet (ekstra).
- SPİ: bitkisel proteinlerin besin değerleri, güncel market fiyatları, nereden alınır
  (orta/yüksek) · Adana'daki spor salonları fiyatlarıyla (düşük/orta) · hastalığa göre
  destek: hekimin tahlilleri + kullanıcının hisleri + sohbetleri (veri girişi çok esnek).
- ESP: gitar almak için araştırma (düşük) · gitar repertuvarı (orta) · bütün akorlar ya
  da bir şarkı hakkında her şey (yüksek) · Rusça A1–A2'nin bütün konu dersleri, her
  konunun altında 10–20 soru (ekstra).

**Akış — sekiz adım:**
1. İSTEK her yerden gelir: modül sohbeti, HKM sohbeti, Telegram, akşam yoklaması.
   Modülün ön süzgeci (bugünkü `brand/ortak/urun.js › istekMi` gibi) King'e yollar.
2. KING TANIR: iş türü ve KAPSAM (bölüm, konu, soru, kaynak, kelime sayısı). Kapsamı
   kod çıkarır; model yalnız belirsiz cümleyi tipli bir forma çevirir, kod doğrular.
   Anlaşılmayan tahmin edilmez, SORULUR («Rusça A1–A2 mi, A1–C1 mi?»).
3. YOĞUNLUK SINIFI KODLA: düşük / orta / yüksek / ekstra. Ölçü «iş birimi»: tahmini
   model çağrısı + web araması sayısı (bölüm × soru, kaynak sayısı). Eşikler tek bir
   tabloda (ör. düşük ≤ 3 çağrı ve web yok; orta ≤ 10; yüksek ≤ 40; ekstra > 40 ya da
   parçalı teslim). Sınıfı model DEĞİL kod verir; tablo ölçümle ayarlanır.
4. TEKLİF (maliyet + süre + seçenek):
   - Maliyet ÖLÇÜMDEN: `usage` tablosundaki `usd` (HKM/core/db.py) ile aynı tür + sınıftaki
     son işlerin ortancası ve p90'ı; geçmiş yoksa jeton tahmini × fiyat tarifesi.
     Etiket «tahmin», dayanağı yazılır (bugünkü `king.tahmini_sure` gibi).
   - Süre: `king.tahmini_sure` sınıfa göre genişletilir.
   - Bütçeden payı: «aylık bütçenin %X'i, kalan Y» (`core/butce.py`).
   - Kullanıcının durumuna göre akıl: bütçe azsa daha küçük seçenek önerir (test kitabı
     yerine fasikül ya da yalnız 1. bölüm); acil değilse ay başına ya da gündüze alır.
   - Her teklifte en çok üç seçenek: tam · küçük · parça parça (her parçada ara onay).
5. ONAY: kullanıcı kabul etmeden BAM'da iş AÇILMAZ. Bugün King imkan kontrolünden
   geçen işi doğrudan açıyor; yeni ara durum `teklif` (onay bekliyor) gerekir. Onay
   HKM web'den, modülden ve Telegram'dan verilebilir («1 tam · 2 yalnız A1 · 3 iptal»).
   AGENTS.md §1.9 ile uyumlu: kullanıcı Ayarlar'da «düşük işleri sormadan yap»
   diyebilir; orta ve üstü her zaman sorar, ekstra ayrıntılı önizlemeyle.
6. ÜRETİM PARÇALI: yüksek ve ekstra işler bölümlere bölünür (bugünkü `core/kitap.py`
   her tikte bir bölüm üretiyor). İlk bölüm gelince kullanıcı görür, «devam / dur»
   der; maliyet kontrolde kalır. Gerçek maliyet ve süre yazılır; tahminle sapma
   ölçülür (bugünkü `king.sure_sapmasi`nın maliyet eşi). Bilgisayar gece kapalı
   (cevap 5): uzun işler gündüz kuyruğuna, yarım kalan iş sabah kaldığı yerden sürer.
7. MONTAJ: çıktı modülün anladığı TİPLİ PAKET olarak gelir, her paketin bir niyet türü
   (`HKM/core/intents.py` KINDS) ve modülün kendi sınayıcısı vardır. HKM modüle yazmaz;
   modül kendi koduyla yeniden sınar, önizletir, onayla yazar (orta aksiyon).
   - **AYS:** `kitap.add` var. Fasikül = tek bölümlü kitap. Test kitabında sayfa/bölüm
     gezinme, çözdüklerini görme, orada çözme (`AYS/src/js/core/testkitabi.js`'de
     bölüm bölüm çözme var; sayfa aktarma ve «çözdüklerim» görünümü eklenecek).
     Yanlışlar yanlış defterine / tekrar kartına (madde 9). Konu özeti Dersler'de o
     konunun altında durur (bugün `urun.add` genel materyal listesine gidiyor; konuya
     bağlanacak). Branşın tüm konuları: sınav profilinin (`sinavprofil.js`) konu
     ağacına bağlı özet + test. 60 soru tavanı (`kitap.py MAX_TOPLAM`) sınıfa göre ve
     parçalı teslimle genişler.
   - **SPİ:** yeni `besin.add` — `SPI/src/js/data/foods.js` şemasında (100 g; p/f/c,
     micro, portions, aliases) kullanıcı besini; kaynaklı; eksik mikro «bilinmiyor»,
     sıfır değil. Yeni `fiyat.add` — tarihli, kaynaklı market fiyatı «tahmin»; fiş
     girilince `money.js` kuralıyla «ölçüldü» ezer. Yeni `yer.add` — spor salonu gibi
     yerler (ad, semt, fiyat, kaynak, tarih) SPİ › Bilgiler'e. Diyet programı istenince
     besin değerleri OTOMATİK işlenir: hesap `nutri.js`, model değil. Sağlık bağlamı
     (hastalık, hekim tahlili `biomarkers.js` + `parse.js`, semptom `symptom.js`,
     sohbetler) isteğe bağlam olarak gider; SPİ teşhis koymaz, doz önermez, kırmızı
     bayrakta hekime yönlendirir.
   - **ESP:** yeni `unite.add` — `ESP/src/js/data/lessons.js` ünite şeması (konu,
     ölçülebilir hedef, öğeler) + SRS kartları (`srs.js`) + pratik soruları
     (`lesson.js` pratik motoru). Rusça A1–A2 → merdivene (`curriculum.js`) bağlı
     üniteler, her konunun altında 10–20 soru. Gitar akorları ve repertuvar
     `guitar_tabs.js` şemasında (tempo «referans» etiketiyle). Alışveriş araştırması
     (gitar almak) → karşılaştırma raporu (`urun.add`, `urunler.py › karsilastirma`).
8. GÖRÜNÜRLÜK: her modülde tek bir «Kütüphanem»: ne üretildi, ne zaman, kaynakları,
   maliyeti (ölçüldü), ne kadar kullanıldı (kitabın %kaçı çözüldü, kaç kart öğrenildi).
   HKM Ofis'te iş geçmişi: tahmin ve gerçek maliyet/süre yan yana.

**Bir tık ötesi (yapmadan önce kullanıcıya bir cümleyle teyit):**
- DEPO ÖNCE: benzer iş daha önce yapıldıysa (`core/depo.py`, Y9 depo tarayıcısı)
  King «zaten var, güncel, bedava» ya da «3 ay önce yapıldı, fiyatlar eskimiş olabilir;
  yalnız fiyatları tazeleyeyim mi? (düşük)» der. Aynı iş iki kez ödenmez.
- KİŞİYE GÖRE BOYUT: AYS'de zayıf konular (ölçüm) test kitabının konu ve zorluk
  dağılımını belirler; ESP'de kademe; SPİ'de hedef ve bütçe («bitkisel protein»
  listesi gram protein başına maliyete göre sıralı: `money.js › costPerNutrient`).
- TAZELİK: fiyat ve yer gibi eskiyen veri tarihlidir; süresi geçince «tazele» teklifi.
- KULLANIM TAKİBİ: üretilip hiç açılmayan çıktı, King'in bir sonraki pahalı teklifinde
  söylenir («geçen haftaki kitabın %10'u çözüldü; önce onu bitirmek ister misin?»).
- GERÇEK ZORLUK GERİ BESLER: soruların çözülme verisi (ölçüldü) sonraki üretimin
  zorluk dağılımını ayarlar.
- AYNI İSTEK İKİ MODÜLE: «Rusça çalışırken uyku düzenim» gibi çapraz istek King'de
  bölünür (akşam yoklamasındaki `dil.rapor` gibi), her modüle kendi paketi.

**Doktrin sınırları:** sınıf, maliyet, süre ve bütün sayılar KODDAN; model yalnız
yapılandırır ve üretir. Tahmin her yerde «tahmin» etiketli ve dayanaklı. Kişisel veri
istemlere varsayılan olarak gitmez (`kitap.py` kural 5); sağlık bağlamı gidecekse
kullanıcı onaylar ve en az bilgi gider. Montaj orta aksiyondur: önizleme + onay.

**Zaten var olan (yeniden yazma, üstüne kur):** `king.TURLER / imkan / tahmini_sure /
sure_sapmasi`, `butce.guard`, `usage` tablosu, `is_emirleri.tahmin`, `kitap.py`,
`urunler.py` kataloğu, `depo.py`, niyetler `kitap.add / urun.add / material.add /
mufredat.add`, AYS `testkitabi.js`, SPİ `foods / prices / money / nutri / biomarkers /
symptom`, ESP `lessons / lesson / srs / curriculum / guitar_tabs`, `brand/ortak/urun.js`.

**Eksik olan (yapılacak):** yoğunluk tablosu; ölçümden maliyet tahmini; `teklif` ara
durumu ve üç kanaldan onay; seçenekler; parçalı teslim + ara onay; yeni niyetler
`besin.add`, `fiyat.add`, `yer.add`, `unite.add`; modüllerin montaj ekranları ve
Kütüphanem; tahmin–gerçek maliyet sapması.

**8a ilerleyişi:**
- ✅ 8a-1 Model çağrısı ait olduğu BAM işine yazılır (`usage.is_id`, `butce.is_baglami`);
  biten işin ölçülen maliyeti `sonuc.maliyet`.
- ✅ 8a-2 Teklif hesabı (`HKM/core/teklif.py`, HKM/MIMARI.md §8.28): sınıf, maliyet
  (ölçümden → çağrı başına → tarife), süre, bütçe payı, seçenekler (`KUCULT`), öneri.
  Her iş emrine yazılır, King kuyruğunda ve bildirimde görünür. İş HENÜZ onaysız açılır.
- ✅ 8a-3a Onay kapısı, HKM tarafı: `teklif` durumu (BAM'da iş açılmaz),
  `king.teklif_onayla` / `iptal`, `POST /api/king/emir/<id>/onayla`, sohbette ve
  Telegram'da «1 · 2 · iptal» (`king.teklif_cevap`), HKM › Ofis düğmeleri, Ayarlar ›
  Bütçe › «Düşük sınıf işleri sormadan yap». Kural işi sorulmaz. §8.28.
- ✅ 8a-3b Modülün teklif kartı: AYS/SPİ/ESP Bugün › «King teklifi» (seçenekler +
  «N. seçeneği onayla» / İptal); `brand/ortak/kingteklif.js`, `GET /api/king/teklifler/<m>`;
  AYS müfredat ve test kitabı istekleri artık «King onayladı» değil «teklif hazırladı» der.
  Zincir testi `tools/entegre.js` §2.77 (sohbetten ürün → kart → modülden onay → BAM).
- ✅ 8b-1 Parça parça + ara onay (HKM): teklifte üçüncü seçenek (`teklif.SECENEK`),
  BAM `ara_onay`, `king.parca`, «devam / dur» (HKM, sohbet/Telegram, modül kartı). §8.28.
- ✅ 8b-2 AYS test kitabı ekranı (HKM/MIMARI.md §8.29): soru şeridi, «Gözden geçir»
  (çözdüklerim), Kütüphanem (kaynak, kullanım yüzdesi, ölçülen maliyet —
  `depo.kayit_depo` → `maliyet`, çağrısız iş «veri yok»), yanlışları yanlış defterine
  ekleme (Part 7 madde 9; etiket uydurulmaz, defterde kullanıcı seçer, «Geri al»).
  Açık kalan: 60 soru tavanı parça parça seçeneğinde hâlâ sabit (`kitap.MAX_TOPLAM`).
- 🔜 8c SPİ `besin.add` / `fiyat.add` / `yer.add` + diyete otomatik işleme.

**Dilimler (sırayla, her biri test + commit + push):** 8a teklif (sınıf + maliyet +
süre + onay) mevcut iş türleri için → 8b AYS fasikül/kitap parçalı + çözdüklerim +
Kütüphanem → 8c SPİ besin/fiyat/yer + diyete otomatik işleme → 8d ESP ünite/ders paketi
→ 8e depo önce + tazelik + kullanım takibi.

### Part 9 — Tek tasarım (ALTYAPI BİTİNCE; şimdi BAŞLAMA)
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
  (koşarken dosya düzenleme). Sonra sırayla: Y9 (Part 6; depo tarayıcısı Part 8'in
  «depo önce» adımına da temel), Part 8 akıllı iş sistemi (kullanıcının önceliği:
  kullanım kolaylığı buna bağlı), Part 7'nin 9, 14, 16, 17, 18'i, ardından cevapları
  gelen Y5, Y1, Y10, Y11, 10, 11 (§4). Part 9 (tek tasarım) EN SON, altyapı bitince.
  Sırayı değiştirmek istersen kullanıcıya bir cümleyle sor.
- Ortam notu: modül testleri için `cd <SYS> && npm ci` (Playwright; node_modules depoda yok).
