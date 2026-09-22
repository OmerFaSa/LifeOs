/* BÖLÜM GİZLEME — SPİ'yi kullanıcının hayatına göre daraltmak.

   Herkes her alanı izlemez: bütçe tutmayan birine Finans'ı, mutfakla
   ilgilenmeyene Mutfak'ı göstermek gezinmeyi uzatır ve boş ekran «yapmadığın
   iş» gibi durur. Gizlenen bölüm:

     · gezinmede, alt sekmelerde ve komut paletinde görünmez,
     · adresi açılırsa Günlük'e yönlenir,
     · ama VERİSİ SİLİNMEZ: geri açıldığında her şey yerindedir.

   ÇEKİRDEK GİZLENEMEZ. Günlük (vital), Testler (tahlil), Ofis, Hane ve
   Rehber sistemin kendisidir. Liste AÇIK yazılır.

   Açıp kapamak ORTA seviyeli bir aksiyondur (AGENTS.md §1.9,
   core/proposals.js `bolum-ac-kapa`). Konuşarak da istenebilir: «finans
   bölümünü kapat»; hangi bölüm olduğu belli değilse SORULUR. */

window.SP = window.SP || {};

SP.Bolum = (function(){
  const STORE = 'meta/bolumler';

  const GIZLENEBILIR = [
    { id:'meals',   ad:'Öğünler', takma:['öğün', 'beslenme', 'besin'] },
    { id:'kitchen', ad:'Mutfak',  takma:['mutfak', 'tarif'] },
    { id:'move',    ad:'Hareket', takma:['hareket', 'antrenman', 'spor', 'egzersiz'] },
    { id:'basket',  ad:'Finans',  takma:['finans', 'bütçe', 'para'] },
    { id:'rutbe',   ad:'Rütbe',   takma:['rütbe', 'seviye', 'xp'] },
  ];
  const BY_ID = GIZLENEBILIR.reduce((m, b) => { m[b.id] = b; return m; }, {});

  function harita(){
    const m = SP.S && SP.S.bolumGizli;
    return (m && typeof m === 'object' && !Array.isArray(m)) ? m : {};
  }

  function gizli(route){ return !!BY_ID[route] && harita()[route] === true; }

  async function yukle(){
    let doc = null;
    try{ doc = await SP.Store.get(STORE); }catch(e){ doc = null; }
    const g = (doc && doc.gizli && typeof doc.gizli === 'object' && !Array.isArray(doc.gizli)) ? doc.gizli : {};
    const temiz = {};
    Object.keys(g).forEach(id => { if(BY_ID[id] && g[id] === true) temiz[id] = true; });
    SP.S.bolumGizli = temiz;
    return temiz;
  }

  async function set(route, acik){
    if(!BY_ID[route]) return { ok:false, error:'Bu bölüm gizlenemez.' };
    const m = Object.assign({}, harita());
    if(acik) delete m[route]; else m[route] = true;
    SP.S.bolumGizli = m;
    await SP.Store.set(STORE, { gizli:m });
    return { ok:true };
  }

  function liste(){ return GIZLENEBILIR.map(b => Object.assign({ acik:!gizli(b.id) }, b)); }

  /* ----------------------------------------------------- konuşarak */

  const HARF = 'a-zçğıöşü';
  /* «istemiyorum» BİLEREK yok: «öğün atlamak istemiyorum», «para harcamak
     istemiyorum» sağlık sohbetinde sık geçer ve bölüm isteği değildir. */
  const KAPAT_RE = /(kapat|kapansın|gizle|gizlensin|kullanmıyorum|kullanmayacağım|kaldır)/;
  const AC_RE = new RegExp('((?<![' + HARF + '])aç(?![' + HARF + '])|açılsın|geri getir|göster|tekrar aç|geri aç)');

  function anla(text){
    const metin = String(text || '').trim();
    const t = metin.toLocaleLowerCase('tr');
    const out = { oneriler:[], sorular:[], komut:false };
    const kapat = KAPAT_RE.test(t);
    const ac = !kapat && AC_RE.test(t);
    if(!kapat && !ac) return out;
    const idler = GIZLENEBILIR.filter(b => b.takma.some(a => t.indexOf(a) >= 0)).map(b => b.id);
    if(!idler.length){
      if(/bölüm/.test(t)){
        out.sorular.push({ metin, soru:'Hangi bölümü ' + (kapat ? 'gizleyeyim' : 'açayım')
          + '? «Öğünler», «Mutfak», «Hareket», «Finans» ya da «Rütbe» diyebilirsin.' });
        out.komut = true;
      }
      return out;
    }
    idler.forEach(id => out.oneriler.push({ action:'bolum-ac-kapa',
      params:{ bolum:id, acik:kapat ? 0 : 1 }, metin }));
    out.komut = true;
    return out;
  }

  return { STORE, GIZLENEBILIR, BY_ID, gizli, yukle, set, liste, anla };
})();
