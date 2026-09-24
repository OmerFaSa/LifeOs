/* HKM işareti (beacon) — «varsa gönder», asla bekletme.

   AYS HKM'yi BİLİR ama ona BAĞIMLI DEĞİLDİR (AGENTS.md §1.4): HKM
   kapalıyken, yanıt vermezken ya da hata verirken AYS bozulmaz,
   yavaşlamaz, veri kaybetmez. HKM ile konuşan her dosya (bu dosya,
   `kingteklif.js`, `yedekag.js`, `urun.js`) şu sınırlara uyar:

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
  let DEFTER = null;   // teklif defteri (asagida)

  function settings(){ return Object.assign({}, VARSAYILAN, AYAR || {}); }

  async function load(){
    try{ AYAR = (await R.Store.get('hkm')) || {}; }
    catch(e){ AYAR = {}; }
    /* Teklif defterinin bellekteki kopyasi da tazelenir: ambar
       degistiginde (acilis, hesap degisimi) eski kopyayla devam etmek,
       cevaplanmis bir teklifi cevapsiz sanmak olurdu. */
    DEFTER = null;
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

    /* Günün sorusu = blokların sorusu + serbest soru («soru 40», derssiz
       giriş) + paragraf + problem (goodhart.js aynı toplamı kullanır).
       Serbest/paragraf/problem alanı 0 ile başlar; 0 «girilmedi»dir, ölçüm
       değil. Hiçbir parça girilmemişse veri yok — sıfır gönderilmez. */
    const soru = bloklar.filter(function(b){ return b.actualQ != null; });
    const serbest = gun ? ['freeQ', 'paragraphActual', 'problemActual']
      .map(function(k){ return Number(gun[k]) || 0; })
      .filter(function(n){ return n > 0; }) : [];
    out.questions = (soru.length || serbest.length)
      ? metric(soru.reduce(function(a, b){ return a + Number(b.actualQ || 0); }, 0)
          + serbest.reduce(function(a, n){ return a + n; }, 0), 'measured')
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

    /* Sınava kalan gün her tarih için hesaplanabilir: sabit bir takvim.
       Sınavdan sonra kalan gün yoktur: «veri yok» (HATALAR Y-2). */
    const kalan = R.PLAN.kalanGun(d);
    out.exam_days_left = kalan != null ? metric(kalan, 'computed')
      : metric(null, 'missing');


    /* SEVİYE — üçünde de AYNI sözleşme (bkz. brand/seviye/).

       HKM bu üç sayıyı yan yana koyabilsin diye gönderilir; HKM'nin
       kendi XP'si YOKTUR ve olmamalı: üçünün üstünde değil yanındadır.

       Geçmiş bir gün için yalnız O GÜNÜN XP'si anlamlıdır; toplam ve
       kademe BUGÜNÜN durumudur ve geçmişe yazılmaz. Deftere hiç kayıt
       düşmemiş bir gün «0 XP» değil «veri yok»tur. */
    if(R.XP && R.XP.durum()){
      const sv = R.XP.durum();
      out.xp_today = R.XP.gunuVar(d)
        ? metric(R.XP.gunToplami(d), 'computed') : metric(null, 'missing');
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
    if(!gecmisMi(d) && R.Basarim){
      const rz = R.Basarim.isaret();
      if(rz){
        Object.keys(rz).forEach(function(k){
          out[k] = metric(rz[k], 'computed');
        });
      }
    }
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
    const reddedilen = [];
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
      let durum = 0, res = null;
      try{
        res = await fetch(String(a.url).replace(/\/$/, '') + '/api/sync/' + MODULE, {
          method:'POST',
          headers:{ 'Content-Type':'application/json',
            'Authorization':'Bearer ' + a.token },
          body:JSON.stringify(govde),
        });
        durum = res.status;
      }catch(e){ durum = 0; }
      if(durum === 202){
        gonderilen++;
        if(typeof onProgress === 'function') onProgress(gonderilen, n);
        continue;
      }
      /* Gövdeye özgü ret (400, 409, 413, 422) YALNIZ o günündür: geri kalan
         günler gönderilmeye devam eder ve hangi günün neden reddedildiği
         saklanır. Ağ, yetki ya da sunucu hatası bütün günler için aynıdır:
         orada durulur (ekip/HATALAR.md D-6). */
      if(GOVDE_RETTI.indexOf(durum) >= 0){
        reddedilen.push({ date:t, status:durum, why:await retNedeni(res) });
        continue;
      }
      hata = durum;
      break;
    }
    const not = [];
    not.push(gonderilen + ' günlük geçmiş gönderildi (' + bos + ' gün ölçümsüz).');
    if(reddedilen.length){
      not.push(reddedilen.length + ' gün reddedildi: ' + reddedilen.slice(0, 3).map(function(r){
        return r.date + ' (' + r.status + (r.why ? ': ' + r.why : '') + ')';
      }).join('; ') + (reddedilen.length > 3 ? '; …' : '') + '.');
    }
    if(hata != null) not.push('Gönderim ' + (hata || 'ağ hatası') + ' ile durdu.');
    const durumSon = hata != null ? hata : reddedilen.length ? reddedilen[0].status : 202;
    await save({ lastAt:new Date().toISOString(), lastStatus:durumSon, lastNote:not.join(' ') });
    return { ok:hata == null && !reddedilen.length, sent:gonderilen, empty:bos,
      rejected:reddedilen, status:durumSon, note:not.join(' ') };
  }

  const GOVDE_RETTI = [400, 409, 413, 422];

  async function retNedeni(res){
    try{
      const j = res && typeof res.json === 'function' ? await res.json() : null;
      const e = j && (j.errors || j.error);
      return (Array.isArray(e) ? e.join('; ') : String(e || '')).slice(0, 200);
    }catch(err){ return ''; }
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
  const INTENT_KINDS = ['plan.add', 'focus.set', 'load.reduce', 'material.add', 'mufredat.add',
    'kitap.add', 'kayit.add', 'urun.add'];

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
    try{ ham = await R.Store.get(DEFTER_YOLU); }catch(e){ ham = null; }
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
    try{ await R.Store.set(DEFTER_YOLU, { entries:d }); }catch(e){ /* yerel */ }
    return d[String(id)];
  }

  async function forgetIntent(id){
    const d = await intentLog();
    delete d[String(id)];
    try{ await R.Store.set(DEFTER_YOLU, { entries:d }); }catch(e){ /* yerel */ }
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
    /* Gunun kaydi ONAYDAN ONCE okunur: kart «AYS şöyle okudu» der ve
       kullanici neyin yazilacagini gorerek karar verir. */
    for(const n of gosterilecek){
      if(n.kind !== 'kayit.add') continue;
      try{ n.okuma = await kayitOku(n); }catch(e){ n.okuma = null; }
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

  /* Bir niyeti UYGULAMAK: yazan AYS'nin kendi kodudur.

     HKM'nin gönderdiği sözlük burada bir «komut» değil bir GİRDİDİR:
     alanları tek tek okunur, sınırlanır ve AYS'nin kendi modeliyle
     yazılır. Uzaktan gelen bir nesneyi olduğu gibi kaydetmek, HKM'ye
     bu sistemin şemasına yazma yetkisi vermek olurdu. */
  /* Hangi tur UYGULANABILIR — dugme buna gore cizilir.

     Once kabul listesi uc tur sayiyor ama uygulama yalnizca plan.add
     yapiyordu: gorunur bir «Uygula» dugmesi, basildiginda «bu teklif turu
     uygulanmaz» diyordu. Gorunen eylem, yapilabilen eylemle ayni olmali. */
  const APPLIABLE = ['plan.add', 'material.add', 'mufredat.add', 'kitap.add', 'kayit.add',
    'urun.add', 'load.reduce'];

  /* Gunun kaydi ancak AYS ondan yazilacak bir sey OKUYABILDIYSE
     uygulanabilir: okunamayan bir cumleye «Kaydet» dugmesi, basilinca
     «yazılacak bir şey yok» diyen bir dugme olurdu. */
  function canApply(n){
    if(!n || APPLIABLE.indexOf(n.kind) < 0) return false;
    if(n.kind === 'kayit.add') return !!(n.okuma && n.okuma.yazilacak.length);
    return true;
  }

  /* ---------- günün kaydı (kayit.add) — akşam yoklamasının cevabı

     HKM cümleyi yalnız YÖNLENDİRİR; sayısını okumaz. «2 saat matematik
     çalıştım» burada AYS'nin KENDİ ayrıştırıcısıyla okunur (core/entry.js),
     her parça öneri kapısından geçer (core/proposals.js) ve kullanıcı neyin
     yazılacağını ONAYDAN ÖNCE görür. Yazılamayan parça (o gün o dersin
     bloğu yok gibi) sebebiyle gösterilir: uydurma blok açılmaz. Yazılan
     kayıt Ofis ekranından geri alınabilir. */
  async function kayitOku(n){
    const p = (n && n.payload) || {};
    const gun = String(p.date || '');
    const metin = String(p.metin || '').trim().slice(0, 400);
    const out = { gun, yazilacak:[], yazilamaz:[], anlasilmayan:[] };
    if(!U.isISO(gun) || gun > U.todayISO()){
      out.yazilamaz.push({ metin, why:'Tarih geçersiz ya da ileri bir gün; kayıt ancak geçmiş bir güne yazılır.' });
      return out;
    }
    if(!metin || !R.Entry || !R.Proposals){ out.anlasilmayan.push(metin); return out; }
    await R.Model.ensureDay(gun);
    const v = R.Entry.fromText(metin, { date:gun });
    v.oneriler.forEach(function(x){
      const pv = R.Proposals.preview({ action:x.action, agent:'patron', params:x.params });
      const def = R.ACTION_BY_ID[x.action] || {};
      if(pv.ok){
        out.yazilacak.push({ baslik:def.title || x.action, metin:x.metin,
          satirlar:pv.rows.map(function(r){ return r.label + ': ' + r.before + ' → ' + r.after; }),
          action:x.action, params:x.params });
      }else{
        out.yazilamaz.push({ metin:x.metin, why:pv.why });
      }
    });
    /* Olculmemis bir sey («40 soru cozmedim») yazilmaz; nedeni gosterilir. */
    (v.engellenen || []).forEach(function(e){ out.yazilamaz.push({ metin:e.metin, why:e.soru }); });
    out.anlasilmayan = (v.anlasilmayan || []).slice();
    return out;
  }

  async function kayitUygula(n){
    /* Onay aninda YENIDEN okunur: kart cizildikten sonra veri degismis
       olabilir (blok bitmis, gun acilmis). */
    const o = await kayitOku(n);
    if(!o.yazilacak.length){
      return { ok:false, error:'AYS bu kayıttan yazılacak bir şey çıkaramadı.' };
    }
    const yazilan = [];
    for(let i = 0; i < o.yazilacak.length; i++){
      const y = o.yazilacak[i];
      /* Tek uygulama anahtari: ag yuzunden ikinci kez gelen ayni kayit
         ikinci kez yazilmaz. */
      const row = await R.Proposals.propose({ action:y.action, agent:'patron', source:'istek',
        params:y.params, reason:'HKM akşam kaydı: ' + y.metin,
        anahtar:'hkm-kayit:' + n.id + ':' + i, iz:[{ tur:'hkm-niyet', id:n.id }] });
      if(!row) continue;
      const r = await R.Proposals.approve(row.id);
      if(r && r.ok) yazilan.push(y.baslik);
    }
    if(!yazilan.length){
      return { ok:false, error:'Kayıt yazılamadı; veriler arada değişmiş olabilir.' };
    }
    return { ok:true, note:yazilan.length + ' kayıt yazıldı (' + o.gun + ': ' + yazilan.join(', ')
      + '). Ofis ekranından geri alabilirsin.' };
  }

  /* ---------- BAM materyali (HKM core/bam.py)

     Kalite kontrolünden geçen set kart olarak teklif edilir. Kayıt HKM'den
     ÇEKİLİR ve AYS'nin KENDİ koduyla yeniden doğrulanır: HKM'nin denetimine
     güvenip bozuk maddeyi yazmak, sözleşmeyi karşı tarafa devretmek olurdu.
     Aynı set iki kez eklenmez; HKM'ye ulaşılamazsa hiçbir kart yazılmaz. */
  /* Madde → kart çevirisi ve doğrulaması TEK YERDE: brand/ortak/ofis.js
     (`LIFEOS.Ofis.bamMadde`). ESP de aynısını kullanır. */
  function bamMadde(tur, m){ return window.LIFEOS.Ofis.bamMadde(tur, m); }

  async function materyalUygula(p){
    const kid = Number(p.kayit_id);
    if(!Number.isInteger(kid) || kid < 1) return { ok:false, error:'Materyal kimliği geçersiz.' };
    const ref = 'bam:' + kid;
    if(R.S.cards.some(c => c.sourceRef === ref)) return { ok:false, error:'Bu set zaten eklenmiş.' };
    const a = settings();
    if(!a.token || !urlOk(a.url)){
      return { ok:false, error:'HKM bağlantısı kurulmamış; materyal alınamaz.' };
    }
    let kayit = null;
    try{
      const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      const zaman = ctrl ? setTimeout(function(){ ctrl.abort(); }, 4000) : null;
      const res = await fetch(String(a.url).replace(/\/$/, '') + '/api/bam/kayit/' + kid, {
        headers:{ 'Authorization':'Bearer ' + a.token },
        signal:ctrl ? ctrl.signal : undefined,
      });
      if(zaman) clearTimeout(zaman);
      if(res.status === 200){ const g = await res.json(); kayit = g && g.kayit; }
    }catch(e){ kayit = null; }
    if(!kayit || kayit.tur !== 'materyal' || !kayit.govde){
      return { ok:false, error:'Materyal HKM’den alınamadı; HKM açıkken yeniden dene.' };
    }
    const tur = kayit.govde.tur;
    const kartlar = (Array.isArray(kayit.govde.maddeler) ? kayit.govde.maddeler : [])
      .slice(0, 50).map(m => bamMadde(tur, m)).filter(Boolean);
    if(!kartlar.length){
      return { ok:false, error:'Setteki maddelerin hiçbiri AYS’nin denetimini geçmedi.' };
    }
    const konu = String(kayit.govde.konu || kayit.baslik || '').slice(0, 80);
    for(const k of kartlar){
      await R.Model.saveCard(R.Model.newCard({ front:k.front, back:k.back, topic:konu,
        source:'bam', sourceRef:ref }));
    }
    return { ok:true, note:kartlar.length + ' kart eklendi («' + String(kayit.baslik || '').slice(0, 60)
      + '», BAM #' + kid + '). Kaynağı doğrulanmadı; yanlış bulduğun kartı sil.' };
  }

  async function applyIntent(n){
    if(n && n.kind === 'kayit.add') return await kayitUygula(n);
    if(n && n.kind === 'urun.add'){
      /* BAM ürünü (özet, rapor, sunum, pankart…): kayıt HKM'den çekilir,
         modülün KENDİ koduyla sınanır, kendi deposuna yazılır
         (core/urun.js, ortak). Ofis ekranındaki BAM ürünlerinden açılır. */
      R.Urunler = R.Urunler || (window.LIFEOS && LIFEOS.Urun
        ? LIFEOS.Urun.kur({ store:() => R.Store, hkm:() => R.Beacon }) : null);
      if(!R.Urunler) return { ok:false, error:'Ürün modülü yüklenmedi.' };
      return await R.Urunler.uygula(n.payload || {});
    }
    if(!canApply(n)) return { ok:false, error:'Bu teklif türü uygulanmaz.' };
    if(n.kind === 'material.add') return await materyalUygula(n.payload || {});
    /* BAM'ın müfredat raporu → sınav profili (core/sinavprofil.js). Kayıt
       HKM'den çekilir ve AYS'nin kendi sınırlarıyla süzülür. */
    if(n.kind === 'mufredat.add'){
      if(!R.SinavProfil) return { ok:false, error:'Sınav profili modülü yüklenmedi.' };
      return await R.SinavProfil.teklifUygula(n.payload || {});
    }
    /* BAM'ın bölümlü test kitabı (core/testkitabi.js): her soru AYS'nin
       kendi koduyla yeniden sınanır. */
    if(n.kind === 'kitap.add'){
      if(!R.TestKitabi) return { ok:false, error:'Test kitabı modülü yüklenmedi.' };
      return await R.TestKitabi.teklifUygula(n.payload || {});
    }
    const p = n.payload || {};
    if(!U.isISO(String(p.date || ''))) return { ok:false, error:'Tarih geçersiz.' };

    /* Yük azaltma («yarın hafif», tatil dönüşü): ne kadar azalacağına AYS
       karar verir — tek günlük süre istisnası (core/istisna.js hafiflet). */
    if(n.kind === 'load.reduce'){
      if(!R.Istisna) return { ok:false, error:'İstisna modülü yüklenmedi.' };
      const h = await R.Istisna.hafiflet(p.date, p.ratio, p.why ? 'HKM: ' + p.why : null);
      if(!h.ok) return { ok:false, error:h.why };
      return { ok:true, geriAl:h.id, note:p.date + ' hafifletildi: ders günü ' + h.temel
        + ' dk yerine ' + h.dakika + ' dk. Rehber › İstisnalar\'da durur; «Geri al» ile kalkar.' };
    }

    /* Gecersiz sure SINIRLANDIRILMAZ, REDDEDILIR. Onceki hal -5 dakikayi
       10 dakikaya cekiyordu: kullanicinin gormedigi bir sayiyi uydurup
       plana yazmak, teklifi sessizce baska bir teklife cevirmektir. */
    const dk = Number(p.minutes);
    if(!isFinite(dk) || dk <= 0 || dk > 480){
      return { ok:false, error:'Süre geçersiz (5–480 dakika bekleniyor).' };
    }

    /* Konu ile DERS ayri alanlardir. Onceki hal ikisine de dersi yazip
       «Türev» bilgisini sessizce düşürüyordu. */
    const ders = String(p.subject || 'Genel').slice(0, 40);
    const konu = String(p.topic || p.subject || 'Genel').slice(0, 80);
    const gun = await R.Model.ensureDay(p.date);
    gun.blocks = (gun.blocks || []).concat([{
      id:U.uid('b'),
      slot:'HKM teklifi',
      subject:ders,
      topic:konu,
      targetMin:Math.round(dk), targetQ:0, status:'pending',
      subjectId:null, topicId:null,
      actualMin:null, actualQ:null, correctQ:null,
      skipReason:null, startedAt:null,
    }]);
    await R.Model.saveDay(p.date);
    return { ok:true, note:p.date + ' gününe ' + Math.round(dk)
      + ' dakikalık blok eklendi (' + konu + ').' };
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
      await markIntent(n.id, durum, false, not);
      const bildirim = await answerIntent(n.id, durum);
      if(bildirim.ok) await markIntent(n.id, durum, true, not);
      return { ok:true, applied:uygulandi, state:durum,
        reported:!!bildirim.ok, note:not, geriAl:geriAl };
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
    kayitOku, resolveIntent, intentLog, markIntent, forgetIntent, flushIntentReports,
    intentDoubts, clearDoubt,
    MODULE, CONTRACT, ASGARI_ARA_DK };
})();
