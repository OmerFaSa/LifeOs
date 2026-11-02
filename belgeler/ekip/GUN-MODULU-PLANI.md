# Gün modülü planı: HKM arayüzü yerine yaşayan bir merkez

> Durum: **plan**, koda geçilmedi (2026-11-02). Fikirlerin hepsinin görsel
> örnekleri tuvalde: https://claude.ai/artifact/7ipZ98otKnCdEHtzJLwcy4
> (sayfalar: Cep, 30 taze fikir, 20 fikir · gün modülü ve modüllerin içi).

## 0. Tek cümlede

HKM'nin ayrı arayüzü (Merkez, :4200 web) kalkar. Yerine AYS, SPİ ve ESP
verilerini birlikte, sıkıcı olmayan biçimde gösteren ve günü kurmaya yarayan
beşinci bir modül gelir: **Gün**. HKM'nin ayarlanabilir kısımları her
modülün Ayarlar'ına sade bir bölüm olarak taşınır.

## 1. Karar ve sınır

- **Kalkan:** HKM'nin kullanıcıya görünen web arayüzü (`HKM/web/index.html`)
  ve kabuktaki «Merkez» satırı (`brand/ortak/kabuk.js`, `MODULLER.mer`).
- **Kalan:** HKM'nin motoru: daemon, veritabanı, King'in hafızası
  (`HKM/core/memory.py`), kural motoru (`kendiliginden.py`), model merdiveni,
  eylem defteri, kanallar. King bu motor olmadan çalışmaz. Kullanıcı motoru
  görmez, yalnız sonuçlarını görür.
- **Tek yönlü bağımlılık kuralı aynen sürer:** AYS, SPİ ve ESP motor
  kapalıyken de tam işlevli kalır. Gün modülü motor kapalıyken boş değil,
  «yerel özet» ile açılır.
- Giriş sayfasındaki dördüncü kart (HKM) Gün modülünün kartı olur.

## 2. Gün modülü: ne işe yarar, ne yaramaz

**Yarar:** günü planlamak, kendini ve ruh halini izlemek, üç modülün
verisini tek yerde canlı görmek, kart tabanlı küçük ritüeller.
**Yaramaz:** ders çalışmak, antrenman kaydı tutmak, okuma yapmak. Bunlar
AYS, SPİ ve ESP'de kalır; Gün yalnız onlara kapı açar.

**Diğer modüllere benzemez.** AYS, SPİ ve ESP bir alanda bir şey öğrenmek
ve yapmak için; Gün o alanlarda **ne yaptığını ve ne yapacağını görmek**
için, daha etkileşimli. Ana ekran taslağı (tuvalde «Plan özeti › Gün modülü
· ana ekran»): ortada günün şeridi (07–23, «şimdi» çizgisi, «Yaptıklarım /
Yapacaklarım» geçişi), altında alan çubukları (dokununca şeride süzer),
«Şimdi ne yapsam?» kartı ve haftanın hayat karnesi; üstte niyet, enerji pili
ve iç hava.

**Üç bölüm** (KOLAY-PLANI'nın «az ekran» ilkesi; yedi bölüm yerine üç):

| Bölüm | Sorusu | İçindekiler (cepten) |
|---|---|---|
| **Bugün** | Ne yaptım, ne yapacağım? | Günün şeridi, sabah kurulumu, günün niyeti, enerji pili, ruh hali ve iç hava, kendi sözün, akıllı boşluk, mola menüsü, yorgun gün modu; plan araçları: zaman blokları, haftanın terazisi, iş borcu defteri, üç büyük taş, hayır listesi |
| **Geçmiş** | Nasıl gidiyor? | Hayat karnesi, günün şekli, ayın dokuması, plan ve gerçek, AYS/SPİ/ESP'den taşınan özetler (§2a); defter: gün sayacı defteri, kayıtlı yapışkan notlar, ses notları, zaman kapsülleri |
| **Sen** | Ne beni besliyor? | Işık ipliği, kendi bağını kur (bağ güçlendikçe büyüyen enerji), enerji veren / çalan, kök salan alışkanlık (ayrıca derin tasarlanacak), «Ne yapsam?» destesi (öğrenen deste), soru kutusu |

## 2b. Kural: her özellik King'e de araç olarak gelir

Gün modülüne ya da modüllere eklenen her yeni özellik aynı turda King'in
aracı olarak da yazılır: King onu okuyabilir, kullanıcı isterse yazabilir.
Yazma işlemleri eylem defterine düşer, geri alınabilir.

- Kapsam testi (ekranda olup King'de olmayan iş kalırsa kırmızı) her fazda
  yeşil kalmalı.
- Her yeni araç için King sınavına cümleler eklenir; sınav puanı düşmez.
- Örnek: «yarın 10:00'a 2 saat AYS koy», «bu hafta karnem nasıl?»,
  «bugüne not bırak», «bir kart çek».

## 2c. Kural: yeni sunucu açılmaz

Gün modülü için yeni süreç, yeni port ya da yeni sunucu yok. Mevcut giriş
sunucusu (`sistem/sunucu.py`) ve ortak kabuk (`brand/ortak`) kullanılır;
veri motor kapalıyken modüllerin yerel kaydından okunur. 8 GB RAM'de bir
süreç daha ofis, Ollama ve testlerle birlikte belleği taşırır.

**Hayat karnesi:** deneme karnesi fikrinin genişletilmiş hali. Her gün bir
sıra kare, her kare bir alan (uyku, beslenme, hareket, çalışma, okuma…):
yapıldı, eksik, boş. Günler alt alta dizildikçe hayatın hangi alanında
takıldığın görünür. AYS'ye özel değil, Gün › Geçmiş'te durur.

## 2a. Sadeleştirme ilkesi: modüller ferahlar

AYS, SPİ ve ESP'nin ekranlarındaki **statik özet kartları** (yalnız bir
rakam ya da durum gösteren, iş yaptırmayan kartlar) kaldırılır. Bu tür
özetler Gün modülüne taşınır ve orada üç modülün verisiyle birlikte,
yaşayan görsellerle gösterilir (Gün › Geçmiş).

- Amaç: sistemin kalabalığını azaltmak, bilgiyi dağıtmak, ferah bir görünüm.
- Modüllerde kalan: o modülde **iş yapmaya** yarayan şeyler (kayıt, çalışma,
  deneme, okuma) ve o alana özgü yaşayan görseller (§4).
- Kural: bir kart taşınmadan önce Gün'deki karşılığı hazır olur; hiçbir
  bilgi arada kaybolmaz.
- Ölçüm: KOLAY-PLANI'nın pusulası (`node tools/pusula.js`) ile ekran
  başına kart ve öğe sayısı önce ve sonra ölçülür; sayı düşmeli.

## 3. Ayarlar: HKM'nin ayarları nereye gider

HKM ayar sekmeleri bugün dört tane: Yapay zekâ ve bütçe, Kanallar ve
cihazlar, Eşikler, Sunucu. Her modülün Ayarlar'ında tek, sade bir bölüm olur:
**King ve bağlantılar**.

- **Görünen (herkes):** model seçimi ve aylık bütçe, telefon / kanal
  bağlantısı aç-kapa, bildirim eşikleri (birkaç kaydırıcı).
- **Gizli («Gelişmiş», yalnız sahip):** sağlayıcı anahtarları, sunucu ve port,
  kanal jetonları, ofis araçları. Varsayılan kapalı, tek satırda açılır.
- Ayarlar tek yerde tutulur, üç modül ve Gün aynı ayarı okur (mevcut ayar
  eşitlemesi kullanılır, `081`).
- Anahtar sorma kuralı korunur (bkz. hafıza: Merkez without key).

HKM web'in diğer bölümlerinin taşınacağı yer (taslak, F0'da ekran ekran
doğrulanır):

| HKM bölümü | Yeni yeri |
|---|---|
| `#/bugun` | Gün › Bugün |
| `#/hedefler` | Gün › Bugün plan araçları |
| `#/motto` | Gün › Bugün «kendi sözün» |
| `#/sistemler` | Gün › Geçmiş |
| `#/teklifler` | King önerileri ve Gün › Sen «Ne yapsam?» |
| `#/sohbet` | King (zaten her modülde) |
| `#/profil` | Ayarlar › Profil |
| `#/para` | Gün › Bugün içinde isteğe bağlı parça ya da Ayarlar; F0'da karar |
| `#/ofis` | Ayarlar › Gelişmiş (yalnız sahip) |
| `#/ayarlar` | Ayarlar › King ve bağlantılar |

## 4. Cepteki fikirlerin yerleşimi

**Giriş sayfası (3 kartlı ekran):** zaman kapsülü.
**Sistem geneli (her modülde):**
- akışkan sol menü,
- damlanın izi: netlik ziyaret sayısına göre (2 kez soluk, 6 belirgin, 10 çok belirgin),
- sağ tıkla not: herhangi bir yere o güne yapışkan not; kaldır ya da kaydet; kayıtlılar Gün › Geçmiş'te,
- ses notu: King'le konuşmadan 30 sn ses, King'e gider,
- telefonda devam et.

Modüllerin içine, kaldırılan statik kartların yerine (§2a) o alana özgü
yaşayan görseller gelir:

- **AYS:** konu haritası (mevcut bilgi ağının yanına), solan konu.
- **SPİ:**
  - uyku şeritleri: son yedi gece, yatış saatinden sapma;
  - günün tabağı: yediklerin dilimleri doldurur, eksik dilim kesik çizgi;
  - saatli şişe: su hedefi saat çizgileriyle;
  - hareket silüeti: çalışan bölgeler ısınır. Bu fikir daha **detaylı**
    tasarlanacak: kas grupları ayrı ayrı, önden ve arkadan görünüm, son
    çalışmadan bu yana geçen gün.
- **ESP:** okuma patikası (yıllık hedef bir patika, kitaplar duraklar).

## 5. Fazlar

Her faz ayrı oturumda başlar. Görsel ve kabuk işi **kırmızı** (yalnız
Claude); veri ve mantık parçaları kabul testiyle ofise gider.

- **F0 · Envanter (yeşil, ofis):** HKM web'deki her ekranı, butonu ve ayarı
  listele; her birinin yeni yerini §3 tablosunda kesinleştir; HKM web'e
  bağlı testleri ve araçları bul. Çıktı: bu dosyada tamamlanmış tablo.
- **F1 · Ayarlar (kırmızı):** «King ve bağlantılar» bölümü üç modülde;
  Gelişmiş kısmı yalnız sahipte. HKM web'deki ayarlar o sırada yerinde kalır.
- **F2 · Gün iskeleti (kırmızı):** yeni modül, yeni sunucu açmadan (§2c);
  kabukta yeri, giriş sayfasında HKM kartının yerine Gün kartı, üç boş
  bölüm.
- **F3 · Bugün (sarı + kırmızı):** günün şeridi, sabah kurulumu, niyet,
  enerji pili, ruh hali / iç hava, plan araçları. Her parça King aracıyla
  birlikte (§2b).
- **F4 · Geçmiş, sonra Sen:** iki ayrı tur, yine her parça King aracıyla.
- **F5 · Sistem geneli dokunuşlar:** akışkan menü, damlanın izi, sağ tıkla
  not, ses notu, zaman kapsülü (giriş sayfası).
- **F6 · Modülleri sadeleştir:** AYS, SPİ ve ESP'deki statik kartların
  envanteri (yeşil, ofis); her birinin Gün'deki karşılığı hazır olunca kart
  kalkar, yerine §4'teki yaşayan görsel gelir (kırmızı). Pusulayla önce ve
  sonra ölçülür.
- **F7 · HKM web'i kapat:** her şey taşındıktan sonra `:4200` arayüzü
  yönlendirmeye döner, kabuktaki Merkez satırı kalkar, belgeler güncellenir.

## 6. Kabul

- HKM web kapatıldığında hiçbir ayar ve hiçbir veri kaybolmaz (F0 listesinin
  her satırı yeni yerinde bir testle doğrulanır).
- King sınavı (`node tools/king_sinav.js --port=4876`) düşmez; kapsam testi
  yeşil; her yeni özelliğin King aracı ve sınav cümlesi var (§2b).
- Yeni süreç ya da port açılmamış (§2c).
- Motor kapalıyken AYS, SPİ, ESP ve Gün açılır, hata vermez.
- Her hareket hafif CSS; «hareketi azalt» açıkken durur; akıcılık ölçümü
  (`lifeos-akicilik-olcum`) kötüleşmez.

## 7. Riskler

- **Motor ile arayüzü karıştırmak:** HKM klasörü silinmez; yalnız web
  arayüzü emekliye ayrılır.
- **Port ve adresler:** kabuktaki `mer:4200`, giriş sayfasındaki
  `KARTLAR` listesi (`sistem/sunucu.py`) ve telefon iskeleti birlikte değişmeli.
- **Bellek (8 GB):** §2c bunun için var; beşinci modül bir sunucu daha
  demek değil.
- **Kapsam şişmesi:** Gün modülü «her şeyin yeri» olmaya kayabilir; §2'deki
  «yaramaz» listesi sınırdır.

## 8. Açık sorular

- Modülün kesin adı (çalışma adı «Gün»).
- `#/para` (bütçe) nereye gidecek?
