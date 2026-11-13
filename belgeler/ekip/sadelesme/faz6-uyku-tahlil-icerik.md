# Faz 6 · Uyku ve Tahlil aşama 1 içeriği

Tarih: 2026-11-13 · Dal: `sadelesme` · Yazan: model (ekip üyesi, içerik) · Commit yok.

## Özet
İki sağlık alanının 1. aşaması şemaya uygun yazıldı, denetleyiciden temiz geçti (ikisi de çıkış 0):
- **Uyku** (`alan/uyku/asama-1.json`): 3 ünite, 10 ders, 24 ders alıştırması (5 açık), 12 ünite + 4 aşama kapı sorusu (toplam 40 alıştırma), 12 kaynak.
- **Tahlil** (`alan/tahlil/asama-1.json`): 3 ünite, 9 ders, 21 ders alıştırması (3 açık), 12 ünite + 4 aşama kapı sorusu (toplam 37 alıştırma), 16 kaynak.

Her öğe `durum: "taslak"`, `yazan: "model"`; her kaynak `dogrulanmamis` ve dosya + satır aralığı taşır. Ünite kapısı eşiği 0,75, aşama kapısı 0,8 (Tarih/Dil ile aynı). Kaynağa dayanmayan bağlantı cümleleri metinde «(model)» diye işaretli. Klinik sınırı aşan, çelişen ya da şişirilmiş kaynak cümleleri alınmadı; ilgili dersin `not` alanında ve aşağıda listeli. Sahibin kişisel verisi (gerçek tahlil, sağlık kaydı) okunmadı; örnek satırlar uydurmadır ve öyle yazılıdır. Dokunulan dosyalar yalnız bu üçü; git işlemi yapılmadı.

## Uyku

Dosya: `alan/uyku/asama-1.json` · aşama `uyku.1` «Uyku ne işe yarar, ritim nasıl kurulur».
Sayılar (denetleyiciden): 3 ünite, 10 ders, 40 alıştırma (ders alıştırması 24, bunun 5'i açık uçlu; ünite kapı sorusu 12; aşama kapı sorusu 4), 12 kaynak. Hepsi `durum: "taslak"`, `yazan: "model"`, kaynaklar `dogrulanmamis`. Ünite kapısı eşiği 0,75 (4 soru), aşama kapısı 0,8 (4 soru, üç üniteyi karıştırır). Kapı soruları ders alıştırmalarından ayrı yazıldı.

Sıra gerekçesi: önce uykunun ne olduğu ve ne işe yaradığı (evreler), sonra onu yöneten günlük ritim (ışık, melatonin, ısı, uyku baskısı), en son bu ikisinden çıkan alışkanlıklar. İleri fizyoloji (beyin dalgası frekansları, reseptör alt tipleri, kortizol yüzdeleri, uyku apnesi ölçütleri) bilerek dışarıda.

| Ünite | Dersler | Kaynak (satır) |
|---|---|---|
| 1.1 Uyku ne işe yarar? | Gece bir döngüler dizisidir · Derin uyku: onarım vardiyası · N2 ve REM: öğrenme ve duygu | `SPI/saglik/uyku_mimarisi_…_atlasi.md` 7-21; `SPI/saglik/uyku_sirkadiyen_ve_tahlil_referanslari.md` 15-20; `SPI/saglik/sirkadiyen_biyoloji_…_atlasi.md` 50-74 |
| 1.2 Günlük ritim | İç saat ve ışık · Akşam: melatonin ve vücut ısısı · Uyku baskısı, kafein, gün içi dalga | `uyku_sirkadiyen_…` 22-26; `sirkadiyen_biyoloji_…` 9-46, 78-87; `uyku_mimarisi_…` 34-37; depo `veri/taslak/spi/uyku_hijyeni_rehberi.jsonl` 1-7 |
| 1.3 Uykuyu koruyan alışkanlıklar | Sabah ışığı · Akşam ışığı ve yatak kuralı · Kafein, alkol, yatak odası · Ne kadar uyku ve kendi uykunu kaydetmek | `uyku_sirkadiyen_…` 28-32; `uyku_hijyeni_rehberi.jsonl` 1-7; depo `SPI/src/js/data/biomarkers.js` 86-90; `SPI/hareket/toparlanma_bilimi_…_atlasi.md` 72-74 |

Kanıt işi: yedi günlük uyku günlüğü (yatış/kalkış, son kafein, sabah ışığı); puanlanmaz, «teşhis aracı değildir» notuyla.
Modelin bağlantı ve özet cümleleri metinde «(model)» diye işaretli; kaynaklar sayıda ayrıştığında (sabah ışığı süresi, oda sıcaklığı) ortak bölge «model özeti» olarak verildi ve ders `not` alanına üç kaynağın sayısı yazıldı.

## Tahlil

Dosya: `alan/tahlil/asama-1.json` · aşama `tahlil.1` «Bir tahlil raporunu okumak».
Sayılar (denetleyiciden): 3 ünite, 9 ders, 37 alıştırma (ders 21, bunun 3'ü açık; ünite kapısı 12; aşama kapısı 4), 16 kaynak.

Sıra gerekçesi: rapordaki bir satırı okumak (belirteç, değer, birim, aralık; panellerin neyi ölçtüğü) → referans aralığının ne olduğu ve ne olmadığı (yaygın ≠ en iyi; laboratuvara, cinsiyete, kaynağa göre değişir; aralık dışı = hekime soru) → sonuçları zaman içinde tutmak (bağlamıyla kayıt, eğilim için en az üç ölçüm, ölçülen/hesaplanan ayrımı). Belirteçlerin yüksek/düşük anlamları, hastalık eşikleri ve fizyoloji bilerek dışarıda.

| Ünite | Dersler | Kaynak (satır) |
|---|---|---|
| 1.1 Rapordaki bir satır | Bir satırın dört parçası · Birim: aynı belirteç, farklı yazım · Paneller: hangi grup neyi ölçer | `SPI/saglik/uyku_sirkadiyen_ve_tahlil_referanslari.md` 37-80 (yalnız ad, birim, «ne ölçer» sütunları); depo `SPI/src/js/data/biomarkers.js` 1-45 |
| 1.2 Referans aralığı ve sınırı | Referans aralığı «yaygın» demektir · Aralık laboratuvara göre değişir · Aralık dışı bir değer bir sorudur, hüküm değil | `SPI/src/MIMARI.md` 51-55, 72-91; `biomarkers.js` 114-162; `veri/taslak/spi/laboratuvar_referans.jsonl` 40-41; `SPI/src/js/core/bio.js` 1-30; `SPI/src/js/core/state.js` 296-306; gemini tablo satır 48-51, 70-71, 73 |
| 1.3 Sonuçlarını zaman içinde tutmak | Her sonucu bağlamıyla kaydet · Tek ölçüm değil, eğilim · Ölçülen ve hesaplanan değerler | `state.js` 296-306; `bio.js` 1-30; `MIMARI.md` 72-91, 388-391; gemini tablo satır 51, 55, 67 |

Ders 1.2.2'nin örneği bu depodan çıktı: ferritin için üç kaynak üç ayrı aralık yazıyor (gemini 15-300; SPİ sözlüğü erkek 30-400 / kadın 13-150; taslak veri erkek 30-400 / kadın 15-150). «Aralık laboratuvara göre değişir» kuralı bu farkla somut gösterildi.
Kanıt işi: uydurma iki rapordan bir belirteci bağlamıyla tabloya taşımak + hekime iki soru; kendi gerçek sonucunu kullanmak zorunlu değil.

## Klinik sınır

Uygulanan kurallar (AGENTS §1.5, `SPI/src/MIMARI.md` «Klinik sınır»):
- Referans aralığı geçen **her** Tahlil dersinde (9/9) «referans aralıkları laboratuvardan laboratuvara değişir, yorum hekimindir» cümlesi var.
- Hiçbir ders ya da soru belirli bir değeri hastalık olarak yorumlamaz; aralık dışı değer sorularının doğru cevabı her zaman «kendi raporunun aralığıyla oku, hekime sor».
- Doz, takviye, ilaç, tedavi cümlesi yok. Açık alıştırmaların ölçütünde «teşhis/ilaç/doz önermedi» maddesi var.
- Uyku'da süren uyku sorunları için hekime yönlendirme cümlesi model tarafından eklendi (kaynakta yok), uyku günlüğü «teşhis aracı değil» diye işaretli.

Sınırı aştığı için **alınmayanlar**:
- Tahlil tablosu (`uyku_sirkadiyen_ve_tahlil_referanslari.md` satır 41-82): bütün «Yüksek/Düşük» hastalık listeleri ve teşhis eşikleri (açlık glukozu 100-125 «prediyabet», ≥126 «diyabet»; HbA1c 5,7-6,4 / ≥6,5; TSH >4,0 «hipotiroidi», <0,4 «hipertiroidi»; eGFR <60 «kronik böbrek hastalığı»; hs-CRP risk sınıfları; D vitamini «eksiklik/yetersizlik» bantları).
- Teşhis dili: TSAT «fonksiyonel demir eksikliği teşhisi konulabilir» (satır 51), açlık insülini «>10 ise metabolik direnç başlamış demektir» (54), HOMA-IR «belirgin insülin direnci» (55), MCV «gizli demir yetersizliği araştırılmalıdır» (46).
- Bir değeri yorumlama: AST «karaciğer hastalığı değil, kas mikrohasarıdır» (62), Gilbert sporcuda bilirubin «zararsızdır» (65), kreatinin «sistatin C testi istenmelidir» (66, test isteme önerisi).
- Takviye/ilaç: B12 «vegan sporcularda takviye biyolojik zorunluluktur» (76), potasyum takviyesi (81), demir/folik asit/çinko takviyesi anılan satırlar (49, 77, 79).
- Klinik hesap: düzeltilmiş kalsiyum formülü (82).
- SPİ sözlüğü notları: ferritin «referans aralığının alt ucu depo tükenmiş demektir» (`biomarkers.js` 161-162), glukoz «126 ve üzeri … hekim görüşmesi gerektirir» (187).
- Uyku: AHI uyku apnesi sınıflaması (`uyku_mimarisi_…` satır 29, teşhis ölçütü); ağız bandı «horlama indeksini %65 düşürdü» (30, tedavi iddiası); «yetersiz derin uyku Alzheimer'ın temelini atar» (`sirkadiyen_biyoloji_…` 66, hastalık iddiası); REM «gece terapisi, travmayı nötralize eder» (74, tedavi iması).

## Kaynaklar ve hatalar

Ana kaynaklar (hepsi salt okundu): `C:\gemini-data\SPI\saglik\uyku_sirkadiyen_ve_tahlil_referanslari.md`, `…\sirkadiyen_biyoloji_kortizol_melatonin_isik_spektrumu_ve_derin_uyku_mimarisi_atlasi.md`, `…\uyku_mimarisi_rem_nrem_uyku_apnesi_ve_derin_toparlanma_biyofizigi_atlasi.md`, `C:\gemini-data\SPI\hareket\toparlanma_bilimi_…_atlasi.md`; depoda `SPI/src/MIMARI.md`, `SPI/src/js/data/biomarkers.js`, `SPI/src/js/core/bio.js`, `SPI/src/js/core/state.js`, `veri/taslak/spi/uyku_hijyeni_rehberi.jsonl`, `veri/taslak/spi/laboratuvar_referans.jsonl`. `fizyolojik_biyoizleme_…_apob_hba1c_…` ve `hematopoiez_…` dosyalarına bakılmadı: ileri belirteçler (ApoB, homosistein, hepsidin) 1. aşamanın işi değil.

Hatalar ve çelişkiler (derse alınmadı ya da sayı verilmeden alındı):
- **Glimfatik %60 çelişkisi:** «astrositler %60 büzülür» (`sirkadiyen_biyoloji_…` 58) ile «interstisyel hacim %60 artar» (`uyku_sirkadiyen_…` 19) aynı şey değil. Sayı verilmedi.
- **Delta dalgası aralığı:** 0.5-2.0 Hz (`uyku_sirkadiyen_…` 18) ile 0.5-4 Hz (`sirkadiyen_biyoloji_…` 52, `uyku_mimarisi_…` 18). İğcik frekansı 11-16 Hz ile 12-14 Hz. Frekans verilmedi.
- **Sabah kortizol yanıtı:** %38-75 (`uyku_sirkadiyen_…` 25) ile %50-75 (`uyku_mimarisi_…` 37). Alınmadı.
- **Çekirdek sıcaklık düşüşü:** 0.5-1.0°C (`uyku_sirkadiyen_…` 26) ile 1-1.5°C (`uyku_hijyeni_rehberi.jsonl` 5). Sayı verilmedi.
- **Oda sıcaklığı:** 17-19,5 / 18-19 / 18-20°C; **sabah ışığı süresi:** 10-30 / 10-20 / 10-15 dk. Derste aralıklar yan yana verildi, ortak bölge «model özeti».
- **«Derin Uyku (7-9 saat)»** (`SPI/hareket/toparlanma_bilimi_…` 74): 7-9 saat toplam uykudur; düzeltilerek alındı. SPİ sözlüğünün uyku referansı 6-9,5 saat, kaynakların 7-9'uyla örtüşmüyor.
- **Doğrulanamayan şişirilmiş sayılar:** «bulutlu günde bile en az 10.000 lüks» (`sirkadiyen_biyoloji_…` 24), «melatonin %80'e kadar bloke olur» (36), «GH'nin %70'i N3'te» (54), «uyku ataleti 2 saate kadar» (`uyku_mimarisi_…` 36), burun solunumu «PaO2'yi %18-20 artırır» (27), «5 saatlik uyku testosteronu %15 düşürür» (`yasam_dongusu_…` 76), «Hb'deki her 1 g/dL düşüş VO2max'ta %4-5 kayıp» (tahlil tablosu 42), hematokrit «vizkoziteyi logaritmik artırır» (43). Alınmadı.
- **Gerekçesi doğrulanamayan öneri:** «ilk 90 dakika kafeini ertele, adenozin doğal yolla temizlensin» (`uyku_mimarisi_…` 43); «tuz lambası» (`sirkadiyen_biyoloji_…` 44). Alınmadı. NSDR «vagal tonusu hızla yeniler» (`uyku_sirkadiyen_…` 33) alınmadı.
- **Kaynak içi çelişki (Tahlil):** açlık insülini için «optimal hedef» 2.0-6.0, kendi referansının alt sınırı 2.6'nın altına iniyor (satır 54). «Optimal Hedef» sütununun tamamı (sporcu hedefleri, dayanağı yok) alınmadı.
- **Hemoglobin aralığı:** tablo cinsiyetleri birleştiren 12.0-17.5 yazar (42), SPİ sözlüğü erkek 13,5-17,5 / kadın 12,0-15,5. **Ferritin:** üç kaynak üç aralık (ders 1.2.2'nin konusu yapıldı).
- **Dosya başlığı hatası:** tahlil dosyasının başı ve sonu (satır 4, 94) Atwater kalori denklemini anar; uyku/tahlil dosyasıyla ilgisiz, kopyala-yapıştır izi. Satır 85 «teşhis içermez» derken tablo teşhis eşikleriyle dolu.
- Sodyum «mmol/L (mEq/L)» eşitlemesi tek değerlikli iyonlar için geçerli; kaynak belirtmiyor (ders notunda).

## Eksikler
- **Düzenli uyku saati** (her gün aynı saatte kalkmak) kaynaklarda açık bir kural olarak yok; 24 saatlik tablo sabit saatler veriyor ama kişiye göre değil. Derse alınmadı; temel bir alışkanlık olduğu için kurum kaynağı gerekir.
- **Hekime yönlendirme ölçütleri** (ne zaman uyku için hekime gidilir) kaynaklarda yok; model AGENTS §1.5 gereği genel bir cümle ekledi. Sahibin onayı ya da kurum kaynağı gerekir.
- **Kafein kaynakları** (çay, kola) kaynakta yok, model bilgisi olarak işaretli; sahip isterse çıkarılır.
- **Tahlile hazırlık** (açlık süresi, kan alma saati) için kurum kaynağı yok; yalnız «açlık durumu kaydedilir» ve «laboratuvarın/hekimin talimatı önce gelir» denildi.
- **Gerçek bir rapor görüntüsü** yok: ders 1.1.1 uydurma satırlarla çalışıyor; anonim, uydurma bir rapor resmi ilk derse çok yarar.
- Şema eksiği: kapı sorusunun ders alıştırmalarından farklı olduğunu denetleyici sınamıyor (elle kontrol edildi). Şemada «klinik sınır cümlesi zorunlu» gibi bir alan kuralı yok; Tahlil'deki «her derste sınır cümlesi» kuralı yalnız içerikte, denetimde değil.
- Bütün kaynaklar `dogrulanmamis`: gemini-data atlasları ve `veri/taslak` el yazısı verilerdir; hiçbir sayı bir kurum kaynağıyla (AASM, IFCC, Türk Biyokimya Derneği) karşılaştırılmadı.

## Açık sorular
1. Tahlil 1. aşamasının referans dayanağı için bir kurum kaynağı seçilsin mi (ör. bir Türk laboratuvarının herkese açık referans kılavuzu ya da TBD)? Şu an «aralık laboratuvara göre değişir» kuralı kendi depomuzdaki üç farklı ferritin aralığıyla anlatılıyor.
2. SPİ ekranında görünen «hedef bant» (optimal) Tahlil yoluna hiç girmesin mi, yoksa ileri bir aşamada «dayanağı zayıf» etiketiyle mi anlatılsın? 1. aşamada yalnız bir cümleyle anıldı.
3. Uyku ve Tahlil'deki «hekime danış» cümleleri model ekidir; sahibin onayladığı tek bir standart cümle mi kullanılsın?
4. Tahlil'in 2. aşaması belirteç belirteç mi ilerlesin (hemogram → demir → şeker …), yoksa yalnız «ne ölçer» düzeyinde kalıp başvuru tablosuna mı bırakılsın? İçerik hattı raporu Tahlil'i «yol değil, başvuru tablosu» diye önermişti.
