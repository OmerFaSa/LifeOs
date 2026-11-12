# AYS envanteri (Sadeleşme keşfi)

Kaynak: `C:\Users\ASUS\LifeOs-sadelesme` (origin/main, d375ef2d). Salt okuma; bu dosya dışında hiçbir şeye dokunulmadı.
Karar sözlüğü: KABUK · ALAN:<alan> · MOTOR:<motor> · KING · ARŞİV · SİL · SORU.
Bu turda okunmayanlar (göremedim): `belgeler/TEKNIK.md` gövdesi; `AYS/src/*.md` dosyalarının yalnız başlıkları okundu; içerik doğruluğu; `data/scoring.js` alan dökümü; testler koşturulmadı (yalnız hangi dosyanın neyi çağırdığı grep'lendi).

## 1. Özet sayılar

| Ne | Sayı | Nasıl sayıldı |
|---|---|---|
| Ekran dosyası | 25 (`AYS/src/js/screens/*.js`, toplam 20 797 satır; app.js ayrıca 2 366) | `ls`, `wc -l` |
| Kayıtlı sayfa (`PARCA.sayfa`) | 29: 27'si çekmecede, 2'si çekmecesiz (`ogrenme`, `topic`) | grep `PARCA.sayfa(` + target.js:27 `P.sayfa` |
| Çekmece | 9: bugun, plan, calisma, ogren, analiz, onaylar, ofis, kutuphane, ayarlar | `cekmece:` değerleri |
| Ekran içi bölüm/sekme | 38 bölüm, 12 ekranda (`K.SayfaBolumleri`); ayrıca Öğren › Sorular'da 5 kip | §2 |
| Ekranlardaki parça (`PARCA.blok` / `P.blok`) | 160 | grep, 25 dosya |
| Komut (`PARCA.komut`) | 35 (ekranlar + app.js), çekirdekte 1 | grep |
| Çekirdek dosya | 161: 97 ortak kopyası, 3 `brand/seviye` kopyası, **61 yalnız AYS** | ad karşılaştırması + «ÜRETİLMİŞ KOPYA» başlığı |
| Veri dosyası | 38 (`AYS/src/js/data`, 2 253 783 bayt) | `ls`, `wc -c` |
| `brand/parcalar.txt` (1036 satır) | [bas] 1 yalnız AYS · [govde] 90 yalnız AYS + 3 AYS ile başka modül · [tembel] 21 yalnız AYS (anlatım/derin/özet/paragraf/akıllı verisi) · [test] 150 satırda `ays`; ayrıca modül adı yazmayan (üçünde yüklenen) [bas] 57 + [govde] 123 | awk, bölüm başına |
| Test dosyası | 155 (`AYS/src/tests`) | `ls` |
| Saklanan koleksiyon | 35 depo öneki + 14 `meta/*` ve 2 `plan/*` anahtarı (§5) | grep `Store.(get|set|list|remove)` |
| Öğrenme içeriği | 8 ders, 184 konu; anlatımda 744, derin katmanda 1 104, paragrafta 100 soru (§6) | Node `vm` sayımı |

## 2. Ekran envanteri

Kaynak: her ekranın `PARCA.sayfa({ id, cekmece, ad })` satırı, iç bölümler `K.SayfaBolumleri` / `GRUPLAR` / `TABS` tanımları. «Okur/yazar»: ekranın `S.<alan>` kullanımı ve `M.save*` / motor çağrıları (grep). Bölüm satırları `↳` ile.

| Görünen ad | Dosya (satır) | Ne yapar | Okur / yazar | Öneri | Yeni yapıda yeri | Not / risk |
|---|---|---|---|---|---|---|
| Bugün › Genel bakış | screens/today.js (2647) | akış kutusu, geri sayım, öğrenme kartı, hızlı giriş, onay bekleyen teklifler (5 blok); gün blokları ve sayaç (`gun` rotası, app.js:147) | O: days, profile, cards, exams, weeks, officeProposals · Y: saveDay, saveMood, saveBreak, addDistraction, saveCard, saveError, `Hedefler.kaydet`, `HedefPlan.kur` | KABUK + MOTOR:Plan | Kabuk ana ekranı; gün blokları Plan, mola/ruh hali Kayıt | En büyük ekran; hedef yönetimi de burada (bir özellik bir yer ihlali) |
| Plan › Hafta | screens/week.js (910) | 3 bölümlü hafta ekranı | O: days, reviews, weeks · Y: saveDay, saveWeek, saveReview, `Istisna`, `Proposals.approve` | MOTOR:Plan | Plan motoru hafta görünümü | |
| ↳ Günler | week.js:724 | hafta takvimi, öneri | days | MOTOR:Plan | | |
| ↳ Sözleşme | week.js:724 | imza formu, istisna, revizyon | weeks | SORU | | Haftalık «imza» ritüeli kalsın mı? |
| ↳ Özet | week.js:724 | ders dağılımı, değerlendirme, denge, müfredat | reviews | MOTOR:Plan | haftalık değerlendirme | |
| Plan › Program | screens/plan.js (379) | üretilmiş kişisel program, düşenler, yoğunluk, zaman çizgisi (5 blok) | O: plan, weeks, profile · `Planner.level` | MOTOR:Plan | Plan motoru | salt bakış; eylem düğmesi göremedim (sadelik/ays.md:66 da aynı şeyi söylüyor) |
| Plan › Hedefler | screens/target.js (368) | tahmini sıra, hedefe kalan net, OBP, 24 tercih, net matrisi (9 blok) | O/Y: profile, prefs (`savePrefs`) | ALAN:Akademik | Akademik alan kuralları | Ad, ortak hedef motoruyla (today.js) çakışıyor |
| Çalışma › Tekrar | screens/cards.js (584) | 3 bölümlü kart tekrarı | O: cards, errors, videoNotes · Y: newCard, saveCard, deleteCard, saveError | MOTOR:Tekrar | Tekrar motoru | |
| ↳ Bugün | cards.js:385 | vadesi gelen kartlar, tekrar paketi | cards | MOTOR:Tekrar | | |
| ↳ Yanlışlar | cards.js:387 | yanlış defteri | errors | MOTOR:Soru | Soru motoru yanlış defteri | Öğren › Sorular › Yanlışlarım ile ikilik |
| ↳ Tümü | cards.js:388 | bütün kartlar | cards | MOTOR:Tekrar | | |
| Çalışma › Soru çöz | screens/solve.js (1249) | 3 bölüm; model bağlıysa Sor önce gelir (solve.js:786) | O/Y: solved, `Sources.*`, saveError | bölünür | | |
| ↳ Sor | solve.js | soruyu modele götürür, denetler (core/solver.js) | solved | KING | King «öğren» niyeti | |
| ↳ Kaydet | solve.js | çözülen soru sayısı, hızlı kayıt | solved | MOTOR:Kayıt | | |
| ↳ Kaynaklar | solve.js | yayın kaydı, konu başına çözüm | sources | ALAN:Akademik | | |
| Çalışma › Deneme | screens/exams.js (1467) | deneme listesi ve özeti; soru soru analiz | O/Y: exams, errors, cards; `DenemeAnaliz`, `Calib` | MOTOR:Soru | Soru motoru sınav kaydı | Calib bağı kalkarsa sadeleşir |
| ↳ Denemeler | exams.js:1109 | liste, «Sırada» analiz borcu | exams | MOTOR:Soru | | |
| ↳ Özet | exams.js:1109 | net, rekor, ders ders, sıra, hedef, hacim, yayın | exams | MOTOR:Soru | | |
| Çalışma › Konu takibi | screens/subjects.js (707) | konu durumu, risk sırası, sınav profilleri | O: profile, days, solved · Y: setTopicState, `SinavProfil.*` | MOTOR:Yol | Akademik yol haritası ilerlemesi | |
| ↳ Konular | subjects.js:588 | bekleyen ölçüm, ders/konu listesi, zincir | topics | MOTOR:Yol | | 40 konu düğmesi (sadelik/ays.md:159) |
| ↳ Genel | subjects.js:588 | harita, oran, risk, profiller | topics, sinavprofil | ALAN:Akademik | | |
| Çalışma › Kendini sına | screens/quiz.js (661) | kart havuzundan sınama, güven sorusu (5 blok) | O: errors; `R.Quiz`, `TestKitabi.mevcut` | MOTOR:Tekrar | Tekrar motorunun «sına» kipi | Öğren › Sorular › Karma test ile ikilik |
| Öğren › Konular | screens/ogren.js (2078; 4 sayfa) | sıradaki konu, devam, dersler, konular (4 blok) | ui; `R.Ogren` | MOTOR:Yol | Yol motoru giriş | |
| Öğren › Anlatım | ogren.js | konu anlatımı, notum, paragraf anlatımı, çıkmış, malzeme (7 blok) | KONU_ANLATIM/DERIN · Y: `KonuNotu`, `Cikmis` | MOTOR:Yol | Yol dersi | Not kısmı → MOTOR:Not |
| Öğren › Sorular | ogren.js | kipler: konu soruları, karma, yanlış, prova, paragraf (`data-tab`) | Y: `OgrenTest`, `Cikmis` | MOTOR:Soru | Soru motoru | 5 kip; Tekrar ve Kendini sına ile örtüşür |
| Öğren › Koç | ogren.js | konu bağlamında model koçu | — | KING | King «öğren» | |
| Öğren › Ders notları | screens/learn.js (728) | ders/video kaydı, zaman damgalı not, nottan kart | O/Y: videoNotes, cards; `Office.generateCards` | MOTOR:Not | Not motoru | kart üretimi ofis üzerinden |
| Adım adım öğren (çekmecesiz) | screens/ogrenme.js (87) | ortak öğrenme motoru ekranı, Konular'dan açılır | `Ogren.cevapla`, `OgrenTest.konuKanit` | MOTOR:Yol | | `brand/ortak/ogrenmotor.js` ile ikilik |
| Konu sayfası (çekmecesiz) | screens/topic.js (469) | tek konunun özeti: yol, ölçüm, pratik, not, risk, kart, hata (11 blok) | ui, videoNotes, errors, cards | MOTOR:Yol | Akademik › konu | |
| Analiz › İlerleme | screens/progress.js (482) | 4 bölüm, 13 blok | O: decisions, profile · Y: saveDecision | bölünür | | |
| ↳ Özet | progress.js:423 | «Sırada» satırı, kartlar | — | KABUK | | 1999 px uzun (sadelik/ays.md:65) |
| ↳ Netler | progress.js:423 | trend, test, aylık eğri, hata dağılımı | exams | MOTOR:Soru | | |
| ↳ Yol | progress.js:423 | konu haritası, plan geçmişi, göstergeler | topics, plan | MOTOR:Yol | | |
| ↳ Karar | progress.js:423 | aylık karar kapısı formu | decisions | ALAN:Akademik | kural koddan | |
| Analiz › Tahmin | screens/gelecek.js (304) | 2 bölüm | O: profile, days | MOTOR:Soru | | |
| ↳ Sınav günü | gelecek.js:272 | «bu gidişle» izdüşüm (`R.Gelecek`) | exams | MOTOR:Soru | | |
| ↳ Deney | gelecek.js:272 | kişisel deney (`R.Deney`) | profile | SORU | | |
| Analiz › Neden? | screens/analytics.js (911) | 5 grup (`GRUPLAR`, satır 177) | O: days, profile, sessions, exams; `Calib`, `Friction`, `Signals` | bölünür | | |
| ↳ Karşılaştırma | analytics.js:178 | iki deneme karşılaştırma | exams | MOTOR:Soru | | |
| ↳ Hata haritası | analytics.js:179 | hata etiketleri, Pareto | errors | MOTOR:Soru | | |
| ↳ Sıra ve hız | analytics.js:180 | sıra, soru başı süre | exams, sessions | MOTOR:Soru | | |
| ↳ Konu değeri | analytics.js:181 | konu getirisi | topics | MOTOR:Yol | | |
| ↳ Alışkanlık ve denetim | analytics.js:182 | alışkanlık, denetim, dürüstlük (Calib, Friction, Signals) | forecasts, usage, signals | ARŞİV | | §7 |
| Analiz › Telafi | screens/protocols.js (240) | telafi protokolleri, tetikleyiciler, minimum gün, uyku kartı, rutin (9 blok) | O/Y: protocols (`saveProtocol`) | MOTOR:Plan | kötü gün kuralı Plan'da | uyku kartı → ALAN:Uyku |
| Onaylar › Bekleyen | screens/onaylar.js (645) | çıkarım + bekleyen teklifler, onay/ret/geri al | officeProposals; `Proposals.*`, `Istisna.kaldir` | KING | King teklif onayı (tek yer) | |
| Ofis › Ekip özeti | screens/office.js (1274) | 3 bölüm: Özet, Uzmanlar, Kayıt | `Office`, `Journal.trust`, `Takvim.planla` | KING | | §7 |
| Ofis › Uzmana sor | screens/team.js (591) | 3 bölüm: Sohbet, Rapor, Ekip | `Hedefler.sohbet`, `SinavProfil.sohbet`, `TestKitabi.sohbet` | KING | King sohbet | |
| Ofis › Toplantı | screens/meeting.js (939) | gündem, canlı toplantı, rapor, arşiv (6 blok) | officeMeetings | SİL | tutanaklar ARŞİV | |
| Kütüphanem › Notlar | screens/kutuphane.js (148) | ortak defter: pano, raf | defter/ | MOTOR:Not | | |
| Kütüphanem › Kitaplar | kutuphane.js | BAM kitapları | testkitabi | MOTOR:Arama | Arama çıktıları | |
| Ayarlar › Genel | screens/guide.js (1447) | 3 grup (`GRUPLAR`, satır 316) | O/Y: profile, calendar, days; `Takvim`, `Bolum`, `SoruFoto.temizle`, yedek | bölünür | | |
| ↳ Ayarlar | guide.js:317 | ayar listesi, yedek, sil | profile, meta | KABUK | tek ayar şeması | |
| ↳ Takvim | guide.js:318 | istisna, takvim, sınav haftası, .ics | calendar, plan/istisnalar | MOTOR:Plan | | |
| ↳ Başvuru | guide.js:319 | başvuru listesi, analiz protokolü, kanıt | profile | ALAN:Akademik | | |
| Ayarlar › Profil | screens/profiles.js (383) | profil, aktarım, gözetmen, karşılaştırma | O/Y: profile, calendar, profiles | KABUK | Çekirdek hesap | çok profil kalsın mı (§9) |
| Ayarlar › Rütbe | screens/rutbe.js (1099) | 5 sekme (`TABS`, satır 159): Şu an, Merdiven, Başarımlar, XP nereden gelir, Defter | seviye (xp.js) | SORU | | §7 |

## 3. Modüle özgü çekirdek dosyalar

`AYS/src/js/core/` 161 dosya: 97'si `brand/ortak` ile aynı adlı (derlemede kopyalanan), 3'ü `brand/seviye` kopyası (başında «ÜRETİLMİŞ KOPYA»: `xp.js`, `basarim.js`, `perde.js`), **61'i yalnız AYS'nin**. Rol sütunu her dosyanın baş yorumundan; satır sayısı `wc -l`.

| Dosya (satır) | Rol | Öneri |
|---|---|---|
| state.js (1369) | `R.S` veri modeli, kaydet/yükle, göç, SRS `schedule` (583) | Çekirdek (tek veri deposu); `schedule` → MOTOR:Tekrar |
| store.js (25) | depo anahtarları, şema sürümü | Çekirdek |
| storage.js (307) | depo sağlığı, büyüme örnekleri | Çekirdek |
| calc.js (1232) | KPI, karar kapısı, tetikleyiciler, net, sıra tahmini, risk, kart borcu | bölünür: MOTOR:Soru (net/sıra), MOTOR:Tekrar (kart borcu), MOTOR:Plan (plan gerçekleşme), ALAN:Akademik (kapı) |
| evidence.js (284) | kanıt motoru: bir eşik neyi söylemeye yetkili | Çekirdek (karar kuralı ortak olmalı) |
| analytics.js (586) | derin analiz, Theil–Sen eğimi | MOTOR:Soru (sınav analizi) |
| gelecek.js (216) | «bu gidişle» net izdüşümü, senaryo | MOTOR:Soru |
| deney.js (206) | kişisel deney motoru (KOLAY-PLANI Faz 5) | SORU |
| denemeanaliz.js (547) | cevap anahtarı → soru soru analiz | MOTOR:Soru |
| denemefoto.js (120) | sonuç kâğıdı fotoğrafından deneme | KING (kayıt niyeti) + MOTOR:Kayıt |
| examrun.js (317) | süreli deneme oturumu (165 dk) | MOTOR:Soru |
| quiz.js (507) | kendini sınama, güven sorusu | MOTOR:Tekrar |
| ogrentest.js (451) | Öğren › karma test, yanlışlarım | MOTOR:Soru |
| testkitabi.js (444) | BAM test kitabını sınav biçiminde çözme | MOTOR:Soru |
| sorufoto.js (237) | deneme sorusu fotoğrafları (IndexedDB) | MOTOR:Soru |
| cikmis.js (167) | konuya bağlı ÖSYM çıkmış soru kayıtları | MOTOR:Soru (içerik ALAN:Akademik) |
| paragraf.js (254) | günlük paragraf seti | ALAN:Akademik (Türkçe) → MOTOR:Soru |
| sources.js (199) | yayın kaydı, ölçülen zorluk | ALAN:Akademik |
| solver.js (620) | soruyu modele götürür, çıktıyı denetler, kaydeder | KING (öğren/araştır) + MOTOR:Soru kaydı |
| ogren.js (494) | konuyu uygulama içinde teker teker öğrenmek | MOTOR:Yol |
| ogrenyolu.js (139) | bir konunun öğrenme adımları | MOTOR:Yol |
| konunotu.js (132) | konu okurken not | MOTOR:Not |
| konusor.js (113) | konunun içinde «anlamadım / soru sor» | KING (öğren niyeti) |
| planner.js (559) | kişiye özel program üreteci | MOTOR:Plan |
| hedefplan.js (368) | hedef → haftalık program | MOTOR:Plan |
| hedefler.js (551) | ortak hedef motorunun AYS paketleri | ALAN:Akademik |
| istisna.js (546) | temel plan + tarihli istisna | MOTOR:Plan |
| auto.js (341) | haftalık sözleşmeyi plandan doldur, öneriler | MOTOR:Plan |
| takvim.js (446) | .ics içe/dışa | MOTOR:Plan |
| tatil.js (76) | tatil modu (AYS tarafı) | MOTOR:Plan |
| haftarapor.js (152) | veli/koç için yazdırılabilir hafta | SORU |
| sinavprofil.js (320) | AYS'yi tek sınava bağlamama, sınav profilleri | ALAN:Akademik |
| sinavoneri.js (124) | «hangi sınav bana uygun?» | ALAN:Akademik |
| xpsayim.js (59) | «o gün ne yapıldı» (gunSorusu) | MOTOR:Kayıt (sayım) |
| basarimsayim.js (65) | ölçülmüş süre sayımı | MOTOR:Kayıt |
| audit.js (472) | bölüm denetimi «bir şey ters mi?» | ARŞİV |
| signals.js (296) | denetim sinyalleri | ARŞİV |
| goodhart.js (304) | gösterge-amaç ayrışma nöbetçisi | ARŞİV |
| friction.js (232) | yönetim süresi / çalışma süresi | SORU |
| calib.js (363) | kalibrasyon defteri (tahmin vs sonuç) | SORU |
| office.js (2193) | beş ajanın okuması, konuşması, toplantısı | KING (devralır), kalan SİL |
| proposals.js (1436) | öneri kutusu, ofisin sisteme dokunduğu tek kapı | KING (ortak `kingteklif.js` ile birleşir) |
| journal.js (373) | ajan defteri | KING (hafıza) |
| tools.js (419) | ofis ajanlarının veri okuma araçları | KING (bağlam kurucu) |
| voice.js (500) | ajanların sesli okuma ritmi | KING / SORU |
| talk.js (219) | sesli sohbet sıra alma | KING |
| listen.js (128) | dikte (ses tanıma) | KABUK (giriş) |
| entry.js (416) | cümleden kayda | KING (kayıt niyeti) |
| komut.js (474) | cümleden plan aksiyonuna | KING (yönet niyeti) |
| kingarac.js (1059) | AYS'nin King'e açtığı araçlar | KING (≤12 üst araca indirilir) |
| kingveri.js (580) | King olayları ve yardım sağlayıcıları | KING |
| beacon.js (1090) | HKM işareti «varsa gönder» | Çekirdek (model ağ geçidi) / SORU |
| setup.js (445) | kurulum sihirbazı (5 adım) | KABUK (tek kurulum) + ALAN:Akademik adımı |
| bolum.js (80) | bölüm gizleme | KABUK (tek ayar şeması) |
| bilgiler.js (21) | modül sayılarının kesinlik etiketi | KABUK (sistem haritası) |
| ornekveri.js (69) | «ornek» profilinde bellek içi örnek veri | KABUK |
| components.js (694) | deklaratif bileşen seti (K.*) | KABUK |
| ui.js (962) | ikonlar, ölçüm görselleri, grafik, alt sayfa | KABUK |
| h.js (69) | şablon katmanı | KABUK |
| utils.js (75) | tarih/sayı/metin yardımcıları | KABUK (ortak `tarih.js`/`bicim.js` ile birleşir) |
| palette.js (582) | Ctrl+K komut paleti, odak modu | KABUK |
| xp.js, basarim.js, perde.js (kopya) | XP, başarım, perde (`brand/seviye`) | SORU (bkz. §7) |

## 4. Sayı hesaplayan kural motorları

Testler `AYS/src/tests/` (155 dosya). «Testi» sütunu: o ad alanını (`R.X`) çağıran test dosyaları (`grep -l "R\.X\b"`).

| Motor dosyası | Ne hesaplar (dışa açtığı) | Testi | Hedef motor |
|---|---|---|---|
| core/calc.js `R.Calc` | net (`rawScore`, `comparableNets`, `medianTrend`, `testMedian`), sıra (`rankForScore`, `estimateScore`, `netGapToTarget`), OBP (`obp`), hata (`errorPareto`, `errorDistribution`), kart borcu (`dueCards`, `overdueCards`, `cardDebt`), plan (`planCompletion`, `capacityLoad`, `timeRealization`), konu (`subjectClosure`, `topicRisk`, `riskRanking`), kapı (`currentGate`, `gateStatus`, `protocolTriggers`), ödül (`behaviorStreak`, `rewardTier`), uyku (`sleepAverage`), `gunSorusu` | 17 dosya (calc, engine, curriculum, beacon…) | Soru + Tekrar + Plan; uyku → ALAN:Uyku; ödül → §7 |
| core/state.js `schedule` (583) | SRS aralığı; `R.SRS_INTERVALS = [1, 3, 7, 30]` (`data/reference.js:140`) | features, learn, model, office, vitrin (`schedule`/`SRS_INTERVALS` geçen testler) | MOTOR:Tekrar |
| core/quiz.js `R.Quiz` | sınama havuzu, güven, kalıcılık (`brand/ortak/usta.js`) | engine, features | MOTOR:Tekrar |
| core/analytics.js `R.Analytics` | Theil–Sen eğimi, karşılaştırma, hata haritası | features.test.js | MOTOR:Soru |
| core/gelecek.js `R.Gelecek` | `theilSen`, `izdusum`, `senaryo`, `siraya`, `araliklar` | gelecek.test.js | MOTOR:Soru |
| core/denemeanaliz.js `R.DenemeAnaliz` | soru soru ayrıştırma, `karsilastir`, `ozet` | denemeanaliz.test.js | MOTOR:Soru |
| core/examrun.js `R.ExamRun` | süreli oturum, test/toplam süre | features.test.js | MOTOR:Soru |
| core/ogrentest.js `R.OgrenTest` | karma test, ÖSYM süre ölçeği | ogrentest, prova, derin, paragraf | MOTOR:Soru |
| core/evidence.js `R.Ev` | eşiğin yetki düzeyi | evidence.test.js | Çekirdek |
| core/planner.js `R.Planner` | `LEVELS`, `PHASES`, `TAVAN`, `topicDays`, havuz | planner, hedefler, features | MOTOR:Plan |
| core/hedefplan.js `R.HedefPlan` | `DENEME_ARALIK`, `TEKRAR_ARALIK`, `TEKRAR_DK`, önizleme | hedefler.test.js | MOTOR:Plan |
| core/istisna.js `R.Istisna` | istisnalı gün planı | 6 dosya (istisna, komut, kapsamkart…) | MOTOR:Plan |
| core/auto.js `R.Auto` | `draftWeek`, `syncDayBlocks`, öneriler | 7 dosya | MOTOR:Plan |
| core/ogrenyolu.js `R.OgrenYolu` | konu adımları, `siradaki`, `ozet` | ogrenyolu, ogren, ogrentest | MOTOR:Yol |
| core/xpsayim.js, basarimsayim.js | günlük iş ve ölçülmüş süre | xp, basarim, gunukapatays | MOTOR:Kayıt |
| core/calib.js `R.Calib` | tahmin isabeti | durustluk.test.js | SORU |
| core/goodhart.js `R.Goodhart` | gösterge çiftlerinde ayrışma | durustluk, iphone | ARŞİV |
| core/friction.js `R.Friction` | yönetim/çalışma oranı | durustluk, gunukapatays, storage | SORU |
| core/deney.js `R.Deney` | kişisel deney | gelecek.test.js | SORU |

Not: `R.Ev` (evidence) ile `R.Calc` kapıları birlikte çalışıyor; motorlar bölünürken eşik + kanıt birlikte taşınmalı.

## 5. Saklanan veri

**Depo kurulumu** (`AYS/src/js/core/store.js`): `R.SCHEMA_VERSION = 5`; `LIFEOS.Depo.kur({ appId:'rota-84285', profilAnahtari:'rota.activeProfile', varsayilanProfil:'main', yerelAnahtar: main → 'rota84285.v2', diğer profil → 'rota84285.v2.<profil>' })`.
Davranış ortak katmanda (`brand/ortak/depo.js`): tüm kayıtlar tek localStorage anahtarında tek JSON sözlük (`LOCAL_KEY`, satır 59, 120, 158); `window.claude.use('db')` varsa bulut kipi (satır 233-252). Yedekten yükleme öncesi kopya `LOCAL_KEY + '.oncesi'` (UNDO_KEY, satır 63).
**Yedek biçimi** (`depo.js` `exportAll`, satır 347): `{ __meta:{ app:'rota-84285', schemaVersion, exportedAt, mode }, data:{ '<koleksiyon>/<id>': kayıt, … } }`. `readBackup` başka `app` kimliğini ve daha yeni sürümü reddeder; düz sözlük (eski biçim) `schemaVersion:1, legacy:true` sayılır.
**Göçler** (`core/state.js` `migrate`, satır 1141-1192): v2→v3 videoNotes/activities/mood/breaks kapları; v3→v4 takvim istisnaları, süreli oturumlar, profiller; v4→v5 «uydurma sıfır» onarımı (deneme testlerinde `blank` ve `blankCert: measured|derived|missing`). Künyesi olmayan depo v1 sayılır (`metaKunyesi`, satır 1213).

**`R.S` üst düzey alanları ve depo anahtarları** (`core/state.js` satır 14-59, yükleme 1223-1310):

| Alan (`R.S.`) | Depo anahtarı | Ne tutar | Yazan dosya |
|---|---|---|---|
| route, ready, sidebarOpen, ui{…} | — (bellekte) | ekran durumu, sekme seçimleri (`ui.examTab`, `cardTab`, `rutbeTab`, `analyticsTab`, `guideTab`, `quiz*`, `meeting*` …) | ekranlar |
| profile | `profile/main` | sınav, hedef, ayarlar, koç üslubu | state.js 688 |
| weeks | `weeks/<wNN>` | hafta sözleşmesi | state.js 359 |
| days | `days/<YYYY-AA-GG>` | gün kaydı (bloklar, süre, durum) | state.js 442, istisna.js |
| exams | `exams/<id>` | denemeler (test test doğru/yanlış/boş, blankCert) | state.js 538 |
| errors | `errors/<id>` | yanlış defteri | state.js 552 |
| cards | `cards/<id>` | tekrar kartları (SRS) | state.js 575 |
| reviews | `reviews/<wNN>` | haftalık değerlendirme | state.js 626, kingarac.js |
| decisions | `decisions/<YYYY-AA>` | aylık karar kapısı | state.js 632, screens/progress.js |
| topics | `topics/<dersId>` | `states[konuId]` (durum, not) | state.js 480 |
| protocols | `protocols/<id>` | telafi protokolleri | state.js 647 |
| prefs | `prefs/main` | 24 satırlık tercih listesi | state.js 1135 |
| plan | `plan/main`, `plan/istisnalar` | üretilmiş kişisel program; tarihli istisnalar | state.js 259, proposals.js, istisna.js 72 |
| calendar | `calendar/<id>` | tatil / okul sınavı / yoğun gün | state.js 986 |
| sessions | `sessions/<id>` | süreli deneme oturumları (soru başı süre) | state.js 1026 |
| usage | `usage` | sürtünme ölçümü | friction.js 105 |
| forecasts | `forecasts/<id>` | kalibrasyon tahminleri | calib.js 134 |
| signals | `signals/<id>` | denetim sinyalleri | signals.js 90 |
| storage | `storage` | depo büyüme örnekleri | storage.js 137 |
| profiles | `profiles/<id>` | cihazdaki profiller | state.js 1054 |
| videoNotes | `videoNotes/<id>` | ders kaydı + zaman damgalı not | state.js 775 |
| solved | `solved/<id>` | çözülen sorular (metin/foto, anlatım, konu, zorluk) | solver.js, state.js |
| sources | `sources/<id>` | yayınlar, ölçülen zorluk | sources.js |
| activities | `activities/<id>` | kullanıcının meşgaleleri | state.js 913 |
| mood | `mood/<tarih>` | enerji + not (günde 1) | state.js 932 |
| breaks | `breaks/<id>` | molalar | state.js 957 |
| meta | `meta/backup` | `{ lastBackupAt, schemaVersion, migratedAt }` | state.js 699, 1190 |
| storeHealth | — | son depolama hatası | — |
| hedefler | `hedefler/<id>` | hedef motoru kayıtları | hedefler.js 466 |
| hedefPlanlar | `hedefPlanlar/<id>` | hedef planları | hedefplan.js 241 |
| sinavProfilleri | `sinavprofil/<id>` | BAM'dan ek sınav profilleri | sinavprofil.js 171 |
| testKitaplari | `testkitabi/<id>`, `meta/testkitabiOturum` | BAM test kitapları, yarım oturum | testkitabi.js 181 |
| seviye | (XP defteri `brand/seviye/xp.js`) | XP özeti, yalnız XP yazar | xp.js |
| office | `office/settings` | sağlayıcı, model, ajan başına seçim | office.js 196 |
| officeChats | `office/chat-<ajan>` | ajan sohbetleri | office.js 1364 |
| officeMeetings | `meetings/<id>` | toplantı tutanakları | office.js 2044 |
| journal | `journal/<ajan>` | ajan defteri | journal.js 282 |
| officeBriefings | `briefings/<tarih>` | günlük brifing | office.js 875 |

**Başka `meta/*` anahtarları:** `meta/bolumler` (bolum.js), `meta/examrun` (examrun.js), `meta/ogren`, `meta/ogren-test`, `meta/ogren-paragraf`, `meta/ogren-cikmis` (ogren/ogrentest/paragraf/cikmis.js), `meta/sourceSeed` (sources.js); ortak modüllerden aynı depoya: `meta/hafiza` (hafiza.js), `meta/bamUrunleri` (urun.js), `meta/omAtolye`, `meta/omKayit` (ogrenmotor.js), `meta/seriDondurma` (seri.js), `defter/…`, `defterterim/…` (defter.js). Bunlar `R.S` dışında, kendi modüllerinde tutuluyor.
**Not:** `hkm` koleksiyonu beacon.js'te geçiyor (HKM işareti kuyruğu). localStorage'da depo dışı `lifeos.*` ve `rota.llm.*` anahtarları da var (ortak dosyalar: ayarlar.js, llm.js 75-76), bunlar birleşik veri katmanına ayrıca taşınmalı.

## 6. Öğrenme yol haritasına uygun içerik

`AYS/src/js/data/` 38 dosya, toplam 2 253 783 bayt (`wc -c`). Sayılar data dosyaları Node `vm` içinde yüklenip sayıldı (salt okur betik, depo dışında). Konu kimlikleri hepsi `R.SUBJECTS` içinde (anlatım ve derin için dışarıda kalan 0).

| İçerik | Dosya (bayt) | Yapı | Sayım | Kalite notu / hedef |
|---|---|---|---|---|
| Ders ve konu ağacı | subjects.js (32 826) `R.SUBJECTS` | ders: id, name, exam, questions, priority, weight, targetBand, topics, sources; konu: id, order, group, name, days, freq | 8 ders, 184 konu (tyt-turkce 21, tyt-matematik 35, tyt-fen 26, tyt-sosyal 30, ayt-matematik 22, ayt-fizik 18, ayt-kimya 13, ayt-biyoloji 19) | Yol haritasının iskeleti → ALAN:Akademik. Yalnız sayısal alan: subjects.js'de «edebiyat», «sosyal-2», «ayt-tarih», «ayt-cografya» geçmiyor (grep 0); sözel/eşit ağırlık için konu ağacı göremedim |
| Konu anlatımı | anlatim.js + anlatim-{ab,af,ak,am,tf,tm,tr,ts}.js (toplam ~565 KB) `R.KONU_ANLATIM` | konu → { giris, bolumler[{baslik, liste}], sorular[{soru, sec, dogru, cozum}] } | 184 konu, 744 soru, ~467 bin karakter | Ders ders bölünmüş, tam kapsam → MOTOR:Yol dersleri |
| Derin katman | derin.js + derin-*.js (~1,09 MB) `R.KONU_DERIN` | konu → { kazanim[], onKosul[], ornekler, kaliplar, hatalar, sorular[{seviye, soru, sec, dogru, ipucu, cozum}] } | 184 konu, 1 104 soru, 576 örnek, 552 kalıp, 552 hata; sorusuz konu 0 | `onKosul` alanı yol haritası bağımlılığı için hazır → MOTOR:Yol + MOTOR:Soru |
| Konu özeti | ozetler.js (143 322) `R.KONU_OZET` | konu → { ana, dikkat, ornek } | 184 | MOTOR:Tekrar kart kaynağı |
| Akıllı notlar | akilli.js (219 856) | `KONU_KAVRAMLAR` (184 konu), `KONU_KAYNAKLAR` (184), `AKILLI_NOTLAR` (13: id, duzey, baslik, kisa_not, taktik, neden, karsi_ornek, sinir, mini, tuzak), `OGRENME_STRATEJILERI` (6, kanıt künyeli) | yukarıdaki | Stratejiler tüm alanlara genellenebilir → MOTOR:Yol |
| Paragraf havuzu | paragraf.js (103 488) `R.PARAGRAF_HAVUZU` | { id, konu, seviye, soru, sec, dogru, ipucu, cozum } | 100 soru | ALAN:Akademik (Türkçe) → MOTOR:Soru |
| Çıkmış soru sıklığı | sorusiklik.js (2 541) `R.SORU_SIKLIK` | { kaynak, etiket, sinav, yillar, konular } | 1 tablo | Konu önceliği → MOTOR:Yol |
| 40 haftalık müfredat | curriculum.js (14 399) `R.CURRICULUM`, `R.PHASES`, `R.WEEKDAYS` | hafta: { n, title, topics, q, exam, check }; evre: { key, label, theme, weeks } | 40 hafta, 10 evre | planner.js bunun yerine kişiye özel program üretiyor (planner.js baş yorumu) → MOTOR:Plan varsayılanı |
| Deneme şablonları ve sıra referansı | reference.js (24 966) | `EXAM_TEMPLATES` (11: id, name, family, kind, duration, tests), `RANK_REFS` (4), `OBP`, `MONTH_GATES`, `KPI_DEFS` (8), `ERROR_TAGS` (5), `SRS_INTERVALS` | sayılar sütunda | ALAN:Akademik kuralları; sayılar koddan |
| Puanlama | scoring.js (5 211) `R.SCORING` | göremedim: alan dökümü yapılmadı | — | MOTOR:Soru |
| İpuçları | hints.js (21 512) `R.HINTS` | { t, b, more } | 79 | KABUK (yardım) |
| Not şablonları, koç üslupları, kötü gün | templates.js (3 760) | `NOTE_TEMPLATES`, `COACH_TONES`, `BAD_DAY`, `EXAM_WEEK_MODE`, `REWARD_TIERS` | — | MOTOR:Not / KING üslubu |
| Kaynak (yayın) tohumları | sources.js (3 965) | `SOURCE_LEVELS`, `SOURCE_KINDS`, `SOURCE_SEED` | — | ALAN:Akademik |

Kalite notları: anlatım ve derin katman 184 konunun hepsini kapsıyor ve aynı kimliklerle; `onKosul`, `kazanim`, `seviye` alanları Yol ve Soru motorlarının ortak biçimine en yakın veri. İçeriğin doğruluğu bu turda okunmadı (göremedim: içerik denetimi). `brand/ortak/ogrenmotor.js` ayrıca bir öğrenme motoru taşıyor; `screens/ogrenme.js` (baş yorumu) AYS'nin 184 konusunu bu motora bağlıyor ve cevabı `R.Ogren.cevapla` ile AYS konu kaydına da yazıyor. Yani aynı konu iki öğrenme yolundan (Öğren › Konular/Anlatım/Sorular ve Adım adım) geçiyor (bkz. §8).

## 7. Ofis, XP/rütbe/rozet, friction/goodhart/calib katmanları

### 7a. Ofis (ajanlar, koçlar)

| Parça | Yer | Ne var | Öneri |
|---|---|---|---|
| Ajan tanımları | data/agents.js (28 061 bayt) | 6 ajan: `patron`, `tyt`, `ayt`, `rehber`, `analist`, `koc` (Patron, Tuna, Yaman, Rana, Deniz, Kerem; `AYS/src/OFIS.md` tablo) + `MEETING_ORDER`, `OFFICE_PROMPTS`, `ACTION_OWNER` | KING devralır; ajan kişilikleri SİL |
| Ofis motoru | core/office.js (2193) | veri okuma, sohbet, toplantı, günlük brifing, `validate`, `generateCards` | `validate` ve `generateCards` → KING; toplantı SİL |
| Öneri kutusu | core/proposals.js (1436) + data/actions.js (17 eylem) | ofisin sisteme dokunduğu tek kapı; onay/geri al | KING teklif akışı (ortak `kingteklif.js` ile birleşir) |
| Ajan defteri | core/journal.js (373) | doğrulanmış gözlemler, güven | KING hafızası (`brand/ortak/hafiza.js` ile birleşir) |
| Veri okuma araçları | core/tools.js (419) | ajanların gördüğü özetler | KING bağlam kurucu |
| Ses | core/voice.js (500), talk.js (219), listen.js (128) | ajanların sesli okuması, sıra alma, dikte | talk/voice KING; listen KABUK |
| Ekranlar | office.js, team.js, meeting.js (toplam 2 804 satır) | Ekip özeti, Uzmana sor, Toplantı | §2 |
| Belge | AYS/src/OFIS.md (692 satır) | «kural motoru otoritedir» ilkesi | ilke King'e taşınır |

### 7b. XP, rütbe, başarım

| Parça | Yer | Ne var | Öneri |
|---|---|---|---|
| XP defteri | core/xp.js (1091, `brand/seviye/xp.js` kopyası) | `R.XP.durum`, `esitleCok`, `kutlandi` (app.js:232, 1241-1266) | SORU |
| Kademeler | data/kademeler.js (19 337 bayt) `LIFEOS.KADEMELER`, `XP_ETKINLIK`; `SEVIYE_SURUM = 4` | 6 kademe: Bronz, Gümüş, Altın, Yakut, Safir, Kutsal | SORU |
| Başarımlar | data/basarimlar.js (9 462 bayt), core/basarim.js (731, kopya) | 6 aile (gorev, gun, saat, odak, istikrar, kusursuz); eşik sayıları 6, 6, 6, 10, 6 ve kusursuz için `['gun','hafta','ay']`; 5 mühür (`MUHURLER`), `ONUR` | SORU |
| Perde | core/perde.js (1065, kopya) | tam ekran marka girişi ve rütbe kutlaması | ARŞİV |
| Sayımlar | core/xpsayim.js (59), basarimsayim.js (65) | günün işi, ölçülmüş süre | MOTOR:Kayıt (sayım kalır, XP'den bağımsız) |
| Ödül eşiği | data/templates.js `REWARD_TIERS`, calc.js `rewardTier`, `behaviorStreak`, `todayReward` | davranış serisine bağlı ödül | SORU |
| Ekran | screens/rutbe.js (1099) | 5 sekme | SORU |

### 7c. Dürüstlük ve denetim katmanları

| Parça | Yer | Ne ölçer | Nerede görünür | Öneri |
|---|---|---|---|---|
| Sürtünme | core/friction.js (232) | sistemi yönetme süresi / çalışma süresi | app.js:1416-1427 her ekranda sayar; Analiz › Neden? › Alışkanlık ve denetim | SORU (ölçüm ucuz, ekranı ARŞİV) |
| Goodhart nöbetçisi | core/goodhart.js (304) | gösterge çiftlerinde ayrışma | Analiz › Neden? (analytics.js:622-664); signals.js:126, 147 de çağırır | ARŞİV |
| Kalibrasyon | core/calib.js (363) | kendi tahmininin isabeti | Deneme ekranı (`Calib.open/settle`), Neden? | SORU |
| Sinyaller | core/signals.js (296) | açık denetim soruları | Bugün (today.js:860, 1839, 2306) | ARŞİV |
| Bölüm denetimi | core/audit.js (472) | «bir şey ters mi?» bulguları | Analiz › Neden? › Alışkanlık ve denetim (analytics.js:740-751, `R.Audit.all/of`) | ARŞİV |
| Kanıt motoru | core/evidence.js (284) + data/evidence.js | eşiğin yetki düzeyi | calc kapıları | Çekirdek (kalır) |
| Belge | AYS/src/DURUSTLUK.md (170 satır) | üç katmanın gerekçesi | | |

Plan kuralı «numbers and decisions come from code» ile uyumlu olan: evidence + calc kapıları. Öğrenme yol haritasında bir adıma hizmet etmeyen: goodhart, signals, audit, perde, ajan kişilikleri.

## 8. İlk 10 kaldırma / birleştirme adayı

| # | Aday | Kanıt (dosya, satır sayısı) | Plan kuralı | Öneri |
|---|---|---|---|---|
| 1 | **Ofis bütünü** | core/office.js 2193, proposals.js 1436, journal.js 373, tools.js 419, voice.js 500, talk.js 219; screens/office.js 1274, team.js 591, meeting.js 939; data/agents.js 6 ajan | King tek asistan; «bir özellik bir yer» | KING: `validate`, `generateCards`, teklif kapısı, defter → King; ajan kişilikleri, toplantı, brifing SİL; tutanaklar ARŞİV |
| 2 | **Rütbe / XP / başarım / perde** | xp.js 1091, basarim.js 731, perde.js 1065 (üçü `brand/seviye` kopyası), rutbe.js 1099, kademeler.js, basarimlar.js, calc `rewardTier` | «Alanın kendi XP'si yok»; öğrenme adımına hizmet etmiyor | ARŞİV (veri kalır); sayımlar (xpsayim, basarimsayim) MOTOR:Kayıt'a |
| 3 | **Dürüstlük/denetim katmanı** | goodhart.js 304, signals.js 296, audit.js 472; ekranı analytics.js:182 «Alışkanlık ve denetim», Bugün'de sinyal kartı (today.js:860) | öğrenme adımı değil; «bir ekran bir iş» (Bugün'e soru kartı ekliyor) | ARŞİV; friction ve calib için §9 |
| 4 | **Dört pratik yolu** | Tekrar (cards.js), Kendini sına (quiz.js 661), Öğren › Sorular 5 kip (ogren.js), Tekrar › Yanlışlar ↔ Sorular › Yanlışlarım | «bir özellik bir yer» | Tekrar motoru (kart + sına) ve Soru motoru (soru, karma, prova, yanlış defteri) olarak ikiye in |
| 5 | **İki öğrenme yolu** | Öğren (screens/ogren.js 2078 + core/ogren.js 494, ogrenyolu.js 139) ve Adım adım (screens/ogrenme.js → `brand/ortak/ogrenmotor.js`) aynı 184 konuyu sunuyor | «bir özellik bir yer», öğrenme önce | MOTOR:Yol tek akış; içerik (§6) aynen taşınır |
| 6 | **Konu beş yerde** | Konu takibi (subjects.js 707), Konu sayfası (topic.js 469, 11 blok), Öğren › Konular, İlerleme › Yol, Neden? › Konu değeri | «bir özellik bir yer» | Akademik alanında tek konu sayfası (Yol motoru) |
| 7 | **Sınav analizi dört yerde** | Deneme › Özet (exams.js), İlerleme › Netler (progress.js), Tahmin (gelecek.js), Neden? karşılaştırma/hata/sıra (analytics.js) | «bir ekran bir iş» | MOTOR:Soru'nun tek «sınav analizi» görünümü; sayılar `R.Calc`/`R.Gelecek`ten |
| 8 | **Hedef ve plan dağınık** | Plan › Hedefler (target.js), Bugün'de hedef yönetimi (today.js `Hedefler.*`, `HedefPlan.*`), Program (plan.js + planner.js), Hafta › Sözleşme (week.js), Telafi (protocols.js) | «bir özellik bir yer» | MOTOR:Plan tek plan; sıra/net/tercih hesabı ALAN:Akademik kuralı |
| 9 | **Notlar beş yerde** | Ders notları (learn.js, videoNotes), Anlatım › Notum ve Notlar (ogren.js:962, 965), Öğren › Notlarım (ogren.js:526), Konu sayfası › Notlar (topic.js:382), Kütüphanem › Notlar (kutuphane.js:129, ortak defter) | «bir özellik bir yer» | MOTOR:Not tek defter, konuya etiketli |
| 10 | **Model girişleri dağınık + sağlık verisi AYS'de** | Soru çöz › Sor (solver.js 620), Öğren › Koç, konusor.js, entry.js, komut.js, kingarac.js 1059; ayrıca uyku/enerji/mola: protocols.js (11 «sleep/uyku» geçişi), calc.js `sleepAverage` (330), `S.mood`, `S.breaks`, ajan Rana | King niyet → bağlam → ≤12 araç; alanın kaydı kendi alanında | Model girişleri KING; uyku/enerji ALAN:Uyku, mola/ruh hali MOTOR:Kayıt |

## 9. Sahibine açık sorular

1. **Rütbe/XP:** Alanlarda XP olmayacak. Ortak tek bir ilerleme göstergesi (kabukta) kalsın mı, yoksa XP, başarım ve perde tamamen ARŞİV'e mi gitsin? (`brand/seviye` üç modülü birden etkiler.)
2. **Kalibrasyon ve sürtünme:** `calib.js` (deneme öncesi tahmin) ve `friction.js` (yönetim süresi) ölçümü arka planda sürsün mü, yoksa ekranlarıyla birlikte ARŞİV mi?
3. **Haftalık sözleşme ve aylık karar kapısı:** «imza» ritüeli (week.js Sözleşme) ve aylık karar formu (progress.js Karar) Plan motorunun kuralı mı olsun, kalksın mı?
4. **Deney** (gelecek.js › Deney, core/deney.js) ve **veli/koç raporu** (haftarapor.js): kalsın mı?
5. **Çok profil** (`rota84285.v2.<profil>`, profiles.js, gözetmen kartı): tek kullanıcıya iniliyor mu? Birleşik depoda profil kavramı gerekli mi?
6. **Ofis tutanakları, sohbetler, ajan defteri** (`meetings/`, `office/chat-*`, `journal/`, `briefings/`): ARŞİV'e taşınsın mı, silinsin mi?
7. **Sınav kapsamı:** konu ağacı yalnız sayısal (8 ders). Akademik alanı sözel/eşit ağırlık ve sınav dışı (üniversite dersi vb.) yol haritalarını da kapsayacak mı?
8. **Test kitabı / sınav profili (BAM):** BAM kalkarsa `testkitabi/`, `sinavprofil/` verisi ve Kütüphanem › Kitaplar nereye gider (Arama motoru mu, ARŞİV mi)?
9. **Telafi protokolleri ve kötü gün:** Plan motorunun genel kuralı mı (bütün alanlar için), yoksa yalnız Akademik'e mi ait?
10. **Bulut eşitleme:** depo `window.claude.use('db')` ile bulut kipine geçebiliyor (`brand/ortak/depo.js:233`). Birleşik veri katmanında bu yol kalacak mı?
