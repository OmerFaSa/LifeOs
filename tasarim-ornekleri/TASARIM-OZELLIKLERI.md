# LifeOS · Tasarım kataloğu (sürüm 4)

183 özellik · 47 yeni · 7 yenilendi · 37 P1 (hepsinin kabul ölçütü yazılı) · 19 mevcut. Canlı örnekler `vitrin.html` içinde; bu liste o dosyadaki veriden üretildi.

**Öncelik:** P1 önce, P2 sonra, P3 ileride. **Emek:** az / orta / çok. **YENİ:** bu sürümde eklendi. **YENİLENDİ:** örneği bu sürümde iyileştirildi. **MEVCUT:** sistemde var (depoda adla bulundu), kart tasarımını öneriyor. **Ekran:** hedef rota (ör. `ays/today`); «Tüm ekranlar» ve «Kabuk» her ekrana uygulanır.

## İlkeler

1. **Renk sahipliği söyler.** Mavi AYS, yeşil SPİ, turuncu ESP, mor Merkez. Yeşil/kırmızı yalnız yön.
2. **Etiketsiz sayı yok.** Ölçüldü · hesaplandı · tahmin · veri yok. Eksik veri «—», grafik sıfıra düşmez.
3. **Kod karar verir, model anlatır.** Sayı kuraldan gelir; modelin cümlesi ekranda ayrı durur.
4. **Sınırlar ekranda da geçerli.** SPİ teşhis/doz göstermez; ESP/AYS sertifika ve yetenek yargısı göstermez; XP hiçbir kararın yanında durmaz.

## Entegrasyon yolu

1. **Temeller** → `brand/ortak/base.css`, `designs.css` · `python3 tools/ortak.py --yay`
2. **Ortak bileşenler (A, B)** → `brand/ortak/*.css · *.js · *.test.js` · `python3 tools/ortak.py --denetle`
3. **Modül ekranları (C, D, E)** → `AYS/src`, `SPI/src`, `ESP/src` · `node tools/runtests.js`, `smoke.js`, `a11ycheck.js`, `layoutcheck.js`, `palettecheck.js`
4. **Merkez ve kabuk (F–L)** → `HKM/core/intents.py` teklif kataloğu, modül uygular · `cd HKM && python3 -m tests.run`

Yeni davranış testsiz gelmez; P1 kartlarının kabul ölçütü o testin ilk satırıdır.

## A · Ortak tasarım dili (23)

_her sistemde aynı davranan parçalar_

| # | Özellik | Ne yapar | Neden | Ekran | Önc. | Emek |
|---|---|---|---|---|---|---|
| 01 | **Modül şeridi** | Birden çok modülün işi aynı ekrandaysa her modül kendi yatay şeridinde durur. | Kategoriler aynı listede karışmaz; göz rengi ve satırı birlikte okur. | AYS · Bugün, SPİ · Günlük, ESP · Bugün | P1 | orta |
| 02 | **Tek kutu iskeleti** | Her kutu aynı başlığı taşır: simge, ad ve sağda kesinlik etiketi. | Kutunun ne olduğu içeriğine bakmadan anlaşılır. | Tüm ekranlar | P1 | az |
| 03 | **Üç alan düzeni** | Her «Bugün» ekranı aynı sırada: Şimdi → Durum → Öneri. | Modül değişse de göz aynı yere bakar; öğrenme bir kez olur. | AYS · Bugün, SPİ · Günlük, ESP · Bugün | P1 | az |
| 04 | **Sayfa başı cümlesi** | Ekranın tepesinde kural motorunun ürettiği tek cümlelik durum. | Ekranı taramadan günün özeti alınır; cümle koddan geldiği için tutarlıdır. | AYS · Bugün, SPİ · Günlük, ESP · Bugün | P1 | az |
| 05 | **Hafta şeridi** | Başlığın altında yedi gün; her günde üç modülün noktası, gelecek günler boş halka. | Bugünün haftadaki yeri ve hangi günün boş kaldığı tek bakışta görülür. | AYS · Bugün, SPİ · Günlük, ESP · Bugün | P2 | az |
| 06 | **Günün açılışı** | Günün ilk açılışında tek kart: iş sayısı, toplam süre ve ilk iş. | Güne planı okuyarak değil, tek kartla başlanır. | AYS · Bugün, SPİ · Günlük, ESP · Bugün | P2 | orta |
| 07 | **Gün kapanışı** | Akşam «Bugün kapandı» kartı: üç sayı ve yarının ilk işi. | Gün yarım kalmış hissi bırakmaz; ertesi sabah hazır başlar. | AYS · Bugün, SPİ · Günlük, ESP · Bugün | P2 | orta |
| 08 | **Modül geçiş menüsü** | «LifeOS / AYS» yolundan açılan menü: dört sistem, her biri kendi renginde ve kendi durumuyla. | Sistemler arası geçiş tek tık; hangi sistemde olduğun hiç karışmaz. | Kabuk · üst çubuk ve alt bant | P2 | orta |
| 09 | **Gruplu bildirimler** | Bildirimler modül şeritleriyle gruplanır; Merkez önerileri ayrı kümede durur. | Farklı kategorilerin uyarıları aynı listede birbirine girmez. | Kabuk · üst çubuk ve alt bant | P2 | orta |
| 10 | **Boş durum sahnesi** | Veri yoksa küçük bir çizim ve tek eylem gösterilir. | Boş grafik ya da 0, «ölçüldü ve sıfır» diye yanlış okunur. | Tüm ekranlar | P2 | az |
| 11 | **Sakin hata durumu** · YENİLENDİ | Bir şey bozulursa: ne oldu, verin nerede, tek düğme. Kırmızı yok. | Kullanıcı veri kaybı olmadığını ilk cümlede öğrenir. | Tüm ekranlar | P2 | az |
| 12 | **Tek canlı öğe** · YENİLENDİ | Ekranda aynı anda yalnız bir şey nabız atar: sıradaki iş. | Dikkat bölünmez; hareket görüldüğünde bir anlamı vardır. | AYS · Bugün, SPİ · Günlük, ESP · Bugün | P2 | az |
| 13 | **Gruplu komut sonuçları** · MEVCUT | ⌘K sonuçları modül şeritleriyle gruplanır; aksiyonun seviyesi satırın sonunda yazar. | Aynı kelime iki modülde farklı iş yapar; grup ve seviye yanlış seçimi önler. | Kabuk · üst çubuk ve alt bant | P2 | orta |
| 14 | **Odak kapısı** · MEVCUT | Odak modunda yalnız süren iş ve süresi kalır; geri kalan her şey sisle örtülür, Esc ile çıkılır. | Çalışırken ekranda başka kategori görünmez; dikkat dağılmaz. | AYS · Soru çöz, ESP · Dil Stüdyosu | P2 | orta |
| 15 | **Son bilinen değer** | Veri yenilenirken iskelet yerine son bilinen değer ve saati durur; üstte ince bir tarama çizgisi. | Ekran boşalıp dolmaz; kullanıcı elindeki son doğru bilgiyi kaybetmez. | Tüm ekranlar | P2 | az |
| 16 | **Terim ipucu** | «Tekrar borcu» gibi terimlerin altı noktalı; üzerine gelince tek cümlelik tanım ve örnek açılır. | Sistemin dili öğrenilir; aynı kelime her ekranda aynı anlama gelir. | Tüm ekranlar | P1 | az |
| 17 | **Ne değişti?** | Güncellemeden sonra ilk açılışta tek kart: yeni, düzeltilen ve kaldırılan şeyler. | Yeri değişen bir özellik kullanıcıyı şaşırtmaz. | Kabuk · üst çubuk ve alt bant | P3 | az |
| 18 | **Şüpheli giriş sorusu** | Dünkü değerden çok sapan giriş hemen kaydedilmez; kod en olası düzeltmeyi sorar. | Kural 7: belirsiz girdi tahmin edilmez, sorulur. | SPİ · Günlük, AYS · Soru çöz | P1 | az |
| 19 | **Bölüm çubuğu** · YENİ | Uzun sayfalarda üstte yapışık bölüm çipleri; bulunduğun bölüm vurgulu, yanda ince konum çizgisi. | Uzun ekranda kaybolmadan bölümden bölüme atlanır. | AYS · Denemeler, SPİ · Analiz, ESP · Kütüphane | P2 | az |
| 20 | **Etkin süzgeç çipleri** · YENİ | Açık süzgeçler çip olarak hep görünür; her biri tek dokunuşla kalkar, sonuç sayısı altta. | Boş liste «veri yok» mu «süzgeç mi» sorusu hiç doğmaz. | AYS · Analiz, SPİ · Analiz, ESP · Analiz | P2 | az |
| 21 | **Kaydedilmemiş değişiklik** · YENİ | Değişen alanın yanında nokta; altta «2 değişiklik kaydedilmedi · Vazgeç · Kaydet» şeridi. | Kullanıcı neyi değiştirdiğini ve kaydetmediğini bilir; veri sessizce kaybolmaz. | Ayarlar | P2 | az |
| 22 | **Sonucu söyleyen düğme** · YENİ | Yıkıcı düğme sonucu adıyla ve sayısıyla söyler: «14 bloğu sil». «Evet» ya da «Tamam» yok. | Onay anında ne olacağı düğmenin üstünde yazar; yanlış tıklama azalır. | Tüm ekranlar | P1 | az |
| 23 | **Yazılabilir gün penceresi** · YENİ · MEVCUT | Tarih seçicide bugün ve 7 gün geri açık; daha eskisi kilitli ve taralı. | Geçmişe kayıt kuralı ekranda görünür; kullanıcı neden yazamadığını anlar. | AYS · Bugün, SPİ · Günlük, ESP · Bugün | P2 | az |

**Kabul ölçütleri (P1)**

- **01 · Modül şeridi** — Aynı gün ekranında birden çok modülün işi varsa her modül ayrı şeritte; şerit etiketi yatay kaydırmada solda sabit kalır.
- **02 · Tek kutu iskeleti** — Her kutunun başlık satırı simge, ad ve (sayı varsa) kesinlik etiketi taşır; etiketsiz sayı içeren kutu denetimden geçmez.
- **03 · Üç alan düzeni** — Üç modülün Bugün ekranında bölüm sırası Şimdi → Durum → Öneri; duman testi sırayı doğrular.
- **04 · Sayfa başı cümlesi** — Sayfa başı cümlesi kural motorundan gelir; dil modeli kapalıyken de aynı cümle görünür.
- **16 · Terim ipucu** — Sistem terimleri tek sözlükten gelir; aynı terim her ekranda aynı tanımı gösterir.
- **18 · Şüpheli giriş sorusu** — Dünkü değerden eşik oranı kadar sapan giriş kaydedilmeden önce sorulur; eşik kodda tanımlı ve testli.
- **22 · Sonucu söyleyen düğme** — Yıkıcı her düğme sonucunu adıyla ve sayısıyla söyler («14 bloğu sil»); «Evet» ya da «Tamam» kullanılmaz.

## B · Sayı ve veri (18)

_etiketsiz sayı yok, eksik veri sıfır değil_

| # | Özellik | Ne yapar | Neden | Ekran | Önc. | Emek |
|---|---|---|---|---|---|---|
| 24 | **Kesinlik glifleri** · MEVCUT | Dolu, yarım, kesikli, çizgi. Tahmin olan sayının altı kesik ve aralığıyla birlikte. | Kural 2: etiketsiz sayı hiçbir katmana girmez. | Tüm ekranlar | P1 | az |
| 25 | **Köken kartı** | Sayının üzerine gelince nereden geldiği açılır: formül, girdiler, hesap zamanı. | Kod otoritedir; kullanıcı her sayının hesabını kendi gözüyle görebilir. | Tüm ekranlar | P1 | orta |
| 26 | **Veri tazeliği** | Eski ölçüm soluklaşır ve yaşını yazar: «12 gün önce». | Bayat veri güncelmiş gibi görünüp kararı yanıltmaz. | SPİ · Günlük, SPİ · Testler | P1 | az |
| 27 | **Eksik gün boşluğu** | Grafikte verisi olmayan gün boşluk kalır; çizgi kesikli geçer, sıfıra düşmez. | Eksik veri sıfır değildir; düşen çizgi olmayan bir kötüleşme gösterir. | SPİ · Analiz, AYS · Analiz | P1 | az |
| 28 | **Anlamlı fark rozeti** | Rozetin rengi işaretten değil anlamdan gelir: net artışı iyi, borç artışı kötü. | +41 tekrar borcu yeşil gösterilirse yanlış haber olur. | Tüm ekranlar | P1 | az |
| 29 | **Eşik çizgili çubuk** | Değer ve eşik aynı çubukta. | Eşiğin ne kadar aşıldığı hesaplanmadan görülür. | AYS · Bugün, AYS · Tekrar | P2 | az |
| 30 | **Tik sayacı** | Küçük hedefte yüzde yerine adet kutucukları. | Kalan 3 kutu sayılır; %83 soyut kalır. | AYS · Bugün | P2 | az |
| 31 | **Hedef bandı** | Grafikte hedef aralığı yatay bant; bant dışındaki noktalar içi boş. | Tek hedef sayısı yerine kabul edilebilir aralık; her sapma alarm değildir. | SPİ · Analiz | P2 | az |
| 32 | **Geçen dönem gölgesi** · YENİLENDİ | Geçen dönem soluk kesik çizgi olarak arkada durur. | Karşılaştırma için ikinci bir grafik gerekmez. | AYS · Analiz, SPİ · Analiz, ESP · Analiz | P3 | az |
| 33 | **Gelecek yük grafiği** | Önümüzdeki yedi günün tekrar yükü; bugün dolu, gelecek kesikli. | Birikme olmadan görülür ve Merkez önerisinin gerekçesi olur. | AYS · Tekrar, ESP · Dil Stüdyosu | P2 | orta |
| 34 | **Grafiğin cümlesi** | Her grafiğin altında kodun ürettiği tek okuma cümlesi. | Acele eden kullanıcı da ekran okuyucu da aynı bilgiyi alır. | AYS · Analiz, SPİ · Analiz, ESP · Analiz | P2 | az |
| 35 | **Aralık çubuğu** | Tahmin tek sayı değil aralık olarak çizilir; en olası değer çizgiyle, dayanağı altta yazılı. | Sıralama tahmini gibi belirsiz sayılar kesinmiş gibi görünmez. | AYS · Denemeler | P1 | az |
| 36 | **Dağılım şeridi** | Otuz gecenin her biri bir nokta; ortadaki çizgi medyan. | Ortalama tek başına dalgalanmayı saklar; dağılım düzensizliği gösterir. | SPİ · Analiz | P3 | az |
| 37 | **Güvenli eğilim** | Eğilim oku yalnız yeterli veri varsa çizilir; yoksa kaç ölçüm daha gerektiği yazar. | İki noktadan eğilim çıkarmak, anlamadığını anlamış gibi yapmaktır. | AYS · Analiz, SPİ · Analiz, ESP · Analiz | P1 | az |
| 38 | **Satır içi çubuklu tablo** · YENİ | Tablodaki yüzde hücresinin arkasında ince çubuk; sayı ile boyut aynı yerde okunur. | Ayrı bir grafik açmadan satırlar karşılaştırılır. | AYS · Analiz | P2 | az |
| 39 | **Hız tahmini** · YENİ | Bu hızla hedefe ne zaman varılacağı aralık olarak; gelecek, açılan bir koni. | Tahmin tek tarih değil; belirsizlik genişledikçe koni de genişler. | AYS · Denemeler, AYS · Analiz | P2 | orta |
| 40 | **Birikim eğrisi** · YENİ | Çözülen sorunun birikimli çizgisi ve plan çizgisi; bugünkü fark kırmızı çizgiyle. | Günlük dalgalanma değil, yolun genel gidişi görülür. | AYS · Analiz | P3 | az |
| 41 | **Veri doluluğu** · YENİ | Her modül için son 7 gün; veri olan gün dolu, olmayan içi boş kare. | Kural 2: eksik gün sıfır sayılmaz; hangi modülde veri boşluğu olduğu görülür. | AYS · Analiz, SPİ · Analiz, ESP · Analiz | P1 | az |

**Kabul ölçütleri (P1)**

- **24 · Kesinlik glifleri** — Ekrandaki her sayı brand/ortak/kesinlik ile işaretli; «veri yok» olan sayı hiçbir yerde 0 olarak çizilmez.
- **25 · Köken kartı** — Hesaplanan her sayının üzerine gelince formül, girdiler ve hesap saati görünür; ölçülen sayıda kaynak ve ölçüm saati.
- **26 · Veri tazeliği** — Ölçümün yaşı eşiği geçince değer soluklaşır ve yaşını gün olarak yazar; eşik kodda tek yerde tanımlı.
- **27 · Eksik gün boşluğu** — Verisi olmayan gün çizgide boşluk olarak kalır; hiçbir grafik eksik günü 0’a çizmez (birim testiyle).
- **28 · Anlamlı fark rozeti** — Fark rozetinin rengi metriğin yön tanımından gelir; aynı işaret farklı metrikte farklı renk alabilir.
- **35 · Aralık çubuğu** — Tahmin olan sayı tek değer değil aralık olarak gösterilir ve dayanağı (kaç veri) yazılır.
- **37 · Güvenli eğilim** — Eğilim oku yalnız en az 5 veri varsa çizilir; altında kaç ölçüm daha gerektiği yazar.
- **41 · Veri doluluğu** — Her modül için son 7 günün veri doluluğu gösterilir; boş gün içi boş kare, 0 değil.

## C · AYS (26)

_sınav hazırlığı_

| # | Özellik | Ne yapar | Neden | Ekran | Önc. | Emek |
|---|---|---|---|---|---|---|
| 42 | **Sıradaki blok kahramanı** | Ekranın en büyük öğesi tek iş; adımlar süreyle orantılı çubukta. | Bugün ekranının asıl sorusu: şimdi ne yapacağım? | AYS · Bugün | P1 | orta |
| 43 | **Geri sayım rozeti** | Uzakken sakin, son 15 dakikada canlı. | Yaklaşan iş ekrana bakmadan fark edilir. | AYS · Bugün | P2 | az |
| 44 | **Nötr soru şeridi** | Çözerken yalnız ilerleme; doğru/yanlış rengi set bitince açılır. | Set ortasında yanlış görmek kaygı yaratır ve sonraki soruyu bozar. | AYS · Soru çöz | P2 | az |
| 45 | **Yanlış kartı** | Önde soru, arkada «neden yanlış». Tekrarda kart çevrilir. | Yanlıştan öğrenme tekrarın içine girer. | AYS · Tekrar | P2 | orta |
| 46 | **Deneme karnesi** | Ders başına tek satır; satır uzunluğu o dersin soru sayısı kadar. | Netin nerede kaybedildiği tek bakışta görülür. | AYS · Denemeler | P1 | orta |
| 47 | **Hız şeridi** | Denemede her sorunun süresi bir nokta; ortalamanın 1,5 katını geçenler öne çıkar. | Zaman kaybı yanlıştan ayrı bir sorundur ve ayrı görülmeli. | AYS · Denemeler | P2 | orta |
| 48 | **Deneme karşılaştırması** | İki deneme ders ders yan yana, fark rozetleriyle. | +3 net tek sayıya sıkışmaz; Fen’deki düşüş görünür kalır. | AYS · Denemeler | P2 | orta |
| 49 | **Konu kapsam halkası** | Planlanan sorunun ne kadarı çözüldü. | Yetenek yargısı yok; yalnız ne kadar çalışıldığı. | AYS · Dersler | P2 | az |
| 50 | **Konu zinciri** | Önkoşul sırası ve her halkanın kapsamı; eksik önkoşul kesikli çerçeveyle işaretli. | Hangi konunun önce gelmesi gerektiği görülür. | AYS · Dersler | P3 | orta |
| 51 | **40 hafta çizgisi** | Sınava kadar her hafta bir tik; ara haftaları taralı. | Uzun hazırlık somut parçalara bölünür. | AYS · Hafta | P2 | az |
| 52 | **Haftalık plan ızgarası** | Yedi gün × saat ızgarası; bloklar modül renginde, boş saatler taralı, bugün çerçeveli. | Haftanın yükü ve boşluğu aynı anda görülür. | AYS · Hafta | P2 | çok |
| 53 | **Ara haftası önizlemesi** | Etkilenen haftalar çizilir, tek onayla uygulanır. | Kural 9: orta seviye aksiyon önizlemesiz uygulanmaz. | AYS · Hafta | P2 | orta |
| 54 | **Taşıma gölgesi** | Taşınan blok havada, yeri hayalet çizgi; bırakınca «Geri al». | Taşımanın etkisi bırakmadan önce görülür. | AYS · Hafta | P2 | orta |
| 55 | **Tek satır soru ekle** | Ders · konu · sonuç üç çip; Enter ile kaydedilir. | Günde onlarca kayıt var; her biri iki saniyede bitmeli. | AYS · Soru çöz | P1 | az |
| 56 | **Yanlış nedenleri** | Set sonunda her yanlışa tek dokunuşla neden seçilir: bilgi, dikkat, süre. | Aynı sayıda yanlışın çaresi nedene göre değişir. | AYS · Soru çöz | P2 | orta |
| 57 | **Deneme takvimi** | Önümüzdeki denemeler tek çizgide; geçmiş olan netiyle, sıradaki parlayarak. | Denemeye kaç gün kaldığı planı okumadan bilinir. | AYS · Denemeler | P2 | az |
| 58 | **Soru ekranı** · MEVCUT | Soru numarası, süre ve şıklar; doğru ya da yanlış çözerken gösterilmez. | Soru anında tek şeye bakılır; sonuç set bitince gelir. | AYS · Soru çöz | P2 | orta |
| 59 | **Tekrar paketi** | Günün tekrarları konu konu paket olur; toplam süre tahmin olarak yazılır. | 432 kartlık kuyruk yerine bitirilebilir bir iş görülür. | AYS · Tekrar | P2 | orta |
| 60 | **Blok bitiş özeti** | Blok bitince üç sayı ve sıradaki iş; tek düğmeyle devam. | Bitiş anında ne yapıldığı ve sırada ne olduğu karışmaz. | AYS · Bugün | P1 | az |
| 61 | **Ders dengesi** | Planlanan ve gerçekleşen ders dağılımı alt alta; fark tek rozetle. | Hangi dersin payının kaydığı haftalar geçmeden görülür. | AYS · Hafta | P2 | az |
| 62 | **Deneme girişi** · YENİ | Ders ders doğru, yanlış, boş hücreleri; net sütununu kod hesaplar. | Kullanıcı yalnız sayar; hesaplamayı ve toplamı sistem yapar. | AYS · Denemeler | P2 | orta |
| 63 | **Konu tablosu** · YENİ | TYT / AYT süzgeci; konu, kapsam halkası, son çalışma zamanı ve önkoşul işareti. | Hangi konuya uzun süredir bakılmadığı tek listede görülür. | AYS · Dersler | P2 | orta |
| 64 | **Hedef ayarı** · YENİ | Günlük soru hedefi büyük artı/eksi ile; haftalık toplam anında yeniden hesaplanır. | Kural 1: kullanıcı tercihini değiştirir, sonucu kod hesaplar; küçük aksiyon, geri alınır. | AYS · Bugün | P2 | az |
| 65 | **Tekrar takvimi çizgisi** · YENİ | Yanlış bir sorunun tekrar günleri: +1, +3, +7, +14, +30; sıradaki halka parlıyor. | Tekrarın neden bugün olmadığı ya da olduğu görünür. | AYS · Tekrar | P3 | az |
| 66 | **Hedefe kalan** · YENİ | Hedef net, bugünkü net ve haftada gereken artış; kalan hafta sayısıyla. | Büyük hedef haftalık küçük bir sayıya iner. | AYS · Denemeler | P2 | az |
| 67 | **Ders işaretleri** · YENİ | Dersler renkle değil harf ve desenle ayrılır: dolu, çerçeveli, taralı, kesikli. | İlke 01: renk yalnız modülündür; derslere renk verilirse modüller karışır. | AYS · Dersler, AYS · Hafta | P2 | az |

**Kabul ölçütleri (P1)**

- **42 · Sıradaki blok kahramanı** — Bugün ekranında en büyük öğe sıradaki blok; 390 pikselde de ilk ekranda görünür.
- **46 · Deneme karnesi** — Deneme karnesinde satır uzunluğu soru sayısıyla orantılı; net hesabı kodda ve testli.
- **55 · Tek satır soru ekle** — Soru kaydı klavyeden üç seçim ve Enter ile, fareye dokunmadan tamamlanır.
- **60 · Blok bitiş özeti** — Blok bitince özet kartı üç sayı ve sıradaki işi gösterir; sayılar kayıttan hesaplanır.

## D · SPİ (21)

_sağlık · teşhis yok, doz yok_

| # | Özellik | Ne yapar | Neden | Ekran | Önc. | Emek |
|---|---|---|---|---|---|---|
| 68 | **Toparlanma halkası** | Tek sayı ortada; üç kaynak ayrı dilim, her biri kendi kesinlik etiketiyle. | Tek sayı var ama hangi kaynağın tahmin olduğu saklanmaz. | SPİ · Günlük | P1 | orta |
| 69 | **Uyku bandı** | Gece tek şerit, uyanmalar kesik; altta haftanın gece dokusu. | Süre kadar bölünmeler de görünür. | SPİ · Günlük | P2 | orta |
| 70 | **Ham + ortalama çizgisi** | Dalgalı ölçümlerde ham noktalar soluk, yedi günlük ortalama çizgi. | Günlük dalgalanma paniğe yol açmaz; eğilim görülür. | SPİ · Günlük | P1 | az |
| 71 | **Referans bandı** | Değer, laboratuvar aralığının içinde bir nokta. Aralık dışı yalnız işaretlenir. | Teşhis yok: yalnız aralığın neresinde olduğu. | SPİ · Testler | P2 | az |
| 72 | **Tabak görünümü** | Halka dilimi yerine tabak bölmesi; kalan miktar yazılı. | Gram ve yüzde yerine gerçek hayattaki tabak düşünülür. | SPİ · Öğünler | P2 | orta |
| 73 | **Tek dokunuş sayaç** | Küçük kayıt tek dokunuş; altta «Geri al» şeridi. | Küçük kayıt zahmetliyse hiç girilmez; eksik veri çoğalır. | SPİ · Günlük | P1 | az |
| 74 | **Enerji ölçeği** | Günde bir kez beş noktalı ölçek; seçilen nokta büyür. | Öznel veri de ölçülür: tahmin edilmez, sorulur. | SPİ · Günlük | P2 | az |
| 75 | **Set kutucukları** | Biten set dolar; dinlenme süresi kutucuğun içinde akar. | Antrenman sırasında tek bakış yeter. | SPİ · Hareket | P2 | orta |
| 76 | **Haftalık hareket halkaları** | Yedi küçük halka; verisi olmayan gün kesikli boş halka. | Eksik gün sıfır gibi görünmez; «yapmadım» ile «girmedim» ayrılır. | SPİ · Hareket | P2 | az |
| 77 | **Ölçüm tuş takımı** | Büyük rakam, sabit birim, dünkü değer ipucu olarak yanında. | Yanlış girişi dünkü değer yakalar. | SPİ · Günlük | P2 | az |
| 78 | **Sonraki kontrol kartı** | «Kan tahlili · 3 hafta sonra»; hatırlatır, yorumlamaz. | SPİ takip eder; karar kullanıcının ve hekiminindir. | SPİ · Testler | P3 | az |
| 79 | **Harcama şeritleri** | Kategori başına şerit ve bütçe çizgisi; aşım yalnız çizginin rengiyle. | Aşım bağırmaz ama gözden de kaçmaz. | SPİ · Finans | P2 | az |
| 80 | **Öğün çizelgesi** | Gün tek şeritte; öğünler nokta, yeme aralığı açık bant, planlanan öğün içi boş. | Beslenme saatleri gram tablosundan önce okunur. | SPİ · Öğünler | P2 | az |
| 81 | **Yoğunluk bölgeleri** | Antrenmanın dakikaları bölgelere göre; eşikleri kod hesaplar. | Ne kadar zorlandığın yorum değil, ölçüm olarak görünür. | SPİ · Hareket | P3 | az |
| 82 | **Harcama takvimi** | Ay takvimi; her günün harcaması nokta büyüklüğüyle, gelecek günler soluk. | Harcamanın hangi günlerde yoğunlaştığı tabloya bakmadan görülür. | SPİ · Finans | P3 | az |
| 83 | **Uyku düzeni** | İki haftanın yatış ve kalkış saatleri dikey çubuk; hedef saatler kesik çizgi. | Uyku süresi kadar saatinin kayması da görünür. | SPİ · Analiz | P2 | az |
| 84 | **Tahlil karşılaştırması** · YENİ | İki tarihin değerleri yan yana, laboratuvar aralığıyla; aralık dışı yalnız çerçeveyle. | Değişim görülür ama yorum yapılmaz; karar hekimle verilir. | SPİ · Testler | P2 | az |
| 85 | **Öğün şablonları** · YENİ | Sık yenen öğünler tek dokunuşluk şablon; son kullanılan işaretli. | Her öğünü baştan yazmak gerekmez; kayıt süresi kısalır, eksik veri azalır. | SPİ · Öğünler | P2 | az |
| 86 | **Antrenman haftası** · YENİ | Yedi gün dikey şerit: yapılan dolu, planlı çerçeveli, dinlenme taralı; bugün çerçeveli. | Haftanın yükü ve dinlenmesi tek bakışta dengelenir. | SPİ · Hareket | P2 | az |
| 87 | **Düzenli giderler** · YENİ | Ayın hangi günü hangi giderin geldiği; en yakını vurgulu ve kalan günüyle. | Sabit giderler sürpriz olmaz; aylık toplam hep aynı yerde. | SPİ · Finans | P3 | az |
| 88 | **Ölçüm hatırlatıcısı** · YENİ | Sabah ölçümü için saatli hatırlatma; bugün ölçüldüyse saati yazar. | Hatırlatır ama tahmin etmez: ölçülmeyen gün boş kalır. | SPİ · Günlük, Ayarlar | P2 | az |

**Kabul ölçütleri (P1)**

- **68 · Toparlanma halkası** — Toparlanma sayısının her bileşeni kendi kesinlik etiketini taşır; bir bileşen tahminse toplam da «tahmin» olur.
- **70 · Ham + ortalama çizgisi** — Dalgalı ölçümde ham değerler ve 7 günlük ortalama ayrı çizilir; ortalama eksik günleri atlar, 0 saymaz.
- **73 · Tek dokunuş sayaç** — Tek dokunuşluk kayıt ekranda «Geri al» şeridi bırakır; şerit süresi dolmadan geri alınabilir.

## E · ESP (21)

_gelişim · sertifika yok, yargı yok_

| # | Özellik | Ne yapar | Neden | Ekran | Önc. | Emek |
|---|---|---|---|---|---|---|
| 89 | **Deste yığını** | Kalan kartlar arkada yığın; yığın incelikçe bitiş görülür. | Ne kadar kaldığı sayı okumadan hissedilir. | ESP · Dil Stüdyosu | P1 | az |
| 90 | **Süreli cevap düğmeleri** | Her düğme kartın bir sonraki görülme zamanını söyler. | Her seçimin sonucu seçmeden bilinir. | ESP · Dil Stüdyosu | P2 | az |
| 91 | **Dakika halkası** · YENİLENDİ | Günlük hedef halkası; rengi değişmez, yalnız dolar. | Hedefe yaklaşmak renk değiştiren bir alarm değildir. | ESP · Bugün | P2 | az |
| 92 | **Unutma eğrisi** | Hatırlama düşer, tekrar yükseltir; «bugün» noktası işaretli. | Tekrarın neden bugün olduğu görülür. | ESP · Dil Stüdyosu | P2 | orta |
| 93 | **Merdiven basamakları** · MEVCUT | Basamak içerik sırasıdır, derece değil. | Sıra var, yargı yok; sertifika izlenimi verilmez. | ESP · Merdiven | P2 | orta |
| 94 | **Kütüphane rafı** · MEVCUT | Kitap sırtı: kalınlık sayfa sayısı, alt çizgi okunan oran. | Okuma listesi tablo değil, raf gibi durur. | ESP · Kütüphane | P3 | orta |
| 95 | **Okuma ilerlemesi** | Kitap içinde ince ilerleme çizgisi ve bölümün kalan süresi. | Kalan süre tahmindir ve tahmin olarak etiketlidir. | ESP · Kütüphane | P2 | az |
| 96 | **Alıntı kartı** | Altı çizilen cümle kaynağıyla kart olur; tekrar destesine eklenebilir. | Okuma ile tekrar birbirine bağlanır. | ESP · Kütüphane | P3 | orta |
| 97 | **Kelime sahnesi** | Tek kelime, anlamı, örnek cümle. Başka hiçbir şey yok. | Tekrar anında dikkat tek şeye ait olmalı. | ESP · Dil Stüdyosu | P2 | az |
| 98 | **Bağlamda kelime** | Metinde hedef kelime altı çizili; dokununca anlamı yerinde açılır. | Kelime ezber listesinde değil, cümle içinde öğrenilir. | ESP · Kütüphane | P2 | orta |
| 99 | **Konuşma dalga formu** | Konuşma pratiğinde ses dalgası ve süre; duraksamalar boşluk olarak. | Ses kaydı bir sayı gibi okunur; yorum yapılmaz, ölçülür. | ESP · Dil Stüdyosu | P3 | çok |
| 100 | **Tarih şeridi** · MEVCUT | Yüzyıllar yatay şerit, olaylar nokta; eşlenen nokta yanar. | Yüzyıl eşlemesi görsel bir hafızaya dönüşür. | ESP · Kronoloji | P3 | orta |
| 101 | **Ajanlı ders kapağı** | Dersin başında ajan portresi ve tek cümle; renk yine ESP. | Ders kimin sesinden geldiğini söyler ama rengi modülündür. | ESP · Dil Stüdyosu | P3 | az |
| 102 | **Oturum sonu** | Tekrar bitince kart sayısı, iyi oranı, süre ve cevap dağılımı; yarının yükü altta. | Oturumun nasıl geçtiği tek bakışta; yarın ne beklediği belli. | ESP · Dil Stüdyosu | P2 | az |
| 103 | **Kelime ağı** | Kelime ortada; eş anlamlılar çevresinde, zıt anlamlı kesik çerçeveyle. | Kelime tek başına değil, akrabalarıyla hatırlanır. | ESP · Dil Stüdyosu | P3 | orta |
| 104 | **Bağlı notlar** | Not kartının altında ona bağlanan kaynaklar ve notlar çip olarak. | Okuma, not ve tekrar tek zincire bağlanır. | ESP · Kütüphane | P3 | orta |
| 105 | **Deste durumu** · YENİ | Kartlar üç durumda: yeni, öğreniliyor, oturmuş; toplam ve oranlar. | Destenin sağlığı tek çubukta; yeni kart eklemenin zamanı bilinir. | ESP · Dil Stüdyosu | P2 | az |
| 106 | **Cümle kurma** · YENİ | Kelime taşları sürüklenerek boş yerlere konur; yerleşen taş renk alır. | Kelime tanımaktan kullanmaya geçilir. | ESP · Dil Stüdyosu | P3 | orta |
| 107 | **Metinli dinleme** · YENİ | Ses oynatıcı ve metin; o anda okunan cümle büyür, geçmişi soluklaşır. | Dinlerken kaybolunmaz; kulak ve göz aynı yerde. | ESP · Dil Stüdyosu | P3 | orta |
| 108 | **Soru zinciri** · YENİ | Sokratik konuşmada soru ve cevaplar zincir olarak; her «neden?» bir halka. | Düşüncenin hangi adımda değiştiği görülür. | ESP · Felsefe | P3 | orta |
| 109 | **Üç madde özeti** · YENİ | Bölümün üç maddelik özeti ve tek düğmeyle desteye ekleme; özet «model» etiketli. | Özet modelden gelir ve öyle etiketlenir; kullanıcı kontrol eder. | ESP · Kütüphane | P3 | az |

**Kabul ölçütleri (P1)**

- **89 · Deste yığını** — Kalan kart sayısı yığın kalınlığıyla ve sayıyla birlikte gösterilir; sayı ekran okuyucuya okunur.

## F · Merkez · HKM (18)

_yalnız önerir, modül uygular_

| # | Özellik | Ne yapar | Neden | Ekran | Önc. | Emek |
|---|---|---|---|---|---|---|
| 110 | **Mor öneri kartı** | Merkez’in her önerisi mor kenarlı kart; sağ üstte seviyesi. | Merkez’in sesi modül içeriğiyle hiçbir zaman karışmaz. | AYS · Bugün, SPİ · Günlük, ESP · Bugün | P1 | az |
| 111 | **Seviyeye göre onay** | Küçük: tek dokunuş + Geri al. Orta: önizleme + onay. Büyük: önce/sonra + dönüş noktası. | Kural 9: seviyeyi katalog belirler, ekran onun kalıbını giyer. | Tüm ekranlar | P1 | orta |
| 112 | **Çakışma kartı** | İki modül aynı saati isterse ikisi yan yana görünür, Merkez bir çözüm önerir. | Kimin ne istediği karışmaz; son sözü kullanıcı söyler. | AYS · Hafta, SPİ · Günlük | P1 | orta |
| 113 | **Önce / sonra görünümü** | Yalnız değişen blok renkli; gerisi soluk kalır. | Değişikliğin büyüklüğü abartılmadan görülür. | AYS · Hafta | P2 | orta |
| 114 | **Gerekçe çubuğu** | Sayı koddan gelir ve çizilir; modelin cümlesi altında, ayrı durur. | Kural 1: sayıyı kod üretir, model yalnız cümleye çevirir. | AYS · Bugün, SPİ · Günlük, ESP · Bugün | P1 | az |
| 115 | **Bekleyen öneri rozeti** | Üst çubukta mor sayaç; açılınca öneriler modüllerine göre sıralı. | Öneriler işi bölmez, sırasını bekler. | Kabuk · üst çubuk ve alt bant | P2 | az |
| 116 | **Otomatik uygula ayarı** | Küçük türlerin sormadan uygulanıp uygulanmayacağı tür tür anahtar; orta ve büyük hep sorar. | Kural 9: hangi küçük türün sormadan uygulanacağını kullanıcı seçer. | Ayarlar | P1 | az |
| 117 | **Geri dönüş noktaları** | Büyük aksiyonlardan önce alınan kayıtlar; birine tek düğmeyle dönülür. | Büyük değişiklik geri dönüşsüz olamaz. | Ayarlar | P2 | orta |
| 118 | **Bağlantı noktası** | «Merkez bağlı · 14:08». Kapalıyken gri: «her şey çalışıyor». | Kural 4: Merkez kapalıyken hiçbir modül bozulmaz; ekran da panik yapmaz. | Kabuk · üst çubuk ve alt bant | P1 | az |
| 119 | **Öneri geçmişi** | Uygulanan, geçilen, geri alınan öneriler; her biri tek satır. | Merkez’in ne önerdiği ve kullanıcının ne seçtiği izlenebilir. | Merkez · HKM yüzü | P3 | az |
| 120 | **Haftalık Merkez özeti** | Pazar akşamı tek kart: her modülden bir satır, bekleyen öneriler en altta. | Hafta tek sayfadan okunur; modüller yine ayrı satırda durur. | Merkez · HKM yüzü | P2 | orta |
| 121 | **Kural izi** | Önerinin dayandığı kurallar numarasıyla; her kuralın yanında sağlandığı değer. | Kural 1: kararı kod verir; kullanıcı hangi kuralın tetiklendiğini görür. | AYS · Bugün, SPİ · Günlük, ESP · Bugün | P1 | az |
| 122 | **Sessiz saatler** | Gece bandında gelen öneri bekler; sabah ilk açılışta görünür. | Merkez işi bölmez; uyku saatinde hiç bölmez. | Ayarlar | P2 | az |
| 123 | **Geçme nedeni** | «Geç» dendiğinde isteğe bağlı neden çipleri; seçilen neden geçmişe yazılır. | Önerinin neden işe yaramadığı tahminle değil, kullanıcının sözüyle bilinir. | AYS · Bugün, SPİ · Günlük, ESP · Bugün | P2 | az |
| 124 | **Çapraz etki** · YENİ | Bir modüldeki ölçüm başka bir modüle öneri olur; iki modül yan yana, ok Merkez’in. | Merkez her şeyi görür ama modülleri karıştırmaz: kaynak ve hedef ayrı renklidir. | AYS · Bugün, SPİ · Günlük, ESP · Bugün | P2 | orta |
| 125 | **Takvimde hayalet öneri** · YENİ | Merkez’in önerdiği blok takvimde kesikli mor hayalet olarak; onaylanmadan yerleşmez. | Önerinin plana etkisi, plan değişmeden görülür. | AYS · Hafta | P2 | orta |
| 126 | **Merkez günlüğü** · YENİ | Merkez’in ne okuduğu ve ne ürettiği saat saat; altta «hiçbir modüle yazmadı». | Kural 4 denetlenebilir olur: Merkez’in yalnız okuduğu kayıtta görünür. | Merkez · HKM yüzü | P3 | az |
| 127 | **Kapsam seçimi** · YENİ | Bir değişikliğin süresi seçilir: yalnız bugün, bu hafta, kalıcı; her birinin seviyesi altında. | Kural 9: süre uzadıkça seviye büyür ve onay kalıbı değişir. | AYS · Bugün, SPİ · Günlük, ESP · Bugün | P2 | az |

**Kabul ölçütleri (P1)**

- **110 · Mor öneri kartı** — Merkez’den gelen her öneri mor kartta ve seviye rozetiyle; modül içeriği hiçbir yerde mor kullanmaz.
- **111 · Seviyeye göre onay** — Onay kalıbı aksiyonun katalogdaki seviyesinden seçilir; dil modeli seviye belirleyemez.
- **112 · Çakışma kartı** — Aynı saati isteyen iki modül yan yana gösterilir; Merkez’in çözümü kullanıcı onayı olmadan uygulanmaz.
- **114 · Gerekçe çubuğu** — Öneri kartında sayı ile model cümlesi ayrı öğelerde; model kapalıyken sayı ve çubuk kalır.
- **116 · Otomatik uygula ayarı** — Her küçük tür için «sormadan uygula» anahtarı var; orta ve büyük türlerde anahtar kilitli.
- **118 · Bağlantı noktası** — Merkez kapalıyken modüller tam çalışır; durum noktası gri «kapalı» yazar, hata kırmızısı kullanılmaz.
- **121 · Kural izi** — Her Merkez önerisi tetikleyen kuralların numarasını ve sağlanan değeri taşır.

## G · Ofis ve ajanlar (12)

_cümle ajandan, sayı koddan_

| # | Özellik | Ne yapar | Neden | Ekran | Önc. | Emek |
|---|---|---|---|---|---|---|
| 128 | **Masa görünümü** · MEVCUT | Konuşan ajan büyür ve renklenir; diğerleri soluk bekler. | Kimin konuştuğu ilk bakışta belli. | AYS · Ofis, SPİ · Masalar, ESP · Masalar | P2 | az |
| 129 | **Balondaki sayı çipi** | Ajan cümlesindeki sayı çip olarak görünür ve kaynağını taşır. | Cümle yorum, çip gerçek: ikisi karışmaz. | AYS · Ofis, SPİ · Masalar, ESP · Masalar | P1 | az |
| 130 | **Ajan sınır kartı** | Ajan profili iki sütun: ne yapar, ne yapmaz. | Kural 5: sınırlar ilk bakışta belli; kullanıcı yanlış şey beklemez. | AYS · Ofis, SPİ · Masalar, ESP · Masalar | P2 | az |
| 131 | **Devir göstergesi** | Bir ajan konuyu diğerine aktarınca kesik çizgiyle gösterilir. | Konuşmanın ortasında ses değişirse kullanıcı nedenini bilir. | AYS · Ofis, SPİ · Masalar, ESP · Masalar | P3 | az |
| 132 | **Ajan durum halkası** | Portrenin çevresinde ince halka: dönen, sabit ya da yok. | Ajanın çalışıp çalışmadığı yazı okumadan görülür. | AYS · Ofis, SPİ · Masalar, ESP · Masalar | P3 | az |
| 133 | **Hazır cevap çipleri** | Balonun altında iki üç kısa cevap. | Yazmadan konuşma sürer; mobilde özellikle. | AYS · Ofis, SPİ · Masalar, ESP · Masalar | P2 | az |
| 134 | **Ajan seçici** | @ yazınca ajanlar rolü ve modülüyle listelenir; eşleşen harfler vurgulanır. | Kime sorduğun karışmaz; her ajanın alanı adının yanında. | AYS · Ofis, SPİ · Masalar, ESP · Masalar | P2 | az |
| 135 | **Günün toplantısı** · MEVCUT | Patron günün başında her ajandan tek cümle toplar; sayılar çip olarak. | Beş ajanı tek tek açmadan günün durumu okunur. | AYS · Toplantı, SPİ · Toplantı, ESP · Toplantı | P2 | orta |
| 136 | **Üslup seçimi** · MEVCUT | Ajanın konuşma biçimi üç seçenekten biri; önizleme anında değişir. | Tercih değiştirmek küçük bir aksiyondur ve geri alınır; sayılar değişmez. | Ayarlar | P3 | az |
| 137 | **Ajanın baktığı veri** · YENİ | Ajan cevabının altında hangi veriye baktığı çip olarak, her biri kesinlik etiketiyle. | Cevabın neye dayandığı görünür; tahmin olan veri de öyle yazar. | AYS · Ofis, SPİ · Masalar, ESP · Masalar | P2 | az |
| 138 | **Konuşma özeti** · YENİ | Dünkü konuşmanın kararları ve açık soruları; konuşma baştan okunmaz. | Ajanla konuşulan şey unutulmaz; açık kalan soru görünür. | AYS · Ofis, SPİ · Masalar, ESP · Masalar | P3 | az |
| 139 | **Model kapalı kipi** · YENİ | Dil modeli kapalıyken ajanlar kuraldan gelen hazır cümlelerle konuşur; üstte gri durum şeridi. | Kural 1: model kapalıyken hiçbir sistem kapanmaz; sayılar aynen durur. | AYS · Ofis, SPİ · Masalar, ESP · Masalar | P1 | az |

**Kabul ölçütleri (P1)**

- **129 · Balondaki sayı çipi** — Ajan cümlesindeki her sayı veri kaynağına bağlı bir çip; kaynaksız sayı cümleye giremez.
- **139 · Model kapalı kipi** — Dil modeli kapalıyken ajanlar hazır cümlelerle konuşur ve bunu etiketler; hiçbir ekran kapanmaz.

## H · Seviye ve rütbe (9)

_yalnız görünürlük, karar yok_

| # | Özellik | Ne yapar | Neden | Ekran | Önc. | Emek |
|---|---|---|---|---|---|---|
| 140 | **Rütbe halkası** | Rütbe görseli, çevresinde XP halkası. | Seviye görünür ama ekranın merkezine oturmaz. | Kabuk · üst çubuk ve alt bant | P2 | az |
| 141 | **XP dökümü** | Bugünkü XP nereden geldi: soru, blok, günü kaydetme. | Kural 6: XP görünürdür ama hiçbir karara girmez; döküm bunu açık eder. | SPİ · Rütbe, ESP · Rütbe, AYS · İlerleme | P3 | az |
| 142 | **Kademe yolu** | Altı kademe tek yolda: Bronz’dan Kutsal’a; bulunduğun yer yanar. | Bir sonraki kademe somut; ad ve renk tek kaynaktan gelir. | SPİ · Rütbe, ESP · Rütbe, AYS · İlerleme | P3 | az |
| 143 | **Sakin seviye atlama** · YENİLENDİ | Kısa bir parlama; ekranı kapatmaz, işi bölmez. | Seviye bir ödül anı ama işin önüne geçmemeli. | Kabuk · üst çubuk ve alt bant | P3 | az |
| 144 | **Sistem başına rütbe** | Her sistemin kendi rütbesi; çerçevesi modül renginde. | Kural 6: her sistemin kendi seviyesi var; tanım ortak. | SPİ · Rütbe, ESP · Rütbe, AYS · İlerleme | P2 | az |
| 145 | **Rütbe galerisi** · MEVCUT | Kazanılan kademeler renkli, kilitliler siluet. | XP yalnız burada ve üst çubukta görünür; başka ekrana sızmaz. | SPİ · Rütbe, ESP · Rütbe, AYS · İlerleme | P3 | az |
| 146 | **Başarım rozeti** · MEVCUT | Kazanılan rozet altıgen ve renkli; kilitli olanın ilerlemesi dilim olarak. | Uzun hedefler görünür ama hiçbir kararı etkilemez. | SPİ · Rütbe, ESP · Rütbe, AYS · İlerleme | P3 | az |
| 147 | **Ay özeti şeridi** · MEVCUT | On iki ayın çalışma günleri; kurulumdan önceki aylar «veri yok» olarak kesik. | Eksik ay sıfır gibi görünmez; defterin ne zaman başladığı belli. | SPİ · Rütbe, ESP · Rütbe, AYS · İlerleme | P3 | az |
| 148 | **Kusursuz günler** · YENİ · MEVCUT | Ayın takviminde kusursuz günler yıldızlı, aktif günler açık, boş günler kesik. | Ay özetindeki sayı takvime döner; boş gün sıfır gibi görünmez. | SPİ · Rütbe, ESP · Rütbe, AYS · İlerleme | P3 | az |

## I · Hareket (11)

_her hareket bir anlam taşır_

| # | Özellik | Ne yapar | Neden | Ekran | Önc. | Emek |
|---|---|---|---|---|---|---|
| 149 | **Sayı yuvarlanması** | Değer değişince rakam yukarı kayar. | Değişen sayı gözden kaçmaz. | Tüm ekranlar | P2 | az |
| 150 | **Geri al geri sayımı** · MEVCUT | «Geri al» şeridinin altında incelen çizgi. | Geri almanın ne kadar süresi kaldığı görünür olmalı. | Tüm ekranlar | P1 | az |
| 151 | **Şimdi çizgisi** · YENİLENDİ | Çizelgede ilerleyen ince çizgi; geçmiş saatler taralı. | Günün neresinde olduğun saat okumadan görülür. | AYS · Hafta, AYS · Bugün | P2 | az |
| 152 | **Tik çizimi** | İş bitince tik çizilerek belirir, satır yavaşça soluklaşır. | Bitirme anı küçük ama hissedilir. | Tüm ekranlar | P2 | az |
| 153 | **Kart açılma geçişi** | Kart yerinde büyüyerek ayrıntıya dönüşür. | Kullanıcı nereden geldiğini unutmaz; geri dönüş doğal olur. | Tüm ekranlar | P2 | orta |
| 154 | **Küçülen başlık** | Kaydırınca büyük başlık üst çubuğa küçülerek yerleşir. | Ekran alanı açılır ama bağlam kaybolmaz. | Tüm ekranlar | P3 | az |
| 155 | **Modül geçiş rengi** | Sistem değişince üst çizgi yeni sistemin rengini alır, ad kısa bir geçişle değişir. | Hangi sisteme geçtiğin gözün köşesinden bile fark edilir. | Kabuk · üst çubuk ve alt bant | P2 | az |
| 156 | **Odak halkası akışı** | Klavyeyle gezerken odak halkası düğmeden düğmeye kayarak geçer. | Klavye kullanıcısı nerede olduğunu kaybetmez. | Tüm ekranlar | P3 | az |
| 157 | **Bırakma alanı** · YENİ | Sürüklenen öğe yaklaşınca bırakılacağı alan kesikliden dolu çerçeveye geçer. | Nereye bırakılacağı bırakmadan önce bilinir. | AYS · Hafta | P2 | az |
| 158 | **Satır kapanma** · YENİ | Kaldırılan satır yerinde kapanır, alttakiler yumuşakça yukarı kayar. | Göz neyin kaybolduğunu izler; liste zıplamaz. | Tüm ekranlar | P3 | az |
| 159 | **Üzerine gelince önizleme** · YENİ | Metindeki bağlantının üzerine gelince küçük önizleme kartı; açmadan içerik görülür. | Sayfa değiştirmeden bağlam alınır. | Tüm ekranlar | P3 | az |

**Kabul ölçütleri (P1)**

- **150 · Geri al geri sayımı** — Geri al şeridi kalan süreyi çizgiyle gösterir; süre dolunca şerit kapanır, işlem kalıcı olur.

## J · Mobil ve erişilebilirlik (11)

_390 piksel ve renk körlüğü_

| # | Özellik | Ne yapar | Neden | Ekran | Önc. | Emek |
|---|---|---|---|---|---|---|
| 160 | **Başparmak bölgesi** | Mobilde ana eylem ekranın alt üçte birinde; gezinme alt sekme çubuğuna iner. | Günde onlarca kez tek elle kullanılır. | Kabuk · üst çubuk ve alt bant | P2 | orta |
| 161 | **Kaydırarak işaretle** | Satırı sağa kaydır: bitti; sola: ertele. | Mobilde en sık iki eylem tek hareket olur. | AYS · Bugün, SPİ · Günlük, ESP · Bugün | P2 | orta |
| 162 | **Alt çekmece** | Mobilde ayrıntı alttan yarım ekran açılır; çekince tam ekran. | Liste kaybolmaz; çekmece tek elle kapanır. | Tüm ekranlar | P2 | orta |
| 163 | **Sabit etiketli kaydırma** | Şerit yana kayar, modül etiketi solda sabit kalır. | Dar ekranda da hangi şeridin kime ait olduğu kaybolmaz. | AYS · Bugün, SPİ · Günlük, ESP · Bugün | P2 | az |
| 164 | **Bildirim kartı** | Telefon bildirimi: modül rengi, tek cümle, iki eylem. | Uygulamayı açmadan karar verilir. | Ana ekran · PWA | P2 | orta |
| 165 | **Renksiz de ayırt edilir** | Modül = renk + harf + şekil: daire, kare, üçgen. | Renk körü kullanıcı da kategorileri karıştırmaz. | Tüm ekranlar | P1 | az |
| 166 | **Hızlı ekle düğmesi** | Sağ alttaki + açılınca üç modülün hızlı kaydı yelpaze gibi çıkar. | Her modülün en sık kaydı tek yerden, rengiyle ayrılarak girilir. | Kabuk · üst çubuk ve alt bant | P2 | orta |
| 167 | **Ana ekran bileşeni** | Telefon ana ekranında sıradaki iş, saati ve günün ilerlemesi. | Uygulamayı açmadan sırada ne olduğu bilinir. | Ana ekran · PWA | P3 | çok |
| 168 | **Adımlı sayı girişi** · YENİ | Küçük sayılar için büyük artı/eksi; 48 piksel dokunma hedefi. | Klavye açmadan, tek elle sayı girilir. | SPİ · Günlük | P2 | az |
| 169 | **Alt sekme çubuğu** · YENİ | Mobilde dört sekme; etkin sekme modülün renginde, üstünde ince çizgi. | Hangi sistemde ve hangi ekranda olduğun başparmağın altında. | Kabuk · üst çubuk ve alt bant | P2 | az |
| 170 | **Sesli okuma metni** · YENİ | Her sayı ekran okuyucuya birimi, etiketi ve farkıyla birlikte okunur. | Kural 2 sesli ortamda da geçerli: etiketsiz sayı okunmaz. | Tüm ekranlar | P2 | az |

**Kabul ölçütleri (P1)**

- **165 · Renksiz de ayırt edilir** — Modül ayrımı renk olmadan da okunur (harf + şekil); palettecheck gri tonlamada da geçer.

## K · Kurulum ve güven (9)

_ilk gün, yedek ve verinin yeri_

| # | Özellik | Ne yapar | Neden | Ekran | Önc. | Emek |
|---|---|---|---|---|---|---|
| 171 | **Kurulum adımları** · YENİLENDİ · MEVCUT | İlk açılışta üç adım; her adım tek soru, ilerleme üstte. | Boş bir sistemle değil, kendi takvimiyle başlanır. | İlk açılış | P2 | orta |
| 172 | **Örnek veri kipi** | Sistemi örnek veriyle denemek; üstte şeritli uyarı, arkada «ÖRNEK» filigranı. | Deneme verisi gerçek veriyle hiçbir zaman karışmaz. | Ayarlar | P3 | orta |
| 173 | **Yedek durumu** · MEVCUT | Son yedeğin yaşı, boyutu ve iki haftalık yedek izi; tek düğmeyle yedek. | Verinin güvende olduğu tahmin değil, tarih olarak görülür. | Ayarlar | P1 | az |
| 174 | **Veri nerede?** | Tek şema: cihaz asıl kayıt, yedek senin seçtiğin yer, Merkez isteğe bağlı. | Kural 4: Merkez modüle yazmaz; kullanıcı bunu metinden değil şemadan okur. | Ayarlar | P2 | az |
| 175 | **Dışa aktar** · MEVCUT | Biçim seçilir, ilk satırlar önizlenir; her sayı etiketiyle birlikte çıkar. | Kural 2 dosyada da geçerli: etiketsiz sayı dışarı da çıkmaz. | Ayarlar | P2 | az |
| 176 | **Gizlilik kilidi** · YENİ | Uygulama açılışında dört haneli kilit; sistem simgesi kilit ekranında da görünür. | Sağlık ve para verisi yanındaki birinin gözünün önünde açılmaz. | Kabuk · üst çubuk ve alt bant | P3 | orta |
| 177 | **Kalıcı silme kapısı** · YENİ | Kalıcı silme büyük aksiyon: önce dönüş noktası, sonra yazılı onay, düğmede silinecek sayı. | Geri dönüşü olmayan işlem tek tıklamayla olmaz. | Ayarlar | P1 | orta |
| 178 | **İçe aktarma önizlemesi** · YENİ | Dosya içe aktarılmadan önce aynı, yeni ve çakışan kayıt sayıları; çakışmalar ayrı açılır. | İçe aktarma mevcut veriyi sessizce ezmez. | Ayarlar | P2 | orta |
| 179 | **Kayıt geçmişi** · YENİ | Bir kaydın her değişikliği kaynağıyla: sen, Merkez önerisi (senin onayınla), plan motoru. | Kural 4 kayıtta görünür: Merkez değiştirmez, önerir; uygulayan hep bellidir. | Tüm ekranlar | P1 | orta |

**Kabul ölçütleri (P1)**

- **173 · Yedek durumu** — Son yedeğin tarihi ve boyutu gösterilir; yedek yoksa «henüz yedek yok» yazar, tarih uydurmaz.
- **177 · Kalıcı silme kapısı** — Kalıcı silme büyük aksiyondur: önce dönüş noktası alınır, sonra yazılı onay istenir, düğme silinecek sayıyı yazar.
- **179 · Kayıt geçmişi** — Her kaydın geçmişi kaynağı ayırır: sen, Merkez önerisi (senin onayınla), plan motoru, içe aktarma.

## L · Ayarlar ve tercih (4)

_tercih kullanıcının, hesap kodun_

| # | Özellik | Ne yapar | Neden | Ekran | Önc. | Emek |
|---|---|---|---|---|---|---|
| 180 | **Modül bazında bildirim** · YENİ | Her modülün bildirimi kendi renginde ayrı anahtar; sessiz saatler en altta. | Bir modülün bildirimini kapatmak diğerlerini susturmaz. | Ayarlar | P2 | az |
| 181 | **Ayar önizlemesi** · YENİ | Görünüm ayarı seçilmeden önce iki seçenek yan yana küçük örnekle. | Ayarın ne değiştirdiği denemeden görülür. | Ayarlar | P3 | az |
| 182 | **Varsayılana dön** · YENİ | Değişen ayar noktayla işaretli, varsayılan değeri altında yazılı; tek düğmeyle geri dönülür. | Neyi değiştirdiğini unutan kullanıcı kaybolmaz. | Ayarlar | P2 | az |
| 183 | **Ayar arama** · YENİ | Ayar adı yazılınca modüllere göre gruplu sonuç ve tam yol: «SPİ › Ayarlar › Bildirim». | Hangi modülün ayarı olduğu karışmaz; ayar menüde aranmaz. | Ayarlar | P3 | az |

## Elenenler (12)

| İlk no | Madde | Ne oldu | Neden |
|---|---|---|---|
| 04 | Tipografi üçlüsü | Temellere taşindi | Özellik değil, kural. Bileşen gibi listelenince önemi yanlış okunuyordu. |
| 05 | Tablo sayıları | Temellere taşindi | Tek satırlık yazı kuralı; tipografinin parçası. |
| 06 | Tek boşluk ölçeği | Temellere taşindi | Kullanıcının görmediği bir değer; tasarım kuralı olarak durmalı. |
| 07 | Ton katmanları | Temellere taşindi | Tema sisteminin parçası; ayrı özellik gibi sunmak gereksizdi. |
| 20 | Küçük birim | Temellere taşindi | Tipografi kuralının bir satırı. |
| 62 | Kademeli giriş | Temellere taşindi | Hareket süresi kuralı; her ekranda aynı olmalı, özellik değil. |
| 65 | Basma hissi | Temellere taşindi | Her düğmenin zaten sahip olması gereken durum. |
| 14 | Tahmin alt çizgisi | Bi̇rleşti̇ → kesi̇nli̇k | Aynı sorunun ikinci cevabıydı; kesinlik gliflerinin içine girdi. |
| 11 | Modül işareti | Bi̇rleşti̇ → geçi̇ş menüsü | İşaret tek başına iş görmüyordu; geçiş menüsünün başı oldu. |
| 10 | Kısayol rozetleri | Çikarildi | Komut paleti (⌘K) zaten var; her düğmede rozet gürültü yapıyordu. |
| 39 | Sessiz sınır notu | Çikarildi | Sınır bir ilkedir (İlke 04); her ekranda not kalabalık yapar. |
| 70 | %200 yakınlaştırma | Çikarildi | Zorunluluk, özellik değil; denetim araçlarının işi. |
