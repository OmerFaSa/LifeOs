/* ÖRNEK VERİ (katalog 172) — yalnız «ornek» profilinde, açılışta BELLEĞE
   yazılır (brand/ortak/ornekkip.js). Kaynak: tools/envanter.js DOLDUR.AYS.
   Tekrar açılışta aynı kimlikli kayıt varsa dokunulmaz: kullanıcının örnek
   profilde yaptığı değişiklik ezilmez, kayıt da ikilenmez. */
window.R = window.R || {};

R.OrnekVeri = (function(){
  function ekle(liste, kayit){ if(!liste.some(x => x.id === kayit.id)) liste.push(kayit); }

  function doldur(){
    const U = R.U, S = R.S;
    S.profile.setupDone = true;
    for(let i = 0; i < 21; i++){
      const d = U.iso(U.addDays(U.today(), -i));
      if(S.days[d]) continue;
      S.days[d] = { date:d, dow:i % 7, ritual:null,
        paragraphTarget:18, paragraphActual:15 + (i % 5),
        freeQ:20, freeCorrect:15, problemTarget:18, problemActual:16,
        sleepHours:7 + (i % 3) * 0.5, checklist:{},
        blocks:[
          { id:'b0', slot:'Sabah', subject:'TYT Matematik', topic:'Türev',
            targetMin:70, targetQ:25, status:i ? 'done' : 'planned',
            actualMin:i ? 65 : null, actualQ:i ? 24 : null, correctQ:i ? 18 : null },
          { id:'b1', slot:'Akşam', subject:'TYT Türkçe', topic:'Paragraf',
            targetMin:70, targetQ:30, status:i ? 'done' : 'planned',
            actualMin:i ? 68 : null, actualQ:i ? 28 : null, correctQ:i ? 22 : null },
        ], note:'' };
    }
    for(let i = 0; i < 4; i++){
      ekle(S.exams, { id:'ornek-e' + i, date:U.iso(U.addDays(U.today(), -(i * 7))),
        type:'Tam TYT', family:'TYT', kind:'full', publisher:'345', duration:165,
        tests:[
          { name:'Türkçe', correct:28 + i, wrong:6, blank:6, minutes:null },
          { name:'Matematik', correct:18 + i, wrong:8, blank:14, minutes:null },
        ],
        protocol:{}, createdAt:new Date().toISOString(),
        analysisCompletedAt:i ? new Date().toISOString() : null });
    }
    for(let i = 0; i < 12; i++){
      ekle(S.cards, { id:'ornek-c' + i, front:'Örnek soru ' + (i + 1), back:'Örnek cevap ' + (i + 1),
        subjectId:'tyt-matematik', stage:1 + (i % 4),
        dueAt:U.iso(U.addDays(U.today(), (i % 6) - 3)),
        lastReviewedAt:U.iso(U.addDays(U.today(), -(i % 5))),
        history:[{ at:U.todayISO(), rating:'remembered', result:'remembered', stage:2, gapDays:3 }] });
    }
    for(let i = 0; i < 8; i++){
      ekle(S.errors, { id:'ornek-er' + i, examId:'ornek-e' + (i % 4),
        createdAt:new Date().toISOString(), tag:['K', 'İ', 'Y', 'S', 'D'][i % 5],
        subject:'TYT Matematik', topic:'Türev', note:'Örnek kök neden ' + (i + 1),
        closedAt:i % 3 ? new Date().toISOString() : null });
    }
  }

  return { doldur };
})();
