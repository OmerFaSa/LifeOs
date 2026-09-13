/* Sürtünme ölçer — sistemi yönetmek, çalışmanın yerine geçiyor mu?

   Bu dosya bir eleştiriden doğdu ve eleştiri haklıydı: ölçen bir sistem
   bir süre sonra ölçmeyi işin kendisi sanmaya başlar. Kullanıcı gitar
   çalmak yerine gitar çalışmasını yönetir, kitap okumak yerine okuma
   kaydını düzenler. Buna karşı yazılmış bir uyarı cümlesi işe yaramaz;
   çünkü uyarı da bir ekrandır ve ekranda geçen süre de sürtünmedir.

   Tek dürüst cevap, sürtünmeyi ÖLÇMEKTİR. Sistem kendi maliyetini de
   kendi tartısına koyar.

   Dört karar bu dosyayı yönetir:

   1. YÖNETİM SÜRESİ DUVAR SAATİNDEN GELİR. Uygulama görünürken ve son
      bir dakika içinde bir etkileşim olmuşken geçen süre sayılır. Açık
      unutulmuş bir sekme sürtünme değildir; kimse onunla uğraşmıyordur.

   2. PRATİK ZAMANLAYICISI ÇALIŞIRKEN GEÇEN SÜRE SÜRTÜNME DEĞİLDİR. O süre
      çalışmanın kendisidir. Sayaç açıkken ekrana bakmak da çalışmanın
      parçasıdır — metronom da bir ekrandır.

   3. ORAN TEK BAŞINA HÜKÜM DEĞİLDİR. Beş dakika yönetim, on dakika
      çalışma: oran yüksek ama toplam küçük. Bir kurulum günü, bir ayar
      günü olabilir. Bu yüzden hem MUTLAK bütçe hem ORAN aranır ve ikisi
      birden aşılmadıkça sistem bir şey söylemez.

   4. SİSTEM KENDİ YÜKÜNÜ AZALTMAYI ÖNEREBİLİR, ARTIRMAYI ÖNEREMEZ. Bu
      SPİ'deki antrenman yükü kuralının aynısıdır: kendi lehine karar
      veren bir ölçü, ölçü değildir. */

window.ESP = window.ESP || {};

ESP.Friction = (function(){
  const U = ESP.U, S = ESP.S;

  /* Etkileşimden sonra kaç saniye boyunca "hâlâ burada" sayılır. Bir
     dakika: bir ekranı okumak bu kadar sürer, bir sekme unutmak sürmez. */
  const CANLI_SN = 60;

  /* Günlük yönetim bütçesi (dakika) ve oran eşiği. İkisi de AŞILMADIKÇA
     sistem susar. Bu sayılar bir bilimsel bulgu değil, açıkça seçilmiş
     bir SINIRDIR ve öyle etiketlenir. */
  const BUTCE_DK = 12;
  const ORAN_ESIK = 0.34;

  /* Kaç günlük pencereye bakılır. */
  const PENCERE = 14;

  function now(){ return Date.now(); }
  function bugun(){ return U.todayISO(); }

  function bos(){ return { days:{}, lastTick:null }; }

  function state(){
    if(!S.usage) S.usage = bos();
    if(!S.usage.days) S.usage.days = {};
    return S.usage;
  }

  function gun(tarih){
    const u = state();
    const t = tarih || bugun();
    if(!u.days[t]) u.days[t] = { date:t, adminMs:0, ticks:0 };
    return u.days[t];
  }

  /* ------------------------------------------------------------- ölçüm */

  /* Her etkileşimde çağrılır. Geçen süreyi bir öncekiyle arasındaki farktan
     alır; fark CANLI_SN'yi aşıyorsa kullanıcı aradan çıkmış demektir ve o
     boşluk sayılmaz. Sayılmayan boşluk, uydurulmuş bir süreden iyidir. */
  function tick(opts){
    const o = opts || {};
    const u = state();
    const t = o.at != null ? o.at : now();
    const onceki = u.lastTick;
    u.lastTick = t;

    /* Pratik sayacı açıkken geçen süre çalışmadır, yönetim değil. */
    const calisiyor = !!(ESP.Timer && ESP.Timer.running && ESP.Timer.running());
    if(calisiyor) return { counted:0, reason:'practice' };

    if(onceki == null) return { counted:0, reason:'first' };
    const fark = t - onceki;
    if(!(fark > 0)) return { counted:0, reason:'nonmonotonic' };
    if(fark > CANLI_SN * 1000) return { counted:0, reason:'away' };

    const g = gun(o.date || bugun());
    g.adminMs += fark;
    g.ticks += 1;
    return { counted:fark, reason:'ok' };
  }

  /* Sekme arkaya gittiğinde: zincir kesilir, boşluk sayılmaz. */
  function blur(){ state().lastTick = null; }

  async function save(){
    /* Pencerenin dışında kalan günler atılır: sürtünme kaydı da bir yüktür
       ve kendi kuralına uymalıdır. */
    const u = state();
    const sinir = U.iso(U.addDays(U.parse(bugun()), -(PENCERE * 3)));
    Object.keys(u.days).forEach(k => { if(k < sinir) delete u.days[k]; });
    await ESP.Store.set('usage', u);
    return u;
  }

  async function load(){
    const raw = await ESP.Store.get('usage');
    S.usage = Object.assign(bos(), raw || {});
    if(!S.usage.days || typeof S.usage.days !== 'object') S.usage.days = {};
    /* Depodan gelen süre her zaman sayı olmalı: bozuk kayıt sıfırlanır,
       NaN taşınmaz. */
    Object.keys(S.usage.days).forEach(k => {
      const g = S.usage.days[k] || {};
      const ms = Number(g.adminMs);
      S.usage.days[k] = { date:k, adminMs:(isFinite(ms) && ms >= 0) ? ms : 0,
        ticks:Math.max(0, Math.round(Number(g.ticks) || 0)) };
    });
    S.usage.lastTick = null;
    return S.usage;
  }

  /* ------------------------------------------------------------- okuma */

  function adminMinutes(tarih){
    const g = state().days[tarih || bugun()];
    return g ? Math.round(g.adminMs / 60000) : 0;
  }

  /* O günün çalışma dakikası: gün kaydındaki oturumların toplamı. */
  function workMinutes(tarih){
    const t = tarih || bugun();
    if(!ESP.S.days) return 0;
    const d = ESP.S.days[t];
    if(!d) return 0;
    return (d.sessions || []).reduce((a, s) => a + (Number(s.minutes) || 0), 0);
  }

  /* Bir günün özeti.

     `cert` üç değer alır:
       'measured'  yönetim süresi ölçüldü, çalışma süresi de girildi
       'partial'   yönetim ölçüldü ama o gün hiç oturum girilmedi —
                   oran hesaplanamaz, çünkü payda VERI YOK, sıfır değil
       'missing'   o güne ait hiç ölçüm yok */
  function day(tarih){
    const t = tarih || bugun();
    const g = state().days[t];
    const admin = g ? Math.round(g.adminMs / 60000) : 0;
    const work = workMinutes(t);
    const girdiVar = !!(ESP.S.days && ESP.S.days[t]);

    if(!g && !girdiVar) return { date:t, admin:0, work:0, ratio:null, cert:'missing' };
    if(!girdiVar) return { date:t, admin, work:0, ratio:null, cert:'partial' };
    const toplam = admin + work;
    return { date:t, admin, work,
      ratio:toplam > 0 ? admin / toplam : null,
      cert:toplam > 0 ? 'measured' : 'partial' };
  }

  /* Son PENCERE günün toplamı. Günleri tek tek toplamak, günlük oranların
     ortalamasını almaktan daha doğrudur: iki dakikalık bir gün, üç saatlik
     bir günle aynı ağırlığı taşımamalı. */
  function window_(gunSayisi){
    const n = Math.max(1, Math.round(gunSayisi || PENCERE));
    let admin = 0, work = 0, olculenGun = 0;
    for(let i = 0; i < n; i++){
      const t = U.iso(U.addDays(U.parse(bugun()), -i));
      const d = day(t);
      if(d.cert === 'missing') continue;
      admin += d.admin; work += d.work; olculenGun++;
    }
    const toplam = admin + work;
    return {
      days:n, measuredDays:olculenGun, admin, work,
      ratio:toplam > 0 ? admin / toplam : null,
      perDay:olculenGun ? Math.round(admin / olculenGun) : 0,
      cert:olculenGun ? (work > 0 ? 'measured' : 'partial') : 'missing',
    };
  }

  /* ------------------------------------------------------------- hüküm */

  /* Sürtünme yüksek mi?

     Hem mutlak bütçe hem oran aşılmadıkça 'ok' döner. Veri yoksa 'unknown':
     ölçülmemiş sürtünme, sıfır sürtünme değildir. */
  function verdict(gunSayisi){
    const w = window_(gunSayisi);
    if(w.cert === 'missing'){
      return { level:'unknown', cert:'missing', window:w,
        title:'Sürtünme ölçülmedi',
        note:'Bu pencerede yeterli kayıt yok. Sistem kendi maliyetini '
           + 'bilmiyorsa, onu sıfır saymaz.' };
    }
    if(w.cert === 'partial'){
      return { level:'unknown', cert:'estimated', window:w,
        title:'Çalışma süresi girilmemiş',
        note:'Uygulamada ' + w.perDay + ' dk/gün geçiyor ama bu pencerede '
           + 'hiç oturum kaydı yok. Oran hesaplanamaz: payda veri yok, sıfır değil.' };
    }
    const butceAsti = w.perDay > BUTCE_DK;
    const oranAsti = w.ratio != null && w.ratio > ORAN_ESIK;
    if(butceAsti && oranAsti){
      return { level:'high', cert:'measured', window:w,
        title:'Sistem, işin önüne geçiyor olabilir',
        note:'Son ' + w.days + ' günde günde ' + w.perDay + ' dk sistemle, '
           + Math.round(w.work / Math.max(1, w.measuredDays)) + ' dk çalışmayla geçti '
           + '(%' + Math.round(w.ratio * 100) + ' yönetim). Bütçe günde '
           + BUTCE_DK + ' dk ve %' + Math.round(ORAN_ESIK * 100) + '.' };
    }
    if(butceAsti || oranAsti){
      return { level:'watch', cert:'measured', window:w,
        title:'Sürtünme sınıra yakın',
        note:'İki eşikten biri aşıldı. Tek başına aşılması hüküm değildir — '
           + 'kurulum ya da ayar günü olabilir.' };
    }
    return { level:'ok', cert:'measured', window:w,
      title:'Sürtünme bütçede',
      note:'Günde ' + w.perDay + ' dk sistem, %'
         + (w.ratio == null ? '—' : Math.round(w.ratio * 100)) + ' yönetim payı.' };
  }

  /* Sürtünme yüksekse NE azaltılabilir?

     Bu bir teklif listesidir, uygulama değil. Sistem yalnızca kendi yükünü
     AZALTMAYI önerir; hiçbir madde "daha çok veri gir" demez. */
  function relief(){
    const v = verdict();
    if(v.level !== 'high') return [];
    const out = [];

    const acik = (ESP.Mod && ESP.Mod.active) ? ESP.Mod.active() : [];
    if(acik.length > 3){
      out.push({ id:'fewer-modules', label:acik.length + ' bölüm açık',
        note:'Aynı anda ' + acik.length + ' disiplin taşımak, her birinin '
           + 'kaydını da taşımak demektir. Kapatılan bölümün verisi silinmez.',
        act:'go-profile' });
    }
    if(ESP.Timer && !ESP.Timer.active()){
      out.push({ id:'use-timer', label:'Süreyi elle yazıyorsun',
        note:'Zamanlayıcı, oturum girişinin çoğunu ortadan kaldırır: '
           + 'başlat–bitir, kayıt kendiliğinden düşer.', act:'timer-hint' });
    }
    const bek = (ESP.S.proposals || []).filter(p => p.status === 'pending').length;
    if(bek > 4){
      out.push({ id:'clear-proposals', label:bek + ' bekleyen teklif',
        note:'Karar bekleyen her teklif, her açılışta yeniden okunuyor. '
           + 'Toplu reddetmek de bir karardır.', act:'go-office' });
    }
    if(!out.length){
      out.push({ id:'shorter-visits', label:'Ziyaretler uzun',
        note:'Bölüm sayısı ve kayıt yükü makul görünüyor; süre ekranlarda '
           + 'geziniyor. Günün tek işini yapıp kapatmak yeterli.', act:'go-today' });
    }
    return out;
  }

  return {
    tick, blur, save, load, day, verdict, relief,
    adminMinutes, workMinutes, window:window_,
    BUTCE_DK, ORAN_ESIK, PENCERE, CANLI_SN,
  };
})();
