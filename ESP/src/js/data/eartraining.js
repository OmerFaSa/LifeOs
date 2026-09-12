/* Kulak eğitimi ve deşifre — müziğin ikinci ekseni.

   Metronom parmakları eğitir, kulak eğitmez. Bir müzisyenin ilerlemesinde
   BPM bir yerden sonra yanıltıcıdır: hızlı çalan ama duymayan biri
   repertuarını genişletemez, çünkü her yeni parçayı sıfırdan ezberler.

   Buradaki egzersizlerin hiçbiri bir yetenek testi değildir. «Mutlak kulak»
   diye bir kapı yoktur ve bilerek yoktur: ESP.PEDAGOGIC yetenek yargısını
   yasaklar. Ölçülen tek şey, bir aralığı ya da akoru İSABETLE
   adlandırabilme oranıdır. */

window.ESP = window.ESP || {};

ESP.INTERVALS = [
  { id:'u2', semitones:2,  label:'Büyük 2\'li',  hook:'Bir kış gecesi' },
  { id:'k3', semitones:3,  label:'Küçük 3\'lü',  hook:'Ağıt havası' },
  { id:'b3', semitones:4,  label:'Büyük 3\'lü',  hook:'Neşeli açılış' },
  { id:'t4', semitones:5,  label:'Tam 4\'lü',    hook:'Marş başlangıcı' },
  { id:'a4', semitones:6,  label:'Artık 4\'lü',  hook:'Gergin, çözülmemiş' },
  { id:'t5', semitones:7,  label:'Tam 5\'li',    hook:'Açık, boş, güçlü' },
  { id:'k6', semitones:8,  label:'Küçük 6\'lı',  hook:'Hüzünlü yükseliş' },
  { id:'b6', semitones:9,  label:'Büyük 6\'lı',  hook:'Özlemli' },
  { id:'k7', semitones:10, label:'Küçük 7\'li',  hook:'Blues rengi' },
  { id:'b7', semitones:11, label:'Büyük 7\'li',  hook:'Parlak gerilim' },
  { id:'ok', semitones:12, label:'Oktav',        hook:'Aynı ses, başka yer' },
];

ESP.INTERVAL_BY_ID = ESP.INTERVALS.reduce(function(m, i){ m[i.id] = i; return m; }, {});

ESP.EAR_DRILLS = [
  { id:'aralik-tani', level:1, label:'Aralık tanıma',
    task:'İki sesi çal, aralığı söyle, sonra doğrula. Yirmi deneme, isabeti yaz.',
    measures:'İsabet oranı — yetenek değil, deneme başına doğru sayısı.' },
  { id:'akor-turu', level:2, label:'Akor türü',
    task:'Majör, minör, artık, eksik: türü duy, sonra bak.',
    measures:'Dört tür arasında isabet.' },
  { id:'derece', level:3, label:'Derece duyma',
    task:'Bir tonalite kur, rastgele bir derece çal, kaçıncı derece olduğunu söyle.',
    measures:'Yedi derece arasında isabet.' },
  { id:'ritim-yaz', level:2, label:'Ritim yazımı',
    task:'Dört ölçülük bir ritmi dinle, nota değerleriyle yaz.',
    measures:'Doğru yazılan ölçü sayısı.' },
  { id:'melodi-yaz', level:3, label:'Melodi yazımı',
    task:'Sekiz notalık bir melodiyi dinleyip yaz; sonra çalarak doğrula.',
    measures:'Doğru nota sayısı.' },
  { id:'akor-dizi', level:4, label:'Akor dizisi çıkarma',
    task:'Bir şarkının akorlarını kulakla bul; tabla bakmadan.',
    measures:'Doğru bulunan akor oranı.' },
  { id:'transkripsiyon', level:5, label:'Transkripsiyon',
    task:'Bir soloyu nota nota çıkar; ölçü ölçü yavaşlatarak çalış.',
    measures:'Çıkarılan ölçü sayısı.' },
];

/* CAGED — klavyeyi beş şekle bölen sistem. Bir «sır» değil bir haritadır:
   aynı akorun beş yerde nasıl kurulduğunu gösterir. */
ESP.CAGED = [
  { id:'c', shape:'C', root:'5. tel', note:'Açık C şeklinin kaydırılmış hâli.' },
  { id:'a', shape:'A', root:'5. tel', note:'Barre A; en sık kullanılan ikinci şekil.' },
  { id:'g', shape:'G', root:'6. tel', note:'Geniş açılım; parmak esnekliği ister.' },
  { id:'e', shape:'E', root:'6. tel', note:'Barre E; rock ve blues\'un temel şekli.' },
  { id:'d', shape:'D', root:'4. tel', note:'İnce tellerde; üst kayıtta işe yarar.' },
];

/* Deşifre (prima vista) kademeleri. Okumak çalmaktan ayrı bir beceridir
   ve ayrı çalışılır. */
ESP.SIGHT_READING = [
  { level:1, label:'Ritim okuma', task:'Yalnız ritmi, tek seste, metronomla oku.' },
  { level:2, label:'Tek oktav', task:'Bir oktav içindeki melodileri duraksamadan oku.' },
  { level:3, label:'Pozisyon değişimi', task:'Pozisyon değiştiren melodileri oku.' },
  { level:4, label:'Akor sembolü', task:'Akor sembollerinden eşlik kur.' },
  { level:5, label:'Çok sesli', task:'İki sesli yazıyı aynı anda oku.' },
];

/* Repertuar durumu — bir parçanın hayatındaki üç hâl.
   «Bitti» diye bir hâl yoktur: bakımsız kalan parça geri gider. */
ESP.REPERTOIRE_STATES = [
  { id:'ogreniliyor', label:'Öğreniliyor', note:'Henüz baştan sona çalınamıyor.' },
  { id:'taze', label:'Taze', note:'Son iki haftada çalındı, akılda.' },
  { id:'bakimsiz', label:'Bakımsız', note:'Otuz günden uzun süredir çalınmadı; '
    + 'çalınabilir ama garanti değil.' },
];

ESP.REPERTOIRE_STALE_DAYS = 30;
