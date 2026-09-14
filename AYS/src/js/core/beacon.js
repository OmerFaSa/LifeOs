/* HKM işareti (beacon) — «varsa gönder», asla bekletme.

   AYS HKM'nin var olduğunu BİLMEZ. Bu dosya o kuralın tek istisnası
   ve istisnanın sınırları burada yazılı:

   1. HİÇBİR ÇİZİMDE ÇALIŞMAZ. Gönderim yalnızca kullanıcının açıkça
      istediği anda ya da gün kapanışında tetiklenir; bir ekranın açılması
      ağ trafiği doğurmaz.

   2. HİÇBİR KAYDI BLOKLAMAZ. Gönderim ateşle-ve-unut'tur; hata yakalanır
      ve yutulur. HKM kapalıyken, yavaşken ya da yokken AYS arayüzünde
      bekleme, hata ya da bozulma OLMAZ.

   3. ETİKETSİZ SAYI GÖNDERİLMEZ. Her metrik alanı dört kesinlik
      etiketinden birini taşır. Sözleşmeyi bu taraf da denetler: HKM'nin
      422 döndürmesini beklemek yerine, hatalı gövde hiç yola çıkmaz.

   4. VARSAYILAN KAPALIDIR. Açmak bilinçli bir karardır; adres, jeton ve
      gönderilen alanların tamamı kullanıcıya gösterilir.

   5. AÇIK METİN JETON AĞA ÇIKMAZ. Yerel olmayan bir adrese düz `http` ile
      gönderim reddedilir — jeton ağda açık gider. Yerel adres (127.0.0.1,
      localhost) ya da `https` şarttır.

   Bu katman bir senkronizasyon değil bir İŞARETTİR: tek yön, en iyi çaba,
   geri dönüşü yok sayılabilir. AYS'in verisi AYS'te kalır; HKM'ye giden
   şey günün ÖZETİDİR. */

window.R = window.R || {};

R.Beacon = (function(){
  const U = R.U;
  const S = R.S;

  const MODULE = 'ays';
  const CONTRACT = 1;              // gövde sürümü — HKM tarafıyla ortak
  const ASGARI_ARA_DK = 15;        // aynı gün içinde en sık bu kadar

  const VARSAYILAN = {
    enabled:false,
    url:'http://127.0.0.1:4200',
    token:'',
    intervalMinutes:60,
    level:'ozet',            // ozet | gelismis
    lastAt:null,                   // son DENEME
    lastOkAt:null,                 // son BAŞARILI gönderim
    lastStatus:null,               // 202 | 422 | 401 | 0 (ulaşılamadı)
    lastNote:'',
  };

  /* Yüklenmeden önce her şey KAPALIDIR. Bir ayar dosyası okunamadığında
     «varsayılan açık» davranmak, kullanıcının seçmediği bir şeyi yapmaktır. */
  let AYAR = null;

  function settings(){ return Object.assign({}, VARSAYILAN, AYAR || {}); }

  async function load(){
    try{ AYAR = (await R.Store.get('hkm')) || {}; }
    catch(e){ AYAR = {}; }
    return settings();
  }

  async function save(patch){
    AYAR = Object.assign({}, settings(), patch || {});
    await R.Store.set('hkm', AYAR);
    return settings();
  }


  /* --------------------------------------------------------- kapsam seviyesi

     Ilk surum gunde birkac sayi goruyordu; bu, «bu haftayi analiz et» gibi
     sorulari cevaplanamaz kiliyordu. Cozum gonderimi genisletmek ama
     GENISLIGI KULLANICININ SECMESI:

       ozet      — yuk kararini etkileyen cekirdek olcumler (VARSAYILAN)
       gelismis  — bolum bazinda ilerleme de gider

     Iki seviyede de giden sey SAYIDIR: icerik hicbir seviyede gitmez.
     Seviye degistirmek yeni bir izin ister gibi davranir: ne gonderilecegi
     yine satir satir gosterilir. */
  const LEVELS = [
    { id:'ozet', label:'Özet',
      note:'Yalnız yük kararını etkileyen çekirdek ölçümler.' },
    { id:'gelismis', label:'Gelişmiş',
      note:'Bölüm bazında ilerleme de gider — hâlâ yalnız sayı.' },
  ];

  function levelOf(){
    const id = settings().level;
    return LEVELS.some(function(l){ return l.id === id; }) ? id : 'ozet';
  }

  /* Gecmis bir gun icin GERIYE DONUK hesaplanamayan alanlar gonderilmez:
     bugunku degeri dunun tarihiyle yollamak, ambara sahte bir olcum
     yazmaktir. */
  function gecmisMi(dateISO){ return String(dateISO) !== U.todayISO(); }

  /* ----------------------------------------------------------- sözleşme

     Yerel kesinlik sözlüğü ile HKM'ninki birebir aynı DEĞİL: bu depoda
     hesaplanmış değerler yer yer «derived» diye etiketlenir. Eşleme
     AÇIK yazılır; bilinmeyen bir etiket sessizce «measured» sayılmaz,
     gövdeyi reddeder. */
  const CERT_MAP = {
    measured:'measured',
    estimated:'estimated',
    computed:'computed',
    derived:'computed',
    missing:'missing',
  };
  const CERTS = ['measured', 'estimated', 'computed', 'missing'];

  function metric(value, cert){
    const c = CERT_MAP[cert] || null;
    if(!c) return { value:null, cert:null, raw:cert };
    if(c === 'missing' || value == null || !isFinite(Number(value))){
      return { value:null, cert:'missing' };
    }
    return { value:Number(value), cert:c };
  }

  /* Eksik veri SIFIR DEĞİLDİR: değeri olmayan alan «missing» gider,
     0 değil. Bu kural gövdenin tek satırında bile bozulmamalı. */
  function contract(body){
    const hata = [];
    if(!body || typeof body !== 'object') return ['gövde yok'];
    if(body.module !== MODULE) hata.push('modül adı yanlış');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(body.date || ''))) hata.push('tarih ISO değil');
    const m = body.metrics;
    if(!m || typeof m !== 'object' || !Object.keys(m).length){
      hata.push('metrik yok');
      return hata;
    }
    Object.keys(m).forEach(function(k){
      const x = m[k];
      if(!x || typeof x !== 'object' || !x.cert){ hata.push(k + ': etiket yok'); return; }
      if(CERTS.indexOf(x.cert) < 0){ hata.push(k + ': geçersiz etiket ' + x.cert); return; }
      if(x.cert !== 'missing' && typeof x.value !== 'number'){
        hata.push(k + ': ' + x.cert + ' etiketli alanda sayı yok');
      }
      if(x.cert === 'missing' && x.value != null){
        hata.push(k + ': veri yok etiketiyle değer gönderilemez');
      }
    });
    return hata;
  }

  /* ------------------------------------------------------------ toplama

     Gönderilen şey GÜNÜN ÖZETİDİR: soru metni, hata defteri kaydı, deneme
     ayrıntısı gitmez. HKM'ye giden en küçük veri kümesi, onun işini
     görebilecek kadarıdır. */
  function collect(dateISO){
    const d = dateISO || U.todayISO();
    const out = {};
    const gun = (S.days || {})[d];
    const bloklar = (gun && gun.blocks) || [];

    const soru = bloklar.filter(function(b){ return b.actualQ != null; });
    out.questions = soru.length
      ? metric(soru.reduce(function(a, b){ return a + Number(b.actualQ || 0); }, 0), 'measured')
      : metric(null, 'missing');

    const sure = bloklar.filter(function(b){ return b.actualMin != null; });
    out.study_minutes = sure.length
      ? metric(sure.reduce(function(a, b){ return a + Number(b.actualMin || 0); }, 0), 'measured')
      : metric(null, 'missing');

    /* Net: TEK deneme değil MEDYAN. Tek denemeyle konuşmak bu depoda
       yasak değil, yanlış: bir kötü deneme ortalamayı bozar.

       Medyan O GÜNE KADARKI denemelerden hesaplanır. Calc.medianTrend()
       bütün denemeleri kullanır; geçmiş bir günü onunla göndermek, o güne
       henüz girilmemiş bir denemeyi o günün ölçümü gibi yazmak olurdu. */
    const netler = (S.exams || [])
      .filter(function(e){ return e.family === 'TYT' && e.kind === 'full'
        && String(e.date) <= d; })
      .sort(function(a, b){ return String(a.date).localeCompare(String(b.date)); })
      .map(R.Model.examNet);
    out.mock_net = netler.length >= 3
      ? metric(ortanca(netler.slice(-3)), 'computed') : metric(null, 'missing');
    out.mock_net_baseline = netler.length >= 6
      ? metric(ortanca(netler.slice(-6, -3)), 'computed') : metric(null, 'missing');

    /* Sınava kalan gün her tarih için hesaplanabilir: sabit bir takvim. */
    const kalan = U.diffDays(d, R.PLAN.examTytISO);
    out.exam_days_left = isFinite(kalan) ? metric(kalan, 'computed')
      : metric(null, 'missing');

    if(levelOf() === 'gelismis') Object.assign(out, genis(d, gun, bloklar));
    return out;
  }

  function ortanca(xs){
    const a = xs.slice().sort(function(x, y){ return x - y; });
    const n = a.length;
    if(!n) return null;
    return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
  }

  /* Gelişmiş kapsam — bölüm bazında ilerleme. Yine yalnız SAYI: konu adı,
     soru metni ve hata defteri kaydı burada da gitmez. */
  function genis(d, gun, bloklar){
    const out = {};

    if(gun){
      out.plan_blocks = metric(bloklar.length, 'measured');
      out.plan_done = metric(bloklar.filter(function(b){
        return b.status === 'done'; }).length, 'measured');
      out.paragraph_done = metric(Number(gun.paragraphActual) || 0, 'measured');
      out.problem_done = metric(Number(gun.problemActual) || 0, 'measured');
      const dogru = bloklar.filter(function(b){ return b.correctQ != null; });
      out.correct_questions = dogru.length
        ? metric(dogru.reduce(function(a, b){ return a + Number(b.correctQ || 0); }, 0),
            'measured')
        : metric(null, 'missing');
    }

    out.exam_count = metric((S.exams || []).filter(function(e){
      return String(e.date) <= d; }).length, 'computed');

    /* Buradan sonrası BUGÜNÜN durumundan türetilir; geçmiş bir gün için
       gönderilmez — dünkü tarihle bugünkü kart borcunu yollamak, ambara
       sahte bir ölçüm yazmaktır. */
    if(gecmisMi(d)) return out;

    out.cards_total = metric((S.cards || []).length, 'measured');
    out.cards_due = metric((S.cards || []).filter(function(c){
      return c.dueAt && c.dueAt <= d; }).length, 'computed');
    out.errors_open = metric((S.errors || []).filter(function(e){
      return !e.closedAt; }).length, 'computed');
    return out;
  }


  function payload(dateISO){
    const d = dateISO || U.todayISO();
    return { module:MODULE, date:d, version:CONTRACT, metrics:collect(d) };
  }

  const LABELS = { measured:'ölçüldü', estimated:'tahmin',
    computed:'hesaplandı', missing:'veri yok' };

  /* Kullanıcı ne gönderildiğini GÖRMEDEN açmamalı. */
  function preview(dateISO){
    const p = payload(dateISO);
    const satirlar = Object.keys(p.metrics).map(function(k){
      const m = p.metrics[k];
      return { key:k, value:m.value, cert:m.cert,
        label:LABELS[m.cert] || m.cert };
    });
    return { payload:p, rows:satirlar, errors:contract(p) };
  }


  /* ------------------------------------------------------------- esleme

     Jetonu elle yapistirmak, HKM'nin hic acilmamasinin en olasi sebebiydi.
     Esleme, jetonu gevsetmeden bu surtunmeyi kaldirir: HKM yuzunde iki
     dakikalik bir pencere acilir, bu dugme jetonu dogrudan alir ve yalniz
     bu cihazda saklar. Pencere kapaliysa hicbir sey olmaz — ve bu bir
     hata degil, dogru davranistir. */
  async function pair(url){
    const adres = String(url || settings().url || '').replace(/\/$/, '');
    if(!urlOk(adres)){
      return { ok:false, note:'Yerel olmayan bir adresle eşleme yapılmaz.' };
    }
    let res;
    try{
      res = await fetch(adres + '/api/pair', { method:'POST' });
    }catch(e){
      return { ok:false, note:'HKM\'ye ulaşılamadı. Daemon çalışıyor mu?' };
    }
    let govde = null;
    try{ govde = await res.json(); }catch(e){ govde = null; }
    if(res.status !== 200 || !govde || !govde.token){
      return { ok:false, status:res.status,
        note:(govde && govde.note) || 'Eşleme penceresi kapalı. HKM yüzünde '
           + '«Cihazları bağla» dedikten sonra iki dakika içinde dene.' };
    }
    await save({ url:adres, token:govde.token, enabled:true });
    return { ok:true, note:'Bağlandı. İşaret açıldı; ne gönderildiği aşağıda yazıyor.' };
  }

  /* ------------------------------------------------------------- gönderim */

  function urlOk(url){
    const s = String(url || '');
    if(/^https:\/\//i.test(s)) return true;
    return /^http:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?(\/|$)/i.test(s);
  }

  /* Kısıt bir hız sınırı değil, bir GÜRÜLTÜ sınırıdır: aynı günün aynı
     özeti dakikada bir gönderilirse HKM'nin ambarı bilgi değil tekrar
     biriktirir. */
  function due(nowMs){
    const a = settings();
    if(!a.lastAt) return true;
    const ara = Math.max(ASGARI_ARA_DK, Number(a.intervalMinutes) || 60);
    const fark = (nowMs || Date.now()) - Date.parse(a.lastAt);
    return !(fark >= 0 && fark < ara * 60000);
  }

  /* Tek giriş noktası. HİÇBİR KOŞULDA fırlatmaz: çağıran taraf bir
     arayüz akışının ortasındadır ve orada bir ağ hatası, kaydı kaybetmek
     için sebep değildir. */
  async function send(opts){
    const o = opts || {};
    const a = settings();
    if(!a.enabled && !o.force) return { ok:false, reason:'off', note:'HKM işareti kapalı.' };
    if(!a.token) return { ok:false, reason:'no-token', note:'Jeton girilmemiş.' };
    if(!urlOk(a.url)){
      return { ok:false, reason:'unsafe-url',
        note:'Yerel olmayan bir adrese düz http ile gönderim yapılmaz: jeton '
           + 'ağda açık gider. https ya da yerel adres gerekir.' };
    }
    if(!o.force && !due(Date.now())){
      return { ok:false, reason:'throttled', note:'Son gönderimin üzerinden yeterli süre geçmedi.' };
    }
    const body = payload(o.date);
    const hata = contract(body);
    if(hata.length){
      await save({ lastAt:new Date().toISOString(), lastStatus:0,
        lastNote:'Gövde sözleşmeyi geçmedi: ' + hata[0] });
      return { ok:false, reason:'contract', errors:hata,
        note:'Etiketsiz ya da bozuk alan var; gövde yola çıkmadı.' };
    }
    let durum = 0, not = '';
    try{
      const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      const zaman = ctrl ? setTimeout(function(){ ctrl.abort(); }, 4000) : null;
      const res = await fetch(String(a.url).replace(/\/$/, '') + '/api/sync/' + MODULE, {
        method:'POST',
        headers:{ 'Content-Type':'application/json',
          'Authorization':'Bearer ' + a.token },
        body:JSON.stringify(body),
        signal:ctrl ? ctrl.signal : undefined,
      });
      if(zaman) clearTimeout(zaman);
      durum = res.status;
      not = durum === 202 ? 'Gönderildi.'
        : durum === 422 ? 'HKM gövdeyi reddetti (etiket ya da biçim).'
        : durum === 401 ? 'Jeton kabul edilmedi.'
        : 'Beklenmeyen yanıt: ' + durum;
    }catch(e){
      durum = 0;
      not = 'HKM\'ye ulaşılamadı. Bu bir hata değil bir DURUMDUR: HKM '
          + 'isteğe bağlıdır ve kapalıyken ' + MODULE.toUpperCase() + ' olduğu gibi çalışır.';
    }
    const simdi = new Date().toISOString();
    await save(Object.assign({ lastAt:simdi, lastStatus:durum, lastNote:not },
      durum === 202 ? { lastOkAt:simdi } : {}));
    return { ok:durum === 202, status:durum, note:not, payload:body };
  }


  /* ------------------------------------------------------------- geçmiş

     Capraz bulgu ve yon tahlili GECMIS ister: bugunden itibaren biriken bir
     ambar ilk iki ay hicbir sey soyleyemez. «Gecmisi gonder» o boslugu
     kapatir — ama yalnizca geriye donuk hesaplanabilen alanlarla. */
  async function backfill(days, onProgress){
    const a = settings();
    if(!a.enabled) return { ok:false, reason:'off', sent:0 };
    if(!a.token) return { ok:false, reason:'no-token', sent:0 };
    if(!urlOk(a.url)) return { ok:false, reason:'unsafe-url', sent:0 };
    const n = Math.max(1, Math.min(Number(days) || 30, 180));
    const bugun = U.todayISO();
    let gonderilen = 0, bos = 0, hata = null;
    for(let i = n - 1; i >= 0; i--){
      const t = U.iso(U.addDays(U.parse(bugun), -i));
      const govde = payload(t);
      /* Bir gunun gonderilmesi icin en az bir OLCULMUS alan gerekir.
         «Hesaplandi» yetmez: sinava kalan gun her tarih icin hesaplanabilir
         ve yalniz onu tasiyan bir govde, kullanicinin o gun bir sey yaptigi
         izlenimini birakir. Ambarda «gorulen gun» sayisini boyle sismek,
         sessiz bir yalandir. */
      const dolu = Object.keys(govde.metrics).some(function(k){
        return govde.metrics[k].cert === 'measured';
      });
      if(!dolu || contract(govde).length){ bos++; continue; }
      let durum = 0;
      try{
        const res = await fetch(String(a.url).replace(/\/$/, '') + '/api/sync/' + MODULE, {
          method:'POST',
          headers:{ 'Content-Type':'application/json',
            'Authorization':'Bearer ' + a.token },
          body:JSON.stringify(govde),
        });
        durum = res.status;
      }catch(e){ durum = 0; }
      if(durum !== 202){ hata = durum; break; }
      gonderilen++;
      if(typeof onProgress === 'function') onProgress(gonderilen, n);
    }
    await save({ lastAt:new Date().toISOString(),
      lastStatus:hata == null ? 202 : hata,
      lastNote:hata == null
        ? gonderilen + ' günlük geçmiş gönderildi (' + bos + ' gün ölçümsüz).'
        : 'Geçmiş gönderimi ' + hata + ' ile durdu.' });
    return { ok:hata == null, sent:gonderilen, empty:bos, status:hata || 202 };
  }


  /* --------------------------------------------------------- niyet kuyrugu

     HKM bu sisteme YAZMAZ. «Yarin iki saat matematik» gibi bir istek
     HKM'de bir NIYET olur; burasi acilista kuyrugu SORAR, kullaniciya
     gosterir ve onaylanirsa AYS kendi koduyla uygular.

     Uc kural:

     1. Kuyruk okumak bir izin degildir: gelen sey bir TEKLIFTIR ve
        kullanici gormeden hicbir sey uygulanmaz.
     2. Tanimadigimiz bir tur SESSIZCE ATLANIR — uzaktan gelen bir sozluk,
        bu sistemde calistirilacak bir komut degildir.
     3. HKM kapali, yavas ya da yoksa hicbir sey olmaz: kuyruk bos gelir. */
  const INTENT_KINDS = ['plan.add', 'focus.set', 'load.reduce'];

  async function intents(){
    const a = settings();
    if(!a.enabled || !a.token || !urlOk(a.url)) return [];
    let res;
    try{
      res = await fetch(String(a.url).replace(/\/$/, '') + '/api/intents/'
        + MODULE + '/take', {
        method:'POST',
        headers:{ 'Content-Type':'application/json',
          'Authorization':'Bearer ' + a.token },
      });
    }catch(e){ return []; }
    if(res.status !== 200) return [];
    let govde = null;
    try{ govde = await res.json(); }catch(e){ return []; }
    const liste = (govde && govde.intents) || [];
    return liste.filter(function(n){
      return n && INTENT_KINDS.indexOf(n.kind) >= 0 && n.payload;
    });
  }

  /* Kullanicinin cevabi HKM'ye bildirilir: gorulmemis bir niyetle
     reddedilmis bir niyeti ayirmak, kuyrugun tek anlamli tarafi. */
  async function answerIntent(id, applied){
    const a = settings();
    if(!a.enabled || !a.token || !urlOk(a.url)) return { ok:false };
    try{
      const res = await fetch(String(a.url).replace(/\/$/, '') + '/api/intent/'
        + id + '/' + (applied ? 'applied' : 'dismissed'), {
        method:'POST',
        headers:{ 'Content-Type':'application/json',
          'Authorization':'Bearer ' + a.token },
      });
      return { ok:res.status === 200, status:res.status };
    }catch(e){ return { ok:false }; }
  }

  /* Bir niyeti UYGULAMAK: yazan AYS'nin kendi kodudur.

     HKM'nin gönderdiği sözlük burada bir «komut» değil bir GİRDİDİR:
     alanları tek tek okunur, sınırlanır ve AYS'nin kendi modeliyle
     yazılır. Uzaktan gelen bir nesneyi olduğu gibi kaydetmek, HKM'ye
     bu sistemin şemasına yazma yetkisi vermek olurdu. */
  async function applyIntent(n){
    if(!n || n.kind !== 'plan.add') return { ok:false, error:'Bu teklif türü uygulanmaz.' };
    const p = n.payload || {};
    if(!U.isISO(String(p.date || ''))) return { ok:false, error:'Tarih geçersiz.' };
    const dk = Math.max(10, Math.min(Number(p.minutes) || 0, 480));
    if(!dk) return { ok:false, error:'Süre geçersiz.' };
    const gun = await R.Model.ensureDay(p.date);
    gun.blocks = (gun.blocks || []).concat([{
      id:U.uid('b'),
      slot:'HKM teklifi',
      subject:String(p.subject || 'Genel').slice(0, 40),
      topic:String(p.subject || 'Genel').slice(0, 40),
      targetMin:dk, targetQ:0, status:'pending',
      subjectId:null, topicId:null,
      actualMin:null, actualQ:null, correctQ:null,
      skipReason:null, startedAt:null,
    }]);
    await R.Model.saveDay(p.date);
    return { ok:true, note:p.date + ' gününe ' + dk + ' dakikalık blok eklendi.' };
  }

  /* Ateşle ve unut: arayüz akışlarının çağırdığı biçim. Söz vermez,
     beklemez, hata fırlatmaz. */
  function ping(opts){
    try{
      const p = send(opts);
      if(p && typeof p.catch === 'function') p.catch(function(){});
    }catch(e){ /* işaret, akışı asla bozmaz */ }
  }

  return { load, save, settings, collect, payload, preview, contract, metric,
    urlOk, due, send, ping, pair, backfill, levelOf, LEVELS,
    intents, answerIntent, applyIntent, INTENT_KINDS,
    MODULE, CONTRACT, LABELS, ASGARI_ARA_DK };
})();
