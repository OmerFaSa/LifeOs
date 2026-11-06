/* Kütüphanem › Öğrenme — ESP konularını öğrenme motoruna bağlar (ortak/ogrenmotor.js).

   Kaynak: etkin alanların öğrenme kartları (68) ve Anlatımlar (14). Kartın cevabı
   `ESP.Alan.kaydet` ile alan kaydına da yazılır, Merdiven ve konu listeleri aynı aşamayı
   görür. ESP seviye ya da yetenek yargısı kurmaz, sertifika vermez (AGENTS §1.5). */
window.LIFEOS.PARCA.yazilar({
  'esp.ogrenme.inceleme':'öğretmen incelemesi bekliyor',
  'esp.ogrenme.baslik':'Kütüphanem',
});

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};
window.LIFEOS.PARCA.sayfa({ id:'ogrenme', modul:'esp', king:{ sira:128, ad:'Öğrenme', es:['öğrenme', 'konu öğren', 'adım adım öğren', 'öğrenme motoru'] }, cekmece:'kutuphane', ad:'Öğrenme', sira:15 });

ESP.Screens.ogrenme = (function(){
  const OM = () => window.LIFEOS.OGRENMOTOR;
  const SES = {
    var:() => !!(ESP.Speak && ESP.Speak.supported() && ESP.Speak.hasTurkish()),
    konus:m => ESP.Speak.say(m, { agent:'king' }),
    dur:() => { if(ESP.Speak) ESP.Speak.stop(); },
  };
  const discAd = d => (ESP.DISCIPLINE_BY_ID[d] || {}).label || d;
  const etkin = () => ESP.Mod.active().map(d => d.id);

  function liste(){
    const e = etkin();
    return (ESP.REHBER_KONULAR || []).filter(k => e.indexOf(k.disc) >= 0).map(k => ({ id:k.id, ad:k.ad, grup:k.disc, grupAd:discAd(k.disc) }))
      .concat(ESP.Alan.konular().map(t => ({ id:t.id, ad:t.title, grup:t.disc, grupAd:discAd(t.disc) })));
  }

  function kartKonu(t, c){
    const ornek = c.worked_example && c.worked_example.text;
    const p = c.practice || {}, tr = c.transfer || {};
    /* Soruların çoğu «bu durumda» der: örnek sorunun parçasıdır (usta planı, 2026-11-05). */
    return { id:t.id, ad:t.title, grup:t.disc, grupAd:discAd(t.disc), etiket:c.ready_for_app ? '' : yz('esp.ogrenme.inceleme'),
      kazanim:c.goal ? [c.goal] : [], parcalar:[{ baslik:c.title, metin:c.explanation }], ornekler:ornek ? [{ soru:ornek, cozum:[] }] : [],
      hatalar:c.common_misinterpretation ? [c.common_misinterpretation] : [],
      acik:p.prompt ? [{ id:'calisma', soru:ornek ? [ornek, p.prompt] : p.prompt, yanit:p.expected_answer || '' }] : [],
      aktarim:tr.prompt ? [{ id:'aktarim', soru:tr.prompt, olcut:tr.rubric || [] }] : [], niyet:true };
  }
  function konu(id){
    const r = (ESP.REHBER_KONULAR || []).find(k => k.id === id);
    if(r) return OM().rehberKonu(r, { grup:r.disc, grupAd:discAd(r.disc), niyet:true, sinir:ESP.REHBER_SINIR });
    const t = ESP.Alan.konuOf(id), c = (ESP.OGRENME_KARTI_BY_TOPIC || {})[id];
    return t && c ? kartKonu(t, c) : null;
  }

  function hazirla(){
    if(!OM() || OM().kuruluMu()) return;
    OM().kur({ modul:'esp',
      depo:{ oku:k => ESP.Store.get(k), yaz:(k, v) => ESP.Store.set(k, v) },
      bugun:() => ESP.U.todayISO(),
      konular:liste, konu, ses:SES, sinir:ESP.REHBER_SINIR,
      metin:s => window.LIFEOS.REHBER.metinHtml(s),
      ekKanit:id => ((ESP.S && ESP.S.alanKanit) || {})[id] || [],
      ekIdler:() => Object.keys((ESP.S && ESP.S.alanKanit) || {}),
      git:() => ESP.App.go('ogrenme'),
      async cevapKanca(c){
        if(ESP.Alan.konuOf(c.konu)) await ESP.Alan.kaydet(c.konu, c.isabet, { guven:c.guven, karisik:c.karisik });
      },
    });
  }
  hazirla();

  LIFEOS.PARCA.blok({ id:'ogrenme.motor', sayfa:'ogrenme', yer:'ana', ad:'Öğrenme', ciz(){ return window.LIFEOS.OMEKRAN.html(); } });
  function render(){ return LIFEOS.PARCA.yer('ogrenme', 'ana', ESP.C); }
  return { id:'ogrenme', title:yz('esp.ogrenme.baslik'), subtitle(){ return ''; }, lede(){ return ''; }, actions(){ return ''; }, render, handle:{}, hazirla };
})();
