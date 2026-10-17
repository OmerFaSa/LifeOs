/* SPİ HAFTALIK PLANLAR — Plan çekmecesinin «Planlar» bölümü.

   Kullanıcı (2026-10-17): «Plan kısmına plan ekle gibi türlü türlü şeyler
   koy: yemek planı …; SPİ'yi profesyonelleştir, minimalistlikten kaçma».
   Seçimi: beslenme, hareket, uyku, su ve alışkanlık + kendi adlandırdığı
   serbest plan.

   Sözler:
     1. PLAN TERCİHTİR, ÖLÇÜM DEĞİL. Kullanıcı yazar; kod hiçbir sayıyı
        önermez (SPİ doz önermez, teşhis koymaz — AGENTS §1.5). Tür kapalı
        katalogdur; bozuk değer (saat, dakika, su) yazılmaz.
     2. UYUM KAYITTAN SAYILIR. Antrenman, uyku, su ve öğün SPİ'nin kendi
        kaydından okunur. Kaydı olmayan gün «yapılmadı» değil «kayıt yok»tur
        (§1.2). Pencere dünden geriye yedi gündür: bugün bitmedi.
     3. UYKU SÜRESİ HESAPLANIR. Yatış–kalkıştan; gece yarısını geçer. Bir
        gece hedefe en çok 30 dakika eksikse «tuttu» sayılır (iş kuralı).
     4. İŞARET KULLANICININDIR. Alışkanlık ve serbest plan maddeleri günlük
        işaretle sayılır; ikinci dokunuş kaldırır. İşaret ölçüm yazmaz.
     5. KAYIT GERİ ALINIR. kaydet() önceki hâli döndürür; «Geri al» onu yazar.

   Depo: `haftaplan/<id>`. Yerleşik dört tür tektir; serbest plan çoğalır. */

window.SP = window.SP || {};

SP.HaftaPlan = (function(){
  const STORE = 'haftaplan';
  const GUN_KISA = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const GUN_AD = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const OGUNLER = [['kahvalti', 'Kahvaltı'], ['ogle', 'Öğle'], ['aksam', 'Akşam'], ['ara', 'Ara öğün']];
  const TURLER = Object.freeze([
    { id:'beslenme', ad:'Beslenme planı', not:'Haftanın öğünleri', tek:true },
    { id:'hareket',  ad:'Hareket planı',  not:'Hangi gün ne kadar', tek:true },
    { id:'uyku',     ad:'Uyku planı',     not:'Yatış ve kalkış saatin', tek:true },
    { id:'su',       ad:'Su ve alışkanlık', not:'Günlük su ve küçük alışkanlıklar', tek:true },
    { id:'serbest',  ad:'Kendi planın',   not:'Adını sen koy', tek:false },
  ]);
  const TUR_BY_ID = {};
  TURLER.forEach(t => { TUR_BY_ID[t.id] = t; });
  const PENCERE = 7, UYKU_PAY = 30;
  const EN_COK_MADDE = 20, EN_UZUN_METIN = 80;
  const SAAT = /^([01]\d|2[0-3]):[0-5]\d$/;

  const U = () => SP.U;
  const S = () => SP.S;
  const kac = s => String(s == null ? '' : s);
  const binlik = n => Number(n).toLocaleString('tr-TR');
  function gunEkle(iso, n){ return U().iso(U().addDays(U().parse(iso), n)); }
  function gunNo(iso){ return (U().parse(iso).getDay() + 6) % 7; }
  function uid(){ return 'hp' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function bugunISO(){ return U().todayISO(); }

  /* ------------------------------------------------------------ biçim */

  function yeni(tur, ad){
    const t = TUR_BY_ID[tur];
    const p = { id:uid(), tur:t ? tur : String(tur || ''), ad:String(ad || (t ? t.ad : '')).slice(0, EN_UZUN_METIN), at:null, guncel:null };
    if(tur === 'beslenme') p.gunler = GUN_KISA.map(() => ({ kahvalti:'', ogle:'', aksam:'', ara:'' }));
    if(tur === 'hareket') p.gunler = GUN_KISA.map(() => null);
    if(tur === 'uyku'){ p.haftaici = { yat:'', kalk:'' }; p.haftasonu = { yat:'', kalk:'' }; }
    if(tur === 'su'){ p.suMl = null; p.maddeler = []; p.isaret = {}; }
    if(tur === 'serbest'){ p.maddeler = []; p.isaret = {}; }
    return p;
  }
  function kopya(p){ return JSON.parse(JSON.stringify(p)); }

  function dogrula(p){
    const h = [];
    if(!p || !TUR_BY_ID[p.tur]) return ['Bilinmeyen plan türü.'];
    const metin = (x, ad) => { if(String(x || '').length > EN_UZUN_METIN) h.push(ad + ' en çok ' + EN_UZUN_METIN + ' harf olur.'); };
    if(p.tur === 'serbest' && !String(p.ad || '').trim()) h.push('Plana bir ad ver.');
    if(p.tur === 'beslenme'){
      if(!Array.isArray(p.gunler) || p.gunler.length !== 7) h.push('Haftanın yedi günü olmalı.');
      else p.gunler.forEach(g => OGUNLER.forEach(([k, ad]) => metin(g && g[k], ad)));
    }
    if(p.tur === 'hareket'){
      if(!Array.isArray(p.gunler) || p.gunler.length !== 7) h.push('Haftanın yedi günü olmalı.');
      else p.gunler.forEach((g, i) => {
        if(!g) return;
        metin(g.ne, 'Hareket');
        if(!String(g.ne || '').trim()) h.push(GUN_AD[i] + ': ne yapacağını yaz.');
        if(!(Number.isFinite(g.dk) && g.dk > 0 && g.dk <= 600)) h.push(GUN_AD[i] + ': süre 1 ile 600 dakika arası olur.');
      });
    }
    if(p.tur === 'uyku'){
      [['haftaici', 'Hafta içi'], ['haftasonu', 'Hafta sonu']].forEach(([k, ad]) => {
        const x = p[k] || {};
        if(!SAAT.test(x.yat || '') || !SAAT.test(x.kalk || '')) h.push(ad + ': saatler 00:00–23:59 biçiminde olur.');
        else if(uykuDakika(x.yat, x.kalk) == null) h.push(ad + ': yatış ile kalkış aynı olamaz.');
      });
    }
    if(p.tur === 'su' && p.suMl != null && !(Number.isFinite(p.suMl) && p.suMl > 0 && p.suMl <= 10000)) h.push('Su hedefi 1 ile 10.000 ml arası olur.');
    if(p.tur === 'su' || p.tur === 'serbest'){
      const l = p.maddeler || [];
      if(l.length > EN_COK_MADDE) h.push('En çok ' + EN_COK_MADDE + ' madde olur.');
      l.forEach(m => { metin(m && m.metin, 'Madde'); if(!m || !String(m.metin || '').trim()) h.push('Boş madde olmaz.'); });
    }
    return h;
  }

  /* Yatış–kalkış → dakika (hesaplandı). Aynı saat: süre yok. */
  function uykuDakika(yat, kalk){
    if(!SAAT.test(yat || '') || !SAAT.test(kalk || '')) return null;
    const dk = s => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
    const f = (dk(kalk) - dk(yat) + 1440) % 1440;
    return f === 0 ? null : f;
  }
  function sureYaz(dk){
    if(dk == null) return '—';
    const s = Math.floor(dk / 60), d = dk % 60;
    return (s ? s + ' sa' : '') + (s && d ? ' ' : '') + (d ? d + ' dk' : '');
  }
  function uykuOf(p, iso){ return gunNo(iso) >= 5 ? p.haftasonu : p.haftaici; }

  /* ------------------------------------------------------------ bugün */

  function bugunMaddeleri(p, iso){
    const g = gunNo(iso);
    return (p.maddeler || []).filter(m => !(m.gunler && m.gunler.length) || m.gunler.indexOf(g) >= 0);
  }
  function isaretli(p, iso){ return ((p.isaret || {})[iso] || []).slice(); }
  function isaretle(p, maddeId, iso){
    p.isaret = p.isaret || {};
    const l = p.isaret[iso] || [];
    p.isaret[iso] = l.indexOf(maddeId) >= 0 ? l.filter(x => x !== maddeId) : l.concat([maddeId]);
    if(!p.isaret[iso].length) delete p.isaret[iso];
    /* Yalnız son 60 gün tutulur: işaret bir günlüktür, arşiv değil. */
    const sinir = gunEkle(iso, -60);
    Object.keys(p.isaret).forEach(k => { if(k < sinir) delete p.isaret[k]; });
    return p;
  }

  function bugun(p, iso){
    iso = iso || bugunISO();
    const g = gunNo(iso);
    if(p.tur === 'beslenme'){
      const d = (p.gunler || [])[g] || {};
      const l = OGUNLER.filter(([k]) => String(d[k] || '').trim()).map(([k, ad]) => ad + ': ' + d[k].trim());
      return { metin:l.length ? l.join(' · ') : 'Bugün için öğün yazılmamış', etiket:null };
    }
    if(p.tur === 'hareket'){
      const d = (p.gunler || [])[g];
      return { metin:d ? d.ne + ' · ' + d.dk + ' dk' : 'Bugün dinlenme günü', etiket:null };
    }
    if(p.tur === 'uyku'){
      const x = uykuOf(p, iso) || {};
      const dk = uykuDakika(x.yat, x.kalk);
      return { metin:dk == null ? 'Saatler yazılmamış' : x.yat + ' yat · ' + x.kalk + ' kalk (' + sureYaz(dk) + ')', etiket:dk == null ? null : 'hesaplandı' };
    }
    if(p.tur === 'su'){
      const v = S().vitals && S().vitals[iso];
      const ml = v && v.water != null ? Number(v.water) : null;
      const hedef = p.suMl;
      let metin;
      if(hedef == null) metin = ml == null ? 'Su hedefi yazılmamış' : 'Su ' + binlik(ml) + ' ml';
      else metin = ml == null ? 'Su: bugün kayıt yok · hedef ' + binlik(hedef) + ' ml' : 'Su ' + binlik(ml) + ' / ' + binlik(hedef) + ' ml';
      const m = bugunMaddeleri(p, iso);
      if(m.length) metin += ' · ' + isaretli(p, iso).filter(id => m.some(x => x.id === id)).length + ' / ' + m.length + ' alışkanlık';
      return { metin, etiket:ml == null ? 'veri yok' : 'ölçüldü' };
    }
    const m = bugunMaddeleri(p, iso);
    return { metin:m.length ? 'Bugün ' + isaretli(p, iso).filter(id => m.some(x => x.id === id)).length + ' / ' + m.length + ' madde' : 'Bugün madde yok', etiket:null };
  }

  /* ------------------------------------------------------------ uyum */

  function pencere(iso){
    const l = [];
    for(let i = PENCERE; i >= 1; i--) l.push(gunEkle(iso, -i));
    return l;
  }
  function uyum(p, iso){
    iso = iso || bugunISO();
    const gunler = pencere(iso);
    if(p.tur === 'hareket'){
      let planli = 0, tuttu = 0, eksik = 0, kayitYok = 0;
      gunler.forEach(d => {
        const plan = (p.gunler || [])[gunNo(d)];
        if(!plan) return;
        planli++;
        const w = (S().workouts || []).filter(x => x && x.date === d);
        if(!w.length){ kayitYok++; return; }
        const dk = w.reduce((a, x) => a + (Number(x.minutes) || 0), 0);
        if(dk >= plan.dk) tuttu++; else eksik++;
      });
      if(!planli) return { planli, tuttu, eksik, kayitYok, metin:'Son 7 günde planlı gün yok', etiket:'veri yok' };
      /* Sayıya ek getirilmez («0’ında», «4’ünde» sayıya göre değişir): parçalı yazılır. */
      const parca = [planli + ' planlı gün', tuttu + ' tuttu'];
      if(eksik) parca.push(eksik + ' gün eksik');
      if(kayitYok) parca.push(kayitYok + ' gün kayıt yok');
      return { planli, tuttu, eksik, kayitYok, metin:'Son 7 gün: ' + parca.join(' · '), etiket:planli > kayitYok ? 'ölçüldü' : 'veri yok' };
    }
    if(p.tur === 'uyku'){
      let kayitli = 0, tuttu = 0;
      gunler.forEach(d => {
        const v = S().vitals && S().vitals[d];
        if(!v || v.sleep == null) return;
        const x = uykuOf(p, d) || {};
        const hedef = uykuDakika(x.yat, x.kalk);
        if(hedef == null) return;
        kayitli++;
        if(Number(v.sleep) * 60 >= hedef - UYKU_PAY) tuttu++;
      });
      return kayitli ? { kayitli, tuttu, metin:'Son 7 gün: ' + kayitli + ' gece kayıtlı · ' + tuttu + ' gece hedefte', etiket:'ölçüldü' }
        : { kayitli, tuttu, metin:'Son 7 günde uyku kaydı yok', etiket:'veri yok' };
    }
    if(p.tur === 'su'){
      let kayitli = 0, tuttu = 0;
      gunler.forEach(d => {
        const v = S().vitals && S().vitals[d];
        if(!v || v.water == null) return;
        kayitli++;
        if(p.suMl != null && Number(v.water) >= p.suMl) tuttu++;
      });
      if(!kayitli) return { kayitli, tuttu, metin:'Son 7 günde su kaydı yok', etiket:'veri yok' };
      return { kayitli, tuttu, metin:p.suMl == null ? 'Son 7 gün: ' + kayitli + ' günde su kaydı var'
        : 'Son 7 gün: ' + kayitli + ' gün kayıtlı · ' + tuttu + ' gün hedefte', etiket:'ölçüldü' };
    }
    if(p.tur === 'beslenme'){
      /* Yemeğin adı kayıtla eşleştirilmez (tahmin olurdu); yalnız öğün kaydı olan gün sayılır. */
      const kayitli = gunler.filter(d => ((S().meals || {})[d] || []).length).length;
      return { kayitli, metin:kayitli ? 'Son 7 gün: ' + kayitli + ' günde öğün kaydı var' : 'Son 7 günde öğün kaydı yok', etiket:kayitli ? 'ölçüldü' : 'veri yok' };
    }
    let toplam = 0, yapilan = 0;
    gunler.forEach(d => {
      const m = bugunMaddeleri(p, d);
      toplam += m.length;
      yapilan += isaretli(p, d).filter(id => m.some(x => x.id === id)).length;
    });
    return { toplam, yapilan, metin:toplam ? 'Son 7 gün: ' + yapilan + ' / ' + toplam + ' işaretli' : 'Son 7 günde madde yok', etiket:toplam ? 'ölçüldü' : 'veri yok' };
  }

  /* ------------------------------------------------------------ depo */

  function liste(){ return S().haftaplan || (S().haftaplan = []); }
  function bul(tur){ return liste().find(p => p.tur === tur) || null; }
  function bulId(id){ return liste().find(p => p.id === id) || null; }
  async function yukle(){
    S().haftaplan = ((await SP.Store.list(STORE)) || []).filter(p => p && p.id && TUR_BY_ID[p.tur]);
    return S().haftaplan;
  }
  async function kaydet(p){
    const h = dogrula(p);
    if(h.length) return { ok:false, why:h[0], hatalar:h };
    const l = liste();
    const t = TUR_BY_ID[p.tur];
    /* Yerleşik tür tektir: aynı türün öteki kaydının yerine geçer. */
    const eski = t.tek ? l.find(x => x.tur === p.tur) || null : l.find(x => x.id === p.id) || null;
    const yeniP = kopya(p);
    if(eski) yeniP.id = eski.id;
    yeniP.at = (eski && eski.at) || new Date().toISOString();
    yeniP.guncel = new Date().toISOString();
    S().haftaplan = l.filter(x => x.id !== yeniP.id).concat([yeniP]);
    await SP.Store.set(STORE + '/' + yeniP.id, yeniP);
    return { ok:true, plan:yeniP, onceki:eski ? kopya(eski) : null };
  }
  /* Geri al: önceki hâl yazılır; önceki yoksa kayıt silinir. */
  async function geriAl(r){
    if(!r || !r.plan) return false;
    if(r.onceki){
      S().haftaplan = liste().filter(x => x.id !== r.onceki.id).concat([kopya(r.onceki)]);
      await SP.Store.set(STORE + '/' + r.onceki.id, r.onceki);
    }else await sil(r.plan.id);
    return true;
  }
  async function sil(id){
    const p = bulId(id);
    if(!p) return null;
    S().haftaplan = liste().filter(x => x.id !== id);
    if(SP.Store.remove) await SP.Store.remove(STORE + '/' + id);
    return p;
  }

  return { TURLER, TUR_BY_ID, GUN_KISA, GUN_AD, OGUNLER, STORE, yeni, dogrula, uykuDakika, sureYaz, gunNo,
    bugun, bugunMaddeleri, isaretle, isaretli, uyum, liste, bul, bulId, yukle, kaydet, geriAl, sil, kopya };
})();
