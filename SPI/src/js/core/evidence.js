/* Kanit motoru — bir esigin ne soylemeye yetkili oldugunu belirler.

   data/evidence.js dort ekseni tasir; bu dosya onlari COZER ve tek bir
   kurali uygular:

     Bir esik, YETKISININ izin verdiginden daha guclu konusamaz.

   Yetki, kaynak turunun politika tablosundaki karsiligidir (kayit basina
   acikca ezilebilir). Politika bir bilimsel iddia degil bir tasarim
   kararidir ve oyle etiketlenir — bu ayrim, "kanit siniflandirmasinin
   kendisi hangi kanita dayaniyor?" sorusunun sonsuz gerilemesini keser:
   dayanmiyor, cunku bir bulgu degil bir karar.

   Uc kural:

   1. KAYNAGI OLMAYAN ESIK YONLENDIREMEZ. Bilinmeyen kaynak, iyi kaynak
      degildir — "olculmemis veri sifir degildir" kuralinin kanit
      tarafindaki karsiligi.

   2. KIRMIZI BAYRAK YONLENDIRME YETKISI OLMAK ZORUNDADIR. Sistemin en
      sert cumlesi ("hekime basvur") en zayif dayanaktan cikamaz.
      audit() bunu tarar; testler denetimin BOS donmesini bekler.

   3. EKSENLER GIZLENMEZ. Arayuz esigi gosteriyorsa kaynagini, kesinligini,
      uygulanabilirligini ve yetkisini de gosterir. */

window.SP = window.SP || {};

SP.Ev = (function(){

  const BY_KEY = (function(){
    const m = {};
    (SP.EVIDENCE || []).forEach(function(e){
      m[e.marker + '/' + e.field] = e;
    });
    return m;
  })();

  /* Ham kaydi dort eksene cozer.

     Eski kayitlar tek eksenli `grade` tasir; SP.EVIDENCE_LEGACY onlari
     kaynak + kesinlige cevirir. Yeni kayitlar eksenleri dogrudan yazabilir
     ve yazdiklari varsayilani EZER. */
  function resolve(e){
    if(!e) return null;
    /* DIKKAT — ad carpismasi: kayitlardaki `source` alani ATIF METNIDIR
       ("ADA HbA1c siniflamasi"), kaynak TURU degil. Tur ekseni
       `sourceType` ile yazilir, yazilmamissa eski tek eksenli `grade`
       alanindan cozulur. Bu ikisini karistirmak butun esikleri sessizce
       'yalniz izler' yetkisine dusururdu. */
    const eski = SP.EVIDENCE_LEGACY[e.grade] || {};
    const source = e.sourceType || eski.source || null;
    if(!source) return null;

    const certainty = e.certainty || eski.certainty || 'unknown';

    /* Uygulanabilirlik yazilmamissa popülasyon metninden okunur:
       "DEĞİŞİR" diyen bir esik dogrudan uygulanabilir sayilamaz. */
    const pop = String(e.population || '');
    const applicability = e.applicability
      || (/DEĞİŞİR|değişir/.test(pop) ? 'indirect'
        : (pop === '—' || pop === '') ? 'local' : 'direct');

    const authority = e.authority || SP.EVIDENCE_POLICY.defaults[source] || 'observe_only';

    return {
      marker:e.marker, field:e.field,
      source:source, certainty:certainty,
      applicability:applicability, authority:authority,
      sourceInfo:SP.SOURCE_BY_ID[source] || null,
      certaintyInfo:SP.CERTAINTY_BY_ID[certainty] || null,
      applicabilityInfo:SP.APPLICABILITY_BY_ID[applicability] || null,
      authorityInfo:SP.AUTHORITY_BY_ID[authority] || null,
      citation:e.source, year:e.year || null, population:e.population || null,
      note:e.note || '',
    };
  }

  function of(markerId, field){
    return resolve(BY_KEY[markerId + '/' + field]);
  }

  /* Eski cagri yuzeyi: tek eksenli "derece" isteyen kod hala calisir.
     Donen sey kaynak turudur ve artik bir SIRALAMA degildir. */
  function gradeOf(markerId, field){
    const r = of(markerId, field);
    if(!r) return null;
    return SP.GRADE_BY_ID[r.source] || null;
  }

  /* DIKKAT — bu ETKIN yetkidir, kayitta yazan tavan degil.
     Tavani okumak icin of().authority kullanilir. */
  function authorityOf(markerId, field){
    const r = of(markerId, field);
    if(!r) return null;
    return effective(r).info;
  }


  /* ------------------------------------------------ ETKİN YETKİ (effective)

     Dışarıdan gelen eleştiri haklıydı: dört eksen «ayrı» diye yazılmıştı
     ama yetki kararına yalnızca BİR eksen giriyordu. Bu şu boşluğu
     bırakıyordu:

       kaynak: kılavuz · kesinlik: bilinmiyor · uygulanır: dolaylı
       → yetki: yönlendirebilir

     Yani adı konmuş bir kılavuzdan geldiği için, kesinliği değerlendirilmemiş
     ve bu kullanıcıya dolaylı uyan bir eşik tam yetkiyle konuşabiliyordu.

     Düzeltme: `authority` artık bir SONUÇ değil bir TAVAN. Etkin yetki,
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
        reason:'Eşik bu kullanıcıya dolaylı uyuyor; popülasyona göre kayabilir.' });
    } else if(r.applicability === 'local'){
      out.push({ axis:'applicability',
        reason:'Eşik kişiye/cihaza özel; genel bir karar eşiği değil.' });
    }
    return out;
  }

  /* Etkin yetki — dört eksenin birlikte sonucu. */
  function effective(r){
    if(!r) return { authority:'observe_only', capped:true, steps:0, reasons:[],
      info:SP.AUTHORITY_BY_ID.observe_only };
    const inis = downgrades(r);
    const id = stepDown(r.authority, inis.length);
    return {
      authority:id, ceiling:r.authority, steps:inis.length,
      reasons:inis, capped:id !== r.authority,
      info:SP.AUTHORITY_BY_ID[id] || SP.AUTHORITY_BY_ID.observe_only,
    };
  }

  /* Bu esik bir DIREKTIF uretebilir mi? ETKIN yetki karar verir. */
  function mayDirect(markerId, field){
    const e = effective(of(markerId, field));
    return !!(e.info && e.info.mayDirect);
  }

  /* Bu esikten cikan bir hedef degisikliginin ust siniri.
     null = sinir yok. Etkin yetkiden okunur. */
  function cap(markerId, field){
    const e = effective(of(markerId, field));
    return e.info ? e.info.cap : SP.AUTHORITY_BY_ID.observe_only.cap;
  }

  function effectiveOf(markerId, field){ return effective(of(markerId, field)); }

  /* Kullaniciya gosterilecek satir — dort eksen birden. */
  function line(markerId, field){
    const r = of(markerId, field);
    const etkin = effective(r);
    if(!r){
      return { source:null, label:'kaynak yok', tone:'warn', mayDirect:false,
        certainty:'unknown', applicability:null, authority:'observe_only',
        authorityLabel:'Yalnız izler',
        text:'Bu eşiğin kaynağı yazılmamış. Kaynağı bilinmeyen bir eşik '
           + 'yönlendirme üretmez.' };
    }
    return {
      source:r.source, label:(r.sourceInfo || {}).label || r.source,
      tone:(etkin.info || {}).tone || 'info',
      mayDirect:!!(etkin.info || {}).mayDirect,
      certainty:r.certainty,
      certaintyLabel:(r.certaintyInfo || {}).label || r.certainty,
      applicability:r.applicability,
      applicabilityLabel:(r.applicabilityInfo || {}).label || r.applicability,
      authority:etkin.authority,
      authorityLabel:(etkin.info || {}).label || etkin.authority,
      authorityCeiling:r.authority,
      authorityCapped:etkin.capped,
      authorityReasons:etkin.reasons.map(function(x){ return x.reason; }),
      citation:r.citation, year:r.year, population:r.population,
      text:r.citation + (r.year ? ' (' + r.year + ')' : '')
        + (r.population ? ' · ' + r.population : ''),
      note:r.note || (r.sourceInfo || {}).note || '',
    };
  }

  /* Bir cumlenin tonunu YETKIYE gore kisar.

     Cagiran ne demek istedigini `strength` ile soyler: 'refer' | 'act' |
     'observe'. Yetki yetmiyorsa cumle 'observe' seviyesine iner ve NEDEN
     indigi acikca yazilir. Sessizce zayiflatmak, yaniltmanin baska bir
     bicimidir. */
  function temper(markerId, field, strength){
    const r = of(markerId, field);
    const etkin = effective(r);
    const a = etkin.info;
    const izin = !!(a && a.mayDirect);
    if(strength === 'observe' || izin){
      return { strength:strength, downgraded:false,
        source:r ? r.source : null, authority:r ? r.authority : null,
        cap:cap(markerId, field) };
    }
    return {
      strength:'observe', downgraded:true,
      source:r ? r.source : null, authority:r ? r.authority : 'observe_only',
      cap:cap(markerId, field),
      why:r
        ? 'Bu eşik «' + (r.sourceInfo || {}).label + '» kaynağından geliyor ve '
          + 'SPİ yetki politikasında «' + (a || {}).label + '» sayılıyor: '
          + (a || {}).note
          + (etkin.capped
              ? ' Yetki tavandan indirildi — ' + etkin.reasons.map(function(x){
                  return x.reason; }).join(' ')
              : '')
          + ' Bu yüzden burada yönlendirme değil gözlem bildirilir.'
        : 'Bu eşiğin kaynağı yazılmamış; kaynağı bilinmeyen bir eşikten '
          + 'yönlendirme çıkmaz.',
    };
  }

  /* ------------------------------------------------------------ kapsam */

  function coverage(){
    const alanlar = ['ref', 'optimal', 'red'];
    let toplam = 0, kaynakli = 0, yonlendirebilen = 0;
    const eksik = [];
    const kaynakSayim = {}, kesinlikSayim = {}, yetkiSayim = {};

    (SP.BIOMARKERS || []).forEach(function(b){
      alanlar.forEach(function(f){
        const varMi = f === 'red'
          ? !!(b.red && (b.red.below != null || b.red.above != null))
          : !!b[f];
        if(!varMi) return;
        toplam++;
        const r = of(b.id, f);
        if(r){
          kaynakli++;
          kaynakSayim[r.source] = (kaynakSayim[r.source] || 0) + 1;
          kesinlikSayim[r.certainty] = (kesinlikSayim[r.certainty] || 0) + 1;
          yetkiSayim[r.authority] = (yetkiSayim[r.authority] || 0) + 1;
          if(mayDirect(b.id, f)) yonlendirebilen++;
        } else {
          eksik.push({ marker:b.id, name:b.name, field:f });
        }
      });
    });

    return { total:toplam, sourced:kaynakli, mayDirect:yonlendirebilen,
      missing:eksik, pct:toplam ? Math.round(100 * kaynakli / toplam) : 0,
      bySource:kaynakSayim, byCertainty:kesinlikSayim, byAuthority:yetkiSayim };
  }

  /* Denetim: kirmizi bayragi olup yonlendirme yetkisi olmayan her esik. */
  function audit(){
    const sorunlar = [];
    (SP.BIOMARKERS || []).forEach(function(b){
      const kirmizi = b.red && (b.red.below != null || b.red.above != null);
      if(!kirmizi) return;
      const r = of(b.id, 'red');
      if(!r){
        sorunlar.push({ marker:b.id, name:b.name, kind:'no-source',
          note:'Kırmızı bayrak eşiğinin kaynağı yazılmamış.' });
      } else if(!(effective(r).info || {}).mayDirect){
        sorunlar.push({ marker:b.id, name:b.name, kind:'no-authority',
          authority:effective(r).authority,
          note:'Kırmızı bayrak «' + (effective(r).info || {}).label
             + '» yetkisine dayanıyor; yönlendirme için yetersiz.' });
      }
    });
    return sorunlar;
  }

  /* Kilavuzlarin AYRISTIGI ya da popülasyona gore KAYAN esikler.
     Ayrisma gizlenmez: kullanicinin bilmesi gereken bir seydir. */
  function disputed(){
    return (SP.EVIDENCE || []).filter(function(e){
      const r = resolve(e);
      if(!r) return false;
      return r.applicability !== 'direct'
        || r.certainty === 'low'
        || /AYRIŞ|ayrış/.test(e.note || '');
    }).map(resolve);
  }

  /* Yetki politikasi — arayuzde gosterilmek uzere. */
  function policy(){ return SP.EVIDENCE_POLICY; }

  return { of, resolve, gradeOf, authorityOf, effectiveOf, mayDirect, cap,
    line, temper, coverage, audit, disputed, policy,
    SOURCES:SP.EVIDENCE_SOURCES, AUTHORITY:SP.EVIDENCE_AUTHORITY,
    GRADES:SP.EVIDENCE_GRADES };
})();
