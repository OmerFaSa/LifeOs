# Talimat raporu — sıradaki Claude için

> Son güncelleme: 2026-09-23 · bu oturum (`claude/epic-keller-uz103z`).
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
  listede olmayan yeni bir fikir önce kullanıcıya sorulur.
- **Lokal ağa karışma.** Ağdan erişilen paylaşım, tünel, port açma yok.
- Şirket / YouTube ofisi başka bir Claude'un işi; dokunma.
- PR açma (istenmedi). **`main`'e birleştirmek serbest** (kullanıcı onayı): yalnız
  ileri sarma, asla zorla yazma.
- Token bitmeye yaklaşınca: bu dosyayı güncelle, kullanıcıya gönder, sorulacakları sor.

## 2. Dal düzeni

- Geliştirme dalı: `claude/epic-keller-uz103z` → `git push -u origin claude/epic-keller-uz103z`.
- `main` ve `claude/remove-videos-use-images-9bmd1f` bu dalın ataları; her Part sonunda
  `git push origin HEAD:main` (yalnız ileri sarma). Eski dalı ayrıca ilerletmek gerekmez.
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
- 🔜 Y7 Akşam yoklaması: bot sorar, cevap modüle TEKLİF olur (HKM modüle yazmaz).
- ⏳ 5 / W6 Modüller `urun.add` alır; HKM Ofis: indirme, ajan izi, depo raporu, web ayarları.

### Part 5 — Yeni kollar I
- ⏳ Y2 Alışkanlık kolu (motorda `aliskanlik` türü var, paketi yok).
- ⏳ Y3 Takvim: .ics dışa aktarma ve içe alma (tatil / okul sınavı → istisna).
- ⏳ Y4 Telefon uygulaması (PWA: manifest + service worker; yalnız sunucuyla açılınca).
- ❓ Y5 Sağlık verisi içe aktarma (Apple Sağlık export.xml ya da Health Connect).

### Part 6 — Yeni kollar II
- ❓ Y1 Para kolu (gelir-gider, abonelik, birikim hedefi).
- ⏳ Y9 Bilgi Deposu tarayıcısı (HKM web).
- ❓ Y10 Veli / koç özeti — lokal ağa karışmamak için DOSYA (PDF) olarak.
- ❓ Y11 Kariyer / proje kolu.

### Part 7 — Öğrenme bağları ve borçlar
- ⏳ 9 Test kitabındaki yanlış → yanlış defteri / tekrar kartı teklifi.
- ❓ 10 Ek sınav profilini ana sınav yapmak (KPSS vb.).
- ❓ 11 Tahmin tablolarını kaynağa bağlamak (web sağlayıcısı kararına bağlı).
- ⏳ 14 Depo göçü (her kayıt kendi anahtarında) — ÖNCE 15 (yedek) bitmeli.
- ⏳ 16 İlk kurulum testleri · 17 ekran sözleşmesi AYS/ESP · 18 labs.js ve AYS llm.js.

## 4. Kullanıcıya sorulanlar (cevap gelince buraya yaz)

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
  `king._teslim`, testler `HKM/tests/test_urun.py`. HKM 476/476.
