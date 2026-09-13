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
    try{ AYAR = (await ESP.Store.get('hkm')) || {}; }
    catch(e){ AYAR = {}; }
    return settings();
  }

  async function save(patch){
    AYAR = Object.assign({}, settings(), patch || {});
    await ESP.Store.set('hkm', AYAR);
    return settings();
  }

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

    const ret = ESP.SRS.retention(null, d);
    out.retention = metric(ret.value, ret.cert);
    out.retention_cards = ret.n ? metric(ret.n, 'computed') : metric(null, 'missing');

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

  /* Ateşle ve unut: arayüz akışlarının çağırdığı biçim. Söz vermez,
     beklemez, hata fırlatmaz. */
  function ping(opts){
    try{
      const p = send(opts);
      if(p && typeof p.catch === 'function') p.catch(function(){});
    }catch(e){ /* işaret, akışı asla bozmaz */ }
  }

  return { load, save, settings, collect, payload, preview, contract, metric,
    urlOk, due, send, ping, MODULE, CONTRACT, LABELS, ASGARI_ARA_DK };
})();
