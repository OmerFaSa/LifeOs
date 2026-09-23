# LifeOS — Büyük Plan: Esnek Hedef Sistemi

> **Durum:** Kullanıcı yönü verdi: işin hepsini bu oturum (Claude) yürütür.
> Ek Opus gelirse §5'teki sahiplik tablosuyla bölünür. «(Öneri)» işaretli
> maddeler Claude'un kendi fikridir; kullanıcı «yap» demeden uygulanmaz.
> **Örnekler yalnız örnektir:** sistem örneklere göre değil, herhangi bir
> hedefi alabilecek GENEL bir motor olarak kurulur (§3.0).

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

### 3.0 Genel motor — örneklerden bağımsız

Sistem «3 kilo ver» için değil, **söylenebilecek her hedef** için kurulur:
10 kilo almak, bir hastalıkla yaşarken hekimin talimatına uyan bir plan,
koşuda ilk 5 km, uykuyu düzeltmek, bir dilde B1, bir sınav profili, bir
kitap listesi… ve kullanıcının henüz saymadığı hepsi.

- **Hedef çerçevesi (ortak):** alan, yön (azalt / artır / ulaş / koru / seviye /
  alışkanlık), ölçüt, şimdi, hedef, tarih, kapasite, kısıtlar, tercihler, durum.
  Her modül aynı çerçeveyi kullanır (`brand/ortak/hedef.js`).
- **Alan paketleri:** Her alanın ölçütü, veri kaynağı, gerçekçilik kuralı (ve
  dayanağı), görev şablonları, materyal türleri ve güvenlik kuralları bir
  pakettir. Paket eklemek motoru değiştirmez.
- **Paketi olmayan hedef reddedilmez:** Kod karar veremiyorsa bunu SÖYLER
  («bu alan için gerçekçilik kuralı yok»). Araştırma Ofisi kaynaklı bir
  değerlendirme ve plan önerir, hepsi «tahmin» etiketiyle gelir, karar
  kullanıcınındır.
- **Hedef tanıma:** Yaygın cümleler kuralla tanınır. Tanınmayanda model,
  cümleyi çerçeveye çevirmeyi ÖNERİR (tahlil okuyucusunun yaptığı gibi); kod
  doğrular, kullanıcı onaylar. Eksik alan sorulur.
- **Durum profili:** Modül kişi hakkında bildiği her şeyi etiketiyle toplar:
  ölçümler, tahliller, ilaçlar, bildirilen durumlar, hekim talimatları,
  tercihler, kapasite, geçmiş. Araştırma ve plan buna göre kişiselleşir;
  modele yalnız gereken kadarı gider.
- **Hekim belgesi katmanı (SPİ):** Kullanıcı hekim raporunu ya da talimatını
  getirir. Talimat en yüksek öncelikli kısıttır. Öncelik sırası: hekim
  talimatı > kullanıcının kırmızı çizgisi > kaynaklı kılavuz > genel bilgi >
  model tahmini.
  - Yapılandırılabilen talimat («tuz sınırlı», «protein üst sınırı») plan
    denetçisinde kodla uygulanır.
  - Yapılandırılamayan talimat araştırmaya ve plana «uyulacak hekim talimatı»
    olarak gider.
  - Çelişki varsa o kısım üretilmez ve «hekiminle konuş» denir. SPİ teşhis
    koymaz, doz önermez.
- **Esneklik:** Kapasite, tarih ya da kısıt her an değişebilir; plan fark
  olarak yeniden kurulur. Askıya alma, hastalık ve tatil araları
  (`R.Istisna` benzeri) planı kaydırır, ilerlemeyi silmez.

**Alan paketi kataloğu (başlangıç; açık uçlu):**

| Modül | Paketler |
|---|---|
| SPİ | kilo ver / al, VKİ, vücut kompozisyonu, kondisyon (koşu, yürüyüş), kuvvet, uyku, beslenme alışkanlığı, su, klinik değer izleme (yalnız hekim talimatıyla) |
| ESP | enstrüman, yabancı dil, okuma, yazı, felsefe, diksiyon, tarih |
| AYS | sınav hedefi (net, sıralama), konu bitirme, soru hacmi, sınav profilleri (YKS, KPSS, DGS, LGS…) |


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

Her tur genel motordan bir katmanı bitirir ve en az bir alan paketiyle uçtan
uca çalıştırır.

| Tur | Kazanılan | İlk paketler | Durum |
|---|---|---|---|
| **1** | hedef çerçevesi, tanıma ve netleştirme, gerçekçilik çerçevesi, senaryolar, durum profili, hekim talimatı ve güvenlik kapısı, «Hedeflerim» | SPİ: kilo ver / al, VKİ | **bitti** |
| **2** | King onay zinciri, tahmini süre, bildirim, BAM'a durum profiliyle iş, Planlama Ofisi v1, `plan.apply` | SPİ | **bitti** — ayrıntı §4.1 |
| **3** | kapasiteye göre senaryolar, seviye merdivenleri, ESP'de plan ve materyal içe alma | ESP: enstrüman, dil, okuma | |
| **4** | sınav profilleri, bölümlü test kitabı, müfredat raporu | AYS | |
| **5** | Bilgi Deposu tazeliği, değişiklik araştırması (web kararına bağlı), uyarlama döngüsü, zaman bütçesi (onaylanırsa) | hepsi | |
| **6** | değerlendirme seti, cilalama, üyelik hazırlığı | — | |

### 4.1 Tur 2 — ne kuruldu, ne bilerek bekliyor

**Kuruldu**

| Parça | Yer | Söz |
|---|---|---|
| SPİ plan motoru | `SPI/src/js/core/plan.js` | tempo tarihten, enerji tempodan; bazal metabolizma tabanı; hekim kapısında enerji yazılmaz; talimat çelişkisi aranır |
| `plan-uygula` | `SPI/src/js/core/proposals.js` | büyük aksiyon: önizleme + onay + geri dönüş noktası; model öneremez |
| Hedeflerim | `SPI/src/js/screens/today.js` | önizleme, uygula, özet (sonraki kontrol, ilerleme, hekim), geri al, King'e ilet |
| King onay zinciri | `HKM/core/king.py` | iş emri, zinciri sunucu kurar, imkân kontrolü (ofis, model, bütçe, güvenlik, depo, kuyruk), onay / kısmi / ret |
| Tahmini süre | `HKM/core/king.py` | geçmiş işlerin ortancası ya da adım × ritim; «tahmin» + dayanak; gerçek süre ve sapma ölçülür |
| Bildirim kuyruğu | `HKM/core/king.py`, `bildirimler` tablosu | durum değişimi başına bir bildirim; SPİ Bugün'de gösterir |
| Planlama Ofisi v1 | `HKM/core/planlama.py` | program (dönem → hafta → görev), simülasyon, plan denetimi; sürümlü kayıt |
| `plan.apply` | `HKM/core/intents.py`, `SPI/src/js/core/beacon.js` | SPİ programı çeker, kendi kontrol noktalarıyla sınar, onayla ekler (`program-ekle`, geri alınabilir) |
| Zincir testi | `tools/entegre.js` §2.8 | SPİ → King → BAM → teklif → SPİ, gerçek tarayıcı ve gerçek HKM |

**Bilerek bekliyor** (kullanıcı kararı ya da sonraki tur)

- Tahmini **maliyet** (§3.F, «Öneri»): Planlama v1 model kullanmıyor; maliyet
  ilk model isteyen iş türüyle anlamlı olur.
- Zaman bütçesi (§3.A, «Öneri») ve iş önceliği: Tur 5.
- Hedeften **Araştırma** işi (kaynaklı beslenme/hareket raporu): web kararına
  bağlı (§7.2).
- Hekim talimatının yapılandırılması: v1 yalnız **protein** kısıtını ve
  **enerji**den söz eden talimatı kodla tanır; «tuz sınırlı» gibi öteki
  talimatlar plana «uyulacak talimat» olarak yazılır ama beslenme hedefine
  henüz kodla uygulanmaz.
- ESP ve AYS'de plan: Tur 3 ve 4.

## 5. İş bölümü — şimdilik tek Opus; ek Opus gelirse bu sahiplik tablosu

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
