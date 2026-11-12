# SPİ envanteri (sadeleşme keşfi)

Kaynak: `C:\Users\ASUS\LifeOs-sadelesme` (origin/main kopyası, d375ef2d). Salt okunur keşif; her iddia dosya yolu ile. Bulamadığım şey «göremedim».

## 1. Özet sayılar

| Ne | Sayı | Kanıt |
|---|---|---|
| Ekran dosyası | 20 | `SPI/src/js/screens/*.js`; `rutbe.js` üretilmiş kopya (kaynak `brand/seviye/rutbe.js`, dosyanın 1-3. satırı) |
| Menüye kayıtlı sayfa | 21 (20 SPİ + ortak Kılavuz) | `PARCA.sayfa(` satırları: her ekran dosyasının başı; `core/kilavuz.js:170` |
| Menüde olmayan ekran | 3 | `gun` (Bugün › Ayrıntı, `today.js:2388`, `app.js` `UST`), yardımcı yüzler `fotoui.js`, `hatirlatui.js` |
| Kullanılan çekmece | 8 / 9 | `brand/ortak/kabuk.js` `CEKMECELER` 9 çekmece; SPİ `ogren` çekmecesine sayfa koymuyor |
| Ekran içi sekme (`TABS` dizileri) | 40 | analytics 10, labs 7, move 6 (Bugün + 4 alan `data/movement.js:272` + İlerleme), rutbe 5, basket 4, guide 4, meals 4 |
| Sayfa içi bölüm (`SayfaBolumleri`) | 3 | Bugün › Ayrıntı: Giriş · Özet · Geçmiş (`today.js:1899`) |
| Kayıtlı ekran bloğu (`PARCA.blok`) | 76 | today 12, office 12, meeting 8, kitchen 7, team 7, family 6, kutuphane 6, labs 3, diğerleri 1-2 |
| Çekirdek dosya (`SPI/src/js/core`) | 162 | 97'si `brand/ortak` kopyası (yalnız 3 satırlık «ÜRETİLMİŞ KOPYA» başlığı farklı, `tarih.js` ile denetlendi); **65 modüle özgü** |
| Veri dosyası | 20 | `SPI/src/js/data/*.js` |
| `brand/parcalar.txt` parça satırı (SPİ'de yüklenen) | 253 | [bas] 59 · [govde] 193 · [tembel] 1 (test hariç) |
| … bunlardan yalnız SPİ'ye ait | 57 | [bas] 2 (`css/rota.css`, `css/foto.css`) · [govde] 54 · [tembel] 1 (`js/data/ogrenme.js`) |
| Test parça satırı | 339 SPİ'de, 95 yalnız SPİ | `brand/parcalar.txt` [test] bölümü (satır 417-1009) |
| Ekran kodu satırı | 16 247 (+ `app.js` 2 280) | `wc -l`; en büyükler `today.js` 2 389, `labs.js` 2 008, `move.js` 1 985, `meals.js` 1 626 |
| Tasarım taslağı | 20 HTML + `index.html` + `OKU.md` | `SPI/tasarim/` |

## 2. Ekran envanteri

Okuma/yazma sütunu: `S.x` = bellek durumu (`core/state.js`), tırnaksız yol = depo anahtarı (§5). Ekranın kullandığı modüller `grep SP.<Modül>` sayımından.

| Görünen ad | Dosya | Ne yapar | Okur / yazar | Öneri | Yeni yapıda yeri | Not / risk |
|---|---|---|---|---|---|---|
| **Bugün › Genel bakış** | `today.js` | Günün tek sayfası; 11 yuvaya (y1-y11) blok dizer | Hedefler, Calc, Plan, Move, Signals, Nutri, Uyku, Hatirlat… (en çok `SP.Hedefler` 23) | KABUK | Kabuğun tek «Bugün»ü; bloklar motorlara dağılır | 2 389 satır, modülün en büyük ekranı |
| › Günün sorusu / Soru kartı (y1-y2) | `today.js:1784-1789` | Günde tek sinyal sorusu | `signals/*` (`core/signals.js`) | MOTOR:Kayıt | Kayıt'ın «eksik veri sor» kancası | Ortak `sorukart.js` kullanıyor |
| › Öğrenme tekrarı (y3) | `today.js:1791` | Öğrenme motorunun vadesi gelen kartı | `LIFEOS.OGRENMOTOR` | MOTOR:Tekrar | Tekrar | Zaten ortak kod |
| › Zamanı gelen iş (y3) | `today.js:1794` | Vakti gelen hatırlatmalar, «Hepsini aldım» | `hatirlat` | MOTOR:Plan | Plan | İlaç hatırlatması buradan da açılır |
| › Gün (y4) | `today.js:1797` | Günün planı/özeti | `S.planlar`, `haftaplan/*` | MOTOR:Plan | Plan | |
| › Acil uyarı (y5) | `today.js:1800` | Kırmızı bayrak / en acil uyarı | `S.flags`, `flags` | ALAN:Tahlil | Tahlil kuralı, kabuk uyarı şeridi | Güvenlik: kaybolmamalı |
| › Öğün kutusu (y6) | `today.js:1803` | Sıradaki boş öğünü adıyla ekler | `meals/<gün>` | MOTOR:Kayıt | ALAN:Beslenme kayıt türü «öğün» | |
| › Su (y7) · Enerji (y8) · Ölçüm (y9) | `today.js:1806-1814` | Bardak sayacı, enerji, sık 4 ölçüm | `vitals/<gün>` (`water`, `weight`…) | MOTOR:Kayıt | Beslenme (su), Uyku/Tahlil (ölçüm) | |
| › Hızlı giriş (y10) | `today.js:1815`, `core/quickentry.js` | Tek satırdan kayıt ayrıştırma | çok anahtar | MOTOR:Kayıt | Kayıt'ın tek giriş kutusu | King «kayıt» niyetiyle çakışır → §9 |
| › Onay bekleyen teklifler (y11) | `today.js:1818` | Onaylar'ın özeti | `office/proposals` | KING | King onay kapısı | Onaylar ile tekrar |
| **Bugün › Ayrıntı** (`gun`) | `today.js:2362` | Giriş · Özet · Geçmiş alt alta; tam ölçüm formu | `vitals/*`, `symptoms` | MOTOR:Kayıt | Kayıt'ın «günü düzenle» formu | Menüde yok; Özet kısmı Analiz ile tekrar |
| **Plan › Hedefler** | `today.js:2374` | Hedefler ve hekim talimatları | `hedefler/*`, `hekim/*` (`core/hedefler.js:228-272`) | MOTOR:Plan | Plan (hedef); hekim talimatı → ALAN:Tahlil | |
| **Plan › Planlar** | `planlar.js` | Beslenme/hareket/uyku/su/alışkanlık haftalık planı, 7 günlük uyum | `haftaplan/*` (`core/haftaplan.js:93`) | MOTOR:Plan | Plan | |
| **Çalışma › Öğün** › Öğünler | `meals.js:966` | Tek satır öğün girişi, ev ölçüsünden gram, emilim sütunu | `meals/<gün>`, `foods/*` | MOTOR:Kayıt | ALAN:Beslenme | Giriş sıfır sürtünme sözü (dosya başı) |
| › Gidişat | `meals.js` | Besin dağılımı, günlük toplamlar | `S.meals`, `SP.Nutri` | ALAN:Beslenme | Beslenme alan özeti | |
| › Ne yesem | `meals.js` | Günlük enerji ihtiyacı + eksik besine öneri | `SP.Nutri`, profil | ALAN:Beslenme | Beslenme kuralı | Sayı koddan; doz/teşhis yok |
| › Besin değeri | `meals.js` | Besin veritabanında gezinme | `data/foods.js`, `foods/*` | MOTOR:Yol | Beslenme yol haritası içeriği | |
| **Çalışma › Hareket** › Bugün | `move.js:293` | Toparlanmaya göre günün yük emri, seans kaydı | `workouts/*`, `S.progress`, `spi.canli.<profil>` | MOTOR:Kayıt | ALAN:Hareket | Kural: yük kendiliğinden artmaz |
| › Kardiyo · Kuvvet · Esneklik · Dinlenme | `move.js:294`, `data/movement.js:272` | Alan başına egzersiz listesi, kuvvette kalıp şeridi ve basamak merdiveni | `data/movement.js`, `data/egzersizkatalog.js`, `progress` | MOTOR:Yol | Hareket yol haritası («temelden antrenman») | En iyi yol haritası adayı |
| › İlerleme | `move.js` | Yük eğrisi, son hafta / son ay oranı, beden ölçüleri | `workouts/*`, `vitals` | ALAN:Hareket | Hareket alan özeti | |
| **Çalışma › Testler** › Sonuçlar | `labs.js:278` | Tek rapor görünümü, eşik rengi, «karar hekimindir» | `labs/*`, `data/biomarkers.js` | ALAN:Tahlil | Tahlil | |
| › Test gir | `labs.js` | Rapor yapıştır (`core/parse.js`) ya da elle yaz | `labs/*` | MOTOR:Kayıt | Kayıt türü «tahlil» | Ayrıştırıcı korunmalı |
| › İlaç | `labs.js` | İlaç listesi, etkileşim/tahlil notu, hatırlat | `meds/*`, `hatirlat` | SORU | Tahlil mi, Kayıt mı? | Öğrenme adımına hizmet etmiyor (§9) |
| › Geçmiş · Karşılaştır · Eğilim · Paneller («Daha») | `labs.js:282-285` | Aynı tahlil verisinin dört farklı görünümü | `labs/*`, `vitals` | ALAN:Tahlil (birleştir) | Tek Tahlil görünümü + Kayıt'ın eğilim grafiği | «Bir iş bir yer» ihlali |
| **Çalışma › Mutfak** | `kitchen.js` | Tek tencere yemeği haneye hedefe göre bölüştürme; evdekiler; özel tarif | `S.ui.kitchenDish`/`kitchenGrams` (geçici), `foods/*`, `data/foods.js`; evdekiler `core/evdeki.js` (bellekte). Kiler (`meta/kiler`) yalnız King aracında: `core/kingarac.js:245` | SORU | ALAN:Beslenme ya da ARŞİV | Hane özelliğine bağlı (§7) |
| **Çalışma › Bütçe** › Sepet · Aylık · Daha ucuzu · Fiyatlar | `basket.js:157` | Haftalık alışveriş maliyeti, besin kapsaması, ikame, fiş fiyatı | `basket`, `prices`, `meta/bamFiyat`, `data/prices.js` | ARŞİV | — | Öğrenme yoluna hizmet etmiyor; sahibi isterse SORU |
| **Analiz** › Özet | `analytics.js:160`, `today.js` `ozet()` | Bugünün karoları, dönen kartlar, öneri | birçok | KABUK | Kabuk ana sayfa özeti | Bugün ile tekrar |
| › Hafta · Gidişat | `analytics.js` | Haftalık sayılar, ölçüm eğrisi | `vitals`, `meals`, `workouts` | MOTOR:Kayıt | Kayıt'ın ortak eğilim görünümü | |
| › Birlikte değişenler | `analytics.js`, `core/calc.js` | Alanlar arası korelasyon, «nedensellik değil» kuralı | tüm günlük veri | MOTOR:Kayıt | Kayıt analizi; King yalnız anlatır | Ortak gün sayısı eşiği korunmalı |
| › Haftalık rapor | `analytics.js` | Konsolide haftalık rapor | `briefings/*` | KING | King «yönet» niyeti | |
| › Eksik kayıtlar | `analytics.js`, `core/audit.js` | Kayıt boşluk denetimi | tüm günlük veri | MOTOR:Kayıt | Kayıt | |
| › Sistemin karnesi | `analytics.js`, `core/calib.js`, `core/goodhart.js`, `core/friction.js` | Tahmin isabeti, Goodhart, sürtünme | `forecasts/*`, `usage` | ARŞİV | — | §7 |
| › Bilgi ve kavramlar | `analytics.js`, `data/ogrenme.js` | Fizyoloji kavram kartları | veri dosyası | MOTOR:Yol | Alan yol haritaları | |
| › Yol haritası | `analytics.js`, `core/rota.js` | Sağlık yol haritası | `S`, `data/rules.js` | MOTOR:Yol | Yol | |
| › Veri aktar | `analytics.js`, `core/saglikice.js` | Sağlık uygulaması dışa aktarımını içe alma | `meta/saglikIceAktarim` | KABUK | Çekirdek içe aktarım | |
| **Onaylar › Bekleyen** | `onaylar.js` | King, HKM ve yarım kalmış teklifler tek yerde | `office/proposals`, `hkmIntentLog` | KING | King onay kapısı | |
| **Kütüphanem › Notlar** | `kutuphane.js:194` | Notlar ve belgeler, defter özeti | ortak `notum.js`/`defter.js` | MOTOR:Not | Not | |
| › Öğrenme | `ogrenme.js` | SPİ bilgisini ortak öğrenme motoruna bağlar | `data/ogrenme.js`, `data/rehber.js` | MOTOR:Yol | Yol + Tekrar | Kod ortak |
| › Anlatımlar | `rehber.js` | Konu anlatımları okuyucusu | `data/rehber.js` | MOTOR:Yol | Yol içeriği | |
| › Bilgi ve ürünler | `kutuphane.js:60` | BAM'dan bilgi iste, yerler, BAM ürünleri | `meta/bamFiyat`, `meta/yerler`, ortak `urun.js` | MOTOR:Arama | Arama | |
| **Ofis › Danışma** | `team.js` | Ajana doğrudan soru; rozet (model/kural) | `chats/<ajan>`, `SP.Talk` | KING | King «sohbet» | |
| **Ofis › İnceleme** | `meeting.js` | Kural motorunun haftalık incelemesi (gündem, bulgu, karar) | `meetings/*`, `core/inceleme.js` | KING | King «yönet»; sayılar koddan | |
| **Ofis › Uzmanlar** | `office.js` | Beş masa, ajan brifingleri, Patron masası | `office`, `briefings/*` | SİL | — (kural çıktıları King bağlamına) | §7 |
| **Ayarlar › Profil** | `family.js` | Profil, hedef, hane, tercihler, gizlilik kilidi | `profile`, `prefs`, `spi.household` | KABUK | Tek hesap/profil | Hane çoklu profil → §9 |
| **Ayarlar › Genel** › Kullanım · Yapay zekâ · Veri · Sınırlar | `guide.js:225` | Rehber, model ayarı, yedek, sistemin sınırları | `storage`, `hkm`, `SP.Beacon` | KABUK | Tek ayar şeması; «Sınırlar» metni alan kurallarına | Sınırlar metni güvenlik sözüdür, kaybolmamalı |
| **Ayarlar › Rütbe** › Şu an · Merdiven · Başarımlar · XP nereden gelir · Defter | `rutbe.js:159` | XP, rütbe, başarım | `seviye`, `basarim` | SORU | ARŞİV ya da tek kabuk XP | Sahibi «dokunma» demişti (`belgeler/ekip/sadelik/spi.md:49`) |
| **Ayarlar › Kılavuz** | ortak `core/kilavuz.js` | Kullanım kılavuzu | — | KABUK | Kabuk | Ortak kod |
| (yardımcı) Foto karesi | `fotoui.js`, `core/foto.js`, `core/kamera.js` | Kayda bağlı 40 px foto, geri sayımlı kamera | IndexedDB `spi-foto` | MOTOR:Kayıt | Kayıt eki | Foto yedeğe girmez (§5) |
| (yardımcı) Hatırlatma yüzü | `hatirlatui.js`, `core/hatirlat.js` | Hatırlatma düzenleme sayfası | `hatirlat` | MOTOR:Plan | Plan | |

## 3. Modüle özgü çekirdek dosyalar

`SPI/src/js/core` içinde `brand/ortak`'ta adı olmayan 65 dosya. Bunlardan 3'ü (`basarim.js`, `perde.js`, `xp.js`) yine üretilmiş kopyadır, kaynağı `brand/seviye/` (dosyaların 2. satırı). Rol, dosyanın ilk yorum satırından; satır sayısı `wc -l`.

| Dosya | Satır | Rol | Öneri |
|---|---|---|---|
| `state.js` | 1 084 | Veri modeli, yükleme/kaydetme, normalleştiriciler | KABUK (Çekirdek tek depoya göç kaynağı) |
| `store.js` | 25 | Ortak `depo.js` ayarı: anahtar `spi.v1.<profil>`, `appId:'spi-saglik'` | KABUK |
| `storage.js` | 305 | Depo sağlığı (dolma, boyut) | KABUK |
| `setup.js` | 232 | İlk açılış soruları | KABUK |
| `ui.js` · `components.js` · `h.js` · `parts.js` · `utils.js` · `memo.js` | 928 · 713 · 69 · 159 · 99 · 60 | Arayüz parçaları, bileşen seti, şablon, ortak SPİ parçaları, yardımcılar, çizim önbelleği | KABUK (ortak bileşenlerle birleşir; `utils.js` ↔ ortak `tarih.js`/`bicim.js` tekrarı) |
| `palette.js` | 346 | Ctrl+K komut paleti | KABUK |
| `bolum.js` | 104 | Bölüm gizleme (`meta/bolumler`) | KABUK (alan aç/kapa) |
| `bilgiler.js` | 12 | Bilgi parçaları kaydı (sayı + kesinlik etiketi) | KABUK |
| `ornekveri.js` | 58 | «ornek» profilinde belleğe örnek veri | KABUK |
| `saglikice.js` | 358 | Telefon sağlık verisi içe aktarma | KABUK (Çekirdek içe aktarım) |
| `beacon.js` | 981 | HKM işareti, niyet defteri `hkmIntentLog` | KABUK (Çekirdek eşitleme) + KING (teklif kuyruğu) |
| `bilgi.js` | 402 | BAM'ın besin, fiyat, yer kayıtlarını almak (`meta/bamFiyat`, `meta/yerler`) | MOTOR:Arama |
| `nutri.js` | 663 | Beslenme kural motoru (hedef, öğün hesabı, biyoyararlanım) | ALAN:Beslenme |
| `ogun.js` | 152 | Kullanıcının öğün adları ve saatleri | ALAN:Beslenme |
| `evdeki.js` | 128 | «Evde şunlar var, ne pişirebilirim?» | SORU (Mutfak ile) |
| `barkod.js` | 202 | Kişisel barkod defteri (`barkodlar`) | MOTOR:Kayıt |
| `move.js` | 470 | Hareket kural motoru (toparlanma, yük, günün emri) | ALAN:Hareket |
| `vucut.js` | 152 | Vücut kompozisyonu, kaynaklı formüller | ALAN:Hareket |
| `rota.js` · `canli.js` · `harita.js` | 492 · 466 · 173 | GPX çözümleme, canlı rota kaydı, harita çizimi | ALAN:Hareket |
| `uyku.js` | 81 | Gece uykusu ve kestirme | ALAN:Uyku |
| `bio.js` | 614 | Tahlil kural motoru (biyobelirteç durumu, bireysel eğilim) | ALAN:Tahlil |
| `evidence.js` | 343 | Kanıt motoru: bir eşiğin ne söylemeye yetkili olduğu | ALAN:Tahlil |
| `meds.js` | 164 | İlaç ve takviye kural motoru | ALAN:Tahlil (ekran kararı §9) |
| `symptom.js` | 200 | Semptom ve döngü kural motoru | ALAN:Tahlil |
| `money.js` | 413 | Fiyat, sepet, eşdeğer ikame motoru | ARŞİV |
| `parse.js` · `quickentry.js` · `extract.js` | 540 · 655 · 647 | Serbest metin → yapı; tek satır hızlı giriş; belge/fotoğraftan veri çıkarma | MOTOR:Kayıt |
| `dunku.js` · `hazir.js` | 74 · 151 | Dünkünün aynısı; hazır öğün/antrenman şablonu | MOTOR:Kayıt |
| `foto.js` · `kamera.js` | 202 · 303 | Kayda bağlı foto (IndexedDB), geri sayımlı kamera | MOTOR:Kayıt |
| `signals.js` | 297 | Günün sorusu sinyali (`signals/*`) | MOTOR:Kayıt |
| `audit.js` | 411 | Bölüm denetimi «ters giden bir şey var mı» | MOTOR:Kayıt |
| `calc.js` | 424 | Çapraz çıkarım ve sıradaki hamle | MOTOR:Kayıt (çapraz) · KING (sıradaki hamleyi anlatır) |
| `plan.js` · `haftaplan.js` · `hedefler.js` | 578 · 548 · 344 | Hedefi plana çevirme; haftalık planlar; hedef + hekim talimatı | MOTOR:Plan |
| `hatirlat.js` · `kotugun.js` | 405 · 65 | Hatırlatmalar; kötü gün (asgari gün) modu | MOTOR:Plan |
| `kingarac.js` | 1 202 | SPİ'nin King'e açtığı araçlar | KING (12 üst araç sınırına indirgenecek) |
| `kingveri.js` · `kingders.js` | 528 · 169 | King olayları/yardım sağlayıcıları; kavramı King dersine çevirme | KING · MOTOR:Yol |
| `proposals.js` | 1 019 | Öneri kutusu: ofisin sisteme dokunduğu tek kapı | KING (onay kapısı) |
| `inceleme.js` | 174 | Haftalık veri incelemesi | KING |
| `office.js` | 1 274 | Beş ajanın çalışma düzeni, brifing, toplantı, sohbet | SİL (kural çıktıları King bağlamına) |
| `talk.js` · `speak.js` · `voice.js` | 252 · 336 · 138 | Sesli sohbet sırası, ajan sesi, dikte | KING |
| `calib.js` · `goodhart.js` · `friction.js` | 349 · 300 · 209 | Kalibrasyon defteri, Goodhart nöbetçisi, sürtünme ölçer | ARŞİV (§7) |
| `tahmin.js` | 289 | Ruh hâlini kişisel veriden tahmin eden ağ | SORU |
| `xp.js` · `basarim.js` · `perde.js` (kopya) · `xpsayim.js` · `basarimsayim.js` | 1 091 · 731 · 1 065 · 63 · 61 | XP, başarım, kutlama perdesi ve sayımları | SORU (§7) |

## 4. Sayı hesaplayan kural motorları

Test sayısı = `SPI/src/tests/<ad>.test.js` içindeki `it(` satırı (sayıldı). Bunlar plan kuralı «sayılar koddan gelir» gereği **kalmalı**; yalnız yerleri değişir.

| Motor | Ne hesaplar (dışa açık işlevler) | Test | Klinik / güvenlik sınırı (kanıt) | Gideceği yer |
|---|---|---|---|---|
| `core/nutri.js` | `bmr` (Mifflin-St Jeor), `tdee`, `dayNeed`, `targets`, `labAdjust`, `dayTotals`, `absorbMeal` (biyoyararlanım: çay-demir), `gaps`, `windowAverage`, `householdSplit`, `portionGrams` | `nutri.test.js` 50 | Enerji hedefi bazal metabolizmanın altına inmez (`nutri.js:310`, `plan.js:205-212`) | ALAN:Beslenme |
| `core/plan.js` | Hedefi plana çevirir; kilo için `KCAL_KG = 7700` (`plan.js:94`) | `plan.test.js` 19 | Aynı BMR tabanı; plan hekim talimatıyla çakışınca `talimatEtkisi` | MOTOR:Plan |
| `core/bio.js` + `data/biomarkers.js` | `statusOf`/`refFor` (eşik bandı), `trendOf` (en az 3 nokta, `MIN_POINTS` `bio.js:185`), `baselineOf` (`BASELINE_MIN = 3`), `meaningfulChange`, `patterns`, `overdue`, `needsFasting` | `bio.test.js` 72 | «Bu bir teşhis değil, hekime yönlendirmedir» (`bio.js:17`); `data/biomarkers.js`: 58 belirtecin 40'ında sayısal kırmızı bayrak eşiği (`red:{above}` 16, `{below}` 7, ikisi 17), 18'inde `red:{}` boş; `data/rules.js` `SP.RED_FLAGS`, `SP.CLINICAL` | ALAN:Tahlil |
| `core/evidence.js` + `data/evidence.js` | Bir eşiğin kanıt derecesi ve söyleme yetkisi: `gradeOf`, `authorityOf`, `cap`, `temper`, `mayDirect` | `evidence.test.js` 32 | «Hekime başvur» cümlesi en zayıf dayanaktan çıkamaz (`evidence.js:21`) | ALAN:Tahlil (bütün alanların eşik kuralı olabilir) |
| `core/meds.js` + `data/meds.js` | Sayı üretmez: hangi ilaç hangi değeri etkiler (`affecting`, `distorts`, `explainChange`) | ayrı test göremedim; `bio.test.js` `SP.Meds` kullanıyor | «Hiçbir sayı üretmez ve hiçbir doz önermez» (`meds.js:8`, `meds.js:140`) | ALAN:Tahlil |
| `core/symptom.js` | Semptom penceresi, döngü uzunluğu (`periods`, `cycle`) | `symptom.test.js` 39 | Göremedim (açık teşhis cümlesi yok) | ALAN:Tahlil |
| `core/move.js` | `readiness` (uyku, HRV, nabız, ağrı puanı), `sessionLoad`, `acwr`, `weeklyGrowth`, `deloadWeek`, `prescription`, `progressionCheck` (3 seans / 14 gün, `move.js:386-387`) | `move.test.js` 50 | Haftalık yük %10'dan fazla artmaz (`move.js:291`); 5 haftada bir indirme (`move.js:267`); sistem yükü yalnız azaltabilir, asla artıramaz (`move.js:309-324`) | ALAN:Hareket |
| `core/vucut.js` | BKİ, bel/boy, Navy yağ oranı, yağsız kütle, Theil-Sen eğilim, enerji tahmini | `vucut.test.js` 7 | En az 6 tartı ve 14 gün yoksa söylenmez; «obez» gibi etiket yok, teşhis yok (`vucut.js:24-35`) | ALAN:Hareket (ya da Beslenme) |
| `core/rota.js` · `core/canli.js` | GPX'ten mesafe, süre, tempo, km dilimleri, tırmanış, rekorlar | `rota.test.js` 53 · `canli.test.js` 36 | — | ALAN:Hareket |
| `core/uyku.js` | Gece uykusu ve kestirme listesi, doğrulama (en çok 240 dk, günde 6 kestirme: `uyku.js:30`) | ayrı test göremedim; `gunluk.test.js` `SP.Uyku` kullanıyor | — | ALAN:Uyku |
| Uyku ortalaması | `move.sleepScore` ve `nutri.windowAverage`/`calc` içinden; ayrı bir uyku ortalaması motoru göremedim | — | — | ALAN:Uyku (yeni motorun ilk işi) |
| `core/calc.js` | `minimumDay`, `streak`, `dayStatus`, `nextAction` (öncelik sırası), `correlate` (en az 10 ortak gün, `MIN_PAIRS` `calc.js:233`), `crossFindings`, `weeklyReport` | `calc.test.js` 37 | Öncelik: kırmızı bayrak → güvenlik → ölçüm borcu (`calc.js:10`, `:148-154`); «korelasyon nedensellik değildir» (`screens/analytics.js:1-5`) | MOTOR:Kayıt (çapraz) |
| `core/money.js` | `basketTotal`, `basketCoverage`, `costPerNutrient`, `substitutesFor`, `budget` | `money.test.js` 42 | — | ARŞİV (Bütçe kalkarsa test de arşive) |
| `core/tahmin.js` | Ruh hâli tahmini, en az 20 gün (`tahmin.js:59`) | `tahmin.test.js` 6 | — | SORU |
| `core/audit.js` | Alan başına «ters giden bir şey var mı» | `audit.test.js` 16 | — | MOTOR:Kayıt |
| `core/hedefler.js` · `core/haftaplan.js` · `core/hatirlat.js` | Hedef ilerlemesi, plan uyumu (7 gün), hatırlatma vakti | 14 · 13 · 14 | Hekim talimatı hedeften üstündür (`hedefler.js` `hekim/*`) | MOTOR:Plan |
| `core/parse.js` · `core/extract.js` | Serbest metinden öğün/ölçüm/tahlil; belgeden değer | `parse.test.js` 52 · `extract.test.js` 16 | Çıkarılan değer «tahmin» etiketli; ölçülen «ölçüldü» (`state.js:154`, `meals.js` başı) | MOTOR:Kayıt |
| `core/calib.js` · `core/goodhart.js` · `core/friction.js` | Tahmin isabeti, gösterge sapması, sürtünme | `durustluk.test.js` 34 (üçünü birlikte) | — | ARŞİV |

Kesinlik etiketi her değerde: `cert` = `measured` / `estimated` / `derived` (`state.js:154`, `:162`, `:483`); ortak etiket listesi `brand/ortak/parca.js:65` (`ölçüldü`, `tahmin`, `hesaplandı`, `veri yok`). Kayıt motorunun tür kataloğu bu alanı zorunlu taşımalı.

## 5. Saklanan veri

**Depo:** `SPI/src/js/core/store.js` → `LIFEOS.Depo.kur({ appId:'spi-saglik', yerelAnahtar:p => 'spi.v1.' + p, profilAnahtari:'spi.activeProfile', varsayilanProfil:'ben' })`. Tek localStorage girdisinde yollu sözlük (`brand/ortak/depo.js:59` `LOCAL_KEY`); önce Artifact «db» yeteneği denenir, yoksa localStorage (`depo.js:24`). **Şema sürümü:** `SP.SCHEMA_VERSION = 1` (`store.js`).

**Göç:** `state.js:944` `migrate()` yalnız `meta.schemaVersion`'ı yazar, veri dönüştürmez. Gerçek uyum tembel normalleştiricilerde: `normLab` (çıplak sayı → `{v, cert:'measured'}`, `fasting:'unknown'`; `state.js:143-158`), `normDayMeals` (öğe `cert:'estimated'`; `:160`), `normWorkout` (`:169`), `normFood` (`:328`), `normMed` (bilinmeyen tür → `diger`; `:409`).

**Profil başına anahtarın içindeki yollar** (`SP.Store.get/set/list` çağrıları ve dosyalardaki sabitler):

| Yol | Tür | Ne tutar | Kanıt | Kayıt motoru kataloğu |
|---|---|---|---|---|
| `meta` | tek | `{schemaVersion}` | `state.js:958` | Çekirdek |
| `profile` | tek | `id, name, role(self/family), birthYear, sex, heightCm, weightKg, activity, goal, conditions[], theme, palette, design, pinned[], createdAt` | `state.js:178-200` | Çekirdek hesap |
| `prefs` | tek | `weeklyBudget, householdSize, units, showEstimates, autoBriefing` | `state.js:215` | Çekirdek ayar |
| `vitals/<gün>` | gün | `sbp, dbp, rhr, hrv, spo2, temp, sleep, weight, waist, bodyfat, soreness, water, note, symptoms{}, symptomsLogged, period` | `state.js:608-612` | **ölçüm** (Uyku, Tahlil, Beslenme-su) |
| `meals/<gün>` | gün | `{date, rows:[{id, slot, items[{…, cert}], note, at}]}` | `state.js:661-668` | **öğün** (Beslenme) |
| `workouts/<id>` | kayıt | `id, date, templateId, name, kind, items[{exId, levelId, sets, reps, minutes}], minutes, rpe, note, createdAt` | `state.js:699` civarı `newWorkout` | **antrenman** (Hareket) |
| `labs/<id>` | kayıt | `id, date, time, lab, fasting, source, values{belirteç:{v, cert}}, note, createdAt` | `state.js:296-305`, `:143` | **tahlil** (Tahlil) |
| `meds/<id>` | kayıt | `id, kindId, name, dose, startDate, endDate, note, createdAt` | `state.js:400-405` | **ilaç** (Tahlil; §9) |
| `foods/<id>` | kayıt | Kendi besinin: `kcal, p, f, sat, c, sugar, fib, micro{}, flags[], portions[], aliases[], custom` | `state.js:328-345` | Beslenme içeriği |
| `progress` | tek | Egzersiz başına basamak (merdiven) | `state.js:1024` | Hareket |
| `basket` · `prices` | tek | `items[], weeklyLimit, monthlyLimit, testFee, equipment[]`; kullanıcının fiyatları | `state.js:755-758`, `:1026` | ARŞİV |
| `flags` | tek | Kırmızı bayraklar | `state.js:1028` | Tahlil (güvenlik) |
| `decisions/<id>` | kayıt | Kullanıcı kararları | `state.js:884`, `:1029` | Plan / King |
| `hedefler/<id>` · `hekim/<id>` | kayıt | Hedefler; hekim talimatları | `hedefler.js:228-272` | Plan; Tahlil |
| `planlar` · `haftaplan/<id>` | tek / kayıt | Plan motoru; haftalık planlar | `plan.js:95`, `haftaplan.js:93` | Plan |
| `hatirlat` · `kotugun` · `barkodlar` | tek | Hatırlatmalar; kötü gün; barkod defteri | `hatirlat.js:55`, `kotugun.js:25`, `barkod.js:52` | Plan; Plan; Kayıt |
| `signals/<id>` · `forecasts/<id>` · `usage` | kayıt / tek | Günün sorusu; kalibrasyon tahminleri; sürtünme sayaçları | `signals.js:90`, `calib.js:144`, `friction.js:93` | Kayıt; ARŞİV; ARŞİV |
| `office` · `briefings/<gün>` · `meetings/<id>` · `chats/<ajan>` · `office/proposals` | tek / kayıt | Ofis ayarı, brifingler, inceleme kayıtları, ajan sohbetleri, öneri kutusu | `office.js:138-1259`, `proposals.js:101` | KING (sohbet ve teklif); brifing/toplantı ARŞİV |
| `hkmIntentLog` · `hkm` · `storage` | tek | HKM niyet defteri; HKM ve depo durumu | `beacon.js:645`, `depo.js:340` | Çekirdek |
| `seviye` · `basarim` | tek | XP ve başarımlar | `xp.js:76`, `basarim.js:64` | SORU |
| `meta/bolumler` · `meta/bamFiyat` · `meta/yerler` · `meta/saglikIceAktarim` · `meta/kiler` | tek | Gizli bölümler; BAM fiyat/yer; içe aktarım geçmişi; kiler | `bolum.js:34`, `bilgi.js:73-74`, `saglikice.js:62`, `kingarac.js:245` | Kabuk; Arama; Çekirdek; SORU |
| Ortak: `meta/hafiza`, `meta/bamUrunleri`, `meta/seriDondurma`, `meta/omKayit`, `meta/omAtolye`, `ogrenme`, `aliskanlik`, `notum/*`, `defterklasor/*` | — | Hafıza, BAM ürünleri, seri dondurma, öğrenme motoru, alışkanlık, notlar | `brand/ortak/hafiza.js:79`, `urun.js:80`, `seri.js:54`, `ogrenmotor.js`, `notum.js`, `defter.js` | Zaten ortak; tek depoya doğrudan |

**Profil dışı (cihaz geneli) anahtarlar:** `spi.activeProfile`, `spi.household` (hane listesi: ad, rol, temel ölçü; `state.js:237-238`), `spi.canli.<profil>` (süren canlı rota, `canli.js:119-121`), `lifeos.perde.ses` / `lifeos.perde.kutlama` (`perde.js:47,61`).

**Yedek biçimi:** `depo.js:347` `exportAll()` → `{ __meta:{ app:'spi-saglik', schemaVersion, exportedAt, mode }, data }`; `hkm`, `storage`, `usage` cihaza aittir, yedeğe girmez (`depo.js:340`). İçe alırken önce uygulama kimliği, sonra sürüm denetlenir; yeni sürümlü yedek reddedilir, eski düz sözlük `legacy` kabul edilir (`depo.js:363-382`).

**Fotoğraf:** IndexedDB `spi-foto`, depo `foto` (`foto.js:34`). Cihazdan çıkmaz, yedeğe girmez, uzun kenar ≤1080 px JPEG (~100-200 KB), sahip metni `hareket:<id>`, `ogun:<id>`, `besin:<id>`, `vucut:<gün>`, sahip başına tek foto, anahtar profil kimliğiyle başlar (`foto.js:1-21`). **Risk:** tek depoya göçte fotoğraflar ayrı taşınmazsa kaybolur.

## 6. Yol haritası için kullanılabilir içerik

Sayılar veri dosyaları Node `vm` içinde yüklenip dizi uzunluğu alınarak sayıldı (dosyalar yalnız okundu). Boyut `wc -c`.

| Dosya | Boyut | Yapı ve sayı | Kalite notu | Gideceği yer |
|---|---|---|---|---|
| `data/foods.js` | 44,7 KB | `FOODS` 93 besin, 12 kategori (yemek 20, sebze 10, süt 9…), 100 g başına `kcal p f sat c fib micro ironType flags portions aliases`; `MEAL_SLOTS` 6 | Kaynak dosya başında: TÜRKOMP + USDA, ev yemekleri tariften hesaplı (`foods.js:1-5`); besin başına kaynak alanı **yok**. 93'ünün de `micro`su dolu | ALAN:Beslenme içerik + Kayıt besin kataloğu |
| `data/nutrients.js` | 10,2 KB | `NUTRIENTS` 15, `ACTIVITY_LEVELS` 5, `GOALS` 4, `MACRO_RULES`, `ABSORB_FACTORS` 10 | Emilim katsayıları «çay-demir» gibi öğretilebilir kurallar | Beslenme yol haritası (temel kavramlar) |
| `data/movement.js` | 19,6 KB | `EXERCISES` 20 (`levels` merdiveniyle), `PATTERNS` 6, `AREAS` 4, `READINESS_BANDS` 5, `LOAD_RULES`, `SESSION_TEMPLATES` 6, `EX_ALIASES` 104 | Uygulamanın çalışan hareket merdiveni | ALAN:Hareket + MOTOR:Yol (basamak = ders) |
| `data/egzersizkatalog.js` | 246 KB, 4 748 satır | `PILOT_EGZERSIZLER` 57 kart (adım, nefes, hata kontrolü, alternatif, medya), `PROGRAMLAR` 20 | 50 kart «teknik uzman incelemesi bekliyor», `ready_for_app:false`; 7 başlangıç kartı `true`. 50'si `rights: Unlicense`. 20 programın hepsi «doz atanmamış editör taslağı» (`egzersizkatalog.js:1-3`) | MOTOR:Yol (Hareket yol haritasının ana gövdesi, inceleme şartıyla) |
| `data/met.js` | 130 KB, 42 satır | `MET_RECORDS` 1 111 etkinlik, `MET_CATS` 22 | 2024 Adult Compendium; popülasyon referansı (`met.js:1-4`) | MOTOR:Kayıt (hareket enerjisi hesabı) |
| `data/ogrenme.js` | 79,3 KB | `OGRENME_KAVRAMLAR` 30, `OGRENME_SORULAR` 50, `DERIN_ANALIZLER` 6, `KANIT_KARTLARI` 22, `SPOR_BESLENME` 12, `SPOR_KAYNAKLAR` 14 | 30 kavramın hepsi «uzman incelemesi bekliyor», `ready_for_app:false`; soruların inceleme alanı yok | MOTOR:Yol + MOTOR:Soru + MOTOR:Tekrar |
| `data/rehber.js` | 31,7 KB | `REHBER_KONULAR` 10 anlatım (Hareket 5, Beslenme 4, Toparlanma 1): `giris, kazanim, bolumler, akilda, kaynaklar`; `REHBER_SINIR` | 10'unun da `kaynaklar` alanı dolu | MOTOR:Yol (dersin metni) |
| `data/biomarkers.js` | 27,3 KB | `BIOMARKERS` 58 (`unit, panel, dir, ref, optimal, red, daily, nutrients, note`), `PANELS` 12, `DERIVED` 11 | Eşikler kural motorunun tabanı; anlatım değeri yüksek | ALAN:Tahlil (+ «tahlilini okumayı öğren» yolu) |
| `data/evidence.js` | 29,8 KB | `EVIDENCE` 82 kayıt, `EVIDENCE_GRADES` 4, kaynak/kesinlik/uygulanabilirlik/yetki tabloları | Hangi eşiğin ne kadar dayanağı olduğu | ALAN:Tahlil kuralı; Yol'da kaynak gösterimi |
| `data/symptoms.js` · `data/meds.js` | 6,5 KB · 6,9 KB | `SYMPTOMS` 18 (4 grup), `MED_KINDS` 18, `MED_AFFECTING` 33 | Teşhis/doz yok | ALAN:Tahlil |
| `data/rules.js` | 10,2 KB | `CLINICAL`, `RED_FLAGS`, `GROUNDING`, `PRIVACY`, `PRECEDENCE` 6, `MINIMUM_DAY`, `CERTAINTY` | Sistemin güvenlik anayasası | KABUK (tüm alanlara ortak kural) |
| `data/hints.js` | 21,4 KB | `HINTS` 56 ipucu | Ekran ipuçları; ekranlar değişince çoğu boşa düşer | SİL ya da Yol'a süz |
| `data/prices.js` | 6,3 KB | `PRICE_SEED` 5, `SUBSTITUTES` 10, `BULK_ITEMS` 8, `PRICE_AGE` 4 | Fiyat tahmini | ARŞİV |
| `data/agents.js` | 8,2 KB | `AGENTS` 5, `AGENDA_KINDS` 8, `NOTE_KINDS` 5 | Ofis ajanları | SİL (King'e ders olarak süzülebilir) |
| `data/basarimlar.js` · `data/kademeler.js` | 9,5 KB · 19,3 KB | Başarım ve kademe tabloları | Üretilmiş kopya, kaynak `brand/seviye/` (2. satır) | SORU (XP ile) |
| `data/providers.js` | 16,2 KB | Model sağlayıcıları | Üretilmiş kopya, kaynak `brand/ortak/providers.js` | KABUK (model geçidi) |
| `data/designs.js` · `data/build.js` | 0,7 KB · 0,2 KB | Tasarım seçimi, yapı damgası | — | KABUK |

## 7. Ofis, XP/rütbe/başarım, sürtünme/goodhart/kalibrasyon/kanıt, ev/profil

| Katman | Ne var, nerede | Kim kullanıyor | Öneri | Gerekçe |
|---|---|---|---|---|
| **Ofis (beş ajan)** | `data/agents.js` (`AGENTS` 5: Patron, Kerem-tahlil, Nesrin-beslenme, Barış-hareket, Sedef-bütçe), `core/office.js` 1 274 satır, `SPI/src/OFIS.md` 199 satır; ekranlar Danışma (`team.js`), İnceleme (`meeting.js`), Uzmanlar (`office.js`); depo `office`, `briefings/*`, `meetings/*`, `chats/*` | `SP.Office`: `extract, inceleme, proposals, talk, guide, meeting, team, today, app` | SİL (ekranlar), KING (Danışma), kural cümleleri King bağlamına | Plan: «alanın ofisi yok», King tek konuşan. Ajan rozetleri (model mi kural mı) King'e taşınmalı |
| **Öneri kutusu / Onaylar** | `core/proposals.js` 1 019 satır, depo `office/proposals`; ekran `onaylar.js` | `beacon, bolum, gunluk, plan, vitrin` testleri; `today` y11 | KING | King'in onay kapısıyla aynı iş; tek yer olmalı |
| **İnceleme** | `core/inceleme.js` 174 satır: haftanın sayıları, gündem, bulgu (kural motorundan) | `meeting.js`, `today.js` | KING («yönet» niyeti; sayılar Kayıt'tan) | Sayılar koddan, model yalnız anlatır kuralına zaten uyuyor |
| **Ses** | `core/talk.js`, `core/speak.js`, `core/voice.js` (sesli sohbet, ajan sesi, dikte) | `team.js`, `meeting.js`, `rehber.js`, `ogrenme.js` | KING | Ses King'in giriş kanalı |
| **XP / rütbe / başarım** | `core/xp.js`, `core/basarim.js`, `core/perde.js` (üçü `brand/seviye/` kopyası), `screens/rutbe.js` (kopya), `data/basarimlar.js`, `data/kademeler.js` (kopya); SPİ'ye özgü sayımlar `core/xpsayim.js`, `core/basarimsayim.js`; depo `seviye`, `basarim` | `beacon, ui, rutbe, today, app` | SORU | Plan: «alanın kendi XP'si yok». Sahibi 2026-11-06'da «Rütbe'ye dokunma» demiş (`belgeler/ekip/sadelik/spi.md:49`, `:111`) |
| **Sürtünme ölçer** | `core/friction.js` 209 satır, depo `usage` (cihaza ait, yedeğe girmez) | `signals, state, storage, analytics, app` | ARŞİV | Öğrenme adımına hizmet etmiyor; ölçüm verisi saklanır |
| **Goodhart nöbetçisi** | `core/goodhart.js` 300 satır | `signals, analytics` | ARŞİV | Aynı |
| **Kalibrasyon defteri** | `core/calib.js` 349 satır, depo `forecasts/*` | `state, analytics` | ARŞİV | Aynı; 3'ünün ortak testi `tests/durustluk.test.js` (34 `it`) |
| **Sinyal katmanı** | `core/signals.js` 297 satır, depo `signals/*`; Bugün'de «Günün sorusu» | `state, analytics, today, app` | MOTOR:Kayıt | Eksik veriyi soran tek soru; Kayıt'a yarar |
| **Kanıt motoru** | `core/evidence.js` (`SP.Ev`) + `data/evidence.js` (82 kayıt) | `nutri.js`, `labs.js`, `guide.js` | ALAN:Tahlil (kalmalı) | Klinik sınırın kendisi: eşiğin yetkisi (`evidence.js:21`) |
| **Kişisel tahmin ağı** | `core/tahmin.js` 289 satır (ruh hâli, en az 20 gün) | `analytics, app` | SORU | Öğrenmeye hizmeti belirsiz |
| **Profil** | `screens/family.js` blokları: Profil, Hedefler, Hane, Tercihler, Gizlilik kilidi (ortak `core/kilit.js`); depo `profile`, `prefs` | — | KABUK | Tek hesap/profil |
| **Hane (çoklu profil)** | Cihaz geneli liste `spi.household` (`state.js:237-241`); her profil ayrı depo `spi.v1.<profil>`; profil değişince sayfa yeniden yüklenir (`family.js` başı); Mutfak `nutri.householdSplit` | `family.js`, `kitchen.js`, `nutri.js` | SORU | Tek kişilik plan («bir kişi için») ile çelişir; ama ayrı profil verisi silinemez |

## 8. İlk 10 kaldırma / birleştirme adayı

Sıra: kazanılan sadelik ÷ kayıp riski. «Silinen ekran»da kural motoru ve veri **kalır** (§4, §5).

| # | Aday | Ne olur | Plan kuralı | Kazanç / risk |
|---|---|---|---|---|
| 1 | Ofis › Uzmanlar (`screens/office.js` 568 + `core/office.js` 1 274 + `data/agents.js`) | SİL; brifing cümleleri King bağlamına | «Alanın ofisi yok»; «King tek» | ~1 900 satır. Sahibi eski Ofis toplantısı için «yüzeysel ve uydurma» demişti (`screens/meeting.js` 1-7. satır). Risk: `office.test.js` 55 test, `SP.Office`'e bağlı 8 dosya |
| 2 | Ofis › Danışma + İnceleme + Onaylar (`team.js`, `meeting.js`, `onaylar.js`, `proposals.js`) | KING'e birleştir: sohbet, «yönet», tek onay kapısı | «Bir iş bir yer» | Üç ekran tek King yüzüne. Risk: onay kapısı (ücretli iş) kaybolmamalı |
| 3 | Testler'in 4 «Daha» sekmesi (Geçmiş, Karşılaştır, Eğilim, Paneller; `labs.js:282-285`) | Tek Tahlil görünümüne birleştir | «Bir ekran bir iş» | 7 sekme → 3. `CEKMECE-HARITASI.md:69` zaten «7 sekme → 3 kart grubu» demişti |
| 4 | Analiz › Sistemin karnesi + `calib.js`, `goodhart.js`, `friction.js` | ARŞİV (veri `forecasts/*`, `usage` kalır) | «Öğrenme önce» | ~860 satır motor + bir sekme. Risk düşük; `signals.js` Goodhart/Friction'a bakıyor, o bağ kesilmeli |
| 5 | Bütçe (`basket.js` 841 + `money.js` 413 + `data/prices.js`) | ARŞİV | «Öğrenme önce» | 4 sekme gider. Risk: Mutfak/öğünde `SP.Money` 1 çağrı (`meals.js`), Bugün'de `butceSatiri` |
| 6 | Bugün › Ayrıntı (`gun`) ile Analiz › Özet ve Bugün tekrarı | Kayıt'ın tek «günü düzenle» formu; Özet kısmı silinir | «Bir iş bir yer» | Aynı kartlar iki-üç yerde çiziliyor (`today.js` `ozet()`, `renderAyrinti`) |
| 7 | Analiz › Haftalık rapor ↔ İnceleme «Son yedi gün» ↔ Analiz › Hafta | Tek haftalık görünüm (Kayıt), anlatımı King | «Bir iş bir yer» | `sadelik/spi.md:199-200` aynı tekrarı kaydetmiş |
| 8 | Analiz › Bilgi ve kavramlar + Yol haritası + Kütüphanem › Anlatımlar + Öğrenme | MOTOR:Yol altında tek «Beslenme / Hareket yolu» | «Öğrenme önce» | Dört dağınık öğrenme yeri tek yola. İçerik §6'da hazır |
| 9 | XP/rütbe kopyaları (`xp.js`, `basarim.js`, `perde.js`, `rutbe.js`, `basarimlar.js`, `kademeler.js`) | Kabuğa tek kopya ya da ARŞİV | «Alanın XP'si yok» | ~4 000 satır kopya. Sahibi kararı gerekir (§9) |
| 10 | `data/hints.js` (56 ipucu) ve kullanılmayan tasarım kalıntısı (`data/designs.js`, `profile.design`, `SPI/tasarim/` 20 statik örnek) | SİL / ARŞİV | «Tek tasarım» (`CEKMECE-HARITASI.md:82`) | İpuçları eski ekranlara bağlı; `tasarim/` çalışan kod değil (`tasarim/OKU.md:3-4`) |

Dışarıda tuttuğum ama sınırda olan: Mutfak ve Hane (sahibi kararı), İlaç sekmesi (güvenlik), Kişisel tahmin ağı.

## 9. Sahibine açık sorular

1. **Hane / çoklu profil kalsın mı?** SPİ her profili ayrı depoda tutuyor (`spi.v1.<profil>`, `spi.household`). Yeni yapı «tek kişi, tek depo» ise diğer profillerin verisi nereye gider: arşiv mi, ayrı hesap mı?
2. **Mutfak (tek tencereyi haneye bölüştürme) Beslenme'de kalsın mı, arşive mi?** Hane'ye bağlı; tek kişide anlamı azalır.
3. **Bütçe tümden arşive mi?** Öğrenme yoluna hizmet etmiyor; «sağlıklı beslenmenin maliyeti» bir Yol dersi olarak kalabilir.
4. **İlaç sekmesi nereye?** Kural motoru (`meds.js`) tahlil yorumunu bozan ilacı işaretliyor; bu güvenlik için gerekli. Ayrı ekran mı, Tahlil kaydının bir alanı mı?
5. **XP / rütbe:** 2026-11-06'da «dokunma» dediniz. Yeni planda alanın XP'si yok. Kabukta tek XP mi, tamamen arşiv mi?
6. **Hızlı giriş ile King «kayıt» niyeti:** iki ayrı giriş kutusu olsun mu, yoksa Kayıt'ın tek kutusu King'e mi gitsin? (`quickentry.js` 655 satır, `parse.js` model olmadan çalışıyor.)
7. **Fotoğraflar:** cihazdan çıkmama sözü (`foto.js:5`) tek depoda da sürsün mü? Sürerse eşitleme ve yedek dışında kalır.
8. **Egzersiz kataloğu ve kavramlar «uzman incelemesi bekliyor»** (50/57 kart, 30/30 kavram, 20/20 program). Yol haritasına incelemeden önce, «taslak» etiketiyle girsin mi?
9. **Uyku alanı:** ayrı bir uyku motoru yok (§4); veriler `vitals.sleep` ve `uyku.js` kestirmede. Uyku alanı ilk turda Kayıt türü olarak mı açılsın, yoksa sonraya mı?
10. **Kişisel tahmin ağı (ruh hâli)** ve **Günün sorusu**: hangi alan? Öğrenmeye hizmeti yoksa arşiv mi?
11. **«Testler» adı «Tahlil» olsun mu?** Plan alan adını «Tahlil» koymuş; eski not aynı soruyu sormuş (`sadelik/spi.md:76`).

## Doğrulayamadıklarım

- Uygulama çalıştırılmadı (görev kuralı: sunucu ve test yok). Ekranın ne yaptığı kod yorumlarından ve blok adlarından; «okur/yazar» sütunu `grep` sayımından, her işleyici tek tek izlenmedi.
- `SPI/src/MIMARI.md`, `ANALIZ.md`, `DURUM.md`, `SAGLIK.md`, `STIL.md`, `YOLHARITASI.md`: tam okumadım (yalnız `OFIS.md` başı). Bu raporda onlara dayanan iddia yok.
- `core/uyku.js` ve `core/meds.js` için ayrı test dosyası göremedim (başka testlerin içinde kullanılıyorlar).
- Yedek `__meta.mode` alanının alabileceği değerleri ve `decisions/*` kaydının alanlarını göremedim.
- Tasarım taslakları (`SPI/tasarim/*.html`) açılmadı; yalnız `OKU.md` başı okundu.
