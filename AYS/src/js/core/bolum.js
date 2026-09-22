/* BÖLÜM GİZLEME — sistemi kullanıcının hayatına göre daraltmak.

   Herkes her bölümü kullanmaz. Video izlemeyen birine «Öğrenme»yi,
   sınama yapmayana «Sınama»yı göstermek gezinmeyi uzatır ve boş ekranlar
   «yapmadığın iş» gibi durur. Gizlenen bölüm:

     · gezinmede, mobil sekmelerde ve komut paletinde görünmez,
     · adresi açılırsa Bugün'e yönlenir,
     · ama VERİSİ SİLİNMEZ: geri açıldığında her şey yerindedir.

   ÇEKİRDEK GİZLENEMEZ. Bugün, Hafta, Plan, Dersler, Deneme, Tekrar,
   İlerleme, Ofis ve Rehber sistemin kendisidir; biri gizlenirse plan
   uygulanamaz ya da geri açmanın yolu kaybolur. Liste bu yüzden AÇIK
   yazılır: gizlenebilir olan sayılıdır, gerisi çekirdektir.

   ESP'nin `modules.js`inin AYS karşılığı. Açıp kapamak ORTA seviyeli bir
   aksiyondur (AGENTS.md §1.9, data/actions.js `bolum-ac-kapa`). */

window.R = window.R || {};

R.Bolum = (function(){
  const STORE = 'meta/bolumler';

  const GIZLENEBILIR = [
    { id:'learn',     ad:'Öğrenme',  takma:['öğrenme', 'video', 'ders notu'] },
    { id:'quiz',      ad:'Sınama',   takma:['sınama', 'quiz'] },
    { id:'solve',     ad:'Soru çöz', takma:['soru çöz', 'soru çözme'] },
    { id:'protocols', ad:'Telafi',   takma:['telafi'] },
    { id:'analytics', ad:'Analiz',   takma:['analiz'] },
    { id:'rutbe',     ad:'Rütbe',    takma:['rütbe', 'seviye', 'xp'] },
  ];
  const BY_ID = GIZLENEBILIR.reduce((m, b) => { m[b.id] = b; return m; }, {});

  function harita(){
    const m = R.S && R.S.bolumGizli;
    return (m && typeof m === 'object' && !Array.isArray(m)) ? m : {};
  }

  function gizli(route){ return !!BY_ID[route] && harita()[route] === true; }
  function gizlenebilir(route){ return !!BY_ID[route]; }

  async function yukle(){
    let doc = null;
    try{ doc = await R.Store.get(STORE); }catch(e){ doc = null; }
    const g = (doc && doc.gizli && typeof doc.gizli === 'object' && !Array.isArray(doc.gizli)) ? doc.gizli : {};
    const temiz = {};
    Object.keys(g).forEach(id => { if(BY_ID[id] && g[id] === true) temiz[id] = true; });
    R.S.bolumGizli = temiz;
    return temiz;
  }

  /* Açar ya da gizler. Çekirdek ya da bilinmeyen bölüm bir RED'dir. */
  async function set(route, acik){
    if(!BY_ID[route]) return { ok:false, error:'Bu bölüm gizlenemez.' };
    const m = Object.assign({}, harita());
    if(acik) delete m[route]; else m[route] = true;
    R.S.bolumGizli = m;
    await R.Store.set(STORE, { gizli:m });
    return { ok:true };
  }

  function liste(){
    return GIZLENEBILIR.map(b => Object.assign({ acik:!gizli(b.id) }, b));
  }

  return { STORE, GIZLENEBILIR, BY_ID, gizli, gizlenebilir, yukle, set, liste };
})();
