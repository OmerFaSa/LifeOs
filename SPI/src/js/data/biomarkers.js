/* Biyobelirtec sozlugu — Modul 1'in referans kaynagi.

   Her satir bir olcumu tanimlar: birimi, laboratuvar referans araligi, hedef
   bant, kirmizi bayrak esigi ve hangi besinle iliskili oldugu.

   Uc alan birbirine karistirilmamalidir:

     ref      Laboratuvarin "normal" dedigi genis aralik. Disina cikmak
              incelenmesi gereken bir bulgudur.
     optimal  Hedef bant. Referans araligi icinde ama hedefin disindaysa
              bu bir uyari degil, yalnizca iyilestirme alanidir.
     red      Kirmizi bayrak. Bu esigin otesinde sistem yorum yapmaz;
              dogrudan hekime yonlendirir.

   Cinsiyete gore degisen araliklar { male:[...], female:[...] } bicimindedir;
   degismeyenler duz dizi olarak yazilir. Okuma daima SP.Bio.refFor() ile
   yapilir, dogrudan alan okunmaz.

   `dir` degerin hangi yonde iyi oldugunu soyler:
     'mid'   bandin ortasi iyi (cogu olcum)
     'low'   dusuk olmasi iyi (LDL, trigliserit, CRP)
     'high'  yuksek olmasi iyi (HDL, D vitamini, HRV)

   `aliases` tahlil ayristiricisinin (core/parse.js) esleme anahtarlaridir.
   Turkce ve Ingilizce yazimlar, kisaltmalar ve yaygin hatali yazimlar
   buraya eklenir. Esleme SP.U.norm() ile aksansiz yapilir. */

window.SP = window.SP || {};

/* Panel adlari ve notlari EKRANDA gorunur; bu yuzden duzgun Turkce yazilir.
   Kod yorumlari ASCII kalabilir, kullaniciya giden metin kalamaz. */
SP.PANELS = [
  { id:'vital',      name:'Vital bulgular',      note:'Evde ölçülebilen günlük değerler' },
  { id:'body',       name:'Vücut ölçüleri',      note:'Kilo, çevre ve bileşim' },
  { id:'hemogram',   name:'Hemogram',            note:'Tam kan sayımı' },
  { id:'iron',       name:'Demir paneli',        note:'Depo ve taşıma kapasitesi' },
  { id:'metabolic',  name:'Şeker metabolizması', note:'Glukoz, insülin ve direnç' },
  { id:'lipid',      name:'Lipid paneli',        note:'Kolesterol ve trigliserit' },
  { id:'liver',      name:'Karaciğer',           note:'Enzimler ve protein' },
  { id:'kidney',     name:'Böbrek',              note:'Atık ürünler ve süzme hızı' },
  { id:'electro',    name:'Elektrolitler',       note:'Mineral dengesi' },
  { id:'vitamin',    name:'Vitamin ve mineral',  note:'Depo durumu' },
  { id:'hormone',    name:'Hormonlar',           note:'Tiroit ve steroit' },
  { id:'inflam',     name:'İnflamasyon',         note:'Sistemik yangı belirteçleri' },
];

SP.BIOMARKERS = [

  /* ---------------------------------------------------------------- vital */
  { id:'sbp', name:'Sistolik tansiyon', unit:'mmHg', panel:'vital', dir:'mid',
    ref:[90, 130], optimal:[105, 120], red:{ below:85, above:180 }, daily:true,
    aliases:['sistolik','buyuk tansiyon','sbp','systolic'],
    nutrients:['sodium','potassium','magnesium'],
    note:'Kalbin kasilma anindaki basinc. Tek olcum karar vermez; 7 gunluk ortalama okunur.' },

  { id:'dbp', name:'Diyastolik tansiyon', unit:'mmHg', panel:'vital', dir:'mid',
    ref:[60, 85], optimal:[65, 80], red:{ below:50, above:110 }, daily:true,
    aliases:['diyastolik','kucuk tansiyon','dbp','diastolic'],
    nutrients:['sodium','potassium','magnesium'],
    note:'Kalbin gevseme anindaki basinc.' },

  { id:'rhr', name:'İstirahat nabzı', unit:'atım/dk', panel:'vital', dir:'low',
    ref:[45, 85], optimal:[48, 62], red:{ below:38, above:110 }, daily:true,
    aliases:['istirahat nabzi','dinlenme nabzi','rhr','resting heart rate','nabiz'],
    nutrients:['iron'],
    note:'Sabah yataktan kalkmadan olculur. Yukselmesi yorgunluk ya da hastalik habercisidir.' },

  { id:'hrv', name:'Kalp atım değişkenliği', unit:'ms', panel:'vital', dir:'high',
    ref:[20, 120], optimal:[55, 120], red:{}, daily:true,
    aliases:['hrv','rmssd','kalp atim degiskenligi'],
    nutrients:['magnesium','omega3'],
    note:'Otonom sinir sisteminin toparlanma isareti. Kisiye ozeldir; baskasiyla karsilastirilmaz.' },

  { id:'spo2', name:'Oksijen satürasyonu', unit:'%', panel:'vital', dir:'high',
    ref:[94, 100], optimal:[96, 100], red:{ below:90 }, daily:true,
    aliases:['spo2','oksijen saturasyonu','satürasyon','oksijen'],
    nutrients:['iron'],
    note:'Parmak probu ile olculur. %90 altinda beklemeden hekime basvurulur.' },

  { id:'temp', name:'Vücut sıcaklığı', unit:'°C', panel:'vital', dir:'mid',
    ref:[36.1, 37.2], optimal:[36.3, 36.9], red:{ below:35, above:38.5 }, daily:true,
    aliases:['ates','vucut sicakligi','temp','sicaklik'],
    nutrients:[], nutrientWhy:'Vücut sıcaklığını bir besin öğesi belirlemez; enfeksiyon ve döngü belirler.',
    note:'38,5 uzerinde antrenman yapilmaz; sistem o gun yuku sifirlar.' },

  { id:'sleep', name:'Uyku süresi', unit:'saat', panel:'vital', dir:'mid',
    ref:[6, 9.5], optimal:[7, 8.5], red:{}, daily:true,
    aliases:['uyku','uyku suresi','sleep'],
    nutrients:['magnesium'],
    note:'Toparlanmanin tek en guclu belirleyicisi. Yediginden de antrenmanindan da onceliklidir.' },

  /* ------------------------------------------------------------------ vucut */
  { id:'weight', name:'Kilo', unit:'kg', panel:'body', dir:'mid',
    ref:[35, 200], optimal:null, red:{}, daily:true, personal:true,
    aliases:['kilo','agirlik','weight'],
    nutrients:[], nutrientWhy:'Kiloyu tek bir besin öğesi değil enerji dengesi belirler; makro hedefleri zaten ayrı durur.',
    note:'Hedef bant kisiye gore hesaplanir; tek bir "dogru kilo" yoktur.' },

  { id:'waist', name:'Bel çevresi', unit:'cm', panel:'body', dir:'low',
    ref:{ male:[70, 102], female:[62, 88] },
    optimal:{ male:[75, 94], female:[65, 80] },
    red:{}, aliases:['bel','bel cevresi','waist'],
    nutrients:[], nutrientWhy:'Bel çevresi enerji dengesi ve dağılımın sonucudur, tek bir öğenin değil.',
    note:'Ic yag icin kilodan daha iyi bir gostergedir. Gobek deligi hizasindan olculur.' },

  { id:'bodyfat', name:'Vücut yağ oranı', unit:'%', panel:'body', dir:'low',
    ref:{ male:[6, 30], female:[14, 40] },
    optimal:{ male:[10, 18], female:[20, 28] },
    red:{}, aliases:['yag orani','vucut yag','body fat','bodyfat'],
    nutrients:[], nutrientWhy:'Yağ oranı enerji dengesinin sonucudur; tek bir besin öğesine bağlanamaz.',
    note:'Biyoempedans tartilari gunluk suya gore sapar; haftalik ortalama okunur.' },

  /* --------------------------------------------------------------- hemogram */
  { id:'hgb', name:'Hemoglobin', unit:'g/dL', panel:'hemogram', dir:'mid',
    ref:{ male:[13.5, 17.5], female:[12.0, 15.5] },
    optimal:{ male:[14.5, 16.5], female:[13.0, 14.8] },
    red:{ below:9, above:19 },
    nutrients:['iron','b12','folate'],
    aliases:['hemoglobin','hgb','hb'],
    note:'Kanin oksijen tasima kapasitesi. Dususu once dayanikligi, sonra dikkati bozar.' },

  { id:'hct', name:'Hematokrit', unit:'%', panel:'hemogram', dir:'mid',
    ref:{ male:[40, 52], female:[36, 46] },
    optimal:{ male:[43, 50], female:[38, 44] },
    red:{ below:28, above:57 },
    aliases:['hematokrit','hct'],
    nutrients:['iron','b12','folate'],
    note:'Kanin hucre orani. Susuz kalindiginda yapay olarak yukselir.' },

  { id:'mcv', name:'MCV', unit:'fL', panel:'hemogram', dir:'mid',
    ref:[80, 100], optimal:[85, 95], red:{},
    nutrients:['b12','folate','iron'],
    aliases:['mcv','ortalama eritrosit hacmi'],
    note:'Kucukse demir, buyukse B12/folat eksikligini isaret eder. Ferritinle birlikte okunur.' },

  { id:'rdw', name:'RDW', unit:'%', panel:'hemogram', dir:'low',
    ref:[11.5, 15], optimal:[11.5, 13.5], red:{},
    aliases:['rdw'],
    nutrients:['iron','b12','folate'],
    note:'Alyuvar boyutlarindaki dagilim. Erken demir eksikliginde ferritinden once yukselebilir.' },

  { id:'wbc', name:'Lökosit', unit:'10³/µL', panel:'hemogram', dir:'mid',
    ref:[4.0, 10.5], optimal:[4.5, 8.5], red:{ below:2.5, above:20 },
    aliases:['lokosit','wbc','beyaz kure','akyuvar'],
    nutrients:['zinc','protein'],
    note:'Bagisiklik hucreleri. Ani yukselisler enfeksiyon isaretidir.' },

  { id:'plt', name:'Trombosit', unit:'10³/µL', panel:'hemogram', dir:'mid',
    ref:[150, 400], optimal:[180, 350], red:{ below:80, above:700 },
    aliases:['trombosit','plt','platelet'],
    nutrients:['b12','folate'],
    note:'Pihtilasma hucreleri.' },

  /* ------------------------------------------------------------------ demir */
  { id:'ferritin', name:'Ferritin', unit:'ng/mL', panel:'iron', dir:'mid',
    ref:{ male:[30, 400], female:[13, 150] },
    optimal:{ male:[80, 250], female:[50, 150] },
    red:{ below:10, above:1000 },
    nutrients:['iron','vitc'],
    aliases:['ferritin'],
    note:'Demir deposu. Referans araliginin alt ucu depo tukenmis demektir; '
       + 'yorgunluk cogu zaman anemiden once burada gorunur.' },

  { id:'iron_s', name:'Serum demir', unit:'µg/dL', panel:'iron', dir:'mid',
    ref:[60, 170], optimal:[80, 150], red:{},
    nutrients:['iron'],
    aliases:['serum demir','demir','iron','fe'],
    note:'Anlik kan demiri. Gun icinde cok oynar; tek basina karar verdirmez.' },

  { id:'tibc', name:'Demir bağlama kapasitesi', unit:'µg/dL', panel:'iron', dir:'mid',
    ref:[250, 450], optimal:[280, 400], red:{},
    aliases:['tibc','demir baglama','total demir baglama kapasitesi'],
    nutrients:['iron'],
    note:'Depo bosaldikca yukselir.' },

  { id:'tsat', name:'Transferrin satürasyonu', unit:'%', panel:'iron', dir:'mid',
    ref:[20, 50], optimal:[25, 45], red:{ below:10, above:60 },
    derived:'tsat', aliases:['transferrin saturasyonu','tsat'],
    nutrients:['iron','vitc'],
    note:'Serum demirin baglama kapasitesine orani. Serum demir ve TIBC girildiginde kendiliginden hesaplanir.' },

  /* -------------------------------------------------------------- metabolik */
  { id:'glucose', name:'Açlık glukozu', unit:'mg/dL', panel:'metabolic', dir:'mid',
    ref:[70, 99], optimal:[75, 90], red:{ below:54, above:126 },
    aliases:['aclik glukozu','glukoz','aclik kan sekeri','glikoz','glucose','akş'],
    nutrients:['fiber','magnesium'],
    note:'126 ve uzeri tek basina taniya yeter degil ama hekim gorusmesi gerektirir.' },

  { id:'hba1c', name:'HbA1c', unit:'%', panel:'metabolic', dir:'low',
    ref:[4.0, 5.6], optimal:[4.6, 5.3], red:{ above:6.5 },
    aliases:['hba1c','a1c','glikozillenmis hemoglobin'],
    nutrients:['fiber','magnesium'],
    note:'Son 3 ayin ortalama kan sekeri. Tek gunun kacamagi bunu degistirmez, aliskanlik degistirir.' },

  { id:'insulin', name:'Açlık insülini', unit:'µIU/mL', panel:'metabolic', dir:'low',
    ref:[2.6, 24.9], optimal:[2.6, 8], red:{ above:30 },
    aliases:['insulin','aclik insulini','insülin'],
    nutrients:['fiber','magnesium'],
    note:'Referans araligi genistir; hedef bant cok daha dardir.' },

  { id:'homa', name:'HOMA-IR', unit:'', panel:'metabolic', dir:'low',
    ref:[0, 2.5], optimal:[0.5, 1.8], red:{ above:5 },
    derived:'homa', aliases:['homa','homa-ir','insulin direnci'],
    nutrients:[], nutrientWhy:'Türetilmiş indeks: bağı girdilerinden (glukoz, insülin) gelir; ikinci kez sayılmaz.',
    note:'Insulin direnci endeksi. Aclik glukozu ve insulin girildiginde kendiliginden hesaplanir.' },

  /* ------------------------------------------------------------------ lipid */
  { id:'eag', name:'Ortalama glukoz (eAG)', unit:'mg/dL', panel:'metabolic', dir:'low',
    ref:[70, 154], optimal:[70, 114], red:{ above:240 },
    derived:'eag', aliases:['eag','ortalama glukoz','tahmini ortalama glukoz'],
    nutrients:[], nutrientWhy:'Türetilmiş indeks: bağı HbA1c\'den gelir.',
    note:'HbA1c\'nin gündelik dildeki karşılığı: son üç ayın ortalama kan şekeri. Tek bir ölçüm değil, ortalamadır.' },

  { id:'tyg', name:'TyG indeksi', unit:'', panel:'metabolic', dir:'low',
    ref:[7, 9.5], optimal:[7, 8.5], red:{ above:10 },
    derived:'tyg', aliases:['tyg','trigliserit glukoz indeksi'],
    nutrients:[], nutrientWhy:'Türetilmiş indeks: bağı trigliserit ve glukozdan gelir.',
    note:'Açlık insülini ölçülmediğinde insülin direncinin yerini tutar. Trigliserit ve açlık glukozundan hesaplanır.' },

  { id:'chol', name:'Total kolesterol', unit:'mg/dL', panel:'lipid', dir:'low',
    ref:[120, 200], optimal:[140, 190], red:{ above:320 },
    aliases:['total kolesterol','kolesterol','cholesterol'],
    nutrients:['fiber','omega3'],
    note:'Tek basina zayif bir gostergedir; LDL ve trigliseritle birlikte okunur.' },

  { id:'ldl', name:'LDL kolesterol', unit:'mg/dL', panel:'lipid', dir:'low',
    ref:[0, 130], optimal:[50, 100], red:{ above:190 },
    nutrients:['fiber','omega3'],
    aliases:['ldl','ldl kolesterol','kotu kolesterol'],
    note:'Damar duvarinda birikebilen tasiyici. Lifli beslenme ve doymus yag azaltmasi dogrudan etkiler.' },

  { id:'hdl', name:'HDL kolesterol', unit:'mg/dL', panel:'lipid', dir:'high',
    ref:{ male:[40, 90], female:[50, 100] },
    optimal:{ male:[50, 80], female:[60, 90] },
    red:{ below:25 },
    aliases:['hdl','hdl kolesterol','iyi kolesterol'],
    nutrients:['omega3'],
    note:'Duzenli hareketle yukselen tek lipid degeridir.' },

  { id:'trig', name:'Trigliserit', unit:'mg/dL', panel:'lipid', dir:'low',
    ref:[0, 150], optimal:[50, 100], red:{ above:500 },
    nutrients:['omega3'],
    aliases:['trigliserit','trigliserid','tg','triglyceride'],
    note:'Sivi sekere ve rafine karbonhidrata en hizli tepki veren degerdir.' },

  { id:'tg_hdl', name:'Trigliserit / HDL', unit:'oran', panel:'lipid', dir:'low',
    ref:[0, 3.5], optimal:[0, 2], red:{ above:6 },
    derived:'tg_hdl', aliases:['tg/hdl','trigliserit hdl orani'],
    nutrients:[], nutrientWhy:'Türetilmiş oran: bağı trigliserit ve HDL\'den gelir.',
    note:'İnsülin direncinin en ucuz göstergesi. 2 altı iyi, 3 üstü dikkat ister. Aç karnına alınan kandan hesaplanır.' },

  { id:'nonhdl', name:'Non-HDL kolesterol', unit:'mg/dL', panel:'lipid', dir:'low',
    ref:[0, 160], optimal:[60, 130], red:{ above:220 },
    derived:'nonhdl', aliases:['non-hdl','non hdl'],
    nutrients:[], nutrientWhy:'Türetilmiş değer: bağı kolesterol ve HDL\'den gelir.',
    note:'Total kolesterolden HDL cikarilir. Riski LDL\'den daha iyi ozetler.' },

  /* -------------------------------------------------------------- karaciger */
  { id:'alt', name:'ALT', unit:'U/L', panel:'liver', dir:'low',
    ref:{ male:[0, 41], female:[0, 33] },
    optimal:{ male:[10, 30], female:[8, 25] },
    red:{ above:120 },
    aliases:['alt','sgpt','alanin aminotransferaz'],
    nutrients:['omega3','fiber'],
    note:'Karaciger hucre enzimi. Yagli karacigerde sessizce yukselir.' },

  { id:'ast', name:'AST', unit:'U/L', panel:'liver', dir:'low',
    ref:[0, 40], optimal:[10, 30], red:{ above:120 },
    aliases:['ast','sgot','aspartat aminotransferaz'],
    nutrients:['omega3','fiber'],
    note:'Agir antrenmandan sonra gecici yukselir; olcum antrenmansiz gunde yapilir.' },

  { id:'ggt', name:'GGT', unit:'U/L', panel:'liver', dir:'low',
    ref:{ male:[0, 60], female:[0, 40] },
    optimal:{ male:[8, 30], female:[6, 25] },
    red:{ above:200 },
    aliases:['ggt','gama gt','gamma gt'],
    nutrients:['omega3','fiber'],
    note:'Alkol ve yagli karaciger icin duyarli belirtec.' },

  { id:'alb', name:'Albümin', unit:'g/dL', panel:'liver', dir:'mid',
    ref:[3.5, 5.2], optimal:[4.2, 5.0], red:{ below:2.8 },
    nutrients:['protein'],
    aliases:['albumin','albümin','alb'],
    note:'Uzun vadeli protein durumunun aynasi.' },

  /* ----------------------------------------------------------------- bobrek */
  { id:'deritis', name:'AST / ALT (De Ritis)', unit:'oran', panel:'liver', dir:'mid',
    ref:[0.4, 2], optimal:[0.7, 1.3], red:{ above:3 },
    derived:'deritis', aliases:['ast/alt','de ritis','deritis'],
    nutrients:[], nutrientWhy:'Türetilmiş oran: bağı AST ve ALT\'den gelir.',
    note:'İki enzimin oranı, tek başına değerlerinden fazlasını söyler. 1 altı ve 2 üstü farklı yönleri gösterir.' },

  { id:'fib4', name:'FIB-4 indeksi', unit:'', panel:'liver', dir:'low',
    ref:[0, 2.67], optimal:[0, 1.3], red:{ above:3.25 },
    derived:'fib4', aliases:['fib4','fib-4'],
    nutrients:[], nutrientWhy:'Türetilmiş indeks: bağı yaş, ALT, AST ve trombositten gelir.',
    note:'Karaciğer sertliği için tarama indeksi. Yaş, AST, ALT ve trombositten hesaplanır; tanı değil tarama aracıdır.' },

  { id:'creat', name:'Kreatinin', unit:'mg/dL', panel:'kidney', dir:'mid',
    ref:{ male:[0.7, 1.3], female:[0.6, 1.1] },
    optimal:{ male:[0.8, 1.15], female:[0.65, 1.0] },
    red:{ above:2 },
    aliases:['kreatinin','creatinine','krea'],
    nutrients:['protein'],
    note:'Kas kutlesi yuksek olanlarda dogal olarak yuksektir; eGFR ile birlikte okunur.' },

  { id:'urea', name:'Üre', unit:'mg/dL', panel:'kidney', dir:'mid',
    ref:[16, 48], optimal:[20, 40], red:{ above:100 },
    aliases:['ure','üre','bun','urea'],
    nutrients:['protein'],
    note:'Susuz kalindiginda ve cok yuksek proteinde yukselir.' },

  { id:'uric', name:'Ürik asit', unit:'mg/dL', panel:'kidney', dir:'low',
    ref:{ male:[3.5, 7.2], female:[2.6, 6.0] },
    optimal:{ male:[3.5, 6.0], female:[2.6, 5.0] },
    red:{ above:10 },
    aliases:['urik asit','ürik asit','uric acid'],
    nutrients:[], nutrientWhy:'Ürik asit pürin alımıyla ilişkilidir; sistem pürin takibi yapmaz, bu yüzden bağ kurulmaz.',
    note:'Fruktoz ve alkol dogrudan yukseltir.' },

  { id:'egfr', name:'eGFR', unit:'mL/dk/1,73m²', panel:'kidney', dir:'high',
    ref:[60, 130], optimal:[85, 130], red:{ below:45 },
    aliases:['egfr','gfr','suzme hizi'],
    nutrients:[], nutrientWhy:'Türetilmiş değer: bağı kreatininden gelir.',
    note:'Bobrek suzme hizi tahmini. 60 altinda hekim degerlendirmesi gerekir.' },

  /* ------------------------------------------------------------ elektrolit */
  { id:'na', name:'Sodyum', unit:'mmol/L', panel:'electro', dir:'mid',
    ref:[136, 145], optimal:[138, 143], red:{ below:130, above:150 },
    aliases:['sodyum','na'],
    nutrients:['sodium'],
    note:'Cok dar bir aralikta tutulur; sapmasi her zaman anlamlidir.' },

  { id:'k', name:'Potasyum', unit:'mmol/L', panel:'electro', dir:'mid',
    ref:[3.5, 5.1], optimal:[3.9, 4.8], red:{ below:3.0, above:6.0 },
    nutrients:['potassium'],
    aliases:['potasyum','k'],
    note:'Kalp ritmini dogrudan etkiler. Sapmasi kirmizi bayraktir.' },

  { id:'ca', name:'Kalsiyum', unit:'mg/dL', panel:'electro', dir:'mid',
    ref:[8.6, 10.2], optimal:[9.0, 10.0], red:{ below:7.5, above:11.5 },
    nutrients:['calcium','vitd'],
    aliases:['kalsiyum','ca'],
    note:'D vitamini ile birlikte okunur; tek basina yanilticidir.' },

  { id:'ca_corr', name:'Düzeltilmiş kalsiyum', unit:'mg/dL', panel:'electro', dir:'mid',
    ref:[8.6, 10.2], optimal:[8.8, 10], red:{ below:7.5, above:11.5 },
    derived:'ca_corr', aliases:['duzeltilmis kalsiyum','corrected calcium'],
    nutrients:[], nutrientWhy:'Türetilmiş değer: bağı kalsiyum ve albüminden gelir.',
    note:'Kalsiyumun yarısı albümine bağlı taşınır; albümin düşükken ölçülen kalsiyum olduğundan düşük okunur. Bu satır o sapmayı düzeltir.' },

  { id:'mg', name:'Magnezyum', unit:'mg/dL', panel:'electro', dir:'mid',
    ref:[1.7, 2.4], optimal:[2.0, 2.4], red:{ below:1.2 },
    nutrients:['magnesium'],
    aliases:['magnezyum','mg'],
    note:'Kan degeri deponun yalnizca %1\'ini gosterir; kramp ve uyku sikayeti degerden onemlidir.' },

  /* --------------------------------------------------------------- vitamin */
  { id:'vitd', name:'25-OH D vitamini', unit:'ng/mL', panel:'vitamin', dir:'high',
    ref:[30, 100], optimal:[40, 70], red:{ below:10, above:120 },
    /* «fat» bir BESIN OGESI degil bir EMILIM FAKTORU: besin sozlugunde
       karsiligi yok ve burada aranirsa tanimsiz doner. D vitamininin
       yagla birlikte emildigi zaten ABSORB_FACTORS tarafinda yazili. */
    nutrients:['vitd'],
    aliases:['d vitamini','25-oh d','vitamin d','25 oh vitamin d','d3'],
    note:'Yagda cozunur: yagli bir ogunle alinmazsa emilimi dusuk kalir.' },

  { id:'b12', name:'B12 vitamini', unit:'pg/mL', panel:'vitamin', dir:'high',
    ref:[200, 900], optimal:[400, 800], red:{ below:150 },
    nutrients:['b12'],
    aliases:['b12','vitamin b12','kobalamin'],
    note:'Referans alt ucu belirti icin yeterince yuksek degildir; hedef bant 400 uzeridir.' },

  { id:'folate', name:'Folat', unit:'ng/mL', panel:'vitamin', dir:'high',
    ref:[3.9, 20], optimal:[8, 20], red:{ below:2 },
    nutrients:['folate'],
    aliases:['folat','folik asit','folate'],
    note:'Yesil yaprakli sebzeden gelir; pisirme suresi arttikca kaybi buyur.' },

  { id:'zinc', name:'Çinko', unit:'µg/dL', panel:'vitamin', dir:'mid',
    ref:[70, 120], optimal:[85, 115], red:{},
    nutrients:['zinc'],
    aliases:['cinko','çinko','zinc','zn'],
    note:'Bagisiklik ve tat duyusu icin gerekli. Yuksek dozda bakir emilimini bozar.' },

  /* --------------------------------------------------------------- hormonlar */
  { id:'tsh', name:'TSH', unit:'mIU/L', panel:'hormone', dir:'mid',
    ref:[0.4, 4.2], optimal:[0.8, 2.5], red:{ below:0.1, above:10 },
    nutrients:['iodine','selenium'],
    aliases:['tsh','tiroid uyarici hormon'],
    note:'Tiroidin yonetici sinyali. Yuksekse tiroid yavas calisiyor demektir.' },

  { id:'ft4', name:'Serbest T4', unit:'ng/dL', panel:'hormone', dir:'mid',
    ref:[0.8, 1.8], optimal:[1.0, 1.6], red:{},
    aliases:['serbest t4','ft4','st4','free t4'],
    nutrients:['iodine','selenium'],
    note:'TSH ile birlikte okunur; tek basina yorumlanmaz.' },

  { id:'ft3', name:'Serbest T3', unit:'pg/mL', panel:'hormone', dir:'mid',
    ref:[2.3, 4.2], optimal:[2.8, 4.0], red:{},
    aliases:['serbest t3','ft3','st3','free t3'],
    nutrients:['iodine','selenium'],
    note:'Uzun sureli kalori kisitlamasinda dusme egilimi gosterir.' },

  { id:'testo', name:'Total testosteron', unit:'ng/dL', panel:'hormone', dir:'high',
    ref:{ male:[264, 916], female:[15, 70] },
    optimal:{ male:[500, 900], female:[25, 60] },
    red:{}, sexOnly:null,
    aliases:['testosteron','total testosteron','testosterone'],
    nutrients:['zinc','vitd'],
    note:'Sabah 8-10 arasi olculur; gun icinde belirgin duser.' },

  { id:'cortisol', name:'Kortizol (sabah)', unit:'µg/dL', panel:'hormone', dir:'mid',
    ref:[6, 23], optimal:[9, 18], red:{ above:35 },
    aliases:['kortizol','cortisol'],
    nutrients:[], nutrientWhy:'Kortizolü uyku, yük ve stres belirler; beslenme tarafında güvenilir bir kaldıraç yoktur.',
    note:'Uykusuzluk ve asiri antrenman yukseltir. Olcum sabah ac karnina yapilir.' },

  /* ----------------------------------------------------------- inflamasyon */
  { id:'crp', name:'hs-CRP', unit:'mg/L', panel:'inflam', dir:'low',
    ref:[0, 3], optimal:[0, 1], red:{ above:10 },
    nutrients:['omega3','fiber'],
    aliases:['crp','hs-crp','hscrp','c reaktif protein'],
    note:'Sistemik yangi. Enfeksiyon sirasinda gecici yukselir; olcum saglikli gunde yapilir.' },

  { id:'esr', name:'Sedimantasyon', unit:'mm/saat', panel:'inflam', dir:'low',
    ref:{ male:[0, 15], female:[0, 20] },
    optimal:{ male:[0, 10], female:[0, 12] },
    red:{ above:60 },
    aliases:['sedim','sedimantasyon','esr'],
    nutrients:['omega3'],
    note:'CRP\'den yavas hareket eder; ikisi birlikte okunur.' },
];

/* Hizli erisim tablolari — ekranlar ve ayristirici id ile arar. */
SP.BIO_BY_ID = SP.BIOMARKERS.reduce(function(acc, b){ acc[b.id] = b; return acc; }, {});
SP.PANEL_BY_ID = SP.PANELS.reduce(function(acc, p){ acc[p.id] = p; return acc; }, {});

/* Turetilmis olcumlerin formulleri.

   Her biri girdi id'lerini ve hesabi tasir; girdi eksikse null doner ve
   olcum hic yazilmaz — tahmin uretilmez.

   Uc alan:
     inputs    gerekli olcum id'leri; biri eksikse hesap yapilmaz
     needs     profil alanlari ('age', 'sex'); eksikse hesap yapilmaz
     calc      (degerler, baglam) -> sayi | null
     measured  true ise bu olcum ELLE de girilebilir ve olculen deger
               hesaplanana ustun gelir (LDL ve eGFR boyledir)

   Formuller ekranda yazar: 'note' alani kullaniciya gosterilir. */
SP.DERIVED = {
  homa:{
    inputs:['glucose', 'insulin'],
    /* HOMA-IR = (aclik glukozu mg/dL x aclik insulini) / 405 */
    calc:function(v){ return (v.glucose * v.insulin) / 405; },
    note:'Açlık glukozu × açlık insülini ÷ 405',
  },
  nonhdl:{
    inputs:['chol', 'hdl'],
    calc:function(v){ return v.chol - v.hdl; },
    note:'Total kolesterol − HDL',
  },
  tsat:{
    inputs:['iron_s', 'tibc'],
    calc:function(v){ return v.tibc ? (100 * v.iron_s / v.tibc) : null; },
    note:'Serum demir ÷ demir bağlama kapasitesi × 100',
  },

  /* LDL — Friedewald. Trigliserit 400 mg/dL ustunde formul GECERSIZDIR;
     orada hesap yapilmaz. Gecersiz bir formulu uygulamak,
     hesaplamamaktan kotudur. Laboratuvar dogrudan olctuyse o kazanir. */
  ldl:{
    inputs:['chol', 'hdl', 'trig'],
    measured:true,
    calc:function(v){
      if(v.trig >= 400) return null;
      return v.chol - v.hdl - (v.trig / 5);
    },
    note:'Friedewald: Total kolesterol − HDL − Trigliserit ÷ 5 '
      + '(yalnız trigliserit 400 mg/dL altındayken geçerlidir)',
  },

  /* eGFR — CKD-EPI 2021, irk katsayisi YOK (2021 revizyonu onu kaldirdi). */
  egfr:{
    inputs:['creat'],
    needs:['age', 'sex'],
    measured:true,
    calc:function(v, ctx){
      const kadin = ctx.sex === 'female';
      const k = kadin ? 0.7 : 0.9;
      const a = v.creat <= k ? (kadin ? -0.241 : -0.302) : -1.200;
      let e = 142 * Math.pow(v.creat / k, a) * Math.pow(0.9938, ctx.age);
      if(kadin) e *= 1.012;
      return e;
    },
    note:'CKD-EPI 2021 — kreatinin, yaş ve cinsiyetten hesaplanır',
  },

  tg_hdl:{
    inputs:['trig', 'hdl'],
    calc:function(v){ return v.hdl ? v.trig / v.hdl : null; },
    note:'Trigliserit ÷ HDL',
  },

  tyg:{
    inputs:['trig', 'glucose'],
    calc:function(v){
      const x = (v.trig * v.glucose) / 2;
      return x > 0 ? Math.log(x) : null;
    },
    note:'ln(Trigliserit × Açlık glukozu ÷ 2)',
  },

  eag:{
    inputs:['hba1c'],
    calc:function(v){ return 28.7 * v.hba1c - 46.7; },
    note:'28,7 × HbA1c − 46,7',
  },

  deritis:{
    inputs:['ast', 'alt'],
    calc:function(v){ return v.alt ? v.ast / v.alt : null; },
    note:'AST ÷ ALT',
  },

  fib4:{
    inputs:['ast', 'alt', 'plt'],
    needs:['age'],
    calc:function(v, ctx){
      if(!v.plt || v.alt <= 0) return null;
      return (ctx.age * v.ast) / (v.plt * Math.sqrt(v.alt));
    },
    note:'(Yaş × AST) ÷ (Trombosit × √ALT)',
  },

  ca_corr:{
    inputs:['ca', 'alb'],
    calc:function(v){ return v.ca + 0.8 * (4 - v.alb); },
    note:'Kalsiyum + 0,8 × (4 − Albümin)',
  },
};
