/* Besin ogesi sozlugu — Modul 2'nin referans kaynagi.

   Her ogenin birimi, gunluk referans alimi (RDA/AI), ust siniri (UL) ve
   emilimi etkileyen etkenleri burada durur. Gida tablosu (data/foods.js)
   yalnizca bu anahtarlari kullanir; yeni bir ogeye once burada yer acilir.

   RDA degerleri yasa ve cinsiyete gore degisir. Okuma daima
   SP.Nutri.targetFor(profil) uzerinden yapilir; tablo dogrudan okunmaz.

   `absorb` alani biyoyararlanimi tarif eder ve Modul 2'nin "sadece ne kadar
   aldin degil, ne kadarini kullanabildin" sorusunu cevaplar:
     boost   emilimi artiran ogeler / birlikte yenmesi gerekenler
     block   emilimi bozan ogeler
     factor  varsayilan emilim carpani (1 = tam) */

window.SP = window.SP || {};

/* Makro hedefleri gram/kg cinsinden tutulur; mutlak gram profile gore
   hesaplanir. Aralik verilir cunku tek dogru sayi yoktur. */
SP.MACRO_RULES = {
  protein:{
    /* Hedefe gore g/kg. Kilo verirken protein yukselir: kas korunur. */
    byGoal:{ maintain:[1.4, 1.8], cut:[1.8, 2.2], gain:[1.6, 2.0], health:[1.2, 1.6] },
    note:'Vücut ağırlığının kilogramı başına. Kilo verirken üst banda yaklaşılır: '
       + 'açık verirken kaybedilen dokunun kas değil yağ olmasını sağlayan tek ayar budur.',
  },
  fat:{
    /* Toplam kalorinin yuzdesi. Alt sinir hormon uretimi icin gerekli. */
    pctRange:[25, 35], minPerKg:0.6,
    note:'Toplam kalorinin yüzdesi. %20 altına inmek yağda çözünen vitaminlerin '
       + 'emilimini ve hormon üretimini bozar.',
  },
  carb:{
    /* Kalan kalori karbonhidrata gider; antrenman gununde ust banda kayar. */
    note:'Protein ve yağ ayrıldıktan sonra kalan kalori. Ağır antrenman gününde artar, '
       + 'dinlenme gününde düşer.',
  },
  fiber:{
    perKcal:14 / 1000,   /* 1000 kcal basina 14 g */
    min:25, max:50,
    note:'Her 1000 kalori için 14 gram. LDL ve açlık kan şekeri üzerinde '
       + 'tek başına ölçülebilir etkisi olan besin öğesidir.',
  },
};

/* Aktivite carpanlari — gunluk enerji ihtiyacinin taban hesabi icin. */
SP.ACTIVITY_LEVELS = [
  { id:'sedentary', label:'Hareketsiz',      factor:1.25, note:'Masa başı, planlı antrenman yok' },
  { id:'light',     label:'Hafif hareketli', factor:1.4,  note:'Haftada 1–2 antrenman ya da bol yürüyüş' },
  { id:'moderate',  label:'Orta',            factor:1.55, note:'Haftada 3–4 antrenman' },
  { id:'active',    label:'Aktif',           factor:1.72, note:'Haftada 5–6 antrenman' },
  { id:'athlete',   label:'Çok aktif',       factor:1.9,  note:'Günde iki idman ya da ağır bedensel iş' },
];

SP.GOALS = [
  { id:'health',   label:'Sağlığı korumak', deficit:0,     note:'Kalori dengede; öncelik mikro besin ve tahlil' },
  { id:'maintain', label:'Kiloyu korumak',  deficit:0,     note:'Enerji dengesi korunur' },
  { id:'cut',      label:'Yağ kaybetmek',   deficit:-0.18, note:'İhtiyacın %18 altı — haftada ~0,5 kg' },
  { id:'gain',     label:'Kas kazanmak',    deficit:0.12,  note:'İhtiyacın %12 üstü — yavaş ve kontrollü' },
];

SP.NUTRIENTS = [
  { id:'iron', name:'Demir', unit:'mg', panel:'mineral',
    rda:{ male:8, female:18, female50:8, teenM:11, teenF:15 }, ul:45,
    marker:'ferritin',
    absorb:{ factor:0.15, boost:['vitc','protein'], block:['calcium','tannin','phytate'],
      note:'Bitkisel demir (non-hem) tek başına yaklaşık %5 emilir. Aynı öğünde C vitamini '
         + 'emilimi 3 katına çıkarır; çay ve kahve aynı öğünde emilimi yarıya indirir.' },
    note:'Oksijen taşınmasının hammaddesi. Eksikliği önce dayanıklılığı, sonra dikkati bozar.' },

  { id:'vitc', name:'C vitamini', unit:'mg', panel:'vitamin',
    rda:{ male:90, female:75, smoker:125 }, ul:2000,
    absorb:{ factor:0.8, block:['heat'],
      note:'Isıya duyarlıdır: uzun pişirme %50\'ye varan kayıp yapar. '
         + 'Demir emilimi için çiğ ya da az pişmiş kaynak gerekir.' },
    note:'Bitkisel demirin emilimini açan anahtar. Depolanmaz, her gün gerekir.' },

  { id:'calcium', name:'Kalsiyum', unit:'mg', panel:'mineral',
    rda:{ male:1000, female:1000, over50:1200, teen:1300 }, ul:2500,
    marker:'ca',
    absorb:{ factor:0.3, boost:['vitd'], block:['phytate','oxalate'],
      note:'D vitamini olmadan emilim %10-15\'e düşer. Demir takviyesiyle aynı öğünde alınmaz.' },
    note:'Kemik dışında kas kasılması ve sinir iletimi için de gerekir.' },

  { id:'vitd', name:'D vitamini', unit:'µg', panel:'vitamin',
    rda:{ male:15, female:15, over70:20 }, ul:100,
    marker:'vitd',
    absorb:{ factor:0.6, boost:['fat'],
      note:'Yağda çözünür. Yağsız bir öğünle alındığında emilimi belirgin düşer; '
         + 'zeytinyağlı ya da yumurtalı bir öğünle eşleştirilir.' },
    note:'Kalsiyum emiliminin ve bağışıklığın anahtarı. Güneş görmeyen aylarda gıdadan gelmesi gerekir.' },

  { id:'b12', name:'B12 vitamini', unit:'µg', panel:'vitamin',
    rda:{ male:2.4, female:2.4, pregnant:2.6 }, ul:null,
    marker:'b12',
    absorb:{ factor:0.5, block:['antacid'],
      note:'Yalnızca hayvansal kaynaklarda bulunur. Mide asidini düşüren ilaçlar emilimi bozar.' },
    note:'Sinir sistemi ve kan yapımı. Eksikliği aylar sonra ortaya çıkar, hızlı düzelmez.' },

  { id:'folate', name:'Folat', unit:'µg', panel:'vitamin',
    rda:{ male:400, female:400, pregnant:600 }, ul:1000,
    marker:'folate',
    absorb:{ factor:0.6, block:['heat'],
      note:'Uzun pişirmede kaybı yüksektir. Yeşil yapraklı sebze buharda ya da az pişirilir.' },
    note:'Hücre yenilenmesi. B12 ile birlikte okunur; biri eksikken diğerini gizleyebilir.' },

  { id:'magnesium', name:'Magnezyum', unit:'mg', panel:'mineral',
    rda:{ male:400, female:310, over30M:420, over30F:320 }, ul:350,
    marker:'mg',
    absorb:{ factor:0.4, block:['phytate'],
      note:'Üst sınır yalnızca takviye içindir; gıdadan gelen magnezyum sınırlanmaz.' },
    note:'Kas gevşemesi, uyku kalitesi ve enerji üretimi. Terleme ile kaybı yüksektir.' },

  { id:'zinc', name:'Çinko', unit:'mg', panel:'mineral',
    rda:{ male:11, female:8 }, ul:40,
    marker:'zinc',
    absorb:{ factor:0.3, block:['phytate','calcium'], boost:['protein'],
      note:'Tam tahıl ve bakliyattaki fitat emilimi düşürür; ıslatma ve mayalama kaybı azaltır.' },
    note:'Bağışıklık, yara iyileşmesi ve tat duyusu.' },

  { id:'potassium', name:'Potasyum', unit:'mg', panel:'mineral',
    rda:{ male:3400, female:2600 }, ul:null,
    marker:'k',
    absorb:{ factor:0.9,
      note:'Emilimi yüksektir. Tansiyonu düşüren etkisi sodyum alımıyla birlikte değerlendirilir.' },
    note:'Sodyumun karşı ağırlığı. Tansiyon yönetiminde tuz kısıtlamasından daha etkili olabilir.' },

  { id:'sodium', name:'Sodyum', unit:'mg', panel:'mineral',
    rda:{ male:1500, female:1500 }, ul:2300, limit:true,
    marker:'na',
    absorb:{ factor:1,
      note:'Hedef değil sınırdır: hedefin altında kalmak istenir.' },
    note:'İhtiyaç düşüktür; sorun eksiklik değil fazlalıktır. Terleyen sporcuda sınır yükselir.' },

  { id:'omega3', name:'Omega-3 (EPA+DHA)', unit:'g', panel:'yag',
    rda:{ male:1.6, female:1.1 }, ul:5,
    marker:'trig',
    absorb:{ factor:0.8, boost:['fat'],
      note:'Bitkisel omega-3 (ALA) EPA/DHA\'ya yalnızca %5-10 oranında dönüşür; '
         + 'keten tohumu balığın birebir yerini tutmaz.' },
    note:'Trigliserit ve sistemik yangı üzerinde doğrudan etkili. Haftada iki porsiyon yağlı balık yeterlidir.' },

  { id:'fiber', name:'Lif', unit:'g', panel:'makro',
    rda:{ male:38, female:25 }, ul:null,
    marker:'ldl',
    absorb:{ factor:1,
      note:'Emilmez; etkisi bağırsakta olur. Ani artış şişkinlik yapar, kademeli artırılır.' },
    note:'LDL ve açlık kan şekerini birlikte düşüren tek besin öğesi.' },

  { id:'selenium', name:'Selenyum', unit:'µg', panel:'mineral',
    rda:{ male:55, female:55 }, ul:400,
    marker:'tsh',
    absorb:{ factor:0.8,
      note:'Üst sınıra yakın alım zararlıdır; birkaç Brezilya cevizi günlük ihtiyacı karşılar.' },
    note:'Tiroid hormonunun aktifleşmesi için gerekir.' },

  { id:'iodine', name:'İyot', unit:'µg', panel:'mineral',
    rda:{ male:150, female:150, pregnant:220 }, ul:1100,
    marker:'tsh',
    absorb:{ factor:0.9,
      note:'İyotlu tuz açık kapta ve ısıda iyodunu kaybeder; kapalı kapta saklanır, '
         + 'yemeğin sonunda eklenir.' },
    note:'Tiroid hormonunun hammaddesi.' },

  { id:'protein', name:'Protein', unit:'g', panel:'makro',
    rda:null, ul:null, marker:'alb',
    absorb:{ factor:0.9,
      note:'Öğün başına 30-40 gramın üzeri kas yapımı için ek fayda getirmez; güne yayılır.' },
    note:'Kas, enzim ve bağışıklık hücrelerinin hammaddesi.' },
];

SP.NUTRI_BY_ID = SP.NUTRIENTS.reduce(function(acc, n){ acc[n.id] = n; return acc; }, {});

/* Emilimi etkileyen etkenlerin okunabilir adlari — ogun analizinde kullanilir. */
SP.ABSORB_FACTORS = {
  vitc:{ name:'C vitamini', kind:'boost', text:'demir emilimini 3 katına çıkarır' },
  fat:{ name:'Yağ', kind:'boost', text:'yağda çözünen vitaminleri taşır' },
  protein:{ name:'Hayvansal protein', kind:'boost', text:'demir ve çinko emilimini artırır' },
  vitd:{ name:'D vitamini', kind:'boost', text:'kalsiyum emilimini açar' },
  tannin:{ name:'Çay/kahve tanenleri', kind:'block', text:'demir emilimini yarıya indirir' },
  phytate:{ name:'Fitat', kind:'block', text:'mineral emilimini düşürür; ıslatma azaltır' },
  oxalate:{ name:'Oksalat', kind:'block', text:'kalsiyumu bağlar' },
  calcium:{ name:'Kalsiyum', kind:'block', text:'aynı öğünde demir ve çinko emilimini bozar' },
  heat:{ name:'Uzun pişirme', kind:'block', text:'ısıya duyarlı vitaminleri kaybettirir' },
  antacid:{ name:'Mide asidi düşürücü', kind:'block', text:'B12 emilimini bozar' },
};
