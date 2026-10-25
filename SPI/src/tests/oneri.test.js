/* Öneri kutusu — ofisin sisteme dokunabildiği tek kapı.

   En kritik test: ONAYSIZ HİÇBİR ŞEY DEĞİŞMEZ. Bir sağlık verisinde
   yanlış kayıt, eksik kayıttan kötüdür — eksik kayıt kendini belli
   eder, yanlış kayıt etmez. */

(function(){
  const { describe, it, expect, resetState, withToday, withTodayAsync,
    pushLab, pushVitals } = SP.Test;
  const U = SP.U;

  describe('Öneri — bileşik cümle', () => {
    it('bağlaçtan yan cümlelere bölünür', () => {
      expect(SP.Proposals.yanCumleler('iki yumurta yedim ve 45 dakika yürüdüm'))
        .toEqual(['iki yumurta yedim', '45 dakika yürüdüm']);
    });

    it('sayının içindeki virgül ayraç değildir', () => {
      /* «7,2 saat uyudum» tek parçadır; bölünürse ölçüm kaybolur. */
      expect(SP.Proposals.yanCumleler('7,2 saat uyudum')).toHaveLength(1);
    });

    it('birden çok ayraç birlikte çalışır', () => {
      const p = SP.Proposals.yanCumleler('uyku 7 saat, nabız 58 ayrıca 30 dakika yürüdüm');
      expect(p.length >= 3).toBeTruthy();
    });

    it('çok kısa parça düşer', () => {
      expect(SP.Proposals.yanCumleler('a ve b')).toHaveLength(0);
    });
  });

  describe('Öneri — kural motorundan', () => {
    it('tek cümleden tek öneri çıkar', () => {
      resetState();
      withToday('2026-03-01', () => {
        const r = SP.Proposals.fromText('uyku 7,5 saat');
        expect(r.oneriler).toHaveLength(1);
        expect(r.oneriler[0].action).toBe('vital-yaz');
        expect(r.oneriler[0].kaynak).toBe('rules');
      });
    });

    it('BİLEŞİK cümleden İKİ öneri çıkar', () => {
      resetState();
      withToday('2026-03-01', () => {
        const r = SP.Proposals.fromText('uyku 7 saat ve 45 dakika yürüdüm');
        expect(r.oneriler).toHaveLength(2);
        const eylemler = r.oneriler.map(o => o.action).sort();
        expect(eylemler).toEqual(['seans-ekle', 'vital-yaz']);
      });
    });

    it('anlaşılmayan yan cümle SESSİZCE DÜŞMEZ', () => {
      resetState();
      withToday('2026-03-01', () => {
        const r = SP.Proposals.fromText('uyku 7 saat ve bugün hava çok güzeldi');
        expect(r.oneriler).toHaveLength(1);
        expect(r.anlasilmayan.length).toBe(1);
        expect(/hava/.test(r.anlasilmayan[0])).toBeTruthy();
      });
    });

    it('hiçbir şey anlaşılmazsa öneri üretilmez', () => {
      resetState();
      withToday('2026-03-01', () => {
        const r = SP.Proposals.fromText('bugün kendimi iyi hissediyorum diyebilirim');
        expect(r.oneriler).toHaveLength(0);
      });
    });

    it('model gerekmez — çevrimdışı çalışır', () => {
      resetState();
      SP.S.office = null;                       /* sağlayıcı yok */
      withToday('2026-03-01', () => {
        expect(SP.Proposals.fromText('nabız 58').oneriler).toHaveLength(1);
      });
    });
  });

  describe('Öneri — doğrulama', () => {
    it('katalog dışı eylem reddedilir', () => {
      const c = SP.Proposals.check({ action:'her-seyi-sil', params:{} });
      expect(c.ok).toBeFalsy();
    });

    it('olmayan bir gıda önerisi geçmez', () => {
      resetState();
      const c = SP.Proposals.check({ action:'ogun-ekle',
        params:{ items:[{ foodId:'ejderha-meyvesi-uydurma', g:100 }], date:'2026-03-01' } });
      expect(c.ok).toBeFalsy();
    });

    it('olmayan bir biyobelirteç önerisi geçmez', () => {
      resetState();
      const c = SP.Proposals.check({ action:'olcum-gir',
        params:{ rows:[{ markerId:'uydurma-degeri', value:5 }], date:'2026-03-01' } });
      expect(c.ok).toBeFalsy();
    });

    it('akıl dışı süre reddedilir ve NEDENİ söylenir', () => {
      const c = SP.Proposals.check({ action:'seans-ekle',
        params:{ minutes:900, date:'2026-03-01' } });
      expect(c.ok).toBeFalsy();
      expect(c.why.length > 10).toBeTruthy();
    });

    it('şiddet bandın dışındaysa geçmez', () => {
      const c = SP.Proposals.check({ action:'semptom-isaretle',
        params:{ symptomId:'yorgunluk', severity:9, date:'2026-03-01' } });
      expect(c.ok).toBeFalsy();
    });

    it('önizleme ÖNCE ve SONRA taşır', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushVitals('2026-03-01', { sleep:6 });
        const pv = SP.Proposals.preview({ action:'vital-yaz',
          params:{ field:'sleep', value:8, date:'2026-03-01' } });
        expect(pv.ok).toBeTruthy();
        expect(pv.rows[0].once.indexOf('6') >= 0).toBeTruthy();
        expect(pv.rows[0].sonra.indexOf('8') >= 0).toBeTruthy();
      });
    });
  });

  describe('Öneri — modelden', () => {
    it('uydurulan parametre kullanıcıya HİÇ gösterilmez', () => {
      resetState();
      const r = SP.Proposals.fromModel({ actions:[
        { action:'ogun-ekle', params:{ items:[{ foodId:'yok-boyle-bir-gida', g:100 }] } },
      ] }, { date:'2026-03-01' });
      expect(r.oneriler).toHaveLength(0);
      expect(r.dusen).toHaveLength(1);
    });

    it('katalog dışı eylem düşer', () => {
      const r = SP.Proposals.fromModel({ actions:[{ action:'profili-sil', params:{} }] });
      expect(r.oneriler).toHaveLength(0);
    });

    it('geçerli öneri geçer', () => {
      resetState();
      const r = SP.Proposals.fromModel({ actions:[
        { action:'vital-yaz', params:{ field:'sleep', value:7 } },
      ] }, { date:'2026-03-01' });
      expect(r.oneriler).toHaveLength(1);
      expect(r.oneriler[0].kaynak).toBe('model');
    });

    it('bozuk JSON çökertmez', () => {
      const r = SP.Proposals.fromModel('{bu json değil');
      expect(r.oneriler).toHaveLength(0);
      expect(typeof r.hata).toBe('string');
    });

    /* Modelin öneremeyeceği (büyük) eylem tarifte YOKTUR: tarifte duran
       bir eylemi model önerir; önermemesi gerekeni ona göstermemek gerekir. */
    it('katalog tarifi modelin önerebileceği her eylemi sayar, öneremeyeceğini saymaz', () => {
      const t = SP.Proposals.catalogPrompt();
      SP.Proposals.katalogIdleri().forEach(id => {
        const yok = !!SP.Proposals.eylem(id).modelYok;
        expect(t.indexOf('- ' + id + ' ') >= 0).toBe(!yok);
      });
    });
  });

  describe('Öneri — onay, uygulama ve geri alma', () => {
    it('ONAYSIZ hiçbir şey değişmez', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        const r = SP.Proposals.fromText('uyku 7,5 saat');
        await SP.Proposals.propose(r.oneriler[0]);
        /* Öneri kutuda duruyor ama uygulanmadı. */
        expect(SP.Proposals.pending()).toHaveLength(1);
        const v = SP.Model.vitalsOf('2026-03-01');
        expect(v == null || v.sleep == null).toBeTruthy();
      });
    });

    it('onaylanınca yazılır', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        const r = SP.Proposals.fromText('uyku 7,5 saat');
        const p = await SP.Proposals.propose(r.oneriler[0]);
        const res = await SP.Proposals.approve(p.id);
        expect(res.ok).toBeTruthy();
        expect(SP.Model.vitalsOf('2026-03-01').sleep).toBe(7.5);
      });
    });

    it('geri alınınca ESKİ değere döner', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        pushVitals('2026-03-01', { sleep:6 });
        const r = SP.Proposals.fromText('uyku 8 saat');
        const p = await SP.Proposals.propose(r.oneriler[0]);
        await SP.Proposals.approve(p.id);
        expect(SP.Model.vitalsOf('2026-03-01').sleep).toBe(8);
        const u = await SP.Proposals.undo(p.id);
        expect(u.ok).toBeTruthy();
        expect(SP.Model.vitalsOf('2026-03-01').sleep).toBe(6);
      });
    });

    it('reddedilen öneri uygulanmaz', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        const r = SP.Proposals.fromText('nabız 58');
        const p = await SP.Proposals.propose(r.oneriler[0]);
        await SP.Proposals.reject(p.id);
        const res = await SP.Proposals.approve(p.id);
        expect(res.ok).toBeFalsy();
        const v = SP.Model.vitalsOf('2026-03-01');
        expect(v == null || v.rhr == null).toBeTruthy();
      });
    });

    it('aynı öneri iki kez uygulanmaz', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        const r = SP.Proposals.fromText('45 dakika yürüdüm');
        const p = await SP.Proposals.propose(r.oneriler[0]);
        await SP.Proposals.approve(p.id);
        const ikinci = await SP.Proposals.approve(p.id);
        expect(ikinci.ok).toBeFalsy();
        expect(SP.S.workouts).toHaveLength(1);
      });
    });

    it('arada geçersizleşen öneri uygulanmaz, BAYAT işaretlenir', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        const p = await SP.Proposals.propose({ action:'semptom-isaretle',
          params:{ symptomId:'yorgunluk', severity:2, date:'2026-03-01' }, kaynak:'rules' });
        /* Sözlükten çıkmış gibi davran: öneri artık doğrulanamaz. */
        const yedek = SP.SYMPTOM_BY_ID.yorgunluk;
        delete SP.SYMPTOM_BY_ID.yorgunluk;
        const res = await SP.Proposals.approve(p.id);
        SP.SYMPTOM_BY_ID.yorgunluk = yedek;
        expect(res.ok).toBeFalsy();
        expect(SP.Proposals.all().find(x => x.id === p.id).status).toBe('stale');
      });
    });

    it('geri alınacak bir şey yoksa geri alma başarısız olur', async () => {
      resetState();
      const p = await SP.Proposals.propose({ action:'vital-yaz',
        params:{ field:'sleep', value:7, date:'2026-03-01' }, kaynak:'rules' });
      const u = await SP.Proposals.undo(p.id);
      expect(u.ok).toBeFalsy();
    });

    it('bileşik cümlenin İKİ önerisi de ayrı ayrı onaylanır', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        const r = SP.Proposals.fromText('uyku 7 saat ve 30 dakika yürüdüm');
        const p1 = await SP.Proposals.propose(r.oneriler[0]);
        const p2 = await SP.Proposals.propose(r.oneriler[1]);
        await SP.Proposals.approve(p1.id);
        /* Biri onaylandı, diğeri hâlâ bekliyor. */
        expect(SP.Proposals.pending()).toHaveLength(1);
        await SP.Proposals.approve(p2.id);
        expect(SP.Proposals.pending()).toHaveLength(0);
        expect(SP.Model.vitalsOf('2026-03-01').sleep).toBe(7);
        expect(SP.S.workouts).toHaveLength(1);
      });
    });
  });
})();

/* Hareket ayrıştırma — insanlar isim değil FİİL konuşur.

   En kritik test: tabloda duran bir hareket, cümlede geçtiği hâliyle
   bulunmalı. Bulunmazsa süre kaydedilir ama hareket kaybolur ve seans
   kalıp dengesine, MET değerine, ilerleme merdivenine hiç girmez. */
(function(){
  const { describe, it, expect } = SP.Test;

  describe('Uyku — sayı fiilden ÖNCE', () => {
    /* «7 saat uyudum» sayıyı kelimeden önce söyler. Ayrıştırıcı sayıyı
       yalnız kelimenin ARDINDA arıyordu; bulamayınca cümle «7 saat» süreli
       bir ANTRENMAN oluyordu: 420 dakikalık serbest seans. */
    it('«7 saat uyudum» uykudur, antrenman değil', () => {
      const p = SP.Quick.parse('7 saat uyudum');
      expect(p.kind).toBe('vital');
      expect(p.data.field.id).toBe('sleep');
      expect(p.data.value).toBe(7);
      expect(SP.Quick.parse('dün gece 6,5 saat güzel uyudum').data.value).toBe(6.5);
      expect(SP.Quick.parse('8 saatlik uyku').data.value).toBe(8);
    });

    it('bileşik cümlede uyku ve yürüyüş ayrı kalır', () => {
      const r = SP.Proposals.fromText('7 saat uyudum ve 30 dakika yürüdüm');
      expect(r.oneriler.map(o => o.action)).toEqual(['vital-yaz', 'seans-ekle']);
    });

    it('birimi saat olmayan sayı uyku sayılmaz', () => {
      /* «uyudum» önündeki çıplak sayı saat mi dakika mı bilinmez. */
      expect(SP.Quick.parseVital('20 dakika uyudum')).toBeNull();
      expect(SP.Quick.parseVital('3 kere uyudum')).toBeNull();
    });

    it('su birimiyle okunur; «su 2» 2 ml değildir', () => {
      /* Alan ml tutar. Çıplak sayı eskiden olduğu gibi yazılıyordu
         («su 2» → 2 ml) ve «2 litre su içtim» hiç okunmuyordu. */
      const v = t => { const r = SP.Quick.parseVital(t); return r && r.field.id === 'water' ? r.value : null; };
      expect(v('su 2')).toBe(2000);
      expect(v('2 litre su içtim')).toBe(2000);
      expect(v('1,5 lt su')).toBe(1500);
      expect(v('su 500 ml')).toBe(500);
      expect(v('su 750')).toBe(750);
      /* Bir bardak SP.Quick.BARDAK_ML (250 ml; Bugün'deki bardak düğmesi de
         250 ekler). Eskiden 200 sayılıyordu: düğme ile yazı ayrışıyordu. */
      expect(v('3 bardak su içtim')).toBe(750);
      /* 20–49: ne makul litre ne makul ml — okunmaz, sorulur. */
      expect(v('su 30')).toBe(null);
    });
  });

  describe('Hareket — takma ad eşleşmesi', () => {
    const bekle = (cumle, exId) => {
      const m = SP.Quick.parseMove(cumle);
      expect(Boolean(m)).toBeTruthy();
      expect(m.exercise && m.exercise.id).toBe(exId);
    };

    it('çekimli fiil tabloyla eşleşir', () => {
      bekle('45 dakika yürüdüm', 'yuruyus');
      bekle('30 dk koştum', 'kosu');
      bekle('20 dakika yüzdüm', 'yuzme');
      bekle('15 dk ip atladım', 'ip-atlama');
      bekle('40 dakika bisiklete bindim', 'bisiklet');
      bekle('10 dk merdiven çıktım', 'merdiven');
    });

    it('özgül ad genel addan ÖNCE denenir', () => {
      /* «tempolu yürüyüş» hem «yürüyüş» hem kendisiyle eşleşebilir;
         uzun olan kazanmalı. */
      bekle('1 saat tempolu yürüyüş', 'yuruyus');
    });

    it('genel «esnedim» özgül bir rutine bağlanmaz', () => {
      /* Kullanıcının yapmadığı bir rutini kaydetmek, hiç kaydetmemekten
         kötüdür. */
      bekle('12 dakika esnedim', 'yoga');
    });

    it('tanınmayan hareket SÜREYİ kaybettirmez', () => {
      const m = SP.Quick.parseMove('35 dakika bilmemne yaptım');
      expect(m.minutes).toBe(35);
      expect(m.exercise).toBeNull();
    });

    it('saat dakikaya çevrilir', () => {
      expect(SP.Quick.parseMove('1 saat yürüdüm').minutes).toBe(60);
      expect(SP.Quick.parseMove('1,5 saat koştum').minutes).toBe(90);
    });

    it('her hareketin takma adı vardır', () => {
      SP.EXERCISES.forEach(e => {
        expect(Array.isArray(e.aliases) && e.aliases.length > 0).toBeTruthy();
      });
    });

    it('takma ad indeksi uzundan kısaya sıralıdır', () => {
      const boy = SP.EX_ALIASES.map(x => x.alias.length);
      for(let i = 1; i < boy.length; i++) expect(boy[i] <= boy[i - 1]).toBeTruthy();
    });

    it('iki hareket aynı takma adı paylaşmaz', () => {
      const gorulen = {};
      SP.EXERCISES.forEach(e => (e.aliases || []).forEach(a => {
        const k = SP.U.norm(a);
        expect(gorulen[k] === undefined || gorulen[k] === e.id).toBeTruthy();
        gorulen[k] = e.id;
      }));
    });

    it('üç alan da kapsanır', () => {
      ['cardio', 'strength', 'mobility'].forEach(k => {
        expect(SP.EXERCISES.filter(e => e.kind === k).length >= 5).toBeTruthy();
      });
    });
  });
})();

/* Öğün girişinde gram kaybı — sessiz veri kaybının en kötü biçimi.

   Ayrıştırıcı gramı `g` alanında üretir. Uzun süre `i.grams` okunuyordu
   ve böyle bir alan yok: komut paletinden girilen HER öğün gramsız
   kaydediliyordu. Öğün listede görünüyor ama kalorisi, makrosu ve mikro
   besini sıfır — yani ekranda var, hesapta yok. */
(function(){
  const { describe, it, expect, resetState, withTodayAsync } = SP.Test;

  describe('Öğün — gram kaybı', () => {
    it('ayrıştırıcı gramı `g` alanında verir', () => {
      const r = SP.Parse.parseMeal('200 gram tavuk');
      expect(r.items.length > 0).toBeTruthy();
      expect(typeof r.items[0].g).toBe('number');
      expect(r.items[0].grams).toBe(undefined);
    });

    it('hızlı giriş öğünü GRAMLA yazar', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        const p = SP.Quick.parse('iki yumurta');
        expect(p.kind).toBe('meal');
        await SP.Quick.apply(p, { date:'2026-03-01', slot:'kahvalti' });
        const ogunler = SP.Model.mealsOf('2026-03-01');
        expect(ogunler.length).toBe(1);
        ogunler[0].items.forEach(it => {
          expect(typeof it.g).toBe('number');
          expect(it.g > 0).toBeTruthy();
        });
      });
    });

    it('öneri kutusu öğünü GRAMLA yazar', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        const r = SP.Proposals.fromText('bir kase yoğurt');
        expect(r.oneriler.length).toBe(1);
        const p = await SP.Proposals.propose(r.oneriler[0]);
        const res = await SP.Proposals.approve(p.id);
        expect(res.ok).toBeTruthy();
        SP.Model.mealsOf('2026-03-01')[0].items.forEach(it => {
          expect(it.g > 0).toBeTruthy();
        });
      });
    });

    it('gramsız öğün önerisi DOĞRULAMADAN geçemez', () => {
      resetState();
      const c = SP.Proposals.check({ action:'ogun-ekle',
        params:{ items:[{ foodId:'yumurta', g:undefined }], date:'2026-03-01' } });
      expect(c.ok).toBeFalsy();
    });

    it('kaydedilen öğün kalori üretir', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        const p = SP.Quick.parse('200 gram tavuk');
        await SP.Quick.apply(p, { date:'2026-03-01', slot:'ogle' });
        const t = SP.Nutri.dayTotals('2026-03-01');
        /* Gram kaybolsaydı burası sıfır kalırdı. */
        expect(t.kcal > 0).toBeTruthy();
      });
    });
  });
})();

/* Biyobelirteç → besin bağı.

   Kerem'in bulgusundan Nesrin'in hedefine giden devir bu bağdan çıkar.
   58 ölçümün 42'sinde bağ yoktu ve «unutuldu mu, bilerek mi» sorusu
   cevapsızdı. Artık her ölçüm ya bir bağ taşır ya da NEDEN taşımadığını
   yazar; boş bırakılan bir alan kalmaz. */
(function(){
  const { describe, it, expect, resetState, withToday, pushLab } = SP.Test;

  describe('Ölçüm — besin bağı', () => {
    it('her ölçüm ya bağ taşır ya gerekçe', () => {
      const eksik = SP.BIOMARKERS.filter(b =>
        (!b.nutrients || !b.nutrients.length) && !b.nutrientWhy);
      expect(eksik.map(b => b.id)).toEqual([]);
    });

    it('bağlanan her besin öğesi sözlükte vardır', () => {
      SP.BIOMARKERS.forEach(b => (b.nutrients || []).forEach(n => {
        expect(Boolean(SP.NUTRI_BY_ID[n])).toBeTruthy();
      }));
    });

    it('gerekçe yazan ölçümün bağı BOŞTUR — ikisi bir arada olmaz', () => {
      SP.BIOMARKERS.forEach(b => {
        if(b.nutrientWhy) expect((b.nutrients || []).length).toBe(0);
      });
    });

    it('türetilmiş ORAN ve İNDEKSler bağı girdilerinden alır', () => {
      /* Ayrım kılı kırk yarmak değil: bir ORAN (TG/HDL) ya da bir
         İNDEKS (HOMA-IR, TyG) kendi başına ölçülebilen bir madde
         değildir — bağını girdilerinden alır, ikinci kez sayılmaz.
         Buna karşılık LDL ve TSAT türetilmiş ama GERÇEK birer
         büyüklüktür ve kendi besin kaldıraçları vardır. */
      const oranVeIndeks = ['homa', 'tyg', 'tg_hdl', 'deritis', 'fib4', 'eag',
        'nonhdl', 'egfr', 'ca_corr'];
      oranVeIndeks.forEach(id => {
        const b = SP.BIO_BY_ID[id];
        if(!b) return;
        expect((b.nutrients || []).length).toBe(0);
        expect(typeof b.nutrientWhy).toBe('string');
      });
    });

    it('türetilmiş ama gerçek büyüklükler kendi bağını taşır', () => {
      ['ldl', 'tsat'].forEach(id => {
        const b = SP.BIO_BY_ID[id];
        if(!b) return;
        expect((b.nutrients || []).length > 0).toBeTruthy();
      });
    });

    it('kapsam en az kırk ölçüme çıktı', () => {
      const bagli = SP.BIOMARKERS.filter(b => b.nutrients && b.nutrients.length);
      expect(bagli.length >= 40).toBeTruthy();
    });

    it('devir motoru artık daha çok ölçümden bulgu üretebilir', () => {
      resetState();
      withToday('2026-03-01', () => {
        /* Tiroid ölçümü düşükse iyot/selenyum hedefi Nesrin'e düşer. */
        pushLab('2026-03-01', { ft4:0.5 });
        const h = SP.Office.handoffs().filter(x => x.from === 'lab' && x.to === 'nutri');
        expect(h.length > 0).toBeTruthy();
      });
    });
  });
})();

/* Komut paleti — bileşik cümle her ekrandan.

   Palet uzun süre cümlede TEK şey anlıyordu ve ikinci olgu sessizce
   düşüyordu. Artık öneri kutusu üzerinden geçer. */
(function(){
  const { describe, it, expect, resetState, withToday, withTodayAsync } = SP.Test;

  describe('Palet — hızlı giriş', () => {
    it('üç olguluk cümle üç öneri üretir', () => {
      resetState();
      withToday('2026-03-01', () => {
        const r = SP.Proposals.fromText('uyku 7 saat ve 45 dakika yürüdüm ve 200 gram tavuk yedim');
        expect(r.oneriler).toHaveLength(3);
        expect(r.oneriler.map(o => o.action).sort())
          .toEqual(['ogun-ekle', 'seans-ekle', 'vital-yaz']);
      });
    });

    it('her önerinin bir hedef ekranı vardır', () => {
      /* Kullanıcı yazdığını GÖRMELİ: kayıttan sonra bir yere gidilir. */
      const rota = { 'vital-yaz':'today', 'kestirme-ekle':'today', 'ogun-ekle':'meals', 'seans-ekle':'move',
        'olcum-gir':'labs', 'semptom-isaretle':'today', 'bolum-ac-kapa':'guide',
        'plan-uygula':'today', 'program-ekle':'today', 'hazir-ekle':'today' };
      SP.Proposals.katalogIdleri().forEach(id => {
        expect(typeof rota[id]).toBe('string');
        expect(Boolean(SP.Screens[rota[id]])).toBeTruthy();
      });
    });

    it('tarih değiştirilirse kayıt O GÜNE yazılır', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        const r = SP.Proposals.fromText('uyku 6,5 saat');
        const o = Object.assign({}, r.oneriler[0], {
          params:Object.assign({}, r.oneriler[0].params, { date:'2026-03-05' }) });
        const p = await SP.Proposals.propose(o);
        await SP.Proposals.approve(p.id);
        expect(SP.Model.vitalsOf('2026-03-05').sleep).toBe(6.5);
        const bugun = SP.Model.vitalsOf('2026-03-10');
        expect(bugun == null || bugun.sleep == null).toBeTruthy();
      });
    });

    it('"enerji" ÖLÜ ALANA değil var olan soreness alanına yazar', async () => {
      /* Once `mood` diye AYRI bir alana yaziliyordu: `vitals.mood`
         hicbir ekranda gorunmuyor, `move.js readiness()` onu hic
         okumuyordu. Ayni 1-5 olcegi (5 = zinde) Today ekraninin
         "Bugun nasil hissediyorsun?" sorusuyla ZATEN vardi
         (`vitals.soreness`) — Ctrl+K'nin "enerji"/"mod"/"ruh hali"
         takma adlari o alana baglanmali. */
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        const r = SP.Proposals.fromText('enerji 4');
        expect(r.oneriler).toHaveLength(1);
        expect(r.oneriler[0].params.field).toBe('soreness');
        const p = await SP.Proposals.propose(r.oneriler[0]);
        await SP.Proposals.approve(p.id);
        expect(SP.Model.vitalsOf('2026-03-01').soreness).toBe(4);
        expect(SP.Model.vitalsOf('2026-03-01').mood).toBeUndefined();
      });
    });

    it('bekleyen öneri onaylanana kadar bekleyende kalır', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        const r = SP.Proposals.fromText('nabız 60 ve 20 dakika yüzdüm');
        for(const o of r.oneriler) await SP.Proposals.propose(o);
        expect(SP.Proposals.pending()).toHaveLength(2);
        const ilk = SP.Proposals.pending()[0];
        await SP.Proposals.approve(ilk.id);
        expect(SP.Proposals.pending()).toHaveLength(1);
      });
    });
  });

  /* ==================== seviye ve otomatik uygulama ====================

     AGENTS.md §1.9. Seviyeyi katalog belirler. Kullanicinin KENDI
     cumlesinden kural motorunun cikardigi kucuk kayit sormadan yazilir
     ve geri alinabilir kalir. Tahlil degeri ORTAdir: yanlis okunmus bir
     birim ya da ondalik, saglik verisinde eksik kayittan kotudur. Modelin
     yorumladigi cumle de onay bekler — sayiyi model okudu. */

  describe('Öneri — seviye', () => {
    it('her eylemin geçerli bir seviyesi vardır', () => {
      SP.Proposals.katalogIdleri().forEach(id => {
        expect(['kucuk', 'orta', 'buyuk'].indexOf(SP.Proposals.eylem(id).level) >= 0).toBeTruthy();
      });
    });

    it('tahlil girişi orta seviyedir', () => {
      expect(SP.Proposals.eylem('olcum-gir').level).toBe('orta');
      expect(SP.Proposals.eylem('vital-yaz').level).toBe('kucuk');
    });

    it('seviye öneriye katalogdan yazılır', async () => {
      resetState();
      const p = await SP.Proposals.propose({ action:'olcum-gir', level:'kucuk',
        params:{ rows:[{ markerId:'ldl', value:120 }], date:'2026-03-01' }, kaynak:'rules' });
      expect(p.level).toBe('orta');
    });
  });

  describe('Öneri — otomatik uygulama', () => {
    it('karar tablosu', () => {
      const P = SP.Proposals;
      expect(P.otomatikMi({ level:'kucuk', source:'istek' }, 'istek')).toBe(true);
      expect(P.otomatikMi({ level:'kucuk', source:'model' }, 'istek')).toBe(false);
      expect(P.otomatikMi({ level:'kucuk', source:'model' }, 'hepsi')).toBe(true);
      expect(P.otomatikMi({ level:'kucuk', source:'istek' }, 'hicbiri')).toBe(false);
      expect(P.otomatikMi({ level:'orta', source:'istek' }, 'hepsi')).toBe(false);
      expect(P.otomatikMi({ level:'kucuk', source:'model' }, 'bozuk')).toBe(false);
    });

    /* KR-1: ölçüm yazan eylem kullanıcının kendi cümlesinden gelse de
       sormadan yazılmaz; onaydan sonra yazılır ve geri alınır. */
    it('kullanıcının kendi ölçüm cümlesi onay bekler; onayla yazılır, geri alınır', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        const r = SP.Proposals.fromText('uyku 7,5 saat');
        const t = await SP.Proposals.talep(Object.assign({ source:'istek' }, r.oneriler[0]));
        expect(t.otomatik).toBe(false);
        expect(t.row.status).toBe('pending');
        const v0 = SP.Model.vitalsOf('2026-03-01');
        expect(v0 == null || v0.sleep == null).toBeTruthy();
        expect((await SP.Proposals.approve(t.row.id)).ok).toBe(true);
        expect(SP.Model.vitalsOf('2026-03-01').sleep).toBe(7.5);
        await SP.Proposals.undo(t.row.id);
        const v = SP.Model.vitalsOf('2026-03-01');
        expect(v == null || v.sleep == null).toBeTruthy();
      });
    });

    it('ölçüm yazan eylem hiçbir ayarda otomatik değildir', () => {
      const P = SP.Proposals;
      ['vital-yaz', 'ogun-ekle', 'seans-ekle', 'olcum-gir', 'semptom-isaretle'].forEach(a => {
        expect(P.eylem(a).olcum).toBe(true);
        ['istek', 'hepsi', 'hicbiri', undefined].forEach(m => {
          expect([a, m, P.otomatikMi({ level:'kucuk', source:'istek', action:a }, m)])
            .toEqual([a, m, false]);
        });
      });
    });

    it('tahlil değeri istense de onay bekler', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        const t = await SP.Proposals.talep({ action:'olcum-gir', source:'istek', kaynak:'rules',
          params:{ rows:[{ markerId:'ldl', value:120 }], date:'2026-03-01' } });
        expect(t.otomatik).toBe(false);
        expect(t.row.status).toBe('pending');
        expect((SP.S.labs || []).length).toBe(0);
      });
    });

    it('«hiçbiri» ayarında küçük kayıt da onay bekler', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        await SP.Office.saveSettings({ otomatikUygula:'hicbiri' });
        const r = SP.Proposals.fromText('nabız 58');
        const t = await SP.Proposals.talep(Object.assign({ source:'istek' }, r.oneriler[0]));
        expect(t.otomatik).toBe(false);
        const v = SP.Model.vitalsOf('2026-03-01');
        expect(v == null || v.rhr == null).toBeTruthy();
      });
    });

    it('geçersiz talep hiçbir şey yazmaz', async () => {
      resetState();
      const t = await SP.Proposals.talep({ action:'vital-yaz', source:'istek',
        params:{ field:'yok', value:1, date:'2026-03-01' } });
      expect(t.row).toBe(null);
      expect(SP.Proposals.all()).toHaveLength(0);
    });

    it('aynı anahtar ikinci kez kuyruğa girmez', async () => {
      resetState();
      const p = { action:'vital-yaz', anahtar:'hkm:teklif:7',
        params:{ field:'sleep', value:7, date:'2026-03-01' }, kaynak:'rules' };
      expect(await SP.Proposals.propose(p)).toBeTruthy();
      expect(await SP.Proposals.propose(p)).toBe(null);
    });
  });
  /* ==================== olumsuzluk (HATALAR KR-1) ====================

     «7 saat uyumadım» 420 dakikalık serbest antrenman, «2 bardak su
     içmedim» 400 ml su oluyordu. Olumsuz, ileriye dönük ya da istek
     kipindeki cümle ölçüm diye yazılmaz: nedeniyle birlikte sorulur. */

  describe('Öneri — olumsuzluk ve kip (KR-1)', () => {
    it('olumsuz ölçüm cümlesi öneri üretmez, nedeni döner', () => {
      [['7 saat uyumadım', 'uyumadım'], ['30 dakika yürümedim', 'yürümedim'],
        ['2 bardak su içmedim', 'içmedim'], ['uyku 7 saat değil', 'değil'],
        ['45 dakika koşamadım', 'koşamadım']]
        .forEach(([m, k]) => {
          const r = SP.Proposals.fromText(m);
          expect([m, r.oneriler.length]).toEqual([m, 0]);
          expect(r.anlasilmayan).toHaveLength(0);
          expect(r.engellenen).toHaveLength(1);
          expect(r.engellenen[0].kelime).toBe(k);
          expect(r.engellenen[0].soru).toContain('ölçüm');
        });
    });

    it('ileriye dönük ve istek kipindeki cümle yazılmaz', () => {
      ['yarın 30 dakika yürüyeceğim', '8 saat uyumak istiyorum', 'hedefim 2 litre su']
        .forEach(m => {
          const r = SP.Proposals.fromText(m);
          expect([m, r.oneriler.length]).toEqual([m, 0]);
        });
    });

    it('olumlu cümle eskisi gibi anlaşılır; bileşikte yalnız olumsuz parça düşer', () => {
      expect(SP.Proposals.fromText('7 saat uyudum').oneriler).toHaveLength(1);
      expect(SP.Proposals.fromText('bacak antrenmanı 45 dakika').engellenen).toHaveLength(0);
      const r = SP.Proposals.fromText('7 saat uyudum ve 30 dakika yürümedim');
      expect(r.oneriler.map(o => o.action)).toEqual(['vital-yaz']);
      expect(r.engellenen).toHaveLength(1);
    });

    it('uçtan uca: olumsuz cümle hiçbir şey yazmaz, rozet ve XP doğmaz', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        const r = SP.Proposals.fromText('7 saat uyumadım');
        for(const o of r.oneriler) await SP.Proposals.talep(Object.assign({ source:'istek' }, o));
        expect(SP.Proposals.all()).toHaveLength(0);
        expect((SP.S.sessions || []).length).toBe(0);
        const v = SP.Model.vitalsOf('2026-03-01');
        expect(v == null || v.sleep == null).toBeTruthy();
      });
    });
  });
  /* ==================== geri alma: sıra (HATALAR Y-6) ====================

     «uyku 7» sonra «uyku 7,5» girilip ilki geri alınınca uyku boşalıyordu:
     geri alma eski değeri mutlak yazıyordu. Geri alma yalnız O kaydın
     yazdığını geri çevirir; sonraki kaydı ve elle düzenlemeyi ezmez. */

  describe('Öneri — geri alma sırası (Y-6)', () => {
    const G = '2026-03-01';
    async function yaz(action, params){
      const row = await SP.Proposals.propose({ action, source:'istek', kaynak:'rules',
        params:Object.assign({ date:G }, params) });
      expect((await SP.Proposals.approve(row.id)).ok).toBe(true);
      return row;
    }
    const uyku = () => { const v = SP.Model.vitalsOf(G); return v ? v.sleep : null; };

    it('değer yazan kayıt: sonraki değeri ezmez, geri alınmış değer dirilmez', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        const a = await yaz('vital-yaz', { field:'sleep', value:7 });
        const b = await yaz('vital-yaz', { field:'sleep', value:7.5 });
        await SP.Proposals.undo(a.id);
        expect(uyku()).toBe(7.5);
        await SP.Proposals.undo(b.id);
        expect(uyku() == null).toBe(true);
        const c = await yaz('vital-yaz', { field:'sleep', value:7 });
        const e = await yaz('vital-yaz', { field:'sleep', value:7 });
        await SP.Proposals.undo(c.id);
        expect(uyku()).toBe(7);
        await SP.Proposals.undo(e.id);
        expect(uyku() == null).toBe(true);
      });
    });

    it('sonradan elle yapılan düzenleme silinmez', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        const a = await yaz('vital-yaz', { field:'sleep', value:7 });
        await SP.Model.saveVitals(G, { sleep:8 });
        await SP.Proposals.undo(a.id);
        expect(uyku()).toBe(8);
      });
    });

    it('şikâyet şiddeti de aynı kurala uyar', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        const id = SP.SYMPTOMS[0].id;
        const a = await yaz('semptom-isaretle', { symptomId:id, severity:1 });
        const b = await yaz('semptom-isaretle', { symptomId:id, severity:3 });
        await SP.Proposals.undo(a.id);
        expect(SP.Symptom.ofDay(G)[id]).toBe(3);
        await SP.Proposals.undo(b.id);
        expect(SP.Symptom.ofDay(G)[id] || 0).toBe(0);
      });
    });
  });

  /* DIŞARIDAN GELEN SATIR (hesap gelen kutusu; sistem/hesap.py söz 16):
     iPhone Kısayollar ya da Apple Sağlık otomasyonu «su 250» gönderir. */
  describe('Öneri — dışarıdan gelen satır (Kısayollar)', () => {
    it('satır Onaylar’a öneri olur, ONAYSIZ yazılmaz; gün gönderildiği gün; aynı satır iki kez öneri olmaz', async () => {
      resetState();
      await withTodayAsync('2026-03-02', async () => {
        const dun = new Date(2026, 2, 1, 23, 50).getTime();
        const r = await SP.Proposals.disaridan({ id:41, metin:'su 250', kaynak:'iPhone Kısayollar', zaman:dun });
        expect(r.durum).toBe('onayda');
        const p = SP.Proposals.pending();
        expect(p).toHaveLength(1);
        expect(p[0].params.date).toBe('2026-03-01');                    // 23:50'de gönderildi: dünün suyu
        expect(p[0].params.value).toBe(250);
        expect(p[0].reason).toContain('iPhone Kısayollar');
        expect(p[0].otomatik).toBe(false);
        const v = SP.Model.vitalsOf('2026-03-01');
        expect(v == null || v.water == null).toBeTruthy();               // onaysız yazılmadı
        const r2 = await SP.Proposals.disaridan({ id:41, metin:'su 250', kaynak:'iPhone Kısayollar', zaman:dun });
        expect(r2.durum).toBe('onayda');
        expect(SP.Proposals.pending()).toHaveLength(1);                  // yeniden verilen satır ikinci öneri olmaz
        /* Onaylar kartı nereden geldiğini ve gününü söyler («yalnız bugün» değil). */
        const on = String(await SP.Screens.onaylar.render());
        expect(on.indexOf('Kısayollar’dan (iPhone Kısayollar)') >= 0).toBe(true);
        expect(on.indexOf('yalnız dün') >= 0).toBe(true);
        expect((await SP.Proposals.approve(p[0].id)).ok).toBeTruthy();
        expect(SP.Model.vitalsOf('2026-03-01').water).toBe(250);
      });
    });

    it('anlaşılmayan ya da ölçüm olmayan satır öneri olmaz, nedeni söylenir; ileri tarih bugüne iner', async () => {
      resetState();
      await withTodayAsync('2026-03-02', async () => {
        expect((await SP.Proposals.disaridan({ id:42, metin:'merhaba dünya', zaman:Date.now() })).durum).toBe('anlasilmadi');
        const r = await SP.Proposals.disaridan({ id:43, metin:'7 saat uyumadım', zaman:Date.now() });
        expect(r.durum).toBe('anlasilmadi');
        expect(r.sonuc.length > 0).toBeTruthy();
        expect(SP.Proposals.pending()).toHaveLength(0);
        await SP.Proposals.disaridan({ id:44, metin:'kilo 72,4', zaman:new Date(2026, 2, 9, 9).getTime() });
        expect(SP.Proposals.pending()[0].params.date).toBe('2026-03-02');
      });
    });
  });
})();

/* HIZLI GİRİŞ — daha az sürtünme (2026-10-25). Kullanıcı: «spi için daha
   işlevli veri girişi, sürtünmeyi azaltacak teknikler ile daha güzel yap».
   Her bulgu önce bu testlerle yakalandı:
     · «2 bardak su içtim» günün 1000 ml'sinin ÜSTÜNE 400 yazıyordu;
     · «7 saat 30 dk uyudum» 420 dakikalık seans, «7 buçuk saat» hiç;
     · «bel 84», «ateş 37,8», «spo2 97» tahlil oturumu açıyordu, «tansiyon
       120/80» hiç okunmuyordu;
     · «başım ağrıyor», «şikâyetim yok» anlaşılmıyordu;
     · «dün 2 bardak su» bugüne, «kahvaltıda 2 yumurta» saatin öğününe;
     · hazır öğün / antrenman paletten ve iPhone gelen kutusundan bulunmuyordu. */
(function(){
  const { describe, it, expect, resetState, withToday, withTodayAsync, pushVitals, pushMeal, pushWorkout } = SP.Test;
  const U = SP.U, Q = () => SP.Quick, P = () => SP.Proposals;
  const G = '2026-03-10', DUN = '2026-03-09';

  async function onayla(o){
    const row = await P().propose(Object.assign({ source:'istek' }, o));
    const r = await P().approve(row.id);
    expect([r.ok, r.why || null]).toEqual([true, null]);
    return row;
  }
  const su = d => { const v = SP.Model.vitalsOf(d); return v ? v.water : null; };

  describe('Hızlı giriş — su toplanır, üstüne yazılmaz', () => {
    it('bir bardak tek sabittir: 250 ml', () => {
      expect(Q().BARDAK_ML).toBe(250);
    });

    it('1000 ml varken «2 bardak su içtim» 1500 yazar; önizleme ne yazacağını söyler', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        pushVitals(G, { water:1000 });
        const r = P().fromText('2 bardak su içtim');
        expect(r.oneriler).toHaveLength(1);
        expect([r.oneriler[0].params.value, r.oneriler[0].params.ekle]).toEqual([500, true]);
        const pv = P().preview(r.oneriler[0]);
        expect(pv.ok).toBe(true);
        expect(pv.rows[0].sonra).toBe('+500 ml · toplam ' + U.fmtNum(1500) + ' ml');
        await onayla(r.oneriler[0]);
        expect(su(G)).toBe(1500);
      });
    });

    it('boş günde «8 bardak su» 2000 yazar', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        await onayla(P().fromText('8 bardak su').oneriler[0]);
        expect(su(G)).toBe(2000);
      });
    });

    it('Bugün kutusu da toplar ve önizlemesi «Su +500 ml · toplam …» der', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        pushVitals(G, { water:1000 });
        const p = Q().parse('2 bardak su içtim');
        expect(Q().onizleme(p)).toBe('Su +500 ml · toplam ' + U.fmtNum(1500) + ' ml');
        await Q().apply(p);
        expect(su(G)).toBe(1500);
      });
    });

    /* HATA (2026-10-25): «kahvaltıda 2 yumurta 1 çay, öğlen 1 tabak mercimek
       çorbası» Bugün kutusunda tek öğüne birleşiyor, çay düşüyor, hepsi
       kahvaltıya yazılıyordu. Öğün sözü olan parçalar kendi öğününe yazılır. */
    it('Bugün kutusu öğün sözlerini ayrı öğün yazar, öğe düşürmez', async () => {
      resetState();
      /* Öğün sözü besinden önce ayrılır: «1 çay» sözün ardında düşüyordu. */
      const tek = Q().parse('kahvaltıda 2 yumurta 1 çay');
      expect(tek.data.items.length).toBe(2);
      expect(tek.data.slot).toBe('kahvalti');
      /* Ortak giriş testleri kutuyu sıfırlar: SPİ'nin gerçek kurulumu geri gelir. */
      SP.App.girisKur();
      await withTodayAsync(G, async () => {
        const p = window.LIFEOS.GIRIS.onizle('kahvaltıda 2 yumurta 1 çay, öğlen 1 tabak mercimek çorbası');
        expect(p && p.parcalar && p.parcalar.length).toBe(2);
        await p.kaydet();
        const ogun = SP.S.meals[G] || [];
        expect(ogun.map(m => m.slot).sort()).toEqual(['kahvalti', 'ogle']);
        const adlar = JSON.stringify(ogun.map(m => (m.items || []).map(i => (SP.FOOD_BY_ID[i.foodId] || {}).name || i.foodId)));
        expect(/çay/i.test(adlar)).toBe(true);
      });
    });

    it('geri alma yalnız o eklemeyi çıkarır; sıra fark etmez, elle düzenleme ezilmez', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        const a = await onayla(P().fromText('su 250 ml').oneriler[0]);
        const b = await onayla(P().fromText('su 500 ml').oneriler[0]);
        expect(su(G)).toBe(750);
        await P().undo(a.id);
        expect(su(G)).toBe(500);
        await P().undo(b.id);
        expect(su(G) == null).toBe(true);
        const c = await onayla(P().fromText('su 250 ml').oneriler[0]);
        await SP.Model.saveVitals(G, { water:1200 });
        await P().undo(c.id);
        expect(su(G)).toBe(1200);
      });
    });

    /* Onaylar ajanından devir (2026-10-25): gelen kutusundaki «su 250»
       değer olarak yazılıyordu; beş satır onaylanınca gün 250 ml kalıyordu. */
    it('iPhone gelen kutusundan iki «su 250» onaylanınca toplam +500; geri alma önceki toplamı verir', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        pushVitals(G, { water:1000 });
        await P().disaridan({ id:71, metin:'su 250', kaynak:'iPhone', zaman:Date.now() });
        await P().disaridan({ id:72, metin:'su 250', kaynak:'iPhone', zaman:Date.now() });
        const l = P().pending().slice().reverse();
        expect(l).toHaveLength(2);
        expect(P().preview(l[0]).rows[0].sonra).toBe('+250 ml · toplam ' + U.fmtNum(1250) + ' ml');
        for(const x of l) expect((await P().approve(x.id)).ok).toBe(true);
        expect(su(G)).toBe(1500);
        await P().undo(l[1].id);
        expect(su(G)).toBe(1250);
        await P().undo(l[0].id);
        expect(su(G)).toBe(1000);
        /* kilo değer olarak kalır */
        await P().disaridan({ id:73, metin:'kilo 72,4', kaynak:'iPhone', zaman:Date.now() });
        expect(P().pending()[0].params.ekle).toBeUndefined();
      });
    });

    it('toplam alanın üst sınırını geçerse yazılmaz', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        pushVitals(G, { water:9900 });
        const pv = P().preview(P().fromText('su 500 ml').oneriler[0]);
        expect(pv.ok).toBe(false);
      });
    });

    /* HATA (2026-10-25): mutlak su kaydının (King, model ya da eski öneri)
       ardından iki ekleme gelince ilkinin geri alınması yalnız ilk eklemeyi
       düzeltiyordu; ikinci ekleme son yazılan olduğu için hiçbir şey
       yazılmıyor, sonraki geri almalar yanlış toplama dönüyordu. */
    async function mutlakArtiIki(){
      const a = await onayla({ action:'vital-yaz', params:{ field:'water', value:1000, date:G } });
      const b = await onayla(P().fromText('su 250').oneriler[0]);
      const c = await onayla(P().fromText('su 250').oneriler[0]);
      expect(su(G)).toBe(1500);
      return [a, b, c];
    }

    it('mutlak 1000 + iki «su 250»: 1, 3, 2 sırasıyla geri alma 500, 250, boş verir', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        const [a, b, c] = await mutlakArtiIki();
        await P().undo(a.id);
        expect(su(G)).toBe(500);
        await P().undo(c.id);
        expect(su(G)).toBe(250);
        await P().undo(b.id);
        expect(su(G) == null).toBe(true);
      });
    });

    it('mutlak 1000 + iki «su 250»: ters sırayla geri alma 1250, 1000, boş verir', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        const [a, b, c] = await mutlakArtiIki();
        await P().undo(c.id);
        expect(su(G)).toBe(1250);
        await P().undo(b.id);
        expect(su(G)).toBe(1000);
        await P().undo(a.id);
        expect(su(G) == null).toBe(true);
      });
    });

    it('gün 0 ml ile başladıysa geri alma 0\'a döner, boşa değil (2, 1, 3)', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        pushVitals(G, { water:0 });
        const [a, b, c] = await mutlakArtiIki();
        await P().undo(b.id);
        expect(su(G)).toBe(1250);
        await P().undo(a.id);
        expect(su(G)).toBe(250);
        await P().undo(c.id);
        expect(su(G)).toBe(0);
      });
    });
  });

  describe('Hızlı giriş — uyku söyleyişleri', () => {
    it('«7 saat 30 dk», «7,5 saat», «7 buçuk saat» uyku 7,5 olur; seans ya da kısa uyku değil', () => {
      ['7 saat 30 dk uyudum', '7,5 saat uyudum', '7 buçuk saat uyudum', 'uyku 7 saat 30 dakika', '7 saat 30 dakika uyudum']
        .forEach(t => {
          const p = Q().parse(t);
          expect([t, p && p.kind, p && p.data.field && p.data.field.id, p && p.data.value]).toEqual([t, 'vital', 'sleep', 7.5]);
          expect([t, P().fromText(t).oneriler.map(o => o.action)]).toEqual([t, ['vital-yaz']]);
        });
    });

    it('olumsuz söyleyiş yine yazılmaz', () => {
      ['7 buçuk saat uyumadım', '7 saat 30 dk uyumadım'].forEach(t => {
        const r = P().fromText(t);
        expect([t, r.oneriler.length, r.engellenen.length]).toEqual([t, 0, 1]);
        expect(r.engellenen[0].neden).toBe('olumsuz');
      });
    });
  });

  describe('Hızlı giriş — vücut ölçüleri ve yaşamsal ölçümler günlüğe yazılır', () => {
    const vital = t => { const p = Q().parse(t); return p && p.kind === 'vital' ? [p.data.field.id, p.data.value] : [p && p.kind, null]; };
    it('bel, yağ oranı, boyun, kalça günlük ölçümdür, tahlil değil', () => {
      expect(Q().parse('bel 84').kind).toBe('vital');
      expect(vital('bel 84')).toEqual(['waist', 84]);
      expect(vital('yağ oranı 18,5')).toEqual(['bodyfat', 18.5]);
      expect(vital('boyun 38')).toEqual(['neck', 38]);
      expect(vital('kalça 98')).toEqual(['hip', 98]);
    });

    it('ateş ve oksijen günlük ölçümdür', () => {
      expect(vital('ateş 37,8')).toEqual(['temp', 37.8]);
      expect(vital('spo2 97')).toEqual(['spo2', 97]);
      expect(vital('oksijen 96')).toEqual(['spo2', 96]);
    });

    it('«tansiyon 120/80» büyük 120, küçük 80 olarak iki ölçüm', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        const r = P().fromText('tansiyon 120/80');
        expect(r.oneriler.map(o => [o.action, o.params.field, o.params.value]))
          .toEqual([['vital-yaz', 'sbp', 120], ['vital-yaz', 'dbp', 80]]);
        for(const o of r.oneriler) await onayla(o);
        const v = SP.Model.vitalsOf(G);
        expect([v.sbp, v.dbp]).toEqual([120, 80]);
        /* Bugün kutusu: tek önizleme, iki alan */
        await SP.Model.saveVitals(G, { sbp:null, dbp:null });
        const p = Q().parse('tansiyonum 118/76');
        expect(p.label).toBe('Tansiyon 118/76 mmHg');
        await Q().apply(p);
        expect([SP.Model.vitalsOf(G).sbp, SP.Model.vitalsOf(G).dbp]).toEqual([118, 76]);
      });
    });

    it('ters ya da sınır dışı tansiyon yazılmaz; sayı değiştirilmez', () => {
      expect(vital('tansiyon 80/120')[0] === 'sbp').toBe(false);
      expect(P().fromText('tansiyon 80/120').oneriler).toHaveLength(0);
      expect(P().fromText('tansiyon 12/8').oneriler).toHaveLength(0);
    });
  });

  describe('Hızlı giriş — şikâyet işaretleme (teşhis yok)', () => {
    it('«baş ağrısı orta» semptom-isaretle olur, şiddet 2', () => {
      const a = P().quickToAction(Q().parse('baş ağrısı orta'), G);
      expect([a.action, a.params.symptomId, a.params.severity, a.params.date]).toEqual(['semptom-isaretle', 'bas-agrisi', 2, G]);
      expect(P().quickToAction(Q().parse('hafif başım dönüyor'), G).params).toEqual({ symptomId:'bas-donmesi', severity:1, date:G });
      expect(P().quickToAction(Q().parse('şiddetli kramp'), G).params.severity).toBe(3);
    });

    it('«başım ağrıyor»: şikâyet tanınır ama şiddet tahmin edilmez; «şiddet belirtilmedi» denir', () => {
      const a = P().quickToAction(Q().parse('başım ağrıyor'), G);
      expect([a.action, a.params.symptomId, a.params.severity]).toEqual(['semptom-isaretle', 'bas-agrisi', null]);
      const c = P().check(a);
      expect(c.ok).toBe(false);
      expect(c.why).toContain('Şiddet belirtilmedi');
      const r = P().fromText('başım ağrıyor');
      expect(r.oneriler).toHaveLength(0);
      expect(r.anlasilmayan).toHaveLength(1);
      expect(r.anlasilmayan[0]).toContain('şiddet belirtilmedi');
      /* bileşikte anlaşılan parça kaybolmaz */
      const b = P().fromText('başım ağrıyor ve 2 bardak su içtim');
      expect(b.oneriler.map(o => o.action)).toEqual(['vital-yaz']);
      expect(b.anlasilmayan[0]).toContain('şiddet belirtilmedi');
    });

    it('şiddeti söylenen şikâyet onayla yazılır ve geri alınır', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        const r = P().fromText('baş ağrısı orta');
        expect(r.oneriler.map(o => o.action)).toEqual(['semptom-isaretle']);
        const row = await onayla(r.oneriler[0]);
        expect(SP.Symptom.ofDay(G)['bas-agrisi']).toBe(2);
        expect(SP.Model.vitalsOf(G).symptomsLogged).toBe(true);
        await P().undo(row.id);
        expect(SP.Symptom.ofDay(G)['bas-agrisi'] || 0).toBe(0);
      });
    });

    it('«şikâyetim yok» engellenmez: günü «şikâyet yok» işaretler, geri alınır', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        const p = Q().parse('şikâyetim yok');
        expect(p && p.kind).toBe('symptom');
        const a = P().quickToAction(p, G);
        expect([a.action, a.params.yok]).toEqual(['semptom-isaretle', true]);
        const r = P().fromText('şikâyetim yok');
        expect([r.oneriler.length, r.engellenen.length]).toEqual([1, 0]);
        const row = await onayla(r.oneriler[0]);
        const v = SP.Model.vitalsOf(G);
        expect([v.symptomsLogged, Object.keys(v.symptoms || {}).length]).toEqual([true, 0]);
        await P().undo(row.id);
        expect(!!(SP.Model.vitalsOf(G) || {}).symptomsLogged).toBe(false);
      });
    });

    it('olumsuz şikâyet cümlesi ve «yarın şikâyetim yok» yazılmaz', () => {
      expect(P().fromText('başım ağrımıyor').oneriler).toHaveLength(0);
      expect(P().fromText('yarın şikâyetim yok').engellenen).toHaveLength(1);
    });

    it('her şikâyetin Türkçe takma adı vardır', () => {
      SP.SYMPTOMS.forEach(s => expect([s.id, Array.isArray(s.aliases) && s.aliases.length > 0]).toEqual([s.id, true]));
    });
  });

  describe('Hızlı giriş — gün ve öğün sözleri', () => {
    it('«dün 2 bardak su» düne yazılır; «yarın» engellenir', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        const r = P().fromText('dün 2 bardak su');
        expect(r.oneriler[0].params.date).toBe(DUN);
        await onayla(r.oneriler[0]);
        expect(su(DUN)).toBe(500);
        expect(su(G) == null).toBe(true);
        expect(P().fromText('yarın 2 bardak su').engellenen).toHaveLength(1);
      });
    });

    it('Bugün kutusu da düne yazar', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        const p = Q().parse('dün 2 bardak su');
        expect(Q().tarih(p)).toBe(DUN);
        await Q().apply(p);
        expect(su(DUN)).toBe(500);
        expect(su(G) == null).toBe(true);
      });
    });

    it('«dün gece 7 saat uyudum» bugünün gece uykusudur; gün sözü bileşik cümlede sürer', () => {
      withToday(G, () => {
        expect(P().fromText('dün gece 7 saat uyudum').oneriler[0].params.date).toBe(G);
        expect(P().fromText('dün 30 dakika yürüdüm ve 2 bardak su içtim').oneriler.map(o => o.params.date)).toEqual([DUN, DUN]);
        expect(P().fromText('dün 30 dakika yürüdüm, bugün 2 bardak su içtim').oneriler.map(o => o.params.date)).toEqual([DUN, G]);
      });
    });

    it('öğün sözü öğünü belirler: kahvaltı, öğle, akşam, ara öğün', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        const slot = t => P().fromText(t).oneriler[0].params.slot;
        expect(slot('kahvaltıda 2 yumurta')).toBe('kahvalti');
        expect(slot('öğlen mercimek çorbası')).toBe('ogle');
        expect(slot('akşam yemeğinde 200 gram tavuk')).toBe('aksam');
        expect(/^ara/.test(slot('ara öğün elma'))).toBe(true);
        await Q().apply(Q().parse('kahvaltıda 2 yumurta'));
        expect(SP.Model.mealsOf(G)[0].slot).toBe('kahvalti');
      });
    });
  });

  describe('Hızlı giriş — hazır öğün ve antrenman paletten ve gelen kutusundan', () => {
    it('hazır öğün adıyla öneri olur, onayla eklenir, geri alınır', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        const m = pushMeal('2026-03-01', 'kahvalti', [['yumurta', 110, 'measured']]);
        await SP.Hazir.ogunSakla(m, 'Menemen tabağı');
        const r = P().fromText('menemen tabağımı yedim');
        expect(r.oneriler.map(o => [o.action, o.params.tur])).toEqual([['hazir-ekle', 'ogun']]);
        expect(P().preview(r.oneriler[0]).ok).toBe(true);
        const row = await onayla(r.oneriler[0]);
        expect(SP.Model.mealsOf(G).map(x => x.note)).toEqual(['Menemen tabağı']);
        await P().undo(row.id);
        expect(SP.Model.mealsOf(G)).toHaveLength(0);
        /* gün sözü burada da geçer */
        expect(P().fromText('dün menemen tabağımı yedim').oneriler[0].params.date).toBe(DUN);
      });
    });

    it('hazır antrenman adıyla öneri olur', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        const w = pushWorkout('2026-03-01', { name:'Bacak', minutes:50 });
        await SP.Hazir.antrenmanSakla(w, 'Bacak günü');
        const r = P().fromText('bacak günümü yaptım');
        expect(r.oneriler.map(o => [o.action, o.params.tur])).toEqual([['hazir-ekle', 'antrenman']]);
        const once = SP.Model.workoutsOf(G).length;
        await onayla(r.oneriler[0]);
        expect(SP.Model.workoutsOf(G).length).toBe(once + 1);
      });
    });

    it('iPhone gelen kutusundaki hazır öğün Onaylar’a öneri olur, onaysız yazılmaz', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        const m = pushMeal('2026-03-01', 'kahvalti', [['yumurta', 110, 'measured']]);
        await SP.Hazir.ogunSakla(m, 'Menemen tabağı');
        const r = await P().disaridan({ id:61, metin:'menemen tabağımı yedim', kaynak:'iPhone', zaman:Date.now() });
        expect(r.durum).toBe('onayda');
        expect(P().pending().map(x => x.action)).toEqual(['hazir-ekle']);
        expect(SP.Model.mealsOf(G)).toHaveLength(0);
      });
    });
  });

  /* Tahliller ajanından devir (2026-10-25): hızlı giriş parseLab satırını
     `skip`/`mismatch`e bakmadan yazıyordu; tanınmayan birimdeki sayı
     kanonik birimin altına sessizce giriyordu. Yol SP.Parse.rowsToSave. */
  describe('Hızlı giriş — birimi uyuşmayan tahlil sessizce yazılmaz', () => {
    it('«ferritin 28 qux/zud» kutudan ve paletten ferritin yazmaz; neden söylenir', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        const p = Q().parse('ferritin 28 qux/zud');
        if(p){
          const r = await Q().apply(p);
          expect(r.ok).toBe(false);
        }
        expect((SP.S.labs || []).some(l => l.values && l.values.ferritin)).toBe(false);
        const f = P().fromText('ferritin 28 qux/zud');
        expect(f.oneriler).toHaveLength(0);
        expect(f.anlasilmayan).toHaveLength(1);
        expect(f.anlasilmayan[0]).toContain('birimi uyuşmuyor');
        /* birimi uyan satır eskisi gibi */
        expect(P().fromText('ferritin 28 ng/ml').oneriler.map(o => o.action)).toEqual(['olcum-gir']);
      });
    });
  });

  /* Kısa yol şeridinde en çok kullanılan üç hazır kayıt (2026-10-25). Şerit
     hiçbir şey yazmaz (kisayol.js söz 5): çip kutuyu «… yedim / yaptım»
     diye doldurur, kayıt yine önizleme + Kaydet ile. Şeritteki modül
     düğmesi beşi geçmez: Bugün'ün 14 düğme bütçesi büyümez. */
  describe('Hızlı giriş — hazır kayıt kısa yolları', () => {
    it('hazır yoksa şerit eskisi gibi; varsa en çok kullanılan üçü önde, toplam beş', async () => {
      resetState();
      await withTodayAsync(G, async () => {
        expect(SP.App.kisayolDugmeleri().map(d => d.ad)).toEqual(['Uyku', 'Kilo', 'Öğün', 'Hareket', 'Testler']);
        const m = pushMeal('2026-03-01', 'kahvalti', [['yumurta', 110]]);
        for(const ad of ['Az kullanılan', 'Menemen tabağı', 'Yulaf kasesi', 'Ton salatası']) await SP.Hazir.ogunSakla(m, ad);
        /* kaynak seans 30 günlük pencerenin dışında: yalnız eklenen sayılır */
        const w = pushWorkout('2026-01-01', { name:'Bacak', minutes:50 });
        await SP.Hazir.antrenmanSakla(w, 'Bacak günü');
        const kullan = async (id, n) => { for(let i = 0; i < n; i++) await SP.Hazir.ogunEkle(id, U.iso(U.addDays(U.parse(G), -i))); };
        const id = ad => SP.Hazir.ogunler().find(x => x.ad === ad).id;
        await kullan(id('Menemen tabağı'), 3);
        await kullan(id('Yulaf kasesi'), 2);
        await SP.Hazir.antrenmanEkle(SP.Hazir.antrenmanlar()[0].id, G);
        const l = SP.App.kisayolDugmeleri();
        expect(l).toHaveLength(5);
        expect(l.slice(0, 2).map(d => d.ad)).toEqual(['Uyku', 'Kilo']);
        expect(l.slice(2).map(d => d.doldur)).toEqual(['Menemen tabağı yedim', 'Yulaf kasesi yedim', 'Bacak günü yaptım']);
        /* doldurulan cümle hazırı gerçekten bulur */
        l.slice(2).forEach(d => expect(!!SP.Hazir.bul(d.doldur)).toBe(true));
      });
    });
  });

  describe('Hızlı giriş — Enter ölçüm formunu kaydeder', () => {
    it('Bugün ölçüm alanında Enter save-vitals eylemine bağlıdır', async () => {
      expect(SP.App.enterEylemi('v-sleep')).toBe('save-vitals');
      expect(SP.App.enterEylemi('v-water')).toBe('save-vitals');
      expect(SP.App.enterEylemi('v-note')).toBe(null);
      resetState();
      const gercek = SP.App.render;
      SP.App.render = () => {};
      const el = document.createElement('input');
      el.id = 'v-sleep'; el.type = 'number'; el.defaultValue = ''; el.value = '7';
      document.body.appendChild(el);
      try{
        await withTodayAsync(G, async () => {
          el.dispatchEvent(new KeyboardEvent('keydown', { key:'Enter', bubbles:true, cancelable:true }));
          await new Promise(r => setTimeout(r, 30));
          expect((SP.Model.vitalsOf(G) || {}).sleep).toBe(7);
        });
      }finally{ el.remove(); SP.App.render = gercek; }
    });
  });
})();
