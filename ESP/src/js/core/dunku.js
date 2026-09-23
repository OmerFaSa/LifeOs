/* DÜNKÜNÜN AYNISI (fikir 5) — dünün çalışma oturumu tek dokunuşla bugüne.

   Sözler: kullanıcı seçer (kendiliğinden kopya yok); kopya bugünün kaydıdır
   (süre ve sayım aslındaki gibi, «kalite» kopyalanmaz — o günün hissidir);
   bugün aynı disipline zaten oturum girildiyse önerilmez; geri alınır. */

window.ESP = window.ESP || {};

ESP.Dunku = (function(){
  const U = () => ESP.U;
  function dun(bugun){ return U().iso(U().addDays(U().parse(bugun), -1)); }

  function adaylar(bugun){
    const d = dun(bugun);
    const var_ = new Set(ESP.Model.sessionsOf(bugun).map(s => s.disc));
    const oturumlar = ESP.Model.sessionsOf(d).filter(s => s.minutes > 0 && !var_.has(s.disc)).map(s => {
      const disc = ESP.DISCIPLINE_BY_ID[s.disc];
      return { id:s.id, disc:s.disc, ad:disc ? disc.label : s.disc, dk:s.minutes,
        sayim:s.count != null ? s.count + (s.countWhat ? ' ' + s.countWhat : '') : null };
    });
    return { dun:d, oturumlar };
  }

  async function kopyala(bugun, id){
    const s = ESP.Model.sessionsOf(dun(bugun)).find(x => x.id === id);
    if(!s) return { ok:false, why:'Dünün oturumu bulunamadı.' };
    if(!adaylar(bugun).oturumlar.some(x => x.id === id)) return { ok:false, why:'Bugün bu disipline zaten oturum girilmiş.' };
    const yeni = await ESP.Model.addSession(bugun, { disc:s.disc, minutes:s.minutes, count:s.count,
      countWhat:s.countWhat, note:'Dünün aynısı' });
    const disc = ESP.DISCIPLINE_BY_ID[s.disc];
    return { ok:true, id:yeni.id, ad:disc ? disc.label : s.disc };
  }

  async function geriAl(bugun, id){ await ESP.Model.deleteSession(bugun, id); return { ok:true }; }

  return { adaylar, kopyala, geriAl };
})();
