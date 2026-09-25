/* ÖRNEK VERİ (katalog 172) — yalnız «ornek» profilinde, açılışta BELLEĞE
   yazılır (brand/ortak/ornekkip.js). Kaynak: tools/envanter.js DOLDUR.SPI.
   Aynı gün ya da kimlik varsa dokunulmaz: değişiklik ezilmez, ikilenmez. */
window.SP = window.SP || {};

SP.OrnekVeri = (function(){
  function ekle(liste, kayit){ if(!liste.some(x => x.id === kayit.id)) liste.push(kayit); }

  function doldur(){
    const U = SP.U, S = SP.S;
    /* Kurulum sihirbazı örnek profilde açılmasın (Setup.needed). */
    S.profile = S.profile || {};
    const v = { name:'Örnek', birthYear:1995, heightCm:175, weightKg:78 };
    Object.keys(v).forEach(k => { if(!S.profile[k]) S.profile[k] = v[k]; });
    for(let i = 0; i < 21; i++){
      const d = U.iso(U.addDays(U.today(), -i));
      if(!S.vitals[d]){
        S.vitals[d] = { sleep:7 + (i % 3) * 0.5, hrv:55 + (i % 15),
          rhr:56 + (i % 8), soreness:2 + (i % 4), weight:78 - (i % 10) * 0.1 };
      }
      if(!S.meals[d]){
        S.meals[d] = [
          { id:'ornek-m' + i + 'a', slot:'kahvalti',
            items:[{ foodId:'yumurta', grams:100 }, { foodId:'ekmek-tam-bugday', grams:60 }] },
          { id:'ornek-m' + i + 'b', slot:'ogle',
            items:[{ foodId:'mercimek-corbasi', grams:300 }, { foodId:'pilav', grams:150 }] },
        ];
      }
      if(i % 2 === 0){
        ekle(S.workouts, { id:'ornek-w' + i, date:d, name:'Örnek seans ' + (i / 2 + 1),
          kind:i % 4 ? 'strength' : 'cardio', items:[], minutes:45,
          rpe:6 + (i % 3), note:'', createdAt:new Date().toISOString() });
      }
    }
    for(let i = 0; i < 3; i++){
      ekle(S.labs, { id:'ornek-l' + i, date:U.iso(U.addDays(U.today(), -(i * 30))),
        lab:'Örnek laboratuvar',
        values:{ hgb:{ v:14 + i * 0.2, cert:'measured' },
          ferritin:{ v:50 + i * 2, cert:'measured' },
          glucose:{ v:88 + i, cert:'measured' } } });
    }
    ekle(S.meds, { id:'ornek-med0', kindId:'diger', name:'Örnek kayıt', dose:'1x1',
      startDate:U.iso(U.addDays(U.today(), -20)), endDate:null, note:'',
      createdAt:new Date().toISOString() });
  }

  return { doldur };
})();
