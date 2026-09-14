/* HKM işareti (beacon) — «varsa gönder», asla bekletme.

   ESP HKM'nin var olduğunu BİLMEZ. Bu dosya o kuralın tek istisnası
   ve istisnanın sınırları burada yazılı:

   1. HİÇBİR ÇİZİMDE ÇALIŞMAZ. Gönderim yalnızca kullanıcının açıkça
      istediği anda ya da gün kapanışında tetiklenir; bir ekranın açılması
      ağ trafiği doğurmaz.

   2. HİÇBİR KAYDI BLOKLAMAZ. Gönderim ateşle-ve-unut'tur; hata yakalanır
      ve yutulur. HKM kapalıyken, yavaşken ya da yokken ESP arayüzünde
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
   geri dönüşü yok sayılabilir. ESP'in verisi ESP'te kalır; HKM'ye giden
   şey günün ÖZETİDİR. */

window.ESP = window.ESP || {};

ESP.Beacon = (function(){
  const U = ESP.U;
  const S = ESP.S;

  const MODULE = 'esp';
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
  let DEFTER = null;   // teklif defteri (asagida)

  function settings(){ return Object.assign({}, VARSAYILAN, AYAR || {}); }

  async function load(){
    try{ AYAR = (await ESP.Store.get('hkm')) || {}; }
    catch(e){ AYAR = {}; }
    /* Teklif defterinin bellekteki kopyasi da tazelenir: ambar
       degistiginde (acilis, hesap degisimi) eski kopyayla devam etmek,
       cevaplanmis bir teklifi cevapsiz sanmak olurdu. */
    DEFTER = null;
    return settings();
  }

  async function save(patch){
    AYAR = Object.assign({}, settings(), patch || {});
    await ESP.Store.set('hkm', AYAR);
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

     Gönderilen şey GÜNÜN ÖZETİDİR: kart metni, not içeriği, kitap adı
     gitmez. HKM'ye giden en küçük veri kümesi, onun işini görebilecek
     kadarıdır — fazlası bir maliyet, bir sızıntı yüzeyi ve bir iddiadır. */
  function collect(dateISO){
    const d = dateISO || U.todayISO();
    const out = {};

    /* Retansiyon BUGÜNÜN kart durumundan hesaplanır: kartın kararlılığı ve
       son tekrardan bu yana geçen süre. Geçmiş bir gün için bu sayı o günün
       ölçümü DEĞİLDİR — o yüzden geçmişte gönderilmez. */
    if(gecmisMi(d)){
      out.retention = metric(null, 'missing');
      out.retention_cards = metric(null, 'missing');
    }else{
      const ret = ESP.SRS.retention(null, d);
      out.retention = metric(ret.value, ret.cert);
      out.retention_cards = ret.n ? metric(ret.n, 'computed') : metric(null, 'missing');
    }

    const dk = ESP.Model.minutesOf(d);
    out.practice_minutes = dk == null ? metric(null, 'missing') : metric(dk, 'measured');

    /* Sentez açığı: en eski BAĞLANMAMIŞ notun yaşı. Hiç not yoksa bu bir
       «0 gün açık» değil, ölçülmemiş bir alandır. */
    const notlar = (S.notes || []);
    if(!notlar.length){
      out.synthesis_gap_days = metric(null, 'missing');
    }else{
      const bagsiz = ESP.Intellect.unlinkedNotes();
      if(!bagsiz.length){
        out.synthesis_gap_days = metric(0, 'computed');
      }else{
        const yas = bagsiz.map(function(n){
          return U.diffDays(String(n.createdAt || '').slice(0, 10), d);
        }).filter(function(x){ return isFinite(x); });
        out.synthesis_gap_days = yas.length
          ? metric(Math.max.apply(null, yas), 'computed')
          : metric(null, 'missing');
      }
    }

    if(levelOf() === 'gelismis') Object.assign(out, genis(d));
    return out;
  }

  /* Gelişmiş kapsam — disiplin disiplin dakika. Hangi kitabı okuduğun,
     hangi parçayı çalıştığın ve not içeriği gitmez; giden şey AÇIK olan
     disiplinlerin o günkü ölçülmüş dakikasıdır.

     Kapalı bir disiplin hiç gönderilmez: kapalı bölümün «0 dakika»sı bir
     ölçüm değil, olmayan bir sorunun cevabıdır. */
  function genis(d){
    const out = {};
    (ESP.DISCIPLINES || []).forEach(function(disc){
      if(ESP.Mod && !ESP.Mod.isOn(disc.id)) return;
      const dk = ESP.Model.minutesOf(d, disc.id);
      out['disc.' + disc.id + '.minutes'] = dk == null
        ? metric(null, 'missing') : metric(dk, 'measured');
    });
    const oturum = ESP.Model.sessionsOf(d);
    out.sessions = oturum.length ? metric(oturum.length, 'measured')
      : metric(null, 'missing');

    if(gecmisMi(d)) return out;
    out.cards_total = metric((S.cards || []).length, 'measured');
    out.cards_due = metric((S.cards || []).filter(function(c){
      return c.dueAt && c.dueAt <= d; }).length, 'computed');
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
     gosterir ve onaylanirsa ESP kendi koduyla uygular.

     Uc kural:

     1. Kuyruk okumak bir izin degildir: gelen sey bir TEKLIFTIR ve
        kullanici gormeden hicbir sey uygulanmaz.
     2. Tanimadigimiz bir tur SESSIZCE ATLANIR — uzaktan gelen bir sozluk,
        bu sistemde calistirilacak bir komut degildir.
     3. HKM kapali, yavas ya da yoksa hicbir sey olmaz: kuyruk bos gelir. */
  const INTENT_KINDS = ['plan.add', 'focus.set', 'load.reduce'];

  /* ---------- teklif defteri: cevabin SAHIBI bu taraftir

     Kuyruk artik acik teklifleri her soruşta yeniden veriyor (cevaplanmamis
     bir teklif sayfa yenilendiginde kaybolmasin diye). Bu, tek basina yeni
     bir tehlike dogurur: aynı teklif iki kez UYGULANABILIR.

     Bu yuzden cevabin kaydi burada, YEREL olarak tutulur ve ag'dan ONCE
     yazilir. Uc hal ayrilir:

       applying      — uygulama basladi, bitip bitmedigi BILINMIYOR
       applied       — uygulandi
       acknowledged  — goruldu; uygulamak kullanicinin isi
       dismissed     — istenmedi
       unknown       — yarida kalmisti, kullanici kapatti

     «applying» bir basarisizlik degil bir BILINMEZLIKTIR: uygulama
     sirasinda sekme kapanirsa teklif ne yeniden uygulanir ne de sessizce
     yutulur; kullaniciya «belirsiz» diye gosterilir. Uydurmak yerine
     bilmedigimizi soylemek, bu sistemin her yerindeki kural.

     `reported` alani ayri bir sozdur: is YERELDE bitmis ama merkeze
     BILDIRILEMEMIS olabilir. O kayit silinmez; bir sonraki kuyruk
     sorusunda bildirim tekrar denenir. */
  const DEFTER_YOLU = 'hkmIntentLog';
  const DEFTER_SINIR = 200;             // defter sinirsiz buyumez

  async function intentLog(){
    if(DEFTER) return DEFTER;
    let ham = null;
    try{ ham = await ESP.Store.get(DEFTER_YOLU); }catch(e){ ham = null; }
    DEFTER = (ham && typeof ham === 'object' && ham.entries
      && typeof ham.entries === 'object') ? ham.entries : {};
    return DEFTER;
  }

  async function markIntent(id, state, reported, note, closed){
    const d = await intentLog();
    d[String(id)] = { state:state, reported:!!reported, closed:!!closed,
      note:String(note || ''), at:new Date().toISOString() };
    const anahtar = Object.keys(d);
    if(anahtar.length > DEFTER_SINIR){
      anahtar.sort(function(x, y){
        return String(d[x].at).localeCompare(String(d[y].at)); });
      anahtar.slice(0, anahtar.length - DEFTER_SINIR)
        .forEach(function(k){ delete d[k]; });
    }
    try{ await ESP.Store.set(DEFTER_YOLU, { entries:d }); }catch(e){ /* yerel */ }
    return d[String(id)];
  }

  async function forgetIntent(id){
    const d = await intentLog();
    delete d[String(id)];
    try{ await ESP.Store.set(DEFTER_YOLU, { entries:d }); }catch(e){ /* yerel */ }
  }

  /* Bildirilememis cevaplar — bağlantı gelince tekrar denenir. */
  async function flushIntentReports(){
    const d = await intentLog();
    let denenen = 0, basarili = 0;
    for(const id of Object.keys(d)){
      const k = d[id];
      if(k.reported || k.closed || k.state === 'applying') continue;
      denenen++;
      const r = await answerIntent(id, k.state);
      if(r.ok){ basarili++; await markIntent(id, k.state, true, k.note); continue; }
      /* Merkez «boyle bir niyet yok» (404) ya da «zaten baska bir cevabi
         var» (409) diyorsa tekrar denemek bir sey duzeltmez; sonsuza
         kadar denemek de o kaydi asla kapatmamak olurdu. Kayit KAPANIR
         ama «bildirildi» YAZILMAZ: bildirilmedi, denenmeyecek. */
      if(r.status === 404 || r.status === 409){
        await markIntent(id, k.state, false, k.note, true);
      }
    }
    return { tried:denenen, ok:basarili };
  }

  /* Uygulanip uygulanmadigi BILINMEYEN teklifler. Arayuz bunlari bir
     eylem olarak degil bir UYARI olarak gosterir. */
  async function intentDoubts(){
    const d = await intentLog();
    return Object.keys(d).filter(function(id){ return d[id].state === 'applying'; })
      .map(function(id){ return Object.assign({ id:id }, d[id]); });
  }

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
    const defter = await intentLog();
    /* Merkez hala acik sanıyorsa ama biz cevaplamissak: gosterme, BILDIR.
       Kuyruk acik teklifi tekrar tekrar verir; ikinci kez sormak
       kullaniciya ayni seyi iki kez sordurmak olurdu. */
    const gosterilecek = liste.filter(function(n){
      if(!n || INTENT_KINDS.indexOf(n.kind) < 0 || !n.payload) return false;
      return !defter[String(n.id)];
    });
    flushIntentReports().catch(function(){});
    return gosterilecek;
  }

  /* Kullanicinin cevabi HKM'ye bildirilir: gorulmemis bir niyetle
     reddedilmis bir niyeti ayirmak, kuyrugun tek anlamli tarafi.

     Ikinci parametre artik bir bayrak degil bir DURUM da olabilir:

       applied      — modul teklifi kendi koduyla uyguladi
       acknowledged — teklif goruldu; uygulamak kullanicinin isi
       dismissed    — istenmedi
       unknown      — uygulama yarida kaldi, sonuc BILINMIYOR

     Dordunu bire indirmek, birbirinden farkli dort sonucu tek kelimeyle
     anlatmak olurdu; merkezdeki kayit da o kadar dogru olurdu. */
  function _durumAdi(applied){
    if(applied === true) return 'applied';
    if(applied === false) return 'dismissed';
    return String(applied);
  }

  async function answerIntent(id, applied){
    const a = settings();
    const durum = _durumAdi(applied);
    if(['applied', 'acknowledged', 'dismissed', 'unknown'].indexOf(durum) < 0){
      return { ok:false, error:'Geçersiz durum.' };
    }
    if(!a.enabled || !a.token || !urlOk(a.url)) return { ok:false };
    try{
      const res = await fetch(String(a.url).replace(/\/$/, '') + '/api/intent/'
        + id + '/' + durum, {
        method:'POST',
        headers:{ 'Content-Type':'application/json',
          'Authorization':'Bearer ' + a.token },
      });
      return { ok:res.status === 200, status:res.status };
    }catch(e){ return { ok:false }; }
  }

  /* Bir niyeti UYGULAMAK: yazan ESP'nin kendi kodudur.

     ESP'de bir «oturum» ölçülmüş bir çalışmadır; ileriye dönük bir teklif
     oturum olarak yazılamaz — yazılsaydı yapılmamış bir çalışma ölçülmüş
     görünürdü. Teklif bu yüzden bir HATIRLATICI olur. */
  const APPLIABLE = ['plan.add'];

  function canApply(n){
    return !!(n && APPLIABLE.indexOf(n.kind) >= 0);
  }

  async function applyIntent(n){
    if(!canApply(n)) return { ok:false, error:'Bu teklif türü uygulanmaz.' };
    const p = n.payload || {};
    if(!U.isISO(String(p.date || ''))) return { ok:false, error:'Tarih geçersiz.' };
    /* Gecersiz sure sinirlandirilmaz, REDDEDILIR: -5 dakikayi 5 dakikaya
       cekmek, teklifi sessizce baska bir teklife cevirmektir. */
    const dk = Number(p.minutes);
    if(!isFinite(dk) || dk <= 0 || dk > 480){
      return { ok:false, error:'Süre geçersiz (5–480 dakika bekleniyor).' };
    }
    const disc = (ESP.DISCIPLINES || []).some(function(d){ return d.id === p.disc; })
      ? p.disc : 'lang';
    const r = await ESP.Model.saveReminder({
      disc:disc, due:p.date, repeat:'none',
      text:Math.round(dk) + ' dakika ' + disc + ' (HKM teklifi)',
    });
    if(!r.ok) return { ok:false, error:r.error || 'Hatırlatıcı yazılamadı.' };
    return { ok:true, note:p.date + ' için hatırlatıcı eklendi — ölçülmüş bir '
      + 'oturum olarak DEĞİL: yapılmamış bir çalışma ölçülmüş görünmemeli.' };
  }

  /* ---------- teklifi KAPATMAK: tek kapi

     Arayuz artik `applyIntent` + `answerIntent` ikilisini kendisi
     sirayla cagirmaz. Dort hatanin dordu de o sirada dogmustu:

       - iki tiklama iki blok yaziyordu,
       - uygulamadan sonra baglanti koparsa merkez «cevapsiz» kaliyordu,
       - bildirim basarisiz olunca kullaniciya «uygulandi» deniyordu,
       - sayfa yenilenince is bastan yapilabiliyordu.

     Sira burada tektir ve defter AG'DAN ONCE yazilir. */
  const ISLEMDE = {};

  async function resolveIntent(n, action){
    if(!n || n.id == null) return { ok:false, error:'Teklif bulunamadı.' };
    const anahtar = String(n.id);
    if(['apply', 'seen', 'dismiss'].indexOf(action) < 0){
      return { ok:false, error:'Bilinmeyen işlem.' };
    }
    /* Cift tiklama: es zamanli iki cagri tek is olur. */
    if(ISLEMDE[anahtar]) return { ok:false, error:'Bu teklif işleniyor.' };
    ISLEMDE[anahtar] = true;
    try{
      const defter = await intentLog();
      const onceki = defter[anahtar];
      const durum = action === 'apply' ? 'applied'
        : (action === 'seen' ? 'acknowledged' : 'dismissed');
      let not = '';
      let uygulandi = false;
      if(action === 'apply'){
        if(onceki && (onceki.state === 'applied' || onceki.state === 'applying')){
          /* En fazla BIR KEZ: daha once uygulanmis (ya da uygulanmis
             olabilecek) bir teklif tekrar plana yazilmaz. */
          not = 'Bu teklif daha önce uygulanmıştı; ikinci kez yazılmadı.';
        }else{
          await markIntent(n.id, 'applying', false, '');
          const r = await applyIntent(n);
          if(!r.ok){
            await forgetIntent(n.id);
            return { ok:false, error:r.error };
          }
          not = r.note;
          uygulandi = true;
        }
      }
      await markIntent(n.id, durum, false, not);
      const bildirim = await answerIntent(n.id, durum);
      if(bildirim.ok) await markIntent(n.id, durum, true, not);
      return { ok:true, applied:uygulandi, state:durum,
        reported:!!bildirim.ok, note:not };
    }finally{
      delete ISLEMDE[anahtar];
    }
  }

  /* Belirsiz bir teklifi KAPATMAK. Kullanici planina bakip karar verir;
     merkeze «uygulandi» da «istenmedi» de denmez — BILINMIYOR denir. */
  async function clearDoubt(id){
    await markIntent(id, 'unknown', false, '');
    const bildirim = await answerIntent(id, 'unknown');
    if(bildirim.ok) await markIntent(id, 'unknown', true, '');
    return { ok:true, reported:!!bildirim.ok };
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
    intents, answerIntent, applyIntent, canApply, INTENT_KINDS, APPLIABLE,
    resolveIntent, intentLog, markIntent, forgetIntent, flushIntentReports,
    intentDoubts, clearDoubt,
    MODULE, CONTRACT, LABELS, ASGARI_ARA_DK };
})();
