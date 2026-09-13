/* Surtunme olcer — sagligi yonetmek, saglikli yasamanin yerine mi geciyor?

   AYS ve ESP'deki olcerin SPI'ye uyarlanmis hali. Ama korü korüne
   kopyalanmadi, cunku SPI'de PAYDA FARKLI:

     AYS'de "calisma" bir saat isidir: blokta gecirilen dakika olculur.
     ESP'de "pratik" bir saat isidir: zamanlayici olcer.
     SPI'de "saglikli yasamak" bir saat isi DEGILDIR. Uyumak, dogru
     yemek, su icmek, yurumek — bunlarin cogu uygulamada dakika olarak
     gorunmez ve gorunmesi de gerekmez.

   Bu yuzden SPI'de oran HESAPLANMAZ. Yalnizca MUTLAK butce izlenir:
   gunde kac dakika bu uygulamaya bakildi? Bir oran uydurmak — antrenman
   dakikasini "saglikli yasama suresi" saymak gibi — olculmemis bir seyi
   olculmus gostermek olurdu.

   Bir istisna: antrenman dakikasi GERCEKTEN olculur. O yuzden antrenman
   yapilan gunlerde ikincil bir oran gosterilir ve acikca "yalnizca
   antrenman suresine gore" diye etiketlenir. */

window.SP = window.SP || {};

SP.Friction = (function(){
  const U = SP.U, S = SP.S;

  const CANLI_SN = 60;

  /* Gunluk yonetim butcesi (dakika). Saglik takibi AYS'den daha
     seyrek dokunulan bir istir: tahlil ayda bir, ogun gunde birkac
     satir. On dakika, acikca SECILMIS bir sinirdir. */
  const BUTCE_DK = 10;
  const PENCERE = 14;

  function now(){ return Date.now(); }
  function bugun(){ return U.todayISO(); }
  function bos(){ return { days:{}, lastTick:null }; }

  function state(){
    if(!S.usage) S.usage = bos();
    if(!S.usage.days) S.usage.days = {};
    return S.usage;
  }
  function gun(t){
    const u = state();
    if(!u.days[t]) u.days[t] = { date:t, adminMs:0, ticks:0 };
    return u.days[t];
  }

  function tick(opts){
    const o = opts || {};
    const u = state();
    const t = o.at != null ? o.at : now();
    const onceki = u.lastTick;
    u.lastTick = t;
    if(onceki == null) return { counted:0, reason:'first' };
    const fark = t - onceki;
    if(!(fark > 0)) return { counted:0, reason:'nonmonotonic' };
    if(fark > CANLI_SN * 1000) return { counted:0, reason:'away' };
    const g = gun(o.date || bugun());
    g.adminMs += fark;
    g.ticks += 1;
    return { counted:fark, reason:'ok' };
  }

  function blur(){ state().lastTick = null; }

  async function save(){
    const u = state();
    const sinir = U.iso(U.addDays(U.parse(bugun()), -(PENCERE * 3)));
    Object.keys(u.days).forEach(k => { if(k < sinir) delete u.days[k]; });
    await SP.Store.set('usage', u);
    return u;
  }

  async function load(){
    const raw = await SP.Store.get('usage');
    S.usage = Object.assign(bos(), raw || {});
    if(!S.usage.days || typeof S.usage.days !== 'object') S.usage.days = {};
    Object.keys(S.usage.days).forEach(k => {
      const g = S.usage.days[k] || {};
      const ms = Number(g.adminMs);
      S.usage.days[k] = { date:k, adminMs:(isFinite(ms) && ms >= 0) ? ms : 0,
        ticks:Math.max(0, Math.round(Number(g.ticks) || 0)) };
    });
    S.usage.lastTick = null;
    return S.usage;
  }

  /* O gun kaydedilmis antrenman dakikasi. Tek SAAT ISI olan saglik
     etkinligi budur; digerleri dakikayla olculmez. */
  function trainingMinutes(tarih){
    const t = tarih || bugun();
    return (S.workouts || [])
      .filter(w => String(w.date || '').slice(0, 10) === t)
      .reduce((a, w) => a + (Number(w.minutes) || 0), 0);
  }

  function day(tarih){
    const t = tarih || bugun();
    const g = state().days[t];
    if(!g) return { date:t, admin:0, training:0, cert:'missing' };
    return { date:t, admin:Math.round(g.adminMs / 60000),
      training:trainingMinutes(t), cert:'measured' };
  }

  function window_(gunSayisi){
    const n = Math.max(1, Math.round(gunSayisi || PENCERE));
    let admin = 0, antrenman = 0, olculen = 0, antrenmanGun = 0;
    for(let i = 0; i < n; i++){
      const t = U.iso(U.addDays(U.parse(bugun()), -i));
      const d = day(t);
      if(d.cert === 'missing') continue;
      admin += d.admin; olculen++;
      if(d.training > 0){ antrenman += d.training; antrenmanGun++; }
    }
    return { days:n, measuredDays:olculen, admin, training:antrenman,
      trainingDays:antrenmanGun,
      perDay:olculen ? Math.round(admin / olculen) : 0,
      /* Oran YALNIZCA antrenman gunlerinde ve yalnizca antrenman
         suresine gore. Baska bir payda uydurulmaz. */
      trainingRatio:(antrenman + admin) > 0 && antrenmanGun
        ? admin / (admin + antrenman) : null,
      cert:olculen ? 'measured' : 'missing' };
  }

  function verdict(gunSayisi){
    const w = window_(gunSayisi);
    if(w.cert === 'missing'){
      return { level:'unknown', cert:'missing', window:w,
        title:'Sürtünme ölçülmedi',
        note:'Bu pencerede kayıt yok. Sistem kendi maliyetini bilmiyorsa '
           + 'onu sıfır saymaz.' };
    }
    if(w.perDay > BUTCE_DK){
      return { level:'high', cert:'measured', window:w,
        title:'Takip, işin önüne geçiyor olabilir',
        note:'Son ' + w.days + ' günde günde ' + w.perDay + ' dk bu ekranlarda '
           + 'geçti; bütçe günde ' + BUTCE_DK + ' dk. Sağlıklı yaşamak bir '
           + 'saat işi değildir: uyumak, doğru yemek ve yürümek uygulamada '
           + 'dakika olarak görünmez. Bu yüzden burada oran değil yalnızca '
           + 'mutlak süre ölçülür.' };
    }
    if(w.perDay > BUTCE_DK * 0.7){
      return { level:'watch', cert:'measured', window:w,
        title:'Sürtünme sınıra yakın',
        note:'Tahlil girilen ya da haftalık sepet kurulan bir gün doğal '
           + 'olarak uzundur; tek gün hüküm değildir.' };
    }
    return { level:'ok', cert:'measured', window:w,
      title:'Sürtünme bütçede',
      note:'Günde ' + w.perDay + ' dk takip.' };
  }

  /* Yuk azaltma onerileri. Hicbiri "daha cok veri gir" demez. */
  function relief(){
    if(verdict().level !== 'high') return [];
    const out = [];

    const bekleyen = (S.proposals || []).filter(p => p.status === 'pending').length;
    if(bekleyen > 4){
      out.push({ id:'proposals', label:bekleyen + ' bekleyen öneri',
        note:'Karar bekleyen her öneri her açılışta yeniden okunuyor. '
           + 'Toplu reddetmek de bir karardır.', route:'office' });
    }
    const ilac = (S.meds || []).filter(m => m.active !== false).length;
    if(ilac > 8){
      out.push({ id:'meds', label:ilac + ' aktif ilaç/takviye kaydı',
        note:'Bırakılmış olanları pasife almak günlük listeyi kısaltır; '
           + 'kayıt silinmez.', route:'today' });
    }
    if((S.foods || []).length > 40){
      out.push({ id:'foods', label:'Kendi gıda listen büyümüş',
        note:'Sık kullandıklarını bırakıp gerisini aramaya güvenmek, '
           + 'öğün girişini kısaltır.', route:'kitchen' });
    }
    if(!out.length){
      out.push({ id:'shorter', label:'Ziyaretler uzun',
        note:'Kayıt yükü makul görünüyor; süre ekranlarda geziniyor. '
           + 'Günün tek işini yapıp kapatmak yeterli.', route:'today' });
    }
    return out;
  }

  return { tick, blur, save, load, day, verdict, relief,
    trainingMinutes, window:window_, BUTCE_DK, PENCERE, CANLI_SN };
})();
