/* GÜNLÜK PARAGRAF HAVUZU — core/paragraf.js'in soruları.

   Kullanıcı (2026-10-10): «paragrafta soru sayısı az; soru sayısını
   arttır». Konu soruları (data/anlatim-tr.js, data/derin-tr.js) her
   paragraf konusunda sekiz soruyla sınırlı; paragraf ise dokuz ay her gün
   çalışılan bir beceri. Bu havuz günlük setin kaynağıdır.

   KAYNAK VE DOĞRULUK: anlatım dosyalarıyla aynı. Paragrafların hepsi
   LifeOS'un geliştirme oturumunda (Claude) özgün olarak yazıldı; bir
   kitaptan ya da ÖSYM'den alıntı değildir. Her soru yazılırken çözüldü,
   sonra dökülüp yeniden çözüldü. Ekranda «elle yazıldı · doğrulanmadı»
   yazar. Tanık gösterme sorularında yalnız kaynağı bilinen gerçek sözler
   kullanıldı.

   BİÇİM: R.PARAGRAF_HAVUZU = [{
     id:     'p001'…   kalıcı kimlik; bir kez verilir, başka soruya verilmez
     konu:   'tr-05'…'tr-09'
     seviye: 'orta' | 'ileri'      yazarın değerlendirmesi, ölçüm değil
     soru:   paragraf + '\n' + kök (sıralama sorusunda cümleler + '\n' + kök)
     sec:    [beş seçenek], dogru:'A'–'E', ipucu, cozum:[adım, …]
     yenilendi?: ISO zaman — soru yerinde düzeltildiyse (core/ogren.js söz 5)
   }]
   Biçimi, harf dağılımını ve kimliklerin tekliğini tests/paragraf.test.js
   sınar. */

window.R = window.R || {};

R.PARAGRAF_HAVUZU = [
  /* ---------- tr-05 · konu, ana düşünce, başlık ---------- */
  { id:'p001', konu:'tr-05', seviye:'orta',
    soru:'Bir şehirde yaşlı ağaçlar kesildiğinde yalnızca gölge kaybolmaz. O ağacın altında buluşan komşular, dallarına salıncak kuran çocuklar, her bahar aynı çiçeği bekleyen yaşlılar da bir alışkanlığını yitirir. Yeni dikilen fidanlar yıllar sonra boy atsa bile kesilen ağacın biriktirdiği anılar geri gelmez. Bu yüzden şehirlerde ağaç, bir süs öğesi değil, ortak hafızanın bir parçası olarak korunmalıdır.\nBu parçada asıl anlatılmak istenen aşağıdakilerden hangisidir?',
    sec:['Şehirlerdeki yaşlı ağaçlar ortak hafızanın parçası olarak korunmalıdır.', 'Yeni dikilen fidanlar kısa sürede büyür.', 'Ağaçlar yalnızca gölge sağladıkları için değerlidir.', 'Çocuklar parklarda daha çok vakit geçirmelidir.', 'Şehir planlamasında yeşil alanlar ikinci plandadır.'], dogru:'A',
    ipucu:'«Bu yüzden» ile başlayan son cümleye bak.',
    cozum:['Paragraf kesilen ağacın gölgeyle birlikte anıları da götürdüğünü anlatır.', 'Son cümle «bu yüzden» ile asıl düşünceyi verir: ağaç ortak hafızanın parçasıdır.', 'C paragrafın karşı çıktığı görüştür; B ona aykırıdır, D ve E parçada yoktur.'] },
  { id:'p002', konu:'tr-05', seviye:'orta',
    soru:'Kuşlar göç ederken yollarını nasıl bulur? Araştırmalar bazı türlerin Güneş’in konumundan, bazılarının yıldızlardan yararlandığını gösteriyor. Güvercinler gibi kimi kuşlar ise Dünya’nın manyetik alanını algılayabiliyor. Genç kuşlar ilk göçlerinde deneyimli kuşları izleyerek rotayı öğreniyor. Yani kuşların yön bulması tek bir yeteneğe değil, birkaç yöntemin birlikte kullanılmasına dayanıyor.\nBu parçaya en uygun başlık aşağıdakilerden hangisidir?',
    sec:['Güvercinlerin Yaşamı', 'Yıldızların Hareketi', 'Göçün Nedenleri', 'Kuşlar Yollarını Nasıl Bulur?', 'Dünya’nın Manyetik Alanı'], dogru:'D',
    ipucu:'Başlık bütün cümleleri kapsamalı; tek bir yöntemi değil.',
    cozum:['Paragraf kuşların göç sırasında yön bulma yollarını sıralar ve bunların birlikte kullanıldığını söyler.', 'A ve E tek bir ayrıntıya dayanır, B ilgisizdir; C’deki «nedenler» parçada anlatılmaz.'] },
  { id:'p003', konu:'tr-05', seviye:'orta',
    soru:'Birçok insan yeteneği doğuştan gelen ve değişmeyen bir şey sanır: ya vardır ya yoktur. Bu yüzden ilk denemede başaramadığı bir işi «bana göre değil» diyerek bırakır. Oysa usta bir piyanistin parmakları da bir satranç ustasının hamleleri de binlerce saatlik çalışmanın ürünüdür. Yetenek bir başlangıç noktası olabilir ama ustalığı belirleyen, düzenli ve bilinçli çalışmadır.\nBu parçada vurgulanmak istenen düşünce aşağıdakilerden hangisidir?',
    sec:['Piyano çalmak satranç oynamaktan zordur.', 'Yetenek doğuştan gelir ve değiştirilemez.', 'Ustalık, yetenekten çok düzenli ve bilinçli çalışmayla kazanılır.', 'İlk denemede başaramayan kişi o işi bırakmalıdır.', 'Ustalar çalışmadan da başarılı olur.'], dogru:'C',
    ipucu:'«Oysa»dan sonra gelen yazarın görüşüdür.',
    cozum:['İlk iki cümle yaygın bir yanlış inancı aktarır.', '«Oysa» ile yazar kendi görüşünü verir: ustalığı çalışma belirler.', 'B ve D yazarın eleştirdiği görüşlerdir; A ve E parçada yoktur.'] },
  { id:'p004', konu:'tr-05', seviye:'orta',
    soru:'Eskiden bir fotoğraf çekmeden önce uzun uzun düşünülürdü; makinedeki film sınırlıydı ve her karenin bir bedeli vardı. Basılan fotoğraflar albümlere yerleştirilir, yıllar sonra bile aile toplantılarında elden ele dolaşırdı. Bugün ise telefonlarımızda binlerce fotoğraf var ama çoğuna bir daha bakmıyoruz. Görüntü bolluğu, tek tek görüntülerin değerini azalttı.\nBu parçanın konusu aşağıdakilerden hangisidir?',
    sec:['Fotoğraf makinelerinin teknik gelişimi', 'Aile albümlerinin düzenlenmesi', 'Telefonların bellek kapasitesi', 'Film banyosu yöntemleri', 'Fotoğraf sayısının artmasının fotoğraflara verilen değere etkisi'], dogru:'E',
    ipucu:'Paragraf eski ve yeni durumu neden karşılaştırıyor?',
    cozum:['Paragraf film dönemini bugünkü telefon fotoğrafçılığıyla karşılaştırır.', 'Son cümle varılan yeri söyler: bolluk, tek tek fotoğrafların değerini azalttı.', 'A ve C teknik ayrıntıdır; B ve D parçada anlatılmaz.'] },
  { id:'p005', konu:'tr-05', seviye:'ileri',
    soru:'İyi bir dinleyici olmak, iyi bir konuşmacı olmaktan daha zordur. Konuşurken sözü biz yönetiriz; dinlerken ise kendi düşüncemizi bir kenara bırakıp karşımızdakini anlamaya çalışırız. Çoğumuz karşımızdaki konuşurken aslında ona ne cevap vereceğimizi düşünürüz. Gerçek dinleme, sabır ve dikkat isteyen, öğrenilmesi gereken bir beceridir.\nBu parçada asıl anlatılmak istenen aşağıdakilerden hangisidir?',
    sec:['İyi konuşmacılar her zaman iyi dinleyicidir.', 'Gerçek dinleme, konuşmaktan zor ve öğrenilmesi gereken bir beceridir.', 'Konuşurken karşımızdakinin sözünü kesmemeliyiz.', 'Sabırlı insanlar az konuşur.', 'Herkes doğuştan iyi bir dinleyicidir.'], dogru:'B',
    ipucu:'İlk ve son cümle aynı düşünceyi iki uçtan söylüyor.',
    cozum:['İlk cümle dinlemenin konuşmaktan zor olduğunu, son cümle öğrenilmesi gereken bir beceri olduğunu söyler.', 'B ikisini birlikte karşılar; A, C, D ve E parçada yoktur ya da ona aykırıdır.'] },

  /* ---------- tr-06 · yardımcı düşünce ---------- */
  { id:'p006', konu:'tr-06', seviye:'orta',
    soru:'Van Gölü, Türkiye’nin en büyük gölüdür. Suyu sodalı olduğu için içilemez ve tarımda kullanılamaz. Bu sert koşullara uyum sağlamış tek balık türü inci kefalidir; her ilkbaharda göle dökülen akarsulara geçerek yumurtlar. Göldeki Akdamar Adası’nda 10. yüzyıldan kalma bir kilise bulunur.\nBu parçada Van Gölü ile ilgili aşağıdakilerden hangisine değinilmemiştir?',
    sec:['Suyunun özelliğine', 'Gölde yaşayan balık türüne', 'Gölün derinliğine', 'Göldeki bir adaya', 'Türkiye’deki göller arasındaki yerine'], dogru:'C',
    ipucu:'Her seçeneği parçada bir cümleyle eşleştir.',
    cozum:['A: sodalı su; B: inci kefali; D: Akdamar Adası; E: en büyük göl.', 'Gölün derinliğinden hiç söz edilmez.'] },
  { id:'p007', konu:'tr-06', seviye:'orta',
    soru:'Bal arıları kovanda iş bölümüyle yaşar. Genç işçi arılar önce kovanın içinde temizlik yapar, larvaları besler; büyüdükçe kovanın girişini korumaya, en sonunda da çiçeklerden nektar ve polen toplamaya başlar. Kovanda tek bir kraliçe arı bulunur ve onun tek görevi yumurtlamaktır. Erkek arılar ise bal yapımına katılmaz.\nBu parçaya göre bal arılarıyla ilgili aşağıdakilerden hangisi söylenemez?',
    sec:['İşçi arıların görevleri yaşlarına göre değişir.', 'Kovanda bir kraliçe arı bulunur.', 'Kraliçe arının görevi yumurtlamaktır.', 'Erkek arılar bal yapımına katılmaz.', 'Kraliçe arı nektar toplamaya da katılır.'], dogru:'E',
    ipucu:'«Tek görevi» sözüne dikkat et.',
    cozum:['A, B, C ve D parçada açıkça yer alır.', 'Kraliçenin tek görevinin yumurtlamak olduğu söylenir; E bununla çelişir.'] },
  { id:'p008', konu:'tr-06', seviye:'orta',
    soru:'Lale, Osmanlı’da o kadar sevilmişti ki 18. yüzyılın başındaki bir döneme adını verdi. Ancak lale aslında Orta Asya’nın dağlık bölgelerinde yabani olarak yetişen bir çiçektir. Avrupa’ya 16. yüzyılda İstanbul’dan götürüldü; Hollanda’da öyle rağbet gördü ki bazı lale soğanları bir ev fiyatına satıldı.\nBu parçaya göre aşağıdakilerden hangisi doğrudur?',
    sec:['Lale, Avrupa’ya İstanbul üzerinden ulaşmıştır.', 'Lalenin anavatanı Hollanda’dır.', 'Lale Devri 16. yüzyılda yaşanmıştır.', 'Lale yalnızca saray bahçelerinde yetiştirilmiştir.', 'Hollanda’da lale soğanları ucuza satılmıştır.'], dogru:'A',
    ipucu:'Seçeneklerdeki yer ve yüzyılları parçayla karşılaştır.',
    cozum:['Parça lalenin Avrupa’ya 16. yüzyılda İstanbul’dan götürüldüğünü söyler: A doğrudur.', 'B anavatanla (Orta Asya), C yüzyılla (18.), E fiyatla çelişir; D parçada yoktur.'] },
  { id:'p009', konu:'tr-06', seviye:'orta',
    soru:'Kardeşim her akşam yemekten sonra masasına oturur, gün içinde öğrendiklerini kısa notlar hâlinde deftere geçirir. Hafta sonları bu notları baştan okur, anlamadığı yerlerin yanına soru işareti koyar. Pazartesi sabahı ilk iş, o soru işaretlerini öğretmenine sorar.\nBu parçadan kardeşle ilgili aşağıdakilerden hangisine ulaşılabilir?',
    sec:['Derslerinde hiç zorlanmaz.', 'Öğretmenini sık sık eleştirir.', 'Hafta sonları ders çalışmayı sevmez.', 'Öğrendiklerini düzenli olarak tekrar eder ve eksiklerini giderir.', 'Notlarını bilgisayarda tutar.'], dogru:'D',
    ipucu:'Kardeşin her akşam, her hafta sonu ve her pazartesi yaptıklarını bir araya getir.',
    cozum:['Her akşam not alması, hafta sonu tekrar etmesi, pazartesi sorularını sorması düzenli tekrar ve eksik gidermeyi gösterir.', 'A soru işaretleriyle çelişir; B, C ve E parçada dayanağı olmayan yargılardır.'] },
  { id:'p010', konu:'tr-06', seviye:'orta',
    soru:'Yazar, son kitabında küçük bir kıyı kasabasında geçen bir hikâye anlatıyor. Kitabın dili sade ve akıcı; diyaloglar gerçek hayattan alınmış gibi doğal. Karakterlerin geçmişi olaylar ilerledikçe parça parça açığa çıkıyor ve okuru sona kadar meraklı tutuyor. Kitabın sonunda yazar, kasabanın gerçekte var olmadığını, birkaç yerden esinlenerek kurgulandığını söylüyor.\nBu parçada kitapla ilgili aşağıdakilerden hangisine değinilmemiştir?',
    sec:['Hikâyenin geçtiği yere', 'Kitabın kaç sayfa olduğuna', 'Dilinin özelliğine', 'Karakterlerin geçmişinin nasıl anlatıldığına', 'Kasabanın gerçek olup olmadığına'], dogru:'B',
    ipucu:'Parçada bir sayı ya da uzunluk bilgisi geçiyor mu?',
    cozum:['A: kıyı kasabası; C: sade ve akıcı dil; D: parça parça açığa çıkan geçmiş; E: kasabanın kurgu olması.', 'Kitabın uzunluğundan söz edilmez.'] },

  /* ---------- tr-07 · yapı ve akış ---------- */
  { id:'p011', konu:'tr-07', seviye:'orta',
    soru:'(I) Türk kahvesi, cezvede kısık ateşte pişirilen ve telvesiyle birlikte sunulan bir içecektir. (II) Kahvenin köpüğü ustalığın en önemli göstergesi sayılır. (III) Yanında genellikle bir bardak su ve lokum ikram edilir. (IV) Kahve bitkisi en iyi tropikal iklimlerde, yüksek yamaçlarda yetişir. (V) 2013’te UNESCO, Türk kahvesi kültürünü ve geleneğini İnsanlığın Somut Olmayan Kültürel Mirası listesine aldı.\nBu parçada numaralanmış cümlelerden hangisi düşüncenin akışını bozmaktadır?',
    sec:['I', 'II', 'III', 'IV', 'V'], dogru:'D',
    ipucu:'Paragraf Türk kahvesinin hazırlanışını ve kültürünü anlatıyor.',
    cozum:['I, II, III ve V Türk kahvesinin pişirilmesi, sunumu ve kültürel değeriyle ilgilidir.', 'IV konuyu kahve bitkisinin yetiştiği iklime kaydırır.'] },
  { id:'p012', konu:'tr-07', seviye:'orta',
    soru:'(I) Kutup ayıları, Kuzey Kutbu’nun buzlarla kaplı denizlerinde yaşayan en büyük kara yırtıcılarıdır. (II) Kalın yağ tabakaları ve yoğun kürkleri onları dondurucu soğuğa karşı korur. (III) Ancak iklim değişikliği bu hayvanların yaşamını giderek zorlaştırıyor. (IV) Deniz buzları her yıl daha geç oluşup daha erken eridiği için avlanmak için buza muhtaç olan ayılar uzun süre aç kalıyor. (V) Bilim insanları bu gidişin sürmesi hâlinde bazı toplulukların yüzyılın sonuna kadar yok olabileceğini belirtiyor.\nBu parça iki paragrafa ayrılmak istense ikinci paragraf hangi cümleyle başlar?',
    sec:['II', 'III', 'IV', 'V', 'Bölünemez'], dogru:'B',
    ipucu:'Konunun tanıtımdan soruna geçtiği cümleyi ara.',
    cozum:['I ve II kutup ayılarını ve soğuğa uyumlarını tanıtır.', 'III «ancak» ile konuyu iklim değişikliğinin yarattığı soruna çevirir; IV ve V bu sorunu sürdürür.'] },
  { id:'p013', konu:'tr-07', seviye:'orta',
    soru:'Bir köprü inşa edilirken mühendisler yalnızca üzerinden geçecek araçların ağırlığını hesaplamaz. ---- Bu yüzden köprüler, beklenen en ağır yükün birkaç katını taşıyabilecek biçimde tasarlanır.\nBu parçada boş bırakılan yere aşağıdakilerden hangisi getirilmelidir?',
    sec:['Köprülerin çoğu çelikten yapılır.', 'İstanbul’daki köprüler dünyanın en uzunları arasındadır.', 'Köprü inşaatı yıllarca sürebilir.', 'Mühendislik fakültelerinde köprü tasarımı ayrı bir derstir.', 'Rüzgâr, deprem ve sıcaklık değişimi gibi beklenmedik yükleri de göz önünde bulundurur.'], dogru:'E',
    ipucu:'«Yalnızca … değil» diye başlayan düşünceyi tamamlayan ve «bu yüzden»e gerekçe olan cümle.',
    cozum:['Önceki cümle «yalnızca araçların ağırlığını hesaplamaz» der; boşluğa başka hangi yüklerin hesaplandığı gelmeli.', 'Sonraki cümle «bu yüzden» ile yükün katlarını taşıyacak tasarımı açıklar: E iki bağı da kurar.'] },
  { id:'p014', konu:'tr-07', seviye:'ileri',
    soru:'I. Bu sorunu çözmek için bazı şehirler, okul bahçelerini hafta sonları halka açmaya başladı. II. Büyük şehirlerde çocukların oynayabileceği açık alanlar her geçen yıl azalıyor. III. Böylece hem boş duran alanlar değerlendirildi hem de mahalleli yeni bir buluşma yeri kazandı. IV. Arsalar binalarla doluyor, parklar ise kalabalık ve uzak kalıyor.\nBu cümlelerle anlamlı bir paragraf oluşturulmak istendiğinde sıralama nasıl olmalıdır?',
    sec:['II – IV – I – III', 'II – I – IV – III', 'IV – II – I – III', 'II – IV – III – I', 'I – II – IV – III'], dogru:'A',
    ipucu:'Bağlayıcısız cümle başa; «bu sorunu» ve «böylece» önceki cümleye bağlanır.',
    cozum:['II konuyu açar; IV sorunu ayrıntılandırır.', 'I «bu sorunu» ile çözümü, III «böylece» ile sonucu verir: II – IV – I – III.'] },
  { id:'p015', konu:'tr-07', seviye:'ileri',
    soru:'Hayatımızı hızlandıran pek çok araç kullanıyoruz: yemeği dakikalar içinde hazırlıyor, mesajı saniyeler içinde gönderiyor, şehirler arasını birkaç saatte geçiyoruz. Ne var ki kazandığımız zamanı çoğu zaman yeni işlerle dolduruyor, hiçbir şeyin tadına varamıyoruz. Yürürken çevreye bakmak, yemeği acele etmeden yemek, bir kitabı yavaş yavaş okumak bize unuttuğumuz bir şeyi hatırlatıyor. ----\nBu parçanın sonuna düşüncenin akışına göre aşağıdakilerden hangisi getirilmelidir?',
    sec:['Örneğin hızlı trenler şehirler arasındaki mesafeyi kısalttı.', 'Teknoloji her geçen gün daha da gelişiyor.', 'Kısacası yavaşlamak, hayatı daha derinden yaşamanın yoludur.', 'Bu yüzden daha çok işi aynı anda yapmayı öğrenmeliyiz.', 'Mesajlaşma uygulamaları iletişimi kolaylaştırdı.'], dogru:'C',
    ipucu:'Sonuç cümlesi paragrafın vardığı yeri özetler; «kısacası, demek ki» gibi sözlerle gelebilir.',
    cozum:['Paragraf hızın kazandırdığı zamanın tadını çıkaramadığımızı ve yavaşlamanın değerini anlatır.', 'C bu düşünceyi özetler; D paragrafın tersini savunur; A, B ve E ayrıntıya ya da başka konuya kayar.'] },

  /* ---------- tr-08 · anlatım biçimleri ve düşünceyi geliştirme ---------- */
  { id:'p016', konu:'tr-08', seviye:'orta',
    soru:'Bir toplumun ilerlemesi, bilime verdiği değerle doğru orantılıdır. Atatürk’ün «Hayatta en hakiki mürşit ilimdir.» sözü de bu düşünceyi dile getirir. Bilimsel düşünceyi benimseyen toplumlar sorunlarına kanıta dayalı çözümler üretirken, bilimi önemsemeyenler aynı hataları tekrarlamaktan kurtulamaz.\nBu parçada düşünceyi desteklemek için aşağıdakilerden hangisine başvurulmuştur?',
    sec:['Sayısal verilere', 'Benzetmeye', 'Örneklendirmeye', 'Tanımlamaya', 'Tanık göstermeye'], dogru:'E',
    ipucu:'Paragrafta birinin sözü aktarılıyor mu?',
    cozum:['Düşünceyi güçlendirmek için Atatürk’ün sözü aktarılmıştır: tanık gösterme.', 'Sayı, benzetme, örnek ya da tanım kullanılmamıştır.'] },
  { id:'p017', konu:'tr-08', seviye:'orta',
    soru:'Kapıyı araladığında içerideki sessizlik onu ürküttü. Ayakkabılarını çıkarıp parmak uçlarında koridora ilerledi. Mutfaktan gelen ince bir ışığa doğru yürüdü, kapının önünde bir an durdu. Derin bir nefes aldı ve kapıyı itti: masada, üzerinde mumlar yanan bir pasta duruyordu.\nBu parçada ağır basan anlatım biçimi aşağıdakilerden hangisidir?',
    sec:['Açıklama', 'Öyküleme', 'Tartışma', 'Betimleme', 'Tanımlama'], dogru:'B',
    ipucu:'Zaman içinde ilerleyen eylemler mi var, durağan bir görüntü mü?',
    cozum:['Parçada art arda eylemler vardır: araladı, ilerledi, yürüdü, durdu, itti.', 'Olay zaman içinde ilerlediği için öyküleme ağır basar; küçük betimleme ayrıntıları olaya hizmet eder.'] },
  { id:'p018', konu:'tr-08', seviye:'ileri',
    soru:'Bir araştırmaya göre düzenli kitap okuyan öğrencilerin okuduğunu anlama puanları, okumayanlarınkinden ortalama yüzde yirmi daha yüksek. Okumak beyni bir kas gibi çalıştırır: kullandıkça güçlenir, ihmal edildikçe zayıflar. Örneğin her gün yarım saat okuyan bir öğrenci, bir yıl içinde onlarca kitabın dünyasına girmiş olur. Ekran başında geçirilen saatler ise çoğu zaman bu kası dinlendirmekten öteye geçmez.\nBu parçada aşağıdaki düşünceyi geliştirme yollarından hangisi kullanılmamıştır?',
    sec:['Sayısal verilerden yararlanma', 'Benzetme', 'Karşılaştırma', 'Tanık gösterme', 'Örneklendirme'], dogru:'D',
    ipucu:'Her yolu bir cümleyle eşleştir; birinin sözü aktarılmış mı?',
    cozum:['«Yüzde yirmi»: sayısal veri; «beyni bir kas gibi»: benzetme; «Örneğin…»: örneklendirme; okuyan–okumayan ve kitap–ekran: karşılaştırma.', 'Kimsenin sözü aktarılmamıştır: tanık gösterme yoktur.'] },
  { id:'p019', konu:'tr-08', seviye:'orta',
    soru:'Biyoçeşitlilik, bir bölgede yaşayan canlı türlerinin, bu türlerin genetik farklılıklarının ve oluşturdukları ekosistemlerin bütünüdür. Bir ormandaki ağaçlardan topraktaki mikroskobik canlılara kadar her tür bu zenginliğin bir parçasıdır.\nBu parçada ağırlıklı olarak hangi düşünceyi geliştirme yolu kullanılmıştır?',
    sec:['Tanımlama', 'Tanık gösterme', 'Sayısal verilerden yararlanma', 'Karşılaştırma', 'Benzetme'], dogru:'A',
    ipucu:'İlk cümle bir kavramın ne olduğunu mu söylüyor?',
    cozum:['İlk cümle biyoçeşitliliğin ne olduğunu açıklar: tanımlama.', 'İkinci cümle tanımı somutlaştırır; sayı, aktarılan söz, karşılaştırma ya da benzetme yoktur.'] },
  { id:'p020', konu:'tr-08', seviye:'ileri',
    soru:'Bazıları ödevlerin öğrencilerin serbest zamanını çaldığını ve kaldırılması gerektiğini savunuyor. Oysa iyi tasarlanmış bir ödev, sınıfta öğrenilenin pekişmesini sağlar ve öğrenciye kendi başına çalışma alışkanlığı kazandırır. Sorun ödevin kendisi değil, niteliksiz ve aşırı ödevdir. Bu yüzden ödevler kaldırılmamalı, azaltılıp anlamlı hâle getirilmelidir.\nBu parçanın anlatımıyla ilgili aşağıdakilerden hangisi söylenebilir?',
    sec:['Bir olay zaman sırasıyla anlatılmıştır.', 'Bir yer, duyulara seslenen ayrıntılarla betimlenmiştir.', 'Karşı görüşe yer verilip bu görüş çürütülmeye çalışılmıştır.', 'Bilimsel bir kavram tanımlanmıştır.', 'Bir kişinin anıları aktarılmıştır.'], dogru:'C',
    ipucu:'«Bazıları … savunuyor. Oysa …» kalıbı neyi gösterir?',
    cozum:['Yazar önce ödevlerin kaldırılmasını savunan görüşü aktarır, «oysa» ile karşı çıkar.', 'Kendi görüşünü gerekçelendirip bir sonuca bağlar: tartışmacı anlatım.'] },

  /* ---------- tr-09 · çıkarım ve yorum ---------- */
  { id:'p021', konu:'tr-09', seviye:'orta',
    soru:'Kasabanın tek sinemasında film gösterilen akşamlarda salon tıklım tıklım dolardı. Gösterimden sonra insanlar sokaklarda gruplar hâlinde yürür, filmi saatlerce tartışırdı. Sinema kapandıktan sonra kasabanın akşamları sessizleşti; herkes evine erken çekilmeye başladı.\nBu parçadan aşağıdakilerden hangisi çıkarılabilir?',
    sec:['Kasabada birden çok sinema vardı.', 'Sinema, kasaba halkının bir araya gelmesinde önemli bir rol oynuyordu.', 'Sinemada yalnızca yabancı filmler gösterilirdi.', 'Kasaba halkı sinemanın kapanmasını istemişti.', 'Sinema kapandıktan sonra kasabaya yeni bir sinema açıldı.'], dogru:'B',
    ipucu:'Sinemanın kapanmasından sonra kasabada ne değişti?',
    cozum:['Gösterimden sonraki tartışmalar ve kapanıştan sonra akşamların sessizleşmesi, sinemanın insanları bir araya getirdiğini gösterir.', 'A «tek sinema» ile çelişir; C, D ve E dayanaksızdır.'] },
  { id:'p022', konu:'tr-09', seviye:'ileri',
    soru:'Belediyenin «yeşil şehir» projesi kapsamında caddeye dikilen fidanların yarısı daha ilk yaz bitmeden kurudu. Sulama planı yapılmamış, fidanların yerleri bile asfaltın ortasında, dar beton kutuların içinde seçilmişti. Açılış töreninde çekilen fotoğraflar ise hâlâ belediyenin internet sitesinde, özenle seçilmiş bir başlıkla duruyor.\nBu parçanın yazarının belediyenin projesine karşı tutumu aşağıdakilerden hangisidir?',
    sec:['Övgü dolu', 'Kayıtsız', 'Umutlu', 'Tarafsız ve bilgilendirici', 'Eleştirel ve alaycı'], dogru:'E',
    ipucu:'Son cümledeki «özenle seçilmiş bir başlık» ayrıntısı neden verilmiş?',
    cozum:['Yazar projenin plansızlığını (sulama yok, beton kutular) eleştirir.', 'Kuruyan fidanlara karşın fotoğrafların «özenle» sergilenmesini vurgulaması alay içerir: eleştirel ve alaycı.'] },
  { id:'p023', konu:'tr-09', seviye:'ileri',
    soru:'Dokuma tezgâhında çalışan usta, ipliğin rengini seçerken pencereden gelen gün ışığına bakardı. Akşam lambası altında seçilen renklerin sabah bambaşka görünebileceğini çıraklarına sık sık söylerdi. Bu yüzden atölyede renk işleri hep öğleden önce yapılırdı.\nBu parçadan aşağıdakilerden hangisi çıkarılamaz?',
    sec:['Usta akşamları çalışmayı sevmezdi.', 'Usta, rengin ışığa göre farklı görünebileceğini biliyordu.', 'Atölyede renk seçimi için gün ışığı tercih edilirdi.', 'Usta deneyimlerini çıraklarıyla paylaşırdı.', 'Atölyedeki bazı işler günün belli saatlerine göre düzenlenirdi.'], dogru:'A',
    ipucu:'Ustanın akşam çalışmakla ilgili bir duygusu parçada söyleniyor mu?',
    cozum:['B, C, D ve E parçadaki renk–ışık ilişkisinden ve öğleden önceki düzenden çıkar.', 'Ustanın akşam çalışmayı sevip sevmediğine dair bir bilgi yoktur: A çıkarılamaz.'] },
  { id:'p024', konu:'tr-09', seviye:'ileri',
    soru:'Bir okulda öğrencilerin yarısından her derse başlamadan önce iki dakika boyunca o gün işlenecek konuyla ilgili ne bildiklerini yazmaları istendi; öbür yarısı derse doğrudan başladı. Dönem sonunda yapılan sınavda ders öncesi yazan grubun başarısı belirgin biçimde daha yüksek çıktı. İki grubun ders saatleri, öğretmenleri ve kitapları aynıydı.\nBu parçadan aşağıdakilerden hangisi çıkarılabilir?',
    sec:['Öğretmenler ders öncesi yazan gruba daha çok ödev vermiştir.', 'Sınav, ders öncesi yazan grup için daha kolay hazırlanmıştır.', 'Derse başlamadan önce konuyla ilgili bilinenleri hatırlamak öğrenmeyi olumlu etkileyebilir.', 'Ders kitapları başarıyı hiç etkilemez.', 'Bütün öğrenciler yazarak daha iyi öğrenir.'], dogru:'C',
    ipucu:'İki grup arasındaki tek fark neydi?',
    cozum:['Ders saati, öğretmen ve kitap aynı olduğuna göre fark, ders öncesi yazma etkinliğinden kaynaklanmış olabilir.', 'A ve B dayanaksızdır; D ve E aşırı genellemedir.'] },
  { id:'p025', konu:'tr-09', seviye:'orta',
    soru:'Gençliğimde bir şeyi bilmediğimi söylemek bana küçük düşmek gibi gelirdi; anlamadığım konularda bile başımı sallar, anlamış gibi yapardım. Yıllar içinde fark ettim ki «bilmiyorum» demek, öğrenmeye açılan ilk kapıdır. Şimdi bir konuyu bilmediğimde bunu rahatça söylüyor, karşımdakine soru sormaktan çekinmiyorum.\nBu parçanın yazarıyla ilgili aşağıdakilerden hangisi söylenebilir?',
    sec:['Gençliğinde çok kitap okumuştur.', 'Bildiklerini başkalarına öğretmeyi sever.', 'Hiçbir zaman yanılmadığını düşünür.', 'Zamanla bilmediğini kabul etmeyi öğrenmiştir.', 'Soru soran insanlardan hoşlanmaz.'], dogru:'D',
    ipucu:'Yazarın gençliğindeki ve bugünkü tutumunu karşılaştır.',
    cozum:['Gençken bilmediğini saklayan yazar, yıllar içinde «bilmiyorum» demenin değerini fark etmiş ve bugün rahatça söylüyor.', 'A, B ve E dayanaksızdır; C yazarın anlattığına aykırıdır.'] },
];
