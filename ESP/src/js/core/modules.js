/* Bölüm açma–kapama — sistemi kullanıcının hayatına göre daraltmak.

   Yedi disiplinin hepsini herkes çalışmaz. Gitara hiç dokunmayacak birine
   Stüdyo'yu, metronomu, temiz BPM eşiğini ve Maestro'nun masasını göstermek
   üç şeyi birden bozar: gezinme şeridi uzar, boş ekranlar «yapmadığın iş»
   gibi durur, ve denge hesabı hiç açılmayacak bir disiplini sürekli «hiç
   dokunulmamış» diye rapor eder.

   Bu yüzden her disiplin AÇILIP KAPANABİLİR. Kapalı bir disiplin:

     · gezinme şeridinde görünmez, ekranı yönlendirmeden kalkar
     · denge, rota ve reçetede hiç hesaba girmez
     · merdivende «üstatlık yüzdesi» ortalamasına girmez
     · ofiste masası kapanır, ajanı toplantıya çağrılmaz

   Ama VERİSİ SİLİNMEZ. Kapatmak bir silme işlemi değildir: altı ay sonra
   yeniden açan kullanıcı kartlarını, notlarını ve kademesini olduğu yerde
   bulur. «Kapalı» ile «yok» ayrı şeylerdir — bu dosyanın tamamı bu ayrımın
   üstüne kurulu.

   Değişmez: EN AZ BİR disiplin açık kalmak zorundadır. Hepsi kapalı bir
   ESP, açılış ekranından ibaret bir kabuktur; sistem kendi kendini
   kullanılamaz hâle getiremez. */

window.ESP = window.ESP || {};

ESP.Mod = (function(){
  const S = ESP.S;

  /* Varsayılan: hepsi açık. İlk kurulumda kullanıcı seçer; seçmeden
     geçerse hiçbir şey eksilmez. */
  function defaults(){
    const m = {};
    (ESP.DISCIPLINES || []).forEach(function(d){ m[d.id] = true; });
    return m;
  }

  function map(){
    const kayitli = (S.prefs && S.prefs.modules) || null;
    if(!kayitli) return defaults();
    const m = defaults();
    Object.keys(m).forEach(function(id){
      if(kayitli[id] === false) m[id] = false;
      if(kayitli[id] === true) m[id] = true;
    });
    /* Bilinmeyen anahtar (silinmiş bir disiplin) sessizce düşer. */
    return m;
  }

  function isOn(discId){
    if(!discId) return true;
    return map()[discId] !== false;
  }

  /* Açık disiplinler. Hiçbiri açık değilse (bozuk kayıt, elle düzenlenmiş
     yedek) listenin tamamı döner: kullanılamaz bir arayüz çizmektense
     tercihi yok saymak yeğdir. */
  function active(){
    const m = map();
    const list = (ESP.DISCIPLINES || []).filter(function(d){ return m[d.id] !== false; });
    return list.length ? list : (ESP.DISCIPLINES || []).slice();
  }

  function activeIds(){ return active().map(function(d){ return d.id; }); }

  function count(){ return active().length; }

  /* Açık disiplinlerin ekranları — gezinme ve komut paleti buradan okur. */
  function activeRoutes(){
    const out = {};
    active().forEach(function(d){ out[d.route] = true; });
    return out;
  }

  /* Bir ajanın masası açık mı? Patron ve koç her zaman açıktır: ikisi de
     bir disiplinin değil bir İŞİN sahibidir. */
  function agentOn(agentId){
    if(!agentId || agentId === 'patron') return true;
    if((ESP.COACH_IDS || []).indexOf(agentId) >= 0) return true;
    const sahip = (ESP.DISCIPLINES || []).filter(function(d){ return d.agent === agentId; });
    if(!sahip.length) return true;
    return sahip.some(function(d){ return isOn(d.id); });
  }

  function activeAgents(){
    return (ESP.AGENTS || []).filter(function(a){ return agentOn(a.id); });
  }

  /* Tek bir disiplini açar/kapatır. Son açık disiplini kapatmaya çalışmak
     bir hata değil bir REDDİR: sebebi söylenir, işlem yapılmaz. */
  async function set(discId, on){
    const m = map();
    if(!(discId in m)) return { ok:false, error:'Bilinmeyen bölüm.' };
    if(!on){
      const kalan = Object.keys(m).filter(function(id){
        return id !== discId && m[id] !== false; });
      if(!kalan.length){
        return { ok:false,
          error:'En az bir bölüm açık kalmalı. Önce başka bir bölümü aç.' };
      }
    }
    m[discId] = !!on;
    await ESP.Model.savePrefs(Object.assign({}, S.prefs || {}, { modules:m }));
    if(ESP.Memo && ESP.Memo.bitir) ESP.Memo.bitir();
    return { ok:true, modules:m };
  }

  /* Toplu seçim — kurulum sihirbazı ve ayarlar ekranı kullanır. */
  async function setAll(ids){
    const secilen = (ids || []).filter(function(id){
      return (ESP.DISCIPLINE_BY_ID || {})[id]; });
    if(!secilen.length) return { ok:false, error:'En az bir bölüm seçilmeli.' };
    const m = defaults();
    Object.keys(m).forEach(function(id){ m[id] = secilen.indexOf(id) >= 0; });
    await ESP.Model.savePrefs(Object.assign({}, S.prefs || {}, { modules:m }));
    if(ESP.Memo && ESP.Memo.bitir) ESP.Memo.bitir();
    return { ok:true, modules:m };
  }

  /* Kapalı bir disiplinin biriktirdiği veri. Kapatmadan önce gösterilir:
     kullanıcı neyin görünmez olacağını bilmeli — silinmediğini de. */
  function footprint(discId){
    const d = (ESP.DISCIPLINE_BY_ID || {})[discId];
    if(!d) return null;
    const sayilar = {
      lang:function(){ return (S.cards || []).filter(function(c){
        return c.lang !== ESP.HISTORY_DECK; }).length + ' kart'; },
      philo:function(){ return (S.args || []).length + ' tez'; },
      music:function(){ return (S.pieces || []).length + ' parça'; },
      diction:function(){ return (S.recordings || []).length + ' kayıt'; },
      reading:function(){ return (S.notes || []).length + ' not'; },
      writing:function(){ return (S.drafts || []).length + ' taslak'; },
      history:function(){ return (S.events || []).length + ' olay'; },
    };
    return sayilar[discId] ? sayilar[discId]() : '';
  }

  return { defaults, map, isOn, active, activeIds, activeRoutes, count,
    agentOn, activeAgents, set, setAll, footprint };
})();
