/* SPİ ÖĞREN — konu anlatımları (brand/ortak/rehber.js biçimi).

   Kullanıcı (2026-10-18): «SPİ'ye anlatım yükle: spor nedir, kilo, kalori
   verme, diyet, kilo vermek adına; spor, koşu, yürüyüş, kalistenik; sağlıklı
   beslenmek adına».

   KAYNAK VE SINIR. LifeOS'un geliştirme oturumu (Claude) elle yazdı;
   ekranda «elle yazıldı · doğrulanmadı» yazar. Sayılar yaygın kabul gören
   kılavuzlardan alındı ve dayanağı her konunun sonunda adıyla yazılı.
   Hiçbir anlatım kişiye özel doz, kalori ya da program VERMEZ (AGENTS §1.5):
   hesap örnekleri yalnız kavramı gösterir. Bir sayıyı ya da planı
   değiştirmez; SPİ'nin kendi hesapları (core/nutri.js, core/plan.js) ayrıdır. */

window.SP = window.SP || {};

SP.REHBER_SINIR = 'Bu anlatımlar genel bilgidir; teşhis, tedavi ya da kişisel program değildir. '
  + 'Kronik bir hastalığın, gebeliğin, düzenli ilacın ya da geçmeyen bir ağrın varsa önce hekimine danış.';

SP.REHBER_KONULAR = [

  /* ================================================================ HAREKET */
  { id:'spor-temel', alan:'Hareket', ad:'Fiziksel aktivite, egzersiz ve spor', sure:7,
    giris:'Gün içinde kaslarını çalıştıran her hareket fiziksel aktivitedir; planlı ve tekrarlanan olanına egzersiz, kuralı ve yarışması olanına spor denir. Sağlık için önemli olan, haftanın toplamında yeterince ve düzenli hareket etmektir.',
    kazanim:['Aktivite, egzersiz ve spor arasındaki farkı ayırt eder.', 'Haftalık hareket önerisini ve şiddet düzeylerini tanır.', 'Kendi haftasını bu çerçeveyle okuyabilir.'],
    bolumler:[
      { baslik:'Üç kavram', metin:'Merdiven çıkmak, bahçe işi ya da yürüyerek işe gitmek **fiziksel aktivitedir**. Belirli bir amaçla planlanan ve tekrarlanan hareket **egzersizdir**: haftada üç gün 30 dakikalık tempolu yürüyüş gibi. **Spor** ise kuralları, çoğu zaman da bir rakibi ya da skoru olan egzersizdir.',
        dikkat:'Spor yapmıyor olmak hareketsiz olmak demek değildir; günlük aktivite de toplama girer.' },
      { baslik:'Şiddet: hafif, orta, yüksek', metin:'Şiddeti anlamanın en kolay yolu **konuşma testidir**. Rahatça şarkı söyleyebiliyorsan hafif, konuşabiliyor ama şarkı söyleyemiyorsan orta, birkaç kelimeden fazlasını söyleyemiyorsan yüksek şiddettesin.',
        liste:['**Hafif:** yavaş yürüyüş, ev işleri.', '**Orta:** tempolu yürüyüş, düz yolda bisiklet, dans.', '**Yüksek:** koşu, yokuş bisiklet, yüzmede tur atmak, tempolu takım sporları.'] },
      { baslik:'Haftalık öneri', metin:'Dünya Sağlık Örgütü yetişkinler için haftada **150–300 dakika orta** ya da **75–150 dakika yüksek** şiddette aerobik aktivite (ya da bunların eşdeğer bir karışımını) ve haftada **en az 2 gün kas güçlendirme** önerir. Oturarak geçen süreyi azaltmak da ayrı bir öneridir.',
        formul:['1 dakika yüksek şiddet ≈ 2 dakika orta şiddet', 'Haftalık eşdeğer = orta dakika + 2 × yüksek dakika'],
        ornek:{ soru:'Bir hafta 3 gün 30 dakika tempolu yürüyüş ve 1 gün 25 dakika koşu yapılmış. Orta şiddet eşdeğeri kaç dakika eder?',
          cozum:['Yürüyüş orta şiddettir: 3 × 30 = 90 dakika.', 'Koşu yüksek şiddettir: 25 × 2 = 50 dakika eşdeğer.', 'Toplam 90 + 50 = 140 dakika; 150 dakikalık alt sınıra yakın.'] } },
      { baslik:'Neden işe yarar?', metin:'Düzenli hareket kalp-damar sağlığını, kan şekeri kontrolünü, kas ve kemik gücünü, uyku kalitesini ve ruh hâlini iyileştirir. Faydanın büyük kısmı hiç hareket etmeyen birinin **biraz** hareket etmeye başlamasıyla gelir; mükemmel program beklemek gerekmez.',
        dikkat:'Göğüs ağrısı, nefes darlığı, baş dönmesi ya da çarpıntı egzersizde normal değildir: dur ve hekime danış.' },
    ],
    akilda:['Aktivite her hareket, egzersiz planlı hareket, spor kurallı egzersizdir.', 'Konuşma testi şiddeti anlatır.', 'Haftada 150–300 dk orta ya da 75–150 dk yüksek, artı 2 gün kas güçlendirme.'],
    kaynaklar:['DSÖ 2020 Fiziksel Aktivite ve Hareketsiz Davranış Kılavuzu'] },

  { id:'yuruyus', alan:'Hareket', ad:'Yürüyüş', sure:6,
    giris:'Yürüyüş ekipman gerektirmeyen, sakatlık riski düşük ve hemen her yaşta yapılabilen bir harekettir. Doğru tempoyla yapıldığında haftalık önerinin tamamı yürüyüşle karşılanabilir.',
    kazanim:['Gezinti ile tempolu yürüyüşü ayırt eder.', 'Adım sayısının ne söylediğini ve ne söylemediğini bilir.'],
    bolumler:[
      { baslik:'Tempo', metin:'Vitrine bakarak yürümek hafif şiddettir. **Tempolu yürüyüşte** nefes hızlanır, konuşabilirsin ama şarkı söyleyemezsin: bu orta şiddettir. Kollarını doğal sallamak ve adımı kısa ama sık tutmak tempoyu kolaylaştırır.',
        liste:['Dik dur, gözler ileride, omuzlar gevşek.', 'Topuk yere değer, ayak yuvarlanarak parmak ucuna geçer.', 'Adımı uzatmak yerine sıklaştır.'] },
      { baslik:'Adım sayısı', metin:'«Günde 10.000 adım» bilimsel bir eşik olarak doğmadı; 1960’larda Japonya’da satılan bir adımsayarın adından yayıldı. Büyük çalışmaların birleştirildiği analizlerde, yetişkinlerde günde yaklaşık **6.000–8.000 adımdan** itibaren ölüm riskinde belirgin azalma görülmüş; fayda yaşa göre farklı bir noktada düzleşiyor.',
        dikkat:'Adım sayısı süreyi ve tempoyu söylemez: 8.000 yavaş adım ile 30 dakikalık tempolu yürüyüş aynı şey değildir.' },
      { baslik:'Başlamak ve sürdürmek', metin:'Hiç yürümeyen biri için günde 10 dakika bile anlamlı bir başlangıçtır. Süre önce artar, tempo sonra. Yürüyüşü bir alışkanlığa bağlamak (yemekten sonra, işe giderken) unutmayı azaltır.',
        ornek:{ soru:'Haftada 5 gün yürüyüp haftalık 150 dakikaya ulaşmak isteyen biri günde kaç dakika tempolu yürümeli?',
          cozum:['150 ÷ 5 = 30 dakika.', 'Gün içinde iki kez 15 dakika da aynı toplamı verir.'] } },
    ],
    akilda:['Tempolu yürüyüş orta şiddettir.', '10.000 adım bir pazarlama sayısıdır; fayda daha düşük sayılarda başlar.', 'Önce süre, sonra tempo.'],
    kaynaklar:['DSÖ 2020 Fiziksel Aktivite Kılavuzu', 'Paluch ve ark., The Lancet Public Health, 2022 (adım sayısı meta-analizi)'] },

  { id:'kosu', alan:'Hareket', ad:'Koşuya başlamak', sure:8,
    giris:'Koşu kısa sürede yüksek şiddete çıkan, ekipmanı az bir egzersizdir. Yeni başlayanların en sık hatası çok hızlı ve çok sık başlamaktır; vücudun kemik, tendon ve eklemleri kaslardan daha yavaş uyum sağlar.',
    kazanim:['Koş-yürü yöntemini kurabilir.', 'Yükü yavaş artırmanın nedenini açıklar.', 'Sık görülen sakatlıkların uyarı işaretlerini tanır.'],
    bolumler:[
      { baslik:'Koş-yürü', metin:'Yeni başlayan biri sürekli koşmak yerine **koşu ve yürüyüş aralıklarını** sırayla yapar: örneğin 1 dakika hafif koşu, 2 dakika yürüyüş, 6–8 tekrar. Haftalar içinde koşu aralığı uzar, yürüyüş kısalır.',
        liste:['Koşu temposu konuşabileceğin kadar rahat olmalı.', 'Haftada 3 gün ve aralarda dinlenme günü yeterli bir başlangıçtır.', 'Her çıkışa 5 dakika yürüyüşle başla, yürüyüşle bitir.'] },
      { baslik:'Yükü yavaş artırmak', metin:'Kas birkaç haftada güçlenir, tendon ve kemik daha uzun sürede uyum sağlar. Bu yüzden haftalık süre ya da mesafe **küçük adımlarla** artırılır. Yaygın «haftada en çok %10» kuralı kesin bir bilimsel sınır değil, makul bir temkin kuralıdır.',
        ornek:{ soru:'Bu hafta toplam 60 dakika koşan biri %10 temkin kuralıyla gelecek hafta en çok kaç dakika koşar?',
          cozum:['60 × 0,10 = 6 dakika artış.', '60 + 6 = 66 dakika.'] },
        dikkat:'Yeniden başlayan biri eski formuyla başlamaz; ara ne kadar uzunsa başlangıç o kadar hafif olur.' },
      { baslik:'Ağrı mı, yorgunluk mu?', metin:'Kaslarda yaygın, bir iki günde geçen gerginlik olağan yorgunluktur. **Bir noktaya sabitlenen, koştukça artan ya da topallatan ağrı** ise uyarıdır: koşuya ara verilir. Kaval kemiği ağrısı ve diz önü ağrısı yeni başlayanlarda sık görülür ve çoğu zaman ani yük artışıyla ilgilidir.',
        dikkat:'Ağrıyla koşmaya devam etmek küçük bir sorunu haftalarca süren bir sakatlığa çevirebilir.' },
      { baslik:'Ayakkabı ve zemin', metin:'«En iyi ayakkabı» tek değildir; rahat hissettiren ve ayağına oturan ayakkabı yeterlidir. Zemin değişikliği (asfalttan patikaya, düzden yokuşa) da bir yük artışıdır ve kademeli yapılır.' },
    ],
    akilda:['Koş-yürüyle başla, koşu aralığını haftalar içinde uzat.', 'Yükü küçük adımlarla artır; tendon kastan yavaş uyum sağlar.', 'Bir noktaya sabitlenen, artan ağrıda dur.'],
    kaynaklar:['DSÖ 2020 Fiziksel Aktivite Kılavuzu', 'Koşu sakatlıkları üzerine derlemeler (ör. Nielsen ve ark., JOSPT, 2014)'] },

  { id:'kalistenik', alan:'Hareket', ad:'Kalistenik: vücut ağırlığıyla kuvvet', sure:8,
    giris:'Kalistenik, ağırlık yerine kendi vücut ağırlığını kullanan kuvvet antrenmanıdır: şınav, squat, barfiks, plank. Az ekipmanla her yerde yapılabilir; ilerlemek için ağırlık eklemek yerine hareketin **zorluğu** artırılır.',
    kazanim:['Temel hareket kalıplarını tanır.', 'Bir hareketi kolaydan zora sıralayabilir.', 'Formu ve tekrar aralığını doğru okur.'],
    bolumler:[
      { baslik:'Temel hareket kalıpları', metin:'Dengeli bir program her kalıptan en az bir hareket içerir.',
        liste:['**İtme:** şınav, dips (göğüs, omuz, arka kol).', '**Çekme:** barfiks, ters kürek / Avustralya barfiksi (sırt, ön kol).', '**Bacak:** squat, lunge, bulgar split squat.', '**Gövde:** plank, yan plank, ölü böcek.'] },
      { baslik:'İlerleme: kolaydan zora', metin:'Kalistenikte yük, hareketin açısı ve kaldıraçla ayarlanır. Bir aşamada temiz formla belirlenen tekrar sayısını rahatça yapabildiğinde bir sonraki aşamaya geçilir.',
        formul:['Şınav: duvar → eğimli (masa) → diz → tam → ayak yükseltilmiş', 'Barfiks: asılı durma → negatif (yavaş iniş) → bantlı → tam', 'Squat: sandalyeye otur-kalk → tam squat → bulgar split squat'],
        ornek:{ soru:'Diz şınavında 3 set 15 tekrarı temiz formla yapan biri ne yapmalı?',
          cozum:['Bu aşama artık kolay: bir sonraki aşamaya, tam şınava geçilir.', 'Tam şınavda tekrar düşer (örneğin 3 set 5); bu beklenen bir durumdur.'] } },
      { baslik:'Form ve tekrar', metin:'Kas gelişimi geniş bir tekrar aralığında, setin sonuna doğru zorlanıldığında olur. Her tekrarın temiz olması tekrar sayısından önemlidir: şınavda gövde düz bir tahta gibi kalır, squatta dizler ayak uçlarıyla aynı yöne bakar.',
        dikkat:'Kalça düşük ya da bel çukurlaşmış şınav, sayıyı artırır ama hareketi bozar ve beli zorlar.' },
      { baslik:'Haftalık düzen', metin:'Yeni başlayan biri için haftada 2–3 gün, her gün bütün kalıpları içeren bir tam vücut antrenmanı yeterlidir. Aynı kas grubunu ertesi gün yeniden yüklemeden önce toparlanmaya zaman tanınır.' },
    ],
    akilda:['İtme, çekme, bacak ve gövde: dört kalıp.', 'İlerleme yükle değil zorluk aşamasıyla olur.', 'Temiz form, tekrar sayısından önce gelir.'],
    kaynaklar:['ACSM direnç antrenmanı ilerleme önerileri (2009 tutum bildirisi)', 'Schoenfeld ve ark., tekrar aralığı ve kas gelişimi üzerine meta-analizler'] },

  { id:'kuvvet', alan:'Hareket', ad:'Kuvvet antrenmanının temel kavramları', sure:7,
    giris:'Set, tekrar, yük ve dinlenme kuvvet antrenmanının dilidir. Bu kavramları bilmek, bir programı okumayı ve SPİ’deki antrenman kayıtlarını doğru girmeyi kolaylaştırır.',
    kazanim:['Set, tekrar ve yükü doğru kaydeder.', 'Aşamalı yüklenmeyi açıklar.', 'Zorluğu «kalan tekrar» ile ifade eder.'],
    bolumler:[
      { baslik:'Set, tekrar, yük', metin:'Bir hareketin bir kez yapılması **tekrar**, ara vermeden yapılan tekrar grubu **settir**. Yük, kullanılan dış ağırlıktır ve ekipmanla birlikte yazılır.',
        ornek:{ soru:'İki adet 8 kg dambılla 3 set 10 tekrar yapan biri toplam kaç tekrar yapmıştır, yük nasıl yazılır?',
          cozum:['3 × 10 = 30 tekrar.', 'Yük «her el 8 kg (toplam 16 kg)» diye yazılır; ikisi karıştırılmaz.'] } },
      { baslik:'Aşamalı yüklenme', metin:'Vücut, kendisinden istenen işe uyum sağlar. Gelişmeye devam etmek için zamanla **biraz daha fazlası** istenir: biraz daha yük, bir tekrar daha, bir set daha ya da daha zor bir varyasyon. Bu ilkeye aşamalı yüklenme denir.',
        dikkat:'Her antrenmanda yük artırmak gerekmez; formu bozmadan bir tekrar fazlası da ilerlemedir.' },
      { baslik:'Zorluğu ölçmek: kalan tekrar', metin:'Bir setin ne kadar zorlandığını «kaç tekrar daha yapabilirdim?» sorusuyla anlatmak pratiktir. 2 tekrar daha yapabilecekken bırakmak, setin sonuna yakın ama tükenmeden çalışmak demektir; çoğu set için makul bir hedeftir.',
        liste:['**0 kalan:** set tükenişe kadar gitti.', '**1–3 kalan:** zor ama kontrollü.', '**4+ kalan:** ısınma ya da hafif set.'] },
      { baslik:'Dinlenme ve toparlanma', metin:'Setler arasında çok eklemli ağır hareketlerde 2–3 dakika, küçük hareketlerde 1–2 dakika dinlenmek yaygındır. Asıl gelişme antrenmandan sonra, uyku ve beslenmeyle birlikte toparlanırken olur.' },
    ],
    akilda:['Tekrar, set ve yük ayrı ayrı kaydedilir.', 'Gelişme için zamanla biraz daha fazlası istenir.', 'Çoğu set tükenmeden, 1–3 tekrar kala biter.'],
    kaynaklar:['ACSM direnç antrenmanı ilerleme önerileri (2009)', 'Helms ve ark., kalan tekrara dayalı zorluk ölçeği (2016)'] },

  /* ================================================================ BESLENME */
  { id:'beslenme-temel', alan:'Beslenme', ad:'Sağlıklı beslenmenin temelleri', sure:8,
    giris:'Sağlıklı beslenme tek bir mucize besin ya da yasaklı bir liste değil, haftanın toplamındaki dengedir. Tabağın büyük kısmı sebze, meyve, tam tahıl ve baklagilden; yeterli protein ve sağlıklı yağdan oluşur.',
    kazanim:['Üç makro besinin görevini ve enerjisini bilir.', 'Tabak modeliyle bir öğünü değerlendirir.', 'Tuz, şeker ve lif için genel önerileri tanır.'],
    bolumler:[
      { baslik:'Makro besinler', metin:'Enerji veren üç ana besin öğesi vardır. Her birinin vücutta ayrı bir görevi vardır; biri tamamen dışlanınca denge bozulur.',
        formul:['Karbonhidrat: 4 kcal/g', 'Protein: 4 kcal/g', 'Yağ: 9 kcal/g', 'Alkol: 7 kcal/g (besin değeri yok)'],
        liste:['**Karbonhidrat:** beynin ve kasların hızlı yakıtı; tam tahıl, baklagil, meyve, sebze.', '**Protein:** kas, bağışıklık ve onarım; et, balık, yumurta, süt ürünleri, baklagil.', '**Yağ:** hormonlar ve yağda çözünen vitaminler; zeytinyağı, kuruyemiş, balık.'] },
      { baslik:'Tabak modeli', metin:'Ölçmeden pratik bir denge için tabak gözle bölünür: **yarısı sebze ve meyve**, **dörtte biri tam tahıl**, **dörtte biri protein**; yanında su ve az miktarda sağlıklı yağ.',
        ornek:{ soru:'Bir öğünde büyük bir tabak makarna ve yanında biraz salata var. Tabak modeline göre ne değişebilir?',
          cozum:['Makarna tabağın dörtte birine iner ve tam tahıllı olabilir.', 'Salata ve sebze yarıya çıkar.', 'Dörtte birlik yere bir protein eklenir: tavuk, balık, yumurta ya da nohut.'] } },
      { baslik:'Lif, tuz ve şeker', metin:'Lif sindirime ve tokluk hissine yardım eder; yetişkinler için günde **25 g ve üzeri** önerilir ve tam tahıl, baklagil, sebze ve meyveden gelir. Dünya Sağlık Örgütü tuzu günde **5 g’ın altında**, eklenmiş şekeri günlük enerjinin **%10’undan az** (mümkünse %5) tutmayı önerir.',
        dikkat:'Tuzun çoğu tuzluktan değil; ekmek, peynir, hazır çorba, işlenmiş et ve atıştırmalıklardan gelir.' },
      { baslik:'Su', metin:'Su ihtiyacı yiyeceklerden gelen suyla birlikte karşılanır. Avrupa Gıda Güvenliği Otoritesi toplam su alımı için kadınlarda yaklaşık **2,0 L**, erkeklerde **2,5 L** referans verir; sıcakta ve terlerken ihtiyaç artar. İdrarın açık renkte olması pratik bir işarettir.' },
    ],
    akilda:['Yağ gram başına iki kat fazla enerji taşır.', 'Tabağın yarısı sebze ve meyve.', 'Tuz < 5 g, eklenmiş şeker enerjinin < %10’u, lif 25 g+.'],
    kaynaklar:['DSÖ Sağlıklı Beslenme bilgi notu (2020)', 'EFSA su ve lif referans değerleri (2010)', 'Harvard Sağlıklı Beslenme Tabağı'] },

  { id:'kalori', alan:'Beslenme', ad:'Kalori ve enerji dengesi', sure:9,
    giris:'Kalori, besinlerden aldığımız enerjinin birimidir. Kilo değişimini en çok belirleyen şey alınan ve harcanan enerji arasındaki dengedir; ama bu denge hem besinin kalitesinden hem de vücudun uyum tepkilerinden etkilenir.',
    kazanim:['Bazal metabolizma ile günlük toplam harcamayı ayırt eder.', 'Enerji açığı kavramını bir örnekle hesaplar.', 'Bu hesabın neden yaklaşık olduğunu açıklar.'],
    bolumler:[
      { baslik:'Kalori nedir?', metin:'Besin etiketlerindeki «kalori» aslında **kilokaloridir** (kcal). Bir besinin enerjisi içindeki karbonhidrat, protein ve yağ miktarından hesaplanır.',
        ornek:{ soru:'30 g karbonhidrat, 20 g protein ve 10 g yağ içeren bir öğün yaklaşık kaç kcal’dir?',
          cozum:['Karbonhidrat: 30 × 4 = 120 kcal.', 'Protein: 20 × 4 = 80 kcal.', 'Yağ: 10 × 9 = 90 kcal.', 'Toplam 120 + 80 + 90 = 290 kcal.'] } },
      { baslik:'Harcama: bazal ve toplam', metin:'Vücudun dinlenirken yaşamak için harcadığı enerjiye **bazal metabolizma** denir ve günlük harcamanın en büyük kısmıdır. Üzerine günlük hareket, egzersiz ve sindirim eklenince **günlük toplam harcama** çıkar. Bazal metabolizmayı tahmin etmek için Mifflin–St Jeor denklemi yaygın kullanılır.',
        formul:['Erkek: 10 × kilo(kg) + 6,25 × boy(cm) − 5 × yaş + 5', 'Kadın: 10 × kilo(kg) + 6,25 × boy(cm) − 5 × yaş − 161', 'Günlük toplam ≈ bazal × aktivite katsayısı (yaklaşık 1,2 hareketsiz … 1,7 çok hareketli)'],
        ornek:{ soru:'80 kg, 180 cm, 30 yaşında bir erkeğin bazal metabolizması bu denklemle yaklaşık kaçtır?',
          cozum:['10 × 80 = 800', '6,25 × 180 = 1125', '5 × 30 = 150', '800 + 1125 − 150 + 5 = 1780 kcal (tahmin).'] },
        dikkat:'Bu denklemler bir ortalama verir; aynı boy ve kilodaki iki kişinin gerçek harcaması yüzlerce kcal farklı olabilir. SPİ bu yüzden tahmini «tahmin» etiketiyle gösterir.' },
      { baslik:'Enerji açığı ve fazlası', metin:'Harcanandan az enerji alınırsa **enerji açığı** oluşur ve vücut depolarını kullanır; fazlası alınırsa depolar. Yaygın bir yaklaşım 1 kg yağ dokusunu yaklaşık **7700 kcal** sayar.',
        ornek:{ soru:'Günde ortalama 500 kcal açık verilirse bir haftada yaklaşık ne kadar yağ dokusu kaybı beklenir?',
          cozum:['500 × 7 = 3500 kcal.', '3500 ÷ 7700 ≈ 0,45 kg.', 'Bu yaklaşık bir hesaptır; ilk haftalarda tartıdaki değişim su yüzünden farklı olabilir.'] } },
      { baslik:'Hesap neden yaklaşıktır?', metin:'Kilo verdikçe harcama da azalır, vücut bazı uyum tepkileri gösterir ve tartı su, tuz ve sindirimle gün içinde oynar. Bu yüzden kalori hesabı bir **pusuladır**, kesin bir takvim değildir; haftalık ortalamaya bakmak tek güne bakmaktan daha doğrudur.' },
    ],
    akilda:['Etiketteki kalori = kcal.', 'Karbonhidrat ve protein 4, yağ 9 kcal/g.', 'Enerji açığı kilo kaybını belirler; ama hesap yaklaşıktır.'],
    kaynaklar:['Mifflin ve ark., Am J Clin Nutr, 1990', 'Hall ve ark., enerji dengesi ve kilo değişimi modelleri, The Lancet, 2011'] },

  { id:'kilo-verme', alan:'Beslenme', ad:'Kilo vermenin temelleri', sure:9,
    giris:'Kalıcı kilo kaybı, sürdürülebilir küçük bir enerji açığının aylar boyunca korunmasıyla olur. Hızlı ve sert yöntemler kısa sürede tartıyı düşürse de çoğu zaman geri kazanımla sonuçlanır.',
    kazanim:['Makul bir kilo verme hızını tanır.', 'Kilo verirken kası korumanın yollarını bilir.', 'Tartıdaki dalgalanmayı doğru okur.'],
    bolumler:[
      { baslik:'Makul hız', metin:'Sağlık otoriteleri çoğu yetişkin için haftada yaklaşık **0,5–1 kg** kilo kaybını makul kabul eder. Daha hızlı kayıp daha çok kas kaybı, yorgunluk ve geri kazanım riski taşır. Günde **800 kcal’in altına** inen çok düşük kalorili diyetler yalnız hekim gözetiminde uygulanır.',
        dikkat:'Gebelikte, emzirirken, yeme bozukluğu geçmişinde ya da kronik hastalıkta kilo verme planı önce hekim veya diyetisyenle konuşulur.' },
      { baslik:'Kası korumak', metin:'Kilo verirken amaç yalnız tartıyı değil **yağ dokusunu** azaltmaktır. Bunun için üç şey birlikte çalışır:',
        liste:['**Kuvvet antrenmanı:** kasa «gerekliyim» sinyalini verir.', '**Yeterli protein:** her öğünde bir protein kaynağı; araştırmalarda kilo verirken günlük protein ihtiyacının arttığı gösterilmiştir.', '**Aşırı olmayan açık:** sert açık kas kaybını artırır.'] },
      { baslik:'Tartıyı okumak', metin:'Tartı gün içinde 1–2 kg oynayabilir: su, tuz, karbonhidrat, sindirim ve adet döngüsü bunu etkiler. Bu yüzden tek bir tartıya değil, **haftalık ortalamaya** ve bel çevresi gibi ikinci bir ölçüye bakmak daha doğrudur.',
        ornek:{ soru:'Bir hafta sabah tartıları 82,4 · 82,9 · 82,1 · 82,6 · 82,0 · 81,8 · 82,3 kg. Haftalık ortalama kaçtır?',
          cozum:['Toplam: 82,4 + 82,9 + 82,1 + 82,6 + 82,0 + 81,8 + 82,3 = 576,1', '576,1 ÷ 7 ≈ 82,3 kg.', 'Gelecek haftanın ortalamasıyla karşılaştırmak, tek günden daha güvenilirdir.'] } },
      { baslik:'Sürdürülebilirlik', metin:'En iyi plan, uzun süre uygulanabilen plandır. Sevdiğin yemekleri tamamen yasaklamak yerine porsiyonu ve sıklığı ayarlamak, uyku ve stresle ilgilenmek, ilerlemeyi ölçmek ama tek güne takılmamak uzun vadede daha iyi sonuç verir.',
        dikkat:'Bir hafta tartı düşmedi diye açığı sertleştirmek yerine birkaç haftalık eğilime bakılır.' },
    ],
    akilda:['Haftada 0,5–1 kg makul bir hızdır.', 'Kuvvet antrenmanı + yeterli protein kası korur.', 'Tek tartıya değil haftalık ortalamaya bak.'],
    kaynaklar:['NHS kilo verme rehberi', 'NICE obezite kılavuzu (CG189)', 'Helms ve ark., kilo verirken protein ihtiyacı üzerine derleme (2014)'] },

  { id:'diyet', alan:'Beslenme', ad:'Diyet yaklaşımları: neye dikkat etmeli', sure:8,
    giris:'Akdeniz diyeti, aralıklı oruç, düşük karbonhidrat… Araştırmalar kilo kaybında bu yaklaşımların çoğunun, enerji açığı benzer olduğunda **benzer sonuçlar** verdiğini gösteriyor. Belirleyici olan, kişinin hangisini sürdürebildiğidir.',
    kazanim:['Yaygın diyet yaklaşımlarını tanır.', 'Kanıtı güçlü iddiayla zayıf iddiayı ayırt eder.', 'Kendisi için sürdürülebilirliği sorgular.'],
    bolumler:[
      { baslik:'Akdeniz tipi beslenme', metin:'Sebze, meyve, tam tahıl, baklagil, zeytinyağı, balık ve kuruyemiş ağırlıklı; kırmızı et ve işlenmiş gıda az. Kalp-damar sağlığı üzerine kanıtı en güçlü beslenme biçimlerinden biridir ve bir «kür» değil uzun vadeli bir düzendir.' },
      { baslik:'Aralıklı oruç ve düşük karbonhidrat', metin:'Aralıklı oruç (örneğin 16 saat yeme penceresi dışı) ve düşük karbonhidratlı beslenme bazı kişilere enerji açığını kolaylaştırır. Karşılaştırmalı çalışmalarda kilo kaybı, aynı kalori açığındaki klasik kısıtlamaya **benzer** bulunmuştur.',
        liste:['Uyumu kolaylaştırıyorsa bir araç olabilir.', 'Öğün atlamak aşırı yemeyle sonuçlanıyorsa uygun değildir.', 'Diyabet ilacı kullananlar öğün düzenini değiştirmeden önce hekime danışır.'] },
      { baslik:'Kırmızı bayraklar', metin:'Bazı iddialar kanıtla desteklenmez ya da sağlığa zarar verebilir.',
        liste:['«Detoks» ve arınma kürleri: vücut toksinleri karaciğer ve böbrekle zaten atar.', 'Bir besin grubunu tamamen yasaklayan ve tıbbi gerekçesi olmayan planlar.', '«Haftada 5 kg» gibi hızlı sonuç vaatleri.', 'Satın alınması gereken özel ürüne bağlı diyetler.'],
        dikkat:'«Doğal» bir takviye de ilaçlarla etkileşebilir; takviye kullanmadan önce hekime ya da eczacıya danış.' },
      { baslik:'Kendine uygun olanı seçmek', metin:'Bir yaklaşımı denerken şu sorular yol gösterir: Bunu bir yıl sürdürebilir miyim? Ailemle ve sosyal hayatımla uyumlu mu? Açlık, uyku ve enerji düzeyim nasıl? Kan değerlerim ve tansiyonum ne gösteriyor?',
        ornek:{ soru:'İki diyetten biri daha hızlı kilo kaybı vaat ediyor ama sevdiğin yemeklerin çoğunu yasaklıyor; öteki daha yavaş ama ailenle aynı sofraya oturmana izin veriyor. Uzun vadede hangisi daha olası başarılıdır?',
          cozum:['Kalıcı sonucu belirleyen sürdürülebilirliktir.', 'Aile sofrasına uyan yavaş plan, bırakılma olasılığı düşük olduğu için uzun vadede daha olası başarılıdır.'] } },
    ],
    akilda:['Aynı açıkta farklı diyetler benzer kilo kaybı verir.', 'Akdeniz tipi beslenmenin kanıtı güçlüdür.', 'Detoks, hızlı sonuç ve yasak listeleri kırmızı bayraktır.'],
    kaynaklar:['Estruch ve ark., PREDIMED, NEJM, 2018', 'Gardner ve ark., DIETFITS, JAMA, 2018', 'Aralıklı oruç ve sürekli kısıtlama karşılaştırmaları üzerine meta-analizler'] },

  /* ================================================================ TOPARLANMA */
  { id:'uyku-toparlanma', alan:'Toparlanma', ad:'Uyku ve toparlanma', sure:7,
    giris:'Antrenmanın etkisi antrenman sırasında değil, sonrasında toparlanırken ortaya çıkar. Uyku bu toparlanmanın merkezindedir; yetersiz uyku hem performansı hem iştahı hem de ruh hâlini etkiler.',
    kazanim:['Yetişkinler için önerilen uyku süresini bilir.', 'Uykunun iştah ve antrenmanla ilişkisini açıklar.', 'Uyku düzenini iyileştiren alışkanlıkları sıralar.'],
    bolumler:[
      { baslik:'Ne kadar uyku?', metin:'Uyku dernekleri yetişkinler için gecede **7 saat ve üzeri** uyku önerir; çoğu yetişkin için ihtiyaç 7–9 saat arasındadır. Süre kadar **düzen** de önemlidir: her gün benzer saatte yatıp kalkmak iç saati dengeler.',
        dikkat:'Hafta içi az uyuyup hafta sonu çok uyumak açığı tam kapatmaz ve iç saati kaydırır.' },
      { baslik:'Uyku, iştah ve kilo', metin:'Kısa süreli uyku kısıtlamasının açlık hissini ve yüksek enerjili yiyeceklere isteği artırdığı deneylerde gösterilmiştir. Kilo vermeye çalışırken yetersiz uyku hem iradeyi hem de kas korumayı zorlaştırır.' },
      { baslik:'Uyku düzeni için alışkanlıklar', metin:'Uyku hijyeni denen küçük alışkanlıklar çoğu zaman ilaçtan önce gelir.',
        liste:['Sabah gün ışığı, akşam loş ışık.', 'Kafeinin etkisi saatler sürer (yarılanma süresi yaklaşık 5 saat): öğleden sonra sınırla.', 'Yatak odası serin, karanlık ve sessiz.', 'Yatmadan önce ağır yemek ve yoğun egzersizden kaçın.', 'Uyuyamıyorsan 20 dakika kadar sonra kalk, sakin bir şey yap, uykun gelince dön.'],
        ornek:{ soru:'Saat 16.00’da 200 mg kafein alan birinin vücudunda gece 21.00’de yaklaşık ne kadar kafein kalır? (yarılanma süresi 5 saat kabul edilsin)',
          cozum:['16.00 → 21.00 arası 5 saat = bir yarılanma süresi.', '200 ÷ 2 = yaklaşık 100 mg.', 'Yarılanma süresi kişiden kişiye değişir; bu yalnız bir örnek hesaptır.'] } },
      { baslik:'Dinlenme günü', metin:'Toparlanma yalnız uyku değildir: aynı kas grubunu art arda zorlamamak, hafif hareketle geçen dinlenme günleri ve yeterli beslenme de toparlanmanın parçasıdır. Uzun süreli yorgunluk, düşen performans ve bozulan uyku birlikte görülüyorsa yük azaltılır.' },
    ],
    akilda:['Yetişkinler için gecede 7 saat ve üzeri.', 'Düzenli saat, süre kadar önemlidir.', 'Az uyku iştahı artırır ve toparlanmayı yavaşlatır.'],
    kaynaklar:['AASM ve Uyku Araştırmaları Derneği ortak bildirisi (2015)', 'Uyku kısıtlaması ve iştah üzerine deneysel çalışmalar (ör. Spiegel ve ark., 2004)'] },
];
