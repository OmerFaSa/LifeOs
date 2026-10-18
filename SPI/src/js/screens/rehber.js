/* Kütüphanem › Anlatımlar — SPİ'nin konu anlatımları (data/rehber.js; okuyucu
   brand/ortak/rehber.js). Kullanıcı (2026-10-18): «SPİ'ye anlatım yükle:
   spor, kilo, kalori, diyet, koşu, yürüyüş, kalistenik, sağlıklı beslenme».
   Anlatım bilgidir: hiçbir sayıyı ya da planı değiştirmez; sınır notu her
   sayfanın sonundadır. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.rehber = (function(){
  const RB = () => (window.LIFEOS || {}).REHBER;
  function hazirla(){
    const r = RB();
    if(r && !r.kuruluMu()) r.kur({ modul:'spi', konular:() => SP.REHBER_KONULAR || [], sinir:SP.REHBER_SINIR,
      ciz:() => SP.App.render() });
    return r;
  }
  function render(){
    const r = hazirla();
    if(!r) return '<p class="small muted">Anlatımlar bu açılışta yüklenemedi.</p>';
    return r.html();
  }
  return {
    id:'rehber',
    title:'Kütüphanem',
    subtitle(){ return (SP.REHBER_KONULAR || []).length + ' konu'; },
    lede(){ return ''; },
    actions(){ return ''; },
    render, handle:{},
  };
})();
