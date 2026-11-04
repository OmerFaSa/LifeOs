/* Kütüphanem › Anlatımlar — ESP'nin her alana orta seviye konu anlatımı
   (data/rehber.js; okuyucu brand/ortak/rehber.js). Kullanıcı (2026-10-18):
   «ESP'de bölümlerin içine her alanın kendisiyle alakalı orta seviye bir
   anlatım». Çalışma'daki her alan bölümünün sonunda o alanın kartı durur
   (app.js); kart konuyu burada açar. ESP öğretmen değildir (ESP.PEDAGOGIC):
   anlatım seviye ya da yeterlilik yargısı kurmaz. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};
window.LIFEOS.PARCA.yazilar({
  'esp.rehber.kutuphanem':'Kütüphanem',
});
window.LIFEOS.PARCA.sayfa({ id:'rehber', modul:'esp', cekmece:'kutuphane', ad:'Anlatımlar', sira:20 });

ESP.Screens.rehber = (function(){
  const RB = () => (window.LIFEOS || {}).REHBER;
  function hazirla(){
    const r = RB();
    if(r && !r.kuruluMu()) r.kur({ modul:'esp', konular:() => ESP.REHBER_KONULAR || [], sinir:ESP.REHBER_SINIR,
      ciz:() => ESP.App.render(), git:() => ESP.App.go('rehber') });
    return r;
  }
  LIFEOS.PARCA.blok({ id:'rehber.okuyucu', sayfa:'rehber', yer:'ana', ad:'Anlatımlar', ciz(){
    const r = hazirla();
    if(!r) return '<p class="small muted">Anlatımlar bu açılışta yüklenemedi.</p>';
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
