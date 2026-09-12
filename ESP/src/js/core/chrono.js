/* Kronoloji motoru — tarih masasinin butun sayilari.

   Tarihte "ne kadar biliyorum" sorusunun kotu cevabi olay sayisidir. Yuz
   olay ezberleyip hepsini ayni yuzyildan bilen biri tarih bilmez; bes
   olayi nedenleriyle ve kaynagiyla bilen biri daha ileridedir.

   Bu yuzden buradaki olcum uc eksenlidir:

     KAPSAM   donem, bolge ve alan dagilimi — nerede kor nokta var?
     DERINLIK nedensellik zinciri ve kaynak elestirisi — ne kadar acikliyor?
     TUTMA    SRS retansiyonu — ogrenilen duruyor mu?

   Ucu ayri olcullur ve ASLA tek bir puana toplanmaz. Tek puan, hangi
   eksenin zayif oldugunu gizler; gizlenen eksen calisilmaz.

   Doktrin burada da aynidir: bos bir kronoloji "sifir kapsam" degil "veri
   yok"tur. Hicbir olay girmemis birine "kapsamin %0" demek, olcmedigi bir
   seyi olcmus gibi yapmaktir. */

window.ESP = window.ESP || {};

ESP.Chrono = (function(){
  const U = ESP.U, S = ESP.S;

  const MISSING = { value:null, cert:'missing' };

  function events(){ return S.events || []; }
  function sources(){ return S.sources || []; }
  function chains(){ return S.chains || []; }

  /* --------------------------------------------------------------- kapsam */

  /* Bir boyutun dagilimi: donem, bolge ya da alan.
     Bos kronolojide dagilim yoktur — sifirlarla dolu bir tablo degil. */
  function spread(dim){
    const list = events();
    if(!list.length) return { cert:'missing', buckets:[], covered:0, total:0, empty:[] };

    const tanim = dim === 'era' ? ESP.ERAS
      : dim === 'region' ? ESP.REGIONS
      : ESP.EVENT_KINDS;

    const sayac = {};
    list.forEach(function(e){
      const k = dim === 'era' ? e.era : (dim === 'region' ? e.region : e.kind);
      if(k) sayac[k] = (sayac[k] || 0) + 1;
    });

    const kovalar = tanim.map(function(t){
      return { id:t.id, label:t.label, n:sayac[t.id] || 0,
        pct:Math.round(100 * (sayac[t.id] || 0) / list.length) };
    });

    return {
      cert:'derived',
      buckets:kovalar,
      covered:kovalar.filter(function(b){ return b.n > 0; }).length,
      total:tanim.length,
      empty:kovalar.filter(function(b){ return b.n === 0; }),
    };
  }

  /* Kronolojideki yuzyil bosluklari.

     En dusuk ve en yuksek yil arasinda HIC olay girilmemis yuzyillar. Bos
     yuzyil bir eksiklik degildir — her yuzyilda donum noktasi olmasi
     gerekmez — ama arka arkaya UC bos yuzyil bir kor noktadir ve gorunur
     olmali. */
  function centuryGaps(minRun){
    const list = events().filter(function(e){ return typeof e.year === 'number'; });
    if(list.length < 2) return { cert:'missing', gaps:[], spanFrom:null, spanTo:null };

    const yuzyillar = {};
    list.forEach(function(e){ yuzyillar[ESP.centuryOf(e.year)] = 1; });

    const yillar = list.map(function(e){ return e.year; });
    const bas = ESP.centuryOf(Math.min.apply(null, yillar));
    const son = ESP.centuryOf(Math.max.apply(null, yillar));

    const esik = minRun || 3;
    const bosluklar = [];
    let dizi = [];
    for(let c = bas; c <= son; c++){
      if(c === 0) continue;                       // sifirinci yuzyil yoktur
      if(yuzyillar[c]){
        if(dizi.length >= esik) bosluklar.push({ from:dizi[0], to:dizi[dizi.length - 1],
          length:dizi.length });
        dizi = [];
      }else{
        dizi.push(c);
      }
    }
    if(dizi.length >= esik) bosluklar.push({ from:dizi[0], to:dizi[dizi.length - 1],
      length:dizi.length });

    return { cert:'derived', gaps:bosluklar, spanFrom:bas, spanTo:son };
  }

  /* Esanli olaylar: verilen yilin ±50 yilinda baska bolgelerde ne oldu.
     Tarihin en ogretici sorusu budur ve cevabi veriden gelir. */
  function contemporaries(year, span){
    if(typeof year !== 'number') return [];
    const yaricap = span || 50;
    return events().filter(function(e){
      return typeof e.year === 'number' && Math.abs(e.year - year) <= yaricap;
    }).sort(function(a, b){ return a.year - b.year; });
  }

  /* --------------------------------------------------------------- derinlik */

  /* Kaynak dengesi. Birincil oran bir KALITE degil bir KOMPOZISYON olcusudur:
     %100 birincil de saglikli degildir (baglam ikincil kaynaktan gelir). */
  function sourceBalance(){
    const list = sources();
    if(!list.length) return { cert:'missing', total:0, primary:0, ratio:null,
      byKind:{}, note:'Henüz kaynak değerlendirilmedi.' };

    const tur = {};
    list.forEach(function(s){ tur[s.kind] = (tur[s.kind] || 0) + 1; });
    const birincil = tur.primary || 0;
    const oran = birincil / list.length;

    return {
      cert:'derived', total:list.length, primary:birincil, ratio:oran, byKind:tur,
      note:oran < 0.2 ? 'Neredeyse hepsi ikincil: başkasının okumasını okuyorsun.'
        : (oran > 0.85 ? 'Neredeyse hepsi birincil: bağlamı verecek inceleme az.'
          : null),
    };
  }

  /* Kaynak elestirisinin ortalama derinligi — sekiz sorudan kaci cevaplanmis. */
  function critiqueDepth(){
    const list = sources();
    if(!list.length) return MISSING;
    const toplam = list.reduce(function(a, s){
      return a + ESP.Model.critiqueDepth(s).answered;
    }, 0);
    return { value:toplam / list.length, cert:'derived',
      total:(ESP.SOURCE_CRITIQUE || []).length };
  }

  /* Kaynaksiz kalmis iddialar: bir zincir halkasi kaynaga baglanmamissa.
     Bu bir hata degil bir ACIKTIR ve masaya not olarak duser. */
  function unsourcedLinks(){
    const out = [];
    chains().forEach(function(c){
      (c.links || []).forEach(function(l){
        if(!l.sourceId) out.push({ chain:c, link:l });
      });
    });
    return out;
  }

  /* Dengesiz zincirler: yalnizca tetikleyiciden ibaret aciklamalar. */
  function unbalancedChains(){
    return chains().filter(function(c){
      const b = ESP.Model.chainBalance(c);
      return c.links && c.links.length && !b.balanced;
    });
  }

  /* Bir olayin aciklanma durumu. */
  function explained(eventId){
    const c = chains().filter(function(x){ return x.eventId === eventId; });
    if(!c.length) return { state:'none', chains:0, sourced:0 };
    const kaynakli = c.reduce(function(a, x){
      return a + ESP.Model.chainBalance(x).sourced; }, 0);
    const dengeli = c.some(function(x){ return ESP.Model.chainBalance(x).balanced; });
    return { state:dengeli ? 'balanced' : 'thin', chains:c.length, sourced:kaynakli };
  }

  /* ----------------------------------------------------------------- tutma */

  function retention(){
    const r = ESP.SRS.retention(ESP.HISTORY_DECK);
    if(r.cert === 'missing' || r.n < ESP.Planner.RETENTION_MIN_CARDS){
      return { value:null, cert:'missing', n:r.n, total:r.total };
    }
    return r;
  }

  /* Bir olaydan SRS karti uretir. Tarih karti iki yonludur ama ESP'de bir
     kart tek yonludur: "olay -> yil" ve "yil -> olay" ayri kartlardir,
     cunku ikisi ayri hatirlama isidir ve biri bilinirken oteki
     bilinmeyebilir. */
  function cardsFor(ev){
    if(!ev || typeof ev.year !== 'number') return [];
    const etiket = ESP.yearLabel(ev.year);
    return [
      { front:ev.title, back:etiket, lang:ESP.HISTORY_DECK,
        context:ev.why || '', tags:['history', ev.era].filter(Boolean) },
      { front:etiket + ' — bu yıl ne oldu?', back:ev.title, lang:ESP.HISTORY_DECK,
        context:ev.why || '', tags:['history', ev.era].filter(Boolean) },
    ];
  }

  /* -------------------------------------------------------------- durum */

  /* Tarih masasinin brifingi. Ajanin gordugu tek sey budur. */
  function status(){
    const list = events();
    const donem = spread('era'), bolge = spread('region'), alan = spread('kind');
    const bosluk = centuryGaps();
    const kaynak = sourceBalance();
    const derin = critiqueDepth();
    const r = retention();

    return {
      events:list.length,
      firstYear:list.length ? Math.min.apply(null, list.map(function(e){ return e.year; })) : null,
      lastYear:list.length ? Math.max.apply(null, list.map(function(e){ return e.year; })) : null,
      eras:{ covered:donem.covered, total:donem.total, empty:donem.empty.map(function(b){ return b.label; }) },
      regions:{ covered:bolge.covered, total:bolge.total, empty:bolge.empty.map(function(b){ return b.label; }) },
      kinds:{ covered:alan.covered, total:alan.total, empty:alan.empty.map(function(b){ return b.label; }) },
      gaps:bosluk.gaps,
      sources:{ total:kaynak.total, primary:kaynak.primary, ratio:kaynak.ratio,
        note:kaynak.note, depth:derin.value, depthOf:derin.total },
      chains:{ total:chains().length,
        unbalanced:unbalancedChains().length,
        unsourced:unsourcedLinks().length },
      retention:{ value:r.value, cert:r.cert, n:r.n },
      cert:list.length ? 'derived' : 'missing',
    };
  }

  /* Masa notlari — kosul saglandiginda kendiliginden duser. */
  function findings(){
    const out = [];
    const st = status();
    if(!st.events){
      out.push({ tone:'info', label:'Boş kronoloji',
        text:'Zaman şeridinde hiç olay yok. Tohum listesi ' 
          + (ESP.SEED_EVENTS || []).length + ' dönüm noktası taşıyor.' });
      return out;
    }
    if(st.eras.empty.length){
      out.push({ tone:'info', label:'Kapsanmayan dönem',
        text:st.eras.empty.join(', ') + ' dönemlerinden hiç olay yok.' });
    }
    if(st.kinds.empty.length){
      out.push({ tone:'info', label:'Tek yönlü tarih',
        text:st.kinds.empty.join(', ') + ' alanından olay girilmemiş: '
          + 'nedensellik bu eksende kör kalır.' });
    }
    st.gaps.forEach(function(g){
      out.push({ tone:'info', label:'Yüzyıl boşluğu',
        text:ESP.centuryLabel(g.from) + ' – ' + ESP.centuryLabel(g.to)
          + ' arası ' + g.length + ' yüzyıl boş.' });
    });
    if(st.chains.unbalanced){
      out.push({ tone:'warn', label:'Dengesiz açıklama',
        text:st.chains.unbalanced + ' zincirde yalnızca kıvılcım var, yapısal koşul yok.' });
    }
    if(st.chains.unsourced){
      out.push({ tone:'warn', label:'Kaynaksız iddia',
        text:st.chains.unsourced + ' halka hiçbir kaynağa bağlı değil.' });
    }
    if(st.sources.note){
      out.push({ tone:'info', label:'Kaynak dengesi', text:st.sources.note });
    }
    if(st.retention.cert !== 'missing' && st.retention.value < ESP.Planner.RETENTION_FLOOR){
      out.push({ tone:'danger', label:'Tarih kartları geriliyor',
        text:'Retansiyon %' + Math.round(st.retention.value * 100)
          + ' — yeni olay eklemeden önce tekrar.' });
    }
    return out;
  }

  /* Bugunun tarih egzersizi. Kademe merdivenden gelir; egzersiz o kademeye
     ait olanlardan secilir. Secim MODELE birakilmaz. */
  function drill(){
    const lv = ESP.Curriculum.levelOf('history');
    const rank = Math.max(1, (lv && lv.rank) || 1);
    const uygun = (ESP.HISTORY_DRILLS || []).filter(function(d){ return d.level <= rank + 1; });
    if(!uygun.length) return null;
    const st = status();

    /* Once acigi kapatan egzersiz: dengesiz zincir varsa zincir, kaynak
       sigsa kaynak elestirisi. Rastgele secim en son care. */
    if(st.chains.unbalanced) return pick(uygun, 'zincir');
    if(st.sources.total && st.sources.depth != null && st.sources.depth < 4) return pick(uygun, 'kaynak');
    if(st.kinds.empty.length) return pick(uygun, 'esanli');
    if(st.gaps.length) return pick(uygun, 'serit');

    const gun = U.todayISO();
    const i = Math.abs(hash(gun)) % uygun.length;
    return uygun[i];
  }

  function pick(list, id){
    return list.filter(function(d){ return d.id === id; })[0] || list[0];
  }

  function hash(s){
    let h = 0;
    for(let i = 0; i < s.length; i++){ h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
    return h;
  }

  return {
    spread, centuryGaps, contemporaries,
    sourceBalance, critiqueDepth, unsourcedLinks, unbalancedChains, explained,
    retention, cardsFor,
    status, findings, drill,
  };
})();
