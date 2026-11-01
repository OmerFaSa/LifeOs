/* BİÇİM ÇEKİRDEĞİ — sayı, net, süre ve küçük sayı yardımcıları. Üç arayüzün tek kaynağı.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/bicim.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Kopyayı elle
   düzenleme: bir sonraki yayında kaybolur.

   NEDEN: 2026-11-01 kopya taraması (KING-4 «Ölçüm 1c»): `median, round,
   clamp, sum, pct, fmtMin, fmtClock` üç `core/utils.js`'te birebir aynıydı;
   `fmtNet/fmtNum`'u yalnız SPİ paylaşılan biçimleyiciyle yazıyordu. AYS ve
   ESP her çağrıda `toLocaleString('tr-TR')` ile yeni bir Intl.NumberFormat
   kuruyordu (ölçülen: çağrı başına ~11,8 µs, paylaşılanla ~0,7 µs). Çıktı
   aynıdır: toLocaleString tanım gereği aynı biçimleyiciyi kullanır. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.BICIM = (function(){
  const SAYI = new Intl.NumberFormat('tr-TR');
  const NET = new Intl.NumberFormat('tr-TR', { minimumFractionDigits:2, maximumFractionDigits:2 });
  const pad2 = n => String(n).padStart(2, '0');

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
    return NET.format(Math.round(x*100)/100);
  }
  function fmtNum(x){
    if(x == null || (typeof x === 'number' && !isFinite(x))) return '—';
    return SAYI.format(Number(x));
  }
  function fmtMin(mins){
    /* HATALAR D-8: önce toplam yuvarlanır; 119,6 «1 sa 60 dk» yazılıyordu. */
    if(mins == null || !isFinite(mins)) return '—';
    const t = Math.round(mins);
    const h = Math.floor(t/60), m = t%60;
    if(h && m) return h+' sa '+m+' dk';
    if(h) return h+' sa';
    return m+' dk';
  }
  function fmtClock(seconds){
    const m = Math.floor(seconds/60), s = Math.floor(seconds%60);
    return pad2(m)+':'+pad2(s);
  }

  return Object.freeze({ median, round, clamp, sum, pct, fmtNet, fmtNum, fmtMin, fmtClock });
})();
