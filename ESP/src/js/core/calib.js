/* Kalibrasyon defteri — kullanıcının kendi yargısını ÖLÇER.

   Bir karar destek sistemi iki şekilde başarısız olur. Birincisi bilinir:
   yanlış hesaplar. İkincisi sinsidir: doğru hesaplar ama kullanıcının
   kendi yargısını köreltir. Her sayıyı sistemden bekleyen biri, sistem
   kapandığında hiçbir şey bilmiyordur. Bu, ölçmenin yan etkisidir ve
   ölçülmediği sürece görünmez.

   Buradaki cevap basit: SİSTEM SÖYLEMEDEN ÖNCE SEN SÖYLE.

   Kullanıcı bir sayıyı görmeden önce tahminini yazar; sistem gerçek değeri
   sonra açar ve ikisi arasındaki farkı BİRİKTİRİR. Zamanla ortaya bir şey
   çıkar: kişi kendi durumunu ne kadar biliyor? Bu, sistemin ürettiği
   herhangi bir metrikten daha değerlidir — çünkü sistem yokken de geçerlidir.

   Dört kural:

   1. TAHMİN KÖR OLMAK ZORUNDADIR. Gerçek değer ekranda dururken yazılan
      tahmin, tahmin değil kopyadır. Kayıt açılırken gerçek değer ÇÖZÜLMEZ;
      yalnızca kapanışta hesaplanır. Kör olmayan kayıt `blind:false` ile
      işaretlenir ve puana katılmaz.

   2. TAHMİN ETMEMEK BİR HATA DEĞİLDİR. Defter boşsa sistem "kalibrasyonun
      kötü" demez, "veri yok" der. Sıfır tahmin, sıfır isabet demek değildir.

   3. PUAN KİŞİYE DEĞİL, TAHMİNE VERİLİR. "Kendini tanımıyorsun" denmez;
      "son 12 tahminin ortalama sapması %22" denir. ESP.PEDAGOGIC sınırı
      burada da geçerlidir.

   4. AZ SAYIDA KAYIT HÜKÜM VERMEZ. Beşin altında kapanmış tahmin varsa
      puan hesaplanmaz. Üç tahminle kalibrasyon ölçmek, üç soruyla sınav
      yapmaktır. */

window.ESP = window.ESP || {};

ESP.Calib = (function(){
  const U = ESP.U, S = ESP.S;

  /* Puan için gereken en az kapanmış tahmin sayısı. */
  const ASGARI = 5;

  /* Puan penceresi: son bu kadar kapanmış tahmine bakılır. */
  const PENCERE = 20;

  /* Soru türleri. `kind` kaydın nasıl kapanacağını söyler.

       number   sayısal tahmin, sapma yüzdeyle ölçülür
       binary   olacak/olmayacak, olasılıkla (0–1) tahmin edilir

     `resolve` gerçek değeri HESAPLAYAN işlevin adıdır; kapanışta çağrılır.
     Burada değil, core/calib_sources.js'te değil — çağıran taraf verir.
     Böylece defter, neyi ölçtüğünden bağımsız kalır. */
  ESP.CALIB_KINDS = [
    { id:'retention', type:'number', unit:'%',
      label:'Kart retansiyonun', ask:'Son 30 günde kartlarının yüzde kaçını ilk denemede hatırladın?' },
    { id:'minutes', type:'number', unit:'dk',
      label:'Haftalık çalışma süren', ask:'Bu hafta toplam kaç dakika çalıştın?' },
    { id:'sessions', type:'number', unit:'oturum',
      label:'Haftalık oturum sayın', ask:'Bu hafta kaç oturum kaydettin?' },
    { id:'gate', type:'binary', unit:'',
      label:'Sıradaki kapı', ask:'Bu ayın sonunda sıradaki kapıyı geçmiş olacak mısın?' },
    { id:'readability', type:'number', unit:'puan',
      label:'Yazının okunabilirliği', ask:'Bu taslağın Ateşman puanı kaç çıkar?' },
  ];

  const KIND_BY_ID = ESP.CALIB_KINDS.reduce((m, k) => { m[k.id] = k; return m; }, {});

  function kindOf(id){ return KIND_BY_ID[id] || null; }

  function list(){ return (S.forecasts || []).slice(); }

  function open_(){ return list().filter(f => f.actual == null); }
  function settled(){
    return list().filter(f => f.actual != null && f.blind !== false)
      .sort((a, b) => (a.settledAt || '') < (b.settledAt || '') ? 1 : -1);
  }

  function norm(f){
    const o = f || {};
    const k = kindOf(o.kind);
    return {
      id:o.id || U.uid('f'),
      kind:k ? o.kind : 'minutes',
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

  /* ------------------------------------------------------------ kayıt */

  /* Tahmin aç. Gerçek değer BURADA hesaplanmaz — kasıtlı.

     `dueAt` tahmin ne zaman kapanabilir olacağını söyler; o tarihten önce
     kapanış reddedilir. "Bu hafta kaç dakika çalışacağım" sorusunun cevabı
     hafta bitmeden belli değildir; erken kapatmak tahmini kolaylaştırır. */
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

    const kayit = norm({ kind:kindId, guess:g, ref:o.ref || null,
      note:o.note, dueAt:o.dueAt || null, blind:o.blind !== false });

    S.forecasts = list().concat([kayit]);
    await ESP.Store.set('forecasts/' + kayit.id, kayit);
    return { ok:true, forecast:kayit };
  }

  /* Tahmini kapat: gerçek değer şimdi verilir.

     Çağıran gerçek değeri kural motorundan alır; defter kendi başına bir
     ölçü üretmez. Bu, "kural motoru otoritedir" kuralının defterdeki
     karşılığıdır. */
  async function settle(id, actual){
    const f = list().filter(x => x.id === id)[0];
    if(!f) return { ok:false, error:'Tahmin bulunamadı.' };
    if(f.actual != null) return { ok:false, error:'Bu tahmin zaten kapandı.' };

    const a = Number(actual);
    if(!isFinite(a)) return { ok:false, error:'Gerçek değer bir sayı olmalı.' };
    if(f.dueAt && U.todayISO() < f.dueAt){
      return { ok:false, error:'Bu tahmin ' + f.dueAt + ' tarihinden önce kapanmaz.',
        early:true };
    }

    f.actual = a;
    f.settledAt = new Date().toISOString();
    S.forecasts = list().map(x => x.id === id ? f : x);
    await ESP.Store.set('forecasts/' + f.id, f);
    return { ok:true, forecast:f, error_:error(f) };
  }

  async function remove(id){
    S.forecasts = list().filter(x => x.id !== id);
    await ESP.Store.remove('forecasts/' + id);
    return { ok:true };
  }

  /* ------------------------------------------------------------- puan */

  /* Tek bir tahminin hatası.

     Sayısal: |tahmin − gerçek| / max(gerçek, 1). Paydada gerçek değer
     durur; 10 dakikayı 20 tahmin etmek, 200'ü 210 tahmin etmekten çok
     daha büyük bir sapmadır.

     İkili: Brier — (olasılık − sonuç)². 0 mükemmel, 0.25 yazı-tura,
     1 tam ters. */
  function error(f){
    const k = kindOf(f.kind);
    if(!k || f.actual == null) return null;
    if(k.type === 'binary'){
      const sonuc = f.actual >= 0.5 ? 1 : 0;
      return { type:'brier', value:Math.pow(f.guess - sonuc, 2) };
    }
    const payda = Math.max(Math.abs(f.actual), 1);
    return { type:'ape', value:Math.abs(f.guess - f.actual) / payda };
  }

  /* Yanlılık: sürekli fazla mı tahmin ediyor, az mı?

     Ortalama işaretli sapma. Hatanın büyüklüğünden AYRI bir bilgidir:
     rastgele sapan biriyle sistemli olarak kendini abartan biri aynı
     ortalama hataya sahip olabilir ama farklı şeyler yapmaları gerekir. */
  function bias(kindId){
    const kayitlar = settled().filter(f => !kindId || f.kind === kindId)
      .filter(f => kindOf(f.kind) && kindOf(f.kind).type === 'number')
      .slice(0, PENCERE);
    if(kayitlar.length < ASGARI){
      return { cert:'missing', n:kayitlar.length, value:null,
        note:'Yanlılık için en az ' + ASGARI + ' kapanmış sayısal tahmin gerekir.' };
    }
    const toplam = kayitlar.reduce((a, f) => {
      const payda = Math.max(Math.abs(f.actual), 1);
      return a + (f.guess - f.actual) / payda;
    }, 0);
    const v = toplam / kayitlar.length;
    return { cert:'measured', n:kayitlar.length, value:v,
      direction:v > 0.05 ? 'over' : v < -0.05 ? 'under' : 'even',
      note:v > 0.05 ? 'Kendini olduğundan iyi tahmin etme eğilimindesin.'
        : v < -0.05 ? 'Kendini olduğundan kötü tahmin etme eğilimindesin.'
        : 'Sistemli bir yanlılık görünmüyor.' };
  }

  /* Kalibrasyon puanı: son PENCERE kapanmış tahminin ortalama hatası.

     İki tür bir arada ortalanmaz — yüzde sapma ile Brier aynı ölçek
     değildir. İkisi ayrı döner. */
  function score(){
    const hepsi = settled().slice(0, PENCERE);
    const sayisal = hepsi.filter(f => (kindOf(f.kind) || {}).type === 'number');
    const ikili = hepsi.filter(f => (kindOf(f.kind) || {}).type === 'binary');

    const out = { n:hepsi.length, open:open_().length, cert:'missing',
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
    /* Derece yalnızca sayısal sapmadan verilir ve KİŞİYE DEĞİL, tahminlere
       aittir. Eşikler açıkça seçilmiş sınırlardır, bir bulgu değil. */
    if(out.ape != null){
      out.grade = out.ape <= 0.10 ? 'keskin'
        : out.ape <= 0.25 ? 'makul'
        : out.ape <= 0.50 ? 'dağınık' : 'uzak';
      out.note = 'Son ' + sayisal.length + ' sayısal tahminin ortalama sapması %'
        + Math.round(out.ape * 100) + '.';
    } else {
      out.note = 'Son ' + ikili.length + ' ikili tahminin Brier puanı '
        + (out.brier == null ? '—' : out.brier.toFixed(2)) + ' (0 kusursuz, 0,25 yazı-tura).';
    }
    return out;
  }

  /* Kapanmaya hazır tahminler: vadesi gelmiş ama henüz kapanmamış. */
  function due(){
    const t = U.todayISO();
    return open_().filter(f => !f.dueAt || f.dueAt <= t);
  }

  async function load(){
    S.forecasts = ((await ESP.Store.list('forecasts')) || []).map(norm);
    return S.forecasts;
  }

  return {
    open, settle, remove, load, norm,
    list, settled, openList:open_, due, error, bias, score, kindOf,
    ASGARI, PENCERE,
  };
})();
