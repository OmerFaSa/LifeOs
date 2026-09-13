/* Kanit motoru — bir esigin ne soylemeye yetkili oldugunu belirler.

   data/evidence.js dort ekseni tasir; bu dosya onlari cozer ve tek bir
   kurali uygular:

     Bir esik, YETKISININ izin verdiginden daha guclu konusamaz.

   Yetki, kaynak turunun politika tablosundaki karsiligidir (kayit basina
   ezilebilir). Politika bir pedagojik iddia degil bir tasarim kararidir
   ve oyle etiketlenir.

   Uc kural:

   1. KAYNAGI OLMAYAN ESIK YONLENDIREMEZ.
   2. KAPI ACAN HER ESIK YETKI TASIMALIDIR. audit() bunu tarar.
   3. EKSENLER GIZLENMEZ — arayuz esigi gosteriyorsa dayanagini da gosterir. */

window.ESP = window.ESP || {};

ESP.Ev = (function(){

  const BY_RULE = (function(){
    const m = {};
    (ESP.EVIDENCE || []).forEach(function(e){ m[e.rule] = e; });
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

    const authority = e.authority || ESP.EVIDENCE_POLICY.defaults[source] || 'observe_only';

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

  const SOURCE_BY_ID = ESP.EVIDENCE_SOURCES.reduce(function(m, x){ m[x.id] = x; return m; }, {});
  const CERT_BY_ID = ESP.EVIDENCE_CERTAINTY.reduce(function(m, x){ m[x.id] = x; return m; }, {});
  const APPL_BY_ID = ESP.EVIDENCE_APPLICABILITY.reduce(function(m, x){ m[x.id] = x; return m; }, {});
  const AUTH_BY_ID = ESP.EVIDENCE_AUTHORITY.reduce(function(m, x){ m[x.id] = x; return m; }, {});

  function of(rule){ return resolve(BY_RULE[rule]); }


  /* ------------------------------------------------ ETKİN YETKİ (effective)

     Dört eksen «ayrı» diye yazılmıştı ama yetki kararına yalnızca BİR
     eksen giriyordu. Bu şu boşluğu bırakıyordu:

       kaynak: çerçeve · kesinlik: bilinmiyor · uygulanır: dolaylı
       → yetki: kapı açabilir

     Yani adı konmuş bir kaynaktan geldiği için, kesinliği
     değerlendirilmemiş ve bu kullanıcıya dolaylı uyan bir eşik tam
     yetkiyle konuşabiliyordu.

     Düzeltme: `authority` artık bir SONUÇ değil bir TAVAN. Etkin yetki
     dört eksen birlikte hesaplanır ve tavanı hiçbir zaman aşamaz:

       düşük kesinlik      → bir basamak iner
       bilinmeyen kesinlik → bir basamak iner
       dolaylı uygulanır   → bir basamak iner
       yerel uygulanır     → bir basamak iner

     İnişler birikir. Bu bir formül değil bir POLİTİKADIR ve öyle
     etiketlenir; sayı vermez, basamak indirir. Gerekçesi: bir eşiğin
     gücü, en zayıf halkasından fazla olamaz. */
  const AUTH_ORDER = ['steer', 'limited_steer', 'inform', 'observe_only'];

  function stepDown(authorityId, steps){
    const i = AUTH_ORDER.indexOf(authorityId);
    if(i < 0) return 'observe_only';
    return AUTH_ORDER[Math.min(AUTH_ORDER.length - 1, i + Math.max(0, steps))];
  }

  /* «Yerel» eksen, GENELLENEBILIRLIGI olcer; bu kullaniciya UYGUNLUGU
     degil. Kullanicinin KENDI verisinden gelen bir esik baskasiyla
     karsilastirilamaz — ama tam da bu kullanici icin en uygun olandir.
     Bu yuzden kendi veri kaynaklarinda «yerel» bir zayiflik sayilmaz;
     onun zayifligi varsa kesinlik ekseninde yazilir.
     ESP'de bu kaynak «personal_data» (kendi olcumun). */
  const SELF_SOURCES = ['personal_data'];

  /* Kaç basamak inilecek ve NİÇİN. Sebepler kullanıcıya gösterilir:
     sessizce zayıflatmak, yanıltmanın başka bir biçimidir. */
  function downgrades(r){
    const out = [];
    if(r.certainty === 'low'){
      out.push({ axis:'certainty', reason:'Kesinlik düşük.' });
    } else if(r.certainty === 'unknown'){
      out.push({ axis:'certainty', reason:'Kesinlik değerlendirilmemiş.' });
    }
    if(r.applicability === 'indirect'){
      out.push({ axis:'applicability',
        reason:'Eşik bu kullanıcıya dolaylı uyuyor; kaynağın popülasyonuna '
             + 'göre kayabilir.' });
    } else if(r.applicability === 'local' && SELF_SOURCES.indexOf(r.source) < 0){
      out.push({ axis:'applicability',
        reason:'Eşik kişiye/bağlama özel; genel bir karar eşiği değil.' });
    }
    return out;
  }

  function effective(r){
    if(!r) return { authority:'observe_only', ceiling:'observe_only',
      capped:true, steps:0, reasons:[], info:AUTH_BY_ID.observe_only };
    const inis = downgrades(r);
    const id = stepDown(r.authority, inis.length);
    return {
      authority:id, ceiling:r.authority, steps:inis.length,
      reasons:inis, capped:id !== r.authority,
      info:AUTH_BY_ID[id] || AUTH_BY_ID.observe_only,
    };
  }

  function effectiveOf(rule){ return effective(of(rule)); }

  /* DIKKAT — bu ETKIN yetkidir, kayitta yazan tavan degil.
     Tavani okumak icin of().authority kullanilir. */
  function authorityOf(rule){
    const r = of(rule);
    if(!r) return null;
    return effective(r).info;
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
           + 'kademe değiştirmez.' };
    }
    const etkin = effective(r);
    return {
      rule:r.rule, source:r.source,
      label:(r.sourceInfo || {}).label || r.source,
      tone:(etkin.info || {}).tone || 'info',
      mayDirect:!!(etkin.info || {}).mayDirect,
      certainty:r.certainty,
      certaintyLabel:(r.certaintyInfo || {}).label || r.certainty,
      applicability:r.applicability,
      applicabilityLabel:(r.applicabilityInfo || {}).label || r.applicability,
      authority:etkin.authority,
      authorityLabel:(etkin.info || {}).label || etkin.authority,
      authorityCeiling:r.authority,
      authorityCeilingLabel:(r.authorityInfo || {}).label || r.authority,
      authorityCapped:etkin.capped,
      authorityReasons:etkin.reasons.map(function(x){ return x.reason; }),
      citation:r.citation, population:r.population,
      text:r.citation + (r.population ? ' · ' + r.population : ''),
      note:r.note || (r.sourceInfo || {}).note || '',
    };
  }

  /* Bir cumlenin tonunu YETKIYE gore kisar. Sessizce degil — neden
     kisildigi yazilir. */
  function temper(rule, strength){
    const r = of(rule);
    const etkin = effective(r);
    const a = etkin.info;
    const izin = !!(a && a.mayDirect);
    if(strength === 'observe' || izin){
      return { strength:strength, downgraded:false,
        source:r ? r.source : null, authority:r ? etkin.authority : null,
        ceiling:r ? r.authority : null, capped:etkin.capped,
        reasons:etkin.reasons.map(function(x){ return x.reason; }),
        cap:cap(rule) };
    }
    const inis = etkin.reasons.map(function(x){ return x.reason; });
    return {
      strength:'observe', downgraded:true,
      source:r ? r.source : null, authority:etkin.authority,
      ceiling:r ? r.authority : 'observe_only', capped:etkin.capped,
      reasons:inis,
      cap:cap(rule),
      why:r
        ? 'Bu eşik «' + (r.sourceInfo || {}).label + '» kaynağından geliyor ve '
          + 'ESP yetki politikasında en çok «'
          + ((r.authorityInfo || {}).label || r.authority) + '» sayılıyor'
          + (etkin.capped
             ? '; ayrıca ' + inis.join(' ') + ' Bu yüzden etkin yetkisi «'
               + (a || {}).label + '» seviyesine indi.'
             : ': ' + (a || {}).note)
          + ' Bu yüzden burada kademe değiştirilmez, gözlem bildirilir.'
        : 'Bu eşiğin kaynağı yazılmamış; kaynağı bilinmeyen bir eşikten '
          + 'kademe değişikliği çıkmaz.',
    };
  }

  /* Kapsam: kayitli esiklerin dagilimi. */
  function coverage(){
    const bySource = {}, byAuthority = {};
    (ESP.EVIDENCE || []).forEach(function(e){
      const r = resolve(e);
      if(!r) return;
      bySource[r.source] = (bySource[r.source] || 0) + 1;
      byAuthority[r.authority] = (byAuthority[r.authority] || 0) + 1;
    });
    return { total:(ESP.EVIDENCE || []).length, bySource, byAuthority };
  }

  /* Denetim: kayit butunlugu. Bir esik kayitliysa kaynagi cozulebilmeli
     ve atfi yazili olmali. */
  function audit(){
    const sorunlar = [];
    (ESP.EVIDENCE || []).forEach(function(e){
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
    return (ESP.EVIDENCE || []).map(resolve).filter(function(r){
      return r && (r.applicability !== 'direct' || r.certainty === 'low'
        || r.certainty === 'unknown');
    });
  }

  function policy(){ return ESP.EVIDENCE_POLICY; }

  return { of, resolve, line, authorityOf, effectiveOf, mayDirect, cap, temper,
    coverage, audit, disputed, policy, rules:function(){ return Object.keys(BY_RULE); } };
})();
