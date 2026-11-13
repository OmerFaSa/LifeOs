# Faz 6 · Aşama 2 içeriği: Uyku, Tahlil

## Özet
Tarih: 2026-11-14 · Dal: `sadelesme` · Yazan: model (ekip üyesi, içerik) · Commit yok.

İki sağlık alanına birer 2. aşama yazıldı: `alan/uyku/asama-2.json` («Kendi ritmini kurmak») ve `alan/tahlil/asama-2.json` («Paneller ne ölçer»). İkisi de 1. aşamaya `onKosul: ["<alan>.1"]` ile bağlı; her ünitede 4 soruluk kapı (eşik 0,75, sorular kolaydan zora), aşamada 6 soruluk kapı (eşik 0,8). Hiçbir öğe `onayli` değil: bütün dersler ve sorular `durum: "taslak"`, `yazan: "model"`; bütün kaynaklar `dogrulama: "dogrulanmamis"`.

| Alan | Ünite | Ders | Ders alıştırması (açık) | Ünite kapısı | Aşama kapısı | Toplam soru | Kaynak (gemini / depo) | Harf A/B/C/D |
|---|---|---|---|---|---|---|---|---|
| Uyku | 3 | 9 | 22 (1) | 12 | 6 | 40 | 24 (12 / 12) | 10/10/9/10 |
| Tahlil | 3 | 9 | 23 (1) | 12 | 6 | 41 | 23 (7 / 16) | 10/10/10/10 |

Sayılar betikle, JSON üzerinden sayıldı (ölçüldü). Kalite kapısı (bu koşuda çalıştırıldı, `PYTHONIOENCODING=utf-8`):
- `python alan/denetle.py alan/uyku` → `Temiz · 2 dosya, 2 aşama, 6 ünite, 19 ders, 80 alıştırma, 36 kaynak` (çıkış 0)
- `python alan/denetle.py alan/tahlil` → `Temiz · 2 dosya, 2 aşama, 6 ünite, 18 ders, 78 alıştırma, 39 kaynak` (çıkış 0)
- `python alan/denetle_test.py` → `14/14 test geçti` (çıkış 0)
- `python kalite/katman_test.py` → `TAMAM: katman_test 0 hata` (çıkış 0)
- `python kalite/olcum.py --denetle` → `Bütçe tamam: 28 bütçe, aşım yok.` (çıkış 0)

Yöntem: iki JSON dosyası elle değil, scratchpad'deki küçük bir üretici betikle yazıldı (içerik betikte elle yazılı; betik yalnız şemayı doldurur ve doğru cevabın yerini dörtlü bloklarla dengeli dağıtır). Ayrı bir betik her kaynağın dosyasını açtı, satır aralığının dosyanın içinde olduğunu ve her kaynağın kullanıldığını denetledi, aralık uçlarını yazdırdı; uçlar ve `not` alanlarındaki satır numaraları gözle iddiaya karşı okundu. `C:\gemini-data` yalnız okundu. Sahibin kişisel verisi (gerçek tahlil, uyku kaydı) okunmadı.

İş iki koşuda bitti: ilk koşu birkaç dakika içinde hesap sınırına takıldı ve diskte yalnız bu raporun boş iskeleti kaldı; ikinci koşu işi baştan yaptı ve her alan bitince dosyayı ve raporu diske yazdı.

## Uyku
Dosya: `alan/uyku/asama-2.json` · aşama `uyku.2` «Kendi ritmini kurmak» · `onKosul: ["uyku.1"]`.
Sayılar (betikle sayıldı, ölçüldü): 3 ünite, 9 ders, 40 alıştırma (ders alıştırması 22, biri açık uçlu kanıt işi; ünite kapısı 12; aşama kapısı 6), 24 kaynak (12 gemini-data, 12 depo). Eşikler ünite 0,75 (4 soru), aşama 0,8 (6 soru). Cevap harfleri A 10, B 10, C 9, D 10 (seçmeli 39 soru; yerler dengeli bloklarla betikle dağıtıldı). Bütün dersler ve sorular `durum: "taslak"`, `yazan: "model"`; bütün kaynaklar `dogrulanmamis`.
Denetçi (1. ve 2. aşama birlikte): `Temiz · 2 dosya, 2 aşama, 6 ünite, 19 ders, 80 alıştırma, 36 kaynak` (çıkış 0).

**Sıra gerekçesi.** 1. aşama evreleri, iç saati, ışık/melatonin/kafein ve temel alışkanlıkları işledi; ileri fizyoloji ve uyku bozuklukları bilerek dışarıda kaldı. `veri/plan/2-spi.txt` 2.O başlıklarından (satır 309-329) 1. aşamada karşılanmayanlar şunlardı: kronotip (2.O.05), akşam yemeği ve egzersiz (2.O.11-12), şekerleme (2.O.13), uyku yoksunluğu (2.O.14), uyku borcu (2.O.16), vardiya ve jet-lag (2.O.17), uykuya dalma rutini (2.O.18), uykusuzluk farkındalığı (2.O.19, «tanı ve tedavi değil»), sınav dönemi (2.O.20). 2. aşama bunları üç üniteye dizdi: önce düzen (1. aşama raporunun «düzenli uyku saati eksik» açığı, SPİ rehber kartında kaynağı bulundu), sonra kişisel ritim, en son uykuyu bozanlar ve hekime gitme. İçerik hattı §6'da Uyku için ayrıca aşama tablosu yok (yalnız §2 satır 122: «uyku hijyeni adımları; abartılı dil ayıklanmalı»).

| Ünite | Dersler | Kaynak (satır) |
|---|---|---|
| 2.1 Düzen ve uyku borcu | Her gün aynı saatte kalkmak · Uyku borcu ve hafta sonu · Az uyku ve kendi kaydını okumak | depo `SPI/src/js/data/rehber.js` 200-206; `ogrenme.js` 326-332, 1344-1365 (CDC); `hints.js` 133; gemini `AYS/ogrenme_bilimi/yks_son_30_gun_…` 42-48, `AYS/yks_genel/yks_soru_cozerken_…` 77-81, `KING/iletisim_ve_karizma/kocluk_diyalog_…` 137-145 |
| 2.2 Kendi ritmin | Sabahçıl ve akşamcıl · Gündüz şekerlemesi · Sınav döneminde uyku | `KING/yasam_tasarimi/zaman_bloklama_…` 55-64 (Breus); `SPI/saglik/sirkadiyen_biyoloji_…` 80-87; `KING/yasam_tasarimi/enerji_denetimi_…` 53; `SPI/saglik/uyku_mimarisi_…` 34-36; `yks_son_30_gun_…` 38, 42-48; `yks_soru_cozerken_…` 77-81; `AYS/yks_genel/yks_stres_…` 90-91 |
| 2.3 Uykuyu bozanlar ve yardım istemek | Akşam yemeği ve egzersizin saati · Uyuyamadığında · Ne zaman hekime (+ kanıt işi, `acik`) | depo `rehber.js` 34, 207-210; `veri/temiz/spi/who_rehberler.jsonl` 7-9 (DSÖ, temiz katman); `symptoms.js` 19-28, 88-90; `hints.js` 132; `SPI/src/MIMARI.md` 51-55; gemini `SPI/beslenme/seyahat_vardiyali_…` 41; `KING/kocluk_metodolojisi/elit_kocluk_…` 40-45; `uyku_mimarisi_…` 29 (yalnız tanım) |

Kanıt işi: yedi gün sabit kalkış saatiyle tablo (yatış, kalkış, şekerleme, akşam yemeği ve egzersiz saati, sabah 10:00 uyanıklığı 1-5) ve «birlikte görüldü / sebep oldu» ayrımı yapan iki gözlem; puanlanmaz, «teşhis aracı değildir» notuyla. 1. aşamanın günlüğünden farkı: bu kez bir şey sabit tutulur.
Modelin bağlantı ve çıkarım cümleleri metinde «(model)», «modelin bağlantı notu», «modelin çıkarımı (kaynakta yok, doğrulanmalı)» diye işaretli. Kaynaklar ayrıştığında (kalkış kuralı 15 gün 07:00 / 30 gün 07:30; zihnin açılma süresi 2-2,5 / 2,5-3 saat) ikisi birlikte verildi.
Kaynak satır denetimi: 24 kaynağın hepsinin dosyası var, satır aralığı dosyanın içinde, her kaynak en az bir öğede kullanılıyor (betik); aralıkların ilk ve son satırları gözle iddiaya karşı okundu. `not` alanlarındaki satır numaraları (ör. `evidence.js` 214, `rehber.js` 207/214, koçluk atlası 44-48) da betikle açılıp okundu.

## Tahlil
Dosya: `alan/tahlil/asama-2.json` · aşama `tahlil.2` «Paneller ne ölçer» · `onKosul: ["tahlil.1"]`.
Sayılar (betikle sayıldı, ölçüldü): 3 ünite, 9 ders, 41 alıştırma (ders alıştırması 23, biri açık uçlu kanıt işi; ünite kapısı 12; aşama kapısı 6), 23 kaynak (7 gemini-data, 16 depo). Eşikler ünite 0,75 (4 soru), aşama 0,8 (6 soru). Cevap harfleri A 10, B 10, C 10, D 10. Bütün öğeler `taslak` / `model`, kaynaklar `dogrulanmamis`.
Denetçi (1. ve 2. aşama birlikte): `Temiz · 2 dosya, 2 aşama, 6 ünite, 18 ders, 78 alıştırma, 39 kaynak` (çıkış 0).

**Sıra gerekçesi.** İçerik hattı Tahlil'i «yol değil, başvuru tablosu» diye önermişti (§2 satır 123, §7 satır 423); 1. aşama raporunun 4. açık sorusu da «belirteç belirteç mi, yalnız ne ölçer düzeyinde mi» diye soruyordu. Bu aşama ikisinin arasında durur: belirteçlerin yüksek/düşük anlamlarına hiç girmeden, 1. aşamanın «rapordaki bir satır» ve «paneller» derslerini **ne ölçer** düzeyinde panel panel açar (hemogram → demir → şeker → lipid → karaciğer/böbrek/tiroid), sonra 1. aşamanın «bağlamıyla kaydet» kuralını derinleştirir (ölçüm koşulları), bir eşiğin dayanağını sorgulamayı öğretir (`veri/plan/2-spi.txt` 2.Q.18 «sağlık okuryazarlığı») ve hekime hazırlıkla biter. Panel sırası SPİ sözlüğünün panel sırasıdır (`biomarkers.js` 32-45). Elektrolit, vitamin, hormon (tiroid dışı) ve inflamasyon panelleri «ne ölçer» düzeyinde bile yazılmadı (Eksikler).

| Ünite | Dersler | Kaynak (satır) |
|---|---|---|
| 2.1 Kan sayımı ve demir: ne ölçer? | Hemogram: kırmızı hücreler · Beyaz hücreler ve trombosit · Demir paneli: depo, anlık değer, taşıma | gemini `SPI/saglik/uyku_sirkadiyen_ve_tahlil_referanslari.md` 41-51 (yalnız «görev» sütunu); depo `SPI/src/js/data/biomarkers.js` 32-45, 114-180, 440-520 |
| 2.2 Şeker, yağlar, karaciğer, böbrek, tiroid: ne ölçer? | Şeker paneli: an ve ortalama · Lipid paneli · Karaciğer, böbrek ve tiroid | aynı tablo 52-72; `biomarkers.js` 183-326, 386-425, 440-520; `SPI/src/js/core/state.js` 296-306 |
| 2.3 Ölçüm koşulları, dayanak ve hekime hazırlık | Kan vermeden önceki gün · Dayanağı ne? Kılavuz, uzlaşı, gözlem, sistem ayarı · Hekime götürmek: tablo, şikâyet, soru (+ kanıt işi, `acik`) | `state.js` 296-306; `biomarkers.js`; `SPI/src/js/data/evidence.js` 59-92, 196-216; `SPI/src/MIMARI.md` 51-55, 72-81; `symptoms.js` 1-28; `hints.js` 132-133 |

Kanıt işi: uydurma bir raporun sekiz satırı (referans aralıkları bilerek yazılmadı, uydurma aralık olmasın diye) için «ne ölçer» açıklaması, iki hesap (TSAT, non-HDL), kan verme koşulları listesi ve hekime üç soru; ölçütte «yorum, teşhis, ilaç, takviye, doz yok mu?» maddeleri var.
Klinik sınır cümlesi: dokuz dersin dokuzunda «referans aralıkları laboratuvardan laboratuvara değişir … yorum hekimindir» cümlesi var (betikle denetlendi: 9/9).
Uydurma sayılar yalnız hesap örneklerinde (TSAT, non-HDL) ve kanıt işinde geçer, hepsi «uydurma sayılar» diye işaretli ve hiçbirinin yanında aralık ya da yorum yok. Kaynak satır denetimi: 23 kaynağın hepsinin dosyası var, aralık dosyanın içinde, hepsi kullanılıyor (betik); `not` alanlarındaki satır numaraları (`biomarkers.js` 120, 134, 140, 146, 161-162, 174, 187, 250, 256, 265, 306, 326, 392, 418, 471; `evidence.js` 66, 206, 214; `symptoms.js` 7, 14-15) tek tek açılıp okundu.

## Güvenlik
Uygulanan sınır: AGENTS §1.5 ve `SPI/src/MIMARI.md` «Klinik sınır» (satır 51-55). Bütün güvenlik cümleleri kaynakta yoktur, model ekledi ve «(model, klinik sınır)» diye işaretlidir; sahibin onayını bekler.

**Uyku: yapılanlar**
- Uyku bozukluğu belirtilerinde uzmana yönlendirme: ders 2.3.3 ve 2.2.2'de «uykuda nefesin durduğunun fark edilmesi, haftalarca süren uykusuzluk, gündüz karşı konulamayan uyku hâli → hekim» cümlesi (1. aşamadaki dille). Horlama + nefes durması ve kronik uykusuzluk ayrıca soru oldu (2.3.3.a1, 2.3.k4, aşama kapısı k5).
- İlaç, melatonin, takviye ve doz yok. Ders 2.3.2'de açık sınır cümlesi: «uyku ilacı ve melatonin bu yolun konusu değildir; kullanma ya da bırakma kararı hekimindir». Sorularda «az miktarla denemek», «melatonin denemek» seçenekleri yanlış cevaptır.
- Apne için tanı ölçütü yok: yalnız indeksin neyi saydığı anıldı, sınıflama eşikleri (AHI) alınmadı.
- Kayıt teşhis aracı değil: kanıt işinin metninde ve ölçütünde yazılı; ölçüt «teşhis, ilaç, melatonin ya da takviye içermiyor mu?» ve «kırmızı bayrak varsa hekim notu düşüldü mü?» maddelerini taşır.
- Birlikte görülen iki ölçüm sebep sayılmaz (2.1.3, ünite kapısı k4, aşama kapısı k4): kişinin kendi kaydından kendine teşhis koymasının önü kesildi.

**Uyku: sınırı aştığı için alınmayanlar**
- `uyku_mimarisi_…` 29: AHI uyku apnesi sınıflaması (teşhis ölçütü); 30: ağız bandı önerisi ve «horlama indeksini %65 düşürmüş» (tedavi iddiası).
- `seyahat_vardiyali_…` 43-45: jet-lag için 14-16 saat kesintisiz açlık protokolü ve «iç saati tek günde sıfırlar» (sağlık müdahalesi, doğrulanmadı); 23-25: gece vardiyasında insülin/glukoz yüzdeleri.
- `rehber.js` 207: «uyku hijyeni çoğu zaman ilaçtan önce gelir» (ilaçla karşılaştırma).
- `symptoms.js` 89: uykuya dalamamayı kortizol, magnezyum ve TSH ölçümüne bağlama (bir şikâyeti tahlil değeriyle okumaya kapı açar).
- `elit_kocluk_…` 44, 46-48: uyku dışı kırmızı bayraklar (intihar, bağımlılık, psikoz, TSSB) ve ruh sağlığı sevk dili; bu derse ait değil, bir ruh sağlığı dersi için sahibin kararı gerekir.

**Tahlil: yapılanlar**
- Hiçbir ders ya da soru bir değerin yüksek/düşük olduğunu söylemez, bir değeri hastalık olarak okumaz; yalnız «satır neyi ölçer, hangisi hesaplanır, hangi koşul onu etkiler» öğretilir.
- Teşhis eşiği yok: glukoz, HbA1c, insülin, HOMA-IR, lipid, eGFR, TSH, TSAT, ferritin eşiklerinin hiçbiri derste, soruda ya da `not` alanında sayı olarak geçmez (`not` alanları alınmayanı yalnız satır numarasıyla anar).
- «Referans aralıkları laboratuvardan laboratuvara değişir, yorum hekimindir» cümlesi 9/9 derste; aşama kapısı k6 ve ünite kapısı 2.2.k4 aynı ilkeyi sorar.
- Doz, takviye, ilaç, tedavi yok. «Takviyeye başlarım», «teşhis koyar», «doz önerir» seçenekleri yanlış cevaptır (2.3.k4, aşama kapısı k5, 2.3.3.a2).
- Hazırlık talimatı laboratuvarın ve hekimindir: kaynakların hazırlık süreleri (hs-CRP için «48 saat dinlenme») talimatın yerine geçmesin diye alınmadı.
- Dayanak sorgusu (ders 2.3.2): «hedef bant» gören öğrencinin ilk sorusu «dayanağı ne?» olur; kaynak tablosunun dayanaksız «Optimal Hedef» sütunu hiç alınmadı.
- Uydurma rapor satırlarında aralık yok; öğrenciden yorum değil, «ne ölçer» açıklaması ve hekime soru istenir.

**Tahlil: sınırı aştığı için alınmayanlar** (satırlar `SPI/saglik/uyku_sirkadiyen_ve_tahlil_referanslari.md` ve `SPI/src/js/data/biomarkers.js`)
- Tablonun bütün «Yüksek/Düşük» hastalık listeleri ve «Optimal Hedef» sütunu (41-82), 1. aşamada olduğu gibi.
- Teşhis eşikleri ve teşhis dili: açlık glukozu ve HbA1c eşikleri (52-53), insülin «metabolik direnç başlamış demektir» (54), HOMA-IR «belirgin insülin direnci» (55), lipid risk sınıfları (56-59), TG/HDL (60), eGFR (67), TSH (70), ferritin depo eşiği (48), TSAT eşiği ve «fonksiyonel demir eksikliği teşhisi konulabilir» (51), MCV «gizli demir yetersizliği araştırılmalıdır» (46).
- Bir değeri yorumlama: AST «karaciğer hastalığı değil, kas mikro-hasarıdır» (62), Gilbert «zararsızdır» (65), albümin «düşündürmelidir» (64), kreatinin «sistatin C testi istenmelidir» (66, test isteme).
- SPİ sözlüğünün yorum notları: hemoglobin (120), MCV (134), RDW (140), lökosit «enfeksiyon işaretidir» (146), ferritin «alt ucu depo tükenmiş demektir» (161-162), TIBC (174), glukoz eşiği (187), TG/HDL eşiği (250), non-HDL «riski daha iyi özetler» (256), ALT «yağlı karaciğerde sessizce yükselir» (265), kreatinin (306), eGFR eşiği (326), TSH «yüksekse tiroid yavaş çalışıyor demektir» (392), kortizol «uykusuzluk ve aşırı antrenman yükseltir» (418).
- Semptom sözlüğü: «ferritin kan değeri deponun yalnızca %1'ini gösterir» (`symptoms.js` 7; `hints.js` 132'deki karşılığı), «düşük ferritin + yorgunluk» ve «ilaç başlangıcından sonra artan şikâyet» örnekleri (`symptoms.js` 14-15).
- Takviye cümleleri: serum demiri satırının takviye ve kanama listesi (49; satırdan yalnız «görev» cümlesi alındı); 76, 77, 79, 81. satırlar (vitamin, mineral, elektrolit) bu aşamada hiç açılmadı.

## Kaynaklar ve hatalar
Kaynaklardaki hatalar, çelişkiler ve şişirilmiş iddialar derse alınmadı ya da sayısı verilmeden alındı; hepsi ilgili dersin `not` alanında da yazılı. Klinik sınır yüzünden alınmayanlar yukarıda, Güvenlik bölümünde.

**Uyku**
- Kaynak türü: Uyku 2. aşamasının gemini-data kaynaklarının çoğu SPİ fizyoloji atlası değil, KING koçluk ve AYS sınav atlasıdır (12 gemini kaynağın 8'i: 4 KING, 4 AYS); SPİ atlasları 2. aşama konularını (kronotip, şekerleme, uyku borcu, sınav) neredeyse hiç işlemiyor. Bu atlaslar model yazımıdır ve dili abartılıdır; yalnız davranış kuralları alındı, gerekçe cümleleri çoğunlukla alınmadı.
- Breus tablosu (`KING/yasam_tasarimi/zaman_bloklama_…` 57-64): nüfus oranları, «genetik olarak belirleyen», «verimi üçe katlar», kişilik nitelemeleri dayanaksız. Kronotipi ölçecek bir yöntem kaynaklarda yok.
- Başlığı yanıltıcı dosya: `KING/kocluk_metodolojisi/zaman_psikolojisi_kronotip_kalibrasyonu_…` başlığında kronotip geçer, gövdesinde kronotip bölümü yok (Graham, Zimbardo, Parkinson, Hofstadter).
- Sınav atlasları kendi aralarında ayrışıyor: kalkış kuralı 15 gün önce 07:00 (`yks_son_30_gun_…` 46) / 30 gün önce en geç 07:30 (`yks_soru_cozerken_…` 81); zihnin açılma süresi 2,5-3 saat (44) / 2-2,5 saat (78). İkisi birlikte verildi.
- Aşırı kesin ya da dayanaksız: «melatoninsiz uyku derin REM ve Delta dalgalarına geçemez» (`yks_son_30_gun_…` 48), «kortizolün tepe noktasını 10:15'e kilitler» (47), «son gece 3-4 saat uyusa dahi … %95 oranında korur» (`yks_stres_…` 91), Vaka 12'nin «REM uykusunu kesintiye uğratır» gerekçesi (139). Alınmadı.
- Nüfus farkı: CDC iddiası «18–60 yaş» (`ogrenme.js` 1358), SPİ kanıt listesinin uyku satırı «18–64 yaş erişkin» (`evidence.js` 214). Çözülmedi.
- SPİ rehber kartı (`rehber.js` 200-214) model yazımıdır; atıfları (AASM/SRS 2015, Spiegel 2004) bu koşuda doğrulanmadı. 1. aşama raporunun «düzenli uyku saati kaynaklarda yok» eksiği bu kartla kapandı, ama kurum kaynağı hâlâ yok.

**Tahlil**
- Laboratuvar tablosunun (`uyku_sirkadiyen_ve_tahlil_referanslari.md` 41-82) yalnız «Fizyolojik Görev» sütunu kullanılabildi; öteki sütunlar ve her satırın «Egzersiz/Yaşam» cümlelerinin çoğu yorum ya da doğrulanmamış sayı taşıyor. 1. aşamanın bulduğu çelişkiler (hemoglobin ve ferritin aralıkları, Atwater başlığı) sürüyor.
- HbA1c'nin kapsadığı süre: tablo «son 8-12 hafta» (53), SPİ sözlüğü «son 3 ay» (`biomarkers.js` 193, 212); ikisi aynı aralığa düşüyor, ikisi birlikte verildi.
- SPİ sözlüğü notlarının çoğu bir değeri yorumluyor (liste Güvenlik bölümünde); sözlük satırlarından yalnız ölçüm koşulu cümleleri (hematokrit/su, serum demiri/saat, AST/antrenman, testosteron ve kortizol/saat, hs-CRP/enfeksiyon) ve formüller alındı.
- `evidence.js`: kaynak türü listede `system_tuning` (66), satırlarda `convention` (206) diye yazılıyor; ad tutarsızlığı kodun işi, içerik için bilgi.
- `symptoms.js` 7: «ferritin kan değeri deponun yalnızca %1'ini gösterir» oranı doğrulanmamış (kod yorumu, sistemin «kendi veri sözlüğüne» atfediyor); alınmadı.
- `veri/taslak/spi/laboratuvar_referans.jsonl` her satırda «anlam_dusuk / anlam_yuksek» hastalık listesi taşıyor; bu aşamada hiç kullanılmadı.

## Eksikler
- **Uyku:** vardiyalı çalışma ve jet-lag (plan 2.O.17) ders olmadı: tek kaynak bir beslenme atlası ve önerisi bir açlık protokolü. Uyku yoksunluğunun bilişsel etkileri (2.O.14) yalnız rehber kartının bir cümlesiyle anıldı; uyku ve bellek pekiştirme (2.O.15) 1. aşamada kaldı. Akşam yemeği ve egzersiz için «yatmadan kaç saat önce» kaynaklarda yok, ders süre vermiyor. Uykuya dalma rutini (2.O.18) için kaynak yok; dersteki sıra modelin önerisi. Kronotipi ölçecek bir anket yok. Hekime yönlendirme ölçütleri (ne zaman, hangi uzman) için kurum kaynağı yok; cümleler modelin.
- **Tahlil:** elektrolit (sodyum, potasyum, kalsiyum, magnezyum), vitamin ve mineral (D, B12, folat, çinko), tiroid dışı hormonlar ve inflamasyon (hs-CRP, sedimantasyon) panelleri «ne ölçer» düzeyinde bile yazılmadı: tablonun bu satırları takviye ve tanı diliyle iç içe ve bir aşamaya sığmadı; sonraki aşamanın işi. Bilirubin, GGT, üre, ürik asit yalnız adıyla ya da bir cümleyle geçti. Ölçüm koşulları için kurum kaynağı (ör. bir laboratuvarın hasta hazırlık kılavuzu) yok; cümleler SPİ sözlüğünden. Gerçek (anonim) bir rapor görüntüsü yine yok.
- **İkisi için:** bütün kaynaklar `dogrulanmamis`; hiçbir sayı bir kurum kaynağıyla (AASM, CDC sayfasının kendisi, DSÖ sayfasının kendisi, IFCC, TBD) karşılaştırılmadı. DSÖ cümlesi `veri/temiz` katmanından (indirilmiş, URL ve lisanslı) geldi; asıl sayfa bu koşuda açılmadı. Açık uçlu kanıt işleri puanlanmaz, sahibin değerlendirmesine bağlı. Denetçi, Tahlil'deki «her derste sınır cümlesi» kuralını sınamıyor (betikle elle denetlendi: 9/9). DIZIN ve CI satırları koordinatöre bırakıldı.

## Açık sorular
1. **Uyku:** 2. aşamanın 12 gemini kaynağının 8'i KING koçluk ve AYS sınav atlası. Bu atlaslar uyku dersine kaynak sayılmaya devam etsin mi, yoksa davranış kuralları (sabit kalkış, 20 dakikalık şekerleme, 20 dakika kuralı) bir kurum kaynağıyla (ör. AASM ya da CDC'nin kendi sayfası) doğrulanınca mı kalsın?
2. **Uyku:** Breus kronotipleri (Aslan/Ayı/Kurt/Yunus) derste kalsın mı? Kaynak popüler bir kitap ve ölçüm yöntemi yok; yerine yalnız «saatler kişiden kişiye kayar» cümlesi de yeterli olabilir.
3. **Uyku:** vardiyalı çalışma ve jet-lag dersi istenirse hangi kaynaktan? (Beslenme atlasının açlık protokolü bilerek alınmadı.)
4. **Tahlil:** elektrolit, vitamin/mineral, hormon ve inflamasyon panelleri bir 3. aşamada «ne ölçer» düzeyinde mi yazılsın, yoksa Tahlil yolu burada bitip kalanı başvuru tablosuna mı bırakılsın?
5. **İkisi için:** «hekime danış» ve «ilaç/melatonin bu yolun konusu değil» cümleleri model ekidir (AGENTS §1.5). 1. aşama raporunun 3. sorusu gibi: sahibin onayladığı tek bir standart cümle mi kullanılsın?
6. **Tahlil:** SPİ sözlüğünün yorum notları (ör. TSH «yüksekse tiroid yavaş çalışıyor demektir», ferritin «alt ucu depo tükenmiş demektir») uygulamada ekranda görünüyor olabilir; içerik yolu bunları bilerek dışarıda bıraktı. Sözlük notları da klinik sınıra göre gözden geçirilsin mi? (Bu görev yalnız içerik dosyalarına yazabildiği için dokunulmadı.)
