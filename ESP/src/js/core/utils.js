/* Tarih, sayi ve metin yardimcilari. */

window.ESP = window.ESP || {};

ESP.U = (function(){
  const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const MONTHS_SHORT = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const DAY_MS = 86400000;

  function pad2(n){ return String(n).padStart(2,'0'); }

  function iso(d){ return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }

  /* Bir ISO tarihi (YYYY-MM-DD) gecerli mi?

     Bu fonksiyon bir tuzaktan dogdu: `parse('yarın')` gecersiz bir Date
     uretiyordu ve gecersiz Date NESNESI TRUTHY'dir. Yani `if(U.parse(x))`
     yazan her denetim, bozuk bir tarihte de "gecerli" diyordu — sessizce.
     Sonra o tarihle yapilan her hesap NaN uretiyor, her karsilastirma false
     donuyor ve hicbir yerde hata gorunmuyordu.

     Bicim denetimi burada, ayri ve acik. Yalnizca "sayi sayi sayi" degil,
     takvimde gercekten var olan gun aranir: 2026-02-31 gecerli bir dize
     ama gecersiz bir gundur. */
  function isISO(s){
    if(typeof s !== 'string') return false;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.slice(0, 10));
    if(!m) return false;
    const y = Number(m[1]), ay = Number(m[2]), g = Number(m[3]);
    if(ay < 1 || ay > 12 || g < 1 || g > 31) return false;
    const d = new Date(y, ay - 1, g);
    return d.getFullYear() === y && d.getMonth() === ay - 1 && d.getDate() === g;
  }

  /* Cozulemeyen tarih icin `null` doner — gecersiz bir Date DEGIL.
     Cagiran taraf ikisini ayirt edebilmeli. */
  function parse(s){
    if(s instanceof Date) return isFinite(s.getTime()) ? s : null;
    if(!isISO(s)) return null;
    const parts = String(s).slice(0,10).split('-').map(Number);
    return new Date(parts[0], parts[1]-1, parts[2]);
  }

  function today(){
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  function todayISO(){ return iso(today()); }

  /* Gun ekler. Cozulemeyen bir tarih gelirse BUGUNDEN sayar: burada
     patlamak, kullanicinin bozuk tek bir kaydi yuzunden butun ekrani
     kapatmak olurdu. */
  function addDays(d, n){
    const t = (d instanceof Date && isFinite(d.getTime())) ? d : today();
    const r = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    r.setDate(r.getDate()+n);
    return r;
  }

  /* Iki ISO tarih arasindaki gun farki. Biri cozulemiyorsa sonuc NaN degil
     `null` olur: NaN sessizce yayilir ve her karsilastirmayi false yapar;
     null cagirani durmaya zorlar. */
  function diffDays(a, b){
    const x = parse(a), y = parse(b);
    if(!x || !y) return null;
    return Math.round((y - x) / DAY_MS);
  }

  /* 0 = Pazartesi ... 6 = Pazar */
  function weekdayIndex(d){ return (parse(d).getDay()+6)%7; }

  function fmtDate(d){
    const x = parse(d);
    return x.getDate()+' '+MONTHS[x.getMonth()]+' '+x.getFullYear();
  }
  function fmtShort(d){
    const x = parse(d);
    return x.getDate()+' '+MONTHS_SHORT[x.getMonth()];
  }
  function fmtRange(a, b){
    const x = parse(a), y = parse(b);
    if(x.getMonth() === y.getMonth()) return x.getDate()+'–'+y.getDate()+' '+MONTHS_SHORT[y.getMonth()];
    return fmtShort(x)+' – '+fmtShort(y);
  }
  function monthName(d){ return MONTHS[parse(d).getMonth()]; }
  function monthKey(d){ const x = parse(d); return x.getFullYear()+'-'+pad2(x.getMonth()+1); }

  function relativeDay(dateISO){
    const n = diffDays(todayISO(), dateISO);
    if(n === 0) return 'bugün';
    if(n === 1) return 'yarın';
    if(n === -1) return 'dün';
    if(n < 0) return Math.abs(n)+' gün gecikmiş';
    return n+' gün sonra';
  }

  /* --- sayi --- */
  function median(arr){
    const s = arr.filter(v => typeof v === 'number' && !isNaN(v)).sort((a,b)=>a-b);
    if(!s.length) return null;
    const m = Math.floor(s.length/2);
    return s.length % 2 ? s[m] : (s[m-1]+s[m])/2;
  }
  function round(x, digits){
    if(!isFinite(x)) return 0;
    const f = Math.pow(10, digits==null?1:digits);
    return Math.round(x*f)/f;
  }
  function clamp(x, lo, hi){ return Math.max(lo, Math.min(hi, x)); }
  function sum(arr){ return arr.reduce((a,b)=>a+(Number(b)||0), 0); }
  function pct(part, whole){
    if(!whole || !isFinite(whole) || !isFinite(part)) return 0;
    return round(100*part/whole, 0);
  }

  function fmtNet(x){
    if(x == null || (typeof x === 'number' && !isFinite(x))) return '—';
    return (Math.round(x*100)/100).toLocaleString('tr-TR', {minimumFractionDigits:2, maximumFractionDigits:2});
  }
  function fmtNum(x){
    if(x == null || (typeof x === 'number' && !isFinite(x))) return '—';
    return Number(x).toLocaleString('tr-TR');
  }
  function fmtMin(mins){
    if(mins == null) return '—';
    const h = Math.floor(mins/60), m = Math.round(mins%60);
    if(h && m) return h+' sa '+m+' dk';
    if(h) return h+' sa';
    return m+' dk';
  }
  function fmtClock(seconds){
    const m = Math.floor(seconds/60), s = Math.floor(seconds%60);
    return pad2(m)+':'+pad2(s);
  }

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
  function lastDays(n, endISO){
    const end = parse(endISO || todayISO());
    const out = [];
    for(let i = n - 1; i >= 0; i--) out.push(iso(addDays(end, -i)));
    return out;
  }

  return {
    MONTHS, MONTHS_SHORT, DAY_MS,
    pad2, iso, parse, isISO, today, todayISO, addDays, diffDays, weekdayIndex, lastDays,
    fmtDate, fmtShort, fmtRange, monthName, monthKey, relativeDay,
    median, round, clamp, sum, pct, fmtNet, fmtNum, fmtMin, fmtClock,
    esc, uid, slug, plural, norm, debounce,
  };
})();
