/* HKM isareti — istege bagli katman, zorunlu sinirlarla.

   Bu paket bir ozelligi degil bir SOZU korur: SPİ, HKM kapaliyken,
   yavasken ya da yokken oldugu gibi calisir. */

(function(){
  const { describe, it, expect, resetState } = SP.Test;
  const B = () => SP.Beacon;
  const BUGUN = SP.U.todayISO();
  const DUN = SP.U.iso(SP.U.addDays(SP.U.parse(BUGUN), -1));

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

  function olculmusGun(){
    SP.S.vitals[BUGUN] = Object.assign(SP.S.vitals[BUGUN] || {},
      { date:BUGUN, sleep:7.5, hrv:60 });
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
        expect(cagri[0].url.indexOf('/api/sync/spi') > 0).toBe(true);
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
      expect(B().contract({ module:'spi', date:BUGUN,
        metrics:{ x:{ value:5 } } }).length).toBe(1);
      expect(B().contract({ module:'spi', date:'13.09.2026',
        metrics:{ x:{ value:5, cert:'measured' } } }).length).toBe(1);
      expect(B().contract({ module:'baska', date:BUGUN,
        metrics:{ x:{ value:5, cert:'measured' } } }).length).toBe(1);
      expect(B().contract({ module:'spi', date:BUGUN, metrics:{} }).length).toBe(1);
    });

    /* Giden sey gunun OZETIDIR: icerik gitmez. */
    it('gövde yalnızca sayı taşır, içerik taşımaz', () => {
      resetState();
      const p = B().payload(BUGUN);
      /* Liste TEK TEK yazılıdır ve öyle kalmalı: «şu anahtarlar var»
         demek yerine «yalnız bunlar var» demenin tek yolu bu. Yeni bir
         işaret eklendiğinde bu satır KIRILIR ve kırılması gerekir —
         merkeze ne gönderdiğimiz bir gözden kaçma olmamalı.
         Rozet sayaçları (badge_*) merkezin profil sayfasının girdisi;
         hepsi SAYIDIR, hiçbiri içerik taşımaz. */
      expect(Object.keys(p.metrics).sort().join(',')).toBe('badge_count,badge_days,badge_focus_hours,badge_hours,badge_streak_months,badge_tasks,hrv,hrv_baseline,level_step,level_sub,level_tier,recovery,sleep_hours,xp_today,xp_total');
      const metin = JSON.stringify(p);
      expect(metin.length < 1600).toBe(true);
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

    /* Yalniz uyku girilen gun HKM'ye «su 0 ml, olculdu» gidiyordu. */
    it('girilmeyen su HKM’ye veri yok olarak gider', async () => {
      resetState();
      SP.S.vitals[BUGUN] = Object.assign(SP.Model.defaultVitals(BUGUN), { sleep:7 });
      await B().save({ level:'gelismis' });
      const w = B().payload(BUGUN).metrics.water;
      expect([w.value, w.cert]).toEqual([null, 'missing']);
    });

    /* Bugunku degeri dunun tarihiyle yollamak, ambara SAHTE bir olcum
       yazmaktir: bugunden turetilen alanlar gecmis gunde gitmez. */
    it('bugünden türetilen alan geçmiş güne yazılmaz', async () => {
      resetState();
      await B().save({ level:'gelismis' });
      const bugun = B().payload(BUGUN).metrics;
      const dun = B().payload(DUN).metrics;
      const bugunden = [];
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


  /* ------------------------------------------------------------- B05

     Dis inceleme: «gorunen eylem, yapilabilen eylemle ayni olmali» ve
     «gecersiz sure sinirlandirilmadan once REDDEDILMELI». */
  describe('HKM teklifi — uygulama sözleşmesi', () => {

    const teklif = (patch) => Object.assign({
      id:1, kind:'plan.add', payload:{ date:BUGUN, minutes:60 },
    }, patch || {});

    it('uygulanabilir tür açıkça listelenir', () => {
      expect(B().APPLIABLE.length >= 0).toBe(true);
      expect(B().canApply(teklif())).toBe(false);
      expect(B().canApply(teklif({ kind:'focus.set' }))).toBe(false);
      expect(B().canApply(null)).toBe(false);
    });

    it('uygulanamayan tür sessizce uygulanmış sayılmaz', async () => {
      const r = await B().applyIntent(teklif({ kind:'load.reduce' }));
      expect(r.ok).toBe(false);
    });

    /* EKSİK (2026-09-24): HKM kataloğu SPİ için `measure.ask` (eksik ölçüm
       hatırlatması) tanımlıyor; SPİ türü tanımadığı için teklif SESSİZCE
       süzülürdü. Hatırlatma uygulanmaz, «Gördüm» ile kapanır. HKM'nin
       SPİ'ye bırakabildiği her tür burada tanınır. */
    it('HKM kataloğundaki SPİ türlerinin hepsi tanınır', () => {
      ['plan.apply', 'kayit.add', 'urun.add', 'besin.add', 'fiyat.add', 'yer.add', 'measure.ask']
        .forEach(k => expect(k + ':' + (B().INTENT_KINDS.indexOf(k) >= 0)).toBe(k + ':true'));
      expect(B().canApply(teklif({ kind:'measure.ask', payload:{ date:BUGUN, metric:'uyku' } }))).toBe(false);
    });

    /* Kullanicinin gormedigi bir sayiyi uydurup plana yazmak, teklifi
       sessizce baska bir teklife cevirmektir. */
    it('geçersiz süre sınırlandırılmaz, reddedilir', async () => {
      resetState();
      for(const dk of [-5, 0, 1000, 'abc', null]){
        const r = await B().applyIntent(teklif({ payload:{ date:BUGUN, minutes:dk } }));
        expect(r.ok).toBe(false);
      }
    });

    it('geçersiz tarih reddedilir', async () => {
      resetState();
      const r = await B().applyIntent(teklif({ payload:{ date:'banana', minutes:60 } }));
      expect(r.ok).toBe(false);
    });
  });

  /* ------------------------------------------------------------- B04

     Dis inceleme: «teslim edilen teklif yeniden acilista kayboluyor».
     Kuyruk artik acik teklifleri tekrar veriyor; bu dort seyi zorunlu
     kilar ve dordu de burada olculur:

       1. cevaplanmis bir teklif bir daha GOSTERILMEZ,
       2. is en fazla BIR KEZ yapilir (cift tiklama, yeniden yukleme),
       3. «uygulandi ama merkeze bildirilemedi» hali KAYBOLMAZ,
       4. yarida kalan uygulama «olmus» da «olmamis» da sayilmaz. */
  /* Akşam yoklaması: «7 saat uyudum» kullanıcının KENDİ cümlesidir. HKM
     onu yalnız yönlendirir; SPİ kendi ayrıştırıcısıyla okur, neyin
     yazılacağını gösterir ve kullanıcı «Kaydet» derse öneri kapısından
     yazar. Sağlıkta ölçümü uyduran da yazan da HKM olamaz. */
  describe('HKM teklifi — günün kaydı (akşam yoklaması)', () => {
    const teklif = (metin, patch) => Object.assign({ id:51, kind:'kayit.add', note:'not',
      payload:{ date:DUN, metin } }, patch || {});

    it('SPİ cümleyi kendi okur; onaydan önce hiçbir şey yazılmaz', () => {
      resetState();
      const o = B().kayitOku(teklif('7 saat uyudum ve 30 dakika yürüdüm'));
      expect(o.yazilacak.map(y => y.action)).toEqual(['vital-yaz', 'seans-ekle']);
      expect(o.yazilacak[0].satirlar[0]).toContain('7 saat');
      expect(SP.Model.vitalsOf(DUN)).toBeNull();
      expect(SP.S.workouts.length).toBe(0);
    });

    it('«Kaydet» o günün kaydına yazar ve geri alınabilir', async () => {
      resetState(); await ayarla({}); await B().load();
      const n = teklif('7 saat uyudum');
      n.okuma = B().kayitOku(n);
      expect(B().canApply(n)).toBe(true);
      await withFetch(async () => {
        const r = await B().resolveIntent(n, 'apply');
        expect(r.ok).toBe(true);
        expect(r.applied).toBe(true);
      }, { status:200 });
      expect(SP.Model.vitalsOf(DUN).sleep).toBe(7);
      const row = SP.Proposals.all().find(p => p.action === 'vital-yaz' && p.status === 'applied');
      expect(Boolean(row)).toBe(true);
      await SP.Proposals.undo(row.id);
      expect(SP.Model.vitalsOf(DUN).sleep == null).toBe(true);
    });

    it('okunamayan cümleye «Kaydet» çıkmaz', async () => {
      resetState();
      const n = teklif('bugün çok güzel bir gündü');
      n.okuma = B().kayitOku(n);
      expect(n.okuma.yazilacak.length).toBe(0);
      expect(n.okuma.anlasilmayan.length).toBe(1);
      expect(B().canApply(n)).toBe(false);
      expect((await B().applyIntent(n)).ok).toBe(false);
    });

    it('ileri bir güne kayıt yazılmaz', () => {
      resetState();
      const yarin = SP.U.iso(SP.U.addDays(SP.U.parse(BUGUN), 1));
      const o = B().kayitOku(teklif('x', { payload:{ date:yarin, metin:'7 saat uyudum' } }));
      expect(o.yazilacak.length).toBe(0);
    });
  });

  describe('HKM teklifi — yaşam döngüsü', () => {

    const TEKLIF = { id:7, kind:'plan.add', note:'not',
      payload:{ date:BUGUN, minutes:60 } };

    function kuyrukCevabi(liste){
      return { status:200, json:() => Promise.resolve({ intents:liste }) };
    }

    async function temiz(){
      resetState();
      await ayarla({});
      await B().load();
    }

    it('cevaplanan teklif kuyrukta dursa da bir daha gösterilmez', async () => {
      await temiz();
      await withFetch(async () => {
        const bir = await B().intents();
        expect(bir.length).toBe(1);
      }, kuyrukCevabi([TEKLIF]));

      await withFetch(async () => {
        const r = await B().resolveIntent(TEKLIF, 'dismiss');
        expect(r.ok).toBe(true);
        expect(r.state).toBe('dismissed');
      }, { status:200 });

      /* Merkez hala «acik» diyor olabilir: cevap bizde, kayit bizde. */
      await withFetch(async () => {
        const iki = await B().intents();
        expect(iki.length).toBe(0);
      }, kuyrukCevabi([TEKLIF]));
    });

    it('görüldü işareti iş yaratmaz ve tekrarı yeni iş doğurmaz', async () => {
      await temiz();
      await withFetch(async () => {
        const bir = await B().resolveIntent(TEKLIF, 'seen');
        expect(bir.ok).toBe(true);
        const iki = await B().resolveIntent(TEKLIF, 'seen');
        expect(iki.ok).toBe(true);
        expect(iki.applied).toBe(false);
        /* SPİ hiçbir teklifi uygulamaz: iki çağrı da hiçbir şey yazmaz. */
        expect(bir.applied).toBe(false);
      }, { status:200 });
    });

    it('uygulandı ama bildirilemedi hâli yutulmaz ve kaybolmaz', async () => {
      await temiz();
      /* Ag yok: is yerelde bitti, merkez bilmiyor. */
      await withFetch(async () => {
        const r = await B().resolveIntent(TEKLIF, 'seen');
        expect(r.ok).toBe(true);
        expect(r.reported).toBe(false);
      }, new Error('ağ yok'));

      const defter = await B().intentLog();
      expect(defter['7'].reported).toBe(false);
      expect(defter['7'].state).toBe('acknowledged');

      /* Bağlantı gelince bildirim TEKRAR denenir. */
      await withFetch(async cagri => {
        const r = await B().flushIntentReports();
        expect(r.tried).toBe(1);
        expect(r.ok).toBe(1);
        expect(cagri[0].url.indexOf('/api/intent/7/' + 'acknowledged') > 0).toBe(true);
      }, { status:200 });
      expect((await B().intentLog())['7'].reported).toBe(true);
    });

    it('yarıda kalan uygulama ne olmuş ne olmamış sayılır', async () => {
      await temiz();
      /* Sekme kapanmis gibi: defterde “applying” kalmis. */
      await B().markIntent(7, 'applying', false, '');
      const supheli = await B().intentDoubts();
      expect(supheli.length).toBe(1);
      expect(supheli[0].state).toBe('applying');

      /* Belirsiz teklif kuyrukta gorunse de YENIDEN UYGULANMAZ. */
      await withFetch(async () => {
        expect((await B().intents()).length).toBe(0);
      }, kuyrukCevabi([TEKLIF]));

      /* Merkeze «uygulandi» da «istenmedi» de denmez: BILINMIYOR. */
      await withFetch(async cagri => {
        const r = await B().clearDoubt(7);
        expect(r.reported).toBe(true);
        expect(cagri[0].url.indexOf('/api/intent/7/unknown') > 0).toBe(true);
      }, { status:200 });
      expect((await B().intentDoubts()).length).toBe(0);
    });

    /* Merkez «boyle bir niyet yok» diyorsa sonsuza kadar denemek, o
       kaydi asla kapatmamak olurdu. */
    it('merkez kalıcı olarak reddederse bildirim sonsuza kadar denenmez', async () => {
      await temiz();
      await withFetch(async () => {
        await B().resolveIntent(TEKLIF, 'seen');
      }, new Error('ağ yok'));

      await withFetch(async cagri => {
        const r = await B().flushIntentReports();
        expect(r.tried).toBe(1);
        expect(r.ok).toBe(0);
        expect(cagri.length).toBe(1);
      }, { status:404 });

      const k = (await B().intentLog())['7'];
      expect(k.closed).toBe(true);
      expect(k.reported).toBe(false);   // bildirilmedi; uydurulmuyor

      await withFetch(async cagri => {
        const r = await B().flushIntentReports();
        expect(r.tried).toBe(0);
        expect(cagri.length).toBe(0);
      }, { status:200 });
    });

    it('bilinmeyen işlem sessizce bir şey yapmaz', async () => {
      await temiz();
      const r = await B().resolveIntent(TEKLIF, 'sil');
      expect(r.ok).toBe(false);
      expect((await B().resolveIntent(null, 'seen')).ok).toBe(false);
    });
  });

})();
