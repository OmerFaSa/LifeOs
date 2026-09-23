/* HKM işareti (beacon) — «varsa gönder», asla bekletme.

   SPİ HKM'nin var olduğunu BİLMEZ. Bu dosya o kuralın tek istisnası
   ve istisnanın sınırları burada yazılı:

   1. HİÇBİR ÇİZİMDE ÇALIŞMAZ. Gönderim yalnızca kullanıcının açıkça
      istediği anda ya da gün kapanışında tetiklenir; bir ekranın açılması
      ağ trafiği doğurmaz.

   2. HİÇBİR KAYDI BLOKLAMAZ. Gönderim ateşle-ve-unut'tur; hata yakalanır
      ve yutulur. HKM kapalıyken, yavaşken ya da yokken SPİ arayüzünde
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
   geri dönüşü yok sayılabilir. SPİ'in verisi SPİ'te kalır; HKM'ye giden
   şey günün ÖZETİDİR. */

window.SP = window.SP || {};

SP.Beacon = (function(){
  const U = SP.U;
  const S = SP.S;

  const MODULE = 'spi';
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
    try{ AYAR = (await SP.Store.get('hkm')) || {}; }
    catch(e){ AYAR = {}; }
    /* Teklif defterinin bellekteki kopyasi da tazelenir: ambar
       degistiginde (acilis, hesap degisimi) eski kopyayla devam etmek,
       cevaplanmis bir teklifi cevapsiz sanmak olurdu. */
    DEFTER = null;
    return settings();
  }

  async function save(patch){
    AYAR = Object.assign({}, settings(), patch || {});
    await SP.Store.set('hkm', AYAR);
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

     Gönderilen şey GÜNÜN ÖZETİDİR: tahlil değeri, ilaç adı, semptom kaydı
     ya da öğün içeriği GİTMEZ. Sağlık verisinin en küçük kümesi bile bir
     sorumluluktur; HKM'ye yalnızca yük kararını etkileyen dört alan gider.

     Klinik sınır burada da geçerlidir: bu alanlar bir teşhis değil, bir
     günün yük taşıma kapasitesine dair ölçümlerdir. */
  function collect(dateISO){
    const d = dateISO || U.todayISO();
    const out = {};
    const v = (S.vitals || {})[d] || {};

    out.sleep_hours = v.sleep == null ? metric(null, 'missing')
      : metric(v.sleep, 'measured');

    const r = SP.Move.readiness(d);
    out.recovery = r && r.ok ? metric(r.score, 'computed') : metric(null, 'missing');

    out.hrv = v.hrv == null ? metric(null, 'missing') : metric(v.hrv, 'measured');

    /* Taban çizgi: son 30 günün ölçülmüş HRV ortancası. Kendi tabanı
       olmayan bir HRV sayısı tek başına bir şey söylemez. */
    const gecmis = [];
    for(let i = 1; i <= 30; i++){
      const t = U.iso(U.addDays(U.parse(d), -i));
      const rec = (S.vitals || {})[t];
      if(rec && rec.hrv != null) gecmis.push(Number(rec.hrv));
    }
    if(gecmis.length >= 5){
      gecmis.sort(function(a, b){ return a - b; });
      const n = gecmis.length;
      const orta = n % 2 ? gecmis[(n - 1) / 2] : (gecmis[n / 2 - 1] + gecmis[n / 2]) / 2;
      out.hrv_baseline = metric(Math.round(orta * 10) / 10, 'computed');
    }else{
      out.hrv_baseline = metric(null, 'missing');
    }


    /* SEVİYE — üçünde de AYNI sözleşme (bkz. brand/seviye/).

       HKM bu üç sayıyı yan yana koyabilsin diye gönderilir; HKM'nin
       kendi XP'si YOKTUR ve olmamalı: üçünün üstünde değil yanındadır.

       Geçmiş bir gün için yalnız O GÜNÜN XP'si anlamlıdır; toplam ve
       kademe BUGÜNÜN durumudur ve geçmişe yazılmaz. Deftere hiç kayıt
       düşmemiş bir gün «0 XP» değil «veri yok»tur. */
    if(SP.XP && SP.XP.durum()){
      const sv = SP.XP.durum();
      out.xp_today = SP.XP.gunuVar(d)
        ? metric(SP.XP.gunToplami(d), 'computed') : metric(null, 'missing');
      if(!gecmisMi(d)){
        out.xp_total = metric(sv.toplam, 'computed');
        out.level_step = metric(sv.bitmisBasamak, 'computed');
        out.level_tier = metric(sv.kademe, 'computed');
        /* Kademe İÇİNDEKİ adım (1–3) de gönderilir. «basamak
           numarasından hesaplanır» demek, aynı formülü merkezde ikinci
           kez yazmak ve iki kopyanın bir gün ayrışması demekti. */
        out.level_sub = metric(sv.basamak, 'computed');
      }
    }

    /* ROZET SAYAÇLARI — merkez profilinin girdisi.

       Üç arayüz birbirini GÖRMEZ (AGENTS.md §1.4); «bütün alanların
       toplamı 5000 saat» gibi bir rozet yalnız merkezde hesaplanabilir
       ve bu satırlar onun girdisidir. Merkez bunları TOPLAR, kendi
       rozetini kendi verir; modülün kendi rozetiyle karışmaz.

       Kademe gibi bunlar da BUGÜNÜN durumudur ve geçmişe yazılmaz:
       «üç ay önceki gün toplam 400 saatti» diye bir ölçüm yoktur,
       olan tek şey bugünkü toplamdır. */
    if(!gecmisMi(d) && SP.Basarim){
      const rz = SP.Basarim.isaret();
      if(rz){
        Object.keys(rz).forEach(function(k){
          out[k] = metric(rz[k], 'computed');
        });
      }
    }
    if(levelOf() === 'gelismis') Object.assign(out, genis(d, v));
    return out;
  }

  /* Gelişmiş kapsam — günün ölçüm ve yük tablosu. Hepsi O GÜNE bağlıdır,
     bu yüzden geçmiş günler için de dürüstçe hesaplanabilir.

     Klinik sınır burada da geçerli: tahlil değeri, ilaç adı, semptom adı
     ve öğün içeriği HİÇBİR seviyede gitmez. Semptom yalnızca SAYI olarak
     gider — hangi semptom olduğu değil, kaç tane işaretlendiği. */
  function genis(d, v){
    const out = {};
    [['weight', 'weight'], ['rhr', 'rhr'], ['sbp', 'sbp'], ['dbp', 'dbp'],
     ['waist', 'waist'], ['water', 'water']].forEach(function(p){
      const x = v[p[1]];
      out[p[0]] = x == null ? metric(null, 'missing') : metric(x, 'measured');
    });

    const ogun = SP.Nutri && SP.Nutri.dayTotals ? SP.Nutri.dayTotals(d) : null;
    const yendi = ogun && (SP.Model.mealsOf(d) || []).length;
    out.protein_g = yendi ? metric(Math.round(ogun.protein), 'computed')
      : metric(null, 'missing');
    out.kcal = yendi ? metric(Math.round(ogun.kcal), 'computed')
      : metric(null, 'missing');

    const antrenman = (S.workouts || []).filter(function(w){ return w.date === d; });
    out.train_minutes = antrenman.length
      ? metric(antrenman.reduce(function(a, w){ return a + (Number(w.minutes) || 0); }, 0),
          'measured')
      : metric(null, 'missing');

    /* Semptom SAYISI gider, semptomun kendisi gitmez. Ve «işaretlenmedi»
       ile «hiç bakılmadı» ayrı şeylerdir: ikincisi veri yoktur. */
    out.symptom_count = v.symptomsLogged
      ? metric(Object.keys(v.symptoms || {}).length, 'measured')
      : metric(null, 'missing');
    return out;
  }


  function payload(dateISO){
    const d = dateISO || U.todayISO();
    return { module:MODULE, date:d, version:CONTRACT, metrics:collect(d) };
  }

  /* ETİKETİN TÜRKÇESİ BURADA YAZILMAZ.

     Bu dört karşılık üç arayüzün `beacon.js` dosyasında AYRI AYRI
     yazılıydı. Üçü de aynıydı; aynı kalacaklarını söyleyen hiçbir şey
     yoktu — ve ayrıştıklarında fark ancak iki ekran yan yana konunca
     görülürdü. Tek kaynak `brand/ortak/kesinlik.js`; oradan üçe
     yayılır ve `tools/ortak.py --denetle` ayrışmayı CI'da yakalar.

     Katalog yüklenmemişse KİMLİK yazılır, uydurma bir karşılık
     değil (AGENTS.md §1.7). */
  function etiketAdi(cert){
    const L = window.LIFEOS;
    const e = L && L.KESINLIK_ILE ? L.KESINLIK_ILE(cert) : null;
    return e ? e.ad : String(cert);
  }

  /* Kullanıcı ne gönderildiğini GÖRMEDEN açmamalı. */
  function preview(dateISO){
    const p = payload(dateISO);
    const satirlar = Object.keys(p.metrics).map(function(k){
      const m = p.metrics[k];
      return { key:k, value:m.value, cert:m.cert,
        label:etiketAdi(m.cert) };
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
     gosterir ve onaylanirsa SPİ kendi koduyla uygular.

     Uc kural:

     1. Kuyruk okumak bir izin degildir: gelen sey bir TEKLIFTIR ve
        kullanici gormeden hicbir sey uygulanmaz.
     2. Tanimadigimiz bir tur SESSIZCE ATLANIR — uzaktan gelen bir sozluk,
        bu sistemde calistirilacak bir komut degildir.
     3. HKM kapali, yavas ya da yoksa hicbir sey olmaz: kuyruk bos gelir. */
  const INTENT_KINDS = ['plan.add', 'focus.set', 'load.reduce', 'plan.apply', 'kayit.add',
    'urun.add', 'besin.add', 'fiyat.add', 'yer.add'];

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
    try{ ham = await SP.Store.get(DEFTER_YOLU); }catch(e){ ham = null; }
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
    try{ await SP.Store.set(DEFTER_YOLU, { entries:d }); }catch(e){ /* yerel */ }
    return d[String(id)];
  }

  async function forgetIntent(id){
    const d = await intentLog();
    delete d[String(id)];
    try{ await SP.Store.set(DEFTER_YOLU, { entries:d }); }catch(e){ /* yerel */ }
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
    /* Gunun kaydi ONAYDAN ONCE okunur: kart «SPİ şöyle okudu» der. */
    for(const n of gosterilecek){
      if(n.kind !== 'kayit.add') continue;
      try{ n.okuma = kayitOku(n); }catch(e){ n.okuma = null; }
    }
    /* BAM bilgisi (besin, fiyat, yer) de ONAYDAN ONCE sinanir: kart «SPİ
       şunu ekleyecek» der ya da neden ekleyemeyecegini soyler. */
    for(const n of gosterilecek){
      if(!SP.Bilgi || !SP.Bilgi.NIYET[n.kind]) continue;
      try{ n.bilgi = await SP.Bilgi.onizle(n); }catch(e){ n.bilgi = null; }
    }
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

  /* SPİ'de niyet uygulanmaz — ve bu bir eksiklik değil bir SINIRDIR.

     Sağlık tarafında bir «teklifi uygulamak» ölçüm uydurmak ya da yük
     değiştirmek demek olurdu; ikisi de kullanıcının kendi kararıdır.
     Gelen teklif gösterilir, uygulaması kullanıcıya bırakılır. */
  /* SPİ hiçbir teklifi KENDILIGINDEN uygulamaz ve bu bir eksiklik değil
     bir SINIRDIR: sağlıkta ölçüm de yük de kullanıcının kararıdır.

     Ama «Gördüm» demek de bir eylemdir ve kendi yolunu tamamlamalıdır.
     Önceki hâlde bu düğme her durumda ok:false döndüren applyIntent()
     yoluna bağlıydı: görünür bir düğme, basıldığında hata veriyordu.
     Ayrım artık açık — uygulanan bir şey yok, ONAYLANAN bir şey var. */
  /* TEK İSTİSNA: `plan.apply` — Planlama Ofisi'nin haftalık programı.
     Ölçüm de değil yük de değil: takvimdir. Kullanıcı «Planına ekle»
     dediğinde program HKM'den çekilir, SPİ'nin KENDİ planıyla sınanır
     (core/plan.js programSina) ve tutarsa öneri kapısından (orta seviye,
     geri alınabilir) yazılır. Tutmazsa eklenmez ve sebebi söylenir. */
  /* İKİNCİ İSTİSNA: `kayit.add` — kullanıcının KENDİ cümlesi («7 saat
     uyudum»). HKM onu yalnız yönlendirir; ölçümü uyduran da yazan da HKM
     değildir. Cümle SPİ'nin kendi ayrıştırıcısıyla okunur (core/proposals.js
     fromText), kullanıcı neyin yazılacağını görür ve «Kaydet»e KENDİSİ
     basar; yazım öneri kapısından geçer ve geri alınabilir kalır. Bu,
     komut paletine aynı cümleyi yazmakla aynı yoldur. */
  /* ÜÇÜNCÜ İSTİSNA: `urun.add` — BAM'ın ürettiği özet, rapor, pankart.
     Ölçüm de yük de değil, okunacak bir BELGEDİR; SPİ'nin verisine
     dokunmaz. HKM'nin Editörü SPİ için doz cümlesini zaten çıkarır; ürün
     yine de teşhis ya da doz önerisi değildir ve «doğrulanmadı» etiketi
     taşıyabilir. */
  /* DÖRDÜNCÜ İSTİSNA: `besin.add` / `fiyat.add` / `yer.add` — BAM'ın
     kaynaktan çıkardığı bilgi (core/bilgi.js). Ölçüm değildir: besin
     kullanıcı gıdası olur, fiyat fişin ALTINDA «tahmin» durur, yer listesi
     Mutfak'a girer. Kayıt HKM'den çekilir ve SPİ'nin kendi koduyla sınanır. */
  const APPLIABLE = ['plan.apply', 'kayit.add', 'urun.add', 'besin.add', 'fiyat.add', 'yer.add'];

  function canApply(n){
    if(!n || APPLIABLE.indexOf(n.kind) < 0) return false;
    if(n.kind === 'kayit.add') return !!(n.okuma && n.okuma.yazilacak.length);
    if(SP.Bilgi && SP.Bilgi.NIYET[n.kind]) return !!(n.bilgi && n.bilgi.ok);
    return true;
  }

  function kayitOku(n){
    const p = (n && n.payload) || {};
    const gun = String(p.date || '');
    const metin = String(p.metin || '').trim().slice(0, 400);
    const out = { gun, yazilacak:[], yazilamaz:[], anlasilmayan:[] };
    if(!U.isISO(gun) || gun > U.todayISO()){
      out.yazilamaz.push({ metin, why:'Tarih geçersiz ya da ileri bir gün; kayıt ancak geçmiş bir güne yazılır.' });
      return out;
    }
    if(!metin || !SP.Proposals){ out.anlasilmayan.push(metin); return out; }
    const v = SP.Proposals.fromText(metin, { date:gun });
    v.oneriler.forEach(function(x){
      const pv = SP.Proposals.preview({ action:x.action, params:x.params });
      const e = SP.Proposals.eylem(x.action) || {};
      if(pv.ok){
        out.yazilacak.push({ baslik:e.label || x.action, metin:x.metin,
          satirlar:pv.rows.map(function(r){ return r.alan + ': ' + r.once + ' → ' + r.sonra; }),
          action:x.action, params:x.params });
      }else{
        out.yazilamaz.push({ metin:x.metin, why:pv.why });
      }
    });
    out.anlasilmayan = (v.anlasilmayan || []).slice();
    return out;
  }

  async function kayitUygula(n){
    const o = kayitOku(n);     /* onay aninda YENIDEN okunur */
    if(!o.yazilacak.length){
      return { ok:false, error:'SPİ bu kayıttan yazılacak bir şey çıkaramadı.' };
    }
    const yazilan = [];
    for(let i = 0; i < o.yazilacak.length; i++){
      const y = o.yazilacak[i];
      const row = await SP.Proposals.propose({ action:y.action, params:y.params,
        source:'istek', kaynak:'rules', metin:y.metin,
        anahtar:'hkm-kayit:' + n.id + ':' + i, iz:[{ tur:'hkm-niyet', id:n.id }] });
      if(!row) continue;
      const r = await SP.Proposals.approve(row.id);
      if(r && r.ok) yazilan.push(y.baslik);
    }
    if(!yazilan.length){
      return { ok:false, error:'Kayıt yazılamadı; veriler arada değişmiş olabilir.' };
    }
    return { ok:true, note:yazilan.length + ' kayıt yazıldı (' + o.gun + ': ' + yazilan.join(', ')
      + '). Danışma ekranından geri alabilirsin.' };
  }

  async function acknowledgeIntent(n){
    if(!n) return { ok:false, error:'Teklif yok.' };
    return { ok:true, acknowledged:true,
      note:'Görüldü olarak işaretlendi. SPİ bunu senin adına uygulamaz: '
         + 'ölçüm de yük de senin kararın.' };
  }

  async function applyIntent(n){
    if(n && n.kind === 'kayit.add') return await kayitUygula(n);
    if(n && SP.Bilgi && SP.Bilgi.NIYET[n.kind]) return await SP.Bilgi.uygula(n.kind, n.payload || {});
    if(n && n.kind === 'urun.add'){
      /* BAM ürünü (özet, rapor, sunum, pankart…): kayıt HKM'den çekilir,
         modülün KENDİ koduyla sınanır, kendi deposuna yazılır
         (core/urun.js, ortak). Ofis ekranındaki BAM ürünlerinden açılır. */
      SP.Urunler = SP.Urunler || (window.LIFEOS && LIFEOS.Urun
        ? LIFEOS.Urun.kur({ store:() => SP.Store, hkm:() => SP.Beacon }) : null);
      if(!SP.Urunler) return { ok:false, error:'Ürün modülü yüklenmedi.' };
      return await SP.Urunler.uygula(n.payload || {});
    }
    if(canApply(n) && n.kind === 'plan.apply' && SP.Plan) return await SP.Plan.programUygula(n);
    return { ok:false,
      error:'SPİ bir teklifi kendiliğinden uygulamaz: ölçüm de yük de senin '
          + 'kararın. Teklif gösterildi, gerisi sende.' };
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
      let geriAl = null;
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
          geriAl = r.geriAl || null;
          uygulandi = true;
        }
      }
      /* SPI'de «uygulamak» yoktur; ONAYLAMAK vardir. Cumleyi de o katman
         yazar: burada uydurulan bir metin, yapilmamis bir isi anlatirdi. */
      if(action === 'seen'){
        const t = await acknowledgeIntent(n);
        if(t.ok) not = t.note;
      }
      await markIntent(n.id, durum, false, not);
      const bildirim = await answerIntent(n.id, durum);
      if(bildirim.ok) await markIntent(n.id, durum, true, not);
      return { ok:true, applied:uygulandi, state:durum,
        reported:!!bildirim.ok, note:not, geriAl };
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
    intents, answerIntent, applyIntent, acknowledgeIntent, canApply,
    INTENT_KINDS, APPLIABLE, kayitOku,
    resolveIntent, intentLog, markIntent, forgetIntent, flushIntentReports,
    intentDoubts, clearDoubt,
    MODULE, CONTRACT, ASGARI_ARA_DK };
})();
