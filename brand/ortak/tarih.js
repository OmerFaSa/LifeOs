/* TARİH ÇEKİRDEĞİ — yerel gün, ISO dize, gün farkı. Üç arayüzün tek tarih kaynağı.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/tarih.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Kopyayı elle
   düzenleme: bir sonraki yayında kaybolur.

   ------------------------------------------------------------------
   NEDEN BU DOSYA VAR

   2026-11-01 kopya taraması (KING-4 «Ölçüm 1c»): üç `core/utils.js` aynı
   tarih işlevlerini ayrı ayrı yaşatıyordu ve ayrışmışlardı. AYS ve SPİ'de
   `parse('2026-02-31')` sessizce 3 Mart'a kayıyor, `parse('yarın')` geçersiz
   ama TRUTHY bir Date döndürüyor, `diffDays` NaN yayıyordu; ESP aynı
   tuzakları önbellekli ve null dönen sürümle kapatmıştı. Doğru olan
   sürüm burada BİR KEZ yazılır, modüllerin `U` nesnesi buna bağlanır.

   Sözler:
     1. Gün YEREL gündür (Türkiye UTC+3): `toISOString()` gece 00–03 arası
        kaydı düne düşürür; burada kullanılmaz.
     2. Çözülemeyen tarih `null`dır — geçersiz Date ya da NaN değil
        (AGENTS §1.2: eksik veri sıfır değildir; sessiz NaN her
        karşılaştırmayı false yapar).
     3. Takvimde olmayan gün («2026-02-31») geçersizdir; kaydırılmaz.
     4. Dönen Date nesnesi paylaşılmaz: çağıran onu değiştirebilir. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.TARIH = (function(){
  const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const MONTHS_SHORT = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const DAY_MS = 86400000;

  function pad2(n){ return String(n).padStart(2,'0'); }
  function iso(d){ return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }

  /* Zaman damgasından yerel gün; yalnız tarih («2026-09-24») olduğu gibi döner. */
  function gunOf(ts){
    const s = ts == null ? '' : String(ts);
    if(/^\d{4}-\d{2}-\d{2}$/.test(s) || !/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
    const d = new Date(s);
    return isNaN(d.getTime()) ? s.slice(0, 10) : iso(d);
  }

  /* Geçerli ISO gün mü? İlk on karakter bakılır («2026-05-15T10:00» de gündür). */
  function isISO(s){
    if(typeof s !== 'string') return false;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.slice(0, 10));
    if(!m) return false;
    const y = Number(m[1]), ay = Number(m[2]), g = Number(m[3]);
    if(ay < 1 || ay > 12 || g < 1 || g > 31) return false;
    const d = new Date(y, ay - 1, g);
    return d.getFullYear() === y && d.getMonth() === ay - 1 && d.getDate() === g;
  }

  /* Önbellek: dize -> yerel gece yarısı damgası (geçersizse NaN). Çizimler
     aynı tarihleri binlerce kez çözer (ESP ofis notları ~25 ms). */
  const PARSE = new Map();
  function parse(s){
    if(s instanceof Date) return isFinite(s.getTime()) ? s : null;
    let t = typeof s === 'string' ? PARSE.get(s) : undefined;
    if(t === undefined){
      if(!isISO(s)) t = NaN;
      else { const p = String(s).slice(0, 10).split('-').map(Number); t = new Date(p[0], p[1] - 1, p[2]).getTime(); }
      if(typeof s === 'string'){ if(PARSE.size > 20000) PARSE.clear(); PARSE.set(s, t); }
    }
    return isNaN(t) ? null : new Date(t);
  }

  function today(){
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }
  function todayISO(){ return iso(today()); }

  /* Gün ekler. Date ya da ISO dize alır; çözülemezse BUGÜNDEN sayar
     (bozuk tek kayıt bütün ekranı kapatmasın). */
  function addDays(d, n){
    const x = parse(d) || today();
    const r = new Date(x.getFullYear(), x.getMonth(), x.getDate());
    r.setDate(r.getDate() + n);
    return r;
  }

  /* b - a gün; biri çözülemezse null. */
  function diffDays(a, b){
    const x = parse(a), y = parse(b);
    if(!x || !y) return null;
    return Math.round((y - x) / DAY_MS);
  }

  /* 0 = Pazartesi ... 6 = Pazar; çözülemezse null. */
  function weekdayIndex(d){ const x = parse(d); return x ? (x.getDay() + 6) % 7 : null; }

  /* Biçimler: çözülemeyen tarih boş metindir, «NaN Ocak» değil. */
  function fmtDate(d){ const x = parse(d); return x ? x.getDate()+' '+MONTHS[x.getMonth()]+' '+x.getFullYear() : ''; }
  function fmtShort(d){ const x = parse(d); return x ? x.getDate()+' '+MONTHS_SHORT[x.getMonth()] : ''; }
  function monthName(d){ const x = parse(d); return x ? MONTHS[x.getMonth()] : ''; }
  function monthKey(d){ const x = parse(d); return x ? x.getFullYear()+'-'+pad2(x.getMonth()+1) : ''; }

  /* Geçmiş gün sözü (King-Bench seviye 2): kayıt cümlesindeki «dün», «evvelsi gün», «3 gün önce», «geçen salı»,
     «pazartesi» → ISO; yoksa null. Yalnız GEÇMİŞ: rapor cümlesi içindir («yarın» burada okunmaz).
     Çıplak gün adı bugün dahil son 7 gün; «geçen» ile önceki takvim haftası. */
  const GUN_ADI = [['pazartesi', 0], ['salı', 1], ['çarşamba', 2], ['perşembe', 3], ['cumartesi', 5], ['cuma', 4], ['pazar', 6]];
  function gunSozu(metin, bugunISO){
    const t = ' ' + String(metin || '').toLocaleLowerCase('tr') + ' ';
    const bugun = bugunISO || todayISO();
    const geri = n => iso(addDays(bugun, -n));
    if(/[\s,](evvelsi gün|önceki gün|dünden önceki gün)/.test(t)) return geri(2);
    const n = /[\s,](\d{1,2}) gün önce/.exec(t);
    if(n) return Number(n[1]) <= 60 ? geri(Number(n[1])) : null;
    if(/[\s,]dün(?:kü|ün)?[\s,.!]/.test(t)) return geri(1);
    for(const [ad, i] of GUN_ADI){
      const m = new RegExp('[\\s,](geçen\\s+(?:hafta(?:nın)?\\s+)?)?' + ad + '(?:\\s+günü|\\s+akşamı|\\s+sabahı|[\'’]?[dt][ae]|[\'’]?(?:y|n)?[ıi])?[\\s,.!]').exec(t);
      if(!m) continue;
      const w = weekdayIndex(bugun);
      /* «geçen salı» = önceki takvim haftasının salısı (çarşamba günü «dün» değil, 8 gün önce). */
      return geri(m[1] ? w + 7 - i : ((w - i) + 7) % 7);
    }
    return null;
  }

  return Object.freeze({ MONTHS, MONTHS_SHORT, DAY_MS, pad2, iso, gunOf, isISO, parse, today, todayISO,
    addDays, diffDays, weekdayIndex, fmtDate, fmtShort, monthName, monthKey, gunSozu });
})();
