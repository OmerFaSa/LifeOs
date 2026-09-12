/* Gitar referansi — gamlar, akor ilerleyisleri ve teknikler. YALNIZCA VERI.

   `startBpm` bir hedef degil bir BASLANGIC onerisidir: temiz calinabilen
   tempo kisiden kisiye degisir ve sistem kullanicinin kendi olcumunu
   bekler. Ilk tempo girilene kadar hicbir esik URETILMEZ.

   `targetBpm` ise literaturde "bu teknik akici sayilir" denen kaba banttir
   ve ekranda daima "referans" etiketiyle durur. Kullanici kendi hedefini
   yazdiginda referans kenara cekilir. */

window.ESP = window.ESP || {};

/* Notalar ve aralik adlari — deşifre ekraninin omurgasi. */
ESP.NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

ESP.NOTE_TR = { C:'Do', 'C#':'Do#', D:'Re', 'D#':'Re#', E:'Mi', F:'Fa',
  'F#':'Fa#', G:'Sol', 'G#':'Sol#', A:'La', 'A#':'La#', B:'Si' };

/* Gamlar ve modlar — yari ton araliklariyla. Formul tek yerde durur ki
   "A dorian hangi notalar" sorusu iki farkli ekranda ayni cevabi versin. */
ESP.SCALES = [
  { id:'major',      label:'Majör',            steps:[0,2,4,5,7,9,11], mood:'Açık, yerleşik' },
  { id:'minor',      label:'Doğal minör',      steps:[0,2,3,5,7,8,10], mood:'Kapalı, ağır' },
  { id:'harmonic',   label:'Armonik minör',    steps:[0,2,3,5,7,8,11], mood:'Gergin, doğulu' },
  { id:'melodic',    label:'Melodik minör',    steps:[0,2,3,5,7,9,11], mood:'Yükselen' },
  { id:'dorian',     label:'Dorian',           steps:[0,2,3,5,7,9,10], mood:'Minör ama umutlu' },
  { id:'phrygian',   label:'Frigyen',          steps:[0,1,3,5,7,8,10], mood:'Karanlık, İspanyol' },
  { id:'lydian',     label:'Lidyen',           steps:[0,2,4,6,7,9,11], mood:'Havada asılı' },
  { id:'mixolydian', label:'Miksolidyen',      steps:[0,2,4,5,7,9,10], mood:'Blues\'a yakın majör' },
  { id:'locrian',    label:'Lokriyen',         steps:[0,1,3,5,6,8,10], mood:'Kararsız' },
  { id:'pentaMaj',   label:'Majör pentatonik', steps:[0,2,4,7,9],      mood:'Sade, halk müziği' },
  { id:'pentaMin',   label:'Minör pentatonik', steps:[0,3,5,7,10],     mood:'Blues ve rock\'ın omurgası' },
  { id:'blues',      label:'Blues',            steps:[0,3,5,6,7,10],   mood:'Ezilmiş beşli' },
];

ESP.SCALE_BY_ID = ESP.SCALES.reduce(function(m, s){ m[s.id] = s; return m; }, {});

/* Bir gamin notalarini uretir. Saf fonksiyon: veri dosyasinda durmasinin
   sebebi hesabin degil TABLONUN burada olmasi — cikti tek satirlik bir
   esleme. */
ESP.scaleNotes = function(rootId, scaleId){
  const s = ESP.SCALE_BY_ID[scaleId];
  const kok = ESP.NOTES.indexOf(rootId);
  if(!s || kok < 0) return [];
  return s.steps.map(function(st){ return ESP.NOTES[(kok + st) % 12]; });
};

/* Akor ilerleyisleri — derece rakamlariyla. Tonaliteden bagimsiz
   tutulmalari kasitli: ayni ilerleyis her tonda calisilabilir. */
ESP.PROGRESSIONS = [
  { id:'I-V-vi-IV',   label:'I–V–vi–IV',   degrees:['I','V','vi','IV'],
    note:'Pop\'un en yaygın dört akoru. Her tonda çalışmaya değer.' },
  { id:'ii-V-I',      label:'ii–V–I',      degrees:['ii','V','I'],
    note:'Caz armonisinin temel hücresi. Önce tek tonda, sonra çeyrek tonlarla.' },
  { id:'I-vi-IV-V',   label:'I–vi–IV–V',   degrees:['I','vi','IV','V'],
    note:'Elliler dönüşü. Geçişleri temiz yapmak için iyi bir ölçüt.' },
  { id:'i-VI-III-VII', label:'i–VI–III–VII', degrees:['i','VI','III','VII'],
    note:'Andalusian yakını; minör tonda yürüyen bas çalışması.' },
  { id:'12-bar',      label:'12 ölçü blues', degrees:['I','I','I','I','IV','IV','I','I','V','IV','I','V'],
    note:'Blues formu. Metronomla en çok şey öğreten alıştırma.' },
  { id:'i-VII-VI-V',  label:'i–VII–VI–V',  degrees:['i','VII','VI','V'],
    note:'İnen minör yürüyüş; sol el bağlantısını zorlar.' },
];

/* Teknikler — her biri kendi merdivenini tasiyan bir "parca" olarak
   eklenebilir. `targetBpm` referanstir, kullanici kendi hedefini yazabilir. */
ESP.TECHNIQUES = [
  { id:'alternate',  label:'Dönüşümlü mızrap',  startBpm:60,  targetBpm:140,
    note:'Aşağı-yukarı eşit. Temizliğin ölçüsü hız değil, iki yönün eşitliği.' },
  { id:'legato',     label:'Legato (çekiç–çekme)', startBpm:60, targetBpm:120,
    note:'Ses mızrapsız çıkar; zayıf parmaklar burada belli olur.' },
  { id:'sweep',      label:'Süpürme',          startBpm:50,  targetBpm:120,
    note:'Susturma olmadan hız anlamsız: notalar üst üste binmemeli.' },
  { id:'barre',      label:'Barre akorları',   startBpm:50,  targetBpm:100,
    note:'Her telin ayrı ayrı temiz çıkması ölçülür, akorun bütünü değil.' },
  { id:'fingerstyle', label:'Parmakla çalma',  startBpm:50,  targetBpm:110,
    note:'Bas ve melodinin ayrı ses seviyesinde durması esas.' },
  { id:'strumming',  label:'Vuruş kalıpları',  startBpm:70,  targetBpm:130,
    note:'Bilek serbest; kolun tamamı değil. Boş vuruşlar da tempoda olmalı.' },
  { id:'bending',    label:'Bükme',            startBpm:60,  targetBpm:100,
    note:'Hız değil hedef perde: bükülen nota doğru perdeye oturmalı.' },
  { id:'scale-run',  label:'Gam koşusu',       startBpm:60,  targetBpm:160,
    note:'Pozisyon değişimlerinde tempo düşmemeli; ölçüm orada yapılır.' },
  { id:'chord-change', label:'Akor geçişi',    startBpm:50,  targetBpm:120,
    note:'Bir ölçüde bir akor; geçişte boşluk kalmaması ölçülür.' },
  { id:'sight',      label:'Deşifre',          startBpm:50,  targetBpm:90,
    note:'Durmadan çalmak, doğru çalmaktan önce gelir.' },
];

ESP.TECHNIQUE_BY_ID = ESP.TECHNIQUES.reduce(function(m, t){ m[t.id] = t; return m; }, {});

/* Olcu turleri — metronomun vurgu koydugu yer. */
ESP.TIME_SIGNATURES = [
  { id:'4/4', label:'4/4', beats:4, note:'Varsayılan.' },
  { id:'3/4', label:'3/4', beats:3, note:'Vals.' },
  { id:'6/8', label:'6/8', beats:6, note:'İki büyük vuruş, altı küçük.' },
  { id:'5/4', label:'5/4', beats:5, note:'Aksak; vurgu 3+2 ya da 2+3.' },
  { id:'7/8', label:'7/8', beats:7, note:'Türk müziğinde yaygın aksak.' },
  { id:'9/8', label:'9/8', beats:9, note:'Zeybek ve karşılama.' },
];

/* Isinma sirasi — ekranda oneri olarak gosterilir, ZORUNLU DEGILDIR.
   Sistem kullanicinin yerine karar vermez; yalnizca yaygin siralamayi
   hatirlatir. */
ESP.WARMUP = [
  { id:'kromatik', label:'Kromatik ısınma', minutes:3,
    note:'Dört parmak, tek tel, yavaş. Tempo değil eşitlik.' },
  { id:'gam',      label:'Gam',             minutes:5,
    note:'Bir pozisyon, metronomla. Önceki eşiğin 10 BPM altından başla.' },
  { id:'teknik',   label:'Teknik',          minutes:10,
    note:'Günün tek tekniği. Eşiği burada ölç.' },
  { id:'repertuar', label:'Repertuar',      minutes:15,
    note:'Çalınan parça. Tempo eşiği değil, baştan sona bütünlük.' },
];
