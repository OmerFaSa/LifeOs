/* Kalibrasyon defteri — kullanicinin kendi bedenini ne kadar tanidigini OLCER.

   AYS ve ESP'deki defterin SPI'ye uyarlanmasi. Burada degeri daha da
   buyuk, cunku saglik takibinin en sinsi yan etkisi budur:

     Her sayiyi cihazdan bekleyen biri, cihaz yokken kendini okuyamaz.

   Yorgun olup olmadigini bilmek icin HRV'ye bakmak zorunda kalan biri,
   aslinda bir beceri KAYBETMISTIR. Bu defter o beceriyi olcer ve
   olcerek korur: olcumu gormeden once tahmin edersin, sistem gercek
   degeri sonra acar, fark birikir.

   Saglikta ayrica ikinci bir faydasi var: SISTEMATIK YANLILIK tespiti.
   Kendini surekli olduğundan iyi hisseden biri ile kotu hisseden biri
   ayni ortalama hataya sahip olabilir ama bambaska seyler yapmalidir.

   Dort kural degismez:

   1. TAHMIN KOR OLMAK ZORUNDADIR. Deger ekranda dururken yazilan tahmin,
      tahmin degil kopyadir. Tahlil sonucunu okuduktan sonra girilen sayi
      `blind:false` isaretlenir ve puana katilmaz.

   2. TAHMIN ETMEMEK HATA DEGILDIR. Defter bossa "kalibrasyonun kotu"
      denmez, "veri yok" denir.

   3. PUAN KISIYE DEGIL, TAHMINE VERILIR. Klinik sinir (SP.CLINICAL)
      burada da gecerlidir: bu bir yetenek ya da saglik yargisi degildir.

   4. BESIN ALTINDA KAYIT HUKUM VERMEZ. */

window.SP = window.SP || {};

SP.Calib = (function(){
  const U = SP.U, S = SP.S;

  const ASGARI = 5;
  const PENCERE = 20;

  SP.CALIB_KINDS = [
    { id:'lab-value', type:'number', unit:'',
      label:'Tahlil değerin',
      ask:'Sonucu açmadan önce: bu değer kaç çıkacak?' },
    { id:'weight', type:'number', unit:'kg',
      label:'Tartı',
      ask:'Tartıya çıkmadan önce: kaç geleceğini tahmin ediyorsun?' },
    { id:'readiness', type:'number', unit:'puan',
      label:'Toparlanma skorun',
      ask:'Ölçümleri girmeden önce: bugünkü toparlanman 100 üzerinden kaç?' },
    { id:'sleep', type:'number', unit:'saat',
      label:'Uyku süren',
      ask:'Kaydına bakmadan: dün gece kaç saat uyudun?' },
    { id:'protein', type:'number', unit:'g',
      label:'Günlük proteinin',
      ask:'Hesabı görmeden: bugün kaç gram protein aldın?' },
    { id:'flag', type:'binary', unit:'',
      label:'Kırmızı bayrak',
      ask:'Bu tahlilde kırmızı bayrak çıkma olasılığı nedir?' },
  ];

  const KIND_BY_ID = SP.CALIB_KINDS.reduce((m, k) => { m[k.id] = k; return m; }, {});
  function kindOf(id){ return KIND_BY_ID[id] || null; }

  function list(){ return (S.forecasts || []).slice(); }
  function openList(){ return list().filter(f => f.actual == null); }
  function settled(){
    return list().filter(f => f.actual != null && f.blind !== false)
      .sort((a, b) => (a.settledAt || '') < (b.settledAt || '') ? 1 : -1);
  }

  function norm(f){
    const o = f || {};
    return {
      id:o.id || U.uid('f'),
      kind:kindOf(o.kind) ? o.kind : 'weight',
      ref:o.ref || null,
      guess:Number(o.guess),
      actual:(o.actual == null || !isFinite(Number(o.actual))) ? null : Number(o.actual),
      blind:o.blind !== false,
      note:String(o.note || ''),
      at:o.at || new Date().toISOString(),
      dueAt:o.dueAt || null,
      settledAt:o.settledAt || null,
    };
  }

  async function open(kindId, guess, opts){
    const o = opts || {};
    const k = kindOf(kindId);
    if(!k) return { ok:false, error:'Bilinmeyen tahmin türü.' };
    const g = Number(guess);
    if(!isFinite(g)) return { ok:false, error:'Tahmin bir sayı olmalı.' };
    if(k.type === 'binary' && (g < 0 || g > 1)){
      return { ok:false, error:'Olasılık 0 ile 1 arasında olmalı.' };
    }
    if(k.type === 'number' && g < 0){
      return { ok:false, error:'Tahmin negatif olamaz.' };
    }
    const kayit = norm({ kind:kindId, guess:g, ref:o.ref || null, note:o.note,
      dueAt:o.dueAt || null, blind:o.blind !== false });
    S.forecasts = list().concat([kayit]);
    await SP.Store.set('forecasts/' + kayit.id, kayit);
    return { ok:true, forecast:kayit };
  }

  async function settle(id, actual){
    const f = list().filter(x => x.id === id)[0];
    if(!f) return { ok:false, error:'Tahmin bulunamadı.' };
    if(f.actual != null) return { ok:false, error:'Bu tahmin zaten kapandı.' };
    const a = Number(actual);
    if(!isFinite(a)) return { ok:false, error:'Gerçek değer bir sayı olmalı.' };
    if(f.dueAt && U.todayISO() < f.dueAt){
      return { ok:false, early:true,
        error:'Bu tahmin ' + f.dueAt + ' tarihinden önce kapanmaz.' };
    }
    f.actual = a;
    f.settledAt = new Date().toISOString();
    S.forecasts = list().map(x => x.id === id ? f : x);
    await SP.Store.set('forecasts/' + f.id, f);
    return { ok:true, forecast:f };
  }

  async function remove(id){
    S.forecasts = list().filter(x => x.id !== id);
    await SP.Store.remove('forecasts/' + id);
    return { ok:true };
  }

  /* Tek tahminin hatası.

     Payda GERÇEK DEĞERDİR ama en az 1 alınır: ferritin 10'u 20 tahmin
     etmek, 200'ü 210 tahmin etmekten çok daha büyük bir sapmadır ve bu
     fark korunmalıdır. */
  function error(f){
    const k = kindOf(f.kind);
    if(!k || f.actual == null) return null;
    if(k.type === 'binary'){
      const sonuc = f.actual >= 0.5 ? 1 : 0;
      return { type:'brier', value:Math.pow(f.guess - sonuc, 2) };
    }
    return { type:'ape',
      value:Math.abs(f.guess - f.actual) / Math.max(Math.abs(f.actual), 1) };
  }

  /* Yanlılık: sistemli olarak fazla mı tahmin ediyor, az mı?

     Hatanın büyüklüğünden AYRI bir bulgudur. Kendini sürekli abartan aday
     ile rastgele sapan aday aynı ortalama hataya sahip olabilir ama
     farklı şeyler yapmaları gerekir. */
  function bias(kindId){
    const kayitlar = settled().filter(f => !kindId || f.kind === kindId)
      .filter(f => (kindOf(f.kind) || {}).type === 'number')
      .slice(0, PENCERE);
    if(kayitlar.length < ASGARI){
      return { cert:'missing', n:kayitlar.length, value:null,
        note:'Yanlılık için en az ' + ASGARI + ' kapanmış sayısal tahmin gerekir.' };
    }
    const v = kayitlar.reduce((a, f) =>
      a + (f.guess - f.actual) / Math.max(Math.abs(f.actual), 1), 0) / kayitlar.length;
    return { cert:'measured', n:kayitlar.length, value:v,
      direction:v > 0.05 ? 'over' : v < -0.05 ? 'under' : 'even',
      note:v > 0.05
        ? 'Değerlerini olduğundan yüksek tahmin etme eğilimindesin. Bu bir '
          + 'sağlık yargısı değil, bir okuma alışkanlığı bulgusudur.'
        : v < -0.05
        ? 'Değerlerini olduğundan düşük tahmin etme eğilimindesin. Kendini '
          + 'olduğundan kötü okumak da bir sapmadır.'
        : 'Sistemli bir yanlılık görünmüyor.' };
  }

  function score(){
    const hepsi = settled().slice(0, PENCERE);
    const sayisal = hepsi.filter(f => (kindOf(f.kind) || {}).type === 'number');
    const ikili = hepsi.filter(f => (kindOf(f.kind) || {}).type === 'binary');
    const out = { n:hepsi.length, open:openList().length, cert:'missing',
      ape:null, brier:null, grade:null, bias:bias() };

    if(hepsi.length < ASGARI){
      out.note = 'Kapanmış ' + hepsi.length + ' tahmin var; puan için '
        + ASGARI + ' gerekir. Az sayıda tahmin hüküm vermez.';
      return out;
    }
    out.cert = 'measured';
    if(sayisal.length){
      out.ape = sayisal.reduce((a, f) => a + error(f).value, 0) / sayisal.length;
    }
    if(ikili.length){
      out.brier = ikili.reduce((a, f) => a + error(f).value, 0) / ikili.length;
    }
    if(out.ape != null){
      out.grade = out.ape <= 0.10 ? 'keskin'
        : out.ape <= 0.25 ? 'makul'
        : out.ape <= 0.50 ? 'dağınık' : 'uzak';
      out.note = 'Son ' + sayisal.length + ' sayısal tahminin ortalama sapması %'
        + Math.round(out.ape * 100) + '.';
    } else {
      out.note = 'Son ' + ikili.length + ' ikili tahminin Brier puanı '
        + (out.brier == null ? '—' : out.brier.toFixed(2))
        + ' (0 kusursuz, 0,25 yazı-tura).';
    }
    return out;
  }

  function due(){
    const t = U.todayISO();
    return openList().filter(f => !f.dueAt || f.dueAt <= t);
  }

  /* Bir tahlile bağlı açık tahmin var mı? Sonuç açılırken sorulur. */
  function forLab(labId){
    return openList().filter(f => f.kind === 'lab-value' && f.ref === labId)[0] || null;
  }

  async function load(){
    S.forecasts = ((await SP.Store.list('forecasts')) || []).map(norm);
    return S.forecasts;
  }

  return { open, settle, remove, load, norm, list, settled, openList, due,
    error, bias, score, kindOf, forLab, ASGARI, PENCERE };
})();
