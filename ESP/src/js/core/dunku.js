/* DÜNKÜNÜN AYNISI (fikir 5) — dünün çalışma oturumu tek dokunuşla bugüne.

   Sözler: kullanıcı seçer (kendiliğinden kopya yok); kopya bugünün kaydıdır
   (süre ve sayım aslındaki gibi, «kalite» kopyalanmaz — o günün hissidir);
   bugün aynı disipline zaten oturum girildiyse önerilmez; geri alınır.

   SIK OTURUMLAR (2026-10-17, depo sahibi: «ESP'de veri girişi çok kolay
   olsun»): son 14 günde en az iki kez aynı disiplin ve süreyle girilen
   oturum Bugün'de tek dokunuşla eklenir. Süre kullanıcının kendi
   kayıtlarından gelir (uydurulmaz); sayım ve kalite kopyalanmaz — o günün
   ölçümüdür. Bugün aynı disipline oturum girildiyse işaretli görünür,
   yine eklenebilir (ikinci oturum). En çok dört. */

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

  function sik(bugun){
    const say = {};
    for(let i = 1; i <= 14; i++){
      const d = U().iso(U().addDays(U().parse(bugun), -i));
      ESP.Model.sessionsOf(d).forEach(s => {
        if(!(s.minutes > 0) || !ESP.DISCIPLINE_BY_ID[s.disc]) return;
        const k = s.disc + ':' + s.minutes;
        const x = say[k] || (say[k] = { disc:s.disc, dk:s.minutes, n:0, son:d });
        x.n++;
      });
    }
    const bugunD = new Set(ESP.Model.sessionsOf(bugun).map(s => s.disc));
    return Object.keys(say).map(k => say[k]).filter(x => x.n >= 2)
      .sort((a, b) => b.n - a.n || (a.son < b.son ? 1 : -1)).slice(0, 4)
      .map(x => ({ disc:x.disc, dk:x.dk, n:x.n, ad:ESP.DISCIPLINE_BY_ID[x.disc].label, bugun:bugunD.has(x.disc) }));
  }
  async function sikEkle(bugun, disc, dk){
    const x = sik(bugun).find(s => s.disc === disc && s.dk === Number(dk));
    if(!x) return { ok:false, why:'Bu oturum sık oturumlarda yok.' };
    const yeni = await ESP.Model.addSession(bugun, { disc:x.disc, minutes:x.dk, note:'' });
    return { ok:true, id:yeni.id, ad:x.ad, dk:x.dk };
  }

  return { adaylar, kopyala, geriAl, sik, sikEkle };
})();
