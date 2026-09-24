# LifeOS · Tasarım kataloğu (sürüm 2)

96 özellik · 38 yeni · 25 P1. Canlı örnekleri `vitrin.html` içinde; bu liste o dosyadaki veriden üretildi.

**Öncelik:** P1 önce, P2 sonra, P3 ileride. **Emek:** az / orta / çok. **YENİ:** ilk vitrinde yoktu.

## İlkeler

1. **Renk sahipliği söyler.** Mavi AYS, yeşil SPİ, turuncu ESP, mor Merkez. Yeşil/kırmızı yalnız yön.
2. **Etiketsiz sayı yok.** Ölçüldü · hesaplandı · tahmin · veri yok. Eksik veri «—», grafik sıfıra düşmez.
3. **Kod karar verir, model anlatır.** Sayı kuraldan gelir; modelin cümlesi ekranda ayrı durur.
4. **Sınırlar ekranda da geçerli.** SPİ teşhis/doz göstermez; ESP/AYS sertifika ve yetenek yargısı göstermez; XP hiçbir kararın yanında durmaz.

## Temeller (özellik değil, kural)

Renk · Tipografi (serif başlık, sans metin, mono sayı; birim küçük) · Boşluk (4-8-12-16-24-32) · Yüzey (zemin/kart/yükseltilmiş) · Köşe (6/8/10/14) · Hareket (120/200/320/700 ms; azaltılmış harekette 0)

## A · Ortak tasarım dili (12)

_her sistemde aynı davranan parçalar_

| # | Özellik | Ne yapar | Neden | Modül | Önc. | Emek |
|---|---|---|---|---|---|---|
| 01 | **Modül şeridi** | Birden çok modülün işi aynı ekrandaysa her modül kendi yatay şeridinde durur. | Kategoriler aynı listede karışmaz; göz rengi ve satırı birlikte okur. | hepsi | P1 | orta |
| 02 | **Tek kutu iskeleti** | Her kutu aynı başlığı taşır: simge, ad ve sağda kesinlik etiketi. | Kutunun ne olduğu içeriğine bakmadan anlaşılır. | hepsi | P1 | az |
| 03 | **Üç alan düzeni** | Her «Bugün» ekranı aynı sırada: Şimdi → Durum → Öneri. | Modül değişse de göz aynı yere bakar; öğrenme bir kez olur. | hepsi | P1 | az |
| 04 | **Sayfa başı cümlesi** | Ekranın tepesinde kural motorunun ürettiği tek cümlelik durum. | Ekranı taramadan günün özeti alınır; cümle koddan geldiği için tutarlıdır. | hepsi | P1 | az |
| 05 | **Hafta şeridi** · YENİ | Başlığın altında yedi gün; her günde üç modülün noktası, gelecek günler boş halka. | Bugünün haftadaki yeri ve hangi günün boş kaldığı tek bakışta görülür. | hepsi | P2 | az |
| 06 | **Günün açılışı** · YENİ | Günün ilk açılışında tek kart: iş sayısı, toplam süre ve ilk iş. | Güne planı okuyarak değil, tek kartla başlanır. | hepsi | P2 | orta |
| 07 | **Gün kapanışı** · YENİ | Akşam «Bugün kapandı» kartı: üç sayı ve yarının ilk işi. | Gün yarım kalmış hissi bırakmaz; ertesi sabah hazır başlar. | hepsi | P2 | orta |
| 08 | **Modül geçiş menüsü** · YENİ | «LifeOS / AYS» yolundan açılan menü: dört sistem, her biri kendi renginde ve kendi durumuyla. | Sistemler arası geçiş tek tık; hangi sistemde olduğun hiç karışmaz. | hepsi | P2 | orta |
| 09 | **Gruplu bildirimler** · YENİ | Bildirimler modül şeritleriyle gruplanır; Merkez önerileri ayrı kümede durur. | Farklı kategorilerin uyarıları aynı listede birbirine girmez. | hepsi | P2 | orta |
| 10 | **Boş durum sahnesi** | Veri yoksa küçük bir çizim ve tek eylem gösterilir. | Boş grafik ya da 0, «ölçüldü ve sıfır» diye yanlış okunur. | hepsi | P2 | az |
| 11 | **Sakin hata durumu** · YENİ | Bir şey bozulursa: ne oldu, verin nerede, tek düğme. Kırmızı yok. | Kullanıcı veri kaybı olmadığını ilk cümlede öğrenir. | hepsi | P2 | az |
| 12 | **Tek canlı öğe** | Ekranda aynı anda yalnız bir şey nabız atar: sıradaki iş. | Dikkat bölünmez; hareket görüldüğünde bir anlamı vardır. | hepsi | P2 | az |

## B · Sayı ve veri (11)

_etiketsiz sayı yok, eksik veri sıfır değil_

| # | Özellik | Ne yapar | Neden | Modül | Önc. | Emek |
|---|---|---|---|---|---|---|
| 13 | **Kesinlik glifleri** | Dolu, yarım, kesikli, çizgi. Tahmin olan sayının altı kesik ve aralığıyla birlikte. | Kural 2: etiketsiz sayı hiçbir katmana girmez. | hepsi | P1 | az |
| 14 | **Köken kartı** · YENİ | Sayının üzerine gelince nereden geldiği açılır: formül, girdiler, hesap zamanı. | Kod otoritedir; kullanıcı her sayının hesabını kendi gözüyle görebilir. | hepsi | P1 | orta |
| 15 | **Veri tazeliği** · YENİ | Eski ölçüm soluklaşır ve yaşını yazar: «12 gün önce». | Bayat veri güncelmiş gibi görünüp kararı yanıltmaz. | hepsi | P1 | az |
| 16 | **Eksik gün boşluğu** · YENİ | Grafikte verisi olmayan gün boşluk kalır; çizgi kesikli geçer, sıfıra düşmez. | Eksik veri sıfır değildir; düşen çizgi olmayan bir kötüleşme gösterir. | hepsi | P1 | az |
| 17 | **Anlamlı fark rozeti** | Rozetin rengi işaretten değil anlamdan gelir: net artışı iyi, borç artışı kötü. | +41 tekrar borcu yeşil gösterilirse yanlış haber olur. | hepsi | P1 | az |
| 18 | **Eşik çizgili çubuk** | Değer ve eşik aynı çubukta. | Eşiğin ne kadar aşıldığı hesaplanmadan görülür. | hepsi | P2 | az |
| 19 | **Tik sayacı** | Küçük hedefte yüzde yerine adet kutucukları. | Kalan 3 kutu sayılır; %83 soyut kalır. | hepsi | P2 | az |
| 20 | **Hedef bandı** · YENİ | Grafikte hedef aralığı yatay bant; bant dışındaki noktalar içi boş. | Tek hedef sayısı yerine kabul edilebilir aralık; her sapma alarm değildir. | SPİ, AYS | P2 | az |
| 21 | **Geçen dönem gölgesi** | Geçen dönem soluk kesik çizgi olarak arkada durur. | Karşılaştırma için ikinci bir grafik gerekmez. | hepsi | P3 | az |
| 22 | **Gelecek yük grafiği** · YENİ | Önümüzdeki yedi günün tekrar yükü; bugün dolu, gelecek kesikli. | Birikme olmadan görülür ve Merkez önerisinin gerekçesi olur. | AYS, ESP | P2 | orta |
| 23 | **Grafiğin cümlesi** | Her grafiğin altında kodun ürettiği tek okuma cümlesi. | Acele eden kullanıcı da ekran okuyucu da aynı bilgiyi alır. | hepsi | P2 | az |

## C · AYS (14)

_sınav hazırlığı_

| # | Özellik | Ne yapar | Neden | Modül | Önc. | Emek |
|---|---|---|---|---|---|---|
| 24 | **Sıradaki blok kahramanı** | Ekranın en büyük öğesi tek iş; adımlar süreyle orantılı çubukta. | Bugün ekranının asıl sorusu: şimdi ne yapacağım? | AYS | P1 | orta |
| 25 | **Geri sayım rozeti** | Uzakken sakin, son 15 dakikada canlı. | Yaklaşan iş ekrana bakmadan fark edilir. | AYS | P2 | az |
| 26 | **Nötr soru şeridi** | Çözerken yalnız ilerleme; doğru/yanlış rengi set bitince açılır. | Set ortasında yanlış görmek kaygı yaratır ve sonraki soruyu bozar. | AYS | P2 | az |
| 27 | **Yanlış kartı** | Önde soru, arkada «neden yanlış». Tekrarda kart çevrilir. | Yanlıştan öğrenme tekrarın içine girer. | AYS | P2 | orta |
| 28 | **Deneme karnesi** | Ders başına tek satır; satır uzunluğu o dersin soru sayısı kadar. | Netin nerede kaybedildiği tek bakışta görülür. | AYS | P1 | orta |
| 29 | **Hız şeridi** · YENİ | Denemede her sorunun süresi bir nokta; ortalamanın 1,5 katını geçenler öne çıkar. | Zaman kaybı yanlıştan ayrı bir sorundur ve ayrı görülmeli. | AYS | P2 | orta |
| 30 | **Deneme karşılaştırması** · YENİ | İki deneme ders ders yan yana, fark rozetleriyle. | +3 net tek sayıya sıkışmaz; Fen’deki düşüş görünür kalır. | AYS | P2 | orta |
| 31 | **Konu kapsam halkası** | Planlanan sorunun ne kadarı çözüldü. | Yetenek yargısı yok; yalnız ne kadar çalışıldığı. | AYS | P2 | az |
| 32 | **Konu zinciri** · YENİ | Önkoşul sırası ve her halkanın kapsamı; eksik önkoşul kesikli çerçeveyle işaretli. | Hangi konunun önce gelmesi gerektiği görülür. | AYS | P3 | orta |
| 33 | **40 hafta çizgisi** | Sınava kadar her hafta bir tik; ara haftaları taralı. | Uzun hazırlık somut parçalara bölünür. | AYS | P2 | az |
| 34 | **Haftalık plan ızgarası** · YENİ | Yedi gün × saat ızgarası; bloklar modül renginde, boş saatler taralı, bugün çerçeveli. | Haftanın yükü ve boşluğu aynı anda görülür. | hepsi | P2 | çok |
| 35 | **Ara haftası önizlemesi** | Etkilenen haftalar çizilir, tek onayla uygulanır. | Kural 9: orta seviye aksiyon önizlemesiz uygulanmaz. | AYS | P2 | orta |
| 36 | **Taşıma gölgesi** | Taşınan blok havada, yeri hayalet çizgi; bırakınca «Geri al». | Taşımanın etkisi bırakmadan önce görülür. | AYS | P2 | orta |
| 37 | **Tek satır soru ekle** | Ders · konu · sonuç üç çip; Enter ile kaydedilir. | Günde onlarca kayıt var; her biri iki saniyede bitmeli. | AYS | P1 | az |

## D · SPİ (12)

_sağlık · teşhis yok, doz yok_

| # | Özellik | Ne yapar | Neden | Modül | Önc. | Emek |
|---|---|---|---|---|---|---|
| 38 | **Toparlanma halkası** | Tek sayı ortada; üç kaynak ayrı dilim, her biri kendi kesinlik etiketiyle. | Tek sayı var ama hangi kaynağın tahmin olduğu saklanmaz. | SPİ | P1 | orta |
| 39 | **Uyku bandı** | Gece tek şerit, uyanmalar kesik; altta haftanın gece dokusu. | Süre kadar bölünmeler de görünür. | SPİ | P2 | orta |
| 40 | **Ham + ortalama çizgisi** · YENİ | Dalgalı ölçümlerde ham noktalar soluk, yedi günlük ortalama çizgi. | Günlük dalgalanma paniğe yol açmaz; eğilim görülür. | SPİ | P1 | az |
| 41 | **Referans bandı** | Değer, laboratuvar aralığının içinde bir nokta. Aralık dışı yalnız işaretlenir. | Teşhis yok: yalnız aralığın neresinde olduğu. | SPİ | P2 | az |
| 42 | **Tabak görünümü** | Halka dilimi yerine tabak bölmesi; kalan miktar yazılı. | Gram ve yüzde yerine gerçek hayattaki tabak düşünülür. | SPİ | P2 | orta |
| 43 | **Tek dokunuş sayaç** | Küçük kayıt tek dokunuş; altta «Geri al» şeridi. | Küçük kayıt zahmetliyse hiç girilmez; eksik veri çoğalır. | SPİ | P1 | az |
| 44 | **Enerji ölçeği** · YENİ | Günde bir kez beş noktalı ölçek; seçilen nokta büyür. | Öznel veri de ölçülür: tahmin edilmez, sorulur. | SPİ | P2 | az |
| 45 | **Set kutucukları** | Biten set dolar; dinlenme süresi kutucuğun içinde akar. | Antrenman sırasında tek bakış yeter. | SPİ | P2 | orta |
| 46 | **Haftalık hareket halkaları** · YENİ | Yedi küçük halka; verisi olmayan gün kesikli boş halka. | Eksik gün sıfır gibi görünmez; «yapmadım» ile «girmedim» ayrılır. | SPİ | P2 | az |
| 47 | **Ölçüm tuş takımı** | Büyük rakam, sabit birim, dünkü değer ipucu olarak yanında. | Yanlış girişi dünkü değer yakalar. | SPİ | P2 | az |
| 48 | **Sonraki kontrol kartı** · YENİ | «Kan tahlili · 3 hafta sonra»; hatırlatır, yorumlamaz. | SPİ takip eder; karar kullanıcının ve hekiminindir. | SPİ | P3 | az |
| 49 | **Harcama şeritleri** | Kategori başına şerit ve bütçe çizgisi; aşım yalnız çizginin rengiyle. | Aşım bağırmaz ama gözden de kaçmaz. | SPİ | P2 | az |

## E · ESP (13)

_gelişim · sertifika yok, yargı yok_

| # | Özellik | Ne yapar | Neden | Modül | Önc. | Emek |
|---|---|---|---|---|---|---|
| 50 | **Deste yığını** | Kalan kartlar arkada yığın; yığın incelikçe bitiş görülür. | Ne kadar kaldığı sayı okumadan hissedilir. | ESP | P1 | az |
| 51 | **Süreli cevap düğmeleri** | Her düğme kartın bir sonraki görülme zamanını söyler. | Her seçimin sonucu seçmeden bilinir. | ESP | P2 | az |
| 52 | **Dakika halkası** | Günlük hedef halkası; rengi değişmez, yalnız dolar. | Hedefe yaklaşmak renk değiştiren bir alarm değildir. | ESP | P2 | az |
| 53 | **Unutma eğrisi** | Hatırlama düşer, tekrar yükseltir; «bugün» noktası işaretli. | Tekrarın neden bugün olduğu görülür. | ESP | P2 | orta |
| 54 | **Merdiven basamakları** | Basamak içerik sırasıdır, derece değil. | Sıra var, yargı yok; sertifika izlenimi verilmez. | ESP | P2 | orta |
| 55 | **Kütüphane rafı** | Kitap sırtı: kalınlık sayfa sayısı, alt çizgi okunan oran. | Okuma listesi tablo değil, raf gibi durur. | ESP | P3 | orta |
| 56 | **Okuma ilerlemesi** · YENİ | Kitap içinde ince ilerleme çizgisi ve bölümün kalan süresi. | Kalan süre tahmindir ve tahmin olarak etiketlidir. | ESP | P2 | az |
| 57 | **Alıntı kartı** · YENİ | Altı çizilen cümle kaynağıyla kart olur; tekrar destesine eklenebilir. | Okuma ile tekrar birbirine bağlanır. | ESP | P3 | orta |
| 58 | **Kelime sahnesi** | Tek kelime, anlamı, örnek cümle. Başka hiçbir şey yok. | Tekrar anında dikkat tek şeye ait olmalı. | ESP | P2 | az |
| 59 | **Bağlamda kelime** · YENİ | Metinde hedef kelime altı çizili; dokununca anlamı yerinde açılır. | Kelime ezber listesinde değil, cümle içinde öğrenilir. | ESP | P2 | orta |
| 60 | **Konuşma dalga formu** · YENİ | Konuşma pratiğinde ses dalgası ve süre; duraksamalar boşluk olarak. | Ses kaydı bir sayı gibi okunur; yorum yapılmaz, ölçülür. | ESP | P3 | çok |
| 61 | **Tarih şeridi** · YENİ | Yüzyıllar yatay şerit, olaylar nokta; eşlenen nokta yanar. | Yüzyıl eşlemesi görsel bir hafızaya dönüşür. | ESP | P3 | orta |
| 62 | **Ajanlı ders kapağı** | Dersin başında ajan portresi ve tek cümle; renk yine ESP. | Ders kimin sesinden geldiğini söyler ama rengi modülündür. | ESP | P3 | az |

## F · Merkez · HKM (10)

_yalnız önerir, modül uygular_

| # | Özellik | Ne yapar | Neden | Modül | Önc. | Emek |
|---|---|---|---|---|---|---|
| 63 | **Mor öneri kartı** | Merkez’in her önerisi mor kenarlı kart; sağ üstte seviyesi. | Merkez’in sesi modül içeriğiyle hiçbir zaman karışmaz. | Merkez | P1 | az |
| 64 | **Seviyeye göre onay** | Küçük: tek dokunuş + Geri al. Orta: önizleme + onay. Büyük: önce/sonra + dönüş noktası. | Kural 9: seviyeyi katalog belirler, ekran onun kalıbını giyer. | Merkez | P1 | orta |
| 65 | **Çakışma kartı** · YENİ | İki modül aynı saati isterse ikisi yan yana görünür, Merkez bir çözüm önerir. | Kimin ne istediği karışmaz; son sözü kullanıcı söyler. | Merkez | P1 | orta |
| 66 | **Önce / sonra görünümü** | Yalnız değişen blok renkli; gerisi soluk kalır. | Değişikliğin büyüklüğü abartılmadan görülür. | Merkez | P2 | orta |
| 67 | **Gerekçe çubuğu** | Sayı koddan gelir ve çizilir; modelin cümlesi altında, ayrı durur. | Kural 1: sayıyı kod üretir, model yalnız cümleye çevirir. | Merkez | P1 | az |
| 68 | **Bekleyen öneri rozeti** · YENİ | Üst çubukta mor sayaç; açılınca öneriler modüllerine göre sıralı. | Öneriler işi bölmez, sırasını bekler. | Merkez | P2 | az |
| 69 | **Otomatik uygula ayarı** · YENİ | Küçük türlerin sormadan uygulanıp uygulanmayacağı tür tür anahtar; orta ve büyük hep sorar. | Kural 9: hangi küçük türün sormadan uygulanacağını kullanıcı seçer. | Merkez | P1 | az |
| 70 | **Geri dönüş noktaları** · YENİ | Büyük aksiyonlardan önce alınan kayıtlar; birine tek düğmeyle dönülür. | Büyük değişiklik geri dönüşsüz olamaz. | Merkez | P2 | orta |
| 71 | **Bağlantı noktası** | «Merkez bağlı · 14:08». Kapalıyken gri: «her şey çalışıyor». | Kural 4: Merkez kapalıyken hiçbir modül bozulmaz; ekran da panik yapmaz. | Merkez | P1 | az |
| 72 | **Öneri geçmişi** | Uygulanan, geçilen, geri alınan öneriler; her biri tek satır. | Merkez’in ne önerdiği ve kullanıcının ne seçtiği izlenebilir. | Merkez | P3 | az |

## G · Ofis ve ajanlar (6)

_cümle ajandan, sayı koddan_

| # | Özellik | Ne yapar | Neden | Modül | Önc. | Emek |
|---|---|---|---|---|---|---|
| 73 | **Masa görünümü** | Konuşan ajan büyür ve renklenir; diğerleri soluk bekler. | Kimin konuştuğu ilk bakışta belli. | hepsi | P2 | az |
| 74 | **Balondaki sayı çipi** | Ajan cümlesindeki sayı çip olarak görünür ve kaynağını taşır. | Cümle yorum, çip gerçek: ikisi karışmaz. | hepsi | P1 | az |
| 75 | **Ajan sınır kartı** · YENİ | Ajan profili iki sütun: ne yapar, ne yapmaz. | Kural 5: sınırlar ilk bakışta belli; kullanıcı yanlış şey beklemez. | hepsi | P2 | az |
| 76 | **Devir göstergesi** · YENİ | Bir ajan konuyu diğerine aktarınca kesik çizgiyle gösterilir. | Konuşmanın ortasında ses değişirse kullanıcı nedenini bilir. | hepsi | P3 | az |
| 77 | **Ajan durum halkası** | Portrenin çevresinde ince halka: dönen, sabit ya da yok. | Ajanın çalışıp çalışmadığı yazı okumadan görülür. | hepsi | P3 | az |
| 78 | **Hazır cevap çipleri** | Balonun altında iki üç kısa cevap. | Yazmadan konuşma sürer; mobilde özellikle. | hepsi | P2 | az |

## H · Seviye ve rütbe (6)

_yalnız görünürlük, karar yok_

| # | Özellik | Ne yapar | Neden | Modül | Önc. | Emek |
|---|---|---|---|---|---|---|
| 79 | **Rütbe halkası** | Rütbe görseli, çevresinde XP halkası. | Seviye görünür ama ekranın merkezine oturmaz. | hepsi | P2 | az |
| 80 | **XP dökümü** · YENİ | Bugünkü XP nereden geldi: soru, blok, günü kaydetme. | Kural 6: XP görünürdür ama hiçbir karara girmez; döküm bunu açık eder. | hepsi | P3 | az |
| 81 | **Kademe yolu** · YENİ | Altı kademe tek yolda: Bronz’dan Kutsal’a; bulunduğun yer yanar. | Bir sonraki kademe somut; ad ve renk tek kaynaktan gelir. | hepsi | P3 | az |
| 82 | **Sakin seviye atlama** | Kısa bir parlama; ekranı kapatmaz, işi bölmez. | Seviye bir ödül anı ama işin önüne geçmemeli. | hepsi | P3 | az |
| 83 | **Sistem başına rütbe** | Her sistemin kendi rütbesi; çerçevesi modül renginde. | Kural 6: her sistemin kendi seviyesi var; tanım ortak. | hepsi | P2 | az |
| 84 | **Rütbe galerisi** | Kazanılan kademeler renkli, kilitliler siluet. | XP yalnız burada ve üst çubukta görünür; başka ekrana sızmaz. | hepsi | P3 | az |

## I · Hareket (6)

_her hareket bir anlam taşır_

| # | Özellik | Ne yapar | Neden | Modül | Önc. | Emek |
|---|---|---|---|---|---|---|
| 85 | **Sayı yuvarlanması** | Değer değişince rakam yukarı kayar. | Değişen sayı gözden kaçmaz. | hepsi | P2 | az |
| 86 | **Geri al geri sayımı** | «Geri al» şeridinin altında incelen çizgi. | Geri almanın ne kadar süresi kaldığı görünür olmalı. | hepsi | P1 | az |
| 87 | **Şimdi çizgisi** | Çizelgede ilerleyen ince çizgi; geçmiş saatler taralı. | Günün neresinde olduğun saat okumadan görülür. | hepsi | P2 | az |
| 88 | **Tik çizimi** · YENİ | İş bitince tik çizilerek belirir, satır yavaşça soluklaşır. | Bitirme anı küçük ama hissedilir. | hepsi | P2 | az |
| 89 | **Kart açılma geçişi** · YENİ | Kart yerinde büyüyerek ayrıntıya dönüşür. | Kullanıcı nereden geldiğini unutmaz; geri dönüş doğal olur. | hepsi | P2 | orta |
| 90 | **Küçülen başlık** · YENİ | Kaydırınca büyük başlık üst çubuğa küçülerek yerleşir. | Ekran alanı açılır ama bağlam kaybolmaz. | hepsi | P3 | az |

## J · Mobil ve erişilebilirlik (6)

_390 piksel ve renk körlüğü_

| # | Özellik | Ne yapar | Neden | Modül | Önc. | Emek |
|---|---|---|---|---|---|---|
| 91 | **Başparmak bölgesi** | Mobilde ana eylem ekranın alt üçte birinde; gezinme alt sekme çubuğuna iner. | Günde onlarca kez tek elle kullanılır. | hepsi | P2 | orta |
| 92 | **Kaydırarak işaretle** · YENİ | Satırı sağa kaydır: bitti; sola: ertele. | Mobilde en sık iki eylem tek hareket olur. | hepsi | P2 | orta |
| 93 | **Alt çekmece** · YENİ | Mobilde ayrıntı alttan yarım ekran açılır; çekince tam ekran. | Liste kaybolmaz; çekmece tek elle kapanır. | hepsi | P2 | orta |
| 94 | **Sabit etiketli kaydırma** | Şerit yana kayar, modül etiketi solda sabit kalır. | Dar ekranda da hangi şeridin kime ait olduğu kaybolmaz. | hepsi | P2 | az |
| 95 | **Bildirim kartı** · YENİ | Telefon bildirimi: modül rengi, tek cümle, iki eylem. | Uygulamayı açmadan karar verilir. | hepsi | P2 | orta |
| 96 | **Renksiz de ayırt edilir** | Modül = renk + harf + şekil: daire, kare, üçgen. | Renk körü kullanıcı da kategorileri karıştırmaz. | hepsi | P1 | az |

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
