/* Aciklama metinleri tek yerde.

   Amac: ekranlarda uzun paragraflar birakmamak. Ana alan veri ve eylem
   gosterir; "bu ne ise yarar" bilgisi ⓘ ipuclarina tasinir.
   t = baslik (2-4 kelime), b = kisa aciklama (bir cumle), more = detay. */

window.ESP = window.ESP || {};

ESP.HINTS = {

  /* --- gunluk --- */
  'next-action':{ t:'Sıradaki iş', b:'Ne yapacağını düşünmeden başlaman için tek bir öncelik gösterilir.',
    more:'Sıra sabittir ve ESP.PRECEDENCE ile aynıdır: tıkanmış temel → zamana bağlı hedef → vadesi geçmiş kart → sentez → yeni içerik. Sınırlı olan kaynak zamandır; bu sıra onu paylaştırır.' },
  'minimum-day':{ t:'Asgari gün', b:'Kötü günün alt sınırı: vadesi gelen kartlar, 10 dakika okuma, 15 dakika pratik.',
    more:'Mükemmel gün yerine hiçbir şey yapmamak seçilmesin diye vardır. Bu üçünü tutturduğun gün kayıp yoktur: unutma eğrisi durur, zincir kopmaz.' },
  'certainty':{ t:'Ölçüm kesinliği', b:'Her sayının nereden geldiği yanında yazar: ölçüldü, tahmin, hesaplandı ya da veri yok.',
    more:'Sistemin en önemli kuralının görünen yüzü: uydurulmuş sayı, ölçülmüş sayı gibi gösterilmez. «Veri yok» hiçbir zaman sıfır sayılmaz — entelektüel gelişim düzensiz ilerler ve bir haftalık boşluğu «0 performans» diye grafiğe sokmak yanlış alarm üretir.' },
  'practice-log':{ t:'Pratik kaydı', b:'Bir disiplinde geçirdiğin ölçülmüş süre. Zamanlayıcıdan ya da elle girilir.',
    more:'Elle girilen süre de «ölçüldü» sayılır: saatine bakıp yazdığın 30 dakika, tahmin değil ölçümdür. «Tahmin» etiketi öznel değerlendirmeler içindir (bugünkü çalışmam iyiydi gibi).' },
  'streak':{ t:'Seri', b:'Üst üste en az bir disiplinde pratik yapılan gün sayısı.',
    more:'Seri bir hedef değil bir gözlemdir. Kırıldığında sistem ceza vermez; yalnızca ne zaman kırıldığını söyler. Hiç girilmemiş gün seriyi kırar, «0 dakika» girilen gün de kırar — ikisi ayrı şeydir ve ayrı gösterilir.' },

  /* --- dil --- */
  'srs':{ t:'Aralıklı tekrar', b:'Bir kartı tam unutmadan hemen önce sorar; aralık her doğru cevapta uzar.',
    more:'Leitner kutularının SM-2 ile yumuşatılmış hâli. Kolay bulduğun kart daha uzun süre görünmez, zorlandığın kart başa döner. Amaç tekrar sayısını azaltmak değil, aynı hatırlamayı daha az tekrarla elde etmektir.' },
  'retention':{ t:'Retansiyon', b:'Bugün sorulsa hatırlama olasılığının ortalaması. R(t) = e^(−t/S).',
    more:'S kartın kendi kararlılığıdır ve her doğru cevapta büyür. Hiç çalışılmamış kart bu ortalamaya girmez: «veri yok» sıfır sayılmaz, yoksa bir gün ara vermek retansiyonu çökmüş gibi gösterirdi.' },
  'shadowing':{ t:'Shadowing', b:'Duyduğun konuşmayı birkaç kelime geriden, aynı tonlamayla tekrarlama.',
    more:'Süre ölçülür, kalite ölçülmez — sistem sesini dinlemez. Kendi işaretlediğin zorluk «tahmin» etiketiyle durur ve hiçbir skoru tek başına belirlemez.' },
  'i-plus-one':{ t:'i+1 üretim', b:'Bildiğinin bir adım üstünde üretim: tanıdığın kalıbın yeni bağlamda kullanımı.',
    more:'Kartı tanımak (pasif) ile cümlede kullanmak (aktif) farklı şeylerdir. Aktif kelime sayısı yalnızca üretimde geçen kelimeleri sayar; tanıdıkların ayrı tutulur.' },

  /* --- felsefe --- */
  'argument':{ t:'Argüman', b:'Tek cümlelik tez, destekleri ve itirazları. Uzun deneme gerekmez.',
    more:'Bir tez «açık» kalır: itirazı cevaplanmadıysa kapanmaz. Socrates cevabı yazmaz, soruyu sorar — cevabı sen verirsin. Açık tez bir eksiklik değil, çalışan bir düşüncedir; yalnızca 14 günden uzun sürerse masa notu düşer.' },
  'fallacy':{ t:'Safsata denetimi', b:'Metindeki mantık hatası kalıplarını arar: kişiye saldırı, korkuluk adam, kaçınılmaz sonuç.',
    more:'Denetim kalıp tabanlıdır ve kesin değildir: «bulgu» olarak işaretler, yargı vermez. Bir kalıbın yakalanması argümanın yanlış olduğunu göstermez — bakmaya değer olduğunu gösterir.' },
  'primary-text':{ t:'Primer metin', b:'Filozofun kendi metni; hakkında yazılmış yorum değil.',
    more:'Yorum okumak kötü değildir ama kaydı ayrı tutulur: sentez katsayısı yalnızca primer metinden kurulan bağları sayar. Yoksa bir özet kitabı on filozof okumuş gibi görünürdü.' },

  /* --- ses --- */
  'clean-bpm':{ t:'Temiz BPM', b:'Hata yapmadan çalabildiğin en yüksek tempo. Ulaşılan en yüksek tempo değil.',
    more:'Sistem yalnızca «temiz» işaretlenen tekrarların BPM\'ini eşik sayar. Hız eşiği kendiliğinden artar, kendiliğinden düşmez: bir kötü gün eşiği geri almaz, ama üst üste üç temiz tekrar yeni eşiği açar.' },
  'plateau':{ t:'Plato', b:'Bir teknikte 14+ gündür temiz BPM eşiğinin artmaması.',
    more:'Plato bir başarısızlık değil bir sinyaldir: aynı çalışma aynı sonucu veriyorsa çalışmanın kendisi değişmeli. Öncelik sırasında «tıkanmış temel» sayılır ve yeni repertuarın önüne geçer.' },
  'articulation':{ t:'Artikülasyon', b:'Sesleri tam ve ayrık çıkarabilme. Tekerleme hızıyla değil temizliğiyle ölçülür.',
    more:'Kayıt tutulur ama çözümlenmez — sistem konuşma tanıma modeli kullanmaz. Hata sayısını kendin işaretlersin; bu yüzden «tahmin» etiketi taşır ve kendi geçmişinle karşılaştırılır, başkasıyla değil.' },
  'wpm':{ t:'Konuşma hızı', b:'Dakikadaki kelime. Ölçülmüş süre ve sayılmış kelimeden hesaplanır.',
    more:'Yüksek WPM iyi değildir; hedef banda yakın WPM iyidir. Türkçe sunumda rahat okunan bant kabaca 120–150 arasıdır ve bu bir kural değil bir başlangıç çizgisidir; kendi kayıtların bandı yerine oturtur.' },

  /* --- okuma --- */
  'atomic-note':{ t:'Atomik not', b:'Tek bir fikri taşıyan, tek cümlelik kart. Kitap özeti değil.',
    more:'Zettelkasten\'in tek kuralı budur: bir not bir fikir. İki fikir taşıyan not hiçbir yere bağlanamaz, çünkü hangi fikirle bağlandığı belirsizdir.' },
  'syntopic':{ t:'Sentopik bağ', b:'İki farklı yazarın aynı kavram hakkında söylediğini birbirine bağlayan iz.',
    more:'Sentopik okuma aynı soruyu birden çok yazara sormaktır. Bağ kurulmamış not «henüz sermaye değil» sayılır — okunmuş ama yerleşmemiştir.' },
  'ssk':{ t:'Sentez katsayısı', b:'SSK = (bağlantılı not / toplam kitap) × log(1 + yazar sayısı).',
    more:'Orijinal formül log(yazar) idi ve tek yazarda log(1)=0 tüm sentezi sıfırlıyordu: bir kitabı derinlemesine analiz eden kullanıcı cezalandırılıyordu. log(1+n) bu tekilliği giderir ve henüz kitap yokken de tanımlı kalır.' },

  /* --- yazi --- */
  'readability':{ t:'Okunabilirlik', b:'Cümle uzunluğu ve kelime uzunluğundan hesaplanan bir okuma yükü göstergesi.',
    more:'Bir kalite yargısı değildir: uzun cümle kötü değildir, farkında olmadan uzayan cümle sorundur. Gösterge kendi geçmiş metinlerinle karşılaştırılır.' },
  'draft-ratio':{ t:'Taslak–revizyon', b:'Üretilen kelime ile revize edilen kelimenin oranı.',
    more:'Sürekli yeni taslak açıp hiçbirini revize etmemek en yaygın yazı tıkanmasıdır. Oran bir hedef değil bir aynadır; Montaigne yalnızca sayıyı söyler.' },

  /* --- ofis --- */
  'brief':{ t:'Brifing', b:'Ajanın gördüğü tek şey: ölçülmüş metrikler ve durum etiketleri.',
    more:'Ham ses kaydı, tam metin taslak ve kişisel not brifinge girmez. Ham JSON\'u Danışma ekranından açabilirsin: ajanın görmediği bir şeye dayanarak konuşmadığını görmen gerekir.' },
  'rule-engine':{ t:'Kural motoru', b:'Sayıyı ve kararı üreten katman. Model yalnızca cümleye çevirir.',
    more:'Model kapalıyken ofis kapanmaz: brifing doğrudan kural cümlesine çevrilir ve ajanlar «kural motoru» rozetiyle konuşur. Rozet süs değildir; bir cümleye ne kadar güveneceğini belirler.' },
  'handoff':{ t:'Masalar arası devir', b:'Bir masanın bulgusu başka bir masanın işi olduğunda düşen satır.',
    more:'Devir bir tavsiye değildir: «şu ölçüldü, şu masaya düşüyor» der. Ölçülmemiş bir şey devredilemez — tahmin devir üretmez.' },
  'pedagogic':{ t:'Pedagojik sınır', b:'Sistem sertifika vermez, yetenek yargısı kurmaz, sonuç garantisi etmez.',
    more:'SPİ\'nin klinik sınırının buradaki karşılığı. Seviye etiketi kişiye değil ÜRETİME verilir ve daima tarih aralığıyla birlikte: «son 30 günlük üretimin B2 bandının kriterlerini karşılıyor — bu bir öz-değerlendirmedir».' },
  'precedence':{ t:'Öncelik sırası', b:'İki uzman ters şey söylediğinde Patron\'un uyduğu sıra.',
    more:'Üstteki alttakini her zaman yener. Ama yenilen uzmanın işi bitmez: yeni parça yerine mevcut repertuarda ilerleme önerir. «Hiçbir şey yapma» demek değildir.' },
  'ehs':{ t:'Entelektüel hacim', b:'EHS = Σ (disiplin ağırlığı × ölçülen saat × kalite katsayısı).',
    more:'H_i yalnızca ölçülen pratik saatidir; «veri yok» günler toplama girmez. Bu yüzden EHS bir hedef değil bir hacim ölçüsüdür: iki haftada bir bakılır, her gün değil.' },
  /* --- merdiven ve koç --- */
  'level':{ t:'Kademe', b:'Ölçülmüş üretimin merdivende karşıladığı basamak.',
    more:'Kademe kişiye değil ÜRETİME verilir: «Kalfa\'sın» denmez, «son 30 günün ölçülmüş üretimi Kalfa kapılarını karşılıyor» denir. Üretim durursa kademe de durur. Genel kademe disiplinlerin ortalaması değildir; ortalama ile en düşüğün arasıdır.' },
  'ladder':{ t:'Merdiven', b:'Bir disiplinin sıfırdan üstatlığa beş basamağı ve her basamağın ölçülebilir kapıları.',
    more:'Merdiven ardışıktır: alttaki kapı atlanarak üsttekine geçilmez. Sebebi pedagojik — atlanan kapı ileride geri gelir ve üstüne kurulan her şeyi çökertir. Süre tahmini yoktur: «üç ayda usta olursun» sonuç garantisi yasağına girer.' },
  'unknown-gate':{ t:'Ölçülemeyen kapı', b:'Ne geçilmiş ne kalınmış: o kapı için henüz ölçüm yok.',
    more:'Üçüncü durum sistemin dürüstlüğüdür. Ölçülmemiş bir kapıyı «kalındı» saymak da «geçildi» saymak da yalan olurdu. Burada istenen şey çalışmak değil ölçmek — ve bu sistemde ölçmek çoğu zaman işin kendisidir: retansiyonu ölçmek kart cevaplamak, temiz BPM\'i ölçmek metronomla çalmaktır.' },
  'placement':{ t:'Seviye tespiti', b:'Sıfırdan başlamayanlar için bir başlangıç TAHMİNİ.',
    more:'Sınav bir kademe VERMEZ ve hiçbir kapıyı açmaz. Verdiği şey «tahmin» etiketiyle durur; ilk ölçümler geldiğinde ölçülmüş kademe tahmini her zaman yener.' },
  'coach':{ t:'Koç reçetesi', b:'Üç bölümlük somut seans: ısınma, asıl iş, zorlanma.',
    more:'Tavsiye «dil çalışmalısın» der ve kararı sana bırakır; reçete «on kartı bağlam cümlesiyle karta çevir, on dakika» der ve kararı bitirir. Asıl iş, merdivende açık olan kapıya çalışır. Toplam süre profildeki günlük tabandan taşmaz: taşan reçete okunmaz.' },
  'drill':{ t:'Egzersiz', b:'Kural motorunun seçtiği tek bir yapılabilir iş.',
    more:'Seçimi model yapmaz: açığı olan eksen önce gelir. Bir egzersiz «işlendi» diye işaretlenmez, gün kaydına oturum olarak yazılır — ayrı bir tamamlandı bayrağı, yapılmamış işi yapılmış göstermenin en kolay yoluydu.' },

  /* --- tarih --- */
  'chrono':{ t:'Kronoloji', b:'Olayların zaman şeridi: tarihin iskeleti.',
    more:'Boş bir kronoloji «%0 kapsam» değil «veri yok»tur. Üç eksen ayrı ölçülür ve tek puana toplanmaz: kapsam (dönem, bölge, alan), derinlik (zincir ve kaynak), tutma (SRS retansiyonu). Tek puan, hangi eksenin zayıf olduğunu gizler.' },
  'era':{ t:'Dönem', b:'Büyük tarihsel bölümler ve tartışmalı sınırları.',
    more:'«Orta Çağ 476\'da başladı» demek bir ölçüm değil bir karardır — üstelik Batı\'ya özgü bir karar. Ekranda her dönemin yanında sınırının neden tartışmalı olduğu yazar.' },
  'gap':{ t:'Yüzyıl boşluğu', b:'Kronolojide üst üste üç yüzyıldan uzun boş aralık.',
    more:'Her yüzyılda dönüm noktası olmak zorunda değil; bu yüzden iki yüzyıllık boşluk bulgu sayılmaz. Üç yüzyıl sessizlik ise bir sorudur: orada bir şey olmadı mı, yoksa oraya bakmadın mı?' },
  'coverage':{ t:'Kapsam', b:'Olayların dönem, bölge ve alana dağılımı.',
    more:'Yalnızca savaş ve antlaşma girilirse nedensellik hep askerî kalır. Ekonomik, düşünsel ve toplumsal olaylar zinciri değiştirir — kapsam bu yüzden sayı değil DENGE ölçer.' },
  'event':{ t:'Olay', b:'Kronolojiye yerleştirilmiş tek bir dönüm noktası.',
    more:'Dönem yıldan türetilir, sorulmaz: aynı yıl iki döneme düşemez ve elle girilen dönem zamanla yanlış kalır. MÖ yıllar eksi yazılır (-753) çünkü sıralama aritmetikle yapılır.' },
  'source':{ t:'Kaynak', b:'Bir iddianın dayandığı belge ya da inceleme.',
    more:'Birincil kaynak dönemin kendi belgesidir, ikincil sonradan yazılmış incelemedir. Tek kaynağa dayanan bir iddia bir tezdir, bir olgu değil.' },
  'balance':{ t:'Kaynak dengesi', b:'Birincil ve ikincil kaynakların oranı.',
    more:'Bu bir kalite değil bir KOMPOZİSYON ölçüsüdür: %100 birincil de sağlıklı değildir, çünkü bağlamı ikincil kaynak verir. Neredeyse hepsi ikincilse başkasının okumasını okuyorsun demektir.' },
  'causal':{ t:'Neden zinciri', b:'Bir olayı yapısal koşul, konjonktür ve tetikleyiciyle açıklama.',
    more:'Tarihin en yaygın hatası kıvılcımı neden sanmaktır: «savaş suikastla çıktı». Yalnızca tetikleyiciden kurulan zincir «dengesiz» işaretlenir — bu bir yargı değil bir gözlemdir; zemini sen eklersin.' },
  'anachronism':{ t:'Anakronizm', b:'Geçmişi bugünün kavramlarıyla okumak.',
    more:'En sessiz hatadır: yanlış cevap vermez, yanlış soru sordurur. 1500\'de «Türkiye» ya da «Almanya» yoktu; hanedan ve din vardı. Kaçınılmazlık yanılgısı da buraya girer: olan şey olmak zorunda değildi.' },
  'school':{ t:'Tarih yazımı okulu', b:'Aynı olaya farklı soru soran gelenekler.',
    more:'Olaysal tarih «ne oldu» diye sorar, Annales «yüzyıllarca değişmeyen ne vardı», Marksist tarih «kim kazandı», mikro tarih «küçük bir vaka büyük yapıyı nasıl ele veriyor». Bunu görmek, tarih bilmek ile tarihsel düşünmek arasındaki farktır.' },

  /* --- dil (ikinci eksen) --- */
  'grammar':{ t:'Dilbilgisi ekseni', b:'Kelime ölçülür, işlev beyan edilir.',
    more:'Dört bin kart bilen biri koşul cümlesi kuramıyorsa üretemez. Buradaki işaretler ölçüm değil BEYANDIR ve «tahmin» etiketiyle durur: sistem doğrulayamaz. Beyanı ölçüm gibi göstermek, retansiyon sayısını uydurmakla aynı şey olurdu.' },
  'error-log':{ t:'Hata günlüğü', b:'Üretim hatalarını adlandırıp karta çevirme.',
    more:'Bir hatayı adlandırmak onu bir daha görmenin tek yolu: «bir şeyler yanlıştı» tekrar eder, «edat eşleşmesi» tekrar etmez. En sinsi satır «atlama»dır: bilmediğin yapıdan kaçınmak hata üretmez, bu yüzden ölçüme de girmez — ama kurmadığın cümle yapamadığın cümledir.' },

  /* --- yazı araçları --- */
  'revision':{ t:'Revizyon geçişi', b:'Metnin üzerinden geçilen sıralı turlar.',
    more:'Sıra önemlidir: yapı düzelmeden cümle cilalamak, silinecek paragrafı güzelleştirmektir. Okunabilirlik ölçümü cümle geçişinden SONRA alınır. İşaretlemek metni iyi yapmaz; hangi geçişin yapıldığını kaydeder.' },
  'structure':{ t:'Yapı kalıbı', b:'Metnin iskeleti: tez–karşı tez, sorun–çözüm, anlatı…',
    more:'Kalıp seçmek yaratıcılığı sınırlamaz; boş sayfayı sınırlar. Kalıbı bırakmak da serbesttir — ama bilerek bırakmak, hiç seçmemekten başka bir şeydir.' },
  'rhetoric':{ t:'Retorik figür', b:'Dilin bilinen araçları ve ne işe yaradıkları.',
    more:'Hiçbiri «iyi yazı böyle olur» demez: araç tanımıdır, kullanmak yazarın kararı. Bilerek yapılan tekrar figürdür, farkında olunmayan tekrar gürültü.' },

  /* --- okuma yöntemi --- */
  'reading-level':{ t:'Okuma düzeyi', b:'Temel, gözden geçirme, analitik, sentopik.',
    more:'«Okudum» ölçülebilir bir şey söylemez: göz gezdirmek de okumaktır, bir bölümü üç kez dönüp çıkarmak da. Hangi düzeyde okuduğunu bilmek, ne kadar okuduğunu bilmekten daha çok şey söyler.' },
  'analytic':{ t:'Analitik okumanın soruları', b:'Ne hakkında, ne söylüyor, doğru mu, ne olmuş yani?',
    more:'Bir kitabı bitirdikten sonra cevaplanmayan soru, okunmamış bir bölüm kadar eksiktir. Anlamadan katılmak da karşı çıkmak da okuma değildir.' },
  'protocol':{ t:'Okuma protokolü', b:'Bir okuma oturumunun beş adımı.',
    more:'Not yazmak için okumayı durdurmak, okumayı da notu da bozar: okurken yalnızca işaretle, notları oturum sonunda çıkar. Bağ bulamıyorsan zorlama — uydurulmuş bağ matrisi görünür ama anlamsız yapar.' },
  'note-template':{ t:'Not şablonu', b:'Her notun cevapladığı soruyu belli eden kalıp.',
    more:'Şablonsuz not, sonradan ne için alındığı anlaşılmayan nottur. Alıntı şablonu en az kullanılanıdır: alıntı yığını not değildir.' },
  'abandon':{ t:'Bırakma izni', b:'Bir kitabı bırakmak başarısızlık değildir.',
    more:'Bitirme zorunluluğu okuma saatinin en büyük düşmanıdır. Gözden geçirme düzeyinde verilen «bu kitap şu an bana gerekmiyor» kararı, yarısında sıkılıp suçluluk duymaktan iyidir. Bırakılan kitap kayıtta kalır.' },

  /* --- felsefe (ikinci eksen) --- */
  'experiment':{ t:'Düşünce deneyi', b:'Bir tezi laboratuvarsız sınamanın yolu.',
    more:'Deneylerin «doğru cevabı» yazılmaz: cevabı veren bir liste, deneyi bilgi yarışması sorusuna çevirir. Yazılan tek şey deneyin hangi AYRIMI zorladığıdır. Tezini sarsmayan bir deney seçmek, sınamadan geçmiş saymaktır.' },
  'argument-drill':{ t:'Argüman alıştırması', b:'Tez kurma ve sınama egzersizleri.',
    more:'Çelik adam kuralı en önemlisidir: karşı tarafı zayıf kurmak tartışmayı kazandırır, doğruyu kaybettirir. Yanlışlanamayan tez bir iddia değil bir inançtır.' },

  /* --- müzik (ikinci eksen) --- */
  'ear':{ t:'Kulak eğitimi', b:'Duyduğunu adlandırabilme: aralık, akor, derece.',
    more:'Metronom parmakları eğitir, kulak eğitmez. Hızlı çalan ama duymayan biri her yeni parçayı sıfırdan ezberler. Burada «mutlak kulak» diye bir kapı yoktur ve bilerek yoktur: ölçülen tek şey deneme başına isabettir, yetenek değil.' },
  'interval':{ t:'Aralık', b:'İki ses arasındaki mesafe ve onu hatırlatan kanca.',
    more:'Kanca bir ezber kolaylığıdır, kural değil: kendi kancanı bulursan daha iyi tutar.' },
  'caged':{ t:'CAGED', b:'Aynı akorun klavyede beş farklı şekli.',
    more:'Bir sır değil bir harita. Beş şekil birbirine bağlandığında klavyenin tamamı tek bir sistem olarak okunur.' },
  'sight-reading':{ t:'Deşifre', b:'Notayı ilk görüşte çalabilme.',
    more:'Okumak çalmaktan ayrı bir beceridir ve ayrı çalışılır: repertuarı ezberden çalan biri deşifrede başlangıç düzeyinde olabilir. Bu bir çelişki değil, iki ayrı ölçüdür.' },
  'repertoire':{ t:'Repertuar bakımı', b:'Çalınmayan parça geri gider.',
    more:'«Bitti» diye bir hâl yoktur. Otuz günden uzun süredir çalınmayan parça bakımsızdır: çalınabilir ama garanti değil. Repertuar genişletmek kadar korumak da bir iştir.' },

  'modules':{ t:'Bölümler', b:'Hangi disiplinlerin açık olduğu.',
    more:'Kapalı bir bölüm gezinmede görünmez, reçeteye ve denge hesabına girmez, merdivende ortalamaya katılmaz ve ofiste masası kapanır. Ama verisi SİLİNMEZ — «kapalı» ile «yok» ayrı şeylerdir. Numaralar da boşluk bırakmadan yeniden verilir: eksik bir numara, kaybedilmiş bir şey varmış gibi görünürdü.' },
  'desk':{ t:'Tezgâh', b:'Her bölümün altındaki ortak katman: koç, harita, ekler, hatırlatma.',
    more:'Dördü de tek yerde tanımlı çünkü bölümden bölüme değişmemeleri gerekiyor: kullanıcı bir kez öğrensin, yedi kez değil. Buradaki sohbet — sesli olanı dahil — Danışma ekranıyla aynı yoldan geçer: aynı brifing, aynı ev kuralları denetimi, aynı kayıt. Ses ikinci bir yol açmaz.' },
  'reminder':{ t:'Hatırlatma', b:'Kendine söylediğin bir şeyin günü gelince tekrar söylenmesi.',
    more:'Bir görev değildir: sistem hiçbir şeyi zorunlu kılmaz ve kaçırılan bir hatırlatıcı ceza üretmez, borç yazmaz. Tekrarlı olan tamamlanınca silinmez, bir sonraki tarihe taşınır — ve o tarih BUGÜNDEN sayılır: iki hafta geciken günlük bir hatırlatıcı on dört kez üst üste düşmemeli.' },
  'unit':{ t:'Ünite', b:'Bir konunun somut öğeleri ve ölçülebilir hedefi.',
    more:'Ünite bir ders değildir — ESP öğretmen değil — bir başlangıç malzemesidir: boş ekranı kaldırır. Üniteden gelen kartlar «tohum» etiketi taşır, yani «bu kartı ben yazmadım» bilgisi kaybolmaz. İlerleme ayrı bir «tamamlandı» bayrağından değil SRS\'ten okunur: bir kartı bilinen yapan şey bir kez doğru bilmek değil, aralığının uzamasıdır.' },
  'practice':{ t:'Pratik', b:'Destedeki kartlardan üretilen soru–cevap oturumu.',
    more:'Pratik ayrı bir hafıza kaydı açmaz: cevabın tekrar ekranındakiyle aynı yere, aynı SRS\'e yazılır. Çeldiriciler aynı desteden gelir ve model uydurmaz — uydurulmuş bir çeldirici yanlış bir şeyi öğretebilir. «Bilmiyorum» bir atlama değildir: kart «tekrar» işaretlenir ve başa döner.' },
  'proposal':{ t:'Teklif', b:'Bir masanın kendi alanında önerdiği somut eylem.',
    more:'Ajan doğrudan yazmaz — teklif eder, sen onaylarsın, uygulamayı kural motoru yapar. Bir dil modelinin verine doğrudan yazması, halüsinasyon riskini kalıcı hâle getirirdi: yanlış bir çıkarım bir cümle olarak kalmaz, bir hatırlatıcıya ya da bir hedefe dönüşürdü. Her teklif ajanın KENDİ alanındadır: Maestro hatırlatıcı kurabilir, dil ünitesi ekleyemez. Reddedilen teklif tekrar sorulmaz ama kaydı silinmez.' },
  'weekplan':{ t:'Haftalık plan', b:'Haftanın günlerine disiplin dağıtımı.',
    more:'Takvim DEĞİLDİR: «salı 19:00\'da gitar» demek sistemin işi değil. Sırayı haftalık rota verir, plan onu güne dağıtır — yeni bir karar üretmez. Saatini sen seçersin.' },
};
