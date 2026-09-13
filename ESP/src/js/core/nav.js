/* Gezinme mantığı — kullanıcının açık bölümlerine göre şerit kurar.

   Kabuktan ayrı durmasının tek sebebi test edilebilirlik: bölüm listesini
   sınamak için uygulamayı açmak gerekmesin.
*/

window.ESP = window.ESP || {};

ESP.Nav = (function(){
  function sectionOn(sec){
    if(!sec.disc) return true;
    const list = Array.isArray(sec.disc) ? sec.disc : [sec.disc];
    return list.some(id => ESP.Mod.isOn(id));
  }

  function sections(){
    let n = 0;
    return ESP.SECTIONS_ALL.filter(sectionOn).map(sec => {
      n++;
      return Object.assign({}, sec, { num:(n < 10 ? '0' : '') + n });
    });
  }

  /* Kapalı bölümün ekranı da kapalıdır: adresi elle yazan ya da eski bir
     derin bağlantıya tıklayan kullanıcı boş bir tezgâh görmez. */
  function routeOn(route){
    const sec = ESP.SECTIONS_ALL.filter(x => x.views.some(v => v.route === route))[0];
    return sec ? sectionOn(sec) : true;
  }

  function sectionOf(route){
    const list = sections();
    const bulunan = list.filter(sec => sec.views.some(v => v.route === route))[0];
    return bulunan || list[0];
  }



  return { sections, sectionOn, routeOn, sectionOf, all:function(){ return ESP.SECTIONS_ALL; } };
})();
