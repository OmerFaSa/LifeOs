/* Tarih, sayi ve metin yardimcilari. */

window.ESP = window.ESP || {};

ESP.U = (function(){
  const T = (typeof window !== 'undefined' && window.LIFEOS && window.LIFEOS.TARIH) || (typeof LIFEOS !== 'undefined' && LIFEOS.TARIH) || {};
  const { MONTHS, MONTHS_SHORT, DAY_MS, pad2, iso, gunOf, isISO, parse, today, todayISO, addDays, diffDays, weekdayIndex, fmtDate, fmtShort, monthName, monthKey } = T;

  function fmtRange(a, b){
    const x = parse(a), y = parse(b);
    if(!x || !y) return '';
    if(x.getMonth() === y.getMonth()) return x.getDate()+'–'+y.getDate()+' '+MONTHS_SHORT[y.getMonth()];
    return fmtShort(x)+' – '+fmtShort(y);
  }

  function relativeDay(dateISO){
    const n = diffDays(bugunISO(), dateISO);
    if(n == null) return '';
    if(n === 0) return 'bugün';
    if(n === 1) return 'yarın';
    if(n === -1) return 'dün';
    if(n < 0) return Math.abs(n)+' gün gecikmiş';
    return n+' gün sonra';
  }

  /* --- sayi --- */
  /* Sayi ve sure bicimleri ortak cekirdekten (brand/ortak/bicim.js). */
  const { median, round, clamp, sum, pct, fmtNet, fmtNum, fmtMin, fmtClock } = LIFEOS.BICIM;

  /* --- metin --- */
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }
  function uid(prefix){
    return (prefix||'id') + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  }
  function slug(s){
    return String(s).toLowerCase()
      .replace(/[ığüşöç]/g, c => ({'ı':'i','ğ':'g','ü':'u','ş':'s','ö':'o','ç':'c'}[c]))
      .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  }
  function plural(n, one, many){ return n+' '+(n===1?one:many); }

  /* Arama normalizasyonu: "ogrenme" ile "öğrenme" eslesir.
     Once Turkce harfler sadelestirilir — "İ".toLowerCase() birlesik nokta
     uretir, bu yuzden kucultme sonra yapilir. */
  const COMBINING = /[\u0300-\u036f]/g;   // birlesik aksan isaretleri
  function norm(s){
    return String(s == null ? '' : s)
      .replace(/[ıİI]/g,'i').replace(/[şŞ]/g,'s').replace(/[ğĞ]/g,'g')
      .replace(/[üÜ]/g,'u').replace(/[öÖ]/g,'o').replace(/[çÇ]/g,'c')
      .toLowerCase()
      .replace(COMBINING, '');   // artakalan birlesik isaretler
  }

  function debounce(fn, wait){
    let t;
    return function(){
      const args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(()=>fn.apply(ctx, args), wait||250);
    };
  }

  /* Son n gunun ISO tarihleri, ESKIDEN YENIYE. Bir pencereyi gezerken
     sirali olmasi onemli: ilk yarisi gecen hafta, ikinci yarisi bu hafta
     gibi karsilastirmalar bu siraya dayanir. */

  /* "Bugun" TEK bir yerden okunur.

     Modul icinden dogrudan `todayISO()` cagirmak sessiz bir tuzak uretti:
     testler `withToday()` ile ESP.U.todayISO'yu degistiriyor ama modul ici
     cagrilar o degisimi GORMUYORDU. Sonuc: sahte tarihle kurulmus bir test,
     gercek bugunun penceresine bakiyor ve "olcum yok" diyordu. Hicbir sey
     patlamadigi icin de fark edilmiyordu.

     Cozum: tarihe bagli yardimcilar bugunu DISARIYA acilan nesne uzerinden
     okur. Uretimde ayni degeri dondurur, testte degistirilebilir olur. */
  function bugunISO(){
    return (window.ESP && ESP.U && ESP.U.todayISO && ESP.U.todayISO !== todayISO)
      ? ESP.U.todayISO() : todayISO();
  }

  function lastDays(n, endISO){
    const end = parse(endISO || bugunISO());
    const out = [];
    for(let i = n - 1; i >= 0; i--) out.push(iso(addDays(end, -i)));
    return out;
  }

  return {
    gunOf,
    MONTHS, MONTHS_SHORT, DAY_MS,
    pad2, iso, parse, isISO, today, todayISO, addDays, diffDays, weekdayIndex, lastDays,
    fmtDate, fmtShort, fmtRange, monthName, monthKey, relativeDay,
    median, round, clamp, sum, pct, fmtNet, fmtNum, fmtMin, fmtClock,
    esc, uid, slug, plural, norm, debounce,
  };
})();
