# Meydan — tasarım ve mantık (v3 önerisi)

> **Durum (2026-09-25): M1 + M2 HKM'de.** Kullanıcı kararı: «bu sistemi HKM'ye
> ekler misin», «HKM'nin içinde olacak». Kod `HKM/core/meydan.py`, uçlar
> `/api/meydan*`, sayfa `HKM/web/meydan.html`. HKM yüzünde sekme DEĞİL: köşedeki
> «Meydan» düğmesiyle ortada açılan mini uygulama (telefonda alttan tam ekran);
> içinde üst çubuk, hikâyeler, kart akışı, çevrilen kartlar, alt sekme çubuğu.
> v2: bilgisayarda üç sütun (menü ve hesaplar · akış · özet), modül başına günlük
> rapor (30 günlük eğilim, bulgular, öneri ↔ dayanağı), profil, arama, yanıt dizisi
> (Danışma görevlisi; model yoksa kural cevabı), BAM gitar paketinden çalınabilir müzik.
> Hikâyeler (§5.7): günde bir, sakin dönemde iki günde bir; kapak · sayı · bilgi · tek
> küçük etkileşim; model çağrılmaz.
> Modüllere dokunulmadı (M3, M4 bekliyor). Öğretici ve tekrar edici kısım: BAM'ın
> ders, kart ve soru kayıtları akışa girer; yanlış cevap ve eklenen kart Meydan'ın
> kendi destesinde 1 · 3 · 7 · 14 · 30 günle döner (ESP'nin takvimi değişmez).
> Önceki durum: fikir (kullanıcı kararı, 2026-09-24: «şimdi sisteme entegre etmeyelim»).
> Kaynak: kullanıcının `meydan-v2` örneği. Etkileşimli örnek: `meydan.html`
> (örnek veri; tarayıcıda açılır, yaptığın seçimler yalnız o tarayıcıda kalır).

## 1. Ne

Meydan, sistemin **kendi akışıdır**. Masalar (King, BAM, üç modülün Patronu ve
uzmanları) günün bulgularını, tekliflerini ve kararlarını gönderi olarak yazar.
Kullanıcı okur, karar verir, not düşer. Dili sosyal medyanın tanıdık dilidir:
hesap, hikâye, akış, yanıt, kaydet. Ama meydanda başka insan yoktur, beğeni
sayısı yoktur ve akış bir yerde biter.

Tek işi şudur: **dört sistemin bugün ne söylediğini ve senden ne beklediğini
tek bakışta göstermek.**

## 2. v2'den ne kaldı, ne değişti

| v2'de | v3'te | Neden |
|---|---|---|
| Hesap = masa, rozetler, modül rengi | Kaldı; avatarın **şekli** de modülü söyler (AYS kare, SPİ daire, ESP karo, Merkez altıgen) | Renk körlüğünde de ayrılır (katalog 165) |
| Akış · Kısa · Kaydedilenler sekmeleri | Tek akış + süzgeç çipleri; Kaydedilenler Kütüphanem'de; «Kısa» Tam düzeyde **Haftanın sayıları** şeridi | Ekran içi sekme 0 (sadelik bütçesi) |
| Kalp, çift dokunuşta kalp patlaması | **Faydalı**: özel, sayısı yok, yalnız senin sıranı değiştirir | Tek kişilik sistemde beğeni sayısı anlamsız; etkileşim hiçbir kararı değiştirmez (AGENTS §1.6) |
| Ankette yüzdeler (41 / 35 / 24) | Yüzde yok. Seçimin bir **tercih aksiyonu** olur (küçük, Geri al); seçmezsen kural motorunun seçeceği ve nedeni yazılıdır | Başka kimse oy vermiyor; o yüzdeler uydurma, etiketsiz sayılardı (§1.2, §1.7) |
| Paylaş: «AYS Patron» adına yazmak | **Sen** olarak «Günün notu» | Kullanıcı masanın ağzından yazarsa hangi cümlenin kural motorundan geldiği karışır |
| Yazılan metin olduğu gibi gönderi | Ölçülebilir cümle **kayıt önerisi** olur, sessizce yazılmaz; olumsuz («koşmadım») ya da ileriye dönük («yarın») cümle kayıt olmaz; modül belirsizse **sorulur** | `olumsuz.js` kapısıyla aynı kural; belirsiz girdi tahmin edilmez (§1.7) |
| Hikâye 5 saniyede kendi ilerler | Sen geçersin; ilerleme çubuğu yalnız yeri gösterir | Dikkat çekmek için hareket yok (STIL «Hareket», katalog 12) |
| Teklif akışta yok | Teklif akışta **karar verilebilir**; ama tek yol: Onaylar'daki işleyicinin aynısı. Seviye rozeti: küçük (Uygula + Geri al), orta (Önizle → onay), büyük (Onaylar'da ayrıntılı önizleme) | Onaylar tek çekmecede (CEKMECE-HARITASI); aksiyon seviyeleri (§1.9) |
| — | Karar gönderisinde geri alma süresi ve düğmesi | Geri alınamayan hiçbir şey küçük sayılmaz |
| — | Her gönderide **«Bu gönderi nereden geldi?»**: olay, kural, cümlenin kaynağı, sıra puanı, her sayının kesinliği ve hesabı | Sayıyı kod üretir; kullanıcı bunu görebilmeli (§1.1) |
| Akış sonsuz | **«Bugünlük bu kadar»**; hesap başına günlük sınır, aşan katlanır ve «modülde duruyor» yazar | Bir masa meydanı dolduramaz; akış bitince biter |
| Bricolage, Onest, IBM Plex (Google Fonts) | LifeOS v4: Inter tek aile, `jeton.css` renkleri, açık ve koyu tema | §8-5 kararı; sıfır bağımlılık (§1.3) |

## 3. Tüm modüller için: kapsam

Aynı bileşen beş kapsamda çizilir:

| Kapsam | Ne görünür | Renk |
|---|---|---|
| **Hepsi** | Dört sistemin meydanı tek akışta (Merkez görünümü) | mor (Merkez) |
| **AYS** · **SPİ** · **ESP** | Yalnız o modülü ilgilendirenler: masalarının gönderileri **ve** King'in o modülle ilgili teklif ve kararları | modülün rengi |
| **Merkez** | King ve BAM: kararlar, teklifler, ürünler | mor |

Her olay hangi modülleri ilgilendirdiğini taşır (`ilgili`). Çapraz bir bulgu
iki meydanda da görünür: SPİ'de Barış'ın uyku bulgusu → King'in AYS'ye yük
azaltma teklifi hem SPİ'nin hem AYS'nin meydanındadır.

**Yer önerisi.** Birleşik Meydan HKM'nin yüzündedir (Merkez). Modül kapsamı ileride
her modülün Ofis çekmecesinde bir bölüm olabilir. HKM kapalıyken modül kendi
olaylarından kendi meydanını çizer, King'in gönderileri o sırada gelmez; modül
bozulmaz (§1.4).

## 4. Sadelik: üç düzey

| | Sade | Dengeli (varsayılan) | Tam |
|---|---|---|---|
| Gönderi türleri | teklif, anket, karar, **yalnız uyarı** bulgular, not | hepsi | hepsi |
| Senden karar bekleyen | her zaman | her zaman | her zaman |
| Günün özetleri (hikâye satırı) | yok | var | var |
| Büyük sayı şeridi | yok, sayılar çip olur | var | var |
| Haftanın sayıları | yok | yok | var |
| Süzgeç çipleri, yan sütun | yok | var | var |
| Hesap başına günlük sınır | 1 | 3 | yok (9) |
| «Nereden geldi?» | kapalı | kapalı | açık |

**Kural:** hiçbir şey silinmez. Sade'de görünmeyen gönderi modülün kendi
ekranında durur; senden karar bekleyen hiçbir düzeyde gizlenmez.

## 5. Mantık

### 5.1 Olay → gönderi

Meydan hiçbir şey uydurmaz; her gönderi bir **olaydan** türer. Bugün var olan
olay kaynakları:

- modülün günün özeti (HKM işareti, `Özet` ya da `Gelişmiş` kapsam),
- King'in teklifleri ve kararları (HKM onay zinciri; teklif türleri
  `HKM/core/intents.py` kataloğundan: `load.reduce`, `material.add`,
  `plan.add`, `urun.add` …),
- BAM'ın ürünleri (üretim bürosu, denetimden geçmiş),
- hedef ağı (hedef ilerlemesi, zaman bütçesi).

**Göremedim:** masaların bulguları (Ofis notları, masalar arası devir) bugün
modülün içinde kalıyor; HKM'ye giden bir bulgu kanalı bulamadım. Birleşik
meydanda bulgu görünmesi için HKM işaretine isteğe bağlı bir «bulgu» alanı
gerekir (M3); kapsamı kullanıcının seçtiği düzey sınırlar.

Gönderinin alanları:

```
id, hesap, tur (kapalı katalog), zaman, ilgili:[modül],
sayilar:[ [değer, ad, kesinlik, hesap] ],   kesinlik: ölçüldü | tahmin | hesaplandı | veri yok
cumle        — kural şablonu; model kapalıyken de aynen yazılır
modelCumle?  — model açıksa yalnız üslup; sayının altında, ayrı durur
teklif?      — { tip: intent kataloğundan, seviye: küçük|orta|büyük, önce/sonra }
konular:[#etiket], kaynak
```

### 5.2 Tür kataloğu (kapalı)

`teklif` · `anket` · `bulgu` (uyarı / bilgi) · `karar` · `özet` · `hedef` ·
`ürün` · `not` (yalnız «Sen»). Yeni tür kodla eklenir; model tür uyduramaz.

### 5.3 Etkileşim → sistem eylemi

| Dokunuş | Sistemde ne olur |
|---|---|
| Yanıtla | Masanın Danışma sohbetine gider; cevabın sayısını kural motoru verir |
| King'e ilet | King'e iş emri olur ve Onaylar'da bekler; Geri al |
| Faydalı | O hesabın o türü sende +10 öne alınır. Başka hiçbir şey bu işarete bakmaz |
| Kaydet | Kütüphanem › Kaydedilenler |
| Anket seçimi | Tercih aksiyonu (küçük): sormadan uygulanır, Geri al kalır |
| Teklif: Uygula · Önizle · Reddet | Onaylar'daki işleyicinin aynısı. HKM yalnız teklif yazar, modül kendi koduyla uygular (§1.4). Öneri: reddedilen teklifi masa bir hafta tekrar yazmaz |
| Karar: Geri al | Modülün geri al kaydı (İstisnalar) |
| Not yaz | «Sen» gönderisi. Kayıt önerileri modüle gider, onaylanan eklenir |

### 5.4 Sıralama

Önem: teklif 100 · anket 90 · bulgu 70 · karar 60 · özet 50 · hedef 40 ·
ürün 30 · not 20. Senden karar bekliyorsa +50, uyarı +5, Faydalı +10. Sıra: gün
→ önem → saat. Okuma süresi, tıklama ve izlenme **ölçülmez** ve sıraya girmez.

### 5.5 Sınırlar ve gizlilik

- Hesap başına günlük sınır (Sade 1, Dengeli 3); aşan katlanır, silinmez.
- Akış biter: «Bugünlük bu kadar».
- Meydan, HKM'nin görmediğini gösteremez: SPİ'den gelen, işaretin kapsamı
  kadardır (Özet'te tahlil değeri, ilaç adı ve semptomun kendisi gitmez).
- Gizlilik kilidi (176) açılışta Meydan'ı da kapatır.
- Model kapalıyken Meydan olduğu gibi çalışır; yalnız üslup cümlesi düşer.

### 5.6 Doktrin denetimi (AGENTS.md §1)

| Kural | Meydan'da |
|---|---|
| 1 Kural motoru otoritedir | Cümleyi ve sayıyı kural kurar; model yalnız üslup, ayrı durur. Etkileşim ölçülmüş sayıyı değiştirmez |
| 2 Eksik veri sıfır değildir | «—  veri yok» çipi; hesap satırında «sıfır sayılmaz» |
| 3 Sıfır bağımlılık | v4 jetonları, Inter; çalışma zamanı paketi yok |
| 4 Modül HKM'ye bağımlı değil | Birleşik meydan HKM'de; modül kapsamı HKM kapalıyken yerel olaylardan |
| 5 Sınırlar | SPİ bulgusu teşhis değildir; ESP/AYS gönderisi yetenek yargısı kurmaz |
| 6 XP karar vermez | Faydalı yalnız sırayı değiştirir; puan, seri ya da rütbe üretmez |
| 7 Anlamadığını anlamış gibi yapma | Belirsiz not sorulur; uydurma yüzde yok |
| 9 Aksiyon seviyeleri | Teklifte küçük / orta / büyük rozeti ve ona göre akış |

### 5.7 Hikâyeler (kullanıcı kararı 2026-09-25: «günde bir, bazen iki günde bir; küçük etkileşim; masraf çıkarmasın»)

- **Ritim kodundur.** Önemli günde (senden karar bekleyen, uyarı, bugün gelen
  BAM ürünü) hesap hikâye atar; sakin günde dün attıysa bugün dinlenir, atmadıysa
  atar. Böylece günde en çok bir, sakin dönemde iki günde bir. Atılan hikâye gün
  boyu durur (`meydan_hikaye`: yalnız ritim, içerik değil; türetilmiştir, yedeğe
  girmez, 14 günden eskisi silinir). Hikâye yalnız bugün vardır.
- **Kareler gönderilerden gelir,** yeni bir şey söylemez: kapak (başlık, sayım) →
  günün sayısı (etiketiyle; boş alan «veri yok, sıfır sayılmadı») → bir bilgi
  (bulgu, ilgili öneri, özet) → **tek** küçük etkileşim. Her karede «Gönderiyi aç».
- **Etkileşim kataloğu (sıra koddadır):** karar (gönderide önizleme + tek onay) >
  BAM sorusu (kodla sınanır, yanlış destene girer) > kart (çevir, dinle, destene
  ekle) > müzik (dinle) > yön sorusu («uyku son 30 günde hangi yönde?», cevabı
  kural motorunun eğilimi) > «Faydalı».
- **Masrafsız:** model çağrılmaz, yeni uç yoktur (cevap, deste, işaret uçları
  aynen), hikâye kendiliğinden ilerlemez. «Gördüm» halkası yalnız o tarayıcıdadır;
  izlenme ölçülmez ve hiçbir şey ona bakmaz.

## 6. İleride — aşamalar (şimdi yapılmıyor)

| Aşama | Ne | Modül değişikliği |
|---|---|---|
| M0 | Bu belge ve `meydan.html` | yok |
| M1 | HKM'de **salt okunur** Meydan: var olan olaylardan (özet, King teklif ve kararı, BAM ürünü, hedef) | yok |
| M2 | Etkileşimler var olan kanallardan: King iş emri, intent'ler, Onaylar'ın işleyicisi | yok (HKM tarafı) |
| M3 | Masa bulguları HKM işaretine, isteğe bağlı ve kapsamla sınırlı | beacon'a bir alan |
| M4 | Modül kapsamı her modülün Ofis çekmecesinde; HKM kapalıyken yerel | ekran (K) |

Her aşama kendi testleriyle gelir; sadelik bütçesi ve envanter geçerlidir.

## 7. Açık sorular

1. Meydanda başka insan olacak mı? SPİ aile profillerini tanıyor. Şimdilik tek
   kişi varsaydım.
2. Hikâye v2'deki gibi kendi ilerlesin mi? Varsayılanı kapalı önerdim.
3. Birleşik Meydan yalnız HKM'de mi dursun, her modülde bir bölüm de olsun mu?
   Tasarım ikisini de taşıyor.
4. «Kısa» (tam ekran dikey sayılar) ayrı bir görünüm olarak kalsın mı? Tam
   düzeyde şeride çevirdim.
