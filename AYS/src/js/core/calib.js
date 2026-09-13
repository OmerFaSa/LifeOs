/* Kalibrasyon defteri — adayın kendi yargısını ÖLÇER.

   Bir karar destek sistemi iki şekilde başarısız olur. Birincisi bilinir:
   yanlış hesaplar. İkincisi sinsidir: doğru hesaplar ama adayın kendi
   yargısını köreltir. Her şeyi sistemden bekleyen bir aday, sınav
   salonunda yalnızdır ve orada hiçbir ekran yoktur.

   Sınav hazırlığında bu, süs değil ASIL BECERİDİR. Kendi netini önceden
   kestirebilen aday, hangi testte zaman harcayacağını, hangi soruyu
   bırakacağını ve bir denemenin kötü mü yoksa zor mu olduğunu bilir.
   Kestiremeyen aday, her denemeden sonra bir sürprizle karşılaşır.

   Dört kural:

   1. TAHMİN KÖR OLMAK ZORUNDADIR. Net ekranda dururken yazılan tahmin,
      tahmin değil kopyadır. Kayıt açılırken gerçek değer ÇÖZÜLMEZ.

   2. TAHMİN ETMEMEK HATA DEĞİLDİR. Defter boşsa "kalibrasyonun kötü"
      denmez, "veri yok" denir.

   3. PUAN KİŞİYE DEĞİL, TAHMİNE VERİLİR. "Kendini tanımıyorsun" denmez;
      "son 12 tahminin ortalama sapması %18" denir.

   4. BEŞİN ALTINDA KAYIT HÜKÜM VERMEZ. */

window.R = window.R || {};

R.Calib = (function(){
  const U = R.U, S = R.S;

  const ASGARI = 5;
  const PENCERE = 20;

  R.CALIB_KINDS = [
    { id:'exam-net', type:'number', unit:'net',
      label:'Deneme netin',
      ask:'Bu denemeyi okumadan önce: kaç net çıkardığını tahmin ediyorsun?' },
    { id:'test-net', type:'number', unit:'net',
      label:'Tek testin neti',
      ask:'Bu testte kaç net yaptığını tahmin ediyorsun?' },
    { id:'topic-test', type:'number', unit:'%',
      label:'Konu testi yüzden',
      ask:'Bu konu testinden yüzde kaç çıkaracaksın?' },
    { id:'week-minutes', type:'number', unit:'dk',
      label:'Haftalık çalışma süren',
      ask:'Bu hafta bloklara kaç dakika gerçekleşen süre yazacaksın?' },
    { id:'week-plan', type:'binary', unit:'',
      label:'Hafta planı',
      ask:'Bu haftanın planını tamamlama olasılığın nedir?' },
  ];

  const KIND_BY_ID = R.CALIB_KINDS.reduce((m, k) => { m[k.id] = k; return m; }, {});
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
      kind:kindOf(o.kind) ? o.kind : 'exam-net',
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
    await R.Store.set('forecasts/' + kayit.id, kayit);
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
    await R.Store.set('forecasts/' + f.id, f);
    return { ok:true, forecast:f };
  }

  async function remove(id){
    S.forecasts = list().filter(x => x.id !== id);
    await R.Store.remove('forecasts/' + id);
    return { ok:true };
  }

  /* Tek tahminin hatası.

     Net tahmininde payda GERÇEK NETTİR ama en az 1 alınır: 2 neti 6
     tahmin etmek, 60 neti 64 tahmin etmekten çok daha büyük bir sapmadır
     ve bu fark korunmalıdır. */
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
        ? 'Netini olduğundan yüksek tahmin etme eğilimindesin. Sınav günü '
          + 'sürpriz, hazırlıkta iyimserlik anlamına gelir.'
        : v < -0.05
        ? 'Netini olduğundan düşük tahmin etme eğilimindesin. Bu, gereksiz '
          + 'kaygı ya da fazla temkinli soru seçimi olarak dönebilir.'
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

  /* Bir denemeye bağlı açık tahmin var mı? Deneme okunurken sorulur. */
  function forExam(examId){
    return openList().filter(f => f.kind === 'exam-net' && f.ref === examId)[0] || null;
  }

  async function load(){
    S.forecasts = ((await R.Store.list('forecasts')) || []).map(norm);
    return S.forecasts;
  }

  return { open, settle, remove, load, norm, list, settled, openList, due,
    error, bias, score, kindOf, forExam, ASGARI, PENCERE };
})();
