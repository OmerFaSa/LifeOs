/* HKM isareti — istege bagli katman, zorunlu sinirlarla.

   Bu paket bir ozelligi degil bir SOZU korur: AYS, HKM kapaliyken,
   yavasken ya da yokken oldugu gibi calisir. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const B = () => R.Beacon;
  const BUGUN = R.U.todayISO();
  const DUN = R.U.iso(R.U.addDays(R.U.parse(BUGUN), -1));

  /* Gercek fetch'i hicbir test cagirmaz: agla konusan bir birim testi,
     olcmedigi bir seye bagli olur. */
  async function withFetch(fn, cevap){
    const eski = window.fetch;
    const cagri = [];
    window.fetch = function(url, opt){
      cagri.push({ url, opt });
      if(cevap instanceof Error) return Promise.reject(cevap);
      return Promise.resolve(cevap || { status:202 });
    };
    try{ await fn(cagri); }
    finally{ window.fetch = eski; }
  }

  async function ayarla(patch){
    await B().save(Object.assign({ enabled:true, token:'jeton',
      url:'http://127.0.0.1:4200', lastAt:null, lastOkAt:null,
      lastStatus:null, lastNote:'' }, patch || {}));
  }

  /* Gecmis testleri OLCULMUS bir gun ister: bos bir ambarda hicbir gun
     gonderilmez ve test kendi kendini bosa cikarir. */
  function olculmusGun(){
    R.S.days[BUGUN] = Object.assign(R.S.days[BUGUN] || {}, { date:BUGUN,
      blocks:[{ id:'b1', slot:'Ders', status:'done', actualQ:20, actualMin:45,
        correctQ:15 }], paragraphActual:10, problemActual:5 });
  }

  describe('HKM işareti — sınırlar', () => {

    /* Kullanicinin secmedigi bir gonderim varsayilan olamaz. */
    it('varsayılan kapalıdır ve kapalıyken ağa çıkmaz', async () => {
      resetState();
      await B().save({ enabled:false, token:'jeton' });
      await withFetch(async cagri => {
        const r = await B().send();
        expect(r.ok).toBe(false);
        expect(r.reason).toBe('off');
        expect(cagri.length).toBe(0);
      });
    });

    it('jeton yoksa gönderim denenmez', async () => {
      resetState();
      await ayarla({ token:'' });
      await withFetch(async cagri => {
        const r = await B().send();
        expect(r.reason).toBe('no-token');
        expect(cagri.length).toBe(0);
      });
    });

    /* Jeton agda acik gitmez. */
    it('yerel olmayan düz http adresine gönderilmez', async () => {
      resetState();
      await ayarla({ url:'http://sunucu.example.com:4200' });
      await withFetch(async cagri => {
        const r = await B().send({ force:true });
        expect(r.reason).toBe('unsafe-url');
        expect(cagri.length).toBe(0);
      });
      expect(B().urlOk('http://127.0.0.1:4200')).toBe(true);
      expect(B().urlOk('http://localhost:4200')).toBe(true);
      expect(B().urlOk('https://ev.example.com')).toBe(true);
      expect(B().urlOk('http://192.168.1.20:4200')).toBe(false);
    });

    /* Ag hatasi bir arayuz hatasi degildir. */
    it('ağ hatası fırlatmaz, durum olarak yazılır', async () => {
      resetState();
      await ayarla();
      await withFetch(async () => {
        const r = await B().send({ force:true });
        expect(r.ok).toBe(false);
        expect(r.status).toBe(0);
      }, new Error('bağlantı yok'));
      expect(B().settings().lastStatus).toBe(0);
      expect(B().settings().lastOkAt).toBe(null);
    });

    it('başarılı gönderim işaretlenir', async () => {
      resetState();
      await ayarla();
      await withFetch(async cagri => {
        const r = await B().send({ force:true });
        expect(r.ok).toBe(true);
        expect(cagri.length).toBe(1);
        expect(cagri[0].url.indexOf('/api/sync/ays') > 0).toBe(true);
        expect(cagri[0].opt.headers.Authorization).toBe('Bearer jeton');
      });
      expect(B().settings().lastStatus).toBe(202);
      expect(!!B().settings().lastOkAt).toBe(true);
    });

    /* Kisit bir hiz siniri degil, gurultu sinirid1r. */
    it('aynı özet arka arkaya gönderilmez', async () => {
      resetState();
      await ayarla();
      await withFetch(async cagri => {
        await B().send({ force:true });
        const r = await B().send();
        expect(r.reason).toBe('throttled');
        expect(cagri.length).toBe(1);
      });
    });

    it('aralık dolunca yeniden gönderilir', async () => {
      resetState();
      const eski = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
      await ayarla({ lastAt:eski, intervalMinutes:60 });
      expect(B().due(Date.now())).toBe(true);
      await ayarla({ lastAt:new Date().toISOString(), intervalMinutes:60 });
      expect(B().due(Date.now())).toBe(false);
    });

    /* Isaret, akisi asla bozmaz: ping soz vermez ve firlatmaz. */
    it('ping hiçbir koşulda fırlatmaz', async () => {
      resetState();
      await ayarla();
      await withFetch(async () => {
        expect(B().ping()).toBe(undefined);
      }, new Error('kopuk'));
    });
  });

  describe('HKM işareti — sözleşme', () => {

    it('her metrik kesinlik etiketi taşır', () => {
      resetState();
      const p = B().payload(BUGUN);
      expect(B().contract(p).length).toBe(0);
      Object.keys(p.metrics).forEach(k => {
        const m = p.metrics[k];
        expect(['measured', 'estimated', 'computed', 'missing'].indexOf(m.cert) >= 0)
          .toBe(true);
      });
    });

    /* Eksik veri SIFIR DEGILDIR. */
    it('veri yokken alan sıfır değil «veri yok» gider', () => {
      resetState();
      const m = B().payload(BUGUN).metrics;
      const bos = Object.keys(m).filter(k => m[k].cert === 'missing');
      expect(bos.length > 0).toBe(true);
      bos.forEach(k => expect(m[k].value).toBe(null));
    });

    it('bilinmeyen etiket sessizce ölçüme dönüşmez', () => {
      expect(B().metric(5, 'uydurma').cert).toBe(null);
      expect(B().metric(5, 'derived').cert).toBe('computed');
      expect(B().metric(null, 'measured').cert).toBe('missing');
    });

    it('bozuk gövde sözleşmeden geçmez ve yola çıkmaz', async () => {
      resetState();
      expect(B().contract({ module:'ays', date:BUGUN,
        metrics:{ x:{ value:5 } } }).length).toBe(1);
      expect(B().contract({ module:'ays', date:'13.09.2026',
        metrics:{ x:{ value:5, cert:'measured' } } }).length).toBe(1);
      expect(B().contract({ module:'baska', date:BUGUN,
        metrics:{ x:{ value:5, cert:'measured' } } }).length).toBe(1);
      expect(B().contract({ module:'ays', date:BUGUN, metrics:{} }).length).toBe(1);
    });

    /* Giden sey gunun OZETIDIR: icerik gitmez. */
    it('gövde yalnızca sayı taşır, içerik taşımaz', () => {
      resetState();
      const p = B().payload(BUGUN);
      expect(Object.keys(p.metrics).sort().join(',')).toBe('exam_days_left,mock_net,mock_net_baseline,questions,study_minutes');
      const metin = JSON.stringify(p);
      expect(metin.length < 1200).toBe(true);
      Object.keys(p.metrics).forEach(k => {
        const v = p.metrics[k].value;
        expect(v === null || typeof v === 'number').toBe(true);
      });
    });

    it('önizleme kullanıcıya etiketiyle gösterilir', () => {
      resetState();
      const on = B().preview(BUGUN);
      expect(on.rows.length).toBe(Object.keys(on.payload.metrics).length);
      on.rows.forEach(r => expect(!!r.label).toBe(true));
      expect(on.errors.length).toBe(0);
    });
  });

  describe('HKM işareti — eşleme', () => {

    it('yerel olmayan adrese eşleme yapılmaz', async () => {
      resetState();
      const r = await B().pair('http://sunucu.example.com:4200');
      expect(r.ok).toBe(false);
      expect(r.note.indexOf('Yerel olmayan') >= 0).toBe(true);
    });

    it('pencere kapalıysa jeton alınmaz ve işaret açılmaz', async () => {
      resetState();
      await B().save({ enabled:false, token:'' });
      const eski = window.fetch;
      window.fetch = function(){
        return Promise.resolve({ status:403,
          json:function(){ return Promise.resolve({ error:'kapali' }); } });
      };
      try{
        const r = await B().pair('http://127.0.0.1:4200');
        expect(r.ok).toBe(false);
        expect(B().settings().enabled).toBe(false);
        expect(B().settings().token).toBe('');
      } finally { window.fetch = eski; }
    });

    it('açık pencerede jeton saklanır ve işaret açılır', async () => {
      resetState();
      await B().save({ enabled:false, token:'' });
      const eski = window.fetch;
      const cagri = [];
      window.fetch = function(url, opt){
        cagri.push({ url, opt });
        return Promise.resolve({ status:200,
          json:function(){ return Promise.resolve({ token:'jeton-esleme' }); } });
      };
      try{
        const r = await B().pair('http://127.0.0.1:4200/');
        expect(r.ok).toBe(true);
        expect(cagri[0].url).toBe('http://127.0.0.1:4200/api/pair');
        expect(cagri[0].opt.method).toBe('POST');
        const a = B().settings();
        expect(a.token).toBe('jeton-esleme');
        expect(a.enabled).toBe(true);
        expect(a.url).toBe('http://127.0.0.1:4200');
      } finally { window.fetch = eski; }
    });

    /* Ag hatasi bir arayuz hatasi degildir. */
    it('HKM kapalıyken eşleme sessizce başarısız olur', async () => {
      resetState();
      const eski = window.fetch;
      window.fetch = function(){ return Promise.reject(new Error('kopuk')); };
      try{
        const r = await B().pair('http://127.0.0.1:4200');
        expect(r.ok).toBe(false);
        expect(r.note.indexOf('ulaşılamadı') >= 0).toBe(true);
      } finally { window.fetch = eski; }
    });
  });


  describe('HKM işareti — kapsam ve geçmiş', () => {

    it('varsayılan kapsam özettir', () => {
      resetState();
      expect(B().levelOf()).toBe('ozet');
      expect(B().LEVELS.length).toBe(2);
    });

    it('gelişmiş kapsam daha çok alan gönderir, içerik göndermez', async () => {
      resetState();
      const az = Object.keys(B().payload(BUGUN).metrics).length;
      await B().save({ level:'gelismis' });
      const p = B().payload(BUGUN);
      expect(Object.keys(p.metrics).length > az).toBe(true);
      expect(B().contract(p).length).toBe(0);
      /* İçerik yok: her değer sayı ya da null. */
      Object.keys(p.metrics).forEach(k => {
        const v = p.metrics[k].value;
        expect(v === null || typeof v === 'number').toBe(true);
      });
    });

    /* Bugunku degeri dunun tarihiyle yollamak, ambara SAHTE bir olcum
       yazmaktir: bugunden turetilen alanlar gecmis gunde gitmez. */
    it('bugünden türetilen alan geçmiş güne yazılmaz', async () => {
      resetState();
      await B().save({ level:'gelismis' });
      const bugun = B().payload(BUGUN).metrics;
      const dun = B().payload(DUN).metrics;
      const bugunden = ['cards_total', 'cards_due', 'errors_open'];
      bugunden.forEach(k => {
        if(bugun[k] === undefined) return;
        const d = dun[k];
        expect(d === undefined || d.cert === 'missing').toBe(true);
      });
    });

    it('geçmiş gönderimi kapalıyken ağa çıkmaz', async () => {
      resetState();
      await B().save({ enabled:false, token:'jeton' });
      const eski = window.fetch;
      const cagri = [];
      window.fetch = function(){ cagri.push(1); return Promise.resolve({ status:202 }); };
      try{
        const r = await B().backfill(5);
        expect(r.ok).toBe(false);
        expect(r.reason).toBe('off');
        expect(cagri.length).toBe(0);
      } finally { window.fetch = eski; }
    });

    /* Bos bir govde, ambarda «o gun olculdu ama her sey bostu» izlenimi
       birakir — olculmemis gun GONDERILMEZ. */
    it('ölçümsüz gün gönderilmez', async () => {
      resetState();
      await B().save({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' });
      const eski = window.fetch;
      const cagri = [];
      window.fetch = function(url, opt){
        cagri.push(JSON.parse(opt.body));
        return Promise.resolve({ status:202 });
      };
      try{
        const r = await B().backfill(7);
        expect(r.ok).toBe(true);
        expect(cagri.length).toBe(r.sent);
        cagri.forEach(g => {
          /* «Hesaplandı» yetmez: en az bir ÖLÇÜLMÜŞ alan olmalı. */
          const dolu = Object.keys(g.metrics)
            .some(k => g.metrics[k].cert === 'measured');
          expect(dolu).toBe(true);
        });
      } finally { window.fetch = eski; }
    });

    it('geçmiş gönderimi ilk hatada durur', async () => {
      resetState();
      olculmusGun();
      await B().save({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' });
      const eski = window.fetch;
      window.fetch = function(){ return Promise.resolve({ status:401 }); };
      try{
        const r = await B().backfill(30);
        expect(r.ok).toBe(false);
        expect(r.status).toBe(401);
        expect(r.sent).toBe(0);
      } finally { window.fetch = eski; }
    });

    it('ölçülmüş gün gerçekten gönderilir', async () => {
      resetState();
      olculmusGun();
      await B().save({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' });
      const eski = window.fetch;
      const cagri = [];
      window.fetch = function(url, opt){
        cagri.push(JSON.parse(opt.body));
        return Promise.resolve({ status:202 });
      };
      try{
        const r = await B().backfill(3);
        expect(r.ok).toBe(true);
        expect(r.sent >= 1).toBe(true);
        expect(cagri[cagri.length - 1].date).toBe(BUGUN);
      } finally { window.fetch = eski; }
    });
  });

})();
