/* Sürtünme ölçer — sistemi yönetmek, çalışmanın yerine mi geçiyor?

   AYS'ye yöneltilen en yerinde eleştiri şuydu: bir öğrenci her gün süre,
   soru, konu kapanışı, hata etiketi, tekrar ve plan tamamlama verisi
   girdikçe, bir noktadan sonra ders çalışmaktan çok kendi çalışma
   sistemini yönetmeye başlar. Araç amacın önüne geçer.

   Bir uyarı cümlesi bunu çözmez; uyarı da bir ekrandır. Tek dürüst cevap
   sürtünmeyi ÖLÇMEKTİR: sistem kendi maliyetini de kendi tartısına koyar.

   Dört karar:

   1. YÖNETİM SÜRESİ DUVAR SAATİNDEN GELİR. Uygulama görünürken ve son bir
      dakika içinde etkileşim varken geçen süre sayılır. Açık unutulmuş
      sekme sürtünme değildir.

   2. ÇALIŞMA SÜRESİ BLOKLARDAN GELİR. Gün kaydındaki `actualMin`
      toplamıdır — planlanan değil, GERÇEKLEŞEN süre. Planlanan süreyle
      karşılaştırmak, sürtünmeyi olduğundan küçük gösterirdi.

   3. ORAN TEK BAŞINA HÜKÜM DEĞİLDİR. Hem mutlak bütçe hem oran
      aşılmadıkça sistem susar: hafta planı kurulan gün, bir deneme
      analizi günü ya da ilk kurulum günü doğal olarak yönetim ağırlıklıdır.

   4. SİSTEM KENDİ YÜKÜNÜ AZALTMAYI ÖNEREBİLİR, ARTIRMAYI ÖNEREMEZ. */

window.R = window.R || {};

R.Friction = (function(){
  const U = R.U, S = R.S;

  const CANLI_SN = 60;
  /* Günlük yönetim bütçesi (dakika) ve oran eşiği. Açıkça SEÇİLMİŞ
     sınırlardır, bir bulgu değil. */
  const BUTCE_DK = 15;
  const ORAN_ESIK = 0.25;
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

    /* Süreli deneme oturumu açıkken geçen süre SINAVDIR, yönetim değil.
       Kronometreye bakmak da sınavın parçasıdır. */
    if(R.ExamRun && R.ExamRun.active && R.ExamRun.active()){
      return { counted:0, reason:'exam' };
    }

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
    await R.Store.set('usage', u);
    return u;
  }

  async function load(){
    const raw = await R.Store.get('usage');
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

  /* Gerçekleşen çalışma dakikası — planlanan değil. */
  function workMinutes(tarih){
    const d = S.days[tarih || bugun()];
    if(!d) return 0;
    return (d.blocks || []).reduce((a, b) => a + (Number(b.actualMin) || 0), 0);
  }

  function day(tarih){
    const t = tarih || bugun();
    const g = state().days[t];
    const admin = g ? Math.round(g.adminMs / 60000) : 0;
    const work = workMinutes(t);
    const girdiVar = !!S.days[t];

    if(!g && !girdiVar) return { date:t, admin:0, work:0, ratio:null, cert:'missing' };
    if(!work) return { date:t, admin, work:0, ratio:null, cert:'partial' };
    const toplam = admin + work;
    return { date:t, admin, work, ratio:toplam > 0 ? admin / toplam : null,
      cert:'measured' };
  }

  function window_(gunSayisi){
    const n = Math.max(1, Math.round(gunSayisi || PENCERE));
    let admin = 0, work = 0, olculen = 0;
    for(let i = 0; i < n; i++){
      const t = U.iso(U.addDays(U.parse(bugun()), -i));
      const d = day(t);
      if(d.cert === 'missing') continue;
      admin += d.admin; work += d.work; olculen++;
    }
    const toplam = admin + work;
    return { days:n, measuredDays:olculen, admin, work,
      ratio:toplam > 0 ? admin / toplam : null,
      perDay:olculen ? Math.round(admin / olculen) : 0,
      cert:olculen ? (work > 0 ? 'measured' : 'partial') : 'missing' };
  }

  function verdict(gunSayisi){
    const w = window_(gunSayisi);
    if(w.cert === 'missing'){
      return { level:'unknown', cert:'missing', window:w,
        title:'Sürtünme ölçülmedi',
        note:'Bu pencerede kayıt yok. Sistem kendi maliyetini bilmiyorsa '
           + 'onu sıfır saymaz.' };
    }
    if(w.cert === 'partial'){
      return { level:'unknown', cert:'estimated', window:w,
        title:'Gerçekleşen çalışma girilmemiş',
        note:'Sistemde günde ' + w.perDay + ' dk geçiyor ama bloklara '
           + 'gerçekleşen süre yazılmamış. Oran hesaplanamaz: payda veri yok, '
           + 'sıfır değil.' };
    }
    const butceAsti = w.perDay > BUTCE_DK;
    const oranAsti = w.ratio != null && w.ratio > ORAN_ESIK;
    if(butceAsti && oranAsti){
      return { level:'high', cert:'measured', window:w,
        title:'Sistem, çalışmanın önüne geçiyor olabilir',
        note:'Son ' + w.days + ' günde günde ' + w.perDay + ' dk sistemle, '
           + Math.round(w.work / Math.max(1, w.measuredDays)) + ' dk çalışmayla '
           + 'geçti (%' + Math.round(w.ratio * 100) + ' yönetim). Sınır günde '
           + BUTCE_DK + ' dk ve %' + Math.round(ORAN_ESIK * 100) + '.' };
    }
    if(butceAsti || oranAsti){
      return { level:'watch', cert:'measured', window:w,
        title:'Sürtünme sınıra yakın',
        note:'İki eşikten biri aşıldı. Hafta planı kurulan ya da deneme '
           + 'analizi yapılan bir gün doğal olarak yönetim ağırlıklıdır.' };
    }
    return { level:'ok', cert:'measured', window:w,
      title:'Sürtünme bütçede',
      note:'Günde ' + w.perDay + ' dk sistem, %'
         + (w.ratio == null ? '—' : Math.round(w.ratio * 100)) + ' yönetim payı.' };
  }

  /* Yük azaltma önerileri. Hiçbiri "daha çok veri gir" demez. */
  function relief(){
    if(verdict().level !== 'high') return [];
    const out = [];

    const bekleyen = (S.exams || []).filter(e => !e.analysisCompletedAt).length;
    if(bekleyen > 2){
      out.push({ id:'exam-backlog', label:bekleyen + ' analiz edilmemiş deneme',
        note:'Biriken analiz her açılışta yeniden karşına çıkıyor. En eski '
           + 'ikisini analiz etmeden yenisini çözmemek, yükü de sonucu da '
           + 'düzeltir.', route:'exams' });
    }
    const acikProtokol = (S.protocols || []).filter(p => p.status === 'active').length;
    if(acikProtokol > 2){
      out.push({ id:'protocols', label:acikProtokol + ' açık telafi protokolü',
        note:'Aynı anda ikiden fazla telafi taşımak, hiçbirini bitirmemekle '
           + 'sonuçlanır. Birini kapat, kalanı ertele.', route:'protocols' });
    }
    if(!out.length){
      out.push({ id:'one-thing', label:'Günün tek işi',
        note:'Blok sayısı ve kayıt yükü makul; süre ekranlarda geziniyor. '
           + 'Bugünün tek işini yapıp kapatmak yeterli.', route:'today' });
    }
    return out;
  }

  return { tick, blur, save, load, day, verdict, relief,
    workMinutes, window:window_, BUTCE_DK, ORAN_ESIK, PENCERE, CANLI_SN };
})();
