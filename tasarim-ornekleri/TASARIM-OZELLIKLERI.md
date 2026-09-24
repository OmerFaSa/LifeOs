# LifeOS · Tasarım kataloğu (sürüm 3)

136 özellik · 40 yeni · 10 yenilendi · 32 P1. Canlı örnekler `vitrin.html` içinde; bu liste o dosyadaki veriden üretildi.

**Öncelik:** P1 önce, P2 sonra, P3 ileride. **Emek:** az / orta / çok. **YENİ:** bu sürümde eklendi. **YENİLENDİ:** örneği iyileştirildi. **MEVCUT:** sistemde var (depoda bulundu), kart yalnız tasarımını öneriyor.

## İlkeler

1. **Renk sahipliği söyler.** Mavi AYS, yeşil SPİ, turuncu ESP, mor Merkez. Yeşil/kırmızı yalnız yön.
2. **Etiketsiz sayı yok.** Ölçüldü · hesaplandı · tahmin · veri yok. Eksik veri «—», grafik sıfıra düşmez.
3. **Kod karar verir, model anlatır.** Sayı kuraldan gelir; modelin cümlesi ekranda ayrı durur.
4. **Sınırlar ekranda da geçerli.** SPİ teşhis/doz göstermez; ESP/AYS sertifika ve yetenek yargısı göstermez; XP hiçbir kararın yanında durmaz.

## Temeller (özellik değil, kural)

Renk · Tipografi (serif başlık, sans metin, mono sayı; birim küçük) · Boşluk (4-8-12-16-24-32) · Yüzey (zemin/kart/yükseltilmiş) · Köşe (6/8/10/14) · Hareket (120/200/320/700 ms; azaltılmış harekette 0)

## A · Ortak tasarım dili (18)

_her sistemde aynı davranan parçalar_

| # | Özellik | Ne yapar | Neden | Modül | Önc. | Emek | İlgili |
|---|---|---|---|---|---|---|---|
| 01 | **Modül şeridi** | Birden çok modülün işi aynı ekrandaysa her modül kendi yatay şeridinde durur. | Kategoriler aynı listede karışmaz; göz rengi ve satırı birlikte okur. | hepsi | P1 | orta | 43, 127 |
| 02 | **Tek kutu iskeleti** | Her kutu aynı başlığı taşır: simge, ad ve sağda kesinlik etiketi. | Kutunun ne olduğu içeriğine bakmadan anlaşılır. | hepsi | P1 | az |  |
| 03 | **Üç alan düzeni** · YENİLENDİ | Her «Bugün» ekranı aynı sırada: Şimdi → Durum → Öneri. | Modül değişse de göz aynı yere bakar; öğrenme bir kez olur. | hepsi | P1 | az |  |
| 04 | **Sayfa başı cümlesi** | Ekranın tepesinde kural motorunun ürettiği tek cümlelik durum. | Ekranı taramadan günün özeti alınır; cümle koddan geldiği için tutarlıdır. | hepsi | P1 | az |  |
| 05 | **Hafta şeridi** | Başlığın altında yedi gün; her günde üç modülün noktası, gelecek günler boş halka. | Bugünün haftadaki yeri ve hangi günün boş kaldığı tek bakışta görülür. | hepsi | P2 | az |  |
| 06 | **Günün açılışı** | Günün ilk açılışında tek kart: iş sayısı, toplam süre ve ilk iş. | Güne planı okuyarak değil, tek kartla başlanır. | hepsi | P2 | orta |  |
| 07 | **Gün kapanışı** | Akşam «Bugün kapandı» kartı: üç sayı ve yarının ilk işi. | Gün yarım kalmış hissi bırakmaz; ertesi sabah hazır başlar. | hepsi | P2 | orta |  |
| 08 | **Modül geçiş menüsü** | «LifeOS / AYS» yolundan açılan menü: dört sistem, her biri kendi renginde ve kendi durumuyla. | Sistemler arası geçiş tek tık; hangi sistemde olduğun hiç karışmaz. | hepsi | P2 | orta |  |
| 09 | **Gruplu bildirimler** | Bildirimler modül şeritleriyle gruplanır; Merkez önerileri ayrı kümede durur. | Farklı kategorilerin uyarıları aynı listede birbirine girmez. | hepsi | P2 | orta |  |
| 10 | **Boş durum sahnesi** · YENİLENDİ | Veri yoksa küçük bir çizim ve tek eylem gösterilir. | Boş grafik ya da 0, «ölçüldü ve sıfır» diye yanlış okunur. | hepsi | P2 | az |  |
| 11 | **Sakin hata durumu** | Bir şey bozulursa: ne oldu, verin nerede, tek düğme. Kırmızı yok. | Kullanıcı veri kaybı olmadığını ilk cümlede öğrenir. | hepsi | P2 | az |  |
| 12 | **Tek canlı öğe** | Ekranda aynı anda yalnız bir şey nabız atar: sıradaki iş. | Dikkat bölünmez; hareket görüldüğünde bir anlamı vardır. | hepsi | P2 | az |  |
| 13 | **Gruplu komut sonuçları** · YENİ · MEVCUT | ⌘K sonuçları modül şeritleriyle gruplanır; aksiyonun seviyesi satırın sonunda yazar. | Aynı kelime iki modülde farklı iş yapar; grup ve seviye yanlış seçimi önler. | hepsi | P2 | orta | 01, 08, 86 |
| 14 | **Odak kapısı** · YENİ · MEVCUT | Odak modunda yalnız süren iş ve süresi kalır; geri kalan her şey sisle örtülür, Esc ile çıkılır. | Çalışırken ekranda başka kategori görünmez; dikkat dağılmaz. | AYS, ESP | P2 | orta | 12, 33 |
| 15 | **Son bilinen değer** · YENİ | Veri yenilenirken iskelet yerine son bilinen değer ve saati durur; üstte ince bir tarama çizgisi. | Ekran boşalıp dolmaz; kullanıcı elindeki son doğru bilgiyi kaybetmez. | hepsi | P2 | az | 21, 11 |
| 16 | **Terim ipucu** · YENİ | «Tekrar borcu» gibi terimlerin altı noktalı; üzerine gelince tek cümlelik tanım ve örnek açılır. | Sistemin dili öğrenilir; aynı kelime her ekranda aynı anlama gelir. | hepsi | P1 | az | 20, 24 |
| 17 | **Ne değişti?** · YENİ | Güncellemeden sonra ilk açılışta tek kart: yeni, düzeltilen ve kaldırılan şeyler. | Yeri değişen bir özellik kullanıcıyı şaşırtmaz. | hepsi | P3 | az |  |
| 18 | **Şüpheli giriş sorusu** · YENİ | Dünkü değerden çok sapan giriş hemen kaydedilmez; kod en olası düzeltmeyi sorar. | Kural 7: belirsiz girdi tahmin edilmez, sorulur. | hepsi | P1 | az | 62, 58 |

## B · Sayı ve veri (14)

_etiketsiz sayı yok, eksik veri sıfır değil_

| # | Özellik | Ne yapar | Neden | Modül | Önc. | Emek | İlgili |
|---|---|---|---|---|---|---|---|
| 19 | **Kesinlik glifleri** | Dolu, yarım, kesikli, çizgi. Tahmin olan sayının altı kesik ve aralığıyla birlikte. | Kural 2: etiketsiz sayı hiçbir katmana girmez. | hepsi | P1 | az | 20, 30, 23 |
| 20 | **Köken kartı** | Sayının üzerine gelince nereden geldiği açılır: formül, girdiler, hesap zamanı. | Kod otoritedir; kullanıcı her sayının hesabını kendi gözüyle görebilir. | hepsi | P1 | orta |  |
| 21 | **Veri tazeliği** | Eski ölçüm soluklaşır ve yaşını yazar: «12 gün önce». | Bayat veri güncelmiş gibi görünüp kararı yanıltmaz. | hepsi | P1 | az |  |
| 22 | **Eksik gün boşluğu** | Grafikte verisi olmayan gün boşluk kalır; çizgi kesikli geçer, sıfıra düşmez. | Eksik veri sıfır değildir; düşen çizgi olmayan bir kötüleşme gösterir. | hepsi | P1 | az | 32, 115 |
| 23 | **Anlamlı fark rozeti** | Rozetin rengi işaretten değil anlamdan gelir: net artışı iyi, borç artışı kötü. | +41 tekrar borcu yeşil gösterilirse yanlış haber olur. | hepsi | P1 | az |  |
| 24 | **Eşik çizgili çubuk** | Değer ve eşik aynı çubukta. | Eşiğin ne kadar aşıldığı hesaplanmadan görülür. | hepsi | P2 | az |  |
| 25 | **Tik sayacı** | Küçük hedefte yüzde yerine adet kutucukları. | Kalan 3 kutu sayılır; %83 soyut kalır. | hepsi | P2 | az |  |
| 26 | **Hedef bandı** | Grafikte hedef aralığı yatay bant; bant dışındaki noktalar içi boş. | Tek hedef sayısı yerine kabul edilebilir aralık; her sapma alarm değildir. | SPİ, AYS | P2 | az |  |
| 27 | **Geçen dönem gölgesi** | Geçen dönem soluk kesik çizgi olarak arkada durur. | Karşılaştırma için ikinci bir grafik gerekmez. | hepsi | P3 | az |  |
| 28 | **Gelecek yük grafiği** | Önümüzdeki yedi günün tekrar yükü; bugün dolu, gelecek kesikli. | Birikme olmadan görülür ve Merkez önerisinin gerekçesi olur. | AYS, ESP | P2 | orta |  |
| 29 | **Grafiğin cümlesi** · YENİLENDİ | Her grafiğin altında kodun ürettiği tek okuma cümlesi. | Acele eden kullanıcı da ekran okuyucu da aynı bilgiyi alır. | hepsi | P2 | az |  |
| 30 | **Aralık çubuğu** · YENİ | Tahmin tek sayı değil aralık olarak çizilir; en olası değer çizgiyle, dayanağı altta yazılı. | Sıralama tahmini gibi belirsiz sayılar kesinmiş gibi görünmez. | AYS | P1 | az | 19, 20 |
| 31 | **Dağılım şeridi** · YENİ | Otuz gecenin her biri bir nokta; ortadaki çizgi medyan. | Ortalama tek başına dalgalanmayı saklar; dağılım düzensizliği gösterir. | SPİ | P3 | az | 68, 55 |
| 32 | **Güvenli eğilim** · YENİ | Eğilim oku yalnız yeterli veri varsa çizilir; yoksa kaç ölçüm daha gerektiği yazar. | İki noktadan eğilim çıkarmak, anlamadığını anlamış gibi yapmaktır. | hepsi | P1 | az | 22, 55 |

## C · AYS (20)

_sınav hazırlığı_

| # | Özellik | Ne yapar | Neden | Modül | Önc. | Emek | İlgili |
|---|---|---|---|---|---|---|---|
| 33 | **Sıradaki blok kahramanı** | Ekranın en büyük öğesi tek iş; adımlar süreyle orantılı çubukta. | Bugün ekranının asıl sorusu: şimdi ne yapacağım? | AYS | P1 | orta | 51, 34, 12 |
| 34 | **Geri sayım rozeti** · YENİLENDİ | Uzakken sakin, son 15 dakikada canlı. | Yaklaşan iş ekrana bakmadan fark edilir. | AYS | P2 | az |  |
| 35 | **Nötr soru şeridi** | Çözerken yalnız ilerleme; doğru/yanlış rengi set bitince açılır. | Set ortasında yanlış görmek kaygı yaratır ve sonraki soruyu bozar. | AYS | P2 | az |  |
| 36 | **Yanlış kartı** | Önde soru, arkada «neden yanlış». Tekrarda kart çevrilir. | Yanlıştan öğrenme tekrarın içine girer. | AYS | P2 | orta |  |
| 37 | **Deneme karnesi** | Ders başına tek satır; satır uzunluğu o dersin soru sayısı kadar. | Netin nerede kaybedildiği tek bakışta görülür. | AYS | P1 | orta |  |
| 38 | **Hız şeridi** | Denemede her sorunun süresi bir nokta; ortalamanın 1,5 katını geçenler öne çıkar. | Zaman kaybı yanlıştan ayrı bir sorundur ve ayrı görülmeli. | AYS | P2 | orta |  |
| 39 | **Deneme karşılaştırması** | İki deneme ders ders yan yana, fark rozetleriyle. | +3 net tek sayıya sıkışmaz; Fen’deki düşüş görünür kalır. | AYS | P2 | orta |  |
| 40 | **Konu kapsam halkası** | Planlanan sorunun ne kadarı çözüldü. | Yetenek yargısı yok; yalnız ne kadar çalışıldığı. | AYS | P2 | az |  |
| 41 | **Konu zinciri** | Önkoşul sırası ve her halkanın kapsamı; eksik önkoşul kesikli çerçeveyle işaretli. | Hangi konunun önce gelmesi gerektiği görülür. | AYS | P3 | orta |  |
| 42 | **40 hafta çizgisi** | Sınava kadar her hafta bir tik; ara haftaları taralı. | Uzun hazırlık somut parçalara bölünür. | AYS | P2 | az |  |
| 43 | **Haftalık plan ızgarası** | Yedi gün × saat ızgarası; bloklar modül renginde, boş saatler taralı, bugün çerçeveli. | Haftanın yükü ve boşluğu aynı anda görülür. | hepsi | P2 | çok |  |
| 44 | **Ara haftası önizlemesi** | Etkilenen haftalar çizilir, tek onayla uygulanır. | Kural 9: orta seviye aksiyon önizlemesiz uygulanmaz. | AYS | P2 | orta |  |
| 45 | **Taşıma gölgesi** | Taşınan blok havada, yeri hayalet çizgi; bırakınca «Geri al». | Taşımanın etkisi bırakmadan önce görülür. | AYS | P2 | orta |  |
| 46 | **Tek satır soru ekle** | Ders · konu · sonuç üç çip; Enter ile kaydedilir. | Günde onlarca kayıt var; her biri iki saniyede bitmeli. | AYS | P1 | az |  |
| 47 | **Yanlış nedenleri** · YENİ | Set sonunda her yanlışa tek dokunuşla neden seçilir: bilgi, dikkat, süre. | Aynı sayıda yanlışın çaresi nedene göre değişir. | AYS | P2 | orta | 36, 38 |
| 48 | **Deneme takvimi** · YENİ | Önümüzdeki denemeler tek çizgide; geçmiş olan netiyle, sıradaki parlayarak. | Denemeye kaç gün kaldığı planı okumadan bilinir. | AYS | P2 | az | 39, 42 |
| 49 | **Soru ekranı** · YENİ · MEVCUT | Soru numarası, süre ve şıklar; doğru ya da yanlış çözerken gösterilmez. | Soru anında tek şeye bakılır; sonuç set bitince gelir. | AYS | P2 | orta | 35, 47 |
| 50 | **Tekrar paketi** · YENİ | Günün tekrarları konu konu paket olur; toplam süre tahmin olarak yazılır. | 432 kartlık kuyruk yerine bitirilebilir bir iş görülür. | AYS | P2 | orta | 28, 24 |
| 51 | **Blok bitiş özeti** · YENİ | Blok bitince üç sayı ve sıradaki iş; tek düğmeyle devam. | Bitiş anında ne yapıldığı ve sırada ne olduğu karışmaz. | AYS | P1 | az | 33, 119 |
| 52 | **Ders dengesi** · YENİ | Planlanan ve gerçekleşen ders dağılımı alt alta; fark tek rozetle. | Hangi dersin payının kaydığı haftalar geçmeden görülür. | AYS | P2 | az | 43, 37 |

## D · SPİ (16)

_sağlık · teşhis yok, doz yok_

| # | Özellik | Ne yapar | Neden | Modül | Önc. | Emek | İlgili |
|---|---|---|---|---|---|---|---|
| 53 | **Toparlanma halkası** | Tek sayı ortada; üç kaynak ayrı dilim, her biri kendi kesinlik etiketiyle. | Tek sayı var ama hangi kaynağın tahmin olduğu saklanmaz. | SPİ | P1 | orta |  |
| 54 | **Uyku bandı** | Gece tek şerit, uyanmalar kesik; altta haftanın gece dokusu. | Süre kadar bölünmeler de görünür. | SPİ | P2 | orta |  |
| 55 | **Ham + ortalama çizgisi** | Dalgalı ölçümlerde ham noktalar soluk, yedi günlük ortalama çizgi. | Günlük dalgalanma paniğe yol açmaz; eğilim görülür. | SPİ | P1 | az |  |
| 56 | **Referans bandı** | Değer, laboratuvar aralığının içinde bir nokta. Aralık dışı yalnız işaretlenir. | Teşhis yok: yalnız aralığın neresinde olduğu. | SPİ | P2 | az |  |
| 57 | **Tabak görünümü** | Halka dilimi yerine tabak bölmesi; kalan miktar yazılı. | Gram ve yüzde yerine gerçek hayattaki tabak düşünülür. | SPİ | P2 | orta |  |
| 58 | **Tek dokunuş sayaç** | Küçük kayıt tek dokunuş; altta «Geri al» şeridi. | Küçük kayıt zahmetliyse hiç girilmez; eksik veri çoğalır. | SPİ | P1 | az |  |
| 59 | **Enerji ölçeği** | Günde bir kez beş noktalı ölçek; seçilen nokta büyür. | Öznel veri de ölçülür: tahmin edilmez, sorulur. | SPİ | P2 | az |  |
| 60 | **Set kutucukları** | Biten set dolar; dinlenme süresi kutucuğun içinde akar. | Antrenman sırasında tek bakış yeter. | SPİ | P2 | orta |  |
| 61 | **Haftalık hareket halkaları** | Yedi küçük halka; verisi olmayan gün kesikli boş halka. | Eksik gün sıfır gibi görünmez; «yapmadım» ile «girmedim» ayrılır. | SPİ | P2 | az |  |
| 62 | **Ölçüm tuş takımı** | Büyük rakam, sabit birim, dünkü değer ipucu olarak yanında. | Yanlış girişi dünkü değer yakalar. | SPİ | P2 | az | 18 |
| 63 | **Sonraki kontrol kartı** | «Kan tahlili · 3 hafta sonra»; hatırlatır, yorumlamaz. | SPİ takip eder; karar kullanıcının ve hekiminindir. | SPİ | P3 | az |  |
| 64 | **Harcama şeritleri** | Kategori başına şerit ve bütçe çizgisi; aşım yalnız çizginin rengiyle. | Aşım bağırmaz ama gözden de kaçmaz. | SPİ | P2 | az |  |
| 65 | **Öğün çizelgesi** · YENİ | Gün tek şeritte; öğünler nokta, yeme aralığı açık bant, planlanan öğün içi boş. | Beslenme saatleri gram tablosundan önce okunur. | SPİ | P2 | az | 57 |
| 66 | **Yoğunluk bölgeleri** · YENİ | Antrenmanın dakikaları bölgelere göre; eşikleri kod hesaplar. | Ne kadar zorlandığın yorum değil, ölçüm olarak görünür. | SPİ | P3 | az | 60 |
| 67 | **Harcama takvimi** · YENİ | Ay takvimi; her günün harcaması nokta büyüklüğüyle, gelecek günler soluk. | Harcamanın hangi günlerde yoğunlaştığı tabloya bakmadan görülür. | SPİ | P3 | az | 64 |
| 68 | **Uyku düzeni** · YENİ | İki haftanın yatış ve kalkış saatleri dikey çubuk; hedef saatler kesik çizgi. | Uyku süresi kadar saatinin kayması da görünür. | SPİ | P2 | az | 54, 31 |

## E · ESP (16)

_gelişim · sertifika yok, yargı yok_

| # | Özellik | Ne yapar | Neden | Modül | Önc. | Emek | İlgili |
|---|---|---|---|---|---|---|---|
| 69 | **Deste yığını** | Kalan kartlar arkada yığın; yığın incelikçe bitiş görülür. | Ne kadar kaldığı sayı okumadan hissedilir. | ESP | P1 | az |  |
| 70 | **Süreli cevap düğmeleri** | Her düğme kartın bir sonraki görülme zamanını söyler. | Her seçimin sonucu seçmeden bilinir. | ESP | P2 | az |  |
| 71 | **Dakika halkası** | Günlük hedef halkası; rengi değişmez, yalnız dolar. | Hedefe yaklaşmak renk değiştiren bir alarm değildir. | ESP | P2 | az |  |
| 72 | **Unutma eğrisi** | Hatırlama düşer, tekrar yükseltir; «bugün» noktası işaretli. | Tekrarın neden bugün olduğu görülür. | ESP | P2 | orta |  |
| 73 | **Merdiven basamakları** · YENİLENDİ | Basamak içerik sırasıdır, derece değil. | Sıra var, yargı yok; sertifika izlenimi verilmez. | ESP | P2 | orta |  |
| 74 | **Kütüphane rafı** · YENİLENDİ | Kitap sırtı: kalınlık sayfa sayısı, alt çizgi okunan oran. | Okuma listesi tablo değil, raf gibi durur. | ESP | P3 | orta |  |
| 75 | **Okuma ilerlemesi** | Kitap içinde ince ilerleme çizgisi ve bölümün kalan süresi. | Kalan süre tahmindir ve tahmin olarak etiketlidir. | ESP | P2 | az |  |
| 76 | **Alıntı kartı** | Altı çizilen cümle kaynağıyla kart olur; tekrar destesine eklenebilir. | Okuma ile tekrar birbirine bağlanır. | ESP | P3 | orta |  |
| 77 | **Kelime sahnesi** | Tek kelime, anlamı, örnek cümle. Başka hiçbir şey yok. | Tekrar anında dikkat tek şeye ait olmalı. | ESP | P2 | az |  |
| 78 | **Bağlamda kelime** | Metinde hedef kelime altı çizili; dokununca anlamı yerinde açılır. | Kelime ezber listesinde değil, cümle içinde öğrenilir. | ESP | P2 | orta |  |
| 79 | **Konuşma dalga formu** | Konuşma pratiğinde ses dalgası ve süre; duraksamalar boşluk olarak. | Ses kaydı bir sayı gibi okunur; yorum yapılmaz, ölçülür. | ESP | P3 | çok |  |
| 80 | **Tarih şeridi** | Yüzyıllar yatay şerit, olaylar nokta; eşlenen nokta yanar. | Yüzyıl eşlemesi görsel bir hafızaya dönüşür. | ESP | P3 | orta |  |
| 81 | **Ajanlı ders kapağı** | Dersin başında ajan portresi ve tek cümle; renk yine ESP. | Ders kimin sesinden geldiğini söyler ama rengi modülündür. | ESP | P3 | az |  |
| 82 | **Oturum sonu** · YENİ | Tekrar bitince kart sayısı, iyi oranı, süre ve cevap dağılımı; yarının yükü altta. | Oturumun nasıl geçtiği tek bakışta; yarın ne beklediği belli. | ESP | P2 | az | 70, 28 |
| 83 | **Kelime ağı** · YENİ | Kelime ortada; eş anlamlılar çevresinde, zıt anlamlı kesik çerçeveyle. | Kelime tek başına değil, akrabalarıyla hatırlanır. | ESP | P3 | orta | 77, 78 |
| 84 | **Bağlı notlar** · YENİ | Not kartının altında ona bağlanan kaynaklar ve notlar çip olarak. | Okuma, not ve tekrar tek zincire bağlanır. | ESP | P3 | orta | 76, 75 |

## F · Merkez · HKM (14)

_yalnız önerir, modül uygular_

| # | Özellik | Ne yapar | Neden | Modül | Önc. | Emek | İlgili |
|---|---|---|---|---|---|---|---|
| 85 | **Mor öneri kartı** | Merkez’in her önerisi mor kenarlı kart; sağ üstte seviyesi. | Merkez’in sesi modül içeriğiyle hiçbir zaman karışmaz. | Merkez | P1 | az | 89, 96, 87 |
| 86 | **Seviyeye göre onay** | Küçük: tek dokunuş + Geri al. Orta: önizleme + onay. Büyük: önce/sonra + dönüş noktası. | Kural 9: seviyeyi katalog belirler, ekran onun kalıbını giyer. | Merkez | P1 | orta | 91, 92, 44 |
| 87 | **Çakışma kartı** | İki modül aynı saati isterse ikisi yan yana görünür, Merkez bir çözüm önerir. | Kimin ne istediği karışmaz; son sözü kullanıcı söyler. | Merkez | P1 | orta |  |
| 88 | **Önce / sonra görünümü** | Yalnız değişen blok renkli; gerisi soluk kalır. | Değişikliğin büyüklüğü abartılmadan görülür. | Merkez | P2 | orta |  |
| 89 | **Gerekçe çubuğu** | Sayı koddan gelir ve çizilir; modelin cümlesi altında, ayrı durur. | Kural 1: sayıyı kod üretir, model yalnız cümleye çevirir. | Merkez | P1 | az |  |
| 90 | **Bekleyen öneri rozeti** | Üst çubukta mor sayaç; açılınca öneriler modüllerine göre sıralı. | Öneriler işi bölmez, sırasını bekler. | Merkez | P2 | az |  |
| 91 | **Otomatik uygula ayarı** | Küçük türlerin sormadan uygulanıp uygulanmayacağı tür tür anahtar; orta ve büyük hep sorar. | Kural 9: hangi küçük türün sormadan uygulanacağını kullanıcı seçer. | Merkez | P1 | az |  |
| 92 | **Geri dönüş noktaları** | Büyük aksiyonlardan önce alınan kayıtlar; birine tek düğmeyle dönülür. | Büyük değişiklik geri dönüşsüz olamaz. | Merkez | P2 | orta |  |
| 93 | **Bağlantı noktası** | «Merkez bağlı · 14:08». Kapalıyken gri: «her şey çalışıyor». | Kural 4: Merkez kapalıyken hiçbir modül bozulmaz; ekran da panik yapmaz. | Merkez | P1 | az | 135, 11 |
| 94 | **Öneri geçmişi** | Uygulanan, geçilen, geri alınan öneriler; her biri tek satır. | Merkez’in ne önerdiği ve kullanıcının ne seçtiği izlenebilir. | Merkez | P3 | az |  |
| 95 | **Haftalık Merkez özeti** · YENİ | Pazar akşamı tek kart: her modülden bir satır, bekleyen öneriler en altta. | Hafta tek sayfadan okunur; modüller yine ayrı satırda durur. | Merkez | P2 | orta | 09, 90 |
| 96 | **Kural izi** · YENİ | Önerinin dayandığı kurallar numarasıyla; her kuralın yanında sağlandığı değer. | Kural 1: kararı kod verir; kullanıcı hangi kuralın tetiklendiğini görür. | Merkez | P1 | az | 89, 20 |
| 97 | **Sessiz saatler** · YENİ | Gece bandında gelen öneri bekler; sabah ilk açılışta görünür. | Merkez işi bölmez; uyku saatinde hiç bölmez. | Merkez | P2 | az | 90 |
| 98 | **Geçme nedeni** · YENİ | «Geç» dendiğinde isteğe bağlı neden çipleri; seçilen neden geçmişe yazılır. | Önerinin neden işe yaramadığı tahminle değil, kullanıcının sözüyle bilinir. | Merkez | P2 | az | 94 |

## G · Ofis ve ajanlar (9)

_cümle ajandan, sayı koddan_

| # | Özellik | Ne yapar | Neden | Modül | Önc. | Emek | İlgili |
|---|---|---|---|---|---|---|---|
| 99 | **Masa görünümü** | Konuşan ajan büyür ve renklenir; diğerleri soluk bekler. | Kimin konuştuğu ilk bakışta belli. | hepsi | P2 | az |  |
| 100 | **Balondaki sayı çipi** | Ajan cümlesindeki sayı çip olarak görünür ve kaynağını taşır. | Cümle yorum, çip gerçek: ikisi karışmaz. | hepsi | P1 | az |  |
| 101 | **Ajan sınır kartı** | Ajan profili iki sütun: ne yapar, ne yapmaz. | Kural 5: sınırlar ilk bakışta belli; kullanıcı yanlış şey beklemez. | hepsi | P2 | az |  |
| 102 | **Devir göstergesi** | Bir ajan konuyu diğerine aktarınca kesik çizgiyle gösterilir. | Konuşmanın ortasında ses değişirse kullanıcı nedenini bilir. | hepsi | P3 | az |  |
| 103 | **Ajan durum halkası** | Portrenin çevresinde ince halka: dönen, sabit ya da yok. | Ajanın çalışıp çalışmadığı yazı okumadan görülür. | hepsi | P3 | az |  |
| 104 | **Hazır cevap çipleri** | Balonun altında iki üç kısa cevap. | Yazmadan konuşma sürer; mobilde özellikle. | hepsi | P2 | az |  |
| 105 | **Ajan seçici** · YENİ | @ yazınca ajanlar rolü ve modülüyle listelenir; eşleşen harfler vurgulanır. | Kime sorduğun karışmaz; her ajanın alanı adının yanında. | hepsi | P2 | az | 101 |
| 106 | **Günün toplantısı** · YENİ | Patron günün başında her ajandan tek cümle toplar; sayılar çip olarak. | Beş ajanı tek tek açmadan günün durumu okunur. | hepsi | P2 | orta | 100, 99 |
| 107 | **Üslup seçimi** · YENİ · MEVCUT | Ajanın konuşma biçimi üç seçenekten biri; önizleme anında değişir. | Tercih değiştirmek küçük bir aksiyondur ve geri alınır; sayılar değişmez. | hepsi | P3 | az | 91 |

## H · Seviye ve rütbe (8)

_yalnız görünürlük, karar yok_

| # | Özellik | Ne yapar | Neden | Modül | Önc. | Emek | İlgili |
|---|---|---|---|---|---|---|---|
| 108 | **Rütbe halkası** | Rütbe görseli, çevresinde XP halkası. | Seviye görünür ama ekranın merkezine oturmaz. | hepsi | P2 | az |  |
| 109 | **XP dökümü** | Bugünkü XP nereden geldi: soru, blok, günü kaydetme. | Kural 6: XP görünürdür ama hiçbir karara girmez; döküm bunu açık eder. | hepsi | P3 | az |  |
| 110 | **Kademe yolu** | Altı kademe tek yolda: Bronz’dan Kutsal’a; bulunduğun yer yanar. | Bir sonraki kademe somut; ad ve renk tek kaynaktan gelir. | hepsi | P3 | az |  |
| 111 | **Sakin seviye atlama** | Kısa bir parlama; ekranı kapatmaz, işi bölmez. | Seviye bir ödül anı ama işin önüne geçmemeli. | hepsi | P3 | az |  |
| 112 | **Sistem başına rütbe** | Her sistemin kendi rütbesi; çerçevesi modül renginde. | Kural 6: her sistemin kendi seviyesi var; tanım ortak. | hepsi | P2 | az |  |
| 113 | **Rütbe galerisi** | Kazanılan kademeler renkli, kilitliler siluet. | XP yalnız burada ve üst çubukta görünür; başka ekrana sızmaz. | hepsi | P3 | az |  |
| 114 | **Başarım rozeti** · YENİ · MEVCUT | Kazanılan rozet altıgen ve renkli; kilitli olanın ilerlemesi dilim olarak. | Uzun hedefler görünür ama hiçbir kararı etkilemez. | hepsi | P3 | az | 113 |
| 115 | **Ay özeti şeridi** · YENİ · MEVCUT | On iki ayın çalışma günleri; kurulumdan önceki aylar «veri yok» olarak kesik. | Eksik ay sıfır gibi görünmez; defterin ne zaman başladığı belli. | hepsi | P3 | az | 22 |

## I · Hareket (8)

_her hareket bir anlam taşır_

| # | Özellik | Ne yapar | Neden | Modül | Önc. | Emek | İlgili |
|---|---|---|---|---|---|---|---|
| 116 | **Sayı yuvarlanması** | Değer değişince rakam yukarı kayar. | Değişen sayı gözden kaçmaz. | hepsi | P2 | az |  |
| 117 | **Geri al geri sayımı** · MEVCUT | «Geri al» şeridinin altında incelen çizgi. | Geri almanın ne kadar süresi kaldığı görünür olmalı. | hepsi | P1 | az | 58, 45 |
| 118 | **Şimdi çizgisi** | Çizelgede ilerleyen ince çizgi; geçmiş saatler taralı. | Günün neresinde olduğun saat okumadan görülür. | hepsi | P2 | az |  |
| 119 | **Tik çizimi** | İş bitince tik çizilerek belirir, satır yavaşça soluklaşır. | Bitirme anı küçük ama hissedilir. | hepsi | P2 | az |  |
| 120 | **Kart açılma geçişi** · YENİLENDİ | Kart yerinde büyüyerek ayrıntıya dönüşür. | Kullanıcı nereden geldiğini unutmaz; geri dönüş doğal olur. | hepsi | P2 | orta |  |
| 121 | **Küçülen başlık** · YENİLENDİ | Kaydırınca büyük başlık üst çubuğa küçülerek yerleşir. | Ekran alanı açılır ama bağlam kaybolmaz. | hepsi | P3 | az |  |
| 122 | **Modül geçiş rengi** · YENİ | Sistem değişince üst çizgi yeni sistemin rengini alır, ad kısa bir geçişle değişir. | Hangi sisteme geçtiğin gözün köşesinden bile fark edilir. | hepsi | P2 | az | 08 |
| 123 | **Odak halkası akışı** · YENİ | Klavyeyle gezerken odak halkası düğmeden düğmeye kayarak geçer. | Klavye kullanıcısı nerede olduğunu kaybetmez. | hepsi | P3 | az |  |

## J · Mobil ve erişilebilirlik (8)

_390 piksel ve renk körlüğü_

| # | Özellik | Ne yapar | Neden | Modül | Önc. | Emek | İlgili |
|---|---|---|---|---|---|---|---|
| 124 | **Başparmak bölgesi** · YENİLENDİ | Mobilde ana eylem ekranın alt üçte birinde; gezinme alt sekme çubuğuna iner. | Günde onlarca kez tek elle kullanılır. | hepsi | P2 | orta |  |
| 125 | **Kaydırarak işaretle** | Satırı sağa kaydır: bitti; sola: ertele. | Mobilde en sık iki eylem tek hareket olur. | hepsi | P2 | orta |  |
| 126 | **Alt çekmece** · YENİLENDİ | Mobilde ayrıntı alttan yarım ekran açılır; çekince tam ekran. | Liste kaybolmaz; çekmece tek elle kapanır. | hepsi | P2 | orta |  |
| 127 | **Sabit etiketli kaydırma** | Şerit yana kayar, modül etiketi solda sabit kalır. | Dar ekranda da hangi şeridin kime ait olduğu kaybolmaz. | hepsi | P2 | az |  |
| 128 | **Bildirim kartı** | Telefon bildirimi: modül rengi, tek cümle, iki eylem. | Uygulamayı açmadan karar verilir. | hepsi | P2 | orta |  |
| 129 | **Renksiz de ayırt edilir** | Modül = renk + harf + şekil: daire, kare, üçgen. | Renk körü kullanıcı da kategorileri karıştırmaz. | hepsi | P1 | az |  |
| 130 | **Hızlı ekle düğmesi** · YENİ | Sağ alttaki + açılınca üç modülün hızlı kaydı yelpaze gibi çıkar. | Her modülün en sık kaydı tek yerden, rengiyle ayrılarak girilir. | hepsi | P2 | orta | 124 |
| 131 | **Ana ekran bileşeni** · YENİ | Telefon ana ekranında sıradaki iş, saati ve günün ilerlemesi. | Uygulamayı açmadan sırada ne olduğu bilinir. | hepsi | P3 | çok | 128 |

## K · Kurulum ve güven (5)

_ilk gün, yedek ve verinin yeri_

| # | Özellik | Ne yapar | Neden | Modül | Önc. | Emek | İlgili |
|---|---|---|---|---|---|---|---|
| 132 | **Kurulum adımları** · YENİ · MEVCUT | İlk açılışta dört adım; her adım tek soru, ilerleme üstte. | Boş bir sistemle değil, kendi takvimiyle başlanır. | hepsi | P2 | orta | 133 |
| 133 | **Örnek veri kipi** · YENİ | Sistemi örnek veriyle denemek; üstte şeritli uyarı, arkada «ÖRNEK» filigranı. | Deneme verisi gerçek veriyle hiçbir zaman karışmaz. | hepsi | P3 | orta | 132 |
| 134 | **Yedek durumu** · YENİ · MEVCUT | Son yedeğin yaşı, boyutu ve iki haftalık yedek izi; tek düğmeyle yedek. | Verinin güvende olduğu tahmin değil, tarih olarak görülür. | hepsi | P1 | az | 135, 136 |
| 135 | **Veri nerede?** · YENİ | Tek şema: cihaz asıl kayıt, yedek senin seçtiğin yer, Merkez isteğe bağlı. | Kural 4: Merkez modüle yazmaz; kullanıcı bunu metinden değil şemadan okur. | hepsi | P2 | az | 93, 134 |
| 136 | **Dışa aktar** · YENİ · MEVCUT | Biçim seçilir, ilk satırlar önizlenir; her sayı etiketiyle birlikte çıkar. | Kural 2 dosyada da geçerli: etiketsiz sayı dışarı da çıkmaz. | hepsi | P2 | az | 134 |

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
