/* Gezinme kataloğu — hangi bölüm, hangi sayfalar.

   Bu bir VERİDİR ve kabuktan (app.js) ayrı durur. Sebebi mimari değil
   pratik: bölüm listesini test edebilmek için bütün uygulamayı açmak
   gerekmemeli. `core/nav.js` bu listeyi kullanıcının açık bölümlerine göre
   süzer ve numaralandırır.

   `disc` alanı bölümü bir disipline bağlar; disiplin kapalıysa bölüm hiç
   çizilmez. `disc` taşımayan bölümler (Günlük, Ofis, Ayarlar) hiçbir zaman
   kapanmaz — onlar bir alan değil sistemin kendisidir.

   Numara burada YOKTUR: numara çizim anında verilir çünkü bir kimlik değil
   bir sıradır (bkz. core/nav.js). */

window.ESP = window.ESP || {};

ESP.SECTIONS_ALL = [
    { id:'gunluk', icon:'pulse', label:'Günlük',
      note:'Günün pratiğini gir, karşılığını gör',
      views:[
        { route:'today',  label:'Bugün',    icon:'pulse' },
        { route:'ladder', label:'Merdiven', icon:'chart' },
      ] },

    { id:'dil', disc:'lang', icon:'cards', label:'Dil',
      note:'Kelime, aralıklı tekrar ve shadowing',
      views:[{ route:'lang', label:'Dil Stüdyosu', icon:'cards' }] },

    { id:'felsefe', disc:'philo', icon:'socratic', label:'Felsefe',
      note:'Tez, itiraz, düşünce deneyi ve safsata denetimi',
      views:[{ route:'symposium', label:'Sempozyum', icon:'socratic' }] },

    { id:'tarih', disc:'history', icon:'book', label:'Tarih',
      note:'Kronoloji, neden zinciri ve kaynak eleştirisi',
      views:[{ route:'history', label:'Kronoloji', icon:'book' }] },

    { id:'ses', disc:['music', 'diction'], icon:'wave', label:'Ses',
      note:'Gitar metronomu ve diksiyon',
      views:[{ route:'studio', label:'Stüdyo', icon:'wave' }] },

    { id:'okuma', disc:'reading', icon:'book', label:'Okuma',
      note:'Atomik not ve sentopik matris',
      views:[{ route:'library', label:'Kütüphane', icon:'book' }] },

    { id:'yazi', disc:'writing', icon:'quill', label:'Yazı',
      note:'Taslak, okunabilirlik ve üslup',
      views:[{ route:'writing', label:'Yazı Laboratuvarı', icon:'quill' }] },

    { id:'ofis', icon:'users', label:'Ofis',
      note:'Patron ve altı uzman',
      views:[
        { route:'office',    label:'Masalar',  icon:'users' },
        { route:'team',      label:'Danışma',  icon:'zap' },
        { route:'meeting',   label:'Toplantı', icon:'list' },
        { route:'analytics', label:'Analiz',   icon:'chart' },
      ] },

    { id:'ayarlar', icon:'sliders', label:'Ayarlar',
      note:'Profil, görünüm, veri ve rehber',
      views:[
        { route:'profile', label:'Profil', icon:'sliders' },
        { route:'guide',   label:'Rehber', icon:'guide' },
      ] },
  ];
