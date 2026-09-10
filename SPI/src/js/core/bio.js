/* Modul 1'in kural motoru — biyobelirtec durumu ve bireysel egilim.

   Burada model yoktur, yalnizca hesap vardir. Ajan Kerem bu dosyanin
   ciktisini cumleye cevirir; sayiyi degistiremez.

   Iki soru cevaplanir:

     1. Bu deger nerede duruyor?   statusOf()
        Referans araliginin disinda mi, hedef bandin disinda mi, kritik mi.

     2. Bu deger nereye gidiyor?   trendOf()
        Referans icinde kalan ama alti ayda kademeli dusen bir ferritin,
        araligin disina cikmis tek bir olcumden daha cok sey soyler.
        Bu, PDF'teki "tekil referans araliklari yerine bireysel trend"
        ilkesinin kod karsiligidir. */

window.SP = window.SP || {};

SP.Bio = (function(){
  const U = SP.U;

  /* ------------------------------------------------------------- referans */

  /* Cinsiyete ve yasa gore aralik cozumleme.
     { male:[...], female:[...] } bicimindeki alanlar profile gore secilir;
     duz dizi olanlar herkes icin aynidir. */
  function pick(field, profile){
    if(field == null) return null;
    if(Array.isArray(field)) return field;
    const p = profile || SP.S.profile || {};
    const sex = p.sex === 'female' ? 'female' : 'male';
    const age = SP.Model.ageOf(p);

    /* Yasa bagli varyantlar once denenir. */
    if(age != null && age >= 50 && field[sex + '50']) return field[sex + '50'];
    if(age != null && age >= 30 && field[sex === 'male' ? 'over30M' : 'over30F']) {
      return field[sex === 'male' ? 'over30M' : 'over30F'];
    }
    if(field[sex]) return field[sex];
    return null;
  }

  function refFor(markerId, profile){
    const b = SP.BIO_BY_ID[markerId];
    if(!b) return null;
    return {
      marker:b,
      ref:pick(b.ref, profile),
      optimal:pick(b.optimal, profile),
      red:b.red || {},
    };
  }

  /* ---------------------------------------------------------------- durum */

  const STATUS = {
    red:      { id:'red',      tone:'danger', label:'kritik' },
    low:      { id:'low',      tone:'warn',   label:'referans altı' },
    high:     { id:'high',     tone:'warn',   label:'referans üstü' },
    belowOpt: { id:'belowOpt', tone:'info',   label:'hedefin altı' },
    aboveOpt: { id:'aboveOpt', tone:'info',   label:'hedefin üstü' },
    ok:       { id:'ok',       tone:'ok',     label:'hedefte' },
    unknown:  { id:'unknown',  tone:'muted',  label:'veri yok' },
  };

  /* Bir degeri sinifa oturtur. Sira onemlidir: kritik esik her seyi yener,
     sonra referans araligi, en son hedef bant bakilir. */
  function statusOf(markerId, value, profile){
    const r = refFor(markerId, profile);
    if(!r) return STATUS.unknown;
    if(value == null || !isFinite(value)) return STATUS.unknown;
    const v = Number(value);

    if(r.red.below != null && v < r.red.below) return STATUS.red;
    if(r.red.above != null && v > r.red.above) return STATUS.red;

    if(r.ref){
      if(v < r.ref[0]) return STATUS.low;
      if(v > r.ref[1]) return STATUS.high;
    }
    if(r.optimal){
      if(v < r.optimal[0]) return STATUS.belowOpt;
      if(v > r.optimal[1]) return STATUS.aboveOpt;
    }
    return STATUS.ok;
  }

  /* Durumun kisa gerekcesi — ekranda rozetin yanina yazilir. */
  function statusNote(markerId, value, profile){
    const b = SP.BIO_BY_ID[markerId];
    const r = refFor(markerId, profile);
    const st = statusOf(markerId, value, profile);
    if(!b || !r) return '';
    const unit = b.unit ? ' ' + b.unit : '';
    switch(st.id){
      case 'red':
        return 'Sistemin yorum yaptığı eşiğin ötesinde. Bu bir teşhis değil, hekime yönlendirmedir.';
      case 'low':
        return 'Referans aralığının altında (' + U.fmtNum(r.ref[0]) + unit + ' beklenir).';
      case 'high':
        return 'Referans aralığının üstünde (' + U.fmtNum(r.ref[1]) + unit + ' beklenir).';
      case 'belowOpt':
        return 'Referans içinde ama hedef bandın altında. Uyarı değil, iyileştirme alanı.';
      case 'aboveOpt':
        return 'Referans içinde ama hedef bandın üstünde.';
      case 'ok':
        return r.optimal ? 'Hedef bandın içinde.' : 'Referans aralığının içinde.';
      default:
        return 'Bu ölçüm hiç girilmemiş. Sıfır sayılmaz.';
    }
  }

  /* ---------------------------------------------------------------- egilim

     En kucuk kareler ile egim hesaplanir. Egim gunluk degisimdir; okunabilir
     olmasi icin 90 gune olceklenir ve son degere gore yuzdeye cevrilir.

     En az uc olcum sarttir: iki nokta her zaman bir dogru cizer ve bu
     "egilim" degil yalnizca iki olcum arasindaki farktir. */
  const MIN_POINTS = 3;

  function trendOf(markerId, opts){
    const o = opts || {};
    const all = SP.Model.seriesOf(markerId);
    const days = o.days || 365;
    const cutoff = U.addDays(U.today(), -days);
    const pts = all.filter(p => U.parse(p.date) >= cutoff);

    if(pts.length < MIN_POINTS){
      return { ok:false, n:pts.length, dir:'flat',
        note:pts.length ? 'Eğilim için en az ' + MIN_POINTS + ' ölçüm gerekir; ' + pts.length + ' var.'
                        : 'Henüz ölçüm yok.' };
    }

    const t0 = U.parse(pts[0].date);
    const xs = pts.map(p => U.diffDays(U.iso(t0), p.date));
    const ys = pts.map(p => p.v);
    const n = xs.length;
    const mx = U.sum(xs) / n, my = U.sum(ys) / n;
    let num = 0, den = 0;
    for(let i = 0; i < n; i++){
      num += (xs[i] - mx) * (ys[i] - my);
      den += (xs[i] - mx) * (xs[i] - mx);
    }
    const slope = den === 0 ? 0 : num / den;          /* birim / gun */
    const per90 = slope * 90;
    const last = ys[n - 1];
    const pct = last ? U.round(100 * per90 / Math.abs(last), 1) : 0;

    /* Gurultuyu egilim sanmamak icin esik: 90 gunde son degerin %5'inden
       az degisim "yatay" sayilir. */
    const dir = Math.abs(pct) < 5 ? 'flat' : (per90 > 0 ? 'up' : 'down');

    return {
      ok:true, n, dir, slope, per90:U.round(per90, 2), pct,
      first:ys[0], last, from:pts[0].date, to:pts[n - 1].date,
      points:pts,
    };
  }

  /* Egilim iyi mi kotu mu? Bu karar `dir` alanindan degil, belirtecin
     hangi yonde iyi oldugundan (`b.dir`) ve degerin nerede durdugundan gelir.
     Ornek: LDL'nin dusmesi iyidir, HDL'nin dusmesi kotudur. */
  function trendVerdict(markerId, trend, profile){
    const b = SP.BIO_BY_ID[markerId];
    if(!b || !trend || !trend.ok) return { tone:'muted', label:'—', text:'' };
    if(trend.dir === 'flat') return { tone:'muted', label:'yatay', text:'Son ölçümlerde belirgin bir yön yok.' };

    const goodDir = b.dir === 'low' ? 'down' : b.dir === 'high' ? 'up' : null;
    const st = statusOf(markerId, trend.last, profile);
    const word = trend.dir === 'up' ? 'yükseliyor' : 'düşüyor';
    const amount = '90 günde %' + Math.abs(trend.pct);

    if(goodDir === null){
      /* Bandin ortasi iyi olan olcumler: hedefe yaklasiyorsa iyi, uzaklasiyorsa kotu. */
      const r = refFor(markerId, profile);
      const band = (r && r.optimal) || (r && r.ref);
      if(!band) return { tone:'info', label:word, text:'Ölçüm ' + word + ' (' + amount + ').' };
      const mid = (band[0] + band[1]) / 2;
      const closer = Math.abs(trend.last - mid) < Math.abs(trend.first - mid);
      return closer
        ? { tone:'ok', label:word, text:'Hedef bandın ortasına yaklaşıyor (' + amount + ').' }
        : { tone:'warn', label:word, text:'Hedef bandın ortasından uzaklaşıyor (' + amount + ').' };
    }

    if(trend.dir === goodDir){
      return { tone:'ok', label:word, text:'İstenen yönde ' + word + ' (' + amount + ').' };
    }
    /* Ters yonde: hedefteyse bilgi, hedefin disindaysa uyari. */
    return st.id === 'ok'
      ? { tone:'info', label:word, text:'Ters yönde ' + word + ' ama hâlâ hedefte (' + amount + ').' }
      : { tone:'warn', label:word, text:'Ters yönde ' + word + ' ve hedefin dışında (' + amount + ').' };
  }

  /* --------------------------------------------------------------- ozetler */

  /* Bir panelin son durumu — ekranin tablo satirlari. */
  function panelRows(panelId, profile){
    return SP.BIOMARKERS.filter(b => b.panel === panelId).map(b => {
      const last = SP.Model.latestOf(b.id);
      const v = last ? last.v : null;
      const r = refFor(b.id, profile);
      return {
        marker:b, value:v, at:last ? last.date : null,
        cert:last ? last.cert : 'missing',
        status:statusOf(b.id, v, profile),
        ref:r ? r.ref : null, optimal:r ? r.optimal : null,
      };
    });
  }

  /* Butun belirteclerin durum sayimi — Bugun ekranindaki ozet kart. */
  function summary(profile){
    const rows = SP.BIOMARKERS.map(b => {
      const last = SP.Model.latestOf(b.id);
      return { id:b.id, value:last ? last.v : null, status:statusOf(b.id, last ? last.v : null, profile) };
    });
    const count = id => rows.filter(r => r.status.id === id).length;
    return {
      total:rows.length,
      measured:rows.filter(r => r.value != null).length,
      red:count('red'),
      out:count('low') + count('high'),
      offTarget:count('belowOpt') + count('aboveOpt'),
      ok:count('ok'),
      missing:count('unknown'),
    };
  }

  /* Dikkat isteyen belirtecler — onem sirasina gore.
     Sira: kritik → referans disi → kotulesen egilim → hedef disi. */
  function attention(profile){
    const out = [];
    SP.BIOMARKERS.forEach(b => {
      const last = SP.Model.latestOf(b.id);
      if(!last) return;
      const st = statusOf(b.id, last.v, profile);
      const tr = trendOf(b.id);
      const vd = trendVerdict(b.id, tr, profile);

      let rank = null;
      if(st.id === 'red') rank = 1;
      else if(st.id === 'low' || st.id === 'high') rank = 2;
      else if(vd.tone === 'warn') rank = 3;
      else if(st.id === 'belowOpt' || st.id === 'aboveOpt') rank = 4;
      if(rank == null) return;

      out.push({ marker:b, value:last.v, at:last.date, status:st, trend:tr, verdict:vd, rank });
    });
    return out.sort((a, b) => a.rank - b.rank || (a.at < b.at ? 1 : -1));
  }

  /* Olcum borcu — hic olculmemis ya da uzun suredir tazelenmemis paneller.
     Vital olcumler gunluk, laboratuvar panelleri 180 gunde bir beklenir. */
  function overdue(){
    const out = [];
    SP.PANELS.forEach(p => {
      if(p.id === 'vital' || p.id === 'body') return;
      const markers = SP.BIOMARKERS.filter(b => b.panel === p.id);
      const dates = markers.map(b => SP.Model.latestOf(b.id)).filter(Boolean).map(x => x.date);
      if(!dates.length){
        out.push({ panel:p, days:null, note:'Hiç ölçülmemiş.' });
        return;
      }
      const newest = dates.sort()[dates.length - 1];
      const age = U.diffDays(newest, U.todayISO());
      if(age >= 180) out.push({ panel:p, days:age, at:newest, note:age + ' gündür tazelenmedi.' });
    });
    return out;
  }

  return {
    STATUS, MIN_POINTS,
    refFor, statusOf, statusNote,
    trendOf, trendVerdict,
    panelRows, summary, attention, overdue,
  };
})();
