/* EVDEKİNDEN YEMEK (fikir 29) — «evde şunlar var, ne pişirebilirim?»

   Sözler:
     1. TARİF UYDURULMAZ. Aşağıdaki liste ev yemeklerinin GENEL malzeme
        listesidir (miktar ve pişirme yöntemi yok); yalnız «bu malzemelerle
        hangi yemek olur» sorusuna cevap verir. Model çağrılmaz.
     2. GEREKLİ ve İSTEĞE BAĞLI ayrıdır. Bir yemek, gerekli malzemelerinin
        hepsi varsa «yapılabilir», bir-iki eksikle «eksikle» listelenir ve
        eksik ADIYLA söylenir. Yağ ve tuz her evde var sayılmaz ama hiçbir
        yemeği düşürmez: listede yoktur.
     3. ANLAŞILMAYAN MALZEME SÖYLENİR. Yazılan bir kelime hiçbir malzemeye
        eşleşmezse sessizce atılmaz, «tanınmadı» diye geri gösterilir.
     4. Besin değeri yemeğin gıda kaydından (data/foods.js) gelir. */

window.SP = window.SP || {};

SP.Evdeki = (function(){
  const U = () => SP.U;

  /* Malzeme sözlüğü: kimlik → ad ve eş anlamlılar. */
  const MALZEME = {
    yumurta:{ ad:'yumurta', es:['yumurta'] },
    domates:{ ad:'domates', es:['domates'] },
    biber:{ ad:'biber', es:['biber', 'sivri biber', 'yesil biber', 'kapya'] },
    sogan:{ ad:'soğan', es:['sogan', 'kuru sogan'] },
    salca:{ ad:'salça', es:['salca', 'domates salcasi', 'biber salcasi'] },
    mercimek:{ ad:'kırmızı mercimek', es:['mercimek', 'kirmizi mercimek'] },
    fasulye:{ ad:'kuru fasulye', es:['kuru fasulye', 'fasulye'] },
    nohut:{ ad:'nohut', es:['nohut'] },
    pirinc:{ ad:'pirinç', es:['pirinc'] },
    bulgur:{ ad:'bulgur', es:['bulgur'] },
    makarna:{ ad:'makarna', es:['makarna', 'spagetti', 'eriste'] },
    kiyma:{ ad:'kıyma', es:['kiyma'] },
    et:{ ad:'et', es:['et', 'dana eti', 'kuzu eti', 'kusbasi'] },
    tavuk:{ ad:'tavuk', es:['tavuk', 'tavuk gogsu', 'but'] },
    patlican:{ ad:'patlıcan', es:['patlican'] },
    patates:{ ad:'patates', es:['patates'] },
    kabak:{ ad:'kabak', es:['kabak'] },
    taze_fasulye:{ ad:'taze fasulye', es:['taze fasulye'] },
    ekmek:{ ad:'ekmek', es:['ekmek', 'tost ekmegi', 'bayat ekmek'] },
    kasar:{ ad:'kaşar', es:['kasar', 'kasar peyniri'] },
    peynir:{ ad:'beyaz peynir', es:['beyaz peynir', 'peynir'] },
    yufka:{ ad:'yufka', es:['yufka'] },
    un:{ ad:'un', es:['un'] },
    sut:{ ad:'süt', es:['sut'] },
    ispanak:{ ad:'ıspanak', es:['ispanak'] },
    havuc:{ ad:'havuç', es:['havuc'] },
  };

  /* Yemek (gıda kimliği) → gerekli / isteğe bağlı malzeme. */
  const YEMEK = [
    { id:'menemen', gerek:['yumurta', 'domates', 'biber'], ister:['sogan'] },
    { id:'mercimek-corbasi', gerek:['mercimek', 'sogan'], ister:['havuc', 'patates', 'un'] },
    { id:'kuru-fasulye-etli', gerek:['fasulye', 'sogan', 'salca'], ister:['et', 'kiyma'] },
    { id:'nohut-yemegi', gerek:['nohut', 'sogan', 'salca'], ister:['et', 'kiyma'] },
    { id:'pilav', gerek:['pirinc'], ister:[] },
    { id:'bulgur-pilavi', gerek:['bulgur', 'sogan'], ister:['domates', 'salca', 'biber'] },
    { id:'makarna', gerek:['makarna'], ister:['domates', 'salca', 'kiyma'] },
    { id:'tavuk-sote', gerek:['tavuk', 'biber', 'domates'], ister:['sogan'] },
    { id:'kofte', gerek:['kiyma', 'sogan'], ister:['ekmek', 'yumurta'] },
    { id:'karniyarik', gerek:['patlican', 'kiyma', 'sogan', 'domates'], ister:['biber'] },
    { id:'etli-sebze', gerek:['et', 'sogan'], ister:['patates', 'kabak', 'havuc', 'salca'] },
    { id:'zeytinyagli-sebze', gerek:['sogan', 'domates'], ister:['taze_fasulye', 'kabak'], birini:['taze_fasulye', 'kabak', 'ispanak'] },
    { id:'tost', gerek:['ekmek', 'kasar'], ister:[] },
    { id:'borek', gerek:['yufka', 'peynir'], ister:['yumurta', 'sut', 'ispanak'] },
  ];

  /* Metinden malzeme: virgül, «ve», satır. Eşleşmeyen parça geri döner. */
  function oku(metin){
    const parca = String(metin || '').split(/[,;\n]+|\s+ve\s+/i).map(s => s.trim()).filter(Boolean);
    const var_ = {}, taninmayan = [];
    parca.forEach(p => {
      const n = U().norm(p).replace(/\s+/g, ' ');
      /* En UZUN eşleşen ad kazanır: «taze fasulye» kuru fasulyeye düşmez. */
      let bulundu = null, boy = 0;
      Object.keys(MALZEME).forEach(id => MALZEME[id].es.forEach(e => {
        if((n === e || (e.length >= 4 && n.indexOf(e) >= 0)) && e.length > boy){ bulundu = id; boy = e.length; }
      }));
      if(bulundu) var_[bulundu] = true; else taninmayan.push(p);
    });
    return { var:Object.keys(var_), taninmayan };
  }

  /* Sepetteki gıdalar malzemeye çevrilir (yalnız eşleşebilenler). */
  function sepettenMalzeme(){
    const esle = { 'yumurta':'yumurta', 'domates':'domates', 'biber':'biber', 'sogan':'sogan',
      'kirmizi-mercimek':'mercimek', 'kuru-fasulye':'fasulye', 'nohut':'nohut', 'kiyma':'kiyma',
      'dana-eti':'et', 'kuzu-eti':'et', 'tavuk-gogsu':'tavuk', 'patates':'patates', 'ispanak':'ispanak',
      'kasar':'kasar', 'beyaz-peynir':'peynir', 'sut':'sut', 'beyaz-ekmek':'ekmek', 'tam-bugday-ekmek':'ekmek' };
    const out = {};
    ((SP.S.basket && SP.S.basket.items) || []).forEach(it => { if(esle[it.foodId]) out[esle[it.foodId]] = true; });
    return Object.keys(out);
  }

  function oner(varListesi, enCokEksik){
    const var_ = {};
    (varListesi || []).forEach(id => { var_[id] = true; });
    const sinir = enCokEksik == null ? 2 : enCokEksik;
    const out = YEMEK.map(y => {
      const f = SP.FOOD_BY_ID && SP.FOOD_BY_ID[y.id];
      if(!f) return null;
      const eksik = y.gerek.filter(m => !var_[m]);
      if(y.birini && !y.birini.some(m => var_[m])) eksik.push(y.birini.map(m => MALZEME[m].ad).join(' / '));
      const eksikAd = eksik.map(m => MALZEME[m] ? MALZEME[m].ad : m);
      const arti = (y.ister || []).filter(m => var_[m]).map(m => MALZEME[m].ad);
      return { yemek:f, eksik:eksikAd, var:y.gerek.filter(m => var_[m]).map(m => MALZEME[m].ad), arti };
    }).filter(r => r && r.eksik.length <= sinir && r.var.length > 0);
    return out.sort((a, b) => a.eksik.length - b.eksik.length || b.var.length - a.var.length);
  }

  return { MALZEME, YEMEK, oku, oner, sepettenMalzeme };
})();
