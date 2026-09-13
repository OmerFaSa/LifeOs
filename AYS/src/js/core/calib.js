/* Kalibrasyon defteri — adayın kendi yargısını ÖLÇER.

   Bir karar destek sistemi iki şekilde başarısız olur. Birincisi bilinir:
   yanlış hesaplar. İkincisi sinsidir: doğru hesaplar ama adayın kendi
   yargısını köreltir. Her şeyi sistemden bekleyen bir aday, sınav
   salonunda yalnızdır ve orada hiçbir ekran yoktur.

   Sınav hazırlığında bu, süs değil ASIL BECERİDİR. Kendi netini önceden
   kestirebilen aday, hangi testte zaman harcayacağını, hangi soruyu
   bırakacağını ve bir denemenin kötü mü yoksa zor mu olduğunu bilir.
   Kestiremeyen aday, her denemeden sonra bir sürprizle karşılaşır.

   BU DEFTERİN ÖLÇEMEDİĞİ ŞEY:

   Defter, «kendini tanıma»yı ölçmez. Ölçtüğü şey dardır ve dar olduğu
   söylenmelidir: KAYIT ALTINDAKİ BİRKAÇ TÜRDE, kör yazılmış tahminlerin
   aynı türdeki kayıtlı sayıya ne kadar yaklaştığı. Bunun dışında kalan
   her şey — neyi neden yaptığın, bir günün nasıl geçtiği, tahmin
   etmediğin alanlar — bu defterde görünmez. İyi bir kalibrasyon, iyi bir
   karar vermek demek değildir; tahmin edilen sayıyı tahmin edebilmek
   demektir. Bu bir üstbiliş SİNYALİDİR, bir özbilgi ÖLÇÜSÜ değil.

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
    { id:'exam-net', type:'number', unit:'net', err:'abs', bands:[3, 7, 14],
      label:'Deneme netin',
      ask:'Bu denemeyi okumadan önce: kaç net çıkardığını tahmin ediyorsun?' },
    { id:'test-net', type:'number', unit:'net', err:'abs', bands:[1.5, 3, 6],
      label:'Tek testin neti',
      ask:'Bu testte kaç net yaptığını tahmin ediyorsun?' },
    { id:'topic-test', type:'number', unit:'puan', err:'abs', bands:[5, 12, 25],
      label:'Konu testi yüzden',
      ask:'Bu konu testinden yüzde kaç çıkaracaksın?' },
    { id:'week-minutes', type:'number', unit:'dk', err:'ape',
      label:'Haftalık çalışma süren',
      ask:'Bu hafta bloklara kaç dakika gerçekleşen süre yazacaksın?' },
    { id:'week-plan', type:'binary', unit:'', err:'brier',
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

  /* ------------------------------------------------------- HATA AİLELERİ

     Tek bir hata ölçüsü her değişkene uymaz. İlk sürümde her sayısal
     tahmin aynı bağıl hatayla (APE) ölçülüyordu; bu, sıfıra yakın
     değerlerde anlamsızca büyür: 2 neti 6 tahmin etmek %200 «hata»
     sayılıyordu, 40 neti 44 tahmin etmek %10 — oysa ikisi de 4 netlik
     sapmadır.

     Bu yüzden artık her tahmin türü, hangi ölçüyle değerlendirileceğini
     kendisi söyler:

       ape   — oranı anlamlı, sıfırdan uzak, üstten sınırsız büyüklükler
               (dakika, gram, tahlil değeri): |t − g| / en az(|g|, 1)
       abs   — kendi biriminde sapma anlamlı, sıfıra yakın değer olağan
               (net, puan, saat, oturum): |t − g|, kendi bantlarıyla
       brier — olasılık tahmini: (p − sonuç)²

     `bands` bir bulgu DEĞİL bir SEÇİMDİR: bu yazılımın o birimde neyi
     «keskin», «makul», «dağınık» saydığı. Kaynağı sistem ayarıdır.
     Aileler birbiriyle ortalanmaz — dakikadaki yüzde ile netteki sapma
     aynı ölçek değildir. Karşılaştırılabilir olan tek şey BANTTIR. */
  const BANDS = ['keskin', 'makul', 'dağınık', 'uzak'];
  const APE_BANDS = [0.10, 0.25, 0.50];
  const BRIER_BANDS = [0.05, 0.15, 0.30];

  function errKind(k){
    if(!k) return null;
    return k.err || (k.type === 'binary' ? 'brier' : 'ape');
  }

  /* Bu türün «makul» bandı — yanlılığı ortak ölçeğe çevirmek için. */
  function makul(k){
    const tur = errKind(k);
    if(tur === 'abs') return (k.bands || [1, 1])[1];
    if(tur === 'brier') return BRIER_BANDS[1];
    return APE_BANDS[1];
  }

  function error(f){
    const k = kindOf(f.kind);
    if(!k || f.actual == null) return null;
    const tur = errKind(k);
    if(tur === 'brier'){
      const sonuc = f.actual >= 0.5 ? 1 : 0;
      return { type:'brier', value:Math.pow(f.guess - sonuc, 2), unit:'' };
    }
    if(tur === 'abs'){
      return { type:'abs', value:Math.abs(f.guess - f.actual), unit:k.unit || '' };
    }
    return { type:'ape', unit:'',
      value:Math.abs(f.guess - f.actual) / Math.max(Math.abs(f.actual), 1) };
  }

  /* Bir tahminin bandı (0 keskin … 3 uzak). Türü ne olursa olsun aynı
     dört basamak: aileler ortalanamaz ama bantlar karşılaştırılabilir. */
  function bandOf(f){
    const k = kindOf(f.kind);
    const e = error(f);
    if(!k || !e) return null;
    const esik = e.type === 'abs' ? (k.bands || [1, 2, 4])
      : e.type === 'brier' ? BRIER_BANDS : APE_BANDS;
    return e.value <= esik[0] ? 0 : e.value <= esik[1] ? 1
      : e.value <= esik[2] ? 2 : 3;
  }

  function ondalik(v){
    return (Math.round(v * 10) / 10).toFixed(1).replace('.', ',');
  }


    /* Yanlılık: sistemli olarak fazla mı tahmin ediyor, az mı?

     Hatanın büyüklüğünden AYRI bir bulgudur: rastgele sapan biriyle
     sistemli olarak kendini abartan biri aynı ortalama hataya sahip
     olabilir ama farklı şeyler yapmaları gerekir.

     Her kayıt KENDİ «makul» bandına bölünür; böylece farklı birimler
     tek ölçeğe gelir. Değerin birimi bu yüzden BANTTIR, yüzde değil. */
  function bias(kindId){
    const kayitlar = settled().filter(f => !kindId || f.kind === kindId)
      .filter(f => errKind(kindOf(f.kind)) !== 'brier')
      .slice(0, PENCERE);
    if(kayitlar.length < ASGARI){
      return { cert:'missing', n:kayitlar.length, value:null, unit:'bant',
        note:'Yanlılık için en az ' + ASGARI + ' kapanmış sayısal tahmin gerekir.' };
    }
    const v = kayitlar.reduce((a, f) => {
      const k = kindOf(f.kind);
      const d = f.guess - f.actual;
      const ham = errKind(k) === 'abs' ? d : d / Math.max(Math.abs(f.actual), 1);
      return a + ham / makul(k);
    }, 0) / kayitlar.length;
    const ESIK = 0.25;
    return { cert:'measured', n:kayitlar.length, value:v, unit:'bant',
      direction:v > ESIK ? 'over' : v < -ESIK ? 'under' : 'even',
      note:(v > ESIK ? 'Kendini olduğundan iyi tahmin etme eğilimindesin.'
        : v < -ESIK ? 'Kendini olduğundan kötü tahmin etme eğilimindesin.'
        : 'Sistemli bir yanlılık görünmüyor.')
        + (Math.abs(v) > ESIK
           ? ' Ortalama sapman, kendi «makul» bandının '
             + ondalik(Math.abs(v)) + ' katı kadar tek yöne kayıyor.'
           : '') };
  }


  /* Kalibrasyon puanı: son PENCERE kapanmış tahmin.

     Aileler ayrı ayrı raporlanır, tür bazında da ayrı: net ile dakika
     tek bir ortalamada toplanmaz. Genel derece bantların ORTANCASIDIR
     — tek bir kötü tahmin bütün defteri boyamaz. Eşikler açıkça
     seçilmiş sınırlardır ve puan KİŞİYE değil TAHMİNLERE aittir. */
  function score(){
    const hepsi = settled().slice(0, PENCERE);
    const out = { n:hepsi.length, open:openList().length, cert:'missing',
      ape:null, brier:null, abs:null, byKind:{}, band:null, grade:null,
      bias:bias() };

    if(hepsi.length < ASGARI){
      out.note = 'Kapanmış ' + hepsi.length + ' tahmin var; puan için '
        + ASGARI + ' gerekir. Az sayıda tahmin hüküm vermez.';
      return out;
    }
    out.cert = 'measured';

    const aile = {};
    hepsi.forEach(f => {
      const e = error(f);
      if(!e) return;
      (aile[e.type] = aile[e.type] || []).push(e.value);
      const k = kindOf(f.kind);
      const g = out.byKind[f.kind] || (out.byKind[f.kind] = {
        kind:f.kind, label:k.label, unit:e.unit, type:e.type,
        n:0, total:0, mean:null });
      g.n++; g.total += e.value; g.mean = g.total / g.n;
    });
    const ort = a => a.reduce((x, y) => x + y, 0) / a.length;
    if(aile.ape) out.ape = ort(aile.ape);
    if(aile.brier) out.brier = ort(aile.brier);
    if(aile.abs) out.abs = { n:aile.abs.length };

    const bantlar = hepsi.map(bandOf).filter(b => b != null).sort((a, b) => a - b);
    if(bantlar.length){
      out.band = bantlar[Math.floor((bantlar.length - 1) / 2)];
      out.grade = BANDS[out.band];
    }

    const parca = Object.keys(out.byKind).map(id => {
      const g = out.byKind[id];
      return g.label + ': ' + (g.type === 'ape'
        ? '%' + Math.round(g.mean * 100) + ' sapma'
        : g.type === 'brier'
        ? 'Brier ' + ondalik(g.mean)
        : ondalik(g.mean) + (g.unit ? ' ' + g.unit : '') + ' sapma');
    });
    out.note = 'Son ' + hepsi.length + ' kapanmış tahmin — ' + parca.join(' · ')
      + '. Ortanca bant: ' + (out.grade || '—') + '. Farklı birimler tek '
      + 'ortalamada toplanmaz; karşılaştırılan şey banttır.';
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
    error, bandOf, errKind, bias, score, kindOf, forExam, ASGARI, PENCERE };
})();
