/* ÖRNEK VERİ (katalog 172) — yalnız «ornek» profilinde, açılışta BELLEĞE
   yazılır (brand/ortak/ornekkip.js). Kaynak: tools/envanter.js DOLDUR.ESP.
   Aynı kimlik varsa dokunulmaz: değişiklik ezilmez, kayıt ikilenmez. */
window.ESP = window.ESP || {};

ESP.OrnekVeri = (function(){
  function ekle(liste, kayit){ if(!liste.some(x => x.id === kayit.id)) liste.push(kayit); }

  function doldur(){
    const M = ESP.Model, U = ESP.U, S = ESP.S;
    /* Kurulum sihirbazı örnek profilde açılmasın (Setup.needed). */
    S.profile = S.profile || {};
    if(!S.profile.name) S.profile.name = 'Örnek';
    for(let i = 0; i < 24; i++){
      ekle(S.cards, Object.assign(M.newCard({ front:'kelime' + (i + 1), back:'karşılık' + (i + 1),
        lang:i % 9 === 0 ? ESP.HISTORY_DECK : 'en', box:1 + (i % 5), reps:i % 7,
        interval:1 + (i % 10), due:U.iso(U.addDays(U.today(), (i % 8) - 4)),
        history:[{ at:new Date().toISOString(), grade:'good', box:2, interval:3 }] }), { id:'ornek-c' + i }));
    }
    for(let i = 0; i < 6; i++){
      ekle(S.books, Object.assign(M.newBook({ title:'Örnek kitap ' + (i + 1), author:'Yazar ' + (i + 1) }), { id:'ornek-b' + i }));
      ekle(S.notes, Object.assign(M.newNote({ text:'Örnek not ' + (i + 1), concepts:[['zaman', 'adalet'][i % 2]],
        bookId:'ornek-b' + (i % 3) }), { id:'ornek-n' + i }));
      ekle(S.events, Object.assign(M.newEvent({ title:'Örnek olay ' + (i + 1), year:-500 + i * 300 }), { id:'ornek-o' + i }));
      ekle(S.drafts, Object.assign(M.newDraft({ title:'Örnek taslak ' + (i + 1),
        text:'Bu bir deneme cümlesidir. '.repeat(20), revisions:i % 3 }), { id:'ornek-t' + i }));
      ekle(S.pieces, Object.assign(M.newPiece({ name:'Örnek parça ' + (i + 1), cleanBpm:80 + i, targetBpm:140,
        attempts:[{ date:U.iso(U.addDays(U.today(), -i)), bpm:80 + i, clean:true }] }), { id:'ornek-p' + i }));
    }
    for(let i = 0; i < 14; i++){
      const g = M.ensureDay(U.iso(U.addDays(U.today(), -i)));
      if(!g.sessions.some(s => s.id === 'ornek-s' + i)){
        g.sessions.push({ id:'ornek-s' + i,
          disc:['lang', 'music', 'reading', 'writing', 'history'][i % 5],
          minutes:30, minutesCert:'measured', count:null, countCert:'missing',
          quality:null, qualityCert:'missing', ref:null, note:'', at:new Date().toISOString() });
      }
    }
  }

  return { doldur };
})();
