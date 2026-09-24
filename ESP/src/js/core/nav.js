/* Gezinme mantığı — kullanıcının açık bölümlerine göre şerit kurar.

   Kabuktan ayrı durmasının tek sebebi test edilebilirlik: bölüm listesini
   sınamak için uygulamayı açmak gerekmesin.
*/

window.ESP = window.ESP || {};

ESP.Nav = (function(){
  function discOn(disc){
    if(!disc) return true;
    const list = Array.isArray(disc) ? disc : [disc];
    return list.some(id => ESP.Mod.isOn(id));
  }

  /* Çekmecenin adı ortak kaynaktan (LIFEOS.KABUK.CEKMECELER); kabuk
     yüklenmemişse (test sayfası) verideki ad. */
  function adOf(sec){
    const K = window.LIFEOS && window.LIFEOS.KABUK;
    const c = K && K.CEKMECELER ? K.CEKMECELER.find(x => x.id === sec.id) : null;
    return c ? c.ad : sec.label;
  }

  /* Bir çekmece açıktır, en az bir sayfası açıksa. */
  function sectionOn(sec){ return sec.views.some(v => discOn(v.disc)); }

  function sections(){
    let n = 0;
    return ESP.SECTIONS_ALL.map(sec => Object.assign({}, sec, { label:adOf(sec),
      views:sec.views.filter(v => discOn(v.disc)) }))
      .filter(sec => sec.views.length)
      .map(sec => { n++; return Object.assign(sec, { num:(n < 10 ? '0' : '') + n }); });
  }

  /* Kapalı disiplinin ekranı da kapalıdır: adresi elle yazan ya da eski bir
     derin bağlantıya tıklayan kullanıcı boş bir tezgâh görmez. */
  function viewOf(route){
    return ESP.SECTIONS_ALL.reduce((f, s) => f || s.views.find(v => v.route === route), null);
  }
  function routeOn(route){
    const v = viewOf(route);
    return v ? discOn(v.disc) : true;
  }

  function sectionOf(route){
    const list = sections();
    const bulunan = list.filter(sec => sec.views.some(v => v.route === route))[0];
    return bulunan || list[0];
  }

  return { sections, sectionOn, routeOn, sectionOf, viewOf, discOn,
    all:function(){ return ESP.SECTIONS_ALL; } };
})();
