/* Kanit katmani — hangi esik nereden geliyor ve NE SOYLEMEYE YETKILI.

   Bu dosya tek bir elestiriden dogdu ve elestiri hakliydi:

     "Deterministik olmak, bilimsel olarak dogru olmak anlamina gelmez."

   SPI'nin kural motoru bastan beri saglamdi: model sayi uretmez, hesabi
   kural yapar, cikti denetlenir. Ama kuralin KENDISI nereden geliyordu?
   Bir esik kodda ne kadar kesin yazilirsa yazilsin, esigin kendisi yanlis
   secilmisse sistem son derece guvenilir gorunen yanlis bir sonuc uretir.
   Kesinlik gorunumu, kesinligin yerine gecer.

   Cozum su: HER ESIK KENDI KAYNAGINI TASIR ve kaynaginin derecesi, o
   esigin ne kadar guclu konusabilecegini BELIRLER.

   Dort derece vardir ve aralarindaki fark suslu degil, islevseldir:

     guideline     Adi konmus bir klinik kilavuzun karar esigi. Yonlendirme
                   yapabilir ("hekime basvur" diyebilir).
     consensus     Laboratuvar ve klinik pratikte yaygin uzlasi; tek bir
                   kilavuza baglanmamis. Yonlendirme yapabilir.
     observational Gozlemsel calismalardan gelen BIR ILISKI. Karar esigi
                   degildir. Yalnizca gozlem bildirir, yonlendirmez.
     convention    Bu sistemin pratik sebeplerle SECTIGI sayi. Bilimsel bir
                   bulgu degildir ve oyle sunulmaz. Yalnizca soru sorar.

   Kural: `observational` ve `convention` dereceli bir esik, DIREKTIF
   uretemez. Kaynagi hic yazilmamis bir esik de uretemez — bilinmeyen
   kaynak, iyi kaynak degildir. Bu kural core/evidence.js'te uygulanir ve
   tests/evidence.test.js'te denetlenir.

   Kaynak yazarken uydurma YOKTUR. Emin olunmayan her esik acikca
   'convention' derecesine yazilir; uydurulmus bir atif, atifsiz bir
   esikten kotudur. Bu dosyadaki bosluklar da bir olcumdur:
   SP.Ev.coverage() kac esigin kaynak tasidigini sayar. */

window.SP = window.SP || {};

SP.EVIDENCE_GRADES = [
  { id:'guideline', rank:4, label:'Kılavuz', tone:'ok',
    mayDirect:true,
    note:'Adı konmuş bir klinik kılavuzun karar eşiği.' },
  { id:'consensus', rank:3, label:'Uzlaşı', tone:'ok',
    mayDirect:true,
    note:'Laboratuvar ve klinik pratikte yaygın uzlaşı; tek kılavuza bağlı değil.' },
  { id:'observational', rank:2, label:'Gözlemsel', tone:'info',
    mayDirect:false,
    note:'Gözlemsel çalışmalardan gelen bir ilişki. Karar eşiği değildir.' },
  { id:'convention', rank:1, label:'Seçim', tone:'warn',
    mayDirect:false,
    note:'Bu sistemin pratik sebeplerle seçtiği sayı. Bilimsel bir bulgu değildir.' },
];

SP.GRADE_BY_ID = SP.EVIDENCE_GRADES.reduce(function(m, g){ m[g.id] = g; return m; }, {});

/* Kayitlar.

   `marker` biyobelirtec kimligi, `field` hangi esigi anlattigi:
     'red'      kirmizi bayrak esigi
     'ref'      laboratuvar referans araligi
     'optimal'  hedef bant

   `source` kaynagin ADIDIR; bir baglanti degil. Baglanti verilirse
   cürür, ad kalir. `year` kaynagin yili ya da surumudur; bos olabilir
   ama bos birakilirsa derece kendiliginden dusmez — kaynagin adi yeterse
   yeter, guncelligini kullanici tartar.

   `population` esigin KIME ait oldugunu soyler. Bir esigin en sik
   gozden kacan yani budur: yetiskin erkekte gecerli bir sinir, sporcuda
   ya da gebelikte ayni sey demek degildir. */
SP.EVIDENCE = [

  /* ----------------------------------------------------------- vital */
  { marker:'sbp', field:'ref', grade:'guideline',
    source:'ACC/AHA kan basıncı sınıflaması', year:'2017',
    population:'yetişkin, ofis ölçümü',
    note:'130/80 mmHg ve üzeri evre 1 hipertansiyon olarak sınıflanır. '
       + 'Tek ölçümle tanı konmaz; sistem de koymaz.' },
  { marker:'dbp', field:'ref', grade:'guideline',
    source:'ACC/AHA kan basıncı sınıflaması', year:'2017',
    population:'yetişkin, ofis ölçümü',
    note:'Diyastolik 80 mmHg ve üzeri evre 1 sınırı.' },
  { marker:'sbp', field:'red', grade:'guideline',
    source:'Hipertansif acil durum eşiği (yaygın kılavuz pratiği)',
    population:'yetişkin',
    note:'180 mmHg üzeri, belirti eşlik ediyorsa acil değerlendirme gerektirir.' },
  { marker:'spo2', field:'red', grade:'guideline',
    source:'Hipoksemi tanımı (klinik kılavuz pratiği)',
    population:'deniz seviyesi, erişkin',
    note:'%90 altı hipoksemi kabul edilir. Parmak probu ölçümü soğuk el, '
       + 'oje ve hareketten etkilenir.' },
  { marker:'temp', field:'red', grade:'consensus',
    source:'Ateş tanımı (≥38 °C) ve hipotermi sınırı (<35 °C)',
    population:'erişkin, oral/timpanik',
    note:'Ölçüm yeri sonucu değiştirir; koltuk altı ölçüm daha düşük okur.' },
  { marker:'rhr', field:'ref', grade:'consensus',
    source:'Erişkin istirahat nabzı normal aralığı (60–100/dk geleneği)',
    population:'erişkin',
    note:'Antrene kişilerde 45/dk normal olabilir; alt sınır tek başına '
       + 'bir bulgu değildir.' },
  { marker:'rhr', field:'optimal', grade:'observational',
    source:'Düşük istirahat nabzı ile kardiyovasküler sonuçlar arasındaki '
         + 'gözlemsel ilişki',
    population:'genel erişkin nüfus',
    note:'İlişki, nedensellik değildir. Bu bant bir hedef değil bir gözlemdir.' },
  { marker:'hrv', field:'optimal', grade:'convention',
    source:'Bu sistemin seçimi',
    population:'—',
    note:'HRV kişiye özeldir ve cihazdan cihaza değişir. Mutlak bir hedef '
       + 'bandı bilimsel değil pratik bir seçimdir; asıl anlamlı olan '
       + 'kişinin KENDİ temel çizgisine göre sapmasıdır.' },
  { marker:'sleep', field:'optimal', grade:'guideline',
    source:'Erişkin uyku süresi önerisi (7–9 saat)',
    population:'18–64 yaş erişkin',
    note:'Süre öneridir; uyku kalitesi ve düzenliliği süreden bağımsız '
       + 'olarak önemlidir ve bu sistem onları ölçmez.' },

  /* --------------------------------------------------------- hemogram */
  { marker:'hgb', field:'ref', grade:'guideline',
    source:'DSÖ anemi tanımı', year:'erkek <13, kadın <12 g/dL',
    population:'gebe olmayan erişkin, deniz seviyesi',
    note:'Yükseklikte ve sigara içenlerde eşik yukarı kayar.' },
  { marker:'hgb', field:'red', grade:'guideline',
    source:'Ağır anemi eşiği (DSÖ sınıflaması)',
    population:'erişkin',
    note:'Ağır anemi gecikmeden değerlendirilir.' },
  { marker:'mcv', field:'ref', grade:'consensus',
    source:'Eritrosit indeksleri laboratuvar referansı',
    population:'erişkin',
    note:'Düşük MCV demir eksikliğini, yüksek MCV B12/folat eksikliğini '
       + 'düşündürür; ikisi bir arada normal MCV verebilir.' },
  { marker:'plt', field:'red', grade:'consensus',
    source:'Ağır trombositopeni eşiği',
    population:'erişkin',
    note:'Kanama riski açısından değerlendirilir.' },
  { marker:'wbc', field:'red', grade:'consensus',
    source:'Nötropeni/lökositoz değerlendirme eşikleri',
    population:'erişkin' },

  /* ------------------------------------------------------------ demir */
  { marker:'ferritin', field:'ref', grade:'guideline',
    source:'DSÖ demir depo tükenmesi eşiği (<15 µg/L)',
    population:'erişkin, inflamasyon yokluğunda',
    note:'Ferritin bir akut faz proteinidir: iltihapta YÜKSELİR ve '
       + 'demir eksikliğini gizleyebilir. CRP bakılmadan yorumlanmaz.' },
  { marker:'ferritin', field:'optimal', grade:'convention',
    source:'Bu sistemin seçimi',
    population:'—',
    note:'Klinik pratikte semptomlu kişilerde sık kullanılan 30–50 µg/L '
       + 'sınırları tek bir kılavuzda birleşmez. Hedef bandı bir seçimdir; '
       + 'karar eşiği olarak kullanılamaz.' },
  { marker:'tsat', field:'ref', grade:'consensus',
    source:'Transferrin satürasyonu değerlendirme aralığı',
    population:'erişkin',
    note:'%20 altı demir eksikliği, yüksek değerler demir yüklenmesi '
       + 'yönünde değerlendirilir.' },

  /* -------------------------------------------------------- metabolik */
  { marker:'glucose', field:'ref', grade:'guideline',
    source:'ADA açlık glukozu sınıflaması',
    year:'100–125 mg/dL bozulmuş açlık glukozu, ≥126 diyabet eşiği',
    population:'gebe olmayan erişkin',
    note:'Tanı için farklı günlerde tekrar gerekir. Sistem tanı koymaz.' },
  { marker:'hba1c', field:'ref', grade:'guideline',
    source:'ADA HbA1c sınıflaması', year:'%5,7–6,4 prediyabet, ≥%6,5 diyabet',
    population:'gebe olmayan erişkin',
    note:'Anemi, hemoglobinopati ve eritrosit ömrünü değiştiren durumlar '
       + 'HbA1c\'yi yanıltır.' },
  { marker:'homa', field:'ref', grade:'observational',
    source:'HOMA-IR insülin direnci araştırma göstergesi',
    population:'değişken — eşik popülasyona göre değişir',
    note:'HOMA-IR bir ARAŞTIRMA göstergesidir; evrensel bir tanı eşiği '
       + 'yoktur. Bu yüzden yönlendirme üretmez.' },
  { marker:'tyg', field:'ref', grade:'observational',
    source:'TyG indeksi — insülin direnci ile gözlemsel ilişki',
    population:'çalışma popülasyonuna göre değişir',
    note:'Karar eşiği değildir.' },
  { marker:'eag', field:'ref', grade:'consensus',
    source:'HbA1c\'den tahmini ortalama glukoz dönüşümü (ADAG denklemi)',
    population:'erişkin',
    note:'Bu bir ÖLÇÜM değil HESAPTIR; kesinlik etiketi «hesaplandı»dır.' },

  /* ------------------------------------------------------------ lipid */
  { marker:'ldl', field:'optimal', grade:'guideline',
    source:'ESC/EAS dislipidemi kılavuzu — risk grubuna göre LDL hedefleri',
    population:'risk grubuna göre DEĞİŞİR',
    note:'Tek bir LDL hedefi yoktur: hedef kişinin kardiyovasküler risk '
       + 'grubuna bağlıdır ve o grubu hekim belirler.' },
  { marker:'hdl', field:'ref', grade:'consensus',
    source:'Düşük HDL eşikleri (erkek <40, kadın <50 mg/dL)',
    population:'erişkin' },
  { marker:'trig', field:'ref', grade:'guideline',
    source:'Trigliserit sınıflaması (<150 normal, ≥500 çok yüksek)',
    population:'erişkin, 12 saat açlık',
    note:'Tokluk ölçümü yanıltır.' },
  { marker:'trig', field:'red', grade:'guideline',
    source:'Pankreatit riski eşiği (≥1000 mg/dL)',
    population:'erişkin' },
  { marker:'tg_hdl', field:'ref', grade:'observational',
    source:'TG/HDL oranı — insülin direnci ile gözlemsel ilişki',
    population:'etnik gruba göre değişir',
    note:'Karar eşiği değildir; etnik köken eşiği belirgin biçimde kaydırır.' },
  { marker:'nonhdl', field:'optimal', grade:'guideline',
    source:'Non-HDL hedefi = LDL hedefi + 30 mg/dL (kılavuz pratiği)',
    population:'risk grubuna göre değişir' },

  /* -------------------------------------------------------- karaciğer */
  { marker:'alt', field:'ref', grade:'consensus',
    source:'ALT laboratuvar referans aralığı',
    population:'erişkin; cinsiyete göre farklı',
    note:'Referans aralıkları laboratuvarlar arasında belirgin biçimde '
       + 'değişir; kendi laboratuvarının aralığı önce gelir.' },
  { marker:'fib4', field:'ref', grade:'guideline',
    source:'FIB-4 fibrozis tarama eşikleri (<1,30 düşük risk)',
    population:'35–65 yaş; bu aralık dışında eşikler kayar',
    note:'Bir TARAMA aracıdır, tanı değil. Yüksek değer ileri tetkik '
       + 'gerektirir; sistem yalnızca hekime yönlendirir.' },
  { marker:'deritis', field:'ref', grade:'observational',
    source:'AST/ALT (De Ritis) oranı — etiyoloji ile gözlemsel ilişki',
    population:'erişkin',
    note:'Tek başına tanısal değildir.' },

  /* ----------------------------------------------------------- böbrek */
  { marker:'egfr', field:'ref', grade:'guideline',
    source:'KDIGO kronik böbrek hastalığı evrelemesi (G1–G5)',
    population:'erişkin',
    note:'Tek ölçüm evreleme yapmaz: KBH tanısı için üç ay süreklilik '
       + 'aranır. Ayrıca eGFR bir TAHMİNDİR, ölçüm değil.' },
  { marker:'creat', field:'ref', grade:'consensus',
    source:'Kreatinin laboratuvar referans aralığı',
    population:'erişkin; kas kütlesine göre değişir',
    note:'Kas kütlesi yüksek kişilerde böbrek normalken de yüksek okur.' },
  { marker:'uric', field:'ref', grade:'consensus',
    source:'Ürik asit referans aralığı ve gut riski sınırı',
    population:'erişkin' },
  { marker:'k', field:'red', grade:'guideline',
    source:'Hiperkalemi/hipokalemi acil eşikleri',
    population:'erişkin',
    note:'Potasyum aritmi riski taşır; kırmızı bayrak burada yorumlanmaz, '
       + 'doğrudan iletilir.' },
  { marker:'na', field:'red', grade:'guideline',
    source:'Ağır hiponatremi/hipernatremi eşikleri',
    population:'erişkin' },

  /* ---------------------------------------------------------- vitamin */
  { marker:'vitd', field:'ref', grade:'guideline',
    source:'Endocrine Society D vitamini sınıflaması (<20 ng/mL eksiklik, '
         + '20–29 yetersizlik)',
    population:'erişkin',
    note:'Institute of Medicine aynı sınırı daha yüksek (20 ng/mL yeterli) '
       + 'kabul eder: bu eşikte kılavuzlar AYRIŞIR ve bu ayrışma gizlenmez.' },
  { marker:'b12', field:'ref', grade:'consensus',
    source:'B12 eksiklik sınırı (<200 pg/mL) ve gri bölge (200–300)',
    population:'erişkin',
    note:'Gri bölgede metilmalonik asit ve homosistein bakılır; '
       + 'B12 tek başına yanıltır.' },
  { marker:'folate', field:'ref', grade:'consensus',
    source:'Folat eksiklik sınırı',
    population:'erişkin' },
  { marker:'zinc', field:'ref', grade:'consensus',
    source:'Çinko plazma referans aralığı',
    population:'erişkin, açlık, sabah ölçümü',
    note:'Plazma çinkosu vücut deposunu zayıf yansıtır; iltihapta düşer.' },

  /* ---------------------------------------------------------- hormon */
  { marker:'tsh', field:'ref', grade:'guideline',
    source:'TSH referans aralığı (yaygın laboratuvar aralığı 0,4–4,0 mIU/L)',
    population:'gebe olmayan erişkin',
    note:'Gebelikte aralık daha dardır ve trimestere göre değişir.' },
  { marker:'tsh', field:'optimal', grade:'convention',
    source:'Bu sistemin seçimi',
    population:'—',
    note:'"Optimal TSH" bandı kılavuzlarda tanımlı DEĞİLDİR; internette '
       + 'yaygın olan dar bantların klinik karşılığı yoktur. Bu bant bir '
       + 'karar eşiği olarak kullanılamaz.' },
  { marker:'ft4', field:'ref', grade:'consensus',
    source:'Serbest T4 laboratuvar referans aralığı',
    population:'erişkin' },
  { marker:'testo', field:'ref', grade:'guideline',
    source:'Erkekte total testosteron alt sınırı (Endocrine Society)',
    population:'erişkin erkek, sabah açlık ölçümü',
    note:'Ölçüm sabah 7–10 arası yapılır; günün ilerleyen saatinde düşer '
       + 've yanlış düşük okunur.' },
  { marker:'cortisol', field:'ref', grade:'consensus',
    source:'Sabah serum kortizol referans aralığı',
    population:'erişkin, 8:00 civarı ölçüm',
    note:'Kortizol saate son derece bağlıdır; ölçüm saati bilinmeden '
       + 'yorumlanmaz.' },

  /* ------------------------------------------------------ inflamasyon */
  { marker:'crp', field:'ref', grade:'consensus',
    source:'CRP referans sınırı',
    population:'erişkin',
    note:'Akut enfeksiyonda günler içinde çok yükselir; kronik düşük '
       + 'düzeyli yükseklik farklı bir sorudur.' },
  { marker:'crp', field:'optimal', grade:'observational',
    source:'hs-CRP kardiyovasküler risk katmanlaması (<1 düşük, 1–3 orta, '
         + '>3 yüksek)',
    population:'genel erişkin nüfus',
    note:'Risk katmanlaması bir tanı değildir.' },
  { marker:'esr', field:'ref', grade:'consensus',
    source:'Sedimentasyon referansı (yaşa ve cinsiyete göre değişir)',
    population:'erişkin',
    note:'Yaşla birlikte normal değer yükselir; sabit bir üst sınır '
       + 'yanıltıcıdır.' },

  /* ------------------------------------------------------ vücut ölçüsü */
  { marker:'waist', field:'ref', grade:'guideline',
    source:'Bel çevresi risk eşikleri (DSÖ; erkek ≥94/102, kadın ≥80/88 cm)',
    population:'Avrupa kökenli erişkin',
    note:'Eşikler ETNİK KÖKENE göre değişir: Güney Asya kökenli kişilerde '
       + 'daha düşük sınırlar kullanılır.' },
  { marker:'bodyfat', field:'ref', grade:'convention',
    source:'Bu sistemin seçimi',
    population:'—',
    note:'Ev tipi biyoempedans cihazları yağ oranını geniş bir hata payıyla '
       + 'ölçer; sabit bir sağlık eşiği koymak bilimsel değil pratik bir '
       + 'seçimdir. Aynı cihazla ölçülen DEĞİŞİM, mutlak değerden anlamlıdır.' },
  { marker:'weight', field:'optimal', grade:'convention',
    source:'Bu sistemin seçimi',
    population:'—',
    note:'Hedef kilo kişisel bir karardır; sistem onu bir sağlık eşiği '
       + 'gibi sunmaz.' },
];

/* Esigi olan ama kaynagi YAZILMAMIS olanlar da bir olcumdur; burada
   listelenmezler, SP.Ev.coverage() onlari sayar. */

/* ------------------------------------------------------ kritik değerler

   Aşağıdakilerin çoğu bir KILAVUZ eşiği değil, laboratuvarların «kritik
   değer» (panik değer) listelerinden gelir: hekimin derhal haberdar
   edilmesi gereken sonuçlar. Bu listeler kurumdan kuruma DEĞİŞİR ve tek
   bir kaynağa bağlanmaz — bu yüzden derece 'consensus'tur, 'guideline'
   değil. Fark önemlidir: sistem bu eşiklerde hekime yönlendirebilir ama
   «şu sınırın üstü hastalıktır» diyemez.

   Kılavuz karşılığı olan birkaçı ayrıca işaretlenmiştir. */
SP.EVIDENCE = SP.EVIDENCE.concat([

  { marker:'dbp', field:'red', grade:'consensus',
    source:'Laboratuvar/klinik kritik değer pratiği',
    population:'erişkin',
    note:'Çok düşük diyastolik basınç, tek başına değil belirtiyle birlikte '
       + 'değerlendirilir.' },
  { marker:'rhr', field:'red', grade:'consensus',
    source:'Bradikardi/taşikardi değerlendirme eşikleri',
    population:'erişkin, istirahat',
    note:'Antrene kişilerde düşük nabız normaldir; eşik belirtiyle birlikte '
       + 'anlam kazanır.' },

  { marker:'hct', field:'red', grade:'consensus',
    source:'Laboratuvar kritik değer listesi pratiği',
    population:'erişkin' },
  { marker:'ferritin', field:'red', grade:'consensus',
    source:'Ağır demir eksikliği ve demir yüklenmesi değerlendirme sınırları',
    population:'erişkin',
    note:'Yüksek ferritin demir yüklenmesi kadar iltihabın da işareti '
       + 'olabilir; ikisi ayırt edilmeden yorumlanmaz.' },
  { marker:'tsat', field:'red', grade:'consensus',
    source:'Transferrin satürasyonu uç değer sınırları',
    population:'erişkin' },

  { marker:'glucose', field:'red', grade:'guideline',
    source:'ADA hipoglisemi sınıflaması — düzey 2 (<54 mg/dL)',
    population:'erişkin',
    note:'Düzey 2 hipoglisemi klinik olarak anlamlı kabul edilir.' },
  { marker:'hba1c', field:'red', grade:'guideline',
    source:'ADA diyabet tanı eşiği (≥%6,5)',
    population:'gebe olmayan erişkin',
    note:'Eşiğin aşılması TANI DEĞİLDİR; doğrulama ve hekim değerlendirmesi '
       + 'gerektiren bir bulgudur.' },
  { marker:'insulin', field:'red', grade:'consensus',
    source:'Açlık insülini uç değer sınırı',
    population:'erişkin',
    note:'Açlık insülini ölçümü laboratuvarlar arasında standart değildir.' },

  { marker:'chol', field:'red', grade:'consensus',
    source:'Ağır hiperkolesterolemi değerlendirme sınırı',
    population:'erişkin' },
  { marker:'ldl', field:'red', grade:'guideline',
    source:'Ağır hiperkolesterolemi eşiği (LDL ≥190 mg/dL) — ailevi '
         + 'hiperkolesterolemi taramasında kullanılan sınır',
    population:'erişkin',
    note:'Bu sınır, aile öyküsüyle birlikte değerlendirilmesi gereken '
       + 'bir bulgudur.' },
  { marker:'hdl', field:'red', grade:'consensus',
    source:'Çok düşük HDL değerlendirme sınırı',
    population:'erişkin' },
  { marker:'nonhdl', field:'red', grade:'consensus',
    source:'Non-HDL uç değer sınırı (LDL sınırına +30 mg/dL kuralıyla türetilir)',
    population:'erişkin' },

  { marker:'alt', field:'red', grade:'consensus',
    source:'Transaminaz yükselmesi değerlendirme sınırı (üst sınırın ~3 katı)',
    population:'erişkin',
    note:'Yoğun egzersiz sonrası da yükselebilir; kas kaynaklı yükselmede '
       + 'CK birlikte bakılır.' },
  { marker:'ast', field:'red', grade:'consensus',
    source:'Transaminaz yükselmesi değerlendirme sınırı',
    population:'erişkin',
    note:'AST kasta da bulunur; tek başına karaciğere işaret etmez.' },
  { marker:'ggt', field:'red', grade:'consensus',
    source:'GGT belirgin yükselme sınırı',
    population:'erişkin' },
  { marker:'alb', field:'red', grade:'consensus',
    source:'Ağır hipoalbüminemi sınırı',
    population:'erişkin' },
  { marker:'fib4', field:'red', grade:'guideline',
    source:'FIB-4 yüksek risk eşiği (>3,25) — ileri fibrozis taraması',
    population:'35–65 yaş',
    note:'Tarama eşiğidir; tanı için görüntüleme/elastografi gerekir.' },

  { marker:'creat', field:'red', grade:'consensus',
    source:'Kreatinin kritik değer pratiği',
    population:'erişkin',
    note:'Tek yüksek ölçüm akut mu kronik mi olduğunu söylemez; önceki '
       + 'değerle karşılaştırılır.' },
  { marker:'urea', field:'red', grade:'consensus',
    source:'Üre kritik değer pratiği', population:'erişkin' },
  { marker:'uric', field:'red', grade:'consensus',
    source:'Belirgin hiperürisemi sınırı', population:'erişkin' },
  { marker:'egfr', field:'red', grade:'guideline',
    source:'KDIGO evre G3b sınırı (<45 mL/dk/1,73 m²)',
    population:'erişkin',
    note:'Evreleme için üç ay süreklilik gerekir; tek ölçüm evre koymaz.' },

  { marker:'ca', field:'red', grade:'consensus',
    source:'Kalsiyum kritik değer listesi pratiği', population:'erişkin',
    note:'Albümin düşükse düzeltilmiş kalsiyum bakılır.' },
  { marker:'ca_corr', field:'red', grade:'consensus',
    source:'Düzeltilmiş kalsiyum kritik sınırları', population:'erişkin',
    note:'Bu bir ÖLÇÜM değil HESAPTIR: albümine göre düzeltilmiş değerdir.' },
  { marker:'mg', field:'red', grade:'consensus',
    source:'Hipomagnezemi sınırı', population:'erişkin' },

  { marker:'vitd', field:'red', grade:'guideline',
    source:'Ağır D vitamini eksikliği (<10 ng/mL) ve toksisite sınırı',
    population:'erişkin' },
  { marker:'b12', field:'red', grade:'consensus',
    source:'Belirgin B12 eksikliği sınırı', population:'erişkin' },
  { marker:'folate', field:'red', grade:'consensus',
    source:'Folat eksikliği sınırı', population:'erişkin' },

  { marker:'tsh', field:'red', grade:'consensus',
    source:'Belirgin tiroit işlev bozukluğu sınırları (<0,1 ve >10 mIU/L)',
    population:'gebe olmayan erişkin',
    note:'Bu sınırlar aşikâr hipo/hipertiroidi yönünde bulgu sayılır; '
       + 'serbest hormonlarla birlikte değerlendirilir.' },
  { marker:'cortisol', field:'red', grade:'consensus',
    source:'Sabah kortizol uç değer sınırı', population:'erişkin, sabah ölçümü' },

  { marker:'crp', field:'red', grade:'consensus',
    source:'Belirgin akut faz yanıtı sınırı (>10 mg/L)', population:'erişkin' },
  { marker:'esr', field:'red', grade:'consensus',
    source:'Belirgin sedimentasyon yüksekliği sınırı', population:'erişkin',
    note:'Yaşla birlikte normal üst sınır yükselir.' },
]);
