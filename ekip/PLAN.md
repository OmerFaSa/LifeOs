# LifeOS — Büyük Plan: Esnek Hedef Sistemi

> **TASLAK — kullanıcı onayı bekliyor.** Bu belge üç Opus'un (Opus-1 bu
> oturum, Opus-2, Opus-3) birlikte yürüteceği işin ana planıdır. Onaylanınca
> iş bölümü ve iletişim metinleri (`ekip/KOORDINASYON.md`) bundan türetilir.
> «(Öneri)» işaretli maddeler Claude'un kendi fikridir; kullanıcı «yap»
> demeden uygulanmaz.

## 0. Mentalite — tek cümlede

**Herhangi bir kullanıcı, herhangi bir modülde, kendi cümlesiyle bir hedef
söyler; ofisler birbiriyle konuşarak onu araştırılmış bilgiye, kişinin kendi
kapasitesine göre kurulmuş gerçekçi bir plana, kullanılabilir materyallere ve
sürekli uyarlanan bir yola çevirir. Karar kodundur, onay kullanıcınındır.**

Örnekler (hepsi aynı hattan geçer):

| Kullanıcı der ki | Modül | Hat ne üretir |
|---|---|---|
| «3 kilo vermek istiyorum» | SPİ | gerçekçilik + araştırma (beslenme, hareket) + plan + alışveriş listesi + özet kartı + haftalık uyarlama |
| «4 kilo almak istiyorum, yüksek proteinli ne yiyebilirim» | SPİ | besin raporu (kaynaklı) + öğün planı + sepet (bütçeyle) + quiz |
| «VKİ'mi 24'e indirmek istiyorum» | SPİ | VKİ'yi kod hesaplar, hedef kiloya çevirir, aynı hat |
| «Bir yılda gitarda şu seviyeye gelmek istiyorum; günde yarım saatim var» | ESP | gerçekçilik («bu olmaz, şu olur») + senaryolar (30 dk / 1 saat) + program + egzersiz kartları |
| «Bir ayda İngilizcede A2'ye» | ESP | seviye merdiveni + kelime destesi + alıştırma |
| «KPSS genel kültür için test kitabı istiyorum» | AYS (KPSS profili) | koç → Patron → akademik alt patron → King → BAM → bölümlü, kalite denetimli test kitabı |
| «TYT matematiği 100 günde bitirmek istiyorum» | AYS | konu sırası + günlük hedef + deneme günleri + tekrar görevleri |

## 1. Değişmeyen ilkeler (doktrin + bu planın eklediği)

1. **Kural motoru otoritedir.** Gerçekçilik kararı, plan aritmetiği, kalori
   ve protein toplamları, eşikler kodla hesaplanır. Model araştırır, yazar,
   anlatır. (AGENTS.md §1.1)
2. **Kullanıcı en üsttedir.** Ajanlar arasında King en üstte; ama King de
   kullanıcının onayı olmadan hiçbir şeyi uygulayamaz.
3. **Katlar atlanmaz.** Koç → modül Patronu → HKM alt patronu → King → BAM
   Patronu → ofis patronu → çalışan. Cevap aynı yoldan döner. Çalışanlar başka
   birimin çalışanıyla doğrudan konuşmaz.
4. **Her bilginin kökü, tarihi ve kapsamı vardır.** Kaynak, erişim tarihi,
   tazelik süresi; kapsam `genel` (herkese yarar) ya da `kisisel`
   (yalnız o kullanıcı).
5. **Önce depo, sonra değişiklik, en son sıfırdan.** Aynı bilgi iki kez sıfırdan
   araştırılmaz.
6. **Hiçbir şey sessizce değişmez.** Plan değişikliği fark önizlemesiyle teklif
   olur; büyük aksiyon onay ve geri dönüş noktası ister. (AGENTS.md §1.9)
7. **Sınırlar:** SPİ teşhis koymaz, doz önermez. Tehlikeli hedef (aşırı hızlı
   kilo kaybı gibi) kodla **reddedilir** ve güvenli karşı teklif sunulur.

## 2. Hedefin yaşam döngüsü — uçtan uca hat

```
 1 Niyet        modül sohbeti · HKM sohbeti · Hayat Mottosu · ses
 2 Netleştirme  eksik alan sorulur: kapasite, tarih, kısıt, tercih, sağlık durumu
 3 Gerçekçilik  KOD: bant (gerçekçi / zorlayıcı / olmaz) + dayanak + karşı teklif
 4 Senaryolar   A: 3 ay · günde 30 dk   B: 6 hafta · günde 1 saat   C: …  → kullanıcı seçer
 5 İş emri      koç → Patron → HKM alt patronu → King
 6 King         imkân kontrolü: ofis açık mı, model var mı, bütçe, depoda var mı
                → onay / kısmi / ret + tahmini süre + (öneri) tahmini maliyet → BİLDİRİM
 7 BAM          Kayıt (depo) → Araştırma (depo / değişiklik / sıfırdan) → Planlama →
                Üretim → Kalite → Kayıt
 8 Teslim       modüle teklif: hedef.kur · plan.apply · material.add (önizleme + onay)
 9 Uygulama     modül KENDİ koduyla yazar; ilerlemeyi ölçer, HKM'ye bildirir
10 Uyarlama     haftalık kontrol → sapma nedeni → plan farkı önerisi → onay
11 Kapanış      tamam / bırakıldı → çıkarım (hafıza «tahmin» katmanı, kural) → depo
```

## 3. İş kolları

### A. Hedef çekirdeği (ortak)
- Tek hedef şeması: `alan`, `tür` (azalt / artır / ulaş / seviye / alışkanlık),
  `şimdi` (etiketli ölçüm), `hedef`, `son tarih`, `kapasite` (günlük dakika, haftalık gün),
  `kısıtlar`, `tercihler`, `durum` (taslak / aktif / askıda / tamam / bırakıldı).
- Hedef türleri kataloğu: kilo ver/al, VKİ, kas, klinik değer (yalnız izleme ve
  hekim), sınav neti / sıralama, konu bitirme, dil seviyesi, enstrüman seviyesi,
  okuma, alışkanlık.
- Var olanın üstüne kurulur: SPİ `SP.GOALS` (cut/gain/maintain) ve enerji
  hesabı (`nutri.js`), ESP günlük taban (`ESP.Coach.dailyBase`) ve seviye merdiveni
  (`ESP.Curriculum`), AYS planlayıcı, müfredat ve istisnalar (`R.Istisna`).
- **(Öneri) Zaman bütçesi:** Kullanıcının günde toplam N saati var. AYS, SPİ ve
  ESP hedefleri aynı zamanı paylaşır; çakışmayı King görür ve «bu üç hedef
  günde 4 saat istiyor, senin 2,5 saatin var» der. Seçimi kullanıcı yapar.

### B. Gerçekçilik ve senaryo motoru (kod)
- Alan kural paketleri:
  - **SPİ:** enerji dengesi, güvenli değişim hızı bantları, VKİ.
  - **AYS:** kendi son denemelerinden net artış hızı, kalan konu / kalan gün.
  - **ESP:** seviye merdiveni ve tipik pratik saatleri.
- Her eşiğin bir **dayanağı** olur (kaynak ya da kullanıcı/hekim girişi).
  Dayanağı olmayan eşik «kaynak bekliyor» diye görünür, karar veremez.
- Çıktı: bant, gerekçe, karşı teklif, 2–3 senaryo (kapasiteye göre), güven etiketi.
- **(Öneri) Güvenlik reddi:** SPİ'de sağlıksız hıza giden hedef kodla reddedilir
  ve güvenli senaryo sunulur. Yaş ve bildirilen durumlar (`conditions`) hesaba girer.

### C. Bilgi Deposu ve Araştırma Ofisi
- Web araması adaptörü (HKM, standart kütüphane, sağlayıcıdan bağımsız arayüz).
- İddia–kaynak eşlemesi: her iddianın URL'si, başlığı, yayın ve erişim tarihi.
- **Tazelik politikası:** alan başına süre (beslenme ilkeleri uzun, sınav
  takvimi/müfredat yıllık, fiyatlar kısa).
- **Değişiklik araştırması:** eski rapor → «bu tarihten sonra değişen var mı?»
  → yalnız farkı araştır → yeni sürüm + değişiklik günlüğü.
- Çelişki analizi, kanıt düzeyi (sağlıkta: kılavuz > sistematik derleme >
  tek çalışma > görüş), konu anahtarı ve eşanlamlılar.
- `genel` / `kisisel` ayrımı: genel raporlar ileride üyeler arasında paylaşılır;
  kişisel veri o depoya asla girmez.
- Rapor şablonları: besin raporu, egzersiz raporu, konu özeti, müfredat raporu.

### D. Planlama Ofisi
- Deterministik planlayıcı: kapasite, takvim, istisnalar, önkoşul sırası,
  aralıklı tekrar, toparlanma haftaları (SPİ), deneme günleri (AYS).
- Plan nesnesi (dönem → hafta → gün → görev), plan sürümleri, **plan farkı**
  (eklenecek / taşınacak / kaldırılacak / değişmeyen).
- Simülasyon: «bu hızla giderse ne zaman biter» senaryoları.
- Plan denetçisi: güvenli sınırlar, aşırı yük, çakışma.
- **(Öneri) Yapılandırılmış kırmızı çizgi:** Hayat Mottosu'ndaki «uykumdan
  çalmam» gibi bir çizgiye isteğe bağlı kural eklenir (ör. «24:00 sonrası blok
  yok»). Plan denetçisi bunu kodla uygular.

### E. Üretim Ofisi — genişleme
- Mevcut türler: soru seti, alıştırma, kart.
- Yeni türler:
  - bölümlü **test kitabı** (zorluk dağılımlı)
  - quiz
  - **özet kartı / pankart** (SVG)
  - **alışveriş listesi** (SPİ, Sedef'in bütçesiyle)
  - öğün planı ve tarif önerisi (**besin değerleri SPİ'nin kendi veritabanından,
    kodla**)
  - antrenman kartları
  - okuma listesi
  - enstrüman egzersiz kartı
  - kelime destesi
- Türe göre kalite kontrolü: bağımsız çözüm, yargı, **sayısal doğrulama**
  (kalori ve protein toplamlarını kod yeniden hesaplar; tutmazsa düşer).

### F. Onay zinciri ve King orkestrasyonu
- Katlar arası **iş emri** biçimi: kimden, kime, ne, neden, iz.
- **İmkân kontrolü** (yetenek kaydı): hangi ofis ya da araç açık, model atanmış mı,
  bütçe, depoda benzer kayıt.
- **Tahmini süre** geçmiş işlerin gerçek sürelerinden hesaplanır («tahmin» etiketi).
- **(Öneri) Tahmini maliyet:** büyük işlerde «~0,40 USD (tahmin)» gösterilir;
  eşiğin üstündeyse kullanıcı onaylar.
- Bildirim kuyruğu (onaylandı, başladı, bitti, bekliyor, reddedildi), iş durumu,
  iptal ve devam, öncelik.

### G. Modül entegrasyonu (AYS, SPİ, ESP)
- Hedef sohbeti ve netleştirme kartları; senaryo seçimi arayüzü.
- Bildirim merkezi.
- `plan.apply` (büyük aksiyon: ayrıntılı önizleme ve geri dönüş noktası).
- Her tür materyali içe alma (bugün yalnız AYS kart alıyor).
- «Hedeflerim» ekranı; ilerlemenin HKM'ye bildirilmesi; uyarlama önerisi arayüzü.

### H. HKM arayüzü
- Ofis ekranı: canlı iş akışı (hangi katta, hangi ofiste), King kuyruğu.
- Bilgi Deposu tarayıcısı (raporlar, kaynaklar, tazelik, sürümler).
- Hedefler panosu (üç modül ve zaman bütçesi), BAM maliyet paneli.
- İz görünümü: «bu görev neden var».

### I. Verimlilik ve maliyet
- Depo öncelikli çalışma, değişiklik araştırması, önbellek.
- **(Öneri) Model kademeleri:** yönlendirme ve kalite kontrolü ucuz modelle,
  araştırma ve üretim güçlü modelle.
- BAM'a ayrı bütçe tavanı; iş başına maliyet kaydı.
- «Kaçınılan çağrı» sayacı: depo sayesinde harcanmayan API, ölçülerek gösterilir.

### J. Kalite, güvenlik, denetim
- Sağlık güvenliği: yeme bozukluğu riski işaretleri, reşit olmayan kullanıcı
  kısıtları, kırmızı bayrak → hekim.
- Mahremiyet: modele giden kişisel veri en aza indirilir.
- **Zincir testi:** `entegre.js`'e uçtan uca «hedeften plana» yolu.
- **(Öneri) Değerlendirme seti:** 30–50 örnek hedef ve beklenen bantlar. Kural
  değişince hangi kararın değiştiği görünür.

### K. Üyelik hazırlığı
- Veri modelinde kullanıcı ve kapsam ayrımı; genel deponun paylaşımı; yetki.
- Sunucu, yerel ağ ve senkron **şimdilik kapsam dışı** (kullanıcı kararı).

### L. Sınav profilleri (KPSS, DGS, LGS, YDS, ALES…)
- Profil paketi: müfredat, puanlama, koç kadrosu. **Patron sabittir**, koçlar
  profile göre değişir.
- Müfredat Araştırma Ofisi ile **kaynaklı** çıkarılır ve kullanıcı onaylar;
  uydurulmuş müfredat yasaktır.
- «KPSS genel kültür test kitabı» bu kol ile Üretim'in (E) kesişimidir.

### M. Hayat Mottosu bağı
- İlkeler ve kırmızı çizgiler King'in imkân kontrolüne ve plan denetçisine girer
  (D'deki öneri).
- Bir düşünceden hedef doğabilir («uzun vadeli gelişim» → ESP hedefi); bağ iz
  zincirinde görünür.

## 4. Turlar — sıra sıra

Her tur bir **dikey dilimdir**: bir örneği uçtan uca çalıştırır, sonra genişletir.

| Tur | Altın yol | Kazanılan |
|---|---|---|
| **0** | — | sözleşmeler, iletişim düzeni, iskelet |
| **1** | SPİ «3 kilo ver» | hedef çekirdeği, gerçekçilik (SPİ), King onayı + tahmini süre + bildirim, web araştırması + depo, plan v1, özet kartı + alışveriş listesi, SPİ'de uygulama |
| **2** | ESP «bir yılda gitar, günde 30 dk» | seviye merdiveni, senaryolar, kapasiteye göre plan, egzersiz kartı ve deste, ESP'de içe alma |
| **3** | AYS «KPSS genel kültür test kitabı» | sınav profili paketi, bölümlü test kitabı, müfredat raporu (kaynaklı) |
| **4** | üç modül birlikte | uyarlama döngüsü, zaman bütçesi, değişiklik araştırması ölçümü |
| **5** | — | cilalama, değerlendirme seti, üyelik hazırlığı |

## 5. Üç Opus — iş bölümü (her turda aynı katman sahipliği)

| | Sahip olduğu iş kolları | Dokunduğu yer |
|---|---|---|
| **Opus-1 (bu oturum, koordinatör)** | sözleşmeler, A (HKM tarafı), B, D, F, doktrin, birleştirme | `HKM/core/` çekirdek (bam, hedef, gercekcilik, planlama, bildirim), `daemon.py` rotaları, `ekip/` |
| **Opus-2** | C, E, I | `HKM/core/` araştırma, depo, web, üretim dosyaları + testleri |
| **Opus-3** | A (modül tarafı), G, H | `brand/ortak/` yeni ortak dosyalar, `AYS/`, `SPI/`, `ESP/`, `HKM/web/` |

J (kalite ve güvenlik) herkesin işidir; K, L ve M sonraki turlarda dağıtılır.
Ayrıntılı sınırlar, dal düzeni, rapor biçimi ve iletişim kuralı
`ekip/KOORDINASYON.md`'de olacak (plan onaylanınca yazılır).

## 6. Başarı ölçütleri (ölçülür, elle yazılmaz)

- Altın yol `entegre.js`'te uçtan uca geçer; HKM kapalıyken modül bozulmaz.
- Aynı genel rapor ikinci kez istendiğinde **sıfır** model çağrısı.
- Değişiklik araştırması, sıfırdan araştırmanın kullandığı jetonun ölçülen bir
  kesri kadar jeton kullanır; oran raporlanır.
- Tahmini süre ile gerçek süre arasındaki sapma raporlanır.
- Kalite kontrolünün düşürme oranı her üretimde görünür.
- Tehlikeli hedeflerin hepsi değerlendirme setinde reddedilir.

## 7. Kullanıcı kararı bekleyenler

1. Plan ve «(Öneri)» maddeleri: hangileri girsin?
2. Web araması: hangi sağlayıcının anahtarı var, BAM'ın aylık bütçesi ne?
3. Tur 1'in altın yolu SPİ «3 kilo ver» olsun mu?
4. Sağlık eşiklerinin dayanağı: araştırma (kaynaklı) mı, kullanıcı/hekim girişi mi, ikisi mi?

## 8. Riskler

| Risk | Önlem |
|---|---|
| Uydurulmuş sağlık bilgisi | kaynaklı iddia, kanıt düzeyi, sayıları kod hesaplar, güvenlik reddi |
| Maliyet patlaması | depo önce, değişiklik araştırması, kademeli model, BAM tavanı, maliyet onayı |
| Üç ajanın birbirini ezmesi | dosya sahipliği, sözleşme tek elden, dal + PR, tur sonu raporu |
| Aşırı karmaşıklık (ufuk 9 ay) | dikey dilim: her tur tek örneği bitirir; genişleme sonra |
