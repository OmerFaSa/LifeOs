/* Kütüphanem › Anlatımlar — ESP'nin her alana orta seviye konu anlatımı
   (data/rehber.js; okuyucu brand/ortak/rehber.js). Kullanıcı (2026-10-18):
   «ESP'de bölümlerin içine her alanın kendisiyle alakalı orta seviye bir
   anlatım». Çalışma'daki her alan bölümünün sonunda o alanın kartı durur
   (app.js); kart konuyu burada açar. ESP öğretmen değildir (ESP.PEDAGOGIC):
   anlatım seviye ya da yeterlilik yargısı kurmaz. */
window.LIFEOS.PARCA.yazilar({
  'esp.rehber.anlatimlar-bu-acilista-yukle':'Anlatımlar bu açılışta yüklenemedi.',
});


window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};
window.LIFEOS.PARCA.yazilar({
  'esp.rehber.kutuphanem':'Kütüphanem',
});
/* Menüde ayrı satır değil: Öğrenme'nin altından ve alanın «Öğren» kartından açılır (app.js UST). */
window.LIFEOS.PARCA.komut({ modul:'esp', sira:128, id:'act:anlatim', kind:'Eylem', label:'Konu anlatımları', hint:'Kütüphanem', run:() => ESP.App.go('rehber') });

ESP.Screens.rehber = (function(){
  const RB = () => (window.LIFEOS || {}).REHBER;
  /* Dinle düğmesi (ortak/kavrat.js) modülün kendi sesiyle okur; Türkçe ses yoksa düğme yok. */
  const SES = {
    var:() => !!(ESP.Speak && ESP.Speak.supported() && ESP.Speak.hasTurkish()),
    konus:m => ESP.Speak.say(m, { agent:'king' }),
    dur:() => { if(ESP.Speak) ESP.Speak.stop(); },
  };
  function hazirla(){
    const r = RB();
    if(r && !r.kuruluMu()) r.kur({ modul:'esp', ses:SES, konular:() => ESP.REHBER_KONULAR || [], sinir:ESP.REHBER_SINIR,
      ciz:() => ESP.App.render(), git:() => ESP.App.go('rehber') });
    return r;
  }
  LIFEOS.PARCA.blok({ id:'rehber.okuyucu', sayfa:'rehber', yer:'ana', ad:'Anlatımlar', ciz(){
    const r = hazirla();
    if(!r) return ('<p class="small muted">' + yz('esp.rehber.anlatimlar-bu-acilista-yukle') + '</p>');
    return r.html();
  } });
  function render(){ return LIFEOS.PARCA.yer('rehber', 'ana', ESP.C); }
  /* Çalışma bölümünün sonundaki kart (disc: 'lang' ya da ['music', 'diction']). */
  function alanKarti(disc){
    const r = hazirla();
    return r ? r.alanHtml([].concat(disc || [])) : '';
  }
  return {
    id:'rehber',
    title:yz('esp.rehber.kutuphanem'),
    subtitle(){ return (ESP.REHBER_KONULAR || []).length + ' konu'; },
    lede(){ return ''; },
    actions(){ return ''; },
    render, alanKarti, handle:{},
  };
})();
