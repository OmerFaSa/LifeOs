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

    it('katalog tarifi her eylemi sayar', () => {
      const t = SP.Proposals.catalogPrompt();
      SP.Proposals.katalogIdleri().forEach(id => {
        expect(t.indexOf(id) >= 0).toBeTruthy();
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
