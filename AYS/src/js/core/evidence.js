/* Kanit motoru — bir esigin ne soylemeye yetkili oldugunu belirler.

   data/evidence.js dort ekseni tasir; bu dosya onlari cozer ve tek bir
   kurali uygular:

     Bir esik, YETKISININ izin verdiginden daha guclu konusamaz.

   Yetki, kaynak turunun politika tablosundaki karsiligidir (kayit basina
   ezilebilir). Politika bir pedagojik iddia degil bir tasarim kararidir
   ve oyle etiketlenir.

   Uc kural:

   1. KAYNAGI OLMAYAN ESIK YONLENDIREMEZ.
   2. PLAN DEGISTIREN HER KURAL YETKI TASIMALIDIR. audit() bunu tarar.
   3. EKSENLER GIZLENMEZ — arayuz esigi gosteriyorsa dayanagini da gosterir. */

window.R = window.R || {};

R.Ev = (function(){

  const BY_RULE = (function(){
    const m = {};
    (R.EVIDENCE || []).forEach(function(e){ m[e.rule] = e; });
    return m;
  })();

  function resolve(e){
    if(!e) return null;
    const source = e.sourceType || null;
    if(!source) return null;
    const certainty = e.certainty || 'unknown';

    /* Uygulanabilirlik yazilmamissa populasyon metninden okunur:
       "DEGISIR" diyen bir esik dogrudan uygulanabilir sayilamaz. */
    const pop = String(e.population || '');
    const applicability = e.applicability
      || (/DEĞİŞİR|değişir/.test(pop) ? 'indirect'
        : (pop === '—' || pop === '') ? 'local' : 'direct');

    const authority = e.authority || R.EVIDENCE_POLICY.defaults[source] || 'observe_only';

    return {
      rule:e.rule, source:source, certainty:certainty,
      applicability:applicability, authority:authority,
      sourceInfo:SOURCE_BY_ID[source] || null,
      certaintyInfo:CERT_BY_ID[certainty] || null,
      applicabilityInfo:APPL_BY_ID[applicability] || null,
      authorityInfo:AUTH_BY_ID[authority] || null,
      citation:e.cite, population:e.population || null, note:e.note || '',
    };
  }

  const SOURCE_BY_ID = R.EVIDENCE_SOURCES.reduce(function(m, x){ m[x.id] = x; return m; }, {});
  const CERT_BY_ID = R.EVIDENCE_CERTAINTY.reduce(function(m, x){ m[x.id] = x; return m; }, {});
  const APPL_BY_ID = R.EVIDENCE_APPLICABILITY.reduce(function(m, x){ m[x.id] = x; return m; }, {});
  const AUTH_BY_ID = R.EVIDENCE_AUTHORITY.reduce(function(m, x){ m[x.id] = x; return m; }, {});

  function of(rule){ return resolve(BY_RULE[rule]); }

  function authorityOf(rule){
    const r = of(rule);
    return r ? r.authorityInfo : null;
  }

  function mayDirect(rule){
    const a = authorityOf(rule);
    return !!(a && a.mayDirect);
  }

  function cap(rule){
    const a = authorityOf(rule);
    return a ? a.cap : AUTH_BY_ID.observe_only.cap;
  }

  function line(rule){
    const r = of(rule);
    if(!r){
      return { source:null, label:'kaynak yok', tone:'warn', mayDirect:false,
        authority:'observe_only', authorityLabel:'Yalnız izler',
        text:'Bu eşiğin kaynağı yazılmamış. Kaynağı bilinmeyen bir eşik '
           + 'plan değiştirmez.' };
    }
    return {
      rule:r.rule, source:r.source,
      label:(r.sourceInfo || {}).label || r.source,
      tone:(r.authorityInfo || {}).tone || 'info',
      mayDirect:!!(r.authorityInfo || {}).mayDirect,
      certainty:r.certainty,
      certaintyLabel:(r.certaintyInfo || {}).label || r.certainty,
      applicability:r.applicability,
      applicabilityLabel:(r.applicabilityInfo || {}).label || r.applicability,
      authority:r.authority,
      authorityLabel:(r.authorityInfo || {}).label || r.authority,
      citation:r.citation, population:r.population,
      text:r.citation + (r.population ? ' · ' + r.population : ''),
      note:r.note || (r.sourceInfo || {}).note || '',
    };
  }

  /* Bir cumlenin tonunu YETKIYE gore kisar. Sessizce degil — neden
     kisildigi yazilir. */
  function temper(rule, strength){
    const r = of(rule);
    const a = r ? r.authorityInfo : null;
    const izin = !!(a && a.mayDirect);
    if(strength === 'observe' || izin){
      return { strength:strength, downgraded:false,
        source:r ? r.source : null, authority:r ? r.authority : null,
        cap:cap(rule) };
    }
    return {
      strength:'observe', downgraded:true,
      source:r ? r.source : null, authority:r ? r.authority : 'observe_only',
      cap:cap(rule),
      why:r
        ? 'Bu eşik «' + (r.sourceInfo || {}).label + '» kaynağından geliyor ve '
          + 'AYS yetki politikasında «' + (a || {}).label + '» sayılıyor: '
          + (a || {}).note + ' Bu yüzden burada plan değiştirilmez, gözlem bildirilir.'
        : 'Bu eşiğin kaynağı yazılmamış; kaynağı bilinmeyen bir eşikten '
          + 'plan değişikliği çıkmaz.',
    };
  }

  /* Kapsam: kayitli esiklerin dagilimi. */
  function coverage(){
    const bySource = {}, byAuthority = {};
    (R.EVIDENCE || []).forEach(function(e){
      const r = resolve(e);
      if(!r) return;
      bySource[r.source] = (bySource[r.source] || 0) + 1;
      byAuthority[r.authority] = (byAuthority[r.authority] || 0) + 1;
    });
    return { total:(R.EVIDENCE || []).length, bySource, byAuthority };
  }

  /* Denetim: kayit butunlugu. Bir esik kayitliysa kaynagi cozulebilmeli
     ve atfi yazili olmali. */
  function audit(){
    const sorunlar = [];
    (R.EVIDENCE || []).forEach(function(e){
      const r = resolve(e);
      if(!r){
        sorunlar.push({ rule:e.rule, kind:'unresolved',
          note:'Kaynak türü çözülemedi.' });
        return;
      }
      if(String(e.cite || '').length < 8){
        sorunlar.push({ rule:e.rule, kind:'no-citation',
          note:'Atıf metni yok ya da çok kısa.' });
      }
      if(r.source === 'system_tuning' && String(e.note || '').length < 40){
        sorunlar.push({ rule:e.rule, kind:'no-rationale',
          note:'Sistem ayarı olan eşik NEDEN öyle seçildiğini yazmalı; '
             + 'gerekçesiz bir seçim gizlenmiş bir keyfiliktir.' });
      }
    });
    return sorunlar;
  }

  function disputed(){
    return (R.EVIDENCE || []).map(resolve).filter(function(r){
      return r && (r.applicability !== 'direct' || r.certainty === 'low'
        || r.certainty === 'unknown');
    });
  }

  function policy(){ return R.EVIDENCE_POLICY; }

  return { of, resolve, line, authorityOf, mayDirect, cap, temper,
    coverage, audit, disputed, policy, rules:function(){ return Object.keys(BY_RULE); } };
})();
