/* Hareket, yuk ve toparlanma referanslari — Modul 3'un tabani.

   Uc ayri sey burada durur ve birbirine karistirilmaz:

     EXERCISES    hareket katalogu ve kademeli ilerleme merdivenleri
     READINESS    toparlanma skorunun nasil hesaplandigi ve ne emrettigi
     LOAD         yuk artisinin sinirlari (sakatlik onleme)

   Sistemin buradaki tek dogmasi sudur: gunun yukunu istek degil, toparlanma
   belirler. Toparlanma zayifken agir antrenman kazanc degil borc uretir. */

window.SP = window.SP || {};

/* Hareket kaliplari — dengeli bir program her kalibi haftada en az bir kez gorur. */
SP.PATTERNS = [
  { id:'push',   label:'İtme',    note:'Göğüs, omuz, arka kol' },
  { id:'pull',   label:'Çekme',   note:'Sırt, ön kol, ön kol kavrama' },
  { id:'squat',  label:'Çömelme', note:'Ön bacak ve kalça' },
  { id:'hinge',  label:'Kalça menteşesi', note:'Arka bacak, kalça, bel sağlığı' },
  { id:'core',   label:'Gövde',   note:'Karın ve bel stabilitesi' },
  { id:'carry',  label:'Taşıma',  note:'Kavrama, omuz stabilitesi, günlük hayat gücü' },
];

/* Kademeli ilerleme: her hareketin kendi merdiveni vardir. Bir basamak
   `to` hedefine ulasilmadan bir sonrakine gecilmez. Sistem basamak atlatmaz;
   asiri yuklenmenin en yaygin sebebi budur. */
SP.EXERCISES = [
  { id:'sinav', name:'Şınav', kind:'strength', pattern:'push', met:5.0, equip:'yok',
    cue:'Gövde tek parça, dirsekler 45 derece, göğüs yere yaklaşır.',
    levels:[
      { id:'duvar',  name:'Duvar şınavı',     to:'3×15' },
      { id:'egik',   name:'Eğik şınav (masa)', to:'3×12' },
      { id:'diz',    name:'Diz üstü şınav',   to:'3×12' },
      { id:'tam',    name:'Tam şınav',        to:'3×10' },
      { id:'dar',    name:'Dar tutuş şınav',  to:'3×10' },
      { id:'tek',    name:'Tek kol destekli', to:'3×5'  },
    ] },

  { id:'barfiks', name:'Barfiks', kind:'strength', pattern:'pull', met:6.0, equip:'bar',
    cue:'Omuzlar kulaktan uzak, çene barın üstüne. Sallanma yok.',
    levels:[
      { id:'asili',   name:'Barda asılı kalma', to:'3×30 sn' },
      { id:'lastik',  name:'Lastikli barfiks',  to:'3×8' },
      { id:'negatif', name:'Negatif barfiks',   to:'3×5 (5 sn iniş)' },
      { id:'tam',     name:'Tam barfiks',       to:'3×6' },
      { id:'agirlik', name:'Ağırlıklı barfiks', to:'3×5' },
    ] },

  { id:'squat', name:'Squat', kind:'strength', pattern:'squat', met:5.5, equip:'yok',
    cue:'Topuklar yerde, dizler ayak ucu yönünde, kalça diz hizasının altına iner.',
    levels:[
      { id:'sandalye', name:'Sandalyeye oturup kalkma', to:'3×15' },
      { id:'vucut',    name:'Vücut ağırlığı squat',     to:'3×20' },
      { id:'duraklat', name:'Duraklamalı squat',        to:'3×12' },
      { id:'bulgar',   name:'Bulgar split squat',       to:'3×10 (tek bacak)' },
      { id:'tek',      name:'Tek bacak squat',          to:'3×5' },
    ] },

  { id:'kalca-koprusu', name:'Kalça köprüsü', kind:'strength', pattern:'hinge', met:4.0, equip:'yok',
    cue:'Kalça sıkılarak kaldırılır, bel değil kalça çalışır.',
    levels:[
      { id:'ciftbacak', name:'Çift bacak köprü',   to:'3×20' },
      { id:'duraklat',  name:'Duraklamalı köprü',  to:'3×15' },
      { id:'tekbacak',  name:'Tek bacak köprü',    to:'3×12' },
      { id:'yukseltme', name:'Yükseltilmiş köprü', to:'3×12' },
    ] },

  { id:'plank', name:'Plank', kind:'strength', pattern:'core', met:3.5, equip:'yok',
    cue:'Kalça çökmez, bel çukurlaşmaz. Süre değil hizalanma önemlidir.',
    levels:[
      { id:'diz',   name:'Diz üstü plank', to:'3×30 sn' },
      { id:'tam',   name:'Tam plank',      to:'3×60 sn' },
      { id:'yan',   name:'Yan plank',      to:'3×45 sn' },
      { id:'kol',   name:'Kol açma plank', to:'3×10' },
    ] },

  { id:'firmer-tasima', name:'Çiftçi taşıması', kind:'strength', pattern:'carry', met:4.5, equip:'ağırlık',
    cue:'Omuzlar geride, gövde dik, adımlar kısa. Market poşetiyle de yapılır.',
    levels:[
      { id:'hafif', name:'Hafif yük 30 sn', to:'3×30 sn' },
      { id:'orta',  name:'Vücut ağırlığının %25\'i', to:'3×40 sn' },
      { id:'agir',  name:'Vücut ağırlığının %50\'si', to:'3×40 sn' },
    ] },

  /* --- dayaniklilik --- */
  { id:'yuruyus', name:'Tempolu yürüyüş', kind:'cardio', pattern:null, met:3.8, equip:'yok',
    cue:'Konuşabildiğin ama şarkı söyleyemediğin tempo.',
    levels:[
      { id:'20', name:'20 dakika', to:'her gün' },
      { id:'40', name:'40 dakika', to:'her gün' },
      { id:'60', name:'60 dakika', to:'haftada 5' },
    ] },

  { id:'kosu', name:'Koşu', kind:'cardio', pattern:null, met:9.0, equip:'yok',
    cue:'Haftalık toplam mesafe %10\'dan fazla artmaz.',
    levels:[
      { id:'yuruyus-kosu', name:'Yürü-koş (1 dk / 2 dk)', to:'20 dakika' },
      { id:'kesintisiz',   name:'Kesintisiz 20 dk',        to:'3 seans' },
      { id:'5k',           name:'5 km kesintisiz',         to:'haftada 2' },
      { id:'tempo',        name:'Tempo koşusu',            to:'haftada 1' },
    ] },

  { id:'evde-sprint', name:'Evde sprint', kind:'cardio', pattern:null, met:8.0, equip:'yok',
    cue:'Yerinde yüksek diz ya da kısa mekik koşusu. Yüksek şiddet kısa tutulur: '
      + 'toparlanma düşükken bu hareket yapılmaz.',
    levels:[
      { id:'10-20', name:'10 sn yüksek / 50 sn yürüme × 6', to:'haftada 1' },
      { id:'20-40', name:'20 sn yüksek / 40 sn yürüme × 8', to:'haftada 2' },
      { id:'30-30', name:'30 sn yüksek / 30 sn yürüme × 10', to:'haftada 2' },
    ] },

  /* --- mobilite --- */
  { id:'kalca-acma', name:'Kalça açma', kind:'mobility', pattern:null, met:2.5, equip:'yok',
    cue:'Masa başı çalışanın en çok ihtiyaç duyduğu hareket. Zorlamadan, nefesle.',
    levels:[{ id:'temel', name:'Temel akış', to:'günde 8 dk' }] },

  { id:'sirt-mobilite', name:'Sırt ve omuz mobilitesi', kind:'mobility', pattern:null, met:2.5, equip:'yok',
    cue:'Kürek kemikleri arasında açılma hissedilir.',
    levels:[{ id:'temel', name:'Temel akış', to:'günde 8 dk' }] },

  { id:'ayak-bilegi', name:'Ayak bileği mobilitesi', kind:'mobility', pattern:null, met:2.2, equip:'yok',
    cue:'Squat derinliğini kısıtlayan en yaygın sebep burasıdır.',
    levels:[{ id:'temel', name:'Temel akış', to:'günde 5 dk' }] },
];

SP.EX_BY_ID = SP.EXERCISES.reduce(function(acc, e){ acc[e.id] = e; return acc; }, {});

/* ---------------------------------------------------------------- alanlar

   Hareket ekrani egzersizleri KALIBA gore degil, kullanicinin gununu
   planlarken dusundugu ALANA gore ayirir: "bugun kardiyo mu yapayim,
   kuvvet mi?" Kalip (itme/cekme/comelme) bu alanlarin icinde bir
   ayrintidir, ust duzey bir bolum degil.

   Dinlenme de bir alandir. Antrenman programlarinda dinlenme cogu zaman
   "yapilmayan sey" olarak gecer ve gorunmez olur; burada kendi sayfasi
   vardir cunku yuk yonetiminin yarisi odur. */
SP.AREAS = [
  { id:'kardiyo', label:'Kardiyo', icon:'pulse', kind:'cardio',
    note:'Yürüyüş, koşu ve evde sprint. Haftalık toplam süre %10\'dan hızlı artmaz.' },
  { id:'kuvvet', label:'Kuvvet', icon:'dumbbell', kind:'strength',
    note:'Vücut ağırlığıyla altı temel kalıp. İlerleme ağırlıkla değil, merdivenin '
      + 'bir üst basamağıyla olur.' },
  { id:'esneklik', label:'Esneklik', icon:'leaf', kind:'mobility',
    note:'Mobilite akışları. Toparlanma düşükken ağır antrenmanın yerine geçer.' },
  { id:'dinlenme', label:'Dinlenme', icon:'bed', kind:null,
    note:'Yükün diğer yarısı. Boşluk günü değil, planın parçası.' },
];

SP.AREA_BY_ID = SP.AREAS.reduce(function(acc, a){ acc[a.id] = a; return acc; }, {});

/* ---------------------------------------------------------------- toparlanma

   Toparlanma skoru dort girdiden hesaplanir ve 0-100 arasi doner. Girdilerin
   hepsi zorunlu degildir; eksik girdi sifir sayilmaz, agirligi kalanlara
   dagitilir (bkz. SP.Move.readiness). Boylece akilli saati olmayan biri de
   uyku ve nabizla anlamli bir skor alir. */
SP.READINESS_INPUTS = [
  { id:'sleep',  weight:0.35, label:'Uyku',
    note:'Süre ve düzenlilik. Toparlanmanın tek en güçlü belirleyicisi.' },
  { id:'hrv',    weight:0.30, label:'HRV',
    note:'Kendi 30 günlük ortalamana göre okunur, başkasınınkiyle karşılaştırılmaz.' },
  { id:'rhr',    weight:0.20, label:'İstirahat nabzı',
    note:'Kendi ortalamandan sapma. Yükselmesi yorgunluk ya da hastalık işareti.' },
  { id:'soreness', weight:0.15, label:'Ağrı ve enerji',
    note:'Kendi bildirdiğin his. Cihaz verisi bunu göremez.' },
];

/* Toparlanma bandi -> gunun yuk emri.
   `factor` planlanan yukun hangi oranda uygulanacagini soyler. */
SP.READINESS_BANDS = [
  { id:'high', min:80, label:'Yüksek', tone:'ok', factor:1.1,
    order:'Ağır gün için uygun. Planlanan yükü uygula, ilerleme denemesi bugün yapılır.' },
  { id:'ok', min:65, label:'İyi', tone:'ok', factor:1.0,
    order:'Planlanan yükü olduğu gibi uygula.' },
  { id:'mid', min:50, label:'Orta', tone:'warn', factor:0.8,
    order:'Yükü beşte bir azalt. Set sayısını düşür, ağırlığı koru.' },
  { id:'low', min:35, label:'Düşük', tone:'warn', factor:0.5,
    order:'Ağır yük bugün kazanç üretmez. Yarısını yap ya da mobiliteye çevir.' },
  { id:'rest', min:0, label:'Toparlanma günü', tone:'danger', factor:0,
    order:'Bugün antrenman yok. Yürüyüş, mobilite ve uyku. Bu bir geri adım değil, planın parçası.' },
];

/* --------------------------------------------------------------------- yuk

   Akut/kronik yuk orani (ACWR): son 7 gunun ortalama yuku, son 28 gunun
   ortalamasina bolunur. 1,5 uzeri sakatlik riskinin belirgin arttigi bolgedir;
   0,8 alti ise kondisyonun geriledigi bolge. */
SP.LOAD_RULES = {
  acwr:{
    low:0.8, high:1.5,
    lowNote:'Son hafta alışkın olduğundan hafif geçti. Kondisyon korunmuyor.',
    highNote:'Son hafta alıştığından belirgin ağır geçti. Bu bölgede sakatlanma riski yükselir.',
    okNote:'Yük, alıştığın bandın içinde.',
  },
  weeklyGrowth:{
    max:0.10,
    note:'Haftalık toplam yük %10\'dan fazla artmaz. Bu kural koşu mesafesi, '
       + 'set sayısı ve toplam süre için ayrı ayrı geçerlidir.',
  },
  deload:{
    everyWeeks:5, factor:0.6,
    note:'Beş haftada bir yük %40 azaltılır. Kazanç antrenmanda değil, '
       + 'antrenmandan sonraki toparlanmada oluşur.',
  },
  minDay:{
    minutes:15,
    note:'Kötü günün alt sınırı: 15 dakika yürüyüş ve bir mobilite akışı. '
       + 'Zincir kopmaz, yük de birikmez.',
  },
};

/* Hazir seans sablonlari — plan uretimi bunlarin uzerine kurulur. */
SP.SESSION_TEMPLATES = [
  { id:'tam-vucut-a', name:'Tam vücut A', kind:'strength', minutes:45,
    items:['sinav', 'barfiks', 'squat', 'plank'],
    note:'İtme, çekme, çömelme ve gövde. Haftanın omurgası.' },
  { id:'tam-vucut-b', name:'Tam vücut B', kind:'strength', minutes:45,
    items:['sinav', 'kalca-koprusu', 'firmer-tasima', 'plank'],
    note:'Kalça menteşesi ve taşıma öne çıkar.' },
  { id:'dayaniklilik', name:'Dayanıklılık', kind:'cardio', minutes:40,
    items:['kosu'], note:'Konuşma temposu. Nefes nefese kalınan gün bu gün değil.' },
  { id:'yuruyus-gunu', name:'Yürüyüş günü', kind:'cardio', minutes:40,
    items:['yuruyus'], note:'Aktif toparlanma. Ağır günün ertesi için.' },
  { id:'sprint-gunu', name:'Sprint günü', kind:'cardio', minutes:20,
    items:['evde-sprint'],
    note:'Kısa ve yüksek şiddetli. Yalnız toparlanma yeşilken yapılır.' },
  { id:'mobilite', name:'Mobilite akışı', kind:'mobility', minutes:20,
    items:['kalca-acma', 'sirt-mobilite', 'ayak-bilegi'],
    note:'Toparlanma düşükken ağır antrenmanın yerine geçer.' },
];
