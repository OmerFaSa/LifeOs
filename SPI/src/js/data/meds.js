/* ILAC VE TAKVIYE TURLERI — Modul 1'in eksik parcasi.

   Sistem «doz onermez» kuralini dogru uyguluyordu ama NE KULLANILDIGINI
   da kaydetmiyordu. Oysa bir hap olcumu degistirir: demir takviyesi
   ferritini yukseltir, statin LDL'yi dusurur, mide ilaci B12 emilimini
   bozar.

   Bu olmadan kisisel taban cizgi motoru «ferritin gercekten yukseldi»
   diyor — SEBEBINI BILMEDEN. Kullanici uc aydir demir hapi iciyorsa bu
   bir basari degil, beklenen bir sonuctur. Kayit olmadan sistem ikisini
   ayiramaz ve yanlis cesaret verir.

   ─────────────────────────────────────────────────────────────────

   UC DEGISMEZ:

   1. Sistem SERBEST METINDEN tahmin etmez. Kullanici bir TUR secer;
      etki eslemesi o turden gelir. «Ferrosanol» yazan bir kutudan
      demir cikarimi yapmak, uydurmaktir.

   2. Sistem DOZ ONERMEZ, BASLATMAZ, KESTIRMEZ. Yalnizca «bu olcumu
      etkileyen bir sey kullaniyorsun» der. Ilac kararlari hekimindir.

   3. Etki yonu TAHMIN DEGIL BEKLENTIDIR. «Yukselir» demek «yukselecek»
      demek degil; olculen degisim beklenen yonde ise sistem bunu
      SOYLER, degilse susar. Hicbir sayi bu tablodan uretilmez.

   `affects` icindeki `dir` degeri olcumun BEKLENEN yonudur:
     'up'    kullanildiginda olcum yukselir
     'down'  kullanildiginda olcum duser */

window.SP = window.SP || {};

SP.MED_KINDS = [
  /* ---------------------------------------------------------- takviye */
  { id:'demir', name:'Demir takviyesi', group:'takviye',
    affects:[{ id:'ferritin', dir:'up' }, { id:'hgb', dir:'up' },
             { id:'tsat', dir:'up' }, { id:'iron_s', dir:'up' }],
    note:'Demir deposunu doğrudan yükseltir. Ferritindeki artış çoğu zaman '
      + 'beslenmenin değil takviyenin sonucudur.' },

  { id:'b12', name:'B12 takviyesi', group:'takviye',
    affects:[{ id:'b12', dir:'up' }],
    note:'Kan B12 değerini hızla yükseltir; depo dolması daha uzun sürer.' },

  { id:'dvit', name:'D vitamini', group:'takviye',
    affects:[{ id:'vitd', dir:'up' }, { id:'ca', dir:'up' },
             { id:'ca_corr', dir:'up' }],
    note:'25-OH D değerini yükseltir ve kalsiyum emilimini artırır.' },

  { id:'folat', name:'Folik asit', group:'takviye',
    affects:[{ id:'folate', dir:'up' }, { id:'mcv', dir:'down' }],
    note:'Folat düzeyini yükseltir; büyümüş eritrositleri küçültebilir.' },

  { id:'magnezyum', name:'Magnezyum', group:'takviye',
    affects:[{ id:'mg', dir:'up' }],
    note:'Serum magnezyumu deponun küçük bir kısmını gösterir; değişim sınırlı kalabilir.' },

  { id:'cinko', name:'Çinko', group:'takviye',
    affects:[{ id:'zinc', dir:'up' }],
    note:'Uzun süre yüksek dozda kullanıldığında bakır emilimini bozar.' },

  { id:'omega3', name:'Omega-3 (balık yağı)', group:'takviye',
    affects:[{ id:'trig', dir:'down' }, { id:'tg_hdl', dir:'down' }],
    note:'Trigliseriti düşürür; LDL üzerindeki etkisi değişkendir.' },

  { id:'kreatin', name:'Kreatin', group:'takviye',
    affects:[{ id:'creat', dir:'up' }, { id:'egfr', dir:'down' }],
    note:'Kan kreatinini yükseltir ve eGFR\'yi olduğundan düşük gösterir. '
      + 'Bu bir böbrek bulgusu değildir — kreatin kullanırken eGFR yorumlanmaz.' },

  { id:'protein-tozu', name:'Protein tozu', group:'takviye',
    affects:[{ id:'urea', dir:'up' }, { id:'creat', dir:'up' }],
    note:'Yüksek protein alımı üre ve kreatinini bir miktar yükseltebilir.' },

  { id:'multivitamin', name:'Multivitamin', group:'takviye',
    affects:[{ id:'b12', dir:'up' }, { id:'folate', dir:'up' },
             { id:'vitd', dir:'up' }, { id:'zinc', dir:'up' }],
    note:'İçeriği markaya göre değişir; birden çok ölçümü aynı anda etkileyebilir.' },

  /* ------------------------------------------------------------ ilaç */
  { id:'statin', name:'Statin (kolesterol ilacı)', group:'ilac',
    affects:[{ id:'ldl', dir:'down' }, { id:'chol', dir:'down' },
             { id:'nonhdl', dir:'down' }, { id:'alt', dir:'up' }],
    note:'LDL\'yi belirgin düşürür. Karaciğer enzimlerinde hafif yükselme olağandır.' },

  { id:'ppi', name:'Mide koruyucu (PPİ)', group:'ilac',
    affects:[{ id:'b12', dir:'down' }, { id:'mg', dir:'down' },
             { id:'ferritin', dir:'down' }],
    note:'Mide asidini düşürür; B12, magnezyum ve demir emilimini bozar. '
      + 'Uzun kullanımda bu üç değer sebepsiz düşmüş gibi görünür.' },

  { id:'metformin', name:'Metformin', group:'ilac',
    affects:[{ id:'glucose', dir:'down' }, { id:'hba1c', dir:'down' },
             { id:'eag', dir:'down' }, { id:'b12', dir:'down' }],
    note:'Şekeri düşürür; uzun kullanımda B12 emilimini de bozar.' },

  { id:'levotiroksin', name:'Tiroit hormonu (levotiroksin)', group:'ilac',
    affects:[{ id:'tsh', dir:'down' }, { id:'ft4', dir:'up' }, { id:'ft3', dir:'up' }],
    note:'TSH\'yi düşürür, serbest T4\'ü yükseltir. Doz değişince altı hafta '
      + 'geçmeden ölçüm oturmaz.' },

  { id:'kortikosteroid', name:'Kortizon (steroit)', group:'ilac',
    affects:[{ id:'glucose', dir:'up' }, { id:'wbc', dir:'up' },
             { id:'cortisol', dir:'up' }],
    note:'Kan şekerini ve lökositi yükseltir. Kısa kullanımda bile ölçümü etkiler.' },

  { id:'dogum-kontrol', name:'Doğum kontrol hapı', group:'ilac',
    affects:[{ id:'ferritin', dir:'up' }, { id:'trig', dir:'up' },
             { id:'hdl', dir:'up' }],
    note:'Adet kanamasını azalttığı için demir deposunu yükseltebilir; '
      + 'lipid tablosunu da değiştirir.' },

  { id:'tansiyon', name:'Tansiyon ilacı', group:'ilac',
    affects:[{ id:'sbp', dir:'down' }, { id:'dbp', dir:'down' },
             { id:'k', dir:'up' }],
    note:'Tansiyonu düşürür. Bazı türleri potasyumu yükseltir.' },

  /* Eslemesi olmayan secim: sistem hicbir olcume dokunmaz ama kayit durur. */
  { id:'diger', name:'Diğer', group:'diger', affects:[],
    note:'Bu tür için sistemde tanımlı bir ölçüm etkisi yok. Kayıt durur, '
      + 'hekim çıktısında görünür; hiçbir ölçüm yorumu değişmez.' },
];

SP.MED_BY_ID = SP.MED_KINDS.reduce(function(acc, m){ acc[m.id] = m; return acc; }, {});

SP.MED_GROUPS = [
  { id:'takviye', name:'Takviye' },
  { id:'ilac',    name:'İlaç' },
  { id:'diger',   name:'Diğer' },
];

/* Hangi olcumu hangi turler etkiler? Ters indeks — ekranlar ve kural
   motoru bir olcumden yola cikar. */
SP.MED_AFFECTING = (function(){
  const m = {};
  SP.MED_KINDS.forEach(function(k){
    k.affects.forEach(function(a){
      (m[a.id] = m[a.id] || []).push({ kind:k, dir:a.dir });
    });
  });
  return m;
})();
